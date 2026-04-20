# Mathematical Proof: Itô's Lemma for Itô Processes

## 1. Theorem Statement
Let $X_t$ be an Itô drift-diffusion process satisfying the stochastic differential equation:
$$dX_t = \mu(t, X_t) dt + \sigma(t, X_t) dW_t$$
where $W_t$ is a standard 1-dimensional Brownian motion. Let $f(t, x) \in C^{1,2}([0, \infty) \times \mathbb{R})$ be a twice continuously differentiable scalar function. Then $Y_t = f(t, X_t)$ is also an Itô process, and its differential is given by:
$$df(t, X_t) = \left( \frac{\partial f}{\partial t} + \mu \frac{\partial f}{\partial x} + \frac{1}{2}\sigma^2 \frac{\partial^2 f}{\partial x^2} \right) dt + \sigma \frac{\partial f}{\partial x} dW_t$$

## 2. Derivation via Taylor Expansion & Quadratic Variation
Consider a partition of the time interval $[0, t]$: $0 = t_0 < t_1 < \dots < t_n = t$ with $\Delta t_k = t_{k+1} - t_k \to 0$. Expanding $f(t_{k+1}, X_{t_{k+1}})$ in a multivariable Taylor series around $(t_k, X_{t_k})$:
$$\Delta f_k = \frac{\partial f}{\partial t} \Delta t_k + \frac{\partial f}{\partial x} \Delta X_k + \frac{1}{2} \frac{\partial^2 f}{\partial x^2} (\Delta X_k)^2 + \frac{\partial^2 f}{\partial t \partial x} \Delta t_k \Delta X_k + \frac{1}{2} \frac{\partial^2 f}{\partial t^2} (\Delta t_k)^2 + R_k$$

Substituting $\Delta X_k = \mu \Delta t_k + \sigma \Delta W_k$:
$$(\Delta X_k)^2 = \mu^2 (\Delta t_k)^2 + 2\mu\sigma \Delta t_k \Delta W_k + \sigma^2 (\Delta W_k)^2$$

In the mean-square limit as $\Delta t_k \to 0$:
1. $\lim \sum \Delta t_k \Delta W_k = 0$ in $L^2$.
2. $\lim \sum (\Delta t_k)^2 = 0$.
3. The quadratic variation of Brownian motion satisfies $\langle W, W \rangle_t = t$, meaning $\lim \sum (\Delta W_k)^2 = t$ in $L^2$.

Hence $(\Delta W_k)^2 \to dt$ in $L^2$. Substituting these limits into the sum yields Itô's formula:
$$df(t, X_t) = \frac{\partial f}{\partial t} dt + \frac{\partial f}{\partial x} dX_t + \frac{1}{2} \frac{\partial^2 f}{\partial x^2} d\langle X, X \rangle_t$$
Q.E.D.