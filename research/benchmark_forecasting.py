"""
RISKOS Empirical Forecasting Benchmark Suite
============================================
Benchmarks Google TimesFM 3.0, Meta Prophet GAM, Merton Jump Diffusion,
and the Forecasting Ensemble against:
- Naive Persistence Baseline (y_hat_{t+h} = y_t)
- 20-day Simple Moving Average Baseline

Outputs statistical evaluation metrics:
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Symmetric MAPE (sMAPE)
- Mean Absolute Scaled Error (MASE)
- Directional Accuracy (Hit Rate %) with Binomial p-value
- 10-90% Prediction Interval Coverage (PICP)
"""

import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import numpy as np
import pandas as pd
from engine.forecasting_ensemble import ForecastingEnsemble
from engine.model_validation import (
    mean_absolute_error, root_mean_squared_error, symmetric_mape,
    mase, directional_accuracy, prediction_interval_coverage
)

def run_forecasting_benchmarks(symbol: str = "SYNTHETIC_INDEX", n_steps: int = 250, horizon: int = 30):
    print(f"\n{'='*75}")
    print(f"[BENCHMARK] RISKOS FORECASTING BENCHMARK: {symbol} (Lookback: {n_steps}d, Horizon: {horizon}d)")
    print(f"{'='*75}")
    
    # 1. Generate realistic benchmark path
    np.random.seed(42)
    daily_rets = np.random.normal(0.0006, 0.014, size=n_steps + horizon)
    full_prices = 1000.0 * np.cumprod(1.0 + daily_rets)
    
    train_prices = full_prices[:n_steps]
    actual_test = full_prices[n_steps:n_steps + horizon]
    current_p = train_prices[-1]
    
    # 2. Baselines
    naive_forecast = np.full(horizon, current_p)
    sma_forecast = np.full(horizon, np.mean(train_prices[-20:]))
    
    # 3. RISKOS Ensemble
    ensemble = ForecastingEnsemble()
    res = ensemble.generate_ensemble_forecast(
        list(train_prices),
        horizon=horizon,
        weighting_scheme="regime_conditioned",
        symbol=symbol
    )
    
    ens_traj = np.array(res["consensus_trajectory"])
    lb_p10 = np.array(res["lower_bound_p10"])
    ub_p90 = np.array(res["upper_bound_p90"])
    
    tfm_traj = np.array(res["individual_models"]["google_timesfm_30"]["median"])
    prp_traj = np.array(res["individual_models"]["meta_prophet_gam"]["median"])
    mrt_traj = np.array(res["individual_models"]["merton_jump_diffusion"]["median"])
    
    models = {
        "Naive Persistence": naive_forecast,
        "20-day SMA Baseline": sma_forecast,
        "Google TimesFM 3.0": tfm_traj,
        "Meta Prophet GAM": prp_traj,
        "Merton Jump-Diffusion": mrt_traj,
        "RISKOS Meta-Ensemble": ens_traj
    }
    
    results = []
    for name, pred in models.items():
        mae_val = mean_absolute_error(actual_test, pred)
        rmse_val = root_mean_squared_error(actual_test, pred)
        smape_val = symmetric_mape(actual_test, pred)
        mase_val = mase(actual_test, pred, train_prices, seasonality=1)
        dir_res = directional_accuracy(actual_test, pred, baseline_level=np.full(horizon, current_p))
        
        results.append({
            "Model": name,
            "MAE": round(mae_val, 2),
            "RMSE": round(rmse_val, 2),
            "sMAPE (%)": round(smape_val, 2),
            "MASE": round(mase_val, 3),
            "Hit Rate (%)": dir_res["hit_rate_pct"],
            "p-value (Dir)": dir_res["p_value_one_sided"]
        })
        
    df_results = pd.DataFrame(results)
    print(df_results.to_string(index=False))
    
    # Calibrated Interval Coverage on Ensemble
    picp_res = prediction_interval_coverage(actual_test, lb_p10, ub_p90, nominal_confidence=0.80)
    print(f"\nEnsemble 10%-90% Uncertainty Band Calibration:")
    print(f"  * Empirical Coverage (PICP): {picp_res['picp_pct']}% (Nominal: 80.0%)")
    print(f"  * Mean Prediction Interval Width (MPIW): {picp_res['mpiw']:.2f} pts")
    print(f"  * Status: {'CALIBRATED' if picp_res['calibrated'] else 'MARGINAL'}")
    print(f"{'='*75}\n")
    return df_results

if __name__ == "__main__":
    run_forecasting_benchmarks()
