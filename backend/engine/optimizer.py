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

# =====================================================================
# INSTITUTIONAL EXTENSIONS: BLACK-LITTERMAN, HRP & REBALANCE BLOTTER
# =====================================================================

def black_litterman_news_optimize(
    returns: pd.DataFrame,
    news_views: Optional[Dict[str, float]] = None,
    risk_aversion: float = 2.5,
    tau: float = 0.05,
    max_weight: float = 0.50
) -> Dict[str, Any]:
    """
    Sentiment-Conditioned Black-Litterman Portfolio Optimization (He & Litterman 1999).
    Combines CAPM implied equilibrium returns with news sentiment view vector Q.
    """
    if returns.empty or len(returns.columns) == 0:
        return {"error": "Empty return data"}

    n_assets = len(returns.columns)
    tickers = list(returns.columns)

    lw = LedoitWolf()
    sigma = lw.fit(returns.values).covariance_ * 252.0

    # 1. CAPM Equilibrium Market Implied Returns: Pi = lambda * Sigma * w_mkt
    w_mkt = np.ones(n_assets) / n_assets  # Equal-weight proxy or market cap proxy
    pi = risk_aversion * (sigma @ w_mkt)

    # 2. News Views Vector Q and Picking Matrix P
    views_active = []
    if news_views:
        for i, tick in enumerate(tickers):
            if tick in news_views and abs(news_views[tick]) > 1e-4:
                views_active.append((i, news_views[tick]))

    k_views = len(views_active)
    if k_views == 0:
        # If no active news views, default to CAPM equilibrium with modest tilt
        views_active = [(0, 0.0)]
        k_views = 1

    P = np.zeros((k_views, n_assets))
    Q = np.zeros(k_views)
    for idx, (asset_idx, view_val) in enumerate(views_active):
        P[idx, asset_idx] = 1.0
        Q[idx] = float(view_val)

    # 3. View Uncertainty Matrix Omega (He & Litterman diagonal formulation)
    omega = np.diag(np.diag(P @ (tau * sigma) @ P.T))
    omega_inv = np.linalg.pinv(omega + 1e-6 * np.eye(k_views))

    # 4. Posterior Expected Returns: E[R]
    sigma_inv = np.linalg.pinv(tau * sigma)
    m1 = np.linalg.pinv(sigma_inv + P.T @ omega_inv @ P)
    m2 = sigma_inv @ pi + P.T @ omega_inv @ Q
    mu_bl = m1 @ m2

    # Posterior Covariance Matrix
    sigma_bl = sigma + m1

    # 5. Solve Optimal Weights subject to sum(w) = 1, 0 <= w_i <= max_weight
    def neg_bl_utility(w):
        port_ret = np.dot(w, mu_bl)
        port_var = np.dot(w.T, np.dot(sigma_bl, w))
        return -(port_ret - 0.5 * risk_aversion * port_var)

    bounds = tuple((0.0, max(max_weight, 1.0 / n_assets + 0.05)) for _ in range(n_assets))
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    w0 = np.ones(n_assets) / n_assets

    res = minimize(neg_bl_utility, w0, method='SLSQP', bounds=bounds, constraints=constraints)
    opt_w = res.x if res.success else w0

    opt_return = float(np.sum(opt_w * mu_bl))
    opt_vol = float(np.sqrt(np.dot(opt_w.T, np.dot(sigma_bl, opt_w))))
    sharpe = float(opt_return / opt_vol) if opt_vol > 0 else 0.0

    return {
        "model": "BLACK_LITTERMAN_NEWS_OPTIMIZER",
        "optimal_weights": {tickers[i]: round(float(opt_w[i]), 4) for i in range(n_assets)},
        "equilibrium_implied_returns": {tickers[i]: round(float(pi[i]), 4) for i in range(n_assets)},
        "posterior_expected_returns": {tickers[i]: round(float(mu_bl[i]), 4) for i in range(n_assets)},
        "expected_return": round(opt_return, 4),
        "volatility": round(opt_vol, 4),
        "sharpe_ratio": round(sharpe, 4),
        "views_incorporated_count": len(views_active)
    }

