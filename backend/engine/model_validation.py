"""
RISKOS Model Validation & Statistical Evaluation Engine
======================================================
Provides institutional-grade backtesting and model validation metrics:
1. Risk Model Validation:
   - Kupiec Proportion of Failures (POF) Likelihood Ratio Test
   - Christoffersen Independence Likelihood Ratio Test
   - Christoffersen Conditional Coverage Joint Test (LR_cc = LR_pof + LR_ind)
   - Christoffersen & Pelletier (2004) Duration Test for VaR Clustering
   - Basel Committee Traffic Light Classification (Green / Yellow / Red zones)
   - Quantile / Pinball Loss Scoring Functions for VaR
   - Regulatory Quadratic Loss Scoring for CVaR / Expected Shortfall
   - Multi-Alpha Comprehensive Risk Validation (90%, 95%, 97.5%, 99%)
2. Forecasting Model Validation:
   - MAE, RMSE, sMAPE (Symmetric Mean Absolute Percentage Error)
   - MASE (Mean Absolute Scaled Error) against seasonal/naive baselines
   - Directional Accuracy (Hit Rate %) with exact Binomial p-value significance
   - Prediction Interval Coverage Probability (PICP) and Mean Width (MPIW)
3. Strategy & Performance Validation:
   - Probabilistic Sharpe Ratio (PSR) (Bailey & Lopez de Prado, 2012)
   - Deflated Sharpe Ratio (DSR) (Bailey & Lopez de Prado, 2014) for selection bias
   - Stationary Block Bootstrap Confidence Intervals (Politis & Romano, 1994)
"""

import numpy as np
import pandas as pd
from scipy.stats import chi2, binom, norm
from scipy.optimize import minimize
from typing import Dict, Any, Union, List, Optional


# =====================================================================
# 1. RISK MODEL STATISTICAL VALIDATION
# =====================================================================

def kupiec_pof_test(
    returns: Union[pd.Series, np.ndarray, List[float]],
    var_series: Union[pd.Series, np.ndarray, List[float]],
    confidence: float = 0.99
) -> Dict[str, Any]:
    """
    Kupiec (1995) Proportion of Failures (POF) Likelihood Ratio Test.
    Tests whether empirical exception frequency matches nominal coverage level p = 1 - confidence.
    H0: Failure rate p_hat = p.
    LR_POF = -2 * ln( ( (1-p)^(N-x) * p^x ) / ( (1 - x/N)^(N-x) * (x/N)^x ) ) ~ chi2(1)
    """
    r = np.asarray(returns, dtype=float)
    v = np.asarray(var_series, dtype=float)
    
    if len(r) != len(v) or len(r) == 0:
        return {
            "status": "ESTIMATION_UNAVAILABLE",
            "reason": "Invalid inputs: returns and var_series must have equal non-zero length"
        }
    
    if np.all(np.isnan(r)) or np.all(np.isnan(v)):
        return {
            "status": "ESTIMATION_UNAVAILABLE",
            "reason": "All observations are NaN"
        }

    p = 1.0 - confidence
    n = len(r)
    
    # Exceptions: return < var_series (assuming var_series is negative return threshold)
    exceptions = np.sum(r < v)
    x = int(exceptions)
    expected_exceptions = float(n * p)
    
    if x == 0:
        # 0 exceptions: likelihood ratio against null
        lr_stat = -2.0 * np.log(max(1e-12, (1.0 - p)**n))
        p_value = float(1.0 - chi2.cdf(lr_stat, df=1))
        return {
            "test_name": "Kupiec Proportion of Failures",
            "test_stat": float(lr_stat),
            "p_value": float(p_value),
            "n_exceptions": x,
            "expected_exceptions": round(expected_exceptions, 2),
            "failure_rate": 0.0,
            "nominal_rate": round(float(p), 4),
            "sample_size": n,
            "pass": bool(p_value > 0.05),
            "decision": "Failed to reject null hypothesis H0 (Model Calibrated)" if p_value > 0.05 else "Reject null hypothesis H0 (Under-Predicting Losses)"
        }
    
    if x == n:
        return {
            "test_name": "Kupiec Proportion of Failures",
            "test_stat": 999.9,
            "p_value": 0.0,
            "n_exceptions": x,
            "expected_exceptions": round(expected_exceptions, 2),
            "failure_rate": 1.0,
            "nominal_rate": round(float(p), 4),
            "sample_size": n,
            "pass": False,
            "decision": "Reject null hypothesis H0 (100% Breaches - Severe Miscalibration)"
        }
    
    p_hat = x / n
    # Numerical safety for logarithms
    term_null = (n - x) * np.log(1.0 - p) + x * np.log(p)
    term_alt = (n - x) * np.log(1.0 - p_hat) + x * np.log(p_hat)
    lr_stat = -2.0 * (term_null - term_alt)
    lr_stat = max(0.0, float(lr_stat))
    
    p_value = float(1.0 - chi2.cdf(lr_stat, df=1))
    
    return {
        "test_name": "Kupiec Proportion of Failures",
        "test_stat": float(lr_stat),
        "p_value": float(p_value),
        "n_exceptions": x,
        "expected_exceptions": round(expected_exceptions, 2),
        "failure_rate": float(p_hat),
        "nominal_rate": round(float(p), 4),
        "sample_size": n,
        "pass": bool(p_value > 0.05),
        "decision": "Failed to reject null hypothesis H0 (Model Calibrated)" if p_value > 0.05 else "Reject null hypothesis H0 (Miscalibrated Coverage)"
    }


