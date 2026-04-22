import numpy as np

class HestonStochasticVolatility:
    """Simulates Heston (1993) bivariate stochastic volatility diffusion."""
    def __init__(self, s0: float, v0: float, mu: float, kappa: float, theta: float, xi: float, rho: float):
        self.s0 = float(s0)
        self.v0 = float(v0)
        self.mu = float(mu)
        self.kappa = float(kappa)
        self.theta = float(theta)
        self.xi = float(xi)
        self.rho = float(rho)

    def simulate(self, t: float, steps: int, n_paths: int = 1, seed: int = None):
        if seed is not None:
            np.random.seed(seed)
        dt = t / steps
        s_paths = np.zeros((n_paths, steps + 1))
        v_paths = np.zeros((n_paths, steps + 1))
        s_paths[:, 0] = self.s0
        v_paths[:, 0] = self.v0

        for i in range(steps):
            z1 = np.random.normal(0, 1, n_paths)
            z2 = self.rho * z1 + np.sqrt(1 - self.rho ** 2) * np.random.normal(0, 1, n_paths)
            v_curr = np.maximum(v_paths[:, i], 0.0)
            v_next = v_paths[:, i] + self.kappa * (self.theta - v_curr) * dt + self.xi * np.sqrt(v_curr * dt) * z2
            v_paths[:, i + 1] = np.maximum(v_next, 0.0)
            s_paths[:, i + 1] = s_paths[:, i] * np.exp((self.mu - 0.5 * v_curr) * dt + np.sqrt(v_curr * dt) * z1)
        return s_paths, v_paths
