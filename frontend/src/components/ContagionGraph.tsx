"use client";

import React, { useState, useEffect } from "react";
import { Activity, Globe2 } from "lucide-react";

export function ContagionGraph() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/systemic/contagion")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {
        setData({
          systemic_covar_avg_bps: 223.0,
          market_absorption_ratio_pct: 78.4,
          network_nodes: [
            { id: "JPM", name: "JPMorgan Chase & Co", sector: "US Money Center Bank", covar_bps: 245.0, systemic_importance: "CRITICAL" },
            { id: "GS", name: "Goldman Sachs Group", sector: "US Investment Bank", covar_bps: 215.0, systemic_importance: "HIGH" },
            { id: "NVDA", name: "NVIDIA Corporation", sector: "US Semiconductor Tech", covar_bps: 310.0, systemic_importance: "CRITICAL" },
            { id: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Indian Financial Institution", covar_bps: 185.0, systemic_importance: "HIGH" }
          ]
        });
      });
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                SYSTEMIC RISK DELTA-CoVaR & CONTAGION NETWORK (NET)
              </h3>
              <p className="text-xs text-text-muted">
                Systemic CoVaR and Absorption Ratio measuring cross-market banking & tech spillover vulnerability.
              </p>
            </div>
          </div>
        </div>

        {data && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">AVG SYSTEMIC ΔCoVaR</span>
                <div className="font-bold text-xl text-status-critical mt-1">
                  +{data.systemic_covar_avg_bps} bps
                </div>
                <span className="text-[10px] text-text-light">Distress spillover coefficient</span>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">MARKET ABSORPTION RATIO</span>
                <div className="font-bold text-xl text-status-warning mt-1">
                  {data.market_absorption_ratio_pct}%
                </div>
                <span className="text-[10px] text-text-light">Concentrated fragility risk</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
