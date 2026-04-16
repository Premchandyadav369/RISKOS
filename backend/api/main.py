import sys
import os
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Query, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database.db import engine, get_db, init_db
from database.models import (
    SecurityModel, PriceHistoryModel, PortfolioModel,
    OrderModel, WatchlistModel, NewsEventModel, MarketSnapshotModel
)

from engine.market import get_prices, get_returns, get_live_quote, get_live_fundamentals
from engine.volatility import garch_volatility
from engine.regime import detect_regime
from engine.correlation import correlation_matrix
from engine.risk import calculate_var
from engine.covariance import ledoit_wolf_shrinkage
from engine.optimizer import (
    cvar_optimize, max_sharpe_optimize, min_variance_optimize,
    calculate_efficient_frontier, monte_carlo_portfolio_simulation
)
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
from engine.intelligence import resolve_query, get_math_explanation, get_market_pulse, SECURITIES_MASTER

app = FastAPI(
    title="RISKOS Dynamic Financial Intelligence & Portfolio Optimization API",
    version="2.1.0",
    description="Database-backed, real-time institutional quantitative intelligence platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

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

# ── 1. Real-Time Market Streaming SSE Endpoint ──────────────────────────────
@app.get("/api/stream/market")
async def stream_market():
    """Server-Sent Events (SSE) stream broadcasting live quotes and market breadth every 2 seconds."""
    async def event_generator():
        while True:
            try:
                pulse = get_market_pulse()
                ticks = {
                    'RELIANCE': get_live_quote('RELIANCE'),
                    'TCS': get_live_quote('TCS'),
                    'HDFCBANK': get_live_quote('HDFCBANK'),
                    'AAPL': get_live_quote('AAPL'),
                    'NVDA': get_live_quote('NVDA')
                }
                payload = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'pulse': pulse,
                    'ticks': ticks
                }
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(2.5)
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                await asyncio.sleep(5)
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ── 2. Database-Backed Securities Master & Live Search ───────────────────────
@app.get("/api/securities/master")
def api_securities_master(q: Optional[str] = None, db: Session = Depends(get_db)):
    """Queries persistent database securities master with live quote synchronization."""
    try:
        query = db.query(SecurityModel)
        if q:
            query_str = f"%{q.lower().strip()}%"
            query = query.filter(
                (SecurityModel.symbol.ilike(query_str)) |
                (SecurityModel.name.ilike(query_str)) |
                (SecurityModel.common_name.ilike(query_str)) |
                (SecurityModel.isin.ilike(query_str))
            )
        
        results = query.all()
        securities_out = []
        for r in results:
            aliases = json.loads(r.aliases_json) if r.aliases_json else []
            causal = json.loads(r.causal_factors_json) if r.causal_factors_json else []
            corp = json.loads(r.corp_actions_json) if r.corp_actions_json else []
            securities_out.append({
                "symbol": r.symbol,
                "bse_code": r.bse_code,
                "name": r.name,
                "common_name": r.common_name,
                "isin": r.isin,
                "exchange": r.exchange,
                "country": r.country,
                "instrument_type": r.instrument_type,
                "sector": r.sector,
                "industry": r.industry,
                "aliases": aliases,
                "price_inr": r.price_inr,
                "change_percent": r.change_percent,
                "market_cap_inr": r.market_cap_inr,
                "pe": r.pe,
                "pb": r.pb,
                "roe": r.roe,
                "roce": r.roce,
                "debt_equity": r.debt_equity,
                "revenue_inr": r.revenue_inr,
                "ebitda_inr": r.ebitda_inr,
                "net_profit_inr": r.net_profit_inr,
                "eps": r.eps,
                "beta": r.beta,
                "volatility": r.volatility,
                "sharpe": r.sharpe,
                "var99": r.var99,
                "mdd": r.mdd,
                "regime": r.regime,
                "causal_factors": causal,
                "corp_actions": corp
            })
        return {"securities": securities_out}
    except Exception as e:
        return {"error": str(e), "securities": SECURITIES_MASTER}

