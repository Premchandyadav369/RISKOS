#!/usr/bin/env node
/**
 * RISKOS Autonomous Real-Time Web Seer & Alternative Data Ingestion Runner
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Script: scripts/run_live_web_seer.js
 * 
 * Usage:
 *   node scripts/run_live_web_seer.js --all
 *   node scripts/run_live_web_seer.js --ticker NVDA
 *   node scripts/run_live_web_seer.js --replay
 *   node scripts/run_live_web_seer.js --export
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { WebSeerEngine, HISTORIC_REPLAY_SCENARIOS } = require('../webSeerEngine.js');

const engine = new WebSeerEngine();

// Parse Command Line Arguments
const args = process.argv.slice(2);
const isReplay = args.includes('--replay');
const isAll = args.includes('--all') || (!args.includes('--ticker') && !isReplay);
const tickerIndex = args.indexOf('--ticker');
const targetTicker = tickerIndex !== -1 && args[tickerIndex + 1] ? args[tickerIndex + 1].toUpperCase() : null;
const isExport = args.includes('--export');

function printBanner() {
  console.log('================================================================');
  console.log('  RISKOS P.R.E.M.-WEBSEER™ REAL-TIME ALTERNATIVE DATA RADAR');
  console.log('  Autonomous News Ingestion, Rumor Audit & Shock Crawler Daemon');
  console.log('================================================================\n');
}

function printAlertCard(alert, index) {
  const flag = alert.country === 'IN' ? '[IN]' : '[US]';
  const moveSign = alert.jumpPct > 0 ? '+' : '';
  const currSym = alert.currency === 'INR' ? 'Rs ' : '$';

  console.log(`[#${index + 1}] ${flag} ${alert.symbol} | ${alert.companyName}`);
  console.log(`     Headline:   "${alert.headline}"`);
  console.log(`     Source:     ${alert.sourceName} (Tier ${alert.sourceTier} | Credibility: ${(alert.sourceCredibility * 100).toFixed(0)}%)`);
  console.log(`     Audit:      ${alert.verificationState} (Rumor Index: ${(alert.rumorIndex * 100).toFixed(0)}%)`);
  console.log(`     Catalyst:   ${alert.catalystType} (Severity Mult: ${alert.catalystMultiplier}x | Polarity: ${alert.polarity > 0 ? '+1' : (alert.polarity < 0 ? '-1' : '0')})`);
  console.log(`     Jump Move:  ${moveSign}${alert.jumpPct.toFixed(2)}% | Spot: ${currSym}${alert.prePrice.toFixed(2)} -> Target: ${currSym}${alert.targetPrice.toFixed(2)}`);
  console.log(`     Dealer GEX: ${alert.dealerGexState} (Gamma Mult: ${alert.gammaMultiplier.toFixed(3)}x | Skew: ${alert.skewBooster.toFixed(4)})`);
  
  if (alert.contagion && alert.contagion.length > 0) {
    const topContagion = alert.contagion.slice(0, 3).map(c => `${c.targetSymbol} (${c.expectedMovePct > 0 ? '+' : ''}${c.expectedMovePct.toFixed(1)}%)`).join(', ');
    console.log(`     Contagion:  ${topContagion}`);
  }
  console.log('----------------------------------------------------------------');
}

async function runReplayScenarios() {
  console.log('--- REPLAYING HISTORIC BENCHMARK CORPORATE SHOCK SCENARIOS ---\n');
  const scenarios = engine.getReplayScenarios();
  const results = [];

  scenarios.forEach((sc, i) => {
    const alert = engine.replayScenario(sc.id);
    printAlertCard(alert, i);
    console.log(`     ACCURACY:   Model: ${alert.jumpPct}% vs Empirical Reality: ${alert.actualMovePct}% (Accuracy: ${alert.modelAccuracyPct}%)\n`);
    results.push(alert);
  });

  return results;
}

async function runLiveUniverseCrawl() {
  console.log('--- CRAWLING LIVE WIRE & RSS FEEDS ACROSS CROSS-MARKET UNIVERSE ---\n');

  const queries = targetTicker ? [
    { query: `${targetTicker} stock`, country: 'US', ticker: targetTicker }
  ] : [
    { query: 'NVIDIA stock', country: 'US', ticker: 'NVDA' },
    { query: 'Tesla stock autonomous', country: 'US', ticker: 'TSLA' },
    { query: 'Apple stock', country: 'US', ticker: 'AAPL' },
    { query: 'Microsoft Azure AI stock', country: 'US', ticker: 'MSFT' },
    { query: 'Reliance Industries stock', country: 'IN', ticker: 'RELIANCE' },
    { query: 'Tata Motors EV stock', country: 'IN', ticker: 'TATAMOTORS' },
    { query: 'HDFC Bank stock', country: 'IN', ticker: 'HDFCBANK' },
    { query: 'Adani Enterprises stock', country: 'IN', ticker: 'ADANIENT' }
  ];

  const startTime = Date.now();
  const allAlerts = [];

  for (const q of queries) {
    process.stdout.write(`Fetching ${q.country} feed for "${q.query}"... `);
    const googleNews = await engine.fetchGoogleNewsRss(q.query, { country: q.country, timeRange: '2d' });
    let yahooNews = [];
    if (q.ticker) {
      yahooNews = await engine.fetchYahooFinanceNews(q.ticker);
    }
    const combined = [...googleNews, ...yahooNews];
    console.log(`Found ${combined.length} relevant articles`);
    allAlerts.push(...combined);
  }

  const elapsed = Date.now() - startTime;
  console.log(`\nCrawl complete in ${elapsed} ms. Ingested ${allAlerts.length} total articles.`);

  const shocks = allAlerts.filter(a => Math.abs(a.jumpPct) >= 5.0);
  console.log(`Surfaced ${shocks.length} significant event shocks (|Jump| >= 5.0%):\n`);

  shocks.slice(0, 10).forEach((alert, i) => {
    printAlertCard(alert, i);
  });

  return allAlerts;
}

function exportData(alerts) {
  const jsonPath = path.join(__dirname, '../web_seer_live_alerts.json');
  const csvPath = path.join(__dirname, '../web_seer_live_alerts.csv');

  fs.writeFileSync(jsonPath, JSON.stringify(alerts, null, 2), 'utf8');

  const headers = [
    'AlertId', 'Timestamp', 'Country', 'Symbol', 'CompanyName',
    'Headline', 'SourceName', 'SourceTier', 'SourceCredibility',
    'RumorIndex', 'VerificationState', 'CatalystType', 'CatalystMultiplier',
    'Polarity', 'EventScore', 'PrePrice', 'TargetPrice', 'JumpPct',
    'Currency', 'DealerGexState', 'GammaMultiplier', 'SkewBooster'
  ];

  const csvRows = [headers.join(',')];
  alerts.forEach(a => {
    const row = [
      a.id,
      `"${a.timestamp}"`,
      a.country,
      a.symbol,
      `"${(a.companyName || '').replace(/"/g, '""')}"`,
      `"${(a.headline || '').replace(/"/g, '""')}"`,
      `"${(a.sourceName || '').replace(/"/g, '""')}"`,
      a.sourceTier,
      a.sourceCredibility,
      a.rumorIndex,
      a.verificationState,
      a.catalystType,
      a.catalystMultiplier,
      a.polarity,
      a.eventScore,
      a.prePrice,
      a.targetPrice,
      a.jumpPct,
      a.currency,
      a.dealerGexState,
      a.gammaMultiplier,
      a.skewBooster
    ];
    csvRows.push(row.join(','));
  });

  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
  console.log(`\nExported ${alerts.length} alerts to:`);
  console.log(`  -> ${jsonPath}`);
  console.log(`  -> ${csvPath}`);
}

async function main() {
  printBanner();

  let alerts = [];
  if (isReplay) {
    alerts = await runReplayScenarios();
  } else {
    alerts = await runLiveUniverseCrawl();
  }

  if (isExport || alerts.length > 0) {
    exportData(alerts);
  }
}

main().catch(err => {
  console.error('WebSeer Runner Error:', err);
  process.exit(1);
});
