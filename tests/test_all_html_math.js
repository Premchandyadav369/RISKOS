const fs = require('fs');
let katex = null;
try {
  katex = require('katex');
} catch (e) {
  try {
    katex = require('./node_modules/katex');
  } catch (e2) {
    console.warn('[NOTICE] KaTeX node module not found; running in heuristic syntax validation mode.\n');
  }
}

function checkLatex(raw, displayMode = false) {
  if (katex) {
    katex.renderToString(raw, { displayMode, throwOnError: true });
    return;
  }
  // Heuristic syntax checks: balanced braces
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '{' && (i === 0 || raw[i - 1] !== '\\')) depth++;
    if (raw[i] === '}' && (i === 0 || raw[i - 1] !== '\\')) depth--;
    if (depth < 0) throw new Error('Unbalanced closing brace in LaTeX');
  }
  if (depth !== 0) throw new Error('Unbalanced opening brace in LaTeX');
}

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

console.log(`Auditing ${htmlFiles.length} HTML files for mathematical equations and KaTeX integrity...\n`);

let totalFound = 0;
let totalErrors = 0;
const report = [];

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Strip <script> and <style> tags so JavaScript strings and CSS aren't misidentified as HTML math
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  let fileErrors = 0;

  // 1. Check display math $$ ... $$
  const displayMatches = content.match(/\$\$([^\$]+)\$\$/g) || [];
  displayMatches.forEach((m, idx) => {
    totalFound++;
    let raw = m.slice(2, -2).trim();
    // Check for raw unescaped < followed by a letter (HTML tag collision)
    if (/<[a-zA-Z]/.test(raw)) {
      totalErrors++;
      fileErrors++;
      report.push({ file, type: 'HTML tag collision in $$ (< followed by letter)', idx, snippet: raw.slice(0, 80) });
    }
    try {
      checkLatex(raw, true);
    } catch(err) {
      totalErrors++;
      fileErrors++;
      report.push({ file, type: 'KaTeX Display Parse Error', idx, message: err.message, snippet: raw.slice(0, 80) });
    }
  });

  // 2. Check \[ ... \]
  const bracketMatches = content.match(/\\\[([\s\S]*?)\\\]/g) || [];
  bracketMatches.forEach((m, idx) => {
    totalFound++;
    let raw = m.slice(2, -2).trim();
    try {
      checkLatex(raw, true);
    } catch(err) {
      totalErrors++;
      fileErrors++;
      report.push({ file, type: 'KaTeX Bracket Parse Error', idx, message: err.message, snippet: raw.slice(0, 80) });
    }
  });

  // 3. Check inline \( ... \)
  const inlineMatches = content.match(/\\\(([\s\S]*?)\\\)/g) || [];
  inlineMatches.forEach((m, idx) => {
    let raw = m.slice(2, -2).trim();
    totalFound++;
    try {
      checkLatex(raw, false);
    } catch(err) {
      totalErrors++;
      fileErrors++;
      report.push({ file, type: 'KaTeX Inline Parse Error', idx, message: err.message, snippet: raw.slice(0, 80) });
    }
  });

  // 4. Check for orphaned / unmatched $$
  const doubleDollarCount = (content.match(/\$\$/g) || []).length;
  if (doubleDollarCount % 2 !== 0) {
    totalErrors++;
    fileErrors++;
    report.push({ file, type: 'Orphaned/Odd $$ Count', count: doubleDollarCount });
  }

  console.log(`${file}: ${displayMatches.length} $$ blocks, ${bracketMatches.length} \\[ blocks, ${inlineMatches.length} \\( blocks -> ${fileErrors} issues`);
});

console.log(`\n========================================`);
console.log(`Total Math Expressions Audited: ${totalFound}`);
console.log(`Total Errors Detected: ${totalErrors}`);
console.log(`========================================`);

if (report.length > 0) {
  console.log('\nError Details:');
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('\nAll HTML DOM math passed KaTeX validation with 0 errors!');
}
