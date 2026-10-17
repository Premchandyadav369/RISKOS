/**
 * RISKOS Institutional Test Suite: Barra-Style Factor Risk & Quant Research Models
 * 
 * Verifies:
 * 1. Factor Risk Decomposition: sigma_P^2 = w^T (X F X^T + Delta) w = Factor Var + Specific Var
 * 2. Invariant: Systematic Risk Ratio + Idiosyncratic Risk Ratio == 1.0
 * 3. Black-Litterman Bayesian View Adjustment: posterior returns tilt toward high-confidence views
 * 4. Deflated Sharpe Ratio (DSR): penalizes false discovery across multiple trials (Bailey & Lopez de Prado)
 */

const assert = require('assert');
const factorEngine = require('../factorRiskEngine.js');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

console.log('================================================================');
console.log('  RISKOS QUANT RESEARCH & FACTOR RISK VERIFICATION SUITE');
console.log('================================================================\n');

test('Barra-style factor risk decomposition divides total variance into systematic and idiosyncratic risk', () => {
  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
  const weights = [0.25, 0.25, 0.25, 0.25];

  // 4 assets x 6 style factors (Value, Momentum, Quality, LowVol, Size, MarketBeta)
  const factorLoadings = [
    [-0.2,  0.8,  1.1, -0.4,  1.5,  1.05],
    [-0.1,  0.6,  1.2, -0.2,  1.4,  0.98],
    [ 0.1,  0.4,  0.9, -0.1,  1.3,  1.02],
    [-0.3,  0.7,  0.7, -0.5,  1.2,  1.12],
  ];

  // 6x6 factor covariance matrix (annualized)
  const factorCov = [
    [0.040, 0.005, 0.002, 0.001, 0.003, 0.008],
    [0.005, 0.060, 0.004, -0.002, 0.005, 0.012],
    [0.002, 0.004, 0.035, 0.001, 0.002, 0.005],
    [0.001, -0.002, 0.001, 0.025, -0.001, -0.003],
    [0.003, 0.005, 0.002, -0.001, 0.030, 0.006],
    [0.008, 0.012, 0.005, -0.003, 0.006, 0.050]
  ];

  const specificVols = [0.18, 0.16, 0.17, 0.20];

  const res = factorEngine.decomposeRisk(tickers, weights, factorLoadings, factorCov, specificVols);

  assert(res.portfolioVol > 0.10 && res.portfolioVol < 0.80, `Portfolio vol expected ~0.25, got ${res.portfolioVol}`);
  assert(res.factorVol > 0, 'Factor vol must be strictly positive');
  assert(res.specificVol > 0, 'Specific vol must be strictly positive');

  // Mathematical Invariant: Systematic ratio + Idiosyncratic ratio must sum to 1.0
  const ratioSum = res.systematicRiskRatio + res.idiosyncraticRiskRatio;
  assert(Math.abs(ratioSum - 1.0) < 1e-3, `Systematic + Idiosyncratic ratio must sum to 1.0, got ${ratioSum}`);

  // MarketBeta and Momentum should be prominent contributors
  assert(res.factorContributions.MarketBeta, 'MarketBeta contribution must be present');
  assert(res.factorContributions.Momentum, 'Momentum contribution must be present');
});

test('Black-Litterman view blending tilts posterior expected returns toward bullish views', () => {
  const priorWeights = [0.5, 0.5];
  const covMatrix = [
    [0.04, 0.01],
    [0.01, 0.04]
  ];

  // Investor view: Asset 0 will outperform Asset 1 by 5% (Q = 0.05, P = [1, -1])
  const viewsP = [[1.0, -1.0]];
  const viewsQ = [0.05];
  const omega = [[0.001]]; // High confidence view

  const bl = factorEngine.solveBlackLitterman(priorWeights, covMatrix, viewsP, viewsQ, omega);
  assert(bl.equilibriumReturns.length === 2);
  assert(bl.posteriorReturns.length === 2);

  // Asset 0 expected return must increase relative to Asset 1 due to the bullish view
  const spreadPost = bl.posteriorReturns[0] - bl.posteriorReturns[1];
  const spreadPrior = bl.equilibriumReturns[0] - bl.equilibriumReturns[1];
  assert(spreadPost > spreadPrior, 'Posterior return spread must expand reflecting the relative outperformance view');
});

test('Deflated Sharpe Ratio (DSR) correctly deflates significance as number of backtest trials increases', () => {
  const observedSR = 1.80; // High annualized Sharpe ratio
  const trackRecordDays = 504; // 2 years of daily data

  // Single trial: SR=1.8 is statistically significant (DSR > 0.90)
  const singleTrial = factorEngine.calculateDeflatedSharpeRatio(observedSR, 1, trackRecordDays);
  assert(singleTrial.deflatedSharpeRatio > 0.90, `Single trial DSR should be high, got ${singleTrial.deflatedSharpeRatio}`);

  // Multiple testing penalty: after data-mining across 500 trials, the same SR=1.8 loses statistical significance
  const minedTrials = factorEngine.calculateDeflatedSharpeRatio(observedSR, 500, trackRecordDays);
  assert(minedTrials.deflatedSharpeRatio < singleTrial.deflatedSharpeRatio, 'DSR must decrease as trial count increases');
  assert(minedTrials.deflatedSharpeRatio < 0.60, '500-trial mined DSR must deflate significantly');
  assert(minedTrials.expectedMaxSR > singleTrial.expectedMaxSR, 'Expected maximum Sharpe under null must rise with N');
});

console.log('\n================================================================');
console.log(`  FACTOR RISK & RESEARCH RESULTS: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed !== total) process.exit(1);
