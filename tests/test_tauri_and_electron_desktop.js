/**
 * RISKOS Test Suite: Tauri & Electron Desktop Native Architecture
 * Architect: Premchand Yadav
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  RISKOS TAURI & ELECTRON DESKTOP NATIVE TEST SUITE');
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

it('src-tauri/tauri.conf.json is configured for institutional multi-window desktop', () => {
  const confPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
  assert.ok(fs.existsSync(confPath), 'tauri.conf.json must exist');
  const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));

  assert.strictEqual(conf.package.productName, 'RISKOS');
  assert.strictEqual(conf.package.version, '2.0.0');
  assert.strictEqual(conf.tauri.windows[0].width, 1600);
  assert.strictEqual(conf.tauri.windows[0].height, 1000);
});

it('src-tauri/Cargo.toml contains required dependencies and features', () => {
  const cargoPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
  assert.ok(fs.existsSync(cargoPath), 'src-tauri/Cargo.toml must exist');
  const content = fs.readFileSync(cargoPath, 'utf8');

  assert.ok(content.includes('name = "riskos-desktop"'));
  assert.ok(content.includes('tauri = '));
  assert.ok(content.includes('system-tray'));
  assert.ok(content.includes('global-shortcut'));
  assert.ok(content.includes('num_cpus'));
});

it('src-tauri/src/main.rs defines native IPC commands, system tray, and emergency shortcut', () => {
  const mainRs = path.join(__dirname, '..', 'src-tauri', 'src', 'main.rs');
  assert.ok(fs.existsSync(mainRs), 'src-tauri/src/main.rs must exist');
  const content = fs.readFileSync(mainRs, 'utf8');

  assert.ok(content.includes('fn riskos_evaluate_prem_alpha'), 'Must implement riskos_evaluate_prem_alpha');
  assert.ok(content.includes('fn riskos_kill_all_orders'), 'Must implement riskos_kill_all_orders');
  assert.ok(content.includes('fn riskos_get_system_telemetry'), 'Must implement riskos_get_system_telemetry');
  assert.ok(content.includes('CommandOrControl+Shift+K'), 'Must register global kill-switch shortcut');
  assert.ok(content.includes('SystemTray::new()'), 'Must initialize native system tray');
});

it('electron/main.js & electron/preload.js implement Electron desktop packaging', () => {
  const mainJs = path.join(__dirname, '..', 'electron', 'main.js');
  const preloadJs = path.join(__dirname, '..', 'electron', 'preload.js');
  assert.ok(fs.existsSync(mainJs), 'electron/main.js must exist');
  assert.ok(fs.existsSync(preloadJs), 'electron/preload.js must exist');

  const mainContent = fs.readFileSync(mainJs, 'utf8');
  assert.ok(mainContent.includes('BrowserWindow'));
  assert.ok(mainContent.includes('CommandOrControl+Shift+K'), 'Must register Electron global hotkey');
  assert.ok(mainContent.includes('Tray'), 'Must support Electron system tray');

  const preloadContent = fs.readFileSync(preloadJs, 'utf8');
  assert.ok(preloadContent.includes('RiskosDesktopBridge'), 'Must expose secure desktop bridge');
  assert.ok(preloadContent.includes('onEmergencyKillSwitch'));
});

console.log('\n================================================================');
console.log(`  TAURI & ELECTRON RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
