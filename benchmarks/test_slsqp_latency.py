"""
RISKOS — Pytest SLSQP Latency & Numerical Convergence Assertion Suite
=====================================================================
Validates sub-5ms execution latency for standard portfolios and guarantees
mathematical invariants across 10, 50, and 200 asset dimensions.
Run with: python -m pytest benchmarks/test_slsqp_latency.py -v
"""

import pytest
import time
import numpy as np
import pandas as pd
from benchmarks.benchmark_slsqp import generate_benchmark_returns, run_slsqp_benchmark
from backend.engine.optimizer import min_variance_optimize, max_sharpe_optimize, cvar_optimize


def test_slsqp_latency_n10_sub_5ms():
    """Validates that a 10-asset portfolio achieves sub-5ms decision latency."""
    res = run_slsqp_benchmark(n_assets=10, n_iterations=30)
    assert res["sub_5ms_achieved"], f"N=10 median latency {res['median_ms']}ms exceeded 5.0ms SLA"
    assert res["invariant_success_rate"] == 100.0, "All 10-asset optimizations must satisfy mathematical invariants"


def test_slsqp_latency_n50_convergence():
    """Validates that a 50-asset (NIFTY 50 / S&P 500 sub-index) converges with strict invariants."""
    res = run_slsqp_benchmark(n_assets=50, n_iterations=30)
    assert res["median_ms"] < 35.0, f"N=50 median latency {res['median_ms']}ms exceeded upper bound"
    assert res["invariant_success_rate"] == 100.0, "All 50-asset optimizations must satisfy mathematical invariants"


def test_slsqp_n200_large_scale_invariants():
    """Validates that a 200-asset universe converges without numerical collapse."""
    res = run_slsqp_benchmark(n_assets=200, n_iterations=10)
    assert res["invariant_success_rate"] == 100.0, "All 200-asset optimizations must satisfy mathematical invariants"


def test_optimizer_mathematical_invariants_across_models():
    """Directly tests Min-Variance, Max-Sharpe, and CVaR models against all invariants:
       1. sum(w_i) == 1.000 +/- 1e-4
       2. w_i >= 0 (no unhedged naked shorts)
       3. Quadratic variance w^T Sigma w >= 0
    """
    returns = generate_benchmark_returns(n_assets=15, n_days=252, seed=123)
    
    # 1. Min Variance
    mv = min_variance_optimize(returns, max_weight=0.30)
    w_mv = np.array(list(mv["optimal_weights"].values()))
    assert np.sum(w_mv) == pytest.approx(1.0, abs=1e-4), "Min variance weights must sum to 1.0"
    assert np.all(w_mv >= -1e-6), "Min variance weights must be non-negative"
    assert mv["volatility"] >= 0.0, "Portfolio volatility must be non-negative"
    
    # 2. Max Sharpe
    ms = max_sharpe_optimize(returns, risk_free_rate=0.065, max_weight=0.30)
    w_ms = np.array(list(ms["optimal_weights"].values()))
    assert np.sum(w_ms) == pytest.approx(1.0, abs=1e-4), "Max Sharpe weights must sum to 1.0"
    assert np.all(w_ms >= -1e-6), "Max Sharpe weights must be non-negative"
    assert ms["volatility"] >= 0.0, "Portfolio volatility must be non-negative"
    
    # 3. CVaR Min
    cv = cvar_optimize(returns, target_return=0.10, max_weight=0.30)
    w_cv = np.array(list(cv["optimal_weights"].values()))
    assert np.sum(w_cv) == pytest.approx(1.0, abs=1e-4), "CVaR weights must sum to 1.0"
    assert np.all(w_cv >= -1e-6), "CVaR weights must be non-negative"
    assert cv["volatility"] >= 0.0, "Portfolio volatility must be non-negative"
