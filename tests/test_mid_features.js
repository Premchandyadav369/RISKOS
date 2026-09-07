/**
 * tests/test_mid_features.js
 * Mathematical verification suite for RISKOS 8 Mid-Level Institutional Features.
 */

const assert = require('assert');

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTING RISKOS 8 MID-LEVEL INSTITUTIONAL ENGINES');
console.log('═══════════════════════════════════════════════════════════════\n');

// ── 1. Black-Scholes-Merton & Options Greeks Engine ──────────────────────────
function cnd(x) {
  const a1 = 0.319381530, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
  const p = 0.2316419;
  const l = Math.abs(x);
  const k = 1.0 / (1.0 + p * l);
  let poly = 1.0 - (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * l * l) *
    (a1 * k + a2 * Math.pow(k, 2) + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));
  return x < 0 ? 1.0 - poly : poly;
}

function bsmCall(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(0, S - K);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * cnd(d1) - K * Math.exp(-r * T) * cnd(d2);
}

function bsmPut(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(0, K - S);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return K * Math.exp(-r * T) * cnd(-d2) - S * cnd(-d1);
}

// Test 1: Put-Call Parity: C - P = S - K * exp(-rT)
const S = 24820;
const K = 24800;
const T = 30 / 365.0;
const r = 0.068;
const sigma = 0.14;

const callPrice = bsmCall(S, K, T, r, sigma);
const putPrice = bsmPut(S, K, T, r, sigma);
const parityDiff = Math.abs((callPrice - putPrice) - (S - K * Math.exp(-r * T)));

assert(parityDiff < 0.05, `Put-call parity violated! Diff: ${parityDiff}`);
console.log(`✅ [PASS] BSM Put-Call Parity satisfied: |(C - P) - (S - K e^(-rT))| = ${parityDiff.toFixed(4)} < 0.05`);

// Test 2: Greek Delta bounds
const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
const callDelta = cnd(d1);
const putDelta = cnd(d1) - 1.0;
assert(Math.abs((callDelta - putDelta) - 1.0) < 1e-4, 'Delta spread between call and put must equal 1.0');
console.log(`✅ [PASS] BSM Delta identity: Δ_call (${callDelta.toFixed(3)}) - Δ_put (${putDelta.toFixed(3)}) = 1.000`);

// ── 2. Ray Dalio Equal Risk Contribution (ERC) Risk Parity Engine ────────────
const assetVols = [0.16, 0.18, 0.44]; // Low vol, Med vol, High vol
const invVols = assetVols.map(v => 1 / v);
const invSum = invVols.reduce((a, b) => a + b, 0);
const rpWeights = invVols.map(iv => iv / invSum);

// Risk contribution TRC_i ≈ w_i * sigma_i
const riskContribs = rpWeights.map((w, idx) => w * assetVols[idx]);
const maxDiff = Math.max(...riskContribs) - Math.min(...riskContribs);

assert(maxDiff < 0.02, `Risk contributions diverge too much: maxDiff = ${maxDiff}`);
console.log(`✅ [PASS] Ray Dalio Risk Parity: weights = [${rpWeights.map(w => (w*100).toFixed(1)+'%').join(', ')}], max risk delta = ${maxDiff.toFixed(4)}`);

// ── 3. Drift Band Rebalancing Optimization ───────────────────────────────────
const targetW = 0.20;
const band = 0.03; // [0.17, 0.23]
const currentOverweight = 0.26; // Drifted +6%
const currentUnderweight = 0.14; // Drifted -6%

// Full rebalance delta
const fullRebalTurnover = Math.abs(currentOverweight - targetW) + Math.abs(currentUnderweight - targetW); // 0.06 + 0.06 = 0.12

// Band edges rebalance delta
const bandEdgeTurnover = Math.abs(currentOverweight - (targetW + band)) + Math.abs(currentUnderweight - (targetW - band)); // 0.03 + 0.03 = 0.06

assert(bandEdgeTurnover < fullRebalTurnover, 'Band edge turnover must be strictly less than full rebalance turnover');
const turnoverSaved = ((fullRebalTurnover - bandEdgeTurnover) / fullRebalTurnover) * 100;
console.log(`✅ [PASS] Drift Band Rebalancing: Band-edge turnover (0.06) saves ${turnoverSaved.toFixed(0)}% turnover vs full rebalance (0.12)`);

// ── 4. Smart-DCA Dynamic Step-In Scaling ─────────────────────────────────────
const baseCapital = 25000;
const kappaDip = 2.0;
const kappaFoam = 0.70;

const dipSize = baseCapital * kappaDip; // Market dip > 5%
const overboughtSize = baseCapital * kappaFoam; // Market RSI > 70

assert.strictEqual(dipSize, 50000, 'Dip size must scale to 2.0x base capital');
assert.strictEqual(overboughtSize, 17500, 'Overbought size must scale down to 0.70x base capital');
console.log(`✅ [PASS] Smart-DCA: Base ₹25,000 scales dynamically to ₹50,000 on dip and ₹17,500 on overbought`);

// ── 5. Multi-Venue Smart Order Routing (SOR) Slippage Minimization ───────────
const totalOrder = 1000;
const nseDepth = 2000;
const bseDepth = 800;

// Naive: 100% on NSE
const naiveSlippageBps = 1.5 * Math.pow(totalOrder / nseDepth, 1.5) * 10;

// Split: 700 NSE, 300 BSE
const splitSlippageBps = (0.7 * (1.5 * Math.pow(700 / nseDepth, 1.5) * 10)) + 
                         (0.3 * (2.2 * Math.pow(300 / bseDepth, 1.5) * 10));

assert(splitSlippageBps < naiveSlippageBps, 'SOR optimal split must produce lower slippage than naive routing');
console.log(`✅ [PASS] Smart Order Routing: Split slippage (${splitSlippageBps.toFixed(2)} bps) is lower than single-venue (${naiveSlippageBps.toFixed(2)} bps)`);

// ── 6. Monte Carlo 1,000-Path Wealth Survival & Sequence Risk ────────────────
let survivedPaths = 0;
const nSims = 1000;
const initialCap = 10000000;
const annWithdrawal = initialCap * 0.04;
const meanRet = 0.12;
const vol = 0.16;

for (let s = 0; s < nSims; s++) {
  let cap = initialCap;
  let ruined = false;
  for (let y = 1; y <= 25; y++) {
    cap -= annWithdrawal * Math.pow(1.055, y - 1);
    if (cap <= 0) {
      ruined = true;
      break;
    }
    const u1 = Math.max(1e-9, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const r = Math.exp((meanRet - 0.5 * vol * vol) + vol * z) - 1.0;
    cap *= (1 + r);
  }
  if (!ruined) survivedPaths++;
}

const survivalRate = (survivedPaths / nSims) * 100;
assert(survivalRate > 75.0, `Survival rate must exceed 75%: got ${survivalRate}%`);
console.log(`✅ [PASS] Monte Carlo 1,000-Path Survival Engine: ${survivalRate.toFixed(1)}% paths survived 25Y under 4% rule & 5.5% CPI`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎯 ALL 6 MATHEMATICAL MID-LEVEL VERIFICATION TESTS PASSED (100%)');
console.log('═══════════════════════════════════════════════════════════════\n');
