const fs = require('fs');
const katex = require('katex');
const html = fs.readFileSync('learn.html', 'utf-8');

// match all $$...$$
const displayMatches = html.match(/\$\$([^\$]+)\$\$/g) || [];
console.log('Total $$ in learn.html:', displayMatches.length);
displayMatches.forEach((m, i) => {
  const code = m.slice(2, -2).trim();
  try {
    katex.renderToString(code, { displayMode: true, throwOnError: true });
  } catch(e) {
    console.error('FAIL $$ in learn.html #', i, ':', e.message, '\nCode:', code);
  }
});

// match all \(...\)
const inlineMatches = html.match(/\\\(([\s\S]*?)\\\)/g) || [];
console.log('Total \\( in learn.html:', inlineMatches.length);
inlineMatches.forEach((m, i) => {
  const code = m.slice(2, -2).trim();
  try {
    katex.renderToString(code, { displayMode: false, throwOnError: true });
  } catch(e) {
    console.error('FAIL \\( in learn.html #', i, ':', e.message, '\nCode:', code);
  }
});
console.log('Tested learn.html math complete.');
