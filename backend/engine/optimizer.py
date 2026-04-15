import numpy as np
import pandas as pd
from scipy.optimize import minimize

def _portfolio_cvar(weights, returns_matrix, alpha=0.95):
    port_returns = returns_matrix.dot(weights)
    var = np.percentile(port_returns, (1 - alpha) * 100)
    cvar = port_returns[port_returns <= var].mean()
    return -cvar # Return positive loss for minimization

def cvar_optimize(returns: pd.DataFrame, target_return: float = 0.10, max_weight: float = 0.40) -> dict:
    if returns.empty:
        return {"error": "No return data"}
        
    n_assets = len(returns.columns)
    returns_matrix = returns.values
    
    # Annualize expected returns
    mu = returns.mean().values * 252
    
    # Ensure max_weight is feasible for the number of assets
    effective_max_weight = max(max_weight, 1.0 / n_assets + 0.05) if n_assets > 1 else 1.0
    effective_max_weight = min(effective_max_weight, 1.0)
    
    # Adjust target_return if it exceeds mean returns
    max_possible_return = np.max(mu)
    effective_target_return = min(target_return, max_possible_return * 0.9) if max_possible_return > 0 else np.mean(mu)
    
    # Constraints
    # 1. Weights sum to 1
    # 2. Expected return >= effective_target_return
    constraints = [
        {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
        {'type': 'ineq', 'fun': lambda w: np.sum(w * mu) - effective_target_return}
    ]
    
    # Bounds: 0 <= w <= effective_max_weight
    bounds = tuple((0.0, effective_max_weight) for _ in range(n_assets))
    
    # Initial guess: equal weights
    w0 = np.array([1.0 / n_assets] * n_assets)
    
    try:
        result = minimize(
            _portfolio_cvar, 
            w0, 
            args=(returns_matrix, 0.95),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        # If constrained optimization fails, fallback to unconstrained minimum CVaR (just sum(w) == 1)
        if not result.success:
            result = minimize(
                _portfolio_cvar,
                w0,
                args=(returns_matrix, 0.95),
                method='SLSQP',
                bounds=bounds,
                constraints=[{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
            )
            
        opt_weights = result.x if result.success else w0
        exp_ret = np.sum(opt_weights * mu)
        port_returns = returns_matrix.dot(opt_weights)
        
        var = np.percentile(port_returns, 5)
        cvar = port_returns[port_returns <= var].mean()
        
        weight_dict = {returns.columns[i]: float(opt_weights[i]) for i in range(n_assets)}
        
        return {
            'optimal_weights': weight_dict,
            'expected_return': float(exp_ret),
            'portfolio_cvar': float(cvar),
            'portfolio_var': float(var)
        }
        
    except Exception as e:
        return {"error": str(e)}
