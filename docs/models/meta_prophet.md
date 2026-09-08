# Model Card: Meta Prophet Generalized Additive Model (GAM)

## 1. Model Overview
Prophet is a decomposable time series forecasting model developed by Meta Core Data Science. It models time series using a Generalized Additive Model (GAM) formulation combining trend, seasonality, and holiday effects with robust Bayesian uncertainty estimation.

## 2. Mathematical Formulation
The time series $y(t)$ is decomposed into:
$$y(t) = g(t) + s(t) + h(t) + \epsilon_t$$

Where:
- $g(t) = \left(k + a(t)^T \delta\right) t + \left(m + a(t)^T \gamma\right)$ is a piecewise-linear trend with change points at times $s_j$.
- $\delta_j \sim \text{Laplace}(0, \tau)$ is the rate change vector with sparsity regularization.
- $s(t) = \sum_{n=1}^N \left(a_n \cos\left(\frac{2\pi n t}{P}\right) + b_n \sin\left(\frac{2\pi n t}{P}\right)\right)$ is Fourier seasonal component.
- $\epsilon_t \sim \mathcal{N}(0, \sigma^2)$ is Gaussian noise.

## 3. Inputs & Hyperparameters
- **Growth**: Linear or Logistic.
- **Changepoint Prior Scale**: $\tau = 0.05$ (balances flexibility vs overfitting).
- **Seasonality Mode**: Multiplicative or Additive.
- **Uncertainty Interval**: 80% and 95% Bayesian posterior samples.

## 4. Assumptions & Limitations
- Assumes stationary seasonal cycles and piecewise linear trajectories.
- Lacks autoregressive lag feedback; shock innovations do not propagate via Markov chains.

## 5. Failure Modes & Edge Cases
- **Strong Momentum Blowouts**: Piecewise linear models can under-predict hyper-exponential trends. RISKOS couples Prophet with TimesFM and Merton Jump Diffusion to mitigate this.

## 6. Academic References
- Taylor, S. J., & Letham, B. (2018). Forecasting at scale. *The American Statistician*, 72(1), 37-45.