import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf
from typing import Dict, List, Any, Optional

def _portfolio_volatility(weights: np.ndarray, cov_matrix: np.ndarray) -> float:
    return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

def _portfolio_cvar(weights: np.ndarray, returns_matrix: np.ndarray, alpha: float = 0.95) -> float:
    port_returns = returns_matrix.dot(weights)
    var = np.percentile(port_returns, (1 - alpha) * 100)
    tail_losses = port_returns[port_returns <= var]
    cvar = tail_losses.mean() if len(tail_losses) > 0 else var
    return -cvar  # Positive loss for minimization

def max_sharpe_optimize(returns: pd.DataFrame, risk_free_rate: float = 0.065, max_weight: float = 0.50) -> dict:
    if returns.empty or len(returns.columns) == 0:
        return {"error": "No return data"}
        
    n_assets = len(returns.columns)
    mu = returns.mean().values * 252
    
    # Shrunk covariance
    lw = LedoitWolf()
    cov_matrix = lw.fit(returns.values).covariance_ * 252
    
    def neg_sharpe(w):
        r = np.sum(w * mu)
        vol = _portfolio_volatility(w, cov_matrix)
        return -(r - risk_free_rate) / vol if vol > 1e-6 else 0.0

    bounds = tuple((0.0, max_weight) for _ in range(n_assets))
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    w0 = np.array([1.0 / n_assets] * n_assets)

    res = minimize(neg_sharpe, w0, method='SLSQP', bounds=bounds, constraints=constraints)
    opt_weights = res.x if res.success else w0
    
    opt_r = float(np.sum(opt_weights * mu))
    opt_vol = float(_portfolio_volatility(opt_weights, cov_matrix))
    opt_sharpe = float((opt_r - risk_free_rate) / opt_vol) if opt_vol > 0 else 0.0
    
    return {
        'optimal_weights': {returns.columns[i]: round(float(opt_weights[i]), 4) for i in range(n_assets)},
        'expected_return': round(opt_r, 4),
        'volatility': round(opt_vol, 4),
        'sharpe_ratio': round(opt_sharpe, 4)
    }

def min_variance_optimize(returns: pd.DataFrame, max_weight: float = 0.50) -> dict:
    if returns.empty or len(returns.columns) == 0:
        return {"error": "No return data"}
        
    n_assets = len(returns.columns)
    mu = returns.mean().values * 252
    
    lw = LedoitWolf()
    cov_matrix = lw.fit(returns.values).covariance_ * 252
    
    def port_vol(w):
        return _portfolio_volatility(w, cov_matrix)

    bounds = tuple((0.0, max_weight) for _ in range(n_assets))
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    w0 = np.array([1.0 / n_assets] * n_assets)

    res = minimize(port_vol, w0, method='SLSQP', bounds=bounds, constraints=constraints)
    opt_weights = res.x if res.success else w0
    
    opt_r = float(np.sum(opt_weights * mu))
    opt_vol = float(_portfolio_volatility(opt_weights, cov_matrix))
    
    return {
        'optimal_weights': {returns.columns[i]: round(float(opt_weights[i]), 4) for i in range(n_assets)},
        'expected_return': round(opt_r, 4),
        'volatility': round(opt_vol, 4)
    }

