/**
 * RISKOS Price Reality & Live Feed Verification Audit
 * Comprehensive verification of baseline model prices against real-world live market feeds.
 */

const { SecurityMaster } = require('../src/core/securityMaster.js');
const fs = require('fs');
const path = require('path');

async function auditPrices() {
  console.log('================================================================');
  console.log('  RISKOS REAL-WORLD PRICE VERIFICATION & REALITY AUDIT');
  console.log('================================================================\n');

  const equities = SecurityMaster.LOCAL_REGISTRY.filter(
    s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY'
  );

  console.log(`Auditing ${equities.length} equities across India & US registries against live exchange feeds...\n`);

  const results = [];
  const BATCH_SIZE = 5;

  const fetchYahooWithRetry = async (targetTicker, retries = 2) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(targetTicker)}?interval=1d&range=5d`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(8000)
        });
        if (res.status === 429 && attempt < retries) {
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return res;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 350 * (attempt + 1)));
      }
    }
  };
  
  for (let i = 0; i < equities.length; i += BATCH_SIZE) {
    const batch = equities.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (sec) => {
      let targetTicker = sec.symbolNS || (sec.country === 'IN' ? `${sec.symbol}.NS` : sec.symbol);
      if (sec.symbol === 'TATAMOTORS') targetTicker = 'TMPV.NS';

      try {
        const res = await fetchYahooWithRetry(targetTicker, 2);
        
        if (!res.ok) {
          return {
            symbol: sec.symbol,
            name: sec.name,
            country: sec.country,
            currency: sec.currency,
            basePrice: sec.basePrice,
            livePrice: null,
            diffPct: null,
            status: 'FETCH_FAILED',
            reason: `HTTP ${res.status}`,
            isReal: false
          };
        }

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        const livePrice = meta?.regularMarketPrice;

        if (livePrice === undefined || livePrice === null || isNaN(livePrice)) {
          return {
            symbol: sec.symbol,
            name: sec.name,
            country: sec.country,
            currency: sec.currency,
            basePrice: sec.basePrice,
            livePrice: null,
            diffPct: null,
            status: 'NO_PRICE_IN_FEED',
            reason: 'Missing regularMarketPrice in chart response',
            isReal: false
          };
        }

        const diffPct = Number((((livePrice - sec.basePrice) / sec.basePrice) * 100).toFixed(2));
        let status = 'REAL_LIVE_VERIFIED';
        let note = 'Live quote successfully matched';

        if (Math.abs(diffPct) > 50) {
          status = 'CORPORATE_ACTION_OR_LARGE_DRIFT';
          note = diffPct < -40 ? 'Likely stock split / bonus share / demerger' : 'Large multi-quarter trend move';
        } else if (Math.abs(diffPct) <= 15) {
          status = 'CLOSE_MATCH';
          note = 'Baseline price is highly accurate to live market';
        }

        return {
          symbol: sec.symbol,
          name: sec.name,
          country: sec.country,
          currency: sec.currency,
          basePrice: sec.basePrice,
          livePrice: Number(livePrice.toFixed(2)),
          diffPct,
          status,
          note,
          exchange: meta?.exchangeName || sec.exchange,
          isReal: true
        };
      } catch (err) {
        return {
          symbol: sec.symbol,
          name: sec.name,
          country: sec.country,
          currency: sec.currency,
          basePrice: sec.basePrice,
          livePrice: null,
          diffPct: null,
          status: 'NETWORK_ERROR',
          reason: err.message,
          isReal: false
        };
      }
    }));

    results.push(...batchResults);
    process.stdout.write(`Processed ${Math.min(i + BATCH_SIZE, equities.length)} / ${equities.length} equities...\r`);
    // Brief sleep to avoid aggressive rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\nAudit complete! Compiling findings...\n');

  const verified = results.filter(r => r.isReal);
  const closeMatches = results.filter(r => r.status === 'CLOSE_MATCH');
  const corporateActions = results.filter(r => r.status === 'CORPORATE_ACTION_OR_LARGE_DRIFT');
  const failed = results.filter(r => !r.isReal);

  console.log('----------------------------------------------------------------');
  console.log('SUMMARY OF REAL-WORLD VERIFICATION:');
  console.log(`Total Equities Audited:            ${equities.length}`);
  console.log(`Live Real-World Quotes Verified:   ${verified.length} (${((verified.length / equities.length) * 100).toFixed(1)}%)`);
  console.log(`Close Matches (<= 15% diff):       ${closeMatches.length}`);
  console.log(`Corporate Action / Macro Drift:     ${corporateActions.length}`);
  console.log(`Unreachable / Delisted / Missing:  ${failed.length}`);
  console.log('----------------------------------------------------------------\n');

  console.log('SAMPLE SIDE-BY-SIDE REALITY AUDIT (Top India & US Equities):');
  console.log('Symbol'.padEnd(12) + 'Country'.padEnd(9) + 'Baseline Price'.padEnd(18) + 'Live Real Price'.padEnd(18) + 'Diff (%)'.padEnd(12) + 'Status');
  console.log('-'.repeat(85));
  
  const sample = results.filter(r => ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'LT', 'ITC', 'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'JPM', 'BAC'].includes(r.symbol));
  sample.forEach(r => {
    const curr = r.currency === 'INR' ? '₹' : '$';
    const baseStr = `${curr}${r.basePrice}`.padEnd(18);
    const liveStr = r.livePrice ? `${curr}${r.livePrice}`.padEnd(18) : 'N/A'.padEnd(18);
    const diffStr = r.diffPct !== null ? `${r.diffPct > 0 ? '+' : ''}${r.diffPct}%`.padEnd(12) : 'N/A'.padEnd(12);
    console.log(r.symbol.padEnd(12) + r.country.padEnd(9) + baseStr + liveStr + diffStr + r.status);
  });

  const outPath = path.join(__dirname, '../data/audits/price_reality_audit_results.json');
  fs.writeFileSync(outPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalAudited: equities.length,
    verifiedCount: verified.length,
    closeMatchCount: closeMatches.length,
    corporateActionCount: corporateActions.length,
    failedCount: failed.length,
    results
  }, null, 2));

  console.log(`\nDetailed verification data written to: ${outPath}`);
}

auditPrices().catch(console.error);
