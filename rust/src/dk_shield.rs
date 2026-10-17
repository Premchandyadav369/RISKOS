//! RISKOS Proprietary Algorithm 4: DK-Shield in Rust
//! Dynamic Kelly-CVaR Hyperbolic Drawdown Shield

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DkShieldResult {
    pub raw_kelly: f64,
    pub dynamic_kelly: f64,
    pub shield_multiplier: f64,
    pub current_drawdown: f64,
    pub remaining_budget: f64,
}

pub struct DkShieldEngine {
    pub d_max: f64,
    pub risk_free_rate: f64,
    pub psi: f64,
}

impl Default for DkShieldEngine {
    fn default() -> Self {
        Self {
            d_max: 0.15,
            risk_free_rate: 0.05,
            psi: 0.50,
        }
    }
}

impl DkShieldEngine {
    pub fn new(d_max: f64, risk_free_rate: f64, psi: f64) -> Self {
        Self { d_max, risk_free_rate, psi }
    }

    pub fn compute_sizing(
        &self,
        expected_return: f64,
        volatility: f64,
        current_nav: f64,
        high_water_mark: f64,
        cvar99: f64,
        vol_ratio: f64,
    ) -> DkShieldResult {
        let hwm = high_water_mark.max(1.0);
        let nav = current_nav.max(0.01);

        let current_drawdown = ((hwm - nav) / hwm).max(0.0);
        let var_asset = (volatility * volatility).max(1e-4);
        let raw_kelly = (expected_return - self.risk_free_rate) / var_asset;

        let remaining_budget = self.d_max - current_drawdown;
        let cvar_safe = cvar99.max(0.005);

        let shield = if remaining_budget > 0.0 {
            (remaining_budget / cvar_safe).tanh()
        } else {
            0.0
        };

        let vol_damping = 1.0 / (1.0 + self.psi * (vol_ratio - 1.0).max(0.0));
        let dynamic_kelly = (raw_kelly * shield * vol_damping).clamp(0.0, 2.0);

        DkShieldResult {
            raw_kelly,
            dynamic_kelly,
            shield_multiplier: shield,
            current_drawdown,
            remaining_budget,
        }
    }
}
