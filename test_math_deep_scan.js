const fs = require('fs');
const katex = require('katex');

console.log("=================================================");
console.log("DEEP MATHEMATICAL & KATEX INTEGRITY SCANNER");
console.log("=================================================\n");

let totalIssues = 0;

function scanMarkdownFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  console.log(`Scanning markdown file: ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inDisplay = false;
  let displayBlock = [];
  let displayStart = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check display math $$
    if (trimmed === '$$') {
      if (!inDisplay) {
        inDisplay = true;
        displayStart = lineNum;
        displayBlock = [];
      } else {
        inDisplay = false;
        const math = displayBlock.join('\n');
        try {
          katex.renderToString(math, { displayMode: true, throwOnError: true });
        } catch (err) {
          totalIssues++;
          console.error(`❌ [${filePath}:${displayStart}-${lineNum}] Display Math Error:`, err.message);
          console.error(`   Math snippet: ${math.slice(0, 100)}...`);
        }
      }
      return;
    }

    if (inDisplay) {
      displayBlock.push(line);
      return;
    }

    // Check single-line display math $$...$$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4) {
      const math = trimmed.slice(2, -2).trim();
      try {
        katex.renderToString(math, { displayMode: true, throwOnError: true });
      } catch (err) {
        totalIssues++;
        console.error(`❌ [${filePath}:${lineNum}] Single-line Display Math Error:`, err.message);
        console.error(`   Math snippet: ${math}`);
      }
      return;
    }

    // Check table rows: if line starts and ends with |, search for unescaped | inside $...$
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Find all $...$ in this line
      const mathRegex = /\$([^\$\n]+)\$/g;
      let m;
      while ((m = mathRegex.exec(line)) !== null) {
        const mathContent = m[1];
        if (mathContent.includes('|')) {
          totalIssues++;
          console.error(`⚠️ [${filePath}:${lineNum}] Markdown Table syntax conflict: raw '|' inside math: $${mathContent}$ (Splits table column!)`);
        }
      }
    }

    // Check inline math $...$
    const inlineRegex = /\$([^\$\n]+)\$/g;
    let match;
    while ((match = inlineRegex.exec(line)) !== null) {
      const math = match[1];
      // Skip currencies like $100, $5.50
      if (/^[0-9,.\s]+$/.test(math)) continue;
      if (/^[A-Z0-9_\-]+$/.test(math)) continue; // skip shell variables or identifiers

      // Check space after opening or before closing $
      if (math.startsWith(' ') || math.endsWith(' ')) {
        // Warning: GitHub markdown doesn't parse $ math $
        // console.warn(`⚠️ [${filePath}:${lineNum}] Whitespace padding in inline math: "$${math}$"`);
      }

      // Check unescaped %
      if (/(^|[^\\])%/.test(math)) {
        totalIssues++;
        console.error(`❌ [${filePath}:${lineNum}] Unescaped % in inline math: $${math}$ (Comments out formula!)`);
      }

      // Test KaTeX render
      try {
        katex.renderToString(math, { displayMode: false, throwOnError: true });
      } catch (err) {
        totalIssues++;
        console.error(`❌ [${filePath}:${lineNum}] KaTeX Inline Parse Error:`, err.message);
        console.error(`   Expression: $${math}$`);
      }
    }
  });
}

scanMarkdownFile('README.md');
if (fs.existsSync('docs/QUANT_LABS.md')) {
  scanMarkdownFile('docs/QUANT_LABS.md');
}
if (fs.existsSync('docs/MATHEMATICAL_PROOFS.md')) {
  scanMarkdownFile('docs/MATHEMATICAL_PROOFS.md');
}

console.log(`\nScan complete. Total issues detected: ${totalIssues}\n`);
