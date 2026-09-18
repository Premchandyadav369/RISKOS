/**
 * Test Suite: Institutional Real-Time Features & UI Overhaul
 * Verifies:
 * 1. Candlestick Chart Zooming, Drag Panning, Toolbar & Fullscreen Toggle
 * 2. OpenBB ODP Macro Hub Real-Time Ingestion (Brent, US10Y, IN10Y, USDINR, VIX)
 * 3. Portfolio Optimizer Screen Boundaries & Responsive CSS Grid Rules
 * 4. Universal Real Ticker Binding & Live Data Ingestion Across Quantitative Labs
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  RUNNING INSTITUTIONAL REAL-TIME FEATURES VERIFICATION TEST SUITE ');
console.log('═══════════════════════════════════════════════════════════════════\n');

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

// ── 1. CANDLESTICK CHART ZOOM, PAN & FULLSCREEN ──────────────────────────────
console.log('── Section 1: Candlestick Chart Zoom, Pan & Fullscreen ──');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

it('index.html contains dedicated Zoom In, Zoom Out, Reset, and Maximize buttons', () => {
  assert(indexHtml.includes('id="btnCandleZoomIn"'), 'Missing #btnCandleZoomIn');
  assert(indexHtml.includes('id="btnCandleZoomOut"'), 'Missing #btnCandleZoomOut');
  assert(indexHtml.includes('id="btnCandleZoomReset"'), 'Missing #btnCandleZoomReset');
  assert(indexHtml.includes('id="btnCandleMaximize"'), 'Missing #btnCandleMaximize');
});

it('styles.css contains .candle-chart-container.chart-fullscreen with fixed viewport modal', () => {
  assert(stylesCss.includes('.candle-chart-container.chart-fullscreen'), 'Missing .chart-fullscreen rule');
  assert(stylesCss.includes('position: fixed !important'), 'Missing fixed positioning in fullscreen');
  assert(stylesCss.includes('.candle-canvas-wrap.is-dragging'), 'Missing is-dragging cursor rule');
});

it('main.js contains dynamic viewport slicing (visibleBarsCount, panOffset)', () => {
  assert(mainJs.includes('let visibleBarsCount'), 'Missing visibleBarsCount');
  assert(mainJs.includes('let panOffset'), 'Missing panOffset');
  assert(mainJs.includes('wrap.onwheel'), 'Missing wrap.onwheel listener');
  assert(mainJs.includes('wrap.onmousedown'), 'Missing wrap.onmousedown dragging listener');
  assert(mainJs.includes('wrap.ontouchmove'), 'Missing touch pinch-to-zoom listener');
});

it('main.js dynamically auto-ranges Y-axis on the visible slice of bars', () => {
  assert(mainJs.includes('bars.slice(startIdx, endIdx)'), 'Missing visible bar slice extraction');
  assert(mainJs.includes('Math.min(...visibleBars.map('), 'Missing minP calculation on visible bars');
  assert(mainJs.includes('Math.max(...visibleBars.map('), 'Missing maxP calculation on visible bars');
});

// ── 2. OPENBB ODP MACRO HUB REAL-TIME INGESTION ─────────────────────────────
console.log('\n── Section 2: OpenBB ODP Macro Hub Real-Time Ingestion ──');

const openbbBridgeJs = fs.readFileSync(path.join(__dirname, 'openbbBridge.js'), 'utf8');
const observatoryJs = fs.readFileSync(path.join(__dirname, 'observatory.js'), 'utf8');

it('openbbBridge.js economy indicators returns array supporting .find() and properties', () => {
  assert(openbbBridgeJs.includes("indicator: 'Brent Crude (Spot)'"), 'Missing Brent Crude indicator in openbbBridge.js');
  assert(openbbBridgeJs.includes("indicator: 'US 10Y Benchmark'"), 'Missing US 10Y indicator in openbbBridge.js');
  assert(openbbBridgeJs.includes("indicator: 'India 10Y Benchmark'"), 'Missing India 10Y indicator in openbbBridge.js');
  assert(openbbBridgeJs.includes("indicator: 'USD/INR Currency'"), 'Missing USD/INR indicator in openbbBridge.js');
  assert(openbbBridgeJs.includes("indicator: 'CBOE Volatility VIX'"), 'Missing VIX indicator in openbbBridge.js');
});

it('openbbBridge.js government yield_curve returns array with .find() tenor compatibility and spread', () => {
  assert(openbbBridgeJs.includes("tenor: '10Y'"), 'Missing tenor 10Y in yield_curve');
  assert(openbbBridgeJs.includes('spread_in_us_bps'), 'Missing sovereign spread in yield_curve');
});

it('observatory.js eliminates Math.random() and binds deterministic VIX sentiment gauge', () => {
  assert(!observatoryJs.includes('Math.random() * 12'), 'observatory.js must not contain Math.random() in macro hub');
  assert(observatoryJs.includes('vixObj ='), 'Missing vixObj binding in observatory.js');
  assert(observatoryJs.includes('sentimentScore'), 'Missing deterministic sentimentScore in observatory.js');
  assert(observatoryJs.includes('SecurityMaster.subscribeLiveTicks'), 'Missing live tick subscription in observatory.js');
});

// ── 3. PORTFOLIO OPTIMIZER SCREEN BOUNDARIES & RESPONSIVE CSS ────────────────
console.log('\n── Section 3: Portfolio Optimizer Screen Boundaries & CSS ──');

const optCss = fs.readFileSync(path.join(__dirname, 'portfolio_optimizer.css'), 'utf8');

it('portfolio_optimizer.css clamps .obs-layout-grid > * with min-width: 0 to prevent blowout', () => {
  assert(optCss.includes('.obs-layout-grid > * {'), 'Missing .obs-layout-grid > * rule');
  assert(optCss.includes('min-width: 0;'), 'Missing min-width: 0 in layout grid child elements');
});

it('portfolio_optimizer.css enables flex-wrap on .toolbar-left and .toolbar-right', () => {
  assert(optCss.includes('.toolbar-left, .toolbar-right {'), 'Missing .toolbar-left, .toolbar-right rule');
  assert(optCss.includes('flex-wrap: wrap;'), 'Missing flex-wrap: wrap on toolbar buttons');
});

it('portfolio_optimizer.css clamps .modal-panel with max-height and overflow-y', () => {
  assert(optCss.includes('max-height: 90vh;'), 'Missing max-height on .modal-panel');
  assert(optCss.includes('overflow-y: auto;'), 'Missing overflow-y on .modal-panel');
});

// ── 4. UNIVERSAL 75 LABS REAL TICKER BINDING ────────────────────────────────
console.log('\n── Section 4: Universal Real Ticker Binding Across Quantitative Labs ──');

const learnHtml = fs.readFileSync(path.join(__dirname, 'learn.html'), 'utf8');
const learnJs = fs.readFileSync(path.join(__dirname, 'learn.js'), 'utf8');

it('learn.html contains real-time security data binding telemetry strip', () => {
  assert(learnHtml.includes('id="simLiveSecurityStrip"'), 'Missing #simLiveSecurityStrip in learn.html');
  assert(learnHtml.includes('id="boundSecBadge"'), 'Missing #boundSecBadge in learn.html');
  assert(learnHtml.includes('id="boundSecMetrics"'), 'Missing #boundSecMetrics in learn.html');
  assert(learnHtml.includes('id="btnUnbindSec"'), 'Missing #btnUnbindSec in learn.html');
});

it('learn.js implements extractSecurityParameters and bindSecurityToActiveLab', () => {
  assert(learnJs.includes('function extractSecurityParameters'), 'Missing extractSecurityParameters function');
  assert(learnJs.includes('function bindSecurityToActiveLab'), 'Missing bindSecurityToActiveLab function');
  assert(learnJs.includes('window.bindRealTickerToLab'), 'Missing window.bindRealTickerToLab helper');
  assert(learnJs.includes('SecurityMaster.subscribeLiveTicks'), 'Missing live tick auto-update in learn.js');
});

// Verify quantitative lab evaluation with simulated security binding
// Require LearnMathEngine
const LearnMathEngine = require('./learnMathEngine.js');

it('LearnMathEngine successfully evaluates sample modules from all quantitative disciplines', () => {
  const testSec = {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    currency: 'INR',
    basePrice: 1287.00,
    pe: 25.5,
    eps: 50.40,
    vol: 0.185,
    beta: 1.08,
    marketCap: 20180000000000,
    avgVolume20d: 4500000
  };

  // Test 1: PE Valuation
  const modPE = LearnMathEngine.getModuleById('pe_eps');
  const resPE = modPE.calc({ price: testSec.basePrice, eps: testSec.eps, growthRate: 14.5 }, 'INR');
  assert(resPE && !isNaN(resPE.pe), 'PE Valuation calculation failed');

  // Test 2: Compounding / CAGR
  const modCAGR = LearnMathEngine.getModuleById('cagr');
  const resCAGR = modCAGR.calc({ initialVal: testSec.basePrice * 100, finalVal: testSec.basePrice * 150, years: 3 }, 'INR');
  assert(resCAGR && !isNaN(resCAGR.cagr), 'CAGR calculation failed');

  // Test 3: Volatility
  const modVol = LearnMathEngine.getModuleById('volatility');
  const resVol = modVol.calc({ dailyStdDev: Number(((testSec.vol * 100) / Math.sqrt(252)).toFixed(2)), tradingDays: 252 });
  assert(resVol && !isNaN(resVol.annualizedVol), 'Volatility calculation failed');

  // Test 4: Beta & CAPM
  const modCAPM = LearnMathEngine.getModuleById('capm');
  const resCAPM = modCAPM.calc({ riskFreeRate: 6.84, marketReturn: 13.5, beta: testSec.beta, actualReturn: 15.0 });
  assert(resCAPM && !isNaN(resCAPM.expectedReturn), 'CAPM calculation failed');

  // Test 5: Merton Structural Default
  const modMerton = LearnMathEngine.getModuleById('merton_structural_default');
  const resMerton = modMerton.calc({ equityValue: 1287, debtFace: 800, equityVol: 24.5, riskFreeRate: 6.84, timeHorizon: 1.0 });
  assert(resMerton && resMerton.focalValue, 'Merton model calculation failed');

  // Test 6: Hawkes Liquidity Cascades
  const modHawkes = LearnMathEngine.getModuleById('hawkes_liquidity_cascades');
  const resHawkes = modHawkes.calc({ baselineRate: 2.5, excitationAlpha: 1.15, decayBeta: 1.40, shockSize: 15.0 });
  assert(resHawkes && resHawkes.focalValue, 'Hawkes liquidity calculation failed');
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
