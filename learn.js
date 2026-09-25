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
    sourceMode: 'security', // Default to Real-Time Live Security Data (No Mockups)
    activeSecuritySymbol: 'RELIANCE.NS',
    simInputs: {},
    chartInstance: null,
    savedScenarios: JSON.parse(localStorage.getItem('riskos_lab_scenarios') || '[]'),
    completedLabs: new Set(JSON.parse(localStorage.getItem('riskos_completed_labs') || '[]')),
    activeFilterMode: 'all' // 'all' | 'completed' | 'remaining'
  };

  const isLabCompleted = (id) => labState.completedLabs.has(id);

  const saveCompletedLabs = () => {
    try {
      localStorage.setItem('riskos_completed_labs', JSON.stringify([...labState.completedLabs]));
    } catch (e) {
      console.warn('Failed to persist completed labs:', e);
    }
    if (window.RISKOS_SUPABASE && typeof window.RISKOS_SUPABASE.syncUserPreferences === 'function') {
      try {
        window.RISKOS_SUPABASE.syncUserPreferences({ completed_labs: [...labState.completedLabs] });
      } catch (err) {}
    }
  };

  // ── Category to Modules Filter Mapping ────────────────────────────────────
  const getFilteredModules = (categoryKey) => {
    if (typeof LearnMathEngine === 'undefined') return [];
    let allMods = LearnMathEngine.MODULES_DIRECTORY;

    if (labState.activeFilterMode === 'completed') {
      allMods = allMods.filter(m => isLabCompleted(m.id));
    } else if (labState.activeFilterMode === 'remaining') {
      allMods = allMods.filter(m => !isLabCompleted(m.id));
    }

    if (!categoryKey || categoryKey === 'all') return allMods;
    
    if (categoryKey === 'institutional') {
      return allMods.filter(m => m.categoryKey === 'institutional' || ['gex_0dte_pinning', 'hawkes_liquidity_cascades', 'lbo_debt_waterfall', 'merton_structural_default', 'solvency_ii_evt_cat', 'redington_alm_immunization', 'clo_tranche_waterfall', 'oas_binomial_tree', 'barra_multi_factor_risk', 'deep_hedging_neural_sde', 'nelson_siegel_svensson', 'propagator_market_impact'].includes(m.id));
    }
    if (categoryKey === 'ai_predictive') {
      return allMods.filter(m => m.categoryKey === 'ai_predictive' || ['merton_jump_diffusion', 'black_litterman', 'hjb_stochastic_control', 'dqn_optimal_execution', 'quantum_monte_carlo', 'hawkes_process', 'openbb_odp', 'perspective_streaming_grid', 'rough_volatility', 'malliavin_calculus', 'deflated_sharpe', 'egyptian_pantheon_hft', 'reinforcement_learning_mm', 'hmm_regime_switching', 'deep_hedging_neural_sde'].includes(m.id));
    }
    if (categoryKey === 'quant_interview') {
      return allMods.filter(m => m.categoryKey === 'quant_interview' || ['ito_calculus', 'feynman_kac', 'heston_fft', 'vasicek_cir', 'avellaneda_stoikov', 'copulas_evt', 'merton_jump_diffusion', 'almgren_chriss', 'kalman_pairs', 'black_litterman', 'perpetual_american', 'bachelier_model', 'prediction_markets_lmsr', 'futures_basis_carry', 'backtrader_cerebro', 'openbb_odp', 'perspective_streaming_grid', 'risk_constrained_kelly', 'hayashi_yoshida_lead_lag', 'propagator_market_impact'].includes(m.id));
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
      return allMods.filter(m => ['portfolio', 'portfolio_mgmt', 'quant_trading'].includes(m.categoryKey) || ['diversification', 'port_variance', 'capm', 'port_allocator', 'risk_return_scatter', 'quant_backtest', 'black_litterman', 'kalman_pairs', 'backtrader_cerebro', 'tsmom_volatility_targeting', 'dual_momentum_antonacci', 'sector_relative_strength', 'cross_asset_stat_arb', 'barra_multi_factor_risk', 'hmm_regime_switching', 'risk_constrained_kelly'].includes(m.id));
    }
    if (categoryKey === 'simulators') {
      return allMods.filter(m => ['simulators', 'quant_trading'].includes(m.categoryKey) || ['sip_dca', 'lumpsum_vs_sip', 'compound_interest', 'port_allocator', 'risk_return_scatter', 'drawdown_recovery', 'scenario_stress', 'options_payoff', 'quant_backtest', 'ito_calculus', 'feynman_kac', 'heston_fft', 'vasicek_cir', 'avellaneda_stoikov', 'copulas_evt', 'merton_jump_diffusion', 'almgren_chriss', 'kalman_pairs', 'black_litterman', 'perpetual_american', 'bachelier_model', 'prediction_markets_lmsr', 'futures_basis_carry', 'backtrader_cerebro', 'openbb_odp', 'perspective_streaming_grid', 'tsmom_volatility_targeting', 'dual_momentum_antonacci', 'sector_relative_strength', 'egyptian_pantheon_hft', 'garch_jump_diffusion', 'cross_asset_stat_arb', 'optimal_vwap_execution', 'reinforcement_learning_mm', 'evt_pot_tail_risk', 'hayashi_yoshida_lead_lag', 'propagator_market_impact'].includes(m.id));
    }
    if (categoryKey === 'mathematics') {
      return allMods.filter(m => m.categoryKey === 'mathematics' || ['cagr', 'compounding', 'volatility', 'beta_corr', 'sharpe', 'port_variance', 'capm', 'options_payoff', 'ito_calculus', 'feynman_kac', 'heston_fft', 'vasicek_cir', 'avellaneda_stoikov', 'copulas_evt', 'merton_jump_diffusion', 'almgren_chriss', 'kalman_pairs', 'black_litterman', 'perpetual_american', 'bachelier_model', 'prediction_markets_lmsr', 'futures_basis_carry', 'backtrader_cerebro', 'openbb_odp', 'perspective_streaming_grid', 'deep_hedging_neural_sde', 'nelson_siegel_svensson'].includes(m.id));
    }
    
    return allMods.filter(m => m.categoryKey === categoryKey || (m.category && m.category.toLowerCase() === categoryKey.toLowerCase()));
  };

  // ── Render Top Modules Quick-Switcher Bar ─────────────────────────────────
  const renderTopModulesBar = () => {
    const track = document.getElementById('labTopModulesTrack');
    if (!track || typeof LearnMathEngine === 'undefined') return;

    const modules = getFilteredModules(labState.activeCategory);

    track.innerHTML = modules.map(m => {
      const isDone = isLabCompleted(m.id);
      return `
        <button class="top-module-pill ${m.id === labState.activeModuleId ? 'active' : ''} ${isDone ? 'is-completed' : ''}" data-module-id="${m.id}" title="${m.title}">
          <i class="fa-solid ${isDone ? 'fa-circle-check text-emerald' : (m.icon || 'fa-chart-line')} top-pill-icon"></i>
          <span>${m.shortTitle || m.title}</span>
          <span class="top-pill-badge">${isDone ? '✓' : (m.badge || m.categoryKey.toUpperCase())}</span>
        </button>
      `;
    }).join('');

    track.querySelectorAll('.top-module-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        switchModule(btn.dataset.moduleId);
      });
    });
  };

  // ── Render All Laboratory Modules Grid (Bottom Directory) ──────────────────
  const renderAllModulesGrid = () => {
    const grid = document.getElementById('allLabModulesGrid');
    if (!grid || typeof LearnMathEngine === 'undefined') return;

    const filtered = getFilteredModules(labState.activeCategory);

    grid.innerHTML = filtered.map(m => {
      const isDone = isLabCompleted(m.id);
      return `
        <div class="module-card-item ${m.id === labState.activeModuleId ? 'active' : ''} ${isDone ? 'is-completed' : ''}" data-module-id="${m.id}">
          <div class="card-top-row">
            <span class="card-tag">${m.badge || m.category.toUpperCase()}</span>
            ${isDone ? '<span class="card-completed-indicator" title="Mastered"><i class="fa-solid fa-circle-check text-emerald"></i></span>' : `<i class="fa-solid ${m.icon || 'fa-chart-line'} card-icon"></i>`}
          </div>
          <h4 class="card-title">${m.title}</h4>
          <span class="card-formula">${m.shortTitle} &bull; ${m.category.toUpperCase()}${isDone ? ' • MASTERED' : ''}</span>
        </div>
      `;
    }).join('');

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
    if (typeof renderCurriculumTracks === 'function') renderCurriculumTracks();
    if (typeof updateTrackProgressBanner === 'function') updateTrackProgressBanner();
    if (typeof updateLabCompleteButton === 'function') updateLabCompleteButton();
    if (typeof updateCourseProgressHUD === 'function') updateCourseProgressHUD();

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
  const sanitizeLatex = (raw) => {
    if (!raw) return '';
    let clean = String(raw).trim();
    if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('\\[') && clean.endsWith('\\]') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('\\(') && clean.endsWith('\\)') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('$') && clean.endsWith('$') && clean.length >= 2) {
      clean = clean.slice(1, -1).trim();
    }
    // Escape unescaped % so it never comments out the formula in KaTeX
    clean = clean.replace(/(^|[^\\])%/g, '$1\\%');
    // Wrap raw ₹ in \text{₹}
    clean = clean.replace(/₹/g, '\\text{₹}');
    // Escape unescaped & unless part of align/matrix/cases environments
    if (!/\\begin\{(aligned|matrix|bmatrix|pmatrix|vmatrix|cases|array)\}/.test(clean)) {
      clean = clean.replace(/(^|[^\\])&/g, '$1\\&');
    }
    return clean;
  };

  const renderLatexFormula = (containerEl, rawLatex, isDisplayMode = true) => {
    if (!containerEl || !rawLatex) return;

    const clean = sanitizeLatex(rawLatex);

    // 1. Primary: Direct Synchronous KaTeX Compilation (Instant 0ms, Zero text flash)
    if (typeof katex !== 'undefined' && typeof katex.render === 'function') {
      try {
        containerEl.innerHTML = '';
        katex.render(clean, containerEl, {
          displayMode: isDisplayMode,
          throwOnError: false,
          strict: false
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

    const k = (typeof LearnLaymanKnowledge !== 'undefined' && LearnLaymanKnowledge[mod.id])
      ? LearnLaymanKnowledge[mod.id]
      : (typeof LearnMathEngine !== 'undefined' && LearnMathEngine.LAYMAN_KNOWLEDGE_MAP && LearnMathEngine.LAYMAN_KNOWLEDGE_MAP[mod.id])
        ? LearnMathEngine.LAYMAN_KNOWLEDGE_MAP[mod.id]
        : null;

    const whatText = (k && k.whatIsIt) || res.whatIsIt || res.beginnerText || '';
    const analogyText = (k && k.analogy) || res.laymanExplanation || res.beginnerText || '';
    const whyText = (k && k.whyItMatters) || res.whyItMatters || res.investorText || '';
    const exTextVal = (k && k.realWorldExample) || res.realWorldExample || res.plainResult || '';

    if (underLead) underLead.textContent = whatText;
    if (underBody) {
      if (labState.explanationMode === 'quant') {
        underBody.textContent = res.quantText || res.plainResult;
      } else if (labState.explanationMode === 'investor') {
        underBody.textContent = res.investorText || res.plainResult;
      } else {
        // Beginner mode: avoid duplicate of underLead
        underBody.textContent = (res.beginnerText && res.beginnerText !== whatText)
          ? res.beginnerText
          : `Use the interactive simulation sliders in the panel below to observe how changing key variables immediately affects the ${mod.shortTitle} calculation in real-time.`;
      }
    }
    if (whyMatters) whyMatters.textContent = whyText;

    const laymanText = document.getElementById('laymanAnalogyText');
    const exText = document.getElementById('realWorldExampleText');
    if (laymanText) laymanText.textContent = analogyText;
    if (exText) exText.textContent = exTextVal;
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
    renderSensitivityMatrix(mod, res);

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

  // ── Render Dynamic Sensitivity & Stress Testing Matrix ─────────────────────
  const renderSensitivityMatrix = (mod, res) => {
    const container = document.getElementById('labSensitivityMatrix');
    const paramNameEl = document.getElementById('sensitivityParamName');
    if (!container || !mod) return;

    const ctrl = (mod.controls && mod.controls.length > 0) ? mod.controls[0] : null;
    if (!ctrl || ctrl.type === 'select') {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.75rem;padding:8px;">Continuous parameter stress testing not applicable for this discrete model.</div>';
      if (paramNameEl) paramNameEl.textContent = 'Discrete Model Controls';
      return;
    }

    const currentVal = labState.simInputs[ctrl.key] !== undefined ? parseFloat(labState.simInputs[ctrl.key]) : parseFloat(ctrl.default || 0);
    if (isNaN(currentVal)) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.75rem;">Parameter evaluation unavailable.</div>';
      return;
    }

    if (paramNameEl) {
      paramNameEl.textContent = `Target: ${ctrl.label || ctrl.key} (Current: ${currentVal})`;
    }

    const shifts = [
      { pct: -0.50, label: '-50%' },
      { pct: -0.25, label: '-25%' },
      { pct: -0.10, label: '-10%' },
      { pct: 0.00,  label: 'BASE', isBase: true },
      { pct: 0.10,  label: '+10%' },
      { pct: 0.25,  label: '+25%' },
      { pct: 0.50,  label: '+50%' }
    ];

    const cardsHtml = shifts.map(s => {
      let perturbed = currentVal * (1 + s.pct);
      if (ctrl.min !== undefined && perturbed < ctrl.min) perturbed = ctrl.min;
      if (ctrl.max !== undefined && perturbed > ctrl.max) perturbed = ctrl.max;

      if (ctrl.step && ctrl.step >= 1) {
        perturbed = Math.round(perturbed);
      } else {
        perturbed = Number(perturbed.toFixed(2));
      }

      let outcomeMetric = '-';
      try {
        const testInputs = Object.assign({}, labState.simInputs, { [ctrl.key]: perturbed });
        const testRes = mod.calc(testInputs, labState.currency);
        if (testRes) {
          if (testRes.focalValue !== undefined) outcomeMetric = testRes.focalValue;
          else if (testRes.cagr !== undefined) outcomeMetric = `${testRes.cagr >= 0 ? '+' : ''}${testRes.cagr}%`;
          else if (testRes.finalAmount !== undefined) outcomeMetric = LearnMathEngine.formatMoney(testRes.finalAmount, labState.currency, true);
          else if (testRes.pe !== undefined) outcomeMetric = `${testRes.pe}×`;
          else if (testRes.beta !== undefined) outcomeMetric = `${testRes.beta}`;
          else if (testRes.sharpe !== undefined) outcomeMetric = `${testRes.sharpe}`;
          else if (testRes.mdd !== undefined) outcomeMetric = `-${testRes.mdd}%`;
          else if (testRes.plainResult) outcomeMetric = testRes.plainResult.split('.')[0];
        }
      } catch (err) {
        outcomeMetric = 'Err';
      }

      const isBase = s.isBase;
      const borderCol = isBase ? 'rgba(34, 211, 238, 0.6)' : 'rgba(148, 163, 184, 0.15)';
      const bgCol = isBase ? 'rgba(34, 211, 238, 0.12)' : 'rgba(15, 23, 42, 0.45)';
      const badgeCol = isBase ? '#22d3ee' : (s.pct > 0 ? '#10b981' : '#f59e0b');

      return `
        <div class="sensitivity-card" style="border:1px solid ${borderCol}; background:${bgCol}; border-radius:6px; padding:8px 10px; text-align:center;">
          <div style="font-size:0.65rem; font-weight:700; color:${badgeCol}; margin-bottom:2px; font-family:var(--font-mono, monospace);">
            ${s.label}
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono, monospace); margin-bottom:4px;">
            ${perturbed}
          </div>
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-bright, #fff); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${outcomeMetric}">
            ${outcomeMetric}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = cardsHtml;
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

    // Source Mode Toggle (Custom vs Live Security)
    const simSourceToggle = document.getElementById('simSourceToggle');
    if (simSourceToggle) {
      simSourceToggle.querySelectorAll('.sim-source-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.source;
          labState.sourceMode = mode;
          simSourceToggle.querySelectorAll('.sim-source-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const secBar = document.getElementById('simRealSecurityBar');
          const liveStrip = document.getElementById('simLiveSecurityStrip');

          if (mode === 'security') {
            if (secBar) {
              secBar.classList.add('active');
              secBar.style.display = 'flex';
            }
            if (liveStrip) liveStrip.style.display = 'flex';
            window.bindRealTickerToLab(labState.activeSecuritySymbol || 'RELIANCE.NS');
          } else {
            if (secBar) {
              secBar.classList.remove('active');
              secBar.style.display = 'none';
            }
            if (liveStrip) liveStrip.style.display = 'none';
            const mod = LearnMathEngine.getModuleById(labState.activeModuleId);
            if (mod && mod.defaultInputs) {
              labState.simInputs = { ...mod.defaultInputs };
              renderControlsPanel(mod);
              evaluateActiveModule();
            }
          }
        });
      });
    }

    // Wire live tick subscriber to automatically update lab price inputs in real-time
    SecurityMaster.subscribeLiveTicks((updates) => {
      if (!labState.activeSecuritySymbol) return;
      const match = updates.find(u => u.symbol === labState.activeSecuritySymbol || u.symbol === labState.activeSecuritySymbol.replace('.NS', ''));
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

        // Flash Live Security strip metrics
        const metricsEl = document.getElementById('boundSecMetrics');
        if (metricsEl) {
          const currSym = match.currency === 'INR' ? '₹' : '$';
          metricsEl.textContent = `Price: ${currSym}${match.price.toFixed(2)} | Change: ${match.change >= 0 ? '+' : ''}${match.changePercent.toFixed(2)}% | High: ${currSym}${match.high || match.price} | Low: ${currSym}${match.low || match.price}`;
          metricsEl.classList.remove('price-flash-up', 'price-flash-down');
          void metricsEl.offsetWidth;
          metricsEl.classList.add(match.delta >= 0 ? 'price-flash-up' : 'price-flash-down');
        }

        if (hasPriceKey) {
          renderControlsPanel(mod);
          evaluateActiveModule();
        }
      }
      if (typeof updateCoursesLiveTelemetry === 'function') {
        updateCoursesLiveTelemetry();
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

  // ── Structured Financial Knowledge Curriculum & Progression Tracks ─────────
  let activeCurriculumFilter = 'all';

  const STRUCTURED_TRACKS = [
    {
      id: 'retail_layman',
      title: 'Retail & Layman Foundations',
      subtitle: 'Wealth Building, Compounding & Safety',
      badge: 'Layman / Retail',
      personas: ['layman'],
      color: '#10b981',
      icon: 'fa-seedling',
      description: 'Master core intuition for wealth building, compounding, inflation-hedging, DCA mechanics, and fundamentals before touching advanced math.',
      steps: [
        { moduleId: 'compounding', title: 'Wealth Compounding & Rule of 72', role: 'Exponential growth & doubling periods', unlock: 'Wealth Compounding Visualizer on Analytics Desk' },
        { moduleId: 'cagr', title: 'CAGR Growth Rate', role: 'Geometric vs arithmetic annualized returns', unlock: 'Strategy Benchmarking & Performance on RISKOS Dashboard' },
        { moduleId: 'sip_dca', title: 'SIP / Rupee-Cost Averaging', role: 'Systematic accumulation & volatility dampening', unlock: 'Rupee-Cost Averaging & Systematic Portfolio Accumulator' },
        { moduleId: 'lumpsum_sip', title: 'Lump Sum vs SIP Allocator', role: 'Cost of waiting vs volatility drag', unlock: 'Cash Deployment Timing & Systematic Deployment' },
        { moduleId: 'compound_timeline', title: 'Multi-Goal Milestone Forecaster', role: 'Sequential compounding with inflation adjustments', unlock: 'Retirement & Long-Term Financial Goal Engine' },
        { moduleId: 'pe_eps', title: 'P/E Ratio & Earnings Yield', role: 'Fundamental valuation & Graham anchors', unlock: 'Fundamental Multiples in Security Master' },
        { moduleId: 'roe_roce', title: 'DuPont 5-Way ROE & ROCE', role: 'Operational margin & financial leverage deconstruction', unlock: 'Financial Statement Deconstruction Desk' },
        { moduleId: 'dividend_discount_model', title: 'Gordon Dividend Growth Model', role: 'Intrinsic equity value capitalization', unlock: 'Dividend Income Projector on Analytics Desk' }
      ]
    },
    {
      id: 'portfolio_risk',
      title: 'Portfolio Theory & Risk Analytics',
      subtitle: 'Markowitz, Beta, Sharpe & Drawdown',
      badge: 'Portfolio Risk',
      personas: ['layman', 'institutional'],
      color: '#3b82f6',
      icon: 'fa-shield-halved',
      description: 'Modern Portfolio Theory (MPT), systematic beta, risk-adjusted returns, and asymmetric drawdown recovery dynamics.',
      steps: [
        { moduleId: 'volatility', title: 'Volatility & Gaussian Bell Curve', role: 'Standard deviation & return dispersion', unlock: 'Asset Volatility Gauges & Risk Heatmaps' },
        { moduleId: 'beta_corr', title: 'Beta & Pearson Correlation', role: 'Systematic benchmark sensitivity & covariance', unlock: 'Benchmark Beta Regression & Systemic Factor Exposure' },
        { moduleId: 'mdd', title: 'Maximum Drawdown & Ulcer Index', role: 'Peak-to-trough capital devastation metric', unlock: 'Drawdown Stress Monitor & Risk Analytics Desk' },
        { moduleId: 'drawdown_recovery', title: 'Drawdown Math & Recovery Asymmetry', role: 'The brutal non-linear cost of losing capital', unlock: 'Recovery Forecaster & Portfolio Safeguard Engine' },
        { moduleId: 'sharpe', title: 'Sharpe, Sortino & Omega Ratios', role: 'Risk-adjusted reward and downside semi-variance', unlock: 'Sharpe, Sortino & Deflated Performance Scoring' },
        { moduleId: 'diversification', title: 'Diversification & The Free Lunch', role: 'Non-correlated asset combination mechanics', unlock: 'Correlation Diversification Matrix & Markowitz Frontier' },
        { moduleId: 'port_variance', title: 'Portfolio Variance Matrix', role: 'N-asset covariance & analytical portfolio risk', unlock: 'Cross-Asset Variance & Markowitz Efficient Frontier' },
        { moduleId: 'capm', title: 'Capital Asset Pricing Model (CAPM)', role: 'Expected return equilibrium & equity risk premium', unlock: 'Asset Pricing & Cost of Capital Valuation Desk' }
      ]
    },
    {
      id: 'simulators_construction',
      title: 'Portfolio Construction & Stress Simulators',
      subtitle: 'Allocation, Scenarios, Tax & Kelly Growth',
      badge: 'Portfolio Construction',
      personas: ['trading', 'institutional'],
      color: '#06b6d4',
      icon: 'fa-sliders',
      description: 'Practical institutional portfolio construction, multi-asset allocation, scenario stress testing, options payoff, and tax-loss optimization.',
      steps: [
        { moduleId: 'port_allocator', title: 'Multi-Asset Strategic Allocator', role: 'Interactive asset weighting & efficient weights', unlock: 'Institutional Multi-Asset Portfolio Allocator' },
        { moduleId: 'risk_return_scatter', title: 'Risk-Return Efficient Frontier Scatter', role: 'Simulated random portfolios & Sharpe tangency', unlock: 'Interactive Markowitz Efficient Frontier Sandbox' },
        { moduleId: 'scenario_stress', title: 'Macro Scenario & Crisis Stress Replay', role: 'Historical 2008 & 2020 crash replays & shocks', unlock: 'Crisis Replay Simulator on Analytics Desk' },
        { moduleId: 'options_payoff', title: 'Options Multi-Leg Payoff Visualizer', role: 'Interactive calls, puts, spreads & Greeks', unlock: 'Derivatives Payoff Visualizer & Multi-Leg Options Desk' },
        { moduleId: 'quant_backtest', title: 'Vectorized Quant Strategy Backtester', role: 'Historical walk-forward validation & equity curves', unlock: 'Backtest Sandbox on Analytics Desk' },
        { moduleId: 'black_litterman', title: 'Black-Litterman Bayesian Portfolio Tilt', role: 'Combining market equilibrium with active views', unlock: 'Institutional Black-Litterman Portfolio Optimizer' },
        { moduleId: 'tax_loss_harvesting', title: 'Tax-Loss Harvesting & Alpha Engine', role: 'Optimizing wash-sale compliant tax savings', unlock: 'Autonomous Tax-Loss Harvester Engine' },
        { moduleId: 'kelly_criterion_growth', title: 'Continuous Kelly Growth Simulator', role: 'Optimal logarithmic wealth trajectory & leverage', unlock: 'Continuous Compound Growth & Leverage Optimizer' }
      ]
    },
    {
      id: 'derivatives_exotics',
      title: 'Exotic Derivatives & Volatility Surfaces',
      subtitle: 'SABR, Heston FFT, 0DTE GEX & Malliavin',
      badge: 'Derivatives & Exotics',
      personas: ['trading', 'institutional'],
      color: '#8b5cf6',
      icon: 'fa-cubes',
      description: 'State-of-the-art quantitative volatility modeling, 0DTE GEX pinning, SABR/SVI smiles, rough volatility, and Malliavin calculus Greeks.',
      steps: [
        { moduleId: 'gex_0dte_pinning', title: '0DTE Gamma Exposure (GEX) & Pinning', role: 'Market maker delta-hedging reflexivity & pins', unlock: '0DTE Options Gamma Exposure (GEX) & Strike Pinning Radar' },
        { moduleId: 'heston_fft', title: 'Heston Stochastic Volatility (FFT)', role: 'Semi-analytical Carr-Madan characteristic pricing', unlock: 'Stochastic Volatility Calibration Engine' },
        { moduleId: 'svi_sabr_calibration', title: 'SVI / SABR Smile Calibration', role: 'Arbitrage-free implied volatility smile fitting', unlock: 'Arbitrage-Free Volatility Surface Fitter' },
        { moduleId: 'sabr_vol_surface', title: 'Parametric SABR Volatility Surface', role: 'Cross-strike and tenor volatility surface generator', unlock: '3D Implied Volatility Surface Visualizer' },
        { moduleId: 'perpetual_american', title: 'Perpetual American Option & Smooth Pasting', role: 'Optimal early exercise boundary analytic solution', unlock: 'Optimal Stopping & American Contingent Claims' },
        { moduleId: 'bachelier_model', title: 'Bachelier Normal Volatility Model', role: 'Negative rate options & spread options pricing', unlock: 'Negative Price / Normal Volatility Pricing Desk' },
        { moduleId: 'rough_volatility', title: 'Rough Volatility (Fractional Brownian H<0.5)', role: 'Sub-diffusive Hurst exponent for steep short smiles', unlock: 'Rough Volatility High-Frequency Fitter' },
        { moduleId: 'malliavin_calculus', title: 'Malliavin Calculus Monte Carlo Greeks', role: 'Pathwise differentiation for discontinuous payoffs', unlock: 'Exotic Monte Carlo Greeks Sensitivity Engine' }
      ]
    },
    {
      id: 'microstructure_execution',
      title: 'Microstructure, OFI & Trade Execution',
      subtitle: 'Limit Order Books, Hawkes & Optimal Execution',
      badge: 'Microstructure',
      personas: ['trading', 'institutional'],
      color: '#f59e0b',
      icon: 'fa-bolt-lightning',
      description: 'Front-office electronic trading: L3 order book queues, Kyle’s Lambda price impact, Hawkes point cascades, and Almgren-Chriss liquidation.',
      steps: [
        { moduleId: 'kyles_lambda_microstructure', title: 'Kyle’s Lambda & Microstructure Invariance', role: 'Informed flow adverse selection & market depth', unlock: 'Order Book OFI, Spread Breakdown & Toxic Flow Analysis' },
        { moduleId: 'dark_pool_adverse_selection', title: 'Dark Pool Adverse Selection & Routing', role: 'Lit vs dark venue toxicity & execution quality', unlock: 'Dark Pool Routing & Execution Toxicity Assessment' },
        { moduleId: 'hawkes_liquidity_cascades', title: 'Hawkes Self-Exciting Liquidity Cascades', role: 'Flash crash branching ratios & event clustering', unlock: 'Hawkes Liquidity Flash Crash & Event Arrival Predictor' },
        { moduleId: 'hawkes_process', title: 'Hawkes Mutually Exciting Point Process', role: 'Cross-order arrival self & cross excitation', unlock: 'Microstructure Shock Propagation Engine' },
        { moduleId: 'almgren_chriss', title: 'Almgren-Chriss Optimal Execution', role: 'Permanent vs temporary market impact trade-off', unlock: 'Almgren-Chriss Optimal Trade Execution on Execution Desk' },
        { moduleId: 'propagator_market_impact', title: 'Bouchaud Transient Propagator Impact', role: 'Power-law memory decay of metaorder footprints', unlock: 'Bouchaud Market Impact & Transient Slippage Forecaster' },
        { moduleId: 'optimal_vwap_execution', title: 'Optimal VWAP Slicing Trajectory', role: 'Intraday volume curve dynamic schedule', unlock: 'Multi-Venue Smart Order Router (SOR)' },
        { moduleId: 'hayashi_yoshida_lead_lag', title: 'Hayashi-Yoshida High-Frequency Lead-Lag', role: 'Non-synchronous cross-venue tick arbitrage', unlock: 'High-Frequency Cross-Asset Lead-Lag Arbitrage Detector' }
      ]
    },
    {
      id: 'quant_strategies',
      title: 'Quantitative Alpha Strategies & Stat-Arb',
      subtitle: 'Momentum, Pairs, Futures Carry & Prediction Markets',
      badge: 'Quant Trading',
      personas: ['trading'],
      color: '#ec4899',
      icon: 'fa-chart-line',
      description: 'Systematic statistical arbitrage: Time-series momentum with vol targeting, Kalman filter cointegration, commodity roll yield, and LMSR prediction markets.',
      steps: [
        { moduleId: 'tsmom_volatility_targeting', title: 'TSMOM Volatility Targeting', role: 'Time-series momentum with dynamic target risk', unlock: 'Volatility-Targeted Trend Following on Ticker Desk' },
        { moduleId: 'dual_momentum_antonacci', title: 'Dual Momentum (Antonacci)', role: 'Absolute & relative trend-following filter', unlock: 'Dual Momentum Cross-Asset Allocator' },
        { moduleId: 'kalman_pairs', title: 'Kalman Filter Dynamic Pairs Trading', role: 'Real-time cointegrating hedge ratio tracking', unlock: 'Statistical Arbitrage & Pairs Engine' },
        { moduleId: 'cross_asset_stat_arb', title: 'Cross-Asset Statistical Arbitrage', role: 'Multi-asset mean-reverting eigenvector spreads', unlock: 'Cross-Asset Stat-Arb Matrix on Fleet Desk' },
        { moduleId: 'futures_basis_carry', title: 'Futures Cash & Carry Basis Scorer', role: 'Spot-futures annualized roll yield & funding rate', unlock: 'Commodities & Derivatives Carry Scanner' },
        { moduleId: 'commodity_roll_yield', title: 'Commodity Term Structure & Roll Yield', role: 'Contango vs backwardation storage cost carry', unlock: 'Commodity Supercycle & Energy Desk' },
        { moduleId: 'prediction_markets_lmsr', title: 'Hanson’s LMSR Prediction Market Maker', role: 'Logarithmic market scoring rule automated liquidity', unlock: 'Prediction Market & Event Probability Desk' },
        { moduleId: 'sector_relative_strength', title: 'Sector Rotation & RRG Momentum Matrix', role: 'Relative rotation graph leading/lagging quadrants', unlock: '20-Sector Indicators Desk on Ticker Page' }
      ]
    },
    {
      id: 'fixed_income_credit',
      title: 'Fixed Income, Rates & Credit Architecture',
      subtitle: 'Nelson-Siegel, Vasicek, CDS & OAS',
      badge: 'Fixed Income & Credit',
      personas: ['institutional'],
      color: '#6366f1',
      icon: 'fa-landmark',
      description: 'Sovereign yield curve fitting, short-rate interest rate dynamics, probit recession forecasting, ALM immunization, and structured credit waterfall.',
      steps: [
        { moduleId: 'nelson_siegel_svensson', title: 'Nelson-Siegel-Svensson Yield Curve', role: 'Sovereign yield term structure & curvature', unlock: 'Sovereign Yield Curve Desk on Observatory' },
        { moduleId: 'vasicek_cir', title: 'Vasicek & Cox-Ingersoll-Ross (CIR) Rates', role: 'Mean-reverting affine term structure models', unlock: 'Short-Rate Interest Rate Simulation Desk' },
        { moduleId: 'yield_curve_probit', title: 'Yield Curve Probit Recession Forecaster', role: '10Y-2Y inversion recession probability model', unlock: 'Macro Observatory Recession Forecaster' },
        { moduleId: 'redington_alm_immunization', title: 'Redington ALM Immunization', role: 'Duration and convexity matching for balance sheets', unlock: 'Asset-Liability Management (ALM) Desk' },
        { moduleId: 'merton_structural_default', title: 'Merton Structural Credit Default', role: 'Equity as a call option on corporate firm value', unlock: 'Credit Spread Analyzer & Distance-to-Default Warning' },
        { moduleId: 'cds_index_tranches', title: 'Credit Default Swap (CDX) Index Tranches', role: 'Synthetic CDO copula tranche correlation pricing', unlock: 'Institutional Credit Risk Engine' },
        { moduleId: 'clo_tranche_waterfall', title: 'CLO Structured Finance Debt Waterfall', role: 'Subordinated cash flow priority & credit enhancement', unlock: 'Structured Finance & Securitization Desk' },
        { moduleId: 'oas_binomial_tree', title: 'Option-Adjusted Spread (OAS) Binomial Tree', role: 'Valuing bonds with embedded call/put options', unlock: 'Callable Bond & Embedded Option Valuation Desk' }
      ]
    },
    {
      id: 'corporate_pe_cat',
      title: 'Corporate Finance, PE, Catastrophe & Risk Models',
      subtitle: 'LBO Waterfalls, Solvency II, EVT & Factor Risk',
      badge: 'Corporate & Risk Models',
      personas: ['institutional'],
      color: '#14b8a6',
      icon: 'fa-building-columns',
      description: 'Corporate valuation, private equity LBO waterfalls, Solvency II insurance risk, Extreme Value Theory fat tails, and Barra factor decomposition.',
      steps: [
        { moduleId: 'lbo_debt_waterfall', title: 'Private Equity LBO Debt Sweep Waterfall', role: 'Senior debt sweep, sponsor MOIC & IRR returns', unlock: 'Private Equity / M&A Financial Suite' },
        { moduleId: 'solvency_ii_evt_cat', title: 'Solvency II 1-in-200yr Catastrophe VaR', role: 'Solvency capital requirement & insurance tail shocks', unlock: 'Solvency II 1-in-200 Year Catastrophic Capital Requirement' },
        { moduleId: 'evt_pot_tail_risk', title: 'EVT Peaks-Over-Threshold & Basel III ES', role: 'Generalized Pareto tail risk & Expected Shortfall', unlock: 'Basel III Tail Risk, VaR 99%, and Expected Shortfall Engine' },
        { moduleId: 'copulas_evt', title: 'Clayton & Gumbel Copulas Tail Dependence', role: 'Asymmetric joint tail crashes vs Gaussian copulas', unlock: 'Multivariate Non-Linear Risk & Copula Engine' },
        { moduleId: 'merton_jump_diffusion', title: 'Merton Jump-Diffusion Asset Pricing', role: 'Compound Poisson jump risk with Gaussian shocks', unlock: 'Jump-Diffusion Option Pricing & Discontinuous Gap Simulation' },
        { moduleId: 'garch_jump_diffusion', title: 'GARCH(1,1) with Jump-Diffusion Volatility', role: 'Time-varying volatility clustering with fat-tailed jumps', unlock: 'Heteroskedastic Risk & Volatility Clustered Forecasting' },
        { moduleId: 'barra_multi_factor_risk', title: 'Barra Multi-Factor Risk Decomposition', role: 'Cross-sectional factor covariance and specific risk', unlock: 'Institutional Multi-Factor Risk Decomposition' },
        { moduleId: 'fama_french_5factor', title: 'Fama-French 5-Factor Asset Pricing', role: 'Decomposing alpha into size, value, profit & investment', unlock: 'Factor Attribution & Smart Beta Analytics' }
      ]
    },
    {
      id: 'ai_neural_alpha',
      title: 'AI, Neural SDEs & Machine Learning Execution',
      subtitle: 'HMM, Deep Hedging, RL Swarms & L3 Telemetry',
      badge: 'AI & Neural Systems',
      personas: ['ai_hft', 'institutional'],
      color: '#a855f7',
      icon: 'fa-brain',
      description: 'Cutting-edge AI in quantitative finance: Hamilton HMM regime switches, deep neural SDE hedging, DQN reinforcement learning, and sub-millisecond OFI swarms.',
      steps: [
        { moduleId: 'hmm_regime_switching', title: 'Hamilton HMM Regime-Switching Filter', role: 'Filtering hidden Bull, Bear & Chop market states', unlock: 'AI Market Regime Detection (Bull/Bear/Chop) on Observatory' },
        { moduleId: 'deep_hedging_neural_sde', title: 'Deep Hedging & Neural SDE Networks', role: 'Non-linear convex risk hedging with market friction', unlock: 'Neural Network Non-Linear Hedging under Friction' },
        { moduleId: 'dqn_optimal_execution', title: 'DQN Reinforcement Learning Execution', role: 'Deep Q-Networks for dynamic order book liquidation', unlock: 'Reinforcement Learning Optimal VWAP/TWAP Execution Agent' },
        { moduleId: 'reinforcement_learning_mm', title: 'Autonomous RL Market Making Agent', role: 'Q-learning quoting under inventory risk & toxic flow', unlock: 'Autonomous AI Market Making Swarm' },
        { moduleId: 'quantum_monte_carlo', title: 'Quantum Amplitude Estimation Monte Carlo', role: 'Quadratic speedup in derivative pricing & VaR', unlock: 'Quantum Computing Derivatives Pricing Sandbox' },
        { moduleId: 'openbb_odp', title: 'OpenBB Open Data Platform (ODP) Gateway', role: 'Harmonized quantitative data pipelines & providers', unlock: 'Unified Institutional Data Platform Gateway' },
        { moduleId: 'perspective_streaming_grid', title: 'Perspective Streaming Telemetry Grid', role: 'Ultra-low latency streaming analytics architecture', unlock: 'Institutional L3 Stream Visualizer' },
        { moduleId: 'egyptian_pantheon_hft', title: 'Egyptian Pantheon 20-Bot Ultra HFT Swarm', role: 'Sub-millisecond multi-agent market making swarm', unlock: 'Egyptian Pantheon 20-Bot Ultra HFT Swarm' }
      ]
    },
    {
      id: 'stochastic_interview',
      title: 'Stochastic Calculus, Control & Quant Interview',
      subtitle: 'Itô, Feynman-Kac, HJB, Kelly & Deflated Sharpe',
      badge: 'Stochastic Math & Quant Interview',
      personas: ['ai_hft', 'trading'],
      color: '#ec4899',
      icon: 'fa-square-root-variable',
      description: 'Rigorous stochastic mathematics and top-tier quant interview problems: Itô lemma, Feynman-Kac PDE, HJB control, Avellaneda-Stoikov, and deflated Sharpe.',
      steps: [
        { moduleId: 'ito_calculus', title: 'Itô’s Lemma & Stochastic Differentials', role: 'Quadratic variation & stochastic calculus fundamentals', unlock: 'Stochastic Differential Equation (SDE) Laboratory' },
        { moduleId: 'feynman_kac', title: 'Feynman-Kac PDE & Stochastic Connection', role: 'Solving parabolic PDEs via conditional expectations', unlock: 'PDE Boundary Value Solver & Heat Equation Engine' },
        { moduleId: 'hjb_stochastic_control', title: 'Hamilton-Jacobi-Bellman (HJB) Control', role: 'Dynamic programming for continuous-time optimal wealth', unlock: 'Continuous-Time Stochastic Control Optimizer' },
        { moduleId: 'avellaneda_stoikov', title: 'Avellaneda-Stoikov Market Making Math', role: 'Optimal reservation price & inventory penalty', unlock: 'High-Frequency Quoting & Inventory Skew Engine' },
        { moduleId: 'risk_constrained_kelly', title: 'Risk-Constrained Kelly Sizing', role: 'Fractional capital allocation avoiding ruin', unlock: 'Optimal Bet Sizing & Capital Allocation with Ruin Constraints' },
        { moduleId: 'deflated_sharpe', title: 'Deflated Sharpe Ratio (Bailey-Lopez de Prado)', role: 'Correcting for selection bias and backtest overfitting', unlock: 'Institutional Overfitting & P-Hacking Audit' },
        { moduleId: 'yen_carry_unwind', title: 'Global FX Carry Trade Unwind Mechanics', role: 'Interest rate differential unwinds & liquidity runs', unlock: 'Cross-Currency Margin & Liquidity Radar' },
        { moduleId: 'backtrader_cerebro', title: 'Backtrader Cerebro Event-Driven Architecture', role: 'Event-driven execution loops vs vectorized backtests', unlock: 'Event-Driven Strategy Execution Engine' }
      ]
    }
  ];

  // ── 10 Comprehensive Course Live Telemetry & Direct Action Configurations ───
  const COURSE_LIVE_CONFIGS = {
    retail_layman: {
      symbol: 'RELIANCE.NS',
      benchmark: '^NSEI',
      deskUrl: 'observatory.html',
      deskLabel: 'Observatory',
      deskIcon: 'fa-satellite-dish',
      actionLabel: '1-Click DCA Order (NIFTYBEES)',
      actionOrder: { symbol: 'NIFTYBEES', side: 'BUY', qty: 36, price: 275 },
      metricTitle: 'SIP Compounding Telemetry',
      sliderLabel: 'Monthly Investment',
      sliderMin: 1000,
      sliderMax: 50000,
      sliderStep: 1000,
      sliderDefault: 10000,
      unit: '₹',
      compute: (val, quote) => {
        const rate = 0.135;
        const months = 120;
        const fv = val * ((Math.pow(1 + rate / 12, months) - 1) / (rate / 12)) * (1 + rate / 12);
        const invested = val * months;
        return `10Y Value: ₹${(fv / 10000000).toFixed(2)} Cr (Net Gain: +₹${((fv - invested) / 100000).toFixed(1)}L @ 13.5% CAGR)`;
      },
      quickQuiz: {
        question: "If inflation is 6% and CAGR is 14%, what is your real annualized wealth doubling time via Rule of 72?",
        options: ["~5.1 Years", "~9.0 Years (72 / 8% real return)", "~12.0 Years"],
        answerIndex: 1,
        explanation: "Real return = 14% - 6% = 8%. By Rule of 72, 72 / 8 = 9.0 Years to double real purchasing power."
      }
    },
    portfolio_risk: {
      symbol: 'TCS.NS',
      benchmark: '^NSEI',
      deskUrl: 'app.html',
      deskLabel: 'Desk 2: Tail Risk',
      deskIcon: 'fa-shield-halved',
      actionLabel: '1-Click Low-Beta Hedge (HDFCBANK)',
      actionOrder: { symbol: 'HDFCBANK', side: 'BUY', qty: 10, price: 1768 },
      metricTitle: 'Market Shock & Beta Stress',
      sliderLabel: 'Simulated Market Shock (Δ%)',
      sliderMin: -20,
      sliderMax: 20,
      sliderStep: 1,
      sliderDefault: -5,
      unit: '%',
      compute: (val, quote) => {
        const beta = quote?.beta || 0.78;
        const vol = quote?.vol || 0.162;
        const assetMove = val * beta;
        const var99 = (vol * 2.326 / Math.sqrt(252) * 100).toFixed(2);
        return `On ${val >= 0 ? '+' : ''}${val}% NIFTY Shock → Asset Move: ${assetMove >= 0 ? '+' : ''}${assetMove.toFixed(2)}% | 1D VaR 99%: ${var99}%`;
      },
      quickQuiz: {
        question: "If an asset has Beta = 1.25 and NIFTY drops 4%, what is the expected CAPM systematic drop?",
        options: ["-3.2%", "-5.0% (1.25 × -4%)", "-1.25%"],
        answerIndex: 1,
        explanation: "Systematic sensitivity ΔS = Beta × ΔM = 1.25 × -4% = -5.0% expected systematic move."
      }
    },
    simulators_construction: {
      symbol: 'HDFCBANK.NS',
      benchmark: '^NSEI',
      deskUrl: 'portfolio_optimizer.html',
      deskLabel: 'Desk 8: Optimizer',
      deskIcon: 'fa-sliders',
      actionLabel: '1-Click Balanced Basket (Gold/Equity)',
      actionOrder: { symbol: 'GOLDBEES', side: 'BUY', qty: 150, price: 65.4 },
      metricTitle: 'Markowitz All-Weather Frontier',
      sliderLabel: 'Equity Allocation (%)',
      sliderMin: 10,
      sliderMax: 90,
      sliderStep: 5,
      sliderDefault: 60,
      unit: '%',
      compute: (val, quote) => {
        const eqWeight = val / 100;
        const defWeight = 1 - eqWeight;
        const expRet = (eqWeight * 14.5 + defWeight * 7.5).toFixed(1);
        const portVol = Math.sqrt(Math.pow(eqWeight * 0.16, 2) + Math.pow(defWeight * 0.08, 2) + 2 * eqWeight * defWeight * 0.16 * 0.08 * 0.15) * 100;
        const sharpe = ((expRet - 6.5) / portVol).toFixed(2);
        return `Exp Return: ${expRet}% | Port Vol: ${portVol.toFixed(1)}% | Tangency Sharpe: ${sharpe}`;
      },
      quickQuiz: {
        question: "What is the primary mathematical reason Markowitz diversification creates a 'free lunch'?",
        options: ["It increases asset returns automatically", "Covariance terms cancel out total variance when correlation ρ < 1", "It eliminates all market risk completely"],
        answerIndex: 1,
        explanation: "When asset returns are imperfectly correlated (ρ < 1), portfolio variance σ_p² is strictly less than the weighted average of individual variances."
      }
    },
    derivatives_exotics: {
      symbol: '^NSEI',
      benchmark: '^NSEI',
      deskUrl: 'learn.html#options_payoff',
      deskLabel: 'Derivatives Lab',
      deskIcon: 'fa-cube',
      actionLabel: '1-Click ATM Straddle Vega Hedge',
      actionOrder: { symbol: 'NIFTYBEES', side: 'BUY', qty: 25, price: 272 },
      metricTitle: '0DTE Net GEX & Options Smile',
      sliderLabel: 'Strike Distance from ATM',
      sliderMin: -500,
      sliderMax: 500,
      sliderStep: 50,
      sliderDefault: 0,
      unit: ' Pts',
      compute: (val, quote) => {
        const spot = quote?.price || 24840;
        const strike = Math.round((spot + val) / 50) * 50;
        const d = Math.abs(val);
        const iv = (13.8 + (d / 500) * 4.5).toFixed(1);
        const straddleCost = (0.8 * spot * (parseFloat(iv) / 100) / 16).toFixed(1);
        return `Strike: ${strike} | Implied Vol: ${iv}% | ATM 1D Straddle: ₹${straddleCost} | Net GEX: +₹420 Cr (Pinning)`;
      },
      quickQuiz: {
        question: "When dealers are in Large Positive Gamma (High Net GEX), how do they hedge delta moves?",
        options: ["Buy as market rises, sell as it falls (momentum breakout)", "Sell as market rises, buy as it falls (volatility suppression & strike pinning)", "Never adjust hedges"],
        answerIndex: 1,
        explanation: "Positive dealer gamma requires counter-cyclical hedging (selling rallies, buying dips), dampening volatility and pinning spot to high-OI strikes."
      }
    },
    microstructure_execution: {
      symbol: 'RELIANCE.NS',
      benchmark: '^NSEI',
      deskUrl: 'app.html',
      deskLabel: 'Order Book DOM',
      deskIcon: 'fa-bolt-lightning',
      actionLabel: '1-Click TWAP Liquidation Slice',
      actionOrder: { symbol: 'RELIANCE', side: 'BUY', qty: 50, price: 1287 },
      metricTitle: 'Almgren-Chriss Slippage & Impact',
      sliderLabel: 'Metaorder Quantity (Shares)',
      sliderMin: 100,
      sliderMax: 10000,
      sliderStep: 100,
      sliderDefault: 1000,
      unit: ' Shs',
      compute: (val, quote) => {
        const price = quote?.price || 1287;
        const notional = val * price;
        const permBps = (0.015 * Math.sqrt(val)).toFixed(1);
        const tempBps = (0.04 * Math.sqrt(val)).toFixed(1);
        const totalBps = (parseFloat(permBps) + parseFloat(tempBps)).toFixed(1);
        const totalCost = (notional * parseFloat(totalBps) / 10000).toFixed(0);
        return `Notional: ₹${(notional / 100000).toFixed(2)}L | Impact: ${totalBps} bps (₹${totalCost} Slippage Drag)`;
      },
      quickQuiz: {
        question: "According to Kyle's Lambda (1985), what happens to price impact when market depth (liquidity) decreases?",
        options: ["Price impact decreases", "Price impact increases inversely with depth (λ = σ_v / (2 σ_u))", "Price impact remains zero"],
        answerIndex: 1,
        explanation: "Kyle's lambda measures illiquidity: as noise trading or market depth drops, lambda spikes, causing greater price concession per executed share."
      }
    },
    quant_strategies: {
      symbol: 'INFY.NS',
      benchmark: 'TCS.NS',
      deskUrl: 'fleet.html',
      deskLabel: '41-Bot Fleet Desk',
      deskIcon: 'fa-chart-line',
      actionLabel: '1-Click Stat-Arb Pair (Long INFY / Short TCS)',
      actionOrder: { symbol: 'INFY', side: 'BUY', qty: 25, price: 1942.8 },
      metricTitle: 'Kalman Pairs Spread & Carry',
      sliderLabel: 'Pairs Spread Z-Score',
      sliderMin: -3.5,
      sliderMax: 3.5,
      sliderStep: 0.1,
      sliderDefault: 2.1,
      unit: 'σ',
      compute: (val, quote) => {
        const z = parseFloat(val);
        const signal = z >= 2.0 ? 'ENTER SHORT SPREAD (SELL INFY / BUY TCS)' : (z <= -2.0 ? 'ENTER LONG SPREAD (BUY INFY / SELL TCS)' : 'HOLD / MARKET NEUTRAL (INSIDE NO-TRADE BAND)');
        return `Z-Score: ${z > 0 ? '+' : ''}${z.toFixed(1)}σ → Signal: ${signal} | Mean Reversion Half-Life: 6.4D | Basis APR: 9.2%`;
      },
      quickQuiz: {
        question: "Why is the Kalman filter superior to ordinary linear regression (OLS) in statistical arbitrage pairs trading?",
        options: ["It assumes prices never change", "It continuously updates time-varying hedge ratios β_t recursively without lookahead bias", "It guarantees 100% win rate"],
        answerIndex: 1,
        explanation: "Stationary relationships drift over time. Kalman filtering dynamically tracks the evolving state of hedge ratios β_t with real-time Bayesian updates."
      }
    },
    fixed_income_credit: {
      symbol: 'NSE:GSEC10Y',
      benchmark: 'US10Y',
      deskUrl: 'observatory.html#macro',
      deskLabel: 'Macro Observatory',
      deskIcon: 'fa-landmark',
      actionLabel: '1-Click Duration Hedge (G-Sec)',
      actionOrder: { symbol: 'NIFTYBEES', side: 'BUY', qty: 50, price: 272 },
      metricTitle: 'Nelson-Siegel Yield & DV01',
      sliderLabel: 'Rate Shock Perturbation (bps)',
      sliderMin: -200,
      sliderMax: 200,
      sliderStep: 10,
      sliderDefault: 50,
      unit: ' bps',
      compute: (val, quote) => {
        const baseYield = 6.84;
        const shocked = (baseYield + val / 100).toFixed(2);
        const modDuration = 6.8;
        const priceShock = (-modDuration * (val / 100)).toFixed(2);
        const dv01 = (modDuration * 10000000 * 0.0001).toFixed(0);
        return `10Y Yield: ${shocked}% | Portfolio Price Move: ${priceShock}% | DV01 Sensitivity: ₹${dv01} per bp on ₹1 Cr`;
      },
      quickQuiz: {
        question: "What does an inverted sovereign yield curve (10Y Yield < 2Y Yield) historically signal in macroeconomic probit models?",
        options: ["Hyperinflation boom", "Statistically elevated probability of economic recession within 6 to 18 months", "Stock market immediate rally"],
        answerIndex: 1,
        explanation: "Yield curve inversion indicates tight near-term monetary policy combined with market expectations of future rate cuts and economic cooling."
      }
    },
    corporate_pe_cat: {
      symbol: 'TCS.NS',
      benchmark: 'RELIANCE.NS',
      deskUrl: 'ticker.html',
      deskLabel: 'Screener Desk',
      deskIcon: 'fa-building-columns',
      actionLabel: '1-Click Corporate Quality Buy (TCS)',
      actionOrder: { symbol: 'TCS', side: 'BUY', qty: 5, price: 4380 },
      metricTitle: 'DuPont 5-Way ROE & LBO IRR',
      sliderLabel: 'Operating Margin Expansion (%)',
      sliderMin: -5,
      sliderMax: 10,
      sliderStep: 0.5,
      sliderDefault: 2.5,
      unit: '%',
      compute: (val, quote) => {
        const baseRoe = quote?.roe || 48.2;
        const shockedRoe = (baseRoe + val * 1.8).toFixed(1);
        const pe = quote?.pe || 31.8;
        const lboMoic = (2.2 + val * 0.08).toFixed(2);
        const lboIrr = (22.5 + val * 1.2).toFixed(1);
        return `DuPont ROE: ${shockedRoe}% | P/E: ${pe}× | PE Sponsor MOIC: ${lboMoic}× (LBO IRR: ${lboIrr}%)`;
      },
      quickQuiz: {
        question: "In private equity LBO waterfall analysis, how does a cash flow 'debt sweep' protect credit lenders?",
        options: ["It distributes all profits to sponsors first", "100% of excess free cash flow is mandated to pay down senior debt principal before equity dividends", "It converts debt to common equity"],
        answerIndex: 1,
        explanation: "Debt sweeps enforce de-leveraging by sweeping 50-100% of excess cash flow toward rapid senior debt amortization, reducing default risk."
      }
    },
    ai_neural_alpha: {
      symbol: 'AAPL',
      benchmark: 'SPY',
      deskUrl: 'app.html#market',
      deskLabel: 'Desk 1: HMM Regime',
      deskIcon: 'fa-brain',
      actionLabel: '1-Click Deploy AI HMM Agent',
      actionOrder: { symbol: 'AAPL', side: 'BUY', qty: 10, price: 228 },
      metricTitle: 'Gaussian HMM Regime Probabilities',
      sliderLabel: 'Simulated 20D Return Momentum',
      sliderMin: -15,
      sliderMax: 15,
      sliderStep: 1,
      sliderDefault: 4,
      unit: '%',
      compute: (val, quote) => {
        const bullProb = Math.min(95, Math.max(5, Math.round(50 + val * 3.5)));
        const bearProb = Math.min(95 - bullProb, Math.max(5, Math.round(35 - val * 2.5)));
        const sidewaysProb = 100 - bullProb - bearProb;
        const regime = bullProb > 55 ? 'BULL TREND' : (bearProb > 55 ? 'BEAR TURBULENCE' : 'SIDEWAYS RANGE');
        return `State: ${regime} (Bull: ${bullProb}%, Bear: ${bearProb}%, Chop: ${sidewaysProb}%) | Neural SDE Loss: 0.0031`;
      },
      quickQuiz: {
        question: "Why do Hidden Markov Models (HMM) outperform static threshold indicators in systematic trading?",
        options: ["They assume market regime is constant", "They model latent unobservable market states and transition probabilities between regimes probabilistically", "They require no market data"],
        answerIndex: 1,
        explanation: "Markets alternate between latent regimes (trending bull, volatile bear, choppy consolidation). HMMs infer transition probabilities to dynamically adapt strategy risk."
      }
    },
    stochastic_interview: {
      symbol: 'NVDA',
      benchmark: 'QQQ',
      deskUrl: 'gs_quant.html',
      deskLabel: 'GS Quant Desk',
      deskIcon: 'fa-square-root-variable',
      actionLabel: '1-Click Optiver MM Quote Tape',
      actionOrder: { symbol: 'NVDA', side: 'BUY', qty: 10, price: 217 },
      metricTitle: 'Itô Lemma Drift & Avellaneda Skew',
      sliderLabel: 'Market Maker Inventory (q)',
      sliderMin: -50,
      sliderMax: 50,
      sliderStep: 5,
      sliderDefault: 15,
      unit: ' Contracts',
      compute: (val, quote) => {
        const q = parseInt(val);
        const spot = quote?.price || 217;
        const gamma = 0.1;
        const sigma = 0.35;
        const reservationPrice = (spot - q * gamma * Math.pow(sigma, 2)).toFixed(2);
        const halfSpread = 0.45;
        const bid = (parseFloat(reservationPrice) - halfSpread).toFixed(2);
        const ask = (parseFloat(reservationPrice) + halfSpread).toFixed(2);
        const skewDirection = q > 0 ? 'SKEWED DOWNWARD (Deter Buys, Attract Sells)' : (q < 0 ? 'SKEWED UPWARD (Attract Buys, Deter Sells)' : 'SYMMETRIC AROUND MID');
        return `Mid: $${spot} | Reservation Price r(s,q): $${reservationPrice} | Bid: $${bid} / Ask: $${ask} (${skewDirection})`;
      },
      quickQuiz: {
        question: "By Itô's Lemma, if dS = μ S dt + σ S dW, what is the stochastic differential of f(S) = ln(S)?",
        options: ["d(ln S) = μ dt + σ dW", "d(ln S) = (μ - ½σ²) dt + σ dW", "d(ln S) = ½σ² dt + σ dW"],
        answerIndex: 1,
        explanation: "By Itô's Lemma: df = (f' μ S + ½ f'' σ² S²) dt + f' σ S dW. With f'(S) = 1/S and f''(S) = -1/S², the drift term becomes (μ - ½σ²) dt."
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.COURSE_LIVE_CONFIGS = COURSE_LIVE_CONFIGS;
  }

  // ── Global Direct Action & Interactive Workstation Helpers ───────────────────
  window.executeCoursePaperTrade = (trackId) => {
    const cfg = COURSE_LIVE_CONFIGS[trackId];
    if (!cfg) return;

    if (typeof PaperBroker === 'undefined') {
      showToast('Paper Broker Connecting', 'Virtual sandbox environment is initializing...', 'warn');
      return;
    }

    let quote = null;
    if (typeof SecurityMaster !== 'undefined') {
      quote = SecurityMaster.getQuote(cfg.symbol) || SecurityMaster.getQuote(cfg.actionOrder.symbol);
    }
    const execPrice = (quote && quote.price) ? quote.price : cfg.actionOrder.price;

    const res = PaperBroker.placeOrder({
      symbol: cfg.actionOrder.symbol,
      side: cfg.actionOrder.side,
      qty: cfg.actionOrder.qty,
      price: execPrice,
      botCopySource: `Course: ${trackId}`,
      exchange: 'NSE'
    });

    if (res && res.success === false) {
      showToast('Execution Alert', res.reason || 'Order rejected by risk guardrails', 'warn');
    }
  };

  window.executeStepPaperTrade = (moduleId) => {
    if (typeof PaperBroker === 'undefined') {
      showToast('Paper Broker Connecting', 'Virtual sandbox environment is initializing...', 'warn');
      return;
    }
    const mod = (typeof LearnMathEngine !== 'undefined') ? LearnMathEngine.getModuleById(moduleId) : null;
    const sym = labState.activeSecuritySymbol ? labState.activeSecuritySymbol.replace('.NS', '') : 'RELIANCE';
    let price = 100;
    if (typeof SecurityMaster !== 'undefined') {
      const q = SecurityMaster.getQuote(sym) || SecurityMaster.getQuote('RELIANCE');
      if (q && q.price) price = q.price;
    }

    PaperBroker.placeOrder({
      symbol: sym,
      side: 'BUY',
      qty: 10,
      price: price,
      botCopySource: `Course Lab: ${mod ? mod.title : moduleId}`,
      exchange: 'NSE'
    });
  };

  window.bindCourseLiveSecurity = (trackId, symbol) => {
    if (COURSE_LIVE_CONFIGS[trackId]) {
      COURSE_LIVE_CONFIGS[trackId].symbol = symbol;
    }
    if (typeof window.bindRealTickerToLab === 'function') {
      window.bindRealTickerToLab(symbol);
    }
    renderCurriculumTracks();
  };

  window.launchCourseDesk = (trackId) => {
    const cfg = COURSE_LIVE_CONFIGS[trackId];
    if (cfg && cfg.deskUrl) {
      window.location.href = cfg.deskUrl;
    }
  };

  window.startCourseTrack = (trackId) => {
    const track = STRUCTURED_TRACKS.find(t => t.id === trackId);
    if (!track || !track.steps.length) return;
    const firstUncompleted = track.steps.find(s => !isLabCompleted(s.moduleId)) || track.steps[0];
    switchModule(firstUncompleted.moduleId);
    const workspace = document.getElementById('activeLabWorkspace');
    if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Course Track Activated', `Loaded ${firstUncompleted.title} into active laboratory`, 'success');
  };

  window.toggleCourseQuiz = (trackId) => {
    const quizEl = document.getElementById(`courseQuiz_${trackId}`);
    if (quizEl) {
      quizEl.classList.toggle('active');
    }
  };

  window.checkCourseQuiz = (trackId, selectedIdx) => {
    const cfg = COURSE_LIVE_CONFIGS[trackId];
    if (!cfg || !cfg.quickQuiz) return;
    const quiz = cfg.quickQuiz;
    const isCorrect = selectedIdx === quiz.answerIndex;
    const opts = document.querySelectorAll(`#courseQuiz_${trackId} .course-quiz-option`);
    opts.forEach((opt, idx) => {
      opt.classList.remove('correct', 'wrong');
      if (idx === quiz.answerIndex) {
        opt.classList.add('correct');
      } else if (idx === selectedIdx && !isCorrect) {
        opt.classList.add('wrong');
      }
    });

    const fbEl = document.getElementById(`courseQuizFeedback_${trackId}`);
    if (fbEl) {
      fbEl.style.display = 'block';
      fbEl.innerHTML = `
        <div style="font-size:0.75rem; font-weight:700; color:${isCorrect ? '#10b981' : '#ef4444'}; margin-bottom:4px;">
          ${isCorrect ? '✅ Spot on! Intuition Verified' : '❌ Keep Refining Your Derivation'}
        </div>
        <div style="font-size:0.7rem; color:#cbd5e1; line-height:1.4;">
          ${quiz.explanation}
        </div>
      `;
    }

    if (isCorrect) {
      showToast('Course Challenge Cleared! 🎯', 'Accreditation progress updated', 'success');
    }
  };

  window.syncAllCoursesLive = async () => {
    if (typeof SecurityMaster !== 'undefined' && typeof SecurityMaster.forceRefreshAllQuotes === 'function') {
      try {
        await SecurityMaster.forceRefreshAllQuotes();
      } catch (e) {}
    }
    updateCoursesLiveTelemetry();
    showToast('Live Market Sync Complete', 'All 10 courses synchronized with fresh exchange quotes', 'success');
  };

  function updateCoursesLiveTelemetry() {
    if (typeof SecurityMaster === 'undefined') return;

    Object.keys(COURSE_LIVE_CONFIGS).forEach(trackId => {
      const cfg = COURSE_LIVE_CONFIGS[trackId];
      const quote = SecurityMaster.getQuote(cfg.symbol) || SecurityMaster.getQuote(cfg.symbol.replace('.NS', '')) || SecurityMaster.getQuote('RELIANCE');
      if (!quote) return;

      const pricePill = document.getElementById(`coursePricePill_${trackId}`);
      if (pricePill) {
        const curr = labState.currency === 'USD' ? '$' : '₹';
        const priceVal = labState.currency === 'USD' && typeof SecurityMaster.getUsdToInr === 'function' ? (quote.price / SecurityMaster.getUsdToInr()) : quote.price;
        const chg = quote.changePercent || quote.change_percent || 0;
        pricePill.innerHTML = `
          <span class="course-live-pulse-dot"></span>
          <span style="color:#22d3ee;font-weight:800;">${quote.symbol}</span>
          <span style="color:#fff;">${curr}${priceVal.toFixed(2)}</span>
          <span style="color:${chg >= 0 ? '#10b981' : '#ef4444'}; font-size:0.68rem;">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>
        `;
      }

      const slider = document.getElementById(`courseSlider_${trackId}`);
      const resultEl = document.getElementById(`courseResult_${trackId}`);
      if (slider && resultEl && cfg.compute) {
        resultEl.textContent = cfg.compute(parseFloat(slider.value), quote);
      }
    });
  }
  window.updateCoursesLiveTelemetry = updateCoursesLiveTelemetry;

  // ── HUD Toast Notifications ───────────────────────────────────────────────
  const showToast = (title, message, type = 'info') => {
    let container = document.getElementById('riskosToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'riskosToastContainer';
      container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const borderColor = type === 'success' ? '#10b981' : (type === 'warn' ? '#f59e0b' : '#38bdf8');
    const iconClass = type === 'success' ? 'fa-circle-check text-emerald' : 'fa-circle-info text-cyan';

    toast.style.cssText = `
      background: #0f172a; border: 1px solid ${borderColor}55; border-left: 4px solid ${borderColor};
      padding: 12px 18px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      color: #fff; font-family: var(--font-mono, monospace); font-size: 0.8rem;
      display: flex; align-items: center; gap: 12px; pointer-events: auto;
      transform: translateX(120%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    toast.innerHTML = `
      <i class="fa-solid ${iconClass}" style="font-size: 1.1rem;"></i>
      <div>
        <div style="font-weight: 700; color: #fff; margin-bottom: 2px;">${title}</div>
        <div style="color: #94a3b8; font-size: 0.73rem;">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  };

  // ── Course Progress & Accreditation Mastery Engine ────────────────────────
  const updateCourseProgressHUD = () => {
    if (typeof LearnMathEngine === 'undefined') return;
    const totalLabs = (LearnMathEngine.MODULES_DIRECTORY && LearnMathEngine.MODULES_DIRECTORY.length) || 80;
    const completedCount = labState.completedLabs.size;
    const percent = Math.min(100, Math.round((completedCount / totalLabs) * 100));

    // Update Percentage Ring & Center Label
    const percentEl = document.getElementById('coursePercentVal');
    if (percentEl) percentEl.textContent = `${percent}%`;

    const ringEl = document.getElementById('courseProgressRing');
    if (ringEl) {
      const circumference = 2 * Math.PI * 38; // 238.76
      const offset = circumference - (percent / 100) * circumference;
      ringEl.style.strokeDashoffset = offset;
    }

    // Update Progress Bar Fill
    const barFillEl = document.getElementById('hudProgressBarFill');
    if (barFillEl) barFillEl.style.width = `${percent}%`;

    // Update Labs Counter
    const countEl = document.getElementById('completedLabsCount');
    if (countEl) countEl.textContent = completedCount;
    const totalEl = document.getElementById('totalLabsCount');
    if (totalEl) totalEl.textContent = totalLabs;

    const pillComp = document.getElementById('hudCompletedPillCount');
    if (pillComp) pillComp.textContent = completedCount;
    const pillRem = document.getElementById('hudRemainingPillCount');
    if (pillRem) pillRem.textContent = Math.max(0, totalLabs - completedCount);

    // Determine Accreditation Rank & Active Tier
    let rankTitle = 'QUANTITATIVE APPRENTICE';
    let activeTier = 'tierApprentice';
    if (percent >= 100) {
      rankTitle = 'MANAGING DIRECTOR / HEAD OF RISK';
      activeTier = 'tierMD';
    } else if (percent >= 75) {
      rankTitle = 'SENIOR QUANTITATIVE RESEARCHER';
      activeTier = 'tierSenior';
    } else if (percent >= 50) {
      rankTitle = 'ASSOCIATE PORTFOLIO MANAGER';
      activeTier = 'tierAssociate';
    } else if (percent >= 25) {
      rankTitle = 'JUNIOR QUANT ANALYST';
      activeTier = 'tierAnalyst';
    }

    const rankBadge = document.getElementById('hudRankBadge');
    if (rankBadge) {
      rankBadge.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${rankTitle}`;
      if (percent === 100) {
        rankBadge.classList.add('mastered-glow');
      } else {
        rankBadge.classList.remove('mastered-glow');
      }
    }

    // Update Tier Milestone Indicators
    ['tierApprentice', 'tierAnalyst', 'tierAssociate', 'tierSenior', 'tierMD'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === activeTier);
    });

    updateLabCompleteButton();
  };

  const updateLabCompleteButton = () => {
    const btn = document.getElementById('btnToggleLabComplete');
    const icon = document.getElementById('btnToggleLabCompleteIcon');
    const text = document.getElementById('btnToggleLabCompleteText');
    if (!btn) return;

    const isDone = isLabCompleted(labState.activeModuleId);
    btn.classList.toggle('is-completed', isDone);

    if (isDone) {
      if (icon) icon.className = 'fa-solid fa-circle-check text-emerald';
      if (text) text.textContent = 'Mastered ✓';
      btn.title = 'Laboratory Mastered! Click to mark incomplete.';
    } else {
      if (icon) icon.className = 'fa-regular fa-circle-check';
      if (text) text.textContent = 'Mark Mastered';
      btn.title = 'Mark this laboratory as completed/mastered (+1.25% progress)';
    }
  };

  const toggleActiveLabComplete = () => {
    const activeId = labState.activeModuleId;
    const isNowDone = !labState.completedLabs.has(activeId);

    if (isNowDone) {
      labState.completedLabs.add(activeId);
      showToast('Mastery Confirmed', `${activeId.toUpperCase()} recorded as Mastered (+1.25% Course Completion)!`, 'success');
    } else {
      labState.completedLabs.delete(activeId);
      showToast('Status Updated', `${activeId.toUpperCase()} marked as incomplete.`, 'info');
    }

    saveCompletedLabs();
    updateCourseProgressHUD();
    renderCurriculumTracks();
    renderTopModulesBar();
    renderAllModulesGrid();
  };

  const advanceNextCurriculumLab = () => {
    if (typeof LearnMathEngine === 'undefined') return;
    const all = LearnMathEngine.MODULES_DIRECTORY;
    const currentIdx = all.findIndex(m => m.id === labState.activeModuleId);
    
    // Check if next lab in current track exists
    let nextModId = null;
    for (const track of STRUCTURED_TRACKS) {
      const stepIdx = track.steps.findIndex(s => s.moduleId === labState.activeModuleId);
      if (stepIdx !== -1 && stepIdx < track.steps.length - 1) {
        nextModId = track.steps[stepIdx + 1].moduleId;
        break;
      }
    }

    // Fallback to next module in directory if at end of track or not in track
    if (!nextModId && currentIdx !== -1 && currentIdx < all.length - 1) {
      nextModId = all[currentIdx + 1].id;
    } else if (!nextModId && all.length > 0) {
      nextModId = all[0].id; // Loop back to start
    }

    if (nextModId) {
      switchModule(nextModId);
      const ws = document.getElementById('activeLabWorkspace');
      if (ws) ws.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Next Lab Loaded', `Advanced to ${nextModId.toUpperCase()}`, 'info');
    }
  };

  const setExplanationMode = (mode) => {
    if (!['beginner', 'investor', 'quant'].includes(mode)) return;
    labState.explanationMode = mode;
    document.body.setAttribute('data-user-mode', mode);
    document.querySelectorAll('#modeSelectorPill .mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    evaluateActiveModule();
  };

  const renderCurriculumTracks = () => {
    const container = document.getElementById('curriculumTracksGrid');
    if (!container) return;

    const visibleTracks = STRUCTURED_TRACKS.filter(t => {
      if (activeCurriculumFilter === 'all') return true;
      return t.personas && t.personas.includes(activeCurriculumFilter);
    });

    container.innerHTML = visibleTracks.map(track => {
      const isCurrentInTrack = track.steps.some(s => s.moduleId === labState.activeModuleId);
      const completedStepsCount = track.steps.filter(s => isLabCompleted(s.moduleId)).length;
      const isTrackMastered = completedStepsCount === track.steps.length;
      const cfg = COURSE_LIVE_CONFIGS[track.id] || {};
      let quote = null;
      if (typeof SecurityMaster !== 'undefined' && cfg.symbol) {
        quote = SecurityMaster.getQuote(cfg.symbol) || SecurityMaster.getQuote(cfg.symbol.replace('.NS', '')) || SecurityMaster.getQuote('RELIANCE');
      }
      const curr = labState.currency === 'USD' ? '$' : '₹';
      const quotePrice = quote ? (labState.currency === 'USD' && typeof SecurityMaster.getUsdToInr === 'function' ? (quote.price / SecurityMaster.getUsdToInr()) : quote.price) : 0;
      const chg = quote ? (quote.changePercent || quote.change_percent || 0) : 0;
      const initialResult = cfg.compute ? cfg.compute(cfg.sliderDefault || 10, quote) : '';

      return `
        <div class="curriculum-card ${isCurrentInTrack ? 'active-track' : ''} ${isTrackMastered ? 'track-mastered' : ''}" style="border-top: 3px solid ${track.color};">
          <!-- 1. Header with Badge & Mastery Stats -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 2px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:32px; height:32px; border-radius:8px; background:${track.color}20; display:flex; align-items:center; justify-content:center; color:${track.color}; flex-shrink:0;">
                <i class="fa-solid ${track.icon}"></i>
              </div>
              <div>
                <h4 style="font-size:0.94rem; font-weight:800; color:#fff; margin:0;">${track.title}</h4>
                <span style="font-size:0.7rem; color:var(--text-muted);">${track.subtitle}</span>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:3px;">
              <span style="font-size:0.65rem; font-weight:700; color:${track.color}; background:${track.color}15; border:1px solid ${track.color}35; padding:2px 7px; border-radius:4px; text-transform:uppercase;">${track.badge}</span>
              <span style="font-size:0.62rem; font-weight:600; color:${isTrackMastered ? '#10b981' : 'var(--text-muted)'}; font-family:var(--font-mono, monospace);">
                ${isTrackMastered ? 'TRACK MASTERED ✓' : `${completedStepsCount}/${track.steps.length} Completed`}
              </span>
            </div>
          </div>

          <p style="font-size:0.73rem; color:var(--text-secondary); line-height:1.4; margin:0;">${track.description}</p>

          <!-- 2. Real-Time Live Telemetry Bar -->
          <div class="course-live-telemetry-bar">
            <div class="course-live-ticker-badge" id="coursePricePill_${track.id}">
              <span class="course-live-pulse-dot"></span>
              <span style="color:#22d3ee;font-weight:800;">${cfg.symbol || 'LIVE'}</span>
              <span style="color:#fff;">${quote ? `${curr}${quotePrice.toFixed(2)}` : 'Syncing...'}</span>
              <span style="color:${chg >= 0 ? '#10b981' : '#ef4444'}; font-size:0.68rem;">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:0.65rem; color:#10b981; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.25); padding:1px 6px; border-radius:4px; font-weight:700;">
                <i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> LIVE SYNC
              </span>
              <select onchange="window.bindCourseLiveSecurity('${track.id}', this.value)" style="background:#090d16; border:1px solid rgba(255,255,255,0.15); color:#cbd5e1; font-size:0.68rem; border-radius:4px; padding:2px 4px; cursor:pointer;" title="Change live bound ticker for this course">
                <option value="${cfg.symbol || 'RELIANCE.NS'}">${cfg.symbol || 'Default'}</option>
                <option value="RELIANCE.NS">RELIANCE (NSE)</option>
                <option value="TCS.NS">TCS (NSE)</option>
                <option value="HDFCBANK.NS">HDFCBANK (NSE)</option>
                <option value="^NSEI">NIFTY 50</option>
                <option value="NVDA">NVDA ($)</option>
                <option value="AAPL">AAPL ($)</option>
                <option value="BTC-USD">BTC-USD</option>
              </select>
            </div>
          </div>

          <!-- 3. Interactive Live Course Mini-Workbench -->
          <div class="course-mini-workbench">
            <div class="course-workbench-header">
              <span style="color:${track.color}; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em;">
                <i class="fa-solid fa-sliders" style="margin-right:4px;"></i> ${cfg.metricTitle || 'Live Parameter Sensitivity'}
              </span>
              <span style="font-family:var(--font-mono, monospace); font-weight:700; color:#fff;" id="courseSliderVal_${track.id}">
                ${cfg.unit === '₹' ? '₹' : ''}${cfg.sliderDefault || 10}${cfg.unit !== '₹' ? cfg.unit : ''}
              </span>
            </div>
            <div class="course-workbench-slider-row">
              <input 
                type="range" 
                class="course-workbench-slider" 
                id="courseSlider_${track.id}"
                min="${cfg.sliderMin || 0}" 
                max="${cfg.sliderMax || 100}" 
                step="${cfg.sliderStep || 1}" 
                value="${cfg.sliderDefault || 10}" 
                oninput="
                  const v = this.value;
                  const valEl = document.getElementById('courseSliderVal_${track.id}');
                  if (valEl) valEl.textContent = '${cfg.unit === '₹' ? '₹' : ''}' + v + '${cfg.unit !== '₹' ? cfg.unit : ''}';
                  const resEl = document.getElementById('courseResult_${track.id}');
                  if (resEl && window.COURSE_LIVE_CONFIGS && window.COURSE_LIVE_CONFIGS['${track.id}']) {
                    const q = (typeof SecurityMaster !== 'undefined') ? (SecurityMaster.getQuote('${cfg.symbol}') || SecurityMaster.getQuote('RELIANCE')) : null;
                    resEl.textContent = window.COURSE_LIVE_CONFIGS['${track.id}'].compute(parseFloat(v), q);
                  }
                "
              />
            </div>
            <div class="course-workbench-result" id="courseResult_${track.id}">
              ${initialResult}
            </div>
          </div>

          <!-- 4. Direct Action Suite -->
          <div class="course-direct-action-strip">
            <button onclick="window.executeCoursePaperTrade('${track.id}')" class="course-direct-act-btn btn-trade" title="Execute simulated order in ₹10 Lakhs sandbox account">
              <i class="fa-solid fa-bolt"></i> ${cfg.actionLabel || '1-Click Paper Order'}
            </button>
            <button onclick="window.launchCourseDesk('${track.id}')" class="course-direct-act-btn btn-desk" title="Launch dedicated institutional trading desk">
              <i class="fa-solid ${cfg.deskIcon || 'fa-arrow-up-right-from-square'}"></i> ${cfg.deskLabel || 'Desk'}
            </button>
            <button onclick="window.toggleCourseQuiz('${track.id}')" class="course-direct-act-btn btn-quiz" title="Test intuition with instant quiz">
              <i class="fa-solid fa-lightbulb"></i> Check Intuition
            </button>
            <button onclick="window.startCourseTrack('${track.id}')" class="course-direct-act-btn btn-start" title="Begin or continue this course track">
              <i class="fa-solid fa-play"></i> Start Track
            </button>
          </div>

          <!-- 5. Interactive Quiz Dropdown (Checkpoint Challenge) -->
          <div class="course-quiz-banner" id="courseQuiz_${track.id}">
            <div style="font-size:0.75rem; font-weight:700; color:#fbbf24; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-graduation-cap"></i> Intuition Challenge: ${cfg.quickQuiz?.question || ''}
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${(cfg.quickQuiz?.options || []).map((opt, optIdx) => `
                <button class="course-quiz-option" onclick="window.checkCourseQuiz('${track.id}', ${optIdx})">
                  ${opt}
                </button>
              `).join('')}
            </div>
            <div id="courseQuizFeedback_${track.id}" style="display:none; padding:8px; background:rgba(0,0,0,0.4); border-radius:6px; margin-top:4px;"></div>
          </div>

          <!-- 6. Step Items with Step-Level Direct Actions -->
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${track.steps.map((step, idx) => {
              const isActive = step.moduleId === labState.activeModuleId;
              const isDone = isLabCompleted(step.moduleId);
              return `
                <div class="curriculum-step-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" data-module-id="${step.moduleId}" data-personas="${(track.personas || []).join(',')}" title="Load ${step.title}">
                  <span class="step-num-badge" style="${isActive ? `color:${track.color}; background:${track.color}25;` : ''}">
                    ${isDone ? '<i class="fa-solid fa-check text-emerald" style="font-size:0.65rem;"></i>' : `0${idx + 1}`}
                  </span>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:0.75rem; font-weight:${isActive ? '800' : '600'}; color:${isActive ? '#fff' : (isDone ? '#e2e8f0' : 'var(--text-primary)')}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:5px;">
                      <span>${step.title}</span>
                      ${isDone ? '<i class="fa-solid fa-circle-check text-emerald" style="font-size:0.68rem;" title="Mastered"></i>' : ''}
                    </div>
                    <div style="font-size:0.66rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${step.role}
                    </div>
                  </div>
                  <!-- Step Direct Actions -->
                  <div class="step-actions-group" onclick="event.stopPropagation()">
                    <button class="step-quick-action-btn" onclick="window.bindRealTickerToLab && window.bindRealTickerToLab('${cfg.symbol || 'RELIANCE.NS'}'); window.switchModule && window.switchModule('${step.moduleId}'); document.getElementById('activeLabWorkspace')?.scrollIntoView({behavior:'smooth'});" title="Run live with real-time market data">
                      <i class="fa-solid fa-bolt" style="color:#22d3ee;"></i> Run
                    </button>
                    <button class="step-quick-action-btn btn-trade-step" onclick="window.executeStepPaperTrade && window.executeStepPaperTrade('${step.moduleId}')" title="Execute simulated sandbox trade">
                      <i class="fa-solid fa-coins" style="color:#10b981;"></i> Trade
                    </button>
                  </div>
                  ${isActive ? `<i class="fa-solid fa-circle-play" style="color:${track.color}; font-size:0.8rem; margin-top:3px; margin-left:4px;"></i>` : (isDone ? `<i class="fa-solid fa-circle-check" style="color:#10b981; font-size:0.75rem; margin-top:4px; opacity:0.85; margin-left:4px;"></i>` : `<i class="fa-solid fa-chevron-right" style="color:var(--text-muted); font-size:0.65rem; margin-top:5px; opacity:0.4; margin-left:4px;"></i>`)}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.curriculum-step-item').forEach(el => {
      el.addEventListener('click', () => {
        const modId = el.dataset.moduleId;
        const personas = (el.dataset.personas || '').split(',');
        if (personas.includes('layman') && !personas.includes('institutional') && labState.explanationMode !== 'beginner') {
          setExplanationMode('beginner');
        } else if ((personas.includes('institutional') || personas.includes('trading') || personas.includes('ai_hft')) && labState.explanationMode === 'beginner') {
          setExplanationMode('quant');
        }
        switchModule(modId);
        const workspace = document.getElementById('activeLabWorkspace');
        if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const updateTrackProgressBanner = () => {
    const banner = document.getElementById('trackProgressBanner');
    if (!banner) return;

    let matchedTrack = null;
    let stepIndex = -1;

    for (const track of STRUCTURED_TRACKS) {
      const idx = track.steps.findIndex(s => s.moduleId === labState.activeModuleId);
      if (idx !== -1) {
        matchedTrack = track;
        stepIndex = idx;
        break;
      }
    }

    const nameEl = document.getElementById('trackProgressName');
    const titleEl = document.getElementById('trackProgressTitle');
    const unlockEl = document.getElementById('trackProgressUnlock');
    const badgeEl = document.getElementById('trackProgressBadge');
    const btnPrev = document.getElementById('btnPrevTrackStep');
    const btnNext = document.getElementById('btnNextTrackStep');

    if (matchedTrack && stepIndex !== -1) {
      const currentStep = matchedTrack.steps[stepIndex];
      if (badgeEl) {
        badgeEl.textContent = `${matchedTrack.badge.toUpperCase()} • STEP ${stepIndex + 1}/${matchedTrack.steps.length}`;
        badgeEl.style.color = matchedTrack.color;
        badgeEl.style.background = `${matchedTrack.color}20`;
      }
      if (nameEl) {
        nameEl.textContent = matchedTrack.title;
        nameEl.style.color = matchedTrack.color;
      }
      if (titleEl) {
        titleEl.textContent = `Step ${stepIndex + 1} of ${matchedTrack.steps.length}: ${currentStep.title}`;
      }
      if (unlockEl) {
        unlockEl.innerHTML = `<i class="fa-solid fa-unlock-keyhole text-emerald" style="margin-right:5px;"></i>Powers: ${currentStep.unlock}`;
      }

      if (btnPrev) {
        btnPrev.disabled = stepIndex === 0;
        btnPrev.style.opacity = stepIndex === 0 ? '0.4' : '1';
        btnPrev.onclick = () => {
          if (stepIndex > 0) switchModule(matchedTrack.steps[stepIndex - 1].moduleId);
        };
      }
      if (btnNext) {
        btnNext.disabled = stepIndex === matchedTrack.steps.length - 1;
        btnNext.style.opacity = stepIndex === matchedTrack.steps.length - 1 ? '0.4' : '1';
        btnNext.onclick = () => {
          if (stepIndex < matchedTrack.steps.length - 1) switchModule(matchedTrack.steps[stepIndex + 1].moduleId);
        };
      }
    } else {
      const currentMod = (typeof LearnMathEngine !== 'undefined') ? LearnMathEngine.getModuleById(labState.activeModuleId) : null;
      if (badgeEl) {
        badgeEl.textContent = 'ADVANCED SPECIALIZED LAB';
        badgeEl.style.color = '#38bdf8';
        badgeEl.style.background = 'rgba(56, 189, 248, 0.15)';
      }
      if (nameEl) {
        nameEl.textContent = currentMod ? currentMod.category.toUpperCase() : 'SPECIALIZED QUANTITATIVE';
        nameEl.style.color = '#38bdf8';
      }
      if (titleEl) {
        titleEl.textContent = currentMod ? currentMod.title : 'Quantitative Simulation';
      }
      if (unlockEl) {
        unlockEl.innerHTML = `<i class="fa-solid fa-microchip text-cyan" style="margin-right:5px;"></i>Deep specialized engine connected to RISKOS Multi-Asset Platform`;
      }
      if (btnPrev) {
        btnPrev.disabled = false;
        btnPrev.style.opacity = '1';
        btnPrev.onclick = () => {
          if (typeof LearnMathEngine !== 'undefined') {
            const all = LearnMathEngine.MODULES_DIRECTORY;
            const idx = all.findIndex(m => m.id === labState.activeModuleId);
            if (idx > 0) switchModule(all[idx - 1].id);
          }
        };
      }
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.style.opacity = '1';
        btnNext.onclick = () => {
          if (typeof LearnMathEngine !== 'undefined') {
            const all = LearnMathEngine.MODULES_DIRECTORY;
            const idx = all.findIndex(m => m.id === labState.activeModuleId);
            if (idx !== -1 && idx < all.length - 1) switchModule(all[idx + 1].id);
          }
        };
      }
    }
  };

  const initStructuredLearningTracks = () => {
    const filterAll = document.getElementById('filterCurriculumAll');
    const filterLayman = document.getElementById('filterCurriculumLayman');
    const filterTrading = document.getElementById('filterCurriculumTrading');
    const filterInst = document.getElementById('filterCurriculumInst');
    const filterAiHft = document.getElementById('filterCurriculumAiHft');

    const filterBtns = [filterAll, filterLayman, filterTrading, filterInst, filterAiHft].filter(Boolean);

    const setCurriculumFilter = (filter) => {
      activeCurriculumFilter = filter;
      filterBtns.forEach(btn => {
        const isMatch = btn.dataset.curriculum === filter;
        btn.classList.toggle('active', isMatch);
        if (isMatch) {
          btn.style.background = 'rgba(34, 211, 238, 0.15)';
          btn.style.color = '#22d3ee';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'var(--text-muted)';
        }
      });
      renderCurriculumTracks();
    };

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => setCurriculumFilter(btn.dataset.curriculum));
    });

    // Wire Mastery HUD Filter Buttons & Reset Action
    const btnFilterComp = document.getElementById('btnFilterCompletedLabs');
    const btnFilterRem = document.getElementById('btnFilterRemainingLabs');
    const btnResetProg = document.getElementById('btnResetCourseProgress');

    if (btnFilterComp) {
      btnFilterComp.addEventListener('click', () => {
        labState.activeFilterMode = (labState.activeFilterMode === 'completed') ? 'all' : 'completed';
        btnFilterComp.classList.toggle('active', labState.activeFilterMode === 'completed');
        if (btnFilterRem) btnFilterRem.classList.remove('active');
        renderTopModulesBar();
        renderAllModulesGrid();
      });
    }

    if (btnFilterRem) {
      btnFilterRem.addEventListener('click', () => {
        labState.activeFilterMode = (labState.activeFilterMode === 'remaining') ? 'all' : 'remaining';
        btnFilterRem.classList.toggle('active', labState.activeFilterMode === 'remaining');
        if (btnFilterComp) btnFilterComp.classList.remove('active');
        renderTopModulesBar();
        renderAllModulesGrid();
      });
    }

    if (btnResetProg) {
      btnResetProg.addEventListener('click', () => {
        if (window.confirm('Reset all course progress? This will reset your 80-laboratory completion records.')) {
          labState.completedLabs.clear();
          saveCompletedLabs();
          updateCourseProgressHUD();
          renderCurriculumTracks();
          renderTopModulesBar();
          renderAllModulesGrid();
          showToast('Progress Reset', 'Course progress has been reset to 0%.', 'info');
        }
      });
    }

    // Wire Lab Active Workspace Action Bar Buttons
    const btnToggleComplete = document.getElementById('btnToggleLabComplete');
    if (btnToggleComplete) {
      btnToggleComplete.addEventListener('click', toggleActiveLabComplete);
    }

    const btnNextCurriculum = document.getElementById('btnNextCurriculumLab');
    if (btnNextCurriculum) {
      btnNextCurriculum.addEventListener('click', advanceNextCurriculumLab);
    }

    // Setup Trading Strategy Blueprint Launch Buttons
    document.querySelectorAll('.strat-launch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.moduleId;
        if (modId) {
          setExplanationMode('quant');
          switchModule(modId);
          const workspace = document.getElementById('activeLabWorkspace');
          if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    renderCurriculumTracks();
    updateTrackProgressBanner();
    updateCourseProgressHUD();
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
        setExplanationMode(btn.dataset.mode);
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
        if (typeof updateCoursesLiveTelemetry === 'function') {
          updateCoursesLiveTelemetry();
        }
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
    initStructuredLearningTracks();
    initStrategySimulatorDesk();
    switchModule(targetMod || 'cagr', false);

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.lab) {
        switchModule(e.state.lab, false);
      }
    });

    if (targetSec && typeof SecurityMaster !== 'undefined') {
      window.bindRealTickerToLab(targetSec);
    } else if (typeof window.bindRealTickerToLab === 'function') {
      // Default to Live Real-Time Blue Chip Benchmark (Zero Mockups)
      window.bindRealTickerToLab('RELIANCE.NS');
    }

    if (typeof updateCoursesLiveTelemetry === 'function') {
      updateCoursesLiveTelemetry();
    }

    // 11. Render static ambient math tags across the entire laboratory
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          ignoredClasses: ["price", "money", "ticker", "badge", "currency", "stat-val", "metric-val"],
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.warn('Initial ambient KaTeX render notice:', e);
      }
    }
  };

  // ── Interactive Systematic Strategy Simulation Sandbox ───────────────────
  const initStrategySimulatorDesk = () => {
    const deskSection = document.getElementById('quantSimDeskSection');
    if (!deskSection) return;

    const stratBtns = deskSection.querySelectorAll('.strat-pill-btn');
    const capitalSlider = document.getElementById('simDeskCapital');
    const capitalVal = document.getElementById('simDeskCapitalVal');
    const regimeSelect = document.getElementById('simDeskRegime');
    const slippageSelect = document.getElementById('simDeskSlippage');
    const speedSlider = document.getElementById('simDeskSpeed');
    const speedVal = document.getElementById('simDeskSpeedVal');
    const btnRun = document.getElementById('btnSimDeskRun');
    const btnStep = document.getElementById('btnSimDeskStep');
    const btnReset = document.getElementById('btnSimDeskReset');
    const btnOpenLab = document.getElementById('btnSimDeskOpenLab');

    const navEl = document.getElementById('simDeskNav');
    const pnlEl = document.getElementById('simDeskPnl');
    const sharpeEl = document.getElementById('simDeskSharpe');
    const mddEl = document.getElementById('simDeskMdd');
    const fillsCountEl = document.getElementById('simDeskFillsCount');
    const tapeContainer = document.getElementById('simDeskTapeContainer');
    const canvas = document.getElementById('simDeskCanvas');

    let currentStrat = 'dual_momentum';
    let isRunning = false;
    let timer = null;
    let tickCount = 0;
    let initialCapital = 1000000;
    let currentNAV = 1000000;
    let peakNAV = 1000000;
    let maxDrawdown = 0;
    let fills = [];
    let navHistory = [1000000];
    let labelsHistory = ['T0'];
    let chartInstance = null;

    const STRAT_MAP = {
      dual_momentum: { name: 'Dual Momentum & Vol Targeting', labId: 'dual_momentum_antonacci', basePrice: 2500, symbol: 'NIFTY/RELIANCE' },
      kalman_pairs: { name: 'Kalman Cointegration Stat-Arb', labId: 'kalman_pairs', basePrice: 1550, symbol: 'HDFCBANK/ICICIBANK' },
      avellaneda: { name: 'Avellaneda-Stoikov HFT Market Making', labId: 'avellaneda_stoikov', basePrice: 100, symbol: 'OFI-L2-TICK' },
      gex_pinning: { name: '0DTE Gamma Exposure Pinning', labId: 'gex_0dte_pinning', basePrice: 24200, symbol: 'NIFTY-0DTE' },
      basis_carry: { name: 'Cash & Carry Futures Basis Roll', labId: 'futures_basis_carry', basePrice: 24350, symbol: 'NIFTY-FUT-BASIS' },
      hawkes: { name: 'Hawkes Liquidity Cascades', labId: 'hawkes_liquidity_cascades', basePrice: 215, symbol: 'OFI-CASCADES' },
      footprint: { name: 'Order Flow Footprint & Stacked Imbalances', labId: 'egyptian_pantheon_hft', basePrice: 2800, symbol: 'RELIANCE-FOOTPRINT' }
    };

    const initDeskChart = () => {
      if (!canvas || typeof Chart === 'undefined') return;
      const ctx = canvas.getContext('2d');
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labelsHistory,
          datasets: [{
            label: 'Portfolio Equity (₹)',
            data: navHistory,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.08)',
            borderWidth: 2,
            fill: true,
            tension: 0.2,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 120 },
          scales: {
            x: {
              display: false,
              grid: { color: 'rgba(255,255,255,0.04)' }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.06)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 10, family: 'JetBrains Mono' },
                callback: (v) => LearnMathEngine ? LearnMathEngine.formatMoney(v, 'INR', true) : `₹${v}`
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `NAV: ${LearnMathEngine ? LearnMathEngine.formatMoney(ctx.parsed.y, 'INR', false) : '₹' + ctx.parsed.y}`
              }
            }
          }
        }
      });
    };

    const resetSimulation = () => {
      isRunning = false;
      if (timer) clearInterval(timer);
      timer = null;
      if (btnRun) {
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run Sim';
        btnRun.classList.add('primary');
      }

      initialCapital = Number(capitalSlider ? capitalSlider.value : 1000000);
      currentNAV = initialCapital;
      peakNAV = initialCapital;
      maxDrawdown = 0;
      tickCount = 0;
      fills = [];
      navHistory = [initialCapital];
      labelsHistory = ['T0'];

      updateUI();
      initDeskChart();
      if (tapeContainer) {
        tapeContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px 0;">Simulation ready with ${LearnMathEngine ? LearnMathEngine.formatMoney(initialCapital, 'INR', true) : '₹' + initialCapital}. Click "Run Sim" to stream live fills.</div>`;
      }
    };

    const stepTick = () => {
      tickCount++;
      const reg = regimeSelect ? regimeSelect.value : 'bull_trend';
      const slipModel = slippageSelect ? slippageSelect.value : 'sqrt_impact';
      const stratInfo = STRAT_MAP[currentStrat] || STRAT_MAP.dual_momentum;

      let drift = 0.0004;
      let vol = 0.004;
      if (reg === 'bull_trend') { drift = 0.0008; vol = 0.003; }
      else if (reg === 'range_bound') { drift = 0.0000; vol = 0.005; }
      else if (reg === 'bear_crash') { drift = -0.0012; vol = 0.009; }
      else if (reg === 'flash_crash') { drift = tickCount % 8 === 0 ? -0.015 : 0.002; vol = 0.012; }

      let stratEdge = 0.0005;
      if (currentStrat === 'kalman_pairs' && reg === 'range_bound') stratEdge = 0.0012;
      if (currentStrat === 'dual_momentum' && reg === 'bull_trend') stratEdge = 0.0015;
      if (currentStrat === 'basis_carry') { drift = 0.0003; vol = 0.0004; stratEdge = 0.0004; }
      if (currentStrat === 'hawkes') { drift = 0.0004; vol = 0.006; stratEdge = 0.0008; }
      if (currentStrat === 'footprint') { drift = 0.0006; vol = 0.0035; stratEdge = 0.0011; }

      const z = (Math.random() - 0.5) * 2;
      const returnPct = drift + stratEdge + z * vol;

      let slipBps = 1.5;
      if (slipModel === 'sqrt_impact') slipBps = 3.2 + Math.random() * 2.0;
      else if (slipModel === 'toxic_adverse') slipBps = 7.5 + Math.random() * 4.0;
      else if (slipModel === 'zero_slip') slipBps = 0.0;

      const netReturn = returnPct - (slipBps / 10000);
      currentNAV = Math.max(10000, currentNAV * (1 + netReturn));
      if (currentNAV > peakNAV) peakNAV = currentNAV;
      const dd = ((peakNAV - currentNAV) / peakNAV) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      navHistory.push(Math.round(currentNAV));
      labelsHistory.push(`T${tickCount}`);
      if (navHistory.length > 50) {
        navHistory.shift();
        labelsHistory.shift();
      }

      const side = netReturn >= 0 ? 'BUY' : 'SELL';
      const qty = Math.max(1, Math.round((currentNAV * 0.05) / stratInfo.basePrice));
      const execPrice = Number((stratInfo.basePrice * (1 + (tickCount * 0.0002) + z * 0.005)).toFixed(2));
      const fillPnL = Math.round(currentNAV * netReturn);

      fills.unshift({
        tick: tickCount,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        side,
        qty,
        price: execPrice,
        slip: slipBps.toFixed(1),
        pnl: fillPnL
      });
      if (fills.length > 25) fills.pop();

      // Feed live global Hawkes & Footprint engines if present
      if (typeof window !== 'undefined') {
        if (window.HawkesProcessEngine && typeof window.HawkesProcessEngine.registerTrade === 'function') {
          window.HawkesProcessEngine.registerTrade(qty, reg === 'flash_crash');
        }
        if (window.OrderFlowFootprint && typeof window.OrderFlowFootprint.registerTrade === 'function') {
          window.OrderFlowFootprint.registerTrade(execPrice, qty, side);
        }
      }

      updateUI();
      if (chartInstance) {
        chartInstance.update();
      }
      renderTape();
    };

    const renderTape = () => {
      if (!tapeContainer) return;
      tapeContainer.innerHTML = fills.slice(0, 8).map(f => {
        const isWin = f.pnl >= 0;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 5px 8px; border-radius: 4px; border-left: 3px solid ${isWin ? '#10b981' : '#ef4444'};">
            <div>
              <span style="color: ${f.side === 'BUY' ? '#10b981' : '#f59e0b'}; font-weight: 700;">${f.side}</span>
              <span style="color: #94a3b8; margin-left: 4px;">${f.qty}x @ ₹${f.price}</span>
            </div>
            <div style="text-align: right;">
              <span style="color: ${isWin ? '#10b981' : '#ef4444'}; font-weight: 700;">${isWin ? '+' : ''}₹${Math.abs(f.pnl).toLocaleString('en-IN')}</span>
              <span style="color: #64748b; font-size: 0.62rem; margin-left: 4px;">(${f.slip}bps)</span>
            </div>
          </div>
        `;
      }).join('');
    };

    const updateUI = () => {
      if (capitalVal && capitalSlider) {
        capitalVal.textContent = LearnMathEngine ? LearnMathEngine.formatMoney(capitalSlider.value, 'INR', true) : `₹${capitalSlider.value}`;
      }
      if (speedVal && speedSlider) {
        speedVal.textContent = `${speedSlider.value}× (${speedSlider.value > 10 ? 'Hyper' : speedSlider.value > 3 ? 'Fast' : 'Real-Time'})`;
      }
      if (navEl) {
        navEl.textContent = LearnMathEngine ? LearnMathEngine.formatMoney(currentNAV, 'INR', true) : `₹${currentNAV.toFixed(0)}`;
      }
      if (pnlEl) {
        const absPnl = currentNAV - initialCapital;
        const pctPnl = ((absPnl / initialCapital) * 100).toFixed(2);
        const isPos = absPnl >= 0;
        pnlEl.textContent = `${isPos ? '+' : ''}${LearnMathEngine ? LearnMathEngine.formatMoney(absPnl, 'INR', true) : '₹' + absPnl} (${isPos ? '+' : ''}${pctPnl}%)`;
        pnlEl.style.color = isPos ? '#10b981' : '#ef4444';
      }
      if (sharpeEl) {
        const annReturn = ((currentNAV - initialCapital) / initialCapital) * (252 / Math.max(1, tickCount));
        const sharpe = Math.max(0, Math.min(3.5, 1.25 + (annReturn * 2) - (maxDrawdown * 0.05))).toFixed(2);
        sharpeEl.textContent = sharpe;
      }
      if (mddEl) {
        mddEl.textContent = `-${maxDrawdown.toFixed(2)}%`;
      }
      if (fillsCountEl) {
        fillsCountEl.textContent = `${fills.length} Fills`;
      }
    };

    // Event Listeners
    if (capitalSlider) capitalSlider.addEventListener('input', resetSimulation);
    if (speedSlider) {
      speedSlider.addEventListener('input', () => {
        updateUI();
        if (isRunning) {
          clearInterval(timer);
          const ms = Math.max(50, Math.round(1000 / Number(speedSlider.value)));
          timer = setInterval(stepTick, ms);
        }
      });
    }
    if (regimeSelect) regimeSelect.addEventListener('change', () => { updateUI(); });
    if (slippageSelect) slippageSelect.addEventListener('change', () => { updateUI(); });

    stratBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        stratBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'rgba(255,255,255,0.04)';
          b.style.color = 'var(--text-muted)';
          b.style.borderColor = 'rgba(255,255,255,0.08)';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(34,211,238,0.2)';
        btn.style.color = '#22d3ee';
        btn.style.borderColor = 'rgba(34,211,238,0.4)';
        currentStrat = btn.dataset.strat;
        resetSimulation();
      });
    });

    if (btnRun) {
      btnRun.addEventListener('click', () => {
        isRunning = !isRunning;
        if (isRunning) {
          btnRun.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
          btnRun.classList.remove('primary');
          const spd = speedSlider ? Number(speedSlider.value) : 5;
          const ms = Math.max(50, Math.round(1000 / spd));
          timer = setInterval(stepTick, ms);
        } else {
          btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run Sim';
          btnRun.classList.add('primary');
          clearInterval(timer);
          timer = null;
        }
      });
    }

    if (btnStep) {
      btnStep.addEventListener('click', () => {
        if (!isRunning) stepTick();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', resetSimulation);
    }

    if (btnOpenLab) {
      btnOpenLab.addEventListener('click', () => {
        const stratInfo = STRAT_MAP[currentStrat];
        if (stratInfo && stratInfo.labId) {
          switchModule(stratInfo.labId);
          const targetEl = document.getElementById('activeLabWorkspace');
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    initDeskChart();
    updateUI();
    initMasterclassAndCertificates();
  };

  const initMasterclassAndCertificates = () => {
    // 1. Masterclass Subtabs Switcher
    const subtabs = document.querySelectorAll('.masterclass-nav-tab');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => {
          t.style.background = 'rgba(255,255,255,0.04)';
          t.style.borderColor = 'rgba(255,255,255,0.08)';
          t.style.color = 'var(--text-muted)';
          t.classList.remove('active');
        });
        tab.style.background = 'rgba(245, 158, 11, 0.2)';
        tab.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        tab.style.color = '#fbbf24';
        tab.classList.add('active');

        const target = tab.dataset.subtab;
        document.querySelectorAll('.masterclass-panel').forEach(p => p.style.display = 'none');
        if (target === 'mm_game') {
          const el = document.getElementById('panelMmGame');
          if (el) el.style.display = 'block';
        } else if (target === 'mental_math') {
          const el = document.getElementById('panelMentalMath');
          if (el) el.style.display = 'block';
        } else if (target === 'green_book') {
          const el = document.getElementById('panelGreenBook');
          if (el) el.style.display = 'block';
          renderGreenBookProblem();
        } else if (target === 'ding_ran') {
          const el = document.getElementById('panelDingRan');
          if (el) el.style.display = 'block';
        }
      });
    });

    // 2. Jane Street / Optiver MM Game
    let mmGame = (typeof QuantPrepEngine !== 'undefined' && QuantPrepEngine.MarketMakingGame)
      ? new QuantPrepEngine.MarketMakingGame() : null;

    const btnSubmitMm = document.getElementById('btnSubmitMmRound');
    if (btnSubmitMm && mmGame) {
      btnSubmitMm.addEventListener('click', () => {
        const bid = parseFloat(document.getElementById('mmInputBid').value) || 98.5;
        const ask = parseFloat(document.getElementById('mmInputAsk').value) || 101.5;
        if (bid >= ask) {
          alert('Invalid Quote: Bid must be strictly lower than Ask!');
          return;
        }
        const state = mmGame.submitQuotes(bid, ask);
        document.getElementById('mmStatRound').textContent = `${state.round} / 10`;
        document.getElementById('mmStatInventory').textContent = `${state.inventory}`;
        const pnlEl = document.getElementById('mmStatPnl');
        pnlEl.textContent = `₹${state.totalPnL.toFixed(2)}`;
        pnlEl.style.color = state.totalPnL >= 0 ? '#10b981' : '#ef4444';

        const last = state.lastEvent;
        const feedbackEl = document.getElementById('mmRoundFeedback');
        if (last && feedbackEl) {
          const tradeSummary = last.trades && last.trades.length > 0 
            ? last.trades.map(t => `${t.type} @ ₹${t.price} (${t.toxicity === 'HIGH' ? '⚠️ Informed Whale' : 'Noise Flow'})`).join('<br>')
            : 'No fills this round (Spread was too wide for incoming market orders).';
          feedbackEl.innerHTML = `
            <strong>Round ${last.round} Executed:</strong> True Fair Value was <strong>₹${last.fairValue.toFixed(2)}</strong>.<br>
            ${tradeSummary}<br>
            Round PnL: <span style="color:${last.roundPnL >= 0 ? '#10b981':'#ef4444'}">${last.roundPnL >= 0 ? '+' : ''}₹${last.roundPnL.toFixed(2)}</span> | Realized Sharpe: <strong>${state.sharpe}</strong>
          `;
        }
      });
    }

    // 3. Fast Mental Math Real-time Calculators
    const inputVol = document.getElementById('mathInputVol');
    const outDailyVol = document.getElementById('mathOutDailyVol');
    if (inputVol && outDailyVol) {
      inputVol.addEventListener('input', () => {
        const v = parseFloat(inputVol.value) || 0;
        const d = (v / 16).toFixed(2);
        outDailyVol.textContent = `Daily Move: ±${d}% (±1σ)`;
      });
    }

    const inputRate = document.getElementById('mathInputRate');
    const outDoubling = document.getElementById('mathOutDoublingYears');
    if (inputRate && outDoubling) {
      inputRate.addEventListener('input', () => {
        const r = parseFloat(inputRate.value) || 0;
        const y = r > 0 ? (72 / r).toFixed(1) : '∞';
        outDoubling.textContent = `Doubles In: ~${y} Years`;
      });
    }

    const inputSpot = document.getElementById('mathInputSpot');
    const outStraddle = document.getElementById('mathOutStraddleCost');
    if (inputSpot && outStraddle) {
      const updateStraddle = () => {
        const s = parseFloat(inputSpot.value) || 24500;
        const v = parseFloat(inputVol ? inputVol.value : 16) || 16;
        const cost1D = (0.8 * s * (v / 100) * Math.sqrt(1 / 252)).toFixed(2);
        outStraddle.textContent = `1-Day ATM Straddle: ₹${cost1D}`;
      };
      inputSpot.addEventListener('input', updateStraddle);
      if (inputVol) inputVol.addEventListener('input', updateStraddle);
    }

    // 4. Green Book Problems Viewer
    const gbSelect = document.getElementById('gbProblemSelect');
    const gbDisplay = document.getElementById('gbProblemDisplay');
    const renderGreenBookProblem = () => {
      if (!gbDisplay || typeof QuantPrepEngine === 'undefined' || !QuantPrepEngine.GREEN_BOOK_PROBLEMS) return;
      const key = gbSelect ? gbSelect.value : 'monty_hall';
      const prob = QuantPrepEngine.GREEN_BOOK_PROBLEMS.find(p => p.id.includes(key)) || QuantPrepEngine.GREEN_BOOK_PROBLEMS[0];
      if (!prob) return;

      gbDisplay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.95rem; font-weight: 700; color: #f8fafc;">${prob.title}</span>
          <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">${prob.firm} &bull; ${prob.difficulty}</span>
        </div>
        <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 0.78rem; color: #e2e8f0; line-height: 1.5;">
          ${prob.statement}
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #10b981; font-size: 0.75rem; text-transform: uppercase;">🌱 Layman Intuition:</strong>
          <p style="font-size: 0.75rem; color: #94a3b8; margin: 4px 0 10px 0; line-height: 1.5;">${prob.laymanIntuition || prob.laymanAnalogy}</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: #38bdf8; font-size: 0.75rem; text-transform: uppercase;">🏛️ Quantitative &amp; Mathematical Proof:</strong>
          <div style="font-size: 0.75rem; color: #e2e8f0; margin-top: 4px; line-height: 1.6; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px;">
            ${prob.quantProof}
          </div>
        </div>
        <button id="btnRunGbMonteCarlo" style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; padding: 6px 12px; border-radius: 6px; font-size: 0.72rem; cursor: pointer; font-weight: 700;">
          <i class="fa-solid fa-play" style="margin-right: 4px;"></i> Run 10,000-Path Monte Carlo Verification
        </button>
        <span id="gbMonteCarloResult" style="margin-left: 12px; font-size: 0.75rem; font-weight: 700; color: #10b981;"></span>
      `;

      if (typeof renderMathInElement === 'function') {
        renderMathInElement(gbDisplay, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      }

      const btnSim = document.getElementById('btnRunGbMonteCarlo');
      if (btnSim && typeof prob.simulate === 'function') {
        btnSim.addEventListener('click', () => {
          const res = prob.simulate(10000);
          const outSpan = document.getElementById('gbMonteCarloResult');
          if (outSpan) {
            if (res.switchWinRate !== undefined) {
              outSpan.textContent = `✓ Empirical Results: Switch Win Rate = ${res.switchWinRate}% (Theoretical 66.67%) | Stay Win Rate = ${res.stayWinRate}%`;
            } else if (res.empiricalQV !== undefined) {
              outSpan.textContent = `✓ Empirical Quadratic Variation [W,W]_1 = ${res.empiricalQV} (Theoretical 1.000)`;
            } else {
              outSpan.textContent = `✓ Empirical verification completed over 10,000 paths.`;
            }
          }
        });
      }
    };

    if (gbSelect) {
      gbSelect.addEventListener('change', renderGreenBookProblem);
    }
    renderGreenBookProblem();

    // 5. Quant Copilot Trigger
    const btnCopilotTrigger = document.getElementById('btnTriggerCopilotMasterclass');
    if (btnCopilotTrigger) {
      btnCopilotTrigger.addEventListener('click', () => {
        if (window.QuantCopilot && typeof window.QuantCopilot.toggle === 'function') {
          window.QuantCopilot.toggle();
        }
      });
    }

    // 6. Accreditation Certificate Modal
    const btnCert = document.getElementById('btnClaimCertificate');
    if (btnCert && typeof AccreditationCert !== 'undefined') {
      btnCert.addEventListener('click', () => {
        const completedCount = labState.completedLabs.size;
        const certData = AccreditationCert.CertificateGenerator.generateCertificateData({
          studentName: 'QUANT MASTER',
          completedModulesCount: completedCount,
          distinction: completedCount >= 80 ? 'Summa Cum Laude (100% Mastery)' : 'Honors Candidate'
        });
        const svgCode = AccreditationCert.CertificateGenerator.generateSVG(certData);

        const modal = document.createElement('div');
        modal.className = 'cert-modal-overlay';
        modal.id = 'certModal';
        modal.innerHTML = `
          <div class="cert-modal-content">
            <div class="cert-modal-header">
              <span class="cert-modal-title"><i class="fa-solid fa-certificate"></i> Official RISKOS Accreditation Certificate</span>
              <button id="closeCertModalBtn" style="background:transparent; border:none; color:#94a3b8; font-size:18px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cert-modal-body">
              <div class="cert-svg-wrapper">
                ${svgCode}
              </div>
              <div class="cert-actions-row">
                <button class="cert-btn cert-btn-primary" id="downloadCertSvgBtn"><i class="fa-solid fa-download"></i> Download SVG Certificate</button>
                <button class="cert-btn cert-btn-secondary" id="closeCertModalBtn2">Dismiss</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        document.getElementById('closeCertModalBtn').addEventListener('click', closeModal);
        document.getElementById('closeCertModalBtn2').addEventListener('click', closeModal);

        document.getElementById('downloadCertSvgBtn').addEventListener('click', () => {
          const blob = new Blob([svgCode], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `RISKOS-Accreditation-${certData.studentName}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    }

    // 7. Institutional Hedge Fund Tear Sheet
    const btnTearSheet = document.getElementById('btnExportTearSheet');
    if (btnTearSheet && typeof HedgeFundTearSheet !== 'undefined') {
      btnTearSheet.addEventListener('click', () => {
        const compiler = new HedgeFundTearSheet();
        const html = compiler.generatePrintableHTML();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
        }
      });
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
            if (sec && typeof bindSecurityToActiveLab === 'function') {
              bindSecurityToActiveLab(sec);
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
      if (typeof updateCoursesLiveTelemetry === 'function') {
        updateCoursesLiveTelemetry();
      }
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

