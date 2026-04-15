"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Cpu, ArrowRightLeft, DollarSign, Layers } from "lucide-react";

export function XVADesk() {
  const [data, setData] = useState<any>(null);
  const [notional, setNotional] = useState<number>(50);
  const [cptySpread, setCptySpread] = useState<number>(140);

  const fetchXVA = () => {
    fetch(`http://127.0.0.1:8000/api/derivatives/xva?notional=${notional * 1e6}&cpty_spread=${cptySpread}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchXVA();
  }, [notional, cptySpread]);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-forest" />
            COUNTERPARTY DERIVATIVES & XVA PRICING DESK
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Credit Valuation Adjustment (CVA), Debit Valuation Adjustment (DVA), Funding Valuation Adjustment (FVA) & Basel SA-CCR.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-surface border border-bg-border p-4 rounded-xl">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-text-muted">OTC DERIVATIVE NOTIONAL:</span>
            <span className="text-white font-bold">${notional} Million</span>
          </div>
          <input
            type="range"
            min="10"
            max="250"
            step="10"
            value={notional}
            onChange={(e) => setNotional(Number(e.target.value))}
            className="w-full accent-forest cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-text-muted">COUNTERPARTY CDS SPREAD:</span>
            <span className="text-white font-bold">{cptySpread} bps</span>
          </div>
          <input
            type="range"
            min="30"
            max="500"
            step="10"
            value={cptySpread}
            onChange={(e) => setCptySpread(Number(e.target.value))}
            className="w-full accent-forest cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">CREDIT VALUATION ADJ (CVA)</span>
          <div className="text-2xl font-bold font-mono text-status-critical">
            -${data?.xva_summary?.cva_amount?.toLocaleString() || "154,200"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Counterparty default charge</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">DEBIT VALUATION ADJ (DVA)</span>
          <div className="text-2xl font-bold font-mono text-forest">
            +${data?.xva_summary?.dva_amount?.toLocaleString() || "48,600"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Own credit risk benefit</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">FUNDING VALUATION (FVA)</span>
          <div className="text-2xl font-bold font-mono text-yellow-400">
            -${data?.xva_summary?.fva_amount?.toLocaleString() || "12,800"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Uncollateralized funding cost</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">SA-CCR EXPOSURE AT DEFAULT</span>
          <div className="text-2xl font-bold font-mono text-white">
            ${(data?.sa_ccr_metrics?.ead_sacr_amount / 1e6)?.toFixed(2) || "4.12"}M
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Regulatory EAD (α = 1.4)</span>
        </div>
      </div>

      {/* Profile Tables */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-forest" />
          POTENTIAL FUTURE EXPOSURE (PFE 99%) & EXPECTED EXPOSURE PROFILE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {data?.profiles?.pfe_profile?.slice(0, 5).map((p: any, i: number) => (
            <div key={i} className="bg-bg-secondary p-3 rounded-lg border border-bg-border text-center">
              <span className="text-[10px] text-text-muted font-mono block">Tenor: {p.tenor_years}Y</span>
              <span className="text-sm font-bold text-white font-mono block mt-1">${(p.pfe_99 / 1e3).toFixed(0)}K</span>
              <span className="text-[9px] text-forest font-mono block">99% PFE Peak</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
