# Model Card: GARCH(1,1) Volatility Forecasting

## 1. Model Overview
The Generalized Autoregressive Conditional Heteroskedasticity model (Bollerslev, 1986) models time-varying volatility clustering in financial asset returns.

## 2. Mathematical Formulation
$$r_t = \mu + \epsilon_t, \quad \epsilon_t = \sigma_t z_t, \quad z_t \sim \text{i.i.d.} \; N(0, 1)$$
$$\sigma_t^2 = \omega + \alpha \epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$$

Stationarity and positive variance constraints:
$$\omega > 0, \quad \alpha \ge 0, \quad \beta \ge 0, \quad \alpha + \beta < 1$$
Unconditional long-run variance:
$$\sigma_{\infty}^2 = \frac{\omega}{1 - \alpha - \beta}$$

## 3. Validation & Failure Modes
- If $\alpha + \beta \ge 1$, the process is non-stationary (IGARCH). RISKOS falls back to Exponentially Weighted Moving Average (EWMA, $\lambda = 0.94$).

## 4. Academic References
- Bollerslev, T. (1986). Generalized Autoregressive Conditional Heteroskedasticity. *Journal of Econometrics*, 31(3), 307-327.
