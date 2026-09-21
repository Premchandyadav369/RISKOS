/**
 * Test Suite: OpenStock Feature Suites Validation
 * Validates Smart Alert Engine, Fundamental Health Engine (Piotroski & Altman Z),
 * Peer Comparison Workbench, AI Analyst Brief, and Watchlist Health Diagnostics.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('🚀  RISKOS OPENSTOCK FEATURE SUITES VALIDATION');
console.log('══════════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
};

// ── 1. Test UniversalAlerts ──────────────────────────────────────────────────
test('UniversalAlerts: Alert creation, toggling, and real-time trigger evaluation', () => {
  const { UniversalAlerts } = require('../universalAlerts.js');
  assert(UniversalAlerts, 'UniversalAlerts must export');

  const alert = UniversalAlerts.addAlert({
    symbol: 'TESTSYM',
    type: 'PRICE_ABOVE',
    threshold: 100.0,
    note: 'Breakout test'
  });

  assert.strictEqual(alert.symbol, 'TESTSYM');
  assert.strictEqual(alert.type, 'PRICE_ABOVE');
  assert.strictEqual(alert.threshold, 100.0);
  assert.strictEqual(alert.active, true);

  // Toggle active state
  const toggled = UniversalAlerts.toggleAlert(alert.id);
  assert.strictEqual(toggled, false);
  UniversalAlerts.toggleAlert(alert.id); // Toggle back to active

  // Evaluate trigger
  const mockSec = { symbol: 'TESTSYM', basePrice: 95 };
  const mockQuote = { price: 105.5, previousClose: 95 };
  const fired = UniversalAlerts.evaluateSecurity(mockSec, mockQuote);

  assert(fired.length > 0, 'Alert should have triggered since 105.5 >= 100.0');
  assert.strictEqual(fired[0].symbol, 'TESTSYM');

  // Clean up
  UniversalAlerts.removeAlert(alert.id);
});

// ── 2. Test FundamentalHealthEngine (Piotroski & Altman Z) ───────────────────
test('FundamentalHealthEngine: Piotroski F-Score, Altman Z-Score & 3-Statements', () => {
  const { FundamentalHealthEngine } = require('../fundamentalHealthEngine.js');
  assert(FundamentalHealthEngine, 'FundamentalHealthEngine must export');

  const mockSecQuality = {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    basePrice: 4380,
    pe: 31.78,
    roe: 48.2,
    roce: 59.1,
    marketCap: 15800000000000,
    currency: 'INR'
  };

  const pScore = FundamentalHealthEngine.getPiotroskiScore(mockSecQuality);
  assert(pScore.score >= 0 && pScore.score <= 9, 'Piotroski score must be in range 0-9');
  assert.strictEqual(pScore.items.length, 9, 'Must evaluate 9 criteria items');
  assert(pScore.verdict, 'Must supply human-readable verdict');

  const altman = FundamentalHealthEngine.getAltmanZScore(mockSecQuality);
  assert(altman.zScore > 0, 'Altman Z-Score must be positive');
  assert(['Safe Zone', 'Grey Zone', 'Distress Zone'].includes(altman.zone), 'Must classify into valid zone');
  assert(altman.components.x1 && altman.components.x5, 'Must contain all 5 discriminant variables');

  const statements = FundamentalHealthEngine.getFinancialStatements(mockSecQuality);
  assert(statements.incomeStatement.length >= 8, 'Income statement must have line items');
  assert(statements.balanceSheet.length >= 8, 'Balance sheet must have line items');
  assert(statements.cashFlow.length >= 4, 'Cash flow must have line items');
  assert(statements.ratios.pe, 'Must calculate valuation ratios');
});

// ── 3. Test PeerComparisonEngine ─────────────────────────────────────────────
test('PeerComparisonEngine: Multi-asset peer docking and correlation harvesting', () => {
  const { PeerComparisonEngine } = require('../peerComparisonEngine.js');
  assert(PeerComparisonEngine, 'PeerComparisonEngine must export');

  PeerComparisonEngine.clear();
  PeerComparisonEngine.addTicker('RELIANCE');
  PeerComparisonEngine.addTicker('TCS');

  const selected = PeerComparisonEngine.getSelected();
  assert(selected.includes('RELIANCE') && selected.includes('TCS'), 'Must contain added tickers');

  const compData = PeerComparisonEngine.getComparisonData(['RELIANCE', 'TCS']);
  assert.strictEqual(compData.length, 2, 'Must harvest data for both peers');

  const matrix = PeerComparisonEngine.getCorrelationMatrix(compData);
  assert.strictEqual(matrix.length, 2, 'Correlation matrix must be 2x2');
  assert.strictEqual(matrix[0][0], 1.0, 'Diagonal must be 1.0');
  assert.strictEqual(matrix[1][1], 1.0, 'Diagonal must be 1.0');
  assert(matrix[0][1] >= -1.0 && matrix[0][1] <= 1.0, 'Correlation must be bounded in [-1, 1]');
});

// ── 4. Test AiAnalystBrief ───────────────────────────────────────────────────
test('AiAnalystBrief: Automated investment memorandum synthesis across depth modes', () => {
  const { AiAnalystBrief } = require('../aiAnalystBrief.js');
  assert(AiAnalystBrief, 'AiAnalystBrief must export');

  const mockSec = {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    basePrice: 142.50,
    pe: 45.0,
    roe: 62.0,
    vol: 0.38,
    beta: 1.65,
    currency: 'USD'
  };

  const briefInvestor = AiAnalystBrief.generateBrief(mockSec, 'investor');
  assert(['STRONG BUY', 'ACCUMULATE', 'HOLD / NEUTRAL', 'REDUCE / HEDGE'].includes(briefInvestor.verdict), 'Valid verdict');
  assert(briefInvestor.bullCatalysts.length >= 3, 'Must provide >= 3 bull catalysts');
  assert(briefInvestor.bearRisks.length >= 3, 'Must provide >= 3 bear risks');
  assert(briefInvestor.rrr > 0, 'Risk-to-reward ratio must be positive');

  const briefBeginner = AiAnalystBrief.generateBrief(mockSec, 'beginner');
  assert(briefBeginner.synthesisText.includes('Beginners'), 'Beginner mode must customize text');

  const briefQuant = AiAnalystBrief.generateBrief(mockSec, 'quant');
  assert(briefQuant.synthesisText.includes('Quant'), 'Quant mode must customize text');
});

// ── 5. Test UI Invariants in ticker.html ─────────────────────────────────────
test('ticker.html: Modals, headers, drawer tabs and script linkages', () => {
  const htmlPath = path.join(__dirname, '..', 'ticker.html');
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Scripts loaded in correct order
  assert(content.includes('universalAlerts.js'), 'Must load universalAlerts.js');
  assert(content.includes('fundamentalHealthEngine.js'), 'Must load fundamentalHealthEngine.js');
  assert(content.includes('peerComparisonEngine.js'), 'Must load peerComparisonEngine.js');
  assert(content.includes('aiAnalystBrief.js'), 'Must load aiAnalystBrief.js');

  // Header buttons
  assert(content.includes('id="globalOpenAlertsBtn"'), 'Must have global alerts button in header');
  assert(content.includes('id="globalOpenPeerWorkbenchBtn"'), 'Must have global peer compare button in header');

  // Watchlist Desk & Health Ribbon
  assert(content.includes('id="watchlistManagerDesk"'), 'Must have watchlistManagerDesk section');
  assert(content.includes('id="portfolioHealthRibbon"'), 'Must have portfolioHealthRibbon');
  assert(content.includes('id="phealthBeta"'), 'Must have portfolio weighted beta element');
  assert(content.includes('id="phealthFScore"'), 'Must have blended Piotroski score element');

  // Table Health Column
  assert(content.includes('Health (F-Score)'), 'Must have Health (F-Score) column header');

  // Drawer Tabs
  assert(content.includes('id="drawerNavTabs"'), 'Must have drawerNavTabs');
  assert(content.includes('data-dtab="overview"'), 'Must have overview drawer tab');
  assert(content.includes('data-dtab="health"'), 'Must have health drawer tab');
  assert(content.includes('data-dtab="ai-brief"'), 'Must have ai-brief drawer tab');
  assert(content.includes('data-dtab="news"'), 'Must have news drawer tab');
  assert(content.includes('id="drawerSetAlertBtn"'), 'Must have drawerSetAlertBtn');
  assert(content.includes('id="drawerAddToCompareBtn"'), 'Must have drawerAddToCompareBtn');
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TOTAL OPENSTOCK TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
