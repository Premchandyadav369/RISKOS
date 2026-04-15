"use client";

import React, { useState } from "react";
import { FileText, Download, CheckCircle2, ShieldCheck } from "lucide-react";

export function ReportsView() {
  const [report, setReport] = useState<any>(null);

  React.useEffect(() => {
    fetch("http://127.0.0.1:8000/api/reports/daily")
      .then((res) => res.json())
      .then((data) => setReport(data))
      .catch(() => {
        setReport({
          report_title: "Daily Institutional Risk & Stress Briefing",
          date: "12 August 2026",
          jurisdiction: "US (NYSE/NASDAQ) & India (NSE/BSE)",
          executive_summary: "Overall portfolio risk increased 8.4% over the last 24 hours to 67/100, driven by elevated technology sector volatility and currency movements in USD/INR. Liquidity coverage ratio (LCR) remains robust at 142%.",
          key_drivers: [
            "US Tech sector volatility spike (NVDA 1D vol +8.7%)",
            "USD/INR exchange rate movement (+5.2% annualized vol)",
            "Cross-asset correlation tightening between NIFTY IT and NASDAQ (0.74)"
          ],
          limit_breaches: "Zero hard breaches. Two warning thresholds active (Market VaR 86% limit, Counterparty Apex 80%).",
          recommended_actions: [
            "Rebalance NVDA exposure from 12% to 8%",
            "Increase 30-day liquidity buffer by $15.0M",
            "Recalculate 10-day 99% Stress VaR prior to tomorrow's trading session"
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                EXECUTIVE RISK REPORTING & MIDDLE OFFICE BRIEFINGS
              </h3>
              <p className="text-xs text-text-muted">
                Auto-generated daily institutional disclosures and risk committee briefings.
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-forest hover:bg-forest-dark text-white font-mono text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT DISCLOSURE</span>
          </button>
        </div>

        {report && (
          <div className="p-6 bg-bg-secondary border border-bg-border rounded space-y-5 font-mono text-xs text-text-main">
            <div className="border-b border-bg-border pb-3 flex justify-between items-baseline">
              <div>
                <h2 className="text-base font-bold uppercase">{report.report_title}</h2>
                <span className="text-[11px] text-text-muted">{report.jurisdiction}</span>
              </div>
              <span className="font-bold text-forest">{report.date}</span>
            </div>

            <div>
              <h4 className="font-bold text-text-muted uppercase text-[10px] mb-1">EXECUTIVE SUMMARY</h4>
              <p className="font-sans leading-relaxed text-xs">{report.executive_summary}</p>
            </div>

            <div>
              <h4 className="font-bold text-text-muted uppercase text-[10px] mb-1">PRIMARY RISK DRIVERS</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                {report.key_drivers?.map((d: string, idx: number) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-text-muted uppercase text-[10px] mb-1">LIMIT STATUS</h4>
              <p className="text-xs">{report.limit_breaches}</p>
            </div>

            <div>
              <h4 className="font-bold text-text-muted uppercase text-[10px] mb-1">RECOMMENDED ACTIONS FOR RISK COMMITTEE</h4>
              <div className="space-y-1">
                {report.recommended_actions?.map((act: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
