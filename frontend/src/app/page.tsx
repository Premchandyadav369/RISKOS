"use client";

import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { BloombergBar } from "@/components/BloombergBar";
import { RiskOverview } from "@/components/RiskOverview";
import { StratDesk } from "@/components/StratDesk";
import { TradeSim } from "@/components/TradeSim";
import { CrossMarketView } from "@/components/CrossMarketView";
import { QuantLab } from "@/components/QuantLab";
import { StressLab } from "@/components/StressLab";
import { VolSurface } from "@/components/VolSurface";
import { BaselCapital } from "@/components/BaselCapital";
import { ContagionGraph } from "@/components/ContagionGraph";
import { NewsView } from "@/components/NewsView";
import { LimitsMonitor } from "@/components/LimitsMonitor";
import { ReportsView } from "@/components/ReportsView";
import { Methodology } from "@/components/Methodology";
import { YieldCurve } from "@/components/YieldCurve";
import { OptionsCalc } from "@/components/OptionsCalc";
import { ModelExplain } from "@/components/ModelExplain";
import { SwapPricer } from "@/components/SwapPricer";
import { CDSPricer } from "@/components/CDSPricer";
import { Charting } from "@/components/Charting";
import { QuantDocs } from "@/components/QuantDocs";
import { ALMDesk } from "@/components/ALMDesk";
import { XVADesk } from "@/components/XVADesk";
import { RiskCommittee } from "@/components/RiskCommittee";
import { OrderBookView } from "@/components/OrderBookView";
import { ClimateRisk } from "@/components/ClimateRisk";
import { RegulatoryReports } from "@/components/RegulatoryReports";
import { QuantumOptimizer } from "@/components/QuantumOptimizer";
import { fetchRiskOverview, fetchCrossMarketData, fetchQuantAnalytics } from "@/lib/api";

export default function Home() {
  const [currentTab, setCurrentTab] = useState("overview");
  const [overviewData, setOverviewData] = useState<any>(null);
  const [crossMarketData, setCrossMarketData] = useState<any>(null);
  const [quantData, setQuantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    const [ov, cm, qa] = await Promise.all([
      fetchRiskOverview(),
      fetchCrossMarketData(),
      fetchQuantAnalytics()
    ]);
    setOverviewData(ov);
    setCrossMarketData(cm);
    setQuantData(qa);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="flex h-screen bg-bg-main font-sans overflow-hidden select-none">
      <Navigation currentTab={currentTab} setTab={setCurrentTab} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <BloombergBar onNavigate={setCurrentTab} />

        <Header 
          title={
            currentTab === "overview" ? "PORT — Portfolio Risk & Capital Overview" :
            currentTab === "strat" ? "STRAT — Algorithmic Multi-Strategy Trading Desk" :
            currentTab === "quantdocs" ? "QDOC — Quant Methodology & Layman's Terms Guide (25 Algorithms)" :
            currentTab === "alm" ? "ALM — Treasury Liquidity Runway (LCR/NSFR) & IRRBB" :
            currentTab === "xva" ? "XVA — Counterparty Credit Risk & Valuation Adjustments (CVA/DVA/FVA)" :
            currentTab === "committee" ? "COMM — Autonomous 4-Agent Risk Committee Deliberation" :
            currentTab === "orderbook" ? "DOM — Level-2 Limit Order Book Depth & OFI Alpha" :
            currentTab === "climate" ? "CLIM — NGFS Regulatory Climate & ESG Stress Engine" :
            currentTab === "regulatory" ? "REGP — CCAR / DFAST Federal Reserve Supervisory Filing Pack" :
            currentTab === "quantum" ? "QOPT — Quantum-Inspired Portfolio Optimizer (QUBO/QAOA)" :
            currentTab === "tradesim" ? "TSIM — Pre-Trade Execution & Almgren-Chriss Impact Simulator" :
            currentTab === "charting" ? "CHRT — Advanced Institutional Candlestick & Volume Charting" :
            currentTab === "markets" ? "Cross-Market Analytics (IN / US)" :
            currentTab === "quant" ? "BTST — Quantitative Risk Lab & VaR Backtesting" :
            currentTab === "yieldcurve" ? "YCRV — Fixed Income Yield Curve Analytics & Inversion" :
            currentTab === "swap" ? "SWAP — Interest Rate Swap (IRS) Derivatives Pricer" :
            currentTab === "cds" ? "CDSW — Credit Default Swap (CDS) Risk Pricer" :
            currentTab === "options" ? "OVAL — Black-Scholes Options Calculator & 4D Greeks Matrix" :
            currentTab === "vol" ? "OVME — Options Volatility Surface & Smile Modeling" :
            currentTab === "basel" ? "CAP — Basel III Capital Adequacy & FRTB RWA Engine" :
            currentTab === "contagion" ? "NET — Systemic Risk ΔCoVaR & Financial Contagion Network" :
            currentTab === "stress" ? "Macro Stress Lab & Digital Twin" :
            currentTab === "xai" ? "XAI — Explainable AI SHAP Model Inspector" :
            currentTab === "news" ? "NEWS — Institutional NewsAPI Macro Wire" :
            currentTab === "limits" ? "MON — Limits & Breach Monitor" :
            currentTab === "methodology" ? "METH — Architecture & Multi-Agent Methodology" :
            "Executive Risk Reports"
          } 
          subtitle="RISKOS Quant Terminal — JPMorgan Chase CTC Risk Innovation Spec"
          onRefresh={loadAllData}
        />

        <main className="flex-1 overflow-y-auto bg-bg-main">
          {loading ? (
            <div className="p-12 text-center font-mono text-xs text-text-muted">
              Loading RISKOS Quant Workstation...
            </div>
          ) : (
            <>
              {currentTab === "overview" && <RiskOverview data={overviewData} />}
              {currentTab === "strat" && <StratDesk />}
              {currentTab === "quantdocs" && <QuantDocs />}
              {currentTab === "alm" && <ALMDesk />}
              {currentTab === "xva" && <XVADesk />}
              {currentTab === "committee" && <RiskCommittee />}
              {currentTab === "orderbook" && <OrderBookView />}
              {currentTab === "climate" && <ClimateRisk />}
              {currentTab === "regulatory" && <RegulatoryReports />}
              {currentTab === "quantum" && <QuantumOptimizer />}
              {currentTab === "tradesim" && <TradeSim />}
              {currentTab === "charting" && <Charting />}
              {currentTab === "markets" && <CrossMarketView data={crossMarketData} />}
              {currentTab === "quant" && <QuantLab data={quantData} />}
              {currentTab === "yieldcurve" && <YieldCurve />}
              {currentTab === "swap" && <SwapPricer />}
              {currentTab === "cds" && <CDSPricer />}
              {currentTab === "options" && <OptionsCalc />}
              {currentTab === "vol" && <VolSurface />}
              {currentTab === "basel" && <BaselCapital />}
              {currentTab === "contagion" && <ContagionGraph />}
              {currentTab === "stress" && <StressLab />}
              {currentTab === "xai" && <ModelExplain />}
              {currentTab === "news" && <NewsView />}
              {currentTab === "limits" && <LimitsMonitor />}
              {currentTab === "reports" && <ReportsView />}
              {currentTab === "methodology" && <Methodology />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
