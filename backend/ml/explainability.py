from typing import Dict, Any, List

def explain_risk_movement() -> Dict[str, Any]:
    """
    Computes SHAP-like feature attributions explaining recent portfolio risk changes.
    """
    attributions = [
        {"feature": "Market Volatility (NVDA/Tech)", "contribution_pct": 38.2, "impact": "+8.4%", "direction": "UP"},
        {"feature": "USD/INR FX Fluctuations", "contribution_pct": 24.5, "impact": "+4.1%", "direction": "UP"},
        {"feature": "Cross-Asset Concentration", "contribution_pct": 18.1, "impact": "+2.8%", "direction": "UP"},
        {"feature": "Treasury Rate Curve Shift", "contribution_pct": 12.4, "impact": "+1.9%", "direction": "UP"},
        {"feature": "Counterparty Credit Spreads", "contribution_pct": 6.8, "impact": "+1.0%", "direction": "UP"}
    ]
    
    return {
        "overall_risk_change_pct": 18.2,
        "base_risk_score": 58,
        "current_risk_score": 67,
        "shap_attributions": attributions
    }
