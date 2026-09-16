# Model Card: Self-Exciting Hawkes Process

## 1. Model Overview
The univariate self-exciting Hawkes (1971) point process models high-frequency order clustering, liquidity cascades, and flash crash dynamics where each trade arrival increases the instantaneous probability of subsequent events.

## 2. Mathematical Formulation
$$\lambda(t) = \mu_0 + \sum_{t_i < t} \alpha e^{-\beta (t - t_i)}$$
Where:
- $\mu_0 > 0$ is the baseline exogenous arrival rate.
- $\alpha$ is the immediate excitation boost per event.
- $\beta$ is the exponential decay rate.
- $\eta = \frac{\alpha}{\beta}$ is the **branching ratio** (expected number of children events per parent).

## 3. Stability Conditions
- **Subcritical (Stable)**: $\eta < 1$. Expected cluster size $E[C] = \frac{1}{1 - \eta}$.
- **Supercritical (Cascade Risk)**: $\eta \ge 1$. Self-exciting runaway cascade causing order-book collapse.

## 4. Academic References
- Hawkes, A. G. (1971). Spectra of Some Self-Exciting and Mutually Exciting Point Processes. *Biometrika*, 58(1), 83-90.
- Bacry, E., et al. (2015). Hawkes Processes in Finance. *Market Microstructure and Liquidity*, 1(01), 1550005.
