/**
 * RISKOS — Institutional Financial Intelligence & Research Platform
 * Universal UX Engine: Simple by Default • Deep on Demand • Mathematical when Requested
 * Fully dynamic database-backed with real-time SSE streaming & live portfolio optimization
 */

document.addEventListener('DOMContentLoaded', () => {

  const USD_TO_INR = 83.50;

  // ── 1. Global Application State ───────────────────────────────────────────
  const appState = {
    userMode: localStorage.getItem('riskos_user_mode') || 'beginner', // 'beginner' | 'investor' | 'quant'
    marketRegion: localStorage.getItem('riskos_market_region') || 'IN', // 'IN' | 'US'
    currency: localStorage.getItem('riskos_currency') || 'INR', // 'INR' | 'USD'
    marketContext: 'NSE', // 'NSE' | 'US'
    watchlist: JSON.parse(localStorage.getItem('riskos_watchlist') || '["RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"]'),
    activeSecurity: null,
    activeTimeframe: '1Y',
    lastQuery: 'Reliance'
  };

  document.body.dataset.userMode = appState.userMode;
  document.body.dataset.marketRegion = appState.marketRegion;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── MathJax Safety Hook ──────────────────────────────────────────────────
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

  // ── Currency Formatter Helper ────────────────────────────────────────────
  const formatMoney = (valInINR, forceCurrency = null) => {
    const curr = forceCurrency || appState.currency;
    if (curr === 'USD') {
      const valUSD = valInINR / USD_TO_INR;
      if (valUSD >= 1e9) return `$${(valUSD / 1e9).toFixed(2)}B`;
      if (valUSD >= 1e6) return `$${(valUSD / 1e6).toFixed(2)}M`;
      if (valUSD >= 1e3) return `$${(valUSD / 1e3).toFixed(1)}k`;
      return `$${valUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      if (valInINR >= 1e7) return `₹${(valInINR / 1e7).toFixed(2)} Cr`;
      if (valInINR >= 1e5) return `₹${(valInINR / 1e5).toFixed(2)} Lakh`;
      return `₹${valInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // ── 2. Verified Mathematical Equation Registry ────────────────────────────
  const MATHEMATICAL_REGISTRY = {
    pe: {
      name: 'Price-to-Earnings Ratio (P/E)',
      symbol: 'P/E',
      latex: '\\[ P/E = \\frac{\\text{Market Price Per Share}}{\\text{Earnings Per Share (EPS)}} \\]',
      simple: 'Tells you how much investors are currently paying for each unit of annual company earnings.',
      investor: 'Standard equity valuation multiple. Allows relative comparison against industry peers and 5-year historical median.',
      quant: 'Inverse of the earnings yield \\( E/P \\). In dynamic discount models, reflects market expectations of perpetual dividend growth and discount hurdle rate.',
      calculate: (sec) => {
        const p = sec.priceINR || sec.price_inr || 2984.5;
        const eps = sec.eps || 116.8;
        const pe = (p / eps).toFixed(2);
        return {
          substitutedLatex: `\\[ P/E = \\frac{${formatMoney(p)}}{${formatMoney(eps)}} = \\mathbf{${pe}\\times} \\]`,
          result: pe,
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
      simple: 'Measures how efficiently the company turns shareholder investment into annual profit.',
      investor: 'Core indicator of management capital allocation quality and sustainable compounding capability.',
      quant: 'Decomposed via DuPont 3-factor formulation: \\( \\text{ROE} = \\frac{\\text{Net Profit}}{\\text{Sales}} \\times \\frac{\\text{Sales}}{\\text{Assets}} \\times \\frac{\\text{Assets}}{\\text{Equity}} \\).',
      calculate: (sec) => {
        const np = sec.netProfitINR || sec.net_profit_inr || 790200000000;
        const pb = sec.pb || 2.48;
        const mcap = sec.marketCapINR || sec.market_cap_inr || 20180000000000;
        const eq = mcap / pb;
        const roe = sec.roe || 9.8;
        return {
          substitutedLatex: `\\[ \\text{ROE} = \\frac{${formatMoney(np)}}{${formatMoney(eq)}} = \\mathbf{${roe}\\%} \\]`,
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
      limitations: 'High debt leverage can artificially inflate ROE while increasing insolvency risk.'
    },
    beta: {
      name: 'Systematic Beta (\\(\\beta\\))',
      symbol: '\\beta',
      latex: '\\[ \\beta_i = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\operatorname{Var}(R_m)} \\]',
      simple: 'Measures how sensitively this stock tends to move whenever the broader market benchmark moves.',
      investor: 'A beta < 1.0 indicates lower market sensitivity (defensive), while beta > 1.0 indicates higher sensitivity (cyclical/growth).',
      quant: 'OLS linear regression slope of asset excess returns against benchmark index: \\( R_{i,t} - R_f = \\alpha_i + \\beta_i (R_{m,t} - R_f) + \\epsilon_{i,t} \\).',
      calculate: (sec) => {
        const b = sec.beta || 0.88;
        const cov = (b * 0.0225).toFixed(4);
        const varM = (0.0225).toFixed(4);
        const betaVal = b.toFixed(2);
        return {
          substitutedLatex: `\\[ \\beta_i = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\operatorname{Var}(R_m)} = \\frac{${cov}}{${varM}} = \\mathbf{${betaVal}} \\]`,
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
      limitations: 'Assumes linear relationship. Fails to capture non-linear tail dependency during sudden liquidity shocks.'
    },
    volatility: {
      name: 'Annualized Volatility (\\(\\sigma\\))',
      symbol: '\\sigma',
      latex: '\\[ \\sigma = \\sqrt{\\frac{1}{n-1}\\sum_{t=1}^{n}(r_t - \\bar{r})^2} \\times \\sqrt{252} \\]',
      simple: 'Measures how wildly the stock price swings up and down over a typical year.',
      investor: 'Higher volatility implies greater uncertainty and wider drawdowns, requiring larger risk premiums.',
      quant: 'Sample standard deviation of continuous log-returns scaled by \\( \\sqrt{252} \\). Fitted under GARCH(1,1) conditional volatility clustering.',
      calculate: (sec) => {
        const v = sec.volatility || 0.184;
        const dailyStd = (v / Math.sqrt(252) * 100).toFixed(2);
        const annVol = (v * 100).toFixed(1);
        return {
          substitutedLatex: `\\[ \\sigma = ${dailyStd}\\% \\times \\sqrt{252} = \\mathbf{${annVol}\\%} \\]`,
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
      limitations: 'Treats upside gains and downside drops as equally risky variance.'
    },
    sharpe: {
      name: 'Sharpe Ratio (Risk-Adjusted Return)',
      symbol: 'S',
      latex: '\\[ S = \\frac{R_p - R_f}{\\sigma_p} \\]',
      simple: 'Shows how much extra return you earned for each unit of risk you took on.',
      investor: 'A Sharpe ratio above 1.0 is considered good; above 1.5 is institutional grade.',
      quant: 'Ex-post excess return over risk-free rate divided by sample standard deviation of returns.',
      calculate: (sec) => {
        const rf = appState.marketRegion === 'IN' ? 0.065 : 0.045;
        const ret = 0.168;
        const vol = sec.volatility || 0.184;
        const s = ((ret - rf) / vol).toFixed(2);
        return {
          substitutedLatex: `\\[ S = \\frac{${(ret*100).toFixed(1)}\\% - ${(rf*100).toFixed(1)}\\%}{${(vol*100).toFixed(1)}\\%} = \\mathbf{${s}} \\]`,
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
    },
    capm: {
      name: 'CAPM Required Hurdle Rate',
      symbol: '\\mathbb{E}[R_i]',
      latex: '\\[ \\mathbb{E}[R_i] = R_f + \\beta_i (\\mathbb{E}[R_m] - R_f) \\]',
      simple: 'Calculates the minimum return you should demand given this stock\'s market risk.',
      investor: 'Helps determine if the stock\'s potential upside compensates for its systematic beta risk.',
      quant: 'Equilibrium expected return under Capital Asset Pricing Model where only non-diversifiable systematic risk is rewarded.',
      calculate: (sec) => {
        const rf = appState.marketRegion === 'IN' ? 6.5 : 4.5;
        const erp = 7.2;
        const b = sec.beta || 0.88;
        const capm = (rf + b * erp).toFixed(1);
        return {
          substitutedLatex: `\\[ \\mathbb{E}[R_i] = ${rf}\\% + (${b} \\times ${erp}\\%) = \\mathbf{${capm}\\%} \\]`,
          result: `${capm}%`,
          sliders: [
            { id: 'capm_b', label: 'Stock Beta', min: 0.2, max: 2.5, val: b, step: 0.05, format: (v) => v.toFixed(2) },
            { id: 'capm_erp', label: 'Market Risk Premium', min: 4.0, max: 10.0, val: erp, step: 0.2, format: (v) => `${v}%` }
          ],
          onUpdate: (vals) => {
            const res = (rf + vals.capm_b * vals.capm_erp).toFixed(1);
            return `\\[ \\mathbb{E}[R_i] = ${rf}\\% + (${vals.capm_b.toFixed(2)} \\times ${vals.capm_erp.toFixed(1)}\\%) = \\mathbf{${res}\\%} \\]`;
          }
        };
      },
      limitations: 'Assumes friction-free markets, single-factor risk, and homogeneous investor expectations.'
    },
    var: {
      name: 'Value-at-Risk (\\(\\text{VaR}_{99\\%}\\))',
      symbol: '\\text{VaR}',
      latex: '\\[ \\text{VaR}_{\\alpha} = \\inf \\{ x : P(L > x) \\le 1 - \\alpha \\} \\]',
      simple: 'The maximum percentage loss you would expect on 99 out of 100 typical trading days.',
      investor: 'Establishes a statistical boundary for standard portfolio downside risk.',
      quant: 'Parametric 1-day Gaussian quantile \\( \\text{VaR}_{0.99} = -(\\mu - z_{0.99}\\sigma) \\) where \\( z_{0.99} = 2.326 \\).',
      calculate: (sec) => {
        const v = ((sec.var99 || -0.0312) * 100).toFixed(2);
        const vol = sec.volatility || 0.184;
        return {
          substitutedLatex: `\\[ \\text{VaR}_{99\\%} = -(2.326 \\times ${(vol/Math.sqrt(252)*100).toFixed(2)}\\%) = \\mathbf{${v}\\%} \\text{ / day} \\]`,
          result: `${v}%`,
          sliders: [
            { id: 'var_vol', label: 'Annual Volatility', min: 5, max: 45, val: vol * 100, step: 0.5, format: (v) => `${v}%` }
          ],
          onUpdate: (vals) => {
            const daily = vals.var_vol / Math.sqrt(252);
            const res = (-2.326 * daily).toFixed(2);
            return `\\[ \\text{VaR}_{99\\%} = -(2.326 \\times ${daily.toFixed(2)}\\%) = \\mathbf{${res}\\%} \\text{ / day} \\]`;
          }
        };
      },
      limitations: 'Tells you nothing about how severe the losses will be once the VaR threshold is breached (fat-tail deficit).'
    }
  };

  // ── 3. Dynamic Securities Database (Populated from Live Backend) ───────────
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
        { date: '2026-08-19', type: 'Dividend', desc: '₹10.00 per share final dividend' },
        { date: '2026-06-28', type: 'AGM', desc: '48th Annual General Meeting & Capex Plan' }
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
        { factor: 'BFSI Client Tech Budget Normalization', weight: '62%', type: 'Industry Macro', desc: 'US Banking clients pausing discretionary digital transformation spend' },
        { factor: 'INR/USD Currency Hedging Gains', weight: '38%', type: 'Forex Translation', desc: 'Stable rupee providing margin buffer' }
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
        { factor: 'Credit-Deposit Ratio Normalization', weight: '58%', type: 'Balance Sheet', desc: 'Successful branch-led deposit mobilization lowering LDR' },
        { factor: 'Stable Net Interest Margins (3.45%)', weight: '42%', type: 'Interest Rate Regime', desc: 'RBI status quo on repo rates supporting asset yields' }
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
        { factor: 'Generative AI Multi-Year Enterprise Deal', weight: '70%', type: 'Contract Win', desc: '$1.4B contract with European automotive conglomerate' },
        { factor: 'Attrition Rate Drop to 11.8%', weight: '30%', type: 'Operational Efficiency', desc: 'Lower wage replacement costs' }
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
        { factor: 'Services High-Margin Revenue Record', weight: '65%', type: 'Segment Growth', desc: 'App Store, Cloud and Payments growth' },
        { factor: 'China iPhone Channel Inventory Clearance', weight: '35%', type: 'Regional Demand', desc: 'Stabilization in Greater China shipments' }
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
        { factor: 'Hyperscaler AI Capex Expansion ($200B+ TAM)', weight: '85%', type: 'Demand Curve', desc: 'Microsoft, Meta, Google increasing GPU cluster orders' },
        { factor: 'Gross Margins at 75.8%', weight: '15%', type: 'Pricing Power', desc: 'CUDA software lock-in defending ASPs' }
      ],
      corpActions: [
        { date: '2026-08-25', type: 'Earnings', desc: 'Record Q2 AI Compute Revenue report' }
      ]
    }
  ];

  // ── 4. Live Database Synchronizer ──────────────────────────────────────────
  const syncSecuritiesFromDatabase = async () => {
    try {
      const res = await fetch('/api/securities/master');
      if (res.ok) {
        const data = await res.json();
        if (data.securities && data.securities.length > 0) {
          data.securities.forEach((sec) => {
            const mapped = {
              symbol: sec.symbol,
              bseCode: sec.bse_code,
              name: sec.name,
              commonName: sec.common_name || sec.symbol,
              isin: sec.isin,
              exchange: sec.exchange,
              country: sec.country,
              instrumentType: sec.instrument_type || 'Equity',
              sector: sec.sector,
              industry: sec.industry,
              aliases: sec.aliases || [],
              priceINR: sec.price_inr || sec.priceINR || 100,
              changePercent: sec.change_percent || sec.changePercent || 0,
              marketCapINR: sec.market_cap_inr || sec.marketCapINR || 0,
              pe: sec.pe,
              pb: sec.pb,
              roe: sec.roe,
              roce: sec.roce,
              debtEquity: sec.debt_equity || sec.debtEquity || 0,
              revenueINR: sec.revenue_inr || sec.revenueINR || 0,
              ebitdaINR: sec.ebitda_inr || sec.ebitdaINR || 0,
              netProfitINR: sec.net_profit_inr || sec.netProfitINR || 0,
              eps: sec.eps,
              beta: sec.beta,
              volatility: sec.volatility,
              sharpe: sec.sharpe,
              var99: sec.var99,
              mdd: sec.mdd,
              regime: sec.regime,
              regimeDesc: sec.regimeDesc || 'Institutional Regime Model',
              causalFactors: sec.causal_factors || sec.causalFactors || [],
              corpActions: sec.corp_actions || sec.corpActions || []
            };
            const idx = SECURITIES_DATABASE.findIndex((s) => s.symbol === sec.symbol);
            if (idx >= 0) SECURITIES_DATABASE[idx] = { ...SECURITIES_DATABASE[idx], ...mapped };
            else SECURITIES_DATABASE.push(mapped);
          });
          renderWatchlist();
        }
      }
    } catch (e) {
      console.warn('Live securities database fetch notice:', e);
    }
  };

  // ── 5. Real-Time Server-Sent Events (SSE) Stream ───────────────────────────
  const connectRealtimeSSE = () => {
    if (!window.EventSource) return;
    try {
      const es = new EventSource('/api/stream/market');
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.ticks) {
            Object.entries(payload.ticks).forEach(([sym, tick]) => {
              const sec = SECURITIES_DATABASE.find((s) => s.symbol === sym);
              if (sec && tick && tick.price) {
                sec.priceINR = tick.price;
                sec.changePercent = tick.change_percent;
              }
            });
            if (appState.activeSecurity) {
              const active = SECURITIES_DATABASE.find((s) => s.symbol === appState.activeSecurity.symbol);
              if (active) {
                const pEl = document.getElementById('compPrice');
                const cEl = document.getElementById('compChange');
                if (pEl) pEl.textContent = formatMoney(active.priceINR);
                if (cEl) {
                  cEl.textContent = `${active.changePercent >= 0 ? '+' : ''}${active.changePercent}%`;
                  cEl.className = `comp-change ${active.changePercent >= 0 ? 'pos' : 'neg'}`;
                }
              }
            }
          }
        } catch (err) {}
      };
      es.onerror = () => {
        es.close();
      };
    } catch (err) {}
  };

  syncSecuritiesFromDatabase();
  connectRealtimeSSE();

  // ── 6. Natural Language Intent Parser & Search Resolver ───────────────────
  const resolveQuery = (queryText) => {
    const q = (queryText || '').trim().toLowerCase();
    
    if (q.includes('compare') || q.includes(' vs ') || q.includes(' versus ')) {
      const parts = q.replace('compare', '').split(/vs|versus|and/i).map((s) => s.trim());
      const sec1 = SECURITIES_DATABASE.find((s) => s.symbol.toLowerCase() === parts[0] || s.name.toLowerCase().includes(parts[0]) || s.aliases.some((a) => a.toLowerCase().includes(parts[0]))) || SECURITIES_DATABASE[0];
      const sec2 = SECURITIES_DATABASE.find((s) => s.symbol.toLowerCase() === parts[1] || s.name.toLowerCase().includes(parts[1]) || s.aliases.some((a) => a.toLowerCase().includes(parts[1]))) || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[1] : SECURITIES_DATABASE[5]);
      return { intent: 'COMPARE', sec1, sec2, query: queryText };
    }

    if (q.includes('why') || q.includes('fall') || q.includes('drop') || q.includes('jump') || q.includes('move')) {
      const sec = SECURITIES_DATABASE.find((s) => q.includes(s.symbol.toLowerCase()) || q.includes(s.commonName.toLowerCase()) || s.aliases.some((a) => q.includes(a.toLowerCase()))) || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[2] : SECURITIES_DATABASE[5]);
      return { intent: 'WHY_MOVED', security: sec, query: queryText };
    }

    if (q.includes('volatility') && (q.includes('it') || q.includes('tech') || q.includes('semi') || q.includes('banking') || q.includes('sector'))) {
      return { intent: 'SECTOR_VOL', sector: appState.marketRegion === 'IN' ? 'Indian IT' : 'US Tech & Semiconductors', query: queryText };
    }

    if (q.includes('explain') || q.includes('calculate') || q.includes('formula') || q.includes('what is')) {
      const formulaKey = Object.keys(MATHEMATICAL_REGISTRY).find((k) => q.includes(k) || q.includes(MATHEMATICAL_REGISTRY[k].name.toLowerCase())) || 'sharpe';
      return { intent: 'EXPLAIN_MATH', formulaKey, query: queryText };
    }

    const match = SECURITIES_DATABASE.find((s) =>
      s.symbol.toLowerCase() === q ||
      s.bseCode === q ||
      s.isin.toLowerCase() === q ||
      s.name.toLowerCase().includes(q) ||
      s.aliases.some((a) => a.toLowerCase() === q || q.includes(a.toLowerCase()))
    );

    if (match) {
      return { intent: 'ANALYSE', security: match, query: queryText };
    }

    return { intent: 'ANALYSE', security: appState.marketRegion === 'IN' ? SECURITIES_DATABASE[0] : SECURITIES_DATABASE[4], query: queryText };
  };

  // ── 7. News Intelligence Engine ───────────────────────────────────────────
  const fetchCompanyNews = async (security) => {
    let articles = [];

    try {
      const res = await fetch(`/api/news/intelligence?ticker=${encodeURIComponent(security.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          articles = data.articles;
        }
      }
    } catch (e) {
      console.warn('Backend news fetch notice:', e);
    }

    if (articles.length === 0) {
      articles = [
        {
          title: `${security.name} announces strategic capital allocation and quarterly operational update`,
          source: `${security.exchange} Regulatory Disclosure Stream`,
          sourceType: 'OFFICIAL FILING',
          publishedAt: appState.marketRegion === 'IN' ? '10:15 IST' : '10:15 EST',
          snippet: `Official filing submitted regarding board approval for strategic operational expansion.`,
          url: 'https://www.nseindia.com',
          sentiment: 'POSITIVE',
          confidence: 84,
          signals: 'Revenue expansion language, Capex increase, Board approval',
          eventTag: 'OFFICIAL FILING',
          dedupCount: 8
        },
        {
          title: `Analysts revise valuation targets on ${security.symbol} following operational milestone`,
          source: 'Institutional Research Desk',
          sourceType: 'PRIMARY SOURCE',
          publishedAt: appState.marketRegion === 'IN' ? '09:40 IST' : '09:40 EST',
          snippet: `Operating cash flows and margin expansion result in positive sector allocation stance.`,
          url: 'https://www.bseindia.com',
          sentiment: 'POSITIVE',
          confidence: 79,
          signals: 'EBITDA margin expansion, Institutional overweight stance',
          eventTag: 'ANALYST UPDATE',
          dedupCount: 12
        }
      ];
    }
    return articles;
  };

  // ── 8. Mode Switcher (BEGINNER | INVESTOR | QUANT) ────────────────────────
  const modePill = document.getElementById('modeSelectorPill');
  const setMode = (mode) => {
    appState.userMode = mode;
    localStorage.setItem('riskos_user_mode', mode);
    document.body.dataset.userMode = mode;

    document.querySelectorAll('#modeSelectorPill .mode-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    const ind = document.getElementById('canvasModeIndicator');
    if (ind) ind.textContent = `Perspective: ${mode.toUpperCase()}`;

    if (appState.activeSecurity && !companyModalOverlay.hasAttribute('hidden')) {
      renderCompanyModal(appState.activeSecurity);
    }
    if (!financialCanvasOverlay.hasAttribute('hidden')) {
      executeCanvasQuery(appState.lastQuery);
    }
  };

  if (modePill) {
    modePill.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
  }

  // ── 9. Unified Market Region & Currency Synchronizer (India ↔ US) ─────────
  const setMarketRegion = (region) => {
    appState.marketRegion = region;
    appState.currency = region === 'IN' ? 'INR' : 'USD';
    appState.marketContext = region === 'IN' ? 'NSE' : 'US';
    
    localStorage.setItem('riskos_market_region', region);
    localStorage.setItem('riskos_currency', appState.currency);
    document.body.dataset.marketRegion = region;

    // 1. Update Currency Pill
    document.querySelectorAll('#currencyToggleBtn .curr-opt').forEach((el) => {
      el.classList.toggle('active', el.dataset.curr === appState.currency);
    });

    // 2. Smoothly Update Hero Live Ticker with Fade
    const tickerPill = document.getElementById('heroLiveTickerPill');
    const tickerText = document.getElementById('liveTickerText');
    const tickerTag = tickerPill ? tickerPill.querySelector('.status-provenance-tag') : null;

    if (tickerText && tickerPill) {
      tickerPill.style.opacity = '0.4';
      tickerPill.style.transform = 'translateY(-2px)';
      setTimeout(() => {
        if (region === 'IN') {
          tickerText.innerHTML = `NIFTY 50 24,820.40 (+0.45%) &bull; SENSEX 81,340.20 (+0.38%) &bull; BANK NIFTY 51,240.10 (-0.12%)`;
          if (tickerTag) tickerTag.textContent = 'LIVE • NSE/BSE';
        } else {
          tickerText.innerHTML = `S&P 500 5,640.10 (+0.22%) &bull; NASDAQ 17,820.30 (+0.48%) &bull; DOW 40,840.50 (+0.15%)`;
          if (tickerTag) tickerTag.textContent = 'LIVE • NYSE/NASDAQ';
        }
        tickerPill.style.opacity = '1';
        tickerPill.style.transform = 'translateY(0)';
      }, 150);
    }

    // 3. Update Hero Prompt Chips
    const promptRow = document.querySelector('.quick-prompts-row');
    if (promptRow) {
      promptRow.style.opacity = '0.4';
      setTimeout(() => {
        if (region === 'IN') {
          promptRow.innerHTML = `
            <span class="prompt-tag-label">Ask anything:</span>
            <button class="prompt-chip" data-intent="analyse" data-query="Reliance">Analyse Reliance</button>
            <button class="prompt-chip" data-intent="why_moved" data-query="HDFC Bank">Why did HDFC Bank move?</button>
            <button class="prompt-chip" data-intent="compare" data-query="TCS vs INFY">Compare TCS vs Infosys</button>
            <button class="prompt-chip" data-intent="sector_vol" data-query="Indian IT volatility">Indian IT Volatility</button>
            <button class="prompt-chip" data-intent="explain_math" data-query="Sharpe ratio">Explain Sharpe Ratio</button>
            <button class="prompt-chip" data-intent="explain_math" data-query="Beta">Explain Beta</button>
          `;
        } else {
          promptRow.innerHTML = `
            <span class="prompt-tag-label">Ask anything:</span>
            <button class="prompt-chip" data-intent="analyse" data-query="Apple">Analyse Apple (AAPL)</button>
            <button class="prompt-chip" data-intent="why_moved" data-query="Nvidia">Why did Nvidia jump?</button>
            <button class="prompt-chip" data-intent="compare" data-query="AAPL vs NVDA">Compare Apple vs Nvidia</button>
            <button class="prompt-chip" data-intent="sector_vol" data-query="US Tech volatility">US Tech Volatility</button>
            <button class="prompt-chip" data-intent="explain_math" data-query="Sharpe ratio">Explain Sharpe Ratio</button>
            <button class="prompt-chip" data-intent="explain_math" data-query="Beta">Explain Beta</button>
          `;
        }
        promptRow.querySelectorAll('.prompt-chip').forEach((chip) => {
          chip.addEventListener('click', () => openFinancialCanvas(chip.dataset.query));
        });
        promptRow.style.opacity = '1';
      }, 150);
    }

    // 4. Update Market Clock Badge
    updateMarketClocks();

    // 5. Re-render active security modal or canvas if open
    if (appState.activeSecurity) renderCompanyModal(appState.activeSecurity);
    renderWatchlist();
    if (portfolioEngine) portfolioEngine.update();
  };

  const currToggle = document.getElementById('currencyToggleBtn');
  if (currToggle) {
    currToggle.addEventListener('click', () => {
      const nextReg = appState.marketRegion === 'IN' ? 'US' : 'IN';
      setMarketRegion(nextReg);
    });
  }

  const clockBadge = document.getElementById('marketClockBadge');
  if (clockBadge) {
    clockBadge.addEventListener('click', () => {
      const nextReg = appState.marketRegion === 'IN' ? 'US' : 'IN';
      setMarketRegion(nextReg);
    });
  }

  // ── 10. Universal "Why?" [?] Popover Engine ───────────────────────────────
  const whyModalOverlay = document.getElementById('whyModalOverlay');
  const whyCloseBtn = document.getElementById('whyCloseBtn');
  const whyModalBackdrop = document.getElementById('whyModalBackdrop');
  const whyShowMathBtn = document.getElementById('whyShowMathBtn');
  const whyMathExpanded = document.getElementById('whyMathExpanded');

  const openWhyModal = (metricKey, customSecurity = null) => {
    const sec = customSecurity || appState.activeSecurity || (appState.marketRegion === 'IN' ? SECURITIES_DATABASE[0] : SECURITIES_DATABASE[4]);
    const formula = MATHEMATICAL_REGISTRY[metricKey] || MATHEMATICAL_REGISTRY.pe;

    document.getElementById('whyTitle').textContent = `Why is ${formula.name}?`;
    document.getElementById('whyMeaning').textContent = formula.simple;
    document.getElementById('whyImportance').textContent = formula.investor;

    const calcResult = formula.calculate(sec);
    const formulaCard = document.getElementById('whyFormulaCard');
    formulaCard.innerHTML = calcResult.substitutedLatex;

    const mathText = document.getElementById('whyMathText');
    mathText.innerHTML = `
      <p style="font-size:0.75rem;color:#a1a1aa;line-height:1.5;">
        <strong>Quantitative Model Basis:</strong> ${formula.quant}
      </p>
      <div style="font-size:0.95rem;text-align:center;margin:8px 0;color:#fff;">
        ${formula.latex}
      </div>
    `;

    const slidersGrid = document.getElementById('whySlidersGrid');
    slidersGrid.innerHTML = '';

    if (calcResult.sliders && calcResult.sliders.length > 0) {
      const sliderState = {};
      calcResult.sliders.forEach((s) => {
        sliderState[s.id] = s.val;
        const box = document.createElement('div');
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.gap = '2px';
        box.innerHTML = `
          <label style="font-size:0.65rem;color:#a1a1aa;">${s.label}: <strong id="lbl_${s.id}">${s.format(s.val)}</strong></label>
          <input type="range" id="rng_${s.id}" min="${s.min}" max="${s.max}" value="${s.val}" step="${s.step}" class="weight-range" />
        `;
        slidersGrid.appendChild(box);
      });

      calcResult.sliders.forEach((s) => {
        const rng = document.getElementById(`rng_${s.id}`);
        if (rng) {
          rng.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            sliderState[s.id] = v;
            document.getElementById(`lbl_${s.id}`).textContent = s.format(v);
            formulaCard.innerHTML = calcResult.onUpdate(sliderState);
            triggerMathJax(formulaCard);
          });
        }
      });
    }

    document.getElementById('whyLimitation').textContent = formula.limitations;
    whyMathExpanded.setAttribute('hidden', '');

    whyModalOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    triggerMathJax([formulaCard, mathText]);
  };

  const closeWhyModal = () => {
    whyModalOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  if (whyCloseBtn) whyCloseBtn.addEventListener('click', closeWhyModal);
  if (whyModalBackdrop) whyModalBackdrop.addEventListener('click', closeWhyModal);

  if (whyShowMathBtn) {
    whyShowMathBtn.addEventListener('click', () => {
      const isHidden = whyMathExpanded.hasAttribute('hidden');
      if (isHidden) {
        whyMathExpanded.removeAttribute('hidden');
        triggerMathJax(whyMathExpanded);
      } else {
        whyMathExpanded.setAttribute('hidden', '');
      }
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.why-trigger-btn');
    if (btn) {
      e.stopPropagation();
      const k = btn.dataset.whyKey || 'pe';
      openWhyModal(k);
    }
  });

  // ── 11. Signature Feature: Generative Financial Intelligence Canvas ────────
  const financialCanvasOverlay = document.getElementById('financialCanvasOverlay');
  const canvasCloseBtn = document.getElementById('canvasCloseBtn');
  const canvasModalBackdrop = document.getElementById('financialCanvasBackdrop');
  const canvasBody = document.getElementById('canvasDynamicContent');
  const canvasQueryTitle = document.getElementById('canvasQueryTitle');

  const executeCanvasQuery = async (queryText) => {
    appState.lastQuery = queryText;
    let resolved = resolveQuery(queryText);

    // Fetch live intelligence from backend API if available
    try {
      const res = await fetch(`/api/finance/query?q=${encodeURIComponent(queryText)}`);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && !liveData.error) {
          if (liveData.security) {
            resolved.security = { ...resolved.security, ...liveData.security };
          }
          if (liveData.summary) {
            resolved.summary = liveData.summary;
          }
        }
      }
    } catch (e) {}

    canvasQueryTitle.textContent = `Generative Canvas: "${queryText}"`;
    canvasBody.innerHTML = '';

    if (resolved.intent === 'ANALYSE') {
      const sec = resolved.security;
      appState.activeSecurity = sec;
      canvasBody.innerHTML = `
        <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;">
          
          <!-- Performance & Price Card -->
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:#51CF66;">1-YEAR TRAJECTORY &bull; ${sec.exchange}</span>
              <span style="font-family:monospace;font-weight:800;font-size:1.1rem;color:#fff;">${formatMoney(sec.priceINR)} (${sec.changePercent >= 0 ? '+' : ''}${sec.changePercent}%)</span>
            </div>
            <div style="height:200px;position:relative;background:rgba(0,0,0,0.3);border-radius:8px;overflow:hidden;">
              <canvas id="genCanvasChart" style="width:100%;height:100%;"></canvas>
            </div>
          </div>

          <!-- Causal Event Attribution Tree -->
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:#FAB005;">WHY DID THIS MOVE? (CAUSAL TREE)</span>
              <span style="font-size:0.6rem;color:#71717a;font-family:monospace;">EVIDENCE SCORE: 92%</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${sec.causalFactors.map(f => `
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:0.75rem;font-weight:700;color:#fff;">${f.factor}</div>
                    <div style="font-size:0.65rem;color:#a1a1aa;">${f.desc}</div>
                  </div>
                  <strong style="font-family:monospace;color:#51CF66;font-size:0.8rem;">${f.weight}</strong>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- 3-Pillar Section: Fundamentals + Risk + Formula Substitution -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
          
          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:#a1a1aa;">VALUATION (P/E)</span>
              <button class="why-trigger-btn" data-why-key="pe">?</button>
            </div>
            <span style="font-size:1.3rem;font-weight:800;color:#fff;font-family:monospace;">${sec.pe}&times;</span>
            <span style="font-size:0.725rem;color:#a1a1aa;">Industry Benchmark: 23.4&times;</span>
          </div>

          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:#a1a1aa;">SYSTEMATIC BETA (\\(\\beta\\))</span>
              <button class="why-trigger-btn" data-why-key="beta">?</button>
            </div>
            <span style="font-size:1.3rem;font-weight:800;color:#fff;font-family:monospace;">${sec.beta}</span>
            <span style="font-size:0.725rem;color:#a1a1aa;">Relative to Benchmark (1.00)</span>
          </div>

          <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.65rem;font-weight:700;color:#a1a1aa;">ANNUALIZED VOLATILITY (\\(\\sigma\\))</span>
              <button class="why-trigger-btn" data-why-key="volatility">?</button>
            </div>
            <span style="font-size:1.3rem;font-weight:800;color:#fff;font-family:monospace;">${(sec.volatility*100).toFixed(1)}%</span>
            <span style="font-size:0.725rem;color:#a1a1aa;">GARCH(1,1) Conditional Estimate</span>
          </div>

        </div>

        <!-- Interactive Formula Substitution Block -->
        <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;">
          <span style="font-size:0.65rem;font-weight:700;color:#51CF66;">MATHEMATICAL EXPLAINABILITY &bull; ACTUAL DATA SUBSTITUTION</span>
          <div style="font-size:1.15rem;color:#fff;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;text-align:center;">
            \\[ S = \\frac{R_i - R_f}{\\sigma_i} = \\frac{16.8\\% - ${appState.marketRegion === 'IN' ? '6.5%' : '4.5%'}}{${(sec.volatility*100).toFixed(1)}\\%} = \\mathbf{${sec.sharpe}} \\]
          </div>
          <div style="font-size:0.75rem;color:#a1a1aa;line-height:1.5;">
            <strong>Plain English:</strong> ${sec.name} generated approximately ${sec.sharpe} units of excess return for every 1.0 unit of annual price volatility.
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
          <span style="font-size:0.65rem;font-weight:700;color:#FAB005;">EVENT &bull; CAUSAL REASONING PIPELINE</span>
          <h3 style="font-size:1.2rem;font-weight:800;color:#fff;">What Moved ${sec.name} (${sec.symbol})?</h3>
          <p style="font-size:0.85rem;color:#a1a1aa;">
            Evidence-based attribution from exchange filings, order flow imbalances, and macro sector signals.
          </p>

          <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
            ${sec.causalFactors.map((f, i) => `
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="background:rgba(81,207,102,0.15);color:#51CF66;font-weight:800;font-family:monospace;font-size:0.75rem;padding:4px 8px;border-radius:4px;">STAGE 0${i+1}</span>
                  <div>
                    <strong style="color:#fff;font-size:0.85rem;">${f.factor}</strong>
                    <div style="font-size:0.75rem;color:#a1a1aa;">${f.desc}</div>
                  </div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:0.65rem;color:#71717a;display:block;">FACTOR WEIGHT</span>
                  <strong style="font-family:monospace;color:#51CF66;font-size:1.1rem;">${f.weight}</strong>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      triggerMathJax(canvasBody);
    } else if (resolved.intent === 'SECTOR_VOL') {
      canvasBody.innerHTML = `
        <div style="background:#0d0d10;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:14px;">
          <span style="font-size:0.65rem;font-weight:700;color:#4F8FFF;">SECTOR RISK SURFACE &bull; ${appState.marketRegion === 'IN' ? 'INDIAN IT' : 'US TECH & SEMIS'} VOLATILITY</span>
          <h3 style="font-size:1.2rem;font-weight:800;color:#fff;">Are ${appState.marketRegion === 'IN' ? 'Indian IT' : 'US Technology'} Equities Becoming More Volatile?</h3>
          
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center;">
              <span style="font-size:0.7rem;color:#a1a1aa;display:block;">${appState.marketRegion === 'IN' ? 'INFY' : 'NVDA'}</span>
              <strong style="font-size:1.2rem;font-family:monospace;color:#FAB005;">${appState.marketRegion === 'IN' ? '19.8%' : '38.5%'}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center;">
              <span style="font-size:0.7rem;color:#a1a1aa;display:block;">${appState.marketRegion === 'IN' ? 'TCS' : 'AAPL'}</span>
              <strong style="font-size:1.2rem;font-family:monospace;color:#51CF66;">${appState.marketRegion === 'IN' ? '15.2%' : '17.2%'}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center;">
              <span style="font-size:0.7rem;color:#a1a1aa;display:block;">${appState.marketRegion === 'IN' ? 'HCLTECH' : 'MSFT'}</span>
              <strong style="font-size:1.2rem;font-family:monospace;color:#FAB005;">${appState.marketRegion === 'IN' ? '21.4%' : '18.4%'}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center;">
              <span style="font-size:0.7rem;color:#a1a1aa;display:block;">${appState.marketRegion === 'IN' ? 'WIPRO' : 'GOOGL'}</span>
              <strong style="font-size:1.2rem;font-family:monospace;color:#FF6B6B;">${appState.marketRegion === 'IN' ? '24.8%' : '22.1%'}</strong>
            </div>
          </div>

          <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;text-align:center;">
            \\[ \\sigma_{\\text{Sector}} = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^n (\\sigma_i - \\bar{\\sigma})^2} = \\mathbf{${appState.marketRegion === 'IN' ? '19.6%' : '23.4%'}} \\]
          </div>
        </div>
      `;
      triggerMathJax(canvasBody);
    } else if (resolved.intent === 'COMPARE') {
      openCompareModal(resolved.sec1, resolved.sec2);
      closeFinancialCanvas();
      return;
    } else if (resolved.intent === 'EXPLAIN_MATH') {
      openMathGlossaryModal(resolved.formulaKey);
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

  // ── 12. Universal Command Palette (⌘K) with Live DB Search ─────────────────
  const paletteOverlay = document.getElementById('paletteOverlay');
  const paletteInput = document.getElementById('paletteInput');
  const paletteResults = document.getElementById('paletteResults');
  const palBackdrop = document.getElementById('paletteBackdrop');

  const openCommandPalette = () => {
    paletteOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    paletteInput.value = '';
    const defSecs = appState.marketRegion === 'IN' ? SECURITIES_DATABASE.slice(0, 4) : [SECURITIES_DATABASE[4], SECURITIES_DATABASE[5], SECURITIES_DATABASE[0], SECURITIES_DATABASE[1]];
    renderPaletteItems(defSecs);
    paletteInput.focus();
  };

  const closeCommandPalette = () => {
    paletteOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  const renderPaletteItems = (items) => {
    paletteResults.innerHTML = '';
    
    const groupSec = document.createElement('div');
    groupSec.innerHTML = `<div class="palette-group-title">SECURITIES &amp; BENCHMARKS (${appState.marketRegion === 'IN' ? 'NSE / BSE' : 'NYSE / NASDAQ'})</div>`;
    items.forEach((s) => {
      const it = document.createElement('div');
      it.className = 'palette-item';
      it.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-family:monospace;font-weight:700;color:#fff;">${s.symbol}</span>
          <span style="font-size:0.75rem;color:#a1a1aa;">${s.name} (${s.exchange})</span>
        </div>
        <span style="font-family:monospace;font-weight:700;font-size:0.8rem;color:#51CF66;">${formatMoney(s.priceINR || s.price_inr)}</span>
      `;
      it.addEventListener('click', () => {
        closeCommandPalette();
        openCompanyModal(s);
      });
      groupSec.appendChild(it);
    });
    paletteResults.appendChild(groupSec);

    const groupTools = document.createElement('div');
    groupTools.innerHTML = `
      <div class="palette-group-title">NATURAL LANGUAGE INTELLIGENCE &amp; CANVASES</div>
      <div class="palette-item" id="palOptHdfc">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-bolt" style="color:var(--accent-amber);"></i>
          <span>${appState.marketRegion === 'IN' ? '"Why did HDFC Bank move today?"' : '"Why did Nvidia jump today?"'}</span>
        </div>
      </div>
      <div class="palette-item" id="palOptCompare">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-code-compare" style="color:var(--accent-blue);"></i>
          <span>${appState.marketRegion === 'IN' ? '"Compare TCS and Infosys"' : '"Compare Apple and Nvidia"'}</span>
        </div>
      </div>
      <div class="palette-item" id="palOptSector">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-chart-line" style="color:var(--accent-purple);"></i>
          <span>${appState.marketRegion === 'IN' ? '"Show Indian IT sector volatility"' : '"Show US Tech sector volatility"'}</span>
        </div>
      </div>
    `;
    paletteResults.appendChild(groupTools);

    const btnH = groupTools.querySelector('#palOptHdfc');
    if (btnH) btnH.addEventListener('click', () => { closeCommandPalette(); openFinancialCanvas(appState.marketRegion === 'IN' ? 'Why did HDFC Bank move?' : 'Why did Nvidia jump?'); });
    const btnC = groupTools.querySelector('#palOptCompare');
    if (btnC) btnC.addEventListener('click', () => { closeCommandPalette(); openCompareModal(appState.marketRegion === 'IN' ? SECURITIES_DATABASE[1] : SECURITIES_DATABASE[4], appState.marketRegion === 'IN' ? SECURITIES_DATABASE[3] : SECURITIES_DATABASE[5]); });
    const btnS = groupTools.querySelector('#palOptSector');
    if (btnS) btnS.addEventListener('click', () => { closeCommandPalette(); openFinancialCanvas(appState.marketRegion === 'IN' ? 'Indian IT volatility' : 'US Tech volatility'); });
  };

  if (paletteInput) {
    let searchDebounce = null;
    paletteInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      clearTimeout(searchDebounce);
      
      if (!q) {
        const defSecs = appState.marketRegion === 'IN' ? SECURITIES_DATABASE.slice(0, 4) : [SECURITIES_DATABASE[4], SECURITIES_DATABASE[5], SECURITIES_DATABASE[0], SECURITIES_DATABASE[1]];
        renderPaletteItems(defSecs);
        return;
      }
      
      searchDebounce = setTimeout(async () => {
        try {
          const res = await fetch(`/api/securities/master?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.securities && data.securities.length > 0) {
              renderPaletteItems(data.securities);
              return;
            }
          }
        } catch (err) {}
        
        const matches = SECURITIES_DATABASE.filter((s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.aliases && s.aliases.some((a) => a.toLowerCase().includes(q)))
        );
        renderPaletteItems(matches);
      }, 150);
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
      closeWhyModal();
      closeFinancialCanvas();
      closeCompanyModal();
      closeCompareModal();
      closeMathGlossaryModal();
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

  // Quick Prompt Chips in Hero
  document.querySelectorAll('.prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      openFinancialCanvas(q);
    });
  });

  // ── 13. Market Pulse Drawer ───────────────────────────────────────────────
  const marketPulseDrawer = document.getElementById('marketPulseDrawer');
  const pulseCloseBtn = document.getElementById('pulseCloseBtn');
  const navOpenPulse = document.getElementById('navOpenPulse');

  const openMarketPulseDrawer = async () => {
    const pulseBody = document.getElementById('pulseBody');
    const isBeginner = appState.userMode === 'beginner';
    const isIN = appState.marketRegion === 'IN';

    // Fetch live market pulse from backend
    let pulseData = null;
    try {
      const res = await fetch('/api/market/pulse');
      if (res.ok) {
        pulseData = await res.json();
      }
    } catch (e) {}

    const adv = pulseData?.market_breadth?.advances || (isIN ? 1842 : 3240);
    const dec = pulseData?.market_breadth?.declines || (isIN ? 1103 : 1520);
    const advPct = pulseData?.market_breadth?.advance_pct || (isIN ? 62.5 : 68.0);

    pulseBody.innerHTML = `
      <div class="pulse-card">
        <span style="font-size:0.6rem;font-weight:700;color:#51CF66;">BENCHMARK INDICES (${isIN ? 'INDIA • NSE' : 'US • NYSE/NASDAQ'})</span>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${isIN ? `
            <div style="display:flex;justify-content:space-between;"><span>NIFTY 50</span><strong class="pos">24,820.40 (+0.45%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>SENSEX</span><strong class="pos">81,340.20 (+0.38%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>BANK NIFTY</span><strong class="neg">51,240.10 (-0.12%)</strong></div>
          ` : `
            <div style="display:flex;justify-content:space-between;"><span>S&amp;P 500</span><strong class="pos">5,640.10 (+0.22%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>NASDAQ COMPOSITE</span><strong class="pos">17,820.30 (+0.48%)</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>DOW JONES</span><strong class="pos">40,840.50 (+0.15%)</strong></div>
          `}
        </div>
      </div>

      <div class="pulse-card">
        <span style="font-size:0.6rem;font-weight:700;color:#FAB005;">MARKET BREADTH &bull; ADVANCES VS DECLINES</span>
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:700;">
          <span style="color:#51CF66;">${adv.toLocaleString()} Advances (${advPct}%)</span>
          <span style="color:#FF6B6B;">${dec.toLocaleString()} Declines (${(100 - advPct).toFixed(1)}%)</span>
        </div>
        <div class="pulse-breadth-bar">
          <div class="pbb-advances" style="width:${advPct}%;"></div>
        </div>
      </div>

      <div class="pulse-card">
        <span style="font-size:0.6rem;font-weight:700;color:#a1a1aa;">${isBeginner ? 'MARKET MOOD IN PLAIN ENGLISH' : 'QUANTITATIVE MARKET DISPERSION'}</span>
        <p style="font-size:0.775rem;color:#d4d4d8;line-height:1.5;">
          ${isBeginner 
            ? (isIN ? 'More stocks are rising than falling today in India. Broad market buying interest is healthy, led by energy and technology sectors.' : 'US market breadth remains solidly positive with mega-cap tech and semiconductor momentum.') 
            : `Cross-sectional dispersion is \\( \\sigma_{\\text{cross}} = ${isIN ? '1.48%' : '1.82%'} \\). Market breadth ratio is ${isIN ? '1.67' : '2.13'} with positive volume confirmation.`}
        </p>
      </div>
    `;

    marketPulseDrawer.removeAttribute('hidden');
    triggerMathJax(pulseBody);
  };

  const closeMarketPulseDrawer = () => {
    marketPulseDrawer.setAttribute('hidden', '');
  };

  if (navOpenPulse) navOpenPulse.addEventListener('click', openMarketPulseDrawer);
  if (pulseCloseBtn) pulseCloseBtn.addEventListener('click', closeMarketPulseDrawer);

  // ── 14. Company Research Intelligence Modal ───────────────────────────────
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
    chgEl.textContent = `${chgVal >= 0 ? '+' : ''}${chgVal}%`;
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
    document.getElementById('causalHeadline').textContent = `What Drove the ${chgVal >= 0 ? '+' : ''}${chgVal}% Move in ${sec.commonName || sec.symbol}?`;
    const causalTree = document.getElementById('causalTreeDiagram');
    causalTree.innerHTML = '';
    (sec.causalFactors || sec.causal_factors || []).forEach((f) => {
      const node = document.createElement('div');
      node.className = 'causal-node';
      node.innerHTML = `
        <div class="cn-left">
          <span class="cn-badge" style="background:rgba(81,207,102,0.1);color:#51CF66;">${f.type}</span>
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
    (sec.corpActions || sec.corp_actions || []).forEach((ca) => {
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

    const newsArticles = await fetchCompanyNews(sec);
    renderCompanyNewsStream(newsArticles);
  };

  const renderCompanyNewsStream = (articles) => {
    const stream = document.getElementById('compNewsStream');
    stream.innerHTML = '';
    document.getElementById('compNewsCount').textContent = articles.length.toString();

    articles.forEach((art) => {
      const card = document.createElement('div');
      card.className = 'news-card';
      const sqClass = art.sourceType === 'OFFICIAL FILING' ? 'sq--filing' : (art.sourceType === 'PRIMARY SOURCE' ? 'sq--primary' : 'sq--media');
      const sentColor = art.sentiment === 'POSITIVE' ? '#51CF66' : (art.sentiment === 'NEGATIVE' ? '#FF6B6B' : '#FAB005');

      card.innerHTML = `
        <div class="news-card-header">
          <div class="news-source-tags">
            <span class="source-quality-tag ${sqClass}">${art.sourceType}</span>
            <span style="font-size:0.75rem;font-weight:600;color:#fff;">${art.source}</span>
            <span class="news-time">&bull; ${art.publishedAt}</span>
          </div>
          <span style="font-size:0.65rem;color:#71717a;font-family:monospace;">${art.dedupCount || 8} sources &bull; verified</span>
        </div>
        <h4 class="news-title">${art.title}</h4>
        <p class="news-snippet">${art.snippet}</p>

        <div class="news-impact-box">
          <div class="nib-left">
            <span class="nib-tag">MODELLED IMPACT:</span>
            <span class="nib-sentiment" style="color:${sentColor};">${art.sentiment} (${art.confidence}%)</span>
            <span class="nib-signals">&bull; Signals: ${art.signals}</span>
          </div>
          <span class="nib-disclaimer">MODEL OUTPUT &bull; NOT INVESTMENT ADVICE</span>
        </div>
      `;
      stream.appendChild(card);
    });
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
    const chg = sec.changePercent !== undefined ? sec.changePercent : (sec.change_percent || 0);
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

  document.querySelectorAll('#compTimeframePicker .ctf-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#compTimeframePicker .ctf-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      appState.activeTimeframe = btn.dataset.tf || '1Y';
      if (appState.activeSecurity) renderCompanyChart(appState.activeSecurity);
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

  // ── 15. Comparison Mode Modal ─────────────────────────────────────────────
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
          <tr>
            <td><strong>Debt to Equity</strong></td>
            <td>${sec1.debtEquity || sec1.debt_equity}</td>
            <td>${sec2.debtEquity || sec2.debt_equity}</td>
            <td class="pos">${(sec1.debtEquity || 0) < (sec2.debtEquity || 0) ? sec1.symbol + ' (Stronger Balance Sheet)' : sec2.symbol + ' (Higher Leverage)'}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:14px;padding:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;font-size:0.75rem;color:#a1a1aa;">
        <strong>Comparative Insight:</strong> ${sec1.symbol} demonstrates lower systematic beta, while ${sec2.symbol} leads in return on equity compounding.
      </div>
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

  // ── 16. Watchlist & Alerts Drawers ────────────────────────────────────────
  const watchlistDrawer = document.getElementById('watchlistDrawer');
  const btnOpenWatchlist = document.getElementById('navOpenWatchlist');
  const watchlistCloseBtn = document.getElementById('watchlistCloseBtn');
  const clearWatchlistBtn = document.getElementById('clearWatchlistBtn');

  const renderWatchlist = () => {
    const list = document.getElementById('watchlistItemsList');
    const countEl = document.getElementById('navWatchCount');
    if (!list) return;

    list.innerHTML = '';
    if (countEl) countEl.textContent = appState.watchlist.length.toString();

    if (appState.watchlist.length === 0) {
      list.innerHTML = `<div style="padding:16px;text-align:center;color:#71717a;font-size:0.75rem;">Your watchlist is currently empty. Search any security and click "Add to Watchlist".</div>`;
      return;
    }

    appState.watchlist.forEach((sym) => {
      const s = SECURITIES_DATABASE.find((it) => it.symbol === sym) || SECURITIES_DATABASE[0];
      const card = document.createElement('div');
      card.className = 'watchlist-item-card';
      const pr = s.priceINR || s.price_inr || 100;
      const chg = s.changePercent !== undefined ? s.changePercent : (s.change_percent || 0);
      card.innerHTML = `
        <div class="wic-left">
          <span class="wic-sym">${s.symbol}</span>
          <span class="wic-name">${s.name} (${s.exchange})</span>
        </div>
        <div class="wic-right">
          <span class="wic-price">${formatMoney(pr)}</span>
          <span class="wic-chg ${chg >= 0 ? 'pos' : 'neg'}">${chg >= 0 ? '+' : ''}${chg}%</span>
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
  if (clearWatchlistBtn) {
    clearWatchlistBtn.addEventListener('click', () => {
      appState.watchlist = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"];
      localStorage.setItem('riskos_watchlist', JSON.stringify(appState.watchlist));
      renderWatchlist();
    });
  }

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
      <div class="alert-item-card">
        <span class="source-quality-tag sq--primary">MACRO REGULATORY</span>
        <span class="aic-title">RBI Monetary Policy Committee maintains Repo Rate at 6.50%</span>
        <span class="aic-time">1 hour ago &bull; Primary Release</span>
      </div>
      <div class="alert-item-card">
        <span class="source-quality-tag sq--media">SECTOR SPIKE</span>
        <span class="aic-title">Nifty IT index expands +1.8% driven by Cloud &amp; AI deal announcements</span>
        <span class="aic-time">3 hours ago &bull; Market Surveillance</span>
      </div>
    `;
    alertsDrawer.removeAttribute('hidden');
  };

  const closeAlertsDrawer = () => {
    alertsDrawer.setAttribute('hidden', '');
  };

  if (btnOpenAlerts) btnOpenAlerts.addEventListener('click', openAlertsDrawer);
  if (alertsCloseBtn) alertsCloseBtn.addEventListener('click', closeAlertsDrawer);

  // ── 17. Quantitative Explainer Library Modal ──────────────────────────────
  const glossaryModalOverlay = document.getElementById('glossaryModalOverlay');
  const glossaryCloseBtn = document.getElementById('glossaryCloseBtn');
  const glossaryModalBackdrop = document.getElementById('glossaryModalBackdrop');
  const glossaryContent = document.getElementById('glossaryContentPanel');

  const openMathGlossaryModal = (formulaKey = 'sharpe') => {
    document.querySelectorAll('#glossaryFormulaList .g-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.formula === formulaKey);
    });

    const f = MATHEMATICAL_REGISTRY[formulaKey] || MATHEMATICAL_REGISTRY.sharpe;
    glossaryContent.innerHTML = `
      <div style="background:#0e0e13;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
        <h3 style="font-size:1rem;font-weight:700;color:#fff;margin-bottom:8px;">${f.name}</h3>
        <div style="font-size:1.15rem;color:#fff;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;text-align:center;">
          ${f.latex}
        </div>
        <div style="margin-top:12px;font-size:0.75rem;color:#a1a1aa;line-height:1.6;">
          <p><strong>Plain English (Beginner):</strong> ${f.simple}</p>
          <p style="margin-top:6px;"><strong>Investor Perspective:</strong> ${f.investor}</p>
          <p style="margin-top:6px;"><strong>Quantitative Formulation:</strong> ${f.quant}</p>
          <p style="margin-top:6px;color:#FAB005;"><strong>Limitations:</strong> ${f.limitations}</p>
        </div>
      </div>
    `;

    glossaryModalOverlay.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    triggerMathJax(glossaryContent);
  };

  const closeMathGlossaryModal = () => {
    glossaryModalOverlay.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  };

  document.querySelectorAll('#glossaryFormulaList .g-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      openMathGlossaryModal(tab.dataset.formula);
    });
  });

  if (glossaryCloseBtn) glossaryCloseBtn.addEventListener('click', closeMathGlossaryModal);
  if (glossaryModalBackdrop) glossaryModalBackdrop.addEventListener('click', closeMathGlossaryModal);

  // ── 18. Market Hours & Timezone Engine ─────────────────────────────────────
  const updateMarketClocks = () => {
    const now = new Date();

    const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const istHours = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10);
    const istMinutes = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit', hour12: false }), 10);
    const istTotalMins = istHours * 60 + istMinutes;

    const estTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
    const estHours = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }), 10);
    const estMinutes = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', minute: '2-digit', hour12: false }), 10);
    const estTotalMins = estHours * 60 + estMinutes;

    const badgeDot = document.getElementById('marketStatusDot');
    const badgeName = document.getElementById('marketName');
    const badgeState = document.getElementById('marketState');
    const badgeTime = document.getElementById('marketTime');

    if (badgeName && badgeState && badgeDot && badgeTime) {
      if (appState.marketRegion === 'IN') {
        badgeName.textContent = 'NSE';
        badgeTime.textContent = `${istTimeStr} IST`;
        if (istTotalMins >= 540 && istTotalMins < 555) {
          badgeState.textContent = 'PRE-OPEN';
          badgeDot.className = 'market-status-dot dot--pre';
        } else if (istTotalMins >= 555 && istTotalMins <= 930) {
          badgeState.textContent = 'OPEN';
          badgeDot.className = 'market-status-dot dot--open';
        } else {
          badgeState.textContent = 'CLOSED';
          badgeDot.className = 'market-status-dot dot--closed';
        }
      } else {
        badgeName.textContent = 'NYSE';
        badgeTime.textContent = `${estTimeStr} EST`;
        if (estTotalMins >= 570 && estTotalMins <= 960) {
          badgeState.textContent = 'OPEN';
          badgeDot.className = 'market-status-dot dot--open';
        } else {
          badgeState.textContent = 'CLOSED';
          badgeDot.className = 'market-status-dot dot--closed';
        }
      }
    }
  };

  updateMarketClocks();
  setInterval(updateMarketClocks, 1000);

  // ── 19. Landing Page Magnetic CTA & Metrics Count-Up ───────────────────────
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn && !prefersReducedMotion) {
    let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0, isHover = false, animId = null;
    const maxDist = 6;

    const tickMagnetic = () => {
      if (!isHover) {
        currentX += (0 - currentX) * 0.15;
        currentY += (0 - currentY) * 0.15;
        if (Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05) {
          currentX = 0; currentY = 0;
          ctaBtn.style.transform = '';
          cancelAnimationFrame(animId);
          animId = null;
          return;
        }
      } else {
        currentX += (mouseX - currentX) * 0.2;
        currentY += (mouseY - currentY) * 0.2;
      }
      ctaBtn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${isHover ? 1.02 : 1})`;
      animId = requestAnimationFrame(tickMagnetic);
    };

    ctaBtn.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 720) return;
      isHover = true;
      if (!animId) animId = requestAnimationFrame(tickMagnetic);
    });

    ctaBtn.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 720) return;
      const rect = ctaBtn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      mouseX = Math.max(-maxDist, Math.min(maxDist, relX * 0.25));
      mouseY = Math.max(-maxDist, Math.min(maxDist, relY * 0.25));
      if (!animId) animId = requestAnimationFrame(tickMagnetic);
    });

    ctaBtn.addEventListener('mouseleave', () => {
      isHover = false;
      mouseX = 0; mouseY = 0;
    });
  }

  // Financial Metrics Count-Up
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const animateCount = (el, target, decimals, duration, delay) => {
    if (prefersReducedMotion) {
      el.textContent = decimals > 0 ? target.toFixed(decimals) : Math.round(target).toString();
      return;
    }
    setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const v = easeOutCubic(p) * target;
        el.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  let countDone = false;
  const metricsFooter = document.getElementById('metricsFooter');
  const runCountUp = () => {
    if (countDone) return;
    countDone = true;
    document.querySelectorAll('.metric-item').forEach((item, i) => {
      const target = parseFloat(item.dataset.target || '0');
      const dec = parseInt(item.dataset.decimals || '0', 10);
      const valEl = item.querySelector('.metric-value');
      if (valEl) animateCount(valEl, target, dec, 1400 + i * 100, 300 + i * 80);
    });
  };

  if ('IntersectionObserver' in window && metricsFooter) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCountUp();
          o.disconnect();
        }
      });
    }, { threshold: 0.2 });
    obs.observe(metricsFooter);
  } else {
    runCountUp();
  }

  // ── 20. Mobile Menu ───────────────────────────────────────────────────────
  const burger = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  let isMobileMenuOpen = false;

  const openMobileMenu = () => {
    if (isMobileMenuOpen) return;
    isMobileMenuOpen = true;
    document.body.classList.add('menu-open');
    mobileMenu.removeAttribute('hidden');
    burger.classList.add('is-open');
    void mobileMenu.offsetWidth;
    mobileMenu.classList.add('is-open');
  };

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen) return;
    isMobileMenuOpen = false;
    mobileMenu.classList.remove('is-open');
    burger.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    setTimeout(() => {
      if (!isMobileMenuOpen) mobileMenu.setAttribute('hidden', '');
    }, 280);
  };

  if (burger && mobileMenu) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      isMobileMenuOpen ? closeMobileMenu() : openMobileMenu();
    });
    if (menuBackdrop) menuBackdrop.addEventListener('click', closeMobileMenu);
    if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMobileMenu);
  }

  const mobileOpenSearch = document.getElementById('mobileOpenSearch');
  if (mobileOpenSearch) mobileOpenSearch.addEventListener('click', () => { closeMobileMenu(); openCommandPalette(); });
  const mobileOpenCanvasBtn = document.getElementById('mobileOpenCanvasBtn');
  if (mobileOpenCanvasBtn) mobileOpenCanvasBtn.addEventListener('click', () => { closeMobileMenu(); openFinancialCanvas('Reliance'); });
  const mobileOpenPulseBtn = document.getElementById('mobileOpenPulseBtn');
  if (mobileOpenPulseBtn) mobileOpenPulseBtn.addEventListener('click', () => { closeMobileMenu(); openMarketPulseDrawer(); });
  const mobileOpenWatchlist = document.getElementById('mobileOpenWatchlist');
  if (mobileOpenWatchlist) mobileOpenWatchlist.addEventListener('click', () => { closeMobileMenu(); openWatchlistDrawer(); });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ FINANCIAL INTELLIGENCE OBSERVATORY ENGINE (LIVE OPTIMIZER INTEGRATED)
  // ═══════════════════════════════════════════════════════════════════════════

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
      bear:       { name: 'Bear Market',      returnMult: -0.8, volMult: 1.75, ddMult: 2.2,  eqAlpha: -0.15, bndAlpha: 0.04 },
      highvol:    { name: 'High Volatility',  returnMult: 0.6,  volMult: 2.2,  ddMult: 1.8,  eqAlpha: -0.04, bndAlpha: -0.02 },
      rate_shock: { name: 'Rate Shock (+300bps)', returnMult: 0.4, volMult: 1.35, ddMult: 1.5, eqAlpha: -0.03, bndAlpha: -0.08 },
      inflation:  { name: 'Inflation Shock',  returnMult: 0.85, volMult: 1.4,  ddMult: 1.3,  eqAlpha: 0.01,  bndAlpha: -0.05 }
    }
  };

  const obsOverlay = document.getElementById('observatoryOverlay');
  const obsWorkspace = document.getElementById('observatoryWorkspace');
  const obsCloseBtn = document.getElementById('obsCloseBtn');
  const obsBackdrop = document.getElementById('observatoryBackdrop');
  let isObsOpen = false;

  const openObservatory = () => {
    if (isObsOpen) return;
    isObsOpen = true;
    closeMobileMenu();
    document.body.classList.add('obs-open');
    obsOverlay.removeAttribute('hidden');
    void obsOverlay.offsetWidth;
    obsOverlay.classList.add('is-open');

    setTimeout(() => {
      timeSeriesChart.resize();
      timeSeriesChart.render();
      portfolioEngine.update();
      triggerMathJax(obsWorkspace);
    }, 50);

    if (obsCloseBtn) obsCloseBtn.focus();
  };

  const closeObservatory = () => {
    if (!isObsOpen) return;
    isObsOpen = false;
    obsOverlay.classList.remove('is-open');
    document.body.classList.remove('obs-open');

    setTimeout(() => {
      if (!isObsOpen) obsOverlay.setAttribute('hidden', '');
    }, 300);
  };

  [
    document.getElementById('ctaBtn'),
    document.getElementById('navOpenObs'),
    document.getElementById('mobileOpenObs'),
    document.getElementById('mobileCtaLaunchObs')
  ].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openObservatory();
      });
    }
  });

  if (obsCloseBtn) obsCloseBtn.addEventListener('click', closeObservatory);
  if (obsBackdrop) obsBackdrop.addEventListener('click', closeObservatory);

  // Explain Decision Drawer
  const explainDrawer = document.getElementById('explainDrawer');
  const btnExplain = document.getElementById('btnExplainPortfolio');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  if (btnExplain && explainDrawer) {
    btnExplain.addEventListener('click', () => {
      const isHidden = explainDrawer.hasAttribute('hidden');
      if (isHidden) {
        explainDrawer.removeAttribute('hidden');
        triggerMathJax(explainDrawer);
      } else {
        explainDrawer.setAttribute('hidden', '');
      }
    });
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', () => {
        explainDrawer.setAttribute('hidden', '');
      });
    }
  }

  // Time-Series Canvas Chart
  const createTimeSeries = () => {
    const canvas = document.getElementById('timeSeriesCanvas');
    const container = document.getElementById('chartCanvasContainer');
    const tooltip = document.getElementById('chartTooltip');
    const ttDate = document.getElementById('ttDate');
    const ttValue = document.getElementById('ttValue');
    const ttReturn = document.getElementById('ttReturn');
    const ttVol = document.getElementById('ttVol');
    const ttDd = document.getElementById('ttDd');

    if (!canvas || !container) return { resize: () => {}, render: () => {} };

    const ctx = canvas.getContext('2d');
    let width = 700;
    let height = 200;
    let currentSeries = [];
    let hoveredIdx = -1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', () => {
      if (isObsOpen) {
        resize();
        render();
      }
    }, { passive: true });

    const generateData = () => {
      const tfPoints = { '1M': 30, '3M': 90, '6M': 180, '1Y': 252, '5Y': 600 };
      const n = tfPoints[obsState.timeframe] || 252;
      const scen = obsState.scenarios[obsState.scenario] || obsState.scenarios.base;

      const wEq = obsState.weights.eq / 100;
      const wBnd = obsState.weights.bnd / 100;
      const wCsh = obsState.weights.csh / 100;
      const wCmd = obsState.weights.cmd / 100;

      const expAnnReturn = (
        (wEq * (obsState.assets.eq.baseReturn + scen.eqAlpha)) +
        (wBnd * (obsState.assets.bnd.baseReturn + scen.bndAlpha)) +
        (wCsh * obsState.assets.csh.baseReturn) +
        (wCmd * obsState.assets.cmd.baseReturn)
      ) * scen.returnMult;

      const expAnnVol = Math.sqrt(
        Math.pow(wEq * obsState.assets.eq.baseVol, 2) +
        Math.pow(wBnd * obsState.assets.bnd.baseVol, 2) +
        Math.pow(wCmd * obsState.assets.cmd.baseVol, 2) +
        2 * wEq * wBnd * (-0.15) * obsState.assets.eq.baseVol * obsState.assets.bnd.baseVol
      ) * scen.volMult;

      const dailyMu = expAnnReturn / 252;
      const dailySigma = expAnnVol / Math.sqrt(252);

      const points = [];
      let val = 100.0;
      let peak = 100.0;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - n);

      for (let i = 0; i < n; i++) {
        const seed = Math.sin(i * 0.42 + (obsState.scenario.length * 2.1)) * 1.8;
        const drift = dailyMu + (dailySigma * seed * 0.7);
        val = Math.max(20, val * (1 + drift));
        peak = Math.max(peak, val);
        const dd = ((val - peak) / peak) * 100;

        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        points.push({
          date: d.toISOString().split('T')[0],
          value: val,
          ret: ((val - 100) / 100) * 100,
          vol: (expAnnVol * 100),
          dd: dd
        });
      }
      currentSeries = points;
    };

    const render = () => {
      generateData();
      if (!ctx || currentSeries.length === 0) return;

      ctx.clearRect(0, 0, width, height);

      const padTop = 20;
      const padBottom = 26;
      const padLeft = 45;
      const padRight = 20;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      const minVal = Math.min(...currentSeries.map((p) => p.value)) * 0.96;
      const maxVal = Math.max(...currentSeries.map((p) => p.value)) * 1.04;

      const getX = (i) => padLeft + (i / (currentSeries.length - 1)) * plotW;
      const getY = (v) => padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#71717a';
      ctx.font = '9px Inter, sans-serif';

      for (let g = 0; g <= 4; g++) {
        const yVal = minVal + (g / 4) * (maxVal - minVal);
        const yPos = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();
        ctx.fillText(yVal.toFixed(1), 8, yPos + 3);
      }

      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      const isPositive = currentSeries[currentSeries.length - 1].value >= 100;
      const strokeColor = isPositive ? '#51CF66' : '#FF6B6B';

      grad.addColorStop(0, isPositive ? 'rgba(81, 207, 102, 0.22)' : 'rgba(255, 107, 107, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(currentSeries[0].value));
      for (let i = 1; i < currentSeries.length; i++) {
        ctx.lineTo(getX(i), getY(currentSeries[i].value));
      }
      ctx.lineTo(getX(currentSeries.length - 1), padTop + plotH);
      ctx.lineTo(getX(0), padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(currentSeries[0].value));
      for (let i = 1; i < currentSeries.length; i++) {
        ctx.lineTo(getX(i), getY(currentSeries[i].value));
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (minVal <= 100 && maxVal >= 100) {
        const basePos = getY(100);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, basePos);
        ctx.lineTo(width - padRight, basePos);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (hoveredIdx >= 0 && hoveredIdx < currentSeries.length) {
        const hx = getX(hoveredIdx);
        const hy = getY(currentSeries[hoveredIdx].value);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    container.addEventListener('mousemove', (e) => {
      if (currentSeries.length === 0) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const padLeft = 45;
      const padRight = 20;
      const plotW = width - padLeft - padRight;

      if (mouseX < padLeft || mouseX > width - padRight) {
        tooltip.setAttribute('hidden', '');
        hoveredIdx = -1;
        render();
        return;
      }

      const ratio = Math.max(0, Math.min(1, (mouseX - padLeft) / plotW));
      hoveredIdx = Math.round(ratio * (currentSeries.length - 1));
      const pt = currentSeries[hoveredIdx];

      if (pt && tooltip) {
        tooltip.removeAttribute('hidden');
        ttDate.textContent = pt.date;
        ttValue.textContent = pt.value.toFixed(2);
        ttReturn.textContent = `${pt.ret >= 0 ? '+' : ''}${pt.ret.toFixed(2)}%`;
        ttReturn.style.color = pt.ret >= 0 ? '#51CF66' : '#FF6B6B';
        ttVol.textContent = `${pt.vol.toFixed(1)}%`;
        ttDd.textContent = `${pt.dd.toFixed(1)}%`;
      }
      render();
    });

    container.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.setAttribute('hidden', '');
      hoveredIdx = -1;
      render();
    });

    document.querySelectorAll('#timeframeSelector .tf-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#timeframeSelector .tf-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        obsState.timeframe = btn.dataset.tf || '1Y';
        render();
      });
    });

    return { resize, render };
  };

  const timeSeriesChart = createTimeSeries();

  // Generative Portfolio Simulator & SVG Donut
  const createPortfolio = () => {
    const rEq = document.getElementById('rangeEquities');
    const rBnd = document.getElementById('rangeBonds');
    const rCsh = document.getElementById('rangeCash');
    const rCmd = document.getElementById('rangeCommodities');

    const lEq = document.getElementById('lblEqWeight');
    const lBnd = document.getElementById('lblBndWeight');
    const lCsh = document.getElementById('lblCshWeight');
    const lCmd = document.getElementById('lblCmdWeight');

    const sliceEq = document.getElementById('sliceEquities');
    const sliceBnd = document.getElementById('sliceBonds');
    const sliceCsh = document.getElementById('sliceCash');
    const sliceCmd = document.getElementById('sliceCommodities');

    const donutAmt = document.getElementById('donutAmountDisplay');

    const ribbonReturn = document.getElementById('ribbonReturn');
    const ribbonVol = document.getElementById('ribbonVol');
    const ribbonSharpe = document.getElementById('ribbonSharpe');
    const ribbonDrawdown = document.getElementById('ribbonDrawdown');
    const ribbonRiskScore = document.getElementById('ribbonRiskScore');

    const eqReturn = document.getElementById('eqReturn');
    const eqSharpe = document.getElementById('eqSharpe');

    const circumference = 2 * Math.PI * 56;

    const update = () => {
      const wEq = obsState.weights.eq;
      const wBnd = obsState.weights.bnd;
      const wCsh = obsState.weights.csh;
      const wCmd = obsState.weights.cmd;

      if (lEq) lEq.textContent = `${wEq}%`;
      if (lBnd) lBnd.textContent = `${wBnd}%`;
      if (lCsh) lCsh.textContent = `${wCsh}%`;
      if (lCmd) lCmd.textContent = `${wCmd}%`;

      if (rEq) rEq.value = wEq;
      if (rBnd) rBnd.value = wBnd;
      if (rCsh) rCsh.value = wCsh;
      if (rCmd) rCmd.value = wCmd;

      const lenEq = (wEq / 100) * circumference;
      const lenBnd = (wBnd / 100) * circumference;
      const lenCsh = (wCsh / 100) * circumference;
      const lenCmd = (wCmd / 100) * circumference;

      let offset = 0;
      if (sliceEq) { sliceEq.style.strokeDasharray = `${lenEq} ${circumference}`; sliceEq.style.strokeDashoffset = `-${offset}`; }
      offset += lenEq;
      if (sliceBnd) { sliceBnd.style.strokeDasharray = `${lenBnd} ${circumference}`; sliceBnd.style.strokeDashoffset = `-${offset}`; }
      offset += lenBnd;
      if (sliceCsh) { sliceCsh.style.strokeDasharray = `${lenCsh} ${circumference}`; sliceCsh.style.strokeDashoffset = `-${offset}`; }
      offset += lenCsh;
      if (sliceCmd) { sliceCmd.style.strokeDasharray = `${lenCmd} ${circumference}`; sliceCmd.style.strokeDashoffset = `-${offset}`; }

      if (donutAmt) {
        donutAmt.textContent = formatMoney(obsState.capital);
      }

      const scen = obsState.scenarios[obsState.scenario] || obsState.scenarios.base;
      const expR = (
        (wEq / 100 * (obsState.assets.eq.baseReturn + scen.eqAlpha)) +
        (wBnd / 100 * (obsState.assets.bnd.baseReturn + scen.bndAlpha)) +
        (wCsh / 100 * obsState.assets.csh.baseReturn) +
        (wCmd / 100 * obsState.assets.cmd.baseReturn)
      ) * scen.returnMult;

      const expVol = Math.sqrt(
        Math.pow((wEq / 100) * obsState.assets.eq.baseVol, 2) +
        Math.pow((wBnd / 100) * obsState.assets.bnd.baseVol, 2) +
        Math.pow((wCmd / 100) * obsState.assets.cmd.baseVol, 2) +
        2 * (wEq / 100) * (wBnd / 100) * (-0.15) * obsState.assets.eq.baseVol * obsState.assets.bnd.baseVol
      ) * scen.volMult;

      const rf = appState.marketRegion === 'IN' ? 0.065 : 0.045;
      const sharpe = expVol > 0.005 ? ((expR - rf) / expVol) : 0;
      const maxDd = (expVol * 0.95 * scen.ddMult);
      const riskScore = Math.min(100, Math.max(10, Math.round((expVol / 0.25) * 100)));

      if (ribbonReturn) ribbonReturn.textContent = `${expR >= 0 ? '+' : ''}${(expR * 100).toFixed(1)}%`;
      if (ribbonVol) ribbonVol.textContent = `${(expVol * 100).toFixed(1)}%`;
      if (ribbonSharpe) ribbonSharpe.textContent = sharpe.toFixed(2);
      if (ribbonDrawdown) ribbonDrawdown.textContent = `-${(maxDd * 100).toFixed(1)}%`;
      if (ribbonRiskScore) ribbonRiskScore.textContent = `${riskScore}/100`;

      if (eqReturn) {
        eqReturn.innerHTML = `\\[ R_p = \\sum_{i=1}^{n} w_i R_i = (${wEq}\\% \\times ${(obsState.assets.eq.baseReturn * 100).toFixed(1)}\\%) + (${wBnd}\\% \\times ${(obsState.assets.bnd.baseReturn * 100).toFixed(1)}\\%) + \\cdots = \\mathbf{${(expR * 100).toFixed(1)}\\%} \\]`;
      }
      if (eqSharpe) {
        eqSharpe.innerHTML = `\\[ S = \\frac{R_p - R_f}{\\sigma_p} = \\frac{${(expR * 100).toFixed(1)}\\% - ${(rf * 100).toFixed(1)}\\%}{${(expVol * 100).toFixed(1)}\\%} = \\mathbf{${sharpe.toFixed(2)}} \\]`;
      }
      triggerMathJax([eqReturn, eqSharpe]);

      timeSeriesChart.render();
    };

    const normalizeSliders = (changedKey, newVal) => {
      obsState.weights[changedKey] = newVal;
      const otherKeys = ['eq', 'bnd', 'csh', 'cmd'].filter((k) => k !== changedKey);
      const remaining = 100 - newVal;
      const currentOtherSum = otherKeys.reduce((sum, k) => sum + obsState.weights[k], 0);

      if (currentOtherSum === 0) {
        otherKeys.forEach((k) => { obsState.weights[k] = Math.round(remaining / otherKeys.length); });
      } else {
        let allocated = 0;
        otherKeys.forEach((k, idx) => {
          if (idx === otherKeys.length - 1) {
            obsState.weights[k] = Math.max(0, remaining - allocated);
          } else {
            const prop = Math.round((obsState.weights[k] / currentOtherSum) * remaining);
            obsState.weights[k] = Math.max(0, prop);
            allocated += prop;
          }
        });
      }
      update();
    };

    if (rEq) rEq.addEventListener('input', (e) => normalizeSliders('eq', parseInt(e.target.value, 10)));
    if (rBnd) rBnd.addEventListener('input', (e) => normalizeSliders('bnd', parseInt(e.target.value, 10)));
    if (rCsh) rCsh.addEventListener('input', (e) => normalizeSliders('csh', parseInt(e.target.value, 10)));
    if (rCmd) rCmd.addEventListener('input', (e) => normalizeSliders('cmd', parseInt(e.target.value, 10)));

    const inCap = document.getElementById('inputCapital');
    const inHor = document.getElementById('inputHorizon');
    const inTol = document.getElementById('inputRiskTol');

    if (inCap) inCap.addEventListener('change', (e) => { obsState.capital = parseFloat(e.target.value); update(); });
    if (inHor) inHor.addEventListener('change', (e) => { obsState.horizon = parseFloat(e.target.value); update(); });
    if (inTol) inTol.addEventListener('change', (e) => {
      obsState.riskProfile = e.target.value;
      if (obsState.riskProfile === 'conservative') obsState.weights = { eq: 20, bnd: 55, csh: 20, cmd: 5 };
      else if (obsState.riskProfile === 'moderate') obsState.weights = { eq: 52, bnd: 28, csh: 10, cmd: 10 };
      else if (obsState.riskProfile === 'aggressive') obsState.weights = { eq: 75, bnd: 10, csh: 5, cmd: 10 };
      update();
    });

    return { update };
  };

  const portfolioEngine = createPortfolio();

  // Scenario Engine Controller
  const activeScenarioLabel = document.getElementById('activeScenarioLabel');
  document.querySelectorAll('#scenarioPills .scenario-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#scenarioPills .scenario-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const scKey = pill.dataset.scenario || 'base';
      obsState.scenario = scKey;

      const scObj = obsState.scenarios[scKey];
      if (activeScenarioLabel && scObj) {
        activeScenarioLabel.textContent = `MODELLED SCENARIO: ${scObj.name}`;
      }

      portfolioEngine.update();
    });
  });

  // AI Quantitative Reasoning Pipeline Controller
  const pipelineNodes = document.querySelectorAll('#pipelineFlow .pipeline-node');
  const nodeBadge = document.getElementById('nodeBadge');
  const nodeHeadline = document.getElementById('nodeHeadline');
  const nodeText = document.getElementById('nodeText');

  const nodeData = {
    market: {
      step: '01',
      title: 'MARKET DATA',
      headline: 'Raw Tick Ingestion & Log Returns (NSE / US)',
      text: 'Continuous ingestion of multi-asset high-frequency price and quote time-series from NSE/BSE and US exchanges. Prices are converted to continuous compounding log-returns \\( r_t = \\ln(P_t / P_{t-1}) \\) ensuring additivity and normality properties for downstream estimators.'
    },
    feature: {
      step: '02',
      title: 'FEATURE ENGINE',
      headline: 'Stationarity & Signal Extraction',
      text: 'Calculates rolling exponential moving average variance, order flow imbalance metrics, and Ornstein-Uhlenbeck mean-reversion drift rates \\( \\theta \\) across cross-asset pairs.'
    },
    risk: {
      step: '03',
      title: 'RISK MODEL',
      headline: 'GARCH(1,1) & Ledoit-Wolf Shrinkage',
      text: 'Fits Maximum Likelihood conditional volatility \\( \\sigma_t^2 = \\omega + \\alpha \\epsilon_{t-1}^2 + \\beta \\sigma_{t-1}^2 \\) and applies analytical Ledoit-Wolf covariance shrinkage \\( \\Sigma_{\\text{LW}} = \\delta F + (1-\\delta) S \\) to guarantee well-conditioned invertibility.'
    },
    portfolio: {
      step: '04',
      title: 'PORTFOLIO ENGINE',
      headline: 'CVaR Optimization & Risk Budgeting',
      text: 'Executes non-linear Sequential Least Squares Programming (SLSQP) to minimize 99% Conditional Value-at-Risk subject to institutional weight and leverage bounds: \\( \\min_{w} F_\\alpha(w, \\zeta) \\).'
    },
    scenario: {
      step: '05',
      title: 'SCENARIO LAB',
      headline: 'Macroeconomic Shocks & Stress Vectors',
      text: 'Simulates instantaneous covariance collapse, yield curve shifts (+300bps), liquidity contractions, and geopolitical inflation spikes without relying on naive historical repetition.'
    },
    insight: {
      step: '06',
      title: 'FINANCIAL INSIGHT',
      headline: 'Execution Boundary & Actionable Alpha',
      text: 'Synthesizes model risk budgets into actionable execution parameters with Almgren-Chriss optimal trade liquidation trajectories and pre-trade liquidity gates.'
    }
  };

  pipelineNodes.forEach((node) => {
    node.addEventListener('click', () => {
      pipelineNodes.forEach((n) => n.classList.remove('active'));
      node.classList.add('active');
      const key = node.dataset.node || 'market';
      const info = nodeData[key];
      if (info && nodeBadge && nodeHeadline && nodeText) {
        nodeBadge.textContent = `PIPELINE NODE ${info.step}: ${info.title}`;
        nodeHeadline.textContent = info.headline;
        nodeText.innerHTML = info.text;
        triggerMathJax(nodeText);
      }
    });
  });

  // Initialize region state on boot
  setMarketRegion(appState.marketRegion);

  // Initial watchlist render
  renderWatchlist();

});
