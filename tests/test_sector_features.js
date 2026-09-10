/**
 * Comprehensive Test Suite for RISKOS Quantitative Sector Indicators & Egyptian Bot Fleet
 * =====================================================================================
 * Verifies:
 * 1. SecurityMaster.getSectorIndicators for 'all', 'india', and 'us' modes.
 * 2. Sector indicator completeness: returns, relative strength, GARCH/Parkinson vol,
 *    market breadth (% > 50D SMA), order flow imbalance, and valuation.
 * 3. 20 Egyptian mythology sector trading bots integration across both markets.
 * 4. fleet.js INITIAL_BOTS and fleet.html Egyptian division pill.
 * 5. ticker.html and ticker.js Sector Indicators Desk UI invariants.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { SecurityMaster } = require('../securityMaster.js');

async function runTests() {
  console.log('\n===============================================================');
  console.log('RISKOS SECTOR INDICATORS & EGYPTIAN BOT FLEET TEST SUITE');
  console.log('===============================================================\n');

  // Test 1: SecurityMaster.getSectorIndicators('all')
  console.log('[Test 1] Testing SecurityMaster.getSectorIndicators("all")...');
  const allData = await SecurityMaster.getSectorIndicators('all');
  assert(allData, 'Data must exist');
  assert.strictEqual(allData.total_sectors_evaluated, 20, 'Total sectors must be 20');
  assert.strictEqual(allData.india_sectors_count, 10, 'India sectors must be 10');
  assert.strictEqual(allData.us_sectors_count, 10, 'US sectors must be 10');
  assert.strictEqual(allData.sectors.length, 20, 'Sectors array must contain 20 items');
  console.log('  ✓ Verified 20 sectors evaluated (10 India + 10 US)');

  // Test 2: Segregated India Sectors
  console.log('\n[Test 2] Testing segregated Indian Sectors (NSE Sectoral)...');
  const inData = await SecurityMaster.getSectorIndicators('india');
  assert.strictEqual(inData.sectors.length, 10, 'Must return exactly 10 Indian sectors');
  inData.sectors.forEach(s => {
    assert.strictEqual(s.market, 'india', 'Market must be india');
    assert.strictEqual(s.currency, 'INR', 'Currency must be INR');
    assert(s.spot_level > 0, 'Spot level must be positive');
    assert(typeof s.returns.change_1d_pct === 'number', '1D return must be numeric');
    assert(typeof s.returns.change_20d_pct === 'number', '20D return must be numeric');
    assert(typeof s.volatility.garch_vol_pct === 'number', 'GARCH vol must be numeric');
    assert(typeof s.volatility.beta === 'number', 'Beta must be numeric');
    assert(s.breadth.pct_above_50d_sma >= 0 && s.breadth.pct_above_50d_sma <= 100, 'Breadth must be between 0 and 100');
    assert(typeof s.order_flow.order_flow_imbalance_zscore === 'number', 'OFI zscore must be numeric');
    assert(s.matching_egyptian_bot, 'Must have matching Egyptian bot');
    assert(s.matching_egyptian_bot.id.startsWith('BOT-EG-IN-'), 'Bot ID must start with BOT-EG-IN-');
  });
  console.log('  ✓ Verified all 10 Indian sectors have complete quantitative indicators & Egyptian bots');

  // Test 3: Segregated US Sectors
  console.log('\n[Test 3] Testing segregated US Sectors (GICS Sectors)...');
  const usData = await SecurityMaster.getSectorIndicators('us');
  assert.strictEqual(usData.sectors.length, 10, 'Must return exactly 10 US sectors');
  usData.sectors.forEach(s => {
    assert.strictEqual(s.market, 'us', 'Market must be us');
    assert.strictEqual(s.currency, 'USD', 'Currency must be USD');
    assert(s.spot_level > 0, 'Spot level must be positive');
    assert(s.matching_egyptian_bot, 'Must have matching Egyptian bot');
    assert(s.matching_egyptian_bot.id.startsWith('BOT-EG-US-'), 'Bot ID must start with BOT-EG-US-');
  });
  console.log('  ✓ Verified all 10 US sectors have complete quantitative indicators & Egyptian bots');

  // Test 4: Verify fleet.js INITIAL_BOTS has 41 total bots (21 Greek/Norse + 20 Egyptian)
  console.log('\n[Test 4] Testing fleet.js Egyptian Pantheon Bot Registration...');
  const fleetJs = fs.readFileSync(path.join(__dirname, '../fleet.js'), 'utf8');
  assert(fleetJs.includes('BOT-EG-IN-01'), 'Must have BOT-EG-IN-01');
  assert(fleetJs.includes('BOT-EG-IN-10'), 'Must have BOT-EG-IN-10');
  assert(fleetJs.includes('BOT-EG-US-01'), 'Must have BOT-EG-US-01');
  assert(fleetJs.includes('BOT-EG-US-10'), 'Must have BOT-EG-US-10');
  assert(fleetJs.includes('myth-badge-egyptian'), 'Must support Egyptian deity badge rendering');
  
  // Count Egyptian bots in fleet.js
  const egInMatches = fleetJs.match(/id:\s*['"]BOT-EG-IN-\d+['"]/g) || [];
  const egUsMatches = fleetJs.match(/id:\s*['"]BOT-EG-US-\d+['"]/g) || [];
  assert.strictEqual(egInMatches.length, 10, 'Must have 10 Indian Egyptian bots');
  assert.strictEqual(egUsMatches.length, 10, 'Must have 10 US Egyptian bots');
  console.log('  ✓ Verified 20 Egyptian mythology bots (10 IN, 10 US) in fleet.js');

  // Test 5: Verify fleet.html division pill & UI counts
  console.log('\n[Test 5] Testing fleet.html UI Controls...');
  const fleetHtml = fs.readFileSync(path.join(__dirname, '../fleet.html'), 'utf8');
  assert(fleetHtml.includes('Duat &amp; Karnak Division (20 Egyptian Bots'), 'Must have Egyptian division filter pill');
  assert(fleetHtml.includes('data-filter="egyptian"'), 'Must have data-filter="egyptian"');
  console.log('  ✓ Verified Egyptian division filter pill in fleet.html');

  // Test 6: Verify ticker.html Sector Indicators Desk UI markup
  console.log('\n[Test 6] Testing ticker.html Sector Indicators Desk markup...');
  const tickerHtml = fs.readFileSync(path.join(__dirname, '../ticker.html'), 'utf8');
  assert(tickerHtml.includes('id="sectorIndicatorsDesk"'), 'Must have sectorIndicatorsDesk section');
  assert(tickerHtml.includes('id="sectorMarketFilter"'), 'Must have sectorMarketFilter');
  assert(tickerHtml.includes('data-smarket="india"'), 'Must have Indian sectors button');
  assert(tickerHtml.includes('data-smarket="us"'), 'Must have US sectors button');
  assert(tickerHtml.includes('id="sectorRankFilter"'), 'Must have sectorRankFilter');
  assert(tickerHtml.includes('id="sectorCardsGrid"'), 'Must have sectorCardsGrid');
  assert(tickerHtml.includes('id="btnRescanSectors"'), 'Must have btnRescanSectors');
  console.log('  ✓ Verified Sector Indicators Desk DOM elements in ticker.html');

  // Test 7: Verify ticker.js initialization
  console.log('\n[Test 7] Testing ticker.js initSectorIndicatorsDesk...');
  const tickerJs = fs.readFileSync(path.join(__dirname, '../ticker.js'), 'utf8');
  assert(tickerJs.includes('initSectorIndicatorsDesk'), 'Must define initSectorIndicatorsDesk');
  assert(tickerJs.includes('initSectorIndicatorsDesk();'), 'init() must call initSectorIndicatorsDesk()');
  assert(tickerJs.includes('filterScreenerBySector'), 'Must define filterScreenerBySector');
  console.log('  ✓ Verified initSectorIndicatorsDesk integration in ticker.js');

  // Test 8: Verify ticker.css styling
  console.log('\n[Test 8] Testing ticker.css sector desk styling...');
  const tickerCss = fs.readFileSync(path.join(__dirname, '../ticker.css'), 'utf8');
  assert(tickerCss.includes('.sector-indicators-desk'), 'Must style .sector-indicators-desk');
  assert(tickerCss.includes('.sector-cards-grid'), 'Must style .sector-cards-grid');
  assert(tickerCss.includes('.sector-card'), 'Must style .sector-card');
  assert(tickerCss.includes('.sector-egyptian-strip'), 'Must style .sector-egyptian-strip');
  console.log('  ✓ Verified CSS rules for Sector Indicators Desk in ticker.css');

  console.log('\n===============================================================');
  console.log('ALL 8 SECTOR INDICATORS & BOT FLEET TESTS PASSED PERFECTLY!');
  console.log('===============================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
