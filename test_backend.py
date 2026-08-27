import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.db import init_db, SessionLocal
from database.models import TransactionModel, SecurityModel
from engine.market import get_candlesticks, get_live_quote, get_live_fundamentals

init_db()
db = SessionLocal()
secs = db.query(SecurityModel).count()
txs = db.query(TransactionModel).count()
print(f"Database verified: {secs} securities, {txs} transactions")

candles = get_candlesticks("RELIANCE", "1Y")
print(f"Candlesticks verified: {candles['count']} bars, SMA20 len={len(candles['sma20'])}, source={candles['source']}")

quote = get_live_quote("TCS")
print(f"Live quote verified: {quote['symbol']} price={quote['price']}, change={quote['change_percent']}%, source={quote['source']}")

fund = get_live_fundamentals("HDFCBANK")
print(f"Fundamentals verified: {fund['symbol']} PE={fund['pe']}, Beta={fund['beta']}, ROE={fund['roe']}%")
