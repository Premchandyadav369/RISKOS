"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Layers, Activity } from "lucide-react";

export function BaselCapital() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/capital/basel")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {
        setData({
          framework: "Basel III / FRTB (Fundamental Review of Trading Book)",
          cet1_capital_usd: 145000000.0,
          total_rwa_usd: 1000000000.0,
          rwa_breakdown: { credit_risk_rwa: 520000000.0, market_risk_rwa: 340000000.0, operational_risk_rwa: 140000000.0 },
          capital_ratios: { cet1_ratio_pct: 14.5, tier1_ratio_pct: 16.8, total_capital_ratio_pct: 19.5, regulatory_target_cet1_pct: 8.0, headroom_pct: 6.5 },
          status: "WELL_CAPITALIZED"
        });
      });
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                BASEL III & FRTB REGULATORY CAPITAL ADEQUACY (CAP)
              </h3>
              <p className="text-xs text-text-muted">
                Common Equity Tier 1 (CET1) Capital Ratios and Risk-Weighted Assets (RWA) under FRTB guidelines.
              </p>
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-forest-light text-forest text-xs font-mono font-bold">
            WELL CAPITALIZED
          </span>
        </div>

        {data && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">CET1 CAPITAL RATIO</span>
                <div className="font-bold text-xl text-forest mt-1">
                  {data.capital_ratios?.cet1_ratio_pct}%
                </div>
                <span className="text-[10px] text-text-light">Target: {data.capital_ratios?.regulatory_target_cet1_pct}%</span>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">TOTAL RWA</span>
                <div className="font-bold text-xl text-text-main mt-1">
                  ${(data.total_rwa_usd / 1000000).toFixed(0)}M
                </div>
                <span className="text-[10px] text-text-light">Risk-Weighted Assets</span>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">CAPITAL HEADROOM</span>
                <div className="font-bold text-xl text-status-normal mt-1">
                  +{data.capital_ratios?.headroom_pct}%
                </div>
                <span className="text-[10px] text-text-light">Above minimum buffer</span>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">TOTAL CAPITAL RATIO</span>
                <div className="font-bold text-xl text-text-main mt-1">
                  {data.capital_ratios?.total_capital_ratio_pct}%
                </div>
                <span className="text-[10px] text-text-light">Tier 1 + Tier 2</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
