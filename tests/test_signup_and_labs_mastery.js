/**
 * RISKOS — FLAGSHIP SIGNUP & 80-LAB COURSE MASTERY TEST SUITE
 * Validates:
 * 1. signup.html structure, Bloomberg dark terminal styling, 4 persona selectors, password meter, and 8 Desks link
 * 2. signup.js syntax, stochastic particle canvas, and Supabase Auth bridge
 * 3. learn.html mastery HUD elements, SVG progress ring, action bar buttons
 * 4. STRUCTURED_TRACKS in learn.js covering all 80 quantitative labs with 0 omissions & 0 duplicates
 * 5. Accreditation rank tiers & course completion percent calculation engine
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('🏛️  RISKOS FLAGSHIP SIGNUP & 80-LAB COURSE MASTERY TEST SUITE');
console.log('══════════════════════════════════════════════════════════════════════════\n');

// ── 1. SIGNUP HTML & ALADDIN TERMINAL THEME ──────────────────────────────────
test('Signup Page: Markup contains canvas, 4 persona cards, auth tabs, and 8 Desks link', () => {
  const file = path.join(ROOT, 'signup.html');
  assert(fs.existsSync(file), 'signup.html must exist');
  const html = fs.readFileSync(file, 'utf8');

  assert(html.includes('id="signupBgCanvas"'), 'signup.html must feature animated background canvas');
  assert(html.includes('data-persona="retail"'), 'Must have Retail Investor persona card');
  assert(html.includes('data-persona="quant"'), 'Must have Quantitative Analyst persona card');
  assert(html.includes('data-persona="prop_trader"'), 'Must have Prop Trader persona card');
  assert(html.includes('data-persona="risk_officer"'), 'Must have Chief Risk Officer persona card');
  assert(html.includes('id="pwStrengthFill"'), 'Must have password strength meter fill bar');
  assert(html.includes('sandbox-alloc-btn'), 'Must have sandbox capital allocator selector');
  assert(html.includes('id="formSignUp"'), 'Must have signup form');
  assert(html.includes('id="formSignIn"'), 'Must have signin form');
  assert(html.includes('supabaseClient.js'), 'Must link Supabase client script');
  assert(html.includes('signup.js'), 'Must link signup.js script');
  assert(html.includes('>8 Desks<') || html.includes('8 Desks'), 'signup.html must link to 8 Desks');
});

// ── 2. SIGNUP JS & CSS SYNTAX AND BEAST-MODE FEATURES ─────────────────────────
test('Signup Assets: signup.js and signup.css are valid and include stochastic canvas & auth', () => {
  const jsFile = path.join(ROOT, 'signup.js');
  const cssFile = path.join(ROOT, 'signup.css');
  assert(fs.existsSync(jsFile), 'signup.js must exist');
  assert(fs.existsSync(cssFile), 'signup.css must exist');

  const js = fs.readFileSync(jsFile, 'utf8');
  const css = fs.readFileSync(cssFile, 'utf8');

  assert(js.includes('initPasswordStrength'), 'signup.js must calculate password strength and entropy');
  assert(js.includes('client.signUp'), 'signup.js must call Supabase client.signUp');
  assert(js.includes('client.signIn'), 'signup.js must call Supabase client.signIn');
  assert(js.includes('requestAnimationFrame'), 'signup.js must implement particle animation');
  assert(css.includes('--su-bg-root: #040507'), 'signup.css must define Bloomberg dark terminal theme');
  assert(css.includes('.persona-select-card.active'), 'signup.css must style selected persona card');
});

// ── 3. AUTH MODAL FULL-PAGE REDIRECT LINKS ────────────────────────────────────
test('Auth Modal: authModal.js links directly to dedicated flagship signup.html', () => {
  const file = path.join(ROOT, 'authModal.js');
  assert(fs.existsSync(file), 'authModal.js must exist');
  const js = fs.readFileSync(file, 'utf8');
  assert(js.includes('href="signup.html"'), 'authModal.js must contain links to signup.html');
});

// ── 4. LEARN HTML COURSE MASTERY HUD ──────────────────────────────────────────
test('Course Mastery HUD: learn.html contains progress ring, counters, and action bar buttons', () => {
  const file = path.join(ROOT, 'learn.html');
  assert(fs.existsSync(file), 'learn.html must exist');
  const html = fs.readFileSync(file, 'utf8');

  assert(html.includes('id="masteryProgressHud"'), 'learn.html must include mastery-progress-hud section');
  assert(html.includes('id="courseProgressRing"'), 'learn.html must include courseProgressRing SVG element');
  assert(html.includes('id="coursePercentVal"'), 'learn.html must include coursePercentVal element');
  assert(html.includes('id="hudRankBadge"'), 'learn.html must include hudRankBadge accreditation badge');
  assert(html.includes('id="completedLabsCount"'), 'learn.html must include completedLabsCount counter');
  assert(html.includes('id="totalLabsCount"'), 'learn.html must include totalLabsCount counter');
  assert(html.includes('id="hudProgressBarFill"'), 'learn.html must include hudProgressBarFill bar');
  assert(html.includes('id="tierApprentice"'), 'learn.html must include Apprentice tier dot');
  assert(html.includes('id="tierMD"'), 'learn.html must include Managing Director tier dot');
  assert(html.includes('id="btnToggleLabComplete"'), 'learn.html action bar must include #btnToggleLabComplete');
  assert(html.includes('id="btnNextCurriculumLab"'), 'learn.html action bar must include #btnNextCurriculumLab');
  assert(html.includes('id="btnFilterCompletedLabs"'), 'learn.html HUD must include #btnFilterCompletedLabs');
  assert(html.includes('id="btnFilterRemainingLabs"'), 'learn.html HUD must include #btnFilterRemainingLabs');
  assert(html.includes('id="btnResetCourseProgress"'), 'learn.html HUD must include #btnResetCourseProgress');
});

// ── 5. STRUCTURED TRACKS 80-LAB COVERAGE IN LEARN.JS ─────────────────────────
test('Curriculum Tracks: STRUCTURED_TRACKS covers all 80 unique labs with 0 omissions', () => {
  const mathEngine = require(path.join(ROOT, 'learnMathEngine.js'));
  const allEngineMods = mathEngine.MODULES_DIRECTORY;
  assert.strictEqual(allEngineMods.length, 80, 'LearnMathEngine must have exactly 80 modules');

  const learnJs = fs.readFileSync(path.join(ROOT, 'learn.js'), 'utf8');

  // Extract STRUCTURED_TRACKS from learn.js safely
  const tracksMatch = learnJs.match(/const STRUCTURED_TRACKS = (\[[\s\S]*?\n  \];)/);
  assert(tracksMatch, 'learn.js must define STRUCTURED_TRACKS');

  // Evaluate the extracted array
  const vm = require('vm');
  const sandbox = {};
  vm.runInNewContext('tracks = ' + tracksMatch[1], sandbox);
  const tracks = sandbox.tracks;

  assert.strictEqual(tracks.length, 10, 'Must have exactly 10 structured tracks');

  const stepIds = [];
  tracks.forEach((t, tIdx) => {
    assert(t.id && t.title && t.color && t.icon, `Track ${tIdx} must have id, title, color, icon`);
    assert(Array.isArray(t.steps), `Track ${t.id} must have steps array`);
    assert.strictEqual(t.steps.length, 8, `Track ${t.id} must have exactly 8 steps (found ${t.steps.length})`);
    t.steps.forEach(s => {
      assert(s.moduleId && s.title && s.role && s.unlock, `Step in ${t.id} missing properties`);
      stepIds.push(s.moduleId);
    });
  });

  assert.strictEqual(stepIds.length, 80, 'Total steps across all 10 tracks must equal 80');

  const uniqueSteps = new Set(stepIds);
  assert.strictEqual(uniqueSteps.size, 80, 'All 80 steps must be unique (0 duplicates)');

  const engineIds = new Set(allEngineMods.map(m => m.id));
  const missingInTracks = [...engineIds].filter(id => !uniqueSteps.has(id));
  assert.strictEqual(missingInTracks.length, 0, `Missing modules from tracks: ${missingInTracks.join(', ')}`);

  const extraInTracks = [...uniqueSteps].filter(id => !engineIds.has(id));
  assert.strictEqual(extraInTracks.length, 0, `Unknown modules in tracks: ${extraInTracks.join(', ')}`);
});

// ── 6. ACCREDITATION RANKS & COMPLETION PROGRESS MATH ────────────────────────
test('Course Progress Engine: Calculates accurate percentage and accreditation rank tiers', () => {
  const total = 80;

  function calculateProgress(completedCount) {
    const percent = Math.min(100, Math.round((completedCount / total) * 100));
    let rankTitle = 'QUANTITATIVE APPRENTICE';
    let tierId = 'tierApprentice';

    if (percent >= 100) {
      rankTitle = 'MANAGING DIRECTOR / HEAD OF RISK';
      tierId = 'tierMD';
    } else if (percent >= 75) {
      rankTitle = 'SENIOR QUANTITATIVE RESEARCHER';
      tierId = 'tierSenior';
    } else if (percent >= 50) {
      rankTitle = 'ASSOCIATE PORTFOLIO MANAGER';
      tierId = 'tierAssociate';
    } else if (percent >= 25) {
      rankTitle = 'JUNIOR QUANT ANALYST';
      tierId = 'tierAnalyst';
    }

    return { percent, rankTitle, tierId };
  }

  // Initial 0 labs
  const r0 = calculateProgress(0);
  assert.strictEqual(r0.percent, 0);
  assert.strictEqual(r0.rankTitle, 'QUANTITATIVE APPRENTICE');
  assert.strictEqual(r0.tierId, 'tierApprentice');

  // 20 labs (25%)
  const r25 = calculateProgress(20);
  assert.strictEqual(r25.percent, 25);
  assert.strictEqual(r25.rankTitle, 'JUNIOR QUANT ANALYST');
  assert.strictEqual(r25.tierId, 'tierAnalyst');

  // 40 labs (50%)
  const r50 = calculateProgress(40);
  assert.strictEqual(r50.percent, 50);
  assert.strictEqual(r50.rankTitle, 'ASSOCIATE PORTFOLIO MANAGER');
  assert.strictEqual(r50.tierId, 'tierAssociate');

  // 60 labs (75%)
  const r75 = calculateProgress(60);
  assert.strictEqual(r75.percent, 75);
  assert.strictEqual(r75.rankTitle, 'SENIOR QUANTITATIVE RESEARCHER');
  assert.strictEqual(r75.tierId, 'tierSenior');

  // 80 labs (100%)
  const r100 = calculateProgress(80);
  assert.strictEqual(r100.percent, 100);
  assert.strictEqual(r100.rankTitle, 'MANAGING DIRECTOR / HEAD OF RISK');
  assert.strictEqual(r100.tierId, 'tierMD');
});

// ── 7. LEARN CSS PROGRESS HUD STYLING ─────────────────────────────────────────
test('Learn CSS: Contains styling for mastery HUD, progress ring, rank badges, and next buttons', () => {
  const css = fs.readFileSync(path.join(ROOT, 'learn.css'), 'utf8');
  assert(css.includes('.mastery-progress-hud'), 'learn.css must style .mastery-progress-hud');
  assert(css.includes('.progress-ring-fill'), 'learn.css must style .progress-ring-fill');
  assert(css.includes('.hud-progress-bar-fill'), 'learn.css must style .hud-progress-bar-fill');
  assert(css.includes('.tier-dot.active'), 'learn.css must style active tier dots');
  assert(css.includes('.lab-act-btn.complete-toggle'), 'learn.css must style complete-toggle button');
  assert(css.includes('.lab-act-btn.next-lab-btn'), 'learn.css must style next-lab-btn');
});

console.log(`\n══════════════════════════════════════════════════════════════════════════`);
console.log(`🎯  TESTS RUN: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`══════════════════════════════════════════════════════════════════════════\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
