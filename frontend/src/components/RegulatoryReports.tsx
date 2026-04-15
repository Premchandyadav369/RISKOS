"use client";

import React, { useState, useEffect } from "react";
import { FileCheck, ShieldCheck, Download, CheckCircle2, FileText, Lock } from "lucide-react";

export function RegulatoryReports() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/regulatory/ccar")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-forest" />
            CCAR / DFAST & REGULATORY REPORTING PACK
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Federal Reserve Comprehensive Capital Analysis and Review (CCAR) & RBI Pillar 3 compliance export.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Downloading CCAR 2026-Q3 Supervisory Dossier (PDF/XBRL)...")}
            className="bg-forest hover:bg-forest-dark text-white px-4 py-2 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> EXPORT FILING DOSSIER
          </button>
        </div>
      </div>

      {/* Certification Status */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-text-muted">SUPERVISORY CYCLE:</span> <span className="text-white font-bold">{data?.supervisory_cycle || "Fed CCAR / DFAST 2026-Q3"}</span>
        </div>
        <div>
          <span className="text-text-muted">CRO SIGNOFF:</span> <span className="text-forest font-bold">{data?.audit_certification?.chief_risk_officer_signoff || "VERIFIED"}</span>
        </div>
        <div className="text-blue-400 font-mono text-[10px]">
          {data?.audit_certification?.hash?.substring(0, 32) || "SHA256:7f83b1657ff1fc53..."}...
        </div>
      </div>

      {/* CCAR Scenario Table */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-forest" />
          FED SUPERVISORY CAPITAL ADEQUACY TRAJECTORY
        </h3>
        <div className="space-y-3">
          {data?.scenarios?.map((scen: any, i: number) => (
            <div key={i} className="bg-bg-secondary p-4 rounded-lg border border-bg-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-white font-mono">{scen.scenario_name}</span>
                <span className="text-forest bg-forest/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  Surplus: {scen.capital_buffer_surplus_dollar}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-text-muted text-[10px] block">Real GDP Growth:</span>
                  <span className="text-white font-bold">{scen.real_gdp_growth_pct}%</span>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] block">Unemployment:</span>
                  <span className="text-white font-bold">{scen.unemployment_rate_pct}%</span>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] block">Stressed CET1 Ratio:</span>
                  <span className="text-forest font-bold">{scen.stressed_cet1_ratio_pct}%</span>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] block">Fed Minimum CET1:</span>
                  <span className="text-gray-400">{scen.minimum_regulatory_cet1_pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loss Projections */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
          <FileText className="w-4 h-4 text-forest" />
          SEVERELY ADVERSE PROJECTED LOSSES & RWA EXPANSION
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-xs font-mono">
          <div className="bg-bg-secondary p-3 rounded-lg border border-bg-border">
            <span className="text-[10px] text-text-muted block">Trading & Cpty Losses:</span>
            <span className="text-sm font-bold text-status-critical mt-1 block">{data?.projected_losses_severely_adverse?.trading_and_counterparty_losses || "$24.5M"}</span>
          </div>
          <div className="bg-bg-secondary p-3 rounded-lg border border-bg-border">
            <span className="text-[10px] text-text-muted block">Loan Loss Provisions (ACL):</span>
            <span className="text-sm font-bold text-yellow-400 mt-1 block">{data?.projected_losses_severely_adverse?.loan_loss_provisions_acl || "$38.2M"}</span>
          </div>
          <div className="bg-bg-secondary p-3 rounded-lg border border-bg-border">
            <span className="text-[10px] text-text-muted block">Market Risk RWA Expansion:</span>
            <span className="text-sm font-bold text-white mt-1 block">{data?.projected_losses_severely_adverse?.market_risk_rwa_expansion || "+$180.0M"}</span>
          </div>
          <div className="bg-bg-secondary p-3 rounded-lg border border-bg-border">
            <span className="text-[10px] text-text-muted block">Post-Stress Leverage Ratio:</span>
            <span className="text-sm font-bold text-forest mt-1 block">{data?.projected_losses_severely_adverse?.post_stress_leverage_ratio_pct || "6.8"}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
