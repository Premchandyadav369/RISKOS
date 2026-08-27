import os
import json
from pathlib import Path
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .models import (
    Base, SecurityModel, PriceHistoryModel, PortfolioModel,
    OrderModel, WatchlistModel, NewsEventModel, MarketSnapshotModel, TransactionModel
)

# Database path
DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "riskos.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes the database schema and seeds master securities and data if empty."""
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if securities are already seeded
        existing_count = db.query(SecurityModel).count()
        if existing_count == 0:
            from engine.intelligence import SECURITIES_MASTER
            for sec in SECURITIES_MASTER:
                db_sec = SecurityModel(
                    symbol=sec["symbol"],
                    bse_code=sec.get("bse_code"),
                    name=sec["name"],
                    common_name=sec.get("common_name", sec["symbol"]),
                    isin=sec.get("isin"),
                    exchange=sec["exchange"],
                    country=sec["country"],
                    instrument_type=sec.get("instrument_type", "Equity"),
                    sector=sec.get("sector"),
                    industry=sec.get("industry"),
                    aliases_json=json.dumps(sec.get("aliases", [])),
                    price_inr=sec.get("price_inr", 0.0),
                    change_percent=sec.get("change_percent", 0.0),
                    market_cap_inr=sec.get("market_cap_inr", 0.0),
                    pe=sec.get("pe", 0.0),
                    pb=sec.get("pb", 0.0),
                    roe=sec.get("roe", 0.0),
                    roce=sec.get("roce", 0.0),
                    debt_equity=sec.get("debt_equity", 0.0),
                    revenue_inr=sec.get("revenue_inr", 0.0),
                    ebitda_inr=sec.get("ebitda_inr", 0.0),
                    net_profit_inr=sec.get("net_profit_inr", 0.0),
                    eps=sec.get("eps", 0.0),
                    beta=sec.get("beta", 1.0),
                    volatility=sec.get("volatility", 0.18),
                    sharpe=sec.get("sharpe", 1.1),
                    var99=sec.get("var99", -0.03),
                    mdd=sec.get("mdd", -0.15),
                    regime=sec.get("regime", "BULLISH TREND"),
                    causal_factors_json=json.dumps(sec.get("causal_factors", [])),
                    corp_actions_json=json.dumps(sec.get("corp_actions", [])),
                    updated_at=datetime.utcnow()
                )
                db.add(db_sec)
            
            # Seed default portfolio
            def_portfolio = PortfolioModel(
                name="Core Indian Large-Cap & US Tech Portfolio",
                capital=1000000.0,
                horizon_years=3,
                risk_profile="moderate",
                weights_json=json.dumps({
                    "RELIANCE": 0.35,
                    "TCS": 0.25,
                    "HDFCBANK": 0.20,
                    "AAPL": 0.10,
                    "NVDA": 0.10
                }),
                expected_return=0.168,
                volatility=0.142,
                sharpe_ratio=1.45,
                cvar_95=0.078,
                max_drawdown=0.112
            )
            db.add(def_portfolio)
            
            # Seed default market snapshot
            snap = MarketSnapshotModel(
                market="NSE",
                nifty_price=24820.40,
                sensex_price=81340.20,
                sp500_price=5640.10,
                advances=1842,
                declines=1103,
                advance_pct=62.5,
                cross_dispersion=1.48
            )
            db.add(snap)

            db.commit()
            print("Database initialized & seeded successfully with master securities!")

        # Check transactions independently
        existing_txs = db.query(TransactionModel).count()
        if existing_txs == 0:
            sample_txs = [
                TransactionModel(tx_id="tx-1", symbol="RELIANCE", type="BUY", quantity=20, price=2920.0, fees=20.0, date="2026-01-15", notes="Core long position"),
                TransactionModel(tx_id="tx-2", symbol="RELIANCE", type="BUY", quantity=10, price=2980.0, fees=15.0, date="2026-02-10", notes="Dip buy"),
                TransactionModel(tx_id="tx-3", symbol="TCS", type="BUY", quantity=15, price=4150.0, fees=25.0, date="2026-01-20", notes="IT allocation"),
                TransactionModel(tx_id="tx-4", symbol="HDFCBANK", type="BUY", quantity=30, price=1610.0, fees=20.0, date="2026-02-01", notes="Private banking allocation"),
                TransactionModel(tx_id="tx-5", symbol="GOLDBEES", type="BUY", quantity=200, price=62.5, fees=10.0, date="2026-01-05", notes="Gold hedge")
            ]
            for stx in sample_txs:
                db.add(stx)
            db.commit()
            print("Transactions table seeded with initial positions!")
    except Exception as e:
        db.rollback()
        print(f"Database init notice: {e}")
    finally:
        db.close()

