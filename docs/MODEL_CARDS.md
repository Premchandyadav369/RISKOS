# RISKOS Consolidated Quantitative Model Cards Directory

**Standard**: Institutional Model Risk Management (SR 11-7 / OCC 2011-12 Compliance)  
**Status**: ACTIVE PRODUCTION AUDIT CATALOG  
**Models Documented**: 16 Institutional Quantitative & Machine Learning Models  

This document serves as the master directory and executive synthesis of the 16 detailed institutional model cards located in `docs/models/`.

---

## Model Inventory & Architectural Classification

| Model Name | Architectural Family | Primary Purpose | File Location | Key Mathematical Core |
| :--- | :--- | :--- | :--- | :--- |
| **1. Gaussian HMM** | Hidden Markov Models | Regime Detection (Bull/Bear/Sideways) | `docs/models/hmm_regime_switching.md` | Baum-Welch EM, Viterbi decoding, 3-state transition matrix |
| **2. TimesFM 3.0** | Deep Foundation Transformer | Zero-Shot Multi-Horizon Time-Series | `docs/models/timesfm_30.md` | Patch-tokenized causal transformer, quantile prediction heads |
| **3. Meta Prophet** | Generalized Additive Model | Trend & Seasonality Decomposition | `docs/models/meta_prophet.md` | $y(t) = g(t) + s(t) + h(t) + \epsilon_t$, Fourier seasonality |
| **4. Merton Jump-Diffusion** | Stochastic Jump Processes | Tail Risk & Crash Simulation | `docs/models/merton_jump_diffusion.md` | Compound Poisson jump process, log-normal jump magnitudes |
| **5. Ledoit-Wolf Shrinkage** | Regularized Covariance | High-Dimensional Covariance Estimation | `docs/models/garch_volatility.md` | Linear shrinkage $\Sigma_{\text{LW}} = (1-\delta) S + \delta F$ toward target |
| **6. GARCH(1,1) Volatility** | Conditional Heteroskedasticity | Volatility Clustering & Forecasting | `docs/models/garch_volatility.md` | $\sigma_t^2 = \omega + \alpha \epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$, stationarity $\alpha+\beta < 1$ |
| **7. CVaR Linear Programming** | Convex Optimization | Tail-Risk Constrained Portfolio | `docs/models/cvar_linear_programming.md` | Rockafellar-Uryasev (2000) auxiliary variable LP formulation |
| **8. Black-Litterman** | Bayesian Asset Allocation | Blending Market Equilibrium with Views | `docs/models/black_litterman.md` | Posterior returns $E[R] = [(\tau \Sigma)^{-1} + P^T \Omega^{-1} P]^{-1} [\dots]$ |
| **9. Hierarchical Risk Parity** | Machine Learning Tree Clustering | Robust Diversification Without Inversion | `docs/models/hierarchical_risk_parity.md` | Single-linkage clustering, quasi-diag, recursive bisection |
| **10. Almgren-Chriss Execution** | Calculus of Variations | Optimal Multi-Period Order Slicing | `docs/models/almgren_chriss_execution.md` | Euler-Lagrange optimization of expected cost vs variance |
| **11. Hawkes Point Process** | Self-Exciting Point Process | High-Frequency Order Flow Cascades | `docs/models/hawkes_process.md` | $\lambda(t) = \mu + \sum \alpha e^{-\beta(t-t_i)}$, branching ratio $\eta = \alpha/\beta$ |
| **12. Solvency II EVT** | Extreme Value Theory | 99.5% 1-in-200 Year Capital Requirement | `docs/models/solvency_ii_evt.md` | Generalized Pareto Distribution (GPD) peaks-over-threshold |
| **13. Redington Immunization** | Actuarial Asset-Liability Matching | Interest Rate Shock Immunization | `docs/models/alm_immunization.md` | Second-order Taylor series balance matching ($D_A = D_L, C_A > C_L$) |
| **14. CLO Tranche Waterfall** | Structured Credit Cash Flow | Priority of Payments & Loss Tranching | `docs/models/clo_waterfall.md` | Cash flow waterfall, subordination buffers, first-loss equity |
| **15. Option-Adjusted Spread** | Binomial Short-Rate Trees | Embedded Option Valuation & Credit Spread | `docs/models/option_adjusted_spread.md` | Backward induction tree calibration stripping borrower call cost |
| **16. Multi-Horizon Ensemble** | Quantile Consensus Forecaster | Daily High-Conviction Alpha Recommender | `docs/models/forecasting_ensemble.md` | Empirical inverse-error weighted ensemble across TimesFM/Prophet/Merton |

---

## Governance & Model Validation Standard

In compliance with **Federal Reserve SR 11-7** guidelines, all models in RISKOS undergo:
1. **Conceptual Soundness Review**: Validation of underlying mathematical theory and assumptions.
2. **Ongoing Performance Monitoring**: Real-time tracking of tracking errors, hit rates, and exception counts.
3. **Outcomes Analysis**: Regular backtesting against historical stress regimes and statistical benchmarking against naive baselines.
