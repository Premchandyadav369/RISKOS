# Model Card: Google Research TimesFM 3.0 (Zero-Shot Time-Series Foundation Model)

## 1. Model Overview
TimesFM (Time-series Foundation Model) 3.0 is a pretrained decoder-only transformer model developed by Google Research for zero-shot time-series point and quantile forecasting. It maps historical context windows into multi-horizon probability distributions without requiring task-specific fine-tuning.

## 2. Mathematical Formulation
Given context series $y_{1:T}$, TimesFM tokenizes the series into non-overlapping patches $p_k \in \mathbb{R}^P$.
Using Reversible Instance Normalization (RevIN) to combat distribution shift:
$$\tilde{y}_t = \frac{y_t - \mu_x}{\sigma_x}$$

The transformer backbone computes multi-head self-attention:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

The output projection head computes parametric output quantiles $q_\alpha(y_{T+1:T+H})$ for $\alpha \in \{0.10, 0.20, \dots, 0.90\}$ optimizing pinball loss:
$$L_\alpha(y, \hat{y}_\alpha) = \max\left(\alpha (y - \hat{y}_\alpha), (\alpha - 1)(y - \hat{y}_\alpha)\right)$$

## 3. Inputs & Parameters
- **Context Length**: 64 to 512 historical daily bars.
- **Forecast Horizon**: 1 to 64 days.
- **Quantiles**: 10th (lower risk bound), 50th (median point forecast), 90th (upper risk bound).
- **Frequency**: Daily / Business Day (B).

## 4. Assumptions & Limitations
- Assumes underlying temporal structures share statistical invariants with the multi-domain training corpus.
- In structural market regime shifts (e.g. unexpected central bank currency devaluations), zero-shot transformers can exhibit lag before adapting.

## 5. Failure Modes & Edge Cases
- **Flat/Zero Volatility Inputs**: RevIN division by zero is mitigated with epsilon $\epsilon = 10^{-6}$.
- **Extreme Outliers**: Handled via robust quantile clipping and Winsorization.

## 6. Academic References
- Das, A., Kong, W., Leach, A., Mathur, S., Sen, R., & Yu, R. (2024). A decoder-only foundation model for time-series forecasting. *International Conference on Machine Learning (ICML)*.