/**
 * RISKOS COMPREHENSIVE HEADLESS TEST HARNESS (tests/terminal_suite.js)
 * Automated verification suite for MicrostructureEngine, RiskGuardrails,
 * GeneticOptimizer, MarketSessionGateway, AuditLedger, and TerminalBus.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS INSTITUTIONAL QUANTITATIVE SUITE VERIFICATION');
console.log('══════════════════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let totalTests = 0;

const it = (name, testFn) => {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
};

// ── Test 1: Microstructure & L3 Limit Order Book ──────────────────────────
const MicrostructureEngine = require('../microstructureEngine.js');
it('MicrostructureEngine: Seeds depth and calculates inside touch', () => {
  const book = MicrostructureEngine.getBook('TEST-STOCK', 1000.0);
  assert(book.getBestBid() !== null, 'Best bid should not be null');
  assert(book.getBestAsk() !== null, 'Best ask should not be null');
  assert(book.getBestAsk() > book.getBestBid(), 'Ask must be greater than bid');
  assert(book.getSpread() > 0, 'Spread must be positive');
});

it('MicrostructureEngine: FIFO order execution matching', () => {
  const book = MicrostructureEngine.getBook('TEST-STOCK-FIFO', 500.0);
  const bestAsk = book.getBestAsk();
  const buyRes = book.submitOrder({
    id: 'BUY-ORDER-1',
    side: 'BUY',
    type: 'LIMIT',
    price: bestAsk,
    qty: 25
  });

  assert(buyRes.fills.length > 0, 'Limit order at or above ask must generate fills');
  assert.strictEqual(buyRes.remainingQty, 0, 'Order should be fully filled');
  assert.strictEqual(buyRes.fills[0].price, bestAsk, 'Fill price should match best ask');
});

it('MicrostructureEngine: Calculates OFI and VPIN toxicity', () => {
  const book = MicrostructureEngine.getBook('TEST-METRICS', 2400.0);
  const snap = book.getDepthSnapshot(10);
  assert(typeof snap.ofi === 'number', 'OFI must be a number');
  assert(snap.vpin >= 0 && snap.vpin <= 1, 'VPIN must be within [0, 1]');
  assert(snap.kyleLambda > 0, 'Kyle lambda must be positive');
});

// ── Test 2: Aladdin Pre-Trade Risk Guardrails ─────────────────────────────
const RiskGuardrails = require('../riskGuardrails.js');
it('RiskGuardrails: Approves standard compliant order', () => {
  const order = { botId: 'BOT-IN-01', symbol: 'NIFTY', side: 'BUY', price: 24680, qty: 50 };
  const touch = { bestBid: 24675, bestAsk: 24685, midPrice: 24680 };
  const res = RiskGuardrails.validatePreTradeOrder(order, touch);
  assert.strictEqual(res.approved, true, 'Standard compliant order must be approved');
});

it('RiskGuardrails: Rejects fat-finger collar deviation (> ±3%)', () => {
  const fatFingerOrder = { botId: 'BOT-IN-01', symbol: 'NIFTY', side: 'BUY', price: 28000, qty: 10 };
  const touch = { bestBid: 24675, bestAsk: 24685, midPrice: 24680 };
  const res = RiskGuardrails.validatePreTradeOrder(fatFingerOrder, touch);
  assert.strictEqual(res.approved, false, 'Fat-finger collar order must be rejected');
  assert.strictEqual(res.code, 'ERR_FAT_FINGER_COLLAR');
});

it('RiskGuardrails: Rejects over-notional order (> ₹50 Lakh)', () => {
  const hugeOrder = { botId: 'BOT-IN-01', symbol: 'NIFTY', side: 'BUY', price: 24680, qty: 5000, notional: 123400000 };
  const touch = { bestBid: 24675, bestAsk: 24685, midPrice: 24680 };
  const res = RiskGuardrails.validatePreTradeOrder(hugeOrder, touch);
  assert.strictEqual(res.approved, false, 'Over-notional order must be rejected');
  assert.strictEqual(res.code, 'ERR_NOTIONAL_CAP_EXCEEDED');
});

it('RiskGuardrails: Trips autonomous circuit breaker on drawdown (> 2.5%)', () => {
  RiskGuardrails.resetCircuitBreaker();
  const res = RiskGuardrails.updateEquityAndCheckDrawdown(9700000); // 3% drawdown on 1 Cr
  assert.strictEqual(res.circuitBreakerTripped, true, 'Circuit breaker must trip at 3% drawdown');
  assert.strictEqual(RiskGuardrails.isHalted(), true, 'isHalted must return true');
  RiskGuardrails.resetCircuitBreaker();
  assert.strictEqual(RiskGuardrails.isHalted(), false, 'Reset must clear halt state');
});

// ── Test 3: Autonomous Genetic Strategy Optimizer ────────────────────────
const GeneticOptimizer = require('../geneticOptimizer.js');
it('GeneticOptimizer: Runs 10 generations of parameter evolution', () => {
  const res = GeneticOptimizer.runEvolution(10, 12);
  assert(res.optimalChromosome !== null, 'Must return optimal chromosome');
  assert(res.history.length === 10, 'History must contain 10 generations');
  assert(res.optimalChromosome.fitness > 0, 'Fitness must be positive');
});

it('GeneticOptimizer: Runs 100-sim Monte Carlo resampling', () => {
  const res = GeneticOptimizer.runMonteCarlo1000(10000000, 30, 100);
  assert(res.p05INR < res.p50INR, '5th percentile must be lower than median');
  assert(res.p50INR < res.p95INR, 'Median must be lower than 95th percentile');
  assert(res.samplePaths.length > 0, 'Sample paths must be generated');
});

// ── Test 4: Multi-Session World Clock Gateway ────────────────────────────
const MarketSessionGateway = require('../marketSessionGateway.js');
it('MarketSessionGateway: Evaluates global sessions status', () => {
  const sessions = MarketSessionGateway.getSessionStatus();
  assert(sessions.length >= 5, 'Must evaluate at least 5 global sessions');
  const crypto = sessions.find(s => s.id === 'CRYPTO');
  assert(crypto.isOpen === true, 'Crypto must be open 24/7');
});

it('MarketSessionGateway: Generates Brownian bridge tick', () => {
  const tick = MarketSessionGateway.generateBrownianTick(1000.0, 0.02);
  assert(typeof tick === 'number', 'Tick must be a number');
  assert(tick > 500 && tick < 1500, 'Tick price must be reasonable');
});

// ── Test 5: Audit Ledger ─────────────────────────────────────────────────
const AuditLedger = require('../auditLedger.js');
it('AuditLedger: Records and retrieves trade fills in memory fallback', async () => {
  await AuditLedger.recordFill({
    tradeId: 'TEST-TRD-01',
    botId: 'BOT-IN-01',
    symbol: 'RELIANCE',
    side: 'BUY',
    price: 1287.0,
    qty: 100,
    slippageBps: 2.1,
    pnlINR: 1250,
    timestamp: Date.now()
  });

  const fills = AuditLedger.getRecentFills(10);
  assert(fills.length > 0, 'Must retrieve recorded fill');
  assert.strictEqual(fills[0].tradeId, 'TEST-TRD-01');
});

// ── Test 6: Cross-Hedging Synapse & Clash of the Pantheons ───────────────
const CrossHedgingSynapse = require('../crossHedgingSynapse.js');
it('CrossHedgingSynapse: Calculates minimum-variance cross-hedge ratio', () => {
  const metrics = CrossHedgingSynapse.calculateHedgeRatio('BOT-IN-01', 'BOT-US-01', 10.0);
  assert(metrics.correlation !== 0, 'Correlation must be non-zero');
  assert(typeof metrics.hedgeRatio === 'number', 'Hedge ratio must be a number');
  assert(metrics.recommendedHedgeNotional > 0, 'Hedge notional must be positive');
});

it('CrossHedgingSynapse: Executes cross-hedge and records FIX 4.4 tag', () => {
  const hedge = CrossHedgingSynapse.executeCrossHedge(
    { id: 'BOT-IN-01', mythName: 'THANATOS', market: 'india' },
    { id: 'BOT-US-01', mythName: 'ODIN', market: 'us' },
    'GAMMA_SPIKE',
    350000
  );
  assert(hedge.id.startsWith('HEDGE-'), 'Hedge ID must follow format');
  assert.strictEqual(hedge.status, 'ACTIVE_HEDGE');
  assert(hedge.fixTag.includes('37=CROSS_HEDGE_SYNAPSE'), 'Must contain FIX tag');
});

// ── Test 7: AI Risk Copilot & Quant Whisperer ─────────────────────────────
const QuantWhisperer = require('../quantWhisperer.js');
it('QuantWhisperer: Resolves natural language quant queries', () => {
  const mockBots = [
    { id: 'BOT-IN-01', mythName: 'THANATOS', sentimentScore: -0.4, sentimentRegime: 'BEARISH_HEDGE', sharpeRatio: 3.8, winRate: 78 },
    { id: 'BOT-US-07', mythName: 'LOKI', sentimentScore: 0.9, sentimentRegime: 'EXTREME_GREED_HARVEST', sharpeRatio: 5.42, winRate: 98.2 }
  ];

  const deltaRes = QuantWhisperer.ask('which bots have negative delta', { bots: mockBots });
  assert.strictEqual(deltaRes.category, 'EXPOSURE_QUERY');
  assert(deltaRes.data.length >= 1, 'Must find negative delta bot');

  const sharpeRes = QuantWhisperer.ask('top sharpe leader', { bots: mockBots });
  assert.strictEqual(sharpeRes.category, 'PERFORMANCE_QUERY');
  assert(sharpeRes.data[0].deity === 'LOKI', 'Top Sharpe leader should be LOKI');
});

// ── Test 8: Time-Travel Crisis Replay Simulator ───────────────────────────
const CrisisReplayEngine = require('../crisisReplayEngine.js');
it('CrisisReplayEngine: Simulates historical Black Swan stress tests', () => {
  const mockBots = [
    { id: 'BOT-IN-01', mythName: 'THANATOS', market: 'india', strategyType: '0DTE Theta' },
    { id: 'BOT-US-02', mythName: 'THOR', market: 'us', strategyType: 'Gamma Scalper' }
  ];

  const res = CrisisReplayEngine.simulateCrisis('2008_LEHMAN_BROTHERS', mockBots);
  assert(res.marketDropPct < 0, 'Market drop must be negative');
  assert(res.survivabilityScore >= 0 && res.survivabilityScore <= 100, 'Survivability must be 0-100%');
  assert(res.botOutcomes.length === 2, 'Must evaluate both bots');
});

// ── Test 9: 3D Volatility Surface Engine ──────────────────────────────────
const VolatilitySurface3D = require('../volatilitySurface3D.js');
it('VolatilitySurface3D: Generates SVI surface mesh and order book waterfall', () => {
  assert(VolatilitySurface3D.surfaceData.length > 0, 'Surface grid rows must exist');
  assert(VolatilitySurface3D.surfaceData[0].length > 0, 'Surface grid columns must exist');
  assert(VolatilitySurface3D.orderBookData.length > 0, 'Waterfall ticks must exist');
});

// ── Test 10: Dark Pool Hunter & Iceberg Detector ──────────────────────────
const DarkPoolHunter = require('../darkPoolHunter.js');
it('DarkPoolHunter: Detects iceberg order on hidden volume replenishment', () => {
  const iceberg = DarkPoolHunter.detectIceberg('RELIANCE.NS', 15000, 3000, 2940.0, 'BUY');
  assert(iceberg !== null, 'Must detect iceberg when executed > visible');
  assert(iceberg.estimatedHiddenQty >= 12000, 'Hidden quantity estimated correctly');
  assert(iceberg.confidence >= 0.70, 'Confidence must be institutional grade');

  const print = DarkPoolHunter.recordDarkPoolPrint('NVDA', 55000000, 118.5, 'BUY');
  assert(print.id.startsWith('DP-'), 'Dark pool print ID generated');
});

// ── Test 11: DEFCON Risk Matrix & Dead Man Switch ─────────────────────────
const DefconRiskMatrix = require('../defconRiskMatrix.js');
it('DefconRiskMatrix: Transitions defense postures and generates SHA-256 seal', () => {
  const transition = DefconRiskMatrix.setDefconLevel(3, 'VOLATILITY_EXPANSION_ALERT');
  assert.strictEqual(transition.newLevel, 3);
  assert.strictEqual(DefconRiskMatrix.getCurrentPosture().level, 3);
  assert(typeof transition.cryptoSha256 === 'string' && transition.cryptoSha256.length === 64, 'Must produce valid 64-char SHA-256 hex');

  const qRecord = DefconRiskMatrix.quarantineBot('BOT-US-06', 'COLLAR_BREACH');
  assert(DefconRiskMatrix.isBotQuarantined('BOT-US-06'), 'Bot should be in quarantine');
  DefconRiskMatrix.releaseBot('BOT-US-06');
  assert(!DefconRiskMatrix.isBotQuarantined('BOT-US-06'), 'Bot should be released');

  // Reset back to DEFCON 5
  DefconRiskMatrix.setDefconLevel(5, 'TEST_COMPLETE');
});

// ── Test 12: Executive Risk Memorandum Generator ──────────────────────────
const ExecutiveReportGenerator = require('../executiveReportGenerator.js');
it('ExecutiveReportGenerator: Compiles Goldman Sachs / Bridgewater memorandum', () => {
  const mockBots = [
    { id: 'BOT-IN-01', mythName: 'THANATOS', market: 'india', realizedPnlINR: 150000, totalTrades: 1200, sharpeRatio: 3.8, winRate: 75, mathFormula: 'Yield > 12%' }
  ];
  const data = ExecutiveReportGenerator.generateMemorandumData(mockBots);
  assert(data.title.includes('RISKOS'), 'Title should match');
  assert(data.strategies.length === 1, 'Must include strategy entry');

  const html = ExecutiveReportGenerator.renderReportHTML(data);
  assert(html.includes('RISKOS GLOBAL QUANTITATIVE ALPHA'), 'HTML must render header');
  assert(html.includes('THANATOS'), 'HTML must include deity name');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

