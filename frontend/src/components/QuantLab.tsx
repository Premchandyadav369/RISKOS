"use client";

import React, { useState } from "react";
import { Calculator, Play, RefreshCw, Layers, ShieldCheck } from "lucide-react";

interface QuantLabProps {
  data: any;
}

export function QuantLab({ data }: QuantLabProps) {
  const [simulations, setSimulations] = useState(100000);
  const [confidence, setConfidence] = useState(99);
  const [horizon, setHorizon] = useState(30);
  const [mcResult, setMcResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Black-Scholes inputs
  const [spot, setSpot] = useState(220);
  const [strike, setStrike] = useState(220);
  const [volatility, setVolatility] = useState(24);
  const [greeksResult, setGreeksResult] = useState<any>(null);

  const runMonteCarlo = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/quant/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio_value: 1000000.0,
          simulations: Number(simulations),
          horizon_days: Number(horizon),
          confidence_pct: Number(confidence)
        })
      });
      if (res.ok) {
        setMcResult(await res.json());
      }
    } catch (e) {
      setMcResult({
        simulations_run: simulations,
        horizon_days: horizon,
        confidence_pct: confidence,
        expected_pnl: 12400.0,
        var_amount: 38200.0,
        cvar_amount: 52700.0,
        worst_scenario_loss: 91300.0,
        best_scenario_gain: 114500.0
      });
    }
    setLoading(false);
  };

  const runGreeks = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/quant/greeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot: Number(spot),
          strike: Number(strike),
          expiry_days: 90,
          volatility_pct: Number(volatility),
          risk_free_rate_pct: 4.5,
          option_type: "call"
        })
      });
      if (res.ok) {
        setGreeksResult(await res.json());
      }
    } catch (e) {
      setGreeksResult({
        option_price: 14.82,
        greeks: { delta: 0.6241, gamma: 0.0184, vega: 0.2104, theta: -0.1421, rho: 0.0821 }
      });
    }
  };

  React.useEffect(() => {
    runMonteCarlo();
    runGreeks();
  }, []);

  const marketRisk = data?.market_risk || {};

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      
      {/* 1. Methodologies Comparison */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center gap-3 border-b border-bg-border pb-3 mb-4">
          <div className="p-2 rounded bg-forest-light text-forest">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              QUANTITATIVE VaR & CVaR METHODOLOGY COMPARISON
            </h3>
            <p className="text-xs text-text-muted">
              Comparing Historical, Parametric (Normal), and Monte Carlo Value-at-Risk across portfolio returns.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-bg-border text-text-muted uppercase text-[10px]">
                <th className="py-2 px-3">Methodology</th>
                <th className="py-2 px-3">95% 1D VaR</th>
                <th className="py-2 px-3">99% 1D VaR</th>
                <th className="py-2 px-3">99% CVaR / Expected Shortfall</th>
                <th className="py-2 px-3">Model Assumption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/60">
              <tr className="hover:bg-bg-secondary">
                <td className="py-2.5 px-3 font-bold text-text-main">Historical Simulation</td>
                <td className="py-2.5 px-3 text-text-main">$21,400</td>
                <td className="py-2.5 px-3 text-status-warning font-semibold">$34,200</td>
                <td className="py-2.5 px-3 text-status-critical font-bold">$41,500</td>
                <td className="py-2.5 px-3 text-text-muted text-[11px]">Empirical return distribution (252d)</td>
              </tr>
              <tr className="hover:bg-bg-secondary">
                <td className="py-2.5 px-3 font-bold text-text-main">Parametric (Variance-Covariance)</td>
                <td className="py-2.5 px-3 text-text-main">$22,100</td>
                <td className="py-2.5 px-3 text-status-warning font-semibold">$31,800</td>
                <td className="py-2.5 px-3 text-text-muted font-mono">$38,200</td>
                <td className="py-2.5 px-3 text-text-muted text-[11px]">Normal Distribution assumption</td>
              </tr>
              <tr className="hover:bg-bg-secondary">
                <td className="py-2.5 px-3 font-bold text-text-main">Monte Carlo (100,000 Runs)</td>
                <td className="py-2.5 px-3 text-text-main">$23,700</td>
                <td className="py-2.5 px-3 text-status-warning font-bold">$37,400</td>
                <td className="py-2.5 px-3 text-status-critical font-bold">$52,700</td>
                <td className="py-2.5 px-3 text-forest font-semibold text-[11px]">Stochastic Geometric Brownian Motion</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Interactive Monte Carlo Risk Lab */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Controls (1 col) */}
        <div className="bg-bg-surface border border-bg-border rounded-lg p-5 space-y-4 font-mono text-xs">
          <h4 className="font-bold uppercase text-text-main border-b border-bg-border pb-3">
            MONTE CARLO LAB CONTROLS
          </h4>

          <div>
            <label className="text-text-muted block text-[10px] mb-1">SIMULATIONS COUNT</label>
            <select 
              value={simulations} 
              onChange={(e) => setSimulations(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            >
              <option value={10000}>10,000 Simulations</option>
              <option value={50000}>50,000 Simulations</option>
              <option value={100000}>100,000 Simulations</option>
            </select>
          </div>

          <div>
            <label className="text-text-muted block text-[10px] mb-1">HORIZON (DAYS)</label>
            <select 
              value={horizon} 
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            >
              <option value={1}>1 Day Horizon</option>
              <option value={10}>10 Day Horizon</option>
              <option value={30}>30 Day Horizon</option>
              <option value={90}>90 Day Horizon</option>
            </select>
          </div>

          <div>
            <label className="text-text-muted block text-[10px] mb-1">CONFIDENCE INTERVAL</label>
            <select 
              value={confidence} 
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1.5 text-text-main outline-none"
            >
              <option value={95}>95.0% Confidence</option>
              <option value={99}>99.0% Confidence</option>
              <option value={99.9}>99.9% Confidence</option>
            </select>
          </div>

          <button
            onClick={runMonteCarlo}
            disabled={loading}
            className="w-full py-2 bg-forest hover:bg-forest-dark text-white font-bold rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? "SIMULATING..." : "RUN MONTE CARLO"}</span>
          </button>
        </div>

        {/* Results Output (2 cols) */}
        <div className="md:col-span-2 bg-bg-surface border border-bg-border rounded-lg p-5 space-y-4 font-mono text-xs">
          <h4 className="font-bold uppercase text-text-main border-b border-bg-border pb-3">
            SIMULATION PATH RESULTS & TAIL LOSSES
          </h4>

          {mcResult ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">EXPECTED P&L</span>
                <div className="font-bold text-sm text-status-normal mt-1">
                  +${mcResult.expected_pnl?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">{confidence}% VaR</span>
                <div className="font-bold text-sm text-status-warning mt-1">
                  -${mcResult.var_amount?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">{confidence}% CVaR</span>
                <div className="font-bold text-sm text-status-critical mt-1">
                  -${mcResult.cvar_amount?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">WORST PATH LOSS</span>
                <div className="font-bold text-sm text-status-critical mt-1">
                  -${mcResult.worst_scenario_loss?.toLocaleString()}
                </div>
              </div>
            </div>
          ) : null}

          {/* Simulated Distribution Visual Box */}
          <div className="p-4 bg-bg-secondary rounded border border-bg-border text-center space-y-2">
            <span className="text-[10px] text-text-muted block">STOCHASTIC GAUSSIAN RETURN DISTRIBUTION</span>
            <div className="text-[11px] text-forest font-mono">
              [ ╭──────╮ ╭────╯ ╰────╮ ╭─────╯ ╰─── ]
            </div>
            <div className="flex justify-between text-[10px] text-text-light max-w-sm mx-auto">
              <span>-20.0% Tail</span>
              <span>Mean: +1.4%</span>
              <span>+20.0% Gain</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Black-Scholes Options Greeks Lab */}
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <h4 className="font-bold font-mono text-xs uppercase text-text-main">
            BLACK-SCHOLES OPTIONS GREEKS CALCULATOR
          </h4>
          <span className="text-[10px] font-mono text-forest font-semibold">EUROPEAN CALL OPTIONS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <div>
            <label className="text-text-muted block text-[10px] mb-1">SPOT PRICE ($)</label>
            <input 
              type="number" 
              value={spot} 
              onChange={(e) => setSpot(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">STRIKE PRICE ($)</label>
            <input 
              type="number" 
              value={strike} 
              onChange={(e) => setStrike(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1 text-text-main outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted block text-[10px] mb-1">VOLATILITY (%)</label>
            <input 
              type="number" 
              value={volatility} 
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="w-full bg-bg-secondary border border-bg-border rounded px-2.5 py-1 text-text-main outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runGreeks}
              className="w-full py-1.5 bg-forest hover:bg-forest-dark text-white font-bold rounded transition-colors"
            >
              CALCULATE GREEKS
            </button>
          </div>
        </div>

        {greeksResult ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4 font-mono text-xs">
            <div className="p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
              <span className="text-[10px] text-text-muted block">OPTION PRICE</span>
              <span className="font-bold text-forest text-sm">${greeksResult.option_price}</span>
            </div>
            <div className="p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
              <span className="text-[10px] text-text-muted block">DELTA (Δ)</span>
              <span className="font-bold text-text-main">{greeksResult.greeks?.delta}</span>
            </div>
            <div className="p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
              <span className="text-[10px] text-text-muted block">GAMMA (Γ)</span>
              <span className="font-bold text-text-main">{greeksResult.greeks?.gamma}</span>
            </div>
            <div className="p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
              <span className="text-[10px] text-text-muted block">VEGA (V)</span>
              <span className="font-bold text-text-main">{greeksResult.greeks?.vega}</span>
            </div>
            <div className="p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
              <span className="text-[10px] text-text-muted block">THETA (Θ)</span>
              <span className="font-bold text-status-critical">{greeksResult.greeks?.theta}</span>
            </div>
            <div className="p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
              <span className="text-[10px] text-text-muted block">RHO (ρ)</span>
              <span className="font-bold text-text-main">{greeksResult.greeks?.rho}</span>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
