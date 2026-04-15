import time
import threading
from typing import Dict, Any, List
from .pairs_trading import run_pairs_trading_strategy
from .delta_hedging import run_delta_hedging_strategy
from .momentum import run_momentum_strategy
from .risk_parity import run_risk_parity_strategy
from .backtest import run_all_strategies_backtest

class TradingDeskDaemon:
    """
    Non-stop background execution daemon for multi-strategy quantitative trading desk.
    Continuously evaluates market data, calculates signals, and updates live strategy states.
    """
    def __init__(self):
        self.is_running = False
        self._thread = None
        self.latest_state = {}
        self.execution_count = 0
        
    def start(self):
        if not self.is_running:
            self.is_running = True
            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()
            print("🚀 RISKOS Live Quantitative Trading Desk Daemon STARTED.")
            
    def stop(self):
        self.is_running = False
        print("⏹ RISKOS Trading Desk Daemon STOPPED.")
        
    def _loop(self):
        while self.is_running:
            try:
                self.execution_count += 1
                pairs = run_pairs_trading_strategy()
                delta = run_delta_hedging_strategy()
                mom = run_momentum_strategy()
                rp = run_risk_parity_strategy()
                bt = run_all_strategies_backtest()
                
                self.latest_state = {
                    "daemon_status": "RUNNING_NON_STOP",
                    "execution_cycles": self.execution_count,
                    "last_tick": time.strftime("%Y-%m-%d %H:%M:%S IST"),
                    "backtest_summary": bt,
                    "active_strategies": {
                        "pairs_trading": pairs,
                        "delta_hedging": delta,
                        "momentum": mom,
                        "risk_parity": rp
                    }
                }
            except Exception as e:
                print(f"Trading daemon loop exception: {e}")
            time.sleep(5)  # Run evaluation cycle every 5 seconds non-stop

_DAEMON_INSTANCE = TradingDeskDaemon()

def get_trading_daemon() -> TradingDeskDaemon:
    if not _DAEMON_INSTANCE.is_running:
        _DAEMON_INSTANCE.start()
    return _DAEMON_INSTANCE