@app.get("/api/securities/{symbol}")
def api_get_single_security(symbol: str, db: Session = Depends(get_db)):
    """Fetches full security profile, historical bars, and live fundamentals."""
    try:
        sec = db.query(SecurityModel).filter(SecurityModel.symbol.ilike(symbol.strip())).first()
        if not sec:
            from engine.intelligence import resolve_security
            sec_dict = resolve_security(symbol)
            if sec_dict:
                return sec_dict
            raise HTTPException(status_code=404, detail="Security not found")
            
        quote = get_live_quote(symbol)
        fund = get_live_fundamentals(symbol)
        
        return {
            "symbol": sec.symbol,
            "name": sec.name,
            "exchange": sec.exchange,
            "price_inr": quote["price"] if quote.get("price") else sec.price_inr,
            "change_percent": quote["change_percent"] if quote.get("change_percent") else sec.change_percent,
            "pe": fund.get("pe", sec.pe),
            "pb": fund.get("pb", sec.pb),
            "roe": fund.get("roe", sec.roe),
            "beta": fund.get("beta", sec.beta),
            "market_cap_inr": sec.market_cap_inr,
            "causal_factors": json.loads(sec.causal_factors_json) if sec.causal_factors_json else [],
            "corp_actions": json.loads(sec.corp_actions_json) if sec.corp_actions_json else []
        }
    except Exception as e:
        return {"error": str(e)}

# ── 3. AI-Native Financial Query & Entity Resolution ─────────────────────────
@app.get("/api/finance/query")
def api_finance_query(q: str = "Analyse Reliance", groq_key: Optional[str] = None):
    try:
        return resolve_query(q, groq_key)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/pulse")
def api_market_pulse():
    try:
        return get_market_pulse()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/math/explain")
def api_math_explain(formula: str = "sharpe", ticker: Optional[str] = None):
    try:
        return get_math_explanation(formula, ticker)
    except Exception as e:
        return {"error": str(e)}

