/**
 * RISKOS Test Suite: AI Quant Strategy Studio & Auto-Optimizer
 * Architect: Premchand Yadav
 */

const assert = require('assert');
const QuantStrategyStudio = require('../src/components/quantStrategyStudio.js');

console.log('================================================================');
console.log('  RISKOS AI QUANT STRATEGY STUDIO & OPTIMIZER TEST SUITE');
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

it('Synthesizes strategy from natural language prompt into parameters and code', () => {
  const strat = QuantStrategyStudio.synthesizeStrategy('High-frequency statistical arbitrage on tech pairs');
  assert.ok(strat, 'Strategy must be generated');
  assert.strictEqual(strat.category, 'PAIRS_TRADING');
  assert.ok(strat.equationLatex.includes('z_t'), 'Must output mathematical LaTeX formulation');
  assert.ok(strat.parameters.zEntry, 'Must configure entry parameters');
  assert.ok(strat.codeSnippetRust.includes('evaluate_signal'), 'Must export Rust code snippet');
  assert.ok(strat.codeSnippetCpp.includes('evaluate_signal'), 'Must export C++20 code snippet');
});

it('Runs Genetic Algorithm optimization across generations and improves fitness', () => {
  const strat = QuantStrategyStudio.synthesizeStrategy('P.R.E.M. entropy momentum breakout');
  const optResult = QuantStrategyStudio.optimizeStrategy(strat, 2000, {
    populationSize: 10,
    generations: 4
  });

  assert.strictEqual(optResult.strategyId, strat.strategyId);
  assert.strictEqual(optResult.generationsRun, 4);
  assert.strictEqual(optResult.totalTrials, 40);
  assert.ok(optResult.bestParameters, 'Must identify best parameter set');
  assert.ok(optResult.performance.sharpe > 0, 'Sharpe must be positive');
  assert.strictEqual(optResult.convergenceCurve.length, 4);
});

it('Computes Deflated Sharpe Ratio (DSR) & White Reality Check to guard against overfitting', () => {
  // Test Case A: Genuine high Sharpe (3.5) with low trial count (10 trials) -> Statistically Sound
  const dsrSound = QuantStrategyStudio.computeDeflatedSharpeRatio(3.50, 10, 252, -0.1, 3.2);
  assert.strictEqual(dsrSound.isStatisticallySound, true);
  assert.ok(dsrSound.deflatedSharpeRatio >= 0.95, 'Sound strategy must have DSR >= 0.95');
  assert.ok(dsrSound.whitesRealityPValue <= 0.05, 'Sound strategy must have p <= 0.05');

  // Test Case B: Mediocre Sharpe (1.2) mined after 1,000,000 data-snooping trials -> Rejected as Overfitted
  const dsrOverfitted = QuantStrategyStudio.computeDeflatedSharpeRatio(1.20, 1000000, 252, 0.0, 3.0);
  assert.strictEqual(dsrOverfitted.isStatisticallySound, false, 'Overfitted data-mined result must be flagged');
  assert.ok(dsrOverfitted.deflatedSharpeRatio < 0.95);
});

console.log('\n================================================================');
console.log(`  QUANT STRATEGY STUDIO RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
