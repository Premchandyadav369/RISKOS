# RISKOS Progressive Disclosure & UX Architecture

## 1. Design Philosophy: "Simple by Default • Deep on Demand • Mathematical when Requested"
A central challenge of quantitative finance software is avoiding two extremes:
1. Being so complex and dense that beginners are instantly intimidated and overwhelmed.
2. Being so simplified and "gamified" that institutional quantitative rigor is lost.

RISKOS resolves this through a 3-layer **Progressive Disclosure Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: SIMPLE BY DEFAULT (Beginners & Explorers)         │
│  - Plain-English company breakdowns                         │
│  - 3 Clear Starting Paths (Markets / Portfolio / Learn)     │
│  - Interactive Persona Selector                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Click to drill down
┌──────────────────────────────▼──────────────────────────────┐
│  LAYER 2: DEEP ON DEMAND (Investors & Financial Analysts)   │
│  - 6 Capability Overview Cards                              │
│  - One-Click "Explain This" Modals with Analogies           │
│  - 41 Egyptian Quantitative Bots & Sector Indicators        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Click "Quantitative & Math"
┌──────────────────────────────▼──────────────────────────────┐
│  LAYER 3: MATHEMATICAL RIGOR (Quants, Risk Officers, Quants)│
│  - LaTeX Math Formulations & Variable Definitions           │
│  - Academic Literature Citations & Basel III / FRTB Context  │
│  - Interactive Sensitivity Calculators & Audits             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Universal Navigation & Command Center
- **Universal Command Palette (`Ctrl+K` / `Cmd+K`)**: Instant search across 5,000+ equities, 8 desks, 75 labs, 41 bots, and analytical tools. Supports keyboard navigation (`↑`, `↓`, `Enter`, `Esc`).
- **Interactive System Pipeline Map**: Visualizes the flow of data from ingestion through tick hygiene, risk modeling, strategy execution, and immutable audit logs.
- **TerminalBus State Synchronization**: When a user selects a ticker in one window (e.g. `ticker.html`), all connected tabs and modules instantly update their charts and models via `BroadcastChannel` and `localStorage`.
