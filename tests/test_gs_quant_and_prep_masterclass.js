/**
 * RISKOS COMPREHENSIVE TEST SUITE: GS QUANT & QUANT PREP MASTERCLASS
 * Validates cross-asset pricing, market making algorithms, mental math,
 * Green Book derivations, and all 7 Institutional Flagship Systems.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  GS QUANT CROSS-ASSET & QUANT PREP MASTERCLASS VALIDATION SUITE');
console.log('══════════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let totalCount = 0;

function it(desc, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}\n`);
  }
}

// ── 1. GS QUANT CROSS-ASSET DERIVATIVES ENGINE ──────────────────────────────
it('GS Quant: Interest Rate Swaps (IRS), DV01, and Key-Rate Durations', () => {
  const GSQuant = require(path.join(ROOT, 'gsQuantEngine.js'));
  assert(typeof GSQuant.priceInterestRateSwap === 'function', 'priceInterestRateSwap must exist');

  const res = GSQuant.priceInterestRateSwap({
    notional: 10000000,
    fixedRate: 0.065,
    floatingSpread: 0.0,
    tenorYears: 5,
    curveRates: { '1Y': 0.062, '2Y': 0.063, '3Y': 0.064, '5Y': 0.065, '10Y': 0.068 }
  });

  assert(res.parSwapRate > 0.05 && res.parSwapRate < 0.08, 'Par swap rate must be reasonable');
  assert(res.dv01 > 0, 'DV01 must be strictly positive');
  assert(res.keyRateDurations['5Y'] !== undefined, '5Y Key rate duration must exist');
});

it('GS Quant: Single-Name CDS, Hazard Rates, CS01, and Jump-To-Default', () => {
  const GSQuant = require(path.join(ROOT, 'gsQuantEngine.js'));
  const res = GSQuant.priceCreditDefaultSwap({
    notional: 50000000,
    recoveryRate: 0.40,
    spreadBps: 150,
    tenorYears: 5
  });

  assert(res.hazardRate > 0.01 && res.hazardRate < 0.05, 'Hazard rate must be bootstrapped correctly');
  assert(res.cs01 > 0, 'CS01 must be strictly positive');
  assert(res.jumpToDefault === 30000000, 'JTD must equal Notional * (1 - Recovery)');
});

it('GS Quant: FX CIP Forwards and Risk Reversal / Fly Smile Reconstruction', () => {
  const GSQuant = require(path.join(ROOT, 'gsQuantEngine.js'));
  const res = GSQuant.priceFXForward({
    spotUSDINR: 83.50,
    domesticRateINR: 0.065,
    foreignRateUSD: 0.0525,
    tenorYears: 1.0,
    atmVol: 0.06,
    rr25D: 0.012,
    bf25D: 0.004
  });

  assert(res.forwardOutright > 83.50, 'Forward price must reflect positive interest differential');
  assert(res.smile25DPutVol !== undefined && res.smile25DCallVol !== undefined, 'Smile vols must be calculated');
  assert(res.smile25DPutVol > res.smile25DCallVol, 'Put vol must exceed Call vol under positive Risk Reversal skew');
});

it('GS Quant: Higher-Order Greeks (Vanna, Volga, Charm, Color) & Stress Matrix', () => {
  const GSQuant = require(path.join(ROOT, 'gsQuantEngine.js'));
  const greeks = GSQuant.calculateCrossAssetGreeks({
    spot: 24500,
    strike: 24500,
    expiryDays: 30,
    rate: 0.065,
    impliedVol: 0.15,
    optionType: 'call'
  });

  assert(greeks.delta > 0.45 && greeks.delta < 0.65, 'ATM call delta must be near 0.5');
  assert(greeks.vanna !== undefined, 'Vanna must be computed');
  assert(greeks.volga > 0, 'Volga (Vomma) of vanilla option must be strictly positive');
  assert(greeks.charm !== undefined, 'Charm must be computed');

  const stress = GSQuant.generateBumpAndRepriceMatrix({ spot: 24500, strike: 24500, expiryDays: 30, rate: 0.065, impliedVol: 0.15 });
  assert(stress.matrix.length > 0, 'Stress matrix must contain shock scenarios');
});

it('GS Quant: Idiomatic Goldman Sachs gs_quant Python Code Generator', () => {
  const GSQuant = require(path.join(ROOT, 'gsQuantEngine.js'));
  const pyCode = GSQuant.generateGSQuantPythonScript({ instrument: 'IRS', notional: 10000000, fixedRate: 0.065, tenor: '5y' });
  assert(pyCode.includes('import gs_quant'), 'Python script must import gs_quant');
  assert(pyCode.includes('IRSwap'), 'Python script must instantiate IRSwap');
  assert(pyCode.includes('calc(RiskMeasure.DollarPrice)'), 'Python script must compute dollar price');
});

// ── 2. ELITE QUANT INTERVIEW MASTERCLASS & RULES OF THUMB ───────────────────
it('Quant Prep: Jane Street / Optiver Market Making Game Simulator', () => {
  const QuantPrep = require(path.join(ROOT, 'quantPrepEngine.js'));
  assert(typeof QuantPrep.MarketMakingGame === 'function', 'MarketMakingGame must exist');

  const game = new QuantPrep.MarketMakingGame();
  const state0 = game.getState();
  assert(state0.round === 0, 'Initial round must be 0');
  assert(state0.inventory === 0, 'Initial inventory must be 0');

  // Submit aggressive quotes (Tight spread)
  const state1 = game.submitQuotes(99.5, 100.5);
  assert(state1.round === 1, 'Round must increment to 1');
  assert(typeof state1.nav === 'number', 'NAV must be a valid number');
});

it('Quant Prep: Fast Mental Math & Rules of Thumb', () => {
  const QuantPrep = require(path.join(ROOT, 'quantPrepEngine.js'));
  assert(Array.isArray(QuantPrep.MENTAL_MATH_RULES), 'MENTAL_MATH_RULES must be an array');

  // Rule of 16
  const rule16 = QuantPrep.MENTAL_MATH_RULES.find(r => r.id === 'rule_of_16_vol');
  const res16 = rule16.compute({ annualVolPct: 32 });
  assert.strictEqual(res16.dailyVolPct, 2.0, 'Rule of 16 for 32% vol must yield 2.0% daily move');

  // Rule of 72
  const rule72 = QuantPrep.MENTAL_MATH_RULES.find(r => r.id === 'rule_of_72_compounding');
  const res72 = rule72.compute({ cagrPct: 12 });
  assert.strictEqual(res72.doublingYears, 6.0, 'Rule of 72 for 12% CAGR must yield 6.0 years');
});

it('Quant Prep: Green Book Top 50 Problems (Monty Hall & Brownian Quadratic Variation)', () => {
  const QuantPrep = require(path.join(ROOT, 'quantPrepEngine.js'));
  const monty = QuantPrep.GREEN_BOOK_PROBLEMS.find(p => p.id === 'gb_01_monty_hall');
  assert(monty.quantProof.includes('Bayes'), 'Monty Hall must feature Bayesian derivation');
  const simMonty = monty.simulate(2000);
  assert(simMonty.switchWinRate > 60 && simMonty.switchWinRate < 73, 'Monty Hall switch win rate must hover around 66.7%');

  const brownian = QuantPrep.GREEN_BOOK_PROBLEMS.find(p => p.id === 'gb_02_brownian_quadratic_variation');
  const simBrownian = brownian.simulate(500, 1.0);
  assert(simBrownian.empiricalQV > 0.7 && simBrownian.empiricalQV < 1.3, 'Quadratic variation must converge near T=1.0');
});

it('Quant Prep: Ding Ran Local Volatility & PCA Eigen-Portfolios', () => {
  const QuantPrep = require(path.join(ROOT, 'quantPrepEngine.js'));
  const localVol = QuantPrep.computeDupireLocalVol({ spot: 100, strike: 100, timeYears: 0.5, impliedVol: 0.20, skewSlope: -0.05 });
  assert(localVol.localVol > 0, 'Local volatility must be strictly positive');

  const covMatrix = [
    [0.04, 0.02, 0.01],
    [0.02, 0.05, 0.02],
    [0.01, 0.02, 0.03]
  ];
  const pca = QuantPrep.computePCAEigenPortfolios(covMatrix, ['NIFTY', 'BANKNIFTY', 'IT']);
  assert(pca.factors.length === 3, 'Must produce 3 eigen-factors');
  assert(pca.factors[0].varianceExplainedPct > 50, 'Market eigen-mode PC1 must explain majority of variance');
});

// ── 3. THE 7 INSTITUTIONAL FLAGSHIP SYSTEMS ─────────────────────────────────
it('System 1: Autonomous Quant Copilot with pgvector Crisis Memory', () => {
  const QuantCopilot = require(path.join(ROOT, 'quantCopilot.js'));
  const copilot = new QuantCopilot();
  assert(copilot.crisesMemory.length >= 4, 'Must contain historical market crises');
  
  const simCmd = copilot.processAnalyticalCommand('Run a 10,000-path Monte Carlo on my active portfolio under a +200 bps rate shock.');
  assert(simCmd.type === 'MONTE_CARLO_RATES', 'Command must parse Monte Carlo rate shock');

  const screenCmd = copilot.processAnalyticalCommand('Screen for Indian mid-caps with Altman Z > 3, Piotroski F >= 8, and PEG < 1.');
  assert(screenCmd.type === 'SCREEN_MIDCAPS', 'Command must parse mid-cap screener');
});

it('System 2: L2/L3 Order Book DOM Ladder, Micro-Price & Algorithmic Orders', () => {
  const { OrderBookDOMEngine } = require(path.join(ROOT, 'orderBookDom.js'));
  const dom = new OrderBookDOMEngine({ midPrice: 24500, depthLevels: 10 });
  const micro = dom.getMicroPrice();
  assert(micro > 24000 && micro < 25000, 'Micro-price must be calculated near mid-price');
  assert(dom.getSpread() > 0, 'Spread must be strictly positive');

  // Iceberg Order
  const ice = dom.createIcebergOrder({ side: 'BUY', totalQuantity: 5000, visibleQuantity: 500, limitPrice: 24495 });
  assert(ice.type === 'ICEBERG' && ice.filledQuantity === 500, 'Iceberg must slice display quantities');

  // Bracket / OCO Order
  const bracket = dom.createBracketOrder({ side: 'BUY', quantity: 100, entryPrice: 24500, takeProfitPrice: 24650, stopLossPrice: 24420 });
  assert(bracket.type === 'BRACKET_OCO', 'Bracket order must instantiate');
  assert(bracket.legs.takeProfit.price === 24650, 'Take profit leg must match');
});

it('System 3: Brinson Factor Performance Attribution & Barra 6-Factor Radar', () => {
  const FactorAttribution = require(path.join(ROOT, 'factorAttribution.js'));
  const sectors = [
    { sector: 'Technology', weightPort: 0.30, returnPort: 0.15, weightBench: 0.20, returnBench: 0.12 },
    { sector: 'Financials', weightPort: 0.40, returnPort: 0.10, weightBench: 0.50, returnBench: 0.08 },
    { sector: 'Energy', weightPort: 0.30, returnPort: 0.05, weightBench: 0.30, returnBench: 0.04 }
  ];

  const attr = FactorAttribution.calculateBrinsonFachler(sectors);
  assert(typeof attr.totalAllocationPct === 'number', 'Allocation effect must be a number');
  assert(typeof attr.totalSelectionPct === 'number', 'Selection effect must be a number');
  assert(typeof attr.totalInteractionPct === 'number', 'Interaction effect must be a number');

  // Verify Brinson-Fachler Identity: Allocation + Selection + Interaction === Total Active Return
  const sumEffects = (attr.totalAllocationPct + attr.totalSelectionPct + attr.totalInteractionPct).toFixed(2);
  const totalActive = attr.activeReturnPct.toFixed(2);
  assert.strictEqual(sumEffects, totalActive, 'Sum of attribution components must equal Total Active Return');

  const barra = FactorAttribution.calculateBarra6Factors();
  assert(barra.factors.length === 6, 'Barra must contain 6 systematic factors');
  const svg = FactorAttribution.generateRadarChartSVG(barra.factors);
  assert(svg.includes('<svg') && svg.includes('polygon'), 'Must generate valid SVG radar chart');
});

it('System 4: Institutional Hedge Fund Tear Sheet Factsheet & SHA-256 Audit', () => {
  const HedgeFundTearSheet = require(path.join(ROOT, 'hedgeFundTearSheet.js'));
  const compiler = new HedgeFundTearSheet();
  const analytics = compiler.calculateAnalytics();

  assert(analytics.cagrPct > 0, 'CAGR must be positive');
  assert(analytics.sharpeRatio > 0, 'Sharpe ratio must be positive');
  assert(analytics.sortinoRatio >= analytics.sharpeRatio, 'Sortino ratio must be >= Sharpe for positively skewed return');
  assert(analytics.sha256Hash && analytics.sha256Hash.length === 64, 'Must compute valid 64-char SHA-256 hex hash');

  const printHtml = compiler.generatePrintableHTML();
  assert(printHtml.includes(analytics.sha256Hash), 'Printable HTML must embed the SHA-256 cryptographic audit hash');
});

it('System 5: Cryptographic Accreditation Certificates & RPG Skill Tree', () => {
  const { CertificateGenerator, QUANT_SKILL_TREE } = require(path.join(ROOT, 'accreditationCert.js'));
  const certData = CertificateGenerator.generateCertificateData({
    studentName: 'PRABHAT YADAV',
    completedModulesCount: 80,
    distinction: 'Summa Cum Laude'
  });

  assert(certData.verificationHash.length === 64, 'Verification hash must be valid SHA-256');
  assert(certData.accreditationId.startsWith('RISKOS-CERT-'), 'Accreditation ID must have prefix');

  const svg = CertificateGenerator.generateSVG(certData);
  assert(svg.includes('PRABHAT YADAV'), 'SVG must include student name');
  assert(svg.includes('OFFICIAL'), 'SVG must contain seal');

  assert(QUANT_SKILL_TREE.length === 4, 'Quant skill tree must contain 4 tiers');
});

it('System 6: Multi-Leg Options Strategy Visualizer & Greeks Heatmap', () => {
  const OptionsStrategyBuilder = require(path.join(ROOT, 'optionsStrategyBuilder.js'));
  const builder = new OptionsStrategyBuilder(24500, 0.065);
  builder.loadPreset('iron_condor');

  assert(builder.legs.length === 4, 'Iron condor must have 4 legs');
  const payoff = builder.calculateStrategyPayoff();
  assert(payoff.curveExp.length > 0, 'Expiration curve must be populated');
  assert(payoff.curveT0.length > 0, 'T+0 mark-to-market curve must be populated');
  assert(typeof payoff.netGreeks.delta === 'number', 'Net delta must be calculated');

  const stressHeatmap = builder.generateStressHeatmap();
  assert(stressHeatmap.matrix.length === 5, 'Heatmap must contain 5x5 stress grid');
});

it('System 7: Quant Arena Leaderboard & Multi-User Copy-Trading', () => {
  const { QuantArenaEngine, ARENA_STRATEGIES } = require(path.join(ROOT, 'quantArena.js'));
  const arena = new QuantArenaEngine();
  const sorted = arena.getLeaderboard('sortino');
  assert(sorted[0].sortinoRatio >= sorted[1].sortinoRatio, 'Leaderboard must sort descending by Sortino');

  // Copy-Trading Mirror
  const mirrorRes = arena.mirrorStrategyToPaperBroker(sorted[0].id);
  assert(mirrorRes.success === true, 'Strategy copy-trade mirroring must succeed');
});

// ── 4. HTML PAGE INTEGRITY & DESK PARITY ────────────────────────────────────
it('HTML Pages: GS Quant Desk and Masterclass links with unified 8 Desks parity', () => {
  const gsQuantHtml = fs.readFileSync(path.join(ROOT, 'gs_quant.html'), 'utf8');
  assert(gsQuantHtml.includes('>8 Desks<') || gsQuantHtml.includes('8 Desks'), 'gs_quant.html must link to 8 Desks');
  assert(gsQuantHtml.includes('GS Quant'), 'gs_quant.html must feature GS Quant branding');

  const learnHtml = fs.readFileSync(path.join(ROOT, 'learn.html'), 'utf8');
  assert(learnHtml.includes('gs_quant.html'), 'learn.html must link to gs_quant.html');
  assert(learnHtml.includes('Jane Street / Optiver MM Game'), 'learn.html must contain Jane Street game');
  assert(learnHtml.includes('Rule of 16'), 'learn.html must contain mental math Rule of 16');
  assert(learnHtml.includes('btnClaimCertificate'), 'learn.html must contain Claim Certificate button');
  assert(learnHtml.includes('btnExportTearSheet'), 'learn.html must contain Tear Sheet button');

  const docsHtml = fs.readFileSync(path.join(ROOT, 'docs.html'), 'utf8');
  assert(docsHtml.includes('gs-quant'), 'docs.html must document gs-quant');
  assert(docsHtml.includes('quant-prep'), 'docs.html must document quant-prep');
  assert(docsHtml.includes('institutional-systems'), 'docs.html must document institutional-systems');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TOTAL TESTS: ${totalCount} | PASSED: ${passCount} | FAILED: ${totalCount - passCount}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passCount !== totalCount) {
  process.exit(1);
}
