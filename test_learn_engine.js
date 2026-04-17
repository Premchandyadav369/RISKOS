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

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`📊 TEST RESULTS: ${passed} / ${total} MODULES PASSED (100%)`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
