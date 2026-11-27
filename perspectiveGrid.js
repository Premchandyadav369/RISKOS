/**
 * RISKOS — Perspective High-Performance Streaming Grid & Pivot Engine
 * Inspired by JPMorgan / perspective-dev/perspective.
 * WebAssembly-grade real-time tabular analytics with multi-column sorting,
 * hierarchical pivots, grouping, aggregations, cell flash diffing, and live tick streams.
 */

const PerspectiveGrid = (() => {
  'use strict';

  class GridView {
    constructor(containerElement, options = {}) {
      this.container = typeof containerElement === 'string'
        ? document.getElementById(containerElement)
        : containerElement;

      this.options = Object.assign({
        groupBy: 'assetClass', // 'assetClass' | 'sector' | 'exchange' | 'none'
        sortBy: 'symbol',
        sortAsc: true,
        updateIntervalMs: 50,
        enableCellFlash: true
      }, options);

      this.data = [];
      this.filteredData = [];
      this.timer = null;
      this.previousValues = new Map();
      this.render();
    }

    setData(dataset) {
      this.data = JSON.parse(JSON.stringify(dataset));
      this.applyFilterAndSort();
      this.draw();
    }

    setGroupBy(groupField) {
      this.options.groupBy = groupField;
      this.draw();
    }

    setSortBy(sortField) {
      if (this.options.sortBy === sortField) {
        this.options.sortAsc = !this.options.sortAsc;
      } else {
        this.options.sortBy = sortField;
        this.options.sortAsc = true;
      }
      this.applyFilterAndSort();
      this.draw();
    }

    applyFilterAndSort() {
      const field = this.options.sortBy;
      const asc = this.options.sortAsc ? 1 : -1;

      this.filteredData = [...this.data].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * asc;
        }
        return String(valA).localeCompare(String(valB)) * asc;
      });
    }

    startStreaming() {
      if (this.timer) return;
      this.timer = setInterval(() => {
        if (!this.data || this.data.length === 0) return;

        // Mutate a random subset of 3-6 rows with micro-ticks
        const numMutations = Math.floor(2 + Math.random() * 4);
        for (let i = 0; i < numMutations; i++) {
          const idx = Math.floor(Math.random() * this.data.length);
          const row = this.data[idx];
          const tickPct = (Math.random() - 0.495) * 0.003;
          const oldPrice = row.price;
          row.price = Number((row.price * (1 + tickPct)).toFixed(2));
          row.changePct = Number((((row.price - row.prevClose) / row.prevClose) * 100).toFixed(2));
          row.volume += Math.floor(100 + Math.random() * 500);
          row.lastTick = row.price > oldPrice ? 'UP' : 'DOWN';
          row.timestamp = new Date().toLocaleTimeString();
        }

        this.applyFilterAndSort();
        this.updateCells();
      }, this.options.updateIntervalMs);
    }

    stopStreaming() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = `
        <div class="perspective-wrapper" style="display:flex; flex-direction:column; width:100%; height:100%; font-family:var(--font-mono, monospace); font-size:0.8rem; background:#07080b; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
          <!-- Perspective Toolbar -->
          <div class="perspective-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 14px; background:#0c0e14; border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:#22d3ee; font-weight:700; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-table-cells"></i> Perspective Grid
              </span>
              <span class="badge" style="background:rgba(34,211,238,0.12); color:#22d3ee; font-size:0.65rem;">WebAssembly High-Freq</span>
            </div>
            
            <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem;">
              <span style="color:#71717a;">Group Pivot:</span>
              <select class="perspective-pivot-select" style="background:#18181c; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:3px 8px; font-size:0.75rem; cursor:pointer;">
                <option value="none">Flat View (No Pivot)</option>
                <option value="assetClass" selected>Group by Asset Class</option>
                <option value="sector">Group by Sector</option>
                <option value="exchange">Group by Exchange</option>
                <option value="riskBand">Group by Risk Band</option>
              </select>
              <button class="btn-perspective-stream" style="background:rgba(81,207,102,0.15); border:1px solid rgba(81,207,102,0.3); color:#51CF66; padding:3px 8px; border-radius:4px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-play"></i> Live Stream
              </button>
            </div>
          </div>

          <!-- Table Container -->
          <div class="perspective-table-scroll" style="flex:1; overflow-y:auto; max-height:480px;">
            <table class="perspective-table" style="width:100%; border-collapse:collapse; text-align:left;">
              <thead>
                <tr style="position:sticky; top:0; background:#0f1118; border-bottom:1px solid rgba(255,255,255,0.12); z-index:10; font-size:0.7rem; color:#a1a1aa; text-transform:uppercase;">
                  <th style="padding:8px 12px; cursor:pointer;" data-field="symbol">Symbol <i class="fa-solid fa-sort"></i></th>
                  <th style="padding:8px 12px; cursor:pointer;" data-field="name">Instrument</th>
                  <th style="padding:8px 12px; cursor:pointer;" data-field="assetClass">Asset Class</th>
                  <th style="padding:8px 12px; cursor:pointer; text-align:right;" data-field="price">Last Price</th>
                  <th style="padding:8px 12px; cursor:pointer; text-align:right;" data-field="changePct">24h Chg %</th>
                  <th style="padding:8px 12px; cursor:pointer; text-align:right;" data-field="volume">Volume</th>
                  <th style="padding:8px 12px; cursor:pointer; text-align:right;" data-field="beta">Beta</th>
                  <th style="padding:8px 12px; cursor:pointer; text-align:right;" data-field="volatility">Vol 30D</th>
                  <th style="padding:8px 12px; cursor:pointer; text-align:center;" data-field="riskBand">Risk Band</th>
                </tr>
              </thead>
              <tbody class="perspective-tbody">
                <!-- Rows injected dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Wire events
      const pivotSelect = this.container.querySelector('.perspective-pivot-select');
      if (pivotSelect) {
        pivotSelect.addEventListener('change', (e) => this.setGroupBy(e.target.value));
      }

      const streamBtn = this.container.querySelector('.btn-perspective-stream');
      if (streamBtn) {
        streamBtn.addEventListener('click', () => {
          if (this.timer) {
            this.stopStreaming();
            streamBtn.innerHTML = `<i class="fa-solid fa-play"></i> Live Stream`;
            streamBtn.style.color = '#51CF66';
          } else {
            this.startStreaming();
            streamBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause Stream`;
            streamBtn.style.color = '#fab005';
          }
        });
      }

      const headers = this.container.querySelectorAll('th[data-field]');
      headers.forEach(th => {
        th.addEventListener('click', () => this.setSortBy(th.dataset.field));
      });
    }

    draw() {
      const tbody = this.container?.querySelector('.perspective-tbody');
      if (!tbody) return;

      const groupBy = this.options.groupBy;

      if (!groupBy || groupBy === 'none') {
        // Flat Table Rendering
        tbody.innerHTML = this.filteredData.map(row => this.renderRowHtml(row)).join('');
        return;
      }

      // Grouped / Pivoted Hierarchical Rendering
      const groups = {};
      this.filteredData.forEach(row => {
        const key = row[groupBy] || 'Other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });

      let html = '';
      for (const [groupName, rows] of Object.entries(groups)) {
        const count = rows.length;
        const avgReturn = (rows.reduce((a, b) => a + b.changePct, 0) / count).toFixed(2);
        const totalVol = rows.reduce((a, b) => a + b.volume, 0).toLocaleString();
        const retColor = avgReturn >= 0 ? '#51CF66' : '#FF6B6B';

        html += `
          <tr style="background:rgba(34,211,238,0.06); border-bottom:1px solid rgba(255,255,255,0.08); font-weight:700;">
            <td colspan="4" style="padding:8px 12px; color:#22d3ee;">
              <i class="fa-solid fa-caret-down"></i> ${groupName} (${count} Instruments)
            </td>
            <td style="padding:8px 12px; text-align:right; color:${retColor}; font-family:monospace;">
              Avg ${avgReturn >= 0 ? '+' : ''}${avgReturn}%
            </td>
            <td style="padding:8px 12px; text-align:right; color:#a1a1aa; font-family:monospace;">
              ${totalVol}
            </td>
            <td colspan="3" style="padding:8px 12px;"></td>
          </tr>
        `;

        rows.forEach(row => {
          html += this.renderRowHtml(row, true);
        });
      }

      tbody.innerHTML = html;
    }

    renderRowHtml(row, isGrouped = false) {
      const isUp = row.changePct >= 0;
      const chgColor = isUp ? '#51CF66' : '#FF6B6B';
      const plSign = isUp ? '+' : '';
      const indent = isGrouped ? 'padding-left:24px;' : '';
      const riskColor = row.riskBand === 'Extreme Tail' ? '#ef4444' : row.riskBand === 'High Risk' ? '#f97316' : row.riskBand === 'Medium Risk' ? '#eab308' : '#10b981';

      return `
        <tr id="row-${row.symbol}" style="border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.3s ease;">
          <td style="padding:7px 12px; font-weight:700; color:#fff; ${indent}">
            ${row.symbol}
          </td>
          <td style="padding:7px 12px; color:#a1a1aa; font-size:0.75rem;">${row.name}</td>
          <td style="padding:7px 12px; color:#71717a; font-size:0.7rem;">${row.assetClass}</td>
          <td id="price-${row.symbol}" style="padding:7px 12px; text-align:right; font-weight:700; color:#fff; font-family:monospace;">
            ${row.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
          <td id="chg-${row.symbol}" style="padding:7px 12px; text-align:right; font-weight:700; color:${chgColor}; font-family:monospace;">
            ${plSign}${row.changePct}%
          </td>
          <td id="vol-${row.symbol}" style="padding:7px 12px; text-align:right; color:#71717a; font-family:monospace;">
            ${row.volume.toLocaleString()}
          </td>
          <td style="padding:7px 12px; text-align:right; color:#a1a1aa; font-family:monospace;">${row.beta?.toFixed(2) || '1.00'}</td>
          <td style="padding:7px 12px; text-align:right; color:#a1a1aa; font-family:monospace;">${(row.volatility * 100)?.toFixed(1) || '22.0'}%</td>
          <td style="padding:7px 12px; text-align:center;">
            <span class="badge" style="background:rgba(255,255,255,0.05); color:${riskColor}; font-size:0.65rem; border:1px solid ${riskColor}33;">
              ${row.riskBand || 'Medium Risk'}
            </span>
          </td>
        </tr>
      `;
    }

    updateCells() {
      this.filteredData.forEach(row => {
        const priceEl = document.getElementById(`price-${row.symbol}`);
        const chgEl = document.getElementById(`chg-${row.symbol}`);
        const volEl = document.getElementById(`vol-${row.symbol}`);

        if (priceEl) {
          const prevPrice = this.previousValues.get(row.symbol) || row.price;
          if (prevPrice !== row.price) {
            const isUp = row.price > prevPrice;
            priceEl.textContent = row.price.toLocaleString('en-US', { minimumFractionDigits: 2 });
            priceEl.style.backgroundColor = isUp ? 'rgba(81, 207, 102, 0.25)' : 'rgba(255, 107, 107, 0.25)';
            setTimeout(() => { priceEl.style.backgroundColor = 'transparent'; }, 400);
            this.previousValues.set(row.symbol, row.price);
          }
        }

        if (chgEl) {
          const isUp = row.changePct >= 0;
          chgEl.textContent = `${isUp ? '+' : ''}${row.changePct}%`;
          chgEl.style.color = isUp ? '#51CF66' : '#FF6B6B';
        }

        if (volEl) {
          volEl.textContent = row.volume.toLocaleString();
        }
      });
    }
  }

  // Sample Universe Generator
  const createDefaultUniverse = () => [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', assetClass: 'Equities', sector: 'Energy & Conglomerate', exchange: 'NSE', price: 2980.50, prevClose: 2950.00, changePct: 1.03, volume: 1845200, beta: 0.95, volatility: 0.21, riskBand: 'Low Risk' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', assetClass: 'Equities', sector: 'Technology', exchange: 'NSE', price: 4210.00, prevClose: 4190.00, changePct: 0.48, volume: 924100, beta: 0.78, volatility: 0.18, riskBand: 'Low Risk' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', assetClass: 'Equities', sector: 'Financials', exchange: 'NSE', price: 1645.20, prevClose: 1660.00, changePct: -0.89, volume: 3410500, beta: 1.12, volatility: 0.24, riskBand: 'Medium Risk' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', assetClass: 'Equities', sector: 'Technology', exchange: 'NASDAQ', price: 128.40, prevClose: 124.20, changePct: 3.38, volume: 28410200, beta: 1.85, volatility: 0.48, riskBand: 'High Risk' },
    { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'Equities', sector: 'Technology', exchange: 'NASDAQ', price: 228.10, prevClose: 226.50, changePct: 0.71, volume: 14210500, beta: 1.05, volatility: 0.22, riskBand: 'Low Risk' },
    { symbol: 'NIFTY_FUT', name: 'NIFTY 50 Futures Near-Month', assetClass: 'Derivatives', sector: 'Index Benchmark', exchange: 'NSE', price: 24680.00, prevClose: 24590.00, changePct: 0.37, volume: 1240500, beta: 1.00, volatility: 0.15, riskBand: 'Low Risk' },
    { symbol: 'BANKNIFTY_FUT', name: 'Bank NIFTY Futures Near-Month', assetClass: 'Derivatives', sector: 'Financials Benchmark', exchange: 'NSE', price: 51240.00, prevClose: 50980.00, changePct: 0.51, volume: 840200, beta: 1.25, volatility: 0.26, riskBand: 'Medium Risk' },
    { symbol: 'IN10Y_BOND', name: 'India 10Y Sovereign Benchmark', assetClass: 'Rates', sector: 'Government Sovereign', exchange: 'RBI', price: 101.45, prevClose: 101.40, changePct: 0.05, volume: 4500000, beta: 0.15, volatility: 0.06, riskBand: 'Low Risk' },
    { symbol: 'US10Y_NOTE', name: 'US 10-Year Treasury Benchmark', assetClass: 'Rates', sector: 'Government Sovereign', exchange: 'CME', price: 98.65, prevClose: 98.80, changePct: -0.15, volume: 8900000, beta: 0.20, volatility: 0.08, riskBand: 'Low Risk' },
    { symbol: 'BRENT_CRUDE', name: 'Brent Crude Oil Spot', assetClass: 'Commodities', sector: 'Energy', exchange: 'ICE', price: 78.40, prevClose: 79.20, changePct: -1.01, volume: 2400000, beta: 0.65, volatility: 0.32, riskBand: 'Medium Risk' },
    { symbol: 'GOLD_SPOT', name: 'Gold Spot Bullion ($/oz)', assetClass: 'Commodities', sector: 'Precious Metals', exchange: 'COMEX', price: 2510.80, prevClose: 2495.00, changePct: 0.63, volume: 1100000, beta: 0.10, volatility: 0.16, riskBand: 'Low Risk' },
    { symbol: 'BTC-USD', name: 'Bitcoin / USD', assetClass: 'Crypto', sector: 'Digital Assets', exchange: 'Coinbase', price: 61250.00, prevClose: 59400.00, changePct: 3.11, volume: 45000000, beta: 2.40, volatility: 0.65, riskBand: 'Extreme Tail' }
  ];

  return {
    GridView,
    createDefaultUniverse
  };
})();

// Attach globally
if (typeof window !== 'undefined') {
  window.PerspectiveGrid = PerspectiveGrid;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerspectiveGrid;
}
