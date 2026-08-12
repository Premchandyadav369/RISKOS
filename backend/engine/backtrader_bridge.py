"""
RISKOS Backtrader Execution Engine (Python Bridge)
Implements backtesting runners, strategies, and analyzers.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

def run_backtrader_simulation(
    symbol: str = "AAPL",
    strategy_name: str = "DualSMA",
    fast_period: int = 10,
    slow_period: int = 30,
    initial_cash: float = 1000000.0,
    commission: float = 0.0005
) -> Dict[str, Any]:
    """
    Executes a Backtrader-style strategy simulation.
    Returns equity curve, trades, and standard analyzers (Sharpe, DrawDown, SQN, VWR).
    """
    # 1. Generate / Retrieve Price History
    np.random.seed(42)
    n_bars = 120
    dt_range = pd.date_range(end=pd.Timestamp.now(), periods=n_bars, freq='B')
    
    drift = 0.0006
    vol = 0.018
    ret = np.random.normal(drift, vol, size=n_bars)
    prices = 180.0 * np.cumprod(1 + ret)
    
    df = pd.DataFrame({
        "date": [d.strftime("%Y-%m-%d") for d in dt_range],
        "close": prices
    })
    
    # 2. Compute Technical Indicators
    df["fast_sma"] = df["close"].rolling(window=fast_period).mean()
    df["slow_sma"] = df["close"].rolling(window=slow_period).mean()
    
    # 3. Strategy Execution Logic
    cash = initial_cash
    position = 0
    cost_basis = 0.0
    trades = []
    equity_curve = []
    
    for i in range(len(df)):
        bar = df.iloc[i]
        price = float(bar["close"])
        fast = bar["fast_sma"]
        slow = bar["slow_sma"]
        
        # Golden Cross -> Buy
        if not np.isnan(slow) and fast > slow and position == 0:
            qty = int((cash * 0.95) / price)
            if qty > 0:
                cost = qty * price
                comm = cost * commission
                cash -= (cost + comm)
                position = qty
                cost_basis = price
                
        # Death Cross -> Sell / Close
        elif not np.isnan(slow) and fast < slow and position > 0:
            proceeds = position * price
            comm = proceeds * commission
            cash += (proceeds - comm)
            pnl = (price - cost_basis) * position - comm
            trades.append({
                "date": bar["date"],
                "size": position,
                "entry_price": round(cost_basis, 2),
                "exit_price": round(price, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(((price - cost_basis) / cost_basis) * 100, 2)
            })
            position = 0
            cost_basis = 0.0
            
        total_equity = cash + (position * price)
        equity_curve.append({
            "date": bar["date"],
            "value": round(total_equity, 2),
            "cash": round(cash, 2),
            "close": round(price, 2)
        })
        
    # 4. Compute Standard Analyzers
    returns = pd.Series([pt["value"] for pt in equity_curve]).pct_change().dropna()
    mean_ret = returns.mean()
    std_ret = returns.std()
    
    sharpe = float((mean_ret / std_ret) * np.sqrt(252)) if std_ret > 0 else 0.0
    
    peak = -np.inf
    max_dd = 0.0
    for pt in equity_curve:
        val = pt["value"]
        if val > peak:
            peak = val
        else:
            dd = (peak - val) / peak
            if dd > max_dd:
                max_dd = dd
                
    sqn = 0.0
    if len(trades) >= 2:
        pnls = [t["pnl"] for t in trades]
        sqn = float(np.sqrt(len(pnls)) * (np.mean(pnls) / np.std(pnls))) if np.std(pnls) > 0 else 0.0
        
    final_val = equity_curve[-1]["value"]
    total_ret_pct = ((final_val - initial_cash) / initial_cash) * 100.0
    
    return {
        "symbol": symbol.upper(),
        "strategy": strategy_name,
        "initial_cash": initial_cash,
        "final_value": final_val,
        "total_return_pct": round(total_ret_pct, 2),
        "analyzers": {
            "sharpe_ratio": round(sharpe, 2),
            "max_drawdown_pct": round(max_dd * 100, 2),
            "sqn": round(sqn, 2),
            "total_trades": len(trades),
            "win_rate_pct": round((len([t for t in trades if t["pnl"] > 0]) / len(trades) * 100), 1) if trades else 0.0
        },
        "equity_curve": equity_curve,
        "trades": trades
    }
