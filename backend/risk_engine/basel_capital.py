from typing import Dict, Any

def calculate_basel_capital_adequacy() -> Dict[str, Any]:
    """
    Computes Basel III & FRTB Capital Adequacy Ratios and Risk-Weighted Assets (RWA).
    """
    cet1_capital = 145_000_000.0   # $145M CET1 Capital
    tier1_capital = 168_000_000.0  # $168M Tier 1 Capital
    total_capital = 195_000_000.0  # $195M Total Regulatory Capital
    
    # Risk-Weighted Assets (RWA)
    credit_rwa = 520_000_000.0
    market_rwa = 340_000_000.0
    op_rwa = 140_000_000.0
    
    total_rwa = credit_rwa + market_rwa + op_rwa
    
    cet1_ratio = (cet1_capital / total_rwa) * 100.0
    tier1_ratio = (tier1_capital / total_rwa) * 100.0
    total_capital_ratio = (total_capital / total_rwa) * 100.0
    
    # Basel III Regulatory Thresholds
    cet1_minimum = 4.5
    capital_conservation_buffer = 2.5
    countercyclical_buffer = 1.0
    cet1_target = cet1_minimum + capital_conservation_buffer + countercyclical_buffer # 8.0%
    
    status = "WELL_CAPITALIZED" if cet1_ratio >= cet1_target else "CAPITAL_CONSTRAINED"
    
    return {
        "framework": "Basel III / FRTB (Fundamental Review of Trading Book)",
        "cet1_capital_usd": cet1_capital,
        "tier1_capital_usd": tier1_capital,
        "total_capital_usd": total_capital,
        "total_rwa_usd": total_rwa,
        "rwa_breakdown": {
            "credit_risk_rwa": credit_rwa,
            "market_risk_rwa": market_rwa,
            "operational_risk_rwa": op_rwa,
            "credit_share_pct": round((credit_rwa / total_rwa) * 100, 1),
            "market_share_pct": round((market_rwa / total_rwa) * 100, 1),
            "op_share_pct": round((op_rwa / total_rwa) * 100, 1)
        },
        "capital_ratios": {
            "cet1_ratio_pct": round(cet1_ratio, 2),
            "tier1_ratio_pct": round(tier1_ratio, 2),
            "total_capital_ratio_pct": round(total_capital_ratio, 2),
            "regulatory_target_cet1_pct": cet1_target,
            "headroom_pct": round(cet1_ratio - cet1_target, 2)
        },
        "status": status
    }
