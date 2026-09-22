/**
 * RISKOS — Universal Command Center Palette Component
 * Provides Cmd+K / Ctrl+K search across all 75 Labs, 41 Bots, 8 Desks, Securities, and Actions.
 */

(function(root) {
  'use strict';

  const CATALOG = [
    // ── 1. Core Pages ──
    { id: 'author_portfolio', title: 'Made by Humans on Earth · Premchand Yadav', desc: 'System Architect & Quantitative Developer — Portfolio: https://premchandyadav1.vercel.app/', category: 'System', badge: 'CREATOR', icon: 'fa-earth-americas', action: () => window.open('https://premchandyadav1.vercel.app/', '_blank') },
    { id: 'page_home', title: 'Executive Overview Dashboard', desc: 'Single-source-of-truth macro market intelligence', category: 'Pages', badge: 'PAGE', icon: 'fa-house', url: 'index.html' },
    { id: 'page_terminal', title: '7 Institutional Quant Trading Desks', desc: 'Market intelligence, risk engine, yield curve, DOM & vol lab', category: 'Pages', badge: 'PAGE', icon: 'fa-terminal', url: 'app.html' },
    { id: 'page_fleet', title: '24/7 Autonomous Bot Fleet', desc: '41 Greek, Norse & Egyptian algorithmic strategies', category: 'Pages', badge: 'PAGE', icon: 'fa-robot', url: 'fleet.html' },
    { id: 'page_obs', title: 'Global Macro Market Observatory', desc: 'Macro causality network, central bank policy & yield matrix', category: 'Pages', badge: 'PAGE', icon: 'fa-satellite-dish', url: 'observatory.html' },
    { id: 'page_learn', title: '75 Quantitative Simulation Laboratories', desc: 'Interactive simulators, mathematical proofs, and derivations', category: 'Pages', badge: 'PAGE', icon: 'fa-graduation-cap', url: 'learn.html' },
    { id: 'page_screener', title: 'Cross-Asset Security Screener & Penny Radar', desc: 'Multi-factor filters, ISIN lookup, and volume surge scanner', category: 'Pages', badge: 'PAGE', icon: 'fa-layer-group', url: 'ticker.html' },
    { id: 'page_news', title: 'News Corner & Event-Driven Market Impact Engine', desc: 'Alpha Vantage news intelligence, event classification & News Alpha', category: 'Pages', badge: 'NEWS', icon: 'fa-newspaper', url: 'news.html' },
    { id: 'page_optimizer', title: 'Multi-Asset Portfolio Optimizer', desc: 'Markowitz frontier, Black-Litterman & HRP allocations', category: 'Pages', badge: 'PAGE', icon: 'fa-sliders', url: 'portfolio_optimizer.html' },
    { id: 'page_docs', title: 'RISKOS System Documentation & Whitepapers', desc: 'Full quantitative formulas, API specs, and research methodologies', category: 'Pages', badge: 'PAGE', icon: 'fa-book-bookmark', url: 'docs.html' },
    { id: 'page_trust', title: 'RISKOS Trust & Methodology Center', desc: 'Data provenance, exchange calendars, and simulation disclaimers', category: 'Pages', badge: 'TRUST', icon: 'fa-shield-halved', url: 'docs.html#trust-center' },

    // ── 2. Trading Desks ──
    { id: 'desk_1', title: 'Desk 1: Market Intelligence & GARCH/HMM Volatility', desc: 'GARCH(1,1), EWMA volatility, Gaussian HMM regimes & correlations', category: 'Trading Desks', badge: 'DESK 1', icon: 'fa-chart-line', url: 'app.html?desk=desk1' },
    { id: 'desk_2', title: 'Desk 2: Tail Risk & CVaR Portfolio Engine', desc: 'Historical, Parametric, Monte Carlo VaR/CVaR & Kupiec tests', category: 'Trading Desks', badge: 'DESK 2', icon: 'fa-shield-halved', url: 'app.html?desk=desk2' },
    { id: 'desk_3', title: 'Desk 3: Sovereign Yield Curve & Futures Desk', desc: 'Nelson-Siegel-Svensson bootstrapping and Kalman spread carry', category: 'Trading Desks', badge: 'DESK 3', icon: 'fa-arrow-trend-up', url: 'app.html?desk=desk3' },
    { id: 'desk_4', title: 'Desk 4: Microstructure & Order Book (Level-2 DOM)', desc: 'Roll spread, OFI imbalance, Kyle lambda & VPIN toxicity', category: 'Trading Desks', badge: 'DESK 4', icon: 'fa-bars-staggered', url: 'app.html?desk=desk4' },
    { id: 'desk_5', title: 'Desk 5: Derivatives, SVI Smile & Greeks Lab', desc: 'Black-Scholes-Merton, Delta/Gamma hedging and SVI vol surface', category: 'Trading Desks', badge: 'DESK 5', icon: 'fa-wave-square', url: 'app.html?desk=desk5' },
    { id: 'desk_6', title: 'Desk 6: Signals & Risk Parity Allocation', desc: 'Fractional Kelly sizing, Brinson attribution & Smart Order Routing', category: 'Trading Desks', badge: 'DESK 6', icon: 'fa-bolt', url: 'app.html?desk=desk6' },
    { id: 'desk_7', title: 'Desk 7: AI Speculations & Quantile Fan Forecaster', desc: 'TimesFM 3.0 foundation model & 10,000-path Monte Carlo', category: 'Trading Desks', badge: 'DESK 7', icon: 'fa-wand-magic-sparkles', url: 'app.html?desk=desk7' },
    { id: 'desk_8', title: 'Desk 8: Sector Quantitative Indicators Desk', desc: 'Relative strength, market breadth & Egyptian deity bot links', category: 'Trading Desks', badge: 'DESK 8', icon: 'fa-chart-pie', url: 'ticker.html#sectorDesk' },

    // ── 3. Flagship Models & Engines ──
    { id: 'mod_bl', title: 'Black-Litterman Portfolio Optimization', desc: 'Bayesian blending of CAPM equilibrium with subjective investor views', category: 'Models', badge: 'MODEL', icon: 'fa-cube', url: 'portfolio_optimizer.html?model=black_litterman' },
    { id: 'mod_hrp', title: 'Hierarchical Risk Parity (HRP)', desc: 'Graph-theoretic clustering of covariance matrix avoiding inversion', category: 'Models', badge: 'MODEL', icon: 'fa-sitemap', url: 'portfolio_optimizer.html?model=hrp' },
    { id: 'mod_cvar', title: 'Conditional Value-at-Risk (Expected Shortfall)', desc: 'Sub-additive coherent risk measure for extreme tail losses', category: 'Models', badge: 'MODEL', icon: 'fa-shield-halved', action: () => root.MarketDataTruth ? root.MarketDataTruth.openProvenanceModal() : window.location.href='app.html?desk=desk2' },
    { id: 'mod_sabr', title: 'SABR Stochastic Volatility Calibration', desc: 'Hagan asymptotic expansion for strike skew and smile curvature', category: 'Models', badge: 'MODEL', icon: 'fa-wave-square', url: 'learn.html?lab=sabr_vol_surface' },
    { id: 'mod_gex', title: '0DTE Gamma Exposure (GEX) & Dealer Pinning', desc: 'Dealer gamma positioning, zero-gamma flip & pinning strike', category: 'Models', badge: 'MODEL', icon: 'fa-magnet', url: 'learn.html?lab=gamma_exposure_gex' },
    { id: 'mod_hawkes', title: 'Hawkes Self-Exciting Point Process', desc: 'High-frequency jump clustering and flash-crash cascade risk', category: 'Models', badge: 'MODEL', icon: 'fa-burst', url: 'learn.html?lab=hawkes_process' },
    { id: 'mod_merton', title: 'Merton Structural Credit Default Model', desc: 'Asset distance-to-default and equity as call option on firm value', category: 'Models', badge: 'MODEL', icon: 'fa-landmark', url: 'learn.html?lab=merton_structural_credit' },
    { id: 'mod_lbo', title: 'LBO Cash Flow Sweep & Sponsor Returns', desc: 'Private equity debt paydown, 5Y IRR and MOIC return multiples', category: 'Models', badge: 'MODEL', icon: 'fa-money-bill-transfer', url: 'learn.html?lab=lbo_cash_sweep' },
    { id: 'mod_clo', title: 'CLO Tranche Waterfall & Loss Allocation', desc: 'Collateral pool waterfall: Senior AAA, Mezzanine, First-Loss Equity', category: 'Models', badge: 'MODEL', icon: 'fa-layer-group', url: 'learn.html?lab=clo_tranche_waterfall' },
    { id: 'mod_oas', title: 'Option-Adjusted Spread (OAS) Lattice Tree', desc: 'Binomial interest rate tree isolating borrower embedded call risk', category: 'Models', badge: 'MODEL', icon: 'fa-tree', url: 'learn.html?lab=option_adjusted_spread' },

    // ── 4. Key Simulation Labs ──
    { id: 'lab_66', title: 'Lab 66: Sector Rotation & Relative Strength Alpha Matrix', desc: 'Mansfield relative strength ratio and 4-quadrant momentum tracking', category: 'Labs', badge: 'LAB 66', icon: 'fa-chart-pie', url: 'learn.html?lab=sector_relative_strength' },
    { id: 'lab_67', title: 'Lab 67: Egyptian Pantheon Order Flow Imbalance (OFI)', desc: 'Microstructure queue imbalance and Kyle lambda price impact', category: 'Labs', badge: 'LAB 67', icon: 'fa-ankh', url: 'learn.html?lab=egyptian_pantheon_hft' },
    { id: 'lab_68', title: 'Lab 68: GARCH(1,1) Compound Poisson Jump-Diffusion', desc: 'Continuous GARCH volatility with discrete crash shocks', category: 'Labs', badge: 'LAB 68', icon: 'fa-bolt-lightning', url: 'learn.html?lab=garch_jump_diffusion' },
    { id: 'lab_69', title: 'Lab 69: Cross-Asset Statistical Arbitrage & Cointegration', desc: 'Ornstein-Uhlenbeck spread reversion and half-life execution', category: 'Labs', badge: 'LAB 69', icon: 'fa-arrows-split-up-and-left', url: 'learn.html?lab=cross_asset_stat_arb' },
    { id: 'lab_70', title: 'Lab 70: Barra Multi-Factor Risk & Covariance Decomposition', desc: 'Systematic factor variance vs idiosyncratic stock risk', category: 'Labs', badge: 'LAB 70', icon: 'fa-cubes-stacked', url: 'learn.html?lab=barra_multi_factor_risk' },
    { id: 'lab_71', title: 'Lab 71: Optimal Algorithmic Order Slicing (VWAP & TWAP)', desc: 'Almgren-Chriss implementation shortfall and volume curves', category: 'Labs', badge: 'LAB 71', icon: 'fa-stopwatch-20', url: 'learn.html?lab=optimal_vwap_execution' },
    { id: 'lab_72', title: 'Lab 72: SABR Stochastic Volatility Surface Calibration', desc: 'Hagan SABR PDE smile, 25-delta skew and ATM volatility', category: 'Labs', badge: 'LAB 72', icon: 'fa-wave-square', url: 'learn.html?lab=sabr_vol_surface' },
    { id: 'lab_73', title: 'Lab 73: Q-Learning Market Making & Inventory Control', desc: 'Reinforcement learning reservation price and inventory skew', category: 'Labs', badge: 'LAB 73', icon: 'fa-robot', url: 'learn.html?lab=reinforcement_learning_mm' },
    { id: 'lab_74', title: 'Lab 74: Extreme Value Theory (EVT) Peaks-Over-Threshold CVaR', desc: 'Generalized Pareto Distribution (GPD) heavy-tail expected shortfall', category: 'Labs', badge: 'LAB 74', icon: 'fa-shield-halved', url: 'learn.html?lab=evt_pot_tail_risk' },
    { id: 'lab_75', title: 'Lab 75: Hidden Markov Model (HMM) Multi-State Regime Matrix', desc: '3-State Gaussian transition matrix decoding Bull, Bear & Sideways', category: 'Labs', badge: 'LAB 75', icon: 'fa-diagram-project', url: 'learn.html?lab=hmm_regime_switching' },

    // ── 5. Quick Actions ──
    { id: 'act_prov', title: 'Inspect Market Data Truth & Provenance', desc: 'Verify exchange hours, live vs closed status, and provider feeds', category: 'Actions', badge: 'AUDIT', icon: 'fa-fingerprint', action: () => root.MarketDataTruth ? root.MarketDataTruth.openProvenanceModal('RELIANCE') : alert('MarketDataTruth active') },
    { id: 'act_tear', title: 'Export Institutional Quant Tear Sheet', desc: 'Generate printable investor factsheet PDF', category: 'Actions', badge: 'EXPORT', icon: 'fa-file-invoice', action: () => document.getElementById('btnExportTearSheet')?.click() || (window.location.href='app.html') },
    { id: 'act_sync', title: 'Sync Live Global Market Quotes', desc: 'Force refresh prices across global exchanges', category: 'Actions', badge: 'SYNC', icon: 'fa-bolt', action: () => document.getElementById('globalLiveSyncBtn')?.click() || (window.location.href='app.html') },
    { id: 'act_curr', title: 'Toggle Currency (INR ₹ / USD $)', desc: 'Switch baseline currency between Indian Rupee and US Dollar', category: 'Actions', badge: 'FX', icon: 'fa-coins', action: () => document.getElementById('currencyToggleBtn')?.click() || document.getElementById('currencyTogglePill')?.click() }
  ];

  function initUniversalPalette() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('universalPaletteOverlay')) return;

    // Inject Palette Markup
    const overlay = document.createElement('div');
    overlay.className = 'universal-palette-overlay';
    overlay.id = 'universalPaletteOverlay';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="universal-palette-modal" role="dialog" aria-modal="true" aria-label="Universal Financial Command Palette">
        <div class="universal-palette-search-box">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <input 
            type="text" 
            class="universal-palette-input" 
            id="universalPaletteInput" 
            placeholder="Search pages, 75 labs, 41 bots, models, or securities (e.g. 'SABR', 'RELIANCE', 'Desk 2')..." 
            autocomplete="off" 
          />
          <kbd class="universal-palette-esc">ESC</kbd>
        </div>
        <div class="universal-palette-results" id="universalPaletteResults">
          <!-- Dynamically Populated -->
        </div>
        <div class="universal-palette-footer">
          <div>
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span> &bull; 
            <span><kbd>↵</kbd> Select</span> &bull; 
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <div>Made by Humans on Earth &bull; Assembled by <a href="https://premchandyadav1.vercel.app/" target="_blank" rel="noopener noreferrer" style="color:#22d3ee; text-decoration:none; font-weight:600;">Premchand Yadav</a></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('universalPaletteInput');
    const resultsContainer = document.getElementById('universalPaletteResults');
    let selectedIdx = 0;
    let currentResults = [];

    const openPalette = (prefill = '') => {
      overlay.classList.add('active');
      overlay.removeAttribute('aria-hidden');
      input.value = prefill;
      input.focus();
      renderItems(prefill);
    };

    const closePalette = () => {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    };

    const renderItems = (query) => {
      const q = query.trim().toLowerCase();
      let matched = [];

      if (!q) {
        matched = CATALOG.slice(0, 16);
      } else {
        matched = CATALOG.filter(item => 
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q)
        );

        // Also check SecurityMaster registry if available with smart asset routing
        if (typeof SecurityMaster !== 'undefined' && SecurityMaster.LOCAL_REGISTRY) {
          const matchedSecs = SecurityMaster.LOCAL_REGISTRY
            .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
            .slice(0, 4)
            .map(s => {
              const isMacroOrYield = ['BZ=F', '^TNX', 'USDINR=X', '^VIX', 'GC=F', 'CL=F', 'SI=F', '^GSPC', '^NSEI'].includes(s.symbol) || 
                                     s.sector === 'Commodity' || s.sector === 'Macro / Sovereign';
              const targetUrl = isMacroOrYield 
                ? `observatory.html?macro=${encodeURIComponent(s.symbol)}` 
                : `index.html?ticker=${encodeURIComponent(s.symbol)}`;

              return {
                id: `sec_${s.symbol}`,
                title: `${s.symbol} — ${s.name}`,
                desc: `${s.exchange} &bull; ${s.sector} &bull; Base Price: ${s.currency === 'USD' ? '$' : '₹'}${s.basePrice}`,
                category: isMacroOrYield ? 'Macro & Observatories' : 'Securities & Equities',
                badge: s.exchange,
                icon: isMacroOrYield ? 'fa-chart-pie' : 'fa-building-columns',
                url: targetUrl
              };
            });
          matched = [...matched, ...matchedSecs];
        }

        // Also match 41 Pantheon Bots
        const pantheonBotNames = [
          { id: 'BOT-IN-01', name: 'Zeus Sovereign Index', pantheon: 'Olympus', sym: 'NIFTY 50' },
          { id: 'BOT-IN-02', name: 'Athena Adaptive Vol', pantheon: 'Olympus', sym: 'BANKNIFTY' },
          { id: 'BOT-IN-03', name: 'Apollo Energy Momentum', pantheon: 'Olympus', sym: 'RELIANCE.NS' },
          { id: 'BOT-IN-04', name: 'Hermes Stat-Arb Sentry', pantheon: 'Olympus', sym: 'TCS.NS' },
          { id: 'BOT-US-01', name: 'Odin All-Father Micro', pantheon: 'Valhalla', sym: 'AAPL' },
          { id: 'BOT-US-02', name: 'Thor Mjolnir Vol Surge', pantheon: 'Valhalla', sym: 'NVDA' },
          { id: 'BOT-US-07', name: 'Loki Quantum Chaos', pantheon: 'Valhalla', sym: 'BTC-USD' },
          { id: 'BOT-EG-IN-01', name: 'Anubis Liquidity Sentinel', pantheon: 'Karnak', sym: 'HDFCBANK.NS' },
          { id: 'BOT-EG-IN-02', name: 'Horus Micro-Tick Hunter', pantheon: 'Karnak', sym: 'INFY.NS' },
          { id: 'BOT-EG-US-01', name: 'Ra Sun God Solar Core', pantheon: 'Karnak', sym: 'MSFT' },
          { id: 'BOT-EG-US-03', name: 'Sobek Nile Liquidity Sentry', pantheon: 'Karnak', sym: 'AMZN' }
        ];

        const matchedBots = pantheonBotNames
          .filter(b => b.name.toLowerCase().includes(q) || b.sym.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.pantheon.toLowerCase().includes(q))
          .slice(0, 3)
          .map(b => ({
            id: `bot_${b.id}`,
            title: `${b.name} (${b.id})`,
            desc: `${b.pantheon} Division &bull; Live Target: ${b.sym}`,
            category: 'Autonomous Pantheon Fleet',
            badge: b.pantheon,
            icon: 'fa-robot',
            url: `fleet.html?bot=${encodeURIComponent(b.id)}`
          }));
        matched = [...matched, ...matchedBots];
      }

      currentResults = matched;
      selectedIdx = 0;

      if (matched.length === 0) {
        resultsContainer.innerHTML = `
          <div style="padding: 30px; text-align: center; color: #71717a;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 1.8rem; margin-bottom: 8px; opacity: 0.4;"></i>
            <p style="margin: 0; font-size: 0.85rem;">No matching modules or securities found for "${query}".</p>
          </div>
        `;
        return;
      }

      // Group results by category
      const groups = {};
      matched.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      });

      let html = '';
      let flatIdx = 0;

      for (const [catName, items] of Object.entries(groups)) {
        html += `<div class="universal-palette-group-title">${catName}</div>`;
        items.forEach(item => {
          const isSel = flatIdx === selectedIdx;
          html += `
            <div class="universal-palette-item ${isSel ? 'selected' : ''}" data-idx="${flatIdx}">
              <div class="universal-palette-item-left">
                <div class="universal-palette-item-icon"><i class="fa-solid ${item.icon}"></i></div>
                <div>
                  <div class="universal-palette-item-title">${item.title}</div>
                  <div class="universal-palette-item-desc">${item.desc}</div>
                </div>
              </div>
              <span class="universal-palette-item-badge">${item.badge}</span>
            </div>
          `;
          flatIdx++;
        });
      }

      resultsContainer.innerHTML = html;

      // Click handlers
      resultsContainer.querySelectorAll('.universal-palette-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.idx, 10);
          executeItem(currentResults[idx]);
        });
      });
    };

    const executeItem = (item) => {
      if (!item) return;
      closePalette();
      if (typeof item.action === 'function') {
        item.action();
      } else if (item.url) {
        window.location.href = item.url;
      }
    };

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (overlay.classList.contains('active')) closePalette();
        else openPalette();
      }
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closePalette();
      }
    });

    input.addEventListener('input', (e) => {
      renderItems(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = Math.min(currentResults.length - 1, selectedIdx + 1);
        highlightSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = Math.max(0, selectedIdx - 1);
        highlightSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeItem(currentResults[selectedIdx]);
      }
    });

    const highlightSelection = () => {
      resultsContainer.querySelectorAll('.universal-palette-item').forEach((el, idx) => {
        if (idx === selectedIdx) {
          el.classList.add('selected');
          el.scrollIntoView({ block: 'nearest' });
        } else {
          el.classList.remove('selected');
        }
      });
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePalette();
    });

    root.openUniversalPalette = openPalette;
    root.closeUniversalPalette = closePalette;
    root.openPalette = openPalette;
    root.closePalette = closePalette;
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initUniversalPalette);
    } else {
      initUniversalPalette();
    }
  }
})(typeof window !== 'undefined' ? window : global);
