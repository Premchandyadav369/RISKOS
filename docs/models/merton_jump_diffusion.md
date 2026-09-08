# Model Card: Merton (1976) Jump-Diffusion Model

## 1. Model Overview
Merton's Jump-Diffusion model extends Geometric Brownian Motion by incorporating discontinuous Poisson-driven jump shocks to model sudden market crashes or news events.

## 2. Mathematical Formulation
$$\frac{dS_t}{S_{t^-}} = (\mu - \lambda k) dt + \sigma dW_t + (Y_t - 1) dN_t$$
Where:
- $W_t$ is standard Brownian motion.
- $N_t$ is a Poisson process with jump arrival intensity $\lambda$.
- $\ln(Y_t) \sim N(\mu_J, \sigma_J^2)$ is the jump magnitude distribution.
- $k = E[Y_t - 1] = \exp(\mu_J + \sigma_J^2 / 2) - 1$ is the expected relative jump size.

## 3. Applications in RISKOS
- Monte Carlo multi-path stress testing.
- Integration into Desk 7 forecasting ensemble.

## 4. Academic References
- Merton, R. C. (1976). Option Pricing When Underlying Stock Returns Are Discontinuous. *Journal of Financial Economics*, 3(1-2), 125-144.
