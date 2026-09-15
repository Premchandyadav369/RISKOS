import pytest
from backend.engine.news_engine import (
    analyze_sentiment,
    extract_entities_and_tickers,
    classify_catalyst,
    get_latest_news_stream,
    compute_news_sentiment_drift
)

def test_analyze_sentiment_bullish():
    res = analyze_sentiment("Company reports record profit surge, beating guidance and raising dividend.")
    assert res["score"] > 0.3
    assert res["classification"] in ["BULLISH", "STRONG_BULLISH"]
    assert "beat" in res["matched_positive"] or "surge" in res["matched_positive"] or "profit" in res["matched_positive"]

def test_analyze_sentiment_bearish():
    res = analyze_sentiment("Company faces fraud investigation, default lawsuit, and severe deficit plunge.")
    assert res["score"] < -0.3
    assert res["classification"] in ["BEARISH", "STRONG_BEARISH"]
    assert "default" in res["matched_negative"] or "fraud" in res["matched_negative"]

def test_extract_entities_and_tickers():
    text = "Reliance Industries and Apple announce new partnership while Suzlon secures wind contracts."
    tickers = extract_entities_and_tickers(text)
    assert "RELIANCE.NS" in tickers
    assert "AAPL" in tickers
    assert "SUZLON.NS" in tickers

def test_classify_catalyst():
    assert classify_catalyst("Company releases Q3 earnings results and net profit") == "EARNINGS"
    assert classify_catalyst("Department issues regulatory penalty and probe") == "REGULATORY"
    assert classify_catalyst("Firm wins major $50M contract and order win") == "ORDER_WIN"

def test_news_stream_and_drift():
    stream = get_latest_news_stream(limit=10)
    assert len(stream) > 0
    assert "sentiment_score" in stream[0]
    assert "sentiment_class" in stream[0]

    drift = compute_news_sentiment_drift(["RELIANCE.NS", "AAPL", "SUZLON.NS"])
    assert "RELIANCE.NS" in drift
    assert "bl_view_return" in drift["RELIANCE.NS"]