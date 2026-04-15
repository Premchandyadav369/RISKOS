import pandas as pd
import numpy as np

def run_backtest(returns: pd.DataFrame, weights: list[float], transaction_cost: float = 0.001) -> dict:
    if returns.empty or len(weights) != returns.shape[1]:
        return {"error": "Invalid inputs"}
        
    weights = np.array(weights)
    weights = weights / np.sum(weights)
    
    # Simulate daily rebalancing for simplicity
    n_days = len(returns)
    portfolio_value = [1.0] # start at 1.0
    
    # Calculate daily port returns before costs
    port_returns_raw = returns.dot(weights).values
    
    # Apply transaction cost approximations
    # Assuming full rebalance each day (conservative)
    cost_drag = transaction_cost * np.sum(np.abs(weights)) 
    
    port_returns = port_returns_raw - cost_drag / 252 # amortize cost
    
    for i in range(n_days):
        portfolio_value.append(portfolio_value[-1] * (1 + port_returns[i]))
        
    equity_curve = portfolio_value[1:]
    
    total_return = equity_curve[-1] - 1
    ann_return = (1 + total_return) ** (252 / n_days) - 1
    
    daily_vol = np.std(port_returns)
    ann_vol = daily_vol * np.sqrt(252)
    
    sharpe = ann_return / ann_vol if ann_vol > 0 else 0
    
    # Max drawdown
    peak = equity_curve[0]
    max_dd = 0
    for val in equity_curve:
        if val > peak:
            peak = val
        dd = (peak - val) / peak
        if dd > max_dd:
            max_dd = dd
            
    calmar = ann_return / max_dd if max_dd > 0 else 0
    
    win_rate = np.sum(port_returns > 0) / n_days
    
    return {
        'equity_curve': equity_curve,
        'dates': returns.index.strftime('%Y-%m-%d').tolist(),
        'total_return': float(total_return),
        'annualized_return': float(ann_return),
        'sharpe_ratio': float(sharpe),
        'max_drawdown': float(max_dd),
        'calmar_ratio': float(calmar),
        'volatility': float(ann_vol),
        'win_rate': float(win_rate)
    }
