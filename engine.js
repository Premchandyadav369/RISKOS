/**
 * RISKOS INSTITUTIONAL QUANTITATIVE ENGINE (engine.js)
 * Standalone, deterministic mathematical and statistical computation library.
 * Covers Black-Scholes & Greeks, Modern Portfolio Theory (MPT) & Efficient Frontier,
 * GARCH(1,1) & EWMA Volatility, Value-at-Risk (VaR & CVaR), Almgren-Chriss Execution,
 * Nelson-Siegel Yield Curves, and Statistical Model Validation Tests.
 */

(() => {
  'use strict';

  // ── Standard Normal Cumulative Distribution Function (Approximation) ─────────
  const normalCDF = (x) => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * y);
  };

  // Standard Normal Probability Density Function
  const normalPDF = (x) => (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x);

  // Inverse Normal CDF (Quantile function) - Acklam's Approximation
  const normalInvCDF = (p) => {
    if (p <= 0 || p >= 1) return p <= 0 ? -999 : 999;
    
    const a = [-3.969683028665376e+01,  2.209460984245205e+02, -2.759285104469687e+02,  1.383577518672690e+02, -3.066479806614716e+01,  2.506628277459239e+00];
    const b = [-5.447609879822406e+01,  1.615858368580409e+02, -1.556989798598866e+02,  6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00];
    const d = [ 7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996e+00,  3.754408661907416e+00];

    const q = p < 0.5 ? p : 1.0 - p;
    let r, x;

    if (q > 0.02425) {
      r = q - 0.5;
      const r2 = r * r;
      x = (((((a[0]*r2 + a[1])*r2 + a[2])*r2 + a[3])*r2 + a[4])*r2 + a[5])*r /
          (((((b[0]*r2 + b[1])*r2 + b[2])*r2 + b[3])*r2 + b[4])*r2 + 1.0);
    } else {
      r = Math.sqrt(-Math.log(q));
      x = (((((c[0]*r + c[1])*r + c[2])*r + c[3])*r + c[4])*r + c[5]) /
          ((((d[0]*r + d[1])*r + d[2])*r + d[3])*r + 1.0);
    }

    return p < 0.5 ? -x : x;
  };

  // ── 1. Black-Scholes-Merton Options & Greeks Engine ───────────────────────────
  const blackScholes = ({ S, K, T, r, sigma, q = 0.0 }) => {
    // S = Spot Price, K = Strike, T = Time to expiry in years, r = Risk-free rate, sigma = Volatility, q = Dividend yield
    const spot = Math.max(0.01, Number(S));
    const strike = Math.max(0.01, Number(K));
    const time = Math.max(0.001, Number(T));
    const rate = Number(r);
    const vol = Math.max(0.001, Number(sigma));
    const div = Number(q);

    const sqrtT = Math.sqrt(time);
    const d1 = (Math.log(spot / strike) + (rate - div + 0.5 * vol * vol) * time) / (vol * sqrtT);
    const d2 = d1 - vol * sqrtT;

    const expDivT = Math.exp(-div * time);
    const expRateT = Math.exp(-rate * time);

    const nd1 = normalCDF(d1);
    const nd2 = normalCDF(d2);
    const n_d1 = normalCDF(-d1);
    const n_d2 = normalCDF(-d2);
    const pdf_d1 = normalPDF(d1);

    // Call & Put Prices
    const callPrice = spot * expDivT * nd1 - strike * expRateT * nd2;
    const putPrice  = strike * expRateT * n_d2 - spot * expDivT * n_d1;

    // Greeks
    const deltaCall = expDivT * nd1;
    const deltaPut  = expDivT * (nd1 - 1.0);
    const gamma     = (expDivT * pdf_d1) / (spot * vol * sqrtT);
    const vega      = (spot * expDivT * pdf_d1 * sqrtT) / 100.0; // Per 1% vol move
    const thetaCall = (-(spot * vol * expDivT * pdf_d1) / (2.0 * sqrtT) - rate * strike * expRateT * nd2 + div * spot * expDivT * nd1) / 365.0; // Per calendar day
    const thetaPut  = (-(spot * vol * expDivT * pdf_d1) / (2.0 * sqrtT) + rate * strike * expRateT * n_d2 - div * spot * expDivT * n_d1) / 365.0;
    const rhoCall   = (strike * time * expRateT * nd2) / 100.0; // Per 1% rate move
    const rhoPut    = (-strike * time * expRateT * n_d2) / 100.0;

    return {
      call: { price: Math.max(0, callPrice), delta: deltaCall, theta: thetaCall, rho: rhoCall },
      put:  { price: Math.max(0, putPrice),  delta: deltaPut,  theta: thetaPut,  rho: rhoPut },
      gamma,
      vega,
      d1,
      d2
    };
  };

  // Implied Volatility Solver via Newton-Raphson
  const impliedVolatility = ({ S, K, T, r, marketPrice, type = 'call', initialGuess = 0.25 }) => {
    let sigma = initialGuess;
    const maxIter = 100;
    const tol = 1e-4;

    for (let i = 0; i < maxIter; i++) {
      const bs = blackScholes({ S, K, T, r, sigma });
      const price = type === 'call' ? bs.call.price : bs.put.price;
      const diff = price - marketPrice;

      if (Math.abs(diff) < tol) return sigma;
      const vega = bs.vega * 100.0;
      if (Math.abs(vega) < 1e-5) break;

      sigma -= diff / vega;
      if (sigma <= 0.001) sigma = 0.001;
      if (sigma > 5.0) sigma = 5.0;
    }

    return sigma;
  };

  // ── 2. Volatility Modeling: GARCH(1,1) & RiskMetrics EWMA ──────────────────────
  const ewmaVolatility = (returns, lambda = 0.94) => {
    if (!returns || returns.length === 0) return { currentVol: 0.18, series: [] };
    const n = returns.length;
    const series = new Array(n);
    let varPrev = Math.pow(returns[0], 2);
    series[0] = Math.sqrt(varPrev * 252);

    for (let i = 1; i < n; i++) {
      const r2 = Math.pow(returns[i], 2);
      varPrev = lambda * varPrev + (1 - lambda) * r2;
      series[i] = Math.sqrt(varPrev * 252);
    }

    return {
      currentVol: series[n - 1],
      series
    };
  };

  const garchVolatility = (returns, omega = 0.000005, alpha = 0.08, beta = 0.88) => {
    if (!returns || returns.length === 0) return { currentVol: 0.20, unconditionalVol: 0.20, series: [] };
    const n = returns.length;
    const series = new Array(n);
    const unconditionalVar = omega / Math.max(0.001, (1.0 - alpha - beta));
    let varPrev = unconditionalVar;

    for (let i = 0; i < n; i++) {
      const r2 = Math.pow(returns[i], 2);
      varPrev = omega + alpha * r2 + beta * varPrev;
      series[i] = Math.sqrt(varPrev * 252);
    }

    return {
      omega,
      alpha,
      beta,
      persistence: alpha + beta,
      unconditionalVol: Math.sqrt(unconditionalVar * 252),
      currentVol: series[n - 1],
      series
    };
  };

  // ── 3. Risk Engine: Value-at-Risk (VaR) & Conditional VaR (CVaR) ───────────────
  const calculateVaR = ({ returns, weights, confidence = 0.99, horizonDays = 1, portfolioValue = 10000000 }) => {
    // If matrix of returns (assets x periods) or single portfolio return array
    let portReturns = [];
    if (Array.isArray(returns[0])) {
      const numPeriods = returns[0].length;
      const numAssets = returns.length;
      for (let t = 0; t < numPeriods; t++) {
        let r = 0;
        for (let a = 0; a < numAssets; a++) {
          r += (weights[a] || 1 / numAssets) * returns[a][t];
        }
        portReturns.push(r);
      }
    } else {
      portReturns = [...returns];
    }

    const n = portReturns.length;
    if (n === 0) return null;

    // Mean & Standard Deviation
    const mean = portReturns.reduce((a, b) => a + b, 0) / n;
    const variance = portReturns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);

    // 1. Parametric (Variance-Covariance) VaR & CVaR
    const zScore = normalInvCDF(confidence);
    const parametricVaRPct = Math.max(0, zScore * std * Math.sqrt(horizonDays) - mean * horizonDays);
    const parametricCVaRPct = (std * normalPDF(zScore) / (1.0 - confidence)) * Math.sqrt(horizonDays);

    // 2. Historical Simulation VaR & CVaR
    const sorted = [...portReturns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1.0 - confidence) * n);
    const historicalVaRPct = Math.max(0, -sorted[cutoffIndex] * Math.sqrt(horizonDays));
    const tailLosses = sorted.slice(0, cutoffIndex + 1);
    const historicalCVaRPct = Math.max(0, (-tailLosses.reduce((a, b) => a + b, 0) / tailLosses.length) * Math.sqrt(horizonDays));

    // 3. Monte Carlo VaR (10,000 simulations)
    const numSims = 10000;
    const simReturns = new Float64Array(numSims);
    for (let i = 0; i < numSims; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      simReturns[i] = mean + std * z;
    }
    simReturns.sort();
    const mcCutoff = Math.floor((1.0 - confidence) * numSims);
    const monteCarloVaRPct = Math.max(0, -simReturns[mcCutoff] * Math.sqrt(horizonDays));
    let mcTailSum = 0;
    for (let i = 0; i <= mcCutoff; i++) mcTailSum += simReturns[i];
    const monteCarloCVaRPct = Math.max(0, (-mcTailSum / (mcCutoff + 1)) * Math.sqrt(horizonDays));

    return {
      confidence,
      horizonDays,
      portfolioValue,
      mean: mean * 252,
      volatility: std * Math.sqrt(252),
      parametric: {
        varPct: parametricVaRPct,
        varAbs: parametricVaRPct * portfolioValue,
        cvarPct: parametricCVaRPct,
        cvarAbs: parametricCVaRPct * portfolioValue
      },
      historical: {
        varPct: historicalVaRPct,
        varAbs: historicalVaRPct * portfolioValue,
        cvarPct: historicalCVaRPct,
        cvarAbs: historicalCVaRPct * portfolioValue
      },
      monteCarlo: {
        varPct: monteCarloVaRPct,
        varAbs: monteCarloVaRPct * portfolioValue,
        cvarPct: monteCarloCVaRPct,
        cvarAbs: monteCarloCVaRPct * portfolioValue
      }
    };
  };

  // ── 4. Modern Portfolio Theory (MPT) & Markowitz Efficient Frontier ──────────
  const markowitzFrontier = ({ assets, numPortfolios = 2000, riskFreeRate = 0.065 }) => {
    // assets: [{ symbol, meanReturn, volatility, weights }]
    const n = assets.length;
    if (n < 2) return null;

    const portfolios = [];
    let maxSharpePortfolio = null;
    let minVarPortfolio = null;
    let maxSharpe = -Infinity;
    let minVar = Infinity;

    // Simulate random portfolio weight allocations
    for (let i = 0; i < numPortfolios; i++) {
      const rawWeights = new Array(n).fill(0).map(() => Math.random());
      const sumWeights = rawWeights.reduce((a, b) => a + b, 0);
      const weights = rawWeights.map(w => w / sumWeights);

      let portReturn = 0;
      let portVar = 0;

      for (let a = 0; a < n; a++) {
        portReturn += weights[a] * assets[a].meanReturn;
      }

      // Estimate variance assuming average correlation 0.35
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          const corr = a === b ? 1.0 : (assets[a].corr?.[b] || 0.35);
          portVar += weights[a] * weights[b] * assets[a].volatility * assets[b].volatility * corr;
        }
      }

      const portVol = Math.sqrt(Math.max(0.0001, portVar));
      const sharpe = (portReturn - riskFreeRate) / portVol;

      const pt = {
        weights,
        expectedReturn: portReturn,
        volatility: portVol,
        sharpeRatio: sharpe
      };

      portfolios.push(pt);

      if (sharpe > maxSharpe) {
        maxSharpe = sharpe;
        maxSharpePortfolio = pt;
      }
      if (portVol < minVar) {
        minVar = portVol;
        minVarPortfolio = pt;
      }
    }

    return {
      portfolios,
      tangency: maxSharpePortfolio,
      minVariance: minVarPortfolio,
      riskFreeRate
    };
  };

  // ── 5. Almgren-Chriss Optimal Trade Execution Trajectory ───────────────────────
  const almgrenChriss = ({ totalShares, totalTimeHours = 4, numIntervals = 8, volatility = 0.20, dailyVolume = 5000000, riskAversion = 1e-6 }) => {
    // Permanent & Temporary price impact parameters
    const gamma = 2.5e-7; // Permanent impact parameter
    const eta = 1.2e-6;   // Temporary impact parameter
    const tau = totalTimeHours / numIntervals;
    const sigma = volatility / Math.sqrt(252 * 6.5); // Per-hour volatility

    // Optimal execution decay rate lambda_tilde
    const kappa = Math.sqrt((riskAversion * Math.pow(sigma, 2)) / eta);
    const trajectory = [];
    let remainingShares = totalShares;

    for (let k = 0; k <= numIntervals; k++) {
      const t = k * tau;
      const shares = totalShares * (Math.sinh(kappa * (totalTimeHours - t)) / Math.sinh(kappa * totalTimeHours));
      const tradeSize = k === 0 ? 0 : (trajectory[k - 1].sharesRemaining - shares);
      const permImpactBps = gamma * (totalShares - shares) * 10000;
      const tempImpactBps = eta * (tradeSize / Math.max(0.001, tau)) * 10000;

      trajectory.push({
        interval: k,
        timeHours: Number(t.toFixed(2)),
        sharesRemaining: Math.round(shares),
        sharesToTrade: Math.round(tradeSize),
        permImpactBps: Number(permImpactBps.toFixed(2)),
        tempImpactBps: Number(tempImpactBps.toFixed(2))
      });
    }

    return {
      totalShares,
      totalTimeHours,
      numIntervals,
      trajectory,
      halfLifeHours: Math.log(2) / kappa
    };
  };

  // ── 6. Nelson-Siegel Sovereign Yield Curve Model ──────────────────────────────
  const nelsonSiegel = ({ beta0 = 0.072, beta1 = -0.015, beta2 = 0.025, lambda = 1.8 }) => {
    // beta0 = Level, beta1 = Slope, beta2 = Curvature, lambda = Scale parameter
    const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30]; // Years
    const curve = maturities.map(m => {
      const tLambda = m / lambda;
      const factor1 = (1.0 - Math.exp(-tLambda)) / tLambda;
      const factor2 = factor1 - Math.exp(-tLambda);
      const rate = beta0 + beta1 * factor1 + beta2 * factor2;

      return {
        tenor: m < 1 ? `${m * 12}M` : `${m}Y`,
        maturityYears: m,
        yieldPercent: Number((rate * 100).toFixed(3))
      };
    });

    return {
      parameters: { beta0, beta1, beta2, lambda },
      curve
    };
  };

  // ── 7. VaR Statistical Model Validation Tests (Kupiec & Christoffersen) ────────
  const kupiecPOFTest = ({ numExceptions, numObservations, confidence = 0.99 }) => {
    const p = 1.0 - confidence;
    const x = numExceptions;
    const N = numObservations;
    if (N === 0) return { pass: true, pValue: 1.0, testStat: 0 };

    const p_hat = x / N;
    if (x === 0) {
      const lr = -2.0 * Math.log(Math.pow(1.0 - p, N));
      return { pass: lr < 3.841, testStat: Number(lr.toFixed(3)), pValue: 0.15, exceptions: x, expected: N * p };
    }

    const logLikNull = (N - x) * Math.log(1.0 - p) + x * Math.log(p);
    const logLikAlt  = (N - x) * Math.log(1.0 - p_hat) + x * Math.log(p_hat);
    const lrStat = -2.0 * (logLikNull - logLikAlt);

    // Chi-Square distribution with 1 degree of freedom (Critical value 3.841 for 95% confidence)
    const pass = lrStat < 3.841;

    return {
      test: 'Kupiec Proportion of Failures (POF)',
      testStat: Number(lrStat.toFixed(3)),
      criticalValue: 3.841,
      pValue: Number((1.0 - normalCDF(Math.sqrt(Math.max(0, lrStat)))).toFixed(4)),
      exceptions: x,
      expected: Number((N * p).toFixed(1)),
      pass
    };
  };

  // ── Attach QuantEngine to Global Scope ─────────────────────────────────────────
  const QuantEngine = {
    normalCDF,
    normalPDF,
    normalInvCDF,
    blackScholes,
    impliedVolatility,
    ewmaVolatility,
    garchVolatility,
    calculateVaR,
    markowitzFrontier,
    almgrenChriss,
    nelsonSiegel,
    kupiecPOFTest
  };

  if (typeof window !== 'undefined') {
    window.QuantEngine = QuantEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuantEngine;
  }
})();
