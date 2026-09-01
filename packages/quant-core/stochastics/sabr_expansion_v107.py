"""
RISKOS Quantitative Core: Hagan SABR Implied Volatility Expansion
Analytical SDE: $$\sigma_{SABR}(K, F) = \frac{\alpha}{(F K)^{(1-\beta)/2}} \frac{z}{x(z)} \gamma(F, K)$$
Module Variant #107
"""
import numpy as np

class SabrExpansionEngine_107:
    def __init__(self, s0: float = 100.0, mu: float = 0.08, sigma: float = 0.20):
        self.s0 = s0
        self.mu = mu
        self.sigma = sigma

    def simulate_paths(self, n_paths: int = 1000, n_steps: int = 252, dt: float = 1/252) -> np.ndarray:
        paths = np.zeros((n_paths, n_steps + 1))
        paths[:, 0] = self.s0
        for t in range(1, n_steps + 1):
            z = np.random.standard_normal(n_paths)
            paths[:, t] = paths[:, t-1] * np.exp((self.mu - 0.5 * self.sigma**2) * dt + self.sigma * np.sqrt(dt) * z)
        return paths
