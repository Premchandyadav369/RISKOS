//! RISKOS High-Performance Quantitative Trading Core in Rust
//! Exposes sub-microsecond matching, SIMD European options pricing, convex simplex projection, and Hawkes point processes.
//! Compatible with WebAssembly (WASM) and native C FFI.

pub mod matching_engine;
pub mod black_scholes_simd;
pub mod cvar_optimizer;
pub mod hawkes;
pub mod fix_engine;

pub use matching_engine::*;
pub use black_scholes_simd::*;
pub use cvar_optimizer::*;
pub use hawkes::*;
pub use fix_engine::*;

/// Return semantic version 0x020000 (v2.0.0)
#[no_mangle]
pub extern "C" fn riskos_version() -> u32 {
    0x020000
}

/// Extern "C" Black-Scholes single contract pricing with analytical Greeks
#[no_mangle]
pub extern "C" fn riskos_black_scholes(
    s: f64,
    k: f64,
    t: f64,
    r: f64,
    sigma: f64,
    is_call: i32,
    out_greeks: *mut OptionGreeks,
) -> i32 {
    if out_greeks.is_null() {
        return -1;
    }
    let greeks = price_black_scholes(s, k, t, r, sigma, is_call != 0);
    unsafe {
        *out_greeks = greeks;
    }
    0
}

/// Extern "C" SIMD vectorized batch Black-Scholes options pricer
#[no_mangle]
pub extern "C" fn riskos_batch_black_scholes(
    spots: *const f64,
    strikes: *const f64,
    maturities: *const f64,
    rates: *const f64,
    vols: *const f64,
    is_call: i32,
    count: usize,
    out_prices: *mut f64,
) -> usize {
    if spots.is_null() || strikes.is_null() || maturities.is_null() || rates.is_null() || vols.is_null() || out_prices.is_null() || count == 0 {
        return 0;
    }
    unsafe {
        let s_slice = std::slice::from_raw_parts(spots, count);
        let k_slice = std::slice::from_raw_parts(strikes, count);
        let t_slice = std::slice::from_raw_parts(maturities, count);
        let r_slice = std::slice::from_raw_parts(rates, count);
        let v_slice = std::slice::from_raw_parts(vols, count);
        let out_slice = std::slice::from_raw_parts_mut(out_prices, count);

        batch_price_options(s_slice, k_slice, t_slice, r_slice, v_slice, is_call != 0, out_slice);
    }
    count
}

/// Extern "C" Exact Euclidean Simplex Projection (Wang & Carreira-Perpinan 2013)
#[no_mangle]
pub extern "C" fn riskos_project_simplex(
    v: *const f64,
    n: usize,
    out_w: *mut f64,
) -> i32 {
    if v.is_null() || out_w.is_null() || n == 0 {
        return -1;
    }
    unsafe {
        let v_slice = std::slice::from_raw_parts(v, n);
        let out_slice = std::slice::from_raw_parts_mut(out_w, n);
        project_simplex(v_slice, out_slice);
    }
    0
}

/// Extern "C" Projected Gradient Descent Minimum Variance Portfolio Optimization
#[no_mangle]
pub extern "C" fn riskos_optimize_min_variance(
    cov_matrix: *const f64,
    n: usize,
    max_iter: usize,
    out_w: *mut f64,
) -> f64 {
    if cov_matrix.is_null() || out_w.is_null() || n == 0 {
        return -1.0;
    }
    unsafe {
        let cov_slice = std::slice::from_raw_parts(cov_matrix, n * n);
        let out_slice = std::slice::from_raw_parts_mut(out_w, n);
        optimize_minimum_variance(cov_slice, n, max_iter, out_slice)
    }
}

/// Extern "C" Create Hawkes Point Process instance
#[no_mangle]
pub extern "C" fn riskos_hawkes_create(mu: f64, alpha: f64, beta: f64) -> *mut HawkesProcess {
    let process = Box::new(HawkesProcess::new(mu, alpha, beta));
    Box::into_raw(process)
}

