/**
 * RISKOS — MULTI-LEG OPTIONS STRATEGY BUILDER & GREEKS HEATMAP (optionsStrategyBuilder.js)
 * Institutional derivative structure designer with T+0 vs T+Exp curves, break-evens, and 2D stress matrix.
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OptionsStrategyBuilder = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // Standard Normal CDF approximation
  function cdfNormal(x) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.SQRT2;
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return 0.5 * (1.0 + sign * y);
  }

  function bsPrice(S, K, T, r, sigma, type = 'call') {
    if (T <= 0.0001) {
      return type.toLowerCase() === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    }
    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    if (type.toLowerCase() === 'call') {
      return S * cdfNormal(d1) - K * Math.exp(-r * T) * cdfNormal(d2);
    } else {
      return K * Math.exp(-r * T) * cdfNormal(-d2) - S * cdfNormal(-d1);
    }
  }

  function bsGreeks(S, K, T, r, sigma, type = 'call') {
    const isCall = type.toLowerCase() === 'call';
    if (T <= 0.0001) {
      return { delta: isCall ? (S >= K ? 1 : 0) : (S <= K ? -1 : 0), gamma: 0, vega: 0, theta: 0 };
    }
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;
    const pdf = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);

    const delta = isCall ? cdfNormal(d1) : cdfNormal(d1) - 1;
    const gamma = pdf / (S * sigma * sqrtT);
    const vega = (S * sqrtT * pdf) / 100; // per 1% vol
    const theta = (-(S * sigma * pdf) / (2 * sqrtT) - (isCall ? 1 : -1) * r * K * Math.exp(-r * T) * cdfNormal(isCall ? d2 : -d2)) / 365;

    return { delta, gamma, vega, theta };
  }

  class OptionsStrategyBuilderEngine {
    constructor(spot = 24500, rate = 0.065) {
      this.spot = spot;
      this.rate = rate;
      this.legs = [];
    }

    addLeg({ type, side, strike, expiryDays, impliedVol, premium, contracts = 1, lotSize = 50 }) {
      // side: 'BUY' (long) or 'SELL' (short)
      // type: 'call' or 'put'
      const T = expiryDays / 365;
      const prem = premium !== undefined ? premium : bsPrice(this.spot, strike, T, this.rate, impliedVol, type);

      this.legs.push({
        id: 'LEG_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        type: type.toLowerCase(),
        side: side.toUpperCase(),
        strike,
        expiryDays,
        T,
        impliedVol,
        premium: +prem.toFixed(2),
        contracts,
        lotSize
      });
    }

    clearLegs() {
      this.legs = [];
    }

    // Pre-built Institutional Strategy Templates
    loadPreset(presetName, spot = this.spot) {
      this.clearLegs();
      const iv = 0.14; // 14% IV
      const exp = 7; // 7 DTE

      switch (presetName.toLowerCase()) {
        case 'iron_condor':
          // Long OTM Put (strike 24000), Short Put (24300), Short Call (24700), Long OTM Call (25000)
          this.addLeg({ type: 'put', side: 'BUY', strike: spot - 500, expiryDays: exp, impliedVol: iv + 0.02 });
          this.addLeg({ type: 'put', side: 'SELL', strike: spot - 200, expiryDays: exp, impliedVol: iv + 0.01 });
          this.addLeg({ type: 'call', side: 'SELL', strike: spot + 200, expiryDays: exp, impliedVol: iv });
          this.addLeg({ type: 'call', side: 'BUY', strike: spot + 500, expiryDays: exp, impliedVol: iv + 0.01 });
          break;

        case 'long_butterfly':
          // Long 1 ATM-200 Call, Short 2 ATM Call, Long 1 ATM+200 Call
          this.addLeg({ type: 'call', side: 'BUY', strike: spot - 200, expiryDays: exp, impliedVol: iv, contracts: 1 });
          this.addLeg({ type: 'call', side: 'SELL', strike: spot, expiryDays: exp, impliedVol: iv, contracts: 2 });
          this.addLeg({ type: 'call', side: 'BUY', strike: spot + 200, expiryDays: exp, impliedVol: iv, contracts: 1 });
          break;

        case 'long_straddle':
          // Long ATM Call + Long ATM Put
          this.addLeg({ type: 'call', side: 'BUY', strike: spot, expiryDays: exp, impliedVol: iv });
          this.addLeg({ type: 'put', side: 'BUY', strike: spot, expiryDays: exp, impliedVol: iv });
          break;

        case 'bull_call_spread':
          this.addLeg({ type: 'call', side: 'BUY', strike: spot, expiryDays: exp, impliedVol: iv });
          this.addLeg({ type: 'call', side: 'SELL', strike: spot + 300, expiryDays: exp, impliedVol: iv });
          break;

        default:
          throw new Error('Unknown preset: ' + presetName);
      }
    }

    calculateStrategyPayoff(minSpot = null, maxSpot = null, steps = 50) {
      if (!this.legs.length) return null;

      const spot = this.spot;
      const low = minSpot || spot * 0.92;
      const high = maxSpot || spot * 1.08;
      const stepSize = (high - low) / steps;

      const curveT0 = [];
      const curveExp = [];
      const spots = [];

      let totalInitialDebit = 0; // Net premium paid (+ = debit, - = credit)
      this.legs.forEach(leg => {
        const sign = leg.side === 'BUY' ? 1 : -1;
        totalInitialDebit += sign * leg.premium * leg.contracts * leg.lotSize;
      });

      for (let i = 0; i <= steps; i++) {
        const s = +(low + (i * stepSize)).toFixed(2);
        spots.push(s);

        let pnlExp = -totalInitialDebit;
        let pnlT0 = -totalInitialDebit;

        this.legs.forEach(leg => {
          const sign = leg.side === 'BUY' ? 1 : -1;
          const mult = sign * leg.contracts * leg.lotSize;

          // Expiration payoff
          const intrinsic = leg.type === 'call' ? Math.max(0, s - leg.strike) : Math.max(0, leg.strike - s);
          pnlExp += mult * intrinsic;

          // T+0 payoff
          const currentBs = bsPrice(s, leg.strike, leg.T, this.rate, leg.impliedVol, leg.type);
          pnlT0 += mult * currentBs;
        });

        curveExp.push(+pnlExp.toFixed(2));
        curveT0.push(+pnlT0.toFixed(2));
      }

      // Compute Net Aggregate Greeks
      let netDelta = 0, netGamma = 0, netVega = 0, netTheta = 0;
      this.legs.forEach(leg => {
        const sign = leg.side === 'BUY' ? 1 : -1;
        const mult = sign * leg.contracts * leg.lotSize;
        const g = bsGreeks(this.spot, leg.strike, leg.T, this.rate, leg.impliedVol, leg.type);

        netDelta += mult * g.delta;
        netGamma += mult * g.gamma;
        netVega += mult * g.vega;
        netTheta += mult * g.theta;
      });

      // Find Break-Even spots
      const breakEvens = [];
      for (let i = 1; i < curveExp.length; i++) {
        if ((curveExp[i - 1] < 0 && curveExp[i] >= 0) || (curveExp[i - 1] >= 0 && curveExp[i] < 0)) {
          breakEvens.push(spots[i]);
        }
      }

      const maxProfit = Math.max(...curveExp);
      const maxLoss = Math.min(...curveExp);

      return {
        spots,
        curveT0,
        curveExp,
        netInitialDebit: +totalInitialDebit.toFixed(2),
        isCredit: totalInitialDebit < 0,
        maxProfit: +maxProfit.toFixed(2),
        maxLoss: +maxLoss.toFixed(2),
        breakEvens,
        netGreeks: {
          delta: +netDelta.toFixed(2),
          gamma: +netGamma.toFixed(4),
          vega: +netVega.toFixed(2),
          theta: +netTheta.toFixed(2)
        }
      };
    }

    /**
     * 2D Volatility Bump vs Spot Shock Heatmap
     */
    generateStressHeatmap() {
      const spotShocksPct = [-0.06, -0.03, 0.0, +0.03, +0.06];
      const volShocksPct = [-0.20, -0.10, 0.0, +0.10, +0.20];

      let initialCost = 0;
      this.legs.forEach(leg => {
        const sign = leg.side === 'BUY' ? 1 : -1;
        initialCost += sign * leg.premium * leg.contracts * leg.lotSize;
      });

      const matrix = [];

      volShocksPct.forEach(dVol => {
        const row = [];
        spotShocksPct.forEach(dSpot => {
          const shockedSpot = this.spot * (1 + dSpot);
          let val = -initialCost;
          this.legs.forEach(leg => {
            const sign = leg.side === 'BUY' ? 1 : -1;
            const shockedIv = Math.max(0.01, leg.impliedVol * (1 + dVol));
            const p = bsPrice(shockedSpot, leg.strike, leg.T, this.rate, shockedIv, leg.type);
            val += sign * p * leg.contracts * leg.lotSize;
          });
          row.push(+val.toFixed(2));
        });
        matrix.push({ volShockPct: +(dVol * 100).toFixed(0), pnlRow: row });
      });

      return {
        spotShocksPct: spotShocksPct.map(s => +(s * 100).toFixed(0)),
        volShocksPct: volShocksPct.map(v => +(v * 100).toFixed(0)),
        matrix
      };
    }
  }

  return OptionsStrategyBuilderEngine;
});
