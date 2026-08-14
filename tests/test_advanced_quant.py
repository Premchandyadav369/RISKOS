import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import pytest
import numpy as np
from risk_engine.quant_core import quant_engine

def test_ewma_volatility():
    returns = np.random.normal(0.0005, 0.015, 200)
    ewma = quant_engine.calculate_ewma(returns)
    assert "lambda_0.94" in ewma
    assert "annualized_vol" in ewma["lambda_0.94"]
    assert ewma["lambda_0.94"]["annualized_vol"] > 0

def test_garch_volatility():
    returns = np.random.normal(0.0005, 0.015, 200)
    garch = quant_engine.calculate_garch(returns)
    assert "garch_11" in garch
    assert "gjr_garch" in garch
    assert garch["garch_11"]["annualized_vol"] > 0

def test_ledoit_wolf_covariance():
    returns_matrix = np.random.normal(0.0005, 0.015, (200, 4))
    sample_cov, shrunk_cov, alpha = quant_engine.ledoit_wolf_covariance(returns_matrix)
    assert shrunk_cov.shape == (4, 4)
    assert 0 <= alpha <= 1.0

def test_cornish_fisher_var():
    returns = np.random.normal(0.0005, 0.015, 200)
    cf = quant_engine.cornish_fisher_var(returns)
    assert "parametric_var" in cf
    assert "cornish_fisher_var" in cf

def test_monte_carlo_simulation():
    weights = np.array([0.4, 0.3, 0.3])
    cov = np.eye(3) * 0.0002
    means = np.array([0.0005, 0.0004, 0.0006])
    mc = quant_engine.monte_carlo_simulation(weights, cov, means, n_simulations=1000)
    assert "1D" in mc
    assert "var_99" in mc["1D"]
    assert mc["1D"]["es_99"] >= mc["1D"]["var_99"]

def test_extreme_value_theory():
    returns = np.random.normal(0.0005, 0.015, 200)
    evt = quant_engine.extreme_value_theory(returns)
    assert "evt_tail_var_99" in evt
    assert "evt_tail_es_99" in evt

def test_var_backtesting():
    returns = np.random.normal(0.0005, 0.015, 200)
    var_estimates = np.full(len(returns), -0.03)
    bt = quant_engine.backtest_var(returns, var_estimates)
    assert "status" in bt
    assert bt["status"] in ["PASS", "FAIL"]

def test_reverse_stress_test():
    weights = np.array([0.5, 0.5])
    rst = quant_engine.reverse_stress_test(weights, target_loss=-0.25)
    assert rst["target_portfolio_loss"] == -0.25
    assert "required_nifty_shock" in rst
