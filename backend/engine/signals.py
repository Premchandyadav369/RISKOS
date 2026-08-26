import pandas as pd
from .market import get_returns, get_prices
from .regime import detect_regime

def generate_signals(tickers: list[str], period: str = '1y') -> dict:
    returns = get_returns(tickers, period)
    prices = get_prices(tickers, period)
    
    signals = []
    
    for ticker in tickers:
        if ticker not in returns.columns or ticker not in prices:
            continue
            
        ret_series = returns[ticker]
        close_prices = pd.Series(prices[ticker]['close'])
        
        regime_data = detect_regime(ret_series)
        regime = regime_data.get('current_state', 'Sideways')
        
        ma20 = close_prices.rolling(20).mean().iloc[-1]
        ma50 = close_prices.rolling(50).mean().iloc[-1]
        current_price = close_prices.iloc[-1]
        
        # Simple RSI
        delta = close_prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs)).iloc[-1]
        
        if regime == 'Bull':
            strategy = 'Momentum'
            if ma20 > ma50:
                direction = 'BUY'
                conf = 0.8
                rationale = "Bull regime with MA20 > MA50"
            else:
                direction = 'HOLD'
                conf = 0.5
                rationale = "Bull regime but MA20 <= MA50"
        elif regime == 'Bear':
            strategy = 'Defensive'
            direction = 'SELL'
            conf = 0.9
            rationale = "Bear regime detected"
        else:
            strategy = 'Mean-Reversion'
            if rsi < 30:
                direction = 'BUY'
                conf = 0.7
                rationale = "Sideways regime, oversold (RSI < 30)"
            elif rsi > 70:
                direction = 'SELL'
                conf = 0.7
                rationale = "Sideways regime, overbought (RSI > 70)"
            else:
                direction = 'HOLD'
                conf = 0.5
                rationale = f"Sideways regime, neutral RSI ({rsi:.1f})"
                
        signals.append({
            'ticker': ticker,
            'regime': regime,
            'strategy': strategy,
            'direction': direction,
            'confidence': conf,
            'rationale': rationale
        })
        
    return {'signals': signals}
