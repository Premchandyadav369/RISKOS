"use client";

import React, { useState, useEffect } from "react";
import { Layers, Activity } from "lucide-react";

export function VolSurface() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/trading/volsurface")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {
        setData({
          ticker: "AAPL / NVDA OPTIONS SURFACE",
          underlying_price: 220.0,
          volatility_surface: [
            { strike: "$200", exp_30d: 28.5, exp_60d: 26.2, exp_90d: 25.1, exp_180d: 24.8 },
            { strike: "$210", exp_30d: 25.8, exp_60d: 24.8, exp_90d: 24.2, exp_180d: 24.0 },
            { strike: "$220", exp_30d: 24.0, exp_60d: 23.5, exp_90d: 23.1, exp_180d: 23.0 },
            { strike: "$230", exp_30d: 25.4, exp_60d: 24.5, exp_90d: 24.0, exp_180d: 23.8 },
            { strike: "$240", exp_30d: 27.9, exp_60d: 26.0, exp_90d: 25.0, exp_180d: 24.5 }
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                OPTIONS IMPLIED VOLATILITY SURFACE & SKEW SMILE (OVME)
              </h3>
              <p className="text-xs text-text-muted">
                3D Volatility surface modeling strike moneyness vs expiry maturity curves.
              </p>
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-forest-light text-forest text-xs font-mono font-bold">
            SPOT: $220.00
          </span>
        </div>

        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-bg-border text-text-muted uppercase text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">Strike Price</th>
                  <th className="py-2.5 px-3 font-semibold">30-Day IV (%)</th>
                  <th className="py-2.5 px-3 font-semibold">60-Day IV (%)</th>
                  <th className="py-2.5 px-3 font-semibold">90-Day IV (%)</th>
                  <th className="py-2.5 px-3 font-semibold">180-Day IV (%)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Skew Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/60">
                {data.volatility_surface?.map((row: any) => (
                  <tr key={row.strike} className="hover:bg-bg-secondary transition-colors">
                    <td className="py-2.5 px-3 font-bold text-text-main">{row.strike}</td>
                    <td className="py-2.5 px-3 font-semibold text-forest">{row.exp_30d}%</td>
                    <td className="py-2.5 px-3 text-text-main">{row.exp_60d}%</td>
                    <td className="py-2.5 px-3 text-text-main">{row.exp_90d}%</td>
                    <td className="py-2.5 px-3 text-text-muted">{row.exp_180d}%</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-status-warning">
                      {row.strike === "$220" ? "ATM VOL" : "VOLATILITY SKEW"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
