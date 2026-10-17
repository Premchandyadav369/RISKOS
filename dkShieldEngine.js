/**
 * RISKOS Proprietary Algorithm 4: DK-Shield
 * Dynamic Kelly-CVaR Hyperbolic Drawdown Shield (Isomorphic JavaScript)
 * 
 * Mathematical Formulation:
 * 1. Static Kelly Growth: f* = (mu - r_f) / sigma^2
 * 2. Instantaneous Drawdown: D_t = (HWM - V_t) / HWM
 * 3. Hyperbolic Barrier Argument: u_t = (D_max - D_t) / CVaR_99
 * 4. Shield Multiplier: Shield = tanh(max(0, u_t))
 * 5. Safe Optimal Sizing: f_DK = f* * Shield * (1 / (1 + psi * VolRegime))
 */

(function (root) {
  'use strict';

  class DkShieldEngine {
    constructor(params = {}) {
      this.dMax = params.dMax ?? 0.15; // 15% Maximum Drawdown Ceiling
      this.riskFreeRate = params.riskFreeRate ?? 0.05;
      this.psi = params.psi ?? 0.50; // Volatility clustering damping
    }

    /**
     * Compute Dynamic Kelly Sizing
     * @param {number} expectedReturn mu
     * @param {number} volatility sigma
     * @param {number} currentNav V_t
     * @param {number} highWaterMark HWM
     * @param {number} cvar99 Conditional Value at Risk (positive fraction, e.g. 0.04)
     * @param {number} volRatio Current Vol / Baseline Vol (e.g. 1.2)
     */
    computeSizing(expectedReturn, volatility, currentNav, highWaterMark, cvar99 = 0.04, volRatio = 1.0) {
      const hwm = Math.max(1.0, highWaterMark);
      const nav = Math.max(0.01, currentNav);

      // Instantaneous Drawdown
      const currentDrawdown = Math.max(0.0, (hwm - nav) / hwm);

      // Baseline unconstrained Kelly fraction
      const varAsset = Math.max(1e-4, volatility * volatility);
      const rawKelly = (expectedReturn - this.riskFreeRate) / varAsset;

      // Barrier argument
      const remainingDrawdownBudget = this.dMax - currentDrawdown;
      const cvarSafe = Math.max(0.005, cvar99);

      let shield = 0.0;
      if (remainingDrawdownBudget > 0.0) {
        const u = remainingDrawdownBudget / cvarSafe;
        shield = Math.tanh(u);
      }

      // Volatility clustering penalty
      const volRegimeDamping = 1.0 / (1.0 + this.psi * Math.max(0.0, volRatio - 1.0));

      // Final Dynamic Kelly fraction, bounded to [0, 2.0]
      const dynamicKelly = Math.max(0.0, Math.min(2.0, rawKelly * shield * volRegimeDamping));

      return {
        rawKelly: Number(rawKelly.toFixed(4)),
        dynamicKelly: Number(dynamicKelly.toFixed(4)),
        shieldMultiplier: Number(shield.toFixed(4)),
        currentDrawdown: Number(currentDrawdown.toFixed(4)),
        remainingDrawdownBudget: Number(remainingDrawdownBudget.toFixed(4)),
        isHalted: remainingDrawdownBudget <= 0.001
      };
    }
  }

  const engine = new DkShieldEngine();
  root.DkShieldEngine = DkShieldEngine;
  root.defaultDkShield = engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DkShieldEngine;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
