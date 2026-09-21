# RISKOS — News Alpha Formulation & Research Methodology

## 1. Quantitative News Alpha Formulation

Traditional sentiment systems fall into the trap of naive polarity mapping ($\text{Positive} \to \text{BUY}$, $\text{Negative} \to \text{SELL}$), ignoring economic gravity, market confirmation, and information redundancy. 

RISKOS introduces an institutional multifactor formulation:

$$\text{News Alpha} = S \times R \times M \times N \times Q \times H \times C \times T$$

Where:
- **$S \in [-1.0, +1.0]$ (Polarity Sentiment)**: Alpha Vantage normalized sentiment score calibrated against Loughran-McDonald institutional financial lexicon.
- **$R \in [0.1, 1.0]$ (Entity Relevance)**: Explicit asset-specific relevance scalar extracted from Alpha Vantage `ticker_sentiment`.
- **$M \in [0.0, 1.0]$ (Economic Materiality)**: Evaluated by `NewsMaterialityEngine` based on event category severity, market cap tier ($\ge \text{₹5 Lakh Cr} \implies 1.15\times$), surprise indicators, and portfolio holding status.
- **$N \in [0.0, 1.0]$ (Information Novelty)**: Jaccard token overlap against 30-day rolling lookback. First-time events receive $N \approx 0.95$, whereas syndicated reprints within 6 hours are penalized down to $N \approx 0.20$.
- **$Q \in [0.75, 1.15]$ (Source Credibility)**: Primary wire services (Reuters, Bloomberg, Regulatory filings) receive $1.15\times$; speculative forums/blogs receive $0.75\times$.
- **$H \in [0.5, 1.3]$ (Historical Hit Rate Multiplier)**: Calibrated on empirical forward return event studies:
  $$H = 0.60 + 0.80 \times \text{HitRate}_{1d}$$
- **$C \in [0.25, 1.25]$ (Market Confirmation Factor)**:
  - $\text{STRONG} \implies 1.25$ (Price aligns with sentiment and $\text{RVOL} \ge 1.8\times$)
  - $\text{MODERATE} \implies 1.00$ (Price aligns with sentiment, standard volume)
  - $\text{UNCONFIRMED} \implies 0.70$ (Price within noise threshold $\pm 0.2\%$)
  - $\text{DIVERGENT} \implies 0.25$ (Price moved inversely to sentiment, e.g. "Sell-the-news")
- **$T = e^{-\lambda \Delta t}$ (Exponential Time Decay)**: Decay parameter $\lambda = 0.05$ yielding a half-life of $\approx 14$ hours.

The raw score is scaled into $[-100, +100]$.

---

## 2. Institutional Gating & The "NO_TRADE" Invariant

In high-conviction quantitative systems, **knowing when NOT to trade is more valuable than entering ambiguous positions**. 

RISKOS enforces strict deterministic gating rules:
1. **Price-Sentiment Divergence Gating**: If an earnings release is overwhelmingly bullish ($S = +0.82$) but the stock drops $-2.1\%$ on $3.4\times$ volume, the engine flags `DIVERGENT` confirmation and immediately forces:
   $$\text{Decision} = \text{NO\_TRADE}$$
2. **Materiality Filter**: Any event with $M < 40/100$ is considered noise and gated out.
3. **Classification Ambiguity**: Articles with `eventConfidence` $< 50\%$ cannot trigger automated execution eligibility.

---

## 3. Multi-Signal Additive Decomposition

News Alpha does not operate in isolation. It feeds transparently into the unified RISKOS signal synthesis:

```text
FINAL SIGNAL: BULLISH (+53)
─────────────────────────────────────────────
Factor Component                 Points
─────────────────────────────────────────────
News Alpha Vector                +24
Price Momentum Filter (20/50D)   +18
Volume Confirmation (RVOL)        +9
Market Regime (3-State HMM)       +6
TimesFM 3.0 / Prophet Forecast    +7
Risk & VaR Barrier Deduction     -11
─────────────────────────────────────────────
Net Composite Stance             +53 (BULLISH)
```

---

## 4. Leakage Prevention (Look-Ahead Bias Elimination)

In backtesting and research modeling:
- At historical bar $t$, only news published at $t_{\text{published}} \le t$ is admitted.
- Event features never incorporate forward price movement or subsequent revisions.
- Purged and embargoed cross-validation buffers eliminate autocorrelation leakage across overlapping event holding windows.
