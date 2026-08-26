import pandas as pd
import numpy as np
from .market import get_returns

def correlation_matrix(tickers: list[str], period: str = '1y') -> dict:
    returns = get_returns(tickers, period)
    if returns.empty:
        return {"error": "No data"}
        
    full_corr = returns.corr()
    
    # 60d rolling corr
    rolling_corr = returns.rolling(window=60).corr().dropna()
    if not rolling_corr.empty:
        latest_60d = rolling_corr.loc[rolling_corr.index.get_level_values(0)[-1]]
    else:
        latest_60d = full_corr # fallback
        
    # Check for significant breaks
    significant_breaks = []
    n = len(tickers)
    
    # Historical mean correlation over 252 days (approx 1 year)
    hist_rolling = returns.rolling(window=252).corr().dropna()
    
    if not hist_rolling.empty:
        for i in range(n):
            for j in range(i+1, n):
                t1, t2 = tickers[i], tickers[j]
                
                # Get historical series of correlations for this pair
                idx = pd.IndexSlice
                pair_hist = hist_rolling.loc[idx[:, t1], t2]
                
                if not pair_hist.empty and len(pair_hist) > 10:
                    hist_mean = pair_hist.mean()
                    hist_std = pair_hist.std()
                    
                    current_corr = latest_60d.loc[t1, t2]
                    
                    if hist_std > 0:
                        z_score = (current_corr - hist_mean) / hist_std
                        if abs(z_score) > 2:
                            significant_breaks.append({
                                'pair': f"{t1}-{t2}",
                                'current': float(current_corr),
                                'historical_mean': float(hist_mean),
                                'z_score': float(z_score)
                            })
                            
    return {
        'tickers': tickers,
        'matrix': full_corr.values.tolist(),
        'rolling_60d': latest_60d.values.tolist(),
        'significant_breaks': significant_breaks
    }
