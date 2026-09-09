# RISKOS Market Data Architecture & Data Provenance Specification

**Standard**: BCBS 239 & SEC Rule 611 / MiFID II RTS 25 Clock Synchronization  
**Status**: ACTIVE INSTITUTIONAL PRODUCTION STANDARD  
**Canonical Identity**: RISKOS Core Infrastructure  

---

## 1. Overview & Regulatory Imperatives

Institutional quantitative research and automated algorithmic execution require mathematical certainty regarding data origin, latency profiles, timestamp synchronization, and automated hygiene verification. RISKOS enforces an explicit data provenance architecture across both its Python high-performance backend and JavaScript browser client layer.

Under no circumstances does RISKOS fabricate data, invent artificial exchange fills, or silently substitute heuristics. When data is degraded, missing, or delayed, its exact status is explicitly flagged in every data contract.

---

## 2. Ingestion Tiers & Latency Profiles

| Tier | Name | Target Latency | Transport Protocol | Primary Provider | Fallback Protocol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 0** | Direct Execution Feeds | $< 5\text{ ms}$ | WebSocket / FIX 4.4 | Direct Broker FIX Gateway / NSE / BSE / CME | Secondary Colocated Bridge |
| **Tier 1** | Real-Time Market Intelligence | $50 - 250\text{ ms}$ | WebSocket / REST | Polygon.io / Interactive Brokers / AlphaVantage | Cached Parquet Store |
| **Tier 2** | Delayed EOD & Reference Data | $15\text{ min}$ / EOD | HTTPS REST | Yahoo Finance / FRED / RBI API / NSE India | Deterministic Synthetic Replay |
| **Tier 3** | Historical Research Archives | Batch Daily | S3 / Local Cache | CRSP / Compustat / Yahoo Historical | Offline Walk-Forward Cache |

---

## 3. Canonical Provenance Status Codes

Every response object delivering market states, prices, volatility surfaces, or risk metrics contains an immutable `provenance` block characterized by one of six canonical status codes:

1. `LIVE`: Real-time streaming or direct tick data ingested with timestamp delta $< 500\text{ ms}$.
2. `DELAYED`: Standard exchange-mandated 15-minute public broadcast delay.
3. `CACHED`: Served from local high-speed in-memory or SSD disk cache within acceptable TTL.
4. `FALLBACK`: Primary feed timed out or returned connection errors; secondary failover feed active.
5. `SYNTHETIC`: Deterministic walk-forward or parametric geometric Brownian bridge activated for offline backtesting or reproducible crisis replay (e.g. 1987 Black Monday, 2008 Lehman collapse).
6. `UNAVAILABLE`: Returned transparently when data cannot be retrieved; **never replaced with hardcoded guesses**.

---

## 4. Automated Data Quality Engine (`backend/engine/data_quality.py`)

Prior to passing any price or volume series into statistical estimators, the RISKOS Data Hygiene Pipeline audits the series across 8 critical dimensions:

1. **Non-Positive Prices**: Checks for $P_t \le 0$. Immediate rejection if true.
2. **Missing / Inf Gaps**: Quantifies NaN frequency and gap durations.
3. **Duplicate Timestamps**: Flags non-unique bar timestamps.
4. **Chronological Monotonicity**: Verifies $t_k > t_{k-1}$ without clock reversals.
5. **Stale / Frozen Prices**: Detects $\ge 5$ consecutive identical close prices.
6. **Abnormal Return Spikes**: Detects overnight price moves $> 50\%$ or $> 8\sigma$.
7. **Unadjusted Split Discontinuities**: Flags price jumps matching corporate action ratios ($2:1, 3:1, 5:1, 10:1$).
8. **Volume Hygiene**: Flags trading sessions with zero or negative reported volume.

### Composite Data Quality Score Formula

$$\text{Score} = \max\left(0, 100 - \sum_{i=1}^8 \text{Penalty}_i\right)$$

- **PRISTINE (95 - 100)**: Clean for immediate institutional execution.
- **ACCEPTABLE (80 - 94)**: Clean for statistical modeling with minor warning flags.
- **DEGRADED (50 - 79)**: Requires forward-fill or outlier winsorization before model ingestion.
- **UNACCEPTABLE (< 50)**: Rejected from portfolio optimization and backtest engines.

---

## 5. Machine-Readable Provenance Schema

Example canonical schema representation in JSON:

```json
{
  "provenance": {
    "status": "LIVE",
    "provider": "YahooFinance/NSE",
    "as_of": "2026-09-09T16:30:00Z",
    "retrieval_timestamp": "2026-09-09T16:30:01.425Z",
    "latency_ms": 142.5,
    "cache_hit": false,
    "quality_score": 98.5,
    "hygiene_status": "PRISTINE",
    "observations": 252,
    "rules_version": "DQ-2026.1"
  }
}
```
