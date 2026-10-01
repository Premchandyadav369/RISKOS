/**
 * RISKOS — Universal Autonomous Bot Fleet Runtime & Cross-Tab Synchronizer (fleetRuntime.js)
 * Coordinates the 41-bot algorithmic trading fleet across all browser tabs:
 *  - Elects a master background worker tab using heartbeat consensus
 *  - Synchronizes real-time prices, positions, orders, and P&L via BroadcastChannel
 *  - Maintains persistent state in localStorage ('RISKOS_FLEET_STATE_DATA', 'RISKOS_FLEET_AUDIT_LOG')
 *  - Emits real-time execution telemetry to app.html, index.html, and fleet.html
 */

(() => {
  'use strict';

  const CHANNEL_NAME = 'riskos_fleet_sync';
  const STATE_KEY = 'RISKOS_FLEET_STATE_DATA';
  const AUDIT_KEY = 'RISKOS_FLEET_AUDIT_LOG';
  const LEADER_KEY = 'RISKOS_FLEET_LEADER';

  const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const IS_FLEET_PAGE = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('fleet.html');

  // Core 41 Bot Specifications for resilient offline bootstrapping
  const DEFAULT_BOT_SEEDS = [
    // 10 Indian Greek Bots
    { id: 'BOT-IN-01', name: 'THANATOS 💀', market: 'india', sector: 'Index Derivatives (NSE)', symbol: 'NIFTY 24600 CE', basePrice: 24680, winRate: 78.4, pnl: 62450 },
    { id: 'BOT-IN-02', name: 'ZEUS ⚡', market: 'india', sector: 'Banking Equities (NSE)', symbol: 'HDFCBANK.NS', basePrice: 1640, winRate: 81.2, pnl: 54100 },
    { id: 'BOT-IN-03', name: 'ATHENA 🦉', market: 'india', sector: 'IT Services (NSE)', symbol: 'TCS.NS', basePrice: 4280, winRate: 84.5, pnl: 48900 },
    { id: 'BOT-IN-04', name: 'POSEIDON 🔱', market: 'india', sector: 'Energy & Petrochem', symbol: 'RELIANCE.NS', basePrice: 2980, winRate: 76.9, pnl: 42100 },
    { id: 'BOT-IN-05', name: 'HERMES 🪽', market: 'india', sector: 'Automotive & EV', symbol: 'TATAMOTORS.NS', basePrice: 975, winRate: 82.1, pnl: 38700 },
    { id: 'BOT-IN-06', name: 'APOLLO ☀️', market: 'india', sector: 'Pharma & Biotech', symbol: 'SUNPHARMA.NS', basePrice: 1710, winRate: 79.3, pnl: 35400 },
    { id: 'BOT-IN-07', name: 'HEPHAESTUS 🔨', market: 'india', sector: 'Metals & Infrastructure', symbol: 'TATASTEEL.NS', basePrice: 154, winRate: 75.8, pnl: 31200 },
    { id: 'BOT-IN-08', name: 'DIONYSUS 🍇', market: 'india', sector: 'FMCG & Consumer Goods', symbol: 'TRENT.NS', basePrice: 7120, winRate: 80.5, pnl: 29800 },
    { id: 'BOT-IN-09', name: 'ARES ⚔️', market: 'india', sector: 'Capital Goods & Defense', symbol: 'LT.NS', basePrice: 3620, winRate: 83.1, pnl: 27500 },
    { id: 'BOT-IN-10', name: 'HADES 🕯️', market: 'india', sector: 'Fixed Income & G-Secs', symbol: 'GSEC 10Y 7.10%', basePrice: 100.2, winRate: 88.0, pnl: 24800 },

    // 11 US Greek Bots
    { id: 'BOT-US-01', name: 'KRONOS ⏳', market: 'us', sector: 'Index Options (CBOE)', symbol: 'SPX 5500 CE', basePrice: 5540, winRate: 79.5, pnl: 84200 },
    { id: 'BOT-US-02', name: 'PROMETHEUS 🔥', market: 'us', sector: 'Semiconductors & AI', symbol: 'NVDA', basePrice: 128.5, winRate: 85.2, pnl: 96300 },
    { id: 'BOT-US-03', name: 'ARES ⚔️', market: 'us', sector: 'Mega-Cap Technology', symbol: 'AAPL', basePrice: 224.2, winRate: 81.0, pnl: 72100 },
    { id: 'BOT-US-04', name: 'ZEUS ⚡', market: 'us', sector: 'Hyperscalers & Cloud', symbol: 'MSFT', basePrice: 448.5, winRate: 83.4, pnl: 68500 },
    { id: 'BOT-US-05', name: 'HERMES 🪽', market: 'us', sector: 'Digital Advertising', symbol: 'GOOGL', basePrice: 182.0, winRate: 78.8, pnl: 59400 },
    { id: 'BOT-US-06', name: 'ARTEMIS 🏹', market: 'us', sector: 'E-Commerce & Logistics', symbol: 'AMZN', basePrice: 186.4, winRate: 80.2, pnl: 54100 },
    { id: 'BOT-US-07', name: 'HEPHAESTUS 🔨', market: 'us', sector: 'Autonomous Mobility', symbol: 'TSLA', basePrice: 254.0, winRate: 74.6, pnl: 49800 },
    { id: 'BOT-US-08', name: 'POSEIDON 🔱', market: 'us', sector: 'Global Investment Banking', symbol: 'JPM', basePrice: 215.3, winRate: 82.7, pnl: 45200 },
    { id: 'BOT-US-09', name: 'APOLLO ☀️', market: 'us', sector: 'Healthcare & Pharma', symbol: 'LLY', basePrice: 945.0, winRate: 86.1, pnl: 51200 },
    { id: 'BOT-US-10', name: 'ATHENA 🦉', market: 'us', sector: 'US Sovereign Treasuries', symbol: 'US 10Y Yield', basePrice: 4.22, winRate: 87.5, pnl: 39500 },
    { id: 'BOT-US-11', name: 'NEXUS 🪐', market: 'us', sector: 'Multi-Asset Cross-Arbitrage', symbol: 'SPY/TLT Pair', basePrice: 98.4, winRate: 83.9, pnl: 41800 },

    // 10 Indian Egyptian Bots
    { id: 'BOT-EG-IN-01', name: 'ANUBIS ⚖️', market: 'india', sector: 'Arbitrage & Cash-Futures', symbol: 'SBIN.NS', basePrice: 840, winRate: 86.4, pnl: 34100 },
    { id: 'BOT-EG-IN-02', name: 'RA 👁️', market: 'india', sector: 'Power & Green Energy', symbol: 'NTPC.NS', basePrice: 415, winRate: 79.8, pnl: 29500 },
    { id: 'BOT-EG-IN-03', name: 'OSIRIS 🌾', market: 'india', sector: 'Agri & Chemicals', symbol: 'UPL.NS', basePrice: 580, winRate: 75.2, pnl: 24600 },
    { id: 'BOT-EG-IN-04', name: 'HORUS 🦅', market: 'india', sector: 'Defense & Aerospace', symbol: 'HAL.NS', basePrice: 4720, winRate: 83.6, pnl: 37800 },
    { id: 'BOT-EG-IN-05', name: 'THOTH 📜', market: 'india', sector: 'Exchange Infrastructure', symbol: 'BSE.NS', basePrice: 2890, winRate: 84.1, pnl: 41200 },
    { id: 'BOT-EG-IN-06', name: 'SET 🌪️', market: 'india', sector: 'High Beta Volatility', symbol: 'ADANIENT.NS', basePrice: 3120, winRate: 73.5, pnl: 32900 },
    { id: 'BOT-EG-IN-07', name: 'BASTET 🐱', market: 'india', sector: 'Retail & Quick Commerce', symbol: 'ZOMATO.NS', basePrice: 265, winRate: 81.4, pnl: 36700 },
    { id: 'BOT-EG-IN-08', name: 'SOBEK 🐊', market: 'india', sector: 'Ports & Marine Logistics', symbol: 'ADANIPORTS.NS', basePrice: 1480, winRate: 78.9, pnl: 28400 },
    { id: 'BOT-EG-IN-09', name: 'PTAH ⚒️', market: 'india', sector: 'Cement & Housing', symbol: 'ULTRACEMCO.NS', basePrice: 11450, winRate: 77.8, pnl: 26100 },
    { id: 'BOT-EG-IN-10', name: 'ISIS 🪽', market: 'india', sector: 'Life Insurance & Asset Mgmt', symbol: 'HDFCLIFE.NS', basePrice: 710, winRate: 82.0, pnl: 25300 },

    // 10 US Egyptian Bots
    { id: 'BOT-EG-US-01', name: 'ANUBIS ⚖️', market: 'us', sector: 'Crypto & Digital Assets', symbol: 'BTC-USD', basePrice: 64200, winRate: 79.1, pnl: 89400 },
    { id: 'BOT-EG-US-02', name: 'RA 👁️', market: 'us', sector: 'Smart Contract DeFi', symbol: 'ETH-USD', basePrice: 3450, winRate: 77.6, pnl: 67200 },
    { id: 'BOT-EG-US-03', name: 'OSIRIS 🌾', market: 'us', sector: 'Agri Commodities (CBOT)', symbol: 'CORN (ZC)', basePrice: 420, winRate: 76.4, pnl: 34500 },
    { id: 'BOT-EG-US-04', name: 'HORUS 🦅', market: 'us', sector: 'High-Frequency FX Flow', symbol: 'EUR/USD', basePrice: 1.092, winRate: 84.8, pnl: 45600 },
    { id: 'BOT-EG-US-05', name: 'THOTH 📜', market: 'us', sector: 'Systematic Macro Trend', symbol: 'USD/JPY', basePrice: 154.3, winRate: 82.3, pnl: 48900 },
    { id: 'BOT-EG-US-06', name: 'SET 🌪️', market: 'us', sector: 'Energy & WTI Futures', symbol: 'CL (Crude Oil)', basePrice: 78.4, winRate: 75.9, pnl: 52100 },
    { id: 'BOT-EG-US-07', name: 'BASTET 🐱', market: 'us', sector: 'Precious Metals', symbol: 'XAU/USD (Gold)', basePrice: 2420, winRate: 85.0, pnl: 61400 },
    { id: 'BOT-EG-US-08', name: 'SOBEK 🐊', market: 'us', sector: 'Industrial Metals', symbol: 'HG (Copper)', basePrice: 4.45, winRate: 78.2, pnl: 39800 },
    { id: 'BOT-EG-US-09', name: 'PTAH ⚒️', market: 'us', sector: 'Semiconductor Equipment', symbol: 'ASML', basePrice: 910.0, winRate: 83.7, pnl: 56700 },
    { id: 'BOT-EG-US-10', name: 'ISIS 🪽', market: 'us', sector: 'Cloud Cybersecurity', symbol: 'CRWD', basePrice: 295.0, winRate: 80.9, pnl: 47200 }
  ];

  class UniversalFleetRuntime {
    constructor() {
      this.channel = null;
      this.isLeader = false;
      this.bots = [];
      this.auditLogs = [];
      this.listeners = { tick: [], execution: [] };
      this.lastHeartbeat = 0;
      this.heartbeatTimer = null;
      this.simLoopTimer = null;

      this._initChannel();
      this._loadInitialState();
      this._startLeaderElection();
      this._bindStorageEvents();
    }

    // ── 1. BroadcastChannel Communication ──────────────────────────────────
    _initChannel() {
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => this._handleChannelMessage(event.data);
        } catch (e) {
          console.warn('[FleetRuntime] BroadcastChannel failed, using storage bus:', e);
        }
      }
    }

    _handleChannelMessage(msg) {
      if (!msg || !msg.type) return;

      if (msg.type === 'FLEET_HEARTBEAT') {
        if (msg.isFleetPage && !IS_FLEET_PAGE) {
          // Relinquish leadership immediately to fleet.html
          this.isLeader = false;
        }
        this.lastHeartbeat = Date.now();
      } else if (msg.type === 'FLEET_STATE_UPDATE') {
        if (Array.isArray(msg.bots)) {
          this._mergeState(msg.bots, msg.recentAudit || []);
        }
      } else if (msg.type === 'FLEET_EXECUTION') {
        this._notifyExecution(msg.payload);
      }
    }

    _broadcast(type, payload = {}) {
      if (this.channel) {
        try {
          this.channel.postMessage({ type, payload, sender: TAB_ID, timestamp: Date.now() });
        } catch (e) {}
      }
    }

    // ── 2. State Hydration ──────────────────────────────────────────────────
    _loadInitialState() {
      try {
        const rawState = localStorage.getItem(STATE_KEY);
        if (rawState) {
          const parsed = JSON.parse(rawState);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.bots = parsed;
          }
        }
      } catch (e) {}

      // Bootstrap if missing
      if (!this.bots || this.bots.length === 0) {
        this.bots = DEFAULT_BOT_SEEDS.map(seed => ({
          id: seed.id,
          name: seed.name,
          market: seed.market,
          sector: seed.sector,
          primarySymbol: seed.symbol,
          basePrice: seed.basePrice,
          currentPrice: seed.basePrice,
          realizedPnlINR: seed.pnl,
          winRate: seed.winRate,
          tradesToday: Math.floor(18 + Math.random() * 25),
          status: 'RUNNING',
          activePosition: null
        }));
        this._persistState();
      }

      try {
        const rawAudit = localStorage.getItem(AUDIT_KEY);
        if (rawAudit) {
          this.auditLogs = JSON.parse(rawAudit);
        }
      } catch (e) {}
    }

    _persistState() {
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(this.bots));
        if (this.auditLogs.length > 0) {
          localStorage.setItem(AUDIT_KEY, JSON.stringify(this.auditLogs.slice(0, 100)));
        }
      } catch (e) {}
    }

    _bindStorageEvents() {
      window.addEventListener('storage', (e) => {
        if (e.key === STATE_KEY && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            if (Array.isArray(updated)) {
              this.bots = updated;
              this._notifyTick();
            }
          } catch (err) {}
        }
      });
    }

    // ── 3. Consensus Leader Election ────────────────────────────────────────
    _startLeaderElection() {
      const checkLeader = () => {
        const now = Date.now();
        let leaderData = null;
        try {
          const raw = localStorage.getItem(LEADER_KEY);
          if (raw) leaderData = JSON.parse(raw);
        } catch (e) {}

        const leaderIsFleet = leaderData && leaderData.isFleetPage;
        const leaderAlive = leaderData && (now - leaderData.lastSeen < 3000);

        if (IS_FLEET_PAGE) {
          // fleet.html is always authoritative
          this.isLeader = true;
          this._claimLeadership();
        } else if (!leaderAlive || (!leaderIsFleet && leaderData?.tabId === TAB_ID)) {
          // Claim leadership if current leader dead or already held by this tab
          this.isLeader = true;
          this._claimLeadership();
        } else {
          this.isLeader = false;
        }

        if (this.isLeader) {
          this._broadcast('FLEET_HEARTBEAT', { isFleetPage: IS_FLEET_PAGE });
          this._ensureSimLoopRunning();
        } else {
          this._stopSimLoop();
        }
      };

      checkLeader();
      this.heartbeatTimer = setInterval(checkLeader, 1000);
    }

    _claimLeadership() {
      try {
        localStorage.setItem(LEADER_KEY, JSON.stringify({
          tabId: TAB_ID,
          isFleetPage: IS_FLEET_PAGE,
          lastSeen: Date.now()
        }));
      } catch (e) {}
    }

    // ── 4. Autonomous Simulation Loop (Master Tab Only) ─────────────────────
    _ensureSimLoopRunning() {
      if (this.simLoopTimer) return;
      // Evaluate a batch of bots every 1.5 seconds
      this.simLoopTimer = setInterval(() => this._runTickEvaluation(), 1500);
    }

    _stopSimLoop() {
      if (this.simLoopTimer) {
        clearInterval(this.simLoopTimer);
        this.simLoopTimer = null;
      }
    }

    _runTickEvaluation() {
      if (!this.bots || this.bots.length === 0) return;

      // Select 4 random bots to evaluate this tick
      const indices = [];
      while (indices.length < 4) {
        const idx = Math.floor(Math.random() * this.bots.length);
        if (!indices.includes(idx)) indices.push(idx);
      }

      let stateModified = false;

      indices.forEach(idx => {
        const bot = this.bots[idx];
        if (!bot || bot.status === 'STOPPED') return;

        // Price Brownian drift (±0.08%)
        const drift = 1 + (Math.random() - 0.495) * 0.0016;
        bot.currentPrice = Number((bot.currentPrice * drift).toFixed(2));

        if (bot.activePosition) {
          const pos = bot.activePosition;
          const isBuy = pos.side === 'BUY';
          const pnlDelta = isBuy ? (bot.currentPrice - pos.entryPrice) : (pos.entryPrice - bot.currentPrice);
          const fx = bot.market === 'india' ? 1.0 : 83.92;
          pos.unrealizedPnlINR = Math.round(pnlDelta * pos.qty * fx);
          pos.unrealizedPnlPct = Number(((pnlDelta / pos.entryPrice) * 100).toFixed(2));

          // Exit conditions: Take Profit (+1.5%), Stop Loss (-1.0%), or Horizon Timeout (>45s)
          const elapsed = Date.now() - (pos.entryTime || Date.now());
          if (pos.unrealizedPnlPct >= 1.5 || pos.unrealizedPnlPct <= -1.0 || elapsed > 45000) {
            const isWin = pos.unrealizedPnlINR > 0;
            bot.realizedPnlINR += pos.unrealizedPnlINR;
            bot.tradesToday = (bot.tradesToday || 0) + 1;

            // Bayesian win rate smoothing
            bot.winRate = Number(((bot.winRate * 0.95) + (isWin ? 5 : 0)).toFixed(1));

            const executionEvent = {
              botId: bot.id,
              botName: bot.name,
              symbol: pos.symbol,
              action: isBuy ? 'SOLD' : 'COVERED',
              qty: pos.qty,
              price: bot.currentPrice,
              pnlINR: pos.unrealizedPnlINR,
              currency: bot.market === 'india' ? '₹' : '$',
              timestamp: Date.now()
            };

            this.auditLogs.unshift(executionEvent);
            bot.activePosition = null;
            stateModified = true;

            this._notifyExecution(executionEvent);
            this._broadcast('FLEET_EXECUTION', executionEvent);
          }
        } else {
          // Open intelligent order (65% chance)
          if (Math.random() < 0.65) {
            const side = Math.random() > 0.48 ? 'BUY' : 'SELL';
            const qty = bot.market === 'india' ? (bot.currentPrice > 1000 ? 50 : 200) : (bot.currentPrice > 500 ? 10 : 50);
            bot.activePosition = {
              symbol: bot.primarySymbol,
              side,
              qty,
              entryPrice: bot.currentPrice,
              entryTime: Date.now(),
              unrealizedPnlINR: 0,
              unrealizedPnlPct: 0.0
            };
            stateModified = true;
          }
        }
      });

      if (stateModified) {
        this._persistState();
        this._notifyTick();
        this._broadcast('FLEET_STATE_UPDATE', {
          bots: this.bots,
          recentAudit: this.auditLogs.slice(0, 5)
        });
      }
    }

    _mergeState(updatedBots, recentLogs) {
      if (Array.isArray(updatedBots)) {
        this.bots = updatedBots;
      }
      if (Array.isArray(recentLogs) && recentLogs.length > 0) {
        recentLogs.forEach(log => {
          if (!this.auditLogs.some(l => l.timestamp === log.timestamp && l.botId === log.botId)) {
            this.auditLogs.unshift(log);
          }
        });
        if (this.auditLogs.length > 100) this.auditLogs = this.auditLogs.slice(0, 100);
      }
      this._notifyTick();
    }

    // ── 5. Telemetry Calculations ───────────────────────────────────────────
    getStats() {
      let totalRealized = 0;
      let totalUnrealized = 0;
      let activeCount = 0;
      let winRateSum = 0;

      this.bots.forEach(b => {
        totalRealized += (b.realizedPnlINR || 0);
        if (b.activePosition) {
          totalUnrealized += (b.activePosition.unrealizedPnlINR || 0);
          activeCount++;
        }
        winRateSum += (b.winRate || 75);
      });

      const totalPnl = totalRealized + totalUnrealized;
      const avgWinRate = this.bots.length > 0 ? (winRateSum / this.bots.length).toFixed(1) : '80.0';

      return {
        totalBots: this.bots.length || 41,
        activeBots: this.bots.filter(b => b.status === 'RUNNING').length || 41,
        openPositions: activeCount,
        totalRealizedINR: totalRealized,
        totalUnrealizedINR: totalUnrealized,
        totalPnlINR: totalPnl,
        avgWinRate: Number(avgWinRate),
        usdEquivalent: Math.round(totalPnl / 83.92)
      };
    }

    // ── 6. Event Listeners ──────────────────────────────────────────────────
    onTick(fn) {
      this.listeners.tick.push(fn);
      return () => { this.listeners.tick = this.listeners.tick.filter(cb => cb !== fn); };
    }

    onExecution(fn) {
      this.listeners.execution.push(fn);
      return () => { this.listeners.execution = this.listeners.execution.filter(cb => cb !== fn); };
    }

    _notifyTick() {
      const stats = this.getStats();
      this.listeners.tick.forEach(fn => {
        try { fn(stats, this.bots); } catch (e) {}
      });
    }

    _notifyExecution(event) {
      this.listeners.execution.forEach(fn => {
        try { fn(event); } catch (e) {}
      });
    }

    // ── 7. Automatic UI Telemetry Strip Mounting ────────────────────────────
    mountTelemetryStrip(containerEl) {
      if (!containerEl) return;

      containerEl.innerHTML = `
        <div class="fleet-telemetry-inner" style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:6px 16px; background:rgba(12,13,18,0.92); border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.75rem; color:#e4e4e7; width:100%; box-sizing:border-box; overflow-x:auto;">
          <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
            <a href="fleet.html" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(34,211,238,0.15); border:1px solid rgba(34,211,238,0.3); color:#22d3ee; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.7rem;">
              <span class="live-pulse-dot" style="width:6px; height:6px; background:#10b981; border-radius:50%; display:inline-block; box-shadow:0 0 8px #10b981;"></span>
              <span>41 BOTS LIVE</span>
            </a>
            <div style="display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono', monospace;">
              <span style="color:#71717a; font-weight:600;">FLEET ALPHA:</span>
              <span id="ftStripPnl" style="color:#10b981; font-weight:800;">₹14,85,320</span>
              <span id="ftStripUsd" style="color:#a1a1aa; font-size:0.68rem;">($17.7k)</span>
            </div>
            <div style="display:inline-flex; align-items:center; gap:4px; font-family:'JetBrains Mono', monospace;">
              <span style="color:#71717a;">WIN:</span>
              <span id="ftStripWin" style="color:#22d3ee; font-weight:700;">81.2%</span>
            </div>
          </div>

          <div style="flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; display:flex; align-items:center; gap:8px;">
            <span style="color:#f59e0b; font-weight:700; font-size:0.68rem; text-transform:uppercase; letter-spacing:0.04em; flex-shrink:0;">
              <i class="fa-solid fa-bolt"></i> STREAM:
            </span>
            <div id="ftStripMarquee" style="color:#cbd5e1; font-family:'JetBrains Mono', monospace; font-size:0.72rem; overflow:hidden; text-overflow:ellipsis;">
              [BOT-IN-01] THANATOS SOLD 25 NIFTY 24600 CE @ ₹124.50 (+₹1,420) &bull; [BOT-US-02] PROMETHEUS BOUGHT 50 NVDA @ $128.40
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <a href="fleet.html" class="btn-text-link" style="color:#22d3ee; font-size:0.7rem; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
              <span>Manage Fleet</span> <i class="fa-solid fa-arrow-right" style="font-size:0.65rem;"></i>
            </a>
          </div>
        </div>
      `;

      // Update UI on ticks
      const updateStripUI = (stats) => {
        const pnlEl = document.getElementById('ftStripPnl');
        const usdEl = document.getElementById('ftStripUsd');
        const winEl = document.getElementById('ftStripWin');
        if (!pnlEl) return;

        const isPos = stats.totalPnlINR >= 0;
        pnlEl.textContent = `${isPos ? '+' : ''}₹${Math.abs(stats.totalPnlINR).toLocaleString('en-IN')}`;
        pnlEl.style.color = isPos ? '#10b981' : '#f43f5e';

        if (usdEl) {
          usdEl.textContent = `(${isPos ? '+' : ''}$${Math.abs(stats.usdEquivalent).toLocaleString('en-US')})`;
        }
        if (winEl) {
          winEl.textContent = `${stats.avgWinRate}%`;
        }
      };

      const updateMarquee = (evt) => {
        const marqueeEl = document.getElementById('ftStripMarquee');
        if (!marqueeEl) return;
        const pnlText = evt.pnlINR ? ` (${evt.pnlINR >= 0 ? '+' : ''}${evt.currency}${Math.abs(evt.pnlINR).toLocaleString('en-IN')})` : '';
        marqueeEl.innerHTML = `<span style="color:#22d3ee; font-weight:700;">[${escapeText(evt.botId)}]</span> <span style="color:#fff;">${escapeText(evt.action)} ${escapeText(evt.qty)} ${escapeText(evt.symbol)}</span> @ ${escapeText(evt.currency)}${Number(evt.price).toLocaleString()} <span style="color:${(evt.pnlINR || 0) >= 0 ? '#10b981' : '#f43f5e'}; font-weight:700;">${pnlText}</span>`;
      };

      this.onTick(updateStripUI);
      this.onExecution(updateMarquee);

      // Initial stats render
      updateStripUI(this.getStats());
      if (this.auditLogs.length > 0) {
        updateMarquee(this.auditLogs[0]);
      }
    }
  }

  function escapeText(str) {
    return String(str || '').replace(/[<>&"']/g, '');
  }

  // Export Singleton
  const runtimeSingleton = new UniversalFleetRuntime();
  window.FleetRuntime = runtimeSingleton;

  // Auto-mount if banner exists on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const autoStrip = document.getElementById('fleetRealtimeStrip');
    if (autoStrip) {
      runtimeSingleton.mountTelemetryStrip(autoStrip);
    }
  });

})();
