"use client";

import React, { useState } from "react";
import { Sliders, Play, AlertOctagon, BrainCircuit, ShieldAlert } from "lucide-react";
import { runStressSimulation } from "@/lib/api";

export function StressLab() {
  const [rateShock, setRateShock] = useState(100);
  const [niftyShock, setNiftyShock] = useState(-15);
  const [sp500Shock, setSp500Shock] = useState(-20);
  const [usdinrShock, setUsdinrShock] = useState(10);
  const [volatilityShock, setVolatilityShock] = useState(50);
  const [creditSpread, setCreditSpread] = useState(200);

  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    const res = await runStressSimulation({
      rate_shock_bps: rateShock,
      nifty_shock_pct: niftyShock,
      sp500_shock_pct: sp500Shock,
      usdinr_shock_pct: usdinrShock,
      volatility_shock_pct: volatilityShock,
      credit_spread_bps: creditSpread
    });
    setSimulationResult(res);
    setLoading(false);
  };

  React.useEffect(() => {
    handleSimulate();
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      
      {/* Header */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center gap-3 border-b border-bg-border pb-3 mb-3">
          <div className="p-2 rounded bg-forest-light text-forest">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              RISK DIGITAL TWIN — MACRO STRESS TESTING LAB
            </h3>
            <p className="text-xs text-text-muted">
              Simulates extreme systemic market shocks, interest rate shifts, and cross-border currency movements across US & Indian portfolios.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sliders Input Panel (1 col) */}
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5 space-y-5 font-mono text-xs">
          <h4 className="font-bold uppercase text-text-main border-b border-bg-border pb-3">
            MACRO SCENARIO VARIABLES
          </h4>

          {/* Interest Rate Shock Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">INTEREST RATE SHOCK</span>
              <span className="font-bold text-forest">{rateShock > 0 ? `+${rateShock}` : rateShock} bps</span>
            </div>
            <input 
              type="range" min="-200" max="300" step="25"
              value={rateShock} onChange={(e) => setRateShock(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
          </div>

          {/* NIFTY 50 Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">NIFTY 50 DRAWDOWN</span>
              <span className={`font-bold ${niftyShock < 0 ? "text-status-critical" : "text-status-normal"}`}>
                {niftyShock}%
              </span>
            </div>
            <input 
              type="range" min="-40" max="20" step="5"
              value={niftyShock} onChange={(e) => setNiftyShock(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
          </div>

          {/* S&P 500 Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">S&P 500 DRAWDOWN</span>
              <span className={`font-bold ${sp500Shock < 0 ? "text-status-critical" : "text-status-normal"}`}>
                {sp500Shock}%
              </span>
            </div>
            <input 
              type="range" min="-40" max="20" step="5"
              value={sp500Shock} onChange={(e) => setSp500Shock(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
          </div>

          {/* USD/INR FX Shock Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">USD / INR FX SHOCK</span>
              <span className="font-bold text-status-warning">{usdinrShock > 0 ? `+${usdinrShock}` : usdinrShock}%</span>
            </div>
            <input 
              type="range" min="-20" max="30" step="5"
              value={usdinrShock} onChange={(e) => setUsdinrShock(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
          </div>

          {/* Volatility Spike */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">VOLATILITY SPIKE</span>
              <span className="font-bold text-status-critical">+{volatilityShock}%</span>
            </div>
            <input 
              type="range" min="0" max="100" step="10"
              value={volatilityShock} onChange={(e) => setVolatilityShock(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
          </div>

          {/* Credit Spread */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">CREDIT SPREAD WIDENING</span>
              <span className="font-bold text-status-warning">+{creditSpread} bps</span>
            </div>
            <input 
              type="range" min="0" max="500" step="50"
              value={creditSpread} onChange={(e) => setCreditSpread(Number(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-2 bg-forest hover:bg-forest-dark text-white font-bold rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? "SIMULATING DIGITAL TWIN..." : "RUN DIGITAL TWIN SIMULATION"}</span>
          </button>
        </div>

        {/* Output Panel (2 cols) */}
        <div className="md:col-span-2 bg-bg-surface border border-bg-border rounded-lg p-5 space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <h4 className="font-bold uppercase text-text-main">
              STRESS SIMULATION RESULTS & RISK IMPACT
            </h4>
            {simulationResult && (
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                simulationResult.risk_level === "CRITICAL" ? "bg-status-critical/10 text-status-critical border border-status-critical/30" :
                "bg-status-warning/10 text-status-warning border border-status-warning/30"
              }`}>
                RISK LEVEL: {simulationResult.risk_level}
              </span>
            )}
          </div>

          {simulationResult ? (
            <>
              {/* Outcome Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                  <span className="text-[10px] text-text-muted">PORTFOLIO P&L</span>
                  <div className="font-bold text-sm text-status-critical mt-1">
                    {simulationResult.portfolio_pnl_pct}%
                  </div>
                  <span className="text-[10px] text-text-light">
                    -${Math.abs(simulationResult.portfolio_pnl_amount)?.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                  <span className="text-[10px] text-text-muted">STRESSED 99% VaR</span>
                  <div className="font-bold text-sm text-status-warning mt-1">
                    ${simulationResult.stressed_var_99?.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-text-light">+84.2% increase</span>
                </div>

                <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                  <span className="text-[10px] text-text-muted">LIQUIDITY BUFFER</span>
                  <div className="font-bold text-sm text-status-critical mt-1">
                    {simulationResult.liquidity_buffer_impact_pct}%
                  </div>
                  <span className="text-[10px] text-text-light">Drawdown under stress</span>
                </div>

                <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                  <span className="text-[10px] text-text-muted">EXPECTED CREDIT LOSS</span>
                  <div className="font-bold text-sm text-status-warning mt-1">
                    +{simulationResult.expected_credit_loss_increase_pct}%
                  </div>
                  <span className="text-[10px] text-text-light">Spread impact</span>
                </div>
              </div>

              {/* Critical Finding Box */}
              <div className="p-4 bg-status-critical/5 border border-status-critical/30 rounded flex items-start gap-3 text-status-critical">
                <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase text-[11px]">K2 DIGITAL TWIN CRITICAL FINDING</div>
                  <p className="text-text-main font-sans text-xs mt-1 leading-relaxed">
                    {simulationResult.critical_finding}
                  </p>
                </div>
              </div>

              {/* Stress Severity Meter */}
              <div>
                <span className="text-[10px] text-text-muted block mb-1">SYSTEMIC STRESS LEVEL METER</span>
                <div className="w-full bg-bg-secondary h-3 rounded overflow-hidden border border-bg-border flex">
                  <div className="bg-status-critical h-full w-[85%]" />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>0% Normal</span>
                  <span>50% High</span>
                  <span className="text-status-critical font-bold">85% Critical Threshold</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

      </div>

    </div>
  );
}
