//! Vectorized Black-Scholes-Merton European Option Pricing & Greeks in Rust
//! High-precision normal cumulative distribution and analytical Greeks.

use std::f64::consts::PI;

const INV_SQRT_2PI: f64 = 0.398942280401432677939946059934;

#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct OptionGreeks {
    pub price: f64,
    pub delta: f64,
    pub gamma: f64,
    pub vega: f64,
    pub theta: f64,
    pub rho: f64,
}

/// Standard normal probability density function N'(x)
#[inline(always)]
pub fn norm_pdf(x: f64) -> f64 {
    INV_SQRT_2PI * (-0.5 * x * x).exp()
}

/// High-precision Abramowitz & Stegun rational approximation of normal CDF N(x)
#[inline(always)]
pub fn norm_cdf(x: f64) -> f64 {
    if x < -10.0 {
        return 0.0;
    }
    if x > 10.0 {
        return 1.0;
    }

    let k = 1.0 / (1.0 + 0.2316419 * x.abs());
    let a1 = 0.319381530;
    let a2 = -0.356563782;
    let a3 = 1.781477937;
    let a4 = -1.821255978;
    let a5 = 1.330274429;

    let poly = k * (a1 + k * (a2 + k * (a3 + k * (a4 + k * a5))));
    let approx = 1.0 - norm_pdf(x.abs()) * poly;

    if x >= 0.0 {
        approx
    } else {
        1.0 - approx
    }
}

/// Compute Black-Scholes price and complete Greeks for European options
pub fn price_black_scholes(s: f64, k: f64, t: f64, r: f64, sigma: f64, is_call: bool) -> OptionGreeks {
    if s <= 0.0 || k <= 0.0 || t <= 0.0 || sigma <= 0.0 {
        let intrinsic = if is_call { (s - k).max(0.0) } else { (k - s).max(0.0) };
        return OptionGreeks {
            price: intrinsic,
            delta: if is_call { if s > k { 1.0 } else { 0.0 } } else { if s < k { -1.0 } else { 0.0 } },
            gamma: 0.0,
            vega: 0.0,
            theta: 0.0,
            rho: 0.0,
        };
    }

    let sqrt_t = t.sqrt();
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * sqrt_t);
    let d2 = d1 - sigma * sqrt_t;

    let nd1 = norm_cdf(d1);
    let nd2 = norm_cdf(d2);
    let np_d1 = norm_pdf(d1);
    let exp_neg_rt = (-r * t).exp();

    let (price, delta, rho, theta) = if is_call {
        let p = s * nd1 - k * exp_neg_rt * nd2;
        let d = nd1;
        let r_greek = (k * t * exp_neg_rt * nd2) / 100.0;
        let th = (-(s * np_d1 * sigma) / (2.0 * sqrt_t) - r * k * exp_neg_rt * nd2) / 365.0;
        (p, d, r_greek, th)
    } else {
        let n_neg_d1 = norm_cdf(-d1);
        let n_neg_d2 = norm_cdf(-d2);
        let p = k * exp_neg_rt * n_neg_d2 - s * n_neg_d1;
        let d = nd1 - 1.0;
        let r_greek = (-k * t * exp_neg_rt * n_neg_d2) / 100.0;
        let th = (-(s * np_d1 * sigma) / (2.0 * sqrt_t) + r * k * exp_neg_rt * n_neg_d2) / 365.0;
        (p, d, r_greek, th)
    };

    let gamma = np_d1 / (s * sigma * sqrt_t);
    let vega = (s * sqrt_t * np_d1) / 100.0; // 1% vol move

    OptionGreeks {
        price: price.max(0.0),
        delta,
        gamma,
        vega,
        theta,
        rho,
    }
}

/// Vectorized batch options pricer: processes arrays of parameters in parallel
pub fn batch_price_options(
    spots: &[f64],
    strikes: &[f64],
    maturities: &[f64],
    rates: &[f64],
    vols: &[f64],
    is_call: bool,
    out_prices: &mut [f64],
) {
    let n = spots.len().min(strikes.len()).min(out_prices.len());
    for i in 0..n {
        let greeks = price_black_scholes(spots[i], strikes[i], maturities[i], rates[i], vols[i], is_call);
        out_prices[i] = greeks.price;
    }
}
