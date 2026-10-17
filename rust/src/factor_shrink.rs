//! RISKOS Proprietary Algorithm 3: F-Shrink in Rust
//! Factor-Shrunk Ledoit-Wolf Covariance Operator

#[derive(Debug, Clone, PartialEq)]
pub struct FactorShrinkResult {
    pub shrunk_cov: Vec<Vec<f64>>,
    pub delta_star: f64,
}

pub struct FactorShrinkEngine;

impl FactorShrinkEngine {
    pub fn shrink(
        sample_cov: &[Vec<f64>],
        factor_prior: &[Vec<f64>],
        t_observations: usize,
    ) -> FactorShrinkResult {
        let n = sample_cov.len();
        let t = t_observations.max(10) as f64;

        let mut sum_var_s = 0.0;
        let mut sum_dist_sq = 0.0;

        for i in 0..n {
            for j in 0..n {
                let s_ij = sample_cov[i][j];
                let f_ij = factor_prior[i][j];

                let var_s = (s_ij * s_ij) / t;
                sum_var_s += var_s;

                let diff = f_ij - s_ij;
                sum_dist_sq += diff * diff;
            }
        }

        let delta_star = if sum_var_s + sum_dist_sq > 1e-12 {
            (sum_var_s / (sum_var_s + sum_dist_sq)).clamp(0.0, 1.0)
        } else {
            0.5
        };

        let mut shrunk_cov = vec![vec![0.0; n]; n];
        for i in 0..n {
            for j in 0..n {
                shrunk_cov[i][j] = delta_star * factor_prior[i][j] + (1.0 - delta_star) * sample_cov[i][j];
            }
            if shrunk_cov[i][i] < 1e-8 {
                shrunk_cov[i][i] = 1e-4;
            }
        }

        FactorShrinkResult {
            shrunk_cov,
            delta_star,
        }
    }
}
