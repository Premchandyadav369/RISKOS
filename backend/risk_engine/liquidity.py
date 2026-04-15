from typing import Dict, Any, List

def calculate_liquidity_risk(withdrawal_shock_pct: float = 0.0) -> Dict[str, Any]:
    """
    Computes liquidity metrics, 30/60/90 day cashflow maturity gaps, and stress buffer utilization.
    """
    base_buffer = 185_000_000.0  # $185M liquid buffer
    base_inflows = [45_000_000, 62_000_000, 88_000_000]  # 30d, 60d, 90d
    base_outflows = [52_000_000, 71_000_000, 94_000_000] # 30d, 60d, 90d
    
    # Apply withdrawal shock
    shock_mult = 1.0 + (withdrawal_shock_pct / 100.0)
    stressed_outflows = [out * shock_mult for out in base_outflows]
    
    net_30d = base_inflows[0] - stressed_outflows[0]
    net_60d = base_inflows[1] - stressed_outflows[1]
    net_90d = base_inflows[2] - stressed_outflows[2]
    
    stressed_buffer = max(0.0, base_buffer + net_30d)
    lcr = (stressed_buffer / max(1.0, stressed_outflows[0])) * 100.0
    buffer_utilization = min(100.0, (stressed_outflows[0] / max(1.0, base_buffer)) * 100.0)
    
    status = "CRITICAL" if lcr < 100.0 else ("WARNING" if lcr < 125.0 else "HEALTHY")
    
    forecast = [
        {"period": "30-Day", "inflow": base_inflows[0], "outflow": round(stressed_outflows[0], 2), "net": round(net_30d, 2)},
        {"period": "60-Day", "inflow": base_inflows[1], "outflow": round(stressed_outflows[1], 2), "net": round(net_60d, 2)},
        {"period": "90-Day", "inflow": base_inflows[2], "outflow": round(stressed_outflows[2], 2), "net": round(net_90d, 2)},
    ]
    
    liquidity_score = round(min(100.0, max(20.0, 100.0 - buffer_utilization * 0.6)), 1)
    
    return {
        "liquidity_buffer": round(stressed_buffer, 2),
        "buffer_utilization_pct": round(buffer_utilization, 2),
        "lcr_pct": round(lcr, 2),
        "liquidity_risk_score": liquidity_score,
        "status": status,
        "withdrawal_shock_pct": withdrawal_shock_pct,
        "forecast": forecast
    }
