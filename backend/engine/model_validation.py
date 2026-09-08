"""
RISKOS Model Validation & Statistical Evaluation Engine
======================================================
Provides institutional-grade backtesting and model validation metrics:
1. Risk Model Validation:
   - Kupiec Proportion of Failures (POF) Likelihood Ratio Test
   - Christoffersen Independence Likelihood Ratio Test
   - Christoffersen Conditional Coverage Joint Test (LR_cc = LR_pof + LR_ind)
   - Basel Committee Traffic Light Classification (Green / Yellow / Red zones)
   - Quantile / Pinball Loss Scoring Functions for VaR
   - Regulatory Quadratic Loss Scoring for CVaR / Expected Shortfall
2. Forecasting Model Validation:
   - MAE, RMSE, sMAPE (Symmetric Mean Absolute Percentage Error)
   - MASE (Mean Absolute Scaled Error) against seasonal/naive baselines
   - Directional Accuracy (Hit Rate %) with exact Binomial p-value significance
   - Prediction Interval Coverage Probability (PICP) and Mean Width (MPIW)
3. Strategy & Performance Validation:
   - Probabilistic Sharpe Ratio (PSR) (Bailey & Lopez de Prado, 2012)
   - Deflated Sharpe Ratio (DSR) (Bailey & Lopez de Prado, 2014) for selection bias
"""

