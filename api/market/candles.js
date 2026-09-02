/**
 * Vercel Serverless Function: GET /api/market/candles?symbol=...&tf=...&period=...
 * Multi-timeframe OHLCV historical & intraday candlestick data engine.
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

function getTimeframeParams(tf) {
  const t = String(tf || '1Y').toUpperCase();
  switch (t) {
    case '1D': return { range: '1d', interval: '5m', isIntraday: true };
    case '1W':
    case '5D': return { range: '5d', interval: '15m', isIntraday: true };
    case '1M': return { range: '1mo', interval: '1d', isIntraday: false };
    case '3M': return { range: '3mo', interval: '1d', isIntraday: false };
    case '6M': return { range: '6mo', interval: '1d', isIntraday: false };
    case '1Y': return { range: '1y', interval: '1d', isIntraday: false };
    case '5Y': return { range: '5y', interval: '1wk', isIntraday: false };
    case 'ALL':
    case 'MAX': return { range: 'max', interval: '1mo', isIntraday: false };
    default: return { range: '1y', interval: '1d', isIntraday: false };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawSym = req.query.symbol || req.query.ticker || 'RELIANCE';
  const cleanSym = normalizeSymbol(rawSym);
  const requestedTf = req.query.tf || req.query.timeframe || req.query.period || '1Y';
  const { range, interval, isIntraday } = getTimeframeParams(requestedTf);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=${interval}&range=${range}&includePrePost=false`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (result && result.timestamp && result.indicators && result.indicators.quote) {
        const timestamps = result.timestamp;
        const q = result.indicators.quote[0];
        const meta = result.meta || {};
        const bars = [];

        for (let i = 0; i < timestamps.length; i++) {
          if (q.close[i] !== null && q.close[i] !== undefined && !isNaN(q.close[i])) {
            const dt = new Date(timestamps[i] * 1000);
            const dateStr = isIntraday 
              ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
              : dt.toISOString().split('T')[0];

            bars.push({
              time: dateStr,
              date: isIntraday ? `${dt.toISOString().split('T')[0]} ${dateStr}` : dateStr,
              timestamp: timestamps[i],
              open: Number((q.open[i] || q.close[i]).toFixed(2)),
              high: Number((q.high[i] || q.close[i]).toFixed(2)),
              low: Number((q.low[i] || q.close[i]).toFixed(2)),
              close: Number(q.close[i].toFixed(2)),
              volume: Math.round(q.volume[i] || 0)
            });
          }
        }

        if (bars.length > 0) {
          return res.status(200).json({
            symbol: rawSym.toUpperCase(),
            currency: meta.currency || (cleanSym.endsWith('.NS') ? 'INR' : 'USD'),
            timeframe: requestedTf.toUpperCase(),
            range: range,
            interval: interval,
            count: bars.length,
            provider: 'Yahoo Finance Multi-Timeframe Feed',
            bars: bars
          });
        }
      }
    }
    
    return res.status(404).json({ error: 'Candles not found for symbol' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
