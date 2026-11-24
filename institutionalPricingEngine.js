/**
 * RISKOS Sovereign 12-Factor Institutional Pricing Engine
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: institutionalPricingEngine.js
 * 
 * Mathematical Specification:
 * ------------------------------------------------------------------------------
 * Synthesizes 12 multi-disciplinary institutional factors across:
 * 
 * 1. Macro & Real Yields (F1):
 *    Delta_realYield = -Duration * (r_real - r_base) + beta_curve * Delta Y_10Y-2Y + beta_FX * Delta FX
 * 
 * 2. Credit Default Swaps & Hazard Rates (F2):
 *    lambda_hazard = CDS_5Y / (1.0 - RecoveryRate)
 *    Delta_credit = -(lambda_hazard * 5.0 / 10000) * (1 + HY_OAS / 1000)
 * 
 * 3. Sloan Accrual Anomaly (F3):
 *    Accrual = (NetIncome - CFO) / TotalAssets
 *    High accrual penalties (earnings quality degradation) vs cash flow accretion
 * 
 * 4. Share Cannibalization & Dilution Velocity (F4):
 *    Delta N_shares% (systematic buybacks vs stock-based compensation dilution)
 * 
 * 5. Beneish M-Score Earnings Manipulation Index (F5):
 *    P_manip = 1 / (1 + exp(-Beneish_M))
 * 
 * 6. Short Interest & Days-To-Cover Squeeze Multiplier (F6):
 *    Convex non-linear short covering pressure under float constraints
 * 
 * 7. Dark Pool & Off-Exchange Block Share (F7):
 *    Stealth institutional accumulation without immediate consolidated tape impact
 * 
 * 8. Institutional FII/DII Net Flow Velocity (F8):
 *    Persistent institutional liquidity absorption
 * 
 * 9. Dealer Vanna Cross-Derivative (F9):
 *    dDelta / dSigma: dealer delta re-hedging sensitivity under implied volatility shifts
 * 
 * 10. Dealer Charm & Max Pain OpEx Pinning (F10):
 *     dDelta / dt: delta decay drift pulling spot toward options Max Pain strike
 * 
 * 11. Alternative Data Momentum (F11):
 *     Job hiring velocity, app store rank trajectory, patent citation density
 * 
 * 12. Commodity & Geopolitical Betas (F12):
 *     Brent crude, copper, and supply-chain chokepoint sensitivity
 * 
 * Master Closed-Form Formulation:
 * ------------------------------------------------------------------------------
 *   P* = S_0 * \prod_{k=1}^{12} (1 + Delta_{F_k})
 *   Alpha_Spread = (P* - S_0) / S_0 * 100%
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./securityMaster.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    let SecurityMaster;
    try { SecurityMaster = require('./securityMaster.js').SecurityMaster || require('./securityMaster.js'); } catch (e) {}
    module.exports = factory(SecurityMaster);
  } else {
    root.InstitutionalPricingEngine = factory(root.SecurityMaster);
  }
}(typeof self !== 'undefined' ? self : this, function (SecurityMaster) {
  'use strict';

  const VERSION = '5.0.0-PROPRIETARY';
  const CODENAME = 'P.R.E.M.-12Factor';

  // Seed deterministic hash for continuous factor calibration across the 134-equity master
  function getHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // Institutional Archetype Calibrations
  const INSTITUTIONAL_FACTOR_ARCHETYPES = {
    // US Mega-Cap AI & Tech
    NVDA: {
      cds5Y: 22, // 22 bps
      hyOas: 285, // 285 bps
      accrualRatio: -0.065, // Super cash generative (CFO >> Net Income)
      buybackVelocity: -0.024, // -2.4% net share count reduction
      beneishM: -2.85, // Clean
      shortInterestFloat: 0.021, // 2.1%
      daysToCover: 1.4,
      borrowFee: 0.003, // 0.3%
      darkPoolShare: 0.44, // 44% dark pool volume
      instFlowDelta: 0.028,
      netVanna: 14500,
      maxPainStrike: 215.0,
      hiringVelocity: 0.18, // +18% tech hiring
      appTrafficVelocity: 0.22,
      brentBeta: -0.05,
      copperBeta: 0.12
    },
    AAPL: {
      cds5Y: 18,
      hyOas: 285,
      accrualRatio: -0.082,
      buybackVelocity: -0.034, // -3.4% aggressive buyback cannibalization
      beneishM: -3.10,
      shortInterestFloat: 0.012,
      daysToCover: 1.8,
      borrowFee: 0.002,
      darkPoolShare: 0.42,
      instFlowDelta: 0.015,
      netVanna: 18200,
      maxPainStrike: 315.0,
      hiringVelocity: 0.05,
      appTrafficVelocity: 0.08,
      brentBeta: -0.08,
      copperBeta: 0.06
    },
    MSFT: {
      cds5Y: 19,
      hyOas: 285,
      accrualRatio: -0.075,
      buybackVelocity: -0.018,
      beneishM: -2.95,
      shortInterestFloat: 0.009,
      daysToCover: 1.5,
      borrowFee: 0.002,
      darkPoolShare: 0.40,
      instFlowDelta: 0.021,
      netVanna: 16500,
      maxPainStrike: 440.0,
      hiringVelocity: 0.12,
      appTrafficVelocity: 0.15,
      brentBeta: -0.04,
      copperBeta: 0.05
    },
    TSLA: {
      cds5Y: 65,
      hyOas: 285,
      accrualRatio: -0.020,
      buybackVelocity: 0.012, // +1.2% dilution (stock-based comp)
      beneishM: -2.15,
      shortInterestFloat: 0.042, // 4.2% short
      daysToCover: 3.2,
      borrowFee: 0.015,
      darkPoolShare: 0.48,
      instFlowDelta: -0.008,
      netVanna: -8500, // Short vanna asymmetry
      maxPainStrike: 210.0,
      hiringVelocity: 0.08,
      appTrafficVelocity: 0.25,
      brentBeta: -0.15,
      copperBeta: 0.28 // Heavy battery / copper sensitivity
    },
    SMCI: {
      cds5Y: 380, // High credit spread due to delay in 10-K
      hyOas: 285,
      accrualRatio: 0.095, // High accruals
      buybackVelocity: 0.035, // Dilution
      beneishM: -1.65, // Elevates manipulation check
      shortInterestFloat: 0.185, // 18.5% heavily shorted
      daysToCover: 5.8,
      borrowFee: 0.24, // 24% hard to borrow fee
      darkPoolShare: 0.52,
      instFlowDelta: -0.035,
      netVanna: -14500,
      maxPainStrike: 40.0,
      hiringVelocity: -0.05,
      appTrafficVelocity: 0.10,
      brentBeta: 0.02,
      copperBeta: 0.15
    },

    // Indian Market Champions
    TCS: {
      cds5Y: 55,
      hyOas: 340,
      accrualRatio: -0.085,
      buybackVelocity: -0.015,
      beneishM: -3.20,
      shortInterestFloat: 0.005,
      daysToCover: 0.8,
      borrowFee: 0.001,
      darkPoolShare: 0.22,
      instFlowDelta: 0.018,
      netVanna: 4200,
      maxPainStrike: 4400.0,
      hiringVelocity: 0.06,
      appTrafficVelocity: 0.05,
      brentBeta: -0.04,
      copperBeta: 0.01
    },
    RELIANCE: {
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
      maxPainStrike: 1300.0,
      hiringVelocity: 0.14,
      appTrafficVelocity: 0.20,
      brentBeta: 0.35, // High refining margin positive correlation
      copperBeta: 0.08
    },
    HDFCBANK: {
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
      maxPainStrike: 1750.0,
      hiringVelocity: 0.10,
      appTrafficVelocity: 0.14,
      brentBeta: -0.12,
      copperBeta: -0.02
    },
    TATAMOTORS: {
      cds5Y: 110,
      hyOas: 340,
      accrualRatio: -0.052,
      buybackVelocity: 0.002,
      beneishM: -2.45,
      shortInterestFloat: 0.018,
      daysToCover: 1.9,
      borrowFee: 0.004,
      darkPoolShare: 0.36,
      instFlowDelta: 0.028,
      netVanna: 7200,
      maxPainStrike: 1000.0,
      hiringVelocity: 0.12,
      appTrafficVelocity: 0.18,
      brentBeta: -0.18,
      copperBeta: 0.22
    },
    ADANIENT: {
      cds5Y: 185,
      hyOas: 340,
      accrualRatio: 0.015,
      buybackVelocity: 0.005,
      beneishM: -2.05,
      shortInterestFloat: 0.035,
      daysToCover: 2.8,
      borrowFee: 0.012,
      darkPoolShare: 0.42,
      instFlowDelta: 0.019,
      netVanna: -3200,
      maxPainStrike: 3100.0,
      hiringVelocity: 0.16,
      appTrafficVelocity: 0.15,
      brentBeta: 0.05,
      copperBeta: 0.30 // Kutch copper smelter leverage
    }
  };

  class InstitutionalPricingEngine {
    constructor(options = {}) {
      this.version = VERSION;
      this.codename = CODENAME;
      this.architect = 'Premchand Yadav';

      this.macroEnvironment = Object.assign({
        realYieldUS: 0.0185, // 1.85% US 10Y real yield
        realYieldIN: 0.0225, // 2.25% India 10Y real yield
        yieldCurveSlopeUS: 0.0025, // +25 bps 10Y - 2Y slope
        yieldCurveSlopeIN: 0.0040, // +40 bps India slope
        usdInrDeltaPct: 0.005, // +0.5% dollar strength
        brentDeltaPct: 0.020, // +2.0% crude shock
        copperDeltaPct: 0.015 // +1.5% copper shock
      }, options.macro);
    }

    /**
     * Synthesize or look up security-level institutional factor inputs
     */
    getSecurityFactorInputs(sec) {
      if (!sec) return null;
      const sym = (sec.symbol || '').toUpperCase();
      const h = getHash(sym + '_factors');

      // Check explicit institutional archetypes first
      if (INSTITUTIONAL_FACTOR_ARCHETYPES[sym]) {
        return Object.assign({}, INSTITUTIONAL_FACTOR_ARCHETYPES[sym]);
      }

      // Deterministic realistic synthetic generation for universe instruments
      const isUS = sec.country === 'US' || sec.country === 'GLOBAL';
      const pe = sec.pe || 22.0;
      const roe = sec.roe || 15.0;

      const cds5Y = Math.max(15, Math.min(450, isUS ? (100 - roe * 0.5 + (h % 40)) : (140 - roe * 0.4 + (h % 50))));
      const hyOas = isUS ? 295 : 350;
      const accrualRatio = Number((((h % 100) - 60) / 1000.0).toFixed(3)); // -0.06 to +0.04
      const buybackVelocity = Number((((h % 60) - 40) / 1000.0).toFixed(3)); // -0.04 to +0.02
      const beneishM = Number((-2.5 - ((h % 50) / 50.0)).toFixed(2));
      const shortInterestFloat = Number((0.01 + ((h % 40) / 1000.0)).toFixed(3));
      const daysToCover = Number((1.0 + ((h % 35) / 10.0)).toFixed(1));
      const borrowFee = Number((0.002 + ((h % 15) / 1000.0)).toFixed(3));
      const darkPoolShare = Number((0.30 + ((h % 20) / 100.0)).toFixed(2));
      const instFlowDelta = Number((((h % 60) - 25) / 1000.0).toFixed(3));
      const netVanna = ((h % 20000) - 8000);
      const maxPainStrike = Number((sec.basePrice * (1.0 + (((h % 40) - 20) / 1000.0))).toFixed(2));
      const hiringVelocity = Number((((h % 30) - 5) / 100.0).toFixed(2));
      const appTrafficVelocity = Number((((h % 35) - 5) / 100.0).toFixed(2));
      const brentBeta = Number((((h % 50) - 25) / 100.0).toFixed(2));
      const copperBeta = Number((((h % 40) - 10) / 100.0).toFixed(2));

      return {
        cds5Y,
        hyOas,
        accrualRatio,
        buybackVelocity,
        beneishM,
        shortInterestFloat,
        daysToCover,
        borrowFee,
        darkPoolShare,
        instFlowDelta,
        netVanna,
        maxPainStrike,
        hiringVelocity,
        appTrafficVelocity,
        brentBeta,
        copperBeta
      };
    }

    /**
     * Convenience method to evaluate a symbol by ticker string
     */
    evaluateSymbol(symbol, overrides = {}) {
      const sym = (symbol || '').toUpperCase();
      const registry = SecurityMaster && SecurityMaster.LOCAL_REGISTRY ? SecurityMaster.LOCAL_REGISTRY : [];
      const sec = registry.find(s => (s.symbol || '').toUpperCase() === sym);
      if (!sec) {
        return this.evaluate12FactorPricing({
          symbol: sym,
          name: sym,
          country: 'US',
          currency: 'USD',
          basePrice: overrides.spotPrice || 100.0,
          pe: 22.0,
          roe: 15.0
        }, overrides);
      }
      return this.evaluate12FactorPricing(sec, overrides);
    }

    /**
     * Compute Institutional 12-Factor Pricing Decomposition
     * @param {Object} sec - SecurityMaster record
     * @param {Object} overrides - Parameter overrides for scenario testing
     * @returns {Object} Comprehensive pricing decomposition
     */
    evaluate12FactorPricing(sec, overrides = {}) {
      if (!sec) return null;
      const spotPrice = overrides.spotPrice || sec.basePrice || 100.0;
      const isUS = sec.country === 'US' || sec.country === 'GLOBAL';
      const currency = sec.currency || (isUS ? 'USD' : 'INR');
      const pe = sec.pe || 22.0;

      // Merge baseline parameters with overrides
      const factors = Object.assign(this.getSecurityFactorInputs(sec), overrides);
      const macro = Object.assign({}, this.macroEnvironment, overrides.macro || {});

      // ── Factor 1: Macro & Real Yields (Delta_F1) ────────────────────────────
      const realYield = isUS ? macro.realYieldUS : macro.realYieldIN;
      const baseRealYield = isUS ? 0.0185 : 0.0225;
      const duration = Math.min(30.0, Math.max(8.0, pe * 0.55));
      const yieldImpact = -duration * (realYield - baseRealYield);

      const isBank = (sec.sector || '').includes('Banking') || (sec.sector || '').includes('Financial');
      const curveSlope = isUS ? macro.yieldCurveSlopeUS : macro.yieldCurveSlopeIN;
      const curveImpact = isBank ? (curveSlope * 6.0) : -(curveSlope * 1.5);

      const isExporter = (sec.sector || '').includes('Technology') || (sec.sector || '').includes('Pharma');
      const fxImpact = (!isUS && isExporter) ? (0.45 * macro.usdInrDeltaPct) : (isUS ? -(0.25 * macro.usdInrDeltaPct) : 0);

      const deltaF1 = Number((yieldImpact + curveImpact + fxImpact).toFixed(4));

      // ── Factor 2: Credit Default Swap & Solvency Hazard (Delta_F2) ──────────
      const recoveryRate = 0.40;
      const lambdaHazard = (factors.cds5Y / 10000.0) / (1.0 - recoveryRate);
      const creditStressMultiplier = 1.0 + (factors.hyOas / 1000.0);
      const deltaF2 = Number((-lambdaHazard * 4.5 * creditStressMultiplier).toFixed(4));

      // ── Factor 3: Sloan Accrual Anomaly (Delta_F3) ──────────────────────────
      let deltaF3 = 0.0;
      if (factors.accrualRatio > 0.05) {
        // Earnings quality trap: high accruals predict future inventory/receivable write-offs
        deltaF3 = -1.25 * (factors.accrualRatio - 0.05);
      } else if (factors.accrualRatio < -0.04) {
        // High cash conversion bonus
        deltaF3 = Math.min(0.06, 0.75 * Math.abs(factors.accrualRatio + 0.04));
      }
      deltaF3 = Number(deltaF3.toFixed(4));

      // ── Factor 4: Share Cannibalization & Dilution Velocity (Delta_F4) ──────
      // Buybacks (-buybackVelocity) yield positive EPS accretion
      const deltaF4 = Number((-1.10 * factors.buybackVelocity).toFixed(4));

      // ── Factor 5: Beneish M-Score Earnings Manipulation Risk (Delta_F5) ─────
      // Beneish M > -1.78 indicates high manipulation probability
      const pManip = 1.0 / (1.0 + Math.exp(-(factors.beneishM + 2.0)));
      const deltaF5 = Number((-pManip * 0.08).toFixed(4));

      // ── Factor 6: Short Interest & Days-To-Cover Squeeze Physics (Delta_F6) ──
      const floatShortRatio = factors.shortInterestFloat;
      const dtc = Math.max(1.0, factors.daysToCover);
      const borrowStress = 1.0 + (factors.borrowFee * 2.5);
      const squeezeConvexity = floatShortRatio * Math.log(1.0 + dtc) * borrowStress * 0.85;
      const deltaF6 = Number(Math.min(0.25, squeezeConvexity).toFixed(4));

      // ── Factor 7: Dark Pool & Off-Exchange Institutional Block Flow (Delta_F7)
      const darkPoolExcess = factors.darkPoolShare - 0.35;
      const deltaF7 = Number((darkPoolExcess * (factors.instFlowDelta >= 0 ? 0.35 : -0.20)).toFixed(4));

      // ── Factor 8: Institutional FII/DII Net Flow Velocity (Delta_F8) ────────
      const deltaF8 = Number((Math.max(-0.08, Math.min(0.08, factors.instFlowDelta * 2.5))).toFixed(4));

      // ── Factor 9: Dealer Vanna Exposure (Delta_F9) ──────────────────────────
      // In a rising market / vol drop, positive vanna creates mechanical buying
      const vannaFlowProxy = (factors.netVanna / 20000.0) * 0.04;
      const deltaF9 = Number(vannaFlowProxy.toFixed(4));

      // ── Factor 10: Dealer Charm & Max Pain OpEx Pinning (Delta_F10) ─────────
      const distanceToMaxPain = (factors.maxPainStrike - spotPrice) / spotPrice;
      const deltaF10 = Number((Math.max(-0.05, Math.min(0.05, distanceToMaxPain * 0.40))).toFixed(4));

      // ── Factor 11: Alternative Data Momentum (Delta_F11) ────────────────────
      const deltaF11 = Number((0.55 * factors.hiringVelocity * 0.15 + 0.45 * factors.appTrafficVelocity * 0.18).toFixed(4));

      // ── Factor 12: Commodity & Geopolitical Sensitivity (Delta_F12) ────────
      const brentImpact = factors.brentBeta * macro.brentDeltaPct;
      const copperImpact = factors.copperBeta * macro.copperDeltaPct;
      const deltaF12 = Number((brentImpact + copperImpact).toFixed(4));

      // ── Master Cumulative Institutional Fair Value ──────────────────────────
      const factorMultipliers = [
        1.0 + deltaF1,
        1.0 + deltaF2,
        1.0 + deltaF3,
        1.0 + deltaF4,
        1.0 + deltaF5,
        1.0 + deltaF6,
        1.0 + deltaF7,
        1.0 + deltaF8,
        1.0 + deltaF9,
        1.0 + deltaF10,
        1.0 + deltaF11,
        1.0 + deltaF12
      ];

      const cumulativeFactor = factorMultipliers.reduce((acc, f) => acc * f, 1.0);
      const institutionalFairValue = Number((spotPrice * cumulativeFactor).toFixed(2));
      const alphaSpreadPct = Number(((cumulativeFactor - 1.0) * 100.0).toFixed(2));

      // Sovereign Institutional Conviction Tier
      let convictionTier = 'NEUTRAL_CORE';
      if (alphaSpreadPct >= 12.0) convictionTier = 'SUPER_ALPHA_STRONG_BUY';
      else if (alphaSpreadPct >= 6.0) convictionTier = 'INSTITUTIONAL_BUY';
      else if (alphaSpreadPct <= -10.0) convictionTier = 'SEVERE_HEADWIND_AVOID';
      else if (alphaSpreadPct <= -5.0) convictionTier = 'UNDERWEIGHT_TRIM';

      return {
        symbol: sec.symbol,
        name: sec.name,
        country: sec.country || (isUS ? 'US' : 'IN'),
        currency,
        sector: sec.sector || 'Equities',
        spotPrice,
        institutionalFairValue,
        alphaSpreadPct,
        convictionTier,
        factors: {
          f1_macroRealYield: { deltaPct: Number((deltaF1 * 100).toFixed(2)), duration, realYieldPct: Number((realYield * 100).toFixed(2)) },
          f2_creditCdsHazard: { deltaPct: Number((deltaF2 * 100).toFixed(2)), cdsBps: factors.cds5Y, hyOasBps: factors.hyOas },
          f3_sloanAccrual: { deltaPct: Number((deltaF3 * 100).toFixed(2)), accrualRatio: factors.accrualRatio },
          f4_shareBuybackDilution: { deltaPct: Number((deltaF4 * 100).toFixed(2)), netShareChangePct: Number((factors.buybackVelocity * 100).toFixed(2)) },
          f5_beneishManipulation: { deltaPct: Number((deltaF5 * 100).toFixed(2)), beneishM: factors.beneishM },
          f6_shortDtcSqueeze: { deltaPct: Number((deltaF6 * 100).toFixed(2)), shortInterestPct: Number((factors.shortInterestFloat * 100).toFixed(1)), daysToCover: factors.daysToCover },
          f7_darkPoolBlockShare: { deltaPct: Number((deltaF7 * 100).toFixed(2)), darkPoolSharePct: Number((factors.darkPoolShare * 100).toFixed(1)) },
          f8_instFlowVelocity: { deltaPct: Number((deltaF8 * 100).toFixed(2)), instFlowDelta: factors.instFlowDelta },
          f9_dealerVanna: { deltaPct: Number((deltaF9 * 100).toFixed(2)), netVanna: factors.netVanna },
          f10_dealerCharmMaxPain: { deltaPct: Number((deltaF10 * 100).toFixed(2)), maxPainStrike: factors.maxPainStrike },
          f11_altDataMomentum: { deltaPct: Number((deltaF11 * 100).toFixed(2)), hiringVelocityPct: Number((factors.hiringVelocity * 100).toFixed(1)), appTrafficVelocityPct: Number((factors.appTrafficVelocity * 100).toFixed(1)) },
          f12_commodityGeopolitical: { deltaPct: Number((deltaF12 * 100).toFixed(2)), brentBeta: factors.brentBeta, copperBeta: factors.copperBeta }
        }
      };
    }

    /**
     * Evaluate the Entire 134-Equity Cross-Market Universe
     */
    evaluateUniverse(universe = []) {
      const candidates = universe.length > 0 ? universe : (SecurityMaster ? SecurityMaster.LOCAL_REGISTRY : []);
      const equities = candidates.filter(s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY');

      const evaluations = equities.map(sec => this.evaluate12FactorPricing(sec)).filter(Boolean);

      evaluations.sort((a, b) => b.alphaSpreadPct - a.alphaSpreadPct);

      return {
        timestamp: new Date().toISOString(),
        totalEvaluated: evaluations.length,
        topAlphaLongs: evaluations.slice(0, 10),
        topHeadwindShorts: [...evaluations].reverse().slice(0, 10),
        fullEvaluations: evaluations
      };
    }
  }

  const defaultInstance = new InstitutionalPricingEngine();

  return {
    VERSION,
    CODENAME,
    InstitutionalPricingEngine,
    defaultInstance,
    INSTITUTIONAL_FACTOR_ARCHETYPES
  };
}));
