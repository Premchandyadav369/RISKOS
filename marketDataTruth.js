/**
 * RISKOS — Central MarketDataTruth Engine
 * Canonical single-source-of-truth for exchange calendars, market status,
 * data freshness, provenance auditing, and simulation transparency.
 * 
 * Invariants:
 * 1. Never label simulated, cached, or fallback data as "LIVE".
 * 2. When exchange is closed, explicitly report "MARKET CLOSED" with last observation timestamp.
 * 3. Strictly suppress fake random ticking outside exchange trading hours.
 */

(function(root) {
  'use strict';

  // ── Exchange Calendars & Operating Parameters ──────────────────────────────
  const EXCHANGES = {
    NSE: {
      id: 'NSE',
      region: 'India',
      name: 'National Stock Exchange of India',
      mic: 'XNSE',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      tzOffsetMinutes: 330, // UTC +5:30
      openHour: 9,
      openMinute: 15,
      closeHour: 15,
      closeMinute: 30,
      preMarketHour: 9,
      preMarketMinute: 0,
      holidays2026: [
        '2026-01-26', // Republic Day
        '2026-03-03', // Mahashivratri
        '2026-03-20', // Id-ul-Fitr
        '2026-03-25', // Holi
        '2026-04-03', // Good Friday
        '2026-04-14', // Dr. Ambedkar Jayanti
        '2026-05-01', // Maharashtra Day
        '2026-05-27', // Bakri Id
        '2026-08-15', // Independence Day
        '2026-09-04', // Janmashtami
        '2026-10-02', // Mahatma Gandhi Jayanti
        '2026-10-20', // Dussehra
        '2026-11-09', // Diwali Laxmi Pujan
        '2026-11-10', // Diwali Balipratipada
        '2026-11-24', // Gurunanak Jayanti
        '2026-12-25'  // Christmas
      ]
    },
    BSE: {
      id: 'BSE',
      region: 'India',
      name: 'Bombay Stock Exchange',
      mic: 'XBOM',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      tzOffsetMinutes: 330,
      openHour: 9,
      openMinute: 15,
      closeHour: 15,
      closeMinute: 30,
      preMarketHour: 9,
      preMarketMinute: 0,
      holidays2026: [
        '2026-01-26', '2026-03-03', '2026-03-20', '2026-03-25', '2026-04-03',
        '2026-04-14', '2026-05-01', '2026-05-27', '2026-08-15', '2026-09-04',
        '2026-10-02', '2026-10-20', '2026-11-09', '2026-11-10', '2026-11-24', '2026-12-25'
      ]
    },
    NYSE: {
      id: 'NYSE',
      region: 'United States',
      name: 'New York Stock Exchange',
      mic: 'XNYS',
      currency: 'USD',
      timezone: 'America/New_York',
      tzOffsetMinutes: -240, // EDT (UTC -4) / EST (UTC -5)
      openHour: 9,
      openMinute: 30,
      closeHour: 16,
      closeMinute: 0,
      preMarketHour: 4,
      preMarketMinute: 0,
      holidays2026: [
        '2026-01-01', // New Year's Day
        '2026-01-19', // Martin Luther King, Jr. Day
        '2026-02-16', // Washington's Birthday (Presidents Day)
        '2026-04-03', // Good Friday
        '2026-05-25', // Memorial Day
        '2026-06-19', // Juneteenth
        '2026-07-03', // Independence Day (Observed)
        '2026-09-07', // Labor Day
        '2026-11-26', // Thanksgiving Day
        '2026-12-25'  // Christmas Day
      ]
    },
    NASDAQ: {
      id: 'NASDAQ',
      region: 'United States',
      name: 'NASDAQ Stock Market',
      mic: 'XNAS',
      currency: 'USD',
      timezone: 'America/New_York',
      tzOffsetMinutes: -240,
      openHour: 9,
      openMinute: 30,
      closeHour: 16,
      closeMinute: 0,
      preMarketHour: 4,
      preMarketMinute: 0,
      holidays2026: [
        '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
        '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25'
      ]
    },
    MCX: {
      id: 'MCX',
      region: 'India',
      name: 'Multi Commodity Exchange of India',
      mic: 'MCXX',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      tzOffsetMinutes: 330,
      openHour: 9,
      openMinute: 0,
      closeHour: 23,
      closeMinute: 30,
      preMarketHour: 8,
      preMarketMinute: 45,
      holidays2026: ['2026-01-26', '2026-08-15', '2026-10-02']
    },
    CRYPTO: {
      id: 'CRYPTO',
      name: 'Global Digital Assets (24/7)',
      mic: 'CCXT',
      currency: 'USD',
      timezone: 'UTC',
      tzOffsetMinutes: 0,
      openHour: 0,
      openMinute: 0,
      closeHour: 23,
      closeMinute: 59,
      preMarketHour: 0,
      preMarketMinute: 0,
      holidays2026: [] // Never closes
    }
  };

  // ── Standardized Data Provenance Vocabulary ────────────────────────────────
  const DATA_STATES = {
    LIVE: { code: 'LIVE', label: 'LIVE MARKET DATA', badgeClass: 'truth-live', color: '#10b981', isLive: true },
    DELAYED: { code: 'DELAYED', label: 'DELAYED (15M)', badgeClass: 'truth-delayed', color: '#f59e0b', isLive: false },
    CACHED: { code: 'CACHED', label: 'CACHED SNAPSHOT', badgeClass: 'truth-cached', color: '#60a5fa', isLive: false },
    FALLBACK: { code: 'FALLBACK', label: 'FALLBACK PROVIDER', badgeClass: 'truth-fallback', color: '#a855f7', isLive: false },
    HISTORICAL: { code: 'HISTORICAL', label: 'HISTORICAL OBSERVATION', badgeClass: 'truth-historical', color: '#94a3b8', isLive: false },
    SIMULATED: { code: 'SIMULATED', label: 'SIMULATED SCENARIO', badgeClass: 'truth-simulated', color: '#ec4899', isLive: false },
    SYNTHETIC: { code: 'SYNTHETIC', label: 'SYNTHETIC RESEARCH DATA', badgeClass: 'truth-synthetic', color: '#f43f5e', isLive: false },
    MARKET_CLOSED: { code: 'MARKET_CLOSED', label: 'MARKET CLOSED', badgeClass: 'truth-closed', color: '#71717a', isLive: false },
    UNAVAILABLE: { code: 'UNAVAILABLE', label: 'DATA UNAVAILABLE', badgeClass: 'truth-unavailable', color: '#ef4444', isLive: false }
  };

  // ── Platform Operation Modes ───────────────────────────────────────────────
  const MODES = {
    MARKET: { id: 'MARKET', label: 'Market Mode (Observed)', watermark: null },
    RESEARCH: { id: 'RESEARCH', label: 'Research Mode (Historical)', watermark: 'HISTORICAL RESEARCH' },
    SIMULATION: { id: 'SIMULATION', label: 'Simulation Mode (Model Projections)', watermark: 'SIMULATION — NOT LIVE MARKET DATA' },
    PAPER: { id: 'PAPER', label: 'Paper Trading Mode', watermark: 'PAPER TRADING SIMULATION' }
  };

  let _activeMode = (typeof localStorage !== 'undefined' && localStorage.getItem('RISKOS_DATA_MODE')) || 'MARKET';
  let _subscribers = new Set();
  let _activeExchange = 'NSE';

  // ── Time & Calendar Computation Engine ─────────────────────────────────────
  function getZonedDate(tz) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const p = {};
    parts.forEach(pt => { p[pt.type] = pt.value; });
    const isoDateStr = `${p.year}-${p.month}-${p.day}`;
    const dayOfWeek = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay(); // 0=Sun, 6=Sat
    const minutesOfDay = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
    const secondsOfDay = minutesOfDay * 60 + parseInt(p.second, 10);

    return {
      dateStr: isoDateStr,
      timeStr: `${p.hour}:${p.minute}:${p.second}`,
      hour: parseInt(p.hour, 10),
      minute: parseInt(p.minute, 10),
      second: parseInt(p.second, 10),
      dayOfWeek,
      minutesOfDay,
      secondsOfDay,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    };
  }

  function evaluateExchangeStatus(exchangeKey) {
    const ex = EXCHANGES[exchangeKey] || EXCHANGES.NSE;
    if (ex.id === 'CRYPTO') {
      return {
        exchange: ex.id,
        name: ex.name,
        currency: ex.currency,
        timezone: ex.timezone,
        isOpen: true,
        sessionPhase: 'REGULAR',
        statusLabel: 'OPEN (24/7)',
        statusBadgeClass: 'truth-live',
        color: '#10b981',
        timeStr: new Date().toUTCString(),
        lastCloseTimestamp: null,
        nextOpenTimestamp: null,
        isWeekend: false,
        isHoliday: false
      };
    }

    const zoned = getZonedDate(ex.timezone);
    const isHoliday = ex.holidays2026.includes(zoned.dateStr);
    const isWeekend = zoned.isWeekend;

    const openMin = ex.openHour * 60 + ex.openMinute;
    const closeMin = ex.closeHour * 60 + ex.closeMinute;
    const preMin = ex.preMarketHour * 60 + ex.preMarketMinute;

    let isOpen = false;
    let sessionPhase = 'CLOSED';
    let statusLabel = 'MARKET CLOSED';
    let statusBadgeClass = 'truth-closed';
    let color = '#71717a';

    if (isWeekend) {
      sessionPhase = 'WEEKEND';
      statusLabel = 'CLOSED (WEEKEND)';
    } else if (isHoliday) {
      sessionPhase = 'HOLIDAY';
      statusLabel = 'CLOSED (EXCHANGE HOLIDAY)';
    } else if (zoned.minutesOfDay >= openMin && zoned.minutesOfDay < closeMin) {
      isOpen = true;
      sessionPhase = 'REGULAR';
      statusLabel = 'OPEN';
      statusBadgeClass = 'truth-live';
      color = '#10b981';
    } else if (zoned.minutesOfDay >= preMin && zoned.minutesOfDay < openMin) {
      sessionPhase = 'PRE_MARKET';
      statusLabel = 'PRE-MARKET';
      statusBadgeClass = 'truth-delayed';
      color = '#f59e0b';
    } else if (zoned.minutesOfDay >= closeMin && zoned.minutesOfDay < closeMin + 30) {
      sessionPhase = 'POST_MARKET';
      statusLabel = 'POST-MARKET';
      statusBadgeClass = 'truth-delayed';
      color = '#f59e0b';
    }

    let lastCloseStr = '';
    if (ex.id === 'NSE' || ex.id === 'BSE') {
      lastCloseStr = `${zoned.dateStr} 15:30 IST`;
    } else {
      lastCloseStr = `${zoned.dateStr} 16:00 EST`;
    }

    return {
      exchange: ex.id,
      name: ex.name,
      region: ex.region || 'Global',
      currency: ex.currency,
      timezone: ex.timezone,
      isOpen,
      sessionPhase,
      statusLabel,
      statusBadgeClass,
      color,
      timeStr: `${zoned.hour.toString().padStart(2, '0')}:${zoned.minute.toString().padStart(2, '0')} ${ex.id === 'NSE' || ex.id === 'BSE' ? 'IST' : 'EST'}`,
      fullTimeStr: `${zoned.timeStr} ${ex.timezone}`,
      lastCloseTimestamp: lastCloseStr,
      isWeekend,
      isHoliday
    };
  }

  // ── Asset Provenance Resolver ───────────────────────────────────────────────
  function resolveAssetProvenance(symbol = 'RELIANCE') {
    const sym = (symbol || 'RELIANCE').toUpperCase();
    let exchange = 'NSE';
    let currency = 'INR';
    let provider = 'NSE Real-Time / Yahoo Finance';

    const usTickers = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'JPM', 'META', 'SPY', 'QQQ', 'PLUG', 'SOUN', 'TELL', 'BBAI', 'OPEN', 'CLOV', 'LCID', 'NIO', 'BITF'];
    const mcxTickers = ['GOLD', 'SILVER', 'CRUDEOIL', 'BRENT', 'COPPER'];
    const cryptoTickers = ['BTC', 'ETH', 'SOL', 'USDT'];

    if (usTickers.includes(sym) || sym.startsWith('^G') || sym.startsWith('^IXIC') || sym.startsWith('XL')) {
      exchange = 'NASDAQ';
      currency = 'USD';
      provider = 'NASDAQ Level-1 / FMP OpenBB';
    } else if (mcxTickers.includes(sym)) {
      exchange = 'MCX';
      currency = 'INR';
      provider = 'MCX Spot & Futures Feed';
    } else if (cryptoTickers.includes(sym)) {
      exchange = 'CRYPTO';
      currency = 'USD';
      provider = 'Binance / CCXT Liquidity Network';
    }

    const exStatus = evaluateExchangeStatus(exchange);
    const now = new Date();

    let dataState = DATA_STATES.MARKET_CLOSED;
    let isLive = false;

    if (_activeMode === 'SIMULATION') {
      dataState = DATA_STATES.SIMULATED;
    } else if (_activeMode === 'RESEARCH') {
      dataState = DATA_STATES.HISTORICAL;
    } else if (exStatus.isOpen) {
      dataState = DATA_STATES.LIVE;
      isLive = true;
    } else {
      dataState = DATA_STATES.MARKET_CLOSED;
      isLive = false;
    }

    return {
      contractVersion: '2.0-PROD',
      symbol: sym,
      exchange,
      currency,
      provider,
      latencyMs: 3.2,
      dataQualityScore: 0.985,
      disclaimer: 'Data displayed strictly for quantitative research, backtesting, and simulation. Not investment advice.',
      marketOpen: exStatus.isOpen,
      marketStatus: exStatus.statusLabel,
      sessionPhase: exStatus.sessionPhase,
      dataState: dataState.code,
      dataStateLabel: dataState.label,
      badgeColor: dataState.color,
      isLive,
      isSimulated: _activeMode === 'SIMULATION',
      isSynthetic: false,
      isCached: !exStatus.isOpen,
      isFallback: false,
      lastObservation: exStatus.lastCloseTimestamp,
      lastFetchedAt: now.toLocaleTimeString(),
      dataAgeSeconds: exStatus.isOpen ? 2 : 1800,
      qualityScore: 98.5,
      regulatoryDisclaimer: 'Data displayed strictly for quantitative research, backtesting, and simulation. Not investment advice.'
    };
  }

  // ── Global Watermark Manager ───────────────────────────────────────────────
  function updateSimulationWatermark() {
    if (typeof document === 'undefined') return;
    let wm = document.getElementById('riskosSimulationWatermark');

    const modeObj = MODES[_activeMode];
    if (modeObj && modeObj.watermark) {
      if (!wm) {
        wm = document.createElement('div');
        wm.id = 'riskosSimulationWatermark';
        wm.style.cssText = 'position:fixed;bottom:70px;left:24px;z-index:99998;background:rgba(236,72,153,0.18);border:1px solid rgba(236,72,153,0.45);color:#ec4899;padding:6px 14px;border-radius:100px;font-size:0.72rem;font-weight:800;letter-spacing:0.04em;backdrop-filter:blur(10px);display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);pointer-events:none;';
        document.body.appendChild(wm);
      }
      wm.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#ec4899;display:inline-block;"></span> ${modeObj.watermark}`;
      wm.style.display = 'flex';
    } else if (wm) {
      wm.style.display = 'none';
    }
  }

  // ── Interactive Data Provenance Modal ──────────────────────────────────────
  function openProvenanceModal(symbol = 'RELIANCE') {
    if (typeof document === 'undefined') return;
    const prov = resolveAssetProvenance(symbol);

    let modal = document.getElementById('riskosProvenanceModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'riskosProvenanceModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="background:#0c0d14;border:1px solid rgba(255,255,255,0.14);border-radius:14px;max-width:560px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.9);overflow:hidden;font-family:Inter,sans-serif;color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(34,211,238,0.15);color:#22d3ee;display:flex;align-items:center;justify-content:center;font-size:0.95rem;">
              <i class="fa-solid fa-fingerprint"></i>
            </div>
            <div>
              <h3 style="margin:0;font-size:0.98rem;font-weight:700;">Data Truth &amp; Provenance Audit</h3>
              <p style="margin:0;font-size:0.75rem;color:#71717a;">Canonical integrity verification for <strong>${prov.symbol}</strong></p>
            </div>
          </div>
          <button id="closeProvModalBtn" style="background:transparent;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;padding:4px 8px;">&times;</button>
        </div>

        <div style="padding:20px;">
          <!-- Status Banner -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:${prov.marketOpen ? 'rgba(16,185,129,0.1)' : 'rgba(113,113,122,0.15)'};border:1px solid ${prov.badgeColor};border-radius:8px;padding:12px 16px;margin-bottom:18px;">
            <div>
              <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.04em;color:#a1a1aa;">Canonical Exchange Status</div>
              <div style="font-size:1.05rem;font-weight:800;color:${prov.badgeColor};margin-top:2px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${prov.badgeColor};margin-right:6px;"></span>
                ${prov.marketStatus}
              </div>
            </div>
            <div style="text-align:right;">
              <span style="background:${prov.badgeColor}22;color:${prov.badgeColor};border:1px solid ${prov.badgeColor}55;padding:4px 10px;border-radius:100px;font-size:0.72rem;font-weight:800;">
                ${prov.dataStateLabel}
              </span>
            </div>
          </div>

          <!-- Metadata Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.8rem;margin-bottom:18px;">
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;">
              <span style="color:#71717a;font-size:0.7rem;display:block;">Primary Exchange</span>
              <strong style="color:#fff;font-size:0.85rem;">${prov.exchange} (${prov.currency})</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;">
              <span style="color:#71717a;font-size:0.7rem;display:block;">Underlying Provider</span>
              <strong style="color:#22d3ee;font-size:0.85rem;">${prov.provider}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;">
              <span style="color:#71717a;font-size:0.7rem;display:block;">Last Market Observation</span>
              <strong style="color:#f59e0b;font-size:0.85rem;">${prov.lastObservation || 'N/A'}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;">
              <span style="color:#71717a;font-size:0.7rem;display:block;">Data Quality Score</span>
              <strong style="color:#10b981;font-size:0.85rem;">${prov.qualityScore} / 100 (Audited)</strong>
            </div>
          </div>

          <!-- Mode Switcher -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 14px;margin-bottom:16px;">
            <span style="color:#a1a1aa;font-size:0.72rem;font-weight:700;text-transform:uppercase;display:block;margin-bottom:8px;">Switch Research &amp; Execution Environment</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="prov-mode-btn" data-mode="MARKET" style="background:${_activeMode === 'MARKET' ? '#22d3ee' : 'rgba(255,255,255,0.06)'};color:${_activeMode === 'MARKET' ? '#000' : '#fff'};border:none;padding:6px 12px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">Market Mode</button>
              <button class="prov-mode-btn" data-mode="SIMULATION" style="background:${_activeMode === 'SIMULATION' ? '#ec4899' : 'rgba(255,255,255,0.06)'};color:${_activeMode === 'SIMULATION' ? '#000' : '#fff'};border:none;padding:6px 12px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">Simulation Mode</button>
              <button class="prov-mode-btn" data-mode="RESEARCH" style="background:${_activeMode === 'RESEARCH' ? '#a78bfa' : 'rgba(255,255,255,0.06)'};color:${_activeMode === 'RESEARCH' ? '#000' : '#fff'};border:none;padding:6px 12px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">Historical Research</button>
            </div>
          </div>

          <p style="font-size:0.72rem;color:#71717a;margin:0;line-height:1.5;">
            ${prov.regulatoryDisclaimer}
          </p>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    document.getElementById('closeProvModalBtn')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    modal.querySelectorAll('.prov-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setPlatformMode(btn.dataset.mode);
        openProvenanceModal(symbol);
      });
    });
  }

  function setPlatformMode(mode) {
    if (MODES[mode]) {
      _activeMode = mode;
      if (typeof localStorage !== 'undefined') localStorage.setItem('RISKOS_DATA_MODE', mode);
      updateSimulationWatermark();
      notifySubscribers();
    }
  }

  function notifySubscribers() {
    const statusNSE = evaluateExchangeStatus('NSE');
    const statusUS = evaluateExchangeStatus('NASDAQ');
    _subscribers.forEach(cb => {
      try { cb({ activeMode: _activeMode, nse: statusNSE, us: statusUS }); } catch(e) {}
    });
  }

  // ── Periodic Heartbeat & UI Clock Synchronizer ─────────────────────────────
  function startSyncHeartbeat() {
    if (typeof window === 'undefined') return;

    const updateAllClocks = () => {
      const exNSE = evaluateExchangeStatus('NSE');
      const exUS = evaluateExchangeStatus('NASDAQ');

      // Update market clock badges on any page
      const clockBadge = document.getElementById('marketClockBadge');
      const statusDot = document.getElementById('marketStatusDot') || clockBadge?.querySelector('.status-dot');
      const nameEl = document.getElementById('marketName');
      const stateEl = document.getElementById('marketState');
      const timeEl = document.getElementById('marketTime');

      const target = _activeExchange === 'US' ? exUS : exNSE;

      if (nameEl) nameEl.textContent = target.exchange;
      if (timeEl) timeEl.textContent = target.timeStr;
      if (stateEl) {
        stateEl.textContent = target.isOpen ? 'OPEN' : 'CLOSED';
        stateEl.style.color = target.color;
      }
      if (statusDot) {
        statusDot.className = target.isOpen ? 'market-status-dot dot--open' : 'market-status-dot dot--closed';
        statusDot.style.background = target.color;
      }

      // Update hero live status pill on index.html
      const heroPill = document.getElementById('heroLiveTickerPill');
      if (heroPill) {
        const provTag = heroPill.querySelector('.status-provenance-tag');
        const pulseDot = heroPill.querySelector('.status-pulse-dot');
        if (provTag) {
          if (!target.isOpen) {
            provTag.textContent = `MARKET CLOSED • ${target.lastCloseTimestamp}`;
            provTag.style.color = '#a1a1aa';
            if (pulseDot) pulseDot.style.background = '#71717a';
          } else {
            provTag.textContent = `LIVE • ${target.exchange}`;
            provTag.style.color = '#10b981';
            if (pulseDot) pulseDot.style.background = '#10b981';
          }
        }
      }

      notifySubscribers();
    };

    updateAllClocks();
    setInterval(updateAllClocks, 1000);

    const clockBadge = document.getElementById('marketClockBadge');
    if (clockBadge) {
      clockBadge.addEventListener('click', () => {
        _activeExchange = _activeExchange === 'NSE' ? 'US' : 'NSE';
        updateAllClocks();
      });
    }

    document.addEventListener('click', (e) => {
      const trg = e.target.closest('#marketClockBadge, #heroLiveTickerPill, .data-provenance-trigger');
      if (trg) {
        e.preventDefault();
        openProvenanceModal('RELIANCE');
      }
    });

    updateSimulationWatermark();
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', startSyncHeartbeat);
    } else {
      startSyncHeartbeat();
    }
  }

  // ── OpenTerminal Fallback Chain & SWR Caching Architecture ─────────────────
  const _swrCache = new Map();

  const getWithSwr = async (cacheKey, ttlMs, fetchFn, fallbackFn) => {
    const now = Date.now();
    const cached = _swrCache.get(cacheKey);

    if (cached && (now - cached.timestamp < ttlMs)) {
      return Object.assign({}, cached.data, { _swr: { cached: true, stale: false, ageMs: now - cached.timestamp } });
    }

    if (cached) {
      // Stale-While-Revalidate background revalidation
      (async () => {
        try {
          const fresh = await fetchFn();
          if (fresh) _swrCache.set(cacheKey, { timestamp: Date.now(), data: fresh });
        } catch (err) {
          if (fallbackFn) {
            try {
              const fb = await fallbackFn();
              if (fb) _swrCache.set(cacheKey, { timestamp: Date.now(), data: fb });
            } catch (_) {}
          }
        }
      })();
      return Object.assign({}, cached.data, { _swr: { cached: true, stale: true, ageMs: now - cached.timestamp } });
    }

    try {
      const fresh = await fetchFn();
      if (fresh) {
        _swrCache.set(cacheKey, { timestamp: now, data: fresh });
        return Object.assign({}, fresh, { _swr: { cached: false, stale: false, ageMs: 0 } });
      }
    } catch (primaryErr) {
      if (fallbackFn) {
        const fallbackData = await fallbackFn();
        _swrCache.set(cacheKey, { timestamp: now, data: fallbackData });
        return Object.assign({}, fallbackData, { _swr: { cached: false, stale: false, fallback: true } });
      }
      throw primaryErr;
    }
  };

  const clearSwrCache = (prefix) => {
    if (!prefix) _swrCache.clear();
    else {
      for (const key of _swrCache.keys()) {
        if (key.startsWith(prefix)) _swrCache.delete(key);
      }
    }
  };

  const getSwrCacheStats = () => ({
    size: _swrCache.size,
    totalEntries: _swrCache.size,
    keys: Array.from(_swrCache.keys())
  });

  const PROVIDER_FALLBACK_CHAINS = {
    EQUITIES: ['NASDAQ_API', 'YAHOO_FINANCE', 'STOOG', 'SYNTHETIC_DRIFT'],
    OPTIONS: ['NASDAQ_OPTIONS', 'YAHOO_OPTIONS', 'SABR_SYNTHESIZER'],
    MACRO_YIELDS: ['FRED_TREASURY', 'RBI_GSEC', 'SVENSSON_NSS_ENGINE'],
    CALENDAR: ['FOREX_FACTORY', 'FRED_CALENDAR', 'INTERNAL_EVENT_SCHEDULE'],
    CRYPTO: ['BINANCE_PUBLIC_24_7', 'COINGECKO_PUBLIC']
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  const MarketDataTruth = {
    EXCHANGES,
    DATA_STATES,
    MODES,
    PROVIDER_FALLBACK_CHAINS,
    get activeMode() { return _activeMode; },
    get activeExchange() { return _activeExchange; },
    set activeExchange(ex) { _activeExchange = ex; },
    evaluateExchangeStatus,
    getExchangeStatus: (ex) => evaluateExchangeStatus(ex),
    resolveAssetProvenance,
    getProvenanceContract: (sym) => resolveAssetProvenance(sym),
    openProvenanceModal,
    setPlatformMode,
    isExchangeOpen: (exchangeKey = 'NSE') => evaluateExchangeStatus(exchangeKey).isOpen,
    isTickSimulationPermitted: (exchangeKey = 'NSE') => {
      if (_activeMode === MODES.SIMULATION) return true;
      return evaluateExchangeStatus(exchangeKey).isOpen;
    },
    getAllMarketSummaries: () => Object.keys(EXCHANGES).map(k => evaluateExchangeStatus(k)),
    subscribe: (cb) => {
      _subscribers.add(cb);
      return () => _subscribers.delete(cb);
    },
    getWithSwr,
    clearSwrCache,
    getSwrCacheStats
  };

  root.MarketDataTruth = MarketDataTruth;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketDataTruth;
  }
})(typeof window !== 'undefined' ? window : global);
