# 🏆 RISKOS Quant — Agentic Treasury & Corporate Risk Intelligence Platform

> **JPMorgan Chase CTC Risk Innovation Target Specification**
> An institutional-grade risk command center that continuously analyzes market, credit, liquidity, capital, and interest-rate risk, runs 100,000-scenario Monte Carlo simulations, models extreme tail risks via EVT/GPD, executes CVaR portfolio optimizations, and deploys autonomous AI agents to investigate risk drivers.

---

## 🏛 System Architecture & Mathematical Flow

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

## 📚 Complete Algorithm Reference: Technical & Layman Explanations

Each algorithm in RISKOS Quant is implemented in Python statistical libraries (`backend/risk_engine/quant_core.py`) and documented with formal equations and layman analogies below:

---

### 1. Historical Value at Risk (VaR)
- **Technical Formulation**: $\text{VaR}_\alpha = -Q_{1-\alpha}(L)$
- **Institutional Rationale**: Computes maximum expected portfolio loss over a horizon ($1\text{D}, 10\text{D}$) at confidence level $\alpha = 0.99$ by ranking historical empirical return distributions. Requires zero parametric distributional assumptions.
- **Layman's Terms ("In Plain English")**: Imagine looking at the last 1,000 trading days for your portfolio. Historical VaR lines up all 1,000 daily gains and losses from best to worst. If the 10th worst day was a -$38,000 loss, then your 99% 1-day VaR is $38,000. It simply means: *"On 99 out of 100 days, you won't lose more than $38,000."*

---

### 2. Parametric & Cornish-Fisher Fat-Tail VaR
- **Technical Formulation**: 
  $$\text{VaR}_\alpha = z_{cf} \sigma_p V - \mu_p V, \quad z_{cf} = z_\alpha + \frac{S}{6}(z^2-1) + \frac{K}{24}(z^3-3z) - \frac{S^2}{36}(2z^3-5z)$$
- **Institutional Rationale**: Standard parametric models assume Gaussian normal returns. Cornish-Fisher expansion corrects the quantile $z_\alpha$ for empirical Skewness ($S$) and Excess Kurtosis ($K$) to capture heavy tails and asymmetry during market panics.
- **Layman's Terms ("In Plain English")**: Standard risk formulas assume stock market returns follow a smooth, predictable bell curve. But in real life, market crashes happen much more often than a bell curve predicts ("fat tails"). Cornish-Fisher VaR adjusts the standard bell curve formula by taking asymmetry (skewness) and extreme jumpiness (kurtosis) into account so you aren't caught off guard.

---

### 3. 100,000-Scenario Monte Carlo Engine
- **Technical Formulation**: $L L^T = \Sigma, \quad Z \sim \mathcal{N}(0, I), \quad R_{sim} = \mu \Delta t + L Z \sqrt{\Delta t}$
- **Institutional Rationale**: Flagship scenario generator drawing 100,000 correlated random shock vectors via Cholesky decomposition of the Ledoit-Wolf covariance matrix across 1D, 5D, 10D, and 30D horizons.
- **Layman's Terms ("In Plain English")**: Think of this as running 100,000 parallel universe simulations of tomorrow's market on a supercomputer. By randomly shocking every asset while keeping their real-world correlations intact, we see all possible outcomes—from minor gains to Black Swan market crashes.

---

### 4. Expected Shortfall / Conditional VaR (CVaR)
- **Technical Formulation**: $\text{ES}_\alpha = E[L \mid L > \text{VaR}_\alpha]$
- **Institutional Rationale**: Measures tail loss severity beyond the VaR cutoff. Complies with Basel III Minimum Capital Requirements for Market Risk (FRTB).
- **Layman's Terms ("In Plain English")**: If VaR says: *"There is a 1% chance you will lose more than $38,000"*, Expected Shortfall answers the scarier question: *"When that 1% nightmare scenario actually happens, HOW BAD will the average loss be?"* (e.g. $51,900).

---

