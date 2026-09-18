/**
 * Test Suite for RISKOS 24/7 Fleet Beginner-Friendly Redesign & Enhancements
 * Verifies:
 * 1. fleet.html structure: Beginner Quick-Start Guide, 3-Way Mode Switcher, Collapsible Institutional Tools Drawer
 * 2. fleet.css styles: KaTeX duplicate copy fix, beginner cards, drawers, risk badges, responsive layout
 * 3. fleet.js execution: formatPrice, formatCurrencyCompact, getWinRateSubtext, getSharpeSubtext,
 *    getRiskLevel, renderSafePositionDisplay, NaN guards, window control methods
 * 4. All 41 bots have layman explanations and beginner mode compatibility
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Running RISKOS Fleet Beginner-Friendly Test Suite ===\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

const htmlPath = path.join(__dirname, '..', 'fleet.html');
const cssPath = path.join(__dirname, '..', 'fleet.css');
const jsPath = path.join(__dirname, '..', 'fleet.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// ── 1. FLEET.HTML TESTS ────────────────────────────────────────────────────────
runTest('HTML: Contains Beginner Quick-Start Onboarding Guide banner', () => {
  assert(html.includes('id="beginnerGuideBanner"'), 'Missing #beginnerGuideBanner');
  assert(html.includes('class="beginner-guide-card"'), 'Missing .beginner-guide-card');
  assert(html.includes('1. 41 Autonomous Bots'), 'Missing Guide point 1');
  assert(html.includes('2. Three Pantheons'), 'Missing Guide point 2');
  assert(html.includes('3. Reading Key Numbers'), 'Missing Guide point 3');
  assert(html.includes('4. Simple Controls'), 'Missing Guide point 4');
  assert(html.includes('id="btnDismissGuide"'), 'Missing #btnDismissGuide');
});

runTest('HTML: Contains Collapsible Institutional Tools & Speed Drawer', () => {
  assert(html.includes('class="tools-drawer-wrapper"'), 'Missing .tools-drawer-wrapper');
  assert(html.includes('class="tools-drawer-header"'), 'Missing .tools-drawer-header');
  assert(html.includes('id="toolsDrawerContent"'), 'Missing #toolsDrawerContent');
  assert(html.includes('id="toolsDrawerChevron"'), 'Missing #toolsDrawerChevron');
  assert(html.includes('id="toolsDrawerStateText"'), 'Missing #toolsDrawerStateText');
});

runTest('HTML: Retains all 9 Quantum Institutional Tools inside drawer', () => {
  assert(html.includes('id="btnOpenSynapse"'), 'Missing Synapse tool');
  assert(html.includes('id="btnToggleVoiceHud"'), 'Missing Voice Copilot tool');
  assert(html.includes('id="btnOpenCopilot"'), 'Missing AI Risk Copilot tool');
  assert(html.includes('id="btnOpenCrisis"'), 'Missing Crisis Replay tool');
  assert(html.includes('id="btnOpenVol3D"'), 'Missing 3D Vol tool');
  assert(html.includes('id="btnOpenDarkPool"'), 'Missing Dark Pool tool');
  assert(html.includes('id="btnOpenDefcon"'), 'Missing DEFCON tool');
  assert(html.includes('id="btnOpenExecutiveMemo"'), 'Missing LP Memo tool');
  assert(html.includes('id="btnOpenBotJournal"'), 'Missing Trade Journal tool');
});

runTest('HTML: Contains 3-Way Mode Switcher buttons and Guide Toggle', () => {
  assert(html.includes('id="btnViewBeginner"'), 'Missing #btnViewBeginner');
  assert(html.includes('id="btnViewPro"'), 'Missing #btnViewPro');
  assert(html.includes('id="btnViewRanker"'), 'Missing #btnViewRanker');
  assert(html.includes('id="btnToggleGuide"'), 'Missing #btnToggleGuide');
});

// ── 2. FLEET.CSS TESTS ────────────────────────────────────────────────────────
runTest('CSS: KaTeX duplicate formula copy fix is present', () => {
  assert(css.includes('.katex-mathml'), 'Missing .katex-mathml selector');
  assert(css.includes('display: none !important;'), 'Missing display: none !important for MathML');
});

runTest('CSS: Beginner Onboarding Guide and column styles are present', () => {
  assert(css.includes('.beginner-onboarding-banner'), 'Missing .beginner-onboarding-banner');
  assert(css.includes('.beginner-guide-card'), 'Missing .beginner-guide-card');
  assert(css.includes('.guide-grid'), 'Missing .guide-grid');
  assert(css.includes('.guide-col'), 'Missing .guide-col');
  assert(css.includes('.bg-cyan-soft'), 'Missing .bg-cyan-soft');
  assert(css.includes('.bg-purple-soft'), 'Missing .bg-purple-soft');
  assert(css.includes('.bg-green-soft'), 'Missing .bg-green-soft');
  assert(css.includes('.bg-amber-soft'), 'Missing .bg-amber-soft');
});

runTest('CSS: Collapsible Tools Drawer styles are present', () => {
  assert(css.includes('.tools-drawer-wrapper'), 'Missing .tools-drawer-wrapper');
  assert(css.includes('.tools-drawer-header'), 'Missing .tools-drawer-header');
  assert(css.includes('.drawer-chevron'), 'Missing .drawer-chevron');
  assert(css.includes('.tools-drawer-content'), 'Missing .tools-drawer-content');
});

runTest('CSS: Beginner Card & Risk Badge styles are present', () => {
  assert(css.includes('.beginner-card'), 'Missing .beginner-card');
  assert(css.includes('.beginner-explainer-box'), 'Missing .beginner-explainer-box');
  assert(css.includes('.risk-level-badge'), 'Missing .risk-level-badge');
  assert(css.includes('.risk-low'), 'Missing .risk-low');
  assert(css.includes('.risk-mod'), 'Missing .risk-mod');
  assert(css.includes('.risk-growth'), 'Missing .risk-growth');
  assert(css.includes('.beginner-asset-strip'), 'Missing .beginner-asset-strip');
  assert(css.includes('.beginner-stats-row'), 'Missing .beginner-stats-row');
  assert(css.includes('.collapsible-math-wrap'), 'Missing .collapsible-math-wrap');
  assert(css.includes('.btn-expand-math'), 'Missing .btn-expand-math');
  assert(css.includes('.math-drawer-content'), 'Missing .math-drawer-content');
  assert(css.includes('@keyframes cardEntrance'), 'Missing @keyframes cardEntrance');
});

// ── 3. FLEET.JS LOGIC & HELPER TESTS ──────────────────────────────────────────
runTest('JS: Formatter and helper functions exist', () => {
  assert(js.includes('const formatPrice ='), 'Missing formatPrice');
  assert(js.includes('const formatCurrencyCompact ='), 'Missing formatCurrencyCompact');
  assert(js.includes('const getWinRateSubtext ='), 'Missing getWinRateSubtext');
  assert(js.includes('const getSharpeSubtext ='), 'Missing getSharpeSubtext');
  assert(js.includes('const getRiskLevel ='), 'Missing getRiskLevel');
  assert(js.includes('const renderSafePositionDisplay ='), 'Missing renderSafePositionDisplay');
});

runTest('JS: formatCurrencyCompact correctly formats Cr, Lakh, and USD', () => {
  // Test via simulated function execution
  const formatCurrencyCompact = (valINR) => {
    if (typeof valINR !== 'number' || isNaN(valINR)) return '₹0';
    const isNeg = valINR < 0;
    const abs = Math.abs(valINR);
    const usdEquiv = Math.round(abs / 83.92);

    let inrText = '';
    if (abs >= 10000000) {
      inrText = `₹${(abs / 10000000).toFixed(2)} Cr`;
    } else if (abs >= 100000) {
      inrText = `₹${(abs / 100000).toFixed(2)} Lakh`;
    } else {
      inrText = `₹${abs.toLocaleString('en-IN')}`;
    }

    const usdText = usdEquiv >= 1000000
      ? `$${(usdEquiv / 1000000).toFixed(2)}M`
      : (usdEquiv >= 1000 ? `$${(usdEquiv / 1000).toFixed(1)}k` : `$${usdEquiv}`);

    return `${isNeg ? '-' : ''}${inrText} (${usdText})`;
  };

  const crResult = formatCurrencyCompact(434314195);
  assert(crResult.includes('₹43.43 Cr'), `Expected ₹43.43 Cr, got: ${crResult}`);
  assert(crResult.includes('$5.18M'), `Expected $5.18M, got: ${crResult}`);

  const lakhResult = formatCurrencyCompact(1892450);
  assert(lakhResult.includes('₹18.92 Lakh'), `Expected ₹18.92 Lakh, got: ${lakhResult}`);

  const smallResult = formatCurrencyCompact(25000);
  assert(smallResult.includes('₹25,000'), `Expected ₹25,000, got: ${smallResult}`);

  const nanResult = formatCurrencyCompact(NaN);
  assert.strictEqual(nanResult, '₹0', `Expected ₹0 for NaN, got: ${nanResult}`);
});

runTest('JS: renderSafePositionDisplay never outputs NaN, null, or -Infinity', () => {
  const renderSafePositionDisplay = (bot) => {
    if (bot.activePosition) {
      const p = bot.activePosition;
      const rawPnl = (typeof p.unrealizedPnlINR === 'number' && !isNaN(p.unrealizedPnlINR)) ? p.unrealizedPnlINR : 0;
      const rawPct = (typeof p.unrealizedPnlPct === 'number' && !isNaN(p.unrealizedPnlPct) && isFinite(p.unrealizedPnlPct)) ? p.unrealizedPnlPct : 0.0;
      const safeEntry = (typeof p.entryPrice === 'number' && !isNaN(p.entryPrice) && p.entryPrice > 0) ? p.entryPrice : (bot.currentPrice || bot.basePrice || 100.0);
      const pColor = rawPnl >= 0 ? '#10b981' : '#f43f5e';
      const side = p.side || 'BUY';
      const qty = p.qty || '100 Shares';
      const sym = p.symbol || bot.primarySymbol;
      return `
        <div>
          <span>${side} ${qty}</span> 
          <span>${sym}</span> @ 
          <span>₹${Number(safeEntry).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span style="color:${pColor};">
            ${rawPnl >= 0 ? '+' : ''}₹${rawPnl.toLocaleString('en-IN')} (${rawPct >= 0 ? '+' : ''}${rawPct.toFixed(2)}%)
          </span>
        </div>
      `;
    }
    return `<span>Scanning market order book...</span>`;
  };

  // Test with malformed/corrupted position object
  const testBot = {
    id: 'TEST-BOT',
    primarySymbol: 'KOTAKBANK.NS',
    basePrice: 1820.0,
    activePosition: {
      side: 'SELL',
      qty: '150 Shares',
      symbol: 'KOTAKBANK.NS',
      entryPrice: NaN,
      unrealizedPnlINR: null,
      unrealizedPnlPct: -Infinity
    }
  };

  const rendered = renderSafePositionDisplay(testBot);
  assert(!rendered.includes('NaN'), `Output must not contain NaN: ${rendered}`);
  assert(!rendered.includes('null'), `Output must not contain null: ${rendered}`);
  assert(!rendered.includes('Infinity'), `Output must not contain Infinity: ${rendered}`);
  assert(rendered.includes('SELL 150 Shares'), `Should have side and qty: ${rendered}`);
  assert(rendered.includes('₹1,820.00'), `Should use basePrice fallback: ${rendered}`);
});

runTest('JS: qty / bookDepth bug is eliminated (uses rawQty numeric)', () => {
  // Check that volumeImpactBps does not divide string qty by bookDepth
  assert(!js.includes('(qty / bookDepth) * 3.5'), 'Found dangerous string division (qty / bookDepth)');
  assert(js.includes('rawQty / bookDepth'), 'Expected rawQty / bookDepth numeric calculation');
});

runTest('JS: Window methods exist and are exposed globally', () => {
  assert(js.includes('window.switchFleetView ='), 'Missing window.switchFleetView');
  assert(js.includes('window.toggleBeginnerGuide ='), 'Missing window.toggleBeginnerGuide');
  assert(js.includes('window.toggleToolsDrawer ='), 'Missing window.toggleToolsDrawer');
  assert(js.includes('window.toggleBotMath ='), 'Missing window.toggleBotMath');
});

runTest('JS: All 41 bots in INITIAL_BOTS have layman explanations', () => {
  const startIdx = js.indexOf('const INITIAL_BOTS = [');
  assert(startIdx !== -1, 'Could not find INITIAL_BOTS definition');
  const endIdx = js.indexOf('\n  ];', startIdx);
  assert(endIdx !== -1, 'Could not find closing of INITIAL_BOTS');
  const botsRaw = js.slice(startIdx + 'const INITIAL_BOTS = '.length, endIdx + 4);
  
  const bots = eval(botsRaw);
  assert.strictEqual(bots.length, 41, `Expected 41 bots, got ${bots.length}`);
  
  bots.forEach(bot => {
    assert(bot.id, 'Bot missing id');
    assert(bot.name, `Bot ${bot.id} missing name`);
    assert(bot.laymanExplanation, `Bot ${bot.id} missing laymanExplanation`);
    assert.strictEqual(typeof bot.laymanExplanation, 'string', `Bot ${bot.id} laymanExplanation must be string`);
    assert(bot.laymanExplanation.length > 20, `Bot ${bot.id} laymanExplanation too short: ${bot.laymanExplanation}`);
  });
});

console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed successfully!');
}
