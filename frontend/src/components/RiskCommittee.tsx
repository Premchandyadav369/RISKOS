"use client";

import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, MessageSquare, ShieldCheck, FileText, Vote, Sparkles } from "lucide-react";

export function RiskCommittee() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSession = () => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/committee/session")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-bg-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-forest" />
            AUTONOMOUS RISK COMMITTEE & MULTI-AGENT DEBATE
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Real-time simulated institutional risk deliberation featuring 4 specialized AI Agent Personas.
          </p>
        </div>
        <button
          onClick={fetchSession}
          disabled={loading}
          className="bg-forest hover:bg-forest-dark text-white px-4 py-2 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loading ? "DELIBERATING..." : "CONVENE COMMITTEE"}
        </button>
      </div>

      {/* Meta Info Card */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-text-muted">SESSION ID:</span> <span className="text-white font-bold">{data?.session_meta?.session_id || "COMM-2026-Q3-841"}</span>
        </div>
        <div>
          <span className="text-text-muted">TOPIC:</span> <span className="text-forest font-bold">{data?.session_meta?.topic || "Cross-Asset Tech Volatility"}</span>
        </div>
        <div className="bg-forest/20 text-forest px-2.5 py-0.5 rounded border border-forest/30 font-bold">
          {data?.session_meta?.quorum || "4/4 QUORUM ACHIEVED"}
        </div>
      </div>

      {/* Transcript Chat Cards */}
      <div className="space-y-4">
        {data?.transcript?.map((entry: any, i: number) => (
          <div key={i} className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-2 hover:border-forest/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.avatar_color }}
                />
                <span className="font-bold text-sm text-white font-mono">{entry.speaker}</span>
                <span className="text-[10px] text-text-muted font-mono bg-bg-secondary px-2 py-0.5 rounded border border-bg-border">
                  {entry.role}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed pl-5.5 border-l-2 border-bg-border">
              "{entry.argument}"
            </p>
            <div className="pl-5.5 pt-1 text-[11px] font-mono text-forest flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5 text-forest" />
              <span className="font-bold">PROPOSED ACTION:</span> {entry.proposed_action}
            </div>
          </div>
        ))}
      </div>

      {/* Adopted Resolutions & Summary */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
          <FileText className="w-4 h-4 text-forest" />
          OFFICIAL COMMITTEE RESOLUTIONS & EXECUTIVE MINUTES
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          {data?.executive_summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {data?.adopted_resolutions?.map((res: any, i: number) => (
            <div key={i} className="bg-bg-secondary p-3.5 rounded-lg border border-bg-border space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-blue-400 font-bold">{res.id}</span>
                <span className="text-forest bg-forest/20 px-2 py-0.5 rounded font-bold">{res.status} ({res.votes_for}-{res.votes_against})</span>
              </div>
              <p className="text-xs text-white font-mono">{res.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
