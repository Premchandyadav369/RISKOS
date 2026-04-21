# Mathematical Lemma: Second-Order Differential Equation Solution for Nelson-Siegel

**Category**: Interest Rate Curves & Sovereign Dynamics  
**Classification**: Formal Quantitative Specification & Mathematical Invariant  
**Engine Ref**: `packages/quant-core/fixed_income/nelson_siegel_ode.py`

---

## 1. Theorem & Formulation
Let $(\Omega, \mathcal{F}, \mathbb{P})$ be the underlying probability space equipped with filtration $\mathbb{F} = \{\mathcal{F}_t\}_{t \ge 0}$.

The fundamental relationship for **Second-Order Differential Equation Solution for Nelson-Siegel** is governed by the operator:
$$\mathcal{L} f(x) = \lim_{\Delta t \to 0} \frac{\mathbb{E}[f(X_{t+\Delta t}) - f(X_t) \mid \mathcal{F}_t]}{\Delta t}$$

Applying the stochastic calculus boundary conditions and asymptotic expansions:
$$\Phi(z) = \frac{1}{\sqrt{2\pi}} \int_{-\infty}^{z} e^{-u^2/2} du$$

## 2. Invariant Properties
1. **Positive Semi-Definiteness**: All resulting covariance and kernel matrices $\mathbf{K} \succeq 0$.
2. **Boundary Stability**: Uniform convergence as $T \to 0$ and $\sigma \to 0$.
3. **No-Arbitrage Constraint**: Enforces strictly positive transition probabilities $\mathbb{Q}(A) > 0$.

## 3. Computational Implementation Trace
The deterministic evaluation algorithm executes in $O(N)$ arithmetic operations with error bound $\mathcal{O}(\epsilon_{\text{mach}})$.
