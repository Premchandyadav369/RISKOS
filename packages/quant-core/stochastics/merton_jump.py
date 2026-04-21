import numpy as np

class MertonJumpDiffusion:
    """Simulates Merton (1976) Jump Diffusion with log-normal jump sizes."""
    def __init__(self, s0: float, mu: float, sigma: float, lam: float, jump_mean: float, jump_vol: float):
        self.s0 = float(s0)
        self.mu = float(mu)
        self.sigma = float(sigma)
        self.lam = float(lam)
        self.jump_mean = float(jump_mean)
        self.jump_vol = float(jump_vol)

    def simulate(self, t: float, steps: int, n_paths: int = 1, seed: int = None) -> np.ndarray:
        if seed is not None:
            np.random.seed(seed)
        dt = t / steps
        k = np.exp(self.jump_mean + 0.5 * self.jump_vol ** 2) - 1.0
        drift = (self.mu - self.lam * k - 0.5 * self.sigma ** 2) * dt
        diff_vol = self.sigma * np.sqrt(dt)
        paths = np.zeros((n_paths, steps + 1))
        paths[:, 0] = self.s0

        for p in range(n_paths):
            s = self.s0
            for step in range(steps):
                z = np.random.normal(0, 1)
                n_jumps = np.random.poisson(self.lam * dt)
                j_factor = 0.0
                if n_jumps > 0:
                    j_factor = np.sum(np.random.normal(self.jump_mean, self.jump_vol, size=n_jumps))
                s = s * np.exp(drift + diff_vol * z + j_factor)
                paths[p, step + 1] = s
        return paths