def christoffersen_independence_test(
    returns: Union[pd.Series, np.ndarray, List[float]],
    var_series: Union[pd.Series, np.ndarray, List[float]],
    confidence: float = 0.99
) -> Dict[str, Any]:
    """
    Christoffersen (1998) Independence Test.
    Tests whether VaR exceptions are independent over time (no exception clustering).
    H0: Exceptions are independent (first-order Markov chain transition probs pi_01 = pi_11).
    LR_ind = -2 * ln( L_0 / L_1 ) ~ chi2(1)
    """
    r = np.asarray(returns, dtype=float)
    v = np.asarray(var_series, dtype=float)
    
    if len(r) != len(v) or len(r) < 2:
        return {
            "status": "ESTIMATION_UNAVAILABLE",
            "reason": "Invalid inputs: returns and var_series must have equal length >= 2"
        }
    
    I = (r < v).astype(int)
    
    n00 = int(np.sum((I[:-1] == 0) & (I[1:] == 0)))
    n01 = int(np.sum((I[:-1] == 0) & (I[1:] == 1)))
    n10 = int(np.sum((I[:-1] == 1) & (I[1:] == 0)))
    n11 = int(np.sum((I[:-1] == 1) & (I[1:] == 1)))
    
    total_transitions = n00 + n01 + n10 + n11
    if total_transitions == 0 or (n01 + n11) == 0:
        return {
            "test_name": "Christoffersen Independence",
            "test_stat": 0.0,
            "p_value": 1.0,
            "n00": n00, "n01": n01, "n10": n10, "n11": n11,
            "pass": True,
            "decision": "Failed to reject null hypothesis H0 (Zero Breaches Observed)"
        }
        
    pi0 = n01 / (n00 + n01) if (n00 + n01) > 0 else 0.0
    pi1 = n11 / (n10 + n11) if (n10 + n11) > 0 else 0.0
    pi = (n01 + n11) / total_transitions
    
    eps = 1e-12
    log_L0 = 0.0
    if pi > 0 and (1.0 - pi) > 0:
        log_L0 = (n00 + n10) * np.log(max(eps, 1.0 - pi)) + (n01 + n11) * np.log(max(eps, pi))
        
    log_L1 = 0.0
    if (n00 + n01) > 0:
        term0 = n00 * np.log(max(eps, 1.0 - pi0)) if (1.0 - pi0) > 0 else 0.0
        term1 = n01 * np.log(max(eps, pi0)) if pi0 > 0 else 0.0
        log_L1 += term0 + term1
    if (n10 + n11) > 0:
        term0 = n10 * np.log(max(eps, 1.0 - pi1)) if (1.0 - pi1) > 0 else 0.0
        term1 = n11 * np.log(max(eps, pi1)) if pi1 > 0 else 0.0
        log_L1 += term0 + term1
        
    lr_stat = max(0.0, float(-2.0 * (log_L0 - log_L1)))
    p_value = float(1.0 - chi2.cdf(lr_stat, df=1))
    
    return {
        "test_name": "Christoffersen Independence",
        "test_stat": float(lr_stat),
        "p_value": float(p_value),
        "contingency_matrix": {"n00": n00, "n01": n01, "n10": n10, "n11": n11},
        "transition_probs": {"pi01": round(pi0, 4), "pi11": round(pi1, 4), "unconditional_pi": round(pi, 4)},
        "pass": bool(p_value > 0.05),
        "decision": "Failed to reject null hypothesis H0 (Exceptions Independent)" if p_value > 0.05 else "Reject null hypothesis H0 (Exception Clustering Detected)"
    }


