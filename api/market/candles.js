/**
 * Vercel Serverless Function: GET /api/market/candles?symbol=...&tf=...
 */

const US_KNOWN = new Set([
  "AAPL", "NVDA", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "TSLA", "NFLX", "AMD",
  "INTC", "QCOM", "AVGO", "TXN", "MU", "ARM", "JPM", "V", "MA", "BAC", "WFC",
  "GS", "MS", "BRK-B", "BRK-A", "WMT", "COST", "TGT", "HD", "MCD", "NKE", "SBUX",
  "DIS", "KO", "PEP", "PG", "JNJ", "PFE", "UNH", "LLY", "ABBV", "MRK", "XOM",
  "CVX", "COP", "SLB", "BA", "CAT", "GE", "HON", "UPS", "SPY", "QQQ", "DIA",
  "IWM", "VOO", "IVV", "VTI", "GLD", "SLV", "USO", "TLT", "BND", "BABA", "PDD",
  "NIO", "PLTR", "UBER", "ABNB", "COIN", "SNOW", "PANW", "CRWD", "NOW", "SHOP"
]);

function normalizeSymbol(symbol) {
  const sym = String(symbol || '').toUpperCase().trim();
  if (['NIFTY', 'NIFTY50', 'NIFTY 50', 'NSEI', '^NSEI'].includes(sym)) return '^NSEI';
  if (['SENSEX', 'BSESN', '^BSESN'].includes(sym)) return '^BSESN';
  if (['BANKNIFTY', 'BANK NIFTY', 'NSEBANK', '^NSEBANK'].includes(sym)) return '^NSEBANK';
  if (['NIFTYIT', 'CNXIT', '^CNXIT'].includes(sym)) return '^CNXIT';
  if (['SP500', 'SPY', 'GSPC', '^GSPC'].includes(sym)) return '^GSPC';
  if (['NASDAQ', 'IXIC', '^IXIC'].includes(sym)) return '^IXIC';
  if (['DOW', 'DJI', '^DJI'].includes(sym)) return '^DJI';
  if (['USDINR', 'USDINR=X'].includes(sym)) return 'USDINR=X';
  if (['BRENT', 'BZ=F'].includes(sym)) return 'BZ=F';
  if (['CRUDE', 'CL=F', 'WTI'].includes(sym)) return 'CL=F';
  if (['GOLD', 'GC=F'].includes(sym)) return 'GC=F';
  if (['SILVER', 'SI=F'].includes(sym)) return 'SI=F';
  if (['COPPER', 'HG=F'].includes(sym)) return 'HG=F';
  if (['NATGAS', 'NG=F', 'GAS'].includes(sym)) return 'NG=F';
  if (['PLATINUM', 'PL=F'].includes(sym)) return 'PL=F';
  if (['PALLADIUM', 'PA=F'].includes(sym)) return 'PA=F';
  if (['ALUMINIUM', 'ALI=F'].includes(sym)) return 'ALI=F';
  if (['WHEAT', 'ZW=F'].includes(sym)) return 'ZW=F';
  if (['CORN', 'ZC=F'].includes(sym)) return 'ZC=F';
  if (['COTTON', 'CT=F'].includes(sym)) return 'CT=F';
  if (['MCXGOLD', 'GOLDBEES'].includes(sym)) return 'GOLDBEES.NS';
  if (['MCXSILVER', 'SILVERBEES'].includes(sym)) return 'SILVERBEES.NS';
  if (['MCXCRUDE'].includes(sym)) return 'ONGC.NS';

  if (sym.endsWith('.NS') || sym.endsWith('.BO') || sym.startsWith('^') || sym.includes('=')) return sym;
  if (US_KNOWN.has(sym)) return sym;
  return `${sym}.NS`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawSym = req.query.symbol || req.query.ticker || 'RELIANCE';
  const cleanSym = normalizeSymbol(rawSym);
  const range = req.query.period || '1y';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1d&range=${range}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

    if (response.ok) {
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (result && result.timestamp && result.indicators && result.indicators.quote) {
        const timestamps = result.timestamp;
        const q = result.indicators.quote[0];
        const bars = [];

        for (let i = 0; i < timestamps.length; i++) {
          if (q.close[i] !== null && q.close[i] !== undefined) {
            const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            bars.push({
              time: dateStr,
              date: dateStr,
              open: Number((q.open[i] || q.close[i]).toFixed(2)),
              high: Number((q.high[i] || q.close[i]).toFixed(2)),
              low: Number((q.low[i] || q.close[i]).toFixed(2)),
              close: Number(q.close[i].toFixed(2)),
              volume: Math.round(q.volume[i] || 0)
            });
          }
        }

        return res.status(200).json({
          symbol: rawSym.toUpperCase(),
          timeframe: '1D',
          period: range,
          provider: 'Yahoo Finance Live',
          bars: bars
        });
      }
    }
    return res.status(404).json({ error: 'Candles not available' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
