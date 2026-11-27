import pytest
import numpy as np
import pandas as pd
from backend.engine.optimizer import (
    black_litterman_news_optimize,
    hierarchical_risk_parity_optimize,
    momentum_tilt_optimize,
    generate_rebalance_blotter
)
from backend.engine.report_engine import ExecutiveReportCompiler

def test_black_litterman_news_optimize():
    np.random.seed(42)
    returns = pd.DataFrame({
        "RELIANCE.NS": np.random.normal(0.001, 0.014, 150),
        "HDFCBANK.NS": np.random.normal(0.0008, 0.012, 150),
        "AAPL": np.random.normal(0.0012, 0.018, 150)
    })
    # Strong positive view on Reliance
    views = {"RELIANCE.NS": 0.08, "AAPL": -0.02}
    res = black_litterman_news_optimize(returns, news_views=views, max_weight=0.60)

    assert res["model"] == "BLACK_LITTERMAN_NEWS_OPTIMIZER"
    weights = res["optimal_weights"]
    assert pytest.approx(sum(weights.values()), 0.01) == 1.0
    # Positively viewed asset should get higher allocation than negatively viewed asset
    assert weights["RELIANCE.NS"] > weights["AAPL"]

def test_hierarchical_risk_parity_optimize():
    np.random.seed(42)
    returns = pd.DataFrame({
        "A": np.random.normal(0.001, 0.01, 100),
        "B": np.random.normal(0.001, 0.02, 100),
        "C": np.random.normal(0.001, 0.03, 100)
    })
    res = hierarchical_risk_parity_optimize(returns)
    assert res["model"] == "HIERARCHICAL_RISK_PARITY"
    weights = res["optimal_weights"]
    assert pytest.approx(sum(weights.values()), 0.01) == 1.0
    # Lowest variance asset A should receive highest weight
    assert weights["A"] >= weights["B"]
    assert weights["B"] >= weights["C"]

def test_rebalance_blotter():
    current_holdings = {
        "RELIANCE.NS": {"quantity": 100, "current_price": 3000.0}, # Val = 300k
        "AAPL": {"quantity": 50, "current_price": 200.0}          # Val = 10k
    }
    # Target 50% / 50%
    target_w = {"RELIANCE.NS": 0.50, "AAPL": 0.50}
    blotter = generate_rebalance_blotter(current_holdings, target_w, total_capital=310000.0)

    assert blotter["orders_count"] == 2
    actions = {o["symbol"]: o["action"] for o in blotter["rebalance_orders"]}
    assert actions["RELIANCE.NS"] == "SELL" # overweight
    assert actions["AAPL"] == "BUY"         # underweight

def test_report_memorandum():
    compiler = ExecutiveReportCompiler()
    res = compiler.compile_memorandum(
        portfolio_state={"portfolio_nav": 5000000.0},
        prediction_results={},
        optimizer_results={},
        rebalance_blotter={"rebalance_orders": [], "total_turnover_notional": 0.0, "turnover_pct": 0.0},
        news_items=[{"title": "Markets Rally", "source": "Reuters", "sentiment_class": "BULLISH"}]
    )
    assert "SHA-256 State Seal" in res["markdown"]
    assert len(res["sha256_hash"]) == 64

def test_momentum_tilt_optimize():
    np.random.seed(42)
    # Asset A has high positive trend, Asset B is flat, Asset C has negative trend
    returns = pd.DataFrame({
        "WINNER": np.random.normal(0.003, 0.015, 260),
        "NEUTRAL": np.random.normal(0.0005, 0.012, 260),
        "LOSER": np.random.normal(-0.002, 0.018, 260)
    })
    res = momentum_tilt_optimize(returns, momentum_intensity=0.60, max_weight=0.60)
    assert res["model"] in ["CARHART_WML_MOMENTUM_TILT", "MOMENTUM_WML"]
    weights = res["optimal_weights"]
    assert pytest.approx(sum(weights.values()), 0.01) == 1.0
    # Winner should have higher allocation than Loser due to Carhart WML tilt
    assert weights["WINNER"] > weights["LOSER"]
    assert len(res["momentum_rankings"]) == 3
    assert res["momentum_rankings"][0]["symbol"] == "WINNER"
    assert res["wml_spread_pct"] > 0
    assert res["sharpe_ratio"] != 0.0