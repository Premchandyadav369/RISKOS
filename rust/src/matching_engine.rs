//! RISKOS High-Frequency Trading (HFT) Matching Engine Core in Rust
//! Strict Price-Time Priority (FIFO) Limit Order Book with Sub-Microsecond Matching.

#[repr(u32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderSide {
    Buy = 1,
    Sell = 2,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Order {
    pub id: u64,
    pub price_ticks: u32,
    pub original_qty: u32,
    pub remaining_qty: u32,
    pub side: OrderSide,
    pub timestamp_ns: u64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct Trade {
    pub trade_id: u64,
    pub buy_order_id: u64,
    pub sell_order_id: u64,
    pub price_ticks: u32,
    pub qty: u32,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Default)]
pub struct L2Level {
    pub price_ticks: u32,
    pub total_volume: u32,
    pub order_count: u32,
}

pub struct LimitOrderBook {
    pub bids: Vec<Order>, // Sorted descending by price, then ascending by timestamp
    pub asks: Vec<Order>, // Sorted ascending by price, then ascending by timestamp
    pub trade_counter: u64,
    pub total_volume_matched: u64,
}

impl LimitOrderBook {
    pub fn new() -> Self {
        Self {
            bids: Vec::with_capacity(4096),
            asks: Vec::with_capacity(4096),
            trade_counter: 0,
            total_volume_matched: 0,
        }
    }

    pub fn reset(&mut self) {
        self.bids.clear();
        self.asks.clear();
        self.trade_counter = 0;
        self.total_volume_matched = 0;
    }

    /// Insert a limit order with Price-Time priority matching opposing side immediately
    pub fn insert_limit(&mut self, id: u64, side: OrderSide, price_ticks: u32, mut qty: u32, timestamp_ns: u64) -> Vec<Trade> {
        let mut executed_trades = Vec::new();

        if qty == 0 || price_ticks == 0 {
            return executed_trades;
        }

        match side {
            OrderSide::Buy => {
                // Cross against resting asks where ask.price_ticks <= order.price_ticks
                let mut ask_idx = 0;
                while ask_idx < self.asks.len() && qty > 0 {
                    let ask = &mut self.asks[ask_idx];
                    if ask.price_ticks > price_ticks {
                        break; // Best ask is higher than our buy limit
                    }

                    let match_qty = std::cmp::min(qty, ask.remaining_qty);
                    self.trade_counter += 1;
                    self.total_volume_matched += match_qty as u64;

                    executed_trades.push(Trade {
                        trade_id: self.trade_counter,
                        buy_order_id: id,
                        sell_order_id: ask.id,
                        price_ticks: ask.price_ticks,
                        qty: match_qty,
                    });

                    qty -= match_qty;
                    ask.remaining_qty -= match_qty;

                    if ask.remaining_qty == 0 {
                        self.asks.remove(ask_idx);
                    } else {
                        ask_idx += 1;
                    }
                }

                // If unfilled quantity remains, rest passively on the bids ladder
                if qty > 0 {
                    let new_order = Order {
                        id,
                        price_ticks,
                        original_qty: qty,
                        remaining_qty: qty,
                        side: OrderSide::Buy,
                        timestamp_ns,
                    };
                    // Insert keeping bids sorted descending by price, then ascending by timestamp
                    let insert_pos = self.bids.iter().position(|b| {
                        b.price_ticks < price_ticks || (b.price_ticks == price_ticks && b.timestamp_ns > timestamp_ns)
                    }).unwrap_or(self.bids.len());
                    self.bids.insert(insert_pos, new_order);
                }
            }

            OrderSide::Sell => {
                // Cross against resting bids where bid.price_ticks >= order.price_ticks
                let mut bid_idx = 0;
                while bid_idx < self.bids.len() && qty > 0 {
                    let bid = &mut self.bids[bid_idx];
                    if bid.price_ticks < price_ticks {
                        break; // Best bid is lower than our sell limit
                    }

                    let match_qty = std::cmp::min(qty, bid.remaining_qty);
                    self.trade_counter += 1;
                    self.total_volume_matched += match_qty as u64;

                    executed_trades.push(Trade {
                        trade_id: self.trade_counter,
                        buy_order_id: bid.id,
                        sell_order_id: id,
                        price_ticks: bid.price_ticks,
                        qty: match_qty,
                    });

                    qty -= match_qty;
                    bid.remaining_qty -= match_qty;

                    if bid.remaining_qty == 0 {
                        self.bids.remove(bid_idx);
                    } else {
                        bid_idx += 1;
                    }
                }

                // If unfilled quantity remains, rest passively on the asks ladder
                if qty > 0 {
                    let new_order = Order {
                        id,
                        price_ticks,
                        original_qty: qty,
                        remaining_qty: qty,
                        side: OrderSide::Sell,
                        timestamp_ns,
                    };
                    // Insert keeping asks sorted ascending by price, then ascending by timestamp
                    let insert_pos = self.asks.iter().position(|a| {
                        a.price_ticks > price_ticks || (a.price_ticks == price_ticks && a.timestamp_ns > timestamp_ns)
                    }).unwrap_or(self.asks.len());
                    self.asks.insert(insert_pos, new_order);
                }
            }
        }

        executed_trades
    }

    /// Cancel a resting order by ID in O(N) linear scan of active book
    pub fn cancel_order(&mut self, order_id: u64) -> bool {
        if let Some(pos) = self.bids.iter().position(|o| o.id == order_id) {
            self.bids.remove(pos);
            return true;
        }
        if let Some(pos) = self.asks.iter().position(|o| o.id == order_id) {
            self.asks.remove(pos);
            return true;
        }
        false
    }

    pub fn best_bid(&self) -> Option<u32> {
        self.bids.first().map(|b| b.price_ticks)
    }

    pub fn best_ask(&self) -> Option<u32> {
        self.asks.first().map(|a| a.price_ticks)
    }

    pub fn spread_ticks(&self) -> Option<u32> {
        match (self.best_bid(), self.best_ask()) {
            (Some(bb), Some(ba)) if ba >= bb => Some(ba - bb),
            _ => None,
        }
    }
}
