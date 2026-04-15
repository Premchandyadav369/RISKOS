"use client";

import React from "react";
import { Search, Bell, ShieldCheck, RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function Header({ title, subtitle, onRefresh }: HeaderProps) {
  return (
    <header className="h-14 bg-bg-surface border-b border-bg-border px-6 flex items-center justify-between select-none">
      <div>
        <h2 className="text-sm font-bold text-text-main font-mono tracking-tight uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-text-muted font-sans">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="hidden md:flex items-center gap-2 bg-bg-secondary px-3 py-1 rounded border border-bg-border text-text-muted">
          <Search className="w-3.5 h-3.5" />
          <input 
            type="text" 
            placeholder="Search Ticker (NVDA, TCS.NS, JPM)..." 
            className="bg-transparent border-none outline-none text-text-main text-xs w-48 placeholder:text-text-light font-sans"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className="w-2 h-2 rounded-full bg-status-normal" />
            <span className="font-semibold text-text-main">LIVE</span>
            <span className="text-[10px] text-text-light">| 12 AUG 2026</span>
          </span>

          <div className="px-2 py-0.5 rounded bg-forest-light text-forest text-[11px] font-semibold border border-forest/20">
            IN ↔ US PORTFOLIO
          </div>

          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="p-1.5 hover:bg-bg-secondary rounded text-text-muted hover:text-text-main transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
