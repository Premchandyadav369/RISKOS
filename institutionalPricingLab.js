/**
 * RISKOS Sovereign 12-Factor Institutional Pricing Interactive Workbench
 * ==============================================================================
 * Closed-Form Cross-Asset Multi-Factor Valuation & Options Microstructure Lab
 * Architect: Premchand Yadav
 * Module: institutionalPricingLab.js
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./institutionalPricingEngine', './securityMaster'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const InstitutionalPricingEngine = require('./institutionalPricingEngine.js');
    let SecurityMaster;
    try { SecurityMaster = require('./securityMaster.js').SecurityMaster || require('./securityMaster.js'); } catch (e) {}
    module.exports = factory(InstitutionalPricingEngine, SecurityMaster);
  } else {
    root.InstitutionalPricingLab = factory(root.InstitutionalPricingEngine, root.SecurityMaster);
  }
}(typeof self !== 'undefined' ? self : this, function (InstitutionalPricingModule, SecurityMaster) {
  'use strict';

  const EngineClass = InstitutionalPricingModule.InstitutionalPricingEngine || InstitutionalPricingModule;
  const engine = new EngineClass();

  class InstitutionalPricingLabWorkbench {
    constructor() {
      this.state = {
        symbol: 'NVDA',
        spotPrice: 155.38,
        currency: 'USD',
        country: 'US',
        realYield: 0.0277,
        yieldCurveSlope: 0.0029,
        cds5Y: 22,
        hyOas: 315,
        accrualRatio: -0.065,
        buybackVelocity: -0.024,
        beneishM: -2.85,
        shortInterestFloat: 0.021,
        daysToCover: 1.4,
        borrowFee: 0.003,
        darkPoolShare: 0.44,
        instFlowDelta: 0.028,
        netVanna: 14500,
        maxPainStrike: 155.0,
        hiringVelocity: 0.18,
        appTrafficVelocity: 0.22,
        brentBeta: -0.05,
        copperBeta: 0.12
      };

      this.presets = {
        nvda_monopoly: {
          name: 'NVIDIA AI Compute Monopoly (Super Alpha Long)',
          symbol: 'NVDA',
          spotPrice: 155.38,
          currency: 'USD',
          country: 'US',
          realYield: 0.0277,
          yieldCurveSlope: 0.0029,
          cds5Y: 22,
          hyOas: 315,
          accrualRatio: -0.065,
          buybackVelocity: -0.024,
          beneishM: -2.85,
          shortInterestFloat: 0.021,
          daysToCover: 1.4,
          borrowFee: 0.003,
          darkPoolShare: 0.44,
          instFlowDelta: 0.028,
          netVanna: 14500,
          maxPainStrike: 155.0,
          hiringVelocity: 0.18,
          appTrafficVelocity: 0.22,
          brentBeta: -0.05,
          copperBeta: 0.12
        },
        tsla_squeeze: {
          name: 'Tesla Short Squeeze & Commodity Convexity',
          symbol: 'TSLA',
          spotPrice: 384.68,
          currency: 'USD',
          country: 'US',
          realYield: 0.0277,
          yieldCurveSlope: 0.0029,
          cds5Y: 65,
          hyOas: 315,
          accrualRatio: -0.020,
          buybackVelocity: 0.012,
          beneishM: -2.15,
          shortInterestFloat: 0.042,
          daysToCover: 3.2,
          borrowFee: 0.015,
          darkPoolShare: 0.48,
          instFlowDelta: -0.008,
          netVanna: -8500,
          maxPainStrike: 380.0,
          hiringVelocity: 0.08,
          appTrafficVelocity: 0.25,
          brentBeta: -0.15,
          copperBeta: 0.28
        },
        smci_headwind: {
          name: 'Supermicro 10-K Delay & Accounting Trap',
          symbol: 'SMCI',
          spotPrice: 22.62,
          currency: 'USD',
          country: 'US',
          realYield: 0.0277,
          yieldCurveSlope: 0.0029,
          cds5Y: 380,
          hyOas: 315,
          accrualRatio: 0.095,
          buybackVelocity: 0.035,
          beneishM: -1.65,
          shortInterestFloat: 0.185,
          daysToCover: 5.8,
          borrowFee: 0.24,
          darkPoolShare: 0.52,
          instFlowDelta: -0.035,
          netVanna: -14500,
          maxPainStrike: 22.0,
          hiringVelocity: -0.05,
          appTrafficVelocity: 0.10,
          brentBeta: 0.02,
          copperBeta: 0.15
        },
        hdfc_compounding: {
          name: 'HDFC Bank Credit & Yield Curve Steepening',
          symbol: 'HDFCBANK',
          spotPrice: 845.60,
          currency: 'INR',
          country: 'IN',
          realYield: 0.0225,
          yieldCurveSlope: 0.0040,
          cds5Y: 78,
          hyOas: 340,
          accrualRatio: -0.040,
          buybackVelocity: 0.005,
          beneishM: -2.60,
          shortInterestFloat: 0.008,
          daysToCover: 1.1,
          borrowFee: 0.001,
          darkPoolShare: 0.35,
          instFlowDelta: 0.032,
          netVanna: 8500,
          maxPainStrike: 840.0,
          hiringVelocity: 0.10,
          appTrafficVelocity: 0.14,
          brentBeta: -0.12,
          copperBeta: -0.02
        },
        reliance_energy: {
          name: 'Reliance Industries Refining Beta & Jio Traffic',
          symbol: 'RELIANCE',
          spotPrice: 1379.10,
          currency: 'INR',
          country: 'IN',
          realYield: 0.0225,
          yieldCurveSlope: 0.0040,
          cds5Y: 92,
          hyOas: 340,
          accrualRatio: -0.015,
          buybackVelocity: 0.000,
          beneishM: -2.35,
          shortInterestFloat: 0.012,
          daysToCover: 1.2,
          borrowFee: 0.002,
          darkPoolShare: 0.32,
          instFlowDelta: 0.025,
          netVanna: 6800,
          maxPainStrike: 1380.0,
          hiringVelocity: 0.14,
          appTrafficVelocity: 0.20,
          brentBeta: 0.35,
          copperBeta: 0.08
        }
      };
    }

    openModal(presetKey = null) {
      if (typeof document === 'undefined') return;

      if (presetKey && this.presets[presetKey]) {
        this.state = Object.assign({}, this.presets[presetKey]);
      }

      let modal = document.getElementById('riskosInstitutionalPricingModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'riskosInstitutionalPricingModal';
        document.body.appendChild(modal);
      }

      this.render(modal);
      this.attachListeners(modal);
      this.recalculate();
    }

    closeModal() {
      const modal = document.getElementById('riskosInstitutionalPricingModal');
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }

    render(modal) {
      modal.innerHTML = `
        <div class="inst-pricing-dialog" role="dialog" aria-modal="true" aria-label="Institutional 12-Factor Pricing Workbench">
          <div class="inst-pricing-header">
            <div class="inst-pricing-title-area">
              <div class="inst-pricing-logo-icon"><i class="fa-solid fa-chess-queen"></i></div>
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-weight:800; font-size:15px; color:#fff; letter-spacing:0.02em;">P.R.E.M.-12 FACTOR INSTITUTIONAL PRICING CORE</span>
                  <span class="inst-pricing-badge">SOVEREIGN VALUATION LAB</span>
                </div>
                <div style="font-size:11px; color:#94a3b8;">Real Yields &bull; CDS Hazard &bull; Sloan Accruals &bull; Buybacks &bull; Beneish &bull; DTC Squeeze &bull; Dark Pools &bull; Vanna &bull; Charm &bull; Alt-Data &bull; Commodities</div>
              </div>
            </div>
            <button class="inst-pricing-close-btn" id="instPricingCloseBtn" title="Close Workbench">&times;</button>
          </div>

          <!-- Presets Strip -->
          <div class="inst-preset-strip">
            <span style="font-size:11px; font-weight:700; color:#64748b; align-self:center; margin-right:4px;">INSTITUTIONAL ARCHETYPES:</span>
            <button class="inst-preset-btn active" data-preset="nvda_monopoly"><i class="fa-solid fa-microchip" style="color:#10b981;"></i> NVDA AI Monopoly (+18.0%)</button>
            <button class="inst-preset-btn" data-preset="tsla_squeeze"><i class="fa-solid fa-bolt" style="color:#38bdf8;"></i> TSLA Short Squeeze &amp; Copper</button>
            <button class="inst-preset-btn" data-preset="smci_headwind"><i class="fa-solid fa-triangle-exclamation" style="color:#f43f5e;"></i> SMCI Accounting Trap (-42.2%)</button>
            <button class="inst-preset-btn" data-preset="hdfc_compounding"><i class="fa-solid fa-building-columns" style="color:#a855f7;"></i> HDFCBANK Credit Flow (+1.9%)</button>
            <button class="inst-preset-btn" data-preset="reliance_energy"><i class="fa-solid fa-oil-well" style="color:#f59e0b;"></i> RELIANCE Energy Refining</button>
          </div>

          <div class="inst-pricing-body">
            <div class="inst-pricing-grid">
              
              <!-- Left Column: All 12 Parameters -->
              <div class="inst-pricing-card">
                <div class="inst-pricing-card-title"><i class="fa-solid fa-sliders"></i> Multi-Factor Parameter Drivers</div>

                <!-- Asset Identity -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                  <div class="inst-control-group">
                    <label class="inst-control-label" for="inpInstSymbol">Target Asset Ticker</label>
                    <input type="text" id="inpInstSymbol" class="inst-input" value="${this.state.symbol}" />
                  </div>
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>Spot Price (S0)</span>
                      <span id="valSpotPrice" class="inst-control-val">${this.state.spotPrice}</span>
                    </div>
                    <input type="range" id="sliderSpotPrice" class="inst-slider" min="5" max="3000" step="1" value="${this.state.spotPrice}" />
                  </div>
                </div>

                <!-- 12 Factor Sliders in 2-Column Subgrid -->
                <div class="inst-controls-subgrid">
                  
                  <!-- F1: Real Yields -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F1: 10Y Real Yield (r_real)</span>
                      <span id="valRealYield" class="inst-control-val">${(this.state.realYield * 100).toFixed(2)}%</span>
                    </div>
                    <input type="range" id="sliderRealYield" class="inst-slider" min="0.005" max="0.04" step="0.0005" value="${this.state.realYield}" />
                  </div>

                  <!-- F2: 5Y CDS Hazard -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F2: 5Y CDS Hazard Spread</span>
                      <span id="valCds5Y" class="inst-control-val">${this.state.cds5Y} bps</span>
                    </div>
                    <input type="range" id="sliderCds5Y" class="inst-slider" min="10" max="600" step="5" value="${this.state.cds5Y}" />
                  </div>

                  <!-- F3: Sloan Accrual -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F3: Sloan Accrual (NI - CFO) / TA</span>
                      <span id="valAccrualRatio" class="inst-control-val">${this.state.accrualRatio}</span>
                    </div>
                    <input type="range" id="sliderAccrualRatio" class="inst-slider" min="-0.15" max="0.15" step="0.005" value="${this.state.accrualRatio}" />
                  </div>

                  <!-- F4: Buyback Velocity -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F4: Net Share Change %</span>
                      <span id="valBuybackVelocity" class="inst-control-val">${(this.state.buybackVelocity * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" id="sliderBuybackVelocity" class="inst-slider" min="-0.08" max="0.08" step="0.002" value="${this.state.buybackVelocity}" />
                  </div>

                  <!-- F5: Beneish M-Score -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F5: Beneish M-Score (Audit Risk)</span>
                      <span id="valBeneishM" class="inst-control-val">${this.state.beneishM}</span>
                    </div>
                    <input type="range" id="sliderBeneishM" class="inst-slider" min="-3.5" max="-1.0" step="0.05" value="${this.state.beneishM}" />
                  </div>

                  <!-- F6: Short Interest & Days-To-Cover -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F6: Short Interest % of Float</span>
                      <span id="valShortInterest" class="inst-control-val">${(this.state.shortInterestFloat * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" id="sliderShortInterest" class="inst-slider" min="0.005" max="0.30" step="0.005" value="${this.state.shortInterestFloat}" />
                  </div>

                  <!-- F7: Dark Pool Block Share -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F7: Dark Pool Block Share %</span>
                      <span id="valDarkPool" class="inst-control-val">${(this.state.darkPoolShare * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" id="sliderDarkPool" class="inst-slider" min="0.15" max="0.65" step="0.01" value="${this.state.darkPoolShare}" />
                  </div>

                  <!-- F8: Inst Flow Velocity -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F8: Inst FII/DII Net Flow Velocity</span>
                      <span id="valInstFlow" class="inst-control-val">${(this.state.instFlowDelta * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" id="sliderInstFlow" class="inst-slider" min="-0.05" max="0.05" step="0.002" value="${this.state.instFlowDelta}" />
                  </div>

                  <!-- F9: Dealer Vanna -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F9: Dealer Net Vanna (dDelta/dVol)</span>
                      <span id="valNetVanna" class="inst-control-val">${this.state.netVanna}</span>
                    </div>
                    <input type="range" id="sliderNetVanna" class="inst-slider" min="-25000" max="25000" step="500" value="${this.state.netVanna}" />
                  </div>

                  <!-- F10: Dealer Charm & Max Pain -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F10: OpEx Max Pain Strike ($)</span>
                      <span id="valMaxPain" class="inst-control-val">$${this.state.maxPainStrike}</span>
                    </div>
                    <input type="range" id="sliderMaxPain" class="inst-slider" min="10" max="3000" step="1" value="${this.state.maxPainStrike}" />
                  </div>

                  <!-- F11: Alternative Data Momentum -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F11: Alt Data Tech Hiring Velocity</span>
                      <span id="valHiring" class="inst-control-val">${(this.state.hiringVelocity * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" id="sliderHiring" class="inst-slider" min="-0.30" max="0.50" step="0.02" value="${this.state.hiringVelocity}" />
                  </div>

                  <!-- F12: Commodity Copper Beta -->
                  <div class="inst-control-group">
                    <div class="inst-control-label">
                      <span>F12: Copper / Industrial Beta</span>
                      <span id="valCopperBeta" class="inst-control-val">${this.state.copperBeta}</span>
                    </div>
                    <input type="range" id="sliderCopperBeta" class="inst-slider" min="-0.40" max="0.60" step="0.02" value="${this.state.copperBeta}" />
                  </div>

                </div>
              </div>

              <!-- Right Column: Results & KaTeX Decomposition -->
              <div style="display:flex; flex-direction:column; gap:14px;">
                
                <!-- Stat Grid -->
                <div class="inst-stat-grid">
                  <div class="inst-stat-box" style="border-color:rgba(14,165,233,0.4);">
                    <div class="inst-stat-label">Institutional Fair Value</div>
                    <div class="inst-stat-val" id="statFairValue" style="color:#38bdf8;">$256.59</div>
                    <div class="inst-stat-sub" id="statCurrencySub">S0 = $155.38</div>
                  </div>

                  <div class="inst-stat-box" style="border-color:rgba(16,185,129,0.4);">
                    <div class="inst-stat-label">Alpha Spread (P* - S0)</div>
                    <div class="inst-stat-val" id="statAlphaSpread" style="color:#10b981;">+17.95%</div>
                    <div class="inst-stat-sub" id="statAlphaDirection">Institutional Premium</div>
                  </div>

                  <div class="inst-stat-box" style="border-color:rgba(168,85,247,0.4);">
                    <div class="inst-stat-label">Conviction Tier</div>
                    <div class="inst-stat-val" id="statConvictionTier" style="font-size:13px; color:#c084fc;">SUPER_ALPHA_BUY</div>
                    <div class="inst-stat-sub">12-Factor Synthesis</div>
                  </div>
                </div>

                <!-- KaTeX Closed-Form Formula Box -->
                <div class="inst-pricing-card">
                  <div class="inst-pricing-card-title"><i class="fa-solid fa-square-root-variable"></i> Closed-Form Institutional Formula</div>
                  <div id="instKatexFormula" class="inst-katex-box">
                    Loading mathematical formulation...
                  </div>
                </div>

                <!-- 12-Factor Waterfall Chips -->
                <div class="inst-pricing-card" style="flex:1;">
                  <div class="inst-pricing-card-title"><i class="fa-solid fa-chart-waterfall"></i> Factor Delta Decomposition (Δ_Fk)</div>
                  <div id="instFactorWaterfall" class="inst-factor-waterfall">
                    <!-- Populated dynamically -->
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      `;
    }

    attachListeners(modal) {
      const closeBtn = modal.querySelector('#instPricingCloseBtn');
      if (closeBtn) closeBtn.onclick = () => this.closeModal();

      // Backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) this.closeModal();
      };

      // Presets
      const presetBtns = modal.querySelectorAll('.inst-preset-btn');
      presetBtns.forEach(btn => {
        btn.onclick = () => {
          presetBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const pKey = btn.getAttribute('data-preset');
          if (this.presets[pKey]) {
            this.state = Object.assign({}, this.presets[pKey]);
            this.syncInputs(modal);
            this.recalculate();
          }
        };
      });

      // Slider Listeners
      const bindSlider = (sliderId, valId, stateKey, formatFn) => {
        const slider = modal.querySelector('#' + sliderId);
        const valElem = modal.querySelector('#' + valId);
        if (slider) {
          slider.oninput = (e) => {
            const v = parseFloat(e.target.value);
            this.state[stateKey] = v;
            if (valElem) valElem.textContent = formatFn(v);
            this.recalculate();
          };
        }
      };

      bindSlider('sliderSpotPrice', 'valSpotPrice', 'spotPrice', v => v.toFixed(2));
      bindSlider('sliderRealYield', 'valRealYield', 'realYield', v => (v * 100).toFixed(2) + '%');
      bindSlider('sliderCds5Y', 'valCds5Y', 'cds5Y', v => v + ' bps');
      bindSlider('sliderAccrualRatio', 'valAccrualRatio', 'accrualRatio', v => v.toFixed(3));
      bindSlider('sliderBuybackVelocity', 'valBuybackVelocity', 'buybackVelocity', v => (v * 100).toFixed(1) + '%');
      bindSlider('sliderBeneishM', 'valBeneishM', 'beneishM', v => v.toFixed(2));
      bindSlider('sliderShortInterest', 'valShortInterest', 'shortInterestFloat', v => (v * 100).toFixed(1) + '%');
      bindSlider('sliderDarkPool', 'valDarkPool', 'darkPoolShare', v => (v * 100).toFixed(0) + '%');
      bindSlider('sliderInstFlow', 'valInstFlow', 'instFlowDelta', v => (v * 100).toFixed(1) + '%');
      bindSlider('sliderNetVanna', 'valNetVanna', 'netVanna', v => v);
      bindSlider('sliderMaxPain', 'valMaxPain', 'maxPainStrike', v => '$' + v.toFixed(0));
      bindSlider('sliderHiring', 'valHiring', 'hiringVelocity', v => (v * 100).toFixed(0) + '%');
      bindSlider('sliderCopperBeta', 'valCopperBeta', 'copperBeta', v => v.toFixed(2));

      // Ticker symbol input
      const symInp = modal.querySelector('#inpInstSymbol');
      if (symInp) {
        symInp.onchange = (e) => {
          this.state.symbol = (e.target.value || '').toUpperCase();
          this.recalculate();
        };
      }
    }

    syncInputs(modal) {
      const s = this.state;
      const setVal = (id, val) => {
        const el = modal.querySelector('#' + id);
        if (el) el.value = val;
      };
      const setText = (id, txt) => {
        const el = modal.querySelector('#' + id);
        if (el) el.textContent = txt;
      };

      setVal('inpInstSymbol', s.symbol);
      setVal('sliderSpotPrice', s.spotPrice);
      setText('valSpotPrice', s.spotPrice.toFixed(2));

      setVal('sliderRealYield', s.realYield);
      setText('valRealYield', (s.realYield * 100).toFixed(2) + '%');

      setVal('sliderCds5Y', s.cds5Y);
      setText('valCds5Y', s.cds5Y + ' bps');

      setVal('sliderAccrualRatio', s.accrualRatio);
      setText('valAccrualRatio', s.accrualRatio.toFixed(3));

      setVal('sliderBuybackVelocity', s.buybackVelocity);
      setText('valBuybackVelocity', (s.buybackVelocity * 100).toFixed(1) + '%');

      setVal('sliderBeneishM', s.beneishM);
      setText('valBeneishM', s.beneishM.toFixed(2));

      setVal('sliderShortInterest', s.shortInterestFloat);
      setText('valShortInterest', (s.shortInterestFloat * 100).toFixed(1) + '%');

      setVal('sliderDarkPool', s.darkPoolShare);
      setText('valDarkPool', (s.darkPoolShare * 100).toFixed(0) + '%');

      setVal('sliderInstFlow', s.instFlowDelta);
      setText('valInstFlow', (s.instFlowDelta * 100).toFixed(1) + '%');

      setVal('sliderNetVanna', s.netVanna);
      setText('valNetVanna', s.netVanna);

      setVal('sliderMaxPain', s.maxPainStrike);
      setText('valMaxPain', '$' + s.maxPainStrike.toFixed(0));

      setVal('sliderHiring', s.hiringVelocity);
      setText('valHiring', (s.hiringVelocity * 100).toFixed(0) + '%');

      setVal('sliderCopperBeta', s.copperBeta);
      setText('valCopperBeta', s.copperBeta.toFixed(2));
    }

    recalculate() {
      const s = this.state;
      const res = engine.evaluate12FactorPricing({
        symbol: s.symbol,
        name: s.symbol,
        country: s.country,
        currency: s.currency,
        basePrice: s.spotPrice,
        pe: 25.0
      }, {
        spotPrice: s.spotPrice,
        cds5Y: s.cds5Y,
        hyOas: s.hyOas,
        accrualRatio: s.accrualRatio,
        buybackVelocity: s.buybackVelocity,
        beneishM: s.beneishM,
        shortInterestFloat: s.shortInterestFloat,
        daysToCover: s.daysToCover,
        borrowFee: s.borrowFee,
        darkPoolShare: s.darkPoolShare,
        instFlowDelta: s.instFlowDelta,
        netVanna: s.netVanna,
        maxPainStrike: s.maxPainStrike,
        hiringVelocity: s.hiringVelocity,
        appTrafficVelocity: s.appTrafficVelocity,
        brentBeta: s.brentBeta,
        copperBeta: s.copperBeta,
        macro: {
          realYieldUS: s.realYield,
          realYieldIN: s.realYield,
          yieldCurveSlopeUS: s.yieldCurveSlope,
          yieldCurveSlopeIN: s.yieldCurveSlope
        }
      });

      if (!res) return;

      const modal = document.getElementById('riskosInstitutionalPricingModal');
      if (!modal) return;

      const currSymbol = res.currency === 'INR' ? '₹' : '$';

      // Update stat displays
      const fairValElem = modal.querySelector('#statFairValue');
      if (fairValElem) {
        fairValElem.textContent = currSymbol + res.institutionalFairValue.toLocaleString();
        fairValElem.style.color = res.alphaSpreadPct >= 0 ? '#10b981' : '#f43f5e';
      }

      const currSubElem = modal.querySelector('#statCurrencySub');
      if (currSubElem) currSubElem.textContent = `S0 = ${currSymbol}${s.spotPrice.toLocaleString()}`;

      const alphaElem = modal.querySelector('#statAlphaSpread');
      if (alphaElem) {
        const sign = res.alphaSpreadPct >= 0 ? '+' : '';
        alphaElem.textContent = `${sign}${res.alphaSpreadPct.toFixed(2)}%`;
        alphaElem.style.color = res.alphaSpreadPct >= 0 ? '#10b981' : '#f43f5e';
      }

      const alphaDirElem = modal.querySelector('#statAlphaDirection');
      if (alphaDirElem) {
        alphaDirElem.textContent = res.alphaSpreadPct >= 0 ? 'Institutional Premium' : 'Institutional Discount';
      }

      const tierElem = modal.querySelector('#statConvictionTier');
      if (tierElem) {
        tierElem.textContent = res.convictionTier.replace(/_/g, ' ');
        if (res.convictionTier.includes('SUPER_ALPHA')) tierElem.style.color = '#34d399';
        else if (res.convictionTier.includes('BUY')) tierElem.style.color = '#38bdf8';
        else if (res.convictionTier.includes('HEADWIND')) tierElem.style.color = '#fb7185';
        else if (res.convictionTier.includes('TRIM')) tierElem.style.color = '#fbbf24';
        else tierElem.style.color = '#cbd5e1';
      }

      // KaTeX closed-form formula rendering
      const mathElem = modal.querySelector('#instKatexFormula');
      if (mathElem) {
        const f = res.factors;
        const latex = `P^* = S_0 \\cdot \\prod_{k=1}^{12} (1 + \\Delta_{F_k}) = ${currSymbol}${s.spotPrice} \\cdot ${(1 + res.alphaSpreadPct/100).toFixed(4)} = \\mathbf{${currSymbol}${res.institutionalFairValue}}`;
        if (typeof katex !== 'undefined' && katex.render) {
          try {
            katex.render(latex, mathElem, { throwOnError: false, displayMode: true });
          } catch (e) {
            mathElem.textContent = `P* = ${currSymbol}${res.institutionalFairValue} (Alpha: ${res.alphaSpreadPct}%)`;
          }
        } else {
          mathElem.innerHTML = `<span style="font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:700; color:#38bdf8;">P* = ${currSymbol}${s.spotPrice} &times; ${(1 + res.alphaSpreadPct/100).toFixed(4)} = ${currSymbol}${res.institutionalFairValue}</span>`;
        }
      }

      // Populate 12-factor waterfall chips
      const waterfallElem = modal.querySelector('#instFactorWaterfall');
      if (waterfallElem) {
        const factorList = [
          { name: 'F1: Real Yields & Duration', delta: res.factors.f1_macroRealYield.deltaPct },
          { name: 'F2: CDS Hazard & Solvency', delta: res.factors.f2_creditCdsHazard.deltaPct },
          { name: 'F3: Sloan Accrual Quality', delta: res.factors.f3_sloanAccrual.deltaPct },
          { name: 'F4: Share Cannibalization/Dilution', delta: res.factors.f4_shareBuybackDilution.deltaPct },
          { name: 'F5: Beneish M-Score Risk', delta: res.factors.f5_beneishManipulation.deltaPct },
          { name: 'F6: DTC Short Squeeze', delta: res.factors.f6_shortDtcSqueeze.deltaPct },
          { name: 'F7: Dark Pool Block Flow', delta: res.factors.f7_darkPoolBlockShare.deltaPct },
          { name: 'F8: Inst Flow Velocity (FII/DII)', delta: res.factors.f8_instFlowVelocity.deltaPct },
          { name: 'F9: Dealer Vanna Exposure', delta: res.factors.f9_dealerVanna.deltaPct },
          { name: 'F10: Dealer Charm & Max Pain', delta: res.factors.f10_dealerCharmMaxPain.deltaPct },
          { name: 'F11: Alternative Data Momentum', delta: res.factors.f11_altDataMomentum.deltaPct },
          { name: 'F12: Commodity & Copper Beta', delta: res.factors.f12_commodityGeopolitical.deltaPct }
        ];

        waterfallElem.innerHTML = factorList.map(item => {
          const sign = item.delta > 0 ? '+' : '';
          const cls = item.delta > 0 ? 'delta-pos' : (item.delta < 0 ? 'delta-neg' : 'delta-neu');
          return `
            <div class="inst-factor-chip">
              <span class="inst-factor-name">${item.name}</span>
              <span class="inst-factor-delta ${cls}">${sign}${item.delta.toFixed(2)}%</span>
            </div>
          `;
        }).join('');
      }
    }
  }

  const defaultWorkbench = new InstitutionalPricingLabWorkbench();

  // Global window convenience
  if (typeof window !== 'undefined') {
    window.InstitutionalPricingLabWorkbench = InstitutionalPricingLabWorkbench;
    window.institutionalPricingLab = defaultWorkbench;
    window.openInstitutionalPricingLab = function (presetKey) {
      defaultWorkbench.openModal(presetKey);
    };
  }

  return {
    InstitutionalPricingLabWorkbench,
    defaultWorkbench
  };
}));
