/**
 * RISKOS — Universal Mobile Navigation Component (mobileNav.js)
 * High-performance mobile bottom nav & slide-up drawer for all RISKOS pages.
 */
(function() {
  'use strict';

  function initMobileNav() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('mobileBottomNav')) return;

    const path = window.location.pathname.toLowerCase();
    const isHome = path.endsWith('index.html') || path === '/' || path.endsWith('/riskos/') || path.endsWith('/riskos');
    const isApp = path.includes('app.html');
    const isFleet = path.includes('fleet.html');
    const isObservatory = path.includes('observatory.html');
    const isTicker = path.includes('ticker.html');
    const isOptimizer = path.includes('portfolio_optimizer.html');
    const isLearn = path.includes('learn.html');
    const isDocs = path.includes('docs.html');

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.id = 'mobileBottomNav';
    nav.setAttribute('aria-label', 'Mobile Platform Navigation');

    nav.innerHTML = `
      <a href="index.html" class="mob-nav-item ${isHome ? 'active' : ''}">
        <i class="fa-solid fa-house"></i>
        <span>Home</span>
      </a>
      <a href="observatory.html" class="mob-nav-item ${isObservatory || isTicker ? 'active' : ''}">
        <i class="fa-solid fa-satellite-dish"></i>
        <span>Markets</span>
      </a>
      <a href="portfolio_optimizer.html" class="mob-nav-item ${isOptimizer ? 'active' : ''}">
        <i class="fa-solid fa-sliders"></i>
        <span>Portfolio</span>
      </a>
      <a href="app.html" class="mob-nav-item ${isApp ? 'active' : ''}">
        <i class="fa-solid fa-terminal"></i>
        <span>Terminal</span>
      </a>
      <a href="learn.html" class="mob-nav-item ${isLearn ? 'active' : ''}">
        <i class="fa-solid fa-graduation-cap"></i>
        <span>Learn</span>
      </a>
      <button class="mob-nav-item" id="mobNavMoreBtn" aria-label="More Features">
        <i class="fa-solid fa-bars"></i>
        <span>More</span>
      </button>
    `;

    document.body.appendChild(nav);

    const sheetOverlay = document.createElement('div');
    sheetOverlay.className = 'mobile-more-sheet-overlay';
    sheetOverlay.id = 'mobileMoreSheetOverlay';
    sheetOverlay.innerHTML = `
      <div class="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More RISKOS Navigation">
        <div class="more-sheet-handle"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h3 style="margin:0;font-size:1.05rem;font-weight:700;color:#fff;">All RISKOS Modules</h3>
          <button id="closeMoreSheetBtn" style="background:transparent;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;padding:4px 8px;">&times;</button>
        </div>
        <p style="margin:0 0 14px 0;font-size:0.75rem;color:#71717a;">Institutional Quantitative Research &amp; Trading Platform</p>

        <div class="more-sheet-grid">
          <a href="fleet.html" class="more-sheet-card ${isFleet ? 'active' : ''}">
            <i class="fa-solid fa-robot" style="color:#22d3ee;"></i>
            <div>
              <div>24/7 Bot Fleet</div>
              <div style="font-size:0.68rem;color:#71717a;font-weight:400;">41 Greek/Norse/Egyptian Bots</div>
            </div>
          </a>
          <a href="ticker.html" class="more-sheet-card ${isTicker ? 'active' : ''}">
            <i class="fa-solid fa-layer-group" style="color:#10b981;"></i>
            <div>
              <div>Screener &amp; Radar</div>
              <div style="font-size:0.68rem;color:#71717a;font-weight:400;">Security Master &amp; Alpha</div>
            </div>
          </a>
          <a href="docs.html" class="more-sheet-card ${isDocs ? 'active' : ''}">
            <i class="fa-solid fa-book-bookmark" style="color:#f59e0b;"></i>
            <div>
              <div>System Docs</div>
              <div style="font-size:0.68rem;color:#71717a;font-weight:400;">Equations &amp; Methodology</div>
            </div>
          </a>
          <a href="docs.html#trust-center" class="more-sheet-card">
            <i class="fa-solid fa-shield-halved" style="color:#a855f7;"></i>
            <div>
              <div>Trust Center</div>
              <div style="font-size:0.68rem;color:#71717a;font-weight:400;">Data Truth &amp; Calendars</div>
            </div>
          </a>
          <button class="more-sheet-card" id="mobOpenPaletteBtn" style="cursor:pointer;text-align:left;background:rgba(34,211,238,0.08);border-color:rgba(34,211,238,0.25);">
            <i class="fa-solid fa-wand-magic-sparkles" style="color:#22d3ee;"></i>
            <div>
              <div>Command Center</div>
              <div style="font-size:0.68rem;color:#22d3ee;font-weight:400;">Search Anything (⌘K)</div>
            </div>
          </button>
          <button class="more-sheet-card" id="mobOpenProvBtn" style="cursor:pointer;text-align:left;background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);">
            <i class="fa-solid fa-fingerprint" style="color:#10b981;"></i>
            <div>
              <div>Data Provenance</div>
              <div style="font-size:0.68rem;color:#10b981;font-weight:400;">Inspect Market Truth</div>
            </div>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(sheetOverlay);

    const openSheet = () => sheetOverlay.classList.add('active');
    const closeSheet = () => sheetOverlay.classList.remove('active');

    // Expose globally
    window.openMobileMoreSheet = openSheet;
    window.closeMobileMoreSheet = closeSheet;

    document.getElementById('mobNavMoreBtn')?.addEventListener('click', openSheet);
    document.getElementById('closeMoreSheetBtn')?.addEventListener('click', closeSheet);
    sheetOverlay.addEventListener('click', (e) => {
      if (e.target === sheetOverlay) closeSheet();
    });

    document.getElementById('mobOpenPaletteBtn')?.addEventListener('click', () => {
      closeSheet();
      if (typeof window.openPalette === 'function') {
        window.openPalette();
      } else {
        const pBtn = document.getElementById('btnOpenPalette') || document.getElementById('navSearchTrigger');
        pBtn?.click();
      }
    });

    document.getElementById('mobOpenProvBtn')?.addEventListener('click', () => {
      closeSheet();
      if (typeof MarketDataTruth !== 'undefined') {
        MarketDataTruth.openProvenanceModal('RELIANCE');
      }
    });

    // Automatically bind all mobile menu toggles across all pages to open the mobile drawer
    document.querySelectorAll('#menuToggle, .menu-toggle, [aria-controls="mobileMenu"], [aria-controls="mobileMenuOverlay"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSheet();
      });
    });
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initMobileNav);
    } else {
      initMobileNav();
    }
  }
})();
