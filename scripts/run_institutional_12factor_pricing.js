#!/usr/bin/env node
/**
 * RISKOS Sovereign 12-Factor Institutional Pricing Universal Runner
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Script: scripts/run_institutional_12factor_pricing.js
 * 
 * Evaluates the full cross-market equity universe (US & India) against 12 institutional factors:
 *   F1: Real Yields & Equity Duration
 *   F2: 5Y CDS Hazard & Credit Spreads
 *   F3: Sloan Accrual Anomaly (Earnings Quality)
 *   F4: Share Cannibalization & Dilution Velocity
 *   F5: Beneish M-Score Earnings Manipulation Risk
 *   F6: Short Interest & Days-to-Cover (DTC) Squeeze Convexity
 *   F7: Dark Pool Block Ratio & Lit vs Off-Exchange Flow
 *   F8: Foreign & Domestic Institutional Net Velocity (FII / DII)
 *   F9: Dealer Vanna Cross-Derivative (dDelta/dVol)
 *   F10: Dealer Charm (dDelta/dt) & OpEx Max Pain Strike Pinning
 *   F11: Alternative Data Momentum (Job Postings & Web Traffic)
 *   F12: Commodity & Geopolitical Betas (Brent Crude & Copper)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { InstitutionalPricingEngine } = require('../institutionalPricingEngine.js');
let SecurityMaster;
try {
  SecurityMaster = require('../securityMaster.js').SecurityMaster || require('../securityMaster.js');
} catch (e) {
  console.warn('SecurityMaster warning:', e.message);
}

const engine = new InstitutionalPricingEngine();

function printBanner() {
  console.log('================================================================================');
  console.log('  RISKOS SOVEREIGN 12-FACTOR INSTITUTIONAL PRICING TOURNAMENT');
  console.log('  Closed-Form Cross-Market Multi-Factor Valuation & Options Microstructure');
  console.log('================================================================================\n');
}

function printAssetCard(res, rank, label) {
  const currSym = res.currency === 'INR' ? '₹' : '$';
  const f = res.factors;
  const sign = res.alphaSpreadPct >= 0 ? '+' : '';

  console.log(`[#${rank}] ${res.symbol} | ${res.name} (${res.country} - ${res.sector}) [${label}]`);
  console.log(`     Pricing:     Spot: ${currSym}${res.spotPrice.toLocaleString()} -> P*: ${currSym}${res.institutionalFairValue.toLocaleString()} | Alpha: ${sign}${res.alphaSpreadPct.toFixed(2)}%`);
  console.log(`     Conviction:  Tier: ${res.convictionTier} | Currency: ${res.currency}`);
  console.log(`     Macro & Risk: Real Yield: ${f.f1_macroRealYield.realYieldPct}% (Δ: ${f.f1_macroRealYield.deltaPct}%) | CDS: ${f.f2_creditCdsHazard.cdsBps} bps (Δ: ${f.f2_creditCdsHazard.deltaPct}%)`);
  console.log(`     Quality/Cap: Accrual: ${f.f3_sloanAccrual.accrualRatio} (Δ: ${f.f3_sloanAccrual.deltaPct}%) | Buyback: ${f.f4_shareBuybackDilution.netShareChangePct}% (Δ: ${f.f4_shareBuybackDilution.deltaPct}%) | Beneish: ${f.f5_beneishManipulation.beneishM}`);
  console.log(`     Options/Flow: Short: ${f.f6_shortDtcSqueeze.shortInterestPct}% (DTC: ${f.f6_shortDtcSqueeze.daysToCover}d) | DarkPool: ${f.f7_darkPoolBlockShare.darkPoolSharePct}% | InstFlow: ${f.f8_instFlowVelocity.deltaPct}%`);
  console.log(`     Derivatives: Vanna: ${f.f9_dealerVanna.netVanna} (Δ: ${f.f9_dealerVanna.deltaPct}%) | MaxPain: ${currSym}${f.f10_dealerCharmMaxPain.maxPainStrike} (Δ: ${f.f10_dealerCharmMaxPain.deltaPct}%)`);
  console.log(`     Alt & Beta:  Hiring: ${f.f11_altDataMomentum.hiringVelocityPct}% (Δ: ${f.f11_altDataMomentum.deltaPct}%) | BrentBeta: ${f.f12_commodityGeopolitical.brentBeta} | CopperBeta: ${f.f12_commodityGeopolitical.copperBeta}`);
  console.log('--------------------------------------------------------------------------------');
}

function exportCsv(evaluations, outPath) {
  const headers = [
    'Symbol',
    'Name',
    'Country',
    'Currency',
    'Sector',
    'SpotPrice',
    'InstitutionalFairValue',
    'AlphaSpreadPct',
    'ConvictionTier',
    'F1_RealYieldDeltaPct',
    'F2_CdsHazardDeltaPct',
    'F3_SloanAccrualDeltaPct',
    'F4_BuybackDeltaPct',
    'F5_BeneishDeltaPct',
    'F6_ShortSqueezeDeltaPct',
    'F7_DarkPoolDeltaPct',
    'F8_InstFlowDeltaPct',
    'F9_VannaDeltaPct',
    'F10_CharmMaxPainDeltaPct',
    'F11_AltDataDeltaPct',
    'F12_CommodityDeltaPct'
  ];

  const rows = evaluations.map(e => [
    `"${e.symbol}"`,
    `"${(e.name || '').replace(/"/g, '""')}"`,
    `"${e.country}"`,
    `"${e.currency}"`,
    `"${(e.sector || '').replace(/"/g, '""')}"`,
    e.spotPrice,
    e.institutionalFairValue,
    e.alphaSpreadPct,
    `"${e.convictionTier}"`,
    e.factors.f1_macroRealYield.deltaPct,
    e.factors.f2_creditCdsHazard.deltaPct,
    e.factors.f3_sloanAccrual.deltaPct,
    e.factors.f4_shareBuybackDilution.deltaPct,
    e.factors.f5_beneishManipulation.deltaPct,
    e.factors.f6_shortDtcSqueeze.deltaPct,
    e.factors.f7_darkPoolBlockShare.deltaPct,
    e.factors.f8_instFlowVelocity.deltaPct,
    e.factors.f9_dealerVanna.deltaPct,
    e.factors.f10_dealerCharmMaxPain.deltaPct,
    e.factors.f11_altDataMomentum.deltaPct,
    e.factors.f12_commodityGeopolitical.deltaPct
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(outPath, csvContent, 'utf8');
}

function main() {
  printBanner();
  const startTime = Date.now();

  const results = engine.evaluateUniverse();
  const elapsedMs = Date.now() - startTime;

  console.log(`Evaluated ${results.totalEvaluated} equities in ${elapsedMs}ms.\n`);

  console.log('================================================================================');
  console.log('  TOP 10 INSTITUTIONAL ALPHA LONGS (SUPERIOR CASH FLOW, FLOW & SQUEEZE ALIGNMENT)');
  console.log('================================================================================');
  results.topAlphaLongs.forEach((asset, idx) => {
    printAssetCard(asset, idx + 1, 'ALPHA_LONG');
  });

  console.log('\n================================================================================');
  console.log('  TOP 10 INSTITUTIONAL HEADWIND SHORTS / TRIM (CREDIT STRESS, ACCRUALS & LIQUIDITY)');
  console.log('================================================================================');
  results.topHeadwindShorts.forEach((asset, idx) => {
    printAssetCard(asset, idx + 1, 'HEADWIND_AVOID');
  });

  // Export JSON
  const jsonPath = path.resolve(__dirname, '../institutional_12factor_predictions.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nSuccessfully exported full evaluations to: ${jsonPath}`);

  // Export CSV
  const csvPath = path.resolve(__dirname, '../institutional_12factor_predictions.csv');
  exportCsv(results.fullEvaluations, csvPath);
  console.log(`Successfully exported CSV dataset to: ${csvPath}`);

  console.log('\nInstitutional 12-Factor Pricing run complete.');
}

if (require.main === module) {
  main();
}

module.exports = { main, exportCsv };
