# RISKOS — Institutional Quantitative Trading & Analytics Platform

> Built for proprietary trading desks and institutional quantitative research (**Futures First, Jane Street, Optiver, Tower Research**). Features Kalman filter cointegrated spreads, Nelson-Siegel yield curve PCA, Order Flow Imbalance (OFI), cross-Greeks (Vanna, Volga, Charm), and CVaR portfolio optimization.

---

## 🏛️ Six Quantitative Trading Desks

### 1. Market Intelligence & Volatility Desk
- **EWMA & GARCH(1,1)**: Maximum Likelihood Estimation of conditional volatility $\sigma_t^2 = \omega + \alpha \epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$.
- **3-State Gaussian HMM**: Baum-Welch training and Viterbi decoding detecting latent Bull, Bear, and Sideways regimes.
- **Ledoit-Wolf Covariance**: Optimal analytical shrinkage of sample covariance toward constant correlation.

### 2. Portfolio Risk & Tail Analytics Desk
- **Monte Carlo VaR & CVaR (99%)**: 10,000-path correlated simulation computing Expected Shortfall.
- **CVaR Portfolio Optimization**: Non-linear SLSQP optimization minimizing tail risk under weight bounds.
- **Walk-Forward Backtesting**: Rebalanced portfolio simulation with 10bps transaction cost drag.
- **Macro Stress Testing**: Instantaneous rate spikes (+300bps), equity crashes (-40%), and credit contagion shocks.
- **Regulatory Model Validation**: Kupiec POF coverage and Christoffersen independence tests for Basel III compliance.

### 3. Futures & Rates Desk *(Futures First Specialty)*
- **Kalman Filter Dynamic Hedge Ratio ($\beta_t$)**: Online state-space estimation avoiding static OLS regression lag.
- **Ornstein-Uhlenbeck (OU) Mean Reversion**: Exact Half-life calculation $\tau = \frac{\ln 2}{\theta}$ and rolling z-score signals.
- **Nelson-Siegel-Svensson (NSS) Yield Curve**: Continuous zero-coupon curve fitting from 3M to 30Y tenors.
- **Yield Curve PCA Decomposition**: Level (86.4%), Slope / 2s10s (10.8%), and Curvature / 2s5s10s Butterfly (2.8%).

### 4. Market Microstructure & Order Flow Desk
- **Order Flow Imbalance (OFI)**: Real-time net volume pressure at the top of the limit order book.
- **Micro-Price Estimator**: Fair value incorporation of bid-ask depth queue sizes ($P_{\text{micro}} = \frac{Q_b P_a + Q_a P_b}{Q_b + Q_a}$).
- **VPIN (Volume-Synchronized Probability of Toxicity)**: Flow toxicity metric for adverse selection detection.
- **Almgren-Chriss Optimal Execution**: Dynamic liquidation trajectory balancing market impact vs timing risk.

### 5. Derivatives, Volatility Surface & Greeks Lab
- **1st & 2nd Order Analytical Greeks**: Exact Black-Scholes formulas for $\Delta$, $\Gamma$, $\text{Vega}$, $\Theta$, and $\rho$.
- **Cross-Greeks (Vanna, Volga, Charm)**: Surface risk management ($\frac{\partial^2 V}{\partial S \partial \sigma}$, $\frac{\partial^2 V}{\partial \sigma^2}$, $\frac{\partial \Delta}{\partial t}$).
- **Volatility Smile / Skew**: Parametric SVI / SABR curvature across strike moneyness ($0.8\times$ to $1.2\times$).
- **Discrete Delta-Hedging Simulator**: Dynamic daily replication PnL with transaction costs.

### 6. PnL Attribution & Systematic Allocation Desk
- **Brinson-Fachler Attribution**: Allocation, Selection, and Interaction effect decomposition.
- **Equal Risk Contribution (Risk Parity)**: Equalizes marginal risk contributions across assets.
- **Multi-Asset Fractional Kelly Criterion**: Optimal geometric growth sizing with leverage capping.
- **Institutional Execution Simulator**: VWAP/TWAP order slicing with slippage tracking.

---

## 📁 Repository Structure

```text
RISKOS/
├── index.html                    # Prop-desk landing page
├── styles.css                    # Landing page styling
├── main.js                       # Landing page animations & mobile menu
├── app.html                      # 6-desk institutional quant dashboard
├── app.css                       # High-density dark terminal styling
├── app.js                        # Dynamic Chart.js visualizations & API integration
├── assets/logo.webp              # Brand logo mark
├── fonts/GeistPixel-Circle.woff2 # Dot-matrix display font
└── backend/
    ├── requirements.txt          # Quant dependencies (arch, hmmlearn, scipy, etc.)
    ├── run.py                    # Server runner
    ├── api/main.py               # REST API router
    └── engine/
        ├── market.py             # Live OHLCV & log-returns via yfinance
        ├── volatility.py         # EWMA & GARCH(1,1)
        ├── regime.py             # 3-State Hidden Markov Model
        ├── correlation.py        # Correlation matrix with Ledoit-Wolf
        ├── risk.py               # Historical/Parametric/Monte Carlo VaR & CVaR
        ├── covariance.py         # Covariance shrinkage
        ├── optimizer.py          # CVaR portfolio optimizer (SLSQP)
        ├── backtest.py           # Walk-forward daily rebalancing engine
        ├── stress.py             # Macro scenario stress testing
        ├── validation.py         # Kupiec & Christoffersen tests
        ├── signals.py            # Regime-adaptive signals
        ├── execution.py          # VWAP order routing simulator
        ├── spreads.py            # Kalman filter hedge ratio & OU half-life
        ├── rates.py              # Nelson-Siegel-Svensson & Yield Curve PCA
        ├── microstructure.py     # OFI, Micro-Price, VPIN, Almgren-Chriss
        ├── derivatives.py        # Black-Scholes, Cross-Greeks, Vol Smile, Delta Hedging
        └── attribution.py        # Brinson-Fachler, Risk Parity, Fractional Kelly
```

---

## ⚡ Quick Start

### 1. Run the Python Backend
```bash
cd backend
python run.py
```
*Backend runs on `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

### 2. Launch the Terminal
- Open `index.html` and click **"Launch Quant Terminal"** (or open `app.html` directly in any modern browser).
- Enter tickers (e.g. `AAPL, MSFT, GOOGL, AMZN, JPM, NVDA`) and click **"Run Models"**.

---

## 👤 Author
**Premchand Yadav** — [GitHub Profile](https://github.com/Premchandyadav369)
