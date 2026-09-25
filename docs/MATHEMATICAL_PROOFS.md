# RISKOS: Pure Vector Mathematical Rigor & Formal Derivations (Proofs 1–30)

```
   ██████╗ ██╗███████╗██╗  ██╗ ██████╗ ███████╗
   ██╔══██╗██║██╔════╝██║ ██╔╝██╔═══██╗██╔════╝
   ██████╔╝██║███████╗█████╔╝ ██║   ██║███████╗
   ██╔══██╗██║╚════██║██╔═██╗ ██║   ██║╚════██║
   ██║  ██║██║███████║██║  ██╗╚██████╔╝███████║
   ╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
   MATHEMATICAL FOUNDATIONS & DERIVATION COMPENDIUM
```

This compendium contains formal mathematical proofs, stochastic differential equations (SDEs), convex optimization formulations, and discrete algorithmic derivations underpinning the **RISKOS Quantitative Intelligence & Portfolio Analytics Engine**.

---

## 📑 Table of Contents

1. [Google TimesFM 3.0 Quantile Loss](#proof-1-google-timesfm-30-quantile-loss)
2. [Meta Prophet Generalized Additive Seasonality](#proof-2-meta-prophet-generalized-additive-seasonality)
3. [Merton Jump-Diffusion Fat-Tail SDE](#proof-3-merton-jump-diffusion-fat-tail-sde)
4. [Sentiment-Conditioned Black-Litterman Master Formula](#proof-4-sentiment-conditioned-black-litterman-master-formula)
5. [Hierarchical Risk Parity (HRP) Matrix Clustering](#proof-5-hierarchical-risk-parity-hrp-matrix-clustering)
6. [Rockafellar-Uryasev CVaR (95%) Linear Programming Minimizer](#proof-6-rockafellar-uryasev-cvar-95-linear-programming-minimizer)
7. [Almgren-Chriss Optimal Execution Trajectory](#proof-7-almgren-chriss-optimal-execution-trajectory)
8. [Ledoit-Wolf Analytical Covariance Shrinkage](#proof-8-ledoit-wolf-analytical-covariance-shrinkage)
9. [GARCH(1,1) Volatility Clustering](#proof-9-garch11-volatility-clustering)
10. [3-State Gaussian Hidden Markov Model (HMM)](#proof-10-3-state-gaussian-hidden-markov-model-hmm)
11. [Hanson Logarithmic Market Scoring Rule (LMSR)](#proof-11-hanson-logarithmic-market-scoring-rule-lmsr)
12. [FRTB Basel III Regulatory Expected Shortfall Capital Charge](#proof-12-frtb-basel-iii-regulatory-expected-shortfall-capital-charge)
13. [Carhart 4-Factor WML Cross-Sectional Momentum Tilt](#proof-13-carhart-4-factor-wml-cross-sectional-momentum-tilt)
14. [Moskowitz-Ooi-Pedersen Volatility-Targeted Time-Series Momentum (TSMOM)](#proof-14-moskowitz-ooi-pedersen-volatility-targeted-time-series-momentum-tsmom)
15. [John Carter TTM Momentum Squeeze & Velocity Slope](#proof-15-john-carter-ttm-momentum-squeeze--velocity-slope)
16. [Algorithmic Capital Gains Tax-Loss Harvesting Alpha](#proof-16-algorithmic-capital-gains-tax-loss-harvesting-alpha)
17. [Gordon Growth Dividend Discount Model (DDM)](#proof-17-gordon-growth-dividend-discount-model-ddm)
18. [Continuous Kelly Optimal Capital Growth Rate](#proof-18-continuous-kelly-optimal-capital-growth-rate)
19. [Trailing Pairwise Pearson Correlation Matrix](#proof-19-trailing-pairwise-pearson-correlation-matrix)
20. [Almgren-Chriss OCO Slippage Bound](#proof-20-almgren-chriss-oco-slippage-bound)
21. [Black-Scholes-Merton Partial Differential Equation (PDE)](#proof-21-black-scholes-merton-partial-differential-equation-pde)
22. [Equal Risk Contribution (ERC) Cyclical Coordinate Descent](#proof-22-equal-risk-contribution-erc-cyclical-coordinate-descent)
23. [Almgren-Chriss Multi-Venue Liquidity Allocation](#proof-23-almgren-chriss-multi-venue-liquidity-allocation)
24. [Stochastic Correlated Geometric Brownian Motion (GBM) with Inflation Drag](#proof-24-stochastic-correlated-geometric-brownian-motion-gbm-with-inflation-drag)
25. [Barra Multi-Factor Cross-Sectional Z-Score Decomposition](#proof-25-barra-multi-factor-cross-sectional-z-score-decomposition)
26. [Dealer Delta-Hedging Velocity & Zero-Gamma Inversion](#proof-26-dealer-delta-hedging-velocity--zero-gamma-inversion)
27. [Merton Structural Credit Bivariate Inversion & Distance-to-Default](#proof-27-merton-structural-credit-bivariate-inversion--distance-to-default)
28. [Pickands-Balkema-de Haan Theorem & Solvency II 99.5% SCR](#proof-28-pickands-balkema-de-haan-theorem--solvency-ii-995-scr)
29. [Redington Duration & Convexity Immunization of Balance Sheet Surplus](#proof-29-redington-duration--convexity-immunization-of-balance-sheet-surplus)
30. [Calibrated Short-Rate Tree Backward Induction & Option-Adjusted Spread (OAS)](#proof-30-calibrated-short-rate-tree-backward-induction--option-adjusted-spread-oas)

---

### Proof 1: Google TimesFM 3.0 Quantile Loss

For a time-series forecast $\hat{y}$ at quantile level $q \in (0, 1)$, the pinball (quantile) loss function is defined as:

$$
\mathcal{L}_q(y, \hat{y}) = \max \Big( q \cdot (y - \hat{y}), \, (q - 1) \cdot (y - \hat{y}) \Big), \quad q \in \{0.10, 0.25, 0.50, 0.75, 0.90, 0.99\}
$$

**Derivation:**
Let $u = y - \hat{y}$. The loss is piecewise linear:

$$
\mathcal{L}_q(u) = u \cdot (q - \mathbb{I}(u < 0))
$$

Taking the subgradient with respect to $\hat{y}$:

$$
\frac{\partial \mathcal{L}_q}{\partial \hat{y}} = \mathbb{I}(y < \hat{y}) - q
$$

Setting the expected subgradient under distribution $F_Y$ to zero:

$$
\mathbb{E}\left[\frac{\partial \mathcal{L}_q}{\partial \hat{y}}\right] = \Pr(Y < \hat{y}) - q = 0 \implies F_Y(\hat{y}) = q \implies \hat{y} = F_Y^{-1}(q)
$$

Hence, minimizing the empirical pinball loss across horizons directly estimates the conditional quantile $F_{Y_t \mid \mathcal{F}_{t-1}}^{-1}(q)$. $\blacksquare$

---

### Proof 2: Meta Prophet Generalized Additive Seasonality

The time series $y(t)$ is decomposed into piecewise linear/logistic growth trend $g(t)$, Fourier seasonality $s(t)$, and Gaussian noise:

$$
y(t) = g(t) + \sum_{n=1}^N \left( a_n \cos\left(\frac{2\pi n t}{P}\right) + b_n \sin\left(\frac{2\pi n t}{P}\right) \right) + \epsilon_t, \quad \epsilon_t \sim \mathcal{N}(0, \sigma^2)
$$

**Derivation:**
By Dirichlet's theorem, any periodic function $s(t) = s(t + P)$ with bounded variation can be approximated arbitrarily closely by a truncated Fourier series with $2N$ basis vectors:

$$
X(t) = \left[ \cos\left(\frac{2\pi \cdot 1 t}{P}\right), \sin\left(\frac{2\pi \cdot 1 t}{P}\right), \dots, \cos\left(\frac{2\pi N t}{P}\right), \sin\left(\frac{2\pi N t}{P}\right) \right]
$$

Placing a Gaussian prior on parameters $\boldsymbol{\beta} = [a_1, b_1, \dots, a_N, b_N]^T \sim \mathcal{N}(\mathbf{0}, \sigma_{\text{prior}}^2 \mathbf{I})$ establishes $L_2$ regularization, preventing overfitting to intraday high-frequency market microstructure anomalies. $\blacksquare$

---

### Proof 3: Merton Jump-Diffusion Fat-Tail SDE

Under the physical measure $\mathbb{P}$, asset price $S_t$ follows continuous Brownian motion punctuated by discontinuous compound Poisson jumps:

$$
\frac{dS_t}{S_{t^-}} = \mu dt + \sigma dW_t + (J - 1) dN_t
$$

where $N_t$ is a Poisson process with intensity $\lambda$, and jump amplitude $J \sim \text{Lognormal}\left(\mu_J, \sigma_J^2\right)$.

**Derivation:**
Applying Itô's Lemma for jump processes to $f(S_t) = \ln S_t$:

$$
d(\ln S_t) = \left(\mu - \frac{1}{2}\sigma^2\right)dt + \sigma dW_t + \ln(J) dN_t
$$

Integrating between 0 and $t$:

$$
\ln\left(\frac{S_t}{S_0}\right) = \left(\mu - \frac{1}{2}\sigma^2\right)t + \sigma W_t + \sum_{i=1}^{N_t} \ln J_i
$$

Compensating the jump drift such that $\mathbb{E}[S_t] = S_0 e^{\mu t}$:

$$
\mathbb{E}[J - 1] = \exp\left(\mu_J + \frac{1}{2}\sigma_J^2\right) - 1 \equiv k
$$

Exponentiating yields the exact simulation equation used in RISKOS Monte Carlo paths:

$$
S_t = S_0 \exp\left( \left(\mu - \lambda k - \frac{1}{2}\sigma^2\right)t + \sigma W_t \right) \prod_{i=1}^{N_t} J_i. \quad \blacksquare
$$

---

### Proof 4: Sentiment-Conditioned Black-Litterman Master Formula

The Bayesian prior return distribution is $\boldsymbol{\Pi} \sim \mathcal{N}(\boldsymbol{\mu}, \tau \mathbf{\Sigma})$. Investor/NLP views are formulated as $\mathbf{P} \boldsymbol{\mu} = \mathbf{Q} + \boldsymbol{\epsilon}$, where $\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{\Omega})$.

$$
\boldsymbol{\mu}_{\text{BL}} = \left[ (\tau \mathbf{\Sigma})^{-1} + \mathbf{P}^T \mathbf{\Omega}^{-1} \mathbf{P} \right]^{-1} \left[ (\tau \mathbf{\Sigma})^{-1} \boldsymbol{\Pi} + \mathbf{P}^T \mathbf{\Omega}^{-1} \mathbf{Q} \right]
$$

where view magnitude $Q_k$ is conditioned on Loughran-McDonald sentiment $S_{\text{news}} \in [-1, 1]$:

$$
Q_k = \alpha \cdot S_{\text{news}} \cdot \sigma_k \sqrt{\Delta t}
$$

**Derivation:**
The posterior log-likelihood over expected returns $\boldsymbol{\mu}$ combines Gaussian prior and likelihood:

$$
\ln p(\boldsymbol{\mu} \mid \mathbf{Q}) \propto -\frac{1}{2} (\boldsymbol{\mu} - \boldsymbol{\Pi})^T (\tau \mathbf{\Sigma})^{-1} (\boldsymbol{\mu} - \boldsymbol{\Pi}) - \frac{1}{2} (\mathbf{Q} - \mathbf{P}\boldsymbol{\mu})^T \mathbf{\Omega}^{-1} (\mathbf{Q} - \mathbf{P}\boldsymbol{\mu})
$$

Differentiating with respect to $\boldsymbol{\mu}$ and setting to zero:

$$
-(\tau \mathbf{\Sigma})^{-1} (\boldsymbol{\mu} - \boldsymbol{\Pi}) + \mathbf{P}^T \mathbf{\Omega}^{-1} (\mathbf{Q} - \mathbf{P}\boldsymbol{\mu}) = \mathbf{0}
$$

$$
\left[ (\tau \mathbf{\Sigma})^{-1} + \mathbf{P}^T \mathbf{\Omega}^{-1} \mathbf{P} \right] \boldsymbol{\mu}_{\text{BL}} = (\tau \mathbf{\Sigma})^{-1} \boldsymbol{\Pi} + \mathbf{P}^T \mathbf{\Omega}^{-1} \mathbf{Q}
$$

Inverting the positive definite Hessian matrix yields the unique maximum a posteriori (MAP) estimator. $\blacksquare$

---

### Proof 5: Hierarchical Risk Parity (HRP) Matrix Clustering

Given Pearson correlation $\rho_{i,j}$, the distance metric $d_{i,j} = \sqrt{\frac{1}{2}(1 - \rho_{i,j})}$ defines an ultrametric tree under Ward's linkage. The tree is recursively split into sub-clusters $V_1, V_2$:

$$
w_1 = w \cdot \frac{V_2}{V_1 + V_2}, \quad w_2 = w \cdot \left(1 - \frac{V_2}{V_1 + V_2}\right)
$$

where cluster variance is computed from the shrunk diagonal block $\mathbf{\Sigma}_{k}$:

$$
V_k = \mathbf{w}_k^T \mathbf{\Sigma}_k \mathbf{w}_k, \quad \mathbf{w}_k = \frac{\text{diag}(\mathbf{\Sigma}_k)^{-1}}{\text{Tr}(\text{diag}(\mathbf{\Sigma}_k)^{-1})}
$$

**Derivation:**
Inverse-variance allocation between two uncorrelated clusters minimizes total joint variance $\sigma^2(w_1) = w_1^2 V_1 + (1 - w_1)^2 V_2$. Setting $\frac{d\sigma^2}{dw_1} = 2 w_1 V_1 - 2(1 - w_1)V_2 = 0 \implies w_1^* = \frac{V_2}{V_1 + V_2}$. Because HRP does not require inverting the full covariance matrix $\mathbf{\Sigma}$, its condition number sensitivity is $\mathcal{O}(1)$ compared to Markowitz's $\mathcal{O}(\kappa(\mathbf{\Sigma}))$. $\blacksquare$

---

### Proof 6: Rockafellar-Uryasev CVaR (95%) Linear Programming Minimizer

Rockafellar & Uryasev (2000) proved that Conditional Value-at-Risk can be minimized directly via auxiliary linear slack variables without numerical simulation sorting:

$$
\min_{\mathbf{w}, \alpha, \mathbf{u}} \left\{ \alpha + \frac{1}{(1-\beta) T} \sum_{t=1}^T u_t \right\}
$$

$$
\text{subject to} \quad u_t \ge -\mathbf{w}^T \mathbf{r}_t - \alpha, \quad u_t \ge 0, \quad \sum_{i=1}^N w_i = 1, \quad 0 \le w_i \le w_{\text{max}}
$$

**Derivation:**
Let loss $f(\mathbf{w}, \mathbf{r}_t) = -\mathbf{w}^T \mathbf{r}_t$. Define the convex auxiliary function:

$$
F_\beta(\mathbf{w}, \alpha) = \alpha + \frac{1}{1-\beta} \mathbb{E}\left[ \left( f(\mathbf{w}, \mathbf{r}) - \alpha \right)^+ \right]
$$

For fixed $\mathbf{w}$, $F_\beta(\mathbf{w}, \alpha)$ is continuously differentiable and convex in $\alpha$. The infimum over $\alpha \in \mathbb{R}$ satisfies:

$$
\min_\alpha F_\beta(\mathbf{w}, \alpha) = \text{CVaR}_\beta(\mathbf{w})
$$

Replacing the expectation with the empirical sample mean over $T$ observations and substituting slack variables $u_t = \max(0, -\mathbf{w}^T \mathbf{r}_t - \alpha)$ transforms the non-smooth minimization into a standard convex linear program (LP) solvable in polynomial time. $\blacksquare$

---

### Proof 7: Almgren-Chriss Optimal Execution Trajectory

Liquidation of $X_0$ shares over horizon $T$ divided into $N$ steps of length $\tau = T/N$ with risk-aversion parameter $\lambda$, asset volatility $\sigma$, and temporary impact parameter $\eta$:

$$
x_j = \frac{\sinh(\kappa(T - t_j))}{\sinh(\kappa T)} X_0, \quad \kappa = \text{arcosh}\left( \frac{\lambda \sigma^2 \tau^2}{2\eta} + 1 \right) \cdot \frac{1}{\tau} \approx \sqrt{\frac{\lambda \sigma^2}{\eta}}
$$

**Derivation:**
Total expected capture cost is $\mathbb{E}[x] = \sum_{k=1}^N \tau v_k^2 \eta$, and variance of capture is $V[x] = \sigma^2 \sum_{k=1}^N \tau x_k^2$. The objective functional is:

$$
\min_{\{x_j\}} \sum_{j=1}^N \left[ \eta \frac{(x_j - x_{j-1})^2}{\tau} + \lambda \sigma^2 \tau x_j^2 \right]
$$

Euler-Lagrange discrete difference equation:

$$
\frac{x_{j+1} - 2x_j + x_{j-1}}{\tau^2} = \frac{\lambda \sigma^2}{\eta} x_j \implies \ddot{x}(t) - \kappa^2 x(t) = 0
$$

The general solution is $x(t) = A \cosh(\kappa t) + B \sinh(\kappa t)$. Applying boundary conditions $x(0) = X_0$ and $x(T) = 0$ yields the hyperbolic sine ratio. $\blacksquare$

---

### Proof 8: Ledoit-Wolf Analytical Covariance Shrinkage

The asymptotically optimal linear combination of sample covariance $\mathbf{S}$ and structured target $\mathbf{F}$ (constant correlation model):

$$
\mathbf{\Sigma}_{\text{LW}} = \delta^* \mathbf{F} + (1 - \delta^*) \mathbf{S}, \quad \delta^* = \frac{\sum_{i \ne j} \text{Var}(s_{ij})}{\sum_{i \ne j} (s_{ij} - f_{ij})^2}
$$

**Derivation:**
Ledoit and Wolf (2004) set up the quadratic loss under the Frobenius norm:

$$
L(\delta) = \|\delta \mathbf{F} + (1 - \delta)\mathbf{S} - \mathbf{\Sigma}\|_F^2
$$

The expected loss risk $R(\delta) = \mathbb{E}[L(\delta)]$ is strictly convex in $\delta \in [0, 1]$. Differentiating with respect to $\delta$:

$$
\frac{dR}{d\delta} = 2 \mathbb{E}\left[ \text{Tr}\left((\mathbf{F} - \mathbf{S})(\delta(\mathbf{F} - \mathbf{S}) + \mathbf{S} - \mathbf{\Sigma})\right) \right] = 0
$$

Solving for $\delta$ gives $\delta^* = \frac{\mathbb{E}[\|\mathbf{S} - \mathbf{\Sigma}\|_F^2]}{\mathbb{E}[\|\mathbf{S} - \mathbf{F}\|_F^2]}$. Substituting consistent estimators for the asymptotic variance of matrix elements yields the optimal closed-form shrinkage intensity $\delta^* \in [0, 1]$. $\blacksquare$

---

### Proof 9: GARCH(1,1) Volatility Clustering

Conditional variance $\sigma_t^2$ parameterized by Bollerslev (1986):

$$
\sigma_t^2 = \omega + \alpha \epsilon_{t-1}^2 + \beta \sigma_{t-1}^2, \quad \text{with } \alpha \ge 0, \; \beta \ge 0, \; \alpha + \beta < 1
$$

**Derivation:**
Under stationarity, taking the unconditional expectation $\mathbb{E}[\sigma_t^2] = \mathbb{E}[\epsilon_t^2] = \sigma_L^2$:

$$
\sigma_L^2 = \omega + \alpha \sigma_L^2 + \beta \sigma_L^2 \implies \sigma_L^2 (1 - \alpha - \beta) = \omega \implies \sigma_L^2 = \frac{\omega}{1 - \alpha - \beta}
$$

The persistence of a volatility shock over horizon $k$ steps decays exponentially:

$$
\mathbb{E}[\sigma_{t+k}^2 \mid \mathcal{F}_t] = \sigma_L^2 + (\alpha + \beta)^k (\sigma_t^2 - \sigma_L^2)
$$

The half-life of a volatility shock is $t_{1/2} = \frac{\ln(0.5)}{\ln(\alpha + \beta)}$. $\blacksquare$

---

### Proof 10: 3-State Gaussian Hidden Markov Model (HMM)

Hidden state $S_t \in \{1: \text{Bull}, 2: \text{Bear}, 3: \text{Sideways}\}$ transitions under stochastic matrix $\mathbf{A}$:

$$
A_{ij} = \Pr(S_t = j \mid S_{t-1} = i), \quad r_t \mid (S_t = k) \sim \mathcal{N}(\mu_k, \sigma_k^2)
$$

**Derivation:**
Forward-backward Baum-Welch expectation maximization maximizes the complete-data log-likelihood:

$$
\mathcal{Q}(\theta, \theta^{\text{old}}) = \sum_{k=1}^3 \gamma_t(k) \ln \mathcal{N}(r_t; \mu_k, \sigma_k^2) + \sum_{i=1}^3 \sum_{j=1}^3 \xi_t(i, j) \ln A_{ij}
$$

where posterior smoothed state probabilities are:

$$
\gamma_t(k) = \frac{\alpha_t(k) \beta_t(k)}{\sum_{j=1}^3 \alpha_t(j) \beta_t(j)}
$$

Solving the M-step updates gives closed-form state parameters:

$$
\mu_k^* = \frac{\sum_{t=1}^T \gamma_t(k) r_t}{\sum_{t=1}^T \gamma_t(k)}, \quad {\sigma_k^*}^2 = \frac{\sum_{t=1}^T \gamma_t(k) (r_t - \mu_k^*)^2}{\sum_{t=1}^T \gamma_t(k)}. \quad \blacksquare
$$

---

### Proof 11: Hanson Logarithmic Market Scoring Rule (LMSR)

Cost function $C(\mathbf{q})$ and instantaneous pricing rule for prediction market state shares $\mathbf{q} \in \mathbb{R}^n$:

$$
C(\mathbf{q}) = b \cdot \ln \left( \sum_{i=1}^n e^{q_i / b} \right), \quad p_i(\mathbf{q}) = \frac{\partial C}{\partial q_i} = \frac{e^{q_i / b}}{\sum_{j=1}^n e^{q_j / b}}
$$

**Derivation:**
The price $p_i$ is the marginal cost of buying an infinitesimal share of state $i$. Differentiating:

$$
\frac{\partial C}{\partial q_i} = b \cdot \frac{1}{\sum_{j} e^{q_j / b}} \cdot \frac{1}{b} e^{q_i / b} = \frac{e^{q_i / b}}{\sum_{j=1}^n e^{q_j / b}}
$$

Notice that $\sum_{i=1}^n p_i(\mathbf{q}) = 1$ and $p_i > 0$ for all $\mathbf{q} \in \mathbb{R}^n$. Hence, $p_i(\mathbf{q})$ behaves as a proper probability distribution satisfying Kolmogorov axioms. Maximum market maker subsidy is bounded by $b \ln n$. $\blacksquare$

---

### Proof 12: FRTB Basel III Regulatory Expected Shortfall Capital Charge

Basel Committee on Banking Supervision (BCBS) replaces 99% 10-day VaR with 97.5% Expected Shortfall across stressed market horizons:

$$
\text{ES}_{\text{FRTB}} = \frac{1}{1 - \alpha} \int_\alpha^1 \text{VaR}_u(L) du \approx \frac{1}{N_{\text{tail}}} \sum_{i \in \text{Loss} > \text{VaR}} L_i, \quad \text{Capital Charge} = k \cdot \text{ES}_{\text{FRTB}} \cdot \sqrt{\Delta t}
$$

**Derivation:**
Unlike VaR, which fails the sub-additivity axiom ($\text{VaR}(X + Y) \not\le \text{VaR}(X) + \text{VaR}(Y)$), Artzner et al. (1999) proved that Expected Shortfall is a coherent risk measure satisfying:
1. Sub-additivity: $\text{ES}(X + Y) \le \text{ES}(X) + \text{ES}(Y)$
2. Monotonicity: $X \le Y \implies \text{ES}(X) \le \text{ES}(Y)$
3. Positive Homogeneity: $\text{ES}(c X) = c \cdot \text{ES}(X), \quad \forall c > 0$
4. Translation Invariance: $\text{ES}(X + c) = \text{ES}(X) + c, \quad \forall c \in \mathbb{R}$

This guarantees that merged portfolios cannot artificially under-report trading book regulatory capital. $\blacksquare$

---

### Proof 13: Carhart 4-Factor WML Cross-Sectional Momentum Tilt

12-1 month cross-sectional momentum score $R_{i, 12-1}$ skipping the immediate trailing month to avoid short-term microstructure reversals:

$$
R_{i, 12-1} = \frac{P_{i, t-21} - P_{i, t-252}}{P_{i, t-252}}, \quad z_i^{\text{mom}} = \frac{R_{i, 12-1} - \mu_{mom}}{\sigma_{mom}}
$$

Optimal portfolio tilt vector combining mean-variance weights $\mathbf{w}_{\text{base}}$ with momentum:

$$
\mathbf{w}_{\text{optimal}} = (1 - \lambda_{\text{mom}}) \mathbf{w}_{\text{base}} + \lambda_{\text{mom}} \cdot \text{softmax}\left(\frac{z_i^{\text{mom}}}{\tau}\right)
$$

where softmax temperature $\tau > 0$ controls the degree of winner conviction. $\blacksquare$

---

### Proof 14: Moskowitz-Ooi-Pedersen Volatility-Targeted Time-Series Momentum (TSMOM)

For each asset $i$, position sizing scales inversely with conditional volatility $\hat{\sigma}_{i, t}$:

$$
w_{i, t} = \min\left(\frac{\sigma_{\text{target}}}{\hat{\sigma}_{i, t}}, \text{MaxLev}\right) \cdot \text{sign}\left(\sum_{k \in \{21, 63, 126, 252\}} R_{i, t, k}\right)
$$

Chandelier dynamic volatility stop:

$$
\text{Stop}_{\text{Chandelier}} = \max_{22}(H) - 2.5 \cdot \text{ATR}_{22}
$$

**Derivation:**
By scaling exposure by $\sigma_{\text{target}} / \hat{\sigma}_{i, t}$, the portfolio return variance becomes approximately constant:

$$
\text{Var}(w_{i,t} r_{i,t+1}) = \left(\frac{\sigma_{\text{target}}}{\hat{\sigma}_{i, t}}\right)^2 \hat{\sigma}_{i, t}^2 = \sigma_{\text{target}}^2
$$

This eliminates return kurtosis spikes during high-volatility crash regimes. $\blacksquare$

---

### Proof 15: John Carter TTM Momentum Squeeze & Velocity Slope

A squeeze occurs when Bollinger Bands contract inside Keltner Channels:

$$
\text{SqueezeOn}_t = \mathbb{I}\left( \text{EMA}_{20} + 2\hat{\sigma}_{20} < \text{EMA}_{20} + 1.5\text{ATR}_{20} \right)
$$

Momentum direction is governed by linear regression slope of price against the average of Donchian midline and SMA:

$$
\text{Slope}_t = \frac{d}{dt}\left(P - \frac{\text{Donchian}_{20} + \text{SMA}_{20}}{2}\right)
$$

When $\text{SqueezeOn}_t$ transitions from $1 \to 0$ (squeeze fires), energy release generates directional momentum breakouts with low initial option implied volatility. $\blacksquare$

---

### Proof 16: Algorithmic Capital Gains Tax-Loss Harvesting Alpha

Gross tax saving realized by liquidating positions trading below cost basis:

$$
\text{Tax Alpha Savings} = \sum_{i=1}^N \max(0, C_i - P_i) \cdot Q_i \cdot \tau_{\text{tax}}
$$

where $C_i$ is cost basis, $P_i$ is price, $Q_i$ is quantity, and $\tau_{\text{tax}}$ is the capital gains tax rate. Reinvesting this saved capital yields compounding terminal wealth:

$$
W_T = W_0 (1 + r)^T + \text{Tax Alpha} \cdot (1 + r)^{T - t}. \quad \blacksquare
$$

---

### Proof 17: Gordon Growth Dividend Discount Model (DDM)

Intrinsic equity fair value for an asset paying dividend $D_0$ growing at perpetual constant rate $g$ under hurdle rate $r > g$:

$$
P_0 = \sum_{t=1}^{\infty} \frac{D_t}{(1 + r)^t} = \sum_{t=1}^\infty \frac{D_0 (1 + g)^t}{(1 + r)^t} = D_0 \frac{1+g}{1+r} \sum_{k=0}^\infty \left(\frac{1+g}{1+r}\right)^k
$$

Using the geometric series formula $\sum_{k=0}^\infty x^k = \frac{1}{1-x}$ for $x = \frac{1+g}{1+r} < 1$:

$$
P_0 = D_0 \frac{1+g}{1+r} \cdot \frac{1}{1 - \frac{1+g}{1+r}} = \frac{D_0 (1 + g)}{r - g} = \frac{D_1}{r - g}. \quad \blacksquare
$$

---

### Proof 18: Continuous Kelly Optimal Capital Growth Rate

Expected growth rate $g(f)$ of wealth $W_t$ under continuous geometric Brownian motion with fraction $f$ invested:

$$
d\ln(W_t) = \left[ r_f + f(\mu - r_f) - \frac{1}{2} f^2 \sigma^2 \right] dt + f \sigma dW_t
$$

Differentiating the expected drift rate with respect to $f$:

$$
\frac{d}{df} \mathbb{E}\left[ \frac{d\ln W_t}{dt} \right] = (\mu - r_f) - f \sigma^2 = 0 \implies f^* = \frac{\mu - r_f}{\sigma^2}. \quad \blacksquare
$$

---

### Proof 19: Trailing Pairwise Pearson Correlation Matrix

For return vectors $\mathbf{R}_i, \mathbf{R}_j$ across $T$ observations:

$$
\rho_{ij} = \frac{\sum_{t=1}^T (R_{i,t} - \bar{R}_i)(R_{j,t} - \bar{R}_j)}{\sqrt{\sum_{t=1}^T (R_{i,t} - \bar{R}_i)^2 \sum_{t=1}^T (R_{j,t} - \bar{R}_j)^2}}
$$

Pairs with $\rho_{ij} > 0.80$ trigger synthetic diversification and cross-asset beta hedging alerts. $\blacksquare$

---

### Proof 20: Almgren-Chriss OCO Slippage Bound

When an One-Cancels-Other (OCO) bracket order triggers liquidation of quantity $X$ within time window $\tau$:

$$
\text{Slippage}_{\text{OCO}} = \eta \cdot \left(\frac{X}{\tau}\right)^\alpha + \gamma \cdot X
$$

where $\eta$ represents temporary market impact, $\gamma$ represents permanent price depression, and exponent $\alpha \approx 0.5$ matches empirical square-root law of market impact. $\blacksquare$

---

### Proof 21: Black-Scholes-Merton Partial Differential Equation (PDE)

Under no-arbitrage in continuous time, an option price $V(S, t)$ satisfies:

$$
\frac{\partial V}{\partial t} + \frac{1}{2} \sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} + r S \frac{\partial V}{\partial S} - r V = 0
$$

**Derivation:**
Construct a self-financing portfolio $\Pi = V - \Delta S$. Over $dt$:

$$
d\Pi = dV - \Delta dS = \left(\frac{\partial V}{\partial t} + \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} + \mu S \frac{\partial V}{\partial S} - \Delta \mu S\right)dt + \left(\frac{\partial V}{\partial S} - \Delta\right)\sigma S dW_t
$$

Choosing $\Delta = \frac{\partial V}{\partial S}$ eliminates the stochastic $dW_t$ term. By no-arbitrage, $d\Pi = r \Pi dt = r(V - \frac{\partial V}{\partial S} S)dt$. Equating drift terms yields the PDE.

Closed-form solutions:

$$
C(S, t) = S \Phi(d_1) - K e^{-r(T-t)} \Phi(d_2), \quad P(S, t) = K e^{-r(T-t)} \Phi(-d_2) - S \Phi(-d_1)
$$

where $d_1 = \frac{\ln(S/K) + (r + \frac{1}{2}\sigma^2)(T-t)}{\sigma \sqrt{T-t}}$ and $d_2 = d_1 - \sigma \sqrt{T-t}$. $\blacksquare$

---

### Proof 22: Equal Risk Contribution (ERC) Cyclical Coordinate Descent

Equal risk parity requires each asset to contribute equally to total portfolio risk:

$$
\text{TRC}_i = w_i \frac{(\mathbf{\Sigma}\mathbf{w})_i}{\sigma_p} = \frac{\sigma_p}{N} \iff w_i (\mathbf{\Sigma}\mathbf{w})_i = \frac{\sigma_p^2}{N}, \quad \forall i
$$

**Derivation:**
Expanding $(\mathbf{\Sigma}\mathbf{w})_i = \Sigma_{ii} w_i + (\mathbf{\Sigma}_{-i} \mathbf{w}_{-i})_i$:

$$
\Sigma_{ii} w_i^2 + (\mathbf{\Sigma}_{-i} \mathbf{w}_{-i})_i w_i - \frac{\sigma_p^2}{N} = 0
$$

Applying the quadratic formula with the positive root (since $w_i \ge 0$):

$$
w_i = \frac{-(\mathbf{\Sigma}_{-i}\mathbf{w}_{-i})_i + \sqrt{((\mathbf{\Sigma}_{-i}\mathbf{w}_{-i})_i)^2 + 4 \Sigma_{ii} \frac{\sigma_p^2}{N}}}{2 \Sigma_{ii}}
$$

Cyclically updating coordinates $i = 1, \dots, N$ until $\|\mathbf{w}^{(k+1)} - \mathbf{w}^{(k)}\|_\infty < 10^{-6}$ converges to the unique global ERC optimum. $\blacksquare$

---

### Proof 23: Almgren-Chriss Multi-Venue Liquidity Allocation

For order size $X_0$ routed across $V$ fragmented execution venues (NSE, BSE, Dark Pools):

$$
\min_{q_1, \dots, q_V} \sum_{v=1}^V \left[ q_v P_v + \eta_v \left(\frac{q_v}{\text{Depth}_v}\right)^{\alpha} P_v + \text{STT}_v(q_v) + \text{ExchangeFee}_v(q_v) \right] \quad \text{s.t.} \quad \sum_{v=1}^V q_v = X_0
$$

Formulated as a convex optimization problem under Karush-Kuhn-Tucker (KKT) conditions, routing volume inversely to venue temporary impact $\eta_v / \text{Depth}_v^\alpha$. $\blacksquare$

---

### Proof 24: Stochastic Correlated Geometric Brownian Motion (GBM) with Inflation Drag

Multi-asset correlated price trajectories evolve as:

$$
d\mathbf{S}_t = \text{diag}(\mathbf{S}_t) \left( \boldsymbol{\mu} dt + \mathbf{L} d\mathbf{W}_t \right), \quad \mathbf{\Sigma} = \mathbf{L} \mathbf{L}^T
$$

where $\mathbf{L}$ is the Cholesky factor. Net real portfolio wealth under spending rate $w$ and CPI inflation $i$:

$$
W_{t+\Delta t} = \max\left(0, (W_t - W_0 \cdot w \cdot e^{it} \Delta t) \cdot (1 + \mathbf{w}^T \Delta \mathbf{S}_t / \mathbf{S}_t)\right). \quad \blacksquare
$$

---

### Proof 25: Barra Multi-Factor Cross-Sectional Z-Score Decomposition

Standardized factor score for asset $i$ on factor $f$:

$$
z_{i, f} = \frac{X_{i, f} - \mu_f}{\sigma_f}, \quad F_{\text{portfolio}, f} = \sum_{i=1}^N w_i \cdot z_{i, f}
$$

Active factor exposure relative to benchmark $\mathbf{w}_B$: $\Delta F_f = \sum_{i=1}^N (w_i - w_{B,i}) z_{i, f}$. Total active variance decomposes into factor active risk and stock-specific active risk:

$$
\sigma_{\text{active}}^2 = \Delta \mathbf{F}^T \mathbf{\Omega}_F \Delta \mathbf{F} + \sum_{i=1}^N (w_i - w_{B,i})^2 \sigma_{\epsilon, i}^2. \quad \blacksquare
$$

---

### Proof 26: Dealer Delta-Hedging Velocity & Zero-Gamma Inversion

Let market maker delta be $\Delta_{\text{MM}}(S) = -\sum_{i} \phi_i \Delta_i(S)$. The change in dealer shares required per unit change in underlying price is:

$$
\frac{\partial \Delta_{\text{MM}}}{\partial S} = -\text{GEX}(S) = -\left[ \sum_{\text{Calls}} \Gamma_i S \cdot \text{OI}_i \cdot 100 - \sum_{\text{Puts}} \Gamma_j S \cdot \text{OI}_j \cdot 100 \right]
$$

**Derivation:**
When underlying price moves by $dS_t$, dealers execute hedging flow $dQ_t = -\text{GEX}(S_t) dS_t$. By market microstructure equilibrium ($dS_t = \lambda_{\text{Kyle}} dQ_t^{\text{net}}$):

$$
\frac{dS_t}{dt} = \mu S_t - \lambda \cdot \text{GEX}(S_t) \frac{dS_t}{dt} \implies \frac{dS_t}{dt} = \frac{\mu S_t}{1 + \lambda \cdot \text{GEX}(S_t)}
$$

* If $\text{GEX} > 0$, the denominator exceeds 1, dampening price velocity (mean-reverting volatility suppression).
* If $\text{GEX} < -1/\lambda$, the denominator flips negative, triggering explosive trend runaway.
The zero-gamma boundary satisfies $\text{GEX}(S^*) = 0$. $\blacksquare$

---

### Proof 27: Merton Structural Credit Bivariate Inversion & Distance-to-Default

Let firm asset value follow geometric Brownian motion $dV_t = \mu V_t dt + \sigma_A V_t dW_t$. Equity is a call option on firm assets maturing at debt maturity $T$:

$$
E = V_A \mathcal{N}(d_1) - D e^{-rT} \mathcal{N}(d_2), \quad d_1 = \frac{\ln(V_A/D) + (r + \frac{1}{2}\sigma_A^2)T}{\sigma_A \sqrt{T}}, \quad d_2 = d_1 - \sigma_A \sqrt{T}
$$

By Itô's lemma, the diffusion coefficient of equity satisfies $\sigma_E E = \frac{\partial E}{\partial V_A} \sigma_A V_A = \mathcal{N}(d_1) \sigma_A V_A$. This defines a non-linear bivariate system in unobservables $(V_A, \sigma_A)$:

$$
\begin{cases} f_1(V_A, \sigma_A) = V_A \mathcal{N}(d_1) - D e^{-rT}\mathcal{N}(d_2) - E = 0 \\ f_2(V_A, \sigma_A) = \mathcal{N}(d_1) \sigma_A V_A - \sigma_E E = 0 \end{cases}
$$

Solving via 2D Newton-Raphson yields $(V_A^*, \sigma_A^*)$. Distance-to-Default is the number of standard deviations firm asset value sits above debt barrier $D$:

$$
\text{DD} = \frac{\ln(V_A^* / D) + (\mu_A - \frac{1}{2}{\sigma_A^*}^2)T}{\sigma_A^* \sqrt{T}} \implies \text{EDF} = \mathcal{N}(-\text{DD}). \quad \blacksquare
$$

---

### Proof 28: Pickands-Balkema-de Haan Theorem & Solvency II 99.5% SCR

Let $X$ have distribution function $F$. The conditional excess distribution over threshold $u$ is $F_u(y) = \Pr(X - u \le y \mid X > u)$. By the Pickands-Balkema-de Haan theorem (1974, 1975):

$$
\lim_{u \to x_F} \sup_{0 \le y < x_F - u} \vert F_u(y) - G_{\xi, \beta(u)}(y) \vert = 0
$$

where $G_{\xi, \beta}(y) = 1 - (1 + \xi y / \beta)^{-1/\xi}$ is the Generalized Pareto Distribution.
The tail probability for $x > u$ is $P(X > x) = P(X > u) P(X - u > x - u \mid X > u) = \frac{N_u}{N} \left( 1 + \xi \frac{x - u}{\beta} \right)^{-1/\xi}$.
Setting $P(X > x) = 1 - q$ with Solvency II quantile $q = 0.995$:

$$
\text{VaR}_q = u + \frac{\beta}{\xi} \left[ \left( \frac{N}{N_u} (1 - q) \right)^{-\xi} - 1 \right]
$$

Expected Shortfall integrates the conditional excess:

$$
\text{ES}_q = \mathbb{E}[X \mid X > \text{VaR}_q] = \text{VaR}_q + \frac{\beta + \xi(\text{VaR}_q - u)}{1 - \xi} = \frac{\text{VaR}_q}{1 - \xi} + \frac{\beta - \xi u}{1 - \xi}. \quad \blacksquare
$$

---

### Proof 29: Redington Duration & Convexity Immunization of Balance Sheet Surplus

Let equity surplus be $E(y) = A(y) - L(y)$ where $A(y)$ and $L(y)$ are asset and liability present values at yield $y$. Expanding $E(y + \Delta y)$ via second-order Taylor series around current yield $y_0$:

$$
\Delta E = \frac{dE}{dy} \Delta y + \frac{1}{2} \frac{d^2E}{dy^2} (\Delta y)^2 + \mathcal{O}((\Delta y)^3)
$$

Substituting modified duration $D = -\frac{1}{P} \frac{dP}{dy}$ and convexity $C = \frac{1}{P} \frac{d^2P}{dy^2}$:

$$
\frac{dE}{dy} = \frac{dA}{dy} - \frac{dL}{dy} = -A D_A + L D_L, \quad \frac{d^2E}{dy^2} = A C_A - L C_L
$$

Assuming fully funded initial surplus $A = L$:

$$
\Delta E \approx -L(D_A - D_L) \Delta y + \frac{1}{2} L(C_A - C_L) (\Delta y)^2
$$

For $\Delta E \ge 0$ for all arbitrary yield shifts $\Delta y \in \mathbb{R}$:
1. First-order condition: $\frac{dE}{dy} = 0 \implies D_A = D_L$ (Duration Matching).
2. Second-order condition: $\frac{d^2E}{dy^2} > 0 \implies C_A > C_L$ (Convexity Surplus). $\blacksquare$

---

### Proof 30: Calibrated Short-Rate Tree Backward Induction & Option-Adjusted Spread (OAS)

Let short rate $r_{i,j}$ evolve on a recombining binomial lattice: $r_{i,j} = r_{i,0} e^{2j \sigma \sqrt{\Delta t}}$ for $j = 0, \dots, i$.
For a bond with face value $M$, coupon $C$, and call protection schedule with call price $K_i$:
At maturity $T = N \Delta t$: $V_{N,j} = M + C$.
For time steps $i = N-1, \dots, 0$, backward induction discounts expected next-period cash flows adjusted for spread $s = \text{OAS}$:

$$
\widetilde{V}_{i,j} = \frac{1}{1 + (r_{i,j} + s)\Delta t} \left[ q V_{i+1, j+1} + (1 - q) V_{i+1, j} \right] + C
$$

where risk-neutral branching probability $q = 0.5$.
Applying the issuer early exercise call boundary:

$$
V_{i,j} = \begin{cases} \min(K_i, \widetilde{V}_{i,j}) & \text{if bond is callable at step } i \\ \widetilde{V}_{i,j} & \text{otherwise} \end{cases}
$$

The model price $P_{\text{model}}(s) = V_{0,0}(s)$ is monotonically decreasing in $s$. The unique Option-Adjusted Spread $s^*$ satisfies $P_{\text{model}}(s^*) = P_{\text{market}}^{\text{clean}}$.
The embedded call option value is $V_{\text{call}} = P_{\text{straight}} - P_{\text{market}}$, with option cost in spread basis points:

$$
\text{Option Cost (bps)} = z_{\text{nominal}} - s^*. \quad \blacksquare
$$
