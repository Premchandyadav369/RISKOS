"""
RISKOS Barra-Style Multi-Factor Risk Decomposition & Attribution Engine
Language: Python 3.11+
"""

import numpy as np
import pandas as pd
from scipy import stats

def decompose_factor_risk(
    returns: pd.DataFrame,
    weights: list[float],
    factor_returns: pd.DataFrame = None
) -> dict:
    """
    Decomposes total portfolio variance into Systematic Factor Risk and Specific/Idiosyncratic Risk.
    sigma_p^2 = w^T (X * F * X^T + Delta) w
    """
    clean_rets = returns.dropna()
    if clean_rets.empty:
        return {"error": "Empty returns dataframe"}
    
    n_assets = len(clean_rets.columns)
    w = np.array(weights, dtype=float)
    if len(w) != n_assets:
        w = np.ones(n_assets) / n_assets
    else:
        w = w / np.sum(w)
        
    # If factor returns not provided, synthesize 3 canonical PCA / style factors
    if factor_returns is None or factor_returns.empty:
        # Construct synthetic Market, Momentum, and LowVol factors
        market_factor = clean_rets.mean(axis=1)
        momentum_factor = clean_rets.iloc[:, 0] - clean_rets.iloc[:, -1]
        low_vol_factor = clean_rets.std().sort_values().index[0]
        
        factor_df = pd.DataFrame({
            'Market': market_factor,
            'Momentum': momentum_factor,
            'LowVol': clean_rets[low_vol_factor]
        })
    else:
        factor_df = factor_returns.copy()
        
    n_factors = len(factor_df.columns)
    
    # Estimate Factor Loadings (X) via linear regression for each asset
    X = np.zeros((n_assets, n_factors))
    residuals = np.zeros((len(clean_rets), n_assets))
    
    for i, col in enumerate(clean_rets.columns):
        y = clean_rets[col].values
        # Ordinary Least Squares
        f_vals = np.column_stack([np.ones(len(factor_df)), factor_df.values])
        beta, _, _, _ = np.linalg.lstsq(f_vals, y, rcond=None)
        X[i, :] = beta[1:]
        residuals[:, i] = y - f_vals @ beta

    # Factor Covariance F (annualized)
    F = factor_df.cov().values * 252.0
    
    # Specific Variance Diagonal Delta (annualized)
    delta_diag = np.var(residuals, axis=0) * 252.0
    Delta = np.diag(delta_diag)
    
    # Portfolio Exposures: beta_p = X^T @ w
    beta_p = X.T @ w
    
    # Systematic / Factor Variance: beta_p^T @ F @ beta_p
    factor_variance = float(beta_p.T @ F @ beta_p)
    
    # Specific / Idiosyncratic Variance: w^T @ Delta @ w
    specific_variance = float(w.T @ Delta @ w)
    
    total_variance = factor_variance + specific_variance
    total_vol = np.sqrt(max(1e-12, total_variance))
    factor_vol = np.sqrt(max(1e-12, factor_variance))
    specific_vol = np.sqrt(max(1e-12, specific_variance))
    
    factor_contributions = {}
    for k_idx, factor_name in enumerate(factor_df.columns):
        f_beta_k = np.dot(F[k_idx, :], beta_p)
        var_contrib = beta_p[k_idx] * f_beta_k
        pct_contrib = (var_contrib / max(1e-12, total_variance)) * 100.0
        factor_contributions[factor_name] = {
            'exposure': round(float(beta_p[k_idx]), 4),
            'variance_contribution': round(float(var_contrib), 6),
            'pct_risk': round(float(pct_contrib), 2)
        }
        
    return {
        'total_annualized_vol': round(float(total_vol), 4),
        'factor_annualized_vol': round(float(factor_vol), 4),
        'specific_annualized_vol': round(float(specific_vol), 4),
        'systematic_risk_ratio': round(float(factor_variance / total_variance), 4),
        'idiosyncratic_risk_ratio': round(float(specific_variance / total_variance), 4),
        'factor_contributions': factor_contributions,
        'tickers': clean_rets.columns.tolist()
    }

def deflated_sharpe_ratio(
    observed_sr: float,
    num_trials: int,
    track_record_days: int,
    skewness: float = 0.0,
    kurtosis: float = 3.0,
    benchmark_sr: float = 0.0
) -> dict:
    """
    Bailey & Lopez de Prado (2014) Deflated Sharpe Ratio calculation
    """
    T = track_record_days
    if T <= 2:
        return {'dsr': 0.5, 'p_value': 0.5, 'is_significant': False}
        
    gamma_euler = 0.5772156649
    log_n = np.log(max(1, num_trials))
    expected_max_sr = benchmark_sr + (np.sqrt(2 * log_n) + (gamma_euler / np.sqrt(2 * log_n))) * (1.0 / np.sqrt(252.0))
    
    var_sr = (1.0 - skewness * observed_sr + ((kurtosis - 1.0) / 4.0) * (observed_sr ** 2)) / (T - 1)
    se_sr = np.sqrt(max(1e-12, var_sr))
    
    z = (observed_sr - expected_max_sr) / se_sr
    dsr = float(stats.norm.cdf(z))
    
    return {
        'observed_sr': round(float(observed_sr), 4),
        'expected_max_sr': round(float(expected_max_sr), 4),
        'deflated_sharpe_ratio': round(dsr, 4),
        'p_value': round(1.0 - dsr, 4),
        'is_significant': bool(dsr >= 0.95)
    }
