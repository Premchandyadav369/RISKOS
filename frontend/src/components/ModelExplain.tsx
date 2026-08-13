"use client";

import React, { useState, useEffect } from "react";
import { BrainCircuit, Activity } from "lucide-react";

export function ModelExplain() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/ml/explain")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {
        setData({
          target_metric: "Counterparty Credit Default Probability",
          predicted_value: 3.84,
          base_value: 1.50,
          shap_values: [
            { feature: "Operating Margin Trend", impact: 0.95 },
            { feature: "Debt-to-Equity Ratio", impact: 0.82 },
            { feature: "Macro Regime Volatility", impact: 0.65 },
            { feature: "Cash Flow Coverage", impact: -0.15 },
            { feature: "Sector Default Rate", impact: 0.07 }
          ],
          model_confidence_pct: 88.5
        });
      });
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-bg-border pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-forest-light text-forest">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
                EXPLAINABLE AI (XAI) MODEL INSPECTOR
              </h3>
              <p className="text-xs text-text-muted">
                SHAP (SHapley Additive exPlanations) value attribution for Machine Learning predictions.
              </p>
            </div>
          </div>
        </div>

        {data && (
          <div className="space-y-6 font-mono text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-bg-secondary rounded border border-bg-border col-span-2">
                <span className="text-[10px] text-text-muted">TARGET ML MODEL</span>
                <div className="font-bold text-lg text-text-main mt-1">
                  {data.target_metric}
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">PREDICTED VALUE</span>
                <div className="font-bold text-xl text-status-warning mt-1">
                  {data.predicted_value}
                </div>
              </div>

              <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                <span className="text-[10px] text-text-muted">MODEL CONFIDENCE</span>
                <div className="font-bold text-xl text-forest mt-1">
                  {data.model_confidence_pct}%
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-text-muted text-[10px] mb-3 uppercase">FEATURE IMPACT (SHAP VALUES)</h4>
              <div className="space-y-3">
                {data.shap_values?.map((feature: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-48 text-right font-semibold text-text-main truncate">
                      {feature.feature}
                    </div>
                    <div className="flex-1 bg-bg-secondary h-6 rounded flex items-center relative overflow-hidden border border-bg-border">
                      {/* Midline */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-text-muted/30 z-10"></div>
                      
                      {/* Bar */}
                      {feature.impact > 0 ? (
                        <div 
                          className="absolute left-1/2 h-full bg-status-warning/80 border-l border-status-warning" 
                          style={{ width: `${Math.min(Math.abs(feature.impact) * 40, 50)}%` }} 
                        />
                      ) : (
                        <div 
                          className="absolute right-1/2 h-full bg-forest/80 border-r border-forest" 
                          style={{ width: `${Math.min(Math.abs(feature.impact) * 40, 50)}%` }} 
                        />
                      )}
                    </div>
                    <div className={`w-16 text-right font-bold ${feature.impact > 0 ? 'text-status-warning' : 'text-forest'}`}>
                      {feature.impact > 0 ? '+' : ''}{feature.impact.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-text-muted mt-2 pt-2 border-t border-bg-border px-48">
                <span>Decreases Risk</span>
                <span>Base Value ({data.base_value})</span>
                <span>Increases Risk</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
