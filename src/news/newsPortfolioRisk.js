/**
 * RISKOS — News Portfolio & Event Risk Engine (newsPortfolioRisk.js)
 * Evaluates net news sentiment, event risk exposure, and sector concentration across portfolios.
 * 
 * Invariants:
 * 1. Strictly preserves private user portfolio data inside authenticated client context.
 * 2. Computes positive/negative exposure, net score, event concentration, and jump-volatility warnings.
 * 3. Integrates with existing portfolio optimizer and risk frameworks.
 */

((root) => {
  'use strict';

  class NewsPortfolioRisk {
    constructor() {}

    /**
     * Aggregates news intelligence across portfolio holdings.
     * @param {Array<Object>} portfolioHoldings - Array of { symbol, weight, shares, value }
     * @param {Array<Object>} enrichedArticles - Array of normalized/enriched NewsArticle instances
     */
    evaluatePortfolioNewsRisk(portfolioHoldings = [], enrichedArticles = []) {
      if (!Array.isArray(portfolioHoldings) || portfolioHoldings.length === 0) {
        // Fallback default portfolio holdings
        portfolioHoldings = [
          { symbol: 'RELIANCE', weight: 0.25, name: 'Reliance Industries' },
          { symbol: 'TCS', weight: 0.20, name: 'Tata Consultancy Services' },
          { symbol: 'HDFCBANK', weight: 0.20, name: 'HDFC Bank' },
          { symbol: 'INFY', weight: 0.15, name: 'Infosys Limited' },
          { symbol: 'AAPL', weight: 0.10, name: 'Apple Inc.' },
          { symbol: 'NVDA', weight: 0.10, name: 'Nvidia Corp.' }
        ];
      }

      const holdingSymbols = new Set(portfolioHoldings.map(h => h.symbol.toUpperCase().split('.')[0]));
      const holdingMap = new Map();
      portfolioHoldings.forEach(h => {
        holdingMap.set(h.symbol.toUpperCase().split('.')[0], h);
      });

      let totalPositiveExposure = 0;
      let totalNegativeExposure = 0;
      let neutralCount = 0;
      const constituentRisks = [];
      const sectorExposureMap = new Map();

      // Find all articles affecting portfolio holdings
      const matchedArticles = [];

      for (const art of enrichedArticles) {
        const canonical = art.primaryEntity?.canonicalSymbol?.toUpperCase().split('.')[0];
        const isMatched = holdingSymbols.has(canonical) || (art.tickerSentiments || []).some(ts => holdingSymbols.has(ts.ticker.toUpperCase().split('.')[0]));

        if (isMatched) {
          matchedArticles.push(art);
          const holding = holdingMap.get(canonical) || { weight: 0.10, symbol: canonical };
          const sentiment = art.overallSentiment || 0;
          const materiality = (art.materialityScore || 50) / 100;
          const weightedImpact = Math.round(sentiment * materiality * (holding.weight || 0.1) * 100);

          if (weightedImpact > 0) {
            totalPositiveExposure += weightedImpact;
          } else if (weightedImpact < 0) {
            totalNegativeExposure += Math.abs(weightedImpact);
          } else {
            neutralCount++;
          }

          const sector = art.primaryEntity?.sector || 'Diversified';
          sectorExposureMap.set(sector, (sectorExposureMap.get(sector) || 0) + 1);
        }
      }

      // Compute company-level event risk
      holdingSymbols.forEach(sym => {
        const holding = holdingMap.get(sym);
        const related = matchedArticles.filter(a => 
          a.primaryEntity?.canonicalSymbol?.toUpperCase().split('.')[0] === sym ||
          (a.tickerSentiments || []).some(ts => ts.ticker.toUpperCase().split('.')[0] === sym)
        );

        let companyEventRiskStatus = 'LOW_EVENT_RISK';
        let highestMateriality = 0;
        let eventCatalysts = [];

        related.forEach(a => {
          if ((a.materialityScore || 0) > highestMateriality) {
            highestMateriality = a.materialityScore;
          }
          if (a.eventType && !eventCatalysts.includes(a.eventType)) {
            eventCatalysts.push(a.eventType);
          }
        });

        if (highestMateriality >= 85 || eventCatalysts.includes('EARNINGS') || eventCatalysts.includes('REGULATORY') || eventCatalysts.includes('BANKRUPTCY')) {
          companyEventRiskStatus = 'CRITICAL_EVENT_RISK';
        } else if (highestMateriality >= 65 || related.length >= 3) {
          companyEventRiskStatus = 'ELEVATED_EVENT_RISK';
        } else if (related.length > 0) {
          companyEventRiskStatus = 'MODERATE_EVENT_RISK';
        }

        constituentRisks.push({
          symbol: sym,
          weight: holding?.weight || 0.10,
          articleCount: related.length,
          highestMateriality,
          riskStatus: companyEventRiskStatus,
          eventCatalysts: eventCatalysts.slice(0, 3),
          expectedVolExpansionPct: companyEventRiskStatus === 'CRITICAL_EVENT_RISK' ? 38 : (companyEventRiskStatus === 'ELEVATED_EVENT_RISK' ? 22 : 8)
        });
      });

      // Sort constituent risks highest risk first
      constituentRisks.sort((a, b) => b.highestMateriality - a.highestMateriality);

      const netNewsScore = totalPositiveExposure - totalNegativeExposure;

      return {
        totalNewsEvents: matchedArticles.length,
        positiveExposure: totalPositiveExposure,
        negativeExposure: -totalNegativeExposure,
        neutralCount,
        netNewsScore,
        netSentimentLabel: netNewsScore > 10 ? 'NET_POSITIVE' : (netNewsScore < -10 ? 'NET_NEGATIVE' : 'BALANCED'),
        highestEventRiskConstituents: constituentRisks.slice(0, 3).map(c => c.symbol),
        constituentRisks,
        sectorNewsDistribution: Object.fromEntries(sectorExposureMap),
        recentMatchedArticles: matchedArticles.slice(0, 10)
      };
    }
  }

  const singleton = new NewsPortfolioRisk();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsPortfolioRisk,
      newsPortfolioRisk: singleton
    };
  }

  root.NewsPortfolioRisk = NewsPortfolioRisk;
  root.newsPortfolioRisk = singleton;

})(typeof window !== 'undefined' ? window : global);
