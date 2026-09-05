"""
Tests for Universal Multi-Exchange Universe, Penny Stocks, and Observatory API Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from backend.api.main import app
from backend.engine.universe_ingest import (
    get_universe,
    get_penny_stocks,
    get_unusual_activity_radar,
    get_global_macro_model,
    get_catalyst_timeline
)


def test_universe_ingest_structure():
    univ = get_universe()
    assert isinstance(univ, list)
    assert len(univ) >= 15
    symbols = {x["symbol"] for x in univ}
    assert "IDEA.NS" in symbols or "RELIANCE.NS" in symbols
    penny_items = [x for x in univ if x.get("is_penny")]
    assert len(penny_items) >= 10


def test_penny_stocks_filters():
    penny_list = get_penny_stocks()
    assert len(penny_list) >= 15
    exchanges = {p["exchange"] for p in penny_list}
    assert "NSE" in exchanges
    assert "BSE" in exchanges
    assert any(ex in ("NASDAQ", "NYSE", "NYSE American") for ex in exchanges)

    for p in penny_list:
        assert "symbol" in p
        assert "price" in p
        assert "currency" in p
        assert p["price"] > 0
        if p["currency"] == "INR":
            assert p["price"] <= 38.50
        elif p["currency"] == "USD":
            assert p["price"] <= 10.0


def test_unusual_activity_radar():
    radar = get_unusual_activity_radar()
    assert len(radar) >= 10
    for item in radar:
        assert "symbol" in item
        assert "z_score" in item
        assert "volume_ratio" in item
        assert "signal_type" in item
        assert "baseline_20d" in item


def test_global_macro_model():
    macro = get_global_macro_model()
    assert "fomc" in macro
    assert "rbi" in macro
    assert "stress_slider_sensitivity" in macro
    assert macro["fomc"]["target_range"] == "5.25% - 5.50%"
    assert macro["rbi"]["repo_rate"] == 6.50
    assert macro["rbi"]["stance"] == "NEUTRAL"


def test_catalyst_timeline():
    events = get_catalyst_timeline()
    assert len(events) >= 5
    for ev in events:
        assert "time" in ev
        assert "title" in ev
        assert "symbol" in ev
        assert "impact" in ev


def test_fastapi_observatory_endpoints():
    client = TestClient(app)
    
    # 1. Universe
    res = client.get("/api/market/universe")
    assert res.status_code == 200
    data = res.json()
    assert "universe" in data
    assert len(data["universe"]) > 0
    
    # 2. Penny stocks
    res = client.get("/api/market/penny-stocks")
    assert res.status_code == 200
    data = res.json()
    assert "penny_stocks" in data
    assert len(data["penny_stocks"]) > 0

    # 3. Radar
    res = client.get("/api/observatory/radar")
    assert res.status_code == 200
    data = res.json()
    assert "radar" in data
    assert len(data["radar"]) > 0

    # 4. Macro
    res = client.get("/api/observatory/macro")
    assert res.status_code == 200
    data = res.json()
    assert "fomc" in data
    assert "rbi" in data

    # 5. Catalysts
    res = client.get("/api/observatory/catalysts")
    assert res.status_code == 200
    data = res.json()
    assert "catalysts" in data
    assert len(data["catalysts"]) > 0
