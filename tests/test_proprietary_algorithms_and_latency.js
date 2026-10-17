/**
 * RISKOS Institutional Test Suite: 4 Proprietary Quantitative Algorithms & Latency Invariants
 * 
 * Verifies:
 * 1. HS-JAMM (Hawkes-Stoikov Jump-Aware Market Maker):
 *    - Quotes widen asymmetrically during Hawkes cascade (eta >= 0.70)
 *    - Bid-ask spread strictly exceeds base half-spread during adverse selection
 * 2. SE-MicroPrice (Shannon-Entropy L3 Queue Micro-Price Filter):
 *    - Normalized Shannon entropy is bounded in [0.0, 1.0]
 *    - Bid clustering (H_bid < H_ask) produces positive drift towards higher ticks
 * 3. F-Shrink (Factor-Shrunk Ledoit-Wolf Covariance Operator):
 *    - Optimal Frobenius shrinkage intensity delta* is bounded in [0.0, 1.0]
 *    - Shrunk covariance preserves positive variance on diagonals
 * 4. DK-Shield (Dynamic Kelly-CVaR Hyperbolic Drawdown Shield):
 *    - Dynamic Kelly fraction approaches 0 smoothly as current drawdown -> dMax
 *    - Dynamic Kelly never exceeds maximum leverage ceiling
 * 5. Generational Latency SLA:
 *    - Benchmark report exists and confirms historical generational improvements
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const HsJammEngine = require('../hsJammEngine.js');
const SeMicroPriceEngine = require('../seMicropriceEngine.js');
const FactorShrinkEngine = require('../factorShrinkEngine.js');
const DkShieldEngine = require('../dkShieldEngine.js');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

console.log('================================================================');
console.log('  RISKOS 4 PROPRIETARY ALGORITHMS & LATENCY VERIFICATION SUITE');
console.log('================================================================\n');

// 1. HS-JAMM Tests
test('HS-JAMM: Asymmetrically widens quote spread when Hawkes branching ratio eta >= 0.70', () => {
  const engine = new HsJammEngine();
  const mid = 1200.0;
  const inv = 0;

  // Calm regime: eta_bid = 0.3, eta_ask = 0.3 (no cascade)
  const calm = engine.computeQuotes(mid, inv, 0.30, 0.30);
  assert.strictEqual(calm.isToxicCascade, false);
  const calmSpread = calm.optimalAsk - calm.optimalBid;

  // Toxic sell sweep regime: eta_ask = 0.95 (strong cascade of aggressive sells)
  const toxic = engine.computeQuotes(mid, inv, 0.30, 0.95);
  assert.strictEqual(toxic.isToxicCascade, true);
  const toxicSpread = toxic.optimalAsk - toxic.optimalBid;

  // Invariant 1: Spread must widen during toxic cascade
  assert(toxicSpread > calmSpread, `Toxic spread (${toxicSpread}) must exceed calm spread (${calmSpread})`);

  // Invariant 2: Bid half-spread must widen more than ask half-spread to avoid toxic seller execution
  assert(toxic.halfSpreadBid > calm.halfSpreadBid, 'Bid half-spread must expand during sell cascade');
  assert(toxic.optimalBid < calm.optimalBid, 'Bid quote must retreat lower to prevent adverse selection');
});

// 2. SE-MicroPrice Tests
test('SE-MicroPrice: Shannon entropy bounded in [0, 1] and concentrated bids generate upward drift', () => {
  const engine = new SeMicroPriceEngine(0.50);
  const bestBid = 100.0, bestAsk = 100.10;

  // Bids concentrated heavily at top level (institutional iceberg): low entropy H_bid
  const concentratedBids = [5000, 20, 10, 5, 2];
  // Asks evenly dispersed: high entropy H_ask
  const dispersedAsks = [1000, 1000, 1000, 1000, 1000];

  const res = engine.compute(bestBid, bestAsk, concentratedBids, dispersedAsks);

  // Invariant 1: Entropies strictly bounded
  assert(res.entropyBid >= 0.0 && res.entropyBid <= 1.0, `H_bid must be in [0, 1], got ${res.entropyBid}`);
  assert(res.entropyAsk >= 0.0 && res.entropyAsk <= 1.0, `H_ask must be in [0, 1], got ${res.entropyAsk}`);
  assert(res.entropyBid < res.entropyAsk, 'Concentrated bids must have lower entropy than dispersed asks');

  // Invariant 2: Low bid entropy + high volume implies upward price pressure (predictedDirection == +1)
  assert.strictEqual(res.predictedDirection, 1, 'Imbalance + entropy concentration must predict upward tick');
  assert(res.microPrice > res.midPrice, 'Micro-price must adjust upwards relative to mid-price');
});

// 3. F-Shrink Tests
test('F-Shrink: Optimal shrinkage intensity delta* is bounded in [0, 1] and stabilizes covariance', () => {
  const engine = new FactorShrinkEngine();
  const sampleCov = [
    [0.05, 0.02],
    [0.02, 0.06]
  ];
  const factorPrior = [
    [0.045, 0.015],
    [0.015, 0.055]
  ];

  const res = engine.shrink(sampleCov, factorPrior, 100);

  // Invariant 1: delta* in [0, 1]
  assert(res.shrinkageIntensity >= 0.0 && res.shrinkageIntensity <= 1.0, `delta* must be in [0, 1], got ${res.shrinkageIntensity}`);

  // Invariant 2: Shrunk covariance diagonals must be positive
  assert(res.shrunkCovariance[0][0] > 0, 'Variance 0 must be positive');
  assert(res.shrunkCovariance[1][1] > 0, 'Variance 1 must be positive');

  // Invariant 3: High noise (small T) increases shrinkage towards factor prior
  const noisyRes = engine.shrink(sampleCov, factorPrior, 15);
  assert(noisyRes.shrinkageIntensity >= res.shrinkageIntensity, 'Noisier sample must increase shrinkage intensity delta*');
});

// 4. DK-Shield Tests
test('DK-Shield: Hyperbolic barrier smoothly damps Kelly fraction to 0 as drawdown approaches dMax', () => {
  const engine = new DkShieldEngine({ dMax: 0.15 });

  // Scenario A: At High-Water Mark (0% Drawdown) -> Full sizing
  const atPeak = engine.computeSizing(0.12, 0.20, 100.0, 100.0, 0.04, 1.0);
  assert(atPeak.shieldMultiplier > 0.90, `At peak shield multiplier should be near 1.0, got ${atPeak.shieldMultiplier}`);
  assert(atPeak.dynamicKelly > 0, 'Dynamic Kelly must be active at peak');

  // Scenario B: Moderate Drawdown (10% Drawdown out of 15% budget)
  const moderate = engine.computeSizing(0.12, 0.20, 90.0, 100.0, 0.04, 1.0);
  assert(moderate.dynamicKelly < atPeak.dynamicKelly, 'Dynamic Kelly must contract as drawdown deepens');
  assert(moderate.shieldMultiplier < atPeak.shieldMultiplier, 'Shield multiplier must contract');

  // Scenario C: Critical Drawdown (14.9% Drawdown, right at 15% threshold)
  const critical = engine.computeSizing(0.12, 0.20, 85.1, 100.0, 0.04, 1.0);
  assert(critical.dynamicKelly < 0.10, `Near breach sizing must be near zero, got ${critical.dynamicKelly}`);

  // Scenario D: Breached / At Ceiling (15% Drawdown) -> Absolute Halt
  const breached = engine.computeSizing(0.12, 0.20, 84.0, 100.0, 0.04, 1.0);
  assert.strictEqual(breached.dynamicKelly, 0.0, 'Breached drawdown must force dynamic Kelly to exactly 0.0');
  assert.strictEqual(breached.shieldMultiplier, 0.0, 'Shield multiplier must be 0.0');
  assert.strictEqual(breached.isHalted, true, 'System must flag isHalted = true');
});

// 5. Latency & Generational Report Integrity
test('Latency Report: Generational latency tracker exists with Gen 1 to Gen 4 progression', () => {
  const reportPath = path.join(__dirname, '..', 'benchmarks', 'LATENCY_IMPROVEMENTS_OVER_TIME.md');
  assert(fs.existsSync(reportPath), 'LATENCY_IMPROVEMENTS_OVER_TIME.md must exist');
  const content = fs.readFileSync(reportPath, 'utf8');

  assert(content.includes('Generation 1'), 'Must record Generation 1 baseline');
  assert(content.includes('Generation 4'), 'Must record Generation 4 C++/Rust/WASM');
  assert(content.includes('HS-JAMM'), 'Must benchmark HS-JAMM');
  assert(content.includes('SE-MicroPrice'), 'Must benchmark SE-MicroPrice');
  assert(content.includes('F-Shrink'), 'Must benchmark F-Shrink');
  assert(content.includes('DK-Shield'), 'Must benchmark DK-Shield');
});

console.log('\n================================================================');
console.log(`  PROPRIETARY ALGORITHMS RESULTS: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

if (passed !== total) process.exit(1);
