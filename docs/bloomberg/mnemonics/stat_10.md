# Bloomberg Terminal Function: <STAT> (Part 10)

## Statistical Arbitrage & Cointegration Screener

### Description
Engle-Granger ADF unit root test and Kalman dynamic hedge ratio.

### Institutional Bloomberg Workflow
1. Type `<STAT>` into the RISKOS Command Line Bar (`⌘K` or `F1`-`F12`).
2. Set asset class parameters and historical lookback horizon.
3. Review computed risk metrics, LaTeX analytical formulation, and trade execution blotter.

### KaTeX Formulation
$$\text{STAT}_{t} = \arg\min_{\mathbf{w} \in \mathcal{W}} \mathcal{L}(\mathbf{w}, \mathbf{\Sigma}, \boldsymbol{\mu})$$

*RISKOS Institutional Bloomberg Terminal Core Engine Specification v3.5.*
