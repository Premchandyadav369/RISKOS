/**
 * RISKOS Test Suite: Enterprise Institutional Risk & FRTB Stress Testing
 * Architect: Premchand Yadav
 */

const assert = require('assert');
const EnterpriseRiskEngine = require('../enterpriseRiskEngine.js');

console.log('================================================================');
console.log('  RISKOS ENTERPRISE RISK & FRTB STRESS TESTING TEST SUITE');
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

it('Executes 2008 Lehman Brothers collapse crisis replay stress test', () => {
  const res = EnterpriseRiskEngine.simulateCrisisStressTest('LEHMAN_2008', 10000000.0, [0.7, 0.3]);
  assert.strictEqual(res.crisisId, 'LEHMAN_2008');
  assert.ok(res.stressedLossPct > 30.0, 'Loss should exceed 30% under Lehman scenario');
  assert.ok(res.frtbExpectedShortfall975Pct > res.stressedLossPct, 'FRTB ES must exceed base loss');
  assert.strictEqual(res.isHawkesShutdownTriggered, true, 'Supercritical Hawkes jump must trigger shutdown');
  assert.ok(res.premShieldCapitalPreserved > 0, 'P.R.E.M. Hawkes shield must preserve capital');
});

it('Simulates 2010 Flash Crash liquidity vacuum with extreme Hawkes branching ratio (eta = 0.99)', () => {
  const res = EnterpriseRiskEngine.simulateCrisisStressTest('FLASH_CRASH_2010', 5000000.0);
  assert.strictEqual(res.crisisId, 'FLASH_CRASH_2010');
  assert.strictEqual(res.hawkesBranchingRatio, 0.99);
  assert.strictEqual(res.isHawkesShutdownTriggered, true);
  assert.ok(res.premShieldCapitalPreserved > 100000.0, 'P.R.E.M. shield must preserve significant capital');
});

it('Computes Basel IV / FRTB Expected Shortfall scaled by Liquidity Horizons (10, 20, 40, 60 days)', () => {
  const frtb = EnterpriseRiskEngine.computeFRTBLiquidityScaledES(100000.0, 'EQUITY');
  assert.strictEqual(frtb.baseES10Day, 100000.0);
  assert.ok(frtb.scaledFRTBExpectedShortfall > frtb.baseES10Day, 'Multi-horizon scaling must increase regulatory ES');
  assert.ok(frtb.regulatoryCapitalBufferMultiplier > 1.4, 'Buffer multiplier should be > 1.4x');
});

it('Computes Clayton Copula asymmetric lower-tail crash dependence: lambda_L = 2^(-1/theta)', () => {
  const indep = EnterpriseRiskEngine.computeClaytonTailDependence(0);
  assert.strictEqual(indep.lowerTailDependence, 0.0);

  const crashDep = EnterpriseRiskEngine.computeClaytonTailDependence(2.0);
  // lambda_L = 2^(-1/2) = 1/sqrt(2) ~ 0.7071
  assert.ok(Math.abs(crashDep.lowerTailDependence - 0.7071) < 0.01, `Expected ~0.7071, got ${crashDep.lowerTailDependence}`);
  assert.strictEqual(crashDep.description, 'Severe Crash Co-Dependence');
});

it('Computes Student-t Copula non-linear heavy-tail kurtosis', () => {
  const extreme = EnterpriseRiskEngine.computeStudentTCopulaKurtosis(3.5);
  assert.strictEqual(extreme.fatTailRiskLevel, 'EXTREME_FAT_TAILS');

  const moderate = EnterpriseRiskEngine.computeStudentTCopulaKurtosis(8.0);
  // Kurtosis = 3 + 6 / (8 - 4) = 4.5 -> excess = 1.5
  assert.strictEqual(moderate.excessKurtosis, 1.5);
  assert.strictEqual(moderate.fatTailRiskLevel, 'MODERATE_HEAVY_TAILS');
});

console.log('\n================================================================');
console.log(`  ENTERPRISE RISK RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
