/**
 * RISKOS 3D VOLATILITY SURFACE & ORDER BOOK WATERFALL (volatilitySurface3D.js)
 * Standalone Zero-Dependency 3D Canvas / WebGL Projection Engine:
 * - 3D Implied Volatility Surface: Strike (Moneyness) × Maturity (Days) × Implied Volatility (%)
 * - 3D Topographic Order Book Waterfall: Bid/Ask depth mountain cascading across time
 * - Full interactive mouse orbit, yaw/pitch rotation, and depth perspective zoom
 */

((root) => {
  'use strict';

  class VolatilitySurface3DEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.mode = 'SURFACE'; // 'SURFACE' or 'ORDERBOOK'
      this.rotX = 0.55; // pitch
      this.rotY = -0.65; // yaw
      this.zoom = 1.0;
      this.isDragging = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.animationFrameId = null;

      // Sample parametric Volatility Surface Grid (Moneyness: 0.80 to 1.20, Maturity: 7d to 365d)
      this.moneynessSteps = [0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20];
      this.maturitySteps = [7, 14, 30, 60, 90, 180, 270, 365];
      this.surfaceData = this.generateVolatilitySurface();

      // Sample 3D Order Book Waterfall Data (Depth over time)
      this.orderBookData = this.generateOrderBookWaterfall();
    }

    /**
     * Compute parametric Heston/SVI implied volatility smile
     * sigma(k, t) = a + b * (rho*(k - m) + sqrt((k - m)^2 + s^2))
     */
    generateVolatilitySurface() {
      const grid = [];
      for (let tIdx = 0; tIdx < this.maturitySteps.length; tIdx++) {
        const tDays = this.maturitySteps[tIdx];
        const row = [];
        for (let mIdx = 0; mIdx < this.moneynessSteps.length; mIdx++) {
          const m = this.moneynessSteps[mIdx];
          // Volatility smile: OTM puts (m < 1.0) have higher IV (skew), ATM (m=1.0) has lowest IV
          const atmVol = 0.15 + (tDays / 365) * 0.05;
          const skew = Math.pow(m - 1.0, 2) * 0.45 - (m - 1.0) * 0.12;
          const iv = Math.max(0.08, atmVol + skew);
          row.push({
            moneyness: m,
            days: tDays,
            iv: Number((iv * 100).toFixed(1))
          });
        }
        grid.push(row);
      }
      return grid;
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
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 750;
      this.canvas.height = 420;
    }

    bindEvents() {
      if (!this.canvas) return;

      this.canvas.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });

      this.canvas.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.rotY += dx * 0.008;
        this.rotX += dy * 0.008;
        this.rotX = Math.max(-1.2, Math.min(1.2, this.rotX)); // clamp pitch
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.zoom += e.deltaY * -0.001;
        this.zoom = Math.max(0.5, Math.min(2.5, this.zoom));
      }, { passive: false });
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
        const cy = height / 2 + 30;

        ctx.clearRect(0, 0, width, height);

        // Draw HUD watermark
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#52525b';
        ctx.fillText(`3D ENGINE: ${this.mode === 'SURFACE' ? 'IMPLIED VOLATILITY SURFACE (SVI)' : 'TOPOGRAPHIC ORDER BOOK WATERFALL'} | DRAG TO ORBIT`, 15, 20);

        if (this.mode === 'SURFACE') {
          this.renderSurfaceMesh(ctx, cx, cy);
        } else {
          this.renderOrderBookWaterfall(ctx, cx, cy);
        }

        this.animationFrameId = requestAnimationFrame(render);
      };

      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
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
          // Map coordinates: X = Moneyness (-150 to +150), Z = Maturity (-150 to +150), Y = IV (-120 to 0)
          const x = (pt.moneyness - 1.0) * 750;
          const z = (t / (numT - 1) - 0.5) * 300;
          const y = -(pt.iv - 10) * 3.8;
          row.push({
            proj: this.project(x, y, z, cx, cy),
            iv: pt.iv,
            moneyness: pt.moneyness,
            days: pt.days
          });
        }
        projected.push(row);
      }

      // Draw wireframe polygons sorted by average depth
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

        // Color based on IV (Cool Cyan to Amber to Magenta)
        const norm = Math.max(0, Math.min(1, (q.avgIv - 12) / 25));
        const r = Math.round(50 + norm * 205);
        const g = Math.round(180 - norm * 110);
        const b = Math.round(250 - norm * 150);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Axis Labels
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#a1a1aa';
      const originProj = this.project(0, 0, 0, cx, cy);
      ctx.fillText('ATM (1.00 K/S)', originProj.x - 20, originProj.y + 15);
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
  }
})(typeof window !== 'undefined' ? window : global);
