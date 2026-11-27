/**
 * RISKOS Sovereign Macro & Cross-Asset Telemetry Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Test: tests/test_macro_data_feed.js
 * 
 * Validates:
 *   1. MacroDataFeedEngine client and deterministic baseline snapshots
 *   2. FRED CSV parsing resilience (dates, missing values, dots)
 *   3. CoinGecko 24/7 crypto and EIA energy normalization
 *   4. Seamless injection into InstitutionalPricingEngine.macroEnvironment
 *   5. End-to-end revaluation of equities under live macro shocks
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const { 
  MacroDataFeedEngine, 
  MacroDataFeedClient, 
  BASELINE_SNAPSHOT 
} = require('../src/core/macroDataFeedEngine.js');
const { InstitutionalPricingEngine } = require('../src/quant/institutionalPricingEngine.js');

console.log('================================================================');
console.log('  RUNNING RISKOS MACRO & CROSS-ASSET TELEMETRY TEST SUITE');
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
  // 1. Client Architecture & Baseline Snapshots
  console.log('--- 1. Client Architecture & Baseline Snapshot Verification ---');
  runTest('MacroDataFeedEngine exports valid class and baseline snapshot', () => {
    assert.ok(MacroDataFeedClient, 'MacroDataFeedClient must be defined');
    assert.ok(BASELINE_SNAPSHOT, 'BASELINE_SNAPSHOT must be exported');
    
    // FRED metrics
    assert.strictEqual(typeof BASELINE_SNAPSHOT.fred.realYield10Y, 'number', 'FRED real yield must be number');
    assert.strictEqual(typeof BASELINE_SNAPSHOT.fred.yieldCurveSlope10Y2Y, 'number', 'Yield curve slope must be number');
    assert.strictEqual(typeof BASELINE_SNAPSHOT.fred.highYieldOas, 'number', 'HY OAS must be number');
    assert.ok(BASELINE_SNAPSHOT.fred.realYield10Y > 0, 'Real yield must be positive in current regime');

    // EIA metrics
    assert.strictEqual(typeof BASELINE_SNAPSHOT.eia.brentCrudeUsd, 'number', 'Brent crude must be number');
    assert.ok(BASELINE_SNAPSHOT.eia.brentCrudeUsd > 50, 'Brent crude spot must be realistic (> $50)');
    assert.strictEqual(typeof BASELINE_SNAPSHOT.eia.brentDeltaPct, 'number', 'Brent delta % must be number');

    // CoinGecko metrics
    assert.ok(BASELINE_SNAPSHOT.coingecko.bitcoin, 'Bitcoin telemetry must be defined');
    assert.ok(BASELINE_SNAPSHOT.coingecko.ethereum, 'Ethereum telemetry must be defined');
    assert.ok(BASELINE_SNAPSHOT.coingecko.bitcoin.usd > 10000, 'Bitcoin price must be > $10k');
  });

  // 2. FRED CSV Parser Unit Tests
  console.log('\n--- 2. FRED CSV Parsing Resilience ---');
  runTest('parseFredCsv handles standard observations and trailing dots/nulls', () => {
    const client = new MacroDataFeedClient();

    const sampleCsv = `DATE,DFII10
2026-11-18,2.75
2026-11-19,2.76
2026-11-20,2.77
2026-11-21,.
`;
    const parsed = client.parseFredCsv(sampleCsv);
    assert.ok(parsed, 'Must successfully parse valid line');
    assert.strictEqual(parsed.date, '2026-11-20', 'Must ignore trailing dot (.) and return last valid date');
    assert.strictEqual(parsed.value, 2.77, 'Must parse valid float 2.77');

    // Malformed inputs
    assert.strictEqual(client.parseFredCsv(''), null, 'Empty string returns null');
    assert.strictEqual(client.parseFredCsv(null), null, 'Null returns null');
  });

  // 3. Live or Fallback Telemetry Ingestion
  console.log('\n--- 3. Multi-Asset Telemetry Acquisition (FRED + EIA + CoinGecko) ---');
  await runAsyncTest('fetchAllTelemetry returns structured macro, energy, and crypto telemetry', async () => {
    const client = new MacroDataFeedClient({ timeoutMs: 6000 });
    const telemetry = await client.fetchAllTelemetry(false);

    assert.ok(telemetry.timestamp, 'Timestamp must be present');
    assert.ok(telemetry.fred, 'FRED data must be present');
    assert.ok(telemetry.eia, 'EIA data must be present');
    assert.ok(telemetry.coingecko, 'CoinGecko data must be present');

    assert.ok(telemetry.fred.realYield10Y > 0, 'Real yield must be > 0');
    assert.ok(telemetry.eia.brentCrudeUsd > 0, 'Brent crude price must be > 0');
    assert.ok(telemetry.coingecko.bitcoin.usd > 0, 'Bitcoin USD price must be > 0');
  });

  // 4. Institutional Pricing Engine Transmission
  console.log('\n--- 4. Macro Transmission into Sovereign 12-Factor Engine ---');
  runTest('injectIntoPricingEngine updates macroEnvironment with calibrated decimals', () => {
    const client = new MacroDataFeedClient();
    const pricingEngine = new InstitutionalPricingEngine();

    const initialRealYield = pricingEngine.macroEnvironment.realYieldUS;
    assert.strictEqual(typeof initialRealYield, 'number', 'Initial real yield must be a number');

    // Inject
    const updatedEnv = client.injectIntoPricingEngine(pricingEngine);
    assert.ok(updatedEnv, 'Must return updated macroEnvironment');
    assert.strictEqual(pricingEngine.macroEnvironment.realYieldUS, Number((client.cachedTelemetry.fred.realYield10Y / 100.0).toFixed(4)));
    assert.strictEqual(pricingEngine.macroEnvironment.yieldCurveSlopeUS, Number((client.cachedTelemetry.fred.yieldCurveSlope10Y2Y / 100.0).toFixed(4)));
    assert.strictEqual(pricingEngine.macroEnvironment.brentDeltaPct, Number((client.cachedTelemetry.eia.brentDeltaPct / 100.0).toFixed(4)));
  });

  // 5. Cross-Market Equity Pricing Revaluation
  console.log('\n--- 5. Cross-Market Equity Pricing Revaluation ---');
  runTest('Pricing engine evaluates US and Indian equities with live macro inputs', () => {
    const client = new MacroDataFeedClient();
    const pricingEngine = new InstitutionalPricingEngine();
    client.injectIntoPricingEngine(pricingEngine);

    const nvda = pricingEngine.evaluateSymbol('NVDA');
    assert.ok(nvda, 'NVDA evaluation must succeed');
    assert.strictEqual(typeof nvda.institutionalFairValue, 'number', 'Fair value must be number');
    assert.strictEqual(typeof nvda.alphaSpreadPct, 'number', 'Alpha spread must be number');
    assert.ok(nvda.factors.f1_macroRealYield, 'Real yield factor f1 must be present');
    assert.ok(nvda.factors.f12_commodityGeopolitical, 'Commodity factor f12 must be present');

    const reliance = pricingEngine.evaluateSymbol('RELIANCE');
    assert.ok(reliance, 'RELIANCE evaluation must succeed');
    assert.strictEqual(typeof reliance.institutionalFairValue, 'number', 'Fair value must be number');
    assert.ok(reliance.factors.f1_macroRealYield, 'Real yield factor f1 must be present for Indian equity');
    assert.ok(reliance.factors.f12_commodityGeopolitical, 'Commodity factor f12 must be present for Indian equity');
  });

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (passedTests === totalTests) {
    console.log('  VERDICT: ALL RISKOS MACRO TELEMETRY TESTS COMPLETED SUCCESSFULLY');
  } else {
    console.error('  VERDICT: FAILURES DETECTED IN TEST SUITE');
    process.exit(1);
  }
  console.log('================================================================\n');
}

executeSuite().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
