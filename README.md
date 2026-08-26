# RISKOS — Institutional Quantitative Trading & Analytics Terminal

> An advanced quantitative analytics and execution platform designed for proprietary trading desks, asset managers, and quantitative researchers (**Futures First, Tower Research, Optiver, Jane Street, Citadel Securities**).

---

## 📖 Complete Feature Guide: Plain English & Quant Formulations

---

### Desk 1: Market Intelligence & Volatility Clustering

#### 💡 In Plain English
Markets don't experience the same risk every day. After a major crash or surprise news event, turbulent volatility sticks around for days—a phenomenon known as **volatility clustering**. The Market Intelligence desk measures the "momentum of market fear" using GARCH models so traders don't over-leverage during stormy periods. Concurrently, a **Hidden Markov Model (HMM)** acts like an invisible weather satellite: it scans price movements to detect whether the market is currently in a sunny **Bullish** trend, a turbulent **Bearish** decline, or a foggy **Sideways** consolidation.

#### 🧮 The Quantitative Mathematics
- **GARCH(1,1) Conditional Volatility**: Estimates time-varying variance via Maximum Likelihood:
  $$\sigma_t^2 = \omega + \alpha \epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$$
  where $\alpha + \beta < 1$ determines volatility persistence.
- **3-State Gaussian Hidden Markov Model**: Unsupervised Baum-Welch training and Viterbi state path decoding identifying latent macroeconomic states $S_t \in \{\text{Bull}, \text{Bear}, \text{Sideways}\}$.
- **Ledoit-Wolf Covariance Shrinkage**: Optimal linear combination of the sample covariance matrix $S$ and a structured constant-correlation target $F$:
  $$\Sigma_{\text{LW}} = \delta F + (1 - \delta) S$$
  preventing ill-conditioned matrix inversion in portfolio optimization.

---

### Desk 2: Portfolio Tail Risk & CVaR Optimization

#### 💡 In Plain English
Traditional finance tools only tell you your "average risk." But on Wall Street, average risk doesn't destroy funds—**tail risk (unforeseen disasters)** does. 
- **Value at Risk (VaR 99%)** answers: *"On 99 out of 100 days, what is the maximum amount I could lose?"*
- **Expected Shortfall (CVaR 99%)** answers the critical question regulators care about: *"On the 1 day things go catastrophically wrong, how bad will the average loss actually be?"*
- Our **CVaR Optimizer** builds a portfolio that specifically protects your capital against those worst 1% crash days rather than penalizing upside gains.

#### 🧮 The Quantitative Mathematics
- **Monte Carlo VaR & CVaR**: Simulates 10,000 correlated return vectors from multivariate distribution $\mathcal{N}(\mu, \Sigma_{\text{LW}})$ and computes Expected Shortfall:
  $$\text{CVaR}_\alpha = \mathbb{E}[L \mid L > \text{VaR}_\alpha]$$
- **Rockafellar-Uryasev CVaR Optimization (SLSQP)**: Minimizes tail loss subject to weights summing to 1 and maximum asset bounds:
  $$\min_{w} F_\alpha(w, \zeta) = \zeta + \frac{1}{1-\alpha} \mathbb{E}\left[ [-w^T R - \zeta]^+ \right]$$
- **Kupiec POF & Christoffersen Tests**: Likelihood ratio tests verifying unconditional binomial coverage ($LR_{\text{uc}}$) and first-order Markov independence of exception clusters ($LR_{\text{ind}}$) under Basel III standards.

---

### Desk 3: Futures Spread & Yield Curve Rates Desk *(Futures First Specialty)*

#### 💡 In Plain English
Individual stock and commodity prices fluctuate randomly, but economic relationships between pairs of assets (like Brent Crude vs. WTI Crude, or 2-Year vs. 10-Year Treasury bonds) act like they are connected by a rubber band. When the price spread stretches too far, it inevitably snaps back to its historical average. 
- **Kalman Filter**: Continuously recalibrates the exact number of contracts to trade in real time without lag.
- **Ornstein-Uhlenbeck (OU) Half-Life**: Calculates the exact number of days until the spread reverts to equilibrium.
- **Yield Curve Desk**: Fits continuous interest rate curves across 3M to 30Y Treasuries, tracking the 2s10s slope and 2s5s10s butterfly curve shapes.

#### 🧮 The Quantitative Mathematics
- **Kalman Filter Dynamic Hedge Ratio**: Online recursive state-space hedge estimation:
  $$\beta_t = \beta_{t-1} + w_t, \quad y_t = \alpha_t + \beta_t x_t + v_t$$
  Updates $\beta_t$ using the recursive Kalman gain $K_t = P_t F_t^T (F_t P_t F_t^T + V_e)^{-1}$.
- **Ornstein-Uhlenbeck (OU) Continuous Process**:
  $$d S_t = \theta (\mu - S_t) dt + \sigma dW_t \implies \tau_{\text{half-life}} = \frac{\ln 2}{\theta}$$
- **Nelson-Siegel-Svensson (NSS) Zero Curve**:
  $$y(t) = \beta_0 + \beta_1 \left(\frac{1 - e^{-t/\tau_1}}{t/\tau_1}\right) + \beta_2 \left(\frac{1 - e^{-t/\tau_1}}{t/\tau_1} - e^{-t/\tau_1}\right) + \beta_3 \left(\frac{1 - e^{-t/\tau_2}}{t/\tau_2} - e^{-t/\tau_2}\right)$$
- **Yield Curve PCA**: Decomposes 99%+ of yield curve movements into **Level (Shift ~86%)**, **Slope (Twist ~11%)**, and **Curvature (Butterfly ~3%)**.

---

