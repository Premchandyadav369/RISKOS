# Mathematical Proof: Black-Scholes PDE via Delta Hedging

## 1. Portfolio Construction
Consider a portfolio $\Pi$ consisting of one short European option $V(S, t)$ and $\Delta$ shares of underlying asset $S_t$:
$$\Pi_t = -V(S_t, t) + \Delta_t S_t$$
Over an infinitesimal interval $dt$:
$$d\Pi_t = -dV(S_t, t) + \Delta_t dS_t$$

Assuming geometric Brownian motion for $S_t$: $dS_t = \mu S_t dt + \sigma S_t dW_t$.
By Itô's Lemma:
$$dV = \left( \frac{\partial V}{\partial t} + \mu S \frac{\partial V}{\partial S} + \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} \right) dt + \sigma S \frac{\partial V}{\partial S} dW_t$$

Substituting $dV$ into $d\Pi$:
$$d\Pi = \left[ -\frac{\partial V}{\partial t} - \mu S \frac{\partial V}{\partial S} - \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} + \mu S \Delta \right] dt + \sigma S \left( \Delta - \frac{\partial V}{\partial S} \right) dW_t$$

## 2. Eliminating Diffusion Risk
Setting $\Delta = \frac{\partial V}{\partial S}$ eliminates the $dW_t$ term, making the portfolio completely riskless:
$$d\Pi = \left( -\frac{\partial V}{\partial t} - \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} \right) dt$$

By no-arbitrage, a riskless portfolio must earn the risk-free rate $r$:
$$d\Pi = r \Pi dt = r \left( -V + S \frac{\partial V}{\partial S} \right) dt$$

Equating the two expressions yields the Black-Scholes PDE:
$$\frac{\partial V}{\partial t} + r S \frac{\partial V}{\partial S} + \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} - r V = 0$$
Q.E.D.