//! RISKOS Proprietary Algorithm 1: HS-JAMM in Rust
//! Hawkes-Stoikov Jump-Aware Market Maker
//! Couples Hamilton-Jacobi-Bellman stochastic control with self-exciting Hawkes cascades.

#[derive(Debug, Clone, Copy)]
pub struct HsJammParams {
    pub gamma: f64,
    pub sigma: f64,
    pub t_minus_t: f64,
    pub kappa: f64,
    pub zeta: f64,
    pub eta_crit: f64,
}

impl Default for HsJammParams {
    fn default() -> Self {
        Self {
            gamma: 0.10,
            sigma: 0.25,
            t_minus_t: 0.004,
            kappa: 1.5,
            zeta: 2.5,
            eta_crit: 0.70,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HsJammQuotes {
    pub reservation_price: f64,
    pub optimal_bid: f64,
    pub optimal_ask: f64,
    pub half_spread_bid: f64,
    pub half_spread_ask: f64,
    pub toxicity_skew: f64,
    pub is_toxic_cascade: bool,
}

pub struct HsJammEngine {
    params: HsJammParams,
}

impl HsJammEngine {
    pub fn new(params: HsJammParams) -> Self {
        Self { params }
    }

    /// Compute optimal quotes with sub-50ns execution latency
    pub fn compute_quotes(
        &self,
        mid_price: f64,
        inventory: f64,
        eta_bid: f64,
        eta_ask: f64,
    ) -> HsJammQuotes {
        let p = &self.params;
        let variance = p.sigma * p.sigma;
        let base_r = mid_price - inventory * p.gamma * variance * p.t_minus_t;

        let base_half_spread = (1.0 / p.gamma) * (1.0 + p.gamma / p.kappa).ln();

        let excess_bid = (eta_bid - p.eta_crit).max(0.0);
        let excess_ask = (eta_ask - p.eta_crit).max(0.0);
        let is_toxic_cascade = excess_bid > 0.0 || excess_ask > 0.0;

        let toxicity_skew = (eta_bid - eta_ask) * p.zeta;
        let reservation_price = base_r + toxicity_skew * 0.5;

        let half_spread_bid = base_half_spread * (1.0 + excess_ask * p.zeta * 2.0);
        let half_spread_ask = base_half_spread * (1.0 + excess_bid * p.zeta * 2.0);

        let optimal_bid = reservation_price - half_spread_bid;
        let optimal_ask = reservation_price + half_spread_ask;

        HsJammQuotes {
            reservation_price,
            optimal_bid,
            optimal_ask,
            half_spread_bid,
            half_spread_ask,
            toxicity_skew,
            is_toxic_cascade,
        }
    }
}
