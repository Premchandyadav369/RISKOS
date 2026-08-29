/**
 * Vercel Serverless Function: GET /api/market/quote?symbol=...
 * Resolves real-time quote for ANY Indian (NSE/BSE) or US/Global security.
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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate=10');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawSymbol = req.query.symbol || req.query.ticker || 'RELIANCE';
  const cleanSym = normalizeSymbol(rawSymbol);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      // If .NS failed, try without .NS
      if (cleanSym.endsWith('.NS')) {
        const altSym = cleanSym.replace('.NS', '');
        const altUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(altSym)}?interval=1d&range=1d`;
        const altRes = await fetch(altUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (altRes.ok) {
          const altData = await altRes.json();
          const meta = altData?.chart?.result?.[0]?.meta;
          if (meta) return res.status(200).json(formatQuote(meta, altSym));
        }
      }
      return res.status(404).json({ error: `Security quote not found for ${rawSymbol}` });
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice === undefined) {
      return res.status(404).json({ error: `Quote data unavailable for ${rawSymbol}` });
    }

    return res.status(200).json(formatQuote(meta, rawSymbol));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching quote' });
  }
}

function formatQuote(meta, rawSymbol) {
  const price = Number(meta.regularMarketPrice);
  const prev = Number(meta.chartPreviousClose || meta.previousClose || price);
  const chg = Number((price - prev).toFixed(2));
  const chgPct = prev > 0 ? Number(((chg / prev) * 100).toFixed(2)) : 0;
  const currency = meta.currency === 'USD' ? 'USD' : 'INR';
  const isUS = currency === 'USD';

  return {
    symbol: meta.symbol ? meta.symbol.replace('.NS', '').replace('.BO', '') : String(rawSymbol).toUpperCase(),
    name: meta.shortName || meta.longName || String(rawSymbol).toUpperCase(),
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
    week_52_high: Number(meta.fiftyTwoWeekHigh || (price * 1.15)),
    week_52_low: Number(meta.fiftyTwoWeekLow || (price * 0.80)),
    provider: 'Live Market Provider',
    market_status: 'OPEN',
    timestamp: new Date().toISOString()
  };
}
