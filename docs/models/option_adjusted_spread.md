# Model Card: Option-Adjusted Spread (OAS) & Monte Carlo Rates Lattice

## 1. Model Overview
The Option-Adjusted Spread (OAS) quantifies the credit and liquidity spread of fixed-income instruments with embedded options (callable/puttable bonds, mortgage-backed securities) over the risk-free benchmark curve, net of option optionality.

## 2. Mathematical Formulation
Let $P_0$ be the observed market price of the bond with cash flows $C(t, \omega)$ across Monte Carlo interest rate paths $\omega \in \Omega$.
The OAS is the constant spread $s$ solving:
$$P_0 = \frac{1}{M} \sum_{m=1}^M \sum_{t=1}^T \frac{C(t, \omega_m)}{\prod_{k=1}^t \left(1 + r_k(\omega_m) + s\right)}$$

Where short rates $r_k(\omega_m)$ are simulated under the risk-neutral measure using the Hull-White / Black-Karasinski 1-factor model:
$$dr_t = [\theta(t) - a r_t] dt + \sigma dW_t$$

## 3. Key Outputs
- **OAS (bps)**: True credit risk spread after stripping embedded option value.
- **Option Value (bps)**: $\text{Spread}_{\text{Nominal}} - \text{OAS}$.
- **Effective Duration & Convexity**: Computed via central finite difference shock $\Delta y = \pm 25\text{ bps}$.

## 4. Academic References
- Hull, J., & White, A. (1990). Pricing interest-rate-derivative securities. *The Review of Financial Studies*, 3(4), 573-592.