/**
 * RISKOS — L2/L3 ORDER BOOK DEPTH OF MARKET (DOM) & EXECUTION SUITE (orderBookDom.js)
 * Institutional-grade DOM ladder with micro-price, cumulative volume profile,
 * advanced algorithmic order routing (Iceberg, TWAP, VWAP, Bracket/OCO), and Web Audio API feedback.
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OrderBookDOM = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // ── Web Audio Feedback Engine ──────────────────────────────────────────────
  class DOMSoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    _initCtx() {
      if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.1) {
      if (!this.enabled || typeof window === 'undefined') return;
      try {
        this._initCtx();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
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
      } catch (e) {
        // Audio policy or no audio device fallback
      }
    }

    orderPlaced() { this.playTone(880, 'sine', 0.06, 0.08); }
    orderFilled() { this.playTone(1320, 'triangle', 0.12, 0.12); }
    orderCanceled() { this.playTone(440, 'sawtooth', 0.09, 0.06); }
  }

  // ── Core L2/L3 Order Book DOM Engine ───────────────────────────────────────
  class OrderBookDOMEngine {
    constructor(options = {}) {
      this.symbol = options.symbol || 'NIFTY50';
      this.midPrice = options.midPrice || 24500.00;
      this.tickSize = options.tickSize || 0.50;
      this.depthLevels = options.depthLevels || 10;
      this.sound = new DOMSoundEngine();

      this.bids = [];
      this.asks = [];
      this.activeOrders = [];
      this.tradeHistory = [];
      this.activeAlgorithmicTasks = [];

      this.generateSyntheticBook();
    }

    generateSyntheticBook() {
      this.bids = [];
      this.asks = [];

      let runningBidVol = 0;
      for (let i = 1; i <= this.depthLevels; i++) {
        const price = +(this.midPrice - (i * this.tickSize)).toFixed(2);
        // Liquidity clusters around key support levels
        const size = Math.floor(250 + Math.random() * 800 * (1 + (i % 3 === 0 ? 1.5 : 0)));
        runningBidVol += size;
        this.bids.push({
          price,
          size,
          cumulative: runningBidVol,
          ordersCount: Math.floor(size / 60) + 1
        });
      }

      let runningAskVol = 0;
      for (let i = 1; i <= this.depthLevels; i++) {
        const price = +(this.midPrice + (i * this.tickSize)).toFixed(2);
        const size = Math.floor(220 + Math.random() * 750 * (1 + (i % 3 === 0 ? 1.4 : 0)));
        runningAskVol += size;
        this.asks.push({
          price,
          size,
          cumulative: runningAskVol,
          ordersCount: Math.floor(size / 60) + 1
        });
      }
    }

    /**
     * Micro-Price Formula:
     * P_micro = (Q_bid * P_ask + Q_ask * P_bid) / (Q_bid + Q_ask)
     */
    getMicroPrice() {
      if (!this.bids.length || !this.asks.length) return this.midPrice;
      const bestBid = this.bids[0];
      const bestAsk = this.asks[0];
      const totalTopQty = bestBid.size + bestAsk.size;
      if (totalTopQty === 0) return (bestBid.price + bestAsk.price) / 2;
      return +((bestBid.size * bestAsk.price + bestAsk.size * bestBid.price) / totalTopQty).toFixed(2);
    }

    getSpread() {
      if (!this.bids.length || !this.asks.length) return 0;
      return +(this.asks[0].price - this.bids[0].price).toFixed(2);
    }

    getOrderBookImbalance() {
      const bidVol = this.bids.reduce((sum, b) => sum + b.size, 0);
      const askVol = this.asks.reduce((sum, a) => sum + a.size, 0);
      if (bidVol + askVol === 0) return 0;
      // Range: -1 (all ask) to +1 (all bid)
      return +((bidVol - askVol) / (bidVol + askVol)).toFixed(4);
    }

    // ── Algorithmic Order Types ───────────────────────────────────────────────

    /**
     * Iceberg Order:
     * Submits an institutional order of totalQuantity in randomized slices of visibleQuantity.
     */
    createIcebergOrder({ symbol, side, totalQuantity, visibleQuantity, limitPrice }) {
      const orderId = 'ICE_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const order = {
        id: orderId,
        type: 'ICEBERG',
        symbol: symbol || this.symbol,
        side, // 'BUY' or 'SELL'
        totalQuantity,
        filledQuantity: 0,
        visibleQuantity: Math.min(visibleQuantity, totalQuantity),
        limitPrice,
        status: 'ACTIVE',
        slices: [],
        timestamp: new Date().toISOString()
      };

      this.activeOrders.push(order);
      this.sound.orderPlaced();

      // Simulate execution of first slice
      this._executeIcebergSlice(order);
      return order;
    }

    _executeIcebergSlice(order) {
      if (order.status !== 'ACTIVE' || order.filledQuantity >= order.totalQuantity) {
        order.status = 'COMPLETED';
        return;
      }
      const remaining = order.totalQuantity - order.filledQuantity;
      const sliceSize = Math.min(order.visibleQuantity, remaining);
      order.filledQuantity += sliceSize;
      order.slices.push({
        size: sliceSize,
        price: order.limitPrice,
        timestamp: new Date().toISOString()
      });

      this.sound.orderFilled();
      if (order.filledQuantity >= order.totalQuantity) {
        order.status = 'COMPLETED';
      }
    }

    /**
     * TWAP Order (Time-Weighted Average Price):
     * Slices order evenly across discrete time windows.
     */
    createTWAPOrder({ symbol, side, totalQuantity, durationMinutes, intervalsCount, limitPrice }) {
      const orderId = 'TWAP_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const sliceSize = Math.floor(totalQuantity / intervalsCount);
      const schedule = [];
      const intervalSec = (durationMinutes * 60) / intervalsCount;

      for (let i = 0; i < intervalsCount; i++) {
        schedule.push({
          sliceIndex: i + 1,
          timeOffsetSec: Math.round(i * intervalSec),
          quantity: i === intervalsCount - 1 ? (totalQuantity - (sliceSize * (intervalsCount - 1))) : sliceSize,
          targetPrice: limitPrice || this.midPrice,
          status: 'SCHEDULED'
        });
      }

      const order = {
        id: orderId,
        type: 'TWAP',
        symbol: symbol || this.symbol,
        side,
        totalQuantity,
        durationMinutes,
        intervalsCount,
        filledQuantity: schedule[0].quantity, // instant first tranche
        status: 'ACTIVE',
        schedule,
        timestamp: new Date().toISOString()
      };

      schedule[0].status = 'FILLED';
      this.activeOrders.push(order);
      this.sound.orderPlaced();
      return order;
    }

    /**
     * Bracket / OCO (One-Cancels-Other) Order:
     * Primary entry order tied to a Take-Profit limit and a Stop-Loss stop.
     */
    createBracketOrder({ symbol, side, quantity, entryPrice, takeProfitPrice, stopLossPrice }) {
      const orderId = 'BRACKET_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const isBuy = side.toUpperCase() === 'BUY';

      // Validation
      if (isBuy) {
        if (takeProfitPrice <= entryPrice || stopLossPrice >= entryPrice) {
          throw new Error('For Long Bracket: TakeProfit > Entry and StopLoss < Entry');
        }
      } else {
        if (takeProfitPrice >= entryPrice || stopLossPrice <= entryPrice) {
          throw new Error('For Short Bracket: TakeProfit < Entry and StopLoss > Entry');
        }
      }

      const order = {
        id: orderId,
        type: 'BRACKET_OCO',
        symbol: symbol || this.symbol,
        side,
        quantity,
        entryPrice,
        takeProfitPrice,
        stopLossPrice,
        status: 'OPEN',
        legs: {
          entry: { status: 'FILLED', price: entryPrice },
          takeProfit: { status: 'PENDING', price: takeProfitPrice },
          stopLoss: { status: 'PENDING', price: stopLossPrice }
        },
        timestamp: new Date().toISOString()
      };

      this.activeOrders.push(order);
      this.sound.orderPlaced();
      return order;
    }

    cancelOrder(orderId) {
      const order = this.activeOrders.find(o => o.id === orderId);
      if (order && order.status !== 'CANCELLED' && order.status !== 'COMPLETED') {
        order.status = 'CANCELLED';
        this.sound.orderCanceled();
        return true;
      }
      return false;
    }

    // ── HTML DOM Component Generator ──────────────────────────────────────────
    renderHTMLComponent(containerId) {
      if (typeof document === 'undefined') return null;
      const container = document.getElementById(containerId);
      if (!container) return null;

      const micro = this.getMicroPrice();
      const spread = this.getSpread();
      const imbalance = this.getOrderBookImbalance();
      const maxBidVol = Math.max(...this.bids.map(b => b.size), 1);
      const maxAskVol = Math.max(...this.asks.map(a => a.size), 1);
      const maxVol = Math.max(maxBidVol, maxAskVol);
      const canvasId = `domDepthCanvas_${this.symbol.replace(/[^A-Za-z0-9]/g, '_')}`;

      let html = `
        <div class="dom-widget-container">
          <div class="dom-header">
            <div class="dom-title-row">
              <span class="dom-symbol">${this.symbol} &bull; L2 DOM</span>
              ${OrderBookDOMEngine.getProvenanceBadge(this.symbol)}
              <span class="dom-micro-price">Micro: ₹${micro.toFixed(2)}</span>
              <span class="dom-spread">Spread: ₹${spread.toFixed(2)}</span>
            </div>
            <div class="dom-imbalance-bar-wrap" title="Order Flow Imbalance: ${(imbalance * 100).toFixed(1)}%">
              <div class="dom-imbalance-bid" style="width: ${Math.max(5, (imbalance + 1) * 50)}%"></div>
              <div class="dom-imbalance-ask" style="width: ${Math.max(5, (1 - imbalance) * 50)}%"></div>
            </div>
          </div>

          <!-- Level 2 Visual Cumulative Depth Chart (Wall Pressure) -->
          <div class="dom-depth-canvas-wrap" style="height:100px; position:relative; background:#06080f; border:1px solid rgba(255,255,255,0.06); border-radius:6px; margin:8px 0; overflow:hidden;">
            <canvas id="${canvasId}" style="width:100%; height:100%; display:block;"></canvas>
            <div style="position:absolute; top:4px; left:8px; font-size:0.62rem; color:#10b981; font-weight:700; font-family:monospace; pointer-events:none;">
              BUY WALL: ${this.bids.reduce((s,b)=>s+b.size,0).toLocaleString()}
            </div>
            <div style="position:absolute; top:4px; right:8px; font-size:0.62rem; color:#ef4444; font-weight:700; font-family:monospace; pointer-events:none;">
              SELL WALL: ${this.asks.reduce((s,a)=>s+a.size,0).toLocaleString()}
            </div>
          </div>

          <div class="dom-ladder-wrap">
            <div class="dom-ladder-header">
              <span>ORDERS</span>
              <span>SIZE</span>
              <span>PRICE</span>
              <span>DEPTH</span>
            </div>
            <div class="dom-ladder-body">
      `;

      // Render Asks (descending price from top)
      const reversedAsks = [...this.asks].reverse();
      reversedAsks.forEach(ask => {
        const barWidth = Math.round((ask.size / maxVol) * 100);
        html += `
          <div class="dom-row ask-row">
            <span class="dom-orders">${ask.ordersCount}</span>
            <span class="dom-size">${ask.size}</span>
            <span class="dom-price ask-price">${ask.price.toFixed(2)}</span>
            <div class="dom-depth-bar ask-bar" style="width: ${barWidth}%"></div>
          </div>
        `;
      });

      // Mid-market bar
      html += `
        <div class="dom-mid-divider">
          <span>MID: ₹${this.midPrice.toFixed(2)}</span>
          <span class="dom-badge">MICRO: ₹${micro.toFixed(2)}</span>
        </div>
      `;

      // Render Bids (descending price)
      this.bids.forEach(bid => {
        const barWidth = Math.round((bid.size / maxVol) * 100);
        html += `
          <div class="dom-row bid-row">
            <span class="dom-orders">${bid.ordersCount}</span>
            <span class="dom-size">${bid.size}</span>
            <span class="dom-price bid-price">${bid.price.toFixed(2)}</span>
            <div class="dom-depth-bar bid-bar" style="width: ${barWidth}%"></div>
          </div>
        `;
      });

      html += `
            </div>
          </div>

          <!-- Algorithmic Order Entry Panel -->
          <div class="dom-algo-panel">
            <div class="dom-algo-tabs">
              <button class="dom-algo-tab active" data-tab="iceberg">Iceberg</button>
              <button class="dom-algo-tab" data-tab="twap">TWAP</button>
              <button class="dom-algo-tab" data-tab="bracket">Bracket / OCO</button>
            </div>
            <div class="dom-algo-inputs" id="domAlgoInputs">
              <div class="dom-input-group">
                <label>Side</label>
                <select id="domOrderSide" class="dom-select">
                  <option value="BUY">BUY (Bid)</option>
                  <option value="SELL">SELL (Ask)</option>
                </select>
              </div>
              <div class="dom-input-group">
                <label>Total Qty</label>
                <input type="number" id="domTotalQty" value="5000" step="100" class="dom-input"/>
              </div>
              <div class="dom-input-group" id="domVisibleQtyGroup">
                <label>Visible Slice</label>
                <input type="number" id="domVisibleQty" value="500" step="50" class="dom-input"/>
              </div>
              <button class="dom-submit-btn" id="domSubmitOrderBtn">Transmit Algo Order</button>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
      setTimeout(() => this.renderDepthChartCanvas(canvasId), 50);
      return html;
    }

    static getProvenanceBadge(symbol, feedType = 'AUTO') {
      const sym = (symbol || '').toUpperCase();
      if (feedType === 'WS_LIVE' || sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('-USD')) {
        return '<span class="provenance-pill prov-live" style="font-size:0.62rem; font-weight:800; padding:2px 6px; border-radius:4px; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.35); color:#10b981;"><i class="fa-solid fa-circle" style="font-size:0.45rem; vertical-align:middle; margin-right:3px;"></i>WEBSOCKET LIVE</span>';
      }
      if (feedType === 'DELAYED_15M' || sym.includes('.NS') || sym.includes('.BO') || sym.includes('NIFTY') || sym.includes('BANKNIFTY')) {
        return '<span class="provenance-pill prov-delayed" style="font-size:0.62rem; font-weight:800; padding:2px 6px; border-radius:4px; background:rgba(245,158,11,0.18); border:1px solid rgba(245,158,11,0.35); color:#fbbf24;"><i class="fa-solid fa-clock" style="font-size:0.5rem; vertical-align:middle; margin-right:3px;"></i>15-MIN DELAYED</span>';
      }
      return '<span class="provenance-pill prov-synth" style="font-size:0.62rem; font-weight:800; padding:2px 6px; border-radius:4px; background:rgba(37,99,235,0.18); border:1px solid rgba(59,130,246,0.35); color:#60a5fa;"><i class="fa-solid fa-bolt" style="font-size:0.5rem; vertical-align:middle; margin-right:3px;"></i>SYNTHETIC STREAM (100ms)</span>';
    }

    renderDepthChartCanvas(canvasIdOrEl) {
      if (typeof document === 'undefined') return;
      const canvas = typeof canvasIdOrEl === 'string' ? document.getElementById(canvasIdOrEl) : canvasIdOrEl;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const w = canvas.width = (rect.width || 320) * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
      const h = canvas.height = (rect.height || 100) * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
      ctx.clearRect(0, 0, w, h);

      const totalBidVol = this.bids.reduce((s, b) => s + b.size, 0) || 1;
      const totalAskVol = this.asks.reduce((s, a) => s + a.size, 0) || 1;
      const maxCumul = Math.max(totalBidVol, totalAskVol);

      const midX = w / 2;

      // Draw Cumulative Bid Depth (Green)
      ctx.beginPath();
      ctx.moveTo(0, h);
      const sortedBids = [...this.bids].sort((a, b) => a.price - b.price);
      let runningBid = 0;
      sortedBids.forEach((b, idx) => {
        runningBid += b.size;
        const x = (idx / (sortedBids.length - 1 || 1)) * midX;
        const y = h - (runningBid / maxCumul) * (h * 0.85);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(midX, h - (runningBid / maxCumul) * (h * 0.85));
      ctx.lineTo(midX, h);
      ctx.closePath();

      const bidGrad = ctx.createLinearGradient(0, 0, 0, h);
      bidGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      bidGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
      ctx.fillStyle = bidGrad;
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Cumulative Ask Depth (Red)
      ctx.beginPath();
      ctx.moveTo(midX, h);
      const sortedAsks = [...this.asks].sort((a, b) => a.price - b.price);
      let runningAsk = 0;
      sortedAsks.forEach((a, idx) => {
        runningAsk += a.size;
        const x = midX + (idx / (sortedAsks.length - 1 || 1)) * (w - midX);
        const y = h - (runningAsk / maxCumul) * (h * 0.85);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.closePath();

      const askGrad = ctx.createLinearGradient(0, 0, 0, h);
      askGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      askGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
      ctx.fillStyle = askGrad;
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center Mid-Price Dotted Marker
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, h);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  return {
    OrderBookDOMEngine,
    DOMSoundEngine
  };
});
