"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Activity, Zap, Server, ChevronRight, DollarSign, TrendingUp } from "lucide-react";

export function StratDesk() {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    const fetchStatus = () => {
      fetch("http://127.0.0.1:8000/api/trading/status")
        .then(res => res.json())
        .then(d => setData(d))
        .catch(e => console.error(e));
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500); // Poll every 1.5s for live effect
    return () => clearInterval(interval);
  }, []);

  const toggleDaemon = async () => {
    const action = data?.is_running ? "stop" : "start";
    await fetch(`http://127.0.0.1:8000/api/trading/${action}`, { method: "POST" });
    // Fetch immediately after toggle
    const res = await fetch("http://127.0.0.1:8000/api/trading/status");
    setData(await res.json());
  };

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-forest" />
            MULTI-STRATEGY ALGORITHMIC DESK
          </h2>
          <p className="text-xs text-text-muted mt-1">Autonomous, lifetime execution engine managing 10+ quantitative strategies.</p>
        </div>
        <button 
          onClick={toggleDaemon}
          className={`px-4 py-2 rounded font-bold text-xs font-mono uppercase tracking-wider transition-colors ${
            data?.is_running 
              ? "bg-status-critical/20 text-status-critical hover:bg-status-critical/30 border border-status-critical/50" 
              : "bg-forest hover:bg-forest-dark text-white"
          }`}
        >
          {data?.is_running ? "HALT ALL ALGORITHMS" : "ENGAGE BEAST MODE (START)"}
        </button>
      </div>

      {/* Lifetime PnL Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-bg-border rounded p-4 flex flex-col justify-center">
          <span className="text-[10px] text-text-muted font-mono mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> INITIAL BASE CAPITAL
          </span>
          <div className="text-2xl font-bold text-text-main font-mono">
            ${data?.initial_capital?.toLocaleString() || "10,000,000"}
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded p-4 flex flex-col justify-center">
          <span className="text-[10px] text-text-muted font-mono mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" /> CURRENT PORTFOLIO BALANCE
          </span>
          <div className={`text-2xl font-bold font-mono ${data?.current_balance > data?.initial_capital ? 'text-forest' : 'text-text-main'}`}>
            ${data?.current_balance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "10,000,000.00"}
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded p-4 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-forest/10 to-transparent"></div>
          <span className="text-[10px] text-text-muted font-mono mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-forest" /> LIFETIME PROFIT / LOSS
          </span>
          <div className={`text-2xl font-bold font-mono ${data?.total_profit_loss >= 0 ? 'text-forest' : 'text-status-critical'}`}>
            {data?.total_profit_loss >= 0 ? '+' : ''}
            ${data?.total_profit_loss?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Strategies */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden flex flex-col max-h-[600px]">
            <div className="bg-bg-secondary p-3 border-b border-bg-border flex justify-between items-center shrink-0">
              <h3 className="font-bold text-xs font-mono">ACTIVE STRATEGIES (10)</h3>
              <span className="text-[10px] text-forest font-bold bg-forest-light px-2 py-0.5 rounded">AUTO-WEIGHTED</span>
            </div>
            <div className="p-2 space-y-1.5 overflow-y-auto flex-1 scrollbar-hide">
              {data?.strategies?.map((strat: any) => (
                <div key={strat.id} className="bg-bg-main border border-bg-border rounded p-2.5 flex justify-between items-center group hover:border-forest/50 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-text-main group-hover:text-forest transition-colors">{strat.name}</div>
                    <div className="text-[9px] text-text-muted mt-0.5 font-mono">ALLOC: {strat.weight}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${data?.is_running ? 'bg-forest animate-pulse' : 'bg-status-critical'}`}></span>
                    <span className="text-[10px] text-text-muted font-mono">{data?.is_running ? strat.status : "HALTED"}</span>
                  </div>
                </div>
              ))}
              {!data && (
                <div className="text-center py-10 text-xs text-text-muted font-mono">Loading Strategy Matrix...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live Executions */}
        <div className="lg:col-span-2">
          <div className="bg-bg-surface border border-bg-border rounded-lg overflow-hidden flex flex-col h-[600px]">
            <div className="bg-bg-secondary p-3 border-b border-bg-border flex justify-between items-center shrink-0">
              <h3 className="font-bold text-xs font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4" /> LIVE AUTONOMOUS EXECUTIONS
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${data?.is_running ? 'bg-forest/20 text-forest animate-pulse' : 'bg-status-critical/20 text-status-critical'}`}>
                {data?.is_running ? "STREAMING (LIVE)" : "DISCONNECTED"}
              </span>
            </div>
            
            <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[10px] leading-relaxed relative scrollbar-hide">
              {!data?.recent_trades?.length && (
                <div className="text-gray-600 flex items-center gap-2 h-full justify-center">
                  <Zap className="w-4 h-4" />
                  WAITING FOR EXECUTION SIGNAL...
                </div>
              )}
              
              <div className="space-y-1.5">
                {data?.recent_trades?.map((trade: any, i: number) => (
                  <div key={trade.id} className={`flex items-start gap-3 py-1.5 border-b border-gray-800/50 hover:bg-white/5 px-2 rounded transition-colors ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                    <span className="text-gray-500 w-24 shrink-0">{trade.timestamp}</span>
                    <span className="text-blue-400 w-16 shrink-0">{trade.id}</span>
                    <span className={`w-10 font-bold shrink-0 ${trade.side === 'BUY' ? 'text-forest' : 'text-status-critical'}`}>
                      {trade.side}
                    </span>
                    <span className="text-yellow-400 w-16 shrink-0 font-bold">{trade.size}</span>
                    <span className="w-16 shrink-0 text-white font-bold">{trade.asset}</span>
                    <span className="flex-1 text-gray-400 truncate">via {trade.strategy}</span>
                    <span className={`w-20 text-right font-bold shrink-0 ${trade.pnl_impact >= 0 ? 'text-forest' : 'text-status-critical'}`}>
                      {trade.pnl_impact >= 0 ? '+' : ''}${trade.pnl_impact.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
