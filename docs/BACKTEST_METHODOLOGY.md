# RISKOS Institutional Backtesting Methodology & Friction Standards

**Standard**: Production Quantitative Execution & Realistic Market Simulation  
**Status**: CANONICAL PRODUCTION METHODOLOGY  

---

## 1. Core Backtest Mandates

Backtest overfitting and unrealistic simulation assumptions are the primary failure modes in quantitative finance. RISKOS enforces an institutional backtesting protocol calibrated to real-world exchange mechanics.

---

## 2. Execution Lag & Signal Bar Timing

1. **Bar-Close Signal Generation**:
   A trading signal computed on bar $t$ utilizes features strictly observed up to and including the close of bar $t$.
2. **Next-Bar Execution**:
   Orders are queued for execution on bar $t+1$ at either:
   - **Market Open Price**: $P_{t+1}^{\text{open}}$
   - **Volume-Weighted Average Price (VWAP)**: $P_{t+1}^{\text{vwap}}$
3. **Zero Same-Bar Execution**:
   Same-bar execution ($P_t^{\text{close}}$ fills) is strictly prohibited to eliminate lookahead bias and unachievable latency assumptions.

---

## 3. Dynamic Slippage & Market Impact Modeling

Execution slippage is modeled using the structural framework of **Almgren and Chriss (2000)**:

$$\text{Total Friction (bps)} = \text{Half Spread} + \text{Fixed Broker Fee} + \text{Market Impact}$$

### Nonlinear Temporary Market Impact
$$\text{Impact (bps)} = \gamma \cdot \sigma_{\text{daily}} \cdot \sqrt{\frac{V_{\text{order}}}{\text{ADV}_{20}}}$$

Where:
- $\sigma_{\text{daily}}$: 20-day annualized Garman-Klass or Parkinson volatility.
- $V_{\text{order}}$: Intended order share quantity.
- $\text{ADV}_{20}$: 20-day Average Daily Volume.
- $\gamma$: Calibrated exchange liquidity coefficient ($0.10 \le \gamma \le 0.35$).

### Liquidity Participation Cap
Order sizes exceeding **5% of 20-day ADV** are rejected or automatically split across multiple trading sessions via VWAP/TWAP execution algorithms to prevent catastrophic liquidity consumption.

---

## 4. Realistic Exchange Fee & Regulatory Tax Schedules

Every backtest incorporates exact jurisdictional fee structures:

### Indian Equities (NSE / BSE Delivery & Intraday)
- **Securities Transaction Tax (STT)**: 0.1% on delivery buys and sells; 0.025% on intraday sells.
- **Exchange Turnover Charges**: 0.00345% of total turnover.
- **SEBI Regulatory Charges**: ₹10 per crore turnover.
- **Stamp Duty**: 0.015% on buy turnover.
- **Goods & Services Tax (GST)**: 18% on (Brokerage + Exchange Turnover Charges + SEBI Fees).

### US Equities (NYSE / NASDAQ)
- **SEC Section 31 Fee**: $27.80 per million dollars of sell principal.
- **FINRA Trading Activity Fee (TAF)**: $0.000166 per share (capped at $8.30 per trade).
- **Clearing & Exchange Execution**: $0.0030 per share base.

---

## 5. Survivorship Bias Mitigation

Backtesting exclusively on currently listed index constituents inflates historical performance by 150–300 bps annually. RISKOS mitigates survivorship bias by:
1. Incorporating delisted equities into point-in-time universe snapshots.
2. Modeling delisting terminal payoffs (zero for liquidation, target acquisition value for cash mergers).
3. Point-in-time fundamental data caching without restated lookahead revisions.
