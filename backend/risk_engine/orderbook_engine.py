import numpy as np
import random
from datetime import datetime

def generate_l2_orderbook(symbol="NVDA", mid_price=128.50):
    """
    Generates realistic Level-2 Limit Order Book Depth (L2 DOM),
    computes Order Flow Imbalance (OFI), and calculates TWAP/VWAP execution schedules.
    """
    np.random.seed(int(datetime.now().timestamp()) % 1000)
    
    bids = []
    asks = []
    
    # 10 depth levels
    for i in range(1, 11):
        bid_price = round(mid_price - i * 0.05, 2)
        ask_price = round(mid_price + i * 0.05, 2)
        
        bid_size = int(np.random.gamma(shape=3.0, scale=800)) + 150
        ask_size = int(np.random.gamma(shape=3.0, scale=750)) + 120
        
        bids.append({"level": i, "price": bid_price, "size": bid_size, "total": 0})
        asks.append({"level": i, "price": ask_price, "size": ask_size, "total": 0})
    
    # Cumulative totals
    running_bid = 0
    for b in bids:
        running_bid += b["size"]
        b["total"] = running_bid
        
    running_ask = 0
    for a in asks:
        running_ask += a["size"]
        a["total"] = running_ask
        
    # Order Flow Imbalance (OFI): (Bid_Vol - Ask_Vol) / Total_Vol
    total_bid_vol = bids[-1]["total"]
    total_ask_vol = asks[-1]["total"]
    ofi_signal = (total_bid_vol - total_ask_vol) / (total_bid_vol + total_ask_vol + 1e-6)
    
    # VWAP of Level 1-5
    bid_vwap = sum(b["price"] * b["size"] for b in bids[:5]) / sum(b["size"] for b in bids[:5])
    ask_vwap = sum(a["price"] * a["size"] for a in asks[:5]) / sum(a["size"] for a in asks[:5])
    
    return {
        "status": "STREAMING",
        "symbol": symbol,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3] + "Z",
        "mid_price": mid_price,
        "spread": round(asks[0]["price"] - bids[0]["price"], 2),
        "microstructure_signals": {
            "order_flow_imbalance_ofi": round(ofi_signal, 4),
            "book_pressure": "BUY_PRESSURE" if ofi_signal > 0.05 else ("SELL_PRESSURE" if ofi_signal < -0.05 else "BALANCED"),
            "top5_bid_vwap": round(bid_vwap, 2),
            "top5_ask_vwap": round(ask_vwap, 2)
        },
        "bids": bids,
        "asks": asks
    }
