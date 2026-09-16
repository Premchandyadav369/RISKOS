# RISKOS User Journeys & Persona Workflows

## Persona A: Aarav — The Finance Beginner
- **Goal**: Wants to understand Indian stocks and learn what makes a stock move without getting lost in Wall Street jargon.
- **Entry Point**: `index.html` -> clicks "Explore Markets" or "Learn Quant Finance".
- **Experience**:
  1. Arrives on clean landing page; selects "Beginner" on the persona switcher.
  2. The page highlights the "Explore Markets" and "Learn Quant Finance" paths.
  3. Clicks into `ticker.html` and browses company cards with plain-English business descriptions.
  4. Encounters a term like "Beta" or "Sharpe Ratio" and clicks the subtle `Explain` badge to open a popup with real-world analogies (e.g., sports car with smooth suspension).
  5. Navigates to `learn.html` to complete Lab 1 ("Compound Interest & Return Compounding").

---

## Persona B: Priya — The Active Portfolio Investor
- **Goal**: Manages personal equity holdings across NSE and US tech; wants downside protection against sudden crashes.
- **Entry Point**: `index.html` -> clicks "Build & Optimize Portfolio".
- **Experience**:
  1. Enters `portfolio_optimizer.html` and inputs her portfolio (RELIANCE, TCS, HDFCBANK, NVDA, AAPL).
  2. Reviews historical crash simulations (e.g. 2020 Covid Shock, 2008 Financial Crisis).
  3. Uses the Rockafellar CVaR Optimizer to find the minimum tail loss allocation.
  4. Checks the Market Data Truth indicator to confirm all quotes reflect official closing prices.

---

## Persona C: Dr. Marcus Vance — Institutional Quant Researcher
- **Goal**: Validates a statistical arbitrage strategy, audits cross-asset correlations, and runs execution slippage models.
- **Entry Point**: `app.html` -> launches 7 Desks.
- **Experience**:
  1. Opens Desk 1 for GARCH conditional volatility and Gaussian HMM regime classification.
  2. Uses Desk 3 to inspect signal confidence and execution slippage across VWAP order slices.
  3. Opens Desk 6 (Quant Sandbox) to test Combinatorial Purged Cross-Validation (CPCV) against overfitting.
  4. Inspects the Data Provenance Audit Modal to verify feed latency ($\le 5	ext{ms}$).
