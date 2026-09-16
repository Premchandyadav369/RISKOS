# RISKOS Institutional Trust Center & Market Data Integrity Standard

## 1. Executive Summary & Mission
RISKOS is built on a single, uncompromising principle: **Financial intelligence must be mathematically transparent, empirically verifiable, and completely honest about data freshness and simulation boundaries.**

Financial platforms frequently obscure data delays, generate misleading synthetic ticks outside of exchange hours, or market predictive algorithms as guaranteed profits. RISKOS explicitly rejects this approach.

Every metric, risk calculation, and price quote on RISKOS adheres to our **Zero-Deception Architecture**:
1. **No Fake Live Updates**: If an exchange is closed, RISKOS displays `MARKET CLOSED` with the exact final settlement timestamp. Synthetic micro-ticks are strictly halted.
2. **Explicit Data Provenance**: Every quote is tagged with its provenance (`LIVE`, `DELAYED`, `CACHED`, `FALLBACK`, `SIMULATED`, or `SYNTHETIC`).
3. **Open Mathematical Formulations**: No black boxes. Every model (Sharpe, CVaR, GARCH, Black-Litterman, Merton, CPCV) is inspectable via one-click "Explain This" modals featuring LaTeX derivations and academic citations.
4. **Uncalibrated Model Transparency**: Strategy signals are labeled with uncertainty bounds ($\pm 1.5\sigma$) and clearly designated as research simulation models, not investment advice.

---

## 2. Market Data Truth & Exchange Calendars
The core engine governing real-time status across RISKOS is `marketDataTruth.js`. It maintains deterministic, atomic wall-clock state machines for the world's primary financial venues:

| Exchange / Venue | Region | Trading Hours (Local) | Timezone | Status Verification |
| :--- | :--- | :--- | :--- | :--- |
| **National Stock Exchange (NSE)** | India | 09:15 – 15:30 IST | Asia/Kolkata | Statutory holiday calendar + Weekend detection |
| **Bombay Stock Exchange (BSE)** | India | 09:15 – 15:30 IST | Asia/Kolkata | Statutory holiday calendar + Weekend detection |
| **Multi Commodity Exchange (MCX)** | India | 09:00 – 23:30 IST | Asia/Kolkata | Evening commodity session support |
| **New York Stock Exchange (NYSE)** | United States | 09:30 – 16:00 EST | America/New_York | Pre/Regular/Post market + US Federal holidays |
| **NASDAQ** | United States | 09:30 – 16:00 EST | America/New_York | Pre/Regular/Post market + US Federal holidays |
| **Cryptocurrency Assets** | Global | 24/7/365 Continuous | UTC | Atomic UTC timestamps |

### What Happens When Markets Close?
- The header clock transitions from green `OPEN` to amber/slate `CLOSED`.
- Background micro-tick generators immediately pause execution.
- Order book trade tapes halt and state: `MARKET CLOSED • Order flow tape paused • Final settlement recorded`.
- Historical closing prices remain stable and frozen until the next official exchange auction.

---

## 3. Provenance Audit Modal
Users and compliance auditors can click the market status badge on any page or trigger `Ctrl+K -> Data Provenance` to open the live interactive **Data Provenance Audit Window**. This displays:
- Active data provider (Yahoo Finance, OpenBB ODP, FMP, Polygon, Simulated Engine)
- Feed latency in milliseconds ($\le 5	ext{ms}$ local execution)
- Exact exchange clock time in IST and EST
- Cryptographic data contract version (`2.0-PROD`)
- Calculated Data Quality Score (0 - 100%)

---

## 4. Regulatory & Educational Compliance Disclaimers
- **Educational and Research Purpose**: RISKOS is designed for academic, quantitative research, risk analysis, and educational purposes.
- **SEBI / SEC Disclaimer**: Nothing presented in this platform constitutes an offer, solicitation, or recommendation to buy or sell securities. Algorithmic signals reflect quantitative factor models and backtested historical data, which are inherently subject to market risk, slippage, and regime changes. Past performance is no guarantee of future returns.
