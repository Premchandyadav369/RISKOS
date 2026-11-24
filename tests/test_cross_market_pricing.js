/**
 * RISKOS Universal Cross-Market Predictive Pricing Engine Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav
 * Tests: 100% empirical validation of cross-market pricing across India (NSE/BSE)
 * and US (NASDAQ/NYSE) stocks.
 *
 * Execution: node tests/test_cross_market_pricing.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const CrossMarketPricingEngine = require('../crossMarketPricingEngine.js');

console.log('================================================================');
console.log('  RISKOS CROSS-MARKET PREDICTIVE PRICING TEST SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. SINGLE ASSET PREDICTIVE PRICING AUDIT (INDIA & US)
// -----------------------------------------------------------------------------
console.log('--- 1. Individual Stock Prediction & Invariants ---');

it('Computes valid P.R.E.M. price predictions for Indian flagship (RELIANCE)', () => {
  const p = CrossMarketPricingEngine.predictSecurity('RELIANCE');
  assert.strictEqual(p.symbol, 'RELIANCE');
  assert.strictEqual(p.country, 'IN');
  assert.strictEqual(p.currency, 'INR');
  assert.strictEqual(p.currencySymbol, '₹');
  assert.ok(p.spotMid > 1000, `Expected Reliance spot > 1000, got ${p.spotMid}`);

  // Invariants
  assert.ok(p.predictions.target1d > 0, 'Target 1d must be positive');
  assert.ok(p.predictions.target5d > 0, 'Target 5d must be positive');
  assert.ok(p.predictions.target20d > 0, 'Target 20d must be positive');
  assert.ok(p.predictions.optimalBid < p.predictions.optimalAsk, 'Optimal bid must be strictly less than optimal ask');
  assert.ok(p.risk.var99_1d < p.risk.cvar99_1d, 'VaR must be strictly less than CVaR');
  assert.ok(p.signals.confidencePct >= 50 && p.signals.confidencePct <= 100, 'Confidence must be in [50, 100]');
});

it('Computes valid P.R.E.M. price predictions for US mega-cap titan (NVDA)', () => {
  const p = CrossMarketPricingEngine.predictSecurity('NVDA');
  assert.strictEqual(p.symbol, 'NVDA');
  assert.strictEqual(p.country, 'US');
  assert.strictEqual(p.currency, 'USD');
  assert.strictEqual(p.currencySymbol, '$');
  assert.ok(p.spotMid > 100, `Expected NVDA spot > 100, got ${p.spotMid}`);

  // Multi-day price trajectory
  assert.ok(p.predictions.target20d > 0, 'Target 20d must be positive');
  assert.ok(p.predictions.spreadBps > 0, 'Spread must be positive');
  assert.ok(p.microstructure.queueEntropy > 0 && p.microstructure.queueEntropy <= 1.0, 'Entropy must be in (0, 1]');
});

// -----------------------------------------------------------------------------
// 2. FULL CROSS-MARKET UNIVERSE AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 2. Full Universe (India & US) Aggregation ---');

it('Evaluates complete universe of >= 130 Indian and US equities', () => {
  const res = CrossMarketPricingEngine.predictUniverse();
  assert.ok(res.summary.totalStocksEvaluated >= 130, `Expected >= 130 stocks, got ${res.summary.totalStocksEvaluated}`);
  assert.ok(res.summary.indiaStocksCount >= 80, `Expected >= 80 Indian stocks, got ${res.summary.indiaStocksCount}`);
  assert.ok(res.summary.usStocksCount >= 40, `Expected >= 40 US stocks, got ${res.summary.usStocksCount}`);
  assert.ok(res.predictions.length === res.summary.totalStocksEvaluated);
});

it('Produces comprehensive sectoral breakdown covering Technology, Financials, and Energy', () => {
  const res = CrossMarketPricingEngine.predictUniverse();
  const sectors = res.sectorBreakdown.map(s => s.sector);
  assert.ok(sectors.some(s => s.toLowerCase().includes('information technology') || s.toLowerCase().includes('semiconductors')), 'Must include IT/Semis');
  assert.ok(sectors.some(s => s.toLowerCase().includes('banking') || s.toLowerCase().includes('financial')), 'Must include Financials');
  assert.ok(sectors.some(s => s.toLowerCase().includes('energy') || s.toLowerCase().includes('oil')), 'Must include Energy');
});

it('Extracts Top 10 Long opportunities for both India and US without error', () => {
  const res = CrossMarketPricingEngine.predictUniverse();
  assert.strictEqual(res.topIndiaLongs.length, 10, 'Must have Top 10 Indian Longs');
  assert.strictEqual(res.topUSLongs.length, 10, 'Must have Top 10 US Longs');

  // Verify descending alpha order
  for (let i = 0; i < res.topIndiaLongs.length - 1; i++) {
    assert.ok(res.topIndiaLongs[i].predictions.alphaBps >= res.topIndiaLongs[i + 1].predictions.alphaBps, 'India longs must be descending by alpha');
  }
  for (let i = 0; i < res.topUSLongs.length - 1; i++) {
    assert.ok(res.topUSLongs[i].predictions.alphaBps >= res.topUSLongs[i + 1].predictions.alphaBps, 'US longs must be descending by alpha');
  }
});

// -----------------------------------------------------------------------------
// 3. EXPORT & RUNNER VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. CSV Tear-Sheet & Runner Verification ---');

it('Generates valid CSV tear-sheet containing all quantitative headers', () => {
  const res = CrossMarketPricingEngine.predictUniverse();
  const csv = CrossMarketPricingEngine.generateCsvTearSheet(res);
  assert.ok(csv.includes('Symbol,Name,Country,Currency,Sector,SpotMid'));
  assert.ok(csv.includes('IsRealTime,Provider'));
  assert.ok(csv.includes('Target1d,Target5d,Target20d'));
  assert.ok(csv.includes('"RELIANCE"'));
  assert.ok(csv.includes('"NVDA"'));
  assert.ok(csv.includes('"AAPL"'));
});

it('scripts/run_cross_market_prem_pricing.js exists and exports predictions files', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'run_cross_market_prem_pricing.js');
  assert.ok(fs.existsSync(scriptPath), 'Runner script must exist');

  const jsonPath = path.join(__dirname, '..', 'cross_market_prem_pricing_predictions.json');
  const csvPath = path.join(__dirname, '..', 'cross_market_prem_predictions.csv');
  assert.ok(fs.existsSync(jsonPath), 'JSON predictions must exist');
  assert.ok(fs.existsSync(csvPath), 'CSV predictions must exist');
});

console.log('\n================================================================');
console.log(`  CROSS-MARKET PRICING RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
