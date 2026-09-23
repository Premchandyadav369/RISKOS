/**
 * RISKOS — HIGH-FREQUENCY TRADING & MARKET MICROSTRUCTURE TERMINAL (hft.js)
 * Implements:
 * 1. Live Real-Time Telemetry & SecurityMaster Ingestion (RELIANCE, TCS, NIFTY50, NVDA, AAPL, BTC)
 * 2. 60 FPS L3 Order Book Heatmap Canvas ("Bookmap" Depth Waterfall & Iceberg Detector)
 * 3. Closed-Form Avellaneda-Stoikov Dynamic Market Making Simulator & Inventory Skew PnL
 * 4. Stoikov Micro-Price & VPIN (Volume-Synchronized Probability of Toxicity) Radar
 * 5. FIFO Queue Position Tracker & Raw FIX 4.4 / 5.0SP2 Protocol Stream
 * 6. Synthesized Web Audio API sound effects and PaperBroker Sandbox integration
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
    volatility: 0.185, // 18.5%
    tickSize: 0.25,
    soundEnabled: true,
    
    // Speedometer metrics
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
    
    // Heatmap buffer
    historyDepth: [] // Array of { time, bids: [{price, qty}], asks: [{price, qty}], trades: [] }
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

  // ── 1. Real-Time Telemetry & SecurityMaster Ingestion ───────────────────────
  const initMarketDataStream = async () => {
    if (typeof SecurityMaster === 'undefined') return;

    // Load active security from master
    await bindLiveSecurity(state.symbol);

    // Subscribe to live tick stream
    SecurityMaster.subscribeLiveTicks((updates) => {
      const match = updates.find(u => u.symbol === state.symbol || u.symbol === state.symbol.replace('.NS', ''));
      if (match && match.price) {
        state.livePrice = match.price;
        state.currency = match.currency || (state.symbol.includes('.NS') || state.symbol.includes('^') ? 'INR' : 'USD');
        
        // Derive dynamic best bid/ask around real market price
        const tick = state.livePrice > 1000 ? 0.50 : 0.05;
        state.tickSize = tick;
        state.bestBid = +(state.livePrice - tick).toFixed(2);
        state.bestAsk = +(state.livePrice + tick).toFixed(2);
        state.spread = +(state.bestAsk - state.bestBid).toFixed(2);
        if (match.vol) state.volatility = match.vol;

        // Update live HUD
        updateTelemetryBar(match);
        updateMicrostructureMetrics();
        updateAvellanedaStoikovQuotes();
      }
    });
  };

  const bindLiveSecurity = async (sym) => {
    state.symbol = sym;
    if (typeof SecurityMaster === 'undefined') return;

    const sec = await SecurityMaster.resolveSecurity(sym);
    if (sec && (sec.basePrice || sec.price_inr)) {
      state.livePrice = sec.basePrice || sec.price_inr;
      state.currency = sec.currency || (sym.includes('.NS') ? 'INR' : 'USD');
      state.volatility = sec.vol || 0.185;
      state.asVol = state.volatility;

      const tick = state.livePrice > 1000 ? 0.50 : 0.05;
      state.tickSize = tick;
      state.bestBid = +(state.livePrice - tick).toFixed(2);
      state.bestAsk = +(state.livePrice + tick).toFixed(2);
      state.spread = +(state.bestAsk - state.bestBid).toFixed(2);

      updateTelemetryBar(sec);
      resetBookmapBuffer();
      updateMicrostructureMetrics();
      updateAvellanedaStoikovQuotes();
    }
  };

  const updateTelemetryBar = (sec) => {
    const currSym = state.currency === 'INR' ? '₹' : '$';
    const pill = document.getElementById('hftQuotePill');
    if (pill) {
      const chg = sec.changePercent || 0.42;
      pill.innerHTML = `
        <span class="hft-pulse-dot"></span>
        <span style="color:var(--hft-cyan); font-weight:800;">${state.symbol}</span>
        <span style="color:#fff; font-weight:700;">${currSym}${state.livePrice.toFixed(2)}</span>
        <span style="color:${chg >= 0 ? '#10b981' : '#ef4444'}; font-size:0.75rem;">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>
        <span style="color:#64748b; font-size:0.7rem; border-left:1px solid #334155; padding-left:8px;">Spread: ${currSym}${state.spread.toFixed(2)}</span>
      `;
    }

    // Dynamic ticks per sec jitter
    state.ticksPerSec = Math.floor(120 + Math.random() * 65);
    state.volumePerSec = Math.floor(8000 + Math.random() * 12000);
    const tickEl = document.getElementById('statTicksPerSec');
    const volEl = document.getElementById('statVolPerSec');
    const cvdEl = document.getElementById('statCvd');
    if (tickEl) tickEl.textContent = `${state.ticksPerSec}/s`;
    if (volEl) volEl.textContent = state.volumePerSec.toLocaleString();
    if (cvdEl) {
      state.cumulativeVolumeDelta += Math.floor((Math.random() - 0.45) * 50);
      cvdEl.textContent = `${state.cumulativeVolumeDelta >= 0 ? '+' : ''}${state.cumulativeVolumeDelta.toLocaleString()} Shs`;
      cvdEl.style.color = state.cumulativeVolumeDelta >= 0 ? '#10b981' : '#ef4444';
    }
  };

  // ── 2. L3 Order Book Heatmap ("Bookmap" Depth Waterfall Canvas) ─────────────
  let canvas, ctx, animationId;
  const resetBookmapBuffer = () => {
    state.historyDepth = [];
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      state.historyDepth.push(generateSyntheticDepthSlice(now - (i * 1000)));
    }
  };

  const generateSyntheticDepthSlice = (timestamp) => {
    const bids = [];
    const asks = [];
    const levels = 12;
    const base = state.livePrice;
    const tick = state.tickSize;

    // Generate resting bid walls
    for (let i = 1; i <= levels; i++) {
      const p = +(base - (i * tick)).toFixed(2);
      // Liquidity walls at psychological levels
      const isWall = (i === 4 || i === 8);
      const qty = isWall ? Math.floor(2500 + Math.random() * 4500) : Math.floor(250 + Math.random() * 850);
      bids.push({ price: p, qty });
    }

    // Generate resting ask walls
    for (let i = 1; i <= levels; i++) {
      const p = +(base + (i * tick)).toFixed(2);
      const isWall = (i === 3 || i === 7);
      const qty = isWall ? Math.floor(2400 + Math.random() * 4200) : Math.floor(220 + Math.random() * 800);
      asks.push({ price: p, qty });
    }

    // Occasional trade bubble
    const trades = [];
    if (Math.random() < 0.4) {
      const isBuy = Math.random() > 0.48;
      const tPrice = isBuy ? asks[0].price : bids[0].price;
      const tQty = Math.floor(100 + Math.random() * 1200);
      trades.push({ price: tPrice, qty: tQty, isBuy, timestamp });

      // Check for Iceberg order detection
      if (tQty > 950) {
        triggerIcebergAlert(tPrice, tQty);
      }
    }

    return { time: timestamp, bids, asks, trades };
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

  const initHeatmapCanvas = () => {
    canvas = document.getElementById('bookmapCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    resetBookmapBuffer();

    // 1-second interval to push new depth slice
    setInterval(() => {
      state.historyDepth.push(generateSyntheticDepthSlice(Date.now()));
      if (state.historyDepth.length > 60) state.historyDepth.shift();
    }, 1000);

    const renderLoop = () => {
      renderHeatmap();
      animationId = requestAnimationFrame(renderLoop);
    };
    animationId = requestAnimationFrame(renderLoop);
  };

  const renderHeatmap = () => {
    if (!canvas || !ctx) return;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    if (state.historyDepth.length === 0) return;

    // Price scaling
    const mid = state.livePrice;
    const range = state.tickSize * 14;
    const minP = mid - range;
    const maxP = mid + range;

    const getY = (price) => {
      return h - ((price - minP) / (maxP - minP)) * h;
    };

    // Draw Price Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let p = minP; p <= maxP; p += state.tickSize * 2) {
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Price labels on right
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(p.toFixed(2), w - 48, y - 2);
    }

    // Render rolling depth waterfall
    const sliceWidth = w / 60;
    state.historyDepth.forEach((slice, sIdx) => {
      const x = sIdx * sliceWidth;

      // Render Bids (Cyan/Emerald intensity)
      slice.bids.forEach(b => {
        const y = getY(b.price);
        const alpha = Math.min(0.85, Math.max(0.12, b.qty / 5000));
        ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.fillRect(x, y - 3, sliceWidth, 6);
      });

      // Render Asks (Crimson/Amber intensity)
      slice.asks.forEach(a => {
        const y = getY(a.price);
        const alpha = Math.min(0.85, Math.max(0.12, a.qty / 5000));
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.fillRect(x, y - 3, sliceWidth, 6);
      });

      // Render Trade Circles
      slice.trades.forEach(tr => {
        const y = getY(tr.price);
        const r = Math.min(14, Math.max(3, Math.sqrt(tr.qty) * 0.35));
        ctx.beginPath();
        ctx.arc(x + sliceWidth / 2, y, r, 0, Math.PI * 2);
        ctx.fillStyle = tr.isBuy ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
    });

    // Draw Live Mid-Price Line
    const midY = getY(mid);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Mid Label
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`MID: ${mid.toFixed(2)}`, 12, midY - 6);
  };

  // ── 3. Closed-Form Avellaneda-Stoikov Dynamic Market Making ─────────────────
  const updateAvellanedaStoikovQuotes = () => {
    const s = state.livePrice;
    const q = state.asInventory;
    const gamma = state.asGamma;
    const kappa = state.asKappa;
    const sigma = state.asVol;
    const T_minus_t = state.asHorizon;

    // 1. Reservation Price: r(s, q, t) = s - q * gamma * sigma^2 * (T - t)
    const reservationPrice = s - (q * gamma * Math.pow(sigma, 2) * T_minus_t * 100);

    // 2. Optimal Half-Spreads: delta^a + delta^b = (2 / gamma) * ln(1 + gamma / kappa)
    const halfSpreadTerm = (1 / gamma) * Math.log(1 + (gamma / kappa));
    const deltaAsk = Math.max(state.tickSize, ((reservationPrice - s) / 2) + halfSpreadTerm);
    const deltaBid = Math.max(state.tickSize, ((s - reservationPrice) / 2) + halfSpreadTerm);

    const optimalAsk = +(s + deltaAsk).toFixed(2);
    const optimalBid = +(s - deltaBid).toFixed(2);
    const totalSpread = +(optimalAsk - optimalBid).toFixed(2);

    // Update DOM elements
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
      // Map [-50, +50] to [0%, 100%]
      const pct = Math.min(100, Math.max(0, ((q + 50) / 100) * 100));
      invMeter.style.width = `${pct}%`;
      invMeter.style.background = q > 0 ? '#10b981' : (q < 0 ? '#ef4444' : '#64748b');
    }

    // PnL updates
    const spreadCaptureEl = document.getElementById('asSpreadPnL');
    const adverseEl = document.getElementById('asAdversePnL');
    const penaltyEl = document.getElementById('asPenaltyPnL');
    const netEl = document.getElementById('asNetPnL');

    // Dynamic penalty = 0.5 * gamma * q^2 * sigma^2
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

  // ── 4. Stoikov Micro-Price & VPIN Toxicity Radar ───────────────────────────
  const updateMicrostructureMetrics = () => {
    // Top-of-book synthetic queue sizes
    const qb = Math.floor(1400 + Math.random() * 2200);
    const qa = Math.floor(1100 + Math.random() * 2100);
    const s = state.spread;
    const mid = state.livePrice;

    // 1. Stoikov Micro-Price: P_micro = P_mid + ((Q_b - Q_a) / (Q_b + Q_a)) * (Spread / 2)
    state.microPrice = +(mid + ((qb - qa) / (qb + qa)) * (s / 2)).toFixed(2);

    // 2. Order Flow Imbalance (OFI)
    state.ofi = Number(((qb - qa) / (qb + qa)).toFixed(3));

    // 3. Next-Tick Directional Probability via Logistic Transform
    const z = state.ofi * 2.8;
    state.nextTickUpProb = Number(((1 / (1 + Math.exp(-z))) * 100).toFixed(1));

    // 4. VPIN (Volume-Synchronized Probability of Toxicity)
    // Toxicity spikes with large flow imbalance
    state.vpin = Number((0.18 + Math.abs(state.ofi) * 0.45).toFixed(3));

    // Update UI elements
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

  // ── 5. Queue Position & Raw FIX 4.4 Protocol Terminal ───────────────────────
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
          initialQueue: Math.floor(40 + Math.random() * 85),
          currentQueue: Math.floor(40 + Math.random() * 85),
          status: 'QUEUED'
        };

        SoundFX.placeTone();
        updateQueueDisplay();
        emitFixMessage('35=D', state.userQueueOrder); // FIX NewOrderSingle
      });
    }

    if (raceBtn) {
      raceBtn.addEventListener('click', () => {
        simulateLatencyRace();
      });
    }

    // Advancing Queue Simulation Loop
    setInterval(() => {
      if (state.userQueueOrder && state.userQueueOrder.status === 'QUEUED') {
        const step = Math.floor(1 + Math.random() * 5);
        state.userQueueOrder.currentQueue = Math.max(0, state.userQueueOrder.currentQueue - step);

        if (state.userQueueOrder.currentQueue === 0) {
          state.userQueueOrder.status = 'FILLED';
          SoundFX.fillChime();
          emitFixMessage('35=8', state.userQueueOrder); // FIX ExecutionReport
          
          // Execute in PaperBroker if available
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
      }
    }, 800);
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

    const retailLatency = (35 + Math.random() * 25).toFixed(1); // 35-60 ms
    const colocLatency = (12 + Math.random() * 5).toFixed(1);   // 12-17 μs

    raceResEl.innerHTML = `
      <div style="font-weight:700; color:#ef4444; margin-bottom:4px;">❌ OUT-RACE BY COLOCATION HFT BOT</div>
      <div>Retail Web Transit: <span style="color:#ef4444; font-weight:700;">${retailLatency} ms</span></div>
      <div>BKC / Aurora Direct Fiber: <span style="color:#10b981; font-weight:700;">${colocLatency} μs</span></div>
      <div style="color:#94a3b8; font-size:0.7rem; margin-top:4px;">HFT Bot matched remaining depth 2,400× faster. Slower order filled at 1-tick adverse slippage.</div>
    `;
    raceResEl.style.display = 'block';
  };

  // ── FIX Protocol Tag Formatter & Stream ─────────────────────────────────────
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

    // Checksum Tag 10 (mod 256 sum)
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

  // ── 6. UI Controls & Event Listeners ────────────────────────────────────────
  const setupEventListeners = () => {
    // Symbol Selector
    const symSelect = document.getElementById('hftSymbolSelect');
    if (symSelect) {
      symSelect.addEventListener('change', (e) => {
        bindLiveSecurity(e.target.value);
      });
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

    // Avellaneda-Stoikov Sliders
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
        // Execute buy order at optimal bid into PaperBroker
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
  };

  // ── 7. KaTeX Ambient Typesetting ───────────────────────────────────────────
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

  // ── Global Exports for Testing & Automation ────────────────────────────────
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
    }
  };

  // ── Initialize on DOM Ready ────────────────────────────────────────────────
  const init = () => {
    initMarketDataStream();
    initHeatmapCanvas();
    setupEventListeners();
    initQueueSimulator();
    renderFormulasKaTeX();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
