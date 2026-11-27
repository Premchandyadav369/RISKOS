/**
 * RISKOS Test Suite: High-Performance Canvas Order Book Depth Heatmap
 * Architect: Premchand Yadav
 */

const assert = require('assert');
const BookDepthHeatmap = require('../src/trading/bookDepthHeatmap.js');

console.log('================================================================');
console.log('  RISKOS BOOK DEPTH HEATMAP TEST SUITE');
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

it('Instantiates BookDepthHeatmap without canvas in headless Node environment', () => {
  const heatmap = new BookDepthHeatmap(null, { maxTimeSlices: 100, priceTiers: 30 });
  assert.ok(heatmap, 'Instance must exist');
  assert.strictEqual(heatmap.maxTimeSlices, 100);
  assert.strictEqual(heatmap.priceTiers, 30);
  assert.strictEqual(heatmap.timeSlices.length, 0);
});

it('Accumulates LOB depth snapshots and maintains sliding rolling window', () => {
  const heatmap = new BookDepthHeatmap(null, { maxTimeSlices: 5, priceTiers: 5 });

  for (let i = 0; i < 10; i++) {
    heatmap.addSnapshot({
      midPrice: 100.0 + i,
      bids: [[99.0 + i, 1000], [98.0 + i, 2000]],
      asks: [[101.0 + i, 1200], [102.0 + i, 2400]]
    }, {
      reservationPrice: 100.1 + i,
      optimalBid: 99.5 + i,
      optimalAsk: 100.7 + i,
      isHawkesShutdown: false
    });
  }

  assert.strictEqual(heatmap.timeSlices.length, 5, 'Must clamp to maxTimeSlices = 5');
  assert.strictEqual(heatmap.timeSlices[4].midPrice, 109.0, 'Last slice must be latest tick');
});

it('Calculates non-linear density color coding for liquidity depth', () => {
  const heatmap = new BookDepthHeatmap(null);
  
  const lowVolColor = heatmap.getDensityColor(10, 1000, true);
  const midVolColor = heatmap.getDensityColor(350, 1000, true);
  const heavyVolColor = heatmap.getDensityColor(700, 1000, true);
  const icebergColor = heatmap.getDensityColor(950, 1000, true);

  assert.ok(lowVolColor.includes('15, 23, 42'), 'Low volume must use dark slate tone');
  assert.ok(midVolColor.includes('14, 116, 144'), 'Medium bid must use cyan tone');
  assert.ok(heavyVolColor.includes('16, 185, 129'), 'Heavy bid must use emerald tone');
  assert.ok(icebergColor.includes('239, 68, 68'), 'Extreme wall must use crimson tone');
});

it('Stores market trade sweeps and flags iceberg orders correctly', () => {
  const heatmap = new BookDepthHeatmap(null);

  heatmap.addTrade({ price: 100.5, qty: 50.0, side: 'BUY', isSweep: true, isIceberg: false });
  heatmap.addTrade({ price: 100.2, qty: 500.0, side: 'SELL', isSweep: false, isIceberg: true });

  assert.strictEqual(heatmap.marketTrades.length, 2);
  assert.strictEqual(heatmap.marketTrades[0].isSweep, true);
  assert.strictEqual(heatmap.marketTrades[1].isIceberg, true);
});

console.log('\n================================================================');
console.log(`  BOOK DEPTH HEATMAP RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
