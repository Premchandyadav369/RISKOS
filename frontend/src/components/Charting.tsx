"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { LineChart as ChartIcon, BarChart2 } from "lucide-react";

// Generate realistic synthetic OHLCV data
function generateData() {
  const data = [];
  let time = new Date(2023, 0, 1).getTime();
  let close = 4000;
  
  for (let i = 0; i < 400; i++) {
    const volatility = 40;
    const open = close + (Math.random() - 0.5) * 10;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    close = open + (Math.random() - 0.5) * volatility * 2;
    
    // Simple volume
    const volume = Math.floor(Math.random() * 10000) + 5000;
    // Color volume based on close vs open
    const color = close >= open ? '#16a34a80' : '#dc262680'; // forest/red with opacity

    const dateStr = new Date(time).toISOString().split('T')[0];
    
    data.push({
      time: dateStr as unknown as Time,
      open,
      high,
      low,
      close,
      value: volume, // for volume series
      color
    });
    
    time += 24 * 60 * 60 * 1000; // +1 day
  }
  return data;
}

export function Charting() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const [symbol, setSymbol] = useState("SPX500");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', // text-muted
      },
      grid: {
        vertLines: { color: '#374151' }, // bg-border
        horzLines: { color: '#374151' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      crosshair: {
        mode: 0, // Normal mode
      }
    });
    
    chartRef.current = chart;

    // Candlestick Series
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: '#16a34a', // forest
      downColor: '#dc2626', // red
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });

    // Volume Series (Histogram)
    const volumeSeries = (chart as any).addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay on the main chart
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // Push volume to the bottom 20%
        bottom: 0,
      },
    });

    const rawData = generateData();
    
    // Split data for series
    const candleData = rawData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
    const volData = rawData.map(d => ({ time: d.time, value: d.value, color: d.color }));

    candlestickSeries.setData(candleData);
    volumeSeries.setData(volData);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]); // Re-render if symbol changes

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5 flex flex-col h-[650px]">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <ChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase flex items-center gap-2">
                ADVANCED CHARTING (CHRT)
              </h3>
              <p className="text-xs text-text-muted">
                Institutional-grade candlestick and volume visualization.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <button onClick={() => setSymbol("SPX500")} className={`px-3 py-1 rounded border transition-colors ${symbol === "SPX500" ? 'bg-forest text-white border-forest' : 'border-bg-border text-text-muted hover:text-white'}`}>SPX</button>
            <button onClick={() => setSymbol("NVDA")} className={`px-3 py-1 rounded border transition-colors ${symbol === "NVDA" ? 'bg-forest text-white border-forest' : 'border-bg-border text-text-muted hover:text-white'}`}>NVDA</button>
            <button onClick={() => setSymbol("USDINR")} className={`px-3 py-1 rounded border transition-colors ${symbol === "USDINR" ? 'bg-forest text-white border-forest' : 'border-bg-border text-text-muted hover:text-white'}`}>USDINR</button>
          </div>
        </div>

        <div className="flex-1 relative w-full border border-bg-border/50 rounded overflow-hidden" ref={chartContainerRef}>
          {/* Chart rendered here */}
        </div>
      </div>
    </div>
  );
}
