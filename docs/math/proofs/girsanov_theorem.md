# Mathematical Proof: Girsanov Theorem

## 1. Theorem Statement
Let $(\Omega, \mathcal{F}, \{\mathcal{F}_t\}, \mathbb{P})$ be a filtered probability space with a standard $d$-dimensional $\mathbb{P}$-Brownian motion $W_t$. Let $\gamma_t$ be an adapted process satisfying Novikov's condition:
$$\mathbb{E}^{\mathbb{P}} \left[ \exp\left( \frac{1}{2} \int_0^T \|\gamma_t\|^2 dt \right) \right] < \infty$$
Define the Radon-Nikodym derivative process:
$$Z_t = \mathcal{E}(\gamma \cdot W)_t = \exp\left( \int_0^t \gamma_s^\top dW_s - \frac{1}{2} \int_0^t \|\gamma_s\|^2 ds \right)$$
and the equivalent probability measure $\mathbb{Q}$ on $\mathcal{F}_T$ by $d\mathbb{Q} = Z_T d\mathbb{P}$.
Then the process:
$$\widetilde{W}_t = W_t - \int_0^t \gamma_s ds$$
is a standard $d$-dimensional Brownian motion under $\mathbb{Q}$.