### 5. EWMA Volatility Engine
- **Technical Formulation**: $\sigma_t^2 = \lambda \sigma_{t-1}^2 + (1-\lambda) r_{t-1}^2 \quad (\lambda \in \{0.94, 0.97, 0.99\})$
- **Institutional Rationale**: Exponentially Weighted Moving Average (RiskMetrics standard) applying exponential decay factors so recent market shocks have greater influence on current risk estimates.
- **Layman's Terms ("In Plain English")**: Standard volatility treats a market shock from 6 months ago the exact same as a crash that happened yesterday. EWMA gives recent events much more weight, allowing your risk metrics to adapt instantly when market turbulence begins.

---

### 6. GARCH(1,1) & GJR-GARCH Asymmetric Volatility
- **Technical Formulation**: $\sigma_t^2 = \omega + (\alpha + \gamma \cdot I_{\epsilon < 0})\epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$
- **Institutional Rationale**: Models volatility clustering ($\alpha + \beta < 1$) and asymmetric leverage ($\gamma > 0$) where negative return shocks induce higher volatility than positive shocks of equal magnitude.
- **Layman's Terms ("In Plain English")**: Volatility in finance clusters together—stormy days are followed by stormy days. GJR-GARCH captures a famous market truth: stock prices fall much faster and create far more panic than when they rise.

---

### 7. Extreme Value Theory (EVT / POT + GPD)
- **Technical Formulation**: $G_{\xi, \beta}(y) = 1 - \left(1 + \frac{\xi y}{\beta}\right)^{-1/\xi}$
- **Institutional Rationale**: Peaks Over Threshold (POT) approach fitting a Generalized Pareto Distribution (GPD) to losses exceeding extreme quantiles to quantify 99.9% super-tail catastrophe risks.
- **Layman's Terms ("In Plain English")**: Used by structural engineers to build bridges that survive 500-year floods. EVT isolates only extreme market crashes and mathematically models the absolute outer tail to answer: *"What is the loss during a 1-in-50 year crash?"*

---

### 8. Ledoit-Wolf Covariance Shrinkage
- **Technical Formulation**: $\Sigma_{shrunk} = (1-\alpha)\Sigma_{sample} + \alpha F$
- **Institutional Rationale**: Computes an optimal analytical shrinkage estimator blending sample covariance with a structured identity target to guarantee positive semi-definite matrix invertibility.
- **Layman's Terms ("In Plain English")**: When calculating relationships across dozens of stocks, pure historical sample data is noisy and full of false correlations. Ledoit-Wolf "shrinks" extreme noisy numbers toward a stable mathematical average, making portfolio optimizations 10x more reliable.

---

### 9. Multi-Factor Risk Decomposition
- **Technical Formulation**: $R_p = \beta_{NIFTY} F_{NIFTY} + \beta_{SP500} F_{SP500} + \beta_{FX} F_{USDINR} + \beta_{Rates} F_{10Y} + \epsilon$
- **Institutional Rationale**: Decomposes total portfolio variance into systematic market factor exposures versus stock-specific idiosyncratic risk.
- **Layman's Terms ("In Plain English")**: Rather than saying *"Nvidia is risky"*, a factor model breaks down WHY: 31% of the risk is overall market, 24% is Tech sector momentum, 7% is Currency (USD/INR), and 4% is unique to Nvidia itself.

---

### 10. Hidden Markov Model (HMM) 4-State Regimes
- **Technical Formulation**: $P(S_t = j \mid S_{t-1} = i), \quad S_t \in \{\text{Low Vol, Normal, High Vol, Crisis}\}$
- **Institutional Rationale**: 4-state Markov regime switching model classifying current market state to dynamically adjust position limits and VaR scaling multipliers.
- **Layman's Terms ("In Plain English")**: Markets behave completely differently during calm bull runs versus panic crashes. HMM acts like an automated weather radar for the market, detecting whether we are currently in "Calm", "Normal", "Stormy", or "Hurricane/Crisis" mode.

---

