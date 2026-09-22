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

      let html = `
        <div class="dom-widget-container">
          <div class="dom-header">
            <div class="dom-title-row">
              <span class="dom-symbol">${this.symbol} &bull; L2 DOM</span>
              <span class="dom-micro-price">Micro: ₹${micro.toFixed(2)}</span>
              <span class="dom-spread">Spread: ₹${spread.toFixed(2)}</span>
            </div>
            <div class="dom-imbalance-bar-wrap" title="Order Flow Imbalance: ${(imbalance * 100).toFixed(1)}%">
              <div class="dom-imbalance-bid" style="width: ${Math.max(5, (imbalance + 1) * 50)}%"></div>
              <div class="dom-imbalance-ask" style="width: ${Math.max(5, (1 - imbalance) * 50)}%"></div>
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
      return html;
    }
  }

  return {
    OrderBookDOMEngine,
    DOMSoundEngine
  };
});
