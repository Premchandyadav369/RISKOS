# Mathematical Proof: Rockafellar-Uryasev CVaR Convex Representation

## 1. Theorem Statement
Let $f(\mathbf{w}, \mathbf{y})$ be a loss function where $\mathbf{w} \in W \subset \mathbb{R}^n$ is the portfolio decision vector and $\mathbf{y} \in \mathbb{R}^m$ is the random market return vector with density $p(\mathbf{y})$.
Define the auxiliary function $F_\alpha(\mathbf{w}, \zeta)$:
$$F_\alpha(\mathbf{w}, \zeta) = \zeta + \frac{1}{1 - \alpha} \mathbb{E}\left[ [f(\mathbf{w}, \mathbf{y}) - \zeta]^+ \right]$$
Then:
1. $F_\alpha(\mathbf{w}, \zeta)$ is continuous and convex in $\zeta$.
2. $\text{CVaR}_\alpha(\mathbf{w}) = \min_{\zeta \in \mathbb{R}} F_\alpha(\mathbf{w}, \zeta)$.
3. If $f(\mathbf{w}, \mathbf{y})$ is convex in $\mathbf{w}$, then $F_\alpha(\mathbf{w}, \zeta)$ is jointly convex in $(\mathbf{w}, \zeta)$.