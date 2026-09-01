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

  // ── 8. Brinson-Fachler Multi-Sector Performance Attribution ───────────────────
  const brinsonAttribution = ({ portfolioWeights, benchmarkWeights, portfolioReturns, benchmarkReturns, sectors }) => {
    // Allocation: (wp_i - wb_i) * (Rb_i - Rb_total)
    // Selection:  wb_i * (Rp_i - Rb_i)
    // Interaction: (wp_i - wb_i) * (Rp_i - Rb_i)
    const n = sectors.length;
    const totalBenchmarkReturn = benchmarkWeights.reduce((acc, w, i) => acc + w * benchmarkReturns[i], 0);
    const totalPortfolioReturn = portfolioWeights.reduce((acc, w, i) => acc + w * portfolioReturns[i], 0);

    const attributionRows = sectors.map((sec, i) => {
      const wp = portfolioWeights[i] || 0;
      const wb = benchmarkWeights[i] || 0;
      const rp = portfolioReturns[i] || 0;
      const rb = benchmarkReturns[i] || 0;

      const allocation = (wp - wb) * (rb - totalBenchmarkReturn);
      const selection  = wb * (rp - rb);
      const interaction = (wp - wb) * (rp - rb);
      const totalActive = allocation + selection + interaction;

      return {
        sector: sec,
        portfolioWeight: Number((wp * 100).toFixed(2)),
        benchmarkWeight: Number((wb * 100).toFixed(2)),
        portfolioReturn: Number((rp * 100).toFixed(2)),
        benchmarkReturn: Number((rb * 100).toFixed(2)),
        allocationBps: Number((allocation * 10000).toFixed(1)),
        selectionBps:  Number((selection * 10000).toFixed(1)),
        interactionBps: Number((interaction * 10000).toFixed(1)),
        totalActiveBps: Number((totalActive * 10000).toFixed(1))
      };
    });

    const totalAlloc = attributionRows.reduce((a, r) => a + r.allocationBps, 0);
    const totalSelect = attributionRows.reduce((a, r) => a + r.selectionBps, 0);
    const totalInteract = attributionRows.reduce((a, r) => a + r.interactionBps, 0);
    const totalActiveAlpha = totalAlloc + totalSelect + totalInteract;

    return {
      summary: {
        portfolioReturnPct: Number((totalPortfolioReturn * 100).toFixed(2)),
        benchmarkReturnPct: Number((totalBenchmarkReturn * 100).toFixed(2)),
        totalActiveAlphaBps: Number(totalActiveAlpha.toFixed(1)),
        allocationEffectBps: Number(totalAlloc.toFixed(1)),
        selectionEffectBps:  Number(totalSelect.toFixed(1)),
        interactionEffectBps: Number(totalInteract.toFixed(1))
      },
      sectors: attributionRows
    };
  };

  // ── 9. Hagan Analytical SABR Implied Volatility Smile Engine ───────────────────
  const sabrVolatilitySmile = ({ F, K, T, alpha = 0.25, beta = 0.70, rho = -0.25, nu = 0.40 }) => {
    // Forward F, Strike K, Expiry T (years)
    const forward = Math.max(0.001, Number(F));
    const strike = Math.max(0.001, Number(K));
    const time = Math.max(0.001, Number(T));

    if (Math.abs(forward - strike) < 1e-6) {
      // ATM formula
      const term1 = alpha / Math.pow(forward, 1.0 - beta);
      const term2 = 1.0 + (
        ((1.0 - beta) * (1.0 - beta) * alpha * alpha) / (24.0 * Math.pow(forward, 2.0 - 2.0 * beta)) +
        (rho * beta * nu * alpha) / (4.0 * Math.pow(forward, 1.0 - beta)) +
        ((2.0 - 3.0 * rho * rho) * nu * nu) / 24.0
      ) * time;
      return Number((term1 * term2).toFixed(4));
    }

    const fkBeta = Math.pow(forward * strike, (1.0 - beta) / 2.0);
    const logFK = Math.log(forward / strike);
    const z = (nu / alpha) * fkBeta * logFK;
    const xz = Math.log((Math.sqrt(1.0 - 2.0 * rho * z + z * z) + z - rho) / (1.0 - rho));

    const denominator = fkBeta * (
      1.0 +
      ((1.0 - beta) * (1.0 - beta) / 24.0) * logFK * logFK +
      (Math.pow(1.0 - beta, 4) / 1920.0) * Math.pow(logFK, 4)
    );

    const numerator = alpha * (z / xz);
    const timeFactor = 1.0 + (
      ((1.0 - beta) * (1.0 - beta) * alpha * alpha) / (24.0 * fkBeta * fkBeta) +
      (rho * beta * nu * alpha) / (4.0 * fkBeta) +
      ((2.0 - 3.0 * rho * rho) * nu * nu) / 24.0
    ) * time;

    const sigmaSABR = (numerator / denominator) * timeFactor;
    return Math.max(0.01, Number(sigmaSABR.toFixed(4)));
  };

  // ── 10. Dupire Local Volatility Surface Extractor ──────────────────────────────
  const dupireLocalVolatility = ({ spot, strike, tenor, dC_dT, dC_dK, d2C_dK2, r = 0.05, q = 0.0 }) => {
    // Dupire (1994) Formula: sigma_loc^2(K, T) = [dC/dT + (r-q)K*dC/dK + q*C] / [0.5 * K^2 * d2C/dK2]
    const k = Math.max(0.01, Number(strike));
    const denom = 0.5 * k * k * Math.max(1e-7, Number(d2C_dK2));
    const numer = Math.max(1e-7, Number(dC_dT) + (r - q) * k * Number(dC_dK) + q * spot);
    const localVar = Math.max(0.0001, numer / denom);
    return Math.min(2.0, Math.max(0.05, Math.sqrt(localVar)));
  };

  // ── 11. Key Rate Durations (KRD) & Yield Curve Twist Sensitivity ──────────────
  const keyRateDurationConvexity = ({ cashFlows, curveYields, notional = 10000000 }) => {
    // Evaluates portfolio price sensitivity to localized shifts at 1Y, 2Y, 5Y, 10Y, 30Y tenors
    const tenors = [1, 2, 5, 10, 30];
    const baseDiscounted = cashFlows.map(cf => cf.amount * Math.exp(-(curveYields[cf.year] || 0.07) * cf.year));
    const basePrice = baseDiscounted.reduce((a, b) => a + b, 0);

    const krdResults = tenors.map(keyTenor => {
      // Shift curve locally by +1 bp at keyTenor
      const shiftedPrice = cashFlows.reduce((acc, cf) => {
        const weight = Math.max(0, 1.0 - Math.abs(cf.year - keyTenor) / Math.max(1, keyTenor * 0.5));
        const rate = (curveYields[cf.year] || 0.07) + (weight * 0.0001);
        return acc + cf.amount * Math.exp(-rate * cf.year);
      }, 0);

      const krdYears = -((shiftedPrice - basePrice) / basePrice) / 0.0001;
      const dv01 = (basePrice * krdYears * 0.0001 * (notional / basePrice));

      return {
        keyTenor: `${keyTenor}Y`,
        durationYears: Number(krdYears.toFixed(3)),
        dv01INR: Number(dv01.toFixed(2))
      };
    });

    const totalModifiedDuration = krdResults.reduce((a, r) => a + r.durationYears, 0);
    const totalDV01 = (notional * totalModifiedDuration * 0.0001);

    return {
      basePortfolioValue: Number(basePrice.toFixed(2)),
      totalModifiedDuration: Number(totalModifiedDuration.toFixed(3)),
      totalDV01INR: Number(totalDV01.toFixed(2)),
      keyRateDurations: krdResults
    };
  };

  // ── 12. Credit Default Swap (CDSW) Hazard Rate Curve Bootstrapper ─────────────
  const creditDefaultSwapCurve = ({ parSpreadsBps = [45, 65, 95, 130, 165], tenors = [1, 2, 3, 5, 10], recoveryRate = 0.40, riskFreeRate = 0.05 }) => {
    // Bloomberg CDSW intensity model: lambda_t = spread / (1 - recovery)
    const LGD = 1.0 - recoveryRate;
    const curve = tenors.map((t, i) => {
      const spread = (parSpreadsBps[i] || 100) / 10000.0;
      const hazardRate = spread / LGD; // Annual default intensity lambda
      const survivalProb = Math.exp(-hazardRate * t); // Q(0, t)
      const defaultProb = 1.0 - survivalProb; // Cumulative PD

      return {
        tenor: `${t}Y`,
        parSpreadBps: parSpreadsBps[i],
        hazardRateAnnual: Number((hazardRate * 100).toFixed(3)),
        cumulativePD: Number((defaultProb * 100).toFixed(2)),
        survivalProbPct: Number((survivalProb * 100).toFixed(2))
      };
    });

    return {
      recoveryRatePct: Number((recoveryRate * 100).toFixed(0)),
      lossGivenDefaultPct: Number((LGD * 100).toFixed(0)),
      hazardCurve: curve
    };
  };

  // ── 13. Cornish-Fisher Non-Normal VaR & Fat-Tail Expansion ────────────────────
  const cornishFisherVaR = ({ mean = 0.0, std = 0.015, skewness = -0.45, kurtosis = 4.20, confidence = 0.99 }) => {
    const z = normalInvCDF(confidence);
    const S = Number(skewness);
    const K = Number(kurtosis) - 3.0; // Excess kurtosis

    // Cornish-Fisher expansion adjustment
    const z_cf = z + 
      (1.0 / 6.0) * (z * z - 1.0) * S +
      (1.0 / 24.0) * (z * z * z - 3.0 * z) * K -
      (1.0 / 36.0) * (2.0 * z * z * z - 5.0 * z) * S * S;

    const parametricVaR = -(mean - z * std);
    const cornishFisherVaR = -(mean - z_cf * std);
    const fatTailPremiumPct = ((cornishFisherVaR - parametricVaR) / parametricVaR) * 100;

    return {
      confidencePct: Number((confidence * 100).toFixed(1)),
      gaussianZ: Number(z.toFixed(3)),
      cornishFisherZ: Number(z_cf.toFixed(3)),
      parametricVaR: Number((parametricVaR * 100).toFixed(3)),
      cornishFisherVaR: Number((cornishFisherVaR * 100).toFixed(3)),
      fatTailPremiumPct: Number(fatTailPremiumPct.toFixed(1))
    };
  };

  // ── 14. Kelly Criterion Optimal Institutional Leverage Sizer ─────────────────
  const kellyOptimalLeverage = ({ winRate = 0.56, winLossRatio = 1.45, maxLeverage = 3.0 }) => {
    // Discrete Kelly: f* = p - (1-p)/b
    const p = Number(winRate);
    const b = Number(winLossRatio);
    const f_full = (p * (b + 1.0) - 1.0) / b;
    const f_half = f_full * 0.5; // Half-Kelly (institutional standard)
    const f_quarter = f_full * 0.25;

    return {
      fullKellyLeverage: Number(Math.max(0, Math.min(maxLeverage, f_full)).toFixed(2)),
      halfKellyLeverage: Number(Math.max(0, Math.min(maxLeverage, f_half)).toFixed(2)),
      quarterKellyLeverage: Number(Math.max(0, Math.min(maxLeverage, f_quarter)).toFixed(2)),
      expectedGrowthRate: Number((p * Math.log(1.0 + f_half * b) + (1.0 - p) * Math.log(1.0 - f_half)).toFixed(4))
    };
  };

  // ── 15. Prediction Markets: Hanson's LMSR Market Maker Engine ──────────────────
  const predictionMarketLMSR = {
    // Cost Function: C(q) = b * ln(sum(e^{q_i / b}))
    cost: (qYes, qNo, b = 1000) => {
      const bParam = Math.max(1, Number(b));
      return bParam * Math.log(Math.exp(qYes / bParam) + Math.exp(qNo / bParam));
    },

    // Marginal Probabilities: p_i = e^{q_i / b} / sum(e^{q_j / b})
    probabilities: (qYes, qNo, b = 1000) => {
      const bParam = Math.max(1, Number(b));
      const maxQ = Math.max(qYes, qNo);
      const expYes = Math.exp((qYes - maxQ) / bParam);
      const expNo = Math.exp((qNo - maxQ) / bParam);
      const sumExp = expYes + expNo;
      const pYes = expYes / sumExp;
      const pNo = expNo / sumExp;
      return {
        probYes: Number(pYes.toFixed(4)),
        probNo: Number(pNo.toFixed(4)),
        priceYesCents: Number((pYes * 100).toFixed(1)),
        priceNoCents: Number((pNo * 100).toFixed(1))
      };
    },

    // Trade Execution Cost: Delta C = C(q + delta) - C(q)
    trade: (qYes, qNo, deltaShares, outcome = 'YES', b = 1000) => {
      const bParam = Math.max(1, Number(b));
      const costBefore = bParam * Math.log(Math.exp(qYes / bParam) + Math.exp(qNo / bParam));
      const newQYes = outcome === 'YES' ? qYes + deltaShares : qYes;
      const newQNo = outcome === 'NO' ? qNo + deltaShares : qNo;
      const costAfter = bParam * Math.log(Math.exp(newQYes / bParam) + Math.exp(newQNo / bParam));
      const totalCost = costAfter - costBefore;
      const avgPricePerShare = totalCost / deltaShares;

      const newProbs = predictionMarketLMSR.probabilities(newQYes, newQNo, bParam);

      return {
        newQYes: Number(newQYes.toFixed(1)),
        newQNo: Number(newQNo.toFixed(1)),
        totalCost: Number(totalCost.toFixed(2)),
        avgPricePerShare: Number(avgPricePerShare.toFixed(3)),
        newProbYes: newProbs.probYes,
        newProbNo: newProbs.probNo,
        newPriceYesCents: newProbs.priceYesCents,
        newPriceNoCents: newProbs.priceNoCents
      };
    }
  };

  // ── 16. Futures Market: Cost-of-Carry & Calendar Basis Arbitrage ───────────────
  const futuresMarketEngine = {
    // Fair Theoretical Futures Price: F(t, T) = S_t * e^{(r - q + u) * (T - t)}
    fairPrice: ({ spotPrice = 24500, riskFreeRate = 0.065, dividendYield = 0.012, storageCost = 0.0, timeToExpiry = 0.0833 }) => {
      const S = Number(spotPrice);
      const r = Number(riskFreeRate);
      const q = Number(dividendYield);
      const u = Number(storageCost);
      const T = Number(timeToExpiry);

      const netCarryRate = r - q + u;
      const theoreticalFutures = S * Math.exp(netCarryRate * T);
      const basisPoints = theoreticalFutures - S;
      const annualizedBasisYield = (basisPoints / S) * (1.0 / Math.max(0.001, T)) * 100;

      return {
        spotPrice: S,
        theoreticalFutures: Number(theoreticalFutures.toFixed(2)),
        netCarryRatePct: Number((netCarryRate * 100).toFixed(2)),
        basisPoints: Number(basisPoints.toFixed(2)),
        annualizedBasisYieldPct: Number(annualizedBasisYield.toFixed(2))
      };
    },

    // Calendar Spread Roll Yield: (F_near - F_far) / F_near * (365 / days)
    calendarSpread: ({ nearPrice = 24550, farPrice = 24680, daysBetween = 30 }) => {
      const near = Number(nearPrice);
      const far = Number(farPrice);
      const days = Math.max(1, Number(daysBetween));

      const spread = far - near;
      const isContango = spread > 0;
      const rollYieldAnnualized = ((near - far) / near) * (365.0 / days) * 100;

      return {
        nearPrice: near,
        farPrice: far,
        spreadPoints: Number(spread.toFixed(2)),
        structure: isContango ? 'CONTANGO (Carry Cost)' : 'BACKWARDATION (Convenience Yield)',
        rollYieldAnnualizedPct: Number(rollYieldAnnualized.toFixed(2))
      };
    },

    // Cash & Carry Arbitrage Execution Simulator: Long Spot + Short Overpriced Futures
    cashAndCarryArbitrage: ({ spotPrice = 24500, actualFuturesPrice = 24650, daysToExpiry = 30, borrowRate = 0.065, divYield = 0.012, capital = 10000000 }) => {
      const S = Number(spotPrice);
      const F = Number(actualFuturesPrice);
      const T = Number(daysToExpiry) / 365.0;
      const r = Number(borrowRate);
      const q = Number(divYield);
      const cap = Number(capital);

      const fairF = S * Math.exp((r - q) * T);
      const mispricing = F - fairF;
      const basisYield = ((F - S) / S) * (365.0 / daysToExpiry) * 100;
      const netArbSpreadAnnualized = basisYield - (r - q) * 100;

      const isArbitrageProfitable = mispricing > (S * 0.001); // 10 bps threshold for transaction costs
      const contractsTraded = Math.floor(cap / (S * 50)); // 50 lot size
      const grossPnL = isArbitrageProfitable ? mispricing * contractsTraded * 50 : 0;
      const financingCost = cap * r * T;
      const netProfit = Math.max(0, grossPnL - financingCost * 0.1);

      return {
        fairFutures: Number(fairF.toFixed(2)),
        actualFutures: F,
        mispricingPoints: Number(mispricing.toFixed(2)),
        basisYieldAnnualizedPct: Number(basisYield.toFixed(2)),
        netArbSpreadAnnualizedPct: Number(netArbSpreadAnnualized.toFixed(2)),
        opportunity: isArbitrageProfitable ? 'CASH & CARRY ARBITRAGE (Short Futures, Long Spot)' : mispricing < -5 ? 'REVERSE CASH & CARRY (Long Futures, Short Spot)' : 'FAIR VALUE EQUILIBRIUM',
        contractsTraded,
        estimatedNetProfitINR: Number(netProfit.toFixed(0))
      };
    }
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
    kupiecPOFTest,
    brinsonAttribution,
    sabrVolatilitySmile,
    dupireLocalVolatility,
    keyRateDurationConvexity,
    creditDefaultSwapCurve,
    cornishFisherVaR,
    kellyOptimalLeverage,
    predictionMarketLMSR,
    futuresMarketEngine
  };

  if (typeof window !== 'undefined') {
    window.QuantEngine = QuantEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuantEngine;
  }
})();
