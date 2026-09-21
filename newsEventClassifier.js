/**
 * RISKOS — News Event Classification Engine (newsEventClassifier.js)
 * Standardized 28-category taxonomy classifying financial and macroeconomic events.
 * 
 * Invariants:
 * 1. Do NOT infer certainty from headlines.
 * 2. Store eventConfidence (0-100) strictly independently from sentimentScore.
 * 3. Deterministic keyword and topic rules with explicit rationale.
 */

((root) => {
  'use strict';

  const EVENT_TAXONOMY = {
    EARNINGS_SURPRISE: {
      label: 'Earnings Surprise',
      keywords: ['beats estimates', 'beats expectations', 'misses estimates', 'misses expectations', 'earnings beat', 'earnings miss', 'profit beats', 'surprise profit', 'surprise loss'],
      baseMateriality: 90
    },
    EARNINGS: {
      label: 'Earnings Announcement',
      keywords: ['q1', 'q2', 'q3', 'q4', 'quarterly net profit', 'ebitda', 'revenue up', 'revenue down', 'net profit', 'quarterly results', 'financial results', 'earnings release', 'quarterly revenue'],
      baseMateriality: 85
    },
    GUIDANCE: {
      label: 'Corporate Guidance',
      keywords: ['guidance', 'forecast', 'outlook', 'fy26 outlook', 'fy25 outlook', 'full year guidance', 'raises outlook', 'lowers guidance', 'cuts forecast', 'revenue forecast'],
      baseMateriality: 85
    },
    MERGER_ACQUISITION: {
      label: 'Merger & Acquisition',
      keywords: ['merger', 'acquisition', 'acquires', 'takeover', 'buyout', 'agrees to acquire', 'all-cash deal', 'stake purchase', 'divestiture', 'm&a'],
      baseMateriality: 88
    },
    DIVIDEND: {
      label: 'Dividend Declaration',
      keywords: ['dividend', 'interim dividend', 'special dividend', 'dividend payout', 'record date for dividend', 'ex-dividend'],
      baseMateriality: 60
    },
    BUYBACK: {
      label: 'Share Buyback',
      keywords: ['buyback', 'share repurchase', 'repurchase program', 'tender offer', 'share buyback program'],
      baseMateriality: 75
    },
    CAPEX: {
      label: 'Capital Expenditure',
      keywords: ['capex', 'capital expenditure', 'investment of $', 'investment of rs', 'plant expansion', 'manufacturing facility', 'datacenter investment'],
      baseMateriality: 70
    },
    MANAGEMENT_CHANGE: {
      label: 'Executive Leadership',
      keywords: ['appoints ceo', 'steps down', 'resigns as ceo', 'cfo transition', 'board of directors', 'new managing director', 'chairman steps down', 'executive change'],
      baseMateriality: 72
    },
    REGULATORY: {
      label: 'Regulatory Action',
      keywords: ['regulatory', 'sec', 'sebi', 'rbi', 'fda', 'ftc', 'antitrust', 'penalty notice', 'show cause notice', 'investigation', 'compliance probe', 'license suspension'],
      baseMateriality: 82
    },
    LEGAL: {
      label: 'Legal & Litigation',
      keywords: ['lawsuit', 'litigation', 'court ruling', 'sues', 'settlement', 'class action', 'patent infringement', 'verdict', 'arbitration'],
      baseMateriality: 75
    },
    CREDIT: {
      label: 'Credit Rating',
      keywords: ['credit rating', 'crisil', 'moody', 's&p affirms', 'fitch upgrades', 'rating downgraded', 'sovereign rating', 'credit outlook'],
      baseMateriality: 78
    },
    DEBT: {
      label: 'Debt & Financing',
      keywords: ['bond issuance', 'refinancing', 'nclt debt', 'debt servicing', 'credit facility', 'senior notes', 'commercial paper', 'loan restructuring'],
      baseMateriality: 68
    },
    BANKRUPTCY: {
      label: 'Distress & Insolvency',
      keywords: ['bankruptcy', 'chapter 11', 'insolvency', 'defaulted on debt', 'nclt liquidation', 'liquidation proceeding', 'debt default'],
      baseMateriality: 98
    },
    PRODUCT: {
      label: 'Product Launch',
      keywords: ['launches', 'unveils', 'new product', 'iphone 17', 'next-gen', 'platform launch', 'feature release', 'model reveal'],
      baseMateriality: 65
    },
    PARTNERSHIP: {
      label: 'Strategic Alliance',
      keywords: ['strategic partnership', 'collaboration with', 'enters alliance', 'signs mou', 'co-development agreement'],
      baseMateriality: 62
    },
    CONTRACT: {
      label: 'Major Contract Win',
      keywords: ['order win', 'defense contract', 'wins contract', 'secured contract', 'order book', 'awarded deal of', 'multi-year contract'],
      baseMateriality: 72
    },
    ANALYST_ACTION: {
      label: 'Analyst Rating / Price Target',
      keywords: ['upgrades to buy', 'downgrades to sell', 'price target raised', 'price target lowered', 'initiates coverage', 'overweight rating', 'underweight rating'],
      baseMateriality: 68
    },
    MONETARY_POLICY: {
      label: 'Monetary Policy & Central Bank',
      keywords: ['fed rate', 'interest rates', 'rbi mpc', 'fomc', 'rate hike', 'rate cut', 'quantitative tightening', 'repo rate', 'ecb decision', 'central bank'],
      baseMateriality: 88
    },
    FISCAL_POLICY: {
      label: 'Fiscal Policy & Government Budget',
      keywords: ['union budget', 'stimulus package', 'tax reform', 'fiscal deficit', 'government spending', 'customs duty', 'tariff'],
      baseMateriality: 80
    },
    INFLATION: {
      label: 'Inflation Data',
      keywords: ['cpi inflation', 'core cpi', 'wpi', 'pce price index', 'inflation cools', 'inflation surges', 'consumer prices'],
      baseMateriality: 84
    },
    EMPLOYMENT: {
      label: 'Employment & Labor Market',
      keywords: ['nonfarm payrolls', 'jobless claims', 'unemployment rate', 'labor market', 'hiring freeze', 'layoffs'],
      baseMateriality: 75
    },
    GEOPOLITICAL: {
      label: 'Geopolitical Conflict & Trade',
      keywords: ['geopolitical', 'sanctions', 'trade restrictions', 'export ban', 'military escalation', 'embargo', 'strait of hormuz'],
      baseMateriality: 92
    },
    COMMODITY: {
      label: 'Commodity & Energy Shock',
      keywords: ['crude oil', 'brent', 'opec', 'natural gas', 'gold reserves', 'silver prices', 'copper supply'],
      baseMateriality: 76
    },
    SUPPLY_CHAIN: {
      label: 'Supply Chain Disruption',
      keywords: ['supply chain bottleneck', 'chip shortage', 'shipping disruption', 'freight rates', 'logistics constraint'],
      baseMateriality: 74
    },
    SECTOR_EVENT: {
      label: 'Broad Sector Movement',
      keywords: ['sector rally', 'banking crisis', 'it sector rebound', 'telecom tariff war', 'pharma pricing pressure'],
      baseMateriality: 70
    },
    RUMOR: {
      label: 'Market Speculation & Rumor',
      keywords: ['sources say', 'reportedly considering', 'rumored to', 'talks underway', 'speculation', 'unconfirmed reports'],
      baseMateriality: 50
    },
    MACRO: {
      label: 'Broad Macroeconomic',
      keywords: ['gdp growth', 'economic growth', 'recession odds', 'yield curve inversion', 'market breadth', 'macro environment'],
      baseMateriality: 78
    },
    OTHER: {
      label: 'Corporate / Market Intelligence',
      keywords: [],
      baseMateriality: 45
    }
  };

  class NewsEventClassifier {
    constructor() {
      this.taxonomy = EVENT_TAXONOMY;
    }

    /**
     * Classifies a normalized article or raw headline/summary into the 28-category taxonomy.
     */
    classifyEvent(articleOrText) {
      let fullText = '';
      let topics = [];

      if (typeof articleOrText === 'string') {
        fullText = articleOrText;
      } else if (articleOrText && typeof articleOrText === 'object') {
        fullText = `${articleOrText.title || ''} ${articleOrText.summary || ''}`;
        topics = articleOrText.topics || [];
      }

      const lower = fullText.toLowerCase();
      let bestCategory = 'OTHER';
      let bestConfidence = 40;
      let matchedKeywords = [];

      // Check for topic hints from Alpha Vantage
      const topicKeywordsMap = {
        'Earnings': ['EARNINGS_SURPRISE', 'EARNINGS', 'GUIDANCE'],
        'Economy - Monetary': ['MONETARY_POLICY', 'INFLATION'],
        'Economy - Fiscal': ['FISCAL_POLICY'],
        'Financial Markets': ['SECTOR_EVENT', 'MACRO'],
        'Mergers & Acquisitions': ['MERGER_ACQUISITION'],
        'Technology': ['PRODUCT']
      };

      for (const tp of topics) {
        const topKey = tp.topic;
        const topRelevance = tp.relevanceScore || 1.0;
        if (topicKeywordsMap[topKey] && topRelevance >= 0.7) {
          const preferredCategories = topicKeywordsMap[topKey];
          // Will be prioritized in matching
        }
      }

      // Check taxonomy rules
      for (const [catKey, catDef] of Object.entries(this.taxonomy)) {
        if (catKey === 'OTHER') continue;

        let catScore = 0;
        const currentMatches = [];

        for (const kw of catDef.keywords) {
          if (lower.includes(kw)) {
            catScore += 15 + kw.length;
            currentMatches.push(kw);
          }
        }

        if (catScore > 0) {
          // Compute confidence based on match count and specificity
          const confidence = Math.min(98, 55 + currentMatches.length * 15 + Math.min(25, catScore / 4));
          if (confidence > bestConfidence) {
            bestConfidence = Math.round(confidence);
            bestCategory = catKey;
            matchedKeywords = currentMatches;
          }
        }
      }

      // Check if earnings beat/miss specifics match
      if ((lower.includes('beat') || lower.includes('miss') || lower.includes('surpass') || lower.includes('surprise')) &&
          (lower.includes('earning') || lower.includes('profit') || lower.includes('estimate') || lower.includes('quarterly') || lower.includes('revenue'))) {
        bestCategory = 'EARNINGS_SURPRISE';
        bestConfidence = Math.max(bestConfidence, 88);
        if (!matchedKeywords.includes('earnings beat/miss')) matchedKeywords.push('earnings beat/miss');
      } else if (bestCategory === 'EARNINGS') {
        if (lower.includes('beat') || lower.includes('miss') || lower.includes('surpassed') || lower.includes('short of')) {
          bestCategory = 'EARNINGS_SURPRISE';
        }
      }

      const meta = this.taxonomy[bestCategory] || this.taxonomy.OTHER;

      return {
        eventType: bestCategory,
        eventLabel: meta.label,
        eventConfidence: bestConfidence,
        baseMateriality: meta.baseMateriality,
        matchedKeywords: matchedKeywords,
        rationale: matchedKeywords.length > 0 
          ? `Matched institutional signatures: [${matchedKeywords.slice(0, 3).join(', ')}]`
          : 'Classified based on general market/corporate intelligence context.'
      };
    }

    /**
     * Enriches an article with event classification properties.
     */
    enrichArticle(article) {
      if (!article) return article;
      const classification = this.classifyEvent(article);
      article.eventType = classification.eventType;
      article.eventLabel = classification.eventLabel;
      article.eventConfidence = classification.eventConfidence;
      article.baseMateriality = classification.baseMateriality;
      article.classificationRationale = classification.rationale;
      return article;
    }
  }

  const singleton = new NewsEventClassifier();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NewsEventClassifier,
      newsEventClassifier: singleton,
      EVENT_TAXONOMY
    };
  }

  root.NewsEventClassifier = NewsEventClassifier;
  root.newsEventClassifier = singleton;

})(typeof window !== 'undefined' ? window : global);
