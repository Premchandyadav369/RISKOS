const fs = require('fs');
const katex = require('katex');

const html = fs.readFileSync('learn.html', 'utf8');

// 1. Check all strategy-blueprint-card elements
const cardRegex = /<div class="strategy-blueprint-card"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
const cards = [];
let match;

const formulaMathRegex = /<div class="formula-math"(?:\s+data-formula="([^"]+)")?>([\s\S]*?)<\/div>/g;
let fMatch;
let foundFormulas = 0;

console.log('--- AUDITING STRATEGY BLUEPRINT FORMULAS ---');
while ((fMatch = formulaMathRegex.exec(html)) !== null) {
  foundFormulas++;
  const dataFormula = fMatch[1];
  let innerFormula = fMatch[2].trim();
  if (innerFormula.startsWith('$$') && innerFormula.endsWith('$$')) {
    innerFormula = innerFormula.slice(2, -2).trim();
  }

  console.log(`\nFormula #${foundFormulas}:`);
  console.log('data-formula:', dataFormula);
  console.log('inner-formula:', innerFormula);

  // Test rendering data-formula
  try {
    const renderedData = katex.renderToString(dataFormula, { displayMode: true, throwOnError: true });
    console.log(`  -> data-formula KaTeX: PASS (output len: ${renderedData.length})`);
  } catch (err) {
    console.error(`  -> data-formula KaTeX: FAIL - ${err.message}`);
    process.exit(1);
  }

  // Test rendering inner formula
  try {
    const renderedInner = katex.renderToString(innerFormula, { displayMode: true, throwOnError: true });
    console.log(`  -> inner-formula KaTeX: PASS (output len: ${renderedInner.length})`);
  } catch (err) {
    console.error(`  -> inner-formula KaTeX: FAIL - ${err.message}`);
    process.exit(1);
  }
}

if (foundFormulas !== 7) {
  console.error(`Expected 7 blueprint formulas, but found ${foundFormulas}!`);
  process.exit(1);
}

// 2. Check all inline math in strategy descriptions
console.log('\n--- AUDITING STRATEGY DESCRIPTIONS INLINE MATH ---');
const descRegex = /<p class="strat-desc">([\s\S]*?)<\/p>/g;
let dMatch;
let descCount = 0;
while ((dMatch = descRegex.exec(html)) !== null) {
  descCount++;
  const descText = dMatch[1];
  const inlineMathMatches = descText.match(/\\\(([\s\S]*?)\\\)/g) || [];
  console.log(`Card #${descCount} has ${inlineMathMatches.length} inline math expressions:`, inlineMathMatches);
  inlineMathMatches.forEach(im => {
    const raw = im.slice(2, -2).trim();
    try {
      const res = katex.renderToString(raw, { displayMode: false, throwOnError: true });
      console.log(`  -> "${raw}": PASS`);
    } catch(err) {
      console.error(`  -> "${raw}": FAIL - ${err.message}`);
      process.exit(1);
    }
  });
}

console.log('\n=== ALL 7 BLUEPRINT FORMULAS & INLINE MATH VERIFIED 100% FLAWLESS ===');
