# Model Card: Asset-Liability Management (ALM) Redington Immunization

## 1. Model Overview
Asset-Liability Management (ALM) framework for institutional pension funds, insurance balance sheets, and bank treasuries to protect surplus against interest rate curve movements using Redington Immunization.

## 2. Mathematical Formulation
Let $V_A(y)$ and $V_L(y)$ be the present values of assets and liabilities under yield $y$.
Redington (1952) immunization conditions:
1. **Present Value Equality / Surplus**:
   $$V_A(y) \ge V_L(y)$$
2. **Macaulay / Modified Duration Match**:
   $$D_A = D_L \implies \frac{d V_A}{dy} = \frac{d V_L}{dy}$$
3. **Convexity Dominance**:
   $$C_A > C_L \implies \frac{d^2 V_A}{dy^2} > \frac{d^2 V_L}{dy^2}$$

Second-order surplus expansion:
$$\Delta S = (V_A - V_L) - (D_A V_A - D_L V_L) \Delta y + \frac{1}{2} (C_A V_A - C_L V_L) (\Delta y)^2 > 0$$

## 3. Academic References
- Redington, F. M. (1952). Review of the principles of life-office valuations. *Journal of the Institute of Actuaries*, 78(3), 286-315.