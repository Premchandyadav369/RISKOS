import numpy as np
import pandas as pd
from scipy.optimize import minimize
from .market import get_returns
from .covariance import ledoit_wolf_shrinkage

def brinson_fachler_attribution(portfolio_weights: dict, benchmark_weights: dict, asset_returns: dict, benchmark_return: float) -> dict:
    """
    Decomposes portfolio active return into Allocation Effect, Selection Effect, and Interaction Effect:
    Allocation_i = (w_p,i - w_b,i) * (R_b,i - R_b_total)
    Selection_i  = w_b,i * (R_p,i - R_b,i)
    Interaction_i= (w_p,i - w_b,i) * (R_p,i - R_b,i)
    """
    sectors = list(portfolio_weights.keys())
    
    alloc_effects = {}
    select_effects = {}
    interact_effects = {}
    total_active_by_asset = {}
    
    total_alloc = 0.0
    total_select = 0.0
    total_interact = 0.0
    
    for s in sectors:
        wp = portfolio_weights.get(s, 0.0)
        wb = benchmark_weights.get(s, 1.0 / len(sectors))
        rp = asset_returns.get(s, 0.0)
        rb = asset_returns.get(s, 0.0) * 0.95 # Benchmark asset return proxy
        
        alloc = (wp - wb) * (rb - benchmark_return)
        select = wb * (rp - rb)
        interact = (wp - wb) * (rp - rb)
        
        alloc_effects[s] = round(float(alloc * 100), 3)
        select_effects[s] = round(float(select * 100), 3)
        interact_effects[s] = round(float(interact * 100), 3)
        total_active_by_asset[s] = round(float((alloc + select + interact) * 100), 3)
        
        total_alloc += alloc
        total_select += select
        total_interact += interact
        
    return {
        'total_allocation_effect_pct': round(float(total_alloc * 100), 3),
        'total_selection_effect_pct': round(float(total_select * 100), 3),
        'total_interaction_effect_pct': round(float(total_interact * 100), 3),
        'total_active_return_pct': round(float((total_alloc + total_select + total_interact) * 100), 3),
        'by_asset': {
            'allocation': alloc_effects,
            'selection': select_effects,
            'interaction': interact_effects,
            'total': total_active_by_asset
        }
    }

def solve_risk_parity(cov_matrix: np.ndarray) -> np.ndarray:
    """
    Equal Risk Contribution (ERC) portfolio weights:
    Risk Contribution RC_i = w_i * (Sigma * w)_i / sigma_p = sigma_p / N
    Objective: sum_{i=1}^N (RC_i - sigma_p / N)^2
    """
    n = cov_matrix.shape[0]
    
    def objective(w):
        w = np.array(w)
        port_vol = np.sqrt(np.dot(w.T, np.dot(cov_matrix, w)))
        if port_vol == 0:
            return 0
        marginal_risk = np.dot(cov_matrix, w) / port_vol
        risk_contrib = w * marginal_risk
        target_risk = port_vol / n
        return np.sum((risk_contrib - target_risk) ** 2) * 1e6
        
    w0 = np.ones(n) / n
    bounds = tuple((0.01, 0.90) for _ in range(n))
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    
    res = minimize(objective, w0, method='SLSQP', bounds=bounds, constraints=constraints)
    return res.x if res.success else w0

def multi_asset_fractional_kelly(returns: pd.DataFrame, max_leverage: float = 1.5, fraction: float = 0.5) -> dict:
    """
    Multi-Asset Kelly Criterion: f* = fraction * (Sigma^-1 * mu)
    """
    mu = returns.mean().values * 252
    cov = returns.cov().values * 252 + 1e-4 * np.eye(len(mu))
    
    try:
        inv_cov = np.linalg.inv(cov)
        full_kelly = np.dot(inv_cov, mu)
        # Fractional Kelly for drawdown reduction
        scaled_kelly = full_kelly * fraction
        
        # Normalize/Cap to max leverage
        lev = np.sum(np.abs(scaled_kelly))
        if lev > max_leverage:
            scaled_kelly = scaled_kelly * (max_leverage / lev)
            
        weight_dict = {returns.columns[i]: round(float(scaled_kelly[i]), 3) for i in range(len(mu))}
        return {
            'kelly_weights': weight_dict,
            'implied_leverage': round(float(np.sum(np.abs(scaled_kelly))), 2),
            'fraction': fraction
        }
    except Exception as e:
        return {'kelly_weights': {c: round(1.0 / len(returns.columns), 3) for c in returns.columns}, 'implied_leverage': 1.0}

def analyze_attribution_and_parity(tickers: list[str] = None) -> dict:
    """
    Calculates Brinson-Fachler attribution, Risk Parity allocations, and Fractional Kelly sizing.
    """
    if not tickers:
        tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM"]
        
    returns = get_returns(tickers, period='1y')
    if returns.empty or len(returns.columns) < 2:
        return {'error': 'Insufficient ticker return data'}
        
    actual_tickers = list(returns.columns)
    n = len(actual_tickers)
    
    # 1. Ledoit-Wolf Covariance
    lw = ledoit_wolf_shrinkage(returns)
    cov_matrix = np.array(lw['covariance_matrix'])
    
    # 2. Risk Parity vs Equal Weight vs Kelly
    rp_weights = solve_risk_parity(cov_matrix)
    kelly_res = multi_asset_fractional_kelly(returns, max_leverage=1.5, fraction=0.5)
    
    # Marginal Risk Contributions under Risk Parity
    port_vol = float(np.sqrt(np.dot(rp_weights.T, np.dot(cov_matrix, rp_weights))) * np.sqrt(252))
    marginal_contrib = np.dot(cov_matrix, rp_weights) * np.sqrt(252) / (port_vol if port_vol > 0 else 1)
    rc_pct = (rp_weights * marginal_contrib / port_vol * 100).tolist()
    
    # 3. Brinson-Fachler Decomposition
    ann_returns = {actual_tickers[i]: float(returns[actual_tickers[i]].mean() * 252) for i in range(n)}
    b_weights = {actual_tickers[i]: 1.0 / n for i in range(n)}
    p_weights = {actual_tickers[i]: float(rp_weights[i]) for i in range(n)}
    bench_ret = float(np.mean(list(ann_returns.values())) * 0.95)
    
    brinson = brinson_fachler_attribution(p_weights, b_weights, ann_returns, bench_ret)
    
    return {
        'tickers': actual_tickers,
        'risk_parity_weights': {actual_tickers[i]: round(float(rp_weights[i]), 4) for i in range(n)},
        'risk_contribution_pct': {actual_tickers[i]: round(float(rc_pct[i]), 2) for i in range(n)},
        'fractional_kelly': kelly_res,
        'brinson_attribution': brinson,
        'annualized_portfolio_vol': round(port_vol, 4)
    }
