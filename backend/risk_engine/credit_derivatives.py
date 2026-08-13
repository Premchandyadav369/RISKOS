import numpy as np
from typing import Dict, Any

def price_credit_default_swap(
    notional: float = 10_000_000.0,
    recovery_rate_pct: float = 40.0,
    hazard_rate_bps: float = 120.0,
    tenor_years: int = 5,
    risk_free_rate_pct: float = 4.25
) -> Dict[str, Any]:
    """
    Prices a Credit Default Swap (CDS).
    Calculates the Par CDS Spread (in bps) and Upfront Premium if traded off-market.
    """
    recovery = recovery_rate_pct / 100.0
    hazard_rate = hazard_rate_bps / 10000.0
    rf_rate = risk_free_rate_pct / 100.0
    
    # Premium Leg (PV of expected premiums paid) & Protection Leg (PV of expected default payoff)
    premium_leg_pv = 0.0
    protection_leg_pv = 0.0
    
    survival_prob = 1.0
    dt = 1.0 # 1 year steps for simplicity
    
    cash_flows = []
    
    for t in range(1, tenor_years + 1):
        # Probability of surviving until year t
        prev_survival = survival_prob
        survival_prob = np.exp(-hazard_rate * t)
        
        # Probability of default exactly in year t
        default_prob = prev_survival - survival_prob
        
        discount_factor = np.exp(-rf_rate * t)
        
        # PV of 1 bps premium paid if survives
        premium_leg_pv += survival_prob * discount_factor * dt
        
        # PV of protection payoff if defaults
        payoff = (1.0 - recovery) * notional
        protection_leg_pv += default_prob * discount_factor * payoff
        
        cash_flows.append({
            "year": t,
            "survival_prob_pct": round(survival_prob * 100, 2),
            "default_prob_pct": round(default_prob * 100, 2),
            "discount_factor": round(discount_factor, 4)
        })
        
    # Par CDS Spread (in bps): The spread where Premium Leg = Protection Leg
    # premium_leg_pv is per 1 unit of spread. Total premium PV = Spread * Notional * premium_leg_pv
    # Spread = Protection Leg PV / (Notional * premium_leg_pv)
    par_spread_bps = (protection_leg_pv / (notional * premium_leg_pv)) * 10000.0
    
    # Let's say market trades at a fixed standard spread of 100 bps (or 500 bps). 
    # Calculate Upfront Premium required if trading at 100 bps standard coupon.
    standard_coupon_bps = 100.0
    standard_coupon = standard_coupon_bps / 10000.0
    upfront_premium_usd = protection_leg_pv - (standard_coupon * notional * premium_leg_pv)
    
    return {
        "notional_usd": notional,
        "tenor_years": tenor_years,
        "recovery_rate_pct": recovery_rate_pct,
        "hazard_rate_bps": hazard_rate_bps,
        "par_spread_bps": round(par_spread_bps, 1),
        "standard_coupon_bps": standard_coupon_bps,
        "upfront_premium_usd": round(upfront_premium_usd, 2),
        "protection_leg_pv_usd": round(protection_leg_pv, 2),
        "risky_pv01_usd": round(notional * premium_leg_pv / 10000.0, 2), # PV of 1 bps premium
        "survival_curve": cash_flows
    }
