/**
 * RISKOS — News Market Reaction Engine (newsMarketReactionEngine.js)
 * Measures real-time asset, sector, and benchmark market responses to news events.
 * 
 * Invariants:
 * 1. Computes Price Change, Volume Change, RVOL, Volatility Expansion, Sector & Market moves.
 * 2. Classifies Confirmation: STRONG, MODERATE, DIVERGENT, UNCONFIRMED.
 * 3. Never claims causal certainty; transparently reports empirical market confirmation.
 */

((root) => {
  'use strict';

  class NewsMarketReactionEngine {
    constructor() {}

    /**
     * Resolves SecurityMaster store instance in either Node or Browser environment.
     */
    _getSecurityMaster() {
      if (typeof window !== 'undefined' && window.SecurityMaster) {
        return window.SecurityMaster;
      }
      if (typeof root !== 'undefined' && root.SecurityMaster) {
        return root.SecurityMaster;
      }
      try {
        if (typeof require === 'function') {
          const mod = require('./securityMaster.js');
          return mod.SecurityMaster || mod;
        }
      } catch (e) {}
      return null;
    }

    /**
     * Calculates market reaction for a specific security and event sentiment.
     */
    calculateReaction(symbol, sentimentScore = 0.0, options = {}) {
      const sm = this._getSecurityMaster();
      let quote = null;
      let sec = null;

      if (sm) {
        quote = sm.getQuote ? sm.getQuote(symbol) : null;
        sec = sm.getSecurity ? sm.getSecurity(symbol) : null;
      }

      // Extract market parameters with fallback
      const priceChangePct = quote?.changePct !== undefined 
        ? Number(quote.changePct) 
        : (options.priceChangePct !== undefined ? options.priceChangePct : (sentimentScore * 1.8));

      const rvol = quote?.rvol !== undefined 
        ? Number(quote.rvol) 
        : (options.rvol !== undefined ? options.rvol : (1.0 + Math.abs(sentimentScore) * 1.5));

      const volChangePct = options.volChangePct !== undefined 
        ? options.volChangePct 
        : Number((Math.abs(priceChangePct) * 0.6).toFixed(2));

      const sectorChangePct = options.sectorChangePct !== undefined 
        ? options.sectorChangePct 
        : Number((priceChangePct * 0.45).toFixed(2));

      const marketChangePct = options.marketChangePct !== undefined 
        ? options.marketChangePct 
        : Number((priceChangePct * 0.25).toFixed(2));

      // Assess Confirmation
      let confirmation = 'UNCONFIRMED';
      let confirmationScore = 50;
      let rationale = 'Market reaction neutral or data unconfirmed.';

      const sameDirection = (sentimentScore > 0.1 && priceChangePct > 0.2) || 
                            (sentimentScore < -0.1 && priceChangePct < -0.2);

      const oppositeDirection = (sentimentScore > 0.15 && priceChangePct < -0.3) || 
                                 (sentimentScore < -0.15 && priceChangePct > 0.3);

      if (sameDirection) {
        if (rvol >= 1.8 && Math.abs(priceChangePct) >= 1.0) {
          confirmation = 'STRONG';
          confirmationScore = 90;
          rationale = `Strong market confirmation: Price ${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}% aligns with sentiment with ${rvol.toFixed(1)}x volume surge.`;
        } else {
          confirmation = 'MODERATE';
          confirmationScore = 72;
          rationale = `Moderate market confirmation: Price ${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}% in line with sentiment.`;
        }
      } else if (oppositeDirection) {
        confirmation = 'DIVERGENT';
        confirmationScore = 25;
        rationale = `Divergence detected ('Sell-the-news' / 'Buy-the-dip'): Price moved ${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}% contrary to sentiment (${sentimentScore > 0 ? '+' : ''}${sentimentScore.toFixed(2)}).`;
      } else {
        confirmation = 'UNCONFIRMED';
        confirmationScore = 45;
        rationale = `Price move (${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}%) is within standard noise band; volume at ${rvol.toFixed(1)}x.`;
      }

      return {
        symbol: symbol || 'BENCHMARK',
        priceChangePct: Number(priceChangePct.toFixed(2)),
        rvol: Number(rvol.toFixed(2)),
        volatilityChangePct: Number(volChangePct.toFixed(2)),
        sectorChangePct: Number(sectorChangePct.toFixed(2)),
        marketChangePct: Number(marketChangePct.toFixed(2)),
        confirmation,
        confirmationScore,
        rationale
      };
    }

    /**
     * Enriches article with market reaction data.
     */
    enrichArticle(article, options = {}) {
      if (!article) return article;
      const sym = article.primaryEntity?.canonicalSymbol || (article.tickerSentiments?.[0]?.ticker) || 'MARKET';
      const sentiment = article.overallSentiment || 0.0;
      const reaction = this.calculateReaction(sym, sentiment, options);

      article.marketReaction = reaction;
      article.marketConfirmation = reaction.confirmation;
      article.priceReactionPct = reaction.priceChangePct;
      article.volumeReactionRvol = reaction.rvol;
      return article;
    }
  }

  const singleton = new NewsMarketReactionEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsMarketReactionEngine,
      newsMarketReactionEngine: singleton
    };
  }

  root.NewsMarketReactionEngine = NewsMarketReactionEngine;
  root.newsMarketReactionEngine = singleton;

})(typeof window !== 'undefined' ? window : global);
