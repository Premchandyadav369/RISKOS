"use client";

import React from "react";
import { 
  ShieldAlert, 
  Globe2, 
  Calculator, 
  Sliders, 
  BrainCircuit, 
  AlertTriangle, 
  BarChart3,
  TrendingUp,
  Layers,
  ShieldCheck,
  Activity,
  LineChart,
  BookOpen,
  ArrowRightLeft,
  LineChart as ChartIcon,
  HelpCircle
} from "lucide-react";

interface NavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export function Navigation({ currentTab, setTab }: NavProps) {
  const items = [
    { id: "overview", label: "Portfolio Risk (PORT)", icon: BarChart3 },
    { id: "strat", label: "Algorithmic Desk (STRAT)", icon: TrendingUp },
    { id: "quantdocs", label: "Layman's Guide (QDOC)", icon: HelpCircle },
    { id: "tradesim", label: "Pre-Trade Sim (TSIM)", icon: Calculator },
    { id: "charting", label: "Adv Charting (CHRT)", icon: ChartIcon },
    { id: "markets", label: "Cross-Market (IN/US)", icon: Globe2 },
    { id: "quant", label: "Quant Risk Lab (BTST)", icon: Calculator },
    { id: "yieldcurve", label: "Yield Curve (YCRV)", icon: LineChart },
    { id: "swap", label: "IRS Pricer (SWAP)", icon: ArrowRightLeft },
    { id: "cds", label: "CDS Pricer (CDSW)", icon: ShieldAlert },
    { id: "options", label: "Options Calc (OVAL)", icon: Calculator },
    { id: "vol", label: "Vol Surface (OVME)", icon: Layers },
    { id: "basel", label: "Basel Capital (CAP)", icon: ShieldCheck },
    { id: "contagion", label: "Contagion Net (NET)", icon: Activity },
    { id: "stress", label: "Stress Lab & Twin", icon: Sliders },
    { id: "xai", label: "ML Explain (XAI)", icon: BrainCircuit },
    { id: "news", label: "Live News Wire (NEWS)", icon: Globe2 },
    { id: "limits", label: "Breach Monitor (MON)", icon: AlertTriangle },
    { id: "methodology", label: "Methodology (METH)", icon: BookOpen }
  ];

  return (
    <aside className="w-64 bg-bg-surface border-r border-bg-border h-screen flex flex-col justify-between select-none shrink-0">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-bg-border flex items-center gap-3 shrink-0">
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

        <nav className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  active
                    ? "bg-forest-light text-forest font-semibold border-l-4 border-forest"
                    : "text-text-muted hover:text-text-main hover:bg-bg-secondary"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-forest" : "text-text-muted"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-bg-border bg-bg-secondary text-[11px] font-mono text-text-muted space-y-1 shrink-0">
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
