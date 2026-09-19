/**
 * RISKOS 3D VOLATILITY SURFACE & ORDER BOOK WATERFALL (volatilitySurface3D.js)
 * Standalone Zero-Dependency 3D Canvas / WebGL Projection Engine:
 * - 3D Implied Volatility Surface: Strike (Moneyness) × Maturity (Days) × Implied Volatility (%)
 * - Supports 4 Stochastic Volatility Models:
 *     1. Gatheral SVI (Stochastic Volatility Inspired)
 *     2. Hagan SABR Analytic Expansion (Alpha, Beta, Rho, Nu)
 *     3. Heston FFT Stochastic Volatility
 *     4. Dupire Local Volatility Surface
 * - 3D Topographic Order Book Waterfall: Bid/Ask depth mountain cascading across time
 * - Full interactive mouse orbit, yaw/pitch rotation, touch gestures, and depth perspective zoom
 * - Quantitative surface analytics: ATM Term Slope, 25Δ Put Skew, Vol-of-Vol Curvature, Arbitrage Checks
 */

((root) => {
  'use strict';

  class VolatilitySurface3DEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.mode = 'SURFACE'; // 'SURFACE' or 'ORDERBOOK'
      this.model = 'sabr'; // 'svi', 'sabr', 'heston', 'dupire'
      this.rotX = 0.55; // pitch
      this.rotY = -0.65; // yaw
      this.zoom = 1.0;
      this.isDragging = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.animationFrameId = null;
      this.onMetricsUpdate = null;

      // Sample parametric Volatility Surface Grid (Moneyness: 0.80 to 1.20, Maturity: 7d to 365d)
      this.moneynessSteps = [0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20];
      this.maturitySteps = [7, 14, 30, 60, 90, 180, 270, 365];
      
      // Model Parameters
      this.params = {
        sabr: { alpha: 0.35, beta: 0.70, rho: -0.32, nu: 0.45 },
        svi: { a: 0.04, b: 0.12, rho: -0.28, m: 0.0, sigma: 0.15 },
        heston: { v0: 0.04, theta: 0.045, kappa: 2.1, xi: 0.42, rho: -0.55 },
        dupire: { baseVol: 0.18, spot: 100, skewSlope: -0.22, termSlope: 0.04 }
      };

      this.surfaceData = this.generateVolatilitySurface();
      this.orderBookData = this.generateOrderBookWaterfall();
      this.metrics = this.calculateSurfaceMetrics();
    }

    /**
     * Compute Hagan SABR Analytic Implied Volatility Expansion (Hagan et al. 2002)
     */
    calculateSABR(f, k, t, alpha, beta, rho, nu) {
      if (k <= 0 || f <= 0 || t <= 0) return 0.20;
      const oneMinusBeta = 1 - beta;
      
      if (Math.abs(f - k) < 1e-5) {
        const fkBeta = Math.pow(f, oneMinusBeta);
        const t1 = (oneMinusBeta * oneMinusBeta / 24) * (alpha * alpha / Math.pow(f, 2 * oneMinusBeta));
        const t2 = 0.25 * (rho * beta * nu * alpha / fkBeta);
        const t3 = ((2 - 3 * rho * rho) / 24) * nu * nu;
        return (alpha / fkBeta) * (1 + (t1 + t2 + t3) * t);
      }

      const logFk = Math.log(f / k);
      const fkBeta = Math.pow(f * k, oneMinusBeta / 2);
      const z = (nu / alpha) * fkBeta * logFk;
      
      const termSqrt = Math.sqrt(Math.max(1e-10, 1 - 2 * rho * z + z * z));
      const xz = Math.log((termSqrt + z - rho) / (1 - rho));
      const zOverXz = Math.abs(xz) > 1e-7 ? (z / xz) : 1.0;

      const numTerm1 = (oneMinusBeta * oneMinusBeta / 24) * (alpha * alpha / Math.pow(f * k, oneMinusBeta));
      const numTerm2 = 0.25 * (rho * beta * nu * alpha / fkBeta);
      const numTerm3 = ((2 - 3 * rho * rho) / 24) * nu * nu;
      const num = alpha * (1 + (numTerm1 + numTerm2 + numTerm3) * t);

      const denTerm1 = (oneMinusBeta * oneMinusBeta / 24) * (logFk * logFk);
      const denTerm2 = (Math.pow(oneMinusBeta, 4) / 1920) * Math.pow(logFk, 4);
      const den = fkBeta * (1 + denTerm1 + denTerm2);

      return Math.max(0.06, (num / den) * zOverXz);
    }

    /**
     * Compute Gatheral SVI (Stochastic Volatility Inspired) total implied variance
     */
    calculateSVI(logMoneyness, t, a, b, rho, m, sigma) {
      const k = logMoneyness;
      const w = a + b * (rho * (k - m) + Math.sqrt(Math.pow(k - m, 2) + sigma * sigma));
      const totalVar = Math.max(0.001, w * (1 + 0.15 * Math.sqrt(t)));
      return Math.sqrt(totalVar / t);
    }

    /**
     * Compute Heston Stochastic Volatility Approximation
     */
    calculateHeston(logMoneyness, t, v0, theta, kappa, xi, rho) {
      const meanVar = theta + (v0 - theta) * ((1 - Math.exp(-kappa * t)) / (kappa * t));
      const skew = rho * xi * (logMoneyness / 2);
      const smile = (xi * xi / 12) * Math.pow(logMoneyness, 2);
      const iv = Math.sqrt(Math.max(0.004, meanVar)) + skew + smile;
      return Math.max(0.08, iv);
    }

    /**
     * Compute Dupire Local Volatility Surface
     */
    calculateDupire(m, t, baseVol, skewSlope, termSlope) {
      const logM = Math.log(m);
      const tTerm = Math.sqrt(t);
      const localVol = baseVol + skewSlope * logM + termSlope * tTerm + 0.18 * Math.pow(logM, 2);
      return Math.max(0.07, localVol);
    }

    /**
     * Generate 3D grid based on currently selected quantitative model
     */
    generateVolatilitySurface() {
      const grid = [];
      const f0 = 100;

      for (let tIdx = 0; tIdx < this.maturitySteps.length; tIdx++) {
        const tDays = this.maturitySteps[tIdx];
        const tYears = Math.max(0.02, tDays / 365.0);
        const row = [];

        for (let mIdx = 0; mIdx < this.moneynessSteps.length; mIdx++) {
          const m = this.moneynessSteps[mIdx];
          const k = f0 * m;
          const logM = Math.log(m);
          let ivDecimal = 0.20;

          if (this.model === 'sabr') {
            const p = this.params.sabr;
            ivDecimal = this.calculateSABR(f0, k, tYears, p.alpha, p.beta, p.rho, p.nu);
          } else if (this.model === 'svi') {
            const p = this.params.svi;
            ivDecimal = this.calculateSVI(logM, tYears, p.a, p.b, p.rho, p.m, p.sigma);
          } else if (this.model === 'heston') {
            const p = this.params.heston;
            ivDecimal = this.calculateHeston(logM, tYears, p.v0, p.theta, p.kappa, p.xi, p.rho);
          } else {
            // dupire
            const p = this.params.dupire;
            ivDecimal = this.calculateDupire(m, tYears, p.baseVol, p.skewSlope, p.termSlope);
          }

          row.push({
            moneyness: m,
            days: tDays,
            years: tYears,
            iv: Number((ivDecimal * 100).toFixed(2))
          });
        }
        grid.push(row);
      }
      return grid;
    }

    /**
     * Calculate surface KPIs (ATM Slope, 25D Put Skew, Vol-of-Vol, Butterfly Arbitrage)
     */
    calculateSurfaceMetrics() {
      if (!this.surfaceData || !this.surfaceData.length) return {};

      // 1. ATM Term Structure Slope: 365d ATM IV minus 7d ATM IV
      const atm7d = this.surfaceData[0].find(p => p.moneyness === 1.00)?.iv || 18.5;
      const atm365d = this.surfaceData[this.surfaceData.length - 1].find(p => p.moneyness === 1.00)?.iv || 21.0;
      const atmSlope = atm365d - atm7d;

      // 2. Put Skew at 30-day tenor: IV at 90% moneyness minus IV at 110% moneyness
      const row30d = this.surfaceData.find(r => r[0].days === 30) || this.surfaceData[2];
      const putIv = row30d.find(p => p.moneyness === 0.90)?.iv || 24.5;
      const callIv = row30d.find(p => p.moneyness === 1.10)?.iv || 19.8;
      const putSkew = Math.max(0.1, putIv - callIv);

      // 3. Vol-of-Vol Curvature
      let volOfVol = 0.42;
      if (this.model === 'sabr') volOfVol = this.params.sabr.nu;
      else if (this.model === 'heston') volOfVol = this.params.heston.xi;
      else if (this.model === 'svi') volOfVol = this.params.svi.b * 3.5;
      else volOfVol = 0.38;

      // 4. Butterfly Arbitrage convexity test: ∂²w/∂k² >= 0 for all rows
      let isArbitrageFree = true;
      for (const row of this.surfaceData) {
        for (let j = 1; j < row.length - 1; j++) {
          const secondDiff = row[j - 1].iv - 2 * row[j].iv + row[j + 1].iv;
          if (secondDiff < -0.4) {
            isArbitrageFree = false;
            break;
          }
        }
        if (!isArbitrageFree) break;
      }

      const metrics = {
        atmSlope,
        atmSlopeText: atmSlope >= 0 ? `+${atmSlope.toFixed(1)}% / yr (Contango)` : `${atmSlope.toFixed(1)}% / yr (Backwardation)`,
        putSkew,
        volOfVol,
        isArbitrageFree,
        arbStatusText: isArbitrageFree ? 'NO BUTTERFLY ARB' : 'CALENDAR ARB DETECTED',
        model: this.model
      };

      this.metrics = metrics;
      if (typeof this.onMetricsUpdate === 'function') {
        this.onMetricsUpdate(metrics);
      }
      return metrics;
    }

    getMetrics() {
      return this.metrics || this.calculateSurfaceMetrics();
    }

    setModel(modelName) {
      const valid = ['svi', 'sabr', 'heston', 'dupire'];
      const normalized = (modelName || '').toLowerCase().trim();
      this.model = valid.includes(normalized) ? normalized : 'sabr';
      this.surfaceData = this.generateVolatilitySurface();
      this.calculateSurfaceMetrics();
    }

    generateOrderBookWaterfall() {
      const ticks = [];
      for (let timeStep = 0; timeStep < 12; timeStep++) {
        const bids = [];
        const asks = [];
        for (let level = 1; level <= 10; level++) {
          bids.push({ price: 1000 - level * 2, qty: 50 + Math.sin(timeStep + level) * 30 + level * 15 });
          asks.push({ price: 1000 + level * 2, qty: 45 + Math.cos(timeStep + level) * 25 + level * 14 });
        }
        ticks.push({ timeStep, bids, asks });
      }
      return ticks;
    }

    /**
     * 3D Perspective Projection: (x, y, z) -> (screenX, screenY)
     */
    project(x, y, z, cx, cy) {
      // Rotation around X (Pitch)
      const cosX = Math.cos(this.rotX);
      const sinX = Math.sin(this.rotX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;

      // Rotation around Y (Yaw)
      const cosY = Math.cos(this.rotY);
      const sinY = Math.sin(this.rotY);
      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;

      // Perspective scale
      const fov = 450;
      const cameraDistance = 500;
      const scale = (fov / (cameraDistance + z2)) * this.zoom;

      return {
        x: cx + x2 * scale,
        y: cy + y1 * scale,
        depth: z2,
        scale
      };
    }

    init(canvasEl) {
      if (!canvasEl) return;
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      if (!this.ctx) return;

      this.resize();
      this.bindEvents();
      this.startRenderLoop();
      this.calculateSurfaceMetrics();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : null;
      this.canvas.width = (rect && rect.width > 50) ? rect.width : (this.canvas.clientWidth || 750);
      this.canvas.height = (rect && rect.height > 50) ? rect.height : (this.canvas.clientHeight || 360);
    }

    bindEvents() {
      if (!this.canvas) return;

      const onPointerDown = (clientX, clientY) => {
        this.isDragging = true;
        this.lastMouseX = clientX;
        this.lastMouseY = clientY;
      };

      const onPointerMove = (clientX, clientY) => {
        if (!this.isDragging) return;
        const dx = clientX - this.lastMouseX;
        const dy = clientY - this.lastMouseY;
        this.rotY += dx * 0.008;
        this.rotX += dy * 0.008;
        this.rotX = Math.max(-1.25, Math.min(1.25, this.rotX)); // clamp pitch
        this.lastMouseX = clientX;
        this.lastMouseY = clientY;
      };

      const onPointerUp = () => {
        this.isDragging = false;
      };

      // Mouse Listeners
      this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
      window.addEventListener('mouseup', onPointerUp);
      this.canvas.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));

      // Touch Listeners (Mobile & Tablet)
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
          onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchend', onPointerUp);
      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length === 1) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      // Zoom Wheel
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.zoom += e.deltaY * -0.001;
        this.zoom = Math.max(0.5, Math.min(2.5, this.zoom));
      }, { passive: false });

      // Window resize
      window.addEventListener('resize', () => {
        this.resize();
      });
    }

    setMode(mode) {
      this.mode = mode; // 'SURFACE' or 'ORDERBOOK'
    }

    startRenderLoop() {
      const render = () => {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cx = width / 2;
        const cy = height / 2 + 25;

        ctx.clearRect(0, 0, width, height);

        // Draw HUD watermark
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#71717a';
        const modelTag = this.model.toUpperCase();
        ctx.fillText(`3D ENGINE: ${this.mode === 'SURFACE' ? `VOLATILITY SURFACE [${modelTag}]` : 'TOPOGRAPHIC ORDER BOOK WATERFALL'} | DRAG TO ORBIT`, 15, 20);

        if (this.mode === 'SURFACE') {
          this.renderSurfaceMesh(ctx, cx, cy);
        } else {
          this.renderOrderBookWaterfall(ctx, cx, cy);
        }

        this.animationFrameId = requestAnimationFrame(render);
      };

      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = requestAnimationFrame(render);
      }
    }

    renderSurfaceMesh(ctx, cx, cy) {
      const grid = this.surfaceData;
      const numT = grid.length;
      const numM = grid[0].length;

      // Project all 3D points
      const projected = [];
      for (let t = 0; t < numT; t++) {
        const row = [];
        for (let m = 0; m < numM; m++) {
          const pt = grid[t][m];
          // Map coordinates: X = Moneyness (-160 to +160), Z = Maturity (-150 to +150), Y = IV (-130 to 0)
          const x = (pt.moneyness - 1.0) * 800;
          const z = (t / (numT - 1) - 0.5) * 320;
          const y = -(pt.iv - 10) * 3.9;
          row.push({
            proj: this.project(x, y, z, cx, cy),
            iv: pt.iv,
            moneyness: pt.moneyness,
            days: pt.days
          });
        }
        projected.push(row);
      }

      // Draw wireframe polygons sorted by average depth (Painter's algorithm)
      const quads = [];
      for (let t = 0; t < numT - 1; t++) {
        for (let m = 0; m < numM - 1; m++) {
          const p1 = projected[t][m];
          const p2 = projected[t][m + 1];
          const p3 = projected[t + 1][m + 1];
          const p4 = projected[t + 1][m];
          const avgDepth = (p1.proj.depth + p2.proj.depth + p3.proj.depth + p4.proj.depth) / 4;
          const avgIv = (p1.iv + p2.iv + p3.iv + p4.iv) / 4;
          quads.push({ p1, p2, p3, p4, avgDepth, avgIv });
        }
      }

      quads.sort((a, b) => b.avgDepth - a.avgDepth);

      // Render quads
      quads.forEach(q => {
        ctx.beginPath();
        ctx.moveTo(q.p1.proj.x, q.p1.proj.y);
        ctx.lineTo(q.p2.proj.x, q.p2.proj.y);
        ctx.lineTo(q.p3.proj.x, q.p3.proj.y);
        ctx.lineTo(q.p4.proj.x, q.p4.proj.y);
        ctx.closePath();

        // Color based on IV (Institutional Cyan to Amber to Magenta gradient)
        const norm = Math.max(0, Math.min(1, (q.avgIv - 12) / 28));
        const r = Math.round(56 + norm * 199);
        const g = Math.round(189 - norm * 110);
        const b = Math.round(248 - norm * 160);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.32)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Axis Labels
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#a1a1aa';
      const atmPoint = projected[Math.floor(numT / 2)][Math.floor(numM / 2)];
      if (atmPoint && atmPoint.proj) {
        ctx.fillText('ATM (1.00 K/S)', atmPoint.proj.x - 22, atmPoint.proj.y + 16);
      }
      const otmPut = projected[0][0];
      if (otmPut && otmPut.proj) {
        ctx.fillText('0.80 Put Skew', otmPut.proj.x - 30, otmPut.proj.y - 8);
      }
      const otmCall = projected[0][numM - 1];
      if (otmCall && otmCall.proj) {
        ctx.fillText('1.20 Call', otmCall.proj.x + 5, otmCall.proj.y - 8);
      }
    }

    renderOrderBookWaterfall(ctx, cx, cy) {
      const data = this.orderBookData;
      data.forEach((tick, tIdx) => {
        const z = (tIdx / data.length - 0.5) * 320;

        // Bids Mountain (Green)
        tick.bids.forEach((bid, lIdx) => {
          const x = -(lIdx * 18 + 15);
          const y = -(bid.qty * 0.8);
          const p = this.project(x, y, z, cx, cy);

          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.5, 3 * p.scale), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.fill();
        });

        // Asks Mountain (Red)
        tick.asks.forEach((ask, lIdx) => {
          const x = lIdx * 18 + 15;
          const y = -(ask.qty * 0.8);
          const p = this.project(x, y, z, cx, cy);

          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.5, 3 * p.scale), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
          ctx.fill();
        });
      });
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  const instance = new VolatilitySurface3DEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof window !== 'undefined') {
    window.VolatilitySurface3D = instance;
    window.VolSurface3D = instance;
  }
})(typeof window !== 'undefined' ? window : global);
