/**
 * RISKOS P.R.E.M.-WebSeer Real-Time Terminal Controller
 * ==============================================================================
 * Cyber-Intelligence Alternative Data Radar & Real-Time News Stream Terminal
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: webSeerTerminal.js
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./webSeerEngine.js', './eventShockLab.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    let WebSeerEngine;
    let EventShockLab;
    try { WebSeerEngine = require('./webSeerEngine.js').WebSeerEngine || require('./webSeerEngine.js'); } catch (e) {}
    try { EventShockLab = require('../quant/eventShockLab.js'); } catch (e) {}
    module.exports = factory(WebSeerEngine, EventShockLab);
  } else {
    root.WebSeerTerminal = factory(root.WebSeerEngine, root.EventShockLab);
  }
}(typeof self !== 'undefined' ? self : this, function (WebSeerEngineModule, EventShockLab) {
  'use strict';

  let engineInstance = null;
  if (WebSeerEngineModule) {
    if (WebSeerEngineModule.defaultInstance) {
      engineInstance = WebSeerEngineModule.defaultInstance;
    } else if (typeof WebSeerEngineModule.WebSeerEngine === 'function') {
      engineInstance = new WebSeerEngineModule.WebSeerEngine();
    } else if (typeof WebSeerEngineModule === 'function') {
      engineInstance = new WebSeerEngineModule();
    }
  }

  // Active UI State
  const state = {
    isOpen: false,
    currentCountry: 'ALL', // 'ALL' | 'US' | 'IN'
    currentShockFilter: 'ALL', // 'ALL' | 'SIGNIFICANT' (>=5%) | 'CRITICAL' (>=15%)
    currentVerification: 'ALL', // 'ALL' | 'CONFIRMED_FACT' | 'UNVERIFIED_RUMOR'
    searchQuery: '',
    selectedAlertId: null,
    isPolling: false,
    pollingIntervalId: null,
    totalIngested: 0,
    shockCount: 0,
    spikeCount: 0
  };

  /**
   * Helper: Format Currency
   */
  function formatCurrency(val, currency = 'USD') {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Helper: Relative Time String
   */
  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  /**
   * Build the DOM Structure of the Web Seer Modal
   */
  function buildModalHtml() {
    return `
      <div id="riskosWebSeerModal" style="display: none;">
        <div class="web-seer-dialog">
          <!-- Header -->
          <div class="web-seer-header">
            <div class="web-seer-title-area">
              <div class="web-seer-logo-icon">📡</div>
              <h3 class="web-seer-title">
                P.R.E.M.-WebSeer™ Real-Time Alternative Data Radar
              </h3>
              <span class="web-seer-badge-primary">4-TIER CRAWLER</span>
              <span class="web-seer-badge-live">LIVE WIRE ACTIVE</span>
            </div>
            <button id="btnWebSeerClose" class="web-seer-close-btn" title="Close Radar">&times;</button>
          </div>

          <!-- Toolbar -->
          <div class="web-seer-toolbar">
            <div class="web-seer-search-row">
              <div class="web-seer-input-wrapper">
                <span class="web-seer-search-icon">🔍</span>
                <input 
                  type="text" 
                  id="inputWebSeerSearch" 
                  class="web-seer-search-input" 
                  placeholder="Crawl news or ticker (e.g. NVDA, Tesla autonomous, Reliance demerger, Adani)..." 
                />
              </div>
              <button id="btnWebSeerCrawl" class="web-seer-btn web-seer-btn-primary">
                <span>⚡</span> Crawl Live News
              </button>
              <button id="btnWebSeerPollToggle" class="web-seer-btn web-seer-btn-secondary">
                <span>🔄</span> Auto-Stream (Off)
              </button>
            </div>

            <div class="web-seer-filters-row">
              <div class="web-seer-pill-group" id="groupCountryFilter">
                <button class="web-seer-pill active" data-country="ALL">All Markets</button>
                <button class="web-seer-pill" data-country="US">🇺🇸 US Equities</button>
                <button class="web-seer-pill" data-country="IN">🇮🇳 Indian Equities</button>
              </div>

              <div class="web-seer-pill-group" id="groupShockFilter">
                <button class="web-seer-pill active" data-shock="ALL">All News</button>
                <button class="web-seer-pill" data-shock="SIGNIFICANT">Jump &ge; 5%</button>
                <button class="web-seer-pill" data-shock="CRITICAL">Critical &ge; 15%</button>
              </div>

              <div class="web-seer-pill-group" id="groupVerificationFilter">
                <button class="web-seer-pill active" data-verif="ALL">All Sources</button>
                <button class="web-seer-pill" data-verif="CONFIRMED_FACT">Confirmed Facts</button>
                <button class="web-seer-pill" data-verif="UNVERIFIED_RUMOR">Rumors Flagged</button>
              </div>
            </div>

            <!-- Historic Scenarios Quick Bar -->
            <div class="web-seer-scenarios-row">
              <span class="web-seer-scenario-label">Benchmark Replay:</span>
              <button class="web-seer-scenario-chip" data-scenario="NVDA_NOV23_JENSEN_REINSTATEMENT">
                ⚡ NVDA CEO Reinstatement (+31.48%)
              </button>
              <button class="web-seer-scenario-chip" data-scenario="TSLA_FSD_UNSUPERVISED_APPROVAL">
                ⚡ Tesla NHTSA Robotaxi Clearance (+23.40%)
              </button>
              <button class="web-seer-scenario-chip" data-scenario="RELIANCE_DEMERGER_VALUE_UNLOCK">
                ⚡ Reliance Demerger Unlock (+18.80%)
              </button>
              <button class="web-seer-scenario-chip" data-scenario="ADANI_SUPREME_COURT_CLEAN_CHIT">
                ⚡ Adani Clean-Chit Vindication (+17.20%)
              </button>
            </div>
          </div>

          <!-- Telemetry Strip -->
          <div class="web-seer-telemetry-strip">
            <div class="web-seer-telemetry-item">
              <span class="web-seer-telemetry-label">Articles Ingested</span>
              <span class="web-seer-telemetry-val" id="valSeerIngested">0</span>
            </div>
            <div class="web-seer-telemetry-item">
              <span class="web-seer-telemetry-label">Active Event Shocks</span>
              <span class="web-seer-telemetry-val" style="color: #34d399;" id="valSeerShocks">0</span>
            </div>
            <div class="web-seer-telemetry-item">
              <span class="web-seer-telemetry-label">Search Velocity Spikes</span>
              <span class="web-seer-telemetry-val" style="color: #38bdf8;" id="valSeerSpikes">0</span>
            </div>
            <div class="web-seer-telemetry-item">
              <span class="web-seer-telemetry-label">Fact vs Rumor Ratio</span>
              <span class="web-seer-telemetry-val" style="color: #fbbf24;" id="valSeerRatio">100% Fact</span>
            </div>
          </div>

          <!-- Main Grid -->
          <div class="web-seer-body">
            <!-- Left: News Feed Pane -->
            <div class="web-seer-feed-pane" id="seerNewsFeed">
              <div style="text-align: center; padding: 40px; color: #64748b;">
                Initialising real-time crawler... Click "Crawl Live News" or select a benchmark replay above.
              </div>
            </div>

            <!-- Right: Detail & Contagion Pane -->
            <div class="web-seer-detail-pane" id="seerDetailPane">
              <div style="text-align: center; padding: 40px; color: #64748b;">
                Select any incoming news alert to inspect quantitative shock decomposition, dealer gamma positioning, and supply-chain contagion.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render news cards in feed pane
   */
  function renderFeed() {
    const feedContainer = document.getElementById('seerNewsFeed');
    if (!feedContainer || !engineInstance) return;

    let alerts = engineInstance.getAlerts({
      country: state.currentCountry !== 'ALL' ? state.currentCountry : null,
      verificationState: state.currentVerification !== 'ALL' ? state.currentVerification : null
    });

    if (state.currentShockFilter === 'SIGNIFICANT') {
      alerts = alerts.filter(a => Math.abs(a.jumpPct) >= 5.0);
    } else if (state.currentShockFilter === 'CRITICAL') {
      alerts = alerts.filter(a => Math.abs(a.jumpPct) >= 15.0);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      alerts = alerts.filter(a => 
        a.headline.toLowerCase().includes(q) || 
        a.symbol.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q)
      );
    }

    // Update telemetry
    state.totalIngested = engineInstance.alertsBuffer.length;
    state.shockCount = engineInstance.alertsBuffer.filter(a => Math.abs(a.jumpPct) >= 5.0).length;
    state.spikeCount = engineInstance.alertsBuffer.filter(a => a.isSearchSpike).length;

    const elIngested = document.getElementById('valSeerIngested');
    const elShocks = document.getElementById('valSeerShocks');
    const elSpikes = document.getElementById('valSeerSpikes');
    const elRatio = document.getElementById('valSeerRatio');

    if (elIngested) elIngested.textContent = state.totalIngested;
    if (elShocks) elShocks.textContent = state.shockCount;
    if (elSpikes) elSpikes.textContent = state.spikeCount;

    if (elRatio && state.totalIngested > 0) {
      const facts = engineInstance.alertsBuffer.filter(a => a.verificationState === 'CONFIRMED_FACT').length;
      const ratio = Math.round((facts / state.totalIngested) * 100);
      elRatio.textContent = `${ratio}% Verified`;
    }

    if (alerts.length === 0) {
      feedContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          No breaking news alerts matching current filters. Try crawling live news or selecting a benchmark scenario.
        </div>
      `;
      return;
    }

    let html = '';
    alerts.forEach(alert => {
      const isSelected = alert.id === state.selectedAlertId;
      const flag = alert.country === 'IN' ? '🇮🇳' : '🇺🇸';
      const moveClass = alert.jumpPct > 0 ? 'move-bull' : (alert.jumpPct < 0 ? 'move-bear' : 'move-flat');
      const moveSign = alert.jumpPct > 0 ? '+' : '';
      
      let catalystClass = 'catalyst-neutral';
      if (alert.polarity > 0) catalystClass = 'catalyst-bullish';
      else if (alert.polarity < 0) catalystClass = 'catalyst-bearish';

      let rumorClass = 'rumor-fact';
      let rumorLabel = 'VERIFIED FACT';
      if (alert.verificationState === 'UNVERIFIED_RUMOR') {
        rumorClass = 'rumor-unverified';
        rumorLabel = 'UNVERIFIED RUMOR';
      } else if (alert.verificationState === 'PROBABLE_DEVELOPMENT') {
        rumorClass = 'rumor-probable';
        rumorLabel = 'PROBABLE';
      }

      html += `
        <div class="web-seer-card ${isSelected ? 'selected' : ''}" data-id="${alert.id}">
          <div class="web-seer-card-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="web-seer-ticker-tag">
                <span class="web-seer-country-flag">${flag}</span>
                ${alert.symbol}
              </span>
              <span class="web-seer-source-tag">
                <span>📰</span> ${alert.sourceName}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="web-seer-rumor-badge ${rumorClass}">${rumorLabel}</span>
              <span class="web-seer-time-ago">${formatTimeAgo(alert.timestamp)}</span>
            </div>
          </div>

          <h4 class="web-seer-headline">${alert.headline}</h4>
          ${alert.description ? `<p class="web-seer-desc">${alert.description}</p>` : ''}

          <div class="web-seer-shock-strip">
            <span class="web-seer-catalyst-pill ${catalystClass}">
              ${alert.catalystType.replace(/_/g, ' ')}
            </span>

            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 11px; color: #94a3b8;">
                Target: <strong style="color: #ffffff;">${formatCurrency(alert.targetPrice, alert.currency)}</strong>
              </span>
              <span class="web-seer-move-badge ${moveClass}">
                ${moveSign}${alert.jumpPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      `;
    });

    feedContainer.innerHTML = html;

    // Attach card click handlers
    feedContainer.querySelectorAll('.web-seer-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        selectAlert(id);
      });
    });

    // Auto-select first card if none selected
    if (!state.selectedAlertId && alerts.length > 0) {
      selectAlert(alerts[0].id);
    }
  }

  /**
   * Render Selected Alert in Right Detail Pane
   */
  function renderDetailPane(alert) {
    const pane = document.getElementById('seerDetailPane');
    if (!pane) return;

    if (!alert) {
      pane.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          Select any alert from the live stream to inspect detailed quantitative jump mechanics.
        </div>
      `;
      return;
    }

    const flag = alert.country === 'IN' ? '🇮🇳' : '🇺🇸';
    const moveSign = alert.jumpPct > 0 ? '+' : '';
    const moveColor = alert.jumpPct > 0 ? '#34d399' : (alert.jumpPct < 0 ? '#fb7185' : '#94a3b8');

    let contagionRows = '';
    if (alert.contagion && alert.contagion.length > 0) {
      alert.contagion.forEach(c => {
        const cSign = c.expectedMovePct > 0 ? '+' : '';
        const cColor = c.expectedMovePct > 0 ? '#34d399' : '#fb7185';
        contagionRows += `
          <tr>
            <td><strong style="color: #38bdf8;">${c.targetSymbol}</strong></td>
            <td style="font-size: 10px; color: #94a3b8;">${c.relationship.replace(/_/g, ' ')}</td>
            <td>${c.directWeight.toFixed(2)}</td>
            <td style="font-weight: 700; color: ${cColor};">${cSign}${c.expectedMovePct.toFixed(2)}%</td>
          </tr>
        `;
      });
    }

    pane.innerHTML = `
      <div class="web-seer-detail-header">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span class="web-seer-ticker-tag">
            <span>${flag}</span> ${alert.symbol} &bull; ${alert.companyName}
          </span>
          <span style="font-size: 11px; color: #94a3b8;">${alert.country === 'IN' ? 'NSE / BSE' : 'NASDAQ / NYSE'}</span>
        </div>
        <h4 class="web-seer-detail-title">${alert.headline}</h4>
        <p class="web-seer-detail-sub">${alert.catalystDescription || ''}</p>
      </div>

      <!-- Quantitative Shock Math Box -->
      <div class="web-seer-math-box">
        <div class="web-seer-math-row">
          <span class="web-seer-math-label">Pre-Event Spot Price:</span>
          <span class="web-seer-math-val">${formatCurrency(alert.prePrice, alert.currency)}</span>
        </div>
        <div class="web-seer-math-row">
          <span class="web-seer-math-label">Predicted Event Target:</span>
          <span class="web-seer-math-val" style="color: ${moveColor};">
            ${formatCurrency(alert.targetPrice, alert.currency)} (${moveSign}${alert.jumpPct.toFixed(2)}%)
          </span>
        </div>
        <div class="web-seer-math-row">
          <span class="web-seer-math-label">Merton Event Score (I_event):</span>
          <span class="web-seer-math-val">${alert.eventScore > 0 ? '+' : ''}${alert.eventScore.toFixed(4)}</span>
        </div>
        <div class="web-seer-math-row">
          <span class="web-seer-math-label">Dealer Gamma Squeeze Multiplier:</span>
          <span class="web-seer-math-val" style="color: #fbbf24;">${alert.gammaMultiplier.toFixed(3)}x (${alert.dealerGexState})</span>
        </div>
        <div class="web-seer-math-row">
          <span class="web-seer-math-label">25-Delta Volatility Skew (xi_skew):</span>
          <span class="web-seer-math-val">${alert.skewBooster.toFixed(4)}</span>
        </div>
        <div class="web-seer-math-row">
          <span class="web-seer-math-label">Source Credibility & Rumor Index:</span>
          <span class="web-seer-math-val" style="color: #38bdf8;">
            Cred: ${(alert.sourceCredibility * 100).toFixed(0)}% | Rumor: ${(alert.rumorIndex * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <!-- Contagion Table -->
      ${contagionRows ? `
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.04em;">
            Global Supply-Chain Contagion Cascade (I - &alpha;A)<sup>-1</sup>
          </div>
          <table class="web-seer-contagion-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Supply Link</th>
                <th>Weight</th>
                <th>Ripple Move</th>
              </tr>
            </thead>
            <tbody>
              ${contagionRows}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="web-seer-actions-bar">
        <button id="btnOpenInEventShockLab" class="web-seer-btn web-seer-btn-primary" style="flex: 1;">
          <span>🔬</span> Open in Event Shock Lab
        </button>
        ${alert.url && alert.url !== '#' ? `
          <a href="${alert.url}" target="_blank" rel="noopener noreferrer" class="web-seer-btn web-seer-btn-secondary" style="text-decoration: none;">
            <span>🔗</span> Source
          </a>
        ` : ''}
      </div>
    `;

    // Hook "Open in Event Shock Lab" button
    const btnLab = pane.querySelector('#btnOpenInEventShockLab');
    if (btnLab) {
      btnLab.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.EventShockLab && typeof window.EventShockLab.openModal === 'function') {
          window.EventShockLab.openModal();
          // Pre-populate if possible
          const modal = document.getElementById('riskosEventShockModal');
          if (modal) {
            const symSelect = modal.querySelector('#eventLabSymbolSelect');
            if (symSelect) {
              symSelect.value = alert.symbol;
              symSelect.dispatchEvent(new Event('change'));
            }
          }
        } else {
          alert('Event Shock Lab loaded in background. Launch from Quant Core Hub.');
        }
      });
    }
  }

  /**
   * Select an alert and re-render panes
   */
  function selectAlert(alertId) {
    state.selectedAlertId = alertId;
    if (!engineInstance) return;

    const alert = engineInstance.alertsBuffer.find(a => a.id === alertId);
    renderFeed();
    renderDetailPane(alert);
  }

  /**
   * Crawl Live Feeds for Universe or Query
   */
  async function crawlFeeds(query) {
    if (!engineInstance) return;
    const q = query || state.searchQuery || 'stock';

    const btn = document.getElementById('btnWebSeerCrawl');
    if (btn) {
      btn.innerHTML = '<span>⏳</span> Crawling Wire...';
      btn.disabled = true;
    }

    try {
      // Parallel fetch Google News RSS & Yahoo Finance for active universe
      const promises = [
        engineInstance.fetchGoogleNewsRss(q, { country: 'US', timeRange: '1d' }),
        engineInstance.fetchGoogleNewsRss(q, { country: 'IN', timeRange: '2d' })
      ];

      // If query is a ticker, also fetch Yahoo Finance
      if (/^[A-Z]{1,10}$/i.test(q.trim())) {
        promises.push(engineInstance.fetchYahooFinanceNews(q.trim().toUpperCase()));
      }

      await Promise.all(promises);
      renderFeed();
    } catch (e) {
      console.error('Error crawling live feeds:', e);
    } finally {
      if (btn) {
        btn.innerHTML = '<span>⚡</span> Crawl Live News';
        btn.disabled = false;
      }
    }
  }

  /**
   * Replay a historical benchmark scenario
   */
  function replayScenario(scenarioId) {
    if (!engineInstance) return;
    const alert = engineInstance.replayScenario(scenarioId);
    if (alert) {
      state.selectedAlertId = alert.id;
      renderFeed();
      renderDetailPane(alert);
    }
  }

  /**
   * Toggle Live Polling Daemon
   */
  function togglePolling() {
    state.isPolling = !state.isPolling;
    const btn = document.getElementById('btnWebSeerPollToggle');

    if (state.isPolling) {
      if (btn) {
        btn.innerHTML = '<span>🟢</span> Auto-Stream (On)';
        btn.style.color = '#34d399';
      }
      // Poll every 25 seconds
      state.pollingIntervalId = setInterval(() => {
        crawlFeeds();
      }, 25000);
      crawlFeeds();
    } else {
      if (btn) {
        btn.innerHTML = '<span>🔄</span> Auto-Stream (Off)';
        btn.style.color = '#cbd5e1';
      }
      if (state.pollingIntervalId) {
        clearInterval(state.pollingIntervalId);
        state.pollingIntervalId = null;
      }
    }
  }

  /**
   * Initialize DOM & Event Listeners
   */
  function init() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('riskosWebSeerModal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', buildModalHtml());
      modal = document.getElementById('riskosWebSeerModal');
    }

    // Close button
    const btnClose = document.getElementById('btnWebSeerClose');
    if (btnClose) {
      btnClose.addEventListener('click', () => WebSeerTerminal.close());
    }

    // Background backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) WebSeerTerminal.close();
    });

    // Crawl button
    const btnCrawl = document.getElementById('btnWebSeerCrawl');
    if (btnCrawl) {
      btnCrawl.addEventListener('click', () => {
        const query = (document.getElementById('inputWebSeerSearch')?.value || '').trim();
        crawlFeeds(query);
      });
    }

    // Input Enter key
    const inputSearch = document.getElementById('inputWebSeerSearch');
    if (inputSearch) {
      inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          crawlFeeds(inputSearch.value.trim());
        }
      });
    }

    // Polling toggle
    const btnPoll = document.getElementById('btnWebSeerPollToggle');
    if (btnPoll) {
      btnPoll.addEventListener('click', togglePolling);
    }

    // Country filters
    const groupCountry = document.getElementById('groupCountryFilter');
    if (groupCountry) {
      groupCountry.querySelectorAll('.web-seer-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          groupCountry.querySelectorAll('.web-seer-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.currentCountry = btn.getAttribute('data-country');
          renderFeed();
        });
      });
    }

    // Shock filters
    const groupShock = document.getElementById('groupShockFilter');
    if (groupShock) {
      groupShock.querySelectorAll('.web-seer-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          groupShock.querySelectorAll('.web-seer-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.currentShockFilter = btn.getAttribute('data-shock');
          renderFeed();
        });
      });
    }

    // Verification filters
    const groupVerif = document.getElementById('groupVerificationFilter');
    if (groupVerif) {
      groupVerif.querySelectorAll('.web-seer-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          groupVerif.querySelectorAll('.web-seer-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.currentVerification = btn.getAttribute('data-verif');
          renderFeed();
        });
      });
    }

    // Replay chips
    document.querySelectorAll('.web-seer-scenario-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const scenarioId = chip.getAttribute('data-scenario');
        replayScenario(scenarioId);
      });
    });

    // Subscribe to engine events
    if (engineInstance) {
      engineInstance.on('news', () => {
        if (state.isOpen) renderFeed();
      });
    }
  }

  // Public Interface
  const WebSeerTerminal = {
    init,
    open: function () {
      init();
      const modal = document.getElementById('riskosWebSeerModal');
      if (modal) {
        modal.style.display = 'flex';
        state.isOpen = true;

        // If buffer is empty, seed with historic NVIDIA replay
        if (engineInstance && engineInstance.alertsBuffer.length === 0) {
          replayScenario('NVDA_NOV23_JENSEN_REINSTATEMENT');
        } else {
          renderFeed();
        }
      }
    },
    close: function () {
      const modal = document.getElementById('riskosWebSeerModal');
      if (modal) {
        modal.style.display = 'none';
        state.isOpen = false;
      }
    },
    crawl: crawlFeeds,
    replay: replayScenario,
    getEngine: () => engineInstance
  };

  // Auto-init on DOMContentLoaded if in browser
  if (typeof window !== 'undefined') {
    window.WebSeerTerminal = WebSeerTerminal;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return WebSeerTerminal;
}));
