"use client";

import React, { useState, useEffect } from "react";
import { Layers, Activity, ArrowUp, ArrowDown, Zap } from "lucide-react";

export function OrderBookView() {
  const [data, setData] = useState<any>(null);
  const [symbol, setSymbol] = useState("NVDA");

  useEffect(() => {
    const fetchDOM = () => {
      fetch(`http://127.0.0.1:8000/api/market/orderbook?symbol=${symbol}`)
        .then((res) => res.json())
        .then((d) => setData(d))
        .catch((e) => console.error(e));
    };

    fetchDOM();
    const interval = setInterval(fetchDOM, 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-forest" />
            LEVEL-2 ORDER BOOK & MICROSTRUCTURE DEPTH (DOM)
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Real-time Depth of Market ladder, Volume-at-Price, and Order Flow Imbalance (OFI) alpha signals.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          {["NVDA", "AAPL", "USDINR", "RELIANCE"].map((sym) => (
            <button
              key={sym}
              onClick={() => setSymbol(sym)}
              className={`px-3 py-1 rounded border transition-colors ${
                symbol === sym
                  ? "bg-forest text-white border-forest"
                  : "border-bg-border text-text-muted hover:text-white"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Microstructure Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">MID PRICE</span>
          <div className="text-2xl font-bold font-mono text-white">
            ${data?.mid_price || "128.50"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Spread: ${data?.spread || "0.10"}</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">ORDER FLOW IMBALANCE (OFI)</span>
          <div className={`text-2xl font-bold font-mono ${data?.microstructure_signals?.order_flow_imbalance_ofi > 0 ? 'text-forest' : 'text-status-critical'}`}>
            {data?.microstructure_signals?.order_flow_imbalance_ofi > 0 ? '+' : ''}
            {data?.microstructure_signals?.order_flow_imbalance_ofi || "+0.084"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Microstructure pressure signal</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">BOOK PRESSURE REGIME</span>
          <div className="text-2xl font-bold font-mono text-forest">
            {data?.microstructure_signals?.book_pressure || "BUY_PRESSURE"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Bid/Ask volume tilt</span>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
          <span className="text-[10px] text-text-muted font-mono block mb-1">LEVEL 1-5 BID VWAP</span>
          <div className="text-2xl font-bold font-mono text-white">
            ${data?.microstructure_signals?.top5_bid_vwap || "128.35"}
          </div>
          <span className="text-[9px] text-text-muted font-mono block mt-1">Top-5 Depth weighted avg</span>
        </div>
      </div>

      {/* L2 Order Ladder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bids */}
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-bg-border text-xs font-mono text-forest font-bold">
            <span className="flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5" /> BIDS (BUY ORDERS)</span>
            <span>SIZE / TOTAL</span>
          </div>
          <div className="space-y-1">
            {data?.bids?.map((b: any) => (
              <div key={b.level} className="flex justify-between items-center text-xs font-mono py-1 px-2 rounded bg-forest/10 hover:bg-forest/20 transition-colors">
                <span className="text-white font-bold">${b.price.toFixed(2)}</span>
                <div className="flex gap-4">
                  <span className="text-forest font-bold">{b.size.toLocaleString()}</span>
                  <span className="text-gray-400 w-16 text-right">{b.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div className="bg-bg-surface border border-bg-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-bg-border text-xs font-mono text-status-critical font-bold">
            <span className="flex items-center gap-1"><ArrowDown className="w-3.5 h-3.5" /> ASKS (SELL ORDERS)</span>
            <span>SIZE / TOTAL</span>
          </div>
          <div className="space-y-1">
            {data?.asks?.map((a: any) => (
              <div key={a.level} className="flex justify-between items-center text-xs font-mono py-1 px-2 rounded bg-status-critical/10 hover:bg-status-critical/20 transition-colors">
                <span className="text-white font-bold">${a.price.toFixed(2)}</span>
                <div className="flex gap-4">
                  <span className="text-status-critical font-bold">{a.size.toLocaleString()}</span>
                  <span className="text-gray-400 w-16 text-right">{a.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
