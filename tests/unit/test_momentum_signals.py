import pytest
import numpy as np
import pandas as pd
from backend.engine.signals import calculate_momentum_metrics, generate_signals

def test_calculate_momentum_metrics():
    np.random.seed(42)
    dates = pd.date_range('2025-01-01', periods=300, freq='B')
    trend = np.linspace(100, 200, 300)
    noise = np.random.normal(0, 1.5, 300)
    prices = pd.Series(trend + noise, index=dates)

    high = prices + 2.0
    low = prices - 2.0

    metrics = calculate_momentum_metrics(prices, high, low)

    assert 'tsmom_score' in metrics
    assert 'vol_scale_factor' in metrics
    assert 'donchian_breakout' in metrics
    assert 'chandelier_stop' in metrics
    assert 'adx_strength' in metrics

    assert metrics['tsmom_score'] > 0
    assert 0.1 <= metrics['vol_scale_factor'] <= 2.0
    assert metrics['chandelier_stop'] < prices.iloc[-1]

def test_generate_signals_with_momentum():
    res = generate_signals(tickers=['AAPL'], period='1y')
    assert 'signals' in res
    if len(res['signals']) > 0:
        sig = res['signals'][0]
        assert 'direction' in sig
        assert 'momentum' in sig
        assert 'tsmom_score' in sig['momentum']
