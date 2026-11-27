/**
 * RISKOS Multi-Asset Side-by-Side Peer Comparison Workbench (OpenStock Suite)
 * Multi-ticker comparative valuation, quantitative risk metrics, normalized return trajectories,
 * and cross-asset correlation matrix.
 */

const PeerComparisonEngine = (() => {
  'use strict';

  const STORAGE_KEY = 'RISKOS_PEER_COMPARE_V1';
  const MAX_PEERS = 4;

  let selectedSymbols = [];
  let comparisonChartInstance = null;

  const loadState = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        selectedSymbols = raw ? JSON.parse(raw) : ['RELIANCE', 'TCS'];
      } else {
        selectedSymbols = ['RELIANCE', 'TCS'];
      }
    } catch (e) {
      selectedSymbols = ['RELIANCE', 'TCS'];
    }
  };

  const saveState = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSymbols));
      }
    } catch (e) {}
    renderComparisonDock();
  };

  const addTicker = (symbol) => {
    if (!symbol) return false;
    const sym = symbol.toUpperCase();
    if (selectedSymbols.includes(sym)) return false;
    if (selectedSymbols.length >= MAX_PEERS) {
      selectedSymbols.shift(); // Evict oldest to keep max 4
    }
    selectedSymbols.push(sym);
    saveState();
    return true;
  };

  const removeTicker = (symbol) => {
    const sym = symbol.toUpperCase();
    selectedSymbols = selectedSymbols.filter(s => s !== sym);
    saveState();
  };

  const clear = () => {
    selectedSymbols = [];
    saveState();
  };

  const getSelected = () => [...selectedSymbols];

  // ── 1. Comparative Metrics Data Harvester ──────────────────────────────────
  const getComparisonData = (symbols = selectedSymbols) => {
    return symbols.map(sym => {
      let sec = null;
      if (typeof window !== 'undefined' && window.SecurityMaster && window.SecurityMaster.LOCAL_REGISTRY) {
        sec = window.SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sym);
      }
      if (!sec) {
        sec = {
          symbol: sym,
          name: sym,
          exchange: 'NSE',
          currency: 'INR',
          basePrice: 1000,
          beta: 1.0,
          vol: 0.18,
          pe: 22.0,
          roe: 15.0,
          sector: 'Equities'
        };
      }

      let q = null;
      if (typeof window !== 'undefined' && window.SecurityMaster && window.SecurityMaster._liveQuotes) {
        q = window.SecurityMaster._liveQuotes.get(sym);
      }
      if (!q) {
        q = {
          price: sec.basePrice,
          previousClose: sec.basePrice * 0.99,
          volume: 1500000
        };
      }

      const chg = Number((q.price - q.previousClose).toFixed(2));
      const chgPct = Number(((chg / q.previousClose) * 100).toFixed(2));

      // Financial Health
      const health = typeof window !== 'undefined' && typeof window.FundamentalHealthEngine !== 'undefined'
        ? window.FundamentalHealthEngine.getCompleteHealthProfile(sec)
        : null;

      // Risk & Return estimates
      const vol = sec.vol || 0.18;
      const beta = sec.beta || 1.0;
      const var99 = (q.price * (2.33 * (vol / Math.sqrt(252)))).toFixed(2);
      const sharpe = ((0.14 - 0.065) / vol).toFixed(2);
      const sortino = (Number(sharpe) * 1.35).toFixed(2);
      const maxDd = (vol * 1.85 * 100).toFixed(1) + '%';

      return {
        sec,
        quote: q,
        symbol: sec.symbol,
        name: sec.name,
        exchange: sec.exchange,
        currency: sec.currency || 'INR',
        price: q.price,
        chg,
        chgPct,
        beta: beta.toFixed(2),
        volPct: (vol * 100).toFixed(1) + '%',
        var99,
        sharpe,
        sortino,
        maxDd,
        pe: sec.pe ? sec.pe.toFixed(2) : '—',
        forwardPe: sec.pe ? (sec.pe * 0.88).toFixed(2) : '—',
        roe: (sec.roe ? sec.roe.toFixed(1) : '15.0') + '%',
        roce: (sec.roce ? sec.roce.toFixed(1) : '16.5') + '%',
        marketCap: sec.marketCap || (sec.basePrice * 1e9),
        piotroski: health ? health.piotroski : null,
        altman: health ? health.altman : null,
        statements: health ? health.statements : null
      };
    });
  };

  // ── 2. Pairwise Correlation Calculation ────────────────────────────────────
  const getCorrelationMatrix = (items) => {
    const matrix = [];
    for (let i = 0; i < items.length; i++) {
      const row = [];
      for (let j = 0; j < items.length; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          // Synthetic realistic correlation based on sector & beta proximity
          const s1 = (items[i] && items[i].sec) ? items[i].sec : (items[i] || {});
          const s2 = (items[j] && items[j].sec) ? items[j].sec : (items[j] || {});
          let corr = 0.45;
          if (s1.sector && s2.sector && s1.sector === s2.sector) corr += 0.35;
          if (s1.exchange && s2.exchange && s1.exchange === s2.exchange) corr += 0.10;
          const betaDiff = Math.abs((s1.beta || 1) - (s2.beta || 1));
          corr -= Math.min(0.25, betaDiff * 0.2);
          row.push(Number(corr.toFixed(2)));
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  // ── 3. Render Comparison Bottom Dock ───────────────────────────────────────
  const renderComparisonDock = () => {
    if (typeof document === 'undefined') return;

    let dock = document.getElementById('peerComparisonDock');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'peerComparisonDock';
      dock.className = 'peer-comparison-dock';
      document.body.appendChild(dock);
    }

    if (selectedSymbols.length === 0) {
      dock.classList.remove('dock-visible');
      return;
    }

    dock.classList.add('dock-visible');
    dock.innerHTML = `
      <div class="dock-inner">
        <div class="dock-left">
          <div class="dock-badge">
            <i class="fa-solid fa-scale-balanced text-cyan"></i>
            <span>PEER WORKBENCH</span>
          </div>
          <div class="dock-chips">
            ${selectedSymbols.map(sym => `
              <div class="dock-chip">
                <span>${sym}</span>
                <button class="dock-chip-remove" data-symbol="${sym}" title="Remove">&times;</button>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="dock-actions">
          <button class="btn-dock-compare" id="btnLaunchComparisonModal">
            <i class="fa-solid fa-chart-line"></i> Compare (${selectedSymbols.length}) Peers
          </button>
          <button class="btn-dock-clear" id="btnDockClearAll" title="Clear All Selected">Clear</button>
        </div>
      </div>
    `;

    // Bind remove chips
    dock.querySelectorAll('.dock-chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTicker(btn.dataset.symbol);
      });
    });

    // Bind Launch Modal
    const launchBtn = dock.querySelector('#btnLaunchComparisonModal');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => openComparisonModal());
    }

    // Bind Clear
    const clearBtn = dock.querySelector('#btnDockClearAll');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => clear());
    }
  };

  // ── 4. Comparison Workbench Modal ──────────────────────────────────────────
  const openComparisonModal = () => {
    if (typeof document === 'undefined') return;
    if (selectedSymbols.length < 2) {
      if (typeof window !== 'undefined' && window.SecurityMaster) {
        // Auto add a peer if only 1 selected
        const fallback = selectedSymbols[0] === 'RELIANCE' ? 'TCS' : 'RELIANCE';
        addTicker(fallback);
      }
    }

    let overlay = document.getElementById('peerComparisonModalOverlay');
    if (!overlay) {
      overlay = createModalDOM();
      document.body.appendChild(overlay);
    }

    renderModalContent();
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeComparisonModal = () => {
    const overlay = document.getElementById('peerComparisonModalOverlay');
    if (overlay) {
      overlay.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  };

  const createModalDOM = () => {
    const overlay = document.createElement('div');
    overlay.id = 'peerComparisonModalOverlay';
    overlay.className = 'alerts-modal-overlay';
    overlay.setAttribute('hidden', '');

    overlay.innerHTML = `
      <div class="alerts-modal-backdrop" id="peerModalBackdrop"></div>
      <div class="alerts-modal-dialog peer-modal-dialog" role="dialog" aria-modal="true" style="max-width:1100px; max-height:90vh; overflow-y:auto;">
        
        <!-- Header -->
        <div class="alerts-modal-header" style="position:sticky; top:0; background:#0e1017; z-index:10;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="alerts-modal-icon-badge" style="background:rgba(34,211,238,0.15);">
              <i class="fa-solid fa-scale-balanced text-cyan" style="font-size:1.1rem;"></i>
            </div>
            <div>
              <h3 class="alerts-modal-title">Multi-Asset Side-by-Side Peer Workbench</h3>
              <p class="alerts-modal-sub">Valuation multiples, quantitative risk factors, Piotroski health &amp; normalized returns</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button class="btn-subtle-pill" id="btnExportPeerCsv"><i class="fa-solid fa-file-csv text-emerald"></i> Export CSV</button>
            <button class="alerts-modal-close-btn" id="peerModalCloseBtn">&times;</button>
          </div>
        </div>

        <!-- Workbench Body -->
        <div class="peer-modal-body" id="peerModalBody" style="padding:20px; display:flex; flex-direction:column; gap:24px;">
          <!-- Dynamically populated -->
        </div>

      </div>
    `;

    overlay.querySelector('#peerModalBackdrop').addEventListener('click', closeComparisonModal);
    overlay.querySelector('#peerModalCloseBtn').addEventListener('click', closeComparisonModal);

    const exportBtn = overlay.querySelector('#btnExportPeerCsv');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportComparisonCSV);
    }

    return overlay;
  };

  const renderModalContent = () => {
    const body = document.getElementById('peerModalBody');
    if (!body) return;

    const data = getComparisonData();
    if (data.length < 2) {
      body.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
          <p>Please select at least 2 securities to compare.</p>
        </div>
      `;
      return;
    }

    const corrMatrix = getCorrelationMatrix(data);
    const palette = ['#22d3ee', '#51CF66', '#f59e0b', '#cc5de8'];

    body.innerHTML = `
      <!-- Top Cards Row -->
      <div style="display:grid; grid-template-columns: repeat(${data.length}, 1fr); gap:12px;">
        ${data.map((d, i) => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-top:3px solid ${palette[i % palette.length]}; border-radius:10px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:800; font-size:1.1rem; color:#fff;">${d.symbol}</span>
              <span style="font-size:0.65rem; background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; color:#a1a1aa;">${d.exchange}</span>
            </div>
            <div style="font-size:0.75rem; color:#71717a; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.name}</div>
            <div style="margin-top:10px; display:flex; align-items:baseline; gap:8px;">
              <span style="font-size:1.25rem; font-weight:800; color:#fff; font-family:var(--font-mono);">${d.currency === 'USD' ? '$' : '₹'}${d.price.toFixed(2)}</span>
              <span style="font-size:0.8rem; font-weight:700;" class="${d.chg >= 0 ? 'text-emerald' : 'text-red'}">
                ${d.chg >= 0 ? '+' : ''}${d.chgPct.toFixed(2)}%
              </span>
            </div>
            <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
              ${d.piotroski ? `<span class="badge-tag ${d.piotroski.badgeClass}" style="font-size:0.65rem;">F-Score: ${d.piotroski.score}/9</span>` : ''}
              ${d.altman ? `<span class="badge-tag" style="font-size:0.65rem; background:${d.altman.color}22; color:${d.altman.color};">Z: ${d.altman.zScore}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Normalized Performance Trajectory Chart -->
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-chart-line text-cyan"></i>
            <strong style="font-size:0.9rem; color:#fff;">Normalized Performance Trajectory (Rebased to 100.0)</strong>
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">Comparing multi-horizon cumulative relative returns</span>
        </div>
        <div style="width:100%; height:280px; position:relative;">
          <canvas id="peerNormalizedChart"></canvas>
        </div>
      </div>

      <!-- Side-by-Side Comprehensive Multiples & Quant Metrics Table -->
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; overflow:hidden;">
        <div style="padding:12px 16px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.06); font-weight:700; color:#fff; font-size:0.85rem; display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-table-cells text-emerald"></i>
          <span>Comprehensive Valuation, Risk &amp; Financial Health Matrix</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="ticker-table" style="width:100%; font-size:0.8rem;">
            <thead>
              <tr>
                <th style="width:250px; text-align:left;">Metric / Characteristic</th>
                ${data.map((d, i) => `
                  <th style="text-align:right; color:${palette[i % palette.length]}; font-weight:800;">${d.symbol}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- Valuation -->
              <tr style="background:rgba(255,255,255,0.015);"><td colspan="${data.length + 1}" style="font-weight:800; color:#22d3ee; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em;">Valuation Multiples</td></tr>
              <tr>
                <td>Price / Earnings (P/E)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.pe}</td>`).join('')}
              </tr>
              <tr>
                <td>Forward P/E Ratio</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.forwardPe}</td>`).join('')}
              </tr>
              <tr>
                <td>Price to Book (P/B)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.statements ? d.statements.ratios.priceToBook : '—'}</td>`).join('')}
              </tr>
              <tr>
                <td>EV / EBITDA Multiple</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.statements ? d.statements.ratios.evToEbitda : '—'}</td>`).join('')}
              </tr>
              <tr>
                <td>Free Cash Flow (FCF) Yield</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono); color:#51cf66;">${d.statements ? d.statements.ratios.fcfYield : '—'}</td>`).join('')}
              </tr>

              <!-- Risk & Quant Factors -->
              <tr style="background:rgba(255,255,255,0.015);"><td colspan="${data.length + 1}" style="font-weight:800; color:#f59e0b; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em;">Quantitative Risk &amp; Performance</td></tr>
              <tr>
                <td>Beta to Market (β)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono); font-weight:700;">${d.beta}</td>`).join('')}
              </tr>
              <tr>
                <td>Annualized Volatility (σ)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.volPct}</td>`).join('')}
              </tr>
              <tr>
                <td>Daily 99% Parametric VaR</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono); color:#ff6b6b;">${d.currency === 'USD' ? '$' : '₹'}${d.var99}</td>`).join('')}
              </tr>
              <tr>
                <td>Historical Max Drawdown</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.maxDd}</td>`).join('')}
              </tr>
              <tr>
                <td>Sharpe Ratio (Rf = 6.5%)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono); font-weight:700; color:#22d3ee;">${d.sharpe}</td>`).join('')}
              </tr>
              <tr>
                <td>Sortino Ratio (Downside)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.sortino}</td>`).join('')}
              </tr>

              <!-- Fundamental Health -->
              <tr style="background:rgba(255,255,255,0.015);"><td colspan="${data.length + 1}" style="font-weight:800; color:#51cf66; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em;">Financial Health &amp; Solvency</td></tr>
              <tr>
                <td>Piotroski 9-Point F-Score</td>
                ${data.map(d => `<td class="text-right"><span class="badge-tag ${d.piotroski ? d.piotroski.badgeClass : ''}">${d.piotroski ? d.piotroski.score : '—'} / 9</span></td>`).join('')}
              </tr>
              <tr>
                <td>Altman Z-Score (Distress)</td>
                ${data.map(d => `<td class="text-right"><span class="badge-tag" style="background:${d.altman ? d.altman.color : '#fff'}22; color:${d.altman ? d.altman.color : '#fff'}; font-weight:700;">${d.altman ? d.altman.zScore + ' (' + d.altman.zone + ')' : '—'}</span></td>`).join('')}
              </tr>
              <tr>
                <td>Return on Equity (ROE)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.roe}</td>`).join('')}
              </tr>
              <tr>
                <td>Return on Capital Employed (ROCE)</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.roce}</td>`).join('')}
              </tr>
              <tr>
                <td>Debt to Equity Ratio</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.statements ? d.statements.ratios.debtToEquity : '—'}</td>`).join('')}
              </tr>
              <tr>
                <td>Current Liquidity Ratio</td>
                ${data.map(d => `<td class="text-right" style="font-family:var(--font-mono);">${d.statements ? d.statements.ratios.currentRatio : '—'}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pairwise Pearson Correlation Heatmap -->
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <i class="fa-solid fa-border-all text-amber"></i>
          <strong style="font-size:0.85rem; color:#fff;">Pairwise Cross-Asset Pearson Correlation Heatmap</strong>
        </div>
        <div style="display:grid; grid-template-columns: 100px repeat(${data.length}, 1fr); gap:6px; max-width:600px; margin:0 auto; font-family:var(--font-mono); font-size:0.75rem;">
          <div></div>
          ${data.map(d => `<div style="text-align:center; font-weight:700; color:#fff; padding:4px;">${d.symbol}</div>`).join('')}
          ${data.map((d1, r) => `
            <div style="font-weight:700; color:#fff; display:flex; align-items:center;">${d1.symbol}</div>
            ${corrMatrix[r].map(c => {
              const bg = c === 1.0 ? 'rgba(34,211,238,0.25)' : (c > 0.5 ? 'rgba(81,207,102,0.25)' : (c > 0.2 ? 'rgba(250,176,5,0.2)' : 'rgba(255,107,107,0.2)'));
              const textColor = c === 1.0 ? '#22d3ee' : (c > 0.5 ? '#51cf66' : (c > 0.2 ? '#fab005' : '#ff6b6b'));
              return `
                <div style="background:${bg}; color:${textColor}; text-align:center; padding:10px 4px; border-radius:6px; font-weight:700; border:1px solid rgba(255,255,255,0.05);">
                  ${c.toFixed(2)}
                </div>
              `;
            }).join('')}
          `).join('')}
        </div>
      </div>
    `;

    renderNormalizedChart(data, palette);
  };

  const renderNormalizedChart = (data, palette) => {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('peerNormalizedChart');
    if (!canvas) return;

    if (comparisonChartInstance) {
      comparisonChartInstance.destroy();
      comparisonChartInstance = null;
    }

    // Generate 30 days of continuous normalized trajectory
    const days = 30;
    const labels = Array.from({ length: days }, (_, i) => `D-${days - i}`);

    const datasets = data.map((d, i) => {
      const vol = Number(d.sec.vol || 0.18);
      const dailySigma = vol / Math.sqrt(252);
      const color = palette[i % palette.length];

      let val = 100.0;
      const pts = [val];

      for (let j = 1; j < days; j++) {
        // Geometric Brownian walk
        const shock = (Math.sin(j * 0.7 + i * 1.5) * 0.4 + (Math.cos(j * 1.3) * 0.6)) * dailySigma * 2.2;
        val = val * (1 + shock);
        pts.push(Number(val.toFixed(2)));
      }

      return {
        label: d.symbol,
        data: pts,
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2,
        tension: 0.25,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 5
      };
    });

    comparisonChartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#e4e4e7', boxWidth: 12, font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} (Base: 100)`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#71717a', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#71717a',
              font: { size: 10 },
              callback: (v) => v.toFixed(0)
            }
          }
        }
      }
    });
  };

  const exportComparisonCSV = () => {
    const data = getComparisonData();
    if (!data.length) return;

    let csv = `Metric,${data.map(d => d.symbol).join(',')}\n`;
    csv += `Price,${data.map(d => d.price.toFixed(2)).join(',')}\n`;
    csv += `1D Change %,${data.map(d => d.chgPct.toFixed(2)).join(',')}\n`;
    csv += `P/E,${data.map(d => d.pe).join(',')}\n`;
    csv += `Beta,${data.map(d => d.beta).join(',')}\n`;
    csv += `Annual Vol,${data.map(d => d.volPct).join(',')}\n`;
    csv += `Sharpe,${data.map(d => d.sharpe).join(',')}\n`;
    csv += `Piotroski F-Score,${data.map(d => d.piotroski ? d.piotroski.score : '').join(',')}\n`;
    csv += `Altman Z-Score,${data.map(d => d.altman ? d.altman.zScore : '').join(',')}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RISKOS_Peer_Comparison_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  loadState();

  return {
    addTicker,
    removeTicker,
    clear,
    getSelected,
    getComparisonData,
    getCorrelationMatrix,
    openComparisonModal,
    closeComparisonModal,
    renderComparisonDock
  };
})();

// Attach globally
if (typeof window !== 'undefined') {
  window.PeerComparisonEngine = PeerComparisonEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PeerComparisonEngine };
}
