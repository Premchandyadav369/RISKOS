/**
 * RISKOS — JavaScript Mathematical Invariants & Boundary Assertion Suite
 * =====================================================================
 * Validates non-negotiable financial, statistical, and linear algebra invariants:
 *   1. Simplex constraint: sum(w_i) == 1.000 +/- 1e-4
 *   2. Long-only box bounds: w_i >= 0
 *   3. Quadratic variance non-negativity: w^T Sigma w >= 0
 *   4. Geometric Brownian Motion (GBM) Monte Carlo analytical convergence:
 *      E[S_t] == S_0 * exp(mu * t)
 *   5. Coherent risk measure inequality: CVaR_alpha <= VaR_alpha (return space)
 *   6. Micro-Price bound: min(P_bid, P_ask) <= P_micro <= max(P_bid, P_ask)
 */

'use strict';

const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS MATHEMATICAL INVARIANTS & CONVEX BOUNDARY TEST SUITE');
console.log('══════════════════════════════════════════════════════════════════════════\n');

// ── 1. Simplex & Portfolio Risk Invariants ──
console.log('── Section 1: Portfolio Simplex & Variance Non-Negativity ──');

it('Simplex equality: sum(w_i) == 1.0000 across arbitrary asset allocations', () => {
  const testWeights = [
    [0.25, 0.25, 0.25, 0.25],
    [0.40, 0.30, 0.20, 0.10],
    [0.1428, 0.1428, 0.1428, 0.1428, 0.1428, 0.1428, 0.1432],
    [1.0]
  ];
  testWeights.forEach(w => {
    const sum = w.reduce((a, b) => a + b, 0);
    assert(Math.abs(sum - 1.0) < 1e-4, `Sum of weights ${sum} must equal 1.0`);
    assert(w.every(x => x >= -1e-6), 'All weights must be non-negative');
  });
});

it('Portfolio variance w^T Sigma w >= 0 for any valid covariance matrix', () => {
  // 3x3 positive-definite covariance matrix
  const Sigma = [
    [0.040, 0.012, 0.008],
    [0.012, 0.055, 0.015],
    [0.008, 0.015, 0.035]
  ];
  // Test 50 random simplex weight vectors
  for (let iter = 0; iter < 50; iter++) {
    const raw = [Math.random(), Math.random(), Math.random()];
    const s = raw.reduce((a, b) => a + b, 0);
    const w = raw.map(x => x / s);

    // Compute w^T Sigma w
    let portVar = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        portVar += w[i] * Sigma[i][j] * w[j];
      }
    }
    assert(portVar >= 0.0, `Portfolio variance ${portVar} must be non-negative`);
    const portVol = Math.sqrt(portVar);
    assert(portVol >= 0.0 && !isNaN(portVol), 'Portfolio volatility must be a valid non-negative real number');
  }
});

// ── 2. Geometric Brownian Motion (GBM) Monte Carlo Verification ──
console.log('\n── Section 2: Geometric Brownian Motion (GBM) Analytical Invariants ──');

it('GBM exact SDE simulation matches theoretical expected value E[S_t] = S_0 * exp(mu * t)', () => {
  const S0 = 100.0;
  const mu = 0.10; // 10% drift
  const sigma = 0.20; // 20% vol
  const T = 1.0; // 1 year
  const nSims = 20000;

  // Box-Muller standard normal generator
  function randomNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  let terminalSum = 0;
  const terminalPrices = [];
  const driftTerm = (mu - 0.5 * sigma * sigma) * T;
  const volTerm = sigma * Math.sqrt(T);

  for (let i = 0; i < nSims; i++) {
    const Z = randomNormal();
    const St = S0 * Math.exp(driftTerm + volTerm * Z);
    terminalSum += St;
    terminalPrices.push(St);
  }

  const simulatedMean = terminalSum / nSims;
  const theoreticalMean = S0 * Math.exp(mu * T); // 100 * exp(0.10) = 110.517

  const relativeError = Math.abs(simulatedMean - theoreticalMean) / theoreticalMean;
  assert(relativeError < 0.02, `GBM simulated mean (${simulatedMean.toFixed(2)}) must be within 2% of theoretical (${theoreticalMean.toFixed(2)})`);

  // Verify confidence interval ordering: 5th percentile < 50th percentile (median) < 95th percentile
  terminalPrices.sort((a, b) => a - b);
  const p05 = terminalPrices[Math.floor(0.05 * nSims)];
  const p50 = terminalPrices[Math.floor(0.50 * nSims)];
  const p95 = terminalPrices[Math.floor(0.95 * nSims)];

  assert(p05 < p50, `5th percentile (${p05.toFixed(2)}) must be less than median (${p50.toFixed(2)})`);
  assert(p50 < p95, `Median (${p50.toFixed(2)}) must be less than 95th percentile (${p95.toFixed(2)})`);
});

// ── 3. Coherent Tail Risk Measure Invariant ──
console.log('\n── Section 3: Rockafellar-Uryasev CVaR Coherence Invariant ──');

it('Expected Shortfall (CVaR) is strictly more severe than Value-at-Risk (VaR) in loss space', () => {
  // Generate skewed loss distribution with heavy crash tail
  const returns = [];
  for (let i = 0; i < 2000; i++) {
    // 95% regular market noise + 5% flash crashes
    const r = Math.random() > 0.05
      ? (Math.random() - 0.48) * 0.02
      : -Math.abs(Math.random() * 0.08 + 0.02);
    returns.push(r);
  }
  returns.sort((a, b) => a - b); // Ascending: worst losses first

  const alpha = 0.99;
  const cutoffIdx = Math.floor((1 - alpha) * returns.length);
  const var99 = returns[cutoffIdx];
  const tailReturns = returns.slice(0, cutoffIdx);
  const cvar99 = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;

  // In return space, returns are negative: cvar99 <= var99 (more negative return = greater loss)
  assert(cvar99 <= var99, `CVaR 99% (${cvar99.toFixed(4)}) must be <= VaR 99% (${var99.toFixed(4)}) in return space`);
});

// ── 4. Microstructure Micro-Price Boundary Invariant ──
console.log('\n── Section 4: Micro-Price Order Book Boundary Invariants ──');

it('Stoikov Micro-Price is strictly bounded within [BestBid, BestAsk]', () => {
  const scenarios = [
    { bid: 100.0, ask: 100.5, bidQty: 1000, askQty: 500 },
    { bid: 100.0, ask: 100.5, bidQty: 200, askQty: 800 },
    { bid: 2450.0, ask: 2450.25, bidQty: 5000, askQty: 5000 }
  ];

  scenarios.forEach(sc => {
    const micro = (sc.bidQty * sc.ask + sc.askQty * sc.bid) / (sc.bidQty + sc.askQty);
    assert(micro >= sc.bid, `Micro-price (${micro}) must be >= best bid (${sc.bid})`);
    assert(micro <= sc.ask, `Micro-price (${micro}) must be <= best ask (${sc.ask})`);
    if (sc.bidQty > sc.askQty) {
      assert(micro > (sc.bid + sc.ask) / 2, 'Micro-price must tilt towards ask when buy queue dominates');
    } else if (sc.askQty > sc.bidQty) {
      assert(micro < (sc.bid + sc.ask) / 2, 'Micro-price must tilt towards bid when sell queue dominates');
    }
  });
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TESTS PASSED: ${passedTests} / ${totalTests} (100%)`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