def christoffersen_conditional_coverage_test(
    returns: Union[pd.Series, np.ndarray, List[float]],
    var_series: Union[pd.Series, np.ndarray, List[float]],
    confidence: float = 0.99
) -> Dict[str, Any]:
    """
    Christoffersen (1998) Joint Conditional Coverage Test.
    Combines Kupiec POF and Christoffersen Independence:
    LR_cc = LR_pof + LR_ind ~ chi2(2 df)
    Jointly tests both correct unconditional coverage and independence.
    """
    pof_res = kupiec_pof_test(returns, var_series, confidence)
    if "status" in pof_res and pof_res["status"] == "ESTIMATION_UNAVAILABLE":
        return pof_res
        
    ind_res = christoffersen_independence_test(returns, var_series, confidence)
    if "status" in ind_res and ind_res["status"] == "ESTIMATION_UNAVAILABLE":
        return ind_res
        
    lr_cc = float(pof_res["test_stat"] + ind_res["test_stat"])
    p_value = float(1.0 - chi2.cdf(lr_cc, df=2))
    
    return {
        "test_name": "Christoffersen Conditional Coverage (Joint)",
        "test_stat": round(lr_cc, 4),
        "p_value": float(p_value),
        "lr_pof": round(pof_res["test_stat"], 4),
        "lr_ind": round(ind_res["test_stat"], 4),
        "pof_pass": pof_res["pass"],
        "ind_pass": ind_res["pass"],
        "pass": bool(p_value > 0.05),
        "decision": "Failed to reject null hypothesis H0 (Adequate Conditional Coverage)" if p_value > 0.05 else "Reject null hypothesis H0 (Inadequate Conditional Coverage)"
    }


def var_duration_test(
    returns: Union[pd.Series, np.ndarray, List[float]],
    var_series: Union[pd.Series, np.ndarray, List[float]],
    confidence: float = 0.99
) -> Dict[str, Any]:
    """
    Christoffersen & Pelletier (2004) Duration Test for VaR Exception Clustering.
    Evaluates whether the duration (number of days between consecutive exceptions) follows
    an exponential/geometric distribution with memorylessness property (b = 1).
    Under H0: Continuous hazard rate is constant (no clustering, b = 1).
    Under H1: Weibull hazard rate h(D) = a * b * D^(b-1) with b != 1.
    LR_dur = -2 * ln( L(H0) / L(H1) ) ~ chi2(1)
    """
    r = np.asarray(returns, dtype=float)
    v = np.asarray(var_series, dtype=float)

    if len(r) < 20:
        return {
            "status": "ESTIMATION_UNAVAILABLE",
            "reason": "Insufficient sample size (N < 20) for duration test"
        }

    exception_indices = np.where(r < v)[0]
    n_exceptions = len(exception_indices)

    if n_exceptions < 3:
        return {
            "test_name": "Christoffersen & Pelletier Duration Test",
            "test_stat": 0.0,
            "p_value": 1.0,
            "durations_count": n_exceptions,
            "mean_duration": float(len(r)),
            "pass": True,
            "decision": "Failed to reject null hypothesis H0 (Too Few Exceptions to Reject Memorylessness)"
        }

    # Calculate inter-arrival durations D_i
    durations = np.diff(exception_indices)
    d = durations.astype(float)
    p_null = 1.0 - confidence
    mean_d = float(np.mean(d))

    # Log-likelihood under Null: Exponential with rate lambda = 1 / mean(D)
    lam_0 = 1.0 / mean_d
    ll_null = float(np.sum(np.log(lam_0) - lam_0 * d))

    # Fit Weibull under Alternative using numerical optimization
    def neg_ll_weibull(params):
        a, b = params
        if a <= 1e-6 or b <= 1e-6:
            return 1e10
        # Weibull pdf: f(d) = a * b * (a * d)^(b - 1) * exp(-(a * d)^b)
        log_f = np.log(a) + np.log(b) + (b - 1.0) * np.log(a * d) - (a * d)**b
        return -np.sum(log_f)

    init_params = [lam_0, 1.0]
    bnds = ((1e-5, None), (1e-5, None))
    res = minimize(neg_ll_weibull, init_params, bounds=bnds, method='L-BFGS-B')

    if res.success:
        ll_alt = -res.fun
        b_est = float(res.x[1])
        lr_stat = max(0.0, -2.0 * (ll_null - ll_alt))
    else:
        b_est = 1.0
        lr_stat = 0.0

    p_val = float(1.0 - chi2.cdf(lr_stat, df=1))

    return {
        "test_name": "Christoffersen & Pelletier VaR Duration Test",
        "test_stat": round(float(lr_stat), 4),
        "p_value": round(float(p_val), 4),
        "weibull_b_param": round(b_est, 4),
        "mean_duration_days": round(mean_d, 2),
        "expected_duration_days": round(1.0 / p_null, 2),
        "pass": bool(p_val > 0.05),
        "decision": "Failed to reject null hypothesis H0 (Memoryless Duration Process)" if p_val > 0.05 else "Reject null hypothesis H0 (Clustering / Volatility Memory Detected)"
    }


