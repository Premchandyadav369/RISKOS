"use client";

import React from "react";
import { BookOpen, Calculator, BrainCircuit, Activity } from "lucide-react";

export function Methodology() {
  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none overflow-y-auto">
      <div className="bg-bg-surface border border-bg-border rounded-lg p-5">
        <div className="flex items-center gap-3 border-b border-bg-border pb-3 mb-6">
          <div className="p-2 rounded bg-forest-light text-forest">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mono tracking-tight uppercase">
              RISKOS QUANTITATIVE ARCHITECTURE & METHODOLOGY (METH)
            </h3>
            <p className="text-xs text-text-muted">
              Technical whitepaper detailing mathematical models, machine learning algorithms, and agentic AI.
            </p>
          </div>
        </div>

        <div className="space-y-8 font-mono text-xs text-text-muted leading-relaxed">
          
          <section>
            <h4 className="font-bold text-text-main text-sm flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-forest" /> 1. Quantitative Risk Models
            </h4>
            <div className="pl-6 space-y-4">
              <p>
                <strong className="text-text-main">Value at Risk (VaR) & Expected Shortfall (CVaR):</strong> 
                RISKOS calculates 95% and 99% VaR using Historical, Parametric (Variance-Covariance), and Monte Carlo (Geometric Brownian Motion) simulations. 
                Expected Shortfall (CVaR) quantifies the tail risk beyond the VaR threshold.
              </p>
              <p>
                <strong className="text-text-main">Black-Scholes Options Pricing:</strong> 
                European options are priced using the Black-Scholes-Merton differential equation. 
                Full Greeks (Delta, Gamma, Vega, Theta, Rho) are computed via closed-form partial derivatives.
              </p>
              <p>
                <strong className="text-text-main">Systemic Delta-CoVaR:</strong> 
                Measures the financial distress spillover. Delta-CoVaR quantifies the change in VaR of the financial system conditional on a specific institution (e.g., JPM or NVDA) being under distress.
              </p>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-text-main text-sm flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-forest" /> 2. Algorithmic Trading & Pre-Trade Execution
            </h4>
            <div className="pl-6 space-y-4">
              <p>
                <strong className="text-text-main">Statistical Arbitrage (Pairs Trading):</strong> 
                Identifies cointegrated asset pairs across US and Indian markets (e.g., NVDA vs TCS). Trades the mean-reverting Z-score spread.
              </p>
              <p>
                <strong className="text-text-main">Almgren-Chriss Market Impact Model:</strong> 
                Pre-trade execution costs are simulated using the Almgren-Chriss framework. 
                Optimal TWAP (Time-Weighted) and VWAP (Volume-Weighted) schedules are generated to minimize slippage.
              </p>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-text-main text-sm flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-forest" /> 3. Machine Learning & Explainable AI (XAI)
            </h4>
            <div className="pl-6 space-y-4">
              <p>
                <strong className="text-text-main">Anomaly & Regime Detection:</strong> 
                Unsupervised Isolation Forests detect anomalous market micro-structure prints. 
                Gaussian Mixture Models (GMM) cluster historical returns to identify latent market regimes (Normal, High Vol, Crisis).
              </p>
              <p>
                <strong className="text-text-main">SHAP Value Explainability:</strong> 
                Complex ML predictions (e.g., Credit Default Probability via XGBoost) are deconstructed using SHAP (SHapley Additive exPlanations) 
                to quantify the exact basis-point contribution of each feature (e.g., Debt-to-Equity, Cash Flow) to the final prediction.
              </p>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-text-main text-sm flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-forest" /> 4. K2-V2 Agentic Reasoning
            </h4>
            <div className="pl-6 space-y-4">
              <p>
                <strong className="text-text-main">Orchestrated AI Investigation:</strong> 
                When a risk limit is breached or a trade executes, RISKOS triggers a multi-agent investigation pipeline powered by 
                the <strong className="text-forest">K2 Think V2</strong> (MBZUAI-IFM/K2-Think-v2) reasoning model via api.k2think.ai.
              </p>
              <p>
                Agents cross-reference quantitative engine outputs, market news wires, and macroeconomic data to synthesize root-cause explanations 
                and generate actionable risk mitigation strategies (e.g., delta hedging, liquidity buffer increases).
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