import numpy as np
import pandas as pd
from scipy.stats import chi2, binom, norm
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
    Tests whether the empirical exception frequency matches the nominal coverage level p = 1 - confidence.
    H0: Failure rate p_hat = p.
    LR_POF = -2 * ln( ( (1-p)^(N-x) * p^x ) / ( (1 - x/N)^(N-x) * (x/N)^x ) ) ~ chi2(1)
    """
    r = np.asarray(returns, dtype=float)
    v = np.asarray(var_series, dtype=float)
    
    if len(r) != len(v) or len(r) == 0:
        return {"error": "Invalid inputs: returns and var_series must have equal non-zero length"}
    
    p = 1.0 - confidence
    n = len(r)
    
    # Exceptions: return < var_series (assuming var_series is negative return threshold)
    exceptions = np.sum(r < v)
    x = int(exceptions)
    expected_exceptions = float(n * p)
    
    if x == 0:
        # 0 exceptions: likelihood ratio against null
        lr_stat = -2.0 * np.log((1.0 - p)**n)
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
            "decision": "ACCEPT H0 (Model Calibrated)" if p_value > 0.05 else "REJECT H0 (Miscalibrated)"
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
            "decision": "REJECT H0 (100% Breaches)"
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
        "decision": "ACCEPT H0 (Model Calibrated)" if p_value > 0.05 else "REJECT H0 (Miscalibrated)"
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
        return {"error": "Invalid inputs: returns and var_series must have equal length >= 2"}
    
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
            "decision": "ACCEPT H0 (No Exceptions)"
        }
        
    pi0 = n01 / (n00 + n01) if (n00 + n01) > 0 else 0.0
    pi1 = n11 / (n10 + n11) if (n10 + n11) > 0 else 0.0
    pi = (n01 + n11) / total_transitions
    
    eps = 1e-12
    # Log-likelihood under null (pi0 = pi1 = pi)
    log_L0 = 0.0
    if pi > 0 and (1.0 - pi) > 0:
        log_L0 = (n00 + n10) * np.log(max(eps, 1.0 - pi)) + (n01 + n11) * np.log(max(eps, pi))
        
    # Log-likelihood under alternative
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
        "decision": "ACCEPT H0 (Independent)" if p_value > 0.05 else "REJECT H0 (Clustering Detected)"
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
    if "error" in pof_res:
        return pof_res
        
    ind_res = christoffersen_independence_test(returns, var_series, confidence)
    if "error" in ind_res:
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
        "decision": "ACCEPT H0 (Adequate Conditional Coverage)" if p_value > 0.05 else "REJECT H0 (Inadequate Coverage)"
    }


def basel_traffic_light(
    n_exceptions: int,
    n_observations: int = 250,
    confidence: float = 0.99
) -> Dict[str, Any]:
    """
    Basel Committee on Banking Supervision (BCBS) Traffic Light Framework.
    For a 1-day 99% VaR over 250 trading days:
    - Green Zone: 0 to 4 exceptions (Cum Prob <= 89.22%), Multiplier k = 3.00
    - Yellow Zone: 5 to 9 exceptions (Cum Prob between 89.22% and 99.99%), Multiplier k = 3.40 to 3.85
    - Red Zone: >= 10 exceptions (Cum Prob >= 99.99%), Multiplier k = 4.00, Model Presumed Invalid
    """
    p = 1.0 - confidence
    x = int(n_exceptions)
    n = int(n_observations)
    
    # Cumulative binomial probability P(X <= x)
    cum_prob = float(binom.cdf(x, n, p))
    exact_prob = float(binom.pmf(x, n, p))
    
    # Standard Basel breakpoints for N=250, p=0.01:
    # 0-4: Green
    # 5: Yellow +0.40 (3.40)
    # 6: Yellow +0.50 (3.50)
    # 7: Yellow +0.65 (3.65)
    # 8: Yellow +0.75 (3.75)
    # 9: Yellow +0.85 (3.85)
    # 10+: Red +1.00 (4.00)
    
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
    Used by Basel/EBA to rank and evaluate quantile forecasts (e.g. 99% VaR, alpha = 0.01).
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
    
    # Breaches: r < v
    breaches = r < v
    if not np.any(breaches):
        return 0.0
    
    # Quadratic shortfall penalty relative to CVaR
    diff = (r[breaches] - c[breaches]) ** 2
    return float(np.sum(diff) / len(r))


# Backward compatibility aliases for existing RISKOS endpoints
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
    """
    Symmetric Mean Absolute Percentage Error (sMAPE):
    Bounded between 0% and 200%.
    sMAPE = 200/N * sum( |y - y_hat| / (|y| + |y_hat| + eps) )
    """
    denom = np.abs(y_true) + np.abs(y_pred) + 1e-10
    return float(np.mean(200.0 * np.abs(y_true - y_pred) / denom))

def mase(
    y_true: Union[np.ndarray, List[float]],
    y_pred: Union[np.ndarray, List[float]],
    y_train: Union[np.ndarray, List[float]],
    seasonality: int = 1
) -> float:
    """
    Mean Absolute Scaled Error (MASE) (Hyndman & Koehler, 2006):
    Scales MAE by the in-sample naive forecast error.
    MASE < 1 indicates forecast is superior to a naive baseline.
    """
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
    """
    Directional Accuracy (Hit Ratio %) with Binomial Statistical Significance.
    Tests whether directional calls outperform random 50% guessing.
    H0: Directional probability p = 0.50.
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    
    if baseline_level is not None:
        base = np.asarray(baseline_level, dtype=float)
        true_dir = np.sign(yt - base)
        pred_dir = np.sign(yp - base)
    else:
        # Consecutive direction
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
    # Two-sided binomial test against p=0.5
    # For one-sided test: P(X >= hits | p=0.5)
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
    """
    Prediction Interval Coverage Probability (PICP) and Mean Prediction Interval Width (MPIW).
    Evaluates calibrated uncertainty bands (e.g. 10th to 90th percentile -> 80% nominal coverage).
    """
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
    """
    Probabilistic Sharpe Ratio (PSR) (Bailey & Lopez de Prado, 2012):
    Calculates the probability that the true Sharpe Ratio exceeds a benchmark (e.g. 0.0),
    correcting for sample size, skewness, and fat-tailed excess kurtosis.
    PSR(SR*) = Phi( ( (SR - SR*) * sqrt(N - 1) ) / sqrt( 1 - gamma3*SR + ((gamma4 - 1)/4)*SR^2 ) )
    """
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
    """
    Deflated Sharpe Ratio (DSR) (Bailey & Lopez de Prado, 2014):
    Computes the probability that observed Sharpe Ratio is genuine after correcting for
    multiple hypothesis testing (data snooping / selection bias) across K trials.
    Benchmark SR* is derived as the expected maximum Sharpe ratio under the null hypothesis of no skill:
    E[max_k {SR_k}] ~= sqrt(2 * ln(K)) * (1 - EulerGamma / (2*ln(K))) * sigma_SR
    """
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
    
    # Euler-Mascheroni constant
    euler_gamma = 0.5772156649
    z_k = (1.0 - euler_gamma) * norm.ppf(1.0 - 1.0 / k) + euler_gamma * norm.ppf(1.0 - 1.0 / (k * np.e))
    expected_max_sr = float(sigma_sr * z_k)
    
    # Calculate PSR against the deflated null threshold
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
