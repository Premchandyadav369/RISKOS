"""
RISKOS Quantitative Core: Merton Jump-Diffusion Process
Analytical SDE: $$dS_t = (\mu - \lambda k) S_t dt + \sigma S_t dW_t + S_t dJ_t$$
Module Variant #123
"""
import numpy as np

class MertonJumpDiffusionEngine_123:
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
