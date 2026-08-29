"""
RISKOS Google Finance Market Data Provider
Fast HTML scraper for near real-time quotes across NSE, BSE, NASDAQ, NYSE, and global indices.
"""

import re
import time
import logging
import requests
from typing import Dict, Optional, Any

logger = logging.getLogger("RISKOS.GoogleFinance")

class GoogleFinanceClient:
    def __init__(self, timeout: int = 4):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        })

    def _resolve_gf_ticker(self, symbol: str) -> tuple[str, str]:
        """Maps universal symbol to Google Finance (ticker, exchange) tuple."""
        sym = symbol.upper().replace("^", "").strip()
        
        # Specific overrides
        mapping = {
            "NSEI": ("NIFTY_50", "INDEXNSE"),
            "NIFTY": ("NIFTY_50", "INDEXNSE"),
            "NIFTY 50": ("NIFTY_50", "INDEXNSE"),
            "BSESN": ("SENSEX", "INDEXBOM"),
            "SENSEX": ("SENSEX", "INDEXBOM"),
            "NSEBANK": ("NIFTY_BANK", "INDEXNSE"),
            "BANKNIFTY": ("NIFTY_BANK", "INDEXNSE"),
            "CNXIT": ("NIFTY_IT", "INDEXNSE"),
            "GSPC": (".INX", "INDEXSP"),
            "SP500": (".INX", "INDEXSP"),
            "IXIC": (".IXIC", "INDEXNASDAQ"),
            "NASDAQ": (".IXIC", "INDEXNASDAQ"),
            "DJI": (".DJI", "INDEXDJX"),
            "USDINR": ("USD-INR", "CURRENCY"),
            "BRENT": ("BZ=F", "NYMEX")
        }
        if sym in mapping:
            return mapping[sym]

        if sym.endswith(".NS"):
            return (sym[:-3], "NSE")
        if sym.endswith(".BO"):
            return (sym[:-3], "BOM")
            
        # US Tech Giants
        if sym in ["AAPL", "NVDA", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "TSLA"]:
            return (sym, "NASDAQ")
        if sym in ["JPM", "V", "WMT", "DIS", "KO", "ORCL"]:
            return (sym, "NYSE")

        # Default for Indian equities
        return (sym, "NSE")

    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch quote from Google Finance.
        """
        ticker, exchange = self._resolve_gf_ticker(symbol)
        url = f"https://www.google.com/finance/quote/{ticker}:{exchange}"

        try:
            resp = self.session.get(url, timeout=self.timeout)
            if resp.status_code == 200:
                html = resp.text
                
                # Extract Price: class="YMlKec fxKbKc"
                price_match = re.search(r'class="YMlKec fxKbKc">([^<]+)<', html)
                if not price_match:
                    price_match = re.search(r'data-last-price="([^"]+)"', html)

                if price_match:
                    raw_price = price_match.group(1).replace("₹", "").replace("$", "").replace(",", "").strip()
                    price = float(raw_price)

                    # Extract Change & Percentage
                    # Often in class="JwB6be" or aria-label="Up by ... %" / "Down by ... %"
                    chg = 0.0
                    p_chg = 0.0
                    
                    # Pattern 1: aria-label="Up by 2.35%" or "Down by 1.20%"
                    aria_match = re.search(r'aria-label="(?:Up|Down) by ([0-9.]+)(?:%| percent)?', html)
                    is_down = "Down by" in html[max(0, (aria_match.start() if aria_match else 0) - 20):(aria_match.end() if aria_match else 0) + 20]

                    # Pattern 2: span containing +₹45.20 or -₹12.30 (+1.25%)
                    delta_match = re.search(r'class="[A-Za-z0-9_\-\s]*"\s*jsname="[A-Za-z0-9]+">\s*([+-]?[0-9,.]+)\s*<', html)
                    pct_match = re.search(r'\(([+-]?[0-9,.]+)%\)', html)

                    if pct_match:
                        p_chg = float(pct_match.group(1).replace("+", "").replace(",", "").strip())
                    elif aria_match:
                        p_chg = float(aria_match.group(1)) * (-1 if is_down else 1)

                    if delta_match:
                        try:
                            chg = float(delta_match.group(1).replace("+", "").replace(",", "").strip())
                        except:
                            chg = round(price * (p_chg / 100), 2)
                    else:
                        chg = round(price * (p_chg / 100), 2)

                    # Determine currency
                    currency = "USD" if exchange in ["NASDAQ", "NYSE", "INDEXSP", "INDEXNASDAQ", "INDEXDJX"] else "INR"
                    usd_to_inr = 83.50
                    price_inr = round(price * usd_to_inr, 2) if currency == "USD" else price

                    return {
                        "symbol": symbol.upper(),
                        "name": ticker,
                        "exchange": exchange,
                        "asset_type": "INDEX" if "INDEX" in exchange else "EQUITY",
                        "currency": currency,
                        "price": price,
                        "price_inr": price_inr,
                        "change": round(chg, 2),
                        "change_percent": round(p_chg, 2),
                        "previous_close": round(price - chg, 2),
                        "provider": "Google Finance",
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
                    }
        except Exception as e:
            logger.debug(f"Google Finance quote fetch failed for {symbol}: {e}")

        return None
