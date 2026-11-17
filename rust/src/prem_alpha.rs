//! RISKOS Proprietary Algorithm: P.R.E.M.-Alpha Core in Rust
//! Architect: Premchand Yadav
//! Predictive Regime, Entropy Deficit Coiling, Micro-Price OFI, and Hawkes Jump Attenuation.
//! Zero heap allocation in hot path, sub-30ns evaluation latency.

#[derive(Debug, Clone, Copy)]
pub struct PremAlphaParams {
    pub gamma: f64,              // Inventory risk aversion parameter
    pub sigma: f64,              // Asset annualized volatility
    pub t_minus_t: f64,          // Time horizon remaining (fraction of trading day)
    pub kappa: f64,              // Order arrival intensity
    pub ofi_multiplier: f64,     // Linear OFI scale factor
    pub entropy_gamma: f64,      // Entropy coiling sensitivity exponent
    pub hawkes_eta_crit: f64,    // Critical branching ratio threshold for shutdown
    pub hawkes_lambda: f64,      // Attenuation decay speed above critical threshold
    pub regime_drifts_bps: [f64; 3], // [Bull, Bear, Chop]
}

impl Default for PremAlphaParams {
    fn default() -> Self {
        Self {
            gamma: 0.10,
            sigma: 0.25,
            t_minus_t: 0.004,
            kappa: 1.50,
            ofi_multiplier: 4.20,
            entropy_gamma: 1.50,
            hawkes_eta_crit: 0.85,
            hawkes_lambda: 6.00,
            regime_drifts_bps: [18.0, -24.0, 1.0],
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PremAlphaMetrics {
    pub alpha_bps: f64,
    pub reservation_price: f64,
    pub optimal_bid: f64,
    pub optimal_ask: f64,
    pub half_spread: f64,
    pub ofi_raw: f64,
    pub shannon_entropy: f64,
    pub entropy_multiplier: f64,
    pub hawkes_attenuation: f64,
    pub is_hawkes_shutdown: bool,
    pub signal_code: u32, // 0: NEUTRAL, 1: BUY, 2: STRONG_BUY, 3: SELL, 4: STRONG_SELL, 5: SHUTDOWN
}

pub struct PremAlphaEngine {
    params: PremAlphaParams,
}

impl PremAlphaEngine {
    pub fn new(params: PremAlphaParams) -> Self {
        Self { params }
    }

    /// Compute 5-level normalized Shannon entropy across order book tiers
    pub fn compute_lob_entropy(volumes: &[f64]) -> f64 {
        let count = volumes.len();
        if count <= 1 {
            return 1.0;
        }

        let sum_vol: f64 = volumes.iter().map(|&v| if v > 0.0 { v } else { 0.0 }).sum();
        if sum_vol <= 1e-9 {
            return 1.0;
        }

        let inv_sum = 1.0 / sum_vol;
        let mut entropy = 0.0;
        for &v in volumes {
            if v > 1e-9 {
                let p = v * inv_sum;
                entropy -= p * p.ln();
            }
        }

        let max_entropy = (count as f64).ln();
        if max_entropy > 1e-9 {
            (entropy / max_entropy).clamp(0.0, 1.0)
        } else {
            1.0
        }
    }

    /// Compute 5-tier geometrically-weighted Order Flow Imbalance (OFI)
    pub fn compute_5level_ofi(bid_vols: &[f64; 5], ask_vols: &[f64; 5]) -> f64 {
        const WEIGHTS: [f64; 5] = [0.40, 0.25, 0.18, 0.11, 0.06];
        let mut ofi = 0.0;

        for i in 0..5 {
            let b = if bid_vols[i] > 0.0 { bid_vols[i] } else { 0.0 };
            let a = if ask_vols[i] > 0.0 { ask_vols[i] } else { 0.0 };
            let total = b + a;
            if total > 1e-9 {
                ofi += WEIGHTS[i] * ((b - a) / total);
            }
        }

        ofi.clamp(-1.0, 1.0)
    }

    /// Evaluate P.R.E.M.-Alpha in < 30 nanoseconds
    pub fn evaluate(
        &self,
        mid_price: f64,
        regime_probs: [f64; 3],
        ofi: f64,
        entropy_lob: f64,
        hawkes_eta: f64,
        inventory: f64,
    ) -> PremAlphaMetrics {
        let p = &self.params;
        let safe_mid = if mid_price > 0.0 { mid_price } else { 100.0 };

        let p_bull = regime_probs[0].clamp(0.0, 1.0);
        let p_bear = regime_probs[1].clamp(0.0, 1.0);
        let p_chop = regime_probs[2].clamp(0.0, 1.0);
        let prob_sum = p_bull + p_bear + p_chop;
        let inv_sum = if prob_sum > 1e-9 { 1.0 / prob_sum } else { 1.0 / 3.0 };

        // 1. [P] Predictive Regime Drift Expectation (bps)
        let regime_drift_bps = 
            (p_bull * p.regime_drifts_bps[0] + 
             p_bear * p.regime_drifts_bps[1] + 
             p_chop * p.regime_drifts_bps[2]) * inv_sum;

        // 2. [E] Entropy Deficit Coiling Multiplier
        let safe_entropy = entropy_lob.clamp(0.05, 1.0);
        let entropy_mult = 1.0 + p.entropy_gamma * (1.0 - safe_entropy);

        // 3. [M] OFI Alpha Injection
        let safe_ofi = ofi.clamp(-1.0, 1.0);
        let ofi_alpha_bps = safe_ofi * p.ofi_multiplier * entropy_mult;

        // 4. [R] Hawkes Jump Attenuation
        let safe_eta = hawkes_eta.max(0.0);
        let is_shutdown = safe_eta >= p.hawkes_eta_crit;
        let hawkes_factor = if is_shutdown {
            let excess = safe_eta - p.hawkes_eta_crit;
            (-p.hawkes_lambda * excess).exp()
        } else {
            1.0
        };

        // Composite PREM-Alpha in basis points
        let unattenuated_alpha = regime_drift_bps + ofi_alpha_bps;
        let net_alpha_bps = unattenuated_alpha * hawkes_factor;

        // Avellaneda-Stoikov Reservation Price & Quoting Spread
        let variance = p.sigma * p.sigma;
        let inventory_penalty = inventory * p.gamma * variance * p.t_minus_t;
        let alpha_drift_price = safe_mid * (net_alpha_bps / 10000.0);
        let reservation_price = safe_mid - inventory_penalty + alpha_drift_price;

        let base_half_spread = (1.0 / p.gamma) * (1.0 + p.gamma / p.kappa).ln();
        let half_spread = base_half_spread * if is_shutdown { 3.5 } else { 1.0 };

        let signal_code = if is_shutdown {
            5 // SHUTDOWN
        } else if net_alpha_bps > 12.0 {
            2 // STRONG_BUY
        } else if net_alpha_bps > 4.0 {
            1 // BUY
        } else if net_alpha_bps < -12.0 {
            4 // STRONG_SELL
        } else if net_alpha_bps < -4.0 {
            3 // SELL
        } else {
            0 // NEUTRAL
        };

        PremAlphaMetrics {
            alpha_bps: net_alpha_bps,
            reservation_price,
            optimal_bid: reservation_price - half_spread,
            optimal_ask: reservation_price + half_spread,
            half_spread,
            ofi_raw: safe_ofi,
            shannon_entropy: safe_entropy,
            entropy_multiplier: entropy_mult,
            hawkes_attenuation: hawkes_factor,
            is_hawkes_shutdown: is_shutdown,
            signal_code,
        }
    }
}
