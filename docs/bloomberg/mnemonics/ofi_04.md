# Bloomberg Terminal Function: <OFI> (Part 4)

## Order Flow Imbalance & Level-2 DOM Depth

### Description
Cont-Kukanov-Stoikov queue dynamics and micro-price estimator.

### Institutional Bloomberg Workflow
1. Type `<OFI>` into the RISKOS Command Line Bar (`⌘K` or `F1`-`F12`).
2. Set asset class parameters and historical lookback horizon.
3. Review computed risk metrics, LaTeX analytical formulation, and trade execution blotter.

### KaTeX Formulation
$$\text{OFI}_{t} = \arg\min_{\mathbf{w} \in \mathcal{W}} \mathcal{L}(\mathbf{w}, \mathbf{\Sigma}, \boldsymbol{\mu})$$

*RISKOS Institutional Bloomberg Terminal Core Engine Specification v3.5.*
