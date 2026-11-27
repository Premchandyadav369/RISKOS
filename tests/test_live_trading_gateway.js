/**
 * RISKOS Test Suite: Universal Live Trading Gateway & Paper Execution Ledger
 * Architect: Premchand Yadav
 */

const assert = require('assert');
const { LiveTradingGateway, gateway } = require('../src/trading/liveTradingGateway.js');

console.log('================================================================');
console.log('  RISKOS LIVE TRADING GATEWAY & EXECUTION LEDGER TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
  }
}

it('Initializes with default Binance Crypto L2/L3 exchange configuration', () => {
  assert.ok(gateway, 'Gateway instance must exist');
  assert.strictEqual(gateway.activeExchange.id, 'binance');
  assert.strictEqual(gateway.isPaperTrading, true);
  assert.strictEqual(gateway.circuitBreakerActive, false);
});

it('Supports switching between crypto and equity exchanges (Coinbase, IBKR, Zerodha)', () => {
  const coinbase = gateway.setExchange('coinbase');
  assert.strictEqual(coinbase.id, 'coinbase');
  assert.strictEqual(gateway.activeExchange.id, 'coinbase');

  const ibkr = gateway.setExchange('ibkr');
  assert.strictEqual(ibkr.id, 'ibkr');
  assert.strictEqual(gateway.activeExchange.type, 'EQUITIES_DERIVATIVES');

  const zerodha = gateway.setExchange('zerodha');
  assert.strictEqual(zerodha.id, 'zerodha');

  // Reset back to Binance
  gateway.setExchange('binance');
});

it('Connects and disconnects smoothly emitting connection status events', () => {
  let eventFired = false;
  gateway.on('connectionStatus', (st) => { eventFired = true; });

  const conn = gateway.connect();
  assert.strictEqual(conn.status, 'CONNECTED');
  assert.strictEqual(gateway.isConnected, true);
  assert.strictEqual(eventFired, true);

  const disconn = gateway.disconnect();
  assert.strictEqual(disconn.status, 'DISCONNECTED');
  assert.strictEqual(gateway.isConnected, false);

  gateway.connect();
});

it('Executes Market Order with square-root market impact and settles in ledger', () => {
  gateway.ledger.reset();
  const fill = gateway.submitOrder({
    symbol: 'BTCUSDT',
    side: 'BUY',
    orderType: 'MARKET',
    price: 65000.0,
    qty: 2.0
  });

  assert.strictEqual(fill.side, 'BUY');
  assert.strictEqual(fill.fillQty, 2.0);
  assert.ok(fill.fillPrice >= 65000.0, 'Buy order must suffer non-negative slippage');
  assert.ok(fill.fee > 0, 'Must record exchange fee');

  const metrics = gateway.ledger.getPortfolioMetrics();
  assert.ok(metrics.totalEquity > 0);
  assert.ok(metrics.grossExposure > 0);
});

it('Submits and cancels limit orders respecting order state', () => {
  const limitOrder = gateway.submitOrder({
    symbol: 'BTCUSDT',
    side: 'BUY',
    orderType: 'LIMIT',
    price: 64500.0,
    qty: 1.0
  });

  assert.strictEqual(limitOrder.status, 'SUBMITTED');
  assert.strictEqual(gateway.ledger.openOrders.size, 1);

  const cancelRes = gateway.cancelOrder(limitOrder.orderId);
  assert.strictEqual(cancelRes.canceled, true);
  assert.strictEqual(gateway.ledger.openOrders.size, 0);
});

it('Hawkes supercritical cascade (eta >= 0.85) immediately triggers emergency circuit breaker and pulls open orders', () => {
  // Place resting limit quote
  gateway.submitOrder({
    symbol: 'BTCUSDT',
    side: 'BUY',
    orderType: 'LIMIT',
    price: 64800.0,
    qty: 5.0
  });
  assert.strictEqual(gateway.ledger.openOrders.size, 1);

  // Incoming market tick with supercritical Hawkes flash crash arrival
  gateway.updateMarketTick({
    midPrice: 64900.0,
    hawkesEta: 0.94 // Supercritical jump cascade!
  });

  assert.strictEqual(gateway.circuitBreakerActive, true, 'Hawkes eta >= 0.85 must activate circuit breaker');
  assert.ok(gateway.circuitBreakerReason.includes('HAWKES_SUPERCRITICAL_CASCADE'));
  assert.strictEqual(gateway.ledger.openOrders.size, 0, 'Circuit breaker must instantly pull all resting limit quotes');

  // Verify subsequent orders are rejected while breaker is active
  assert.throws(() => {
    gateway.submitOrder({ symbol: 'BTCUSDT', side: 'BUY', price: 64000.0, qty: 1.0 });
  }, /Circuit breaker is ACTIVE/);

  // Reset breaker
  gateway.resetCircuitBreaker();
  assert.strictEqual(gateway.circuitBreakerActive, false);
});

console.log('\n================================================================');
console.log(`  LIVE TRADING GATEWAY RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
