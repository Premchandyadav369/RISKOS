/**
 * RISKOS INTERACTIVE FINANCIAL CHARTING SUITE (chartSuite.js)
 * High-performance, Retina-scaled HTML5 Canvas charting engine.
 * Supports Candlestick & Area charts, multi-timeframe OHLCV, volume subplots,
 * SMA, EMA, Bollinger Bands, RSI(14), MACD(12,26,9), crosshair inspection,
 * mousewheel zoom, click-and-drag pan, touch pinch-to-zoom, and interactive zoom toolbar.
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
        crosshair: 'rgba(255, 255, 255, 0.35)',
        toolbarBg: 'rgba(14, 15, 22, 0.85)',
        toolbarBorder: 'rgba(255, 255, 255, 0.15)',
        toolbarText: '#e4e4e7',
        toolbarHover: '#22d3ee'
      };

      // Zoom & Pan State
      this.visibleBarsCount = options.visibleBarsCount || Math.min(this.bars.length, 50);
      this.panOffset = 0; // 0 = rightmost / newest candles, >0 = earlier into history
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartPan = 0;
      this.touchStartDist = 0;
      this.touchStartBars = 0;

      // Mouse & Crosshair
      this.hoverIndex = -1;
      this.mouseX = -1;
      this.mouseY = -1;

      // Floating Toolbar Hitboxes
      this.toolbarButtons = [];

      this.initEvents();
      this.render();
    }

    setBars(bars, timeframe = null, currency = null) {
      this.bars = bars || [];
      if (timeframe) this.timeframe = timeframe;
      if (currency) this.currency = currency;
      this.visibleBarsCount = Math.min(this.bars.length, Math.max(15, this.visibleBarsCount || 50));
      this.panOffset = 0;
      this.render();
    }

    setMode(mode) {
      this.mode = mode;
      this.render();
    }

    updateLiveTick(price, volume = 0) {
      if (!this.bars || this.bars.length === 0) return;
      const last = this.bars[this.bars.length - 1];
      const p = Number(price);
      last.close = p;
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      if (volume) last.volume += Number(volume);
      this.render();
    }

    toggleIndicator(name, active = null) {
      if (this.indicators[name] !== undefined) {
        this.indicators[name] = active !== null ? active : !this.indicators[name];
        this.render();
      }
    }

    zoomIn() {
      if (this.bars.length === 0) return;
      const step = Math.max(2, Math.round(this.visibleBarsCount * 0.25));
      this.visibleBarsCount = Math.max(10, this.visibleBarsCount - step);
      this.panOffset = Math.max(0, Math.min(this.bars.length - this.visibleBarsCount, this.panOffset));
      this.render();
    }

    zoomOut() {
      if (this.bars.length === 0) return;
      const step = Math.max(2, Math.round(this.visibleBarsCount * 0.3));
      this.visibleBarsCount = Math.min(this.bars.length, this.visibleBarsCount + step);
      this.panOffset = Math.max(0, Math.min(this.bars.length - this.visibleBarsCount, this.panOffset));
      this.render();
    }

    resetZoom() {
      this.visibleBarsCount = Math.min(this.bars.length, 50);
      this.panOffset = 0;
      this.render();
    }

    handleToolbarClick(clientX, clientY) {
      if (!this.canvas) return false;
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      for (const btn of this.toolbarButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          if (btn.action === 'zoomIn') this.zoomIn();
          else if (btn.action === 'zoomOut') this.zoomOut();
          else if (btn.action === 'reset') this.resetZoom();
          return true;
        }
      }
      return false;
    }

    initEvents() {
      if (!this.canvas) return;

      // Mouse Move & Drag
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        if (this.isDragging) {
          const deltaX = e.clientX - this.dragStartX;
          const chartW = rect.width - 75;
          const barSpacing = chartW / Math.max(1, this.visibleBarsCount);
          const barsShift = Math.round(deltaX / barSpacing);
          // Dragging right reveals older bars (increases panOffset)
          const maxPan = Math.max(0, this.bars.length - this.visibleBarsCount);
          this.panOffset = Math.max(0, Math.min(maxPan, this.dragStartPan + barsShift));
          this.render();
        } else {
          // Check if hovering over toolbar
          let overBtn = false;
          for (const btn of this.toolbarButtons) {
            if (this.mouseX >= btn.x && this.mouseX <= btn.x + btn.w && this.mouseY >= btn.y && this.mouseY <= btn.y + btn.h) {
              overBtn = true;
              break;
            }
          }
          this.canvas.style.cursor = overBtn ? 'pointer' : 'crosshair';
          this.render();
        }
      });

      // Mouse Down
      this.canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (this.handleToolbarClick(e.clientX, e.clientY)) return;

        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartPan = this.panOffset;
        this.canvas.style.cursor = 'grabbing';
      });

      // Mouse Up / Leave
      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (this.canvas) this.canvas.style.cursor = 'crosshair';
        }
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoverIndex = -1;
        this.mouseX = -1;
        this.mouseY = -1;
        this.render();
      });

      // Mouse Wheel Zoom & Pan (Passive: false to prevent outer scrolling)
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (this.bars.length === 0) return;

        if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
          // Vertical scroll or pinch trackpad -> Zoom In / Out
          const zoomStep = Math.max(2, Math.round(this.visibleBarsCount * 0.12));
          if (e.deltaY < 0) {
            // Zoom in
            this.visibleBarsCount = Math.max(10, this.visibleBarsCount - zoomStep);
          } else {
            // Zoom out
            this.visibleBarsCount = Math.min(this.bars.length, this.visibleBarsCount + zoomStep);
          }
          const maxPan = Math.max(0, this.bars.length - this.visibleBarsCount);
          this.panOffset = Math.max(0, Math.min(maxPan, this.panOffset));
        } else {
          // Horizontal scroll -> Pan Left / Right
          const panStep = Math.sign(e.deltaX) * Math.max(1, Math.round(this.visibleBarsCount * 0.08));
          const maxPan = Math.max(0, this.bars.length - this.visibleBarsCount);
          this.panOffset = Math.max(0, Math.min(maxPan, this.panOffset - panStep));
        }
        this.render();
      }, { passive: false });

      // Touch Events for Mobile & Tablet Devices
      this.canvas.addEventListener('touchstart', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          if (this.handleToolbarClick(touch.clientX, touch.clientY)) return;

          this.isDragging = true;
          this.dragStartX = touch.clientX;
          this.dragStartPan = this.panOffset;
          this.mouseX = touch.clientX - rect.left;
          this.mouseY = touch.clientY - rect.top;
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          this.touchStartDist = Math.hypot(dx, dy);
          this.touchStartBars = this.visibleBarsCount;
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches.length === 1 && this.isDragging) {
          e.preventDefault(); // Stop outer page scroll while panning
          const touch = e.touches[0];
          const deltaX = touch.clientX - this.dragStartX;
          const chartW = rect.width - 75;
          const barSpacing = chartW / Math.max(1, this.visibleBarsCount);
          const barsShift = Math.round(deltaX / barSpacing);
          const maxPan = Math.max(0, this.bars.length - this.visibleBarsCount);
          this.panOffset = Math.max(0, Math.min(maxPan, this.dragStartPan + barsShift));
          this.mouseX = touch.clientX - rect.left;
          this.mouseY = touch.clientY - rect.top;
          this.render();
        } else if (e.touches.length === 2 && this.touchStartDist > 0) {
          e.preventDefault(); // Stop default browser pinch zoom
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const ratio = this.touchStartDist / Math.max(10, dist);
          this.visibleBarsCount = Math.max(10, Math.min(this.bars.length, Math.round(this.touchStartBars * ratio)));
          const maxPan = Math.max(0, this.bars.length - this.visibleBarsCount);
          this.panOffset = Math.max(0, Math.min(maxPan, this.panOffset));
          this.render();
        }
      }, { passive: false });

      this.canvas.addEventListener('touchend', () => {
        this.isDragging = false;
        this.touchStartDist = 0;
      });

      // Window resize
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

      if (w === 0 || h === 0) return;

      if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
      }

      const ctx = this.ctx;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Layout partitions
      const paddingRight = 65;
      const paddingBottom = 26;
      const paddingTop = 32; // extra room for floating zoom toolbar
      const paddingLeft = 10;

      const hasRSI = this.indicators.rsi;
      const rsiHeight = hasRSI ? 70 : 0;
      const volHeight = this.indicators.volume ? 45 : 0;

      const mainHeight = h - paddingTop - paddingBottom - rsiHeight;
      const chartWidth = w - paddingLeft - paddingRight;

      // Calculate Visible Bars Window
      const totalBars = this.bars.length;
      this.visibleBarsCount = Math.max(10, Math.min(totalBars, this.visibleBarsCount || 50));
      const maxPan = Math.max(0, totalBars - this.visibleBarsCount);
      this.panOffset = Math.max(0, Math.min(maxPan, this.panOffset || 0));

      const endIdx = totalBars - this.panOffset;
      const startIdx = Math.max(0, endIdx - this.visibleBarsCount);
      const visibleBars = this.bars.slice(startIdx, endIdx);
      const numBars = visibleBars.length;

      if (numBars === 0) {
        ctx.restore();
        return;
      }

      const barSpacing = chartWidth / numBars;
      const barWidth = Math.max(2, barSpacing * 0.72);

      // Calculate Technical Indicators on full bars and slice to visible window
      const fullSMA = this.indicators.sma20 ? this.computeSMA(20) : null;
      const fullEMA = this.indicators.ema50 ? this.computeEMA(50) : null;
      const fullBB = this.indicators.bbands ? this.computeBollingerBands(20, 2) : null;
      const fullRSI = this.indicators.rsi ? this.computeRSI(14) : null;

      const smaSlice = fullSMA ? fullSMA.slice(startIdx, endIdx) : null;
      const emaSlice = fullEMA ? fullEMA.slice(startIdx, endIdx) : null;
      const bbUpper = fullBB ? fullBB.upper.slice(startIdx, endIdx) : null;
      const bbLower = fullBB ? fullBB.lower.slice(startIdx, endIdx) : null;
      const rsiSlice = fullRSI ? fullRSI.slice(startIdx, endIdx) : null;

      // Price Domain calculated dynamically on VISIBLE bars for perfect vertical scaling
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let maxVol = 0;

      visibleBars.forEach((b, i) => {
        if (b.low < minPrice) minPrice = b.low;
        if (b.high > maxPrice) maxPrice = b.high;
        if (b.volume > maxVol) maxVol = b.volume;
        if (bbUpper && bbUpper[i] !== null && bbUpper[i] > maxPrice) maxPrice = bbUpper[i];
        if (bbLower && bbLower[i] !== null && bbLower[i] < minPrice) minPrice = bbLower[i];
      });

      if (minPrice === Infinity || maxPrice === -Infinity) {
        minPrice = 100;
        maxPrice = 200;
      }

      // Add 4% padding to price domain
      const priceRange = Math.max(0.01, maxPrice - minPrice);
      minPrice -= priceRange * 0.04;
      maxPrice += priceRange * 0.04;
      const adjustedRange = maxPrice - minPrice;

      const getY = (price) => paddingTop + mainHeight - ((price - minPrice) / adjustedRange) * (mainHeight - volHeight);

      // 1. Draw Gridlines & Dynamic Price Scale
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
          const b = visibleBars[i];
          const x = paddingLeft + i * barSpacing + barSpacing / 2;
          const vH = (b.volume / maxVol) * volHeight;
          const isUp = b.close >= b.open;

          ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
          ctx.fillRect(x - barWidth / 2, paddingTop + mainHeight - vH, barWidth, vH);
        }
      }

      // 3. Draw Bollinger Bands
      if (this.indicators.bbands && bbUpper && bbLower) {
        ctx.fillStyle = this.colors.bbands;
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < numBars; i++) {
          if (bbUpper[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(bbUpper[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        for (let i = numBars - 1; i >= 0; i--) {
          if (bbLower[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(bbLower[i]);
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
      }

      // 4. Draw Moving Averages (SMA20, EMA50)
      if (this.indicators.sma20 && smaSlice) {
        ctx.strokeStyle = this.colors.sma20;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < numBars; i++) {
          if (smaSlice[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(smaSlice[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      if (this.indicators.ema50 && emaSlice) {
        ctx.strokeStyle = this.colors.ema50;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < numBars; i++) {
          if (emaSlice[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = getY(emaSlice[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 5. Draw Primary Chart (Candles or Area Line)
      if (this.mode === 'candle') {
        for (let i = 0; i < numBars; i++) {
          const b = visibleBars[i];
          const x = paddingLeft + i * barSpacing + barSpacing / 2;
          const yOpen = getY(b.open);
          const yClose = getY(b.close);
          const yHigh = getY(b.high);
          const yLow = getY(b.low);
          const isUp = b.close >= b.open;
          const candleColor = isUp ? this.colors.bull : this.colors.bear;

          // Wick
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = Math.max(1, Math.min(2, barWidth * 0.18));
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
          const y = getY(visibleBars[i].close);
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
          const y = getY(visibleBars[i].close);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // 6. Draw RSI Subplot
      if (hasRSI && rsiSlice) {
        const rsiYTop = h - paddingBottom - rsiHeight + 10;

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(paddingLeft, rsiYTop, chartWidth, rsiHeight - 15);

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

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < numBars; i++) {
          if (rsiSlice[i] !== null) {
            const x = paddingLeft + i * barSpacing + barSpacing / 2;
            const y = rsiYTop + (1.0 - rsiSlice[i] / 100) * (rsiHeight - 15);
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
        const b = visibleBars[hoverIdx];
        if (b) {
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
      }

      // 8. Floating Institutional Zoom / Pan Controls Toolbar
      this.toolbarButtons = [];
      const tbY = 6;
      const tbHeight = 22;
      let tbX = paddingLeft + 4;

      // Status Badge (Viewing N / Total Bars)
      const zoomRatio = (totalBars / numBars).toFixed(1);
      const panText = this.panOffset > 0 ? ` ◀ History (-${this.panOffset})` : ' ● Live';
      const statusText = `${numBars}/${totalBars} Bars (${zoomRatio}x)${panText}`;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const statusWidth = ctx.measureText(statusText).width + 16;
      ctx.beginPath();
      ctx.roundRect(tbX, tbY, statusWidth, tbHeight, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '600 10px Inter, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(statusText, tbX + 8, tbY + 15);

      tbX += statusWidth + 8;

      // Button: Zoom In [+]
      const btnInWidth = 24;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(tbX, tbY, btnInWidth, tbHeight, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', tbX + btnInWidth / 2, tbY + 16);
      this.toolbarButtons.push({ id: 'zoomIn', action: 'zoomIn', x: tbX, y: tbY, w: btnInWidth, h: tbHeight });

      tbX += btnInWidth + 4;

      // Button: Zoom Out [-]
      const btnOutWidth = 24;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(tbX, tbY, btnOutWidth, tbHeight, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('−', tbX + btnOutWidth / 2, tbY + 15);
      this.toolbarButtons.push({ id: 'zoomOut', action: 'zoomOut', x: tbX, y: tbY, w: btnOutWidth, h: tbHeight });

      tbX += btnOutWidth + 4;

      // Button: Reset Zoom [↺ Reset]
      const btnResetWidth = 52;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.beginPath();
      ctx.roundRect(tbX, tbY, btnResetWidth, tbHeight, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↺ Reset', tbX + btnResetWidth / 2, tbY + 15);
      this.toolbarButtons.push({ id: 'reset', action: 'reset', x: tbX, y: tbY, w: btnResetWidth, h: tbHeight });

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
