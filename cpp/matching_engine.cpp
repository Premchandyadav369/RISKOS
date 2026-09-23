/**
 * RISKOS High-Frequency Trading (HFT) Matching Engine Core
 * Language: C++20
 * 
 * Features:
 * - Cache-aligned limit order book architecture (alignas(64))
 * - Zero-allocation fast-path matching (preallocated memory pool)
 * - Strict Price-Time Priority (FIFO) matching algorithm
 * - Constant-time O(1) order cancellation via indexed slot table
 * - Market order execution crossing resting depth with minimum slippage
 * - Extern "C" bindings for compilation to WebAssembly (WASM) via clang/emscripten
 * 
 * Performance Target: < 500 nanoseconds tick-to-trade on modern x86_64 / WebAssembly
 */

#include <cstdint>
#include <cstring>
#include <algorithm>

// Cache line size for modern microarchitectures
constexpr size_t CACHE_LINE = 64;
constexpr uint32_t MAX_ORDERS = 65536;
constexpr uint32_t MAX_PRICE_LEVELS = 4096;

enum OrderSide : uint32_t {
    SIDE_BUY = 1,
    SIDE_SELL = 2
};

enum OrderType : uint32_t {
    TYPE_LIMIT = 1,
    TYPE_MARKET = 2
};

enum OrderStatus : uint32_t {
    STATUS_ACTIVE = 1,
    STATUS_FILLED = 2,
    STATUS_CANCELLED = 3
};

#pragma pack(push, 1)
struct alignas(32) Order {
    uint64_t id;             // Unique 64-bit client/engine order ID
    uint32_t price_cents;    // Price in integer cents/ticks (avoids floating point errors)
    uint32_t original_qty;   // Initial order volume
    uint32_t remaining_qty;  // Remaining unfilled volume
    uint32_t side;           // 1 = BUY, 2 = SELL
    uint32_t status;         // Active, Filled, Cancelled
    uint32_t next_order_idx; // Intrusive FIFO linked-list pointer
    uint32_t prev_order_idx; // Intrusive FIFO linked-list pointer
};

struct alignas(32) PriceLevel {
    uint32_t price_cents;
    uint32_t total_volume;
    uint32_t order_count;
    uint32_t head_order_idx; // Oldest resting order at this price (FIFO queue head)
    uint32_t tail_order_idx; // Newest resting order at this price (FIFO queue tail)
};
#pragma pack(pop)

class alignas(CACHE_LINE) MatchingEngine {
private:
    // Pre-allocated order pool (zero dynamic heap allocations during live trading)
    Order order_pool[MAX_ORDERS];
    uint32_t next_free_slot;

    // Price level ladders
    PriceLevel buy_levels[MAX_PRICE_LEVELS];
    uint32_t buy_level_count;

    PriceLevel sell_levels[MAX_PRICE_LEVELS];
    uint32_t sell_level_count;

    // Fast order index: Map order ID to order pool slot
    uint32_t id_to_slot[MAX_ORDERS];

    uint64_t total_trades_executed;
    uint64_t total_volume_matched;

public:
    MatchingEngine() {
        reset();
    }

    void reset() {
        std::memset(order_pool, 0, sizeof(order_pool));
        std::memset(buy_levels, 0, sizeof(buy_levels));
        std::memset(sell_levels, 0, sizeof(sell_levels));
        std::memset(id_to_slot, 0, sizeof(id_to_slot));
        next_free_slot = 1; // Slot 0 reserved as NULL
        buy_level_count = 0;
        sell_level_count = 0;
        total_trades_executed = 0;
        total_volume_matched = 0;
    }

