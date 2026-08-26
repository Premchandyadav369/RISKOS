import yfinance as yf
import pandas as pd
import numpy as np

def get_prices(tickers: list[str], period: str = '1y') -> dict:
    result = {}
    for ticker in tickers:
        try:
            data = yf.Ticker(ticker).history(period=period)
            if data.empty:
                continue
            # Ensure dates are strings for JSON serialization
            dates = data.index.strftime('%Y-%m-%d').tolist()
            result[ticker] = {
                'dates': dates,
                'open': data['Open'].tolist(),
                'high': data['High'].tolist(),
                'low': data['Low'].tolist(),
                'close': data['Close'].tolist(),
                'volume': data['Volume'].tolist()
            }
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
    return result

def get_returns(tickers: list[str], period: str = '1y') -> pd.DataFrame:
    df = pd.DataFrame()
    for ticker in tickers:
        try:
            data = yf.Ticker(ticker).history(period=period)
            if not data.empty:
                df[ticker] = np.log(data['Close'] / data['Close'].shift(1))
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
    return df.dropna()
