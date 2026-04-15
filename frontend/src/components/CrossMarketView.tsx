"use client";

import React from "react";
import { Globe2, ArrowRightLeft, ShieldCheck, AlertCircle } from "lucide-react";

interface CrossMarketProps {
  data: any;
}

export function CrossMarketView({ data }: CrossMarketProps) {
  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      
      {/* Header */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center gap-3 border-b border-bg-border pb-3 mb-3">
          <div className="p-2 rounded bg-forest-light text-forest">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              INDIA ↔ US CROSS-MARKET RISK ANALYTICS
            </h3>
            <p className="text-xs text-text-muted">
              Analyzing structural correlations, beta spillover, and USD/INR currency sensitivity across NSE/BSE and NYSE/NASDAQ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-bg-secondary rounded border border-bg-border">
            <span className="text-[10px] font-mono text-text-muted uppercase">AVG CROSS-MARKET CORRELATION</span>
            <div className="font-mono font-bold text-xl text-forest mt-1">
              {data.cross_market_correlation_avg}
            </div>
            <span className="text-[10px] font-mono text-text-light">S&P 500 ↕ NIFTY 50 Alignment</span>
          </div>

          <div className="p-3 bg-bg-secondary rounded border border-bg-border">
            <span className="text-[10px] font-mono text-text-muted uppercase">USD/INR FX VOLATILITY</span>
            <div className="font-mono font-bold text-xl text-status-warning mt-1">
              {data.fx_usdinr_volatility_pct}%
            </div>
            <span className="text-[10px] font-mono text-text-light">Annualized Currency Risk</span>
          </div>

          <div className="p-3 bg-bg-secondary rounded border border-bg-border">
            <span className="text-[10px] font-mono text-text-muted uppercase">INR DEPRECIATION IMPACT</span>
            <div className="font-mono font-bold text-xl text-text-main mt-1">
              +{data.inr_depreciation_risk_impact_pct}%
            </div>
            <span className="text-[10px] font-mono text-text-light">INR Investor Return Delta</span>
          </div>
        </div>
      </div>

      {/* Side-by-side Market Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* India Markets */}
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇮🇳</span>
              <h4 className="font-bold font-mono text-xs uppercase text-text-main">INDIA MARKETS (NSE / BSE)</h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-forest bg-forest-light px-2 py-0.5 rounded">
              NIFTY 50: 24,500.00
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-bg-border/50">
              <span className="text-text-muted">NIFTY 50 Volatility:</span>
              <span className="font-semibold text-text-main">13.2%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border/50">
              <span className="text-text-muted">NIFTY IT Index Volatility:</span>
              <span className="font-semibold text-text-main">18.4%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border/50">
              <span className="text-text-muted">Key Constituents:</span>
              <span className="font-semibold text-text-main">RELIANCE, TCS, INFY, HDFCBANK</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-muted">Portfolio Weight:</span>
              <span className="font-semibold text-forest">50.0%</span>
            </div>
          </div>
        </div>

        {/* US Markets */}
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇺🇸</span>
              <h4 className="font-bold font-mono text-xs uppercase text-text-main">UNITED STATES (NYSE / NASDAQ)</h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-forest bg-forest-light px-2 py-0.5 rounded">
              S&P 500: 5,500.00
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-bg-border/50">
              <span className="text-text-muted">S&P 500 Volatility:</span>
              <span className="font-semibold text-text-main">14.8%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border/50">
              <span className="text-text-muted">NASDAQ 100 Volatility:</span>
              <span className="font-semibold text-text-main">21.2%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border/50">
              <span className="text-text-muted">Key Constituents:</span>
              <span className="font-semibold text-text-main">NVDA, AAPL, MSFT, JPM, GS</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-muted">Portfolio Weight:</span>
              <span className="font-semibold text-forest">50.0%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Cross-Market Correlation Matrix Cards */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <h4 className="font-bold font-mono text-xs uppercase text-text-main border-b border-bg-border pb-3 mb-3">
          STRUCTURAL CROSS-MARKET CORRELATION PAIRS
        </h4>

        <div className="space-y-3">
          {data.pairs?.map((p: any, idx: number) => (
            <div key={idx} className="p-3 bg-bg-secondary rounded border border-bg-border flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-4 h-4 text-forest" />
                <div>
                  <div className="font-bold text-text-main">{p.pair}</div>
                  <div className="text-[11px] text-text-muted">{p.impact}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-forest text-sm">{p.correlation}</div>
                <div className="text-[10px] text-text-light">{p.regime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
