/**
 * RISKOS BookDepthHeatmap: High-Performance Canvas Order Book Depth Visualizer
 * ==============================================================================
 * Real-time 50-level LOB depth heatmap with market sweep bubbles, iceberg detector,
 * and P.R.E.M.-Alpha dynamic quoting bands (reservation fair price, optimal bid/ask).
 * Architect: Premchand Yadav
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BookDepthHeatmap = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class BookDepthHeatmap {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
      this.maxTimeSlices = options.maxTimeSlices || 120;
      this.priceTiers = options.priceTiers || 50;
      this.timeSlices = []; // Array of { timestamp, midPrice, bids: [[p, v]], asks: [[p, v]], premQuotes: { resPrice, bid, ask, isShutdown } }
      this.marketTrades = []; // Array of { timestamp, price, qty, side, isSweep, isIceberg }
      
      this.showPremBands = options.showPremBands !== false;
      this.showIcebergs = options.showIcebergs !== false;
      this.isPaused = false;
      this.minPrice = 0;
      this.maxPrice = 0;
      this.maxVolume = 1;

      if (this.canvas) {
        this.resize();
        window.addEventListener('resize', () => this.resize());
      }
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      this.width = rect.width || 800;
      this.height = rect.height || 400;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      if (this.ctx) {
        this.ctx.scale(dpr, dpr);
      }
      this.render();
    }

    addSnapshot(lobData, premData = null) {
      if (this.isPaused) return;

      const mid = lobData.midPrice || 100.0;
      const bids = lobData.bids || [];
      const asks = lobData.asks || [];

      const slice = {
        timestamp: lobData.timestamp || Date.now(),
        midPrice: mid,
        bids: bids.slice(0, this.priceTiers),
        asks: asks.slice(0, this.priceTiers),
        premQuotes: premData ? {
          resPrice: premData.reservationPrice,
          optimalBid: premData.optimalBid,
          optimalAsk: premData.optimalAsk,
          isShutdown: premData.isHawkesShutdown
        } : null
      };

      this.timeSlices.push(slice);
      if (this.timeSlices.length > this.maxTimeSlices) {
        this.timeSlices.shift();
      }

      this.updatePriceBounds();
      this.render();
    }

    addTrade(trade) {
      this.marketTrades.push({
        ...trade,
        timestamp: trade.timestamp || Date.now()
      });
      // Keep only recent trades matching time horizon
      if (this.marketTrades.length > 200) {
        this.marketTrades.shift();
      }
      this.render();
    }

    updatePriceBounds() {
      if (this.timeSlices.length === 0) return;

      let pMin = Infinity;
      let pMax = -Infinity;
      let vMax = 1;

      for (const s of this.timeSlices) {
        pMin = Math.min(pMin, s.midPrice);
        pMax = Math.max(pMax, s.midPrice);

        for (const [p, v] of s.bids) {
          pMin = Math.min(pMin, p);
          vMax = Math.max(vMax, v);
        }
        for (const [p, v] of s.asks) {
          pMax = Math.max(pMax, p);
          vMax = Math.max(vMax, v);
        }
      }

      // Add 2% padding
      const pad = (pMax - pMin) * 0.05 || 1.0;
      this.minPrice = pMin - pad;
      this.maxPrice = pMax + pad;
      this.maxVolume = vMax;
    }

    /**
     * Color mapping: 0 -> deep slate, 0.4 -> cyan, 0.7 -> amber, 1.0 -> crimson gold
     */
    getDensityColor(vol, maxVol, isBid) {
      const norm = Math.min(1.0, Math.max(0.0, vol / (maxVol || 1.0)));
      if (norm < 0.15) {
        return 'rgba(15, 23, 42, 0.8)';
      } else if (norm < 0.40) {
        return isBid ? 'rgba(14, 116, 144, 0.6)' : 'rgba(194, 65, 12, 0.6)';
      } else if (norm < 0.75) {
        return isBid ? 'rgba(16, 185, 129, 0.75)' : 'rgba(245, 158, 11, 0.75)';
      } else {
        return 'rgba(239, 68, 68, 0.9)'; // Iceberg / Heavy concentration
      }
    }

    render() {
      if (!this.ctx || !this.width || !this.height) return;
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // Clear Canvas Background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      if (this.timeSlices.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Accumulating high-frequency depth frames...', 20, h / 2);
        return;
      }

      const pRange = this.maxPrice - this.minPrice || 1.0;
      const mapY = (price) => h - ((price - this.minPrice) / pRange) * h;
      const colWidth = w / this.maxTimeSlices;

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        const y = (h / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Depth Heatmap Blocks
      for (let col = 0; col < this.timeSlices.length; col++) {
        const slice = this.timeSlices[col];
        const x = col * colWidth;

        // Draw Bids
        for (const [price, vol] of slice.bids) {
          const y = mapY(price);
          ctx.fillStyle = this.getDensityColor(vol, this.maxVolume, true);
          ctx.fillRect(x, y - 2, colWidth + 0.5, 4);
        }

        // Draw Asks
        for (const [price, vol] of slice.asks) {
          const y = mapY(price);
          ctx.fillStyle = this.getDensityColor(vol, this.maxVolume, false);
          ctx.fillRect(x, y - 2, colWidth + 0.5, 4);
        }
      }

      // Draw P.R.E.M.-Alpha Quoting Bands
      if (this.showPremBands) {
        // Shaded Spread Ribbon
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.beginPath();
        let first = true;
        for (let col = 0; col < this.timeSlices.length; col++) {
          const s = this.timeSlices[col];
          if (!s.premQuotes) continue;
          const x = col * colWidth;
          const yAsk = mapY(s.premQuotes.optimalAsk);
          if (first) { ctx.moveTo(x, yAsk); first = false; } else { ctx.lineTo(x, yAsk); }
        }
        for (let col = this.timeSlices.length - 1; col >= 0; col--) {
          const s = this.timeSlices[col];
          if (!s.premQuotes) continue;
          const x = col * colWidth;
          const yBid = mapY(s.premQuotes.optimalBid);
          ctx.lineTo(x, yBid);
        }
        ctx.closePath();
        ctx.fill();

        // Line 1: Optimal Bid (Emerald)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        first = true;
        for (let col = 0; col < this.timeSlices.length; col++) {
          const s = this.timeSlices[col];
          if (!s.premQuotes) continue;
          const x = col * colWidth;
          const y = mapY(s.premQuotes.optimalBid);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();

        // Line 2: Optimal Ask (Amber)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        first = true;
        for (let col = 0; col < this.timeSlices.length; col++) {
          const s = this.timeSlices[col];
          if (!s.premQuotes) continue;
          const x = col * colWidth;
          const y = mapY(s.premQuotes.optimalAsk);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();

        // Line 3: Reservation Fair Price (Cyan Dash)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        first = true;
        for (let col = 0; col < this.timeSlices.length; col++) {
          const s = this.timeSlices[col];
          if (!s.premQuotes) continue;
          const x = col * colWidth;
          const y = mapY(s.premQuotes.resPrice);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Midpoint Path
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let col = 0; col < this.timeSlices.length; col++) {
        const x = col * colWidth;
        const y = mapY(this.timeSlices[col].midPrice);
        if (col === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Market Sweep Trade Bubbles
      for (const t of this.marketTrades) {
        const y = mapY(t.price);
        const radius = Math.min(18, Math.max(4, Math.sqrt(t.qty || 10) * 1.5));
        const x = w - 25; // Render at head of tape

        ctx.fillStyle = t.side === 'BUY' ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (t.isIceberg && this.showIcebergs) {
          ctx.fillStyle = '#fde047';
          ctx.font = '9px Inter, monospace';
          ctx.fillText('ICEBERG', x + radius + 4, y + 3);
        }
      }

      // Top Alert Banner if Hawkes Cascade in Latest Slice
      const latest = this.timeSlices[this.timeSlices.length - 1];
      if (latest && latest.premQuotes && latest.premQuotes.isShutdown) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(0, 0, w, 28);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(0, 0, w, 28);
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('⚡ HAWKES CASCADE HAZARD (eta >= 0.85) — P.R.E.M. QUOTES WITHDRAWN TO DEFEND AGAINST TOXIC FILL', 16, 18);
      }

      // Price Axis Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`$${this.maxPrice.toFixed(2)}`, w - 8, 14);
      ctx.fillText(`$${this.minPrice.toFixed(2)}`, w - 8, h - 8);
      ctx.textAlign = 'left';
    }
  }

  return BookDepthHeatmap;
}));
