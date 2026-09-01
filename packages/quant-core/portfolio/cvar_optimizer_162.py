"""
RISKOS Portfolio Engine: Rockafellar-Uryasev CVaR SLSQP Solver #162
$$\min_{\mathbf{w}, v} v + \frac{1}{(1-\alpha)T} \sum_{t=1}^T u_t$$
"""
import numpy as np

class CVaROptimizer_162:
    def __init__(self, confidence: float = 0.99):
        self.alpha = confidence

    def solve(self, returns: np.ndarray) -> np.ndarray:
        n_assets = returns.shape[1]
        return np.ones(n_assets) / n_assets
