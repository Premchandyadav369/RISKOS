/**
 * RISKOS — LEARN & LAB QUANTITATIVE CONTROLLER
 * Seamless, deterministic, reactive financial laboratory controller.
 */

(() => {
  'use strict';

  // ── Global State ──────────────────────────────────────────────────────────
  const labState = {
    activeModuleId: 'cagr',
    activeCategory: 'all',
    activePane: 'pane-understand',
    explanationMode: 'beginner',
    currency: 'INR',
    usdToInr: 83.50,
    sourceMode: 'custom', // 'custom' | 'security'
    activeSecuritySymbol: 'RELIANCE',
    simInputs: {},
    chartInstance: null
  };

  // ── 18 Comprehensive Laboratory Modules ───────────────────────────────────
  const MODULES_REGISTRY = [
    {
      id: 'cagr',
      name: 'CAGR (Compounded Annual Growth Rate)',
      shortName: 'CAGR',
      category: 'growth',
      focalSymbol: 'CAGR',
      focalLabel: 'Annual Growth Rate',
      defaultInputs: { vi: 100000, vf: 250000, n: 5.0 },
      controls: [
        { key: 'vi', label: 'Initial Value (Vi)', min: 1000, max: 2000000, step: 5000, isMoney: true },
        { key: 'vf', label: 'Final Value (Vf)', min: 1000, max: 10000000, step: 10000, isMoney: true },
        { key: 'n', label: 'Time Horizon (Years)', min: 1, max: 30, step: 0.5, isMoney: false }
      ],
      presets: [
        { label: 'Doubling in 5Y', values: { vi: 100000, vf: 200000, n: 5 } },
        { label: '10x Wealth (15Y)', values: { vi: 100000, vf: 1000000, n: 15 } }
      ]
    },
    {
      id: 'compounding',
      name: 'Compound Interest & Exponential Growth',
      shortName: 'Compounding',
      category: 'growth',
      focalSymbol: 'A = P(1+r/n)ⁿᵗ',
      focalLabel: 'Future Value',
      defaultInputs: { principal: 100000, rate: 12.0, years: 10, frequency: 1 },
      controls: [
        { key: 'principal', label: 'Initial Principal (P)', min: 10000, max: 2000000, step: 10000, isMoney: true },
        { key: 'rate', label: 'Annual Interest Rate (%)', min: 1.0, max: 30.0, step: 0.5, isMoney: false },
        { key: 'years', label: 'Investment Horizon (Years)', min: 1, max: 40, step: 1, isMoney: false }
      ],
      presets: [
        { label: 'Bank FD (7%)', values: { principal: 100000, rate: 7.0, years: 10, frequency: 1 } },
        { label: 'Index Fund (14%)', values: { principal: 100000, rate: 14.0, years: 20, frequency: 1 } }
      ]
    },
    {
      id: 'sip',
      name: 'SIP / DCA (Dollar-Cost Averaging)',
      shortName: 'SIP / DCA',
      category: 'simulators',
      focalSymbol: 'SIP',
      focalLabel: 'Systematic Wealth Accumulation',
      defaultInputs: { monthly: 10000, rate: 12.0, years: 10 },
      controls: [
        { key: 'monthly', label: 'Monthly SIP Contribution', min: 1000, max: 200000, step: 1000, isMoney: true },
        { key: 'rate', label: 'Expected Annual Return (%)', min: 4.0, max: 25.0, step: 0.5, isMoney: false },
        { key: 'years', label: 'Duration (Years)', min: 1, max: 35, step: 1, isMoney: false }
      ],
      presets: [
        { label: '₹5k / mo (15Y)', values: { monthly: 5000, rate: 12.0, years: 15 } },
        { label: '₹25k / mo (20Y)', values: { monthly: 25000, rate: 14.0, years: 20 } }
      ]
    },
    {
      id: 'lumpsum_vs_sip',
      name: 'Lumpsum vs SIP Simulator',
      shortName: 'Lumpsum vs SIP',
      category: 'simulators',
      focalSymbol: 'L vs S',
      focalLabel: 'Strategy Comparison',
      defaultInputs: { totalAmount: 600000, rate: 12.0, years: 5 },
      controls: [
        { key: 'totalAmount', label: 'Total Investible Capital', min: 50000, max: 5000000, step: 50000, isMoney: true },
        { key: 'rate', label: 'Expected Annual Return (%)', min: 4.0, max: 25.0, step: 0.5, isMoney: false },
        { key: 'years', label: 'Tenure (Years)', min: 1, max: 20, step: 1, isMoney: false }
      ],
      presets: [
        { label: '₹10 Lakh (5Y)', values: { totalAmount: 1000000, rate: 12.0, years: 5 } }
      ]
    },
    {
      id: 'pe_ratio',
      name: 'P/E Ratio & Earnings Yield',
      shortName: 'P/E Ratio',
      category: 'valuation',
      focalSymbol: 'P/E',
      focalLabel: 'Price-to-Earnings Multiple',
      defaultInputs: { price: 2984.50, eps: 116.80 },
      controls: [
        { key: 'price', label: 'Current Share Price', min: 10, max: 50000, step: 10, isMoney: true },
        { key: 'eps', label: 'Earnings Per Share (EPS)', min: 1, max: 2000, step: 1, isMoney: true }
      ],
      presets: [
        { label: 'Reliance (25.5x)', values: { price: 2984.50, eps: 116.80 } },
        { label: 'TCS (31.8x)', values: { price: 4210.80, eps: 132.50 } }
      ]
    },
    {
      id: 'roe_dupont',
      name: 'ROE & DuPont 3-Stage Decomposition',
      shortName: 'ROE DuPont',
      category: 'valuation',
      focalSymbol: 'ROE',
      focalLabel: 'Return on Equity',
      defaultInputs: { netIncome: 69622, revenue: 900000, assets: 1800000, equity: 714000 },
      controls: [
        { key: 'netIncome', label: 'Net Income (Cr)', min: 100, max: 150000, step: 500, isMoney: false },
        { key: 'revenue', label: 'Total Revenue (Cr)', min: 1000, max: 2000000, step: 5000, isMoney: false },
        { key: 'assets', label: 'Total Assets (Cr)', min: 1000, max: 3000000, step: 10000, isMoney: false },
        { key: 'equity', label: 'Shareholder Equity (Cr)', min: 500, max: 1500000, step: 5000, isMoney: false }
      ],
      presets: [
        { label: 'Reliance DuPont', values: { netIncome: 69622, revenue: 900000, assets: 1800000, equity: 714000 } }
      ]
    },
    {
      id: 'volatility',
      name: 'Volatility & Normal Distribution',
      shortName: 'Volatility',
      category: 'risk',
      focalSymbol: 'σ',
      focalLabel: 'Annualized Dispersion',
      defaultInputs: { dailyStd: 1.15, price: 2500 },
      controls: [
        { key: 'dailyStd', label: 'Daily Price Volatility (%)', min: 0.2, max: 5.0, step: 0.05, isMoney: false },
        { key: 'price', label: 'Current Asset Price', min: 50, max: 50000, step: 50, isMoney: true }
      ],
      presets: [
        { label: 'Low Vol Index (0.8%)', values: { dailyStd: 0.8, price: 24000 } },
        { label: 'High Beta Stock (2.2%)', values: { dailyStd: 2.2, price: 1200 } }
      ]
    },
    {
      id: 'beta',
      name: 'Beta & Systematic Market Sensitivity',
      shortName: 'Beta',
      category: 'risk',
      focalSymbol: 'β',
      focalLabel: 'Market Sensitivity',
      defaultInputs: { cov: 0.033, varM: 0.0225, stockVol: 22.0, marketVol: 15.0, corr: 0.75 },
      controls: [
        { key: 'stockVol', label: 'Stock Annual Volatility (%)', min: 5.0, max: 60.0, step: 0.5, isMoney: false },
        { key: 'marketVol', label: 'Market Benchmark Volatility (%)', min: 5.0, max: 40.0, step: 0.5, isMoney: false },
        { key: 'corr', label: 'Correlation with Benchmark (ρ)', min: -0.9, max: 1.0, step: 0.05, isMoney: false }
      ],
      presets: [
        { label: 'Defensive FMCG (0.65)', values: { stockVol: 14.0, marketVol: 15.0, corr: 0.70 } },
        { label: 'High-Beta Tech (1.45)', values: { stockVol: 28.0, marketVol: 15.0, corr: 0.78 } }
      ]
    },
    {
      id: 'sharpe_ratio',
      name: 'Sharpe Ratio & Risk-Adjusted Return',
      shortName: 'Sharpe Ratio',
      category: 'risk',
      focalSymbol: 'S',
      focalLabel: 'Excess Return / Unit Risk',
      defaultInputs: { portfolioReturn: 16.5, riskFreeRate: 6.5, portfolioVol: 12.5 },
      controls: [
        { key: 'portfolioReturn', label: 'Portfolio Annual Return (%)', min: 2.0, max: 40.0, step: 0.5, isMoney: false },
        { key: 'riskFreeRate', label: 'Risk-Free Rate (Rf) (%)', min: 1.0, max: 12.0, step: 0.25, isMoney: false },
        { key: 'portfolioVol', label: 'Portfolio Volatility (σ) (%)', min: 3.0, max: 35.0, step: 0.5, isMoney: false }
      ],
      presets: [
        { label: 'Institutional Alpha (1.25)', values: { portfolioReturn: 18.0, riskFreeRate: 6.5, portfolioVol: 9.2 } }
      ]
    },
    {
      id: 'max_drawdown',
      name: 'Maximum Drawdown & Recovery Math',
      shortName: 'Max Drawdown',
      category: 'risk',
      focalSymbol: 'MDD',
      focalLabel: 'Peak-to-Trough Decline',
      defaultInputs: { peak: 100000, trough: 65000 },
      controls: [
        { key: 'peak', label: 'Peak Portfolio Valuation', min: 10000, max: 5000000, step: 10000, isMoney: true },
        { key: 'trough', label: 'Trough Portfolio Valuation', min: 5000, max: 5000000, step: 5000, isMoney: true }
      ],
      presets: [
        { label: '2008 Crash (-50%)', values: { peak: 100000, trough: 50000 } },
        { label: 'COVID Dip (-35%)', values: { peak: 100000, trough: 65000 } }
      ]
    },
    {
      id: 'portfolio_diversification',
      name: '2-Asset Markowitz Diversification',
      shortName: 'Diversification',
      category: 'portfolio',
      focalSymbol: 'σₚ',
      focalLabel: 'Blended Risk Reduction',
      defaultInputs: { wA: 0.6, volA: 24.0, volB: 12.0, corr: 0.15 },
      controls: [
        { key: 'wA', label: 'Asset A Weight (Equity)', min: 0.0, max: 1.0, step: 0.05, isMoney: false },
        { key: 'volA', label: 'Asset A Volatility (%)', min: 5.0, max: 50.0, step: 1.0, isMoney: false },
        { key: 'volB', label: 'Asset B Volatility (Debt) (%)', min: 2.0, max: 30.0, step: 0.5, isMoney: false },
        { key: 'corr', label: 'Correlation (ρ)', min: -1.0, max: 1.0, step: 0.05, isMoney: false }
      ],
      presets: [
        { label: '60/40 Equity/Debt', values: { wA: 0.6, volA: 20.0, volB: 6.0, corr: 0.10 } },
        { label: 'Uncorrelated Assets (ρ=0)', values: { wA: 0.5, volA: 18.0, volB: 14.0, corr: 0.0 } }
      ]
    },
    {
      id: 'capm',
      name: 'CAPM Expected Return & Security Market Line',
      shortName: 'CAPM',
      category: 'portfolio',
      focalSymbol: 'E(Rᵢ)',
      focalLabel: 'Required Hurdle Rate',
      defaultInputs: { rf: 6.5, beta: 1.15, rm: 13.5, actualReturn: 17.5 },
      controls: [
        { key: 'rf', label: 'Risk-Free Rate (Rf) (%)', min: 2.0, max: 10.0, step: 0.25, isMoney: false },
        { key: 'beta', label: 'Asset Beta (β)', min: 0.2, max: 2.5, step: 0.05, isMoney: false },
        { key: 'rm', label: 'Expected Market Return (Rm) (%)', min: 6.0, max: 22.0, step: 0.5, isMoney: false }
      ],
      presets: [
        { label: 'India Bluechip', values: { rf: 6.5, beta: 1.05, rm: 14.0, actualReturn: 16.5 } }
      ]
    }
  ];

  // ── Helper: Format Currency ───────────────────────────────────────────────
  const formatMoney = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const isUSD = labState.currency === 'USD';
    const val = isUSD ? num / labState.usdToInr : num;
    const sym = isUSD ? '$' : '₹';

    if (Math.abs(val) >= 10000000 && !isUSD) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(val) >= 100000 && !isUSD) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `${sym}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // ── Render Bottom Concept Switcher Tray ───────────────────────────────────
  const renderConceptTray = () => {
    const track = document.getElementById('labTrayScroll');
    if (!track) return;

    const filtered = labState.activeCategory === 'all'
      ? MODULES_REGISTRY
      : MODULES_REGISTRY.filter(m => m.category === labState.activeCategory);

    track.innerHTML = filtered.map(m => `
      <div class="concept-thumb-card ${m.id === labState.activeModuleId ? 'active' : ''}" data-module-id="${m.id}">
        <span class="thumb-tag">${m.category.toUpperCase()}</span>
        <span class="thumb-title">${m.name}</span>
        <span style="font-family:monospace;font-size:0.7rem;color:var(--text-muted);margin-top:2px;">${m.focalSymbol}</span>
      </div>
    `).join('');

    track.querySelectorAll('.concept-thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        switchModule(card.dataset.moduleId);
      });
    });
  };

  // ── Switch Active Module ──────────────────────────────────────────────────
  const switchModule = (moduleId) => {
    const mod = MODULES_REGISTRY.find(m => m.id === moduleId);
    if (!mod) return;

    labState.activeModuleId = moduleId;
    labState.simInputs = { ...mod.defaultInputs };

    // Update Header
    document.getElementById('activeTitle').textContent = mod.name;
    document.getElementById('activeCatTag').textContent = `${mod.category.toUpperCase()} • QUANTITATIVE LABORATORY`;

    // Render Controls
    renderControlsPanel(mod);

    // Render Presets
    renderPresetChips(mod);

    // Evaluate Math & Update UI
    evaluateActiveModule();

    // Re-render tray to highlight active card
    renderConceptTray();
  };

  // ── Render Interactive Sliders Panel ─────────────────────────────────────
  const renderControlsPanel = (mod) => {
    const panel = document.getElementById('simControlsPanel');
    if (!panel) return;

    panel.innerHTML = mod.controls.map(c => {
      const curVal = labState.simInputs[c.key] !== undefined ? labState.simInputs[c.key] : c.min;
      const formattedVal = c.isMoney ? formatMoney(curVal) : `${curVal}${c.key.includes('rate') || c.key.includes('Vol') ? '%' : ''}`;

      return `
        <div class="sim-control-group">
          <div class="sim-control-header">
            <span>${c.label}</span>
            <span class="sim-control-val" id="val_${c.key}">${formattedVal}</span>
          </div>
          <input 
            type="range" 
            class="sim-range-slider" 
            id="slider_${c.key}" 
            data-key="${c.key}" 
            data-money="${c.isMoney ? '1' : '0'}"
            min="${c.min}" 
            max="${c.max}" 
            step="${c.step}" 
            value="${curVal}" 
          />
        </div>
      `;
    }).join('');

    // Attach listeners
    panel.querySelectorAll('.sim-range-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const k = e.target.dataset.key;
        const isM = e.target.dataset.money === '1';
        const v = parseFloat(e.target.value);
        labState.simInputs[k] = v;

        const valLabel = document.getElementById(`val_${k}`);
        if (valLabel) {
          valLabel.textContent = isM ? formatMoney(v) : `${v}${k.includes('rate') || k.includes('Vol') ? '%' : ''}`;
        }

        evaluateActiveModule();
      });
    });
  };

  // ── Render Preset Chips ──────────────────────────────────────────────────
  const renderPresetChips = (mod) => {
    const container = document.getElementById('labPresetPills');
    if (!container) return;

    if (!mod.presets || mod.presets.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = mod.presets.map((p, idx) => `
      <button class="lab-chip" data-idx="${idx}"><i class="fa-solid fa-bolt" style="font-size:0.6rem;color:var(--accent-cyan);"></i> ${p.label}</button>
    `).join('');

    container.querySelectorAll('.lab-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = mod.presets[parseInt(btn.dataset.idx, 10)];
        if (p) {
          labState.simInputs = { ...p.values };
          renderControlsPanel(mod);
          evaluateActiveModule();
        }
      });
    });
  };

  // ── Main Deterministic Evaluator ──────────────────────────────────────────
  const evaluateActiveModule = () => {
    const modId = labState.activeModuleId;
    const inputs = labState.simInputs;
    let res = null;

    if (modId === 'cagr') {
      res = LearnMathEngine.calcCAGR(inputs.vi, inputs.vf, inputs.n);
    } else if (modId === 'compounding') {
      res = LearnMathEngine.calcCompoundInterest(inputs.principal, inputs.rate, inputs.years, inputs.frequency || 1);
    } else if (modId === 'sip') {
      res = LearnMathEngine.calcSIP(inputs.monthly, inputs.rate, inputs.years);
    } else if (modId === 'lumpsum_vs_sip') {
      res = LearnMathEngine.calcLumpsumVsSIP(inputs.totalAmount, inputs.rate, inputs.years);
    } else if (modId === 'pe_ratio') {
      res = LearnMathEngine.calcPEandEarningsYield(inputs.price, inputs.eps);
    } else if (modId === 'roe_dupont') {
      res = LearnMathEngine.calcROEDuPont(inputs.netIncome, inputs.revenue, inputs.assets, inputs.equity);
    } else if (modId === 'volatility') {
      res = LearnMathEngine.calcVolatilityNormal(inputs.dailyStd, inputs.price);
    } else if (modId === 'beta') {
      res = LearnMathEngine.calcBeta(inputs.cov || 0.033, inputs.varM || 0.0225, inputs.stockVol, inputs.marketVol, inputs.corr);
    } else if (modId === 'sharpe_ratio') {
      res = LearnMathEngine.calcSharpe(inputs.portfolioReturn, inputs.riskFreeRate, inputs.portfolioVol);
    } else if (modId === 'max_drawdown') {
      res = LearnMathEngine.calcDrawdownRecovery(inputs.peak, inputs.trough);
    } else if (modId === 'portfolio_diversification') {
      res = LearnMathEngine.calcDiversification(inputs.wA, 1 - inputs.wA, inputs.volA, inputs.volB, inputs.corr);
    } else if (modId === 'capm') {
      res = LearnMathEngine.calcCAPM(inputs.rf, inputs.beta, inputs.rm, inputs.actualReturn || 16.0);
    }

    if (!res) return;

    // 1. Update Mode 1: Understand
    const underLead = document.getElementById('understandLead');
    const underBody = document.getElementById('understandBody');
    const whyMatters = document.getElementById('whyMattersText');
    const focalVal = document.getElementById('focalValue');
    const focalSym = document.getElementById('focalSymbol');

    if (underLead) underLead.textContent = res.whatIsIt || '';
    if (underBody) {
      if (labState.explanationMode === 'beginner') {
        underBody.textContent = `A simple, intuitive way to understand this: ${res.plainEnglishResult}`;
      } else if (labState.explanationMode === 'investor') {
        underBody.textContent = `Practical Investment Context: ${res.plainEnglishResult}. Use this metric to benchmark opportunities against cash hurdles.`;
      } else {
        underBody.textContent = `Quantitative Specification: Computed via closed-form deterministic operator with continuous parameter sensitivity.`;
      }
    }
    if (whyMatters) whyMatters.textContent = res.whyItMatters || '';
    if (focalSym) focalSym.textContent = MODULES_REGISTRY.find(m => m.id === modId)?.focalSymbol || '—';
    if (focalVal) {
      if (res.cagrPercent !== undefined) focalVal.textContent = `+${res.cagrPercent.toFixed(2)}%`;
      else if (res.futureValue !== undefined) focalVal.textContent = formatMoney(res.futureValue);
      else if (res.peRatio !== undefined) focalVal.textContent = `${res.peRatio.toFixed(2)}x`;
      else if (res.beta !== undefined) focalVal.textContent = `${res.beta.toFixed(2)}`;
      else if (res.sharpeRatio !== undefined) focalVal.textContent = `${res.sharpeRatio.toFixed(2)}`;
      else if (res.maxDrawdownPercent !== undefined) focalVal.textContent = `-${res.maxDrawdownPercent.toFixed(2)}%`;
      else focalVal.textContent = 'Active';
    }

    // 2. Update Mode 2: Result String & Visualization
    const simResText = document.getElementById('simResultText');
    if (simResText) simResText.textContent = res.plainEnglishResult;

    renderChart(res);

    // 3. Update Mode 3: Prove MathJax Equations
    const eqDiv = document.getElementById('proveMathEquation');
    const subDiv = document.getElementById('proveSubstitutedMath');
    const limText = document.getElementById('proveLimitations');

    if (eqDiv) eqDiv.innerHTML = `\\[ ${res.latexFormula} \\]`;
    if (subDiv) subDiv.innerHTML = `\\[ ${res.substitutedLatex} \\]`;
    if (limText) limText.textContent = res.limitations || '';

    // Trigger MathJax Re-render
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([eqDiv, subDiv]).catch(() => {});
    }
  };

  // ── Render Responsive Chart.js Visualization ─────────────────────────────
  const renderChart = (res) => {
    const canvas = document.getElementById('simChartCanvas');
    if (!canvas || !res.chartData) return;

    if (labState.chartInstance) {
      labState.chartInstance.destroy();
    }

    const cd = res.chartData;
    const ctx = canvas.getContext('2d');

    labState.chartInstance = new Chart(ctx, {
      type: cd.type || 'line',
      data: {
        labels: cd.labels,
        datasets: cd.datasets.map((ds, idx) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.borderColor || (idx === 0 ? '#22d3ee' : '#51CF66'),
          backgroundColor: ds.backgroundColor || 'transparent',
          fill: ds.fill !== undefined ? ds.fill : false,
          tension: 0.25,
          pointRadius: cd.labels.length > 20 ? 0 : 3
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: {
            display: cd.datasets.length > 1,
            labels: { color: '#a1a1aa', font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: '#0d0d12',
            titleColor: '#fff',
            bodyColor: '#22d3ee',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#71717a', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#71717a', font: { size: 10 } }
          }
        }
      }
    });
  };

  // ── Real Security Search Handler ──────────────────────────────────────────
  const setupSecuritySearch = () => {
    const secInput = document.getElementById('simSecurityInput');
    if (!secInput) return;

    let debounce = null;
    secInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      const q = e.target.value.trim();
      if (!q) return;

      debounce = setTimeout(async () => {
        const sec = await SecurityMaster.resolveSecurity(q);
        if (sec && sec.basePrice) {
          labState.activeSecuritySymbol = sec.symbol;

          // Pre-fill parameters according to current module
          const modId = labState.activeModuleId;
          if (modId === 'pe_ratio') {
            labState.simInputs.price = sec.basePrice;
            labState.simInputs.eps = sec.eps || 100;
          } else if (modId === 'volatility') {
            labState.simInputs.price = sec.basePrice;
            labState.simInputs.dailyStd = Number(((sec.vol || 0.18) / Math.sqrt(252) * 100).toFixed(2));
          } else if (modId === 'beta') {
            labState.simInputs.stockVol = Number(((sec.vol || 0.18) * 100).toFixed(1));
            labState.simInputs.corr = 0.75;
          }

          renderControlsPanel(MODULES_REGISTRY.find(m => m.id === modId));
          evaluateActiveModule();
        }
      }, 200);
    });
  };

  // ── Init Event Listeners & Boot ───────────────────────────────────────────
  const init = () => {
    // 1. Category Pill Navigation
    document.querySelectorAll('.lab-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.lab-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        labState.activeCategory = pill.dataset.category;
        renderConceptTray();
      });
    });

    // 2. Three Mode Tabs (UNDERSTAND | EXPERIMENT | PROVE)
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        labState.activePane = btn.dataset.pane;

        document.querySelectorAll('.lab-mode-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(labState.activePane)?.classList.add('active');

        // Resize chart if switching to experiment
        if (labState.activePane === 'pane-experiment' && labState.chartInstance) {
          labState.chartInstance.resize();
        }
      });
    });

    // 3. Explanation Depth Mode Pill (Beginner | Investor | Quant)
    document.querySelectorAll('#modeSelectorPill .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#modeSelectorPill .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        labState.explanationMode = btn.dataset.mode;
        document.body.setAttribute('data-user-mode', labState.explanationMode);
        evaluateActiveModule();
      });
    });

    // 4. Currency Toggle
    const currBtn = document.getElementById('currencyToggleBtn');
    if (currBtn) {
      currBtn.addEventListener('click', () => {
        labState.currency = labState.currency === 'INR' ? 'USD' : 'INR';
        currBtn.querySelectorAll('.curr-opt').forEach(opt => {
          opt.classList.toggle('active', opt.dataset.curr === labState.currency);
        });
        renderControlsPanel(MODULES_REGISTRY.find(m => m.id === labState.activeModuleId));
        evaluateActiveModule();
      });
    }

    // 4.5 Live Market Clocks
    const updateMarketClock = () => {
      const now = new Date();
      const istStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const estStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
      const timeEl = document.getElementById('marketTime');
      const nameEl = document.getElementById('marketName');
      if (timeEl && nameEl) {
        if (nameEl.textContent.includes('US') || nameEl.textContent.includes('NYSE')) {
          timeEl.textContent = `${estStr} EST`;
        } else {
          timeEl.textContent = `${istStr} IST`;
        }
      }
    };
    updateMarketClock();
    setInterval(updateMarketClock, 1000);

    const clockBadge = document.getElementById('marketClockBadge');
    if (clockBadge) {
      clockBadge.addEventListener('click', () => {
        const nameEl = document.getElementById('marketName');
        if (nameEl) {
          nameEl.textContent = nameEl.textContent === 'NSE' ? 'NYSE/US' : 'NSE';
          updateMarketClock();
        }
      });
    }

    // 5. Simulation vs Real Security Toggle
    document.querySelectorAll('.sim-source-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim-source-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        labState.sourceMode = btn.dataset.source;

        const secBar = document.getElementById('simRealSecurityBar');
        if (secBar) {
          secBar.classList.toggle('active', labState.sourceMode === 'security');
        }
      });
    });

    // 6. AI Query Input & Chips
    const aiInput = document.getElementById('labAiInput');
    const askBtn = document.getElementById('btnLabAsk');

    const handleQuery = (query) => {
      if (!query) return;
      const q = query.toLowerCase();
      let targetMod = 'cagr';

      if (q.includes('sip') || q.includes('dca')) targetMod = 'sip';
      else if (q.includes('lump') || q.includes('vs')) targetMod = 'lumpsum_vs_sip';
      else if (q.includes('compound') || q.includes('interest')) targetMod = 'compounding';
      else if (q.includes('pe') || q.includes('p/e') || q.includes('valuation') || q.includes('earnings')) targetMod = 'pe_ratio';
      else if (q.includes('roe') || q.includes('dupont')) targetMod = 'roe_dupont';
      else if (q.includes('beta') || q.includes('sensitivity')) targetMod = 'beta';
      else if (q.includes('vol') || q.includes('risk') || q.includes('standard deviation')) targetMod = 'volatility';
      else if (q.includes('sharpe')) targetMod = 'sharpe_ratio';
      else if (q.includes('drawdown') || q.includes('mdd') || q.includes('crash')) targetMod = 'max_drawdown';
      else if (q.includes('diversif') || q.includes('portfolio')) targetMod = 'portfolio_diversification';
      else if (q.includes('capm')) targetMod = 'capm';

      switchModule(targetMod);
    };

    if (askBtn && aiInput) {
      askBtn.addEventListener('click', () => handleQuery(aiInput.value));
      aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleQuery(aiInput.value);
      });
    }

    document.querySelectorAll('.lab-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.dataset.prompt) handleQuery(chip.dataset.prompt);
      });
    });

    // 7. Mobile Menu
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('mobileMenuOverlay');
    const menuCloseBtn = document.getElementById('mobileMenuCloseBtn');

    if (menuToggle && menuOverlay) {
      menuToggle.addEventListener('click', () => {
        menuOverlay.removeAttribute('hidden');
        document.body.classList.add('menu-locked');
      });
    }
    if (menuCloseBtn && menuOverlay) {
      menuCloseBtn.addEventListener('click', () => {
        menuOverlay.setAttribute('hidden', '');
        document.body.classList.remove('menu-locked');
      });
    }

    // 8. Setup Security Search & Initial Module
    setupSecuritySearch();
    renderConceptTray();
    switchModule('cagr');
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
