/**
 * RISKOS P.R.E.M.-Compounder: Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Test: tests/test_long_term_investment_engine.js
 */

const assert = require('assert');
const { LongTermInvestmentEngine, MOAT_AND_THEME_PROFILES } = require('../src/quant/longTermInvestmentEngine.js');
const { SecurityMaster } = require('../src/core/securityMaster.js');

console.log('================================================================');
console.log('  RUNNING RISKOS P.R.E.M.-COMPOUNDER VERIFICATION TEST SUITE');
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

// 1. Structure & Instantiation
console.log('--- 1. Structure & Export Verification ---');
runTest('LongTermInvestmentEngine initializes with valid version and metadata', () => {
  const engine = new LongTermInvestmentEngine();
  assert.ok(engine.version, 'Engine must have version');
  assert.strictEqual(engine.codename, 'P.R.E.M.-Compounder');
  assert.ok(Object.keys(MOAT_AND_THEME_PROFILES).length >= 15, 'Moat ontology must contain 15+ champion profiles');
});

// 2. Capital Allocation Scoring
console.log('\n--- 2. Capital Allocation & Efficiency Scoring ---');
runTest('Calculates capital efficiency score correctly from ROE and ROCE', () => {
  const engine = new LongTermInvestmentEngine();

  // Mega-cap with high ROE/ROCE (e.g. TCS ROE: 48.2%, ROCE: 59.1%)
  const tcsSec = { symbol: 'TCS', roe: 48.2, roce: 59.1, sector: 'Information Technology' };
  const tcsScore = engine.computeCapitalAllocationScore(tcsSec);
  assert.strictEqual(tcsScore.score, 100, 'TCS should achieve maximum capital efficiency score');

  // Bank (uses ROE primarily)
  const bankSec = { symbol: 'HDFCBANK', roe: 16.4, sector: 'Banking & Financials' };
  const bankScore = engine.computeCapitalAllocationScore(bankSec);
  assert.ok(bankScore.score > 50, 'HDFCBANK score should be above baseline 50');
});

// 3. Valuation & Margin of Safety
console.log('\n--- 3. Valuation & Growth-Adjusted PEG Scoring ---');
runTest('Scores valuation with PEG sensitivity', () => {
  const engine = new LongTermInvestmentEngine();

  // Undervalued asset (PE: 15, Growth: 20% -> PEG 0.75)
  const cheapSec = { symbol: 'TEST', pe: 15.0 };
  const cheapScore = engine.computeValuationScore(cheapSec, 0.20);
  assert.ok(cheapScore.score >= 90, 'Low PEG asset must score >= 90 on valuation');

  // Overvalued asset (PE: 80, Growth: 10% -> PEG 8.0)
  const expensiveSec = { symbol: 'EXP', pe: 80.0 };
  const expensiveScore = engine.computeValuationScore(expensiveSec, 0.10);
  assert.ok(expensiveScore.score <= 25, 'High PEG asset must score <= 25 on valuation');
});

// 4. Target Projections & Multi-Year IRR Invariants
console.log('\n--- 4. Multi-Year DCF & Compound IRR Projections ---');
runTest('Maintains mathematical monotonicity across target price scenarios', () => {
  const engine = new LongTermInvestmentEngine();
  const sec = { symbol: 'NVDA', basePrice: 200.0, pe: 50.0 };
  const profile = { growthCagr: 0.25, terminalPe: 35.0 };

  const p = engine.computeTargetProjections(sec, profile);
  assert.ok(p.targetPrice5Yr > p.targetPrice3Yr, '5-Year target must exceed 3-Year target under positive growth');
  assert.ok(p.scenarios.bull.target5Yr > p.scenarios.base.target5Yr, 'Bull scenario must exceed Base scenario');
  assert.ok(p.scenarios.base.target5Yr > p.scenarios.bear.target5Yr, 'Base scenario must exceed Bear scenario');
  assert.ok(p.scenarios.bull.irr5Yr > p.scenarios.base.irr5Yr, 'Bull IRR must exceed Base IRR');
});

// 5. Cross-Market Universe Screening
console.log('\n--- 5. Full Universe Screening & Ranking ---');
runTest('Screens 100+ equities and produces distinct ranked US and Indian compounder portfolios', () => {
  const engine = new LongTermInvestmentEngine();
  const screen = engine.screenUniverse();

  assert.ok(screen.totalEvaluated >= 100, 'Must evaluate 100+ corporate equities');
  assert.strictEqual(screen.topUS.length, 10, 'Top US portfolio must contain 10 assets');
  assert.strictEqual(screen.topIndia.length, 10, 'Top India portfolio must contain 10 assets');

  // Verify descending sort order
  for (let i = 0; i < screen.topUS.length - 1; i++) {
    assert.ok(screen.topUS[i].compositeScore >= screen.topUS[i + 1].compositeScore, 'US list must be sorted descending');
  }
  for (let i = 0; i < screen.topIndia.length - 1; i++) {
    assert.ok(screen.topIndia[i].compositeScore >= screen.topIndia[i + 1].compositeScore, 'India list must be sorted descending');
  }

  // Key institutional anchors must be present
  const usSymbols = screen.topUS.map(s => s.symbol);
  assert.ok(usSymbols.includes('NVDA'), 'NVDA must be in top US');
  assert.ok(usSymbols.includes('ASML') || usSymbols.includes('TSM'), 'Semiconductor monopoly (ASML or TSM) must be in top US/Global');

  const inSymbols = screen.topIndia.map(s => s.symbol);
  assert.ok(inSymbols.includes('TCS') || inSymbols.includes('INFY'), 'Indian IT champion (TCS or INFY) must be in top India');
  assert.ok(inSymbols.includes('HDFCBANK') || inSymbols.includes('ICICIBANK'), 'Indian private bank champion must be in top India');
});

// Summary
console.log('\n================================================================');
console.log(`  LONG-TERM COMPOUNDER TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