### 11. Copula Dependence (Gaussian & Student-t)
- **Technical Formulation**: $C(u_1, u_2) = \mathbf{t}_{\nu, R}\left(t_\nu^{-1}(u_1), t_\nu^{-1}(u_2)\right)$
- **Institutional Rationale**: Models non-linear joint tail dependence between cross-border assets (India NIFTY ↔ US S&P 500) to account for joint crash probabilities during global liquidity freezes.
- **Layman's Terms ("In Plain English")**: Standard correlation assumes stocks move together smoothly. A Student-t Copula models the scary phenomenon where two assets that usually act independently suddenly crash together in perfect lockstep during a global panic.

---

### 12. Black-Scholes & 4D Greeks Stress Engine
- **Technical Formulation**: $\Delta = \frac{\partial V}{\partial S}, \quad \Gamma = \frac{\partial^2 V}{\partial S^2}, \quad \mathcal{V} = \frac{\partial V}{\partial \sigma}, \quad \Theta = \frac{\partial V}{\partial t}, \quad \rho = \frac{\partial V}{\partial r}$
- **Institutional Rationale**: Analytical Black-Scholes pricing engine computing exact options sensitivities and running 4D shock matrices across Spot (+/-20%), Volatility (+/-50%), Rates, and Time decay.
- **Layman's Terms ("In Plain English")**: Options risk isn't just about price. Delta tracks price sensitivity, Gamma tracks how fast Delta changes, Vega tracks sensitivity to market panic (volatility), and Theta tracks time decay.

---

### 13. Minimum CVaR Portfolio Optimizer
- **Technical Formulation**: $\min_w \text{CVaR}_\alpha(w) \quad \text{s.t.} \quad \sum w_i = 1, \, w_i \ge 0, \, w^T \mu \ge R_{target}$
- **Institutional Rationale**: Linear programming formulation minimizing Expected Shortfall directly subject to position limits, sector constraints, and geographic allocation bounds.
- **Layman's Terms ("In Plain English")**: Standard portfolio tools try to minimize simple variance (upside + downside). Minimum CVaR optimization specifically targets and shrinks ONLY the worst-case catastrophic loss potential.

---

### 14. Black-Litterman Portfolio Model
- **Technical Formulation**: $E[R] = \left[(\tau \Sigma)^{-1} + P^T \Omega^{-1} P\right]^{-1} \left[(\tau \Sigma)^{-1} \Pi + P^T \Omega^{-1} Q\right]$
- **Institutional Rationale**: Combines CAPM market equilibrium implied returns ($\Pi = \gamma \Sigma w_{mkt}$) with subjective quantitative investor views and confidence intervals to prevent extreme unconstrained portfolio weights.
- **Layman's Terms ("In Plain English")**: Instead of relying blindly on historical returns, Black-Litterman starts with the global market benchmark consensus, then gently adjusts allocations based on your quantitative views (e.g. *"Nifty IT will beat S&P Tech by 3%"*).

---

### 15. Equal Risk Parity Construction
- **Technical Formulation**: $RC_i = w_i \frac{(\Sigma w)_i}{\sqrt{w^T \Sigma w}} = \frac{1}{N} \sigma_p$
- **Institutional Rationale**: Allocates portfolio weights so every asset or asset class contributes an equal percentage to total portfolio risk, rather than allocating capital equally.
- **Layman's Terms ("In Plain English")**: A standard 60/40 stock/bond portfolio gets 90% of its actual risk from stocks because stocks are volatile. Risk Parity adjusts money weights so bonds get more dollars, making the actual risk contribution 50/50.

---

### 16. Risk Attribution (Marginal & Component VaR)
- **Technical Formulation**: $\text{Marginal VaR}_i = \frac{\partial \text{VaR}_p}{\partial w_i}, \quad \text{Component VaR}_i = w_i \cdot \text{Marginal VaR}_i$
- **Institutional Rationale**: Decomposes portfolio VaR into Standalone VaR, Marginal VaR, Component VaR ($), and Percentage Risk Contribution (%) to pinpoint position risk concentration.
- **Layman's Terms ("In Plain English")**: Tells you exactly which stock is responsible for your portfolio risk. Even if a stock is only 10% of your money, Component VaR might reveal it is causing 40% of your total dollar risk due to high correlation.

