"use client";

import React from "react";
import { 
  ShieldAlert, 
  Globe2, 
  Calculator, 
  Sliders, 
  BrainCircuit, 
  AlertTriangle, 
  FileText,
  BarChart3,
  TrendingUp,
  Layers,
  ShieldCheck,
  Activity
} from "lucide-react";

interface NavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export function Navigation({ currentTab, setTab }: NavProps) {
  const items = [
    { id: "overview", label: "Portfolio Risk (PORT)", icon: BarChart3 },
    { id: "strat", label: "Algorithmic Desk (STRAT)", icon: TrendingUp },
    { id: "tradesim", label: "Pre-Trade Sim (TSIM)", icon: Calculator },
    { id: "markets", label: "Cross-Market (IN/US)", icon: Globe2 },
    { id: "quant", label: "Quant Risk Lab (BTST)", icon: Calculator },
    { id: "vol", label: "Vol Surface (OVME)", icon: Layers },
    { id: "basel", label: "Basel Capital (CAP)", icon: ShieldCheck },
    { id: "contagion", label: "Contagion Net (NET)", icon: Activity },
    { id: "stress", label: "Stress Lab & Twin", icon: Sliders },
    { id: "investigations", label: "AI Investigations", icon: BrainCircuit },
    { id: "news", label: "News Wire (NEWS)", icon: Globe2 },
    { id: "limits", label: "Breach Monitor (MON)", icon: AlertTriangle },
    { id: "reports", label: "Executive Reports", icon: FileText }
  ];

  return (
    <aside className="w-64 bg-bg-surface border-r border-bg-border h-screen flex flex-col justify-between select-none">
      <div>
        <div className="p-4 border-b border-bg-border flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-forest flex items-center justify-center text-white font-mono font-bold text-lg">
            R
          </div>
          <div>
            <h1 className="font-bold text-text-main text-base tracking-tight font-mono leading-none">
              RISKOS
            </h1>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-forest font-mono">
              QUANT TERMINAL
            </span>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {items.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                  active
                    ? "bg-forest-light text-forest font-semibold border-l-4 border-forest"
                    : "text-text-muted hover:text-text-main hover:bg-bg-secondary"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-forest" : "text-text-muted"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-bg-border bg-bg-secondary text-[11px] font-mono text-text-muted space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-normal animate-pulse" />
            DAEMON: RUNNING
          </span>
          <span className="text-forest font-semibold">NON-STOP</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>REASONING:</span>
          <span className="text-text-main font-semibold">K2 Think V2</span>
        </div>
      </div>
    </aside>
  );
}
