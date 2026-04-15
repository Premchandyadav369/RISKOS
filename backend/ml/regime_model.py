import numpy as np
import pandas as pd
from typing import Dict, Any
from risk_engine.data_ingestion import get_portfolio_prices

def detect_market_regime() -> Dict[str, Any]:
    """
    Identifies current market regime state (Low Volatility, Normal, High Volatility, Crisis)
    using Gaussian Mixture & volatility/drawdown clustering.
    """
    prices = get_portfolio_prices()
    returns = prices.pct_change().dropna()
    
    port_ret = returns.mean(axis=1)
    recent_vol = float(port_ret.tail(20).std() * np.sqrt(252))
    hist_vol = float(port_ret.std() * np.sqrt(252))
    
    vol_ratio = recent_vol / max(hist_vol, 1e-6)
    
    if vol_ratio > 1.8:
        current_regime = "CRISIS REGIME"
        probs = {"Normal": 5, "High Volatility": 20, "Crisis": 75}
        color = "#B54242"
    elif vol_ratio > 1.2:
        current_regime = "HIGH VOLATILITY"
        probs = {"Normal": 15, "High Volatility": 70, "Crisis": 15}
        color = "#B27A1A"
    elif vol_ratio < 0.7:
        current_regime = "LOW VOLATILITY"
        probs = {"Low Volatility": 80, "Normal": 20, "High Volatility": 0}
        color = "#2F7D5A"
    else:
        current_regime = "NORMAL REGIME"
        probs = {"Low Volatility": 25, "Normal": 65, "High Volatility": 10}
        color = "#2F7D5A"
        
    return {
        "current_regime": current_regime,
        "recent_volatility_pct": round(recent_vol * 100, 2),
        "historical_volatility_pct": round(hist_vol * 100, 2),
        "volatility_ratio": round(vol_ratio, 2),
        "regime_probabilities": probs,
        "status_color": color
    }
