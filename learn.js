/**
 * RISKOS Quantitative Learning & Simulation Laboratory Controller
 * Controls UI, reactivity, Chart.js visualizations, MathJax typesetting & scenario persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    activeTopicId: 'cagr',
    activeCategory: 'all',
    userMode: localStorage.getItem('riskos_user_mode') || 'beginner',
    currency: localStorage.getItem('riskos_currency') || 'INR',
    inputs: {},
    chartInstance: null,
    savedScenarios: JSON.parse(localStorage.getItem('riskos_lab_scenarios') || '[]')
  };

  // MathJax Typeset Helper
  const triggerMathJax = (element = null) => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      const targets = element ? [element] : [document.getElementById('labMainStage')];
      window.MathJax.typesetPromise(targets).catch((err) => console.warn('MathJax error:', err));
    }
  };

  // ── 1. URL Query Parameter Parser (Deep-Linking) ───────────────────────────
  const parseQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    if (topic && LearnMathEngine.getModuleById(topic)) {
      state.activeTopicId = topic;
    }

    const mode = params.get('mode');
    if (mode && ['beginner', 'investor', 'quant'].includes(mode)) {
      state.userMode = mode;
    }

    const curr = params.get('currency');
    if (curr && ['INR', 'USD'].includes(curr)) {
      state.currency = curr;
    }

    // Capture arbitrary input overrides (e.g. ?p=2984.50&eps=116.80)
    const activeMod = LearnMathEngine.getModuleById(state.activeTopicId);
    state.inputs = { ...activeMod.defaultInputs };

    activeMod.controls.forEach(ctrl => {
      if (params.has(ctrl.key)) {
        state.inputs[ctrl.key] = Number(params.get(ctrl.key));
      }
    });
  };

  // ── 2. Sidebar Topic Directory Renderer ────────────────────────────────────
  const renderSidebar = () => {
    const topicListEl = document.getElementById('topicList');
    if (!topicListEl) return;

    const query = (document.getElementById('labTopicSearch')?.value || '').toLowerCase().trim();
    const activeCat = state.activeCategory;

    const filtered = LearnMathEngine.MODULES_DIRECTORY.filter(mod => {
      const matchCat = activeCat === 'all' || mod.categoryKey === activeCat;
      const matchSearch = !query || 
        mod.title.toLowerCase().includes(query) || 
        mod.shortTitle.toLowerCase().includes(query) || 
        mod.category.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });

    topicListEl.innerHTML = filtered.map(mod => {
      const isActive = mod.id === state.activeTopicId;
      return `
        <button class="topic-item ${isActive ? 'active' : ''}" data-topic-id="${mod.id}">
          <div class="topic-item-left">
            <div class="topic-icon">
              <i class="fa-solid ${mod.icon}"></i>
            </div>
            <div class="topic-item-title">${mod.shortTitle}</div>
          </div>
          <span class="topic-tag">${mod.categoryKey.toUpperCase()}</span>
        </button>
      `;
    }).join('');

    topicListEl.querySelectorAll('.topic-item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectTopic(btn.dataset.topicId);
      });
    });

    document.getElementById('topicCountBadge').textContent = `${filtered.length} Modules`;
  };

  // ── 3. Topic Selection & Dynamic Input Controller ──────────────────────────
  const selectTopic = (topicId) => {
    state.activeTopicId = topicId;
    const mod = LearnMathEngine.getModuleById(topicId);
    state.inputs = { ...mod.defaultInputs };

    // Update URL without full refresh
    const url = new URL(window.location);
    url.searchParams.set('topic', topicId);
    window.history.replaceState({}, '', url);

    renderSidebar();
    renderSimulationStage();
  };

  // ── 4. Main Simulation Stage & 7-Step Pedagogical Renderer ──────────────────
  const renderSimulationStage = () => {
    const mod = LearnMathEngine.getModuleById(state.activeTopicId);
    if (!mod) return;

    // Header Banner
    document.getElementById('moduleCatPill').textContent = mod.category;
    document.getElementById('moduleBadgeTag').textContent = mod.badge;
    document.getElementById('moduleTitle').textContent = mod.title;

    // Execute Deterministic Math Calculation
    const result = mod.calc(state.inputs, state.currency);

    // Step 1: What is it?
    document.getElementById('stepWhatIsIt').textContent = 
      state.userMode === 'beginner' ? result.beginnerText :
      state.userMode === 'investor' ? result.investorText : result.quantText;
    
    document.getElementById('modeSpecificLabel').textContent = 
      state.userMode === 'beginner' ? 'Beginner Intuition & Plain Concept' :
      state.userMode === 'investor' ? 'Investor Decision Context & Rules of Thumb' : 'Quant Analytical Derivation & Limits';

    document.getElementById('stepModeText').textContent = 
      state.userMode === 'beginner' ? result.beginnerText :
      state.userMode === 'investor' ? result.investorText : result.quantText;

    document.getElementById('activeModeBadge').textContent = `Perspective: ${state.userMode.toUpperCase()}`;

    // Step 2: Why does it matter?
    document.getElementById('stepWhyMatters').textContent = result.investorText || result.beginnerText;

    // Step 4: Mathematical Formula
    document.getElementById('stepMathEquation').innerHTML = result.equationLatex;

    // Step 5: Actual Numeric Substitution
    document.getElementById('stepSubstitutedMath').innerHTML = result.substitutedLatex;

    // Step 6: Plain-English Result
    document.getElementById('stepPlainResult').textContent = result.plainResult;

    // Step 7: Limitations & Caveats
    document.getElementById('stepLimitations').textContent = result.limitations;

    // Step 3: Render Controls & Sliders
    renderControls(mod);

    // Render Visualizations
    renderChart(mod, result);

    // Trigger MathJax re-render
    triggerMathJax();
  };

  // ── 5. Render Interactive Controls & Sliders ───────────────────────────────
  const renderControls = (mod) => {
    const wrapper = document.getElementById('simControlsWrapper');
    const presetsGroup = document.getElementById('presetPillsGroup');
    if (!wrapper || !presetsGroup) return;

    // Render Preset Chips
    presetsGroup.innerHTML = (mod.presets || []).map((p, idx) => `
      <button class="preset-btn" data-preset-idx="${idx}">${p.label}</button>
    `).join('');

    presetsGroup.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = mod.presets[btn.dataset.presetIdx];
        if (p) {
          state.inputs = { ...p.inputs };
          renderSimulationStage();
        }
      });
    });

    // Render Sliders & Inputs
    wrapper.innerHTML = mod.controls.map(ctrl => {
      const val = state.inputs[ctrl.key] !== undefined ? state.inputs[ctrl.key] : ctrl.default;
      let displayVal = val;
      if (ctrl.type === 'currency') displayVal = LearnMathEngine.formatMoney(val, state.currency, true);
      else if (ctrl.type === 'percent') displayVal = `${val}%`;

      if (ctrl.type === 'select') {
        return `
          <div class="control-field-row">
            <div class="control-label-row">
              <span>${ctrl.label}</span>
            </div>
            <select class="lab-select" data-key="${ctrl.key}">
              ${ctrl.options.map(opt => `
                <option value="${opt.val}" ${opt.val == val ? 'selected' : ''}>${opt.text}</option>
              `).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div class="control-field-row">
          <div class="control-label-row">
            <span>${ctrl.label}</span>
            <span class="control-val-display" id="disp_${ctrl.key}">${displayVal}</span>
          </div>
          <input 
            type="range" 
            class="lab-slider" 
            data-key="${ctrl.key}"
            min="${ctrl.min}" 
            max="${ctrl.max}" 
            step="${ctrl.step}" 
            value="${val}" 
          />
        </div>
      `;
    }).join('');

    // Attach real-time slider listeners
    wrapper.querySelectorAll('.lab-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        const numVal = parseFloat(e.target.value);
        state.inputs[key] = numVal;

        const ctrl = mod.controls.find(c => c.key === key);
        const disp = document.getElementById(`disp_${key}`);
        if (disp && ctrl) {
          if (ctrl.type === 'currency') disp.textContent = LearnMathEngine.formatMoney(numVal, state.currency, true);
          else if (ctrl.type === 'percent') disp.textContent = `${numVal}%`;
          else disp.textContent = numVal;
        }

        // Live calculation and MathJax re-render
        const result = mod.calc(state.inputs, state.currency);
        document.getElementById('stepSubstitutedMath').innerHTML = result.substitutedLatex;
        document.getElementById('stepPlainResult').textContent = result.plainResult;
        triggerMathJax(document.getElementById('stepSubstitutedMath'));
        renderChart(mod, result);
      });
    });

    wrapper.querySelectorAll('.lab-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        state.inputs[key] = isNaN(e.target.value) ? e.target.value : parseFloat(e.target.value);
        renderSimulationStage();
      });
    });
  };

  // ── 6. Dynamic Chart.js Visualization Engine ───────────────────────────────
  const renderChart = (mod, result) => {
    const canvas = document.getElementById('labChartCanvas');
    if (!canvas) return;

    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    const badge = document.getElementById('chartTypeBadge');

    // Chart customization based on module ID
    if (mod.id === 'cagr' || mod.id === 'compounding' || mod.id === 'compound_timeline' || mod.id === 'sip_dca' || mod.id === 'lumpsum_sip') {
      badge.textContent = 'Growth Trajectory';
      const cData = result.chart || {};
      
      const datasets = [];
      if (cData.trajectory) {
        datasets.push({
          label: 'Compounded Portfolio Value',
          data: cData.trajectory,
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5
        });
      } else if (cData.wealthSeries) {
        datasets.push({
          label: 'Total Accumulated Wealth',
          data: cData.wealthSeries,
          borderColor: '#51CF66',
          backgroundColor: 'rgba(81, 207, 102, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5
        });
        datasets.push({
          label: 'Total Out-of-Pocket Invested',
          data: cData.investedSeries,
          borderColor: '#71717a',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.1,
          borderWidth: 1.8
        });
      } else if (cData.lumpsumTrajectory) {
        datasets.push({
          label: 'Lumpsum Strategy Trajectory',
          data: cData.lumpsumTrajectory,
          borderColor: '#4F8FFF',
          borderWidth: 2.2,
          tension: 0.3
        });
        datasets.push({
          label: 'SIP / DCA Strategy Trajectory',
          data: cData.sipTrajectory,
          borderColor: '#FAB005',
          borderWidth: 2.2,
          tension: 0.3
        });
      } else if (cData.nominalSeries) {
        datasets.push({
          label: 'Nominal Portfolio Corpus',
          data: cData.nominalSeries,
          borderColor: '#22d3ee',
          borderWidth: 2.2,
          tension: 0.3
        });
        datasets.push({
          label: 'Inflation-Adjusted Real Value',
          data: cData.realSeries,
          borderColor: '#FAB005',
          borderDash: [4, 4],
          borderWidth: 2,
          tension: 0.3
        });
      }

      state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: cData.labels || [],
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#ffffff', font: { family: 'Inter', size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${LearnMathEngine.formatMoney(ctx.parsed.y, state.currency, true)}`
              }
            }
          },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717a' } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717a' } }
          }
        }
      });

    } else if (mod.id === 'volatility') {
      badge.textContent = 'Normal Distribution Density';
      const bell = (result.chart && result.chart.bellCurve) || [];

      state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: bell.map(p => `${p.x}%`),
          datasets: [{
            label: 'Normal Return Density PDF',
            data: bell.map(p => p.y),
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717a', maxTicksLimit: 8 } },
            y: { display: false }
          }
        }
      });

    } else if (mod.id === 'port_allocator') {
      badge.textContent = 'Asset Allocation Weights';
      const c = result.chart || {};

      state.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: c.labels || [],
          datasets: [{
            data: c.weights || [],
            backgroundColor: c.colors || ['#4F8FFF', '#51CF66', '#FAB005', '#71717a'],
            borderWidth: 1,
            borderColor: '#09090c'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#fff', font: { family: 'Inter' } } }
          }
        }
      });

    } else {
      // Bar Chart for Sharpe, Beta, CAPM, ROE, Stress testing, etc.
      badge.textContent = 'Comparative Metrics';
      const c = result.chart || {};
      const labels = c.metrics || c.categories || c.scenarios || c.assets || c.labels || ['Metric'];
      const dataValues = c.values || c.asset || c.impacts || c.volTrajectory || [10];

      state.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Value',
            data: dataValues,
            backgroundColor: dataValues.map(v => v >= 0 ? 'rgba(34, 211, 238, 0.65)' : 'rgba(255, 107, 107, 0.65)'),
            borderColor: dataValues.map(v => v >= 0 ? '#22d3ee' : '#FF6B6B'),
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717a' } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717a' } }
          }
        }
      });
    }
  };

  // ── 7. Mode & Currency Toggle Controllers ──────────────────────────────────
  const setMode = (newMode) => {
    state.userMode = newMode;
    document.body.dataset.userMode = newMode;
    localStorage.setItem('riskos_user_mode', newMode);
    document.querySelectorAll('#labModePill .mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });
    renderSimulationStage();
  };

  const setCurrency = (newCurr) => {
    state.currency = newCurr;
    localStorage.setItem('riskos_currency', newCurr);
    document.querySelectorAll('#labCurrencyBtn .curr-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.curr === newCurr);
    });
    renderSimulationStage();
  };

  document.querySelectorAll('#labModePill .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  document.querySelectorAll('#labCurrencyBtn .curr-btn').forEach(btn => {
    btn.addEventListener('click', () => setCurrency(btn.dataset.curr));
  });

  // Search Filter Handler
  const searchInput = document.getElementById('labTopicSearch');
  if (searchInput) {
    searchInput.addEventListener('input', renderSidebar);
  }

  // Category Filter Chips
  document.querySelectorAll('#categoryFilterBar .cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#categoryFilterBar .cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.category;
      renderSidebar();
    });
  });

  // Reset Button
  const resetBtn = document.getElementById('btnResetDefaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const mod = LearnMathEngine.getModuleById(state.activeTopicId);
      state.inputs = { ...mod.defaultInputs };
      renderSimulationStage();
    });
  }

  // ── 8. Scenario Save & Comparison Drawer ───────────────────────────────────
  const updateComparisonDrawer = () => {
    const drawer = document.getElementById('comparisonDrawer');
    const countEl = document.getElementById('savedCount');
    if (!drawer || !countEl) return;

    countEl.textContent = state.savedScenarios.length;
    drawer.classList.toggle('open', state.savedScenarios.length > 0);
  };

  const saveScenarioBtn = document.getElementById('btnSaveScenario');
  if (saveScenarioBtn) {
    saveScenarioBtn.addEventListener('click', () => {
      const mod = LearnMathEngine.getModuleById(state.activeTopicId);
      const res = mod.calc(state.inputs, state.currency);
      const scenario = {
        id: Date.now(),
        topicId: mod.id,
        topicTitle: mod.shortTitle,
        timestamp: new Date().toLocaleTimeString(),
        currency: state.currency,
        inputs: { ...state.inputs },
        resultText: res.plainResult
      };

      state.savedScenarios.push(scenario);
      localStorage.setItem('riskos_lab_scenarios', JSON.stringify(state.savedScenarios));
      updateComparisonDrawer();

      saveScenarioBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Saved!</span>';
      setTimeout(() => {
        saveScenarioBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> <span>Save Scenario</span>';
      }, 1500);
    });
  }

  const clearSavedBtn = document.getElementById('btnClearSaved');
  if (clearSavedBtn) {
    clearSavedBtn.addEventListener('click', () => {
      state.savedScenarios = [];
      localStorage.removeItem('riskos_lab_scenarios');
      updateComparisonDrawer();
    });
  }

  // Comparison Modal
  const compareModal = document.getElementById('compareModalOverlay');
  const openCompareBtn = document.getElementById('btnOpenCompareModal');
  const closeCompareBtn = document.getElementById('btnCloseCompareModal');

  if (openCompareBtn && compareModal) {
    openCompareBtn.addEventListener('click', () => {
      const body = document.getElementById('compareModalBody');
      if (!body) return;

      if (state.savedScenarios.length < 2) {
        body.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:20px;">Please save at least 2 scenarios to compare them side-by-side.</div>`;
      } else {
        body.innerHTML = state.savedScenarios.slice(-2).map((sc, i) => `
          <div style="background:#09090c;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
            <div style="display:flex;justify-content:space-between;color:var(--accent-cyan);font-weight:700;font-size:0.85rem;margin-bottom:8px;">
              <span>Scenario ${i + 1}: ${sc.topicTitle}</span>
              <span style="color:#71717a;font-size:0.75rem;">${sc.timestamp}</span>
            </div>
            <div style="font-size:0.8rem;color:#fff;line-height:1.5;margin-bottom:10px;">${sc.resultText}</div>
            <div style="font-size:0.75rem;color:#aaa;background:rgba(255,255,255,0.03);padding:8px;border-radius:6px;">
              <strong style="color:#fff;">Inputs:</strong> ${Object.entries(sc.inputs).map(([k, v]) => `${k}=${v}`).join(', ')}
            </div>
          </div>
        `).join('');
      }
      compareModal.removeAttribute('hidden');
    });
  }

  if (closeCompareBtn && compareModal) {
    closeCompareBtn.addEventListener('click', () => compareModal.setAttribute('hidden', ''));
  }

  // ── 9. Export Report Modal ─────────────────────────────────────────────────
  const exportModal = document.getElementById('exportModalOverlay');
  const btnExport = document.getElementById('btnExportReport');
  const btnCloseExport = document.getElementById('btnCloseExportModal');
  const btnCopyReport = document.getElementById('btnCopyReport');
  const btnDownloadReport = document.getElementById('btnDownloadReport');

  if (btnExport && exportModal) {
    btnExport.addEventListener('click', () => {
      const mod = LearnMathEngine.getModuleById(state.activeTopicId);
      const res = mod.calc(state.inputs, state.currency);

      const report = `═══════════════════════════════════════════════════════════════
RISKOS QUANTITATIVE SIMULATION REPORT
Module: ${mod.title} (${mod.badge})
Generated: ${new Date().toISOString()}
Currency: ${state.currency} | Mode: ${state.userMode.toUpperCase()}
═══════════════════════════════════════════════════════════════

1. CONCEPT & DEFINITION:
${state.userMode === 'beginner' ? res.beginnerText : state.userMode === 'investor' ? res.investorText : res.quantText}

2. INPUT PARAMETERS:
${Object.entries(state.inputs).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

3. MATHEMATICAL SPECIFICATION:
Formula: ${res.equationLatex.replace(/\\\[|\\\]/g, '')}
Evaluated: ${res.substitutedLatex.replace(/\\\[|\\\]/g, '')}

4. PLAIN-ENGLISH TAKEAWAY:
${res.plainResult}

5. MODEL LIMITATIONS & CAVEATS:
${res.limitations}

═══════════════════════════════════════════════════════════════
Deterministic Calculation Engine • RISKOS Lab v3.0
═══════════════════════════════════════════════════════════════`;

      document.getElementById('exportReportText').value = report;
      exportModal.removeAttribute('hidden');
    });
  }

  if (btnCloseExport && exportModal) {
    btnCloseExport.addEventListener('click', () => exportModal.setAttribute('hidden', ''));
  }

  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', () => {
      const txt = document.getElementById('exportReportText').value;
      navigator.clipboard.writeText(txt);
      btnCopyReport.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => {
        btnCopyReport.innerHTML = '<i class="fa-regular fa-copy"></i> Copy to Clipboard';
      }, 1500);
    });
  }

  if (btnDownloadReport) {
    btnDownloadReport.addEventListener('click', () => {
      const txt = document.getElementById('exportReportText').value;
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `RISKOS_Report_${state.activeTopicId}_${Date.now()}.txt`;
      a.click();
    });
  }

  // ── 10. Initial Boot & URL Dispatch ────────────────────────────────────────
  parseQueryParams();
  setMode(state.userMode);
  setCurrency(state.currency);
  renderSidebar();
  renderSimulationStage();
  updateComparisonDrawer();

});
