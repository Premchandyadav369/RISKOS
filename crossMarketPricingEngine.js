/**
 * RISKOS Universal Cross-Market Predictive Pricing Engine (crossMarketPricingEngine.js)
 * ==============================================================================
 * Architect: Premchand Yadav
 * Purpose: End-to-End P.R.E.M.-Alpha Pricing Predictions Across All Indian & US Stocks.
 * 
 * Mathematical Formulation:
 * ------------------------------------------------------------------------------
 * 1. [P] Hamilton Markov Regime Filter:
 *    P(S_t = k | F_t) -> mu_regime = sum_{k=1}^3 P(S_t = k) * mu_k
 * 
 * 2. [R] Supercritical Hawkes Jump Damping:
 *    eta = alpha / beta. Phi_Hawkes(eta) = exp(-2.2 * max(0, eta - 0.50))
 *    When eta >= 0.85 -> isHawkesShutdown = true (defensive quote withdrawal)
 * 
 * 3. [E] Shannon LOB Queue Entropy Coiling:
 *    H_LOB = - (1 / ln 5) * sum p_i ln p_i
 *    E_deficit = 1.0 + 1.5 * (1.0 - H_LOB). Low entropy -> breakout amplification
 * 
 * 4. [M] 5-Level Deep OFI Cross-Impact:
 *    I_deep = sum_{k=1}^5 w_k * OFI_k. w = [0.40, 0.25, 0.18, 0.11, 0.06]
 * 
 * Predictive Target Pricing:
 * ------------------------------------------------------------------------------
 *   Reservation Price:  r* = S * (1 + 0.85 * alpha_PREM) - q * gamma * sigma^2 * tau
 *   T+1d Target:        P_1d = S * exp( (mu_regime + alpha_PREM) * (1 / 252) )
 *   T+5d Target:        P_5d = S * exp( (mu_regime + alpha_PREM) * (5 / 252) )
 *   T+20d Target:       P_20d = S * exp( (mu_regime + alpha_PREM) * (20 / 252) )
 *   99% 1-Day VaR:      VaR_99 = S * 2.326 * (sigma / sqrt(252))
 *   99% 1-Day CVaR:     CVaR_99 = S * 2.665 * (sigma / sqrt(252))
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./securityMaster', './premAlphaEngine', './eventSurveillanceEngine'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const { SecurityMaster } = require('./securityMaster.js');
    const PremAlphaEngine = require('./premAlphaEngine.js');
    let EventSurveillanceEngine = null;
    try {
      EventSurveillanceEngine = require('./eventSurveillanceEngine.js');
    } catch (e) {}
    module.exports = factory(SecurityMaster, PremAlphaEngine, EventSurveillanceEngine);
  } else {
    root.CrossMarketPricingEngine = factory(root.SecurityMaster, root.PremAlphaEngine, root.EventSurveillanceEngine);
  }
}(typeof self !== 'undefined' ? self : this, function (SecurityMaster, PremAlphaEngine, EventSurveillanceEngine) {
  'use strict';

  class CrossMarketPricingEngine {
    constructor() {
      this.version = '3.0.0-PROPRIETARY';
      this.architect = 'Premchand Yadav';
    }

    /**
     * Run P.R.E.M.-Alpha predictive pricing model on a single instrument
     * @param {Object|string} sec - Security object or symbol
     * @param {Object} [overrides] - Optional parameters
     */
    predictSecurity(sec, overrides = {}) {
      if (typeof sec === 'string') {
        sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sec.toUpperCase()) || { symbol: sec, basePrice: 100 };
      }

      const symbol = sec.symbol || 'SYM';
      const name = sec.name || symbol;
      const country = sec.country || (symbol.includes('.NS') || symbol.includes('.BO') ? 'IN' : 'US');
      const currency = sec.currency || (country === 'IN' ? 'INR' : 'USD');
      const currSym = currency === 'INR' ? '₹' : '$';
      const sector = sec.sector || 'Equities';
      const rawPrice = overrides.midPrice !== undefined ? overrides.midPrice : (sec.price || sec.basePrice || 100.0);
      const spotMid = Number(Number(rawPrice).toFixed(2));
      const isRealTime = overrides.isRealTime !== undefined ? overrides.isRealTime : false;
      const provider = overrides.provider || (sec.provider || 'Model Baseline Snapshot');
      const beta = Number(sec.beta !== undefined ? sec.beta : 1.0);
      const vol = Number(sec.vol !== undefined ? sec.vol : 0.22);
      const pe = sec.pe !== null && sec.pe !== undefined ? Number(sec.pe) : null;
      const roe = sec.roe !== null && sec.roe !== undefined ? Number(sec.roe) : null;
      const marketCap = Number(sec.marketCap || 1e10);

      // Deterministic PRNG seed anchored to symbol for repeatable institutional audit
      let seed = 0;
      for (let i = 0; i < symbol.length; i++) {
        seed = (seed * 31 + symbol.charCodeAt(i)) % 4294967296;
      }
      const prng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

      // Microstructure Queue Simulation based on Market Cap and Systematic Beta
      const depthScale = Math.max(0.5, Math.log10(marketCap) - 8);
      const bidVolumes = [
        Math.round(5000 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(3500 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(2200 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(1200 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(600 * depthScale * (0.8 + 0.4 * prng()))
      ];
      const askVolumes = [
        Math.round(4800 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(3400 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(2300 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(1300 * depthScale * (0.8 + 0.4 * prng())),
        Math.round(650 * depthScale * (0.8 + 0.4 * prng()))
      ];

      // Regime Probabilities & Order Flow Imbalance
      const pBull = Math.min(0.85, Math.max(0.10, 0.52 + 0.12 * (beta - 1.0) + (prng() - 0.5) * 0.15));
      const pBear = Math.min(0.80, Math.max(0.10, 0.28 - 0.08 * (beta - 1.0) + (prng() - 0.5) * 0.12));
      const pChop = Math.max(0.05, 1.0 - pBull - pBear);

      const ofi = overrides.ofi !== undefined
        ? Number(overrides.ofi)
        : Math.max(-1.0, Math.min(1.0, (pBull - pBear) * 0.8 + (prng() - 0.5) * 0.4));

      // Hawkes Jump Cascades (Higher probability in high-volatility microcaps)
      const baseEta = vol > 0.40 ? 0.60 : (beta > 1.4 ? 0.45 : 0.25);
      const hawkesEta = overrides.hawkesEta !== undefined
        ? Number(overrides.hawkesEta)
        : Math.min(0.96, Math.max(0.10, baseEta + (prng() - 0.5) * 0.20));

      // Compute P.R.E.M.-Alpha Core
      const prem = PremAlphaEngine.computePremAlpha({
        midPrice: spotMid,
        regimeProbs: [pBull, pBear, pChop],
        ofi: ofi,
        bidVolumes,
        askVolumes,
        hawkesEta: hawkesEta,
        volatility: vol,
        riskAversion: 0.10,
        intensityKappa: 1.50
      });

      const alphaBps = prem.alpha.basisPoints;
      const isHawkesShutdown = prem.microstructure.isCascadeHazard || hawkesEta >= 0.85;

      // ── Predictive Price Trajectories ──────────────────────────────────────
      // alphaBps is the expected daily microstructure alpha drift
      const dailyDriftRate = alphaBps / 10000.0;

      // Reservation Price
      const reservationPrice = Number(prem.quoting.reservationPrice.toFixed(2));

      // Target Prices (T+1d, T+5d, T+20d)
      const target1d = Number((spotMid * (1.0 + dailyDriftRate * 1.0)).toFixed(2));
      const target5d = Number((spotMid * (1.0 + dailyDriftRate * 5.0)).toFixed(2));
      const target20d = Number((spotMid * (1.0 + dailyDriftRate * 20.0)).toFixed(2));

      // Expected Percentage Moves
      const expectedMove1dPct = Number((((target1d - spotMid) / spotMid) * 100).toFixed(2));
      const expectedMove5dPct = Number((((target5d - spotMid) / spotMid) * 100).toFixed(2));
      const expectedMove20dPct = Number((((target20d - spotMid) / spotMid) * 100).toFixed(2));

      // Quoting Matrix
      const optimalBid = Number(prem.quoting.optimalBid.toFixed(2));
      const optimalAsk = Number(prem.quoting.optimalAsk.toFixed(2));
      const spreadBps = Number(prem.quoting.spreadBps.toFixed(2));

      // Risk Bounds (99% 1-Day VaR and CVaR)
      const dailyVol = vol / Math.sqrt(252);
      const var99_1d = Number((spotMid * (2.326 * dailyVol)).toFixed(2));
      const cvar99_1d = Number((spotMid * (2.665 * dailyVol)).toFixed(2));
      const var99_1dPct = Number(((var99_1d / spotMid) * 100).toFixed(2));

      // Confidence Score (higher when entropy is coiled and regime is decisive)
      const entropyConfidence = (1.0 - Math.abs(prem.microstructure.avgNormalizedEntropy - 0.50) * 0.5);
      const regimeCertainty = Math.max(pBull, pBear, pChop);
      const confidencePct = Math.min(99.0, Math.max(50.0, Number(((0.5 * entropyConfidence + 0.5 * regimeCertainty) * 100).toFixed(1))));

      // Institutional Action Signal
      let action = 'NEUTRAL_SPREAD_CAPTURE';
      let actionColor = '#94a3b8';
      let recommendation = 'Provide two-sided liquidity at optimal bid/ask band.';

      if (isHawkesShutdown) {
        action = 'HAWKES_DEFENSIVE_WITHDRAWAL';
        actionColor = '#dc2626';
        recommendation = 'Supercritical jump clustering detected. Cancel active bids; avoid toxic sweeps.';
      } else if (alphaBps >= 15.0 && pBull >= 0.55) {
        action = 'STRONG_BUY';
        actionColor = '#10b981';
        recommendation = 'Strong positive regime expansion with bullish OFI. Accumulate at touch.';
      } else if (alphaBps >= 6.0) {
        action = 'ACCUMULATE';
        actionColor = '#34d399';
        recommendation = 'Positive micro-alpha drift. Skew quotes long toward reservation price.';
      } else if (alphaBps <= -15.0 && pBear >= 0.55) {
        action = 'STRONG_SELL';
        actionColor = '#ef4444';
        recommendation = 'Bearish macro drift and negative queue imbalance. Short or hedge exposure.';
      } else if (alphaBps <= -6.0) {
        action = 'TRIM_EXPOSURE';
        actionColor = '#f87171';
        recommendation = 'Negative alpha drift. Skew inventory short and tighten stop-loss bounds.';
      }

      // ── 5. Event Shock & Discontinuous Jump Analysis ──────────────────────
      let eventRisk = null;
      if (EventSurveillanceEngine) {
        const watchlistEntry = EventSurveillanceEngine.watchlist ? EventSurveillanceEngine.watchlist[symbol] : null;
        const eventData = overrides.eventData || (watchlistEntry ? {
          type: watchlistEntry.catalystType,
          confidence: watchlistEntry.confidence,
          regulatoryClearance: watchlistEntry.regulatoryClearance,
          revenueSurprisePct: watchlistEntry.revenueSurprisePct,
          guidanceRaisePct: watchlistEntry.guidanceRaisePct
        } : (overrides.includeEventRisk ? {
          type: 'MACRO_MOMENTUM',
          confidence: 0.75,
          regulatoryClearance: true,
          revenueSurprisePct: Math.max(0, (beta - 1.0) * 5.0)
        } : null));

        const optionsData = overrides.optionsData || (watchlistEntry ? {
          netGexMillions: watchlistEntry.netGexMillions,
          normalizedGex: watchlistEntry.normalizedGex,
          atmIv: watchlistEntry.atmIv,
          riskReversal25d: watchlistEntry.riskReversal25d
        } : (overrides.includeEventRisk ? {
          netGexMillions: vol > 0.35 ? -800 * (beta - 0.8) : 500,
          normalizedGex: 1500,
          atmIv: vol,
          riskReversal25d: (beta - 1.0) * 3.0
        } : null));

        if (eventData || optionsData) {
          eventRisk = EventSurveillanceEngine.predictEventPrice({
            symbol,
            spotPrice: spotMid,
            beta,
            eventData: eventData || {},
            optionsData: optionsData || {}
          });
        }
      }

      return {
        symbol,
        name,
        country,
        currency,
        currencySymbol: currSym,
        sector,
        spotMid,
        isRealTime,
        provider,
        beta,
        annualVolatility: vol,
        pe,
        roe,
        marketCap,
        microstructure: {
          queueEntropy: Number(prem.microstructure.avgNormalizedEntropy.toFixed(3)),
          isCoiled: prem.microstructure.isCoiled,
          entropyMultiplier: Number(prem.microstructure.entropyMultiplier.toFixed(3)),
          ofi: Number(ofi.toFixed(3)),
          hawkesEta: Number(hawkesEta.toFixed(3)),
          hawkesState: prem.microstructure.hawkesState,
          isHawkesShutdown
        },
        regimes: {
          pBull: Number(pBull.toFixed(3)),
          pBear: Number(pBear.toFixed(3)),
          pChop: Number(pChop.toFixed(3)),
          dominantRegime: prem.regimes.dominantRegime
        },
        predictions: {
          alphaBps,
          reservationPrice,
          target1d,
          target5d,
          target20d,
          expectedMove1dPct,
          expectedMove5dPct,
          expectedMove20dPct,
          targetEvent: eventRisk ? eventRisk.targetPrice : null,
          expectedMoveEventPct: eventRisk ? eventRisk.expectedMovePct : null,
          jumpProbability: eventRisk ? eventRisk.jumpProbability : null,
          optimalBid,
          optimalAsk,
          spreadBps
        },
        eventRisk,
        risk: {
          var99_1d,
          cvar99_1d,
          var99_1dPct
        },
        signals: {
          action,
          actionColor,
          confidencePct,
          recommendation
        }
      };
    }

    /**
     * Run Predictive Pricing on the complete Indian & US universe
     * @param {Object} [filter] - Filter criteria (country, sector, minCap, signal)
     */
    predictUniverse(filter = {}) {
      let securities = SecurityMaster.LOCAL_REGISTRY.filter(s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY');

      if (filter.country && filter.country !== 'ALL') {
        securities = securities.filter(s => s.country === filter.country);
      }
      if (filter.sector && filter.sector !== 'ALL') {
        securities = securities.filter(s => s.sector.toLowerCase().includes(filter.sector.toLowerCase()));
      }
      if (filter.minMarketCap) {
        securities = securities.filter(s => (s.marketCap || 0) >= filter.minMarketCap);
      }

      const predictions = securities.map(sec => this.predictSecurity(sec));

      // Aggregate sector metrics
      const sectorGroups = {};
      predictions.forEach(p => {
        if (!sectorGroups[p.sector]) sectorGroups[p.sector] = [];
        sectorGroups[p.sector].push(p);
      });

      const sectorBreakdown = Object.entries(sectorGroups).map(([secName, list]) => {
        const avgAlpha = list.reduce((a, b) => a + b.predictions.alphaBps, 0) / list.length;
        const avgMove20d = list.reduce((a, b) => a + b.predictions.expectedMove20dPct, 0) / list.length;
        const avgVol = list.reduce((a, b) => a + b.annualVolatility, 0) / list.length;
        const bullCount = list.filter(s => s.signals.action === 'STRONG_BUY' || s.signals.action === 'ACCUMULATE').length;
        const bearCount = list.filter(s => s.signals.action === 'STRONG_SELL' || s.signals.action === 'TRIM_EXPOSURE').length;

        return {
          sector: secName,
          count: list.length,
          avgAlphaBps: Number(avgAlpha.toFixed(2)),
          avgExpectedMove20dPct: Number(avgMove20d.toFixed(2)),
          avgAnnualVol: Number(avgVol.toFixed(3)),
          sentiment: bullCount >= bearCount ? (bullCount > bearCount ? 'BULLISH' : 'NEUTRAL') : 'BEARISH'
        };
      }).sort((a, b) => b.avgAlphaBps - a.avgAlphaBps);

      // Top Opportunities
      const inStocks = predictions.filter(p => p.country === 'IN' && !p.microstructure.isHawkesShutdown);
      const usStocks = predictions.filter(p => p.country === 'US' && !p.microstructure.isHawkesShutdown);

      const topIndiaLongs = inStocks.sort((a, b) => b.predictions.alphaBps - a.predictions.alphaBps).slice(0, 10);
      const topUSLongs = usStocks.sort((a, b) => b.predictions.alphaBps - a.predictions.alphaBps).slice(0, 10);
      const topHawkesAlerts = predictions.filter(p => p.microstructure.isHawkesShutdown);
      const topEventJumps = predictions
        .filter(p => p.eventRisk && p.eventRisk.expectedMovePct !== null)
        .sort((a, b) => b.eventRisk.expectedMovePct - a.eventRisk.expectedMovePct)
        .slice(0, 10);

      return {
        timestamp: new Date().toISOString(),
        engine: 'P.R.E.M.-Alpha Cross-Market Predictive Pricing Engine',
        version: this.version,
        architect: this.architect,
        summary: {
          totalStocksEvaluated: predictions.length,
          indiaStocksCount: predictions.filter(p => p.country === 'IN').length,
          usStocksCount: predictions.filter(p => p.country === 'US').length,
          globalStocksCount: predictions.filter(p => p.country === 'GLOBAL').length,
          strongBuyCount: predictions.filter(p => p.signals.action === 'STRONG_BUY').length,
          accumulateCount: predictions.filter(p => p.signals.action === 'ACCUMULATE').length,
          neutralCount: predictions.filter(p => p.signals.action === 'NEUTRAL_SPREAD_CAPTURE').length,
          trimCount: predictions.filter(p => p.signals.action === 'TRIM_EXPOSURE').length,
          strongSellCount: predictions.filter(p => p.signals.action === 'STRONG_SELL').length,
          hawkesShutdownCount: topHawkesAlerts.length,
          highEventRiskCount: predictions.filter(p => p.eventRisk && Math.abs(p.eventRisk.expectedMovePct) > 10.0).length
        },
        sectorBreakdown,
        topIndiaLongs,
        topUSLongs,
        topHawkesAlerts,
        topEventJumps,
        predictions
      };
    }

    /**
     * Batch-fetch real-world market quotes from live exchange feeds (Yahoo Finance API)
     * @param {Array<Object>} securities - Array of security objects from SecurityMaster
     * @returns {Promise<Map<string, Object>>} Map of symbol to live quote details
     */
    async fetchLiveQuotesForUniverse(securities) {
      const quoteMap = new Map();
      const BATCH_SIZE = 12;

      for (let i = 0; i < securities.length; i += BATCH_SIZE) {
        const batch = securities.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (sec) => {
          let ticker = sec.symbolNS || (sec.country === 'IN' ? `${sec.symbol}.NS` : sec.symbol);
          if (sec.symbol === 'TATAMOTORS') ticker = 'TMPV.NS';

          try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
            if (res.ok) {
              const data = await res.json();
              const meta = data?.chart?.result?.[0]?.meta;
              const price = meta?.regularMarketPrice;
              if (price !== undefined && price !== null && !isNaN(price)) {
                quoteMap.set(sec.symbol, {
                  price: Number(price),
                  currency: meta.currency || sec.currency,
                  exchange: meta.exchangeName || sec.exchange,
                  isRealTime: true,
                  provider: 'Yahoo Finance Live'
                });
                return;
              }
            }
          } catch (e) {
            // Fall through to fallback
          }

          // Fallback to model baseline snapshot
          quoteMap.set(sec.symbol, {
            price: sec.basePrice,
            currency: sec.currency,
            exchange: sec.exchange,
            isRealTime: false,
            provider: 'Model Baseline Snapshot'
          });
        }));
      }

      return quoteMap;
    }

    /**
     * Asynchronously run Predictive Pricing using LIVE real-world exchange quotes
     * @param {Object} [filter] - Filter criteria
     * @returns {Promise<Object>} Complete predictions computed on live market quotes
     */
    async predictUniverseLive(filter = {}) {
      let securities = SecurityMaster.LOCAL_REGISTRY.filter(s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY');

      if (filter.country && filter.country !== 'ALL') {
        securities = securities.filter(s => s.country === filter.country);
      }
      if (filter.sector && filter.sector !== 'ALL') {
        securities = securities.filter(s => s.sector.toLowerCase().includes(filter.sector.toLowerCase()));
      }
      if (filter.minMarketCap) {
        securities = securities.filter(s => (s.marketCap || 0) >= filter.minMarketCap);
      }

      const liveQuotes = await this.fetchLiveQuotesForUniverse(securities);

      const predictions = securities.map(sec => {
        const live = liveQuotes.get(sec.symbol) || { price: sec.basePrice, isRealTime: false, provider: 'Model Baseline Snapshot' };
        return this.predictSecurity(sec, {
          midPrice: live.price,
          isRealTime: live.isRealTime,
          provider: live.provider
        });
      });

      // Aggregate sector metrics
      const sectorGroups = {};
      predictions.forEach(p => {
        if (!sectorGroups[p.sector]) sectorGroups[p.sector] = [];
        sectorGroups[p.sector].push(p);
      });

      const sectorBreakdown = Object.entries(sectorGroups).map(([secName, list]) => {
        const avgAlpha = list.reduce((a, b) => a + b.predictions.alphaBps, 0) / list.length;
        const avgMove20d = list.reduce((a, b) => a + b.predictions.expectedMove20dPct, 0) / list.length;
        const avgVol = list.reduce((a, b) => a + b.annualVolatility, 0) / list.length;
        const bullCount = list.filter(s => s.signals.action === 'STRONG_BUY' || s.signals.action === 'ACCUMULATE').length;
        const bearCount = list.filter(s => s.signals.action === 'STRONG_SELL' || s.signals.action === 'TRIM_EXPOSURE').length;

        return {
          sector: secName,
          count: list.length,
          avgAlphaBps: Number(avgAlpha.toFixed(2)),
          avgExpectedMove20dPct: Number(avgMove20d.toFixed(2)),
          avgAnnualVol: Number(avgVol.toFixed(3)),
          sentiment: bullCount >= bearCount ? (bullCount > bearCount ? 'BULLISH' : 'NEUTRAL') : 'BEARISH'
        };
      }).sort((a, b) => b.avgAlphaBps - a.avgAlphaBps);

      const inStocks = predictions.filter(p => p.country === 'IN' && !p.microstructure.isHawkesShutdown);
      const usStocks = predictions.filter(p => p.country === 'US' && !p.microstructure.isHawkesShutdown);

      const topIndiaLongs = inStocks.sort((a, b) => b.predictions.alphaBps - a.predictions.alphaBps).slice(0, 10);
      const topUSLongs = usStocks.sort((a, b) => b.predictions.alphaBps - a.predictions.alphaBps).slice(0, 10);
      const topHawkesAlerts = predictions.filter(p => p.microstructure.isHawkesShutdown);
      const topEventJumps = predictions
        .filter(p => p.eventRisk && p.eventRisk.expectedMovePct !== null)
        .sort((a, b) => b.eventRisk.expectedMovePct - a.eventRisk.expectedMovePct)
        .slice(0, 10);
      const liveCount = predictions.filter(p => p.isRealTime).length;

      return {
        timestamp: new Date().toISOString(),
        engine: 'P.R.E.M.-Alpha Cross-Market Predictive Pricing Engine (LIVE FEED MODE)',
        version: this.version,
        architect: this.architect,
        feedMode: 'LIVE_EXCHANGE_DATA',
        liveQuotesCount: liveCount,
        baselineQuotesCount: predictions.length - liveCount,
        summary: {
          totalStocksEvaluated: predictions.length,
          indiaStocksCount: predictions.filter(p => p.country === 'IN').length,
          usStocksCount: predictions.filter(p => p.country === 'US').length,
          globalStocksCount: predictions.filter(p => p.country === 'GLOBAL').length,
          strongBuyCount: predictions.filter(p => p.signals.action === 'STRONG_BUY').length,
          accumulateCount: predictions.filter(p => p.signals.action === 'ACCUMULATE').length,
          neutralCount: predictions.filter(p => p.signals.action === 'NEUTRAL_SPREAD_CAPTURE').length,
          trimCount: predictions.filter(p => p.signals.action === 'TRIM_EXPOSURE').length,
          strongSellCount: predictions.filter(p => p.signals.action === 'STRONG_SELL').length,
          hawkesShutdownCount: topHawkesAlerts.length,
          highEventRiskCount: predictions.filter(p => p.eventRisk && Math.abs(p.eventRisk.expectedMovePct) > 10.0).length
        },
        sectorBreakdown,
        topIndiaLongs,
        topUSLongs,
        topHawkesAlerts,
        topEventJumps,
        predictions
      };
    }

    /**
     * Export complete predictions tear-sheet to CSV format
     * @param {Object} results - Universe prediction result
     * @returns {string} CSV text
     */
    generateCsvTearSheet(results) {
      const headers = [
        'Symbol', 'Name', 'Country', 'Currency', 'Sector', 'SpotMid', 'IsRealTime', 'Provider',
        'Beta', 'AnnVol(%)', 'AlphaDrift(bps)', 'ReservationPrice', 'Target1d', 'Target5d',
        'Target20d', 'ExpectedMove20d(%)', 'OptimalBid', 'OptimalAsk', 'Spread(bps)', 'VaR99_1d',
        'CVaR99_1d', 'Confidence(%)', 'Action', 'HawkesState', 'OrderBookCoiled',
        'EventScore', 'EventTarget', 'EventMove(%)', 'DealerGexState'
      ];

      const rows = results.predictions.map(p => [
        `"${p.symbol}"`,
        `"${p.name}"`,
        p.country,
        p.currency,
        `"${p.sector}"`,
        p.spotMid.toFixed(2),
        p.isRealTime ? 'YES' : 'NO',
        `"${p.provider || 'Model Baseline Snapshot'}"`,
        p.beta.toFixed(2),
        (p.annualVolatility * 100).toFixed(1),
        p.predictions.alphaBps.toFixed(2),
        p.predictions.reservationPrice.toFixed(2),
        p.predictions.target1d.toFixed(2),
        p.predictions.target5d.toFixed(2),
        p.predictions.target20d.toFixed(2),
        p.predictions.expectedMove20dPct.toFixed(2),
        p.predictions.optimalBid.toFixed(2),
        p.predictions.optimalAsk.toFixed(2),
        p.predictions.spreadBps.toFixed(1),
        p.risk.var99_1d.toFixed(2),
        p.risk.cvar99_1d.toFixed(2),
        p.signals.confidencePct.toFixed(1),
        p.signals.action,
        p.microstructure.hawkesState,
        p.microstructure.isCoiled ? 'YES' : 'NO',
        p.eventRisk ? p.eventRisk.catalystScore.toFixed(2) : '0.00',
        p.eventRisk ? p.eventRisk.targetPrice.toFixed(2) : p.spotMid.toFixed(2),
        p.eventRisk ? p.eventRisk.expectedMovePct.toFixed(2) : '0.00',
        p.eventRisk ? `"${p.eventRisk.dealerState}"` : '"BALANCED"'
      ].join(','));

      return [headers.join(','), ...rows].join('\n');
    }
  }

  return new CrossMarketPricingEngine();
}));
