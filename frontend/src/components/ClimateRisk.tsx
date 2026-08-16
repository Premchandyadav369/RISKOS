"use client";

import React, { useState, useEffect } from "react";
import { Globe, AlertTriangle, Flame, ShieldAlert, CheckCircle2, Factory } from "lucide-react";

export function ClimateRisk() {
  const [scenario, setScenario] = useState<string>("Disorderly");
  const [data, setData] = useState<any>(null);

  const fetchClimate = () => {
    fetch(`http://127.0.0.1:8000/api/climate/ngfs?scenario=${scenario}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchClimate();
  }, [scenario]);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-forest" />
            NGFS CLIMATE & ESG SCENARIO STRESS ENGINE
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Network for Greening the Financial System (NGFS) transition risk, carbon pricing, and physical damage models.
          </p>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "Orderly", title: "1. Orderly Net Zero 2050", temp: "+1.5°C", desc: "Smooth, early carbon taxation with manageable transition friction." },
          { id: "Disorderly", title: "2. Disorderly Delayed Transition", temp: "+1.8°C", desc: "Abrupt late policy shocks causing high asset stranding and rapid repricing." },
          { id: "HotHouse", title: "3. Hot House World", temp: "+3.4°C", desc: "Current policies leading to runaway heating and acute physical catastrophe." }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              scenario === s.id
                ? "bg-forest-light/20 border-forest text-white"
                : "bg-bg-surface border-bg-border text-text-muted hover:text-white"
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs font-mono">{s.title}</span>
              <span className="text-[10px] font-mono text-yellow-400 font-bold">{s.temp}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">TOTAL CLIMATE IMPAIRMENT</span>
          <div className="text-2xl font-bold font-mono text-status-critical">
            -${(data?.portfolio_impact?.total_climate_impairment_dollar / 1e6)?.toFixed(2) || "2.10"}M
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">
            Portfolio Loss: {data?.portfolio_impact?.portfolio_loss_pct || "8.4"}%
          </span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">SHADOW CARBON PRICE</span>
          <div className="text-2xl font-bold font-mono text-white">
            ${data?.scenario?.carbon_price_per_ton || "280"} / tCO2e
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Regulatory tax trajectory</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">STRESSED PD MULTIPLIER</span>
          <div className="text-2xl font-bold font-mono text-yellow-400">
            {data?.scenario?.pd_multiplier || "1.55"}x
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Corporate default escalation</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">WEIGHTED CARBON INTENSITY</span>
          <div className="text-2xl font-bold font-mono text-forest">
            {data?.portfolio_impact?.weighted_average_carbon_intensity_waci || "164.5"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">tCO2e / $M Revenue</span>
        </div>
      </div>

      {/* Sector Vulnerabilities */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
          <Factory className="w-4 h-4 text-forest" />
          HIGH-EMITTING SECTOR TRANSITION IMPAIRMENTS
        </h3>
        <div className="space-y-2">
          {data?.sector_breakdown?.map((sec: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-bg-secondary border border-bg-border text-xs font-mono">
              <span className="text-white font-bold">{sec.sector}</span>
              <span className="text-gray-400">Carbon Intensity: {sec.carbon_intensity_tco2e_m} tCO2e/$M</span>
              <span className="text-status-critical font-bold">{sec.impairment_pct.toFixed(1)}% Impairment</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
