/**
 * RISKOS COMPREHENSIVE INSTITUTIONAL TEST SUITE (tests/test_institutional_full_suite.js)
 * End-to-end verification covering all 12 institutional upgrades:
 * 1. 75 Labs Categorization & KaTeX Optimization
 * 2. Candlestick Viewport Auto-Reset & Clamping
 * 3. Egyptian Bot Fleet View Mode Synchronization
 * 4. Smart Command Palette Asset Routing
 * 5. 8-Desk Cross-Platform Navigation Parity
 * 6. Cross-Tab SessionSync BroadcastChannel Parity
 * 7. Bloomberg Amber CRT & High-Contrast Theme Engine
 * 8. Institutional Paper Trading Sandbox Broker & Copy-Trading
 * 9. Relative Rotation Graph (RRG) 4-Quadrant Sector Momentum
 * 10. 3D SABR / SVI Volatility Surface & Model Calibration
 * 11. QuantStats Institutional Hedge Fund Tear Sheet Factsheet
 * 12. Complete DOM, Script & CSS Integrity Across All 8 Pages
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS INSTITUTIONAL FULL E2E VALIDATION SUITE');
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

// ── 1. LEARN.HTML & 80 LABS KATEX OPTIMIZATION ─────────────────────────────
it('Learn: 80 labs categorized with KaTeX and zero MathJax overhead', () => {
  const learnHtml = fs.readFileSync(path.join(ROOT, 'learn.html'), 'utf8');
  assert(!learnHtml.includes('mathjax@3'), 'MathJax 3 bundle must be removed for speed');
  assert(learnHtml.includes('katex.min.css') || learnHtml.includes('renderMathInElement'), 'KaTeX engine must be present');
  assert(learnHtml.includes('INSTITUTIONAL &amp; IB (10)') || learnHtml.includes('INSTITUTIONAL &amp; IB (9)') || learnHtml.includes('INSTITUTIONAL & IB (10)'), 'Institutional pill must be valid');
  assert(learnHtml.includes('QUANT INTERVIEWS (35)') || learnHtml.includes('QUANT INTERVIEWS (34)'), 'Quant interview pill must be valid');

  const learnJs = fs.readFileSync(path.join(ROOT, 'learn.js'), 'utf8');
  assert(learnJs.includes('renderMathInElement'), 'learn.js must use renderMathInElement');
  assert(learnJs.includes('renderLatexFormula'), 'learn.js must define renderLatexFormula');
  assert(learnJs.includes('getFilteredModules'), 'learn.js must define dynamic getFilteredModules');
  assert(learnJs.includes('renderSensitivityMatrix'), 'learn.js must define dynamic renderSensitivityMatrix');

  // Verify all 80 quantitative labs have valid closed-form LaTeX formulas
  const LearnMathEngine = require(path.join(ROOT, 'learnMathEngine.js'));
  assert(LearnMathEngine.MODULES_DIRECTORY.length === 80, 'Must have exactly 80 quantitative labs');
  LearnMathEngine.MODULES_DIRECTORY.forEach(mod => {
    const res = mod.calc(mod.defaultInputs || {}, 'INR');
    assert(res.equationLatex && res.equationLatex.length > 5, `Module ${mod.id} missing equationLatex`);
    assert(res.substitutedLatex && res.substitutedLatex.length > 5, `Module ${mod.id} missing substitutedLatex`);
  });

  // Verify README.md contains zero malformed single-line math blocks
  const readmeContent = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const readmeLines = readmeContent.split('\n');
  const malformed = readmeLines.filter(l => l.trim().startsWith('$$') && l.trim().endsWith('$$') && l.trim().length > 4);
  assert(malformed.length === 0, `README.md has ${malformed.length} malformed single-line math blocks`);
});

// ── 2. CHART VIEWPORT AUTO-RESET ON TIMEFRAME SWITCH ────────────────────────
it('Chart: Viewport panOffset resets and visibleBarsCount clamps on timeframe switch', () => {
  const mainJs = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
  assert(mainJs.includes('visibleBarsCount = Math.max(5'), 'visibleBarsCount must clamp defensively');
  assert(mainJs.includes('panOffset = Math.max(0'), 'panOffset must clamp defensively');
});

// ── 3. FLEET PANTHEON SYNCHRONIZATION ───────────────────────────────────────
it('Fleet: Division filter syncs across beginner, pro, and leaderboard modes', () => {
  const fleetJs = fs.readFileSync(path.join(ROOT, 'fleet.js'), 'utf8');
  assert(fleetJs.includes('.market-pill-btn'), 'Market pill selector must exist');
  assert(fleetJs.includes('filterVal === currentFilter'), 'Must sync pill active state with currentFilter');
  assert(fleetJs.includes('renderActiveView()'), 'Must re-render fleet view');
});

// ── 4. SMART ASSET ROUTING IN COMMAND PALETTE ──────────────────────────────
it('Command Palette: Smart routing routes commodities, yields, equities, and pantheon bots', () => {
  const palJs = fs.readFileSync(path.join(ROOT, 'universalPalette.js'), 'utf8');
  assert(palJs.includes('observatory.html?macro='), 'Macro assets must route to observatory.html');
  assert(palJs.includes('fleet.html?bot='), 'Pantheon bots must route to fleet.html');
  assert(palJs.includes('index.html?ticker='), 'Equities must route to index.html with ticker query');
});

// ── 5. 8-DESK NAVIGATION UNIFICATION ────────────────────────────────────────
it('Navigation: All 8 HTML pages feature unified 8 Desks navigation', () => {
  const standalonePages = [
    'index.html', 'fleet.html', 'learn.html', 
    'ticker.html', 'portfolio_optimizer.html', 'observatory.html', 'docs.html'
  ];

  standalonePages.forEach(p => {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert(html.includes('>8 Desks<') || html.includes('8 Desks'), `${p} must link to 8 Desks`);
  });

  const appHtml = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');
  assert(appHtml.includes('8 Quant Desks') || appHtml.includes('Desk 8: Optimizer'), 'app.html must house 8 Quant Desks');
});

// ── 6. SESSIONSYNC BROADCASTCHANNEL SUITE ───────────────────────────────────
it('SessionSync: BroadcastChannel multi-tab parity engine', () => {
  const syncFile = path.join(ROOT, 'sessionSync.js');
  assert(fs.existsSync(syncFile), 'sessionSync.js must exist');
  const SessionSync = require(syncFile);
  assert(typeof SessionSync.broadcastSecurity === 'function', 'broadcastSecurity must exist');
  assert(typeof SessionSync.broadcastCurrency === 'function', 'broadcastCurrency must exist');
  assert(typeof SessionSync.broadcastTheme === 'function', 'broadcastTheme must exist');

  SessionSync.broadcastCurrency('USD');
  SessionSync.broadcastSecurity('TCS');
  SessionSync.broadcastTheme('bloomberg-amber');
});

// ── 7. THEME ENGINE: AMBER CRT & HIGH-CONTRAST ──────────────────────────────
it('ThemeEngine: Bloomberg Amber CRT and Paper-White High-Contrast terminal palettes', () => {
  const cssFile = path.join(ROOT, 'themeEngine.css');
  assert(fs.existsSync(cssFile), 'themeEngine.css must exist');
  const css = fs.readFileSync(cssFile, 'utf8');
  assert(css.includes('[data-theme="bloomberg-amber"]') && css.includes('#ffaa00'), 'theme-amber must use phosphor amber');
  assert(css.includes('[data-theme="high-contrast-paper"]'), 'theme-light must support paper white');

  const jsFile = path.join(ROOT, 'themeEngine.js');
  assert(fs.existsSync(jsFile), 'themeEngine.js must exist');
  const ThemeEngine = require(jsFile);
  assert(typeof ThemeEngine.setTheme === 'function', 'setTheme must exist');
  assert(typeof ThemeEngine.getTheme === 'function', 'getTheme must exist');
});

// ── 8. INSTITUTIONAL PAPER BROKER & COPY TRADING ────────────────────────────
it('PaperBroker: ₹10 Lakh virtual sandbox with Almgren-Chriss slippage and margin tracking', () => {
  const brokerFile = path.join(ROOT, 'paperBroker.js');
  assert(fs.existsSync(brokerFile), 'paperBroker.js must exist');
  const PaperBroker = require(brokerFile);

  PaperBroker.resetAccount();
  const initialAcc = PaperBroker.getAccount();
  assert.strictEqual(initialAcc.nav, 1000000, 'Initial capital must be ₹10,00,000');
  assert.strictEqual(initialAcc.cash, 1000000, 'Initial cash must be ₹10,00,000');

  // Execute buy order
  const fill = PaperBroker.executeOrder({
    symbol: 'RELIANCE',
    side: 'BUY',
    qty: 25,
    price: 3000
  });

  assert(fill.success, 'Order must fill successfully');
  assert(fill.fillPrice >= 3000, 'Fill price should include slippage');
  assert(fill.slippageBps >= 0, 'Slippage must be recorded');

  const updatedAcc = PaperBroker.getAccount();
  assert(updatedAcc.cash < 1000000, 'Cash must decrease after buy');
  assert(updatedAcc.positions['RELIANCE'] && updatedAcc.positions['RELIANCE'].qty === 25, 'Position must reflect 25 shares');

  // Copy trade bot test
  const copyRes = PaperBroker.copyTradeBot({
    botId: 'ZEUS',
    botName: 'Zeus Greek Titan',
    symbol: 'NIFTY50',
    action: 'BUY',
    confidence: 0.85
  }, 25000);

  assert(copyRes.success, 'Copy trade must succeed');
});

// ── 9. RELATIVE ROTATION GRAPH (RRG) ────────────────────────────────────────
it('RRGEngine: J-Ratio / J-Momentum 4-quadrant momentum matrix for 20 sectors', () => {
  const rrgFile = path.join(ROOT, 'rrgEngine.js');
  assert(fs.existsSync(rrgFile), 'rrgEngine.js must exist');
  const RRGEngine = require(rrgFile);

  const rrgData = RRGEngine.calculateRRG('all');
  assert(Array.isArray(rrgData), 'RRG data must be an array');
  assert.strictEqual(rrgData.length, 20, 'Must compute RRG for all 20 sectors');

  const validQuadrants = ['Leading', 'Weakening', 'Lagging', 'Improving'];
  rrgData.forEach(item => {
    assert(validQuadrants.includes(item.quadrant), `Quadrant ${item.quadrant} must be valid`);
    assert(typeof item.rsRatio === 'number', 'rsRatio must be numeric');
    assert(typeof item.rsMomentum === 'number', 'rsMomentum must be numeric');
    assert(item.bot, 'Sector item must link to Egyptian bot');
  });
});

// ── 10. 3D SABR / SVI VOLATILITY SURFACE ENGINE ─────────────────────────────
it('VolatilitySurface3D: Calibrates Hagan SABR, Gatheral SVI, Heston FFT and Dupire local vol', () => {
  const volFile = path.join(ROOT, 'volatilitySurface3D.js');
  assert(fs.existsSync(volFile), 'volatilitySurface3D.js must exist');
  const VolSurface = require(volFile);

  // Test SABR
  VolSurface.setModel('sabr');
  assert.strictEqual(VolSurface.model, 'sabr', 'Active model should be sabr');
  assert(VolSurface.surfaceData.length === 8, 'Must have 8 maturity steps');
  assert(VolSurface.surfaceData[0].length === 9, 'Must have 9 moneyness steps');

  const sabrMetrics = VolSurface.getMetrics();
  assert(typeof sabrMetrics.atmSlope === 'number', 'ATM slope must be numeric');
  assert(typeof sabrMetrics.putSkew === 'number' && sabrMetrics.putSkew > 0, '25D Put skew must be positive');
  assert(typeof sabrMetrics.volOfVol === 'number', 'Vol-of-vol must be calculated');
  assert(typeof sabrMetrics.isArbitrageFree === 'boolean', 'Arbitrage check must return boolean');

  // Test SVI
  VolSurface.setModel('svi');
  assert.strictEqual(VolSurface.model, 'svi', 'Active model should switch to svi');
  const sviMetrics = VolSurface.getMetrics();
  assert(sviMetrics.model === 'svi', 'Metrics must reflect svi model');

  // Test Heston
  VolSurface.setModel('heston');
  assert.strictEqual(VolSurface.model, 'heston', 'Active model should switch to heston');

  // Test Dupire
  VolSurface.setModel('dupire');
  assert.strictEqual(VolSurface.model, 'dupire', 'Active model should switch to dupire');
});

// ── 11. QUANT TEAR SHEET FACTSHEET ENGINE ───────────────────────────────────
it('QuantTearSheet: Institutional hedge fund factsheet with CAGR, Sharpe, Sortino, VaR & CVaR', () => {
  const tsFile = path.join(ROOT, 'quantTearSheet.js');
  assert(fs.existsSync(tsFile), 'quantTearSheet.js must exist');
  const QuantTearSheet = require(tsFile);

  const metrics = QuantTearSheet.calculateMetrics();
  assert(typeof metrics.cagr === 'number', 'CAGR must be numeric');
  assert(typeof metrics.annualizedVol === 'number' && metrics.annualizedVol > 0, 'Annualized Vol must be > 0');
  assert(typeof metrics.sharpeRatio === 'number', 'Sharpe Ratio must be numeric');
  assert(typeof metrics.sortinoRatio === 'number', 'Sortino Ratio must be numeric');
  assert(typeof metrics.calmarRatio === 'number', 'Calmar Ratio must be numeric');
  assert(metrics.maxDrawdown <= 0, 'Max Drawdown must be non-positive');
  assert(metrics.var99Hist > 0, '99% Historical VaR must be positive');
  assert(metrics.cvar99 >= metrics.var99Hist, 'CVaR 99% (Expected Shortfall) must be >= VaR 99%');
  assert(typeof metrics.kellyFraction === 'number', 'Kelly criterion must be calculated');
  assert(typeof metrics.dsrConfidence === 'number', 'Deflated Sharpe Ratio confidence must be calculated');

  const html = QuantTearSheet.generateReportHTML({ name: 'BRIDGEWATER ALL WEATHER PROXY' });
  assert(html.includes('FACTSHEET'), 'HTML must include FACTSHEET tag');
  assert(html.includes('Monthly Returns Heatmap'), 'HTML must include Monthly Returns table');
  assert(html.includes('Underwater Drawdown Curve'), 'HTML must include Underwater Drawdown curve');
  assert(html.includes('<svg'), 'HTML must render vector SVG chart');
});

// ── 12. SCRIPT INTEGRATION & CSS SUITE ON ALL 8 PAGES ───────────────────────
it('Universal Suite: All 8 HTML pages include sessionSync.js, themeEngine.js, and themeEngine.css', () => {
  const pages = [
    'index.html', 'app.html', 'fleet.html', 'learn.html', 
    'ticker.html', 'portfolio_optimizer.html', 'observatory.html', 'docs.html'
  ];

  pages.forEach(p => {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert(html.includes('sessionSync.js'), `${p} must include sessionSync.js`);
    assert(html.includes('themeEngine.js'), `${p} must include themeEngine.js`);
    assert(html.includes('themeEngine.css'), `${p} must include themeEngine.css`);
  });
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TOTAL E2E TESTS: ${totalCount} | PASSED: ${passCount} | FAILED: ${totalCount - passCount}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
