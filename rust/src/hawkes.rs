//! Hawkes Self-Exciting Point Process & Liquidation Radar in Rust
//! Models endogenous order arrival clustering and systemic crash cascades.

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct HawkesMetrics {
    pub baseline_mu: f64,
    pub alpha_excitation: f64,
    pub beta_decay: f64,
    pub branching_ratio: f64,
    pub current_intensity: f64,
    pub is_critical: bool,
}

pub struct HawkesProcess {
    pub mu: f64,
    pub alpha: f64,
    pub beta: f64,
    pub last_time_sec: f64,
    pub recursive_r: f64,
}

impl HawkesProcess {
    pub fn new(mu: f64, alpha: f64, beta: f64) -> Self {
        Self {
            mu,
            alpha,
            beta,
            last_time_sec: 0.0,
            recursive_r: 0.0,
        }
    }

    /// Branching ratio eta = alpha / beta (expected number of daughter events per parent event)
    pub fn branching_ratio(&self) -> f64 {
        if self.beta > 0.0 {
            self.alpha / self.beta
        } else {
            0.0
        }
    }

    /// Evaluate intensity lambda(t) at arbitrary forward time t
    pub fn intensity_at(&self, t_sec: f64) -> f64 {
        let dt = (t_sec - self.last_time_sec).max(0.0);
        let decayed_r = self.recursive_r * (-self.beta * dt).exp();
        self.mu + self.alpha * decayed_r
    }

    /// Ingest a trade/order event at time t_sec with O(1) recursive update
    pub fn register_event(&mut self, t_sec: f64) -> f64 {
        let dt = (t_sec - self.last_time_sec).max(0.0);
        // R(t_i) = exp(-beta * dt) * R(t_{i-1}) + 1
        self.recursive_r = self.recursive_r * (-self.beta * dt).exp() + 1.0;
        self.last_time_sec = t_sec;
        self.mu + self.alpha * self.recursive_r
    }

    pub fn get_metrics(&self) -> HawkesMetrics {
        let eta = self.branching_ratio();
        HawkesMetrics {
            baseline_mu: self.mu,
            alpha_excitation: self.alpha,
            beta_decay: self.beta,
            branching_ratio: eta,
            current_intensity: self.mu + self.alpha * self.recursive_r,
            is_critical: eta >= 1.0,
        }
    }
}
