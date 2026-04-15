import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

US_TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM", "GS", "BAC", "SPY", "QQQ"]
INDIA_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "SBIN.NS", "ITC.NS", "LT.NS", "BHARTIARTL.NS", "ADANIENT.NS", "^NSEI", "^BSESN"
]
FX_TICKERS = ["USDINR=X"]

DEFAULT_WEIGHTS = {
    # US Equities (50%)
    "NVDA": 0.12, "AAPL": 0.10, "MSFT": 0.08, "JPM": 0.08, "GS": 0.04, "SPY": 0.08,
    # Indian Equities (50%)
    "RELIANCE.NS": 0.10, "TCS.NS": 0.10, "INFY.NS": 0.08, "HDFCBANK.NS": 0.12, "ICICIBANK.NS": 0.10
}

_DATA_CACHE: Dict[str, pd.DataFrame] = {}

def fetch_historical_data(
    tickers: Optional[List[str]] = None,
    period: str = "1y",
    interval: str = "1d"
) -> Dict[str, pd.DataFrame]:
    """
    Fetches historical OHLCV data for US and Indian tickers via yfinance with fallback.
    """
    if tickers is None:
        tickers = list(DEFAULT_WEIGHTS.keys()) + ["^NSEI", "SPY", "USDINR=X"]
        
    cache_key = f"{'_'.join(sorted(tickers))}_{period}_{interval}"
    if cache_key in _DATA_CACHE:
        return _DATA_CACHE[cache_key]
        
    result = {}
    try:
        data = yf.download(tickers, period=period, interval=interval, group_by="ticker", progress=False)
        for ticker in tickers:
            if len(tickers) == 1:
                df = data.copy()
            else:
                try:
                    df = data[ticker].copy()
                except KeyError:
                    df = pd.DataFrame()
                    
            if not df.empty and "Close" in df.columns:
                df = df.dropna(subset=["Close"])
                result[ticker] = df
            else:
                result[ticker] = _generate_synthetic_series(ticker, period)
    except Exception as e:
        print(f"Warning: yfinance fetch failed ({e}). Using robust market simulator fallback.")
        for ticker in tickers:
            result[ticker] = _generate_synthetic_series(ticker, period)
            
    _DATA_CACHE[cache_key] = result
    return result

def _generate_synthetic_series(ticker: str, period: str) -> pd.DataFrame:
    """Generate realistic financial time series fallback if API is throttled."""
    days = 252 if period in ["1y", "ytd"] else 500
    dates = pd.date_range(end=datetime.today(), periods=days, freq="B")
    
    # Base prices and annual volatilities
    params = {
        "NVDA": (120.0, 0.42), "AAPL": (220.0, 0.22), "MSFT": (440.0, 0.24),
        "JPM": (210.0, 0.18), "GS": (480.0, 0.21), "SPY": (550.0, 0.14),
        "RELIANCE.NS": (3000.0, 0.20), "TCS.NS": (4200.0, 0.17), "INFY.NS": (1800.0, 0.22),
        "HDFCBANK.NS": (1650.0, 0.19), "ICICIBANK.NS": (1200.0, 0.21),
        "^NSEI": (24500.0, 0.13), "USDINR=X": (83.8, 0.05)
    }
    
    s0, vol = params.get(ticker, (100.0, 0.20))
    dt = 1 / 252.0
    mu = 0.08  # 8% expected annual return
    
    np.random.seed(hash(ticker) % 2**32)
    returns = np.random.normal((mu - 0.5 * vol**2) * dt, vol * np.sqrt(dt), size=days)
    price_paths = s0 * np.exp(np.cumsum(returns))
    
    high = price_paths * (1 + np.abs(np.random.normal(0, 0.008, days)))
    low = price_paths * (1 - np.abs(np.random.normal(0, 0.008, days)))
    open_p = low + (high - low) * np.random.uniform(0.2, 0.8, days)
    volume = np.random.randint(1000000, 50000000, size=days)
    
    df = pd.DataFrame({
        "Open": open_p,
        "High": high,
        "Low": low,
        "Close": price_paths,
        "Adj Close": price_paths,
        "Volume": volume
    }, index=dates)
    return df

def get_portfolio_prices(weights: Optional[Dict[str, float]] = None) -> pd.DataFrame:
    """Returns a unified pandas DataFrame of close prices for portfolio assets."""
    if weights is None:
        weights = DEFAULT_WEIGHTS
    tickers = list(weights.keys())
    data_dict = fetch_historical_data(tickers)
    
    close_series = {}
    for ticker, df in data_dict.items():
        if "Adj Close" in df.columns:
            close_series[ticker] = df["Adj Close"]
        elif "Close" in df.columns:
            close_series[ticker] = df["Close"]
            
    df_prices = pd.DataFrame(close_series).ffill().bfill()
    return df_prices
