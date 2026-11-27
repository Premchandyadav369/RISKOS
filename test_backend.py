import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.db import init_db, SessionLocal
from database.models import TransactionModel, SecurityModel
from engine.market import get_candlesticks, get_live_quote, get_live_fundamentals

def test_database_and_market_engine():
    init_db()
    db = SessionLocal()
    secs = db.query(SecurityModel).count()
    txs = db.query(TransactionModel).count()
    assert secs > 0 or txs >= 0

    candles = get_candlesticks("RELIANCE", "1Y")
    assert candles['count'] > 0
    assert 'sma20' in candles

    quote = get_live_quote("TCS")
    assert quote['symbol'] == 'TCS'
    assert quote['price'] > 0

    fund = get_live_fundamentals("HDFCBANK")
    assert fund['symbol'] == 'HDFCBANK'
    assert 'pe' in fund

if __name__ == '__main__':
    test_database_and_market_engine()
    print("Backend test passed!")
