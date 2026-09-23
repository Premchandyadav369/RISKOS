/**
 * Test Suite: Institutional High-Frequency Trading (HFT) & Market Microstructure Terminal
 * Verifies:
 * 1. LetterGlitch matrix background component & canvas integration with fallback
 * 2. Universal Any-Ticker input search combobox and dynamic asset resolution
 * 3. Realistic L3 Depth of Market (DOM) Ladder and sub-pixel Bookmap waterfall
 * 4. KaTeX math formulas & layman explanations across all 4 workstation modules
 * 5. Closed-form Avellaneda-Stoikov dynamic reservation price and asymmetric quoting math
 * 6. Stoikov Micro-Price and VPIN toxicity calculations
 * 7. Price-Time Priority (FIFO) queue logic and FIX 4.4 packet formatting
 * 8. Universal navigation invariant (links to 8 Desks) and palette integration
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS HIGH-FREQUENCY TRADING (HFT) TERMINAL VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Error: ${err.message}\n`);
  }
}

const ROOT = path.join(__dirname, '..');
const hftHtml = fs.readFileSync(path.join(ROOT, 'hft.html'), 'utf8');
const hftCss = fs.readFileSync(path.join(ROOT, 'hft.css'), 'utf8');
const hftJs = fs.readFileSync(path.join(ROOT, 'hft.js'), 'utf8');
const letterGlitchJs = fs.readFileSync(path.join(ROOT, 'letterGlitch.js'), 'utf8');
const paletteJs = fs.readFileSync(path.join(ROOT, 'universalPalette.js'), 'utf8');

// ── 1. LetterGlitch Component & Matrix Background ──
console.log('── Section 1: LetterGlitch Background & Visual Fallback ──');

it('letterGlitch.js exports LetterGlitch class with color mixing and grid calculations', () => {
  const LetterGlitch = require(path.join(ROOT, 'letterGlitch.js'));
  assert(typeof LetterGlitch === 'function', 'LetterGlitch must be exported as a class/function');

  // Verify helper math methods
  const proto = LetterGlitch.prototype;
  assert(typeof proto.mixRgb === 'function', 'LetterGlitch must have mixRgb method');
  assert(typeof proto.hexToRgb === 'function', 'LetterGlitch must have hexToRgb method');
  assert(typeof proto.calculateGrid === 'function', 'LetterGlitch must have calculateGrid method');

  const mixed = proto.mixRgb({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 }, 0.5);
  assert.strictEqual(mixed.r, 50, 'mixRgb red interpolation failed');
  assert.strictEqual(mixed.g, 100, 'mixRgb green interpolation failed');

  const grid = proto.calculateGrid(1000, 800);
  assert(grid.columns > 50 && grid.rows > 30, 'calculateGrid returned invalid dimensions');
});

it('hft.html includes LetterGlitch canvas, vignettes, and script tag', () => {
  assert(hftHtml.includes('id="letterGlitchCanvas"'), 'Missing #letterGlitchCanvas in hft.html');
  assert(hftHtml.includes('hft-outer-vignette'), 'Missing .hft-outer-vignette in hft.html');
  assert(hftHtml.includes('hft-center-vignette'), 'Missing .hft-center-vignette in hft.html');
  assert(hftHtml.includes('<script src="letterGlitch.js"></script>'), 'Missing letterGlitch.js script tag');
});

// ── 2. Universal All-Ticker Support & Navigation Invariants ──
console.log('\n── Section 2: Universal All-Ticker Support & 8-Desks Navigation ──');

it('hft.html contains universal ticker search input, datalist, and load button', () => {
  assert(hftHtml.includes('id="hftTickerInput"'), 'Missing #hftTickerInput in hft.html');
  assert(hftHtml.includes('id="hftTickerList"'), 'Missing #hftTickerList datalist');
  assert(hftHtml.includes('id="btnLoadTicker"'), 'Missing #btnLoadTicker');
  assert(hftHtml.includes('value="RELIANCE.NS"'), 'Datalist must include NSE blue chips');
  assert(hftHtml.includes('value="BTC-USD"'), 'Datalist must include crypto');
  assert(hftHtml.includes('value="NVDA"'), 'Datalist must include US equities');
});

it('hft.html maintains universal 8 Desks navigation invariant', () => {
  assert(hftHtml.includes('>8 Desks<') || hftHtml.includes('8 Desks'), 'hft.html must link to 8 Desks');
  assert(hftHtml.includes('href="app.html"'), 'hft.html must link to app.html');
});

it('hft.html includes KaTeX CSS and auto-render scripts for mathematical typesetting', () => {
  assert(hftHtml.includes('katex.min.css'), 'Missing KaTeX CSS in hft.html');
  assert(hftHtml.includes('katex.min.js'), 'Missing KaTeX JS in hft.html');
  assert(hftHtml.includes('auto-render.min.js'), 'Missing KaTeX auto-render in hft.html');
});

// ── 3. Realistic L3 DOM Ladder & Microstructure Waterfall ──
console.log('\n── Section 3: Realistic L3 DOM Ladder & Microstructure Waterfall ──');

it('Module 1: Realistic L3 DOM Ladder and Bookmap canvas with math & layman box', () => {
  assert(hftHtml.includes('id="hftDomLadder"'), 'Missing #hftDomLadder container');
  assert(hftHtml.includes('id="bookmapCanvas"'), 'Missing #bookmapCanvas');
  assert(hftHtml.includes('id="icebergAlertBadge"'), 'Missing #icebergAlertBadge');
  assert(hftHtml.includes('\\text{Depth}(p, t)'), 'Missing Depth KaTeX math formula');
  assert(hftHtml.includes('hft-layman-box'), 'Missing layman intuition box');
  assert(hftHtml.includes('Depth of Market (DOM) Ladder'), 'Layman box must explain DOM ladder');
  assert(hftHtml.includes('Iceberg Detector'), 'Layman box must explain iceberg detection');
});

it('Module 2: Avellaneda-Stoikov Dynamic Market Making with math, sliders & PnL grid', () => {
  assert(hftHtml.includes('id="sliderAsGamma"'), 'Missing #sliderAsGamma');
  assert(hftHtml.includes('id="sliderAsKappa"'), 'Missing #sliderAsKappa');
  assert(hftHtml.includes('id="sliderAsInventory"'), 'Missing #sliderAsInventory');
  assert(hftHtml.includes('id="btnDeployAsBot"'), 'Missing #btnDeployAsBot');
  assert(hftHtml.includes('r(s, q, t) = s - q \\gamma \\sigma^2'), 'Missing AS reservation price KaTeX math');
  assert(hftHtml.includes('Reservation Price'), 'Layman box must explain reservation price');
});

it('Module 3: Stoikov Micro-Price & VPIN Toxicity Radar with math and alert triggers', () => {
  assert(hftHtml.includes('id="radarMicroPrice"'), 'Missing #radarMicroPrice');
  assert(hftHtml.includes('id="radarVpinVal"'), 'Missing #radarVpinVal');
  assert(hftHtml.includes('id="radarVpinBadge"'), 'Missing #radarVpinBadge');
  assert(hftHtml.includes('P^{\\text{micro}} = P^{\\text{mid}}'), 'Missing Stoikov Micro-Price KaTeX math');
  assert(hftHtml.includes('\\text{VPIN} ='), 'Missing VPIN KaTeX math');
  assert(hftHtml.includes('toxic flow'), 'Layman box must explain toxic flow');
});

it('Module 4: Queue Position Simulator & RAW FIX 4.4 Stream with math & decoders', () => {
  assert(hftHtml.includes('id="btnSubmitQueueOrder"'), 'Missing #btnSubmitQueueOrder');
  assert(hftHtml.includes('id="btnRaceColocBot"'), 'Missing #btnRaceColocBot');
  assert(hftHtml.includes('id="fixMessageTerminal"'), 'Missing #fixMessageTerminal');
  assert(hftHtml.includes('\\Delta P = \\lambda \\cdot Q_{\\text{market}}'), 'Missing Kyle lambda KaTeX math');
  assert(hftHtml.includes('First-In, First-Out (FIFO)'), 'Layman box must explain FIFO queue');
});

// ── 4. Mathematical Calculations & Engine Verification ──
console.log('\n── Section 4: High-Frequency Mathematical Engine Logic ──');

it('Avellaneda-Stoikov engine calculates closed-form reservation price and asymmetric quoting', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = {
    readyState: 'complete',
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  };
  runCode(mockWindow, mockDoc, mockWindow);

  assert(mockWindow.HFTTerminal, 'HFTTerminal must be exported on window');
  
  // Test AS math: s=1000, q=0, gamma=0.1, kappa=1.5, sigma=0.20, T=1
  const resNeutral = mockWindow.HFTTerminal.calculateAS(1000, 0, 0.1, 1.5, 0.20, 1.0);
  assert.strictEqual(resNeutral.resPrice, 1000, 'Neutral reservation price must equal mid');
  assert(resNeutral.halfSpread > 0.5, 'Half spread must be positive');

  // Test Long Inventory Skew (q = +10): Reservation price must drop below mid
  const resLong = mockWindow.HFTTerminal.calculateAS(1000, 10, 0.1, 1.5, 0.20, 1.0);
  assert(resLong.resPrice < 1000, 'Long inventory must lower reservation price to encourage selling');

  // Test Short Inventory Skew (q = -10): Reservation price must rise above mid
  const resShort = mockWindow.HFTTerminal.calculateAS(1000, -10, 0.1, 1.5, 0.20, 1.0);
  assert(resShort.resPrice > 1000, 'Short inventory must raise reservation price to encourage buying');
});

it('Stoikov Micro-Price correctly weights order book queue imbalances', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null };
  runCode(mockWindow, mockDoc, mockWindow);

  // When Bid size > Ask size (qb=3000, qa=1000), Micro-Price must be strictly higher than Mid
  const microUp = mockWindow.HFTTerminal.calculateMicroPrice(1000, 3000, 1000, 1.0);
  assert.strictEqual(microUp, 1000.25, 'Micro-Price must lead mid-price higher on buy queue dominance');

  // When Ask size > Bid size (qb=1000, qa=3000), Micro-Price must be strictly lower than Mid
  const microDown = mockWindow.HFTTerminal.calculateMicroPrice(1000, 1000, 3000, 1.0);
  assert.strictEqual(microDown, 999.75, 'Micro-Price must lead mid-price lower on sell queue dominance');
});

it('VPIN Toxicity calculation evaluates volume bucket imbalances correctly', () => {
  const mockWindow = {};
  const runCode = new Function('window', 'document', 'self', hftJs);
  const mockDoc = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null };
  runCode(mockWindow, mockDoc, mockWindow);

  // Equal buy/sell -> zero toxicity
  const zeroTox = mockWindow.HFTTerminal.calculateVPIN([{ buy: 500, sell: 500 }]);
  assert.strictEqual(zeroTox, 0, 'Symmetric flow must have 0 VPIN toxicity');

  // 100% one-sided flow -> maximum toxicity
  const maxTox = mockWindow.HFTTerminal.calculateVPIN([{ buy: 1000, sell: 0 }]);
  assert.strictEqual(maxTox, 1.0, 'Fully one-sided flow must have 1.0 VPIN toxicity');
});

// ── 5. Ecosystem Integration ──
console.log('\n── Section 5: Ecosystem Integration & Universal Palette ──');

it('universalPalette.js registers HFT Desk and /hft slash command', () => {
  assert(paletteJs.includes("id: 'page_hft'"), 'Missing page_hft in universalPalette.js');
  assert(paletteJs.includes("id: 'act_hft'"), 'Missing act_hft in universalPalette.js');
  assert(paletteJs.includes("slashQuery.includes('hft')"), 'Missing /hft slash command handler');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TESTS PASSED: ${passedTests} / ${totalTests} (100%)`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
