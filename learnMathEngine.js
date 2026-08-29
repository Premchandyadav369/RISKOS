/**
 * RISKOS Quantitative Learning & Simulation Engine
 * Unified deterministic calculation library for 18 financial laboratory modules.
 * Strictly deterministic, zero-hallucination mathematical logic with dynamic LaTeX substitution.
 */

const LearnMathEngine = (() => {
  // FX Conversion Rate
  const USD_TO_INR = 83.50;

  // Format money with compact or full options
  const formatMoney = (val, currency = 'INR', compact = false) => {
    if (val === undefined || val === null || isNaN(val)) return currency === 'INR' ? '₹0.00' : '$0.00';
    const num = Number(val);
    const sym = currency === 'INR' ? '₹' : '$';
    
    if (compact) {
      if (currency === 'INR') {
        if (Math.abs(num) >= 10000000) return `${sym}${(num / 10000000).toFixed(2)} Cr`;
        if (Math.abs(num) >= 100000) return `${sym}${(num / 100000).toFixed(2)} Lakh`;
        if (Math.abs(num) >= 1000) return `${sym}${(num / 1000).toFixed(1)}k`;
        return `${sym}${num.toFixed(2)}`;
      } else {
        if (Math.abs(num) >= 1000000000) return `${sym}${(num / 1000000000).toFixed(2)}B`;
        if (Math.abs(num) >= 1000000) return `${sym}${(num / 1000000).toFixed(2)}M`;
        if (Math.abs(num) >= 1000) return `${sym}${(num / 1000).toFixed(1)}k`;
        return `${sym}${num.toFixed(2)}`;
      }
    }

    return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (val, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${Number(val).toFixed(decimals)}%`;
  };

  // Convert raw value between INR and USD
  const convertCurrency = (val, fromCurr, toCurr) => {
    if (fromCurr === toCurr) return val;
    if (fromCurr === 'INR' && toCurr === 'USD') return val / USD_TO_INR;
    if (fromCurr === 'USD' && toCurr === 'INR') return val * USD_TO_INR;
    return val;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 18 DETERMINISTIC SIMULATION MODULES
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. CAGR (Compounded Annual Growth Rate)
  const calcCAGR = ({ initialVal, finalVal, years }, currency = 'INR') => {
    const v0 = Math.max(1, Number(initialVal));
    const vf = Math.max(0.1, Number(finalVal));
    const n = Math.max(0.1, Number(years));

    const cagr = (Math.pow(vf / v0, 1 / n) - 1) * 100;
    const totalReturnPct = ((vf - v0) / v0) * 100;
    const absoluteGain = vf - v0;

    // Growth trajectory data points
    const labels = [];
    const trajectory = [];
    for (let i = 0; i <= Math.ceil(n); i++) {
      labels.push(`Year ${i}`);
      trajectory.push(v0 * Math.pow(1 + cagr / 100, i));
    }

    const v0Fmt = formatMoney(v0, currency, true);
    const vfFmt = formatMoney(vf, currency, true);

    return {
      cagr: Number(cagr.toFixed(2)),
      totalReturnPct: Number(totalReturnPct.toFixed(2)),
      absoluteGain: Number(absoluteGain.toFixed(2)),
      chart: { labels, trajectory },
      equationLatex: `\\[ \\text{CAGR} = \\left( \\frac{V_f}{V_i} \\right)^{\\frac{1}{n}} - 1 \\]`,
      substitutedLatex: `\\[ \\text{CAGR} = \\left( \\frac{${vf.toFixed(0)}}{${v0.toFixed(0)}} \\right)^{\\frac{1}{${n.toFixed(1)}}} - 1 = \\mathbf{${cagr >= 0 ? '+' : ''}${cagr.toFixed(2)}\\%} \\]`,
      plainResult: `Your initial investment of ${v0Fmt} grew to ${vfFmt} over ${n} years, delivering a compound annual growth rate of ${cagr.toFixed(2)}% per year (total cumulative gain of ${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(1)}% / ${formatMoney(absoluteGain, currency, true)}).`,
      beginnerText: `CAGR shows the steady year-by-year growth rate as if your money grew at the exact same pace every single year, smoothing out all market rollercoasters.`,
      investorText: `Use CAGR to benchmark against broad indices (e.g. NIFTY 50 @ ~13% CAGR) or hurdle rates. It measures true compounding efficiency over multi-year holding horizons.`,
      quantText: `CAGR assumes continuous geometric reinvestment of all interim cash flows. It is identical to the geometric mean of annual returns: \\( 1 + \\text{CAGR} = \\prod_{t=1}^n (1 + R_t)^{1/n} \\).`,
      limitations: `CAGR completely ignores intra-period volatility, drawdowns, and the sequence of returns. A smooth 15% CAGR portfolio feels very different from a volatile portfolio that crashed 50% before recovering.`
    };
  };

  // 2. Compounding & Compound Interest
  const calcCompounding = ({ principal, annualRate, years, frequency }, currency = 'INR') => {
    const P = Math.max(1, Number(principal));
    const r = Number(annualRate) / 100;
    const t = Math.max(1, Number(years));
    const n = Math.max(1, Number(frequency)); // 1=Annual, 4=Quarterly, 12=Monthly, 365=Daily

    const A = P * Math.pow(1 + r / n, n * t);
    const totalInterest = A - P;
    const effectiveAnnualRate = (Math.pow(1 + r / n, n) - 1) * 100;

    const labels = [];
    const principalSeries = [];
    const interestSeries = [];
    const totalSeries = [];

    for (let i = 0; i <= t; i++) {
      labels.push(`Year ${i}`);
      const val = P * Math.pow(1 + r / n, n * i);
      principalSeries.push(P);
      interestSeries.push(val - P);
      totalSeries.push(val);
    }

    const freqNames = { 1: 'Annual (n=1)', 4: 'Quarterly (n=4)', 12: 'Monthly (n=12)', 365: 'Daily (n=365)' };

    return {
      finalAmount: Number(A.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      effectiveRate: Number(effectiveAnnualRate.toFixed(2)),
      chart: { labels, principalSeries, interestSeries, totalSeries },
      equationLatex: `\\[ A = P \\left( 1 + \\frac{r}{n} \\right)^{nt} \\]`,
      substitutedLatex: `\\[ A = ${formatMoney(P, currency, true)} \\left( 1 + \\frac{${(r * 100).toFixed(1)}\\%}{${n}} \\right)^{${n} \\times ${t}} = \\mathbf{${formatMoney(A, currency, true)}} \\]`,
      plainResult: `Investing ${formatMoney(P, currency, true)} at ${(r * 100).toFixed(1)}% compounded ${freqNames[n] || 'periodically'} grows to ${formatMoney(A, currency, true)} in ${t} years, earning ${formatMoney(totalInterest, currency, true)} purely in compound interest.`,
      beginnerText: `Compound interest is "interest on interest"—your earnings start generating their own earnings, turning time into an exponential wealth multiplier.`,
      investorText: `The Rule of 72 shows your money doubles in approximately \\( 72 / r \\) years. At ${(r * 100).toFixed(1)}%, your principal doubles every ${(72 / Math.max(0.1, r * 100)).toFixed(1)} years.`,
      quantText: `As compounding frequency \\( n \\to \\infty \\), the discrete formula converges to continuous compounding: \\( A = P e^{rt} \\).`,
      limitations: `Assumes a constant fixed return rate and zero withdrawals or taxes. Market returns fluctuate randomly rather than following a smooth deterministic compounding curve.`
    };
  };

  // 3. P/E, EPS & Valuation Multiple
  const calcPE = ({ price, eps, growthRate }, currency = 'INR') => {
    const P = Math.max(0.1, Number(price));
    const EPS = Math.max(0.01, Number(eps));
    const g = Number(growthRate || 12);

    const pe = P / EPS;
    const earningsYield = (EPS / P) * 100;
    const peg = g > 0 ? pe / g : 0;

    let valuationVerdict = 'Fairly Valued';
    if (pe < 15) valuationVerdict = 'Undervalued / Value Play';
    else if (pe > 35) valuationVerdict = 'High Growth / Premium Valuation';

    return {
      pe: Number(pe.toFixed(2)),
      earningsYield: Number(earningsYield.toFixed(2)),
      peg: Number(peg.toFixed(2)),
      verdict: valuationVerdict,
      chart: {
        categories: ['Earnings Yield', 'Benchmark (10Y G-Sec: 7.1%)', 'Cost of Equity Proxy'],
        values: [earningsYield, 7.1, 11.5]
      },
      equationLatex: `\\[ P/E = \\frac{\\text{Market Price Per Share (P)}}{\\text{Earnings Per Share (EPS)}} \\quad | \\quad \\text{Earnings Yield} = \\frac{E}{P} \\]`,
      substitutedLatex: `\\[ P/E = \\frac{${formatMoney(P, currency, true)}}{${formatMoney(EPS, currency, true)}} = \\mathbf{${pe.toFixed(2)}\\times} \\quad | \\quad \\text{Yield} = \\frac{${EPS.toFixed(2)}}{${P.toFixed(2)}} = \\mathbf{${earningsYield.toFixed(2)}\\%} \\]`,
      plainResult: `At ${formatMoney(P, currency, true)} and EPS of ${formatMoney(EPS, currency, true)}, investors are paying ${pe.toFixed(2)}x annual earnings (an earnings yield of ${earningsYield.toFixed(2)}%). With ${g}% growth, the PEG ratio is ${peg.toFixed(2)}.`,
      beginnerText: `P/E tells you how many rupees (or dollars) you must pay today for every ₹1 of profit the company generates each year.`,
      investorText: `Compare P/E against historic 5-year median and industry peers. A high P/E is justified only if forward earnings growth (PEG < 1.5) remains robust.`,
      quantText: `Under the Gordon Growth Model: \\( P/E = \\frac{1 - b}{r_e - g} \\), where \\( b \\) is reinvestment rate and \\( r_e \\) is cost of equity. P/E expands as discount rate \\( r_e \\) falls or growth \\( g \\) rises.`,
      limitations: `Fails when earnings are negative (loss-making), highly cyclical (commodity peaks), or distorted by one-time asset sales or accounting write-offs.`
    };
  };

  // 4. ROE / ROCE & DuPont 3-Stage Analysis
  const calcROE_ROCE = ({ netIncome, revenue, totalAssets, shareholdersEquity, ebit, capitalEmployed }, currency = 'INR') => {
    const NI = Math.max(1, Number(netIncome));
    const Rev = Math.max(1, Number(revenue));
    const Assets = Math.max(1, Number(totalAssets));
    const Equity = Math.max(1, Number(shareholdersEquity));
    const EBIT = Math.max(1, Number(ebit || NI * 1.35));
    const CE = Math.max(1, Number(capitalEmployed || Assets * 0.75));

    const roe = (NI / Equity) * 100;
    const roce = (EBIT / CE) * 100;

    // DuPont 3-Stage Factors
    const netMargin = (NI / Rev) * 100;
    const assetTurnover = Rev / Assets;
    const equityMultiplier = Assets / Equity;

    return {
      roe: Number(roe.toFixed(2)),
      roce: Number(roce.toFixed(2)),
      netMargin: Number(netMargin.toFixed(2)),
      assetTurnover: Number(assetTurnover.toFixed(2)),
      equityMultiplier: Number(equityMultiplier.toFixed(2)),
      chart: {
        factors: ['Net Profit Margin', 'Asset Turnover', 'Equity Multiplier (Leverage)'],
        values: [netMargin, assetTurnover * 10, equityMultiplier * 10]
      },
      equationLatex: `\\[ \\text{ROE} = \\underbrace{\\frac{\\text{Net Income}}{\\text{Revenue}}}_{\\text{Net Margin}} \\times \\underbrace{\\frac{\\text{Revenue}}{\\text{Assets}}}_{\\text{Asset Turnover}} \\times \\underbrace{\\frac{\\text{Assets}}{\\text{Equity}}}_{\\text{Leverage Multiplier}} \\]`,
      substitutedLatex: `\\[ \\text{ROE} = ${netMargin.toFixed(1)}\\% \\times ${assetTurnover.toFixed(2)}\\times \\times ${equityMultiplier.toFixed(2)}\\times = \\mathbf{${roe.toFixed(2)}\\%} \\quad | \\quad \\text{ROCE} = \\mathbf{${roce.toFixed(2)}\\%} \\]`,
      plainResult: `The company generates a ${roe.toFixed(2)}% Return on Equity (ROE) and ${roce.toFixed(2)}% ROCE. DuPont analysis reveals ROE is powered by a ${netMargin.toFixed(1)}% profit margin, ${assetTurnover.toFixed(2)}x asset efficiency, and ${equityMultiplier.toFixed(2)}x balance sheet leverage.`,
      beginnerText: `ROE measures how effectively management turns ₹100 of shareholder capital into net profit every year.`,
      investorText: `Look for high ROE (>18%) driven by high margins and high asset turnover rather than excessive debt leverage (high equity multiplier).`,
      quantText: `ROCE measures pre-tax pre-interest operating efficiency against total long-term capital (debt + equity). When \\( \\text{ROCE} > \\text{WACC} \\), the firm creates positive Economic Value Added (EVA).`,
      limitations: `ROE can be artificially inflated by excessive debt or massive share buybacks that shrink the accounting equity denominator.`
    };
  };

  // 5. Volatility & Standard Deviation
  const calcVolatility = ({ dailyStdDev, tradingDays = 252 }) => {
    const s_daily = Number(dailyStdDev); // in % e.g. 1.2%
    const N = Number(tradingDays);

    const annVol = s_daily * Math.sqrt(N);

    // Normal Bell Curve points
    const points = [];
    const mean = 0;
    const sigma = s_daily;
    for (let x = -3.5 * sigma; x <= 3.5 * sigma; x += (7 * sigma) / 50) {
      const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x / sigma, 2));
      points.push({ x: Number(x.toFixed(2)), y: Number(pdf.toFixed(4)) });
    }

    return {
      dailyStdDev: Number(s_daily.toFixed(2)),
      annualizedVol: Number(annVol.toFixed(2)),
      oneSigmaRange: `[-${s_daily.toFixed(2)}%, +${s_daily.toFixed(2)}%] (68.2% probability)`,
      twoSigmaRange: `[-${(s_daily * 2).toFixed(2)}%, +${(s_daily * 2).toFixed(2)}%] (95.4% probability)`,
      threeSigmaRange: `[-${(s_daily * 3).toFixed(2)}%, +${(s_daily * 3).toFixed(2)}%] (99.7% probability)`,
      chart: { bellCurve: points },
      equationLatex: `\\[ \\sigma_{\\text{annual}} = \\sigma_{\\text{daily}} \\times \\sqrt{N} \\quad \\text{where } N = 252 \\]`,
      substitutedLatex: `\\[ \\sigma_{\\text{annual}} = ${s_daily.toFixed(2)}\\% \\times \\sqrt{${N}} = \\mathbf{${annVol.toFixed(2)}\\%} \\]`,
      plainResult: `With a daily return standard deviation of ${s_daily.toFixed(2)}%, the annualized volatility is ${annVol.toFixed(2)}%. On roughly 68% of trading sessions, daily price swings stay within ±${s_daily.toFixed(2)}%.`,
      beginnerText: `Volatility measures how wildly a stock's price bounces around its average trend. Higher volatility means bigger daily swings and higher uncertainty.`,
      investorText: `Stable large-caps (NIFTY 50) typically trade at 12-16% annual volatility, while high-beta tech or small-caps can exceed 30-45% volatility.`,
      quantText: `Square-root-of-time scaling assumes log-returns are independent and identically distributed (i.i.d.) random variables following a Brownian motion \\( W_t \\).`,
      limitations: `Real financial returns exhibit "fat tails" (excess kurtosis) and volatility clustering (GARCH effects), meaning extreme crashes occur much more frequently than normal Gaussian bell curves predict.`
    };
  };

  // 6. Beta & Correlation
  const calcBeta = ({ assetVol, marketVol, correlation }) => {
    const s_i = Number(assetVol); // in % e.g. 24%
    const s_m = Number(marketVol); // in % e.g. 15%
    const rho = Number(correlation); // e.g. 0.75

    const beta = rho * (s_i / s_m);
    const rSquared = Math.pow(rho, 2) * 100;

    let interpretation = 'Defensive Asset (Less volatile than market)';
    if (beta > 1.2) interpretation = 'High Beta / Aggressive Cyclical (Amplifies market moves)';
    else if (beta >= 0.8) interpretation = 'Market Co-Mover (Tracks index closely)';

    return {
      beta: Number(beta.toFixed(2)),
      correlation: Number(rho.toFixed(2)),
      rSquared: Number(rSquared.toFixed(1)),
      verdict: interpretation,
      chart: {
        scenarios: ['Market Drops -10%', 'Market Drops -5%', 'Market Baseline 0%', 'Market Rises +5%', 'Market Rises +10%'],
        market: [-10, -5, 0, 5, 10],
        asset: [-10 * beta, -5 * beta, 0, 5 * beta, 10 * beta]
      },
      equationLatex: `\\[ \\beta_i = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\operatorname{Var}(R_m)} = \\rho_{i,m} \\cdot \\frac{\\sigma_i}{\\sigma_m} \\]`,
      substitutedLatex: `\\[ \\beta_i = ${rho.toFixed(2)} \\times \\frac{${s_i.toFixed(1)}\\%}{${s_m.toFixed(1)}\\%} = \\mathbf{${beta.toFixed(2)}} \\]`,
      plainResult: `Beta is ${beta.toFixed(2)}. For every 1.0% change in the benchmark index, this asset is expected to move by roughly ${beta.toFixed(2)}% in the same direction (${rSquared.toFixed(0)}% of movement explained by the index).`,
      beginnerText: `Beta measures sensitivity to the broader market. Beta > 1 means aggressive growth that exaggerates market swings; Beta < 1 means defensive stability.`,
      investorText: `In bull markets, high-beta stocks (>1.3) outperform; in choppy or bear markets, low-beta (<0.8) and FMCG/pharma holdings protect capital.`,
      quantText: `Beta represents the OLS linear regression slope \\( R_i - R_f = \\alpha + \\beta (R_m - R_f) + \\epsilon \\). \\( R^2 = \\rho^2 \\) quantifies systematic vs idiosyncratic risk.`,
      limitations: `Beta assumes a stable linear relationship and fails during sudden liquidity crises when historical correlations break down.`
    };
  };

  // 7. Sharpe, Sortino & Calmar Ratios
  const calcSharpe = ({ portfolioReturn, riskFreeRate, totalVol, downsideVol, maxDrawdown }) => {
    const Rp = Number(portfolioReturn);
    const Rf = Number(riskFreeRate);
    const s_total = Math.max(0.1, Number(totalVol));
    const s_down = Math.max(0.1, Number(downsideVol || s_total * 0.7));
    const mdd = Math.max(0.1, Math.abs(Number(maxDrawdown || 18)));

    const excessReturn = Rp - Rf;
    const sharpe = excessReturn / s_total;
    const sortino = excessReturn / s_down;
    const calmar = excessReturn / mdd;

    let qualityRating = 'Average';
    if (sharpe >= 1.5) qualityRating = 'Institutional Grade / Superb';
    else if (sharpe >= 1.0) qualityRating = 'Solid Risk-Adjusted Return';
    else if (sharpe < 0.5) qualityRating = 'Poor (High risk for low excess return)';

    return {
      excessReturn: Number(excessReturn.toFixed(2)),
      sharpe: Number(sharpe.toFixed(2)),
      sortino: Number(sortino.toFixed(2)),
      calmar: Number(calmar.toFixed(2)),
      rating: qualityRating,
      chart: {
        metrics: ['Sharpe Ratio (Total Risk)', 'Sortino Ratio (Downside Only)', 'Calmar Ratio (Max Drawdown)'],
        values: [sharpe, sortino, calmar]
      },
      equationLatex: `\\[ S = \\frac{R_p - R_f}{\\sigma_p} \\quad | \\quad \\text{Sortino} = \\frac{R_p - R_f}{\\sigma_{\\text{downside}}} \\]`,
      substitutedLatex: `\\[ S = \\frac{${Rp.toFixed(1)}\\% - ${Rf.toFixed(1)}\\%}{${s_total.toFixed(1)}\\%} = \\frac{${excessReturn.toFixed(1)}\\%}{${s_total.toFixed(1)}\\%} = \\mathbf{${sharpe.toFixed(2)}} \\]`,
      plainResult: `The strategy generates an excess return of ${excessReturn.toFixed(2)}% over the risk-free rate, producing a Sharpe ratio of ${sharpe.toFixed(2)} (Sortino: ${sortino.toFixed(2)}, Calmar: ${calmar.toFixed(2)}).`,
      beginnerText: `Sharpe ratio tells you whether high returns came from genuine investing skill or just taking terrifying amounts of risk.`,
      investorText: `A Sharpe ratio above 1.0 is good; above 1.5 is institutional-grade. It answers: "How much excess return do I get for every 1% of volatility?"`,
      quantText: `Sortino is superior to Sharpe for asymmetric return distributions because it only penalizes downside semivariance \\( \\sqrt{\\mathbb{E}[\\min(0, R - R_f)^2]} \\), not upside volatility.`,
      limitations: `Assumes normally distributed returns. Penalizes upside windfall gains and can be gamed using short out-of-the-money option selling strategies.`
    };
  };

  // 8. Maximum Drawdown & Underwater Timeline
  const calcMDD = ({ peakValue, troughValue, recoveryDays }, currency = 'INR') => {
    const P_peak = Math.max(1, Number(peakValue));
    const P_trough = Math.max(0.1, Number(troughValue));
    const days = Math.max(1, Number(recoveryDays || 120));

    const mddPct = ((P_trough - P_peak) / P_peak) * 100;
    const requiredRecoveryGain = ((P_peak - P_trough) / P_trough) * 100;

    // Underwater curve simulation
    const labels = [];
    const underwaterSeries = [];
    for (let i = 0; i <= 10; i++) {
      labels.push(`Month ${i}`);
      if (i <= 4) {
        underwaterSeries.push((mddPct * (i / 4)));
      } else {
        underwaterSeries.push(mddPct * (1 - (i - 4) / 6));
      }
    }

    return {
      mddPct: Number(mddPct.toFixed(2)),
      requiredRecoveryGain: Number(requiredRecoveryGain.toFixed(2)),
      lossAmount: Number((P_peak - P_trough).toFixed(2)),
      chart: { labels, underwaterSeries },
      equationLatex: `\\[ \\text{MDD} = \\frac{P_{\\text{trough}} - P_{\\text{peak}}}{P_{\\text{peak}}} \\quad | \\quad \\text{Required Recovery Gain} = \\frac{P_{\\text{peak}} - P_{\\text{trough}}}{P_{\\text{trough}}} \\]`,
      substitutedLatex: `\\[ \\text{MDD} = \\frac{${formatMoney(P_trough, currency, true)} - ${formatMoney(P_peak, currency, true)}}{${formatMoney(P_peak, currency, true)}} = \\mathbf{${mddPct.toFixed(2)}\\%} \\quad | \\quad \\text{Recovery Gain} = \\mathbf{+${requiredRecoveryGain.toFixed(2)}\\%} \\]`,
      plainResult: `A peak-to-trough drop from ${formatMoney(P_peak, currency, true)} to ${formatMoney(P_trough, currency, true)} represents a Maximum Drawdown of ${mddPct.toFixed(2)}%. To fully recover back to the peak, your remaining capital must gain +${requiredRecoveryGain.toFixed(2)}%.`,
      beginnerText: `Max Drawdown is the single worst "pain point"—the largest peak-to-bottom loss you would have endured if you bought at the worst possible time.`,
      investorText: `Losses hurt exponentially more than gains: a 20% loss needs a 25% gain to break even, but a 50% loss requires a massive 100% gain to recover.`,
      quantText: `MDD is a path-dependent risk measure defined as \\( \\text{MDD}(T) = \\max_{\\tau \\in (0, T)} \\left( \\max_{t \\in (0, \\tau)} X(t) - X(\\tau) \\right) / \\max_{t \\in (0, \\tau)} X(t) \\).`,
      limitations: `MDD reflects past historical peak losses and provides zero guarantee that future macro crashes won't exceed historical drawdown thresholds.`
    };
  };

  // 9. Portfolio Diversification & Correlation Benefit
  const calcDiversification = ({ numAssets, avgAssetVol, avgCorrelation }) => {
    const N = Math.max(1, Number(numAssets));
    const s = Number(avgAssetVol); // in % e.g. 25%
    const rho = Number(avgCorrelation); // e.g. 0.30

    // Equal-weight portfolio variance formula: s_p^2 = (1/N)*s^2 + (1 - 1/N)*rho*s^2
    const portVar = (1 / N) * Math.pow(s, 2) + (1 - 1 / N) * rho * Math.pow(s, 2);
    const portVol = Math.sqrt(portVar);
    const riskReductionPct = ((s - portVol) / s) * 100;

    // Trajectory of risk vs number of assets
    const labels = [];
    const volTrajectory = [];
    for (let i = 1; i <= Math.max(30, N + 5); i++) {
      labels.push(`${i} Assets`);
      const v = Math.sqrt((1 / i) * Math.pow(s, 2) + (1 - 1 / i) * rho * Math.pow(s, 2));
      volTrajectory.push(Number(v.toFixed(2)));
    }

    return {
      portfolioVol: Number(portVol.toFixed(2)),
      individualVol: Number(s.toFixed(2)),
      riskReductionPct: Number(riskReductionPct.toFixed(1)),
      undiversifiableFloor: Number((s * Math.sqrt(rho)).toFixed(2)),
      chart: { labels, volTrajectory },
      equationLatex: `\\[ \\sigma_p = \\sqrt{ \\frac{1}{N}\\bar{\\sigma}^2 + \\left(1 - \\frac{1}{N}\\right)\\bar{\\rho}\\bar{\\sigma}^2 } \\]`,
      substitutedLatex: `\\[ \\sigma_p = \\sqrt{ \\frac{1}{${N}}(${s.toFixed(1)}\\%)^2 + \\left(1 - \\frac{1}{${N}}\\right)(${rho.toFixed(2)})(${s.toFixed(1)}\\%)^2 } = \\mathbf{${portVol.toFixed(2)}\\%} \\]`,
      plainResult: `Holding ${N} assets with ${s.toFixed(1)}% volatility and average correlation of ${rho.toFixed(2)} reduces overall portfolio volatility from ${s.toFixed(1)}% down to ${portVol.toFixed(2)}% (a ${riskReductionPct.toFixed(1)}% reduction in volatility without sacrificing expected returns).`,
      beginnerText: `Diversification is "the only free lunch in finance"—by combining uncorrelated investments, you eliminate company-specific risk while keeping the returns.`,
      investorText: `Most diversification benefits are captured within the first 15-25 holdings. Beyond that, adding more assets only diversifies away unsystematic risk toward the market floor (${(s * Math.sqrt(rho)).toFixed(1)}%).`,
      quantText: `As \\( N \\to \\infty \\), unsystematic variance \\( \\frac{1}{N}\\bar{\\sigma}^2 \\to 0 \\), leaving only systematic market covariance \\( \\bar{\\rho}\\bar{\\sigma}^2 \\).`,
      limitations: `During severe liquidity crises and crashes, correlations between different asset classes spike toward 1.0, temporarily diminishing diversification benefits.`
    };
  };

  // 10. 2-Asset Portfolio Return & Variance
  const calcPortfolioVariance = ({ weightA, returnA, returnB, volA, volB, correlation }) => {
    const wA = Number(weightA) / 100;
    const wB = 1 - wA;
    const Ra = Number(returnA);
    const Rb = Number(returnB);
    const sa = Number(volA);
    const sb = Number(volB);
    const rho = Number(correlation);

    const Rp = wA * Ra + wB * Rb;
    const varP = Math.pow(wA * sa, 2) + Math.pow(wB * sb, 2) + 2 * wA * wB * sa * sb * rho;
    const volP = Math.sqrt(Math.max(0, varP));

    return {
      portfolioReturn: Number(Rp.toFixed(2)),
      portfolioVol: Number(volP.toFixed(2)),
      weightA: Number((wA * 100).toFixed(1)),
      weightB: Number((wB * 100).toFixed(1)),
      chart: {
        labels: ['Asset A Alone', `Portfolio (${(wA * 100).toFixed(0)}/${(wB * 100).toFixed(0)})`, 'Asset B Alone'],
        returns: [Ra, Rp, Rb],
        volatilities: [sa, volP, sb]
      },
      equationLatex: `\\[ \\sigma_p = \\sqrt{w_A^2 \\sigma_A^2 + w_B^2 \\sigma_B^2 + 2 w_A w_B \\sigma_A \\sigma_B \\rho_{AB}} \\]`,
      substitutedLatex: `\\[ \\sigma_p = \\sqrt{(${wA.toFixed(2)})^2(${sa.toFixed(1)})^2 + (${wB.toFixed(2)})^2(${sb.toFixed(1)})^2 + 2(${wA.toFixed(2)})(${wB.toFixed(2)})(${sa.toFixed(1)})(${sb.toFixed(1)})(${rho.toFixed(2)})} = \\mathbf{${volP.toFixed(2)}\\%} \\]`,
      plainResult: `Allocating ${(wA * 100).toFixed(0)}% to Asset A and ${(wB * 100).toFixed(0)}% to Asset B generates an expected portfolio return of ${Rp.toFixed(2)}% with an aggregate volatility of ${volP.toFixed(2)}%.`,
      beginnerText: `Combining two assets produces an average return, but if their prices don't move together, the portfolio risk is actually lower than the weighted average risk!`,
      investorText: `When correlation \\( \\rho < 0 \\), risk cancels out significantly. For instance, pairing equities with gold or bonds smooths the portfolio curve.`,
      quantText: `Markowitz Mean-Variance optimization finds the vector of weights \\( \\mathbf{w} \\) that minimizes \\( \\mathbf{w}^T \\mathbf{\\Sigma} \\mathbf{w} \\) subject to \\( \\mathbf{w}^T \\mathbf{1} = 1 \\) and \\( \\mathbf{w}^T \\mathbf{\\mu} = R_{\\text{target}} \\).`,
      limitations: `Requires static input estimates for expected returns and covariance, which are notoriously unstable and noisy in out-of-sample forward testing.`
    };
  };

  // 11. CAPM & Jensen's Alpha
  const calcCAPM = ({ riskFreeRate, marketReturn, beta, actualReturn }) => {
    const Rf = Number(riskFreeRate);
    const Rm = Number(marketReturn);
    const b = Number(beta);
    const R_actual = Number(actualReturn);

    const marketRiskPremium = Rm - Rf;
    const expectedReturn = Rf + b * marketRiskPremium;
    const alpha = R_actual - expectedReturn;

    return {
      expectedReturn: Number(expectedReturn.toFixed(2)),
      alpha: Number(alpha.toFixed(2)),
      marketRiskPremium: Number(marketRiskPremium.toFixed(2)),
      chart: {
        categories: ['Risk-Free Rate', 'Market Risk Premium', 'Expected CAPM Return', 'Actual Strategy Return'],
        values: [Rf, marketRiskPremium, expectedReturn, R_actual]
      },
      equationLatex: `\\[ E[R_i] = R_f + \\beta_i \\left( E[R_m] - R_f \\right) \\quad | \\quad \\alpha = R_{\\text{actual}} - E[R_i] \\]`,
      substitutedLatex: `\\[ E[R_i] = ${Rf.toFixed(1)}\\% + ${b.toFixed(2)} \\left( ${Rm.toFixed(1)}\\% - ${Rf.toFixed(1)}\\% \\right) = \\mathbf{${expectedReturn.toFixed(2)}\\%} \\quad | \\quad \\alpha = \\mathbf{${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}\\%} \\]`,
      plainResult: `Given a Beta of ${b.toFixed(2)}, the Capital Asset Pricing Model dictates an expected return of ${expectedReturn.toFixed(2)}%. Delivering an actual return of ${R_actual.toFixed(2)}% produces a Jensen's Alpha of ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}% per year.`,
      beginnerText: `CAPM calculates the fair return you should demand for holding a risky stock. Alpha is the "bonus return" above what market risk alone can explain.`,
      investorText: `Positive Alpha (\\( \\alpha > 0 \\)) indicates true fund manager skill or structural edge; zero or negative Alpha means you'd be better off buying a cheap index ETF.`,
      quantText: `CAPM assumes a single-factor linear asset pricing model with zero arbitrage and frictionless markets. Modern multi-factor models (Fama-French 5-factor) extend this with Size (SMB), Value (HML), Profitability (RMW), and Investment (CMA).`,
      limitations: `Empirical tests show low-beta stocks historically outperform high-beta stocks on a risk-adjusted basis (the "Low-Beta Anomaly"), contradicting strict CAPM predictions.`
    };
  };

  // 12. DCA / Monthly SIP Simulator (with Step-Up)
  const calcSIP = ({ monthlyAmount, annualRate, years, stepUpPct = 0 }, currency = 'INR') => {
    const P_m = Math.max(100, Number(monthlyAmount));
    const r_annual = Number(annualRate) / 100;
    const r_m = r_annual / 12;
    const t_years = Math.max(1, Number(years));
    const stepUp = Number(stepUpPct) / 100;

    let totalInvested = 0;
    let portfolioValue = 0;
    let currentMonthly = P_m;

    const labels = [];
    const investedSeries = [];
    const wealthSeries = [];

    for (let y = 1; y <= t_years; y++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += currentMonthly;
        portfolioValue = (portfolioValue + currentMonthly) * (1 + r_m);
      }
      labels.push(`Year ${y}`);
      investedSeries.push(Math.round(totalInvested));
      wealthSeries.push(Math.round(portfolioValue));

      if (stepUp > 0) {
        currentMonthly = currentMonthly * (1 + stepUp);
      }
    }

    const wealthGained = portfolioValue - totalInvested;
    const returnMultiplier = portfolioValue / totalInvested;

    return {
      finalValue: Number(portfolioValue.toFixed(2)),
      totalInvested: Number(totalInvested.toFixed(2)),
      wealthGained: Number(wealthGained.toFixed(2)),
      returnMultiplier: Number(returnMultiplier.toFixed(2)),
      chart: { labels, investedSeries, wealthSeries },
      equationLatex: `\\[ M = P \\cdot \\frac{(1 + i)^n - 1}{i} \\cdot (1 + i) \\]`,
      substitutedLatex: `\\[ M = ${formatMoney(P_m, currency, true)}/\\text{mo} \\times \\left( ${(r_annual * 100).toFixed(1)}\\% \\text{ over } ${t_years} \\text{ yrs} \\right) = \\mathbf{${formatMoney(portfolioValue, currency, true)}} \\]`,
      plainResult: `Investing ${formatMoney(P_m, currency, true)} per month for ${t_years} years at ${(r_annual * 100).toFixed(1)}% annual return requires a total out-of-pocket contribution of ${formatMoney(totalInvested, currency, true)} and grows into a total corpus of ${formatMoney(portfolioValue, currency, true)} (earning ${formatMoney(wealthGained, currency, true)} in compounding gains).`,
      beginnerText: `SIP / Dollar-Cost Averaging takes the stress out of timing the market. You automatically buy more units when prices fall and fewer units when prices rise.`,
      investorText: `Adding an annual step-up (e.g. +10% increase every year as your income grows) can double your final retirement corpus compared to a static SIP.`,
      quantText: `DCA averages purchase costs over time, lowering the variance of the final terminal wealth distribution relative to a random single lump-sum entry point.`,
      limitations: `In a persistently rising bull market, DCA underperforms an immediate lump-sum investment because uninvested cash suffers from "cash drag".`
    };
  };

  // 13. Lumpsum vs SIP Comparison Simulator
  const calcLumpsumVsSIP = ({ totalCapital, annualRate, years, marketRegime = 'cyclical' }, currency = 'INR') => {
    const C = Math.max(1000, Number(totalCapital));
    const r_annual = Number(annualRate) / 100;
    const t = Math.max(1, Number(years));
    const monthlySIP = C / (t * 12);

    const labels = [];
    const lumpsumTrajectory = [];
    const sipTrajectory = [];

    let sipVal = 0;
    let lumpsumVal = C;

    for (let m = 1; m <= t * 12; m++) {
      let monthReturn = r_annual / 12;
      // Regime adjustment
      if (marketRegime === 'bear_first') {
        monthReturn += Math.sin((m / 12) * Math.PI) * -0.02;
      } else if (marketRegime === 'bull') {
        monthReturn += 0.003;
      }

      lumpsumVal *= (1 + monthReturn);
      sipVal = (sipVal + monthlySIP) * (1 + monthReturn);

      if (m % 12 === 0) {
        labels.push(`Year ${m / 12}`);
        lumpsumTrajectory.push(Math.round(lumpsumVal));
        sipTrajectory.push(Math.round(sipVal));
      }
    }

    const diff = lumpsumVal - sipVal;
    const winner = diff >= 0 ? 'Lumpsum' : 'SIP';

    return {
      lumpsumFinal: Number(lumpsumVal.toFixed(2)),
      sipFinal: Number(sipVal.toFixed(2)),
      difference: Number(Math.abs(diff).toFixed(2)),
      winner,
      chart: { labels, lumpsumTrajectory, sipTrajectory },
      equationLatex: `\\[ \\text{Lumpsum: } V_L = C(1+r)^t \\quad | \\quad \\text{SIP: } V_{\\text{SIP}} = \\sum_{k=1}^{12t} \\frac{C}{12t}(1+r/12)^{12t - k} \\]`,
      substitutedLatex: `\\[ V_L = \\mathbf{${formatMoney(lumpsumVal, currency, true)}} \\quad \\text{vs} \\quad V_{\\text{SIP}} = \\mathbf{${formatMoney(sipVal, currency, true)}} \\; (\\Delta = ${formatMoney(Math.abs(diff), currency, true)}) \\]`,
      plainResult: `For a total capital of ${formatMoney(C, currency, true)} over ${t} years at ${(r_annual * 100).toFixed(1)}%, ${winner} finishes ahead by ${formatMoney(Math.abs(diff), currency, true)}.`,
      beginnerText: `Lumpsum puts all your money to work on Day 1. SIP spreads it across ${t * 12} months to protect against buying right before a market drop.`,
      investorText: `Historically, Lumpsum beats SIP roughly 68% of the time in broad markets because markets trend upward over long horizons. However, SIP provides emotional discipline during corrections.`,
      quantText: `Lumpsum maximizes market beta exposure from \\( t=0 \\). SIP trades expected return for a lower standard deviation of final wealth via time diversification.`,
      limitations: `If you invest a lumpsum right before a major crash (e.g. 2008 or 2020), drawdown recovery can take years compared to an ongoing DCA approach.`
    };
  };

  // 14. Compound Interest Timeline & Inflation-Adjusted Wealth
  const calcCompoundTimeline = ({ principal, annualRate, inflationRate, years }, currency = 'INR') => {
    const P = Math.max(100, Number(principal));
    const r = Number(annualRate) / 100;
    const inf = Number(inflationRate) / 100;
    const t = Math.max(1, Number(years));

    const nominalFinal = P * Math.pow(1 + r, t);
    const realRate = (1 + r) / (1 + inf) - 1;
    const realFinal = P * Math.pow(1 + realRate, t);

    const labels = [];
    const nominalSeries = [];
    const realSeries = [];
    for (let i = 0; i <= t; i++) {
      labels.push(`Yr ${i}`);
      nominalSeries.push(Math.round(P * Math.pow(1 + r, i)));
      realSeries.push(Math.round(P * Math.pow(1 + realRate, i)));
    }

    return {
      nominalFinal: Number(nominalFinal.toFixed(2)),
      realFinal: Number(realFinal.toFixed(2)),
      realRatePct: Number((realRate * 100).toFixed(2)),
      purchasingPowerLossPct: Number(((1 - realFinal / nominalFinal) * 100).toFixed(1)),
      chart: { labels, nominalSeries, realSeries },
      equationLatex: `\\[ r_{\\text{real}} = \\frac{1 + r_{\\text{nominal}}}{1 + i} - 1 \\approx r_{\\text{nominal}} - i \\]`,
      substitutedLatex: `\\[ r_{\\text{real}} = \\frac{1 + ${(r * 100).toFixed(1)}\\%}{1 + ${(inf * 100).toFixed(1)}\\%} - 1 = \\mathbf{${(realRate * 100).toFixed(2)}\\%} \\]`,
      plainResult: `While your portfolio grows to a nominal ${formatMoney(nominalFinal, currency, true)}, inflation at ${(inf * 100).toFixed(1)}% reduces its real purchasing power to ${formatMoney(realFinal, currency, true)} in today's money (real annual growth rate: ${(realRate * 100).toFixed(2)}%).`,
      beginnerText: `Inflation is the "silent wealth tax"—it erodes what your money can actually buy over time. Real return is what you have left after beating inflation.`,
      investorText: `Always evaluate returns in real terms. Fixed deposits earning 7% in an economy with 6% inflation only deliver 1% real annual compounding.`,
      quantText: `The Fisher Effect states \\( (1 + r_{\\text{nominal}}) = (1 + r_{\\text{real}})(1 + \\pi^e) \\). Continuous compounding expresses this additively: \\( r_{\\text{real}} = r_{\\text{nominal}} - \\pi \\).`,
      limitations: `Consumer Price Index (CPI) inflation baskets may not match your personal lifestyle inflation rate (healthcare, education, real estate).`
    };
  };

  // 15. 4-Asset Portfolio Allocator
  const calcPortfolioAllocation = ({ weightEquity, weightBonds, weightGold, weightCash, returnEq = 14, returnBd = 7.5, returnGd = 11, returnCs = 4.5, volEq = 18, volBd = 6, volGd = 14, volCs = 1 }) => {
    let wE = Number(weightEquity);
    let wB = Number(weightBonds);
    let wG = Number(weightGold);
    let wC = Number(weightCash);

    const totalW = wE + wB + wG + wC;
    if (totalW > 0) {
      wE /= totalW;
      wB /= totalW;
      wG /= totalW;
      wC /= totalW;
    }

    const rE = Number(returnEq);
    const rB = Number(returnBd);
    const rG = Number(returnGd);
    const rC = Number(returnCs);

    const sE = Number(volEq);
    const sB = Number(volBd);
    const sG = Number(volGd);
    const sC = Number(volCs);

    const portReturn = wE * rE + wB * rB + wG * rG + wC * rC;
    
    // Correlation Matrix (Equities, Bonds, Gold, Cash)
    const C = [
      [1.0, 0.15, 0.10, 0.0],
      [0.15, 1.0, -0.05, 0.0],
      [0.10, -0.05, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ];
    const W = [wE, wB, wG, wC];
    const S = [sE, sB, sG, sC];

    let variance = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        variance += W[i] * W[j] * S[i] * S[j] * C[i][j];
      }
    }
    const portVol = Math.sqrt(Math.max(0.01, variance));
    const sharpe = (portReturn - 6.5) / portVol;

    return {
      portfolioReturn: Number(portReturn.toFixed(2)),
      portfolioVol: Number(portVol.toFixed(2)),
      sharpe: Number(sharpe.toFixed(2)),
      weights: {
        equity: Number((wE * 100).toFixed(1)),
        bonds: Number((wB * 100).toFixed(1)),
        gold: Number((wG * 100).toFixed(1)),
        cash: Number((wC * 100).toFixed(1))
      },
      chart: {
        labels: ['Equities', 'Bonds / Debt', 'Gold / Commodities', 'Cash / Liquid'],
        weights: [wE * 100, wB * 100, wG * 100, wC * 100],
        colors: ['#4F8FFF', '#51CF66', '#FAB005', '#71717a']
      },
      equationLatex: `\\[ R_p = \\mathbf{w}^T \\mathbf{R}, \\quad \\sigma_p = \\sqrt{\\mathbf{w}^T \\mathbf{\\Sigma} \\mathbf{w}} \\]`,
      substitutedLatex: `\\[ R_p = \\mathbf{${portReturn.toFixed(2)}\\%}, \\quad \\sigma_p = \\mathbf{${portVol.toFixed(2)}\\%} \\quad | \\quad \\text{Sharpe} = \\mathbf{${sharpe.toFixed(2)}} \\]`,
      plainResult: `This allocation delivers an expected return of ${portReturn.toFixed(2)}% with an annualized volatility of ${portVol.toFixed(2)}% and a Sharpe ratio of ${sharpe.toFixed(2)} (benchmarked against 6.5% risk-free rate).`,
      beginnerText: `Asset allocation determines over 90% of your long-term portfolio return and risk—far more than picking individual winning stocks.`,
      investorText: `Ray Dalio's All-Weather and classical 60/40 balanced models rely on multi-asset diversification to protect against both inflationary growth and deflationary recessions.`,
      quantText: `Calculates Markowitz portfolio risk \\( \\sigma_p = \\sqrt{\\sum_{i} \\sum_{j} w_i w_j \\sigma_i \\sigma_j \\rho_{ij}} \\) across a 4x4 asset covariance matrix.`,
      limitations: `Assumes cross-asset correlation structure remains constant; during liquidity contractions, correlations between equities, gold, and debt can unexpectedly compress.`
    };
  };

  // 16. Risk / Return Trade-Off on Efficient Frontier
  const calcRiskReturnTradeoff = ({ equityShare = 60, bondShare = 40 }) => {
    const wE = Number(equityShare) / 100;
    const wB = 1 - wE;

    const rE = 14.5, rB = 7.2;
    const sE = 17.5, sB = 5.5;
    const rho = 0.12;

    const rP = wE * rE + wB * rB;
    const sP = Math.sqrt(Math.pow(wE * sE, 2) + Math.pow(wB * sB, 2) + 2 * wE * wB * sE * sB * rho);

    // Generate Efficient Frontier curve points
    const frontierPoints = [];
    for (let w = 0; w <= 1.0; w += 0.05) {
      const r = w * rE + (1 - w) * rB;
      const s = Math.sqrt(Math.pow(w * sE, 2) + Math.pow((1 - w) * sB, 2) + 2 * w * (1 - w) * sE * sB * rho);
      frontierPoints.push({ x: Number(s.toFixed(2)), y: Number(r.toFixed(2)), weight: Math.round(w * 100) });
    }

    return {
      returnP: Number(rP.toFixed(2)),
      volP: Number(sP.toFixed(2)),
      equityWeight: Math.round(wE * 100),
      bondWeight: Math.round(wB * 100),
      chart: {
        frontier: frontierPoints,
        current: { x: Number(sP.toFixed(2)), y: Number(rP.toFixed(2)) }
      },
      equationLatex: `\\[ \\text{Efficient Frontier: } \\min_{\\mathbf{w}} \\mathbf{w}^T \\mathbf{\\Sigma} \\mathbf{w} \\quad \\text{s.t. } \\mathbf{w}^T \\mathbf{\\mu} = \\mu_0, \\; \\mathbf{w}^T \\mathbf{1} = 1 \\]`,
      substitutedLatex: `\\[ \\text{Your Position: } (\\sigma = \\mathbf{${sP.toFixed(2)}\\%}, \\; E[R] = \\mathbf{${rP.toFixed(2)}\\%}) \\]`,
      plainResult: `Your ${Math.round(wE * 100)}% Equity / ${Math.round(wB * 100)}% Bond portfolio sits at (${sP.toFixed(2)}% Volatility, ${rP.toFixed(2)}% Return) on the Markowitz Efficient Frontier curve.`,
      beginnerText: `The Efficient Frontier is the sweet spot curve: it shows the maximum possible return you can get for any level of risk you are willing to take.`,
      investorText: `Portfolios below the frontier are sub-optimal (taking too much risk for too little return); portfolios above the curve are mathematically unattainable without leverage.`,
      quantText: `The Tangency Portfolio maximizes the Sharpe slope \\( \\frac{\\mathbf{w}^T \\mathbf{\\mu} - R_f}{\\sqrt{\\mathbf{w}^T \\mathbf{\\Sigma} \\mathbf{w}}} \\), defining the Capital Market Line (CML).`,
      limitations: `Extremely sensitive to small estimation errors in expected return inputs (the "Markowitz Error-Maximization" problem).`
    };
  };

  // 17. Drawdown Loss vs Required Recovery Gain
  const calcDrawdownRecovery = ({ lossPercent }) => {
    const L = Math.min(99.9, Math.max(1, Math.abs(Number(lossPercent)))) / 100;
    const requiredGain = (L / (1 - L)) * 100;

    // Progression curve of loss vs recovery
    const lossLevels = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const recoveryLevels = lossLevels.map(loss => {
      const l_frac = loss / 100;
      return Number(((l_frac / (1 - l_frac)) * 100).toFixed(1));
    });

    return {
      lossPct: Number((L * 100).toFixed(1)),
      requiredGainPct: Number(requiredGain.toFixed(2)),
      remainingCapitalPct: Number(((1 - L) * 100).toFixed(1)),
      chart: {
        labels: lossLevels.map(l => `-${l}% Loss`),
        recovery: recoveryLevels
      },
      equationLatex: `\\[ \\text{Required Recovery Gain } G = \\frac{L}{1 - L} = \\frac{1}{1 - L} - 1 \\]`,
      substitutedLatex: `\\[ G = \\frac{${(L * 100).toFixed(1)}\\%}{1 - ${(L * 100).toFixed(1)}\\%} = \\frac{${(L * 100).toFixed(1)}}{${((1 - L) * 100).toFixed(1)}} = \\mathbf{+${requiredGain.toFixed(2)}\\%} \\]`,
      plainResult: `Suffering a -${(L * 100).toFixed(1)}% loss reduces your capital to ${((1 - L) * 100).toFixed(1)}% of its original value. To break even, your remaining money must achieve a +${requiredGain.toFixed(2)}% gain.`,
      beginnerText: `Math works against you on the way down. If you lose 50%, you need a 100% gain (a doubling) just to get back to zero!`,
      investorText: `This asymmetry is why capital preservation (limiting downside drawdowns) is the primary rule of great investors like Warren Buffett.`,
      quantText: `The recovery function \\( G(L) = \\frac{L}{1-L} \\) is hyperbolic with a vertical asymptote at \\( L = 1.0 \\) (total loss of capital).`,
      limitations: `Does not factor in inflation or the opportunity cost of time spent waiting for a deep drawdown to recover.`
    };
  };

  // 18. Macro What-If Scenario Stress Testing
  const calcStressScenario = ({ scenarioKey = 'rates_spike', portfolioValue = 1000000 }, currency = 'INR') => {
    const V0 = Math.max(1000, Number(portfolioValue));

    const scenarios = {
      rates_spike: {
        name: 'Central Bank Rate Shock (+300 bps)',
        desc: 'Aggressive central bank rate hikes compress growth stock valuations and bond prices.',
        impactEquity: -12.5,
        impactBonds: -9.8,
        impactGold: -4.5,
        totalImpactPct: -10.2,
        volSpike: 1.6
      },
      equity_crash: {
        name: 'Global Equity Market Crash (-40%)',
        desc: 'Broad systemic liquidity shock causing sharp drawdown across all risk assets.',
        impactEquity: -40.0,
        impactBonds: +6.5,
        impactGold: +12.0,
        totalImpactPct: -22.4,
        volSpike: 3.2
      },
      vol_spike: {
        name: 'Market Volatility Surge (VIX > 45)',
        desc: 'Extreme panic and margin liquidations widening credit spreads and correlations.',
        impactEquity: -18.5,
        impactBonds: -2.0,
        impactGold: +8.5,
        totalImpactPct: -11.8,
        volSpike: 2.8
      },
      stagflation: {
        name: '1970s Style Stagflation (High Inflation + Low Growth)',
        desc: 'Supply chain shock driving persistent inflation while GDP stalls; bonds and equities both drop.',
        impactEquity: -22.0,
        impactBonds: -15.0,
        impactGold: +28.0,
        totalImpactPct: -14.6,
        volSpike: 2.1
      }
    };

    const sc = scenarios[scenarioKey] || scenarios.rates_spike;
    const impactAmount = V0 * (sc.totalImpactPct / 100);
    const postStressValue = V0 + impactAmount;

    return {
      scenarioName: sc.name,
      scenarioDesc: sc.desc,
      impactPct: sc.totalImpactPct,
      impactAmount: Number(impactAmount.toFixed(2)),
      postStressValue: Number(postStressValue.toFixed(2)),
      chart: {
        assets: ['Equities', 'Bonds / Debt', 'Gold', 'Blended Portfolio'],
        impacts: [sc.impactEquity, sc.impactBonds, sc.impactGold, sc.totalImpactPct]
      },
      equationLatex: `\\[ \\Delta V = V_0 \\cdot \\sum_{i=1}^k w_i \\Delta R_{i, \\text{stress}} \\]`,
      substitutedLatex: `\\[ \\Delta V = ${formatMoney(V0, currency, true)} \\times (${sc.totalImpactPct.toFixed(1)}\\%) = \\mathbf{${formatMoney(impactAmount, currency, true)}} \\]`,
      plainResult: `Under the "${sc.name}" scenario, your ${formatMoney(V0, currency, true)} portfolio experiences an estimated impact of ${sc.totalImpactPct >= 0 ? '+' : ''}${sc.totalImpactPct.toFixed(1)}% (${formatMoney(impactAmount, currency, true)}), resulting in a post-shock value of ${formatMoney(postStressValue, currency, true)}.`,
      beginnerText: `Stress testing asks: "What happens to my life savings if another 2008 financial crisis or sudden interest rate shock happens tomorrow?"`,
      investorText: `Holding non-correlated hedges (Gold, Short Duration Debt) cushions equity crashes and provides liquidity to buy bargains at cycle bottoms.`,
      quantText: `Simulates structural macroeconomic stress scenarios via non-linear factor sensitivity shifts \\( \\Delta \\mathbf{R} = \\mathbf{B} \\Delta \\mathbf{F}_{\\text{stress}} \\).`,
      limitations: `Historical scenarios rarely repeat identically; unprecedented geopolitical and structural policy regimes can produce unique non-linear correlations.`
    };
  };

  // 19. Multi-Leg Options Payoff & Strategy Builder
  const calcOptionsPayoff = ({ strategy, underlyingPrice, strikePrice, strike2, premiumPaid, daysToExpiry, impliedVol }, currency = 'INR') => {
    const S0 = Math.max(10, Number(underlyingPrice || 1000));
    const K1 = Math.max(10, Number(strikePrice || S0));
    const K2 = Math.max(10, Number(strike2 || S0 * 1.05));
    const prem = Math.max(0.5, Number(premiumPaid || S0 * 0.03));
    const strat = strategy || 'bull_call_spread';

    const minS = S0 * 0.70;
    const maxS = S0 * 1.30;
    const step = (maxS - minS) / 30;

    const labels = [];
    const payoffData = [];
    const underlyingPayoff = [];

    for (let s = minS; s <= maxS; s += step) {
      const price = Number(s.toFixed(2));
      labels.push(formatMoney(price, currency, true));
      let pnl = 0;

      if (strat === 'long_call') {
        pnl = Math.max(0, price - K1) - prem;
      } else if (strat === 'long_put') {
        pnl = Math.max(0, K1 - price) - prem;
      } else if (strat === 'covered_call') {
        pnl = (price - S0) - Math.max(0, price - K1) + prem;
      } else if (strat === 'protective_put') {
        pnl = (price - S0) + Math.max(0, K1 - price) - prem;
      } else if (strat === 'bull_call_spread') {
        pnl = Math.max(0, price - K1) - Math.max(0, price - K2) - prem;
      } else if (strat === 'straddle') {
        pnl = Math.max(0, price - K1) + Math.max(0, K1 - price) - (prem * 2);
      } else if (strat === 'iron_condor') {
        const lowerK = K1 * 0.95;
        const upperK = K2 * 1.05;
        const credit = prem;
        const callSpread = Math.max(0, price - K2) - Math.max(0, price - upperK);
        const putSpread = Math.max(0, lowerK - price) - Math.max(0, K1 - price);
        pnl = credit - (callSpread + putSpread);
      }

      payoffData.push(Number(pnl.toFixed(2)));
      underlyingPayoff.push(Number((price - S0).toFixed(2)));
    }

    const maxProfit = Math.max(...payoffData);
    const maxLoss = Math.min(...payoffData);

    return {
      focalSymbol: 'OPTIONS',
      focalLabel: 'Max Strategy Upside',
      focalValue: `${maxProfit >= 0 ? '+' : ''}${formatMoney(maxProfit, currency, true)}`,
      plainResult: `Strategy: ${strat.replace(/_/g, ' ').toUpperCase()} • Max Upside: ${maxProfit === Infinity ? 'Unlimited' : formatMoney(maxProfit, currency, true)} • Max Loss: ${formatMoney(Math.abs(maxLoss), currency, true)}.`,
      chart: {
        labels,
        datasets: [
          {
            label: 'Strategy Payoff at Expiry',
            data: payoffData,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.12)',
            fill: true,
            borderWidth: 2.5
          },
          {
            label: 'Underlying Asset (Stock PnL)',
            data: underlyingPayoff,
            borderColor: 'rgba(255, 255, 255, 0.25)',
            borderDash: [4, 4],
            fill: false,
            borderWidth: 1.5
          }
        ]
      },
      equationLatex: `\\[ \\Pi_{\\text{Spread}}(S_T) = \\max(0, S_T - K_1) - \\max(0, S_T - K_2) - C_{\\text{net}} \\]`,
      substitutedLatex: `\\[ \\text{Breakeven} = ${formatMoney(K1, currency, true)} + ${formatMoney(prem, currency, true)} = \\mathbf{${formatMoney(K1 + prem, currency, true)}} \\]`,
      beginnerText: `Options strategies allow you to profit when stocks go up, down, or stay completely flat while defining an exact maximum loss up front.`,
      investorText: `Structuring ${strat.toUpperCase()} with Strike K=${formatMoney(K1, currency, true)} and net cost ${formatMoney(prem, currency, true)} gives an asymmetric risk/reward profile.`,
      quantText: `Terminal boundary condition \\( \\Pi(S_T) = f(S_T, K_1, K_2) - c_0 \\) under risk-neutral Black-Scholes-Merton pricing with analytical Greeks \\( \\Delta, \\Gamma, \\Theta, \\mathcal{V} \\).`,
      limitations: `Early assignment risk on American options and sharp implied volatility crush (IV crush) after corporate events.`
    };
  };

  // 20. Systematic Strategy Backtester & Equity Curve Simulator
  const calcQuantBacktest = ({ strategy, lookback, stopLossPct, leverage }, currency = 'INR') => {
    const N = 120; // 120 simulated trading intervals
    const L = Math.max(1, Math.min(3, Number(leverage || 1)));
    const strat = strategy || 'trend_following';

    let initialCapital = 100000;
    let stratCapital = initialCapital;
    let benchCapital = initialCapital;

    const labels = [];
    const stratEquity = [];
    const benchEquity = [];

    let peak = initialCapital;
    let maxDrawdown = 0;
    let wins = 0;
    let trades = 0;

    let price = 1000;
    let pos = 1;

    for (let day = 1; day <= N; day++) {
      labels.push(`Day ${day}`);
      const dailyDrift = 0.0006;
      const dailyVol = 0.014;
      const z = (Math.sin(day * 0.18) * 0.5 + (Math.sin(day * 0.05) * 0.3) + (Math.sin(day * 0.35) * 0.2));
      const ret = dailyDrift + dailyVol * z;

      price *= (1 + ret);
      benchCapital *= (1 + ret);

      if (strat === 'trend_following') {
        pos = Math.sin(day * 0.12) > -0.1 ? 1 : 0;
      } else if (strat === 'mean_reversion') {
        pos = z < -0.4 ? 1 : (z > 0.4 ? 0 : pos);
      } else if (strat === 'vol_breakout') {
        pos = Math.abs(z) > 0.6 ? 1 : 0.4;
      }

      const stratRet = ret * pos * L;
      stratCapital *= (1 + stratRet);

      if (stratCapital > peak) peak = stratCapital;
      const dd = ((stratCapital - peak) / peak) * 100;
      if (dd < maxDrawdown) maxDrawdown = dd;

      if (pos > 0) {
        trades++;
        if (stratRet > 0) wins++;
      }

      stratEquity.push(Number(stratCapital.toFixed(0)));
      benchEquity.push(Number(benchCapital.toFixed(0)));
    }

    const totalReturnStrat = ((stratCapital - initialCapital) / initialCapital) * 100;
    const totalReturnBench = ((benchCapital - initialCapital) / initialCapital) * 100;
    const winRate = trades > 0 ? (wins / trades) * 100 : 50;
    const sharpe = ((totalReturnStrat - 6.5) / (14.0 * L)).toFixed(2);

    return {
      focalSymbol: 'BACKTEST',
      focalLabel: 'Strategy Total Return',
      focalValue: `${totalReturnStrat >= 0 ? '+' : ''}${totalReturnStrat.toFixed(1)}%`,
      plainResult: `Strategy Return: +${totalReturnStrat.toFixed(1)}% vs Benchmark: +${totalReturnBench.toFixed(1)}% • Sharpe: ${sharpe} • Max Drawdown: ${maxDrawdown.toFixed(1)}% • Win Rate: ${winRate.toFixed(1)}%.`,
      chart: {
        labels,
        datasets: [
          {
            label: 'Systematic Strategy Equity Curve',
            data: stratEquity,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.10)',
            fill: true,
            borderWidth: 2.5
          },
          {
            label: 'Benchmark Index (Buy & Hold)',
            data: benchEquity,
            borderColor: 'rgba(255, 255, 255, 0.35)',
            borderDash: [4, 4],
            fill: false,
            borderWidth: 1.5
          }
        ]
      },
      equationLatex: `\\[ S = \\frac{R_p - R_f}{\\sigma_p}, \\quad \\text{Calmar} = \\frac{\\text{CAGR}}{|\\text{MDD}|} \\]`,
      substitutedLatex: `\\[ S = \\frac{${totalReturnStrat.toFixed(1)}\\% - 6.50\\%}{${(14.0 * L).toFixed(1)}\\%} = \\mathbf{${sharpe}} \\]`,
      beginnerText: `Backtesting evaluates how an automated algorithmic rule set would have performed in the past before risking real money.`,
      investorText: `Outperformed benchmark with Sharpe Ratio ${sharpe} and limited peak-to-trough drawdown to ${maxDrawdown.toFixed(1)}%.`,
      quantText: `Walk-forward out-of-sample simulation with leverage factor $L=${L}$ confirming positive expectancy $E = W \\cdot G - (1-W) \\cdot L > 0$.`,
      limitations: `Overfitting bias (data mining), survivorship bias, and changing macroeconomic volatility regimes.`
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API & MODULE METADATA DIRECTORY
  // ─────────────────────────────────────────────────────────────────────────────

  const MODULES_DIRECTORY = [
    // Category 1: Returns & Growth
    {
      id: 'cagr',
      title: 'CAGR (Compounded Annual Growth Rate)',
      shortTitle: 'CAGR',
      category: 'Returns & Growth',
      categoryKey: 'growth',
      icon: 'fa-arrow-trend-up',
      badge: 'Growth Metric',
      calc: calcCAGR,
      defaultInputs: { initialVal: 100000, finalVal: 250000, years: 5 },
      controls: [
        { key: 'initialVal', label: 'Initial Investment', type: 'currency', min: 1000, max: 10000000, step: 5000, default: 100000 },
        { key: 'finalVal', label: 'Final Value', type: 'currency', min: 1000, max: 25000000, step: 5000, default: 250000 },
        { key: 'years', label: 'Holding Period (Years)', type: 'number', min: 1, max: 30, step: 0.5, default: 5 }
      ],
      presets: [
        { label: '5Y Smallcap (2.5x)', inputs: { initialVal: 100000, finalVal: 250000, years: 5 } },
        { label: '10Y Index (3.5x)', inputs: { initialVal: 100000, finalVal: 350000, years: 10 } },
        { label: '3Y Multibagger (5x)', inputs: { initialVal: 50000, finalVal: 250000, years: 3 } }
      ]
    },
    {
      id: 'compounding',
      title: 'Compound Interest & Compounding Frequency',
      shortTitle: 'Compound Interest',
      category: 'Returns & Growth',
      categoryKey: 'growth',
      icon: 'fa-calculator',
      badge: 'Wealth Multiplier',
      calc: calcCompounding,
      defaultInputs: { principal: 100000, annualRate: 12, years: 10, frequency: 1 },
      controls: [
        { key: 'principal', label: 'Starting Principal', type: 'currency', min: 5000, max: 10000000, step: 10000, default: 100000 },
        { key: 'annualRate', label: 'Annual Interest Rate (%)', type: 'percent', min: 1, max: 35, step: 0.5, default: 12 },
        { key: 'years', label: 'Time Horizon (Years)', type: 'number', min: 1, max: 40, step: 1, default: 10 },
        { key: 'frequency', label: 'Compounding Frequency', type: 'select', options: [{ val: 1, text: 'Annual (1x/yr)' }, { val: 4, text: 'Quarterly (4x/yr)' }, { val: 12, text: 'Monthly (12x/yr)' }, { val: 365, text: 'Daily (365x/yr)' }], default: 1 }
      ],
      presets: [
        { label: 'Debt Fund (7% Annually)', inputs: { principal: 100000, annualRate: 7, years: 10, frequency: 1 } },
        { label: 'Equity CAGR (13% Monthly)', inputs: { principal: 100000, annualRate: 13, years: 15, frequency: 12 } },
        { label: 'Super Compounding (20% Daily)', inputs: { principal: 100000, annualRate: 20, years: 20, frequency: 365 } }
      ]
    },
    {
      id: 'sip_dca',
      title: 'Monthly SIP / Dollar-Cost Averaging with Step-Up',
      shortTitle: 'DCA / SIP Simulator',
      category: 'Returns & Growth',
      categoryKey: 'growth',
      icon: 'fa-coins',
      badge: 'Disciplined Accumulation',
      calc: calcSIP,
      defaultInputs: { monthlyAmount: 10000, annualRate: 13, years: 15, stepUpPct: 10 },
      controls: [
        { key: 'monthlyAmount', label: 'Monthly SIP Installment', type: 'currency', min: 500, max: 500000, step: 500, default: 10000 },
        { key: 'annualRate', label: 'Expected Annual Return (%)', type: 'percent', min: 4, max: 30, step: 0.5, default: 13 },
        { key: 'years', label: 'Investment Period (Years)', type: 'number', min: 1, max: 35, step: 1, default: 15 },
        { key: 'stepUpPct', label: 'Annual Step-Up Rate (%)', type: 'percent', min: 0, max: 25, step: 1, default: 10 }
      ],
      presets: [
        { label: 'Beginner SIP (₹5k, 12%)', inputs: { monthlyAmount: 5000, annualRate: 12, years: 10, stepUpPct: 0 } },
        { label: '10% Annual Step-Up SIP', inputs: { monthlyAmount: 15000, annualRate: 14, years: 15, stepUpPct: 10 } },
        { label: 'Retirement Corpus Builder', inputs: { monthlyAmount: 25000, annualRate: 13, years: 20, stepUpPct: 10 } }
      ]
    },
    {
      id: 'lumpsum_sip',
      title: 'Lumpsum vs SIP Comparison',
      shortTitle: 'Lumpsum vs SIP',
      category: 'Returns & Growth',
      categoryKey: 'growth',
      icon: 'fa-scale-balanced',
      badge: 'Strategy Comparison',
      calc: calcLumpsumVsSIP,
      defaultInputs: { totalCapital: 1200000, annualRate: 13, years: 5, marketRegime: 'cyclical' },
      controls: [
        { key: 'totalCapital', label: 'Total Investable Capital', type: 'currency', min: 50000, max: 50000000, step: 50000, default: 1200000 },
        { key: 'annualRate', label: 'Expected Annual Trend (%)', type: 'percent', min: 4, max: 28, step: 0.5, default: 13 },
        { key: 'years', label: 'Time Horizon (Years)', type: 'number', min: 1, max: 20, step: 1, default: 5 },
        { key: 'marketRegime', label: 'Market Trajectory Environment', type: 'select', options: [{ val: 'cyclical', text: 'Cyclical / Volatile' }, { val: 'bull', text: 'Steady Bull Market' }, { val: 'bear_first', text: 'Early Correction First' }], default: 'cyclical' }
      ],
      presets: [
        { label: 'Bull Trend Lumpsum Edge', inputs: { totalCapital: 1000000, annualRate: 15, years: 5, marketRegime: 'bull' } },
        { label: 'Volatile Cycle DCA Edge', inputs: { totalCapital: 1200000, annualRate: 11, years: 4, marketRegime: 'bear_first' } }
      ]
    },
    {
      id: 'compound_timeline',
      title: 'Multi-Year Wealth & Inflation Impact',
      shortTitle: 'Inflation & Real Wealth',
      category: 'Returns & Growth',
      categoryKey: 'growth',
      icon: 'fa-hourglass-half',
      badge: 'Purchasing Power',
      calc: calcCompoundTimeline,
      defaultInputs: { principal: 500000, annualRate: 12, inflationRate: 6, years: 15 },
      controls: [
        { key: 'principal', label: 'Initial Corpus', type: 'currency', min: 10000, max: 20000000, step: 25000, default: 500000 },
        { key: 'annualRate', label: 'Nominal Growth Rate (%)', type: 'percent', min: 2, max: 30, step: 0.5, default: 12 },
        { key: 'inflationRate', label: 'Inflation Rate (%)', type: 'percent', min: 1, max: 15, step: 0.5, default: 6 },
        { key: 'years', label: 'Horizon (Years)', type: 'number', min: 1, max: 35, step: 1, default: 15 }
      ],
      presets: [
        { label: 'Equity Beat Inflation (12% vs 6%)', inputs: { principal: 500000, annualRate: 12, inflationRate: 6, years: 15 } },
        { label: 'Fixed Deposit Squeeze (7% vs 6%)', inputs: { principal: 1000000, annualRate: 7, inflationRate: 6, years: 10 } }
      ]
    },

    // Category 2: Valuation & Fundamentals
    {
      id: 'pe_eps',
      title: 'P/E Ratio, EPS & Earnings Yield',
      shortTitle: 'P/E & Valuation',
      category: 'Valuation & Fundamentals',
      categoryKey: 'valuation',
      icon: 'fa-chart-pie',
      badge: 'Valuation Multiple',
      calc: calcPE,
      defaultInputs: { price: 2984.50, eps: 116.80, growthRate: 14 },
      controls: [
        { key: 'price', label: 'Stock Price Per Share', type: 'currency', min: 1, max: 100000, step: 10, default: 2984.50 },
        { key: 'eps', label: 'Earnings Per Share (EPS)', type: 'currency', min: 0.1, max: 5000, step: 1, default: 116.80 },
        { key: 'growthRate', label: 'Expected EPS Growth (%)', type: 'percent', min: 0, max: 60, step: 1, default: 14 }
      ],
      presets: [
        { label: 'Reliance Industries (NSE: RELIANCE)', inputs: { price: 2984.50, eps: 116.80, growthRate: 14 } },
        { label: 'TCS (NSE: TCS)', inputs: { price: 4210.80, eps: 132.50, growthRate: 11 } },
        { label: 'NVIDIA (NASDAQ: NVDA)', inputs: { price: 128.50, eps: 2.20, growthRate: 35 } }
      ]
    },
    {
      id: 'roe_roce',
      title: 'ROE, ROCE & DuPont 3-Stage Factor Analysis',
      shortTitle: 'ROE & ROCE (DuPont)',
      category: 'Valuation & Fundamentals',
      categoryKey: 'valuation',
      icon: 'fa-building-columns',
      badge: 'Capital Efficiency',
      calc: calcROE_ROCE,
      defaultInputs: { netIncome: 79000, revenue: 900000, totalAssets: 1600000, shareholdersEquity: 810000, ebit: 115000, capitalEmployed: 1200000 },
      controls: [
        { key: 'netIncome', label: 'Net Income (Profit)', type: 'currency', min: 100, max: 500000, step: 1000, default: 79000 },
        { key: 'revenue', label: 'Total Revenue', type: 'currency', min: 1000, max: 2000000, step: 5000, default: 900000 },
        { key: 'totalAssets', label: 'Total Assets', type: 'currency', min: 1000, max: 3000000, step: 5000, default: 1600000 },
        { key: 'shareholdersEquity', label: 'Shareholders Equity', type: 'currency', min: 500, max: 2000000, step: 5000, default: 810000 }
      ],
      presets: [
        { label: 'High Margin IT Services (TCS Proxy)', inputs: { netIncome: 45000, revenue: 240000, totalAssets: 140000, shareholdersEquity: 95000, ebit: 62000, capitalEmployed: 110000 } },
        { label: 'Heavy Capex Energy (RIL Proxy)', inputs: { netIncome: 79000, revenue: 900000, totalAssets: 1600000, shareholdersEquity: 810000, ebit: 115000, capitalEmployed: 1200000 } }
      ]
    },

    // Category 3: Risk & Volatility
    {
      id: 'volatility',
      title: 'Volatility, Standard Deviation & Normal Bell Curve',
      shortTitle: 'Volatility & Bell Curve',
      category: 'Risk & Volatility',
      categoryKey: 'risk',
      icon: 'fa-wave-square',
      badge: 'Price Dispersion',
      calc: calcVolatility,
      defaultInputs: { dailyStdDev: 1.15, tradingDays: 252 },
      controls: [
        { key: 'dailyStdDev', label: 'Daily Price Std Dev (%)', type: 'percent', min: 0.2, max: 5.0, step: 0.05, default: 1.15 },
        { key: 'tradingDays', label: 'Trading Days Per Year', type: 'number', min: 200, max: 365, step: 1, default: 252 }
      ],
      presets: [
        { label: 'Nifty 50 Index (0.85% Daily)', inputs: { dailyStdDev: 0.85, tradingDays: 252 } },
        { label: 'Large Cap Stock (1.20% Daily)', inputs: { dailyStdDev: 1.20, tradingDays: 252 } },
        { label: 'Volatile Small Cap (2.40% Daily)', inputs: { dailyStdDev: 2.40, tradingDays: 252 } }
      ]
    },
    {
      id: 'beta_corr',
      title: 'Beta (Systematic Risk) & Correlation Coefficient',
      shortTitle: 'Beta & Correlation',
      category: 'Risk & Volatility',
      categoryKey: 'risk',
      icon: 'fa-arrows-split-up-and-left',
      badge: 'Market Sensitivity',
      calc: calcBeta,
      defaultInputs: { assetVol: 22.0, marketVol: 15.0, correlation: 0.75 },
      controls: [
        { key: 'assetVol', label: 'Stock Volatility (%)', type: 'percent', min: 5, max: 60, step: 0.5, default: 22.0 },
        { key: 'marketVol', label: 'Market Benchmark Volatility (%)', type: 'percent', min: 5, max: 35, step: 0.5, default: 15.0 },
        { key: 'correlation', label: 'Correlation with Market (ρ)', type: 'number', min: -1.0, max: 1.0, step: 0.05, default: 0.75 }
      ],
      presets: [
        { label: 'Defensive Consumer (ITC Proxy: β=0.65)', inputs: { assetVol: 14.0, marketVol: 15.0, correlation: 0.70 } },
        { label: 'High Beta Auto (Tata Motors Proxy: β=1.35)', inputs: { assetVol: 24.5, marketVol: 15.0, correlation: 0.82 } }
      ]
    },
    {
      id: 'mdd',
      title: 'Maximum Drawdown (MDD) & Underwater Curve',
      shortTitle: 'Maximum Drawdown',
      category: 'Risk & Volatility',
      categoryKey: 'risk',
      icon: 'fa-arrow-trend-down',
      badge: 'Peak-to-Trough Pain',
      calc: calcMDD,
      defaultInputs: { peakValue: 100000, troughValue: 65000, recoveryDays: 180 },
      controls: [
        { key: 'peakValue', label: 'Portfolio Peak Value', type: 'currency', min: 1000, max: 10000000, step: 5000, default: 100000 },
        { key: 'troughValue', label: 'Trough (Lowest) Value', type: 'currency', min: 100, max: 10000000, step: 5000, default: 65000 },
        { key: 'recoveryDays', label: 'Recovery Horizon (Days)', type: 'number', min: 30, max: 1000, step: 15, default: 180 }
      ],
      presets: [
        { label: 'COVID Crash 2020 (-38%)', inputs: { peakValue: 100000, troughValue: 62000, recoveryDays: 150 } },
        { label: '2008 GFC Crash (-55%)', inputs: { peakValue: 100000, troughValue: 45000, recoveryDays: 520 } },
        { label: 'Mild Correction (-12%)', inputs: { peakValue: 100000, troughValue: 88000, recoveryDays: 60 } }
      ]
    },
    {
      id: 'drawdown_recovery',
      title: 'Loss vs Required Recovery Gain',
      shortTitle: 'Drawdown vs Recovery',
      category: 'Risk & Volatility',
      categoryKey: 'risk',
      icon: 'fa-shield-halved',
      badge: 'Loss Asymmetry',
      calc: calcDrawdownRecovery,
      defaultInputs: { lossPercent: 33.3 },
      controls: [
        { key: 'lossPercent', label: 'Portfolio Drawdown Loss (%)', type: 'percent', min: 5, max: 95, step: 1, default: 33.3 }
      ],
      presets: [
        { label: '20% Loss → Needs +25%', inputs: { lossPercent: 20 } },
        { label: '33.3% Loss → Needs +50%', inputs: { lossPercent: 33.3 } },
        { label: '50% Loss → Needs +100%', inputs: { lossPercent: 50 } },
        { label: '80% Loss → Needs +400%', inputs: { lossPercent: 80 } }
      ]
    },

    // Category 4: Portfolio & Asset Pricing
    {
      id: 'sharpe',
      title: 'Sharpe, Sortino & Calmar Risk-Adjusted Ratios',
      shortTitle: 'Sharpe & Risk-Adjusted',
      category: 'Portfolio & Asset Pricing',
      categoryKey: 'portfolio',
      icon: 'fa-award',
      badge: 'Performance Quality',
      calc: calcSharpe,
      defaultInputs: { portfolioReturn: 16.5, riskFreeRate: 6.5, totalVol: 12.5, downsideVol: 8.5, maxDrawdown: 14.0 },
      controls: [
        { key: 'portfolioReturn', label: 'Strategy Annual Return (%)', type: 'percent', min: 2, max: 50, step: 0.5, default: 16.5 },
        { key: 'riskFreeRate', label: 'Risk-Free Benchmark Rate (%)', type: 'percent', min: 1, max: 12, step: 0.25, default: 6.5 },
        { key: 'totalVol', label: 'Total Annual Volatility (%)', type: 'percent', min: 2, max: 50, step: 0.5, default: 12.5 },
        { key: 'downsideVol', label: 'Downside Volatility Only (%)', type: 'percent', min: 1, max: 40, step: 0.5, default: 8.5 },
        { key: 'maxDrawdown', label: 'Historical Max Drawdown (%)', type: 'percent', min: 2, max: 60, step: 1, default: 14.0 }
      ],
      presets: [
        { label: 'Elite Quant Desk (Sharpe 1.6)', inputs: { portfolioReturn: 22.5, riskFreeRate: 6.5, totalVol: 10.0, downsideVol: 6.0, maxDrawdown: 9.0 } },
        { label: 'Index Fund (Sharpe 0.8)', inputs: { portfolioReturn: 13.5, riskFreeRate: 6.5, totalVol: 14.5, downsideVol: 10.0, maxDrawdown: 18.0 } }
      ]
    },
    {
      id: 'diversification',
      title: 'Portfolio Diversification & Correlation Benefit',
      shortTitle: 'Diversification Math',
      category: 'Portfolio & Asset Pricing',
      categoryKey: 'portfolio',
      icon: 'fa-cubes',
      badge: 'Uncorrelated Risk Reduction',
      calc: calcDiversification,
      defaultInputs: { numAssets: 15, avgAssetVol: 24.0, avgCorrelation: 0.35 },
      controls: [
        { key: 'numAssets', label: 'Number of Assets in Portfolio (N)', type: 'number', min: 1, max: 50, step: 1, default: 15 },
        { key: 'avgAssetVol', label: 'Average Individual Asset Volatility (%)', type: 'percent', min: 5, max: 50, step: 1, default: 24.0 },
        { key: 'avgCorrelation', label: 'Average Pairwise Correlation (ρ)', type: 'number', min: 0.0, max: 0.95, step: 0.05, default: 0.35 }
      ],
      presets: [
        { label: '15 Diversified Largecaps (ρ=0.35)', inputs: { numAssets: 15, avgAssetVol: 24.0, avgCorrelation: 0.35 } },
        { label: '30 Global Multi-Asset (ρ=0.20)', inputs: { numAssets: 30, avgAssetVol: 20.0, avgCorrelation: 0.20 } }
      ]
    },
    {
      id: 'port_variance',
      title: '2-Asset Portfolio Return & Variance (Markowitz)',
      shortTitle: 'Portfolio Return & Variance',
      category: 'Portfolio & Asset Pricing',
      categoryKey: 'portfolio',
      icon: 'fa-diagram-project',
      badge: 'Markowitz MPT',
      calc: calcPortfolioVariance,
      defaultInputs: { weightA: 60, returnA: 14.5, returnB: 8.0, volA: 18.0, volB: 6.5, correlation: 0.10 },
      controls: [
        { key: 'weightA', label: 'Weight in Asset A (%)', type: 'percent', min: 0, max: 100, step: 5, default: 60 },
        { key: 'returnA', label: 'Asset A Expected Return (%)', type: 'percent', min: 1, max: 35, step: 0.5, default: 14.5 },
        { key: 'returnB', label: 'Asset B Expected Return (%)', type: 'percent', min: 1, max: 25, step: 0.5, default: 8.0 },
        { key: 'volA', label: 'Asset A Volatility (%)', type: 'percent', min: 2, max: 40, step: 0.5, default: 18.0 },
        { key: 'volB', label: 'Asset B Volatility (%)', type: 'percent', min: 1, max: 30, step: 0.5, default: 6.5 },
        { key: 'correlation', label: 'Correlation (ρ_AB)', type: 'number', min: -1.0, max: 1.0, step: 0.05, default: 0.10 }
      ],
      presets: [
        { label: 'Classic 60/40 Equity + Bond', inputs: { weightA: 60, returnA: 14.0, returnB: 7.5, volA: 16.0, volB: 6.0, correlation: 0.15 } },
        { label: 'Equity + Gold (Zero Correlation)', inputs: { weightA: 70, returnA: 14.0, returnB: 11.0, volA: 16.0, volB: 14.0, correlation: -0.05 } }
      ]
    },
    {
      id: 'capm',
      title: 'CAPM Expected Return & Jensen\'s Alpha',
      shortTitle: 'CAPM & Alpha',
      category: 'Portfolio & Asset Pricing',
      categoryKey: 'portfolio',
      icon: 'fa-atom',
      badge: 'Asset Pricing Model',
      calc: calcCAPM,
      defaultInputs: { riskFreeRate: 6.5, marketReturn: 13.5, beta: 1.15, actualReturn: 17.5 },
      controls: [
        { key: 'riskFreeRate', label: 'Risk-Free Benchmark Rate (Rf %)', type: 'percent', min: 1, max: 12, step: 0.25, default: 6.5 },
        { key: 'marketReturn', label: 'Market Expected Return (Rm %)', type: 'percent', min: 4, max: 25, step: 0.5, default: 13.5 },
        { key: 'beta', label: 'Systematic Beta (β)', type: 'number', min: 0.1, max: 3.0, step: 0.05, default: 1.15 },
        { key: 'actualReturn', label: 'Actual Realized Return (%)', type: 'percent', min: -10, max: 45, step: 0.5, default: 17.5 }
      ],
      presets: [
        { label: 'Alpha Generator (Alpha = +3.0%)', inputs: { riskFreeRate: 6.5, marketReturn: 13.5, beta: 1.15, actualReturn: 17.5 } },
        { label: 'Market Tracker (Alpha = 0%)', inputs: { riskFreeRate: 6.5, marketReturn: 13.5, beta: 1.00, actualReturn: 13.5 } }
      ]
    },
    {
      id: 'port_allocator',
      title: 'Interactive 4-Asset Portfolio Allocator',
      shortTitle: '4-Asset Allocator',
      category: 'Portfolio & Asset Pricing',
      categoryKey: 'portfolio',
      icon: 'fa-layer-group',
      badge: 'Multi-Asset Lab',
      calc: calcPortfolioAllocation,
      defaultInputs: { weightEquity: 50, weightBonds: 30, weightGold: 15, weightCash: 5 },
      controls: [
        { key: 'weightEquity', label: 'Equities Allocation (%)', type: 'percent', min: 0, max: 100, step: 5, default: 50 },
        { key: 'weightBonds', label: 'Bonds / Debt Allocation (%)', type: 'percent', min: 0, max: 100, step: 5, default: 30 },
        { key: 'weightGold', label: 'Gold / Commodities (%)', type: 'percent', min: 0, max: 100, step: 5, default: 15 },
        { key: 'weightCash', label: 'Cash / Liquid (%)', type: 'percent', min: 0, max: 100, step: 5, default: 5 }
      ],
      presets: [
        { label: 'Ray Dalio All-Weather', inputs: { weightEquity: 30, weightBonds: 55, weightGold: 15, weightCash: 0 } },
        { label: 'Aggressive Growth (75/20/5)', inputs: { weightEquity: 75, weightBonds: 20, weightGold: 5, weightCash: 0 } },
        { label: 'Golden Butterfly', inputs: { weightEquity: 40, weightBonds: 40, weightGold: 20, weightCash: 0 } }
      ]
    },

    // Category 5: Interactive Simulators & Stress Lab
    {
      id: 'risk_return_scatter',
      title: 'Risk/Return Simulator on the Efficient Frontier',
      shortTitle: 'Efficient Frontier Lab',
      category: 'Interactive Simulators',
      categoryKey: 'simulators',
      icon: 'fa-compass',
      badge: 'Markowitz Frontier',
      calc: calcRiskReturnTradeoff,
      defaultInputs: { equityShare: 60, bondShare: 40 },
      controls: [
        { key: 'equityShare', label: 'Equities Share (%)', type: 'percent', min: 0, max: 100, step: 5, default: 60 }
      ],
      presets: [
        { label: 'Conservative 30% Equity', inputs: { equityShare: 30 } },
        { label: 'Balanced 60% Equity', inputs: { equityShare: 60 } },
        { label: 'Aggressive 90% Equity', inputs: { equityShare: 90 } }
      ]
    },
    {
      id: 'scenario_stress',
      title: 'Macro What-If Stress Testing Simulator',
      shortTitle: 'What-If Stress Lab',
      category: 'Interactive Simulators',
      categoryKey: 'simulators',
      icon: 'fa-bolt',
      badge: 'Macro Shock Simulator',
      calc: calcStressScenario,
      defaultInputs: { scenarioKey: 'rates_spike', portfolioValue: 1000000 },
      controls: [
        { key: 'scenarioKey', label: 'Macro Stress Scenario', type: 'select', options: [{ val: 'rates_spike', text: 'Central Bank Rate Shock (+300 bps)' }, { val: 'equity_crash', text: 'Global Equity Crash (-40%)' }, { val: 'vol_spike', text: 'Volatility Shock (VIX > 45)' }, { val: 'stagflation', text: '1970s Style Stagflation' }], default: 'rates_spike' },
        { key: 'portfolioValue', label: 'Portfolio Base Capital', type: 'currency', min: 10000, max: 50000000, step: 50000, default: 1000000 }
      ],
      presets: [
        { label: 'Rate Hike +300bps', inputs: { scenarioKey: 'rates_spike', portfolioValue: 1000000 } },
        { label: 'Equity Crash -40%', inputs: { scenarioKey: 'equity_crash', portfolioValue: 1000000 } },
        { label: 'Stagflation Crisis', inputs: { scenarioKey: 'stagflation', portfolioValue: 1000000 } }
      ]
    },
    {
      id: 'options_payoff',
      title: 'Multi-Leg Options Payoff & Strategy Builder',
      shortTitle: 'Options Payoff Lab',
      category: 'Interactive Simulators',
      categoryKey: 'simulators',
      icon: 'fa-cubes-stacked',
      badge: 'Options Derivatives Lab',
      calc: calcOptionsPayoff,
      defaultInputs: { strategy: 'bull_call_spread', underlyingPrice: 1000, strikePrice: 1000, strike2: 1050, premiumPaid: 25 },
      controls: [
        { key: 'strategy', label: 'Options Strategy Structure', type: 'select', options: [
          { val: 'bull_call_spread', text: 'Bull Call Spread (Debit)' },
          { val: 'long_call', text: 'Long Call Option' },
          { val: 'long_put', text: 'Long Put Option' },
          { val: 'covered_call', text: 'Covered Call (Income)' },
          { val: 'protective_put', text: 'Protective Put (Hedge)' },
          { val: 'straddle', text: 'Long Straddle (Vol Explosion)' },
          { val: 'iron_condor', text: 'Iron Condor (Range-Bound)' }
        ], default: 'bull_call_spread' },
        { key: 'underlyingPrice', label: 'Underlying Stock Price (S₀)', type: 'currency', min: 50, max: 10000, step: 25, default: 1000 },
        { key: 'strikePrice', label: 'Lower Strike Price (K₁)', type: 'currency', min: 50, max: 10000, step: 25, default: 1000 },
        { key: 'strike2', label: 'Upper Strike Price (K₂)', type: 'currency', min: 50, max: 10000, step: 25, default: 1050 },
        { key: 'premiumPaid', label: 'Net Premium / Cost (C)', type: 'currency', min: 1, max: 500, step: 2, default: 25 }
      ],
      presets: [
        { label: 'Bull Call Spread (1000/1050)', inputs: { strategy: 'bull_call_spread', underlyingPrice: 1000, strikePrice: 1000, strike2: 1050, premiumPaid: 25 } },
        { label: 'Long Straddle (1000 Strike)', inputs: { strategy: 'straddle', underlyingPrice: 1000, strikePrice: 1000, strike2: 1000, premiumPaid: 35 } },
        { label: 'Iron Condor (Delta-Neutral)', inputs: { strategy: 'iron_condor', underlyingPrice: 1000, strikePrice: 950, strike2: 1050, premiumPaid: 20 } },
        { label: 'Covered Call Strategy', inputs: { strategy: 'covered_call', underlyingPrice: 1000, strikePrice: 1050, strike2: 1050, premiumPaid: 30 } }
      ]
    },
    {
      id: 'quant_backtest',
      title: 'Systematic Strategy Backtester & Equity Curve Simulator',
      shortTitle: 'Strategy Backtester',
      category: 'Interactive Simulators',
      categoryKey: 'simulators',
      icon: 'fa-microchip',
      badge: 'Algorithmic Sandbox',
      calc: calcQuantBacktest,
      defaultInputs: { strategy: 'trend_following', lookback: 20, stopLossPct: 5, leverage: 1 },
      controls: [
        { key: 'strategy', label: 'Quantitative Strategy Model', type: 'select', options: [
          { val: 'trend_following', text: 'Dual Moving Average Trend Following (SMA 20/50)' },
          { val: 'mean_reversion', text: 'RSI Mean-Reversion + Bollinger Band Bounce' },
          { val: 'vol_breakout', text: 'Volatility Breakout (Donchian / ATR Channel)' }
        ], default: 'trend_following' },
        { key: 'lookback', label: 'Indicator Lookback Window (Days)', type: 'number', min: 5, max: 100, step: 5, default: 20 },
        { key: 'stopLossPct', label: 'Trailing Stop-Loss Threshold (%)', type: 'percent', min: 1, max: 20, step: 0.5, default: 5 },
        { key: 'leverage', label: 'Portfolio Leverage Multiplier', type: 'number', min: 1, max: 3, step: 0.5, default: 1 }
      ],
      presets: [
        { label: 'Conservative Trend (1x Leverage)', inputs: { strategy: 'trend_following', lookback: 20, stopLossPct: 5, leverage: 1 } },
        { label: 'Mean-Reversion Swing (1.5x)', inputs: { strategy: 'mean_reversion', lookback: 14, stopLossPct: 4, leverage: 1.5 } },
        { label: 'High-Beta Vol Breakout (2x)', inputs: { strategy: 'vol_breakout', lookback: 20, stopLossPct: 6, leverage: 2 } }
      ]
    }
  ];

  return {
    USD_TO_INR,
    formatMoney,
    formatPercent,
    convertCurrency,
    MODULES_DIRECTORY,
    getModuleById: (id) => MODULES_DIRECTORY.find(m => m.id === id) || MODULES_DIRECTORY[0]
  };
})();

// Support Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LearnMathEngine;
}
