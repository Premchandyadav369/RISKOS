"use client";

import React, { useState } from "react";
import { X, BrainCircuit, CheckCircle2, AlertOctagon, Clock, ArrowUpRight, ShieldAlert } from "lucide-react";
import { triggerAgentInvestigation } from "@/lib/api";

interface InvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: string;
  caseId?: string;
}

export function InvestigationModal({ isOpen, onClose, metric, caseId = "RIS-2026-0812-042" }: InvestigationModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      triggerAgentInvestigation(caseId, metric).then((res) => {
        setData(res);
        setLoading(false);
      });
    }
  }, [isOpen, metric, caseId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-bg-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-text-main font-sans">
        
        {/* Header */}
        <div className="p-4 border-b border-bg-border bg-bg-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm font-mono tracking-tight">
                  K2-V2 RISK INVESTIGATION
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-bg-surface border border-bg-border text-text-muted rounded">
                  {caseId}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Target Metric: <strong className="text-text-main">{metric}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-bg-border rounded text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <BrainCircuit className="w-8 h-8 mx-auto text-forest animate-pulse" />
              <p className="font-mono text-xs text-text-muted">
                K2 Think V2 multi-agent reasoning engine synthesizing quant findings...
              </p>
            </div>
          ) : data ? (
            <>
              {/* Trigger Alert Box */}
              <div className="p-3 bg-forest-light/60 border border-forest/30 rounded flex items-start gap-3 text-forest">
                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold font-mono text-[11px] uppercase tracking-wide">
                    AUTOMATED TRIGGER DETECTED
                  </div>
                  <p className="text-xs text-forest-dark font-medium mt-0.5">
                    {data.trigger}
                  </p>
                </div>
              </div>

              {/* Quantitative Decomposition Cards */}
              <div>
                <h4 className="font-bold font-mono text-xs uppercase text-text-muted mb-2">
                  QUANTITATIVE FACTOR DECOMPOSITION
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                    <span className="text-[10px] text-text-muted font-mono">VOLATILITY SHOCK</span>
                    <div className="font-mono font-bold text-sm text-status-critical mt-1">
                      +{data.quant_findings.volatility_increase_pct}%
                    </div>
                  </div>
                  <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                    <span className="text-[10px] text-text-muted font-mono">CONCENTRATION</span>
                    <div className="font-mono font-bold text-sm text-status-warning mt-1">
                      +{data.quant_findings.concentration_impact_pct}%
                    </div>
                  </div>
                  <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                    <span className="text-[10px] text-text-muted font-mono">CORRELATION SPIKE</span>
                    <div className="font-mono font-bold text-sm text-status-warning mt-1">
                      +{data.quant_findings.correlation_impact_pct}%
                    </div>
                  </div>
                  <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                    <span className="text-[10px] text-text-muted font-mono">USD/INR FX IMPACT</span>
                    <div className="font-mono font-bold text-sm text-forest mt-1">
                      +{data.quant_findings.fx_exposure_impact_pct}%
                    </div>
                  </div>
                </div>
              </div>

              {/* K2 Reasoning Synthesized Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold font-mono text-xs uppercase text-text-muted">
                    K2-V2 REASONING & ROOT CAUSE ANALYSIS
                  </h4>
                  <span className="text-[10px] font-mono text-forest font-semibold">
                    CONFIDENCE: {data.confidence_score_pct}%
                  </span>
                </div>
                <div className="p-4 bg-bg-secondary border border-bg-border rounded font-mono text-xs text-text-main whitespace-pre-wrap leading-relaxed">
                  {data.k2_analysis}
                </div>
              </div>

              {/* Step-by-step Investigation Timeline */}
              <div>
                <h4 className="font-bold font-mono text-xs uppercase text-text-muted mb-2">
                  MULTI-AGENT EXECUTION TIMELINE
                </h4>
                <div className="space-y-2 border-l-2 border-bg-border pl-3 ml-1">
                  {data.timeline.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="font-mono text-[10px] text-text-light whitespace-nowrap">
                        {item.timestamp}
                      </span>
                      <span className="text-text-main font-medium">{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="font-bold font-mono text-xs uppercase text-text-muted mb-2">
                  RECOMMENDED REVIEW & RISK MITIGATION
                </h4>
                <div className="space-y-1.5">
                  {data.recommended_actions.map((act: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-bg-secondary rounded border border-bg-border">
                      <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                      <span className="font-mono text-xs text-text-main font-medium">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-bg-border bg-bg-secondary flex items-center justify-between">
          <span className="text-[11px] font-mono text-text-muted">
            HUMAN-IN-THE-LOOP APPROVAL REQUIRED FOR POSITION CHANGES
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-bg-border bg-bg-surface hover:bg-bg-secondary font-mono text-xs font-semibold text-text-main transition-colors"
            >
              CLOSE
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-forest hover:bg-forest-dark text-white font-mono text-xs font-semibold transition-colors"
            >
              APPROVE ACTIONS
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
