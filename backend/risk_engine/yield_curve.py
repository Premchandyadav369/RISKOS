from typing import Dict, Any

def get_yield_curve_data() -> Dict[str, Any]:
    """
    Returns simulated US Treasury and Indian G-Sec yield curve data.
    """
    us_treasury = [
        {"maturity": "1M", "yield_pct": 5.35},
        {"maturity": "3M", "yield_pct": 5.42},
        {"maturity": "6M", "yield_pct": 5.48},
        {"maturity": "1Y", "yield_pct": 5.25},
        {"maturity": "2Y", "yield_pct": 4.85},
        {"maturity": "5Y", "yield_pct": 4.25},
        {"maturity": "10Y", "yield_pct": 4.10},
        {"maturity": "30Y", "yield_pct": 4.28},
    ]
    
    india_gsec = [
        {"maturity": "1M", "yield_pct": 6.85},
        {"maturity": "3M", "yield_pct": 6.92},
        {"maturity": "6M", "yield_pct": 7.05},
        {"maturity": "1Y", "yield_pct": 7.15},
        {"maturity": "2Y", "yield_pct": 7.08},
        {"maturity": "5Y", "yield_pct": 7.12},
        {"maturity": "10Y", "yield_pct": 7.18},
        {"maturity": "30Y", "yield_pct": 7.35},
    ]
    
    us_10y_2y_spread = 4.10 - 4.85
    india_10y_2y_spread = 7.18 - 7.08
    
    return {
        "us_treasury": us_treasury,
        "india_gsec": india_gsec,
        "us_spread_bps": round(us_10y_2y_spread * 100, 1),
        "india_spread_bps": round(india_10y_2y_spread * 100, 1),
        "us_curve_status": "INVERTED" if us_10y_2y_spread < 0 else "NORMAL",
        "india_curve_status": "INVERTED" if india_10y_2y_spread < 0 else "NORMAL",
        "recession_probability_pct": 68.4 if us_10y_2y_spread < 0 else 15.2
    }
