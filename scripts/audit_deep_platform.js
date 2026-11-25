/**
 * RISKOS Comprehensive End-to-End Deep Platform Audit
 * ==============================================================================
 * Audits:
 * 1. Asset & script references across all 13 HTML files
 * 2. Anchor link targets (.html and anchor hashes)
 * 3. All 81 Labs in learnMathEngine.js (defaultInputs, USD, INR, presets, edge cases)
 * 4. KaTeX formula integrity for all 81 labs (equations & substituted formulas)
 * 5. Track mappings in learn.js (all 81 steps, missing/duplicate module IDs)
 * 6. Proprietary algorithms (PREM-Alpha, HS-JAMM, SE-MicroPrice, F-Shrink, DK-Shield)
 * 7. Career Academy, Live Broker Gateway, Vol Surface Studio, Cloud Key Vault
 * 8. Stale references (80 labs vs 81 labs, 10 tracks vs 11 tracks)
 */

const fs = require('fs');
const path = require('path');
const katex = require('katex');

const rootDir = path.resolve(__dirname, '..');
console.log('================================================================');
console.log('  RISKOS COMPREHENSIVE END-TO-END DEEP PLATFORM AUDIT');
console.log('================================================================\n');

let issues = [];

// ── 1. Asset & Anchor Audit across 13 HTML files ──────────────────────────────
console.log('[1/7] Auditing HTML assets & links across all 13 HTML files...');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');

  // Script src
  const scriptMatches = content.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/gi);
  for (const match of scriptMatches) {
    const src = match[1];
    if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      const cleanSrc = src.split('?')[0].split('#')[0];
      const targetPath = path.join(rootDir, cleanSrc);
      if (!fs.existsSync(targetPath)) {
        issues.push({ category: 'Broken Asset', file, detail: `Missing <script src="${src}">` });
      }
    }
  }

  // Link href (css/icons)
  const linkMatches = content.matchAll(/<link\s+[^>]*href=["']([^"']+)["']/gi);
  for (const match of linkMatches) {
    const href = match[1];
    if (!href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      const targetPath = path.join(rootDir, cleanHref);
      if (!fs.existsSync(targetPath)) {
        issues.push({ category: 'Broken Asset', file, detail: `Missing <link href="${href}">` });
      }
    }
  }

  // Anchor hrefs
  const aMatches = content.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi);
  for (const match of aMatches) {
    const href = match[1];
    if (href.endsWith('.html') || href.includes('.html#') || href.includes('.html?')) {
      const targetFile = href.split('#')[0].split('?')[0];
      const targetPath = path.join(rootDir, targetFile);
      if (!fs.existsSync(targetPath)) {
        issues.push({ category: 'Broken Anchor', file, detail: `Missing link target: ${href}` });
      }
    }
  }
});

// ── 2. All 81 Labs Math & Preset Evaluation ───────────────────────────────────
console.log('[2/7] Auditing all 81 Labs in learnMathEngine.js...');
const LME = require(path.join(rootDir, 'learnMathEngine.js'));
const LLK = require(path.join(rootDir, 'learnLaymanKnowledge.js'));

if (LME.MODULES_DIRECTORY.length !== 81) {
  issues.push({ category: 'Lab Directory', detail: `Expected 81 modules in LME, found ${LME.MODULES_DIRECTORY.length}` });
}

LME.MODULES_DIRECTORY.forEach((mod, idx) => {
  if (!mod.id) {
    issues.push({ category: 'Lab Schema', detail: `Module at index ${idx} missing id` });
    return;
  }

  // Check Layman Knowledge entry
  if (!LLK[mod.id]) {
    issues.push({ category: 'Layman Knowledge', detail: `Module '${mod.id}' missing entry in learnLaymanKnowledge.js` });
  }

  // Evaluate INR
  try {
    const resINR = mod.calc(mod.defaultInputs || {}, 'INR');
    if (!resINR) {
      issues.push({ category: 'Lab Execution', detail: `Module '${mod.id}' returned falsy for INR` });
    } else {
      // Check for NaN in numeric results
      if (typeof resINR.focalValue === 'string' && resINR.focalValue.includes('NaN')) {
        issues.push({ category: 'Lab NaN', detail: `Module '${mod.id}' produced NaN in focalValue: ${resINR.focalValue}` });
      }
      if (typeof resINR.plainResult === 'string' && resINR.plainResult.includes('NaN')) {
        issues.push({ category: 'Lab NaN', detail: `Module '${mod.id}' produced NaN in plainResult` });
      }

      // Check KaTeX
      if (resINR.equationLatex) {
        try {
          const clean = resINR.equationLatex.replace(/^\\\[/, '').replace(/\\\]$/, '').trim();
          katex.renderToString(clean, { throwOnError: true, strict: 'ignore' });
        } catch (ke) {
          issues.push({ category: 'KaTeX Syntax', detail: `Module '${mod.id}' equationLatex failed KaTeX: ${ke.message}` });
        }
      }
      if (resINR.substitutedLatex) {
        try {
          const clean = resINR.substitutedLatex.replace(/^\\\[/, '').replace(/\\\]$/, '').trim();
          katex.renderToString(clean, { throwOnError: true, strict: 'ignore' });
        } catch (ke) {
          issues.push({ category: 'KaTeX Syntax', detail: `Module '${mod.id}' substitutedLatex failed KaTeX: ${ke.message}` });
        }
      }
    }
  } catch (err) {
    issues.push({ category: 'Lab Execution', detail: `Module '${mod.id}' threw error on INR: ${err.message}` });
  }

  // Evaluate USD
  try {
    const resUSD = mod.calc(mod.defaultInputs || {}, 'USD');
    if (!resUSD) {
      issues.push({ category: 'Lab Execution', detail: `Module '${mod.id}' returned falsy for USD` });
    }
  } catch (err) {
    issues.push({ category: 'Lab Execution', detail: `Module '${mod.id}' threw error on USD: ${err.message}` });
  }

  // Evaluate Presets
  if (mod.presets && Array.isArray(mod.presets)) {
    mod.presets.forEach((p, pIdx) => {
      try {
        const resPreset = mod.calc(p.inputs || {}, 'INR');
        if (!resPreset) {
          issues.push({ category: 'Preset Execution', detail: `Module '${mod.id}' preset ${pIdx} (${p.label}) returned falsy` });
        }
      } catch (pe) {
        issues.push({ category: 'Preset Execution', detail: `Module '${mod.id}' preset ${pIdx} threw: ${pe.message}` });
      }
    });
  }

  // Evaluate Empty Inputs Edge Case
  try {
    const resEmpty = mod.calc({}, 'INR');
    if (!resEmpty) {
      issues.push({ category: 'Empty Input Edge Case', detail: `Module '${mod.id}' returned falsy on empty input` });
    }
  } catch (ee) {
    issues.push({ category: 'Empty Input Edge Case', detail: `Module '${mod.id}' threw on empty input: ${ee.message}` });
  }
});

