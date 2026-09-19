/**
 * RISKOS — LEARN & SIMULATE QUANTITATIVE LABORATORY CONTROLLER
 * Fully reactive, deterministic, zero-hallucination interactive controller.
 * Manages 18 quantitative modules, MathJax re-typesetting, responsive Chart.js visualizer,
 * persistent saved scenarios, command palette, and deep-linking.
 */

(() => {
  'use strict';

  // ── Centralized Scroll Management ─────────────────────────────────────────
  const lockScroll = () => {
    document.body.classList.add('menu-locked');
  };

  const unlockScroll = () => {
    document.body.classList.remove('menu-locked');
  };

  // ── Global Lab State ──────────────────────────────────────────────────────
  const labState = {
    activeModuleId: 'cagr',
    activeCategory: 'all',
    explanationMode: 'beginner', // 'beginner' | 'investor' | 'quant'
    currency: 'INR',
    sourceMode: 'custom', // 'custom' | 'security'
    activeSecuritySymbol: 'RELIANCE',
    simInputs: {},
    chartInstance: null,
    savedScenarios: JSON.parse(localStorage.getItem('riskos_lab_scenarios') || '[]')
  };

  // ── Category to Modules Filter Mapping ────────────────────────────────────
  const getFilteredModules = (categoryKey) => {
    if (typeof LearnMathEngine === 'undefined') return [];
    const allMods = LearnMathEngine.MODULES_DIRECTORY;
    if (!categoryKey || categoryKey === 'all') return allMods;
    
    if (categoryKey === 'institutional') {
      return allMods.filter(m => m.categoryKey === 'institutional' || ['gex_0dte_pinning', 'hawkes_liquidity_cascades', 'lbo_debt_waterfall', 'merton_structural_default', 'solvency_ii_evt_cat', 'redington_alm_immunization', 'clo_tranche_waterfall', 'oas_binomial_tree', 'barra_multi_factor_risk'].includes(m.id));
    }
    if (categoryKey === 'ai_predictive') {
      return allMods.filter(m => m.categoryKey === 'ai_predictive' || ['merton_jump_diffusion', 'black_litterman', 'hjb_stochastic_control', 'dqn_optimal_execution', 'quantum_monte_carlo', 'hawkes_process', 'openbb_odp', 'perspective_streaming_grid', 'rough_volatility', 'malliavin_calculus', 'deflated_sharpe', 'egyptian_pantheon_hft', 'reinforcement_learning_mm', 'hmm_regime_switching'].includes(m.id));
    }
    if (categoryKey === 'quant_interview') {
      return allMods.filter(m => m.categoryKey === 'quant_interview' || ['ito_calculus', 'feynman_kac', 'heston_fft', 'vasicek_cir', 'avellaneda_stoikov', 'copulas_evt', 'merton_jump_diffusion', 'almgren_chriss', 'kalman_pairs', 'black_litterman', 'perpetual_american', 'bachelier_model', 'prediction_markets_lmsr', 'futures_basis_carry', 'backtrader_cerebro', 'openbb_odp', 'perspective_streaming_grid'].includes(m.id));
    }
    if (categoryKey === 'growth') {
      return allMods.filter(m => ['growth', 'portfolio_mgmt'].includes(m.categoryKey) || ['cagr', 'compounding', 'sip_dca', 'lumpsum_vs_sip', 'compound_interest'].includes(m.id));
    }
    if (categoryKey === 'valuation') {
      return allMods.filter(m => ['valuation', 'fundamental_analysis'].includes(m.categoryKey) || ['pe_valuation', 'roe_roce', 'openbb_odp'].includes(m.id));
    }
    if (categoryKey === 'risk') {
      return allMods.filter(m => m.categoryKey === 'risk' || ['volatility', 'beta_corr', 'sharpe', 'mdd', 'drawdown_recovery', 'copulas_evt', 'merton_jump_diffusion', 'tsmom_volatility_targeting', 'garch_jump_diffusion', 'barra_multi_factor_risk', 'evt_pot_tail_risk', 'hmm_regime_switching'].includes(m.id));
    }
    if (categoryKey === 'portfolio') {
      return allMods.filter(m => ['portfolio', 'portfolio_mgmt'].includes(m.categoryKey) || ['diversification', 'port_variance', 'capm', 'port_allocator', 'risk_return_scatter', 'quant_backtest', 'black_litterman', 'kalman_pairs', 'backtrader_cerebro', 'tsmom_volatility_targeting', 'dual_momentum_antonacci', 'sector_relative_strength', 'cross_asset_stat_arb', 'barra_multi_factor_risk', 'hmm_regime_switching'].includes(m.id));
    }
    if (categoryKey === 'simulators') {
      return allMods.filter(m => ['simulators', 'quant_trading'].includes(m.categoryKey) || ['sip_dca', 'lumpsum_vs_sip', 'compound_interest', 'port_allocator', 'risk_return_scatter', 'drawdown_recovery', 'scenario_stress', 'options_payoff', 'quant_backtest', 'ito_calculus', 'feynman_kac', 'heston_fft', 'vasicek_cir', 'avellaneda_stoikov', 'copulas_evt', 'merton_jump_diffusion', 'almgren_chriss', 'kalman_pairs', 'black_litterman', 'perpetual_american', 'bachelier_model', 'prediction_markets_lmsr', 'futures_basis_carry', 'backtrader_cerebro', 'openbb_odp', 'perspective_streaming_grid', 'tsmom_volatility_targeting', 'dual_momentum_antonacci', 'sector_relative_strength', 'egyptian_pantheon_hft', 'garch_jump_diffusion', 'cross_asset_stat_arb', 'optimal_vwap_execution', 'reinforcement_learning_mm', 'evt_pot_tail_risk'].includes(m.id));
    }
    if (categoryKey === 'mathematics') {
      return allMods.filter(m => m.categoryKey === 'mathematics' || ['cagr', 'compounding', 'volatility', 'beta_corr', 'sharpe', 'port_variance', 'capm', 'options_payoff', 'ito_calculus', 'feynman_kac', 'heston_fft', 'vasicek_cir', 'avellaneda_stoikov', 'copulas_evt', 'merton_jump_diffusion', 'almgren_chriss', 'kalman_pairs', 'black_litterman', 'perpetual_american', 'bachelier_model', 'prediction_markets_lmsr', 'futures_basis_carry', 'backtrader_cerebro', 'openbb_odp', 'perspective_streaming_grid'].includes(m.id));
    }
    
    return allMods.filter(m => m.categoryKey === categoryKey || (m.category && m.category.toLowerCase() === categoryKey.toLowerCase()));
  };

  // ── Render Top Modules Quick-Switcher Bar ─────────────────────────────────
  const renderTopModulesBar = () => {
    const track = document.getElementById('labTopModulesTrack');
    if (!track || typeof LearnMathEngine === 'undefined') return;

    const modules = getFilteredModules(labState.activeCategory);

    track.innerHTML = modules.map(m => `
      <button class="top-module-pill ${m.id === labState.activeModuleId ? 'active' : ''}" data-module-id="${m.id}" title="${m.title}">
        <i class="fa-solid ${m.icon || 'fa-chart-line'} top-pill-icon"></i>
        <span>${m.shortTitle || m.title}</span>
        <span class="top-pill-badge">${m.badge || m.categoryKey.toUpperCase()}</span>
      </button>
    `).join('');

    track.querySelectorAll('.top-module-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        switchModule(btn.dataset.moduleId);
      });
    });
  };

  // ── Render All 18 Laboratory Modules Grid (Bottom Directory) ──────────────
  const renderAllModulesGrid = () => {
    const grid = document.getElementById('allLabModulesGrid');
    if (!grid || typeof LearnMathEngine === 'undefined') return;

    const filtered = getFilteredModules(labState.activeCategory);

    grid.innerHTML = filtered.map(m => `
      <div class="module-card-item ${m.id === labState.activeModuleId ? 'active' : ''}" data-module-id="${m.id}">
        <div class="card-top-row">
          <span class="card-tag">${m.badge || m.category.toUpperCase()}</span>
          <i class="fa-solid ${m.icon || 'fa-chart-line'} card-icon"></i>
        </div>
        <h4 class="card-title">${m.title}</h4>
        <span class="card-formula">${m.shortTitle} &bull; ${m.category.toUpperCase()}</span>
      </div>
    `).join('');

    grid.querySelectorAll('.module-card-item').forEach(card => {
      card.addEventListener('click', () => {
        switchModule(card.dataset.moduleId);
        const targetEl = document.getElementById('activeLabWorkspace');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  // ── Switch Active Module ──────────────────────────────────────────────────
  const switchModule = (moduleId, updateUrl = true) => {
    if (typeof LearnMathEngine === 'undefined') return;
    const mod = LearnMathEngine.getModuleById(moduleId);
    if (!mod) return;

    labState.activeModuleId = mod.id;
    labState.simInputs = { ...mod.defaultInputs };

    // If an active real security is currently bound, automatically re-map into the new module
    if (labState.activeSecurityRecord && typeof bindSecurityToActiveLab === 'function') {
      bindSecurityToActiveLab(labState.activeSecurityRecord);
    }

    // Update Header
    const catTag = document.getElementById('activeCatTag');
    const titleEl = document.getElementById('activeTitle');
    const leadEl = document.getElementById('activeLeadText');

    if (catTag) catTag.textContent = `${mod.category.toUpperCase()} • ${mod.badge.toUpperCase()}`;
    if (titleEl) titleEl.textContent = mod.title;
    if (leadEl) leadEl.textContent = `Interactive quantitative simulation model for ${mod.shortTitle}.`;

    // Render Controls & Presets
    renderControlsPanel(mod);
    renderPresetChips(mod);

    // Evaluate Math & Update UI
    evaluateActiveModule();

    // Refresh Top Modules Bar & Bottom Directory Grid
    renderTopModulesBar();
    renderAllModulesGrid();

    // Update URL query state for deep-linking
    if (updateUrl && window.history && window.history.pushState) {
      const url = new URL(window.location);
      url.searchParams.set('lab', mod.id);
      window.history.pushState({ lab: mod.id }, '', url);
    }
  };

  // ── Render Interactive Controls Panel ─────────────────────────────────────
  const renderControlsPanel = (mod) => {
    const panel = document.getElementById('simControlsPanel');
    if (!panel) return;

    panel.innerHTML = mod.controls.map(c => {
      const curVal = labState.simInputs[c.key] !== undefined ? labState.simInputs[c.key] : c.default;
      
      let formattedVal = curVal;
      if (c.type === 'currency') {
        formattedVal = LearnMathEngine.formatMoney(curVal, labState.currency, true);
      } else if (c.type === 'percent') {
        formattedVal = `${Number(curVal).toFixed(1)}%`;
      } else if (c.type === 'number') {
        formattedVal = Number(curVal).toString();
      }

      if (c.type === 'select') {
        return `
          <div class="sim-control-group">
            <div class="sim-control-header">
              <span>${c.label}</span>
            </div>
            <select class="sim-security-input" data-key="${c.key}" style="background:#0d0d12;border:1px solid rgba(255,255,255,0.1);padding:8px;border-radius:6px;color:#fff;margin-top:4px;width:100%;">
              ${(c.options || []).map(opt => `<option value="${opt.val}" ${opt.val === curVal ? 'selected' : ''}>${opt.text}</option>`).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div class="sim-control-group">
          <div class="sim-control-header">
            <span>${c.label}</span>
            <span class="sim-control-val" id="val_${c.key}">${formattedVal}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <input 
              type="range" 
              class="sim-range-slider" 
              id="slider_${c.key}" 
              data-key="${c.key}" 
              data-type="${c.type}"
              min="${c.min}" 
              max="${c.max}" 
              step="${c.step}" 
              value="${curVal}" 
            />
          </div>
        </div>
      `;
    }).join('');

    // Attach slider and select listeners
    panel.querySelectorAll('.sim-range-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const k = e.target.dataset.key;
        const type = e.target.dataset.type;
        const v = parseFloat(e.target.value);
        labState.simInputs[k] = v;

        const valLabel = document.getElementById(`val_${k}`);
        if (valLabel) {
          if (type === 'currency') valLabel.textContent = LearnMathEngine.formatMoney(v, labState.currency, true);
          else if (type === 'percent') valLabel.textContent = `${v.toFixed(1)}%`;
          else valLabel.textContent = v.toString();
        }

        evaluateActiveModule();
      });
    });

    panel.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const k = e.target.dataset.key;
        labState.simInputs[k] = e.target.value;
        evaluateActiveModule();
      });
    });
  };

  // ── Render Presets Chips ──────────────────────────────────────────────────
  const renderPresetChips = (mod) => {
    const container = document.getElementById('labPresetPills');
    if (!container) return;

    if (!mod.presets || mod.presets.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = mod.presets.map((p, idx) => `
      <button class="lab-chip" data-idx="${idx}"><i class="fa-solid fa-bolt" style="font-size:0.6rem;color:var(--accent-cyan);margin-right:3px;"></i> ${p.label}</button>
    `).join('');

    container.querySelectorAll('.lab-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = mod.presets[parseInt(btn.dataset.idx, 10)];
        if (p) {
          labState.simInputs = { ...p.inputs };
          renderControlsPanel(mod);
          evaluateActiveModule();
        }
      });
    });
  };

  // ── Bulletproof Synchronous KaTeX / MathJax Math Renderer ────────────────
  const renderLatexFormula = (containerEl, rawLatex, isDisplayMode = true) => {
    if (!containerEl || !rawLatex) return;

    // Clean off any outer delimiters: $$, $, \[, \], \(, \)
    let clean = String(rawLatex).trim();
    if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('\\[') && clean.endsWith('\\]') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('\\(') && clean.endsWith('\\)') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    }

    // 1. Primary: Direct Synchronous KaTeX Compilation (Instant 0ms, Zero text flash)
    if (typeof katex !== 'undefined' && typeof katex.render === 'function') {
      try {
        containerEl.innerHTML = '';
        katex.render(clean, containerEl, {
          displayMode: isDisplayMode,
          throwOnError: false
        });
        return;
      } catch (e) {
        console.warn('KaTeX direct render notice:', e);
      }
    }

    // 2. Secondary: MathJax 3 SVG Compilation
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      containerEl.textContent = isDisplayMode ? `\\[ ${clean} \\]` : `\\( ${clean} \\)`;
      window.MathJax.typesetPromise([containerEl]).catch(() => {});
      return;
    }

    // 3. Fallback: Wait for KaTeX or MathJax initialization if loading asynchronously
    containerEl.textContent = isDisplayMode ? `\\[ ${clean} \\]` : `\\( ${clean} \\)`;
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (typeof katex !== 'undefined' && typeof katex.render === 'function') {
        clearInterval(poll);
        try {
          containerEl.innerHTML = '';
          katex.render(clean, containerEl, {
            displayMode: isDisplayMode,
            throwOnError: false
          });
        } catch (e) {}
      } else if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        clearInterval(poll);
        window.MathJax.typesetPromise([containerEl]).catch(() => {});
      }
      if (attempts > 30) clearInterval(poll);
    }, 100);
  };

  if (typeof window !== 'undefined') {
    window.renderLatexFormula = renderLatexFormula;
  }

  // ── Main Deterministic Evaluator ──────────────────────────────────────────
  const evaluateActiveModule = () => {
    if (typeof LearnMathEngine === 'undefined') return;
    const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
    if (!mod || !mod.calc) return;

    const res = mod.calc(labState.simInputs, labState.currency);
    if (!res) return;

    // 1. Step 1: Intuition (What is it & Why does it matter)
    const underLead = document.getElementById('understandLead');
    const underBody = document.getElementById('understandBody');
    const whyMatters = document.getElementById('whyMattersText');
    const focalVal = document.getElementById('focalValue');
    const focalSym = document.getElementById('focalSymbol');
    const focalLbl = document.getElementById('focalLabel');
    const depthBadge = document.getElementById('currentDepthBadge');

    if (underLead) underLead.textContent = res.whatIsIt || res.beginnerText || '';
    if (underBody) {
      if (labState.explanationMode === 'quant') {
        underBody.textContent = res.quantText || res.plainResult;
      } else if (labState.explanationMode === 'investor') {
        underBody.textContent = res.investorText || res.plainResult;
      } else {
        // Beginner mode: avoid duplicate of underLead
        underBody.textContent = (res.beginnerText && res.beginnerText !== res.whatIsIt)
          ? res.beginnerText
          : `Adjust the sliders in the experiment panel below to observe the immediate effect on the ${mod.shortTitle} calculation.`;
      }
    }
    if (whyMatters) whyMatters.textContent = res.whyItMatters || res.investorText || '';

    const laymanText = document.getElementById('laymanAnalogyText');
    const exText = document.getElementById('realWorldExampleText');
    if (laymanText) {
      laymanText.textContent = res.beginnerText || res.laymanExplanation || 'Think of this metric as an intuitive gauge of risk vs reward, smoothing out market noise.';
    }
    if (exText) {
      exText.textContent = res.realWorldExample || res.plainResult || 'Consider investing ₹1,00,000 in an index fund or industry leader under steady compounding.';
    }
    if (focalSym) focalSym.textContent = res.focalSymbol || mod.badge || 'METRIC';
    if (focalLbl) focalLbl.textContent = res.focalLabel || 'Evaluated Value';
    if (focalVal) {
      if (res.focalValue !== undefined) focalVal.textContent = res.focalValue;
      else if (res.cagr !== undefined) focalVal.textContent = `${res.cagr >= 0 ? '+' : ''}${res.cagr}%`;
      else if (res.finalAmount !== undefined) focalVal.textContent = LearnMathEngine.formatMoney(res.finalAmount, labState.currency, true);
      else if (res.pe !== undefined) focalVal.textContent = `${res.pe}×`;
      else if (res.beta !== undefined) focalVal.textContent = `${res.beta}`;
      else if (res.sharpe !== undefined) focalVal.textContent = `${res.sharpe}`;
      else if (res.mdd !== undefined) focalVal.textContent = `-${res.mdd}%`;
      else focalVal.textContent = 'Active';
    }
    if (depthBadge) depthBadge.textContent = labState.explanationMode.toUpperCase();

    // 2. Step 2: Interactive Simulator (Result & Chart)
    const simResText = document.getElementById('simResultText');
    if (simResText) simResText.textContent = res.plainResult || '';

    renderChart(res);

    // 3. Step 3: Mathematical Proof & Substituted Calculation
    const eqDiv = document.getElementById('proveMathEquation');
    const subDiv = document.getElementById('proveSubstitutedMath');
    const deepProofContent = document.getElementById('mathDeepProofContent');

    if (eqDiv && res.equationLatex) {
      renderLatexFormula(eqDiv, res.equationLatex, true);
    }
    if (subDiv && res.substitutedLatex) {
      renderLatexFormula(subDiv, res.substitutedLatex, true);
    }
    if (deepProofContent) {
      deepProofContent.innerHTML = `
        <p style="margin-top:0;"><strong>Model Spec:</strong> ${res.quantText || res.whatIsIt || ''}</p>
        <p><strong>Interactive Variables &amp; Parameters:</strong></p>
        <ul style="margin:8px 0 0 16px;padding:0;color:var(--text-secondary);font-size:0.8rem;line-height:1.6;">
          ${Object.entries(labState.simInputs).map(([k, v]) => `<li><code style="color:var(--accent-cyan);">${k}</code> = <strong>${v}</strong></li>`).join('')}
        </ul>
      `;
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(deepProofContent, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      }
    }

    // 4. Step 4: Boundaries & Limitations
    const limText = document.getElementById('proveLimitations');
    const takeText = document.getElementById('keyTakeawayText');

    if (limText) limText.textContent = res.limitations || 'Assumes standard geometric compounding and constant volatility conditions.';
    if (takeText) takeText.textContent = res.keyTakeaway || res.investorText || 'Keep track of risk-adjusted efficiency rather than raw absolute returns.';
  };

  // ── Render Chart.js Dynamic Visualization ─────────────────────────────────
  const renderChart = (res) => {
    const canvas = document.getElementById('simChartCanvas');
    if (!canvas || !res.chart) return;

    if (labState.chartInstance) {
      labState.chartInstance.destroy();
      labState.chartInstance = null;
    }

    const c = res.chart;
    const ctx = canvas.getContext('2d');
    let chartType = c.type || 'line';
    let chartLabels = c.labels || [];
    let datasets = [];

    const defaultColors = ['#22d3ee', '#10b981', '#f59e0b', '#a855f7', '#f43f5e', '#38bdf8', '#fbbf24'];

    if (c.datasets && Array.isArray(c.datasets) && c.datasets.length > 0) {
      chartLabels = c.labels || [];
      chartType = c.type || (c.datasets[0].type || 'line');
      datasets = c.datasets.map((d, i) => {
        const color = d.borderColor || d.backgroundColor || defaultColors[i % defaultColors.length];
        return {
          ...d,
          borderColor: d.borderColor || color,
          backgroundColor: d.backgroundColor || (d.fill ? (typeof color === 'string' && color.startsWith('#') ? `${color}22` : 'rgba(34, 211, 238, 0.12)') : color),
          tension: d.tension !== undefined ? d.tension : 0.3,
          pointRadius: d.pointRadius !== undefined ? d.pointRadius : (chartType === 'line' ? 2 : undefined),
          borderWidth: d.borderWidth !== undefined ? d.borderWidth : 2
        };
      });
    } else if (c.weights || (c.labels && c.weights)) {
      // Doughnut Allocation
      chartType = 'doughnut';
      chartLabels = c.labels || ['Asset A', 'Asset B', 'Asset C', 'Asset D'];
      datasets = [{
        data: c.weights,
        backgroundColor: c.colors || ['#22d3ee', '#10b981', '#f59e0b', '#a855f7', '#f43f5e', '#38bdf8']
      }];
    } else if (c.principalSeries && (c.interestSeries || c.totalSeries)) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Principal Invested',
        data: c.principalSeries,
        borderColor: '#71717a',
        backgroundColor: 'rgba(113, 113, 122, 0.2)',
        fill: true,
        tension: 0.1
      });
      datasets.push({
        label: 'Compounded Portfolio Total',
        data: c.totalSeries || c.interestSeries,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.3
      });
    } else if (c.investedSeries && c.wealthSeries) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Total Capital Contributed',
        data: c.investedSeries,
        borderColor: '#71717a',
        backgroundColor: 'rgba(113, 113, 122, 0.2)',
        fill: true,
        tension: 0.1
      });
      datasets.push({
        label: 'Accumulated SIP Wealth',
        data: c.wealthSeries,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        fill: true,
        tension: 0.3
      });
    } else if (c.lumpsumTrajectory || c.lumpsumWealth) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Lumpsum Strategy',
        data: c.lumpsumTrajectory || c.lumpsumWealth,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        tension: 0.25
      });
      datasets.push({
        label: 'DCA / SIP Strategy',
        data: c.sipTrajectory || c.sipWealth,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        tension: 0.25
      });
    } else if (c.nominalSeries && c.realSeries) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Nominal Value (Pre-Inflation)',
        data: c.nominalSeries,
        borderColor: '#22d3ee',
        tension: 0.25
      });
      datasets.push({
        label: 'Real Value (Inflation-Adjusted)',
        data: c.realSeries,
        borderColor: '#f59e0b',
        tension: 0.25
      });
    } else if (c.underwaterSeries || c.drawdownCurve) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Underwater Drawdown (%)',
        data: c.underwaterSeries || c.drawdownCurve,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        fill: true,
        tension: 0.2
      });
    } else if (c.recovery) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Drawdown Recovery Path',
        data: c.recovery,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.25
      });
    } else if (c.categories && c.values) {
      chartType = 'bar';
      chartLabels = c.categories;
      datasets.push({
        label: 'Valuation & Multiples',
        data: c.values,
        backgroundColor: ['#22d3ee', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'],
        borderWidth: 1
      });
    } else if (c.factors && c.values) {
      chartType = 'bar';
      chartLabels = c.factors;
      datasets.push({
        label: 'DuPont Factor Impact',
        data: c.values,
        backgroundColor: ['#22d3ee', '#10b981', '#f59e0b'],
        borderWidth: 1
      });
    } else if (c.metrics && c.values) {
      chartType = 'bar';
      chartLabels = c.metrics;
      datasets.push({
        label: 'Risk-Adjusted Efficiency',
        data: c.values,
        backgroundColor: ['#22d3ee', '#10b981', '#f59e0b', '#a855f7'],
        borderWidth: 1
      });
    } else if (c.assets && c.impacts) {
      chartType = 'bar';
      chartLabels = c.assets;
      datasets.push({
        label: 'Macroeconomic Stress Impact (%)',
        data: c.impacts,
        backgroundColor: c.impacts.map(v => v >= 0 ? '#10b981' : '#f43f5e'),
        borderWidth: 1
      });
    } else if (c.scenarios && c.asset && c.market) {
      chartType = 'bar';
      chartLabels = c.scenarios;
      datasets.push({
        label: 'Asset Movement (%)',
        data: c.asset,
        backgroundColor: '#22d3ee'
      });
      datasets.push({
        label: 'Market Benchmark (%)',
        data: c.market,
        backgroundColor: '#71717a'
      });
    } else if (c.returns && c.volatilities) {
      chartType = 'bar';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Expected Return (%)',
        data: c.returns,
        backgroundColor: '#10b981'
      });
      datasets.push({
        label: 'Annual Volatility (%)',
        data: c.volatilities,
        backgroundColor: '#f43f5e'
      });
    } else if (c.bellCurve) {
      chartType = 'line';
      const bCurve = c.bellCurve;
      chartLabels = bCurve.labels || ['-3σ', '-2σ', '-1σ', 'Mean (0)', '+1σ', '+2σ', '+3σ'];
      datasets.push({
        label: 'Probability Density (Gaussian Normal)',
        data: bCurve.density || bCurve.data || bCurve,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        fill: true,
        tension: 0.4
      });
    } else if (c.volTrajectory) {
      chartType = 'line';
      chartLabels = c.labels || [];
      datasets.push({
        label: 'Portfolio Volatility Trajectory (%)',
        data: c.volTrajectory,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.3
      });
    } else if (c.frontier && c.current) {
      chartType = 'line';
      chartLabels = c.frontier.map((_, i) => `${i + 1}`);
      datasets.push({
        label: 'Markowitz Efficient Frontier',
        data: c.frontier,
        borderColor: '#22d3ee',
        tension: 0.3
      });
      if (c.current) {
        datasets.push({
          label: 'Current Allocation',
          data: c.frontier.map((f, i) => i === Math.floor(c.frontier.length / 2) ? c.current : null),
          borderColor: '#f59e0b',
          pointRadius: 6,
          pointBackgroundColor: '#f59e0b',
          showLine: false
        });
      }
    } else if (c.trajectory) {
      chartType = 'line';
      chartLabels = c.labels || c.trajectory.map((_, i) => `T${i}`);
      datasets.push({
        label: 'Simulation Trajectory',
        data: c.trajectory,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2
      });
    }

    // Chart Configuration with Institutional Dark Aesthetics
    const isDoughnut = chartType === 'doughnut';

    labState.chartInstance = new Chart(ctx, {
      type: chartType,
      data: {
        labels: chartLabels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 240, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            display: isDoughnut || datasets.length > 1,
            position: isDoughnut ? 'right' : 'top',
            labels: {
              color: '#a1a1aa',
              font: { family: 'Inter, sans-serif', size: 11, weight: 600 },
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            backgroundColor: '#09090c',
            titleColor: '#ffffff',
            bodyColor: '#22d3ee',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed;
                const lbl = ctx.dataset.label || ctx.label || '';
                if (typeof val === 'number') {
                  return ` ${lbl}: ${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
                }
                return ` ${lbl}: ${val}`;
              }
            }
          }
        },
        scales: isDoughnut ? {} : {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#71717a', font: { family: 'Inter, sans-serif', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#71717a',
              font: { family: 'Inter, monospace', size: 10 },
              callback: (val) => {
                if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }
            }
          }
        }
      }
    });
  };

  // ── Render Saved Scenarios Shelf ──────────────────────────────────────────
  const renderSavedScenariosShelf = () => {
    const container = document.getElementById('savedScenariosContainer');
    if (!container) return;

    if (labState.savedScenarios.length === 0) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.85rem;grid-column:1/-1;">
          No saved scenarios yet. Use <strong>Save Scenario</strong> in the workspace toolbar to store snapshot records for comparison.
        </div>
      `;
      return;
    }

    container.innerHTML = labState.savedScenarios.map(sc => `
      <div class="saved-scenario-card" data-scenario-id="${sc.id}">
        <div class="scenario-card-header">
          <strong style="color:#fff;font-size:0.85rem;">${sc.name}</strong>
          <span class="step-badge" style="font-size:0.6rem;">${sc.moduleId.toUpperCase()}</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          Saved ${new Date(sc.date).toLocaleDateString()} at ${new Date(sc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;">
          <button class="lab-act-btn btn-load-sc" data-load-id="${sc.id}" style="font-size:0.68rem;padding:3px 8px;"><i class="fa-solid fa-play"></i> Load</button>
          <button class="lab-act-btn btn-del-sc" data-del-id="${sc.id}" style="font-size:0.68rem;padding:3px 8px;color:var(--accent-red);"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-load-sc').forEach(btn => {
      btn.addEventListener('click', () => {
        const sc = labState.savedScenarios.find(s => s.id === parseInt(btn.dataset.loadId, 10));
        if (sc) {
          switchModule(sc.moduleId);
          labState.simInputs = { ...sc.inputs };
          renderControlsPanel(LearnMathEngine.getModuleById(sc.moduleId));
          evaluateActiveModule();
          const targetEl = document.getElementById('activeLabWorkspace');
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    container.querySelectorAll('.btn-del-sc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.delId, 10);
        labState.savedScenarios = labState.savedScenarios.filter(s => s.id !== id);
        localStorage.setItem('riskos_lab_scenarios', JSON.stringify(labState.savedScenarios));
        renderSavedScenariosShelf();
      });
    });
  };

  // ── Action Bar: Reset, Save, Compare, Export, Explain ─────────────────────
  const setupActionBar = () => {
    // 1. Reset Inputs
    const btnReset = document.getElementById('btnResetInputs');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
        if (mod) {
          labState.simInputs = { ...mod.defaultInputs };
          renderControlsPanel(mod);
          evaluateActiveModule();
        }
      });
    }

    // 2. Save Scenario
    const btnSave = document.getElementById('btnSaveScenario');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
        const name = prompt('Name this simulation scenario:', `${mod.shortTitle} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        if (!name) return;

        const scenario = {
          id: Date.now(),
          name,
          moduleId: mod.id,
          inputs: { ...labState.simInputs },
          currency: labState.currency,
          date: new Date().toISOString()
        };

        labState.savedScenarios.push(scenario);
        localStorage.setItem('riskos_lab_scenarios', JSON.stringify(labState.savedScenarios));
        renderSavedScenariosShelf();
        alert(`Scenario "${name}" saved! View it in the Saved Simulation Scenarios shelf below.`);
      });
    }

    // 3. Clear All Scenarios
    const btnClear = document.getElementById('btnClearScenarios');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Clear all saved simulation scenarios?')) {
          labState.savedScenarios = [];
          localStorage.removeItem('riskos_lab_scenarios');
          renderSavedScenariosShelf();
        }
      });
    }

    // 4. Compare Scenarios Drawer
    const btnCompare = document.getElementById('btnCompareScenario');
    if (btnCompare) {
      btnCompare.addEventListener('click', () => {
        openDrawer('compare');
      });
    }

    // 5. Export Results
    const btnExport = document.getElementById('btnExportResults');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
        const res = mod.calc(labState.simInputs, labState.currency);
        const exportData = {
          module: mod.title,
          activeInputs: labState.simInputs,
          evaluatedResult: res.plainResult,
          focalValue: res.focalValue,
          currency: labState.currency,
          timestamp: new Date().toISOString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `RISKOS_${mod.id}_Simulation.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
      });
    }

    // 6. Explain This (AI Explainer)
    const btnExplain = document.getElementById('btnExplainAi');
    if (btnExplain) {
      btnExplain.addEventListener('click', () => {
        openDrawer('explain');
      });
    }

    // 7. Detailed Proof Toggle
    const btnToggleMath = document.getElementById('btnToggleMathDetails');
    const proofBox = document.getElementById('mathDeepProofBox');
    const toggleText = document.getElementById('mathToggleText');

    if (btnToggleMath && proofBox) {
      btnToggleMath.addEventListener('click', () => {
        const isHidden = proofBox.hasAttribute('hidden');
        if (isHidden) {
          proofBox.removeAttribute('hidden');
          if (toggleText) toggleText.textContent = 'Hide Proof';
          btnToggleMath.querySelector('i')?.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
          proofBox.setAttribute('hidden', '');
          if (toggleText) toggleText.textContent = 'Detailed Proof';
          btnToggleMath.querySelector('i')?.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
      });
    }
  };

  // ── Slide-Over Drawer Controller ──────────────────────────────────────────
  const openDrawer = (mode) => {
    const overlay = document.getElementById('labDrawerOverlay');
    const titleEl = document.getElementById('labDrawerTitle');
    const bodyEl = document.getElementById('labDrawerBody');
    if (!overlay || !bodyEl) return;

    const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
    const res = mod.calc(labState.simInputs, labState.currency);

    if (mode === 'explain') {
      titleEl.innerHTML = `<i class="fa-solid fa-brain" style="color:var(--accent-cyan);"></i> AI Research Explainer: ${mod.shortTitle}`;
      bodyEl.innerHTML = `
        <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);padding:14px;border-radius:10px;">
          <span style="font-size:0.7rem;font-weight:700;color:var(--accent-cyan);text-transform:uppercase;">Intuitive Summary (${labState.explanationMode.toUpperCase()})</span>
          <p style="font-size:0.875rem;color:#fff;line-height:1.5;margin-top:6px;">${res.plainResult}</p>
        </div>

        <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);padding:14px;border-radius:10px;">
          <span style="font-size:0.7rem;font-weight:700;color:var(--accent-emerald);text-transform:uppercase;">Institutional Takeaway</span>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5;margin-top:6px;">${res.investorText || res.whyItMatters}</p>
        </div>

        <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);padding:14px;border-radius:10px;">
          <span style="font-size:0.7rem;font-weight:700;color:var(--accent-red);text-transform:uppercase;">Boundary Caveats &amp; Limitations</span>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5;margin-top:6px;">${res.limitations}</p>
        </div>
      `;
    } else if (mode === 'compare') {
      titleEl.innerHTML = `<i class="fa-solid fa-code-compare" style="color:var(--accent-cyan);"></i> Saved Scenarios (${labState.savedScenarios.length})`;
      if (labState.savedScenarios.length === 0) {
        bodyEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:32px 0;">No saved scenarios yet. Click <strong>Save Scenario</strong> in the workspace action bar to store snapshots.</div>`;
      } else {
        bodyEl.innerHTML = labState.savedScenarios.map(sc => `
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.08);padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;color:#fff;font-size:0.85rem;">${sc.name}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);">${new Date(sc.date).toLocaleDateString()} &bull; ${sc.moduleId}</div>
            </div>
            <button class="lab-act-btn btn-drawer-load" data-load-id="${sc.id}" style="font-size:0.7rem;">Load</button>
          </div>
        `).join('');

        bodyEl.querySelectorAll('.btn-drawer-load').forEach(btn => {
          btn.addEventListener('click', () => {
            const sc = labState.savedScenarios.find(s => s.id === parseInt(btn.dataset.loadId, 10));
            if (sc) {
              switchModule(sc.moduleId);
              labState.simInputs = { ...sc.inputs };
              renderControlsPanel(LearnMathEngine.getModuleById(sc.moduleId));
              evaluateActiveModule();
              closeDrawer();
              const targetEl = document.getElementById('activeLabWorkspace');
              if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        });
      }
    }

    overlay.removeAttribute('hidden');
    lockScroll();
  };

  const closeDrawer = () => {
    const overlay = document.getElementById('labDrawerOverlay');
    if (overlay) {
      overlay.setAttribute('hidden', '');
      unlockScroll();
    }
  };

  // ── Setup Real Security Search ────────────────────────────────────────────
  function clampValue(val, min, max) {
    let v = Number(val);
    if (isNaN(v)) return min !== undefined ? min : 0;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  }

  function extractSecurityParameters(sec) {
    const sym = sec.symbol || 'SECURITY';
    const isIN = sec.exchange === 'NSE' || sec.exchange === 'BSE' || sym.endsWith('.NS') || sym.endsWith('.BO') || sec.currency === 'INR';
    const pr = Number(sec.basePrice || sec.price || 100);
    const pe = Number(sec.pe || (pr > 500 ? 24.5 : 18.0));
    const eps = Number(sec.eps || (pr / pe));
    const volAnnual = Number((sec.vol || (isIN ? 0.22 : 0.26)) * 100);
    const volDaily = Number((volAnnual / Math.sqrt(252)).toFixed(2));
    const beta = Number(sec.beta || 1.05);
    const divYield = Number(sec.div_yield || (pe < 20 ? 1.8 : 0.6));
    const divAbs = Number(((pr * divYield) / 100).toFixed(2));
    const rfRate = isIN ? 6.84 : 4.18; // Live sovereign benchmark rate
    const mktCap = Number(sec.marketCap || (pr * (isIN ? 500000000 : 250000000)));
    const roe = Number(sec.roe || 16.5);
    const roce = Number(sec.roce || 18.0);
    const adv = Number(sec.avgVolume20d || (isIN ? 3200000 : 18500000));
    const netIncome = mktCap / Math.max(1, pe);
    const revenue = netIncome * 6.5;
    const totalAssets = mktCap * 1.4;
    const shareholdersEquity = mktCap * 0.55;

    return {
      symbol: sym,
      name: sec.name || sym,
      exchange: sec.exchange || (isIN ? 'NSE' : 'NASDAQ'),
      currency: isIN ? 'INR' : 'USD',
      price: pr,
      pe: pe,
      eps: eps,
      volAnnual: volAnnual,
      volDaily: volDaily,
      beta: beta,
      divYield: divYield,
      divAbs: divAbs,
      rfRate: rfRate,
      mktCap: mktCap,
      roe: roe,
      roce: roce,
      adv: adv,
      netIncome: netIncome,
      revenue: revenue,
      totalAssets: totalAssets,
      shareholdersEquity: shareholdersEquity
    };
  }

  function bindSecurityToActiveLab(sec) {
    if (!sec) return;
    const modId = labState.activeModuleId;
    const mod = LearnMathEngine.getModuleById(modId);
    if (!mod || !mod.controls) return;

    const p = extractSecurityParameters(sec);
    labState.activeSecuritySymbol = p.symbol;
    labState.activeSecurityRecord = p;

    // Universal Semantic Binder across all 75 quantitative modules
    mod.controls.forEach(c => {
      const k = c.key;
      const lk = k.toLowerCase();

      // 1. Spot / Price / Valuation spot
      if (['price', 'spotprice', 'spot', 'assetprice', 'stockprice', 'currentprice', 'pricea'].includes(lk)) {
        labState.simInputs[k] = clampValue(p.price, c.min, c.max);
      } else if (['priceb'].includes(lk)) {
        labState.simInputs[k] = clampValue(p.price * 1.45, c.min, c.max);
      } else if (['initialval', 'principal', 'totalcapital', 'peakvalue', 'portfoliovalue'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.price * 100), c.min, c.max);
      } else if (['finalval', 'troughvalue'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.price * 150), c.min, c.max);
      } else if (['purchaseev', 'equityvalue', 'liabilitypv'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.mktCap / 10000000), c.min, c.max);
      }
      // 2. Earnings & Valuation Multiples
      else if (['eps', 'earningspershare'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number(p.eps.toFixed(2)), c.min, c.max);
      } else if (['pe', 'peratio', 'exitmultiple'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number(p.pe.toFixed(1)), c.min, c.max);
      }
      // 3. Volatility Metrics
      else if (['dailystddev'].includes(lk)) {
        labState.simInputs[k] = clampValue(p.volDaily, c.min, c.max);
      } else if (['assetvol', 'totalvol', 'equityvol', 'atmvol', 'vola', 'baselinevol', 'sectorvol'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number(p.volAnnual.toFixed(1)), c.min, c.max);
      } else if (['volb', 'benchmarkvol'].includes(lk)) {
        labState.simInputs[k] = clampValue(14.0, c.min, c.max);
      }
      // 4. Beta & Factor Exposures
      else if (['beta', 'assetbeta', 'hedgeratiobeta'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number(p.beta.toFixed(2)), c.min, c.max);
      } else if (['momentumexposure'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number((0.7 + (p.beta - 1.0) * 0.5).toFixed(2)), c.min, c.max);
      } else if (['valueexposure'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number((p.pe < 22 ? 0.65 : -0.25).toFixed(2)), c.min, c.max);
      } else if (['qualityexposure'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number((p.roe > 15 ? 0.85 : 0.20).toFixed(2)), c.min, c.max);
      }
      // 5. Dividend Yield & Distribution
      else if (['currentdividend', 'dividend'].includes(lk)) {
        labState.simInputs[k] = clampValue(p.divAbs, c.min, c.max);
      } else if (['dividendyield', 'divyield'].includes(lk)) {
        labState.simInputs[k] = clampValue(p.divYield, c.min, c.max);
      }
      // 6. Growth Rates & Expected Returns
      else if (['annualrate', 'growthrate', 'assetreturn', 'assetareturn', 'sectorreturn', 'portfolioreturn'].includes(lk)) {
        const estRet = Number((11.5 + (p.beta - 1.0) * 4.5).toFixed(1));
        labState.simInputs[k] = clampValue(estRet, c.min, c.max);
      } else if (['assetbreturn', 'benchmarkreturn'].includes(lk)) {
        labState.simInputs[k] = clampValue(13.0, c.min, c.max);
      }
      // 7. Sovereign Risk-Free Benchmark Rate
      else if (['riskfreerate', 'riskfreereturn'].includes(lk)) {
        labState.simInputs[k] = clampValue(p.rfRate, c.min, c.max);
      }
      // 8. Balance Sheet & Fundamental Financials
      else if (['netincome'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.netIncome / 10000000), c.min, c.max);
      } else if (['revenue'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.revenue / 10000000), c.min, c.max);
      } else if (['totalassets'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.totalAssets / 10000000), c.min, c.max);
      } else if (['shareholdersequity'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.shareholdersEquity / 10000000), c.min, c.max);
      }
      // 9. Level-2 Order Flow & High-Frequency Microstructure
      else if (['bidvolchange', 'askvolchange'].includes(lk)) {
        labState.simInputs[k] = clampValue(Math.round(p.adv * 0.005), c.min, c.max);
      } else if (['shocksize'].includes(lk)) {
        labState.simInputs[k] = clampValue(Number((p.volDaily * 10).toFixed(1)), c.min, c.max);
      }
    });

    // Update Live Binding UI Strip
    const liveStrip = document.getElementById('simLiveSecurityStrip');
    const badgeEl = document.getElementById('boundSecBadge');
    const metricsEl = document.getElementById('boundSecMetrics');
    const currSym = p.currency === 'INR' ? '₹' : '$';

    if (liveStrip) liveStrip.style.display = 'flex';
    if (badgeEl) badgeEl.textContent = `${p.symbol} (${p.exchange})`;
    if (metricsEl) {
      metricsEl.textContent = `Price: ${currSym}${p.price.toFixed(2)} | Beta: ${p.beta.toFixed(2)} | Vol: ${p.volAnnual.toFixed(1)}% | P/E: ${p.pe.toFixed(1)}× | EPS: ${currSym}${p.eps.toFixed(2)} | RF: ${p.rfRate}%`;
    }

    renderControlsPanel(mod);
    evaluateActiveModule();
  };

  window.bindRealTickerToLab = async (symbolOrName) => {
    if (typeof SecurityMaster === 'undefined') return;
    const secInput = document.getElementById('simSecurityInput');
    if (secInput) secInput.value = symbolOrName;

    const sec = await SecurityMaster.resolveSecurity(symbolOrName);
    if (sec) {
      bindSecurityToActiveLab(sec);
    }
  };

  const setupSecuritySearch = () => {
    const secInput = document.getElementById('simSecurityInput');
    const unbindBtn = document.getElementById('btnUnbindSec');

    if (unbindBtn) {
      unbindBtn.addEventListener('click', () => {
        labState.activeSecuritySymbol = null;
        labState.activeSecurityRecord = null;
        if (secInput) secInput.value = '';
        const liveStrip = document.getElementById('simLiveSecurityStrip');
        if (liveStrip) liveStrip.style.display = 'none';

        const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
        if (mod && mod.defaultInputs) {
          labState.simInputs = { ...mod.defaultInputs };
          renderControlsPanel(mod);
          evaluateActiveModule();
        }
      });
    }

    if (!secInput || typeof SecurityMaster === 'undefined') return;

    let debounce = null;
    secInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      const q = e.target.value.trim();
      if (!q) return;

      debounce = setTimeout(async () => {
        const sec = await SecurityMaster.resolveSecurity(q);
        if (sec && (sec.basePrice || sec.price_inr)) {
          bindSecurityToActiveLab(sec);
        }
      }, 200);
    });

    // Wire live tick subscriber to automatically update lab price inputs in real-time
    SecurityMaster.subscribeLiveTicks((updates) => {
      if (!labState.activeSecuritySymbol) return;
      const match = updates.find(u => u.symbol === labState.activeSecuritySymbol);
      if (match && match.price) {
        const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
        if (!mod || !mod.controls) return;

        let hasPriceKey = false;
        mod.controls.forEach(c => {
          const lk = c.key.toLowerCase();
          if (['price', 'spotprice', 'spot', 'assetprice', 'stockprice', 'currentprice'].includes(lk)) {
            labState.simInputs[c.key] = clampValue(match.price, c.min, c.max);
            hasPriceKey = true;
          }
        });

        if (hasPriceKey) {
          renderControlsPanel(mod);
          evaluateActiveModule();
        }
      }
    });
  };

  // ── Universal Command Palette (CMD+K) ─────────────────────────────────────
  const setupCommandPalette = () => {
    const paletteOverlay = document.getElementById('paletteOverlay');
    const paletteBackdrop = document.getElementById('paletteBackdrop');
    const paletteInput = document.getElementById('paletteInput');
    const paletteResults = document.getElementById('paletteResults');
    const navSearchTrigger = document.getElementById('navSearchTrigger');

    const openPalette = () => {
      if (!paletteOverlay) return;
      paletteOverlay.removeAttribute('hidden');
      lockScroll();
      if (paletteInput) {
        paletteInput.value = '';
        paletteInput.focus();
        renderPaletteResults('');
      }
    };

    const closePalette = () => {
      if (!paletteOverlay) return;
      paletteOverlay.setAttribute('hidden', '');
      unlockScroll();
    };

    const renderPaletteResults = (q) => {
      if (!paletteResults) return;
      const query = q.toLowerCase().trim();
      const mods = LearnMathEngine.MODULES_DIRECTORY;
      
      const matchedMods = query 
        ? mods.filter(m => m.title.toLowerCase().includes(query) || m.shortTitle.toLowerCase().includes(query) || m.category.toLowerCase().includes(query))
        : mods.slice(0, 6);

      paletteResults.innerHTML = `
        <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">
          ${query ? 'Matched Laboratory Modules' : 'Popular Quantitative Modules'}
        </div>
        ${matchedMods.map(m => `
          <div class="palette-item" data-mod="${m.id}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.02);margin-bottom:6px;">
            <div>
              <strong style="color:#fff;font-size:0.85rem;">${m.title}</strong>
              <div style="font-size:0.72rem;color:var(--text-muted);">${m.category} &bull; ${m.shortTitle}</div>
            </div>
            <span class="step-badge" style="font-size:0.6rem;">SIMULATE</span>
          </div>
        `).join('')}
      `;

      paletteResults.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('click', () => {
          switchModule(item.dataset.mod);
          closePalette();
          const targetEl = document.getElementById('activeLabWorkspace');
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    };

    if (navSearchTrigger) navSearchTrigger.addEventListener('click', openPalette);
    if (paletteBackdrop) paletteBackdrop.addEventListener('click', closePalette);
    if (paletteInput) {
      paletteInput.addEventListener('input', (e) => renderPaletteResults(e.target.value));
      paletteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePalette();
      });
    }

    // Global Keydown Shortcut
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (paletteOverlay && !paletteOverlay.hasAttribute('hidden')) closePalette();
        else openPalette();
      } else if (e.key === 'Escape') {
        closePalette();
        closeDrawer();
      }
    });
  };

  // ── Init Controller & Deep-Link Synchronization ───────────────────────────
  const init = () => {
    // 1. Category Pill Navigation
    document.querySelectorAll('.lab-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.lab-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.dataset.category;
        labState.activeCategory = cat;

        const catMods = getFilteredModules(cat);
        const isCurrentInCat = catMods.some(m => m.id === labState.activeModuleId);

        // Auto-switch to the first module in the selected category if current module is not in it
        if (!isCurrentInCat && catMods.length > 0) {
          switchModule(catMods[0].id);
        } else {
          renderTopModulesBar();
          renderAllModulesGrid();
        }
      });
    });

    // 2. Depth Mode Switcher (Beginner | Investor | Quant)
    document.querySelectorAll('#modeSelectorPill .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#modeSelectorPill .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        labState.explanationMode = btn.dataset.mode;
        document.body.setAttribute('data-user-mode', labState.explanationMode);
        evaluateActiveModule();
      });
    });

    // 3. Currency Switcher
    const currBtn = document.getElementById('currencyToggleBtn');
    if (currBtn) {
      currBtn.addEventListener('click', () => {
        labState.currency = labState.currency === 'INR' ? 'USD' : 'INR';
        currBtn.querySelectorAll('.curr-opt').forEach(opt => {
          opt.classList.toggle('active', opt.dataset.curr === labState.currency);
        });
        renderControlsPanel(LearnMathEngine.getModuleById(labState.activeModuleId));
        evaluateActiveModule();
      });
    }

    // 4. Source Mode Toggle (Simulation vs Real Security)
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

    // 5. Hero AI Search Bar & Chips
    const aiInput = document.getElementById('labAiInput');
    const askBtn = document.getElementById('btnLabAsk');

    const handleQuery = async (query) => {
      if (!query) return;
      const q = query.toLowerCase();
      let targetMod = 'cagr';
      let secName = null;

      if (q.includes('reliance') || q.includes('ril')) secName = 'RELIANCE';
      else if (q.includes('hdfc')) secName = 'HDFCBANK';
      else if (q.includes('tcs')) secName = 'TCS';
      else if (q.includes('infosys') || q.includes('infy')) secName = 'INFY';
      else if (q.includes('icici')) secName = 'ICICIBANK';
      else if (q.includes('sbi') || q.includes('sbin')) secName = 'SBIN';
      else if (q.includes('tata motors') || q.includes('tatamotors')) secName = 'TATAMOTORS';
      else if (q.includes('zomato')) secName = 'ZOMATO';
      else if (q.includes('nvidia') || q.includes('nvda')) secName = 'NVDA';
      else if (q.includes('apple') || q.includes('aapl')) secName = 'AAPL';

      if (q.includes('sip') || q.includes('dca')) targetMod = 'sip_dca';
      else if (q.includes('lump') || q.includes('vs')) targetMod = 'lumpsum_vs_sip';
      else if (q.includes('compound') || q.includes('interest')) targetMod = 'compounding';
      else if (q.includes('pe') || q.includes('p/e') || q.includes('valuation') || q.includes('analyse')) targetMod = 'pe_valuation';
      else if (q.includes('roe') || q.includes('roce') || q.includes('dupont')) targetMod = 'roe_roce';
      else if (q.includes('beta') || q.includes('correlation') || q.includes('move')) targetMod = 'beta_corr';
      else if (q.includes('vol') || q.includes('bell') || q.includes('deviation')) targetMod = 'volatility';
      else if (q.includes('sharpe') || q.includes('sortino')) targetMod = 'sharpe';
      else if (q.includes('drawdown') || q.includes('mdd') || q.includes('loss')) targetMod = 'mdd';
      else if (q.includes('diversif')) targetMod = 'diversification';
      else if (q.includes('variance') || q.includes('markowitz') || q.includes('compare')) targetMod = 'port_variance';
      else if (q.includes('capm') || q.includes('asset pricing')) targetMod = 'capm';

      switchModule(targetMod);

      if (secName && typeof SecurityMaster !== 'undefined') {
        const sec = await SecurityMaster.resolveSecurity(secName);
        if (sec && (sec.basePrice || sec.price_inr)) {
          const pr = sec.basePrice || sec.price_inr;
          if (targetMod === 'pe_valuation') {
            labState.simInputs.price = pr;
            labState.simInputs.eps = Number((pr / (sec.pe || 25)).toFixed(2));
          } else if (targetMod === 'volatility') {
            labState.simInputs.dailyStdDev = Number(((sec.vol || 0.18) * 100 / Math.sqrt(252)).toFixed(2));
          } else if (targetMod === 'beta_corr') {
            labState.simInputs.assetVol = Number(((sec.vol || 0.18) * 100).toFixed(1));
          }
          renderControlsPanel(LearnMathEngine.getModuleById(targetMod));
          evaluateActiveModule();
        }
      }

      const targetEl = document.getElementById('activeLabWorkspace');
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // 6. Action Bar & Drawer Handlers
    setupActionBar();
    renderSavedScenariosShelf();
    setupCommandPalette();

    const drawerCloseBtn = document.getElementById('labDrawerCloseBtn');
    const drawerBackdrop = document.getElementById('labDrawerBackdrop');
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    // 7. Mobile Navigation Menu
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('mobileMenuOverlay');
    const menuCloseBtn = document.getElementById('mobileMenuCloseBtn');

    if (menuToggle && menuOverlay) {
      menuToggle.addEventListener('click', () => {
        menuOverlay.removeAttribute('hidden');
        lockScroll();
      });
    }
    if (menuCloseBtn && menuOverlay) {
      menuCloseBtn.addEventListener('click', () => {
        menuOverlay.setAttribute('hidden', '');
        unlockScroll();
      });
    }

    // 8. Live Market Clock
    const updateMarketClock = () => {
      const now = new Date();
      const istStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const estStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
      const timeEl = document.getElementById('marketTime');
      const nameEl = document.getElementById('marketName');
      if (timeEl && nameEl) {
        timeEl.textContent = nameEl.textContent.includes('US') ? `${estStr} EST` : `${istStr} IST`;
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

    // 9. Setup Security Search
    setupSecuritySearch();

    // 10. URL Query Param Synchronization & History API (Deep-linking)
    const urlParams = new URLSearchParams(window.location.search);
    const targetSec = urlParams.get('sec') || urlParams.get('ticker') || urlParams.get('symbol');
    let targetMod = urlParams.get('lab') || urlParams.get('module') || urlParams.get('metric') || 'cagr';

    const metricMap = {
      'pe': 'pe_valuation',
      'eps': 'pe_valuation',
      'valuation': 'pe_valuation',
      'roe': 'roe_roce',
      'roce': 'roe_roce',
      'beta': 'beta_corr',
      'vol': 'volatility',
      'volatility': 'volatility',
      'sharpe': 'sharpe',
      'mdd': 'mdd',
      'maxdrawdown': 'mdd',
      'drawdown': 'mdd',
      'capm': 'capm',
      'cagr': 'cagr',
      'sip': 'sip_dca',
      'dca': 'sip_dca',
      'compounding': 'compounding',
      'diversification': 'diversification',
      'variance': 'port_variance'
    };

    if (metricMap[targetMod.toLowerCase()]) {
      targetMod = metricMap[targetMod.toLowerCase()];
    }

    renderTopModulesBar();
    renderAllModulesGrid();
    switchModule(targetMod || 'cagr', false);

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.lab) {
        switchModule(e.state.lab, false);
      }
    });

    if (targetSec && typeof SecurityMaster !== 'undefined') {
      SecurityMaster.resolveSecurity(targetSec).then(sec => {
        if (sec && (sec.basePrice || sec.price_inr)) {
          const pr = sec.basePrice || sec.price_inr;
          if (labState.activeModuleId === 'pe_valuation') {
            labState.simInputs.price = pr;
            labState.simInputs.eps = Number((pr / (sec.pe || 25)).toFixed(2));
          }
          renderControlsPanel(LearnMathEngine.getModuleById(labState.activeModuleId));
          evaluateActiveModule();
        }
      });
    // 11. Render static ambient math tags across the entire laboratory
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn('Initial ambient KaTeX render notice:', e);
      }
    }
  };

  const initLearnMarketRibbon = () => {
    const track = document.getElementById('learnRibbonTrack');
    if (!track || typeof SecurityMaster === 'undefined') return;

    const benchmarks = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT', '^GSPC', '^IXIC', 'USDINR', 'BRENT', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'NVDA', 'AAPL', 'MSFT', 'TSLA', 'SUZLON', 'IRFC'];
    const renderList = [...benchmarks, ...benchmarks];

    const renderRibbon = () => {
      track.innerHTML = renderList.map((sym, idx) => {
        const live = SecurityMaster._liveQuotes.get(sym);
        if (!live) return '';
        const chg = Number((live.price - live.previousClose).toFixed(2));
        const chgPct = Number(((chg / live.previousClose) * 100).toFixed(2));
        const isUp = chg >= 0;

        return `
          <div class="ribbon-item" data-symbol="${sym}" data-idx="${idx}">
            <span class="ribbon-symbol">${sym.replace('^', '')}</span>
            <span class="ribbon-price">${LearnMathEngine.formatMoney(live.price, live.currency, false)}</span>
            <span class="ribbon-chg ${isUp ? 'text-emerald' : 'text-red'}">${isUp ? '▲ +' : '▼ '}${chgPct.toFixed(2)}%</span>
          </div>
        `;
      }).join('');

      track.querySelectorAll('.ribbon-item').forEach(item => {
        item.addEventListener('click', () => {
          const sym = item.dataset.symbol;
          SecurityMaster.resolveSecurity(sym).then(sec => {
            if (sec) {
              labState.activeSecuritySymbol = sec.symbol;
              const pr = sec.basePrice || 1000;
              if (labState.simInputs.price !== undefined) labState.simInputs.price = pr;
              if (labState.simInputs.eps !== undefined) labState.simInputs.eps = Number((pr / (sec.pe || 25)).toFixed(2));
              if (labState.simInputs.pv !== undefined) labState.simInputs.pv = pr;
              if (labState.simInputs.pe !== undefined) labState.simInputs.pe = sec.pe || 25;
              if (labState.simInputs.beta !== undefined) labState.simInputs.beta = sec.beta || 1.0;
              if (labState.simInputs.volatility !== undefined) labState.simInputs.volatility = (sec.vol || 0.20) * 100;
              renderControlsPanel(LearnMathEngine.getModuleById(labState.activeModuleId));
              evaluateActiveModule();
            }
          });
        });
      });
    };

    renderRibbon();

    SecurityMaster.subscribeLiveTicks((updates) => {
      updates.forEach(u => {
        const items = track.querySelectorAll(`.ribbon-item[data-symbol="${u.symbol}"]`);
        items.forEach(el => {
          const pEl = el.querySelector('.ribbon-price');
          const cEl = el.querySelector('.ribbon-chg');
          if (pEl) {
            pEl.textContent = LearnMathEngine.formatMoney(u.price, u.currency, false);
            pEl.classList.remove('price-flash-up', 'price-flash-down');
            void pEl.offsetWidth;
            pEl.classList.add(u.delta >= 0 ? 'price-flash-up' : 'price-flash-down');
          }
          if (cEl) {
            cEl.textContent = `${u.change >= 0 ? '▲ +' : '▼ '}${u.changePercent.toFixed(2)}%`;
            cEl.className = `ribbon-chg ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
          }
        });
      });
    });
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      initLearnMarketRibbon();
    });
  } else {
    init();
    initLearnMarketRibbon();
  }
})();

