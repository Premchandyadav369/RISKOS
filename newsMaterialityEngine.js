/**
 * RISKOS — News Materiality Engine (newsMaterialityEngine.js)
 * Evaluates economic and portfolio materiality of financial events on a 0–100 scale.
 * 
 * Invariants:
 * 1. Strictly deterministic and fully explainable scoring.
 * 2. Ratings: LOW (0-39), MODERATE (40-69), HIGH (70-89), CRITICAL (90-100).
 * 3. Factors in event taxonomy gravity, ticker relevance, market cap tier, and portfolio exposure.
 */

((root) => {
  'use strict';

  class NewsMaterialityEngine {
    constructor() {}

    /**
     * Computes deterministic materiality score (0-100) and rating.
     */
    calculateMateriality(article, options = {}) {
      if (!article) {
        return {
          score: 50,
          rating: 'MODERATE',
          rationale: 'Default baseline materiality.',
          factors: {}
        };
      }

      // 1. Base materiality from event classification (0-100)
      const baseMateriality = article.baseMateriality || 60;

      // 2. Ticker relevance factor (0-1.0)
      let maxRelevance = 0.8;
      if (Array.isArray(article.tickerSentiments) && article.tickerSentiments.length > 0) {
        maxRelevance = Math.max(...article.tickerSentiments.map(ts => ts.relevanceScore || 0));
      } else if (article.primaryEntity && article.primaryEntity.canonicalSymbol) {
        maxRelevance = 1.0;
      }

      // 3. Company Size / Market Cap tier adjustment
      let capWeight = 1.0;
      const primarySec = article.primaryEntity?.security;
      if (primarySec?.marketCap) {
        if (primarySec.marketCap > 5000000000000) { // Mega cap (> ₹5 Lakh Cr / $100B)
          capWeight = 1.15;
        } else if (primarySec.marketCap > 1000000000000) { // Large cap
          capWeight = 1.05;
        } else {
          capWeight = 0.95;
        }
      }

      // 4. Portfolio exposure multiplier
      const isPortfolioHolding = Boolean(article.primaryEntity?.inPortfolio || options.isPortfolioHolding);
      const portfolioBoost = isPortfolioHolding ? 15 : 0;

      // 5. Surprise indicator bonus
      const eventType = article.eventType || 'OTHER';
      const isSurprise = eventType === 'EARNINGS_SURPRISE' || 
                         eventType === 'BANKRUPTCY' || 
                         eventType === 'GEOPOLITICAL' ||
                         eventType === 'MONETARY_POLICY';
      const surpriseBonus = isSurprise ? 10 : 0;

      // 6. Source credibility multiplier
      const source = (article.source || '').toLowerCase();
      let sourceMultiplier = 1.0;
      if (source.includes('reuters') || source.includes('bloomberg') || source.includes('sec') || source.includes('rbi')) {
        sourceMultiplier = 1.10;
      } else if (source.includes('rumor') || source.includes('blog') || source.includes('forum')) {
        sourceMultiplier = 0.80;
      }

      // Composite calculation
      const rawScore = (baseMateriality * maxRelevance * capWeight * sourceMultiplier) + portfolioBoost + surpriseBonus;
      const finalScore = Math.max(5, Math.min(100, Math.round(rawScore)));

      // Categorical classification
      let rating = 'MODERATE';
      if (finalScore >= 90) {
        rating = 'CRITICAL';
      } else if (finalScore >= 70) {
        rating = 'HIGH';
      } else if (finalScore < 40) {
        rating = 'LOW';
      }

      const rationaleParts = [];
      rationaleParts.push(`Event '${article.eventLabel || eventType}' base gravity: ${baseMateriality}/100.`);
      rationaleParts.push(`Entity relevance: ${(maxRelevance * 100).toFixed(0)}%.`);
      if (isPortfolioHolding) rationaleParts.push('Active user portfolio constituent (+15 materiality).');
      if (isSurprise) rationaleParts.push('High-volatility surprise event profile (+10).');

      return {
        score: finalScore,
        rating: rating,
        factors: {
          baseMateriality,
          maxRelevance,
          capWeight,
          isPortfolioHolding,
          surpriseBonus,
          sourceMultiplier
        },
        rationale: rationaleParts.join(' ')
      };
    }

    /**
     * Enriches article with materiality fields.
     */
    enrichArticle(article, options = {}) {
      if (!article) return article;
      const mat = this.calculateMateriality(article, options);
      article.materialityScore = mat.score;
      article.materialityRating = mat.rating;
      article.materialityRationale = mat.rationale;
      return article;
    }
  }

  const singleton = new NewsMaterialityEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsMaterialityEngine,
      newsMaterialityEngine: singleton
    };
  }

  root.NewsMaterialityEngine = NewsMaterialityEngine;
  root.newsMaterialityEngine = singleton;

})(typeof window !== 'undefined' ? window : global);
