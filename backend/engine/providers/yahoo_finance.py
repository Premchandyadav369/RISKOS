"""
RISKOS Yahoo Finance Provider
Low-latency quotes via fast_info + Multi-timeframe OHLCV historical candle engine.
"""

import time
import logging
import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger("RISKOS.YahooFinance")

USD_TO_INR = 83.50

class YahooFinanceClient:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=8)

    def _normalize_symbol(self, symbol: str) -> str:
        sym = symbol.upper().strip()
        if sym in ["NIFTY", "NIFTY 50", "NIFTY50", "NSEI"]:
            return "^NSEI"
        if sym in ["SENSEX", "BSESN"]:
            return "^BSESN"
        if sym in ["BANKNIFTY", "BANK NIFTY", "NSEBANK"]:
            return "^NSEBANK"
        if sym in ["NIFTYIT", "CNXIT"]:
            return "^CNXIT"
        if sym in ["SP500", "SPY", "GSPC"]:
            return "^GSPC"
        if sym in ["NASDAQ", "IXIC"]:
            return "^IXIC"
        if sym in ["DOW", "DJI"]:
            return "^DJI"
        
        # Indian equities without suffix -> add .NS
        if not sym.endswith(".NS") and not sym.endswith(".BO") and not sym.startswith("^"):
            if sym in ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "TATAMOTORS", "LT", "HINDUNILVR", "AXISBANK", "MARUTI", "SUNPHARMA", "BAJFINANCE", "TITAN", "ASIANPAINT", "KOTAKBANK", "ZOMATO", "PAYTM", "ADANIENT", "WIPRO", "HCLTECH", "NIFTYBEES", "GOLDBEES", "SILVERBEES", "ITBEES"]:
                return f"{sym}.NS"
        return sym

    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time snapshot via fast_info.
        """
        clean_sym = self._normalize_symbol(symbol)
        try:
            t = yf.Ticker(clean_sym)
            fast = t.fast_info
            
            price = fast.last_price
            if price is None:
                # Fallback to history 1d
                hist = t.history(period="1d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                else:
                    return None

            prev_close = fast.previous_close or price
            change = price - prev_close
            p_change = (change / prev_close) * 100 if prev_close else 0.0

            currency = fast.currency or ("INR" if clean_sym.endswith(".NS") or clean_sym.endswith(".BO") or "^NSE" in clean_sym or "^BSE" in clean_sym else "USD")
            price_inr = round(price * USD_TO_INR, 2) if currency == "USD" else round(price, 2)

            return {
                "symbol": symbol.upper().replace(".NS", "").replace("^", ""),
                "name": clean_sym,
                "exchange": "NSE" if ".NS" in clean_sym or "^NSE" in clean_sym else ("BSE" if ".BO" in clean_sym or "^BSE" in clean_sym else "US"),
                "asset_type": "INDEX" if clean_sym.startswith("^") else "EQUITY",
                "currency": currency,
                "price": round(float(price), 2),
                "price_inr": price_inr,
                "change": round(float(change), 2),
                "change_percent": round(float(p_change), 2),
                "open": round(float(fast.open or price), 2),
                "high": round(float(fast.day_high or price), 2),
                "low": round(float(fast.day_low or price), 2),
                "previous_close": round(float(prev_close), 2),
                "volume": int(fast.last_volume or 0),
                "week_52_high": round(float(fast.year_high), 2) if fast.year_high else None,
                "week_52_low": round(float(fast.year_low), 2) if fast.year_low else None,
                "market_cap": fast.market_cap,
                "provider": "Yahoo Finance",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
            }
        except Exception as e:
            logger.debug(f"Yahoo Finance quote fetch failed for {clean_sym}: {e}")

        return None

    def get_history(self, symbol: str, timeframe: str = "1D", period: str = "1Y") -> Dict[str, Any]:
        """
        Fetch historical OHLCV candle bars.
        """
        clean_sym = self._normalize_symbol(symbol)
        tf_map = {
            "1D": "1d",
            "1W": "1wk",
            "1M": "1mo",
            "5M": "5m",
            "15M": "15m",
            "1H": "1h"
        }
        interval = tf_map.get(timeframe.upper(), "1d")
        
        period_map = {
            "1D": "1d",
            "5D": "5d",
            "1M": "1mo",
            "3M": "3mo",
            "6M": "6mo",
            "1Y": "1y",
            "2Y": "2y",
            "5Y": "5y",
            "MAX": "max"
        }
        p = period_map.get(period.upper(), "1y")

        try:
            t = yf.Ticker(clean_sym)
            df = t.history(period=p, interval=interval)
            
            if df.empty:
                return {"bars": [], "provider": "Yahoo Finance", "symbol": symbol}

            bars = []
            for idx, row in df.iterrows():
                dt_str = idx.strftime("%Y-%m-%d %H:%M:%S") if hasattr(idx, "strftime") else str(idx)
                bars.append({
                    "time": dt_str.split(" ")[0] if interval in ["1d", "1wk", "1mo"] else dt_str,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]) if "Volume" in row and not pd.isna(row["Volume"]) else 0
                })

            return {
                "symbol": symbol.upper(),
                "timeframe": timeframe,
                "period": period,
                "bars": bars,
                "provider": "Yahoo Finance",
                "count": len(bars)
            }
        except Exception as e:
            logger.warning(f"Yahoo Finance history failed for {clean_sym}: {e}")
            return {"bars": [], "provider": "Yahoo Finance", "symbol": symbol, "error": str(e)}
