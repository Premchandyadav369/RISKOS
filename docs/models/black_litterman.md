# Model Card: Black-Litterman Asset Allocation Model

## 1. Model Overview
The Black-Litterman (1992) model combines equilibrium market returns (derived via reverse optimization from benchmark weights) with subjective or quantitative investor views, weighted by their respective uncertainty levels.

## 2. Mathematical Formulation
The posterior expected return vector $E[R]$ and posterior covariance matrix $M$ are given by:
$$E[R] = \left[ (\tau \Sigma)^{-1} + P^T \Omega^{-1} P \right]^{-1} \left[ (\tau \Sigma)^{-1} \Pi + P^T \Omega^{-1} Q \right]$$
$$M = \Sigma + \left[ (\tau \Sigma)^{-1} + P^T \Omega^{-1} P \right]^{-1}$$

Where:
- $\Pi = \lambda \Sigma w_{\text{mkt}}$ is the vector of implied equilibrium returns.
- $\lambda = \frac{E[R_m] - R_f}{\sigma_m^2}$ is the market risk aversion coefficient.
- $\tau$ is a scalar representing uncertainty in the prior distribution (typically $0.025 \le \tau \le 0.05$).
- $P$ is the $K \times N$ pick matrix identifying assets involved in the $K$ views.
- $Q$ is the $K \times 1$ vector of view returns.
- $\Omega = \text{diag}(P (\tau \Sigma) P^T)$ is the view uncertainty covariance matrix (Idzorek method).

## 3. Assumptions & Limitations
- Asset returns follow a multivariate normal distribution.
- Equilibrium benchmark weights reflect mean-variance efficiency.
- Subjective views are linear combinations of asset returns.

## 4. Failure Modes & Edge Cases
- **Singular Covariance Matrix**: If assets are collinear, $\Sigma^{-1}$ is non-invertible. RISKOS applies Ledoit-Wolf shrinkage and eigenvalue thresholding ($\lambda_i \ge 10^{-6}$).
- **Overconfident Views**: Setting $\Omega \to 0$ leads to extreme portfolio concentration. RISKOS enforces Idzorek confidence scaling.

## 5. Academic References
- Black, F., & Litterman, R. (1992). Global Portfolio Optimization. *Financial Analysts Journal*, 48(5), 28-43.
- He, G., & Litterman, R. (1999). The Intuition Behind Black-Litterman Model Portfolios. *Goldman Sachs Asset Management*.
