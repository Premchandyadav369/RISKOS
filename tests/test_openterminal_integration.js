/**
 * Test Suite for RISKOS ErTasselli/OpenTerminal Integration
 * Validates:
 * 1. Stale-While-Revalidate (SWR) in-memory cache protocol & provider fallback chains
 * 2. Multi-tenor Sovereign Yield Curves (US Treasuries & Indian G-Sec) & Svensson parameters
 * 3. Institutional Economic Event Calendar
 * 4. Single-Stock News & Lexical Sentiment Stream
 * 5. UI Microstructure Polish: Tick-flash animations & Canvas multi-indicator Hover HUD
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MarketDataTruth = require('../marketDataTruth.js');
const { SecurityMaster } = require('../securityMaster.js');

console.log('=== Running OpenTerminal Integration Test Suite ===');

let testsPassed = 0;

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack || err.message}`);
    process.exit(1);
  }
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack || err.message}`);
    process.exit(1);
  }
}

(async () => {
  // ── 1. Data Layer & Resiliency (SWR & Fallback Chains) ─────────────────────
  runTest('MarketDataTruth exports SWR caching protocol methods and fallback chains', () => {
    assert.strictEqual(typeof MarketDataTruth.getWithSwr, 'function');
    assert.strictEqual(typeof MarketDataTruth.clearSwrCache, 'function');
    assert.strictEqual(typeof MarketDataTruth.getSwrCacheStats, 'function');
    assert(MarketDataTruth.PROVIDER_FALLBACK_CHAINS, 'PROVIDER_FALLBACK_CHAINS should be defined');
    assert(Array.isArray(MarketDataTruth.PROVIDER_FALLBACK_CHAINS.EQUITIES));
    assert(Array.isArray(MarketDataTruth.PROVIDER_FALLBACK_CHAINS.OPTIONS));
    assert(Array.isArray(MarketDataTruth.PROVIDER_FALLBACK_CHAINS.MACRO_YIELDS));
    assert(Array.isArray(MarketDataTruth.PROVIDER_FALLBACK_CHAINS.CALENDAR));
    assert(Array.isArray(MarketDataTruth.PROVIDER_FALLBACK_CHAINS.CRYPTO));
    assert(MarketDataTruth.PROVIDER_FALLBACK_CHAINS.EQUITIES.length >= 3);
  });

  await runAsyncTest('MarketDataTruth SWR cache: fresh hit and stale-while-revalidate', async () => {
    MarketDataTruth.clearSwrCache();
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { price: 100 + callCount };
    };

    // 1st call: fresh fetch
    const res1 = await MarketDataTruth.getWithSwr('test_key', 50, fetcher);
    assert.strictEqual(res1.price, 101);
    assert.strictEqual(res1._swr.cached, false);
    assert.strictEqual(callCount, 1);

    // 2nd call immediate: fresh cache hit
    const res2 = await MarketDataTruth.getWithSwr('test_key', 50, fetcher);
    assert.strictEqual(res2.price, 101);
    assert.strictEqual(res2._swr.cached, true);
    assert.strictEqual(res2._swr.stale, false);
    assert.strictEqual(callCount, 1);

    // Wait 60ms to expire TTL
    await new Promise(r => setTimeout(r, 60));

    // 3rd call: stale hit returned immediately, background revalidation triggered
    const res3 = await MarketDataTruth.getWithSwr('test_key', 50, fetcher);
    assert.strictEqual(res3.price, 101);
    assert.strictEqual(res3._swr.cached, true);
    assert.strictEqual(res3._swr.stale, true);

    // Wait 20ms for background revalidation promise to complete
    await new Promise(r => setTimeout(r, 20));
    assert.strictEqual(callCount, 2);

    const stats = MarketDataTruth.getSwrCacheStats();
    assert.strictEqual(stats.totalEntries, 1);
  });

  // ── 2. Sovereign Yield Curves & Svensson Parameters ─────────────────────────
  runTest('SecurityMaster.getSovereignYieldCurve returns valid US and Indian curves', () => {
    assert.strictEqual(typeof SecurityMaster.getSovereignYieldCurve, 'function');

    const usCurve = SecurityMaster.getSovereignYieldCurve('US');
    assert.strictEqual(usCurve.country, 'United States');
    assert.strictEqual(usCurve.currency, 'USD');
    assert.strictEqual(usCurve.tenors.length, 10);
    assert.strictEqual(usCurve.maturities.length, 10);
    assert.strictEqual(usCurve.yields.length, 10);
    assert.strictEqual(typeof usCurve.spread2_10_bps, 'number');
    assert.strictEqual(typeof usCurve.isInverted, 'boolean');
    assert(usCurve.svenssonParameters);
    assert(typeof usCurve.svenssonParameters.tau1 === 'number');
    assert(typeof usCurve.svenssonParameters.tau2 === 'number');

    const inCurve = SecurityMaster.getSovereignYieldCurve('IN');
    assert.strictEqual(inCurve.country, 'India');
    assert.strictEqual(inCurve.currency, 'INR');
    assert.strictEqual(inCurve.tenors.length, 10);
    assert(inCurve.spread2_10_bps >= 0);
    assert.strictEqual(inCurve.isInverted, false);
  });

  // ── 3. Institutional Economic Event Calendar ──────────────────────────────
  runTest('SecurityMaster.getEconomicCalendar returns high-impact releases', () => {
    assert.strictEqual(typeof SecurityMaster.getEconomicCalendar, 'function');

    const calendar = SecurityMaster.getEconomicCalendar();
    assert(Array.isArray(calendar));
    assert(calendar.length >= 6);

    const fomc = calendar.find(e => e.id === 'ev_fomc');
    assert(fomc, 'FOMC event should exist');
    assert.strictEqual(fomc.impact, 'HIGH');
    assert.strictEqual(fomc.actual, '5.25%');

    const rbi = calendar.find(e => e.id === 'ev_rbimpc');
    assert(rbi, 'RBI MPC event should exist');
    assert.strictEqual(rbi.country, 'IN');
    assert.strictEqual(rbi.actual, '6.50%');
  });

  // ── 4. Single-Stock News & Lexical Sentiment Stream ────────────────────────
  runTest('SecurityMaster.getTickerNews returns structured news and sentiment', () => {
    assert.strictEqual(typeof SecurityMaster.getTickerNews, 'function');

    const news = SecurityMaster.getTickerNews('RELIANCE');
    assert.strictEqual(news.symbol, 'RELIANCE');
    assert.strictEqual(typeof news.aggregateSentiment, 'number');
    assert(news.articles.length >= 4);
    assert(news.articles[0].headline);
    assert(news.articles[0].sentimentTag);
    assert(['BULLISH', 'NEUTRAL', 'BEARISH'].includes(news.articles[0].sentimentTag));
  });

  // ── 5. UI Microstructure & Styles Verification ─────────────────────────────
  runTest('themeEngine.css contains tick flash animations', () => {
    const cssContent = fs.readFileSync(path.join(__dirname, '../themeEngine.css'), 'utf8');
    assert(cssContent.includes('@keyframes tickFlashUp'));
    assert(cssContent.includes('@keyframes tickFlashDown'));
    assert(cssContent.includes('.tick-flash-up'));
    assert(cssContent.includes('.tick-flash-down'));
  });

  runTest('index.html contains chartHoverHud with multi-indicator display', () => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    assert(htmlContent.includes('id="chartHoverHud"'));
    assert(htmlContent.includes('id="hudSma"'));
    assert(htmlContent.includes('id="hudEma"'));
    assert(htmlContent.includes('id="hudVwap"'));
    assert(htmlContent.includes('id="hudBb"'));
    assert(htmlContent.includes('id="hudRsi"'));
  });

  runTest('observatory.html & observatory.js contain sovereign yield curve & calendar desk', () => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '../observatory.html'), 'utf8');
    assert(htmlContent.includes('id="obsSovereignYieldDesk"'));
    assert(htmlContent.includes('id="obsYieldCurveChart"'));
    assert(htmlContent.includes('id="obsEconomicCalendarTable"'));

    const jsContent = fs.readFileSync(path.join(__dirname, '../observatory.js'), 'utf8');
    assert(jsContent.includes('initSovereignYieldDesk'));
    assert(jsContent.includes('getSovereignYieldCurve'));
    assert(jsContent.includes('getEconomicCalendar'));
  });

  runTest('ticker.html & ticker.js contain news sentiment stream and feed initialization', () => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '../ticker.html'), 'utf8');
    assert(htmlContent.includes('id="tickerNewsCard"'));
    assert(htmlContent.includes('id="tickerNewsContainer"'));
    assert(htmlContent.includes('id="tickerSentimentBadge"'));

    const jsContent = fs.readFileSync(path.join(__dirname, '../ticker.js'), 'utf8');
    assert(jsContent.includes('initTickerNewsFeed'));
    assert(jsContent.includes('getTickerNews'));
  });

  console.log(`\nAll ${testsPassed} OpenTerminal integration checks passed successfully!`);
  process.exit(0);
})();
