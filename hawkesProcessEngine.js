/**
 * RISKOS High-Frequency Trading (HFT) Hawkes Process Engine
 * 
 * Implements a Self-Exciting Point Process to model:
 * - Trade clustering and endogenous feedback loops
 * - Branching ratio n = alpha / beta (Subcritical vs Critical vs Supercritical)
 * - Liquidity withdrawal and flash-crash cascade risk detection
 * - O(1) recursive intensity updates: lambda(t) = mu + sum(alpha * exp(-beta * (t - t_i)))
 */

(function (global) {
  'use strict';

  class HawkesProcessEngineCore {
    constructor() {
      // Default parameters calibrated to high-frequency equity & crypto microstructure
      this.mu = 1.20;       // Exogenous baseline order arrival rate (orders/sec)
      this.alpha = 4.80;    // Excitation magnitude (jump per trade)
      this.beta = 6.00;     // Exponential memory decay rate (1/sec)
      
      this.lastEventTime = Date.now() / 1000;
      this.currentIntensity = this.mu;
      this.intensityHistory = []; // { time, intensity, isShock }
      this.maxHistory = 120;

      this.eventLog = [];
      this.totalEvents = 0;
      this.endogenousCount = 0;
      this.exogenousCount = 0;
    }

    setParameters(mu, alpha, beta) {
      if (mu !== undefined && mu > 0) this.mu = Number(mu);
      if (alpha !== undefined && alpha >= 0) this.alpha = Number(alpha);
      if (beta !== undefined && beta > 0) this.beta = Number(beta);
      return this.getMetrics();
    }

    /**
     * Compute current Branching Ratio n = alpha / beta
     * Invariant:
     * - n < 1: Sub-critical (Stationary, stable flow)
     * - 0.80 <= n <= 1.0: Critical (Cluster risk, liquidity evaporation)
     * - n > 1: Super-critical (Explosive cascade / Flash crash regime)
     */
    getBranchingRatio() {
      return Number((this.alpha / this.beta).toFixed(3));
    }

    getRegime() {
      const n = this.getBranchingRatio();
      if (n > 1.0) {
        return {
          status: 'SUPER-CRITICAL CASCADE (FLASH CRASH)',
          level: 'CRITICAL',
          color: '#ef4444',
          description: 'Self-reinforcing stop-loss cascades. High-frequency liquidity withdrawal imminent.'
        };
      } else if (n >= 0.80) {
        return {
          status: 'ELEVATED CLUSTERING (NEAR CRITICAL)',
          level: 'WARNING',
          color: '#f59e0b',
          description: 'High endogenous feedback. Trades triggering rapid follow-on algorithmic sweeps.'
        };
      } else {
        return {
          status: 'STABLE SUB-CRITICAL REGIME',
          level: 'NORMAL',
          color: '#10b981',
          description: 'Normal Poisson-like order arrivals with healthy passive limit liquidity.'
        };
      }
    }

    /**
     * Recursive O(1) Intensity Decay update:
     * lambda(t) = mu + (lambda(t_prev) - mu) * exp(-beta * (t - t_prev))
     */
    decayIntensity(currentTime = Date.now() / 1000) {
      const dt = Math.max(0, currentTime - this.lastEventTime);
      const decayedExcitation = (this.currentIntensity - this.mu) * Math.exp(-this.beta * dt);
      this.currentIntensity = Math.max(this.mu, this.mu + decayedExcitation);
      this.lastEventTime = currentTime;
      return this.currentIntensity;
    }

    /**
     * Register a trade print event (from SecurityMaster live tape or simulation)
     * Adds an alpha excitation jump to intensity
     */
    registerTrade(tradeSize = 100, isAggressiveSweep = false) {
      const now = Date.now() / 1000;
      this.decayIntensity(now);

      // Volume scaling: larger orders exert greater excitation
      const sizeMultiplier = Math.min(3.0, Math.max(0.8, Math.sqrt(tradeSize / 100)));
      const jump = this.alpha * sizeMultiplier * (isAggressiveSweep ? 1.5 : 1.0);

      // Decompose into endogenous vs exogenous
      const endoProb = (this.currentIntensity - this.mu) / Math.max(0.001, this.currentIntensity);
      if (Math.random() < endoProb) {
        this.endogenousCount++;
      } else {
        this.exogenousCount++;
      }

      this.currentIntensity += jump;
      this.totalEvents++;

      const metric = {
        time: Number(now.toFixed(3)),
        intensity: Number(this.currentIntensity.toFixed(2)),
        tradeSize,
        branchingRatio: this.getBranchingRatio()
      };

      this.intensityHistory.push(metric);
      if (this.intensityHistory.length > this.maxHistory) {
        this.intensityHistory.shift();
      }

      return metric;
    }

    /**
     * Inject a simulated Microstructure Cascade Shock (e.g. 50 rapid algorithmic sweep orders)
     */
    simulateShock(orderCount = 50) {
      const now = Date.now() / 1000;
      this.decayIntensity(now);

      // Shock boosts excitation temporarily into supercritical zone
      const shockAlpha = this.beta * 1.35; // forces n = 1.35 supercritical
      const oldAlpha = this.alpha;
      this.alpha = shockAlpha;

      for (let i = 0; i < orderCount; i++) {
        this.registerTrade(Math.floor(250 + Math.random() * 800), true);
      }

      // Restore baseline alpha after shock
      setTimeout(() => {
        this.alpha = oldAlpha;
      }, 4000);

      return this.getMetrics();
    }

    reset() {
      this.currentIntensity = this.mu;
      this.lastEventTime = Date.now() / 1000;
      this.intensityHistory = [];
      this.totalEvents = 0;
      this.endogenousCount = 0;
      this.exogenousCount = 0;
    }

    getMetrics() {
      this.decayIntensity();
      const n = this.getBranchingRatio();
      const regime = this.getRegime();
      const total = this.totalEvents || 1;
      const endoRatio = Number(((this.endogenousCount / total) * 100).toFixed(1));

      return {
        currentIntensity: Number(this.currentIntensity.toFixed(2)),
        baselineRate: this.mu,
        excitationAlpha: this.alpha,
        decayBeta: this.beta,
        branchingRatio: n,
        regime: regime.status,
        regimeLevel: regime.level,
        regimeColor: regime.color,
        regimeDescription: regime.description,
        endogenousRatioPct: endoRatio,
        exogenousRatioPct: Number((100 - endoRatio).toFixed(1)),
        totalEvents: this.totalEvents,
        history: [...this.intensityHistory]
      };
    }
  }

  // Singleton instance
  const engineInstance = new HawkesProcessEngineCore();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      HawkesProcessEngine: engineInstance,
      HawkesProcessEngineCore
    };
  }

  if (typeof window !== 'undefined') {
    window.HawkesProcessEngine = engineInstance;
    window.HawkesProcessEngineCore = HawkesProcessEngineCore;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
