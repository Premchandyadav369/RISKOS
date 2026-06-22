"""
RISKOS Quantitative Core: Kou Double Exponential Jump Process
Analytical SDE: $$f_Y(y) = p \eta_1 e^{-\eta_1 y} 1_{y \ge 0} + q \eta_2 e^{\eta_2 y} 1_{y < 0}$$
Module Variant #036
"""
import numpy as np

class KouDoubleExponentialEngine_036:
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
