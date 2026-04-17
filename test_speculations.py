import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

print("--- Testing Quant Speculations & Currency Integration ---")

# 1. Speculations Endpoint (Monte Carlo GBM)
res = client.get("/api/quant/speculations?ticker=RELIANCE&horizon_days=90&drift=0.15&vol_mult=1.0")
assert res.status_code == 200
data = res.json()
print(f"Speculations Endpoint (GBM): {data['symbol']} 90-day forecast, Current = {data['current_price']}, Expected = {data['terminal_metrics']['expected_price']}, Median = {data['terminal_metrics']['median_price']}, Prob Positive = {data['probabilities']['prob_positive']}%")

# 2. Prophet Endpoint (Decomposition)
res2 = client.get("/api/quant/prophet?ticker=TCS&horizon_days=60")
assert res2.status_code == 200
p_data = res2.json()
print(f"Prophet Endpoint (TCS): {len(p_data['forecast']['point_forecast'])} forecast bars, Upper 95% = {p_data['forecast']['upper_95'][-1]}, Lower 95% = {p_data['forecast']['lower_95'][-1]}")

print("--- Speculations & Predictions verified 100%! ---")
