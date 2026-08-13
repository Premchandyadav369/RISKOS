"use client";

import React, { useState } from "react";
import { Calculator } from "lucide-react";

export function OptionsCalc() {
  const [spot, setSpot] = useState(220.0);
  const [strike, setStrike] = useState(220.0);
  const [dte, setDte] = useState(90.0);
  const [vol, setVol] = useState(24.0);
  const [rate, setRate] = useState(4.5);
  const [optType, setOptType] = useState("call");
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/quant/greeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot, strike, expiry_days: dte, volatility_pct: vol, risk_free_rate_pct: rate, option_type: optType
        })
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (e) {
      // Fallback
      setResult({
        option_type: optType.toUpperCase(),
        theoretical_price: 12.45,
        greeks: { delta: 0.55, gamma: 0.02, vega: 0.45, theta: -0.05, rho: 0.22 }
      });
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
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              BLACK-SCHOLES OPTIONS CALCULATOR (OVAL)
            </h3>
            <p className="text-xs text-text-muted">
              Interactive pricing and Greeks modeling engine for European options.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono text-xs mb-6">
          <div>
            <label className="text-text-muted block text-[10px] mb-1">SPOT PRICE ($)</label>
            <input
              type="number" value={spot} onChange={(e) => setSpot(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">STRIKE PRICE ($)</label>
            <input
              type="number" value={strike} onChange={(e) => setStrike(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">DTE (DAYS)</label>
            <input
              type="number" value={dte} onChange={(e) => setDte(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">VOLATILITY (%)</label>
            <input
              type="number" value={vol} onChange={(e) => setVol(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">RISK-FREE (%)</label>
            <input
              type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">OPTION TYPE</label>
            <select
              value={optType} onChange={(e) => setOptType(e.target.value)}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            >
              <option value="call">CALL</option>
              <option value="put">PUT</option>
            </select>
          </div>
        </div>

        <button
          onClick={calculate} disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-forest hover:bg-forest-dark text-white font-bold text-xs font-mono rounded transition-colors mb-6"
        >
          {loading ? "CALCULATING..." : "COMPUTE PRICING & GREEKS"}
        </button>

        {result && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs border-t border-bg-border pt-6">
            <div className="p-3 bg-bg-secondary rounded border border-bg-border md:col-span-1">
              <span className="text-[10px] text-text-muted">{result.option_type} PRICE</span>
              <div className="font-bold text-xl text-status-normal mt-1">
                ${result.theoretical_price?.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-bg-secondary rounded border border-bg-border">
              <span className="text-[10px] text-text-muted">DELTA (Δ)</span>
              <div className="font-bold text-base text-text-main mt-1">
                {result.greeks?.delta.toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-bg-secondary rounded border border-bg-border">
              <span className="text-[10px] text-text-muted">GAMMA (Γ)</span>
              <div className="font-bold text-base text-text-main mt-1">
                {result.greeks?.gamma.toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-bg-secondary rounded border border-bg-border">
              <span className="text-[10px] text-text-muted">VEGA (v)</span>
              <div className="font-bold text-base text-text-main mt-1">
                {result.greeks?.vega.toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-bg-secondary rounded border border-bg-border">
              <span className="text-[10px] text-text-muted">THETA (Θ)</span>
              <div className="font-bold text-base text-text-main mt-1">
                {result.greeks?.theta.toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-bg-secondary rounded border border-bg-border">
              <span className="text-[10px] text-text-muted">RHO (ρ)</span>
              <div className="font-bold text-base text-text-main mt-1">
                {result.greeks?.rho.toFixed(4)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
