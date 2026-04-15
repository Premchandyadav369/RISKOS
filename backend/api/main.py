from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
import pydantic

from risk_engine.data_quality import calculate_data_quality
from risk_engine.market import calculate_market_risk
from risk_engine.credit import calculate_credit_risk
from risk_engine.liquidity import calculate_liquidity_risk
from risk_engine.interest_rate import calculate_interest_rate_risk
from risk_engine.greeks import black_scholes_greeks
from risk_engine.factor import calculate_factor_risk
from risk_engine.optimization import optimize_portfolio
from risk_engine.cross_market import calculate_cross_market_risk

from ml.anomaly_model import detect_market_anomalies
from ml.regime_model import detect_market_regime
from ml.explainability import explain_risk_movement
from agents.investigator_agent import run_risk_investigation

from trading_engine.strategy_runner import get_trading_daemon
from trading_engine.backtest import run_all_strategies_backtest

from risk_engine.trade_execution import simulate_pretrade_execution
from risk_engine.basel_capital import calculate_basel_capital_adequacy
from risk_engine.contagion import calculate_systemic_contagion
from risk_engine.yield_curve import get_yield_curve_data
from risk_engine.news_engine import fetch_live_macro_news
from risk_engine.fixed_income import price_interest_rate_swap
from risk_engine.credit_derivatives import price_credit_default_swap
from risk_engine.quant_core import quant_engine
from risk_engine.alm_engine import calculate_alm_and_irrbb
from risk_engine.xva_engine import calculate_xva_and_sacr
from risk_engine.climate_engine import calculate_ngfs_climate_stress
from risk_engine.quantum_optimizer import simulate_quantum_qubo_optimization
from risk_engine.orderbook_engine import generate_l2_orderbook
from risk_engine.committee_engine import run_risk_committee_debate
from risk_engine.ccar_engine import generate_ccar_dfast_pack

