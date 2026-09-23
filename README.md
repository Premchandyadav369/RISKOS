# RISKOS ⚡ — Financial Intelligence OS

> An AI-native financial intelligence platform built for equity research, event-driven causality, risk analytics, and mathematical explainability.

[![Live Demo](https://img.shields.io/badge/Live_App-riskos--psi.vercel.app-black?style=flat&logo=vercel)](https://riskos-psi.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Latency](https://img.shields.io/badge/SLSQP_Latency-%3C5ms-brightgreen.svg)]()
[![Market Surveillance](https://img.shields.io/badge/Surveillance-NSE%20%7C%20NYSE-orange.svg)]()

---

## Overview

Most financial analytics dashboards output static scores (Beta, Sharpe Ratio, VaR) as opaque black boxes. **RISKOS** is designed around a single principle: **Never output a metric without proving the underlying mathematical derivation.**

From retail investors tracking NIFTY 50 / S&P 500 equities to quants running parametric portfolio optimization, RISKOS provides real-time surveillance with multi-layered depth.

---

## Key Capabilities

- **Mathematical Explainability ("Why This Number?"):** Every statistical output can be inspected down to its raw empirical formula, rolling log-return sample window (252 trading days), and regime assumptions.
- **Sub-5ms SLSQP Optimizer:** Real-time constrained portfolio variance minimization:
  $$
  \min_w w^T \Sigma w \quad \text{s.t.} \quad \sum w_i = 1, \quad w_i \ge 0
  $$
- **Dual-Market Surveillance:** Simultaneous NSE (₹ INR / IST) and NYSE ($ USD / EST) live order flow and multi-factor causal attribution.
- **Adaptive UX Engine:** Dynamic perspective switching between:
  - `Beginner`: Intuitive English analogies & plain-language risk summaries.
  - `Investor`: Corporate filing attribution, balance sheet metrics, and sector momentum.
  - `Quant`: GARCH(1,1) volatility clustering, 99% Parametric VaR, and raw matrix calculations.
- **Universal Command Bar:** Raycast/Linear-style keyboard-driven navigation (`ESC`, `↑ / ↓`, `↵`, `⌘K`).
- **8 Institutional Quantitative Desks:** End-to-end coverage across Market Intelligence, Tail Risk / CVaR, Yield Curve Carry, L2/L3 Order Book DOM, Derivatives & SVI Vol Surface, Signals & Execution, AI Speculations, and Sector Quant Indicators.
- **React Bits Hyperspeed Engine:** High-performance WebGL warp highway simulation with dynamic shaders and interactive click-to-accelerate speedup mechanics.

---

## System Architecture

```mermaid
graph TD
    A[Tick Streams / Historical Data] --> B[Data Normalization Layer]
    B --> C[NSE / NYSE Market Clocks]
    B --> D[Compute Engine]
    D --> E[SLSQP Optimizer <5ms]
    D --> F[GARCH / VaR Risk Core]
    D --> G[Causal Attribution Model]
    E & F & G --> H[Generative Financial Canvas]
    H --> I[Adaptive UI: Beginner | Investor | Quant]
```

---

## Institutional Documentation Ecosystem

For comprehensive mathematical proofs, API specifications, and bot fleet manuals:
- 🏛️ [System Architecture Specification](docs/ARCHITECTURE.md) — Multi-tier pipeline, event bus, and data normalization specs.
- 🤖 [Autonomous Bot Fleet Manual](docs/BOT_FLEET.md) — 41 algorithmic bots across Greek, Norse, and Egyptian pantheons.
- 🔬 [80 Quantitative Simulation Laboratories](docs/QUANT_LABS.md) — Stochastic calculus, Heston FFT, SABR, EVT, and microstructure labs.
- 📐 [Comprehensive System Specifications](docs/SYSTEM_SPEC.md) — SEC Rule 15c3-5 pre-trade Defcon, FIX 4.4 tag dictionary, and audit ledgers.
- 🔌 [REST & WebSocket API Reference](docs/API.md) — High-throughput endpoints, query schemas, and calculation engines.

---

## Getting Started

### Prerequisites

* Node.js >= 18.x or Modern Browser

### Local Installation

```bash
git clone https://github.com/Premchandyadav369/RISKOS.git
cd RISKOS
# If static/Vite/Next:
npm install
npm run dev
```

---

## Benchmark & Performance Verification

| Metric | Algorithm / Model | Latency | Verification Basis |
| --- | --- | --- | --- |
| **Portfolio Optimization** | Sequential Least Squares Programming (SLSQP) | `< 4.8ms` | 50-asset covariance matrix |
| **Vol Clustering** | GARCH(1,1) Formulation | `< 2.1ms` | 252-day log returns |
| **Downside Risk** | Parametric 99% 1-Day VaR | `< 1.2ms` | Continuous distribution fitting |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Authorship & Provenance

Made by Humans on Earth &bull; Assembled by **[Premchand Yadav](https://premchandyadav1.vercel.app/)**  
Live App: [https://riskos-psi.vercel.app/](https://riskos-psi.vercel.app/)  
Repository: [https://github.com/Premchandyadav369/RISKOS](https://github.com/Premchandyadav369/RISKOS)
