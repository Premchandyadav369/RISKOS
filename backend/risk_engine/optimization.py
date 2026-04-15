import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, Any, Optional
from .data_ingestion import get_portfolio_prices, DEFAULT_WEIGHTS

def optimize_portfolio(
    weights: Optional[Dict[str, float]] = None,
    min_cash_pct: float = 5.0,
    max_asset_pct: float = 25.0
) -> Dict[str, Any]:
    """
    Executes Mean-Variance portfolio optimization maximizing Sharpe ratio.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
        
    prices = get_portfolio_prices(weights)
    returns = prices.pct_change().dropna()
    
    mean_returns = returns.mean() * 252
    cov_matrix = returns.cov() * 252
    num_assets = len(mean_returns)
    risk_free_rate = 0.045
    
    # Objective function: Negative Sharpe Ratio
    def neg_sharpe(w):
        p_ret = np.dot(w, mean_returns)
        p_vol = np.sqrt(np.dot(w.T, np.dot(cov_matrix, w)))
        return -(p_ret - risk_free_rate) / max(p_vol, 1e-6)
        
    # Constraints & Bounds
    bounds = tuple((0.02, max_asset_pct / 100.0) for _ in range(num_assets))
    cash_alloc = min_cash_pct / 100.0
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - (1.0 - cash_alloc)})
    
    init_weights = np.array([1.0 / num_assets] * num_assets) * (1.0 - cash_alloc)
    
    res = minimize(neg_sharpe, init_weights, method='SLSQP', bounds=bounds, constraints=constraints)
    
    if res.success:
        opt_weights = res.x
    else:
        opt_weights = init_weights
        
    cols = list(prices.columns)
    current_weights_dict = {col: round(weights.get(col, 1.0 / len(cols)), 4) for col in cols}
    optimized_weights_dict = {col: round(float(opt_weights[i]), 4) for i, col in enumerate(cols)}
    optimized_weights_dict["Cash"] = round(cash_alloc, 4)
    
    # Calculate current vs optimized portfolio metrics
    curr_w_vec = np.array([weights.get(col, 0.0) for col in cols])
    curr_w_vec = curr_w_vec / np.sum(curr_w_vec)
    
    curr_ret = np.dot(curr_w_vec, mean_returns)
    curr_vol = np.sqrt(np.dot(curr_w_vec.T, np.dot(cov_matrix, curr_w_vec)))
    curr_sharpe = (curr_ret - risk_free_rate) / max(curr_vol, 1e-6)
    
    opt_ret = np.dot(opt_weights, mean_returns)
    opt_vol = np.sqrt(np.dot(opt_weights.T, np.dot(cov_matrix, opt_weights)))
    opt_sharpe = (opt_ret - risk_free_rate) / max(opt_vol, 1e-6)
    
    return {
        "current_metrics": {
            "expected_return_pct": round(curr_ret * 100, 2),
            "volatility_pct": round(curr_vol * 100, 2),
            "sharpe_ratio": round(curr_sharpe, 2)
        },
        "optimized_metrics": {
            "expected_return_pct": round(opt_ret * 100, 2),
            "volatility_pct": round(opt_vol * 100, 2),
            "sharpe_ratio": round(opt_sharpe, 2)
        },
        "weights_comparison": [
            {
                "ticker": col,
                "current_pct": round(current_weights_dict[col] * 100, 1),
                "optimized_pct": round(optimized_weights_dict[col] * 100, 1),
                "delta_pct": round((optimized_weights_dict[col] - current_weights_dict[col]) * 100, 1)
            }
            for col in cols
        ]
    }