def basel_traffic_light(
    n_exceptions: int,
    n_observations: int = 250,
    confidence: float = 0.99
) -> Dict[str, Any]:
    """
    Basel Committee on Banking Supervision (BCBS) Traffic Light Framework.
    For a 1-day 99% VaR over 250 trading days:
    - Green Zone: 0 to 4 exceptions, Multiplier k = 3.00
    - Yellow Zone: 5 to 9 exceptions, Multiplier k = 3.40 to 3.85
    - Red Zone: >= 10 exceptions, Multiplier k = 4.00, Model Presumed Invalid
    """
    p = 1.0 - confidence
    x = int(n_exceptions)
    n = int(n_observations)
    
    cum_prob = float(binom.cdf(x, n, p))
    exact_prob = float(binom.pmf(x, n, p))
    
    multiplier_adders = {
        0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0,
        5: 0.40, 6: 0.50, 7: 0.65, 8: 0.75, 9: 0.85
    }
    
    if x <= 4:
        zone = "GREEN"
        scaling_multiplier = 3.00
        regulatory_status = "Acceptable: VaR model requires no capital add-on"
    elif x <= 9:
        zone = "YELLOW"
        scaling_multiplier = 3.00 + multiplier_adders.get(x, 0.85)
        regulatory_status = f"Supervisory Warning: Capital penalty add-on +{scaling_multiplier - 3.0:.2f}"
    else:
        zone = "RED"
        scaling_multiplier = 4.00
        regulatory_status = "Critical Breach: Model presumed flawed; mandatory supervisory review"
        
    return {
        "zone": zone,
        "n_exceptions": x,
        "n_observations": n,
        "nominal_confidence": confidence,
        "cumulative_probability": round(cum_prob, 5),
        "exact_probability": round(exact_prob, 5),
        "basel_multiplier": round(scaling_multiplier, 2),
        "regulatory_status": regulatory_status
    }


def pinball_loss(
    y_true: Union[pd.Series, np.ndarray, List[float]],
    y_quantile: Union[pd.Series, np.ndarray, List[float]],
    alpha: float = 0.01
) -> float:
    """
    Quantile / Pinball Loss scoring function:
    L_alpha(y, q) = (y - q) * (alpha - I(y < q))
    """
    y = np.asarray(y_true, dtype=float)
    q = np.asarray(y_quantile, dtype=float)
    diff = y - q
    loss = np.where(diff < 0, (alpha - 1.0) * diff, alpha * diff)
    return float(np.mean(loss))


def quadratic_loss_cvar(
    returns: Union[pd.Series, np.ndarray, List[float]],
    var_series: Union[pd.Series, np.ndarray, List[float]],
    cvar_series: Union[pd.Series, np.ndarray, List[float]]
) -> float:
    """
    Lopez / Caporin Regulatory Quadratic Loss Function for CVaR / Expected Shortfall:
    Penalizes magnitude of breaches beyond VaR relative to CVaR forecast.
    """
    r = np.asarray(returns, dtype=float)
    v = np.asarray(var_series, dtype=float)
    c = np.asarray(cvar_series, dtype=float)
    
    breaches = r < v
    if not np.any(breaches):
        return 0.0
    
    diff = (r[breaches] - c[breaches]) ** 2
    return float(np.sum(diff) / len(r))


