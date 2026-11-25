/**
 * RISKOS 24/7 Autonomous Sovereign Daemon Verification Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Test: tests/test_riskos_daemon.js
 */

const assert = require('assert');
const http = require('http');
const { RiskosDaemon, CONFIG } = require('../server/riskosDaemon.js');

console.log('================================================================');
console.log('  RUNNING RISKOS 24/7 AUTONOMOUS DAEMON TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function main() {
  // 1. Structure & Configuration
  console.log('--- 1. Structure & Configuration Verification ---');
  runTest('RiskosDaemon initializes with default configuration & cadences', () => {
    const daemon = new RiskosDaemon({ port: 8096 });
    assert.ok(daemon.config.port === 8096, 'Port should be 8096');
    assert.ok(daemon.config.intervals.webSeerMs >= 10000, 'WebSeer interval should be configured');
    assert.ok(daemon.config.intervals.pricingMs >= 60000, 'Pricing interval should be configured');
    assert.ok(daemon.webSeer, 'WebSeerEngine instance must exist');
    assert.ok(daemon.pricingEngine, 'InstitutionalPricingEngine instance must exist');
  });

  // 2. Market Session Timezone Calculation
  console.log('\n--- 2. Market Sessions Engine ---');
  runTest('Market session engine accurately identifies 24/7 crypto and equity hours', () => {
    const daemon = new RiskosDaemon({ port: 8096 });
    const sessions = daemon.getMarketSessions();
    assert.ok(sessions.crypto.isOpen, 'Crypto must be open 24/7/365');
    assert.strictEqual(sessions.crypto.status, '24/7 TRADING ACTIVE');
    assert.ok(typeof sessions.indianMarket.isOpen === 'boolean');
    assert.ok(typeof sessions.usMarket.isOpen === 'boolean');
    assert.ok(sessions.timestamp, 'Timestamp must exist');
  });

  // 3. HTTP Server & REST API Endpoints
  console.log('\n--- 3. HTTP & REST API Telemetry Endpoints ---');
  await runAsyncTest('Daemon boots HTTP server, serves /health and /api/status', async () => {
    const testPort = 8097;
    const daemon = new RiskosDaemon({ port: testPort });
    daemon.start();

    // Wait for server to bind
    await new Promise(r => setTimeout(r, 200));

    // Test /health
    const healthData = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/health`, (res) => {
        let raw = '';
        assert.strictEqual(res.statusCode, 200);
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    assert.strictEqual(healthData.status, 'UP');
    assert.ok(healthData.uptimeSeconds >= 0);
    assert.ok(healthData.sessions.crypto.isOpen);

    // Test /api/status
    const statusData = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/api/status`, (res) => {
        let raw = '';
        assert.strictEqual(res.statusCode, 200);
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    assert.strictEqual(statusData.daemon, 'RISKOS-24/7-DAEMON');
    assert.ok(statusData.stats);

    // Stop daemon cleanly
    await daemon.stop();
  });

  // 4. Static Asset Delivery
  console.log('\n--- 4. Static Asset Delivery & MIME Types ---');
  await runAsyncTest('Daemon serves HTML files with correct MIME headers', async () => {
    const testPort = 8098;
    const daemon = new RiskosDaemon({ port: testPort });
    daemon.start();

    await new Promise(r => setTimeout(r, 200));

    const htmlHeaders = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/hft.html`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.headers['content-type'].includes('text/html'));
        res.resume();
        resolve(res.headers);
      }).on('error', reject);
    });

    assert.ok(htmlHeaders);
    await daemon.stop();
  });

  // 5. WebSocket Framing & RFC 6455 Identity
  console.log('\n--- 5. RFC 6455 WebSocket Framing & Protocol ---');
  runTest('WebSocket frame builder encodes text payloads with correct RFC 6455 opcodes', () => {
    const daemon = new RiskosDaemon({ port: 8099 });
    const payload = JSON.stringify({ test: 'alpha', value: 123 });
    const frame = daemon.createWebSocketFrame(payload);

    assert.ok(Buffer.isBuffer(frame), 'Frame must be a Buffer');
    assert.strictEqual(frame[0], 0x81, 'First byte must be 0x81 (FIN + Text opcode)');
    assert.strictEqual(frame[1], Buffer.byteLength(payload), 'Second byte must be payload length');
    assert.strictEqual(frame.subarray(2).toString('utf8'), payload, 'Payload bytes must match input string');
  });

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
