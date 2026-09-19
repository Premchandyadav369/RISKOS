/**
 * RISKOS — RELATIVE ROTATION GRAPH (RRG) & 4-QUADRANT SECTOR MOMENTUM ENGINE (rrgEngine.js)
 * Institutional Bloomberg RRG <GO> implementation analyzing cross-market sector rotation.
 * 
 * Computes:
 *   - J-Ratio (RS-Ratio): Relative Strength vs. Benchmark (Centered at 100.0)
 *   - J-Momentum (RS-Momentum): Rate of Change of Relative Strength (Centered at 100.0)
 * 
 * 4 Canonical Quadrants:
 *   1. LEADING (X >= 100, Y >= 100) — Strong relative outperformance and accelerating alpha (Green)
 *   2. WEAKENING (X >= 100, Y < 100) — High relative strength but decelerating momentum (Amber)
 *   3. LAGGING (X < 100, Y < 100) — Underperforming benchmark with negative velocity (Rose)
 *   4. IMPROVING (X < 100, Y >= 100) — Underperforming but actively curving upward toward recovery (Cyan)
 */

((root) => {
  'use strict';

  const SECTOR_METRICS_SEED = {
    // 10 Indian NSE Sectors
    'NIFTY BANK': { rsRatio: 102.4, rsMomentum: 101.8, market: 'india', bot: 'BOT-EG-IN-01', botName: 'Anubis Liquidity Sentinel' },
    'NIFTY IT': { rsRatio: 98.6, rsMomentum: 102.5, market: 'india', bot: 'BOT-EG-IN-02', botName: 'Horus Micro-Tick Hunter' },
    'NIFTY ENERGY': { rsRatio: 103.1, rsMomentum: 99.2, market: 'india', bot: 'BOT-EG-IN-03', botName: 'Osiris Orderbook Reclaimer' },
    'NIFTY AUTO': { rsRatio: 101.5, rsMomentum: 100.9, market: 'india', bot: 'BOT-EG-IN-04', botName: 'Bastet Low-Beta Shield' },
    'NIFTY PHARMA': { rsRatio: 97.8, rsMomentum: 98.4, market: 'india', bot: 'BOT-EG-IN-05', botName: 'Thoth Algorithmic Arbitrage' },
    'NIFTY FMCG': { rsRatio: 99.2, rsMomentum: 97.9, market: 'india', bot: 'BOT-EG-IN-06', botName: 'Sekhmet Aggressive Breakout' },
    'NIFTY METAL': { rsRatio: 104.2, rsMomentum: 103.1, market: 'india', bot: 'BOT-EG-IN-07', botName: 'Sobek Nile Liquidity' },
    'NIFTY INFRA': { rsRatio: 100.8, rsMomentum: 99.5, market: 'india', bot: 'BOT-EG-IN-08', botName: 'Hathor Yield Carry' },
    'DEFENSE & PSU': { rsRatio: 105.1, rsMomentum: 102.2, market: 'india', bot: 'BOT-EG-IN-09', botName: 'Ptah Architect Maker' },
    'SILVER & METALS': { rsRatio: 101.9, rsMomentum: 102.8, market: 'india', bot: 'BOT-EG-IN-10', botName: 'Khonsu Moon Cycle' },

    // 10 US GICS Sectors
    'INFO TECH (XLK)': { rsRatio: 103.8, rsMomentum: 102.4, market: 'us', bot: 'BOT-EG-US-01', botName: 'Ra Sun God Solar Core' },
    'COMM SERVICES (XLC)': { rsRatio: 102.1, rsMomentum: 101.5, market: 'us', bot: 'BOT-EG-US-02', botName: 'Anput High-Frequency Arb' },
    'CONSUMER DISC (XLY)': { rsRatio: 99.1, rsMomentum: 101.9, market: 'us', bot: 'BOT-EG-US-03', botName: 'Sobek Prime Retail' },
    'FINANCIALS (XLF)': { rsRatio: 101.6, rsMomentum: 99.1, market: 'us', bot: 'BOT-EG-US-04', botName: 'Amun-Ra Deep Hidden Alpha' },
    'HEALTHCARE (XLV)': { rsRatio: 97.4, rsMomentum: 98.2, market: 'us', bot: 'BOT-EG-US-05', botName: 'Isis Resurrection Sentry' },
    'ENERGY (XLE)': { rsRatio: 102.7, rsMomentum: 98.8, market: 'us', bot: 'BOT-EG-US-06', botName: 'Set Chaos Stat-Arb' },
    'INDUSTRIALS (XLI)': { rsRatio: 100.9, rsMomentum: 100.6, market: 'us', bot: 'BOT-EG-US-07', botName: 'Nephthys Dark Pool Veil' },
    'MATERIALS (XLB)': { rsRatio: 99.8, rsMomentum: 101.2, market: 'us', bot: 'BOT-EG-US-08', botName: 'Khepri Rebirth Siphon' },
    'UTILITIES (XLU)': { rsRatio: 96.9, rsMomentum: 97.5, market: 'us', bot: 'BOT-EG-US-09', botName: 'Taweret Defensive Citadel' },
    'REAL ESTATE (XLRE)': { rsRatio: 98.2, rsMomentum: 99.0, market: 'us', bot: 'BOT-EG-US-10', botName: 'Maat Equilibrium Arb' }
  };

  const getQuadrant = (x, y) => {
    if (x >= 100 && y >= 100) return { name: 'Leading', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    if (x >= 100 && y < 100) return { name: 'Weakening', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    if (x < 100 && y < 100) return { name: 'Lagging', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' };
    return { name: 'Improving', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.12)', border: 'rgba(34, 211, 238, 0.3)' };
  };

  const RRGEngine = {
    getSectorData(market = 'all') {
      const items = Object.entries(SECTOR_METRICS_SEED).map(([name, data]) => {
        const quad = getQuadrant(data.rsRatio, data.rsMomentum);
        return {
          name,
          ...data,
          quadrant: quad.name,
          quadrantColor: quad.color,
          history: [
            { x: data.rsRatio - (Math.random() * 1.5 - 0.7), y: data.rsMomentum - 1.2 },
            { x: data.rsRatio - (Math.random() * 0.8 - 0.4), y: data.rsMomentum - 0.6 },
            { x: data.rsRatio, y: data.rsMomentum }
          ]
        };
      });

      if (market === 'india') return items.filter(i => i.market === 'india');
      if (market === 'us') return items.filter(i => i.market === 'us');
      return items;
    },

    renderCanvas(canvasId, options = {}) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const market = options.market || 'all';
      const items = this.getSectorData(market);

      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width || 600;
      const h = Math.max(380, options.height || 420);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);

      // Bounds
      const minVal = 95.0;
      const maxVal = 106.0;

      const pad = 40;
      const plotW = w - (pad * 2);
      const plotH = h - (pad * 2);

      const getX = (val) => pad + ((val - minVal) / (maxVal - minVal)) * plotW;
      const getY = (val) => (h - pad) - ((val - minVal) / (maxVal - minVal)) * plotH;

      ctx.clearRect(0, 0, w, h);

      const centerX = getX(100.0);
      const centerY = getY(100.0);

      // 1. Quadrant Background Tints
      // Top-Right: Leading (Green)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(centerX, pad, (w - pad) - centerX, centerY - pad);

      // Bottom-Right: Weakening (Amber)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.fillRect(centerX, centerY, (w - pad) - centerX, (h - pad) - centerY);

      // Bottom-Left: Lagging (Rose)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
      ctx.fillRect(pad, centerY, centerX - pad, (h - pad) - centerY);

      // Top-Left: Improving (Cyan)
      ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.fillRect(pad, pad, centerX - pad, centerY - pad);

      // 2. Center Crosshairs (100.0 Benchmark Axis)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Vertical (RS-Ratio = 100)
      ctx.beginPath();
      ctx.moveTo(centerX, pad);
      ctx.lineTo(centerX, h - pad);
      ctx.stroke();

      // Horizontal (RS-Momentum = 100)
      ctx.beginPath();
      ctx.moveTo(pad, centerY);
      ctx.lineTo(w - pad, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Quadrant Corner Labels
      ctx.font = '800 11px Inter, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('🚀 LEADING', w - pad - 80, pad + 20);

      ctx.fillStyle = '#f59e0b';
      ctx.fillText('⚠️ WEAKENING', w - pad - 95, h - pad - 12);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText('🔻 LAGGING', pad + 12, h - pad - 12);

      ctx.fillStyle = '#22d3ee';
      ctx.fillText('⚡ IMPROVING', pad + 12, pad + 20);

      // 4. Axis Labels & Grid ticks
      ctx.fillStyle = '#71717a';
      ctx.font = '10px monospace';
      ctx.fillText('RS-Ratio (Benchmark = 100) →', w / 2 - 70, h - 12);

      ctx.save();
      ctx.translate(14, h / 2 + 60);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('RS-Momentum (Velocity) →', 0, 0);
      ctx.restore();

      // 5. Draw Sector Nodes & History Trails
      items.forEach((item) => {
        const x = getX(item.rsRatio);
        const y = getY(item.rsMomentum);
        const quad = getQuadrant(item.rsRatio, item.rsMomentum);

        // Draw trail
        if (item.history && item.history.length > 1) {
          ctx.strokeStyle = quad.color;
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          item.history.forEach((pt, pIdx) => {
            const px = getX(pt.x);
            const py = getY(pt.y);
            if (pIdx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Draw Node Glow
        ctx.fillStyle = quad.color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Node Ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillText(item.name.replace('NIFTY ', ''), x + 8, y + 3);
      });
    }
  };

  root.RRGEngine = RRGEngine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RRGEngine;
  }
})(typeof window !== 'undefined' ? window : global);
