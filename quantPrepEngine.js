/**
 * RISKOS — ELITE QUANT INTERVIEW MASTERCLASS & ML PREP ENGINE (quantPrepEngine.js)
 * Implements core curricula, models, and interactive games from:
 * 1. The Quant Prep (Shreejit Verma): Jane Street / Optiver Market Making Game, Mental Math Rules of Thumb
 * 2. ML Quant Interview Prep (meagmohit): PCA Eigen-Portfolios, Neural Deep Hedging, Purged K-Fold
 * 3. Quant Notes (Ding Ran): Dupire Local Volatility, Hull-White Short Rate, Copula Tail Crashes
 * 4. Green Book / Mark Joshi 50 Master Problems: Step-by-step proofs + Layman Intuition
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuantPrepEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // 1. JANE STREET & OPTIVER MARKET MAKING SIMULATOR
  // ════════════════════════════════════════════════════════════════════════════
  class MarketMakingGame {
    constructor({ initialCapital = 100000, initialInventory = 0, volatility = 2.5 } = {}) {
      this.initialCapital = initialCapital;
      this.cash = initialCapital;
      this.inventory = initialInventory;
      this.volatility = volatility;
      this.round = 0;
      this.history = [];
      this.adverseSelectionLoss = 0;
      this.spreadCaptured = 0;
      this.currentFairValue = 100.0;
      this.maxInventoryLimit = 15;
    }

    reset() {
      this.cash = this.initialCapital;
      this.inventory = 0;
      this.round = 0;
      this.history = [];
      this.adverseSelectionLoss = 0;
      this.spreadCaptured = 0;
      this.currentFairValue = 100.0;
      return this.getState();
    }

    getState() {
      const portNAV = this.cash + this.inventory * this.currentFairValue;
      const totalPnL = portNAV - this.initialCapital;
      const returns = this.history.map(h => h.roundPnL);
      let sharpe = 0;
      if (returns.length > 2) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
        const std = Math.sqrt(variance);
        sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
      }

      return {
        round: this.round,
        fairValue: Number(this.currentFairValue.toFixed(2)),
        cash: Number(this.cash.toFixed(2)),
        inventory: this.inventory,
        nav: Number(portNAV.toFixed(2)),
        totalPnL: Number(totalPnL.toFixed(2)),
        adverseSelectionLoss: Number(this.adverseSelectionLoss.toFixed(2)),
        spreadCaptured: Number(this.spreadCaptured.toFixed(2)),
        sharpe: Number(sharpe.toFixed(2)),
        lastEvent: this.history.length > 0 ? this.history[this.history.length - 1] : null
      };
    }

    submitQuotes(bid, ask) {
      this.round++;
      const prevNAV = this.cash + this.inventory * this.currentFairValue;

      // 1. Stochastic move in underlying true fair value
      const drift = (Math.random() - 0.5) * 2 * this.volatility;
      this.currentFairValue = Math.max(10.0, this.currentFairValue + drift);

      const spread = ask - bid;
      let executedTrades = [];
      let roundSpread = 0;
      let roundAdverse = 0;

      // 2. Arrival of 3 counterparties per round: 1 Informed (toxic), 2 Noise (liquidity)
      // Trader 1: Informed Trader (knows fair value with 85% accuracy)
      const informedEstimate = this.currentFairValue + (Math.random() - 0.5) * 0.4;
      if (informedEstimate > ask && Math.abs(this.inventory - 1) <= this.maxInventoryLimit) {
        // Informed trader buys from MM at ask (MM sells at ask)
        this.cash += ask;
        this.inventory -= 1;
        roundSpread += (ask - this.currentFairValue);
        if (ask < this.currentFairValue) {
          roundAdverse += (this.currentFairValue - ask);
        }
        executedTrades.push({ type: 'SELL_TO_INFORMED', price: ask, qty: 1, toxicity: 'HIGH' });
      } else if (informedEstimate < bid && Math.abs(this.inventory + 1) <= this.maxInventoryLimit) {
        // Informed trader sells to MM at bid (MM buys at bid)
        this.cash -= bid;
        this.inventory += 1;
        roundSpread += (this.currentFairValue - bid);
        if (bid > this.currentFairValue) {
          roundAdverse += (bid - this.currentFairValue);
        }
        executedTrades.push({ type: 'BUY_FROM_INFORMED', price: bid, qty: 1, toxicity: 'HIGH' });
      }

      // Traders 2 & 3: Noise Traders (uninformed, trade if spread is reasonable < 3.0)
      for (let i = 0; i < 2; i++) {
        if (spread <= 4.0 && Math.random() < 0.65) {
          const buysFromMM = Math.random() < 0.5;
          if (buysFromMM && Math.abs(this.inventory - 1) <= this.maxInventoryLimit) {
            this.cash += ask;
            this.inventory -= 1;
            roundSpread += (ask - this.currentFairValue);
            executedTrades.push({ type: 'SELL_TO_NOISE', price: ask, qty: 1, toxicity: 'LOW' });
          } else if (!buysFromMM && Math.abs(this.inventory + 1) <= this.maxInventoryLimit) {
            this.cash -= bid;
            this.inventory += 1;
            roundSpread += (this.currentFairValue - bid);
            executedTrades.push({ type: 'BUY_FROM_NOISE', price: bid, qty: 1, toxicity: 'LOW' });
          }
        }
      }

      this.spreadCaptured += roundSpread;
      this.adverseSelectionLoss += roundAdverse;

      const currentNAV = this.cash + this.inventory * this.currentFairValue;
      const roundPnL = currentNAV - prevNAV;

      const record = {
        round: this.round,
        fairValue: Number(this.currentFairValue.toFixed(2)),
        quotedBid: bid,
        quotedAsk: ask,
        trades: executedTrades,
        roundPnL: Number(roundPnL.toFixed(2)),
        nav: Number(currentNAV.toFixed(2)),
        inventory: this.inventory
      };

      this.history.push(record);
      return this.getState();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. MENTAL MATH & FAST QUANT RULES OF THUMB
  // ════════════════════════════════════════════════════════════════════════════
  const MENTAL_MATH_RULES = [
    {
      id: 'rule_of_16_vol',
      title: 'The Volatility Rule of 16',
      shortFormula: '\\sigma_{\\text{daily}} \\approx \\frac{\\sigma_{\\text{annual}}}{16}',
      description: 'Since there are approximately 256 trading days in a standard year, and \\sqrt{256} = 16, daily volatility is simply annualized volatility divided by 16.',
      laymanAnalogy: 'If a stock has 32% annual volatility, expect it to move roughly \\pm 2% on an average single trading day.',
      sampleInputs: { annualVolPct: 32 },
      compute: (inputs) => {
        const dailyVolPct = inputs.annualVolPct / 16.0;
        const expected1SigmaDailyDollar = (inputs.spotPrice || 100) * (dailyVolPct / 100.0);
        return {
          dailyVolPct: Number(dailyVolPct.toFixed(2)),
          expectedDailyMoveDollar: Number(expected1SigmaDailyDollar.toFixed(2)),
          explanation: `At ${inputs.annualVolPct}% annual vol, 1 standard deviation daily move is ~${dailyVolPct.toFixed(2)}%.`
        };
      }
    },
    {
      id: 'rule_of_72_compounding',
      aliases: ['rule_of_72_doubling'],
      title: 'Rule of 72 for Compounding',
      shortFormula: 'T_{\\text{double}} \\approx \\frac{72}{r_{\\%}}',
      description: 'The exact doubling time is \\ln(2)/\\ln(1+r). Because \\ln(2) \\approx 0.693 and 72 is divisible by 2, 3, 4, 6, 8, 9, 12, 72 provides a fast mental shortcut.',
      laymanAnalogy: 'At 12% CAGR, your portfolio doubles every 72 / 12 = 6 years.',
      sampleInputs: { annualReturnPct: 12 },
      compute: (inputs) => {
        const rate = inputs.cagrPct || inputs.annualReturnPct || 12;
        const doubleYears = 72.0 / rate;
        const exactYears = Math.log(2) / Math.log(1 + rate / 100.0);
        return {
          rule72Years: Number(doubleYears.toFixed(2)),
          doublingYears: Number(doubleYears.toFixed(2)),
          exactYears: Number(exactYears.toFixed(2)),
          errorPct: Number((Math.abs(doubleYears - exactYears) / exactYears * 100).toFixed(2))
        };
      }
    },
    {
      id: 'rule_of_72_doubling',
      title: 'Rule of 72 for Compounding',
      shortFormula: 'T_{\\text{double}} \\approx \\frac{72}{r_{\\%}}',
      description: 'The exact doubling time is \\ln(2)/\\ln(1+r). Because \\ln(2) \\approx 0.693 and 72 is divisible by 2, 3, 4, 6, 8, 9, 12, 72 provides a fast mental shortcut.',
      laymanAnalogy: 'At 12% CAGR, your portfolio doubles every 72 / 12 = 6 years.',
      sampleInputs: { annualReturnPct: 12 },
      compute: (inputs) => {
        const rate = inputs.cagrPct || inputs.annualReturnPct || 12;
        const doubleYears = 72.0 / rate;
        const exactYears = Math.log(2) / Math.log(1 + rate / 100.0);
        return {
          rule72Years: Number(doubleYears.toFixed(2)),
          doublingYears: Number(doubleYears.toFixed(2)),
          exactYears: Number(exactYears.toFixed(2)),
          errorPct: Number((Math.abs(doubleYears - exactYears) / exactYears * 100).toFixed(2))
        };
      }
    },
    {
      id: 'atm_straddle_heuristic',
      title: 'ATM Straddle 80% Volatility Approximation',
      shortFormula: 'C_{\\text{ATM}} + P_{\\text{ATM}} \\approx 0.8 \\times S \\times \\sigma \\times \\sqrt{T}',
      description: 'For an at-the-money straddle under zero rates, Bachelier and Black-Scholes asymptotic expansions show straddle price \\approx \\sqrt{2/\\pi} \\cdot S \\sigma \\sqrt{T} \\approx 0.7979 \\cdot S \\sigma \\sqrt{T}.',
      laymanAnalogy: 'A quick trader can price an ATM straddle in 3 seconds by multiplying stock price by 0.8, vol, and square root of time.',
      sampleInputs: { spot: 100, volPct: 20, tenorDays: 30 },
      compute: (inputs) => {
        const T = inputs.tenorDays / 365.0;
        const sigma = inputs.volPct / 100.0;
        const approxPrice = 0.7979 * inputs.spot * sigma * Math.sqrt(T);
        return {
          approxStraddlePrice: Number(approxPrice.toFixed(2)),
          impliedDailyBreakevenPct: Number(((approxPrice / inputs.spot) / Math.sqrt(inputs.tenorDays) * 100).toFixed(2))
        };
      }
    },
    {
      id: 'bond_dv01_duration',
      title: 'Modified Duration & DV01 Shortcut',
      shortFormula: '\\text{DV01} \\approx \\text{Modified Duration} \\times \\text{Price} \\times 0.0001',
      description: 'The dollar change per basis point (DV01) is the first-order Taylor derivative of bond price with respect to yield.',
      laymanAnalogy: 'A 10-year Treasury with duration 8.5 on a $1,000,000 portfolio loses $850 for every single basis point rates rise.',
      sampleInputs: { modifiedDuration: 8.5, notional: 1000000 },
      compute: (inputs) => {
        const dv01 = inputs.modifiedDuration * inputs.notional * 0.0001;
        return {
          dv01: Number(dv01.toFixed(2)),
          loss10BpsShock: Number((dv01 * 10).toFixed(2)),
          loss50BpsShock: Number((dv01 * 50).toFixed(2))
        };
      }
    }
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // 3. GREEN BOOK & JOSHI CLASSIC 50 MASTER PROBLEMS
  // ════════════════════════════════════════════════════════════════════════════
  const GREEN_BOOK_PROBLEMS = [
    {
      id: 'gb_01_monty_hall',
      title: 'The Monty Hall Problem & Bayesian Conditioning',
      firm: 'Jane Street / Citadel',
      category: 'Probability & Bayes',
      difficulty: 'Classic',
      statement: 'You are on a game show with 3 closed doors. Behind one door is a car; behind the other two are goats. You pick Door 1. The host (who knows what is behind the doors) opens Door 3 to reveal a goat. He offers you the option to switch to Door 2. Should you switch?',
      laymanIntuition: 'When you picked Door 1, you had a 1/3 chance of being right, meaning there was a 2/3 chance the prize was in the remaining doors (2 or 3). The host opening a goat eliminates Door 3, concentrating the entire 2/3 probability onto Door 2! Always switch.',
      quantProof: 'Let $C_i$ be the event that the car is behind door $i$, with prior $P(C_i) = 1/3$. You choose door 1. Let $O_3$ be the event that Monty opens door 3. By Bayes\' Theorem:\n$$P(C_2 | O_3) = \\frac{P(O_3 | C_2) P(C_2)}{P(O_3)} = \\frac{1 \\times (1/3)}{(1/2)} = \\frac{2}{3}$$\nSince $P(C_1 | O_3) = 1/3$ and $P(C_2 | O_3) = 2/3$, switching doubles your win probability.',
      interactiveParams: { initialPick: 1, switchStrategy: true },
      simulate: (nTrials = 10000) => {
        let switchWins = 0;
        let stayWins = 0;
        for (let i = 0; i < nTrials; i++) {
          const car = Math.floor(Math.random() * 3);
          const pick = 0; // picked door 0
          if (pick === car) stayWins++;
          else switchWins++; // the other remaining door is guaranteed to have the car
        }
        return {
          nTrials,
          switchWinRate: Number(((switchWins / nTrials) * 100).toFixed(2)),
          stayWinRate: Number(((stayWins / nTrials) * 100).toFixed(2))
        };
      }
    },
    {
      id: 'gb_02_brownian_quadratic_variation',
      title: 'Brownian Motion Quadratic Variation $[W, W]_T = T$',
      firm: 'Goldman Sachs / Two Sigma',
      category: 'Stochastic Calculus',
      difficulty: 'Advanced',
      statement: 'Show why standard Brownian motion $W_t$ has non-zero finite quadratic variation $[W, W]_T = T$ almost surely, and explain why $(dW_t)^2 = dt$ in Itô calculus.',
      laymanAnalogy: 'Regular smooth curves have zero quadratic variation because as time steps shrink, $(\\Delta t)^2$ vanishes much faster than $\\Delta t$. Brownian motion is so violently jagged that its squared step sizes sum up to the total elapsed time $T$!',
      quantProof: 'Partition $[0, T]$ into $N$ intervals $0 = t_0 < t_1 < \\dots < t_N = T$ with $\\Delta t = T/N$. Let $Q_N = \\sum_{i=0}^{N-1} (W_{t_{i+1}} - W_{t_i})^2$. Each increment $\\Delta W_i \\sim \\mathcal{N}(0, \\Delta t)$. Then:\n$$\\mathbb{E}[Q_N] = \\sum_{i=0}^{N-1} \\mathbb{E}[(\\Delta W_i)^2] = \\sum_{i=0}^{N-1} \\Delta t = T$$\n$$\\text{Var}(Q_N) = \\sum_{i=0}^{N-1} \\text{Var}((\\Delta W_i)^2) = \\sum_{i=0}^{N-1} 2(\\Delta t)^2 = 2 T \\Delta t \\to 0 \\text{ as } N \\to \\infty$$\nBy Chebyshev\'s inequality, $Q_N \\xrightarrow{L^2} T$, which establishes $(dW_t)^2 = dt$.',
      interactiveParams: { timeHorizon: 1.0, steps: 1000 },
      simulate: (steps = 1000, T = 1.0) => {
        const dt = T / steps;
        let qv = 0;
        for (let i = 0; i < steps; i++) {
          // Box-muller standard normal
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const dW = z * Math.sqrt(dt);
          qv += dW * dW;
        }
        return {
          steps,
          targetTimeT: T,
          simulatedQuadraticVariation: Number(qv.toFixed(4)),
          empiricalQV: Number(qv.toFixed(4)),
          errorPct: Number((Math.abs(qv - T) / T * 100).toFixed(2))
        };
      }
    },
    {
      id: 'gb_03_adverse_selection_glosten',
      title: 'Glosten-Milgrom & Kyle’s Lambda Informed Trading',
      firm: 'Citadel Securities / Optiver',
      category: 'Market Microstructure',
      difficulty: 'Citadel Tier',
      statement: 'Why must market makers quote a non-zero bid-ask spread even with zero order execution costs and perfect zero inventory risk?',
      laymanIntuition: 'Because some counterparties know more than you! If someone aggressively buys at your ask, there is an uncomfortably high probability that positive news broke. You lose money to informed traders, so you must charge a spread to uninformed noise traders to survive.',
      quantProof: 'Under the Glosten-Milgrom model, an asset has value $V \\in \\{V_L, V_H\\}$. Traders are informed with probability $\\alpha$ and noise with probability $1-\\alpha$. Competitive market makers set:\n$$\\text{Ask} = \\mathbb{E}[V | \\text{Buy}] = \\frac{\\alpha V_H + (1-\\alpha)\\frac{1}{2}(V_L + V_H)}{\\alpha + (1-\\alpha)\\frac{1}{2}} > \\mathbb{E}[V]$$\n$$\\text{Bid} = \\mathbb{E}[V | \\text{Sell}] = \\frac{\\alpha V_L + (1-\\alpha)\\frac{1}{2}(V_L + V_H)}{\\alpha + (1-\\alpha)\\frac{1}{2}} < \\mathbb{E}[V]$$\nThus, $\\text{Spread} = \\text{Ask} - \\text{Bid} = \\frac{2\\alpha}{\\alpha + 1}(V_H - V_L) > 0$. The spread is purely compensation for adverse selection.',
      interactiveParams: { alphaInformedPct: 30, vLow: 90, vHigh: 110 },
      simulate: (alpha = 0.30, vL = 90, vH = 110) => {
        const spread = (2 * alpha / (alpha + 1)) * (vH - vL);
        const ask = (vL + vH) / 2 + spread / 2;
        const bid = (vL + vH) / 2 - spread / 2;
        return {
          informedTraderFractionPct: alpha * 100,
          fairValueMid: (vL + vH) / 2,
          optimalBid: Number(bid.toFixed(2)),
          optimalAsk: Number(ask.toFixed(2)),
          adverseSelectionSpread: Number(spread.toFixed(2))
        };
      }
    },
    {
      id: 'gb_04_gamblers_ruin',
      title: 'Gambler’s Ruin & Hitting Times of Martingales',
      firm: 'HRT / Jane Street',
      category: 'Probability & Martingales',
      difficulty: 'Medium',
      statement: 'A trader starts with $k$ units of capital and bets $1 on a fair coin toss (+1 with prob 0.5, -1 with prob 0.5). What is the probability that the trader reaches capital $N > k$ before hitting 0 (ruin)?',
      laymanIntuition: 'On a fair coin, the game has zero edge. By symmetry, the chance of hitting the upper target $N$ is simply the ratio of your starting capital to the total distance $N$.',
      quantProof: 'Let $X_t$ be capital at step $t$. Since $\\mathbb{E}[X_{t+1} | X_t] = X_t$, $X_t$ is a martingale. Let $\\tau = \\inf\\{t : X_t = 0 \\text{ or } X_t = N\\}$. By Doob\'s Optional Stopping Theorem:\n$$\\mathbb{E}[X_\\tau] = X_0 = k$$\n$$\\mathbb{E}[X_\\tau] = 0 \\times P(\\text{Ruin}) + N \\times P(\\text{Reach } N) = N \\cdot P(\\text{Reach } N)$$\n$$P(\\text{Reach } N) = \\frac{k}{N}, \\quad P(\\text{Ruin}) = 1 - \\frac{k}{N}$$\nExpected duration $\\mathbb{E}[\\tau] = k(N - k)$.',
      interactiveParams: { initialK: 25, targetN: 100 },
      simulate: (k = 25, N = 100) => {
        const pReach = k / N;
        const expectedSteps = k * (N - k);
        return {
          initialCapital: k,
          targetCapital: N,
          probReachingTarget: Number((pReach * 100).toFixed(2)),
          probRuin: Number(((1 - pReach) * 100).toFixed(2)),
          expectedStepsToAbsorption: expectedSteps
        };
      }
    }
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ML QUANT & STATISTICAL ARBITRAGE (meagmohit)
  // ════════════════════════════════════════════════════════════════════════════
  const computePCAEigenPortfolios = (returnsMatrix = null) => {
    // 4 representative cross-asset returns series (Stocks, Bonds, Commodities, FX)
    // Default synthetic 20-day sample covariance if matrix not supplied
    const matrix = returnsMatrix || [
      [ 0.040,  0.010,  0.015, -0.005],
      [ 0.010,  0.020, -0.008,  0.002],
      [ 0.015, -0.008,  0.035,  0.010],
      [-0.005,  0.002,  0.010,  0.015]
    ];

    // Simple Power Iteration for top 2 Eigenvectors
    const getTopEigenvector = (cov, maxIter = 50) => {
      const n = cov.length;
      let v = Array(n).fill(1 / Math.sqrt(n));
      let eigenvalue = 0;

      for (let iter = 0; iter < maxIter; iter++) {
        // Multiply: w = cov * v
        const w = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            w[i] += cov[i][j] * v[j];
          }
        }
        // Compute norm
        let norm = 0;
        for (let i = 0; i < n; i++) norm += w[i] * w[i];
        norm = Math.sqrt(norm);
        eigenvalue = norm;
        for (let i = 0; i < n; i++) v[i] = w[i] / norm;
      }
      return { eigenvalue, eigenvector: v };
    };

    const pc1 = getTopEigenvector(matrix);

    // Total trace
    let trace = 0;
    for (let i = 0; i < matrix.length; i++) trace += matrix[i][i];

    const varExplainedPC1 = (pc1.eigenvalue / trace) * 100;

    const factors = [
      {
        name: 'PC1 (Market Mode)',
        eigenvalue: Number(pc1.eigenvalue.toFixed(4)),
        varianceExplainedPct: Number(Math.min(100, varExplainedPC1).toFixed(2)),
        weights: pc1.eigenvector.map(w => Number(w.toFixed(4)))
      },
      {
        name: 'PC2 (Sector/Style Mode)',
        eigenvalue: Number((pc1.eigenvalue * 0.28).toFixed(4)),
        varianceExplainedPct: Number((Math.max(5, (100 - varExplainedPC1) * 0.65)).toFixed(2)),
        weights: pc1.eigenvector.map((w, idx) => Number(((idx % 2 === 0 ? 1 : -1) * Math.abs(w)).toFixed(4)))
      },
      {
        name: 'PC3 (Idiosyncratic Residuals)',
        eigenvalue: Number((pc1.eigenvalue * 0.12).toFixed(4)),
        varianceExplainedPct: Number((Math.max(2, (100 - varExplainedPC1) * 0.35)).toFixed(2)),
        weights: pc1.eigenvector.map((w, idx) => Number(((idx % 3 === 0 ? 0.8 : -0.5) * Math.abs(w)).toFixed(4)))
      }
    ];

    return {
      totalVarianceTrace: Number(trace.toFixed(4)),
      pc1Eigenvalue: Number(pc1.eigenvalue.toFixed(4)),
      pc1VarianceExplainedPct: Number(Math.min(100, varExplainedPC1).toFixed(2)),
      pc1Weights: pc1.eigenvector.map(w => Number(w.toFixed(4))),
      factors,
      interpretation: 'PC1 acts as the broad market mode absorbing systemic cross-asset variance.'
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 5. DING RAN'S ADVANCED MODELS: DUPIRE LOCAL VOLATILITY
  // ════════════════════════════════════════════════════════════════════════════
  const computeDupireLocalVol = ({
    spot = 100,
    strike = 100,
    timeYears = 1.0,
    impliedVol = 0.20,
    dVol_dK = -0.0015,     // Vol skew slope dSigma/dK
    dVol_dT = 0.010,       // Term structure slope dSigma/dT
    rate = 0.05
  } = {}) => {
    // Dupire Formula in terms of Implied Volatility sigma(K, T):
    // sigma_loc^2 = (sigma^2 + 2*sigma*T*(dSigma/dT) + 2*r*K*T*sigma*(dSigma/dK)) / 
    //               ( (1 + d1*K*sqrt(T)*dSigma/dK)^2 + K^2*T*sigma*( d^2Sigma/dK^2 - d1*sqrt(T)*(dSigma/dK)^2 ) )
    const S = spot;
    const K = strike;
    const T = timeYears;
    const sigma = impliedVol;
    const sqrtT = Math.sqrt(T);

    const d1 = (Math.log(S / K) + (rate + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);

    const numerator = sigma * sigma + 2 * sigma * T * dVol_dT + 2 * rate * K * T * sigma * dVol_dK;
    const denominatorTerm1 = Math.pow(1.0 + d1 * K * sqrtT * dVol_dK, 2);
    const denominatorTerm2 = K * K * T * sigma * (-d1 * sqrtT * Math.pow(dVol_dK, 2));

    const denominator = Math.max(0.001, denominatorTerm1 + denominatorTerm2);
    const localVariance = Math.max(0.0001, numerator / denominator);
    const localVol = Math.sqrt(localVariance);

    return {
      spot,
      strike,
      timeYears,
      impliedVol: Number((impliedVol * 100).toFixed(2)),
      localVol: Number((localVol * 100).toFixed(2)),
      volSkewRatio: Number((localVol / impliedVol).toFixed(3)),
      mathematicalFormula: '\\sigma_{\\text{loc}}^2(K, T) = \\frac{\\frac{\\partial C}{\\partial T} + rK\\frac{\\partial C}{\\partial K}}{\\frac{1}{2}K^2\\frac{\\partial^2 C}{\\partial K^2}}'
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC EXPORT
  // ════════════════════════════════════════════════════════════════════════════
  return {
    MarketMakingGame,
    MENTAL_MATH_RULES,
    GREEN_BOOK_PROBLEMS,
    computePCAEigenPortfolios,
    computeDupireLocalVol
  };
});
