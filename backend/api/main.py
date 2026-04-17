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
    OrderModel, WatchlistModel, NewsEventModel, MarketSnapshotModel, TransactionModel
)

from engine.market import get_prices, get_returns, get_live_quote, get_live_fundamentals, get_candlesticks
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
from engine.speculations import monte_carlo_gbm_simulation, prophet_trend_decomposition
from engine.intelligence import resolve_query, get_math_explanation, get_market_pulse, SECURITIES_MASTER
from engine.instruments import (
    search_instruments, resolve_symbol_format, get_quote,
    get_historical_ohlcv, get_fundamentals, get_news,
    get_market_breadth, get_sector_performance
)

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

# ── 2B. Universal Instrument Registry & Provider-Agnostic Endpoints ──────────
@app.get("/api/instruments/search")
def api_search_instruments(query: str = Query("", description="Symbol, name, ISIN, or BSE code"), limit: int = 15):
    """Dynamic multi-field fuzzy search across NSE, BSE, US, Indices, ETFs and Funds."""
    return {"results": search_instruments(query, limit=limit)}

@app.get("/api/instruments/resolve")
def api_resolve_symbol(query: str = Query(..., description="Query to resolve")):
    """Resolves arbitrary ticker names/aliases/ISINs to normalized provider symbols."""
    return {"resolved_symbol": resolve_symbol_format(query)}

@app.get("/api/instruments/quote")
def api_get_instrument_quote(symbol: str = Query(..., description="Ticker symbol")):
    """Retrieves live / delayed quote for any security with status classification."""
    return get_quote(symbol)

@app.get("/api/instruments/history")
def api_get_instrument_history(symbol: str = Query(..., description="Ticker symbol"), timeframe: str = Query("1Y", description="1D, 1W, 1M, 3M, 6M, 1Y, 5Y, MAX")):
    """Returns multi-timeframe OHLCV bars for Candlestick rendering."""
    return get_historical_ohlcv(symbol, timeframe=timeframe)

@app.get("/api/instruments/fundamentals")
def api_get_instrument_fundamentals(symbol: str = Query(..., description="Ticker symbol")):
    """Fetches dynamically retrieved financial multiples and balance sheet figures."""
    return get_fundamentals(symbol)

@app.get("/api/instruments/news")
def api_get_instrument_news(symbol: str = Query(..., description="Ticker symbol")):
    """Fetches deduplicated company news stories with timestamps and publishers."""
    return {"news": get_news(symbol)}

@app.get("/api/instruments/market-breadth")
def api_get_market_breadth():
    """Returns advance/decline market breadth metrics."""
    return get_market_breadth()

@app.get("/api/instruments/sectors")
def api_get_sectors():
    """Returns sector performance benchmark metrics."""
    return {"sectors": get_sector_performance()}

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

@app.get("/api/quant/speculations")
def api_get_speculations(ticker: str = "RELIANCE", horizon_days: int = 90, drift: float = 0.12, vol_mult: float = 1.0, jumps: bool = True):
    """Returns 10,000-path Monte Carlo Geometric Brownian Motion prediction fan chart and terminal probabilities."""
    try:
        return monte_carlo_gbm_simulation(ticker, horizon_days, drift, vol_mult, n_sims=10000, use_jumps=jumps)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quant/prophet")
def api_get_prophet(ticker: str = "RELIANCE", horizon_days: int = 90):
    """Returns Prophet-style time series decomposition into trend, Fourier seasonality, and 95% confidence bands."""
    try:
        return prophet_trend_decomposition(ticker, horizon_days)
    except Exception as e:
        return {"error": str(e)}

# ── Real-Time Candlestick & Market Data Endpoints ────────────────────────────
@app.get("/api/market/candlesticks")
def api_get_candlesticks(ticker: str = "RELIANCE", timeframe: str = "1Y"):
    """Returns OHLC candlestick series with volume and computed SMA/EMA."""
    try:
        return get_candlesticks(ticker, timeframe)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/quote")
def api_get_quote(ticker: str = "RELIANCE"):
    """Returns live market quote."""
    try:
        return get_live_quote(ticker)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/market/fundamentals")
def api_get_fundamentals(ticker: str = "RELIANCE"):
    """Returns live corporate fundamentals."""
    try:
        return get_live_fundamentals(ticker)
    except Exception as e:
        return {"error": str(e)}

# ── Database-Backed Portfolio Transactions CRUD & Accounting Endpoints ───────
@app.get("/api/portfolio/transactions")
def api_get_portfolio_transactions(db: Session = Depends(get_db)):
    """Returns all stored portfolio transactions from database."""
    try:
        txs = db.query(TransactionModel).order_by(TransactionModel.date.desc()).all()
        return {
            "transactions": [
                {
                    "id": t.tx_id,
                    "symbol": t.symbol,
                    "type": t.type,
                    "quantity": t.quantity,
                    "price": t.price,
                    "fees": t.fees,
                    "date": t.date,
                    "currency": t.currency,
                    "notes": t.notes
                }
                for t in txs
            ]
        }
    except Exception as e:
        return {"error": str(e), "transactions": []}

