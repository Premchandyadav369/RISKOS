//! RISKOS Proprietary Algorithm 2: SE-MicroPrice in Rust
//! Shannon-Entropy L3 Queue Micro-Price Filter

const EPS: f64 = 1e-12;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SeMicroPriceResult {
    pub mid_price: f64,
    pub micro_price: f64,
    pub entropy_bid: f64,
    pub entropy_ask: f64,
    pub entropy_disparity: f64,
    pub next_tick_drift: f64,
    pub predicted_direction: f64, // +1.0 for UP, -1.0 for DOWN
}

pub struct SeMicroPriceEngine {
    omega: f64,
}

impl Default for SeMicroPriceEngine {
    fn default() -> Self {
        Self { omega: 0.50 }
    }
}

impl SeMicroPriceEngine {
    pub fn new(omega: f64) -> Self {
        Self { omega }
    }

    pub fn compute(
        &self,
        best_bid: f64,
        best_ask: f64,
        bid_qtys: &[f64],
        ask_qtys: &[f64],
    ) -> SeMicroPriceResult {
        let k = bid_qtys.len().min(ask_qtys.len());
        let mid_price = (best_bid + best_ask) * 0.5;
        let spread = (best_ask - best_bid).max(0.0001);

        if k == 0 {
            return SeMicroPriceResult {
                mid_price,
                micro_price: mid_price,
                entropy_bid: 0.0,
                entropy_ask: 0.0,
                entropy_disparity: 0.0,
                next_tick_drift: 0.0,
                predicted_direction: 0.0,
            };
        }

        let sum_b: f64 = bid_qtys[..k].iter().sum();
        let sum_a: f64 = ask_qtys[..k].iter().sum();

        if sum_b < EPS || sum_a < EPS {
            return SeMicroPriceResult {
                mid_price,
                micro_price: mid_price,
                entropy_bid: 0.0,
                entropy_ask: 0.0,
                entropy_disparity: 0.0,
                next_tick_drift: 0.0,
                predicted_direction: 0.0,
            };
        }

        let mut h_b = 0.0;
        let mut h_a = 0.0;
        for i in 0..k {
            let pb = bid_qtys[i] / sum_b;
            let pa = ask_qtys[i] / sum_a;
            if pb > EPS {
                h_b -= pb * pb.ln();
            }
            if pa > EPS {
                h_a -= pa * pa.ln();
            }
        }

        let ln_k = (k as f64).ln().max(1.0);
        let entropy_bid = (h_b / ln_k).clamp(0.0, 1.0);
        let entropy_ask = (h_a / ln_k).clamp(0.0, 1.0);
        let entropy_disparity = entropy_bid - entropy_ask;

        let volume_imbalance = (sum_b - sum_a) / (sum_b + sum_a);
        let next_tick_drift = (volume_imbalance * (spread * 0.5)) - (self.omega * entropy_disparity * spread);
        let micro_price = mid_price + next_tick_drift;
        let predicted_direction = if next_tick_drift >= 0.0 { 1.0 } else { -1.0 };

        SeMicroPriceResult {
            mid_price,
            micro_price,
            entropy_bid,
            entropy_ask,
            entropy_disparity,
            next_tick_drift,
            predicted_direction,
        }
    }
}
