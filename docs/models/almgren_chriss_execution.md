# Model Card: Almgren-Chriss Optimal Execution & Slippage

## 1. Model Overview
The Almgren & Chriss (2000) framework models optimal trade liquidation under market impact and risk aversion, balancing immediate execution cost against price volatility risk.

## 2. Mathematical Formulation
Total execution slippage consists of temporary and permanent impact:
$$C_{\text{trade}} = \frac{1}{2} \text{Spread} + \eta \left( \frac{q}{V} \right)^2$$
Where:
- $q$ is the order chunk size.
- $V$ is the Average Daily Volume (ADV).
- $\eta$ is the market impact sensitivity parameter.

Optimal trajectory solves:
$$\min_{v_t} \quad E[x_t] + \lambda_{\text{risk}} \text{Var}[x_t]$$

## 3. Applications in RISKOS
- Used in `research_backtest.py` to calculate quadratic slippage on portfolio rebalancing.
- Used in `execution.py` and `fleet.js` VWAP / TWAP slicing simulators.

## 4. Academic References
- Almgren, R., & Chriss, N. (2000). Optimal Execution of Portfolio Transactions. *Journal of Risk*, 3(2), 5-40.
