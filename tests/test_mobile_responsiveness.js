/**
 * Test Suite for RISKOS Mobile Responsiveness & Navigation Suite
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Running Mobile Responsiveness Test Suite ===');

let testsPassed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

const baseDir = path.resolve(__dirname, '..');

// 1. Check mobileResponsive.css rules
runTest('mobileResponsive.css contains responsive layout rules', () => {
  const cssPath = path.join(baseDir, 'mobileResponsive.css');
  assert(fs.existsSync(cssPath), 'mobileResponsive.css exists');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert(css.includes('.mobile-bottom-nav'), 'Contains .mobile-bottom-nav');
  assert(css.includes('.table-responsive-wrapper'), 'Contains .table-responsive-wrapper');
  assert(css.includes('@media (max-width: 768px)'), 'Contains 768px breakpoint');
  assert(css.includes('overflow-x: hidden !important'), 'Prevents horizontal page blowout');
});

// 2. Check mobileNav.js structure
runTest('mobileNav.js contains initialization and sheet overlay logic', () => {
  const jsPath = path.join(baseDir, 'mobileNav.js');
  assert(fs.existsSync(jsPath), 'mobileNav.js exists');
  const js = fs.readFileSync(jsPath, 'utf8');

  assert(js.includes('initMobileNav'), 'Contains initMobileNav');
  assert(js.includes('mobile-bottom-nav'), 'Injects mobile bottom nav');
  assert(js.includes('mobile-more-sheet'), 'Injects mobile more sheet');
});

// 3. Verify all 8 HTML files include mobile and universal suites
const htmlFiles = [
  'index.html',
  'app.html',
  'fleet.html',
  'ticker.html',
  'portfolio_optimizer.html',
  'observatory.html',
  'learn.html',
  'docs.html'
];

htmlFiles.forEach(hf => {
  runTest(`File ${hf} contains mobileResponsive.css and universal scripts`, () => {
    const fpath = path.join(baseDir, hf);
    assert(fs.existsSync(fpath), `${hf} exists`);
    const content = fs.readFileSync(fpath, 'utf8');

    assert(content.includes('mobileResponsive.css'), `${hf} links mobileResponsive.css`);
    assert(content.includes('universalPalette.css'), `${hf} links universalPalette.css`);
    assert(content.includes('universalExplainer.css'), `${hf} links universalExplainer.css`);
    assert(content.includes('marketDataTruth.js'), `${hf} links marketDataTruth.js`);
    assert(content.includes('universalExplainer.js'), `${hf} links universalExplainer.js`);
    assert(content.includes('universalPalette.js'), `${hf} links universalPalette.js`);
    assert(content.includes('mobileNav.js'), `${hf} links mobileNav.js`);
  });
});

// 4. Verify index.html contains progressive disclosure sections
runTest('index.html contains 3-Layer progressive disclosure and persona selector', () => {
  const indexPath = path.join(baseDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');

  assert(content.includes('progressive-container'), 'Contains progressive-container');
  assert(content.includes('personaPillGroup'), 'Contains persona selector');
  assert(content.includes('onboarding-cards-grid'), 'Contains onboarding cards');
  assert(content.includes('truthBanner'), 'Contains truth & provenance audit banner');
  assert(content.includes('pipeline-card'), 'Contains interactive system pipeline map');
});

console.log(`All ${testsPassed} Mobile Responsiveness tests passed successfully!
`);
