# RISKOS — Alpha Vantage News Data Pipeline & Gateway

## 1. Gateway Pipeline Architecture

To protect API entitlement limits and prevent redundant network hops, RISKOS funnels all news interactions through a centralized serverless/backend request proxy:

```
[Browser Client / Desk / Screener / Bot]
                   │
                   ▼ (Internal GET /api/market/news)
      [AlphaVantageRequestManager]
         ├── In-Memory TTL Cache (300s feed / 600s ticker)
         ├── In-Flight Request Deduplication Promise Pool
         ├── Rate-Limit Detector ("Note" / "Information")
         └── Health Metrics Telemetry
                   │
                   ▼ (HTTPS with Secure API Key)
  [Alpha Vantage Cloud Gateway (NEWS_SENTIMENT)]
```

---

## 2. API Key Configuration

The API key is strictly maintained server-side and never broadcast to browser network inspectors:

```bash
# In .env (Root) and backend/.env:
ALPHA_VANTAGE_API_KEY=EI9HFIWHX72XUAXZ
```

`.env` and `.env.*` are excluded in `.gitignore` to guarantee zero credential exposure to source version control.

---

## 3. Endpoints & Supported Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tickers` | String | (Optional) | Comma-separated tickers (e.g. `AAPL`, `RELIANCE.BSE`, `JPM`). |
| `topics` | String | (Optional) | Standard Alpha Vantage topics (e.g. `technology`, `earnings`). |
| `time_from` | String | (Optional) | `YYYYMMDDTHHMM` format. |
| `time_to` | String | (Optional) | `YYYYMMDDTHHMM` format. |
| `sort` | String | `LATEST` | `LATEST`, `EARLIEST`, or `RELEVANCE`. |
| `limit` | Integer | `50` | Number of items (max 1000). |
| `action` | String | (Optional) | Set `action=health` to query real-time provider telemetry. |

---

## 4. Telemetry & Provider Health States

The request manager continuously tracks health metrics:
- **`HEALTHY`**: Upstream Alpha Vantage responses returned within expected latency threshold ($< 800\text{ms}$).
- **`DEGRADED`**: Upstream rate limit warning encountered ("Thank you for using Alpha Vantage..."). Gateway transparently falls back to stale in-memory cache (`STALE_CACHE`) or high-fidelity offline fixtures (`DEGRADED_FALLBACK`).
- **`OFFLINE`**: Three consecutive upstream network or HTTP errors. System enters full local fallback mode with explicit `DATA STATUS: OFFLINE_FALLBACK`.
