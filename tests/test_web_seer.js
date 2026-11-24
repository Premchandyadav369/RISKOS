/**
 * RISKOS P.R.E.M.-WebSeer Comprehensive Test Suite
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Test: tests/test_web_seer.js
 */

const assert = require('assert');
const { 
  WebSeerEngine, 
  ENTITY_DICTIONARY, 
  SOURCE_CREDIBILITY, 
  CATALYST_LEXICON, 
  HISTORIC_REPLAY_SCENARIOS 
} = require('../webSeerEngine.js');

console.log('================================================================');
console.log('  RUNNING RISKOS P.R.E.M.-WEBSEER VERIFICATION TEST SUITE');
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

// 1. Structure & Ontology Tests
console.log('--- 1. Structure & Ontology Verification ---');
runTest('WebSeerEngine exports valid constructors, dictionaries, and scenarios', () => {
  assert.ok(WebSeerEngine, 'WebSeerEngine must be defined');
  const engine = new WebSeerEngine();
  assert.ok(engine.version, 'Engine must have version');
  assert.ok(Array.isArray(ENTITY_DICTIONARY) && ENTITY_DICTIONARY.length >= 20, 'Entity dictionary must contain 20+ instruments');
  assert.ok(Array.isArray(CATALYST_LEXICON) && CATALYST_LEXICON.length >= 8, 'Catalyst lexicon must define at least 8 classes');
  assert.ok(Array.isArray(HISTORIC_REPLAY_SCENARIOS) && HISTORIC_REPLAY_SCENARIOS.length >= 4, 'Must define 4+ historic benchmark scenarios');
});

// 2. Entity Disambiguation Tests
console.log('\n--- 2. Entity Disambiguation & Resolution ---');
runTest('Resolves company and symbol accurately without attribution noise', () => {
  const engine = new WebSeerEngine();

  const nvda = engine.resolveEntityFromText('Stocks surge after Jensen Huang is reinstated as Nvidia CEO - The New York Times');
  assert.ok(nvda, 'Must resolve NVDA');
  assert.strictEqual(nvda.symbol, 'NVDA');

  const tsla = engine.resolveEntityFromText('Tesla granted full unsupervised autonomous robotaxi permit by federal regulators');
  assert.ok(tsla, 'Must resolve TSLA');
  assert.strictEqual(tsla.symbol, 'TSLA');

  const ril = engine.resolveEntityFromText('Reliance Industries board approves formal demerger of Jio and Retail');
  assert.ok(ril, 'Must resolve RELIANCE');
  assert.strictEqual(ril.symbol, 'RELIANCE');

  // Verify "Google News" noise doesn't falsely overwrite Reliance
  const rilWithGoogle = engine.resolveEntityFromText('Reliance Industries Share Price - Live NSE Chart - Google News', 'Reliance Industries');
  assert.strictEqual(rilWithGoogle.symbol, 'RELIANCE');
});

// 3. Catalyst Classification NLP Tests
console.log('\n--- 3. Catalyst Classification & Sentiment Scoring ---');
runTest('Accurately maps text into formal catalyst classes', () => {
  const engine = new WebSeerEngine();

  const c1 = engine.classifyCatalyst('Jensen Huang returns as CEO of Nvidia after board resolution');
  assert.strictEqual(c1.type, 'LEADERSHIP_REINSTATEMENT');
  assert.strictEqual(c1.polarity, 1);

  const c2 = engine.classifyCatalyst('NHTSA grants full unsupervised autonomous clearance to Tesla');
  assert.strictEqual(c2.type, 'REGULATORY_CLEARANCE');
  assert.strictEqual(c2.polarity, 1);

  const c3 = engine.classifyCatalyst('Board approves formal demerger of retail unit into separate listing');
  assert.strictEqual(c3.type, 'DEMERGER_VALUE_UNLOCK');
  assert.strictEqual(c3.polarity, 1);

  const c4 = engine.classifyCatalyst('CEO ousted amidst forensic audit into accounting irregularities');
  assert.strictEqual(c4.type, 'CEO_DISMISSAL_SCANDAL');
  assert.strictEqual(c4.polarity, -1);

  const c5 = engine.classifyCatalyst('DOJ files hostile antitrust injunction seeking forced breakup');
  assert.strictEqual(c5.type, 'ANTITRUST_SANCTION');
  assert.strictEqual(c5.polarity, -1);
});

