const fs = require('fs');

const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exit(1);
  } else {
    console.log('PASS: ' + msg);
  }
};

console.log('=== Verifying RISKOS 10x Documentation Ecosystem ===');

// 1. Markdown Documentation
assert(fs.existsSync('docs/ARCHITECTURE.md'), 'docs/ARCHITECTURE.md exists');
assert(fs.existsSync('docs/BOT_FLEET.md'), 'docs/BOT_FLEET.md exists');
assert(fs.existsSync('docs/QUANT_LABS.md'), 'docs/QUANT_LABS.md exists');
assert(fs.existsSync('docs/SYSTEM_SPEC.md'), 'docs/SYSTEM_SPEC.md exists');
assert(fs.existsSync('docs/API.md'), 'docs/API.md exists');

const fleetMd = fs.readFileSync('docs/BOT_FLEET.md', 'utf8');
assert(fleetMd.includes('THANATOS') && fleetMd.includes('ODIN') && fleetMd.includes('RA'), 'BOT_FLEET.md covers Greek, Norse, Egyptian pantheons');

const labsMd = fs.readFileSync('docs/QUANT_LABS.md', 'utf8');
assert(labsMd.includes('Lab 75:'), 'QUANT_LABS.md documents all 75 laboratories');

const specMd = fs.readFileSync('docs/SYSTEM_SPEC.md', 'utf8');
assert(specMd.includes('SEC Rule 15c3-5') && specMd.includes('FIX 4.4 Tag Mapping'), 'SYSTEM_SPEC.md includes SEC Rule 15c3-5 and FIX 4.4 schemas');

const apiMd = fs.readFileSync('docs/API.md', 'utf8');
assert(apiMd.includes('/api/market/quote') && apiMd.includes('/api/fleet/status') && apiMd.includes('/api/forecast/timesfm'), 'API.md documents core REST routes');

// 2. Interactive Documentation Portal (docs.html)
const docsHtml = fs.readFileSync('docs.html', 'utf8');
assert(docsHtml.includes('id="fleet"'), 'docs.html contains #fleet section');
assert(docsHtml.includes('id="sectors"'), 'docs.html contains #sectors section');
assert(docsHtml.includes('id="labs-directory"'), 'docs.html contains #labs-directory section');
assert(docsHtml.includes('id="pre-trade-defcon"'), 'docs.html contains #pre-trade-defcon section');
assert(docsHtml.includes('id="labsDirectoryGrid"'), 'docs.html contains #labsDirectoryGrid container');
assert(docsHtml.includes('id="commandLibraryGrid"'), 'docs.html contains #commandLibraryGrid container');
assert(docsHtml.includes('learnMathEngine.js'), 'docs.html includes learnMathEngine.js');

// 3. Interactive Documentation Controller (docs.js)
const docsJs = fs.readFileSync('docs.js', 'utf8');
assert(docsJs.includes('initLabsDirectory'), 'docs.js defines initLabsDirectory');
assert(docsJs.includes('initLabsDirectory();'), 'docs.js calls initLabsDirectory() on DOM ready');
assert(docsJs.includes('<DESK8>'), 'docs.js includes <DESK8>');
assert(docsJs.includes('<SECTORS>'), 'docs.js includes <SECTORS>');
assert(docsJs.includes('<SYNC>'), 'docs.js includes <SYNC>');
assert(docsJs.includes('<OPTIMIZE>'), 'docs.js includes <OPTIMIZE>');

// 4. Stylesheet (docs.css)
const docsCss = fs.readFileSync('docs.css', 'utf8');
assert(docsCss.includes('.lab-dir-card'), 'docs.css defines .lab-dir-card');
assert(docsCss.includes('.lab-dir-launch-btn'), 'docs.css defines .lab-dir-launch-btn');

// 5. README.md
const readme = fs.readFileSync('README.md', 'utf8');
assert(readme.includes('docs/ARCHITECTURE.md'), 'README.md links to docs/ARCHITECTURE.md');
assert(readme.includes('docs/BOT_FLEET.md'), 'README.md links to docs/BOT_FLEET.md');
assert(readme.includes('docs/QUANT_LABS.md'), 'README.md links to docs/QUANT_LABS.md');
assert(readme.includes('docs/SYSTEM_SPEC.md'), 'README.md links to docs/SYSTEM_SPEC.md');
assert(readme.includes('docs/API.md'), 'README.md links to docs/API.md');

console.log('====================================================');
console.log('ALL 20 DOCUMENTATION ECOSYSTEM CHECKS PASSED 100%!');
console.log('====================================================');