### Desk 4: Market Microstructure & Order Flow Imbalance (OFI)

#### 💡 In Plain English
When you place a trade, you are competing in a live queue of thousands of bids and asks in the exchange order book. If 10,000 shares are waiting on the bid and only 500 shares are on the ask, heavy buying pressure will cause an upward price move in milliseconds.
- **Order Flow Imbalance (OFI)**: Measures net top-of-book volume pressure.
- **Micro-Price**: The true fair price weighted by bid/ask queue sizes.
- **VPIN Toxicity**: Warns market makers when aggressive institutional informed flow is active so they don't get front-run.
- **Almgren-Chriss Engine**: Slices large institutional trades over time to minimize market impact slippage while limiting exposure to market volatility.

#### 🧮 The Quantitative Mathematics
- **Order Flow Imbalance (OFI)**:
  $$\text{OFI}_t = I_{\{P_{b,t} \ge P_{b,t-1}\}} v_{b,t} - I_{\{P_{b,t} \le P_{b,t-1}\}} v_{b,t-1} - I_{\{P_{a,t} \le P_{a,t-1}\}} v_{a,t} + I_{\{P_{a,t} \ge P_{a,t-1}\}} v_{a,t-1}$$
- **Micro-Price Estimator**:
  $$P_{\text{micro}} = \frac{Q_b P_a + Q_a P_b}{Q_b + Q_a}$$
- **Volume-Synchronized Probability of Toxicity (VPIN)**:
  $$\text{VPIN} = \frac{\sum_{\tau=1}^N |V_\tau^B - V_\tau^S|}{N \cdot V}$$
- **Almgren-Chriss Optimal Liquidation Trajectory**:
  $$x_j = \frac{\sinh(\kappa (T - t_j))}{\sinh(\kappa T)} X, \quad \kappa \approx \sqrt{\frac{\lambda \sigma^2}{\eta}}$$

---

### Desk 5: Derivatives, Volatility Surface & Greeks Lab

#### 💡 In Plain English
Options market makers don't gamble on stock direction—they sell options and continuously hedge by buying or selling the underlying stock to remain **Delta Neutral ($\Delta = 0$)**.
- **First-Order Greeks**: $\Delta$ (direction), $\text{Vega}$ (volatility sensitivity), $\Theta$ (daily time decay).
- **Cross-Greeks (Vanna, Volga, Charm)**: Tell traders how their hedge changes when volatility moves or time elapses.
- **Delta-Hedging Simulator**: Replays 30 trading days of discrete stock rebalancing with slippage and transaction costs.

#### 🧮 The Quantitative Mathematics
- **Black-Scholes-Merton Analytical Formulation**:
  $$C = S N(d_1) - K e^{-rT} N(d_2), \quad d_1 = \frac{\ln(S/K) + (r + \frac{1}{2}\sigma^2)T}{\sigma \sqrt{T}}$$
- **Analytical 2nd-Order Cross-Greeks**:
  $$\text{Vanna} = \frac{\partial^2 V}{\partial S \partial \sigma} = -\frac{\phi(d_1) d_2}{\sigma}, \quad \text{Volga} = \frac{\partial^2 V}{\partial \sigma^2} = \text{Vega} \frac{d_1 d_2}{\sigma}, \quad \text{Charm} = \frac{\partial \Delta}{\partial t}$$
- **Discrete Dynamic Delta-Hedging**: Simulates replication error $\epsilon_T = \Pi_T - \max(S_T - K, 0)$ across geometric Brownian motion paths.

---

### Desk 6: PnL Attribution & Systematic Risk Parity

#### 💡 In Plain English
If your trading book generated a 20% return, did you make money because you picked winning individual stocks (Selection Effect) or because you happened to be overweight in a surging sector (Allocation Effect)?
- **Brinson-Fachler Attribution**: Unpacks whether returns came from skill or luck.
- **Risk Parity**: Amateurs invest equal dollars in every stock ($20,000 each), which causes volatile stocks to dominate total risk. Risk Parity instead weights assets inversely to their volatility so every single holding contributes the exact same amount of risk.
- **Fractional Kelly Criterion**: Mathematical formula determining the optimal leverage multiplier to maximize compound growth while preventing severe drawdowns.

#### 🧮 The Quantitative Mathematics
- **Brinson-Fachler Active Return Decomposition**:
  $$\text{Allocation} = \sum (w_{p,i} - w_{b,i})(R_{b,i} - R_b), \quad \text{Selection} = \sum w_{b,i}(R_{p,i} - R_{b,i}), \quad \text{Interaction} = \sum (w_{p,i} - w_{b,i})(R_{p,i} - R_{b,i})$$
- **Equal Risk Contribution (Risk Parity)**:
  $$\text{RC}_i = w_i \frac{(\Sigma w)_i}{\sqrt{w^T \Sigma w}} = \frac{1}{N} \sqrt{w^T \Sigma w} \quad \forall i$$
- **Multi-Asset Fractional Kelly Allocation**:
  $$F^* = \kappa \cdot \Sigma^{-1} \mu$$

---

## ⚡ How to Run the Platform

### 1. Launch the Python Quantitative Backend
```bash
cd backend
python run.py
```
*The FastAPI backend will start on `http://127.0.0.1:8000` (Interactive API documentation available at `http://127.0.0.1:8000/docs`).*

### 2. Launch the Institutional Terminal
- Open `index.html` in your browser and click **"Launch Quant Terminal"** (or open `app.html` directly).
- Enter any tickers (e.g., `AAPL, MSFT, GOOGL, AMZN, JPM, NVDA`) and click **"Run Models"**.

---

## 👤 Author
**Premchand Yadav** — [GitHub Repository](https://github.com/Premchandyadav369/RISKOS)
