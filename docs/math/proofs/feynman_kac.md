# Mathematical Proof: Feynman-Kac Formula

## 1. Theorem Statement
Consider the terminal value parabolic partial differential equation:
$$\frac{\partial V}{\partial t}(t, x) + \mu(t, x) \frac{\partial V}{\partial x}(t, x) + \frac{1}{2}\sigma^2(t, x) \frac{\partial^2 V}{\partial x^2}(t, x) - r(t, x) V(t, x) = 0$$
subject to the terminal boundary condition $V(T, x) = \psi(x)$.
Then $V(t, x)$ admits the stochastic representation:
$$V(t, x) = \mathbb{E}^{\mathbb{P}} \left[ \exp\left(-\int_t^T r(u, X_u) du\right) \psi(X_T) \;\middle|\; X_t = x \right]$$
where $X_u$ satisfies $dX_u = \mu(u, X_u) du + \sigma(u, X_u) dW_u$.

## 2. Derivation via Itô's Product Rule
Define the discounted value process:
$$Y_s = \exp\left(-\int_t^s r(u, X_u) du\right) V(s, X_s) \quad \text{for } s \in [t, T]$$
Let $D_s = \exp\left(-\int_t^s r(u, X_u) du\right)$, so $dD_s = -r(s, X_s) D_s ds$.
Applying Itô's product rule:
$$dY_s = d(D_s V(s, X_s)) = D_s dV(s, X_s) + V(s, X_s) dD_s + d\langle D, V \rangle_s$$
Since $D_s$ has bounded variation, $d\langle D, V \rangle_s = 0$.

Expanding $dV(s, X_s)$ by Itô's lemma:
$$dY_s = D_s \left[ \left( \frac{\partial V}{\partial s} + \mu \frac{\partial V}{\partial x} + \frac{1}{2}\sigma^2 \frac{\partial^2 V}{\partial x^2} - r V \right) ds + \sigma \frac{\partial V}{\partial x} dW_s \right]$$
Since $V$ satisfies the PDE, the drift term vanishes identically:
$$dY_s = D_s \sigma(s, X_s) \frac{\partial V}{\partial x}(s, X_s) dW_s$$
Thus $Y_s$ is a local martingale. Under integrability conditions (Novikov condition), $Y_s$ is a true martingale:
$$\mathbb{E}[Y_T \mid \mathcal{F}_t] = Y_t \implies \mathbb{E}\left[ D_T \psi(X_T) \;\middle|\; X_t = x \right] = D_t V(t, x) = V(t, x)$$
Q.E.D.