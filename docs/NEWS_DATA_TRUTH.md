# RISKOS — News Data Truth & Provenance Invariants

## 1. Core Principles of Data Truth

In institutional finance, algorithmic models and risk managers must know the exact authenticity and freshness of the data they consume. RISKOS strictly prohibits the manufacture of synthetic market activity or the masquerading of cached data as live telemetry.

---

## 2. Invariant State Classifications

Every news article, market reaction calculation, and quote stream must display one of the following canonical states:

| Status | Definition |
| :--- | :--- |
| **`LIVE`** | Directly streamed or fetched from upstream provider (Alpha Vantage / Exchange) within its real-time operating window. |
| **`DELAYED`** | Exchange or provider enforces regulatory dissemination delay (e.g. 15-minute standard feed). |
| **`CACHED`** | Returned from local in-memory or Redis/disk store within designated TTL ($< 300\text{s}$). |
| **`STALE`** | Cached observation exceeding valid TTL, served strictly as degraded fallback during network disruption. |
| **`SIMULATED`** | Generated via mathematical models (e.g., Merton Jump-Diffusion, GBM) for scenario research; explicitly tagged. |
| **`UNAVAILABLE`** | Feed disconnected or ticker unlisted; no synthetic data substituted. |
| **`MARKET CLOSED`** | Exchange calendar (`marketDataTruth.js`) reports after-hours session; prices frozen at official close. |

---

## 3. Strict Timestamp Separation

Every article ingested into RISKOS tracks three immutable temporal coordinates:
1. **`publishedAt`**: When the reporting organization or wire service originally published the story.
2. **`receivedAt`**: When the RISKOS backend gateway ingested the payload from Alpha Vantage.
3. **`processedAt`**: When the normalization, entity resolution, and signal calculation engines completed execution.

Under no circumstances is `Date.now()` used to overwrite or fabricate article publication timestamps.
