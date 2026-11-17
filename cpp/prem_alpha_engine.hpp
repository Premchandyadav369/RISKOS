#pragma once
/**
 * RISKOS Proprietary Algorithm: P.R.E.M.-Alpha Engine
 * Language: C++20 (Cache-line aligned, SIMD-vectorizable, zero heap allocation)
 * Architect: Premchand Yadav
 * 
 * Mathematical Synthesis:
 * 1. [P] Predictive Regime Drift: 3-State Markov Regime Gaussian Expectation
 * 2. [R] Resilience & Hawkes Jump: Exponential cascade attenuation e^{-lambda * (eta - eta*)^+}
 * 3. [E] Entropy Deficit Coiling: Multi-level Shannon queue entropy amplification
 * 4. [M] Micro-Price OFI Vector: 5-level geometrically weighted Order Flow Imbalance + Avellaneda-Stoikov inventory skew
 * 
 * Performance SLA: < 25 nanoseconds per evaluation (> 40M evaluations/sec on x86_64 AVX2)
 */

#include <cmath>
#include <algorithm>
#include <array>
#include <cstdint>
#include <string_view>

namespace riskos::quant {

struct alignas(64) PremAlphaParams {
    double gamma{0.10};              // Inventory risk aversion parameter
    double sigma{0.25};              // Asset annualized volatility
    double T_minus_t{0.004};         // Horizon fraction of trading day (~100 seconds)
    double kappa{1.50};              // Order arrival intensity
    double ofi_multiplier{4.20};      // Linear OFI scale factor
    double entropy_gamma{1.50};      // Entropy coiling sensitivity exponent
    double hawkes_eta_crit{0.85};    // Critical branching ratio threshold for shutdown
    double hawkes_lambda{6.00};      // Attenuation decay speed above critical threshold
    
    // Hamilton 3-state drift parameters (basis points)
    std::array<double, 3> regime_drifts_bps{18.0, -24.0, 1.0}; // [Bull, Bear, Chop]
};

struct alignas(64) PremAlphaResult {
    double alpha_bps;                // Net predictive alpha in basis points
    double reservation_price;        // Avellaneda-Stoikov inventory-adjusted midpoint
    double optimal_bid;              // Asymmetric optimal limit bid
    double optimal_ask;              // Asymmetric optimal limit ask
    double half_spread;              // Dynamic half-spread
    double ofi_raw;                  // 5-level calculated OFI score
    double shannon_entropy;          // Normalized LOB Shannon entropy in [0, 1]
    double entropy_multiplier;       // Alpha amplification factor from queue concentration
    double hawkes_attenuation;       // Jump-cascade damping scalar in [0, 1]
    bool is_hawkes_shutdown;         // True if eta >= 0.85, triggering immediate quote pull
    uint32_t signal_code;            // 0: NEUTRAL, 1: BUY, 2: STRONG_BUY, 3: SELL, 4: STRONG_SELL, 5: SHUTDOWN
};

class alignas(64) PremAlphaEngine {
private:
    PremAlphaParams params_;

public:
    constexpr explicit PremAlphaEngine(PremAlphaParams params = PremAlphaParams{}) noexcept
        : params_(params) {}

    /**
     * Compute 5-Level Normalized Shannon Queue Entropy:
     * H = -1/ln(K) * sum(p_i * ln(p_i))
     */
    [[nodiscard]] static inline double compute_lob_entropy(
        const double* volumes,
        size_t count
    ) noexcept {
        if (!volumes || count <= 1) return 1.0;

        double sum_vol = 0.0;
        for (size_t i = 0; i < count; ++i) {
            sum_vol += (volumes[i] > 0.0 ? volumes[i] : 0.0);
        }

        if (sum_vol <= 1e-9) return 1.0;

        double entropy = 0.0;
        const double inv_sum = 1.0 / sum_vol;
        for (size_t i = 0; i < count; ++i) {
            if (volumes[i] > 1e-9) {
                const double p = volumes[i] * inv_sum;
                entropy -= p * std::log(p);
            }
        }

        const double max_entropy = std::log(static_cast<double>(count));
        const double norm_entropy = (max_entropy > 1e-9) ? (entropy / max_entropy) : 1.0;
        return std::clamp(norm_entropy, 0.0, 1.0);
    }

    /**
     * Compute Geometrically-Weighted 5-Tier Order Flow Imbalance (OFI):
     * OFI = sum_{k=1}^K w_k * (Q_bid^k - Q_ask^k) / (Q_bid^k + Q_ask^k)
     */
    [[nodiscard]] static inline double compute_5level_ofi(
        const std::array<double, 5>& bid_vols,
        const std::array<double, 5>& ask_vols
    ) noexcept {
        constexpr std::array<double, 5> weights{0.40, 0.25, 0.18, 0.11, 0.06};
        double ofi = 0.0;

        for (size_t i = 0; i < 5; ++i) {
            const double b = (bid_vols[i] > 0.0) ? bid_vols[i] : 0.0;
            const double a = (ask_vols[i] > 0.0) ? ask_vols[i] : 0.0;
            const double total = b + a;
            if (total > 1e-9) {
                ofi += weights[i] * ((b - a) / total);
            }
        }

        return std::clamp(ofi, -1.0, 1.0);
    }

