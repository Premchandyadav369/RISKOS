/**
 * Vercel Serverless Function: GET /api/market/quotes?symbols=...
 * Concurrent batch quotes resolver.
 */

const USD_TO_INR = 86.50;

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

  if (sym.endsWith('.NS') || sym.endsWith('.BO') || sym.startsWith('^') || sym.includes('=')) {
    return sym;
  }
  if (US_KNOWN.has(sym)) {
    return sym;
  }
  return `${sym}.NS`;
}

async function fetchSingle(rawSym) {
  const cleanSym = normalizeSymbol(rawSym);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice !== undefined) {
        const price = Number(meta.regularMarketPrice);
        const prev = Number(meta.chartPreviousClose || meta.previousClose || price);
        const chg = Number((price - prev).toFixed(2));
        const chgPct = prev > 0 ? Number(((chg / prev) * 100).toFixed(2)) : 0;
        const currency = meta.currency === 'USD' ? 'USD' : 'INR';
        const isUS = currency === 'USD';

        return {
          symbol: rawSym.toUpperCase(),
          name: meta.shortName || rawSym.toUpperCase(),
          exchange: meta.exchangeName || (isUS ? 'NASDAQ' : 'NSE'),
          asset_type: meta.instrumentType === 'ETF' ? 'ETF' : (meta.instrumentType === 'INDEX' ? 'INDEX' : 'EQUITY'),
          currency: currency,
          price: price,
          price_inr: isUS ? Number((price * USD_TO_INR).toFixed(2)) : price,
          change: chg,
          change_percent: chgPct,
          open: Number(meta.regularMarketDayOpen || price),
          high: Number(meta.regularMarketDayHigh || price),
          low: Number(meta.regularMarketDayLow || price),
          previous_close: prev,
          volume: Number(meta.regularMarketVolume || 0),
          provider: 'Live Market Provider',
          market_status: 'OPEN',
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (e) {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate=10');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const symStr = req.query.symbols || req.query.tickers || '^NSEI,^BSESN,RELIANCE,TCS,HDFCBANK,INFY,AAPL,NVDA';
  const symbols = symStr.split(',').map(s => s.trim()).filter(Boolean);

  const results = {};
  await Promise.all(symbols.map(async (sym) => {
    const q = await fetchSingle(sym);
    if (q) {
      results[sym.toUpperCase()] = q;
      results[sym] = q;
    }
  }));

  return res.status(200).json(results);
}
