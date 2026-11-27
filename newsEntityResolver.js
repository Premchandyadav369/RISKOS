/**
 * RISKOS — News Entity Resolution Engine (newsEntityResolver.js)
 * Maps news tickers and corporate entities to the canonical RISKOS SecurityMaster.
 * Attaches sector, exchange, country, asset class, portfolio exposure, and watchlist flags.
 * 
 * Invariants:
 * 1. Strictly mark unmapped entities as ENTITY_UNCERTAIN without inventing mappings.
 * 2. Case-insensitive token and alias matching.
 * 3. Support for manual/rule-based entity resolution overrides.
 */

((root) => {
  'use strict';

  // Manual entity resolution overrides dictionary
  const ENTITY_OVERRIDES = {
    'RELIANCE': 'RELIANCE',
    'RIL': 'RELIANCE',
    'JIO': 'RELIANCE',
    'MUKESH AMBANI': 'RELIANCE',
    'RELIANCE.BSE': 'RELIANCE',
    'RELIANCE.NS': 'RELIANCE',
    'TCS': 'TCS',
    'TCS.NS': 'TCS',
    'TCS.BSE': 'TCS',
    'HDFC': 'HDFCBANK',
    'HDFCBANK': 'HDFCBANK',
    'HDFCBANK.BSE': 'HDFCBANK',
    'HDFCBANK.NS': 'HDFCBANK',
    'INFY': 'INFY',
    'INFOSYS': 'INFY',
    'INFY.NS': 'INFY',
    'INFY.BSE': 'INFY',
    'ICICIBANK': 'ICICIBANK',
    'ICICI': 'ICICIBANK',
    'SBIN': 'SBIN',
    'SBI': 'SBIN',
    'STATE BANK OF INDIA': 'SBIN',
    'BHARTIARTL': 'BHARTIARTL',
    'AIRTEL': 'BHARTIARTL',
    'TATAMOTORS': 'TATAMOTORS',
    'TATA MOTORS': 'TATAMOTORS',
    'JAGUAR': 'TATAMOTORS',
    'ITC': 'ITC',
    'LT': 'LT',
    'LARSEN': 'LT',
    'L&T': 'LT',
    'SUZLON': 'SUZLON',
    'SUZLON.NS': 'SUZLON',
    'IDEA': 'IDEA',
    'VODAFONE IDEA': 'IDEA',
    'IDEA.NS': 'IDEA',
    'AAPL': 'AAPL',
    'APPLE': 'AAPL',
    'APPLE INC': 'AAPL',
    'MSFT': 'MSFT',
    'MICROSOFT': 'MSFT',
    'NVDA': 'NVDA',
    'NVIDIA': 'NVDA',
    'GOOGL': 'GOOGL',
    'GOOG': 'GOOGL',
    'ALPHABET': 'GOOGL',
    'AMZN': 'AMZN',
    'AMAZON': 'AMZN',
    'META': 'META',
    'FACEBOOK': 'META',
    'TSLA': 'TSLA',
    'TESLA': 'TSLA',
    'JPM': 'JPM',
    'JPMORGAN': 'JPM',
    'JPMORGAN CHASE': 'JPM',
    'BBAI': 'BBAI',
    'BIGBEAR.AI': 'BBAI',
    'PLUG': 'PLUG',
    'PLUG POWER': 'PLUG'
  };

  class NewsEntityResolver {
    constructor() {
      this.overrides = new Map(Object.entries(ENTITY_OVERRIDES));
      this.userPortfolioSymbols = new Set(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'AAPL', 'NVDA']);
      this.userWatchlistSymbols = new Set(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'AAPL', 'NVDA', 'MSFT', 'SUZLON', 'JPM']);
    }

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
     * Set active user portfolio symbols for exposure tagging.
     */
    setPortfolioSymbols(symbols) {
      if (Array.isArray(symbols)) {
        this.userPortfolioSymbols = new Set(symbols.map(s => s.toUpperCase()));
      }
    }

    /**
     * Set active user watchlist symbols.
     */
    setWatchlistSymbols(symbols) {
      if (Array.isArray(symbols)) {
        this.userWatchlistSymbols = new Set(symbols.map(s => s.toUpperCase()));
      }
    }

    /**
     * Add or update an entity override.
     */
    addOverride(token, canonicalSymbol) {
      this.overrides.set(String(token).toUpperCase(), String(canonicalSymbol).toUpperCase());
    }

    /**
     * Resolves a raw ticker symbol, company token, or text mention to a canonical SecurityMaster entity.
     */
    resolveEntity(rawToken) {
      if (!rawToken || typeof rawToken !== 'string') {
        return {
          status: 'ENTITY_UNCERTAIN',
          rawToken: String(rawToken),
          canonicalSymbol: null,
          security: null
        };
      }

      const clean = rawToken.trim().toUpperCase();
      const stripped = clean.split('.')[0];

      // 1. Check override table
      let targetSym = this.overrides.get(clean) || this.overrides.get(stripped);

      // 2. Query SecurityMaster
      const sm = this._getSecurityMaster();
      let sec = null;

      if (sm) {
        if (targetSym) {
          sec = sm.getSecurity ? sm.getSecurity(targetSym) : null;
        }
        if (!sec) {
          sec = sm.getSecurity ? (sm.getSecurity(clean) || sm.getSecurity(stripped)) : null;
        }
        if (!sec && sm.findSecurity) {
          sec = sm.findSecurity(clean) || sm.findSecurity(stripped);
        }
      }

      if (sec) {
        const canonical = sec.symbol || targetSym || stripped;
        return {
          status: 'RESOLVED',
          rawToken,
          canonicalSymbol: canonical,
          company: sec.name || canonical,
          exchange: sec.exchange || 'UNKNOWN',
          sector: sec.sector || 'General Market',
          industry: sec.industry || sec.sector || 'Diversified',
          country: sec.country || (sec.currency === 'USD' ? 'US' : 'IN'),
          assetClass: sec.assetType || 'EQUITY',
          isin: sec.isin || 'N/A',
          marketCap: sec.marketCap || null,
          beta: sec.beta || 1.0,
          inPortfolio: this.userPortfolioSymbols.has(canonical),
          inWatchlist: this.userWatchlistSymbols.has(canonical),
          security: sec
        };
      }

      // If mapped in override table but not in SecurityMaster
      if (targetSym) {
        return {
          status: 'RESOLVED_APPROXIMATE',
          rawToken,
          canonicalSymbol: targetSym,
          company: targetSym,
          exchange: targetSym.includes('.') ? 'NSE' : 'US',
          sector: 'General Market',
          industry: 'Diversified',
          country: 'UNKNOWN',
          assetClass: 'EQUITY',
          isin: 'N/A',
          marketCap: null,
          beta: 1.0,
          inPortfolio: this.userPortfolioSymbols.has(targetSym),
          inWatchlist: this.userWatchlistSymbols.has(targetSym),
          security: null
        };
      }

      return {
        status: 'ENTITY_UNCERTAIN',
        rawToken,
        canonicalSymbol: null,
        company: null,
        exchange: null,
        sector: null,
        industry: null,
        country: null,
        assetClass: null,
        isin: null,
        marketCap: null,
        beta: 1.0,
        inPortfolio: false,
        inWatchlist: false,
        security: null
      };
    }

    /**
     * Resolves all entities for a normalized article.
     * Alias for enrichArticleEntities to provide consistent API across all news engines.
     */
    enrichArticle(article) {
      return this.enrichArticleEntities(article);
    }

    /**
     * Resolves all entities for a normalized article.
     */
    enrichArticleEntities(article) {
      if (!article) return article;

      const resolvedEntities = [];
      const symbolsToResolve = new Set();

      // Collect symbols from tickerSentiments
      if (Array.isArray(article.tickerSentiments)) {
        article.tickerSentiments.forEach(ts => {
          if (ts.ticker) symbolsToResolve.add(ts.ticker);
        });
      }

      // If no tickerSentiments, check text mentions against override keys
      if (symbolsToResolve.size === 0) {
        const textUpper = `${article.title || ''} ${article.summary || ''}`.toUpperCase();
        for (const [key, val] of this.overrides.entries()) {
          const regex = new RegExp(`\\b${key.replace('.', '\\.')}\\b`, 'i');
          if (regex.test(textUpper)) {
            symbolsToResolve.add(val);
            break;
          }
        }
      }

      let primaryEntity = null;
      for (const sym of symbolsToResolve) {
        const entity = this.resolveEntity(sym);
        resolvedEntities.push(entity);
        if (entity.status === 'RESOLVED' && !primaryEntity) {
          primaryEntity = entity;
        }
      }

      if (!primaryEntity && resolvedEntities.length > 0) {
        primaryEntity = resolvedEntities[0];
      }

      article.resolvedEntities = resolvedEntities;
      article.primaryEntity = primaryEntity || {
        status: 'ENTITY_UNCERTAIN',
        canonicalSymbol: 'MACRO',
        company: 'Macro / Cross-Market',
        sector: 'Macroeconomic',
        industry: 'Macro',
        country: 'GLOBAL',
        inPortfolio: false,
        inWatchlist: false
      };

      return article;
    }
  }

  const singleton = new NewsEntityResolver();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsEntityResolver,
      newsEntityResolver: singleton,
      ENTITY_OVERRIDES
    };
  }

  root.NewsEntityResolver = NewsEntityResolver;
  root.newsEntityResolver = singleton;

})(typeof window !== 'undefined' ? window : global);
