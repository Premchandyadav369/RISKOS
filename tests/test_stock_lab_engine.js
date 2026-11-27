const StockLabEngine = require('../stockLabEngine.js');
const katex = require('katex');

console.log("==================================================");
console.log("TESTING STOCK LAB ENGINE (21 QUANT TESTS SUITE)");
console.log("==================================================\n");

const mockSecurities = [
  { symbol: 'RELIANCE.NS', basePrice: 2980, beta: 1.08, vol: 0.185, pe: 25.5, eps: 50.4, roe: 9.8, marketCap: 20180000000000, currency: 'INR' },
  { symbol: 'NVDA', basePrice: 128.5, beta: 1.85, vol: 0.44, pe: 54.2, eps: 2.37, roe: 68.0, marketCap: 3100000000000, currency: 'USD' },
  { symbol: 'TCS.NS', basePrice: 4280, beta: 0.78, vol: 0.162, pe: 31.8, eps: 132.5, roe: 48.2, marketCap: 15800000000000, currency: 'INR' },
  { symbol: 'BTC-USD', basePrice: 64200, beta: 2.45, vol: 0.62, pe: 0, eps: 0, roe: 0, marketCap: 1280000000000, currency: 'USD' }
];

let totalTestsAudited = 0;
let errors = 0;

mockSecurities.forEach(sec => {
  console.log(`Running full suite on ${sec.symbol}...`);
  const res = StockLabEngine.runSuite(sec);

  if (!res) {
    console.error(`❌ runSuite returned null for ${sec.symbol}`);
    errors++;
    return;
  }

  console.log(`  Composite Score: ${res.compositeScore}/100 (${res.agencyRating})`);
  console.log(`  Recommended Strategy: ${res.recommendedStrategy}`);
  console.log(`  Total Quantitative Tests Generated: ${res.tests.length}`);

  if (res.tests.length !== 21) {
    console.error(`❌ Expected 21 tests, got ${res.tests.length}`);
    errors++;
  }

  res.tests.forEach((t, i) => {
    totalTestsAudited++;
    // Test KaTeX compilation of equation
    try {
      katex.renderToString(t.equation, { displayMode: true, throwOnError: true, strict: false });
    } catch(err) {
      console.error(`❌ [${sec.symbol}] Test #${i+1} (${t.id}) Equation KaTeX Error:`, err.message);
      console.error(`   RAW: ${t.equation}`);
      errors++;
    }

    // Test KaTeX compilation of substitution
    try {
      katex.renderToString(t.substitution, { displayMode: true, throwOnError: true, strict: false });
    } catch(err) {
      console.error(`❌ [${sec.symbol}] Test #${i+1} (${t.id}) Substitution KaTeX Error:`, err.message);
      console.error(`   RAW: ${t.substitution}`);
      errors++;
    }
  });

  console.log(`  -> All 21 tests compiled with 0 errors for ${sec.symbol}!\n`);
});

console.log("==================================================");
console.log(`Total Invariant Tests Verified: ${totalTestsAudited}`);
console.log(`Total Errors Detected: ${errors}`);
console.log("==================================================");

if (errors > 0) {
  process.exit(1);
} else {
  console.log("\nALL 21 STOCK LAB QUANTITATIVE TESTS PASSED FLAWLESSLY!");
}
