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
            currentTab === "overview" ? "PORT — Risk Overview" :
            currentTab === "strat" ? "STRAT — Algorithmic Multi-Strategy Trading Desk" :
            currentTab === "tradesim" ? "TSIM — Pre-Trade Execution & Market Impact Check" :
            currentTab === "markets" ? "Cross-Market Analytics (IN / US)" :
            currentTab === "quant" ? "BTST — Quantitative Risk Lab" :
            currentTab === "vol" ? "OVME — Options Volatility Surface" :
            currentTab === "basel" ? "CAP — Basel III Capital Adequacy & FRTB RWA" :
            currentTab === "contagion" ? "NET — Systemic Risk ΔCoVaR & Financial Contagion" :
            currentTab === "stress" ? "Macro Stress Lab & Digital Twin" :
            currentTab === "investigations" ? "K2-V2 AI Risk Investigations" :
            currentTab === "news" ? "NEWS — Institutional Wire" :
            currentTab === "limits" ? "MON — Limits & Breach Monitor" : "Executive Risk Reports"
          } 
          subtitle="RISKOS Quant Terminal — JPMorgan Chase CTC Risk Innovation Spec"
          onRefresh={loadAllData}
        />

        <main className="flex-1 overflow-y-auto bg-bg-main">
          {loading ? (
            <div className="p-12 text-center font-mono text-xs text-text-muted">
              Loading RISKOS Quant Terminal Workstation...
            </div>
          ) : (
            <>
              {currentTab === "overview" && <RiskOverview data={overviewData} />}
              {currentTab === "strat" && <StratDesk />}
              {currentTab === "tradesim" && <TradeSim />}
              {currentTab === "markets" && <CrossMarketView data={crossMarketData} />}
              {currentTab === "quant" && <QuantLab data={quantData} />}
              {currentTab === "vol" && <VolSurface />}
              {currentTab === "basel" && <BaselCapital />}
              {currentTab === "contagion" && <ContagionGraph />}
              {currentTab === "stress" && <StressLab />}
              {currentTab === "investigations" && <RiskOverview data={overviewData} />}
              {currentTab === "news" && <NewsView />}
              {currentTab === "limits" && <LimitsMonitor />}
              {currentTab === "reports" && <ReportsView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
