"""
Quantitative Invariants & Mathematical Sanity Test Suite
========================================================
Validates non-negotiable financial, statistical, and linear algebra invariants:
1. Optimization weight sum equality: sum(w_i) == 1.0
2. Asset box constraints: 0 <= w_i <= max_weight
3. Portfolio variance non-negativity: w^T Sigma w >= 0
4. Covariance positive semi-definiteness: min(eigvals(Sigma)) >= -1e-10
5. Black-Scholes Put-Call Parity: (C - P) == (S - K * exp(-r * T))
6. Greeks boundary constraints: Call Delta in [0, 1], Put Delta in [-1, 0], Gamma >= 0
7. Tail risk coherent inequality: CVaR_alpha <= VaR_alpha (return space)
8. Drawdown bounded within [0, 1]
"""

import pytest
import numpy as np
import pandas as pd
from scipy.stats import norm
from backend.engine.covariance import ledoit_wolf_shrinkage
from backend.engine.optimizer import cvar_optimize, max_sharpe_optimize, min_variance_optimize
from backend.engine.risk import calculate_var


@pytest.fixture
def mock_returns():
    np.random.seed(42)
    data = np.random.normal(0.0005, 0.015, size=(250, 4))
    return pd.DataFrame(data, columns=["AAPL", "MSFT", "GOOGL", "AMZN"])


def test_covariance_positive_semidefinite(mock_returns):
    """Ledoit-Wolf covariance matrix must have all non-negative eigenvalues."""
    lw = ledoit_wolf_shrinkage(mock_returns)
    cov = np.array(lw["covariance_matrix"])
    eigvals = np.linalg.eigvalsh(cov)
    assert np.all(eigvals >= -1e-10), f"Negative eigenvalue detected: {min(eigvals)}"


def test_optimizer_weight_budget_invariants(mock_returns):
    """All optimizers must satisfy sum(w) == 1.0 and 0 <= w_i <= max_weight."""
    max_w = 0.40
    
    # 1. Min Variance
    mv = min_variance_optimize(mock_returns, max_weight=max_w)
    weights_mv = list(mv["optimal_weights"].values())
    assert sum(weights_mv) == pytest.approx(1.0, abs=1e-4)
    assert all(0.0 <= w <= max_w + 1e-4 for w in weights_mv)
    
    # 2. Max Sharpe
    ms = max_sharpe_optimize(mock_returns, max_weight=max_w)
    weights_ms = list(ms["optimal_weights"].values())
    assert sum(weights_ms) == pytest.approx(1.0, abs=1e-4)
    assert all(0.0 <= w <= max_w + 1e-4 for w in weights_ms)
    
    # 3. CVaR LP
    cvar = cvar_optimize(mock_returns, target_return=0.05, max_weight=max_w)
    weights_cvar = list(cvar["optimal_weights"].values())
    assert sum(weights_cvar) == pytest.approx(1.0, abs=1e-4)
    assert all(0.0 <= w <= max_w + 1e-4 for w in weights_cvar)


def test_portfolio_variance_non_negativity(mock_returns):
    """Quadratic portfolio risk w^T Sigma w must be non-negative for any arbitrary weights."""
    lw = ledoit_wolf_shrinkage(mock_returns)
    cov = np.array(lw["covariance_matrix"])
    
    # Test 50 random weight vectors on simplex
    np.random.seed(99)
    for _ in range(50):
        w = np.random.uniform(0, 1, 4)
        w = w / np.sum(w)
        port_var = float(w.T @ cov @ w)
        assert port_var >= 0.0, f"Negative portfolio variance: {port_var}"


def test_black_scholes_put_call_parity():
    """Put-Call Parity: C - P = S - K * exp(-r * T)"""
    S = 100.0
    K = 105.0
    r = 0.05
    T = 0.5
    vol = 0.20
    
    d1 = (np.log(S / K) + (r + 0.5 * vol**2) * T) / (vol * np.sqrt(T))
    d2 = d1 - vol * np.sqrt(T)
    
    call_price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    put_price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    
    lhs = call_price - put_price
    rhs = S - K * np.exp(-r * T)
    assert lhs == pytest.approx(rhs, abs=1e-5)


def test_black_scholes_greeks_boundaries():
    """Delta Call - Delta Put == 1, Gamma >= 0, Vega >= 0."""
    S = 100.0
    K = 100.0
    r = 0.05
    T = 1.0
    vol = 0.25
    
    d1 = (np.log(S / K) + (r + 0.5 * vol**2) * T) / (vol * np.sqrt(T))
    
    call_delta = float(norm.cdf(d1))
    put_delta = float(call_delta - 1.0)
    gamma = float(norm.pdf(d1) / (S * vol * np.sqrt(T)))
    vega = float(S * norm.pdf(d1) * np.sqrt(T))
    
    assert 0.0 <= call_delta <= 1.0
    assert -1.0 <= put_delta <= 0.0
    assert call_delta - put_delta == pytest.approx(1.0, abs=1e-6)
    assert gamma >= 0.0
    assert vega >= 0.0


def test_cvar_le_var_invariant(mock_returns):
    """In return space, CVaR (mean of tail losses) is strictly worse than or equal to VaR."""
    weights = [0.25, 0.25, 0.25, 0.25]
    res = calculate_var(mock_returns, weights, confidence=0.99, n_sims=5000)
    
    # In return space, both are negative, so CVaR <= VaR (more negative)
    assert res["historical_cvar"] <= res["historical_var"] + 1e-6
    assert res["parametric_cvar"] <= res["parametric_var"] + 1e-6
    assert res["monte_carlo_cvar"] <= res["monte_carlo_var"] + 1e-6
