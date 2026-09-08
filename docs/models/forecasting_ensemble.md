# Model Card: Empirical Learned Forecasting Ensemble

## 1. Model Overview
The RISKOS Forecasting Ensemble synthesizes Google TimesFM 3.0, Meta Prophet, and Merton Jump-Diffusion into an optimal consensus forecast. Critically, model weights are derived strictly from empirical rolling-origin out-of-sample performance over a pre-forecast validation window, strictly eliminating arbitrary heuristic multipliers.

## 2. Mathematical Formulation
Let $\hat{y}_{t+h}^{(m)}$ be the quantile prediction of model $m \in \{1, \dots, M\}$. The ensemble forecast is:
$$\hat{y}_{t+h}^{\text{Ens}} = \sum_{m=1}^M w_m \hat{y}_{t+h}^{(m)}, \quad \sum_{m=1}^M w_m = 1, \quad w_m \ge 0$$

### Weighting Schemes Supported:
1. **Inverse Validation Loss**:
   $$w_m = \frac{1 / \text{MAE}_m^{\text{val}}}{\sum_{j=1}^M 1 / \text{MAE}_j^{\text{val}}}$$
2. **Validation Performance Softmax**:
   $$w_m = \frac{\exp(-\beta \cdot \text{RMSE}_m^{\text{val}})}{\sum_{j=1}^M \exp(-\beta \cdot \text{RMSE}_j^{\text{val}})}$$
3. **Regime-Conditioned Weighting**:
   $$w_m = P(S_t = s) \cdot w_m^{(s)}$$
   Weights conditioned on market state (Low Vol Bull, High Vol Bull, Crisis).

## 3. Out-of-Sample Verification
The ensemble is evaluated across 1d, 5d, 20d, and 64d horizons using rolling-origin cross-validation, scored with MAE, RMSE, sMAPE, MASE (scaled against Random Walk), and Pinball Loss.

## 4. Academic References
- Bates, J. M., & Granger, C. W. (1969). The combination of forecasts. *Journal of the Operational Research Society*, 20(4), 451-468.
- Timmermann, A. (2006). Forecast combinations. *Handbook of Economic Forecasting*, 1, 135-196.