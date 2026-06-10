# Bloomberg Terminal Function: <HMM> (Part 2)

## Hidden Markov Model Regime Classifier

### Description
Gaussian HMM 3-state Baum-Welch expectation-maximization.

### Institutional Bloomberg Workflow
1. Type `<HMM>` into the RISKOS Command Line Bar (`⌘K` or `F1`-`F12`).
2. Set asset class parameters and historical lookback horizon.
3. Review computed risk metrics, LaTeX analytical formulation, and trade execution blotter.

### KaTeX Formulation
$$\text{HMM}_{t} = \arg\min_{\mathbf{w} \in \mathcal{W}} \mathcal{L}(\mathbf{w}, \mathbf{\Sigma}, \boldsymbol{\mu})$$

*RISKOS Institutional Bloomberg Terminal Core Engine Specification v3.5.*
