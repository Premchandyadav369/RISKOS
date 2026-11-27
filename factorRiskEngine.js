/**
 * RISKOS Barra-Style Multi-Factor Risk Attribution & Risk Decomposition Engine
 * Language: ECMAScript 2022 (Isomorphic Node.js + Browser)
 * 
 * Mathematical Formulation:
 * 1. Factor Model: r_i = sum_k (X_{ik} * f_k) + u_i
 * 2. Total Covariance: Sigma = X * F * X^T + Delta
 * 3. Portfolio Variance: sigma_P^2 = w^T * Sigma * w = w^T * (X * F * X^T) * w + w^T * Delta * w
 *    - Systematic / Factor Variance: w^T * X * F * X^T * w
 *    - Idiosyncratic / Specific Variance: w^T * Delta * w
 * 4. Percentage Factor Risk Contribution (PFRC): (Factor Variance / Total Variance) * 100%
 * 5. Marginal Contribution to Risk (MCR_i): (Sigma * w)_i / sigma_P
 * 
 * Style Factors:
 * 1. Value (B/P, E/P)
 * 2. Momentum (12-1m cumulative return)
 * 3. Quality (ROE, Debt/Equity stability)
 * 4. Low Volatility (Inverse 252d standard deviation)
 * 5. Size (Log Market Capitalization)
 * 6. Market Beta (CAPM Covariance / Market Variance)
 */

