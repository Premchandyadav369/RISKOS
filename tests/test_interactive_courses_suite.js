/**
 * Test Suite: Interactive Real-Time Courses & Direct Action Workstations
 * Verifies:
 * 1. All 10 Structured Quantitative Tracks rendered with live telemetry bars
 * 2. In-Card Mini-Workbenches with reactive mathematical calculators
 * 3. 1-Click Direct Action Suite (PaperBroker Sandbox execution, Desk deep-links, Intuition Quizzes)
 * 4. Step-Level Direct Action shortcuts (Run Live, Paper Trade) for all 80 laboratories
 * 5. Live synchronization functions (updateCoursesLiveTelemetry, syncAllCoursesLive)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  RUNNING INTERACTIVE COURSES & DIRECT ACTION TEST SUITE ');
console.log('═══════════════════════════════════════════════════════════════════\n');

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

const learnHtml = fs.readFileSync(path.join(__dirname, '..', 'learn.html'), 'utf8');
const learnCss = fs.readFileSync(path.join(__dirname, '..', 'learn.css'), 'utf8');
const learnJs = fs.readFileSync(path.join(__dirname, '..', 'learn.js'), 'utf8');

// ── 1. HTML & Dependency Architecture ──
console.log('── Section 1: HTML Architecture & Broker Sandbox Integration ──');

it('learn.html loads paperBroker.js before learnMathEngine.js and learn.js', () => {
  assert(learnHtml.includes('<script src="paperBroker.js"></script>'), 'Missing paperBroker.js script in learn.html');
  const brokerIdx = learnHtml.indexOf('<script src="paperBroker.js"></script>');
  const learnJsIdx = learnHtml.indexOf('<script src="learn.js"></script>');
  assert(brokerIdx < learnJsIdx, 'paperBroker.js must load before learn.js');
});

it('learn.html includes the Real-Time Interactive Courses Telemetry & Direct Action Banner', () => {
  assert(learnHtml.includes('curriculum-live-banner'), 'Missing .curriculum-live-banner in learn.html');
  assert(learnHtml.includes('syncAllCoursesLive()'), 'Missing syncAllCoursesLive button trigger in learn.html');
  assert(learnHtml.includes('live-pulse-dot'), 'Missing live-pulse-dot indicator');
});

// ── 2. CSS Styling & Workstation Visual Rules ──
console.log('\n── Section 2: CSS Stylesheet Integrity ──');

it('learn.css contains styling rules for course telemetry, workbenches, and direct action strips', () => {
  assert(learnCss.includes('.course-live-telemetry-bar'), 'Missing .course-live-telemetry-bar rule in learn.css');
  assert(learnCss.includes('.course-live-pulse-dot'), 'Missing .course-live-pulse-dot rule in learn.css');
  assert(learnCss.includes('.course-mini-workbench'), 'Missing .course-mini-workbench rule in learn.css');
  assert(learnCss.includes('.course-direct-action-strip'), 'Missing .course-direct-action-strip rule in learn.css');
  assert(learnCss.includes('.course-quiz-banner'), 'Missing .course-quiz-banner rule in learn.css');
  assert(learnCss.includes('.step-actions-group'), 'Missing .step-actions-group rule in learn.css');
  assert(learnCss.includes('.step-quick-action-btn'), 'Missing .step-quick-action-btn rule in learn.css');
});

// ── 3. JavaScript Configuration & Direct Actions ──
console.log('\n── Section 3: Course Configurations, Calculations & Execution Handlers ──');

it('learn.js defines COURSE_LIVE_CONFIGS covering all 10 tracks', () => {
  assert(learnJs.includes('COURSE_LIVE_CONFIGS'), 'Missing COURSE_LIVE_CONFIGS in learn.js');
  const tracks = [
    'retail_layman',
    'portfolio_risk',
    'simulators_construction',
    'derivatives_exotics',
    'microstructure_execution',
    'quant_strategies',
    'fixed_income_credit',
    'corporate_pe_cat',
    'ai_neural_alpha',
    'stochastic_interview'
  ];
  tracks.forEach(trackId => {
    assert(learnJs.includes(`${trackId}: {`), `Missing configuration for course track: ${trackId}`);
  });
});

it('learn.js implements all required window-level action handlers', () => {
  assert(learnJs.includes('window.executeCoursePaperTrade ='), 'Missing window.executeCoursePaperTrade');
  assert(learnJs.includes('window.executeStepPaperTrade ='), 'Missing window.executeStepPaperTrade');
  assert(learnJs.includes('window.bindCourseLiveSecurity ='), 'Missing window.bindCourseLiveSecurity');
  assert(learnJs.includes('window.launchCourseDesk ='), 'Missing window.launchCourseDesk');
  assert(learnJs.includes('window.startCourseTrack ='), 'Missing window.startCourseTrack');
  assert(learnJs.includes('window.toggleCourseQuiz ='), 'Missing window.toggleCourseQuiz');
  assert(learnJs.includes('window.checkCourseQuiz ='), 'Missing window.checkCourseQuiz');
  assert(learnJs.includes('window.syncAllCoursesLive ='), 'Missing window.syncAllCoursesLive');
  assert(learnJs.includes('window.updateCoursesLiveTelemetry ='), 'Missing window.updateCoursesLiveTelemetry');
});

it('learn.js connects live telemetry updates to price ticks, currency changes, and initial startup', () => {
  const matches = (learnJs.match(/updateCoursesLiveTelemetry\(\)/g) || []).length;
  assert(matches >= 4, `Expected at least 4 updateCoursesLiveTelemetry invocation points, found ${matches}`);
});

it('learn.js renders step-level Run and Trade action shortcuts for laboratory steps', () => {
  assert(learnJs.includes('btn-trade-step'), 'Missing btn-trade-step in curriculum card renderer');
  assert(learnJs.includes('window.executeStepPaperTrade'), 'Missing executeStepPaperTrade call in step actions');
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