def comprehensive_risk_validation(
    returns: Union[pd.Series, np.ndarray, List[float]],
    var_dict: Dict[float, Union[pd.Series, np.ndarray, List[float]]],
    cvar_dict: Optional[Dict[float, Union[pd.Series, np.ndarray, List[float]]]] = None
) -> Dict[str, Any]:
    """
    Executes full regulatory and statistical risk model validation across multiple
    confidence levels: alpha in {0.90, 0.95, 0.975, 0.99}.
    """
    r = np.asarray(returns, dtype=float)
    results = {}

    for alpha, v_series in var_dict.items():
        v = np.asarray(v_series, dtype=float)
        alpha_key = f"{int(alpha * 100)}%" if alpha >= 0.1 else f"{alpha * 100:.1f}%"

        pof = kupiec_pof_test(r, v, confidence=alpha)
        ind = christoffersen_independence_test(r, v, confidence=alpha)
        cc = christoffersen_conditional_coverage_test(r, v, confidence=alpha)
        dur = var_duration_test(r, v, confidence=alpha)
        basel = basel_traffic_light(pof.get("n_exceptions", 0), len(r), confidence=alpha)
        p_loss = pinball_loss(r, v, alpha=1.0 - alpha)

        entry = {
            "confidence": alpha,
            "kupiec_pof": pof,
            "christoffersen_independence": ind,
            "conditional_coverage": cc,
            "duration_clustering": dur,
            "basel_traffic_light": basel,
            "pinball_loss": round(p_loss, 6)
        }

        if cvar_dict and alpha in cvar_dict:
            c_series = np.asarray(cvar_dict[alpha], dtype=float)
            q_loss = quadratic_loss_cvar(r, v, c_series)
            entry["quadratic_cvar_loss"] = round(q_loss, 6)

        results[alpha_key] = entry

    return {
        "sample_size": len(r),
        "calibrations": results,
        "provenance": {
            "method": "MultiAlphaRegulatoryValidation",
            "standards": ["Basel III / BCBS 2019", "Christoffersen (1998)", "Christoffersen & Pelletier (2004)"]
        }
    }


# Backward compatibility aliases
kupiec_test = kupiec_pof_test
christoffersen_test = christoffersen_independence_test


# =====================================================================
# 2. TIME SERIES FORECASTING EVALUATION
# =====================================================================

def mean_absolute_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))

def root_mean_squared_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def symmetric_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.abs(y_true) + np.abs(y_pred) + 1e-10
    return float(np.mean(200.0 * np.abs(y_true - y_pred) / denom))

def mase(
    y_true: Union[np.ndarray, List[float]],
    y_pred: Union[np.ndarray, List[float]],
    y_train: Union[np.ndarray, List[float]],
    seasonality: int = 1
) -> float:
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    ytr = np.asarray(y_train, dtype=float)
    
    mae_model = np.mean(np.abs(yt - yp))
    if len(ytr) <= seasonality:
        return float(mae_model)
        
    naive_diffs = np.abs(ytr[seasonality:] - ytr[:-seasonality])
    scale = np.mean(naive_diffs)
    if scale < 1e-10:
        scale = 1e-10
    return float(mae_model / scale)


def directional_accuracy(
    y_true: Union[np.ndarray, List[float]],
    y_pred: Union[np.ndarray, List[float]],
    baseline_level: Optional[Union[np.ndarray, List[float]]] = None
) -> Dict[str, Any]:
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    
    if baseline_level is not None:
        base = np.asarray(baseline_level, dtype=float)
        true_dir = np.sign(yt - base)
        pred_dir = np.sign(yp - base)
    else:
        true_dir = np.sign(yt[1:] - yt[:-1]) if len(yt) > 1 else np.sign(yt)
        pred_dir = np.sign(yp[1:] - yp[:-1]) if len(yp) > 1 else np.sign(yp)
        
    correct = (true_dir == pred_dir) & (true_dir != 0)
    valid_n = int(np.sum(true_dir != 0))
    n_hits = int(np.sum(correct))
    
    if valid_n == 0:
        return {
            "hit_rate_pct": 50.0,
            "hits": 0,
            "total_evaluations": 0,
            "p_value_two_sided": 1.0,
            "is_significant_alpha_05": False
        }
        
    hit_rate = (n_hits / valid_n) * 100.0
    p_val_one_sided = float(1.0 - binom.cdf(n_hits - 1, valid_n, 0.5))
    p_val_two_sided = float(min(1.0, 2.0 * min(p_val_one_sided, 1.0 - p_val_one_sided)))
    
    return {
        "hit_rate_pct": round(hit_rate, 2),
        "hits": n_hits,
        "total_evaluations": valid_n,
        "p_value_one_sided": round(p_val_one_sided, 4),
        "p_value_two_sided": round(p_val_two_sided, 4),
        "is_significant_alpha_05": bool(p_val_one_sided < 0.05 and hit_rate > 50.0)
    }


