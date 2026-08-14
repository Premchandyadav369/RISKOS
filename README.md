# 🏆 RISKOS Quant — Agentic Treasury & Corporate Risk Intelligence Platform

> **JPMorgan Chase CTC Risk Innovation Target Specification**
> An institutional-grade risk command center that continuously analyzes market, credit, liquidity, capital, and interest-rate risk, runs 100,000-scenario Monte Carlo simulations, models extreme tail risks via EVT/GPD, executes CVaR portfolio optimizations, and deploys autonomous AI agents to investigate risk drivers.

---

## 🏛 Mathematically Serious Quant Algorithm Stack

RISKOS Quant is built around mathematically rigorous quantitative finance standards rather than generic machine learning heuristics:

```text
                               DATA INGESTION (YFINANCE)
                                           │
                                           ▼
                                 RETURN GENERATION
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
       GARCH(1,1) / GJR             FACTOR MODELS            HMM 4-STATE REGIME
        (Asymmetric Vol)           (NIFTY, S&P, FX)           (Low, Normal, Crisis)
                │                          │                          │
                └──────────────────────────┼──────────────────────────┘
                                           ▼
                                LEDOIT-WOLF COVARIANCE
                                  (Shrinkage Matrix)
                                           │
                                           ▼
                               MONTE CARLO SIMULATION
                            (100,000 Cholesky Scenarios)
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
          HISTORICAL VaR           PARAMETRIC / C-F            EXPECTED SHORTFALL
         (Empirical 99%)           (Cornish-Fisher)               (CVaR 99%)
                │                          │                          │
                └──────────────────────────┼──────────────────────────┘
                                           ▼
                            EXTREME VALUE THEORY (EVT / POT)
                             (Generalized Pareto Distribution)
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
      PORTFOLIO OPTIMIZATION                               STRESS TESTING ENGINE
  • Min CVaR Linear Programming                       • Historical Crash Replay
  • Equal Risk Parity                                 • 4D Greeks Sensitivity Matrix
  • Black-Litterman Equilibrium                       • Reverse Stress Test Solver (-25%)
                │                                                     │
                └──────────────────────────┬──────────────────────────┘
                                           ▼
                                MODEL VALIDATION & BACKTESTING
                             (Kupiec POF & Christoffersen Tests)
                                           │
                                           ▼
                               K2-V2 AGENTIC INVESTIGATOR
                        (MBZUAI-IFM/K2-Think-v2 Root Cause Engine)
```

---

## 🔬 Algorithm Hierarchy & Formulations

### 1. Volatility & Covariance Calibration
- **GARCH(1,1) & GJR-GARCH**: $\sigma_t^2 = \omega + (\alpha + \gamma \cdot I_{\epsilon < 0})\epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$ (Captures asymmetric leverage & volatility clustering).
- **EWMA Volatility**: $\sigma_t^2 = \lambda \sigma_{t-1}^2 + (1-\lambda) r_{t-1}^2$ ($\lambda \in \{0.94, 0.97, 0.99\}$).
- **Ledoit-Wolf Shrinkage**: $\Sigma_{shrunk} = (1-\alpha)\Sigma_{sample} + \alpha F$ (Ensures positive semi-definite matrix stability).

### 2. Tail Risk & Value-at-Risk (VaR)
- **Cornish-Fisher VaR**: Adjusts Gaussian quantiles for empirical Skewness ($S$) and Excess Kurtosis ($K$).
- **100,000-Scenario Monte Carlo**: Correlated normal random shocks via Cholesky decomposition ($L L^T = \Sigma$) across 1D, 5D, 10D, and 30D horizons.
- **Expected Shortfall (CVaR)**: $\text{ES}_\alpha = E[L \mid L > \text{VaR}_\alpha]$ (Basel III FRTB compliant).
- **Extreme Value Theory (EVT/POT)**: Fits Generalized Pareto Distribution ($G_{\xi, \beta}$) to extreme tail losses beyond 95th/99th percentiles.

### 3. Dependence & Factor Risk
- **Gaussian & Student-t Copula**: Non-linear tail dependence modeling for joint India (NIFTY) ↔ US (S&P 500) crashes.
- **Multi-Factor Decomposition**: Systematic factor regression ($R_p = \sum \beta_i F_i + \epsilon$) across Equity, FX (USD/INR), and Rates.
- **HMM 4-State Regimes**: Markov regime switching model classifying market state (Low Vol, Normal, High Vol, Crisis).

### 4. Portfolio Optimization & Attribution
- **Minimum CVaR Optimization**: Linear Programming minimizing tail loss subject to sector and country bounds.
- **Risk Parity**: Equal Risk Contribution $RC_i = w_i \frac{\partial \sigma_p}{\partial w_i}$.
- **Black-Litterman**: Blends CAPM equilibrium returns with subjective quantitative views and confidence intervals.
- **Risk Attribution**: Component VaR, Standalone VaR, and Marginal VaR.

### 5. Model Validation & Stress Testing
- **Kupiec POF & Christoffersen Tests**: Statistical binomial proportion-of-failures backtest for VaR breaches.
- **Reverse Stress Testing Solver**: Solves $\min \|\Delta S\|_{\Sigma^{-1}}$ to identify the exact macroeconomic shock vector triggering a -25% loss.
- **Black-Scholes & 4D Greeks Stressing**: Analytical Delta, Gamma, Vega, Theta, Rho under 4D shock matrices.

---

## 🤖 K2-V2 Agentic Reasoning Architecture

> **Critical Rule**: K2-V2 never performs raw mathematical calculations. Python statistical engines compute validated numerical outputs, and K2-V2 reasons over the validated output graph to generate mitigation plans.

```text
[Numerical Calculation] ──> [Evidence Graph] ──> [K2-V2 Reasoner] ──> [Executive Mitigation]
  - GARCH Vol: 24.7%           - Tech Factor: 31%   - Identifies Vol Spike    - Rebalance NVDA
  - 99% VaR: $51.9K            - NIFTY/SPX Corr: 0.74 - Detects Regime Change  - Add $15M Liquidity
```

---

## 💻 Installation & Quickstart

### 1. Backend (FastAPI + Python Quant Stack)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run_backend.py
```
*API runs at `http://127.0.0.1:8000` with interactive Swagger docs at `/docs`.*

### 2. Frontend (Next.js 14 + Bloomberg Terminal UI)
```bash
cd frontend
npm install
npm run dev
```
*Terminal interface available at `http://localhost:3000`.*

---

## ⌨️ Bloomberg Terminal Shortcut Commands

- `QDOC`: Quant Methodology & Layman's Terms Guide (18 Algorithms Explained)
- `PORT`: Portfolio Risk Overview & Basel III Capital Metrics
- `STRAT`: Autonomous Algorithmic Multi-Strategy Trading Desk (10+ Algos, Lifetime PnL)
- `CHRT`: Advanced TradingView Candlestick & Volume Charting
- `BTST`: Quantitative Risk Lab & VaR Backtesting (Kupiec / Christoffersen)
- `SWAP`: Interest Rate Swap (IRS) Derivatives Pricer
- `CDSW`: Credit Default Swap (CDS) Risk Pricer
- `YCRV`: US Treasury & Indian G-Sec Yield Curve Inversion Analytics
- `OVAL`: Black-Scholes Options Calculator & 4D Greeks Matrix
- `TSIM`: Pre-Trade Execution & Almgren-Chriss Market Impact Simulator
