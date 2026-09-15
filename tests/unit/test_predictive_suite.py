import pytest
import numpy as np
import pandas as pd
from backend.engine.prophet_engine import ProphetGAMModel
from backend.engine.merton_jump_montecarlo import MertonJumpDiffusionSimulator
from backend.engine.portfolio_prediction import RealTimePortfolioPredictor

def test_prophet_gam_monotonic_bounds():
    model = ProphetGAMModel(n_changepoints=6, seasonality_order=2)
    prices = [100.0 * (1 + 0.001 * i + 0.005 * np.sin(i / 3.0)) for i in range(50)]
    res = model.fit_and_predict(prices, horizon_days=30)

    assert res["model"] == "META_PROPHET_GAM"
    assert len(res["point_forecast"]) == 30
    assert len(res["upper_95"]) == 30
    assert len(res["lower_95"]) == 30

    for u, p, l in zip(res["upper_95"], res["point_forecast"], res["lower_95"]):
        assert u >= p
        assert p >= l

def test_merton_jump_diffusion_fan_chart():
    sim = MertonJumpDiffusionSimulator(seed=123)
    np.random.seed(123)
    returns = pd.DataFrame({
        "ASSET_A": np.random.normal(0.0008, 0.015, 100),
        "ASSET_B": np.random.normal(0.0006, 0.018, 100)
    })
    res = sim.simulate_paths(returns, weights=[0.6, 0.4], initial_capital=1000000.0, horizon_days=30, n_sims=200)

    assert res["model"] == "MERTON_JUMP_DIFFUSION_MONTE_CARLO"
    fc = res["fan_chart"]
    assert len(fc["p50_median"]) == 31  # T=0 to T=30
    # Check percentile ordering at terminal step
    assert fc["p95"][-1] >= fc["p75"][-1] >= fc["p50_median"][-1] >= fc["p25"][-1] >= fc["p05"][-1]
    assert res["terminal_stats"]["var_99_annual"] is not None

def test_portfolio_predictor_ensemble():
    predictor = RealTimePortfolioPredictor()
    holdings = {
        "RELIANCE.NS": {"quantity": 100, "avg_cost": 2900, "current_price": 3000},
        "AAPL": {"quantity": 50, "avg_cost": 200, "current_price": 220}
    }
    res = predictor.predict_user_portfolio(holdings, horizon_days=20, n_sims=100)

    assert res["portfolio_nav"] == 311000.0
    assert len(res["ensemble_consensus_trajectory"]) == 20
    assert len(res["macro_stress_scenarios"]) == 4