(function (root) {
  'use strict';

  class FactorRiskEngine {
    constructor() {
      this.factors = ['Value', 'Momentum', 'Quality', 'LowVolatility', 'Size', 'MarketBeta'];
    }

    /**
     * Standardize factor exposures to z-scores (mean=0, std=1 across universe)
     */
    standardizeExposures(rawExposures) {
      const nAssets = rawExposures.length;
      const nFactors = this.factors.length;
      const standardized = Array.from({ length: nAssets }, () => new Float64Array(nFactors));

      for (let f = 0; f < nFactors; f++) {
        let sum = 0;
        for (let i = 0; i < nAssets; i++) sum += rawExposures[i][f];
        const mean = sum / nAssets;

        let varSum = 0;
        for (let i = 0; i < nAssets; i++) {
          const diff = rawExposures[i][f] - mean;
          varSum += diff * diff;
        }
        const std = Math.sqrt(varSum / Math.max(1, nAssets - 1)) || 1.0;

        for (let i = 0; i < nAssets; i++) {
          standardized[i][f] = (rawExposures[i][f] - mean) / std;
        }
      }
      return standardized;
    }

    /**
     * Compute full factor risk decomposition for a given portfolio
     * @param {Array<string>} tickers 
     * @param {Array<number>} weights 
     * @param {Array<Array<number>>} factorLoadings (N x K matrix)
     * @param {Array<Array<number>>} factorCovariance (K x K matrix)
     * @param {Array<number>} specificVols (N array of annualized idiosyncratic volatilities)
     */
    decomposeRisk(tickers, weights, factorLoadings, factorCovariance, specificVols) {
      const n = tickers.length;
      const k = this.factors.length;

      // Normalize weights so sum(w) = 1
      const totalWeight = weights.reduce((a, b) => a + b, 0) || 1.0;
      const w = weights.map(x => x / totalWeight);

      // Portfolio Factor Exposure: beta_p = X^T * w (K array)
      const portExposures = new Float64Array(k);
      for (let f = 0; f < k; f++) {
        for (let i = 0; i < n; i++) {
          portExposures[f] += w[i] * factorLoadings[i][f];
        }
      }

      // Systematic / Factor Variance: beta_p^T * F * beta_p
      let factorVariance = 0.0;
      const fBeta = new Float64Array(k); // F * beta_p
      for (let r = 0; r < k; r++) {
        for (let c = 0; c < k; c++) {
          fBeta[r] += factorCovariance[r][c] * portExposures[c];
        }
        factorVariance += portExposures[r] * fBeta[r];
      }

      // Specific / Idiosyncratic Variance: sum(w_i^2 * delta_i^2)
      let specificVariance = 0.0;
      const assetSpecificRisk = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const var_i = (specificVols[i] || 0.15) ** 2;
        assetSpecificRisk[i] = (w[i] ** 2) * var_i;
        specificVariance += assetSpecificRisk[i];
      }

      // Total Portfolio Variance & Volatility
      const totalVariance = factorVariance + specificVariance;
      const portfolioVol = Math.sqrt(Math.max(1e-12, totalVariance));
      const factorVol = Math.sqrt(Math.max(1e-12, factorVariance));
      const specificVol = Math.sqrt(Math.max(1e-12, specificVariance));

      // Individual factor percentage contributions
      const factorContributions = {};
      for (let f = 0; f < k; f++) {
        const marginalRisk = (portExposures[f] * fBeta[f]) / Math.max(1e-12, totalVariance);
        factorContributions[this.factors[f]] = {
          exposure: Number(portExposures[f].toFixed(4)),
          varianceContribution: Number((portExposures[f] * fBeta[f]).toFixed(6)),
          pctRisk: Number((marginalRisk * 100).toFixed(2))
        };
      }

      return {
        portfolioVol: Number(portfolioVol.toFixed(4)),
        factorVol: Number(factorVol.toFixed(4)),
        specificVol: Number(specificVol.toFixed(4)),
        systematicRiskRatio: Number((factorVariance / totalVariance).toFixed(4)),
        idiosyncraticRiskRatio: Number((specificVariance / totalVariance).toFixed(4)),
        factorContributions,
        portfolioExposures: Array.from(portExposures).map(x => Number(x.toFixed(4)))
      };
    }

    /**
     * Black-Litterman Bayesian Portfolio Allocation Solver
     * Blends market equilibrium returns Pi with investor views Q
     */
    /**
     * Black-Litterman Bayesian Portfolio Allocation Solver
     * Blends market equilibrium returns Pi with investor views Q
     * Master formula: mu_BL = Pi + tau * Sigma * P^T * [P * tau * Sigma * P^T + Omega]^-1 * (Q - P * Pi)
     */
    solveBlackLitterman(priorWeights, covMatrix, viewsP, viewsQ, omegaMatrix, tau = 0.05, riskAversion = 2.5) {
      const n = priorWeights.length;
      const k = viewsQ ? viewsQ.length : 0;

      // 1. Implied equilibrium returns: Pi = lambda * Sigma * w_mkt
      const pi = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          sum += covMatrix[i][j] * priorWeights[j];
        }
        pi[i] = riskAversion * sum;
      }

      // If no active views, return market prior
      if (k === 0 || !viewsP || viewsP.length === 0) {
        return {
          equilibriumReturns: Array.from(pi),
          posteriorReturns: Array.from(pi),
          riskAversion,
          tau
        };
      }

      // tau * Sigma (N x N)
      const tauSigma = Array.from({ length: n }, (_, r) => 
        new Float64Array(n).map((_, c) => tau * covMatrix[r][c])
      );

      // P * tau * Sigma (K x N)
      const pTauSigma = Array.from({ length: k }, () => new Float64Array(n));
      for (let v = 0; v < k; v++) {
        for (let j = 0; j < n; j++) {
          let sum = 0;
          for (let i = 0; i < n; i++) sum += viewsP[v][i] * tauSigma[i][j];
          pTauSigma[v][j] = sum;
        }
      }

      // M = P * tau * Sigma * P^T + Omega (K x K)
      const M = Array.from({ length: k }, () => new Float64Array(k));
      for (let r = 0; r < k; r++) {
        for (let c = 0; c < k; c++) {
          let sum = 0;
          for (let j = 0; j < n; j++) sum += pTauSigma[r][j] * viewsP[c][j];
          const omegaVal = (omegaMatrix && omegaMatrix[r] && omegaMatrix[r][c] !== undefined) 
            ? omegaMatrix[r][c] 
            : (r === c ? 0.001 : 0.0);
          M[r][c] = sum + omegaVal;
        }
      }

      // View difference: Q - P * Pi (K vector)
      const viewDiff = new Float64Array(k);
      for (let v = 0; v < k; v++) {
        let pPi = 0;
        for (let i = 0; i < n; i++) pPi += viewsP[v][i] * pi[i];
        viewDiff[v] = viewsQ[v] - pPi;
      }

      // Solve M * x = viewDiff for x
      const x = new Float64Array(k);
      if (k === 1) {
        x[0] = viewDiff[0] / (M[0][0] || 1e-6);
      } else {
        // Simple 2x2 or diagonal inversion fallback
        for (let v = 0; v < k; v++) x[v] = viewDiff[v] / (M[v][v] || 1e-6);
      }

      // Adjustment: tau * Sigma * P^T * x (N vector)
      const posteriorReturns = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let adj = 0;
        for (let v = 0; v < k; v++) {
          // (tau * Sigma * P^T)_{i, v} = pTauSigma[v][i]
          adj += pTauSigma[v][i] * x[v];
        }
        posteriorReturns[i] = pi[i] + adj;
      }

      return {
        equilibriumReturns: Array.from(pi),
        posteriorReturns: Array.from(posteriorReturns),
        riskAversion,
        tau
      };
    }

    /**
     * Deflated Sharpe Ratio (DSR) - Bailey & Lopez de Prado (2014)
     * Tests if observed annualized SR is statistically significant after accounting for multiple trials,
     * non-normality (skewness, kurtosis), and track record length.
     */
    calculateDeflatedSharpeRatio(observedSR, numTrials, trackRecordDays, skewness = 0.0, kurtosis = 3.0, benchmarkSR = 0.0) {
      const T_years = Math.max(0.1, trackRecordDays / 252.0);
      const gamma = 0.5772156649; // Euler-Mascheroni constant
      let expectedMaxSR = benchmarkSR;

      if (numTrials > 1) {
        const logN = Math.log(numTrials);
        const term = Math.sqrt(2 * logN);
        // Annualized cross-sectional expected maximum under null of zero true alpha
        expectedMaxSR = benchmarkSR + 0.5 * (term + (gamma / term));
      }

      // Standard error of annualized Sharpe ratio accounting for non-normality
      const varSR = (1.0 - skewness * observedSR + ((kurtosis - 1.0) / 4.0) * (observedSR ** 2)) / T_years;
      const seSR = Math.sqrt(Math.max(1e-12, varSR));

      // Z-score
      const z = (observedSR - expectedMaxSR) / seSR;
      
      // Standard normal CDF approximation
      const cdf = (x) => {
        const k = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
        const poly = k * (0.319381530 + k * (-0.356563782 + k * (1.781477937 + k * (-1.821255978 + k * 1.330274429))));
        const app = 1.0 - (0.3989422804014327 * Math.exp(-0.5 * x * x)) * poly;
        return x >= 0 ? app : (1.0 - app);
      };

      const dsr = cdf(z);
      return {
        observedSR: Number(observedSR.toFixed(4)),
        expectedMaxSR: Number(expectedMaxSR.toFixed(4)),
        deflatedSharpeRatio: Number(dsr.toFixed(4)),
        pValue: Number((1.0 - dsr).toFixed(4)),
        isSignificant: dsr >= 0.95
      };
    }
  }

  const engine = new FactorRiskEngine();
  root.FactorRiskEngine = engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engine;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
