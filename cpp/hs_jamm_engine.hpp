#pragma once
/**
 * RISKOS Proprietary Algorithm 1: HS-JAMM
 * Hawkes-Stoikov Jump-Aware Market Maker
 * Language: C++20
 * 
 * Mathematical Formulation:
 * 1. Reservation Price: r(s, q, t) = s - q * gamma * sigma^2 * (T - t)
 * 2. Hawkes Jump Cascades: lambda_s(t) = mu_s + sum(alpha * exp(-beta * dt))
 * 3. Branching Ratio: eta_s = alpha_s / beta_s
 * 4. Toxic Flow Asymmetric Fade:
 *    - When eta_a > 0.70 (toxic sell sweep): widen bid half-spread and lower r
 *    - When eta_b > 0.70 (toxic buy sweep): widen ask half-spread and raise r
 * 
 * Performance: < 50 nanoseconds per quote calculation on modern x86_64
 */

#include <cmath>
#include <algorithm>
#include <cstdint>

namespace riskos::quant {

struct alignas(64) HsJammParams {
    double gamma{0.10};        // Inventory risk aversion parameter
    double sigma{0.25};        // Asset annualized volatility
    double T_minus_t{0.004};   // Time horizon remaining (fraction of trading day)
    double kappa{1.5};         // Base order arrival intensity
    double zeta{2.5};          // Jump-cascade spread penalty coefficient
    double eta_crit{0.70};     // Critical branching ratio threshold
};

struct alignas(64) HsJammQuotes {
    double reservation_price;
    double optimal_bid;
    double optimal_ask;
    double half_spread_bid;
    double half_spread_ask;
    double toxicity_skew;
    bool is_toxic_cascade;
};

class alignas(64) HsJammEngine {
private:
    HsJammParams params_;

public:
    explicit HsJammEngine(HsJammParams params = HsJammParams{}) noexcept
        : params_(params) {}

    /**
     * Compute Jump-Aware Quotes in < 50 nanoseconds
     * @param mid_price Current best mid price
     * @param inventory Net position inventory q (contracts)
     * @param eta_bid Real-time buy-side Hawkes branching ratio
     * @param eta_ask Real-time sell-side Hawkes branching ratio
     */
    [[nodiscard]] inline HsJammQuotes compute_quotes(
        double mid_price,
        double inventory,
        double eta_bid,
        double eta_ask
    ) const noexcept {
        HsJammQuotes out{};

        // 1. Classic Avellaneda-Stoikov Reservation Price
        const double variance = params_.sigma * params_.sigma;
        const double base_r = mid_price - inventory * params_.gamma * variance * params_.T_minus_t;

        // 2. Base Half-Spread
        const double base_half_spread = (1.0 / params_.gamma) * std::log(1.0 + params_.gamma / params_.kappa);

        // 3. Hawkes Jump Cascades & Asymmetric Toxicity Skew
        const double excess_bid = std::max(0.0, eta_bid - params_.eta_crit);
        const double excess_ask = std::max(0.0, eta_ask - params_.eta_crit);
        out.is_toxic_cascade = (excess_bid > 0.0 || excess_ask > 0.0);

        // Asymmetric toxicity skew: net pressure towards higher or lower prices
        out.toxicity_skew = (eta_bid - eta_ask) * params_.zeta;

        // Skew reservation price towards toxicity direction to exit bad inventory
        out.reservation_price = base_r + out.toxicity_skew * 0.5;

        // Asymmetrically widen the vulnerable side
        out.half_spread_bid = base_half_spread * (1.0 + excess_ask * params_.zeta * 2.0);
        out.half_spread_ask = base_half_spread * (1.0 + excess_bid * params_.zeta * 2.0);

        out.optimal_bid = out.reservation_price - out.half_spread_bid;
        out.optimal_ask = out.reservation_price + out.half_spread_ask;

        return out;
    }
};

} // namespace riskos::quant
