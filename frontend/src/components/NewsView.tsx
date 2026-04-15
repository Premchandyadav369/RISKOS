"use client";

import React, { useState, useEffect } from "react";
import { Globe2, AlertTriangle, Activity } from "lucide-react";

export function NewsView() {
  const [newsData, setNewsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/trading/news");
      if (res.ok) {
        setNewsData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase flex items-center gap-2">
                INSTITUTIONAL WIRE (NEWS) 
                {newsData?.status === "LIVE_API" && (
                  <span className="px-2 py-0.5 bg-status-warning/20 text-status-warning text-[9px] rounded-full flex items-center gap-1 animate-pulse">
                    <Activity className="w-3 h-3" /> LIVE NewsAPI
                  </span>
                )}
              </h3>
              <p className="text-xs text-text-muted">
                Real-time macroeconomic news feed with algorithmic risk impact tagging.
              </p>
            </div>
          </div>
          <button 
            onClick={fetchNews} disabled={loading}
            className="text-[10px] font-mono px-3 py-1 border border-bg-border rounded hover:bg-bg-secondary text-text-muted transition-colors"
          >
            {loading ? "FETCHING..." : "FORCE REFRESH"}
          </button>
        </div>

        <div className="space-y-3 font-mono">
          {!newsData && !loading && (
            <div className="text-center py-10 text-text-muted text-xs">Failed to fetch news feed.</div>
          )}
          
          {newsData?.news?.map((item: any) => (
            <div key={item.id} className="p-3 bg-bg-secondary rounded border border-bg-border flex items-start gap-4 group hover:border-forest/50 transition-colors">
              <div className="text-[10px] text-text-muted w-20 shrink-0 pt-1">
                {item.time}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 text-[10px]">
                  <span className="text-forest font-bold">{item.source?.toUpperCase()}</span>
                  <span className="text-text-muted">•</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    item.impact === "CRITICAL" ? "bg-status-critical/20 text-status-critical" :
                    item.impact === "HIGH" ? "bg-status-warning/20 text-status-warning" :
                    item.impact === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-status-normal/20 text-status-normal"
                  }`}>
                    {item.impact} IMPACT
                  </span>
                </div>
                <h4 className="font-bold text-sm text-text-main group-hover:text-forest transition-colors">
                  {item.headline}
                </h4>
                <div className="mt-2 text-[10px] text-text-muted flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AFFECTED:</span>
                  <span className="font-bold text-text-main">{item.affected}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
