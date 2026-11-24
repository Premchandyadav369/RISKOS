/**
 * RISKOS P.R.E.M.-Event Interactive Laboratory Workbench
 * ==============================================================================
 * Discontinuous Jump, Corporate Shock & Dealer Gamma Squeeze Simulator
 * Architect: Premchand Yadav
 * Module: eventShockLab.js
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./premEventShockEngine', './eventSurveillanceEngine'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const PremEventShockEngine = require('./premEventShockEngine.js');
    const EventSurveillanceEngine = require('./eventSurveillanceEngine.js');
    module.exports = factory(PremEventShockEngine, EventSurveillanceEngine);
  } else {
    root.EventShockLab = factory(root.PremEventShockEngine, root.EventSurveillanceEngine);
  }
}(typeof self !== 'undefined' ? self : this, function (PremEventShockEngine, EventSurveillanceEngine) {
  'use strict';

  class EventShockLabWorkbench {
    constructor() {
      this.state = {
        symbol: 'NVDA',
        preEventPrice: 125.53,
        beta: 1.85,
        catalystType: 'LEADERSHIP_REVERSAL',
        confidence: 0.98,
        regulatoryClearance: true,
        revenueSurprisePct: 18.5,
        guidanceRaisePct: 15.0,
        netGexMillions: -5200,
        riskReversal25d: 11.2,
        atmIv: 0.52
      };

      this.presets = {
        nvda_reinstatement: {
          name: '2026 NVIDIA Jensen Reinstatement (+31.5%)',
          symbol: 'NVDA',
          preEventPrice: 125.53,
          beta: 1.85,
          catalystType: 'LEADERSHIP_REVERSAL',
          confidence: 0.98,
          regulatoryClearance: true,
          revenueSurprisePct: 18.5,
          guidanceRaisePct: 15.0,
          netGexMillions: -5200,
          riskReversal25d: 11.2,
          atmIv: 0.52
        },
        tsla_autonomous: {
          name: '2025 Tesla FSD NHTSA Federal Clearance (+11.5%)',
          symbol: 'TSLA',
          preEventPrice: 345.82,
          beta: 2.10,
          catalystType: 'REGULATORY_CLEARANCE',
          confidence: 0.92,
          regulatoryClearance: true,
          revenueSurprisePct: 8.0,
          guidanceRaisePct: 12.0,
          netGexMillions: -3800,
          riskReversal25d: 9.4,
          atmIv: 0.62
        },
        reliance_demerger: {
          name: '2024 Reliance Jio & Retail Spinoff Filing (+5.0%)',
          symbol: 'RELIANCE',
          preEventPrice: 1287.00,
          beta: 1.08,
          catalystType: 'CORPORATE_RESTRUCTURING',
          confidence: 0.95,
          regulatoryClearance: true,
          revenueSurprisePct: 5.5,
          guidanceRaisePct: 8.0,
          netGexMillions: -1800,
          riskReversal25d: 5.8,
          atmIv: 0.24
        }
      };
    }

    openModal(presetKey = null) {
      if (typeof document === 'undefined') return;

      if (presetKey && this.presets[presetKey]) {
        this.state = { ...this.presets[presetKey] };
      }

      let modal = document.getElementById('riskosEventShockModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'riskosEventShockModal';
        document.body.appendChild(modal);
      }

      this.render(modal);
      this.attachListeners(modal);
      this.recalculate();
    }

    closeModal() {
      const modal = document.getElementById('riskosEventShockModal');
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }

    render(modal) {
      modal.innerHTML = `
        <div class="event-lab-dialog" role="dialog" aria-modal="true" aria-label="Event Shock Lab">
          <div class="event-lab-header">
            <div class="event-lab-title-area">
              <div class="event-lab-logo-icon"><i class="fa-solid fa-bolt-lightning"></i></div>
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-weight:800; font-size:15px; color:#fff; letter-spacing:0.02em;">P.R.E.M.-EVENT SHOCK &amp; GAMMA SQUEEZE LAB</span>
                  <span class="event-lab-badge">DISCONTINUOUS JUMP CORE</span>
                </div>
                <div style="font-size:11px; color:#94a3b8;">Merton Jump-Diffusion &bull; Options Volatility Skew &bull; Dealer Net GEX &bull; Supply Chain Contagion Graph</div>
              </div>
            </div>
            <button class="event-lab-close-btn" id="eventLabCloseBtn" title="Close Workbench">&times;</button>
          </div>

          <div class="event-lab-body">
            <!-- Presets Bar -->
            <div class="event-preset-strip">
              <span style="font-size:11px; font-weight:700; color:#64748b; align-self:center; margin-right:4px;">REPLAY SCENARIOS:</span>
              <button class="event-preset-btn" data-preset="nvda_reinstatement"><i class="fa-solid fa-microchip" style="color:#10b981;"></i> NVIDIA Huang Reinstatement (+31.5%)</button>
              <button class="event-preset-btn" data-preset="tsla_autonomous"><i class="fa-solid fa-car" style="color:#38bdf8;"></i> Tesla Autonomous Clearance (+11.5%)</button>
              <button class="event-preset-btn" data-preset="reliance_demerger"><i class="fa-solid fa-building-columns" style="color:#f59e0b;"></i> Reliance Retail/Jio Demerger (+5.0%)</button>
            </div>

            <div class="event-lab-grid">
              <!-- Controls Column -->
              <div class="event-lab-card">
                <div class="event-lab-card-title"><i class="fa-solid fa-sliders"></i> Event Shock Parameters</div>
                
                <div class="event-control-group">
                  <label class="event-control-label" for="inpEventSymbol">Target Asset Ticker</label>
                  <input type="text" id="inpEventSymbol" class="event-input" value="${this.state.symbol}" />
                </div>

                <div class="event-control-group">
                  <div class="event-control-label">
                    <span>Pre-Event Price (S0)</span>
                    <span id="valEventPrice" class="event-control-val">${this.state.preEventPrice}</span>
                  </div>
                  <input type="range" id="sliderEventPrice" class="event-slider" min="10" max="2000" step="1" value="${this.state.preEventPrice}" />
                </div>

                <div class="event-control-group">
                  <label class="event-control-label" for="selCatalystType">Catalyst Type</label>
                  <select id="selCatalystType" class="event-select">
                    <option value="LEADERSHIP_REVERSAL" ${this.state.catalystType === 'LEADERSHIP_REVERSAL' ? 'selected' : ''}>C-Suite Leadership Reversal</option>
                    <option value="REGULATORY_CLEARANCE" ${this.state.catalystType === 'REGULATORY_CLEARANCE' ? 'selected' : ''}>Federal / Regulatory Clearance</option>
                    <option value="CORPORATE_RESTRUCTURING" ${this.state.catalystType === 'CORPORATE_RESTRUCTURING' ? 'selected' : ''}>Spinoff / Demerger / M&amp;A</option>
                    <option value="EARNINGS_SURPRISE" ${this.state.catalystType === 'EARNINGS_SURPRISE' ? 'selected' : ''}>Major Revenue / Guidance Beat</option>
                    <option value="ANTITRUST_INJUNCTION" ${this.state.catalystType === 'ANTITRUST_INJUNCTION' ? 'selected' : ''}>Hostile Antitrust / Injunction</option>
                  </select>
                </div>

                <div class="event-control-group">
                  <div class="event-control-label">
                    <span>Dealer Net Gamma (GEX $M)</span>
                    <span id="valNetGex" class="event-control-val">${this.state.netGexMillions}M</span>
                  </div>
                  <input type="range" id="sliderNetGex" class="event-slider" min="-8000" max="4000" step="100" value="${this.state.netGexMillions}" />
                  <div style="font-size:9px; color:#64748b;">Negative GEX = Short Gamma Acceleration Zone</div>
                </div>

                <div class="event-control-group">
                  <div class="event-control-label">
                    <span>Options 25d Skew (RR25 %)</span>
                    <span id="valRiskReversal" class="event-control-val">+${this.state.riskReversal25d}%</span>
                  </div>
                  <input type="range" id="sliderRiskReversal" class="event-slider" min="-10" max="25" step="0.5" value="${this.state.riskReversal25d}" />
                </div>
              </div>

              <!-- Output & Contagion Column -->
              <div style="display:flex; flex-direction:column; gap:16px;">
                <!-- Quantitative Stat Displays -->
                <div class="event-stat-grid">
                  <div class="event-stat-box" style="border-color:rgba(244,63,94,0.35);">
                    <div class="event-stat-label">Predicted Jump Target</div>
                    <div class="event-stat-val" id="statTargetPrice" style="color:#fb7185;">$165.53</div>
                    <div class="event-stat-sub" id="statExpectedMove">+31.87% Discontinuity</div>
                  </div>

                  <div class="event-stat-box" style="border-color:rgba(56,189,248,0.35);">
                    <div class="event-stat-label">Gamma Squeeze Multiplier</div>
                    <div class="event-stat-val" id="statGammaMult" style="color:#38bdf8;">2.54x</div>
                    <div class="event-stat-sub" id="statDealerState">ACUTE_GAMMA_SQUEEZE</div>
                  </div>

                  <div class="event-stat-box" style="border-color:rgba(16,185,129,0.35);">
                    <div class="event-stat-label">Jump Probability</div>
                    <div class="event-stat-val" id="statJumpProb" style="color:#10b981;">98.0%</div>
                    <div class="event-stat-sub" id="statCatalystScore">Catalyst Score: 1.00 / 1.00</div>
                  </div>
                </div>

                <!-- Mathematical Equation Card -->
                <div class="event-lab-card" style="padding:10px 14px;">
                  <div class="event-lab-card-title"><i class="fa-solid fa-square-root-variable"></i> Master Discontinuous Jump Formulation</div>
                  <div id="eventMathContainer" style="overflow-x:auto; padding:4px 0; color:#cbd5e1; font-size:12px;"></div>
                </div>

                <!-- Global Supply Chain Contagion Table -->
                <div class="event-lab-card">
                  <div class="event-lab-card-title"><i class="fa-solid fa-network-wired"></i> Global Knowledge Graph Supply-Chain Contagion</div>
                  <div style="overflow-x:auto;">
                    <table class="event-contagion-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Relationship</th>
                          <th>Network Weight</th>
                          <th>Predicted Move</th>
                          <th>Confidence</th>
                        </tr>
                      </thead>
                      <tbody id="contagionTableBody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    attachListeners(modal) {
      modal.querySelector('#eventLabCloseBtn').addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      // Preset buttons
      modal.querySelectorAll('.event-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-preset');
          if (this.presets[key]) {
            this.state = { ...this.presets[key] };
            this.updateInputDOM(modal);
            this.recalculate();
          }
        });
      });

      // Inputs
      const inpSymbol = modal.querySelector('#inpEventSymbol');
      inpSymbol.addEventListener('input', () => {
        this.state.symbol = inpSymbol.value.toUpperCase().trim();
        this.recalculate();
      });

      const sPrice = modal.querySelector('#sliderEventPrice');
      sPrice.addEventListener('input', () => {
        this.state.preEventPrice = parseFloat(sPrice.value);
        modal.querySelector('#valEventPrice').textContent = this.state.preEventPrice;
        this.recalculate();
      });

      const selCat = modal.querySelector('#selCatalystType');
      selCat.addEventListener('change', () => {
        this.state.catalystType = selCat.value;
        this.recalculate();
      });

      const sGex = modal.querySelector('#sliderNetGex');
      sGex.addEventListener('input', () => {
        this.state.netGexMillions = parseFloat(sGex.value);
        modal.querySelector('#valNetGex').textContent = `${this.state.netGexMillions}M`;
        this.recalculate();
      });

      const sRR = modal.querySelector('#sliderRiskReversal');
      sRR.addEventListener('input', () => {
        this.state.riskReversal25d = parseFloat(sRR.value);
        modal.querySelector('#valRiskReversal').textContent = `${this.state.riskReversal25d >= 0 ? '+' : ''}${this.state.riskReversal25d}%`;
        this.recalculate();
      });
    }

    updateInputDOM(modal) {
      modal.querySelector('#inpEventSymbol').value = this.state.symbol;
      modal.querySelector('#sliderEventPrice').value = this.state.preEventPrice;
      modal.querySelector('#valEventPrice').textContent = this.state.preEventPrice;
      modal.querySelector('#selCatalystType').value = this.state.catalystType;
      modal.querySelector('#sliderNetGex').value = this.state.netGexMillions;
      modal.querySelector('#valNetGex').textContent = `${this.state.netGexMillions}M`;
      modal.querySelector('#sliderRiskReversal').value = this.state.riskReversal25d;
      modal.querySelector('#valRiskReversal').textContent = `${this.state.riskReversal25d >= 0 ? '+' : ''}${this.state.riskReversal25d}%`;
    }

    recalculate() {
      const modal = document.getElementById('riskosEventShockModal');
      if (!modal) return;

      const engine = PremEventShockEngine || (typeof window !== 'undefined' ? window.PremEventShockEngine : null);
      if (!engine) return;

      const currSym = this.state.symbol.includes('.NS') || this.state.symbol === 'RELIANCE' || this.state.symbol === 'TCS' ? '₹' : '$';

      const jump = engine.predictDiscontinuousJump({
        symbol: this.state.symbol,
        preEventPrice: this.state.preEventPrice,
        assetBeta: this.state.beta,
        eventCatalyst: {
          type: this.state.catalystType,
          isReinstatement: this.state.catalystType === 'LEADERSHIP_REVERSAL',
          confidence: this.state.confidence,
          regulatoryClearance: this.state.regulatoryClearance,
          revenueSurprisePct: this.state.revenueSurprisePct,
          guidanceRaisePct: this.state.guidanceRaisePct
        },
        optionsMarket: {
          spotPrice: this.state.preEventPrice,
          netGexMillions: this.state.netGexMillions,
          normalizedGex: 3000,
          atmIv: this.state.atmIv,
          riskReversal25d: this.state.riskReversal25d
        }
      });

      const contagion = engine.propagateSupplyChainContagion(this.state.symbol, jump.expectedMovePct);

      // Update stat cards
      modal.querySelector('#statTargetPrice').textContent = `${currSym}${jump.targetPrice.toFixed(2)}`;
      modal.querySelector('#statExpectedMove').textContent = `${jump.expectedMovePct >= 0 ? '+' : ''}${jump.expectedMovePct.toFixed(2)}% Discontinuity`;
      modal.querySelector('#statGammaMult').textContent = `${jump.gammaMultiplier.toFixed(2)}x`;
      modal.querySelector('#statDealerState').textContent = jump.dealerState;
      modal.querySelector('#statCatalystScore').textContent = `Catalyst Score: ${jump.catalystScore.toFixed(2)} / 1.00`;

      // Update KaTeX equation
      const mathCont = modal.querySelector('#eventMathContainer');
      if (mathCont) {
        const latex = `S^* = ${currSym}${this.state.preEventPrice.toFixed(1)} \\times \\left[ 1 + \\underbrace{${(jump.catalystScore * 0.185).toFixed(3)}}_{\\mu_J} \\times \\left( 1 + 0.40 \\cdot (${jump.gammaMultiplier.toFixed(2)} - 1) + 0.35 \\cdot ${jump.skewAsymmetry.toFixed(3)} \\right) \\right] = \\mathbf{${currSym}${jump.targetPrice.toFixed(2)}}`;
        if (typeof katex !== 'undefined') {
          try {
            katex.render(latex, mathCont, { throwOnError: false });
          } catch (e) {
            mathCont.textContent = latex;
          }
        } else {
          mathCont.textContent = latex;
        }
      }

      // Update contagion table
      const tbody = modal.querySelector('#contagionTableBody');
      if (tbody) {
        if (contagion.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:12px;">No downstream Tier-1 graph nodes registered for ${this.state.symbol}.</td></tr>`;
        } else {
          tbody.innerHTML = contagion.map(c => `
            <tr>
              <td style="color:#38bdf8; font-weight:700;">${c.targetSymbol}</td>
              <td style="color:#94a3b8;">${c.relationship}</td>
              <td>${c.directWeight.toFixed(3)}</td>
              <td style="color:#10b981; font-weight:700;">+${c.expectedMovePct.toFixed(2)}%</td>
              <td style="color:#cbd5e1;">${c.confidencePct.toFixed(1)}%</td>
            </tr>
          `).join('');
        }
      }
    }
  }

  return new EventShockLabWorkbench();
}));
