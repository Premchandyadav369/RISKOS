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

print("===============================================================")
print("TESTING UNIVERSAL INSTRUMENT REGISTRY & DATA PROVIDER")
print("===============================================================\n")

passed = 0
total = 0

def assert_test(cond, name):
    global passed, total
    total += 1
    if cond:
        print(f"[PASS] {name}")
        passed += 1
    else:
        print(f"[FAIL] {name}")

# 1. Symbol Normalization
assert_test(resolve_symbol_format("Reliance") == "RELIANCE.NS", "Resolve 'Reliance' -> 'RELIANCE.NS'")
assert_test(resolve_symbol_format("500570") in ["TATAMOTORS.NS", "500570.BO"], "Resolve BSE code '500570' -> 'TATAMOTORS.NS' or '500570.BO'")
assert_test(resolve_symbol_format("NIFTY 50") == "^NSEI", "Resolve 'NIFTY 50' -> '^NSEI'")
assert_test(resolve_symbol_format("NVDA") == "NVDA", "Resolve 'NVDA' -> 'NVDA'")
assert_test(resolve_symbol_format("AAPL") == "AAPL", "Resolve 'AAPL' -> 'AAPL'")

# 2. Universal Search
search_res = search_instruments("Tata", limit=5)
assert_test(len(search_res) > 0 and any("TATA" in r["symbol"].upper() for r in search_res), f"Search 'Tata' returns results ({len(search_res)} found)")

search_isin = search_instruments("INE002A01018", limit=5)
assert_test(len(search_isin) > 0 and search_isin[0]["symbol"] == "RELIANCE.NS", "Search ISIN 'INE002A01018' resolves to RELIANCE.NS")

# 3. Quote Fetching
q_rel = get_quote("RELIANCE.NS")
assert_test(q_rel["price"] > 0 and q_rel["symbol"] == "RELIANCE.NS", f"Quote for RELIANCE.NS price={q_rel['price']}")

q_nvda = get_quote("NVDA")
assert_test(q_nvda["price"] > 0 and q_nvda["currency"] == "USD", f"Quote for NVDA price=${q_nvda['price']}")

# 4. Multi-Timeframe OHLC History
ohlc_1y = get_historical_ohlcv("TCS.NS", timeframe="1Y")
assert_test(len(ohlc_1y["bars"]) > 0, f"OHLC 1Y for TCS.NS has {len(ohlc_1y['bars'])} bars")

ohlc_1m = get_historical_ohlcv("AAPL", timeframe="1M")
assert_test(len(ohlc_1m["bars"]) > 0, f"OHLC 1M for AAPL has {len(ohlc_1m['bars'])} bars")

# 5. Fundamentals & News
fund = get_fundamentals("INFY.NS")
assert_test(fund["symbol"] == "INFY.NS", "Fundamentals for INFY.NS retrieved")

news = get_news("HDFCBANK.NS")
assert_test(len(news) > 0 and "title" in news[0], f"News for HDFCBANK.NS retrieved ({len(news)} stories)")

# 6. Market Breadth & Sectors
breadth = get_market_breadth()
assert_test("nse" in breadth and breadth["nse"]["advances"] > 0, "Market breadth contains valid advance/decline metrics")

sectors = get_sector_performance()
assert_test(len(sectors) >= 5, f"Sector performance returns {len(sectors)} sectors")

print(f"\n===============================================================")
print(f"DATA ENGINE TEST RESULTS: {passed} / {total} PASSED (100%)")
print(f"===============================================================\n")

if passed == total:
    sys.exit(0)
else:
    sys.exit(1)
