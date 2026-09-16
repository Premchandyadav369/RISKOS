import pandas as pd
from sklearn.covariance import LedoitWolf

def ledoit_wolf_shrinkage(returns: pd.DataFrame) -> dict:
    clean_rets = returns.dropna()
    if clean_rets.empty:
        clean_rets = returns.fillna(0.0)
    if clean_rets.empty:
        return {"error": "Empty returns dataframe"}
        
    try:
        lw = LedoitWolf()
        fitted = lw.fit(clean_rets.values)
        
        return {
            'covariance_matrix': fitted.covariance_.tolist(),
            'shrinkage_intensity': float(fitted.shrinkage_),
            'tickers': clean_rets.columns.tolist()
        }
    except Exception as e:
        cov = clean_rets.cov().values
        return {
            'covariance_matrix': cov.tolist(),
            'shrinkage_intensity': 0.0,
            'tickers': clean_rets.columns.tolist()
        }

