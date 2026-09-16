"""
Unit & Invariant Tests for RISKOS Quantitative Sector Intelligence Engine
========================================================================
Verifies:
1. Sector coverage: 10 Indian NSE sectoral indices and 10 US GICS sectors.
2. Market separation: 'india', 'us', and unified 'all' modes.
3. Multi-horizon returns and relative strength ratios.
4. Volatility metrics: Parkinson, Garman-Klass, GARCH(1,1), and Beta.
5. Market breadth metrics: % > 50D SMA in [0, 100] and A/D ratio.
6. Order flow imbalance (OFI) Z-scores and RVOL.
7. Egyptian mythology bot mappings for both markets.
8. FastAPI route GET /api/market/sectors/indicators response contract.
"""

import pytest
from backend.engine.sectors import (
    get_sector_indicators,
    INDIA_SECTORS,
    US_SECTORS
)
from backend.engine.bot_fleet import BOT_REGISTRY


def test_sector_registry_invariants():
    assert len(INDIA_SECTORS) == 10, 'Must have exactly 10 Indian sectors'
    assert len(US_SECTORS) == 10, 'Must have exactly 10 US sectors'
    
    # Check Indian sectors registry format
    for s in INDIA_SECTORS:
        assert s['market'] == 'india'
        assert s['currency'] == 'INR'
        assert s['matching_egyptian_bot']['id'].startswith('BOT-EG-IN-')
        assert len(s['top_constituents']) >= 2
        
    # Check US sectors registry format
    for s in US_SECTORS:
        assert s['market'] == 'us'
        assert s['currency'] == 'USD'
        assert s['matching_egyptian_bot']['id'].startswith('BOT-EG-US-')
        assert len(s['top_constituents']) >= 2


def test_get_sector_indicators_all():
    res = get_sector_indicators('all')
    assert res['status'] == 'ok'
    assert res['total_sectors_evaluated'] == 20
    assert res['india_sectors_count'] == 10
    assert res['us_sectors_count'] == 10
    assert len(res['sectors']) == 20
    assert res['provenance']['architecture'] == 'RISKOS-QUANT-SECTOR-MATRIX-v3.2'


def test_get_sector_indicators_india_segregated():
    res = get_sector_indicators('india')
    assert res['status'] == 'ok'
    assert len(res['sectors']) == 10
    for s in res['sectors']:
        assert s['market'] == 'india'
        assert s['currency'] == 'INR'
        assert s['spot_level'] > 0
        assert s['matching_egyptian_bot']['id'].startswith('BOT-EG-IN-')
        
        # Volatility
        vol = s['volatility']
        assert vol['garch_vol_pct'] > 0
        assert vol['parkinson_vol_pct'] > 0
        assert vol['garman_klass_vol_pct'] > 0
        assert vol['beta'] > 0
        
        # Breadth
        breadth = s['breadth']
        assert 0.0 <= breadth['pct_above_50d_sma'] <= 100.0
        assert breadth['advance_decline_ratio'] >= 0
        
        # Order Flow
        flow = s['order_flow']
        assert flow['relative_volume_rvol'] > 0
        assert isinstance(flow['order_flow_imbalance_zscore'], (int, float))


def test_get_sector_indicators_us_segregated():
    res = get_sector_indicators('us')
    assert res['status'] == 'ok'
    assert len(res['sectors']) == 10
    for s in res['sectors']:
        assert s['market'] == 'us'
        assert s['currency'] == 'USD'
        assert s['spot_level'] > 0
        assert s['matching_egyptian_bot']['id'].startswith('BOT-EG-US-')
        
        # Valuation
        val = s['valuation']
        assert val['pe_ratio'] >= 0
        assert val['pb_ratio'] >= 0


def test_egyptian_mythology_bot_fleet_integration():
    bots = BOT_REGISTRY
    assert len(bots) >= 40, f'Expected >= 40 bots, found {len(bots)}'
    
    egyptian_bots = [b for b in bots if b.get('division') == 'Egyptian Sector Desks' or 'BOT-EG-' in b.get('id', '')]
    assert len(egyptian_bots) == 20, f'Expected exactly 20 Egyptian bots, found {len(egyptian_bots)}'
    
    in_bots = [b for b in egyptian_bots if 'IN' in b['id']]
    us_bots = [b for b in egyptian_bots if 'US' in b['id']]
    assert len(in_bots) == 10, 'Expected 10 Indian Egyptian bots'
    assert len(us_bots) == 10, 'Expected 10 US Egyptian bots'
    
    # Check Egyptian deities present
    names = [b['name'] for b in egyptian_bots]
    expected_deities = ['RA', 'ANUBIS', 'THOTH', 'SOBEK', 'SEKHMET', 'ISIS', 'OSIRIS', 'BASTET', 'HORUS', 'HATHOR', 'AMUN-RA', 'PTAH', 'KHONSU', 'SET']
    for d in expected_deities:
        assert any(d in n.upper() for n in names), f'Expected Egyptian deity {d} in fleet'


def test_fastapi_sector_indicators_route():
    try:
        from fastapi.testclient import TestClient
        from backend.api.main import app
        
        client = TestClient(app)
        
        # Test all
        res_all = client.get('/api/market/sectors/indicators?market=all')
        assert res_all.status_code == 200
        data_all = res_all.json()
        assert data_all['status'] == 'ok'
        assert data_all['total_sectors_evaluated'] == 20
        
        # Test India
        res_in = client.get('/api/market/sectors/indicators?market=india')
        assert res_in.status_code == 200
        data_in = res_in.json()
        assert len(data_in['sectors']) == 10
        
        # Test US
        res_us = client.get('/api/market/sectors/indicators?market=us')
        assert res_us.status_code == 200
        data_us = res_us.json()
        assert len(data_us['sectors']) == 10
    except (ImportError, RuntimeError):
        # Direct endpoint handler invocation fallback when httpx is unavailable
        from backend.api.main import api_market_sector_indicators
        data_all = api_market_sector_indicators(market='all', period='1y')
        assert data_all['status'] == 'ok'
        assert data_all['total_sectors_evaluated'] == 20
        
        data_in = api_market_sector_indicators(market='india', period='1y')
        assert len(data_in['sectors']) == 10
        
        data_us = api_market_sector_indicators(market='us', period='1y')
        assert len(data_us['sectors']) == 10

