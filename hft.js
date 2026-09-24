/**
 * RISKOS — HIGH-FREQUENCY TRADING & MARKET MICROSTRUCTURE TERMINAL (hft.js)
 * Implements:
 * 1. LetterGlitch matrix background initialization with graceful fallback
 * 2. Universal Ticker Resolution (supports ALL tickers: NSE, NASDAQ, Crypto, Custom)
 * 3. Realistic L3 Depth of Market (DOM) Ladder with cumulative volume bars & order counts
 * 4. High-Precision Sub-Pixel Microstructure Waterfall Canvas & Iceberg Absorption Detector
 * 5. Closed-Form Avellaneda-Stoikov Dynamic Market Making Simulator & Inventory Skew PnL
 * 6. Stoikov Micro-Price & VPIN (Volume-Synchronized Probability of Toxicity) Radar
 * 7. Price-Time Priority (FIFO) Queue Simulator & RAW FIX 4.4 Protocol Stream
 */

(() => {
  'use strict';

  // ── Global State ────────────────────────────────────────────────────────────
  const state = {
    symbol: 'RELIANCE.NS',
    currency: 'INR',
    livePrice: 1287.50,
    bestBid: 1287.25,
    bestAsk: 1287.75,
    spread: 0.50,
    volatility: 0.185,
    tickSize: 0.25,
    soundEnabled: true,
    
    // High-frequency telemetry
    ticksPerSec: 142,
    volumePerSec: 12450,
    cumulativeVolumeDelta: +4850,
    
    // Avellaneda-Stoikov parameters
    asGamma: 0.1,    // Inventory risk aversion
    asKappa: 1.5,    // Order arrival intensity
    asVol: 0.185,    // Annualized asset volatility
    asInventory: 0,  // Net inventory q (contracts)
    asHorizon: 1.0,  // Trading day horizon
    asSpreadCapturePnL: 1420.50,
    asAdverseSelectionPnL: -380.00,
    asInventoryPenaltyPnL: -45.20,
    
    // Microstructure & Toxicity
    ofi: 0.24,
    vpin: 0.22,
    microPrice: 1287.58,
    nextTickUpProb: 62.4,
    
    // Queue position simulation
    userQueueOrder: null, // { id, price, side, initialQueue, currentQueue, status }
    
    // Realistic L3 Depth Data & Tape
    bidsDepth: [],
    asksDepth: [],
    tradeTape: [],
    bboHistory: [] // Array of { time, bid, ask, mid, trades }
  };

  // ── Web Audio Synthesizer ───────────────────────────────────────────────────
  const SoundFX = {
    ctx: null,
    init() {
      if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.08) {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    fillChime() { this.playTone(1320, 'triangle', 0.14, 0.12); },
    placeTone() { this.playTone(880, 'sine', 0.06, 0.08); },
    toxicAlarm() { this.playTone(480, 'sawtooth', 0.25, 0.15); }
  };

  // ── 1. LetterGlitch Matrix Background Integration ───────────────────────────
  let glitchInstance = null;
  const initLetterGlitchBackground = () => {
    try {
      const canvasEl = document.getElementById('letterGlitchCanvas');
      if (canvasEl && typeof LetterGlitch !== 'undefined') {
        glitchInstance = new LetterGlitch(canvasEl, {
          glitchColors: ['#064e3b', '#10b981', '#0e7490', '#22d3ee', '#1e293b'],
          glitchSpeed: 50,
          centerVignette: true,
          outerVignette: true,
          smooth: true,
          characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789',
          backgroundColor: '#020617'
        });
      }
    } catch (err) {
      console.warn('LetterGlitch background fallback active:', err);
    }
  };

  // ── 2. Universal All-Ticker Support & Market Data Truth ─────────────────────
  const bindLiveSecurity = async (rawSymbol) => {
    if (!rawSymbol) return;
    const sym = rawSymbol.trim().toUpperCase();
    state.symbol = sym;

    // Detect currency convention
    const isIndian = sym.endsWith('.NS') || sym.endsWith('.BO') || sym.startsWith('^NSE') || sym.startsWith('^BSE');
    state.currency = isIndian ? 'INR' : 'USD';

    let resolvedPrice = null;
    let resolvedVol = 0.185;

    // Attempt resolution through SecurityMaster
    if (typeof SecurityMaster !== 'undefined' && typeof SecurityMaster.resolveSecurity === 'function') {
      try {
        const sec = await SecurityMaster.resolveSecurity(sym);
        if (sec && (sec.basePrice || sec.price_inr)) {
          resolvedPrice = sec.basePrice || sec.price_inr;
          if (sec.vol) resolvedVol = sec.vol;
          if (sec.currency) state.currency = sec.currency;
        }
      } catch (e) {}
    }

    // Dynamic Priors Fallback for Any Ticker
    if (!resolvedPrice) {
      if (sym.includes('BTC')) resolvedPrice = 64250.00;
      else if (sym.includes('ETH')) resolvedPrice = 3450.00;
      else if (sym.includes('SOL')) resolvedPrice = 145.00;
      else if (sym === 'NVDA') resolvedPrice = 124.50;
      else if (sym === 'AAPL') resolvedPrice = 228.40;
      else if (sym === 'MSFT') resolvedPrice = 432.80;
      else if (sym === 'TSLA') resolvedPrice = 248.20;
      else if (sym === 'INFY' || sym === 'INFY.NS') resolvedPrice = 1942.50;
      else if (sym === 'TCS' || sym === 'TCS.NS') resolvedPrice = 4380.00;
      else if (sym.startsWith('^')) resolvedPrice = 24850.00;
      else resolvedPrice = isIndian ? 1450.00 : 185.00;
    }

    state.livePrice = resolvedPrice;
    state.volatility = resolvedVol;
    state.asVol = resolvedVol;

    // Tick size rules (institutional market microstructure)
    if (state.livePrice > 20000) state.tickSize = 5.00;
    else if (state.livePrice > 5000) state.tickSize = 1.00;
    else if (state.livePrice > 1000) state.tickSize = 0.50;
    else if (state.livePrice > 100) state.tickSize = 0.25;
    else state.tickSize = 0.05;

    state.bestBid = +(state.livePrice - state.tickSize).toFixed(2);
    state.bestAsk = +(state.livePrice + state.tickSize).toFixed(2);
    state.spread = +(state.bestAsk - state.bestBid).toFixed(2);

    // Update input display
    const inputEl = document.getElementById('hftTickerInput');
    if (inputEl && inputEl.value !== sym) inputEl.value = sym;

    // Refresh UI
    updateTelemetryBar();
    generateRealisticL3Depth();
    renderL3DOMLadder();
    resetBboHistory();
    updateMicrostructureMetrics();
    updateAvellanedaStoikovQuotes();
    if (typeof window !== 'undefined' && typeof window._updateBasisRadar === 'function') {
      window._updateBasisRadar();
    }
  };

  const updateTelemetryBar = () => {
    const currSym = state.currency === 'INR' ? '₹' : '$';
    const pill = document.getElementById('hftQuotePill');
    if (pill) {
      const chg = 0.45;
      pill.innerHTML = `
        <span class="hft-pulse-dot"></span>
        <span style="color:var(--hft-cyan); font-weight:800;">${state.symbol}</span>
        <span style="color:#fff; font-weight:700;">${currSym}${state.livePrice.toFixed(2)}</span>
        <span style="color:#10b981; font-size:0.75rem;">+${chg}%</span>
        <span style="color:#64748b; font-size:0.7rem; border-left:1px solid #334155; padding-left:8px;">Spread: ${currSym}${state.spread.toFixed(2)}</span>
      `;
    }

    state.ticksPerSec = Math.floor(110 + Math.random() * 65);
    state.volumePerSec = Math.floor(8000 + Math.random() * 12000);
    const tickEl = document.getElementById('statTicksPerSec');
    const volEl = document.getElementById('statVolPerSec');
    const cvdEl = document.getElementById('statCvd');
    if (tickEl) tickEl.textContent = `${state.ticksPerSec}/s`;
    if (volEl) volEl.textContent = state.volumePerSec.toLocaleString();
    if (cvdEl) {
      state.cumulativeVolumeDelta += Math.floor((Math.random() - 0.46) * 45);
      cvdEl.textContent = `${state.cumulativeVolumeDelta >= 0 ? '+' : ''}${state.cumulativeVolumeDelta.toLocaleString()} Shs`;
      cvdEl.style.color = state.cumulativeVolumeDelta >= 0 ? '#10b981' : '#ef4444';
    }
  };

  // ── 3. Realistic L3 Order Book DOM Ladder (Depth of Market) ──────────────────
  const generateRealisticL3Depth = () => {
    state.bidsDepth = [];
    state.asksDepth = [];
    const mid = state.livePrice;
    const tick = state.tickSize;
    const rungs = 7;

    let cumBid = 0;
    for (let i = 1; i <= rungs; i++) {
      const p = +(mid - (i * tick)).toFixed(2);
      const isWall = (i === 3 || i === 6);
      const qty = isWall ? Math.floor(3200 + Math.random() * 4500) : Math.floor(450 + Math.random() * 1200);
      cumBid += qty;
      const orderCount = Math.floor(qty / 75) + 1;
      state.bidsDepth.push({ price: p, qty, cumQty: cumBid, orders: orderCount });
    }

    let cumAsk = 0;
    for (let i = 1; i <= rungs; i++) {
      const p = +(mid + (i * tick)).toFixed(2);
      const isWall = (i === 2 || i === 5);
      const qty = isWall ? Math.floor(3100 + Math.random() * 4200) : Math.floor(420 + Math.random() * 1150);
      cumAsk += qty;
      const orderCount = Math.floor(qty / 75) + 1;
      state.asksDepth.push({ price: p, qty, cumQty: cumAsk, orders: orderCount });
    }
  };

  const renderL3DOMLadder = () => {
    const container = document.getElementById('hftDomLadder');
    if (!container) return;

    const currSym = state.currency === 'INR' ? '₹' : '$';
    const maxQty = Math.max(
      state.bidsDepth.length ? state.bidsDepth[state.bidsDepth.length - 1].cumQty : 10000,
      state.asksDepth.length ? state.asksDepth[state.asksDepth.length - 1].cumQty : 10000
    );

    // Asks in reverse order (highest ask at top)
    const reversedAsks = [...state.asksDepth].reverse();

    let html = `
      <div style="display:grid; grid-template-columns:65px 70px 1fr 70px 65px; font-weight:700; color:#64748b; font-size:0.68rem; padding:4px 6px; border-bottom:1px solid #1e293b; text-transform:uppercase;">
        <span>Bid Size</span>
        <span>Bid Ord</span>
        <span style="text-align:center;">Price (${currSym})</span>
        <span style="text-align:right;">Ask Ord</span>
        <span style="text-align:right;">Ask Size</span>
      </div>
    `;

    // Render Asks
    reversedAsks.forEach(a => {
      const isBest = a.price === state.bestAsk;
      const barPct = Math.min(100, Math.round((a.qty / maxQty) * 100));
      const hasUserOrder = state.userQueueOrder && state.userQueueOrder.side === 'SELL' && Math.abs(state.userQueueOrder.price - a.price) < 0.01;

      html += `
        <div class="hft-dom-row ${isBest ? 'is-bbo' : ''}" onclick="window.setQueuePrice(${a.price})" title="Click to queue limit order at ${a.price}">
          <div class="hft-dom-depth-bar-ask" style="width:${barPct}%;"></div>
          <div class="hft-dom-cell" style="color:#64748b;">--</div>
          <div class="hft-dom-cell" style="color:#64748b;">--</div>
          <div class="hft-dom-cell" style="text-align:center; font-weight:800; color:#ef4444;">
            ${currSym}${a.price.toFixed(2)} ${hasUserOrder ? '<span style="color:#fbbf24; font-size:0.62rem;">[MY ORDER]</span>' : ''}
          </div>
          <div class="hft-dom-cell" style="text-align:right; color:#94a3b8;">${a.orders}</div>
          <div class="hft-dom-cell" style="text-align:right; font-weight:700; color:#ef4444;">${a.qty.toLocaleString()}</div>
        </div>
      `;
    });

    // Spread Channel Marker
    html += `
      <div style="background:rgba(34,211,238,0.08); border-top:1px dashed rgba(34,211,238,0.3); border-bottom:1px dashed rgba(34,211,238,0.3); padding:4px 6px; font-size:0.68rem; text-align:center; color:var(--hft-cyan); font-weight:700;">
        INSIDE SPREAD: ${currSym}${state.spread.toFixed(2)} (${((state.spread / state.livePrice) * 10000).toFixed(1)} bps)
      </div>
    `;

    // Render Bids
    state.bidsDepth.forEach(b => {
      const isBest = b.price === state.bestBid;
      const barPct = Math.min(100, Math.round((b.qty / maxQty) * 100));
      const hasUserOrder = state.userQueueOrder && state.userQueueOrder.side === 'BUY' && Math.abs(state.userQueueOrder.price - b.price) < 0.01;

      html += `
        <div class="hft-dom-row ${isBest ? 'is-bbo' : ''}" onclick="window.setQueuePrice(${b.price})" title="Click to queue limit order at ${b.price}">
          <div class="hft-dom-depth-bar-bid" style="width:${barPct}%;"></div>
          <div class="hft-dom-cell" style="font-weight:700; color:#10b981;">${b.qty.toLocaleString()}</div>
          <div class="hft-dom-cell" style="color:#94a3b8;">${b.orders}</div>
          <div class="hft-dom-cell" style="text-align:center; font-weight:800; color:#10b981;">
            ${currSym}${b.price.toFixed(2)} ${hasUserOrder ? '<span style="color:#fbbf24; font-size:0.62rem;">[MY ORDER]</span>' : ''}
          </div>
          <div class="hft-dom-cell" style="text-align:right; color:#64748b;">--</div>
          <div class="hft-dom-cell" style="text-align:right; color:#64748b;">--</div>
        </div>
      `;
    });

    container.innerHTML = html;
  };

  // ── 4. Realistic Sub-Pixel Microstructure Waterfall Canvas ──────────────────
  let canvas, ctx, animationId;
  const resetBboHistory = () => {
    state.bboHistory = [];
    const now = Date.now();
    for (let i = 50; i >= 0; i--) {
      state.bboHistory.push({
        time: now - (i * 1000),
        bid: state.bestBid,
        ask: state.bestAsk,
        mid: state.livePrice,
        trades: []
      });
    }
  };

  const initHeatmapCanvas = () => {
    canvas = document.getElementById('bookmapCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    resetBboHistory();

    // Push live BBO data slice every 1000ms
    setInterval(() => {
      const isTrade = Math.random() < 0.45;
      const trades = [];
      if (isTrade) {
        const isBuy = Math.random() > 0.48;
        const qty = Math.floor(100 + Math.random() * 1200);
        const p = isBuy ? state.bestAsk : state.bestBid;
        trades.push({ price: p, qty, isBuy });

        // Trigger Iceberg Alert if volume spike
        if (qty > 900) {
          triggerIcebergAlert(p, qty);
        }
      }

      state.bboHistory.push({
        time: Date.now(),
        bid: state.bestBid,
        ask: state.bestAsk,
        mid: state.livePrice,
        trades
      });

      if (state.bboHistory.length > 50) state.bboHistory.shift();
    }, 1000);

    const renderLoop = () => {
      renderBookmapWaterfall();
      animationId = requestAnimationFrame(renderLoop);
    };
    animationId = requestAnimationFrame(renderLoop);
  };

  const triggerIcebergAlert = (price, qty) => {
    const alertEl = document.getElementById('icebergAlertBadge');
    if (alertEl) {
      const currSym = state.currency === 'INR' ? '₹' : '$';
      alertEl.textContent = `🚨 ICEBERG ABSORPTION: ${qty.toLocaleString()} Shs @ ${currSym}${price.toFixed(2)}`;
      alertEl.style.display = 'block';
      setTimeout(() => { alertEl.style.display = 'none'; }, 2400);
    }
  };

  const renderBookmapWaterfall = () => {
    if (!canvas || !ctx) return;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    if (state.bboHistory.length === 0) return;

    // Price scaling
    const mid = state.livePrice;
    const span = state.tickSize * 10;
    const minP = mid - span;
    const maxP = mid + span;

    const getY = (p) => h - ((p - minP) / (maxP - minP)) * h;

    // Draw Price Horizontal Gridlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let p = minP; p <= maxP; p += state.tickSize) {
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Right axis price labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(p.toFixed(2), w - 46, y - 2);
    }

    // Draw Resting Liquidity Shelf Horizons (Institutional Bookmap style)
    state.bidsDepth.forEach((b, idx) => {
      const y = getY(b.price);
      const alpha = Math.min(0.7, 0.15 + (b.qty / 8000));
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.fillRect(0, y - 2, w - 50, 4);
    });

    state.asksDepth.forEach((a, idx) => {
      const y = getY(a.price);
      const alpha = Math.min(0.7, 0.15 + (a.qty / 8000));
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(0, y - 2, w - 50, 4);
    });

    // Draw Continuous BBO Step Curves (Best Bid & Best Ask)
    const stepW = (w - 50) / 50;

    // Best Ask Line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    state.bboHistory.forEach((pt, idx) => {
      const x = idx * stepW;
      const y = getY(pt.ask);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Best Bid Line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    state.bboHistory.forEach((pt, idx) => {
      const x = idx * stepW;
      const y = getY(pt.bid);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dashed Mid Line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    state.bboHistory.forEach((pt, idx) => {
      const x = idx * stepW;
      const y = getY(pt.mid);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Executed Trade Bubbles along the step lines
    state.bboHistory.forEach((pt, idx) => {
      const x = idx * stepW;
      pt.trades.forEach(tr => {
        const y = getY(tr.price);
        const r = Math.min(12, Math.max(3, Math.sqrt(tr.qty) * 0.3));
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = tr.isBuy ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    // Time Ruler (e.g. -45s, -30s, -15s, NOW)
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('-45s', w * 0.25, h - 6);
    ctx.fillText('-30s', w * 0.50, h - 6);
    ctx.fillText('-15s', w * 0.75, h - 6);
    ctx.fillText('NOW', w - 42, h - 6);
  };

  // ── 5. Closed-Form Avellaneda-Stoikov Dynamic Market Making ─────────────────
  const updateAvellanedaStoikovQuotes = () => {
    const s = state.livePrice;
    const q = state.asInventory;
    const gamma = state.asGamma;
    const kappa = state.asKappa;
    const sigma = state.asVol;
    const T_minus_t = state.asHorizon;

    // Reservation Price: r(s, q, t) = s - q * gamma * sigma^2 * (T - t)
    const reservationPrice = s - (q * gamma * Math.pow(sigma, 2) * T_minus_t * 100);

    // Optimal Half-Spreads: delta^a + delta^b = (2 / gamma) * ln(1 + gamma / kappa)
    const halfSpreadTerm = (1 / gamma) * Math.log(1 + (gamma / kappa));
    const deltaAsk = Math.max(state.tickSize, ((reservationPrice - s) / 2) + halfSpreadTerm);
    const deltaBid = Math.max(state.tickSize, ((s - reservationPrice) / 2) + halfSpreadTerm);

    const optimalAsk = +(s + deltaAsk).toFixed(2);
    const optimalBid = +(s - deltaBid).toFixed(2);
    const totalSpread = +(optimalAsk - optimalBid).toFixed(2);

    const rEl = document.getElementById('asReservationPrice');
    const bEl = document.getElementById('asOptimalBid');
    const aEl = document.getElementById('asOptimalAsk');
    const spEl = document.getElementById('asOptimalSpread');
    const invEl = document.getElementById('asCurrentInventory');
    const invMeter = document.getElementById('asInventoryMeter');

    const currSym = state.currency === 'INR' ? '₹' : '$';
    if (rEl) rEl.textContent = `${currSym}${reservationPrice.toFixed(2)}`;
    if (bEl) bEl.textContent = `${currSym}${optimalBid.toFixed(2)}`;
    if (aEl) aEl.textContent = `${currSym}${optimalAsk.toFixed(2)}`;
    if (spEl) spEl.textContent = `${currSym}${totalSpread.toFixed(2)} (${((totalSpread / s) * 10000).toFixed(1)} bps)`;
    
    if (invEl) {
      invEl.textContent = `${q >= 0 ? '+' : ''}${q} Contracts`;
      invEl.style.color = q > 0 ? '#10b981' : (q < 0 ? '#ef4444' : '#fff');
    }

    if (invMeter) {
      const pct = Math.min(100, Math.max(0, ((q + 50) / 100) * 100));
      invMeter.style.width = `${pct}%`;
      invMeter.style.background = q > 0 ? '#10b981' : (q < 0 ? '#ef4444' : '#64748b');
    }

    const spreadCaptureEl = document.getElementById('asSpreadPnL');
    const adverseEl = document.getElementById('asAdversePnL');
    const penaltyEl = document.getElementById('asPenaltyPnL');
    const netEl = document.getElementById('asNetPnL');

    state.asInventoryPenaltyPnL = -(0.5 * gamma * Math.pow(q, 2) * Math.pow(sigma, 2) * 10);
    const netPnL = state.asSpreadCapturePnL + state.asAdverseSelectionPnL + state.asInventoryPenaltyPnL;

    if (spreadCaptureEl) spreadCaptureEl.textContent = `+${currSym}${state.asSpreadCapturePnL.toFixed(2)}`;
    if (adverseEl) adverseEl.textContent = `${currSym}${state.asAdverseSelectionPnL.toFixed(2)}`;
    if (penaltyEl) penaltyEl.textContent = `${currSym}${state.asInventoryPenaltyPnL.toFixed(2)}`;
    if (netEl) {
      netEl.textContent = `${netPnL >= 0 ? '+' : ''}${currSym}${netPnL.toFixed(2)}`;
      netEl.style.color = netPnL >= 0 ? '#10b981' : '#ef4444';
    }
  };

  // ── 6. Stoikov Micro-Price & VPIN Toxicity Radar ───────────────────────────
  const updateMicrostructureMetrics = () => {
    const qb = state.bidsDepth.length ? state.bidsDepth[0].qty : 1500;
    const qa = state.asksDepth.length ? state.asksDepth[0].qty : 1200;
    const s = state.spread;
    const mid = state.livePrice;

    // Stoikov Micro-Price: P_micro = P_mid + ((Q_b - Q_a) / (Q_b + Q_a)) * (Spread / 2)
    state.microPrice = +(mid + ((qb - qa) / (qb + qa)) * (s / 2)).toFixed(2);
    state.ofi = Number(((qb - qa) / (qb + qa)).toFixed(3));

    const z = state.ofi * 2.8;
    state.nextTickUpProb = Number(((1 / (1 + Math.exp(-z))) * 100).toFixed(1));
    state.vpin = Number((0.18 + Math.abs(state.ofi) * 0.45).toFixed(3));

    const microEl = document.getElementById('radarMicroPrice');
    const microDeltaEl = document.getElementById('radarMicroDelta');
    const ofiEl = document.getElementById('radarOfiVal');
    const probEl = document.getElementById('radarNextTickProb');
    const vpinValEl = document.getElementById('radarVpinVal');
    const vpinFillEl = document.getElementById('radarVpinFill');
    const vpinBadgeEl = document.getElementById('radarVpinBadge');

    const currSym = state.currency === 'INR' ? '₹' : '$';
    const delta = +(state.microPrice - mid).toFixed(2);

    if (microEl) microEl.textContent = `${currSym}${state.microPrice.toFixed(2)}`;
    if (microDeltaEl) {
      microDeltaEl.textContent = `${delta >= 0 ? '▲ +' : '▼ '}${currSym}${Math.abs(delta).toFixed(2)} vs Mid`;
      microDeltaEl.style.color = delta >= 0 ? '#10b981' : '#ef4444';
    }
    if (ofiEl) {
      ofiEl.textContent = `${state.ofi >= 0 ? '+' : ''}${state.ofi.toFixed(3)}`;
      ofiEl.style.color = state.ofi >= 0 ? '#10b981' : '#ef4444';
    }
    if (probEl) {
      probEl.textContent = `${state.nextTickUpProb}% UP`;
      probEl.style.color = state.nextTickUpProb >= 50 ? '#10b981' : '#ef4444';
    }
    if (vpinValEl) {
      const vpinPct = (state.vpin * 100).toFixed(1);
      vpinValEl.textContent = `${vpinPct}%`;
      if (vpinFillEl) vpinFillEl.style.width = `${vpinPct}%`;

      if (vpinBadgeEl) {
        if (state.vpin >= 0.50) {
          vpinBadgeEl.textContent = '🚨 TOXIC REGIME (INFORMED SWEEP)';
          vpinBadgeEl.style.background = 'rgba(239, 68, 68, 0.2)';
          vpinBadgeEl.style.color = '#ef4444';
          vpinBadgeEl.style.borderColor = '#ef4444';
          SoundFX.toxicAlarm();
        } else {
          vpinBadgeEl.textContent = 'NORMAL ORDER FLOW';
          vpinBadgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
          vpinBadgeEl.style.color = '#10b981';
          vpinBadgeEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        }
      }
    }
  };

  // ── 7. Queue Position & Raw FIX 4.4 Protocol Terminal ───────────────────────
  const initQueueSimulator = () => {
    const queueBtn = document.getElementById('btnSubmitQueueOrder');
    const raceBtn = document.getElementById('btnRaceColocBot');
    if (queueBtn) {
      queueBtn.addEventListener('click', () => {
        const side = document.getElementById('queueOrderSide')?.value || 'BUY';
        const qty = parseInt(document.getElementById('queueOrderQty')?.value || '100', 10);
        const price = parseFloat(document.getElementById('queueOrderPrice')?.value || state.bestBid);

        state.userQueueOrder = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          side,
          qty,
          price,
          initialQueue: Math.floor(35 + Math.random() * 65),
          currentQueue: Math.floor(35 + Math.random() * 65),
          status: 'QUEUED'
        };

        SoundFX.placeTone();
        updateQueueDisplay();
        renderL3DOMLadder();
        emitFixMessage('35=D', state.userQueueOrder);
      });
    }

    if (raceBtn) {
      raceBtn.addEventListener('click', () => {
        simulateLatencyRace();
      });
    }

    setInterval(() => {
      if (state.userQueueOrder && state.userQueueOrder.status === 'QUEUED') {
        const step = Math.floor(1 + Math.random() * 5);
        state.userQueueOrder.currentQueue = Math.max(0, state.userQueueOrder.currentQueue - step);

        if (state.userQueueOrder.currentQueue === 0) {
          state.userQueueOrder.status = 'FILLED';
          SoundFX.fillChime();
          emitFixMessage('35=8', state.userQueueOrder);
          
          if (typeof PaperBroker !== 'undefined' && typeof PaperBroker.executeOrder === 'function') {
            PaperBroker.executeOrder({
              symbol: state.symbol,
              side: state.userQueueOrder.side,
              qty: state.userQueueOrder.qty,
              price: state.userQueueOrder.price
            });
          }
        }
        updateQueueDisplay();
        renderL3DOMLadder();
      }
    }, 850);
  };

  const updateQueueDisplay = () => {
    const statusEl = document.getElementById('queueOrderStatus');
    const posEl = document.getElementById('queueOrderPosition');
    const estEl = document.getElementById('queueEstFill');

    if (!state.userQueueOrder) return;

    if (statusEl) {
      statusEl.textContent = state.userQueueOrder.status;
      statusEl.style.color = state.userQueueOrder.status === 'FILLED' ? '#10b981' : '#f59e0b';
    }

    if (posEl) {
      if (state.userQueueOrder.status === 'FILLED') {
        posEl.textContent = 'ORDER FILLED (Queue Cleared)';
      } else {
        posEl.textContent = `#${state.userQueueOrder.currentQueue} in line (started at #${state.userQueueOrder.initialQueue})`;
      }
    }

    if (estEl) {
      if (state.userQueueOrder.status === 'FILLED') {
        estEl.textContent = 'Executed @ Full Priority';
      } else {
        const estSec = (state.userQueueOrder.currentQueue * 0.45).toFixed(1);
        estEl.textContent = `~${estSec}s to Top of Book`;
      }
    }
  };

  const simulateLatencyRace = () => {
    const raceResEl = document.getElementById('latencyRaceResult');
    if (!raceResEl) return;

    const retailLatency = (35 + Math.random() * 25).toFixed(1);
    const colocLatency = (12 + Math.random() * 5).toFixed(1);

    raceResEl.innerHTML = `
      <div style="font-weight:700; color:#ef4444; margin-bottom:4px;">❌ OUT-RACE BY COLOCATION HFT BOT</div>
      <div>Retail Web Transit: <span style="color:#ef4444; font-weight:700;">${retailLatency} ms</span></div>
      <div>BKC / Aurora Direct Fiber: <span style="color:#10b981; font-weight:700;">${colocLatency} μs</span></div>
      <div style="color:#94a3b8; font-size:0.7rem; margin-top:4px;">HFT Bot matched remaining depth 2,400× faster. Slower order filled at 1-tick adverse slippage.</div>
    `;
    raceResEl.style.display = 'block';
  };

  let fixSeqNum = 1001;
  const emitFixMessage = (msgType, order) => {
    const terminal = document.getElementById('fixMessageTerminal');
    if (!terminal) return;

    const now = new Date();
    const utcTime = now.toISOString().replace('T', '-').replace('Z', '');
    const tag35Desc = msgType === '35=D' ? 'NewOrderSingle' : (msgType === '35=8' ? 'ExecutionReport' : 'OrderCancel');

    let body = `8=FIX.4.4|9=142|${msgType}|34=${fixSeqNum++}|49=RISKOS_PRO|56=NSE_COLOC|52=${utcTime}|`;
    if (msgType === '35=D') {
      body += `11=${order.id}|21=1|55=${state.symbol}|54=${order.side === 'BUY' ? '1' : '2'}|38=${order.qty}|40=2|44=${order.price.toFixed(2)}|59=0|`;
    } else if (msgType === '35=8') {
      body += `37=EX-${Date.now().toString().slice(-6)}|11=${order.id}|17=EXEC-${fixSeqNum}|39=2|150=2|55=${state.symbol}|54=${order.side === 'BUY' ? '1' : '2'}|38=${order.qty}|32=${order.qty}|31=${order.price.toFixed(2)}|151=0|14=${order.qty}|6=${order.price.toFixed(2)}|`;
    }

    let sum = 0;
    for (let i = 0; i < body.length; i++) sum += body.charCodeAt(i);
    const checksum = (sum % 256).toString().padStart(3, '0');
    const fullFix = `${body}10=${checksum}`;

    const line = document.createElement('div');
    line.className = 'fix-line';
    const tagClass = msgType === '35=D' ? 'fix-tag-35-d' : (msgType === '35=8' ? 'fix-tag-35-8' : 'fix-tag-35-g');
    
    line.innerHTML = `<span style="color:#64748b;">[${now.toLocaleTimeString()}]</span> <span class="${tagClass}">[${tag35Desc}]</span> ${fullFix.replace(/\|/g, '<span class="fix-tag-delim">|</span>')}`;

    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  };

  // ── 8. UI Controls & Event Listeners ────────────────────────────────────────
  const setupEventListeners = () => {
    // Universal Ticker Search Input & Load Button
    const tickerInput = document.getElementById('hftTickerInput');
    const btnLoadTicker = document.getElementById('btnLoadTicker');

    const handleTickerSubmit = () => {
      if (tickerInput && tickerInput.value) {
        bindLiveSecurity(tickerInput.value);
      }
    };

    if (btnLoadTicker) btnLoadTicker.addEventListener('click', handleTickerSubmit);
    if (tickerInput) {
      tickerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleTickerSubmit();
      });
      tickerInput.addEventListener('change', handleTickerSubmit);
    }

    // Sound toggle
    const soundBtn = document.getElementById('btnToggleSound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        soundBtn.innerHTML = state.soundEnabled ? '<i class="fa-solid fa-volume-high"></i> Audio: ON' : '<i class="fa-solid fa-volume-xmark"></i> Audio: MUTED';
        soundBtn.classList.toggle('btn-emerald', state.soundEnabled);
      });
    }

    // Sliders
    const gammaSlider = document.getElementById('sliderAsGamma');
    const kappaSlider = document.getElementById('sliderAsKappa');
    const invSlider = document.getElementById('sliderAsInventory');

    if (gammaSlider) {
      gammaSlider.addEventListener('input', (e) => {
        state.asGamma = parseFloat(e.target.value);
        document.getElementById('valAsGamma').textContent = state.asGamma.toFixed(2);
        updateAvellanedaStoikovQuotes();
      });
    }

    if (kappaSlider) {
      kappaSlider.addEventListener('input', (e) => {
        state.asKappa = parseFloat(e.target.value);
        document.getElementById('valAsKappa').textContent = state.asKappa.toFixed(1);
        updateAvellanedaStoikovQuotes();
      });
    }

    if (invSlider) {
      invSlider.addEventListener('input', (e) => {
        state.asInventory = parseInt(e.target.value, 10);
        document.getElementById('valAsInventory').textContent = `${state.asInventory >= 0 ? '+' : ''}${state.asInventory}`;
        updateAvellanedaStoikovQuotes();
      });
    }

    // 1-Click Deploy AS Quoting Bot Button
    const deployBtn = document.getElementById('btnDeployAsBot');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => {
        if (typeof PaperBroker !== 'undefined' && typeof PaperBroker.executeOrder === 'function') {
          const res = PaperBroker.executeOrder({
            symbol: state.symbol,
            side: 'BUY',
            qty: 25,
            price: state.livePrice
          });
          if (res.success) {
            state.asInventory += 25;
            state.asSpreadCapturePnL += 25 * (state.spread / 2);
            updateAvellanedaStoikovQuotes();
            SoundFX.fillChime();
            alert(`✅ AS Quoting Bot Deployed: 25 shares of ${state.symbol} filled in virtual ₹10 Lakh sandbox!`);
          }
        }
      });
    }

    // 1-Click DOM Order Execution Buttons (BUY MKT & SELL MKT)
    const btnBuyMkt = document.getElementById('btnDomBuyMkt');
    const btnSellMkt = document.getElementById('btnDomSellMkt');
    const qtySelect = document.getElementById('hftDomOrderQty');

    if (btnBuyMkt) {
      btnBuyMkt.addEventListener('click', () => {
        const qty = qtySelect ? (parseInt(qtySelect.value, 10) || 100) : 100;
        executeDomOrder('BUY', qty);
      });
    }

    if (btnSellMkt) {
      btnSellMkt.addEventListener('click', () => {
        const qty = qtySelect ? (parseInt(qtySelect.value, 10) || 100) : 100;
        executeDomOrder('SELL', qty);
      });
    }

    // Workstation 5: Tape Filter Buttons
    const filterBtns = document.querySelectorAll('.hft-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tapeFilter = btn.getAttribute('data-filter') || 'all';
        renderTapeTable();
      });
    });

    // Workstation 6: Latency Route & Distance Controls
    const routeSelect = document.getElementById('selectLatencyRoute');
    const distSlider = document.getElementById('sliderDistanceKm');
    const btnRace = document.getElementById('btnRunLatencyRace');

    if (routeSelect) {
      routeSelect.addEventListener('change', () => {
        const v = routeSelect.value;
        if (v === 'mumbai') latencyDistanceKm = 1.2;
        else if (v === 'chicago_ny') latencyDistanceKm = 1180;
        else if (v === 'london_frankfurt') latencyDistanceKm = 640;
        if (distSlider && v !== 'custom') distSlider.value = latencyDistanceKm;
        updateLatencyCalculations();
      });
    }

    if (distSlider) {
      distSlider.addEventListener('input', (e) => {
        latencyDistanceKm = parseFloat(e.target.value);
        if (routeSelect) routeSelect.value = 'custom';
        updateLatencyCalculations();
      });
    }

    if (btnRace) {
      btnRace.addEventListener('click', runLatencyRaceSimulation);
    }

    // Workstation 7: Algorithmic Execution Slicer
    const btnSlicer = document.getElementById('btnStartSlicer');
    if (btnSlicer) {
      btnSlicer.addEventListener('click', startAlgoSlicer);
    }
  };

  // ── 10. Real-Time Time & Sales Tape & CVD Absorption Engine ────────────────
  state.tapeFilter = 'all';
  state.tapePrints = [];

  const formatMicrosecondTimestamp = (d = new Date()) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    const us = String(Math.floor(100 + Math.random() * 899));
    return `${hh}:${mm}:${ss}.${ms}${us}`;
  };

  const prependTapeRow = (trade) => {
    state.tapePrints.unshift(trade);
    if (state.tapePrints.length > 80) state.tapePrints.pop();
    renderTapeTable();
    updateCvdDisplay();
  };

  const renderTapeTable = () => {
    const tbody = document.getElementById('hftTapeTableBody');
    if (!tbody) return;

    let filtered = state.tapePrints;
    if (state.tapeFilter === 'large') {
      filtered = state.tapePrints.filter(t => t.size >= 250);
    } else if (state.tapeFilter === 'block') {
      filtered = state.tapePrints.filter(t => t.size >= 1000);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--hft-text-muted); padding:16px;">Streaming live market execution prints...</td></tr>`;
      return;
    }

    const currSym = state.currency === 'INR' ? '₹' : '$';
    let html = '';
    filtered.slice(0, 30).forEach(t => {
      const isBuy = t.side === 'BUY';
      const isBlock = t.size >= 1000;
      html += `
        <tr class="tape-row-new">
          <td style="color:#94a3b8; font-size:0.68rem;">${t.microTime || formatMicrosecondTimestamp()}</td>
          <td style="font-weight:700; color:var(--hft-cyan);">${t.symbol}</td>
          <td>
            <span style="color:${isBuy ? '#10b981' : '#ef4444'}; font-weight:800;">${t.side}</span>
          </td>
          <td style="font-weight:700; color:#fff;">${currSym}${Number(t.price).toFixed(2)}</td>
          <td style="font-weight:700; color:${isBuy ? '#10b981' : '#ef4444'};">${t.size.toLocaleString()}</td>
          <td style="color:#94a3b8; font-size:0.68rem;">${t.venue || 'NSE Co-Lo'}</td>
          <td>
            ${isBlock ? '<span style="background:rgba(245,158,11,0.2); color:#f59e0b; padding:1px 5px; border-radius:3px; font-size:0.62rem; font-weight:700;">BLOCK</span>' : '<span style="color:#64748b; font-size:0.65rem;">REGULAR</span>'}
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  };

  const updateCvdDisplay = () => {
    const cvdValEl = document.getElementById('cvdMetricVal');
    const buyPctEl = document.getElementById('cvdAggrBuyPct');
    const stateEl = document.getElementById('cvdAbsorptionState');
    const statCvdHeader = document.getElementById('statCvd');

    if (cvdValEl) {
      cvdValEl.textContent = `${state.cumulativeVolumeDelta >= 0 ? '+' : ''}${state.cumulativeVolumeDelta.toLocaleString()} Shs`;
      cvdValEl.style.color = state.cumulativeVolumeDelta >= 0 ? '#10b981' : '#ef4444';
    }
    if (statCvdHeader) {
      statCvdHeader.textContent = `${state.cumulativeVolumeDelta >= 0 ? '+' : ''}${state.cumulativeVolumeDelta.toLocaleString()} Shs`;
      statCvdHeader.style.color = state.cumulativeVolumeDelta >= 0 ? '#10b981' : '#ef4444';
    }

    let buyVol = 0;
    let totalVol = 0;
    state.tapePrints.forEach(t => {
      totalVol += t.size;
      if (t.side === 'BUY') buyVol += t.size;
    });

    const buyPct = totalVol > 0 ? ((buyVol / totalVol) * 100) : 58.4;
    if (buyPctEl) {
      buyPctEl.textContent = `${buyPct.toFixed(1)}%`;
      buyPctEl.style.color = buyPct >= 50 ? '#10b981' : '#ef4444';
    }

    if (stateEl) {
      if (state.cumulativeVolumeDelta > 1500) {
        stateEl.textContent = 'PASSIVE SELL ABSORPTION (DISTRIBUTION)';
        stateEl.style.color = '#f59e0b';
      } else if (state.cumulativeVolumeDelta < -1500) {
        stateEl.textContent = 'PASSIVE BUY ABSORPTION (ACCUMULATION)';
        stateEl.style.color = '#10b981';
      } else {
        stateEl.textContent = 'BALANCED TWO-WAY LIQUIDITY FLOW';
        stateEl.style.color = '#22d3ee';
      }
    }
  };

  // ── 11. Microsecond Latency Arbitrage & Co-Location Engine ─────────────────
  let latencyDistanceKm = 1180;

  const updateLatencyCalculations = () => {
    const d = latencyDistanceKm;
    const distVal = document.getElementById('valDistanceKm');
    if (distVal) distVal.textContent = d.toLocaleString();

    // Propagation speed:
    // Microwave: v = 299,700 km/s, FPGA tick-to-trade = 0.0009 ms (900 ns)
    const microRtt = Number((( (2 * d) / 299700 ) * 1000 + 0.0009).toFixed(3));
    // Fiber: v = 204,200 km/s (silica refractive index ~1.468), switch overhead = 0.0024 ms (2.4 µs)
    const fiberRtt = Number((( (2 * d) / 204200 ) * 1000 + 0.0024).toFixed(3));
    // Retail Internet: Fiber base + 35.0ms TCP/ISP overhead
    const retailRtt = Number((fiberRtt + 35.0 + Math.random() * 1.5).toFixed(2));

    const microEl = document.getElementById('statMicrowaveRtt');
    const fiberEl = document.getElementById('statFiberRtt');
    const retailEl = document.getElementById('statRetailRtt');

    if (microEl) microEl.textContent = `${microRtt < 1 ? (microRtt * 1000).toFixed(0) + ' µs' : microRtt.toFixed(2) + ' ms'}`;
    if (fiberEl) fiberEl.textContent = `${fiberRtt < 1 ? (fiberRtt * 1000).toFixed(0) + ' µs' : fiberRtt.toFixed(2) + ' ms'}`;
    if (retailEl) retailEl.textContent = `${retailRtt.toFixed(2)} ms`;

    const meterMicro = document.getElementById('meterMicrowave');
    const meterFiber = document.getElementById('meterFiber');
    const meterRetail = document.getElementById('meterRetail');

    if (meterMicro) meterMicro.style.width = '100%';
    if (meterFiber) meterFiber.style.width = `${Math.round((microRtt / fiberRtt) * 100)}%`;
    if (meterRetail) meterRetail.style.width = `${Math.max(4, Math.round((microRtt / retailRtt) * 100))}%`;

    return { microRtt, fiberRtt, retailRtt };
  };

  const runLatencyRaceSimulation = () => {
    const { microRtt, fiberRtt, retailRtt } = updateLatencyCalculations();
    const logEl = document.getElementById('latencyRaceDetailedLog') || document.getElementById('latencyRaceResult');
    if (!logEl) return;

    logEl.style.display = 'block';
    const currSym = state.currency === 'INR' ? '₹' : '$';
    const arbSpread = state.currency === 'INR' ? 2.50 : 0.15;
    const shares = 500;
    const profit = (arbSpread * shares).toFixed(2);
    const deltaMicros = Math.round((fiberRtt - microRtt) * 1000);
    const deltaRetailMs = (retailRtt - microRtt).toFixed(2);

    logEl.innerHTML = `
      <div style="color:var(--hft-cyan); font-weight:700; margin-bottom:6px; border-bottom:1px solid rgba(168,85,247,0.3); padding-bottom:4px;">
        ⚡ CROSS-VENUE SPEED-OF-LIGHT RACE LOG (Distance: ${latencyDistanceKm.toLocaleString()} km)
      </div>
      <div><span style="color:#64748b;">[T+0.000ms]</span> Primary Shock: Quote disparity detected (${currSym}${arbSpread.toFixed(2)} edge) across venues.</div>
      <div><span style="color:#10b981;">[T+${microRtt.toFixed(2)}ms]</span> <strong style="color:#10b981;">WINNER: MICROWAVE / LASER</strong> packet arrives first. SNIPED ${shares} shares @ stale quote! <strong>Net Arb Profit: +${currSym}${profit}</strong></div>
      <div><span style="color:#22d3ee;">[T+${fiberRtt.toFixed(2)}ms]</span> DIRECT FIBER packet arrives (${deltaMicros} µs late). <strong>REJECTED</strong>: Stale quotes already consumed.</div>
      <div><span style="color:#ef4444;">[T+${retailRtt.toFixed(2)}ms]</span> RETAIL WEBSOCKET arrives (${deltaRetailMs} ms late). <strong>FATAL</strong>: 0% fill probability. Public queue already shifted.</div>
    `;

    SoundFX.fillChime();
  };

  // ── 12. Algorithmic Order Slicing Workbench (TWAP / VWAP / POV) ────────────
  let slicerActiveTimer = null;
  const slicerState = {
    parentQty: 10000,
    algoType: 'TWAP',
    durationSec: 30,
    filledQty: 0,
    arrivalPrice: 0,
    totalNotional: 0,
    slices: []
  };

  const startAlgoSlicer = () => {
    if (slicerActiveTimer) {
      clearInterval(slicerActiveTimer);
      slicerActiveTimer = null;
    }

    const qtyInput = document.getElementById('slicerParentQty');
    const algoInput = document.getElementById('slicerAlgoType');
    const durInput = document.getElementById('slicerDurationSec');

    slicerState.parentQty = qtyInput ? (parseInt(qtyInput.value, 10) || 10000) : 10000;
    slicerState.algoType = algoInput ? algoInput.value : 'TWAP';
    slicerState.durationSec = durInput ? (parseInt(durInput.value, 10) || 30) : 30;

    slicerState.filledQty = 0;
    slicerState.totalNotional = 0;
    slicerState.arrivalPrice = state.livePrice;
    slicerState.slices = [];

    const arrivalEl = document.getElementById('slicerArrivalPrice');
    const totalEl = document.getElementById('slicerTotalQty');
    const filledEl = document.getElementById('slicerFilledQty');
    const avgEl = document.getElementById('slicerAvgFill');
    const shortfallEl = document.getElementById('slicerShortfallBps');
    const progressEl = document.getElementById('slicerProgressBar');
    const tableBody = document.getElementById('slicerTableBody');

    const currSym = state.currency === 'INR' ? '₹' : '$';
    if (arrivalEl) arrivalEl.textContent = `${currSym}${slicerState.arrivalPrice.toFixed(2)}`;
    if (totalEl) totalEl.textContent = slicerState.parentQty.toLocaleString();
    if (filledEl) filledEl.textContent = '0';
    if (avgEl) avgEl.textContent = '--';
    if (shortfallEl) shortfallEl.textContent = '0.0 bps';
    if (progressEl) progressEl.style.width = '0%';
    if (tableBody) tableBody.innerHTML = '';

    const totalSlices = 10;
    const intervalMs = Math.max(400, Math.floor((slicerState.durationSec * 1000) / totalSlices));
    let currentSliceIdx = 0;

    // Slicing weights
    const vwapWeights = [0.18, 0.12, 0.08, 0.06, 0.05, 0.05, 0.07, 0.11, 0.13, 0.15];

    slicerActiveTimer = setInterval(() => {
      if (currentSliceIdx >= totalSlices) {
        clearInterval(slicerActiveTimer);
        slicerActiveTimer = null;
        SoundFX.fillChime();
        return;
      }

      let sliceQty = 0;
      if (slicerState.algoType === 'TWAP') {
        sliceQty = Math.round(slicerState.parentQty / totalSlices);
      } else if (slicerState.algoType === 'VWAP') {
        sliceQty = Math.round(slicerState.parentQty * (vwapWeights[currentSliceIdx] || 0.1));
      } else { // POV (Participation of Volume)
        sliceQty = Math.round((slicerState.parentQty / totalSlices) * (0.8 + Math.random() * 0.4));
      }

      // Ensure total doesn't exceed parent order on last slice
      if (currentSliceIdx === totalSlices - 1) {
        sliceQty = Math.max(10, slicerState.parentQty - slicerState.filledQty);
      }

      // Almgren-Chriss Slippage Impact Model: slippage ~ eta * (v / V)^alpha
      const participationRate = sliceQty / slicerState.parentQty;
      const slippageBps = Number((0.5 + (participationRate * 8.0) + (Math.random() * 0.8)).toFixed(1));
      const fillPrice = Number((slicerState.arrivalPrice * (1 + (slippageBps / 10000))).toFixed(2));

      slicerState.filledQty += sliceQty;
      slicerState.totalNotional += (sliceQty * fillPrice);
      const avgFill = Number((slicerState.totalNotional / slicerState.filledQty).toFixed(2));
      const shortfallBps = Number((((avgFill - slicerState.arrivalPrice) / slicerState.arrivalPrice) * 10000).toFixed(1));

      const sliceRecord = {
        slice: currentSliceIdx + 1,
        time: formatMicrosecondTimestamp(),
        algo: slicerState.algoType,
        qty: sliceQty,
        fillPrice,
        slippageBps
      };
      slicerState.slices.push(sliceRecord);

      // Update UI Telemetry
      if (filledEl) filledEl.textContent = slicerState.filledQty.toLocaleString();
      if (avgEl) avgEl.textContent = `${currSym}${avgFill.toFixed(2)}`;
      if (shortfallEl) {
        shortfallEl.textContent = `+${shortfallBps} bps`;
        shortfallEl.style.color = shortfallBps > 5 ? '#ef4444' : '#f59e0b';
      }
      if (progressEl) {
        const pct = Math.min(100, Math.round((slicerState.filledQty / slicerState.parentQty) * 100));
        progressEl.style.width = `${pct}%`;
      }

      // Append row to table
      if (tableBody) {
        const tr = document.createElement('tr');
        tr.className = 'tape-row-new';
        tr.innerHTML = `
          <td style="font-weight:700; color:var(--hft-cyan);">#${sliceRecord.slice}</td>
          <td style="color:#94a3b8; font-size:0.68rem;">${sliceRecord.time}</td>
          <td><span style="color:#fbbf24; font-weight:700;">${sliceRecord.algo}</span></td>
          <td style="font-weight:700; color:#fff;">${sliceRecord.qty.toLocaleString()}</td>
          <td style="font-weight:700; color:#10b981;">${currSym}${sliceRecord.fillPrice.toFixed(2)}</td>
          <td style="color:#f59e0b;">+${sliceRecord.slippageBps} bps</td>
          <td><span style="color:#10b981; font-weight:700;">FILLED</span></td>
        `;
        tableBody.appendChild(tr);
        if (tableBody.parentElement) {
          tableBody.parentElement.scrollTop = tableBody.parentElement.scrollHeight;
        }
      }

      // Also log in RAW FIX 4.4 stream terminal
      logFixMessage('35=8', 'ExecutionReport', `8=FIX.4.4|9=162|35=8|34=${Math.floor(1000+Math.random()*9000)}|49=NSE_SOR|56=RISKOS_ALGO|37=ORD-ALGO-${currentSliceIdx+1}|48=${state.symbol}|54=1|38=${sliceQty}|44=${fillPrice.toFixed(2)}|39=1|150=1|10=072`);

      if (state.soundEnabled) SoundFX.fillChime();

      currentSliceIdx++;
    }, intervalMs);
  };

  // ── 13. DOM 1-Click Order Execution Engine ──────────────────────────────────
  const executeDomOrder = (side, qty) => {
    if (!qty || qty <= 0) return;
    const price = state.livePrice;

    // Execute through PaperBroker if present
    if (typeof PaperBroker !== 'undefined' && typeof PaperBroker.executeOrder === 'function') {
      try {
        PaperBroker.executeOrder({
          symbol: state.symbol,
          side: side,
          qty: qty,
          price: price,
          type: 'MARKET'
        });
      } catch (e) {}
    }

    // Update Avellaneda-Stoikov Inventory
    state.asInventory += (side === 'BUY' ? qty : -qty);
    const invValEl = document.getElementById('valAsInventory');
    const invSlider = document.getElementById('sliderAsInventory');
    if (invValEl) invValEl.textContent = `${state.asInventory >= 0 ? '+' : ''}${state.asInventory}`;
    if (invSlider) invSlider.value = state.asInventory;
    updateAvellanedaStoikovQuotes();

    // Log FIX packet
    logFixMessage('35=8', 'ExecutionReport', `8=FIX.4.4|9=148|35=8|34=${Math.floor(1000+Math.random()*9000)}|49=NSE_MATCH|56=RISKOS_DOM|37=DOM-${Date.now()}|48=${state.symbol}|54=${side==='BUY'?1:2}|38=${qty}|44=${price.toFixed(2)}|39=2|150=2|10=088`);

    // Log on Time & Sales Tape
    prependTapeRow({
      id: `DOM-${Date.now()}`,
      symbol: state.symbol,
      side: side,
      price: price,
      size: qty,
      venue: 'NSE Co-Lo (1-Click DOM)',
      condition: 'USER DIRECT',
      microTime: formatMicrosecondTimestamp(),
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    });

    // Feed Hawkes Process & Footprint
    if (typeof window !== 'undefined') {
      if (window.HawkesProcessEngine && typeof window.HawkesProcessEngine.registerTrade === 'function') {
        window.HawkesProcessEngine.registerTrade(qty, true);
      }
      if (window.OrderFlowFootprint && typeof window.OrderFlowFootprint.registerTrade === 'function') {
        window.OrderFlowFootprint.registerTrade(price, qty, side);
        if (typeof window._redrawFootprint === 'function') window._redrawFootprint();
      }
    }

    if (state.soundEnabled) SoundFX.fillChime();
  };

  // ── 14. Real-Time MarketDataTruth & Live Tick Pipeline ──────────────────────
  const initMarketDataTruthFeed = () => {
    if (typeof SecurityMaster !== 'undefined') {
      if (typeof SecurityMaster.subscribeLiveTicks === 'function') {
        SecurityMaster.subscribeLiveTicks((updates) => {
          if (!Array.isArray(updates)) return;
          const currentBase = state.symbol.replace(/\.NS|\.BO|\.US/i, '');
          const matched = updates.find(u => {
            const uSym = (u.symbol || '').toUpperCase();
            return uSym === state.symbol || uSym === currentBase;
          });
          if (matched && matched.price) {
            state.livePrice = matched.price;
            state.bestBid = +(state.livePrice - state.tickSize).toFixed(2);
            state.bestAsk = +(state.livePrice + state.tickSize).toFixed(2);
            state.spread = +(state.bestAsk - state.bestBid).toFixed(2);
            updateTelemetryBar();
            generateRealisticL3Depth();
            renderL3DOMLadder();
            updateMicrostructureMetrics();
            updateAvellanedaStoikovQuotes();
            if (typeof window !== 'undefined' && typeof window._updateBasisRadar === 'function') {
              window._updateBasisRadar();
            }
          }
        });
      }

      if (typeof SecurityMaster.subscribeLiveTape === 'function') {
        SecurityMaster.subscribeLiveTape((trade) => {
          if (!trade) return;
          if (trade.side === 'BUY') {
            state.cumulativeVolumeDelta += (trade.size || 100);
          } else {
            state.cumulativeVolumeDelta -= (trade.size || 100);
          }
          prependTapeRow({
            id: trade.id || `TX-${Date.now()}`,
            symbol: trade.symbol || state.symbol,
            side: trade.side || 'BUY',
            price: trade.price || state.livePrice,
            size: trade.size || 100,
            venue: trade.venue || 'NSE Co-Lo',
            condition: trade.condition || 'REGULAR',
            microTime: formatMicrosecondTimestamp(),
            time: trade.time || new Date().toLocaleTimeString(),
            timestamp: Date.now()
          });

          // Feed Hawkes Point Process & Order Flow Footprint
          if (typeof window !== 'undefined') {
            if (window.HawkesProcessEngine && typeof window.HawkesProcessEngine.registerTrade === 'function') {
              window.HawkesProcessEngine.registerTrade(trade.size || 100, false);
            }
            if (window.OrderFlowFootprint && typeof window.OrderFlowFootprint.registerTrade === 'function') {
              window.OrderFlowFootprint.registerTrade(trade.price || state.livePrice, trade.size || 100, trade.side || 'BUY');
              if (typeof window._redrawFootprint === 'function') window._redrawFootprint();
            }
          }
        });
      }
    }
  };

  // ── 15. WebAssembly (WASM) & C++ L3 Matching Engine Controller ────────────
  const initWasmMatchingModule = async () => {
    const wasmCore = (typeof window !== 'undefined') ? window.MatchingEngineWasm : null;
    if (!wasmCore) return;

    try {
      await wasmCore.ready();
    } catch (e) {
      console.warn('[HFT] WASM core ready warning:', e.message);
    }

    const liveStatusEl = document.getElementById('wasmLiveStatus');
    const throughputEl = document.getElementById('wasmThroughputVal');
    const avgLatencyEl = document.getElementById('wasmAvgLatencyVal');
    const p99LatencyEl = document.getElementById('wasmP99LatencyVal');

    if (liveStatusEl) {
      liveStatusEl.innerHTML = wasmCore.isWasmActive
        ? '<i class="fa-solid fa-bolt"></i> WASM ACTIVE (204 bytes)'
        : '<i class="fa-solid fa-code"></i> JS CORE ACTIVE';
    }

    const renderWasmBook = () => {
      const depth = wasmCore.getDepth(8);
      const bidsTbody = document.getElementById('wasmBidsTableBody');
      const asksTbody = document.getElementById('wasmAsksTableBody');
      const bestBidEl = document.getElementById('wasmBestBidDisplay');
      const bestAskEl = document.getElementById('wasmBestAskDisplay');

      if (bestBidEl) bestBidEl.textContent = `Best Bid: ${depth.bestBid ? depth.bestBid.toFixed(2) : '--'}`;
      if (bestAskEl) bestAskEl.textContent = `Best Ask: ${depth.bestAsk ? depth.bestAsk.toFixed(2) : '--'}`;

      if (bidsTbody) {
        if (depth.bids.length === 0) {
          bidsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--hft-text-muted);">No resting bids</td></tr>';
        } else {
          bidsTbody.innerHTML = depth.bids.map(b => `
            <tr>
              <td style="color:#10b981; font-weight:700;">${b.price.toFixed(2)}</td>
              <td>${b.qty.toLocaleString()}</td>
              <td style="color:var(--hft-text-muted);">${b.orderCount}</td>
            </tr>
          `).join('');
        }
      }

      if (asksTbody) {
        if (depth.asks.length === 0) {
          asksTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--hft-text-muted);">No resting asks</td></tr>';
        } else {
          asksTbody.innerHTML = depth.asks.map(a => `
            <tr>
              <td style="color:#ef4444; font-weight:700;">${a.price.toFixed(2)}</td>
              <td>${a.qty.toLocaleString()}</td>
              <td style="color:var(--hft-text-muted);">${a.orderCount}</td>
            </tr>
          `).join('');
        }
      }
    };

    const appendWasmTrade = (trade) => {
      const feed = document.getElementById('wasmTradesFeed');
      if (!feed) return;
      const isBuy = trade.takerSide === 'BUY';
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      row.style.padding = '2px 0';
      row.innerHTML = `
        <span style="color:${isBuy ? '#10b981' : '#ef4444'}; font-weight:700;">
          ${trade.takerSide} #${trade.tradeId}
        </span>
        <span>${trade.qty.toLocaleString()} Shs @ ${trade.price.toFixed(2)}</span>
        <span style="color:var(--hft-text-muted); font-size:0.65rem;">
          Maker: #${trade.makerOrderId} &rarr; Taker: #${trade.takerOrderId}
        </span>
      `;
      feed.prepend(row);
      while (feed.children.length > 25) {
        feed.removeChild(feed.lastChild);
      }
    };

    // Benchmark Launcher
    const btnBenchmark = document.getElementById('btnRunWasmBenchmark');
    if (btnBenchmark) {
      btnBenchmark.addEventListener('click', () => {
        const count = parseInt(document.getElementById('wasmBenchCount')?.value || '10000', 10);
        btnBenchmark.disabled = true;
        btnBenchmark.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Benchmarking...';

        setTimeout(() => {
          const res = wasmCore.runBenchmark(count);
          if (throughputEl) throughputEl.textContent = `${res.ordersPerSec.toLocaleString()}/s`;
          if (avgLatencyEl) avgLatencyEl.textContent = `${(res.avgLatencyNs / 1000).toFixed(2)} µs`;
          if (p99LatencyEl) p99LatencyEl.textContent = `${res.p99LatencyUs.toFixed(2)} µs`;
          renderWasmBook();
          btnBenchmark.disabled = false;
          btnBenchmark.innerHTML = '<i class="fa-solid fa-play"></i> Run C++/WASM Benchmark';
          SoundFX.executionChime();
        }, 50);
      });
    }

    // Burst 50 Orders
    const btnBurst = document.getElementById('btnInjectBurst');
    if (btnBurst) {
      btnBurst.addEventListener('click', () => {
        const base = state.livePrice || 2800;
        for (let i = 0; i < 50; i++) {
          const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
          const offset = Math.floor(Math.random() * 8) * 0.25;
          const price = side === 'BUY' ? +(base - 0.25 - offset).toFixed(2) : +(base + 0.25 + offset).toFixed(2);
          const qty = Math.floor(20 + Math.random() * 80);
          wasmCore.insertLimit(side, price, qty);
        }
        renderWasmBook();
        SoundFX.tickPop();
      });
    }

    // Reset Engine
    const btnReset = document.getElementById('btnResetWasmEngine');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        wasmCore.reset();
        renderWasmBook();
        const feed = document.getElementById('wasmTradesFeed');
        if (feed) feed.innerHTML = '<span style="color:var(--hft-text-muted);">Engine memory cleared.</span>';
      });
    }

    // Interactive Order Form
    const btnSubmit = document.getElementById('btnSubmitWasmOrder');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const side = document.getElementById('wasmOrderSide')?.value || 'BUY';
        const type = document.getElementById('wasmOrderType')?.value || 'LIMIT';
        const price = parseFloat(document.getElementById('wasmOrderPrice')?.value || (state.livePrice || 2800));
        const qty = parseInt(document.getElementById('wasmOrderQty')?.value || '100', 10);

        if (type === 'LIMIT') {
          const res = wasmCore.insertLimit(side, price, qty);
          if (res && res.fills) {
            res.fills.forEach(f => appendWasmTrade(f));
          }
        } else {
          const res = wasmCore.executeMarket(side, qty);
          if (res && res.fills) {
            res.fills.forEach(f => appendWasmTrade(f));
          }
        }

        renderWasmBook();
        SoundFX.executionChime();
      });
    }

    // Initial Seed: 20 resting orders around current price
    const baseP = state.livePrice || 2800;
    for (let i = 1; i <= 10; i++) {
      wasmCore.insertLimit('BUY', +(baseP - i * 0.25).toFixed(2), 50 + i * 10);
      wasmCore.insertLimit('SELL', +(baseP + i * 0.25).toFixed(2), 50 + i * 10);
    }
    renderWasmBook();
  };

  // ── 16. Cross-Exchange Basis & Perpetual Funding Arbitrage Controller ──────
  const initBasisArbitrageModule = () => {
    const basisEngine = (typeof window !== 'undefined') ? window.BasisArbitrageEngine : null;
    if (!basisEngine) return;

    const updateBasisDisplay = () => {
      const spot = state.livePrice || 2800;
      const sym = state.symbol || state.currentSecurity || 'RELIANCE.NS';

      // 1. Scan Multi-Venue Arbitrage Matrix
      const multi = basisEngine.scanMultiVenueArbitrage(sym, spot);
      const tbody = document.getElementById('basisVenuesTableBody');
      if (tbody && multi.venues) {
        tbody.innerHTML = multi.venues.map(v => {
          const spreadDiff = v.price - spot;
          const spreadBps = ((spreadDiff / spot) * 10000).toFixed(1);
          const isHighest = v.name === multi.highestVenue.name;
          const isLowest = v.name === multi.lowestVenue.name;
          const roleBadge = isHighest
            ? '<span style="color:#ef4444; font-weight:700;">SELL LEG (High)</span>'
            : (isLowest ? '<span style="color:#10b981; font-weight:700;">BUY LEG (Low)</span>' : '<span style="color:var(--hft-text-muted);">Reference</span>');

          return `
            <tr>
              <td style="font-weight:700; color:#fff;">${v.name}</td>
              <td style="color:var(--hft-text-muted);">${v.type}</td>
              <td style="font-family:var(--hft-font-mono); color:${spreadDiff >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">
                ${state.currency === 'INR' ? '₹' : '$'}${v.price.toFixed(2)}
              </td>
              <td>${v.feeTakerBps.toFixed(1)}</td>
              <td style="font-family:var(--hft-font-mono); color:${spreadDiff >= 0 ? '#10b981' : '#ef4444'};">
                ${spreadDiff >= 0 ? '+' : ''}${spreadBps} bps
              </td>
              <td>${roleBadge}</td>
            </tr>
          `;
        }).join('');
      }

      // 2. Basis & Funding Metrics
      const isCrypto = sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL');
      const futuresPrice = isCrypto ? (spot * 1.0125) : (spot * 1.0045);
      const basisYield = basisEngine.calculateBasisYield(spot, futuresPrice, 30);
      const fundingYield = basisEngine.calculateFundingYield(isCrypto ? 0.00015 : 0.00008);

      const basisAprEl = document.getElementById('basisAnnualizedApr');
      const basisRegimeEl = document.getElementById('basisRegimeBadge');
      const basis8hEl = document.getElementById('basis8hFundingRate');
      const basisCompApyEl = document.getElementById('basisCompoundedApy');
      const netSpreadEl = document.getElementById('basisNetSpreadBps');
      const arbStatusPillEl = document.getElementById('basisArbStatusPill');

      if (basisAprEl) basisAprEl.textContent = `+${basisYield.annualizedApr.toFixed(2)}%`;
      if (basisRegimeEl) basisRegimeEl.textContent = `${basisYield.regime} (${basisYield.strategy})`;
      if (basis8hEl) basis8hEl.textContent = `+${fundingYield.rate8hPct.toFixed(4)}%`;
      if (basisCompApyEl) basisCompApyEl.textContent = `Compounded APY: +${fundingYield.compoundedApy.toFixed(2)}%`;
      if (netSpreadEl) netSpreadEl.textContent = `+${multi.netSpreadBps.toFixed(1)} bps`;
      if (arbStatusPillEl) {
        arbStatusPillEl.textContent = multi.status;
        arbStatusPillEl.style.color = multi.isProfitable ? '#10b981' : '#f59e0b';
      }

      // 3. Update Position Simulator Values
      updateSimulatorPayoff();
    };

    const updateSimulatorPayoff = () => {
      const capital = parseFloat(document.getElementById('simCapitalInput')?.value || '100000');
      const leverage = parseFloat(document.getElementById('simLeverageInput')?.value || '2');
      const dte = parseFloat(document.getElementById('simDteInput')?.value || '30');

      const spot = state.livePrice || 2800;
      const isCrypto = (state.symbol || '').includes('BTC') || (state.symbol || '').includes('ETH');
      const futuresPrice = isCrypto ? (spot * 1.0125) : (spot * 1.0045);
      const rate8h = isCrypto ? 0.00015 : 0.00008;

      const sim = basisEngine.simulateDeltaNeutralPosition(capital, spot, futuresPrice, dte, rate8h, leverage);
      const curr = state.currency === 'INR' ? '₹' : '$';

      const capLabel = document.getElementById('simCapitalLabel');
      const levLabel = document.getElementById('simLeverageLabel');
      const dteLabel = document.getElementById('simDteLabel');

      if (capLabel) capLabel.textContent = `${curr}${capital.toLocaleString()}`;
      if (levLabel) levLabel.textContent = `${leverage}x Leverage`;
      if (dteLabel) dteLabel.textContent = `${dte} Days`;

      const spotLegEl = document.getElementById('simSpotLegVal');
      const futMarginEl = document.getElementById('simFuturesMarginVal');
      const liqPriceEl = document.getElementById('simLiqPriceVal');
      const liqDistEl = document.getElementById('simLiqDistVal');
      const pnlEl = document.getElementById('simProjectedPnlVal');
      const netAprEl = document.getElementById('simNetAprVal');

      if (spotLegEl) spotLegEl.textContent = `${curr}${sim.spotCapital.toLocaleString()}`;
      if (futMarginEl) futMarginEl.textContent = `${curr}${sim.futuresMargin.toLocaleString()}`;
      if (liqPriceEl) liqPriceEl.textContent = `${curr}${sim.liquidationPrice.toLocaleString()}`;
      if (liqDistEl) {
        liqDistEl.textContent = `+${sim.distanceToLiquidationPct.toFixed(1)}% Safety Buffer`;
        liqDistEl.style.color = sim.isSafe ? '#10b981' : '#ef4444';
      }
      if (pnlEl) pnlEl.textContent = `+${curr}${sim.totalProjectedPnl.toLocaleString()}`;
      if (netAprEl) netAprEl.textContent = `${sim.annualizedReturnApr.toFixed(2)}% APR`;
    };

    // Sliders
    ['simCapitalInput', 'simLeverageInput', 'simDteInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateSimulatorPayoff);
    });

    // Execute Button
    const btnExecute = document.getElementById('btnExecuteBasisSim');
    if (btnExecute) {
      btnExecute.addEventListener('click', () => {
        const capital = parseFloat(document.getElementById('simCapitalInput')?.value || '100000');
        const leverage = parseFloat(document.getElementById('simLeverageInput')?.value || '2');
        const spot = state.livePrice || 2800;
        const curr = state.currency === 'INR' ? '₹' : '$';

        const alertEl = document.getElementById('simExecutionAlert');
        if (alertEl) {
          alertEl.innerHTML = `
            <strong>EXECUTED DELTA-NEUTRAL ARBITRAGE:</strong> Long Spot (${curr}${capital.toLocaleString()}) &bull; Short Futures (${leverage}x Hedge). FIX Tags: 35=D (NewOrderSingle) &rarr; 35=8 (ExecutionReport FILLED).
          `;
          alertEl.style.color = '#38bdf8';
          alertEl.style.borderColor = 'rgba(56,189,248,0.4)';
        }

        // Emit FIX Log
        appendFixMessage('D', 'D_NEW_ORDER', `11=BASIS-${Date.now().toString().slice(-4)}|54=1(BUY_SPOT)|38=${Math.round(capital/spot)}|44=${spot.toFixed(2)}`);
        appendFixMessage('8', '8_EXEC_REPORT', `37=EX-${Date.now().toString().slice(-4)}|39=2(FILLED)|150=2|31=${spot.toFixed(2)}|14=${Math.round(capital/spot)}`);
        SoundFX.executionChime();
      });
    }

    // Expose for updates on tick
    if (typeof window !== 'undefined') {
      window._updateBasisRadar = updateBasisDisplay;
    }
    updateBasisDisplay();
  };

  // ── 18. Hawkes Self-Exciting Point Process Controller ──────────────────────
  const initHawkesModule = () => {
    const hawkesEngine = (typeof window !== 'undefined') ? window.HawkesProcessEngine : null;
    if (!hawkesEngine) return;

    const branchingValEl = document.getElementById('hawkesBranchingVal');
    const regimeBadgeEl = document.getElementById('hawkesRegimeBadge');
    const intensityValEl = document.getElementById('hawkesIntensityVal');
    const endoRatioValEl = document.getElementById('hawkesEndoRatioVal');
    const baselineValEl = document.getElementById('hawkesBaselineVal');
    const statusTextEl = document.getElementById('hawkesStatusText');
    const canvas = document.getElementById('hawkesCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const alphaSlider = document.getElementById('hawkesAlphaSlider');
    const betaSlider = document.getElementById('hawkesBetaSlider');
    const muSlider = document.getElementById('hawkesMuSlider');
    const alphaLabel = document.getElementById('hawkesAlphaLabel');
    const betaLabel = document.getElementById('hawkesBetaLabel');
    const muLabel = document.getElementById('hawkesMuLabel');

    const updateControlsFromSliders = () => {
      const alpha = parseFloat(alphaSlider?.value || '4.8');
      const beta = parseFloat(betaSlider?.value || '6.0');
      const mu = parseFloat(muSlider?.value || '1.2');
      if (alphaLabel) alphaLabel.textContent = alpha.toFixed(2);
      if (betaLabel) betaLabel.textContent = beta.toFixed(2);
      if (muLabel) muLabel.textContent = mu.toFixed(2);
      hawkesEngine.setParameters(mu, alpha, beta);
    };

    [alphaSlider, betaSlider, muSlider].forEach(s => {
      if (s) s.addEventListener('input', updateControlsFromSliders);
    });

    // Cascade Shock Button
    const btnShock = document.getElementById('btnTriggerHawkesShock');
    if (btnShock) {
      btnShock.addEventListener('click', () => {
        btnShock.disabled = true;
        btnShock.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Triggering Cascade...';
        hawkesEngine.simulateShock(60);
        if (state.soundEnabled) SoundFX.executionChime();
        setTimeout(() => {
          btnShock.disabled = false;
          btnShock.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Trigger Cascade Shock (100 Orders)';
        }, 1500);
      });
    }

    // Reset Button
    const btnReset = document.getElementById('btnResetHawkes');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        hawkesEngine.reset();
        if (alphaSlider) alphaSlider.value = '4.8';
        if (betaSlider) betaSlider.value = '6.0';
        if (muSlider) muSlider.value = '1.2';
        updateControlsFromSliders();
      });
    }

    // Render Canvas & Telemetry Loop
    const renderHawkes = () => {
      const metrics = hawkesEngine.getMetrics();
      if (branchingValEl) branchingValEl.textContent = metrics.branchingRatio.toFixed(3);
      if (intensityValEl) intensityValEl.textContent = `${metrics.currentIntensity.toFixed(2)}/s`;
      if (endoRatioValEl) endoRatioValEl.textContent = `${metrics.endogenousRatioPct}%`;
      if (baselineValEl) baselineValEl.textContent = `${metrics.baselineRate.toFixed(2)}/s`;

      if (regimeBadgeEl) {
        regimeBadgeEl.textContent = metrics.regime;
        regimeBadgeEl.style.color = metrics.regimeColor;
        regimeBadgeEl.style.borderColor = metrics.regimeColor;
        regimeBadgeEl.style.background = metrics.regimeLevel === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : (metrics.regimeLevel === 'WARNING' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)');
      }

      if (statusTextEl) {
        statusTextEl.innerHTML = `<span style="color:${metrics.regimeColor}; font-weight:700;">${metrics.regimeLevel}:</span> ${metrics.regimeDescription}`;
      }

      // Draw canvas
      if (ctx && canvas) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Dark background
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const y = h * (i / 4);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        const hist = metrics.history;
        if (hist && hist.length > 1) {
          let maxInt = Math.max(30, ...hist.map(p => p.intensity));
          const stepX = w / Math.max(1, hist.length - 1);

          // Draw gradient area
          ctx.beginPath();
          ctx.moveTo(0, h);
          hist.forEach((p, idx) => {
            const x = idx * stepX;
            const y = h - (p.intensity / maxInt) * (h - 20);
            if (idx === 0) ctx.lineTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.lineTo(w, h);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, metrics.regimeLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : (metrics.regimeLevel === 'WARNING' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.3)'));
          grad.addColorStop(1, 'rgba(3, 7, 18, 0.05)');
          ctx.fillStyle = grad;
          ctx.fill();

          // Draw intensity line
          ctx.beginPath();
          hist.forEach((p, idx) => {
            const x = idx * stepX;
            const y = h - (p.intensity / maxInt) * (h - 20);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = metrics.regimeColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Threshold warning line (n = 1.0 boundary)
          const threshY = h - (hawkesEngine.beta / maxInt) * (h - 20);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, threshY);
          ctx.lineTo(w, threshY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'right';
          ctx.fillText('CRITICAL CASCADE THRESHOLD (n=1.0)', w - 10, threshY - 4);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Awaiting order flow prints for intensity accumulation...', w / 2, h / 2);
        }
      }

      requestAnimationFrame(renderHawkes);
    };

    renderHawkes();
  };

  // ── 19. Institutional Order Flow Footprint Controller ───────────────────────
  const initFootprintModule = () => {
    const fpEngine = (typeof window !== 'undefined') ? window.OrderFlowFootprint : null;
    if (!fpEngine) return;

    const canvas = document.getElementById('footprintCanvas');
    const pocValEl = document.getElementById('fpPocVal');
    const vaValEl = document.getElementById('fpVaVal');
    const deltaValEl = document.getElementById('fpDeltaVal');

    const updateFootprintDisplay = () => {
      if (!canvas) return;
      fpEngine.renderCanvas(canvas);

      const candles = fpEngine.getCandles();
      if (candles && candles.length > 0) {
        const latest = candles[candles.length - 1];
        if (pocValEl) pocValEl.textContent = `${state.currency === 'INR' ? '₹' : '$'}${latest.pocPrice.toFixed(2)}`;
        if (vaValEl) vaValEl.textContent = `${latest.valueAreaLow.toFixed(2)} - ${latest.valueAreaHigh.toFixed(2)}`;
        if (deltaValEl) {
          deltaValEl.textContent = `${latest.totalDelta >= 0 ? '+' : ''}${latest.totalDelta.toLocaleString()}`;
          deltaValEl.style.color = latest.totalDelta >= 0 ? '#10b981' : '#ef4444';
        }
      }
    };

    // Duration buttons (1m, 3m, 5m)
    document.querySelectorAll('.hft-fp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hft-fp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dur = parseInt(btn.dataset.duration || '60000', 10);
        fpEngine.setDuration(dur);
        updateFootprintDisplay();
      });
    });

    // Seed 5 historical candles
    const btnSeed = document.getElementById('btnSeedFootprint');
    if (btnSeed) {
      btnSeed.addEventListener('click', () => {
        const base = state.livePrice || 2800;
        fpEngine.seedHistory(base, 5);
        updateFootprintDisplay();
        if (state.soundEnabled) SoundFX.tickPop();
      });
    }

    // Seed initial history
    const baseP = state.livePrice || 2800;
    fpEngine.seedHistory(baseP, 5);
    updateFootprintDisplay();

    // Re-render when window resizes
    window.addEventListener('resize', () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || 900;
        updateFootprintDisplay();
      }
    });

    // Expose redraw function
    window._redrawFootprint = updateFootprintDisplay;
  };

  // ── 20. KaTeX Ambient Typesetting ───────────────────────────────────────────
  const renderFormulasKaTeX = () => {
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    }
  };

  // Global helper for ladder price click
  window.setQueuePrice = (p) => {
    const priceInput = document.getElementById('queueOrderPrice');
    if (priceInput) priceInput.value = p.toFixed(2);
    const sideInput = document.getElementById('queueOrderSide');
    if (sideInput) sideInput.value = p <= state.livePrice ? 'BUY' : 'SELL';
  };

  // Global Exports for Verification & External APIs
  window.HFTTerminal = {
    getState: () => ({ ...state }),
    bindSecurity: bindLiveSecurity,
    setInventory: (q) => { state.asInventory = q; updateAvellanedaStoikovQuotes(); },
    calculateAS: (s, q, gamma, kappa, sigma, T) => {
      const resPrice = s - (q * gamma * Math.pow(sigma, 2) * T * 100);
      const halfSpread = (1 / gamma) * Math.log(1 + (gamma / kappa));
      return { resPrice, halfSpread, bid: resPrice - halfSpread, ask: resPrice + halfSpread };
    },
    calculateMicroPrice: (mid, qb, qa, spread) => {
      return +(mid + ((qb - qa) / (qb + qa)) * (spread / 2)).toFixed(2);
    },
    calculateVPIN: (buckets) => {
      let imb = 0, vol = 0;
      buckets.forEach(b => { imb += Math.abs(b.buy - b.sell); vol += (b.buy + b.sell); });
      return vol > 0 ? Number((imb / vol).toFixed(3)) : 0;
    },
    getTapePrints: () => [...state.tapePrints],
    getCVD: () => state.cumulativeVolumeDelta,
    calculateLatency: (distanceKm) => {
      if (distanceKm !== undefined) latencyDistanceKm = distanceKm;
      return updateLatencyCalculations();
    },
    executeSlicer: (qty, algo, duration) => {
      slicerState.parentQty = qty || 10000;
      slicerState.algoType = algo || 'TWAP';
      slicerState.durationSec = duration || 15;
      startAlgoSlicer();
    },
    executeDomOrder: executeDomOrder,
    getWasmEngine: () => (typeof window !== 'undefined' ? window.MatchingEngineWasm : null),
    runWasmBenchmark: (count) => (typeof window !== 'undefined' && window.MatchingEngineWasm ? window.MatchingEngineWasm.runBenchmark(count) : null),
    getBasisEngine: () => (typeof window !== 'undefined' ? window.BasisArbitrageEngine : null),
    calculateBasis: (spot, fut, dte) => (typeof window !== 'undefined' && window.BasisArbitrageEngine ? window.BasisArbitrageEngine.calculateBasisYield(spot, fut, dte) : null),
    calculateFunding: (r8h) => (typeof window !== 'undefined' && window.BasisArbitrageEngine ? window.BasisArbitrageEngine.calculateFundingYield(r8h) : null),
    simulateDeltaNeutral: (cap, s, f, d, r, lev) => (typeof window !== 'undefined' && window.BasisArbitrageEngine ? window.BasisArbitrageEngine.simulateDeltaNeutralPosition(cap, s, f, d, r, lev) : null),
    getHawkesEngine: () => (typeof window !== 'undefined' ? window.HawkesProcessEngine : null),
    getFootprintEngine: () => (typeof window !== 'undefined' ? window.OrderFlowFootprint : null),
    triggerHawkesShock: (orderCount) => (typeof window !== 'undefined' && window.HawkesProcessEngine ? window.HawkesProcessEngine.simulateShock(orderCount) : null),
    renderFootprint: (canvasId) => (typeof window !== 'undefined' && window.OrderFlowFootprint ? window.OrderFlowFootprint.renderToCanvas(canvasId) : null)
  };

  // Initialize
  const init = async () => {
    initLetterGlitchBackground();

    const urlParams = (typeof window !== 'undefined' && window.location && window.location.search) ? new URLSearchParams(window.location.search) : null;
    const initialSym = urlParams ? (urlParams.get('symbol') || urlParams.get('sec') || urlParams.get('ticker') || 'RELIANCE.NS') : 'RELIANCE.NS';

    await bindLiveSecurity(initialSym);
    initHeatmapCanvas();
    setupEventListeners();
    initQueueSimulator();
    updateLatencyCalculations();
    renderTapeTable();
    updateCvdDisplay();
    initMarketDataTruthFeed();
    await initWasmMatchingModule();
    initBasisArbitrageModule();
    initHawkesModule();
    initFootprintModule();
    renderFormulasKaTeX();

    // Check focus deep-link
    if (urlParams && urlParams.get('focus')) {
      const f = urlParams.get('focus');
      const targetId = f === 'as' ? 'ws-stoikov' : (f === 'tape' ? 'ws-tape' : (f === 'latency' ? 'ws-latency' : (f === 'slicer' ? 'ws-slicer' : (f === 'wasm' ? 'ws-wasm' : (f === 'basis' ? 'ws-basis' : (f === 'hawkes' ? 'ws-hawkes' : (f === 'footprint' ? 'ws-footprint' : null)))))));
      if (targetId) {
        const targetEl = document.getElementById(targetId);
        if (targetEl) setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
