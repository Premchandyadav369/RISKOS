# RISKOS Market Data Architecture & Data Provenance Specification

## 1. Overview & Regulatory Standards
Institutional quantitative systems require unambiguous data provenance, latency tier classification, and automated hygiene checks. RISKOS implements strict compliance with BCBS 239 (Risk Data Aggregation and Risk Reporting) and SEC Rule 611 / MiFID II RTS 25 clock synchronization standards.

---

## 2. Ingestion Tiers & Latency Profiles

| Tier | Name | Target Latency | Transport | Data Provider / Source | Fallback Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 0** | Live Execution Feeds | $< 5\text{ ms}$ | WebSocket / FIX 4.4 | Direct Broker FIX Gateway / NSE / BSE / CME | Secondary Colocated Bridge |
| **Tier 1** | Real-Time Market Intelligence | $50 - 250\text{ ms}$ | WebSocket / REST | Polygon.io / AlphaVantage / Interactive Brokers | Yahoo Finance REST Poller |
| **Tier 2** | Delayed EOD & Reference Data | $15\text{ min}$ / EOD | HTTPS REST | Yahoo Finance / Fred / RBI API / NSE India | Cached Local Parquet Store |
| **Tier 3** | Historical Research Archives | Batch Daily | S3 / Local Cache | Cleaned CRSP / Compustat / Yahoo Historical | Synthetic Walk-Forward Replay |

---

## 3. Data Provenance Status Codes
Every API response delivering market prices, volatility estimates, forecasts, or risk metrics includes a machine-readable `provenance` metadata block containing one of the following canonical status codes:

1. `LIVE`: Sourced in real time directly from primary live exchange or broker feeds.
2. `DELAYED`: Sourced from public feeds with standard 15-minute exchange delay.
3. `CACHED`: Served from local in-memory or SSD disk cache with documented TTL.
4. `FALLBACK`: Primary feed timed out or returned errors; failover feed active.
5. `SYNTHETIC_BENCHMARK`: Generated strictly for controlled reproducible stress replay (e.g. 1987 Black Monday, 2008 Lehman collapse).
6. `DATA_UNAVAILABLE`: Returned transparently when data cannot be retrieved; **never fabricated or replaced with hardcoded heuristic numbers**.

---

## 4. Automated Data Quality Engine (`backend/engine/data_quality.py`)
Prior to passing any price or volume series into statistical estimators, the RISKOS Data Hygiene Pipeline audits the series across 8 critical dimensions:

1. **Non-Positive Prices**: Checks for $P_t \le 0$. Immediate rejection if true.
2. **Missing / Inf Gaps**: Quantifies NaN frequency and gap durations.
3. **Duplicate Timestamps**: Flags non-unique bar timestamps.
4. **Chronological Monotonicity**: Verifies $t_k > t_{k-1}$ without clock reversals.
5. **Stale / Frozen Prices**: Detects $\ge 5$ consecutive identical close prices.
6. **Abnormal Return Spikes**: Detects overnight price moves $> 50\%$ or $> 8\sigma$.
7. **Unadjusted Split Discontinuities**: Flags price jumps matching canonical corporate action ratios ($2:1, 3:1, 5:1, 10:1$).
8. **Volume Hygiene**: Flags trading sessions with zero or negative reported volume.

### Composite Data Quality Scoring
$$\text{Score} = \max(0, 100 - \sum \text{Penalties})$$
- **PRISTINE (95 - 100)**: Clean for immediate institutional execution.
- **ACCEPTABLE (80 - 94)**: Clean for statistical modeling with minor warning flags.
- **DEGRADED (50 - 79)**: Requires forward-fill or outlier winsorization before model ingestion.
- **UNACCEPTABLE (< 50)**: Rejected from portfolio optimization and backtest engines.

---

## 5. Machine-Readable Provenance Schema
Example response block:
```json
"provenance": {
  "status": "LIVE",
  "data_provider": "YahooFinance/NSE",
  "ingested_at": "2026-09-08T18:00:00Z",
  "latency_ms": 142.5,
  "cache_hit": false,
  "data_quality_score": 98.5,
  "hygiene_status": "PRISTINE",
  "observations": 252,
  "rules_version": "DQ-2024.1"
}
```