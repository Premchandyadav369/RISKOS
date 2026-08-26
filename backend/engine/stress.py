import pandas as pd
import numpy as np

def stress_test(returns: pd.DataFrame, weights: list[float]) -> dict:
    if returns.empty:
        return {"error": "Invalid inputs"}
        
    capital = 10_000_000 # 10M INR
    weights = np.array(weights)
    
    scenarios = []
    
    # 1. Rates Shock: equities -10% (assuming all are equities for this example)
    impact_pct = -0.10
    scenarios.append({
        'name': 'Rates Shock (+300bps)',
        'description': 'Interest rates spike by 300bps. Bonds drop 15%, Equities drop 10%.',
        'portfolio_impact_pct': impact_pct,
        'portfolio_impact_abs': impact_pct * capital
    })
    
    # 2. Equity Crash: equities -40%
    impact_pct = -0.40
    scenarios.append({
        'name': 'Equity Crash',
        'description': 'Global equity markets crash by 40%.',
        'portfolio_impact_pct': impact_pct,
        'portfolio_impact_abs': impact_pct * capital
    })
    
    # 3. Vol Spike: triple current vol. Impact estimated via options or var. 
    # Simplify: approximate a 3 sigma event.
    port_std = np.std(returns.dot(weights))
    impact_pct = - (port_std * 3 * 3) # 3x vol, 3 sigma move
    scenarios.append({
        'name': 'Volatility Spike',
        'description': 'Market volatility triples.',
        'portfolio_impact_pct': impact_pct,
        'portfolio_impact_abs': impact_pct * capital
    })
    
    # 4. Credit Contagion: correlations go to 0.9, vol spikes.
    # New port variance = w^T * Cov * w where all off-diags are 0.9 * std1 * std2
    stds = returns.std().values
    n = len(stds)
    cov = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i == j:
                cov[i,j] = stds[i]**2
            else:
                cov[i,j] = 0.9 * stds[i] * stds[j]
                
    new_var = weights.T.dot(cov).dot(weights)
    new_std = np.sqrt(new_var)
    impact_pct = - (new_std * 3) # 3 sigma event with extreme correlation
    scenarios.append({
        'name': 'Credit Contagion',
        'description': 'Correlations jump to 0.9, widespread defaults.',
        'portfolio_impact_pct': impact_pct,
        'portfolio_impact_abs': impact_pct * capital
    })
    
    return {'scenarios': scenarios}
