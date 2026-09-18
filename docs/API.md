# RISKOS Institutional REST API Master Reference Manual

```
  ██████╗ ██╗███████╗██╗  ██╗ ██████╗ ███████╗     █████╗ ██████╗ ██╗
  ██╔══██╗██║██╔════╝██║ ██╔╝██╔═══██╗██╔════╝    ██╔══██╗██╔══██╗██║
  ██████╔╝██║███████╗█████═╝ ██║   ██║███████╗    ███████║██████╔╝██║
  ██╔══██╗██║╚════██║██╔═██╗ ██║   ██║╚════██║    ██╔══██║██╔═══╝ ██║
  ██║  ██║██║███████║██║ ╚██╗╚██████╔╝███████║    ██║  ██║██║     ██║
  ╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝
  HIGH-FREQUENCY INSTITUTIONAL COMPUTATIONAL REST & WEBSOCKET GATEWAY
```

> **Base URL**: `http://127.0.0.1:8000` (Local Research) | `https://riskos.internal` (Production)  
> **Protocol**: HTTP/1.1 & HTTP/2 (TLS 1.3) | JSON RFC 8259  
> **Latency Budget**: $< 5\text{ ms}$ (L1/L2 In-Memory Cache) | $< 45\text{ ms}$ (Vectorized Analytics)  
> **Compliance**: SEC Rule 15c3-5 Pre-Trade Risk Gate | FIX 4.4 Financial Information eXchange

---

## Table of Contents

