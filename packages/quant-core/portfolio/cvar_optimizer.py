import numpy as np
from scipy.optimize import minimize

class CVaROptimizer:
    @staticmethod
    def optimize(returns: np.ndarray, target_return: float = 0.12, max_weight: float = 0.40, alpha: float = 0.95):
        n_samples, n_assets = returns.shape
        init_weights = np.ones(n_assets) / n_assets

        def cvar_objective(weights):
            port_ret = np.dot(returns, weights)
            var_thresh = np.percentile(port_ret, (1 - alpha) * 100)
            tail_losses = -port_ret[port_ret <= var_thresh]
            return np.mean(tail_losses) if len(tail_losses) > 0 else -var_thresh

        bounds = [(0.0, max_weight) for _ in range(n_assets)]
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'ineq', 'fun': lambda w: np.mean(np.dot(returns, w)) * 252 - target_return}
        ]

        res = minimize(cvar_objective, init_weights, method='SLSQP', bounds=bounds, constraints=constraints)
        opt_w = res.x if res.success else init_weights
        return {
            "weights": opt_w.tolist(),
            "cvar": float(res.fun),
            "success": bool(res.success)
        }
