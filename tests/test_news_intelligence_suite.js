/**
 * RISKOS — Complete Institutional News Intelligence & Event-Driven Alpha Engine Validation Suite
 * (tests/test_news_intelligence_suite.js)
 * 
 * Tests:
 * 1. Alpha Vantage schema parsing, malformed handling, and distinct timestamp hygiene.
 * 2. Story clustering, redundancy elimination, and freshness decay.
 * 3. Entity resolution, SecurityMaster mapping, and ENTITY_UNCERTAIN handling.
 * 4. Standardized 28-category event classification and independent eventConfidence.
 * 5. Deterministic economic materiality scoring (0-100) and LOW/MODERATE/HIGH/CRITICAL ratings.
 * 6. Novelty evaluation against 30-day lookback window and syndicated repeat detection.
 * 7. Historical event impact distribution across 8 forward horizons (5m to 20d) with MAE/MFE.
 * 8. Real-time market reaction, confirmation assessment, and abnormal return attribution.
 * 9. News Alpha calculation, NO_TRADE gating on divergence, and multi-factor decomposition.
 * 10. Portfolio event risk aggregation, net news score, and constituent jump warnings.
 * 11. Strict research backtest look-ahead leakage prevention.
 * 12. End-to-End full pipeline traceability from raw Alpha Vantage payload to risk signals.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}`);
  }
}

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS ALPHA VANTAGE NEWS INTELLIGENCE VALIDATION SUITE');
console.log('══════════════════════════════════════════════════════════════════════════\n');

// ── 1. ALPHA VANTAGE SCHEMA & TIMESTAMP HYGIENE ─────────────────────────────
it('Alpha Vantage Parsing & Timestamp Hygiene: Distinct publishedAt, receivedAt, processedAt', () => {
  const normEngineMod = require(path.join(ROOT, 'newsNormalizationEngine.js'));
  const norm = normEngineMod.newsNormalizationEngine;

  const rawSample = {
    title: "JPMorgan Chase & Co. Increases Substantial Holding in Clean Energy Assets",
    url: "https://www.tipranks.com/news/institutional/jpmorgan",
    time_published: "20260921T063000",
    source: "TipRanks",
    overall_sentiment_score: 0.2916,
    overall_sentiment_label: "Somewhat-Bullish",
    ticker_sentiment: [
      { ticker: "JPM", relevance_score: "1.000000", ticker_sentiment_score: "0.2822", ticker_sentiment_label: "Somewhat-Bullish" }
    ]
  };

  const normalized = norm.normalizeArticle(rawSample, { receivedAt: '2026-09-21T06:45:00.000Z' });

  assert(normalized, 'Article must normalize successfully');
  assert(normalized.publishedAt.startsWith('2026-09-21T06:30:00'), 'publishedAt must match time_published');
  assert.strictEqual(normalized.receivedAt, '2026-09-21T06:45:00.000Z', 'receivedAt must be preserved');
  assert(normalized.processedAt, 'processedAt must be present');
  assert.notStrictEqual(normalized.publishedAt, normalized.processedAt, 'Timestamps must remain distinctly separated');
  assert(normalized.rawAlphaVantage, 'Raw Alpha Vantage payload must be preserved for provenance');
  assert.strictEqual(normalized.tickerSentiments[0].ticker, 'JPM', 'Ticker must be normalized');
  assert.strictEqual(normalized.overallSentiment, 0.2916, 'Sentiment score must be preserved');
});

// ── 2. REDUNDANCY & STORY CLUSTERING ─────────────────────────────────────────
it('Story Clustering: Groups syndicated wire reprints and computes source diversity', () => {
  const normEngineMod = require(path.join(ROOT, 'newsNormalizationEngine.js'));
  const norm = normEngineMod.newsNormalizationEngine;

  const duplicateFeed = [
    {
      id: "WIRE-01",
      title: "Reliance Industries Reports Q3 Net Profit Surges on Retail Expansion & Robust Jio ARPU",
      source: "Reuters",
      time_published: "20260921T050000",
      summary: "Reliance Industries posted record quarterly EBITDA beating Street estimates."
    },
    {
      id: "WIRE-02",
      title: "Reliance Industries Reports Q3 Net Profit Surges on Retail Expansion & Robust Jio ARPU",
      source: "Bloomberg",
      time_published: "20260921T051500",
      summary: "Reliance Industries posted record quarterly EBITDA beating Street estimates."
    },
    {
      id: "WIRE-03",
      title: "Reliance Industries Reports Q3 Net Profit Surges on Retail Expansion & Robust Jio ARPU",
      source: "Economic Times",
      time_published: "20260921T053000",
      summary: "Reliance Industries posted record quarterly EBITDA beating Street estimates."
    }
  ];

  const result = norm.normalizeFeed(duplicateFeed);
  assert.strictEqual(result.articles.length, 3, 'All 3 articles must be retained for provenance');
  assert.strictEqual(result.clusters.length, 1, 'Duplicate wire reprints must be grouped into exactly 1 cluster');
  assert.strictEqual(result.clusters[0].articleCount, 3, 'Cluster must record 3 articles');
  assert.strictEqual(result.clusters[0].sourceDiversity, 3, 'Source diversity must equal 3 unique news organizations');
});

// ── 3. ENTITY RESOLUTION & SECURITY MASTER MAPPING ──────────────────────────
it('Entity Resolution: Maps to SecurityMaster and flags ENTITY_UNCERTAIN without hallucination', () => {
  const entityResolverMod = require(path.join(ROOT, 'newsEntityResolver.js'));
  const resolver = entityResolverMod.newsEntityResolver;

  // Test known asset
  const resolvedRIL = resolver.resolveEntity('RELIANCE.BSE');
  assert(resolvedRIL.status === 'RESOLVED' || resolvedRIL.status === 'RESOLVED_APPROXIMATE', 'RELIANCE must resolve');
  assert.strictEqual(resolvedRIL.canonicalSymbol, 'RELIANCE', 'Canonical symbol must resolve to RELIANCE');

  // Test global tech
  const resolvedAAPL = resolver.resolveEntity('AAPL');
  assert(resolvedAAPL.status === 'RESOLVED' || resolvedAAPL.status === 'RESOLVED_APPROXIMATE', 'AAPL must resolve');

  // Test unmapped unknown ticker token
  const unknown = resolver.resolveEntity('XYZ_NONEXISTENT_SECURITY_999');
  assert.strictEqual(unknown.status, 'ENTITY_UNCERTAIN', 'Unknown security must strictly report ENTITY_UNCERTAIN');
  assert.strictEqual(unknown.canonicalSymbol, null, 'Uncertain entity must not invent a symbol mapping');
});

// ── 4. EVENT TAXONOMY CLASSIFICATION ────────────────────────────────────────
it('Event Classification: Classifies 28 standardized categories and decouples eventConfidence', () => {
  const classifierMod = require(path.join(ROOT, 'newsEventClassifier.js'));
  const classifier = classifierMod.newsEventClassifier;

  const testCases = [
    { text: "TCS beats quarterly profit estimates with record deal bookings", expected: "EARNINGS_SURPRISE" },
    { text: "Federal Reserve signals neutral interest rates glidepath at FOMC", expected: "MONETARY_POLICY" },
    { text: "Vodafone Idea receives penalty notice from Department of Telecommunications", expected: "REGULATORY" },
    { text: "Apple acquires strategic generative AI silicon startup", expected: "MERGER_ACQUISITION" },
    { text: "Suzlon secures 400 MW PSU renewable order win", expected: "CONTRACT" }
  ];

  testCases.forEach(tc => {
    const res = classifier.classifyEvent(tc.text);
    assert.strictEqual(res.eventType, tc.expected, `Text '${tc.text}' should classify as ${tc.expected}`);
    assert(res.eventConfidence >= 50 && res.eventConfidence <= 100, 'eventConfidence must be bounded in [50, 100]');
    assert(Array.isArray(res.matchedKeywords), 'matchedKeywords must be recorded');
  });
});

// ── 5. ECONOMIC MATERIALITY ENGINE ──────────────────────────────────────────
it('Materiality Engine: Computes explainable 0-100 score and categorical ratings', () => {
  const materialityMod = require(path.join(ROOT, 'newsMaterialityEngine.js'));
  const engine = materialityMod.newsMaterialityEngine;

  const highImpactArticle = {
    baseMateriality: 90,
    eventType: 'EARNINGS_SURPRISE',
    eventLabel: 'Earnings Surprise',
    source: 'Reuters',
    tickerSentiments: [{ ticker: 'RELIANCE', relevanceScore: 1.0 }],
    primaryEntity: { inPortfolio: true, security: { marketCap: 20000000000000 } }
  };

  const matHigh = engine.calculateMateriality(highImpactArticle);
  assert(matHigh.score >= 70, 'High impact portfolio earnings beat must have materiality >= 70');
  assert(matHigh.rating === 'HIGH' || matHigh.rating === 'CRITICAL', 'Rating must be HIGH or CRITICAL');
  assert(matHigh.rationale.includes('portfolio constituent'), 'Rationale must document portfolio boost');

  const lowImpactArticle = {
    baseMateriality: 45,
    eventType: 'OTHER',
    eventLabel: 'General Corporate',
    source: 'Discussion Forum Blog',
    tickerSentiments: [{ ticker: 'PENNY', relevanceScore: 0.3 }],
    primaryEntity: { inPortfolio: false }
  };

  const matLow = engine.calculateMateriality(lowImpactArticle);
  assert(matLow.score < 50, 'Low impact speculative article must score < 50');
});

// ── 6. NOVELTY & REPEAT DETECTION ───────────────────────────────────────────
it('Novelty Engine: Evaluates rolling 30-day novelty and penalizes repeats', () => {
  const noveltyMod = require(path.join(ROOT, 'newsNoveltyEngine.js'));
  const engine = noveltyMod.newsNoveltyEngine;

  const histArticles = [
    {
      id: "H01",
      title: "HDFC Bank advances on strong credit upgrade and institutional inflows",
      summary: "Crisil affirms AAA rating with positive outlook.",
      publishedAt: new Date(Date.now() - 1000 * 3600 * 4).toISOString()
    }
  ];

  // Identical syndicated reprint 2 hours later
  const repeatArticle = {
    id: "H02",
    title: "HDFC Bank advances on strong credit upgrade and institutional inflows",
    summary: "Crisil affirms AAA rating with positive outlook.",
    publishedAt: new Date().toISOString()
  };

  const repeatResult = engine.calculateNovelty(repeatArticle, histArticles);
  assert(repeatResult.isRepeat, 'Identical wire report must be flagged as isRepeat: true');
  assert(repeatResult.score <= 30, 'Repeat story novelty must be penalized <= 30');
  assert(repeatResult.reason.includes('Repeated reporting'), 'Reason must explain repetition');

  // Completely new event
  const novelArticle = {
    id: "H03",
    title: "Infosys signs $1.5B multi-year cloud transformation pact with European carrier",
    summary: "New deal backlog sets all-time record.",
    publishedAt: new Date().toISOString()
  };

  const novelResult = engine.calculateNovelty(novelArticle, histArticles);
  assert(!novelResult.isRepeat, 'New deal announcement must not be marked as repeat');
  assert(novelResult.score >= 80, 'Novel announcement must score >= 80');
});

// ── 7. HISTORICAL EVENT IMPACT DISTRIBUTIONS ────────────────────────────────
it('Historical Event Impact: Provides empirical forward horizons (5m to 20d) with MAE/MFE', () => {
  const impactMod = require(path.join(ROOT, 'historicalEventImpactEngine.js'));
  const engine = impactMod.historicalEventImpactEngine;

  const profile = engine.getEventImpactProfile('EARNINGS_SURPRISE', 0.85);

  assert.strictEqual(profile.sampleSize, 184, 'Sample size N must equal 184');
  const requiredHorizons = ['5m', '15m', '30m', '1h', '1d', '3d', '5d', '20d'];
  requiredHorizons.forEach(hz => {
    assert(profile.horizons[hz], `Horizon ${hz} must exist`);
    assert(typeof profile.horizons[hz].meanReturnPct === 'number', `Mean return for ${hz} must be numeric`);
    assert(typeof profile.horizons[hz].maxAdverseExcursionPct === 'number', `MAE for ${hz} must be numeric`);
    assert(typeof profile.horizons[hz].maxFavorableExcursionPct === 'number', `MFE for ${hz} must be numeric`);
    assert(Array.isArray(profile.horizons[hz].confidenceInterval95), `95% CI for ${hz} must be an array`);
  });

  // Test sign reversal on negative sentiment
  const negativeProfile = engine.getEventImpactProfile('EARNINGS_SURPRISE', -0.85);
  assert(negativeProfile.horizons['1d'].meanReturnPct < 0, 'Negative earnings surprise must produce negative forward return expectation');
});

// ── 8. MARKET REACTION & ABNORMAL RETURN ATTRIBUTION ────────────────────────
it('Market Reaction & Attribution: Corroborates confirmation and computes abnormal return', () => {
  const reactionMod = require(path.join(ROOT, 'newsMarketReactionEngine.js'));
  const attrMod = require(path.join(ROOT, 'newsPriceAttribution.js'));

  const reactEngine = reactionMod.newsMarketReactionEngine;
  const attrEngine = attrMod.newsPriceAttribution;

  // Bullish news + strong price move + volume surge -> STRONG confirmation
  const reactStrong = reactEngine.calculateReaction('RELIANCE', 0.82, {
    priceChangePct: 2.1,
    rvol: 3.4,
    sectorChangePct: 0.7,
    marketChangePct: 0.2
  });
  assert.strictEqual(reactStrong.confirmation, 'STRONG', 'High RVOL and price alignment must yield STRONG confirmation');

  // Bullish news + price drop -> DIVERGENT confirmation
  const reactDivergent = reactEngine.calculateReaction('RELIANCE', 0.82, {
    priceChangePct: -1.5,
    rvol: 2.5
  });
  assert.strictEqual(reactDivergent.confirmation, 'DIVERGENT', 'Price moving against sentiment must yield DIVERGENT confirmation');

  // Abnormal return attribution
  const attr = attrEngine.calculateAttribution({
    symbol: 'RELIANCE',
    assetReturnPct: 2.10,
    marketReturnPct: 0.20,
    sectorReturnPct: 0.70,
    betaMarket: 1.08,
    betaSector: 0.40
  });

  // Expected = 1.08*0.20 + 0.40*0.70 = 0.216 + 0.28 = 0.496 -> ~0.50%
  // Abnormal = 2.10 - 0.50 = 1.60%
  assert(attr.abnormalReturnPct > 1.4 && attr.abnormalReturnPct < 1.8, 'Abnormal return must deduct factor beta contributions');
  assert(attr.disclaimer.includes('does not prove singular physical causality'), 'Disclaimer must be present');
});

// ── 9. NEWS ALPHA & NO_TRADE GATING ─────────────────────────────────────────
it('News Signal Engine: Enforces NO_TRADE gating on divergence and decomposes additive factors', () => {
  const signalMod = require(path.join(ROOT, 'newsSignalEngine.js'));
  const engine = signalMod.newsSignalEngine;

  // Eligible trading case
  const bullishConfirmedArticle = {
    overallSentiment: 0.75,
    overallSentimentLabel: 'Bullish',
    materialityScore: 88,
    noveltyScore: 90,
    source: 'Reuters',
    historicalHitRate: 0.65,
    marketConfirmation: 'STRONG',
    freshnessScore: 0.95,
    eventConfidence: 85,
    primaryEntity: { canonicalSymbol: 'RELIANCE' },
    tickerSentiments: [{ ticker: 'RELIANCE', relevanceScore: 1.0 }]
  };

  const bullishSignal = engine.generateSignal(bullishConfirmedArticle);
  assert(bullishSignal.newsAlpha >= 30, 'Bullish confirmed event must produce high positive News Alpha');
  assert.strictEqual(bullishSignal.tradeDecision, 'ELIGIBLE_FOR_ORDER', 'Should be eligible for order');
  assert.strictEqual(bullishSignal.gateReasons.length, 0, 'No gating restrictions should apply');

  // Gated case: Divergent "Sell-the-news" event
  const divergentArticle = {
    ...bullishConfirmedArticle,
    marketConfirmation: 'DIVERGENT'
  };

  const divergentSignal = engine.generateSignal(divergentArticle);
  assert.strictEqual(divergentSignal.tradeDecision, 'NO_TRADE', 'Divergence MUST trigger NO_TRADE gating');
  assert(divergentSignal.gateReasons.some(r => r.includes('divergence')), 'Gate reason must document divergence');

  // Signal decomposition test
  assert(typeof bullishSignal.decomposition.net === 'number', 'Net signal score must be computed');
  assert.strictEqual(
    bullishSignal.decomposition.net,
    bullishSignal.decomposition.newsAlpha +
    bullishSignal.decomposition.momentum +
    bullishSignal.decomposition.volume +
    bullishSignal.decomposition.regime +
    bullishSignal.decomposition.forecast +
    bullishSignal.decomposition.risk,
    'Decomposition must be strictly additive'
  );
});

// ── 10. PORTFOLIO RISK AGGREGATION ──────────────────────────────────────────
it('Portfolio News Risk: Aggregates net score and identifies constituent jump warnings', () => {
  const portRiskMod = require(path.join(ROOT, 'newsPortfolioRisk.js'));
  const engine = portRiskMod.newsPortfolioRisk;

  const holdings = [
    { symbol: 'RELIANCE', weight: 0.40 },
    { symbol: 'INFY', weight: 0.30 },
    { symbol: 'TCS', weight: 0.30 }
  ];

  const articles = [
    {
      primaryEntity: { canonicalSymbol: 'RELIANCE', sector: 'Energy' },
      overallSentiment: 0.80,
      materialityScore: 92,
      eventType: 'EARNINGS_SURPRISE'
    },
    {
      primaryEntity: { canonicalSymbol: 'INFY', sector: 'IT' },
      overallSentiment: -0.45,
      materialityScore: 75,
      eventType: 'GUIDANCE'
    }
  ];

  const evalResult = engine.evaluatePortfolioNewsRisk(holdings, articles);
  assert.strictEqual(evalResult.totalNewsEvents, 2, 'Must match 2 portfolio news events');
  assert(evalResult.positiveExposure > 0, 'Positive exposure must be positive');
  assert(evalResult.negativeExposure < 0, 'Negative exposure must be negative');
  assert(evalResult.highestEventRiskConstituents.includes('RELIANCE'), 'RELIANCE must be flagged in highest event risk');
});

// ── 11. RESEARCH BACKTEST LEAKAGE AUDIT ─────────────────────────────────────
it('Research Backtest: Verifies zero lookahead leakage across comparative strategies', () => {
  const backtestMod = require(path.join(ROOT, 'research/newsBacktestEngine.js'));
  const engine = backtestMod.newsBacktestEngine;

  const resClean = engine.runComparativeBacktest([
    { id: 'A1', publishedAt: '2026-09-01T09:15:00Z' },
    { id: 'A2', publishedAt: '2026-09-02T09:15:00Z' }
  ]);

  assert.strictEqual(resClean.leakageCheckStatus, 'PASSED_ZERO_LEAKAGE', 'Clean chronological feed must pass leakage audit');
  assert(resClean.strategies.pricePlusNews.sharpeRatio > resClean.strategies.priceOnly.sharpeRatio, 'Price + News must outperform Price-Only');

  // Test failure detection when future data is present
  const resLeaked = engine.runComparativeBacktest([
    { id: 'A1', publishedAt: '2026-09-01T09:15:00Z' },
    { id: 'A2', publishedAt: '2026-09-02T09:15:00Z', futureLeakageTestFlag: true }
  ]);

  assert.strictEqual(resLeaked.leakageCheckStatus, 'FAILED_LOOKAHEAD_DETECTED', 'Must fail when future information flag is active');
});

// ── 12. END-TO-END PIPELINE TRACEABILITY ────────────────────────────────────
it('End-to-End Pipeline: Traces raw Alpha Vantage article to terminal-ready intelligence', async () => {
  const normMod = require(path.join(ROOT, 'newsNormalizationEngine.js')).newsNormalizationEngine;
  const entityMod = require(path.join(ROOT, 'newsEntityResolver.js')).newsEntityResolver;
  const classMod = require(path.join(ROOT, 'newsEventClassifier.js')).newsEventClassifier;
  const matMod = require(path.join(ROOT, 'newsMaterialityEngine.js')).newsMaterialityEngine;
  const novMod = require(path.join(ROOT, 'newsNoveltyEngine.js')).newsNoveltyEngine;
  const impMod = require(path.join(ROOT, 'historicalEventImpactEngine.js')).historicalEventImpactEngine;
  const reactMod = require(path.join(ROOT, 'newsMarketReactionEngine.js')).newsMarketReactionEngine;
  const attrMod = require(path.join(ROOT, 'newsPriceAttribution.js')).newsPriceAttribution;
  const sigMod = require(path.join(ROOT, 'newsSignalEngine.js')).newsSignalEngine;

  const rawAlphaVantageArticle = {
    title: "Reliance Industries Q3 Net Profit Surges 12% YoY on Robust Jio ARPU and Retail Expansion",
    source: "Economic Times",
    url: "https://economictimes.indiatimes.com/markets/reliance-results",
    time_published: "20260921T063000",
    summary: "RIL posts all-time high quarterly EBITDA, beating consensus estimates with margin expansion in digital services.",
    overall_sentiment_score: 0.82,
    overall_sentiment_label: "Bullish",
    ticker_sentiment: [
      { ticker: "RELIANCE.BSE", relevance_score: "0.980000", ticker_sentiment_score: "0.850000", ticker_sentiment_label: "Bullish" }
    ]
  };

  // Step 1: Normalization
  let item = normMod.normalizeArticle(rawAlphaVantageArticle);
  assert(item.id && item.publishedAt, 'Step 1 Normalization failed');

  // Step 2: Entity Resolution
  item = entityMod.enrichArticleEntities(item);
  assert.strictEqual(item.primaryEntity?.canonicalSymbol, 'RELIANCE', 'Step 2 Entity Resolution failed');

  // Step 3: Event Classification
  item = classMod.enrichArticle(item);
  assert.strictEqual(item.eventType, 'EARNINGS_SURPRISE', 'Step 3 Event Classification failed');

  // Step 4: Materiality
  item = matMod.enrichArticle(item);
  assert(item.materialityScore >= 80, 'Step 4 Materiality failed');

  // Step 5: Novelty
  item = novMod.enrichArticle(item);
  assert(item.noveltyScore > 0, 'Step 5 Novelty failed');

  // Step 6: Historical Event Impact
  item = impMod.enrichArticle(item);
  assert(item.historicalImpact?.horizons['1d'], 'Step 6 Historical Impact failed');

  // Step 7: Market Reaction & Confirmation
  item = reactMod.enrichArticle(item, { priceChangePct: 2.1, rvol: 3.2 });
  assert.strictEqual(item.marketConfirmation, 'STRONG', 'Step 7 Market Reaction failed');

  // Step 8: Price Attribution
  item = attrMod.enrichArticle(item);
  assert(item.priceAttribution?.abnormalReturnPct !== undefined, 'Step 8 Price Attribution failed');

  // Step 9: News Alpha & Signal Generation
  item = sigMod.enrichArticle(item);
  assert(item.newsAlpha > 50, 'Step 9 News Alpha failed');
  assert.strictEqual(item.tradeDecision, 'ELIGIBLE_FOR_ORDER', 'Step 9 Trade Decision failed');
  assert(item.signalExplanation?.why, 'Step 9 Explanation failed');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TOTAL NEWS INTELLIGENCE TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