1. [Authentication, Protocol Invariants & CORS](#1-authentication-protocol-invariants--cors)
2. [Market Intelligence & Multi-Venue Quotes](#2-market-intelligence--multi-venue-quotes)
3. [Securities Master & Instrument Resolution](#3-securities-master--instrument-resolution)
4. [Macro Observatory, Catalysts & Spatial Radar](#4-macro-observatory-catalysts--spatial-radar)
5. [Portfolio Optimization, Black-Litterman & Forecasting](#5-portfolio-optimization-black-litterman--forecasting)
6. [41-Bot Autonomous Fleet & Execution Gateway](#6-41-bot-autonomous-fleet--execution-gateway)
7. [Tail Risk, VaR & CVaR 99% Engine](#7-tail-risk-var--cvar-99-engine)
8. [Derivatives, Rates & Microstructure Slicers](#8-derivatives-rates--microstructure-slicers)
9. [AI Foundation Models & TimesFM 3.0](#9-ai-foundation-models--timesfm-30)
10. [Research Governance, Walk-Forward & Stress Testing](#10-research-governance-walk-forward--stress-testing)
11. [Error Codes & System Fault Taxonomy](#11-error-codes--system-fault-taxonomy)

---

## 1. Authentication, Protocol Invariants & CORS

### Headers Required
```http
Accept: application/json
Content-Type: application/json
X-Client-ID: RISKOS-Terminal-v3.4
```

### CORS Configuration
RISKOS implements standard origin reflection for local quantitative development (`http://localhost:*`, `http://127.0.0.1:*`) with pre-flight `OPTIONS` caching. In production, access is governed via strict subnet allowlists.

---

## 2. Market Intelligence & Multi-Venue Quotes

### `GET /api/market/quote`
Fetches real-time National Best Bid/Offer (NBBO) quote with multi-provider failover across NSE Direct, Google Finance, and Yahoo Finance.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `symbol` | string | No | `RELIANCE` | Normalized ticker (`RELIANCE`, `^NSEI`, `AAPL`, `NVDA`). |

#### Response (`200 OK`)
```json
{
  "symbol": "RELIANCE.NS",
  "price": 3010.50,
  "change": 16.50,
  "change_percent": 0.55,
  "volume": 4820100,
  "high": 3024.00,
  "low": 2995.20,
  "previous_close": 2994.00,
  "provider": "NSE Direct PRISM",
  "timestamp": "2026-09-18T10:15:00.000Z"
}
```

#### Code Examples

##### cURL
```bash
curl -X GET "http://127.0.0.1:8000/api/market/quote?symbol=TCS.NS" -H "Accept: application/json"
```

##### Python (httpx)
```python
import httpx
client = httpx.Client(base_url="http://127.0.0.1:8000")
res = client.get("/api/market/quote", params={"symbol": "TCS.NS"})
print(res.json()["price"])
```

##### TypeScript
```typescript
const res = await fetch("http://127.0.0.1:8000/api/market/quote?symbol=TCS.NS");
const quote = await res.json();
console.log(`Live: ${quote.symbol} = ₹${quote.price}`);
```

---

### `GET /api/market/quotes`
Batch quotes resolver fetching concurrent real-time ticks for multiple global assets.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `symbols` | string | No | `RELIANCE,TCS,HDFCBANK,NVDA,AAPL` | Comma-delimited ticker symbols. |

#### Response (`200 OK`)
```json
{
  "count": 5,
  "quotes": {
    "RELIANCE": { "price": 3010.50, "change_percent": 0.55, "provider": "NSE Direct" },
    "TCS": { "price": 4480.00, "change_percent": 1.10, "provider": "NSE Direct" },
    "HDFCBANK": { "price": 1642.00, "change_percent": 0.40, "provider": "NSE Direct" },
    "NVDA": { "price": 128.50, "change_percent": 2.40, "provider": "NASDAQ Direct" },
    "AAPL": { "price": 224.20, "change_percent": 0.85, "provider": "NASDAQ Direct" }
  },
  "latency_ms": 3.8
}
```

---

### `GET /api/market/sectors/indicators`
Computes sector-level quantitative momentum, institutional relative strength, breadth ratios, and linked Pantheon trading bots.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `region` | string | No | `all` | Filter by `all`, `india` (10 NSE Sectors), or `us` (10 GICS Sectors). |

#### Response (`200 OK`)
```json
{
  "region": "all",
  "count": 20,
  "sectors": [
    {
      "sector_id": "IN-NIFTY-BANK",
      "name": "NIFTY Bank",
      "region": "india",
      "weight_pct": 33.4,
      "change_pct": 0.85,
      "rsi_14": 62.4,
      "momentum_score": 78.2,
      "beta_market": 1.14,
      "active_bot": "BOT-EG-IN-02 (ANUBIS ⚖️)",
      "signal": "OVERWEIGHT"
    }
  ]
}
```

---

## 3. Securities Master & Instrument Resolution

### `GET /api/securities/master`
Full-text prefix search across 120+ institutional securities spanning Indian Equities, US Mega-Caps, Global FX, Commodity Futures, and Crypto Perpetuals.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `q` | string | Yes | - | Search query keyword or prefix (e.g. `nifty`, `tata`, `bitcoin`). |

---

## 4. Macro Observatory, Catalysts & Spatial Radar

### `GET /api/observatory/radar`
2D Spatial Factor Positioning radar projecting global assets across **Growth vs. Inflation (Macro Regime)** and **Systematic Momentum vs. Tail Risk**.

---

## 5. Portfolio Optimization, Black-Litterman & Forecasting

### `POST /api/portfolio/optimize`
Calculates optimal portfolio weights under CVaR 95%, Minimum Variance, or Equal Risk Contribution (Risk Parity).

#### Request Body Schema
```json
{
  "tickers": ["AAPL", "MSFT", "NVDA", "JPM", "XOM"],
  "target_return": 0.18,
  "max_weight": 0.35,
  "objective": "MINIMIZE_CVAR",
  "confidence": 0.95
}
```

#### Response (`200 OK`)
```json
{
  "status": "OPTIMAL",
  "optimal_weights": {
    "AAPL": 0.22,
    "MSFT": 0.28,
    "NVDA": 0.18,
    "JPM": 0.17,
    "XOM": 0.15
  },
  "expected_annual_return": 0.194,
  "portfolio_volatility": 0.148,
  "portfolio_cvar_95": 0.0242,
  "sharpe_ratio": 1.31
}
```

---

## 6. 41-Bot Autonomous Fleet & Execution Gateway

### `GET /api/fleet/status`
Aggregated real-time telemetry across all 41 quantitative bots across Olympus, Valhalla, and Karnak divisions.

#### Response (`200 OK`)
```json
{
  "fleet_size": 41,
  "active_bots": 41,
  "total_realized_pnl_inr": 1613850.0,
  "total_unrealized_pnl_inr": 743160.0,
  "total_live_pnl_inr": 2357010.0,
  "total_live_pnl_usd": 28227.66,
  "divisions": {
    "olympus": { "count": 10, "pnl_inr": 333950.0 },
    "valhalla": { "count": 11, "pnl_inr": 475600.0 },
    "egyptian": { "count": 20, "pnl_inr": 804300.0 }
  },
  "circuit_breaker_status": "NORMAL_OPERATION",
  "last_updated": "2026-09-18T10:15:00Z"
}
```

### `GET /api/signals/execute`
Simulates VWAP / TWAP execution slicing with dynamic Kyle's Lambda volume impact modeling.

---

## 7. Tail Risk, VaR & CVaR 99% Engine

### `GET /api/risk/var`
Calculates Parametric, Historical, and Monte Carlo Value-at-Risk alongside Expected Shortfall (CVaR).

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tickers` | string | No | `AAPL,MSFT,NVDA` | Comma-delimited list of tickers. |
| `weights` | string | No | Equal | Portfolio allocation weights. |
| `confidence` | float | No | `0.99` | Confidence level (0.90, 0.95, 0.99, 0.999). |
| `n_sims` | int | No | `10000` | Number of Monte Carlo paths. |

---

## 8. Derivatives, Rates & Microstructure Slicers

### `GET /api/quant/derivatives`
Closed-form Black-Scholes-Merton and Hagan SABR options valuation with analytical Greeks.

### `GET /api/quant/microstructure`
Almgren-Chriss optimal liquidation schedule with market impact and Volume-Synchronized Probability of Toxicity (VPIN).

---

## 9. AI Foundation Models & TimesFM 3.0

### `GET /api/forecast/timesfm`
Zero-shot probabilistic forecasting powered by Google's TimesFM 3.0 foundation model over 10 quantile trajectories.

---

## 10. Research Governance, Walk-Forward & Stress Testing

### `POST /api/reports/memorandum`
Generates an institutional, printable Chief Investment Officer (CIO) Executive Risk Memorandum detailing portfolio vulnerabilities, stress scenarios, and regulatory compliance status.

---

## 11. Error Codes & System Fault Taxonomy

| HTTP Code | Error Key | Cause & Remediation |
| :--- | :--- | :--- |
| `400` | `INVALID_ARGUMENTS` | Malformed parameters (e.g. weights sum $\ne 1.0$). |
| `404` | `SECURITY_NOT_FOUND` | Unknown ticker symbol not registered in Securities Master. |
| `422` | `CONVERGENCE_FAILURE` | Optimization failed to satisfy convexity constraints. |
| `429` | `RATE_LIMIT_EXCEEDED` | Request throughput exceeded tier quota ($> 120\text{ req/min}$). |
| `503` | `CIRCUIT_BREAKER_ACTIVE` | SEC Rule 15c3-5 risk gate tripped; trading paused. |

---

*RISKOS Quantitative Architecture Division — Official Production API Specification.*
