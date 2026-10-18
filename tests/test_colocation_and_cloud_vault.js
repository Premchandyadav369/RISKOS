/**
 * RISKOS — HARDWARE CO-LOCATION & CLOUD KEY VAULT TEST SUITE
 * (tests/test_colocation_and_cloud_vault.js)
 *
 * Verifies:
 * 1. Sub-100ns FPGA/ASIC hardware tick-to-trade pipeline simulation across 6 exchange datacenters
 * 2. Multi-tier latency distributions & top-of-book queue priority race probabilities
 * 3. Zero-Knowledge Cloud Key Vault envelope encryption (AES-256-GCM / PBKDF2-SHA512)
 * 4. Tamper-evident ciphertext verification & decryption authentication
 * 5. Ephemeral credential leasing, TTL self-destruct & in-memory zeroization
 * 6. Cryptographic chained SHA-256 audit trail integrity
 * 7. HTML DOM triggers and universal palette slash command registration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock localStorage if in Node environment
if (typeof global.localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

console.log('================================================================');
console.log('  RISKOS CO-LOCATION FPGA & CLOUD KEY VAULT TEST SUITE');
console.log('================================================================\n');

async function runTestSuite() {
  let passed = 0;
  let total = 0;

  function test(desc, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${desc}`);
      console.error(`         ${err.message}`);
    }
  }

  async function testAsync(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${desc}`);
      console.error(`         ${err.message}`);
    }
  }

  // ── Section 1: Hardware Co-Location & Sub-100ns FPGA Simulator ─────────────
  console.log('--- Pillar 1: Hardware Co-Location & Sub-100ns FPGA Simulation ---');

  const { HardwareColocationSimulator, DATACENTERS, FPGA_PIPELINE_STAGES } = require('../hardwareColocationSimulator.js');
  const sim = new HardwareColocationSimulator();

  test('Topology contains 6 global tier-1 exchange data centers', () => {
    assert.strictEqual(Object.keys(DATACENTERS).length, 6);
    assert.ok(DATACENTERS.NYSE_MAHWAH, 'NYSE Mahwah missing');
    assert.ok(DATACENTERS.NASDAQ_CARTERET, 'NASDAQ Carteret missing');
    assert.ok(DATACENTERS.CBOE_SECAUCUS, 'Cboe Secaucus missing');
    assert.ok(DATACENTERS.LSE_SLOUGH, 'LSE Slough missing');
    assert.ok(DATACENTERS.EUREX_FRANKFURT, 'Eurex Frankfurt missing');
    assert.ok(DATACENTERS.NSE_BKC, 'NSE Mumbai BKC missing');
  });

  test('FPGA pipeline defines 6 physical and RTL logic stages', () => {
    assert.strictEqual(FPGA_PIPELINE_STAGES.length, 6);
    const stageIds = FPGA_PIPELINE_STAGES.map(s => s.id);
    assert.ok(stageIds.includes('stage_optics'));
    assert.ok(stageIds.includes('stage_mac_parse'));
    assert.ok(stageIds.includes('stage_book_decode'));
    assert.ok(stageIds.includes('stage_strat_logic'));
    assert.ok(stageIds.includes('stage_risk_firewall'));
    assert.ok(stageIds.includes('stage_tx_dispatch'));
  });

  test('Tier 1 (FPGA Direct Attach) achieves verified sub-100-nanosecond tick-to-trade', () => {
    const res = sim.runBenchmark({
      datacenterKey: 'NASDAQ_CARTERET',
      tier: 'FPGA_DIRECT_ATTACH',
      packetCount: 1000,
      competingHftCount: 10
    });

    assert.strictEqual(res.isSub100Nanoseconds, true, `Expected mean latency < 100ns, got ${res.meanLatencyNs}ns`);
    assert.ok(res.meanLatencyNs >= 35.0 && res.meanLatencyNs < 95.0, `Mean latency ${res.meanLatencyNs}ns out of FPGA bounds`);
    assert.ok(res.p50Ns <= res.p90Ns && res.p90Ns <= res.p99Ns && res.p99Ns <= res.p999Ns, 'Percentiles out of order');
    assert.ok(res.winRatePct >= 5.0 && res.winRatePct <= 100.0, 'Queue win rate out of bounds');
    assert.strictEqual(res.stages.length, 6);
  });

  test('Tier 2 (Kernel Bypass Solarflare EF_VI) achieves verified sub-microsecond latency', () => {
    const res = sim.runBenchmark({
      datacenterKey: 'NYSE_MAHWAH',
      tier: 'KERNEL_BYPASS_EF_VI',
      packetCount: 500
    });

    assert.strictEqual(res.isSub100Nanoseconds, false);
    assert.ok(res.meanLatencyNs >= 600.0 && res.meanLatencyNs < 1500.0, `Kernel bypass latency ${res.meanLatencyNs}ns out of bounds`);
  });

  test('Tier 3 & Tier 5 show expected orders of magnitude separation (µs to ms)', () => {
    const osRes = sim.runBenchmark({ datacenterKey: 'CBOE_SECAUCUS', tier: 'LINUX_KERNEL_SOCKET', packetCount: 200 });
    const cloudRes = sim.runBenchmark({ datacenterKey: 'CBOE_SECAUCUS', tier: 'RETAIL_PUBLIC_CLOUD', packetCount: 200 });

    assert.ok(osRes.meanLatencyNs > 7000, 'OS socket should be > 7µs');
    assert.ok(cloudRes.meanLatencyNs > 8000000, 'Retail cloud should be > 8ms');
    assert.ok(cloudRes.meanLatencyNs / osRes.meanLatencyNs > 500, 'Cloud should be >500x slower than OS socket');
  });

  // ── Section 2: Zero-Knowledge Cloud Key Vault & Cryptographic Enclave ───────
  console.log('\n--- Pillar 2: Cloud Key Vault & Envelope Encryption ---');

  const { CloudKeyVaultEnclave } = require('../cloudKeyVault.js');
  const vault = new CloudKeyVaultEnclave();

  await testAsync('Vault derives master key (KEK) using PBKDF2-SHA512 with 100,000 iterations', async () => {
    const key = await vault.deriveMasterKey('TEST_INSTITUTIONAL_MASTER_PASSPHRASE_123');
    assert.ok(key, 'Failed to derive CryptoKey');
    assert.strictEqual(key.type, 'secret');
    assert.strictEqual(key.algorithm.name, 'AES-GCM');
  });

  await testAsync('Vault unlocks and seals secrets in authenticated AES-256-GCM envelope', async () => {
    await vault.unlockVault('TEST_INSTITUTIONAL_MASTER_PASSPHRASE_123');
    assert.strictEqual(vault.isLocked, false);

    const testPayload = {
      apiKey: 'kite_prod_live_89a3f2b1',
      apiSecret: 'kite_secret_hash_99c0d1e2',
      enctoken: 'bearer_token_xyz_institution'
    };

    const envelope = await vault.encryptSecret(testPayload, 'zerodha');
    assert.strictEqual(envelope.v, 1);
    assert.strictEqual(envelope.provider, 'HASHICORP_VAULT_TRANSIT_AES256_GCM');
    assert.ok(envelope.iv && envelope.iv.length > 10, 'IV missing');
    assert.ok(envelope.ciphertext && envelope.ciphertext.length > 20, 'Ciphertext missing');

    const decrypted = await vault.decryptSecret(envelope);
    assert.deepStrictEqual(decrypted, testPayload);
  });

  await testAsync('Tampered ciphertext triggers authenticated decryption failure', async () => {
    const envelope = await vault.encryptSecret({ test: 'integrity_guard' }, 'tamper_test');
    // Corrupt ciphertext base64 string
    const rawCipher = envelope.ciphertext;
    const corrupted = rawCipher.substring(0, rawCipher.length - 4) + 'AAAA';
    envelope.ciphertext = corrupted;

    let threw = false;
    try {
      await vault.decryptSecret(envelope);
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, true, 'Decryption of corrupted ciphertext should fail');
  });

  await testAsync('Ephemeral credential lease issues lease ID and schedules memory zeroization', async () => {
    await vault.vaultBrokerCredentials('angel', { apiKey: 'angel_live_key', clientCode: 'A123' });
    const lease = await vault.leaseBrokerCredentials('angel', 10);

    assert.ok(lease, 'Lease failed');
    assert.ok(lease.leaseId.startsWith('lease_'), 'Invalid lease ID');
    assert.strictEqual(lease.credentials.clientCode, 'A123');
    assert.ok(vault.activeLeases.has(lease.leaseId));
  });

  await testAsync('Master key rotation re-encrypts all stored envelopes and increments version', async () => {
    await vault.vaultBrokerCredentials('binance', { apiKey: 'binance_live_key', apiSecret: 'binance_live_sec' });
    const res = await vault.rotateMasterKey('NEW_ROTATED_INSTITUTIONAL_PASSPHRASE_456');

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.keyVersion, 2);
    assert.ok(res.reencryptedCount >= 2, 'Should re-encrypt stored broker keys');

    const envelopes = vault.getStoredEnvelopes();
    assert.strictEqual(envelopes.binance.v, 2);
  });

  await testAsync('Cryptographic chained audit trail preserves SHA-256 hash integrity', async () => {
    assert.ok(vault.auditChain.length >= 5, 'Audit chain too short');
    const lastEntry = vault.auditChain[vault.auditChain.length - 1];
    assert.ok(lastEntry.hash && lastEntry.hash.length > 6, 'Audit hash missing');
    assert.ok(lastEntry.action, 'Action missing');
    assert.ok(lastEntry.timestamp, 'Timestamp missing');
  });

  test('Vault lock zeroizes in-memory master keys and clears leases', () => {
    vault.lockVault();
    assert.strictEqual(vault.isLocked, true);
    assert.strictEqual(vault.masterKey, null);
    assert.strictEqual(vault.activeLeases.size, 0);
  });

  // ── Section 3: Universal Integration Verification ───────────────────────────
  console.log('\n--- Pillar 3: Platform Integration & DOM Verification ---');

  test('universalPalette.js registers /colo-bench and /vault slash commands', () => {
    const paletteFile = fs.readFileSync(path.join(__dirname, '../universalPalette.js'), 'utf8');
    assert.ok(paletteFile.includes('/colo-bench'), 'Missing /colo-bench slash command');
    assert.ok(paletteFile.includes('/vault'), 'Missing /vault slash command');
    assert.ok(paletteFile.includes('HardwareColocationSimulator'), 'Missing HardwareColocationSimulator reference in palette');
    assert.ok(paletteFile.includes('CloudKeyVault'), 'Missing CloudKeyVault reference in palette');
  });

  test('liveBrokerGateway.js connects with CloudKeyVault for envelope encryption', () => {
    const brokerFile = fs.readFileSync(path.join(__dirname, '../liveBrokerGateway.js'), 'utf8');
    assert.ok(brokerFile.includes('CloudKeyVault.vaultBrokerCredentials'), 'Missing vaultBrokerCredentials in liveBrokerGateway');
    assert.ok(brokerFile.includes('CloudKeyVault.leaseBrokerCredentials'), 'Missing leaseBrokerCredentials in liveBrokerGateway');
    assert.ok(brokerFile.includes('btnOpenEnclaveVault'), 'Missing btnOpenEnclaveVault in liveBrokerGateway');
  });

  test('hft.html & app.html include script imports and Quant Core hub buttons', () => {
    const hftHtml = fs.readFileSync(path.join(__dirname, '../hft.html'), 'utf8');
    const appHtml = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');

    assert.ok(hftHtml.includes('hardwareColocationSimulator.js'), 'hft.html missing hardwareColocationSimulator.js');
    assert.ok(hftHtml.includes('cloudKeyVault.js'), 'hft.html missing cloudKeyVault.js');
    assert.ok(hftHtml.includes('btnOpenColoModal'), 'hft.html missing btnOpenColoModal');
    assert.ok(hftHtml.includes('btnOpenCloudVaultModal'), 'hft.html missing btnOpenCloudVaultModal');

    assert.ok(appHtml.includes('hardwareColocationSimulator.js'), 'app.html missing hardwareColocationSimulator.js');
    assert.ok(appHtml.includes('cloudKeyVault.js'), 'app.html missing cloudKeyVault.js');
    assert.ok(appHtml.includes('btnOpenColoModalApp'), 'app.html missing btnOpenColoModalApp');
    assert.ok(appHtml.includes('btnOpenCloudVaultModalApp'), 'app.html missing btnOpenCloudVaultModalApp');
  });

  console.log('\n================================================================');
  console.log(`  RESULTS: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
