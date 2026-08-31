import numpy as np

class GeometricBrownianMotion:
    """Simulates exact Geometric Brownian Motion paths via log-normal increments."""
    def __init__(self, s0: float, mu: float, sigma: float):
        self.s0 = float(s0)
        self.mu = float(mu)
        self.sigma = float(sigma)

    def simulate(self, t: float, steps: int, n_paths: int = 1, seed: int = None) -> np.ndarray:
        if seed is not None:
            np.random.seed(seed)
        dt = t / steps
        drift = (self.mu - 0.5 * self.sigma ** 2) * dt
        vol = self.sigma * np.sqrt(dt)
        shocks = np.random.normal(0, 1, size=(n_paths, steps))
        log_increments = drift + vol * shocks
        log_paths = np.cumsum(log_increments, axis=1)
        paths = np.zeros((n_paths, steps + 1))
        paths[:, 0] = self.s0
        paths[:, 1:] = self.s0 * np.exp(log_paths)
        return paths
