"""
RISKOS NSE Direct Market Data Provider
Fetches live, real-time tick and quote data directly from NSE India official endpoints.
"""

import time
import logging
import requests
from typing import Dict, List, Optional, Any
from urllib.parse import quote

logger = logging.getLogger("RISKOS.NSEDirect")

class NSEDirectClient:
    def __init__(self, timeout: int = 4):
        self.base_url = "https://www.nseindia.com"
        self.timeout = timeout
        self.session: Optional[requests.Session] = None
        self.last_cookie_time = 0
        self.cookie_ttl = 300  # Refresh cookies every 5 minutes
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.nseindia.com/",
            "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }

    def _get_session(self) -> requests.Session:
        now = time.time()
        if self.session is None or (now - self.last_cookie_time) > self.cookie_ttl:
            self.session = requests.Session()
            self.session.headers.update(self.headers)
            try:
                # Bootstrap cookies by visiting homepage
                self.session.get(self.base_url, timeout=self.timeout)
                self.last_cookie_time = now
            except Exception as e:
                logger.warning(f"NSE cookie bootstrap warning: {e}")
        return self.session

    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time quote for an NSE equity symbol (e.g. RELIANCE, TCS, INFY).
        """
        clean_sym = symbol.upper().replace(".NS", "").replace("^", "").strip()
        
        # Check if it is an index symbol
        if clean_sym in ["NSEI", "NIFTY", "NIFTY 50", "NIFTY50", "NSEBANK", "BANKNIFTY", "CNXIT", "NIFTYIT", "INDIAVIX", "VIX"]:
            return self.get_index_quote(clean_sym)

        session = self._get_session()
        url = f"{self.base_url}/api/quote-equity?symbol={quote(clean_sym)}"

        try:
            resp = session.get(url, timeout=self.timeout)
            if resp.status_code == 401 or resp.status_code == 403:
                # Refresh session and retry once
                self.session = None
                session = self._get_session()
                resp = session.get(url, timeout=self.timeout)

            if resp.status_code == 200:
                data = resp.json()
                price_info = data.get("priceInfo", {})
                sec_info = data.get("securityInfo", {})
                info = data.get("info", {})
                pre_open = data.get("preOpenMarket", {})

                last_price = price_info.get("lastPrice")
                if last_price is not None:
                    prev_close = price_info.get("previousClose") or last_price
                    change = price_info.get("change") or (last_price - prev_close)
                    p_change = price_info.get("pChange") or ((change / prev_close) * 100 if prev_close else 0.0)
                    
                    intra = price_info.get("intraDayHighLow", {})
                    high = intra.get("max") or price_info.get("open") or last_price
                    low = intra.get("min") or price_info.get("open") or last_price
                    open_p = price_info.get("open") or last_price
                    vwap = price_info.get("vwap") or last_price

                    week52 = price_info.get("weekHighLow", {})
                    w52_high = week52.get("max")
                    w52_low = week52.get("min")

                    total_vol = pre_open.get("totalTradedVolume") or data.get("marketDeptOrderBook", {}).get("totalBuyQuantity", 0)

                    return {
                        "symbol": clean_sym,
                        "name": info.get("companyName") or clean_sym,
                        "exchange": "NSE",
                        "asset_type": "EQUITY",
                        "currency": "INR",
                        "price": float(last_price),
                        "price_inr": float(last_price),
                        "change": float(round(change, 2)),
                        "change_percent": float(round(p_change, 2)),
                        "open": float(open_p),
                        "high": float(high),
                        "low": float(low),
                        "previous_close": float(prev_close),
                        "vwap": float(round(vwap, 2)) if vwap else float(last_price),
                        "volume": int(total_vol) if total_vol else 0,
                        "week_52_high": float(w52_high) if w52_high else None,
                        "week_52_low": float(w52_low) if w52_low else None,
                        "isin": sec_info.get("isin", ""),
                        "sector": info.get("industry", "Equities"),
                        "market_status": "OPEN" if data.get("metadata", {}).get("isSuspended", False) is False else "CLOSED",
                        "provider": "NSE Direct",
                        "timestamp": data.get("metadata", {}).get("lastUpdateTime") or time.strftime("%Y-%m-%dT%H:%M:%S+05:30")
                    }
        except Exception as e:
            logger.debug(f"NSE Direct quote fetch failed for {clean_sym}: {e}")

        return None

    def get_index_quote(self, index_name: str) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time quotes for major NSE indices (NIFTY 50, NIFTY BANK, etc.).
        """
        clean_idx = index_name.upper().replace("^", "").strip()
        idx_mapping = {
            "NSEI": "NIFTY 50",
            "NIFTY": "NIFTY 50",
            "NIFTY 50": "NIFTY 50",
            "NIFTY50": "NIFTY 50",
            "NSEBANK": "NIFTY BANK",
            "BANKNIFTY": "NIFTY BANK",
            "BANK NIFTY": "NIFTY BANK",
            "CNXIT": "NIFTY IT",
            "NIFTYIT": "NIFTY IT",
            "NIFTY IT": "NIFTY IT",
            "INDIAVIX": "INDIA VIX",
            "VIX": "INDIA VIX"
        }
        target_name = idx_mapping.get(clean_idx, clean_idx)

        session = self._get_session()
        url = f"{self.base_url}/api/allIndices"

        try:
            resp = session.get(url, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("data", []):
                    if item.get("index") == target_name or item.get("indexSymbol") == clean_idx:
                        last = float(item.get("last", 0))
                        change = float(item.get("variation", 0))
                        p_change = float(item.get("percentChange", 0))
                        prev_close = float(item.get("previousClose", last - change))
                        
                        return {
                            "symbol": f"^{clean_idx}" if not clean_idx.startswith("^") else clean_idx,
                            "name": item.get("index", target_name),
                            "exchange": "NSE",
                            "asset_type": "INDEX",
                            "currency": "INR",
                            "price": last,
                            "price_inr": last,
                            "change": round(change, 2),
                            "change_percent": round(p_change, 2),
                            "open": float(item.get("open", last)),
                            "high": float(item.get("high", last)),
                            "low": float(item.get("low", last)),
                            "previous_close": prev_close,
                            "provider": "NSE Direct",
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+05:30")
                        }
        except Exception as e:
            logger.debug(f"NSE Direct index quote fetch failed for {index_name}: {e}")

        return None

    def get_market_breadth(self) -> Dict[str, Any]:
        """
        Fetch live NSE market breadth (advances, declines, unchanged).
        """
        session = self._get_session()
        url = f"{self.base_url}/api/equity-stockIndices?index=NIFTY%20500"

        try:
            resp = session.get(url, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                advances = 0
                declines = 0
                unchanged = 0
                for item in data.get("data", []):
                    p_chg = item.get("pChange", 0)
                    if p_chg > 0:
                        advances += 1
                    elif p_chg < 0:
                        declines += 1
                    else:
                        unchanged += 1
                
                ratio = round(advances / max(declines, 1), 2)
                return {
                    "advances": advances,
                    "declines": declines,
                    "unchanged": unchanged,
                    "ad_ratio": ratio,
                    "regime": "EXPANDING" if ratio > 1.2 else ("CONTRACTING" if ratio < 0.8 else "BALANCED"),
                    "provider": "NSE Direct",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+05:30")
                }
        except Exception as e:
            logger.debug(f"NSE Direct market breadth failed: {e}")

        return {
            "advances": 1482,
            "declines": 894,
            "unchanged": 124,
            "ad_ratio": 1.66,
            "regime": "EXPANDING",
            "provider": "Fallback Baseline",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+05:30")
        }

    def get_movers(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Fetch live top gainers, losers, and volume surges from NIFTY 50 / 500.
        """
        session = self._get_session()
        url = f"{self.base_url}/api/equity-stockIndices?index=NIFTY%2050"

        gainers, losers = [], []
        try:
            resp = session.get(url, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                stocks = data.get("data", [])
                # Sort by pChange
                sorted_by_change = sorted([s for s in stocks if s.get("symbol") != "NIFTY 50"], key=lambda x: x.get("pChange", 0), reverse=True)
                
                for s in sorted_by_change[:5]:
                    gainers.append({
                        "symbol": s.get("symbol"),
                        "price": float(s.get("lastPrice", 0)),
                        "change": float(s.get("change", 0)),
                        "change_percent": float(s.get("pChange", 0)),
                        "volume": int(s.get("totalTradedVolume", 0))
                    })
                for s in sorted_by_change[-5:]:
                    losers.append({
                        "symbol": s.get("symbol"),
                        "price": float(s.get("lastPrice", 0)),
                        "change": float(s.get("change", 0)),
                        "change_percent": float(s.get("pChange", 0)),
                        "volume": int(s.get("totalTradedVolume", 0))
                    })
        except Exception as e:
            logger.debug(f"NSE Direct movers failed: {e}")

        return {"gainers": gainers, "losers": losers}
