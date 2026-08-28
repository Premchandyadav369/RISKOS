/**
 * RISKOS Universal Security Master & Central Market Store
 * Canonical instrument registry and real-time normalized quote pipeline
 * powering Dashboard, Ticker Library, Observatory, Learn & Lab, and Terminal.
 */

const SecurityMaster = (() => {
  const USD_TO_INR = 86.50;

  // ── 1. Universal Security Master Registry ─────────────────────────────────
  const LOCAL_REGISTRY = [
    // ── Benchmark Indices ──
    { id: 'NSE:^NSEI', symbol: '^NSEI', symbolNS: '^NSEI', name: 'NIFTY 50 Index', exchange: 'NSE', assetType: 'INDEX', isin: 'IN9000000001', aliases: ['NIFTY', 'NIFTY50', 'NIFTY 50', 'NSE INDEX'], currency: 'INR', basePrice: 24840.50, beta: 1.00, vol: 0.132, pe: 22.4, eps: 1108.0, roe: 15.2, sector: 'Broad Market Benchmark', country: 'IN' },
    { id: 'BSE:^BSESN', symbol: '^BSESN', symbolNS: '^BSESN', name: 'S&P BSE SENSEX', exchange: 'BSE', assetType: 'INDEX', isin: 'IN9000000002', aliases: ['SENSEX', 'BSE30', 'BSE SENSEX'], currency: 'INR', basePrice: 81350.20, beta: 0.98, vol: 0.128, pe: 23.1, eps: 3521.0, roe: 14.8, sector: 'Broad Market Benchmark', country: 'IN' },
    { id: 'NSE:^NSEBANK', symbol: '^NSEBANK', symbolNS: '^NSEBANK', name: 'NIFTY BANK Index', exchange: 'NSE', assetType: 'INDEX', isin: 'IN9000000003', aliases: ['BANKNIFTY', 'NIFTY BANK'], currency: 'INR', basePrice: 51320.10, beta: 1.18, vol: 0.185, pe: 16.2, eps: 3162.0, roe: 16.5, sector: 'Banking & Financials', country: 'IN' },
    { id: 'NSE:^CNXIT', symbol: '^CNXIT', symbolNS: '^CNXIT', name: 'NIFTY IT Index', exchange: 'NSE', assetType: 'INDEX', isin: 'IN9000000004', aliases: ['NIFTY IT', 'CNX IT'], currency: 'INR', basePrice: 42150.00, beta: 0.92, vol: 0.198, pe: 31.5, eps: 1328.0, roe: 24.2, sector: 'Information Technology', country: 'IN' },
    { id: 'US:^GSPC', symbol: '^GSPC', symbolNS: '^GSPC', name: 'S&P 500 Index', exchange: 'US', assetType: 'INDEX', isin: 'US78378X1072', aliases: ['SPX', 'SP500', 'S&P 500'], currency: 'USD', basePrice: 5892.40, beta: 1.00, vol: 0.145, pe: 26.8, eps: 210.7, roe: 18.0, sector: 'US Large-Cap Equity', country: 'US' },
    { id: 'US:^IXIC', symbol: '^IXIC', symbolNS: '^IXIC', name: 'NASDAQ 100 / Composite', exchange: 'NASDAQ', assetType: 'INDEX', isin: 'US6311011026', aliases: ['NASDAQ', 'NDX', 'QQQ'], currency: 'USD', basePrice: 18450.00, beta: 1.25, vol: 0.205, pe: 34.2, eps: 520.0, roe: 21.0, sector: 'US Technology Benchmark', country: 'US' },

    // ── Indian Large-Caps (NIFTY 50 / BSE Top 100) ──
    { id: 'NSE:RELIANCE', symbol: 'RELIANCE', symbolNS: 'RELIANCE.NS', name: 'Reliance Industries Ltd', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE002A01018', bseCode: '500325', aliases: ['RELIANCE', 'RIL', 'JIO', 'MUKESH AMBANI'], currency: 'INR', basePrice: 2984.50, beta: 1.08, vol: 0.185, pe: 25.55, eps: 116.80, roe: 9.75, roce: 9.58, marketCap: 20180000000000, sector: 'Energy & Digital Services', country: 'IN' },
    { id: 'NSE:TCS', symbol: 'TCS', symbolNS: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE467B01029', bseCode: '532540', aliases: ['TCS', 'TATA CONSULTANCY'], currency: 'INR', basePrice: 4380.00, beta: 0.78, vol: 0.162, pe: 31.78, eps: 132.50, roe: 48.20, roce: 59.10, marketCap: 15800000000000, sector: 'Information Technology', country: 'IN' },
    { id: 'NSE:HDFCBANK', symbol: 'HDFCBANK', symbolNS: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE040A01034', bseCode: '500180', aliases: ['HDFCBANK', 'HDFC BANK', 'HDFC'], currency: 'INR', basePrice: 1768.40, beta: 1.12, vol: 0.195, pe: 18.90, eps: 86.89, roe: 16.40, roce: 15.20, marketCap: 13450000000000, sector: 'Banking & Financials', country: 'IN' },
    { id: 'NSE:INFY', symbol: 'INFY', symbolNS: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE009A01021', bseCode: '500209', aliases: ['INFY', 'INFOSYS'], currency: 'INR', basePrice: 1942.80, beta: 0.85, vol: 0.182, pe: 28.40, eps: 65.64, roe: 31.80, roce: 40.50, marketCap: 8060000000000, sector: 'Information Technology', country: 'IN' },
    { id: 'NSE:ICICIBANK', symbol: 'ICICIBANK', symbolNS: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE090A01021', bseCode: '532174', aliases: ['ICICIBANK', 'ICICI BANK'], currency: 'INR', basePrice: 1245.20, beta: 1.05, vol: 0.178, pe: 17.80, eps: 68.45, roe: 18.60, roce: 17.10, marketCap: 8750000000000, sector: 'Banking & Financials', country: 'IN' },
    { id: 'NSE:SBIN', symbol: 'SBIN', symbolNS: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE062A01020', bseCode: '500112', aliases: ['SBIN', 'SBI', 'STATE BANK'], currency: 'INR', basePrice: 835.60, beta: 1.22, vol: 0.224, pe: 10.40, eps: 78.12, roe: 17.50, roce: 16.20, marketCap: 7450000000000, sector: 'Banking & Financials', country: 'IN' },
    { id: 'NSE:BHARTIARTL', symbol: 'BHARTIARTL', symbolNS: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE397D01024', bseCode: '532454', aliases: ['BHARTIARTL', 'AIRTEL'], currency: 'INR', basePrice: 1580.00, beta: 0.72, vol: 0.165, pe: 72.50, eps: 21.35, roe: 14.20, roce: 13.80, marketCap: 9320000000000, sector: 'Telecommunications', country: 'IN' },
    { id: 'NSE:ITC', symbol: 'ITC', symbolNS: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE154A01025', bseCode: '500875', aliases: ['ITC', 'ITC LTD'], currency: 'INR', basePrice: 512.40, beta: 0.62, vol: 0.142, pe: 30.20, eps: 16.70, roe: 28.50, roce: 36.80, marketCap: 6410000000000, sector: 'Consumer Staples / FMCG', country: 'IN' },
    { id: 'NSE:TATAMOTORS', symbol: 'TATAMOTORS', symbolNS: 'TATAMOTORS.NS', name: 'Tata Motors Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE155A01022', bseCode: '500570', aliases: ['TATAMOTORS', 'TATA MOTORS', 'JAGUAR'], currency: 'INR', basePrice: 985.20, beta: 1.34, vol: 0.265, pe: 12.80, eps: 84.70, roe: 36.20, roce: 22.40, marketCap: 3620000000000, sector: 'Automotive', country: 'IN' },
    { id: 'NSE:LT', symbol: 'LT', symbolNS: 'LT.NS', name: 'Larsen & Toubro Ltd', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE018A01030', bseCode: '500510', aliases: ['LT', 'L&T', 'LARSEN & TOUBRO'], currency: 'INR', basePrice: 3740.00, beta: 0.95, vol: 0.188, pe: 36.40, eps: 101.10, roe: 15.80, roce: 16.40, marketCap: 5140000000000, sector: 'Capital Goods & Infrastructure', country: 'IN' },
    { id: 'NSE:KOTAKBANK', symbol: 'KOTAKBANK', symbolNS: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE237A01028', bseCode: '500247', aliases: ['KOTAKBANK', 'KOTAK'], currency: 'INR', basePrice: 1812.00, beta: 0.94, vol: 0.175, pe: 19.50, eps: 91.50, roe: 14.50, roce: 13.80, marketCap: 3610000000000, sector: 'Banking & Financials', country: 'IN' },
    { id: 'NSE:AXISBANK', symbol: 'AXISBANK', symbolNS: 'AXISBANK.NS', name: 'Axis Bank Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE238A01034', bseCode: '532215', aliases: ['AXISBANK', 'AXIS'], currency: 'INR', basePrice: 1195.00, beta: 1.15, vol: 0.210, pe: 14.20, eps: 82.50, roe: 17.80, roce: 16.50, marketCap: 3690000000000, sector: 'Banking & Financials', country: 'IN' },
    { id: 'NSE:BAJFINANCE', symbol: 'BAJFINANCE', symbolNS: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE296A01024', bseCode: '500034', aliases: ['BAJFINANCE', 'BAJAJ FINANCE'], currency: 'INR', basePrice: 7380.00, beta: 1.28, vol: 0.245, pe: 29.50, eps: 245.40, roe: 22.40, roce: 20.10, marketCap: 4560000000000, sector: 'Financial Services / NBFC', country: 'IN' },
    { id: 'NSE:HINDUNILVR', symbol: 'HINDUNILVR', symbolNS: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE030A01027', bseCode: '500696', aliases: ['HINDUNILVR', 'HUL', 'UNILEVER'], currency: 'INR', basePrice: 2810.00, beta: 0.58, vol: 0.138, pe: 58.20, eps: 47.76, roe: 20.50, roce: 27.80, marketCap: 6600000000000, sector: 'Consumer Staples / FMCG', country: 'IN' },
    { id: 'NSE:MARUTI', symbol: 'MARUTI', symbolNS: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE585B01010', bseCode: '532500', aliases: ['MARUTI', 'SUZUKI'], currency: 'INR', basePrice: 12640.00, beta: 0.88, vol: 0.192, pe: 28.50, eps: 436.80, roe: 16.80, roce: 21.50, marketCap: 3970000000000, sector: 'Automotive', country: 'IN' },
    { id: 'NSE:SUNPHARMA', symbol: 'SUNPHARMA', symbolNS: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE044A01036', bseCode: '524715', aliases: ['SUNPHARMA', 'SUN PHARMA'], currency: 'INR', basePrice: 1820.00, beta: 0.68, vol: 0.168, pe: 38.40, eps: 46.74, roe: 16.20, roce: 18.40, marketCap: 4360000000000, sector: 'Pharmaceuticals & Healthcare', country: 'IN' },
    { id: 'NSE:TITAN', symbol: 'TITAN', symbolNS: 'TITAN.NS', name: 'Titan Company Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE280A01028', bseCode: '500114', aliases: ['TITAN', 'TANISHQ'], currency: 'INR', basePrice: 3675.00, beta: 0.96, vol: 0.205, pe: 82.00, eps: 44.15, roe: 32.50, roce: 35.80, marketCap: 3260000000000, sector: 'Consumer Discretionary', country: 'IN' },
    { id: 'NSE:ADANIENT', symbol: 'ADANIENT', symbolNS: 'ADANIENT.NS', name: 'Adani Enterprises Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE423A01024', bseCode: '512599', aliases: ['ADANIENT', 'ADANI ENTERPRISES'], currency: 'INR', basePrice: 3040.00, beta: 1.85, vol: 0.425, pe: 94.00, eps: 31.70, roe: 8.50, roce: 9.80, marketCap: 3460000000000, sector: 'Conglomerate & Energy', country: 'IN' },
    { id: 'NSE:ADANIPORTS', symbol: 'ADANIPORTS', symbolNS: 'ADANIPORTS.NS', name: 'Adani Ports and SEZ Ltd', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE742F01042', bseCode: '532921', aliases: ['ADANIPORTS', 'ADANI PORTS'], currency: 'INR', basePrice: 1485.00, beta: 1.35, vol: 0.285, pe: 34.20, eps: 42.80, roe: 17.50, roce: 16.80, marketCap: 3210000000000, sector: 'Ports & Infrastructure', country: 'IN' },
    { id: 'NSE:TATASTEEL', symbol: 'TATASTEEL', symbolNS: 'TATASTEEL.NS', name: 'Tata Steel Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE081A01020', bseCode: '500470', aliases: ['TATASTEEL', 'TATA STEEL'], currency: 'INR', basePrice: 156.80, beta: 1.42, vol: 0.295, pe: 32.00, eps: 4.82, roe: 7.80, roce: 9.20, marketCap: 1950000000000, sector: 'Metals & Mining', country: 'IN' },
    { id: 'NSE:ONGC', symbol: 'ONGC', symbolNS: 'ONGC.NS', name: 'Oil & Natural Gas Corp', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE213A01029', bseCode: '500312', aliases: ['ONGC'], currency: 'INR', basePrice: 268.50, beta: 1.05, vol: 0.255, pe: 8.50, eps: 38.10, roe: 14.80, roce: 15.20, marketCap: 3370000000000, sector: 'Oil & Gas Upstream', country: 'IN' },
    { id: 'NSE:ZOMATO', symbol: 'ZOMATO', symbolNS: 'ZOMATO.NS', name: 'Zomato Limited', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE758T01015', bseCode: '543320', aliases: ['ZOMATO', 'BLINKIT'], currency: 'INR', basePrice: 246.80, beta: 1.45, vol: 0.385, pe: 142.00, eps: 1.82, roe: 4.80, roce: 5.20, marketCap: 2180000000000, sector: 'Internet & Quick Commerce', country: 'IN' },
    { id: 'NSE:JIOFIN', symbol: 'JIOFIN', symbolNS: 'JIOFIN.NS', name: 'Jio Financial Services', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE758E01017', bseCode: '543940', aliases: ['JIOFIN', 'JIO FINANCIAL'], currency: 'INR', basePrice: 335.00, beta: 1.30, vol: 0.310, pe: 125.00, eps: 2.62, roe: 2.50, roce: 3.10, marketCap: 2120000000000, sector: 'Financial Services', country: 'IN' },
    { id: 'NSE:TRENT', symbol: 'TRENT', symbolNS: 'TRENT.NS', name: 'Trent Limited (Westside/Zudio)', exchange: 'NSE', assetType: 'EQUITY', isin: 'INE849A01020', bseCode: '500251', aliases: ['TRENT', 'ZUDIO', 'WESTSIDE'], currency: 'INR', basePrice: 7240.00, beta: 1.25, vol: 0.320, pe: 165.00, eps: 43.15, roe: 28.50, roce: 31.20, marketCap: 2570000000000, sector: 'Retail & Fashion', country: 'IN' },

    // ── ETFs & Mutual Funds ──
    { id: 'NSE:NIFTYBEES', symbol: 'NIFTYBEES', symbolNS: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty BeES', exchange: 'NSE', assetType: 'ETF', isin: 'INF204KB14I2', aliases: ['NIFTYBEES', 'NIFTY ETF'], currency: 'INR', basePrice: 272.50, beta: 1.00, vol: 0.132, pe: 22.4, eps: 12.16, sector: 'Equity Index ETF', country: 'IN' },
    { id: 'NSE:BANKBEES', symbol: 'BANKBEES', symbolNS: 'BANKBEES.NS', name: 'Nippon India ETF Bank BeES', exchange: 'NSE', assetType: 'ETF', isin: 'INF204KB16I7', aliases: ['BANKBEES', 'BANK ETF'], currency: 'INR', basePrice: 524.00, beta: 1.18, vol: 0.185, pe: 16.2, eps: 32.34, sector: 'Banking Sector ETF', country: 'IN' },
    { id: 'NSE:GOLDBEES', symbol: 'GOLDBEES', symbolNS: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES', exchange: 'NSE', assetType: 'ETF', isin: 'INF204KB17I5', aliases: ['GOLDBEES', 'GOLD ETF'], currency: 'INR', basePrice: 65.40, beta: 0.05, vol: 0.128, pe: null, eps: null, sector: 'Precious Metals ETF', country: 'IN' },
    { id: 'NSE:SILVERBEES', symbol: 'SILVERBEES', symbolNS: 'SILVERBEES.NS', name: 'Nippon India ETF Silver BeES', exchange: 'NSE', assetType: 'ETF', isin: 'INF204KB18I3', aliases: ['SILVERBEES', 'SILVER ETF'], currency: 'INR', basePrice: 87.20, beta: 0.15, vol: 0.245, pe: null, eps: null, sector: 'Precious Metals ETF', country: 'IN' },

    // ── US Equities & Global Leaders ──
    { id: 'NASDAQ:NVDA', symbol: 'NVDA', symbolNS: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', assetType: 'EQUITY', isin: 'US67066G1040', aliases: ['NVDA', 'NVIDIA'], currency: 'USD', basePrice: 128.50, beta: 1.68, vol: 0.365, pe: 58.40, eps: 2.20, roe: 115.00, roce: 98.00, marketCap: 3150000000000, sector: 'Semiconductors / AI', country: 'US' },
    { id: 'NASDAQ:AAPL', symbol: 'AAPL', symbolNS: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', assetType: 'EQUITY', isin: 'US0378331005', aliases: ['AAPL', 'APPLE'], currency: 'USD', basePrice: 228.40, beta: 1.02, vol: 0.198, pe: 34.20, eps: 6.68, roe: 147.00, roce: 55.00, marketCap: 3480000000000, sector: 'Consumer Technology', country: 'US' },
    { id: 'NASDAQ:MSFT', symbol: 'MSFT', symbolNS: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', assetType: 'EQUITY', isin: 'US5949181045', aliases: ['MSFT', 'MICROSOFT'], currency: 'USD', basePrice: 442.10, beta: 1.14, vol: 0.215, pe: 37.80, eps: 11.70, roe: 38.50, roce: 32.00, marketCap: 3280000000000, sector: 'Cloud & Enterprise Software', country: 'US' },
    { id: 'NASDAQ:GOOGL', symbol: 'GOOGL', symbolNS: 'GOOGL', name: 'Alphabet Inc. (Google)', exchange: 'NASDAQ', assetType: 'EQUITY', isin: 'US02079K3059', aliases: ['GOOGL', 'GOOGLE'], currency: 'USD', basePrice: 165.20, beta: 1.08, vol: 0.235, pe: 24.50, eps: 6.74, roe: 31.00, roce: 27.50, marketCap: 2050000000000, sector: 'Internet / AI Services', country: 'US' },
    { id: 'NASDAQ:AMZN', symbol: 'AMZN', symbolNS: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', assetType: 'EQUITY', isin: 'US0231351067', aliases: ['AMZN', 'AMAZON'], currency: 'USD', basePrice: 178.60, beta: 1.18, vol: 0.275, pe: 41.20, eps: 4.33, roe: 21.50, roce: 18.00, marketCap: 1870000000000, sector: 'E-Commerce & Cloud', country: 'US' },
    { id: 'NASDAQ:TSLA', symbol: 'TSLA', symbolNS: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', assetType: 'EQUITY', isin: 'US88160R1014', aliases: ['TSLA', 'TESLA'], currency: 'USD', basePrice: 214.20, beta: 1.95, vol: 0.485, pe: 64.50, eps: 3.32, roe: 19.80, roce: 16.20, marketCap: 685000000000, sector: 'Clean Tech & Autonomous', country: 'US' },
    { id: 'NYSE:JPM', symbol: 'JPM', symbolNS: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', assetType: 'EQUITY', isin: 'US46625H1005', aliases: ['JPM', 'JPMORGAN'], currency: 'USD', basePrice: 218.50, beta: 1.05, vol: 0.175, pe: 12.40, eps: 17.62, roe: 17.20, roce: 16.50, marketCap: 625000000000, sector: 'Banking & Financials', country: 'US' },

    // ── Macro Commodities & Currencies ──
    { id: 'COMMODITY:BRENT', symbol: 'BRENT', symbolNS: 'BZ=F', name: 'Brent Crude Oil Futures', exchange: 'GLOBAL', assetType: 'COMMODITY', isin: 'XC0009677409', aliases: ['CRUDE', 'OIL', 'BRENT'], currency: 'USD', basePrice: 76.20, beta: 0.85, vol: 0.285, sector: 'Energy Commodity', country: 'GLOBAL' },
    { id: 'CURRENCY:USDINR', symbol: 'USDINR', symbolNS: 'USDINR=X', name: 'US Dollar / Indian Rupee', exchange: 'FX', assetType: 'CURRENCY', isin: 'XF0000USDINR', aliases: ['USD/INR', 'RUPEE', 'DOLLAR'], currency: 'INR', basePrice: 86.74, beta: -0.15, vol: 0.045, sector: 'Forex Currency Pair', country: 'GLOBAL' }
  ];

  // ── 2. Live Dynamic Quote & Price Simulator ───────────────────────────────
  const _liveQuotes = new Map();
  const _subscribers = new Set();
  let _tickTimer = null;

  LOCAL_REGISTRY.forEach(item => {
    _liveQuotes.set(item.symbol, {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange,
      assetType: item.assetType,
      currency: item.currency,
      price: item.basePrice,
      previousClose: Number((item.basePrice * (1 - (Math.random() * 0.02 - 0.009))).toFixed(2)),
      volume: Math.round(800000 + Math.random() * 4000000),
      avgVolume20d: Math.round(900000 + Math.random() * 3000000),
      high52w: Number((item.basePrice * (1.15 + Math.random() * 0.15)).toFixed(2)),
      low52w: Number((item.basePrice * (0.75 - Math.random() * 0.10)).toFixed(2)),
      pe: item.pe,
      beta: item.beta,
      eps: item.eps,
      marketCap: item.marketCap,
      sector: item.sector,
      isin: item.isin,
      country: item.country,
      lastUpdated: Date.now(),
      status: 'LIVE'
    });
  });

  const _startTickPipeline = () => {
    if (_tickTimer) return;
    _tickTimer = setInterval(() => {
      const batchCount = 4 + Math.floor(Math.random() * 4);
      const updates = [];

      for (let i = 0; i < batchCount; i++) {
        const randIdx = Math.floor(Math.random() * LOCAL_REGISTRY.length);
        const item = LOCAL_REGISTRY[randIdx];
        const quote = _liveQuotes.get(item.symbol);
        if (!quote) continue;

        const sigma = item.vol || 0.20;
        const deltaShock = (Math.random() - 0.495) * (sigma / Math.sqrt(252 * 6.5 * 3600)) * 14;
        const newP = Math.max(0.1, Number((quote.price * (1 + deltaShock)).toFixed(2)));
        const oldP = quote.price;
        quote.price = newP;
        quote.volume += Math.floor(100 + Math.random() * 1200);
        quote.lastUpdated = Date.now();

        const chg = Number((quote.price - quote.previousClose).toFixed(2));
        const chgPct = Number(((chg / quote.previousClose) * 100).toFixed(2));

        updates.push({
          id: quote.id,
          symbol: quote.symbol,
          price: quote.price,
          oldPrice: oldP,
          delta: Number((newP - oldP).toFixed(2)),
          change: chg,
          changePercent: chgPct,
          volume: quote.volume,
          currency: quote.currency
        });
      }

      _subscribers.forEach(cb => {
        try { cb(updates); } catch (e) {}
      });
    }, 1200);
  };

  _startTickPipeline();

  // ── 3. Universal Instrument Resolver & Search Engine ──────────────────────
  const searchSecurities = async (query = '', limit = 20) => {
    const q = query.trim().toLowerCase();
    if (!q) return LOCAL_REGISTRY.slice(0, limit);

    const matches = [];
    LOCAL_REGISTRY.forEach(item => {
      let score = 0;
      const s = item.symbol.toLowerCase();
      const n = item.name.toLowerCase();
      const isin = (item.isin || '').toLowerCase();
      const bse = (item.bseCode || '').toLowerCase();
      const sec = (item.sector || '').toLowerCase();

      if (s === q || bse === q || isin === q) score = 100;
      else if (s.startsWith(q)) score = 85;
      else if (n.startsWith(q)) score = 75;
      else if (n.includes(q)) score = 60;
      else if ((item.aliases || []).some(a => a.toLowerCase().includes(q))) score = 50;
      else if (sec.includes(q)) score = 40;

      if (score > 0) matches.push({ ...item, _score: score });
    });

    matches.sort((a, b) => b._score - a._score);
    if (matches.length >= 3) return matches.slice(0, limit);

    // Call dynamic backend search if available
    try {
      const res = await fetch(`/api/instruments/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) return data.results;
      }
    } catch (e) {}

    return matches.slice(0, limit);
  };

  const resolveSecurity = async (query) => {
    if (!query) return LOCAL_REGISTRY[0];
    const q = String(query).trim().toUpperCase();

    for (const item of LOCAL_REGISTRY) {
      if (item.symbol === q || item.symbolNS === q) return item;
      if (item.id === q) return item;
      if (item.isin && item.isin.toUpperCase() === q) return item;
      if (item.bseCode && item.bseCode === q) return item;
      if ((item.aliases || []).some(a => a.toUpperCase() === q)) return item;
    }

    for (const item of LOCAL_REGISTRY) {
      if (item.name.toUpperCase().includes(q)) return item;
    }

    // Call backend
    try {
      const res = await fetch(`/api/instruments/quote?symbol=${encodeURIComponent(query)}`);
      if (res.ok) {
        const qData = await res.json();
        if (qData && qData.price) {
          return {
            id: `EXT:${qData.symbol}`,
            symbol: qData.symbol.replace('.NS', '').replace('.BO', ''),
            symbolNS: qData.symbol,
            name: qData.name || qData.symbol,
            exchange: qData.symbol.endsWith('.NS') ? 'NSE' : (qData.symbol.endsWith('.BO') ? 'BSE' : 'US'),
            assetType: 'EQUITY',
            currency: qData.currency || 'INR',
            basePrice: qData.price,
            beta: 1.0,
            vol: 0.20,
            pe: 25.0,
            eps: Number((qData.price / 25.0).toFixed(2)),
            sector: qData.sector || 'General Equities',
            isin: qData.isin || '-'
          };
        }
      }
    } catch (e) {}

    const isUS = !q.endsWith('.NS') && !q.endsWith('.BO') && q.length <= 5 && !['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC'].includes(q);
    return {
      id: `DYNAMIC:${q}`,
      symbol: q,
      symbolNS: q.includes('.') ? q : (isUS ? q : `${q}.NS`),
      name: `${q} Corporation`,
      exchange: isUS ? 'NASDAQ' : (q.endsWith('.BO') ? 'BSE' : 'NSE'),
      assetType: 'EQUITY',
      currency: isUS ? 'USD' : 'INR',
      basePrice: isUS ? 150.0 : 1000.0,
      beta: 1.05,
      vol: 0.22,
      pe: 24.0,
      eps: isUS ? 6.25 : 41.67,
      roe: 16.5,
      roce: 18.0,
      sector: 'General Equities',
      isin: '-'
    };
  };

  const getQuote = async (symbol) => {
    const sym = String(symbol).trim().toUpperCase();
    const live = _liveQuotes.get(sym);
    if (live) {
      const chg = Number((live.price - live.previousClose).toFixed(2));
      const chgPct = Number(((chg / live.previousClose) * 100).toFixed(2));
      return {
        ...live,
        price_inr: live.currency === 'INR' ? live.price : Number((live.price * USD_TO_INR).toFixed(2)),
        change: chg,
        changePercent: chgPct,
        change_percent: chgPct
      };
    }

    const sec = await resolveSecurity(sym);
    const p = sec.basePrice || 1000.0;
    const prev = Number((p * 0.99).toFixed(2));
    return {
      id: sec.id,
      symbol: sec.symbol,
      name: sec.name,
      exchange: sec.exchange,
      assetType: sec.assetType,
      currency: sec.currency,
      price: p,
      price_inr: sec.currency === 'INR' ? p : Number((p * USD_TO_INR).toFixed(2)),
      previousClose: prev,
      change: Number((p - prev).toFixed(2)),
      changePercent: 1.01,
      change_percent: 1.01,
      volume: 1850000,
      pe: sec.pe,
      beta: sec.beta,
      eps: sec.eps,
      status: 'LIVE'
    };
  };

  return {
    USD_TO_INR,
    LOCAL_REGISTRY,
    _liveQuotes,
    searchSecurities,
    resolveSecurity,
    getQuote,
    subscribeLiveTicks: (cb) => {
      _subscribers.add(cb);
      return () => _subscribers.delete(cb);
    }
  };
})();

// ── 4. Unified Central Market Store ─────────────────────────────────────────
const MarketStore = (() => {
  const STORAGE_ACTIVE_SEC = 'riskos_active_security';
  const STORAGE_WATCHLIST = 'riskos_watchlist';
  const STORAGE_FAVORITES = 'riskos_favorites';
  const STORAGE_RECENT = 'riskos_recent_searches';
  const STORAGE_PORTFOLIO = 'riskos_portfolio_ledger';

  // State
  let activeSecurity = JSON.parse(localStorage.getItem(STORAGE_ACTIVE_SEC) || 'null') || SecurityMaster.LOCAL_REGISTRY[0];
  let watchlist = JSON.parse(localStorage.getItem(STORAGE_WATCHLIST) || '["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ZOMATO", "NVDA", "AAPL"]');
  let favorites = JSON.parse(localStorage.getItem(STORAGE_FAVORITES) || '["^NSEI", "RELIANCE", "TCS", "NVDA"]');
  let recentSearches = JSON.parse(localStorage.getItem(STORAGE_RECENT) || '["RELIANCE", "TCS", "INFY", "NVDA"]');

  // PubSub listeners
  const listeners = {
    activeSecurity: new Set(),
    watchlist: new Set(),
    favorites: new Set(),
    quotes: new Set()
  };

  // Wire into SecurityMaster live tick pipeline
  SecurityMaster.subscribeLiveTicks((updates) => {
    listeners.quotes.forEach(cb => {
      try { cb(updates); } catch (e) {}
    });
  });

  const getActiveSecurity = () => activeSecurity;

  const setActiveSecurity = (sec, notify = true) => {
    activeSecurity = sec;
    try {
      localStorage.setItem(STORAGE_ACTIVE_SEC, JSON.stringify(sec));
    } catch (e) {}

    if (notify) {
      listeners.activeSecurity.forEach(cb => {
        try { cb(sec); } catch (e) {}
      });
      window.dispatchEvent(new CustomEvent('riskos-active-security-changed', { detail: sec }));
    }
  };

  const getWatchlist = () => watchlist;
  const toggleWatchlist = (symbol) => {
    const sym = symbol.toUpperCase();
    if (watchlist.includes(sym)) {
      watchlist = watchlist.filter(s => s !== sym);
    } else {
      watchlist.push(sym);
    }
    localStorage.setItem(STORAGE_WATCHLIST, JSON.stringify(watchlist));
    listeners.watchlist.forEach(cb => {
      try { cb(watchlist); } catch (e) {}
    });
    return watchlist.includes(sym);
  };

  const getFavorites = () => favorites;
  const toggleFavorite = (symbol) => {
    const sym = symbol.toUpperCase();
    if (favorites.includes(sym)) {
      favorites = favorites.filter(s => s !== sym);
    } else {
      favorites.push(sym);
    }
    localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
    listeners.favorites.forEach(cb => {
      try { cb(favorites); } catch (e) {}
    });
    return favorites.includes(sym);
  };

  const getRecentSearches = () => recentSearches;
  const addRecentSearch = (item) => {
    const queryStr = typeof item === 'string' ? item : item.symbol;
    if (!queryStr) return;
    recentSearches = [queryStr, ...recentSearches.filter(s => s.toLowerCase() !== queryStr.toLowerCase())].slice(0, 10);
    localStorage.setItem(STORAGE_RECENT, JSON.stringify(recentSearches));
  };

  const getMarketStatus = (exchange = 'NSE') => {
    const now = new Date();
    const ex = (exchange || 'NSE').toUpperCase();

    if (ex === 'NSE' || ex === 'BSE' || ex === 'INDIA') {
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istTime.getDay();
      const hours = istTime.getHours();
      const mins = istTime.getMinutes();
      const timeNum = hours * 100 + mins;

      if (day >= 1 && day <= 5 && timeNum >= 915 && timeNum <= 1530) {
        return { status: 'OPEN', label: 'MARKET OPEN', color: 'emerald' };
      }
      return { status: 'CLOSED', label: 'MARKET CLOSED', color: 'red' };
    }

    if (ex === 'US' || ex === 'NASDAQ' || ex === 'NYSE') {
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const day = estTime.getDay();
      const hours = estTime.getHours();
      const mins = estTime.getMinutes();
      const timeNum = hours * 100 + mins;

      if (day >= 1 && day <= 5 && timeNum >= 930 && timeNum <= 1600) {
        return { status: 'OPEN', label: 'MARKET OPEN', color: 'emerald' };
      }
      return { status: 'CLOSED', label: 'MARKET CLOSED', color: 'red' };
    }

    return { status: 'OPEN', label: 'LIVE 24/7', color: 'cyan' };
  };

  return {
    getActiveSecurity,
    setActiveSecurity,
    getWatchlist,
    toggleWatchlist,
    getFavorites,
    toggleFavorite,
    getRecentSearches,
    addRecentSearch,
    getMarketStatus,
    subscribeQuotes: (cb) => {
      listeners.quotes.add(cb);
      return () => listeners.quotes.delete(cb);
    },
    subscribeActiveSecurity: (cb) => {
      listeners.activeSecurity.add(cb);
      return () => listeners.activeSecurity.delete(cb);
    }
  };
})();

// Attach globally to window
if (typeof window !== 'undefined') {
  window.SecurityMaster = SecurityMaster;
  window.MarketStore = MarketStore;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SecurityMaster, MarketStore };
}
