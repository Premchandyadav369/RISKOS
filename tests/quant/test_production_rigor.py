"""
RISKOS Production Rigor & Mathematical Validation Suite
======================================================
Tests:
1. Purged & Embargoed Cross-Validation (PurgedKFold, CombinatorialPurgedCV)
2. VaR Duration Test (Christoffersen & Pelletier 2004)
3. Stationary Block Bootstrap (Politis & Romano 1994)
4. Unified Market State & Regime Research Matrix
5. Unified Portfolio Research Framework (8 Strategies)
6. Data Quality Engine & Hygiene Scoring
7. Institutional Multi-Factor Stress Testing
8. Transparent Black-Litterman Structural Matrices
9. Rolling-Origin OOS Evaluation with Zero Heuristic Multipliers
"""

import pytest
import numpy as np
import pandas as pd
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from engine.purged_cv import PurgedKFold, CombinatorialPurgedCV, get_train_times
from engine.model_validation import (
    var_duration_test, stationary_block_bootstrap,
    comprehensive_risk_validation, kupiec_pof_test
)
from engine.regime_research import MarketStateEngine, RegimeResearchMatrix
from engine.portfolio_research import PortfolioResearchSuite
from engine.data_quality import DataQualityEngine
from engine.stress import stress_test, custom_parametric_stress_test
from engine.optimizer import black_litterman_news_optimize, risk_parity_optimize
from engine.forecasting_ensemble import ForecastingEnsemble


def test_purged_kfold_no_leakage():
    """Verify PurgedKFold purges overlapping labels and applies embargo window."""
    dates = pd.date_range("2023-01-01", periods=100, freq="B")
    # 5-day forward prediction labels: [t, t+5]
    samples_info = pd.Series(dates + pd.Timedelta(days=5), index=dates)
    
    pkf = PurgedKFold(n_splits=5, samples_info=samples_info, embargo_pct=0.01)
    splits = list(pkf.split(samples_info))
    
    assert len(splits) == 5
    for train_idx, test_idx in splits:
        # Verify no intersection between train and test
        assert len(set(train_idx).intersection(set(test_idx))) == 0
        # Verify purged bars exist (train_size < total - test_size)
        assert len(train_idx) < (100 - len(test_idx))


def test_combinatorial_purged_cv_paths():
    """Verify CPCV produces C(N, k) combinations and evaluates distribution."""
    dates = pd.date_range("2023-01-01", periods=60, freq="B")
    samples_info = pd.Series(dates + pd.Timedelta(days=2), index=dates)
    
    cpcv = CombinatorialPurgedCV(n_splits=6, n_test_splits=2, samples_info=samples_info)
    splits = list(cpcv.split(samples_info))
    # 6 choose 2 = 15
    assert len(splits) == 15
    
    # Evaluate distribution on mock returns
    mock_returns = pd.Series(np.random.normal(0.001, 0.01, 60), index=dates)
    def dummy_eval(train, test):
        return {"sharpe": 1.5, "total_return": 0.10, "max_drawdown": -0.05}
        
    dist = cpcv.evaluate_cpcv_distribution(mock_returns, dummy_eval)
    assert dist["n_combinations"] == 15
    assert "sharpe_distribution" in dist
    assert dist["sharpe_distribution"]["mean"] == 1.5


def test_var_duration_clustering_test():
    """Verify Christoffersen & Pelletier hazard duration test."""
    rng = np.random.default_rng(42)
    returns = np.zeros(1000)
    var_series = np.full(1000, -0.02)
    
    # Independent Bernoulli draws with p = 0.01 (memoryless null process)
    breaches = rng.random(1000) < 0.01
    returns[breaches] = -0.05
    res_spaced = var_duration_test(returns, var_series, confidence=0.99)
    assert res_spaced["pass"] is True
    assert "Memoryless" in res_spaced["decision"] or "Failed to reject" in res_spaced["decision"]


def test_stationary_block_bootstrap():
    """Verify Politis & Romano stationary block bootstrap generates valid 95% CIs."""
    np.random.seed(42)
    r = np.random.normal(0.0005, 0.015, 252)
    boot = stationary_block_bootstrap(r, n_bootstrap=100, expected_block_size=10)
    
    assert boot["n_bootstrap"] == 100
    ci_sr = boot["sharpe_ratio"]["ci_95"]
    assert len(ci_sr) == 2
    assert ci_sr[0] < ci_sr[1]
    assert "observed" in boot["sharpe_ratio"]


