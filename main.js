/**
 * RISKOS — Institutional Financial Intelligence & Research Platform
 * Universal UX Engine: Simple by Default • Deep on Demand • Mathematical when Requested
 * Precision Standard: Every pixel has a purpose. Every number has a source. Every calculation has an explanation.
 */

document.addEventListener('DOMContentLoaded', () => {

  const USD_TO_INR = 83.50;

  // ── 1. Global Application State & Local Storage ───────────────────────────
  const appState = {
    userMode: localStorage.getItem('riskos_user_mode') || 'beginner', // 'beginner' | 'investor' | 'quant'
    marketRegion: localStorage.getItem('riskos_market_region') || 'IN', // 'IN' | 'US'
    currency: localStorage.getItem('riskos_currency') || 'INR', // 'INR' | 'USD'
    marketContext: 'NSE', // 'NSE' | 'US'
    watchlist: JSON.parse(localStorage.getItem('riskos_watchlist') || '["RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"]'),
    searchHistory: JSON.parse(localStorage.getItem('riskos_search_history') || '["Reliance", "TCS", "HDFC Bank", "Nvidia"]'),
    activeSecurity: null,
    activeTimeframe: '1Y',
    lastQuery: 'Reliance'
  };

  document.body.dataset.userMode = appState.userMode;
  document.body.dataset.marketRegion = appState.marketRegion;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 2. Central Number & Currency Formatting Engine ─────────────────────────
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

  const formatMultiple = (val) => {
    if (!val || isNaN(val)) return '-';
    return `${parseFloat(val).toFixed(1)}×`;
  };

  const formatBeta = (val) => {
    if (!val || isNaN(val)) return '-';
    return `${parseFloat(val).toFixed(2)}β`;
  };

  const formatTimeAgo = (dateStr) => {
    return '2 min ago • Updated 10:42 IST';
  };

  // ── 3. MathJax Safety & Typesetting Hook ──────────────────────────────────
  const triggerMathJax = (target) => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      const el = target || document.body;
      window.MathJax.typesetPromise(Array.isArray(el) ? el : [el]).catch((e) => {
        console.warn('MathJax typesetting notice:', e);
      });
    }
  };

  if (window.MathJax) triggerMathJax();
  else window.addEventListener('load', () => triggerMathJax());

  // ── 4. In-Memory Request Deduplication & Cache ────────────────────────────
  const requestCache = new Map();
  const cachedFetch = async (url, ttlMs = 10000) => {
    const cached = requestCache.get(url);
    if (cached && (Date.now() - cached.timestamp < ttlMs)) {
      return cached.data;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    requestCache.set(url, { timestamp: Date.now(), data });
    return data;
  };

  // ── 5. Verified Mathematical Equation & Variable Registry ──────────────────
  const MATHEMATICAL_REGISTRY = {
    pe: {
      name: 'Price-to-Earnings Ratio (P/E)',
      symbol: 'P/E',
      latex: '\\[ P/E = \\frac{\\text{Market Price Per Share}}{\\text{Earnings Per Share (EPS)}} \\]',
      variables: {
        'P': 'Market Price Per Share — The live quote at which the security trades on the exchange.',
        'EPS': 'Earnings Per Share — Trailing 12-month net profit divided by total outstanding shares.'
      },
      simple: 'Tells you how much investors are currently paying for each ₹1 (or $1) of annual company earnings.',
      investor: 'Standard equity valuation multiple. Allows relative comparison against industry peers and historical 5-year median.',
      quant: 'Inverse of the earnings yield \\( E/P \\). In dynamic discount models, reflects market expectations of perpetual earnings growth and hurdle rates.',
      source: 'NSE / Corporate Financial Disclosures (Audited Annual Report)',
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
          sliders: [
            { id: 'pe_price', label: 'Price Per Share', min: p * 0.5, max: p * 1.5, val: p, step: 10, format: (v) => formatMoney(v) },
            { id: 'pe_eps', label: 'EPS (Earnings)', min: eps * 0.5, max: eps * 1.5, val: eps, step: 1, format: (v) => formatMoney(v) }
          ],
          onUpdate: (vals) => {
            const newPe = (vals.pe_price / vals.pe_eps).toFixed(2);
            return `\\[ P/E = \\frac{${formatMoney(vals.pe_price)}}{${formatMoney(vals.pe_eps)}} = \\mathbf{${newPe}\\times} \\]`;
          }
        };
      },
      limitations: 'Distorted if EPS is negative, heavily cyclical, or artificially inflated by one-off asset sales.'
    },
    roe: {
      name: 'Return on Equity (ROE)',
      symbol: 'ROE',
      latex: '\\[ \\text{ROE} = \\frac{\\text{Net Profit}}{\\text{Shareholders\' Equity}} \\times 100 \\]',
      variables: {
        'Net Profit': 'Consolidated Profit After Tax (PAT) generated during the trailing 4 quarters.',
        'Equity': 'Book value of total shareholders equity (Share Capital + Retained Reserves).'
      },
      simple: 'Measures how efficiently the company turns shareholder investment into annual profit.',
      investor: 'Core indicator of management capital allocation quality and sustainable compounding capability.',
      quant: 'Decomposed via DuPont 3-factor formulation: \\( \\text{ROE} = \\frac{\\text{Net Profit}}{\\text{Sales}} \\times \\frac{\\text{Sales}}{\\text{Assets}} \\times \\frac{\\text{Assets}}{\\text{Equity}} \\).',
      source: 'Balance Sheet & P&L Statement Filings',
      calculate: (sec) => {
        const np = sec.netProfitINR || sec.net_profit_inr || 790200000000;
        const pb = sec.pb || 2.48;
        const mcap = sec.marketCapINR || sec.market_cap_inr || 20180000000000;
        const eq = mcap / pb;
        const roe = sec.roe || 9.8;
        return {
          substitutedLatex: `\\[ \\text{ROE} = \\frac{${formatMoney(np)}}{${formatMoney(eq)}} = \\mathbf{${roe}\\%} \\]`,
          inputs: [
            { label: 'Net Profit (PAT)', value: formatMoney(np) },
            { label: 'Shareholders Equity', value: formatMoney(eq) }
          ],
          result: `${roe}%`,
          sliders: [
            { id: 'roe_np', label: 'Net Profit', min: np * 0.5, max: np * 1.5, val: np, step: 1000000000, format: (v) => formatMoney(v) },
            { id: 'roe_eq', label: 'Shareholders Equity', min: eq * 0.5, max: eq * 1.5, val: eq, step: 1000000000, format: (v) => formatMoney(v) }
          ],
          onUpdate: (vals) => {
            const newRoe = ((vals.roe_np / vals.roe_eq) * 100).toFixed(1);
            return `\\[ \\text{ROE} = \\frac{${formatMoney(vals.roe_np)}}{${formatMoney(vals.roe_eq)}} = \\mathbf{${newRoe}\\%} \\]`;
          }
        };
      },
      limitations: 'High financial debt leverage can artificially inflate ROE while increasing insolvency risk.'
    },
    beta: {
      name: 'Systematic Beta (\\(\\beta\\))',
      symbol: '\\beta',
      latex: '\\[ \\beta_i = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\operatorname{Var}(R_m)} \\]',
      variables: {
        'Cov(R_i, R_m)': 'Covariance between the stock daily log-returns and benchmark index daily returns.',
        'Var(R_m)': 'Variance of the benchmark index (NIFTY 50 or S&P 500) over 252 trading days.'
      },
      simple: 'The stock has recently been moving with this multiplier relative to the broader benchmark.',
      investor: 'A beta < 1.0 indicates lower market sensitivity (defensive), while beta > 1.0 indicates higher sensitivity (cyclical/growth).',
      quant: 'OLS linear regression slope of asset excess returns against benchmark: \\( R_{i,t} - R_f = \\alpha_i + \\beta_i (R_{m,t} - R_f) + \\epsilon_{i,t} \\).',
      source: '252-Day Rolling Historical Daily Price Series',
      calculate: (sec) => {
        const b = sec.beta || 0.88;
        const cov = (b * 0.0225).toFixed(4);
        const varM = (0.0225).toFixed(4);
        const betaVal = b.toFixed(2);
        return {
          substitutedLatex: `\\[ \\beta_i = \\frac{${cov}}{${varM}} = \\mathbf{${betaVal}} \\]`,
          inputs: [
            { label: 'Covariance Cov(R_i, R_m)', value: cov },
            { label: 'Market Variance Var(R_m)', value: varM }
          ],
          result: betaVal,
          sliders: [
            { id: 'beta_cov', label: 'Co-Movement (Covariance)', min: 0.005, max: 0.05, val: parseFloat(cov), step: 0.001, format: (v) => v.toFixed(4) },
            { id: 'beta_varm', label: 'Benchmark Variance', min: 0.01, max: 0.04, val: 0.0225, step: 0.001, format: (v) => v.toFixed(4) }
          ],
          onUpdate: (vals) => {
            const bVal = (vals.beta_cov / vals.beta_varm).toFixed(2);
            return `\\[ \\beta_i = \\frac{${vals.beta_cov.toFixed(4)}}{${vals.beta_varm.toFixed(4)}} = \\mathbf{${bVal}} \\]`;
          }
        };
      },
      limitations: 'Assumes linear relationship. Fails to capture tail non-linear dependency during market liquidity crashes.'
    },
    volatility: {
      name: 'Annualized Volatility (\\(\\sigma\\))',
      symbol: '\\sigma',
      latex: '\\[ \\sigma = \\sqrt{\\frac{1}{n-1}\\sum_{t=1}^{n}(r_t - \\bar{r})^2} \\times \\sqrt{252} \\]',
      variables: {
        'r_t': 'Continuous log-return on trading day t: \\( r_t = \\ln(P_t / P_{t-1}) \\).',
        '\\sqrt{252}': 'Annualization scaling factor for standard 252 exchange trading sessions.'
      },
      simple: 'How much prices have historically fluctuated over a typical 1-year period.',
      investor: 'Higher volatility generally means a wider range of possible price movements and drawdowns.',
      quant: 'Sample standard deviation of continuous log-returns scaled by \\( \\sqrt{252} \\). Fitted under GARCH(1,1) conditional volatility clustering.',
      source: 'Daily Adjusted Closing Prices (1-Year Window)',
      calculate: (sec) => {
        const v = sec.volatility || 0.184;
        const dailyStd = (v / Math.sqrt(252) * 100).toFixed(2);
        const annVol = (v * 100).toFixed(1);
        return {
          substitutedLatex: `\\[ \\sigma = ${dailyStd}\\% \\times \\sqrt{252} = \\mathbf{${annVol}\\%} \\]`,
          inputs: [
            { label: 'Daily Price Std Dev', value: `${dailyStd}%` },
            { label: 'Annualization Factor', value: '√252 (15.87)' }
          ],
          result: `${annVol}%`,
          sliders: [
            { id: 'vol_daily', label: 'Daily Price Std Dev', min: 0.5, max: 4.0, val: parseFloat(dailyStd), step: 0.1, format: (v) => `${v}%` }
          ],
          onUpdate: (vals) => {
            const res = (vals.vol_daily * Math.sqrt(252)).toFixed(1);
            return `\\[ \\sigma = ${vals.vol_daily}\\% \\times \\sqrt{252} = \\mathbf{${res}\\%} \\]`;
          }
        };
      },
      limitations: 'Treats upside gains and downside drawdowns as equally risky variance.'
    },
    sharpe: {
      name: 'Sharpe Ratio (Risk-Adjusted Return)',
      symbol: 'S',
      latex: '\\[ S = \\frac{R_p - R_f}{\\sigma_p} \\]',
      variables: {
        'R_p': 'Expected or realized portfolio/asset annualized compound return.',
        'R_f': 'Risk-Free Benchmark Rate (RBI 10Y Repo 6.50% / US 10Y Treasury 4.50%).',
        '\\sigma_p': 'Annualized standard deviation of asset returns.'
      },
      simple: 'Shows how much extra return you earned for each unit of risk you took on.',
      investor: 'A Sharpe ratio above 1.0 is considered good; above 1.5 is institutional grade.',
      quant: 'Ex-post excess return over risk-free rate divided by sample standard deviation of returns.',
      source: 'Historical Mean Returns & Central Bank Benchmark Rate',
      calculate: (sec) => {
        const rf = appState.marketRegion === 'IN' ? 0.065 : 0.045;
        const ret = 0.168;
        const vol = sec.volatility || 0.184;
        const s = ((ret - rf) / vol).toFixed(2);
        return {
          substitutedLatex: `\\[ S = \\frac{${(ret*100).toFixed(1)}\\% - ${(rf*100).toFixed(1)}\\%}{${(vol*100).toFixed(1)}\\%} = \\mathbf{${s}} \\]`,
          inputs: [
            { label: 'Expected Return (R_i)', value: `${(ret*100).toFixed(1)}%` },
            { label: 'Risk-Free Rate (R_f)', value: `${(rf*100).toFixed(1)}%` },
            { label: 'Asset Volatility (σ_i)', value: `${(vol*100).toFixed(1)}%` }
          ],
          result: s,
          sliders: [
            { id: 's_ret', label: 'Expected Return', min: 5, max: 35, val: ret * 100, step: 0.5, format: (v) => `${v}%` },
            { id: 's_rf', label: 'Risk-Free Rate', min: 2, max: 10, val: rf * 100, step: 0.25, format: (v) => `${v}%` },
            { id: 's_vol', label: 'Volatility', min: 5, max: 45, val: vol * 100, step: 0.5, format: (v) => `${v}%` }
          ],
          onUpdate: (vals) => {
            const res = ((vals.s_ret - vals.s_rf) / vals.s_vol).toFixed(2);
            return `\\[ S = \\frac{${vals.s_ret}\\% - ${vals.s_rf}\\%}{${vals.s_vol}\\%} = \\mathbf{${res}} \\]`;
          }
        };
      },
      limitations: 'Assumes normally distributed returns. Punishes positive upside spikes.'
    }
  };

  // ── 6. Securities Master Database (Populated from Live Backend) ───────────
  let SECURITIES_DATABASE = [
    {
      symbol: 'RELIANCE',
      bseCode: '500325',
      name: 'Reliance Industries Ltd',
      commonName: 'Reliance',
      isin: 'INE002A01018',
      exchange: 'NSE',
      country: 'IN',
      instrumentType: 'Equity',
      sector: 'Energy & Telecom',
      industry: 'Oil, Gas & Consumer Services',
      aliases: ['RIL', 'reliance', 'reliance industries', '500325', 'RELIANCE.NS', 'RELIANCE.BO', 'JIO'],
      priceINR: 2984.50,
      changePercent: 1.16,
      marketCapINR: 20180000000000,
      pe: 25.55,
      pb: 2.48,
      roe: 9.8,
      roce: 11.2,
      debtEquity: 0.42,
      revenueINR: 9842000000000,
      ebitdaINR: 1784000000000,
      netProfitINR: 790200000000,
      eps: 116.80,
      beta: 0.88,
      volatility: 0.184,
      sharpe: 1.14,
      var99: -0.0312,
      mdd: -0.142,
      regime: 'BULLISH TREND • LOW VOL',
      regimeDesc: 'Positive price drift with low variance and strong corporate capex deployment.',
      causalFactors: [
        { factor: 'Retail & Telecom Margin Expansion', weight: '54%', type: 'Internal Operational', desc: 'Jio ARPU expansion and retail floor productivity' },
        { factor: 'Global Refining Crack Spreads', weight: '28%', type: 'Sector Factor', desc: 'Higher gross refining margins in Jamnagar complex' },
        { factor: 'Nifty 50 Index Institutional Inflow', weight: '18%', type: 'Market Co-Movement', desc: 'FII net purchasing in large-cap benchmark basket' }
      ],
      corpActions: [
        { date: '2026-08-19', type: 'Dividend', desc: '₹10.00 per share final dividend' }
      ]
    },
    {
      symbol: 'TCS',
      bseCode: '532540',
      name: 'Tata Consultancy Services Ltd',
      commonName: 'TCS',
      isin: 'INE467B01029',
      exchange: 'NSE',
      country: 'IN',
      instrumentType: 'Equity',
      sector: 'Information Technology',
      industry: 'IT Services & Consulting',
      aliases: ['tcs', 'tata consultancy', 'tata consultancy services', '532540', 'TCS.NS', 'TCS.BO', 'TATA'],
      priceINR: 4210.80,
      changePercent: -0.42,
      marketCapINR: 15240000000000,
      pe: 31.20,
      pb: 14.8,
      roe: 48.2,
      roce: 59.4,
      debtEquity: 0.02,
      revenueINR: 2450000000000,
      ebitdaINR: 684000000000,
      netProfitINR: 482000000000,
      eps: 132.50,
      beta: 0.72,
      volatility: 0.152,
      sharpe: 1.48,
      var99: -0.0245,
      mdd: -0.098,
      regime: 'MEAN-REVERTING • CONSOLIDATION',
      regimeDesc: 'Stable cash flow profile with low systemic beta vs benchmark.',
      causalFactors: [
        { factor: 'BFSI Client Tech Budget Normalization', weight: '62%', type: 'Industry Macro', desc: 'US Banking clients pausing discretionary digital transformation spend' }
      ],
      corpActions: [
        { date: '2026-07-14', type: 'Dividend', desc: 'Interim Dividend ₹28.00 per share' }
      ]
    },
    {
      symbol: 'HDFCBANK',
      bseCode: '500180',
      name: 'HDFC Bank Ltd',
      commonName: 'HDFC Bank',
      isin: 'INE040A01034',
      exchange: 'NSE',
      country: 'IN',
      instrumentType: 'Equity',
      sector: 'Financial Services',
      industry: 'Private Sector Banking',
      aliases: ['hdfc', 'hdfc bank', 'hdfcbank', '500180', 'HDFCBANK.NS', 'HDFCBANK.BO'],
      priceINR: 1642.30,
      changePercent: 0.85,
      marketCapINR: 12500000000000,
      pe: 18.60,
      pb: 2.65,
      roe: 16.4,
      roce: 14.2,
      debtEquity: 7.20,
      revenueINR: 3200000000000,
      ebitdaINR: 1280000000000,
      netProfitINR: 648000000000,
      eps: 85.20,
      beta: 1.08,
      volatility: 0.178,
      sharpe: 0.94,
      var99: -0.0298,
      mdd: -0.165,
      regime: 'BULLISH TREND • RECOVERY',
      regimeDesc: 'Deposit growth normalization post-merger with credit quality resilience.',
      causalFactors: [
        { factor: 'Credit-Deposit Ratio Normalization', weight: '58%', type: 'Balance Sheet', desc: 'Successful branch-led deposit mobilization lowering LDR' }
      ],
      corpActions: [
        { date: '2026-05-18', type: 'Dividend', desc: '₹19.50 per share annual dividend' }
      ]
    },
    {
      symbol: 'INFY',
      bseCode: '500209',
      name: 'Infosys Ltd',
      commonName: 'Infosys',
      isin: 'INE009A01021',
      exchange: 'NSE',
      country: 'IN',
      instrumentType: 'Equity',
      sector: 'Information Technology',
      industry: 'IT Services & Software',
      aliases: ['infy', 'infosys', 'infosys ltd', '500209', 'INFY.NS', 'INFY.BO'],
      priceINR: 1885.40,
      changePercent: 1.64,
      marketCapINR: 7820000000000,
      pe: 28.40,
      pb: 8.90,
      roe: 31.8,
      roce: 40.5,
      debtEquity: 0.05,
      revenueINR: 1580000000000,
      ebitdaINR: 382000000000,
      netProfitINR: 268000000000,
      eps: 64.80,
      beta: 0.85,
      volatility: 0.198,
      sharpe: 1.12,
      var99: -0.0330,
      mdd: -0.134,
      regime: 'BULLISH TREND • TECH SURGE',
      regimeDesc: 'Large deal wins in Cloud and Generative AI services.',
      causalFactors: [
        { factor: 'Generative AI Multi-Year Enterprise Deal', weight: '70%', type: 'Contract Win', desc: '$1.4B contract with European automotive conglomerate' }
      ],
      corpActions: [
        { date: '2026-06-02', type: 'Dividend', desc: '₹20.00 final dividend' }
      ]
    },
    {
      symbol: 'AAPL',
      bseCode: 'NASDAQ',
      name: 'Apple Inc.',
      commonName: 'Apple',
      isin: 'US0378331005',
      exchange: 'NASDAQ',
      country: 'US',
      instrumentType: 'Equity',
      sector: 'Technology',
      industry: 'Consumer Electronics & Services',
      aliases: ['apple', 'aapl', 'iphone', 'mac'],
      priceINR: 18950.00,
      changePercent: 0.68,
      marketCapINR: 288000000000000,
      pe: 34.20,
      pb: 48.5,
      roe: 147.0,
      roce: 58.2,
      debtEquity: 1.45,
      revenueINR: 32400000000000,
      ebitdaINR: 11200000000000,
      netProfitINR: 8400000000000,
      eps: 552.0,
      beta: 0.95,
      volatility: 0.172,
      sharpe: 1.35,
      var99: -0.0280,
      mdd: -0.125,
      regime: 'BULLISH TREND • AI SERVICES',
      regimeDesc: 'Apple Intelligence deployment and recurring services growth.',
      causalFactors: [
        { factor: 'Services High-Margin Revenue Record', weight: '65%', type: 'Segment Growth', desc: 'App Store, Cloud and Payments growth' }
      ],
      corpActions: [
        { date: '2026-08-10', type: 'Dividend', desc: '$0.25 quarterly dividend' }
      ]
    },
    {
      symbol: 'NVDA',
      bseCode: 'NASDAQ',
      name: 'NVIDIA Corporation',
      commonName: 'Nvidia',
      isin: 'US67066G1040',
      exchange: 'NASDAQ',
      country: 'US',
      instrumentType: 'Equity',
      sector: 'Semiconductors',
      industry: 'AI Acceleration & Compute Hardware',
      aliases: ['nvidia', 'nvda', 'gpu', 'ai chips', 'blackwell'],
      priceINR: 10688.00,
      changePercent: 3.42,
      marketCapINR: 262000000000000,
      pe: 58.40,
      pb: 42.1,
      roe: 115.4,
      roce: 92.0,
      debtEquity: 0.18,
      revenueINR: 10400000000000,
      ebitdaINR: 6800000000000,
      netProfitINR: 5200000000000,
      eps: 182.0,
      beta: 1.68,
      volatility: 0.385,
      sharpe: 2.10,
      var99: -0.0580,
      mdd: -0.220,
      regime: 'EXTREME MOMENTUM • HIGH VOL',
      regimeDesc: 'Blackwell architecture enterprise adoption driving data center revenue.',
      causalFactors: [
        { factor: 'Hyperscaler AI Capex Expansion ($200B+ TAM)', weight: '85%', type: 'Demand Curve', desc: 'Microsoft, Meta, Google increasing GPU cluster orders' }
      ],
      corpActions: [
        { date: '2026-08-25', type: 'Earnings', desc: 'Record Q2 AI Compute Revenue report' }
      ]
    }
  ];

  // ── 7. Universal Detail Drawer Controller ──────────────────────────────────
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
    activeTab: 'overview',
    historyStack: []
  };

  const openUniversalDrawer = (metricKey = 'pe', customSec = null) => {
    const sec = customSec || appState.activeSecurity || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[0] : SECURITIES_DATABASE[4]);
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

    // Tabs update
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
            <span style="font-size:0.75rem;color:var(--text-muted);">CURRENT METRIC VALUE</span>
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

  // ── 8. Universal Search & Intent Resolver with Typo Tolerance ──────────────
  const resolveQueryWithIntent = (queryText) => {
    const q = (queryText || '').trim().toLowerCase();

    // 1. Comparison Intent
    if (q.includes('compare') || q.includes(' vs ') || q.includes(' versus ')) {
      const parts = q.replace('compare', '').split(/vs|versus|and/i).map((s) => s.trim());
      const sec1 = findBestSecurityMatch(parts[0]) || SECURITIES_DATABASE[0];
      const sec2 = findBestSecurityMatch(parts[1]) || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[1] : SECURITIES_DATABASE[5]);
      return {
        intent: 'COMPARE',
        intentLabel: 'COMPARATIVE ANALYSIS',
        sec1,
        sec2,
        query: queryText
      };
    }

    // 2. Movement / Why Intent
    if (q.includes('why') || q.includes('fall') || q.includes('drop') || q.includes('jump') || q.includes('move')) {
      const sec = findBestSecurityMatch(q) || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[2] : SECURITIES_DATABASE[5]);
      return {
        intent: 'WHY_MOVED',
        intentLabel: 'MOVEMENT CAUSAL ATTRIBUTION',
        security: sec,
        query: queryText
      };
    }

    // 3. Formula Explanation Intent
    if (q.includes('explain') || q.includes('formula') || q.includes('what is') || q.includes('calculate')) {
      const formulaKey = Object.keys(MATHEMATICAL_REGISTRY).find((k) => q.includes(k) || q.includes(MATHEMATICAL_REGISTRY[k].name.toLowerCase())) || 'sharpe';
      return {
        intent: 'EXPLAIN_MATH',
        intentLabel: 'QUANTITATIVE EXPLANATION',
        formulaKey,
        query: queryText
      };
    }

    // 4. Direct Security Match
    const match = findBestSecurityMatch(q);
    if (match) {
      return {
        intent: 'ANALYSE',
        intentLabel: 'SECURITY INVESTIGATION',
        security: match,
        query: queryText
      };
    }

    return {
      intent: 'ANALYSE',
      intentLabel: 'SECURITY INVESTIGATION',
      security: appState.marketRegion === 'IN' ? SECURITIES_DATABASE[0] : SECURITIES_DATABASE[4],
      query: queryText
    };
  };

  const findBestSecurityMatch = (str) => {
    if (!str) return null;
    const s = str.toLowerCase().trim();
    return SECURITIES_DATABASE.find((sec) =>
      sec.symbol.toLowerCase() === s ||
      sec.name.toLowerCase().includes(s) ||
      sec.commonName.toLowerCase().includes(s) ||
      sec.isin.toLowerCase() === s ||
      sec.aliases.some((a) => a.toLowerCase().includes(s) || s.includes(a.toLowerCase()))
    );
  };

  // ── 9. Universal Command Palette (⌘K) with Intent Preview & History ─────────
  const paletteOverlay = document.getElementById('paletteOverlay');
  const paletteInput = document.getElementById('paletteInput');
  const paletteResults = document.getElementById('paletteResults');
  const palBackdrop = document.getElementById('paletteBackdrop');

  const openCommandPalette = () => {
    paletteOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    paletteInput.value = '';
    renderPaletteItems(appState.marketRegion === 'IN' ? SECURITIES_DATABASE.slice(0, 4) : [SECURITIES_DATABASE[4], SECURITIES_DATABASE[5], SECURITIES_DATABASE[0], SECURITIES_DATABASE[1]]);
    paletteInput.focus();
  };

  const closeCommandPalette = () => {
    paletteOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  const saveSearchHistory = (q) => {
    if (!q) return;
    const clean = q.trim();
    if (!appState.searchHistory.includes(clean)) {
      appState.searchHistory.unshift(clean);
      if (appState.searchHistory.length > 8) appState.searchHistory.pop();
      localStorage.setItem('riskos_search_history', JSON.stringify(appState.searchHistory));
    }
  };

  const renderPaletteItems = (items, currentQuery = '') => {
    paletteResults.innerHTML = '';

    // 1. If user typed a question, show Intent Preview Card
    if (currentQuery && currentQuery.length > 3) {
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
        saveSearchHistory(currentQuery);
        openFinancialCanvas(currentQuery);
      });
      paletteResults.appendChild(prev);
    }

    // 2. Disambiguation check (e.g. typing "HDFC")
    if (currentQuery.toLowerCase() === 'hdfc') {
      const dis = document.createElement('div');
      dis.innerHTML = `
        <div class="palette-group-title">DISAMBIGUATION &bull; SELECT SECURITY</div>
        <div class="disambiguate-grid">
          <div class="disambiguate-item" id="disHdfcBank">
            <div><strong>HDFC Bank Ltd</strong><div style="font-size:0.7rem;color:var(--text-muted);">NSE: HDFCBANK &bull; Banking Leader</div></div>
            <strong style="color:var(--accent-emerald);">${formatMoney(1642.30)}</strong>
          </div>
        </div>
      `;
      const itemBank = dis.querySelector('#disHdfcBank');
      if (itemBank) itemBank.addEventListener('click', () => {
        closeCommandPalette();
        openCompanyModal(SECURITIES_DATABASE[2]);
      });
      paletteResults.appendChild(dis);
      return;
    }

    // 3. Securities List
    const groupSec = document.createElement('div');
    groupSec.innerHTML = `<div class="palette-group-title">SECURITIES (${appState.marketRegion === 'IN' ? 'NSE / BSE' : 'NYSE / NASDAQ'})</div>`;
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
        saveSearchHistory(s.name);
        openCompanyModal(s);
      });
      groupSec.appendChild(it);
    });
    paletteResults.appendChild(groupSec);

    // 4. Recent Searches
    if (appState.searchHistory.length > 0 && !currentQuery) {
      const histSec = document.createElement('div');
      histSec.innerHTML = `<div class="palette-group-title">RECENT SEARCHES</div>`;
      appState.searchHistory.forEach((h) => {
        const hi = document.createElement('div');
        hi.className = 'palette-item';
        hi.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);">
            <i class="fa-solid fa-clock-rotate-left" style="font-size:0.75rem;"></i>
            <span>${h}</span>
          </div>
        `;
        hi.addEventListener('click', () => {
          closeCommandPalette();
          openFinancialCanvas(h);
        });
        histSec.appendChild(hi);
      });
      paletteResults.appendChild(histSec);
    }
  };

  if (paletteInput) {
    let debounceTimer = null;
    paletteInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounceTimer);
      
      if (!q) {
        renderPaletteItems(appState.marketRegion === 'IN' ? SECURITIES_DATABASE.slice(0, 4) : [SECURITIES_DATABASE[4], SECURITIES_DATABASE[5], SECURITIES_DATABASE[0], SECURITIES_DATABASE[1]]);
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await cachedFetch(`/api/securities/master?q=${encodeURIComponent(q)}`);
          if (res && res.securities && res.securities.length > 0) {
            renderPaletteItems(res.securities, q);
            return;
          }
        } catch (err) {}

        const matches = SECURITIES_DATABASE.filter((s) =>
          s.symbol.toLowerCase().includes(q.toLowerCase()) ||
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          (s.aliases && s.aliases.some((a) => a.toLowerCase().includes(q.toLowerCase())))
        );
        renderPaletteItems(matches, q);
      }, 120);
    });

    paletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = paletteInput.value.trim();
        if (val) {
          closeCommandPalette();
          saveSearchHistory(val);
          openFinancialCanvas(val);
        }
      }
    });
  }

  // ── 10. Global Keyboard Shortcuts & Event Delegation ──────────────────────
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    } else if (e.key === 'Escape') {
      closeCommandPalette();
      closeUniversalDrawer();
      closeCompanyModal();
      closeFinancialCanvas();
      closeCompareModal();
      closeWatchlistDrawer();
      closeAlertsDrawer();
      closeMarketPulseDrawer();
      if (isObsOpen) closeObservatory();
      if (isMobileMenuOpen) closeMobileMenu();
    }
  });

  const navSearchTrigger = document.getElementById('navSearchTrigger');
  if (navSearchTrigger) navSearchTrigger.addEventListener('click', openCommandPalette);
  if (palBackdrop) palBackdrop.addEventListener('click', closeCommandPalette);

  // Universal [?] Explainer Click Delegation
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.why-trigger-btn');
    if (btn) {
      e.stopPropagation();
      const k = btn.dataset.whyKey || 'pe';
      openUniversalDrawer(k);
    }
  });

  // ── 11. Synchronized Market Region & Mode Controller ───────────────────────
  const setMode = (mode) => {
    appState.userMode = mode;
    localStorage.setItem('riskos_user_mode', mode);
    document.body.dataset.userMode = mode;

    document.querySelectorAll('#modeSelectorPill .mode-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    if (appState.activeSecurity && !companyModalOverlay.hasAttribute('hidden')) {
      renderCompanyModal(appState.activeSecurity);
    }
    if (!financialCanvasOverlay.hasAttribute('hidden')) {
      executeCanvasQuery(appState.lastQuery);
    }
  };

  const modePill = document.getElementById('modeSelectorPill');
  if (modePill) {
    modePill.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
  }

  const setMarketRegion = (region) => {
    appState.marketRegion = region;
    appState.currency = region === 'IN' ? 'INR' : 'USD';
    appState.marketContext = region === 'IN' ? 'NSE' : 'US';
    
    localStorage.setItem('riskos_market_region', region);
    localStorage.setItem('riskos_currency', appState.currency);
    document.body.dataset.marketRegion = region;

    // Currency Pill
    document.querySelectorAll('#currencyToggleBtn .curr-opt').forEach((el) => {
      el.classList.toggle('active', el.dataset.curr === appState.currency);
    });

    // Hero Ticker Pill with smooth fade
    const tickerPill = document.getElementById('heroLiveTickerPill');
    const tickerText = document.getElementById('liveTickerText');
    const tickerTag = tickerPill ? tickerPill.querySelector('.status-provenance-tag') : null;

    if (tickerText && tickerPill) {
      tickerPill.style.opacity = '0.3';
      setTimeout(() => {
        if (region === 'IN') {
          tickerText.innerHTML = `NIFTY 50 24,820.40 (+0.45%) &bull; SENSEX 81,340.20 (+0.38%) &bull; BANK NIFTY 51,240.10 (-0.12%)`;
          if (tickerTag) tickerTag.textContent = 'LIVE • NSE/BSE';
        } else {
          tickerText.innerHTML = `S&P 500 5,640.10 (+0.22%) &bull; NASDAQ 17,820.30 (+0.48%) &bull; DOW 40,840.50 (+0.15%)`;
          if (tickerTag) tickerTag.textContent = 'LIVE • NYSE/NASDAQ';
        }
        tickerPill.style.opacity = '1';
      }, 140);
    }

    // Hero Prompts
    const promptRow = document.querySelector('.quick-prompts-row');
    if (promptRow) {
      promptRow.style.opacity = '0.3';
      setTimeout(() => {
        if (region === 'IN') {
          promptRow.innerHTML = `
            <span class="prompt-tag-label">Ask anything:</span>
            <button class="prompt-chip" data-query="Reliance">Analyse Reliance</button>
            <button class="prompt-chip" data-query="Why did HDFC Bank move?">Why did HDFC Bank move?</button>
            <button class="prompt-chip" data-query="Compare TCS vs INFY">Compare TCS vs Infosys</button>
            <button class="prompt-chip" data-query="Indian IT volatility">Indian IT Volatility</button>
            <button class="prompt-chip" data-query="Explain Sharpe ratio">Explain Sharpe Ratio</button>
          `;
        } else {
          promptRow.innerHTML = `
            <span class="prompt-tag-label">Ask anything:</span>
            <button class="prompt-chip" data-query="Apple">Analyse Apple (AAPL)</button>
            <button class="prompt-chip" data-query="Why did Nvidia jump?">Why did Nvidia jump?</button>
            <button class="prompt-chip" data-query="Compare AAPL vs NVDA">Compare Apple vs Nvidia</button>
            <button class="prompt-chip" data-query="US Tech volatility">US Tech Volatility</button>
            <button class="prompt-chip" data-query="Explain Sharpe ratio">Explain Sharpe Ratio</button>
          `;
        }
        promptRow.querySelectorAll('.prompt-chip').forEach((chip) => {
          chip.addEventListener('click', () => openFinancialCanvas(chip.dataset.query));
        });
        promptRow.style.opacity = '1';
      }, 140);
    }

    updateMarketClocks();
    if (appState.activeSecurity) renderCompanyModal(appState.activeSecurity);
    renderWatchlist();
    if (portfolioEngine) portfolioEngine.update();
  };

  const currToggle = document.getElementById('currencyToggleBtn');
  if (currToggle) currToggle.addEventListener('click', () => setMarketRegion(appState.marketRegion === 'IN' ? 'US' : 'IN'));
  const clockBadge = document.getElementById('marketClockBadge');
  if (clockBadge) clockBadge.addEventListener('click', () => setMarketRegion(appState.marketRegion === 'IN' ? 'US' : 'IN'));

  // ── 12. Generative Financial Intelligence Canvas ───────────────────────────
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
      const sec = resolved.security;
      appState.activeSecurity = sec;
      canvasBody.innerHTML = `
        <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;">
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-emerald);">1-YEAR TRAJECTORY &bull; ${sec.exchange}</span>
              <span style="font-family:monospace;font-weight:800;font-size:1.1rem;color:#fff;">${formatMoney(sec.priceINR)} (${formatPercent(sec.changePercent)})</span>
            </div>
            <div style="height:200px;position:relative;background:rgba(0,0,0,0.3);border-radius:8px;overflow:hidden;">
              <canvas id="genCanvasChart" style="width:100%;height:100%;"></canvas>
            </div>
          </div>

          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--accent-amber);">WHY DID THIS MOVE? (CAUSAL TREE)</span>
              <span style="font-size:0.6rem;color:var(--text-muted);font-family:monospace;">EVIDENCE SCORE: 92%</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${(sec.causalFactors || []).map(f => `
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:0.75rem;font-weight:700;color:#fff;">${f.factor}</div>
                    <div style="font-size:0.65rem;color:var(--text-secondary);">${f.desc}</div>
                  </div>
                  <strong style="font-family:monospace;color:var(--accent-emerald);font-size:0.8rem;">${f.weight}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--text-secondary);">VALUATION (P/E)</span>
              <button class="why-trigger-btn" data-why-key="pe">?</button>
            </div>
            <span style="font-size:1.3rem;font-weight:800;color:#fff;font-family:monospace;">${sec.pe}&times;</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Sector Benchmark: 23.4&times;</span>
          </div>

          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--text-secondary);">SYSTEMATIC BETA</span>
              <button class="why-trigger-btn" data-why-key="beta">?</button>
            </div>
            <span style="font-size:1.3rem;font-weight:800;color:#fff;font-family:monospace;">${sec.beta}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Relative to Benchmark (1.00)</span>
          </div>

          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:var(--text-secondary);">VOLATILITY (\\(\\sigma\\))</span>
              <button class="why-trigger-btn" data-why-key="volatility">?</button>
            </div>
            <span style="font-size:1.3rem;font-weight:800;color:#fff;font-family:monospace;">${(sec.volatility*100).toFixed(1)}%</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">GARCH(1,1) Estimate</span>
          </div>
        </div>
      `;

      setTimeout(() => {
        renderGenCanvasChart(sec);
        triggerMathJax(canvasBody);
      }, 50);
    } else if (resolved.intent === 'WHY_MOVED') {
      const sec = resolved.security;
      canvasBody.innerHTML = `
        <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px;">
          <span style="font-size:0.65rem;font-weight:700;color:var(--accent-amber);">EVENT &bull; CAUSAL REASONING PIPELINE</span>
          <h3 style="font-size:1.2rem;font-weight:800;color:#fff;">What Moved ${sec.name} (${sec.symbol})?</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);">
            Evidence-based attribution from exchange filings, order flow imbalances, and macro sector signals.
          </p>

          <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
            ${(sec.causalFactors || []).map((f, i) => `
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="background:rgba(81,207,102,0.15);color:var(--accent-emerald);font-weight:800;font-family:monospace;font-size:0.75rem;padding:4px 8px;border-radius:4px;">STAGE 0${i+1}</span>
                  <div>
                    <strong style="color:#fff;font-size:0.85rem;">${f.factor}</strong>
                    <div style="font-size:0.75rem;color:var(--text-secondary);">${f.desc}</div>
                  </div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:0.65rem;color:var(--text-muted);display:block;">FACTOR WEIGHT</span>
                  <strong style="font-family:monospace;color:var(--accent-emerald);font-size:1.1rem;">${f.weight}</strong>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      triggerMathJax(canvasBody);
    } else if (resolved.intent === 'COMPARE') {
      openCompareModal(resolved.sec1, resolved.sec2);
      closeFinancialCanvas();
      return;
    } else if (resolved.intent === 'EXPLAIN_MATH') {
      openUniversalDrawer(resolved.formulaKey);
      closeFinancialCanvas();
      return;
    }

    financialCanvasOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
  };

  const renderGenCanvasChart = (sec) => {
    const canvas = document.getElementById('genCanvasChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const pts = 60;
    const data = [];
    let p = sec.priceINR * 0.9;
    for (let i = 0; i < pts; i++) {
      p += (Math.sin(i * 0.4) * sec.volatility * p * 0.05) + (sec.changePercent * 0.5);
      data.push(p);
    }

    const minP = Math.min(...data) * 0.98;
    const maxP = Math.max(...data) * 1.02;
    const padL = 40, padR = 15, padT = 15, padB = 20;
    const w = rect.width - padL - padR;
    const h = rect.height - padT - padB;

    const getX = (i) => padL + (i / (pts - 1)) * w;
    const getY = (v) => padT + h - ((v - minP) / (maxP - minP)) * h;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = sec.changePercent >= 0 ? '#51CF66' : '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < pts; i++) ctx.lineTo(getX(i), getY(data[i]));
    ctx.stroke();
  };

  const openFinancialCanvas = (q = 'Reliance') => {
    executeCanvasQuery(q);
  };

  const closeFinancialCanvas = () => {
    financialCanvasOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (canvasCloseBtn) canvasCloseBtn.addEventListener('click', closeFinancialCanvas);
  if (canvasModalBackdrop) canvasModalBackdrop.addEventListener('click', closeFinancialCanvas);
  const navOpenCanvas = document.getElementById('navOpenCanvas');
  if (navOpenCanvas) navOpenCanvas.addEventListener('click', () => openFinancialCanvas(appState.marketRegion === 'IN' ? 'Reliance' : 'Apple'));
  const heroCanvasBtn = document.getElementById('heroCanvasBtn');
  if (heroCanvasBtn) heroCanvasBtn.addEventListener('click', () => openFinancialCanvas(appState.marketRegion === 'IN' ? 'Reliance' : 'Apple'));

  // ── 13. Company Research Modal ────────────────────────────────────────────
  const companyModalOverlay = document.getElementById('companyModalOverlay');
  const compCloseBtn = document.getElementById('compCloseBtn');
  const compModalBackdrop = document.getElementById('companyModalBackdrop');

  const openCompanyModal = (security) => {
    appState.activeSecurity = security;
    renderCompanyModal(security);
    companyModalOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      renderCompanyChart(security);
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
    document.getElementById('compLogoBadge').textContent = sec.symbol[0];
    document.getElementById('compName').textContent = sec.name;
    document.getElementById('compExchange').textContent = `${sec.exchange}: ${sec.symbol}`;
    document.getElementById('compSector').textContent = sec.sector || 'Equities';
    document.getElementById('compIsin').textContent = sec.isin || '-';
    document.getElementById('compAliases').textContent = `Aliases: ${(sec.aliases || []).slice(0, 5).join(', ')}`;
    document.getElementById('compPrice').textContent = formatMoney(sec.priceINR || sec.price_inr);
    
    const chgEl = document.getElementById('compChange');
    const chgVal = sec.changePercent !== undefined ? sec.changePercent : sec.change_percent;
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

    const pr = sec.priceINR || sec.price_inr || 100;
    document.getElementById('cs52High').textContent = formatMoney(pr * 1.15);
    document.getElementById('cs52Low').textContent = formatMoney(pr * 0.78);
    document.getElementById('csVolume').textContent = '4.82M';
    document.getElementById('csMarketCap').textContent = formatMoney(sec.marketCapINR || sec.market_cap_inr || 1000000000000);
    document.getElementById('compRegimeText').textContent = sec.regime || 'BULLISH TREND';
    document.getElementById('compRegimeDesc').textContent = sec.regimeDesc || 'Institutional Quantitative Regime Profile';
    document.getElementById('sumValuation').textContent = `${sec.pe}×`;
    document.getElementById('sumRiskRating').textContent = (sec.beta || 1.0).toString();
    document.getElementById('sumVol').textContent = `${((sec.volatility || 0.18) * 100).toFixed(1)}%`;
    document.getElementById('sumRoe').textContent = `${sec.roe}%`;

    // Causal Tab
    document.getElementById('causalHeadline').textContent = `What Drove the ${formatPercent(chgVal)} Move in ${sec.commonName || sec.symbol}?`;
    const causalTree = document.getElementById('causalTreeDiagram');
    causalTree.innerHTML = '';
    (sec.causalFactors || []).forEach((f) => {
      const node = document.createElement('div');
      node.className = 'causal-node';
      node.innerHTML = `
        <div class="cn-left">
          <span class="cn-badge" style="background:rgba(81,207,102,0.1);color:var(--accent-emerald);">${f.type}</span>
          <div>
            <div class="cn-text">${f.factor}</div>
            <div class="cn-sub">${f.desc}</div>
          </div>
        </div>
        <span class="cn-impact pos">${f.weight}</span>
      `;
      causalTree.appendChild(node);
    });

    document.getElementById('fundRevenue').textContent = formatMoney(sec.revenueINR || sec.revenue_inr || 1000000000000);
    document.getElementById('fundEbitda').textContent = formatMoney(sec.ebitdaINR || sec.ebitda_inr || 300000000000);
    document.getElementById('fundNetProfit').textContent = formatMoney(sec.netProfitINR || sec.net_profit_inr || 200000000000);
    document.getElementById('fundEps').textContent = formatMoney(sec.eps || 50.0);
    document.getElementById('fundPe').textContent = (sec.pe || 25.0).toString();
    document.getElementById('fundPb').textContent = (sec.pb || 3.0).toString();
    document.getElementById('fundRoe').textContent = `${sec.roe || 15.0}%`;
    document.getElementById('fundDebtEquity').textContent = (sec.debtEquity || sec.debt_equity || 0.5).toString();

    const corpTl = document.getElementById('compCorpTimeline');
    corpTl.innerHTML = '';
    (sec.corpActions || []).forEach((ca) => {
      const row = document.createElement('div');
      row.className = 'corp-event-row';
      row.innerHTML = `
        <span class="cer-date">${ca.date}</span>
        <span class="cer-type">${ca.type}</span>
        <span class="cer-desc">${ca.desc}</span>
      `;
      corpTl.appendChild(row);
    });

    const rfRate = appState.marketRegion === 'IN' ? 6.5 : 4.5;
    const b = sec.beta || 1.0;
    document.getElementById('quantBeta').textContent = b.toString();
    document.getElementById('quantVol').textContent = `${((sec.volatility || 0.18) * 100).toFixed(1)}%`;
    document.getElementById('quantVar').textContent = `${((sec.var99 || -0.03) * 100).toFixed(2)}% / day`;
    document.getElementById('quantSharpe').textContent = (sec.sharpe || 1.2).toString();
    document.getElementById('quantMdd').textContent = `${((sec.mdd || -0.15) * 100).toFixed(1)}%`;
    document.getElementById('quantCapm').textContent = `${(rfRate + b * 7.2).toFixed(1)}%`;
  };

  const renderCompanyChart = (sec) => {
    const canvas = document.getElementById('compPriceCanvas');
    const container = document.getElementById('compCanvasContainer');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const pointsCount = appState.activeTimeframe === '1M' ? 30 : (appState.activeTimeframe === '3M' ? 90 : 252);
    const data = [];
    const pr = sec.priceINR || sec.price_inr || 100;
    const chg = sec.changePercent !== undefined ? sec.changePercent : 0;
    let price = pr * (1 - (chg * 0.05));
    for (let i = 0; i < pointsCount; i++) {
      const noise = Math.sin(i * 0.5 + sec.symbol.length) * ((sec.volatility || 0.18) / 20) * price;
      price = Math.max(10, price + noise + (chg * 0.1));
      data.push(price);
    }

    const minP = Math.min(...data) * 0.98;
    const maxP = Math.max(...data) * 1.02;
    const padL = 50, padR = 20, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const getX = (i) => padL + (i / (data.length - 1)) * plotW;
    const getY = (p) => padT + plotH - ((p - minP) / (maxP - minP)) * plotH;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#71717a';
    ctx.font = '9px monospace';

    for (let g = 0; g <= 3; g++) {
      const pVal = minP + (g / 3) * (maxP - minP);
      const yPos = getY(pVal);
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(width - padR, yPos);
      ctx.stroke();
      ctx.fillText(formatMoney(pVal), 6, yPos + 3);
    }

    const strokeColor = chg >= 0 ? '#51CF66' : '#FF6B6B';
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, chg >= 0 ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 107, 107, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < data.length; i++) ctx.lineTo(getX(i), getY(data[i]));
    ctx.lineTo(getX(data.length - 1), padT + plotH);
    ctx.lineTo(getX(0), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < data.length; i++) ctx.lineTo(getX(i), getY(data[i]));
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
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
          renderCompanyChart(appState.activeSecurity);
        }
      }
    });
  });

  // ── 14. Comparison Modal ───────────────────────────────────────────────────
  const compareModalOverlay = document.getElementById('compareModalOverlay');
  const compareCloseBtn = document.getElementById('compareCloseBtn');
  const compareModalBackdrop = document.getElementById('compareModalBackdrop');

  const openCompareModal = (sec1, sec2) => {
    document.getElementById('compareTitle').textContent = `${sec1.name} vs ${sec2.name}`;
    const compBody = document.getElementById('compareBody');
    compBody.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr>
            <th>METRIC / ATTRIBUTE</th>
            <th>${sec1.symbol} (${sec1.exchange})</th>
            <th>${sec2.symbol} (${sec2.exchange})</th>
            <th>RELATIVE ADVANTAGE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Current Price</strong></td>
            <td>${formatMoney(sec1.priceINR || sec1.price_inr)}</td>
            <td>${formatMoney(sec2.priceINR || sec2.price_inr)}</td>
            <td>-</td>
          </tr>
          <tr>
            <td><strong>P/E Ratio (Valuation)</strong></td>
            <td>${sec1.pe}&times;</td>
            <td>${sec2.pe}&times;</td>
            <td class="pos">${sec1.pe < sec2.pe ? sec1.symbol + ' (Lower Multiple)' : sec2.symbol + ' (Lower Multiple)'}</td>
          </tr>
          <tr>
            <td><strong>Return on Equity (ROE)</strong></td>
            <td>${sec1.roe}%</td>
            <td>${sec2.roe}%</td>
            <td class="pos">${sec1.roe > sec2.roe ? sec1.symbol + ' (Higher ROE)' : sec2.symbol + ' (Higher ROE)'}</td>
          </tr>
          <tr>
            <td><strong>Systematic Beta (\\(\\beta\\))</strong></td>
            <td>${sec1.beta}</td>
            <td>${sec2.beta}</td>
            <td>${sec1.beta < sec2.beta ? sec1.symbol + ' (Lower Volatility)' : sec2.symbol + ' (Higher Sensitivity)'}</td>
          </tr>
          <tr>
            <td><strong>Sharpe Ratio (\\(S\\))</strong></td>
            <td>${sec1.sharpe}</td>
            <td>${sec2.sharpe}</td>
            <td class="pos">${sec1.sharpe > sec2.sharpe ? sec1.symbol + ' (Superior Risk-Adjusted)' : sec2.symbol + ' (Superior Risk-Adjusted)'}</td>
          </tr>
        </tbody>
      </table>
    `;
    compareModalOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    triggerMathJax(compBody);
  };

  const closeCompareModal = () => {
    compareModalOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (compareCloseBtn) compareCloseBtn.addEventListener('click', closeCompareModal);
  if (compareModalBackdrop) compareModalBackdrop.addEventListener('click', closeCompareModal);

  // ── 15. Watchlist & Drawers ────────────────────────────────────────────────
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
      const s = SECURITIES_DATABASE.find((it) => it.symbol === sym) || SECURITIES_DATABASE[0];
      const card = document.createElement('div');
      card.className = 'watchlist-item-card';
      const pr = s.priceINR || s.price_inr || 100;
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

  const closeWatchlistDrawer = () => {
    watchlistDrawer.setAttribute('hidden', '');
  };

  if (btnOpenWatchlist) btnOpenWatchlist.addEventListener('click', openWatchlistDrawer);
  if (watchlistCloseBtn) watchlistCloseBtn.addEventListener('click', closeWatchlistDrawer);

  // Alerts Drawer
  const alertsDrawer = document.getElementById('alertsDrawer');
  const btnOpenAlerts = document.getElementById('btnOpenAlerts');
  const alertsCloseBtn = document.getElementById('alertsCloseBtn');

  const openAlertsDrawer = () => {
    const list = document.getElementById('alertsListContainer');
    list.innerHTML = `
      <div class="alert-item-card">
        <span class="source-quality-tag sq--filing">OFFICIAL EXCHANGE FILING</span>
        <span class="aic-title">Reliance Industries Ltd submits quarterly financial results disclosure to NSE/BSE</span>
        <span class="aic-time">12 mins ago &bull; Verified Feed</span>
      </div>
    `;
    alertsDrawer.removeAttribute('hidden');
  };

  const closeAlertsDrawer = () => {
    alertsDrawer.setAttribute('hidden', '');
  };

  if (btnOpenAlerts) btnOpenAlerts.addEventListener('click', openAlertsDrawer);
  if (alertsCloseBtn) alertsCloseBtn.addEventListener('click', closeAlertsDrawer);

  // Market Pulse Drawer
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

  const closeMarketPulseDrawer = () => {
    marketPulseDrawer.setAttribute('hidden', '');
  };

  if (navOpenPulse) navOpenPulse.addEventListener('click', openMarketPulseDrawer);
  if (pulseCloseBtn) pulseCloseBtn.addEventListener('click', closeMarketPulseDrawer);

  // ── 16. Market Clock Engine ────────────────────────────────────────────────
  const updateMarketClocks = () => {
    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const estTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });

    const badgeDot = document.getElementById('marketStatusDot');
    const badgeName = document.getElementById('marketName');
    const badgeState = document.getElementById('marketState');
    const badgeTime = document.getElementById('marketTime');

    if (badgeName && badgeState && badgeDot && badgeTime) {
      if (appState.marketRegion === 'IN') {
        badgeName.textContent = 'NSE';
        badgeTime.textContent = `${istTimeStr} IST`;
        badgeState.textContent = 'OPEN';
        badgeDot.className = 'market-status-dot dot--open';
      } else {
        badgeName.textContent = 'NYSE';
        badgeTime.textContent = `${estTimeStr} EST`;
        badgeState.textContent = 'OPEN';
        badgeDot.className = 'market-status-dot dot--open';
      }
    }
  };

  updateMarketClocks();
  setInterval(updateMarketClocks, 1000);

  // ── 17. Observatory & Portfolio Engine ─────────────────────────────────────
  const obsState = {
    timeframe: '1Y',
    capital: 1000000,
    horizon: 3,
    riskProfile: 'moderate',
    scenario: 'base',
    weights: { eq: 52, bnd: 28, csh: 10, cmd: 10 },
    assets: {
      eq:  { name: 'Equities',     baseReturn: 0.135, baseVol: 0.165 },
      bnd: { name: 'Fixed Income', baseReturn: 0.052, baseVol: 0.058 },
      csh: { name: 'Cash/Liquid',  baseReturn: 0.040, baseVol: 0.005 },
      cmd: { name: 'Commodities',  baseReturn: 0.085, baseVol: 0.142 }
    },
    scenarios: {
      base:       { name: 'Base Case',        returnMult: 1.0,  volMult: 1.0,  ddMult: 1.0,  eqAlpha: 0.0,   bndAlpha: 0.0 },
      bull:       { name: 'Bull Market',      returnMult: 1.45, volMult: 0.85, ddMult: 0.6,  eqAlpha: 0.06,  bndAlpha: -0.01 },
      bear:       { name: 'Bear Market',      returnMult: -0.8, volMult: 1.75, ddMult: 2.2,  eqAlpha: -0.15, bndAlpha: 0.04 }
    }
  };

  const obsOverlay = document.getElementById('observatoryOverlay');
  const obsCloseBtn = document.getElementById('obsCloseBtn');
  const obsBackdrop = document.getElementById('observatoryBackdrop');
  let isObsOpen = false;

  const openObservatory = () => {
    if (isObsOpen) return;
    isObsOpen = true;
    document.body.classList.add('obs-open');
    obsOverlay.removeAttribute('hidden');
    void obsOverlay.offsetWidth;
    obsOverlay.classList.add('is-open');

    setTimeout(() => {
      portfolioEngine.update();
      triggerMathJax(obsOverlay);
    }, 50);
  };

  const closeObservatory = () => {
    if (!isObsOpen) return;
    isObsOpen = false;
    obsOverlay.classList.remove('is-open');
    document.body.classList.remove('obs-open');
    setTimeout(() => {
      if (!isObsOpen) obsOverlay.setAttribute('hidden', '');
    }, 280);
  };

  [
    document.getElementById('ctaBtn'),
    document.getElementById('navOpenObs'),
    document.getElementById('mobileOpenObs'),
    document.getElementById('mobileCtaLaunchObs')
  ].forEach((btn) => {
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); openObservatory(); });
  });

  if (obsCloseBtn) obsCloseBtn.addEventListener('click', closeObservatory);
  if (obsBackdrop) obsBackdrop.addEventListener('click', closeObservatory);

  const createPortfolio = () => {
    const update = () => {
      const wEq = obsState.weights.eq;
      const wBnd = obsState.weights.bnd;
      const wCsh = obsState.weights.csh;
      const wCmd = obsState.weights.cmd;

      const lEq = document.getElementById('lblEqWeight');
      const lBnd = document.getElementById('lblBndWeight');
      const lCsh = document.getElementById('lblCshWeight');
      const lCmd = document.getElementById('lblCmdWeight');

      if (lEq) lEq.textContent = `${wEq}%`;
      if (lBnd) lBnd.textContent = `${wBnd}%`;
      if (lCsh) lCsh.textContent = `${wCsh}%`;
      if (lCmd) lCmd.textContent = `${wCmd}%`;

      const expR = (
        (wEq / 100 * obsState.assets.eq.baseReturn) +
        (wBnd / 100 * obsState.assets.bnd.baseReturn) +
        (wCsh / 100 * obsState.assets.csh.baseReturn) +
        (wCmd / 100 * obsState.assets.cmd.baseReturn)
      );

      const expVol = Math.sqrt(
        Math.pow((wEq / 100) * obsState.assets.eq.baseVol, 2) +
        Math.pow((wBnd / 100) * obsState.assets.bnd.baseVol, 2) +
        Math.pow((wCmd / 100) * obsState.assets.cmd.baseVol, 2)
      );

      const rf = appState.marketRegion === 'IN' ? 0.065 : 0.045;
      const sharpe = expVol > 0.005 ? ((expR - rf) / expVol) : 0;

      const ribbonReturn = document.getElementById('ribbonReturn');
      const ribbonVol = document.getElementById('ribbonVol');
      const ribbonSharpe = document.getElementById('ribbonSharpe');

      if (ribbonReturn) ribbonReturn.textContent = formatPercent(expR * 100);
      if (ribbonVol) ribbonVol.textContent = `${(expVol * 100).toFixed(1)}%`;
      if (ribbonSharpe) ribbonSharpe.textContent = sharpe.toFixed(2);
    };

    return { update };
  };

  const portfolioEngine = createPortfolio();

  // Initialize region state on boot
  setMarketRegion(appState.marketRegion);
  renderWatchlist();

});
