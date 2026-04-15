import requests
import random
from typing import Dict, Any, List

NEWS_API_KEY = "8083462b641b4fc1ae785c4a89c57d06"

def fetch_live_macro_news() -> Dict[str, Any]:
    """
    Fetches live real-time business and financial news via NewsAPI.
    Applies synthetic institutional impact tags based on keyword analysis.
    """
    url = f"https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey={NEWS_API_KEY}"
    
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get("status") != "ok":
            raise ValueError(f"NewsAPI Error: {data.get('message', 'Unknown Error')}")
            
        articles = data.get("articles", [])[:6] # Grab top 6 live headlines
        
        processed_news = []
        for i, article in enumerate(articles):
            title = article.get("title", "")
            source = article.get("source", {}).get("name", "Unknown Source")
            
            # Simple keyword-based risk impact & tagging
            title_upper = title.upper()
            impact = "LOW"
            affected = "GENERAL MACRO"
            
            if any(k in title_upper for k in ["FED", "RATE", "INFLATION", "TREASURY", "POWELL", "YIELD"]):
                impact = "HIGH"
                affected = "US RATES / FIXED INCOME"
            elif any(k in title_upper for k in ["TECH", "NVIDIA", "APPLE", "AI", "SEMICONDUCTOR", "MICROSOFT"]):
                impact = "HIGH"
                affected = "US TECH EQUITIES (NVDA/AAPL)"
            elif any(k in title_upper for k in ["RBI", "INDIA", "MODI", "SENSEX", "NIFTY", "RUPEE"]):
                impact = "MEDIUM"
                affected = "INDIAN EQUITIES / USDINR"
            elif any(k in title_upper for k in ["BANK", "JPM", "GOLDMAN", "CREDIT", "DEFAULT", "LOAN"]):
                impact = "HIGH"
                affected = "US BANKING SECTOR (JPM/GS)"
            elif any(k in title_upper for k in ["OIL", "ENERGY", "OPEC", "COMMODITY"]):
                impact = "MEDIUM"
                affected = "COMMODITIES"
            elif "ERROR" in title_upper or "CRISIS" in title_upper or "PLUNGE" in title_upper or "CRASH" in title_upper:
                impact = "CRITICAL"
                affected = "SYSTEMIC RISK"
                
            processed_news.append({
                "id": f"LIVE-N-{i+1}",
                "time": "LIVE WIRE",
                "source": source,
                "headline": title,
                "impact": impact,
                "affected": affected
            })
            
        if not processed_news:
            raise ValueError("No articles found")
            
        return {"news": processed_news, "status": "LIVE_API"}
        
    except Exception as e:
        # Fallback to institutional mock data if API fails (e.g. rate limit, offline)
        print(f"NewsAPI failed, using synthetic fallback: {str(e)}")
        fallback = [
            {"id": "FB-01", "time": "LIVE WIRE", "source": "Bloomberg", "headline": "US Treasury Yield Curve Steepens Following Federal Reserve Policy Signals", "impact": "HIGH", "affected": "US Rates / JPM"},
            {"id": "FB-02", "time": "LIVE WIRE", "source": "Reuters", "headline": "RBI Keeps Repo Rate Unchanged at 6.50%; Highlights Liquidity Management", "impact": "MEDIUM", "affected": "HDFCBANK / Bank NIFTY"},
            {"id": "FB-03", "time": "LIVE WIRE", "source": "Financial Times", "headline": "Semiconductor Tech Demand Drives Cross-Border IT Outsource Contracts", "impact": "HIGH", "affected": "NVDA / TCS / INFY"},
            {"id": "FB-04", "time": "LIVE WIRE", "source": "WSJ", "headline": "USD/INR FX Volatility Compresses Near ₹83.80 Resistance Level", "impact": "LOW", "affected": "USDINR"}
        ]
        return {"news": fallback, "status": "SYNTHETIC_FALLBACK"}
