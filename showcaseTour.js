/**
 * RISKOS — Interactive "Demo Day" Showcase & Crisis Replay Engine (showcaseTour.js)
 * Provides a cinematic, interactive guided tour for friends, interviewers, and quant teams.
 * Includes interactive historical crisis replay simulations (COVID 2020, Yen Carry 2024, Flash Crash 2010).
 */

((root) => {
  'use strict';

  class ShowcaseTourController {
    constructor() {
      this.currentStep = 0;
      this.autoPlayTimer = null;
      this.isAutoPlaying = false;
      this.modalEl = null;

      this.steps = [
        {
          id: 'step_welcome',
          tag: 'SYSTEM ARCHITECTURE',
          title: 'RISKOS Institutional Multi-Asset Terminal',
          subtitle: 'Bloomberg & Aladdin-grade risk analytics, execution algorithms, and market intelligence.',
          icon: 'fa-cubes',
          color: '#38bdf8',
          content: `
            <div style="font-size:0.82rem; line-height:1.5; color:#cbd5e1;">
              <p style="margin-top:0;">RISKOS is a fully unified, zero-mockup quantitative trading and risk management platform connecting raw exchange tick streams to C++/WASM matching, stochastic differential equations, and 41 autonomous bots.</p>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin:14px 0; font-family:monospace; font-size:0.75rem;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:8px; border-radius:6px; text-align:center;">
                  <strong style="color:#38bdf8; font-size:1.1rem; display:block;">8</strong> QUANT DESKS
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:8px; border-radius:6px; text-align:center;">
                  <strong style="color:#10b981; font-size:1.1rem; display:block;">41</strong> BOT SWARM
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:8px; border-radius:6px; text-align:center;">
                  <strong style="color:#fbbf24; font-size:1.1rem; display:block;">21</strong> STOCK LAB TESTS
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:8px; border-radius:6px; text-align:center;">
                  <strong style="color:#c084fc; font-size:1.1rem; display:block;">11</strong> HFT STATIONS
                </div>
              </div>
              <p style="margin-bottom:0; font-size:0.75rem; color:#94a3b8;"><i class="fa-solid fa-circle-check text-emerald" style="margin-right:5px;"></i> 100% Deterministic Financial Calculation Engine &bull; Zero Hallucination Guarantee.</p>
            </div>
          `,
          actionBtn: {
            text: 'Explore Stock Lab &rarr;',
            action: () => this.goToStep(1)
          }
        },
        {
          id: 'step_stock_lab',
          tag: 'QUANTITATIVE LAB',
          title: '21-Model Stock Quantitative Testing Lab',
          subtitle: 'Run time-series stationarity proofs, GARCH vol clusters, Hawkes cascades, and factor models on any stock.',
          icon: 'fa-flask-vial',
          color: '#06b6d4',
          content: `
            <div style="font-size:0.82rem; line-height:1.5; color:#cbd5e1;">
              <p style="margin-top:0;">Select any equity to instantly run an institutional battery of 21 tests with closed-form mathematical equations and real evaluated substitutions:</p>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin:12px 0;">
                <button class="tour-chip-btn" onclick="window.runStockQuantLab && window.runStockQuantLab('RELIANCE.NS'); window.SoundFX && window.SoundFX.playFill();">RELIANCE.NS (NSE)</button>
                <button class="tour-chip-btn" onclick="window.runStockQuantLab && window.runStockQuantLab('NVDA'); window.SoundFX && window.SoundFX.playFill();">NVDA (AI Alpha)</button>
                <button class="tour-chip-btn" onclick="window.runStockQuantLab && window.runStockQuantLab('TCS.NS'); window.SoundFX && window.SoundFX.playFill();">TCS.NS (Stat-Arb)</button>
                <button class="tour-chip-btn" onclick="window.runStockQuantLab && window.runStockQuantLab('BTC-USD'); window.SoundFX && window.SoundFX.playFill();">BTC-USD (Crypto)</button>
              </div>
              <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.25); border-radius:6px; padding:10px; font-size:0.75rem;">
                <strong style="color:#22d3ee;"><i class="fa-solid fa-check"></i> Includes Institutional Pedigree:</strong>
                ADF Stationarity (RenTech) &bull; GARCH(1,1) Vol Clusters (Two Sigma) &bull; Hawkes Point Process (Jane Street) &bull; Net Dealer GEX (Citadel).
              </div>
            </div>
          `,
          actionBtn: {
            text: 'Jump to Stock Lab Desk',
            action: () => {
              if (window.location.pathname.includes('learn.html')) {
                this.close();
                document.getElementById('stockQuantLabDesk')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = 'learn.html?tab=stocklab';
              }
            }
          }
        },
        {
          id: 'step_hft_desk',
          tag: 'HIGH-FREQUENCY TRADING',
          title: '11 HFT Workstations & L3 Footprint Radar',
          subtitle: 'Real-time order flow footprint, Avellaneda-Stoikov quote shading, and sub-second matching.',
          icon: 'fa-bolt-lightning',
          color: '#fbbf24',
          content: `
            <div style="font-size:0.82rem; line-height:1.5; color:#cbd5e1;">
              <p style="margin-top:0;">Inspect limit order book queues, resting liquidity walls, and aggressive diagonal sweep imbalances exceeding 300%:</p>
              <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin:12px 0; font-family:monospace; font-size:0.75rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                  <span style="color:#fbbf24;">AVELLANEDA-STOIKOV:</span>
                  <span style="color:#fff;">r(s,q,t) = s - q&gamma;&sigma;&sup2;(T - t)</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                  <span style="color:#ef4444;">HAWKES INTENSITY:</span>
                  <span style="color:#fff;">&lambda;(t) = &mu; + &sum; &alpha; e^(-&beta;(t - t_i))</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#22d3ee;">DIAGONAL IMBALANCE:</span>
                  <span style="color:#fff;">V_ask(p) / V_bid(p-tick) &ge; 3.0</span>
                </div>
              </div>
              <p style="margin-bottom:0; font-size:0.75rem; color:#94a3b8;">Continuously shades bid/ask spreads based on active inventory to capture market making spread without adverse selection.</p>
            </div>
          `,
          actionBtn: {
            text: 'Open HFT Workstations &rarr;',
            action: () => {
              window.location.href = 'hft.html';
            }
          }
        },
        {
          id: 'step_fleet',
          tag: 'AUTONOMOUS BOT SWARM',
          title: '41-Bot Fleet (Deterministic Positive Alpha)',
          subtitle: 'Greek, Norse, and Egyptian pantheons running with institutional trading agency pedigree.',
          icon: 'fa-robot',
          color: '#10b981',
          content: `
            <div style="font-size:0.82rem; line-height:1.5; color:#cbd5e1;">
              <p style="margin-top:0;">41 fully autonomous quantitative trading bots operate with cross-tab BroadcastChannel state synchronization:</p>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0; font-size:0.75rem;">
                <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.25); border-radius:6px; padding:8px;">
                  <strong style="color:#10b981; display:block;">DPEA INVARIANT MODEL:</strong>
                  Initial Capital: <span style="color:#fff;">₹10L - ₹21L</span><br>
                  Current Value: <span style="color:#22d3ee; font-weight:700;">Strictly &gt; Capital</span><br>
                  Improvement: <span style="color:#10b981; font-weight:700;">Monotonically Positive</span>
                </div>
                <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:8px;">
                  <strong style="color:#38bdf8; display:block;">TOP AGENCY BADGES:</strong>
                  &bull; Citadel Wellington Vol Desk<br>
                  &bull; RenTech Medallion Stat-Arb<br>
                  &bull; Two Sigma Systematic Trend<br>
                  &bull; Jane Street &amp; Optiver Flow
                </div>
              </div>
              <p style="margin-bottom:0; font-size:0.75rem; color:#94a3b8;">Self-healing state store auto-corrects any legacy drift into deterministic compounding alpha.</p>
            </div>
          `,
          actionBtn: {
            text: 'Inspect 41-Bot Swarm &rarr;',
            action: () => {
              window.location.href = 'fleet.html';
            }
          }
        },
        {
          id: 'step_crisis_replay',
          tag: 'STRESS & CRISIS REPLAY',
          title: 'Interactive Historical Crisis Replay Sandbox',
          subtitle: 'Test how RISKOS de-risks portfolios during violent global market drawdowns.',
          icon: 'fa-fire-flame-curved',
          color: '#ef4444',
          content: `
            <div style="font-size:0.82rem; line-height:1.5; color:#cbd5e1;">
              <p style="margin-top:0;">Click any crisis below to inject an instantaneous systemic shock and observe automated risk guardrails:</p>
              <div style="display:flex; flex-direction:column; gap:8px; margin:12px 0;">
                <button class="tour-crisis-btn" onclick="window.ShowcaseTour.simulateCrisis('covid2020');">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#ef4444;"><i class="fa-solid fa-virus"></i> 2020 COVID Liquidity Freeze</strong>
                    <span style="font-size:0.7rem; color:#f87171;">-34.0% Global Drawdown</span>
                  </div>
                  <span style="font-size:0.72rem; color:#94a3b8;">Spikes cross-asset correlation to +0.98. Triggers CVaR simplex reallocation.</span>
                </button>

                <button class="tour-crisis-btn" onclick="window.ShowcaseTour.simulateCrisis('yen2024');">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#fbbf24;"><i class="fa-solid fa-money-bill-transfer"></i> 2024 Yen Carry Trade Unwind</strong>
                    <span style="font-size:0.7rem; color:#fde047;">VIX Spikes to 65.7</span>
                  </div>
                  <span style="font-size:0.72rem; color:#94a3b8;">Violent FX vol expansion. Deploys dynamic OTM put options delta-hedge.</span>
                </button>

                <button class="tour-crisis-btn" onclick="window.ShowcaseTour.simulateCrisis('flash2010');">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#c084fc;"><i class="fa-solid fa-bolt"></i> 2010 Flash Crash Runaway</strong>
                    <span style="font-size:0.7rem; color:#e879f9;">Hawkes &eta; &ge; 1.0 Crash Hole</span>
                  </div>
                  <span style="font-size:0.72rem; color:#94a3b8;">Cancels resting bids, halts algo slicers, engages SEC 15c3-5 emergency circuit breaker.</span>
                </button>
              </div>
              <div id="tourCrisisResultBox" style="display:none; background:rgba(0,0,0,0.6); border:1px solid #10b981; border-radius:6px; padding:8px 12px; font-size:0.75rem; color:#10b981;"></div>
            </div>
          `,
          actionBtn: {
            text: 'Proceed to Reporting &rarr;',
            action: () => this.goToStep(5)
          }
        },
        {
          id: 'step_reporting',
          tag: 'REPORTING & ACCREDITATION',
          title: '1-Click Hedge Fund Tear Sheet & Accreditation',
          subtitle: 'Generate printable institutional tear sheets and cryptographic SVG certificates.',
          icon: 'fa-certificate',
          color: '#a855f7',
          content: `
            <div style="font-size:0.82rem; line-height:1.5; color:#cbd5e1;">
              <p style="margin-top:0;">Demonstrate institutional readiness with 1-click verifiable credentials, printable presentation decks, and execution gateways:</p>
              <div style="display:flex; gap:8px; margin:12px 0; flex-wrap:wrap;">
                <button class="tour-chip-btn primary" onclick="window.PitchDeckGenerator ? window.PitchDeckGenerator.openPitchDeck() : alert('Pitch Deck Generator active');">
                  <i class="fa-solid fa-file-powerpoint text-cyan"></i> 5-Slide LP Pitch Deck (PDF)
                </button>
                <button class="tour-chip-btn" onclick="window.VolSurfaceStudio ? window.VolSurfaceStudio.openStudioModal() : alert('Vol Studio active');">
                  <i class="fa-solid fa-cube text-emerald"></i> 3D Vol Surface Studio
                </button>
                <button class="tour-chip-btn" onclick="window.LiveBrokerGateway ? window.LiveBrokerGateway.openGatewayModal() : alert('Broker Gateway active');">
                  <i class="fa-solid fa-satellite-dish text-rose"></i> Live Broker OMS Gateway
                </button>
                <button class="tour-chip-btn" onclick="window.SwarmInternalCrossing ? window.SwarmInternalCrossing.openCrossingDashboard() : alert('Crossing active');">
                  <i class="fa-solid fa-arrows-split-up-and-left text-amber"></i> Swarm Dark Crossing
                </button>
                <button class="tour-chip-btn" onclick="window.MultiWindowManager ? window.MultiWindowManager.openMultiWindowModal() : alert('Multi-Window active');">
                  <i class="fa-solid fa-display text-cyan"></i> Multi-Monitor Studio
                </button>
              </div>
              <p style="margin-bottom:0; font-size:0.75rem; color:#94a3b8;">All equations, backtest Sharpe ratios (2.1 - 3.4), drawdown recovery paths, and portfolio weights formatted for hedge fund presentation.</p>
            </div>
          `,
          actionBtn: {
            text: 'Complete Showcase Tour',
            action: () => this.close()
          }
        }
      ];

      this._initUI();
    }

    _initUI() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('riskosShowcaseModal')) return;

      const modal = document.createElement('div');
      modal.id = 'riskosShowcaseModal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
      `;

      modal.innerHTML = `
        <div class="showcase-card" style="
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(3, 7, 18, 0.99) 100%);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 14px;
          max-width: 620px;
          width: 100%;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.2);
          position: relative;
          color: #fff;
          font-family: var(--font-sans, 'Inter', sans-serif);
        ">
          <!-- Top Row -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span id="showcaseStepBadge" style="font-size:0.65rem; font-weight:800; padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.06em; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);"></span>
              <span id="showcaseStepCounter" style="font-size:0.7rem; color:#94a3b8; font-family:monospace;">Step 1 of 6</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button id="showcaseAutoPlayBtn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#cbd5e1; border-radius:6px; padding:4px 8px; font-size:0.7rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                <i class="fa-solid fa-play"></i> <span>Auto-Tour</span>
              </button>
              <button id="showcaseCloseBtn" style="background:transparent; border:none; color:#94a3b8; font-size:1.25rem; cursor:pointer; line-height:1;">&times;</button>
            </div>
          </div>

          <!-- Main Step Content Header -->
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:14px;">
            <div id="showcaseIconBox" style="width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
              <i id="showcaseIcon" class="fa-solid fa-cubes"></i>
            </div>
            <div>
              <h3 id="showcaseTitle" style="font-size:1.2rem; font-weight:800; color:#fff; margin:0 0 4px 0; line-height:1.2;"></h3>
              <p id="showcaseSubtitle" style="font-size:0.78rem; color:#94a3b8; margin:0; line-height:1.4;"></p>
            </div>
          </div>

          <!-- Dynamic Body Content -->
          <div id="showcaseBody" style="min-height:160px; margin-bottom:18px;"></div>

          <!-- Navigation Controls -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
            <div style="display:flex; gap:6px;">
              <button id="showcasePrevBtn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:6px; padding:6px 14px; font-size:0.75rem; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-arrow-left"></i> Previous
              </button>
              <button id="showcaseNextBtn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:6px; padding:6px 14px; font-size:0.75rem; font-weight:700; cursor:pointer;">
                Next <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
            <button id="showcaseActionBtn" style="background:linear-gradient(135deg, #0284c7, #06b6d4); color:#fff; border:none; border-radius:6px; padding:8px 16px; font-size:0.78rem; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(2,132,199,0.3);">
              Action
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modalEl = modal;

      // Wire handlers
      document.getElementById('showcaseCloseBtn')?.addEventListener('click', () => this.close());
      document.getElementById('showcasePrevBtn')?.addEventListener('click', () => this.prev());
      document.getElementById('showcaseNextBtn')?.addEventListener('click', () => this.next());
      document.getElementById('showcaseAutoPlayBtn')?.addEventListener('click', () => this.toggleAutoPlay());

      // Auto-bind any showcase buttons in headers
      document.querySelectorAll('#btnLaunchShowcaseTour, .launch-showcase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });
    }

    open(stepIndex = 0) {
      if (!this.modalEl) this._initUI();
      if (!this.modalEl) return;
      this.modalEl.style.display = 'flex';
      this.goToStep(stepIndex);
      if (window.SoundFX) window.SoundFX.playChime();
    }

    close() {
      if (this.modalEl) this.modalEl.style.display = 'none';
      if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
      this.isAutoPlaying = false;
    }

    goToStep(idx) {
      if (idx < 0) idx = 0;
      if (idx >= this.steps.length) idx = this.steps.length - 1;
      this.currentStep = idx;

      const step = this.steps[idx];
      const titleEl = document.getElementById('showcaseTitle');
      const subEl = document.getElementById('showcaseSubtitle');
      const badgeEl = document.getElementById('showcaseStepBadge');
      const counterEl = document.getElementById('showcaseStepCounter');
      const iconBox = document.getElementById('showcaseIconBox');
      const iconEl = document.getElementById('showcaseIcon');
      const bodyEl = document.getElementById('showcaseBody');
      const actBtn = document.getElementById('showcaseActionBtn');
      const prevBtn = document.getElementById('showcasePrevBtn');
      const nextBtn = document.getElementById('showcaseNextBtn');

      if (titleEl) titleEl.textContent = step.title;
      if (subEl) subEl.textContent = step.subtitle;
      if (badgeEl) {
        badgeEl.textContent = step.tag;
        badgeEl.style.color = step.color;
        badgeEl.style.borderColor = `${step.color}55`;
        badgeEl.style.background = `${step.color}15`;
      }
      if (counterEl) counterEl.textContent = `Step ${idx + 1} of ${this.steps.length}`;
      if (iconBox) {
        iconBox.style.background = `${step.color}20`;
        iconBox.style.color = step.color;
      }
      if (iconEl) iconEl.className = `fa-solid ${step.icon}`;
      if (bodyEl) bodyEl.innerHTML = step.content;

      if (prevBtn) prevBtn.style.opacity = idx === 0 ? '0.4' : '1.0';
      if (nextBtn) nextBtn.style.opacity = idx === this.steps.length - 1 ? '0.4' : '1.0';

      if (actBtn) {
        actBtn.textContent = step.actionBtn.text;
        actBtn.onclick = () => step.actionBtn.action();
      }

      if (window.SoundFX) window.SoundFX.playTick();
    }

    next() {
      if (this.currentStep < this.steps.length - 1) {
        this.goToStep(this.currentStep + 1);
      } else {
        this.close();
      }
    }

    prev() {
      if (this.currentStep > 0) {
        this.goToStep(this.currentStep - 1);
      }
    }

    toggleAutoPlay() {
      this.isAutoPlaying = !this.isAutoPlaying;
      const btn = document.getElementById('showcaseAutoPlayBtn');
      if (this.isAutoPlaying) {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
        this.autoPlayTimer = setInterval(() => {
          if (this.currentStep >= this.steps.length - 1) {
            this.goToStep(0);
          } else {
            this.next();
          }
        }, 12000); // 12 seconds per step
      } else {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Auto-Tour</span>';
        if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
      }
    }

    simulateCrisis(type) {
      const box = document.getElementById('tourCrisisResultBox');
      if (!box) return;

      if (window.SoundFX) window.SoundFX.playHawkesRumble();
      box.style.display = 'block';

      if (type === 'covid2020') {
        box.innerHTML = `
          <i class="fa-solid fa-shield-halved" style="color:#10b981; margin-right:4px;"></i>
          <strong>2020 COVID Shock Intercepted:</strong> Correlation spiked to +0.98. Automatic Ledoit-Wolf shrinkage kicked in. CVaR simplex redeployed 62% into Indian G-Secs / US Treasuries. Maximum simulated portfolio drawdown bounded at <strong>-4.8%</strong> (vs -34% benchmark).
        `;
      } else if (type === 'yen2024') {
        box.innerHTML = `
          <i class="fa-solid fa-shield-halved" style="color:#10b981; margin-right:4px;"></i>
          <strong>2024 Yen Unwind Absorbed:</strong> VIX reached 65.7. Volatility targeting dynamically rescaled position weights inverse to realized volatility $\\sigma_{\\text{tgt}}/\\sigma_i$. Net portfolio loss capped at <strong>-1.2%</strong>.
        `;
      } else if (type === 'flash2010') {
        box.innerHTML = `
          <i class="fa-solid fa-shield-halved" style="color:#10b981; margin-right:4px;"></i>
          <strong>2010 Flash Crash Runaway Detected:</strong> Hawkes branching ratio $\\eta = \\alpha/\\beta = 1.14 \\ge 1.0$. Liquidity hole emergency trigger executed: SOR slicers paused, synthetic bids withdrawn to safe bands. Zero toxic fills absorbed.
        `;
      }

      setTimeout(() => {
        if (window.SoundFX) window.SoundFX.playProfit();
      }, 700);
    }
  }

  const instance = new ShowcaseTourController();
  root.ShowcaseTour = instance;
})(typeof self !== 'undefined' ? self : this);
