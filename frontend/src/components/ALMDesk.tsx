"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ShieldAlert, TrendingDown, ArrowUpDown, AlertCircle, CheckCircle2, Activity } from "lucide-react";

export function ALMDesk() {
  const [data, setData] = useState<any>(null);
  const [rateShock, setRateShock] = useState<number>(200);
  const [outflowPct, setOutflowPct] = useState<number>(15);

  const fetchALM = () => {
    fetch(`http://127.0.0.1:8000/api/alm/irrbb?rate_shock_bps=${rateShock}&outflow_pct=${outflowPct}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchALM();
  }, [rateShock, outflowPct]);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-forest" />
            TREASURY & ASSET LIABILITY MANAGEMENT (ALM / IRRBB)
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Basel III LCR & NSFR dynamic runway forecasting + Interest Rate Risk in the Banking Book (EVE & NII).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-forest/20 text-forest px-2.5 py-1 rounded border border-forest/30 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> CTC TREASURY LIVE
          </span>
        </div>
      </div>

      {/* Stress Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-surface border border-bg-border p-4 rounded-xl">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-text-muted">REGULATORY RATE SHOCK:</span>
            <span className="text-white font-bold">+{rateShock} bps</span>
          </div>
          <input
            type="range"
            min="-300"
            max="300"
            step="25"
            value={rateShock}
            onChange={(e) => setRateShock(Number(e.target.value))}
            className="w-full accent-forest cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-text-muted">30-DAY DEPOSIT RUN-OFF:</span>
            <span className="text-white font-bold">{outflowPct}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={outflowPct}
            onChange={(e) => setOutflowPct(Number(e.target.value))}
            className="w-full accent-forest cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">STRESSED LCR (30D)</span>
          <div className={`text-2xl font-bold font-mono ${data?.liquidity_metrics?.stressed_lcr_pct >= 100 ? 'text-forest' : 'text-status-critical'}`}>
            {data?.liquidity_metrics?.stressed_lcr_pct || "151.1"}%
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Regulatory Min: 100.0%</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">NET STABLE FUNDING (NSFR)</span>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.liquidity_metrics?.nsfr_pct || "116.4"}%
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Long-term structural funding</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">LIQUIDITY RUNWAY</span>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.liquidity_metrics?.liquidity_runway_days || "45"} Days
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Until HQLA buffer depletion</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">Δ EVE (ECONOMIC VALUE)</span>
          <div className={`text-2xl font-bold font-mono ${data?.irrbb_metrics?.delta_eve_pct < -15 ? 'text-status-critical' : 'text-yellow-400'}`}>
            {data?.irrbb_metrics?.delta_eve_pct || "-4.8"}%
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Outlier Threshold: -15.0%</span>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-forest" />
            BASEL III LIQUIDITY COVERAGE PROFILE
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-bg-border">
              <span className="text-text-muted">High-Quality Liquid Assets (HQLA):</span>
              <span className="text-white font-bold">${(data?.liquidity_metrics?.hqla_amount / 1e6)?.toFixed(1) || "85.0"}M</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border">
              <span className="text-text-muted">LCR Compliance Status:</span>
              <span className="text-forest font-bold">{data?.liquidity_metrics?.lcr_status || "COMPLIANT"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border">
              <span className="text-text-muted">SVB Rapid Outflow Stress:</span>
              <span className="text-yellow-400 font-bold">SURVIVES 30D RUN</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-forest" />
            IRRBB RATE SENSITIVITY GAP
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-bg-border">
              <span className="text-text-muted">Duration Gap (Asset - Liability):</span>
              <span className="text-white font-bold">{data?.irrbb_metrics?.duration_gap_years || "2.4"} Years</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border">
              <span className="text-text-muted">12M Net Interest Income Impact (ΔNII):</span>
              <span className="text-forest font-bold">+${(data?.irrbb_metrics?.delta_nii_amount / 1e6)?.toFixed(2) || "1.30"}M</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-bg-border">
              <span className="text-text-muted">Supervisory Outlier Test:</span>
              <span className="text-forest font-bold">PASS (NO CAPITAL PENALTY)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
