# Bloomberg Terminal Function: <PORT> (Part 1)

## Institutional Portfolio Risk & Basel FRTB Capital

### Description
Rockafellar-Uryasev CVaR optimization and factor attribution.

### Institutional Bloomberg Workflow
1. Type `<PORT>` into the RISKOS Command Line Bar (`⌘K` or `F1`-`F12`).
2. Set asset class parameters and historical lookback horizon.
3. Review computed risk metrics, LaTeX analytical formulation, and trade execution blotter.

### KaTeX Formulation
$$\text{PORT}_{t} = \arg\min_{\mathbf{w} \in \mathcal{W}} \mathcal{L}(\mathbf{w}, \mathbf{\Sigma}, \boldsymbol{\mu})$$

*RISKOS Institutional Bloomberg Terminal Core Engine Specification v3.5.*
