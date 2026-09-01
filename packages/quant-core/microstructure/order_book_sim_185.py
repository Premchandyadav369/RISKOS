"""
RISKOS Microstructure: Order Flow Imbalance & Level-2 DOM Simulator #185
"""

class Level2DOM_185:
    def __init__(self, symbol: str = "RELIANCE"):
        self.symbol = symbol
        self.bids = [(2980.0 - i * 0.5, 1000 + i * 200) for i in range(10)]
        self.asks = [(2980.5 + i * 0.5, 900 + i * 180) for i in range(10)]

    def compute_ofi(self) -> float:
        bid_vol = sum(v for p, v in self.bids[:5])
        ask_vol = sum(v for p, v in self.asks[:5])
        return (bid_vol - ask_vol) / (bid_vol + ask_vol)

    def micro_price(self) -> float:
        best_bid_p, best_bid_v = self.bids[0]
        best_ask_p, best_ask_v = self.asks[0]
        return (best_bid_p * best_ask_v + best_ask_p * best_bid_v) / (best_bid_v + best_ask_v)