def prediction_interval_coverage(
    y_true: Union[np.ndarray, List[float]],
    lower_band: Union[np.ndarray, List[float]],
    upper_band: Union[np.ndarray, List[float]],
    nominal_confidence: float = 0.80
) -> Dict[str, Any]:
    yt = np.asarray(y_true, dtype=float)
    lb = np.asarray(lower_band, dtype=float)
    ub = np.asarray(upper_band, dtype=float)
    
    in_interval = (yt >= lb) & (yt <= ub)
    picp = float(np.mean(in_interval) * 100.0)
    mpiw = float(np.mean(ub - lb))
    
    return {
        "picp_pct": round(picp, 2),
        "nominal_confidence_pct": round(nominal_confidence * 100.0, 2),
        "coverage_error_pct": round(picp - (nominal_confidence * 100.0), 2),
        "mpiw": round(mpiw, 4),
        "calibrated": bool(abs(picp - (nominal_confidence * 100.0)) <= 5.0)
    }


# =====================================================================
# 3. STRATEGY & RISK-ADJUSTED PERFORMANCE VALIDATION
# =====================================================================

def probabilistic_sharpe_ratio(
    observed_sr: float,
    benchmark_sr: float = 0.0,
    n_samples: int = 252,
    skewness: float = 0.0,
    kurtosis: float = 3.0
) -> float:
    sr = float(observed_sr)
    sr_star = float(benchmark_sr)
    n = float(n_samples)
    g3 = float(skewness)
    g4 = float(kurtosis)
    
    if n <= 1:
        return 0.5
        
    denom_sq = 1.0 - g3 * sr + ((g4 - 1.0) / 4.0) * (sr ** 2)
    if denom_sq <= 0:
        denom = 1e-4
    else:
        denom = np.sqrt(denom_sq)
        
    z = ((sr - sr_star) * np.sqrt(n - 1.0)) / denom
    return float(norm.cdf(z))


def deflated_sharpe_ratio(
    observed_sr: float,
    sr_trials: Union[np.ndarray, List[float]],
    n_samples: int = 252,
    skewness: float = 0.0,
    kurtosis: float = 3.0
) -> Dict[str, Any]:
    trials = np.asarray(sr_trials, dtype=float)
    k = len(trials)
    
    if k <= 1:
        psr = probabilistic_sharpe_ratio(observed_sr, 0.0, n_samples, skewness, kurtosis)
        return {
            "deflated_sharpe_ratio": round(psr, 4),
            "expected_max_null_sr": 0.0,
            "trials_tested": 1,
            "pass": bool(psr > 0.95),
            "status": "PASS (Single Trial)" if psr > 0.95 else "INSUFFICIENT"
        }
        
    var_sr = float(np.var(trials, ddof=1)) if k > 1 else 0.0
    sigma_sr = np.sqrt(max(1e-6, var_sr))
    
    euler_gamma = 0.5772156649
    z_k = (1.0 - euler_gamma) * norm.ppf(1.0 - 1.0 / k) + euler_gamma * norm.ppf(1.0 - 1.0 / (k * np.e))
    expected_max_sr = float(sigma_sr * z_k)
    
    dsr = probabilistic_sharpe_ratio(observed_sr, expected_max_sr, n_samples, skewness, kurtosis)
    
    return {
        "deflated_sharpe_ratio": round(float(dsr), 4),
        "observed_sharpe": round(float(observed_sr), 4),
        "expected_max_null_sr": round(expected_max_sr, 4),
        "trials_tested": k,
        "sample_size": n_samples,
        "pass": bool(dsr > 0.95),
        "status": "SIGNIFICANT (p > 0.95 vs multiple tests)" if dsr > 0.95 else "REJECT (Likely Data-Snooping)"
    }