# ── 4. Advanced Portfolio Optimization & Efficient Frontier ─────────────────
@app.post("/api/portfolio/optimize")
def api_portfolio_optimize(payload: Dict[str, Any] = Body(...)):
    """
    Computes optimal portfolio allocation, CVaR minimization, and Efficient Frontier curve:
    payload: {
      "tickers": ["RELIANCE", "TCS", "HDFCBANK", "INFY"],
      "capital": 1000000.0,
      "risk_tolerance": "moderate",
      "target_return": 0.14,
      "period": "1y"
    }
    """
    try:
        tickers = payload.get("tickers", ["RELIANCE", "TCS", "HDFCBANK", "INFY"])
        target_ret = float(payload.get("target_return", 0.14))
        period = payload.get("period", "1y")
        
        returns = get_returns(tickers, period)
        if returns.empty:
            return {"error": "Insufficient return data for optimization"}
            
        cvar_res = cvar_optimize(returns, target_return=target_ret)
        frontier_res = calculate_efficient_frontier(returns)
        
        return {
            "optimization": cvar_res,
            "efficient_frontier": frontier_res["frontier"],
            "max_sharpe_portfolio": frontier_res["max_sharpe_portfolio"],
            "min_volatility_portfolio": frontier_res["min_volatility_portfolio"]
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/portfolio/simulate")
def api_portfolio_simulate(payload: Dict[str, Any] = Body(...)):
    """Runs 10,000 Monte Carlo simulations on actual returns."""
    try:
        tickers = payload.get("tickers", ["RELIANCE", "TCS", "HDFCBANK", "INFY"])
        weights = payload.get("weights", [0.25, 0.25, 0.25, 0.25])
        capital = float(payload.get("capital", 1000000.0))
        horizon = int(payload.get("horizon_days", 252))
        
        returns = get_returns(tickers, "1y")
        if returns.empty:
            return {"error": "No return data"}
            
        return monte_carlo_portfolio_simulation(returns, weights, capital, horizon)
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/portfolio/save")
def api_portfolio_save(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Saves a user's quantitative portfolio into the database."""
    try:
        name = payload.get("name", f"Portfolio {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}")
        capital = float(payload.get("capital", 1000000.0))
        weights = payload.get("weights", {})
        exp_ret = float(payload.get("expected_return", 0.12))
        vol = float(payload.get("volatility", 0.15))
        sharpe = float(payload.get("sharpe_ratio", 1.2))
        
        port = PortfolioModel(
            name=name,
            capital=capital,
            weights_json=json.dumps(weights),
            expected_return=exp_ret,
            volatility=vol,
            sharpe_ratio=sharpe
        )
        db.add(port)
        db.commit()
        db.refresh(port)
        return {"status": "SUCCESS", "portfolio_id": port.id, "name": port.name}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/api/portfolio/list")
def api_portfolio_list(db: Session = Depends(get_db)):
    """Lists saved user portfolios from the database."""
    try:
        ports = db.query(PortfolioModel).order_by(PortfolioModel.created_at.desc()).all()
        return {
            "portfolios": [
                {
                    "id": p.id,
                    "name": p.name,
                    "capital": p.capital,
                    "weights": json.loads(p.weights_json) if p.weights_json else {},
                    "expected_return": p.expected_return,
                    "volatility": p.volatility,
                    "sharpe_ratio": p.sharpe_ratio,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in ports
            ]
        }
    except Exception as e:
        return {"error": str(e)}

# ── 5. Orders & Trade History Database Endpoints ────────────────────────────
@app.get("/api/orders")
def api_get_orders(db: Session = Depends(get_db)):
    """Retrieves order execution history from the database."""
    try:
        orders = db.query(OrderModel).order_by(OrderModel.created_at.desc()).limit(50).all()
        return {
            "orders": [
                {
                    "order_id": o.order_id,
                    "symbol": o.symbol,
                    "direction": o.direction,
                    "quantity": o.quantity,
                    "order_type": o.order_type,
                    "avg_fill_price": o.avg_fill_price,
                    "vwap_benchmark": o.vwap_benchmark,
                    "slippage_bps": o.slippage_bps,
                    "total_cost": o.total_cost,
                    "status": o.status,
                    "created_at": o.created_at.isoformat() if o.created_at else None
                }
                for o in orders
            ]
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/signals/execute")
def api_execute(ticker: str, direction: str, quantity: int, db: Session = Depends(get_db)):
    """Simulates trade execution with VWAP benchmark and records order in database."""
    try:
        exec_result = simulate_execution(ticker, direction, quantity)
        if exec_result.get("status") == "FILLED":
            order_id = f"ORD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{ticker}"
            ord_model = OrderModel(
                order_id=order_id,
                symbol=ticker.upper(),
                direction=direction.upper(),
                quantity=quantity,
                order_type="VWAP",
                avg_fill_price=exec_result.get("avg_fill_price", 0.0),
                vwap_benchmark=exec_result.get("vwap_benchmark", 0.0),
                slippage_bps=exec_result.get("implementation_shortfall_bps", 0.0),
                total_cost=exec_result.get("total_cost", 0.0),
                status="FILLED"
            )
            db.add(ord_model)
            db.commit()
        return exec_result
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

# ── 6. Market Intelligence & Risk Endpoints ─────────────────────────────────
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
        if returns.empty or ticker not in returns:
            return {"error": "No data"}
        return garch_volatility(returns[ticker])
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/regime")
def api_get_regime(ticker: str = "SPY", period: str = '1y'):
    try:
        returns = get_returns([ticker], period)
        if returns.empty or ticker not in returns:
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
        if returns.empty or ticker not in returns:
            return {"error": "No data"}
        
        ret_series = returns[ticker].dropna()
        if len(ret_series) < 10:
            return {"error": "Insufficient return data"}
            
        win = min(len(ret_series) // 2, 60)
        win = max(win, 5)
        var_series = ret_series.rolling(win, min_periods=5).quantile(1 - confidence).dropna()
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

# ── 7. Static Web Frontend Mounts ───────────────────────────────────────────
frontend_dir = backend_dir.parent

if (frontend_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dir / "assets")), name="assets")
if (frontend_dir / "fonts").exists():
    app.mount("/fonts", StaticFiles(directory=str(frontend_dir / "fonts")), name="fonts")

@app.get("/")
def serve_landing():
    index_file = frontend_dir / "index.html"
    return FileResponse(str(index_file)) if index_file.exists() else {"status": "RISKOS API Online"}

@app.get("/terminal")
@app.get("/app")
@app.get("/app.html")
def serve_terminal():
    app_file = frontend_dir / "app.html"
    return FileResponse(str(app_file)) if app_file.exists() else {"status": "Terminal UI"}

if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="root_static")
