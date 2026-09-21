# RISKOS — Alpha Vantage News Intelligence & Event-Driven Engine

## Architecture Overview

The RISKOS News Intelligence Engine transforms real-time news data from an observational text stream into a first-class quantitative factor matrix flowing directly into risk models, portfolio construction, and execution algorithms.

```
                    ALPHA VANTAGE API (NEWS_SENTIMENT)
                                  │
                      ┌───────────┴───────────┐
                      │                       │
                 MARKET DATA              NEWS DATA
                      │                       │
                      └───────────┬───────────┘
                                  ↓
                        NEWS NORMALIZATION
                                  ↓
                          ENTITY RESOLUTION
                                  ↓
                        EVENT CLASSIFICATION
                                  ↓
                       MATERIALITY & NOVELTY
                                  ↓
                       HISTORICAL EVENT IMPACT
                                  ↓
                          MARKET REACTION
                                  ↓
                            NEWS ALPHA
                                  ↓
                      EXISTING RISKOS FRAMEWORK
                      ├── Momentum & Factors
                      ├── GARCH / HMM Regime
                      ├── TimesFM Forecasting
                      └── CVaR Portfolio Risk
                                  ↓
                         SIGNAL AUDIT LEDGER
```

---

## 1. Alpha Vantage Provider Layer

The system interfaces with Alpha Vantage's primary intelligence endpoint:
```http
GET https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={tickers}&topics={topics}&sort=LATEST&limit=50&apikey={API_KEY}
```

### Rate-Limit Management & Caching
- **Request Manager**: Handled by `AlphaVantageRequestManager` (`api/market/news.js` and `backend/engine/providers/alpha_vantage_news.py`).
- **TTL Cache**: General news feeds are cached in-memory for **300 seconds** (5 minutes); ticker-specific requests are cached for **600 seconds** (10 minutes).
- **Request Deduplication**: In-flight promises are pooled by parameter hash; multiple components requesting the same ticker share a single upstream HTTP request.
- **Failover & Degradation**: In the event of rate-limit warnings ("Note: Thank you for using Alpha Vantage..."), the engine returns stale cache with `STALE_CACHE` or normalized high-fidelity offline fixtures with `DEGRADED_FALLBACK`.

---

## 2. Core News Intelligence Modules

| Module | Responsibility | Key Output |
| :--- | :--- | :--- |
| `newsNormalizationEngine.js` | Parses ISO timestamps (`publishedAt`, `receivedAt`, `processedAt`), clusters repetitive wire reports into `NewsStoryCluster`. | Normalized `NewsArticle[]`, Story Clusters, Freshness decay ($e^{-\lambda \Delta t}$). |
| `newsEntityResolver.js` | Bridges ticker tokens to canonical RISKOS `SecurityMaster` (ISIN, Sector, Industry, Market Cap, Beta, Portfolio & Watchlist flags). | Resolved Entity or `ENTITY_UNCERTAIN`. |
| `newsEventClassifier.js` | Classifies headlines into 28 standardized institutional categories. Stores `eventConfidence` independently from sentiment polarity. | `eventType`, `eventConfidence` (0–100), signature matches. |
| `newsMaterialityEngine.js` | Evaluates economic gravity, ticker relevance, company size tier, and portfolio exposure. | `materialityScore` (0–100) & rating (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`). |
| `newsNoveltyEngine.js` | Measures semantic overlap against rolling 30-day lookback window to penalize syndicated wire repeats. | `noveltyScore` (0–100) & human-auditable reason string. |
| `historicalEventImpactEngine.js` | Empirical event study of forward reactions across 8 horizons (`5m`, `15m`, `30m`, `1h`, `1d`, `3d`, `5d`, `20d`). | $N$, Mean, Median, Volatility, Hit Rate, MAE, MFE, 95% CI. |
| `newsMarketReactionEngine.js` | Corroborates event with real-time price $\Delta\%$, RVOL, volatility spike, and sector/benchmark moves. | Confirmation: `STRONG`, `MODERATE`, `DIVERGENT`, `UNCONFIRMED`. |
| `newsPriceAttribution.js` | Multifactor beta residual estimation: $\text{Abnormal Return} = R_{\text{asset}} - \mathbb{E}[R \mid \text{factors}]$. | Abnormal return estimate & attribution share $\%$. |
| `newsSignalEngine.js` | Formulates composite News Alpha, enforces `NO_TRADE` gating on divergence, and computes additive factor decomposition. | `News Alpha` ($-100$ to $+100$), `Signal`, `NO_TRADE` decision. |
| `newsPortfolioRisk.js` | Aggregates portfolio-wide event risk, positive/negative exposure breakdown, and constituent jump warnings. | Net News Score, Event Risk Concentration. |

---

## 3. Dedicated Terminal Portal: News Corner

Accessible via `/news.html` or Bloomberg mnemonic `NEWS <GO>`:
- **Left Panel**: Live streaming feed with real-time ticker and topic filters, search, and provenance badges.
- **Center Panel**: "How It Could Affect The Market" signature card, Historical Analogue forward reaction table, Market Impact Relational Flow Map, and Sector News Heatmap.
- **Right Panel**: Market Movers, Personalized Portfolio Event Risk, and Multi-Signal Additive Decomposition with "Explain Signal" auditor.
