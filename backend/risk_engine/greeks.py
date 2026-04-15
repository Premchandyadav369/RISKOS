import numpy as np
from scipy.stats import norm
from typing import Dict, Any

def black_scholes_greeks(
    spot: float = 220.0,
    strike: float = 220.0,
    time_to_expiry_days: float = 90.0,
    volatility_pct: float = 24.0,
    risk_free_rate_pct: float = 4.5,
    option_type: str = "call"
) -> Dict[str, Any]:
    """
    Computes exact Black-Scholes European option pricing and full Greeks.
    """
    S = float(spot)
    K = float(strike)
    T = float(time_to_expiry_days) / 365.0
    v = float(volatility_pct) / 100.0
    r = float(risk_free_rate_pct) / 100.0
    
    if T <= 0 or v <= 0:
        return {}
        
    d1 = (np.log(S / K) + (r + 0.5 * v**2) * T) / (v * np.sqrt(T))
    d2 = d1 - v * np.sqrt(T)
    
    if option_type.lower() == "call":
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        delta = norm.cdf(d1)
        theta = (- (S * norm.pdf(d1) * v) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365.0
        rho = (K * T * np.exp(-r * T) * norm.cdf(d2)) / 100.0
    else:
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = norm.cdf(d1) - 1.0
        theta = (- (S * norm.pdf(d1) * v) / (2 * np.sqrt(T)) + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365.0
        rho = (-K * T * np.exp(-r * T) * norm.cdf(-d2)) / 100.0
        
    gamma = norm.pdf(d1) / (S * v * np.sqrt(T))
    vega = (S * norm.pdf(d1) * np.sqrt(T)) / 100.0
    
    return {
        "spot": S,
        "strike": K,
        "expiry_days": time_to_expiry_days,
        "implied_volatility_pct": volatility_pct,
        "option_type": option_type.upper(),
        "option_price": round(price, 3),
        "greeks": {
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "vega": round(vega, 4),
            "theta": round(theta, 4),
            "rho": round(rho, 4)
        }
    }
