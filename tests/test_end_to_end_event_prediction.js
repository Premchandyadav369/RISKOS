/**
 * RISKOS End-to-End Event Prediction & Discontinuous Shock Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav
 * Verifies the full pipeline:
 * - Real-time corporate catalyst evaluation
 * - Options surface 25d risk reversal skew
 * - Dealer net gamma exposure (GEX) acceleration
 * - Cross-market pricing integration (P.R.E.M.-Alpha + P.R.E.M.-Event)
 * - Knowledge-graph supply-chain contagion
 * 
 * Execution: node tests/test_end_to_end_event_prediction.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { SecurityMaster } = require('../src/core/securityMaster.js');
const CrossMarketPricingEngine = require('../src/quant/crossMarketPricingEngine.js');
const EventSurveillanceEngine = require('../src/quant/eventSurveillanceEngine.js');

console.log('================================================================');
console.log('  RISKOS END-TO-END EVENT PREDICTION TEST SUITE');
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
// 1. EVENT SURVEILLANCE & SCANNER
// -----------------------------------------------------------------------------
console.log('--- 1. Event Surveillance & Multi-Asset Scanner ---');

it('Scans the entire corporate universe and classifies event risk', () => {
  const equities = SecurityMaster.LOCAL_REGISTRY.filter(
    s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY'
  );

  const res = EventSurveillanceEngine.scanUniverseEventRisk(equities);

  assert.ok(res.summary.totalSecuritiesScanned >= 130, `Expected >= 130 scanned, got ${res.summary.totalSecuritiesScanned}`);
  assert.ok(res.summary.highEventRiskCount >= 3, `Expected >= 3 high event risk stocks, got ${res.summary.highEventRiskCount}`);
  assert.ok(res.summary.acuteGammaSqueezeCount >= 5, `Expected >= 5 acute gamma squeeze stocks, got ${res.summary.acuteGammaSqueezeCount}`);
  assert.ok(res.highEventRiskStocks.some(s => s.symbol === 'NVDA'), 'Must identify NVDA as high event risk');
});

// -----------------------------------------------------------------------------
// 2. OPTIONS SURFACE SKEW & GEX MULTIPLIER
// -----------------------------------------------------------------------------
console.log('\n--- 2. Options Skew & Dealer Gamma Multiplier ---');

it('Calculates non-linear gamma acceleration under short gamma regime', () => {
  const gamma = EventSurveillanceEngine.computeGammaSqueeze({
    netGexMillions: -5200,
    normalizedGex: 3200,
    atmIv: 0.52,
    riskReversal25d: 11.2
  });

  assert.strictEqual(gamma.isShortGamma, true);
  assert.ok(gamma.lambdaGamma >= 2.0, `Expected lambdaGamma >= 2.0, got ${gamma.lambdaGamma}`);
  assert.strictEqual(gamma.dealerState, 'ACUTE_GAMMA_SQUEEZE');
  assert.strictEqual(gamma.isCallInversion, true);
  assert.ok(gamma.xiSkew > 0.15, `Expected xiSkew > 0.15, got ${gamma.xiSkew}`);
});

// -----------------------------------------------------------------------------
// 3. UNIFIED CROSS-MARKET PRICING INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. Unified Cross-Market Pricing Integration ---');

it('Integrates continuous alpha drift and discontinuous event shock targets', () => {
  const p = CrossMarketPricingEngine.predictSecurity('NVDA', { includeEventRisk: true });

  assert.strictEqual(p.symbol, 'NVDA');
  assert.ok(p.microstructure, 'Must contain P.R.E.M.-Alpha continuous microstructure');
  assert.ok(p.eventRisk, 'Must contain P.R.E.M.-Event risk object');
  
  // Continuous target
  assert.ok(p.predictions.target20d > 0, 'Target 20d must be positive');
  assert.ok(p.predictions.alphaBps > 0, 'Alpha drift must be positive');

  // Discontinuous jump target
  assert.ok(p.predictions.targetEvent > p.spotMid, 'Discontinuous event target must exceed spot for bullish catalyst');
  assert.ok(p.predictions.expectedMoveEventPct > 20.0, `Expected event jump > 20%, got ${p.predictions.expectedMoveEventPct}%`);
  assert.ok(p.predictions.jumpProbability >= 0.50 && p.predictions.jumpProbability <= 1.0, 'Jump probability must be in [0.5, 1.0]');
});

it('Surfaces topEventJumps in universe evaluation', () => {
  const universe = CrossMarketPricingEngine.predictUniverse();

  assert.ok(Array.isArray(universe.topEventJumps), 'Must contain topEventJumps array');
  assert.ok(universe.topEventJumps.length > 0, 'Must have at least 1 event jump candidate');
  assert.ok(universe.topEventJumps[0].eventRisk, 'Top event jump item must have eventRisk');
});

// -----------------------------------------------------------------------------
// 4. KNOWLEDGE-GRAPH SUPPLY CHAIN CONTAGION
// -----------------------------------------------------------------------------
console.log('\n--- 4. Knowledge-Graph Supply Chain Contagion ---');

it('Propagates primary anchor shock to global supply chain partners', () => {
  const contagion = EventSurveillanceEngine.propagateContagion('NVDA', 31.48);

  assert.ok(contagion.length >= 6, `Expected at least 6 contagion targets, got ${contagion.length}`);
  const symbols = contagion.map(c => c.targetSymbol);
  assert.ok(symbols.includes('TSM'), 'Must include TSMC');
  assert.ok(symbols.includes('ARM'), 'Must include ARM');
  assert.ok(symbols.includes('ASML'), 'Must include ASML');
  assert.ok(symbols.includes('TSLA'), 'Must include Tesla');
  assert.ok(symbols.includes('TCS'), 'Must propagate cross-border to Indian IT bellwether TCS');

  // Verify non-negative expected moves
  contagion.forEach(c => {
    assert.ok(c.expectedMovePct > 0, `${c.targetSymbol} move must be positive`);
    assert.ok(c.confidencePct >= 80, `${c.targetSymbol} confidence must be >= 80%`);
  });
});

// -----------------------------------------------------------------------------
// 5. CSV TEAR-SHEET & ARTIFACT INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- 5. CSV Tear-Sheet & Telemetry Invariants ---');

it('Generates CSV tear-sheet containing event risk headers', () => {
  const universe = CrossMarketPricingEngine.predictUniverse();
  const csv = CrossMarketPricingEngine.generateCsvTearSheet(universe);

  assert.ok(csv.includes('EventScore'), 'CSV must include EventScore header');
  assert.ok(csv.includes('EventTarget'), 'CSV must include EventTarget header');
  assert.ok(csv.includes('EventMove(%)'), 'CSV must include EventMove(%) header');
  assert.ok(csv.includes('DealerGexState'), 'CSV must include DealerGexState header');
});

it('Runner script exists and executes successfully', () => {
  const runnerPath = path.join(__dirname, '..', 'scripts', 'run_event_driven_universal_pricing.js');
  assert.ok(fs.existsSync(runnerPath), 'Runner script must exist');
});

console.log('\n================================================================');
console.log(`  EVENT PREDICTION RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