    // Insert limit order with Price-Time priority or cross opposing book
    uint32_t insert_limit(uint64_t id, uint32_t side, uint32_t price_cents, uint32_t qty) {
        if (qty == 0 || next_free_slot >= MAX_ORDERS) return 0;

        uint32_t remaining = qty;

        // 1. Cross opposing side if marketable (Aggressive Fill)
        if (side == SIDE_BUY) {
            // Match against resting SELL orders (lowest price first)
            while (remaining > 0 && sell_level_count > 0 && sell_levels[0].price_cents <= price_cents) {
                PriceLevel& best_ask = sell_levels[0];
                uint32_t curr_slot = best_ask.head_order_idx;

                while (remaining > 0 && curr_slot != 0) {
                    Order& resting = order_pool[curr_slot];
                    uint32_t fill_qty = std::min(remaining, resting.remaining_qty);
                    
                    remaining -= fill_qty;
                    resting.remaining_qty -= fill_qty;
                    best_ask.total_volume -= fill_qty;
                    total_volume_matched += fill_qty;
                    total_trades_executed++;

                    if (resting.remaining_qty == 0) {
                        resting.status = STATUS_FILLED;
                        curr_slot = resting.next_order_idx;
                        best_ask.head_order_idx = curr_slot;
                        best_ask.order_count--;
                    } else {
                        break;
                    }
                }

                // If best ask level is completely exhausted, shift ask levels
                if (best_ask.order_count == 0 || best_ask.total_volume == 0) {
                    remove_sell_level(0);
                }
            }
        } else {
            // Match against resting BUY orders (highest price first)
            while (remaining > 0 && buy_level_count > 0 && buy_levels[0].price_cents >= price_cents) {
                PriceLevel& best_bid = buy_levels[0];
                uint32_t curr_slot = best_bid.head_order_idx;

                while (remaining > 0 && curr_slot != 0) {
                    Order& resting = order_pool[curr_slot];
                    uint32_t fill_qty = std::min(remaining, resting.remaining_qty);

                    remaining -= fill_qty;
                    resting.remaining_qty -= fill_qty;
                    best_bid.total_volume -= fill_qty;
                    total_volume_matched += fill_qty;
                    total_trades_executed++;

                    if (resting.remaining_qty == 0) {
                        resting.status = STATUS_FILLED;
                        curr_slot = resting.next_order_idx;
                        best_bid.head_order_idx = curr_slot;
                        best_bid.order_count--;
                    } else {
                        break;
                    }
                }

                // If best bid level is exhausted, shift bid levels
                if (best_bid.order_count == 0 || best_bid.total_volume == 0) {
                    remove_buy_level(0);
                }
            }
        }

        // 2. If unexecuted volume remains, rest on book (Passive limit order)
        if (remaining > 0) {
            uint32_t slot = next_free_slot++;
            Order& ord = order_pool[slot];
            ord.id = id;
            ord.price_cents = price_cents;
            ord.original_qty = qty;
            ord.remaining_qty = remaining;
            ord.side = side;
            ord.status = STATUS_ACTIVE;
            ord.next_order_idx = 0;
            ord.prev_order_idx = 0;

            uint32_t hash_id = static_cast<uint32_t>(id % MAX_ORDERS);
            id_to_slot[hash_id] = slot;

            if (side == SIDE_BUY) {
                add_to_buy_book(slot);
            } else {
                add_to_sell_book(slot);
            }
        }

        return qty - remaining; // Returns executed qty
    }

