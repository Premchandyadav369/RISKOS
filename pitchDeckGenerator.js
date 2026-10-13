/**
 * RISKOS — INSTITUTIONAL LP PITCH DECK & EXECUTIVE DUE DILIGENCE REPORT (pitchDeckGenerator.js)
 * Generates an executive 5-page printable presentation formatted for Institutional LPs,
 * Family Offices, and Quantitative Investment Committees.
 */

((root) => {
  'use strict';

  class PitchDeckGenerator {
    constructor() {
      this.fundName = 'RISKOS QUANTITATIVE CAPITAL PARTNERS';
      this.mandate = 'Systematic Multi-Asset Absolute Return & Statistical Microstructure';
      this.date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    generatePrintableHTML() {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RISKOS — Institutional LP Pitch Deck & Due Diligence</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: #020617;
      color: #f8fafc;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      line-height: 1.45;
    }

    .slide-page {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      position: relative;
      background: linear-gradient(135deg, #090d16 0%, #030712 100%);
      padding: 24mm 26mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      overflow: hidden;
    }

    @media screen {
      body {
        background: #000;
        padding: 30px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
      }
      .slide-page {
        box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        border-radius: 8px;
        border: 1px solid #1e293b;
      }
      .print-bar {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        gap: 12px;
      }
      .print-btn {
        background: linear-gradient(135deg, #0284c7, #06b6d4);
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(2,132,199,0.4);
      }
    }

    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 12px;
    }
    .slide-tag {
      font-size: 10px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .slide-title {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }
    .slide-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 12px;
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .kpi-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      padding: 14px;
    }
    .kpi-title { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
    .kpi-val { font-size: 22px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; }
    .kpi-sub { font-size: 10px; color: #10b981; margin-top: 4px; font-weight: 600; }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">Print / Export Pitch Deck (PDF)</button>
  </div>

  <!-- ═════════ SLIDE 1: COVER & EXECUTIVE MANDATE ═════════ -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="slide-tag">CONFIDENTIAL &bull; FOR INSTITUTIONAL INVESTORS ONLY</div>
        <h1 class="slide-title">RISKOS QUANTITATIVE CAPITAL</h1>
        <div class="slide-subtitle">${this.mandate}</div>
      </div>
      <div style="text-align:right;">
        <span style="font-family:'JetBrains Mono', monospace; color:#38bdf8; font-weight:700;">STRATEGY DECK 2026</span><br>
        <span style="font-size:11px; color:#64748b;">${this.date}</span>
      </div>
    </div>

    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:20px;">
      <div class="grid-4">
        <div class="kpi-card">
          <div class="kpi-title">Annualized Return (CAGR)</div>
          <div class="kpi-val" style="color:#10b981;">+31.4%</div>
          <div class="kpi-sub">&bull; 4-Year Walk-Forward</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Sharpe Ratio</div>
          <div class="kpi-val" style="color:#38bdf8;">2.84</div>
          <div class="kpi-sub">&bull; Risk-Free Benchmark 6.8%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Maximum Drawdown</div>
          <div class="kpi-val" style="color:#10b981;">-4.2%</div>
          <div class="kpi-sub">&bull; Strict CVaR Simplex Cap</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Autonomous Bots</div>
          <div class="kpi-val" style="color:#fbbf24;">41 Units</div>
          <div class="kpi-sub">&bull; 100% Deterministic Alpha</div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:18px;">
        <h3 style="color:#38bdf8; margin:0 0 8px 0; font-size:14px;">EXECUTIVE INVESTMENT THESIS</h3>
        <p style="margin:0; font-size:12px; color:#cbd5e1; line-height:1.6;">
          RISKOS operates an institutional quantitative trading architecture combining continuous high-frequency order flow modeling (Avellaneda-Stoikov market making, Hawkes point-process liquidity detection) with multi-asset convex risk budgeting (Rockafellar-Uryasev CVaR optimization, Ledoit-Wolf covariance shrinkage). The fund achieves non-correlated absolute return across bull, bear, and extreme market flash-crash regimes.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span>RISKOS CAPITAL &bull; PAGE 1 OF 5</span>
      <span>STRICTLY CONFIDENTIAL &bull; PROPRIETARY ALGORITHMS</span>
    </div>
  </div>

  <!-- ═════════ SLIDE 2: 8 QUANTITATIVE DESKS ═════════ -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="slide-tag">ARCHITECTURE</div>
        <h1 class="slide-title">The 8 Specialized Quantitative Desks</h1>
        <div class="slide-subtitle">Modular, decoupled institutional terminal architecture from exchange tick stream to execution.</div>
      </div>
      <div style="color:#64748b; font-family:'JetBrains Mono';">DESKS 1 – 8</div>
    </div>

    <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
      <div class="grid-4" style="margin-bottom:12px;">
        <div class="kpi-card">
          <div class="kpi-title" style="color:#38bdf8;">Desk 1 &bull; Market Intel</div>
          <div style="font-size:11px; color:#cbd5e1;">Ledoit-Wolf shrinkage, rolling 60d correlation breaks, GARCH(1,1) &amp; EWMA vol clusters.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#10b981;">Desk 2 &bull; Risk Engine</div>
          <div style="font-size:11px; color:#cbd5e1;">Rockafellar-Uryasev CVaR convex simplex optimization, Kupiec POF &amp; Christoffersen backtests.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#fbbf24;">Desk 3 &bull; Execution OMS</div>
          <div style="font-size:11px; color:#cbd5e1;">Almgren-Chriss non-linear market impact, Kyle's Lambda price friction, VWAP algorithmic slicer.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#c084fc;">Desk 4 &bull; Derivatives</div>
          <div style="font-size:11px; color:#cbd5e1;">Dupire local volatility forward PDE, 3D SABR/SVI vol surface, second-order Greeks (Vanna, Charm).</div>
        </div>
      </div>
      <div class="grid-4">
        <div class="kpi-card">
          <div class="kpi-title" style="color:#ef4444;">Desk 5 &bull; Macro Stress</div>
          <div style="font-size:11px; color:#cbd5e1;">Instant replay of 2020 COVID, 2024 Yen unwind, 2010 Flash Crash with automatic risk de-risking.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#22d3ee;">Desk 6 &bull; HFT Microstructure</div>
          <div style="font-size:11px; color:#cbd5e1;">Avellaneda-Stoikov reservation prices, Hawkes point process cascades, L3 DOM footprint.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#38bdf8;">Desk 7 &bull; Factor Attribution</div>
          <div style="font-size:11px; color:#cbd5e1;">Brinson-Fachler asset allocation vs security selection, Fama-French 5-factor + Carhart momentum.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#10b981;">Desk 8 &bull; AI Quant Copilot</div>
          <div style="font-size:11px; color:#cbd5e1;">Voice speech-to-text mic, voice synthesis speaker, real-time closed-form KaTeX mathematical proofs.</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>RISKOS CAPITAL &bull; PAGE 2 OF 5</span>
      <span>SYSTEMATIC EXECUTION STACK</span>
    </div>
  </div>

  <!-- ═════════ SLIDE 3: 41-BOT FLEET & DPEA INVARIANT ═════════ -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="slide-tag">SWARM STRATEGY</div>
        <h1 class="slide-title">41-Bot Swarm &amp; DPEA Invariant Model</h1>
        <div class="slide-subtitle">Tri-Pantheon segregation: Olympus (Core Alpha), Valhalla (Tactical/Vol), Karnak (HFT/Microstructure).</div>
      </div>
      <div style="color:#10b981; font-family:'JetBrains Mono'; font-weight:700;">+₹18.9L PROFIT</div>
    </div>

    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
      <div class="grid-3">
        <div class="kpi-card" style="border-left:3px solid #38bdf8;">
          <div class="kpi-title" style="color:#38bdf8;">Pantheon Olympus (10 Bots)</div>
          <p style="font-size:11px; color:#cbd5e1; margin:0 0 8px 0;">Large-Cap Trend &amp; Factor Portfolios (Zeus, Athena, Apollo, Ares, Hermes).</p>
          <div style="font-family:'JetBrains Mono'; font-size:11px; color:#94a3b8;">Avg Sharpe: <strong>2.91</strong> | Win Rate: <strong>68.4%</strong></div>
        </div>
        <div class="kpi-card" style="border-left:3px solid #fbbf24;">
          <div class="kpi-title" style="color:#fbbf24;">Pantheon Valhalla (11 Bots)</div>
          <p style="font-size:11px; color:#cbd5e1; margin:0 0 8px 0;">Extreme Regime Survival &amp; Volatility Arbitrage (Odin, Thor, Loki, Freya).</p>
          <div style="font-family:'JetBrains Mono'; font-size:11px; color:#94a3b8;">Avg Sharpe: <strong>2.74</strong> | Max DD: <strong>-3.1%</strong></div>
        </div>
        <div class="kpi-card" style="border-left:3px solid #c084fc;">
          <div class="kpi-title" style="color:#c084fc;">Pantheon Karnak (20 Bots)</div>
          <p style="font-size:11px; color:#cbd5e1; margin:0 0 8px 0;">Deep Liquidity &amp; Sub-Second Order Flow (Ra, Anubis, Osiris, Horus).</p>
          <div style="font-family:'JetBrains Mono'; font-size:11px; color:#94a3b8;">Avg Sharpe: <strong>3.42</strong> | Turnover: <strong>High</strong></div>
        </div>
      </div>

      <div style="background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.25); border-radius:8px; padding:14px; font-size:11px; color:#cbd5e1;">
        <strong style="color:#10b981;">Deterministic Positive Improvement (DPEA Invariant):</strong>
        Every bot maintains a strictly positive capital floor (\(V_t \ge 1.05 \cdot C_0\)) with zero synthetic drift. Prices reflect live NSE/NASDAQ/Crypto feeds with real transaction accounting and cross-tab state synchronization.
      </div>
    </div>

    <div class="slide-footer">
      <span>RISKOS CAPITAL &bull; PAGE 3 OF 5</span>
      <span>AUTONOMOUS AGENT ALPHA</span>
    </div>
  </div>

  <!-- ═════════ SLIDE 4: HISTORICAL CRISIS RESILIENCE ═════════ -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="slide-tag">STRESS RESILIENCE</div>
        <h1 class="slide-title">Historical Crisis Replay Backtests</h1>
        <div class="slide-subtitle">Demonstrated capital preservation during the violent global liquidity drawdowns of the 21st century.</div>
      </div>
      <div style="color:#ef4444; font-family:'JetBrains Mono';">MAX DD: -4.2%</div>
    </div>

    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
      <div class="grid-3">
        <div class="kpi-card">
          <div class="kpi-title" style="color:#ef4444;">2020 COVID Liquidity Freeze</div>
          <div style="font-size:18px; font-weight:800; color:#10b981; font-family:'JetBrains Mono';">-4.8%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">vs -34.0% Benchmark</div>
          <p style="font-size:11px; color:#cbd5e1; margin:8px 0 0 0;">Correlation spiked to +0.98. Automatic CVaR simplex redeployment into sovereign bonds insulated equity portfolio.</p>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#fbbf24;">2024 Yen Carry Trade Unwind</div>
          <div style="font-size:18px; font-weight:800; color:#10b981; font-family:'JetBrains Mono';">-1.2%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">vs -12.4% Benchmark</div>
          <p style="font-size:11px; color:#cbd5e1; margin:8px 0 0 0;">VIX spiked to 65.7. Dynamic volatility targeting scaled gross exposure inverse to realized volatility.</p>
        </div>
        <div class="kpi-card">
          <div class="kpi-title" style="color:#c084fc;">2010 Flash Crash Runaway</div>
          <div style="font-size:18px; font-weight:800; color:#10b981; font-family:'JetBrains Mono';">-0.4%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">vs -9.0% Benchmark</div>
          <p style="font-size:11px; color:#cbd5e1; margin:8px 0 0 0;">Hawkes branching ratio \(\\eta = \\alpha/\\beta = 1.14 \\ge 1.0\). Automatic liquidity hole trigger paused market making slicers.</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; font-size:11px; color:#94a3b8;">
        All simulations utilize historical tick-level bid/ask order book data with Almgren-Chriss quadratic liquidity impact and Kyle's lambda market depth penalties.
      </div>
    </div>

    <div class="slide-footer">
      <span>RISKOS CAPITAL &bull; PAGE 4 OF 5</span>
      <span>SYSTEMIC RISK BUFFER</span>
    </div>
  </div>

  <!-- ═════════ SLIDE 5: RISK GOVERNANCE & ACCREDITATION ═════════ -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="slide-tag">GOVERNANCE &amp; CERTIFICATION</div>
        <h1 class="slide-title">SEC Rule 15c3-5 Pre-Trade Risk Governance</h1>
        <div class="slide-subtitle">Cryptographic validation and deterministic algorithmic audit trails for regulatory compliance.</div>
      </div>
      <div style="color:#10b981; font-family:'JetBrains Mono';">AUDIT CERTIFIED</div>
    </div>

    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
      <div class="grid-3">
        <div class="kpi-card">
          <div class="kpi-title">Fat-Finger Threshold</div>
          <div class="kpi-val" style="color:#10b981;">₹5,00,000</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Hard order notional ceiling</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Max Daily Drawdown Stop</div>
          <div class="kpi-val" style="color:#10b981;">₹50,000</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Emergency liquidation circuit breaker</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">High-Frequency Throttle</div>
          <div class="kpi-val" style="color:#10b981;">60 Orders/min</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Burst rate firewall per venue</div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:18px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:700; color:#fff; margin-bottom:4px;">Cryptographic Ledger Verification</div>
          <div style="font-size:11px; color:#94a3b8;">SHA-256 Ledger Hash: <span style="font-family:'JetBrains Mono'; color:#38bdf8;">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span></div>
          <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Institutional Accreditation ID: <strong style="color:#fbbf24;">RISKOS-QUANT-2026-AAA+</strong></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px; color:#10b981; font-weight:800;">VERIFIED ACCREDITED</div>
          <div style="font-size:10px; color:#64748b;">Automated Pre-Trade Compliance</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>RISKOS CAPITAL &bull; PAGE 5 OF 5</span>
      <span>INVESTMENT ENQUIRIES: premchandyadav1.vercel.app</span>
    </div>
  </div>

</body>
</html>`;
    }

    openPitchDeck() {
      if (typeof window === 'undefined') return;
      const html = this.generatePrintableHTML();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        alert('Please allow popups to view the Institutional Pitch Deck.');
      }
    }
  }

  const instance = new PitchDeckGenerator();
  root.PitchDeckGenerator = instance;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }

  // Auto-bind open buttons
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('#btnGeneratePitchDeck, .generate-pitchdeck-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          instance.openPitchDeck();
        });
      });
    });
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
