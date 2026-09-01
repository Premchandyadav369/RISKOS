# Bloomberg Terminal Function: <YCRV> (Part 2)

## Sovereign Yield Curve & Term Structure

### Description
Nelson-Siegel-Svensson 6-factor spline interpolator.

### Institutional Bloomberg Workflow
1. Type `<YCRV>` into the RISKOS Command Line Bar (`⌘K` or `F1`-`F12`).
2. Set asset class parameters and historical lookback horizon.
3. Review computed risk metrics, LaTeX analytical formulation, and trade execution blotter.

### KaTeX Formulation
$$\text{YCRV}_{t} = \arg\min_{\mathbf{w} \in \mathcal{W}} \mathcal{L}(\mathbf{w}, \mathbf{\Sigma}, \boldsymbol{\mu})$$

*RISKOS Institutional Bloomberg Terminal Core Engine Specification v3.5.*
