"use client";

import React, { useState } from "react";
import { Terminal, ChevronRight } from "lucide-react";

interface BloombergBarProps {
  onNavigate: (tab: string) => void;
}

export function BloombergBar({ onNavigate }: BloombergBarProps) {
  const [input, setInput] = useState("");

  const functions = [
    { code: "PORT", label: "Portfolio Risk", tab: "overview" },
    { code: "STRAT", label: "Algorithmic Desk", tab: "strat" },
    { code: "QDOC", label: "Layman's Guide", tab: "quantdocs" },
    { code: "TSIM", label: "Pre-Trade Sim", tab: "tradesim" },
    { code: "CHRT", label: "Adv Charting", tab: "charting" },
    { code: "BTST", label: "Backtest Lab", tab: "quant" },
    { code: "YCRV", label: "Yield Curve", tab: "yieldcurve" },
    { code: "SWAP", label: "IRS Pricer", tab: "swap" },
    { code: "CDSW", label: "CDS Pricer", tab: "cds" },
    { code: "OVAL", label: "Options Calc", tab: "options" },
    { code: "OVME", label: "Vol Surface", tab: "vol" },
    { code: "CAP", label: "Basel Capital", tab: "basel" },
    { code: "NET", label: "Contagion Net", tab: "contagion" },
    { code: "XAI", label: "ML Explain", tab: "xai" },
    { code: "NEWS", label: "News Wire", tab: "news" },
    { code: "MON", label: "Limits Monitor", tab: "limits" },
    { code: "METH", label: "Methodology", tab: "methodology" }
  ];

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim().toUpperCase();
    const found = functions.find((f) => f.code === clean);
    if (found) {
      onNavigate(found.tab);
    }
    setInput("");
  };

  return (
    <div className="bg-text-main text-white px-4 py-2 flex items-center justify-between font-mono text-xs border-b border-bg-border select-none overflow-x-auto">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-forest px-2 py-0.5 rounded font-bold text-[10px] tracking-wider uppercase shrink-0">
          <Terminal className="w-3 h-3" />
          <span>BLOOMBERG TERMINAL</span>
        </div>

        <form onSubmit={handleCommand} className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/20">
          <ChevronRight className="w-3.5 h-3.5 text-forest" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type code (QDOC, CHRT, SWAP, CDSW)..."
            className="bg-transparent border-none outline-none text-white text-xs w-64 placeholder:text-gray-500 uppercase font-mono"
          />
        </form>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 text-[10px] overflow-x-auto whitespace-nowrap scrollbar-hide ml-4">
        {functions.map((f) => (
          <button
            key={f.code}
            onClick={() => onNavigate(f.tab)}
            className="px-2 py-0.5 bg-white/10 hover:bg-forest rounded border border-white/15 transition-colors font-bold text-gray-200 hover:text-white shrink-0"
          >
            <span className="text-forest-light mr-1">{f.code}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