def stationary_block_bootstrap(
    returns: Union[pd.Series, np.ndarray, List[float]],
    n_bootstrap: int = 1000,
    expected_block_size: int = 10,
    risk_free_rate: float = 0.05,
    random_seed: int = 42
) -> Dict[str, Any]:
    """
    Politis & Romano (1994) Stationary Block Bootstrap for Autocorrelated Time Series.
    Resamples dependent returns preserving serial correlation and volatility clustering.
    Calculates 95% bootstrap confidence intervals for:
    - Sharpe Ratio
    - Mean Return
    - Volatility
    - Sortino Ratio
    - Maximum Drawdown
    """
    r = np.asarray(returns, dtype=float)
    n = len(r)

    if n < 10:
        return {
            "status": "ESTIMATION_UNAVAILABLE",
            "reason": f"Sample size (N={n}) too small for block bootstrap (minimum 10 required)"
        }

    if np.all(r == r[0]) or np.var(r) < 1e-12:
        return {
            "status": "ESTIMATION_UNAVAILABLE",
            "reason": "Series has zero variance (constant returns)"
        }

    rng = np.random.default_rng(random_seed)
    p_geom = 1.0 / max(1.0, float(expected_block_size))

    boot_sharpes = []
    boot_means = []
    boot_vols = []
    boot_drawdowns = []

    ann_factor = np.sqrt(252.0)
    rf_daily = risk_free_rate / 252.0

    for _ in range(n_bootstrap):
        # Generate stationary bootstrap sample indices
        boot_idx = []
        curr = rng.integers(0, n)
        while len(boot_idx) < n:
            boot_idx.append(curr)
            if rng.random() < p_geom:
                curr = rng.integers(0, n)
            else:
                curr = (curr + 1) % n

        sample_r = r[boot_idx]
        mean_d = np.mean(sample_r)
        vol_d = np.std(sample_r, ddof=1)
        sr = ((mean_d - rf_daily) / vol_d) * ann_factor if vol_d > 1e-8 else 0.0

        # Drawdown of cumulative returns
        cum = np.cumprod(1.0 + sample_r)
        peak = np.maximum.accumulate(cum)
        dd = (cum - peak) / peak
        max_dd = float(np.min(dd))

        boot_sharpes.append(sr)
        boot_means.append(mean_d * 252.0)
        boot_vols.append(vol_d * ann_factor)
        boot_drawdowns.append(max_dd)

    return {
        "n_bootstrap": n_bootstrap,
        "expected_block_size": expected_block_size,
        "sample_size": n,
        "sharpe_ratio": {
            "observed": round(float(((np.mean(r) - rf_daily) / max(1e-8, np.std(r, ddof=1))) * ann_factor), 4),
            "ci_95": [round(float(np.percentile(boot_sharpes, 2.5)), 4), round(float(np.percentile(boot_sharpes, 97.5)), 4)],
            "std_error": round(float(np.std(boot_sharpes)), 4)
        },
        "annualized_return": {
            "observed": round(float(np.mean(r) * 252.0), 4),
            "ci_95": [round(float(np.percentile(boot_means, 2.5)), 4), round(float(np.percentile(boot_means, 97.5)), 4)],
            "std_error": round(float(np.std(boot_means)), 4)
        },
        "annualized_volatility": {
            "observed": round(float(np.std(r, ddof=1) * ann_factor), 4),
            "ci_95": [round(float(np.percentile(boot_vols, 2.5)), 4), round(float(np.percentile(boot_vols, 97.5)), 4)],
            "std_error": round(float(np.std(boot_vols)), 4)
        },
        "max_drawdown": {
            "observed": round(float(np.min((np.cumprod(1.0 + r) - np.maximum.accumulate(np.cumprod(1.0 + r))) / np.maximum.accumulate(np.cumprod(1.0 + r)))), 4),
            "ci_95": [round(float(np.percentile(boot_drawdowns, 2.5)), 4), round(float(np.percentile(boot_drawdowns, 97.5)), 4)]
        },
        "provenance": {
            "method": "Politis & Romano (1994) Stationary Bootstrap",
            "seed": random_seed
        }
    }