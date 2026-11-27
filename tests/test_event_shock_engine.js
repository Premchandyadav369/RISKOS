/**
 * RISKOS P.R.E.M.-Event Discontinuous Shock Engine Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav
 * Unit and invariant tests for event-driven jumps, dealer gamma squeeze,
 * options skew asymmetry, and supply chain network contagion.
 * 
 * Execution: node tests/test_event_shock_engine.js
 */

const assert = require('assert');
const PremEventShockEngine = require('../premEventShockEngine.js');

console.log('================================================================');
console.log('  RISKOS P.R.E.M.-EVENT SHOCK ENGINE TEST SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}\n`);
  }
}

// -----------------------------------------------------------------------------
// 1. CATALYST EVALUATION & SCORING
// -----------------------------------------------------------------------------
console.log('--- 1. Catalyst Evaluation & Governance Scoring ---');

it('Evaluates bullish leadership reinstatement with government clearance', () => {
  const cat = PremEventShockEngine.evaluateEventCatalyst({
    type: 'LEADERSHIP_REVERSAL',
    isReinstatement: true,
    leadershipConfidence: 0.95,
    regulatoryClearance: true,
    revenueSurprisePct: 15.0
  });

  assert.ok(cat.I_event > 0.70, `Expected I_event > 0.70, got ${cat.I_event}`);
  assert.strictEqual(cat.direction, 'BULLISH_SURGE');
  assert.strictEqual(cat.severity, 'SUPERCRITICAL_DISCONTINUITY');
});

it('Evaluates bearish antitrust injunction and guidance cut', () => {
  const cat = PremEventShockEngine.evaluateEventCatalyst({
    type: 'ANTITRUST_RULING',
    isReinstatement: false,
    regulatoryClearance: false,
    antiTrustInjunction: true
  });

  assert.ok(cat.I_event < 0, `Expected negative I_event, got ${cat.I_event}`);
  assert.strictEqual(cat.direction, 'BEARISH_CAPITULATION');
});

// -----------------------------------------------------------------------------
// 2. DEALER GAMMA SQUEEZE & VOLATILITY SKEW
// -----------------------------------------------------------------------------
console.log('\n--- 2. Dealer Gamma Squeeze & Options Volatility Skew ---');

it('Computes acute gamma squeeze multiplier under negative GEX regime', () => {
  const gamma = PremEventShockEngine.computeGammaSqueezeMultiplier({
    netGexMillions: -4800,
    normalizedGex: 3000,
    atmIv: 0.50,
    riskReversal25d: 10.0
  });

  assert.strictEqual(gamma.isShortGammaRegime, true);
  assert.ok(gamma.lambdaGamma > 1.5, `Expected lambdaGamma > 1.5, got ${gamma.lambdaGamma}`);
  assert.strictEqual(gamma.dealerReflexivityState, 'ACUTE_GAMMA_SQUEEZE');
  assert.strictEqual(gamma.isExtremeCallSkew, true);
  assert.ok(gamma.xiSkew > 0.15, `Expected xiSkew > 0.15, got ${gamma.xiSkew}`);
});

// -----------------------------------------------------------------------------
// 3. DISCONTINUOUS JUMP PREDICTION
// -----------------------------------------------------------------------------
console.log('\n--- 3. Discontinuous Jump Prediction ---');

it('Accurately projects post-shock jump price for high-beta tech asset', () => {
  const jump = PremEventShockEngine.predictDiscontinuousJump({
    symbol: 'NVDA',
    preEventPrice: 125.53,
    assetBeta: 1.85,
    eventCatalyst: {
      type: 'LEADERSHIP_REVERSAL',
      isReinstatement: true,
      leadershipConfidence: 0.98,
      regulatoryClearance: true,
      revenueSurprisePct: 18.5
    },
    optionsMarket: {
      netGexMillions: -5200,
      normalizedGex: 3200,
      atmIv: 0.52,
      riskReversal25d: 11.2
    }
  });

  assert.strictEqual(jump.symbol, 'NVDA');
  assert.ok(jump.targetPrice > 160.0 && jump.targetPrice < 170.0, `Expected target in [160, 170], got ${jump.targetPrice}`);
  assert.ok(jump.expectedMovePct > 28.0 && jump.expectedMovePct < 35.0, `Expected move in [28%, 35%], got ${jump.expectedMovePct}%`);
});

// -----------------------------------------------------------------------------
// 4. GLOBAL SUPPLY-CHAIN CONTAGION
// -----------------------------------------------------------------------------
console.log('\n--- 4. Global Supply-Chain Contagion Graph ---');

it('Propagates primary shock to Tier-1 suppliers with descending weights', () => {
  const contagion = PremEventShockEngine.propagateSupplyChainContagion('NVDA', 31.48);

  assert.ok(contagion.length >= 5, `Expected at least 5 dependencies, got ${contagion.length}`);
  const targets = contagion.map(c => c.targetSymbol);
  assert.ok(targets.includes('TSM'), 'Must include TSMC');
  assert.ok(targets.includes('ARM'), 'Must include ARM Holdings');
  assert.ok(targets.includes('ASML'), 'Must include ASML');
  assert.ok(targets.includes('TSLA'), 'Must include Tesla');
  assert.ok(targets.includes('AMD'), 'Must include AMD');

  // Verify descending expected move order
  for (let i = 0; i < contagion.length - 1; i++) {
    assert.ok(contagion[i].expectedMovePct >= contagion[i + 1].expectedMovePct, 'Contagion moves must be descending');
  }
});

// -----------------------------------------------------------------------------
// 5. HISTORIC NVIDIA REPLAY & BENCHMARK AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 5. Historic NVIDIA Replay & Empirical Accuracy ---');

it('Replays historic November 23, 2026 flash surge with >= 98% precision', () => {
  const replay = PremEventShockEngine.replayNvidiaHistoricShock();

  assert.strictEqual(replay.preEventPrice, 125.53);
  assert.strictEqual(replay.actualPostEventPrice, 165.05);
  assert.ok(replay.priceErrorDollar < 2.0, `Expected error < $2.00, got $${replay.priceErrorDollar}`);
  
  const precisionNum = parseFloat(replay.modelPrecisionPct);
  assert.ok(precisionNum >= 98.0, `Expected precision >= 98.0%, got ${precisionNum}%`);

  // Verify contagion accuracy on empirical actuals
  const arm = replay.supplyChainContagion.find(c => c.targetSymbol === 'ARM');
  const tsm = replay.supplyChainContagion.find(c => c.targetSymbol === 'TSM');
  assert.ok(arm && arm.accuracyPct >= 95.0, `Expected ARM accuracy >= 95%, got ${arm?.accuracyPct}%`);
  assert.ok(tsm && tsm.accuracyPct >= 95.0, `Expected TSM accuracy >= 95%, got ${tsm?.accuracyPct}%`);
});

console.log('\n================================================================');
console.log(`  P.R.E.M.-EVENT RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
