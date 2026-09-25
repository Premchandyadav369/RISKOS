const katex = require('katex');
const fs = require('fs');
const LearnMathEngine = require('./learnMathEngine.js');

console.log("═══════════════════════════════════════════════════════════════");
console.log("🔍 COMPREHENSIVE KATEX AUDIT: LABS & DOCUMENTATION");
console.log("═══════════════════════════════════════════════════════════════\n");

// Sanitize function from learn.js
const sanitizeLatex = (raw) => {
  if (!raw) return '';
  let clean = String(raw).trim();
  if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length >= 4) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('\\[') && clean.endsWith('\\]') && clean.length >= 4) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('\\(') && clean.endsWith('\\)') && clean.length >= 4) {
    clean = clean.slice(2, -2).trim();
  }
  // Escape unescaped % so it never comments out the formula in KaTeX
  clean = clean.replace(/(^|[^\\])%/g, '$1\\%');
  // Wrap raw ₹ in \text{₹}
  clean = clean.replace(/₹/g, '\\text{₹}');
  // Escape single unescaped $
  clean = clean.replace(/(^|[^\\])\$(?!\$)/g, '$1\\$');
  return clean;
};

// 1. AUDIT LEARN MATH ENGINE MODULES
let labErrors = 0;
const modules = LearnMathEngine.MODULES_DIRECTORY || [];
console.log(`Checking ${modules.length} Lab Simulation Modules...`);

modules.forEach((mod, idx) => {
  const calc = mod.calc || mod.calculate;
  if (!calc) return;

  // Test with INR and USD
  ['INR', 'USD'].forEach(curr => {
    try {
      const res = calc({}, curr);
      if (!res) return;

      // Check equationLatex
      if (res.equationLatex) {
        const clean = sanitizeLatex(res.equationLatex);
        try {
          katex.renderToString(clean, { displayMode: true, throwOnError: true });
        } catch (err) {
          labErrors++;
          console.error(`❌ [LAB FAIL] Module "${mod.id}" (${mod.name}) equationLatex error [${curr}]:`, err.message);
          console.error(`   RAW: ${res.equationLatex}`);
          console.error(`   CLEAN: ${clean}\n`);
        }
      }

      // Check substitutedLatex
      if (res.substitutedLatex) {
        const clean = sanitizeLatex(res.substitutedLatex);
        try {
          katex.renderToString(clean, { displayMode: true, throwOnError: true });
        } catch (err) {
          labErrors++;
          console.error(`❌ [LAB FAIL] Module "${mod.id}" (${mod.name}) substitutedLatex error [${curr}]:`, err.message);
          console.error(`   RAW: ${res.substitutedLatex}`);
          console.error(`   CLEAN: ${clean}\n`);
        }
      }
    } catch (e) {
      console.error(`Error calculating module ${mod.id}:`, e.message);
    }
  });
});

console.log(`\nLab Modules Audit Complete. Total Errors: ${labErrors}\n`);

// 2. AUDIT README.MD EQUATIONS
console.log("Checking README.md Mathematical Equations...");
const readme = fs.readFileSync('README.md', 'utf-8');
const lines = readme.split('\n');
let readmeErrors = 0;

// Check display math $$ blocks
let inDisplay = false;
let displayBlock = [];
let displayStart = 0;

lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed === '$$') {
    if (!inDisplay) {
      inDisplay = true;
      displayStart = idx + 1;
      displayBlock = [];
    } else {
      inDisplay = false;
      const mathStr = displayBlock.join('\n');
      try {
        katex.renderToString(mathStr, { displayMode: true, throwOnError: true });
      } catch (err) {
        readmeErrors++;
        console.error(`❌ [README FAIL] Display Math at Line ${displayStart}-${idx+1}:`, err.message);
        console.error(`   BLOCK:\n${mathStr}\n`);
      }
      displayBlock = [];
    }
  } else if (inDisplay) {
    displayBlock.push(line);
  } else {
    // Check single line $$ ... $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4) {
      const mathStr = trimmed.slice(2, -2).trim();
      try {
        katex.renderToString(mathStr, { displayMode: true, throwOnError: true });
      } catch (err) {
        readmeErrors++;
        console.error(`❌ [README FAIL] Single-line Display Math at Line ${idx+1}:`, err.message);
        console.error(`   MATH: ${mathStr}\n`);
      }
    }
    // Check inline $ ... $
    const inlineMatches = line.match(/\$([^\$\n]+)\$/g);
    if (inlineMatches) {
      inlineMatches.forEach(m => {
        const mathStr = m.slice(1, -1).trim();
        // Skip obvious currency like $5,648.20
        if (/^[0-9,.]+$/.test(mathStr)) return;
        try {
          katex.renderToString(mathStr, { displayMode: false, throwOnError: true });
        } catch (err) {
          readmeErrors++;
          console.error(`❌ [README FAIL] Inline Math at Line ${idx+1}:`, err.message);
          console.error(`   EXPR: ${m}\n`);
        }
      });
    }
  }
});

console.log(`\nREADME Audit Complete. Total Errors: ${readmeErrors}\n`);
console.log("═══════════════════════════════════════════════════════════════");
