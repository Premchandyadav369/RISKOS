from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class SecurityModel(Base):
    __tablename__ = "securities"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(32), unique=True, index=True, nullable=False)
    bse_code = Column(String(32), index=True)
    name = Column(String(128), nullable=False)
    common_name = Column(String(64), index=True)
    isin = Column(String(32), index=True)
    exchange = Column(String(16), nullable=False)
    country = Column(String(8), nullable=False)
    instrument_type = Column(String(32), default="Equity")
    sector = Column(String(64))
    industry = Column(String(64))
    aliases_json = Column(Text, default="[]")
    price_inr = Column(Float, default=0.0)
    change_percent = Column(Float, default=0.0)
    market_cap_inr = Column(Float, default=0.0)
    pe = Column(Float, default=0.0)
    pb = Column(Float, default=0.0)
    roe = Column(Float, default=0.0)
    roce = Column(Float, default=0.0)
    debt_equity = Column(Float, default=0.0)
    revenue_inr = Column(Float, default=0.0)
    ebitda_inr = Column(Float, default=0.0)
    net_profit_inr = Column(Float, default=0.0)
    eps = Column(Float, default=0.0)
    beta = Column(Float, default=1.0)
    volatility = Column(Float, default=0.20)
    sharpe = Column(Float, default=1.0)
    var99 = Column(Float, default=-0.03)
    mdd = Column(Float, default=-0.15)
    regime = Column(String(64), default="BULLISH TREND")
    causal_factors_json = Column(Text, default="[]")
    corp_actions_json = Column(Text, default="[]")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PriceHistoryModel(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(32), index=True, nullable=False)
    date = Column(String(16), index=True, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, default=0)

class PortfolioModel(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), default="Default Quantitative Portfolio")
    capital = Column(Float, default=1000000.0)
    horizon_years = Column(Integer, default=3)
    risk_profile = Column(String(32), default="moderate")
    weights_json = Column(Text, nullable=False, default="{}")
    expected_return = Column(Float, default=0.12)
    volatility = Column(Float, default=0.15)
    sharpe_ratio = Column(Float, default=1.25)
    cvar_95 = Column(Float, default=0.08)
    max_drawdown = Column(Float, default=0.14)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class OrderModel(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(64), unique=True, index=True, nullable=False)
    symbol = Column(String(32), index=True, nullable=False)
    direction = Column(String(8), nullable=False)
    quantity = Column(Integer, nullable=False)
    order_type = Column(String(16), default="VWAP")
    avg_fill_price = Column(Float, nullable=False)
    vwap_benchmark = Column(Float, default=0.0)
    slippage_bps = Column(Float, default=0.0)
    total_cost = Column(Float, nullable=False)
    status = Column(String(16), default="FILLED")
    created_at = Column(DateTime, default=datetime.utcnow)

class WatchlistModel(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(32), unique=True, index=True, nullable=False)
    target_price = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class NewsEventModel(Base):
    __tablename__ = "news_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    source = Column(String(128))
    source_type = Column(String(32), default="PRIMARY SOURCE")
    symbol = Column(String(32), index=True)
    snippet = Column(Text)
    url = Column(String(512))
    sentiment = Column(String(16), default="POSITIVE")
    confidence = Column(Integer, default=80)
    event_tag = Column(String(64), default="CORPORATE ACTION")
    published_at = Column(String(32))
    created_at = Column(DateTime, default=datetime.utcnow)

class MarketSnapshotModel(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    market = Column(String(16), index=True, default="NSE")
    nifty_price = Column(Float, default=24820.40)
    sensex_price = Column(Float, default=81340.20)
    sp500_price = Column(Float, default=5640.10)
    advances = Column(Integer, default=1842)
    declines = Column(Integer, default=1103)
    advance_pct = Column(Float, default=62.5)
    cross_dispersion = Column(Float, default=1.48)
    snapshot_time = Column(DateTime, default=datetime.utcnow)

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String(64), unique=True, index=True, nullable=False)
    symbol = Column(String(32), index=True, nullable=False)
    type = Column(String(8), nullable=False) # 'BUY' | 'SELL'
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    fees = Column(Float, default=0.0)
    date = Column(String(16), nullable=False)
    currency = Column(String(8), default="INR")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

