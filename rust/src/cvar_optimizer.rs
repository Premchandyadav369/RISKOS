//! Convex Portfolio Simplex Optimization & Euclidean Projection in Rust
//! Implements Wang & Carreira-Perpinan (2013) exact simplex projection.

/// Euclidean projection onto the probability simplex:
/// Pi_Delta(v) = argmin_{w in Delta^{N-1}} 0.5 * ||w - v||^2
/// where Delta^{N-1} = { w in R^N : sum(w) = 1, w >= 0 }
pub fn project_simplex(v: &[f64], out_w: &mut [f64]) {
    let n = v.len();
    if n == 0 || out_w.len() < n {
        return;
    }
    if n == 1 {
        out_w[0] = 1.0;
        return;
    }

    // Sort vector descending
    let mut u: Vec<f64> = v.to_vec();
    u.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

    let mut cumsum = 0.0;
    let mut rho = 0.0;

    for i in 0..n {
        cumsum += u[i];
        let t = (cumsum - 1.0) / (i as f64 + 1.0);
        if u[i] - t > 0.0 {
            rho = t;
        }
    }

    let mut sum_w = 0.0;
    for i in 0..n {
        out_w[i] = (v[i] - rho).max(0.0);
        sum_w += out_w[i];
    }

    // Exact simplex normalization
    if sum_w > 0.0 {
        for i in 0..n {
            out_w[i] /= sum_w;
        }
    } else {
        let equal_weight = 1.0 / (n as f64);
        for i in 0..n {
            out_w[i] = equal_weight;
        }
    }
}

/// Projected Gradient Descent (PGD) for minimum variance portfolio:
/// min 0.5 * w^T Sigma w subject to sum(w) = 1, w >= 0
pub fn optimize_minimum_variance(cov_matrix: &[f64], n: usize, max_iterations: usize, out_weights: &mut [f64]) -> f64 {
    if n == 0 || cov_matrix.len() < n * n || out_weights.len() < n {
        return 0.0;
    }

    let mut w = vec![1.0 / (n as f64); n];
    let mut grad = vec![0.0; n];
    let mut step_size = 0.01;

    for _ in 0..max_iterations {
        // Compute gradient: grad = Sigma * w
        for i in 0..n {
            let mut sum = 0.0;
            for j in 0..n {
                sum += cov_matrix[i * n + j] * w[j];
            }
            grad[i] = sum;
        }

        // Gradient descent step: w_temp = w - step_size * grad
        let mut w_temp = vec![0.0; n];
        for i in 0..n {
            w_temp[i] = w[i] - step_size * grad[i];
        }

        // Euclidean projection onto probability simplex
        project_simplex(&w_temp, &mut w);
    }

    // Copy to output
    out_weights[..n].copy_from_slice(&w);

    // Compute final portfolio variance w^T Sigma w
    let mut portfolio_var = 0.0;
    for i in 0..n {
        for j in 0..n {
            portfolio_var += w[i] * cov_matrix[i * n + j] * w[j];
        }
    }

    portfolio_var
}
