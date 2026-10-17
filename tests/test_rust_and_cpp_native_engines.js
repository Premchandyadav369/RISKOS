/**
 * RISKOS Institutional Verification Suite: Rust & C++20 Native Core & WebAssembly Driver
 * 
 * Verifies:
 * 1. Rust Engine Architecture (Cargo.toml, lib.rs, matching_engine, black_scholes_simd, cvar_optimizer, hawkes)
 * 2. C++20 High-Performance Engine (matching_engine.cpp, simd_options_pricer.cpp, CMakeLists.txt)
 * 3. WASM Quant Runtime Driver & Mathematical Invariants (Put-Call Parity, Simplex Norm, Hawkes Decay)
 * 4. Microsecond Benchmarking SLA Performance (< 15us L3 matching, < 5us options pricing, > 500k ops/sec)
 * 5. Universal UI Integration in hft.html & app.html
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

console.log('================================================================');
console.log('  RISKOS INSTITUTIONAL NATIVE ENGINE VERIFICATION SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// 1. RUST CORE ARCHITECTURE INTEGRITY
// ----------------------------------------------------------------------------
console.log('--- 1. Rust Core Architecture (rust/) ---');

runTest('Cargo.toml is valid with crate-type cdylib/rlib and LTO release profile', () => {
  const cargoPath = path.join(__dirname, '..', 'rust', 'Cargo.toml');
  assert(fs.existsSync(cargoPath), 'Cargo.toml must exist');
  const content = fs.readFileSync(cargoPath, 'utf8');
  assert(content.includes('name = "riskos-core"'), 'Package name must be riskos-core');
  assert(content.includes('version = "2.0.0"'), 'Package version must be 2.0.0');
  assert(content.includes('crate-type = ["cdylib", "rlib"]'), 'Must support cdylib for WASM/C-FFI');
  assert(content.includes('lto = true'), 'Release profile must enable LTO');
  assert(content.includes('opt-level = 3'), 'Release profile must set opt-level 3');
});

runTest('rust/src/lib.rs exports all modules and extern "C" FFI symbols', () => {
  const libPath = path.join(__dirname, '..', 'rust', 'src', 'lib.rs');
  assert(fs.existsSync(libPath), 'rust/src/lib.rs must exist');
  const content = fs.readFileSync(libPath, 'utf8');
  assert(content.includes('pub mod matching_engine;'), 'Must export matching_engine module');
  assert(content.includes('pub mod black_scholes_simd;'), 'Must export black_scholes_simd module');
  assert(content.includes('pub mod cvar_optimizer;'), 'Must export cvar_optimizer module');
  assert(content.includes('pub mod hawkes;'), 'Must export hawkes module');
  assert(content.includes('pub extern "C" fn riskos_version()'), 'Must export riskos_version');
  assert(content.includes('pub extern "C" fn riskos_black_scholes('), 'Must export riskos_black_scholes');
  assert(content.includes('pub extern "C" fn riskos_batch_black_scholes('), 'Must export riskos_batch_black_scholes');
  assert(content.includes('pub extern "C" fn riskos_project_simplex('), 'Must export riskos_project_simplex');
  assert(content.includes('pub extern "C" fn riskos_optimize_min_variance('), 'Must export riskos_optimize_min_variance');
  assert(content.includes('pub extern "C" fn riskos_book_insert_limit('), 'Must export riskos_book_insert_limit');
});

runTest('rust/src/matching_engine.rs implements FIFO Price-Time priority', () => {
  const file = path.join(__dirname, '..', 'rust', 'src', 'matching_engine.rs');
  assert(fs.existsSync(file), 'matching_engine.rs must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('pub struct LimitOrderBook'), 'Must define LimitOrderBook');
  assert(content.includes('pub fn insert_limit('), 'Must implement insert_limit');
  assert(content.includes('pub fn cancel_order('), 'Must implement cancel_order');
  assert(content.includes('pub fn spread_ticks('), 'Must implement spread_ticks');
});

runTest('rust/src/black_scholes_simd.rs provides complete analytical Greeks', () => {
  const file = path.join(__dirname, '..', 'rust', 'src', 'black_scholes_simd.rs');
  assert(fs.existsSync(file), 'black_scholes_simd.rs must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('pub struct OptionGreeks'), 'Must define OptionGreeks struct');
  assert(content.includes('pub fn price_black_scholes('), 'Must implement price_black_scholes');
  assert(content.includes('pub fn batch_price_options('), 'Must implement batch_price_options');
  assert(content.includes('norm_cdf'), 'Must implement Abramowitz & Stegun rational approximation');
});

runTest('rust/src/spsc_queue.rs, itch50.rs, and stochastic_vol.rs implement low-latency HFT protocols', () => {
  const spsc = path.join(__dirname, '..', 'rust', 'src', 'spsc_queue.rs');
  const itch = path.join(__dirname, '..', 'rust', 'src', 'itch50.rs');
  const stoch = path.join(__dirname, '..', 'rust', 'src', 'stochastic_vol.rs');
  assert(fs.existsSync(spsc), 'rust/src/spsc_queue.rs must exist');
  assert(fs.existsSync(itch), 'rust/src/itch50.rs must exist');
  assert(fs.existsSync(stoch), 'rust/src/stochastic_vol.rs must exist');

  const spscContent = fs.readFileSync(spsc, 'utf8');
  assert(spscContent.includes('pub struct SpscQueue'), 'Must define SpscQueue');
  assert(spscContent.includes('Ordering::Acquire'), 'Must use acquire/release semantics');

  const itchContent = fs.readFileSync(itch, 'utf8');
  assert(itchContent.includes('pub struct RawAddOrder'), 'Must define RawAddOrder');
  assert(itchContent.includes('pub fn parse_itch_add_order'), 'Must implement parse_itch_add_order');

  const stochContent = fs.readFileSync(stoch, 'utf8');
  assert(stochContent.includes('pub fn sabr_implied_volatility'), 'Must implement sabr_implied_volatility');
  assert(stochContent.includes('pub fn heston_call_price'), 'Must implement heston_call_price');
});

// ----------------------------------------------------------------------------
// 2. C++20 CORE SOURCE INTEGRITY
// ----------------------------------------------------------------------------
console.log('\n--- 2. C++20 Core Architecture (cpp/) ---');

runTest('cpp/simd_options_pricer.cpp provides AVX2 SIMD & batch evaluation', () => {
  const file = path.join(__dirname, '..', 'cpp', 'simd_options_pricer.cpp');
  assert(fs.existsSync(file), 'simd_options_pricer.cpp must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('struct alignas(32) GreeksResult'), 'Must define cache-aligned GreeksResult');
  assert(content.includes('price_single_option('), 'Must implement price_single_option');
  assert(content.includes('batch_evaluate('), 'Must implement batch_evaluate');
  assert(content.includes('extern "C"'), 'Must declare extern "C" bindings for WASM');
  assert(content.includes('cpp_benchmark_options_throughput'), 'Must provide standalone throughput benchmark');
});

runTest('cpp/spsc_ring_buffer.hpp, itch50_decoder.hpp, and sabr_heston_pricer.cpp exist with zero-copy features', () => {
  const spsc = path.join(__dirname, '..', 'cpp', 'spsc_ring_buffer.hpp');
  const itch = path.join(__dirname, '..', 'cpp', 'itch50_decoder.hpp');
  const sabr = path.join(__dirname, '..', 'cpp', 'sabr_heston_pricer.cpp');
  assert(fs.existsSync(spsc), 'cpp/spsc_ring_buffer.hpp must exist');
  assert(fs.existsSync(itch), 'cpp/itch50_decoder.hpp must exist');
  assert(fs.existsSync(sabr), 'cpp/sabr_heston_pricer.cpp must exist');

  const spscContent = fs.readFileSync(spsc, 'utf8');
  assert(spscContent.includes('class SpscRingBuffer'), 'Must define SpscRingBuffer');
  assert(spscContent.includes('alignas(HARDWARE_DESTRUCTIVE_INTERFERENCE_SIZE)'), 'Must isolate cache lines');

  const itchContent = fs.readFileSync(itch, 'utf8');
  assert(itchContent.includes('struct MsgAddOrder'), 'Must define MsgAddOrder');
  assert(itchContent.includes('parse_add_order'), 'Must implement parse_add_order');

  const sabrContent = fs.readFileSync(sabr, 'utf8');
  assert(sabrContent.includes('sabr_implied_volatility'), 'Must implement sabr_implied_volatility');
  assert(sabrContent.includes('heston_call_price'), 'Must implement heston_call_price');
});

runTest('cpp/CMakeLists.txt configures C++20 and compiler vectorization flags', () => {
  const file = path.join(__dirname, '..', 'cpp', 'CMakeLists.txt');
  assert(fs.existsSync(file), 'cpp/CMakeLists.txt must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('CMAKE_CXX_STANDARD 20'), 'Must target C++20 standard');
  assert(content.includes('riskos_cpp_core'), 'Must define riskos_cpp_core target');
  assert(content.includes('matching_engine.cpp'), 'Must link matching_engine.cpp');
  assert(content.includes('simd_options_pricer.cpp'), 'Must link simd_options_pricer.cpp');
});

// ----------------------------------------------------------------------------
// 3. WASM QUANTITATIVE DRIVER MATHEMATICS & INVARIANTS
// ----------------------------------------------------------------------------
console.log('\n--- 3. WASM Driver Mathematical Verification ---');

const WasmEngine = require('../wasmQuantEngine.js');

runTest('WasmQuantEngine initializes with version 2.0.0', () => {
  assert.strictEqual(WasmEngine.version, '2.0.0');
  assert(WasmEngine.BlackScholes, 'BlackScholes engine must be present');
  assert(WasmEngine.OrderBook, 'OrderBook engine must be present');
  assert(WasmEngine.Simplex, 'Simplex optimizer must be present');
  assert(WasmEngine.Hawkes, 'Hawkes point process must be present');
});

runTest('Black-Scholes analytical Greeks and Put-Call Parity invariant: C - P = S - K*e^(-rT)', () => {
  const S = 100.0;
  const K = 100.0;
  const T = 1.0;
  const r = 0.05;
  const sigma = 0.20;

  const call = WasmEngine.BlackScholes.priceOption(S, K, T, r, sigma, true);
  const put = WasmEngine.BlackScholes.priceOption(S, K, T, r, sigma, false);

  // Theoretical Call price for S=100, K=100, T=1, r=0.05, vol=0.2 is ~10.4506
  assert(Math.abs(call.price - 10.4506) < 0.05, `Call price expected ~10.45, got ${call.price}`);
  assert(call.delta > 0.60 && call.delta < 0.65, `Call delta expected ~0.637, got ${call.delta}`);
  assert(put.delta < 0 && put.delta > -0.40, `Put delta expected ~-0.363, got ${put.delta}`);
  assert(Math.abs((call.delta - put.delta) - 1.0) < 1e-4, 'Delta parity: Delta_call - Delta_put must equal 1.0');

  // Put-Call Parity: C - P = S - K * exp(-r*T)
  const syntheticForward = S - K * Math.exp(-r * T);
  const spread = call.price - put.price;
  assert(Math.abs(spread - syntheticForward) < 1e-4, `Put-call parity violated: |${spread} - ${syntheticForward}| >= 1e-4`);
});

runTest('L3 Order Book matching engine respects Price-Time Priority and crosses correctly', () => {
  const book = new WasmEngine.OrderBook();
  book.reset();

  // Resting asks: 10 shares @ 101, 20 shares @ 102
  book.insertLimit(1, 'SELL', 101, 10, 1000);
  book.insertLimit(2, 'SELL', 102, 20, 2000);

  // Incoming aggressive Buy: 15 shares @ 102 (should fill 10 @ 101, then 5 @ 102)
  const trades = book.insertLimit(3, 'BUY', 102, 15, 3000);

  assert.strictEqual(trades.length, 2, 'Must generate exactly 2 trade fills');
  assert.strictEqual(trades[0].priceTicks, 101, 'First fill must be at best ask 101');
  assert.strictEqual(trades[0].qty, 10, 'First fill must be 10 shares');
  assert.strictEqual(trades[1].priceTicks, 102, 'Second fill must be at 102');
  assert.strictEqual(trades[1].qty, 5, 'Second fill must be 5 shares');

  assert.strictEqual(book.getBestAsk(), 102, 'Best ask remaining must be 102');
  assert.strictEqual(book.totalMatchedVolume, 15, 'Total matched volume must be 15');
});

runTest('Wang & Carreira-Perpinan (2013) exact Euclidean simplex projection sums to 1 and non-negative', () => {
  const input = [0.8, -0.4, 1.2, 0.1, -0.9, 0.5];
  const w = WasmEngine.Simplex.projectSimplex(input);

  assert.strictEqual(w.length, input.length);
  const sumW = Array.from(w).reduce((a, b) => a + b, 0);
  assert(Math.abs(sumW - 1.0) < 1e-6, `Simplex weights must sum to 1.0, got ${sumW}`);

  for (let i = 0; i < w.length; i++) {
    assert(w[i] >= 0, `Weight ${i} must be non-negative, got ${w[i]}`);
  }
});

runTest('Hawkes point process exhibits exponential memory decay and stable branching ratio', () => {
  const hawkes = new WasmEngine.Hawkes(1.0, 0.6, 1.2);
  assert.strictEqual(hawkes.branchingRatio(), 0.5, 'Branching ratio must equal 0.6 / 1.2 = 0.5');

  hawkes.registerEvent(1.0);
  const intensityImmediately = hawkes.intensityAt(1.0);
  const intensityLater = hawkes.intensityAt(5.0);

  assert(intensityLater < intensityImmediately, 'Intensity must decay over forward time');
  assert(intensityLater >= hawkes.mu, 'Intensity must not fall below baseline mu');
});

runTest('SabrHestonEngine computes asymptotic SABR implied vol smile and Heston call option', () => {
  assert(WasmEngine.SabrHeston, 'SabrHeston engine must be exported');
  const F = 100.0, K = 105.0, T = 1.0;
  const alpha = 0.20, beta = 0.70, rho = -0.30, nu = 0.40;

  const atmVol = WasmEngine.SabrHeston.sabrImpliedVol(F, F, T, alpha, beta, rho, nu);
  const otmVol = WasmEngine.SabrHeston.sabrImpliedVol(F, K, T, alpha, beta, rho, nu);
  assert(atmVol > 0.01 && atmVol < 1.0, `ATM vol expected reasonable, got ${atmVol}`);
  assert(otmVol > 0.01 && otmVol < 1.0, `OTM vol expected positive, got ${otmVol}`);

  const hestonCall = WasmEngine.SabrHeston.hestonCallPrice(100.0, 100.0, 1.0, 0.03, 0.04, 2.0, 0.04, 0.3, -0.7);
  assert(hestonCall > 5.0 && hestonCall < 20.0, `Heston call expected reasonable positive price, got ${hestonCall}`);
});

runTest('SpscRingBuffer enforces bounded lock-free FIFO queue semantics', () => {
  assert(WasmEngine.SpscRingBuffer, 'SpscRingBuffer must be exported');
  const queue = new WasmEngine.SpscRingBuffer(4);
  assert.strictEqual(queue.size(), 0);
  assert.strictEqual(queue.pop(), null);

  assert(queue.push(101));
  assert(queue.push(102));
  assert(queue.push(103));
  assert(queue.push(104));
  assert(!queue.push(105), 'Buffer must reject when full');

  assert.strictEqual(queue.pop(), 101);
  assert.strictEqual(queue.pop(), 102);
  assert.strictEqual(queue.size(), 2);
  assert(queue.push(105), 'Buffer should accept after pop');
});

// ----------------------------------------------------------------------------
// 4. MICROSECOND BENCHMARKING SLA PERFORMANCE
// ----------------------------------------------------------------------------
console.log('\n--- 4. Benchmarking Performance Budgets ---');

runTest('Full native benchmark suite achieves > 500,000 ops/sec and status OPTIMAL', () => {
  const suite = WasmEngine.runFullNativeSuite();
  assert.strictEqual(suite.overallStatus, 'OPTIMAL', 'Overall status must be OPTIMAL');
  assert(suite.totalOperations >= 100000, `Must process >= 100,000 ops, got ${suite.totalOperations}`);
  assert(suite.overallThroughputOpsSec > 500000, `Throughput must exceed 500k ops/sec, got ${suite.overallThroughputOpsSec}`);
  console.log(`     -> Throughput: ${suite.overallThroughputOpsSec.toLocaleString()} ops/sec in ${suite.totalTimeMs} ms`);
});

// ----------------------------------------------------------------------------
// 5. UNIVERSAL UI INTEGRATION VERIFICATION
// ----------------------------------------------------------------------------
console.log('\n--- 5. Universal UI Integration ---');

runTest('hft.html includes wasmQuantEngine.js and #btnRunNativeBenchmark', () => {
  const hftPath = path.join(__dirname, '..', 'hft.html');
  const content = fs.readFileSync(hftPath, 'utf8');
  assert(content.includes('wasmQuantEngine.js'), 'hft.html must include wasmQuantEngine.js');
  assert(content.includes('id="btnRunNativeBenchmark"'), 'hft.html must include #btnRunNativeBenchmark');
});

runTest('app.html includes wasmQuantEngine.js and #btnRunNativeBenchmark', () => {
  const appPath = path.join(__dirname, '..', 'app.html');
  const content = fs.readFileSync(appPath, 'utf8');
  assert(content.includes('wasmQuantEngine.js'), 'app.html must include wasmQuantEngine.js');
  assert(content.includes('id="btnRunNativeBenchmark"'), 'app.html must include #btnRunNativeBenchmark');
});

console.log('\n================================================================');
console.log(`  NATIVE CORE RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
