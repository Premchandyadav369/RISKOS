#!/usr/bin/env node
/**
 * RISKOS Universal Event-Driven Shock & Discontinuous Pricing Telemetry Runner
 * ==============================================================================
 * Architect: Premchand Yadav
 * Scope: India Equities (NSE/BSE) & US Equities (NYSE/NASDAQ) Across All Sectors
 * Engine: P.R.E.M.-Event + P.R.E.M.-Alpha Unified Microstructure & Shock Engine
 * 
 * Execution:
 *   node scripts/run_event_driven_universal_pricing.js        (Baseline Anchor Mode)
 *   node scripts/run_event_driven_universal_pricing.js --live (Live Exchange Feed Mode)
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const { SecurityMaster } = require('../src/core/securityMaster.js');
const CrossMarketPricingEngine = require('../src/quant/crossMarketPricingEngine.js');
const EventSurveillanceEngine = require('../src/quant/eventSurveillanceEngine.js');

const isLiveMode = process.argv.includes('--live');

async function main() {
  console.log('================================================================================');
  console.log(`  RISKOS UNIVERSAL EVENT-DRIVEN DISCONTINUOUS PRICING TELEMETRY ${isLiveMode ? '[LIVE FEED]' : '[BASELINE ANCHOR]'}`);
  console.log('  Architecture: P.R.E.M.-Event + P.R.E.M.-Alpha Dual Engine (Premchand Yadav)');
  console.log('  Pillars: Governance NLP + Merton Jump-Diffusion + Options Skew + Dealer GEX + Graph Contagion');
  console.log('================================================================================\n');

  const t0 = performance.now();

  const equities = SecurityMaster.LOCAL_REGISTRY.filter(
    s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY'
  );

  let liveQuoteMap = null;
  if (isLiveMode) {
    console.log('[*] Fetching live market exchange quotes for 134 corporate equities...');
    liveQuoteMap = await CrossMarketPricingEngine.fetchLiveQuotesForUniverse(equities);
  }

  // 1. Run Complete Event Risk Surveillance Across Universe
  const surveillanceResult = EventSurveillanceEngine.scanUniverseEventRisk(equities);

  // 2. Compute Unified Cross-Market Pricing (Microstructure + Event Risk)
  const unifiedPredictions = equities.map(sec => {
    const live = liveQuoteMap ? liveQuoteMap.get(sec.symbol) : null;
    const midPrice = live ? live.price : (sec.basePrice || sec.price || 100.0);
    const isRealTime = live ? live.isRealTime : false;
    const provider = live ? live.provider : 'Model Baseline Snapshot';

    return CrossMarketPricingEngine.predictSecurity(sec, {
      midPrice,
      isRealTime,
      provider,
      includeEventRisk: true
    });
  });

  const t1 = performance.now();
  const elapsedMs = Number((t1 - t0).toFixed(2));

  console.log(`[+] Full Universe Event Surveillance & Pricing Complete in ${elapsedMs} ms.`);
  console.log(`[+] Total Corporate Equities Scanned  : ${equities.length}`);
  console.log(`     -> High Event Risk Equities     : ${surveillanceResult.summary.highEventRiskCount}`);
  console.log(`     -> Acute Gamma Squeeze Regimes  : ${surveillanceResult.summary.acuteGammaSqueezeCount}`);
  console.log(`     -> Knowledge-Graph Supply Nodes : ${surveillanceResult.summary.contagionGraphNodes}\n`);

  // -----------------------------------------------------------------------------
  // 1. TOP EVENT-DRIVEN DISCONTINUOUS JUMP OPPORTUNITIES
  // -----------------------------------------------------------------------------
  console.log('--------------------------------------------------------------------------------');
  console.log('  TOP EVENT-DRIVEN DISCONTINUOUS JUMP CANDIDATES (SURGE TARGETS)');
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'Symbol'.padEnd(12) +
    'Spot'.padEnd(10) +
    'Event Target'.padEnd(14) +
    'Jump(%)'.padEnd(12) +
    'Gamma Mult'.padEnd(12) +
    'Dealer GEX'.padEnd(16) +
    'Jump Prob'.padEnd(10)
  );
  console.log('-'.repeat(86));

  const sortedByJump = unifiedPredictions
    .filter(p => p.eventRisk && p.eventRisk.expectedMovePct > 0)
    .sort((a, b) => b.eventRisk.expectedMovePct - a.eventRisk.expectedMovePct)
    .slice(0, 10);

  sortedByJump.forEach(p => {
    const sym = p.symbol.padEnd(12);
    const spot = `${p.currencySymbol}${p.spotMid.toFixed(1)}`.padEnd(10);
    const tgt = `${p.currencySymbol}${p.predictions.targetEvent.toFixed(1)}`.padEnd(14);
    const move = `+${p.predictions.expectedMoveEventPct.toFixed(2)}%`.padEnd(12);
    const gMult = `${p.eventRisk.gammaMultiplier.toFixed(2)}x`.padEnd(12);
    const gex = p.eventRisk.dealerState.padEnd(16);
    const prob = `${(p.predictions.jumpProbability * 100).toFixed(1)}%`.padEnd(10);
    console.log(`${sym}${spot}${tgt}${move}${gMult}${gex}${prob}`);
  });

  // -----------------------------------------------------------------------------
  // 2. NEGATIVE GAMMA ACCELERATION & SQUEEZE REGIME RADAR
  // -----------------------------------------------------------------------------
  console.log('\n--------------------------------------------------------------------------------');
  console.log('  DEALER NEGATIVE GAMMA ACCELERATION REGIME (SHORT GAMMA SQUEEZE RADAR)');
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'Symbol'.padEnd(12) +
    'Country'.padEnd(9) +
    'Net GEX ($M)'.padEnd(16) +
    'Options Skew (RR25)'.padEnd(22) +
    'Dealer State'.padEnd(22)
  );
  console.log('-'.repeat(81));

  surveillanceResult.acuteGammaSqueezeStocks.forEach(s => {
    const sym = s.symbol.padEnd(12);
    const ctry = s.country.padEnd(9);
    const gex = `${s.eventResult.netGexMillions || -3000}M`.padEnd(16);
    const skew = `+${(s.eventResult.skewAsymmetry * 100).toFixed(1)}% Inversion`.padEnd(22);
    const state = s.eventResult.dealerState.padEnd(22);
    console.log(`${sym}${ctry}${gex}${skew}${state}`);
  });

  // -----------------------------------------------------------------------------
  // 3. GLOBAL SUPPLY-CHAIN CONTAGION PROPAGATION (NVIDIA ANCHOR SHOCK)
  // -----------------------------------------------------------------------------
  console.log('\n--------------------------------------------------------------------------------');
  console.log('  CROSS-MARKET SUPPLY CHAIN CONTAGION MAP (PRIMARY SHOCK: NVIDIA +31.5%)');
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'Downstream Target'.padEnd(18) +
    'Relationship'.padEnd(30) +
    'Graph Weight'.padEnd(14) +
    'Contagion Move(%)'.padEnd(18)
  );
  console.log('-'.repeat(80));

  const contagion = EventSurveillanceEngine.propagateContagion('NVDA', 31.48);
  contagion.forEach(c => {
    const sym = c.targetSymbol.padEnd(18);
    const rel = c.relationship.padEnd(30);
    const wt = c.weight.toFixed(3).padEnd(14);
    const move = `+${c.expectedMovePct.toFixed(2)}%`.padEnd(18);
    console.log(`${sym}${rel}${wt}${move}`);
  });

  // -----------------------------------------------------------------------------
  // 4. EXPORT JSON TELEMETRY & CSV SPREADSHEET
  // -----------------------------------------------------------------------------
  const payload = {
    timestamp: new Date().toISOString(),
    engine: 'P.R.E.M.-Event Universal Discontinuous Pricing Engine',
    version: '3.6.0-PROPRIETARY',
    architect: 'Premchand Yadav',
    feedMode: isLiveMode ? 'LIVE_EXCHANGE_DATA' : 'MODEL_BASELINE_ANCHORS',
    elapsedMs,
    summary: {
      totalEquities: equities.length,
      highEventRiskEquities: surveillanceResult.summary.highEventRiskCount,
      acuteGammaSqueezeCount: surveillanceResult.summary.acuteGammaSqueezeCount
    },
    topEventJumps: sortedByJump,
    acuteGammaSqueezeRegimes: surveillanceResult.acuteGammaSqueezeStocks,
    contagionPropagations: contagion,
    predictions: unifiedPredictions
  };

  const jsonFileName = isLiveMode
    ? 'event_driven_universal_predictions_live.json'
    : 'event_driven_universal_predictions.json';
  const csvFileName = isLiveMode
    ? 'event_driven_universal_predictions_live.csv'
    : 'event_driven_universal_predictions.csv';

  const jsonOutPath = path.join(__dirname, '..', 'data', 'predictions', jsonFileName);
  fs.writeFileSync(jsonOutPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n[+] Structured event telemetry exported to: ${jsonOutPath}`);

  const csvText = CrossMarketPricingEngine.generateCsvTearSheet({ predictions: unifiedPredictions });
  const csvOutPath = path.join(__dirname, '..', 'data', 'predictions', csvFileName);
  fs.writeFileSync(csvOutPath, csvText, 'utf8');
  console.log(`[+] Comprehensive CSV spreadsheet exported to: ${csvOutPath}`);

  console.log('\n================================================================================');
  console.log(`  UNIVERSAL EVENT-DRIVEN PRICING RUN COMPLETED SUCCESSFULLY (${elapsedMs} ms)`);
  console.log('================================================================================\n');
}

main().catch(err => {
  console.error('[!] Event Runner Failed:', err);
  process.exit(1);
});
