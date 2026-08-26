# Intelligence For Modern Finance

> An institutional-grade financial intelligence platform. Static landing page built with **HTML5 + CSS3 + Vanilla JS** — zero frameworks, zero build tools.

---

## Live File Structure

```
├── index.html                     # Multi-section scrollable landing page
├── styles.css                     # CSS custom properties, responsive grid, animations
├── main.js                        # Scroll interactions, mobile menu, count-up metrics
├── assets/
│   └── logo.webp                  # Brand logo mark
└── fonts/
    └── GeistPixel-Circle.woff2    # Fallback display font
```

---

## What's on the Page

### Hero (First Viewport)
Full-bleed looping background video with trust row, dot-matrix headline, subhead, CTA, and four animated financial metrics.

### Platform Features (6 Core Capabilities)
Each feature includes a clear description and an expandable "How it works" explanation:

1. **Real-Time Market Intelligence** — Monitors global markets through statistical filters to surface regime changes and structural movements.
2. **Portfolio Risk Engine** — Historical, parametric, and Monte Carlo VaR plus Expected Shortfall (CVaR) with GARCH volatility.
3. **Adaptive Signal Generation** — Hidden Markov Model detects market regimes and switches strategies automatically.
4. **Optimal Portfolio Construction** — CVaR optimization with institutional constraints (position limits, sector caps, turnover).
5. **Stress Testing & Backtesting** — Replays strategies against historical crises and runs hypothetical extreme scenarios.
6. **Low-Latency Execution Pipeline** — Sub-120ms order routing with VWAP/TWAP algorithms and post-trade analytics.

### How It Works (4 Steps)
1. **Ingest** — 2.4M data points daily from 50+ global markets.
2. **Analyze** — GARCH, HMM, and factor models running continuously.
3. **Decide** — CVaR optimizer generates allocations with confidence intervals.
4. **Execute** — Low-latency pipeline with pre-trade risk checks and smart routing.

### Algorithm Deep Dive (6 Core Methods)
Each algorithm is explained in both technical and plain-English terms:

- **GARCH(1,1) Volatility** — Time-varying risk measurement
- **Monte Carlo VaR & CVaR** — 10,000-scenario worst-case analysis
- **Ledoit-Wolf Shrinkage** — Noise-resistant covariance estimation
- **Hidden Markov Model** — Invisible market regime detection
- **CVaR Portfolio Optimization** — Downside-focused allocation
- **Kupiec & Christoffersen Tests** — Model validation and accuracy checks

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 |
| Styling | CSS3 custom properties, Grid, Flexbox, clamp() |
| Interaction | Vanilla JavaScript (IntersectionObserver, scroll events) |
| Typography | Inter (Google Fonts), BubbledotICG-FinePos (OnlineWebFonts CDN) |
| Icons | Font Awesome 6.5.2 |
| Video | CloudFront CDN stream |
