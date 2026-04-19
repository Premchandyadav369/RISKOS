"""
Automated Unit Tests for RISKOS Real-Time Market Data Engine
Tests NSE Direct, Google Finance, Yahoo Finance, and MarketAggregator.
"""

import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from engine.providers.nse_direct import NSEDirectClient
from engine.providers.google_finance import GoogleFinanceClient
from engine.providers.yahoo_finance import YahooFinanceClient
from engine.market_aggregator import MarketAggregator, market_aggregator

class TestRealtimeProviders(unittest.TestCase):
    def setUp(self):
        self.aggregator = MarketAggregator()

    def test_google_finance_quote(self):
        gf = GoogleFinanceClient(timeout=6)
        # Test US ticker
        q_us = gf.get_quote("AAPL")
        if q_us:
            self.assertEqual(q_us["symbol"], "AAPL")
            self.assertGreater(q_us["price"], 0)
            self.assertEqual(q_us["provider"], "Google Finance")
            print(f"  [PASS] Google Finance AAPL: ${q_us['price']} ({q_us['change_percent']}%)")

    def test_yahoo_finance_fast_info(self):
        yf_client = YahooFinanceClient()
        q_rel = yf_client.get_quote("RELIANCE")
        self.assertIsNotNone(q_rel)
        self.assertIn("RELIANCE", q_rel["symbol"])
        self.assertGreater(q_rel["price"], 0)
        self.assertEqual(q_rel["currency"], "INR")
        print(f"  [PASS] Yahoo Finance RELIANCE: INR {q_rel['price']} ({q_rel['change_percent']}%)")

        q_aapl = yf_client.get_quote("AAPL")
        self.assertIsNotNone(q_aapl)
        self.assertEqual(q_aapl["symbol"], "AAPL")
        self.assertGreater(q_aapl["price"], 0)
        self.assertEqual(q_aapl["currency"], "USD")
        print(f"  [PASS] Yahoo Finance AAPL: USD {q_aapl['price']} ({q_aapl['change_percent']}%)")

    def test_yahoo_finance_candles(self):
        yf_client = YahooFinanceClient()
        hist = yf_client.get_history("RELIANCE", timeframe="1D", period="1M")
        self.assertIn("bars", hist)
        self.assertGreater(len(hist["bars"]), 0)
        first_bar = hist["bars"][0]
        self.assertIn("open", first_bar)
        self.assertIn("close", first_bar)
        self.assertIn("high", first_bar)
        self.assertIn("low", first_bar)
        self.assertIn("volume", first_bar)
        print(f"  [PASS] Yahoo Finance RELIANCE History: {len(hist['bars'])} bars loaded")

    def test_market_aggregator_quote_failover(self):
        q = self.aggregator.get_quote("RELIANCE")
        self.assertIsNotNone(q)
        self.assertGreater(q["price"], 0)
        self.assertIn(q["provider"], ["NSE Direct", "Google Finance", "Yahoo Finance", "Baseline Registry"])
        print(f"  [PASS] Aggregator RELIANCE Quote: INR {q['price']} [Provider: {q['provider']}]")

        q_us = self.aggregator.get_quote("NVDA")
        self.assertIsNotNone(q_us)
        self.assertGreater(q_us["price"], 0)
        print(f"  [PASS] Aggregator NVDA Quote: USD {q_us['price']} [Provider: {q_us['provider']}]")

    def test_market_aggregator_batch_quotes(self):
        symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"]
        results = self.aggregator.get_quotes(symbols)
        self.assertEqual(len(results), len(symbols))
        for sym in symbols:
            self.assertIn(sym, results)
            self.assertGreater(results[sym]["price"], 0)
        print(f"  [PASS] Aggregator Batch Quotes: {len(results)}/{len(symbols)} quotes resolved concurrently")

    def test_market_aggregator_breadth(self):
        breadth = self.aggregator.get_market_breadth()
        self.assertIn("advances", breadth)
        self.assertIn("declines", breadth)
        self.assertIn("ad_ratio", breadth)
        self.assertIn("regime", breadth)
        print(f"  [PASS] Aggregator Market Breadth: Adv={breadth['advances']}, Dec={breadth['declines']}, A/D={breadth['ad_ratio']}x [{breadth['regime']}]")

    def test_market_aggregator_multi_ticker_diversity(self):
        diverse_symbols = ["SUZLON", "ZOMATO", "IRFC", "TSLA", "META", "AMD"]
        results = self.aggregator.get_quotes(diverse_symbols)
        for sym in diverse_symbols:
            self.assertIn(sym, results)
            self.assertGreater(results[sym]["price"], 0)
            print(f"  [PASS] Multi-Ticker Resolution {sym}: {results[sym]['currency']} {results[sym]['price']} [Provider: {results[sym]['provider']}]")

    def test_market_aggregator_candles(self):
        candles = self.aggregator.get_candles("TCS", timeframe="1D", period="1Y")
        self.assertIn("bars", candles)
        self.assertGreater(len(candles["bars"]), 0)
        print(f"  [PASS] Aggregator TCS 1Y Candles: {len(candles['bars'])} bars loaded")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("RUNNING RISKOS REAL-TIME MARKET DATA ENGINE UNIT TESTS")
    print("="*60 + "\n")
    unittest.main()
