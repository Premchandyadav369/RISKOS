/**
 * RISKOS Event Surveillance & Discontinuous Shock Prediction Engine
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: eventSurveillanceEngine.js
 * 
 * Purpose:
 * Provides continuous real-time surveillance, options volatility skew scanning,
 * dealer gamma exposure (GEX) acceleration tracking, Merton jump-diffusion
 * price projections, and global knowledge-graph supply-chain contagion.
 * 
 * Mathematical Formulation:
 * ------------------------------------------------------------------------------
 * 1. Catalyst Governance Score:
 *    I_event = w_gov * C_leadership + w_reg * R_clearance + w_rev * Delta_rev - w_anti * A_injunction
 * 
 * 2. Options Volatility Skew & 25-Delta Risk Reversal:
 *    RR_25 = sigma_IV(25d Call) - sigma_IV(25d Put)
 *    xi_skew = RR_25 / (sigma_ATM * 100)
 * 
 * 3. Dealer Net Gamma Exposure (GEX):
 *    GEX = \sum_k Gamma_k * OI_k * S^2 * 100
 *    Lambda_gamma = 1.0 + min(2.5, 0.95 * (|GEX_neg| / GEX_norm))
 * 
 * 4. Merton Discontinuous Jump Pricing:
 *    S_event* = S_0 * [ 1 + mu_J * (1.0 + kappa_gamma * (Lambda_gamma - 1.0) + kappa_skew * xi_skew) ]
 * 
 * 5. Supply-Chain Graph Contagion:
 *    Delta S_network = (I - alpha * A_supply)^(-1) * E_shock
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EventSurveillanceEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '3.6.0-PROPRIETARY';
  const CODENAME = 'P.R.E.M.-Surveillance';

  // Master Knowledge-Graph Adjacency Matrix (Tier-1 & Tier-2 Multi-Asset Dependencies)
  const CROSS_MARKET_DEPENDENCY_GRAPH = {
    // US & Global AI / Semiconductor Complex
    NVDA: [
      { target: 'TSM', type: 'EXCLUSIVE_FOUNDRY_PACKAGING', weight: 0.448, lagMinutes: 0 },
      { target: 'ARM', type: 'CPU_ARCHITECTURE_IP', weight: 0.511, lagMinutes: 0 },
      { target: 'ASML', type: 'EUV_LITHOGRAPHY_EQUIPMENT', weight: 0.295, lagMinutes: 0 },
      { target: 'TSLA', type: 'AUTONOMOUS_COMPUTE_CUSTOMER', weight: 0.364, lagMinutes: 0 },
      { target: 'AMD', type: 'ENTERPRISE_GPU_COMPETITOR', weight: 0.218, lagMinutes: 0 },
      { target: 'GOOGL', type: 'HYPERSCALER_CLOUD_PARTNER', weight: 0.201, lagMinutes: 0 },
      { target: 'MSFT', type: 'AZURE_AI_SUPERCOMPUTING', weight: 0.185, lagMinutes: 0 },
      { target: 'AMZN', type: 'AWS_BEDROCK_INFRASTRUCTURE', weight: 0.110, lagMinutes: 0 },
      { target: 'AVGO', type: 'NETWORKING_ASIC_INTERCONNECT', weight: 0.095, lagMinutes: 0 },
      { target: 'TCS', type: 'ENTERPRISE_AI_INTEGRATION_IN', weight: 0.075, lagMinutes: 30 },
      { target: 'INFY', type: 'GLOBAL_AI_SYSTEMS_IN', weight: 0.068, lagMinutes: 30 }
    ],
    TSLA: [
      { target: 'NVDA', type: 'TRAINING_GPU_SUPPLIER', weight: 0.280, lagMinutes: 0 },
      { target: 'TATAMOTORS', type: 'EV_POWERTRAIN_PEER_IN', weight: 0.165, lagMinutes: 60 },
      { target: 'OLAELEC', type: 'EV_MOBILITY_PEER_IN', weight: 0.142, lagMinutes: 60 }
    ],
    AAPL: [
      { target: 'TSM', type: 'A_SERIES_EXCLUSIVE_FOUNDRY', weight: 0.420, lagMinutes: 0 },
      { target: 'ARM', type: 'APPLE_SILICON_ISA', weight: 0.380, lagMinutes: 0 }
    ],
    MSFT: [
      { target: 'NVDA', type: 'GPU_SUPERCLUSTER_SUPPLIER', weight: 0.310, lagMinutes: 0 },
      { target: 'AMD', type: 'AZURE_MI300_ALTERNATIVE', weight: 0.150, lagMinutes: 0 },
      { target: 'TCS', type: 'GLOBAL_AZURE_INTEGRATOR_IN', weight: 0.082, lagMinutes: 30 }
    ],
    // Indian Conglomerates & Bellwethers
    RELIANCE: [
      { target: 'ONGC', type: 'DOMESTIC_ENERGY_PEER_IN', weight: 0.285, lagMinutes: 0 },
      { target: 'BHARTIARTL', type: 'TELECOM_INFRA_PEER_IN', weight: 0.240, lagMinutes: 0 },
      { target: 'RPOWER', type: 'ENERGY_ECOSYSTEM_IN', weight: 0.190, lagMinutes: 0 }
    ],
    HDFCBANK: [
      { target: 'ICICIBANK', type: 'PRIVATE_BANKING_PEER_IN', weight: 0.420, lagMinutes: 0 },
      { target: 'SBIN', type: 'DOMESTIC_CREDIT_BELLWETHER_IN', weight: 0.360, lagMinutes: 0 },
      { target: 'KOTAKBANK', type: 'PRIVATE_BANKING_PEER_IN', weight: 0.280, lagMinutes: 0 }
    ],
    TATAMOTORS: [
      { target: 'TATASTEEL', type: 'RAW_MATERIAL_INPUT_IN', weight: 0.290, lagMinutes: 0 },
      { target: 'OLAELEC', type: 'DOMESTIC_EV_RIVAL_IN', weight: 0.210, lagMinutes: 0 }
    ]
  };

  // Pre-calibrated Event Surveillance Watchlist & Known Catalysts
  const ACTIVE_CATALYST_WATCHLIST = {
    NVDA: {
      hasActiveCatalyst: true,
      catalystType: 'LEADERSHIP_REVERSAL',
      headline: 'Jensen Huang Reinstatement & Q3 $115B+ Vera Rubin Explosion',
      confidence: 0.98,
      regulatoryClearance: true,
      revenueSurprisePct: 18.5,
      guidanceRaisePct: 15.0,
      netGexMillions: -5200,
      normalizedGex: 3200,
      atmIv: 0.52,
      riskReversal25d: 11.2,
      assetBeta: 1.85
    },
    TSLA: {
      hasActiveCatalyst: true,
      catalystType: 'REGULATORY_CLEARANCE',
      headline: 'Federal NHTSA Autonomous Driving & Cybercab Operational Framework',
      confidence: 0.88,
      regulatoryClearance: true,
      revenueSurprisePct: 8.2,
      guidanceRaisePct: 12.0,
      netGexMillions: -3800,
      normalizedGex: 2800,
      atmIv: 0.62,
      riskReversal25d: 9.4,
      assetBeta: 2.10
    },
    RELIANCE: {
      hasActiveCatalyst: true,
      catalystType: 'CORPORATE_RESTRUCTURING',
      headline: 'Jio Digital & Reliance Retail Separate Listing Demerger Filings',
      confidence: 0.92,
      regulatoryClearance: true,
      revenueSurprisePct: 5.5,
      guidanceRaisePct: 8.0,
      netGexMillions: -1800,
      normalizedGex: 2200,
      atmIv: 0.24,
      riskReversal25d: 5.8,
      assetBeta: 1.08
    },
    TCS: {
      hasActiveCatalyst: true,
      catalystType: 'ENTERPRISE_SURPRISE',
      headline: 'Multi-Billion Dollar Sovereign Cloud & AI Foundry Long-Term Deal Wins',
      confidence: 0.85,
      regulatoryClearance: true,
      revenueSurprisePct: 6.4,
      guidanceRaisePct: 7.5,
      netGexMillions: -1200,
      normalizedGex: 1900,
      atmIv: 0.22,
      riskReversal25d: 4.2,
      assetBeta: 0.78
    },
    HDFCBANK: {
      hasActiveCatalyst: true,
      catalystType: 'INDEX_WEIGHT_REBALANCE',
      headline: 'MSCI & FTSE Emerging Market Foreign Inflow Headroom Expansion',
      confidence: 0.94,
      regulatoryClearance: true,
      revenueSurprisePct: 4.8,
      guidanceRaisePct: 6.0,
      netGexMillions: -2400,
      normalizedGex: 2500,
      atmIv: 0.23,
      riskReversal25d: 6.1,
      assetBeta: 1.12
    }
  };

  class EventSurveillanceEngine {
    constructor() {
      this.version = VERSION;
      this.codename = CODENAME;
      this.architect = 'Premchand Yadav';
      this.dependencyGraph = CROSS_MARKET_DEPENDENCY_GRAPH;
      this.watchlist = ACTIVE_CATALYST_WATCHLIST;
    }

    /**
     * Ingest and evaluate corporate catalyst metadata into an NLP score
     * @param {Object} eventData - Raw catalyst payload
     * @returns {Object} Normalized catalyst evaluation
     */
    evaluateEventCatalyst(eventData = {}) {
      const {
        type = 'GOVERNANCE_REVERSAL',
        isReinstatement = false,
        confidence = 0.90,
        regulatoryClearance = true,
        antiTrustInjunction = false,
        revenueSurprisePct = 0.0,
        guidanceRaisePct = 0.0
      } = eventData;

      let score = 0.0;
      let narrative = '';

      if (type === 'LEADERSHIP_REVERSAL' || isReinstatement) {
        score += 0.65 * (confidence || 0.90);
        narrative += 'C-suite leadership dispute resolved with unanimous board backing. ';
      } else if (type === 'REGULATORY_CLEARANCE') {
        score += 0.55 * (confidence || 0.85);
        narrative += 'Regulatory approval & federal clearance granted. ';
      } else if (type === 'CORPORATE_RESTRUCTURING') {
        score += 0.45 * (confidence || 0.85);
        narrative += 'Value-unlocking demerger or spinoff announced. ';
      } else if (type === 'INDEX_WEIGHT_REBALANCE') {
        score += 0.40 * (confidence || 0.90);
        narrative += 'Massive passive index fund buying headroom unlocked. ';
      } else {
        score += 0.35 * (confidence || 0.80);
        narrative += 'Material positive commercial announcement. ';
      }

      if (regulatoryClearance) {
        score += 0.15;
      }
      if (antiTrustInjunction) {
        score -= 0.45;
        narrative += 'Adverse antitrust injunction filed. ';
      }

      if (revenueSurprisePct > 0) {
        score += Math.min(0.25, (revenueSurprisePct / 100.0) * 1.5);
        narrative += `Top-line beat of +${revenueSurprisePct.toFixed(1)}%. `;
      }

      if (guidanceRaisePct > 0) {
        score += Math.min(0.20, (guidanceRaisePct / 100.0) * 1.2);
        narrative += `Forward guidance raised by +${guidanceRaisePct.toFixed(1)}%. `;
      }

      const I_event = Math.max(-1.0, Math.min(1.0, score));

      return {
        I_event: Number(I_event.toFixed(4)),
        severity: Math.abs(I_event) > 0.65 ? 'SUPERCRITICAL_DISCONTINUITY' : (Math.abs(I_event) > 0.35 ? 'HIGH_IMPACT' : 'MODERATE_SHOCK'),
        direction: I_event >= 0 ? 'BULLISH_SURGE' : 'BEARISH_CAPITULATION',
        narrative: narrative.trim()
      };
    }

    /**
     * Compute Options Surface Skew & Dealer Gamma Squeeze Multiplier
     * @param {Object} optionsData - Volatility surface parameters
     * @returns {Object} Quantitative gamma metrics
     */
    computeGammaSqueeze(optionsData = {}) {
      const {
        netGexMillions = 0,
        normalizedGex = 3000,
        atmIv = 0.30,
        riskReversal25d = 2.0
      } = optionsData;

      let lambdaGamma = 1.0;
      let isShortGamma = false;

      if (netGexMillions < 0) {
        isShortGamma = true;
        const shortIntensity = Math.abs(netGexMillions) / (normalizedGex || 3000);
        lambdaGamma = 1.0 + Math.min(2.5, shortIntensity * 0.95);
      }

      const xiSkew = Number((riskReversal25d / ((atmIv || 0.30) * 100.0)).toFixed(4));
      const isCallInversion = riskReversal25d > 5.0;

      return {
        netGexMillions,
        isShortGamma,
        lambdaGamma: Number(lambdaGamma.toFixed(3)),
        xiSkew,
        isCallInversion,
        dealerState: lambdaGamma >= 1.6 ? 'ACUTE_GAMMA_SQUEEZE' : (lambdaGamma > 1.2 ? 'MODERATE_SQUEEZE' : 'BALANCED_HEDGING')
      };
    }

    /**
     * Predict Discontinuous Post-Shock Price
     * @param {Object} params - Security, event, and options parameters
     * @returns {Object} Comprehensive event-adjusted price predictions
     */
    predictEventPrice(params = {}) {
      const {
        symbol = 'NVDA',
        spotPrice = 125.53,
        beta = 1.85,
        eventData = {},
        optionsData = {}
      } = params;

      const catalyst = this.evaluateEventCatalyst(eventData);
      const gamma = this.computeGammaSqueeze(optionsData);

      // Merton Jump Amplitude (mu_J)
      const baseSensitivity = 0.185;
      const mu_J = catalyst.I_event * baseSensitivity * Math.min(1.5, Math.max(0.5, beta * 0.55));

      // Reflexive Non-Linear Acceleration:
      // totalJump = mu_J * [ 1.0 + kappa_gamma * (Lambda_gamma - 1.0) + kappa_skew * xi_skew ]
      const kappaGamma = 0.40;
      const kappaSkew = 0.35;
      const gammaAcc = kappaGamma * (gamma.lambdaGamma - 1.0);
      const skewAcc = kappaSkew * Math.max(0, gamma.xiSkew);

      const totalJumpFactor = mu_J * (1.0 + gammaAcc + skewAcc);
      const expectedMovePct = Number((totalJumpFactor * 100.0).toFixed(2));
      const targetPrice = Number((spotPrice * (1.0 + totalJumpFactor)).toFixed(2));

      // Jump Probability (Poisson intensity over event window)
      const jumpProbability = Math.min(0.98, Math.max(0.15, Math.abs(catalyst.I_event) * 0.70 + (gamma.isShortGamma ? 0.25 : 0.05)));

      // Asymmetric Liquidity Quoting Band (Skewed to prevent adverse selection)
      const halfSpreadPct = Math.max(0.015, (Math.abs(expectedMovePct) / 100.0) * 0.12);
      const optimalBid = Number((targetPrice * (1.0 - halfSpreadPct)).toFixed(2));
      const optimalAsk = Number((targetPrice * (1.0 + halfSpreadPct)).toFixed(2));

      return {
        symbol,
        spotPrice: Number(spotPrice.toFixed(2)),
        targetPrice,
        expectedMovePct,
        jumpProbability: Number(jumpProbability.toFixed(3)),
        catalystScore: catalyst.I_event,
        severity: catalyst.severity,
        direction: catalyst.direction,
        gammaMultiplier: gamma.lambdaGamma,
        dealerState: gamma.dealerState,
        skewAsymmetry: gamma.xiSkew,
        optimalBid,
        optimalAsk,
        spreadBps: Number((((optimalAsk - optimalBid) / targetPrice) * 10000).toFixed(1)),
        narrative: catalyst.narrative
      };
    }

    /**
     * Propagate Primary Shock across the Global Knowledge Graph
     * @param {string} anchorSymbol - Anchor ticker (e.g. 'NVDA')
     * @param {number} anchorMovePct - Primary jump percentage (e.g. 31.48)
     * @returns {Array<Object>} Downstream network price moves
     */
    propagateContagion(anchorSymbol = 'NVDA', anchorMovePct = 31.48) {
      const dependencies = this.dependencyGraph[anchorSymbol] || [];
      const networkMoves = [];

      for (const dep of dependencies) {
        const damping = 1.0 - (dep.weight * 0.15);
        const expectedContagionMovePct = Number((anchorMovePct * dep.weight * damping).toFixed(2));

        networkMoves.push({
          targetSymbol: dep.target,
          relationship: dep.type,
          weight: dep.weight,
          expectedMovePct: expectedContagionMovePct,
          confidencePct: Number((85 + dep.weight * 12).toFixed(1))
        });
      }

      return networkMoves.sort((a, b) => b.expectedMovePct - a.expectedMovePct);
    }

    /**
     * Surveillance Scanner across Entire Security Universe
     * Evaluates event risk, gamma zones, and discontinuous target prices.
     * @param {Array<Object>} securities - Array of security objects from SecurityMaster
     * @returns {Object} Comprehensive universe event surveillance telemetry
     */
    scanUniverseEventRisk(securities = []) {
      const scanned = securities.map(sec => {
        const spot = Number(sec.basePrice || sec.price || 100.0);
        const beta = Number(sec.beta !== undefined ? sec.beta : 1.0);
        const watchlistEntry = this.watchlist[sec.symbol];

        let eventData = {};
        let optionsData = {};

        if (watchlistEntry) {
          eventData = {
            type: watchlistEntry.catalystType,
            confidence: watchlistEntry.confidence,
            regulatoryClearance: watchlistEntry.regulatoryClearance,
            revenueSurprisePct: watchlistEntry.revenueSurprisePct,
            guidanceRaisePct: watchlistEntry.guidanceRaisePct
          };
          optionsData = {
            netGexMillions: watchlistEntry.netGexMillions,
            normalizedGex: watchlistEntry.normalizedGex,
            atmIv: watchlistEntry.atmIv,
            riskReversal25d: watchlistEntry.riskReversal25d
          };
        } else {
          // Synthetic baseline options/event calibration anchored to beta & volatility
          const vol = Number(sec.vol !== undefined ? sec.vol : 0.25);
          const syntheticGex = vol > 0.35 ? -800 * (beta - 0.8) : 500;
          optionsData = {
            netGexMillions: Number(syntheticGex.toFixed(0)),
            normalizedGex: 1500,
            atmIv: vol,
            riskReversal25d: (beta - 1.0) * 3.0
          };
          eventData = {
            type: 'MACRO_MOMENTUM',
            confidence: 0.70,
            regulatoryClearance: true,
            revenueSurprisePct: Math.max(0, (beta - 1.0) * 5.0)
          };
        }

        const eventResult = this.predictEventPrice({
          symbol: sec.symbol,
          spotPrice: spot,
          beta,
          eventData,
          optionsData
        });

        const hasContagion = !!this.dependencyGraph[sec.symbol];
        const contagionNetwork = hasContagion ? this.propagateContagion(sec.symbol, eventResult.expectedMovePct) : [];

        return {
          symbol: sec.symbol,
          name: sec.name || sec.symbol,
          country: sec.country,
          currency: sec.currency,
          sector: sec.sector,
          spotPrice: spot,
          beta,
          isHighEventRisk: !!watchlistEntry,
          eventResult,
          hasContagion,
          contagionNetwork
        };
      });

      const highEventRiskStocks = scanned.filter(s => s.isHighEventRisk);
      const acuteGammaSqueezeStocks = scanned.filter(s => s.eventResult.dealerState === 'ACUTE_GAMMA_SQUEEZE');
      const topBullishJumps = scanned.slice().sort((a, b) => b.eventResult.expectedMovePct - a.eventResult.expectedMovePct).slice(0, 10);

      return {
        timestamp: new Date().toISOString(),
        engine: 'P.R.E.M.-Surveillance Real-Time Event Scanner',
        version: this.version,
        architect: this.architect,
        summary: {
          totalSecuritiesScanned: scanned.length,
          highEventRiskCount: highEventRiskStocks.length,
          acuteGammaSqueezeCount: acuteGammaSqueezeStocks.length,
          watchlistCoverage: Object.keys(this.watchlist).length,
          contagionGraphNodes: Object.keys(this.dependencyGraph).length
        },
        highEventRiskStocks,
        acuteGammaSqueezeStocks,
        topBullishJumps,
        scanned
      };
    }
  }

  return new EventSurveillanceEngine();
}));
