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
    
    if (categoryKey === 'growth') {
      return allMods.filter(m => ['cagr', 'compounding', 'sip_dca', 'lumpsum_vs_sip', 'compound_interest'].includes(m.id));
    }
    if (categoryKey === 'valuation') {
      return allMods.filter(m => ['pe_valuation', 'roe_roce'].includes(m.id));
    }
    if (categoryKey === 'risk') {
      return allMods.filter(m => ['volatility', 'beta_corr', 'sharpe', 'mdd', 'drawdown_recovery'].includes(m.id));
    }
    if (categoryKey === 'portfolio') {
      return allMods.filter(m => ['diversification', 'port_variance', 'capm', 'port_allocator', 'risk_return_scatter'].includes(m.id));
    }
    if (categoryKey === 'simulators') {
      return allMods.filter(m => ['sip_dca', 'lumpsum_vs_sip', 'compound_interest', 'port_allocator', 'risk_return_scatter', 'drawdown_recovery', 'scenario_stress'].includes(m.id));
    }
    if (categoryKey === 'mathematics') {
      return allMods.filter(m => ['cagr', 'compounding', 'volatility', 'beta_corr', 'sharpe', 'port_variance', 'capm'].includes(m.id));
    }
    
    return allMods.filter(m => m.categoryKey === categoryKey);
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

    if (eqDiv) eqDiv.innerHTML = res.equationLatex || '\\[ \\text{Formula} \\]';
    if (subDiv) subDiv.innerHTML = res.substitutedLatex || '\\[ \\text{Calculation} \\]';
    if (deepProofContent) {
      deepProofContent.innerHTML = `
        <p style="margin-top:0;"><strong>Model Spec:</strong> ${res.quantText || res.whatIsIt}</p>
        <p><strong>Interactive Variables &amp; Parameters:</strong></p>
        <ul style="margin:8px 0 0 16px;padding:0;color:var(--text-secondary);font-size:0.8rem;line-height:1.6;">
          ${Object.entries(labState.simInputs).map(([k, v]) => `<li><code style="color:var(--accent-cyan);">${k}</code> = <strong>${v}</strong></li>`).join('')}
        </ul>
      `;
    }

    // Trigger MathJax typesetting
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([eqDiv, subDiv, deepProofContent]).catch(() => {});
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

    // Build Chart datasets based on returned format
    let datasets = [];
    if (c.trajectory) {
      datasets.push({
        label: 'Growth Trajectory',
        data: c.trajectory,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 2
      });
    } else if (c.principalSeries && c.interestSeries) {
      datasets.push({
        label: 'Principal Invested',
        data: c.principalSeries,
        borderColor: '#71717a',
        backgroundColor: 'rgba(113, 113, 122, 0.2)',
        fill: true,
        tension: 0.1
      });
      datasets.push({
        label: 'Compound Interest Earned',
        data: c.totalSeries || c.interestSeries,
        borderColor: '#51CF66',
        backgroundColor: 'rgba(81, 207, 102, 0.15)',
        fill: true,
        tension: 0.3
      });
    } else if (c.investedSeries && c.wealthSeries) {
      datasets.push({
        label: 'Total Capital Contributed',
        data: c.investedSeries,
        borderColor: '#71717a',
        backgroundColor: 'rgba(113, 113, 122, 0.2)',
        fill: true
      });
      datasets.push({
        label: 'Accumulated Wealth',
        data: c.wealthSeries,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        fill: true,
        tension: 0.3
      });
    } else if (c.lumpsumWealth && c.sipWealth) {
      datasets.push({
        label: 'Lumpsum Strategy',
        data: c.lumpsumWealth,
        borderColor: '#FAB005',
        backgroundColor: 'transparent',
        tension: 0.2
      });
      datasets.push({
        label: 'DCA / SIP Strategy',
        data: c.sipWealth,
        borderColor: '#22d3ee',
        backgroundColor: 'transparent',
        tension: 0.2
      });
    } else if (c.pdf) {
      datasets.push({
        label: 'Probability Density (Normal Distribution)',
        data: c.pdf,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.12)',
        fill: true,
        tension: 0.4
      });
    } else if (c.stockLine && c.marketLine) {
      datasets.push({
        label: 'Stock Return Movement',
        data: c.stockLine,
        borderColor: '#22d3ee',
        tension: 0.2
      });
      datasets.push({
        label: 'Market Benchmark Movement',
        data: c.marketLine,
        borderColor: '#71717a',
        borderDash: [4, 4],
        tension: 0.2
      });
    } else if (c.drawdownCurve) {
      datasets.push({
        label: 'Underwater Drawdown (%)',
        data: c.drawdownCurve,
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        fill: true,
        tension: 0.2
      });
    } else if (c.weights) {
      // Doughnut Chart for Portfolio Allocation
      labState.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: c.labels,
          datasets: [{
            data: c.weights,
            backgroundColor: ['#22d3ee', '#51CF66', '#FAB005', '#CC5DE8', '#FF6B6B']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#a1a1aa', font: { size: 11 } } }
          }
        }
      });
      return;
    } else {
      datasets.push({
        label: 'Simulation Path',
        data: c.trajectory || [100, 120, 150, 190, 250],
        borderColor: '#22d3ee',
        tension: 0.2
      });
    }

    labState.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: c.labels || ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'],
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        plugins: {
          legend: {
            display: datasets.length > 1,
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
  const setupSecuritySearch = () => {
    const secInput = document.getElementById('simSecurityInput');
    if (!secInput || typeof SecurityMaster === 'undefined') return;

    let debounce = null;
    secInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      const q = e.target.value.trim();
      if (!q) return;

      debounce = setTimeout(async () => {
        const sec = await SecurityMaster.resolveSecurity(q);
        if (sec && (sec.basePrice || sec.price_inr)) {
          labState.activeSecuritySymbol = sec.symbol;
          const pr = sec.basePrice || sec.price_inr || 100;
          const pe = sec.pe || 25;
          const eps = pr / pe;
          const vol = (sec.vol || 0.18) * 100;

          const modId = labState.activeModuleId;
          if (modId === 'pe_valuation') {
            labState.simInputs.price = pr;
            labState.simInputs.eps = Number(eps.toFixed(2));
          } else if (modId === 'volatility') {
            labState.simInputs.dailyStdDev = Number((vol / Math.sqrt(252)).toFixed(2));
          } else if (modId === 'beta_corr') {
            labState.simInputs.assetVol = Number(vol.toFixed(1));
            labState.simInputs.correlation = 0.75;
          } else if (modId === 'cagr') {
            labState.simInputs.finalVal = pr * 1.5;
          }

          renderControlsPanel(LearnMathEngine.getModuleById(modId));
          evaluateActiveModule();
        }
      }, 200);
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
    }
  };

  const initLearnMarketRibbon = () => {
    const track = document.getElementById('learnRibbonTrack');
    if (!track || typeof SecurityMaster === 'undefined') return;

    const benchmarks = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT', '^GSPC', '^IXIC', 'USDINR', 'BRENT', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'NVDA', 'AAPL'];

    const renderRibbon = () => {
      track.innerHTML = benchmarks.map(sym => {
        const live = SecurityMaster._liveQuotes.get(sym);
        if (!live) return '';
        const chg = Number((live.price - live.previousClose).toFixed(2));
        const chgPct = Number(((chg / live.previousClose) * 100).toFixed(2));
        const isUp = chg >= 0;

        return `
          <div class="ribbon-item" data-symbol="${sym}" id="learn_ribbon_${sym.replace(/[\^=]/g, '')}">
            <span class="ribbon-symbol">${sym.replace('^', '')}</span>
            <span class="ribbon-price">${LearnMathEngine.formatMoney(live.price, live.currency, true)}</span>
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
        const cleanSym = u.symbol.replace(/[\^=]/g, '');
        const el = document.getElementById(`learn_ribbon_${cleanSym}`);
        if (el) {
          const pEl = el.querySelector('.ribbon-price');
          const cEl = el.querySelector('.ribbon-chg');
          if (pEl) {
            pEl.textContent = LearnMathEngine.formatMoney(u.price, u.currency, true);
            pEl.classList.remove('price-flash-up', 'price-flash-down');
            void pEl.offsetWidth;
            pEl.classList.add(u.delta >= 0 ? 'price-flash-up' : 'price-flash-down');
          }
          if (cEl) {
            cEl.textContent = `${u.change >= 0 ? '▲ +' : '▼ '}${u.changePercent.toFixed(2)}%`;
            cEl.className = `ribbon-chg ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
          }
        }
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

