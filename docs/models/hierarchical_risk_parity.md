# Model Card: Hierarchical Risk Parity (HRP)

## 1. Model Overview
Hierarchical Risk Parity (López de Prado, 2016) builds diversified portfolios using machine learning graph theory without requiring the inversion of a positive-definite covariance matrix, eliminating quadratic instability.

## 2. Mathematical Formulation
1. **Tree Clustering**:
   Distance metric between assets $i$ and $j$:
   $$D(i, j) = \sqrt{\frac{1}{2} (1 - \rho_{i,j})}$$
   Compute distance matrix and perform hierarchical agglomerative clustering via Ward's or single-linkage method.
2. **Quasi-Diagonalization**:
   Reorganize rows and columns of the covariance matrix $\Sigma$ so that strongly correlated assets are adjacent.
3. **Recursive Bisection**:
   For clustered subsets $V_1$ and $V_2$:
   $$V_i = w_i^T \Sigma_i w_i, \quad \alpha_1 = 1 - \frac{V_1}{V_1 + V_2}, \quad \alpha_2 = 1 - \alpha_1$$
   Recursively split clusters and scale sub-cluster weights by $\alpha_k$.

## 3. Key Advantages & Limitations
- **No Matrix Inversion**: Operates reliably even when covariance matrices are rank-deficient or ill-conditioned ($N > T$).
- **Drawback**: Ignores expected returns; purely risk-based diversification.

## 4. Academic References
- López de Prado, M. (2016). Building Diversified Portfolios that Outperform Out-of-Sample. *The Journal of Portfolio Management*, 42(4), 59-69.
