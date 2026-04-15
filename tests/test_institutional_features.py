import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from risk_engine.trade_execution import simulate_pretrade_execution
from risk_engine.basel_capital import calculate_basel_capital_adequacy
from risk_engine.contagion import calculate_systemic_contagion

def test_pretrade_execution():
    res = simulate_pretrade_execution("NVDA", "BUY", 5000)
    assert res["ticker"] == "NVDA"
    assert res["post_trade_var_99"] > res["pre_trade_var_99"]
    assert res["market_impact_cost_usd"] > 0
    assert len(res["execution_schedule"]) == 5

def test_basel_capital():
    res = calculate_basel_capital_adequacy()
    assert res["capital_ratios"]["cet1_ratio_pct"] > 10.0
    assert res["status"] == "WELL_CAPITALIZED"

def test_contagion():
    res = calculate_systemic_contagion()
    assert res["systemic_covar_avg_bps"] > 0
    assert len(res["network_nodes"]) >= 4
