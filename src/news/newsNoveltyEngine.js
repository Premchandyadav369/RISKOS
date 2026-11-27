/**
 * RISKOS — News Novelty & Information Freshness Engine (newsNoveltyEngine.js)
 * Evaluates whether an article presents genuinely novel information or echoes prior reporting.
 * 
 * Invariants:
 * 1. Outputs 0–100 Novelty Score with human-auditable reason string.
 * 2. Compares token overlap and entity history over rolling 30-day lookback window.
 * 3. Penalizes syndicated repetition and wire re-broadcasts.
 */

((root) => {
  'use strict';

  function tokenizeText(text) {
    if (!text) return new Set();
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
      'with', 'as', 'by', 'that', 'it', 'from', 'this', 'be', 'are', 'was', 'has', 'have'
    ]);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    return new Set(words.filter(w => w.length > 2 && !stopwords.has(w)));
  }

  function jaccardSimilarity(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  class NewsNoveltyEngine {
    constructor() {
      this.storyHistory = [];
    }

    /**
     * Seeds or updates internal 30-day story history.
     */
    updateHistory(articles) {
      if (Array.isArray(articles)) {
        this.storyHistory = [...articles];
      }
    }

    /**
     * Calculates novelty score (0-100) and rationale comparing article against history.
     */
    calculateNovelty(article, historicalArticles = null) {
      if (!article) {
        return {
          score: 50,
          reason: 'Insufficient comparative context.',
          isRepeat: false,
          maxSimilarity: 0.0
        };
      }

      const history = historicalArticles || this.storyHistory;
      const targetTokens = tokenizeText(`${article.title || ''} ${article.summary || ''}`);
      const targetTime = new Date(article.publishedAt || Date.now()).getTime();

      let maxSim = 0.0;
      let mostSimilarArticle = null;
      let priorReportsCount = 0;

      for (const hist of history) {
        if (hist.id === article.id) continue;

        const histTime = new Date(hist.publishedAt || 0).getTime();
        // Only compare against articles published before or concurrently
        const timeDiffHours = (targetTime - histTime) / (1000 * 3600);
        if (timeDiffHours < -1) continue; // Future article: ignore to avoid leakage!
        if (timeDiffHours > 24 * 30) continue; // Beyond 30 days lookback

        const histTokens = tokenizeText(`${hist.title || ''} ${hist.summary || ''}`);
        const sim = jaccardSimilarity(targetTokens, histTokens);

        if (sim > 0.40) {
          priorReportsCount++;
        }

        if (sim > maxSim) {
          maxSim = sim;
          mostSimilarArticle = hist;
        }
      }

      // Novelty calculation
      let score = 95;
      let reason = 'First occurrence of this event cluster in the last 30 days. No materially similar article detected.';
      let isRepeat = false;

      if (maxSim >= 0.70) {
        isRepeat = true;
        score = Math.max(10, Math.round(25 - (priorReportsCount * 5)));
        const elapsedHours = Math.max(0.1, (targetTime - new Date(mostSimilarArticle.publishedAt).getTime()) / (1000 * 3600));
        reason = `Repeated reporting: High similarity (${(maxSim * 100).toFixed(0)}%) to story published ${elapsedHours.toFixed(1)}h ago by ${mostSimilarArticle.source || 'wire'}.`;
      } else if (maxSim >= 0.40) {
        score = Math.max(40, Math.round(65 - (maxSim * 30)));
        reason = `Follow-up story: Partial overlap (${(maxSim * 100).toFixed(0)}%) with developing narrative in this sector.`;
      } else if (priorReportsCount > 0) {
        score = 80;
        reason = `New angle on active topic: ${priorReportsCount} related articles reported in recent window.`;
      }

      // Check story cluster articleCount if available
      if (article.clusterId && article.rawAlphaVantage && article.rawAlphaVantage.clusterCount > 1) {
        score = Math.max(15, score - 20);
      }

      return {
        score: Math.min(100, Math.max(0, score)),
        reason,
        isRepeat,
        maxSimilarity: Number(maxSim.toFixed(3)),
        similarArticleTitle: mostSimilarArticle ? mostSimilarArticle.title : null
      };
    }

    /**
     * Enriches article with novelty attributes.
     */
    enrichArticle(article, history = null) {
      if (!article) return article;
      const res = this.calculateNovelty(article, history);
      article.noveltyScore = res.score;
      article.noveltyReason = res.reason;
      article.isRepeat = res.isRepeat;
      return article;
    }
  }

  const singleton = new NewsNoveltyEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsNoveltyEngine,
      newsNoveltyEngine: singleton
    };
  }

  root.NewsNoveltyEngine = NewsNoveltyEngine;
  root.newsNoveltyEngine = singleton;

})(typeof window !== 'undefined' ? window : global);
