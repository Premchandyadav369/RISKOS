import pytest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

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
from agents.investigator_agent import run_risk_investigation

def test_market_risk():
    res = calculate_market_risk()
    assert res["portfolio_value"] == 1000000.0
    assert "historical" in res["var_metrics"]
    assert res["var_metrics"]["historical"]["var_95"] > 0
    assert res["var_metrics"]["historical"]["var_99"] > res["var_metrics"]["historical"]["var_95"]

def test_credit_risk():
    res = calculate_credit_risk()
    assert res["total_exposure_ead"] > 0
    assert res["total_expected_loss"] > 0
    assert len(res["counterparties"]) == 5

def test_liquidity_risk():
    res = calculate_liquidity_risk()
    assert res["liquidity_buffer"] > 0
    assert res["lcr_pct"] > 0

def test_interest_rate_risk():
    res = calculate_interest_rate_risk(100.0)
    assert res["rate_shock_bps"] == 100.0
    assert res["portfolio_value_impact"] < 0  # +100bps rate shock causes bond/equity price decline

def test_greeks():
    res = black_scholes_greeks(220.0, 220.0, 90.0, 24.0, 4.5, "call")
    assert res["option_price"] > 0
    assert 0.0 <= res["greeks"]["delta"] <= 1.0

def test_optimization():
    res = optimize_portfolio()
    assert "current_metrics" in res
    assert "optimized_metrics" in res
    assert len(res["weights_comparison"]) > 0

def test_cross_market():
    res = calculate_cross_market_risk()
    assert "cross_market_correlation_avg" in res
    assert len(res["pairs"]) == 3

def test_ml_and_agents():
    anomalies = detect_market_anomalies()
    assert anomalies["anomalies_detected_count"] >= 1
    
    regime = detect_market_regime()
    assert "current_regime" in regime
    
    investigation = run_risk_investigation()
    assert investigation["case_id"] == "RIS-2026-0812-042"
    assert len(investigation["recommended_actions"]) > 0
