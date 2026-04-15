"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BrainCircuit, 
  CheckCircle2, 
  Activity,
  Layers,
  Database
} from "lucide-react";
import { InvestigationModal } from "./InvestigationModal";

interface RiskOverviewProps {
  data: any;
}

export function RiskOverview({ data }: RiskOverviewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetMetric, setTargetMetric] = useState("Overall Risk Score");

  const openInvestigation = (metric: string) => {
    setTargetMetric(metric);
    setModalOpen(true);
  };

  const positions = [
    { ticker: "NVDA", market: "US (NASDAQ)", weight: "12.0%", price: "$124.50", change: "+3.42%", beta: "1.74", var_99: "$8,420" },
    { ticker: "AAPL", market: "US (NASDAQ)", weight: "10.0%", price: "$224.20", change: "+1.15%", beta: "1.18", var_99: "$4,120" },
    { ticker: "MSFT", market: "US (NASDAQ)", weight: "8.0%", price: "$442.80", change: "+0.85%", beta: "1.10", var_99: "$3,650" },
    { ticker: "JPM", market: "US (NYSE)", weight: "8.0%", price: "$212.40", change: "+0.45%", beta: "1.06", var_99: "$3,110" },
    { ticker: "RELIANCE.NS", market: "India (NSE)", weight: "10.0%", price: "₹3,020.00", change: "-0.82%", beta: "0.95", var_99: "₹2.4L" },
    { ticker: "TCS.NS", market: "India (NSE)", weight: "10.0%", price: "₹4,215.00", change: "-0.40%", beta: "0.82", var_99: "₹2.1L" },
    { ticker: "HDFCBANK.NS", market: "India (NSE)", weight: "12.0%", price: "₹1,660.00", change: "+0.65%", beta: "1.02", var_99: "₹2.8L" },
  ];

  return (
    <div className="p-6 space-y-6 font-sans select-none text-text-main max-w-7xl mx-auto">
      
      {/* 1. Header Banner & Risk Score Overview */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bg-border pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg font-mono tracking-tight">PORTFOLIO RISK COMMAND CENTER</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-forest-light text-forest border border-forest/20">
                US + INDIA DUAL MARKET
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Portfolio Exposure: <strong className="text-text-main font-mono">$1,284,420.00 USD</strong> | Benchmark: S&P 500 / NIFTY 50
            </p>
          </div>

          <button
            onClick={() => openInvestigation("Overall Risk Score")}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-forest hover:bg-forest-dark text-white font-mono text-xs font-semibold transition-colors shadow-sm self-start md:self-auto"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>INVESTIGATE WITH K2 AI</span>
          </button>
        </div>

        {/* Dense Risk Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          
          {/* Overall Risk */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted font-bold uppercase">OVERALL RISK</span>
              <span className="text-[10px] font-mono text-status-warning font-semibold">↑ 8.4%</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-text-main">
                {data.overall_risk_score}
              </span>
              <span className="text-xs font-mono text-text-muted">/100</span>
            </div>
            <button 
              onClick={() => openInvestigation("Overall Risk Score")}
              className="mt-2 text-[10px] font-mono text-forest font-bold hover:underline text-left"
            >
              [ WHY? ]
            </button>
          </div>

          {/* Market Risk */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted font-bold uppercase">MARKET RISK</span>
              <span className="text-[10px] font-mono text-status-critical font-semibold">VaR 99%</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-text-main">
                {data.market_risk_score}
              </span>
              <span className="text-xs font-mono text-text-muted">/100</span>
            </div>
            <button 
              onClick={() => openInvestigation("Market Risk")}
              className="mt-2 text-[10px] font-mono text-forest font-bold hover:underline text-left"
            >
              [ WHY? ]
            </button>
          </div>

          {/* Credit Risk */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted font-bold uppercase">CREDIT RISK</span>
              <span className="text-[10px] font-mono text-status-normal font-semibold">PD 2.18%</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-text-main">
                {data.credit_risk_score}
              </span>
              <span className="text-xs font-mono text-text-muted">/100</span>
            </div>
            <button 
              onClick={() => openInvestigation("Credit Risk")}
              className="mt-2 text-[10px] font-mono text-forest font-bold hover:underline text-left"
            >
              [ WHY? ]
            </button>
          </div>

          {/* Liquidity Risk */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted font-bold uppercase">LIQUIDITY</span>
              <span className="text-[10px] font-mono text-status-warning font-semibold">⚠ Util 74%</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-status-warning">
                {data.liquidity_risk_score}
              </span>
              <span className="text-xs font-mono text-text-muted">/100</span>
            </div>
            <button 
              onClick={() => openInvestigation("Liquidity Risk")}
              className="mt-2 text-[10px] font-mono text-forest font-bold hover:underline text-left"
            >
              [ WHY? ]
            </button>
          </div>

          {/* Interest Rate Risk */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted font-bold uppercase">INTEREST RATE</span>
              <span className="text-[10px] font-mono text-text-muted font-semibold">+100 bps</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-text-main">
                {data.interest_rate_risk_score}
              </span>
              <span className="text-xs font-mono text-text-muted">/100</span>
            </div>
            <button 
              onClick={() => openInvestigation("Interest Rate Risk")}
              className="mt-2 text-[10px] font-mono text-forest font-bold hover:underline text-left"
            >
              [ WHY? ]
            </button>
          </div>

          {/* Capital Risk */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted font-bold uppercase">CAPITAL RATIO</span>
              <span className="text-[10px] font-mono text-status-normal font-semibold">CET1 13.8%</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-text-main">
                {data.capital_risk_score}
              </span>
              <span className="text-xs font-mono text-text-muted">/100</span>
            </div>
            <button 
              onClick={() => openInvestigation("Capital Risk")}
              className="mt-2 text-[10px] font-mono text-forest font-bold hover:underline text-left"
            >
              [ WHY? ]
            </button>
          </div>

        </div>
      </div>

      {/* 2. Active Risk Alerts & Data Quality Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Alerts (2 cols) */}
        <div className="md:col-span-2 bg-bg-surface border border-bg-border rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-3">
            <h4 className="font-bold font-mono text-xs uppercase text-text-main flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              ACTIVE RISK ALERTS & ANOMALIES ({data.active_alerts?.length || 0})
            </h4>
            <span className="text-[10px] font-mono text-text-muted">REAL-TIME STREAM</span>
          </div>

          <div className="space-y-2">
            {data.active_alerts?.map((alert: any) => (
              <div 
                key={alert.id}
                className="p-3 bg-bg-secondary rounded border border-bg-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                    alert.level === "CRITICAL" ? "bg-status-critical/10 text-status-critical border border-status-critical/30" :
                    alert.level === "WARNING" ? "bg-status-warning/10 text-status-warning border border-status-warning/30" :
                    "bg-forest-light text-forest border border-forest/20"
                  }`}>
                    {alert.level}
                  </span>
                  <div>
                    <span className="font-mono text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                      [{alert.category}]
                    </span>
                    <p className="text-text-main font-medium mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openInvestigation(alert.category)}
                  className="px-2.5 py-1 rounded bg-bg-surface border border-bg-border hover:bg-bg-secondary font-mono text-[10px] font-semibold text-forest whitespace-nowrap"
                >
                  INVESTIGATE
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality & Regime Panel (1 col) */}
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-3">
              <h4 className="font-bold font-mono text-xs uppercase text-text-main flex items-center gap-2">
                <Database className="w-4 h-4 text-forest" />
                DATA QUALITY ENGINE
              </h4>
              <span className="text-[10px] font-mono font-bold text-status-normal">
                {data.data_quality?.overall_quality_score}%
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-bg-border/50">
                <span className="text-text-muted">Ingested Records:</span>
                <span className="font-semibold text-text-main">
                  {data.data_quality?.records_ingested?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-bg-border/50">
                <span className="text-text-muted">Completeness:</span>
                <span className="font-semibold text-status-normal">
                  {data.data_quality?.completeness_pct}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-bg-border/50">
                <span className="text-text-muted">Consistency:</span>
                <span className="font-semibold text-status-normal">
                  {data.data_quality?.consistency_pct}%
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Anomalies Detected:</span>
                <span className="font-semibold text-status-warning">
                  {data.data_quality?.anomalies}
                </span>
              </div>
            </div>
          </div>

          {/* Market Regime Badge */}
          <div className="p-3 bg-bg-secondary rounded border border-bg-border">
            <div className="text-[10px] font-mono text-text-muted font-bold uppercase">ML REGIME DETECTION</div>
            <div className="font-mono font-bold text-xs mt-1" style={{ color: data.market_regime?.status_color }}>
              {data.market_regime?.current_regime}
            </div>
            <div className="text-[10px] text-text-muted font-mono mt-1">
              Vol Ratio: {data.market_regime?.volatility_ratio}x | GMM Prob: 70%
            </div>
          </div>
        </div>

      </div>

      {/* 3. Dense Institutional Positions Table */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-3">
          <h4 className="font-bold font-mono text-xs uppercase text-text-main">
            PORTFOLIO POSITIONS & RISK EXPOSURES (US & INDIA)
          </h4>
          <span className="text-[10px] font-mono text-text-muted">7 CONSTITUENTS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-bg-border text-text-muted uppercase text-[10px]">
                <th className="py-2 px-3 font-semibold">Asset Ticker</th>
                <th className="py-2 px-3 font-semibold">Market Jurisdiction</th>
                <th className="py-2 px-3 font-semibold">Weight %</th>
                <th className="py-2 px-3 font-semibold">Last Price</th>
                <th className="py-2 px-3 font-semibold">24h Return</th>
                <th className="py-2 px-3 font-semibold">Beta (vs SPY/NSEI)</th>
                <th className="py-2 px-3 font-semibold">1D 99% VaR</th>
                <th className="py-2 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/60">
              {positions.map((row) => (
                <tr key={row.ticker} className="hover:bg-bg-secondary transition-colors">
                  <td className="py-2.5 px-3 font-bold text-text-main">{row.ticker}</td>
                  <td className="py-2.5 px-3 text-text-muted text-[11px]">{row.market}</td>
                  <td className="py-2.5 px-3 font-semibold text-text-main">{row.weight}</td>
                  <td className="py-2.5 px-3 text-text-main">{row.price}</td>
                  <td className={`py-2.5 px-3 font-semibold ${row.change.startsWith("+") ? "text-status-normal" : "text-status-critical"}`}>
                    {row.change}
                  </td>
                  <td className="py-2.5 px-3 text-text-main">{row.beta}</td>
                  <td className="py-2.5 px-3 text-status-warning font-semibold">{row.var_99}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button 
                      onClick={() => openInvestigation(row.ticker)}
                      className="text-[10px] font-bold text-forest hover:underline"
                    >
                      [ WHY? ]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integration */}
      <InvestigationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        metric={targetMetric}
      />

    </div>
  );
}
