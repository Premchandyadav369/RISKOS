/**
 * RISKOS Sovereign Macro & Cross-Asset Telemetry Engine
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: macroDataFeedEngine.js
 * 
 * Ingests live institutional macroeconomic, energy, and digital asset feeds:
 *   1. Federal Reserve Economic Data (FRED):
 *      - 10-Year Real Interest Rate (DFII10)
 *      - 10Y-2Y Treasury Yield Curve Spread (T10Y2Y)
 *      - High Yield Option-Adjusted Credit Spread (BAMLH0A0HYM2)
 *      - Effective Federal Funds Rate (FEDFUNDS)
 *      - 10-Year Breakeven Inflation Expectation (T10YIE)
 *   2. U.S. Energy Information Administration (EIA):
 *      - Brent Crude Oil Spot Benchmark (DCOILBRENTEU)
 *      - WTI Cushing Crude Oil Spot (DCOILWTICO)
 *      - Henry Hub Natural Gas Spot Price (DHHNGSP)
 *   3. CoinGecko 24/7 Digital Asset Market Feed:
 *      - Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Binance Coin (BNB), Ripple (XRP)
 *      - Global 24h Volatility & Market Capitalization
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MacroDataFeedEngine = factory();
    if (typeof window !== 'undefined') {
      window.macroDataFeed = new root.MacroDataFeedEngine.MacroDataFeedClient();
    }
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '5.0.0-PROPRIETARY';
  const CODENAME = 'P.R.E.M.-MacroData';

  // Deterministic Baseline Calibrations
  const BASELINE_SNAPSHOT = {
    timestamp: new Date().toISOString(),
    fred: {
      realYield10Y: 2.77, // % (DFII10)
      yieldCurveSlope10Y2Y: 0.29, // % (T10Y2Y +29 bps steepening)
      highYieldOas: 315, // bps (BAMLH0A0HYM2)
      fedFundsRate: 4.83, // % (FEDFUNDS)
      breakevenInflation10Y: 2.32, // % (T10YIE)
      lastUpdated: '2026-11-23'
    },
    eia: {
      brentCrudeUsd: 92.94, // $/bbl (DCOILBRENTEU)
      wtiCrudeUsd: 88.50, // $/bbl (DCOILWTICO)
      naturalGasUsd: 2.85, // $/MMBtu (DHHNGSP)
      brentBaselineUsd: 85.00,
      brentDeltaPct: 9.34, // +9.34% vs baseline
      lastUpdated: '2026-11-20'
    },
    coingecko: {
      bitcoin: { usd: 59515.00, usd_24h_change: -4.90, market_cap: 1172850000000 },
      ethereum: { usd: 1671.00, usd_24h_change: -5.67, market_cap: 201450000000 },
      solana: { usd: 69.10, usd_24h_change: -6.20, market_cap: 32450000000 },
      binancecoin: { usd: 540.20, usd_24h_change: -2.15, market_cap: 78500000000 },
      ripple: { usd: 0.54, usd_24h_change: -1.80, market_cap: 30120000000 },
      lastUpdated: new Date().toISOString()
    }
  };

  class MacroDataFeedClient {
    constructor(options = {}) {
      this.version = VERSION;
      this.codename = CODENAME;
      this.timeoutMs = options.timeoutMs || 6000;
      this.cacheTtlMs = options.cacheTtlMs || 60000; // 1 min cache
      this.cachedTelemetry = Object.assign({}, BASELINE_SNAPSHOT);
      this.lastFetchTime = 0;
    }

    /**
     * Parse last non-empty numeric observation from FRED CSV
     */
    parseFredCsv(csvText) {
      if (!csvText || typeof csvText !== 'string') return null;
      const lines = csvText.trim().split(/\r?\n/);
      for (let i = lines.length - 1; i >= 1; i--) {
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
          const date = parts[0].trim();
          const val = parseFloat(parts[1].trim());
          if (!isNaN(val)) {
            return { date, value: val };
          }
        }
      }
      return null;
    }

    /**
     * Fetch Live CoinGecko 24/7 Digital Asset Prices
     */
    async fetchCoinGecko() {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true&include_market_cap=true';
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RISKOS/5.0' },
          signal: AbortSignal.timeout(this.timeoutMs)
        });
        if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
        const data = await res.json();
        
        return {
          bitcoin: data.bitcoin || this.cachedTelemetry.coingecko.bitcoin,
          ethereum: data.ethereum || this.cachedTelemetry.coingecko.ethereum,
          solana: data.solana || this.cachedTelemetry.coingecko.solana,
          binancecoin: data.binancecoin || this.cachedTelemetry.coingecko.binancecoin,
          ripple: data.ripple || this.cachedTelemetry.coingecko.ripple,
          lastUpdated: new Date().toISOString()
        };
      } catch (err) {
        return Object.assign({}, this.cachedTelemetry.coingecko);
      }
    }

    /**
     * Fetch a FRED Time Series via Public Graph CSV
     */
    async fetchFredSeries(seriesId) {
      const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RISKOS/5.0' },
          signal: AbortSignal.timeout(this.timeoutMs)
        });
        if (!res.ok) throw new Error(`FRED HTTP ${res.status} for ${seriesId}`);
        const text = await res.text();
        return this.parseFredCsv(text);
      } catch (err) {
        return null;
      }
    }

    /**
     * Fetch Live Macroeconomic Indicators from FRED
     */
    async fetchFredMacro() {
      try {
        const [dfii10, t10y2y, oas, fedfunds, breakeven] = await Promise.all([
          this.fetchFredSeries('DFII10'), // 10Y Real Yield
          this.fetchFredSeries('T10Y2Y'), // Yield curve slope
          this.fetchFredSeries('BAMLH0A0HYM2'), // High yield spread
          this.fetchFredSeries('FEDFUNDS'),
          this.fetchFredSeries('T10YIE') // 10Y Inflation Breakeven
        ]);

        return {
          realYield10Y: dfii10 ? dfii10.value : this.cachedTelemetry.fred.realYield10Y,
          yieldCurveSlope10Y2Y: t10y2y ? t10y2y.value : this.cachedTelemetry.fred.yieldCurveSlope10Y2Y,
          highYieldOas: oas ? Math.round(oas.value * 100) : this.cachedTelemetry.fred.highYieldOas, // Convert % to bps
          fedFundsRate: fedfunds ? fedfunds.value : this.cachedTelemetry.fred.fedFundsRate,
          breakevenInflation10Y: breakeven ? breakeven.value : this.cachedTelemetry.fred.breakevenInflation10Y,
          lastUpdated: dfii10 ? dfii10.date : this.cachedTelemetry.fred.lastUpdated
        };
      } catch (err) {
        return Object.assign({}, this.cachedTelemetry.fred);
      }
    }

    /**
     * Fetch Live Petroleum & Energy Spot Benchmarks from EIA
     */
    async fetchEiaEnergy() {
      try {
        const [brent, wti, natgas] = await Promise.all([
          this.fetchFredSeries('DCOILBRENTEU'), // EIA Brent
          this.fetchFredSeries('DCOILWTICO'),   // EIA WTI
          this.fetchFredSeries('DHHNGSP')       // EIA Henry Hub NatGas
        ]);

        const brentUsd = brent ? brent.value : this.cachedTelemetry.eia.brentCrudeUsd;
        const wtiUsd = wti ? wti.value : this.cachedTelemetry.eia.wtiCrudeUsd;
        const natgasUsd = natgas ? natgas.value : this.cachedTelemetry.eia.naturalGasUsd;
        const brentBase = this.cachedTelemetry.eia.brentBaselineUsd || 85.00;
        const brentDelta = Number((((brentUsd - brentBase) / brentBase) * 100).toFixed(2));

        return {
          brentCrudeUsd: brentUsd,
          wtiCrudeUsd: wtiUsd,
          naturalGasUsd: natgasUsd,
          brentBaselineUsd: brentBase,
          brentDeltaPct: brentDelta,
          lastUpdated: brent ? brent.date : this.cachedTelemetry.eia.lastUpdated
        };
      } catch (err) {
        return Object.assign({}, this.cachedTelemetry.eia);
      }
    }

    /**
     * Fetch all Macro Telemetry Concurrently (FRED + EIA + CoinGecko)
     */
    async fetchAllTelemetry(forceRefresh = false) {
      const now = Date.now();
      if (!forceRefresh && (now - this.lastFetchTime) < this.cacheTtlMs) {
        return this.cachedTelemetry;
      }

      const [fredData, eiaData, cryptoData] = await Promise.all([
        this.fetchFredMacro(),
        this.fetchEiaEnergy(),
        this.fetchCoinGecko()
      ]);

      const consolidated = {
        timestamp: new Date().toISOString(),
        fred: fredData,
        eia: eiaData,
        coingecko: cryptoData
      };

      this.cachedTelemetry = consolidated;
      this.lastFetchTime = now;
      return consolidated;
    }

    /**
     * Propagate Live Telemetry directly into RISKOS Institutional 12-Factor Engine
     */
    injectIntoPricingEngine(engine) {
      if (!engine || !engine.macroEnvironment) return;
      const t = this.cachedTelemetry;

      // Inject FRED 10Y Real Yield: percent to decimal (e.g., 2.77% -> 0.0277)
      if (t.fred && t.fred.realYield10Y) {
        engine.macroEnvironment.realYieldUS = Number((t.fred.realYield10Y / 100.0).toFixed(4));
      }

      // Inject FRED 10Y-2Y Curve Slope (e.g., +0.29% -> 0.0029)
      if (t.fred && t.fred.yieldCurveSlope10Y2Y) {
        engine.macroEnvironment.yieldCurveSlopeUS = Number((t.fred.yieldCurveSlope10Y2Y / 100.0).toFixed(4));
      }

      // Inject EIA Brent Crude shock (e.g. +9.34% -> 0.0934)
      if (t.eia && typeof t.eia.brentDeltaPct === 'number') {
        engine.macroEnvironment.brentDeltaPct = Number((t.eia.brentDeltaPct / 100.0).toFixed(4));
      }

      return engine.macroEnvironment;
    }
  }

  const defaultClient = new MacroDataFeedClient();

  return {
    VERSION,
    CODENAME,
    BASELINE_SNAPSHOT,
    MacroDataFeedClient,
    defaultClient
  };
}));