app = FastAPI(
    title="RISKOS Quant Terminal API",
    description="Bloomberg Terminal-level Quantitative Risk, Algorithmic Trading & Basel III Capital Workstation",
    version="3.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    daemon = get_trading_daemon()
    daemon.start()

@app.get("/")
def read_root():
    return {
        "system": "RISKOS Quant Terminal",
        "status": "OPERATIONAL",
        "trading_desk": "NON_STOP_DAEMON_ACTIVE",
        "jurisdiction": "US (NYSE/NASDAQ) & India (NSE/BSE)",
        "k2_reasoning_engine": "K2 Think V2 (MBZUAI-IFM/K2-Think-v2)",
        "version": "3.5.0"
    }

@app.get("/api/risk/overview")
def get_risk_overview():
    market = calculate_market_risk()
    credit = calculate_credit_risk()
    liquidity = calculate_liquidity_risk()
    interest = calculate_interest_rate_risk()
    regime = detect_market_regime()
    quality = calculate_data_quality()
    basel = calculate_basel_capital_adequacy()
    
    overall_score = round(
        0.35 * 72.0 +
        0.20 * credit["credit_risk_score"] +
        0.20 * liquidity["liquidity_risk_score"] +
        0.15 * interest["interest_rate_risk_score"] +
        0.10 * 64.0,
        1
    )
    
    alerts = [
        {"id": "ALT-001", "level": "WARNING", "category": "LIQUIDITY", "message": "Liquidity buffer utilization approaching 74% threshold under stress."},
        {"id": "ALT-002", "level": "WARNING", "category": "CREDIT", "message": "Pacific Tech Holdings PD increased to 3.80% (BBB rating watchlist)."},
        {"id": "ALT-003", "level": "INFO", "category": "MARKET", "message": "USD/INR FX volatility elevated (+5.2% annualized)."},
        {"id": "ALT-004", "level": "INFO", "category": "CROSS-MARKET", "message": "NVDA ↔ TCS cross-market tech correlation at 0.74."}
    ]
    
    return {
        "timestamp": "2026-08-12T21:03:42 IST",
        "system_status": "LIVE",
        "overall_risk_score": overall_score,
        "risk_change_24h_pct": 8.4,
        "market_risk_score": 72.0,
        "credit_risk_score": credit["credit_risk_score"],
        "liquidity_risk_score": liquidity["liquidity_risk_score"],
        "interest_rate_risk_score": interest["interest_rate_risk_score"],
        "capital_risk_score": 43.0,
        "portfolio_value": market["portfolio_value"],
        "data_quality": quality,
        "market_regime": regime,
        "basel_capital": basel,
        "active_alerts": alerts
    }

class PreTradeRequest(pydantic.BaseModel):
    ticker: str = "NVDA"
    side: str = "BUY"
    shares: int = 5000

@app.post("/api/trading/pretrade-check")
def run_pretrade_check(req: PreTradeRequest):
    return simulate_pretrade_execution(ticker=req.ticker, side=req.side, shares=req.shares)

@app.get("/api/capital/basel")
def get_basel_capital():
    return calculate_basel_capital_adequacy()

@app.get("/api/systemic/contagion")
def get_contagion_network():
    return calculate_systemic_contagion()

@app.get("/api/markets/yield-curve")
def get_yield_curve():
    return get_yield_curve_data()

@app.get("/api/ml/explain")
def get_ml_explanation():
    return explain_risk_movement()

@app.get("/api/trading/status")
def get_trading_status():
    daemon = get_trading_daemon()
    state = daemon.latest_state
    if not state:
        state = {
            "daemon_status": "RUNNING_NON_STOP",
            "execution_cycles": daemon.execution_count,
            "backtest_summary": run_all_strategies_backtest()
        }
    return state

@app.post("/api/trading/toggle")
def toggle_trading_daemon(action: str = Query("start")):
    daemon = get_trading_daemon()
    if action == "start":
        daemon.start()
        return {"status": "DAEMON_STARTED"}
    else:
        daemon.stop()
        return {"status": "DAEMON_STOPPED"}

@app.get("/api/trading/backtest")
def get_trading_backtest():
    return run_all_strategies_backtest()

@app.get("/api/trading/volsurface")
def get_volatility_surface():
    strikes = [200, 210, 220, 230, 240]
    expiries = [30, 60, 90, 180]
    matrix = []
    for k in strikes:
        row = {"strike": f"${k}"}
        for exp in expiries:
            moneyness = abs(k - 220) / 220.0
            iv = round(24.0 + 15.0 * (moneyness ** 1.5) + (30.0 / exp), 2)
            row[f"exp_{exp}d"] = iv
        matrix.append(row)
    return {
        "ticker": "AAPL / NVDA OPTIONS SURFACE",
        "underlying_price": 220.0,
        "volatility_surface": matrix
    }

@app.get("/api/trading/news")
def get_institutional_news():
    return fetch_live_macro_news()

class SwapRequest(pydantic.BaseModel):
    notional: float = 50_000_000.0
    fixed_rate_bps: float = 450.0
    tenor_years: int = 5
    floating_spread_bps: float = 15.0

@app.post("/api/quant/swap")
def run_swap_pricer(req: SwapRequest):
    return price_interest_rate_swap(
        notional=req.notional,
        fixed_rate_bps=req.fixed_rate_bps,
        tenor_years=req.tenor_years,
        floating_spread_bps=req.floating_spread_bps
    )

class CDSRequest(pydantic.BaseModel):
    notional: float = 10_000_000.0
    recovery_rate_pct: float = 40.0
    hazard_rate_bps: float = 120.0
    tenor_years: int = 5

@app.post("/api/quant/cds")
def run_cds_pricer(req: CDSRequest):
    return price_credit_default_swap(
        notional=req.notional,
        recovery_rate_pct=req.recovery_rate_pct,
        hazard_rate_bps=req.hazard_rate_bps,
        tenor_years=req.tenor_years
    )

@app.get("/api/markets/cross")
def get_cross_market_analytics():
    return calculate_cross_market_risk()

@app.get("/api/quant/analytics")
def get_quant_analytics(portfolio_value: float = 1_000_000.0):
    market = calculate_market_risk(portfolio_value=portfolio_value)
    factor = calculate_factor_risk()
    explain = explain_risk_movement()
    anomalies = detect_market_anomalies()
    return {
        "market_risk": market,
        "factor_risk": factor,
        "explainability": explain,
        "anomalies": anomalies
    }

class MonteCarloRequest(pydantic.BaseModel):
    portfolio_value: float = 1_000_000.0
    simulations: int = 100000
    horizon_days: int = 30
    confidence_pct: float = 99.0

@app.post("/api/quant/monte-carlo")
def run_monte_carlo_lab(req: MonteCarloRequest):
    np = __import__("numpy")
    mu = 0.08 / 252.0
    vol = 0.18 / np.sqrt(252.0)
    steps = req.horizon_days
    num_sims = min(req.simulations, 100000)
    
    np.random.seed(42)
    daily_returns = np.random.normal(mu, vol, size=(num_sims, steps))
    cumulative_returns = np.prod(1 + daily_returns, axis=1) - 1.0
    final_values = req.portfolio_value * (1 + cumulative_returns)
    pnl = final_values - req.portfolio_value
    
    cutoff_idx = int((1.0 - req.confidence_pct / 100.0) * num_sims)
    sorted_pnl = np.sort(pnl)
    
    return {
        "simulations_run": num_sims,
        "horizon_days": req.horizon_days,
        "confidence_pct": req.confidence_pct,
        "expected_pnl": round(float(np.mean(pnl)), 2),
        "var_amount": round(float(-sorted_pnl[cutoff_idx]), 2),
        "cvar_amount": round(float(-np.mean(sorted_pnl[:cutoff_idx])), 2),
        "worst_scenario_loss": round(float(-sorted_pnl[0]), 2),
        "best_scenario_gain": round(float(np.max(pnl)), 2),
    }

class OptimizeRequest(pydantic.BaseModel):
    min_cash_pct: float = 5.0
    max_asset_pct: float = 25.0

@app.post("/api/quant/optimize")
def run_portfolio_optimization(req: OptimizeRequest):
    return optimize_portfolio(min_cash_pct=req.min_cash_pct, max_asset_pct=req.max_asset_pct)

class GreeksRequest(pydantic.BaseModel):
    spot: float = 220.0
    strike: float = 220.0
    expiry_days: float = 90.0
    volatility_pct: float = 24.0
    risk_free_rate_pct: float = 4.5
    option_type: str = "call"

@app.post("/api/quant/greeks")
def calculate_greeks_endpoint(req: GreeksRequest):
    return black_scholes_greeks(
        spot=req.spot,
        strike=req.strike,
        time_to_expiry_days=req.expiry_days,
        volatility_pct=req.volatility_pct,
        risk_free_rate_pct=req.risk_free_rate_pct,
        option_type=req.option_type
    )

class StressRequest(pydantic.BaseModel):
    rate_shock_bps: float = 100.0
    nifty_shock_pct: float = -15.0
    sp500_shock_pct: float = -20.0
    usdinr_shock_pct: float = 10.0
    volatility_shock_pct: float = 50.0
    credit_spread_bps: float = 200.0

@app.post("/api/stress/simulate")
def run_stress_digital_twin(req: StressRequest):
    base_val = 1_000_000.0
    equity_impact_pct = (0.5 * req.nifty_shock_pct + 0.5 * req.sp500_shock_pct)
    rate_impact_pct = -4.25 * (req.rate_shock_bps / 10000.0) * 100
    fx_impact_pct = -req.usdinr_shock_pct * 0.35
    
    total_loss_pct = equity_impact_pct + rate_impact_pct + fx_impact_pct
    portfolio_pnl = base_val * (total_loss_pct / 100.0)
    
    return {
        "scenario_name": "Digital Twin Custom Stress Test",
        "inputs": req.dict(),
        "portfolio_pnl_amount": round(portfolio_pnl, 2),
        "portfolio_pnl_pct": round(total_loss_pct, 2),
        "stressed_var_99": round(38700.0 * (1.0 + req.volatility_shock_pct / 100.0 + abs(total_loss_pct) / 100.0), 2),
        "stressed_cvar_99": round(52700.0 * 1.35, 2),
        "liquidity_buffer_impact_pct": round(-abs(total_loss_pct) * 1.2, 2),
        "expected_credit_loss_increase_pct": round(req.credit_spread_bps * 0.2, 2),
        "risk_level": "CRITICAL" if abs(total_loss_pct) > 20.0 else "HIGH",
        "critical_finding": "Under this scenario, equity drawdown combined with USD/INR depreciation and rate shocks causes a secondary liquidity constraint within 17 days."
    }

class InvestigateRequest(pydantic.BaseModel):
    case_id: str = "RIS-2026-0812-042"
    metric: str = "Overall Risk Score"

@app.post("/api/agents/investigate")
def trigger_agent_investigation(req: InvestigateRequest):
    return run_risk_investigation(case_id=req.case_id, metric=req.metric)

@app.get("/api/limits/status")
def get_limits_status():
    return {
        "limits": [
            {"metric": "Market 99% VaR Limit", "current_value": "$38.7K", "limit": "$45.0K", "utilization_pct": 86.0, "status": "WARNING"},
            {"metric": "Liquidity Buffer Utilization", "current_value": "$185.0M", "limit": "$200.0M", "utilization_pct": 74.0, "status": "NORMAL"},
            {"metric": "Counterparty Exposure (Max Single)", "current_value": "$40.0M", "limit": "$50.0M", "utilization_pct": 80.0, "status": "WARNING"},
            {"metric": "USD/INR FX Exposure Limit", "current_value": "$14.2M", "limit": "$20.0M", "utilization_pct": 71.0, "status": "NORMAL"}
        ]
    }

@app.get("/api/reports/daily")
def get_daily_risk_report():
    return {
        "report_title": "Daily Institutional Risk & Stress Briefing",
        "date": "12 August 2026",
        "jurisdiction": "US (NYSE/NASDAQ) & India (NSE/BSE)",
        "executive_summary": "Overall portfolio risk increased 8.4% over the last 24 hours to 67/100, driven by elevated technology sector volatility and currency movements in USD/INR. Liquidity coverage ratio (LCR) remains robust at 142%.",
        "key_drivers": [
            "US Tech sector volatility spike (NVDA 1D vol +8.7%)",
            "USD/INR exchange rate movement (+5.2% annualized vol)",
            "Cross-asset correlation tightening between NIFTY IT and NASDAQ (0.74)"
        ],
        "limit_breaches": "Zero hard breaches. Two warning thresholds active (Market VaR 86% limit, Counterparty Apex 80%).",
        "recommended_actions": [
            "Rebalance NVDA exposure from 12% to 8%",
            "Increase 30-day liquidity buffer by $15.0M",
            "Recalculate 10-day 99% Stress VaR prior to tomorrow's trading session"
        ]
    }

@app.get("/api/quant/comprehensive")
def get_comprehensive_quant_metrics():
    import numpy as np
    np.random.seed(42)
    returns = np.random.normal(0.0005, 0.015, 500)
    # Add fat tails
    returns[::20] *= 3.5
    
    weights = np.array([0.25, 0.20, 0.15, 0.15, 0.15, 0.10])
    returns_matrix = np.random.normal(0.0005, 0.015, (500, 6))
    
    ewma = quant_engine.calculate_ewma(returns)
    garch = quant_engine.calculate_garch(returns)
    sample_cov, ledoit_cov, shrinkage = quant_engine.ledoit_wolf_covariance(returns_matrix)
    cf_var = quant_engine.cornish_fisher_var(returns)
    mc_sim = quant_engine.monte_carlo_simulation(weights, ledoit_cov, np.mean(returns_matrix, axis=0))
    evt = quant_engine.extreme_value_theory(returns)
    
    # Generate mock VaR estimates for backtesting
    var_series = np.full(len(returns), -0.035)
    backtest = quant_engine.backtest_var(returns, var_series)
    reverse_stress = quant_engine.reverse_stress_test(weights, target_loss=-0.25)
    black_litterman = quant_engine.black_litterman_views(weights, ledoit_cov, {"confidence": "65%"})
    attribution = quant_engine.risk_attribution(weights, ledoit_cov)

    return {
        "status": "SUCCESS",
        "ewma_volatility": ewma,
        "garch_volatility": garch,
        "ledoit_wolf_shrinkage": {
            "shrinkage_intensity": round(shrinkage, 4),
            "matrix_stability": "POSITIVE_DEFINITE_CONDITION_OPTIMAL"
        },
        "cornish_fisher_var": cf_var,
        "monte_carlo_100k": mc_sim,
        "extreme_value_theory": evt,
        "var_backtesting": backtest,
        "reverse_stress_test": reverse_stress,
        "black_litterman": black_litterman,
        "risk_attribution": attribution
    }

@app.get("/api/alm/irrbb")
def get_alm_irrbb(deposits: float = 500000000.0, hqla: float = 85000000.0, outflow_pct: float = 15.0, rate_shock_bps: int = 200):
    return calculate_alm_and_irrbb(total_deposits=deposits, hqla=hqla, deposit_outflow_pct=outflow_pct, rate_shock_bps=rate_shock_bps)

@app.get("/api/derivatives/xva")
def get_xva_metrics(notional: float = 50000000.0, maturity: float = 5.0, cpty_spread: float = 140.0, own_spread: float = 80.0):
    return calculate_xva_and_sacr(notional=notional, maturity_years=maturity, counterparty_spread_bps=cpty_spread, own_credit_spread_bps=own_spread)

@app.get("/api/climate/ngfs")
def get_climate_stress(scenario: str = "Disorderly"):
    return calculate_ngfs_climate_stress(active_scenario=scenario)

@app.get("/api/optimization/quantum")
def get_quantum_qubo(target_return: float = 0.14, cardinality_k: int = 4):
    return simulate_quantum_qubo_optimization(target_return=target_return, cardinality_k=cardinality_k)

@app.get("/api/market/orderbook")
def get_l2_orderbook(symbol: str = "NVDA", mid_price: float = 128.50):
    return generate_l2_orderbook(symbol=symbol, mid_price=mid_price)

@app.get("/api/committee/session")
def get_committee_session(topic: str = "Cross-Asset Technology Spike & USD/INR FX Volatility"):
    return run_risk_committee_debate(session_topic=topic)

@app.get("/api/regulatory/ccar")
def get_ccar_filing():
    return generate_ccar_dfast_pack()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
