"""
Test Suite for Universal Instrument Registry & Data Layer
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from engine.instruments import (
    search_instruments, resolve_symbol_format, get_quote,
    get_historical_ohlcv, get_fundamentals, get_news,
    get_market_breadth, get_sector_performance, INSTRUMENT_REGISTRY
)

def test_symbol_normalization():
    assert resolve_symbol_format("Reliance") == "RELIANCE.NS"
    assert resolve_symbol_format("500570") in ["TATAMOTORS.NS", "500570.BO"]
    assert resolve_symbol_format("NIFTY 50") == "^NSEI"
    assert resolve_symbol_format("NVDA") == "NVDA"
    assert resolve_symbol_format("AAPL") == "AAPL"

def test_universal_search():
    search_res = search_instruments("Tata", limit=5)
    assert len(search_res) > 0 and any("TATA" in r["symbol"].upper() for r in search_res)
    search_isin = search_instruments("INE002A01018", limit=5)
    assert len(search_isin) > 0 and search_isin[0]["symbol"] == "RELIANCE.NS"

def test_quote_fetching():
    q_rel = get_quote("RELIANCE.NS")
    assert q_rel["price"] > 0 and q_rel["symbol"] == "RELIANCE.NS"
    q_nvda = get_quote("NVDA")
    assert q_nvda["price"] > 0 and q_nvda["currency"] == "USD"

def test_multi_timeframe_ohlc():
    ohlc_1y = get_historical_ohlcv("TCS.NS", timeframe="1Y")
    assert len(ohlc_1y["bars"]) > 0
    ohlc_1m = get_historical_ohlcv("AAPL", timeframe="1M")
    assert len(ohlc_1m["bars"]) > 0

def test_fundamentals_and_news():
    fund = get_fundamentals("INFY.NS")
    assert fund["symbol"] == "INFY.NS"
    news = get_news("HDFCBANK.NS")
    assert len(news) > 0 and "title" in news[0]

def test_market_breadth_and_sectors():
    breadth = get_market_breadth()
    assert "nse" in breadth and breadth["nse"]["advances"] > 0
    sectors = get_sector_performance()
    assert len(sectors) >= 5

if __name__ == '__main__':
    test_symbol_normalization()
    test_universal_search()
    test_quote_fetching()
    test_multi_timeframe_ohlc()
    test_fundamentals_and_news()
    test_market_breadth_and_sectors()
    print("All instrument engine tests passed!")
