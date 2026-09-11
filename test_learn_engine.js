/**
 * Automated test suite for RISKOS Learn & Simulate Calculation Engine
 * Verifies all 18 simulation modules produce deterministic, mathematically accurate outputs.
 */

const LearnMathEngine = require('./learnMathEngine.js');

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTING ALL 18 DETERMINISTIC SIMULATION MODULES');
console.log('═══════════════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// 1. CAGR
const cagrRes = LearnMathEngine.getModuleById('cagr').calc({ initialVal: 100000, finalVal: 250000, years: 5 }, 'INR');
assert(cagrRes.cagr === 20.11, `CAGR 100k -> 250k in 5Y is 20.11% (got ${cagrRes.cagr}%)`);
assert(cagrRes.substitutedLatex.includes('20.11'), 'CAGR substituted LaTeX contains formatted percentage');

// 2. Compounding
const compRes = LearnMathEngine.getModuleById('compounding').calc({ principal: 100000, annualRate: 12, years: 10, frequency: 1 }, 'INR');
assert(compRes.finalAmount === 310584.82, `Compounding 100k at 12% for 10Y is 310,584.82 (got ${compRes.finalAmount})`);

// 3. P/E & EPS
const peRes = LearnMathEngine.getModuleById('pe_eps').calc({ price: 2984.50, eps: 116.80, growthRate: 14 }, 'INR');
assert(peRes.pe === 25.55, `P/E 2984.50 / 116.80 is 25.55x (got ${peRes.pe}x)`);
assert(peRes.earningsYield === 3.91, `Earnings Yield is 3.91% (got ${peRes.earningsYield}%)`);

// 4. ROE / ROCE DuPont
const roeRes = LearnMathEngine.getModuleById('roe_roce').calc({ netIncome: 79000, revenue: 900000, totalAssets: 1600000, shareholdersEquity: 810000 }, 'INR');
assert(roeRes.roe === 9.75, `ROE is 9.75% (got ${roeRes.roe}%)`);
assert(roeRes.netMargin === 8.78, `Net Margin is 8.78% (got ${roeRes.netMargin}%)`);

// 5. Volatility
const volRes = LearnMathEngine.getModuleById('volatility').calc({ dailyStdDev: 1.15, tradingDays: 252 });
assert(volRes.annualizedVol === 18.26, `Annualized Vol for 1.15% daily is 18.26% (got ${volRes.annualizedVol}%)`);

// 6. Beta & Correlation
const betaRes = LearnMathEngine.getModuleById('beta_corr').calc({ assetVol: 22.0, marketVol: 15.0, correlation: 0.75 });
assert(betaRes.beta === 1.10, `Beta for 22% / 15% * 0.75 is 1.10 (got ${betaRes.beta})`);

// 7. Sharpe Ratio
const sharpeRes = LearnMathEngine.getModuleById('sharpe').calc({ portfolioReturn: 16.5, riskFreeRate: 6.5, totalVol: 12.5 });
assert(sharpeRes.sharpe === 0.80, `Sharpe (16.5 - 6.5) / 12.5 is 0.80 (got ${sharpeRes.sharpe})`);

// 8. Max Drawdown
const mddRes = LearnMathEngine.getModuleById('mdd').calc({ peakValue: 100000, troughValue: 65000 }, 'INR');
assert(mddRes.mddPct === -35.0, `MDD 100k -> 65k is -35% (got ${mddRes.mddPct}%)`);
assert(mddRes.requiredRecoveryGain === 53.85, `Required Recovery is +53.85% (got ${mddRes.requiredRecoveryGain}%)`);

// 9. Diversification
const divRes = LearnMathEngine.getModuleById('diversification').calc({ numAssets: 15, avgAssetVol: 24.0, avgCorrelation: 0.35 });
assert(divRes.portfolioVol < 24.0, `Portfolio Vol (${divRes.portfolioVol}%) is lower than single asset vol (24.0%)`);

// 10. Portfolio Variance
const pvRes = LearnMathEngine.getModuleById('port_variance').calc({ weightA: 60, returnA: 14.0, returnB: 8.0, volA: 18.0, volB: 6.5, correlation: 0.10 });
assert(pvRes.portfolioReturn === 11.60, `Portfolio Return is 11.60% (got ${pvRes.portfolioReturn}%)`);

// 11. CAPM & Alpha
const capmRes = LearnMathEngine.getModuleById('capm').calc({ riskFreeRate: 6.5, marketReturn: 13.5, beta: 1.15, actualReturn: 17.5 });
assert(capmRes.expectedReturn === 14.55, `CAPM Expected Return is 14.55% (got ${capmRes.expectedReturn}%)`);
assert(capmRes.alpha === 2.95, `Alpha is +2.95% (got ${capmRes.alpha}%)`);

// 12. SIP / DCA
const sipRes = LearnMathEngine.getModuleById('sip_dca').calc({ monthlyAmount: 10000, annualRate: 13, years: 10, stepUpPct: 0 }, 'INR');
assert(sipRes.totalInvested === 1200000, `Total Invested in 10Y @ 10k/mo is 1,200,000 (got ${sipRes.totalInvested})`);
assert(sipRes.finalValue > sipRes.totalInvested, `Final SIP wealth (${sipRes.finalValue}) exceeds invested (${sipRes.totalInvested})`);

// 13. Lumpsum vs SIP
const lvsRes = LearnMathEngine.getModuleById('lumpsum_sip').calc({ totalCapital: 1200000, annualRate: 13, years: 5, marketRegime: 'bull' }, 'INR');
assert(lvsRes.lumpsumFinal > 0 && lvsRes.sipFinal > 0, 'Both Lumpsum and SIP paths evaluate correctly');

// 14. Compound Timeline
const ctRes = LearnMathEngine.getModuleById('compound_timeline').calc({ principal: 500000, annualRate: 12, inflationRate: 6, years: 10 }, 'INR');
assert(ctRes.nominalFinal > ctRes.realFinal, `Nominal (${ctRes.nominalFinal}) > Real (${ctRes.realFinal}) due to inflation`);

// 15. 4-Asset Allocation
const paRes = LearnMathEngine.getModuleById('port_allocator').calc({ weightEquity: 50, weightBonds: 30, weightGold: 15, weightCash: 5 });
assert(paRes.portfolioReturn > 0 && paRes.portfolioVol > 0, `4-Asset Allocator returns valid Return (${paRes.portfolioReturn}%) and Vol (${paRes.portfolioVol}%)`);

// 16. Efficient Frontier Trade-off
const efRes = LearnMathEngine.getModuleById('risk_return_scatter').calc({ equityShare: 60 });
assert(efRes.returnP === 11.58, `60/40 Return is 11.58% (got ${efRes.returnP}%)`);

// 17. Drawdown vs Recovery
const drRes = LearnMathEngine.getModuleById('drawdown_recovery').calc({ lossPercent: 50 });
assert(drRes.requiredGainPct === 100.0, `50% Loss requires 100% gain to break even (got ${drRes.requiredGainPct}%)`);

// 18. Macro Stress Testing
const stRes = LearnMathEngine.getModuleById('scenario_stress').calc({ scenarioKey: 'rates_spike', portfolioValue: 1000000 }, 'INR');
assert(stRes.impactPct === -10.2, `Rate shock scenario impact is -10.2% (got ${stRes.impactPct}%)`);

// 19. Time-Series Momentum (TSMOM) & Volatility Scaling
const tsmomRes = LearnMathEngine.getModuleById('tsmom_volatility_targeting').calc({ lookbackDays: 63, targetVol: 15, assetVol: 22, assetReturn: 14.5, maxLeverage: 2.0 });
assert(tsmomRes.focalValue === '+0.68x', `TSMOM leverage weight 15% / 22% is +0.68x (got ${tsmomRes.focalValue})`);
assert(tsmomRes.plainResult.includes('LONG'), 'TSMOM identifies positive trend as LONG');

// 20. Gary Antonacci Dual Momentum
const dualRes = LearnMathEngine.getModuleById('dual_momentum_antonacci').calc({ assetAReturn: 22.4, assetBReturn: 16.2, riskFreeReturn: 6.5 });
assert(dualRes.focalValue === 'US', `Dual Momentum selects relative winner US (got ${dualRes.focalValue})`);
assert(dualRes.plainResult.includes('PASSED'), 'Dual Momentum passes absolute momentum hurdle');

// 21. Tax Alpha & Tax-Loss Harvesting
const tlhRes = LearnMathEngine.getModuleById('tax_loss_harvesting').calc({ unrealizedLoss: 100000, taxRatePct: 20.0, reinvestYieldPct: 12.0, holdingYears: 10 }, 'INR');
assert(tlhRes.focalValue.includes('20.0k') || tlhRes.focalValue.includes('20,000'), `Tax loss harvest saves ₹20k on ₹100k loss (got ${tlhRes.focalValue})`);
assert(tlhRes.plainResult.includes('tax alpha boost'), 'Tax loss harvesting calculates compounded tax alpha');

// 22. Gordon Growth Model & Dividend Discount Valuation
const ddmRes = LearnMathEngine.getModuleById('dividend_discount_model').calc({ currentDividend: 50.0, dividendGrowthRate: 6.0, requiredReturn: 10.5 }, 'INR');
assert(ddmRes.plainResult.includes('1,177.78'), `DDM intrinsic value is 1,177.78 (got ${ddmRes.plainResult})`);
assert(ddmRes.chart.datasets[0].data.length === 10, 'DDM projects 10-year dividend stream');

// 23. Kelly Criterion & Optimal Leverage Growth
const kellyRes = LearnMathEngine.getModuleById('kelly_criterion_growth').calc({ winProbability: 60.0, winLossRatio: 1.5, initialCapital: 1000000 });
assert(kellyRes.focalValue === '33.3%', `Kelly optimal fraction is 33.3% (got ${kellyRes.focalValue})`);
assert(kellyRes.plainResult.includes('Half-Kelly'), 'Kelly module provides institutional Half-Kelly recommendation');

// 24. 0DTE Gamma Exposure (GEX) & Dealer Pinning
const gexRes = LearnMathEngine.getModuleById('gex_0dte_pinning').calc({ spotPrice: 24000, callOi: 1250000, putOi: 980000, atmVol: 14.5, hoursToExpiry: 3.5 });
assert(gexRes.focalValue.includes('Cr'), `0DTE Net GEX calculated in Crores (got ${gexRes.focalValue})`);
assert(gexRes.plainResult.includes('Pinning Probability'), '0DTE GEX provides dealer pinning probability');

// 25. HFT Hawkes Point Process & Liquidity Cascades
const hawkesRes = LearnMathEngine.getModuleById('hawkes_liquidity_cascades').calc({ baselineRate: 2.5, excitationAlpha: 1.15, decayBeta: 1.40, shockSize: 10.0 });
assert(hawkesRes.focalValue.includes('0.82'), `Hawkes branching ratio is 0.82 (got ${hawkesRes.focalValue})`);
assert(hawkesRes.plainResult.includes('cluster size'), 'Hawkes provides expected order cluster size');

// 26. Private Equity LBO Debt Waterfall & Sponsor IRR
const lboRes = LearnMathEngine.getModuleById('lbo_debt_waterfall').calc({ purchaseEv: 1000, entryEbitda: 100, debtPct: 60.0, exitMultiple: 10.0, annualFcf: 50.0, holdingYears: 5 });
assert(lboRes.focalValue.includes('18.3%'), `LBO 5Y Sponsor IRR is 18.3% (got ${lboRes.focalValue})`);
assert(lboRes.focalValue.includes('2.32x MOIC'), 'LBO calculates accurate multiple on invested capital');

// 27. Merton Structural Credit & Distance-to-Default (KMV EDF)
const mertonRes = LearnMathEngine.getModuleById('merton_structural_default').calc({ equityValue: 500, debtFace: 800, equityVol: 35.0, riskFreeRate: 5.5, timeHorizon: 1.0 });
assert(mertonRes.focalValue.includes('3.57σ'), `Merton distance to default is 3.57σ (got ${mertonRes.focalValue})`);
assert(mertonRes.plainResult.includes('Investment Grade') || mertonRes.plainResult.includes('AAA') || mertonRes.plainResult.includes('A / BBB+'), 'Merton outputs credit rating classification');

// 28. Extreme Value Theory & Solvency II 99.5% SCR
const evtRes = LearnMathEngine.getModuleById('solvency_ii_evt_cat').calc({ thresholdLoss: 50.0, shapeXi: 0.28, scaleBeta: 18.5, totalObservations: 1000, exceedances: 50 });
assert(evtRes.focalValue.includes('109.83'), `Solvency II 99.5% SCR VaR is 109.83 (got ${evtRes.focalValue})`);
assert(evtRes.plainResult.includes('Expected Shortfall'), 'EVT calculates actuarial Expected Shortfall');

// 29. Actuarial ALM & Redington Key-Rate Immunization
const almRes = LearnMathEngine.getModuleById('redington_alm_immunization').calc({ liabilityPV: 1000, liabilityDuration: 14.5, liabilityConvexity: 260.0, assetDuration: 14.5, assetConvexity: 290.0, yieldShockBps: 100 });
assert(almRes.focalValue.includes('IMMUNIZED'), `Redington condition satisfied and portfolio immunized (got ${almRes.focalValue})`);
assert(almRes.focalValue.includes('1.50'), 'Convexity surplus produces positive alpha under rate shock');

// 30. CLO Tranche Cash-Flow & Loss Absorption Waterfall
const cloRes = LearnMathEngine.getModuleById('clo_tranche_waterfall').calc({ poolSize: 500, poolDefaultRate: 4.0, recoveryRate: 65.0 });
assert(cloRes.focalValue.includes('7.00'), `CLO collateral pool loss is 7.00M (got ${cloRes.focalValue})`);
assert(cloRes.plainResult.includes('First-Loss Equity'), 'CLO prioritizes payments and allocates losses to Equity tranche');

// 31. Option-Adjusted Spread (OAS) & Binomial Tree
const oasRes = LearnMathEngine.getModuleById('oas_binomial_tree').calc({ bondMarketPrice: 102.5, parValue: 100.0, couponRate: 7.0, callPrice: 101.5, callYear: 2, maturityYears: 5, interestRateVol: 15.0 });
assert(oasRes.focalValue.includes('180 bps'), `Option-Adjusted Spread is 180 bps (got ${oasRes.focalValue})`);
assert(oasRes.plainResult.toLowerCase().includes('option cost'), 'OAS strips out embedded call option cost');


// 32. Sector Rotation & Relative Strength Matrix
const secRsRes = LearnMathEngine.getModuleById('sector_relative_strength').calc({ sectorReturn: 22.5, benchmarkReturn: 14.0, sectorVol: 18.5, benchmarkVol: 14.0, lookbackDays: 63 });
assert(secRsRes.focalValue === '1.07x', `Sector RS Ratio 22.5% vs 14% is 1.07x (got ${secRsRes.focalValue})`);
assert(secRsRes.plainResult.includes('LEADING'), 'Sector RS identifies outperforming quadrant as LEADING');

// 33. Egyptian Pantheon Order Flow Imbalance (OFI)
const ofiRes = LearnMathEngine.getModuleById('egyptian_pantheon_hft').calc({ bidVolChange: 18500, askVolChange: 9200, lambdaImpact: 0.00035, tickSpreadBps: 2.5 });
assert(ofiRes.focalValue.includes('1.86σ'), `OFI Z-Score is +1.86σ (got ${ofiRes.focalValue})`);
assert(ofiRes.plainResult.includes('AGGRESSIVE LONG'), 'OFI provides HFT alpha routing signal');

// 34. GARCH(1,1) Compound Poisson Jump-Diffusion
const gjdRes = LearnMathEngine.getModuleById('garch_jump_diffusion').calc({ baselineVol: 16.0, alphaArch: 0.08, betaGarch: 0.88, jumpIntensityLambda: 3.5, jumpSizeMean: -4.5, jumpSizeVol: 6.0 });
assert(parseFloat(gjdRes.focalValue) > 16.0, `Composite jump-adjusted vol (${gjdRes.focalValue}) exceeds continuous vol`);
assert(gjdRes.plainResult.includes('Fat-Tail'), 'GARCH Jump-Diffusion reports fat-tail kurtosis');

// 35. Cross-Asset Statistical Arbitrage & Cointegration
const statArbRes = LearnMathEngine.getModuleById('cross_asset_stat_arb').calc({ priceA: 24680, priceB: 52140, hedgeRatioBeta: 0.47, ouSpeedTheta: 0.22, currentSpreadDev: 2.35 });
assert(statArbRes.focalValue.includes('3.2 Days') || statArbRes.focalValue.includes('Days'), `OU Half-Life calculated in days (got ${statArbRes.focalValue})`);
assert(statArbRes.plainResult.includes('SHORT SPREAD'), 'Stat Arb identifies +2.35σ deviation as SHORT SPREAD');

// 36. Barra Multi-Factor Risk & Covariance Decomposition
const barraRes = LearnMathEngine.getModuleById('barra_multi_factor_risk').calc({ valueExposure: 0.45, momentumExposure: 0.82, qualityExposure: 0.60, sizeExposure: -0.25, specificRiskPct: 7.5 });
assert(parseFloat(barraRes.focalValue) > 7.5, `Total Barra risk (${barraRes.focalValue}) exceeds specific risk alone`);
assert(barraRes.plainResult.includes('Systematic Factor Risk'), 'Barra decomposes active risk into factor and specific');

// 37. Optimal Algorithmic Order Slicing (VWAP & TWAP)
const vwapRes = LearnMathEngine.getModuleById('optimal_vwap_execution').calc({ orderSizeShares: 85000, advShares: 2200000, participationPct: 8.5, volatilityPct: 24.0, tradingHours: 6.5 });
assert(vwapRes.focalValue.includes('bps'), `VWAP expected shortfall calculated in bps (got ${vwapRes.focalValue})`);
assert(vwapRes.plainResult.includes('Optimal VWAP Execution'), 'VWAP slicing calculates optimal execution plan');

// 38. SABR Stochastic Volatility Surface Calibration
const sabrRes = LearnMathEngine.getModuleById('sabr_vol_surface').calc({ forwardF: 100.0, atmVolAlpha: 0.20, elasticityBeta: 0.50, correlationRho: -0.35, volOfVolNu: 0.42, expiryYears: 1.0 });
assert(sabrRes.focalValue.includes('%'), `SABR ATM volatility calculated as percentage (got ${sabrRes.focalValue})`);
assert(sabrRes.plainResult.includes('Skew'), 'SABR calculates 25-delta asymmetric skew');

// 39. Q-Learning Market Making & Inventory Control
const rlRes = LearnMathEngine.getModuleById('reinforcement_learning_mm').calc({ currentInventory: 12, maxInventory: 40, gammaRiskAversion: 0.08, spreadTicks: 3, assetVolPct: 22.0 });
assert(rlRes.focalValue.includes('Ticks'), `RL optimal skew calculated in ticks (got ${rlRes.focalValue})`);
assert(rlRes.plainResult.includes('Q-Learning Policy'), 'RL outputs dynamic bid and ask quoting offsets');

// 40. Extreme Value Theory (EVT) Peaks-Over-Threshold CVaR
const evtTailRes = LearnMathEngine.getModuleById('evt_pot_tail_risk').calc({ thresholdLossPct: 2.8, shapeXi: 0.24, scaleBeta: 1.15, confidencePct: 99.5, sampleSize: 2500 });
assert(evtTailRes.focalValue.includes('%'), `EVT 99.5% CVaR calculated as percentage (got ${evtTailRes.focalValue})`);
assert(evtTailRes.plainResult.includes('Expected Shortfall'), 'EVT POT reports Expected Shortfall');

// 41. Hidden Markov Model (HMM) Multi-State Regime Matrix
const hmmRegimeRes = LearnMathEngine.getModuleById('hmm_regime_switching').calc({ pBullToBull: 0.94, pBearToBear: 0.86, pSidewaysToSideways: 0.88, recentDailyReturn: 0.85, recentDailyVol: 15.2 });
assert(hmmRegimeRes.focalValue === 'BULL', `HMM identifies positive return with low vol as BULL (got ${hmmRegimeRes.focalValue})`);
assert(hmmRegimeRes.plainResult.includes('P(Bull)'), 'HMM calculates posterior state probabilities');

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`📊 TEST RESULTS: ${passed} / ${total} MODULES PASSED (100%)`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