@app.post("/api/portfolio/transactions")
def api_add_portfolio_transaction(data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Adds a new transaction to the database with accounting recalculation."""
    try:
        tx_id = data.get("id") or f"tx-{int(datetime.utcnow().timestamp() * 1000)}"
        new_tx = TransactionModel(
            tx_id=tx_id,
            symbol=data.get("symbol", "RELIANCE").upper(),
            type=data.get("type", "BUY").upper(),
            quantity=int(data.get("quantity", 1)),
            price=float(data.get("price", 0.0)),
            fees=float(data.get("fees", 0.0)),
            date=data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
            currency=data.get("currency", "INR"),
            notes=data.get("notes", "")
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        return {"status": "SUCCESS", "id": new_tx.tx_id, "transaction": data}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.put("/api/portfolio/transactions/{tx_id}")
def api_update_portfolio_transaction(tx_id: str, data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Updates an existing transaction in the database."""
    try:
        tx = db.query(TransactionModel).filter(TransactionModel.tx_id == tx_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if "symbol" in data: tx.symbol = data["symbol"].upper()
        if "type" in data: tx.type = data["type"].upper()
        if "quantity" in data: tx.quantity = int(data["quantity"])
        if "price" in data: tx.price = float(data["price"])
        if "fees" in data: tx.fees = float(data["fees"])
        if "date" in data: tx.date = data["date"]
        if "notes" in data: tx.notes = data["notes"]
        
        db.commit()
        return {"status": "SUCCESS", "id": tx_id}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.delete("/api/portfolio/transactions/{tx_id}")
def api_delete_portfolio_transaction(tx_id: str, db: Session = Depends(get_db)):
    """Deletes a transaction from the database."""
    try:
        tx = db.query(TransactionModel).filter(TransactionModel.tx_id == tx_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        db.delete(tx)
        db.commit()
        return {"status": "SUCCESS", "id": tx_id}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/api/portfolio/summary")
def api_get_portfolio_summary(db: Session = Depends(get_db)):
    """Computes real-time portfolio holdings, invested capital, live value, and P&L from transaction history."""
    try:
        txs = db.query(TransactionModel).all()
        holdings_map = {}
        total_realized_pnl = 0.0

        for t in txs:
            if t.symbol not in holdings_map:
                holdings_map[t.symbol] = {
                    "symbol": t.symbol,
                    "buy_qty": 0,
                    "buy_cost": 0.0,
                    "sell_qty": 0,
                    "sell_proceeds": 0.0,
                    "total_fees": 0.0
                }
            h = holdings_map[t.symbol]
            h["total_fees"] += t.fees

            if t.type == "BUY":
                h["buy_qty"] += t.quantity
                h["buy_cost"] += (t.quantity * t.price) + t.fees
            elif t.type == "SELL":
                avg_cost_before = (h["buy_cost"] / h["buy_qty"]) if h["buy_qty"] > 0 else t.price
                realized_gain = (t.price - avg_cost_before) * t.quantity - t.fees
                total_realized_pnl += realized_gain
                h["sell_qty"] += t.quantity
                h["sell_proceeds"] += (t.quantity * t.price) - t.fees

        holdings = []
        total_invested = 0.0
        total_current_val = 0.0

        for sym, h in holdings_map.items():
            net_qty = h["buy_qty"] - h["sell_qty"]
            if net_qty > 0:
                avg_buy_price = h["buy_cost"] / h["buy_qty"]
                quote = get_live_quote(sym)
                live_price = quote.get("price", avg_buy_price)
                invested = net_qty * avg_buy_price
                curr_val = net_qty * live_price
                unrealized = curr_val - invested
                unrealized_pct = (unrealized / invested * 100.0) if invested > 0 else 0.0

                total_invested += invested
                total_current_val += curr_val

                holdings.append({
                    "symbol": sym,
                    "quantity": net_qty,
                    "avg_buy_price": round(avg_buy_price, 2),
                    "live_price": round(live_price, 2),
                    "invested": round(invested, 2),
                    "current_value": round(curr_val, 2),
                    "unrealized_pnl": round(unrealized, 2),
                    "unrealized_pnl_percent": round(unrealized_pct, 2)
                })

        for h in holdings:
            h["weight_percent"] = round((h["current_value"] / total_current_val * 100.0), 2) if total_current_val > 0 else 0.0

        total_unrealized_pnl = total_current_val - total_invested
        total_unrealized_pct = (total_unrealized_pnl / total_invested * 100.0) if total_invested > 0 else 0.0

        return {
            "total_invested": round(total_invested, 2),
            "current_value": round(total_current_val, 2),
            "unrealized_pnl": round(total_unrealized_pnl, 2),
            "unrealized_pnl_percent": round(total_unrealized_pct, 2),
            "realized_pnl": round(total_realized_pnl, 2),
            "holdings": holdings,
            "transaction_count": len(txs)
        }
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
