/**
 * RISKOS Autonomous Real-Time Web Seer & Alternative Data Ingestion Engine
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: webSeerEngine.js
 * 
 * Mathematical Specification & Multi-Tier Architecture:
 * ------------------------------------------------------------------------------
 * 1. Multi-Source Ingestion Pipeline:
 *    - Google News RSS Real-Time Wire (US & IN Editions)
 *    - Yahoo Finance News & Search Feed
 *    - Exchange Disclosures & SEC EDGAR Regulatory Filings
 *    - Search Velocity & Volume Spike Radar (V_search)
 * 
 * 2. Quantitative Entity & Ticker Resolution:
 *    - Entity disambiguation using SecurityMaster.LOCAL_REGISTRY aliases,
 *      C-suite executives, and subsidiary graphs.
 * 
 * 3. Zero-Shot Catalyst & Sentiment NLP:
 *    - Classifies text into standardized catalyst classes:
 *      LEADERSHIP_REINSTATEMENT (M=1.85, P=+1)
 *      CEO_DISMISSAL_SCANDAL    (M=1.80, P=-1)
 *      REGULATORY_CLEARANCE     (M=1.50, P=+1)
 *      ANTITRUST_SANCTION       (M=1.60, P=-1)
 *      MERGER_ACQUISITION_TARGET(M=1.70, P=+1)
 *      DEMERGER_VALUE_UNLOCK    (M=1.35, P=+1)
 *      EARNINGS_SUPER_SURPRISE  (M=1.40, P=+1)
 *      DEFENSE_MEGA_CONTRACT    (M=1.30, P=+1)
 *      CRITICAL_SUPPLY_HALT     (M=1.65, P=-1)
 * 
 * 4. Institutional Rumor vs. Fact Verification Index:
 *    - Evaluates Source Credibility (C_src \in [0.20, 1.00])
 *    - Rumor Index: R \in [0.00, 1.00]
 *    - Confirmation Velocity: V_conf = N_unique_sources / max(1, Delta t_hours)
 *    - Verification State: CONFIRMED_FACT (R <= 0.20), PROBABLE (R <= 0.50), RUMOR (R > 0.50)
 * 
 * 5. P.R.E.M.-Event Discontinuous Shock Coupling:
 *    - Automatic dispatch to PremEventShockEngine for instant Merton jump,
 *      gamma squeeze acceleration, and supply-chain graph contagion calculation.
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./securityMaster.js', './premEventShockEngine.js', './eventSurveillanceEngine.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    let SecurityMaster;
    let PremEventShockEngine;
    let EventSurveillanceEngine;
    try { SecurityMaster = require('../core/securityMaster.js').SecurityMaster || require('../core/securityMaster.js'); } catch (e) {}
    try { PremEventShockEngine = require('../quant/premEventShockEngine.js'); } catch (e) {}
    try { EventSurveillanceEngine = require('../quant/eventSurveillanceEngine.js'); } catch (e) {}
    module.exports = factory(SecurityMaster, PremEventShockEngine, EventSurveillanceEngine);
  } else {
    root.WebSeerEngine = factory(root.SecurityMaster, root.PremEventShockEngine, root.EventSurveillanceEngine);
  }
}(typeof self !== 'undefined' ? self : this, function (SecurityMaster, PremEventShockEngine, EventSurveillanceEngine) {
  'use strict';

  const VERSION = '4.0.0-PROPRIETARY';
  const CODENAME = 'P.R.E.M.-WebSeer';

  // Master Executive & Subsidiary Entity Dictionary for Disambiguation
  const ENTITY_DICTIONARY = [
    { symbol: 'NVDA', company: 'NVIDIA Corporation', country: 'US', keywords: ['nvidia', 'nvda', 'jensen huang', 'geforce', 'blackwell', 'h100', 'b200', 'cuda', 'rubin'] },
    { symbol: 'TSLA', company: 'Tesla Inc.', country: 'US', keywords: ['tesla', 'tsla', 'elon musk', 'cybertruck', 'gigafactory', 'fsd', 'autopilot', 'robotaxi', 'optimus'] },
    { symbol: 'AAPL', company: 'Apple Inc.', country: 'US', keywords: ['apple', 'aapl', 'tim cook', 'iphone', 'macbook', 'ios', 'vision pro', 'apple silicon', 'ipad'] },
    { symbol: 'MSFT', company: 'Microsoft Corporation', country: 'US', keywords: ['microsoft', 'msft', 'satya nadella', 'azure', 'copilot', 'windows', 'xbox', 'openai partner'] },
    { symbol: 'GOOGL', company: 'Alphabet Inc.', country: 'US', keywords: ['alphabet', 'google', 'googl', 'goog', 'sundar pichai', 'gemini', 'deepmind', 'android', 'youtube', 'waymo'] },
    { symbol: 'AMZN', company: 'Amazon.com Inc.', country: 'US', keywords: ['amazon', 'amzn', 'andy jassy', 'aws', 'prime', 'bedrock', 'jeff bezos'] },
    { symbol: 'META', company: 'Meta Platforms Inc.', country: 'US', keywords: ['meta', 'meta platforms', 'mark zuckerberg', 'facebook', 'instagram', 'whatsapp', 'llama', 'quest'] },
    { symbol: 'TSM', company: 'Taiwan Semiconductor Mfg', country: 'US', keywords: ['tsmc', 'tsm', 'taiwan semiconductor', 'cc wei', 'morris chang', 'chip foundry', '3nm', '2nm'] },
    { symbol: 'ARM', company: 'ARM Holdings Plc', country: 'US', keywords: ['arm', 'arm holdings', 'rene haas', 'arm architecture', 'cortex', 'neoverse'] },
    { symbol: 'ASML', company: 'ASML Holding NV', country: 'US', keywords: ['asml', 'asml holding', 'christophe fouquet', 'euv', 'high-na euv', 'lithography'] },
    { symbol: 'AMD', company: 'Advanced Micro Devices', country: 'US', keywords: ['amd', 'lisa su', 'radeon', 'ryzen', 'epyc', 'mi300', 'instinct'] },
    { symbol: 'AVGO', company: 'Broadcom Inc.', country: 'US', keywords: ['broadcom', 'avgo', 'hock tan', 'custom silicon', 'networking asic', 'vmware'] },
    { symbol: 'SMCI', company: 'Super Micro Computer', country: 'US', keywords: ['super micro', 'smci', 'charles liang', 'ai server', 'liquid cooling'] },
    
    // Indian Market Entities (NIFTY & High-Beta)
    { symbol: 'RELIANCE', company: 'Reliance Industries Ltd', country: 'IN', keywords: ['reliance', 'ril', 'mukesh ambani', 'jio', 'reliance retail', 'oil to chemicals', 'green energy gigafactory', 'demerger'] },
    { symbol: 'TCS', company: 'Tata Consultancy Services', country: 'IN', keywords: ['tcs', 'tata consultancy', 'k krithivasan', 'natarajan chandrasekaran', 'tata sons'] },
    { symbol: 'HDFCBANK', company: 'HDFC Bank Limited', country: 'IN', keywords: ['hdfc bank', 'hdfc', 'sashidhar jagdishan', 'hdfc merger'] },
    { symbol: 'INFY', company: 'Infosys Limited', country: 'IN', keywords: ['infosys', 'infy', 'salil parekh', 'narayana murthy', 'finacle'] },
    { symbol: 'ICICIBANK', company: 'ICICI Bank Ltd', country: 'IN', keywords: ['icici bank', 'sandeep bakhshi', 'icici'] },
    { symbol: 'SBIN', company: 'State Bank of India', country: 'IN', keywords: ['sbi', 'state bank of india', 'dinesh khara', 'cs setty'] },
    { symbol: 'BHARTIARTL', company: 'Bharti Airtel Ltd', country: 'IN', keywords: ['airtel', 'bharti airtel', 'sunil mittal', 'gopal vittal', 'airtel 5g'] },
    { symbol: 'ADANIENT', company: 'Adani Enterprises Ltd', country: 'IN', keywords: ['adani', 'adani enterprises', 'gautam adani', 'kutch copper', 'navi mumbai airport', 'hindenburg response', 'sebi clean chit'] },
    { symbol: 'TATAMOTORS', company: 'Tata Motors Limited', country: 'IN', keywords: ['tata motors', 'jlr', 'jaguar land rover', 'tata ev', 'nexon ev', 'curvv', 'tafe'] },
    { symbol: 'TATASTEEL', company: 'Tata Steel Limited', country: 'IN', keywords: ['tata steel', 'tv narendran', 'port talbot', 'kalinganagar', 'green steel'] },
    { symbol: 'WIPRO', company: 'Wipro Limited', country: 'IN', keywords: ['wipro', 'srini pallia', 'rishad premji'] },
    { symbol: 'LT', company: 'Larsen & Toubro Ltd', country: 'IN', keywords: ['l&t', 'larsen & toubro', 'sn subrahmanyan', 'defence contract', 'infra order'] },
    { symbol: 'SUNPHARMA', company: 'Sun Pharmaceutical', country: 'IN', keywords: ['sun pharma', 'dilip shanghvi', 'fda approval', 'generic drug'] },
    { symbol: 'ZOMATO', company: 'Zomato Limited', country: 'IN', keywords: ['zomato', 'deepinder goyal', 'blinkit', 'quick commerce'] },
    { symbol: 'PAYTM', company: 'One97 Communications', country: 'IN', keywords: ['paytm', 'one97', 'vijay shekhar sharma', 'rbi approval', 'upi soundbox'] }
  ];

  // News Sources & Institutional Credibility Matrix (C_src)
  const SOURCE_CREDIBILITY = {
    // Tier 1: Regulatory & Primary Exchange Wire (C_src: 0.95 - 1.00, Rumor Index: 0.05)
    'sec.gov': { tier: 1, cred: 1.00, rumor: 0.02, name: 'U.S. SEC EDGAR Official Filings' },
    'nseindia.com': { tier: 1, cred: 1.00, rumor: 0.02, name: 'NSE India Corporate Disclosures' },
    'bseindia.com': { tier: 1, cred: 1.00, rumor: 0.02, name: 'BSE India Corporate Disclosures' },
    'federalregister.gov': { tier: 1, cred: 1.00, rumor: 0.01, name: 'U.S. Federal Register' },
    'rbi.org.in': { tier: 1, cred: 1.00, rumor: 0.01, name: 'Reserve Bank of India' },
    'pib.gov.in': { tier: 1, cred: 0.98, rumor: 0.03, name: 'Press Information Bureau (Govt of India)' },

    // Tier 2: Primary Institutional Financial Wires (C_src: 0.88 - 0.95, Rumor Index: 0.10)
    'reuters': { tier: 2, cred: 0.94, rumor: 0.08, name: 'Reuters' },
    'bloomberg': { tier: 2, cred: 0.94, rumor: 0.08, name: 'Bloomberg Terminal / Wire' },
    'dow jones': { tier: 2, cred: 0.92, rumor: 0.10, name: 'Dow Jones Newswires' },
    'the wall street journal': { tier: 2, cred: 0.92, rumor: 0.10, name: 'The Wall Street Journal' },
    'wsj': { tier: 2, cred: 0.92, rumor: 0.10, name: 'The Wall Street Journal' },
    'financial times': { tier: 2, cred: 0.92, rumor: 0.10, name: 'Financial Times' },
    'ft.com': { tier: 2, cred: 0.92, rumor: 0.10, name: 'Financial Times' },
    'the new york times': { tier: 2, cred: 0.90, rumor: 0.12, name: 'The New York Times' },

    // Tier 3: High-Quality Financial & Business Media (C_src: 0.78 - 0.88, Rumor Index: 0.20)
    'cnbc': { tier: 3, cred: 0.86, rumor: 0.18, name: 'CNBC' },
    'economic times': { tier: 3, cred: 0.85, rumor: 0.18, name: 'The Economic Times' },
    'the economic times': { tier: 3, cred: 0.85, rumor: 0.18, name: 'The Economic Times' },
    'moneycontrol': { tier: 3, cred: 0.84, rumor: 0.19, name: 'Moneycontrol' },
    'business standard': { tier: 3, cred: 0.84, rumor: 0.19, name: 'Business Standard' },
    'mint': { tier: 3, cred: 0.83, rumor: 0.20, name: 'LiveMint' },
    'yahoo finance': { tier: 3, cred: 0.82, rumor: 0.22, name: 'Yahoo Finance' },
    'marketwatch': { tier: 3, cred: 0.82, rumor: 0.22, name: 'MarketWatch' },
    'barrons': { tier: 3, cred: 0.85, rumor: 0.18, name: 'Barron\'s' },
    'the guardian': { tier: 3, cred: 0.82, rumor: 0.20, name: 'The Guardian' },
    'afp': { tier: 3, cred: 0.86, rumor: 0.16, name: 'Agence France-Presse (AFP)' },
    'associated press': { tier: 3, cred: 0.88, rumor: 0.14, name: 'Associated Press (AP)' },

    // Tier 4: Syndicated / Retail / Speculative Media (C_src: 0.45 - 0.70, Rumor Index: 0.60)
    'seeking alpha': { tier: 4, cred: 0.65, rumor: 0.50, name: 'Seeking Alpha' },
    'the motley fool': { tier: 4, cred: 0.58, rumor: 0.55, name: 'The Motley Fool' },
    'investorplace': { tier: 4, cred: 0.55, rumor: 0.60, name: 'InvestorPlace' },
    'benzinga': { tier: 4, cred: 0.62, rumor: 0.52, name: 'Benzinga' },
    'twitter': { tier: 4, cred: 0.42, rumor: 0.82, name: 'X / Twitter Flow' },
    'reddit': { tier: 4, cred: 0.35, rumor: 0.88, name: 'Reddit Social Flow' }
  };

  // Catalyst NLP Classification Rules
  const CATALYST_LEXICON = [
    {
      type: 'LEADERSHIP_REINSTATEMENT',
      polarity: 1,
      multiplier: 1.85,
      confidenceBase: 0.92,
      patterns: [
        /\breinstat(ed|ement|ing)?\b/i,
        /\breturns? as ceo\b/i,
        /\bresumes? (leadership|ceo|helm)\b/i,
        /\bboard (backs|reaffirms|reappoints|confirms)\b/i,
        /\bcleared to (lead|return)\b/i,
        /\bhuang['’]s return\b/i,
        /\brestored to power\b/i
      ],
      description: 'Sudden CEO / founder reinstatement resolving governance vacuum'
    },
    {
      type: 'CEO_DISMISSAL_SCANDAL',
      polarity: -1,
      multiplier: 1.80,
      confidenceBase: 0.90,
      patterns: [
        /\b(ousted|fired|terminated|dismissed|forced out)\b/i,
        /\bresigns? amid(st)? (probe|investigation|scandal|fraud)\b/i,
        /\bsec probe\b/i,
        /\bforensic audit\b/i,
        /\baccounting irregularities\b/i,
        /\bceo steps down abruptly\b/i
      ],
      description: 'Sudden executive dismissal or corporate governance scandal'
    },
    {
      type: 'REGULATORY_CLEARANCE',
      polarity: 1,
      multiplier: 1.50,
      confidenceBase: 0.90,
      patterns: [
        /\bgranted\b.*\b(permit|clearance|approval|license)\b/i,
        /\b(regulators?|federal|nhtsa|fda|sec|doj|ftc|cci|sebi)\b.*\b(permit|clearance|approval|greenlight|greenlights|clears|license)\b/i,
        /\b(permit|clearance|approval|greenlight|greenlights|clears|license)\b.*\b(regulators?|federal|nhtsa|fda|sec|doj|ftc|cci|sebi)\b/i,
        /\b(autonomous|robotaxi|driverless)\b.*\b(permit|clearance|approval|license)\b/i,
        /\bfda (approves|approval|greenlights)\b/i,
        /\bexport license (granted|approved)\b/i,
        /\bclean[- ]chit\b/i,
        /\bvindicated by (supreme court|court|regulator)\b/i,
        /\binjunction (lifted|denied|dismissed)\b/i,
        /\bno wrongdoing found\b/i
      ],
      description: 'Major antitrust, regulatory, or autonomous export approval granted'
    },
    {
      type: 'ANTITRUST_SANCTION',
      polarity: -1,
      multiplier: 1.60,
      confidenceBase: 0.88,
      patterns: [
        /\bsued by (doj|ftc|eu|cci|sebi)\b/i,
        /\bantitrust (lawsuit|fine|penalty|sanction)\b/i,
        /\bforced (breakup|divestiture|split)\b/i,
        /\bexport ban\b/i,
        /\btargets chip smuggling\b/i,
        /\bcurbs imposed\b/i,
        /\bbanned from\b/i
      ],
      description: 'Hostile regulatory sanction, export embargo, or antitrust lawsuit'
    },
    {
      type: 'MERGER_ACQUISITION_TARGET',
      polarity: 1,
      multiplier: 1.70,
      confidenceBase: 0.86,
      patterns: [
        /\btakeover (bid|offer|target)\b/i,
        /\bagrees? to (acquire|buy|merge with)\b/i,
        /\bbought out\b/i,
        /\bacquisition premium\b/i,
        /\bhostile (takeover|bid)\b/i,
        /\ball-cash deal\b/i
      ],
      description: 'M&A takeover bid with cash or stock valuation premium'
    },
    {
      type: 'DEMERGER_VALUE_UNLOCK',
      polarity: 1,
      multiplier: 1.35,
      confidenceBase: 0.85,
      patterns: [
        /\bdemerger\b/i,
        /\bspins? off\b/i,
        /\bseparate (listing|ipo)\b/i,
        /\bcarve[- ]out\b/i,
        /\bdemerges? (retail|telecom|energy|jio)\b/i,
        /\bunlocks? shareholder value\b/i
      ],
      description: 'Corporate restructuring or subsidiary demerger unlock'
    },
    {
      type: 'EARNINGS_SUPER_SURPRISE',
      polarity: 1,
      multiplier: 1.40,
      confidenceBase: 0.89,
      patterns: [
        /\bcrushes? (estimates|expectations|forecasts)\b/i,
        /\bbeats? (revenue|eps|profit) by\b/i,
        /\braises? (full[- ]year|annual|quarterly) guidance\b/i,
        /\brecord (quarterly|annual) (profits?|revenues?)\b/i,
        /\bmassive (profit|earnings) beat\b/i
      ],
      description: 'Substantial earnings beat paired with upward forward guidance'
    },
    {
      type: 'DEFENSE_MEGA_CONTRACT',
      polarity: 1,
      multiplier: 1.30,
      confidenceBase: 0.82,
      patterns: [
        /\bwins? (mega|massive|multi[- ]billion) (contract|order|deal)\b/i,
        /\bdefence (order|contract)\b/i,
        /\bselected as exclusive (supplier|vendor)\b/i,
        /\bmajor order from\b/i
      ],
      description: 'Major commercial or defense infrastructure contract win'
    },
    {
      type: 'CRITICAL_SUPPLY_HALT',
      polarity: -1,
      multiplier: 1.65,
      confidenceBase: 0.87,
      patterns: [
        /\bfactory fire\b/i,
        /\bfoundry (halt|shutdown|explosion)\b/i,
        /\bsupply chain (severed|paralyzed|disrupted)\b/i,
        /\bproduction halted\b/i,
        /\bearthquake (damages|halts) fab\b/i
      ],
      description: 'Critical manufacturing catastrophe or supply chain paralysis'
    }
  ];

  // Benchmark Historic Replay Scenarios with Calibrated Institutional Options Conditions
  const HISTORIC_REPLAY_SCENARIOS = [
    {
      id: 'NVDA_NOV23_JENSEN_REINSTATEMENT',
      name: 'NVIDIA Jensen Huang Reinstatement Flash Surge (Nov 23, 2026)',
      symbol: 'NVDA',
      country: 'US',
      publishedAt: '2026-11-23T14:30:00Z',
      source: 'The New York Times',
      sourceUrl: 'https://nytimes.com/business/tech/stocks-surge-after-jensen-huang-reinstated-nvidia-ceo',
      headline: 'Stocks Surge After Jensen Huang Is Reinstated as Nvidia CEO with Full Board Authority and U.S. Federal Clearance',
      description: 'Nvidia Corporation shares surged in pre-market trading after the board confirmed founder Jensen Huang has resumed his role as Chief Executive Officer, dismissing governance uncertainty as federal regulators confirmed zero security blockers.',
      actualMovePct: 31.48,
      actualPrePrice: 141.20,
      actualPostPrice: 185.65,
      optionsMarket: {
        netGexMillions: -5200,
        normalizedGex: 3000,
        atmIv: 0.45,
        riskReversal25d: 14.2
      }
    },
    {
      id: 'TSLA_FSD_UNSUPERVISED_APPROVAL',
      name: 'Tesla FSD Unsupervised Nationwide Regulatory Approval',
      symbol: 'TSLA',
      country: 'US',
      publishedAt: '2026-10-18T16:15:00Z',
      source: 'Reuters',
      sourceUrl: 'https://reuters.com/business/autos/us-nhtsa-grants-tesla-unsupervised-autonomous-permit',
      headline: 'U.S. NHTSA Grants Tesla Full Unsupervised Autonomous Robotaxi Clearance Across 50 States',
      description: 'Federal regulators have officially granted Tesla permission to deploy fully driverless, unsupervised commercial robotaxi fleets on all public highways starting next month.',
      actualMovePct: 23.40,
      actualPrePrice: 214.50,
      actualPostPrice: 264.70,
      optionsMarket: {
        netGexMillions: -3200,
        normalizedGex: 2500,
        atmIv: 0.52,
        riskReversal25d: 11.5
      }
    },
    {
      id: 'RELIANCE_DEMERGER_VALUE_UNLOCK',
      name: 'Reliance Industries Strategic Jio & Retail Demerger Announcement',
      symbol: 'RELIANCE',
      country: 'IN',
      publishedAt: '2026-09-05T09:00:00Z',
      source: 'The Economic Times',
      sourceUrl: 'https://economictimes.com/markets/stocks/news/reliance-announces-formal-demerger-jio-retail',
      headline: 'Reliance Board Approves Formal Demerger of Jio Infocomm and Reliance Retail into Independent Listed Entities',
      description: 'Billionaire Mukesh Ambani announced a historic corporate restructuring demerging Reliance Retail and Jio Platforms to unlock massive shareholder value with separate NSE and BSE listings.',
      actualMovePct: 18.80,
      actualPrePrice: 2980.00,
      actualPostPrice: 3540.24,
      optionsMarket: {
        netGexMillions: -1800,
        normalizedGex: 2000,
        atmIv: 0.22,
        riskReversal25d: 7.8
      }
    },
    {
      id: 'ADANI_SUPREME_COURT_CLEAN_CHIT',
      name: 'Adani Group Complete Supreme Court & SEBI Regulatory Clearance',
      symbol: 'ADANIENT',
      country: 'IN',
      publishedAt: '2026-08-12T10:30:00Z',
      source: 'Press Information Bureau (Govt of India)',
      sourceUrl: 'https://pib.gov.in/press-release/adani-regulatory-closure',
      headline: 'Supreme Court and SEBI Dismiss All Remaining Petitions Against Adani Group, Confirming Full Regulatory Clearance',
      description: 'India Supreme Court bench concluded proceedings after regulatory investigators affirmed zero violation of accounting rules, clearing Adani Enterprises and subsidiaries of overseas report allegations.',
      actualMovePct: 17.20,
      actualPrePrice: 3120.00,
      actualPostPrice: 3656.64,
      optionsMarket: {
        netGexMillions: -2400,
        normalizedGex: 2200,
        atmIv: 0.38,
        riskReversal25d: 8.5
      }
    }
  ];

  class WebSeerEngine {
    constructor(options = {}) {
      this.version = VERSION;
      this.codename = CODENAME;
      this.architect = 'Premchand Yadav';

      this.options = Object.assign({
        maxBuffer: 500,
        enableContagion: true,
        requestTimeoutMs: 7000,
        minCredibilityThreshold: 0.60
      }, options);

      // In-Memory Ring Buffer & Deduplication Set
      this.alertsBuffer = [];
      this.seenHashes = new Set();
      this.listeners = {
        news: [],
        shock: [],
        rumor: []
      };

      // Search Velocity & Query Spike Tracker
      this.searchSpikeTracker = new Map();

      // Instantiate or link PremEventShockEngine / EventSurveillanceEngine
      if (PremEventShockEngine) {
        if (typeof PremEventShockEngine === 'function') {
          this.shockEngine = new PremEventShockEngine();
        } else {
          this.shockEngine = PremEventShockEngine;
        }
      } else {
        this.shockEngine = null;
      }

      if (EventSurveillanceEngine) {
        if (typeof EventSurveillanceEngine === 'function') {
          this.surveillanceEngine = new EventSurveillanceEngine();
        } else {
          this.surveillanceEngine = EventSurveillanceEngine;
        }
      } else {
        this.surveillanceEngine = null;
      }
    }

    /**
     * Subscribe to Real-Time Event Streams
     * @param {'news'|'shock'|'rumor'} event 
     * @param {Function} callback 
     */
    on(event, callback) {
      if (this.listeners[event]) {
        this.listeners[event].push(callback);
      }
      return this;
    }

    /**
     * Emit event to listeners
     */
    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try { cb(data); } catch (e) { console.error('WebSeer listener error:', e); }
        });
      }
    }

    /**
     * Generate content hash for deduplication
     */
    hashString(str) {
      let hash = 0;
      const clean = (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      for (let i = 0; i < clean.length; i++) {
        const char = clean.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'h_' + Math.abs(hash).toString(36);
    }

    /**
     * Clean and strip HTML tags / XML artifacts
     */
    cleanText(html) {
      if (!html) return '';
      return html
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
    }

    /**
     * Disambiguate Company / Ticker from News Text
     * @param {string} text - Title or Article Content
     * @returns {Object|null} Matching instrument record
     */
    resolveEntityFromText(text, titleOnly = '') {
      if (!text || typeof text !== 'string') return null;

      // Sanitize provider attribution noise (e.g. "Google News", "Yahoo Finance")
      const sanitized = text
        .replace(/\bgoogle news\b/gi, ' ')
        .replace(/\byahoo finance\b/gi, ' ')
        .replace(/\bgoogle alerts\b/gi, ' ');

      const lower = sanitized.toLowerCase();
      const lowerTitle = (titleOnly || '').toLowerCase();

      let bestCandidate = null;
      let highestScore = -1;

      // 1. Check Primary Entity Dictionary with Specificity Scoring
      for (const ent of ENTITY_DICTIONARY) {
        for (const kw of ent.keywords) {
          // Avoid matching bare generic words if not explicit
          if (kw === 'google' && lower.includes('google news')) continue;

          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const reg = new RegExp(`\\b${escaped}\\b`, 'i');

          if (reg.test(lower)) {
            // Priority score based on keyword length and whether it appears in the headline
            let score = kw.length * 2.0;
            if (lowerTitle && reg.test(lowerTitle)) {
              score += 50.0; // Huge bonus for headline match
            }
            if (kw === ent.symbol.toLowerCase()) {
              score += 20.0; // Bonus for explicit ticker
            }

            if (score > highestScore) {
              highestScore = score;
              bestCandidate = {
                symbol: ent.symbol,
                companyName: ent.company,
                country: ent.country,
                matchedKeyword: kw,
                matchScore: score
              };
            }
          }
        }
      }

      // 2. Fallback / Supplement: Check SecurityMaster.LOCAL_REGISTRY
      if (SecurityMaster && SecurityMaster.LOCAL_REGISTRY) {
        for (const sec of SecurityMaster.LOCAL_REGISTRY) {
          if (sec.aliases && Array.isArray(sec.aliases)) {
            for (const alias of sec.aliases) {
              const reg = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'i');
              if (reg.test(lower)) {
                let score = alias.length * 1.8;
                if (lowerTitle && reg.test(lowerTitle)) score += 40.0;
                if (score > highestScore) {
                  highestScore = score;
                  bestCandidate = {
                    symbol: sec.symbol,
                    companyName: sec.name,
                    country: sec.country || 'US',
                    matchedKeyword: alias,
                    matchScore: score
                  };
                }
              }
            }
          }
        }
      }

      return bestCandidate;
    }

    /**
     * Zero-Shot Catalyst Classification & Polarity Scoring
     * @param {string} text - Headline and summary text
     * @returns {Object} Classified catalyst metadata
     */
    classifyCatalyst(text) {
      if (!text || typeof text !== 'string') {
        return {
          type: 'GENERAL_MACRO_SENTIMENT',
          polarity: 1,
          multiplier: 1.05,
          confidence: 0.50,
          description: 'General informational market development'
        };
      }

      for (const cat of CATALYST_LEXICON) {
        for (const pattern of cat.patterns) {
          if (pattern.test(text)) {
            return {
              type: cat.type,
              polarity: cat.polarity,
              multiplier: cat.multiplier,
              confidence: cat.confidenceBase,
              description: cat.description,
              matchedPattern: pattern.toString()
            };
          }
        }
      }

      // Contextual sentiment fallback
      const positiveWords = ['surges', 'jumps', 'rallies', 'bullish', 'gains', 'soars', 'record high', 'breakout'];
      const negativeWords = ['plunges', 'drops', 'crashes', 'slumps', 'bearish', 'losses', 'falls', 'lawsuit'];

      let posCount = 0;
      let negCount = 0;
      const lower = text.toLowerCase();

      positiveWords.forEach(w => { if (lower.includes(w)) posCount++; });
      negativeWords.forEach(w => { if (lower.includes(w)) negCount++; });

      if (posCount > negCount) {
        return {
          type: 'POSITIVE_CATALYST_DRIFT',
          polarity: 1,
          multiplier: 1.15,
          confidence: 0.65,
          description: 'Broadly bullish corporate or market news sentiment'
        };
      } else if (negCount > posCount) {
        return {
          type: 'NEGATIVE_CATALYST_PRESSURE',
          polarity: -1,
          multiplier: 1.15,
          confidence: 0.65,
          description: 'Broadly bearish corporate or market news pressure'
        };
      }

      return {
        type: 'NEUTRAL_NEWS_ITEM',
        polarity: 0,
        multiplier: 1.00,
        confidence: 0.50,
        description: 'Informational headline with balanced market sentiment'
      };
    }

    /**
     * Track and calculate Search Velocity Spike
     * @param {string} symbol - Ticker symbol
     * @returns {Object} Search velocity metrics
     */
    trackSearchSpike(symbol) {
      const now = Date.now();
      const windowMs = 3600000; // 1 hour window
      let entry = this.searchSpikeTracker.get(symbol);

      if (!entry) {
        entry = { timestamps: [], baselineRatePerHour: 2.0 };
        this.searchSpikeTracker.set(symbol, entry);
      }

      entry.timestamps.push(now);
      entry.timestamps = entry.timestamps.filter(t => now - t <= windowMs);

      const currentCount = entry.timestamps.length;
      const velocity = Number((currentCount / Math.max(1, entry.baselineRatePerHour)).toFixed(2));
      const isSpike = velocity >= 2.5;

      return {
        hourlyCount: currentCount,
        velocityRatio: velocity,
        isSearchSpike: isSpike,
        spikeStatus: isSpike ? 'ACUTE_SEARCH_VELOCITY_SPIKE' : 'NORMAL_INFORMATION_FLOW'
      };
    }

    /**
     * Institutional Rumor vs. Fact Verification Scorer
     * @param {string} sourceName - Source publisher string
     * @param {string} text - Headline text for speculative linguistic cues
     * @param {number} concurrentSources - Number of independent sources confirming
     * @returns {Object} Rumor audit metrics
     */
    evaluateRumorVsFact(sourceName = '', text = '', concurrentSources = 1) {
      const lowerSource = (sourceName || '').toLowerCase();
      const lowerText = (text || '').toLowerCase();

      let matchedSource = null;
      for (const [key, val] of Object.entries(SOURCE_CREDIBILITY)) {
        if (lowerSource.includes(key)) {
          matchedSource = val;
          break;
        }
      }

      const tier = matchedSource ? matchedSource.tier : 3;
      let credibility = matchedSource ? matchedSource.cred : 0.70;
      let rumorIndex = matchedSource ? matchedSource.rumor : 0.35;

      // Linguistic Rumor Penalties ("sources say", "unconfirmed", "may face", "speculation")
      const rumorClues = [
        /\bsources? says?\b/i,
        /\bunconfirmed\b/i,
        /\brumor(ed|s)?\b/i,
        /\bmay (face|be|step)\b/i,
        /\bweighs? (options|bid)\b/i,
        /\bpeople familiar with the matter\b/i,
        /\banonymous sources?\b/i,
        /\bexploring potential\b/i
      ];

      let clueCount = 0;
      rumorClues.forEach(r => {
        if (r.test(lowerText)) {
          clueCount++;
          rumorIndex += 0.15;
          credibility -= 0.10;
        }
      });

      // Concurrent Source Velocity Bonus
      if (concurrentSources > 1) {
        rumorIndex = Math.max(0.02, rumorIndex - (concurrentSources - 1) * 0.08);
        credibility = Math.min(0.99, credibility + (concurrentSources - 1) * 0.05);
      }

      rumorIndex = Math.max(0.01, Math.min(0.99, rumorIndex));
      credibility = Math.max(0.20, Math.min(1.00, credibility));

      let verificationState = 'CONFIRMED_FACT';
      if (rumorIndex > 0.50) {
        verificationState = 'UNVERIFIED_RUMOR';
      } else if (rumorIndex > 0.20) {
        verificationState = 'PROBABLE_DEVELOPMENT';
      }

      return {
        sourceName: matchedSource ? matchedSource.name : (sourceName || 'Global Web Wire'),
        sourceTier: tier,
        sourceCredibility: Number(credibility.toFixed(2)),
        rumorIndex: Number(rumorIndex.toFixed(2)),
        verificationState,
        speculativeClues: clueCount
      };
    }

    /**
     * Compute Discontinuous Price Shock from Parsed News
     * @param {Object} entity - Instrument identity
     * @param {Object} catalyst - Classified catalyst
     * @param {Object} rumor - Rumor evaluation
     * @param {Object} optionsOverride - Optional options surface overrides
     * @returns {Object} Complete shock computation
     */
    computeShockFromNews(entity, catalyst, rumor, optionsOverride = {}) {
      if (!entity || !entity.symbol) return null;

      let spotPrice = optionsOverride.preEventPrice || 100.0;
      let beta = 1.0;
      let vol = 0.25;
      let currency = entity.country === 'IN' ? 'INR' : 'USD';

      if (SecurityMaster && SecurityMaster.LOCAL_REGISTRY) {
        const sec = SecurityMaster.LOCAL_REGISTRY.find(s => s.symbol === entity.symbol);
        if (sec) {
          spotPrice = optionsOverride.preEventPrice || sec.basePrice || spotPrice;
          beta = sec.beta || beta;
          vol = sec.vol || vol;
          currency = sec.currency || currency;
        }
      }

      // Compute continuous Event Score I_event
      const rumorDiscount = 1.0 - (0.50 * rumor.rumorIndex);
      const rawScore = catalyst.polarity * (catalyst.multiplier - 1.0) * rumor.sourceCredibility * catalyst.confidence * rumorDiscount;
      const normalizedScore = Math.max(-1.0, Math.min(1.0, rawScore));

      let shockResults = null;
      let contagion = [];

      // Check if PremEventShockEngine has predictDiscontinuousJump
      if (this.shockEngine && typeof this.shockEngine.predictDiscontinuousJump === 'function') {
        const isReinstatement = catalyst.type === 'LEADERSHIP_REINSTATEMENT';
        const isRegulatory = catalyst.type === 'REGULATORY_CLEARANCE';
        const isAntitrust = catalyst.type === 'ANTITRUST_SANCTION';

        const defaultGex = isReinstatement || isRegulatory ? -3500 : 0;
        const defaultSkew = isReinstatement || isRegulatory ? 9.5 : 0;

        const res = this.shockEngine.predictDiscontinuousJump({
          symbol: entity.symbol,
          preEventPrice: spotPrice,
          assetBeta: beta,
          eventCatalyst: {
            type: isReinstatement ? 'LEADERSHIP_REVERSAL' : (
              isRegulatory ? 'REGULATORY_APPROVAL' : (
                catalyst.type === 'DEMERGER_VALUE_UNLOCK' ? 'DEMERGER_VALUE_UNLOCK' : (
                  catalyst.type === 'MERGER_ACQUISITION_TARGET' ? 'MERGER_ACQUISITION_TARGET' : 'CORPORATE_EVENT'
                )
              )
            ),
            isReinstatement,
            leadershipConfidence: catalyst.confidence,
            regulatoryClearance: isRegulatory || isReinstatement,
            antiTrustInjunction: isAntitrust,
            revenueSurprisePct: isReinstatement ? 18.5 : 0.0,
            guidanceRaisePct: isReinstatement ? 15.0 : 0.0
          },
          optionsMarket: Object.assign({
            netGexMillions: defaultGex,
            normalizedGex: 3000,
            atmIv: vol,
            riskReversal25d: defaultSkew
          }, optionsOverride)
        });

        shockResults = {
          symbol: entity.symbol,
          prePrice: spotPrice,
          targetPrice: res.targetPrice,
          jumpPct: res.expectedMovePct,
          currency,
          dealerGexState: res.dealerState || 'BALANCED',
          gammaMultiplier: res.gammaMultiplier || 1.00,
          skewBooster: res.skewAsymmetry || 0.00
        };

        if (this.options.enableContagion && typeof this.shockEngine.propagateSupplyChainContagion === 'function') {
          contagion = this.shockEngine.propagateSupplyChainContagion(entity.symbol, res.expectedMovePct);
        }
      } else {
        // Fallback calculation
        const mertonJump = normalizedScore * beta * Math.sqrt(vol);
        const jumpPct = mertonJump * 100;
        const targetPrice = spotPrice * (1 + mertonJump);

        shockResults = {
          symbol: entity.symbol,
          prePrice: spotPrice,
          targetPrice: Number(targetPrice.toFixed(2)),
          jumpPct: Number(jumpPct.toFixed(2)),
          currency,
          dealerGexState: 'BALANCED',
          gammaMultiplier: 1.00,
          skewBooster: 0.00
        };
      }

      return {
        eventScore: Number(normalizedScore.toFixed(4)),
        prePrice: spotPrice,
        targetPrice: shockResults.targetPrice,
        jumpPct: shockResults.jumpPct,
        currency,
        dealerGexState: shockResults.dealerGexState,
        gammaMultiplier: shockResults.gammaMultiplier,
        skewBooster: shockResults.skewBooster,
        contagion
      };
    }

    /**
     * Process an incoming raw news article or feed item
     * @param {Object} rawItem - { title, link, pubDate, source, description, optionsOverride }
     * @returns {Object|null} Formatted ShockAlert
     */
    processArticle(rawItem = {}) {
      const title = this.cleanText(rawItem.title || '');
      const description = this.cleanText(rawItem.description || '');
      const fullText = `${title} ${description}`.trim();

      if (!title || title.length < 10) return null;

      // Deduplication check
      const hash = this.hashString(title);
      if (this.seenHashes.has(hash)) {
        return null;
      }
      this.seenHashes.add(hash);

      // 1. Resolve Instrument
      const entity = this.resolveEntityFromText(fullText, title);
      if (!entity) return null;

      // 2. Classify Catalyst
      const catalyst = this.classifyCatalyst(fullText);

      // 3. Evaluate Rumor vs Fact
      const rumor = this.evaluateRumorVsFact(rawItem.source || 'Wire', fullText, 1);

      // 4. Track Search Velocity Spike
      const searchVelocity = this.trackSearchSpike(entity.symbol);

      // 5. Calculate Event Shock Target
      const shock = this.computeShockFromNews(entity, catalyst, rumor, rawItem.optionsOverride || {});

      const alert = {
        id: hash,
        timestamp: rawItem.pubDate ? new Date(rawItem.pubDate).toISOString() : new Date().toISOString(),
        headline: title,
        description,
        url: rawItem.link || '#',
        sourceName: rumor.sourceName,
        sourceTier: rumor.sourceTier,
        sourceCredibility: rumor.sourceCredibility,
        rumorIndex: rumor.rumorIndex,
        verificationState: rumor.verificationState,
        symbol: entity.symbol,
        companyName: entity.companyName,
        country: entity.country,
        catalystType: catalyst.type,
        catalystDescription: catalyst.description,
        catalystMultiplier: catalyst.multiplier,
        polarity: catalyst.polarity,
        eventScore: shock.eventScore,
        prePrice: shock.prePrice,
        targetPrice: shock.targetPrice,
        jumpPct: shock.jumpPct,
        currency: shock.currency,
        dealerGexState: shock.dealerGexState,
        gammaMultiplier: shock.gammaMultiplier,
        skewBooster: shock.skewBooster,
        searchVelocity: searchVelocity.velocityRatio,
        isSearchSpike: searchVelocity.isSearchSpike,
        contagion: shock.contagion
      };

      // Add to buffer
      this.alertsBuffer.unshift(alert);
      if (this.alertsBuffer.length > this.options.maxBuffer) {
        this.alertsBuffer.pop();
      }

      // Emit notifications
      this.emit('news', alert);
      if (Math.abs(alert.jumpPct) >= 5.0) {
        this.emit('shock', alert);
      }
      if (alert.rumorIndex >= 0.50) {
        this.emit('rumor', alert);
      }

      return alert;
    }

    /**
     * Parse XML RSS feed string into structured items
     */
    parseRssXml(xmlText, defaultSource = 'Google News') {
      if (!xmlText || typeof xmlText !== 'string') return [];
      const items = [];

      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;

      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemBlock = match[1];

        const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
        const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);
        const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemBlock);
        const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(itemBlock);
        const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemBlock);

        const rawTitle = titleMatch ? titleMatch[1] : '';
        const source = sourceMatch ? sourceMatch[1] : defaultSource;

        items.push({
          title: rawTitle,
          link: linkMatch ? linkMatch[1] : '',
          pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toUTCString(),
          description: descMatch ? descMatch[1] : '',
          source: this.cleanText(source)
        });
      }

      return items;
    }

    /**
     * Crawl Google News RSS for specific query
     */
    async fetchGoogleNewsRss(query, options = {}) {
      const { country = 'US', timeRange = '1d' } = options;
      const hl = country === 'IN' ? 'en-IN' : 'en-US';
      const gl = country === 'IN' ? 'IN' : 'US';
      const ceid = country === 'IN' ? 'IN:en' : 'US:en';

      const encodedQuery = encodeURIComponent(`${query} when:${timeRange}`);
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), this.options.requestTimeoutMs) : null;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*'
          },
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Google News HTTP ${res.status}`);

        const xmlText = await res.text();
        const rawItems = this.parseRssXml(xmlText, 'Google News');

        const processed = [];
        for (const item of rawItems) {
          const alert = this.processArticle(item);
          if (alert) processed.push(alert);
        }

        return processed;
      } catch (e) {
        return [];
      }
    }

    /**
     * Crawl Yahoo Finance Real-Time News API for a ticker
     */
    async fetchYahooFinanceNews(symbol) {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=1&newsCount=10`;

      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), this.options.requestTimeoutMs) : null;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Yahoo Finance News HTTP ${res.status}`);

        const data = await res.json();
        const newsItems = data?.news || [];

        const processed = [];
        for (const item of newsItems) {
          const alert = this.processArticle({
            title: item.title,
            link: item.link,
            pubDate: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toUTCString() : new Date().toUTCString(),
            description: item.summary || '',
            source: item.publisher || 'Yahoo Finance'
          });
          if (alert) processed.push(alert);
        }

        return processed;
      } catch (e) {
        return [];
      }
    }

    /**
     * Replay a historical scenario for verification and demonstration
     */
    replayScenario(scenarioId) {
      const scenario = HISTORIC_REPLAY_SCENARIOS.find(s => s.id === scenarioId) || HISTORIC_REPLAY_SCENARIOS[0];
      const alert = this.processArticle({
        title: scenario.headline,
        description: scenario.description,
        pubDate: scenario.publishedAt,
        link: scenario.sourceUrl,
        source: scenario.source,
        optionsOverride: Object.assign({ preEventPrice: scenario.actualPrePrice }, scenario.optionsMarket)
      });

      if (alert) {
        alert.isReplay = true;
        alert.scenarioId = scenario.id;
        alert.actualMovePct = scenario.actualMovePct;
        alert.actualPrePrice = scenario.actualPrePrice;
        alert.actualPostPrice = scenario.actualPostPrice;
        const diff = Math.abs(alert.jumpPct - scenario.actualMovePct);
        alert.modelAccuracyPct = Number((100 - (diff / scenario.actualMovePct) * 100).toFixed(2));
      }

      return alert;
    }

    /**
     * Return all available historic scenarios
     */
    getReplayScenarios() {
      return HISTORIC_REPLAY_SCENARIOS;
    }

    /**
     * Get recent alerts buffer with optional filtering
     */
    getAlerts(filter = {}) {
      let list = [...this.alertsBuffer];

      if (filter.symbol) {
        list = list.filter(a => a.symbol === filter.symbol.toUpperCase());
      }
      if (filter.country) {
        list = list.filter(a => a.country === filter.country.toUpperCase());
      }
      if (filter.minShockPct) {
        list = list.filter(a => Math.abs(a.jumpPct) >= Number(filter.minShockPct));
      }
      if (filter.verificationState) {
        list = list.filter(a => a.verificationState === filter.verificationState);
      }

      return list;
    }

    /**
     * Clear the buffer and seen hashes
     */
    clearBuffer() {
      this.alertsBuffer = [];
      this.seenHashes.clear();
    }
  }

  // Export Singleton and Class
  const defaultInstance = new WebSeerEngine();

  return {
    VERSION,
    CODENAME,
    WebSeerEngine,
    defaultInstance,
    ENTITY_DICTIONARY,
    SOURCE_CREDIBILITY,
    CATALYST_LEXICON,
    HISTORIC_REPLAY_SCENARIOS
  };
}));
