"""
Unit & Invariant Tests for RISKOS Model Validation Engine
========================================================
Tests statistical correctness for:
- Kupiec POF test
- Christoffersen Independence test
- Christoffersen Conditional Coverage Joint test
- Basel Committee Traffic Light Framework
- Pinball / Quantile Loss
- Quadratic Loss for CVaR
- MAE, RMSE, sMAPE, MASE
- Directional Accuracy with Binomial significance
- Prediction Interval Coverage (PICP / MPIW)
- Probabilistic Sharpe Ratio (PSR)
- Deflated Sharpe Ratio (DSR)
"""

import pytest
import numpy as np
import pandas as pd
from backend.engine.model_validation import (
    kupiec_pof_test,
    christoffersen_independence_test,
    christoffersen_conditional_coverage_test,
    basel_traffic_light,
    pinball_loss,
    quadratic_loss_cvar,
    mean_absolute_error,
    root_mean_squared_error,
    symmetric_mape,
    mase,
    directional_accuracy,
    prediction_interval_coverage,
    probabilistic_sharpe_ratio,
    deflated_sharpe_ratio
)


def test_kupiec_calibrated_model():
    """Test Kupiec POF passes when exceptions match expectation."""
    # 250 days, 99% VaR, expect 2.5 exceptions. Provide exactly 2 exceptions.
    returns = np.zeros(250)
    var_series = np.full(250, -0.02)
    # Breaches: return < var_series
    returns[10] = -0.03
    returns[150] = -0.04
    
    res = kupiec_pof_test(returns, var_series, confidence=0.99)
    assert res["pass"] is True
    assert res["n_exceptions"] == 2
    assert pytest.approx(res["nominal_rate"], 1e-4) == 0.01
    assert "ACCEPT H0" in res["decision"]


def test_kupiec_failed_model():
    """Test Kupiec POF rejects when exceptions are excessively high."""
    returns = np.zeros(250)
    var_series = np.full(250, -0.02)
    # 20 breaches out of 250 (8% vs expected 1%)
    returns[:20] = -0.03
    
    res = kupiec_pof_test(returns, var_series, confidence=0.99)
    assert res["pass"] is False
    assert res["n_exceptions"] == 20
    assert res["p_value"] < 0.01


def test_christoffersen_clustering():
    """Test Christoffersen detects clustered exceptions."""
    returns = np.zeros(250)
    var_series = np.full(250, -0.02)
    # 5 consecutive clustered breaches
    returns[50:55] = -0.03
    
    res = christoffersen_independence_test(returns, var_series, confidence=0.99)
    assert res["contingency_matrix"]["n11"] == 4  # 4 transitions from breach to breach
    assert res["transition_probs"]["pi11"] > res["transition_probs"]["pi01"]


def test_conditional_coverage_joint():
    """Test joint conditional coverage decomposes into LR_pof + LR_ind."""
    returns = np.zeros(250)
    var_series = np.full(250, -0.02)
    returns[10] = -0.03
    returns[100] = -0.04
    
    joint = christoffersen_conditional_coverage_test(returns, var_series, confidence=0.99)
    assert joint["pass"] is True
    assert abs(joint["test_stat"] - (joint["lr_pof"] + joint["lr_ind"])) < 1e-3


def test_basel_traffic_light_zones():
    """Test Basel Traffic Light categorization for Green, Yellow, and Red zones."""
    # Green: 0 to 4 exceptions
    green = basel_traffic_light(n_exceptions=3, n_observations=250, confidence=0.99)
    assert green["zone"] == "GREEN"
    assert green["basel_multiplier"] == 3.00
    
    # Yellow: 5 to 9 exceptions
    yellow = basel_traffic_light(n_exceptions=6, n_observations=250, confidence=0.99)
    assert yellow["zone"] == "YELLOW"
    assert yellow["basel_multiplier"] == 3.50
    
    # Red: 10+ exceptions
    red = basel_traffic_light(n_exceptions=11, n_observations=250, confidence=0.99)
    assert red["zone"] == "RED"
    assert red["basel_multiplier"] == 4.00


def test_pinball_loss():
    """Test pinball loss calculation and penalty structure."""
    y_true = np.array([0.05, -0.01, -0.03, 0.02])
    # Under-predicted quantile for the breach (-0.03 is worse than -0.02)
    q_est = np.array([-0.02, -0.02, -0.02, -0.02])
    loss = pinball_loss(y_true, q_est, alpha=0.01)
    assert loss > 0.0


def test_forecasting_metrics():
    """Test MAE, RMSE, sMAPE, and MASE on synthetic data."""
    y_true = np.array([100.0, 102.0, 105.0, 103.0, 108.0])
    y_pred = np.array([101.0, 101.0, 104.0, 104.0, 107.0])
    y_train = np.array([90.0, 92.0, 95.0, 98.0, 100.0])
    
    mae_val = mean_absolute_error(y_true, y_pred)
    assert mae_val == 1.0
    
    rmse_val = root_mean_squared_error(y_true, y_pred)
    assert rmse_val == 1.0
    
    smape_val = symmetric_mape(y_true, y_pred)
    assert 0.0 < smape_val < 5.0
    
    # Train naive differences are (92-90=2, 95-92=3, 98-95=3, 100-98=2) -> mean 2.5.
    # MASE = 1.0 / 2.5 = 0.40 (< 1.0 indicates outperforming naive).
    mase_val = mase(y_true, y_pred, y_train, seasonality=1)
    assert abs(mase_val - 0.40) < 1e-3


def test_directional_accuracy_significance():
    """Test directional accuracy hit rate and binomial significance."""
    # 20 observations, 18 correct directions
    y_true = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], dtype=float)
    y_pred = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 17, 18], dtype=float)
    
    res = directional_accuracy(y_true, y_pred)
    assert res["hit_rate_pct"] > 80.0
    assert res["is_significant_alpha_05"] is True
    assert res["p_value_one_sided"] < 0.01


def test_prediction_interval_coverage():
    """Test prediction interval coverage probability (PICP)."""
    y_true = np.array([10.0, 12.0, 14.0, 11.0, 13.0])
    lb = np.array([9.0, 11.0, 13.0, 10.0, 12.0])
    ub = np.array([11.0, 13.0, 15.0, 12.0, 14.0])
    
    res = prediction_interval_coverage(y_true, lb, ub, nominal_confidence=0.80)
    assert res["picp_pct"] == 100.0
    assert res["mpiw"] == 2.0


def test_probabilistic_and_deflated_sharpe():
    """Test PSR and DSR calculation."""
    # 1-year daily observations, annualized SR = 1.5 (daily ~ 1.5 / sqrt(252) = 0.0945)
    daily_sr = 1.5 / np.sqrt(252)
    psr = probabilistic_sharpe_ratio(observed_sr=daily_sr, benchmark_sr=0.0, n_samples=252)
    assert psr > 0.90
    
    # Multiple testing: tested 100 strategies, random trials with standard deviation of SRs = 0.5/sqrt(252)
    sr_trials = np.random.normal(0, 0.5 / np.sqrt(252), size=100)
    sr_trials[0] = daily_sr
    
    dsr_res = deflated_sharpe_ratio(observed_sr=daily_sr, sr_trials=sr_trials, n_samples=252)
    assert "deflated_sharpe_ratio" in dsr_res
    assert dsr_res["trials_tested"] == 100
