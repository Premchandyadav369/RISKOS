"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, AlertOctagon, CheckCircle2 } from "lucide-react";

export function LimitsMonitor() {
  const limits = [
    { metric: "Market 99% VaR Limit", current: "$38.7K", limit: "$45.0K", util: 86.0, status: "WARNING" },
    { metric: "Liquidity Buffer Utilization", current: "$185.0M", limit: "$200.0M", util: 74.0, status: "NORMAL" },
    { metric: "Counterparty Exposure (Max Single)", current: "$40.0M", limit: "$50.0M", util: 80.0, status: "WARNING" },
    { metric: "USD/INR FX Exposure Limit", current: "$14.2M", limit: "$20.0M", util: 71.0, status: "NORMAL" },
    { metric: "Interest Rate Shock Limit (+200bps)", current: "-$18.2M", limit: "-$25.0M", util: 72.8, status: "NORMAL" },
  ];

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              INSTITUTIONAL RISK LIMIT & BREACH MONITOR
            </h3>
            <p className="text-xs text-text-muted">
              Real-time threshold tracking for Treasury & Corporate Risk limits across Market, Credit, Liquidity, and FX.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-forest-light text-forest text-xs font-mono font-bold border border-forest/20">
            5 ACTIVE LIMITS
          </span>
        </div>

        <div className="space-y-4">
          {limits.map((l, idx) => (
            <div key={idx} className="p-4 bg-bg-secondary rounded border border-bg-border font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-main">{l.metric}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  l.status === "WARNING" ? "bg-status-warning/10 text-status-warning border border-status-warning/30" :
                  "bg-status-normal/10 text-status-normal border border-status-normal/30"
                }`}>
                  {l.status}: {l.util}% UTILIZATION
                </span>
              </div>

              <div className="flex items-center justify-between text-text-muted text-[11px]">
                <span>Current: <strong className="text-text-main">{l.current}</strong></span>
                <span>Approved Limit: <strong className="text-text-main">{l.limit}</strong></span>
              </div>

              {/* Utilization Bar */}
              <div className="w-full bg-bg-surface h-2 rounded overflow-hidden border border-bg-border">
                <div 
                  className={`h-full ${l.util > 85 ? "bg-status-warning" : "bg-forest"}`} 
                  style={{ width: `${l.util}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
