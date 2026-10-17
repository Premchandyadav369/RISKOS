/**
 * RISKOS Proprietary Algorithm 1: HS-JAMM
 * Hawkes-Stoikov Jump-Aware Market Maker (Isomorphic JavaScript)
 */

(function (root) {
  'use strict';

  class HsJammEngine {
    constructor(params = {}) {
      this.gamma = params.gamma ?? 0.10;
      this.sigma = params.sigma ?? 0.25;
      this.tMinusT = params.tMinusT ?? 0.004;
      this.kappa = params.kappa ?? 1.5;
      this.zeta = params.zeta ?? 2.5;
      this.etaCrit = params.etaCrit ?? 0.70;
    }

    computeQuotes(midPrice, inventory, etaBid, etaAsk) {
      const variance = this.sigma * this.sigma;
      const baseR = midPrice - inventory * this.gamma * variance * this.tMinusT;

      const baseHalfSpread = (1.0 / this.gamma) * Math.log(1.0 + this.gamma / this.kappa);

      const excessBid = Math.max(0.0, etaBid - this.etaCrit);
      const excessAsk = Math.max(0.0, etaAsk - this.etaCrit);
      const isToxicCascade = excessBid > 0 || excessAsk > 0;

      const toxicitySkew = (etaBid - etaAsk) * this.zeta;
      const reservationPrice = baseR + toxicitySkew * 0.5;

      const halfSpreadBid = baseHalfSpread * (1.0 + excessAsk * this.zeta * 2.0);
      const halfSpreadAsk = baseHalfSpread * (1.0 + excessBid * this.zeta * 2.0);

      const optimalBid = reservationPrice - halfSpreadBid;
      const optimalAsk = reservationPrice + halfSpreadAsk;

      return {
        reservationPrice: Number(reservationPrice.toFixed(4)),
        optimalBid: Number(optimalBid.toFixed(4)),
        optimalAsk: Number(optimalAsk.toFixed(4)),
        halfSpreadBid: Number(halfSpreadBid.toFixed(4)),
        halfSpreadAsk: Number(halfSpreadAsk.toFixed(4)),
        toxicitySkew: Number(toxicitySkew.toFixed(4)),
        isToxicCascade
      };
    }
  }

  const engine = new HsJammEngine();
  root.HsJammEngine = HsJammEngine;
  root.defaultHsJamm = engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HsJammEngine;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
