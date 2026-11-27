/**
 * RISKOS — DYNAMIC CORRELATION BREAKDOWN & CONTAGION RADAR (correlationContagionRadar.js)
 * Institutional multi-asset systemic contagion tracking across rolling 60-day vs 252-day correlation matrices.
 * Calculates exact Fisher Z-transform divergence z = (Z_60 - Z_252) / SE and pulses red when |z| > 2σ.
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CorrelationContagionRadar = factory();
    if (typeof window !== 'undefined') {
      window.correlationContagionRadar = new root.CorrelationContagionRadar.ContagionRadarEngine();
    }
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  const CROSS_ASSET_PAIRS = [
    {
      id: 'BTC_SPY',
      pair: 'BTC / SPY',
      name: 'Digital Assets vs Equity Risk',
      rho252: 0.32,
      rho60: 0.74,
      significance: 'Crypto macro coupling with equities increases systemic drawdown contagion.',
      recommendation: 'Rotate into short delta or purchase VIX call wings.'
    },
    {
      id: 'SPY_TLT',
      pair: 'SPY / TLT',
      name: 'Equities vs Long-Term Treasuries',
      rho252: -0.38,
      rho60: 0.28,
      significance: 'Stock-Bond diversification hedge has inverted due to inflation regime shifts.',
      recommendation: 'Replace TLT duration with Gold (GLD) and CTA Managed Futures.'
    },
    {
      id: 'GLD_USO',
      pair: 'GLD / USO',
      name: 'Gold vs Crude Oil (Energy)',
      rho252: 0.12,
      rho60: -0.42,
      significance: 'Geopolitical flight to safety decouples bullion from industrial demand.',
      recommendation: 'Overweight physical gold basis carry; hedge oil beta with crack spreads.'
    },
    {
      id: 'ETH_BTC',
      pair: 'ETH / BTC',
      name: 'Altcoin Beta vs Bitcoin Dominance',
      rho252: 0.82,
      rho60: 0.46,
      significance: 'DeFi capital flight into BTC reserve dominance amid regulatory scrutiny.',
      recommendation: 'Long BTC / Short ETH pairs trade to harvest spread divergence.'
    },
    {
      id: 'NIFTY_USDINR',
      pair: 'NIFTY / USDINR',
      name: 'Indian Equities vs Rupee FX',
      rho252: -0.45,
      rho60: -0.08,
      significance: 'FII dollar outflows slowing down as domestic DII liquidity absorbs selling.',
      recommendation: 'Maintain unhedged INR export-heavy IT & Pharma baskets.'
    },
    {
      id: 'HYG_SPY',
      pair: 'HYG / SPY',
      name: 'High-Yield Credit vs S&P 500',
      rho252: 0.76,
      rho60: 0.22,
      significance: 'Credit spread widening precedes equity repricing (leading distress indicator).',
      recommendation: 'De-risk levered balance sheets; buy HYG put protection.'
    }
  ];

  class ContagionRadarEngine {
    constructor(options = {}) {
      this.pairs = options.pairs || CROSS_ASSET_PAIRS;
      this.nShort = options.nShort || 60;
      this.nLong = options.nLong || 252;
      this.seDelta = Math.sqrt((1.0 / (this.nShort - 3)) + (1.0 / (this.nLong - 3))); // ~0.1468
    }

    /**
     * Fisher Z-Transformation: Z(r) = 0.5 * ln((1 + r) / (1 - r))
     */
    static fisherZ(r) {
      const clamped = Math.max(-0.9999, Math.min(0.9999, r));
      return 0.5 * Math.log((1 + clamped) / (1 - clamped));
    }

    /**
     * Computes the statistical divergence z-score between rolling 60d and 252d correlation.
     */
    calculateZScore(rhoShort, rhoLong) {
      const zShort = ContagionRadarEngine.fisherZ(rhoShort);
      const zLong = ContagionRadarEngine.fisherZ(rhoLong);
      return +((zShort - zLong) / this.seDelta).toFixed(2);
    }

    /**
     * Analyzes all pairs and returns contagion metrics, breakdown flags, and systemic score.
     */
    evaluateMatrix() {
      let breakdownCount = 0;
      let totalAbsZ = 0;

      const evaluations = this.pairs.map(p => {
        const zScore = this.calculateZScore(p.rho60, p.rho252);
        const absZ = Math.abs(zScore);
        const isBreakdown = absZ >= 2.0; // Statistically significant dislocation (|z| > 2.0σ)
        const status = isBreakdown ? 'CRITICAL_BREAKDOWN' : (absZ >= 1.2 ? 'DISLOCATING' : 'NORMAL');

        if (isBreakdown) breakdownCount++;
        totalAbsZ += absZ;

        return {
          id: p.id,
          pair: p.pair,
          name: p.name,
          rho252: p.rho252,
          rho60: p.rho60,
          deltaRho: +(p.rho60 - p.rho252).toFixed(2),
          zScore: zScore,
          absZ: absZ,
          isBreakdown: isBreakdown,
          status: status,
          significance: p.significance,
          recommendation: p.recommendation
        };
      });

      // Systemic Contagion Risk Score (0 - 100)
      const avgZ = totalAbsZ / this.pairs.length;
      const contagionIndex = Math.min(100, Math.round((avgZ / 2.5) * 100));

      return {
        evaluations,
        breakdownCount,
        totalPairs: this.pairs.length,
        contagionIndex,
        isAlertActive: breakdownCount > 0,
        seDelta: +this.seDelta.toFixed(4)
      };
    }

    renderHTMLComponent(containerId) {
      if (typeof document === 'undefined') return;
      const container = document.getElementById(containerId);
      if (!container) return;

      const analysis = this.evaluateMatrix();
      const canvasId = `contagionRadarCanvas_${Math.random().toString(36).substr(2, 6)}`;

      container.innerHTML = `
        <div class="contagion-radar-card" style="background:#080a0f; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:18px; color:#fff; font-family:Inter, sans-serif;">
          <!-- Top Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
            <div>
              <span style="font-size:0.95rem; font-weight:800; color:#fff; letter-spacing:0.5px;">📡 DYNAMIC CORRELATION BREAKDOWN & CONTAGION RADAR</span>
              <span style="background:${analysis.isAlertActive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; border:1px solid ${analysis.isAlertActive ? '#ef4444' : '#10b981'}; color:${analysis.isAlertActive ? '#ef4444' : '#10b981'}; font-size:0.65rem; font-weight:800; padding:2px 7px; border-radius:4px; margin-left:8px;">
                ${analysis.isAlertActive ? `⚠️ ${analysis.breakdownCount} BREAKDOWN(S) DETECTED (|z| > 2σ)` : 'NORMAL HARMONIC'}
              </span>
            </div>
            <div style="font-family:monospace; font-size:0.75rem; color:#a1a1aa;">
              Systemic Contagion: <strong style="color:${analysis.contagionIndex > 60 ? '#ef4444' : (analysis.contagionIndex > 35 ? '#ffb000' : '#10b981')}; font-size:0.95rem;">${analysis.contagionIndex} / 100</strong>
            </div>
          </div>

          <!-- Radar Canvas & Breakdown Table Grid -->
          <div style="display:grid; grid-template-columns: 240px 1fr; gap:16px; align-items:center;">
            <!-- Radar Canvas -->
            <div style="height:220px; background:#040608; border:1px solid rgba(255,255,255,0.06); border-radius:8px; position:relative; overflow:hidden;">
              <canvas id="${canvasId}" style="width:100%; height:100%; display:block;"></canvas>
              <div style="position:absolute; bottom:6px; left:8px; font-size:0.62rem; color:#71717a; font-family:monospace;">
                FISHER Z-SCORE RADAR
              </div>
            </div>

            <!-- Table of Pairs -->
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:0.72rem; text-align:left;">
                <thead>
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#71717a; font-size:0.65rem; text-transform:uppercase;">
                    <th style="padding:6px 8px;">Asset Pair</th>
                    <th style="padding:6px 8px; text-align:center;">ρ (252d)</th>
                    <th style="padding:6px 8px; text-align:center;">ρ (60d)</th>
                    <th style="padding:6px 8px; text-align:center;">Δρ</th>
                    <th style="padding:6px 8px; text-align:center;">Z-Divergence</th>
                    <th style="padding:6px 8px;">Post-Breakdown Hedging Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${analysis.evaluations.map(e => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04); ${e.isBreakdown ? 'background:rgba(239,68,68,0.06);' : ''}">
                      <td style="padding:7px 8px;">
                        <div style="font-weight:700; color:#fff;">${e.pair}</div>
                        <div style="font-size:0.62rem; color:#71717a;">${e.name}</div>
                      </td>
                      <td style="padding:7px 8px; text-align:center; font-family:monospace; color:#a1a1aa;">${e.rho252 > 0 ? '+' : ''}${e.rho252.toFixed(2)}</td>
                      <td style="padding:7px 8px; text-align:center; font-family:monospace; font-weight:700; color:${e.rho60 > 0 ? '#10b981' : '#f43f5e'};">${e.rho60 > 0 ? '+' : ''}${e.rho60.toFixed(2)}</td>
                      <td style="padding:7px 8px; text-align:center; font-family:monospace; color:${e.deltaRho > 0 ? '#10b981' : '#f43f5e'};">${e.deltaRho > 0 ? '+' : ''}${e.deltaRho.toFixed(2)}</td>
                      <td style="padding:7px 8px; text-align:center;">
                        <span style="font-family:monospace; font-weight:800; padding:2px 7px; border-radius:4px; ${e.isBreakdown ? 'background:rgba(239,68,68,0.25); border:1px solid #ef4444; color:#ef4444; animation:radarPulse 1.5s infinite;' : (e.absZ >= 1.2 ? 'background:rgba(255,176,0,0.15); color:#ffb000;' : 'background:rgba(16,185,129,0.15); color:#10b981;')}">
                          ${e.zScore > 0 ? '+' : ''}${e.zScore.toFixed(2)}σ
                        </span>
                      </td>
                      <td style="padding:7px 8px; color:#cbd5e1; font-size:0.68rem;">
                        ${e.recommendation}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      this._drawRadarCanvas(canvasId, analysis.evaluations);
    }

    _drawRadarCanvas(canvasId, evaluations) {
      if (typeof document === 'undefined') return;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const w = canvas.width = (rect.width || 240) * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
      const h = canvas.height = (rect.height || 220) * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) * 0.72;
      const n = evaluations.length;

      // Draw Concentric Reference Rings (1σ, 2σ breakdown threshold, 3σ)
      const rings = [0.33, 0.66, 1.0];
      rings.forEach((rScale, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * rScale, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 1 ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = idx === 1 ? 1.5 : 1;
        if (idx === 1) ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Spoke Lines & Labels
      evaluations.forEach((e, idx) => {
        const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
        const xSpoke = cx + Math.cos(angle) * radius;
        const ySpoke = cy + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(xSpoke, ySpoke);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();

        // Label
        const xLabel = cx + Math.cos(angle) * (radius + 16);
        const yLabel = cy + Math.sin(angle) * (radius + 16);
        ctx.fillStyle = e.isBreakdown ? '#ef4444' : '#a1a1aa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.pair.split('/')[0].trim(), xLabel, yLabel);
      });

      // Draw Polygon of Current Z-Scores
      ctx.beginPath();
      evaluations.forEach((e, idx) => {
        const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
        // Map absZ where 3.0σ = full radius
        const rNorm = Math.min(1.1, e.absZ / 3.0) * radius;
        const px = cx + Math.cos(angle) * rNorm;
        const py = cy + Math.sin(angle) * rNorm;

        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();

      const polyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      polyGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      polyGrad.addColorStop(1, 'rgba(255, 176, 0, 0.15)');
      ctx.fillStyle = polyGrad;
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Pulsing Nodes
      evaluations.forEach((e, idx) => {
        const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
        const rNorm = Math.min(1.1, e.absZ / 3.0) * radius;
        const px = cx + Math.cos(angle) * rNorm;
        const py = cy + Math.sin(angle) * rNorm;

        ctx.beginPath();
        ctx.arc(px, py, e.isBreakdown ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = e.isBreakdown ? '#ef4444' : '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }

  return {
    ContagionRadarEngine,
    CROSS_ASSET_PAIRS
  };
});
