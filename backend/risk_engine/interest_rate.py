from typing import Dict, Any

def calculate_interest_rate_risk(
    rate_shock_bps: float = 100.0,
    portfolio_value: float = 1_000_000.0
) -> Dict[str, Any]:
    """
    Simulates Treasury Interest Rate Shocks (+/- 25, 50, 100, 200 bps).
    Calculates Portfolio Value impact, Net Interest Income (NII), Duration, and Capital ratio impact.
    """
    shock_pct = rate_shock_bps / 10000.0  # Convert bps to decimal
    duration = 4.25  # Effective Portfolio Duration (years)
    convexity = 0.15
    
    # Price change approximation: -D * dY + 0.5 * C * (dY)^2
    delta_value_pct = -duration * shock_pct + 0.5 * convexity * (shock_pct ** 2)
    portfolio_value_impact = portfolio_value * delta_value_pct
    
    # Net Interest Income (NII) sensitivity (assets yield faster than liabilities)
    nii_impact = portfolio_value * 0.045 * (rate_shock_bps / 100.0) * 0.35
    
    # Liquidity & Capital ratio impact
    liquidity_impact_pct = -delta_value_pct * 0.4 * 100
    capital_ratio_impact_pct = delta_value_pct * 0.25 * 100
    
    risk_score = min(100.0, max(10.0, 50.0 + abs(rate_shock_bps) * 0.15))
    
    return {
        "rate_shock_bps": rate_shock_bps,
        "effective_duration_years": duration,
        "portfolio_value_impact": round(portfolio_value_impact, 2),
        "portfolio_value_impact_pct": round(delta_value_pct * 100, 2),
        "net_interest_income_impact": round(nii_impact, 2),
        "liquidity_impact_pct": round(liquidity_impact_pct, 2),
        "capital_ratio_impact_pct": round(capital_ratio_impact_pct, 2),
        "interest_rate_risk_score": round(risk_score, 1)
    }