// 4. Rumor vs. Fact Verification Tests
console.log('\n--- 4. Source Credibility & Rumor Verification ---');
runTest('Calculates source credibility tiers and flags speculative rumors', () => {
  const engine = new WebSeerEngine();

  const secFact = engine.evaluateRumorVsFact('sec.gov', 'Form 8-K material announcement filed with the commission', 1);
  assert.strictEqual(secFact.verificationState, 'CONFIRMED_FACT');
  assert.ok(secFact.sourceCredibility >= 0.95);
  assert.ok(secFact.rumorIndex <= 0.10);

  const anonymousRumor = engine.evaluateRumorVsFact('twitter', 'Anonymous sources say company weighs potential takeover bid, unconfirmed', 1);
  assert.strictEqual(anonymousRumor.verificationState, 'UNVERIFIED_RUMOR');
  assert.ok(anonymousRumor.rumorIndex >= 0.50);
  assert.ok(anonymousRumor.speculativeClues >= 2);
});

// 5. Search Velocity Spike Tracker Tests
console.log('\n--- 5. Search Velocity Spike Radar ---');
runTest('Tracks search query velocity and detects abnormal information volume surges', () => {
  const engine = new WebSeerEngine();

  // Baseline
  const v1 = engine.trackSearchSpike('NVDA');
  assert.strictEqual(v1.isSearchSpike, false);

  // Simulate surge of 5 query arrivals in succession
  engine.trackSearchSpike('NVDA');
  engine.trackSearchSpike('NVDA');
  engine.trackSearchSpike('NVDA');
  engine.trackSearchSpike('NVDA');
  const surge = engine.trackSearchSpike('NVDA');

  assert.ok(surge.hourlyCount >= 5);
  assert.strictEqual(surge.isSearchSpike, true);
  assert.strictEqual(surge.spikeStatus, 'ACUTE_SEARCH_VELOCITY_SPIKE');
});

// 6. Deduplication & State Buffer Tests
console.log('\n--- 6. Deduplication & Stream Buffer ---');
runTest('Deduplicates identical headlines and maintains rolling alert buffer', () => {
  const engine = new WebSeerEngine({ maxBuffer: 10 });

  const a1 = engine.processArticle({
    title: 'NVIDIA Jensen Huang formally reinstated as CEO with full board authority',
    source: 'The New York Times',
    pubDate: new Date().toISOString()
  });
  assert.ok(a1, 'First article must be processed');

  // Identical article must be deduplicated
  const a2 = engine.processArticle({
    title: 'NVIDIA Jensen Huang formally reinstated as CEO with full board authority',
    source: 'The New York Times',
    pubDate: new Date().toISOString()
  });
  assert.strictEqual(a2, null, 'Duplicate headline must return null');

  assert.strictEqual(engine.alertsBuffer.length, 1);
});

// 7. Historic Scenario Replay & Accuracy Invariants
console.log('\n--- 7. Historic Replay Benchmarking ---');
runTest('Replays historic benchmark scenarios with high fidelity', () => {
  const engine = new WebSeerEngine();

  const nvda = engine.replayScenario('NVDA_NOV23_JENSEN_REINSTATEMENT');
  assert.ok(nvda, 'Must replay NVDA scenario');
  assert.strictEqual(nvda.symbol, 'NVDA');
  assert.strictEqual(nvda.catalystType, 'LEADERSHIP_REINSTATEMENT');
  assert.ok(nvda.jumpPct > 20.0, 'NVDA predicted jump must exceed +20%');
  assert.ok(nvda.modelAccuracyPct >= 80.0, 'NVDA accuracy must exceed 80%');
  assert.ok(nvda.contagion.length >= 5, 'Must calculate supply chain contagion');
});

// Summary
console.log('\n================================================================');
console.log(`  WEBSEER TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
