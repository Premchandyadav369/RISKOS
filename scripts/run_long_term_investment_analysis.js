#!/usr/bin/env node
/**
 * RISKOS P.R.E.M.-Compounder: Universal Long-Term Investment Screening Runner
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Script: scripts/run_long_term_investment_analysis.js
 * 
 * Screens 134 equities across Indian (NSE/BSE) and American (NASDAQ/NYSE) markets
 * across 6 institutional compounder parameters:
 *   - Return on Capital (ROE & ROCE)
 *   - Economic Moat & Pricing Power
 *   - Secular Multi-Decade Tailwinds
 *   - Balance Sheet Solvency
 *   - Growth-Adjusted Valuation (PEG & DCF)
 *   - 3-Year & 5-Year Target Price & Expected Compound IRR
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { LongTermInvestmentEngine } = require('../longTermInvestmentEngine.js');

const engine = new LongTermInvestmentEngine();

function printBanner() {
  console.log('================================================================');
  console.log('  RISKOS P.R.E.M.-COMPOUNDER: INSTITUTIONAL MULTI-YEAR RADAR');
  console.log('  Top Long-Term Wealth Compounders: Indian & American Markets');
  console.log('================================================================\n');
}

function printSectionHeader(title) {
  console.log(`\n================================================================`);
  console.log(`  ${title}`);
  console.log(`================================================================\n`);
}

function printAssetCard(asset, rank) {
  const currSym = asset.currency === 'INR' ? '₹' : '$';
  const p = asset.projections;

  console.log(`[#${rank}] ${asset.symbol} | ${asset.name} (${asset.sector})`);
  console.log(`     Grade & Score:   ${asset.grade} (Score: ${asset.compositeScore}/100) | Rec: ${asset.recommendation}`);
  console.log(`     Economic Moat:   ${asset.moatType} (Moat Score: ${asset.moatScore}/100)`);
  console.log(`     Capital Return:  ROE: ${asset.roe}% | ROCE: ${asset.roce}% | Capital Quality: ${asset.capitalAllocationScore}/100`);
  console.log(`     Valuation:       P/E: ${asset.pe}x | PEG: ${asset.peg}x (Valuation Score: ${asset.valuationScore}/100)`);
  console.log(`     Price Targets:   Current: ${currSym}${p.spotPrice.toFixed(2)} -> 3Yr: ${currSym}${p.targetPrice3Yr.toFixed(2)} | 5Yr: ${currSym}${p.targetPrice5Yr.toFixed(2)}`);
  console.log(`     Compound Return: 3-Year Expected IRR: +${p.irr3Yr}%/yr | 5-Year Expected IRR: +${p.irr5Yr}%/yr`);
  console.log(`     Scenarios (5Yr): Bull: ${currSym}${p.scenarios.bull.target5Yr} (+${p.scenarios.bull.irr5Yr}%/yr) | Bear: ${currSym}${p.scenarios.bear.target5Yr} (+${p.scenarios.bear.irr5Yr}%/yr)`);
  console.log(`     Core Theses:`);
  asset.theses.forEach(t => console.log(`       * ${t}`));
  console.log(`     Key Risks:`);
  asset.risks.forEach(r => console.log(`       ! ${r}`));
  console.log('----------------------------------------------------------------');
}

function main() {
  printBanner();

  const startTime = Date.now();
  const screenResults = engine.screenUniverse();
  const elapsed = Date.now() - startTime;

  console.log(`Universe Screen Complete: Evaluated ${screenResults.totalEvaluated} corporate equities in ${elapsed} ms.\n`);

  // Top US Champions
  printSectionHeader('TOP 10 BEST LONG-TERM INVESTMENTS: UNITED STATES (NASDAQ / NYSE)');
  screenResults.topUS.forEach((asset, idx) => {
    printAssetCard(asset, idx + 1);
  });

  // Top India Champions
  printSectionHeader('TOP 10 BEST LONG-TERM INVESTMENTS: INDIA (NSE / BSE)');
  screenResults.topIndia.forEach((asset, idx) => {
    printAssetCard(asset, idx + 1);
  });

  // Export JSON & CSV
  const jsonPath = path.join(__dirname, '../long_term_best_investments.json');
  const csvPath = path.join(__dirname, '../long_term_best_investments.csv');

  fs.writeFileSync(jsonPath, JSON.stringify(screenResults, null, 2), 'utf8');

  const headers = [
    'Rank', 'Country', 'Symbol', 'Name', 'Sector', 'Currency',
    'CompositeScore', 'Grade', 'Recommendation', 'MoatType', 'MoatScore',
    'TailwindScore', 'ROE', 'ROCE', 'PE', 'PEG', 'SpotPrice',
    'TargetPrice3Yr', 'TargetPrice5Yr', 'ExpectedIRR3Yr', 'ExpectedIRR5Yr',
    'BullTarget5Yr', 'BullIRR5Yr', 'BearTarget5Yr', 'BearIRR5Yr', 'CoreThesisSummary'
  ];

  const csvRows = [headers.join(',')];

  const combinedExport = [
    ...screenResults.topUS.map((a, i) => ({ ...a, marketRank: i + 1 })),
    ...screenResults.topIndia.map((a, i) => ({ ...a, marketRank: i + 1 }))
  ];

  combinedExport.forEach(a => {
    const p = a.projections;
    const thesisStr = (a.theses && a.theses.length > 0 ? a.theses[0] : '').replace(/"/g, '""');
    const row = [
      a.marketRank,
      a.country,
      a.symbol,
      `"${a.name}"`,
      `"${a.sector}"`,
      a.currency,
      a.compositeScore,
      a.grade,
      a.recommendation,
      a.moatType,
      a.moatScore,
      a.tailwindScore,
      a.roe,
      a.roce,
      a.pe,
      a.peg,
      p.spotPrice,
      p.targetPrice3Yr,
      p.targetPrice5Yr,
      p.irr3Yr,
      p.irr5Yr,
      p.scenarios.bull.target5Yr,
      p.scenarios.bull.irr5Yr,
      p.scenarios.bear.target5Yr,
      p.scenarios.bear.irr5Yr,
      `"${thesisStr}"`
    ];
    csvRows.push(row.join(','));
  });

  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');

  console.log(`\nSuccessfully exported full long-term portfolio datasets to:`);
  console.log(`  -> ${jsonPath}`);
  console.log(`  -> ${csvPath}\n`);
}

main();
