"""
RISKOS Validation Engine (Backward Compatible Facade)
===================================================
Re-exports the comprehensive model validation suite from model_validation.py
while maintaining exact signature compatibility for legacy endpoints.
"""

from backend.engine.model_validation import (
    kupiec_test,
    christoffersen_test,
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
    deflated_sharpe_ratio,
)

__all__ = [
    "kupiec_test",
    "christoffersen_test",
    "kupiec_pof_test",
    "christoffersen_independence_test",
    "christoffersen_conditional_coverage_test",
    "basel_traffic_light",
    "pinball_loss",
    "quadratic_loss_cvar",
    "mean_absolute_error",
    "root_mean_squared_error",
    "symmetric_mape",
    "mase",
    "directional_accuracy",
    "prediction_interval_coverage",
    "probabilistic_sharpe_ratio",
    "deflated_sharpe_ratio",
]
