import pytest
import numpy as np
from backend.engine.market_state import build_canonical_market_state, MarketState, ProvenanceStatus
from backend.engine.recommender import RecommendationAuditLedger


def test_market_state_invariants():
    ms = build_canonical_market_state('RELIANCE')
    assert isinstance(ms, MarketState)
    assert ms.symbol.startswith('RELIANCE')
    assert ms.price > 0.0
    assert 'close' in ms.ohlcv and len(ms.ohlcv['close']) > 0
    assert 'annualized_close_to_close' in ms.volatility
    assert ms.volatility['annualized_close_to_close'] > 0.0
    assert ms.volatility['parkinson_estimator'] > 0.0
    assert ms.volatility['garman_klass_estimator'] > 0.0
    assert 'state' in ms.regime
    assert 'adv_20d_shares' in ms.liquidity
    assert ms.liquidity['adv_20d_shares'] > 0
    assert any(k.lower() == 'momentum' for k in ms.factor_exposures)
    assert 't1_tactical' in ms.forecast
    assert ms.forecast['t1_tactical']['price'] > ms.price
    assert ms.risk_metrics['risk_reward_ratio'] >= 1.8


def test_market_state_provenance_explicit():
    ms = build_canonical_market_state('NVDA')
    prov = ms.provenance
    assert 'status' in prov
    valid_statuses = {
        ProvenanceStatus.LIVE,
        ProvenanceStatus.DELAYED,
        ProvenanceStatus.CACHED,
        ProvenanceStatus.FALLBACK,
        ProvenanceStatus.SYNTHETIC,
        ProvenanceStatus.UNAVAILABLE
    }
    assert prov['status'] in valid_statuses
    assert 'as_of' in prov
    assert 'retrieval_timestamp' in prov
    assert 'quality_score' in prov
    assert 0.0 <= prov['quality_score'] <= 100.0


def test_recommender_audit_ledger():
    rec_sample = {
        'ticker': 'TEST_STOCK',
        'spotPrice': 100.0,
        'predictedTargets': {'t1': 106.0},
        'riskManagement': {'stopLoss': 96.0},
        'convictionScore': 90,
        'strategyStyle': 'TSMOM Breakout',
        'regime': 'Bull'
    }
    RecommendationAuditLedger.record_recommendation(rec_sample)
    trail = RecommendationAuditLedger.get_audit_trail()
    assert len(trail) > 0
    stats = RecommendationAuditLedger.compute_summary_statistics()
    assert 'hit_rate_pct' in stats
    assert 0.0 <= stats['hit_rate_pct'] <= 100.0
    assert 'model_version' in stats
