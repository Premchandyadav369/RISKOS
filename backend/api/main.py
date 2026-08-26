import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from engine.market import get_prices, get_returns
from engine.volatility import garch_volatility
from engine.regime import detect_regime
from engine.correlation import correlation_matrix
from engine.risk import calculate_var
from engine.covariance import ledoit_wolf_shrinkage
from engine.optimizer import cvar_optimize
from engine.backtest import run_backtest
from engine.stress import stress_test
from engine.validation import kupiec_test, christoffersen_test
from engine.signals import generate_signals
from engine.execution import simulate_execution
from engine.spreads import analyze_spread
from engine.rates import analyze_yield_curve
from engine.microstructure import analyze_microstructure
from engine.derivatives import analyze_derivatives
from engine.attribution import analyze_attribution_and_parity

app = FastAPI(title="RISKOS Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM"]

def parse_tickers(tickers_str: Optional[str]) -> list[str]:
    if not tickers_str:
        return DEFAULT_TICKERS
    return [t.strip() for t in tickers_str.split(",")]

def parse_weights(weights_str: Optional[str], n_assets: int) -> list[float]:
    if not weights_str:
        return [1.0 / n_assets] * n_assets
    weights = [float(w.strip()) for w in weights_str.split(",")]
    if len(weights) != n_assets:
        return [1.0 / n_assets] * n_assets
    return weights

@app.get("/api/market/prices")
def api_get_prices(tickers: Optional[str] = None, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        return get_prices(t_list, period)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/volatility")
def api_get_volatility(ticker: str = "AAPL", period: str = '1y'):
    try:
        returns = get_returns([ticker], period)
        if returns.empty:
            return {"error": "No data"}
        return garch_volatility(returns[ticker])
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/regime")
def api_get_regime(ticker: str = "SPY", period: str = '1y'):
    try:
        returns = get_returns([ticker], period)
        if returns.empty:
            return {"error": "No data"}
        return detect_regime(returns[ticker])
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/correlations")
def api_get_correlations(tickers: Optional[str] = None, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        return correlation_matrix(t_list, period)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/var")
def api_get_var(tickers: Optional[str] = None, weights: Optional[str] = None, confidence: float = 0.99, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        w_list = parse_weights(weights, len(t_list))
        returns = get_returns(t_list, period)
        return calculate_var(returns, w_list, confidence)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/covariance")
def api_get_covariance(tickers: Optional[str] = None, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        returns = get_returns(t_list, period)
        return ledoit_wolf_shrinkage(returns)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/optimize")
def api_get_optimize(tickers: Optional[str] = None, target_return: float = 0.10, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        returns = get_returns(t_list, period)
        return cvar_optimize(returns, target_return)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/backtest")
def api_get_backtest(tickers: Optional[str] = None, weights: Optional[str] = None, period: str = '2y'):
    try:
        t_list = parse_tickers(tickers)
        w_list = parse_weights(weights, len(t_list))
        returns = get_returns(t_list, period)
        return run_backtest(returns, w_list)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/stress")
def api_get_stress(tickers: Optional[str] = None, weights: Optional[str] = None, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        w_list = parse_weights(weights, len(t_list))
        returns = get_returns(t_list, period)
        return stress_test(returns, w_list)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/validate")
def api_get_validate(ticker: str = "SPY", confidence: float = 0.99, period: str = '1y'):
    try:
        returns = get_returns([ticker], period)
        if returns.empty:
            return {"error": "No data"}
        
        ret_series = returns[ticker]
        # Generate a dummy VaR series (e.g. historical rolling var)
        var_series = ret_series.rolling(252).quantile(1 - confidence).dropna()
        # Align
        aligned_ret = ret_series.loc[var_series.index]
        
        kupiec = kupiec_test(aligned_ret, var_series, confidence)
        christ = christoffersen_test(aligned_ret, var_series, confidence)
        
        return {
            'kupiec_test': kupiec,
            'christoffersen_test': christ
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/signals/generate")
def api_generate_signals(tickers: Optional[str] = None, period: str = '1y'):
    try:
        t_list = parse_tickers(tickers)
        return generate_signals(t_list, period)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/signals/execute")
def api_execute(ticker: str, direction: str, quantity: int):
    try:
        return simulate_execution(ticker, direction, quantity)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quant/spreads")
def api_get_spreads(ticker1: str = "CL=F", ticker2: str = "BZ=F", period: str = "1y"):
    try:
        return analyze_spread(ticker1, ticker2, period)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quant/rates")
def api_get_rates():
    try:
        return analyze_yield_curve()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quant/microstructure")
def api_get_microstructure(ticker: str = "AAPL", shares: int = 25000):
    try:
        return analyze_microstructure(ticker, shares)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quant/derivatives")
def api_get_derivatives(spot: float = 180.0, strike: float = 185.0, expiry: float = 0.25, vol: float = 0.22, rate: float = 0.045):
    try:
        return analyze_derivatives(spot, strike, expiry, vol, rate)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quant/attribution")
def api_get_attribution(tickers: Optional[str] = None):
    try:
        t_list = parse_tickers(tickers)
        return analyze_attribution_and_parity(t_list)
    except Exception as e:
        return {"error": str(e)}
