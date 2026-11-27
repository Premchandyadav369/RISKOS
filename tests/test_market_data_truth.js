/**
 * Test Suite for RISKOS Market Data Truth & Exchange Calendars
 */
const assert = require('assert');
const path = require('path');
const MarketDataTruth = require('../marketDataTruth.js');

console.log('=== Running MarketDataTruth Test Suite ===');

let testsPassed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

// 1. Basic Structure & Module Export
runTest('MarketDataTruth exports required API methods', () => {
  assert.strictEqual(typeof MarketDataTruth.getExchangeStatus, 'function');
  assert.strictEqual(typeof MarketDataTruth.getProvenanceContract, 'function');
  assert.strictEqual(typeof MarketDataTruth.isTickSimulationPermitted, 'function');
  assert.strictEqual(typeof MarketDataTruth.getAllMarketSummaries, 'function');
});

// 2. Exchange Status Evaluation
runTest('NSE status evaluation contains required contract properties', () => {
  const status = MarketDataTruth.getExchangeStatus('NSE');
  assert(status.exchange === 'NSE');
  assert(typeof status.isOpen === 'boolean');
  assert(typeof status.sessionPhase === 'string');
  assert(typeof status.statusLabel === 'string');
  assert(typeof status.lastCloseTimestamp === 'string');
  assert(typeof status.color === 'string');
  assert(status.region === 'India');
  assert(status.currency === 'INR');
});

runTest('NASDAQ status evaluation contains required contract properties', () => {
  const status = MarketDataTruth.getExchangeStatus('NASDAQ');
  assert(status.exchange === 'NASDAQ');
  assert(typeof status.isOpen === 'boolean');
  assert(status.region === 'United States');
  assert(status.currency === 'USD');
});

runTest('CRYPTO operates 24/7 continuous trading', () => {
  const status = MarketDataTruth.getExchangeStatus('CRYPTO');
  assert.strictEqual(status.isOpen, true);
  assert.strictEqual(status.sessionPhase, 'REGULAR');
  assert(status.statusLabel.includes('24/7') || status.statusLabel === 'OPEN');
});

// 3. Provenance Contract Verification
runTest('Provenance contract version is 2.0-PROD with valid quality score', () => {
  const prov = MarketDataTruth.getProvenanceContract('RELIANCE');
  assert.strictEqual(prov.contractVersion, '2.0-PROD');
  assert.strictEqual(prov.symbol, 'RELIANCE');
  assert(prov.dataQualityScore >= 0.95);
  assert(typeof prov.latencyMs === 'number');
  assert(typeof prov.disclaimer === 'string');
});

// 4. Tick Simulation Suppression Outside Market Hours
runTest('isTickSimulationPermitted reflects real exchange state', () => {
  const nseStatus = MarketDataTruth.getExchangeStatus('NSE');
  const permitted = MarketDataTruth.isTickSimulationPermitted('NSE');
  assert.strictEqual(permitted, nseStatus.isOpen);
});

// 5. Multi-Market Summaries
runTest('getAllMarketSummaries returns all active venues', () => {
  const summaries = MarketDataTruth.getAllMarketSummaries();
  assert(Array.isArray(summaries));
  assert(summaries.length >= 4); // NSE, BSE, NYSE, NASDAQ, MCX, CRYPTO
  const nse = summaries.find(s => s.exchange === 'NSE');
  assert(nse !== undefined);
});

console.log(`All ${testsPassed} MarketDataTruth tests passed successfully!
`);
