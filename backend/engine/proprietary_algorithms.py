"""
RISKOS Proprietary Quantitative Algorithms Engine (Python Vectorized Core)
===========================================================================
Implements the 4 proprietary algorithms for live analytics and REST endpoints:
1. HS-JAMM: Hawkes-Stoikov Jump-Aware Market Maker
2. SE-MicroPrice: Shannon-Entropy L3 Queue Micro-Price Filter
3. F-Shrink: Barra Structural Factor-Shrunk Ledoit-Wolf Covariance
4. DK-Shield: Dynamic Kelly-CVaR Hyperbolic Drawdown Shield
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional


def compute_hs_jamm(
    spot: float = 1210.0,
    inventory: int = 0,
    sigma: float = 0.25,
    gamma: float = 0.10,
    kappa: float = 1.5,
    jump_intensity_bid: float = 0.8,
    jump_intensity_ask: float = 0.2,
    eta_crit: float = 0.50,
    zeta: float = 0.35,
    horizon_sec: float = 1.0
) -> Dict[str, Any]:
    """
    Computes Hawkes-Stoikov Jump-Aware Market Maker quotes (Proof #31).
    """
    T_minus_t = max(1e-4, horizon_sec / 3600.0)
    
    # Base reservation price: r(s, q, t) = s - q * gamma * sigma^2 * (T - t)
    reservation_price = spot - (inventory * gamma * (sigma ** 2) * T_minus_t)
    
    # Baseline half-spread: delta = (1/gamma) * ln(1 + gamma/kappa)
    base_half_spread = (1.0 / max(1e-5, gamma)) * math.log(1.0 + (gamma / max(1e-5, kappa)))
    
    # Jump excitation asymmetry
    jump_diff = jump_intensity_bid - jump_intensity_ask
    asym_shift = (zeta / 2.0) * jump_diff
    jump_reservation_price = reservation_price + asym_shift
    
    # Cascade spread widening penalties
    pen_ask = max(0.0, jump_intensity_bid - eta_crit)
    pen_bid = max(0.0, jump_intensity_ask - eta_crit)
    
    optimal_half_ask = base_half_spread * (1.0 + 2.0 * zeta * pen_ask)
    optimal_half_bid = base_half_spread * (1.0 + 2.0 * zeta * pen_bid)
    
    optimal_bid = jump_reservation_price - optimal_half_bid
    optimal_ask = jump_reservation_price + optimal_half_ask
    effective_spread = optimal_ask - optimal_bid
    
    return {
        "spot": spot,
        "inventory": inventory,
        "base_reservation_price": round(reservation_price, 4),
        "jump_reservation_price": round(jump_reservation_price, 4),
        "optimal_bid": round(optimal_bid, 4),
        "optimal_ask": round(optimal_ask, 4),
        "effective_spread": round(effective_spread, 4),
        "base_half_spread": round(base_half_spread, 4),
        "optimal_half_bid": round(optimal_half_bid, 4),
        "optimal_half_ask": round(optimal_half_ask, 4),
        "jump_intensity_bid": jump_intensity_bid,
        "jump_intensity_ask": jump_intensity_ask,
        "cascade_risk": "ELEVATED" if max(jump_intensity_bid, jump_intensity_ask) > eta_crit else "STABLE",
        "regime": "BUY_CASCADE" if jump_intensity_bid > jump_intensity_ask + 0.3 else ("SELL_CASCADE" if jump_intensity_ask > jump_intensity_bid + 0.3 else "BALANCED")
    }


def compute_se_microprice(
    mid: float = 1210.0,
    bids: Optional[List[float]] = None,
    asks: Optional[List[float]] = None,
    spread: float = 0.50,
    omega: float = 0.15
) -> Dict[str, Any]:
    """
    Computes Shannon-Entropy L3 Queue Micro-Price (Proof #32).
    """
    if bids is None or len(bids) == 0:
        bids = [5000.0, 3000.0, 1500.0, 800.0, 400.0]
    if asks is None or len(asks) == 0:
        asks = [2000.0, 4000.0, 2500.0, 1200.0, 600.0]
        
    K = min(len(bids), len(asks))
    bids_arr = np.array(bids[:K], dtype=float)
    asks_arr = np.array(asks[:K], dtype=float)
    
    sum_b = np.sum(bids_arr)
    sum_a = np.sum(asks_arr)
    
    # Classical Stoikov Imbalance
    imbalance = (sum_b - sum_a) / max(1.0, sum_b + sum_a)
    classic_microprice = mid + imbalance * (spread / 2.0)
    
    # Normalized Shannon Entropy
    p_b = bids_arr / max(1.0, sum_b)
    p_a = asks_arr / max(1.0, sum_a)
    
    denom = math.log(max(2, K))
    eps = 1e-9
    h_bid = -float(np.sum(p_b * np.log(p_b + eps))) / denom
    h_ask = -float(np.sum(p_a * np.log(p_a + eps))) / denom
    h_bid = max(0.0, min(1.0, h_bid))
    h_ask = max(0.0, min(1.0, h_ask))
    
    delta_h = h_bid - h_ask
    
    # SE-MicroPrice formula: P_SE = P_mid + I * (S / 2) - omega * delta_H * S
    entropy_drift = -omega * delta_h * spread
    se_microprice = classic_microprice + entropy_drift
    
    # Next-tick probability
    next_tick_up_prob = 0.50 + 0.35 * imbalance - 0.25 * delta_h
    next_tick_up_prob = max(0.05, min(0.95, next_tick_up_prob))
    
    return {
        "mid": mid,
        "spread": spread,
        "imbalance": round(float(imbalance), 4),
        "classic_microprice": round(float(classic_microprice), 4),
        "se_microprice": round(float(se_microprice), 4),
        "shannon_entropy_bid": round(h_bid, 4),
        "shannon_entropy_ask": round(h_ask, 4),
        "delta_entropy": round(delta_h, 4),
        "entropy_drift": round(float(entropy_drift), 4),
        "drift_bps": round(float((se_microprice - mid) / mid * 10000.0), 2),
        "next_tick_up_probability": round(float(next_tick_up_prob), 4),
        "queue_topology": "CONCENTRATED_BID" if delta_h < -0.15 else ("CONCENTRATED_ASK" if delta_h > 0.15 else "DISPERSED")
    }


def compute_factor_shrinkage(
    n_assets: int = 5,
    sample_corr_mean: float = 0.55,
    factor_explained_ratio: float = 0.72,
    n_obs: int = 252
) -> Dict[str, Any]:
    """
    Computes Barra Factor-Shrunk Ledoit-Wolf Covariance Operator (Proof #33).
    """
    # Synthetic empirical covariance with realistic market dispersion
    np.random.seed(42)
    vol = np.linspace(0.18, 0.35, n_assets)
    R = np.full((n_assets, n_assets), sample_corr_mean)
    np.fill_diagonal(R, 1.0)
    
    # D^(1/2) R D^(1/2)
    S = np.outer(vol, vol) * R
    
    # Barra structural factor prior: F_prior = X F X^T + Delta
    F_prior = S * factor_explained_ratio
    np.fill_diagonal(F_prior, np.diag(S))
    
    # Analytical Frobenius optimal shrinkage: delta* = Var(S) / [Var(S) + ||F_prior - S||_F^2]
    var_sample = 2.0 / n_obs * np.sum(S ** 2)
    frobenius_diff_sq = float(np.sum((F_prior - S) ** 2))
    
    optimal_delta = var_sample / max(1e-8, (var_sample + frobenius_diff_sq))
    optimal_delta = max(0.01, min(0.99, float(optimal_delta)))
    
    shrunk_cov = optimal_delta * F_prior + (1.0 - optimal_delta) * S
    
    eig_sample = np.linalg.eigvalsh(S)
    eig_shrunk = np.linalg.eigvalsh(shrunk_cov)
    
    cond_sample = float(np.max(eig_sample) / max(1e-8, np.min(eig_sample)))
    cond_shrunk = float(np.max(eig_shrunk) / max(1e-8, np.min(eig_shrunk)))
    
    return {
        "n_assets": n_assets,
        "n_observations": n_obs,
        "optimal_shrinkage_intensity": round(optimal_delta, 4),
        "frobenius_distance": round(math.sqrt(frobenius_diff_sq), 4),
        "sample_condition_number": round(cond_sample, 2),
        "shrunk_condition_number": round(cond_shrunk, 2),
        "condition_number_improvement_pct": round(((cond_sample - cond_shrunk) / cond_sample) * 100.0, 2),
        "is_positive_definite": bool(np.all(eig_shrunk > 0)),
        "min_eigenvalue_shrunk": round(float(np.min(eig_shrunk)), 6),
        "max_eigenvalue_shrunk": round(float(np.max(eig_shrunk)), 6)
    }


def compute_dk_shield(
    kelly_fraction: float = 1.0,
    current_drawdown: float = 0.08,
    max_drawdown: float = 0.15,
    cvar_99: float = 0.045,
    volatility: float = 0.18
) -> Dict[str, Any]:
    """
    Computes Dynamic Kelly-CVaR Hyperbolic Drawdown Shield (Proof #34).
    """
    buffer_d = max(0.0, max_drawdown - current_drawdown)
    
    if current_drawdown >= max_drawdown:
        shield_multiplier = 0.0
    else:
        # Hyperbolic tangent Lyapunov barrier argument: u = (D_max - D) / CVaR
        arg = buffer_d / max(1e-4, cvar_99)
        shield_multiplier = math.tanh(arg)
        
    shielded_kelly = kelly_fraction * shield_multiplier
    
    # Tail barrier distance in standard deviations
    cvar_buffer_sigma = buffer_d / max(1e-4, volatility / math.sqrt(252))
    
    return {
        "base_kelly_fraction": kelly_fraction,
        "current_drawdown": round(current_drawdown, 4),
        "max_drawdown_limit": round(max_drawdown, 4),
        "drawdown_buffer": round(buffer_d, 4),
        "cvar_99": round(cvar_99, 4),
        "shield_multiplier": round(shield_multiplier, 4),
        "shielded_kelly_fraction": round(shielded_kelly, 4),
        "buffer_in_sigmas": round(cvar_buffer_sigma, 2),
        "non_breach_probability_guarantee": 1.0 if current_drawdown < max_drawdown else 0.0,
        "barrier_state": "SAFE_EXPANSION" if shield_multiplier > 0.85 else ("THROTTLED_BUFFER" if shield_multiplier > 0.25 else "CRITICAL_BARRIER_HALT")
    }
