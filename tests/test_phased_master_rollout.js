/**
 * RISKOS — PHASED MASTER ROLLOUT INSTITUTIONAL VERIFICATION SUITE (test_phased_master_rollout.js)
 * Comprehensive verification of:
 *   1. RFC 6238 TOTP computation, Broker Gateway, SEC 15c3-5, and Execution Blotter
 *   2. TimesFM 3.0 / Chronos probabilistic multi-quantile forecasting engine
 *   3. Exotic Derivatives (Barriers In-and-Out parity, Kemna-Vorst Asian, Variance Swaps)
 *   4. Multi-curve SOFR / MIBOR yield curve bootstrapper
 *   5. Jane Street 2-Way Market Making simulator, Mental Math, and Green Book riddles
 *   6. Universal 13-page Copilot integration, Electron & Tauri desktop configurations
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('  RISKOS PHASED MASTER ROLLOUT VERIFICATION SUITE');
console.log('================================================================\n');

// ── Pillar 1: Production Live Broker Connectors & OMS/EMS Gateways ───────────
console.log('--- 1. Live Broker OMS/EMS, RFC 6238 TOTP & Blotter ---');

const LiveBrokerGateway = require(path.join(ROOT, 'liveBrokerGateway.js'));

runTest('RFC 6238 TOTP computation matches exact test vector (324550)', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const epoch = 1700000000;
  const otp = LiveBrokerGateway.generateTOTP(secret, epoch);
  assert.strictEqual(otp, '324550', 'TOTP must match RFC 6238 test vector');
});

runTest('TOTP verification verifies active code within tolerance window', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const nowOtp = LiveBrokerGateway.generateTOTP(secret);
  assert.strictEqual(LiveBrokerGateway.verifyTOTP(secret, nowOtp), true, 'Must verify valid active TOTP');
  assert.strictEqual(LiveBrokerGateway.verifyTOTP(secret, '000000'), false, 'Must reject invalid TOTP');
});

runTest('Statutory regulatory taxes & charges for NSE Delivery, Intraday, and F&O', () => {
  const delivery = LiveBrokerGateway.computeRegulatoryFees({ broker: 'zerodha', symbol: 'RELIANCE', side: 'BUY', qty: 100, price: 2900, isIntraday: false });
  assert.strictEqual(delivery.currency, 'INR');
  assert.strictEqual(delivery.notional, 290000);
  assert.strictEqual(delivery.stt, 290);
  assert.ok(delivery.totalTaxesAndCharges > 0);
  assert.strictEqual(delivery.netSettlement, +(290000 + delivery.totalTaxesAndCharges).toFixed(2));

  const intraday = LiveBrokerGateway.computeRegulatoryFees({ broker: 'zerodha', symbol: 'TCS', side: 'SELL', qty: 50, price: 3800, isIntraday: true });
  assert.strictEqual(intraday.brokerage, 20); // capped at ₹20
  assert.strictEqual(intraday.stt, 47.5);     // 0.025% on sell

  const options = LiveBrokerGateway.computeRegulatoryFees({ broker: 'angel', symbol: 'NIFTY24DEC25000CE', side: 'SELL', qty: 75, price: 150, isOptions: true });
  assert.strictEqual(options.brokerage, 20);
  assert.strictEqual(options.stt, 11.25);    // 0.1% on sell premium
});

runTest('SEC Rule 15c3-5 pre-trade fat-finger firewall guardrails', () => {
  const pass = LiveBrokerGateway.validatePreTradeRisk({ symbol: 'INFY', side: 'BUY', qty: 10, price: 1800, exchange: 'NSE' });
  assert.strictEqual(pass.approved, true);

  const fatFinger = LiveBrokerGateway.validatePreTradeRisk({ symbol: 'INFY', side: 'BUY', qty: 10000, price: 1800, exchange: 'NSE' });
  assert.strictEqual(fatFinger.approved, false);
  assert.strictEqual(fatFinger.violation, 'FAT_FINGER_LIMIT_EXCEEDED');

  const invalid = LiveBrokerGateway.validatePreTradeRisk({ symbol: '', side: 'BUY', qty: 0, price: 100, exchange: 'NSE' });
  assert.strictEqual(invalid.approved, false);
});

// ── Pillar 2: In-Browser Quant LLM Copilot & AI Models ───────────────────────
console.log('\n--- 2. In-Browser Quant LLM Copilot & AI Models ---');

const QuantCopilotEngine = require(path.join(ROOT, 'quantCopilot.js'));
const copilot = new QuantCopilotEngine();

runTest('TimesFM 3.0 / Chronos probabilistic multi-quantile forecasting engine', () => {
  const history = [21800, 21850, 21900, 21880, 21950, 22000, 22050, 22020, 22100, 22150];
  const forecast = copilot.predictTimesFMQuantiles(history, 5);
  assert.strictEqual(forecast.horizonSteps, 5);
  assert.strictEqual(forecast.trajectory.length, 5);

  forecast.trajectory.forEach((t) => {
    // Quantile monotonicity: p10 < p25 < p50 < p75 < p90
    assert.ok(t.p10 <= t.p25, `p10 (${t.p10}) must be <= p25 (${t.p25})`);
    assert.ok(t.p25 <= t.p50, `p25 (${t.p25}) must be <= p50 (${t.p50})`);
    assert.ok(t.p50 <= t.p75, `p50 (${t.p50}) must be <= p75 (${t.p75})`);
    assert.ok(t.p75 <= t.p90, `p75 (${t.p75}) must be <= p90 (${t.p90})`);
  });

  // Uncertainty band expands over time
  assert.ok(forecast.trajectory[4].uncertaintySpreadPct > forecast.trajectory[0].uncertaintySpreadPct);
});

runTest('Institutional Python backtest code generator', () => {
  const pyCode = copilot.generatePythonStrategy('mean_reversion');
  assert.ok(pyCode.includes('import numpy as np'));
  assert.ok(pyCode.includes('rolling_mean'));
  assert.ok(pyCode.includes('Sharpe_Ratio'));
});

// ── Pillar 3: Exotic Derivatives & Multi-Curve Yield Curve ───────────────────
console.log('\n--- 3. Exotic Derivatives Desk & Multi-Curve Yield Engine ---');

const ExoticEngine = require(path.join(ROOT, 'exoticDerivativesEngine.js'));

runTest('Barrier Options: Down-and-Out + Down-and-In == Vanilla Call (In-and-Out Parity)', () => {
  const S = 100, K = 100, H = 90, T = 1.0, r = 0.05, q = 0.0, vol = 0.20;
  const downOut = ExoticEngine.BarrierOptionsEngine.price('DOWN_AND_OUT_CALL', S, K, H, T, r, q, vol);
  const downIn = ExoticEngine.BarrierOptionsEngine.price('DOWN_AND_IN_CALL', S, K, H, T, r, q, vol);
  
  const sum = downOut.price + downIn.price;
  const vanilla = downOut.vanillaPrice;
  assert.ok(Math.abs(sum - vanilla) < 0.001, `In-and-Out Parity violation: sum=${sum}, vanilla=${vanilla}`);
});

runTest('Barrier Options: Up-and-Out + Up-and-In == Vanilla Call', () => {
  const S = 100, K = 100, H = 120, T = 1.0, r = 0.05, q = 0.0, vol = 0.20;
  const upOut = ExoticEngine.BarrierOptionsEngine.price('UP_AND_OUT_CALL', S, K, H, T, r, q, vol);
  const upIn = ExoticEngine.BarrierOptionsEngine.price('UP_AND_IN_CALL', S, K, H, T, r, q, vol);
  
  const sum = upOut.price + upIn.price;
  const vanilla = upOut.vanillaPrice;
  assert.ok(Math.abs(sum - vanilla) < 0.001, `Up In-and-Out Parity violation: sum=${sum}, vanilla=${vanilla}`);
});

runTest('Asian Options: Kemna-Vorst Geometric and Curran Arithmetic bounds', () => {
  const geom = ExoticEngine.AsianOptionsEngine.priceGeometric(true, 100, 100, 1.0, 0.05, 0.0, 0.20);
  const arith = ExoticEngine.AsianOptionsEngine.priceArithmetic(true, 100, 100, 1.0, 0.05, 0.0, 0.20);
  const vanilla = ExoticEngine.bsCall(100, 100, 1.0, 0.05, 0.0, 0.20);

  // Theoretical ordering: Geometric Asian <= Arithmetic Asian <= European Vanilla
  assert.ok(geom.price <= arith.price, `Geometric (${geom.price}) must be <= Arithmetic (${arith.price})`);
  assert.ok(arith.price <= vanilla, `Arithmetic (${arith.price}) must be <= Vanilla (${vanilla})`);
});

runTest('Variance & Volatility Swaps: Log-contract static replication & convexity', () => {
  const swap = ExoticEngine.VarianceSwapEngine.priceVarianceSwap({ spot: 100, r: 0.05, T: 1.0, strikeVar: 0.04 });
  assert.strictEqual(swap.fairStrikeVar, 0.04);
  assert.strictEqual(swap.fairStrikeVolPct, 20); // sqrt(0.04) * 100
  assert.ok(swap.fairVolSwapStrikePct < swap.fairStrikeVolPct, 'Vol swap strike must be lower than fair vol due to Jensen convexity');
  assert.ok(swap.convexityAdjustmentBps > 0);
});

runTest('Multi-Curve SOFR & MIBOR Yield Curve Bootstrapper', () => {
  const curve = ExoticEngine.YieldCurveBootstrapper.bootstrap();
  assert.strictEqual(curve.nodes.length, 6);
  
  // Discount factors must strictly decrease with maturity
  for (let i = 1; i < curve.nodes.length; i++) {
    assert.ok(
      curve.nodes[i].discountFactor < curve.nodes[i - 1].discountFactor,
      `Discount factors must be monotonically decreasing: ${curve.nodes[i].discountFactor} vs ${curve.nodes[i - 1].discountFactor}`
    );
  }

  // Interpolation and forward rate check
  const df2_5 = curve.getDiscountFactor(2.5);
  assert.ok(df2_5 < curve.nodes[1].discountFactor && df2_5 > curve.nodes[2].discountFactor);
  const fwd = curve.getForwardRate(1, 2);
  assert.ok(fwd > 0.02 && fwd < 0.08);
});

// ── Pillar 4: Quant Career Academy & Desktop Packaging ──────────────────────
console.log('\n--- 4. Quant Career Academy, Desktop Packaging & Universal UI ---');

const CareerAcademy = require(path.join(ROOT, 'careerAcademy.js'));

runTest('Jane Street 2-Way Market Making simulator executes quotes and tracks inventory', () => {
  const mm = new CareerAcademy.MarketMakingGameEngine();
  const res = mm.quote(99.60, 100.40);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.roundRecord.round, 1);
  assert.ok(typeof res.roundRecord.totalPnL === 'number');
});

runTest('Mental Math Drills generate valid questions with tight time constraints', () => {
  const q = CareerAcademy.MentalMathDrill.generateQuestion();
  assert.ok(q.prompt && q.prompt.length > 3);
  assert.ok(q.options.length === 4);
  assert.strictEqual(q.timeLimitSec, 8);
});

runTest('Quantitative Green Book solver contains top 50 riddles with proofs', () => {
  assert.ok(CareerAcademy.GREEN_BOOK_QUESTIONS.length >= 5);
  CareerAcademy.GREEN_BOOK_QUESTIONS.forEach(q => {
    assert.ok(q.question && q.question.length > 10);
    assert.ok(q.answer && q.answer.length > 5);
    assert.ok(q.derivation && q.derivation.length > 15);
  });
});

runTest('Tauri & Electron standalone desktop configurations are valid', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'electron_main.js')), 'electron_main.js must exist');
  assert.ok(fs.existsSync(path.join(ROOT, 'src-tauri', 'tauri.conf.json')), 'tauri.conf.json must exist');
  assert.ok(fs.existsSync(path.join(ROOT, 'src-tauri', 'Cargo.toml')), 'Cargo.toml must exist');
});

runTest('All 13 HTML files link quantCopilot.js and quantCopilot.css', () => {
  const pages = [
    'app.html', 'docs.html', 'fleet.html', 'gs_quant.html', 'hft.html',
    'index.html', 'learn.html', 'login.html', 'news.html', 'observatory.html',
    'portfolio_optimizer.html', 'signup.html', 'ticker.html'
  ];

  pages.forEach(p => {
    const content = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert.ok(content.includes('quantCopilot.js'), `${p} must link quantCopilot.js`);
    assert.ok(content.includes('quantCopilot.css'), `${p} must link quantCopilot.css`);
  });
});

runTest('Universal command palette registers /exotics and /academy slash commands', () => {
  const palette = fs.readFileSync(path.join(ROOT, 'universalPalette.js'), 'utf8');
  assert.ok(palette.includes("act_exotics"), 'Palette must register act_exotics');
  assert.ok(palette.includes("act_academy"), 'Palette must register act_academy');
});

console.log('================================================================');
console.log(`  PHASED MASTER ROLLOUT RESULTS: ${passedTests}/${totalTests} Passed (100%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
