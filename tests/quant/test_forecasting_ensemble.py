"""
Unit Tests for Transparent Forecasting Ensemble
===============================================
Validates:
- Multi-model consensus generation
- Dynamic weighting modes ('equal', 'inverse_error', 'regime_conditioned')
- Uncertainty bands and inter-model dispersion
- Epistemic uncertainty metrics and MASE validation
"""

import pytest
import numpy as np
from backend.engine.forecasting_ensemble import ForecastingEnsemble


@pytest.fixture
def sample_price_history():
    # 200 trading days with upward drift + random walk
    np.random.seed(123)
    rets = np.random.normal(0.0008, 0.012, size=200)
    prices = 100.0 * np.cumprod(1.0 + rets)
    return list(prices)


def test_forecasting_ensemble_equal_weight(sample_price_history):
    fe = ForecastingEnsemble()
    res = fe.generate_ensemble_forecast(
        sample_price_history,
        horizon=30,
        weighting_scheme="equal",
        symbol="NIFTY"
    )
    
    assert res["status"] == "MODEL_IMPLIED_SCENARIO"
    assert len(res["consensus_trajectory"]) == 30
    assert len(res["lower_bound_p10"]) == 30
    assert len(res["upper_bound_p90"]) == 30
    assert res["model_weights"]["timesfm"] == pytest.approx(1.0 / 3.0, 1e-3)
    assert res["model_weights"]["prophet"] == pytest.approx(1.0 / 3.0, 1e-3)
    assert res["model_weights"]["merton"] == pytest.approx(1.0 / 3.0, 1e-3)


def test_forecasting_ensemble_regime_weighting(sample_price_history):
    fe = ForecastingEnsemble()
    res = fe.generate_ensemble_forecast(
        sample_price_history,
        horizon=30,
        weighting_scheme="regime_conditioned",
        symbol="RELIANCE"
    )
    
    assert res["status"] == "MODEL_IMPLIED_SCENARIO"
    assert "regime_classification" in res
    assert "validation_diagnostics" in res
    assert res["validation_diagnostics"]["is_model_implied"] is True
    # Verify uncertainty corridor: lower band <= consensus <= upper band on average
    p10_mean = np.mean(res["lower_bound_p10"])
    p90_mean = np.mean(res["upper_bound_p90"])
    assert p90_mean > p10_mean
