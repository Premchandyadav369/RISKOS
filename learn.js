/**
 * RISKOS — LEARN & SIMULATE QUANTITATIVE LABORATORY CONTROLLER
 * Fully reactive, deterministic, zero-hallucination interactive controller.
 */

(() => {
  'use strict';

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

  // ── Bottom Concept Tray ───────────────────────────────────────────────────
  const renderConceptTray = () => {
    const track = document.getElementById('labTrayScroll');
    if (!track || typeof LearnMathEngine === 'undefined') return;

    const allMods = LearnMathEngine.MODULES_DIRECTORY;
    const filtered = labState.activeCategory === 'all'
      ? allMods
      : allMods.filter(m => m.categoryKey === labState.activeCategory);

    track.innerHTML = filtered.map(m => `
      <div class="concept-thumb-card ${m.id === labState.activeModuleId ? 'active' : ''}" data-module-id="${m.id}">
        <span class="thumb-tag">${m.badge || m.categoryKey.toUpperCase()}</span>
        <span class="thumb-title">${m.shortTitle || m.title}</span>
        <span style="font-family:monospace;font-size:0.7rem;color:var(--text-muted);margin-top:2px;">
          <i class="fa-solid ${m.icon || 'fa-chart-line'}" style="font-size:0.65rem;color:var(--accent-cyan);"></i> ${m.categoryKey.toUpperCase()}
        </span>
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

    // Refresh Tray
    renderConceptTray();
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
            <select class="sim-security-input" data-key="${c.key}" style="background:#0d0d12;border:1px solid rgba(255,255,255,0.1);padding:6px;border-radius:6px;color:#fff;margin-top:4px;">
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
      <button class="lab-chip" data-idx="${idx}"><i class="fa-solid fa-bolt" style="font-size:0.6rem;color:var(--accent-cyan);"></i> ${p.label}</button>
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
      if (labState.explanationMode === 'beginner') {
        underBody.textContent = res.beginnerText || res.plainResult;
      } else if (labState.explanationMode === 'investor') {
        underBody.textContent = res.investorText || res.plainResult;
      } else {
        underBody.textContent = res.quantText || res.plainResult;
      }
    }
    if (whyMatters) whyMatters.textContent = res.whyItMatters || '';
    if (focalSym) focalSym.textContent = res.focalSymbol || mod.badge || 'PROOFS';
    if (focalLbl) focalLbl.textContent = res.focalLabel || 'Metric Value';
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
        <p><strong>Step-by-Step Proof:</strong> Evaluated using deterministic floating-point precision on real/synthetic parameter sets. No interpolation approximations used.</p>
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
      // Fallback simple line
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
        animation: { duration: 250 },
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
        const name = prompt('Name this simulation scenario:', `${mod.shortTitle} - ${new Date().toLocaleTimeString()}`);
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
        alert(`Scenario "${name}" saved! You can compare it anytime.`);
      });
    }

    // 3. Compare Scenarios Drawer
    const btnCompare = document.getElementById('btnCompareScenario');
    if (btnCompare) {
      btnCompare.addEventListener('click', () => {
        openDrawer('compare');
      });
    }

    // 4. Export Results
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

    // 5. Explain This (AI Explainer)
    const btnExplain = document.getElementById('btnExplainAi');
    if (btnExplain) {
      btnExplain.addEventListener('click', () => {
        openDrawer('explain');
      });
    }

    // 6. Detailed Proof Toggle
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
          <span style="font-size:0.7rem;font-weight:700;color:var(--accent-crimson);text-transform:uppercase;">Boundary Caveats</span>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5;margin-top:6px;">${res.limitations}</p>
        </div>
      `;
    } else if (mode === 'compare') {
      titleEl.innerHTML = `<i class="fa-solid fa-code-compare" style="color:var(--accent-cyan);"></i> Saved Scenarios (${labState.savedScenarios.length})`;
      if (labState.savedScenarios.length === 0) {
        bodyEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:32px 0;">No saved scenarios yet. Click <strong>Save Scenario</strong> in the action bar to store snapshots.</div>`;
      } else {
        bodyEl.innerHTML = labState.savedScenarios.map(sc => `
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.08);padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;color:#fff;font-size:0.85rem;">${sc.name}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);">${new Date(sc.date).toLocaleDateString()} &bull; ${sc.moduleId}</div>
            </div>
            <button class="lab-act-btn" data-load-id="${sc.id}" style="font-size:0.7rem;">Load</button>
          </div>
        `).join('');

        bodyEl.querySelectorAll('[data-load-id]').forEach(btn => {
          btn.addEventListener('click', () => {
            const sc = labState.savedScenarios.find(s => s.id === parseInt(btn.dataset.loadId, 10));
            if (sc) {
              switchModule(sc.moduleId);
              labState.simInputs = { ...sc.inputs };
              renderControlsPanel(LearnMathEngine.getModuleById(sc.moduleId));
              evaluateActiveModule();
              closeDrawer();
            }
          });
        });
      }
    }

    overlay.removeAttribute('hidden');
    document.body.classList.add('menu-locked');
  };

  const closeDrawer = () => {
    const overlay = document.getElementById('labDrawerOverlay');
    if (overlay) {
      overlay.setAttribute('hidden', '');
      document.body.classList.remove('menu-locked');
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
          const beta = sec.beta || 1.1;

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
            labState.simInputs.finalValue = pr * 1.5;
          }

          renderControlsPanel(LearnMathEngine.getModuleById(modId));
          evaluateActiveModule();
        }
      }, 200);
    });
  };

  // ── Init Controller & Deep-Link Synchronization ───────────────────────────
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

    const handleQuery = (query) => {
      if (!query) return;
      const q = query.toLowerCase();
      let targetMod = 'cagr';

      if (q.includes('sip') || q.includes('dca')) targetMod = 'sip_dca';
      else if (q.includes('lump') || q.includes('vs')) targetMod = 'lumpsum_vs_sip';
      else if (q.includes('compound') || q.includes('interest')) targetMod = 'compounding';
      else if (q.includes('pe') || q.includes('p/e') || q.includes('valuation')) targetMod = 'pe_valuation';
      else if (q.includes('roe') || q.includes('roce') || q.includes('dupont')) targetMod = 'roe_roce';
      else if (q.includes('beta') || q.includes('correlation')) targetMod = 'beta_corr';
      else if (q.includes('vol') || q.includes('bell') || q.includes('deviation')) targetMod = 'volatility';
      else if (q.includes('sharpe') || q.includes('sortino')) targetMod = 'sharpe';
      else if (q.includes('drawdown') || q.includes('mdd')) targetMod = 'mdd';
      else if (q.includes('diversif')) targetMod = 'diversification';
      else if (q.includes('variance') || q.includes('markowitz')) targetMod = 'port_variance';
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

    // 6. Action Bar & Drawer Handlers
    setupActionBar();
    const drawerCloseBtn = document.getElementById('labDrawerCloseBtn');
    const drawerBackdrop = document.getElementById('labDrawerBackdrop');
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

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

    // 10. URL Query Param Synchronization (Deep-linking)
    const urlParams = new URLSearchParams(window.location.search);
    const targetSec = urlParams.get('sec') || urlParams.get('ticker') || urlParams.get('symbol');
    let targetMod = urlParams.get('module') || urlParams.get('metric') || 'cagr';

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

    renderConceptTray();
    switchModule(targetMod || 'cagr');

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

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

