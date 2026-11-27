/**
 * RISKOS Universal Smart Alert Engine (OpenStock Architecture)
 * In-browser real-time price, statistical volume surge, and technical indicator alerts
 * with Web Audio synthesizer chimes, glassmorphic toast notifications, and persistent ledger.
 */

const UniversalAlerts = (() => {
  'use strict';

  const STORAGE_KEY_ALERTS = 'RISKOS_SMART_ALERTS_V1';
  const STORAGE_KEY_HISTORY = 'RISKOS_ALERT_HISTORY_V1';
  const COOLDOWN_MS = 60 * 1000; // 60-second cooldown per alert to avoid notification spam

  let alerts = [];
  let history = [];
  let audioCtx = null;
  let listeners = new Set();

  // ── 1. Initialization & Storage ───────────────────────────────────────────
  const loadState = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const rawAlerts = localStorage.getItem(STORAGE_KEY_ALERTS);
        const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        alerts = rawAlerts ? JSON.parse(rawAlerts) : getDefaultAlerts();
        history = rawHistory ? JSON.parse(rawHistory) : [];
      } else {
        alerts = getDefaultAlerts();
        history = [];
      }
    } catch (e) {
      alerts = getDefaultAlerts();
      history = [];
    }
  };

  const saveState = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 100)));
      }
    } catch (e) {
      // Ignore localStorage quota errors
    }
    notifyListeners();
  };

  const getDefaultAlerts = () => [
    {
      id: 'alt_rel_breakout',
      symbol: 'RELIANCE',
      type: 'PRICE_ABOVE',
      threshold: 1350.00,
      active: true,
      created: Date.now() - 86400000,
      lastTriggered: null,
      triggerCount: 0,
      note: 'Key structural resistance breakout'
    },
    {
      id: 'alt_tcs_vol',
      symbol: 'TCS',
      type: 'VOLUME_SURGE',
      threshold: 2.0, // 2x 20D baseline
      active: true,
      created: Date.now() - 43200000,
      lastTriggered: null,
      triggerCount: 0,
      note: 'Institutional accumulation volume shock'
    },
    {
      id: 'alt_nvda_rsi',
      symbol: 'NVDA',
      type: 'RSI_OVERBOUGHT',
      threshold: 72.0,
      active: true,
      created: Date.now() - 21600000,
      lastTriggered: null,
      triggerCount: 0,
      note: 'Momentum extension pullback trigger'
    }
  ];

  // ── 2. Web Audio Synthesizer Chime (Zero External Dependencies) ─────────────
  const playAlertChime = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      // Dual-tone institutional bell (D5: 587.33 Hz -> A5: 880.00 Hz)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {
      // Audio autoplay policy or headless environment silently handled
    }
  };

  // ── 3. In-App Glassmorphic Toast Notification ─────────────────────────────
  const showToast = (alert, sec, currentVal) => {
    if (typeof document === 'undefined') return;

    let container = document.getElementById('riskosAlertToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'riskosAlertToastContainer';
      container.className = 'riskos-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'riskos-alert-toast toast-enter';
    toast.dataset.alertId = alert.id;

    const formattedVal = typeof currentVal === 'number' ? currentVal.toFixed(2) : currentVal;
    const descText = formatTriggerDescription(alert, currentVal);

    toast.innerHTML = `
      <div class="toast-left-stripe"></div>
      <div class="toast-icon-wrap">
        <i class="fa-solid fa-bell toast-bell-icon"></i>
      </div>
      <div class="toast-content">
        <div class="toast-header-row">
          <span class="toast-ticker-badge">${alert.symbol}</span>
          <span class="toast-type-tag">${alert.type.replace(/_/g, ' ')}</span>
          <span class="toast-time">Just now</span>
        </div>
        <div class="toast-message">${descText}</div>
        ${alert.note ? `<div class="toast-note"><i class="fa-solid fa-quote-left"></i> ${alert.note}</div>` : ''}
      </div>
      <div class="toast-actions">
        <button class="toast-btn-inspect" data-symbol="${alert.symbol}" title="Inspect Instrument">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </button>
        <button class="toast-btn-dismiss" title="Dismiss">&times;</button>
      </div>
    `;

    // Bind inspect button
    const inspectBtn = toast.querySelector('.toast-btn-inspect');
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.openSecurityDrawer && sec) {
          window.openSecurityDrawer(sec);
        } else if (typeof document !== 'undefined') {
          const rowBtn = document.querySelector(`.sec-title-btn[data-symbol="${alert.symbol}"]`);
          if (rowBtn) rowBtn.click();
        }
        removeToast(toast);
      });
    }

    // Bind dismiss button
    const dismissBtn = toast.querySelector('.toast-btn-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => removeToast(toast));
    }

    container.prepend(toast);

    // Auto dismiss after 7.5 seconds
    setTimeout(() => {
      removeToast(toast);
    }, 7500);
  };

  const removeToast = (toast) => {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  const formatTriggerDescription = (alert, currentVal) => {
    switch (alert.type) {
      case 'PRICE_ABOVE':
        return `Price crossed ABOVE target of ${alert.threshold} (Current: ${currentVal})`;
      case 'PRICE_BELOW':
        return `Price crossed BELOW target of ${alert.threshold} (Current: ${currentVal})`;
      case 'PCT_MOVE':
        return `Intraday move crossed ±${alert.threshold}% (Current: ${currentVal}%)`;
      case 'VOLUME_SURGE':
        return `Volume surged to ${currentVal}x of 20-day baseline (Trigger: ${alert.threshold}x)`;
      case 'VOL_SPIKE':
        return `Annualized Volatility spiked to ${(currentVal * 100).toFixed(1)}% (Threshold: ${(alert.threshold * 100).toFixed(1)}%)`;
      case 'RSI_OVERSOLD':
        return `RSI crossed into Oversold territory: ${currentVal} (Threshold: < ${alert.threshold})`;
      case 'RSI_OVERBOUGHT':
        return `RSI crossed into Overbought territory: ${currentVal} (Threshold: > ${alert.threshold})`;
      default:
        return `Alert condition met for ${alert.symbol}`;
    }
  };

  // ── 4. Real-Time Alert Evaluation Engine ───────────────────────────────────
  const evaluateSecurity = (sec, liveQuote) => {
    if (!sec || !liveQuote) return [];
    const sym = sec.symbol;
    const activeAlerts = alerts.filter(a => a.active && a.symbol === sym);
    if (!activeAlerts.length) return [];

    const now = Date.now();
    const triggeredNow = [];

    const price = Number(liveQuote.price || sec.basePrice || 0);
    const prevClose = Number(liveQuote.previousClose || price);
    const chgPct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    const volume = Number(liveQuote.volume || 1000000);
    const baseVol = Number(sec.avgVolume20d || liveQuote.avgVolume20d || 1000000);
    const volMultiple = baseVol > 0 ? volume / baseVol : 1.0;
    const vol = Number(liveQuote.vol || sec.vol || 0.20);
    const rsi = Number(liveQuote.rsi || (50 + chgPct * 3)); // Approximate or real-time RSI

    for (const alert of activeAlerts) {
      // Cooldown check
      if (alert.lastTriggered && (now - alert.lastTriggered < COOLDOWN_MS)) {
        continue;
      }

      let triggered = false;
      let triggerValue = null;

      switch (alert.type) {
        case 'PRICE_ABOVE':
          if (price >= alert.threshold) {
            triggered = true;
            triggerValue = price;
          }
          break;
        case 'PRICE_BELOW':
          if (price <= alert.threshold) {
            triggered = true;
            triggerValue = price;
          }
          break;
        case 'PCT_MOVE':
          if (Math.abs(chgPct) >= alert.threshold) {
            triggered = true;
            triggerValue = chgPct.toFixed(2);
          }
          break;
        case 'VOLUME_SURGE':
          if (volMultiple >= alert.threshold) {
            triggered = true;
            triggerValue = volMultiple.toFixed(2);
          }
          break;
        case 'VOL_SPIKE':
          if (vol >= alert.threshold) {
            triggered = true;
            triggerValue = vol;
          }
          break;
        case 'RSI_OVERSOLD':
          if (rsi <= alert.threshold) {
            triggered = true;
            triggerValue = rsi.toFixed(1);
          }
          break;
        case 'RSI_OVERBOUGHT':
          if (rsi >= alert.threshold) {
            triggered = true;
            triggerValue = rsi.toFixed(1);
          }
          break;
      }

      if (triggered) {
        alert.lastTriggered = now;
        alert.triggerCount = (alert.triggerCount || 0) + 1;

        const eventRecord = {
          id: 'hist_' + now + '_' + Math.random().toString(36).substr(2, 4),
          alertId: alert.id,
          symbol: alert.symbol,
          type: alert.type,
          threshold: alert.threshold,
          triggeredValue: triggerValue,
          timestamp: now,
          note: alert.note
        };

        history.unshift(eventRecord);
        triggeredNow.push(eventRecord);

        // Execute Audio Chime & Visual Toast
        playAlertChime();
        showToast(alert, sec, triggerValue);
      }
    }

    if (triggeredNow.length > 0) {
      saveState();
    }

    return triggeredNow;
  };

  // ── 5. CRUD Management API ────────────────────────────────────────────────
  const addAlert = (alertData) => {
    if (!alertData.symbol || !alertData.type || alertData.threshold === undefined) {
      throw new Error('Symbol, type, and threshold are required to create an alert.');
    }

    const newAlert = {
      id: 'alt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      symbol: alertData.symbol.toUpperCase(),
      type: alertData.type,
      threshold: Number(alertData.threshold),
      active: true,
      created: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
      note: alertData.note ? String(alertData.note).trim() : ''
    };

    alerts.unshift(newAlert);
    saveState();
    return newAlert;
  };

  const toggleAlert = (id) => {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.active = !alert.active;
      saveState();
      return alert.active;
    }
    return false;
  };

  const removeAlert = (id) => {
    const origLen = alerts.length;
    alerts = alerts.filter(a => a.id !== id);
    if (alerts.length !== origLen) {
      saveState();
      return true;
    }
    return false;
  };

  const clearHistory = () => {
    history = [];
    saveState();
  };

  const getAlerts = () => [...alerts];
  const getHistory = () => [...history];
  const getAlertsForSymbol = (symbol) => alerts.filter(a => a.symbol === symbol.toUpperCase());

  const subscribe = (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };

  const notifyListeners = () => {
    listeners.forEach(cb => {
      try { cb({ alerts, history }); } catch (e) {}
    });
  };

  // ── 6. UI Modal Renderer ──────────────────────────────────────────────────
  const openAlertModal = (preselectedSymbol = '') => {
    if (typeof document === 'undefined') return;

    let modalOverlay = document.getElementById('universalAlertsModalOverlay');
    if (!modalOverlay) {
      modalOverlay = createAlertModalDOM();
      document.body.appendChild(modalOverlay);
    }

    const symInput = document.getElementById('newAlertSymbolInput');
    if (symInput && preselectedSymbol) {
      symInput.value = preselectedSymbol.toUpperCase();
      updateThresholdPlaceholder(preselectedSymbol);
    }

    renderModalTabsContent();
    modalOverlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeAlertModal = () => {
    const modalOverlay = document.getElementById('universalAlertsModalOverlay');
    if (modalOverlay) {
      modalOverlay.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  };

  const createAlertModalDOM = () => {
    const overlay = document.createElement('div');
    overlay.id = 'universalAlertsModalOverlay';
    overlay.className = 'alerts-modal-overlay';
    overlay.setAttribute('hidden', '');

    overlay.innerHTML = `
      <div class="alerts-modal-backdrop" id="alertsModalBackdrop"></div>
      <div class="alerts-modal-dialog" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="alerts-modal-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="alerts-modal-icon-badge">
              <i class="fa-solid fa-bell text-cyan"></i>
            </div>
            <div>
              <h3 class="alerts-modal-title">Smart Market Alerts Engine</h3>
              <p class="alerts-modal-sub">Real-time price thresholds, volume shocks &amp; technical triggers (OpenStock Suite)</p>
            </div>
          </div>
          <button class="alerts-modal-close-btn" id="alertsModalCloseBtn">&times;</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="alerts-modal-nav">
          <button class="alert-nav-btn active" data-tab="active">Active Alerts (<span id="alertActiveCount">0</span>)</button>
          <button class="alert-nav-btn" data-tab="create">+ Set New Alert</button>
          <button class="alert-nav-btn" data-tab="history">Trigger History (<span id="alertHistoryCount">0</span>)</button>
        </div>

        <!-- Tab 1: Active Alerts -->
        <div class="alerts-modal-tab active" id="alertTabActive">
          <div class="alerts-list-container" id="alertsListContainer">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Tab 2: Create Alert -->
        <div class="alerts-modal-tab" id="alertTabCreate">
          <form class="new-alert-form" id="newAlertForm">
            <div class="form-row">
              <div class="form-group">
                <label>Security / Ticker</label>
                <input type="text" id="newAlertSymbolInput" placeholder="e.g. RELIANCE, TCS, NVDA" required autocomplete="off" />
              </div>
              <div class="form-group">
                <label>Condition / Trigger</label>
                <select id="newAlertTypeSelect">
                  <option value="PRICE_ABOVE">Price Crosses Above (Breakout)</option>
                  <option value="PRICE_BELOW">Price Crosses Below (Breakdown)</option>
                  <option value="PCT_MOVE">Intraday Move >= ±X%</option>
                  <option value="VOLUME_SURGE">20D Volume Surge Multiple (e.g. 2.5x)</option>
                  <option value="VOL_SPIKE">Annualized Volatility Spike (> X%)</option>
                  <option value="RSI_OVERSOLD">RSI Oversold (< 30)</option>
                  <option value="RSI_OVERBOUGHT">RSI Overbought (> 70)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label id="newAlertThresholdLabel">Threshold Target Value</label>
                <input type="number" step="any" id="newAlertThresholdInput" placeholder="e.g. 1350.00" required />
              </div>
              <div class="form-group">
                <label>Optional Thesis Note</label>
                <input type="text" id="newAlertNoteInput" placeholder="e.g. Breakout above 52W high pivot" />
              </div>
            </div>

            <div class="form-submit-row">
              <button type="submit" class="btn-create-alert-submit">
                <i class="fa-solid fa-plus"></i> Arm Real-Time Alert
              </button>
            </div>
          </form>
        </div>

        <!-- Tab 3: History -->
        <div class="alerts-modal-tab" id="alertTabHistory">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:0.75rem;color:var(--text-muted);">Recorded triggered alerts with timestamp and values</span>
            <button class="btn-subtle-pill" id="btnClearAlertHistory"><i class="fa-solid fa-trash-can"></i> Clear Log</button>
          </div>
          <div class="alerts-history-container" id="alertsHistoryContainer">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>
    `;

    // Bind Backdrop & Close
    overlay.querySelector('#alertsModalBackdrop').addEventListener('click', closeAlertModal);
    overlay.querySelector('#alertsModalCloseBtn').addEventListener('click', closeAlertModal);

    // Bind Nav Tabs
    overlay.querySelectorAll('.alert-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.alert-nav-btn').forEach(b => b.classList.remove('active'));
        overlay.querySelectorAll('.alerts-modal-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tabEl = overlay.querySelector(`#alertTab${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`);
        if (tabEl) tabEl.classList.add('active');
      });
    });

    // Form submission
    const form = overlay.querySelector('#newAlertForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const symbol = overlay.querySelector('#newAlertSymbolInput').value;
      const type = overlay.querySelector('#newAlertTypeSelect').value;
      const threshold = overlay.querySelector('#newAlertThresholdInput').value;
      const note = overlay.querySelector('#newAlertNoteInput').value;

      try {
        addAlert({ symbol, type, threshold, note });
        form.reset();
        // Switch to active tab
        const activeNav = overlay.querySelector('.alert-nav-btn[data-tab="active"]');
        if (activeNav) activeNav.click();
        renderModalTabsContent();
      } catch (err) {
        alert(err.message);
      }
    });

    // Clear History Button
    const clearBtn = overlay.querySelector('#btnClearAlertHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearHistory();
        renderModalTabsContent();
      });
    }

    return overlay;
  };

  const updateThresholdPlaceholder = (sym) => {
    if (typeof window === 'undefined' || !window.SecurityMaster) return;
    const sec = window.SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === sym.toUpperCase());
    const threshInput = document.getElementById('newAlertThresholdInput');
    if (sec && threshInput) {
      const q = window.SecurityMaster._liveQuotes.get(sec.symbol);
      const current = q ? q.price : sec.basePrice;
      threshInput.value = (current * 1.05).toFixed(2);
    }
  };

  const renderModalTabsContent = () => {
    if (typeof document === 'undefined') return;

    const activeBadge = document.getElementById('alertActiveCount');
    const histBadge = document.getElementById('alertHistoryCount');
    if (activeBadge) activeBadge.textContent = alerts.filter(a => a.active).length;
    if (histBadge) histBadge.textContent = history.length;

    // Render Active List
    const listContainer = document.getElementById('alertsListContainer');
    if (listContainer) {
      if (!alerts.length) {
        listContainer.innerHTML = `
          <div class="alerts-empty-state">
            <i class="fa-regular fa-bell-slash" style="font-size:2rem;color:var(--text-muted);margin-bottom:8px;"></i>
            <p style="color:var(--text-secondary);font-size:0.85rem;">No alerts configured yet. Click "+ Set New Alert" to create one.</p>
          </div>
        `;
      } else {
        listContainer.innerHTML = alerts.map(a => `
          <div class="alert-item-card ${a.active ? '' : 'alert-item-disabled'}" data-id="${a.id}">
            <div class="alert-item-main">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="alert-sym-badge">${a.symbol}</span>
                <span class="alert-cond-badge">${a.type.replace(/_/g, ' ')}</span>
                <span class="alert-val-badge">${a.threshold}</span>
              </div>
              ${a.note ? `<div class="alert-item-note"><i class="fa-solid fa-tag"></i> ${a.note}</div>` : ''}
              <div class="alert-item-meta">
                <span>Created ${new Date(a.created).toLocaleDateString()}</span>
                <span>•</span>
                <span>Fired ${a.triggerCount || 0} times</span>
                ${a.lastTriggered ? `<span>• Last: ${new Date(a.lastTriggered).toLocaleTimeString()}</span>` : ''}
              </div>
            </div>
            <div class="alert-item-actions">
              <button class="alert-toggle-btn ${a.active ? 'active' : ''}" data-id="${a.id}" title="${a.active ? 'Pause Alert' : 'Resume Alert'}">
                <i class="fa-solid ${a.active ? 'fa-toggle-on text-emerald' : 'fa-toggle-off text-muted'}"></i>
              </button>
              <button class="alert-delete-btn" data-id="${a.id}" title="Delete Alert">
                <i class="fa-solid fa-trash-can text-red"></i>
              </button>
            </div>
          </div>
        `).join('');

        // Bind toggles & deletes
        listContainer.querySelectorAll('.alert-toggle-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            toggleAlert(btn.dataset.id);
            renderModalTabsContent();
          });
        });

        listContainer.querySelectorAll('.alert-delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            removeAlert(btn.dataset.id);
            renderModalTabsContent();
          });
        });
      }
    }

    // Render History List
    const histContainer = document.getElementById('alertsHistoryContainer');
    if (histContainer) {
      if (!history.length) {
        histContainer.innerHTML = `
          <div class="alerts-empty-state">
            <i class="fa-solid fa-clock-rotate-left" style="font-size:1.8rem;color:var(--text-muted);margin-bottom:8px;"></i>
            <p style="color:var(--text-secondary);font-size:0.85rem;">No triggers recorded yet. When a condition triggers, it appears here.</p>
          </div>
        `;
      } else {
        histContainer.innerHTML = history.slice(0, 50).map(h => `
          <div class="alert-history-card">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="pulse-dot"></span>
              <strong style="color:#fff;font-size:0.8rem;">${h.symbol}</strong>
              <span style="font-size:0.7rem;color:var(--accent-cyan);">${h.type.replace(/_/g, ' ')}</span>
              <span style="font-size:0.7rem;color:var(--text-secondary);">Triggered at <strong style="color:#fff;">${h.triggeredValue}</strong> (Target: ${h.threshold})</span>
            </div>
            <span style="font-size:0.65rem;color:var(--text-muted);">${new Date(h.timestamp).toLocaleTimeString()} • ${new Date(h.timestamp).toLocaleDateString()}</span>
          </div>
        `).join('');
      }
    }
  };

  // Initialize on load
  loadState();

  return {
    addAlert,
    toggleAlert,
    removeAlert,
    getAlerts,
    getHistory,
    getAlertsForSymbol,
    evaluateSecurity,
    playAlertChime,
    showToast,
    openAlertModal,
    closeAlertModal,
    subscribe,
    clearHistory
  };
})();

// Attach globally
if (typeof window !== 'undefined') {
  window.UniversalAlerts = UniversalAlerts;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UniversalAlerts };
}
