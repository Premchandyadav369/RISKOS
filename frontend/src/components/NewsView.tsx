"use client";

import React, { useState, useEffect } from "react";
import { Globe2, Bell, ShieldAlert, ArrowUpRight } from "lucide-react";

export function NewsView() {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/trading/news")
      .then((res) => res.json())
      .then((d) => setNews(d.news || []))
      .catch(() => {
        setNews([
          { id: "N-01", time: "21:10 IST", headline: "US Treasury Yield Curve Steepens Following Federal Reserve Policy Signals", impact: "HIGH", affected: "US Rates / JPM" },
          { id: "N-02", time: "20:45 IST", headline: "RBI Keeps Repo Rate Unchanged at 6.50%; Highlights Liquidity Management", impact: "MEDIUM", affected: "HDFCBANK / Bank NIFTY" },
          { id: "N-03", time: "19:30 IST", headline: "Semiconductor Tech Demand Drives Cross-Border IT Outsource Contracts", impact: "HIGH", affected: "NVDA / TCS / INFY" },
          { id: "N-04", time: "18:15 IST", headline: "USD/INR FX Volatility Compresses Near ₹83.80 Resistance Level", impact: "LOW", affected: "USDINR" }
        ]);
      });
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                INSTITUTIONAL MACRO & RISK NEWS STREAM (NEWS)
              </h3>
              <p className="text-xs text-text-muted">
                Real-time institutional wire tagged by portfolio constituent impact and volatility weighting.
              </p>
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-forest-light text-forest text-xs font-mono font-bold">
            4 LIVE HEADLINES
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {news.map((item) => (
            <div key={item.id} className="p-3 bg-bg-secondary rounded border border-bg-border flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[10px]">{item.time}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.impact === "HIGH" ? "bg-status-critical/10 text-status-critical border border-status-critical/30" :
                    item.impact === "MEDIUM" ? "bg-status-warning/10 text-status-warning border border-status-warning/30" :
                    "bg-forest-light text-forest border border-forest/20"
                  }`}>
                    {item.impact} IMPACT
                  </span>
                </div>
                <h4 className="font-bold text-text-main font-sans text-sm">{item.headline}</h4>
                <p className="text-text-muted text-[11px]">Affected Assets: <strong className="text-text-main">{item.affected}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
