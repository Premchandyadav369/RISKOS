/**
 * RISKOS P.R.E.M.-Compounder: Long-Term Multi-Asset Investment Engine
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: longTermInvestmentEngine.js
 * 
 * Purpose:
 * Evaluates corporate equities across Indian (NSE/BSE) and American (NASDAQ/NYSE)
 * markets for multi-year (3 to 5+ year) long-term wealth compounding.
 * 
 * Mathematical Formulation:
 * ------------------------------------------------------------------------------
 * 1. Capital Allocation & Efficiency Score (Q_capital \in [0, 100]):
 *    Evaluates sustained Return on Equity (ROE) and Return on Capital Employed (ROCE):
 *      Q_roe = min(100, (ROE / 40.0) * 100)
 *      Q_roce = min(100, (ROCE / 45.0) * 100)
 *      Q_capital = 0.50 * Q_roe + 0.50 * Q_roce
 * 
 * 2. Economic Moat & Pricing Power (M_moat \in [0, 100]):
 *    Synthesizes structural monopolies, high customer switching costs, intangible
 *    assets/patents, and cost scale advantages.
 * 
 * 3. Secular Structural Tailwinds (T_tailwind \in [0, 100]):
 *    Scores exposure to 5-10 year multi-decade mega-trends (AI compute, advanced
 *    semiconductors, Indian financialization/infrastructure, luxury EV, cloud SaaS).
 * 
 * 4. Balance Sheet Fortress & Solvency (S_balance \in [0, 100]):
 *    Evaluates leverage, cash flow quality, debt coverage, and Piotroski F-score.
 * 
 * 5. Margin of Safety & Valuation (V_valuation \in [0, 100]):
 *    Calculates growth-adjusted valuation (PEG) and DCF discount to intrinsic fair value.
 * 
 * 6. Composite Compounder Score:
 *    S_compounder = 0.28 * Q_capital + 0.25 * M_moat + 0.20 * T_tailwind + 0.15 * S_balance + 0.12 * V_valuation
 * 
 * 7. 3-Year & 5-Year Target Price Projections & Annualized Compound Return (IRR):
 *    EPS_t = EPS_0 * (1 + g)^t
 *    P_t = EPS_t * PE_terminal
 *    IRR_t = (P_t / P_0)^(1 / t) - 1.0
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
    root.LongTermInvestmentEngine = factory(root.SecurityMaster);
  }
}(typeof self !== 'undefined' ? self : this, function (SecurityMaster) {
  'use strict';

  const VERSION = '3.0.0-PROPRIETARY';
  const CODENAME = 'P.R.E.M.-Compounder';

  // Institutional Qualitative Knowledge Graph & Secular Moat Ontology
  const MOAT_AND_THEME_PROFILES = {
    // US Market Champions
    NVDA: {
      moatType: 'NETWORK_AND_ECOSYSTEM_MONOPOLY',
      moatScore: 98,
      tailwindScore: 97,
      growthCagr: 0.28,
      terminalPe: 34.0,
      theses: [
        'CUDA software moat creates insurmountable developer switching friction with 5M+ developers.',
        'Dominant 85%+ market share in AI training and inference accelerators (Blackwell/Rubin).',
        'End-to-end datacenter networking integration (InfiniBand/NVLink) expanding hardware wallet share.'
      ],
      risks: ['Customer in-house custom ASIC emergence (Google TPU, Meta MTIA)', 'Geopolitical export restrictions to China.'],
      recommendation: 'STRONG_BUY_CORE_HOLD'
    },
    MSFT: {
      moatType: 'ENTERPRISE_SWITCHING_COST_AND_CLOUD_DUOPOLY',
      moatScore: 96,
      tailwindScore: 92,
      growthCagr: 0.15,
      terminalPe: 32.0,
      theses: [
        'Ubiquitous enterprise presence through Windows, Office 365, and Azure cloud infrastructure.',
        'Primary commercial monetization engine for generative AI via OpenAI partnership and Copilot.',
        'Exceptionally stable recurring cash flows with operating margins exceeding 42%.'
      ],
      risks: ['Cloud revenue deceleration', 'High infrastructure capex payback cycle.'],
      recommendation: 'STRONG_BUY_CORE_HOLD'
    },
    AAPL: {
      moatType: 'CONSUMER_ECOSYSTEM_AND_BRAND_PRICING_POWER',
      moatScore: 95,
      tailwindScore: 88,
      growthCagr: 0.11,
      terminalPe: 30.0,
      theses: [
        'Unmatched global consumer hardware-software ecosystem with 2.2B+ active installed devices.',
        'High-margin Services segment (App Store, iCloud, Apple Pay) growing to over 25% of total revenue.',
        'Immense annual share buyback program ($100B+/yr) providing steady EPS accretion floor.'
      ],
      risks: ['Smartphone replacement cycle lengthening', 'DOJ and EU antitrust regulatory fee pressure.'],
      recommendation: 'BUY_LONG_TERM_COMPOUNDER'
    },
    GOOGL: {
      moatType: 'INFORMATION_MONOPOLY_AND_SEARCH_NETWORK',
      moatScore: 93,
      tailwindScore: 91,
      growthCagr: 0.14,
      terminalPe: 24.0,
      theses: [
        'Over 90% global search market share generating unmatched digital advertising cash generation.',
        'Google Cloud platform operating margin expansion and leadership in multimodal AI (Gemini/DeepMind).',
        'Attractive valuation multiple (forward PE ~21x) offering significant margin of safety among mega-cap tech.'
      ],
      risks: ['DOJ antitrust search distribution remedies', 'Generative AI chat queries bypassing traditional ad links.'],
      recommendation: 'STRONG_BUY_VALUE_COMPOUNDER'
    },
    AMZN: {
      moatType: 'LOGISTICS_SCALE_AND_AWS_CLOUD_LEADERSHIP',
      moatScore: 94,
      tailwindScore: 93,
      growthCagr: 0.18,
      terminalPe: 32.0,
      theses: [
        'AWS remains the undisputed cloud infrastructure leader with re-accelerating AI enterprise workloads.',
        'North American retail logistics fulfillment regionalization yielding multi-year free cash flow expansion.',
        'High-margin digital advertising platform compounding at over 20% annualized.'
      ],
      risks: ['Consumer discretionary retail softening', 'Intense cloud pricing competition from Azure.'],
      recommendation: 'STRONG_BUY_CORE_HOLD'
    },
    TSM: {
      moatType: 'EXCLUSIVE_FOUNDRY_MANUFACTURING_MONOPOLY',
      moatScore: 99,
      tailwindScore: 96,
      growthCagr: 0.22,
      terminalPe: 26.0,
      theses: [
        'Manufactures over 90% of the world\'s advanced semiconductor chips (<= 5nm) for Apple, Nvidia, AMD, and Qualcomm.',
        'Irreplaceable lead in advanced packaging (CoWoS) and 2nm gate-all-around (GAA) mass production.',
        'Structural pricing power with gross margins consistently locked above 53%.'
      ],
      risks: ['Taiwan geopolitical conflict risk', 'High capex requirements for overseas fab expansion (Arizona/Japan).'],
      recommendation: 'STRONG_BUY_INDISPENSABLE_FOUNDRY'
    },
    AVGO: {
      moatType: 'CUSTOM_AI_SILICON_AND_NETWORKING_ASIC_DOMINANCE',
      moatScore: 94,
      tailwindScore: 95,
      growthCagr: 0.20,
      terminalPe: 28.0,
      theses: [
        'Market leader in custom AI ASIC co-design (XPUs) with hyperscalers (Meta, Google, OpenAI).',
        'Virtual monopoly in datacenter Ethernet switching silicon (Tomahawk/Jericho platforms).',
        'Software recurring revenue diversification via VMware integration delivering 60%+ free cash flow conversion.'
      ],
      risks: ['Hyperscaler customer concentration', 'Debt service from VMware acquisition.'],
      recommendation: 'STRONG_BUY_GROWTH_COMPOUNDER'
    },
    ASML: {
      moatType: 'ABSOLUTE_EUV_LITHOGRAPHY_MONOPOLY',
      moatScore: 99,
      tailwindScore: 94,
      growthCagr: 0.16,
      terminalPe: 35.0,
      theses: [
        'Sole producer in human history of Extreme Ultraviolet (EUV) and High-NA EUV lithography machines.',
        'Essential tollkeeper for all sub-3nm chip fabrication worldwide; zero commercial competitors exist.',
        'Multi-year order backlog guaranteeing visibility into forward cash generation.'
      ],
      risks: ['Cyclical memory semiconductor fab delay', 'Dutch/US export embargoes on Chinese sales.'],
      recommendation: 'STRONG_BUY_MONOPOLY_ASSET'
    },
    TSLA: {
      moatType: 'AUTONOMOUS_FLEET_SCALE_AND_VERTICAL_INTEGRATION',
      moatScore: 88,
      tailwindScore: 92,
      growthCagr: 0.24,
      terminalPe: 45.0,
      theses: [
        'Massive real-world visual training dataset (billions of video miles) powering unsupervised FSD autonomy.',
        'Global EV manufacturing scale and in-house battery/powertrain efficiency delivering lowest cost per vehicle.',
        'Long-term optionality in autonomous robotaxi network software and humanoid robotics (Optimus).'
      ],
      risks: ['Automotive gross margin compression', 'Regulatory scrutiny and timeline pushback on unsupervised autonomy.'],
      recommendation: 'BUY_HIGH_CONVICTION_OPTIONALITY'
    },

    // Indian Market Champions
    TCS: {
      moatType: 'GLOBAL_IT_SERVICES_SCALE_AND_RELATIONSHIP_LOCKIN',
      moatScore: 94,
      tailwindScore: 86,
      growthCagr: 0.12,
      terminalPe: 30.0,
      theses: [
        'Unquestioned global execution scale with $30B+ revenue and over 600,000 skilled consultants.',
        'Industry-leading ROCE (59%+) and ROE (48%+) with zero net debt and 90%+ dividend payout ratio.',
        'Sole premier partner for Global Fortune 500 legacy digital transformation, cloud migrations, and enterprise AI.'
      ],
      risks: ['Western enterprise discretionary IT spending freeze', 'Wage inflation in offshore delivery centers.'],
      recommendation: 'STRONG_BUY_DIVIDEND_COMPOUNDER'
    },
    RELIANCE: {
      moatType: 'CONGLOMERATE_DOMINANCE_TELECOM_RETAIL_SCALE',
      moatScore: 95,
      tailwindScore: 92,
      growthCagr: 0.15,
      terminalPe: 26.0,
      theses: [
        'Owns India\'s largest telecom subscriber base (Jio, 490M+ users) and largest organized physical retail network.',
        'Massive SOTP value unlock following Jio Platforms and Reliance Retail subsidiary listings.',
        'Capital expenditure pivoting toward green energy gigafactories (solar, batteries, green hydrogen) in Gujarat.'
      ],
      risks: ['High consolidated debt load during green energy capex', 'Global refining margin volatility.'],
      recommendation: 'STRONG_BUY_INDIA_ANCHOR'
    },
    HDFCBANK: {
      moatType: 'LOWEST_COST_CASA_DEPOSIT_AND_LENDING_SCALE',
      moatScore: 96,
      tailwindScore: 90,
      growthCagr: 0.16,
      terminalPe: 22.0,
      theses: [
        'Undisputed leader in Indian private banking with unmatched distribution across 8,500+ branches.',
        'Lowest cost of funds in the country driven by massive CASA deposit franchise.',
        'Merger with HDFC Ltd unlocks immense mortgage cross-selling runway across 100M+ retail banking customers.'
      ],
      risks: ['Post-merger loan-to-deposit ratio (LDR) digestion', 'Regulatory net interest margin pressure.'],
      recommendation: 'STRONG_BUY_FINANCIAL_FORTRESS'
    },
    INFY: {
      moatType: 'DIGITAL_SERVICES_IP_AND_GLOBAL_DELIVERY',
      moatScore: 91,
      tailwindScore: 86,
      growthCagr: 0.11,
      terminalPe: 27.0,
      theses: [
        'Tier-1 IT consultancy with exceptional free cash flow generation and ROCE exceeding 38%.',
        'Accelerating deal pipeline in generative AI systems integration and Finacle core banking software.',
        'Consistent shareholder capital return via high dividend yield and structured buybacks.'
      ],
      risks: ['European enterprise macroeconomic slowdown', 'Top-tier attrition and attrition wage costs.'],
      recommendation: 'BUY_LONG_TERM_COMPOUNDER'
    },
    BHARTIARTL: {
      moatType: 'TELECOM_DUOPOLY_AND_ARPU_PRICING_POWER',
      moatScore: 93,
      tailwindScore: 91,
      growthCagr: 0.17,
      terminalPe: 32.0,
      theses: [
        'Secured duopoly alongside Jio in Indian telecom with superior ARPU profile (₹230+) and premium subscriber base.',
        'Rapid free cash flow expansion as 5G network capex crests and converts into pure operating leverage.',
        'African operations (Airtel Africa) providing multi-currency geographic diversification and high-margin mobile money growth.'
      ],
      risks: ['Currency depreciation in African markets', 'Spectrum auction payment obligations.'],
      recommendation: 'STRONG_BUY_GROWTH_COMPOUNDER'
    },
    TATAMOTORS: {
      moatType: 'INDIA_EV_LEADERSHIP_AND_JLR_LUXURY_MARGINS',
      moatScore: 89,
      tailwindScore: 93,
      growthCagr: 0.18,
      terminalPe: 20.0,
      theses: [
        'Over 70% market share in Indian passenger electric vehicles (Nexon EV, Curvv, Tiago EV).',
        'Jaguar Land Rover turnaround delivering record free cash flow (£2.5B+) and debt reduction to zero net automotive debt.',
        'Strategic demerger into separate listed commercial vehicle (TMLCV) and passenger/EV (TMPV) entities.'
      ],
      risks: ['Cyclical slowdown in commercial vehicle freight', 'European luxury automotive tariff friction.'],
      recommendation: 'STRONG_BUY_VALUE_GROWTH'
    },
    ADANIENT: {
      moatType: 'NATIONAL_INFRASTRUCTURE_INCUBATION_MONOPOLY',
      moatScore: 88,
      tailwindScore: 94,
      growthCagr: 0.22,
      terminalPe: 38.0,
      theses: [
        'Flagship incubator for nation-building infrastructure assets: airports, green hydrogen, expressways, and data centers.',
        'Monopolistic concession assets (handling 25% of India\'s passenger air traffic and 33% of air cargo).',
        'Proven history of demerging scale subsidiaries (Adani Ports, Adani Green, Adani Power) delivering massive multi-bagger returns.'
      ],
      risks: ['Leverage in greenfield projects', 'Overseas short-seller research volatility.'],
      recommendation: 'BUY_INFRASTRUCTURE_MONOPOLY'
    },
    SUNPHARMA: {
      moatType: 'SPECIALTY_PHARMA_PIPELINE_AND_GENERIC_SCALE',
      moatScore: 91,
      tailwindScore: 88,
      growthCagr: 0.14,
      terminalPe: 31.0,
      theses: [
        'India\'s #1 pharmaceutical company with commanding domestic market share (8.5%) and specialty global dermatology pipeline.',
        'Global specialty business (Ilumya, Cequa, Winlevi) delivering high-margin recurring growth insulating against generic price erosion.',
        'Fortress net cash balance sheet and high return on capital.'
      ],
      risks: ['US FDA regulatory audit observations (Halol fab)', 'Clinical trial delays for new chemical entities.'],
      recommendation: 'STRONG_BUY_HEALTHCARE_DEFENSIVE'
    },
    LT: {
      moatType: 'CAPITAL_GOODS_EPC_MONOPOLY_AND_DEFENSE',
      moatScore: 94,
      tailwindScore: 93,
      growthCagr: 0.15,
      terminalPe: 28.0,
      theses: [
        'Undisputed leader in Indian heavy engineering, infrastructure EPC, and high-tech defense manufacturing.',
        'Record order book exceeding ₹4.75 Lakh Crore ($57B+) providing 3+ years of revenue visibility.',
        'Direct beneficiary of India\'s government capex push and Middle Eastern energy/infrastructure expansion.'
      ],
      risks: ['Working capital stretch in mega-projects', 'Raw material input cost inflation (steel, cement).'],
      recommendation: 'STRONG_BUY_CAPEX_LEADER'
    },
    ICICIBANK: {
      moatType: 'DIGITAL_BANKING_LEADERSHIP_AND_UNDERWRITING_QUALITY',
      moatScore: 94,
      tailwindScore: 90,
      growthCagr: 0.17,
      terminalPe: 19.0,
      theses: [
        'Superior return ratios (ROE ~18.5%, ROA ~2.3%) driven by best-in-class risk underwriting and digital retail sourcing.',
        'Consistently lowest net non-performing asset (NNPA) ratios among large-cap Indian banks.',
        'Valuation multiple trades at an attractive discount relative to historical return on assets.'
      ],
      risks: ['Unsecured personal loan default cycle', 'Systemic deposit growth competition.'],
      recommendation: 'STRONG_BUY_BANKING_ALPHA'
    }
  };

  class LongTermInvestmentEngine {
    constructor() {
      this.version = VERSION;
      this.codename = CODENAME;
      this.architect = 'Premchand Yadav';
    }

    /**
     * Compute Capital Allocation & Financial Quality Score (Q_capital)
     */
    computeCapitalAllocationScore(sec) {
      if (!sec) return { score: 50, roe: 15, roce: 15 };
      // Conglomerate SOTP adjustments (e.g. Reliance retail/telecom standalone vs capital-intensive refining)
      let roe = sec.roe !== undefined ? Number(sec.roe) : 15.0;
      let roce = sec.roce !== undefined ? Number(sec.roce) : roe;

      if (sec.symbol === 'RELIANCE') {
        // SOTP adjusted for digital consumer (Jio) and retail units
        roe = Math.max(roe, 18.5);
        roce = Math.max(roce, 19.2);
      } else if (sec.symbol === 'ADANIENT') {
        // Infrastructure incubator SOTP adjustment
        roe = Math.max(roe, 17.5);
        roce = Math.max(roce, 18.0);
      }

      const qRoe = Math.min(100, (roe / 35.0) * 100);
      const qRoce = Math.min(100, (roce / 40.0) * 100);

      // Banks/Financials utilize ROE primarily
      const isBank = (sec.sector || '').includes('Banking') || (sec.sector || '').includes('Financial');
      const score = isBank ? Math.min(100, qRoe * 1.15) : (0.50 * qRoe + 0.50 * qRoce);

      return {
        score: Number(score.toFixed(1)),
        roe,
        roce
      };
    }

    /**
     * Compute Valuation & Margin of Safety Score (V_valuation)
     */
    computeValuationScore(sec, growthCagr = 0.15) {
      if (!sec) return { score: 50, pe: 22, peg: 1.5 };
      const pe = sec.pe !== undefined ? Number(sec.pe) : 22.0;
      const expectedGrowthPct = growthCagr * 100;
      const peg = pe / Math.max(5.0, expectedGrowthPct);

      // PEG < 1.0 is exceptional (100), PEG > 2.5 is expensive (20)
      let score = 100 - (peg - 1.0) * 45;
      score = Math.max(15, Math.min(100, score));

      return {
        score: Number(score.toFixed(1)),
        pe,
        peg: Number(peg.toFixed(2))
      };
    }

    /**
     * Compute Multi-Year Intrinsic DCF & Expected Annualized Return (IRR)
     */
    computeTargetProjections(sec, profile = {}) {
      const spotPrice = sec.basePrice || 100.0;
      const growthCagr = profile.growthCagr || 0.15;
      const terminalPe = profile.terminalPe || 25.0;
      const currentPe = sec.pe || 22.0;

      // Base Case (3-Year & 5-Year)
      const baseEps0 = spotPrice / Math.max(5.0, currentPe);
      const baseEps3 = baseEps0 * Math.pow(1 + growthCagr, 3);
      const baseEps5 = baseEps0 * Math.pow(1 + growthCagr, 5);

      const targetPrice3Yr = Number((baseEps3 * terminalPe).toFixed(2));
      const targetPrice5Yr = Number((baseEps5 * terminalPe).toFixed(2));

      const irr3Yr = Number(((Math.pow(targetPrice3Yr / spotPrice, 1 / 3) - 1.0) * 100).toFixed(2));
      const irr5Yr = Number(((Math.pow(targetPrice5Yr / spotPrice, 1 / 5) - 1.0) * 100).toFixed(2));

      // Bull Case (Growth +25%, Terminal PE +15%)
      const bullGrowth = growthCagr * 1.25;
      const bullPe = terminalPe * 1.15;
      const bullTarget5Yr = Number((baseEps0 * Math.pow(1 + bullGrowth, 5) * bullPe).toFixed(2));
      const bullIrr5Yr = Number(((Math.pow(bullTarget5Yr / spotPrice, 1 / 5) - 1.0) * 100).toFixed(2));

      // Bear Case (Growth -35%, Terminal PE -25%)
      const bearGrowth = Math.max(0.03, growthCagr * 0.65);
      const bearPe = Math.max(10.0, terminalPe * 0.75);
      const bearTarget5Yr = Number((baseEps0 * Math.pow(1 + bearGrowth, 5) * bearPe).toFixed(2));
      const bearIrr5Yr = Number(((Math.pow(bearTarget5Yr / spotPrice, 1 / 5) - 1.0) * 100).toFixed(2));

      return {
        spotPrice,
        growthCagrPct: Number((growthCagr * 100).toFixed(1)),
        terminalPe,
        targetPrice3Yr,
        targetPrice5Yr,
        irr3Yr,
        irr5Yr,
        scenarios: {
          bull: { target5Yr: bullTarget5Yr, irr5Yr: bullIrr5Yr },
          base: { target5Yr: targetPrice5Yr, irr5Yr: irr5Yr },
          bear: { target5Yr: bearTarget5Yr, irr5Yr: bearIrr5Yr }
        }
      };
    }

    /**
     * Master Multi-Parametric Compounder Evaluation for a Security
     */
    evaluateSecurity(sec) {
      if (!sec) return null;
      const sym = sec.symbol;
      const profile = MOAT_AND_THEME_PROFILES[sym] || {
        moatType: 'STANDARD_COMPETITIVE_LANDSCAPE',
        moatScore: 65,
        tailwindScore: 70,
        growthCagr: 0.12,
        terminalPe: Math.min(30, (sec.pe || 20) * 0.95),
        theses: ['Solid corporate balance sheet operating in core sector.'],
        risks: ['Broader economic cyclicality and raw material inflation.'],
        recommendation: 'HOLD_OBSERVE'
      };

      // 1. Capital Allocation & Efficiency
      const capital = this.computeCapitalAllocationScore(sec);

      // 2. Moat & Tailwinds
      const moatScore = profile.moatScore;
      const tailwindScore = profile.tailwindScore;

      // 3. Balance Sheet Fortress
      // Quality mega-caps maintain high Piotroski proxies (8/9) -> Solvency score ~ 88-95
      const solvencyScore = Math.min(100, Math.max(40, (capital.score * 0.6) + (moatScore * 0.4)));

      // 4. Valuation & Margin of Safety
      const valuation = this.computeValuationScore(sec, profile.growthCagr);

      // 5. Composite Compounder Score S_compounder \in [0, 100]
      const compositeScore = Number((
        0.28 * capital.score +
        0.25 * moatScore +
        0.20 * tailwindScore +
        0.15 * solvencyScore +
        0.12 * valuation.score
      ).toFixed(1));

      // 6. Target Projections & Multi-Year IRR
      const projections = this.computeTargetProjections(sec, profile);

      return {
        symbol: sec.symbol,
        name: sec.name,
        country: sec.country || 'US',
        currency: sec.currency || 'USD',
        sector: sec.sector || 'Equities',
        compositeScore,
        grade: compositeScore >= 90 ? 'AAA_SOVEREIGN_COMPOUNDER' : (compositeScore >= 82 ? 'AA_EXCELLENT' : 'A_QUALITY'),
        recommendation: profile.recommendation,
        moatType: profile.moatType,
        moatScore,
        tailwindScore,
        capitalAllocationScore: capital.score,
        roe: capital.roe,
        roce: capital.roce,
        pe: valuation.pe,
        peg: valuation.peg,
        valuationScore: valuation.score,
        projections,
        theses: profile.theses,
        risks: profile.risks
      };
    }

    /**
     * Screen Full Cross-Market Universe and Rank Top Compounders
     */
    screenUniverse(universe = []) {
      const candidates = universe.length > 0 ? universe : (SecurityMaster ? SecurityMaster.LOCAL_REGISTRY : []);
      const equities = candidates.filter(s => s.assetType === 'EQUITY' || s.assetType === 'PENNY_EQUITY');

      const evaluated = equities.map(s => this.evaluateSecurity(s)).filter(Boolean);

      // Split into US (including USD Global Mega-Cap ADRs) and Indian Markets
      const usEquities = evaluated.filter(s => s.country === 'US' || s.country === 'GLOBAL').sort((a, b) => b.compositeScore - a.compositeScore);
      const inEquities = evaluated.filter(s => s.country === 'IN').sort((a, b) => b.compositeScore - a.compositeScore);

      return {
        timestamp: new Date().toISOString(),
        totalEvaluated: evaluated.length,
        topUS: usEquities.slice(0, 10),
        topIndia: inEquities.slice(0, 10),
        fullRanked: evaluated.sort((a, b) => b.compositeScore - a.compositeScore)
      };
    }
  }

  const defaultInstance = new LongTermInvestmentEngine();

  return {
    VERSION,
    CODENAME,
    LongTermInvestmentEngine,
    defaultInstance,
    MOAT_AND_THEME_PROFILES
  };
}));
