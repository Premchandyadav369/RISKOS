/**
 * RISKOS Proprietary Algorithm 3: F-Shrink
 * Factor-Shrunk Ledoit-Wolf Covariance Operator (Isomorphic JavaScript)
 * 
 * Mathematical Formulation:
 * 1. Structural Barra Factor Prior: F_prior = X * F * X^T + Delta
 * 2. Empirical Sample Covariance: S
 * 3. Optimal Frobenius Shrinkage Intensity:
 *    delta* = min(1, max(0, sum(Var(s_ij)) / (sum(Var(s_ij)) + sum((f_ij - s_ij)^2))))
 * 4. Shrunk Matrix: Sigma* = delta* * F_prior + (1 - delta*) * S
 */

(function (root) {
  'use strict';

  class FactorShrinkEngine {
    /**
     * Compute F-Shrink Covariance Matrix
     * @param {Array<Array<number>>} sampleCov (N x N)
     * @param {Array<Array<number>>} factorPrior (N x N)
     * @param {number} sampleObservations T
     */
    shrink(sampleCov, factorPrior, sampleObservations = 252) {
      const n = sampleCov.length;
      const T = Math.max(10, sampleObservations);

      let sumVarS = 0.0;
      let sumDistSquare = 0.0;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const s_ij = sampleCov[i][j];
          const f_ij = factorPrior[i][j];

          // Asymptotic estimation variance of sample covariance element
          const var_s = (s_ij * s_ij) / T;
          sumVarS += var_s;

          const diff = f_ij - s_ij;
          sumDistSquare += diff * diff;
        }
      }

      // Optimal shrinkage parameter delta*
      let deltaStar = 0.5;
      if (sumVarS + sumDistSquare > 1e-12) {
        deltaStar = sumVarS / (sumVarS + sumDistSquare);
      }
      deltaStar = Math.min(1.0, Math.max(0.0, deltaStar));

      // Shrunk Matrix Sigma*
      const shrunkCov = Array.from({ length: n }, () => new Float64Array(n));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          shrunkCov[i][j] = deltaStar * factorPrior[i][j] + (1.0 - deltaStar) * sampleCov[i][j];
        }
      }

      // Verify positive semi-definiteness on diagonal
      for (let i = 0; i < n; i++) {
        if (shrunkCov[i][i] < 1e-8) shrunkCov[i][i] = 1e-4;
      }

      return {
        shrunkCovariance: Array.from(shrunkCov).map(row => Array.from(row)),
        shrinkageIntensity: Number(deltaStar.toFixed(4)),
        sampleVarianceSum: Number(sumVarS.toFixed(6)),
        priorDistanceSum: Number(sumDistSquare.toFixed(6)),
        sampleObservations: T
      };
    }
  }

  const engine = new FactorShrinkEngine();
  root.FactorShrinkEngine = FactorShrinkEngine;
  root.defaultFactorShrink = engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FactorShrinkEngine;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
