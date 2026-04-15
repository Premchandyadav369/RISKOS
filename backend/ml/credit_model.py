import numpy as np
import pandas as pd
from typing import Dict, Any, List

def predict_counterparty_pd(
    debt_to_equity: float,
    interest_coverage: float,
    current_ratio: float,
    operating_margin_pct: float,
    asset_volatility_pct: float
) -> Dict[str, Any]:
    """
    ML Logistic Regression / XGBoost proxy model predicting counterparty Default Probability (PD).
    """
    # Score formula derived from financial distress logistic regression coefficients
    z = (
        0.8 * debt_to_equity
        - 0.35 * interest_coverage
        - 0.50 * current_ratio
        - 0.04 * operating_margin_pct
        + 0.08 * asset_volatility_pct
        + 0.5
    )
    pd_prob = 1.0 / (1.0 + np.exp(-z))
    pd_pct = round(float(pd_prob) * 100, 2)
    
    if pd_pct < 1.0:
        rating = "AAA/AA"
    elif pd_pct < 2.5:
        rating = "A/A-"
    elif pd_pct < 5.0:
        rating = "BBB"
    elif pd_pct < 8.0:
        rating = "BB"
    else:
        rating = "B/CCC"
        
    return {
        "predicted_pd_pct": pd_pct,
        "implied_rating": rating,
        "risk_tier": "HIGH" if pd_pct > 5.0 else ("MEDIUM" if pd_pct > 2.5 else "LOW"),
        "key_factors": {
            "leverage_impact": "+ High" if debt_to_equity > 2.0 else "- Normal",
            "interest_coverage_protection": "Weak" if interest_coverage < 2.5 else "Strong",
            "liquidity_buffer": "Constrained" if current_ratio < 1.0 else "Adequate"
        }
    }
