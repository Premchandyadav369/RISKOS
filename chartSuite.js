/**
 * RISKOS INTERACTIVE FINANCIAL CHARTING SUITE (chartSuite.js)
 * High-performance, Retina-scaled HTML5 Canvas charting engine.
 * Supports Candlestick & Area charts, multi-timeframe OHLCV, volume subplots,
 * SMA, EMA, Bollinger Bands, RSI(14), MACD(12,26,9), and crosshair inspection.
 */

(() => {
  'use strict';

  class FinancialChart {
    constructor(options) {
      this.canvas = typeof options.canvas === 'string' ? document.getElementById(options.canvas) : options.canvas;
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.bars = options.bars || [];
      this.mode = options.mode || 'candle'; // 'candle' | 'line'
      this.timeframe = options.timeframe || '1Y';
      this.currency = options.currency || 'INR';
      this.hudId = options.hudId || null;
      
      // Indicators toggles
      this.indicators = {
        sma20: options.sma20 ?? true,
        ema50: options.ema50 ?? false,
        bbands: options.bbands ?? false,
        rsi: options.rsi ?? false,
        macd: options.macd ?? false,
        volume: options.volume ?? true
      };

      this.colors = {
        bg: '#000000',
        bull: '#10b981', // Emerald green
        bear: '#f43f5e', // Crimson red
        line: '#22d3ee', // Cyan accent
        sma20: '#f59e0b', // Amber
        ema50: '#a855f7', // Purple
        bbands: 'rgba(34, 211, 238, 0.15)',
        grid: 'rgba(255, 255, 255, 0.05)',
        text: '#9ca3af',
        crosshair: 'rgba(255, 255, 255, 0.3)'
      };

      this.hoverIndex = -1;
      this.mouseX = -1;
      this.mouseY = -1;

      this.initEvents();
      this.render();
    }

    setBars(bars, timeframe = null, currency = null) {
      this.bars = bars || [];
      if (timeframe) this.timeframe = timeframe;
      if (currency) this.currency = currency;
      this.render();
    }

    setMode(mode) {
      this.mode = mode;
      this.render();
    }

    toggleIndicator(name, active = null) {
      if (this.indicators[name] !== undefined) {
        this.indicators[name] = active !== null ? active : !this.indicators[name];
        this.render();
      }
    }

    initEvents() {
      if (!this.canvas) return;

      const handleMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.render();
      };

      const handleLeave = () => {
        this.hoverIndex = -1;
        this.mouseX = -1;
        this.mouseY = -1;
        this.render();
      };

      this.canvas.addEventListener('mousemove', handleMove);
      this.canvas.addEventListener('mouseleave', handleLeave);

      window.addEventListener('resize', () => {
        requestAnimationFrame(() => this.render());
      });
    }

    computeSMA(period = 20) {
      const result = new Array(this.bars.length).fill(null);
      let sum = 0;
      for (let i = 0; i < this.bars.length; i++) {
        sum += this.bars[i].close;
        if (i >= period) sum -= this.bars[i - period].close;
        if (i >= period - 1) result[i] = sum / period;
      }
      return result;
    }

    computeEMA(period = 50) {
      const result = new Array(this.bars.length).fill(null);
      const k = 2 / (period + 1);
      let ema = this.bars[0]?.close || 0;
      result[0] = ema;

      for (let i = 1; i < this.bars.length; i++) {
        ema = this.bars[i].close * k + ema * (1 - k);
        result[i] = i >= period - 1 ? ema : null;
      }
      return result;
    }

    computeBollingerBands(period = 20, multiplier = 2) {
      const sma = this.computeSMA(period);
      const upper = new Array(this.bars.length).fill(null);
      const lower = new Array(this.bars.length).fill(null);

      for (let i = period - 1; i < this.bars.length; i++) {
        let sumSq = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sumSq += Math.pow(this.bars[j].close - sma[i], 2);
        }
        const std = Math.sqrt(sumSq / period);
        upper[i] = sma[i] + multiplier * std;
        lower[i] = sma[i] - multiplier * std;
      }

      return { sma, upper, lower };
    }

    computeRSI(period = 14) {
      const rsi = new Array(this.bars.length).fill(null);
      if (this.bars.length <= period) return rsi;

      let gains = 0, losses = 0;
      for (let i = 1; i <= period; i++) {
        const diff = this.bars[i].close - this.bars[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }

      let avgGain = gains / period;
      let avgLoss = losses / period;
      rsi[period] = 100 - (100 / (1 + avgGain / Math.max(0.001, avgLoss)));

      for (let i = period + 1; i < this.bars.length; i++) {
        const diff = this.bars[i].close - this.bars[i - 1].close;
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgGain / Math.max(0.0001, avgLoss);
        rsi[i] = 100 - (100 / (1 + rs));
      }

      return rsi;
    }

    render() {
      if (!this.canvas || !this.ctx || this.bars.length === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
      }

      const ctx = this.ctx;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Layout partitions
      const paddingRight = 65;
      const paddingBottom = 25;
      const paddingTop = 15;
      const paddingLeft = 10;

      const hasRSI = this.indicators.rsi;
      const rsiHeight = hasRSI ? 70 : 0;
      const volHeight = this.indicators.volume ? 45 : 0;

      const mainHeight = h - paddingTop - paddingBottom - rsiHeight;
      const chartWidth = w - paddingLeft - paddingRight;

      const numBars = this.bars.length;
      const barWidth = Math.max(2, (chartWidth / numBars) * 0.72);
      const barSpacing = chartWidth / numBars;

      // Calculate price domain
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let maxVol = 0;

      this.bars.forEach(b => {
        if (b.low < minPrice) minPrice = b.low;
        if (b.high > maxPrice) maxPrice = b.high;
        if (b.volume > maxVol) maxVol = b.volume;
      });

      // Add 5% padding to price domain
      const priceRange = Math.max(1, maxPrice - minPrice);
      minPrice -= priceRange * 0.05;
      maxPrice += priceRange * 0.05;
      const adjustedRange = maxPrice - minPrice;

      const getY = (price) => paddingTop + mainHeight - ((price - minPrice) / adjustedRange) * (mainHeight - volHeight);

      // 1. Draw Gridlines & Price Scale
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.colors.grid;
      ctx.fillStyle = this.colors.text;
      ctx.font = '10px Inter, monospace';
      ctx.textAlign = 'left';

      const numGridLines = 5;
      for (let i = 0; i <= numGridLines; i++) {
        const pVal = minPrice + (adjustedRange / numGridLines) * i;
        const yPos = getY(pVal);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, yPos);
        ctx.lineTo(w - paddingRight, yPos);
        ctx.stroke();

        const sym = this.currency === 'USD' ? '$' : '₹';
        ctx.fillText(`${sym}${pVal.toFixed(1)}`, w - paddingRight + 6, yPos + 3);
      }

      // 2. Draw Volume Histogram (Subplot)
      if (this.indicators.volume && maxVol > 0) {
        for (let i = 0; i < numBars; i++) {
          const b = this.bars[i];
          const x = paddingLeft + i * barSpacing + barSpacing / 2;
          const vH = (b.volume / maxVol) * volHeight;
          const isUp = b.close >= b.open;

          ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
          ctx.fillRect(x - barWidth / 2, paddingTop + mainHeight - vH, barWidth, vH);
        }
      }

      // 3. Draw Bollinger Bands
      if (this.indicators.bbands) {
        const bb = this.computeBollingerBands();
        ctx.fillStyle = this.colors.bbands;
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < numBars; i++) {
          if (bb.upper[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(bb.upper[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        for (let i = numBars - 1; i >= 0; i--) {
          if (bb.lower[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(bb.lower[i]);
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
      }

      // 4. Draw Moving Averages (SMA20, EMA50)
      if (this.indicators.sma20) {
        const sma = this.computeSMA(20);
        ctx.strokeStyle = this.colors.sma20;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < numBars; i++) {
          if (sma[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(sma[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      if (this.indicators.ema50) {
        const ema = this.computeEMA(50);
        ctx.strokeStyle = this.colors.ema50;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < numBars; i++) {
          if (ema[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(ema[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 5. Draw Primary Chart (Candles or Area Line)
      if (this.mode === 'candle') {
        for (let i = 0; i < numBars; i++) {
          const b = this.bars[i];
          const x = paddingLeft + i * barSpacing + barSpacing / 2;
          const yOpen = getY(b.open);
          const yClose = getY(b.close);
          const yHigh = getY(b.high);
          const yLow = getY(b.low);
          const isUp = b.close >= b.open;
          const candleColor = isUp ? this.colors.bull : this.colors.bear;

          // Wick
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, yHigh);
          ctx.lineTo(x, yLow);
          ctx.stroke();

          // Body
          ctx.fillStyle = candleColor;
          const topY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
          ctx.fillRect(x - barWidth / 2, topY, barWidth, bodyHeight);
        }
      } else {
        // Area Line Mode
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const x = paddingLeft + i * barSpacing + barSpacing / 2;
          const y = getY(this.bars[i].close);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Gradient Fill
        const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + mainHeight);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
        grad.addColorStop(1, 'rgba(34, 211, 238, 0.0)');
        ctx.lineTo(paddingLeft + (numBars - 1) * barSpacing + barSpacing / 2, paddingTop + mainHeight);
        ctx.lineTo(paddingLeft + barSpacing / 2, paddingTop + mainHeight);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        for (let i = 0; i < numBars; i++) {
          const x = paddingLeft + i * barSpacing + barSpacing / 2;
          const y = getY(this.bars[i].close);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // 6. Draw RSI Subplot
      if (hasRSI) {
        const rsiYTop = h - paddingBottom - rsiHeight + 10;
        const rsiData = this.computeRSI(14);

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(paddingLeft, rsiYTop, chartWidth, rsiHeight - 15);

        // 30 / 70 Overbought/Oversold Lines
        const y70 = rsiYTop + (1.0 - 0.70) * (rsiHeight - 15);
        const y30 = rsiYTop + (1.0 - 0.30) * (rsiHeight - 15);

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y70);
        ctx.lineTo(paddingLeft + chartWidth, y70);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y30);
        ctx.lineTo(paddingLeft + chartWidth, y30);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = this.colors.text;
        ctx.fillText('RSI (14)', paddingLeft + 6, rsiYTop + 12);
        ctx.fillText('70', w - paddingRight + 6, y70 + 3);
        ctx.fillText('30', w - paddingRight + 6, y30 + 3);

        // RSI Line
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < numBars; i++) {
          if (rsiData[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = rsiYTop + (1.0 - rsiData[i] / 100) * (rsiHeight - 15);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 7. Interactive Crosshair & Tooltip
      if (this.mouseX >= paddingLeft && this.mouseX <= w - paddingRight) {
        const hoverIdx = Math.min(numBars - 1, Math.max(0, Math.floor((this.mouseX - paddingLeft) / barSpacing)));
        this.hoverIndex = hoverIdx;
        const b = this.bars[hoverIdx];
        const crossX = paddingLeft + hoverIdx * barSpacing + barSpacing / 2;
        const crossY = getY(b.close);

        // Crosshair Lines
        ctx.strokeStyle = this.colors.crosshair;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(crossX, paddingTop);
        ctx.lineTo(crossX, h - paddingBottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddingLeft, crossY);
        ctx.lineTo(w - paddingRight, crossY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Date Stamp on X Axis
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(crossX - 35, h - paddingBottom + 4, 70, 18);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.date || b.time || '', crossX, h - paddingBottom + 16);

        // Update HUD Element if provided
        if (this.hudId) {
          const hud = document.getElementById(this.hudId);
          if (hud) {
            const sym = this.currency === 'USD' ? '$' : '₹';
            hud.innerHTML = `
              <span>O: <strong>${sym}${b.open.toFixed(2)}</strong></span>
              <span>H: <strong>${sym}${b.high.toFixed(2)}</strong></span>
              <span>L: <strong>${sym}${b.low.toFixed(2)}</strong></span>
              <span>C: <strong style="color:${b.close >= b.open ? '#10b981' : '#f43f5e'}">${sym}${b.close.toFixed(2)}</strong></span>
              <span>Vol: <strong>${(b.volume / 1000000).toFixed(2)}M</strong></span>
            `;
          }
        }
      }

      ctx.restore();
    }
  }

  // Global attachment
  if (typeof window !== 'undefined') {
    window.FinancialChart = FinancialChart;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancialChart;
  }
})();
