"use client";

import React, { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

export function SwapPricer() {
  const [notional, setNotional] = useState(50000000.0);
  const [fixedRateBps, setFixedRateBps] = useState(450.0);
  const [floatingSpreadBps, setFloatingSpreadBps] = useState(15.0);
  const [tenorYears, setTenorYears] = useState(5);
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/quant/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notional: Number(notional),
          fixed_rate_bps: Number(fixedRateBps),
          tenor_years: Number(tenorYears),
          floating_spread_bps: Number(floatingSpreadBps)
        })
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    calculate();
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center gap-3 border-b border-bg-border pb-3 mb-4">
          <div className="p-2 rounded bg-forest-light text-forest">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              INTEREST RATE SWAP PRICER (SWAP)
            </h3>
            <p className="text-xs text-text-muted">
              Institutional IRS pricer: Receive Fixed / Pay Floating on SOFR/LIBOR forward curves.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs mb-6">
          <div>
            <label className="text-text-muted block text-[10px] mb-1">NOTIONAL (USD)</label>
            <input
              type="number" value={notional} onChange={(e) => setNotional(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">FIXED RATE (BPS)</label>
            <input
              type="number" value={fixedRateBps} onChange={(e) => setFixedRateBps(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">FLOAT SPREAD (BPS)</label>
            <input
              type="number" value={floatingSpreadBps} onChange={(e) => setFloatingSpreadBps(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">TENOR (YEARS)</label>
            <input
              type="number" value={tenorYears} onChange={(e) => setTenorYears(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
        </div>

        <button
          onClick={calculate} disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-forest hover:bg-forest-dark text-white font-bold text-xs font-mono rounded transition-colors mb-6"
        >
          {loading ? "CALCULATING..." : "COMPUTE NPV & PAR RATE"}
        </button>

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs border-t border-bg-border pt-6">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">NET PRESENT VALUE (NPV)</span>
                <div className={`font-bold text-xl mt-1 ${result.net_present_value_usd > 0 ? "text-status-normal" : "text-status-critical"}`}>
                  ${result.net_present_value_usd?.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">PAR SWAP RATE</span>
                <div className="font-bold text-xl text-text-main mt-1">
                  {result.par_swap_rate_bps?.toFixed(1)} bps
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">FIXED LEG PV</span>
                <div className="font-bold text-sm text-forest mt-1">
                  ${result.fixed_leg_pv_usd?.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">FLOAT LEG PV</span>
                <div className="font-bold text-sm text-status-warning mt-1">
                  ${result.float_leg_pv_usd?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-bg-border rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bg-secondary">
                  <tr className="border-b border-bg-border text-text-muted uppercase text-[10px]">
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Forward Rate (%)</th>
                    <th className="py-2 px-3">Discount Factor</th>
                    <th className="py-2 px-3 text-right">Fixed Cashflow ($)</th>
                    <th className="py-2 px-3 text-right">Float Cashflow ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border/60">
                  {result.cash_flows?.map((cf: any) => (
                    <tr key={cf.year} className="hover:bg-bg-secondary transition-colors">
                      <td className="py-2 px-3 text-text-main font-bold">Year {cf.year}</td>
                      <td className="py-2 px-3 text-text-main">{cf.forward_rate_pct.toFixed(2)}%</td>
                      <td className="py-2 px-3 text-text-muted">{cf.discount_factor.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right text-forest font-semibold">${cf.fixed_cashflow.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-status-warning font-semibold">${cf.float_cashflow.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
