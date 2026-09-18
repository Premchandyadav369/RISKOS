/**
 * RISKOS — CROSS-TAB REAL-TIME SESSION SYNCHRONIZER (sessionSync.js)
 * High-performance, zero-latency browser state synchronizer utilizing HTML5 BroadcastChannel
 * with transparent localStorage storage event fallback for legacy clients.
 * 
 * Synchronizes:
 *  - Active Security (RELIANCE.NS, NVDA, TCS.NS, etc.)
 *  - Active Base Currency (INR <-> USD)
 *  - Global Terminal Visual Theme (cyber-dark, bloomberg-amber, high-contrast)
 *  - Live Tick Broadcasts & Global Sync Invocations
 */

((root) => {
  'use strict';

  const CHANNEL_NAME = 'riskos_session_channel';
  const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

  let channel = null;
  const listeners = new Map();

  // Initialize BroadcastChannel if supported
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };
    } catch (err) {
      console.warn('[SessionSync] BroadcastChannel init error, falling back to storage events:', err);
    }
  }

  // Transparent storage event fallback
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'riskos_sync_event_payload' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data && data.senderTabId !== TAB_ID) {
            handleIncomingMessage(data);
          }
        } catch (e) {}
      }
    });
  }

  const handleIncomingMessage = (payload) => {
    if (!payload || payload.senderTabId === TAB_ID) return;

    const { type, data } = payload;
    
    // Dispatch to registered event listeners
    if (listeners.has(type)) {
      listeners.get(type).forEach((cb) => {
        try { cb(data, payload); } catch (err) { console.error('[SessionSync] Callback error:', err); }
      });
    }

    // Default built-in reactions
    if (type === 'SECURITY_CHANGE' && data && data.symbol) {
      if (root.SecurityMaster && typeof root.SecurityMaster.resolveQuote === 'function') {
        root.SecurityMaster.resolveQuote(data.symbol).catch(() => {});
      }
      // Update any ticker input on screen
      const tickerInput = document.getElementById('ticker-input') || document.getElementById('tickerSearchInput');
      if (tickerInput && tickerInput.value !== data.symbol) {
        tickerInput.value = data.symbol;
      }
    } else if (type === 'CURRENCY_CHANGE' && data && data.currency) {
      const curBtn = document.getElementById('btnCurrencyToggle');
      if (curBtn) {
        curBtn.textContent = data.currency;
      }
    } else if (type === 'THEME_CHANGE' && data && data.theme) {
      if (root.ThemeEngine && typeof root.ThemeEngine.applyTheme === 'function') {
        root.ThemeEngine.applyTheme(data.theme, false);
      }
    }
  };

  const publish = (type, data = {}) => {
    const payload = {
      type,
      data,
      senderTabId: TAB_ID,
      timestamp: Date.now()
    };

    if (channel) {
      try {
        channel.postMessage(payload);
      } catch (e) {}
    }

    // Also write to localStorage for cross-window / fallback communication
    try {
      localStorage.setItem('riskos_sync_event_payload', JSON.stringify(payload));
    } catch (e) {}
  };

  const SessionSync = {
    TAB_ID,
    broadcastSecurity(symbol, meta = {}) {
      publish('SECURITY_CHANGE', { symbol, ...meta });
    },
    broadcastCurrency(currency) {
      publish('CURRENCY_CHANGE', { currency });
    },
    broadcastTheme(theme) {
      publish('THEME_CHANGE', { theme });
    },
    broadcastLiveSync() {
      publish('LIVE_SYNC_REQUEST', { triggeredAt: Date.now() });
    },
    on(type, callback) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(callback);
      return () => listeners.get(type).delete(callback);
    }
  };

  root.SessionSync = SessionSync;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionSync;
  }
})(typeof window !== 'undefined' ? window : global);
