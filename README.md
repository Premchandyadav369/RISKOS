# RISKOS — Institutional Quantitative Intelligence & Multi-Asset Risk Operating System

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Platform: Web & API](https://img.shields.io/badge/Platform-Web%20%7C%20FastAPI%20%7C%20Serverless-10b981.svg?style=for-the-badge)](https://riskos-psi.vercel.app)
[![Google TimesFM 3.0](https://img.shields.io/badge/AI%20Foundation-Google%20TimesFM%203.0-22d3ee.svg?style=for-the-badge)](#-google-research-timesfm-30-foundation-model)
[![24/7 Bot Fleet](https://img.shields.io/badge/24%2F7%20Autonomous%20Fleet-20%20Sector%20Bots-f59e0b.svg?style=for-the-badge)](https://riskos-psi.vercel.app/fleet.html)
[![Quant Labs](https://img.shields.io/badge/Interactive%20Labs-52%20Modules-purple.svg?style=for-the-badge)](https://riskos-psi.vercel.app/learn.html)
[![Production Status](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success.svg?style=for-the-badge)](https://riskos-psi.vercel.app)

**An institutional-grade, AI-native quantitative intelligence, stochastic risk analytics, and multi-asset trading execution terminal built for computational finance research, systematic strategy backtesting, prediction market probability pricing, and deterministic mathematical explainability.**

[Live Production Terminal](https://riskos-psi.vercel.app/app.html) • [24/7 Autonomous Bot Fleet](https://riskos-psi.vercel.app/fleet.html) • [System Architecture Docs](https://riskos-psi.vercel.app/docs.html) • [Market Observatory](https://riskos-psi.vercel.app/observatory.html) • [52 Quant Labs](https://riskos-psi.vercel.app/learn.html) • [Security Master](https://riskos-psi.vercel.app/ticker.html)

</div>

---

## 📑 Table of Contents
1. [Executive Summary & Core Philosophy](#-executive-summary--core-philosophy)
2. [End-to-End System Architecture](#-end-to-end-system-architecture)
3. [The 7 Bloomberg-Grade Trading Desks (app.html)](#-the-7-bloomberg-grade-trading-desks-apphtml)
4. [Google Research TimesFM 3.0 Foundation Model](#-google-research-timesfm-30-foundation-model)
5. [24/7 Autonomous Bot Fleet & Performance Ranker (fleet.html)](#-247-autonomous-bot-fleet--performance-ranker-fleethtml)
6. [Market Observatory & Spatial Anomaly Scanner (observatory.html)](#-market-observatory--spatial-anomaly-scanner-observatoryhtml)
7. [Master Catalog of 52 Interactive Quantitative Laboratories (learn.html)](#-master-catalog-of-52-interactive-quantitative-laboratories-learnhtml)
8. [Universal Security Master (120+ Assets across NSE, US, Crypto)](#-universal-security-master-120-assets)
9. [Mathematical Formulations & LaTeX Specifications](#-mathematical-formulations--latex-specifications)
10. [REST & Serverless API Reference](#-rest--serverless-api-reference)
11. [Local Quickstart & Production Deployment](#-local-quickstart--production-deployment)

---

## 🏛️ Executive Summary & Core Philosophy

### 🎓 In Layman Terms
Imagine walking onto the high-tech trading floor of a multi-billion dollar quantitative hedge fund. Traders, risk officers, and portfolio managers monitor hundreds of flashing metrics, order books, and risk gauges. Most software either dumbs this down into an oversimplified smartphone chart or buries it inside a $30,000/year Bloomberg terminal.

**RISKOS** bridges this divide:
- **Plain-English Explanations**: Every single financial metric and Greek is explained using everyday analogies (e.g., insurance policies, airplane flight stabilizers, weather forecasting).
- **Mathematical Rigor**: Every algorithm is backed by its exact **LaTeX mathematical proof**, stochastic differential equation (SDE), and step-by-step numeric trace.
- **Autonomous 24/7 Execution**: 20 sector-diversified bots trade continuously with persistent state that you can inspect anytime—even 3 months later.

### ⚡ Institutional Tripartite Architecture
1. **Simple by Default**: High-contrast, dark-mode terminal UI presenting executive metrics, key performance ratios, and health badges at a single glance.
2. **Deep on Demand**: Expandable parameter matrices, cross-market causality graphs, multi-factor trade logs, and scenario stress sliders.
3. **Mathematical when Requested**: Every metric is accompanied by its underlying **pure vector LaTeX mathematical proof** (MathJax 3 SVG).

---

## 🏗️ End-to-End System Architecture

```mermaid
flowchart TD
    subgraph DataIngestion["📡 Multi-Asset Real-Time Ingestion (120+ Assets)"]
        YF["Yahoo Finance API (Equities / FX / Commodities)"]
        NSE["NSE India & MCX (09:00 - 23:55 IST)"]
        Crypto["Binance & Coinbase 24/7/365 WebSockets"]
        OpenBB["OpenBB Open Data Platform (ODP)"]
    end

    subgraph SecurityMaster["🧠 Central Security Master (securityMaster.js)"]
        Norm["Price & OHLC Normalization Engine"]
        TickBus["Real-Time Tick Streaming Event Bus"]
        Norm --> TickBus
    end

    DataIngestion --> SecurityMaster

    subgraph CoreEngines["⚙️ Quantitative Analytics Engines"]
        TimesFM["🤖 Google TimesFM 3.0 Foundation Model (Patch=32, RevIN)"]
        RiskEngine["🛡️ VaR 99%, CVaR, Ledoit-Wolf Shrinkage & GARCH(1,1)"]
        HMM["🔮 3-State Gaussian Hidden Markov Model (Regime Detection)"]
        Derivatives["📈 Black-Scholes-Merton & SABR Volatility Smile Engine"]
        Execution["⚡ Almgren-Chriss Optimal Order Execution Slicer (SOR)"]
    end

    SecurityMaster --> CoreEngines

    subgraph FrontendPlatform["🖥️ Institutional Front-End Workspaces"]
        App["🖥️ app.html: 7 Bloomberg-Grade Trading Desks"]
        Fleet["🤖 fleet.html: 24/7 Autonomous Bot Fleet & Ranker (20 Bots)"]
        Obs["📡 observatory.html: Spatial Anomaly Radar & Crisis Replay"]
        Learn["🧪 learn.html: 52 Interactive Quantitative Labs"]
        Docs["📖 docs.html: End-to-End Dual-Perspective Architecture Docs"]
    end

    CoreEngines --> FrontendPlatform
```

---

## 🖥️ The 7 Bloomberg-Grade Trading Desks (`app.html`)

```mermaid
graph LR
    Terminal["RISKOS Terminal (app.html)"]
    Terminal --> D1["Desk 1: Market Intelligence & HMM Regimes"]
    Terminal --> D2["Desk 2: Portfolio Tail Risk, VaR & CVaR"]
    Terminal --> D3["Desk 3: Systematic Signals & Kelly Sizing"]
    Terminal --> D4["Desk 4: Almgren-Chriss Algo Order Slicer"]
    Terminal --> D5["Desk 5: Multi-Leg Derivatives & SABR Smile"]
    Terminal --> D6["Desk 6: Strategy Sandbox & Alpha Heatmap"]
    Terminal --> D7["Desk 7: AI Speculations & Google TimesFM 3.0"]
```

1. **Desk 1: Market Intelligence & HMM Regime Detection**:
   - 3-State Gaussian Hidden Markov Model classifying market dynamics into **Bull**, **Bear**, or **Sideways** states.
   - Real-time rolling GARCH(1,1) volatility spread vs EWMA.
   - Dynamic cross-asset correlation matrix flagging statistical breaks ($> 2.0\sigma$).

2. **Desk 2: Portfolio Tail Risk & Black-Litterman Allocator**:
   - Historical, Parametric, and 10,000-Path Monte Carlo Value at Risk ($	ext{VaR}_{99\%}$) and Expected Shortfall ($	ext{CVaR}_{99\%}$).
   - Ledoit-Wolf Covariance Shrinkage ($\Sigma_{	ext{LW}} = \delta F + (1-\delta)S$).
   - Brinson-Fachler Multi-Factor Return Decomposition ($A_i, S_i, I_i$).
   - Real-Time Macro Shock Matrix (Rates $+300	ext{ bps}$, Oil Crash $-40\%$, Credit Contagion).

3. **Desk 3: Systematic Signals & Strategy Execution**:
   - Multi-indicator convergence (RSI(14), MACD(12,26,9), Bollinger Band Width).
   - Automated Fractional Kelly Criterion sizing ($0.50 \cdot f^*$).

4. **Desk 4: Algorithmic Order Execution Slicer (SOR)**:
   - Almgren-Chriss optimal execution trajectory:
     $$x_j = rac{\sinh(\kappa(T - t_j))}{\sinh(\kappa T)} X, \quad \kappa pprox \sqrt{rac{\lambda \sigma^2}{\eta}}$$
   - Real-time VWAP, TWAP, and Percentage of Volume (POV 10% / 20%) schedules with simulated slippage tracking.

5. **Desk 5: Multi-Leg Derivatives Strategy Studio & SABR Smile**:
   - Iron Condor, Straddle, Strangle, Bull Call, Bear Put, Butterfly, and Risk Reversal.
   - Real-time Black-Scholes-Merton and Hagan SABR volatility smile calibration:
     $$\sigma_{	ext{SABR}}(K, F) pprox rac{lpha}{(F K)^{(1-eta)/2}} \left[ 1 + \dots ight]$$

6. **Desk 6: Quantitative Strategy Sandbox & Monthly Alpha Heatmap**:
   - Walk-forward backtesting sandbox with transaction cost accounting (TCA).
   - Year $	imes$ Month Alpha Returns Heatmap matrix with Sortino, Calmar, and Profit Factor metrics.

7. **Desk 7: AI Speculations & Google TimesFM 3.0**:
   - Zero-shot 10-quantile probabilistic transformer forecaster ($q_{10}$ to $q_{99}$).
   - Hanson Logarithmic Market Scoring Rule (LMSR) event probability pricing.

---

## 🤖 Google Research TimesFM 3.0 Foundation Model

Integrated directly from `google/timesfm-3.0-pytorch` (arXiv:2310.10688 by Das et al.):

```mermaid
flowchart LR
    Input["Input Price Series (L >= 32)"] --> RevIN["Iterative RevIN Normalization (x - μ) / σ"]
    RevIN --> Patch["Patch Tokenizer (L_p = 32 Bars)"]
    Patch --> Transformer["Stacked Mixing Transformer (20 Layers, 1280 Dim, 16 Heads)"]
    Transformer --> DeNorm["RevIN De-Normalization"]
    DeNorm --> Quantiles["10-Quantile Horizon Fan (q10 to q99)"]
```

* **Context Patch Length ($L_p$)**: 32 bars per dense token embedding.
* **Forecast Horizon Patch ($H_p$)**: 64 bars zero-shot trajectory.
* **Iterative RevIN**: Eliminates non-stationary mean/volatility drifts.
* **Quantile Skewness Index**:
  $$	ext{Skewness Index} = rac{(q_{90\%} - q_{50\%}) - (q_{50\%} - q_{10\%})}{q_{90\%} - q_{10\%}}$$

---

## 🤖 24/7 Autonomous Bot Fleet & Performance Ranker (`fleet.html`)

A dedicated command center managing **20 distinct quantitative sector bots**:

| Bot ID | Market | Sector | Strategy Type | Mathematical Edge |
| :--- | :--- | :--- | :--- | :--- |
| **`BOT-IN-01`** | 🇮🇳 India | Index Derivatives | Volatility Dispersion | GARCH(1,1) Vol Spread $+2.5\sigma$ vs SABR smile |
| **`BOT-IN-02`** | 🇮🇳 India | Banking & Financials | Statistical Arbitrage | HDFC vs ICICI Kalman filter $|z_t| > 2.2$ mean-reversion |
| **`BOT-IN-03`** | 🇮🇳 India | IT & Software | Dual-Momentum Trend | Donchian 20D breakout + volatility target scaling |
| **`BOT-IN-04`** | 🇮🇳 India | Energy & Petrochem | Cost-of-Carry Basis Arb | Cash-and-carry carry yield $> +8.5\%/	ext{yr}$ |
| **`BOT-IN-05`** | 🇮🇳 India | Auto & EV | L2 Microstructure Scalper | Level-2 Order Flow Imbalance (OFI $> +0.70$) |
| **`BOT-IN-06`** | 🇮🇳 India | Pharma & Health | Dynamic Mean Reversion | Bollinger Bands ($2.2\sigma$) + RSI divergence |
| **`BOT-IN-07`** | 🇮🇳 India | Metals & Mining | Commodity Factor Trend | LME global metal cycle and China PMI momentum |
| **`BOT-IN-08`** | 🇮🇳 India | FMCG & Retail | Volume Profile Auction | Value Area 70% (VAH/VAL) auction mean-reversion |
| **`BOT-IN-09`** | 🇮🇳 India | Defense & Infra | Avellaneda-Stoikov MM | High-frequency optimal quoting with inventory penalty $\gamma$ |
| **`BOT-IN-10`** | 🇮🇳 India | MCX Commodities | Evening Multi-Timeframe CTA| Dual EMA cross + $	ext{ADX} > 25$ (09:00 - 23:55 IST) |
| **`BOT-US-01`** | 🇺🇸 US | Tech Mega-Caps | Almgren-Chriss Slicer | Optimal execution impact minimization ($\sinh(\kappa(T-t))$) |
| **`BOT-US-02`** | 🇺🇸 US | Semiconductors | Gamma Scalper | Long gamma extraction: $\Pi pprox rac{1}{2}\Gamma S^2 (\sigma_{	ext{real}}^2 - \sigma_{	ext{implied}}^2)$ |
| **`BOT-US-03`** | 🇺🇸 US | US Financials | Yield Curve Steepener | Nelson-Siegel 2s10s curve un-inversion trade |
| **`BOT-US-04`** | 🇺🇸 US | BioTech & Health | Jump-Diffusion Event Arb | Merton Poisson jump-diffusion for clinical readouts |
| **`BOT-US-05`** | 🇺🇸 US | Energy Majors | Fama-French 5-Factor Bot | Multi-factor risk premia harvesting (Value, Profitability) |
| **`BOT-US-06`** | 🇺🇸 US | Aerospace | Kyle-Lambda Order Flow | Microstructure informed flow detection ($\Delta P = \lambda Q$) |
| **`BOT-US-07`** | 🇺🇸 US | Crypto L1 (24/7) | Perpetual Funding Arb | Delta-neutral cash-and-carry earning 8h funding yields |
| **`BOT-US-08`** | 🇺🇸 US | Crypto Altcoins | Triangular Arbitrage | Sub-second cross-venue latency arbitrage (CEX/DEX) |
| **`BOT-US-09`** | 🇺🇸 US | Global FX & Rates | Vol-Targeted Macro CTA | Central bank interest rate differentials & DXY momentum |
| **`BOT-US-10`** | 🇺🇸 US | Prediction Markets | Hanson LMSR Event Arb | Bayesian econometric fair value vs Polymarket probability |

### ⏳ 24/7 Epoch Persistence & Time-Travel Engine
- Saves an initialization epoch in persistent browser storage (`RISKOS_FLEET_START_EPOCH_V3`).
- When revisiting months later, the engine calculates elapsed time $\Delta t$ and continuously simulates compounding growth, realized trade fills, and walk-forward equity curves across all elapsed sessions.
- Interactive time accelerators: **`+7 Days`**, **`+30 Days (1M)`**, **`+90 Days (3M Beast Mode)`**.

---

## 📡 Market Observatory & Spatial Anomaly Scanner (`observatory.html`)

- **2D Spatial Clustering Radar**: Simultaneously maps 120+ securities by volatility vs return dispersion.
- **Black Swan Crisis Replay Engine**: Replays 2008 Lehman GFC, 2020 COVID Crash, and 2024 Yen Carry Trade Unwind in real time.
- **Institutional Audio Engine**: Microstructure order fill and anomaly audio cues.

---

## 🧪 Master Catalog of 52 Interactive Quantitative Laboratories (`learn.html`)

1. **Returns & Growth**: CAGR, Real Returns (Inflation Adjusted), Logarithmic Returns, Geometric vs Arithmetic Mean.
2. **Classical Risk**: Annualized Volatility, Sharpe Ratio, Sortino Ratio, Calmar Ratio, Maximum Drawdown (MDD).
3. **Tail Risk**: Historical VaR, Parametric VaR, Monte Carlo VaR (10,000 Paths), Conditional VaR (CVaR), Cornish-Fisher Expansion.
4. **Portfolio Theory**: Markowitz Mean-Variance Efficient Frontier, Capital Allocation Line (CAL), Black-Litterman Allocation, Risk Parity.
5. **Derivatives & Volatility**: Black-Scholes-Merton Formula, Option Greeks ($\Delta, \Gamma, \mathcal{V}, \Theta, ho$), SABR Volatility Smile, Implied Volatility Surface.
6. **Advanced Quantitative Methods**: Kalman Filtering State-Space, 3-State Gaussian HMMs, Copula Dependence Modeling, Almgren-Chriss Optimal Execution.
7. **AI Foundation Models**: Google TimesFM 3.0 Stacked Mixing Transformer, Iterative RevIN, Multi-Quantile Dispersion, Hanson LMSR Prediction Pricing.

---

## 🌐 REST & Serverless API Reference

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/market/prices?tickers=AAPL,MSFT&period=1y` | Historical OHLCV price series |
| `GET` | `/api/market/volatility?ticker=AAPL` | EWMA & GARCH(1,1) Volatility parameters |
| `GET` | `/api/market/regime?ticker=SPY` | 3-State Gaussian HMM regime probabilities |
| `GET` | `/api/market/correlations?tickers=AAPL,MSFT,GOOGL` | Ledoit-Wolf correlation matrix & break detection |
| `GET` | `/api/risk/var?tickers=AAPL,MSFT&weights=0.5,0.5&confidence=0.99` | Multi-method VaR & CVaR risk metrics |
| `GET` | `/api/forecast/timesfm?symbol=RELIANCE&horizon=64` | Google TimesFM 3.0 10-quantile probabilistic forecast |
| `GET` | `/api/market/fleet` | Live 20-bot autonomous fleet telemetry and P&L status |

---

## 🚀 Local Quickstart & Production Deployment

### 1. Run with Python FastAPI Backend
```bash
# Clone the repository
git clone https://github.com/Premchandyadav369/RISKOS.git
cd RISKOS

# Install dependencies
pip install -r backend/requirements.txt

# Launch FastAPI Server
python backend/run.py
# Running at http://127.0.0.1:8000
```

### 2. Open the Front-End Workspace
Simply open `index.html`, `app.html`, `fleet.html`, or `docs.html` in any modern web browser. No complex build step or Node compilation required!

---

<div align="center">
  <sub>Built with precision for quantitative finance researchers, institutional traders, and curious minds worldwide.</sub>
</div>
