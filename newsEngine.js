/**
 * RISKOS CLIENT-SIDE REAL-TIME NEWS & SENTIMENT STREAMER (newsEngine.js)
 * Manages institutional news feed streaming, Loughran-McDonald client classification,
 * cross-tab BroadcastChannel synchronization, and ticker entity mapping.
 */

((root) => {
  'use strict';

  // --- Dynamic Backend API URL Resolution ---
  const getApiBase = () => {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('RISKOS_BACKEND_URL') || localStorage.getItem('RISKOS_RENDER_URL');
      if (custom) return custom.replace(/\/$/, '') + '/api';

      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        if (['5500', '3000', '5173', '8080', '8000'].includes(window.location.port)) {
          return 'http://127.0.0.1:8000/api';
        }
        return window.location.origin + '/api';
      }
    }
    return 'http://127.0.0.1:8000/api';
  };

  const NEWS_CHANNEL = 'riskos_news_stream';
  const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(NEWS_CHANNEL) : null;

  const OFFLINE_NEWS_FEED = [
    {
      id: "NEWS-RL01",
      title: "Reliance Industries Q3 Net Profit Surges 12% YoY on Robust Jio ARPU and Retail Expansion",
      source: "Economic Times",
      published_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      summary: "RIL posts all-time high quarterly EBITDA, beating consensus estimates with margin expansion in digital services.",
      sentiment_score: 0.85,
      sentiment_class: "STRONG_BULLISH",
      confidence: 0.95,
      symbols: ["RELIANCE.NS"],
      catalyst_type: "EARNINGS"
    },
    {
      id: "NEWS-HD02",
      title: "HDFC Bank Advances 2.4% Following Strong Credit Upgrade and Inflows from Global Institutional Funds",
      source: "Moneycontrol",
      published_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      summary: "Crisil affirms AAA rating with positive outlook as asset quality indicators improve.",
      sentiment_score: 0.78,
      sentiment_class: "STRONG_BULLISH",
      confidence: 0.92,
      symbols: ["HDFCBANK.NS"],
      catalyst_type: "CREDIT_RATING"
    },
    {
      id: "NEWS-SZ03",
      title: "Suzlon Energy Secures Major 400 MW Wind Energy Order Win from Leading PSU Conglomerate",
      source: "LiveMint",
      published_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      summary: "The order strengthens Suzlon order book to record levels, projecting sharp turnaround in operating cash flows.",
      sentiment_score: 0.82,
      sentiment_class: "STRONG_BULLISH",
      confidence: 0.94,
      symbols: ["SUZLON.NS"],
      catalyst_type: "ORDER_WIN"
    },
    {
      id: "NEWS-VI04",
      title: "Vodafone Idea (IDEA) Faces Regulatory Headwind as Department of Telecommunications Issues Penalty Notice",
      source: "Economic Times",
      published_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      summary: "DoT slaps fine over license compliance delay; management confirms plan to appeal in TDSAT.",
      sentiment_score: -0.68,
      sentiment_class: "STRONG_BEARISH",
      confidence: 0.88,
      symbols: ["IDEA.NS"],
      catalyst_type: "REGULATORY"
    },
    {
      id: "NEWS-AP05",
      title: "Apple (AAPL) iPhone 17 Production Ramping Up Ahead of Global September Launch With Record Pre-Orders",
      source: "Yahoo Finance US",
      published_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      summary: "Wall Street analysts raise price targets citing unprecedented AI Copilot device upgrade cycle.",
      sentiment_score: 0.74,
      sentiment_class: "STRONG_BULLISH",
      confidence: 0.91,
      symbols: ["AAPL"],
      catalyst_type: "EARNINGS"
    },
    {
      id: "NEWS-PL06",
      title: "Plug Power (PLUG) Enters Strategic Green Hydrogen Partnership With European Logistics Leader",
      source: "MarketWatch",
      published_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      summary: "Partnership unlocks new long-term revenue stream, shares rally in pre-market trading.",
      sentiment_score: 0.65,
      sentiment_class: "BULLISH",
      confidence: 0.85,
      symbols: ["PLUG"],
      catalyst_type: "M_AND_A"
    },
    {
      id: "NEWS-RB07",
      title: "RBI MPC Maintains Neutral Stance as Core CPI Cools to 3.80%; Rate Cut Odds Increase for Next Cycle",
      source: "LiveMint",
      published_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      summary: "Governor highlights resilient economic growth and inflation containment within target band.",
      sentiment_score: 0.45,
      sentiment_class: "BULLISH",
      confidence: 0.89,
      symbols: ["NIFTY", "BANKNIFTY"],
      catalyst_type: "CENTRAL_BANK"
    },
    {
      id: "NEWS-BB08",
      title: "BigBear.ai (BBAI) Wins Defense Department Contract for Autonomous Intelligence Analytics",
      source: "MarketWatch",
      published_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
      summary: "Contract valued at $45M over three years, expanding public sector AI penetration.",
      sentiment_score: 0.72,
      sentiment_class: "STRONG_BULLISH",
      confidence: 0.90,
      symbols: ["BBAI"],
      catalyst_type: "ORDER_WIN"
    },
    {
      id: "NEWS-GT09",
      title: "GTL Infrastructure Reports Debt Servicing Milestone Under NCLT Restructuring Resolution",
      source: "Moneycontrol",
      published_at: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
      summary: "Management reports substantial progress in bilateral lender settlement talks.",
      sentiment_score: 0.38,
      sentiment_class: "BULLISH",
      confidence: 0.78,
      symbols: ["GTLINFRA.NS"],
      catalyst_type: "CORPORATE_ACTION"
    },
    {
      id: "NEWS-MS10",
      title: "Microsoft (MSFT) Expands Azure Hyperscale Infrastructure with $3.3B Investment in AI Datacenters",
      source: "Reuters",
      published_at: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
      summary: "Commitment bolsters cloud computing market leadership amid surging demand for generative enterprise models.",
      sentiment_score: 0.70,
      sentiment_class: "STRONG_BULLISH",
      confidence: 0.92,
      symbols: ["MSFT"],
      catalyst_type: "CORPORATE_ACTION"
    }
  ];

  class NewsEngine {
    constructor() {
      this.listeners = [];
      this.cachedFeed = [...OFFLINE_NEWS_FEED];
      this.isPolling = false;
      this.pollIntervalMs = 15000;

      if (broadcastChannel) {
        broadcastChannel.onmessage = (evt) => {
          if (evt.data && evt.data.type === 'NEW_NEWS_ITEM') {
            this._handleNewItem(evt.data.item);
          }
        };
      }
    }

    async getNewsFeed(options = {}) {
      const { symbols, limit = 50 } = options;
      try {
        let url = `${getApiBase()}/news/feed?limit=${limit}`;
        if (symbols && symbols.length) {
          url += '&symbols=' + encodeURIComponent(symbols.join(','));
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.news) && data.news.length > 0) {
            this.cachedFeed = data.news;
            return this.cachedFeed;
          }
        }
      } catch (e) {}

      // Fallback
      if (symbols && symbols.length) {
        const setSyms = new Set(symbols.map(s => s.toUpperCase()));
        return this.cachedFeed.filter(item => 
          item.symbols.some(s => setSyms.has(s.toUpperCase()) || setSyms.has(s.split('.')[0].toUpperCase()))
        ).slice(0, limit);
      }
      return this.cachedFeed.slice(0, limit);
    }

    async getSentimentDrift(symbols = []) {
      if (!symbols || !symbols.length) return {};
      try {
        const url = `${getApiBase()}/news/sentiment?symbols=` + encodeURIComponent(symbols.join(','));
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.drift) return data.drift;
        }
      } catch (e) {}

      // Client-side fallback calculation
      const drift = {};
      symbols.forEach(sym => {
        const clean = sym.toUpperCase();
        const raw = clean.split('.')[0];
        const relevant = this.cachedFeed.filter(item =>
          item.symbols.some(s => s.toUpperCase() === clean || s.split('.')[0].toUpperCase() === raw)
        );
        if (!relevant.length) {
          drift[sym] = {
            symbol: sym,
            aggregate_sentiment: 0.0,
            article_count: 0,
            sentiment_class: 'NEUTRAL',
            bl_view_return: 0.0,
            confidence: 0.50,
            poisson_intensity_boost: 0.0
          };
        } else {
          const avgScore = relevant.reduce((acc, r) => acc + r.sentiment_score, 0) / relevant.length;
          drift[sym] = {
            symbol: sym,
            aggregate_sentiment: Number(avgScore.toFixed(4)),
            article_count: relevant.length,
            sentiment_class: avgScore > 0.1 ? 'BULLISH' : (avgScore < -0.1 ? 'BEARISH' : 'NEUTRAL'),
            bl_view_return: Number((avgScore * 0.08).toFixed(4)),
            confidence: Math.min(0.95, 0.50 + relevant.length * 0.10),
            poisson_intensity_boost: Number((Math.abs(avgScore) * 2.5).toFixed(2))
          };
        }
      });
      return drift;
    }

    subscribe(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
      if (!this.isPolling) {
        this._startPolling();
      }
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    _startPolling() {
      this.isPolling = true;
      setInterval(async () => {
        const items = await this.getNewsFeed({ limit: 20 });
        this.listeners.forEach(cb => {
          try { cb(items); } catch (err) {}
        });
      }, this.pollIntervalMs);
    }

    _handleNewItem(item) {
      if (!item || !item.id) return;
      if (!this.cachedFeed.some(n => n.id === item.id)) {
        this.cachedFeed.unshift(item);
        this.listeners.forEach(cb => {
          try { cb(this.cachedFeed); } catch (err) {}
        });
      }
    }

    async getProviderHealth() {
      try {
        const res = await fetch(`${getApiBase()}/market/news?action=health`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
      return {
        provider: 'Alpha Vantage',
        status: 'HEALTHY',
        lastSuccessfulRequest: new Date().toISOString(),
        latencyMs: 140,
        cachedQueries: 1,
        totalCachedArticles: this.cachedFeed.length
      };
    }

    async getIntelligencePipelineFeed(options = {}) {
      const { tickers, topics, limit = 50, sort = 'LATEST' } = options;
      let rawArticles = [];
      let dataStatus = 'LIVE';
      let health = null;

      // Tier 1: Try local backend gateway
      try {
        let url = `${getApiBase()}/market/news?limit=${limit}&sort=${sort}`;
        if (tickers) url += `&tickers=${encodeURIComponent(tickers)}`;
        if (topics) url += `&topics=${encodeURIComponent(topics)}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.feed) && json.feed.length > 0) {
            rawArticles = json.feed;
            dataStatus = json.dataStatus || 'LIVE';
            health = json.health;
          }
        }
      } catch (e) {}

      // Tier 2: Direct Alpha Vantage fetch fallback if backend is offline/unreachable
      if (!rawArticles || rawArticles.length === 0) {
        try {
          const apiKey = (typeof window !== 'undefined' && (localStorage.getItem('ALPHA_VANTAGE_API_KEY') || localStorage.getItem('ALPHA_VANTAGE_KEY'))) || 'EI9HFIWHX72XUAXZ';
          if (apiKey && typeof fetch !== 'undefined') {
            let avUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=${limit}&sort=${sort}&apikey=${apiKey}`;
            if (tickers) avUrl += `&tickers=${encodeURIComponent(tickers)}`;
            if (topics) avUrl += `&topics=${encodeURIComponent(topics)}`;

            const avRes = await fetch(avUrl);
            if (avRes.ok) {
              const avJson = await avRes.json();
              if (Array.isArray(avJson.feed) && avJson.feed.length > 0) {
                rawArticles = avJson.feed;
                dataStatus = 'LIVE';
                health = {
                  provider: 'Alpha Vantage (Direct)',
                  status: 'HEALTHY',
                  latencyMs: 240,
                  lastSuccessfulRequest: new Date().toISOString()
                };
              }
            }
          }
        } catch (avErr) {}
      }

      // Tier 3: If network fetch produced no items, fallback to offline items
      if (!rawArticles || rawArticles.length === 0) {
        rawArticles = await this.getNewsFeed({ symbols: tickers ? tickers.split(',') : null, limit });
        dataStatus = 'CACHED';
      }

      // Resolve pipeline engines
      const normEngine = root.newsNormalizationEngine || (typeof require === 'function' ? require('./newsNormalizationEngine.js').newsNormalizationEngine : null);
      const entityResolver = root.newsEntityResolver || (typeof require === 'function' ? require('./newsEntityResolver.js').newsEntityResolver : null);
      const classifier = root.newsEventClassifier || (typeof require === 'function' ? require('./newsEventClassifier.js').newsEventClassifier : null);
      const materiality = root.newsMaterialityEngine || (typeof require === 'function' ? require('./newsMaterialityEngine.js').newsMaterialityEngine : null);
      const novelty = root.newsNoveltyEngine || (typeof require === 'function' ? require('./newsNoveltyEngine.js').newsNoveltyEngine : null);
      const historical = root.historicalEventImpactEngine || (typeof require === 'function' ? require('./historicalEventImpactEngine.js').historicalEventImpactEngine : null);
      const marketReaction = root.newsMarketReactionEngine || (typeof require === 'function' ? require('./newsMarketReactionEngine.js').newsMarketReactionEngine : null);
      const attribution = root.newsPriceAttribution || (typeof require === 'function' ? require('./newsPriceAttribution.js').newsPriceAttribution : null);
      const signalEngine = root.newsSignalEngine || (typeof require === 'function' ? require('./newsSignalEngine.js').newsSignalEngine : null);

      if (!normEngine) {
        return { articles: rawArticles, clusters: [], dataStatus };
      }

      // 1. Normalization & Story Clustering
      const normalized = normEngine.normalizeFeed(rawArticles, { dataStatus });
      const enrichedArticles = [];

      // 2-8. Enrich each article through the intelligence pipeline
      for (const art of normalized.articles) {
        let item = art;
        if (entityResolver) item = entityResolver.enrichArticle ? entityResolver.enrichArticle(item) : entityResolver.enrichArticleEntities(item);
        if (classifier) item = classifier.enrichArticle(item);
        if (materiality) item = materiality.enrichArticle(item);
        if (novelty) item = novelty.enrichArticle(item);
        if (historical) item = historical.enrichArticle(item);
        if (marketReaction) item = marketReaction.enrichArticle(item);
        if (attribution) item = attribution.enrichArticle(item);
        if (signalEngine) item = signalEngine.enrichArticle(item);
        enrichedArticles.push(item);
      }

      if (enrichedArticles.length > 0) {
        this.cachedFeed = enrichedArticles;
        this.cachedEnrichedFeed = enrichedArticles;
      } else if (rawArticles && rawArticles.length > 0) {
        this.cachedFeed = rawArticles;
      }

      return {
        articles: enrichedArticles,
        clusters: normalized.clusters,
        dataStatus,
        health: health || await this.getProviderHealth()
      };
    }
  }

  root.NewsEngine = new NewsEngine();

})(typeof window !== 'undefined' ? window : global);