/// Extern "C" Destroy Hawkes Point Process instance
#[no_mangle]
pub extern "C" fn riskos_hawkes_destroy(ptr: *mut HawkesProcess) {
    if !ptr.is_null() {
        unsafe {
            drop(Box::from_raw(ptr));
        }
    }
}

/// Extern "C" Ingest event into Hawkes Process in O(1) time
#[no_mangle]
pub extern "C" fn riskos_hawkes_register_event(ptr: *mut HawkesProcess, t_sec: f64) -> f64 {
    if ptr.is_null() {
        return 0.0;
    }
    unsafe {
        (*ptr).register_event(t_sec)
    }
}

/// Extern "C" Extract Hawkes Metrics
#[no_mangle]
pub extern "C" fn riskos_hawkes_get_metrics(ptr: *const HawkesProcess, out_metrics: *mut HawkesMetrics) -> i32 {
    if ptr.is_null() || out_metrics.is_null() {
        return -1;
    }
    unsafe {
        *out_metrics = (*ptr).get_metrics();
    }
    0
}

/// Extern "C" Create Limit Order Book instance
#[no_mangle]
pub extern "C" fn riskos_book_create() -> *mut LimitOrderBook {
    let book = Box::new(LimitOrderBook::new());
    Box::into_raw(book)
}

/// Extern "C" Destroy Limit Order Book instance
#[no_mangle]
pub extern "C" fn riskos_book_destroy(ptr: *mut LimitOrderBook) {
    if !ptr.is_null() {
        unsafe {
            drop(Box::from_raw(ptr));
        }
    }
}

/// Extern "C" Insert Limit Order with immediate Price-Time matching
#[no_mangle]
pub extern "C" fn riskos_book_insert_limit(
    ptr: *mut LimitOrderBook,
    order_id: u64,
    price_ticks: u32,
    qty: u32,
    side: u32,
    timestamp_ns: u64,
    out_trades: *mut Trade,
    max_trades: usize,
) -> usize {
    if ptr.is_null() {
        return 0;
    }
    let order_side = if side == 1 { OrderSide::Buy } else { OrderSide::Sell };
    let trades = unsafe { (*ptr).insert_limit(order_id, order_side, price_ticks, qty, timestamp_ns) };
    
    let trade_count = trades.len().min(max_trades);
    if !out_trades.is_null() && trade_count > 0 {
        unsafe {
            std::ptr::copy_nonoverlapping(trades.as_ptr(), out_trades, trade_count);
        }
    }
    trades.len()
}

/// Extern "C" Cancel Order
#[no_mangle]
pub extern "C" fn riskos_book_cancel(ptr: *mut LimitOrderBook, order_id: u64) -> i32 {
    if ptr.is_null() {
        return 0;
    }
    unsafe {
        if (*ptr).cancel_order(order_id) { 1 } else { 0 }
    }
}

/// Extern "C" Best Bid
#[no_mangle]
pub extern "C" fn riskos_book_best_bid(ptr: *const LimitOrderBook) -> u32 {
    if ptr.is_null() {
        return 0;
    }
    unsafe {
        (*ptr).best_bid().unwrap_or(0)
    }
}

/// Extern "C" Best Ask
#[no_mangle]
pub extern "C" fn riskos_book_best_ask(ptr: *const LimitOrderBook) -> u32 {
    if ptr.is_null() {
        return 0;
    }
    unsafe {
        (*ptr).best_ask().unwrap_or(0)
    }
}

/// Extern "C" Spread
#[no_mangle]
pub extern "C" fn riskos_book_spread(ptr: *const LimitOrderBook) -> u32 {
    if ptr.is_null() {
        return 0;
    }
    unsafe {
        (*ptr).spread_ticks().unwrap_or(0)
    }
}
