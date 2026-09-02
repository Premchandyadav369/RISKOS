/**
 * RISKOS 24/7 AUTONOMOUS BOT FLEET ORCHESTRATION ENGINE (fleet.js)
 * 20 Distinct Multi-Sector Algorithmic Trading Bots (10 Indian + 10 US/Global).
 */

(() => {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 1. THE 20 QUANTITATIVE SECTOR BOTS REGISTRY
  // ══════════════════════════════════════════════════════════════════════════
  const BOTS_REGISTRY = [
    // 🇮🇳 INDIAN SECTOR FLEET (10 BOTS)
    {
      id: 'BOT-IN-01',
      market: 'india',
      sector: 'Index Derivatives (NSE)',
      name: 'NIFTY 0DTE Volatility Skew & Theta Harvester',
      assets: 'NIFTY 50 & BANKNIFTY Options',
      strategyType: 'Delta-Neutral Vol Dispersion',
      mathFormula: 'GARCH(1,1) Vol Spread + SABR Smile Mispricing',
      status: 'RUNNING',
      allocatedCapINR: 1500000,
      realizedPnlINR: 62450,
      unrealizedPnlINR: 8200,
      winRate: 78.4,
      tradesToday: 38,
      sharpe: 3.12,
      maxDD: -0.65,
      activePosition: 'NIFTY 24600 Iron Condor (400 Qty)',
      desc: 'Sells OTM options when implied volatility trades at +2.5σ premium to realized GARCH volatility; delta-hedges when |Δnet| > 0.15.'
    },
    {
      id: 'BOT-IN-02',
      market: 'india',
      sector: 'Banking & Financials',
      name: 'HDFCBANK vs ICICIBANK Kalman Pairs Arb',
      assets: 'HDFCBANK / ICICIBANK (NSE)',
      strategyType: 'Statistical Arbitrage',
      mathFormula: 'Recursive Kalman Filter State-Space βt Spread',
      status: 'RUNNING',
      allocatedCapINR: 1200000,
      realizedPnlINR: 41800,
      unrealizedPnlINR: 5400,
      winRate: 81.2,
      tradesToday: 18,
      sharpe: 3.45,
      maxDD: -0.42,
      activePosition: 'Long 350 ICICIBANK / Short 210 HDFCBANK',
      desc: 'Continuous cointegration spread arbitrage tracking mean-reversion when standardized Kalman residual |z| > 2.2.'
    },
    {
      id: 'BOT-IN-03',
      market: 'india',
      sector: 'IT & Software Technology',
      name: 'TCS / INFY Dual-Momentum Volatility Breakout',
      assets: 'TCS, INFY, WIPRO (NSE)',
      strategyType: 'Cross-Sectional Momentum',
      mathFormula: 'Donchian 20D + Realized Volatility Target Scaling',
      status: 'RUNNING',
      allocatedCapINR: 1000000,
      realizedPnlINR: 32400,
      unrealizedPnlINR: -1200,
      winRate: 68.5,
      tradesToday: 14,
      sharpe: 2.42,
      maxDD: -1.15,
      activePosition: 'Long 150 TCS @ ₹4,480.00',
      desc: 'Captures IT earnings momentum and global enterprise tech tailwinds with adaptive ATR volatility trailing stops.'
    },
    {
      id: 'BOT-IN-04',
      market: 'india',
      sector: 'Energy & Petrochemicals',
      name: 'Reliance & ONGC Basis Carry Arbitrageur',
      assets: 'RELIANCE, ONGC (Cash vs Futures)',
      strategyType: 'Cost-of-Carry Arbitrage',
      mathFormula: 'S · e^(r - q)T Basis Mispricing > +8.5% / yr',
      status: 'RUNNING',
      allocatedCapINR: 1400000,
      realizedPnlINR: 28900,
      unrealizedPnlINR: 4100,
      winRate: 92.0,
      tradesToday: 12,
      sharpe: 4.10,
      maxDD: -0.25,
      activePosition: 'Long 500 RELIANCE Cash / Short Near Future',
      desc: 'Risk-free cash and carry convergence capturing futures rollover yield against overnight repo funding costs.'
    },
    {
      id: 'BOT-IN-05',
      market: 'india',
      sector: 'Automotive & Mobility',
      name: 'Tata Motors & Maruti L2 Microstructure Scalper',
      assets: 'TATAMOTORS, MARUTI (NSE L2 Depth)',
      strategyType: 'High-Frequency OFI Scalping',
      mathFormula: 'Level-2 Order Flow Imbalance (OFI) + Micro-Price',
      status: 'RUNNING',
      allocatedCapINR: 800000,
      realizedPnlINR: 21500,
      unrealizedPnlINR: 1800,
      winRate: 74.2,
      tradesToday: 84,
      sharpe: 2.88,
      maxDD: -0.72,
      activePosition: 'Flat (Queue Waiting on Bid @ ₹1,120.40)',
      desc: 'Micro-second queue consumption scalping entering when bid queue exceeds ask depth by 2.4x.'
    },
    {
      id: 'BOT-IN-06',
      market: 'india',
      sector: 'Pharma & Life Sciences',
      name: 'Sun Pharma & Dr Reddy Dynamic Mean-Reversion',
      assets: 'SUNPHARMA, DRREDDY, CIPLA (NSE)',
      strategyType: 'Statistical Mean Reversion',
      mathFormula: 'Bollinger Band (20, 2.2) + RSI Dynamic Divergence',
      status: 'RUNNING',
      allocatedCapINR: 800000,
      realizedPnlINR: 19400,
      unrealizedPnlINR: 3100,
      winRate: 71.0,
      tradesToday: 16,
      sharpe: 2.35,
      maxDD: -0.88,
      activePosition: 'Long 200 SUNPHARMA @ ₹1,820.00',
      desc: 'Exploits FDA inspection headline overreactions by buying statistical tail oversold dips.'
    },
    {
      id: 'BOT-IN-07',
      market: 'india',
      sector: 'Metals & Commodities',
      name: 'Tata Steel / JSW Steel Cross-Metal Momentum',
      assets: 'TATASTEEL, JSWSTEEL, HINDALCO',
      strategyType: 'Commodity Factor Trend',
      mathFormula: 'LME Metal Spread + China PMI Leading Indicator',
      status: 'RUNNING',
      allocatedCapINR: 900000,
      realizedPnlINR: 24600,
      unrealizedPnlINR: -850,
      winRate: 65.4,
      tradesToday: 22,
      sharpe: 2.15,
      maxDD: -1.35,
      activePosition: 'Long 1,200 TATASTEEL @ ₹152.40',
      desc: 'Follows global steel and aluminum pricing cycles correlated with London Metal Exchange (LME) physical inventory.'
    },
    {
      id: 'BOT-IN-08',
      market: 'india',
      sector: 'FMCG & Consumer Retail',
      name: 'ITC / Trent Volume Profile Auction Scalper',
      assets: 'ITC, TRENT, VBL, DMART (NSE)',
      strategyType: 'Volume Profile Auction Market',
      mathFormula: 'Value Area High (VAH) / Low (VAL) Mean-Reversion',
      status: 'RUNNING',
      allocatedCapINR: 900000,
      realizedPnlINR: 18200,
      unrealizedPnlINR: 2400,
      winRate: 76.5,
      tradesToday: 26,
      sharpe: 2.95,
      maxDD: -0.55,
      activePosition: 'Long 60 TRENT @ ₹7,140.00',
      desc: 'Executes trades when institutional auction price deviates outside 70% Volume Value Area distribution.'
    },
    {
      id: 'BOT-IN-09',
      market: 'india',
      sector: 'Defense & Infrastructure',
      name: 'HAL / BEL Avellaneda-Stoikov Market Maker',
      assets: 'HAL, BEL, LT (NSE)',
      strategyType: 'High-Frequency Market Making',
      mathFormula: 'Optimal Bid/Ask Spread s*(q) with Inventory Penalty γ',
      status: 'RUNNING',
      allocatedCapINR: 1100000,
      realizedPnlINR: 36500,
      unrealizedPnlINR: 4200,
      winRate: 84.1,
      tradesToday: 112,
      sharpe: 3.82,
      maxDD: -0.38,
      activePosition: 'Quoting 2-Sided Depth (Spread: 12 bps)',
      desc: 'Provides passive liquidity to defense stocks, continuously balancing inventory to earn the half-spread.'
    },
    {
      id: 'BOT-IN-10',
      market: 'india',
      sector: 'MCX Commodities (Evening)',
      name: 'MCX Gold & Crude Multi-Timeframe Trend CTA',
      assets: 'MCX Gold Mini, Silver, Crude Oil',
      strategyType: 'Multi-Timeframe Trend Following',
      mathFormula: 'Dual EMA (12/26) + ADX > 25 + Roll Carry Filter',
      status: 'RUNNING',
      allocatedCapINR: 1400000,
      realizedPnlINR: 48200,
      unrealizedPnlINR: 6500,
      winRate: 69.2,
      tradesToday: 30,
      sharpe: 2.74,
      maxDD: -0.92,
      activePosition: 'Long 2 Lots MCX GOLDM @ ₹78,400',
      desc: 'Executes 09:00 to 23:55 IST capturing US market macroeconomic data releases (CPI, Non-Farm Payrolls, FOMC).'
    },

    // 🇺🇸 US & 24/7 GLOBAL FLEET (10 BOTS)
    {
      id: 'BOT-US-01',
      market: 'us',
      sector: 'Tech Mega-Caps (NASDAQ)',
      name: 'NVDA / AAPL / MSFT Almgren-Chriss Slicer',
      assets: 'NVDA, AAPL, MSFT (NASDAQ)',
      strategyType: 'Optimal Execution & Smart Routing',
      mathFormula: 'Euler-Lagrange Impact Minimization (sinh(κ(T-t)))',
      status: 'RUNNING',
      allocatedCapINR: 1800000,
      realizedPnlINR: 58400,
      unrealizedPnlINR: 9200,
      winRate: 79.5,
      tradesToday: 94,
      sharpe: 3.25,
      maxDD: -0.58,
      activePosition: 'Accumulating NVDA (TWAP Slice 8/12)',
      desc: 'Slices institutional mega-cap orders dynamically to minimize permanent Kyle-lambda price impact and transaction costs.'
    },
    {
      id: 'BOT-US-02',
      market: 'us',
      sector: 'Semiconductors & AI Hardware',
      name: 'AMD / TSM Volatility Skew Gamma Scalper',
      assets: 'AMD, TSM, AVGO, QCOM Options',
      strategyType: 'Dynamic Gamma Scalping',
      mathFormula: '1/2 Γ S² (σ_realized² - σ_implied²) Δt - Fees',
      status: 'RUNNING',
      allocatedCapINR: 1500000,
      realizedPnlINR: 49200,
      unrealizedPnlINR: -1400,
      winRate: 72.8,
      tradesToday: 42,
      sharpe: 2.85,
      maxDD: -0.95,
      activePosition: 'Long 20 ATM Straddles / Rehedging Stock',
      desc: 'Long volatility strategy rebalancing delta every 15 minutes to extract gamma profits from violent semiconductor swings.'
    },
    {
      id: 'BOT-US-03',
      market: 'us',
      sector: 'US Financials & Yield Curve',
      name: 'JPMorgan / Goldman Sachs Yield Steepener Bot',
      assets: 'JPM, GS, MS, 2Y/10Y Treasuries',
      strategyType: 'Yield Curve Term-Structure Arb',
      mathFormula: 'Nelson-Siegel-Svensson Zero-Coupon Yield Curve Model',
      status: 'RUNNING',
      allocatedCapINR: 1200000,
      realizedPnlINR: 34100,
      unrealizedPnlINR: 4500,
      winRate: 76.0,
      tradesToday: 16,
      sharpe: 2.92,
      maxDD: -0.48,
      activePosition: 'Long JPM / Short 2Y Yield Proxy',
      desc: 'Trades bank net interest margin (NIM) expansion when the 2s10s yield curve uninverts and steepens.'
    },
    {
      id: 'BOT-US-04',
      market: 'us',
      sector: 'Healthcare & BioTech',
      name: 'Eli Lilly / Novo Nordisk Jump-Diffusion Bot',
      assets: 'LLY, NVO, UNH (NYSE)',
      strategyType: 'Merton Jump-Diffusion Event Arb',
      mathFormula: 'dS = (μ - λk)S dt + σ S dW + (Y-1)S dN (Poisson Jump)',
      status: 'RUNNING',
      allocatedCapINR: 1300000,
      realizedPnlINR: 37800,
      unrealizedPnlINR: 5200,
      winRate: 74.6,
      tradesToday: 20,
      sharpe: 2.78,
      maxDD: -0.82,
      activePosition: 'Long 40 LLY @ $945.20',
      desc: 'Captures clinical trial and GLP-1 revenue surprise jumps using continuous stochastic jump-diffusion modeling.'
    },
    {
      id: 'BOT-US-05',
      market: 'us',
      sector: 'Energy & Global Oil Majors',
      name: 'Exxon / Chevron Fama-French 5-Factor Bot',
      assets: 'XOM, CVX, BRENT Futures (CME)',
      strategyType: 'Multi-Factor Risk Premia',
      mathFormula: 'R_i - R_f = α + β_m MKT + β_s SMB + β_h HML + β_r RMW',
      status: 'RUNNING',
      allocatedCapINR: 1100000,
      realizedPnlINR: 26400,
      unrealizedPnlINR: 2100,
      winRate: 69.8,
      tradesToday: 18,
      sharpe: 2.45,
      maxDD: -0.75,
      activePosition: 'Long XOM / Short S&P Energy Index',
      desc: 'Harvests value, profitability, and high-cash-flow factors in upstream energy companies vs crude oil basis.'
    },
    {
      id: 'BOT-US-06',
      market: 'us',
      sector: 'Aerospace & Industrial',
      name: 'Boeing / GE Kyle-Lambda Informed Order Flow Bot',
      assets: 'BA, GE, CAT, HON (NYSE)',
      strategyType: 'Microstructure Adverse Selection',
      mathFormula: 'Price Impact ΔP = λ_Kyle · Order Flow Q',
      status: 'RUNNING',
      allocatedCapINR: 1000000,
      realizedPnlINR: 23800,
      unrealizedPnlINR: -900,
      winRate: 67.2,
      tradesToday: 28,
      sharpe: 2.28,
      maxDD: -1.05,
      activePosition: 'Long 120 GE @ $182.50',
      desc: 'Detects stealth institutional accumulation by measuring order flow permanent price impact.'
    },
    {
      id: 'BOT-US-07',
      market: 'us',
      sector: 'Crypto 24/7 L1 Layer-1',
      name: 'BTC / ETH Perpetual Funding Rate Cash & Carry',
      assets: 'BTC-USD, ETH-USD (Binance / Coinbase)',
      strategyType: 'Delta-Neutral Funding Arbitrage',
      mathFormula: 'Long Spot + Short Perp when Funding > +12% / yr',
      status: 'RUNNING',
      allocatedCapINR: 2000000,
      realizedPnlINR: 74200,
      unrealizedPnlINR: 11500,
      winRate: 98.2,
      tradesToday: 64,
      sharpe: 5.42,
      maxDD: -0.15,
      activePosition: 'Long 1.2 BTC Spot / Short 1.2 BTC Perp',
      desc: '24/7/365 Continuous completely delta-neutral yield harvesting paying out funding interest every 8 hours.'
    },
    {
      id: 'BOT-US-08',
      market: 'us',
      sector: 'Crypto 24/7 Altcoins & DeFi',
      name: 'SOL / BNB Cross-Exchange Triangular Arb',
      assets: 'SOL-USD, BNB-USD, AVAX-USD',
      strategyType: 'Cross-Venue High Frequency Arb',
      mathFormula: 'P_A(SOL/USD) / (P_B(SOL/USDT) · P_B(USDT/USD)) - 1 > Fee',
      status: 'RUNNING',
      allocatedCapINR: 1200000,
      realizedPnlINR: 42100,
      unrealizedPnlINR: 3800,
      winRate: 91.5,
      tradesToday: 180,
      sharpe: 4.85,
      maxDD: -0.28,
      activePosition: 'Cycling Micro Arbitrage Loops (24/7)',
      desc: 'Sub-second cross-venue latency arbitrage between Kraken, Binance, and decentralized AMM liquidity pools.'
    },
    {
      id: 'BOT-US-09',
      market: 'us',
      sector: 'Global Macro FX & Rates',
      name: 'USD/INR & DXY Volatility-Targeted Macro CTA',
      assets: 'USD/INR, DXY (Dollar Index), EUR/USD',
      strategyType: 'Macro Dual-Momentum Trend',
      mathFormula: 'Carry-Momentum Index w_i = σ_target / (σ_i · N)',
      status: 'RUNNING',
      allocatedCapINR: 1500000,
      realizedPnlINR: 39500,
      unrealizedPnlINR: 4800,
      winRate: 70.4,
      tradesToday: 24,
      sharpe: 2.65,
      maxDD: -0.85,
      activePosition: 'Long USD/INR 83.95 Futures',
      desc: 'Captures global central bank interest rate differentials and sovereign currency trend momentum 24/5.'
    },
    {
      id: 'BOT-US-10',
      market: 'us',
      sector: 'Prediction Markets 24/7',
      name: 'Polymarket Hanson LMSR Bayesian Event Bot',
      assets: 'Fed Interest Rate & Macro Outcomes',
      strategyType: 'Prediction Market Pricing Arbitrage',
      mathFormula: 'p_i = exp(q_i / b) / ∑_j exp(q_j / b) vs Econometric Prior',
      status: 'RUNNING',
      allocatedCapINR: 900000,
      realizedPnlINR: 31200,
      unrealizedPnlINR: 3200,
      winRate: 83.0,
      tradesToday: 32,
      sharpe: 3.55,
      maxDD: -0.45,
      activePosition: 'Holding 8,500 Shares "Fed Cuts 25 bps"',
      desc: '24/7 Hanson Logarithmic Market Scoring Rule (LMSR) market maker on global event and macro probability contracts.'
    }
  ];

  let currentFilter = 'all';
  let searchQuery = '';
  let fleetEquityChart = null;

  // ══════════════════════════════════════════════════════════════════════════
  // 2. RENDER BOT MATRIX GRID
  // ══════════════════════════════════════════════════════════════════════════
  const renderBotGrid = () => {
    const grid = document.getElementById('botGridContainer');
    if (!grid) return;

    const filtered = BOTS_REGISTRY.filter(bot => {
      const matchMarket = currentFilter === 'all' || bot.market === currentFilter;
      const matchSearch = !searchQuery || 
        bot.name.toLowerCase().includes(searchQuery) ||
        bot.sector.toLowerCase().includes(searchQuery) ||
        bot.assets.toLowerCase().includes(searchQuery) ||
        bot.strategyType.toLowerCase().includes(searchQuery);
      return matchMarket && matchSearch;
    });

    grid.innerHTML = filtered.map(bot => {
      const isRunning = bot.status === 'RUNNING';
      const totPnl = bot.realizedPnlINR + bot.unrealizedPnlINR;
      const pnlColor = totPnl >= 0 ? '#10b981' : '#f43f5e';
      const flag = bot.market === 'india' ? '🇮🇳' : '🇺🇸';

      return `
        <div class="bot-card ${!isRunning ? 'paused' : ''}" id="card-${bot.id}">
          <div class="bot-card-top">
            <div class="bot-card-title">
              <span class="bot-id-badge">${bot.id} &bull; ${flag} ${bot.strategyType}</span>
              <h4 class="bot-name">${bot.name}</h4>
              <span class="bot-sector-tag"><i class="fa-solid fa-layer-group"></i> ${bot.sector}</span>
            </div>
            <span class="bot-status-pill ${isRunning ? 'status-running' : 'status-paused'}" id="status-${bot.id}">
              <i class="fa-solid ${isRunning ? 'fa-circle fa-beat' : 'fa-circle-pause'}"></i> ${bot.status}
            </span>
          </div>

          <div class="bot-math-badge" title="${bot.mathFormula}">
            <i class="fa-solid fa-square-root-variable text-cyan"></i> ${bot.mathFormula.substring(0, 48)}...
          </div>

          <div class="bot-stats-grid">
            <div class="bot-stat-box">
              <div class="bot-stat-label">Net P&amp;L</div>
              <div class="bot-stat-val" style="color:${pnlColor};" id="pnl-${bot.id}">
                ${totPnl >= 0 ? '+' : ''}₹${totPnl.toLocaleString('en-IN')}
              </div>
            </div>
            <div class="bot-stat-box">
              <div class="bot-stat-label">Win Rate &bull; Sharpe</div>
              <div class="bot-stat-val text-cyan">${bot.winRate}% &bull; ${bot.sharpe}</div>
            </div>
            <div class="bot-stat-box">
              <div class="bot-stat-label">Trades Today</div>
              <div class="bot-stat-val text-amber" id="trades-${bot.id}">${bot.tradesToday} Fills</div>
            </div>
          </div>

          <div style="font-size:0.7rem; color:#aaa; margin-bottom:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <i class="fa-solid fa-crosshairs text-green"></i> <strong>Position:</strong> <span style="color:#fff;" id="pos-${bot.id}">${bot.activePosition}</span>
          </div>

          <div class="bot-card-actions">
            <button class="bot-btn-mini btn-view-bot" data-id="${bot.id}">
              <i class="fa-solid fa-eye"></i> View Telemetry
            </button>
            <button class="bot-btn-mini bot-btn-toggle" data-id="${bot.id}" id="toggle-${bot.id}">
              <i class="fa-solid ${isRunning ? 'fa-pause' : 'fa-play'}"></i> ${isRunning ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach button listeners
    grid.querySelectorAll('.bot-btn-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        toggleBot(id);
      });
    });

    grid.querySelectorAll('.btn-view-bot').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openBotModal(id);
      });
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. BOT CONTROL FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════
  const toggleBot = (botId) => {
    const bot = BOTS_REGISTRY.find(b => b.id === botId);
    if (!bot) return;

    bot.status = bot.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    const isRunning = bot.status === 'RUNNING';

    const card = document.getElementById(`card-${botId}`);
    const statusPill = document.getElementById(`status-${botId}`);
    const toggleBtn = document.getElementById(`toggle-${botId}`);

    if (card) card.classList.toggle('paused', !isRunning);
    if (statusPill) {
      statusPill.className = `bot-status-pill ${isRunning ? 'status-running' : 'status-paused'}`;
      statusPill.innerHTML = `<i class="fa-solid ${isRunning ? 'fa-circle fa-beat' : 'fa-circle-pause'}"></i> ${bot.status}`;
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = `<i class="fa-solid ${isRunning ? 'fa-pause' : 'fa-play'}"></i> ${isRunning ? 'Pause' : 'Resume'}`;
    }

    updateGlobalTelemetry();
    addBlotterLog(bot, isRunning ? 'RESUMED' : 'PAUSED', 0, isRunning ? 'Bot restarted via command matrix' : 'Bot execution paused manually');
  };

  const setAllBots = (targetStatus) => {
    BOTS_REGISTRY.forEach(bot => {
      bot.status = targetStatus;
    });
    renderBotGrid();
    updateGlobalTelemetry();
    addBlotterLog(BOTS_REGISTRY[0], 'GLOBAL_FLEET', 0, `All 20 Bots switched to ${targetStatus}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. LIVE TELEMETRY & BLOTTER STREAM
  // ══════════════════════════════════════════════════════════════════════════
  const updateGlobalTelemetry = () => {
    const runningCount = BOTS_REGISTRY.filter(b => b.status === 'RUNNING').length;
    const totalRealized = BOTS_REGISTRY.reduce((acc, b) => acc + b.realizedPnlINR + b.unrealizedPnlINR, 0);
    const totalTrades = BOTS_REGISTRY.reduce((acc, b) => acc + b.tradesToday, 0);

    const activeEl = document.getElementById('telActiveBots');
    const pnlEl = document.getElementById('telDailyPnl');
    const fillsEl = document.getElementById('telTotalFills');

    if (activeEl) activeEl.textContent = `${runningCount} / ${BOTS_REGISTRY.length} Running`;
    if (pnlEl) {
      const usdVal = (totalRealized / 83.5).toFixed(0);
      pnlEl.textContent = `+₹${totalRealized.toLocaleString('en-IN')} ($${Number(usdVal).toLocaleString('en-US')})`;
    }
    if (fillsEl) fillsEl.textContent = `${totalTrades.toLocaleString()} Orders`;
  };

  const addBlotterLog = (bot, side, qty, note) => {
    const stream = document.getElementById('fleetBlotterStream');
    if (!stream) return;

    const row = document.createElement('div');
    const isBuy = side.includes('BUY') || side === 'RESUMED' || side === 'LONG';
    row.className = `blotter-row ${isBuy ? 'buy' : 'sell'}`;
    
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    row.innerHTML = `
      <div>
        <span style="color:#71717a;">[${timeStr}]</span>
        <strong style="color:#22d3ee; margin: 0 4px;">${bot.id}</strong>
        <span style="color:${isBuy ? '#10b981' : '#f43f5e'}; font-weight:700;">${side}</span>
        <span style="color:#fff; margin-left:4px;">${bot.assets.split(' ')[0]}</span>
      </div>
      <div style="color:#aaa;">
        ${note} &bull; <span style="color:#10b981;">SOR: ROUTED</span>
      </div>
    `;

    stream.prepend(row);
    if (stream.children.length > 25) {
      stream.removeChild(stream.lastChild);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 5. LIVE SIMULATION LOOP & REAL TICK SUBSCRIPTION
  // ══════════════════════════════════════════════════════════════════════════
  const startLiveFleetWorker = () => {
    // Random live trade fills every 3-5 seconds across running bots
    setInterval(() => {
      const runningBots = BOTS_REGISTRY.filter(b => b.status === 'RUNNING');
      if (!runningBots.length) return;

      const randomBot = runningBots[Math.floor(Math.random() * runningBots.length)];
      const pnlDelta = Math.round((Math.random() - 0.32) * 1250);
      randomBot.realizedPnlINR += pnlDelta;
      randomBot.tradesToday += 1;

      // Update card PnL in real-time
      const pnlEl = document.getElementById(`pnl-${randomBot.id}`);
      const tradesEl = document.getElementById(`trades-${randomBot.id}`);
      const totPnl = randomBot.realizedPnlINR + randomBot.unrealizedPnlINR;

      if (pnlEl) {
        pnlEl.textContent = `${totPnl >= 0 ? '+' : ''}₹${totPnl.toLocaleString('en-IN')}`;
        pnlEl.style.color = totPnl >= 0 ? '#10b981' : '#f43f5e';
      }
      if (tradesEl) {
        tradesEl.textContent = `${randomBot.tradesToday} Fills`;
      }

      updateGlobalTelemetry();

      const sides = ['BUY TRK', 'SELL TRK', 'SCALE FILL', 'DELTA HEDGE', 'ARB CYCLE'];
      const randomSide = sides[Math.floor(Math.random() * sides.length)];
      addBlotterLog(randomBot, randomSide, 100, `Fill @ Market | PnL: ${pnlDelta >= 0 ? '+' : ''}₹${pnlDelta} | Slippage: 1.2 bps`);
    }, 3200);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 6. MODAL DETAIL DRAWER
  // ══════════════════════════════════════════════════════════════════════════
  const openBotModal = (botId) => {
    const bot = BOTS_REGISTRY.find(b => b.id === botId);
    if (!bot) return;

    const overlay = document.getElementById('botModalOverlay');
    const nameEl = document.getElementById('modalBotName');
    const secEl = document.getElementById('modalBotSector');
    const bodyEl = document.getElementById('modalBotBody');

    if (nameEl) nameEl.textContent = `${bot.id}: ${bot.name}`;
    if (secEl) secEl.textContent = `${bot.market === 'india' ? '🇮🇳 Indian Market' : '🇺🇸 US/Global'} &bull; ${bot.sector}`;

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; margin-bottom:16px;">
          <h4 style="font-size:0.8rem; color:#22d3ee; margin:0 0 8px 0; text-transform:uppercase;">Strategy Description &amp; Edge</h4>
          <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin:0 0 12px 0;">${bot.desc}</p>
          <div style="background:#04060a; padding:10px; border-radius:6px; font-family:'JetBrains Mono', monospace; font-size:0.75rem; color:#10b981;">
            <strong>Mathematical SDE Formula:</strong><br>
            ${bot.mathFormula}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px;">
            <span style="font-size:0.7rem; color:#71717a; text-transform:uppercase; font-weight:700;">Allocated Capital</span>
            <div style="font-size:1.1rem; font-weight:800; color:#fff; font-family:'JetBrains Mono', monospace;">₹${bot.allocatedCapINR.toLocaleString('en-IN')}</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px;">
            <span style="font-size:0.7rem; color:#71717a; text-transform:uppercase; font-weight:700;">Net Realized Alpha</span>
            <div style="font-size:1.1rem; font-weight:800; color:#10b981; font-family:'JetBrains Mono', monospace;">+₹${(bot.realizedPnlINR + bot.unrealizedPnlINR).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="fleet-btn btn-danger" onclick="alert('Emergency kill switch triggered for ${bot.id}')"><i class="fa-solid fa-power-off"></i> Emergency Kill</button>
        </div>
      `;
    }

    if (overlay) {
      overlay.hidden = false;
      overlay.style.display = 'flex';
    }
  };

  const closeBotModal = () => {
    const overlay = document.getElementById('botModalOverlay');
    if (overlay) {
      overlay.hidden = true;
      overlay.style.display = 'none';
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 7. AGGREGATE EQUITY CHART
  // ══════════════════════════════════════════════════════════════════════════
  const initFleetEquityChart = () => {
    const canvas = document.getElementById('fleetEquityCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hours = ['09:15', '10:30', '11:45', '13:00', '14:15', '15:30', '17:00', '19:00', '21:00', '23:00', '01:00', '03:00', '05:00', '07:00'];
    let curVal = 10000000;
    const dataPoints = hours.map((_, i) => {
      curVal += Math.round((Math.random() - 0.28) * 45000);
      return curVal;
    });

    fleetEquityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Total Fleet Net Equity (₹)',
          data: dataPoints,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Equity: ₹${ctx.raw.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#71717a', font: { family: 'JetBrains Mono', size: 9 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#71717a',
              font: { family: 'JetBrains Mono', size: 9 },
              callback: (val) => `₹${(val / 100000).toFixed(1)}L`
            }
          }
        }
      }
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 8. DOM INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    renderBotGrid();
    updateGlobalTelemetry();
    initFleetEquityChart();
    startLiveFleetWorker();

    // Market Filter Pills
    document.querySelectorAll('.market-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.market-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderBotGrid();
      });
    });

    // Search input
    const searchInput = document.getElementById('botSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderBotGrid();
      });
    }

    // Global Header Buttons
    document.getElementById('btnStartAllBots')?.addEventListener('click', () => setAllBots('RUNNING'));
    document.getElementById('btnPauseAllBots')?.addEventListener('click', () => setAllBots('PAUSED'));
    document.getElementById('btnFleetKillSwitch')?.addEventListener('click', () => {
      if (confirm('EMERGENCY KILL SWITCH: Liquidate all active orders and halt all 20 bots?')) {
        setAllBots('PAUSED');
        alert('All 20 bots halted. Emergency circuit breaker logged.');
      }
    });

    // Modal Close
    document.getElementById('btnCloseBotModal')?.addEventListener('click', closeBotModal);
    document.getElementById('botModalOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'botModalOverlay') closeBotModal();
    });
  });

})();