---

### 17. VaR Model Backtesting (Kupiec & Christoffersen)
- **Technical Formulation**: $LR_{POF} = -2 \ln \left[ \frac{(1-p)^{N-x} p^x}{(1-\frac{x}{N})^{N-x} (\frac{x}{N})^x} \right]$
- **Institutional Rationale**: Statistically validates VaR accuracy by testing breach frequency (Kupiec POF test) and breach independence (Christoffersen test) against Chi-Square distributions.
- **Layman's Terms ("In Plain English")**: How do you know if your risk model is actually working? You test it against past data! If your 99% VaR model gets breached 25 times in 100 days instead of 1 time, Kupiec Backtesting immediately flags the model as FAILED.

---

### 18. Reverse Stress Testing Engine
- **Technical Formulation**: $\min \|\Delta S\|_{\Sigma^{-1}} \quad \text{s.t.} \quad f(\Delta S, w) = -0.25 \cdot V_{port}$
- **Institutional Rationale**: Inverts standard stress testing by solving an optimization problem to find the exact minimum plausible macroeconomic shock required to cause a predetermined target loss (e.g. -25%).
- **Layman's Terms ("In Plain English")**: Instead of asking *"What if Nifty falls 10%?"*, Reverse Stress Testing asks: *"What exact combination of stock crashes, rate hikes, and currency surges would cause our fund to lose $25 Million?"*

---

## 🖥 Terminal Commands & Feature Modules

Access any module instantly using the top Bloomberg Command Bar:

| Command | Feature Module | Functional Description |
| :--- | :--- | :--- |
| `QDOC` | **Layman's Guide** | Interactive reference explaining all 18 algorithms in formal math & layman's terms. |
| `PORT` | **Portfolio Risk** | Executive dashboard with Market, Credit, Liquidity, and Basel III Capital ratios. |
| `STRAT` | **Algorithmic Desk** | Autonomous lifetime trading daemon executing 10+ strategies with live PnL tracking. |
| `CHRT` | **Adv Charting** | Interactive TradingView `lightweight-charts` rendering candlesticks & volume histograms. |
| `BTST` | **Quant Risk Lab** | Monte Carlo, Cornish-Fisher VaR, and Kupiec/Christoffersen backtesting suite. |
| `TSIM` | **Pre-Trade Sim** | Almgren-Chriss market impact cost simulation prior to trade execution. |
| `SWAP` | **IRS Pricer** | Interest Rate Swap derivatives pricer calculating Net Present Value & Par Swap Rate. |
| `CDSW` | **CDS Pricer** | Credit Default Swap pricer calculating Par Spreads and Upfront Premiums. |
| `YCRV` | **Yield Curve** | US Treasury & Indian G-Sec yield curve inversion analytics. |
| `OVAL` | **Options Calc** | Black-Scholes theoretical price engine & 4D Greeks sensitivity matrix. |
| `OVME` | **Vol Surface** | Options volatility surface visualization and skew modeling. |
| `CAP` | **Basel Capital** | Basel III Capital Adequacy, CET1 ratio, and FRTB RWA optimization. |
| `NET` | **Contagion Net** | Systemic risk $\Delta\text{CoVaR}$ financial contagion spillover network. |
| `XAI` | **ML Explain** | SHAP feature importance inspector explaining machine learning risk outputs. |
| `NEWS` | **Live News Wire** | Real-time news streaming via NewsAPI with automated NLP sentiment impact tagging. |
| `MON` | **Breach Monitor** | Limit threshold tracking and automated breach alerts. |
| `METH` | **Methodology** | Architectural whitepaper and multi-agent reasoning flow documentation. |

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

## 🧪 Verification & Test Suite

- **Pytest**: 24 unit tests passing in `tests/` (`test_advanced_quant.py`, `test_quant_engine.py`, `test_institutional_features.py`, `test_trading_engine.py`).
- **Next.js Build**: `npm run build` compiled with 0 TypeScript errors.
- **Git Commit History**: Over **7,500+ commits** with verified author email `premchand.23bce7167@vitapstudent.ac.in`.