    // Market order execution crossing best available depth
    uint32_t execute_market(uint32_t side, uint32_t qty, uint64_t* out_cost_cents) {
        if (qty == 0) return 0;
        uint32_t remaining = qty;
        uint64_t total_cost = 0;

        if (side == SIDE_BUY) {
            while (remaining > 0 && sell_level_count > 0) {
                PriceLevel& ask = sell_levels[0];
                uint32_t curr_slot = ask.head_order_idx;

                while (remaining > 0 && curr_slot != 0) {
                    Order& resting = order_pool[curr_slot];
                    uint32_t fill_qty = std::min(remaining, resting.remaining_qty);

                    remaining -= fill_qty;
                    resting.remaining_qty -= fill_qty;
                    ask.total_volume -= fill_qty;
                    total_cost += static_cast<uint64_t>(fill_qty) * ask.price_cents;
                    total_volume_matched += fill_qty;
                    total_trades_executed++;

                    if (resting.remaining_qty == 0) {
                        resting.status = STATUS_FILLED;
                        curr_slot = resting.next_order_idx;
                        ask.head_order_idx = curr_slot;
                        ask.order_count--;
                    } else {
                        break;
                    }
                }

                if (ask.order_count == 0 || ask.total_volume == 0) {
                    remove_sell_level(0);
                }
            }
        } else {
            while (remaining > 0 && buy_level_count > 0) {
                PriceLevel& bid = buy_levels[0];
                uint32_t curr_slot = bid.head_order_idx;

                while (remaining > 0 && curr_slot != 0) {
                    Order& resting = order_pool[curr_slot];
                    uint32_t fill_qty = std::min(remaining, resting.remaining_qty);

                    remaining -= fill_qty;
                    resting.remaining_qty -= fill_qty;
                    bid.total_volume -= fill_qty;
                    total_cost += static_cast<uint64_t>(fill_qty) * bid.price_cents;
                    total_volume_matched += fill_qty;
                    total_trades_executed++;

                    if (resting.remaining_qty == 0) {
                        resting.status = STATUS_FILLED;
                        curr_slot = resting.next_order_idx;
                        bid.head_order_idx = curr_slot;
                        bid.order_count--;
                    } else {
                        break;
                    }
                }

                if (bid.order_count == 0 || bid.total_volume == 0) {
                    remove_buy_level(0);
                }
            }
        }

        if (out_cost_cents) *out_cost_cents = total_cost;
        return qty - remaining;
    }

    // Cancel order in O(1) via hash table lookup
    bool cancel_order(uint64_t id) {
        uint32_t hash_id = static_cast<uint32_t>(id % MAX_ORDERS);
        uint32_t slot = id_to_slot[hash_id];
        if (slot == 0 || slot >= next_free_slot) return false;

        Order& ord = order_pool[slot];
        if (ord.id != id || ord.status != STATUS_ACTIVE) return false;

        ord.status = STATUS_CANCELLED;
        // Invalidate slot
        id_to_slot[hash_id] = 0;
        return true;
    }

    uint32_t get_best_bid() const {
        return buy_level_count > 0 ? buy_levels[0].price_cents : 0;
    }

    uint32_t get_best_ask() const {
        return sell_level_count > 0 ? sell_levels[0].price_cents : 0;
    }

    uint32_t get_buy_depth_count() const { return buy_level_count; }
    uint32_t get_sell_depth_count() const { return sell_level_count; }
    uint64_t get_total_trades() const { return total_trades_executed; }
    uint64_t get_total_volume() const { return total_volume_matched; }

private:
    void add_to_buy_book(uint32_t order_slot) {
        Order& ord = order_pool[order_slot];
        // Insert into buy_levels (sorted descending by price)
        for (uint32_t i = 0; i < buy_level_count; i++) {
            if (buy_levels[i].price_cents == ord.price_cents) {
                append_order_to_level(buy_levels[i], order_slot);
                return;
            }
            if (buy_levels[i].price_cents < ord.price_cents) {
                // Shift down to make space
                if (buy_level_count < MAX_PRICE_LEVELS - 1) {
                    for (uint32_t j = buy_level_count; j > i; j--) {
                        buy_levels[j] = buy_levels[j - 1];
                    }
                    buy_level_count++;
                }
                buy_levels[i] = { ord.price_cents, ord.remaining_qty, 1, order_slot, order_slot };
                return;
            }
        }
        if (buy_level_count < MAX_PRICE_LEVELS) {
            buy_levels[buy_level_count++] = { ord.price_cents, ord.remaining_qty, 1, order_slot, order_slot };
        }
    }

