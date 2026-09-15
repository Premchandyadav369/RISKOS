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
    pennyFilter: 'ALL',
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

    // Use full rich 120+ asset universe with diverse rotation
    const allSecs = SecurityMaster.LOCAL_REGISTRY || [];
    if (!allSecs.length) return;

    // Build wide seamless conveyor strip
    track.innerHTML = allSecs.map((sec, idx) => {
      const live = SecurityMaster._liveQuotes.get(sec.symbol) || {
        price: sec.basePrice,
        currency: sec.currency,
        previousClose: sec.basePrice * 0.99
      };
      const prev = live.previousClose || live.price;
      const chg = Number((live.price - prev).toFixed(2));
      const chgPct = prev > 0 ? Number(((chg / prev) * 100).toFixed(2)) : 0;
      const isUp = chg >= 0;

      return `
        <div class="ribbon-item" data-symbol="${sec.symbol}" data-idx="${idx}">
          <span class="ribbon-symbol">${sec.symbol.replace('^', '')}</span>
          <span class="ribbon-price">${formatMoney(live.price, sec.currency)}</span>
          <span class="ribbon-chg ${isUp ? 'text-emerald' : 'text-red'}">${isUp ? '▲ +' : '▼ '}${chgPct.toFixed(2)}%</span>
        </div>
      `;
    }).join('') + allSecs.map((sec, idx) => {
      const live = SecurityMaster._liveQuotes.get(sec.symbol) || {
        price: sec.basePrice,
        currency: sec.currency,
        previousClose: sec.basePrice * 0.99
      };
      const prev = live.previousClose || live.price;
      const chg = Number((live.price - prev).toFixed(2));
      const chgPct = prev > 0 ? Number(((chg / prev) * 100).toFixed(2)) : 0;
      const isUp = chg >= 0;

      return `
        <div class="ribbon-item" data-symbol="${sec.symbol}" data-idx="${idx}_dup">
          <span class="ribbon-symbol">${sec.symbol.replace('^', '')}</span>
          <span class="ribbon-price">${formatMoney(live.price, sec.currency)}</span>
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

  // ── 2.5 Render Universal Penny Stock & Microcap Radar Matrix ───────────────
  const renderPennyStockMatrix = (pfilter = 'ALL') => {
    state.pennyFilter = pfilter;
    const grid = document.getElementById('pennyCardsGrid');
    if (!grid) return;

    // Fetch all 21 penny stocks from central security master
    const pennyList = SecurityMaster.getPennyStocks('all', 70.0);
    const watch = typeof MarketStore !== 'undefined' ? MarketStore.getWatchlist() : [];

    let filtered = pennyList;
    if (pfilter === 'NSE') {
      filtered = pennyList.filter(s => s.exchange === 'NSE');
    } else if (pfilter === 'BSE') {
      filtered = pennyList.filter(s => s.exchange === 'BSE');
    } else if (pfilter === 'US') {
      filtered = pennyList.filter(s => ['US', 'NASDAQ', 'NYSE', 'NYSE American'].includes(s.exchange));
    } else if (pfilter === 'SURGE') {
      filtered = pennyList.filter(s => {
        const q = SecurityMaster._liveQuotes.get(s.symbol) || s;
        const b = s.avgVolume20d || 1000000;
        return ((q.volume || 1000000) / b) >= 2.0;
      });
    } else if (pfilter === 'SUB5') {
      filtered = pennyList.filter(s => {
        return (s.currency === 'INR' && s.basePrice < 5.0) || (s.currency === 'USD' && s.basePrice < 2.0);
      });
    }

    // Update Top KPI count badge
    const totalCountEl = document.getElementById('pkpiTotalCount');
    if (totalCountEl) totalCountEl.textContent = pennyList.length;

    grid.innerHTML = filtered.map(sec => {
      const q = SecurityMaster._liveQuotes.get(sec.symbol) || {
        price: sec.basePrice,
        previousClose: sec.basePrice,
        volume: sec.avgVolume20d || 2000000
      };
      const cleanSym = sec.symbol.replace(/[\^=]/g, '');
      const prev = q.previousClose || sec.basePrice;
      const chg = Number((q.price - prev).toFixed(2));
      const chgPct = prev > 0 ? Number(((chg / prev) * 100).toFixed(2)) : 0;
      const isUp = chg >= 0;
      const isWatch = watch.includes(sec.symbol);
      const isUS = ['US', 'NASDAQ', 'NYSE', 'NYSE American'].includes(sec.exchange);
      const baseVol = sec.avgVolume20d || 1000000;
      const volRatio = Number(((q.volume || baseVol) / baseVol).toFixed(2));
      const stdVol = baseVol * 0.45;
      const zScore = Number((((q.volume || baseVol) - baseVol) / stdVol).toFixed(2));

      return `
        <div class="penny-stock-card" data-symbol="${sec.symbol}" id="pcard_${cleanSym}">
          <div class="pcard-top">
            <div class="pcard-sym-group">
              <div class="pcard-sym-row">
                <span class="pcard-sym">${sec.symbol}</span>
                <span class="pcard-ex-pill">${sec.exchange}</span>
                ${isUS ? '<span class="badge-us-micro">US MICRO</span>' : '<span class="badge-penny-chip">&lt; ₹20</span>'}
              </div>
              <span class="pcard-name" title="${sec.name}">${sec.name}</span>
            </div>
            <div class="pcard-price-group">
              <span class="pcard-price">${formatMoney(q.price, sec.currency)}</span>
              <span class="pcard-chg ${isUp ? 'text-emerald' : 'text-red'}">
                ${isUp ? '▲ +' : '▼ '}${chgPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div class="pcard-stats-row">
            <div class="pstat-item">
              <span class="pstat-title">20D Baseline</span>
              <span class="pstat-val">${formatVolume(baseVol)}</span>
            </div>
            <div class="pstat-item">
              <span class="pstat-title">Vol Multiple</span>
              <span class="pstat-val ${volRatio >= 2.0 ? 'text-cyan' : ''}">${volRatio.toFixed(2)}x</span>
            </div>
            <div class="pstat-item">
              <span class="pstat-title">Statistical Z</span>
              <span class="pstat-val ${zScore >= 2.0 ? 'text-amber' : ''}">${zScore >= 0 ? '+' : ''}${zScore.toFixed(2)}σ</span>
            </div>
            <div class="pstat-item">
              <span class="pstat-title">Annual Vol σ</span>
              <span class="pstat-val">${((sec.vol || 0.5) * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div class="pcard-footer">
            <div class="pcard-badges-row">
              <span class="badge-surge-pill"><i class="fa-solid fa-bolt"></i> ${volRatio.toFixed(1)}x</span>
              <span class="badge-zscore-pill">${zScore >= 0 ? '+' : ''}${zScore.toFixed(1)}σ</span>
            </div>
            <div class="pcard-actions">
              <button class="pcard-btn btn-pcard-inspect" data-symbol="${sec.symbol}" title="Inspect in Drawer">
                <i class="fa-solid fa-expand"></i>
              </button>
              <button class="pcard-btn btn-pcard-star ${isWatch ? 'active' : ''}" data-symbol="${sec.symbol}" title="Add to Watchlist">
                <i class="${isWatch ? 'fa-solid text-amber' : 'fa-regular'} fa-star"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire clicks
    grid.querySelectorAll('.penny-stock-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-pcard-star') || e.target.closest('.btn-pcard-inspect')) return;
        const sym = card.dataset.symbol;
        const sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sym);
        if (sec) openSecurityDrawer(sec);
      });
    });

    grid.querySelectorAll('.btn-pcard-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = btn.dataset.symbol;
        const sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sym);
        if (sec) openSecurityDrawer(sec);
      });
    });

    grid.querySelectorAll('.btn-pcard-star').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = btn.dataset.symbol;
        MarketStore.toggleWatchlist(sym);
        renderPennyStockMatrix(state.pennyFilter);
        renderTable();
      });
    });
  };

  // ── 3. Filter & Sort Securities ───────────────────────────────────────────
  const computeFilteredSecurities = () => {
    let list = [...SecurityMaster.LOCAL_REGISTRY];
    const q = state.searchQuery.trim().toLowerCase();

    // 1. Text / Fuzzy search
    if (q) {
      const isPennyQuery = ['penny', 'pennies', 'microcap', 'microcaps', 'under 20', 'sub 5', 'bse penny', 'cheap'].some(k => q.includes(k));
      list = list.filter(item => {
        if (isPennyQuery && (item.isPenny || item.assetType === 'PENNY_EQUITY' || (item.currency === 'INR' && item.basePrice <= 20) || (item.currency === 'USD' && item.basePrice <= 5.0))) {
          return true;
        }
        const s = item.symbol.toLowerCase();
        const sNS = (item.symbolNS || '').toLowerCase();
        const n = item.name.toLowerCase();
        const isin = (item.isin || '').toLowerCase();
        const bse = (item.bseCode || '').toLowerCase();
        const aliases = (item.aliases || []).map(a => a.toLowerCase());
        return s.includes(q) || sNS.includes(q) || n.includes(q) || isin.includes(q) || bse.includes(q) || aliases.some(a => a.includes(q));
      });
    }

    // 2. Market Scope Filter
    if (state.marketScope === 'INDIA') {
      list = list.filter(item => item.country === 'IN' || ['NSE', 'BSE'].includes(item.exchange));
    } else if (state.marketScope === 'US') {
      list = list.filter(item => item.country === 'US' || ['NASDAQ', 'NYSE', 'NYSE American', 'US'].includes(item.exchange));
    } else if (state.marketScope === 'GLOBAL') {
      list = list.filter(item => item.country === 'GLOBAL' || ['GLOBAL', 'FX', 'COMEX', 'NYMEX', 'ICE', 'LME', 'CBOT'].includes(item.exchange));
    }

    // 3. Exchange Filter
    if (state.exchange !== 'ALL') {
      list = list.filter(item => item.exchange === state.exchange);
    }

    // 4. Asset Class Filter
    if (state.assetType === 'PENNY') {
      list = list.filter(item => item.isPenny || item.assetType === 'PENNY_EQUITY' || (item.currency === 'INR' && item.basePrice <= 20) || (item.currency === 'USD' && item.basePrice <= 5.0));
    } else if (state.assetType !== 'ALL') {
      list = list.filter(item => item.assetType === state.assetType);
    }

    // 5. Quick Filter
    const favs = MarketStore.getFavorites();
    const watch = MarketStore.getWatchlist();

    if (state.quickFilter === 'PINNED') {
      list = list.filter(item => favs.includes(item.symbol));
    } else if (state.quickFilter === 'WATCHLIST') {
      list = list.filter(item => watch.includes(item.symbol));
    } else if (state.quickFilter === 'PENNY') {
      list = list.filter(item => item.isPenny || item.assetType === 'PENNY_EQUITY' || (item.currency === 'INR' && item.basePrice <= 20) || (item.currency === 'USD' && item.basePrice <= 5.0));
    } else if (state.quickFilter === 'SURGE') {
      list = list.filter(item => {
        const q = SecurityMaster._liveQuotes.get(item.symbol);
        const baseVol = (item.avgVolume20d || (q && q.avgVolume20d) || 1000000);
        return q && (q.volume >= baseVol * 2.0);
      });
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

      const isUS = ['US', 'NASDAQ', 'NYSE', 'NYSE American'].includes(sec.exchange);
      const isPennyStock = sec.isPenny || sec.assetType === 'PENNY_EQUITY' || (sec.currency === 'INR' && sec.basePrice <= 20) || (sec.currency === 'USD' && sec.basePrice <= 5.0);
      const baseVol = sec.avgVolume20d || (q && q.avgVolume20d) || 1000000;
      const volRatio = q.volume > 0 && baseVol > 0 ? (q.volume / baseVol) : 1.0;
      const isSurge = volRatio >= 2.0;

      return `
        <tr data-symbol="${sec.symbol}" id="row_${sec.symbol.replace(/[\^=]/g, '')}">
          <td class="th-pin">
            <button class="btn-icon-pin ${isFav ? 'active' : ''}" data-symbol="${sec.symbol}" title="Pin Favorite">
              <i class="fa-solid fa-thumbtack"></i>
            </button>
          </td>
          <td>
            <div class="sec-name-cell">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <button class="sec-title-btn" data-symbol="${sec.symbol}">${sec.name}</button>
                ${isPennyStock ? (isUS ? '<span class="badge-us-micro">US MICRO</span>' : '<span class="badge-penny-chip">PENNY</span>') : ''}
              </div>
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
            <div>${formatVolume(q.volume)}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);display:flex;align-items:center;justify-content:flex-end;gap:4px;">
              <span>20D: ${formatVolume(baseVol)}</span>
              ${isSurge ? `<span class="badge-surge-pill" style="font-size:0.58rem;padding:0 3px;">${volRatio.toFixed(1)}x</span>` : ''}
            </div>
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
    if (typeof TerminalBus !== 'undefined' && sec && sec.symbol) { TerminalBus.setSecurity(sec.symbol); }
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

    const badgeEl = document.getElementById('drawerAssetBadge');
    const titleEl = document.getElementById('drawerSecTitle');
    const subEl = document.getElementById('drawerSecSubtitle');
    const priceEl = document.getElementById('drawerPrice');
    const chgEl = document.getElementById('drawerChange');
    const peEl = document.getElementById('drawerPE');
    const betaEl = document.getElementById('drawerBeta');
    const volEl = document.getElementById('drawerVol');
    const high52El = document.getElementById('drawer52WHigh');

    if (badgeEl) badgeEl.textContent = sec.assetType;
    if (titleEl) titleEl.textContent = sec.symbol;
    if (subEl) subEl.textContent = `${sec.name} • ${sec.exchange}`;

    if (priceEl) priceEl.textContent = formatMoney(q.price, sec.currency);
    if (chgEl) {
      chgEl.textContent = `${isUp ? '+' : ''}${formatMoney(chg, sec.currency)} (${isUp ? '+' : ''}${chgPct.toFixed(2)}%)`;
      chgEl.className = `quote-change ${isUp ? 'text-emerald' : 'text-red'}`;
    }

    if (peEl) peEl.textContent = sec.pe ? sec.pe.toFixed(2) : '—';
    if (betaEl) betaEl.textContent = sec.beta ? sec.beta.toFixed(2) : '—';
    if (volEl) volEl.textContent = sec.vol ? `${(sec.vol * 100).toFixed(1)}%` : '—';
    if (high52El) high52El.textContent = formatMoney(q.high52w, sec.currency);

    // Check if penny stock and inject penny telemetry card
    const isPennyStock = sec.isPenny || sec.assetType === 'PENNY_EQUITY' || (sec.currency === 'INR' && sec.basePrice <= 20) || (sec.currency === 'USD' && sec.basePrice <= 5.0);
    let pennyBox = document.getElementById('drawerPennyTelemetryBox');
    if (isPennyStock) {
      const baseVol = sec.avgVolume20d || 1000000;
      const volRatio = Number(((q.volume || baseVol) / baseVol).toFixed(2));
      const stdVol = baseVol * 0.45;
      const zScore = Number((((q.volume || baseVol) - baseVol) / stdVol).toFixed(2));
      const circuitBand = sec.currency === 'USD' ? '±10% (US Microcap)' : (sec.basePrice < 5 ? '±5% (NSE/BSE)' : '±10% / ±20%');

      if (!pennyBox) {
        pennyBox = document.createElement('div');
        pennyBox.id = 'drawerPennyTelemetryBox';
        pennyBox.className = 'drawer-penny-box';
        const metricsGrid = document.querySelector('.drawer-metrics-grid');
        if (metricsGrid && metricsGrid.parentNode) {
          metricsGrid.parentNode.insertBefore(pennyBox, metricsGrid.nextSibling);
        }
      }

      pennyBox.innerHTML = `
        <div style="margin:14px 0;background:radial-gradient(100% 100% at 50% 0%, rgba(245,158,11,0.1) 0%, rgba(14,14,20,0.9) 100%);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-size:0.75rem;font-weight:800;color:#f59e0b;text-transform:uppercase;letter-spacing:0.04em;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-coins text-amber"></i> High-Beta Penny &amp; Microcap Telemetry
            </span>
            <span style="font-size:0.65rem;background:rgba(245,158,11,0.2);color:#fbbf24;padding:2px 8px;border-radius:4px;font-weight:700;border:1px solid rgba(245,158,11,0.35);">
              BAND: ${circuitBand}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.72rem;color:#a1a1aa;">
            <div>20D Baseline: <strong style="color:#fff;">${formatVolume(baseVol)}</strong></div>
            <div>Volume Surge: <strong style="color:#22d3ee;">${volRatio}x Multiple</strong></div>
            <div>Statistical Z: <strong style="color:#f59e0b;">${zScore >= 0 ? '+' : ''}${zScore}σ</strong></div>
            <div>Brownian Delta: <strong style="color:#51cf66;">Sub-Second Stochastic</strong></div>
          </div>
          <div id="drawerKatexFormula" style="padding:6px 10px;background:rgba(0,0,0,0.45);border-radius:6px;font-size:0.75rem;color:#e4e4e7;text-align:center;"></div>
        </div>
      `;

      const kEl = document.getElementById('drawerKatexFormula');
      if (kEl && typeof katex !== 'undefined') {
        try {
          katex.render(`\\text{Surge Ratio} = \\frac{${((q.volume || baseVol)/1e6).toFixed(2)}\\text{M}}{${(baseVol/1e6).toFixed(2)}\\text{M}} = ${volRatio}\\times \\quad (Z = ${zScore >= 0 ? '+' : ''}${zScore}\\sigma)`, kEl, { throwOnError: false });
        } catch (e) {
          kEl.textContent = `Surge Ratio: ${volRatio}x | Z-Score: ${zScore}σ`;
        }
      }
    } else if (pennyBox) {
      pennyBox.remove();
    }

    // Cross-Platform Links
    const linkDash = document.getElementById('drawerGoDashboard');
    const linkObs = document.getElementById('drawerGoObservatory');
    const linkLab = document.getElementById('drawerGoLearnLab');
    const linkTerm = document.getElementById('drawerGoTerminal');

    if (linkDash) linkDash.href = `index.html?symbol=${sec.symbol}`;
    if (linkObs) linkObs.href = `observatory.html?symbol=${sec.symbol}`;
    if (linkLab) linkLab.href = `learn.html?sec=${sec.symbol}`;
    if (linkTerm) linkTerm.href = `app.html?tickers=${sec.symbol}`;

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
    renderPennyStockMatrix('ALL');
    renderTable();
    setupRealtimeQuoteSubscription();
    setupCommandPalette();

    // 0. Wire Universal Penny Stock Radar Desk Controls
    document.querySelectorAll('#pennyMatrixFilter .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#pennyMatrixFilter .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPennyStockMatrix(btn.dataset.pfilter);
      });
    });

    const btnFilterTablePenny = document.getElementById('btnFilterTablePenny');
    if (btnFilterTablePenny) {
      btnFilterTablePenny.addEventListener('click', () => {
        state.assetType = 'PENNY';
        document.querySelectorAll('#assetTypeControl .seg-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.asset === 'PENNY');
        });
        state.currentPage = 1;
        renderTable();
        const tbl = document.getElementById('tickerMasterTable');
        if (tbl) tbl.scrollIntoView({ behavior: 'smooth' });
      });
    }

    const btnTogglePenny = document.getElementById('btnTogglePennyView');
    if (btnTogglePenny) {
      btnTogglePenny.addEventListener('click', () => {
        const grid = document.getElementById('pennyCardsGrid');
        if (grid) {
          const isHidden = window.getComputedStyle(grid).display === 'none';
          grid.style.display = isHidden ? 'grid' : 'none';
          btnTogglePenny.innerHTML = isHidden ? '<i class="fa-solid fa-table-cells-large text-cyan"></i> Matrix View' : '<i class="fa-solid fa-eye-slash text-muted"></i> Hide Matrix';
        }
      });
    }

    // Render KaTeX for Penny Formula Badge
    const badgeFormula = document.getElementById('pennyFormulaBadge');
    if (badgeFormula && typeof katex !== 'undefined') {
      try {
        katex.render("Z = \\frac{V_t - \\bar{V}_{20}}{\\sigma_{20}}", badgeFormula, { throwOnError: false });
      } catch (e) {}
    }

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

    // CSV Exporter
    const csvBtn = document.getElementById('btnExportTickerCsv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const rows = [
          ['Symbol', 'Name', 'Exchange', 'AssetType', 'Currency', 'Price', 'Change', 'ChangePct', 'PE', 'Beta', 'Sector']
        ];
        state.filteredSecurities.forEach(s => {
          const q = SecurityMaster._liveQuotes.get(s.symbol) || s;
          const chg = Number(((q.price || s.basePrice) - (q.previousClose || s.basePrice)).toFixed(2));
          const chgPct = q.previousClose > 0 ? Number(((chg / q.previousClose) * 100).toFixed(2)) : 0;
          rows.push([
            `"${s.symbol}"`,
            `"${s.name.replace(/"/g, '""')}"`,
            `"${s.exchange}"`,
            `"${s.assetType}"`,
            `"${s.currency}"`,
            q.price || s.basePrice,
            chg,
            chgPct,
            s.pe || '',
            s.beta || '',
            `"${s.sector || ''}"`
          ]);
        });
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `riskos_securities_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    // JSON Exporter
    const jsonBtn = document.getElementById('btnExportTickerJson');
    if (jsonBtn) {
      jsonBtn.addEventListener('click', () => {
        const data = state.filteredSecurities.map(s => {
          const q = SecurityMaster._liveQuotes.get(s.symbol) || s;
          return {
            ...s,
            liveQuote: q
          };
        });
        const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', jsonStr);
        link.setAttribute('download', `riskos_securities_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

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
          const cleanSym = u.symbol.replace(/[\^=]/g, '');
          const rowId = `row_${cleanSym}`;
          const row = document.getElementById(rowId);
          if (row) {
            const priceCell = row.querySelector('.cell-price');
            const chgCell = row.querySelector('.cell-chg');
            const chgPctCell = row.querySelector('.cell-chgpct');
            const volCell = row.querySelector('.cell-vol');

            if (priceCell) {
              priceCell.textContent = formatMoney(u.price, u.currency);
              priceCell.classList.remove('price-flash-up', 'price-flash-down');
              void priceCell.offsetWidth;
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
              const sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === u.symbol);
              const baseVol = sec && sec.avgVolume20d ? sec.avgVolume20d : 1000000;
              const ratio = u.volume / baseVol;
              volCell.innerHTML = `
                <div>${formatVolume(u.volume)}</div>
                <div style="font-size:0.65rem;color:var(--text-muted);display:flex;align-items:center;justify-content:flex-end;gap:4px;">
                  <span>20D: ${formatVolume(baseVol)}</span>
                  ${ratio >= 2.0 ? `<span class="badge-surge-pill" style="font-size:0.58rem;padding:0 3px;">${ratio.toFixed(1)}x</span>` : ''}
                </div>
              `;
            }
          }

          // 3. Update Penny Stock Card in Matrix Grid
          const pcard = document.getElementById(`pcard_${cleanSym}`);
          if (pcard) {
            const priceEl = pcard.querySelector('.pcard-price');
            const chgEl = pcard.querySelector('.pcard-chg');
            if (priceEl) {
              priceEl.textContent = formatMoney(u.price, u.currency);
            }
            if (chgEl) {
              chgEl.textContent = `${u.change >= 0 ? '▲ +' : '▼ '}${u.changePercent.toFixed(2)}%`;
              chgEl.className = `pcard-chg ${u.change >= 0 ? 'text-emerald' : 'text-red'}`;
            }
            pcard.classList.remove('card-flash-green', 'card-flash-red');
            void pcard.offsetWidth;
            pcard.classList.add(u.delta >= 0 ? 'card-flash-green' : 'card-flash-red');
          }
        });

        // 4. Update drawer if open
        if (state.activeDrawerSec) {
          const matching = updates.find(u => u.symbol === state.activeDrawerSec.symbol);
          if (matching) {
            const dPrice = document.getElementById('drawerPrice') || document.getElementById('drawerLivePrice');
            const dChg = document.getElementById('drawerChange') || document.getElementById('drawerLiveChg');
            if (dPrice) dPrice.textContent = formatMoney(matching.price, matching.currency);
            if (dChg) {
              const sign = matching.change >= 0 ? '+' : '';
              dChg.textContent = `${sign}${formatMoney(matching.change, matching.currency)} (${sign}${matching.changePercent.toFixed(2)}%)`;
              dChg.className = `quote-change ${matching.change >= 0 ? 'text-emerald' : 'text-red'}`;
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
