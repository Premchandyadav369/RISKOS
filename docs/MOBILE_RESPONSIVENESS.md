# RISKOS Universal Mobile Responsiveness Specification

## 1. Problem Statement & Audit
Previous versions of the platform suffered from desktop-first layout locks:
- Viewport forced to strict 100vh grids, preventing touch scrolling.
- Multi-column data tables clipped on narrow mobile displays.
- Floating command strips and ribbons overflowed horizontally.
- Touch targets were below minimum accessibility recommendations.

---

## 2. Mobile Architecture Overhauls

### 1. Viewport & Natural Scroll Flow
- Replaced locked `height: 100vh` on the primary page with responsive flow (`min-height: 100vh; height: auto; overflow-y: visible`).
- Added responsive safe-area padding (`env(safe-area-inset-bottom)`) for modern bezel-less devices (iOS / Android).

### 2. Touch-Optimized Mobile Bottom Navigation (`mobileNav.js` & `mobileResponsive.css`)
On screens $\le 768	ext{px}$, a permanent frosted-glass bottom navigation bar is automatically injected:
- **Home**: `index.html`
- **Markets**: `ticker.html`
- **Portfolio**: `portfolio_optimizer.html`
- **Terminal**: `app.html`
- **Learn**: `learn.html`
- **More**: Slide-up sheet providing one-tap access to Observatory, 41 Bots, 75 Labs, Docs, and System Status.

### 3. Touch Target Discipline
- All interactive buttons, tabs, and links adhere to minimum dimensions of $44	ext{px} 	imes 44	ext{px}$.
- Active touch feedback with subtle scaling and tap highlight suppression.

### 4. Responsive Data Tables
- Wrapped all tabular market grids in `.table-responsive-wrapper` with horizontal touch scrolling.
- First column (Ticker Symbol / Name) pinned with `position: sticky; left: 0` for seamless scanning.
