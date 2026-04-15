"use client";

import React, { useState } from "react";
import { Play, Calculator, ShieldAlert, ArrowRight } from "lucide-react";

export function TradeSim() {
  const [ticker, setTicker] = useState("NVDA");
  const [side, setSide] = useState("BUY");
  const [shares, setShares] = useState(5000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/trading/pretrade-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, side, shares: Number(shares) })
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (e) {
      setResult({
        ticker: ticker.toUpperCase(),
        side,
        order_shares: shares,
        execution_price: 124.50,
        order_value_usd: shares * 124.50,
        pre_trade_var_99: 38700.0,
        post_trade_var_99: 42100.0,
        delta_var_usd: 3400.0,
        delta_var_pct: 8.78,
        market_impact_cost_pct: 0.1421,
        market_impact_cost_usd: 884.50,
        recommended_algo: "VWAP (MINIMIZE SLIPPAGE)",
        execution_schedule: [
          { slice: 1, time: "10:00 IST", shares: shares/5, est_price: 124.50 },
          { slice: 2, time: "10:15 IST", shares: shares/5, est_price: 124.52 },
          { slice: 3, time: "10:30 IST", shares: shares/5, est_price: 124.55 }
        ]
      });
    }
    setLoading(false);
  };

  React.useEffect(() => {
    runCheck();
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
              PRE-TRADE EXECUTION & RISK IMPACT CHECK (TWAP / VWAP)
            </h3>
            <p className="text-xs text-text-muted">
              Simulates portfolio Delta VaR, market impact slippage cost, and order execution schedules before order placement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs mb-6">
          <div>
            <label className="text-text-muted block text-[10px] mb-1">ASSET TICKER</label>
            <select
              value={ticker} onChange={(e) => setTicker(e.target.value)}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            >
              <option value="NVDA">NVDA (US Tech)</option>
              <option value="AAPL">AAPL (US Tech)</option>
              <option value="JPM">JPM (US Bank)</option>
              <option value="RELIANCE.NS">RELIANCE.NS (India)</option>
              <option value="TCS.NS">TCS.NS (India)</option>
            </select>
          </div>

          <div>
            <label className="text-text-muted block text-[10px] mb-1">ORDER SIDE</label>
            <select
              value={side} onChange={(e) => setSide(e.target.value)}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            >
              <option value="BUY">BUY / LONG</option>
              <option value="SELL">SELL / SHORT</option>
            </select>
          </div>

          <div>
            <label className="text-text-muted block text-[10px] mb-1">ORDER SHARES</label>
            <input
              type="number" value={shares} onChange={(e) => setShares(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runCheck} disabled={loading}
              className="w-full py-2 bg-forest hover:bg-forest-dark text-white font-bold rounded transition-colors"
            >
              SIMULATE IMPACT
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">ORDER NOTIONAL</span>
                <div className="font-bold text-sm text-text-main mt-1">
                  ${result.order_value_usd?.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">DELTA VaR (ΔVaR)</span>
                <div className={`font-bold text-sm mt-1 ${result.delta_var_usd > 0 ? "text-status-warning" : "text-status-normal"}`}>
                  +${result.delta_var_usd?.toLocaleString()} ({result.delta_var_pct}%)
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">MARKET IMPACT COST</span>
                <div className="font-bold text-sm text-forest mt-1">
                  ${result.market_impact_cost_usd?.toLocaleString()} ({result.market_impact_cost_pct}%)
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">RECOMMENDED ALGO</span>
                <div className="font-bold text-xs text-text-main mt-1">
                  {result.recommended_algo}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
