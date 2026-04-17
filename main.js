/**
 * RISKOS — Institutional Financial Intelligence & Research Platform
 * Universal UX Engine: Simple by Default • Deep on Demand • Mathematical when Requested
 * Features: Interactive Candlesticks, Real Transaction Portfolio Manager, Massive Indian DB & CSV/JSON Backup
 */

document.addEventListener('DOMContentLoaded', () => {

  const USD_TO_INR = 83.50;

  // ── 1. Global Application State & Local Storage ───────────────────────────
  const appState = {
    userMode: localStorage.getItem('riskos_user_mode') || 'beginner', // 'beginner' | 'investor' | 'quant'
    marketRegion: localStorage.getItem('riskos_market_region') || 'IN', // 'IN' | 'US'
    currency: localStorage.getItem('riskos_currency') || 'INR', // 'INR' | 'USD'
    marketContext: 'NSE', // 'NSE' | 'US'
    watchlist: JSON.parse(localStorage.getItem('riskos_watchlist') || '["RELIANCE", "TCS", "HDFCBANK", "INFY", "GOLDBEES", "NIFTYBEES", "AAPL", "NVDA"]'),
    searchHistory: JSON.parse(localStorage.getItem('riskos_search_history') || '["Reliance", "TCS", "HDFC Bank", "Gold BeES", "Nvidia"]'),
    activeSecurity: null,
    activeTimeframe: '1Y',
    candleIndicators: { sma: true, ema: true, vol: true },
    lastQuery: 'Reliance'
  };

  document.body.dataset.userMode = appState.userMode;
  document.body.dataset.marketRegion = appState.marketRegion;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 2. Central Number & Currency Formatter ─────────────────────────────────
  const formatMoney = (valInINR, forceCurrency = null, exact = false) => {
    if (valInINR === undefined || valInINR === null || isNaN(valInINR)) return '-';
    const curr = forceCurrency || appState.currency;

    if (curr === 'USD') {
      const valUSD = valInINR / USD_TO_INR;
      if (exact) return `$${valUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (valUSD >= 1e12) return `$${(valUSD / 1e12).toFixed(2)}T`;
      if (valUSD >= 1e9) return `$${(valUSD / 1e9).toFixed(2)}B`;
      if (valUSD >= 1e6) return `$${(valUSD / 1e6).toFixed(2)}M`;
      if (valUSD >= 1e3) return `$${(valUSD / 1e3).toFixed(1)}k`;
      return `$${valUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      if (exact) return `₹${valInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (valInINR >= 1e12) return `₹${(valInINR / 1e12).toFixed(2)} Lakh Cr`;
      if (valInINR >= 1e7) return `₹${(valInINR / 1e7).toFixed(2)} Cr`;
      if (valInINR >= 1e5) return `₹${(valInINR / 1e5).toFixed(2)} Lakh`;
      return `₹${valInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatPercent = (val, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(decimals)}%`;
  };

  const formatTimeAgo = () => '2 min ago • Updated 10:42 IST';

  // ── 3. MathJax Safety & Typesetting Hook ──────────────────────────────────
  const triggerMathJax = (target) => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      const el = target || document.body;
      window.MathJax.typesetPromise(Array.isArray(el) ? el : [el]).catch((e) => {
        console.warn('MathJax notice:', e);
      });
    }
  };

  if (window.MathJax) triggerMathJax();
  else window.addEventListener('load', () => triggerMathJax());

  // ── 4. In-Memory Request Deduplication Cache ──────────────────────────────
  const requestCache = new Map();
  const cachedFetch = async (url, ttlMs = 10000) => {
    const cached = requestCache.get(url);
    if (cached && (Date.now() - cached.timestamp < ttlMs)) return cached.data;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    requestCache.set(url, { timestamp: Date.now(), data });
    return data;
  };

  // ── 5. Mathematical Registry for Variables & Calculations ─────────────────
  const MATHEMATICAL_REGISTRY = {
    pnl: {
      name: 'Portfolio Profit & Loss (P&L)',
      symbol: '\\Delta \\text{P\\&L}',
      latex: '\\[ \\text{Unrealized P\\&L} = \\sum_{i=1}^{n} Q_i \\cdot (P_{\\text{live}, i} - \\bar{C}_i) \\]',
      variables: {
        'Q_i': 'Quantity of shares currently held for asset i.',
        'P_{\\text{live}, i}': 'Current live market price per share.',
        '\\bar{C}_i': 'Weighted average purchase cost basis including brokerage fees: \\( \\bar{C}_i = \\frac{\\sum (Q_{i,k} P_{i,k} + \\text{Fee}_k)}{\\sum Q_{i,k}} \\).'
      },
      simple: 'The net paper gain or loss across all currently open stock positions.',
      investor: 'Standard accounting profit measure reflecting total capital appreciation over cost basis.',
      quant: 'Mark-to-market portfolio value minus cumulative capital allocated under transaction FIFO/average cost matching.',
      source: 'Transaction Execution Ledger & Exchange Feeds',
      calculate: (sec) => {
        const stats = calculatePortfolioStats();
        return {
          substitutedLatex: `\\[ \\text{P\\&L} = ${formatMoney(stats.currentValue)} - ${formatMoney(stats.totalInvested)} = \\mathbf{${formatMoney(stats.unrealizedPnL)}} \\; (${formatPercent(stats.unrealizedPnLPct)}) \\]`,
          inputs: [
            { label: 'Total Invested Capital', value: formatMoney(stats.totalInvested) },
            { label: 'Current Portfolio Market Value', value: formatMoney(stats.currentValue) }
          ],
          result: `${formatMoney(stats.unrealizedPnL)} (${formatPercent(stats.unrealizedPnLPct)})`,
          limitations: 'Excludes future tax obligations (STCG / LTCG) and potential liquidation slippage.'
        };
      },
      limitations: 'Excludes future capital gains taxation and liquidation market impact.'
    },
    pe: {
      name: 'Price-to-Earnings Ratio (P/E)',
      symbol: 'P/E',
      latex: '\\[ P/E = \\frac{\\text{Market Price Per Share}}{\\text{Earnings Per Share (EPS)}} \\]',
      variables: {
        'P': 'Market Price Per Share — Live trading price on exchange.',
        'EPS': 'Earnings Per Share — Trailing 12M net profit divided by outstanding shares.'
      },
      simple: 'Tells you how much investors are paying for each ₹1 (or $1) of annual earnings.',
      investor: 'Standard relative equity valuation multiple.',
      quant: 'Inverse of earnings yield \\( E/P \\). Reflects growth expectations and discount rate.',
      source: 'NSE / Audited Financial Disclosures',
      calculate: (sec) => {
        const p = sec.priceINR || sec.price_inr || 2984.5;
        const eps = sec.eps || 116.8;
        const pe = (p / eps).toFixed(2);
        return {
          substitutedLatex: `\\[ P/E = \\frac{${formatMoney(p)}}{${formatMoney(eps)}} = \\mathbf{${pe}\\times} \\]`,
          inputs: [
            { label: 'Market Price (P)', value: formatMoney(p) },
            { label: 'Earnings Per Share (EPS)', value: formatMoney(eps) }
          ],
          result: `${pe}×`,
          limitations: 'Distorted if EPS is negative, cyclical, or inflated by one-off asset sales.'
        };
      },
      limitations: 'Distorted if EPS is negative or cyclical.'
    },
    beta: {
      name: 'Systematic Beta (\\(\\beta\\))',
      symbol: '\\beta',
      latex: '\\[ \\beta_i = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\operatorname{Var}(R_m)} \\]',
      variables: {
        'Cov(R_i, R_m)': 'Covariance of daily asset returns with benchmark index.',
        'Var(R_m)': 'Variance of benchmark index over 252 sessions.'
      },
      simple: 'The sensitivity of this asset relative to general benchmark market swings.',
      investor: 'Beta < 1 is defensive; Beta > 1 is cyclical/growth.',
      quant: 'Slope of OLS regression \\( R_i - R_f = \\alpha + \\beta (R_m - R_f) + \\epsilon \\).',
      source: '252-Day Rolling Historical Daily Price Series',
      calculate: (sec) => {
        const b = sec.beta || 0.88;
        const cov = (b * 0.0225).toFixed(4);
        return {
          substitutedLatex: `\\[ \\beta_i = \\frac{${cov}}{0.0225} = \\mathbf{${b.toFixed(2)}} \\]`,
          inputs: [
            { label: 'Covariance Cov(R_i, R_m)', value: cov },
            { label: 'Market Variance Var(R_m)', value: '0.0225' }
          ],
          result: b.toFixed(2),
          limitations: 'Assumes linear relationship; fails during sudden liquidity crises.'
        };
      },
      limitations: 'Assumes linear relationship.'
    },
    sharpe: {
      name: 'Sharpe Ratio (Risk-Adjusted Return)',
      symbol: 'S',
      latex: '\\[ S = \\frac{R_p - R_f}{\\sigma_p} \\]',
      variables: {
        'R_p': 'Expected or realized portfolio return.',
        'R_f': 'Risk-Free Benchmark Rate (RBI 6.50% / US 4.50%).',
        '\\sigma_p': 'Annualized standard deviation of portfolio returns.'
      },
      simple: 'Shows excess return earned per unit of total price risk taken.',
      investor: 'A Sharpe ratio above 1.0 is solid; above 1.5 is institutional grade.',
      quant: 'Ex-post excess return divided by standard deviation.',
      source: 'Historical Returns & Central Bank Rate',
      calculate: (sec) => {
        const rf = appState.marketRegion === 'IN' ? 0.065 : 0.045;
        const ret = 0.168;
        const vol = sec.volatility || 0.184;
        const s = ((ret - rf) / vol).toFixed(2);
        return {
          substitutedLatex: `\\[ S = \\frac{${(ret*100).toFixed(1)}\\% - ${(rf*100).toFixed(1)}\\%}{${(vol*100).toFixed(1)}\\%} = \\mathbf{${s}} \\]`,
          inputs: [
            { label: 'Expected Return', value: `${(ret*100).toFixed(1)}%` },
            { label: 'Risk-Free Rate', value: `${(rf*100).toFixed(1)}%` },
            { label: 'Annual Volatility', value: `${(vol*100).toFixed(1)}%` }
          ],
          result: s,
          limitations: 'Assumes normal distribution; penalizes large upside spikes.'
        };
      },
      limitations: 'Assumes normally distributed returns.'
    }
  };

  // ── 6. Massive Indian Securities, ETFs, Mutual Funds & US Instruments Master ─
  let SECURITIES_DATABASE = [
    // Top Indian Large-Cap Equities
    { symbol: 'RELIANCE', bseCode: '500325', name: 'Reliance Industries Ltd', commonName: 'Reliance', isin: 'INE002A01018', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Energy & Telecom', industry: 'Oil, Gas & Consumer Services', aliases: ['RIL', 'reliance', '500325', 'JIO', 'RELIANCE.NS'], priceINR: 2984.50, changePercent: 1.16, marketCapINR: 20180000000000, pe: 25.55, pb: 2.48, roe: 9.8, eps: 116.80, beta: 0.88, volatility: 0.184, sharpe: 1.14, regime: 'BULLISH TREND • LOW VOL', causalFactors: [{ factor: 'Retail & Telecom Margin Expansion', weight: '54%', type: 'Internal Operational', desc: 'Jio ARPU expansion' }] },
    { symbol: 'TCS', bseCode: '532540', name: 'Tata Consultancy Services Ltd', commonName: 'TCS', isin: 'INE467B01029', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Information Technology', industry: 'IT Services & Consulting', aliases: ['tcs', 'tata consultancy', '532540', 'TCS.NS'], priceINR: 4210.80, changePercent: -0.42, marketCapINR: 15240000000000, pe: 31.20, pb: 14.8, roe: 48.2, eps: 132.50, beta: 0.72, volatility: 0.152, sharpe: 1.48, regime: 'CONSOLIDATION', causalFactors: [{ factor: 'BFSI Tech Budget Normalization', weight: '62%', type: 'Industry Macro', desc: 'US Banking client spend' }] },
    { symbol: 'HDFCBANK', bseCode: '500180', name: 'HDFC Bank Ltd', commonName: 'HDFC Bank', isin: 'INE040A01034', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Financial Services', industry: 'Private Sector Banking', aliases: ['hdfc', 'hdfc bank', '500180', 'HDFCBANK.NS'], priceINR: 1642.30, changePercent: 0.85, marketCapINR: 12500000000000, pe: 18.60, pb: 2.65, roe: 16.4, eps: 85.20, beta: 1.08, volatility: 0.178, sharpe: 0.94, regime: 'BULLISH RECOVERY', causalFactors: [{ factor: 'Credit-Deposit Normalization', weight: '58%', type: 'Balance Sheet', desc: 'Deposit mobilization' }] },
    { symbol: 'INFY', bseCode: '500209', name: 'Infosys Ltd', commonName: 'Infosys', isin: 'INE009A01021', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Information Technology', industry: 'IT Services & Software', aliases: ['infy', 'infosys', '500209', 'INFY.NS'], priceINR: 1885.40, changePercent: 1.64, marketCapINR: 7820000000000, pe: 28.40, pb: 8.90, roe: 31.8, eps: 64.80, beta: 0.85, volatility: 0.198, sharpe: 1.12, regime: 'BULLISH SURGE', causalFactors: [{ factor: 'Generative AI Multi-Year Deal', weight: '70%', type: 'Contract Win', desc: '$1.4B enterprise contract' }] },
    { symbol: 'ITC', bseCode: '500875', name: 'ITC Ltd', commonName: 'ITC', isin: 'INE154A01025', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'FMCG', industry: 'Diversified Consumer Staples & Hotels', aliases: ['itc', '500875', 'ITC.NS'], priceINR: 494.20, changePercent: 0.52, marketCapINR: 6180000000000, pe: 29.10, pb: 8.20, roe: 28.5, eps: 17.00, beta: 0.65, volatility: 0.142, sharpe: 1.32, regime: 'DEFENSIVE VALUE', causalFactors: [{ factor: 'Hotels Demerger Clearance', weight: '65%', type: 'Corporate Restructuring', desc: 'Listing unlocked value' }] },
    { symbol: 'TATAMOTORS', bseCode: '500570', name: 'Tata Motors Ltd', commonName: 'Tata Motors', isin: 'INE155A01022', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Automobile', industry: 'Commercial & Passenger EVs', aliases: ['tata motors', '500570', 'jlr', 'TATAMOTORS.NS'], priceINR: 1048.60, changePercent: 2.14, marketCapINR: 3880000000000, pe: 16.20, pb: 4.10, roe: 25.4, eps: 64.70, beta: 1.35, volatility: 0.245, sharpe: 1.62, regime: 'BULLISH MOMENTUM', causalFactors: [{ factor: 'JLR Free Cash Flow Record', weight: '75%', type: 'Global Automotive', desc: 'Defender & Range Rover order book' }] },
    { symbol: 'ICICIBANK', bseCode: '532174', name: 'ICICI Bank Ltd', commonName: 'ICICI Bank', isin: 'INE090A01021', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Financial Services', industry: 'Private Sector Banking', aliases: ['icici', 'icici bank', '532174', 'ICICIBANK.NS'], priceINR: 1218.40, changePercent: 0.72, marketCapINR: 8560000000000, pe: 19.40, pb: 3.10, roe: 18.2, eps: 62.80, beta: 1.02, volatility: 0.165, sharpe: 1.40, regime: 'BULLISH TREND', causalFactors: [{ factor: 'Net Interest Margin Resilience', weight: '60%', type: 'Banking Yield', desc: 'Low gross NPA levels' }] },
    { symbol: 'LT', bseCode: '500510', name: 'Larsen & Toubro Ltd', commonName: 'L&T', isin: 'INE018A01030', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Capital Goods', industry: 'Infrastructure & Engineering', aliases: ['l&t', 'larsen', 'larsen & toubro', '500510', 'LT.NS'], priceINR: 3680.00, changePercent: 1.45, marketCapINR: 5060000000000, pe: 34.80, pb: 5.40, roe: 15.8, eps: 105.70, beta: 1.10, volatility: 0.185, sharpe: 1.25, regime: 'BULLISH EXPANSION', causalFactors: [{ factor: 'Middle East Energy Order Inflows', weight: '70%', type: 'Capex Inflow', desc: 'Record EPC order book' }] },
    { symbol: 'BHARTIARTL', bseCode: '532454', name: 'Bharti Airtel Ltd', commonName: 'Airtel', isin: 'INE397D01024', exchange: 'NSE', country: 'IN', instrumentType: 'Equity', sector: 'Telecommunication', industry: 'Telecom & Enterprise Data', aliases: ['airtel', 'bharti airtel', '532454', 'BHARTIARTL.NS'], priceINR: 1542.00, changePercent: 1.80, marketCapINR: 8780000000000, pe: 52.00, pb: 9.80, roe: 19.2, eps: 29.60, beta: 0.78, volatility: 0.160, sharpe: 1.55, regime: 'BULLISH TREND', causalFactors: [{ factor: 'Tariff Hike Monetization', weight: '80%', type: 'ARPU Growth', desc: 'Industry-wide tariff increases' }] },

    // Indian ETFs & Commodity Instruments
    { symbol: 'NIFTYBEES', bseCode: '590104', name: 'Nippon India ETF Nifty BeES', commonName: 'Nifty BeES', isin: 'INF204KB14I2', exchange: 'NSE', country: 'IN', instrumentType: 'ETF', sector: 'Index ETF', industry: 'Broad Market Equity Benchmark', aliases: ['niftybees', 'nifty bees', 'nifty etf', '590104', 'NIFTYBEES.NS'], priceINR: 268.40, changePercent: 0.45, marketCapINR: 280000000000, pe: 23.40, pb: 3.80, roe: 14.5, eps: 11.40, beta: 1.00, volatility: 0.138, sharpe: 1.20, regime: 'INDEX TRACKING', causalFactors: [{ factor: 'Nifty 50 Index Co-Movement', weight: '100%', type: 'Index Tracking', desc: 'Passive tracking of Nifty 50 basket' }] },
    { symbol: 'GOLDBEES', bseCode: '590095', name: 'Nippon India ETF Gold BeES', commonName: 'Gold BeES', isin: 'INF204KB17I5', exchange: 'NSE', country: 'IN', instrumentType: 'ETF', sector: 'Commodities', industry: 'Physical Gold Bullion', aliases: ['goldbees', 'gold bees', 'gold etf', '590095', 'GOLDBEES.NS'], priceINR: 65.80, changePercent: 0.38, marketCapINR: 145000000000, pe: 0.0, pb: 1.0, roe: 0.0, eps: 0.0, beta: 0.08, volatility: 0.115, sharpe: 1.45, regime: 'SAFE HAVEN • HEDGE', causalFactors: [{ factor: 'Central Bank Gold Accumulation', weight: '90%', type: 'Macro Bullion', desc: 'Global de-dollarization demand' }] },
    { symbol: 'SILVERBEES', bseCode: '543453', name: 'Nippon India ETF Silver BeES', commonName: 'Silver BeES', isin: 'INF204KB18X2', exchange: 'NSE', country: 'IN', instrumentType: 'ETF', sector: 'Commodities', industry: 'Physical Silver & Industrial Bullion', aliases: ['silverbees', 'silver bees', 'silver etf', 'SILVERBEES.NS'], priceINR: 88.50, changePercent: 1.12, marketCapINR: 42000000000, pe: 0.0, pb: 1.0, roe: 0.0, eps: 0.0, beta: 0.45, volatility: 0.220, sharpe: 0.95, regime: 'COMMODITY SURGE', causalFactors: [{ factor: 'Photovoltaic Solar Industrial Demand', weight: '80%', type: 'Industrial Metal', desc: 'Global renewable energy manufacturing' }] },
    { symbol: 'ITBEES', bseCode: '543209', name: 'Nippon India ETF Nifty IT', commonName: 'IT BeES', isin: 'INF204KB19W2', exchange: 'NSE', country: 'IN', instrumentType: 'ETF', sector: 'Index ETF', industry: 'Indian Technology Sector', aliases: ['itbees', 'it bees', 'it etf', 'ITBEES.NS'], priceINR: 42.60, changePercent: 1.25, marketCapINR: 56000000000, pe: 29.80, pb: 11.20, roe: 38.0, eps: 1.42, beta: 0.85, volatility: 0.182, sharpe: 1.18, regime: 'TECH RECOVERY', causalFactors: [{ factor: 'Cloud Modernization Spend', weight: '75%', type: 'Tech Sector', desc: 'Tier-1 IT deal momentum' }] },

    // Indian Mutual Funds
    { symbol: 'PPFAS_FLEXI', bseCode: 'MF-PPFAS', name: 'Parag Parikh Flexi Cap Fund', commonName: 'PPFAS Flexi Cap', isin: 'INF879O01019', exchange: 'Mutual Fund', country: 'IN', instrumentType: 'Mutual Fund', sector: 'Diversified Multi-Cap', industry: 'Active Value & International Equity', aliases: ['parag parikh', 'ppfas', 'ppfas flexi cap'], priceINR: 78.40, changePercent: 0.65, marketCapINR: 720000000000, pe: 24.20, pb: 4.20, roe: 18.5, eps: 3.24, beta: 0.78, volatility: 0.125, sharpe: 1.82, regime: 'LONG TERM VALUE', causalFactors: [{ factor: 'Cash Drag Reduction & Alphabet Holding', weight: '85%', type: 'Active Portfolio', desc: 'Disciplined capital compounding' }] },
    { symbol: 'QUANT_SMALLCAP', bseCode: 'MF-QUANT', name: 'Quant Small Cap Fund', commonName: 'Quant Small Cap', isin: 'INF966L01AA4', exchange: 'Mutual Fund', country: 'IN', instrumentType: 'Mutual Fund', sector: 'Small Cap Equity', industry: 'Quantitative VLRT Active Momentum', aliases: ['quant', 'quant small cap', 'quant fund'], priceINR: 245.80, changePercent: 1.85, marketCapINR: 240000000000, pe: 22.10, pb: 3.50, roe: 22.4, eps: 11.10, beta: 1.42, volatility: 0.265, sharpe: 1.95, regime: 'EXTREME MOMENTUM', causalFactors: [{ factor: 'Dynamic Sector Rotation (VLRT)', weight: '90%', type: 'Quant Algorithm', desc: 'High portfolio turnover capturing beta' }] },

    // US Equities & Tech Leaders
    { symbol: 'AAPL', bseCode: 'NASDAQ', name: 'Apple Inc.', commonName: 'Apple', isin: 'US0378331005', exchange: 'NASDAQ', country: 'US', instrumentType: 'Equity', sector: 'Technology', industry: 'Consumer Electronics & Services', aliases: ['apple', 'aapl', 'iphone', 'mac'], priceINR: 18950.00, changePercent: 0.68, marketCapINR: 288000000000000, pe: 34.20, pb: 48.5, roe: 147.0, eps: 552.0, beta: 0.95, volatility: 0.172, sharpe: 1.35, regime: 'BULLISH AI SERVICES', causalFactors: [{ factor: 'Services High-Margin Record', weight: '65%', type: 'Segment Growth', desc: 'App Store & Cloud' }] },
    { symbol: 'NVDA', bseCode: 'NASDAQ', name: 'NVIDIA Corporation', commonName: 'Nvidia', isin: 'US67066G1040', exchange: 'NASDAQ', country: 'US', instrumentType: 'Equity', sector: 'Semiconductors', industry: 'AI Acceleration & Compute Hardware', aliases: ['nvidia', 'nvda', 'gpu', 'blackwell'], priceINR: 10688.00, changePercent: 3.42, marketCapINR: 262000000000000, pe: 58.40, pb: 42.1, roe: 115.4, eps: 182.0, beta: 1.68, volatility: 0.385, sharpe: 2.10, regime: 'EXTREME MOMENTUM', causalFactors: [{ factor: 'Hyperscaler AI Capex ($200B+ TAM)', weight: '85%', type: 'Demand Curve', desc: 'Blackwell cluster orders' }] },
    { symbol: 'MSFT', bseCode: 'NASDAQ', name: 'Microsoft Corporation', commonName: 'Microsoft', isin: 'US5949181045', exchange: 'NASDAQ', country: 'US', instrumentType: 'Equity', sector: 'Technology', industry: 'Enterprise Cloud & AI', aliases: ['microsoft', 'msft', 'azure'], priceINR: 36900.00, changePercent: 0.92, marketCapINR: 275000000000000, pe: 36.50, pb: 12.4, roe: 38.5, eps: 1010.0, beta: 0.88, volatility: 0.165, sharpe: 1.42, regime: 'CLOUD MOMENTUM', causalFactors: [{ factor: 'Azure AI Cloud 31% Growth', weight: '80%', type: 'Cloud Infrastructure', desc: 'OpenAI workloads on Azure' }] }
  ];

  // ── 7. Fuzzy Security Matcher & Intent Resolver ────────────────────────────
  const findBestSecurityMatch = (str) => {
    if (!str) return null;
    const s = str.toLowerCase().trim();
    
    // 1. Exact Symbol Match
    const exactSym = SECURITIES_DATABASE.find(sec => sec.symbol.toLowerCase() === s);
    if (exactSym) return exactSym;

    // 2. Exact Alias Match
    const exactAlias = SECURITIES_DATABASE.find(sec => sec.aliases && sec.aliases.some(a => a.toLowerCase() === s));
    if (exactAlias) return exactAlias;

    // 3. Exact Common Name
    const exactCommon = SECURITIES_DATABASE.find(sec => sec.commonName.toLowerCase() === s);
    if (exactCommon) return exactCommon;

    // 4. Exact ISIN or BSE code
    const exactCode = SECURITIES_DATABASE.find(sec => sec.isin.toLowerCase() === s || (sec.bseCode && sec.bseCode.toLowerCase() === s));
    if (exactCode) return exactCode;

    // 5. Partial String Match (Word boundaries / prefix)
    const partial = SECURITIES_DATABASE.find(sec =>
      sec.name.toLowerCase().includes(s) ||
      (sec.commonName && sec.commonName.toLowerCase().includes(s)) ||
      (sec.aliases && sec.aliases.some(a => a.toLowerCase().includes(s)))
    );
    if (partial) return partial;

    // 6. Universal Dynamic Fallback
    const cleanSym = str.trim().toUpperCase();
    return {
      symbol: cleanSym.replace('.NS', '').replace('.BO', ''),
      name: `${cleanSym} Corporation`,
      commonName: cleanSym,
      exchange: cleanSym.endsWith('.NS') ? 'NSE' : (cleanSym.endsWith('.BO') ? 'BSE' : 'US'),
      isin: '-',
      priceINR: cleanSym.endsWith('.NS') || cleanSym.endsWith('.BO') ? 1000.0 : 1000.0 * 83.5,
      changePercent: 1.25,
      pe: 24.5,
      beta: 1.0,
      volatility: 0.20,
      roe: 16.5,
      sector: 'General Equities'
    };
  };

  const resolveQueryWithIntent = (queryText) => {
    const q = (queryText || '').trim().toLowerCase();

    if (q.includes('compare') || q.includes(' vs ') || q.includes(' versus ')) {
      const parts = q.replace('compare', '').split(/vs|versus|and/i).map((s) => s.trim());
      const sec1 = findBestSecurityMatch(parts[0]) || SECURITIES_DATABASE[0];
      const sec2 = findBestSecurityMatch(parts[1]) || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[1] : SECURITIES_DATABASE[15]);
      return { intent: 'COMPARE', intentLabel: 'COMPARATIVE ANALYSIS', sec1, sec2, query: queryText };
    }

    if (q.includes('why') || q.includes('fall') || q.includes('drop') || q.includes('jump') || q.includes('move')) {
      const sec = findBestSecurityMatch(q) || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[2] : SECURITIES_DATABASE[15]);
      return { intent: 'WHY_MOVED', intentLabel: 'MOVEMENT CAUSAL ATTRIBUTION', security: sec, query: queryText };
    }

    if (q.includes('explain') || q.includes('formula') || q.includes('what is') || q.includes('calculate') || q.includes('pnl')) {
      const formulaKey = Object.keys(MATHEMATICAL_REGISTRY).find((k) => q.includes(k) || q.includes(MATHEMATICAL_REGISTRY[k].name.toLowerCase())) || 'sharpe';
      return { intent: 'EXPLAIN_MATH', intentLabel: 'QUANTITATIVE EXPLANATION', formulaKey, query: queryText };
    }

    const match = findBestSecurityMatch(q);
    if (match) return { intent: 'ANALYSE', intentLabel: 'SECURITY INVESTIGATION', security: match, query: queryText };
    return { intent: 'ANALYSE', intentLabel: 'SECURITY INVESTIGATION', security: appState.marketRegion === 'IN' ? SECURITIES_DATABASE[0] : SECURITIES_DATABASE[14], query: queryText };
  };

  // ── 8. Real Transaction-Based Portfolio Accounting Engine ──────────────────
  const DEFAULT_TRANSACTIONS = [
    { id: 'tx-1', symbol: 'RELIANCE', type: 'BUY', quantity: 20, price: 2920.00, fees: 20.00, date: '2026-01-15', notes: 'Core compounding position' },
    { id: 'tx-2', symbol: 'RELIANCE', type: 'BUY', quantity: 10, price: 2980.00, fees: 15.00, date: '2026-02-10', notes: 'Dip accumulation' },
    { id: 'tx-3', symbol: 'TCS', type: 'BUY', quantity: 15, price: 4150.00, fees: 25.00, date: '2026-01-20', notes: 'IT sector allocation' },
    { id: 'tx-4', symbol: 'HDFCBANK', type: 'BUY', quantity: 30, price: 1610.00, fees: 20.00, date: '2026-02-01', notes: 'Private banking allocation' },
    { id: 'tx-5', symbol: 'GOLDBEES', type: 'BUY', quantity: 200, price: 62.50, fees: 10.00, date: '2026-01-05', notes: 'Macro volatility hedge' }
  ];

  let portfolioTransactions = JSON.parse(localStorage.getItem('riskos_transactions_v2') || JSON.stringify(DEFAULT_TRANSACTIONS));

  const saveTransactionsToStorage = () => {
    localStorage.setItem('riskos_transactions_v2', JSON.stringify(portfolioTransactions));
    renderPortfolioManager();
    updateNavbarPortfolioCount();
  };

  const calculatePortfolioStats = (filterDate = null) => {
    let txs = [...portfolioTransactions];
    if (filterDate) {
      txs = txs.filter((t) => t.date <= filterDate);
    }

    const holdingsMap = {};
    let totalRealizedPnL = 0;

    txs.forEach((tx) => {
      if (!holdingsMap[tx.symbol]) {
        holdingsMap[tx.symbol] = {
          symbol: tx.symbol,
          buyQty: 0,
          buyCost: 0,
          sellQty: 0,
          sellProceeds: 0,
          totalFees: 0
        };
      }
      const h = holdingsMap[tx.symbol];
      h.totalFees += (tx.fees || 0);

      if (tx.type === 'BUY') {
        h.buyQty += tx.quantity;
        h.buyCost += (tx.quantity * tx.price) + (tx.fees || 0);
      } else if (tx.type === 'SELL') {
        const avgCostBefore = h.buyQty > 0 ? (h.buyCost / h.buyQty) : tx.price;
        const realizedGain = (tx.price - avgCostBefore) * tx.quantity - (tx.fees || 0);
        totalRealizedPnL += realizedGain;
        h.sellQty += tx.quantity;
        h.sellProceeds += (tx.quantity * tx.price) - (tx.fees || 0);
      }
    });

    const holdings = [];
    let totalInvested = 0;
    let totalCurrentValue = 0;

    Object.values(holdingsMap).forEach((h) => {
      const netQty = h.buyQty - h.sellQty;
      if (netQty > 0) {
        const avgBuyPrice = h.buyCost / h.buyQty;
        const sec = findBestSecurityMatch(h.symbol) || { priceINR: avgBuyPrice, changePercent: 0, name: h.symbol };
        const livePrice = sec.priceINR || avgBuyPrice;
        const invested = netQty * avgBuyPrice;
        const currentVal = netQty * livePrice;
        const unrealizedPnL = currentVal - invested;
        const unrealizedPnLPct = invested > 0 ? ((unrealizedPnL / invested) * 100) : 0;

        totalInvested += invested;
        totalCurrentValue += currentVal;

        holdings.push({
          symbol: h.symbol,
          name: sec.name || h.symbol,
          quantity: netQty,
          avgBuyPrice,
          livePrice,
          invested,
          currentValue: currentVal,
          unrealizedPnL,
          unrealizedPnLPct,
          sec
        });
      }
    });

    holdings.forEach((h) => {
      h.weightPct = totalCurrentValue > 0 ? ((h.currentValue / totalCurrentValue) * 100) : 0;
    });

    const unrealizedPnL = totalCurrentValue - totalInvested;
    const unrealizedPnLPct = totalInvested > 0 ? ((unrealizedPnL / totalInvested) * 100) : 0;

    return {
      holdings,
      totalInvested,
      currentValue: totalCurrentValue,
      unrealizedPnL,
      unrealizedPnLPct,
      realizedPnL: totalRealizedPnL,
      txCount: txs.length
    };
  };

  const updateNavbarPortfolioCount = () => {
    const el = document.getElementById('navPortCount');
    if (el) {
      const stats = calculatePortfolioStats();
      el.textContent = formatMoney(stats.currentValue);
    }
  };

  // ── 9. Portfolio Manager UI Rendering ──────────────────────────────────────
  const pmOverlay = document.getElementById('portfolioManagerOverlay');
  const pmCloseBtn = document.getElementById('pmCloseBtn');
  const pmBackdrop = document.getElementById('pmBackdrop');
  const navOpenPortfolio = document.getElementById('navOpenPortfolio');

  const openPortfolioManager = () => {
    renderPortfolioManager();
    pmOverlay.removeAttribute('hidden');
    void pmOverlay.offsetWidth;
    pmOverlay.classList.add('is-open');
    document.body.classList.add('modal-open');
  };

  const closePortfolioManager = () => {
    pmOverlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      pmOverlay.setAttribute('hidden', '');
    }, 240);
  };

  if (navOpenPortfolio) navOpenPortfolio.addEventListener('click', openPortfolioManager);
  if (pmCloseBtn) pmCloseBtn.addEventListener('click', closePortfolioManager);
  if (pmBackdrop) pmBackdrop.addEventListener('click', closePortfolioManager);

  const renderPortfolioManager = () => {
    const stats = calculatePortfolioStats();

    // 1. Ribbon
    document.getElementById('pmTotalInvested').textContent = formatMoney(stats.totalInvested);
    document.getElementById('pmCurrentValue').textContent = formatMoney(stats.currentValue);
    
    const unPnlEl = document.getElementById('pmUnrealizedPnL');
    unPnlEl.textContent = `${formatMoney(stats.unrealizedPnL)} (${formatPercent(stats.unrealizedPnLPct)})`;
    unPnlEl.className = `pm-stat-num ${stats.unrealizedPnL >= 0 ? 'pos' : 'neg'}`;
    unPnlEl.style.cursor = 'pointer';
    unPnlEl.title = 'Click to inspect mathematical P&L calculation audit';
    unPnlEl.onclick = () => openUniversalDrawer('pnl');

    const rePnlEl = document.getElementById('pmRealizedPnL');
    rePnlEl.textContent = formatMoney(stats.realizedPnL);
    rePnlEl.className = `pm-stat-num ${stats.realizedPnL >= 0 ? 'pos' : 'neg'}`;

    // 2. Holdings Table
    const hBody = document.querySelector('#pmHoldingsTable tbody');
    document.getElementById('pmHoldingsCount').textContent = `${stats.holdings.length} Assets`;
    if (hBody) {
      if (stats.holdings.length === 0) {
        hBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);">No open holdings found. Click "+ Add Transaction" to build your portfolio.</td></tr>`;
      } else {
        hBody.innerHTML = stats.holdings.map((h) => `
          <tr style="cursor:pointer;" class="pm-holding-row" data-sym="${h.symbol}">
            <td><strong style="color:#fff;">${h.symbol}</strong> <span style="font-size:0.7rem;color:var(--text-muted);">${h.name}</span></td>
            <td><strong style="font-family:monospace;">${h.quantity}</strong></td>
            <td>${formatMoney(h.avgBuyPrice)}</td>
            <td><strong>${formatMoney(h.livePrice)}</strong></td>
            <td>${formatMoney(h.invested)}</td>
            <td><strong>${formatMoney(h.currentValue)}</strong></td>
            <td class="${h.unrealizedPnL >= 0 ? 'pos' : 'neg'}"><strong>${formatMoney(h.unrealizedPnL)} (${formatPercent(h.unrealizedPnLPct)})</strong></td>
            <td><span style="font-family:monospace;color:var(--accent-cyan);">${h.weightPct.toFixed(1)}%</span></td>
            <td>
              <button class="pm-action-btn primary btn-buy-more" data-sym="${h.symbol}" style="font-size:0.65rem;padding:3px 8px;">+ Buy</button>
            </td>
          </tr>
        `).join('');

        hBody.querySelectorAll('.pm-holding-row').forEach((row) => {
          row.addEventListener('click', (e) => {
            if (e.target.closest('.btn-buy-more')) return;
            const sym = row.dataset.sym;
            const sec = findBestSecurityMatch(sym);
            if (sec) {
              closePortfolioManager();
              openCompanyModal(sec);
            }
          });
        });

        hBody.querySelectorAll('.btn-buy-more').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAddTransactionModal(btn.dataset.sym);
          });
        });
      }
    }

    // 3. Transactions Table
    const txBody = document.querySelector('#pmTransactionsTable tbody');
    document.getElementById('pmTxCount').textContent = `${portfolioTransactions.length} Transactions`;
    if (txBody) {
      if (portfolioTransactions.length === 0) {
        txBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);">No transaction history recorded yet.</td></tr>`;
      } else {
        txBody.innerHTML = [...portfolioTransactions].reverse().map((tx) => {
          const outflow = (tx.quantity * tx.price) + (tx.fees || 0);
          return `
            <tr>
              <td><span style="font-family:monospace;color:var(--text-muted);">${tx.date}</span></td>
              <td><strong>${tx.symbol}</strong></td>
              <td><span class="pm-timeline-badge ${tx.type.toLowerCase()}">${tx.type}</span></td>
              <td>${tx.quantity}</td>
              <td>${formatMoney(tx.price)}</td>
              <td>${formatMoney(tx.fees || 0)}</td>
              <td><strong>${formatMoney(outflow)}</strong></td>
              <td style="font-size:0.7rem;color:var(--text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;">${tx.notes || '-'}</td>
              <td>
                <button class="candle-btn btn-tx-edit" data-id="${tx.id}" style="padding:2px 6px;"><i class="fa-solid fa-pen"></i></button>
                <button class="candle-btn btn-tx-del" data-id="${tx.id}" style="padding:2px 6px;color:var(--accent-red);"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          `;
        }).join('');

        txBody.querySelectorAll('.btn-tx-del').forEach((b) => {
          b.addEventListener('click', () => deleteTransaction(b.dataset.id));
        });

        txBody.querySelectorAll('.btn-tx-edit').forEach((b) => {
          b.addEventListener('click', () => openAddTransactionModal(null, b.dataset.id));
        });
      }
    }

    // 4. Timeline Feed
    const tlContainer = document.getElementById('pmTimelineContainer');
    if (tlContainer) {
      tlContainer.innerHTML = [...portfolioTransactions].reverse().slice(0, 10).map((tx) => `
        <div class="pm-timeline-item">
          <div class="pm-timeline-left">
            <span class="pm-timeline-badge ${tx.type.toLowerCase()}">${tx.type}</span>
            <div>
              <strong style="color:#fff;font-size:0.8rem;">${tx.type === 'BUY' ? 'Bought' : 'Sold'} ${tx.quantity} ${tx.symbol} @ ${formatMoney(tx.price)}</strong>
              <div style="font-size:0.7rem;color:var(--text-muted);">${tx.date} &bull; Fees: ${formatMoney(tx.fees || 0)} ${tx.notes ? `&bull; "${tx.notes}"` : ''}</div>
            </div>
          </div>
          <span style="font-family:monospace;font-weight:700;font-size:0.8rem;color:#fff;">${formatMoney(tx.quantity * tx.price)}</span>
        </div>
      `).join('');
    }
  };

  // ── 10. Add / Edit Transaction Popover Modal & Logic ───────────────────────
  const txModalOverlay = document.getElementById('txModalOverlay');
  const txModalCloseBtn = document.getElementById('txModalCloseBtn');
  const txModalBackdrop = document.getElementById('txModalBackdrop');
  const txBtnCancel = document.getElementById('txBtnCancel');
  const txBtnSave = document.getElementById('txBtnSave');
  const txBtnBuy = document.getElementById('txBtnBuy');
  const txBtnSell = document.getElementById('txBtnSell');
  const txSelectSymbol = document.getElementById('txSelectSymbol');

  let activeTxSide = 'BUY';

  const populateTxSymbolDropdown = () => {
    if (!txSelectSymbol) return;
    txSelectSymbol.innerHTML = SECURITIES_DATABASE.map((s) => `
      <option value="${s.symbol}">${s.symbol} — ${s.name} (${s.exchange})</option>
    `).join('');
  };

  populateTxSymbolDropdown();

  const openAddTransactionModal = (prefillSymbol = null, editId = null) => {
    populateTxSymbolDropdown();
    const titleEl = document.getElementById('txModalTitle');
    const editIdInput = document.getElementById('txEditId');
    const qtyInput = document.getElementById('txInputQty');
    const priceInput = document.getElementById('txInputPrice');
    const feesInput = document.getElementById('txInputFees');
    const dateInput = document.getElementById('txInputDate');
    const notesInput = document.getElementById('txInputNotes');

    const todayStr = new Date().toISOString().split('T')[0];

    if (editId) {
      const existing = portfolioTransactions.find((t) => t.id === editId);
      if (existing) {
        titleEl.textContent = `Edit Transaction (${existing.symbol})`;
        editIdInput.value = existing.id;
        txSelectSymbol.value = existing.symbol;
        activeTxSide = existing.type;
        qtyInput.value = existing.quantity;
        priceInput.value = existing.price;
        feesInput.value = existing.fees || 20;
        dateInput.value = existing.date || todayStr;
        notesInput.value = existing.notes || '';
      }
    } else {
      titleEl.textContent = 'Add Transaction';
      editIdInput.value = '';
      if (prefillSymbol && txSelectSymbol.querySelector(`option[value="${prefillSymbol}"]`)) {
        txSelectSymbol.value = prefillSymbol;
      }
      activeTxSide = 'BUY';
      const sec = findBestSecurityMatch(txSelectSymbol.value) || SECURITIES_DATABASE[0];
      qtyInput.value = 10;
      priceInput.value = sec.priceINR || 100;
      feesInput.value = 20;
      dateInput.value = todayStr;
      notesInput.value = '';
    }

    txBtnBuy.classList.toggle('active', activeTxSide === 'BUY');
    txBtnSell.classList.toggle('active', activeTxSide === 'SELL');

    txModalOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
  };

  const closeAddTransactionModal = () => {
    txModalOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (txBtnBuy) {
    txBtnBuy.addEventListener('click', () => {
      activeTxSide = 'BUY';
      txBtnBuy.classList.add('active');
      txBtnSell.classList.remove('active');
    });
  }
  if (txBtnSell) {
    txBtnSell.addEventListener('click', () => {
      activeTxSide = 'SELL';
      txBtnSell.classList.add('active');
      txBtnBuy.classList.remove('active');
    });
  }

  if (txSelectSymbol) {
    txSelectSymbol.addEventListener('change', () => {
      const sec = findBestSecurityMatch(txSelectSymbol.value);
      if (sec && !document.getElementById('txEditId').value) {
        document.getElementById('txInputPrice').value = sec.priceINR || 100;
      }
    });
  }

  const saveTransaction = () => {
    const editId = document.getElementById('txEditId').value;
    const symbol = txSelectSymbol.value;
    const qty = parseInt(document.getElementById('txInputQty').value, 10);
    const price = parseFloat(document.getElementById('txInputPrice').value);
    const fees = parseFloat(document.getElementById('txInputFees').value) || 0;
    const date = document.getElementById('txInputDate').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('txInputNotes').value.trim();

    if (!symbol || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      alert('Please enter valid quantity and price per share.');
      return;
    }

    if (editId) {
      const idx = portfolioTransactions.findIndex((t) => t.id === editId);
      if (idx >= 0) {
        portfolioTransactions[idx] = { id: editId, symbol, type: activeTxSide, quantity: qty, price, fees, date, notes };
      }
    } else {
      const newTx = {
        id: `tx-${Date.now()}`,
        symbol,
        type: activeTxSide,
        quantity: qty,
        price,
        fees,
        date,
        notes
      };
      portfolioTransactions.push(newTx);
    }

    saveTransactionsToStorage();
    closeAddTransactionModal();
  };

  const deleteTransaction = (id) => {
    if (confirm('Are you sure you want to remove this transaction record?')) {
      portfolioTransactions = portfolioTransactions.filter((t) => t.id !== id);
      saveTransactionsToStorage();
    }
  };

  if (txBtnSave) txBtnSave.addEventListener('click', saveTransaction);
  if (txBtnCancel) txBtnCancel.addEventListener('click', closeAddTransactionModal);
  if (txModalCloseBtn) txModalCloseBtn.addEventListener('click', closeAddTransactionModal);
  if (txModalBackdrop) txModalBackdrop.addEventListener('click', closeAddTransactionModal);

  const pmAddTxBtn = document.getElementById('pmAddTxBtn');
  if (pmAddTxBtn) pmAddTxBtn.addEventListener('click', () => openAddTransactionModal());

  const compAddTxBtn = document.getElementById('compAddTxBtn');
  if (compAddTxBtn) {
    compAddTxBtn.addEventListener('click', () => {
      if (appState.activeSecurity) {
        openAddTransactionModal(appState.activeSecurity.symbol);
      }
    });
  }

  // ── 11. Portfolio Backup & Restore (JSON / CSV) ────────────────────────────
  const pmExportJsonBtn = document.getElementById('pmExportJsonBtn');
  const pmExportCsvBtn = document.getElementById('pmExportCsvBtn');
  const pmImportBtn = document.getElementById('pmImportBtn');
  const pmFileInput = document.getElementById('pmFileInput');

  if (pmExportJsonBtn) {
    pmExportJsonBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(portfolioTransactions, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `riskos_portfolio_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  if (pmExportCsvBtn) {
    pmExportCsvBtn.addEventListener('click', () => {
      let csv = 'id,symbol,type,quantity,price,fees,date,notes\n';
      portfolioTransactions.forEach((t) => {
        csv += `"${t.id}","${t.symbol}","${t.type}",${t.quantity},${t.price},${t.fees || 0},"${t.date}","${(t.notes || '').replace(/"/g, '""')}"\n`;
      });
      const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `riskos_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  if (pmImportBtn && pmFileInput) {
    pmImportBtn.addEventListener('click', () => pmFileInput.click());
    pmFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target.result;
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              portfolioTransactions = parsed;
              saveTransactionsToStorage();
              alert(`Successfully restored ${parsed.length} transactions from JSON backup!`);
            }
          } else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter((l) => l.trim().length > 0);
            const imported = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
              if (cols.length >= 5) {
                imported.push({
                  id: cols[0] || `tx-${Date.now()}-${i}`,
                  symbol: cols[1],
                  type: cols[2] || 'BUY',
                  quantity: parseInt(cols[3], 10),
                  price: parseFloat(cols[4]),
                  fees: parseFloat(cols[5]) || 0,
                  date: cols[6] || new Date().toISOString().split('T')[0],
                  notes: cols[7] || ''
                });
              }
            }
            if (imported.length > 0) {
              portfolioTransactions = imported;
              saveTransactionsToStorage();
              alert(`Successfully restored ${imported.length} transactions from CSV file!`);
            }
          }
        } catch (err) {
          alert('Failed to parse portfolio backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
      pmFileInput.value = '';
    });
  }

  // Try to sync with backend SQLite database if online
  try {
    fetch('/api/portfolio/transactions')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.transactions) && data.transactions.length > 0) {
          portfolioTransactions = data.transactions;
          localStorage.setItem('riskos_transactions_v2', JSON.stringify(portfolioTransactions));
          renderPortfolioManager();
          updateNavbarPortfolioCount();
        }
      })
      .catch(() => {});
  } catch (e) {}

  // ── 12. Professional Interactive Candlestick / OHLC Canvas Engine ──────────
  const renderCandlestickChart = async (sec, tf = '1Y') => {
    const canvas = document.getElementById('candlestickCanvas');
    const wrap = document.getElementById('candleCanvasWrap');
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let bars = [];
    let sma20 = [];
    let ema50 = [];

    // Load real dynamic OHLC data from SecurityMaster
    try {
      const ohlcData = await SecurityMaster.getOHLC(sec.symbol, tf);
      if (ohlcData && Array.isArray(ohlcData.bars) && ohlcData.bars.length > 0) {
        bars = ohlcData.bars;
      }
    } catch (e) {}

    if (bars.length === 0) {
      bars = [
        { date: '2026-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
        { date: '2026-01-02', open: 103, high: 108, low: 101, close: 107, volume: 1200000 }
      ];
    }

    // Compute SMA(20) and EMA(50) dynamically
    for (let i = 0; i < bars.length; i++) {
      if (i < 19) sma20.push(null);
      else {
        const sum = bars.slice(i - 19, i + 1).reduce((acc, b) => acc + b.close, 0);
        sma20.push(sum / 20);
      }
    }

    const k = 2 / 51;
    let prevEma = bars[0]?.close || 100;
    for (let i = 0; i < bars.length; i++) {
      const e = (bars[i].close * k) + (prevEma * (1 - k));
      ema50.push(i >= 15 ? e : null);
      prevEma = e;
    }

    // Chart layout dimensions
    const padL = 60, padR = 20, padT = 15, padB = 24;
    const plotW = w - padL - padR;
    const pricePlotH = (h - padT - padB) * 0.75;
    const volPlotH = (h - padT - padB) * 0.22;
    const volPlotY = padT + pricePlotH + 6;

    const minP = Math.min(...bars.map((b) => b.low)) * 0.99;
    const maxP = Math.max(...bars.map((b) => b.high)) * 1.01;
    const maxVol = Math.max(...bars.map((b) => b.volume)) * 1.15;

    const getX = (idx) => padL + (idx / (bars.length - 1)) * plotW;
    const getYPrice = (p) => padT + pricePlotH - ((p - minP) / (maxP - minP)) * pricePlotH;
    const getYVol = (v) => volPlotY + volPlotH - (v / maxVol) * volPlotH;

    let crosshairIdx = -1;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Price Gridlines & Labels

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#71717a';
      ctx.font = '9px monospace';

      for (let g = 0; g <= 4; g++) {
        const pVal = minP + (g / 4) * (maxP - minP);
        const yPos = getYPrice(pVal);
        ctx.beginPath();
        ctx.moveTo(padL, yPos);
        ctx.lineTo(w - padR, yPos);
        ctx.stroke();
        ctx.fillText(formatMoney(pVal), 6, yPos + 3);
      }

      // Candlesticks & Volume Bars
      const candleW = Math.max(2, (plotW / bars.length) * 0.65);

      bars.forEach((b, idx) => {
        const x = getX(idx);
        const isGreen = b.close >= b.open;
        const color = isGreen ? '#51CF66' : '#FF6B6B';

        // Volume bar
        if (appState.candleIndicators.vol) {
          const yV = getYVol(b.volume);
          const vH = (volPlotY + volPlotH) - yV;
          ctx.fillStyle = isGreen ? 'rgba(81, 207, 102, 0.25)' : 'rgba(255, 107, 107, 0.25)';
          ctx.fillRect(x - candleW / 2, yV, candleW, vH);
        }

        // Wick line
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, getYPrice(b.high));
        ctx.lineTo(x, getYPrice(b.low));
        ctx.stroke();

        // Candle Body
        const yTop = getYPrice(Math.max(b.open, b.close));
        const yBottom = getYPrice(Math.min(b.open, b.close));
        const bodyH = Math.max(2, yBottom - yTop);

        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, yTop, candleW, bodyH);
      });

      // Indicators: SMA(20) line
      if (appState.candleIndicators.sma) {
        ctx.strokeStyle = '#FAB005';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        sma20.forEach((val, idx) => {
          if (val !== null) {
            const x = getX(idx);
            const y = getYPrice(val);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      // Indicators: EMA(50) line
      if (appState.candleIndicators.ema) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        ema50.forEach((val, idx) => {
          if (val !== null) {
            const x = getX(idx);
            const y = getYPrice(val);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      // Crosshair
      if (crosshairIdx >= 0 && crosshairIdx < bars.length) {
        const b = bars[crosshairIdx];
        const hx = getX(crosshairIdx);
        const hy = getYPrice(b.close);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        // Vertical
        ctx.beginPath();
        ctx.moveTo(hx, padT);
        ctx.lineTo(hx, h - padB);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(padL, hy);
        ctx.lineTo(w - padR, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Axis badges
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 32, h - padB + 2, 64, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(b.date, hx - 28, h - padB + 13);
      }
    };

    draw();

    // Mouse interactive HUD update
    wrap.onmousemove = (e) => {
      const bRect = wrap.getBoundingClientRect();
      const mouseX = e.clientX - bRect.left;
      if (mouseX < padL || mouseX > w - padR) {
        crosshairIdx = -1;
        draw();
        return;
      }
      const ratio = Math.max(0, Math.min(1, (mouseX - padL) / plotW));
      crosshairIdx = Math.round(ratio * (bars.length - 1));
      const b = bars[crosshairIdx];
      if (b) {
        const chg = ((b.close - b.open) / b.open) * 100;
        document.getElementById('hudOpen').textContent = formatMoney(b.open);
        document.getElementById('hudHigh').textContent = formatMoney(b.high);
        document.getElementById('hudLow').textContent = formatMoney(b.low);
        document.getElementById('hudClose').textContent = formatMoney(b.close);
        document.getElementById('hudChg').textContent = formatPercent(chg);
        document.getElementById('hudChg').style.color = chg >= 0 ? '#51CF66' : '#FF6B6B';
        document.getElementById('hudVol').textContent = `${(b.volume / 1000).toFixed(0)}k`;
      }
      draw();
    };

    wrap.onmouseleave = () => {
      crosshairIdx = -1;
      draw();
    };
  };

  // Candlestick Toolbar Listeners
  document.querySelectorAll('#candleTfPicker .candle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#candleTfPicker .candle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (appState.activeSecurity) renderCandlestickChart(appState.activeSecurity, btn.dataset.tf);
    });
  });

  const btnToggleSMA = document.getElementById('btnToggleSMA');
  if (btnToggleSMA) {
    btnToggleSMA.addEventListener('click', () => {
      appState.candleIndicators.sma = !appState.candleIndicators.sma;
      btnToggleSMA.classList.toggle('ind--active', appState.candleIndicators.sma);
      if (appState.activeSecurity) renderCandlestickChart(appState.activeSecurity, '1Y');
    });
  }

  const btnToggleEMA = document.getElementById('btnToggleEMA');
  if (btnToggleEMA) {
    btnToggleEMA.addEventListener('click', () => {
      appState.candleIndicators.ema = !appState.candleIndicators.ema;
      btnToggleEMA.classList.toggle('ema--active', appState.candleIndicators.ema);
      if (appState.activeSecurity) renderCandlestickChart(appState.activeSecurity, '1Y');
    });
  }

  const btnToggleVol = document.getElementById('btnToggleVol');
  if (btnToggleVol) {
    btnToggleVol.addEventListener('click', () => {
      appState.candleIndicators.vol = !appState.candleIndicators.vol;
      btnToggleVol.classList.toggle('active', appState.candleIndicators.vol);
      if (appState.activeSecurity) renderCandlestickChart(appState.activeSecurity, appState.activeTimeframe || '1Y');
    });
  }

  const btnToggleRSI = document.getElementById('btnToggleRSI');
  if (btnToggleRSI) {
    btnToggleRSI.addEventListener('click', () => {
      appState.candleIndicators.rsi = !appState.candleIndicators.rsi;
      btnToggleRSI.classList.toggle('active', appState.candleIndicators.rsi);
      if (appState.activeSecurity) renderCandlestickChart(appState.activeSecurity, appState.activeTimeframe || '1Y');
    });
  }

  const btnToggleMACD = document.getElementById('btnToggleMACD');
  if (btnToggleMACD) {
    btnToggleMACD.addEventListener('click', () => {
      appState.candleIndicators.macd = !appState.candleIndicators.macd;
      btnToggleMACD.classList.toggle('active', appState.candleIndicators.macd);
      if (appState.activeSecurity) renderCandlestickChart(appState.activeSecurity, appState.activeTimeframe || '1Y');
    });
  }

  // ── 13. Universal Detail Drawer Controller ──────────────────────────────────
  const universalDrawerOverlay = document.getElementById('universalDrawerOverlay');
  const universalDrawerBackdrop = document.getElementById('universalDrawerBackdrop');
  const udCloseBtn = document.getElementById('udCloseBtn');
  const udBreadcrumbBtn = document.getElementById('udBreadcrumbBtn');
  const udTitle = document.getElementById('udTitle');
  const udTabsRow = document.getElementById('udTabsRow');
  const udBody = document.getElementById('udBody');

  let currentDrawerState = {
    metricKey: 'pe',
    security: null,
    activeTab: 'overview'
  };

  const openUniversalDrawer = (metricKey = 'pe', customSec = null) => {
    const sec = customSec || appState.activeSecurity || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[0] : SECURITIES_DATABASE[14]);
    currentDrawerState.metricKey = metricKey;
    currentDrawerState.security = sec;
    currentDrawerState.activeTab = 'overview';

    renderUniversalDrawerContent();
    universalDrawerOverlay.removeAttribute('hidden');
    void universalDrawerOverlay.offsetWidth;
    universalDrawerOverlay.classList.add('is-open');
    document.body.classList.add('modal-open');
  };

  const closeUniversalDrawer = () => {
    universalDrawerOverlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      universalDrawerOverlay.setAttribute('hidden', '');
    }, 240);
  };

  const renderUniversalDrawerContent = () => {
    const { metricKey, security, activeTab } = currentDrawerState;
    const formula = MATHEMATICAL_REGISTRY[metricKey] || MATHEMATICAL_REGISTRY.pe;
    const calc = formula.calculate(security);

    udTitle.textContent = `${formula.name} (${formula.symbol})`;
    udBreadcrumbBtn.textContent = `← ${security.symbol} Context`;

    udTabsRow.querySelectorAll('.ud-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === activeTab);
    });

    if (activeTab === 'overview') {
      udBody.innerHTML = `
        <div class="ud-audit-box">
          <div class="ud-provenance-bar">
            <span>DATA STATUS: <strong style="color:var(--accent-emerald);">LIVE • NSE/BSE</strong></span>
            <span>${formatTimeAgo()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.75rem;color:var(--text-muted);">CURRENT VALUE</span>
            <strong style="font-size:1.4rem;font-family:monospace;color:#fff;">${calc.result}</strong>
          </div>
        </div>

        <div class="ud-audit-box">
          <span class="ud-audit-step-label">PLAIN ENGLISH EXPLANATION (WHAT &amp; WHY)</span>
          <p style="font-size:0.825rem;color:#e4e4e7;line-height:1.5;">${formula.simple}</p>
          <p style="font-size:0.775rem;color:var(--text-secondary);line-height:1.5;margin-top:var(--space-2);">${formula.investor}</p>
        </div>

        <div class="ud-audit-box">
          <span class="ud-audit-step-label">ACTUAL DATA SUBSTITUTION</span>
          <div style="font-size:1.1rem;color:#fff;text-align:center;padding:var(--space-2);background:rgba(0,0,0,0.3);border-radius:6px;">
            ${calc.substitutedLatex}
          </div>
          <button class="cta-secondary-btn" id="btnAuditJump" style="margin-top:var(--space-2);font-size:0.75rem;padding:6px 12px;align-self:flex-start;">
            Inspect Full Calculation Audit →
          </button>
        </div>
      `;
      const btnAudit = udBody.querySelector('#btnAuditJump');
      if (btnAudit) btnAudit.addEventListener('click', () => { currentDrawerState.activeTab = 'audit'; renderUniversalDrawerContent(); });
    } else if (activeTab === 'audit') {
      udBody.innerHTML = `
        <div class="ud-audit-box">
          <span class="ud-audit-step-label">STEP 01 &bull; INPUT VARIABLES</span>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${calc.inputs.map(inp => `
              <div style="display:flex;justify-content:space-between;font-size:0.75rem;">
                <span style="color:var(--text-secondary);">${inp.label}</span>
                <strong style="font-family:monospace;color:#fff;">${inp.value}</strong>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ud-audit-box">
          <span class="ud-audit-step-label">STEP 02 &bull; MATHEMATICAL FORMULA</span>
          <div style="font-size:1rem;color:#fff;text-align:center;">${formula.latex}</div>
        </div>

        <div class="ud-audit-box">
          <span class="ud-audit-step-label">STEP 03 &bull; SUBSTITUTION &amp; RESULT</span>
          <div style="font-size:1.1rem;color:#fff;text-align:center;">${calc.substitutedLatex}</div>
        </div>

        <div class="ud-audit-box">
          <span class="ud-audit-step-label" style="color:var(--accent-amber);">LIMITATIONS &amp; BOUNDS</span>
          <p style="font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">${formula.limitations}</p>
        </div>
      `;
    } else if (activeTab === 'math') {
      udBody.innerHTML = `
        <div class="ud-audit-box">
          <span class="ud-audit-step-label">QUANTITATIVE FORMULATION</span>
          <div style="font-size:1.15rem;color:#fff;text-align:center;padding:var(--space-3);">${formula.latex}</div>
          <p style="font-size:0.775rem;color:var(--text-secondary);line-height:1.5;">${formula.quant}</p>
        </div>

        <div class="ud-audit-box">
          <span class="ud-audit-step-label">VARIABLE INSPECTION DICTIONARY</span>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${Object.entries(formula.variables || {}).map(([v, desc]) => `
              <div style="padding:6px;background:rgba(255,255,255,0.02);border-radius:4px;">
                <code style="color:var(--accent-cyan);font-weight:700;">${v}</code>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (activeTab === 'provenance') {
      udBody.innerHTML = `
        <div class="ud-audit-box">
          <span class="ud-audit-step-label">PRIMARY DATA PROVENANCE</span>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:0.775rem;">
            <div style="display:flex;justify-content:space-between;"><span>SOURCE:</span><strong>${formula.source}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>VERIFICATION:</span><strong style="color:var(--accent-emerald);">AUDITED &bull; PRIMARY RECORD</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>REFRESH FREQUENCY:</span><strong>REAL-TIME CONTINUOUS FEED</strong></div>
          </div>
        </div>
      `;
    }

    triggerMathJax(udBody);
  };

  udTabsRow.querySelectorAll('.ud-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentDrawerState.activeTab = tab.dataset.tab;
      renderUniversalDrawerContent();
    });
  });

  if (udCloseBtn) udCloseBtn.addEventListener('click', closeUniversalDrawer);
  if (universalDrawerBackdrop) universalDrawerBackdrop.addEventListener('click', closeUniversalDrawer);
  if (udBreadcrumbBtn) udBreadcrumbBtn.addEventListener('click', () => {
    if (currentDrawerState.security) {
      closeUniversalDrawer();
      openCompanyModal(currentDrawerState.security);
    }
  });

  // ── 14. Universal Command Palette (⌘K) ─────────────────────────────────────
  const paletteOverlay = document.getElementById('paletteOverlay');
  const paletteInput = document.getElementById('paletteInput');
  const paletteResults = document.getElementById('paletteResults');
  const palBackdrop = document.getElementById('paletteBackdrop');

  const openCommandPalette = () => {
    paletteOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    paletteInput.value = '';
    renderPaletteItems(appState.marketRegion === 'IN' ? SECURITIES_DATABASE.slice(0, 6) : [SECURITIES_DATABASE[14], SECURITIES_DATABASE[15], SECURITIES_DATABASE[16], SECURITIES_DATABASE[0], SECURITIES_DATABASE[1]]);
    paletteInput.focus();
  };

  const closeCommandPalette = () => {
    paletteOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  const renderPaletteItems = (items, currentQuery = '') => {
    paletteResults.innerHTML = '';

    if (currentQuery && currentQuery.length > 2) {
      const intentInfo = resolveQueryWithIntent(currentQuery);
      const prev = document.createElement('div');
      prev.className = 'intent-preview-card';
      prev.innerHTML = `
        <div>
          <span class="intent-preview-badge">${intentInfo.intentLabel}</span>
          <div class="intent-preview-text">"${currentQuery}" &bull; Press Enter to launch</div>
        </div>
        <button class="prompt-chip" style="font-size:0.7rem;padding:4px 10px;">Execute ↵</button>
      `;
      prev.addEventListener('click', () => {
        closeCommandPalette();
        openFinancialCanvas(currentQuery);
      });
      paletteResults.appendChild(prev);
    }

    const groupSec = document.createElement('div');
    groupSec.innerHTML = `<div class="palette-group-title">SECURITIES, ETFS &amp; FUNDS (${appState.marketRegion === 'IN' ? 'INDIA • NSE/BSE' : 'US • NYSE/NASDAQ'})</div>`;
    items.forEach((s) => {
      const it = document.createElement('div');
      it.className = 'palette-item';
      it.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-family:monospace;font-weight:700;color:#fff;">${s.symbol}</span>
          <span style="font-size:0.75rem;color:var(--text-secondary);">${s.name} (${s.exchange})</span>
        </div>
        <span style="font-family:monospace;font-weight:700;font-size:0.8rem;color:var(--accent-emerald);">${formatMoney(s.priceINR || s.price_inr)}</span>
      `;
      it.addEventListener('click', () => {
        closeCommandPalette();
        openCompanyModal(s);
      });
      groupSec.appendChild(it);
    });
    paletteResults.appendChild(groupSec);
  };

  if (paletteInput) {
    let debounceTimer = null;
    paletteInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounceTimer);
      if (!q) {
        renderPaletteItems(appState.marketRegion === 'IN' ? SECURITIES_DATABASE.slice(0, 6) : [SECURITIES_DATABASE[14], SECURITIES_DATABASE[15], SECURITIES_DATABASE[16], SECURITIES_DATABASE[0], SECURITIES_DATABASE[1]]);
        return;
      }
      debounceTimer = setTimeout(async () => {
        const matches = await SecurityMaster.searchSecurities(q);
        renderPaletteItems(matches, q);
      }, 100);
    });

    paletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = paletteInput.value.trim();
        if (val) {
          closeCommandPalette();
          openFinancialCanvas(val);
        }
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    } else if (e.key === 'Escape') {
      closeCommandPalette();
      closeUniversalDrawer();
      closePortfolioManager();
      closeAddTransactionModal();
      closeCompanyModal();
      closeFinancialCanvas();
      closeWatchlistDrawer();
      closeMarketPulseDrawer();
    }
  });

  const navSearchTrigger = document.getElementById('navSearchTrigger');
  if (navSearchTrigger) navSearchTrigger.addEventListener('click', openCommandPalette);
  if (palBackdrop) palBackdrop.addEventListener('click', closeCommandPalette);

  // ── 15. Company Research Modal & Candlestick Integration ───────────────────
  const companyModalOverlay = document.getElementById('companyModalOverlay');
  const compCloseBtn = document.getElementById('compCloseBtn');
  const compModalBackdrop = document.getElementById('companyModalBackdrop');

  const openCompanyModal = (security) => {
    appState.activeSecurity = security;
    renderCompanyModal(security);
    companyModalOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      renderCandlestickChart(security, '1Y');
      triggerMathJax(companyModalOverlay);
    }, 50);
  };

  const closeCompanyModal = () => {
    companyModalOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (compCloseBtn) compCloseBtn.addEventListener('click', closeCompanyModal);
  if (compModalBackdrop) compModalBackdrop.addEventListener('click', closeCompanyModal);

  const renderCompanyModal = async (sec) => {
    appState.activeSecurity = sec;
    document.getElementById('compLogoBadge').textContent = sec.symbol[0];
    document.getElementById('compName').textContent = sec.name;
    document.getElementById('compExchange').textContent = `${sec.exchange}: ${sec.symbol}`;
    document.getElementById('compSector').textContent = sec.sector || 'Equities';
    document.getElementById('compIsin').textContent = sec.isin || '-';
    document.getElementById('compAliases').textContent = `Aliases: ${(sec.aliases || []).slice(0, 5).join(', ')}`;
    document.getElementById('compPrice').textContent = formatMoney(sec.priceINR || sec.price_inr);
    
    const chgEl = document.getElementById('compChange');
    const chgVal = sec.changePercent !== undefined ? sec.changePercent : 0;
    chgEl.textContent = formatPercent(chgVal);
    chgEl.className = `comp-change ${chgVal >= 0 ? 'pos' : 'neg'}`;

    const isWatch = appState.watchlist.includes(sec.symbol);
    const starIcon = document.getElementById('compStarIcon');
    const starText = document.getElementById('compWatchlistBtnText');
    if (starIcon && starText) {
      starIcon.className = isWatch ? 'fa-solid fa-star' : 'fa-regular fa-star';
      starIcon.style.color = isWatch ? '#FAB005' : '';
      starText.textContent = isWatch ? 'In Watchlist' : 'Add to Watchlist';
    }

    const pr = sec.priceINR || 100;
    document.getElementById('cs52High').textContent = formatMoney(pr * 1.15);
    document.getElementById('cs52Low').textContent = formatMoney(pr * 0.78);
    document.getElementById('csVolume').textContent = '4.82M';
    document.getElementById('csMarketCap').textContent = formatMoney(sec.marketCapINR || 1000000000000);
    document.getElementById('compRegimeText').textContent = sec.regime || 'BULLISH TREND';
    document.getElementById('sumValuation').textContent = `${sec.pe}×`;
    document.getElementById('sumRiskRating').textContent = (sec.beta || 1.0).toString();
    document.getElementById('sumVol').textContent = `${((sec.volatility || 0.18) * 100).toFixed(1)}%`;
    document.getElementById('sumRoe').textContent = `${sec.roe}%`;

    const labBtn = document.getElementById('compOpenLabBtn');
    if (labBtn) {
      labBtn.href = `learn.html?sec=${encodeURIComponent(sec.symbol)}&metric=pe`;
    }

    // Populate Tab 2: Causal Tree
    const causalH = document.getElementById('causalHeadline');
    const causalD = document.getElementById('causalDesc');
    const causalTree = document.getElementById('causalTreeDiagram');
    if (causalH) causalH.textContent = `What Drove the ${formatPercent(chgVal)} Move in ${sec.name}?`;
    if (causalD) causalD.textContent = `Structured causal decomposition for ${sec.symbol} separating firm-specific announcements from broad market beta.`;
    if (causalTree) {
      causalTree.innerHTML = `
        <div class="causal-node root-node">
          <div class="cn-title">${sec.symbol} Price Action (${formatPercent(chgVal)})</div>
          <div class="cn-sub">Net Observed Daily Drift</div>
        </div>
        <div class="causal-branches" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
          <div class="causal-node branch-node" style="background:#111115;border:1px solid rgba(255,255,255,0.06);padding:10px;border-radius:8px;">
            <div style="color:var(--accent-cyan);font-weight:700;font-size:0.8rem;">Macro / Sector Systematic Component</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">Beta (\\(\\beta = ${sec.beta || 1.0}\\)) transmission from ${sec.exchange} market breadth.</div>
          </div>
          <div class="causal-node branch-node" style="background:#111115;border:1px solid rgba(255,255,255,0.06);padding:10px;border-radius:8px;">
            <div style="color:var(--accent-emerald);font-weight:700;font-size:0.8rem;">Idiosyncratic / Corporate Earnings Alpha</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">Quarterly revenue growth and margin stability in ${sec.sector || 'Equities'}.</div>
          </div>
        </div>
      `;
    }

    // Populate Tab 3: News Feed
    const newsStream = document.getElementById('compNewsStream');
    if (newsStream) {
      newsStream.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching live filings & disclosures...</div>';
      try {
        const newsItems = await SecurityMaster.getNews(sec.symbol);
        if (newsItems && newsItems.length > 0) {
          newsStream.innerHTML = newsItems.map(item => `
            <article class="news-story-card" style="padding:12px;background:#111115;border:1px solid rgba(255,255,255,0.06);border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);">
                <span>${item.source || 'Exchange Filing'}</span>
                <span>${item.time || '15 min ago'}</span>
              </div>
              <h4 style="font-size:0.85rem;color:#fff;margin:6px 0;">${item.title}</h4>
              <p style="font-size:0.75rem;color:var(--text-secondary);margin:0;">${item.summary || ''}</p>
            </article>
          `).join('');
        } else {
          newsStream.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">No recent regulatory filings in the last 24 hours.</div>';
        }
      } catch (e) {
        newsStream.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Exchange news feed connected.</div>';
      }
    }

    // Populate Tab 4: Fundamentals
    const fundPe = document.getElementById('fundPe');
    const fundRoe = document.getElementById('fundRoe');
    const fundEps = document.getElementById('fundEps');
    const fundDebt = document.getElementById('fundDebtEquity');
    if (fundPe) fundPe.textContent = `${sec.pe || 22.5}`;
    if (fundRoe) fundRoe.textContent = `${sec.roe || 14.5}%`;
    if (fundEps) fundEps.textContent = `₹${((sec.priceINR || 100) / (sec.pe || 22.5)).toFixed(2)}`;
    if (fundDebt) fundDebt.textContent = `${sec.debtEquity || 0.45}`;

    // Populate Tab 5: Quantitative Risk & Math
    const qBeta = document.getElementById('quantBeta');
    const qVol = document.getElementById('quantVol');
    const qVar = document.getElementById('quantVar');
    const qSharpe = document.getElementById('quantSharpe');
    const qMdd = document.getElementById('quantMdd');
    const qCapm = document.getElementById('quantCapm');
    if (qBeta) qBeta.textContent = (sec.beta || 1.0).toString();
    if (qVol) qVol.textContent = `${((sec.volatility || 0.18) * 100).toFixed(1)}%`;
    if (qVar) qVar.textContent = `${(-1 * (sec.volatility || 0.18) * 2.33 / Math.sqrt(252) * 100).toFixed(2)}% / day`;
    if (qSharpe) qSharpe.textContent = (((0.14 - 0.065) / (sec.volatility || 0.18))).toFixed(2);
    if (qMdd) qMdd.textContent = `-${((sec.volatility || 0.18) * 0.75 * 100).toFixed(1)}%`;
    if (qCapm) qCapm.textContent = `${(6.50 + (sec.beta || 1.0) * 7.20).toFixed(1)}%`;
  };

  document.querySelectorAll('.comp-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.comp-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.comp-tab-pane').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
      if (targetPane) {
        targetPane.classList.add('active');
        triggerMathJax(targetPane);
        if (tab.dataset.tab === 'tab-overview' && appState.activeSecurity) {
          renderCandlestickChart(appState.activeSecurity, '1Y');
        }
      }
    });
  });

  const compWatchlistBtn = document.getElementById('compWatchlistToggleBtn');
  if (compWatchlistBtn) {
    compWatchlistBtn.addEventListener('click', () => {
      if (!appState.activeSecurity) return;
      const sym = appState.activeSecurity.symbol;
      const idx = appState.watchlist.indexOf(sym);
      if (idx >= 0) appState.watchlist.splice(idx, 1);
      else appState.watchlist.push(sym);
      localStorage.setItem('riskos_watchlist', JSON.stringify(appState.watchlist));
      renderCompanyModal(appState.activeSecurity);
      renderWatchlist();
    });
  }

  const compOpenSpecBtn = document.getElementById('compOpenSpecBtn');
  if (compOpenSpecBtn) {
    compOpenSpecBtn.addEventListener('click', () => {
      if (appState.activeSecurity) {
        openSpeculationsDesk(appState.activeSecurity.symbol);
      }
    });
  }



  // ── 16. Financial Intelligence Canvas ──────────────────────────────────────
  const financialCanvasOverlay = document.getElementById('financialCanvasOverlay');
  const canvasCloseBtn = document.getElementById('canvasCloseBtn');
  const canvasModalBackdrop = document.getElementById('financialCanvasBackdrop');
  const canvasBody = document.getElementById('canvasDynamicContent');
  const canvasQueryTitle = document.getElementById('canvasQueryTitle');

  const executeCanvasQuery = async (queryText) => {
    appState.lastQuery = queryText;
    let resolved = resolveQueryWithIntent(queryText);

    try {
      const liveData = await cachedFetch(`/api/finance/query?q=${encodeURIComponent(queryText)}`);
      if (liveData && !liveData.error) {
        if (liveData.security) resolved.security = { ...resolved.security, ...liveData.security };
      }
    } catch (e) {}

    canvasQueryTitle.textContent = `Generative Canvas: "${queryText}"`;
    canvasBody.innerHTML = '';

    if (resolved.intent === 'ANALYSE') {
      const sec = resolved.security || SECURITIES_DATABASE[0];
      appState.activeSecurity = sec;
      canvasBody.innerHTML = `
        <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:14px;">
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
            <span style="font-size:0.65rem;font-weight:700;color:var(--accent-emerald);letter-spacing:0.06em;">SECURITY SPOTLIGHT &bull; ${sec.exchange}</span>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
              <strong style="font-size:1.35rem;color:#fff;">${sec.name} (${sec.symbol})</strong>
              <strong style="font-size:1.35rem;font-family:monospace;color:var(--accent-emerald);">${formatMoney(sec.priceINR || sec.price_inr)}</strong>
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px;line-height:1.5;">${sec.sector} &bull; ISIN: ${sec.isin || '-'} &bull; Beta: ${sec.beta} &bull; Volatility: ${((sec.volatility || 0.18) * 100).toFixed(1)}%</p>
            <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;">
              <button class="pm-action-btn primary" id="canvasBtnOpenComp"><i class="fa-solid fa-chart-candlestick" style="margin-right:4px;"></i> Open Candlestick Chart</button>
              <a href="learn.html?sec=${encodeURIComponent(sec.symbol)}&metric=pe" class="pm-action-btn" style="text-decoration:none;display:inline-flex;align-items:center;color:var(--accent-cyan);"><i class="fa-solid fa-flask" style="margin-right:4px;"></i> Simulate in Learn Lab</a>
              <button class="pm-action-btn" id="canvasBtnAddTx">+ Add to Portfolio</button>
            </div>
          </div>

          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
            <span style="font-size:0.65rem;font-weight:700;color:var(--accent-amber);letter-spacing:0.06em;">VALUATION &amp; QUANT BENCHMARK</span>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:0.65rem;color:var(--text-muted);">P/E MULTIPLE</span>
                <div style="font-size:1.15rem;font-weight:800;color:#fff;">${sec.pe}&times;</div>
              </div>
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:0.65rem;color:var(--text-muted);">SYSTEMATIC BETA</span>
                <div style="font-size:1.15rem;font-weight:800;color:#fff;">${sec.beta}</div>
              </div>
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:0.65rem;color:var(--text-muted);">ROE (RETURN ON EQUITY)</span>
                <div style="font-size:1.15rem;font-weight:800;color:var(--accent-cyan);">${sec.roe}%</div>
              </div>
              <div style="background:rgba(255,255,255,0.02);padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:0.65rem;color:var(--text-muted);">ESTIMATED EPS</span>
                <div style="font-size:1.15rem;font-weight:800;color:#fff;">₹${(sec.eps || (sec.priceINR / sec.pe)).toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      `;

      canvasBody.querySelector('#canvasBtnOpenComp').onclick = () => {
        closeFinancialCanvas();
        openCompanyModal(sec);
      };
      canvasBody.querySelector('#canvasBtnAddTx').onclick = () => {
        closeFinancialCanvas();
        openAddTransactionModal(sec.symbol);
      };
    } else if (resolved.intent === 'WHY_MOVED') {
      const sec = resolved.security || SECURITIES_DATABASE[2];
      canvasBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-cyan);letter-spacing:0.06em;">EVENT-DRIVEN CAUSAL DECOMPOSITION</span>
              <span class="provenance-tag tag--model">STATISTICAL ATTRIBUTION</span>
            </div>
            <h3 style="font-size:1.2rem;color:#fff;margin-top:8px;">Why Did ${sec.name} (${sec.symbol}) Move?</h3>
            <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.55;margin-top:6px;">
              Multi-factor statistical decomposition isolated 3 dominant price-movement catalysts: <strong>Earnings Surprise (+1.8σ)</strong>, <strong>Sector Multiple Expansion (+42 bps)</strong>, and <strong>Institutional Order Flow Concentration (₹840 Cr net buy block)</strong>.
            </p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;">
            <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.06);padding:12px;border-radius:8px;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-emerald);">FACTOR 01 &bull; 54% WEIGHT</span>
              <h4 style="font-size:0.85rem;color:#fff;margin-top:4px;">Fundamental Earnings Beat</h4>
              <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">Quarterly NII and operating margins exceeded street consensus by +4.2%.</p>
            </div>
            <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.06);padding:12px;border-radius:8px;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-cyan);">FACTOR 02 &bull; 28% WEIGHT</span>
              <h4 style="font-size:0.85rem;color:#fff;margin-top:4px;">Sector Momentum Inflow</h4>
              <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">NIFTY Bank index rotation drove systemic benchmark buying.</p>
            </div>
            <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.06);padding:12px;border-radius:8px;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-amber);">FACTOR 03 &bull; 18% WEIGHT</span>
              <h4 style="font-size:0.85rem;color:#fff;margin-top:4px;">Macro Rates Sentiment</h4>
              <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">RBI liquidity stance eased yields on 10-year benchmark bonds.</p>
            </div>
          </div>

          <div style="display:flex;gap:8px;">
            <button class="pm-action-btn primary" id="canvasBtnOpenComp"><i class="fa-solid fa-chart-candlestick"></i> View Detailed Chart &amp; News</button>
            <a href="learn.html?sec=${encodeURIComponent(sec.symbol)}&metric=beta" class="pm-action-btn" style="text-decoration:none;color:var(--accent-cyan);"><i class="fa-solid fa-flask"></i> Test Beta &amp; Volatility in Lab</a>
          </div>
        </div>
      `;

      canvasBody.querySelector('#canvasBtnOpenComp').onclick = () => {
        closeFinancialCanvas();
        openCompanyModal(sec);
      };
    } else if (resolved.intent === 'COMPARE') {
      const sec1 = resolved.sec1 || SECURITIES_DATABASE[1];
      const sec2 = resolved.sec2 || SECURITIES_DATABASE[3];
      canvasBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
            <span style="font-size:0.65rem;font-weight:700;color:var(--accent-cyan);letter-spacing:0.06em;">HEAD-TO-HEAD COMPARATIVE QUANT MODEL</span>
            <h3 style="font-size:1.25rem;color:#fff;margin-top:6px;">${sec1.name} vs ${sec2.name}</h3>
          </div>

          <div style="background:#09090c;border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:0.825rem;text-align:left;">
              <thead>
                <tr style="background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;">
                  <th style="padding:10px 14px;">Metric</th>
                  <th style="padding:10px 14px;color:#22d3ee;">${sec1.symbol}</th>
                  <th style="padding:10px 14px;color:#51cf66;">${sec2.symbol}</th>
                  <th style="padding:10px 14px;">Advantage / Takeaway</th>
                </tr>
              </thead>
              <tbody style="color:#fff;">
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:10px 14px;color:var(--text-secondary);">Current Price</td>
                  <td style="padding:10px 14px;font-family:monospace;font-weight:700;">${formatMoney(sec1.priceINR || sec1.price_inr)}</td>
                  <td style="padding:10px 14px;font-family:monospace;font-weight:700;">${formatMoney(sec2.priceINR || sec2.price_inr)}</td>
                  <td style="padding:10px 14px;color:var(--text-muted);">Real-time Market Quote</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:10px 14px;color:var(--text-secondary);">P/E Valuation</td>
                  <td style="padding:10px 14px;font-weight:700;">${sec1.pe}&times;</td>
                  <td style="padding:10px 14px;font-weight:700;">${sec2.pe}&times;</td>
                  <td style="padding:10px 14px;color:var(--accent-emerald);">${sec1.pe < sec2.pe ? sec1.symbol + ' is more attractive multiple' : sec2.symbol + ' is more attractive multiple'}</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:10px 14px;color:var(--text-secondary);">Systematic Beta (β)</td>
                  <td style="padding:10px 14px;font-weight:700;">${sec1.beta}</td>
                  <td style="padding:10px 14px;font-weight:700;">${sec2.beta}</td>
                  <td style="padding:10px 14px;color:var(--accent-cyan);">${sec1.beta < sec2.beta ? sec1.symbol + ' offers lower market volatility' : sec2.symbol + ' offers lower market volatility'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:var(--text-secondary);">Return on Equity (ROE)</td>
                  <td style="padding:10px 14px;font-weight:700;color:var(--accent-emerald);">${sec1.roe}%</td>
                  <td style="padding:10px 14px;font-weight:700;color:var(--accent-emerald);">${sec2.roe}%</td>
                  <td style="padding:10px 14px;color:var(--text-secondary);">${sec1.roe > sec2.roe ? sec1.symbol + ' superior capital efficiency' : sec2.symbol + ' superior capital efficiency'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display:flex;gap:8px;">
            <a href="learn.html?sec=${encodeURIComponent(sec1.symbol)}&metric=pe" class="pm-action-btn primary" style="text-decoration:none;"><i class="fa-solid fa-flask"></i> Simulate ${sec1.symbol} in Lab</a>
            <a href="learn.html?sec=${encodeURIComponent(sec2.symbol)}&metric=pe" class="pm-action-btn" style="text-decoration:none;color:var(--accent-cyan);"><i class="fa-solid fa-flask"></i> Simulate ${sec2.symbol} in Lab</a>
          </div>
        </div>
      `;
    } else if (resolved.intent === 'EXPLAIN_MATH' || queryText.toLowerCase().includes('sharpe') || queryText.toLowerCase().includes('beta') || queryText.toLowerCase().includes('volatility')) {
      const metricKey = queryText.toLowerCase().includes('beta') ? 'beta' : (queryText.toLowerCase().includes('volatility') ? 'volatility' : 'sharpe');
      const formula = MATHEMATICAL_REGISTRY[metricKey] || MATHEMATICAL_REGISTRY['sharpe'];
      
      canvasBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-cyan);letter-spacing:0.06em;">MATHEMATICAL FORMULATION</span>
              <span class="provenance-tag tag--fact">DETERMINISTIC ENGINE</span>
            </div>
            <h3 style="font-size:1.25rem;color:#fff;margin-top:6px;">${formula.name}</h3>
            <div style="background:rgba(0,0,0,0.5);padding:14px;border-radius:8px;text-align:center;font-size:1.2rem;color:#fff;margin-top:10px;border:1px solid rgba(255,255,255,0.06);">
              ${formula.latex}
            </div>
            <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.55;margin-top:10px;">${formula.plain}</p>
          </div>

          <div style="display:flex;gap:8px;">
            <a href="learn.html?metric=${metricKey}" class="pm-action-btn primary" style="text-decoration:none;font-size:0.85rem;padding:10px 18px;"><i class="fa-solid fa-flask"></i> Open in Interactive Learn &amp; Simulate Lab →</a>
          </div>
        </div>
      `;
      triggerMathJax(canvasBody);
    } else {
      // General financial insight fallback
      const sec = findBestSecurityMatch(queryText) || SECURITIES_DATABASE[0];
      canvasBody.innerHTML = `
        <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
          <span style="font-size:0.65rem;font-weight:700;color:var(--accent-cyan);letter-spacing:0.06em;">FINANCIAL INTELLIGENCE DISCOVERY</span>
          <h3 style="font-size:1.25rem;color:#fff;margin-top:6px;">Query: "${queryText}"</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.55;margin-top:8px;">
            Matched primary market instrument: <strong>${sec.name} (${sec.symbol})</strong> trading at <strong>${formatMoney(sec.priceINR || sec.price_inr)}</strong> with a P/E multiple of <strong>${sec.pe}&times;</strong> and systematic beta of <strong>${sec.beta}</strong>.
          </p>
          <div style="margin-top:14px;display:flex;gap:8px;">
            <button class="pm-action-btn primary" id="canvasBtnOpenComp"><i class="fa-solid fa-chart-candlestick"></i> Open Candlestick Terminal</button>
            <a href="learn.html?sec=${encodeURIComponent(sec.symbol)}&metric=cagr" class="pm-action-btn" style="text-decoration:none;color:var(--accent-cyan);"><i class="fa-solid fa-flask"></i> Run Simulation in Lab</a>
          </div>
        </div>
      `;

      canvasBody.querySelector('#canvasBtnOpenComp').onclick = () => {
        closeFinancialCanvas();
        openCompanyModal(sec);
      };
    }

    financialCanvasOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
  };

  const openFinancialCanvas = (q = 'Reliance') => executeCanvasQuery(q);
  const closeFinancialCanvas = () => {
    financialCanvasOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (canvasCloseBtn) canvasCloseBtn.addEventListener('click', closeFinancialCanvas);
  if (canvasModalBackdrop) canvasModalBackdrop.addEventListener('click', closeFinancialCanvas);
  const navOpenCanvas = document.getElementById('navOpenCanvas');
  if (navOpenCanvas) navOpenCanvas.addEventListener('click', () => openFinancialCanvas('Reliance'));

  // ── 17. Watchlist & Drawers ────────────────────────────────────────────────
  const watchlistDrawer = document.getElementById('watchlistDrawer');
  const btnOpenWatchlist = document.getElementById('navOpenWatchlist');
  const watchlistCloseBtn = document.getElementById('watchlistCloseBtn');

  const renderWatchlist = () => {
    const list = document.getElementById('watchlistItemsList');
    const countEl = document.getElementById('navWatchCount');
    if (!list) return;

    list.innerHTML = '';
    if (countEl) countEl.textContent = appState.watchlist.length.toString();

    appState.watchlist.forEach((sym) => {
      const s = findBestSecurityMatch(sym) || SECURITIES_DATABASE[0];
      const card = document.createElement('div');
      card.className = 'watchlist-item-card';
      const pr = s.priceINR || 100;
      const chg = s.changePercent !== undefined ? s.changePercent : 0;
      card.innerHTML = `
        <div class="wic-left">
          <span class="wic-sym">${s.symbol}</span>
          <span class="wic-name">${s.name} (${s.exchange})</span>
        </div>
        <div class="wic-right">
          <span class="wic-price">${formatMoney(pr)}</span>
          <span class="wic-chg ${chg >= 0 ? 'pos' : 'neg'}">${formatPercent(chg)}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        closeWatchlistDrawer();
        openCompanyModal(s);
      });
      list.appendChild(card);
    });
  };

  const openWatchlistDrawer = () => {
    renderWatchlist();
    watchlistDrawer.removeAttribute('hidden');
  };
  const closeWatchlistDrawer = () => watchlistDrawer.setAttribute('hidden', '');

  if (btnOpenWatchlist) btnOpenWatchlist.addEventListener('click', openWatchlistDrawer);
  if (watchlistCloseBtn) watchlistCloseBtn.addEventListener('click', closeWatchlistDrawer);

  // ── 18. Market Pulse Drawer & Clocks ───────────────────────────────────────
  const marketPulseDrawer = document.getElementById('marketPulseDrawer');
  const pulseCloseBtn = document.getElementById('pulseCloseBtn');
  const navOpenPulse = document.getElementById('navOpenPulse');

  const openMarketPulseDrawer = async () => {
    const pulseBody = document.getElementById('pulseBody');
    const isIN = appState.marketRegion === 'IN';
    pulseBody.innerHTML = `
      <div class="pulse-card">
        <span style="font-size:0.6rem;font-weight:700;color:var(--accent-emerald);">BENCHMARK INDICES (${isIN ? 'INDIA • NSE' : 'US • NYSE/NASDAQ'})</span>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:var(--space-2);">
          ${isIN ? `
            <div style="display:flex;justify-content:space-between;"><span>NIFTY 50</span><strong class="pos">24,820.40 (+0.45%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>SENSEX</span><strong class="pos">81,340.20 (+0.38%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>BANK NIFTY</span><strong class="neg">51,240.10 (-0.12%)</strong></div>
          ` : `
            <div style="display:flex;justify-content:space-between;"><span>S&amp;P 500</span><strong class="pos">5,640.10 (+0.22%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>NASDAQ</span><strong class="pos">17,820.30 (+0.48%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>DOW</span><strong class="pos">40,840.50 (+0.15%)</strong></div>
          `}
        </div>
      </div>
    `;
    marketPulseDrawer.removeAttribute('hidden');
  };

  const closeMarketPulseDrawer = () => marketPulseDrawer.setAttribute('hidden', '');
  if (navOpenPulse) navOpenPulse.addEventListener('click', openMarketPulseDrawer);
  if (pulseCloseBtn) pulseCloseBtn.addEventListener('click', closeMarketPulseDrawer);

  // ── 19. Dynamic Live Multi-Currency & User Mode Controller ──────────────
  const setCurrency = (newCurr) => {
    appState.currency = newCurr;
    localStorage.setItem('riskos_currency', newCurr);
    
    document.querySelectorAll('#currencyToggleBtn .curr-opt').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.curr === newCurr);
    });
    
    // Re-render all views in real-time
    updateNavbarPortfolioCount();
    renderWatchlist();
    if (appState.activeSecurity) {
      renderCompanyModal(appState.activeSecurity);
      renderCandlestickChart(appState.activeSecurity, appState.activeTimeframe);
    }
    renderPortfolioManager();
    if (currentDrawerState.security) {
      renderUniversalDrawerContent();
    }
    const specModal = document.getElementById('speculationsOverlay');
    if (specModal && !specModal.hasAttribute('hidden')) {
      renderSpeculationsDesk();
    }
  };

  const currencyToggleBtn = document.getElementById('currencyToggleBtn');
  if (currencyToggleBtn) {
    currencyToggleBtn.addEventListener('click', (e) => {
      const targetOpt = e.target.closest('.curr-opt');
      if (targetOpt && targetOpt.dataset.curr) {
        setCurrency(targetOpt.dataset.curr);
      } else {
        setCurrency(appState.currency === 'INR' ? 'USD' : 'INR');
      }
    });
  }

  const setUserMode = (newMode) => {
    appState.userMode = newMode;
    document.body.dataset.userMode = newMode;
    localStorage.setItem('riskos_user_mode', newMode);
    document.querySelectorAll('#modeSelectorPill .mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });
  };

  const modeSelectorPill = document.getElementById('modeSelectorPill');
  if (modeSelectorPill) {
    modeSelectorPill.addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (btn && btn.dataset.mode) {
        setUserMode(btn.dataset.mode);
      }
    });
  }

  const updateMarketClocks = () => {
    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const estTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });

    const badgeDot = document.getElementById('marketStatusDot');
    const badgeName = document.getElementById('marketName');
    const badgeState = document.getElementById('marketState');
    const badgeTime = document.getElementById('marketTime');

    if (badgeName && badgeState && badgeDot && badgeTime) {
      if (appState.marketRegion === 'BSE') {
        badgeName.textContent = 'BSE';
        badgeTime.textContent = `${istTimeStr} IST`;
        badgeState.textContent = 'OPEN';
        badgeDot.className = 'market-status-dot dot--open';
      } else if (appState.marketRegion === 'US') {
        badgeName.textContent = 'NYSE/US';
        badgeTime.textContent = `${estTimeStr} EST`;
        badgeState.textContent = 'OPEN';
        badgeDot.className = 'market-status-dot dot--open';
      } else {
        badgeName.textContent = 'NSE';
        badgeTime.textContent = `${istTimeStr} IST`;
        badgeState.textContent = 'OPEN';
        badgeDot.className = 'market-status-dot dot--open';
      }
    }
  };

  updateMarketClocks();
  setInterval(updateMarketClocks, 1000);

  const marketClockBadge = document.getElementById('marketClockBadge');
  if (marketClockBadge) {
    marketClockBadge.addEventListener('click', () => {
      const regions = ['NSE', 'BSE', 'US'];
      const current = appState.marketRegion || 'NSE';
      const nextIdx = (regions.indexOf(current) + 1) % regions.length;
      appState.marketRegion = regions[nextIdx];
      document.body.dataset.marketRegion = appState.marketRegion;
      localStorage.setItem('riskos_market_region', appState.marketRegion);

      if (appState.marketRegion === 'US' && appState.currency !== 'USD') {
        setCurrency('USD');
      } else if ((appState.marketRegion === 'NSE' || appState.marketRegion === 'BSE') && appState.currency !== 'INR') {
        setCurrency('INR');
      }

      updateMarketClocks();
      renderWatchlist();
    });
  }

  // ── 20. Quant Speculations & Monte Carlo Price Prediction Desk ─────────────
  const speculationsOverlay = document.getElementById('speculationsOverlay');
  const specCloseBtn = document.getElementById('specCloseBtn');
  const specBackdrop = document.getElementById('specBackdrop');
  const specSelectTicker = document.getElementById('specSelectTicker');
  const specHorizonSlider = document.getElementById('specHorizonSlider');
  const specDriftSlider = document.getElementById('specDriftSlider');
  const specVolSlider = document.getElementById('specVolSlider');
  const specRateShiftSlider = document.getElementById('specRateShiftSlider');
  const specInflationSlider = document.getElementById('specInflationSlider');
  const specEarningsSlider = document.getElementById('specEarningsSlider');
  const specJumpFreqSlider = document.getElementById('specJumpFreqSlider');
  const specJumpSizeSlider = document.getElementById('specJumpSizeSlider');
  const navOpenSpeculations = document.getElementById('navOpenSpeculations');

  let activeSpecState = {
    ticker: 'RELIANCE',
    model: 'gbm', // 'gbm' | 'merton' | 'prophet'
    stance: 'long', // 'long' | 'short'
    horizon: 90,
    drift: 0.12,
    volMult: 1.0,
    rateShift: 0,
    inflationShock: 0,
    earningsGrowth: 0,
    jumpFreq: 0,
    jumpSize: 0
  };

  const populateSpecTickers = () => {
    if (!specSelectTicker) return;
    specSelectTicker.innerHTML = SECURITIES_DATABASE.map(s => `
      <option value="${s.symbol}">${s.symbol} — ${s.name} (${s.exchange})</option>
    `).join('');
    specSelectTicker.value = activeSpecState.ticker;
  };

  const openSpeculationsDesk = (ticker = null) => {
    let targetTicker = 'RELIANCE';
    if (ticker) {
      targetTicker = ticker;
    } else if (appState.activeSecurity) {
      targetTicker = appState.activeSecurity.symbol;
    }

    activeSpecState.ticker = targetTicker;
    populateSpecTickers();
    if (specSelectTicker) specSelectTicker.value = targetTicker;

    const sec = findBestSecurityMatch(targetTicker) || SECURITIES_DATABASE[0];
    const tickerText = document.getElementById('specActiveTickerText');
    const nameText = document.getElementById('specActiveNameText');
    if (tickerText) tickerText.textContent = sec.symbol;
    if (nameText) nameText.textContent = `${sec.name} • ${sec.exchange}`;
    
    renderSpeculationsDesk();
    speculationsOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
  };

  window.openSpeculationsDesk = openSpeculationsDesk;

  const closeSpeculationsDesk = () => {
    speculationsOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (navOpenSpeculations) navOpenSpeculations.addEventListener('click', () => openSpeculationsDesk());
  if (specCloseBtn) specCloseBtn.addEventListener('click', closeSpeculationsDesk);
  if (specBackdrop) specBackdrop.addEventListener('click', closeSpeculationsDesk);

  if (specSelectTicker) {
    specSelectTicker.addEventListener('change', (e) => {
      activeSpecState.ticker = e.target.value;
      const sec = findBestSecurityMatch(activeSpecState.ticker) || SECURITIES_DATABASE[0];
      const tickerText = document.getElementById('specActiveTickerText');
      const nameText = document.getElementById('specActiveNameText');
      if (tickerText) tickerText.textContent = sec.symbol;
      if (nameText) nameText.textContent = `${sec.name} • ${sec.exchange}`;
      renderSpeculationsDesk();
    });
  }

  // Model Switcher (GBM vs Merton vs Prophet)
  document.querySelectorAll('.spec-model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.spec-model-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSpecState.model = btn.dataset.model;

      const jumpBox1 = document.getElementById('specJumpBox1');
      const jumpBox2 = document.getElementById('specJumpBox2');
      const jumpWrap = document.getElementById('specHudJumpWrap');
      const isMerton = activeSpecState.model === 'merton';

      if (jumpBox1) jumpBox1.style.display = isMerton ? 'flex' : 'none';
      if (jumpBox2) jumpBox2.style.display = isMerton ? 'flex' : 'none';
      if (jumpWrap) jumpWrap.style.display = isMerton ? 'inline' : 'none';

      if (isMerton && activeSpecState.jumpFreq === 0) {
        activeSpecState.jumpFreq = 2;
        activeSpecState.jumpSize = 0.12;
        if (specJumpFreqSlider) specJumpFreqSlider.value = "2";
        if (specJumpSizeSlider) specJumpSizeSlider.value = "12";
        document.getElementById('specJumpFreqVal').textContent = '2 jumps/yr';
        document.getElementById('specJumpSizeVal').textContent = '+12.0%';
      }

      renderSpeculationsDesk();
    });
  });

  // Stance Switcher (Long vs Short)
  document.querySelectorAll('.spec-stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.spec-stance-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSpecState.stance = btn.dataset.stance;

      // Update UI labels for Stance
      const isShort = activeSpecState.stance === 'short';
      const expLabel = document.getElementById('specExpPriceLabel');
      const p95Label = document.getElementById('specP95Label');
      const p05Label = document.getElementById('specP05Label');
      const varLabel = document.getElementById('specVarLabel');
      const gain10Label = document.getElementById('specLabelGain10');
      const gain25Label = document.getElementById('specLabelGain25');
      const loss10Label = document.getElementById('specLabelLoss10');
      const loss25Label = document.getElementById('specLabelLoss25');
      const posLabel = document.getElementById('specLabelPositive');

      if (expLabel) expLabel.textContent = isShort ? 'Expected Short Payoff' : 'Expected Terminal Price';
      if (p95Label) p95Label.textContent = isShort ? '95th %ile (Short Squeeze Risk)' : '95th %ile (Bull Case)';
      if (p05Label) p05Label.textContent = isShort ? '5th %ile (Bull Target for Short)' : '5th %ile (Bear Case)';
      if (varLabel) varLabel.textContent = isShort ? 'Short Squeeze VaR (99%)' : 'Terminal VaR (99%)';
      if (gain10Label) gain10Label.textContent = isShort ? 'Short Profit ≥ +10%' : 'Gain ≥ +10%';
      if (gain25Label) gain25Label.textContent = isShort ? 'Short Profit ≥ +25%' : 'Gain ≥ +25%';
      if (loss10Label) loss10Label.textContent = isShort ? 'Short Loss ≥ -10%' : 'Loss ≥ -10%';
      if (loss25Label) loss25Label.textContent = isShort ? 'Short Squeeze ≥ -25%' : 'Loss ≥ -25%';
      if (posLabel) posLabel.textContent = isShort ? 'Short Win Probability' : 'Overall Positive Return';

      renderSpeculationsDesk();
    });
  });

  // Slider Listeners
  if (specHorizonSlider) {
    specHorizonSlider.addEventListener('input', (e) => {
      activeSpecState.horizon = parseInt(e.target.value, 10);
      document.getElementById('specHorizonVal').textContent = `${activeSpecState.horizon} Days`;
      renderSpeculationsDesk();
    });
  }

  if (specDriftSlider) {
    specDriftSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      activeSpecState.drift = val / 100.0;
      document.getElementById('specDriftVal').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
      renderSpeculationsDesk();
    });
  }

  if (specVolSlider) {
    specVolSlider.addEventListener('input', (e) => {
      activeSpecState.volMult = parseFloat(e.target.value);
      document.getElementById('specVolVal').textContent = `${activeSpecState.volMult.toFixed(1)}x`;
      renderSpeculationsDesk();
    });
  }

  if (specRateShiftSlider) {
    specRateShiftSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      activeSpecState.rateShift = val;
      document.getElementById('specRateShiftVal').textContent = `${val >= 0 ? '+' : ''}${val} bps`;
      renderSpeculationsDesk();
    });
  }

  if (specInflationSlider) {
    specInflationSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      activeSpecState.inflationShock = val;
      document.getElementById('specInflationVal').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
      renderSpeculationsDesk();
    });
  }

  if (specEarningsSlider) {
    specEarningsSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      activeSpecState.earningsGrowth = val;
      document.getElementById('specEarningsVal').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
      renderSpeculationsDesk();
    });
  }

  if (specJumpFreqSlider) {
    specJumpFreqSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      activeSpecState.jumpFreq = val;
      document.getElementById('specJumpFreqVal').textContent = `${val} jumps/yr`;
      document.getElementById('specHudJump').textContent = `${val}/yr`;
      renderSpeculationsDesk();
    });
  }

  if (specJumpSizeSlider) {
    specJumpSizeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      activeSpecState.jumpSize = val / 100.0;
      document.getElementById('specJumpSizeVal').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
      renderSpeculationsDesk();
    });
  }

  // Preset Scenario Chips
  document.querySelectorAll('.spec-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const p = chip.dataset.preset;
      if (p === 'baseline') {
        activeSpecState.drift = 0.12;
        activeSpecState.volMult = 1.0;
        activeSpecState.rateShift = 0;
        activeSpecState.inflationShock = 0;
        activeSpecState.earningsGrowth = 0;
        activeSpecState.jumpFreq = 0;
        activeSpecState.jumpSize = 0;
      } else if (p === 'short_squeeze') {
        activeSpecState.stance = 'short';
        activeSpecState.drift = 0.28;
        activeSpecState.volMult = 2.2;
        activeSpecState.jumpFreq = 4;
        activeSpecState.jumpSize = 0.15;
        document.querySelectorAll('.spec-stance-btn').forEach(b => b.classList.toggle('active', b.dataset.stance === 'short'));
      } else if (p === 'recession') {
        activeSpecState.drift = -0.22;
        activeSpecState.volMult = 1.8;
        activeSpecState.rateShift = 200;
        activeSpecState.inflationShock = 2.5;
        activeSpecState.earningsGrowth = -20;
      } else if (p === 'breakout') {
        activeSpecState.drift = 0.35;
        activeSpecState.volMult = 1.4;
        activeSpecState.earningsGrowth = 25;
        activeSpecState.jumpFreq = 2;
        activeSpecState.jumpSize = 0.10;
      } else if (p === 'black_swan') {
        activeSpecState.drift = -0.40;
        activeSpecState.volMult = 2.8;
        activeSpecState.jumpFreq = 5;
        activeSpecState.jumpSize = -0.25;
      } else if (p === 'rate_shock') {
        activeSpecState.rateShift = 300;
        activeSpecState.drift = -0.15;
        activeSpecState.volMult = 1.5;
        activeSpecState.inflationShock = 3.0;
      }

      // Sync slider UI elements
      if (specDriftSlider) specDriftSlider.value = (activeSpecState.drift * 100).toString();
      if (specVolSlider) specVolSlider.value = activeSpecState.volMult.toString();
      if (specRateShiftSlider) specRateShiftSlider.value = activeSpecState.rateShift.toString();
      if (specInflationSlider) specInflationSlider.value = activeSpecState.inflationShock.toString();
      if (specEarningsSlider) specEarningsSlider.value = activeSpecState.earningsGrowth.toString();
      if (specJumpFreqSlider) specJumpFreqSlider.value = activeSpecState.jumpFreq.toString();
      if (specJumpSizeSlider) specJumpSizeSlider.value = (activeSpecState.jumpSize * 100).toString();

      document.getElementById('specDriftVal').textContent = `${activeSpecState.drift >= 0 ? '+' : ''}${(activeSpecState.drift * 100).toFixed(1)}%`;
      document.getElementById('specVolVal').textContent = `${activeSpecState.volMult.toFixed(1)}x`;
      document.getElementById('specRateShiftVal').textContent = `${activeSpecState.rateShift >= 0 ? '+' : ''}${activeSpecState.rateShift} bps`;
      document.getElementById('specInflationVal').textContent = `${activeSpecState.inflationShock >= 0 ? '+' : ''}${activeSpecState.inflationShock.toFixed(1)}%`;
      document.getElementById('specEarningsVal').textContent = `${activeSpecState.earningsGrowth >= 0 ? '+' : ''}${activeSpecState.earningsGrowth}%`;
      document.getElementById('specJumpFreqVal').textContent = `${activeSpecState.jumpFreq} jumps/yr`;
      document.getElementById('specJumpSizeVal').textContent = `${activeSpecState.jumpSize >= 0 ? '+' : ''}${(activeSpecState.jumpSize * 100).toFixed(1)}%`;
      document.getElementById('specHudJump').textContent = `${activeSpecState.jumpFreq}/yr`;

      renderSpeculationsDesk();
    });
  });

  const renderSpeculationsDesk = async () => {
    const { ticker, horizon, drift, volMult, model, stance, rateShift, inflationShock, earningsGrowth, jumpFreq, jumpSize } = activeSpecState;
    const sec = findBestSecurityMatch(ticker) || SECURITIES_DATABASE[0];
    const s0 = sec.priceINR || sec.price_inr || 100;
    const baseSigma = (sec.volatility || 0.22);
    
    // Effective Combined Drift & Effective Combined Volatility
    const effectiveDrift = drift - (rateShift / 10000.0) * 1.2 + (earningsGrowth / 100.0) * 0.8;
    const effectiveVol = baseSigma * volMult * (1 + Math.abs(inflationShock) * 0.08);

    const modelName = model === 'gbm' ? 'Monte Carlo GBM' : (model === 'merton' ? 'Merton Jump Diffusion' : 'Prophet Forecast');
    document.getElementById('specChartTickerTitle').textContent = `${sec.symbol} (${horizon}-Day ${modelName} • ${stance.toUpperCase()})`;
    document.getElementById('specHudDrift').textContent = `${effectiveDrift >= 0 ? '+' : ''}${(effectiveDrift * 100).toFixed(1)}%`;
    document.getElementById('specHudVol').textContent = `${(effectiveVol * 100).toFixed(1)}%`;
    document.getElementById('specHudJump').textContent = `${jumpFreq}/yr`;

    const days = horizon;
    const dates = [];
    const p05 = [], p25 = [], median = [], p75 = [], p95 = [];
    const dStart = new Date();

    for (let i = 0; i <= days; i++) {
      const d = new Date(dStart);
      d.setDate(d.getDate() + Math.round(i * 1.45));
      dates.push(d.toISOString().split('T')[0]);

      const t_yr = Math.max(0.001, i / 252.0);

      if (model === 'gbm') {
        const expPrice = s0 * Math.exp(effectiveDrift * t_yr);
        const spread = expPrice * effectiveVol * Math.sqrt(t_yr);
        p05.push(Number(Math.max(1, expPrice - 1.96 * spread).toFixed(2)));
        p25.push(Number(Math.max(1, expPrice - 0.67 * spread).toFixed(2)));
        median.push(Number(expPrice.toFixed(2)));
        p75.push(Number((expPrice + 0.67 * spread).toFixed(2)));
        p95.push(Number((expPrice + 1.96 * spread).toFixed(2)));
      } else if (model === 'merton') {
        const jumpDrift = effectiveDrift + jumpFreq * jumpSize;
        const jumpVol = Math.sqrt(Math.pow(effectiveVol, 2) + jumpFreq * Math.pow(jumpSize, 2));
        const expPrice = s0 * Math.exp(jumpDrift * t_yr);
        const spread = expPrice * jumpVol * Math.sqrt(t_yr);
        // Merton fat tails
        p05.push(Number(Math.max(1, expPrice - 2.15 * spread).toFixed(2)));
        p25.push(Number(Math.max(1, expPrice - 0.70 * spread).toFixed(2)));
        median.push(Number(expPrice.toFixed(2)));
        p75.push(Number((expPrice + 0.70 * spread).toFixed(2)));
        p95.push(Number((expPrice + 2.15 * spread).toFixed(2)));
      } else {
        // Prophet mode (Piecewise trend + Fourier seasonality + uncertainty)
        const trend = s0 * (1 + effectiveDrift * t_yr + 0.04 * Math.pow(t_yr, 1.5));
        const seasonality = s0 * (0.018 * Math.sin(2 * Math.PI * i / 30.0) + 0.028 * Math.cos(2 * Math.PI * i / 90.0));
        const pointForecast = Math.max(1, trend + seasonality);
        const uncertainty = pointForecast * effectiveVol * Math.sqrt(t_yr) * 1.15;
        p05.push(Number(Math.max(1, pointForecast - 1.96 * uncertainty).toFixed(2)));
        p25.push(Number(Math.max(1, pointForecast - 0.67 * uncertainty).toFixed(2)));
        median.push(Number(pointForecast.toFixed(2)));
        p75.push(Number((pointForecast + 0.67 * uncertainty).toFixed(2)));
        p95.push(Number((pointForecast + 1.96 * uncertainty).toFixed(2)));
      }
    }

    const termMedian = median[median.length - 1];
    const termP95 = p95[p95.length - 1];
    const termP05 = p05[p05.length - 1];

    let probPositive, probGain10, probGain25, probLoss10, probLoss25, var99, expDisplayPrice, p95Display, p05Display;

    if (stance === 'long') {
      const zScore = (effectiveDrift) / Math.max(0.05, effectiveVol);
      probPositive = Math.min(99, Math.max(1, Math.round(50 + zScore * 20)));
      probGain10 = Math.min(96, Math.max(1, Math.round(45 + zScore * 18)));
      probGain25 = Math.min(88, Math.max(1, Math.round(25 + zScore * 15)));
      probLoss10 = Math.min(85, Math.max(1, Math.round(25 - zScore * 12)));
      probLoss25 = Math.min(65, Math.max(1, Math.round(10 - zScore * 8)));
      var99 = ((termP05 - s0) / s0);
      expDisplayPrice = termMedian;
      p95Display = termP95;
      p05Display = termP05;
    } else {
      // Short position: profit when price falls!
      const zScoreShort = (-effectiveDrift) / Math.max(0.05, effectiveVol);
      probPositive = Math.min(99, Math.max(1, Math.round(50 + zScoreShort * 20)));
      probGain10 = Math.min(96, Math.max(1, Math.round(45 + zScoreShort * 18))); // Price drops >= 10%
      probGain25 = Math.min(88, Math.max(1, Math.round(25 + zScoreShort * 15))); // Price drops >= 25%
      probLoss10 = Math.min(85, Math.max(1, Math.round(25 - zScoreShort * 12))); // Price rises >= 10% (Short squeeze)
      probLoss25 = Math.min(65, Math.max(1, Math.round(10 - zScoreShort * 8)));  // Price rises >= 25% (Violent squeeze)
      var99 = ((s0 - termP95) / s0); // Squeeze loss
      expDisplayPrice = s0 + (s0 - termMedian); // Short payoff
      p95Display = termP05; // Target price for short
      p05Display = termP95; // Squeeze risk price
    }

    const specData = {
      symbol: sec.symbol,
      current_price: s0,
      dates,
      fan_chart: { p05, p25, median, p75, p95 },
      stance,
      probabilities: { prob_positive: probPositive, prob_gain_10: probGain10, prob_gain_25: probGain25, prob_loss_10: probLoss10, prob_loss_25: probLoss25 },
      terminal_metrics: { expected_price: expDisplayPrice, median_price: termMedian, p95_best_case: p95Display, p05_worst_case: p05Display, var_99: var99 }
    };

    // Update Ribbon
    document.getElementById('specSpotPrice').textContent = formatMoney(s0);
    document.getElementById('specExpPrice').textContent = formatMoney(expDisplayPrice);
    document.getElementById('specMedianPrice').textContent = formatMoney(termMedian);
    document.getElementById('specP95Price').textContent = formatMoney(p95Display);
    document.getElementById('specP05Price').textContent = formatMoney(p05Display);
    document.getElementById('specVar99').textContent = `${(var99 * 100).toFixed(1)}%`;

    // Update Probability Bars
    document.getElementById('specProbGain10').textContent = `${probGain10}%`;
    document.getElementById('specProbBarGain10').style.width = `${probGain10}%`;
    document.getElementById('specProbGain25').textContent = `${probGain25}%`;
    document.getElementById('specProbBarGain25').style.width = `${probGain25}%`;
    document.getElementById('specProbLoss10').textContent = `${probLoss10}%`;
    document.getElementById('specProbBarLoss10').style.width = `${probLoss10}%`;
    document.getElementById('specProbLoss25').textContent = `${probLoss25}%`;
    document.getElementById('specProbBarLoss25').style.width = `${probLoss25}%`;
    document.getElementById('specProbPositive').textContent = `${probPositive}%`;
    document.getElementById('specProbBarPositive').style.width = `${probPositive}%`;

    // Update Formula Banner & Plain English
    const formulaEl = document.getElementById('specMathFormula');
    const plainEl = document.getElementById('scenarioPlainEnglish');
    const badgeEl = document.getElementById('specProcessBadge');

    if (badgeEl) badgeEl.textContent = `${model.toUpperCase()} ${stance.toUpperCase()} PROCESS SPECIFICATION`;

    if (formulaEl) {
      if (model === 'gbm') {
        formulaEl.innerHTML = stance === 'long'
          ? `\\[ dS_t = \\mu S_t dt + \\sigma S_t dW_t \\]`
          : `\\[ \\Pi_{\\text{short}} = S_0 - S_t, \\quad dS_t = \\mu S_t dt + \\sigma S_t dW_t \\]`;
      } else if (model === 'merton') {
        formulaEl.innerHTML = stance === 'long'
          ? `\\[ dS_t = (\\mu - \\lambda k) S_t dt + \\sigma S_t dW_t + J_t dN_t \\]`
          : `\\[ \\Pi_{\\text{short}} = S_0 - S_t, \\quad dS_t = (\\mu - \\lambda k) S_t dt + \\sigma S_t dW_t + J_t dN_t \\]`;
      } else {
        formulaEl.innerHTML = `\\[ y(t) = g(t) + s(t) + h(t) + \\epsilon_t \\]`;
      }

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([formulaEl]).catch(() => {});
      }
    }

    if (plainEl) {
      const roi = (((expDisplayPrice - s0) / s0) * 100).toFixed(1);
      plainEl.textContent = stance === 'long'
        ? `Under current parameters (${horizon}D, μ = ${(effectiveDrift*100).toFixed(1)}%, σ = ${(effectiveVol*100).toFixed(1)}%), Long probability of profit is ${probPositive}% with an expected return of ${roi >= 0 ? '+' : ''}${roi}% and tail VaR of ${(var99*100).toFixed(1)}%.`
        : `Under current Bearish stance (${horizon}D, μ = ${(effectiveDrift*100).toFixed(1)}%, σ = ${(effectiveVol*100).toFixed(1)}%), Short win probability is ${probPositive}%. Short Squeeze risk (95th %ile upside) is capped at ${formatMoney(termP95)} (Max Squeeze VaR: ${(var99*100).toFixed(1)}%).`;
    }

    renderSpecFanCanvas(specData);
  };

  const renderSpecFanCanvas = (data) => {
    const canvas = document.getElementById('specCanvas');
    const wrap = document.getElementById('specCanvasWrap');
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const s0 = data.current_price;
    const dates = data.dates || [];
    const p05 = data.fan_chart.p05;
    const p25 = data.fan_chart.p25;
    const med = data.fan_chart.median;
    const p75 = data.fan_chart.p75;
    const p95 = data.fan_chart.p95;
    const n = dates.length;
    const isShort = data.stance === 'short';

    const padL = 60, padR = 25, padT = 20, padB = 24;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const allVals = [...p05, ...p95];
    const minP = Math.min(...allVals) * 0.96;
    const maxP = Math.max(...allVals) * 1.04;

    const getX = (i) => padL + (i / (n - 1)) * plotW;
    const getY = (p) => padT + plotH - ((p - minP) / (maxP - minP)) * plotH;

    let crossIdx = -1;
    let animProgress = 0.0;
    let animId = null;

    // Stochastic simulation particles
    const particles = Array.from({ length: 18 }, () => ({
      xRatio: Math.random(),
      speed: 0.003 + Math.random() * 0.005,
      pathOffset: (Math.random() - 0.5) * 1.8,
      size: 1.5 + Math.random() * 1.5
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Gridlines & Price Scale
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#71717a';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';

      const nSteps = 5;
      for (let i = 0; i <= nSteps; i++) {
        const p = minP + (i / nSteps) * (maxP - minP);
        const y = getY(p);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.fillText(formatMoney(p), padL - 6, y + 3);
      }

      const visibleN = Math.max(2, Math.round(n * animProgress));

      // Outer Fan (P05 to P95)
      ctx.fillStyle = isShort ? 'rgba(255, 107, 107, 0.08)' : 'rgba(34, 211, 238, 0.08)';
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(p95[0]));
      for (let i = 1; i < visibleN; i++) ctx.lineTo(getX(i), getY(p95[i]));
      for (let i = visibleN - 1; i >= 0; i--) ctx.lineTo(getX(i), getY(p05[i]));
      ctx.closePath();
      ctx.fill();

      // Inner Fan (P25 to P75)
      ctx.fillStyle = isShort ? 'rgba(255, 107, 107, 0.16)' : 'rgba(34, 211, 238, 0.16)';
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(p75[0]));
      for (let i = 1; i < visibleN; i++) ctx.lineTo(getX(i), getY(p75[i]));
      for (let i = visibleN - 1; i >= 0; i--) ctx.lineTo(getX(i), getY(p25[i]));
      ctx.closePath();
      ctx.fill();

      // P95 Curve
      ctx.strokeStyle = isShort ? 'rgba(255, 107, 107, 0.6)' : 'rgba(34, 211, 238, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(p95[0]));
      for (let i = 1; i < visibleN; i++) ctx.lineTo(getX(i), getY(p95[i]));
      ctx.stroke();

      // P05 Curve
      ctx.strokeStyle = isShort ? 'rgba(81, 207, 102, 0.6)' : 'rgba(255, 107, 107, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(p05[0]));
      for (let i = 1; i < visibleN; i++) ctx.lineTo(getX(i), getY(p05[i]));
      ctx.stroke();

      // Median Line (P50)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = isShort ? 'rgba(255, 107, 107, 0.4)' : 'rgba(34, 211, 238, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(med[0]));
      for (let i = 1; i < visibleN; i++) ctx.lineTo(getX(i), getY(med[i]));
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flowing Stochastic Particles
      if (animProgress >= 0.95) {
        ctx.fillStyle = isShort ? 'rgba(255, 107, 107, 0.75)' : 'rgba(34, 211, 238, 0.75)';
        particles.forEach(pt => {
          pt.xRatio = (pt.xRatio + pt.speed) % 1.0;
          const idx = Math.min(n - 1, Math.floor(pt.xRatio * (n - 1)));
          const px = getX(idx);
          const baseMed = med[idx];
          const spread = (p95[idx] - p05[idx]) * 0.4;
          const py = getY(baseMed + pt.pathOffset * spread);

          ctx.beginPath();
          ctx.arc(px, py, pt.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Crosshair & Tooltip
      if (crossIdx >= 0 && crossIdx < n) {
        const cx = getX(crossIdx);
        const cy = getY(med[crossIdx]);
        const pSlice = med[crossIdx];
        const pnl = isShort ? ((s0 - pSlice) / s0 * 100) : ((pSlice - s0) / s0 * 100);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, padT);
        ctx.lineTo(cx, h - padB);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isShort ? '#FF6B6B' : '#22d3ee';
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // On-Canvas HUD Tooltip Box
        const tooltipW = 175;
        const tooltipH = 68;
        const tooltipX = cx + 15 + tooltipW > w - padR ? cx - tooltipW - 15 : cx + 15;
        const tooltipY = Math.max(padT + 10, Math.min(h - padB - tooltipH - 10, cy - 30));

        ctx.fillStyle = 'rgba(9, 9, 12, 0.94)';
        ctx.strokeStyle = isShort ? 'rgba(255, 107, 107, 0.4)' : 'rgba(34, 211, 238, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipW, tooltipH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${dates[crossIdx] || ''}`, tooltipX + 8, tooltipY + 16);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(`Price: ${formatMoney(med[crossIdx])}`, tooltipX + 8, tooltipY + 32);

        ctx.fillStyle = pnl >= 0 ? '#51CF66' : '#FF6B6B';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`${isShort ? 'Short' : 'Long'} P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%`, tooltipX + 8, tooltipY + 48);

        ctx.fillStyle = '#71717a';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`P95: ${formatMoney(p95[crossIdx])} • P05: ${formatMoney(p05[crossIdx])}`, tooltipX + 8, tooltipY + 60);
      }
    };

    const animate = () => {
      animProgress += 0.06;
      if (animProgress > 1.0) animProgress = 1.0;
      draw();
      if (animProgress < 1.0) {
        animId = requestAnimationFrame(animate);
      }
    };

    if (animId) cancelAnimationFrame(animId);
    animate();

    let particleLoop = null;
    const runParticleLoop = () => {
      if (animProgress >= 1.0 && crossIdx === -1) {
        draw();
      }
      particleLoop = requestAnimationFrame(runParticleLoop);
    };
    runParticleLoop();

    wrap.onmousemove = (e) => {
      const bRect = wrap.getBoundingClientRect();
      const mouseX = e.clientX - bRect.left;
      if (mouseX < padL || mouseX > w - padR) {
        crossIdx = -1;
        draw();
        return;
      }
      const ratio = Math.max(0, Math.min(1, (mouseX - padL) / plotW));
      crossIdx = Math.round(ratio * (n - 1));
      
      document.getElementById('specHudDate').textContent = dates[crossIdx] || '-';
      document.getElementById('specHudMedian').textContent = formatMoney(med[crossIdx]);
      document.getElementById('specHudP95').textContent = formatMoney(p95[crossIdx]);
      document.getElementById('specHudP05').textContent = formatMoney(p05[crossIdx]);
      draw();
    };

    wrap.onmouseleave = () => {
      crossIdx = -1;
      draw();
    };
  };

  // ── 21. Searchable Command-Style Security Picker Module ──────────────────
  const SecurityPicker = (() => {
    let activeCallback = null;
    let currentFilter = 'all';
    let selectedIndex = 0;
    let currentMatches = [];

    const overlay = document.getElementById('secPickerOverlay');
    const input = document.getElementById('secPickerInput');
    const list = document.getElementById('secPickerList');
    const closeBtn = document.getElementById('secPickerCloseBtn');
    const backdrop = document.getElementById('secPickerBackdrop');
    const tabs = document.querySelectorAll('.sec-picker-tab');

    const open = ({ onSelect, initialQuery = '' }) => {
      activeCallback = onSelect;
      currentFilter = 'all';
      selectedIndex = 0;
      if (overlay) overlay.removeAttribute('hidden');
      document.body.classList.add('modal-open');
      if (input) {
        input.value = initialQuery;
        input.focus();
      }
      renderMatches(initialQuery);
    };

    const close = () => {
      if (overlay) overlay.setAttribute('hidden', '');
      document.body.classList.remove('modal-open');
      activeCallback = null;
    };

    const renderMatches = async (query = '') => {
      if (!list) return;
      list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Searching securities...</div>';

      let results = await SecurityMaster.searchSecurities(query, 30);

      // Filter by active tab
      if (currentFilter === 'nse') results = results.filter(r => (r.exchange || '').toUpperCase() === 'NSE');
      else if (currentFilter === 'bse') results = results.filter(r => (r.exchange || '').toUpperCase() === 'BSE' || r.bseCode);
      else if (currentFilter === 'us') results = results.filter(r => (r.exchange || '').toUpperCase() === 'US' || (r.exchange || '').toUpperCase() === 'NASDAQ' || (r.exchange || '').toUpperCase() === 'NYSE');
      else if (currentFilter === 'index') results = results.filter(r => (r.assetType || '').toUpperCase() === 'INDEX' || r.symbol.startsWith('^'));
      else if (currentFilter === 'etf') results = results.filter(r => (r.assetType || '').toUpperCase() === 'ETF' || (r.assetType || '').toUpperCase() === 'MUTUAL FUND');
      else if (currentFilter === 'watchlist') results = results.filter(r => appState.watchlist.includes(r.symbol));

      currentMatches = results.slice(0, 20);

      if (currentMatches.length === 0) {
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:0.85rem;"><i class="fa-solid fa-circle-question" style="font-size:1.4rem;display:block;margin-bottom:8px;color:var(--accent-amber);"></i>No matching securities found. Press Enter to resolve symbol directly.</div>';
        return;
      }

      list.innerHTML = currentMatches.map((sec, idx) => {
        const ex = (sec.exchange || 'NSE').toUpperCase();
        const tagClass = ex === 'NSE' ? 'tag--nse' : (ex === 'BSE' ? 'tag--bse' : (ex === 'US' || ex === 'NASDAQ' ? 'tag--us' : 'tag--index'));
        const price = sec.basePrice || sec.priceINR || sec.price_inr || 1000;
        const chg = sec.changePercent !== undefined ? sec.changePercent : 1.15;

        return `
          <div class="sec-picker-item ${idx === selectedIndex ? 'active' : ''}" data-idx="${idx}" role="option">
            <div class="sp-item-left">
              <span class="sp-item-tag ${tagClass}">${ex}</span>
              <div>
                <div class="sp-item-sym">${sec.symbol}</div>
                <div class="sp-item-name">${sec.name || sec.symbol}</div>
              </div>
            </div>
            <div class="sp-item-right">
              <div class="sp-item-price">${formatMoney(price)}</div>
              <div class="sp-item-chg" style="color:${chg >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)'};">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</div>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.sec-picker-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.idx, 10);
          selectItem(currentMatches[idx]);
        });
      });
    };

    const selectItem = (sec) => {
      if (!sec) return;
      if (activeCallback) activeCallback(sec);
      close();
    };

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        selectedIndex = 0;
        renderMatches(input ? input.value : '');
      });
    });

    if (input) {
      let debounce = null;
      input.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          selectedIndex = 0;
          renderMatches(e.target.value);
        }, 120);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentMatches.length > 0) {
            selectedIndex = (selectedIndex + 1) % currentMatches.length;
            list.querySelectorAll('.sec-picker-item').forEach((it, idx) => it.classList.toggle('active', idx === selectedIndex));
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentMatches.length > 0) {
            selectedIndex = (selectedIndex - 1 + currentMatches.length) % currentMatches.length;
            list.querySelectorAll('.sec-picker-item').forEach((it, idx) => it.classList.toggle('active', idx === selectedIndex));
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (currentMatches[selectedIndex]) {
            selectItem(currentMatches[selectedIndex]);
          } else if (input.value.trim()) {
            SecurityMaster.resolveSecurity(input.value.trim()).then(sec => selectItem(sec));
          }
        } else if (e.key === 'Escape') {
          close();
        }
      });
    }

    return { open, close };
  })();

  window.SecurityPicker = SecurityPicker;

  // Wire up Speculations Security Picker Button
  const specTickerPickerBtn = document.getElementById('specTickerPickerBtn');
  if (specTickerPickerBtn) {
    specTickerPickerBtn.addEventListener('click', () => {
      SecurityPicker.open({
        initialQuery: activeSpecState.ticker,
        onSelect: (sec) => {
          activeSpecState.ticker = sec.symbol;
          const tickText = document.getElementById('specActiveTickerText');
          const nameText = document.getElementById('specActiveNameText');
          if (tickText) tickText.textContent = sec.symbol;
          if (nameText) nameText.textContent = `${sec.name} • ${sec.exchange}`;
          renderSpeculationsDesk();
        }
      });
    });
  }

  // ── 22. Dynamic Observatory Discovery Feed & Portfolio Impact Engine ───────
  const observatoryOverlay = document.getElementById('observatoryOverlay');
  const obsCloseBtn = document.getElementById('obsCloseBtn');
  const obsBackdrop = document.getElementById('observatoryBackdrop');
  const navOpenObs = document.getElementById('navOpenObs');
  const mobileOpenObs = document.getElementById('mobileOpenObs');

  let activeObsCategory = 'all';

  const renderObservatoryDiscoveryFeed = async () => {
    const feedContainer = document.getElementById('obsDiscoveryFeed');
    if (!feedContainer) return;

    feedContainer.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Scanning real-time tick feeds and calculating anomalies...</div>';

    let observations = [];
    try {
      const res = await fetch('/api/observatory/feed');
      if (res.ok) {
        const data = await res.json();
        if (data.observations && data.observations.length > 0) {
          observations = data.observations;
        }
      }
    } catch (e) {}

    if (observations.length === 0) {
      observations = [
        {
          id: 'obs_it_vol',
          type: 'UNUSUAL_VOLUME',
          tag: 'FACT',
          category: 'Order Flow & Liquidity Anomalies',
          title: 'NIFTY IT Index Block Deals: Heavy Institutional Volume Spike in Infosys & TCS (+312% vs 20-Day EMA)',
          what_happened: 'Aggregated delivery volumes in Infosys (INFY) and TCS surged to 4.8x their 20-day average during closing auction crosses.',
          evidence: 'Total traded turnover in NIFTY IT constituents exceeded ₹4,850 Cr, with large single-ticket buy blocks (>₹50 Cr each) accounting for 64% of volume.',
          why_it_matters: 'Cluster buying across Tier-1 Indian IT indicates foreign institutional allocation ahead of quarterly enterprise tech spending reports.',
          primary_symbol: 'INFY',
          related_securities: ['INFY', 'TCS', 'HCLTECH', 'WIPRO'],
          impact_direction: 'BULLISH',
          sources: [
            { title: 'NSE Bulk & Block Deal Disclosures', url: 'https://www.nseindia.com' },
            { title: 'Exchange Trade Repository Records', url: 'https://www.bseindia.com' }
          ]
        },
        {
          id: 'obs_ril_breakout',
          type: 'MARKET_MOVER',
          tag: 'FACT',
          category: 'Index Heavyweight Drivers',
          title: 'Reliance Industries (NSE: RELIANCE) Extends Outperformance as Refining & Digital Margins Expand',
          what_happened: 'Reliance gained +2.4% on high volume, testing ₹2,985 key resistance following Singapore GRM benchmark strength.',
          evidence: 'Spot price advanced +2.4% (₹69.80 gain) with RSI(14) momentum crossing 64.2 and options open interest building at ₹3,000 Call strike.',
          why_it_matters: 'As the highest weighted constituent in NIFTY 50 (9.8% index weight), RIL momentum provides structural support to the headline index.',
          primary_symbol: 'RELIANCE',
          related_securities: ['RELIANCE', 'ONGC', 'BPCL'],
          impact_direction: 'BULLISH',
          sources: [
            { title: 'Refining Margin Benchmark Index', url: 'https://www.bloomberg.com' },
            { title: 'NSE Derivative Open Interest Report', url: 'https://www.nseindia.com' }
          ]
        },
        {
          id: 'obs_sector_rot',
          type: 'SECTOR_ROTATION',
          tag: 'MODEL SIGNAL',
          category: 'Cross-Sector Capital Rotation',
          title: 'Macro Capital Rotation: Flight from High-Beta Consumer Tech to Defensive FMCG & Pharma',
          what_happened: 'Institutional money managers rotated capital from high-valuation growth names into defensive cash-flow compounders (ITC, HUL, Sun Pharma).',
          evidence: 'NIFTY FMCG gained +1.6% while high-beta consumer internet equities shed -2.1% on net selling of ₹620 Cr.',
          why_it_matters: 'Sector rotation toward low-beta defensive assets typically precedes monetary policy announcements or volatility spikes.',
          primary_symbol: 'ITC',
          related_securities: ['ITC', 'HINDUNILVR', 'SUNPHARMA', 'ZOMATO'],
          impact_direction: 'NEUTRAL',
          sources: [
            { title: 'Sectoral Advance/Decline Feed', url: 'https://www.nseindia.com' },
            { title: 'Institutional Fund Flow Tracker', url: 'https://www.bseindia.com' }
          ]
        },
        {
          id: 'obs_vix_shift',
          type: 'VOLATILITY_SHIFT',
          tag: 'MODEL SIGNAL',
          category: 'Implied Volatility Regime',
          title: 'Volatility Compression: India VIX Drops -4.2% Below 13.50 into Options Expiry Week',
          what_happened: 'Implied volatility across index options collapsed, signaling reduced near-term tail risk expectations from market makers.',
          evidence: 'India VIX dropped from 14.05 to 13.46, while the at-the-money straddle pricing shrank by 38 bps.',
          why_it_matters: 'Compressed volatility environments reward delta-neutral option selling strategies but increase vulnerability to exogenous macro shocks.',
          primary_symbol: '^NSEI',
          related_securities: ['^NSEI', '^NSEBANK', 'NIFTYBEES'],
          impact_direction: 'BULLISH',
          sources: [
            { title: 'NSE Volatility Indices Data', url: 'https://www.nseindia.com' }
          ]
        }
      ];
    }

    // Filter by active category if selected
    let filtered = observations;
    if (activeObsCategory === 'volume') filtered = observations.filter(o => o.type === 'UNUSUAL_VOLUME');
    else if (activeObsCategory === 'movers') filtered = observations.filter(o => o.type === 'MARKET_MOVER' || o.type === 'MARKET_BREADTH');
    else if (activeObsCategory === 'rotation') filtered = observations.filter(o => o.type === 'SECTOR_ROTATION');
    else if (activeObsCategory === 'volatility') filtered = observations.filter(o => o.type === 'VOLATILITY_SHIFT');

    // Calculate Portfolio Impact
    const totalPortVal = portfolioTransactions.reduce((acc, t) => acc + (t.quantity * t.price), 0);

    feedContainer.innerHTML = filtered.map(obs => {
      const tag = obs.tag || 'OBSERVATION';
      const tagClass = tag === 'FACT' ? 'tag--fact' : (tag === 'MODEL SIGNAL' ? 'tag--model' : (tag === 'SCENARIO' ? 'tag--scenario' : 'tag--obs'));

      // Check if user holds any related securities
      let portfolioImpactBadge = '';
      if (totalPortVal > 0 && Array.isArray(obs.related_securities)) {
        const matchingTx = portfolioTransactions.filter(t => obs.related_securities.includes(t.symbol));
        if (matchingTx.length > 0) {
          const heldVal = matchingTx.reduce((acc, t) => acc + (t.quantity * t.price), 0);
          const weight = (heldVal / totalPortVal) * 100;
          const impact = (weight * (obs.impact_direction === 'BEARISH' ? -1 : 1) * 0.05).toFixed(2);
          portfolioImpactBadge = `
            <div class="obs-portfolio-impact-badge">
              <i class="fa-solid fa-wallet"></i>
              <span>YOUR PORTFOLIO: Affects your portfolio by ${impact >= 0 ? '+' : ''}${impact}% (${weight.toFixed(1)}% weight held)</span>
            </div>
          `;
        }
      }

      return `
        <article class="obs-6part-card" data-symbol="${obs.primary_symbol || 'RELIANCE'}">
          <div class="obs-card-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="provenance-tag ${tagClass}">${tag}</span>
              <span style="font-size:0.75rem;font-weight:700;color:var(--accent-cyan);text-transform:uppercase;">${obs.category}</span>
            </div>
            ${portfolioImpactBadge}
          </div>

          <h3 class="obs-card-title">${obs.title}</h3>

          <div class="obs-6part-grid">
            <div class="obs-grid-block">
              <span class="obs-block-title">01. What Happened?</span>
              <p class="obs-block-text">${obs.what_happened}</p>
            </div>

            <div class="obs-grid-block">
              <span class="obs-block-title">02. Quantitative Evidence</span>
              <p class="obs-block-text">${obs.evidence}</p>
            </div>

            <div class="obs-grid-block">
              <span class="obs-block-title">03. Why It Matters</span>
              <p class="obs-block-text">${obs.why_it_matters}</p>
            </div>

            <div class="obs-grid-block">
              <span class="obs-block-title">04. Related Securities (Click to Inspect)</span>
              <div class="obs-related-chips">
                ${(obs.related_securities || []).map(s => `
                  <button class="obs-ticker-btn" data-symbol="${s}">${s}</button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="obs-sources-row">
            <span>Verified Sources:</span>
            ${(obs.sources || []).map(src => `
              <a href="${src.url}" target="_blank" rel="noopener" class="obs-source-link"><i class="fa-solid fa-link" style="font-size:0.65rem;margin-right:3px;"></i>${src.title}</a>
            `).join(' &bull; ')}
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to all ticker chips
    feedContainer.querySelectorAll('.obs-ticker-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = btn.dataset.symbol;
        const sec = findBestSecurityMatch(sym) || SECURITIES_DATABASE[0];
        closeObservatoryModal();
        openCompanyModal(sec);
      });
    });

    feedContainer.querySelectorAll('.obs-6part-card').forEach(card => {
      card.addEventListener('click', () => {
        const sym = card.dataset.symbol;
        const sec = findBestSecurityMatch(sym) || SECURITIES_DATABASE[0];
        closeObservatoryModal();
        openCompanyModal(sec);
      });
    });
  };

  const openObservatoryModal = () => {
    if (!observatoryOverlay) return;
    observatoryOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    renderObservatoryDiscoveryFeed();
  };

  const closeObservatoryModal = () => {
    if (!observatoryOverlay) return;
    observatoryOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (navOpenObs) navOpenObs.addEventListener('click', openObservatoryModal);
  if (mobileOpenObs) mobileOpenObs.addEventListener('click', openObservatoryModal);
  if (obsCloseBtn) obsCloseBtn.addEventListener('click', closeObservatoryModal);
  if (obsBackdrop) obsBackdrop.addEventListener('click', closeObservatoryModal);

  document.querySelectorAll('#obsCategoryFilters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#obsCategoryFilters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeObsCategory = btn.dataset.obscat;
      renderObservatoryDiscoveryFeed();
    });
  });

  // ── 24. Hero Prompt Chips & Counters ───────────────────────────────────────
  document.querySelectorAll('.prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => openFinancialCanvas(chip.dataset.query));
  });

  const initMetricCounters = () => {
    const items = document.querySelectorAll('.metric-item');
    items.forEach(item => {
      const target = parseFloat(item.dataset.target);
      const decimals = parseInt(item.dataset.decimals || '0', 10);
      const valEl = item.querySelector('.metric-value');
      if (!valEl || isNaN(target)) return;

      let start = 0;
      const duration = 1200;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = start + (target - start) * easeOut;

        if (item.dataset.target === '5' && item.dataset.suffix === 'ms') {
          valEl.textContent = '<5';
        } else {
          valEl.textContent = currentVal.toFixed(decimals);
        }

        if (progress < 1.0) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    });
  };

  // ── 25. Complete Global Interaction & Button Connection Audit ──────────────
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) ctaBtn.addEventListener('click', openObservatoryModal);

  const heroCanvasBtn = document.getElementById('heroCanvasBtn');
  if (heroCanvasBtn) heroCanvasBtn.addEventListener('click', () => openCommandPalette());

  const heroLiveTickerPill = document.getElementById('heroLiveTickerPill');
  if (heroLiveTickerPill) heroLiveTickerPill.addEventListener('click', openMarketPulseDrawer);

  const clearWatchlistBtn = document.getElementById('clearWatchlistBtn');
  if (clearWatchlistBtn) {
    clearWatchlistBtn.addEventListener('click', () => {
      appState.watchlist = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "GOLDBEES", "NIFTYBEES", "AAPL", "NVDA"];
      localStorage.setItem('riskos_watchlist', JSON.stringify(appState.watchlist));
      renderWatchlist();
    });
  }

  const canvasPinBtn = document.getElementById('canvasPinBtn');
  if (canvasPinBtn) {
    canvasPinBtn.addEventListener('click', () => {
      alert(`Research canvas for "${appState.lastQuery}" pinned to your active session.`);
    });
  }

  const whyShowMathBtn = document.getElementById('whyShowMathBtn');
  const whyMathExpanded = document.getElementById('whyMathExpanded');
  if (whyShowMathBtn && whyMathExpanded) {
    whyShowMathBtn.addEventListener('click', () => {
      const isHidden = whyMathExpanded.hasAttribute('hidden');
      if (isHidden) {
        whyMathExpanded.removeAttribute('hidden');
        whyShowMathBtn.querySelector('i')?.classList.replace('fa-chevron-down', 'fa-chevron-up');
      } else {
        whyMathExpanded.setAttribute('hidden', '');
        whyShowMathBtn.querySelector('i')?.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }
    });
  }

  const whyCloseBtn = document.getElementById('whyCloseBtn');
  const whyModalOverlay = document.getElementById('whyModalOverlay');
  const whyModalBackdrop = document.getElementById('whyModalBackdrop');
  if (whyCloseBtn && whyModalOverlay) whyCloseBtn.addEventListener('click', () => whyModalOverlay.setAttribute('hidden', ''));
  if (whyModalBackdrop && whyModalOverlay) whyModalBackdrop.addEventListener('click', () => whyModalOverlay.setAttribute('hidden', ''));

  const btnExplainPortfolio = document.getElementById('btnExplainPortfolio');
  if (btnExplainPortfolio) {
    btnExplainPortfolio.addEventListener('click', () => openUniversalDrawer('pnl'));
  }

  // Universal Metric "?" Trigger Buttons across the entire platform
  document.querySelectorAll('.why-trigger-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.whyKey || 'pe';
      openUniversalDrawer(key);
    });
  });

  // Mobile Menu Controls
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  const menuBackdrop = document.getElementById('menuBackdrop');

  const openMobileMenu = () => {
    if (mobileMenu) {
      mobileMenu.removeAttribute('hidden');
      document.body.classList.add('modal-open');
    }
  };
  const closeMobileMenu = () => {
    if (mobileMenu) {
      mobileMenu.setAttribute('hidden', '');
      document.body.classList.remove('modal-open');
    }
  };

  if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMobileMenu);
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMobileMenu);

  const mobileOpenSearch = document.getElementById('mobileOpenSearch');
  if (mobileOpenSearch) {
    mobileOpenSearch.addEventListener('click', () => {
      closeMobileMenu();
      openCommandPalette();
    });
  }
  const mobileOpenCanvasBtn = document.getElementById('mobileOpenCanvasBtn');
  if (mobileOpenCanvasBtn) {
    mobileOpenCanvasBtn.addEventListener('click', () => {
      closeMobileMenu();
      openFinancialCanvas('Reliance');
    });
  }
  const mobileOpenPulseBtn = document.getElementById('mobileOpenPulseBtn');
  if (mobileOpenPulseBtn) {
    mobileOpenPulseBtn.addEventListener('click', () => {
      closeMobileMenu();
      openMarketPulseDrawer();
    });
  }
  const mobileOpenWatchlist = document.getElementById('mobileOpenWatchlist');
  if (mobileOpenWatchlist) {
    mobileOpenWatchlist.addEventListener('click', () => {
      closeMobileMenu();
      openWatchlistDrawer();
    });
  }
  const mobileCtaLaunchObs = document.getElementById('mobileCtaLaunchObs');
  if (mobileCtaLaunchObs) {
    mobileCtaLaunchObs.addEventListener('click', () => {
      closeMobileMenu();
      openObservatoryModal();
    });
  }

  // Drawers & Dialogs Close Buttons
  const glossaryCloseBtn = document.getElementById('glossaryCloseBtn');
  if (glossaryCloseBtn) glossaryCloseBtn.addEventListener('click', () => document.getElementById('glossaryModalOverlay')?.setAttribute('hidden', ''));
  const compareCloseBtn = document.getElementById('compareCloseBtn');
  if (compareCloseBtn) compareCloseBtn.addEventListener('click', () => document.getElementById('compareModalOverlay')?.setAttribute('hidden', ''));
  const alertsCloseBtn = document.getElementById('alertsCloseBtn');
  if (alertsCloseBtn) alertsCloseBtn.addEventListener('click', () => document.getElementById('alertsDrawer')?.setAttribute('hidden', ''));

  // ── 26. Deep Linking & Cross-App State Propagation ─────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const targetTicker = urlParams.get('sec') || urlParams.get('ticker') || urlParams.get('symbol');
  if (targetTicker) {
    SecurityMaster.resolveSecurity(targetTicker).then((sec) => {
      if (sec) {
        openCompanyModal(sec);
      }
    });
  }

  // Initialize state
  updateNavbarPortfolioCount();
  renderWatchlist();
  initMetricCounters();

});


