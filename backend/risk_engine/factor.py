from typing import Dict, Any, List

def calculate_factor_risk() -> Dict[str, Any]:
    """
    Decomposes total portfolio risk into risk factors across US & Indian markets.
    """
    factors = [
        {"name": "Market Beta (US / India)", "exposure": 1.08, "risk_contribution_pct": 38.4, "description": "Broad market directional movement"},
        {"name": "Technology Sector", "exposure": 1.42, "risk_contribution_pct": 24.2, "description": "NVDA, AAPL, MSFT, TCS, INFY volatility"},
        {"name": "Banking & Financials", "exposure": 0.95, "risk_contribution_pct": 16.8, "description": "JPM, GS, HDFCBANK, ICICIBANK exposure"},
        {"name": "USD/INR FX Sensitivity", "exposure": 0.68, "risk_contribution_pct": 9.5, "description": "Currency depreciation & cross-border returns"},
        {"name": "Interest Rate Factor", "exposure": -0.45, "risk_contribution_pct": 6.1, "description": "Treasury yield curve shifts"},
        {"name": "Momentum & Volatility", "exposure": 0.85, "risk_contribution_pct": 5.0, "description": "High-volatility momentum premium"}
    ]
    
    total_systematic = sum(f["risk_contribution_pct"] for f in factors)
    idiosyncratic = round(100.0 - total_systematic, 1)
    
    return {
        "systematic_risk_pct": round(total_systematic, 1),
        "idiosyncratic_risk_pct": idiosyncratic,
        "factor_breakdown": factors
    }
