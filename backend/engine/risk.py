import numpy as np
import pandas as pd
from scipy.stats import norm
from .covariance import ledoit_wolf_shrinkage

def calculate_var(returns: pd.DataFrame, weights: list[float], confidence: float = 0.99, n_sims: int = 10000) -> dict:
    if returns.empty or len(weights) != returns.shape[1]:
        return {"error": "Invalid inputs"}
        
    weights = np.array(weights)
    weights = weights / np.sum(weights) # Normalize just in case
    
    port_returns = returns.dot(weights)
    
    mu = np.mean(port_returns)
    sigma = np.std(port_returns)
    
    # Historical VaR and CVaR
    hist_var = np.percentile(port_returns, (1 - confidence) * 100)
    hist_cvar = port_returns[port_returns <= hist_var].mean()
    
    # Parametric VaR and CVaR
    z = norm.ppf(1 - confidence)
    param_var = mu + z * sigma
    param_cvar = mu - sigma * (norm.pdf(z) / (1 - confidence))
    
    # Monte Carlo VaR and CVaR using Ledoit-Wolf
    lw_result = ledoit_wolf_shrinkage(returns)
    cov_matrix = np.array(lw_result['covariance_matrix'])
    mu_assets = returns.mean().values
    
    sim_returns = np.random.multivariate_normal(mu_assets, cov_matrix, n_sims)
    sim_port_returns = sim_returns.dot(weights)
    
    mc_var = np.percentile(sim_port_returns, (1 - confidence) * 100)
    mc_cvar = sim_port_returns[sim_port_returns <= mc_var].mean()
    
    return {
        'portfolio_return_mean': float(mu),
        'portfolio_return_std': float(sigma),
        'historical_var': float(hist_var),
        'parametric_var': float(param_var),
        'monte_carlo_var': float(mc_var),
        'historical_cvar': float(hist_cvar),
        'parametric_cvar': float(param_cvar),
        'monte_carlo_cvar': float(mc_cvar),
        'simulated_returns': sim_port_returns[:100].tolist() # Limit output
    }