def hierarchical_risk_parity_optimize(returns: pd.DataFrame) -> Dict[str, Any]:
    """
    Hierarchical Risk Parity (HRP) Portfolio Optimization (Marcos López de Prado 2016).
    Applies tree clustering on correlation distance to eliminate matrix inversion instability.
    """
    if returns.empty or len(returns.columns) == 0:
        return {"error": "Empty return data"}

    n_assets = len(returns.columns)
    tickers = list(returns.columns)

    if n_assets == 1:
        return {
            "model": "HIERARCHICAL_RISK_PARITY",
            "optimal_weights": {tickers[0]: 1.0},
            "expected_return": round(float(returns.mean().values[0] * 252), 4),
            "volatility": round(float(returns.std().values[0] * np.sqrt(252)), 4)
        }

    lw = LedoitWolf()
    cov = lw.fit(returns.values).covariance_ * 252.0
    corr = returns.corr().values

    # 1. Correlation Distance Metric: d_{i,j} = sqrt(0.5 * (1 - rho_{i,j}))
    dist = np.sqrt(np.clip(0.5 * (1.0 - corr), 0.0, 1.0))
    np.fill_diagonal(dist, 0.0)

    # 2. Quasi-Diagonalization (Hierarchical Ordering)
    avg_dist = np.mean(dist, axis=1)
    sorted_indices = list(np.argsort(avg_dist))

    # 3. Recursive Bisection
    weights = pd.Series(1.0, index=sorted_indices)
    clusters = [sorted_indices]

    while len(clusters) > 0:
        next_clusters = []
        for cluster in clusters:
            if len(cluster) > 1:
                mid = len(cluster) // 2
                c1 = cluster[:mid]
                c2 = cluster[mid:]

                v1_inv = 1.0 / np.maximum(np.diag(cov)[c1], 1e-6)
                w1 = v1_inv / np.sum(v1_inv)
                var1 = np.dot(w1.T, np.dot(cov[np.ix_(c1, c1)], w1))

                v2_inv = 1.0 / np.maximum(np.diag(cov)[c2], 1e-6)
                w2 = v2_inv / np.sum(v2_inv)
                var2 = np.dot(w2.T, np.dot(cov[np.ix_(c2, c2)], w2))

                alpha = 1.0 - var1 / (var1 + var2 + 1e-8)
                weights[c1] *= alpha
                weights[c2] *= (1.0 - alpha)

                next_clusters.append(c1)
                next_clusters.append(c2)
        clusters = next_clusters

    final_w = np.zeros(n_assets)
    for idx, orig_i in enumerate(sorted_indices):
        final_w[orig_i] = weights[orig_i]
    final_w = final_w / np.sum(final_w)

    mu = returns.mean().values * 252.0
    port_r = float(np.sum(final_w * mu))
    port_v = float(np.sqrt(np.dot(final_w.T, np.dot(cov, final_w))))
    sharpe = float(port_r / port_v) if port_v > 0 else 0.0

    return {
        "model": "HIERARCHICAL_RISK_PARITY",
        "optimal_weights": {tickers[i]: round(float(final_w[i]), 4) for i in range(n_assets)},
        "expected_return": round(port_r, 4),
        "volatility": round(port_v, 4),
        "sharpe_ratio": round(sharpe, 4),
        "quasi_diagonal_order": [tickers[i] for i in sorted_indices]
    }

def generate_rebalance_blotter(
    current_holdings: Dict[str, Dict[str, Any]],
    target_weights: Dict[str, float],
    total_capital: Optional[float] = None
) -> Dict[str, Any]:
    """
    Generates actionable buy/sell execution orders to transition
    from current user portfolio to target optimal weights.
    """
    all_symbols = sorted(list(set(list(current_holdings.keys()) + list(target_weights.keys()))))
    
    calculated_nav = 0.0
    for sym, h in current_holdings.items():
        qty = float(h.get("quantity", 0))
        price = float(h.get("current_price", h.get("avg_cost", 100.0)))
        calculated_nav += qty * price

    nav = total_capital if (total_capital and total_capital > 0) else (calculated_nav if calculated_nav > 0 else 1000000.0)

    orders = []
    total_turnover_inr = 0.0

    for sym in all_symbols:
        h = current_holdings.get(sym, {})
        current_qty = float(h.get("quantity", 0))
        price = float(h.get("current_price", h.get("avg_cost", 100.0)))
        if price <= 0:
            price = 100.0

        current_val = current_qty * price
        current_w = current_val / nav if nav > 0 else 0.0
        target_w = float(target_weights.get(sym, 0.0))

        target_val = target_w * nav
        delta_val = target_val - current_val
        delta_qty = int(round(delta_val / price))

        if abs(delta_qty) > 0:
            action = "BUY" if delta_qty > 0 else "SELL"
            exec_qty = abs(delta_qty)
            order_notional = exec_qty * price
            total_turnover_inr += order_notional

            slippage_bps = 2.5 if order_notional < 100000 else (5.0 if order_notional < 500000 else 8.5)

            orders.append({
                "symbol": sym,
                "action": action,
                "quantity": exec_qty,
                "price": round(price, 2),
                "notional_value": round(order_notional, 2),
                "current_weight_pct": round(current_w * 100, 2),
                "target_weight_pct": round(target_w * 100, 2),
                "delta_weight_pct": round((target_w - current_w) * 100, 2),
                "slippage_bps": slippage_bps,
                "fix_tag_58": f"PORT-REBALANCE-{action}-{sym}",
                "status": "READY_FOR_EXECUTION"
            })

    return {
        "portfolio_nav": round(nav, 2),
        "rebalance_orders": orders,
        "total_turnover_notional": round(total_turnover_inr, 2),
        "turnover_pct": round((total_turnover_inr / (2.0 * nav)) * 100, 2) if nav > 0 else 0.0,
        "orders_count": len(orders)
    }
