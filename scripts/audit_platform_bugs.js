const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

console.log('================================================================');
console.log('  RISKOS ULTRA-FAST IN-PROCESS PLATFORM AUDIT & BUG HUNTER');
console.log('================================================================\n');

const findings = [];

// 1. Check all HTML asset references
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log(`[1] Auditing asset references across ${htmlFiles.length} HTML files...`);

htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');

  // Scripts
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
  scripts.forEach(m => {
    const src = m[1];
    if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      const cleanSrc = src.split('?')[0].split('#')[0];
      if (!fs.existsSync(cleanSrc)) {
        findings.push({
          category: 'Broken Script Reference',
          severity: 'HIGH',
          file,
          detail: `Script tag references "${src}" which does not exist on disk.`
        });
      }
    }
  });

  // Stylesheets
  const styles = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)];
  styles.forEach(m => {
    const href = m[1];
    if (href.endsWith('.css') && !href.startsWith('http') && !href.startsWith('//')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (!fs.existsSync(cleanHref)) {
        findings.push({
          category: 'Broken Stylesheet Reference',
          severity: 'HIGH',
          file,
          detail: `Stylesheet link references "${href}" which does not exist on disk.`
        });
      }
    }
  });

  // Links
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)];
  links.forEach(m => {
    const href = m[1];
    if (href.endsWith('.html') && !href.startsWith('http') && !href.startsWith('//')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (!fs.existsSync(cleanHref)) {
        findings.push({
          category: 'Broken Internal Link',
          severity: 'MEDIUM',
          file,
          detail: `Anchor link references "${href}" which does not exist on disk.`
        });
      }
    }
  });
});

// 2. Syntax validation for all JS files in root and subdirs using V8 vm.Script (zero subprocesses)
console.log('[2] Validating JavaScript syntax across all .js files via in-process V8 VM...');
function getJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'brain' || file === 'dist' || file === 'build') return;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsFiles(full));
    } else if (file.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

const jsFiles = getJsFiles('.');
console.log(`    Checking ${jsFiles.length} JavaScript files...`);
jsFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  if (f.startsWith('api' + path.sep) || f.startsWith('api/')) {
    try {
      new vm.SourceTextModule(code, { initializeImportMeta: () => {} });
    } catch (err) {
      findings.push({
        category: 'ESM Syntax Error',
        severity: 'CRITICAL',
        file: f,
        detail: err.message
      });
    }
    return;
  }
  try {
    new vm.Script(code, { filename: f });
  } catch (err) {
    findings.push({
      category: 'JS Syntax Error',
      severity: 'CRITICAL',
      file: f,
      detail: err.message
    });
  }
});

// 3. Search for unsafe JSON.parse on localStorage without try/catch
console.log('[3] Checking for unsafe JSON.parse() on localStorage...');
jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/JSON\.parse\s*\(\s*(?:localStorage|sessionStorage)\.getItem/.test(line)) {
      const context = lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 5)).join('\n');
      if (!context.includes('try') && !context.includes('catch')) {
        findings.push({
          category: 'Unsafe localStorage JSON.parse',
          severity: 'MEDIUM',
          file: `${f}:${idx + 1}`,
          detail: `Line "${line.trim()}" parses storage without try/catch guard.`
        });
      }
    }
  });
});

// 4. Search for AudioContext autoplay policy violations
console.log('[4] Checking AudioContext initialization...');
jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (/new\s+(?:window\.)?(?:AudioContext|webkitAudioContext)\s*\(\)/.test(content)) {
    if (!content.includes('resume') && !content.includes('state')) {
      findings.push({
        category: 'AudioContext Autoplay Warning',
        severity: 'LOW',
        file: f,
        detail: 'AudioContext created without checking state === "suspended" or .resume() on click.'
      });
    }
  }
});

// 5. Check for element querying that might be null before accessing .addEventListener or .innerHTML
console.log('[5] Checking for unguarded DOM element access...');
const htmlContents = {};
htmlFiles.forEach(f => { htmlContents[f] = fs.readFileSync(f, 'utf8'); });

// Find common IDs used in script files
const coreJs = ['app.js', 'hft.js', 'fleet.js', 'portfolio_optimizer.js'];
coreJs.forEach(jsFile => {
  if (!fs.existsSync(jsFile)) return;
  const content = fs.readFileSync(jsFile, 'utf8');
  const idMatches = [...content.matchAll(/getElementById\s*\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)\s*\.(addEventListener|innerHTML|textContent|value|style|classList)/gi)];
  idMatches.forEach(m => {
    const elId = m[1];
    const op = m[2];
    // Check if elId exists in the corresponding html file
    const matchedHtml = jsFile.replace('.js', '.html');
    if (htmlContents[matchedHtml] && !htmlContents[matchedHtml].includes(`id="${elId}"`) && !htmlContents[matchedHtml].includes(`id='${elId}'`)) {
      findings.push({
        category: 'Missing DOM Element ID in HTML',
        severity: 'HIGH',
        file: `${jsFile} -> ${matchedHtml}`,
        detail: `JS calls .${op} on document.getElementById("${elId}") which does not exist in ${matchedHtml}`
      });
    }
  });
});

console.log('\n================================================================');
console.log(`  AUDIT COMPLETE: ${findings.length} findings identified`);
console.log('================================================================\n');

findings.forEach((f, idx) => {
  console.log(`[${idx + 1}] [${f.severity}] ${f.category} in ${f.file}`);
  console.log(`    ${f.detail}\n`);
});

fs.writeFileSync('audit_findings.json', JSON.stringify(findings, null, 2));
