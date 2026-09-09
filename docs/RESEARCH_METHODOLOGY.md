# RISKOS Quantitative Research Methodology & Forecasting Standards

**Standard**: Institutional Quantitative Finance, Asset Pricing & Statistical Forecasting  
**Author**: RISKOS Quantitative Research Division  
**Status**: CANONICAL PRODUCTION METHODOLOGY  

---

## 1. Research Philosophy & Anti-Fabrication Principles

Systematic quantitative finance requires absolute empirical rigor. At RISKOS, models are never evaluated against empty air or heuristic multipliers. Every predictive model must outperform standardized non-parametric and parametric benchmarks out-of-sample under identical information sets.

### Zero-Lookahead Mandate
At forecast timestamp $t$, the information filtration $\mathcal{F}_t = \sigma(X_s, s \le t)$ strictly contains data available at or before $t$. No future labels, corporate actions, or revisions are permitted into model features.

---

## 2. Mandatory Forecasting Baselines

Every predictive algorithm deployed across RISKOS is benchmarked against four canonical statistical baselines:

### 1. Random Walk (No-Change) Baseline
$$\hat{y}_{t+h}^{\text{RW}} = y_t$$
Assumes the price process follows a martingale: $\mathbb{E}[y_{t+h} | \mathcal{F}_t] = y_t$.

### 2. Constant Drift Baseline
$$\hat{y}_{t+h}^{\text{Drift}} = y_t + h \cdot \hat{\mu}, \quad \hat{\mu} = \frac{1}{T-1} \sum_{i=2}^T (y_i - y_{i-1})$$
Extrapolates the historical sample mean increment over the lookback horizon.

### 3. Historical Unconditional Mean Baseline
$$\hat{y}_{t+h}^{\text{Mean}} = \bar{y} = \frac{1}{T} \sum_{i=1}^T y_i$$
Represents strong mean reversion toward historical sample levels.

### 4. Exponentially Weighted Moving Average (EMA-20)
$$\hat{y}_{t+h}^{\text{EMA}} = S_t, \quad S_t = \alpha y_t + (1 - \alpha) S_{t-1}, \quad \alpha = \frac{2}{21}$$
Captures short-term exponential smoothing of recent price momentum.

---

## 3. Forecast Evaluation Metrics

Models are evaluated across 6 out-of-sample statistical metrics:

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{H} \sum_{h=1}^H |y_{t+h} - \hat{y}_{t+h}|$$

2. **Root Mean Squared Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{H} \sum_{h=1}^H (y_{t+h} - \hat{y}_{t+h})^2}$$

3. **Symmetric Mean Absolute Percentage Error (sMAPE)**:
   $$\text{sMAPE} = \frac{100\%}{H} \sum_{h=1}^H \frac{2 |y_{t+h} - \hat{y}_{t+h}|}{|y_{t+h}| + |\hat{y}_{t+h}|}$$

4. **Mean Absolute Scaled Error (MASE)**:
   $$\text{MASE} = \frac{\text{MAE}}{\frac{1}{T-1} \sum_{i=2}^T |y_i - y_{i-1}|}$$
   A value $< 1.0$ indicates superior performance relative to the naive in-sample one-step benchmark.

5. **Pinball Loss (Quantile Regression)**:
   For quantile $\tau \in (0, 1)$ and error $e = y - \hat{q}_\tau$:
   $$L_\tau(y, \hat{q}_\tau) = \max(\tau e, (\tau - 1) e)$$

6. **Directional Accuracy (Hit Rate)**:
   $$\text{HitRate} = \frac{1}{H} \sum_{h=1}^H \mathbb{I}\left(\text{sgn}(y_{t+h} - y_t) == \text{sgn}(\hat{y}_{t+h} - y_t)\right)$$

---

## 4. Statistical Significance Testing

To verify whether forecast improvements over baselines are statistically significant rather than stochastic artifacts, RISKOS implements the **Diebold-Mariano (1995)** test with the **Harvey, Leybourne, and Newbold (1997)** finite-sample correction:

$$d_t = L(e_{1,t}) - L(e_{2,t}), \quad \bar{d} = \frac{1}{N} \sum_{t=1}^N d_t$$
$$\text{DM} = \frac{\bar{d}}{\sqrt{\hat{V}(\bar{d})}} \sim \mathcal{N}(0, 1)$$

Where $\hat{V}(\bar{d})$ uses the Newey-West spectral variance estimator with lag length $h-1$.

---

## 5. Cross-Validation & Anti-Leakage Protocol

Standard k-fold cross-validation is forbidden due to temporal correlation and serial dependency in asset returns. RISKOS strictly utilizes:

1. **Purged K-Fold Cross-Validation**:
   Removes training labels whose observation or holding horizons overlap with test intervals.
2. **Post-Test Embargo Windows**:
   Applies a 1% to 5% temporal buffer immediately following each test set to neutralize autoregressive information leakage (López de Prado, 2018).
3. **Combinatorial Purged Cross-Validation (CPCV)**:
   Generates multiple overlapping backtest paths to evaluate path dependency and distribution of Sharpe ratios.