    void add_to_sell_book(uint32_t order_slot) {
        Order& ord = order_pool[order_slot];
        // Insert into sell_levels (sorted ascending by price)
        for (uint32_t i = 0; i < sell_level_count; i++) {
            if (sell_levels[i].price_cents == ord.price_cents) {
                append_order_to_level(sell_levels[i], order_slot);
                return;
            }
            if (sell_levels[i].price_cents > ord.price_cents) {
                if (sell_level_count < MAX_PRICE_LEVELS - 1) {
                    for (uint32_t j = sell_level_count; j > i; j--) {
                        sell_levels[j] = sell_levels[j - 1];
                    }
                    sell_level_count++;
                }
                sell_levels[i] = { ord.price_cents, ord.remaining_qty, 1, order_slot, order_slot };
                return;
            }
        }
        if (sell_level_count < MAX_PRICE_LEVELS) {
            sell_levels[sell_level_count++] = { ord.price_cents, ord.remaining_qty, 1, order_slot, order_slot };
        }
    }

    void append_order_to_level(PriceLevel& level, uint32_t order_slot) {
        Order& ord = order_pool[order_slot];
        level.total_volume += ord.remaining_qty;
        level.order_count++;
        if (level.tail_order_idx != 0) {
            order_pool[level.tail_order_idx].next_order_idx = order_slot;
            ord.prev_order_idx = level.tail_order_idx;
        }
        level.tail_order_idx = order_slot;
        if (level.head_order_idx == 0) {
            level.head_order_idx = order_slot;
        }
    }

    void remove_buy_level(uint32_t index) {
        if (index >= buy_level_count) return;
        for (uint32_t i = index; i < buy_level_count - 1; i++) {
            buy_levels[i] = buy_levels[i + 1];
        }
        buy_level_count--;
    }

    void remove_sell_level(uint32_t index) {
        if (index >= sell_level_count) return;
        for (uint32_t i = index; i < sell_level_count - 1; i++) {
            sell_levels[i] = sell_levels[i + 1];
        }
        sell_level_count--;
    }
};

// Global singleton engine instance for WebAssembly runtime
static MatchingEngine g_engine;

// C Linkage API for WebAssembly (WASM) & Native Shared Library Exports
extern "C" {
    void engine_reset() {
        g_engine.reset();
    }

    uint32_t engine_insert_limit(uint64_t id, uint32_t side, uint32_t price_cents, uint32_t qty) {
        return g_engine.insert_limit(id, side, price_cents, qty);
    }

    uint32_t engine_execute_market(uint32_t side, uint32_t qty, uint64_t* out_cost) {
        return g_engine.execute_market(side, qty, out_cost);
    }

    bool engine_cancel_order(uint64_t id) {
        return g_engine.cancel_order(id);
    }

    uint32_t engine_get_best_bid() {
        return g_engine.get_best_bid();
    }

    uint32_t engine_get_best_ask() {
        return g_engine.get_best_ask();
    }

    uint32_t engine_get_buy_depth_count() {
        return g_engine.get_buy_depth_count();
    }

    uint32_t engine_get_sell_depth_count() {
        return g_engine.get_sell_depth_count();
    }

    uint64_t engine_get_total_trades() {
        return g_engine.get_total_trades();
    }

    uint64_t engine_get_total_volume() {
        return g_engine.get_total_volume();
    }

    // High-speed benchmark: inserts N alternating buy and sell orders, matches them, and returns executed trades
    uint64_t engine_benchmark_burst(uint32_t order_count) {
        g_engine.reset();
        uint32_t base_price = 10000; // $100.00
        for (uint32_t i = 1; i <= order_count; i++) {
            uint32_t side = (i % 2 == 1) ? SIDE_BUY : SIDE_SELL;
            uint32_t delta = (i % 20);
            uint32_t price = (side == SIDE_BUY) ? (base_price - delta) : (base_price + delta);
            g_engine.insert_limit(i, side, price, 10);
        }
        // Execute market sweep to clear book
        uint64_t cost = 0;
        g_engine.execute_market(SIDE_BUY, order_count * 5, &cost);
        g_engine.execute_market(SIDE_SELL, order_count * 5, &cost);
        return g_engine.get_total_trades();
    }
}
