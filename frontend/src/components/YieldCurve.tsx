"use client";

import React, { useState, useEffect } from "react";
import { TrendingDown, AlertTriangle, LineChart } from "lucide-react";

export function YieldCurve() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/markets/yield-curve")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {
        setData({
          us_treasury: [
            { maturity: "1M", yield_pct: 5.35 }, { maturity: "3M", yield_pct: 5.42 }, { maturity: "6M", yield_pct: 5.48 },
            { maturity: "1Y", yield_pct: 5.25 }, { maturity: "2Y", yield_pct: 4.85 }, { maturity: "5Y", yield_pct: 4.25 },
            { maturity: "10Y", yield_pct: 4.10 }, { maturity: "30Y", yield_pct: 4.28 }
          ],
          india_gsec: [
            { maturity: "1M", yield_pct: 6.85 }, { maturity: "3M", yield_pct: 6.92 }, { maturity: "6M", yield_pct: 7.05 },
            { maturity: "1Y", yield_pct: 7.15 }, { maturity: "2Y", yield_pct: 7.08 }, { maturity: "5Y", yield_pct: 7.12 },
            { maturity: "10Y", yield_pct: 7.18 }, { maturity: "30Y", yield_pct: 7.35 }
          ],
          us_spread_bps: -75.0,
          india_spread_bps: 10.0,
          us_curve_status: "INVERTED",
          india_curve_status: "NORMAL",
          recession_probability_pct: 68.4
        });
      });
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                FIXED INCOME YIELD CURVE ANALYTICS (YCRV)
              </h3>
              <p className="text-xs text-text-muted">
                US Treasury vs Indian G-Sec curve shapes and macroeconomic recession probability models.
              </p>
            </div>
          </div>
        </div>

        {data && (
          <div className="space-y-6 font-mono text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">US 10Y-2Y SPREAD</span>
                <div className={`font-bold text-xl mt-1 ${data.us_spread_bps < 0 ? "text-status-critical" : "text-status-normal"}`}>
                  {data.us_spread_bps > 0 ? "+" : ""}{data.us_spread_bps} bps
                </div>
                <span className="text-[10px] text-text-light">{data.us_curve_status} CURVE</span>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">INDIA 10Y-2Y SPREAD</span>
                <div className={`font-bold text-xl mt-1 ${data.india_spread_bps < 0 ? "text-status-critical" : "text-status-normal"}`}>
                  {data.india_spread_bps > 0 ? "+" : ""}{data.india_spread_bps} bps
                </div>
                <span className="text-[10px] text-text-light">{data.india_curve_status} CURVE</span>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border col-span-2">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-status-warning" /> RECESSION PROBABILITY
                </span>
                <div className="font-bold text-xl text-status-warning mt-1">
                  {data.recession_probability_pct}%
                </div>
                <span className="text-[10px] text-text-light">NY Fed Yield Curve Model</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-text-muted text-[10px] mb-2 uppercase">US TREASURY CURVE</h4>
                <table className="w-full text-left text-xs border border-bg-border rounded overflow-hidden">
                  <thead className="bg-bg-secondary">
                    <tr className="border-b border-bg-border text-text-muted uppercase text-[10px]">
                      <th className="py-2 px-3">Maturity</th>
                      <th className="py-2 px-3 text-right">Yield (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border/60">
                    {data.us_treasury.map((row: any) => (
                      <tr key={row.maturity} className="hover:bg-bg-secondary transition-colors">
                        <td className="py-2 px-3 font-semibold text-text-main">{row.maturity}</td>
                        <td className="py-2 px-3 text-right font-bold text-forest">{row.yield_pct.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-bold text-text-muted text-[10px] mb-2 uppercase">INDIAN G-SEC CURVE</h4>
                <table className="w-full text-left text-xs border border-bg-border rounded overflow-hidden">
                  <thead className="bg-bg-secondary">
                    <tr className="border-b border-bg-border text-text-muted uppercase text-[10px]">
                      <th className="py-2 px-3">Maturity</th>
                      <th className="py-2 px-3 text-right">Yield (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border/60">
                    {data.india_gsec.map((row: any) => (
                      <tr key={row.maturity} className="hover:bg-bg-secondary transition-colors">
                        <td className="py-2 px-3 font-semibold text-text-main">{row.maturity}</td>
                        <td className="py-2 px-3 text-right font-bold text-forest">{row.yield_pct.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
