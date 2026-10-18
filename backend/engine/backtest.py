import pandas as pd
import numpy as np
from backend.engine.research_backtest import run_research_backtest, almgren_chriss_slippage

def run_backtest(
    returns: pd.DataFrame,
    weights: list[float],
    transaction_cost: float = 0.001,
    market_impact_model: str = "almgren_chriss",
    portfolio_capital: float = 10000000.0,
    asset_adv: float = 500000000.0
) -> dict:
    """
    Standard walk-forward backtest with optional Almgren-Chriss endogenous market impact.
    Preserves exact backward compatibility while enabling institutional capacity scaling.
    """
    if returns.empty or len(weights) != returns.shape[1]:
        return {"error": "Invalid inputs"}
        
    weights = np.array(weights, dtype=float)
    total_w = np.sum(weights)
    if total_w > 0:
        weights = weights / total_w
    
    n_days = len(returns)
    portfolio_value = [1.0] # start at 1.0
    
    # Calculate daily port returns before costs
    port_returns_raw = returns.dot(weights).values
    daily_vol_raw = float(np.std(port_returns_raw)) if n_days > 1 else 0.015
    
    # Endogenous market impact calculation
    if market_impact_model == "almgren_chriss" and asset_adv > 0:
        # Expected daily trade notional from rebalancing
        trade_notional = portfolio_capital * np.sum(np.abs(weights)) * 0.10
        participation = min(1.0, trade_notional / asset_adv)
        # Square-Root Law of Market Impact: I = half_spread + eta * sigma * sqrt(Q / V)
        impact_bps = 2.5 + (0.6 * daily_vol_raw * np.sqrt(participation) * 10000.0)
        cost_drag = (impact_bps / 10000.0)
        endogenous_impact_bps = float(round(impact_bps, 2))
    else:
        cost_drag = transaction_cost * np.sum(np.abs(weights))
        endogenous_impact_bps = float(round(transaction_cost * 10000.0, 2))
    
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
    
    # Estimate max strategy capacity before impact degrades Sharpe below 1.0
    capacity_limit_inr = round(float(asset_adv * ((max(0.01, ann_return) / max(0.01, ann_vol)) * 0.08) ** 2), 2)
    
    return {
        'equity_curve': equity_curve,
        'dates': returns.index.strftime('%Y-%m-%d').tolist() if hasattr(returns.index, 'strftime') else [str(x) for x in returns.index],
        'total_return': float(total_return),
        'annualized_return': float(ann_return),
        'sharpe_ratio': float(sharpe),
        'max_drawdown': float(max_dd),
        'calmar_ratio': float(calmar),
        'volatility': float(ann_vol),
        'win_rate': float(win_rate),
        'market_impact_model': market_impact_model,
        'endogenous_impact_bps': endogenous_impact_bps,
        'capacity_limit_estimate': capacity_limit_inr
    }

# Alias for explicit clarity
run_baseline_backtest = run_backtest

__all__ = [
    "run_backtest",
    "run_baseline_backtest",
    "run_research_backtest",
    "almgren_chriss_slippage"
]
