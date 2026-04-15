import pandas as pd
import numpy as np
from arch import arch_model

def ewma_volatility(returns: pd.Series, lam: float = 0.94) -> pd.Series:
    var = returns.ewm(alpha=(1 - lam)).var()
    vol = np.sqrt(var) * np.sqrt(252) # annualized
    return vol

def _clean_floats(arr, default_val=0.20):
    res = []
    for x in arr:
        if x is None or np.isnan(x) or np.isinf(x):
            res.append(float(default_val))
        else:
            res.append(float(x))
    return res

def garch_volatility(returns: pd.Series) -> dict:
    returns_clean = returns.dropna()
    if len(returns_clean) == 0:
        return {'error': 'No return data available'}
    
    ewma_vol = _clean_floats(ewma_volatility(returns_clean).tolist())
    dates = returns_clean.index.strftime('%Y-%m-%d').tolist() if hasattr(returns_clean.index, 'strftime') else []
    returns_scaled = returns_clean * 100
    try:
        am = arch_model(returns_scaled, vol='Garch', p=1, q=1, rescale=False)
        res = am.fit(disp='off')
        
        omega = res.params.get('omega', 0) / 10000
        alpha = res.params.get('alpha[1]', 0)
        beta = res.params.get('beta[1]', 0)
        
        cond_vol = _clean_floats((res.conditional_volatility / 100).tolist())
        ann_vol = _clean_floats((np.array(cond_vol) * np.sqrt(252)).tolist())
        
        return {
            'dates': dates,
            'ewma': ewma_vol,
            'garch': ann_vol,
            'omega': float(omega) if (omega is not None and not np.isnan(omega)) else None,
            'alpha': float(alpha) if (alpha is not None and not np.isnan(alpha)) else None,
            'beta': float(beta) if (beta is not None and not np.isnan(beta)) else None,
            'conditional_vol': cond_vol,
            'annualized_vol': ann_vol,
            'current_vol': ann_vol[-1] if len(ann_vol) > 0 else 0.20
        }
    except Exception as e:
        return {
            'dates': dates,
            'ewma': ewma_vol,
            'garch': ewma_vol,
            'omega': None,
            'alpha': None,
            'beta': None,
            'conditional_vol': [v / np.sqrt(252) for v in ewma_vol],
            'annualized_vol': ewma_vol,
            'current_vol': ewma_vol[-1] if len(ewma_vol) > 0 else 0.20
        }
