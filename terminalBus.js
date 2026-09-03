/**
 * RISKOS UNIVERSAL BLOOMBERG TERMINAL BUS & CROSS-APP SYNC (terminalBus.js)
 * High-performance state bus, BroadcastChannel cross-tab synchronizer,
 * Bloomberg Mnemonic Command Bar (<CMD> <GO>), and Function Keys (F1-F12).
 */

const TerminalBus = (() => {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 1. STATE & BROADCAST CHANNEL
  // ══════════════════════════════════════════════════════════════════════════
  const STORAGE_KEY_SEC = 'RISKOS_ACTIVE_SECURITY';
  const STORAGE_KEY_SETTINGS = 'RISKOS_GLOBAL_SETTINGS';
  const CHANNEL_NAME = 'RISKOS_UNIFIED_BUS';

  let channel = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (e) {}
  }

  let activeSecurity = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_SEC)) || 'RELIANCE.NS';
  let activeDesk = 1;
  const securityListeners = [];
  const commandListeners = [];

  // Parse URL query params on page load
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const secParam = params.get('sec') || params.get('symbol') || params.get('ticker');
    if (secParam) {
      activeSecurity = secParam.toUpperCase().trim();
      localStorage.setItem(STORAGE_KEY_SEC, activeSecurity);
    }
    const deskParam = params.get('desk');
    if (deskParam) activeDesk = parseInt(deskParam, 10) || 1;
  }

  // Cross-tab message receiver
  if (channel) {
    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'SET_SECURITY' && msg.symbol) {
        activeSecurity = msg.symbol;
        localStorage.setItem(STORAGE_KEY_SEC, activeSecurity);
        notifySecurityListeners(activeSecurity, false);
        updateLaunchpadSecurityDisplay();
      } else if (msg.type === 'EXEC_COMMAND' && msg.command) {
        notifyCommandListeners(msg.command);
      }
    };
  }

  const notifySecurityListeners = (sym, broadcast = true) => {
    securityListeners.forEach(cb => {
      try { cb(sym); } catch (e) { console.error('Security listener error:', e); }
    });
    if (broadcast && channel) {
      channel.postMessage({ type: 'SET_SECURITY', symbol: sym });
    }
  };

  const notifyCommandListeners = (cmd) => {
    commandListeners.forEach(cb => {
      try { cb(cmd); } catch (e) { console.error('Command listener error:', e); }
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2. BLOOMBERG MNEMONIC COMMAND DICTIONARY
  // ══════════════════════════════════════════════════════════════════════════
  const MNEMONIC_COMMANDS = [
    // ── Platform Portals ──
    { cmd: 'TOP', desc: 'Executive Multi-Asset Dashboard', category: 'Navigation', url: 'index.html' },
    { cmd: 'DESK1', desc: 'Desk 1: Market Intelligence & HMM Regime', category: '7 Desks', url: 'app.html?desk=1' },
    { cmd: 'DESK2', desc: 'Desk 2: Portfolio Risk, VaR & CVaR', category: '7 Desks', url: 'app.html?desk=2' },
    { cmd: 'DESK3', desc: 'Desk 3: Systematic Signals & Kelly Sizing', category: '7 Desks', url: 'app.html?desk=3' },
    { cmd: 'DESK4', desc: 'Desk 4: Almgren-Chriss Order Slicer', category: '7 Desks', url: 'app.html?desk=4' },
    { cmd: 'DESK5', desc: 'Desk 5: Multi-Leg Derivatives & SABR Smile', category: '7 Desks', url: 'app.html?desk=5' },
    { cmd: 'DESK6', desc: 'Desk 6: Strategy Backtesting Sandbox', category: '7 Desks', url: 'app.html?desk=6' },
    { cmd: 'DESK7', desc: 'Desk 7: AI Speculations & Google TimesFM', category: '7 Desks', url: 'app.html?desk=7' },
    { cmd: 'FLEET', desc: '24/7 Autonomous Bot Fleet & Blotter', category: 'Fleet', url: 'fleet.html' },
    { cmd: 'RANK', desc: 'Quantitative Fleet Alpha Ranker', category: 'Fleet', url: 'fleet.html#botRankerContainer' },
    { cmd: 'OBS', desc: 'Market Observatory & Crisis Radar', category: 'Observatory', url: 'observatory.html' },
    { cmd: 'LABS', desc: '52 Interactive Quantitative Laboratories', category: 'Education', url: 'learn.html' },
    { cmd: 'TICK', desc: 'Universal Security Screener (120+ Assets)', category: 'Screener', url: 'ticker.html' },
    { cmd: 'DOCS', desc: 'System Architecture & Interactive Sandboxes', category: 'Documentation', url: 'docs.html' },
    { cmd: 'HELP', desc: 'Bloomberg Quick Reference & Commands', category: 'Documentation', url: 'docs.html' },

    // ── Core Symbols ──
    { cmd: 'RELIANCE', desc: 'Reliance Industries (NSE) Large-Cap', category: 'Equities', symbol: 'RELIANCE.NS' },
    { cmd: 'TCS', desc: 'Tata Consultancy Services (NSE)', category: 'Equities', symbol: 'TCS.NS' },
    { cmd: 'HDFCBANK', desc: 'HDFC Bank Ltd (NSE Banking Leader)', category: 'Equities', symbol: 'HDFCBANK.NS' },
    { cmd: 'INFY', desc: 'Infosys Ltd (IT & Software)', category: 'Equities', symbol: 'INFY.NS' },
    { cmd: 'TATAMOTORS', desc: 'Tata Motors Ltd (Automotive & EV)', category: 'Equities', symbol: 'TATAMOTORS.NS' },
    { cmd: 'NIFTY', desc: 'NIFTY 50 Benchmark Index (NSE)', category: 'Indices', symbol: '^NSEI' },
    { cmd: 'BANKNIFTY', desc: 'NIFTY BANK Benchmark Index', category: 'Indices', symbol: '^NSEBANK' },
    { cmd: 'AAPL', desc: 'Apple Inc (NASDAQ Large-Cap)', category: 'US Tech', symbol: 'AAPL' },
    { cmd: 'NVDA', desc: 'NVIDIA Corp (AI & Semiconductors)', category: 'US Tech', symbol: 'NVDA' },
    { cmd: 'MSFT', desc: 'Microsoft Corp (Cloud & Software)', category: 'US Tech', symbol: 'MSFT' },
    { cmd: 'BTC', desc: 'Bitcoin / USD 24/7 Perpetual', category: 'Crypto', symbol: 'BTC-USD' },
    { cmd: 'ETH', desc: 'Ethereum / USD 24/7 Perpetual', category: 'Crypto', symbol: 'ETH-USD' },
    { cmd: 'SOL', desc: 'Solana / USD High-Throughput L1', category: 'Crypto', symbol: 'SOL-USD' },
    { cmd: 'GOLD', desc: 'MCX Gold Futures / ETF', category: 'Commodities', symbol: 'GOLDBEES.NS' },
    { cmd: 'CRUDE', desc: 'Brent Crude Oil Benchmark', category: 'Commodities', symbol: 'BZ=F' },

    // ── Actions ──
    { cmd: 'VAR', desc: 'Calculate CVaR 99% & Monte Carlo VaR', category: 'Risk Action', action: 'GOTO_VAR' },
    { cmd: 'SABR', desc: 'Calibrate Hagan SABR Volatility Smile', category: 'Options Action', action: 'GOTO_SABR' },
    { cmd: 'TFM', desc: 'Run Google TimesFM 3.0 Quantile Fan', category: 'AI Action', action: 'GOTO_TFM' },
    { cmd: 'BURST', desc: 'Burst All 20 Autonomous Bot Orders', category: 'Fleet Action', action: 'BURST_ORDERS' },
    { cmd: 'KILL', desc: 'Emergency Liquidate & Halt Fleet', category: 'Circuit Breaker', action: 'KILL_SWITCH' },
    { cmd: 'EXPORT', desc: 'Export Institutional Blotter to CSV', category: 'Data Export', action: 'EXPORT_CSV' }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // 3. EXECUTE COMMAND CONTROLLER
  // ══════════════════════════════════════════════════════════════════════════
  const executeCommand = (rawInput) => {
    if (!rawInput) return;
    const clean = rawInput.trim().toUpperCase().replace(/<GO>/g, '').replace(/<HELP>/g, '').trim();

    // Check direct command matches
    const matched = MNEMONIC_COMMANDS.find(m => m.cmd === clean);

    if (matched) {
      if (matched.url) {
        window.location.href = matched.url;
        return;
      }
      if (matched.symbol) {
        setSecurity(matched.symbol);
        showFeedbackNotification(`[SECURITY ACTIVE: ${matched.symbol}]`);
        if (!window.location.pathname.includes('app.html')) {
          setTimeout(() => { window.location.href = `app.html?sec=${matched.symbol}`; }, 400);
        }
        return;
      }
      if (matched.action) {
        handleActionCommand(matched.action);
        return;
      }
    }

    // Check if user entered a raw ticker symbol (e.g., TSLA <GO>, AMZN <GO>)
    if (clean.length >= 2 && clean.length <= 14 && !clean.includes(' ')) {
      const sym = clean;
      setSecurity(sym);
      showFeedbackNotification(`[SECURITY SELECTED: ${sym}]`);
      if (!window.location.pathname.includes('app.html')) {
        setTimeout(() => { window.location.href = `app.html?sec=${sym}`; }, 400);
      }
      return;
    }

    // Check BOT commands (e.g. BOT IN01 <GO>)
    if (clean.startsWith('BOT')) {
      const botPart = clean.replace('BOT', '').trim();
      const botId = botPart.includes('-') ? botPart : `BOT-${botPart.substring(0, 2)}-${botPart.substring(2)}`;
      window.location.href = `fleet.html?bot=${botId}`;
      return;
    }

    // Check DESK commands (e.g. DESK 5)
    if (clean.startsWith('DESK')) {
      const num = clean.replace('DESK', '').trim();
      window.location.href = `app.html?desk=${num}`;
      return;
    }

    showFeedbackNotification(`[UNKNOWN COMMAND: ${clean} — Press F1 for Help]`, '#f43f5e');
  };

  const handleActionCommand = (action) => {
    if (action === 'GOTO_VAR') {
      window.location.href = 'app.html?desk=2';
    } else if (action === 'GOTO_SABR') {
      window.location.href = 'app.html?desk=5';
    } else if (action === 'GOTO_TFM') {
      window.location.href = 'app.html?desk=7';
    } else if (action === 'BURST_ORDERS') {
      if (typeof window.fleetBurstAllOrders === 'function') {
        window.fleetBurstAllOrders();
        showFeedbackNotification('[20 BOTS BURST TRIGGERED]');
      } else {
        window.location.href = 'fleet.html';
      }
    } else if (action === 'KILL_SWITCH') {
      if (confirm('EMERGENCY KILL SWITCH: Liquidate all open positions?')) {
        localStorage.setItem('RISKOS_KILL_SWITCH', Date.now());
        showFeedbackNotification('[EMERGENCY CIRCUIT BREAKER HALT TRIGGERED]', '#f43f5e');
      }
    } else if (action === 'EXPORT_CSV') {
      showFeedbackNotification('[EXPORTING RECENT BLOTTER TO CSV...]');
    }
  };

  const setSecurity = (symbol) => {
    if (!symbol) return;
    activeSecurity = symbol.toUpperCase().trim();
    localStorage.setItem(STORAGE_KEY_SEC, activeSecurity);
    notifySecurityListeners(activeSecurity, true);
    updateLaunchpadSecurityDisplay();
  };

  const getSecurity = () => activeSecurity;

  const onSecurityChange = (cb) => {
    if (typeof cb === 'function') securityListeners.push(cb);
  };

  const onCommand = (cb) => {
    if (typeof cb === 'function') commandListeners.push(cb);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. BLOOMBERG MODAL & FLOATING LAUNCHPAD DOCK
  // ══════════════════════════════════════════════════════════════════════════
  const buildBloombergModalDOM = () => {
    if (document.getElementById('bbmCommandOverlay')) return;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'bbmCommandOverlay';
    overlay.className = 'bbm-command-overlay';

    overlay.innerHTML = `
      <div class="bbm-command-box" id="bbmCommandBox">
        <div class="bbm-command-header">
          <div class="bbm-header-left">
            <i class="fa-solid fa-terminal"></i>
            <span>BLOOMBERG MNEMONIC COMMAND PALETTE &bull; RISKOS</span>
          </div>
          <div class="bbm-header-right">
            <span>&lt;CMD&gt; &lt;GO&gt;</span>
            <span>[ESC to Close]</span>
          </div>
        </div>

        <div class="bbm-input-row">
          <span class="bbm-prompt-symbol">&gt;</span>
          <input type="text" id="bbmInput" class="bbm-input" placeholder="Enter Command (e.g. RELIANCE <GO>, DESK2, FLEET, TFM, HELP)..." autocomplete="off" spellcheck="false" />
          <button id="bbmGoBtn" class="bbm-go-btn">&lt;GO&gt;</button>
        </div>

        <div class="bbm-fkey-ribbon">
          <div class="bbm-fkey-pill" data-cmd="DOCS"><span class="bbm-fkey-name">F1</span> Help</div>
          <div class="bbm-fkey-pill" data-cmd="TICK"><span class="bbm-fkey-name">F2</span> Equities</div>
          <div class="bbm-fkey-pill" data-cmd="DESK2"><span class="bbm-fkey-name">F3</span> Yield &amp; VaR</div>
          <div class="bbm-fkey-pill" data-cmd="DESK1"><span class="bbm-fkey-name">F4</span> FX Rates</div>
          <div class="bbm-fkey-pill" data-cmd="GOLD"><span class="bbm-fkey-name">F5</span> Commodities</div>
          <div class="bbm-fkey-pill" data-cmd="LABS"><span class="bbm-fkey-name">F6</span> 52 Labs</div>
          <div class="bbm-fkey-pill" data-cmd="FLEET"><span class="bbm-fkey-name">F7</span> 24/7 Fleet</div>
          <div class="bbm-fkey-pill" data-cmd="OBS"><span class="bbm-fkey-name">F8</span> Observatory</div>
          <div class="bbm-fkey-pill" data-cmd="DESK7"><span class="bbm-fkey-name">F9</span> TimesFM 3.0</div>
          <div class="bbm-fkey-pill" data-cmd="TOP"><span class="bbm-fkey-name">F10</span> Dashboard</div>
        </div>

        <div class="bbm-results-list" id="bbmResultsList">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Floating Launchpad Dock at bottom
    const dock = document.createElement('div');
    dock.id = 'bbmLaunchpadDock';
    dock.className = 'bbm-launchpad-dock';

    dock.innerHTML = `
      <button class="launchpad-cmd-trigger" id="btnLaunchpadTrigger" title="Press ~ or F12">
        <i class="fa-solid fa-terminal"></i> &lt;CMD&gt; &lt;GO&gt;
      </button>
      <div class="launchpad-sec-display" id="launchpadSecDisplay">
        <span style="color:#71717a;">ACTIVE:</span>
        <strong style="color:#22d3ee;" id="dockActiveSec">${activeSecurity}</strong>
      </div>
      <div class="launchpad-portal-links">
        <a href="index.html" class="launchpad-portal-btn"><i class="fa-solid fa-house"></i> Home</a>
        <a href="app.html" class="launchpad-portal-btn"><i class="fa-solid fa-cubes"></i> 7 Desks</a>
        <a href="fleet.html" class="launchpad-portal-btn"><i class="fa-solid fa-robot text-cyan"></i> Fleet</a>
        <a href="observatory.html" class="launchpad-portal-btn"><i class="fa-solid fa-chart-line"></i> Obs</a>
        <a href="learn.html" class="launchpad-portal-btn"><i class="fa-solid fa-graduation-cap"></i> Labs</a>
        <a href="ticker.html" class="launchpad-portal-btn"><i class="fa-solid fa-magnifying-glass"></i> Screener</a>
        <a href="docs.html" class="launchpad-portal-btn"><i class="fa-solid fa-book text-cyan"></i> Docs</a>
      </div>
    `;

    document.body.appendChild(dock);

    attachBloombergEvents();
  };

  const attachBloombergEvents = () => {
    const overlay = document.getElementById('bbmCommandOverlay');
    const input = document.getElementById('bbmInput');
    const goBtn = document.getElementById('bbmGoBtn');
    const resultsList = document.getElementById('bbmResultsList');
    const dockTrigger = document.getElementById('btnLaunchpadTrigger');

    if (dockTrigger) {
      dockTrigger.addEventListener('click', openCommandPalette);
    }

    if (goBtn && input) {
      goBtn.addEventListener('click', () => {
        executeCommand(input.value);
        closeCommandPalette();
      });
    }

    if (input) {
      input.addEventListener('input', (e) => {
        renderCommandResults(e.target.value);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeCommand(input.value);
          closeCommandPalette();
        } else if (e.key === 'Escape') {
          closeCommandPalette();
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCommandPalette();
      });
    }

    // F-key clicks in ribbon
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.bbm-fkey-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const cmd = pill.dataset.cmd;
          if (cmd) executeCommand(cmd);
          closeCommandPalette();
        });
      });
    }

    // Global Keydown Listeners for ~ (tilde), F12, and Function Keys
    document.addEventListener('keydown', (e) => {
      // Tilde key (~) or F12 or Ctrl+K opens Bloomberg bar
      if ((e.key === '`' || e.key === '~' || e.key === 'F12' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement !== input) {
        e.preventDefault();
        openCommandPalette();
      }

      // Hardware Function Keys F1-F10
      if (!overlay || overlay.style.display !== 'flex') {
        if (e.key === 'F1') { e.preventDefault(); window.location.href = 'docs.html'; }
        else if (e.key === 'F2') { e.preventDefault(); window.location.href = 'ticker.html'; }
        else if (e.key === 'F3') { e.preventDefault(); window.location.href = 'app.html?desk=2'; }
        else if (e.key === 'F4') { e.preventDefault(); window.location.href = 'app.html?desk=1'; }
        else if (e.key === 'F5') { e.preventDefault(); setSecurity('GOLDBEES.NS'); showFeedbackNotification('[MCX COMMODITIES ACTIVE]'); }
        else if (e.key === 'F6') { e.preventDefault(); window.location.href = 'learn.html'; }
        else if (e.key === 'F7') { e.preventDefault(); window.location.href = 'fleet.html'; }
        else if (e.key === 'F8') { e.preventDefault(); window.location.href = 'observatory.html'; }
        else if (e.key === 'F9') { e.preventDefault(); window.location.href = 'app.html?desk=7'; }
        else if (e.key === 'F10') { e.preventDefault(); window.location.href = 'index.html'; }
      }
    });
  };

  const renderCommandResults = (filterText = '') => {
    const list = document.getElementById('bbmResultsList');
    if (!list) return;

    const query = filterText.toLowerCase().trim();
    const filtered = MNEMONIC_COMMANDS.filter(m => {
      if (!query) return true;
      return m.cmd.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query) || m.category.toLowerCase().includes(query);
    });

    list.innerHTML = filtered.slice(0, 8).map((item, idx) => `
      <div class="bbm-result-item ${idx === 0 ? 'selected' : ''}" data-cmd="${item.cmd}">
        <div class="bbm-res-cmd">
          <span>${item.cmd} &lt;GO&gt;</span>
          <span class="bbm-res-category">${item.category}</span>
        </div>
        <div class="bbm-res-desc">${item.desc}</div>
      </div>
    `).join('');

    list.querySelectorAll('.bbm-result-item').forEach(el => {
      el.addEventListener('click', () => {
        executeCommand(el.dataset.cmd);
        closeCommandPalette();
      });
    });
  };

  const openCommandPalette = () => {
    const overlay = document.getElementById('bbmCommandOverlay');
    const input = document.getElementById('bbmInput');
    if (overlay && input) {
      overlay.style.display = 'flex';
      input.value = '';
      renderCommandResults('');
      setTimeout(() => input.focus(), 50);
    }
  };

  const closeCommandPalette = () => {
    const overlay = document.getElementById('bbmCommandOverlay');
    if (overlay) overlay.style.display = 'none';
  };

  const updateLaunchpadSecurityDisplay = () => {
    const el = document.getElementById('dockActiveSec');
    if (el) el.textContent = activeSecurity;
  };

  const showFeedbackNotification = (msg, color = '#10b981') => {
    const existing = document.getElementById('bbmFeedbackPill');
    if (existing) existing.remove();

    const pill = document.createElement('div');
    pill.id = 'bbmFeedbackPill';
    pill.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #020408;
      border: 1px solid ${color};
      color: ${color};
      padding: 8px 16px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 800;
      z-index: 100000;
      box-shadow: 0 4px 14px rgba(0,0,0,0.7);
      animation: bbmBoxSlide 0.2s ease-out;
    `;
    pill.textContent = msg;
    document.body.appendChild(pill);
    setTimeout(() => pill.remove(), 2600);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 5. DOM READY BOOTSTRAP
  // ══════════════════════════════════════════════════════════════════════════
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildBloombergModalDOM);
    } else {
      buildBloombergModalDOM();
    }
  }

  return {
    setSecurity,
    getSecurity,
    onSecurityChange,
    onCommand,
    executeCommand,
    openCommandPalette,
    closeCommandPalette,
    showFeedbackNotification
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.TerminalBus = TerminalBus;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerminalBus;
}

