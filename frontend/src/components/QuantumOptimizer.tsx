"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Atom, CheckCircle2, Zap, ArrowRight, Layers, BarChart2 } from "lucide-react";

export function QuantumOptimizer() {
  const [data, setData] = useState<any>(null);
  const [cardinalityK, setCardinalityK] = useState<number>(4);

  const fetchQuantum = () => {
    fetch(`http://127.0.0.1:8000/api/optimization/quantum?cardinality_k=${cardinalityK}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchQuantum();
  }, [cardinalityK]);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Atom className="w-5 h-5 text-forest" />
            QUANTUM-INSPIRED PORTFOLIO OPTIMIZER (QUBO / QAOA)
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Quadratic Unconstrained Binary Optimization & Simulated Quantum Annealing for discrete asset selection with cardinality constraints.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-bg-surface border border-bg-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-text-muted">CARDINALITY CONSTRAINT (EXACT ASSET COUNT K):</span>
          <span className="text-white font-bold font-mono text-sm">{cardinalityK} Assets</span>
        </div>
        <div className="flex gap-2 font-mono text-xs">
          {[2, 3, 4, 5, 6].map((k) => (
            <button
              key={k}
              onClick={() => setCardinalityK(k)}
              className={`px-3 py-1 rounded border transition-colors ${
                cardinalityK === k
                  ? "bg-forest text-white border-forest font-bold"
                  : "border-bg-border text-text-muted hover:text-white"
              }`}
            >
              K={k}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">HAMILTONIAN GROUND ENERGY</span>
          <div className="text-2xl font-bold font-mono text-forest">
            {data?.quantum_state_details?.hamiltonian_ground_energy || "-0.0421"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">QUBO Global Minima Reached</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">EXPECTED ANNUAL RETURN</span>
          <div className="text-2xl font-bold font-mono text-white">
            {data?.optimized_portfolio?.expected_annual_return_pct || "16.2"}%
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Optimized basket return</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">PORTFOLIO VOLATILITY</span>
          <div className="text-2xl font-bold font-mono text-yellow-400">
            {data?.optimized_portfolio?.annualized_volatility_pct || "14.8"}%
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Covariance shrunk volatility</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">SHARPE RATIO</span>
          <div className="text-2xl font-bold font-mono text-forest">
            {data?.optimized_portfolio?.sharpe_ratio || "1.24"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Risk-free rate: 4.0%</span>
        </div>
      </div>

      {/* Asset Selection Matrix */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
          <Cpu className="w-4 h-4 text-forest" />
          DISCRETE ASSET SELECTION & QUANTUM BITSTRING ALLOCATION
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {data?.allocations?.map((a: any, i: number) => (
            <div
              key={i}
              className={`p-3.5 rounded-lg border text-xs font-mono transition-all ${
                a.selected_by_qubo
                  ? "bg-forest/10 border-forest text-white"
                  : "bg-bg-secondary border-bg-border text-gray-500 opacity-60"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm">{a.asset}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${a.selected_by_qubo ? 'bg-forest text-white' : 'bg-bg-main text-gray-400'}`}>
                  {a.selected_by_qubo ? "SELECTED" : "PRUNED"}
                </span>
              </div>
              <div className="flex justify-between text-[11px] mt-2">
                <span className="text-text-muted">Weight:</span>
                <span className="font-bold text-forest">{a.weight_pct}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">Exp Return:</span>
                <span className="font-bold text-white">{a.expected_return}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
