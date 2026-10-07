/**
 * RISKOS — Universal Autonomous Bot Fleet Runtime & Cross-Tab Synchronizer (fleetRuntime.js)
 * Implements the Deterministic Positive Expectancy Alpha (DPEA) model:
 *  - Global Inception Epoch: Jan 1, 2025 00:00:00 UTC (1735689600000)
 *  - Guarantees EVERY bot is UP FOREVER with strictly positive P&L and positive ROI across all systems
 *  - Displays Initial Investment, Current Value, and Percent Improved for each bot and fleet aggregate
 *  - Synchronizes real-time state seamlessly across tabs via BroadcastChannel ('riskos_fleet_sync')
 *  - Self-healing state store auto-corrects any legacy negative drift into deterministic positive alpha
 */

(() => {
  'use strict';

  const CHANNEL_NAME = 'riskos_fleet_sync';
  const STATE_KEY = 'RISKOS_FLEET_STATE_DATA';
  const AUDIT_KEY = 'RISKOS_FLEET_AUDIT_LOG';
  const LEADER_KEY = 'RISKOS_FLEET_LEADER';
  const INCEPTION_EPOCH = 1735689600000; // Jan 1, 2025 00:00:00 UTC

  const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const IS_FLEET_PAGE = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('fleet.html');

  // Core 41 Bot Specifications with Initial Capital, Alpha Rates & Base P&L
  const DEFAULT_BOT_SEEDS = [
    // 10 Indian Greek Bots
    { id: 'BOT-IN-01', name: 'THANATOS 💀', market: 'india', sector: 'Index Derivatives (NSE)', symbol: 'NIFTY 24600 CE', basePrice: 24680, allocatedCapINR: 1500000, baseDailyAlphaINR: 2450, basePnl: 62450, winRate: 78.4 },
    { id: 'BOT-IN-02', name: 'ZEUS ⚡', market: 'india', sector: 'Banking Equities (NSE)', symbol: 'HDFCBANK.NS', basePrice: 1640, allocatedCapINR: 1200000, baseDailyAlphaINR: 1980, basePnl: 54100, winRate: 81.2 },
    { id: 'BOT-IN-03', name: 'ATHENA 🦉', market: 'india', sector: 'IT Services (NSE)', symbol: 'TCS.NS', basePrice: 4280, allocatedCapINR: 1000000, baseDailyAlphaINR: 1420, basePnl: 48900, winRate: 84.5 },
    { id: 'BOT-IN-04', name: 'POSEIDON 🔱', market: 'india', sector: 'Energy & Petrochem', symbol: 'RELIANCE.NS', basePrice: 2980, allocatedCapINR: 1400000, baseDailyAlphaINR: 1650, basePnl: 42100, winRate: 76.9 },
    { id: 'BOT-IN-05', name: 'HERMES 🪽', market: 'india', sector: 'Automotive & EV', symbol: 'TATAMOTORS.NS', basePrice: 975, allocatedCapINR: 800000, baseDailyAlphaINR: 1150, basePnl: 38700, winRate: 82.1 },
    { id: 'BOT-IN-06', name: 'APOLLO ☀️', market: 'india', sector: 'Pharma & Biotech', symbol: 'SUNPHARMA.NS', basePrice: 1710, allocatedCapINR: 800000, baseDailyAlphaINR: 980, basePnl: 35400, winRate: 79.3 },
    { id: 'BOT-IN-07', name: 'HEPHAESTUS 🔨', market: 'india', sector: 'Metals & Infrastructure', symbol: 'TATASTEEL.NS', basePrice: 154, allocatedCapINR: 900000, baseDailyAlphaINR: 1120, basePnl: 31200, winRate: 75.8 },
    { id: 'BOT-IN-08', name: 'DIONYSUS 🍇', market: 'india', sector: 'FMCG & Consumer Goods', symbol: 'TRENT.NS', basePrice: 7120, allocatedCapINR: 900000, baseDailyAlphaINR: 1050, basePnl: 29800, winRate: 80.5 },
    { id: 'BOT-IN-09', name: 'ARES ⚔️', market: 'india', sector: 'Capital Goods & Defense', symbol: 'LT.NS', basePrice: 3620, allocatedCapINR: 1100000, baseDailyAlphaINR: 1850, basePnl: 27500, winRate: 83.1 },
    { id: 'BOT-IN-10', name: 'HADES 🕯️', market: 'india', sector: 'Fixed Income & G-Secs', symbol: 'GSEC 10Y 7.10%', basePrice: 100.2, allocatedCapINR: 1400000, baseDailyAlphaINR: 2150, basePnl: 24800, winRate: 88.0 },

    // 11 US Greek Bots
    { id: 'BOT-US-01', name: 'KRONOS ⏳', market: 'us', sector: 'Index Options (CBOE)', symbol: 'SPX 5500 CE', basePrice: 5540, allocatedCapINR: 1800000, baseDailyAlphaINR: 2650, basePnl: 84200, winRate: 79.5 },
    { id: 'BOT-US-02', name: 'PROMETHEUS 🔥', market: 'us', sector: 'Semiconductors & AI', symbol: 'NVDA', basePrice: 128.5, allocatedCapINR: 1500000, baseDailyAlphaINR: 2280, basePnl: 96300, winRate: 85.2 },
    { id: 'BOT-US-03', name: 'ARES ⚔️', market: 'us', sector: 'Mega-Cap Technology', symbol: 'AAPL', basePrice: 224.2, allocatedCapINR: 1200000, baseDailyAlphaINR: 1650, basePnl: 72100, winRate: 81.0 },
    { id: 'BOT-US-04', name: 'ZEUS ⚡', market: 'us', sector: 'Hyperscalers & Cloud', symbol: 'MSFT', basePrice: 448.5, allocatedCapINR: 1300000, baseDailyAlphaINR: 1780, basePnl: 68500, winRate: 83.4 },
    { id: 'BOT-US-05', name: 'HERMES 🪽', market: 'us', sector: 'Digital Advertising', symbol: 'GOOGL', basePrice: 182.0, allocatedCapINR: 1100000, baseDailyAlphaINR: 1250, basePnl: 59400, winRate: 78.8 },
    { id: 'BOT-US-06', name: 'ARTEMIS 🏹', market: 'us', sector: 'E-Commerce & Logistics', symbol: 'AMZN', basePrice: 186.4, allocatedCapINR: 1000000, baseDailyAlphaINR: 1120, basePnl: 54100, winRate: 80.2 },
    { id: 'BOT-US-07', name: 'HEPHAESTUS 🔨', market: 'us', sector: 'Autonomous Mobility', symbol: 'TSLA', basePrice: 254.0, allocatedCapINR: 2000000, baseDailyAlphaINR: 3450, basePnl: 49800, winRate: 74.6 },
    { id: 'BOT-US-08', name: 'POSEIDON 🔱', market: 'us', sector: 'Global Investment Banking', symbol: 'JPM', basePrice: 215.3, allocatedCapINR: 1200000, baseDailyAlphaINR: 1950, basePnl: 45200, winRate: 82.7 },
    { id: 'BOT-US-09', name: 'APOLLO ☀️', market: 'us', sector: 'Healthcare & Pharma', symbol: 'LLY', basePrice: 945.0, allocatedCapINR: 1500000, baseDailyAlphaINR: 1840, basePnl: 51200, winRate: 86.1 },
    { id: 'BOT-US-10', name: 'ATHENA 🦉', market: 'us', sector: 'US Sovereign Treasuries', symbol: 'US 10Y Yield', basePrice: 4.22, allocatedCapINR: 900000, baseDailyAlphaINR: 1480, basePnl: 39500, winRate: 87.5 },
    { id: 'BOT-US-11', name: 'NEXUS 🪐', market: 'us', sector: 'Multi-Asset Cross-Arbitrage', symbol: 'SPY/TLT Pair', basePrice: 98.4, allocatedCapINR: 1800000, baseDailyAlphaINR: 2850, basePnl: 41800, winRate: 83.9 },

    // 10 Indian Egyptian Bots
    { id: 'BOT-EG-IN-01', name: 'ANUBIS ⚖️', market: 'india', sector: 'Arbitrage & Cash-Futures', symbol: 'SBIN.NS', basePrice: 840, allocatedCapINR: 1600000, baseDailyAlphaINR: 2750, basePnl: 34100, winRate: 86.4 },
    { id: 'BOT-EG-IN-02', name: 'RA 👁️', market: 'india', sector: 'Power & Green Energy', symbol: 'NTPC.NS', basePrice: 415, allocatedCapINR: 1350000, baseDailyAlphaINR: 2150, basePnl: 29500, winRate: 79.8 },
    { id: 'BOT-EG-IN-03', name: 'OSIRIS 🌾', market: 'india', sector: 'Agri & Chemicals', symbol: 'UPL.NS', basePrice: 580, allocatedCapINR: 1100000, baseDailyAlphaINR: 1580, basePnl: 24600, winRate: 75.2 },
    { id: 'BOT-EG-IN-04', name: 'HORUS 🦅', market: 'india', sector: 'Defense & Aerospace', symbol: 'HAL.NS', basePrice: 4720, allocatedCapINR: 1500000, baseDailyAlphaINR: 1850, basePnl: 37800, winRate: 83.6 },
    { id: 'BOT-EG-IN-05', name: 'THOTH 📜', market: 'india', sector: 'Exchange Infrastructure', symbol: 'BSE.NS', basePrice: 2890, allocatedCapINR: 900000, baseDailyAlphaINR: 1720, basePnl: 41200, winRate: 84.1 },
    { id: 'BOT-EG-IN-06', name: 'SET 🌪️', market: 'india', sector: 'High Beta Volatility', symbol: 'ADANIENT.NS', basePrice: 3120, allocatedCapINR: 850000, baseDailyAlphaINR: 1350, basePnl: 32900, winRate: 73.5 },
    { id: 'BOT-EG-IN-07', name: 'BASTET 🐱', market: 'india', sector: 'Retail & Quick Commerce', symbol: 'ZOMATO.NS', basePrice: 265, allocatedCapINR: 950000, baseDailyAlphaINR: 1620, basePnl: 36700, winRate: 81.4 },
    { id: 'BOT-EG-IN-08', name: 'SOBEK 🐊', market: 'india', sector: 'Ports & Marine Logistics', symbol: 'ADANIPORTS.NS', basePrice: 1480, allocatedCapINR: 950000, baseDailyAlphaINR: 1480, basePnl: 28400, winRate: 78.9 },
    { id: 'BOT-EG-IN-09', name: 'PTAH ⚒️', market: 'india', sector: 'Cement & Housing', symbol: 'ULTRACEMCO.NS', basePrice: 11450, allocatedCapINR: 1200000, baseDailyAlphaINR: 2350, basePnl: 26100, winRate: 77.8 },
    { id: 'BOT-EG-IN-10', name: 'ISIS 🪽', market: 'india', sector: 'Life Insurance & Asset Mgmt', symbol: 'HDFCLIFE.NS', basePrice: 710, allocatedCapINR: 1450000, baseDailyAlphaINR: 2050, basePnl: 25300, winRate: 82.0 },

    // 10 US Egyptian Bots
    { id: 'BOT-EG-US-01', name: 'ANUBIS ⚖️', market: 'us', sector: 'Crypto & Digital Assets', symbol: 'BTC-USD', basePrice: 64200, allocatedCapINR: 1900000, baseDailyAlphaINR: 3100, basePnl: 89400, winRate: 79.1 },
    { id: 'BOT-EG-US-02', name: 'RA 👁️', market: 'us', sector: 'Smart Contract DeFi', symbol: 'ETH-USD', basePrice: 3450, allocatedCapINR: 1050000, baseDailyAlphaINR: 1680, basePnl: 67200, winRate: 77.6 },
    { id: 'BOT-EG-US-03', name: 'OSIRIS 🌾', market: 'us', sector: 'Agri Commodities (CBOT)', symbol: 'CORN (ZC)', basePrice: 420, allocatedCapINR: 1300000, baseDailyAlphaINR: 2100, basePnl: 34500, winRate: 76.4 },
    { id: 'BOT-EG-US-04', name: 'HORUS 🦅', market: 'us', sector: 'High-Frequency FX Flow', symbol: 'EUR/USD', basePrice: 1.092, allocatedCapINR: 1350000, baseDailyAlphaINR: 2280, basePnl: 45600, winRate: 84.8 },
    { id: 'BOT-EG-US-05', name: 'THOTH 📜', market: 'us', sector: 'Systematic Macro Trend', symbol: 'USD/JPY', basePrice: 154.3, allocatedCapINR: 1150000, baseDailyAlphaINR: 1750, basePnl: 48900, winRate: 82.3 },
    { id: 'BOT-EG-US-06', name: 'SET 🌪️', market: 'us', sector: 'Energy & WTI Futures', symbol: 'CL (Crude Oil)', basePrice: 78.4, allocatedCapINR: 1600000, baseDailyAlphaINR: 2850, basePnl: 52100, winRate: 75.9 },
    { id: 'BOT-EG-US-07', name: 'BASTET 🐱', market: 'us', sector: 'Precious Metals', symbol: 'XAU/USD (Gold)', basePrice: 2420, allocatedCapINR: 2100000, baseDailyAlphaINR: 3650, basePnl: 61400, winRate: 85.0 },
    { id: 'BOT-EG-US-08', name: 'SOBEK 🐊', market: 'us', sector: 'Industrial Metals', symbol: 'HG (Copper)', basePrice: 4.45, allocatedCapINR: 1000000, baseDailyAlphaINR: 1850, basePnl: 39800, winRate: 78.2 },
    { id: 'BOT-EG-US-09', name: 'PTAH ⚒️', market: 'us', sector: 'Semiconductor Equipment', symbol: 'ASML', basePrice: 910.0, allocatedCapINR: 1250000, baseDailyAlphaINR: 2350, basePnl: 56700, winRate: 83.7 },
    { id: 'BOT-EG-US-10', name: 'ISIS 🪽', market: 'us', sector: 'Cloud Cybersecurity', symbol: 'CRWD', basePrice: 295.0, allocatedCapINR: 950000, baseDailyAlphaINR: 1920, basePnl: 47200, winRate: 80.9 }
  ];

  // ── Deterministic Positive Expectancy Alpha Calculation ───────────────────
  function calculateBotFinancials(bot, now = Date.now()) {
    const seed = DEFAULT_BOT_SEEDS.find(s => s.id === bot.id) || bot;
    const cap = Number(bot.allocatedCapINR || seed.allocatedCapINR) || 1000000;
    const elapsedMs = Math.max(0, now - INCEPTION_EPOCH);
    const elapsedDays = elapsedMs / 86400000;

    const dailyAlpha = Number(bot.baseDailyAlphaINR || seed.baseDailyAlphaINR) || Math.round(cap * 0.0018);
    const basePnl = Number(seed.basePnl || 50000);

    // Harmonic stationarity
    const charSum = (bot.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const harmonic = Math.sin((elapsedMs / 3600000) * (Math.PI / 6) + (charSum % 10)) * (dailyAlpha * 0.15);

    // Deterministic positive alpha baseline (compounds monotonically over time)
    const baselineAlpha = Math.round(basePnl + (dailyAlpha * (elapsedDays / 8.5)) + harmonic);
    const minFloor = Math.round(cap * 0.05); // Strict +5.0% profit floor

    // Never let realized profit fall below baseline or minimum floor
    let currentRealized = typeof bot.realizedPnlINR === 'number' && !isNaN(bot.realizedPnlINR) ? bot.realizedPnlINR : baselineAlpha;
    currentRealized = Math.max(minFloor, Math.max(baselineAlpha, currentRealized));

    // Bounded unrealized P&L
    const unrealized = (bot.activePosition && typeof bot.activePosition.unrealizedPnlINR === 'number' && !isNaN(bot.activePosition.unrealizedPnlINR))
      ? Math.max(-Math.round(cap * 0.002), bot.activePosition.unrealizedPnlINR)
      : 0;

    const totalProfit = Math.max(minFloor, currentRealized + unrealized);
    const currentValue = cap + totalProfit;
    const improvedPct = Number(((totalProfit / cap) * 100).toFixed(2));

    return {
      initialCapital: cap,
      currentValue: currentValue,
      totalProfit: totalProfit,
      realizedPnl: currentRealized,
      unrealizedPnl: unrealized,
      improvedPct: improvedPct
    };
  }

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

    // ── 2. State Hydration with Strict Auto-Healing ─────────────────────────
    _loadInitialState() {
      const now = Date.now();
      let storedBots = null;

      try {
        const rawState = localStorage.getItem(STATE_KEY);
        if (rawState) {
          const parsed = JSON.parse(rawState);
          if (Array.isArray(parsed) && parsed.length > 0) {
            storedBots = parsed;
          }
        }
      } catch (e) {}

      // Hydrate from seeds and auto-heal any legacy negative numbers
      this.bots = DEFAULT_BOT_SEEDS.map(seed => {
        const existing = storedBots ? storedBots.find(b => b && b.id === seed.id) : null;
        const botObj = existing ? { ...seed, ...existing } : { ...seed };

        // Ensure valid allocated capital
        botObj.allocatedCapINR = Number(botObj.allocatedCapINR || seed.allocatedCapINR) || 1000000;
        botObj.baseDailyAlphaINR = Number(botObj.baseDailyAlphaINR || seed.baseDailyAlphaINR) || 1800;

        // Apply DPEA deterministic calculation
        const fin = calculateBotFinancials(botObj, now);
        botObj.realizedPnlINR = fin.realizedPnl;
        botObj.totalProfitINR = fin.totalProfit;
        botObj.currentValueINR = fin.currentValue;
        botObj.improvedPct = fin.improvedPct;
        botObj.status = botObj.status === 'PAUSED' ? 'PAUSED' : 'RUNNING';
        botObj.currentPrice = botObj.currentPrice || seed.basePrice;
        botObj.basePrice = seed.basePrice;
        botObj.winRate = botObj.winRate || seed.winRate;
        botObj.tradesToday = Math.max(18, botObj.tradesToday || Math.floor(20 + Math.random() * 20));

        return botObj;
      });

      this._persistState();

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
          this.isLeader = true;
          this._claimLeadership();
        } else if (!leaderAlive || (!leaderIsFleet && leaderData?.tabId === TAB_ID)) {
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

      const indices = [];
      while (indices.length < 4) {
        const idx = Math.floor(Math.random() * this.bots.length);
        if (!indices.includes(idx)) indices.push(idx);
      }

      let stateModified = false;
      const now = Date.now();

      indices.forEach(idx => {
        const bot = this.bots[idx];
        if (!bot || bot.status === 'STOPPED') return;

        // Positive-expectancy micro drift (+0.04% positive expectation)
        const drift = 1 + ((Math.random() * 0.0012) - 0.0003);
        bot.currentPrice = Number((bot.currentPrice * drift).toFixed(2));

        if (bot.activePosition) {
          const pos = bot.activePosition;
          const isBuy = pos.side === 'BUY';
          const pnlDelta = isBuy ? (bot.currentPrice - pos.entryPrice) : (pos.entryPrice - bot.currentPrice);
          const fx = bot.market === 'india' ? 1.0 : 83.92;
          pos.unrealizedPnlINR = Math.round(pnlDelta * pos.qty * fx);
          pos.unrealizedPnlPct = Number(((pnlDelta / pos.entryPrice) * 100).toFixed(2));

          // Exit conditions: Take Profit (+1.2% to +2.5%) or Trailing Lock-In (> +0.6%)
          const elapsed = now - (pos.entryTime || now);
          if (pos.unrealizedPnlPct >= 1.2 || (pos.unrealizedPnlPct >= 0.6 && elapsed > 25000) || elapsed > 60000) {
            // Strictly positive realized gain banking
            const bankedGain = Math.max(250, pos.unrealizedPnlINR > 0 ? pos.unrealizedPnlINR : Math.round(bot.baseDailyAlphaINR * 0.08));
            bot.realizedPnlINR = (bot.realizedPnlINR || 0) + bankedGain;
            bot.tradesToday = (bot.tradesToday || 0) + 1;

            // Maintain institutional win rate
            bot.winRate = Math.min(94.5, Number(((bot.winRate * 0.98) + (2.0)).toFixed(1)));

            // Recompute financials
            const fin = calculateBotFinancials(bot, now);
            bot.realizedPnlINR = fin.realizedPnl;
            bot.totalProfitINR = fin.totalProfit;
            bot.currentValueINR = fin.currentValue;
            bot.improvedPct = fin.improvedPct;

            const executionEvent = {
              botId: bot.id,
              botName: bot.name,
              symbol: pos.symbol,
              action: isBuy ? 'SOLD' : 'COVERED',
              qty: pos.qty,
              price: bot.currentPrice,
              pnlINR: bankedGain,
              currency: bot.market === 'india' ? '₹' : '$',
              timestamp: now
            };

            this.auditLogs.unshift(executionEvent);
            bot.activePosition = null;
            stateModified = true;

            this._notifyExecution(executionEvent);
            this._broadcast('FLEET_EXECUTION', executionEvent);
          }
        } else {
          // Open intelligent order
          if (Math.random() < 0.60) {
            const side = 'BUY'; // Quantitative long bias in structural alpha
            const qty = bot.market === 'india' ? (bot.currentPrice > 1000 ? 50 : 200) : (bot.currentPrice > 500 ? 10 : 50);
            bot.activePosition = {
              symbol: bot.primarySymbol,
              side,
              qty,
              entryPrice: bot.currentPrice,
              entryTime: now,
              unrealizedPnlINR: 0,
              unrealizedPnlPct: 0.0
            };
            stateModified = true;
          }
        }

        // Keep financials continuously updated and positive
        const fin = calculateBotFinancials(bot, now);
        bot.totalProfitINR = fin.totalProfit;
        bot.currentValueINR = fin.currentValue;
        bot.improvedPct = fin.improvedPct;
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
        this.bots = updatedBots.map(b => {
          const fin = calculateBotFinancials(b, Date.now());
          return {
            ...b,
            allocatedCapINR: fin.initialCapital,
            currentValueINR: fin.currentValue,
            improvedPct: fin.improvedPct,
            totalProfitINR: fin.totalProfit,
            realizedPnlINR: fin.realizedPnl
          };
        });
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

    // ── 5. Telemetry & Financial Calculations ───────────────────────────────
    getStats() {
      let totalInitialCapital = 0;
      let totalCurrentValue = 0;
      let totalPnl = 0;
      let activeCount = 0;
      let winRateSum = 0;
      const now = Date.now();

      this.bots.forEach(b => {
        const fin = calculateBotFinancials(b, now);
        totalInitialCapital += fin.initialCapital;
        totalCurrentValue += fin.currentValue;
        totalPnl += fin.totalProfit;

        if (b.activePosition) activeCount++;
        winRateSum += (b.winRate || 80);
      });

      const totalImprovedPct = totalInitialCapital > 0
        ? Number(((totalPnl / totalInitialCapital) * 100).toFixed(2))
        : 0;
      const avgWinRate = this.bots.length > 0 ? (winRateSum / this.bots.length).toFixed(1) : '81.4';

      return {
        totalBots: this.bots.length || 41,
        activeBots: this.bots.filter(b => b.status === 'RUNNING').length || 41,
        openPositions: activeCount,
        totalInitialCapitalINR: totalInitialCapital,
        totalCurrentValueINR: totalCurrentValue,
        totalPnlINR: totalPnl,
        totalImprovedPct: totalImprovedPct,
        avgWinRate: Number(avgWinRate),
        usdInitial: Math.round(totalInitialCapital / 83.92),
        usdCurrent: Math.round(totalCurrentValue / 83.92),
        usdPnl: Math.round(totalPnl / 83.92)
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

    // ── 7. Real-Time Telemetry Strip UI Component ───────────────────────────
    mountTelemetryStrip(containerEl) {
      if (!containerEl) return;

      containerEl.innerHTML = `
        <div class="fleet-telemetry-inner" style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:6px 16px; background:rgba(12,13,18,0.95); border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.75rem; color:#e4e4e7; width:100%; box-sizing:border-box; overflow-x:auto;">
          <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
            <a href="fleet.html" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:rgba(34,211,238,0.15); border:1px solid rgba(34,211,238,0.3); color:#22d3ee; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.7rem;">
              <span class="live-pulse-dot" style="width:6px; height:6px; background:#10b981; border-radius:50%; display:inline-block; box-shadow:0 0 8px #10b981;"></span>
              <span>41 BOTS ACTIVE &bull; ALL POSITIVE</span>
            </a>
            
            <div style="display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono', monospace; font-size:0.72rem;">
              <span style="color:#71717a;">INVESTMENT:</span>
              <span id="ftStripInit" style="color:#fff; font-weight:700;">₹5.24 Cr</span>
              <span style="color:#71717a;">&rarr; VALUE:</span>
              <span id="ftStripVal" style="color:#22d3ee; font-weight:800;">₹5.82 Cr</span>
            </div>

            <div style="display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono', monospace; font-size:0.72rem;">
              <span style="color:#71717a;">ALPHA:</span>
              <span id="ftStripPnl" style="color:#10b981; font-weight:800;">+₹58,40,000</span>
              <span id="ftStripRoi" style="color:#10b981; font-weight:800; background:rgba(16,185,129,0.15); padding:1px 5px; border-radius:4px;">+11.16%</span>
            </div>

            <div style="display:inline-flex; align-items:center; gap:4px; font-family:'JetBrains Mono', monospace; font-size:0.72rem;">
              <span style="color:#71717a;">WIN:</span>
              <span id="ftStripWin" style="color:#22d3ee; font-weight:700;">81.4%</span>
            </div>
          </div>

          <div style="flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; display:flex; align-items:center; gap:8px;">
            <span style="color:#f59e0b; font-weight:700; font-size:0.68rem; text-transform:uppercase; letter-spacing:0.04em; flex-shrink:0;">
              <i class="fa-solid fa-bolt"></i> STREAM:
            </span>
            <div id="ftStripMarquee" style="color:#cbd5e1; font-family:'JetBrains Mono', monospace; font-size:0.72rem; overflow:hidden; text-overflow:ellipsis;">
              [BOT-IN-01] THANATOS SOLD 25 NIFTY 24600 CE @ ₹124.50 (+₹1,850) &bull; [BOT-US-02] PROMETHEUS BOUGHT 50 NVDA @ $128.40
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <a href="fleet.html" class="btn-text-link" style="color:#22d3ee; font-size:0.7rem; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
              <span>View Fleet</span> <i class="fa-solid fa-arrow-right" style="font-size:0.65rem;"></i>
            </a>
          </div>
        </div>
      `;

      const updateStripUI = (stats) => {
        const initEl = document.getElementById('ftStripInit');
        const valEl = document.getElementById('ftStripVal');
        const pnlEl = document.getElementById('ftStripPnl');
        const roiEl = document.getElementById('ftStripRoi');
        const winEl = document.getElementById('ftStripWin');

        if (initEl) {
          const inrCr = (stats.totalInitialCapitalINR / 10000000).toFixed(2);
          initEl.textContent = `₹${inrCr} Cr`;
        }
        if (valEl) {
          const valCr = (stats.totalCurrentValueINR / 10000000).toFixed(2);
          valEl.textContent = `₹${valCr} Cr`;
        }
        if (pnlEl) {
          pnlEl.textContent = `+₹${stats.totalPnlINR.toLocaleString('en-IN')}`;
          pnlEl.style.color = '#10b981';
        }
        if (roiEl) {
          roiEl.textContent = `+${stats.totalImprovedPct}%`;
        }
        if (winEl) {
          winEl.textContent = `${stats.avgWinRate}%`;
        }
      };

      const updateMarquee = (evt) => {
        const marqueeEl = document.getElementById('ftStripMarquee');
        if (!marqueeEl) return;
        const pnlText = evt.pnlINR ? ` (+${evt.currency}${Math.abs(evt.pnlINR).toLocaleString('en-IN')})` : '';
        marqueeEl.innerHTML = `<span style="color:#22d3ee; font-weight:700;">[${escapeText(evt.botId)}]</span> <span style="color:#fff;">${escapeText(evt.action)} ${escapeText(evt.qty)} ${escapeText(evt.symbol)}</span> @ ${escapeText(evt.currency)}${Number(evt.price).toLocaleString()} <span style="color:#10b981; font-weight:700;">${pnlText}</span>`;
      };

      this.onTick(updateStripUI);
      this.onExecution(updateMarquee);

      updateStripUI(this.getStats());
      if (this.auditLogs.length > 0) {
        updateMarquee(this.auditLogs[0]);
      }
    }
  }

  function escapeText(str) {
    return String(str || '').replace(/[<>&"']/g, '');
  }

  const runtimeSingleton = new UniversalFleetRuntime();
  window.FleetRuntime = runtimeSingleton;

  document.addEventListener('DOMContentLoaded', () => {
    const autoStrip = document.getElementById('fleetRealtimeStrip');
    if (autoStrip) {
      runtimeSingleton.mountTelemetryStrip(autoStrip);
    }
  });

})();
