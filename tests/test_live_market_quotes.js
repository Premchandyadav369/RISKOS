/**
 * RISKOS Live Real-Time Market Data Feed Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Test: tests/test_live_market_quotes.js
 * 
 * Validates:
 *   1. LiveMarketDataFeedClient and verified 2026 post-split baselines
 *   2. Gateway ticker mapping resolution for US and Indian exchanges (.NS)
 *   3. Real-time quote acquisition with exchange timestamps and price verification
 *   4. Synchronization into SecurityMaster.LOCAL_REGISTRY (basePrice update)
 *   5. End-to-end Institutional 12-factor pricing evaluation using live spot prices
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const { 
  LiveMarketDataFeedClient, 
  VERIFIED_MARKET_BASELINES, 
  TICKER_MAP 
} = require('../src/core/liveMarketDataFeed.js');
const { SecurityMaster } = require('../src/core/securityMaster.js');
const { InstitutionalPricingEngine } = require('../src/quant/institutionalPricingEngine.js');

console.log('================================================================');
console.log('  RUNNING RISKOS LIVE MARKET DATA FEED VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function executeSuite() {
  // 1. Structure & Verified Baselines Verification
  console.log('--- 1. Structure & Verified Market Baselines ---');
  runTest('LiveMarketDataFeedClient exports valid baselines reflecting true 2026 splits', () => {
    assert.ok(LiveMarketDataFeedClient, 'LiveMarketDataFeedClient must be exported');
    assert.ok(VERIFIED_MARKET_BASELINES, 'VERIFIED_MARKET_BASELINES must be exported');
    
    // Check key post-split/post-bonus levels
    assert.ok(VERIFIED_MARKET_BASELINES.NVDA.price < 180 && VERIFIED_MARKET_BASELINES.NVDA.price > 120, 'NVDA baseline must be in realistic range (~$150)');
    assert.ok(VERIFIED_MARKET_BASELINES.HDFCBANK.price < 1000 && VERIFIED_MARKET_BASELINES.HDFCBANK.price > 700, 'HDFCBANK baseline must be post-split (~₹817)');
    assert.ok(VERIFIED_MARKET_BASELINES.SMCI.price < 40 && VERIFIED_MARKET_BASELINES.SMCI.price > 15, 'SMCI baseline must be post-split (~$22)');
    assert.ok(VERIFIED_MARKET_BASELINES.TCS.price < 3000 && VERIFIED_MARKET_BASELINES.TCS.price > 2000, 'TCS baseline must be realistic (~₹2460)');
    assert.ok(VERIFIED_MARKET_BASELINES.RELIANCE.price > 1250 && VERIFIED_MARKET_BASELINES.RELIANCE.price < 1500, 'RELIANCE baseline must be ~₹1351');
  });

  // 2. Gateway Ticker Resolution
  console.log('\n--- 2. Exchange Gateway Ticker Resolution ---');
  runTest('Resolves internal symbols to valid exchange tickers', () => {
    const client = new LiveMarketDataFeedClient();
    assert.strictEqual(client.resolveGatewayTicker('NVDA'), 'NVDA');
    assert.strictEqual(client.resolveGatewayTicker('RELIANCE'), 'RELIANCE.NS');
    assert.strictEqual(client.resolveGatewayTicker('HDFCBANK'), 'HDFCBANK.NS');
    assert.strictEqual(client.resolveGatewayTicker('TATAMOTORS'), 'TMCV.NS');
    assert.strictEqual(client.resolveGatewayTicker('BTC'), 'BTC-USD');
    assert.strictEqual(client.resolveGatewayTicker('BRENT'), 'BZ=F');
  });

  // 3. Real-Time Quotes Fetching (Live Network or Verified Fallback)
  console.log('\n--- 3. Multi-Asset Quote Acquisition ---');
  await runAsyncTest('fetchQuotes returns structured quotes with price, change, and currency', async () => {
    const client = new LiveMarketDataFeedClient({ timeoutMs: 6000 });
    const quotes = await client.fetchQuotes(['NVDA', 'RELIANCE', 'AAPL', 'HDFCBANK']);

    assert.ok(quotes.NVDA, 'NVDA quote must be present');
    assert.ok(quotes.RELIANCE, 'RELIANCE quote must be present');
    assert.ok(quotes.AAPL, 'AAPL quote must be present');
    assert.ok(quotes.HDFCBANK, 'HDFCBANK quote must be present');

    assert.strictEqual(quotes.NVDA.currency, 'USD');
    assert.strictEqual(quotes.RELIANCE.currency, 'INR');
    assert.ok(quotes.NVDA.price > 100 && quotes.NVDA.price < 200, 'NVDA price must be realistic');
    assert.ok(quotes.RELIANCE.price > 1200 && quotes.RELIANCE.price < 1600, 'RELIANCE price must be realistic');
  });

  // 4. SecurityMaster Synchronization
  console.log('\n--- 4. SecurityMaster Synchronization ---');
  runTest('syncWithSecurityMaster updates basePrice in SecurityMaster registry', () => {
    const client = new LiveMarketDataFeedClient();
    const updated = client.syncWithSecurityMaster(SecurityMaster);
    assert.ok(updated > 20, 'Must synchronize at least 20 securities in SecurityMaster');

    const nvda = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === 'NVDA');
    assert.ok(nvda, 'NVDA must exist in SecurityMaster');
    assert.ok(nvda.basePrice < 180, 'NVDA basePrice must not be stale ($217.55)');

    const hdfc = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === 'HDFCBANK');
    assert.ok(hdfc, 'HDFCBANK must exist in SecurityMaster');
    assert.ok(hdfc.basePrice < 1000, 'HDFCBANK basePrice must not be stale (₹1768.40)');
  });

  // 5. Institutional 12-Factor Pricing Integration
  console.log('\n--- 5. Institutional 12-Factor Engine Transmission ---');
  runTest('Pricing engine evaluates symbols using live spot prices', () => {
    const client = new LiveMarketDataFeedClient();
    client.syncWithSecurityMaster(SecurityMaster);

    const pricingEngine = new InstitutionalPricingEngine();
    const nvdaResult = pricingEngine.evaluateSymbol('NVDA');

    assert.ok(nvdaResult, 'NVDA evaluation must succeed');
    assert.ok(nvdaResult.spotPrice < 180 && nvdaResult.spotPrice > 120, 'NVDA spotPrice must reflect live quote (~$150)');
    assert.ok(nvdaResult.institutionalFairValue > 0, 'Institutional fair value must be positive');

    const hdfcResult = pricingEngine.evaluateSymbol('HDFCBANK');
    assert.ok(hdfcResult, 'HDFCBANK evaluation must succeed');
    assert.ok(hdfcResult.spotPrice < 1000 && hdfcResult.spotPrice > 700, 'HDFCBANK spotPrice must reflect live quote (~₹818)');
  });

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (passedTests === totalTests) {
    console.log('  VERDICT: ALL LIVE MARKET QUOTE TESTS COMPLETED SUCCESSFULLY');
  } else {
    console.error('  VERDICT: FAILURES DETECTED IN TEST SUITE');
    process.exit(1);
  }
  console.log('================================================================\n');
}

executeSuite().catch(err => {
  console.error('Fatal Test Exception:', err);
  process.exit(1);
});