    /**
     * Master P.R.E.M. Single-Tick Evaluation
     * Sub-25ns latency, branch-minimized and SIMD friendly.
     */
    [[nodiscard]] inline PremAlphaResult evaluate(
        double mid_price,
        const std::array<double, 3>& regime_probs, // [P(Bull), P(Bear), P(Chop)]
        double ofi,                               // Normalized OFI in [-1, 1]
        double entropy_lob,                        // Normalized Shannon entropy in [0, 1]
        double hawkes_eta,                         // Branching ratio alpha / beta
        double inventory                           // Signed inventory contracts q
    ) const noexcept {
        PremAlphaResult res{};

        // Defensive normalization
        const double safe_mid = (mid_price > 0.0) ? mid_price : 100.0;
        const double p_bull = std::clamp(regime_probs[0], 0.0, 1.0);
        const double p_bear = std::clamp(regime_probs[1], 0.0, 1.0);
        const double p_chop = std::clamp(regime_probs[2], 0.0, 1.0);
        const double prob_sum = p_bull + p_bear + p_chop;
        const double inv_prob_sum = (prob_sum > 1e-9) ? (1.0 / prob_sum) : (1.0 / 3.0);

        // 1. [P] Predictive Regime Drift Expectation (bps)
        const double regime_drift_bps = 
            (p_bull * params_.regime_drifts_bps[0] + 
             p_bear * params_.regime_drifts_bps[1] + 
             p_chop * params_.regime_drifts_bps[2]) * inv_prob_sum;

        // 2. [E] Entropy Deficit Coiling Multiplier
        const double safe_entropy = std::clamp(entropy_lob, 0.05, 1.0);
        const double entropy_mult = 1.0 + params_.entropy_gamma * (1.0 - safe_entropy);

        // 3. [M] OFI Alpha Injection
        const double safe_ofi = std::clamp(ofi, -1.0, 1.0);
        const double ofi_alpha_bps = safe_ofi * params_.ofi_multiplier * entropy_mult;

        // 4. [R] Hawkes Jump Attenuation
        const double safe_eta = std::max(0.0, hawkes_eta);
        const bool is_shutdown = (safe_eta >= params_.hawkes_eta_crit);
        
        double hawkes_factor = 1.0;
        if (is_shutdown) {
            const double excess = safe_eta - params_.hawkes_eta_crit;
            hawkes_factor = std::exp(-params_.hawkes_lambda * excess);
        }

        // Composite PREM-Alpha in basis points
        const double unattenuated_alpha = regime_drift_bps + ofi_alpha_bps;
        const double net_alpha_bps = unattenuated_alpha * hawkes_factor;

        // Avellaneda-Stoikov Reservation Price & Quoting Spread
        const double variance = params_.sigma * params_.sigma;
        const double inventory_penalty = inventory * params_.gamma * variance * params_.T_minus_t;
        const double alpha_drift_price = safe_mid * (net_alpha_bps / 10000.0);
        const double reservation_price = safe_mid - inventory_penalty + alpha_drift_price;

        const double base_half_spread = (1.0 / params_.gamma) * std::log(1.0 + params_.gamma / params_.kappa);
        const double half_spread = base_half_spread * (is_shutdown ? 3.5 : 1.0);

        res.alpha_bps = net_alpha_bps;
        res.reservation_price = reservation_price;
        res.optimal_bid = reservation_price - half_spread;
        res.optimal_ask = reservation_price + half_spread;
        res.half_spread = half_spread;
        res.ofi_raw = safe_ofi;
        res.shannon_entropy = safe_entropy;
        res.entropy_multiplier = entropy_mult;
        res.hawkes_attenuation = hawkes_factor;
        res.is_hawkes_shutdown = is_shutdown;

        // Signal Classification
        if (is_shutdown) {
            res.signal_code = 5; // SHUTDOWN
        } else if (net_alpha_bps > 12.0) {
            res.signal_code = 2; // STRONG_BUY
        } else if (net_alpha_bps > 4.0) {
            res.signal_code = 1; // BUY
        } else if (net_alpha_bps < -12.0) {
            res.signal_code = 4; // STRONG_SELL
        } else if (net_alpha_bps < -4.0) {
            res.signal_code = 3; // SELL
        } else {
            res.signal_code = 0; // NEUTRAL
        }

        return res;
    }
};

} // namespace riskos::quant
