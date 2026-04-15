import numpy as np
from typing import Dict, Any

def price_interest_rate_swap(
    notional: float = 50_000_000.0,
    fixed_rate_bps: float = 450.0,
    tenor_years: int = 5,
    floating_spread_bps: float = 15.0
) -> Dict[str, Any]:
    """
    Prices a Vanilla Interest Rate Swap (Receive Fixed, Pay Floating).
    Simulates SOFR/LIBOR yield curve stripping and discount factors.
    """
    fixed_rate = fixed_rate_bps / 10000.0
    floating_spread = floating_spread_bps / 10000.0
    
    # Synthetic SOFR Forward Curve (Upward sloping)
    base_rate = 0.0425 # 4.25%
    curve_steepness = 0.0015 # 15 bps per year
    
    fixed_leg_pv = 0.0
    float_leg_pv = 0.0
    
    # Annual payments for simplicity
    cash_flows = []
    
    for t in range(1, tenor_years + 1):
        forward_rate = base_rate + (curve_steepness * t)
        discount_factor = 1.0 / ((1.0 + forward_rate) ** t)
        
        fixed_cf = notional * fixed_rate
        float_cf = notional * (forward_rate + floating_spread)
        
        fixed_pv = fixed_cf * discount_factor
        float_pv = float_cf * discount_factor
        
        fixed_leg_pv += fixed_pv
        float_leg_pv += float_pv
        
        cash_flows.append({
            "year": t,
            "forward_rate_pct": round(forward_rate * 100, 2),
            "discount_factor": round(discount_factor, 4),
            "fixed_cashflow": round(fixed_cf, 2),
            "float_cashflow": round(float_cf, 2)
        })
        
    net_present_value = fixed_leg_pv - float_leg_pv
    
    # Par Swap Rate (Rate where NPV = 0)
    # Sum(DF) * Notional * ParRate = float_leg_pv
    sum_df = sum(cf["discount_factor"] for cf in cash_flows)
    par_swap_rate = (float_leg_pv / (notional * sum_df)) * 10000.0 # in bps
    
    return {
        "swap_type": "Receive Fixed / Pay Floating",
        "notional_usd": notional,
        "tenor_years": tenor_years,
        "fixed_rate_bps": fixed_rate_bps,
        "floating_spread_bps": floating_spread_bps,
        "fixed_leg_pv_usd": round(fixed_leg_pv, 2),
        "float_leg_pv_usd": round(float_leg_pv, 2),
        "net_present_value_usd": round(net_present_value, 2),
        "par_swap_rate_bps": round(par_swap_rate, 1),
        "cash_flows": cash_flows
    }
