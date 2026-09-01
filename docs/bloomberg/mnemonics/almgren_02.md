# Bloomberg Terminal Function: <ALMGREN> (Part 2)

## Almgren-Chriss Optimal Liquidation Trajectory

### Description
Mean-variance execution cost calculus of variations.

### Institutional Bloomberg Workflow
1. Type `<ALMGREN>` into the RISKOS Command Line Bar (`⌘K` or `F1`-`F12`).
2. Set asset class parameters and historical lookback horizon.
3. Review computed risk metrics, LaTeX analytical formulation, and trade execution blotter.

### KaTeX Formulation
$$\text{ALMGREN}_{t} = \arg\min_{\mathbf{w} \in \mathcal{W}} \mathcal{L}(\mathbf{w}, \mathbf{\Sigma}, \boldsymbol{\mu})$$

*RISKOS Institutional Bloomberg Terminal Core Engine Specification v3.5.*
