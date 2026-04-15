import pandas as pd
import numpy as np
from arch import arch_model

def ewma_volatility(returns: pd.Series, lam: float = 0.94) -> pd.Series:
    var = returns.ewm(alpha=(1 - lam)).var()
    vol = np.sqrt(var) * np.sqrt(252) # annualized
    return vol

def garch_volatility(returns: pd.Series) -> dict:
    returns_clean = returns.dropna()
    ewma_vol = ewma_volatility(returns_clean).tolist()
    dates = returns_clean.index.strftime('%Y-%m-%d').tolist() if hasattr(returns_clean.index, 'strftime') else []
    returns_scaled = returns_clean * 100
    try:
        am = arch_model(returns_scaled, vol='Garch', p=1, q=1, rescale=False)
        res = am.fit(disp='off')
        
        omega = res.params.get('omega', 0) / 10000
        alpha = res.params.get('alpha[1]', 0)
        beta = res.params.get('beta[1]', 0)
        
        cond_vol = (res.conditional_volatility / 100).tolist()
        ann_vol = (np.array(cond_vol) * np.sqrt(252)).tolist()
        
        return {
            'dates': dates,
            'ewma': ewma_vol,
            'garch': ann_vol,
            'omega': float(omega) if omega is not None else None,
            'alpha': float(alpha) if alpha is not None else None,
            'beta': float(beta) if beta is not None else None,
            'conditional_vol': cond_vol,
            'annualized_vol': ann_vol,
            'current_vol': ann_vol[-1] if len(ann_vol) > 0 else 0
        }
    except Exception as e:
        print(f"GARCH fallback: {e}")
        return {
            'dates': dates,
            'ewma': ewma_vol,
            'garch': ewma_vol,
            'omega': None,
            'alpha': None,
            'beta': None,
            'conditional_vol': [v / np.sqrt(252) for v in ewma_vol],
            'annualized_vol': ewma_vol,
            'current_vol': ewma_vol[-1] if len(ewma_vol) > 0 else 0
        }
