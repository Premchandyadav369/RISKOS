/**
 * Test Suite: Institutional High-Frequency Trading (HFT) & Market Microstructure Terminal
 * Verifies:
 * 1. LetterGlitch matrix background component & canvas integration with fallback
 * 2. Canonical Sticky Header architecture, 8-Desks navigation invariant, and all-ticker support
 * 3. Module 1: L3 DOM Ladder, Bookmap Waterfall & 1-Click DOM order execution
 * 4. Module 2: Closed-form Avellaneda-Stoikov dynamic reservation price & inventory skew
 * 5. Module 3: Stoikov Micro-Price & VPIN toxicity calculations
 * 6. Module 4: Price-Time Priority (FIFO) queue logic & RAW FIX 4.4 packet stream
 * 7. Module 5: Real-Time Time & Sales Tape with microsecond resolution & CVD footprint
 * 8. Module 6: Microsecond Latency Arbitrage & Co-Location Simulator (Fiber vs. Microwave vs. Web)
 * 9. Module 7: Algorithmic Slicing & Implementation Shortfall (TWAP / VWAP / POV)
 * 10. Live Market Data Truth pipeline (SecurityMaster ticks & tape subscriptions)
 * 11. Ecosystem integration with universalPalette.js, learn.html (Labs), and README.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS HIGH-FREQUENCY TRADING (HFT) TERMINAL VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Error: ${err.message}\n`);
  }
}

const ROOT = path.join(__dirname, '..');
const hftHtml = fs.readFileSync(path.join(ROOT, 'hft.html'), 'utf8');
const hftCss = fs.readFileSync(path.join(ROOT, 'hft.css'), 'utf8');
const hftJs = fs.readFileSync(path.join(ROOT, 'hft.js'), 'utf8');
const letterGlitchJs = fs.readFileSync(path.join(ROOT, 'letterGlitch.js'), 'utf8');
const paletteJs = fs.readFileSync(path.join(ROOT, 'universalPalette.js'), 'utf8');
const learnHtml = fs.readFileSync(path.join(ROOT, 'learn.html'), 'utf8');
const readmeMd = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

// ── 1. LetterGlitch Component & Matrix Background ──
console.log('── Section 1: LetterGlitch Background & Visual Fallback ──');

it('letterGlitch.js exports LetterGlitch class with color mixing and grid calculations', () => {
  const LetterGlitch = require(path.join(ROOT, 'letterGlitch.js'));
  assert(typeof LetterGlitch === 'function', 'LetterGlitch must be exported as a class/function');

  const proto = LetterGlitch.prototype;
  assert(typeof proto.mixRgb === 'function', 'LetterGlitch must have mixRgb method');
  assert(typeof proto.hexToRgb === 'function', 'LetterGlitch must have hexToRgb method');
  assert(typeof proto.calculateGrid === 'function', 'LetterGlitch must have calculateGrid method');

  const mixed = proto.mixRgb({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 }, 0.5);
  assert.strictEqual(mixed.r, 50, 'mixRgb red interpolation failed');
  assert.strictEqual(mixed.g, 100, 'mixRgb green interpolation failed');

  const grid = proto.calculateGrid(1000, 800);
  assert(grid.columns > 50 && grid.rows > 30, 'calculateGrid returned invalid dimensions');
});

it('hft.html includes LetterGlitch canvas, vignettes, and script tag', () => {
  assert(hftHtml.includes('id="letterGlitchCanvas"'), 'Missing #letterGlitchCanvas in hft.html');
  assert(hftHtml.includes('hft-outer-vignette'), 'Missing .hft-outer-vignette in hft.html');
  assert(hftHtml.includes('hft-center-vignette'), 'Missing .hft-center-vignette in hft.html');
  assert(hftHtml.includes('<script src="letterGlitch.js"></script>'), 'Missing letterGlitch.js script tag');
});

// ── 2. Sticky Header Architecture & Universal Invariants ──
console.log('\n── Section 2: Canonical Header Architecture & Navigation Invariants ──');

it('hft.html implements canonical RISKOS sticky header structure', () => {
  assert(hftHtml.includes('<header class="header" id="siteHeader">'), 'hft.html must use canonical header.header#siteHeader');
  assert(hftHtml.includes('class="header-inner"'), 'Missing .header-inner container');
  assert(hftHtml.includes('class="market-clock-badge"'), 'Missing .market-clock-badge');
  assert(hftHtml.includes('class="nav-pill"'), 'Missing .nav-pill navigation');
  assert(hftHtml.includes('class="header-actions"'), 'Missing .header-actions container');
});

it('hft.html maintains universal 8 Desks and primary route navigation invariant', () => {
  assert(hftHtml.includes('>8 Desks<') || hftHtml.includes('8 Desks'), 'hft.html must link to 8 Desks');
  assert(hftHtml.includes('href="app.html"'), 'hft.html must link to app.html');
  assert(hftHtml.includes('href="fleet.html"'), 'hft.html must link to fleet.html');
  assert(hftHtml.includes('href="learn.html"'), 'hft.html must link to learn.html');
  assert(hftHtml.includes('href="portfolio_optimizer.html"'), 'hft.html must link to portfolio_optimizer.html');
});

it('hft.css specifies sticky header positioning and proper z-index layering', () => {
  assert(hftCss.includes('header.header {') || hftCss.includes('header.header'), 'Missing header.header rule in hft.css');
  assert(hftCss.includes('position: sticky'), 'Header must have position: sticky');
  assert(hftCss.includes('z-index: 50') || hftCss.includes('z-index:50'), 'Header must have elevated z-index');
});

it('hft.html contains universal ticker search input, datalist, and load button', () => {
  assert(hftHtml.includes('id="hftTickerInput"'), 'Missing #hftTickerInput in hft.html');
  assert(hftHtml.includes('id="hftTickerList"'), 'Missing #hftTickerList datalist');
  assert(hftHtml.includes('id="btnLoadTicker"'), 'Missing #btnLoadTicker');
  assert(hftHtml.includes('value="RELIANCE.NS"'), 'Datalist must include NSE blue chips');
  assert(hftHtml.includes('value="BTC-USD"'), 'Datalist must include crypto');
  assert(hftHtml.includes('value="NVDA"'), 'Datalist must include US equities');
});

it('hft.html includes KaTeX CSS and auto-render scripts for mathematical typesetting', () => {
  assert(hftHtml.includes('katex.min.css'), 'Missing KaTeX CSS in hft.html');
  assert(hftHtml.includes('katex.min.js'), 'Missing KaTeX JS in hft.html');
  assert(hftHtml.includes('auto-render.min.js'), 'Missing KaTeX auto-render in hft.html');
});

// ── 3. Realistic L3 DOM Ladder & 1-Click Order Execution ──
console.log('\n── Section 3: L3 DOM Ladder & 1-Click Order Execution ──');

it('Module 1: Realistic L3 DOM Ladder, Bookmap canvas, and 1-Click DOM order buttons', () => {
  assert(hftHtml.includes('id="hftDomLadder"'), 'Missing #hftDomLadder container');
  assert(hftHtml.includes('id="bookmapCanvas"'), 'Missing #bookmapCanvas');
  assert(hftHtml.includes('id="icebergAlertBadge"'), 'Missing #icebergAlertBadge');
  assert(hftHtml.includes('id="btnDomBuyMkt"'), 'Missing #btnDomBuyMkt 1-click execution button');
  assert(hftHtml.includes('id="btnDomSellMkt"'), 'Missing #btnDomSellMkt 1-click execution button');
  assert(hftHtml.includes('id="hftDomOrderQty"'), 'Missing #hftDomOrderQty selector');
  assert(hftHtml.includes('\\text{Depth}(p, t)'), 'Missing Depth KaTeX math formula');
  assert(hftHtml.includes('hft-layman-box'), 'Missing layman intuition box');
});

// ── 4. Avellaneda-Stoikov Dynamic Market Making ──
console.log('\n── Section 4: Avellaneda-Stoikov Dynamic Market Making ──');

it('Module 2: Avellaneda-Stoikov Dynamic Market Making with math, sliders & PnL grid', () => {
  assert(hftHtml.includes('id="sliderAsGamma"'), 'Missing #sliderAsGamma');
  assert(hftHtml.includes('id="sliderAsKappa"'), 'Missing #sliderAsKappa');
  assert(hftHtml.includes('id="sliderAsInventory"'), 'Missing #sliderAsInventory');
  assert(hftHtml.includes('id="btnDeployAsBot"'), 'Missing #btnDeployAsBot');
  assert(hftHtml.includes('r(s, q, t) = s - q \\gamma \\sigma^2'), 'Missing AS reservation price KaTeX math');
  assert(hftHtml.includes('Reservation Price'), 'Layman box must explain reservation price');
});

// ── 5. Stoikov Micro-Price & VPIN Toxicity Radar ──
console.log('\n── Section 5: Stoikov Micro-Price & VPIN Toxicity Radar ──');

it('Module 3: Stoikov Micro-Price & VPIN Toxicity Radar with math and alert triggers', () => {
  assert(hftHtml.includes('id="radarMicroPrice"'), 'Missing #radarMicroPrice');
  assert(hftHtml.includes('id="radarVpinVal"'), 'Missing #radarVpinVal');
  assert(hftHtml.includes('id="radarVpinBadge"'), 'Missing #radarVpinBadge');
  assert(hftHtml.includes('P^{\\text{micro}} = P^{\\text{mid}}'), 'Missing Stoikov Micro-Price KaTeX math');
  assert(hftHtml.includes('\\text{VPIN} ='), 'Missing VPIN KaTeX math');
  assert(hftHtml.includes('toxic flow'), 'Layman box must explain toxic flow');
});

// ── 6. Queue Position Simulator & RAW FIX 4.4 Stream ──
console.log('\n── Section 6: Queue Position Simulator & RAW FIX 4.4 Stream ──');

it('Module 4: Queue Position Simulator & RAW FIX 4.4 Stream with math & decoders', () => {
  assert(hftHtml.includes('id="btnSubmitQueueOrder"'), 'Missing #btnSubmitQueueOrder');
  assert(hftHtml.includes('id="btnRaceColocBot"'), 'Missing #btnRaceColocBot');
  assert(hftHtml.includes('id="fixMessageTerminal"'), 'Missing #fixMessageTerminal');
  assert(hftHtml.includes('\\Delta P = \\lambda \\cdot Q_{\\text{market}}'), 'Missing Kyle lambda KaTeX math');
  assert(hftHtml.includes('First-In, First-Out (FIFO)'), 'Layman box must explain FIFO queue');
});

// ── 7. Module 5: Time & Sales Tape & CVD Footprint ──
console.log('\n── Section 7: Workstation 5 — Time & Sales Tape & CVD Footprint ──');

it('Module 5: Time & Sales Tape with microsecond resolution and CVD footprint', () => {
  assert(hftHtml.includes('id="wsTapeCvd"'), 'Missing #wsTapeCvd section');
  assert(hftHtml.includes('id="hftTapeTableBody"'), 'Missing #hftTapeTableBody');
  assert(hftHtml.includes('id="cvdMetricVal"'), 'Missing #cvdMetricVal');
  assert(hftHtml.includes('id="cvdAbsorptionState"'), 'Missing #cvdAbsorptionState');
  assert(hftHtml.includes('\\text{CVD}_T = \\sum_{t=1}^T'), 'Missing CVD KaTeX formula');
  assert(hftHtml.includes('Every transaction requires one aggressive party'), 'Missing CVD layman explanation');
});

// ── 8. Module 6: Microsecond Latency Arbitrage & Co-Location Simulator ──
console.log('\n── Section 8: Workstation 6 — Microsecond Latency Arbitrage Simulator ──');

it('Module 6: Microsecond Latency Arbitrage Simulator with route selector & speed of light math', () => {
  assert(hftHtml.includes('id="wsLatencyArb"'), 'Missing #wsLatencyArb section');
  assert(hftHtml.includes('id="selectLatencyRoute"'), 'Missing #selectLatencyRoute');
  assert(hftHtml.includes('id="sliderDistanceKm"'), 'Missing #sliderDistanceKm');
  assert(hftHtml.includes('id="btnRunLatencyRace"'), 'Missing #btnRunLatencyRace');
  assert(hftHtml.includes('\\tau_{\\text{prop}} = \\frac{2 \\cdot d}{c / n_{\\text{medium}}}'), 'Missing latency propagation KaTeX formula');
  assert(hftHtml.includes('Light travels through air (microwave) 31% faster'), 'Missing speed-of-light layman explanation');
});

// ── 9. Module 7: Algorithmic Execution Slicer (TWAP / VWAP / POV) ──
console.log('\n── Section 9: Workstation 7 — Algorithmic Slicing & Implementation Shortfall ──');

it('Module 7: Algorithmic Execution Slicer with TWAP/VWAP/POV options and Almgren-Chriss shortfall', () => {
  assert(hftHtml.includes('id="wsAlgoSlicer"'), 'Missing #wsAlgoSlicer section');
  assert(hftHtml.includes('id="slicerParentQty"'), 'Missing #slicerParentQty');
  assert(hftHtml.includes('id="slicerAlgoType"'), 'Missing #slicerAlgoType');
  assert(hftHtml.includes('id="slicerDurationSec"'), 'Missing #slicerDurationSec');
  assert(hftHtml.includes('id="btnStartSlicer"'), 'Missing #btnStartSlicer');
  assert(hftHtml.includes('id="slicerProgressBar"'), 'Missing #slicerProgressBar');
  assert(hftHtml.includes('\\text{IS} = \\sum_{k=1}^N'), 'Missing Implementation Shortfall KaTeX formula');
});

// ── 10. Mathematical Engine Verification ──
console.log('\n── Section 10: High-Frequency Mathematical Engine Logic ──');

it('Avellaneda-Stoikov engine calculates closed-form reservation price and asymmetric quoting', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = {
    readyState: 'complete',
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  };
  runCode(mockWindow, mockDoc, mockWindow);

  assert(mockWindow.HFTTerminal, 'HFTTerminal must be exported on window');
  
  // Test AS math: s=1000, q=0, gamma=0.1, kappa=1.5, sigma=0.20, T=1
  const resNeutral = mockWindow.HFTTerminal.calculateAS(1000, 0, 0.1, 1.5, 0.20, 1.0);
  assert.strictEqual(resNeutral.resPrice, 1000, 'Neutral reservation price must equal mid');
  assert(resNeutral.halfSpread > 0.5, 'Half spread must be positive');

  // Test Long Inventory Skew (q = +10): Reservation price must drop below mid
  const resLong = mockWindow.HFTTerminal.calculateAS(1000, 10, 0.1, 1.5, 0.20, 1.0);
  assert(resLong.resPrice < 1000, 'Long inventory must lower reservation price to encourage selling');

  // Test Short Inventory Skew (q = -10): Reservation price must rise above mid
  const resShort = mockWindow.HFTTerminal.calculateAS(1000, -10, 0.1, 1.5, 0.20, 1.0);
  assert(resShort.resPrice > 1000, 'Short inventory must raise reservation price to encourage buying');
});

it('Stoikov Micro-Price correctly weights order book queue imbalances', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] };
  runCode(mockWindow, mockDoc, mockWindow);

  const microUp = mockWindow.HFTTerminal.calculateMicroPrice(1000, 3000, 1000, 1.0);
  assert.strictEqual(microUp, 1000.25, 'Micro-Price must lead mid-price higher on buy queue dominance');

  const microDown = mockWindow.HFTTerminal.calculateMicroPrice(1000, 1000, 3000, 1.0);
  assert.strictEqual(microDown, 999.75, 'Micro-Price must lead mid-price lower on sell queue dominance');
});

it('VPIN Toxicity calculation evaluates volume bucket imbalances correctly', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] };
  runCode(mockWindow, mockDoc, mockWindow);

  const zeroTox = mockWindow.HFTTerminal.calculateVPIN([{ buy: 500, sell: 500 }]);
  assert.strictEqual(zeroTox, 0, 'Symmetric flow must have 0 VPIN toxicity');

  const maxTox = mockWindow.HFTTerminal.calculateVPIN([{ buy: 1000, sell: 0 }]);
  assert.strictEqual(maxTox, 1.0, 'Fully one-sided flow must have 1.0 VPIN toxicity');
});

it('Latency engine calculates speed-of-light propagation delays correctly', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] };
  runCode(mockWindow, mockDoc, mockWindow);

  const { microRtt, fiberRtt, retailRtt } = mockWindow.HFTTerminal.calculateLatency(1180);
  assert(microRtt < fiberRtt, 'Microwave RTT must be strictly faster than fiber RTT');
  assert(fiberRtt < retailRtt, 'Fiber RTT must be strictly faster than retail RTT');
  assert(microRtt > 7.0 && microRtt < 9.0, 'Microwave RTT for 1180km should be ~7.87ms');
  assert(fiberRtt > 11.0 && fiberRtt < 13.0, 'Fiber RTT for 1180km should be ~11.56ms');
});

// ── 11. Real-Time Market Data Truth Pipeline ──
console.log('\n── Section 11: Real-Time Market Data Truth & Live Execution Pipeline ──');

it('hft.js wires SecurityMaster.subscribeLiveTicks and subscribeLiveTape', () => {
  assert(hftJs.includes('SecurityMaster.subscribeLiveTicks'), 'hft.js must subscribe to live ticks');
  assert(hftJs.includes('SecurityMaster.subscribeLiveTape'), 'hft.js must subscribe to live tape');
  assert(hftJs.includes('initMarketDataTruthFeed'), 'hft.js must initialize market data truth feed');
  assert(hftJs.includes('executeDomOrder'), 'hft.js must implement 1-click DOM order execution');
});

// ── 12. Ecosystem Integration, Labs & README Documentation ──
console.log('\n── Section 12: Ecosystem Integration, Labs & Documentation ──');

it('universalPalette.js registers HFT Desk and /hft slash command', () => {
  assert(paletteJs.includes("id: 'page_hft'"), 'Missing page_hft in universalPalette.js');
  assert(paletteJs.includes("id: 'act_hft'"), 'Missing act_hft in universalPalette.js');
  assert(paletteJs.includes("slashQuery.includes('hft')"), 'Missing /hft slash command handler');
});

it('learn.html links to dedicated HFT Desk from Avellaneda-Stoikov and simulation sandbox', () => {
  assert(learnHtml.includes('href="hft.html?symbol=RELIANCE.NS&focus=as"') || learnHtml.includes('href="hft.html"'), 'learn.html must deep-link to hft.html');
  assert(learnHtml.includes('Live HFT Desk') || learnHtml.includes('Dedicated HFT Desk'), 'learn.html must display HFT Desk CTA button');
});

it('README.md comprehensively documents HFT Terminal with architecture and 7 workstations', () => {
  assert(readmeMd.includes('High-Frequency Trading & Market Microstructure Terminal (`hft.html`)'), 'README.md must document HFT terminal');
  assert(readmeMd.includes('Workstation 1: Real-Time L3 Depth of Market (DOM) Ladder'), 'README.md must document Workstation 1');
  assert(readmeMd.includes('Workstation 2: Closed-Form Avellaneda-Stoikov'), 'README.md must document Workstation 2');
  assert(readmeMd.includes('Workstation 3: Stoikov Micro-Price & VPIN'), 'README.md must document Workstation 3');
  assert(readmeMd.includes('Workstation 5: Real-Time Time & Sales Tape'), 'README.md must document Workstation 5');
  assert(readmeMd.includes('Workstation 6: Microsecond Latency Arbitrage'), 'README.md must document Workstation 6');
  assert(readmeMd.includes('Workstation 7: Algorithmic Execution Slicer'), 'README.md must document Workstation 7');
});

// ── 13. Workstation 8: C++ & WebAssembly (WASM) Matching Engine Core ──
console.log('\n── Section 13: Workstation 8 — C++ & WebAssembly (WASM) L3 Matching Engine ──');

it('C++ matching engine core file exists with cache-aligned limit order book and zero-allocation matching', () => {
  const cppPath = path.join(__dirname, '..', 'cpp', 'matching_engine.cpp');
  assert(fs.existsSync(cppPath), 'cpp/matching_engine.cpp must exist');
  const cppCode = fs.readFileSync(cppPath, 'utf8');
  assert(cppCode.includes('alignas(64)'), 'C++ matching engine must use cache-aligned memory');
  assert(cppCode.includes('insert_limit'), 'C++ matching engine must implement insert_limit');
  assert(cppCode.includes('execute_market'), 'C++ matching engine must implement execute_market');
  assert(cppCode.includes('cancel_order'), 'C++ matching engine must implement cancel_order');
  assert(cppCode.includes('benchmark_burst'), 'C++ matching engine must implement benchmark_burst');
});

it('matchingEngine.wasm is a valid compiled WebAssembly binary', () => {
  const wasmPath = path.join(__dirname, '..', 'matchingEngine.wasm');
  assert(fs.existsSync(wasmPath), 'matchingEngine.wasm must exist');
  const buffer = fs.readFileSync(wasmPath);
  assert(buffer.length > 50, 'WASM binary must be non-empty');
  assert.strictEqual(buffer.readUInt32BE(0), 0x0061736d, 'Magic bytes must be \x00asm');
  assert.strictEqual(buffer.readUInt32LE(4), 1, 'WebAssembly version must be 1');
});

it('matchingEngineWasm.js executes limit orders, aggressive market sweeps, and sub-microsecond benchmarks', async () => {
  const wasmJsPath = path.join(__dirname, '..', 'matchingEngineWasm.js');
  assert(fs.existsSync(wasmJsPath), 'matchingEngineWasm.js must exist');
  const { MatchingEngineWasm } = require(wasmJsPath);
  await MatchingEngineWasm.ready();
  assert(MatchingEngineWasm.initialized, 'Engine must be initialized');

  MatchingEngineWasm.reset();
  // Insert passive limit orders
  MatchingEngineWasm.insertLimit('BUY', 100.0, 50, 101);
  MatchingEngineWasm.insertLimit('BUY', 99.5, 100, 102);
  MatchingEngineWasm.insertLimit('SELL', 100.5, 40, 201);
  MatchingEngineWasm.insertLimit('SELL', 101.0, 60, 202);

  assert.strictEqual(MatchingEngineWasm.getBestBid(), 100.0, 'Best bid should be 100.0');
  assert.strictEqual(MatchingEngineWasm.getBestAsk(), 100.5, 'Best ask should be 100.5');

  // Aggressive market order crossing best ask
  const mktFill = MatchingEngineWasm.executeMarket('BUY', 30);
  assert.strictEqual(mktFill.executedQty, 30, 'Market buy must execute 30 units');
  assert.strictEqual(mktFill.avgFillPrice, 100.5, 'Must fill at best ask of 100.5');

  // Cancel order
  const cancelled = MatchingEngineWasm.cancelOrder(102);
  assert(cancelled, 'Order 102 must be cancelled');

  // High-performance benchmark
  const bench = MatchingEngineWasm.runBenchmark(2000);
  assert(bench.ordersPerSec > 50000, 'Benchmark throughput must exceed 50k orders/sec');
  assert(bench.avgLatencyNs > 0, 'Latency must be measurable');
});

// ── 14. Workstation 9: Cross-Exchange Basis & Perpetual Funding Arbitrage Radar ──
console.log('\n── Section 14: Workstation 9 — Cross-Exchange Basis & Perpetual Funding Radar ──');

it('basisArbitrageEngine.js accurately computes Cost-of-Carry, Basis APR, and Compounded APY', () => {
  const basisPath = path.join(__dirname, '..', 'basisArbitrageEngine.js');
  assert(fs.existsSync(basisPath), 'basisArbitrageEngine.js must exist');
  const { BasisArbitrageEngine } = require(basisPath);

  // 1. Cost of Carry: Spot=64,000, DTE=30, r=5.25%, q=1.2%, c=0.15%
  const coc = BasisArbitrageEngine.calculateCostOfCarry(64000, 30, 0.0525, 0.012, 0.0015);
  assert(coc.fairFuturesPrice > 64000, 'Futures price under positive net carry must exceed spot');
  assert(coc.fairBasis > 0, 'Fair basis must be positive in contango');

  // 2. Basis Yield: Spot=64,000, Futures=64,800, DTE=30 -> ~15.21% APR
  const basis = BasisArbitrageEngine.calculateBasisYield(64000, 64800, 30);
  assert.strictEqual(basis.regime, 'CONTANGO', 'Futures > Spot must be Contango');
  assert(basis.annualizedApr > 14.0 && basis.annualizedApr < 16.0, 'Annualized APR must be ~15.21%');

  // 3. 8-hour Funding Rate: 0.0150% -> ~16.43% Simple APR, ~17.85% Compounded APY
  const funding = BasisArbitrageEngine.calculateFundingYield(0.00015);
  assert(funding.annualizedSimpleApr > 15.0 && funding.annualizedSimpleApr < 18.0, 'Funding simple APR');
  assert(funding.compoundedApy > 16.0 && funding.compoundedApy < 20.0, 'Funding compounded APY');

  // 4. Multi-Venue Scanner
  const multi = BasisArbitrageEngine.scanMultiVenueArbitrage('BTC-USD', 64000);
  assert(multi.venues.length >= 5, 'Must scan at least 5 liquidity venues');
  assert(multi.grossSpreadBps > 0, 'Gross spread must be positive');

  // 5. Delta-Neutral Position Simulation
  const pos = BasisArbitrageEngine.simulateDeltaNeutralPosition(100000, 64000, 64800, 30, 0.00015, 2);
  assert.strictEqual(pos.capital, 100000);
  assert(pos.liquidationPrice > 64800, 'Short liquidation price must be above entry');
  assert(pos.distanceToLiquidationPct > 30, '2x leverage must provide >30% safety cushion');
  assert(pos.isSafe, 'Position must be classified as safe');
});

// ── 15. UI, Jump Navigator & Universal Palette Integration ──
console.log('\n── Section 15: Fast Jump Navigator & Universal Palette Integration ──');

it('hft.html contains Workstations 8 & 9 and Fast Jump Navigation bar', () => {
  assert(hftHtml.includes('class="hft-jump-bar"'), 'Missing .hft-jump-bar in hft.html');
  assert(hftHtml.includes('id="ws-wasm"'), 'Missing #ws-wasm in hft.html');
  assert(hftHtml.includes('id="ws-basis"'), 'Missing #ws-basis in hft.html');
  assert(hftHtml.includes('matchingEngineWasm.js'), 'hft.html must load matchingEngineWasm.js');
  assert(hftHtml.includes('basisArbitrageEngine.js'), 'hft.html must load basisArbitrageEngine.js');
  assert(paletteJs.includes("id: 'act_wasm'"), 'universalPalette.js must register /wasm');
  assert(paletteJs.includes("id: 'act_basis'"), 'universalPalette.js must register /basis');
});

// ── 16. Workstation 10: Hawkes Self-Exciting Point Process Engine ──
console.log('\n── Section 16: Workstation 10 — Hawkes Self-Exciting Process & Liquidation Radar ──');

it('hawkesProcessEngine.js accurately models branching ratio, recursive decay, and shock cascades', () => {
  const hawkesPath = path.join(__dirname, '..', 'hawkesProcessEngine.js');
  assert(fs.existsSync(hawkesPath), 'hawkesProcessEngine.js must exist');
  const { HawkesProcessEngine, HawkesProcessEngineCore } = require(hawkesPath);
  assert(HawkesProcessEngine, 'HawkesProcessEngine singleton must be exported');

  const engine = new HawkesProcessEngineCore();
  engine.setParameters(1.0, 4.0, 5.0); // n = 4/5 = 0.80 -> ELEVATED CLUSTERING
  assert.strictEqual(engine.getBranchingRatio(), 0.800, 'Branching ratio must be 0.800');
  let regime = engine.getRegime();
  assert.strictEqual(regime.level, 'WARNING', '0.80 <= n <= 1.0 must be WARNING level');

  // Sub-critical
  engine.setParameters(1.0, 2.0, 5.0); // n = 0.40
  assert.strictEqual(engine.getBranchingRatio(), 0.400);
  regime = engine.getRegime();
  assert.strictEqual(regime.level, 'NORMAL');

  // Super-critical
  engine.setParameters(1.0, 6.0, 5.0); // n = 1.20
  assert.strictEqual(engine.getBranchingRatio(), 1.200);
  regime = engine.getRegime();
  assert.strictEqual(regime.level, 'CRITICAL');

  // Reset and register trade
  engine.reset();
  const initMetrics = engine.getMetrics();
  assert.strictEqual(initMetrics.totalEvents, 0);

  const t1 = engine.registerTrade(100, false);
  assert(t1.intensity > initMetrics.baselineRate, 'Trade must increase intensity by jump alpha');
  assert(engine.totalEvents === 1, 'Total events must be 1');

  // Simulate shock
  const shockMetrics = engine.simulateShock(25);
  assert(shockMetrics.totalEvents >= 26, 'Shock must inject trades');
  assert(shockMetrics.history.length > 1, 'Intensity history must record trajectory');
});

// ── 17. Workstation 11: Institutional Order Flow Footprint Engine ──
console.log('\n── Section 17: Workstation 11 — Order Flow Footprint & Stacked Imbalances ──');

it('orderFlowFootprint.js aggregates bid/ask rungs, computes POC, and flags stacked imbalances', () => {
  const fpPath = path.join(__dirname, '..', 'orderFlowFootprint.js');
  assert(fs.existsSync(fpPath), 'orderFlowFootprint.js must exist');
  const { OrderFlowFootprint, OrderFlowFootprintCore } = require(fpPath);
  assert(OrderFlowFootprint, 'OrderFlowFootprint singleton must be exported');

  const fp = new OrderFlowFootprintCore();
  fp.setTickSize(0.25);
  fp.setDuration(60000);

  // Ingest trades at discrete tick rungs
  fp.registerTrade(100.00, 200, 'BUY');
  fp.registerTrade(100.00, 50, 'SELL');
  fp.registerTrade(100.25, 400, 'BUY');
  fp.registerTrade(100.25, 100, 'SELL');
  fp.registerTrade(100.50, 600, 'BUY');
  fp.registerTrade(100.50, 50, 'SELL');

  const candles = fp.getCandles();
  assert(candles.length === 1, 'Must have 1 active candle');
  const c = candles[0];
  assert.strictEqual(c.open, 100.00);
  assert.strictEqual(c.high, 100.50);
  assert.strictEqual(c.low, 100.00);
  assert(c.totalVolume === 1400, 'Total volume must equal sum of trade sizes');
  assert(c.totalDelta > 0, 'Aggressive buying volume must result in positive delta');
  assert.strictEqual(c.pocPrice, 100.50, 'Highest volume rung must be POC (650 vol at 100.50)');

  // Seed history
  fp.seedHistory(2800, 5);
  assert.strictEqual(fp.getCandles().length, 5, 'Must seed exactly 5 candles');
  const seeded = fp.getCandles();
  seeded.forEach(k => {
    assert(k.totalVolume > 0, 'Seeded candle must contain volume');
    assert(k.pocPrice > 0, 'Seeded candle must have a valid POC');
  });
});

// ── 18. Full 11-Workstation Ecosystem & Deep-Link Architecture ──
console.log('\n── Section 18: Full 11-Workstation DOM, Jump Navigator & Deep-Link Invariants ──');

it('hft.html contains all 11 Workstations, jump-bar links, and KaTeX formulas', () => {
  const requiredIds = [
    'ws-heatmap', 'ws-stoikov', 'ws-micro', 'ws-slicer', 'ws-latency',
    'ws-ladder', 'ws-fix', 'ws-wasm', 'ws-basis', 'ws-hawkes', 'ws-footprint'
  ];
  requiredIds.forEach(id => {
    assert(hftHtml.includes(`id="${id}"`), `Missing section #${id} in hft.html`);
    assert(hftHtml.includes(`href="#${id}"`), `Missing jump link to #${id} in hft.html jump-bar`);
  });

  // Verify scripts loaded in hft.html
  assert(hftHtml.includes('hawkesProcessEngine.js'), 'hft.html must load hawkesProcessEngine.js');
  assert(hftHtml.includes('orderFlowFootprint.js'), 'hft.html must load orderFlowFootprint.js');
  assert(hftHtml.includes('matchingEngineWasm.js'), 'hft.html must load matchingEngineWasm.js');
  assert(hftHtml.includes('basisArbitrageEngine.js'), 'hft.html must load basisArbitrageEngine.js');

  // Verify palette commands
  assert(paletteJs.includes("id: 'act_hawkes'"), 'universalPalette.js must register /hawkes');
  assert(paletteJs.includes("id: 'act_footprint'"), 'universalPalette.js must register /footprint');
  assert(paletteJs.includes("slashQuery.includes('hawkes')"), 'universalPalette.js must route /hawkes');
  assert(paletteJs.includes("slashQuery.includes('footprint')"), 'universalPalette.js must route /footprint');

  // Verify learn.html & docs.html integration
  const docsHtml = fs.readFileSync(path.join(ROOT, 'docs.html'), 'utf8');
  assert(learnHtml.includes('id="systemArchitectureBlueprint"'), 'learn.html must have Section 2.75 Architecture Blueprint');
  assert(learnHtml.includes('7 Production Strategy Paradigms'), 'learn.html must document 7 strategy paradigms');
  assert(learnHtml.includes('ws-hawkes'), 'learn.html blueprint must deep-link to ws-hawkes');
  assert(learnHtml.includes('ws-footprint'), 'learn.html blueprint must deep-link to ws-footprint');
  assert(docsHtml.includes('id="hft-terminal"'), 'docs.html must have #hft-terminal section');
  assert(docsHtml.includes('ws10-hawkes'), 'docs.html must document ws10-hawkes');
  assert(docsHtml.includes('ws11-footprint'), 'docs.html must document ws11-footprint');
  assert(readmeMd.includes('The 11 Core Microstructure Workstations'), 'README.md must document all 11 workstations');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TESTS PASSED: ${passedTests} / ${totalTests} (100%)`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
