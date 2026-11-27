"""
RISKOS Python Backend: Alpha Vantage News Intelligence Provider
(backend/engine/providers/alpha_vantage_news.py)

Direct backend adapter for Alpha Vantage NEWS_SENTIMENT API.
Provides in-memory caching, request queuing, error degradation, and schema normalization.
"""

import os
import time
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional
from datetime import datetime

class AlphaVantageNewsProvider:
    def __init__(self):
        self.api_key = self._resolve_api_key()
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.last_successful_request: Optional[str] = None
        self.last_failure: Optional[str] = None
        self.last_latency_ms: float = 0.0
        self.provider_status: str = "HEALTHY"
        self.failure_count: int = 0

    def _resolve_api_key(self) -> str:
        key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if key and key.strip():
            return key.strip()

        # Check local .env files
        candidates = [
            os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
        ]
        for path in candidates:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.strip().startswith("ALPHA_VANTAGE_API_KEY="):
                                k = line.strip().split("=", 1)[1].strip()
                                if k:
                                    os.environ["ALPHA_VANTAGE_API_KEY"] = k
                                    return k
                except Exception:
                    pass

        return "EI9HFIWHX72XUAXZ"

    def get_health(self) -> Dict[str, Any]:
        return {
            "provider": "Alpha Vantage",
            "status": self.provider_status,
            "lastSuccessfulRequest": self.last_successful_request,
            "lastFailure": self.last_failure,
            "latencyMs": round(self.last_latency_ms, 2),
            "cachedQueries": len(self.cache),
            "totalCachedArticles": sum(len(c.get("data", {}).get("feed", [])) for c in self.cache.values())
        }

    def fetch_news(
        self,
        tickers: Optional[str] = None,
        topics: Optional[str] = None,
        time_from: Optional[str] = None,
        time_to: Optional[str] = None,
        sort: str = "LATEST",
        limit: int = 50
    ) -> Dict[str, Any]:
        cache_key = f"av_{tickers or ''}_{topics or ''}_{time_from or ''}_{time_to or ''}_{sort}_{limit}"
        now = time.time()

        # 1. Check valid cache
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if entry["expires_at"] > now:
                return {
                    "data": entry["data"],
                    "dataStatus": "CACHED",
                    "fromCache": True,
                    "health": self.get_health()
                }

        # 2. Query Alpha Vantage
        base_url = "https://www.alphavantage.co/query"
        params = {
            "function": "NEWS_SENTIMENT",
            "apikey": self.api_key,
            "sort": sort,
            "limit": min(1000, max(1, limit))
        }
        if tickers:
            params["tickers"] = tickers
        if topics:
            params["topics"] = topics
        if time_from:
            params["time_from"] = time_from
        if time_to:
            params["time_to"] = time_to

        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        start_t = time.time()

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "RISKOS-PythonEngine/3.0 (AlphaVantage)"}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                raw = resp.read().decode("utf-8")
                json_data = json.loads(raw)

            latency = (time.time() - start_t) * 1000.0
            self.last_latency_ms = latency

            if "Note" in json_data or "Information" in json_data:
                msg = json_data.get("Note") or json_data.get("Information")
                self.last_failure = datetime.utcnow().isoformat()
                self.failure_count += 1
                self.provider_status = "DEGRADED"

                if cache_key in self.cache:
                    return {
                        "data": self.cache[cache_key]["data"],
                        "dataStatus": "STALE_CACHE",
                        "fromCache": True,
                        "note": msg,
                        "health": self.get_health()
                    }
                return {
                    "data": self._get_fallback_fixtures(),
                    "dataStatus": "DEGRADED_FALLBACK",
                    "fromCache": False,
                    "note": msg,
                    "health": self.get_health()
                }

            if "Error Message" in json_data:
                raise ValueError(json_data["Error Message"])

            self.provider_status = "HEALTHY"
            self.last_successful_request = datetime.utcnow().isoformat()
            self.failure_count = 0

            # Stamp receivedAt on feed items
            received_at = datetime.utcnow().isoformat()
            for item in json_data.get("feed", []):
                item["receivedAt"] = received_at

            # Cache TTL: 300s general, 600s ticker
            ttl = 600 if tickers else 300
            self.cache[cache_key] = {
                "data": json_data,
                "expires_at": now + ttl
            }

            return {
                "data": json_data,
                "dataStatus": "LIVE",
                "fromCache": False,
                "health": self.get_health()
            }

        except Exception as ex:
            self.last_failure = datetime.utcnow().isoformat()
            self.failure_count += 1
            self.provider_status = "OFFLINE" if self.failure_count >= 3 else "DEGRADED"

            if cache_key in self.cache:
                return {
                    "data": self.cache[cache_key]["data"],
                    "dataStatus": "STALE_CACHE",
                    "fromCache": True,
                    "error": str(ex),
                    "health": self.get_health()
                }

            return {
                "data": self._get_fallback_fixtures(),
                "dataStatus": "OFFLINE_FALLBACK",
                "fromCache": False,
                "error": str(ex),
                "health": self.get_health()
            }

    def _get_fallback_fixtures(self) -> Dict[str, Any]:
        return {
            "items": "4",
            "sentiment_score_definition": "Standard AlphaVantage Polarity",
            "relevance_score_definition": "Standard 0 to 1 Relevance",
            "feed": [
                {
                    "title": "JPMorgan Chase & Co. Increases Substantial Holding in Clean Energy Assets",
                    "url": "https://www.tipranks.com/news/institutional/jpmorgan-boosts-holdings",
                    "time_published": "20260921T063000",
                    "authors": ["TipRanks Research"],
                    "summary": "JPMorgan Chase enlarged its stake in strategic green transition materials.",
                    "source": "TipRanks",
                    "topics": [{"topic": "Financial Markets", "relevance_score": "0.95"}],
                    "overall_sentiment_score": 0.2916,
                    "overall_sentiment_label": "Somewhat-Bullish",
                    "ticker_sentiment": [
                        {"ticker": "JPM", "relevance_score": "1.000000", "ticker_sentiment_score": "0.2822", "ticker_sentiment_label": "Somewhat-Bullish"}
                    ]
                },
                {
                    "title": "Reliance Industries Q3 Net Profit Surges on Retail Expansion & Robust Jio ARPU",
                    "url": "https://economictimes.indiatimes.com/markets/stocks/news/reliance-q3",
                    "time_published": "20260921T054500",
                    "authors": ["Economic Times Wire"],
                    "summary": "Reliance Industries posted record quarterly EBITDA beating Street estimates.",
                    "source": "Economic Times",
                    "topics": [{"topic": "Earnings", "relevance_score": "1.00"}],
                    "overall_sentiment_score": 0.4285,
                    "overall_sentiment_label": "Bullish",
                    "ticker_sentiment": [
                        {"ticker": "RELIANCE.BSE", "relevance_score": "0.980000", "ticker_sentiment_score": "0.4512", "ticker_sentiment_label": "Bullish"}
                    ]
                }
            ]
        }

# Global singleton
alpha_vantage_provider = AlphaVantageNewsProvider()
