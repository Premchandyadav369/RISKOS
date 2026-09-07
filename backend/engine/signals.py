import numpy as np
import pandas as pd
from .market import get_returns, get_prices
from .regime import detect_regime

def calculate_momentum_metrics(close_series: pd.Series, high_series: pd.Series = None, low_series: pd.Series = None) -> dict:
    """Calculates institutional multi-horizon Time-Series Momentum (TSMOM),
    volatility scaling, Donchian breakout channels, and Chandelier trailing exits."""
    if len(close_series) < 20:
        return {
            'tsmom_score': 0.0,
            'tsmom_direction': 'NEUTRAL',
            'vol_scale_factor': 1.0,
            'annualized_vol': 0.20,
            'donchian_breakout': 'RANGEBOUND',
            'chandelier_stop': round(float(close_series.iloc[-1]) * 0.95, 2) if len(close_series) else 0.0,
            'adx_strength': 'MODERATE'
        }

    curr_p = float(close_series.iloc[-1])
    n = len(close_series)

    # Multi-horizon returns (1M, 3M, 6M, 12M lookbacks)
    horizons = [21, 63, 126, 252]
    signs = []
    roc_pcts = {}
    for h in horizons:
        if n > h:
            ret = (curr_p - float(close_series.iloc[-h])) / float(close_series.iloc[-h])
            signs.append(np.sign(ret))
            roc_pcts[f'roc_{h}d'] = round(ret * 100, 2)
        else:
            ret = (curr_p - float(close_series.iloc[0])) / float(close_series.iloc[0])
            signs.append(np.sign(ret))
            roc_pcts[f'roc_{h}d'] = round(ret * 100, 2)

    tsmom_score = float(np.mean(signs))
    tsmom_dir = 'BULLISH_MOMENTUM' if tsmom_score >= 0.5 else ('BEARISH_MOMENTUM' if tsmom_score <= -0.5 else 'NEUTRAL')

    # Trailing 60-day volatility and risk-parity scaling factor (target vol = 15%)
    daily_rets = close_series.pct_change().dropna()
    lookback_rets = daily_rets.iloc[-60:] if len(daily_rets) >= 60 else daily_rets
    ann_vol = float(lookback_rets.std() * np.sqrt(252)) if len(lookback_rets) > 5 else 0.20
    if np.isnan(ann_vol) or ann_vol <= 0:
        ann_vol = 0.20
    target_vol = 0.15
    vol_scale = float(np.clip(target_vol / ann_vol, 0.25, 2.0))

    # Donchian 20-day channel
    d_high = float(close_series.iloc[-21:-1].max()) if n >= 22 else float(close_series.max())
    d_low = float(close_series.iloc[-21:-1].min()) if n >= 22 else float(close_series.min())

    if curr_p >= d_high:
        breakout = 'BREAKOUT_HIGH'
    elif curr_p <= d_low:
        breakout = 'BREAKOUT_LOW'
    else:
        breakout = 'RANGEBOUND'

    # ATR proxy & Chandelier exit
    if high_series is not None and low_series is not None and len(high_series) >= 20:
        tr = np.maximum(high_series - low_series, np.abs(high_series - close_series.shift(1)))
        atr = float(tr.rolling(20).mean().iloc[-1])
    else:
        atr = float(curr_p * (ann_vol / np.sqrt(252)) * 1.5)
    
    chandelier_stop = round(max(0.01, d_high - (3.0 * atr)), 2)

    # Trend strength
    ma20 = float(close_series.rolling(20).mean().iloc[-1])
    ma50 = float(close_series.rolling(50).mean().iloc[-1]) if n >= 50 else ma20
    adx_strength = 'STRONG_TREND' if abs(curr_p - ma50) / ma50 > 0.05 else 'MODERATE'

    return {
        'tsmom_score': round(tsmom_score, 2),
        'tsmom_direction': tsmom_dir,
        'vol_scale_factor': round(vol_scale, 2),
        'annualized_vol': round(ann_vol * 100, 2),
        'donchian_breakout': breakout,
        'chandelier_stop': chandelier_stop,
        'adx_strength': adx_strength,
        **roc_pcts
    }

def generate_signals(tickers: list[str], period: str = '1y') -> dict:
    returns = get_returns(tickers, period)
    prices = get_prices(tickers, period)
    
    signals = []
    
    for ticker in tickers:
        if ticker not in returns.columns or ticker not in prices:
            continue
            
        ret_series = returns[ticker]
        close_prices = pd.Series(prices[ticker]['close'])
        high_prices = pd.Series(prices[ticker]['high']) if 'high' in prices[ticker] else None
        low_prices = pd.Series(prices[ticker]['low']) if 'low' in prices[ticker] else None
        
        regime_data = detect_regime(ret_series)
        regime = regime_data.get('current_state', 'Sideways')
        
        ma20 = close_prices.rolling(20).mean().iloc[-1]
        ma50 = close_prices.rolling(50).mean().iloc[-1]
        current_price = close_prices.iloc[-1]
        
        # Momentum quantitative metrics
        mom_metrics = calculate_momentum_metrics(close_prices, high_prices, low_prices)
        
        # Simple RSI
        delta = close_prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs)).iloc[-1]
        
        if regime == 'Bull':
            strategy = 'Momentum (TSMOM)'
            if ma20 > ma50 or mom_metrics['tsmom_score'] > 0:
                direction = 'BUY'
                conf = min(0.95, round(0.70 + (mom_metrics['tsmom_score'] * 0.2), 2))
                rationale = f"Bull regime with TSMOM ({mom_metrics['tsmom_score']:+.2f}), MA20 > MA50"
            else:
                direction = 'HOLD'
                conf = 0.55
                rationale = f"Bull regime consolidating, TSMOM neutral ({mom_metrics['tsmom_score']:+.2f})"
        elif regime == 'Bear':
            strategy = 'Defensive'
            if mom_metrics['donchian_breakout'] == 'BREAKOUT_LOW':
                direction = 'SELL'
                conf = 0.92
                rationale = "Bear regime with 20D Donchian Breakdown"
            else:
                direction = 'SELL'
                conf = 0.85
                rationale = "Bear regime detected, risk preservation active"
        else:
            # Sideways Regime: Check for TSMOM Breakout or Mean-Reversion
            if mom_metrics['donchian_breakout'] == 'BREAKOUT_HIGH' and rsi < 70:
                strategy = 'Breakout Momentum'
                direction = 'BUY'
                conf = 0.82
                rationale = "Sideways regime: Donchian 20D High breakout detected"
            elif rsi < 30:
                strategy = 'Mean-Reversion'
                direction = 'BUY'
                conf = 0.70
                rationale = f"Sideways regime, oversold (RSI={rsi:.1f})"
            elif rsi > 70:
                strategy = 'Mean-Reversion'
                direction = 'SELL'
                conf = 0.75
                rationale = f"Sideways regime, overbought (RSI={rsi:.1f})"
            else:
                strategy = 'Mean-Reversion'
                direction = 'HOLD'
                conf = 0.50
                rationale = f"Sideways regime, neutral RSI ({rsi:.1f})"
                
        signals.append({
            'ticker': ticker,
            'regime': regime,
            'strategy': strategy,
            'direction': direction,
            'confidence': conf,
            'rationale': rationale,
            'momentum': mom_metrics
        })
        
    return {'signals': signals}

