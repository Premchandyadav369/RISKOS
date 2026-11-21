#!/usr/bin/env node
/**
 * RISKOS Cross-Market P.R.E.M.-Alpha Pricing Prediction Runner
 * ==============================================================================
 * Architect: Premchand Yadav
 * Purpose: Evaluates all Indian (NSE/BSE) and US (NASDAQ/NYSE) stocks using the
 * proprietary 4-Pillar P.R.E.M.-Alpha engine (Hamilton HMM + Hawkes Jump Damping +
 * Shannon Entropy Coiling + 5-Level OFI).
 * 
 * Execution: node scripts/run_cross_market_prem_pricing.js
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const CrossMarketPricingEngine = require('../crossMarketPricingEngine.js');

console.log('================================================================================');
console.log('  RISKOS UNIVERSAL CROSS-MARKET PREDICTIVE PRICING TELEMETRY');
console.log('  Architecture: P.R.E.M.-Alpha Multi-Pillar Engine (Premchand Yadav 2026)');
console.log('  Scope: India Equities (NSE/BSE) & US Equities (NYSE/NASDAQ) Across All Sectors');
console.log('================================================================================\n');

const t0 = performance.now();
const universeResult = CrossMarketPricingEngine.predictUniverse();
const t1 = performance.now();
const elapsedMs = Number((t1 - t0).toFixed(2));

console.log(`[+] Cross-Market Universe Evaluation Complete in ${elapsedMs} ms.`);
console.log(`[+] Total Evaluated Corporate Equities : ${universeResult.summary.totalStocksEvaluated}`);
console.log(`     -> Indian Equities (NSE/BSE)     : ${universeResult.summary.indiaStocksCount}`);
console.log(`     -> US Equities (NYSE/NASDAQ)     : ${universeResult.summary.usStocksCount}`);
console.log(`     -> Global Titans & ADRs          : ${universeResult.summary.globalStocksCount}\n`);

// -----------------------------------------------------------------------------
// 1. TOP INDIAN ALPHA OPPORTUNITIES (NSE / BSE)
// -----------------------------------------------------------------------------
console.log('--------------------------------------------------------------------------------');
console.log('  TOP 10 INDIAN STOCKS: P.R.E.M.-ALPHA PREDICTIVE TARGET PRICING (INR ₹)');
console.log('--------------------------------------------------------------------------------');
console.log(
  'Symbol'.padEnd(12) +
  'Spot'.padEnd(10) +
  'Alpha(bps)'.padEnd(12) +
  'Target 1d'.padEnd(12) +
  'Target 20d'.padEnd(12) +
  'Move(20d)'.padEnd(12) +
  'Action'.padEnd(14)
);
console.log('-'.repeat(80));

universeResult.topIndiaLongs.slice(0, 10).forEach(s => {
  const sym = s.symbol.padEnd(12);
  const spot = `₹${s.spotMid.toFixed(1)}`.padEnd(10);
  const alpha = `+${s.predictions.alphaBps.toFixed(1)}`.padEnd(12);
  const t1d = `₹${s.predictions.target1d.toFixed(1)}`.padEnd(12);
  const t20d = `₹${s.predictions.target20d.toFixed(1)}`.padEnd(12);
  const move = `+${s.predictions.expectedMove20dPct.toFixed(2)}%`.padEnd(12);
  const act = s.signals.action.padEnd(14);
  console.log(`${sym}${spot}${alpha}${t1d}${t20d}${move}${act}`);
});

// -----------------------------------------------------------------------------
// 2. TOP US ALPHA OPPORTUNITIES (NASDAQ / NYSE)
// -----------------------------------------------------------------------------
console.log('\n--------------------------------------------------------------------------------');
console.log('  TOP 10 US STOCKS: P.R.E.M.-ALPHA PREDICTIVE TARGET PRICING (USD $)');
console.log('--------------------------------------------------------------------------------');
console.log(
  'Symbol'.padEnd(12) +
  'Spot'.padEnd(10) +
  'Alpha(bps)'.padEnd(12) +
  'Target 1d'.padEnd(12) +
  'Target 20d'.padEnd(12) +
  'Move(20d)'.padEnd(12) +
  'Action'.padEnd(14)
);
console.log('-'.repeat(80));

universeResult.topUSLongs.slice(0, 10).forEach(s => {
  const sym = s.symbol.padEnd(12);
  const spot = `$${s.spotMid.toFixed(1)}`.padEnd(10);
  const alpha = `+${s.predictions.alphaBps.toFixed(1)}`.padEnd(12);
  const t1d = `$${s.predictions.target1d.toFixed(1)}`.padEnd(12);
  const t20d = `$${s.predictions.target20d.toFixed(1)}`.padEnd(12);
  const move = `+${s.predictions.expectedMove20dPct.toFixed(2)}%`.padEnd(12);
  const act = s.signals.action.padEnd(14);
  console.log(`${sym}${spot}${alpha}${t1d}${t20d}${move}${act}`);
});

// -----------------------------------------------------------------------------
// 3. SECTOR LEVEL AGGREGATE BREAKDOWN
// -----------------------------------------------------------------------------
console.log('\n--------------------------------------------------------------------------------');
console.log('  SECTORIAL SENTIMENT & 20-DAY FORECAST MATRIX (SAMPLE TOP SECTORS)');
console.log('--------------------------------------------------------------------------------');
console.log(
  'Sector Name'.padEnd(36) +
  'Count'.padEnd(8) +
  'Avg Alpha'.padEnd(12) +
  '20d Move(%)'.padEnd(14) +
  'Sentiment'.padEnd(10)
);
console.log('-'.repeat(80));

universeResult.sectorBreakdown.slice(0, 12).forEach(sec => {
  const name = sec.sector.slice(0, 34).padEnd(36);
  const cnt = sec.count.toString().padEnd(8);
  const alpha = `${sec.avgAlphaBps >= 0 ? '+' : ''}${sec.avgAlphaBps.toFixed(1)} bps`.padEnd(12);
  const move = `${sec.avgExpectedMove20dPct >= 0 ? '+' : ''}${sec.avgExpectedMove20dPct.toFixed(2)}%`.padEnd(14);
  const sent = sec.sentiment.padEnd(10);
  console.log(`${name}${cnt}${alpha}${move}${sent}`);
});

// -----------------------------------------------------------------------------
// 4. EXPORT TO JSON & CSV TEAR-SHEETS
// -----------------------------------------------------------------------------
const jsonOutPath = path.join(__dirname, '..', 'cross_market_prem_pricing_predictions.json');
fs.writeFileSync(jsonOutPath, JSON.stringify(universeResult, null, 2), 'utf8');
console.log(`\n[+] Complete structured telemetry exported to: ${jsonOutPath}`);

const csvOutPath = path.join(__dirname, '..', 'cross_market_prem_predictions.csv');
const csvText = CrossMarketPricingEngine.generateCsvTearSheet(universeResult);
fs.writeFileSync(csvOutPath, csvText, 'utf8');
console.log(`[+] Spreadsheet tear-sheet exported to: ${csvOutPath}`);

console.log('\n================================================================================');
console.log(`  P.R.E.M.-ALPHA CROSS-MARKET PRICING RUN COMPLETED SUCCESSFULLY (${elapsedMs} ms)`);
console.log('================================================================================\n');
