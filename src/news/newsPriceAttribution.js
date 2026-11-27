/**
 * RISKOS — News-Price Attribution Engine (newsPriceAttribution.js)
 * Isolates idiosyncratic event returns from macro market and sector factor drift.
 * 
 * Formula:
 * Abnormal Return = Asset Return - (alpha + beta_market * Market Return + beta_sector * Sector Return)
 * 
 * Invariants:
 * 1. Clearly labeled as an empirical statistical attribution estimate, never proof of causality.
 * 2. Deducts expected market and sector factor returns based on SecurityMaster beta coefficients.
 */

((root) => {
  'use strict';

  class NewsPriceAttribution {
    constructor() {}

    /**
     * Estimates abnormal return for an asset during an event observation window.
     */
    calculateAttribution(params = {}) {
      const {
        symbol = 'ASSET',
        assetReturnPct = 0.0,
        marketReturnPct = 0.0,
        sectorReturnPct = 0.0,
        betaMarket = 1.0,
        betaSector = 0.5,
        alpha = 0.0
      } = params;

      // Expected factor return from Market and Sector beta exposures
      const expectedMarketContribution = betaMarket * marketReturnPct;
      const expectedSectorContribution = betaSector * sectorReturnPct;
      const totalExpectedReturn = alpha + expectedMarketContribution + expectedSectorContribution;

      // Abnormal Return (alpha / idiosyncratic event residual)
      const abnormalReturnPct = assetReturnPct - totalExpectedReturn;

      // Attribution percentage: how much of the move is idiosyncratic
      let eventAttributionShare = 0;
      if (Math.abs(assetReturnPct) > 0.001) {
        eventAttributionShare = Math.min(100, Math.max(0, Math.round((Math.abs(abnormalReturnPct) / Math.abs(assetReturnPct)) * 100)));
      }

      return {
        symbol,
        assetReturnPct: Number(assetReturnPct.toFixed(2)),
        abnormalReturnPct: Number(abnormalReturnPct.toFixed(2)),
        marketReturnPct: Number(marketReturnPct.toFixed(2)),
        sectorReturnPct: Number(sectorReturnPct.toFixed(2)),
        expectedMarketContribution: Number(expectedMarketContribution.toFixed(2)),
        expectedSectorContribution: Number(expectedSectorContribution.toFixed(2)),
        totalExpectedReturn: Number(totalExpectedReturn.toFixed(2)),
        eventAttributionSharePct: eventAttributionShare,
        disclaimer: 'Attribution estimate derived from multifactor beta decomposition; does not prove singular physical causality.'
      };
    }

    /**
     * Enriches article with attribution estimates.
     */
    enrichArticle(article) {
      if (!article) return article;
      const reaction = article.marketReaction;
      const sec = article.primaryEntity?.security;

      if (reaction) {
        const attr = this.calculateAttribution({
          symbol: article.primaryEntity?.canonicalSymbol || 'SECURITY',
          assetReturnPct: reaction.priceChangePct || 0.0,
          marketReturnPct: reaction.marketChangePct || 0.0,
          sectorReturnPct: reaction.sectorChangePct || 0.0,
          betaMarket: sec?.beta || 1.0,
          betaSector: 0.4
        });
        article.priceAttribution = attr;
        article.abnormalReturnPct = attr.abnormalReturnPct;
      }
      return article;
    }
  }

  const singleton = new NewsPriceAttribution();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsPriceAttribution,
      newsPriceAttribution: singleton
    };
  }

  root.NewsPriceAttribution = NewsPriceAttribution;
  root.newsPriceAttribution = singleton;

})(typeof window !== 'undefined' ? window : global);
