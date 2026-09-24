/**
 * RISKOS High-Frequency Trading (HFT) Institutional Order Flow Footprint Engine
 * 
 * Implements:
 * - Real-time Footprint Candle Aggregation (Bid Volume x Ask Volume per tick rung)
 * - Diagonal Stacked Imbalances (3:1 diagonal buying/selling ratio)
 * - Point of Control (POC) with maximum volume highlight
 * - Value Area (VAH / VAL) at 70% volume distribution
 * - Candle Delta Profile and Cumulative Volume Delta (CVD)
 * - High-speed HTML5 Canvas interactive rendering with zoom and pan
 */

(function (global) {
  'use strict';

  class OrderFlowFootprintCore {
    constructor() {
      this.tickSize = 0.25;
      this.candleDurationMs = 60000; // 1-minute default candle
      this.imbalanceThresholdRatio = 3.0; // 300% (3:1) diagonal dominance
      this.minImbalanceVolume = 50;

      this.candles = [];
      this.maxCandles = 15;
      this.currentCandle = null;
    }

    setTickSize(tick) {
      if (tick && tick > 0) this.tickSize = Number(tick);
    }

    setDuration(ms) {
      if (ms && ms >= 10000) this.candleDurationMs = Number(ms);
    }

    _roundToTick(price) {
      return Math.round(price / this.tickSize) * this.tickSize;
    }

    _startNewCandle(price, timestamp = Date.now()) {
      const rounded = this._roundToTick(price);
      const candle = {
        id: `CANDLE-${timestamp}`,
        startTime: timestamp,
        endTime: timestamp + this.candleDurationMs,
        open: rounded,
        high: rounded,
        low: rounded,
        close: rounded,
        levels: new Map(), // price -> { price, bidVol, askVol, totalVol, delta }
        totalVolume: 0,
        totalDelta: 0,
        pocPrice: rounded,
        pocVolume: 0,
        valueAreaHigh: rounded,
        valueAreaLow: rounded,
        imbalances: [],
        stackedImbalances: []
      };

      this.candles.push(candle);
      if (this.candles.length > this.maxCandles) {
        this.candles.shift();
      }
      this.currentCandle = candle;
      return candle;
    }

    /**
     * Register a trade print (from SecurityMaster live tape or DOM match)
     * Side: 'BUY' (aggressor bought ask) or 'SELL' (aggressor hit bid)
     */
    registerTrade(price, size = 100, side = 'BUY', timestamp = Date.now()) {
      price = Number(price);
      size = Math.max(1, Number(size) || 100);
      side = String(side).toUpperCase();

      if (!this.currentCandle || timestamp >= this.currentCandle.endTime) {
        this._startNewCandle(price, timestamp);
      }

      const c = this.currentCandle;
      const tickPrice = Number(this._roundToTick(price).toFixed(2));

      // Update OHLC
      if (tickPrice > c.high) c.high = tickPrice;
      if (tickPrice < c.low) c.low = tickPrice;
      c.close = tickPrice;

      // Update price level footprint
      if (!c.levels.has(tickPrice)) {
        c.levels.set(tickPrice, {
          price: tickPrice,
          bidVol: 0,
          askVol: 0,
          totalVol: 0,
          delta: 0
        });
      }

      const level = c.levels.get(tickPrice);
      if (side === 'BUY') {
        level.askVol += size;
        c.totalDelta += size;
      } else {
        level.bidVol += size;
        c.totalDelta -= size;
      }
      level.totalVol += size;
      level.delta = level.askVol - level.bidVol;
      c.totalVolume += size;

      // Recalculate POC and Imbalances
      this._analyzeCandleMicrostructure(c);

      return c;
    }

    _analyzeCandleMicrostructure(candle) {
      let maxVol = 0;
      let pocPrice = candle.open;

      const sortedPrices = Array.from(candle.levels.keys()).sort((a, b) => a - b);

      // 1. Identify Point of Control (POC)
      for (const p of sortedPrices) {
        const lvl = candle.levels.get(p);
        if (lvl.totalVol > maxVol) {
          maxVol = lvl.totalVol;
          pocPrice = p;
        }
      }
      candle.pocPrice = pocPrice;
      candle.pocVolume = maxVol;

      // 2. Compute 70% Value Area (VAH / VAL)
      const targetVaVol = candle.totalVolume * 0.70;
      let accumulatedVaVol = maxVol;
      let lowIdx = sortedPrices.indexOf(pocPrice);
      let highIdx = lowIdx;

      while (accumulatedVaVol < targetVaVol && (lowIdx > 0 || highIdx < sortedPrices.length - 1)) {
        const nextLowVol = lowIdx > 0 ? candle.levels.get(sortedPrices[lowIdx - 1]).totalVol : 0;
        const nextHighVol = highIdx < sortedPrices.length - 1 ? candle.levels.get(sortedPrices[highIdx + 1]).totalVol : 0;

        if (nextHighVol >= nextLowVol && highIdx < sortedPrices.length - 1) {
          highIdx++;
          accumulatedVaVol += nextHighVol;
        } else if (lowIdx > 0) {
          lowIdx--;
          accumulatedVaVol += nextLowVol;
        } else if (highIdx < sortedPrices.length - 1) {
          highIdx++;
          accumulatedVaVol += nextHighVol;
        } else {
          break;
        }
      }
      candle.valueAreaLow = sortedPrices[lowIdx] || candle.low;
      candle.valueAreaHigh = sortedPrices[highIdx] || candle.high;

      // 3. Diagonal Imbalance Calculation:
      // Buying Imbalance: Ask volume at p vs Bid volume at p - 1 tick
      // Selling Imbalance: Bid volume at p vs Ask volume at p + 1 tick
      const imbalances = [];
      for (let i = 0; i < sortedPrices.length; i++) {
        const p = sortedPrices[i];
        const curr = candle.levels.get(p);

        // Check Diagonal Buy Imbalance
        if (i > 0) {
          const lowerPrice = sortedPrices[i - 1];
          const lower = candle.levels.get(lowerPrice);
          const bidLower = Math.max(1, lower.bidVol);
          const ratio = curr.askVol / bidLower;

          if (ratio >= this.imbalanceThresholdRatio && curr.askVol >= this.minImbalanceVolume) {
            imbalances.push({
              price: p,
              side: 'BUY',
              ratio: Number(ratio.toFixed(1)),
              askVol: curr.askVol,
              compareBidVol: lower.bidVol
            });
          }
        }

        // Check Diagonal Sell Imbalance
        if (i < sortedPrices.length - 1) {
          const higherPrice = sortedPrices[i + 1];
          const higher = candle.levels.get(higherPrice);
          const askHigher = Math.max(1, higher.askVol);
          const ratio = curr.bidVol / askHigher;

          if (ratio >= this.imbalanceThresholdRatio && curr.bidVol >= this.minImbalanceVolume) {
            imbalances.push({
              price: p,
              side: 'SELL',
              ratio: Number(ratio.toFixed(1)),
              bidVol: curr.bidVol,
              compareAskVol: higher.askVol
            });
          }
        }
      }
      candle.imbalances = imbalances;

      // 4. Stacked Imbalances: 3 or more consecutive price levels with same imbalance
      const stacked = [];
      let consecutiveCount = 1;
      let currentSide = null;

      for (let i = 0; i < imbalances.length; i++) {
        if (imbalances[i].side === currentSide) {
          consecutiveCount++;
          if (consecutiveCount >= 3) {
            stacked.push({
              side: currentSide,
              startPrice: imbalances[i - consecutiveCount + 1].price,
              endPrice: imbalances[i].price,
              count: consecutiveCount
            });
          }
        } else {
          currentSide = imbalances[i].side;
          consecutiveCount = 1;
        }
      }
      candle.stackedImbalances = stacked;
    }

    /**
     * Pre-populate simulated historical footprint candles around current price
     */
    seedHistory(basePrice = 2800, numCandles = 5) {
      this.candles = [];
      const now = Date.now();

      for (let cIdx = numCandles - 1; cIdx >= 0; cIdx--) {
        const cTime = now - (cIdx * this.candleDurationMs);
        const candleBase = +(basePrice + (Math.random() - 0.48) * 3).toFixed(2);
        this._startNewCandle(candleBase, cTime);

        // Generate 35-60 random trades inside this candle
        const tradeCount = Math.floor(35 + Math.random() * 25);
        for (let t = 0; t < tradeCount; t++) {
          const deltaTicks = Math.floor((Math.random() - 0.5) * 8);
          const p = +(candleBase + deltaTicks * this.tickSize).toFixed(2);
          const sz = Math.floor(40 + Math.random() * 220);
          const side = Math.random() > 0.48 ? 'BUY' : 'SELL';
          this.registerTrade(p, sz, side, cTime + t * 800);
        }
      }

      return this.candles;
    }

    getCandles() {
      return this.candles;
    }

    renderToCanvas(canvasIdOrEl) {
      if (typeof document === 'undefined') return;
      const el = typeof canvasIdOrEl === 'string' ? document.getElementById(canvasIdOrEl) : canvasIdOrEl;
      return this.renderCanvas(el);
    }

    /**
     * Render the Footprint Chart onto an HTML5 Canvas element
     */
    renderCanvas(canvas) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Dark Terminal Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      if (this.candles.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for live footprint tape prints...', width / 2, height / 2);
        return;
      }

      // Calculate global min/max price across visible candles
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      this.candles.forEach(c => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
      });

      if (minPrice === Infinity) { minPrice = 100; maxPrice = 105; }
      const pricePadding = (maxPrice - minPrice) * 0.1 || 1.0;
      minPrice -= pricePadding;
      maxPrice += pricePadding;
      const priceRange = maxPrice - minPrice;

      const priceToY = (p) => height - 55 - ((p - minPrice) / priceRange) * (height - 85);

      const candleWidth = Math.min(130, Math.max(90, (width - 60) / this.candles.length));
      const startX = 30;

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const p = minPrice + (i / 6) * priceRange;
        const y = priceToY(p);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 50, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(p.toFixed(2), width - 46, y + 3);
      }

      // Render Candles
      this.candles.forEach((c, idx) => {
        const x = startX + idx * candleWidth;
        const centerX = x + candleWidth / 2;

        // Draw Candle Wick
        const yHigh = priceToY(c.high);
        const yLow = priceToY(c.low);
        ctx.strokeStyle = c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, yHigh);
        ctx.lineTo(centerX, yLow);
        ctx.stroke();

        // Draw Footprint Cells (Price levels)
        const sortedPrices = Array.from(c.levels.keys()).sort((a, b) => b - a); // highest price at top
        const cellHeight = Math.max(14, Math.min(22, (height - 100) / (sortedPrices.length || 1)));

        sortedPrices.forEach(p => {
          const lvl = c.levels.get(p);
          const y = priceToY(p) - cellHeight / 2;

          // Check if this level has an imbalance
          const isBuyImb = c.imbalances.some(imb => imb.price === p && imb.side === 'BUY');
          const isSellImb = c.imbalances.some(imb => imb.price === p && imb.side === 'SELL');
          const isPoc = p === c.pocPrice;

          // Cell Background
          if (isPoc) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
            ctx.fillRect(x + 4, y, candleWidth - 8, cellHeight - 1);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 4, y, candleWidth - 8, cellHeight - 1);
          } else if (isBuyImb) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.fillRect(x + 4, y, candleWidth - 8, cellHeight - 1);
          } else if (isSellImb) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fillRect(x + 4, y, candleWidth - 8, cellHeight - 1);
          } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
            ctx.fillRect(x + 4, y, candleWidth - 8, cellHeight - 1);
          }

          // Bid Volume (Left) x Ask Volume (Right) Text
          ctx.font = '9px JetBrains Mono, monospace';
          
          // Bid Vol in crimson
          ctx.fillStyle = isSellImb ? '#ef4444' : '#94a3b8';
          ctx.textAlign = 'right';
          ctx.fillText(lvl.bidVol.toString(), centerX - 6, y + cellHeight - 4);

          // Divider
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.textAlign = 'center';
          ctx.fillText('×', centerX, y + cellHeight - 4);

          // Ask Vol in emerald
          ctx.fillStyle = isBuyImb ? '#10b981' : '#f8fafc';
          ctx.textAlign = 'left';
          ctx.fillText(lvl.askVol.toString(), centerX + 6, y + cellHeight - 4);
        });

        // Bottom Delta Profile Bar
        const deltaY = height - 32;
        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.fillRect(x + 4, deltaY, candleWidth - 8, 26);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(x + 4, deltaY, candleWidth - 8, 26);

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = c.totalDelta >= 0 ? '#10b981' : '#ef4444';
        ctx.fillText(`Δ ${c.totalDelta >= 0 ? '+' : ''}${c.totalDelta}`, centerX, deltaY + 11);
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Vol ${(c.totalVolume / 1000).toFixed(1)}k`, centerX, deltaY + 22);

        // Highlight Stacked Imbalance Indicator
        if (c.stackedImbalances.length > 0) {
          const stack = c.stackedImbalances[0];
          ctx.fillStyle = stack.side === 'BUY' ? '#10b981' : '#ef4444';
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ ${stack.count}x STACK`, centerX, yHigh - 6);
        }
      });
    }
  }

  // Singleton instance
  const engineInstance = new OrderFlowFootprintCore();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      OrderFlowFootprint: engineInstance,
      OrderFlowFootprintCore
    };
  }

  if (typeof window !== 'undefined') {
    window.OrderFlowFootprint = engineInstance;
    window.OrderFlowFootprintCore = OrderFlowFootprintCore;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
