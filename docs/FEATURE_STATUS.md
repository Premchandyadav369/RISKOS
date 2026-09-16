# RISKOS Feature Maturity & Verification Matrix

This document provides a transparent, scientifically honest classification of all RISKOS capabilities by operational maturity.

| Classification | Meaning | Production Readiness |
| :--- | :--- | :--- |
| **STABLE** | Fully tested, mathematically verified, backed by historical and live feeds. | Production / Live Research |
| **RESEARCH** | Advanced quantitative methodology requiring user calibration or parameter tuning. | Institutional Research |
| **SIMULATED** | High-fidelity stochastic, deterministic, or agentic simulated environment. | Scenario & Stress Testing |
| **EDUCATIONAL** | Pedagogical interactive laboratory illustrating mathematical mechanics. | Educational / Interactive Learning |

---

## 1. Trading Desks (`app.html`, `portfolio_optimizer.html`)
| Desk / Component | Operational Status | Underlying Engines | Data Source |
| :--- | :--- | :--- | :--- |
| Desk 1: Market Intelligence | **STABLE** | `market_aggregator.py`, `garch_volatility.py` | Multi-Provider Live / Delayed Fallback |
| Desk 2: Risk Engine | **STABLE** | `calculate_var`, `ledoit_wolf_shrinkage` | Historical Log Returns |
| Desk 3: Signals & Execution | **RESEARCH** | `detect_regime` (Gaussian HMM), `simulate_execution` | Live / Synthetic Microstructure |
| Desk 4: Spreads & Yield Curves | **STABLE** | `analyze_spread`, `Nelson-Siegel-Svensson` | Sovereign Yield Benchmarks |
| Desk 5: Microstructure & Flow | **RESEARCH** | `OFI`, `VPIN`, `Kyle's Lambda` | L2 / Synthetic Depth Order Book |
| Desk 6: Derivatives & Surface | **STABLE** | `Black-Scholes-Merton`, `SVI Volatility Mesh` | Options Chain / Calibrated Vol Grid |
| Desk 7: AI Speculations & Quantiles | **RESEARCH** | `TimesFM 3.0`, `Prophet GAM`, `Merton MC` | Multi-Quantile Transformer & Jump Diffusion |
| Desk 8: Unified Portfolio Optimizer | **STABLE** | `cvar_optimize`, `max_sharpe`, `HRP`, `Black-Litterman` | Covariance Matrix & User Views |

---

## 2. Institutional Quant Laboratories (`learn.html` - 65 Labs)
All 65 laboratories operate in **EDUCATIONAL** & **SIMULATED** modes, providing dual Layman explanations alongside rigorous LaTeX mathematical derivations and deterministic evaluations:
- Quantitative Portfolio Theory: Markowitz, Black-Litterman, HRP, Kelly Criterion (**EDUCATIONAL / STABLE MATH**)
- Derivatives & Exotic Options: Black-Scholes, Greeks, SABR, 0DTE GEX Pinning (**EDUCATIONAL / STABLE MATH**)
- Fixed Income & Credit: Duration, Convexity, OAS Binomial Tree, Merton Structural Credit, CLO Tranche Waterfall (**EDUCATIONAL / STABLE MATH**)
- Risk Management & Extreme Value Theory: Solvency II Catastrophe EVT, Hawkes Self-Exciting Flash Crash, Kupiec POF (**EDUCATIONAL / STABLE MATH**)
- Corporate Finance & Valuation: LBO 5-Year Waterfall, Gordon Growth DDM, WACC (**EDUCATIONAL / STABLE MATH**)

---

## 3. Autonomous Bot Fleet (`fleet.html` - 21 Bots)
The 21 autonomous bots operate in **SIMULATED / RESEARCH** paper trading environments with full risk guardrails:
- Execution Bots (TWAP, VWAP, Iceberg Hunter, Smart Order Router): **RESEARCH**
- Statistical Arbitrage & Market Making: **RESEARCH / SIMULATED**
- Macro & Risk Guardrail Bots (Circuit Breaker, Defcon Matrix, Volatility Hedger): **STABLE GUARDRAILS**
