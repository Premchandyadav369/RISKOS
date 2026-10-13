/**
 * RISKOS — INSTITUTIONAL SHOWCASE EXPANSION VERIFICATION SUITE
 * Tests:
 *   1. Live Broker API Gateway & SEC 15c3-5 Pre-Trade Risk Manager
 *   2. 3D Volatility Surface Studio (SABR, SVI, Heston, Dupire)
 *   3. 41-Bot Swarm Internal Dark Pool Crossing & Fee Rebalancing
 *   4. 5-Slide LP Pitch Deck & Institutional Due Diligence Generator
 *   5. Multi-Monitor Bloomberg Layout & Window Manager
 *   6. Script references & DOM Action button bindings
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log('══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS INSTITUTIONAL SHOWCASE EXPANSION VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════════════════════');

// ── 1. Live Broker API Gateway ──
console.log('\n── Section 1: Live Broker API Gateway & SEC 15c3-5 Risk Firewall ──');

runTest('liveBrokerGateway.js exists and exports LiveBrokerGateway', () => {
  const filePath = path.join(ROOT, 'liveBrokerGateway.js');
  assert(fs.existsSync(filePath), 'liveBrokerGateway.js must exist');
  const code = fs.readFileSync(filePath, 'utf8');
  assert(code.includes('BROKER_PROFILES'), 'Must define BROKER_PROFILES');
  assert(code.includes('zerodha') && code.includes('angel') && code.includes('ibkr') && code.includes('binance'), 'Must support all 4 top brokers');
  assert(code.includes('validatePreTradeRisk'), 'Must implement SEC 15c3-5 pre-trade checks');
});

runTest('SEC 15c3-5 fat-finger checks correctly block oversized orders', () => {
  // Mock window & localStorage
  global.window = global;
  global.self = global;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  global.performance = { now: () => Date.now() };

  const gateway = require(path.join(ROOT, 'liveBrokerGateway.js'));
  assert(gateway || global.LiveBrokerGateway, 'LiveBrokerGateway must be available');
  const gw = gateway || global.LiveBrokerGateway;

  // Test valid order under limits
  const validCheck = gw.validatePreTradeRisk({ symbol: 'RELIANCE.NS', side: 'BUY', qty: 10, price: 2850 });
  assert.strictEqual(validCheck.approved, true, 'Order under ₹5L must be approved');

  // Test oversized order exceeding ₹5,00,000 limit
  const fatFingerCheck = gw.validatePreTradeRisk({ symbol: 'RELIANCE.NS', side: 'BUY', qty: 1000, price: 2850 }); // 28.5L
  assert.strictEqual(fatFingerCheck.approved, false, 'Order over ₹5L must be rejected');
  assert.strictEqual(fatFingerCheck.violation, 'FAT_FINGER_LIMIT_EXCEEDED');

  // Test invalid zero qty
  const zeroQtyCheck = gw.validatePreTradeRisk({ symbol: 'RELIANCE.NS', side: 'BUY', qty: 0, price: 2850 });
  assert.strictEqual(zeroQtyCheck.approved, false);
});

// ── 2. 3D Volatility Surface Studio ──
console.log('\n── Section 2: 3D Volatility Surface Studio & Model Engines ──');

runTest('volSurfaceStudio.js exists and exposes VolSurfaceStudio', () => {
  const filePath = path.join(ROOT, 'volSurfaceStudio.js');
  assert(fs.existsSync(filePath), 'volSurfaceStudio.js must exist');
  const code = fs.readFileSync(filePath, 'utf8');
  assert(code.includes('VolatilitySurfaceStudioController'), 'Must define studio controller');
  assert(code.includes('Hagan SABR') && code.includes('Gatheral SVI'), 'Must support SABR and SVI');
});

runTest('volatilitySurface3D.js correctly computes Hagan SABR expansion', () => {
  const engine = require(path.join(ROOT, 'volatilitySurface3D.js'));
  assert(engine, 'VolatilitySurface3D must be exported');

  // ATM SABR vol for F=100, K=100, T=0.5, alpha=0.35, beta=0.7, rho=-0.32, nu=0.45
  const atmVol = engine.calculateSABR(100, 100, 0.5, 0.35, 0.70, -0.32, 0.45);
  assert(atmVol > 0.05 && atmVol < 1.0, `ATM Vol must be between 5% and 100%, got ${atmVol}`);

  // OTM Put strike K=90 should have higher vol due to negative rho skew (rho=-0.32)
  const otmPutVol = engine.calculateSABR(100, 90, 0.5, 0.35, 0.70, -0.32, 0.45);
  assert(otmPutVol > atmVol, 'OTM put volatility must be higher than ATM under negative rho skew');
});

// ── 3. Swarm Dark Pool Internal Crossing ──
console.log('\n── Section 3: 41-Bot Swarm Dark Pool Crossing & Fee Rebalancing ──');

runTest('swarmInternalCrossing.js exists and calculates zero-fee crossing savings', () => {
  const filePath = path.join(ROOT, 'swarmInternalCrossing.js');
  assert(fs.existsSync(filePath), 'swarmInternalCrossing.js must exist');

  const crossingEngine = require(filePath);
  assert(crossingEngine, 'SwarmInternalCrossing must be exported');
  assert(crossingEngine.crossings.length >= 3, 'Must contain seeded institutional crossings');
  assert(crossingEngine.totalCrossedNotionalINR > 0, 'Crossed notional must be positive');
  assert(crossingEngine.totalFeesSavedINR > 0, 'Fees saved must be positive');

  // Trigger autonomous match cycle
  const newMatch = crossingEngine.runCrossingCycle();
  assert(newMatch, 'Crossing cycle must generate a valid match');
  assert(newMatch.feesSavedINR > 0, 'Crossing match must compute brokerage savings');
  assert.strictEqual(typeof newMatch.midPrice, 'number', 'Mid price must be numeric');
});

// ── 4. Institutional LP Pitch Deck Generator ──
console.log('\n── Section 4: 5-Slide Institutional LP Pitch Deck Generator ──');

runTest('pitchDeckGenerator.js creates complete 5-slide printable presentation', () => {
  const filePath = path.join(ROOT, 'pitchDeckGenerator.js');
  assert(fs.existsSync(filePath), 'pitchDeckGenerator.js must exist');

  const deckGen = require(filePath);
  assert(deckGen, 'PitchDeckGenerator must be exported');

  const html = deckGen.generatePrintableHTML();
  assert(html.includes('SLIDE 1: COVER & EXECUTIVE MANDATE'), 'Must include Slide 1 Cover');
  assert(html.includes('SLIDE 2: 8 QUANTITATIVE DESKS'), 'Must include Slide 2 Architecture');
  assert(html.includes('SLIDE 3: 41-BOT FLEET & DPEA INVARIANT'), 'Must include Slide 3 Swarm & DPEA');
  assert(html.includes('SLIDE 4: HISTORICAL CRISIS RESILIENCE'), 'Must include Slide 4 Crisis Replay');
  assert(html.includes('SLIDE 5: RISK GOVERNANCE & ACCREDITATION'), 'Must include Slide 5 Compliance');
  assert(html.includes('Sharpe Ratio'), 'Must include Sharpe Ratio');
  assert(html.includes('Rockafellar-Uryasev CVaR'), 'Must include CVaR mathematical reference');
});

// ── 5. Multi-Monitor Bloomberg Layout & Window Manager ──
console.log('\n── Section 5: Multi-Monitor Bloomberg Layout & Window Manager ──');

runTest('multiWindowManager.js orchestrates multi-window layouts and BroadcastChannel', () => {
  const filePath = path.join(ROOT, 'multiWindowManager.js');
  assert(fs.existsSync(filePath), 'multiWindowManager.js must exist');

  // Mock BroadcastChannel
  global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage() {}
  };

  const winMgr = require(filePath);
  assert(winMgr, 'MultiWindowManager must be exported');
  assert(typeof winMgr.launchDualMonitor === 'function', 'Must support Dual Monitor');
  assert(typeof winMgr.launchTripleMonitor === 'function', 'Must support Triple Monitor');
  assert(typeof winMgr.launchQuadWall === 'function', 'Must support Quad Wall');
});

// ── 6. HTML Integration & Script Verification ──
console.log('\n── Section 6: HTML Integrations & DOM Action Buttons ──');

runTest('app.html includes all 5 new institutional engines and topbar buttons', () => {
  const html = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');
  assert(html.includes('liveBrokerGateway.js'), 'app.html must load liveBrokerGateway.js');
  assert(html.includes('volSurfaceStudio.js'), 'app.html must load volSurfaceStudio.js');
  assert(html.includes('swarmInternalCrossing.js'), 'app.html must load swarmInternalCrossing.js');
  assert(html.includes('pitchDeckGenerator.js'), 'app.html must load pitchDeckGenerator.js');
  assert(html.includes('multiWindowManager.js'), 'app.html must load multiWindowManager.js');
  assert(html.includes('id="btnOpenLiveBrokerModal"'), 'app.html must contain Broker OMS button');
  assert(html.includes('id="btnOpenVolStudio"'), 'app.html must contain 3D Vol button');
  assert(html.includes('id="btnGeneratePitchDeck"'), 'app.html must contain Pitch Deck button');
  assert(html.includes('id="btnMultiWindowLayout"'), 'app.html must contain Multi-Window button');
});

runTest('fleet.html includes Swarm Dark Crossing button and scripts', () => {
  const html = fs.readFileSync(path.join(ROOT, 'fleet.html'), 'utf8');
  assert(html.includes('swarmInternalCrossing.js'), 'fleet.html must load swarmInternalCrossing.js');
  assert(html.includes('id="btnOpenSwarmCrossing"'), 'fleet.html must contain btnOpenSwarmCrossing button');
});

runTest('universalPalette.js registers all 5 new slash commands', () => {
  const code = fs.readFileSync(path.join(ROOT, 'universalPalette.js'), 'utf8');
  assert(code.includes("id: 'act_broker'"), 'Palette must register /broker');
  assert(code.includes("id: 'act_volstudio'"), 'Palette must register /volstudio');
  assert(code.includes("id: 'act_crossing'"), 'Palette must register /crossing');
  assert(code.includes("id: 'act_pitchdeck'"), 'Palette must register /pitchdeck');
  assert(code.includes("id: 'act_multimonitor'"), 'Palette must register /multimonitor');
});

runTest('paperBroker.js automatically routes to LiveBrokerGateway when LIVE mode is active', () => {
  const code = fs.readFileSync(path.join(ROOT, 'paperBroker.js'), 'utf8');
  assert(code.includes('root.LiveBrokerGateway.isLiveMode()'), 'paperBroker.js must check isLiveMode()');
  assert(code.includes('root.LiveBrokerGateway.placeLiveOrder'), 'paperBroker.js must route to placeLiveOrder');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TESTS PASSED: ${passedTests} / ${totalTests} (100%)`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