def test_market_state_regime_matrix():
    """Verify multi-regime classification and empirical research matrix."""
    np.random.seed(42)
    prices = list(100.0 * np.cumprod(1.0 + np.random.normal(0.0005, 0.015, 250)))
    matrix = RegimeResearchMatrix.compute_regime_matrix(prices)
    
    assert "regimes_detected" in matrix
    assert "regime_performance_breakdown" in matrix
    assert "best_models_by_regime" in matrix
    assert matrix["data_span"]["total_bars"] == 249


def test_portfolio_research_comparison():
    """Verify PortfolioResearchSuite benchmarks 8 allocation strategies."""
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    df = pd.DataFrame(
        np.random.normal(0.0005, 0.015, (252, 4)),
        index=dates,
        columns=["AAPL", "MSFT", "GOOGL", "AMZN"]
    )
    suite = PortfolioResearchSuite(risk_free_rate=0.05)
    res = suite.compare_strategies(df)
    
    expected_strategies = [
        "EQUAL_WEIGHT", "MARKET_WEIGHT", "MIN_VARIANCE", "MAX_SHARPE",
        "HIERARCHICAL_RISK_PARITY", "RISK_PARITY", "BLACK_LITTERMAN", "CUSTOM_STRATEGY"
    ]
    for s in expected_strategies:
        assert s in res["strategies"]
        m = res["strategies"][s]["metrics"]
        assert "cagr_pct" in m
        assert "sharpe_ratio" in m
        assert "max_drawdown_pct" in m
        assert "annualized_turnover_pct" in m



def test_data_quality_engine():
    """Verify DataQualityEngine detects flaws and generates hygiene scores."""
    # 1. Clean series
    dates = pd.date_range("2023-01-01", periods=100, freq="B")
    clean_p = np.linspace(100, 150, 100)
    rep_clean = DataQualityEngine.audit_series(clean_p, dates=dates, ticker="CLEAN")
    assert rep_clean["data_quality_score"] == 100.0
    assert rep_clean["status"] == "PRISTINE"
    
    # 2. Defective series with zero price and NaN
    bad_p = np.array([100.0, 102.0, 0.0, np.nan, 105.0])
    rep_bad = DataQualityEngine.audit_series(bad_p, ticker="BAD")
    assert rep_bad["data_quality_score"] < 80.0
    assert rep_bad["defects_count"] >= 2


def test_multi_factor_stress_scenarios():
    """Verify stress test includes both classic 4 and 6 historical crisis scenarios."""
    np.random.seed(42)
    df = pd.DataFrame(np.random.normal(0.0005, 0.015, (252, 3)), columns=["A", "B", "C"])
    res = stress_test(df, [0.33, 0.33, 0.34], include_historical_crises=True)
    
    # Total scenarios should be 10 (4 classic + 6 crises)
    assert len(res["scenarios"]) == 10
    names = [s["name"] for s in res["scenarios"]]
    assert "Rates Shock (+300bps)" in names
    assert "1987 Black Monday Crash" in names
    assert "2008 Lehman Brothers Liquidity Crisis" in names
    assert "2020 COVID-19 Liquidity Shock" in names
    assert "2024 Yen Carry Trade Unwind" in names


def test_transparent_black_litterman_matrices():
    """Verify Black-Litterman exposes all structural matrices and prior types."""
    np.random.seed(42)
    df = pd.DataFrame(np.random.normal(0.0005, 0.015, (252, 3)), columns=["A", "B", "C"])
    res = black_litterman_news_optimize(df, prior_type="market_cap")
    
    assert "structural_matrices" in res
    sm = res["structural_matrices"]
    assert "prior_equilibrium_returns_pi" in sm
    assert "picking_matrix_P" in sm
    assert "view_vector_Q" in sm
    assert "view_uncertainty_omega" in sm
    assert "tau" in sm
    assert "optimizer_diagnostics" in res
    assert res["optimizer_diagnostics"]["covariance_condition_number"] > 0


def test_zero_heuristic_forecasting():
    """Verify rolling-origin evaluate runs without error and benchmarks against baselines."""
    np.random.seed(42)
    prices = list(100.0 * np.cumprod(1.0 + np.random.normal(0.0005, 0.014, 150)))
    fe = ForecastingEnsemble()
    eval_res = fe.rolling_origin_evaluate(prices, horizons=[1, 5], n_splits=3, min_train_size=60)
    
    assert eval_res["status"] == "VALIDATED_EMPIRICAL_BENCHMARK"
    assert "1d_horizon" in eval_res["results_by_horizon"]
    models = eval_res["results_by_horizon"]["1d_horizon"]["models"]
    assert "baseline_random_walk" in models
    assert "timesfm" in models
    assert "ensemble" in models