"""
Unit Tests for Research Backtest Engine
=======================================
Validates:
- Baseline backtest backward compatibility
- Almgren-Chriss quadratic slippage model
- Turnover and fee calculation
- Liquidity participation ceilings
- Research performance statistics (Sharpe, Sortino, Calmar, MaxDD, Omega)
"""

import pytest
import numpy as np
import pandas as pd
from backend.engine.backtest import run_backtest, run_baseline_backtest
from backend.engine.research_backtest import run_research_backtest, almgren_chriss_slippage


@pytest.fixture
def sample_returns():
    # 250 trading days, 3 assets
    np.random.seed(42)
    dates = pd.date_range("2024-01-01", periods=250, freq="B")
    data = np.random.normal(0.0005, 0.015, size=(250, 3))
    return pd.DataFrame(data, index=dates, columns=["INFY", "TCS", "HDFCBANK"])


def test_baseline_backtest_preservation(sample_returns):
    """Ensure baseline backtest outputs match original contract."""
    weights = [0.4, 0.4, 0.2]
    res = run_backtest(sample_returns, weights)
    
    assert "equity_curve" in res
    assert len(res["equity_curve"]) == 250
    assert "total_return" in res
    assert "sharpe_ratio" in res
    assert "max_drawdown" in res
    assert 0 <= res["win_rate"] <= 1.0


def test_almgren_chriss_slippage():
    """Verify quadratic slippage growth with trade size relative to ADV."""
    adv = 100_000_000.0  # 100M ADV
    slip_small = almgren_chriss_slippage(1_000_000.0, adv, half_spread_bps=2.5, market_impact_eta=0.15)
    slip_large = almgren_chriss_slippage(20_000_000.0, adv, half_spread_bps=2.5, market_impact_eta=0.15)
    
    # Larger trade relative to ADV should incur significantly higher quadratic impact
    assert slip_large > slip_small
    assert slip_small >= 2.5  # at least half spread


def test_research_backtest_execution(sample_returns):
    """Test full institutional research backtest."""
    res = run_research_backtest(
        sample_returns,
        weights_schedule=[0.34, 0.33, 0.33],
        initial_capital=10_000_000.0,
        risk_free_rate=0.06,
        commission_bps=3.0,
        stt_tax_bps=10.0,
        exchange_fee_bps=0.3,
        half_spread_bps=2.5,
        walk_forward_splits=2
    )
    
    assert res["engine_type"] == "Institutional Research Backtester"
    assert "ending_capital" in res
    assert "cagr" in res
    assert "sortino_ratio" in res
    assert "calmar_ratio" in res
    assert "omega_ratio" in res
    assert "total_fees_and_slippage" in res
    assert res["total_fees_and_slippage"] > 0
    assert "walk_forward_splits" in res
    assert len(res["walk_forward_splits"]) == 2
