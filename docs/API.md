# RISKOS REST API Reference Manual
Version: 2.1.0  
Protocol: HTTP / JSON  
Base URL: `http://127.0.0.1:8000`

The RISKOS API provides high-performance, institutional quantitative finance services spanning multi-asset market data feeds, real-time portfolio optimization, parametric and Monte Carlo risk analytics, walk-forward research backtesting, deep forecasting ensembles, and autonomous order execution.

---

## Table of Contents
1. [Authentication & CORS](#1-authentication--cors)
2. [Market Intelligence & Quotes](#2-market-intelligence--quotes)
3. [Risk & Value-at-Risk Engine](#3-risk--value-at-risk-engine)
4. [Statistical Model Validation](#4-statistical-model-validation)
5. [Walk-Forward Research Backtesting](#5-walk-forward-research-backtesting)
6. [Multi-Model Forecasting Ensemble](#6-multi-model-forecasting-ensemble)
7. [Portfolio Optimization](#7-portfolio-optimization)
8. [Derivatives, Rates & Microstructure](#8-derivatives-rates--microstructure)
9. [Autonomous Signals & Execution](#9-autonomous-signals--execution)
10. [Executive Risk Memorandum](#10-executive-risk-memorandum)

---

## 1. Authentication & CORS
RISKOS can be operated in local research mode without mandatory API tokens, or in production mode with CORS origins restricted via the `CORS_ALLOW_ORIGINS` environment variable in `.env`.

**Headers**:
- `Content-Type: application/json`
- `Accept: application/json`

---

## 2. Market Intelligence & Quotes

### `GET /api/market/quote`
Fetches real-time multi-venue quote with automatic fallback between NSE Direct, Google Finance, and Yahoo Finance.

**Parameters**:
- `symbol` (string, optional, default: `"RELIANCE"`): Ticker symbol or security ID.

**Example Request**:
```bash
curl -X GET "http://127.0.0.1:8000/api/market/quote?symbol=TCS"
```

**Example Response (200 OK)**:
```json
{
  "symbol": "TCS",
  "price": 4120.50,
  "change": 32.40,
  "change_pct": 0.79,
  "volume": 1254300,
  "provenance": "LIVE_DIRECT",
  "timestamp": "2026-09-08T09:15:00Z"
}
```

### `GET /api/market/quotes`
Fetches concurrent quotes for a comma-separated list of symbols.

**Parameters**:
- `symbols` (string, optional, default: `"RELIANCE,TCS,HDFCBANK,INFY,NVDA,AAPL"`)

### `GET /api/market/candles`
Returns historical OHLCV multi-timeframe candlestick data.

**Parameters**:
- `symbol` (string, required): Ticker symbol.
- `tf` (string, optional, default: `"1D"`): Timeframe (`1m`, `5m`, `15m`, `1h`, `1D`, `1W`).
- `period` (string, optional, default: `"1Y"`): Historical lookback window.

---

## 3. Risk & Value-at-Risk Engine

### `GET /api/risk/var`
Calculates parametric, historical, and Monte Carlo Value-at-Risk (VaR) and Conditional Value-at-Risk (CVaR / Expected Shortfall).

**Parameters**:
- `tickers` (string, optional, default: `"AAPL,MSFT,GOOGL,AMZN,JPM"`)
- `weights` (string, optional, default: equal weights)
- `confidence` (float, optional, default: `0.99`)
- `n_sims` (int, optional, default: `10000`)

**Example Request**:
```bash
curl -X GET "http://127.0.0.1:8000/api/risk/var?tickers=INFY,TCS&weights=0.5,0.5&confidence=0.99"
```

**Example Response**:
```json
{
  "portfolio_return_mean": 0.00072,
  "portfolio_return_std": 0.0135,
  "historical_var": -0.0312,
  "parametric_var": -0.0307,
  "monte_carlo_var": -0.0309,
  "historical_cvar": -0.0425,
  "parametric_cvar": -0.0352,
  "monte_carlo_cvar": -0.0418,
  "confidence_level": 0.99
}
```

---

## 4. Statistical Model Validation

### `GET /api/risk/validate-extended`
Executes comprehensive statistical validation on a VaR/CVaR risk model:
- **Kupiec POF Likelihood Ratio Test** ($LR_{\text{POF}}$)
- **Christoffersen Independence Test** ($LR_{\text{ind}}$)
- **Christoffersen Conditional Coverage Joint Test** ($LR_{\text{cc}} = LR_{\text{POF}} + LR_{\text{ind}}$)
- **Basel Committee Traffic Light Framework** (Green / Yellow / Red zones)

**Parameters**:
- `ticker` (string, optional, default: `"SPY"`)
- `confidence` (float, optional, default: `0.99`)

**Example Request**:
```bash
curl -X GET "http://127.0.0.1:8000/api/risk/validate-extended?ticker=SPY&confidence=0.99"
```

**Example Response**:
```json
{
  "ticker": "SPY",
  "confidence": 0.99,
  "observations": 252,
  "exceptions": 2,
  "kupiec_pof": {
    "test_stat": 0.1124,
    "p_value": 0.7374,
    "pass": true,
    "decision": "ACCEPT H0 (Model Calibrated)"
  },
  "christoffersen_independence": {
    "test_stat": 0.0321,
    "p_value": 0.8578,
    "pass": true,
    "decision": "ACCEPT H0 (Independent)"
  },
  "conditional_coverage_joint": {
    "test_stat": 0.1445,
    "p_value": 0.9303,
    "pass": true
  },
  "basel_traffic_light": {
    "zone": "GREEN",
    "basel_multiplier": 3.00,
    "regulatory_status": "Acceptable: VaR model requires no capital add-on"
  },
  "overall_status": "ACCEPT"
}
```

---

## 5. Walk-Forward Research Backtesting

### `GET /api/risk/research-backtest`
Runs an institutional-grade research backtest with:
- Almgren-Chriss quadratic market impact slippage
- Exchange turnover fees, STT, and broker commissions
- Real weight-drift turnover accounting
- Liquidity volume participation ceilings (5% ADV cap)
- Cash balance drag & yield accrual
- Multi-window walk-forward validation splits

**Parameters**:
- `tickers` (string, optional, default: `"AAPL,MSFT,GOOGL"`)
- `weights` (string, optional)
- `period` (string, optional, default: `"2y"`)
- `initial_capital` (float, optional, default: `10000000.0`)
- `risk_free_rate` (float, optional, default: `0.05`)
- `commission_bps` (float, optional, default: `3.0`)
- `stt_tax_bps` (float, optional, default: `10.0`)
- `exchange_fee_bps` (float, optional, default: `0.3`)
- `half_spread_bps` (float, optional, default: `2.5`)
- `walk_forward_splits` (int, optional, default: `1`)

**Example Response**:
```json
{
  "engine_type": "Institutional Research Backtester",
  "initial_capital": 10000000.0,
  "ending_capital": 12845230.15,
  "total_return": 0.2845,
  "cagr": 0.1332,
  "volatility": 0.1420,
  "sharpe_ratio": 0.5859,
  "sortino_ratio": 0.8412,
  "calmar_ratio": 1.1582,
  "omega_ratio": 1.3410,
  "max_drawdown": 0.1150,
  "win_rate": 0.5437,
  "profit_factor": 1.285,
  "total_fees_and_slippage": 42150.30,
  "annualized_turnover": 0.4210,
  "mean_slippage_bps": 3.82
}
```

---

## 6. Multi-Model Forecasting Ensemble

### `GET /api/forecast/ensemble`
Synthesizes predictions across **Google TimesFM 3.0**, **Meta Prophet GAM**, and **Merton Jump-Diffusion Monte Carlo** with dynamic regime-adaptive weighting and epistemic uncertainty quantification.

**Parameters**:
- `symbol` (string, optional, default: `"RELIANCE"`)
- `horizon` (int, optional, default: `64`)
- `weighting_scheme` (string, optional: `"regime_conditioned"` | `"inverse_error"` | `"equal"`)

**Example Response**:
```json
{
  "status": "MODEL_IMPLIED_SCENARIO",
  "symbol": "RELIANCE",
  "current_price": 2984.50,
  "horizon_days": 64,
  "weighting_scheme": "regime_conditioned",
  "regime_classification": "Strong Momentum Trend Expansion Regime",
  "model_weights": {
    "timesfm": 0.50,
    "prophet": 0.30,
    "merton": 0.20
  },
  "consensus_trajectory": [2988.10, 2992.40, "..."],
  "lower_bound_p10": [2940.20, 2935.10, "..."],
  "upper_bound_p90": [3040.80, 3055.20, "..."],
  "projected_return_pct": 5.42,
  "validation_diagnostics": {
    "in_sample_mase": 0.485,
    "epistemic_uncertainty_bps": 124.5,
    "is_model_implied": true
  }
}
```

---

## 7. Portfolio Optimization

### `GET /api/risk/optimize`
Performs CVaR linear programming or mean-variance SLSQP optimization.

**Parameters**:
- `tickers` (string)
- `target_return` (float, default: `0.10`)
- `max_weight` (float, default: `0.40`)

---

## 8. Derivatives, Rates & Microstructure

### `GET /api/derivatives/surface`
Outputs 3D SVI (Stochastic Volatility Inspired) volatility surface mesh with Black-Scholes and SABR parameters.

### `GET /api/rates/curve`
Constructs Nelson-Siegel / Svensson zero-coupon yield curves and evaluates key-rate duration profiles.

### `GET /api/microstructure/depth`
Calculates Order Flow Imbalance (OFI), Volume-Synchronized Probability of Toxicity (VPIN), and bid-ask queue dynamics.

---

## 9. Autonomous Signals & Execution

### `GET /api/signals/generate`
Generates multi-strategy trading signals based on Gaussian HMM regimes, RSI mean reversion, and momentum filters.

### `GET /api/signals/execute`
Simulates VWAP / TWAP execution slicing with synthetic microstructure slippage.

---

## 10. Executive Risk Memorandum

### `POST /api/reports/memorandum`
Compiles an institutional investment committee memorandum formatted to Goldman Sachs and Bridgewater asset management standards with cryptographic SHA-256 integrity seal.

---

## 11. Institutional Research Suite Endpoints (v3.0.0)

### `GET /api/research/ensemble/rolling-eval`
Executes genuine out-of-sample rolling-origin evaluation across multi-horizons (1d, 5d, 20d, 64d) for TimesFM, Prophet, Merton Jump Diffusion, and Ensemble against 6 mandatory statistical baselines (Random Walk, RW with Drift, Historical Mean, SMA-20, EMA, Seasonal Naive). Zero heuristic error multipliers.

**Parameters**:
- `symbol` (string, default: `"RELIANCE"`)
- `horizons` (string, comma-separated, default: `"1,5,20"`)
- `n_splits` (int, default: `5`)

### `GET /api/research/regime/matrix`
Evaluates market state across 6 institutional regimes (`LOW_VOL_BULL`, `HIGH_VOL_BULL`, `RANGEBOUND_NEUTRAL`, `DEFENSIVE_CORRECTION`, `CRISIS_CRASH`, `LIQUIDITY_SQUEEZE`) and tabulates historical model performance per regime.

**Parameters**:
- `symbol` (string, default: `"SPY"`)
- `period` (string, default: `"2y"`)

### `GET /api/research/portfolio/compare`
Simultaneously benchmarks 8 allocation strategies (Equal Weight, Market Weight, Min Variance, Max Sharpe, HRP, Risk Parity, Black-Litterman, Custom) across 18 institutional metrics including Almgren-Chriss slippage, turnover %, HHI concentration, and tail beta.

**Parameters**:
- `tickers` (string, comma-separated)
- `period` (string, default: `"1y"`)
- `risk_free_rate` (float, default: `0.05`)

### `GET /api/research/backtest/walk-forward`
Executes research-grade walk-forward backtest with Almgren-Chriss quadratic slippage, turnover fees, STT, automated leakage guards, and outputs a formal `RESEARCH_AUDIT_REPORT`.

**Parameters**:
- `tickers` (string, comma-separated)
- `period` (string, default: `"2y"`)
- `splits` (int, default: `3`)
- `initial_capital` (float, default: `10000000.0`)

### `GET /api/research/data/quality`
Audits input market data across 8 hygiene dimensions (non-positive prices, missing values, duplicate timestamps, non-monotonic sequencing, stale prices, price spikes, unadjusted splits, volume hygiene) and produces a 0–100 composite data quality score.

**Parameters**:
- `tickers` (string, comma-separated)
- `period` (string, default: `"1y"`)

