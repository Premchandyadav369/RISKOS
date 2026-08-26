import pandas as pd
import numpy as np
from scipy.stats import chi2

def kupiec_test(returns: pd.Series, var_series: pd.Series, confidence: float = 0.99) -> dict:
    if len(returns) != len(var_series) or len(returns) == 0:
        return {"error": "Invalid inputs"}
        
    p = 1 - confidence
    n = len(returns)
    
    # Exceptions: return < VaR (assuming VaR is negative number)
    exceptions = np.sum(returns < var_series)
    x = exceptions
    
    expected_exceptions = n * p
    
    if x == 0:
        return {
            'test_stat': 0.0,
            'p_value': 1.0,
            'n_exceptions': 0,
            'expected_exceptions': expected_exceptions,
            'pass': True
        }
        
    # Likelihood ratio test statistic
    term1 = -2 * np.log(((1 - p)**(n - x)) * (p**x))
    term2 = 2 * np.log(((1 - x/n)**(n - x)) * ((x/n)**x))
    lr_stat = term1 + term2
    
    p_value = 1 - chi2.cdf(lr_stat, df=1)
    
    return {
        'test_stat': float(lr_stat),
        'p_value': float(p_value),
        'n_exceptions': int(x),
        'expected_exceptions': float(expected_exceptions),
        'pass': bool(p_value > 0.05)
    }

def christoffersen_test(returns: pd.Series, var_series: pd.Series, confidence: float = 0.99) -> dict:
    if len(returns) != len(var_series) or len(returns) == 0:
        return {"error": "Invalid inputs"}
        
    # Indicator for exception
    I = (returns < var_series).astype(int).values
    
    n00, n01, n10, n11 = 0, 0, 0, 0
    
    for i in range(1, len(I)):
        if I[i-1] == 0 and I[i] == 0: n00 += 1
        elif I[i-1] == 0 and I[i] == 1: n01 += 1
        elif I[i-1] == 1 and I[i] == 0: n10 += 1
        elif I[i-1] == 1 and I[i] == 1: n11 += 1
        
    pi0 = n01 / (n00 + n01) if (n00 + n01) > 0 else 0
    pi1 = n11 / (n10 + n11) if (n10 + n11) > 0 else 0
    pi = (n01 + n11) / (n00 + n01 + n10 + n11) if (n00 + n01 + n10 + n11) > 0 else 0
    
    # Likelihood ratio
    L_null = (1 - pi)**(n00 + n10) * pi**(n01 + n11)
    L_alt = (1 - pi0)**n00 * pi0**n01 * (1 - pi1)**n10 * pi1**n11
    
    if L_null == 0 or L_alt == 0:
        return {'test_stat': 0.0, 'p_value': 1.0, 'pass': True}
        
    lr_stat = -2 * np.log(L_null / L_alt)
    p_value = 1 - chi2.cdf(lr_stat, df=1)
    
    return {
        'test_stat': float(lr_stat),
        'p_value': float(p_value),
        'pass': bool(p_value > 0.05)
    }
