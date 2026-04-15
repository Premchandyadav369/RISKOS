# Intelligence For Modern Finance

> A single-viewport, full-bleed video-background landing page for a modern institutional financial intelligence platform. Built with static **HTML5 + CSS3 + Vanilla JavaScript** with zero frameworks and zero build dependencies.

---

## 🚀 Live Demo & Structure

Open `index.html` directly in any modern browser.

```text
├── index.html                     # Semantic single-viewport HTML5 structure
├── styles.css                     # Custom properties, responsive layout, animations
├── main.js                        # Mobile menu interactions & count-up metrics animation
├── assets/
│   └── logo.webp                  # Brand circular mark
└── fonts/
    └── GeistPixel-Circle.woff2    # Fallback display dot-matrix font
```

---

## 🎨 Visual & Technical Architecture

- **Full-Bleed Cover Video**: Plays CloudFront background video behind UI with `object-fit: cover` and `#000` base.
- **Display Typography**: Retro dot-matrix display font (**BubbledotICG-FinePos** via CDN + **Geist Pixel Circle** local fallback) for headlines and financial symbols.
- **UI Typography**: **Inter** (400, 500, 600) via Google Fonts.
- **Iconography**: **Font Awesome 6.5.2** brand and finance glyphs.
- **Header**:
  - Circular logo button (`clamp(40px, 4.4vw, 46px)`) with image scaled to 72% and centered via CSS Grid.
  - White nav pill with active indicator (three 3×3px black dots).
  - Dark pill **Sign in** button with hover elevation.
- **Hero**:
  - Overlapping 3-avatar trust rings (Microsoft, Institutional Finance, Google) + `Trusted by 2000+ Financial Teams` pill.
  - Two-line solid white dot-matrix headline:
    ```text
    Intelligence
    For Modern Finance
    ```
  - Subhead: *"Turn market data into decisions with an intelligent financial platform built for analysis, risk and execution."*
  - White pill **Get Started** primary CTA with ambient white glow and `revealPulse` entrance.
- **Finance Metrics Footer**:
  - `$` **24/7** Market Monitoring
  - `↗` **99.9%** Signal Accuracy
  - `#` **2.4M** Data Points Analyzed
  - `₹` **120ms** Decision Latency
  - Animated counting via `easeOutCubic` curve and `IntersectionObserver`.
- **Mobile Responsive (`≤720px`)**:
  - Custom circular hamburger button with 3 bars transforming into an **X**.
  - Backdrop blur modal sheet with staggered link animations.
  - 2×2 metric grid on smaller screens.
