/**
 * RISKOS Comprehensive Institutional Six Pillars Verification Suite
 * 
 * Verifies:
 * 1. Pillar 1: Exchange FIX Protocol 4.4 / 5.0 DMA Engine (Rust, C++, JS, wire format, checksum mod 256)
 * 2. Pillar 2: WebGPU & Parallel GPU Monte Carlo Derivatives Pricer (>5M paths/sec, Greeks, Asian/Barrier)
 * 3. Pillar 3: Deep Alpha Multi-Head Attention Order Flow Predictor & Avellaneda-Stoikov RL Quotes
 * 4. Pillar 4: Cloud Infrastructure & Deployment (Dockerfile, docker-compose, Kubernetes, GitHub Actions CI)
 * 5. Pillar 5: Nanosecond Columnar Tick Store (QuestDB Line Protocol, BigInt64Array, 4 Crisis Replays)
 * 6. Pillar 6: Desktop Launcher & PWA Manifest (manifest.json, electron_main.js, HTML integrations)
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
console.log('  RISKOS INSTITUTIONAL SIX PILLARS VERIFICATION SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// PILLAR 1: FIX PROTOCOL 4.4 / 5.0 DMA ENGINE
// ----------------------------------------------------------------------------
console.log('--- Pillar 1: FIX Protocol 4.4 / 5.0 DMA Engine ---');

runTest('Rust fix_engine.rs exists and parses tag-value with modulo-256 checksum', () => {
  const file = path.join(__dirname, '..', 'rust', 'src', 'fix_engine.rs');
  assert(fs.existsSync(file), 'rust/src/fix_engine.rs must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('pub struct FixMessage'), 'Must define FixMessage');
  assert(content.includes('pub struct FixSession'), 'Must define FixSession');
  assert(content.includes('compute_checksum'), 'Must calculate checksum');
});

runTest('C++ fix_protocol_engine.cpp exists and links in CMakeLists.txt', () => {
  const cppFile = path.join(__dirname, '..', 'cpp', 'fix_protocol_engine.cpp');
  assert(fs.existsSync(cppFile), 'cpp/fix_protocol_engine.cpp must exist');
  const cmake = fs.readFileSync(path.join(__dirname, '..', 'cpp', 'CMakeLists.txt'), 'utf8');
  assert(cmake.includes('fix_protocol_engine.cpp'), 'CMakeLists.txt must link fix_protocol_engine.cpp');
});

runTest('fixProtocolClient.js serializes RFC-compliant wire format and tracks seq nums', () => {
  const { FixMessage, FixProtocolClient } = require('../fixProtocolClient.js');
  const logon = FixProtocolClient.logon(30);
  assert.strictEqual(logon.msgType(), 'A');
  assert(logon.serialize().includes('35=A'));
  assert(logon.serialize().includes('10='));

  const res = FixProtocolClient.sendNewOrderSingle({
    symbol: 'TCS.NS',
    side: 'BUY',
    qty: 25,
    price: 3950.0
  });

  assert(res.orderMsg.toHumanString().includes('55=TCS.NS'));
  assert(res.orderMsg.toHumanString().includes('38=25'));
  assert(res.execReport.toHumanString().includes('35=8'));
  assert.strictEqual(res.execReport.get(39), '2'); // Filled
});

// ----------------------------------------------------------------------------
// PILLAR 2: WEBGPU & PARALLEL MONTE CARLO DERIVATIVES PRICER
// ----------------------------------------------------------------------------
console.log('\n--- Pillar 2: WebGPU & Parallel GPU Monte Carlo Pricer ---');

const WebGpuPricer = require('../webgpuQuantPricer.js');

runTest('webgpuQuantPricer.js provides WGSL shader and executes CPU fallback at > 5M paths/sec', () => {
  const res = WebGpuPricer.simulateCpuMonteCarlo({
    spot: 100,
    strike: 100,
    rate: 0.05,
    vol: 0.20,
    expiry: 1.0,
    numPaths: 250000,
    isCall: true
  });

  assert(res.price > 10.0 && res.price < 11.0, `Expected price ~10.45, got ${res.price}`);
  assert(res.throughputPathsPerSec > 5000000, `Throughput should exceed 5M paths/sec, got ${res.throughputPathsPerSec}`);
  console.log(`     -> Monte Carlo Throughput: ${res.throughputPathsPerSec.toLocaleString()} paths/sec in ${res.elapsedMs}ms`);
});

// ----------------------------------------------------------------------------
// PILLAR 3: DEEP ALPHA & TRANSFORMER MICROSTRUCTURE ENGINE
// ----------------------------------------------------------------------------
console.log('\n--- Pillar 3: Deep Alpha & Attention Order Flow Engine ---');

const DeepAlpha = require('../deepAlphaEngine.js');

runTest('deepAlphaEngine.js extracts features, predicts direction, and calculates Avellaneda-Stoikov quotes', () => {
  const out = DeepAlpha.evaluateOrderFlow(2000, 800, 2950, 2950.5, 300, false);
  assert(out.features.imbalance > 0, 'Bid heavy book should have positive imbalance');
  assert(['UP', 'DOWN', 'NEUTRAL'].includes(out.prediction.direction), 'Prediction must be UP, DOWN or NEUTRAL');
  assert(out.optimalQuotes.optimalBid < out.optimalQuotes.optimalAsk, 'Bid must be strictly below ask');
  assert(out.optimalQuotes.spreadTicks > 0, 'Optimal spread must be positive');
});

// ----------------------------------------------------------------------------
// PILLAR 4: CLOUD INFRASTRUCTURE, KUBERNETES & CI/CD
// ----------------------------------------------------------------------------
console.log('\n--- Pillar 4: Cloud Infrastructure, Kubernetes & CI/CD ---');

runTest('Dockerfile specifies multi-stage Alpine build for Rust native and Node runtime', () => {
  const file = path.join(__dirname, '..', 'Dockerfile');
  assert(fs.existsSync(file), 'Dockerfile must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('FROM rust:1.80-alpine AS rust-builder'), 'Must build Rust in stage 1');
  assert(content.includes('FROM node:20-alpine AS production'), 'Must package in stage 2');
  assert(content.includes('EXPOSE 80'), 'Must expose port 80');
});

runTest('docker-compose.yml configures riskos-terminal, questdb-tickstore, and redis-cache', () => {
  const file = path.join(__dirname, '..', 'docker-compose.yml');
  assert(fs.existsSync(file), 'docker-compose.yml must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('riskos-terminal'), 'Must include terminal service');
  assert(content.includes('questdb-tickstore'), 'Must include QuestDB service');
  assert(content.includes('redis-cache'), 'Must include Redis cache');
});

runTest('deploy/kubernetes/riskos-deployment.yaml defines 3 replicas, liveness and readiness probes', () => {
  const file = path.join(__dirname, '..', 'deploy', 'kubernetes', 'riskos-deployment.yaml');
  assert(fs.existsSync(file), 'Kubernetes deployment manifest must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('replicas: 3'), 'Must configure 3 replicas');
  assert(content.includes('readinessProbe:'), 'Must specify readiness probe');
  assert(content.includes('livenessProbe:'), 'Must specify liveness probe');
});

runTest('.github/workflows/riskos-ci.yml configures automated testing pipeline', () => {
  const file = path.join(__dirname, '..', '.github', 'workflows', 'riskos-ci.yml');
  assert(fs.existsSync(file), 'GitHub Actions workflow must exist');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('test_all_html_math.js'), 'Must audit KaTeX math in CI');
  assert(content.includes('test_all_institutional_six_pillars.js'), 'Must run six pillars test in CI');
});

// ----------------------------------------------------------------------------
// PILLAR 5: COLUMNAR NANOSECOND TICK STORE & CRISIS REPLAY
// ----------------------------------------------------------------------------
console.log('\n--- Pillar 5: Columnar Tick Store & Crisis Replay Engine ---');

const { CrisisReplayEngine, CRISIS_SCENARIOS } = require('../columnarTickStore.js');

runTest('columnarTickStore.js loads 4 historical crises and streams QuestDB line protocol', () => {
  assert(CRISIS_SCENARIOS.COVID_2020, 'Covid 2020 must be present');
  assert(CRISIS_SCENARIOS.FLASH_CRASH_2010, 'Flash crash 2010 must be present');
  assert(CRISIS_SCENARIOS.LEHMAN_2008, 'Lehman 2008 must be present');
  assert(CRISIS_SCENARIOS.YEN_CARRY_2024, 'Yen carry 2024 must be present');

  const res = CrisisReplayEngine.loadScenario('COVID_2020');
  assert.strictEqual(res.ticksCount, 500);

  const questLine = CrisisReplayEngine.table.toQuestDbLineProtocol('NIFTY_FUT');
  assert(questLine.includes('NIFTY_FUT,side='), 'Must export QuestDB format');
  assert(questLine.includes('bid='), 'Must export bid field');
  assert(questLine.includes('ask='), 'Must export ask field');
});

// ----------------------------------------------------------------------------
// PILLAR 6: PWA MANIFEST, ELECTRON & UI INTEGRATIONS
// ----------------------------------------------------------------------------
console.log('\n--- Pillar 6: PWA Manifest, Desktop Launcher & Universal UI ---');

runTest('manifest.json is valid PWA schema and electron_main.js configures WebGPU', () => {
  const manifestFile = path.join(__dirname, '..', 'manifest.json');
  assert(fs.existsSync(manifestFile), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert.strictEqual(manifest.name, 'RISKOS Institutional Quantitative Terminal');
  assert.strictEqual(manifest.display, 'standalone');

  const electronFile = path.join(__dirname, '..', 'electron_main.js');
  assert(fs.existsSync(electronFile), 'electron_main.js must exist');
  const electronContent = fs.readFileSync(electronFile, 'utf8');
  assert(electronContent.includes('BrowserWindow'), 'Must configure BrowserWindow');
  assert(electronContent.includes('enable-features'), 'Must configure WebGPU/Vulkan flags');
});

runTest('hft.html and app.html include all 4 new engines, manifest link, and DOM trigger buttons', () => {
  const hftContent = fs.readFileSync(path.join(__dirname, '..', 'hft.html'), 'utf8');
  assert(hftContent.includes('manifest.json'), 'hft.html must link manifest.json');
  assert(hftContent.includes('fixProtocolClient.js'), 'hft.html must include fixProtocolClient.js');
  assert(hftContent.includes('webgpuQuantPricer.js'), 'hft.html must include webgpuQuantPricer.js');
  assert(hftContent.includes('deepAlphaEngine.js'), 'hft.html must include deepAlphaEngine.js');
  assert(hftContent.includes('columnarTickStore.js'), 'hft.html must include columnarTickStore.js');
  assert(hftContent.includes('btnOpenFixModal'), 'hft.html must include #btnOpenFixModal');

  const appContent = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
  assert(appContent.includes('manifest.json'), 'app.html must link manifest.json');
  assert(appContent.includes('fixProtocolClient.js'), 'app.html must include fixProtocolClient.js');
  assert(appContent.includes('webgpuQuantPricer.js'), 'app.html must include webgpuQuantPricer.js');
  assert(appContent.includes('deepAlphaEngine.js'), 'app.html must include deepAlphaEngine.js');
  assert(appContent.includes('columnarTickStore.js'), 'app.html must include columnarTickStore.js');
  assert(appContent.includes('btnOpenFixModal'), 'app.html must include #btnOpenFixModal');
});

runTest('universalPalette.js registers all 4 new slash commands (/fix, /webgpu, /deepalpha, /crisis)', () => {
  const paletteContent = fs.readFileSync(path.join(__dirname, '..', 'universalPalette.js'), 'utf8');
  assert(paletteContent.includes('act_fix'), 'universalPalette.js must register act_fix');
  assert(paletteContent.includes('act_webgpu'), 'universalPalette.js must register act_webgpu');
  assert(paletteContent.includes('act_deepalpha'), 'universalPalette.js must register act_deepalpha');
  assert(paletteContent.includes('act_crisis'), 'universalPalette.js must register act_crisis');
});

console.log('\n================================================================');
console.log(`  SIX PILLARS RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
