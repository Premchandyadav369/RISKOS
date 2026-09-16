# Model Card: SABR Stochastic Volatility Model

## 1. Model Overview
The SABR (Stochastic Alpha Beta Rho) model (Hagan et al., 2002) is an industry-standard benchmark for fitting the implied volatility smile and skew across strikes and maturities.

## 2. Mathematical Formulation
$$dF_t = \alpha_t F_t^\beta dW_t^{(1)}$$
$$d\alpha_t = \nu \alpha_t dW_t^{(2)}$$
$$d\langle W^{(1)}, W^{(2)} \rangle_t = \rho dt$$

Hagan asymptotic implied volatility approximation $\sigma_{\text{implied}}(K, F)$:
$$\sigma(K) \approx \frac{\alpha}{(F K)^{(1-\beta)/2} \left[ 1 + \frac{(1-\beta)^2}{24} \ln^2(F/K) + \dots \right]} \cdot \left( \frac{z}{x(z)} \right) \cdot \left[ 1 + \left( \frac{(1-\beta)^2}{24} \frac{\alpha^2}{(FK)^{1-\beta}} + \frac{\rho \beta \nu \alpha}{4 (FK)^{(1-\beta)/2}} + \frac{2-3\rho^2}{24} \nu^2 \right) T \right]$$

## 3. Academic References
- Hagan, P. S., Kumar, D., Lesniewski, A. S., & Woodward, D. E. (2002). Managing Smile Risk. *Wilmott Magazine*, 1, 84-108.
