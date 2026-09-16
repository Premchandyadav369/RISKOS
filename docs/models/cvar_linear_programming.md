# Model Card: CVaR Linear Programming Optimization

## 1. Model Overview
Conditional Value-at-Risk (CVaR / Expected Shortfall) optimization (Rockafellar & Uryasev, 2000) minimizes downside tail losses beyond the VaR threshold using linear programming over historical scenarios.

## 2. Mathematical Formulation
$$\min_{w, \zeta, d} \quad \zeta + \frac{1}{S (1 - \alpha)} \sum_{s=1}^S d_s$$
Subject to:
$$d_s \ge -w^T r_s - \zeta, \quad d_s \ge 0 \quad \forall s=1,\dots,S$$
$$w^T \mu \ge R_{\text{target}}, \quad \sum_{i=1}^N w_i = 1, \quad 0 \le w_i \le w_{\max}$$

Where:
- $\zeta$ is the endogenously calculated Value-at-Risk threshold.
- $d_s$ is the auxiliary shortfall variable for scenario $s$.
- $\alpha$ is the confidence level (e.g. $0.95$ or $0.99$).

## 3. Key Advantages
- Convex optimization problem solvable via Simplex or Interior Point algorithms.
- Subadditive and coherent risk measure (unlike VaR).

## 4. Academic References
- Rockafellar, R. T., & Uryasev, S. (2000). Optimization of Conditional Value-at-Risk. *Journal of Risk*, 2(3), 21-41.
