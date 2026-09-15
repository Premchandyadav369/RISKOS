"""
RISKOS Merton Jump-Diffusion Stochastic Monte Carlo Simulator (merton_jump_montecarlo.py)
Implements non-Gaussian jump-diffusion SDE:
dS_t / S_t = (mu - lambda*k)dt + sigma*dW_t + (J_t - 1)dq_t
Incorporates Poisson news catalyst jump intensity and Ledoit-Wolf correlation.
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from sklearn.covariance import LedoitWolf

class MertonJumpDiffusionSimulator:
    """
    Simulates multi-asset portfolio wealth paths under Brownian diffusion + Poisson compound jumps.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed

    def simulate_paths(
        self,
        returns: pd.DataFrame,
        weights: List[float],
        initial_capital: float = 1000000.0,
        horizon_days: int = 252,
        n_sims: int = 1000,
        news_jump_intensities: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        np.random.seed(self.seed)

        if returns.empty or len(returns.columns) == 0:
            return {"error": "Empty return dataframe"}

        n_assets = len(returns.columns)
        w = np.array(weights, dtype=np.float64)
        if len(w) != n_assets:
            w = np.ones(n_assets) / n_assets
        # Normalize weights
        w = w / np.sum(w) if np.sum(w) > 0 else np.ones(n_assets) / n_assets

        # Estimate continuous drift mu and continuous volatility sigma
        mu_daily = returns.mean().values
        lw = LedoitWolf()
        cov_daily = lw.fit(returns.values).covariance_

        # Cholesky decomposition of covariance for correlated Brownian motion
        # Add tiny jitter to diagonal if needed
        diag_jitter = 1e-7 * np.eye(n_assets)
        try:
            L = np.linalg.cholesky(cov_daily + diag_jitter)
        except np.linalg.LinAlgError:
            eigvals, eigvecs = np.linalg.eigh(cov_daily)
            eigvals = np.maximum(eigvals, 1e-6)
            cov_daily = eigvecs @ np.diag(eigvals) @ eigvecs.T
            L = np.linalg.cholesky(cov_daily + diag_jitter)

        # Baseline Jump Parameters (Merton 1976)
        # lambda_jump: expected number of jumps per year (e.g. 3 jumps/year ~ 0.012/day)
        # mu_jump: mean log jump size (-0.02 ~ downward crash bias)
        # sigma_jump: jump dispersion (0.04)
        lambda_daily_base = 3.0 / 252.0
        mu_jump = -0.025
        sigma_jump = 0.05
        kappa = np.exp(mu_jump + 0.5 * sigma_jump ** 2) - 1.0  # Martingale compensator

        # Vector of jump intensities per asset (boosted by breaking news catalysts)
        lambda_vec = np.full(n_assets, lambda_daily_base)
        if news_jump_intensities:
            for idx, col in enumerate(returns.columns):
                boost = news_jump_intensities.get(col, 0.0)
                lambda_vec[idx] = lambda_daily_base * (1.0 + boost)

        # Continuous drift adjusted for jump compensator: (mu - lambda * kappa)
        drift_adjusted = mu_daily - lambda_vec * kappa

        # Simulation tensor: (n_sims, horizon_days, n_assets)
        # 1. Correlated Brownian continuous increment: L @ Z
        Z = np.random.standard_normal((n_sims, horizon_days, n_assets))
        dW = np.einsum('ij,skj->ski', L, Z)

        # 2. Compound Poisson jump increment
        # Sample number of jumps per asset: Poisson(lambda)
        jump_counts = np.random.poisson(lambda_vec, (n_sims, horizon_days, n_assets))
        # Log jump sizes: Normal(mu_jump, sigma_jump)
        jump_sizes = np.random.normal(mu_jump, sigma_jump, (n_sims, horizon_days, n_assets))
        jump_increments = jump_counts * jump_sizes

        # Total asset daily log returns
        asset_log_returns = drift_adjusted + dW + jump_increments
        asset_simple_returns = np.exp(asset_log_returns) - 1.0

        # Portfolio daily returns: dot product with weights w
        # Shape: (n_sims, horizon_days)
        port_daily_returns = np.einsum('ski,i->sk', asset_simple_returns, w)

        # Cumulative wealth trajectory: shape (n_sims, horizon_days + 1)
        cum_growth = np.cumprod(1.0 + port_daily_returns, axis=1)
        cum_wealth = np.hstack([np.full((n_sims, 1), initial_capital), initial_capital * cum_growth])

        # Compute percentile fan chart (5th, 25th, 50th, 75th, 95th)
        p05 = np.percentile(cum_wealth, 5, axis=0)
        p25 = np.percentile(cum_wealth, 25, axis=0)
        p50 = np.percentile(cum_wealth, 50, axis=0)
        p75 = np.percentile(cum_wealth, 75, axis=0)
        p95 = np.percentile(cum_wealth, 95, axis=0)

        terminal_wealth = cum_wealth[:, -1]
        terminal_returns = (terminal_wealth - initial_capital) / initial_capital

        # Risk metrics
        var_99 = float(-np.percentile(terminal_returns, 1))
        var_95 = float(-np.percentile(terminal_returns, 5))
        tail_losses_95 = terminal_returns[terminal_returns <= -var_95]
        cvar_95 = float(-tail_losses_95.mean()) if len(tail_losses_95) > 0 else var_95

        prob_loss_10pct = float(np.mean(terminal_returns < -0.10))
        prob_gain_15pct = float(np.mean(terminal_returns > 0.15))

        # Sample 3 individual simulation paths for visual overlay
        sample_paths = [
            [round(float(v), 2) for v in cum_wealth[0, :]],
            [round(float(v), 2) for v in cum_wealth[int(n_sims * 0.33), :]],
            [round(float(v), 2) for v in cum_wealth[int(n_sims * 0.66), :]]
        ]

        return {
            "model": "MERTON_JUMP_DIFFUSION_MONTE_CARLO",
            "n_sims": n_sims,
            "horizon_days": horizon_days,
            "initial_capital": initial_capital,
            "fan_chart": {
                "p05": [round(float(v), 2) for v in p05],
                "p25": [round(float(v), 2) for v in p25],
                "p50_median": [round(float(v), 2) for v in p50],
                "p75": [round(float(v), 2) for v in p75],
                "p95": [round(float(v), 2) for v in p95]
            },
            "sample_paths": sample_paths,
            "terminal_stats": {
                "mean_terminal_wealth": round(float(np.mean(terminal_wealth)), 2),
                "median_terminal_wealth": round(float(p50[-1]), 2),
                "worst_case_1pct": round(float(np.percentile(terminal_wealth, 1)), 2),
                "best_case_99pct": round(float(np.percentile(terminal_wealth, 99)), 2),
                "var_99_annual": round(var_99, 4),
                "var_95_annual": round(var_95, 4),
                "cvar_95_annual": round(cvar_95, 4),
                "prob_loss_gt_10pct": round(prob_loss_10pct, 4),
                "prob_gain_gt_15pct": round(prob_gain_15pct, 4)
            },
            "parameters": {
                "base_jump_lambda_annual": 3.0,
                "jump_mean_mu": mu_jump,
                "jump_std_sigma": sigma_jump,
                "compensator_kappa": round(float(kappa), 4)
            }
        }