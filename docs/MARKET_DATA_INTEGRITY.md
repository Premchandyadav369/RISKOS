# Market Data Integrity & Quantitative API Contracts

## 1. Backend REST API Canonical Contract
The FastAPI backend (`backend/api/main.py`) exposes `/api/market/status` returning the verified data contract:

```json
{
  "data_contract_version": "2.0-PROD",
  "server_timestamp_utc": "2026-09-15T06:45:00Z",
  "system_mode": "VERIFIED_INTEGRITY",
  "exchanges": {
    "NSE": {
      "region": "India",
      "currency": "INR",
      "is_open": true,
      "session_phase": "REGULAR",
      "status_label": "LIVE"
    },
    "NASDAQ": {
      "region": "United States",
      "currency": "USD",
      "is_open": false,
      "session_phase": "CLOSED",
      "status_label": "MARKET CLOSED"
    }
  },
  "data_quality_score": 0.998,
  "is_simulated": false
}
```

---

## 2. Quantitative Model Calibration Disclosures
1. **Gaussian Volatility Fallback**: GARCH(1,1) optimization may occasionally fail to converge during non-stationary regime shifts. In such cases, the system falls back to Exponentially Weighted Moving Average (EWMA, $\lambda = 0.94$) and flags the transition.
2. **Extreme Tail Risk Estimation**: While CVaR at 99% is superior to VaR, historical tail estimation requires adequate sample size ($N \ge 252$ days). Ledoit-Wolf covariance shrinkage is applied to guarantee positive semi-definite covariance matrices.
