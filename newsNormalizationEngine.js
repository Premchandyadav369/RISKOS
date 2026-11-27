/**
 * RISKOS — News Normalization & Story Clustering Engine (newsNormalizationEngine.js)
 * Normalizes raw Alpha Vantage payloads into canonical internal schema,
 * eliminates syndicated reprint redundancy, groups related stories into NewsStoryClusters,
 * and tracks publication, ingestion, and processing timestamps.
 * 
 * Invariants:
 * 1. Strictly distinct timestamps: publishedAt, receivedAt, processedAt.
 * 2. Complete preservation of raw Alpha Vantage provenance in rawAlphaVantage.
 * 3. Deterministic clustering to avoid over-counting repetitive wire reports.
 */

((root) => {
  'use strict';

  // Format Alpha Vantage time_published ("YYYYMMDDTHHMMSS" or "YYYYMMDDTHHMM") into standard ISO-8601
  function parseAlphaVantageTimestamp(ts) {
    if (!ts) return new Date().toISOString();
    if (typeof ts === 'string' && ts.includes('-') && ts.includes(':')) {
      return new Date(ts).toISOString();
    }
    const clean = String(ts).trim();
    if (clean.length >= 13 && clean.includes('T')) {
      const year = clean.substring(0, 4);
      const month = clean.substring(4, 6);
      const day = clean.substring(6, 8);
      const hour = clean.substring(9, 11);
      const minute = clean.substring(11, 13);
      const second = clean.length >= 15 ? clean.substring(13, 15) : '00';
      return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    }
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  // Fast deterministic hash string generator
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // Tokenize text for semantic similarity & clustering
  function tokenizeText(text) {
    if (!text) return new Set();
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
      'with', 'as', 'by', 'that', 'it', 'from', 'this', 'be', 'are', 'was', 'has', 'have'
    ]);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    return new Set(words.filter(w => w.length > 2 && !stopwords.has(w)));
  }

  // Compute Jaccard coefficient between token sets
  function jaccardSimilarity(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  class NewsNormalizationEngine {
    constructor() {
      this.clusterMap = new Map();
      this.processedArticles = new Map();
    }

    /**
     * Normalizes a single raw Alpha Vantage article object.
     */
    normalizeArticle(rawArticle, options = {}) {
      if (!rawArticle) return null;

      const receivedAt = rawArticle.receivedAt || options.receivedAt || new Date().toISOString();
      const processedAt = new Date().toISOString();
      const publishedAt = parseAlphaVantageTimestamp(rawArticle.time_published || rawArticle.published_at);

      const title = String(rawArticle.title || '').trim();
      const summary = String(rawArticle.summary || '').trim();
      const source = String(rawArticle.source || 'Wire Source').trim();
      const url = String(rawArticle.url || rawArticle.link || '#').trim();

      // Stable article ID based on title, source, and published date
      const id = rawArticle.id || `AV-${hashString(title + source + publishedAt.slice(0, 10))}`;

      // Normalize overall sentiment
      const sentimentScore = typeof rawArticle.overall_sentiment_score === 'number'
        ? Number(rawArticle.overall_sentiment_score.toFixed(4))
        : (typeof rawArticle.sentiment_score === 'number' ? rawArticle.sentiment_score : 0.0);

      const sentimentLabel = rawArticle.overall_sentiment_label || rawArticle.sentiment_class || 'Neutral';

      // Normalize ticker sentiments
      const tickerSentiments = [];
      if (Array.isArray(rawArticle.ticker_sentiment)) {
        rawArticle.ticker_sentiment.forEach(ts => {
          tickerSentiments.push({
            ticker: String(ts.ticker || '').toUpperCase(),
            relevanceScore: parseFloat(ts.relevance_score || '1.0') || 1.0,
            sentimentScore: parseFloat(ts.ticker_sentiment_score || '0.0') || 0.0,
            sentimentLabel: ts.ticker_sentiment_label || 'Neutral'
          });
        });
      } else if (Array.isArray(rawArticle.symbols)) {
        rawArticle.symbols.forEach(s => {
          tickerSentiments.push({
            ticker: String(s).toUpperCase(),
            relevanceScore: 1.0,
            sentimentScore: sentimentScore,
            sentimentLabel: sentimentLabel
          });
        });
      }

      // Normalize topics
      const topics = [];
      if (Array.isArray(rawArticle.topics)) {
        rawArticle.topics.forEach(tp => {
          topics.push({
            topic: String(tp.topic || '').trim(),
            relevanceScore: parseFloat(tp.relevance_score || '1.0') || 1.0
          });
        });
      }

      // Calculate freshness score using exponential decay: e^(-lambda * deltaHours)
      const pubDate = new Date(publishedAt).getTime();
      const now = Date.now();
      const deltaHours = Math.max(0, (now - pubDate) / (1000 * 60 * 60));
      const lambda = 0.05; // half-life ~14 hours
      const freshnessScore = Number(Math.exp(-lambda * deltaHours).toFixed(4));

      return {
        id,
        source,
        title,
        summary,
        url,
        publishedAt,
        receivedAt,
        processedAt,
        freshnessScore,
        ageHours: Number(deltaHours.toFixed(1)),
        overallSentiment: sentimentScore,
        overallSentimentLabel: sentimentLabel,
        tickerSentiments,
        topics,
        dataSource: 'AlphaVantage',
        dataStatus: options.dataStatus || 'LIVE',
        rawAlphaVantage: rawArticle
      };
    }

    /**
     * Normalizes an entire array of raw articles and clusters related stories.
     */
    normalizeFeed(rawFeed, options = {}) {
      if (!Array.isArray(rawFeed)) return { articles: [], clusters: [] };

      const normalizedArticles = [];
      const seenIds = new Set();

      for (const item of rawFeed) {
        const norm = this.normalizeArticle(item, options);
        if (norm && !seenIds.has(norm.id)) {
          seenIds.add(norm.id);
          normalizedArticles.push(norm);
          this.processedArticles.set(norm.id, norm);
        }
      }

      // Sort chronological descending (newest publishedAt first)
      normalizedArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      // Cluster related stories
      const clusters = this.clusterStories(normalizedArticles);

      return {
        articles: normalizedArticles,
        clusters: clusters
      };
    }

    /**
     * Clusters normalized articles into NewsStoryCluster instances.
     * Prevents over-counting syndicated reprints or follow-ups of the same event.
     */
    clusterStories(articles, similarityThreshold = 0.35) {
      const clusters = [];
      const assignedCluster = new Map();

      for (let i = 0; i < articles.length; i++) {
        const artA = articles[i];
        if (assignedCluster.has(artA.id)) continue;

        const tokensA = tokenizeText(`${artA.title} ${artA.summary}`);
        const currentClusterArticles = [artA];
        const affectedSecuritiesSet = new Set(artA.tickerSentiments.map(ts => ts.ticker));
        const sourcesSet = new Set([artA.source]);

        for (let j = i + 1; j < articles.length; j++) {
          const artB = articles[j];
          if (assignedCluster.has(artB.id)) continue;

          // Time proximity check: articles must be within 72 hours of each other to cluster
          const timeDiffHours = Math.abs(new Date(artA.publishedAt) - new Date(artB.publishedAt)) / (1000 * 3600);
          if (timeDiffHours > 72) continue;

          const tokensB = tokenizeText(`${artB.title} ${artB.summary}`);
          const sim = jaccardSimilarity(tokensA, tokensB);

          if (sim >= similarityThreshold) {
            currentClusterArticles.push(artB);
            artB.tickerSentiments.forEach(ts => affectedSecuritiesSet.add(ts.ticker));
            sourcesSet.add(artB.source);
            assignedCluster.set(artB.id, true);
          }
        }

        assignedCluster.set(artA.id, true);

        // Sort cluster articles chronologically
        currentClusterArticles.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

        const firstPub = currentClusterArticles[0].publishedAt;
        const latestUp = currentClusterArticles[currentClusterArticles.length - 1].publishedAt;
        const avgSentiment = currentClusterArticles.reduce((sum, a) => sum + a.overallSentiment, 0) / currentClusterArticles.length;

        const cluster = {
          clusterId: `CLUSTER-${hashString(artA.title).substring(0, 8).toUpperCase()}`,
          canonicalHeadline: artA.title,
          articleCount: currentClusterArticles.length,
          firstPublication: firstPub,
          latestUpdate: latestUp,
          affectedSecurities: Array.from(affectedSecuritiesSet),
          aggregateSentiment: Number(avgSentiment.toFixed(4)),
          sourceDiversity: sourcesSet.size,
          sources: Array.from(sourcesSet),
          articles: currentClusterArticles
        };

        // Attach clusterId to each article
        currentClusterArticles.forEach(a => {
          a.clusterId = cluster.clusterId;
        });

        clusters.push(cluster);
      }

      return clusters;
    }
  }

  const singleton = new NewsNormalizationEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsNormalizationEngine,
      newsNormalizationEngine: singleton,
      parseAlphaVantageTimestamp,
      tokenizeText,
      jaccardSimilarity
    };
  }

  root.NewsNormalizationEngine = NewsNormalizationEngine;
  root.newsNormalizationEngine = singleton;

})(typeof window !== 'undefined' ? window : global);
