import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import pytest
from risk_engine.alm_engine import calculate_alm_and_irrbb
from risk_engine.xva_engine import calculate_xva_and_sacr
from risk_engine.climate_engine import calculate_ngfs_climate_stress
from risk_engine.quantum_optimizer import simulate_quantum_qubo_optimization
from risk_engine.orderbook_engine import generate_l2_orderbook
from risk_engine.committee_engine import run_risk_committee_debate
from risk_engine.ccar_engine import generate_ccar_dfast_pack

def test_alm_and_irrbb():
    res = calculate_alm_and_irrbb()
    assert res["status"] == "COMPUTED"
    assert "stressed_lcr_pct" in res["liquidity_metrics"]
    assert res["liquidity_metrics"]["stressed_lcr_pct"] > 0
    assert "delta_eve_pct" in res["irrbb_metrics"]

def test_xva_and_sacr():
    res = calculate_xva_and_sacr()
    assert res["status"] == "COMPUTED"
    assert "cva_amount" in res["xva_summary"]
    assert "ead_sacr_amount" in res["sa_ccr_metrics"]
    assert len(res["profiles"]["pfe_profile"]) > 0

def test_climate_ngfs():
    res = calculate_ngfs_climate_stress(active_scenario="Disorderly")
    assert res["status"] == "COMPUTED"
    assert res["portfolio_impact"]["total_climate_impairment_dollar"] > 0
    assert len(res["sector_breakdown"]) == 5

def test_quantum_qubo():
    res = simulate_quantum_qubo_optimization(cardinality_k=4)
    assert res["status"] == "CONVERGED"
    assert len(res["allocations"]) == 8
    selected = [a for a in res["allocations"] if a["selected_by_qubo"]]
    assert len(selected) == 4

def test_l2_orderbook():
    res = generate_l2_orderbook(symbol="NVDA")
    assert res["status"] == "STREAMING"
    assert len(res["bids"]) == 10
    assert len(res["asks"]) == 10
    assert "order_flow_imbalance_ofi" in res["microstructure_signals"]

def test_committee_debate():
    res = run_risk_committee_debate()
    assert res["status"] == "SESSION_CONCLUDED"
    assert len(res["transcript"]) == 4
    assert len(res["adopted_resolutions"]) == 3

def test_ccar_dfast_pack():
    res = generate_ccar_dfast_pack()
    assert res["status"] == "GENERATED"
    assert len(res["scenarios"]) == 2
    assert "audit_certification" in res
