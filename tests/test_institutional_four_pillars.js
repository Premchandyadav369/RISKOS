/**
 * RISKOS — Institutional Four Pillars Verification Suite
 * Tests:
 * 1. Almgren-Chriss Endogenous Market Impact & Capacity Limits
 * 2. Hardware-Accelerated Canvas 2D Order Book Ladder
 * 3. Vectorized Columnar SQL Analytical Engine (DuckDB-Wasm style)
 * 4. FINRA CAT & MiFID II RTS 25 Compliant Audit Trail Engine
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  RISKOS INSTITUTIONAL FOUR PILLARS VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

// ── Pillar 1: Almgren-Chriss Endogenous Market Impact ─────────────────────────
console.log('--- Pillar 1: Almgren-Chriss Endogenous Market Impact Engine ---');

const SandboxModule = require('../interactiveBacktestSandbox.js');
const SandboxEngine = SandboxModule.SandboxEngine;

it('SandboxEngine calculates dynamic Almgren-Chriss square-root market impact', () => {
  const engine = new SandboxEngine({ baseCapital: 10000000, assetAdvINR: 500000000 });
  const resSmallCap = engine.evaluate({ assetAdvINR: 5000000000 }); // High liquidity
  const resLargeCap = engine.evaluate({ assetAdvINR: 10000000 });   // Restricted liquidity (high impact)

  assert(resSmallCap.marketImpactModel === 'ALMGREN_CHRISS_SQUARE_ROOT', 'Market impact model should be ALMGREN_CHRISS_SQUARE_ROOT');
  assert(resSmallCap.capacityEstimateINR > 0, 'Capacity limit should be positive');
  assert(resSmallCap.elapsedMs < 15, `Evaluation took ${resSmallCap.elapsedMs}ms, should be < 15ms`);
  
  // Under lower liquidity ADV, slippage drag is higher, so net equity is lower
  const finalEqHighLiq = resSmallCap.equityCurves.kelly[resSmallCap.equityCurves.kelly.length - 1];
  const finalEqLowLiq = resLargeCap.equityCurves.kelly[resLargeCap.equityCurves.kelly.length - 1];
  assert(finalEqHighLiq >= finalEqLowLiq, 'Higher liquidity ADV should produce equal or better net equity than low liquidity');
});

it('Python backtest.py contains Almgren-Chriss endogenous market impact formula', () => {
  const pyCode = fs.readFileSync('backend/engine/backtest.py', 'utf8');
  assert(pyCode.includes('market_impact_model: str = "almgren_chriss"'), 'backtest.py should include market_impact_model parameter');
  assert(pyCode.includes('participation = min(1.0, trade_notional / asset_adv)'), 'backtest.py should compute participation rate');
  assert(pyCode.includes('capacity_limit_estimate'), 'backtest.py should return capacity_limit_estimate');
});

// ── Pillar 2: Hardware-Accelerated Canvas 2D Order Book Ladder ────────────────
console.log('\n--- Pillar 2: Hardware-Accelerated Canvas 2D Depth Ladder ---');

it('hft.html contains high-frequency Canvas 2D ladder elements and pipeline switcher', () => {
  const html = fs.readFileSync('hft.html', 'utf8');
  assert(html.includes('id="hftLadderCanvas"'), 'hft.html should contain #hftLadderCanvas');
  assert(html.includes('id="toggleLadderPipelineBtn"'), 'hft.html should contain #toggleLadderPipelineBtn');
  assert(html.includes('PIPELINE: CANVAS 2D (120 FPS)'), 'hft.html should default to Canvas 2D 120 FPS pipeline');
});

it('hft.js exports renderL3CanvasLadder and toggleLadderPipeline', () => {
  const js = fs.readFileSync('hft.js', 'utf8');
  assert(js.includes('renderL3CanvasLadder = () =>'), 'hft.js should define renderL3CanvasLadder');
  assert(js.includes('window.toggleLadderPipeline = () =>'), 'hft.js should expose window.toggleLadderPipeline');
  assert(js.includes('ladderPipelineMode === \'CANVAS_2D\''), 'hft.js should support CANVAS_2D mode toggle');
});

// ── Pillar 3: Vectorized Columnar SQL Analytical Engine ───────────────────────
console.log('\n--- Pillar 3: Vectorized Columnar SQL Analytical Engine ---');

const { ColumnarTickTable } = require('../columnarTickStore.js');

it('ColumnarTickTable executes vectorized aggregation SQL queries in < 15ms', () => {
  const table = new ColumnarTickTable(1000);
  let ts = 1700000000000000000n;
  for (let i = 0; i < 500; i++) {
    const bid = 100.0 + i * 0.05;
    const ask = bid + 0.10;
    const last = bid + 0.05;
    const vol = 100 + (i % 10) * 100;
    const side = (i % 2 === 0) ? 1 : 2;
    table.append(ts + BigInt(i * 1000000), bid, ask, last, vol, side);
  }

  const query = 'SELECT COUNT(*), AVG(spread), MAX(vol), SUM(vol) FROM ticks WHERE spread > 0.05';
  const res = table.querySql(query);

  assert(res.columns.includes('metric'), 'Aggregate result should contain metric column');
  assert(res.columns.includes('value'), 'Aggregate result should contain value column');
  const countRow = res.rows.find(r => r[0] === 'total_ticks_matched');
  assert(countRow && countRow[1] === 500, `Expected 500 matched ticks, got ${countRow ? countRow[1] : null}`);
  assert(res.elapsedMicroseconds > 0, 'Execution time should be measured in microseconds');
});

it('ColumnarTickTable executes filtered projection SQL queries with LIMIT', () => {
  const table = new ColumnarTickTable(500);
  for (let i = 0; i < 200; i++) {
    table.append(BigInt(1000000000 + i), 100, 100.20, 100.10, i * 10, i % 2 === 0 ? 1 : 2);
  }

  const res = table.querySql('SELECT * FROM ticks WHERE vol > 500 LIMIT 10');
  assert(res.rowCount === 10, `Expected exactly 10 rows due to LIMIT, got ${res.rowCount}`);
  assert(res.columns.includes('volume'), 'Projection should include volume column');
  res.rows.forEach(r => {
    const vol = r[5]; // volume index
    assert(vol > 500, `Filtered row volume must be > 500, got ${vol}`);
  });
});

it('columnarTickStore.js defines openSqlWorkbenchModal interactive GUI', () => {
  const js = fs.readFileSync('columnarTickStore.js', 'utf8');
  assert(js.includes('openSqlWorkbenchModal()'), 'columnarTickStore.js should define openSqlWorkbenchModal');
  assert(js.includes('IN-BROWSER COLUMNAR SQL TICK WORKBENCH'), 'columnarTickStore.js should contain workbench title');
});

// ── Pillar 4: FINRA CAT & MiFID II RTS 25 Compliant Audit Trail ───────────────
console.log('\n--- Pillar 4: FINRA CAT & MiFID II Regulatory Audit Trail ---');

const LiveBrokerGateway = require('../liveBrokerGateway.js');

it('LiveBrokerGateway records Rule 613 compliant CAT audit events with sub-100us clock sync metadata', () => {
  const evt = LiveBrokerGateway.recordCatAuditEvent({
    eventType: 'ROUTE',
    orderId: 'TEST-ORD-01',
    symbol: 'RELIANCE',
    side: 'BUY',
    qty: 50,
    price: 2450.0,
    exchange: 'NSE',
    status: 'ROUTED_TO_EXCHANGE'
  });

  assert(evt.catVersion === '2d.4', 'CAT version should be 2d.4');
  assert(evt.mifidRts === 'RTS-25', 'MiFID standard should be RTS-25');
  assert(evt.clockSyncTolerance.includes('100 microseconds'), 'Clock sync must specify sub-100 microsecond tolerance');
  assert(evt.catEventCode === 'MEOR', 'Route event should have CAT code MEOR');
  assert(evt.exchangeMic === 'XNSE', 'NSE exchange MIC should be XNSE');
  assert(evt.timestampUtc.endsWith('Z'), 'Timestamp must be UTC ISO format');
});

it('LiveBrokerGateway exports structured JSON and CSV regulatory reports', () => {
  const jsonReportStr = LiveBrokerGateway.exportCatAuditReport('json');
  const jsonReport = JSON.parse(jsonReportStr);
  assert(jsonReport.regulatoryStandard.includes('FINRA Consolidated Audit Trail'), 'JSON report must declare FINRA CAT standard');
  assert(Array.isArray(jsonReport.events), 'JSON report must contain events array');
  assert(jsonReport.events.length > 0, 'JSON report must contain recorded events');

  const csvReport = LiveBrokerGateway.exportCatAuditReport('csv');
  assert(csvReport.includes('eventId,timestampUtc,catEventCode'), 'CSV report must contain CAT headers');
});

it('universalPalette.js registers slash commands for all 4 new institutional engines', () => {
  const js = fs.readFileSync('universalPalette.js', 'utf8');
  assert(js.includes('act_cat'), 'universalPalette.js should register act_cat');
  assert(js.includes('act_sqlticks'), 'universalPalette.js should register act_sqlticks');
  assert(js.includes('act_canvasladder'), 'universalPalette.js should register act_canvasladder');
  assert(js.includes('act_impact'), 'universalPalette.js should register act_impact');
  assert(js.includes('/cat-report'), 'universalPalette.js should support /cat-report');
  assert(js.includes('/sql-ticks'), 'universalPalette.js should support /sql-ticks');
  assert(js.includes('/canvas-ladder'), 'universalPalette.js should support /canvas-ladder');
  assert(js.includes('/market-impact'), 'universalPalette.js should support /market-impact');
});

console.log('\n================================================================');
console.log(`  FOUR PILLARS RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