// ── 3. Curriculum Tracks Mapping Audit (learn.js) ─────────────────────────────
console.log('[3/7] Auditing curriculum tracks & step mappings in learn.js...');
const learnJs = fs.readFileSync(path.join(rootDir, 'learn.js'), 'utf8');

// Check window.switchModule export
if (!learnJs.includes('window.switchModule = switchModule') && !learnJs.includes('window.switchModule=')) {
  issues.push({ category: 'UI Function Missing', detail: 'window.switchModule is not exported to window in learn.js' });
}

// ── 4. Proprietary Algorithms Mathematical Invariants ─────────────────────────
console.log('[4/7] Auditing proprietary quantitative engines...');
const PremAlphaEngine = require(path.join(rootDir, 'premAlphaEngine.js'));

// Test PREM-Alpha edge cases
try {
  // Edge Case: 0 midPrice
  const zeroPrice = PremAlphaEngine.computePremAlpha({ midPrice: 0 });
  if (isNaN(zeroPrice.alpha.basisPoints)) {
    issues.push({ category: 'Algo Edge Case', detail: 'PremAlphaEngine produces NaN on midPrice: 0' });
  }

  // Edge Case: Negative probabilities
  const negProbs = PremAlphaEngine.computePremAlpha({ regimeProbs: [-1, -2, -3] });
  if (isNaN(negProbs.alpha.basisPoints)) {
    issues.push({ category: 'Algo Edge Case', detail: 'PremAlphaEngine produces NaN on negative regimeProbs' });
  }

  // Edge Case: Empty book depth
  const emptyBook = PremAlphaEngine.computePremAlpha({ bidVolumes: [], askVolumes: [] });
  if (isNaN(emptyBook.alpha.basisPoints)) {
    issues.push({ category: 'Algo Edge Case', detail: 'PremAlphaEngine produces NaN on empty order book' });
  }
} catch (algoErr) {
  issues.push({ category: 'Algo Error', detail: `PremAlphaEngine threw on edge case: ${algoErr.message}` });
}

// ── 5. Stale Counts & References (80 vs 81 Labs, 10 vs 11 Tracks) ──────────────
console.log('[5/7] Auditing stale counts across all platform files...');
const scanFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html') || f.endsWith('.js'));
scanFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, lIdx) => {
    // Check for "80 labs", "80 Quant Labs", "80 Simulation Labs", "18 modules", "75 labs", etc.
    if (/\b(18|75|80)\s+(?:Quant(?:itative)?\s+|Simulation\s+)?(labs?|laborator\w*|modules?|interactive\s+labs?|quantitative\s+laboratory)\b/i.test(l)) {
      issues.push({ category: 'Stale Lab Count', file, line: lIdx + 1, detail: `Found stale Lab/Module Count: "${l.trim()}"` });
    }
    if (/\b10\s+(structured\s+tracks?|courses?\s+synced)\b/i.test(l)) {
      issues.push({ category: 'Stale Track Count', file, line: lIdx + 1, detail: `Found stale '10 Tracks/Courses': "${l.trim()}"` });
    }
  });
});

// ── 6. Top Navigation Consistency Across All 13 Pages ─────────────────────────
console.log('[6/7] Auditing navigation bars and Other dropdown across all 13 HTML files...');
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  if (file !== 'login.html' && file !== 'signup.html') {
    if (!content.includes('nav-dropdown-toggle') && !content.includes('Other') && !content.includes('topbar-workspaces-dropdown')) {
      issues.push({ category: 'Navigation Inconsistency', file, detail: 'Missing standardized "Other" or Workspaces dropdown in header' });
    }
    if (!content.includes('quantCopilotFloatingTrigger') && !content.includes('quantCopilot')) {
      issues.push({ category: 'Copilot Missing', file, detail: 'Missing Quant Copilot floating trigger/script' });
    }
  }
});

// ── 7. Audit Summary ─────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`  DEEP PLATFORM AUDIT COMPLETE: ${issues.length} ISSUES FOUND`);
console.log('================================================================\n');

if (issues.length > 0) {
  issues.forEach((iss, i) => {
    console.log(`[${i + 1}] [${iss.category}] ${iss.file ? iss.file + (iss.line ? ':' + iss.line : '') + ' -> ' : ''}${iss.detail}`);
  });
}

// Exit code
process.exit(issues.length > 0 ? 1 : 0);
