"use client";

import React, { useState } from "react";
import { BookOpen, BrainCircuit, ShieldAlert, Cpu, Sparkles, CheckCircle2, ChevronRight, Calculator, HelpCircle } from "lucide-react";

export function QuantDocs() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState<any>(null);

  const algorithms = [
    {
      id: "hist-var",
      title: "1. Historical Value at Risk (VaR)",
      category: "core",
      math: "VaR_\\alpha = -Q_{1-\\alpha}(L)",
      institutional: "Calculates the maximum expected loss over a specific timeframe (e.g. 1-day or 10-day) at a 95% or 99% confidence level by empirically ranking actual historical returns.",
      layman: "Imagine looking at the last 1,000 trading days for your portfolio. Historical VaR line up all 1,000 daily gains and losses from best to worst. If the 10th worst day was a -$38,000 loss, then your 99% 1-day VaR is $38,000. It simple means: 'On 99 out of 100 days, you won't lose more than $38,000.'",
      keyMetrics: ["95% & 99% 1-Day VaR", "10-Day Horizon Scaling", "Empirical Quantiles"]
    },
    {
      id: "param-var",
      title: "2. Parametric & Cornish-Fisher VaR",
      category: "core",
      math: "VaR_\\alpha = z_{cf} \\sigma_p V - \\mu_p V, \\quad z_{cf} = z_\\alpha + \\frac{S}{6}(z^2-1) + \\frac{K}{24}(z^3-3z)",
      institutional: "Estimates risk using mean, volatility, skewness (S), and excess kurtosis (K) via Cornish-Fisher expansion to correct for non-Gaussian fat tails in market returns.",
      layman: "Standard formulas assume stock market returns follow a smooth bell curve. But in real life, market crashes happen much more often than a bell curve predicts ('fat tails'). Cornish-Fisher VaR adjusts the standard bell curve formula by taking asymmetry (skewness) and extreme jumpiness (kurtosis) into account.",
      keyMetrics: ["Cornish-Fisher Quantile", "Skewness & Excess Kurtosis", "Fat-Tail Adjusted VaR"]
    },
    {
      id: "mc-var",
      title: "3. Monte Carlo VaR (100,000 Scenarios)",
      category: "simulation",
      math: "L \\cdot L^T = \\Sigma, \\quad Z \\sim \\mathcal{N}(0, I), \\quad R_{sim} = \\mu + L Z",
      institutional: "Flagship simulation engine generating 100,000 correlated portfolio return vectors using Cholesky Decomposition of the Ledoit-Wolf covariance matrix across multi-day horizons.",
      layman: "Think of this as running 100,000 parallel universe simulations of tomorrow's market on a supercomputer. By randomly shocking every asset while keeping their real-world correlations intact, we see all possible outcomes—from minor gains to Black Swan market crashes.",
      keyMetrics: ["100,000 Parallel Paths", "Cholesky Correlation Structure", "1D, 5D, 10D, 30D Horizons"]
    },
    {
      id: "cvar-es",
      title: "4. Expected Shortfall (CVaR)",
      category: "core",
      math: "ES_\\alpha = E[L \\mid L > VaR_\\alpha]",
      institutional: "Measures tail risk beyond the VaR threshold. Unlike VaR which only gives a cutoff point, Expected Shortfall computes the expected average loss when a tail breach occurs.",
      layman: "If VaR says: 'There is a 1% chance you will lose more than $38,000', Expected Shortfall answers the scarier question: 'When that 1% nightmare scenario actually happens, HOW BAD will the average loss be?' (e.g. $51,900).",
      keyMetrics: ["ES 95% & ES 99%", "Tail Risk Severity", "Basel III FRTB Compliance"]
    },
    {
      id: "ewma-vol",
      title: "5. EWMA Volatility Engine",
      category: "volatility",
      math: "\\sigma_t^2 = \\lambda \\sigma_{t-1}^2 + (1-\\lambda) r_{t-1}^2",
      institutional: "Exponentially Weighted Moving Average volatility model applying exponential decay factors (λ = 0.94, 0.97, 0.99) to give higher weight to recent market shocks.",
      layman: "Standard volatility treats a market shock from 6 months ago the exact same as a crash that happened yesterday. EWMA gives recent events much more weight, allowing your risk metrics to adapt instantly when market turbulence begins.",
      keyMetrics: ["RiskMetrics λ = 0.94", "Custom Decay λ = 0.97, 0.99", "Dynamic Volatility Response"]
    },
    {
      id: "garch-vol",
      title: "6. GARCH(1,1) & GJR-GARCH Asymmetric Model",
      category: "volatility",
      math: "\\sigma_t^2 = \\omega + (\\alpha + \\gamma \\cdot I_{\\epsilon<0}) \\epsilon_{t-1}^2 + \\beta \\sigma_{t-1}^2",
      institutional: "GARCH models volatility clustering, while GJR-GARCH incorporates an asymmetric leverage parameter γ to capture the empirical reality that bad news increases volatility more than good news.",
      layman: "Volatility in finance clusters together—stormy days are followed by stormy days. GJR-GARCH captures a famous market truth: stock prices fall much faster and create far more panic than when they rise.",
      keyMetrics: ["Volatility Clustering", "Asymmetric Leverage γ", "Long-Run Mean Reversion"]
    },
    {
      id: "evt-gpd",
      title: "7. Extreme Value Theory (EVT / POT)",
      category: "research",
      math: "G_{\\xi, \\beta}(y) = 1 - \\left(1 + \\frac{\\xi y}{\\beta}\\right)^{-1/\\xi}",
      institutional: "Peaks Over Threshold (POT) approach fitting a Generalized Pareto Distribution (GPD) to losses exceeding extreme quantiles (95th/99th percentile) to quantify catastrophic tail losses.",
      layman: "Used by structural engineers to build bridges that survive 500-year floods. EVT isolates only extreme market crashes and mathematically models the absolute outer tail to answer: 'What is the loss during a 1-in-50 year crash?'",
      keyMetrics: ["GPD Tail Fitting", "99.9% Super-Tail VaR", "Black Swan Quantification"]
    },
    {
      id: "ledoit-wolf",
      title: "8. Ledoit-Wolf Covariance Shrinkage",
      category: "covariance",
      math: "\\Sigma_{shrunk} = (1-\\alpha)\\Sigma_{sample} + \\alpha F",
      institutional: "Calculates an optimal shrinkage estimator combining sample covariance with a structured target matrix to prevent matrix inversion instability when number of assets approaches observation count.",
      layman: "When calculating relationships across dozens of stocks, pure historical sample data is noisy and full of false correlations. Ledoit-Wolf 'shrinks' extreme noisy numbers toward a stable mathematical average, making portfolio optimizations 10x more reliable.",
      keyMetrics: ["Optimal Shrinkage Intensity α", "Positive Definite Guarantee", "Stable Portfolio Optimization"]
    },
    {
      id: "factor-model",
      title: "9. Multi-Factor Risk Decomposition",
      category: "factors",
      math: "R_p = \\beta_1 F_{NIFTY} + \\beta_2 F_{SP500} + \\beta_3 F_{FX} + \\beta_4 F_{Rates} + \\epsilon",
      institutional: "Decomposes portfolio risk into systematic market factors (NIFTY, S&P 500, USD/INR FX, US 10Y Rates, Tech Sector) versus stock-specific idiosyncratic risk.",
      layman: "Rather than saying 'Nvidia is risky', a factor model breaks down WHY: 31% of the risk is overall market, 24% is Tech sector momentum, 7% is Currency (USD/INR), and 4% is unique to Nvidia itself.",
      keyMetrics: ["India (NSE) & US (NYSE) Factors", "Systematic vs Idiosyncratic Risk", "Factor Beta Sensitivity"]
    },
    {
      id: "hmm-regimes",
      title: "10. Hidden Markov Model (HMM) Regimes",
      category: "regime",
      math: "P(S_t = j \\mid S_{t-1} = i), \\quad S_t \\in \\{\\text{Low Vol, Normal, High Vol, Crisis}\\}",
      institutional: "4-state Hidden Markov Model classifying market regimes from returns, volatility, drawdown, and volume. Dynamically scales risk limits based on active state probabilities.",
      layman: "Markets behave completely differently during calm bull runs versus panic crashes. HMM acts like an automated weather radar for the market, detecting whether we are currently in 'Calm', 'Normal', 'Stormy', or 'Hurricane/Crisis' mode.",
      keyMetrics: ["4 Market States", "State Transition Matrix", "Regime-Dependent Risk Scaling"]
    },
    {
      id: "copula-dep",
      title: "11. Copula Dependence (Gaussian & Student-t)",
      category: "research",
      math: "C(u_1, u_2) = \\mathbf{t}_{\\nu, R}\\left(t_\\nu^{-1}(u_1), t_\\nu^{-1}(u_2)\\right)",
      institutional: "Models non-linear and joint tail dependence between cross-border assets (India NIFTY ↔ US S&P 500) using Student-t copulas to capture simultaneous market crashes.",
      layman: "Standard correlation assumes stocks move together smoothly. A Student-t Copula models the scary phenomenon where two assets that usually act independently suddenly crash together in perfect lockstep during a global panic.",
      keyMetrics: ["Student-t Tail Dependence", "India ↔ US Joint Crash Prob", "Non-linear Dependence"]
    },
    {
      id: "greeks-stress",
      title: "12. Black-Scholes & 4D Greeks Stress Engine",
      category: "derivatives",
      math: "\\Delta = \\frac{\\partial V}{\\partial S}, \\, \\Gamma = \\frac{\\partial^2 V}{\\partial S^2}, \\, \\mathcal{V} = \\frac{\\partial V}{\\partial \\sigma}, \\, \\Theta = \\frac{\\partial V}{\\partial t}",
      institutional: "Analytical Black-Scholes pricing engine computing exact Delta, Gamma, Vega, Theta, and Rho with a 4D simultaneous shock matrix across Spot (+/-20%), Volatility (+/-50%), Rates, and Time.",
      layman: "Options risk isn't just about price. Delta tracks price sensitivity, Gamma tracks how fast Delta changes, Vega tracks sensitivity to market panic (volatility), and Theta tracks time decay.",
      keyMetrics: ["Black-Scholes Closed Form", "Delta, Gamma, Vega, Theta, Rho", "4D Stress Matrix"]
    },
    {
      id: "cvar-opt",
      title: "13. Minimum CVaR Portfolio Optimizer",
      category: "optimization",
      math: "\\min_{w} \\text{CVaR}_\\alpha(w) \\quad \\text{s.t.} \\quad \\sum w_i = 1, \\, w_{i} \\ge 0, \\, w^T \\mu \\ge R_{target}",
      institutional: "Linear programming formulation minimizing Expected Shortfall directly subject to position limits, sector constraints, and India/US geographic allocation bounds.",
      layman: "Standard portfolio tools try to minimize simple variance (upside + downside). Minimum CVaR optimization specifically targets and shrinks ONLY the worst-case catastrophic loss potential.",
      keyMetrics: ["Linear Programming (LP)", "India/US Allocation Bounds", "Tail Risk Reduction"]
    },
    {
      id: "black-litterman",
      title: "14. Black-Litterman Portfolio Model",
      category: "optimization",
      math: "E[R] = \\left[(\\tau \\Sigma)^{-1} + P^T \\Omega^{-1} P\\right]^{-1} \\left[(\\tau \\Sigma)^{-1} \\Pi + P^T \\Omega^{-1} Q\\right]",
      institutional: "Combines reverse-engineered market equilibrium returns (CAPM) with subjective quantitative investor views and confidence levels to create stable, non-extreme optimal weights.",
      layman: "Instead of relying blindly on historical returns, Black-Litterman starts with the global market benchmark consensus, then gently adjusts allocations based on your quantitative views (e.g. 'Nifty IT will beat S&P Tech by 3%').",
      keyMetrics: ["Market Equilibrium Implied Returns", "Investor Views & Confidence Matrix", "Stable Asset Allocation"]
    },
    {
      id: "risk-attrib",
      title: "15. Risk Attribution (Component & Marginal VaR)",
      category: "attribution",
      math: "\\text{Marginal VaR}_i = \\frac{\\partial \\text{VaR}_p}{\\partial w_i}, \\quad \\text{Component VaR}_i = w_i \\cdot \\text{Marginal VaR}_i",
      institutional: "Decomposes portfolio VaR into Standalone VaR, Marginal VaR, Component VaR ($), and Percentage Risk Contribution (%) to identify true risk drivers.",
      layman: "Tells you exactly which stock is responsible for your portfolio risk. Even if a stock is only 10% of your money, Component VaR might reveal it is causing 40% of your total dollar risk due to high correlation.",
      keyMetrics: ["Standalone vs Component VaR", "Marginal Risk Contribution", "Position Risk Concentration"]
    },
    {
      id: "var-backtest",
      title: "16. VaR Model Backtesting (Kupiec & Christoffersen)",
      category: "validation",
      math: "LR_{POF} = -2 \\ln \\left[ \\frac{(1-p)^{N-x} p^x}{(1-\\frac{x}{N})^{N-x} (\\frac{x}{N})^x} \\right]",
      institutional: "Statistically validates VaR accuracy by checking breach frequency (Kupiec POF test) and breach independence (Christoffersen test) to ensure zero risk underestimation.",
      layman: "How do you know if your risk model is actually working? You test it against past data! If your 99% VaR model gets breached 25 times in 100 days instead of 1 time, Kupiec Backtesting immediately flags the model as FAILED.",
      keyMetrics: ["Kupiec Proportion of Failures", "Christoffersen Independence Test", "Model Pass/Fail Rating"]
    },
    {
      id: "reverse-stress",
      title: "17. Reverse Stress Testing Engine",
      category: "research",
      math: "\\min \\| \\Delta S \\|_{\\Sigma^{-1}} \\quad \\text{s.t.} \\quad f(\\Delta S, w) = -0.25 \\cdot V_{port}",
      institutional: "Inverts standard stress testing by solving an optimization problem to find the exact minimum plausible macroeconomic shock required to cause a predetermined target loss (e.g. -25%).",
      layman: "Instead of asking 'What if Nifty falls 10%?', Reverse Stress Testing asks: 'What exact combination of stock crashes, rate hikes, and currency surges would cause our fund to lose $25 Million?'",
      keyMetrics: ["Target Loss Search (-25%)", "Plausible Shock Vector", "Vulnerability Discovery"]
    },
    {
      id: "k2-agentic",
      title: "18. K2-V2 Agentic Reasoning Integration",
      category: "agentic",
      math: "\\text{Reasoning Chain: Numerical Evidence} \\rightarrow \\text{Causal Graph} \\rightarrow \\text{Mitigation Plan}",
      institutional: "Orchestrates autonomous multi-agent root cause analysis when risk limits or backtests trigger warnings, synthesizing quantitative outputs into clear executive action steps.",
      layman: "K2-V2 is your AI Chief Risk Officer. It doesn't calculate numbers itself (Python math handles that), but it analyzes all calculations, figures out WHY risk increased, and writes actionable mitigation steps.",
      keyMetrics: ["K2 Think V2 Reasoning Chain", "Multi-Agent Root Cause", "Automated Action Plans"]
    }
  ];

  const filteredAlgos = algorithms.filter((algo) => {
    const matchCategory = activeCategory === "all" || algo.category === activeCategory;
    const matchSearch = algo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        algo.layman.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        algo.institutional.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 font-sans text-text-main max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="bg-bg-surface border border-bg-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-forest/10 via-forest/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-lg bg-forest/20 text-forest border border-forest/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              QUANTITATIVE METHODOLOGY & LAYMAN'S GUIDE
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Comprehensive mathematical formulations, institutional quantitative applications, and plain-English explanations for all 18 core RISKOS algorithms.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-bg-border">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {[
              { id: "all", label: "All Algorithms (18)" },
              { id: "core", label: "Core Risk & VaR" },
              { id: "volatility", label: "Volatility Models" },
              { id: "simulation", label: "Monte Carlo" },
              { id: "optimization", label: "Optimization" },
              { id: "research", label: "Advanced Research" },
              { id: "validation", label: "Backtesting" },
              { id: "agentic", label: "Agentic AI" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "bg-forest text-white font-bold shadow-sm"
                    : "bg-bg-secondary text-text-muted hover:text-text-main border border-bg-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search algorithms or layman terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-bg-secondary border border-bg-border rounded-md px-3 py-1.5 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-forest w-64 font-mono"
          />
        </div>
      </div>

      {/* Algorithm Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAlgos.map((algo) => (
          <div 
            key={algo.id}
            className="bg-bg-surface border border-bg-border rounded-xl p-5 flex flex-col justify-between hover:border-forest/50 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-white font-mono group-hover:text-forest transition-colors">
                  {algo.title}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-bg-secondary text-forest font-semibold border border-forest/20 shrink-0">
                  {algo.category}
                </span>
              </div>

              {/* Mathematical Formulation */}
              <div className="bg-black/60 border border-bg-border rounded-md p-2.5 font-mono text-[11px] text-forest-light tracking-wide overflow-x-auto">
                <span className="text-gray-500 text-[9px] block mb-1">FORMULATION:</span>
                <code>{algo.math}</code>
              </div>

              {/* Institutional Description */}
              <div className="text-xs text-text-main leading-relaxed">
                <span className="font-semibold text-white block mb-0.5 text-[11px] font-mono flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-blue-400" /> INSTITUTIONAL APPLICATION:
                </span>
                <p className="text-text-muted text-[11px]">{algo.institutional}</p>
              </div>

              {/* Layman's Terms (Plain English) */}
              <div className="bg-forest-light/10 border border-forest/20 rounded-md p-3 text-xs leading-relaxed">
                <span className="font-semibold text-forest block mb-1 text-[11px] font-mono flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-forest" /> IN PLAIN ENGLISH (LAYMAN'S TERMS):
                </span>
                <p className="text-gray-300 text-[11px] italic">{algo.layman}</p>
              </div>
            </div>

            {/* Key Metrics Badges */}
            <div className="mt-4 pt-3 border-t border-bg-border/60 flex flex-wrap gap-1.5">
              {algo.keyMetrics.map((m, i) => (
                <span key={i} className="text-[9px] font-mono bg-bg-secondary text-text-muted px-2 py-0.5 rounded border border-bg-border flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-forest" />
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
