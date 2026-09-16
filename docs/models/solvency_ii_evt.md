# Model Card: Solvency II Extreme Value Theory (EVT) & Peak-Over-Threshold

## 1. Model Overview
Implements Solvency II regulatory capital requirements for insurance and reinsurance solvency capital (SCR), calibrating 99.5% 1-year Value-at-Risk using Extreme Value Theory (Pickands-Balkema-de Haan Theorem).

## 2. Mathematical Formulation
For losses $X$ exceeding a high threshold $u$, the excess distribution $F_u(y) = P(X - u \le y \mid X > u)$ converges to the Generalized Pareto Distribution (GPD):
$$G_{\xi, \beta}(y) = 1 - \left(1 + \frac{\xi y}{\beta}\right)^{-1/\xi}, \quad \xi \ne 0$$

The unconditional 99.5% EVT Value-at-Risk is:
$$\text{VaR}_{\alpha}(X) = u + \frac{\beta}{\xi} \left[ \left(\frac{N}{N_u} (1 - \alpha)\right)^{-\xi} - 1 \right]$$

The Conditional Value-at-Risk (Expected Shortfall) is:
$$\text{CVaR}_{\alpha}(X) = \frac{\text{VaR}_{\alpha}(X) + \beta - \xi u}{1 - \xi}$$

## 3. Regulatory Standards
- **Standard**: Solvency II Directive (2009/138/EC) Article 101.
- **Confidence Level**: 99.5% over 1-year horizon (or 1-day scaled by $\sqrt{252}$).

## 4. Academic References
- McNeil, A. J., Frey, R., & Embrechts, P. (2015). *Quantitative Risk Management: Concepts, Techniques and Tools*. Princeton University Press.