/**
 * RISKOS Universal Explainer Layer (universalExplainer.js)
 * Provides progressive disclosure modal explanations for quantitative models, metrics, and risk concepts.
 * Features: Simple/Plain English, Quantitative Math/Formulas, Institutional Citations & FRTB, Interactive Calculators.
 */
(function (global) {
  'use strict';

  const EXPLANATIONS = {
    sharpe: {
      title: 'Sharpe Ratio',
      subtitle: 'Risk-Adjusted Excess Return Efficiency',
      icon: 'fa-chart-line',
      simple: {
        what: 'The Sharpe Ratio measures how much extra profit an investment makes for each unit of risk (volatility) it takes on.',
        analogy: 'Think of driving a car. Fast speed is great, but not if the ride is violent and you feel like you might crash. A high Sharpe ratio is like a sports car moving fast with smooth suspension: high performance with minimal turbulence.',
        interpretation: 'A Sharpe ratio above 1.0 is considered acceptable, above 2.0 is very good, and above 3.0 is institutional-grade (often seen in top systematic statistical arbitrage). Below 0 means you would have earned more money in a risk-free government savings account.'
      },
      quant: {
        formula: 'S = (E[R_p] - R_f) / \u03c3_p',
        variables: [
          { symbol: 'E[R_p]', desc: 'Expected annualized portfolio return' },
          { symbol: 'R_f', desc: 'Annualized risk-free rate (e.g. 10Y US Treasury or RBI Repo)' },
          { symbol: '\u03c3_p', desc: 'Standard deviation (volatility) of excess returns' }
        ],
        assumptions: 'Assumes returns are normally distributed and investor only cares about mean and variance. Penalizes upside volatility equally with downside volatility.',
        limitations: 'Subject to survivorship bias, volatility smoothing in illiquid assets, and misleadingly high values during non-linear tail distributions (e.g. short options strategies).'
      },
      institutional: {
        paper: 'Sharpe, William F. (1966, 1994). "Mutual Fund Performance" and "The Sharpe Ratio". Journal of Business & Journal of Portfolio Management.',
        regulatory: 'Basel III & MiFID II standardized reporting metric for collective investment schemes (UCITS / AIFs). Used by SEBI and SEC in fund performance disclosures.',
        bestPractice: 'Always evaluate annualized Sharpe alongside Maximum Drawdown, Sortino, and Tail Risk (CVaR). For daily returns, annualize via multiplying by sqrt(252).'
      },
      calculator: {
        type: 'sharpe',
        params: [
          { id: 'ret', label: 'Expected Return (%)', min: 0, max: 40, step: 0.5, default: 16 },
          { id: 'rf', label: 'Risk-Free Rate (%)', min: 0, max: 10, step: 0.25, default: 6.5 },
          { id: 'vol', label: 'Annual Volatility (%)', min: 2, max: 50, step: 0.5, default: 12 }
        ],
        compute: function(p) {
          const ret = parseFloat(p.ret);
          const rf = parseFloat(p.rf);
          const vol = parseFloat(p.vol);
          if (vol <= 0) return '0.00';
          return ((ret - rf) / vol).toFixed(2);
        }
      }
    },

    cvar: {
      title: 'Conditional Value at Risk (CVaR / Expected Shortfall)',
      subtitle: 'Average Loss in the Worst \u03b1% Tail Outcomes',
      icon: 'fa-shield-halved',
      simple: {
        what: 'CVaR (Expected Shortfall) answers: "If disaster strikes and we fall into the worst 1% of market days, what will our average loss actually be?"',
        analogy: 'Value at Risk (VaR) is like the height of the flood barrier: "Water will breach this 99% of the time." But CVaR tells you how deep the flood water will be inside your house when the barrier breaks. It does not stop at the doorway; it measures the severity of the drowning.',
        interpretation: 'Unlike regular VaR, CVaR is a coherent risk measure that respects diversification. A 99% 1-day CVaR of -3.4% means that during the worst 1% crash days, you lose on average 3.4% of your total capital.'
      },
      quant: {
        formula: 'CVaR_\u03b1(X) = -E[ X | X \u2264 -VaR_\u03b1(X) ] = (1 / \u03b1) \u222b_{0}^{\u03b1} VaR_u(X) du',
        variables: [
          { symbol: 'X', desc: 'Portfolio loss/return random variable' },
          { symbol: '\u03b1', desc: 'Tail probability percentile (e.g. 0.01 for 99% confidence, or 0.025 for Basel FRTB 97.5%)' },
          { symbol: 'VaR_\u03b1', desc: 'Threshold loss at the \u03b1 quantile' }
        ],
        assumptions: 'Sub-additive and convex (Artzner et al. 1999). Satisfies all four axioms of coherent risk measures: monotonicity, translation invariance, positive homogeneity, and sub-additivity.',
        limitations: 'Estimation error is higher than VaR because it requires integrating over sparsely populated tail distributions. Requires robust historical or EVT (Extreme Value Theory) modeling.'
      },
      institutional: {
        paper: 'Rockafellar, R. Tyrrell, and Stanislav Uryasev. "Optimization of conditional value-at-risk." Journal of risk 2.3 (2000): 21-41.',
        regulatory: 'Mandated by Basel Committee for Banking Supervision (BCBS) in "Fundamental Review of the Trading Book" (FRTB 2019/2023), replacing 99% VaR with 97.5% Expected Shortfall across trading books.',
        bestPractice: 'Used in RISKOS Desk 2 (Portfolio Optimizer) and Desk 5 (Risk Engine) to construct non-linear convex portfolios using Rockafellar-Uryasev linear programming formulation.'
      }
    },

    var: {
      title: 'Value at Risk (VaR)',
      subtitle: 'Maximum Expected Loss at a Given Confidence Horizon',
      icon: 'fa-triangle-exclamation',
      simple: {
        what: 'Value at Risk states the threshold dollar or percentage loss you are confident will not be exceeded over a specific timeframe.',
        analogy: 'If you have a 99% 1-day VaR of $100,000, it means 99 out of 100 days, your daily trading losses will be less than $100,000. On the 1 remaining day, losses could be bigger.',
        interpretation: 'Provides a single headline dollar amount for risk committees and board members to evaluate daily capital exposure.'
      },
      quant: {
        formula: 'VaR_\u03b1 = -inf { x \u2208 \u211d : P(X \u2264 x) \u2265 \u03b1 }',
        variables: [
          { symbol: '\u03b1', desc: 'Confidence level (e.g., 95%, 99%)' },
          { symbol: 'Historical VaR', desc: 'Direct empirical percentile of past historical PnL distribution' },
          { symbol: 'Parametric VaR', desc: '\u03bc - z_\u03b1 * \u03c3 (assumes Gaussian distribution)' },
          { symbol: 'Monte Carlo VaR', desc: 'Simulated Cholesky multivariate distribution with Ledoit-Wolf shrinkage' }
        ],
        assumptions: 'Parametric VaR dangerously assumes normal distribution (zero excess kurtosis). Historical VaR assumes the past reflects future non-stationary correlations.',
        limitations: 'Not sub-additive! Merging two portfolios can sometimes mathematically yield a higher VaR than the sum of their individual VaRs, penalizing diversification.'
      },
      institutional: {
        paper: 'J.P. Morgan RiskMetrics Group (1994, 1996). Technical Document, 4th ed.',
        regulatory: 'Historical baseline for Basel II/III Pillar 1 capital adequacy. Requires Kupiec (POF) and Christoffersen independence backtesting validation.',
        bestPractice: 'Always compare Parametric against Historical and Monte Carlo. Large divergence between Parametric and Historical indicates fat-tailed skew/kurtosis risk.'
      }
    },

    gex: {
      title: 'Gamma Exposure (GEX)',
      subtitle: 'Market Maker Hedging Acceleration Across Options Strikes',
      icon: 'fa-bolt',
      simple: {
        what: 'Gamma Exposure measures how much equity options dealers (market makers) must buy or sell when the underlying market index moves by 1%.',
        analogy: 'Imagine a thermostat. Positive GEX is like a thermostat that dampens extremes (buying dips, selling rips). Negative GEX is like a fire alarm hooked up to a gasoline sprinkler: when the market drops, dealers are forced to sell aggressively, causing flash crashes.',
        interpretation: 'High Positive GEX = Low volatility, sticky pinned markets. Negative GEX = High volatility, cascading liquidity drops, violent gap risk.'
      },
      quant: {
        formula: 'GEX = \u2211_{strikes} \u0393_i * S * OpenInterest_i * Multiplier * (+1 Call, -1 Put)',
        variables: [
          { symbol: '\u0393 (Gamma)', desc: 'Second derivative of option price with respect to spot (\u2202\u00b2V/\u2202S\u00b2)' },
          { symbol: 'S', desc: 'Current spot price of underlying' },
          { symbol: 'Gamma Flip', desc: 'Price level where Net GEX crosses from positive to negative' }
        ],
        assumptions: 'Assumes dealers are net long calls and net short puts when customers are long puts and retail buys calls.',
        limitations: 'Does not know exact institutional dealer inventories vs proprietary hedge fund books; uses proxy open interest models.'
      },
      institutional: {
        paper: 'SqueezeMetrics (2016-2020) "The Gamma Exposure Index" & Cem Karsan (Kai Volatility Advisors).',
        regulatory: 'Monitored by CFTC and SEC for structural liquidity dynamics and zero-DTE options expiration pinning.',
        bestPractice: 'Cross-reference Gamma Flip level with current spot to determine if dealer positioning acts as a shock absorber or an accelerant.'
      }
    },

    black_litterman: {
      title: 'Black-Litterman Asset Allocation',
      subtitle: 'Bayesian Synthesis of Market Equilibrium & Investor Views',
      icon: 'fa-scale-balanced',
      simple: {
        what: 'Combines the collective wisdom of the entire global market with your specific analyst forecasts, without producing erratic or extreme portfolio bets.',
        analogy: 'Markowitz Mean-Variance optimization is notoriously unstable\u2014like a temperamental chef who demands you put 90% salt in the recipe if one tiny forecast shifts. Black-Litterman starts with the balanced global recipe (market cap weights) and nudges it gently only where you have high-confidence research.',
        interpretation: 'Produces intuitive, stable, diversified institutional allocations without 100% extreme corner weights.'
      },
      quant: {
        formula: 'E[R] = [ (\u03c4 \u03a3)\u207b\u00b9 + P\u1d40 \u03a9\u207b\u00b9 P ]\u207b\u00b9 [ (\u03c4 \u03a3)\u207b\u00b9 \u03a0 + P\u1d40 \u03a9\u207b\u00b9 Q ]',
        variables: [
          { symbol: '\u03a0', desc: 'Implied equilibrium excess return vector = \u03bb \u03a3 w_mkt' },
          { symbol: '\u03a3', desc: 'Covariance matrix of asset returns' },
          { symbol: 'P, Q', desc: 'Projection matrix of investor views and expected return vector Q' },
          { symbol: '\u03a9', desc: 'Diagonal uncertainty matrix of views' },
          { symbol: '\u03c4', desc: 'Scalar tracking uncertainty of the prior' }
        ],
        assumptions: 'Prior distribution of returns follows CAPM equilibrium; views have Gaussian uncertainty.',
        limitations: 'Calibration of \u03c4 and \u03a9 matrix can be subjective without rigorous quantitative confidence weighting.'
      },
      institutional: {
        paper: 'Black, Fischer, and Robert Litterman. "Global portfolio optimization." Financial Analysts Journal 48.5 (1992): 28-43.',
        regulatory: 'Core framework powering Goldman Sachs Asset Management, BlackRock Aladdin, and sovereign wealth allocation.',
        bestPractice: 'Set prior to market-cap weights (Nifty 50 or S&P 500) and use quantitative alpha signals to populate P and Q.'
      }
    },

    merton: {
      title: 'Merton Structural Credit Model',
      subtitle: 'Corporate Equity as a Call Option on Enterprise Assets',
      icon: 'fa-building-columns',
      simple: {
        what: 'Evaluates bankruptcy risk by treating a company\'s equity shares as a financial call option on the total assets of the firm.',
        analogy: 'Imagine a house worth $1,000,000 with a $700,000 mortgage. If house prices crash below $700,000, the owner simply defaults and lets the bank take the keys. Equity shareholders do the exact same thing when corporate debt matures.',
        interpretation: 'Computes "Distance to Default" (DD). A Distance to Default of > 3.0 standard deviations indicates institutional solvency; DD < 1.0 flags imminent distressed restructuring or default.'
      },
      quant: {
        formula: 'E = V_A \u03a6(d_1) - D e^{-rT} \u03a6(d_2),  where d_1 = [ ln(V_A/D) + (r + 0.5 \u03c3_A\u00b2)T ] / (\u03c3_A \u221aT)',
        variables: [
          { symbol: 'E', desc: 'Market value of equity (market capitalization)' },
          { symbol: 'V_A', desc: 'Unobserved total market value of firm assets' },
          { symbol: 'D', desc: 'Face value of debt maturing at time T (default point)' },
          { symbol: '\u03c3_A', desc: 'Volatility of underlying asset value' }
        ],
        assumptions: 'Debt is a single zero-coupon bond maturing at T; firm value follows geometric Brownian motion.',
        limitations: 'Simplifies complex debt covenants, off-balance sheet liabilities, and liquidity runs.'
      },
      institutional: {
        paper: 'Merton, Robert C. "On the pricing of corporate debt: The risk structure of interest rates." The Journal of finance 29.2 (1974): 449-470.',
        regulatory: 'Foundational engine behind Moody\'s KMV CreditEdge and Basel III Advanced Internal Ratings-Based (AIRB) default probabilities.',
        bestPractice: 'Calibrate asset volatility iteratively using Newton-Raphson across equity market cap and debt face value.'
      }
    },

    cpcv: {
      title: 'Combinatorial Purged Cross-Validation (CPCV)',
      subtitle: 'Overfitting Elimination via Combinatorial Path Purging & Embargos',
      icon: 'fa-flask-vial',
      simple: {
        what: 'A mathematical stress-test for algorithmic trading strategies that completely eliminates lookahead bias, information leakage, and backtest curve-fitting.',
        analogy: 'Standard cross-validation is like giving a student test questions that were already discussed in yesterday\'s practice class. CPCV physically deletes (purges) all overlapping price bars and applies a quarantine (embargo) so the algorithm can never cheat by peeking into the future.',
        interpretation: 'Calculates the Probability of Backtest Overfitting (PBO). If PBO > 20%, your strategy is likely just memorizing historical noise and will fail in live trading.'
      },
      quant: {
        formula: 'Comb(N, k) splits; Purge: |t_{train} - t_{test}| < \u03c4_holding; Embargo: t_{train} > t_{test} + h',
        variables: [
          { symbol: 'N', desc: 'Total number of partitioned time-series blocks' },
          { symbol: 'k', desc: 'Number of blocks assigned to out-of-sample testing' },
          { symbol: '\u03c4_holding', desc: 'Holding period of labels causing information overlap' },
          { symbol: 'h', desc: 'Embargo window preventing auto-correlated leakage' }
        ],
        assumptions: 'Time-series serial correlation requires non-standard IID data partitioning.',
        limitations: 'Computationally demanding (requires running dozens of combinatorial paths).'
      },
      institutional: {
        paper: 'Marcos Lopez de Prado (2018). "Advances in Financial Machine Learning". John Wiley & Sons.',
        regulatory: 'Used in institutional quant fund validation protocols (Citadel, Two Sigma, Millennium) and quantitative audit disclosures.',
        bestPractice: 'Never deploy a model without CPCV PBO analysis confirming backtest stability across synthetic historical paths.'
      }
    },

    regime_hmm: {
      title: 'Gaussian HMM Market Regime Detection',
      subtitle: 'Hidden Markov States: Bull, Bear, and Sideways Transitions',
      icon: 'fa-brain',
      simple: {
        what: 'Markets behave differently in different economic weather. HMM classifies the market into 3 hidden regimes: Bull (sunny), Bear (stormy), or Sideways (foggy), without needing a human to tell it.',
        analogy: 'A chameleon changes colors based on its hidden mood and surroundings. You cannot read its mind, but by observing its skin patterns, you can deduce its true state. HMM does this with daily returns and volatility.',
        interpretation: 'Enables automatic strategy adaptation: Bull = trend momentum; Bear = defensive capital preservation; Sideways = mean-reversion & statistical arbitrage.'
      },
      quant: {
        formula: 'P(S_t = j | O_{1:T}) = \u03b1_t(j) \u03b2_t(j) / \u2211_i \u03b1_t(i) \u03b2_t(i)',
        variables: [
          { symbol: 'S_t', desc: 'Hidden market regime at time t (Bull, Bear, Sideways)' },
          { symbol: 'O_t', desc: 'Observable vector of returns and realized volatility' },
          { symbol: 'A', desc: 'Transition probability matrix (P(S_t | S_{t-1}))' },
          { symbol: 'B', desc: 'Emission probability density N(\u03bc_k, \u03a3_k)' }
        ],
        assumptions: 'Markov property: next state depends only on current state; emissions follow multivariate normal distribution.',
        limitations: 'Vulnerable to regime persistence lag during sudden black-swan structural shocks.'
      },
      institutional: {
        paper: 'Hamilton, James D. "A new approach to the economic analysis of nonstationary time series and the business cycle." Econometrica (1989): 357-384.',
        regulatory: 'Macroprudential systemic stress monitoring by Federal Reserve, ECB, and BIS.',
        bestPractice: 'Refit transition matrices weekly or upon volatility break to ensure timely adaptation.'
      }
    },

    market_data_truth: {
      title: 'Market Data Truth & Integrity Architecture',
      subtitle: 'Deterministic Exchange Synchronization & Provenance Verification',
      icon: 'fa-fingerprint',
      simple: {
        what: 'Guarantees that every price, chart tick, and indicator on RISKOS represents real verifiable exchange conditions\u2014with zero fake ticks outside market hours.',
        analogy: 'When a bank closes at 5:00 PM, the teller does not keep spinning a roulette wheel pretending people are depositing cash. Similarly, when the National Stock Exchange (NSE) or NASDAQ closes, RISKOS displays MARKET CLOSED with the exact final exchange closing time.',
        interpretation: 'Eliminates misleading fake updates. Clear status badges (LIVE, MARKET CLOSED, CACHED, SIMULATED) tell you exactly what you are looking at.'
      },
      quant: {
        formula: 'State \u2208 { LIVE, DELAYED, CACHED, FALLBACK, SIMULATED, SYNTHETIC, MARKET CLOSED }',
        variables: [
          { symbol: 'Exchange Time', desc: 'Atomic wall-clock time in exchange local time zone (IST / EST)' },
          { symbol: 'Trading Calendar', desc: 'Official statutory exchange holidays (e.g. NSE, BSE, NYSE, NASDAQ)' },
          { symbol: 'Data Freshness', desc: 'Age of last received tick against latency threshold' }
        ],
        assumptions: 'All feeds audited against atomic reference timestamps and exchange schedule state machines.',
        limitations: 'Public delayed web feeds are buffered by up to 15 minutes unless an institutional direct WebSocket feed is connected.'
      },
      institutional: {
        paper: 'RISKOS Data Integrity Standard v2.0 (2026); ISO 20022 Financial Market Communication.',
        regulatory: 'Compliant with SEBI Master Circular on Market Data and SEC Rule 603 (NMS Data Distribution).',
        bestPractice: 'Click the status badge on any screen or open the Data Provenance Audit Modal to inspect feed sources, latency, and exchange operational phases.'
      }
    }
  };

  class UniversalExplainerModal {
    constructor() {
      this.currentMetric = null;
      this.currentTab = 'simple';
      this.init();
    }

    init() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('ue-modal-root')) return;

      const root = document.createElement('div');
      root.id = 'ue-modal-root';
      document.body.appendChild(root);

      // Delegate click handlers for any element with data-explain
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-explain]');
        if (trigger) {
          e.preventDefault();
          const metricId = trigger.getAttribute('data-explain');
          this.open(metricId);
        }
      });
    }

    open(metricId) {
      if (!EXPLANATIONS[metricId]) {
        console.warn('UniversalExplainer: Unknown metric "' + metricId + '"');
        return;
      }
      this.currentMetric = metricId;
      this.currentTab = 'simple';
      this.render();
      document.body.style.overflow = 'hidden';
    }

    close() {
      const root = document.getElementById('ue-modal-root');
      if (root) root.innerHTML = '';
      document.body.style.overflow = '';
    }

    setTab(tab) {
      this.currentTab = tab;
      this.renderBody();
    }

    render() {
      const data = EXPLANATIONS[this.currentMetric];
      if (!data) return;

      const root = document.getElementById('ue-modal-root');
      let calcTabHtml = '';
      if (data.calculator) {
        calcTabHtml = '<button class="ue-tab ' + (this.currentTab === 'calc' ? 'active' : '') + '" data-tab="calc">' +
                      '<i class="fa-solid fa-calculator"></i> Interactive Simulator</button>';
      }

      root.innerHTML = '<div class="ue-modal-backdrop" id="ue-backdrop">' +
        '<div class="ue-modal" role="dialog" aria-modal="true">' +
          '<div class="ue-header">' +
            '<div class="ue-header-left">' +
              '<div class="ue-header-icon">' +
                '<i class="fa-solid ' + (data.icon || 'fa-circle-info') + '"></i>' +
              '</div>' +
              '<div>' +
                '<h3 class="ue-title">' + data.title + '</h3>' +
                '<p class="ue-subtitle">' + data.subtitle + '</p>' +
              '</div>' +
            '</div>' +
            '<button class="ue-close-btn" id="ue-close-btn" title="Close (Esc)">' +
              '<i class="fa-solid fa-xmark"></i>' +
            '</button>' +
          '</div>' +
          '<div class="ue-tabs">' +
            '<button class="ue-tab ' + (this.currentTab === 'simple' ? 'active' : '') + '" data-tab="simple">' +
              '<i class="fa-solid fa-seedling"></i> Plain English' +
            '</button>' +
            '<button class="ue-tab ' + (this.currentTab === 'quant' ? 'active' : '') + '" data-tab="quant">' +
              '<i class="fa-solid fa-square-root-variable"></i> Quantitative & Math' +
            '</button>' +
            '<button class="ue-tab ' + (this.currentTab === 'institutional' ? 'active' : '') + '" data-tab="institutional">' +
              '<i class="fa-solid fa-building-columns"></i> Institutional Citations' +
            '</button>' +
            calcTabHtml +
          '</div>' +
          '<div class="ue-body" id="ue-tab-content"></div>' +
          '<div class="ue-footer">' +
            '<span class="ue-footer-text">' +
              '<i class="fa-solid fa-shield-check" style="color:#56d364;margin-right:4px;"></i>' +
              'RISKOS Transparent Quantitative Protocol' +
            '</span>' +
            '<button class="ue-footer-btn" id="ue-footer-done">Done</button>' +
          '</div>' +
        '</div>' +
      '</div>';

      this.renderBody();

      // Event listeners
      document.getElementById('ue-close-btn').onclick = () => this.close();
      document.getElementById('ue-footer-done').onclick = () => this.close();
      document.getElementById('ue-backdrop').onclick = (e) => {
        if (e.target.id === 'ue-backdrop') this.close();
      };

      const tabs = root.querySelectorAll('.ue-tab');
      tabs.forEach(btn => {
        btn.onclick = () => {
          tabs.forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          this.setTab(btn.getAttribute('data-tab'));
        };
      });

      // Escape key listener
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          this.close();
          window.removeEventListener('keydown', onKeyDown);
        }
      };
      window.addEventListener('keydown', onKeyDown);
    }

    renderBody() {
      const data = EXPLANATIONS[this.currentMetric];
      const container = document.getElementById('ue-tab-content');
      if (!container || !data) return;

      if (this.currentTab === 'simple') {
        container.innerHTML = '<div class="ue-section">' +
            '<div class="ue-section-title">What is it?</div>' +
            '<p class="ue-p">' + data.simple.what + '</p>' +
          '</div>' +
          '<div class="ue-analogy-box">' +
            '<div class="ue-analogy-title">' +
              '<i class="fa-solid fa-lightbulb"></i> Intuitive Analogy' +
            '</div>' +
            '<p class="ue-p" style="margin:0;color:#c9d1d9;font-size:13px;">' + data.simple.analogy + '</p>' +
          '</div>' +
          '<div class="ue-section" style="margin-top:16px;">' +
            '<div class="ue-section-title">How to Interpret This</div>' +
            '<p class="ue-p">' + data.simple.interpretation + '</p>' +
          '</div>';
      } else if (this.currentTab === 'quant') {
        let varsHtml = '';
        if (data.quant.variables && data.quant.variables.length) {
          varsHtml = '<div class="ue-section-title" style="margin-top:14px;">Variable Definitions</div>' +
            '<div class="ue-vars-grid">' +
              data.quant.variables.map(v => '<div class="ue-var-item"><span class="ue-var-symbol">' + v.symbol + '</span>: ' + v.desc + '</div>').join('') +
            '</div>';
        }

        container.innerHTML = '<div class="ue-section">' +
            '<div class="ue-section-title">Mathematical Formulation</div>' +
            '<div class="ue-formula-card">' +
              '<div class="ue-formula">' + data.quant.formula + '</div>' +
            '</div>' +
            varsHtml +
          '</div>' +
          '<div class="ue-section" style="margin-top:16px;">' +
            '<div class="ue-section-title">Distribution & Model Assumptions</div>' +
            '<p class="ue-p">' + data.quant.assumptions + '</p>' +
          '</div>' +
          '<div class="ue-callout-warning">' +
            '<strong>Known Limitations:</strong> ' + data.quant.limitations +
          '</div>';
      } else if (this.currentTab === 'institutional') {
        container.innerHTML = '<div class="ue-section">' +
            '<div class="ue-section-title"><i class="fa-solid fa-scroll" style="margin-right:6px;"></i>Foundational Academic Literature</div>' +
            '<p class="ue-p" style="font-style:italic;">' + data.institutional.paper + '</p>' +
          '</div>' +
          '<div class="ue-section">' +
            '<div class="ue-section-title"><i class="fa-solid fa-landmark" style="margin-right:6px;"></i>Regulatory Frameworks (Basel / SEBI / SEC)</div>' +
            '<p class="ue-p">' + data.institutional.regulatory + '</p>' +
          '</div>' +
          '<div class="ue-section">' +
            '<div class="ue-section-title"><i class="fa-solid fa-check-double" style="margin-right:6px;"></i>Institutional Desk Best Practice</div>' +
            '<p class="ue-p">' + data.institutional.bestPractice + '</p>' +
          '</div>';
      } else if (this.currentTab === 'calc' && data.calculator) {
        const calc = data.calculator;
        let sliderGroupsHtml = calc.params.map(p => {
          return '<div class="ue-slider-group">' +
            '<label for="ue-param-' + p.id + '">' + p.label + '</label>' +
            '<input type="range" id="ue-param-' + p.id + '" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" value="' + p.default + '">' +
            '<span class="ue-slider-val" id="ue-val-' + p.id + '">' + p.default + '</span>' +
          '</div>';
        }).join('');

        container.innerHTML = '<div class="ue-section">' +
            '<div class="ue-section-title">Interactive Sensitivity Simulator</div>' +
            '<p class="ue-p">Adjust the sliders below to see how this metric responds dynamically:</p>' +
            '<div class="ue-interactive-box">' +
              sliderGroupsHtml +
              '<div class="ue-calc-result">' +
                '<span class="ue-calc-label">Calculated ' + data.title + ':</span>' +
                '<span class="ue-calc-num" id="ue-calc-output">--</span>' +
              '</div>' +
            '</div>' +
          '</div>';

        const updateCalc = () => {
          const values = {};
          calc.params.forEach(p => {
            const input = document.getElementById('ue-param-' + p.id);
            const valSpan = document.getElementById('ue-val-' + p.id);
            if (input && valSpan) {
              values[p.id] = input.value;
              valSpan.textContent = input.value;
            }
          });
          const output = document.getElementById('ue-calc-output');
          if (output) output.textContent = calc.compute(values);
        };

        calc.params.forEach(p => {
          const input = document.getElementById('ue-param-' + p.id);
          if (input) input.oninput = updateCalc;
        });

        updateCalc();
      }
    }
  }

  // Expose singleton to window
  if (typeof window !== 'undefined') {
    global.UniversalExplainer = new UniversalExplainerModal();
    global.createExplainBadge = function (metricId, label) {
      return '<button class="ue-badge-trigger" data-explain="' + metricId + '" type="button"><i class="fa-solid fa-circle-question"></i> ' + (label || 'Explain') + '</button>';
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXPLANATIONS, UniversalExplainerModal };
  }

})(typeof window !== 'undefined' ? window : global);
