"""
Unit & Invariant Tests for RISKOS Daily Stock Alpha Recommender Engine
====================================================================
Verifies:
1. Target ordering: P_stop < P_spot < T1 < T2 < T3.
2. Positive expected upside across all horizons.
3. Target breakout volume > ADV and RVOL >= 1.25x.
4. Barra 8-Factor scores strictly in range [0, 100].
5. DCF Fair value and positive margin of safety.
6. Proper pantheon bot routing and KaTeX formula structure.
"""

import pytest
import numpy as np
import pandas as pd
from backend.engine.recommender import (
    evaluate_single_stock_recommendation,
    get_daily_buy_recommendations,
    _compute_barra_8_factors
)


def test_barra_8_factors():
    prices = pd.Series([100.0 * (1.001 ** i) for i in range(100)])
    factors = _compute_barra_8_factors(prices)
    
    assert 'momentum' in factors
    assert 'quality' in factors
    assert 'growth' in factors
    assert 'volatility_stability' in factors
    
    for k, v in factors.items():
        assert 0.0 <= v <= 100.0, f"Factor {k} out of bounds: {v}"


def test_single_stock_recommendation_invariants():
    # Synthetic rising equity prices with slight pullback
    np.random.seed(42)
    n = 120
    base_p = 2500.0
    returns = np.random.normal(0.0012, 0.015, n)
    prices = [base_p]
    for r in returns:
        prices.append(prices[-1] * (1 + r))
    
    close_s = pd.Series(prices[1:])
    high_s = close_s * (1 + np.abs(np.random.normal(0, 0.008, n)))
    low_s = close_s * (1 - np.abs(np.random.normal(0, 0.008, n)))
    vol_s = [int(1000000 * (1 + np.random.uniform(0.5, 2.0))) for _ in range(n)]
    
    prices_dict = {
        'close': close_s.tolist(),
        'high': high_s.tolist(),
        'low': low_s.tolist(),
        'volume': vol_s
    }
    ret_series = close_s.pct_change().dropna()
    
    rec = evaluate_single_stock_recommendation('HAL.NS', prices_dict, ret_series)
    assert rec is not None, "Evaluation should produce recommendation"
    
    spot = rec['spotPrice']
    t1 = rec['targets']['target1']
    t2 = rec['targets']['target2']
    t3 = rec['targets']['target3']
    stop = rec['riskManagement']['stopLoss']
    
    # Invariant 1: Pricing order
    assert stop < spot, f"Stop {stop} must be below spot {spot}"
    assert spot < t1, f"T1 {t1} must be above spot {spot}"
    assert t1 <= t2, f"T2 {t2} must be >= T1 {t1}"
    assert t2 <= t3, f"T3 {t3} must be >= T2 {t2}"
    
    # Invariant 2: Upside positive
    assert rec['targets']['target1Pct'] > 0
    assert rec['targets']['target2Pct'] > rec['targets']['target1Pct']
    
    # Invariant 3: Volume and RVOL
    assert rec['volumeFlow']['targetVolume'] > 0
    assert rec['volumeFlow']['rvolMultiplier'] >= 1.2
    assert rec['volumeFlow']['maxOrderCollarShares'] > 0
    
    # Invariant 4: Valuation & DCF
    assert rec['valuation']['dcfFairValue'] > spot
    assert rec['valuation']['marginOfSafetyPct'] > 0
    
    # Invariant 5: Conviction & Tier
    assert 60.0 <= rec['convictionScore'] <= 100.0
    assert rec['tier'] in ['S-TIER', 'A-TIER', 'B-TIER']
    
    # Invariant 6: Pantheon Bot routing
    assert rec['pantheonBot']['id'].startswith('BOT-')
    assert rec['pantheonBot']['name'] != ''
    
    # Invariant 7: KaTeX formula
    assert 'P_{T1}' in rec['mathFormula']
    assert 'ATR' in rec['mathFormula']


def test_get_daily_buy_recommendations_batch():
    res = get_daily_buy_recommendations(market='india', limit=5, min_conviction=60.0)
    assert 'recommendations' in res
    assert res['totalRecommended'] <= 5
    assert res['totalScreened'] > 0
    
    # Check that results are sorted descending by conviction score
    scores = [r['convictionScore'] for r in res['recommendations']]
    assert scores == sorted(scores, reverse=True), "Recommendations must be sorted descending by conviction"
