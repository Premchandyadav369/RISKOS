/**
 * RISKOS TEST SUITE: Daily Stock Alpha Recommender & Price Target Forecasting Engine
 * Tests client-side fallback synthesizer, pricing invariant guarantees, target horizon ordering,
 * Barra 8-factor vector validity, RRR bounds, HTML markup, and terminalBus mnemonics.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('🧪 RUNNING DAILY STOCK ALPHA RECOMMENDER & TARGET ENGINE TESTS...\n');

const { SecurityMaster } = require(path.join(rootDir, 'securityMaster.js'));

async function runTests() {
  console.log('1. Testing SecurityMaster.getDailyRecommendations (All Markets, All Styles)...');
  const allRes = await SecurityMaster.getDailyRecommendations('all', 12, 'all');
  assert(allRes, 'Response should be defined');
  assert(Array.isArray(allRes.recommendations), 'Recommendations should be an array');
  assert(allRes.recommendations.length > 0, 'Should return non-empty recommendations');
  console.log('   ✓ Returned ' + allRes.recommendations.length + ' recommendations');

  // Check pricing order invariant: P_stop < P_spot < T1 <= T2 <= T3
  for (const rec of allRes.recommendations) {
    const spot = rec.current_price;
    const stop = rec.stop_loss.price;
    const t1 = rec.predicted_targets.t1_tactical.price;
    const t2 = rec.predicted_targets.t2_swing.price;
    const t3 = rec.predicted_targets.t3_macro.price;

    assert(stop < spot, 'Stop loss (' + stop + ') must be below spot (' + spot + ') for ' + rec.ticker);
    assert(spot < t1, 'T1 target (' + t1 + ') must be above spot (' + spot + ') for ' + rec.ticker);
    assert(t1 <= t2, 'T2 target (' + t2 + ') must be >= T1 (' + t1 + ') for ' + rec.ticker);
    assert(t2 <= t3, 'T3 target (' + t3 + ') must be >= T2 (' + t2 + ') for ' + rec.ticker);

    assert(rec.risk_reward_ratio >= 1.8, 'RRR (' + rec.risk_reward_ratio + ') must be >= 1.8x for ' + rec.ticker);
    assert(rec.projected_rvol_multiplier >= 1.5, 'RVOL (' + rec.projected_rvol_multiplier + ') must be >= 1.5x for ' + rec.ticker);

    const barra = rec.barra_factor_profile;
    assert(barra, 'Barra profile missing for ' + rec.ticker);
    const expectedFactors = ['Value', 'Momentum', 'Quality', 'Volatility', 'Liquidity', 'Size', 'Growth', 'Dividend'];
    for (const factor of expectedFactors) {
      assert(typeof barra[factor] === 'number' && !isNaN(barra[factor]), 'Barra factor ' + factor + ' must be a number');
    }

    assert(rec.recommended_fleet_bot && rec.recommended_fleet_bot.id, 'Fleet bot mapping missing for ' + rec.ticker);
  }
  console.log('   ✓ Invariant P_stop < P_spot < T1 <= T2 <= T3 satisfied for all stocks');
  console.log('   ✓ Guaranteed RRR >= 1.8x satisfied for all stocks');
  console.log('   ✓ Projected RVOL >= 1.5x satisfied for all stocks');
  console.log('   ✓ Complete Barra 8-factor vectors validated');

  console.log('\n2. Testing Market Filtering...');
  const nseRes = await SecurityMaster.getDailyRecommendations('nse', 6, 'all');
  assert(nseRes.recommendations.every(r => r.country === 'IN' || r.currency === 'INR'), 'NSE filter must only return Indian equities');
  console.log('   ✓ NSE filter passed (' + nseRes.recommendations.length + ' items)');

  const usRes = await SecurityMaster.getDailyRecommendations('us', 6, 'all');
  assert(usRes.recommendations.every(r => r.country === 'US' || r.currency === 'USD'), 'US filter must only return US equities');
  console.log('   ✓ US filter passed (' + usRes.recommendations.length + ' items)');

  console.log('\n3. Testing Strategy Style Filtering...');
  const tsmomRes = await SecurityMaster.getDailyRecommendations('all', 6, 'tsmom');
  assert(tsmomRes.recommendations.every(r => r.recommender_style.toLowerCase().includes('tsmom')), 'Style filter tsmom must match');
  console.log('   ✓ TSMOM filter passed (' + tsmomRes.recommendations.length + ' items)');

  console.log('\n4. Verifying ticker.html Markup...');
  const tickerHtml = fs.readFileSync(path.join(rootDir, 'ticker.html'), 'utf8');
  assert(tickerHtml.includes('id="dailyRecommenderDesk"'), 'ticker.html must have dailyRecommenderDesk section');
  assert(tickerHtml.includes('id="recommenderCardsGrid"'), 'ticker.html must have recommenderCardsGrid');
  assert(tickerHtml.includes('id="recMarketFilter"'), 'ticker.html must have recMarketFilter');
  assert(tickerHtml.includes('id="recStyleFilter"'), 'ticker.html must have recStyleFilter');
  assert(tickerHtml.includes('id="btnRefreshRecommendations"'), 'ticker.html must have btnRefreshRecommendations');
  assert(tickerHtml.includes('id="recFormulaTarget"'), 'ticker.html must have KaTeX target formula element');
  assert(tickerHtml.includes('id="recFormulaRrr"'), 'ticker.html must have KaTeX RRR formula element');
  console.log('   ✓ ticker.html contains all required UI elements and KaTeX containers');

  console.log('\n5. Verifying ticker.css Styles...');
  const tickerCss = fs.readFileSync(path.join(rootDir, 'ticker.css'), 'utf8');
  assert(tickerCss.includes('.daily-recommender-desk'), 'ticker.css must style .daily-recommender-desk');
  assert(tickerCss.includes('.recommender-cards-grid'), 'ticker.css must style .recommender-cards-grid');
  assert(tickerCss.includes('.rec-card'), 'ticker.css must style .rec-card');
  assert(tickerCss.includes('.rec-targets-grid'), 'ticker.css must style .rec-targets-grid');
  assert(tickerCss.includes('.rec-actions-grid'), 'ticker.css must style .rec-actions-grid');
  console.log('   ✓ ticker.css contains complete institutional styling rules');

  console.log('\n6. Verifying terminalBus.js Mnemonics...');
  const terminalBusJs = fs.readFileSync(path.join(rootDir, 'terminalBus.js'), 'utf8');
  const requiredMnemonics = ['REC', 'BUYS', 'TARGETS', 'ALPHA', 'NSE-BUYS', 'US-BUYS'];
  for (const m of requiredMnemonics) {
    assert(terminalBusJs.includes("cmd: '" + m + "'"), 'terminalBus.js must include mnemonic ' + m);
  }
  console.log('   ✓ All 6 new Bloomberg terminal mnemonics verified in terminalBus.js');

  console.log('\n🎉 ALL DAILY STOCK ALPHA RECOMMENDER SYSTEM TESTS PASSED (100% SUCCESS)!\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
