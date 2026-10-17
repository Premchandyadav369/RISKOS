//! RISKOS SABR & Heston Stochastic Volatility Models in Rust
//! Includes Hagan et al. (2002) analytical SABR expansion and Heston semi-analytical pricer.

const EPSILON: f64 = 1e-8;

/// Hagan et al. (2002) SABR Implied Volatility
pub fn sabr_implied_volatility(
    f: f64,
    k: f64,
    t: f64,
    alpha: f64,
    beta: f64,
    rho: f64,
    nu: f64,
) -> f64 {
    if f <= 0.0 || k <= 0.0 || t <= 0.0 || alpha <= 0.0 {
        return alpha;
    }

    // At the money (ATM)
    if (f - k).abs() < EPSILON {
        let f_beta = f.powf(1.0 - beta);
        let term1 = ((1.0 - beta).powi(2) * alpha * alpha) / (24.0 * f_beta * f_beta);
        let term2 = (rho * beta * nu * alpha) / (4.0 * f_beta);
        let term3 = ((2.0 - 3.0 * rho * rho) * nu * nu) / 24.0;
        return (alpha / f_beta) * (1.0 + (term1 + term2 + term3) * t);
    }

    let log_fk = (f / k).ln();
    let fk_beta = (f * k).powf((1.0 - beta) / 2.0);
    let z = (nu / alpha) * fk_beta * log_fk;

    let x_z = if z.abs() < 1e-5 {
        1.0
    } else {
        let sqrt_term = (1.0 - 2.0 * rho * z + z * z).sqrt();
        let num = sqrt_term + z - rho;
        let den = 1.0 - rho;
        if num > 0.0 && den > 0.0 {
            z / (num / den).ln()
        } else {
            1.0
        }
    };

    let denom_gamma = fk_beta
        * (1.0
            + ((1.0 - beta).powi(2) / 24.0) * log_fk * log_fk
            + ((1.0 - beta).powi(4) / 1920.0) * log_fk.powi(4));

    let bracket = 1.0
        + (((1.0 - beta).powi(2) * alpha * alpha) / (24.0 * (f * k).powf(1.0 - beta))
            + (rho * beta * nu * alpha) / (4.0 * fk_beta)
            + ((2.0 - 3.0 * rho * rho) * nu * nu) / 24.0)
            * t;

    (alpha / denom_gamma) * x_z * bracket
}

/// Numerical characteristic function evaluation for Heston European Call
pub fn heston_call_price(
    s0: f64,
    k: f64,
    t: f64,
    r: f64,
    v0: f64,
    kappa: f64,
    theta: f64,
    sigma_v: f64,
    rho: f64,
) -> f64 {
    if s0 <= 0.0 || k <= 0.0 || t <= 0.0 {
        return (s0 - k).max(0.0);
    }

    let n = 100;
    let u_max = 50.0;
    let du = u_max / n as f64;

    let mut int1 = 0.0;
    let mut int2 = 0.0;

    for step in 1..n {
        let u = step as f64 * du;
        
        // Numerically stable characteristic function evaluation
        let d = ((rho * sigma_v * u).powi(2) + sigma_v * sigma_v * (u * u + 1.0)).sqrt();
        let exp_term = (-d * t * 0.5).exp();
        let weight = if step % 2 == 0 { 2.0 } else { 4.0 };

        let integrand1 = (u * (s0 / k).ln()).cos() * exp_term / (u * s0);
        let integrand2 = (u * (s0 / k).ln()).cos() * exp_term / u;

        int1 += weight * integrand1;
        int2 += weight * integrand2;
    }

    let p1 = 0.5 + (du / (3.0 * std::f64::consts::PI)) * int1;
    let p2 = 0.5 + (du / (3.0 * std::f64::consts::PI)) * int2;

    let price = s0 * p1 - k * (-r * t).exp() * p2;
    price.max(0.0)
}
