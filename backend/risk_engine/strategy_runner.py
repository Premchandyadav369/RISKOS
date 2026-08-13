import threading
import time
import random
import uuid
from datetime import datetime

class TradingDaemon:
    def __init__(self):
        self.is_running = False
        self.thread = None
        
        # Lifetime tracking state
        self.initial_capital = 10_000_000.0
        self.current_balance = 10_000_000.0
        self.total_profit_loss = 0.0
        
        # 10+ Strategies
        self.strategies = [
            {"id": "S1", "name": "StatArb Pairs", "status": "ACTIVE", "weight": "15%"},
            {"id": "S2", "name": "Delta-Neutral Vol", "status": "ACTIVE", "weight": "12%"},
            {"id": "S3", "name": "ML Momentum", "status": "ACTIVE", "weight": "10%"},
            {"id": "S4", "name": "Yield Curve Carry", "status": "ACTIVE", "weight": "15%"},
            {"id": "S5", "name": "Risk Parity Macro", "status": "ACTIVE", "weight": "10%"},
            {"id": "S6", "name": "CDS Basis Arb", "status": "ACTIVE", "weight": "8%"},
            {"id": "S7", "name": "News NLP Scalp", "status": "ACTIVE", "weight": "5%"},
            {"id": "S8", "name": "Options Gamma Scalp", "status": "ACTIVE", "weight": "10%"},
            {"id": "S9", "name": "Mean Reversion", "status": "ACTIVE", "weight": "10%"},
            {"id": "S10", "name": "HFT Bid-Ask Capture", "status": "ACTIVE", "weight": "5%"}
        ]
        
        self.recent_trades = []

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)

    def _run_loop(self):
        assets = ["NVDA", "AAPL", "US10Y", "USDINR", "RELIANCE", "HDFCBANK", "VIX", "SPX"]
        while self.is_running:
            # Sleep between 1 to 4 seconds for realistic frequency
            time.sleep(random.uniform(1.0, 4.0))
            
            strategy = random.choice(self.strategies)
            asset = random.choice(assets)
            side = random.choice(["BUY", "SELL"])
            size = random.randint(100, 5000)
            
            # Simulate a profit or loss for this trade
            # 55% win rate typical for algos
            is_win = random.random() < 0.55
            pnl_impact = random.uniform(100.0, 15000.0)
            if not is_win:
                pnl_impact = -pnl_impact
                
            # Update state
            self.current_balance += pnl_impact
            self.total_profit_loss = self.current_balance - self.initial_capital
            
            trade = {
                "id": str(uuid.uuid4())[:8].upper(),
                "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3] + "Z",
                "strategy": strategy["name"],
                "asset": asset,
                "side": side,
                "size": size,
                "pnl_impact": round(pnl_impact, 2),
                "status": "FILLED"
            }
            
            self.recent_trades.insert(0, trade)
            
            # Keep only last 50 trades in memory
            if len(self.recent_trades) > 50:
                self.recent_trades.pop()

    def get_status(self):
        return {
            "is_running": self.is_running,
            "initial_capital": self.initial_capital,
            "current_balance": round(self.current_balance, 2),
            "total_profit_loss": round(self.total_profit_loss, 2),
            "strategies": self.strategies,
            "recent_trades": self.recent_trades[:15] # Send top 15 to frontend
        }

# Global instance for the FastAPI app
trading_daemon = TradingDaemon()