def cvar_optimize(returns: pd.DataFrame, target_return: float = 0.12, max_weight: float = 0.50, alpha: float = 0.95) -> dict:
    if returns.empty or len(returns.columns) == 0:
        return {"error": "No return data"}
        
    n_assets = len(returns.columns)
    returns_matrix = returns.values
    mu = returns.mean().values * 252
    
    effective_max_weight = max(max_weight, 1.0 / n_assets + 0.05) if n_assets > 1 else 1.0
    effective_max_weight = min(effective_max_weight, 1.0)
    
    max_possible_return = np.max(mu)
    effective_target_return = min(target_return, max_possible_return * 0.95) if max_possible_return > 0 else np.mean(mu)
    
    constraints = [
        {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
        {'type': 'ineq', 'fun': lambda w: np.sum(w * mu) - effective_target_return}
    ]
    bounds = tuple((0.0, effective_max_weight) for _ in range(n_assets))
    w0 = np.array([1.0 / n_assets] * n_assets)
    
    try:
        result = minimize(
            _portfolio_cvar, 
            w0, 
            args=(returns_matrix, alpha),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        if not result.success:
            result = minimize(
                _portfolio_cvar,
                w0,
                args=(returns_matrix, alpha),
                method='SLSQP',
                bounds=bounds,
                constraints=[{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
            )
            
        opt_weights = result.x if result.success else w0
        exp_ret = float(np.sum(opt_weights * mu))
        port_returns = returns_matrix.dot(opt_weights)
        
        var = float(np.percentile(port_returns, (1 - alpha) * 100))
        tail_losses = port_returns[port_returns <= var]
        cvar = float(tail_losses.mean()) if len(tail_losses) > 0 else var
        
        # Shrunk covariance volatility
        lw = LedoitWolf()
        cov_matrix = lw.fit(returns.values).covariance_ * 252
        vol = float(_portfolio_volatility(opt_weights, cov_matrix))
        
        return {
            'optimal_weights': {returns.columns[i]: round(float(opt_weights[i]), 4) for i in range(n_assets)},
            'expected_return': round(exp_ret, 4),
            'volatility': round(vol, 4),
            'portfolio_cvar': round(cvar, 4),
            'portfolio_var': round(var, 4)
        }
    except Exception as e:
        return {"error": str(e)}

def calculate_efficient_frontier(returns: pd.DataFrame, n_points: int = 25, risk_free_rate: float = 0.065) -> dict:
    if returns.empty or len(returns.columns) == 0:
        return {"error": "No return data"}
        
    n_assets = len(returns.columns)
    mu = returns.mean().values * 252
    
    lw = LedoitWolf()
    cov_matrix = lw.fit(returns.values).covariance_ * 252
    
    min_r = float(np.min(mu))
    max_r = float(np.max(mu))
    target_returns = np.linspace(min_r, max_r, n_points)
    
    frontier_points = []
    w0 = np.array([1.0 / n_assets] * n_assets)
    bounds = tuple((0.0, 0.60) for _ in range(n_assets))
    
    for tr in target_returns:
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'eq', 'fun': lambda w, target=tr: np.sum(w * mu) - target}
        ]
        res = minimize(lambda w: _portfolio_volatility(w, cov_matrix), w0, method='SLSQP', bounds=bounds, constraints=constraints)
        if res.success:
            vol = float(_portfolio_volatility(res.x, cov_matrix))
            s = float((tr - risk_free_rate) / vol) if vol > 0 else 0.0
            frontier_points.append({
                'return': round(float(tr), 4),
                'volatility': round(vol, 4),
                'sharpe': round(s, 4),
                'weights': {returns.columns[i]: round(float(res.x[i]), 4) for i in range(n_assets)}
            })
            
    # Max Sharpe and Min Volatility benchmarks
    max_sharpe = max_sharpe_optimize(returns, risk_free_rate)
    min_vol = min_variance_optimize(returns)
    
    return {
        'frontier': frontier_points,
        'max_sharpe_portfolio': max_sharpe,
        'min_volatility_portfolio': min_vol
    }

def monte_carlo_portfolio_simulation(returns: pd.DataFrame, weights: list[float], capital: float = 1000000.0, horizon_days: int = 252, n_sims: int = 1000) -> dict:
    if returns.empty or len(returns.columns) == 0:
        return {"error": "No return data"}
        
    n_assets = len(returns.columns)
    w = np.array(weights)
    if len(w) != n_assets:
        w = np.array([1.0 / n_assets] * n_assets)
        
    mean_daily = returns.mean().values
    lw = LedoitWolf()
    cov_daily = lw.fit(returns.values).covariance_
    
    np.random.seed(42)
    simulated_daily_asset_returns = np.random.multivariate_normal(mean_daily, cov_daily, (n_sims, horizon_days))
    
    # Portfolio daily returns shape: (n_sims, horizon_days)
    sim_port_daily = np.dot(simulated_daily_asset_returns, w)
    
    # Cumulative trajectory: (n_sims, horizon_days + 1)
    cum_returns = np.cumprod(1 + sim_port_daily, axis=1)
    cum_wealth = np.hstack([np.ones((n_sims, 1)) * capital, capital * cum_returns])
    
    # Percentile fan chart curves (5th, 25th, 50th/median, 75th, 95th)
    percentiles = {
        'p05': [round(float(x), 2) for x in np.percentile(cum_wealth, 5, axis=0)],
        'p25': [round(float(x), 2) for x in np.percentile(cum_wealth, 25, axis=0)],
        'median': [round(float(x), 2) for x in np.percentile(cum_wealth, 50, axis=0)],
        'p75': [round(float(x), 2) for x in np.percentile(cum_wealth, 75, axis=0)],
        'p95': [round(float(x), 2) for x in np.percentile(cum_wealth, 95, axis=0)]
    }
    
    final_wealth = cum_wealth[:, -1]
    final_returns = (final_wealth - capital) / capital
    
    var99 = float(np.percentile(final_returns, 1))
    cvar99 = float(final_returns[final_returns <= var99].mean())
    
    return {
        'fan_chart': percentiles,
        'terminal_wealth_stats': {
            'mean': round(float(np.mean(final_wealth)), 2),
            'median': round(float(np.median(final_wealth)), 2),
            'worst_case_p01': round(float(np.percentile(final_wealth, 1)), 2),
            'best_case_p99': round(float(np.percentile(final_wealth, 99)), 2),
            'var_99_1yr': round(var99, 4),
            'cvar_99_1yr': round(cvar99, 4)
        }
    }
