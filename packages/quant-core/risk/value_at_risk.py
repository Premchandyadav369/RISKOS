import numpy as np

class RiskAnalyticsEngine:
    @staticmethod
    def calculate_var_cvar(returns: np.ndarray, weights: np.ndarray, confidence: float = 0.99, n_sims: int = 10000):
        w = np.array(weights, dtype=float)
        w = w / np.sum(w)
        port_returns = np.dot(returns, w)

        mean = float(np.mean(port_returns))
        std = float(np.std(port_returns))

        hist_var = -float(np.percentile(port_returns, (1 - confidence) * 100))
        hist_cvar = -float(np.mean(port_returns[port_returns <= -hist_var]))

        z = 2.3263 if confidence == 0.99 else (1.6449 if confidence == 0.95 else 3.0902)
        param_var = -(mean - z * std)
        param_cvar = -(mean - (np.exp(-0.5 * z ** 2) / (np.sqrt(2 * np.pi) * (1 - confidence))) * std)

        sim_returns = np.random.normal(mean, std, n_sims)
        mc_var = -float(np.percentile(sim_returns, (1 - confidence) * 100))
        mc_cvar = -float(np.mean(sim_returns[sim_returns <= -mc_var]))

        return {
            "mean": mean,
            "std": std,
            "historical_var": hist_var,
            "historical_cvar": hist_cvar,
            "parametric_var": param_var,
            "parametric_cvar": param_cvar,
            "monte_carlo_var": mc_var,
            "monte_carlo_cvar": mc_cvar
        }
