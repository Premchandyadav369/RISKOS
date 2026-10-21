/**
 * RISKOS PREM-Alpha Proprietary Algorithm & Lab Verification Suite
 * ==============================================================================
 * Comprehensive mathematical invariant tests, Hawkes cascade attenuation tests,
 * Monte Carlo backtest validation, KaTeX equation parsing, and UI integrations.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const PremAlphaEngine = require('../premAlphaEngine.js');
const LearnMathEngine = require('../learnMathEngine.js');

console.log('================================================================');
console.log('  RISKOS PREM-ALPHA PROPRIETARY ALGORITHM & LAB TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
  }
}

// ── 1. Mathematical Invariants of PREM-Alpha Engine ──────────────────────────
console.log('--- 1. Mathematical Core & Invariants (premAlphaEngine.js) ---');

it('Computes valid PREM-Alpha with positive drift in Bull regime + positive OFI', () => {
  const res = PremAlphaEngine.computePremAlpha({
    midPrice: 1250.0,
    regimeProbs: [0.80, 0.05, 0.15], // Dominant Bull
    ofi: 0.60,
    hawkesEta: 0.20,
    inventory: 0
  });

  assert.strictEqual(res.engine, 'PREM-Alpha');
  assert.ok(res.alpha.basisPoints > 10.0, `Expected alpha > 10 bps, got ${res.alpha.basisPoints}`);
  assert.strictEqual(res.alpha.signal, 'PREM_STRONG_ALPHA_BUY');
  assert.ok(res.quoting.optimalBid < res.quoting.reservationPrice, 'Bid must be below reservation price');
  assert.ok(res.quoting.optimalAsk > res.quoting.reservationPrice, 'Ask must be above reservation price');
  assert.ok(res.quoting.optimalAsk > res.quoting.optimalBid, 'Ask must be strictly greater than Bid');
});

it('Lower queue Shannon entropy (concentrated order book) amplifies alpha drift', () => {
  // Uniform / diffuse order book depth (high entropy)
  const resDiffuse = PremAlphaEngine.computePremAlpha({
    midPrice: 1000.0,
    regimeProbs: [0.50, 0.20, 0.30],
    ofi: 0.50,
    bidVolumes: [1000, 1000, 1000, 1000, 1000],
    askVolumes: [1000, 1000, 1000, 1000, 1000],
    hawkesEta: 0.20
  });

  // Concentrated order book at the touch (low entropy / coiled queue)
  const resCoiled = PremAlphaEngine.computePremAlpha({
    midPrice: 1000.0,
    regimeProbs: [0.50, 0.20, 0.30],
    ofi: 0.50,
    bidVolumes: [8000, 500, 200, 100, 50],
    askVolumes: [8000, 500, 200, 100, 50],
    hawkesEta: 0.20
  });

  assert.ok(resCoiled.microstructure.avgNormalizedEntropy < resDiffuse.microstructure.avgNormalizedEntropy,
    'Coiled entropy should be lower than diffuse entropy');
  assert.ok(resCoiled.microstructure.entropyMultiplier > resDiffuse.microstructure.entropyMultiplier,
    'Coiled multiplier should be higher than diffuse multiplier');
  assert.ok(resCoiled.alpha.basisPoints > resDiffuse.alpha.basisPoints,
    'Coiled alpha should exceed diffuse alpha due to coiled queue pressure');
});

it('Hawkes supercritical jump ratio (eta >= 0.85) dampens alpha and triggers PREM_HAWKES_SHUTDOWN', () => {
  const resStable = PremAlphaEngine.computePremAlpha({
    midPrice: 1200.0,
    regimeProbs: [0.70, 0.10, 0.20],
    ofi: 0.50,
    hawkesEta: 0.30 // Stable arrivals
  });

  const resCascade = PremAlphaEngine.computePremAlpha({
    midPrice: 1200.0,
    regimeProbs: [0.70, 0.10, 0.20],
    ofi: 0.50,
    hawkesEta: 0.95 // Supercritical flash crash cascade
  });

  assert.strictEqual(resCascade.microstructure.isCascadeHazard, true);
  assert.strictEqual(resCascade.alpha.signal, 'PREM_HAWKES_SHUTDOWN');
  assert.ok(resCascade.alpha.hawkesAttenuation < 0.45, `Attenuation should be < 0.45, got ${resCascade.alpha.hawkesAttenuation}`);
  assert.ok(resCascade.quoting.spreadBps > resStable.quoting.spreadBps, 'Spread should widen during jump cascade');
});

it('Avellaneda-Stoikov inventory penalty skews reservation price downward when long and upward when short', () => {
  const resFlat = PremAlphaEngine.computePremAlpha({ midPrice: 1000.0, inventory: 0 });
  const resLong = PremAlphaEngine.computePremAlpha({ midPrice: 1000.0, inventory: 5 });
  const resShort = PremAlphaEngine.computePremAlpha({ midPrice: 1000.0, inventory: -5 });

  assert.ok(resLong.quoting.reservationPrice < resFlat.quoting.reservationPrice,
    'Long inventory must penalize reservation price downward to deter buying');
  assert.ok(resShort.quoting.reservationPrice > resFlat.quoting.reservationPrice,
    'Short inventory must shift reservation price upward to deter selling');
});

// ── 2. Simulation & Monte Carlo Backtester ───────────────────────────────────
console.log('\n--- 2. Simulation & Monte Carlo Backtester ---');

it('Runs 100-tick Monte Carlo replay and outputs valid quantitative performance metrics', () => {
  const sim = PremAlphaEngine.simulatePremExecution({
    numTicks: 100,
    initialPrice: 1000.0,
    initialCapital: 1000000.0,
    marketScenario: 'DYNAMIC'
  });

  assert.strictEqual(sim.ticks, 100);
  assert.strictEqual(sim.pnlSeries.length, 100);
  assert.strictEqual(sim.priceSeries.length, 100);
  assert.ok(typeof sim.finalPnl === 'number' && !isNaN(sim.finalPnl));
  assert.ok(typeof sim.sharpeRatio === 'number' && !isNaN(sim.sharpeRatio) && sim.sharpeRatio > 0);
  assert.ok(typeof sim.winRatePct === 'number' && sim.winRatePct >= 0 && sim.winRatePct <= 100);
  assert.ok(sim.totalTrades > 0, 'Backtest must execute active trades');
});

it('Flash crash crisis scenario demonstrates Hawkes jump defense avoiding toxic adverse fills', () => {
  const simCrash = PremAlphaEngine.simulatePremExecution({
    numTicks: 80,
    marketScenario: 'CRISIS_CASCADE'
  });

  assert.ok(simCrash.avoidedCascades > 0, `Expected avoided cascades > 0, got ${simCrash.avoidedCascades}`);
});

// ── 3. Python Backend Parity & REST Endpoints ────────────────────────────────
console.log('\n--- 3. Python Backend Parity & REST Endpoints ---');

it('backend/engine/proprietary_algorithms.py contains compute_prem_alpha function', () => {
  const pyCode = fs.readFileSync(path.join(__dirname, '..', 'backend', 'engine', 'proprietary_algorithms.py'), 'utf8');
  assert.ok(pyCode.includes('def compute_prem_alpha('), 'Missing compute_prem_alpha in python engine');
  assert.ok(pyCode.includes('"engine": "PREM-Alpha"'), 'Missing PREM-Alpha engine identifier');
});

it('backend/api/main.py exposes GET /api/quant/prem-alpha endpoint', () => {
  const apiCode = fs.readFileSync(path.join(__dirname, '..', 'backend', 'api', 'main.py'), 'utf8');
  assert.ok(apiCode.includes('@app.get("/api/quant/prem-alpha")'), 'Missing /api/quant/prem-alpha endpoint');
  assert.ok(apiCode.includes('compute_prem_alpha'), 'Missing compute_prem_alpha call in endpoint');
});

// ── 4. Academy & Curriculum Integration (learnMathEngine.js & learn.js) ──────
console.log('\n--- 4. Academy & Curriculum Integration ---');

it('learnMathEngine.js includes prem_alpha as Flagship Lab 81 and executes with zero KaTeX errors', () => {
  const mod = LearnMathEngine.MODULES_DIRECTORY.find(m => m.id === 'prem_alpha');
  assert.ok(mod, 'Missing prem_alpha module in MODULES_DIRECTORY');
  assert.strictEqual(mod.badge, 'Flagship Algo (Prem)');

  const res = mod.calc(mod.defaultInputs, 'INR');
  assert.ok(res.focalValue.includes('bps'), 'Focal value must format bps');
  assert.ok(res.chart && res.chart.datasets.length === 3, 'Chart must contain 3 datasets');

  // Validate KaTeX expressions
  const cleanEq = res.equationLatex.replace(/^\\\[/, '').replace(/\\\]$/, '').trim();
  const cleanSub = res.substitutedLatex.replace(/^\\\[/, '').replace(/\\\]$/, '').trim();

  const eqHtml = katex.renderToString(cleanEq, { throwOnError: true });
  const subHtml = katex.renderToString(cleanSub, { throwOnError: true });
  assert.ok(eqHtml.length > 50, 'KaTeX equation render must be non-empty');
  assert.ok(subHtml.length > 50, 'KaTeX substituted render must be non-empty');
});

it('learn.js contains prem_flagship_alpha in STRUCTURED_TRACKS and COURSE_LIVE_CONFIGS', () => {
  const learnCode = fs.readFileSync(path.join(__dirname, '..', 'learn.js'), 'utf8');
  assert.ok(learnCode.includes("id: 'prem_flagship_alpha'"), 'Missing prem_flagship_alpha in STRUCTURED_TRACKS');
  assert.ok(learnCode.includes("prem_flagship_alpha: {"), 'Missing prem_flagship_alpha in COURSE_LIVE_CONFIGS');
});

// ── 5. Universal Palette & UI Workbench Integration ──────────────────────────
console.log('\n--- 5. Universal Palette & UI Workbench Integration ---');

it('universalPalette.js registers act_prem and matches /prem slash command', () => {
  const palCode = fs.readFileSync(path.join(__dirname, '..', 'universalPalette.js'), 'utf8');
  assert.ok(palCode.includes("id: 'act_prem'"), 'Missing act_prem in universalPalette catalog');
  assert.ok(palCode.includes("slashQuery.includes('prem')"), 'Missing /prem slash command handler');
});

it('premAlphaLab.js defines PremAlphaLab with openModal and tab rendering', () => {
  const lab = require('../premAlphaLab.js');
  assert.ok(lab, 'premAlphaLab should export instance');
  assert.strictEqual(typeof lab.openModal, 'function');
  assert.strictEqual(typeof lab.renderTab, 'function');
});

it('HTML pages (learn.html, app.html, hft.html) include PREM-Alpha stylesheets and scripts', () => {
  ['learn.html', 'app.html', 'hft.html'].forEach(page => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    assert.ok(html.includes('premAlphaLab.css'), `${page} must include premAlphaLab.css`);
    assert.ok(html.includes('premAlphaEngine.js'), `${page} must include premAlphaEngine.js`);
    assert.ok(html.includes('premAlphaLab.js'), `${page} must include premAlphaLab.js`);
  });

  const learnHtml = fs.readFileSync(path.join(__dirname, '..', 'learn.html'), 'utf8');
  assert.ok(learnHtml.includes('prem-flagship-hero-banner'), 'learn.html must render Flagship Hero Banner');
  assert.ok(learnHtml.includes('P.R.E.M. — Predictive Regime &amp; Entropy Micro-Alpha Engine'), 'learn.html must feature PREM');
});

console.log('\n================================================================');
console.log(`  PREM-ALPHA RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests < totalTests) {
  process.exit(1);
}
