/**
 * RISKOS TICKER LIBRARY CONTROLLER
 * High-performance virtualized security table, central market store subscriber,
 * debounced universal fuzzy search, micro-tick price pulse animations,
 * and universal cross-platform security synchronization.
 */

(() => {
  'use strict';

  // ── 1. Application State ──────────────────────────────────────────────────
  const state = {
    searchQuery: '',
    marketScope: 'ALL',
    exchange: 'ALL',
    assetType: 'ALL',
    quickFilter: 'ALL',
    sortColumn: 'marketCap',
    sortDir: 'desc',
    currentPage: 1,
    pageSize: 20,
    allSecurities: [],
    filteredSecurities: [],
    activeDrawerSec: null,
    drawerChart: null,
    unsubscribeTicks: null
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatMoney = (val, currency = 'INR') => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    const num = Number(val);
    const sym = currency === 'USD' ? '$' : '₹';
    return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (v) => {
    if (!v) return '—';
    if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `${(v / 100000).toFixed(2)} L`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)} K`;
    return v.toString();
  };

  const lockScroll = () => { document.body.style.overflow = 'hidden'; };
  const unlockScroll = () => { document.body.style.overflow = ''; };

  // ── 2. Render Benchmark Market Overview Ribbon ─────────────────────────────
  const renderMarketRibbon = () => {
    const track = document.getElementById('marketRibbonTrack');
    if (!track) return;

    const benchmarks = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT', '^GSPC', '^IXIC', 'USDINR', 'BRENT', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'NVDA', 'AAPL'];
    const renderList = [...benchmarks, ...benchmarks];
    
    track.innerHTML = renderList.map((sym, idx) => {
      const live = SecurityMaster._liveQuotes.get(sym);
      if (!live) return '';
      const chg = Number((live.price - live.previousClose).toFixed(2));
      const chgPct = Number(((chg / live.previousClose) * 100).toFixed(2));
      const isUp = chg >= 0;

      return `
        <div class="ribbon-item" data-symbol="${sym}" data-idx="${idx}">
          <span class="ribbon-symbol">${sym.replace('^', '')}</span>
          <span class="ribbon-price">${formatMoney(live.price, live.currency)}</span>
          <span class="ribbon-chg ${isUp ? 'text-emerald' : 'text-red'}">${isUp ? '▲ +' : '▼ '}${chgPct.toFixed(2)}%</span>
        </div>
      `;
    }).join('');

    track.querySelectorAll('.ribbon-item').forEach(item => {
      item.addEventListener('click', () => {
        const sym = item.dataset.symbol;
        const sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sym);
        if (sec) openSecurityDrawer(sec);
      });
    });
  };

  // ── 3. Filter & Sort Securities ───────────────────────────────────────────
  const computeFilteredSecurities = () => {
    let list = [...SecurityMaster.LOCAL_REGISTRY];
    const q = state.searchQuery.trim().toLowerCase();

    // 1. Text / Fuzzy search
    if (q) {
      list = list.filter(item => {
        const s = item.symbol.toLowerCase();
        const n = item.name.toLowerCase();
        const isin = (item.isin || '').toLowerCase();
        const bse = (item.bseCode || '').toLowerCase();
        const aliases = (item.aliases || []).map(a => a.toLowerCase());
        return s.includes(q) || n.includes(q) || isin.includes(q) || bse.includes(q) || aliases.some(a => a.includes(q));
      });
    }

    // 2. Market Scope Filter
    if (state.marketScope === 'INDIA') {
      list = list.filter(item => item.country === 'IN' || ['NSE', 'BSE'].includes(item.exchange));
    } else if (state.marketScope === 'US') {
      list = list.filter(item => item.country === 'US' || ['NASDAQ', 'NYSE', 'US'].includes(item.exchange));
    } else if (state.marketScope === 'GLOBAL') {
      list = list.filter(item => item.country === 'GLOBAL' || ['GLOBAL', 'FX'].includes(item.exchange));
    }

    // 3. Exchange Filter
    if (state.exchange !== 'ALL') {
      list = list.filter(item => item.exchange === state.exchange);
    }

    // 4. Asset Class Filter
    if (state.assetType !== 'ALL') {
      list = list.filter(item => item.assetType === state.assetType);
    }

    // 5. Quick Filter
    const favs = MarketStore.getFavorites();
    const watch = MarketStore.getWatchlist();

    if (state.quickFilter === 'PINNED') {
      list = list.filter(item => favs.includes(item.symbol));
    } else if (state.quickFilter === 'WATCHLIST') {
      list = list.filter(item => watch.includes(item.symbol));
    } else if (state.quickFilter === 'GAINERS') {
      list = list.filter(item => {
        const q = SecurityMaster._liveQuotes.get(item.symbol);
        return q && (q.price >= q.previousClose);
      });
    } else if (state.quickFilter === 'LOSERS') {
      list = list.filter(item => {
        const q = SecurityMaster._liveQuotes.get(item.symbol);
        return q && (q.price < q.previousClose);
      });
    } else if (state.quickFilter === 'VOLUME') {
      list = list.filter(item => {
        const q = SecurityMaster._liveQuotes.get(item.symbol);
        return q && (q.volume >= (q.avgVolume20d || 1000000));
      });
    }

    // 6. Sorting
    list.sort((a, b) => {
      const qa = SecurityMaster._liveQuotes.get(a.symbol) || { price: a.basePrice, previousClose: a.basePrice, volume: 1000000 };
      const qb = SecurityMaster._liveQuotes.get(b.symbol) || { price: b.basePrice, previousClose: b.basePrice, volume: 1000000 };

      let valA, valB;
      if (state.sortColumn === 'price') {
        valA = qa.price; valB = qb.price;
      } else if (state.sortColumn === 'change') {
        valA = qa.price - qa.previousClose; valB = qb.price - qb.previousClose;
      } else if (state.sortColumn === 'changePercent') {
        valA = (qa.price - qa.previousClose) / qa.previousClose;
        valB = (qb.price - qb.previousClose) / qb.previousClose;
      } else if (state.sortColumn === 'volume') {
        valA = qa.volume; valB = qb.volume;
      } else if (state.sortColumn === 'name') {
        valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
        return state.sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (state.sortColumn === 'symbol') {
        valA = a.symbol.toLowerCase(); valB = b.symbol.toLowerCase();
        return state.sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (state.sortColumn === 'exchange') {
        valA = a.exchange; valB = b.exchange;
        return state.sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        valA = a.marketCap || 0; valB = b.marketCap || 0;
      }

      return state.sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    state.filteredSecurities = list;
  };

  // ── 4. Render Main Table & Pagination ──────────────────────────────────────
  const renderTable = () => {
    computeFilteredSecurities();

    const tbody = document.getElementById('tickerTableBody');
    const emptyState = document.getElementById('tickerEmptyState');
    const countEl = document.getElementById('filteredCountText');
    const totalEl = document.getElementById('totalSecCount');
    const pagInfo = document.getElementById('paginationInfoText');
    const pagPages = document.getElementById('pagPagesContainer');
    const pagPrev = document.getElementById('pagPrevBtn');
    const pagNext = document.getElementById('pagNextBtn');

    if (totalEl) totalEl.textContent = SecurityMaster.LOCAL_REGISTRY.length;
    if (countEl) countEl.textContent = `Showing ${state.filteredSecurities.length} securities`;

    if (state.filteredSecurities.length === 0) {
      if (tbody) tbody.innerHTML = '';
      if (emptyState) emptyState.removeAttribute('hidden');
      return;
    }

    if (emptyState) emptyState.setAttribute('hidden', '');

    // Pagination calculations
    const totalPages = Math.ceil(state.filteredSecurities.length / state.pageSize) || 1;
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = startIdx + state.pageSize;
    const pageItems = state.filteredSecurities.slice(startIdx, endIdx);

    if (pagInfo) pagInfo.textContent = `Page ${state.currentPage} of ${totalPages} (${state.filteredSecurities.length} total)`;
    if (pagPrev) pagPrev.disabled = state.currentPage <= 1;
    if (pagNext) pagNext.disabled = state.currentPage >= totalPages;

    if (pagPages) {
      pagPages.innerHTML = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const p = i + 1;
        return `<button class="pag-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }).join('');

      pagPages.querySelectorAll('.pag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.currentPage = Number(btn.dataset.page);
          renderTable();
        });
      });
    }

    const favs = MarketStore.getFavorites();
    const watch = MarketStore.getWatchlist();

    tbody.innerHTML = pageItems.map((sec, idx) => {
      const q = SecurityMaster._liveQuotes.get(sec.symbol) || {
        price: sec.basePrice,
        previousClose: sec.basePrice,
        volume: 1850000,
        high52w: sec.basePrice * 1.15,
        low52w: sec.basePrice * 0.85
      };

      const chg = Number((q.price - q.previousClose).toFixed(2));
      const chgPct = Number(((chg / q.previousClose) * 100).toFixed(2));
      const isUp = chg >= 0;
      const isFav = favs.includes(sec.symbol);
      const isWatch = watch.includes(sec.symbol);
      const marketStatus = MarketStore.getMarketStatus(sec.exchange);

      return `
        <tr data-symbol="${sec.symbol}" id="row_${sec.symbol.replace(/[\^=]/g, '')}">
          <td class="th-pin">
            <button class="btn-icon-pin ${isFav ? 'active' : ''}" data-symbol="${sec.symbol}" title="Pin Favorite">
              <i class="fa-solid fa-thumbtack"></i>
            </button>
          </td>
          <td>
            <div class="sec-name-cell">
              <button class="sec-title-btn" data-symbol="${sec.symbol}">${sec.name}</button>
              <span class="sec-isin-text">${sec.isin || sec.sector}</span>
            </div>
          </td>
          <td><span class="sec-symbol-badge">${sec.symbol}</span></td>
          <td><span class="sec-type-badge">${sec.exchange}</span></td>
          <td><span class="sec-type-badge">${sec.assetType}</span></td>
          <td class="text-right cell-price" style="font-family:var(--font-mono);font-weight:700;color:#fff;">
            ${formatMoney(q.price, sec.currency)}
          </td>
          <td class="text-right cell-chg ${isUp ? 'text-emerald' : 'text-red'}" style="font-family:var(--font-mono);font-weight:700;">
            ${isUp ? '+' : ''}${formatMoney(chg, sec.currency)}
          </td>
          <td class="text-right cell-chgpct ${isUp ? 'text-emerald' : 'text-red'}" style="font-family:var(--font-mono);font-weight:700;">
            ${isUp ? '▲ +' : '▼ '}${chgPct.toFixed(2)}%
          </td>
          <td class="text-right cell-vol" style="font-family:var(--font-mono);">
            ${formatVolume(q.volume)}
          </td>
          <td class="text-center">
            <span class="sec-type-badge ${marketStatus.color === 'emerald' ? 'text-emerald' : 'text-red'}">
              ${marketStatus.status}
            </span>
          </td>
          <td class="text-right">
            <div style="display:inline-flex;align-items:center;gap:6px;">
              <button class="row-action-btn btn-inspect" data-symbol="${sec.symbol}" title="Inspect Details">
                <i class="fa-solid fa-expand"></i> Inspect
              </button>
              <button class="btn-icon-star ${isWatch ? 'active' : ''}" data-symbol="${sec.symbol}" title="Add to Watchlist">
                <i class="${isWatch ? 'fa-solid' : 'fa-regular'} fa-star"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Wire table interactions
    tbody.querySelectorAll('.sec-title-btn, .btn-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = btn.dataset.symbol;
        const sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sym);
        if (sec) openSecurityDrawer(sec);
      });
    });

    tbody.querySelectorAll('.btn-icon-pin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = btn.dataset.symbol;
        MarketStore.toggleFavorite(sym);
        renderTable();
      });
    });

    tbody.querySelectorAll('.btn-icon-star').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = btn.dataset.symbol;
        MarketStore.toggleWatchlist(sym);
        renderTable();
      });
    });
  };

  // ── 5. Slide-Over Detail Drawer ────────────────────────────────────────────
  const openSecurityDrawer = (sec) => {
    state.activeDrawerSec = sec;
    MarketStore.setActiveSecurity(sec);
    MarketStore.addRecentSearch(sec);

    const overlay = document.getElementById('tickerDetailDrawerOverlay');
    if (!overlay) return;

    const q = SecurityMaster._liveQuotes.get(sec.symbol) || {
      price: sec.basePrice,
      previousClose: sec.basePrice,
      volume: 1850000,
      high52w: sec.basePrice * 1.18,
      pe: sec.pe,
      beta: sec.beta,
      vol: sec.vol
    };

    const chg = Number((q.price - q.previousClose).toFixed(2));
    const chgPct = Number(((chg / q.previousClose) * 100).toFixed(2));
    const isUp = chg >= 0;

    document.getElementById('drawerAssetBadge').textContent = sec.assetType;
    document.getElementById('drawerSecTitle').textContent = sec.symbol;
    document.getElementById('drawerSecSubtitle').textContent = `${sec.name} • ${sec.exchange}`;

    document.getElementById('drawerPrice').textContent = formatMoney(q.price, sec.currency);
    const chgEl = document.getElementById('drawerChange');
    chgEl.textContent = `${isUp ? '+' : ''}${formatMoney(chg, sec.currency)} (${isUp ? '+' : ''}${chgPct.toFixed(2)}%)`;
    chgEl.className = `quote-change ${isUp ? 'text-emerald' : 'text-red'}`;

    document.getElementById('drawerPE').textContent = sec.pe ? sec.pe.toFixed(2) : '—';
    document.getElementById('drawerBeta').textContent = sec.beta ? sec.beta.toFixed(2) : '—';
    document.getElementById('drawerVol').textContent = sec.vol ? `${(sec.vol * 100).toFixed(1)}%` : '—';
    document.getElementById('drawer52WHigh').textContent = formatMoney(q.high52w, sec.currency);

    // Cross-Platform Links
    document.getElementById('drawerGoDashboard').href = `index.html?symbol=${sec.symbol}`;
    document.getElementById('drawerGoObservatory').href = `observatory.html?symbol=${sec.symbol}`;
    document.getElementById('drawerGoLearnLab').href = `learn.html?sec=${sec.symbol}`;
    document.getElementById('drawerGoTerminal').href = `app.html?tickers=${sec.symbol}`;

    // Watchlist & Pin buttons in drawer
    const isWatch = MarketStore.getWatchlist().includes(sec.symbol);
    const isFav = MarketStore.getFavorites().includes(sec.symbol);
    const watchBtn = document.getElementById('drawerToggleWatchBtn');
    const pinBtn = document.getElementById('drawerTogglePinBtn');

    if (watchBtn) {
      watchBtn.innerHTML = `<i class="${isWatch ? 'fa-solid' : 'fa-regular'} fa-star"></i> ${isWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}`;
      watchBtn.onclick = () => {
        MarketStore.toggleWatchlist(sec.symbol);
        openSecurityDrawer(sec);
      };
    }

    if (pinBtn) {
      pinBtn.innerHTML = `<i class="fa-solid fa-thumbtack"></i> ${isFav ? 'Unpin Instrument' : 'Pin Instrument'}`;
      pinBtn.onclick = () => {
        MarketStore.toggleFavorite(sec.symbol);
        openSecurityDrawer(sec);
      };
    }

    renderDrawerChart(sec);
    overlay.removeAttribute('hidden');
    lockScroll();
  };

  const closeSecurityDrawer = () => {
    const overlay = document.getElementById('tickerDetailDrawerOverlay');
    if (overlay) {
      overlay.setAttribute('hidden', '');
      unlockScroll();
    }
  };

  const renderDrawerChart = async (sec) => {
    const canvas = document.getElementById('drawerCanvas');
    if (!canvas) return;

    if (state.drawerChart) {
      if (typeof state.drawerChart.destroy === 'function') state.drawerChart.destroy();
      state.drawerChart = null;
    }

    // Load real OHLC historical candles
    let bars = [];
    try {
      const ohlc = await SecurityMaster.getOHLC(sec.symbol, '1M');
      if (ohlc && Array.isArray(ohlc.bars) && ohlc.bars.length > 0) {
        bars = ohlc.bars;
      }
    } catch (e) {}

    if (bars.length > 0 && typeof FinancialChart !== 'undefined') {
      state.drawerChart = new FinancialChart({
        canvas: canvas,
        bars: bars,
        mode: 'candle',
        currency: sec.currency || 'INR',
        volume: true,
        sma20: true
      });
      return;
    }

    const ctx = canvas.getContext('2d');
    const baseP = sec.basePrice || 1000.0;
    const labels = ['09:15', '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '15:30'];
    const prices = [
      baseP * 0.99, baseP * 0.994, baseP * 0.998, baseP * 1.004, baseP * 1.008,
      baseP * 1.014, baseP * 1.018, baseP * 1.022, baseP * 1.025, baseP * 1.028
    ];

    if (typeof Chart !== 'undefined') {
      state.drawerChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${sec.symbol} Price`,
            data: prices,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.08)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (ctx) => `Price: ${formatMoney(ctx.raw, sec.currency)}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#71717a', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#71717a',
                font: { size: 10 },
                callback: (v) => formatMoney(v, sec.currency)
              }
            }
          }
        }
      });
    }
  };

  // ── 6. Live Tick Engine Subscription ──────────────────────────────────────
  const setupRealtimeQuoteSubscription = () => {
    state.unsubscribeTicks = MarketStore.subscribeQuotes((updates) => {
      updates.forEach(u => {
        const cleanSym = u.symbol.replace(/[\^=]/g, '');

        // 1. Update Table Row if visible
        const row = document.getElementById(`row_${cleanSym}`);
        if (row) {
          const priceCell = row.querySelector('.cell-price');
          const chgCell = row.querySelector('.cell-chg');
          const chgPctCell = row.querySelector('.cell-chgpct');
          const volCell = row.querySelector('.cell-vol');

          if (priceCell) {
            priceCell.textContent = formatMoney(u.price, u.currency);
            priceCell.classList.remove('price-flash-up', 'price-flash-down');
            void priceCell.offsetWidth; // trigger reflow
            priceCell.classList.add(u.delta >= 0 ? 'price-flash-up' : 'price-flash-down');
          }

          if (chgCell) {
            chgCell.textContent = `${u.change >= 0 ? '+' : ''}${formatMoney(u.change, u.currency)}`;
            chgCell.className = `text-right cell-chg ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
          }

          if (chgPctCell) {
            chgPctCell.textContent = `${u.change >= 0 ? '▲ +' : '▼ '}${u.changePercent.toFixed(2)}%`;
            chgPctCell.className = `text-right cell-chgpct ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
          }

          if (volCell) {
            volCell.textContent = formatVolume(u.volume);
          }
        }

        // 2. Update Ribbon Item if present
        const ribbon = document.getElementById(`ribbon_${cleanSym}`);
        if (ribbon) {
          const pEl = ribbon.querySelector('.ribbon-price');
          const cEl = ribbon.querySelector('.ribbon-chg');
          if (pEl) pEl.textContent = formatMoney(u.price, u.currency);
          if (cEl) {
            cEl.textContent = `${u.change >= 0 ? '▲ +' : '▼ '}${u.changePercent.toFixed(2)}%`;
            cEl.className = `ribbon-chg ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
          }
        }

        // 3. Update Drawer if active
        if (state.activeDrawerSec && state.activeDrawerSec.symbol === u.symbol) {
          const dPrice = document.getElementById('drawerPrice');
          const dChg = document.getElementById('drawerChange');
          if (dPrice) dPrice.textContent = formatMoney(u.price, u.currency);
          if (dChg) {
            dChg.textContent = `${u.change >= 0 ? '+' : ''}${formatMoney(u.change, u.currency)} (${u.change >= 0 ? '+' : ''}${u.changePercent.toFixed(2)}%)`;
            dChg.className = `quote-change ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
          }
        }
      });
    });
  };

  // ── 7. Universal Command Palette (CMD+K) ───────────────────────────────────
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

    const renderPaletteResults = (query) => {
      if (!paletteResults) return;
      const q = query.toLowerCase().trim();

      const items = SecurityMaster.LOCAL_REGISTRY.map(sec => ({
        title: `${sec.symbol} • ${sec.name}`,
        subtitle: `${sec.exchange} • ${sec.assetType} • ${sec.isin || sec.sector}`,
        action: () => openSecurityDrawer(sec)
      }));

      const filtered = q ? items.filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)) : items.slice(0, 8);

      paletteResults.innerHTML = filtered.map((item, idx) => `
        <div class="palette-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
          <div style="display:flex;align-items:center;gap:10px;">
            <i class="fa-solid fa-layer-group" style="color:var(--accent-cyan);"></i>
            <div>
              <div style="font-weight:600;color:#ffffff;font-size:0.85rem;">${item.title}</div>
              <span style="font-size:0.7rem;color:var(--text-muted);">${item.subtitle}</span>
            </div>
          </div>
          <kbd style="font-size:0.65rem;color:var(--text-muted);background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;">↵ Open</kbd>
        </div>
      `).join('');

      paletteResults.querySelectorAll('.palette-item').forEach((el, idx) => {
        el.addEventListener('click', () => {
          closePalette();
          filtered[idx].action();
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

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (paletteOverlay && !paletteOverlay.hasAttribute('hidden')) closePalette();
        else openPalette();
      } else if (e.key === 'Escape') {
        closePalette();
        closeSecurityDrawer();
      }
    });
  };

  // ── 8. Initializer ────────────────────────────────────────────────────────
  const init = () => {
    renderMarketRibbon();
    renderTable();
    setupRealtimeQuoteSubscription();
    setupCommandPalette();

    // 1. Universal Search Input
    const searchInput = document.getElementById('tickerSearchInput');
    const clearBtn = document.getElementById('tickerClearBtn');

    let debounceTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const val = e.target.value;
        if (clearBtn) clearBtn.hidden = !val;

        debounceTimer = setTimeout(() => {
          state.searchQuery = val;
          state.currentPage = 1;
          renderTable();
        }, 200);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearBtn.hidden = true;
        state.searchQuery = '';
        state.currentPage = 1;
        renderTable();
      });
    }

    // 2. Quick Jump Chips
    document.querySelectorAll('.ticker-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const sym = chip.dataset.query;
        if (searchInput) searchInput.value = sym;
        if (clearBtn) clearBtn.hidden = false;
        state.searchQuery = sym;
        state.currentPage = 1;
        renderTable();
      });
    });

    // 3. Segmented Controls (Market, Exchange, Asset, Quick)
    document.querySelectorAll('#marketScopeControl .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#marketScopeControl .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.marketScope = btn.dataset.market;
        state.currentPage = 1;
        renderTable();
      });
    });

    document.querySelectorAll('#exchangeControl .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#exchangeControl .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exchange = btn.dataset.exchange;
        state.currentPage = 1;
        renderTable();
      });
    });

    document.querySelectorAll('#assetTypeControl .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#assetTypeControl .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.assetType = btn.dataset.asset;
        state.currentPage = 1;
        renderTable();
      });
    });

    document.querySelectorAll('#quickFilterControl .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#quickFilterControl .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.quickFilter = btn.dataset.quick;
        state.currentPage = 1;
        renderTable();
      });
    });

    // 4. Sorting Headers
    document.querySelectorAll('.th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (state.sortColumn === col) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = col;
          state.sortDir = 'desc';
        }
        renderTable();
      });
    });

    // 5. Pagination Buttons
    const prevBtn = document.getElementById('pagPrevBtn');
    const nextBtn = document.getElementById('pagNextBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderTable();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredSecurities.length / state.pageSize) || 1;
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderTable();
        }
      });
    }

    // 6. Reset Filters
    const resetBtn = document.getElementById('btnResetFilters');
    const emptyResetBtn = document.getElementById('emptyResetBtn');
    const resetAll = () => {
      state.searchQuery = '';
      state.marketScope = 'ALL';
      state.exchange = 'ALL';
      state.assetType = 'ALL';
      state.quickFilter = 'ALL';
      state.currentPage = 1;
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.hidden = true;
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.market === 'ALL' || b.dataset.exchange === 'ALL' || b.dataset.asset === 'ALL' || b.dataset.quick === 'ALL'));
      renderTable();
    };

    if (resetBtn) resetBtn.addEventListener('click', resetAll);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAll);

    // 7. Drawer Close Handlers
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerBackdrop = document.getElementById('tickerDrawerBackdrop');
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeSecurityDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeSecurityDrawer);

    // 8. Market Clock
    const updateMarketClock = () => {
      const now = new Date();
      const istStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const timeEl = document.getElementById('marketTime');
      if (timeEl) timeEl.textContent = `${istStr} IST`;
    };
    updateMarketClock();
    setInterval(updateMarketClock, 1000);

    // 9. URL Query Sync (e.g. ?symbol=RELIANCE or ?search=TCS)
    const urlParams = new URLSearchParams(window.location.search);
    const targetSymbol = urlParams.get('symbol') || urlParams.get('sec') || urlParams.get('ticker');
    const targetSearch = urlParams.get('search') || urlParams.get('q');

    if (targetSearch && searchInput) {
      searchInput.value = targetSearch;
      state.searchQuery = targetSearch;
      renderTable();
    }

    if (targetSymbol) {
      const match = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol.toLowerCase() === targetSymbol.toLowerCase());
      if (match) openSecurityDrawer(match);
    }

    // 10. Live Trade Tape & Tick Stream
    setupLiveTradeTape();

    if (typeof SecurityMaster !== 'undefined') {
      SecurityMaster.subscribeLiveTicks((updates) => {
        // 1. Update ribbon items
        const track = document.getElementById('marketRibbonTrack');
        if (track) {
          updates.forEach(u => {
            const items = track.querySelectorAll(`.ribbon-item[data-symbol="${u.symbol}"]`);
            items.forEach(el => {
              const pEl = el.querySelector('.ribbon-price');
              const cEl = el.querySelector('.ribbon-chg');
              if (pEl) {
                pEl.textContent = formatMoney(u.price, u.currency);
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
        }

        // 2. Update matching rows in table with flash animation
        updates.forEach(u => {
          const rowId = `row_${u.symbol.replace(/[\^=]/g, '')}`;
          const row = document.getElementById(rowId);
          if (row) {
            const priceEl = row.querySelector('.sec-price-val');
            const chgEl = row.querySelector('.sec-chg-pill');
            if (priceEl) {
              priceEl.textContent = formatMoney(u.price, u.currency);
              priceEl.classList.remove('price-flash-up', 'price-flash-down');
              void priceEl.offsetWidth;
              priceEl.classList.add(u.delta >= 0 ? 'price-flash-up' : 'price-flash-down');
            }
            if (chgEl) {
              chgEl.textContent = `${u.change >= 0 ? '+' : ''}${u.changePercent.toFixed(2)}%`;
              chgEl.className = `sec-chg-pill ${u.change >= 0 ? 'pos' : 'neg'}`;
            }
          }
        });

        // 3. Update drawer if open
        if (state.activeDrawerSec) {
          const matching = updates.find(u => u.symbol === state.activeDrawerSec.symbol);
          if (matching) {
            const dPrice = document.getElementById('drawerLivePrice');
            const dChg = document.getElementById('drawerLiveChg');
            if (dPrice) dPrice.textContent = formatMoney(matching.price, matching.currency);
            if (dChg) {
              dChg.textContent = `${matching.change >= 0 ? '+' : ''}${matching.changePercent.toFixed(2)}%`;
              dChg.className = `drawer-stat-val ${matching.change >= 0 ? 'text-emerald' : 'text-red'}`;
            }
          }
        }
      });
    }
  };

  const setupLiveTradeTape = () => {
    if (typeof SecurityMaster === 'undefined') return;
    const detailEl = document.getElementById('tickerTapeTradeDetail');
    const sideEl = document.getElementById('tickerTapeTradeSide');
    const timeEl = document.getElementById('tickerTapeTradeTime');

    if (!detailEl || !sideEl) return;

    SecurityMaster.subscribeLiveTape((trade) => {
      detailEl.innerHTML = `<strong>${trade.symbol}</strong> &bull; ${trade.size.toLocaleString('en-IN')} shares @ ${formatMoney(trade.price, trade.currency)} [${trade.venue}]`;
      sideEl.textContent = `${trade.side} ${trade.condition === 'BLOCK DEAL' ? '• BLOCK DEAL' : ''}`;
      sideEl.className = trade.side === 'BUY' ? 'tape-side-buy' : 'tape-side-sell';
      if (timeEl) timeEl.textContent = `${trade.time} IST`;
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
