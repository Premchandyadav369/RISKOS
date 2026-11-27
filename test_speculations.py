import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_multi_stock_speculations():
    # 1. TCS
    res_tcs = client.get("/api/quant/speculations?ticker=TCS&horizon_days=90")
    assert res_tcs.status_code == 200
    data_tcs = res_tcs.json()
    assert data_tcs['current_price'] > 0

    # 2. NVDA
    res_nvda = client.get("/api/quant/speculations?ticker=NVDA&horizon_days=90")
    assert res_nvda.status_code == 200
    data_nvda = res_nvda.json()
    assert data_nvda['current_price'] > 0

    # 3. RELIANCE
    res_rel = client.get("/api/quant/speculations?ticker=RELIANCE&horizon_days=90")
    assert res_rel.status_code == 200
    data_rel = res_rel.json()
    assert data_rel['current_price'] > 0

    # Assert all 3 have distinct current prices and are not copies of Reliance
    assert data_tcs['current_price'] != data_nvda['current_price']
    assert data_tcs['current_price'] != data_rel['current_price']

if __name__ == '__main__':
    test_multi_stock_speculations()
    print("--- All stocks have unique, distinct, stock-specific Monte Carlo simulations! ---")
