# Model Card: Collateralized Loan Obligation (CLO) Tranche Waterfall Simulator

## 1. Model Overview
Simulates structured finance cash flow distribution across structured tranches (Senior AAA, Mezzanine AA/A/BBB, Junior BB, Equity) under stochastic loan default, recovery, and correlation models.

## 2. Mathematical Formulation
Portfolio of $N$ leveraged loans subject to Gaussian copula defaults:
$$X_i = \sqrt{\rho} Z + \sqrt{1 - \rho} \epsilon_i$$
Default occurs if $X_i < \Phi^{-1}(PD_i)$. Upon default, recovery $R_i \sim \text{Beta}(\alpha_R, \beta_R)$.

Cash flows are routed according to strict seniority:
1. Senior administrative fees and collateral manager base fees.
2. Class A / AAA interest and principal amortization.
3. Class B / Mezzanine interest subject to Overcollateralization (OC) and Interest Coverage (IC) test gates.
4. Excess spread diverted to cure failed OC/IC tests or distributed to Equity tranche.

## 3. Metrics Evaluated
- Tranche Expected Loss (EL) and Loss Given Default (LGD).
- Weighted Average Life (WAL).
- Subordination and Break-even Default Rates (CDR).

## 4. Academic References
- Duffie, D., & Garleanu, N. (2001). Risk and valuation of collateralized debt obligations. *Financial Analysts Journal*, 57(1), 41-59.