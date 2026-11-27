/**
 * RISKOS Sovereign 12-Factor Institutional Pricing Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Test: tests/test_institutional_pricing_engine.js
 */

const assert = require('assert');
const { InstitutionalPricingEngine, INSTITUTIONAL_FACTOR_ARCHETYPES } = require('../src/quant/institutionalPricingEngine.js');
let SecurityMaster;
try {
  SecurityMaster = require('../src/core/securityMaster.js').SecurityMaster || require('../src/core/securityMaster.js');
} catch (e) {
  console.warn('SecurityMaster warning:', e.message);
}

console.log('================================================================');
console.log('  RUNNING RISKOS 12-FACTOR INSTITUTIONAL PRICING TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// 1. Structure & Export Verification
console.log('--- 1. Structure & Archetype Verification ---');
runTest('InstitutionalPricingEngine initializes with correct metadata & archetypes', () => {
  const engine = new InstitutionalPricingEngine();
  assert.ok(engine.version, 'Engine must define a version');
  assert.strictEqual(engine.codename, 'P.R.E.M.-12Factor');
  assert.ok(Object.keys(INSTITUTIONAL_FACTOR_ARCHETYPES).length >= 8, 'Must have at least 8 predefined institutional archetypes');
  assert.ok(INSTITUTIONAL_FACTOR_ARCHETYPES.NVDA, 'NVDA archetype must exist');
  assert.ok(INSTITUTIONAL_FACTOR_ARCHETYPES.SMCI, 'SMCI archetype must exist');
});

// 2. Closed-Form Mathematical Consistency
console.log('\n--- 2. Closed-Form Mathematical Formulation Verification ---');
runTest('Cumulative fair value strictly obeys P* = S0 * prod(1 + Delta_Fk)', () => {
  const engine = new InstitutionalPricingEngine();
  const res = engine.evaluateSymbol('NVDA');
  assert.ok(res, 'NVDA must evaluate');
  assert.strictEqual(typeof res.institutionalFairValue, 'number');
  assert.strictEqual(typeof res.alphaSpreadPct, 'number');

  // Verify product of 12 factors matches alpha spread
  const f = res.factors;
  const factorMultipliers = Object.keys(f).map(k => 1.0 + (f[k].deltaPct / 100.0));
  const expectedProd = factorMultipliers.reduce((acc, v) => acc * v, 1.0);
  const expectedAlphaPct = (expectedProd - 1.0) * 100.0;

  assert.ok(
    Math.abs(expectedAlphaPct - res.alphaSpreadPct) < 0.25,
    `Product alpha (${expectedAlphaPct.toFixed(2)}%) must match reported alpha (${res.alphaSpreadPct}%)`
  );
});

// 3. Sloan Accrual Anomaly Monotonicity
console.log('\n--- 3. Sloan Accrual Anomaly Sensitivity ---');
runTest('High accrual traps penalize valuation; cash conversion accrues premium', () => {
  const engine = new InstitutionalPricingEngine();
  const baseSec = { symbol: 'TEST', basePrice: 100, pe: 20, roe: 15, country: 'US' };

  const trapRes = engine.evaluate12FactorPricing(baseSec, { accrualRatio: 0.12 });
  const cashRes = engine.evaluate12FactorPricing(baseSec, { accrualRatio: -0.08 });

  assert.ok(
    trapRes.factors.f3_sloanAccrual.deltaPct < 0,
    'High accruals (> 0.05) must generate negative valuation delta'
  );
  assert.ok(
    cashRes.factors.f3_sloanAccrual.deltaPct > 0,
    'High cash conversion (< -0.04) must generate positive valuation delta'
  );
  assert.ok(
    cashRes.institutionalFairValue > trapRes.institutionalFairValue,
    'Cash converter must have higher fair value than accrual trap'
  );
});

// 4. Credit Default Swap Hazard Monotonicity
console.log('\n--- 4. Credit Default Swap & Solvency Hazard ---');
runTest('Higher CDS hazard rate compresses institutional fair value', () => {
  const engine = new InstitutionalPricingEngine();
  const baseSec = { symbol: 'TEST_CREDIT', basePrice: 100, pe: 20, roe: 15, country: 'US' };

  const safeRes = engine.evaluate12FactorPricing(baseSec, { cds5Y: 20 });
  const distressedRes = engine.evaluate12FactorPricing(baseSec, { cds5Y: 450 });

  assert.ok(distressedRes.factors.f2_creditCdsHazard.deltaPct < safeRes.factors.f2_creditCdsHazard.deltaPct);
  assert.ok(safeRes.institutionalFairValue > distressedRes.institutionalFairValue);
});

// 5. Short Interest & DTC Squeeze Physics
console.log('\n--- 5. Short Squeeze & Float Physics ---');
runTest('High short interest and days-to-cover produce non-linear squeeze convexity', () => {
  const engine = new InstitutionalPricingEngine();
  const baseSec = { symbol: 'TEST_SQUEEZE', basePrice: 50, pe: 25, roe: 12, country: 'US' };

  const normalRes = engine.evaluate12FactorPricing(baseSec, { shortInterestFloat: 0.01, daysToCover: 1.0, borrowFee: 0.002 });
  const squeezeRes = engine.evaluate12FactorPricing(baseSec, { shortInterestFloat: 0.22, daysToCover: 7.5, borrowFee: 0.35 });

  assert.ok(squeezeRes.factors.f6_shortDtcSqueeze.deltaPct > normalRes.factors.f6_shortDtcSqueeze.deltaPct);
  assert.ok(squeezeRes.factors.f6_shortDtcSqueeze.deltaPct > 5.0, 'Acute squeeze candidate should yield >5% convexity delta');
});

// 6. Sovereign Archetype Distinctions
console.log('\n--- 6. Institutional Archetype Classifications ---');
runTest('NVDA identified as SUPER_ALPHA and SMCI as SEVERE_HEADWIND', () => {
  const engine = new InstitutionalPricingEngine();
  const nvda = engine.evaluateSymbol('NVDA');
  const smci = engine.evaluateSymbol('SMCI');

  assert.strictEqual(nvda.convictionTier, 'SUPER_ALPHA_STRONG_BUY', 'NVDA should achieve SUPER_ALPHA tier');
  assert.strictEqual(smci.convictionTier, 'SEVERE_HEADWIND_AVOID', 'SMCI should trigger SEVERE_HEADWIND tier');
  assert.ok(nvda.alphaSpreadPct > 10.0, 'NVDA alpha spread should exceed +10%');
  assert.ok(smci.alphaSpreadPct < -25.0, 'SMCI alpha spread should be deep negative');
});

// 7. Universe Evaluation Completeness
console.log('\n--- 7. 134-Equity Cross-Market Universe Evaluation ---');
runTest('Full universe evaluation executes without NaN or undefined fields', () => {
  const engine = new InstitutionalPricingEngine();
  const results = engine.evaluateUniverse();

  assert.ok(results.totalEvaluated >= 100, `Must evaluate 100+ equities, got: ${results.totalEvaluated}`);
  assert.strictEqual(results.topAlphaLongs.length, 10, 'Must produce top 10 alpha longs');
  assert.strictEqual(results.topHeadwindShorts.length, 10, 'Must produce top 10 headwind shorts');

  // Verify all entries have valid numbers
  results.fullEvaluations.forEach(e => {
    assert.ok(!isNaN(e.spotPrice), `spotPrice cannot be NaN for ${e.symbol}`);
    assert.ok(!isNaN(e.institutionalFairValue), `institutionalFairValue cannot be NaN for ${e.symbol}`);
    assert.ok(!isNaN(e.alphaSpreadPct), `alphaSpreadPct cannot be NaN for ${e.symbol}`);
    assert.ok(e.convictionTier, `convictionTier missing for ${e.symbol}`);
    assert.strictEqual(Object.keys(e.factors).length, 12, `Must contain all 12 factor breakdowns for ${e.symbol}`);
  });
});

// 8. Real Yield Macro Sensitivity
console.log('\n--- 8. Real Yield & Macro Sensitivity ---');
runTest('Increasing real yield creates duration-dependent equity valuation compression', () => {
  const engine = new InstitutionalPricingEngine();
  const baseSec = { symbol: 'TEST_GROWTH', basePrice: 100, pe: 45, roe: 25, country: 'US' };

  const lowYieldRes = engine.evaluate12FactorPricing(baseSec, {
    macro: { realYieldUS: 0.010, realYieldIN: 0.015, yieldCurveSlopeUS: 0.002, yieldCurveSlopeIN: 0.002, usdInrDeltaPct: 0, brentDeltaPct: 0, copperDeltaPct: 0 }
  });
  const highYieldRes = engine.evaluate12FactorPricing(baseSec, {
    macro: { realYieldUS: 0.035, realYieldIN: 0.040, yieldCurveSlopeUS: 0.002, yieldCurveSlopeIN: 0.002, usdInrDeltaPct: 0, brentDeltaPct: 0, copperDeltaPct: 0 }
  });

  assert.ok(highYieldRes.factors.f1_macroRealYield.deltaPct < lowYieldRes.factors.f1_macroRealYield.deltaPct);
  assert.ok(lowYieldRes.institutionalFairValue > highYieldRes.institutionalFairValue);
});

console.log('\n================================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('================================================================\n');

if (passedTests < totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
