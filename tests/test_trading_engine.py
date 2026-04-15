import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from trading_engine.pairs_trading import run_pairs_trading_strategy
from trading_engine.delta_hedging import run_delta_hedging_strategy
from trading_engine.momentum import run_momentum_strategy
from trading_engine.risk_parity import run_risk_parity_strategy
from trading_engine.backtest import run_all_strategies_backtest

def test_pairs_trading():
    res = run_pairs_trading_strategy()
    assert "current_z_score" in res
    assert res["win_rate_pct"] > 50.0
    assert len(res["trades"]) >= 1

def test_delta_hedging():
    res = run_delta_hedging_strategy()
    assert "net_delta_exposure" in res
    assert res["options_contracts"] == 100

def test_momentum():
    res = run_momentum_strategy()
    assert res["strategy_sharpe"] > 1.0
    assert len(res["rankings"]) > 0

def test_risk_parity():
    res = run_risk_parity_strategy()
    assert res["assets_count"] > 0
    assert len(res["allocations"]) > 0

def test_backtest():
    res = run_all_strategies_backtest()
    assert res["active_strategies_count"] == 5
    assert len(res["equity_curve"]) == 30
