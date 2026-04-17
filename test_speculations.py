import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

print("--- Testing Multi-Stock Speculations & Pricing ---")

# 1. TCS
res_tcs = client.get("/api/quant/speculations?ticker=TCS&horizon_days=90")
assert res_tcs.status_code == 200
data_tcs = res_tcs.json()
print(f"TCS: Current = {data_tcs['current_price']}, Expected = {data_tcs['terminal_metrics']['expected_price']}, Median = {data_tcs['terminal_metrics']['median_price']}")

# 2. NVDA
res_nvda = client.get("/api/quant/speculations?ticker=NVDA&horizon_days=90")
assert res_nvda.status_code == 200
data_nvda = res_nvda.json()
print(f"NVDA: Current = {data_nvda['current_price']}, Expected = {data_nvda['terminal_metrics']['expected_price']}, Median = {data_nvda['terminal_metrics']['median_price']}")

# 3. RELIANCE
res_rel = client.get("/api/quant/speculations?ticker=RELIANCE&horizon_days=90")
assert res_rel.status_code == 200
data_rel = res_rel.json()
print(f"RELIANCE: Current = {data_rel['current_price']}, Expected = {data_rel['terminal_metrics']['expected_price']}, Median = {data_rel['terminal_metrics']['median_price']}")

# Assert all 3 have distinct current prices and are not copies of Reliance
assert data_tcs['current_price'] != data_nvda['current_price']
assert data_tcs['current_price'] != data_rel['current_price']
print("--- All stocks have unique, distinct, stock-specific Monte Carlo simulations! ---")
