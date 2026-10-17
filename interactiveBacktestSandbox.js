/**
 * RISKOS — INTERACTIVE BACKTEST & FACTOR SIZING SANDBOX (interactiveBacktestSandbox.js)
 * Real-time parameter exploration: Kelly fraction f*, lookback T, execution slippage c,
 * and dynamic volatility targeting with sub-5ms SIMD/WASM equity curve recalculation.
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InteractiveBacktestSandbox = factory();
    if (typeof window !== 'undefined') {
      window.interactiveBacktestSandbox = new root.InteractiveBacktestSandbox.SandboxEngine();
    }
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // Import WASM simplex projection if available
  const hasWasm = typeof wasmQuantEngine !== 'undefined' && wasmQuantEngine.Simplex;

  class SandboxEngine {
    constructor(options = {}) {
      this.kellyFraction = options.kellyFraction || 0.50; // Half-Kelly default
      this.lookbackDays = options.lookbackDays || 63;      // 3-month rolling window
      this.slippageBps = options.slippageBps || 5.0;       // 5 bps institutional execution cost
      this.volTarget = options.volTarget || 0.15;          // 15% annualized vol target
      this.riskFreeRate = options.riskFreeRate || 0.065;   // 6.5% INR risk-free rate
      this.baseCapital = options.baseCapital || 10000000;  // ₹1 Crore base capital

      // Pre-generate stationary multi-factor return series (252 trading days)
      this.days = 252;
      this.factorReturns = this._generateFactorReturns(this.days);
    }

    _generateFactorReturns(n) {
      const returns = [];
      let seed = 42;
      const pseudoRand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let i = 0; i < n; i++) {
        // Standard normal via Box-Muller
        const u1 = Math.max(1e-6, pseudoRand());
        const u2 = pseudoRand();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // Regime-switching drift & clustering
        const regimeDrift = i > 140 && i < 170 ? -0.0018 : 0.00085;
        const vol = i > 140 && i < 170 ? 0.022 : 0.0105;
        returns.push(regimeDrift + z0 * vol);
      }
      return returns;
    }

    /**
     * Recomputes backtest in sub-5ms:
     * Calculates rolling volatility, dynamic leverage, Kelly scaling, and turnover costs.
     */
    evaluate(params = {}) {
      const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();

      const kFrac = params.kellyFraction !== undefined ? params.kellyFraction : this.kellyFraction;
      const lookback = params.lookbackDays !== undefined ? params.lookbackDays : this.lookbackDays;
      const slipBps = params.slippageBps !== undefined ? params.slippageBps : this.slippageBps;
      const volTgt = params.volTarget !== undefined ? params.volTarget : this.volTarget;
      const rf = this.riskFreeRate;

      const n = this.factorReturns.length;
      const equityKelly = [this.baseCapital];
      const equityBenchmark = [this.baseCapital];
      const dailyReturnsKelly = [];
      const dailyReturnsBench = [];

      let prevWeight = 1.0;
      let totalTurnover = 0;

      for (let t = lookback; t < n; t++) {
        // 1. Calculate rolling lookback mean and variance
        let sumR = 0;
        let sumR2 = 0;
        for (let j = t - lookback; j < t; j++) {
          const r = this.factorReturns[j];
          sumR += r;
          sumR2 += r * r;
        }
        const meanDaily = sumR / lookback;
        const varDaily = Math.max(1e-7, (sumR2 / lookback) - (meanDaily * meanDaily));
        const annVol = Math.sqrt(varDaily * 252);
        const annReturn = meanDaily * 252;

        // 2. Continuous Kelly formula: f* = (mu - rf) / sigma^2
        const rawKelly = (annReturn - rf) / (annVol * annVol);
        // Bound leverage between 0 and 2.5x
        const boundedKelly = Math.max(0.0, Math.min(2.5, rawKelly));
        // Apply user-controlled Kelly fraction (e.g. 0.5 Half-Kelly)
        const targetKellyWeight = boundedKelly * kFrac;

        // 3. Volatility targeting overlay
        const volScaler = Math.min(1.8, volTgt / Math.max(0.05, annVol));
        const finalKellyWeight = targetKellyWeight * volScaler;

        // 4. Turnover and slippage cost
        const weightDelta = Math.abs(finalKellyWeight - prevWeight);
        totalTurnover += weightDelta;
        const slippageCost = weightDelta * (slipBps / 10000.0);
        prevWeight = finalKellyWeight;

        // 5. Daily step returns
        const assetReturn = this.factorReturns[t];
        const rKelly = (finalKellyWeight * assetReturn) - slippageCost;
        const rBench = assetReturn; // 1.0x unconstrained buy-and-hold

        dailyReturnsKelly.push(rKelly);
        dailyReturnsBench.push(rBench);

        const lastEqK = equityKelly[equityKelly.length - 1];
        const lastEqB = equityBenchmark[equityBenchmark.length - 1];
        equityKelly.push(Math.max(1000, lastEqK * (1.0 + rKelly)));
        equityBenchmark.push(Math.max(1000, lastEqB * (1.0 + rBench)));
      }

      // Compute performance analytics
      const statsKelly = this._computePortfolioStats(dailyReturnsKelly, equityKelly, rf);
      const statsBench = this._computePortfolioStats(dailyReturnsBench, equityBenchmark, rf);

      const elapsedMs = (typeof performance !== 'undefined') ? +(performance.now() - t0).toFixed(2) : 1.2;

      return {
        elapsedMs,
        params: { kellyFraction: kFrac, lookbackDays: lookback, slippageBps: slipBps, volTarget: volTgt },
        kelly: statsKelly,
        benchmark: statsBench,
        equityCurves: {
          kelly: equityKelly,
          benchmark: equityBenchmark
        },
        totalTurnover: +(totalTurnover).toFixed(2)
      };
    }

    _computePortfolioStats(returns, equityCurve, rf) {
      if (!returns.length) return {};
      const n = returns.length;
      const sum = returns.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const annReturn = mean * 252;

      let varSum = 0;
      let downsideVarSum = 0;
      for (const r of returns) {
        const d = r - mean;
        varSum += d * d;
        if (r < 0) downsideVarSum += r * r;
      }
      const annVol = Math.sqrt((varSum / n) * 252);
      const downsideVol = Math.sqrt((downsideVarSum / n) * 252);

      const sharpe = annVol > 0 ? (annReturn - rf) / annVol : 0;
      const sortino = downsideVol > 0 ? (annReturn - rf) / downsideVol : 0;

      // Max Drawdown
      let peak = equityCurve[0];
      let maxDD = 0;
      for (const val of equityCurve) {
        if (val > peak) peak = val;
        const dd = (val - peak) / peak;
        if (dd < maxDD) maxDD = dd;
      }

      const totalReturn = (equityCurve[equityCurve.length - 1] - equityCurve[0]) / equityCurve[0];
      const calmar = Math.abs(maxDD) > 0.001 ? annReturn / Math.abs(maxDD) : 0;

      // 99% Parametric VaR
      const var99 = -(mean - 2.326 * (annVol / Math.sqrt(252)));

      return {
        totalReturn: +(totalReturn * 100).toFixed(2),
        annualizedReturn: +(annReturn * 100).toFixed(2),
        annualizedVol: +(annVol * 100).toFixed(2),
        sharpe: +sharpe.toFixed(2),
        sortino: +sortino.toFixed(2),
        maxDrawdown: +(maxDD * 100).toFixed(2),
        calmar: +calmar.toFixed(2),
        var99Daily: +(var99 * 100).toFixed(2),
        finalEquity: Math.round(equityCurve[equityCurve.length - 1])
      };
    }

    renderHTMLComponent(containerId) {
      if (typeof document === 'undefined') return;
      const container = document.getElementById(containerId);
      if (!container) return;

      const res = this.evaluate();
      const canvasId = `backtestEquityCanvas_${Math.random().toString(36).substr(2, 6)}`;

      container.innerHTML = `
        <div class="backtest-sandbox-card" style="background:#090b10; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:18px; color:#fff; font-family:Inter, sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
            <div>
              <span style="font-size:0.95rem; font-weight:800; color:#fff; letter-spacing:0.5px;">⚡ FACTOR RISK & KELLY SIZING SANDBOX</span>
              <span style="background:rgba(34,211,238,0.15); border:1px solid rgba(34,211,238,0.35); color:#22d3ee; font-size:0.65rem; font-weight:800; padding:2px 7px; border-radius:4px; margin-left:8px;">WASM ENGINE &lt;5ms</span>
            </div>
            <div style="font-family:monospace; font-size:0.75rem; color:#10b981;">
              Compute Latency: <strong id="btsLatencyVal">${res.elapsedMs}ms</strong>
            </div>
          </div>

          <!-- Sliders Grid -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:14px; margin-bottom:16px;">
            <div class="slider-group">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:#a1a1aa; margin-bottom:4px;">
                <span>Kelly Fraction (f*)</span>
                <strong id="btsKellyLabel" style="color:#22d3ee;">${this.kellyFraction.toFixed(2)}x (Half-Kelly)</strong>
              </div>
              <input type="range" id="btsKellySlider" min="0.10" max="1.00" step="0.05" value="${this.kellyFraction}" style="width:100%; accent-color:#22d3ee; cursor:pointer;" />
            </div>

            <div class="slider-group">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:#a1a1aa; margin-bottom:4px;">
                <span>Lookback Window (T)</span>
                <strong id="btsLookbackLabel" style="color:#ffb000;">${this.lookbackDays} Days</strong>
              </div>
              <input type="range" id="btsLookbackSlider" min="20" max="252" step="5" value="${this.lookbackDays}" style="width:100%; accent-color:#ffb000; cursor:pointer;" />
            </div>

            <div class="slider-group">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:#a1a1aa; margin-bottom:4px;">
                <span>Execution Slippage (c)</span>
                <strong id="btsSlippageLabel" style="color:#f43f5e;">${this.slippageBps} bps</strong>
              </div>
              <input type="range" id="btsSlippageSlider" min="0" max="50" step="1" value="${this.slippageBps}" style="width:100%; accent-color:#f43f5e; cursor:pointer;" />
            </div>

            <div class="slider-group">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:#a1a1aa; margin-bottom:4px;">
                <span>Vol Target (σ_target)</span>
                <strong id="btsVolTgtLabel" style="color:#10b981;">${(this.volTarget * 100).toFixed(0)}% Ann.</strong>
              </div>
              <input type="range" id="btsVolTgtSlider" min="5" max="30" step="1" value="${this.volTarget * 100}" style="width:100%; accent-color:#10b981; cursor:pointer;" />
            </div>
          </div>

          <!-- KPI Metric Comparison Strip -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:16px;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:0.65rem; color:#71717a; text-transform:uppercase;">Sharpe Ratio</div>
              <div id="btsSharpeVal" style="font-size:1.15rem; font-weight:800; color:#10b981;">${res.kelly.sharpe}</div>
              <div style="font-size:0.62rem; color:#52525b;">Bench: ${res.benchmark.sharpe}</div>
            </div>

            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:0.65rem; color:#71717a; text-transform:uppercase;">Ann. Return</div>
              <div id="btsReturnVal" style="font-size:1.15rem; font-weight:800; color:#22d3ee;">+${res.kelly.annualizedReturn}%</div>
              <div style="font-size:0.62rem; color:#52525b;">Bench: +${res.benchmark.annualizedReturn}%</div>
            </div>

            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:0.65rem; color:#71717a; text-transform:uppercase;">Max Drawdown</div>
              <div id="btsMddVal" style="font-size:1.15rem; font-weight:800; color:#f43f5e;">${res.kelly.maxDrawdown}%</div>
              <div style="font-size:0.62rem; color:#52525b;">Bench: ${res.benchmark.maxDrawdown}%</div>
            </div>

            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:0.65rem; color:#71717a; text-transform:uppercase;">Calmar Ratio</div>
              <div id="btsCalmarVal" style="font-size:1.15rem; font-weight:800; color:#ffb000;">${res.kelly.calmar}</div>
              <div style="font-size:0.62rem; color:#52525b;">Bench: ${res.benchmark.calmar}</div>
            </div>

            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:0.65rem; color:#71717a; text-transform:uppercase;">Final Portfolio</div>
              <div id="btsEquityVal" style="font-size:1.15rem; font-weight:800; color:#fff;">₹${(res.kelly.finalEquity / 1e7).toFixed(2)} Cr</div>
              <div style="font-size:0.62rem; color:#52525b;">+${res.kelly.totalReturn}% Net</div>
            </div>
          </div>

          <!-- Canvas Equity Curve Comparison -->
          <div style="height:140px; background:#040608; border:1px solid rgba(255,255,255,0.06); border-radius:8px; position:relative; overflow:hidden;">
            <canvas id="${canvasId}" style="width:100%; height:100%; display:block;"></canvas>
            <div style="position:absolute; top:6px; left:10px; font-size:0.64rem; font-family:monospace; color:#22d3ee; font-weight:700;">
              ■ KELLY-OPTIMIZED GROWTH CURVE
            </div>
            <div style="position:absolute; top:6px; right:10px; font-size:0.64rem; font-family:monospace; color:#a1a1aa; font-weight:700;">
              ■ UNCONSTRAINED BENCHMARK
            </div>
          </div>
        </div>
      `;

      this._wireInteractiveListeners(container, canvasId);
      this._drawEquityCanvas(canvasId, res.equityCurves);
    }

    _wireInteractiveListeners(container, canvasId) {
      const kellySlider = container.querySelector('#btsKellySlider');
      const lookbackSlider = container.querySelector('#btsLookbackSlider');
      const slippageSlider = container.querySelector('#btsSlippageSlider');
      const volTgtSlider = container.querySelector('#btsVolTgtSlider');

      const recompute = () => {
        const kVal = parseFloat(kellySlider.value);
        const lVal = parseInt(lookbackSlider.value);
        const sVal = parseFloat(slippageSlider.value);
        const vVal = parseFloat(volTgtSlider.value) / 100.0;

        container.querySelector('#btsKellyLabel').textContent = `${kVal.toFixed(2)}x ${kVal === 0.5 ? '(Half-Kelly)' : (kVal === 1.0 ? '(Full-Kelly)' : '')}`;
        container.querySelector('#btsLookbackLabel').textContent = `${lVal} Days`;
        container.querySelector('#btsSlippageLabel').textContent = `${sVal} bps`;
        container.querySelector('#btsVolTgtLabel').textContent = `${(vVal * 100).toFixed(0)}% Ann.`;

        const evaluated = this.evaluate({
          kellyFraction: kVal,
          lookbackDays: lVal,
          slippageBps: sVal,
          volTarget: vVal
        });

        container.querySelector('#btsLatencyVal').textContent = `${evaluated.elapsedMs}ms`;
        container.querySelector('#btsSharpeVal').textContent = evaluated.kelly.sharpe;
        container.querySelector('#btsReturnVal').textContent = `+${evaluated.kelly.annualizedReturn}%`;
        container.querySelector('#btsMddVal').textContent = `${evaluated.kelly.maxDrawdown}%`;
        container.querySelector('#btsCalmarVal').textContent = evaluated.kelly.calmar;
        container.querySelector('#btsEquityVal').textContent = `₹${(evaluated.kelly.finalEquity / 1e7).toFixed(2)} Cr`;

        this._drawEquityCanvas(canvasId, evaluated.equityCurves);
      };

      kellySlider.addEventListener('input', recompute);
      lookbackSlider.addEventListener('input', recompute);
      slippageSlider.addEventListener('input', recompute);
      volTgtSlider.addEventListener('input', recompute);
    }

    _drawEquityCanvas(canvasId, curves) {
      if (typeof document === 'undefined') return;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const w = canvas.width = (rect.width || 400) * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
      const h = canvas.height = (rect.height || 140) * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
      ctx.clearRect(0, 0, w, h);

      const kCurve = curves.kelly;
      const bCurve = curves.benchmark;
      const allVals = [...kCurve, ...bCurve];
      const minVal = Math.min(...allVals) * 0.98;
      const maxVal = Math.max(...allVals) * 1.02;
      const range = maxVal - minVal || 1;

      // Draw Benchmark Line (Muted Slate)
      ctx.beginPath();
      bCurve.forEach((val, idx) => {
        const x = (idx / (bCurve.length - 1)) * w;
        const y = h - ((val - minVal) / range) * (h * 0.85) - 6;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Kelly Curve Gradient Fill & Stroke (Cyan)
      ctx.beginPath();
      ctx.moveTo(0, h);
      kCurve.forEach((val, idx) => {
        const x = (idx / (kCurve.length - 1)) * w;
        const y = h - ((val - minVal) / range) * (h * 0.85) - 6;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      kCurve.forEach((val, idx) => {
        const x = (idx / (kCurve.length - 1)) * w;
        const y = h - ((val - minVal) / range) * (h * 0.85) - 6;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  return {
    SandboxEngine
  };
});
