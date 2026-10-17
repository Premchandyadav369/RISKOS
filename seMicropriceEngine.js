/**
 * RISKOS Proprietary Algorithm 2: SE-MicroPrice
 * Shannon-Entropy L3 Queue Micro-Price Filter (Isomorphic JavaScript)
 */

(function (root) {
  'use strict';

  class SeMicroPriceEngine {
    constructor(omega = 0.50) {
      this.omega = omega;
    }

    compute(bestBid, bestAsk, bidQtys, askQtys) {
      const k = Math.min(bidQtys.length, askQtys.length);
      const midPrice = (bestBid + bestAsk) * 0.5;
      const spread = Math.max(0.0001, bestAsk - bestBid);

      if (k === 0) {
        return {
          midPrice,
          microPrice: midPrice,
          entropyBid: 0,
          entropyAsk: 0,
          entropyDisparity: 0,
          nextTickDrift: 0,
          predictedDirection: 0
        };
      }

      let sumB = 0, sumA = 0;
      for (let i = 0; i < k; i++) {
        sumB += bidQtys[i];
        sumA += askQtys[i];
      }

      const EPS = 1e-12;
      if (sumB < EPS || sumA < EPS) {
        return {
          midPrice,
          microPrice: midPrice,
          entropyBid: 0,
          entropyAsk: 0,
          entropyDisparity: 0,
          nextTickDrift: 0,
          predictedDirection: 0
        };
      }

      let hB = 0, hA = 0;
      for (let i = 0; i < k; i++) {
        const pb = bidQtys[i] / sumB;
        const pa = askQtys[i] / sumA;
        if (pb > EPS) hB -= pb * Math.log(pb);
        if (pa > EPS) hA -= pa * Math.log(pa);
      }

      const lnK = Math.max(1.0, Math.log(k));
      const entropyBid = Math.min(1.0, Math.max(0.0, hB / lnK));
      const entropyAsk = Math.min(1.0, Math.max(0.0, hA / lnK));
      const entropyDisparity = entropyBid - entropyAsk;

      const volumeImbalance = (sumB - sumA) / (sumB + sumA);
      const nextTickDrift = (volumeImbalance * (spread * 0.5)) - (this.omega * entropyDisparity * spread);
      const microPrice = midPrice + nextTickDrift;
      const predictedDirection = nextTickDrift >= 0 ? 1 : -1;

      return {
        midPrice: Number(midPrice.toFixed(4)),
        microPrice: Number(microPrice.toFixed(4)),
        entropyBid: Number(entropyBid.toFixed(4)),
        entropyAsk: Number(entropyAsk.toFixed(4)),
        entropyDisparity: Number(entropyDisparity.toFixed(4)),
        nextTickDrift: Number(nextTickDrift.toFixed(4)),
        predictedDirection
      };
    }
  }

  const engine = new SeMicroPriceEngine();
  root.SeMicroPriceEngine = SeMicroPriceEngine;
  root.defaultSeMicroPrice = engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeMicroPriceEngine;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
