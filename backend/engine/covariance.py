import pandas as pd
from sklearn.covariance import LedoitWolf

def ledoit_wolf_shrinkage(returns: pd.DataFrame) -> dict:
    if returns.empty:
        return {"error": "Empty returns dataframe"}
        
    try:
        lw = LedoitWolf()
        fitted = lw.fit(returns.values)
        
        return {
            'covariance_matrix': fitted.covariance_.tolist(),
            'shrinkage_intensity': float(fitted.shrinkage_),
            'tickers': returns.columns.tolist()
        }
    except Exception as e:
        return {"error": str(e)}
