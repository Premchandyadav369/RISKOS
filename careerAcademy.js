/**
 * RISKOS — QUANT CAREER ACADEMY & 2-WAY MARKET MAKING SIMULATOR (careerAcademy.js)
 * High-Frequency Trading Desk Simulation, Mental Math Drills, and Green Book Solver
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CareerAcademy = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // ── 1. Top 50 Quantitative Green Book Riddles (Heard on the Street / Joshi) ──
  const GREEN_BOOK_QUESTIONS = [
    {
      id: 'gb_01',
      category: 'Probability & Games',
      title: 'Optimal Stopping: Roll of a 6-Sided Die',
      question: 'You roll a fair 6-sided die. You can either take the dollar amount on the top face or pay nothing and roll one more time, taking whatever is on the second roll. What is your optimal strategy and expected payoff?',
      answer: 'Roll again if the first roll is 1, 2, or 3. Expected payoff is $4.25.',
      derivation: 'The expected value of the second roll is $\\mathbb{E}[X_2] = \\frac{1+2+3+4+5+6}{6} = 3.5$. On the first roll, you should stop if $X_1 > 3.5$ (i.e. if $X_1 \\in \\{4, 5, 6\\}$) and re-roll if $X_1 \\in \\{1, 2, 3\\}$. Therefore: $\\mathbb{E}[\\text{Payoff}] = \\frac{1}{2}(3.5) + \\frac{1}{6}(4 + 5 + 6) = 1.75 + 2.50 = 4.25$.'
    },
    {
      id: 'gb_02',
      category: 'Market Making & Microstructure',
      title: 'Rule of 16 Implied Daily Volatility',
      question: 'An equity option is trading at 32% annualized implied volatility. Assuming 256 trading days in a year, what is the expected standard deviation of daily percentage price moves?',
      answer: '2.0% daily volatility.',
      derivation: 'Under Brownian motion, volatility scales with the square root of time: $\\sigma_{\\text{annual}} = \\sigma_{\\text{daily}} \\times \\sqrt{256} = 16 \\times \\sigma_{\\text{daily}}$. Hence $\\sigma_{\\text{daily}} = \\frac{32\\%}{16} = 2.0\\%$. The Rule of 16 states $\\sigma_{\\text{daily}} \\approx \\frac{\\sigma_{\\text{ann}}}{16}$.'
    },
    {
      id: 'gb_03',
      category: 'Portfolio Management & Leverage',
      title: 'Continuous-Time Kelly Criterion with Drift & Vol',
      question: 'You have an asset with expected annual return $\\mu = 14\\%$, risk-free rate $r = 4\\%$, and volatility $\\sigma = 20\\%$. What is the optimal Kelly leverage $f^*$ to maximize the long-term compounding growth rate?',
      answer: 'Optimal leverage is 2.5x (Half-Kelly is 1.25x).',
      derivation: 'In continuous time, the growth rate of wealth under leverage $f$ is $g(f) = r + f(\\mu - r) - \\frac{1}{2} f^2 \\sigma^2$. Setting the first derivative to zero: $g\'(f) = (\\mu - r) - f \\sigma^2 = 0 \\implies f^* = \\frac{\\mu - r}{\\sigma^2}$. Substituting $\\mu - r = 0.10$ and $\\sigma^2 = 0.04$ yields $f^* = \\frac{0.10}{0.04} = 2.5$.'
    },
    {
      id: 'gb_04',
      category: 'Stochastic Calculus & Derivatives',
      title: 'Reflection Principle of Brownian Motion',
      question: 'Let $W_t$ be a standard Brownian motion with $W_0 = 0$. What is the probability that $W_t$ reaches a barrier level $b > 0$ at or before time $T$?',
      answer: '$\\mathbb{P}(\\max_{0 \\le t \\le T} W_t \\ge b) = 2 \\left(1 - \\Phi\\left(\\frac{b}{\\sqrt{T}}\\right)\\right)$.',
      derivation: 'By the strong Markov property and the reflection principle, sample paths hitting barrier $b$ are equally likely to be above or below $b$ at time $T$: $\\mathbb{P}(\\max_{0 \\le t \\le T} W_t \\ge b) = 2 \\mathbb{P}(W_T \\ge b) = 2 \\left(1 - \\Phi\\left(\\frac{b}{\\sqrt{T}}\\right)\\right)$. This forms the mathematical foundation of barrier option pricing.'
    },
    {
      id: 'gb_05',
      category: 'Fixed Income & DV01',
      title: 'Bond Dollar Duration & DV01 Impact',
      question: 'A $10,000,000 sovereign bond portfolio has a modified duration of 7.50 years. If interest rate yields increase immediately by +35 basis points, what is the approximate mark-to-market dollar loss?',
      answer: '-$262,500 dollar loss (DV01 is $7,500 per bp).',
      derivation: 'DV01 (Dollar Value of an 01) is defined as $DV01 = P \\times D_{\\text{mod}} \\times 0.0001 = 10,000,000 \\times 7.50 \\times 0.0001 = \\$7,500$ per basis point. For a $+35$ bps parallel shift: $\\Delta P \\approx -DV01 \\times 35 = -7,500 \\times 35 = -\\$262,500$.'
    }
  ];

  // ── 2. Mental Math Speed Drill Generator ──────────────────────────────────
  class MentalMathDrill {
    static generateQuestion() {
      const types = ['MULTIPLICATION', 'RULE_OF_16', 'BOND_DV01', 'OPTION_PAYOFF'];
      const chosen = types[Math.floor(Math.random() * types.length)];

      if (chosen === 'MULTIPLICATION') {
        const a = Math.floor(Math.random() * 70 + 20); // 20 - 90
        const b = Math.floor(Math.random() * 70 + 20);
        return {
          type: 'Arithmetic Speed',
          prompt: `Calculate: ${a} × ${b}`,
          correctAnswer: a * b,
          options: [a * b, a * b + 10, a * b - 10, a * b + (Math.random() > 0.5 ? 20 : -20)].sort(() => Math.random() - 0.5),
          timeLimitSec: 8
        };
      } else if (chosen === 'RULE_OF_16') {
        const dailyVols = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];
        const dVol = dailyVols[Math.floor(Math.random() * dailyVols.length)];
        const annVol = +(dVol * 16).toFixed(1);
        return {
          type: 'Rule of 16 Volatility',
          prompt: `Daily vol is ${dVol}%. What is annualized implied volatility?`,
          correctAnswer: annVol,
          options: [annVol, +(annVol + 4).toFixed(1), +(annVol - 4).toFixed(1), +(annVol + 8).toFixed(1)].sort(() => Math.random() - 0.5),
          timeLimitSec: 8
        };
      } else if (chosen === 'BOND_DV01') {
        const notionalM = [5, 10, 20][Math.floor(Math.random() * 3)];
        const duration = [4, 6, 8, 10][Math.floor(Math.random() * 4)];
        const dv01 = notionalM * 1000000 * duration * 0.0001;
        return {
          type: 'Bond DV01',
          prompt: `Portfolio: $${notionalM}M, Modified Duration: ${duration}Y. What is the DV01 (dollar move per 1 bp)?`,
          correctAnswer: dv01,
          options: [dv01, dv01 * 1.5, dv01 * 0.5, dv01 + 2000].sort(() => Math.random() - 0.5),
          timeLimitSec: 8
        };
      } else {
        const S = [100, 105, 110, 115, 120][Math.floor(Math.random() * 5)];
        const K = 105;
        const prem = 3.50;
        const isCall = Math.random() > 0.5;
        const payoff = isCall ? Math.max(0, S - K) - prem : Math.max(0, K - S) - prem;
        return {
          type: 'Option Net Payoff',
          prompt: `Spot is $${S}. ${isCall ? 'Call' : 'Put'} Strike $${K} purchased for $${prem}. Net P&L per share?`,
          correctAnswer: +payoff.toFixed(2),
          options: [+payoff.toFixed(2), +(payoff + 3).toFixed(2), +(payoff - 3).toFixed(2), +(payoff + 1.5).toFixed(2)].sort(() => Math.random() - 0.5),
          timeLimitSec: 8
        };
      }
    }
  }

  // ── 3. Jane Street / Optiver 2-Way Market Making Game ─────────────────────
  class MarketMakingGameEngine {
    constructor() {
      this.reset();
    }

    reset() {
      this.currentRound = 1;
      this.maxRounds = 10;
      this.trueValue = 100.00;
      this.inventory = 0; // q
      this.cash = 0.00;
      this.volatility = 0.40; // sigma
      this.riskAversion = 0.15; // gamma
      this.history = [];
      this.adverseSelectionsCount = 0;
      this.totalTradesCount = 0;
      this.gameOver = false;
    }

    quote(bid, ask) {
      if (this.gameOver) return { gameOver: true };
      if (bid >= ask) {
        return { success: false, reason: 'Bid price must be strictly less than Ask price.' };
      }

      // Step 1: True value random walk
      const shock = (Math.random() - 0.5) * 2 * this.volatility;
      this.trueValue = +(this.trueValue + shock).toFixed(2);

      // Step 2: Determine order flow (75% uninformed noise, 25% informed institutional)
      const isInformed = Math.random() < 0.25;
      let actionTaken = 'NONE';
      let adverseSelection = false;

      if (isInformed) {
        // Informed trader knows true value!
        if (bid > this.trueValue) {
          // Trader dumps at user's inflated bid
          this.cash -= bid;
          this.inventory += 1;
          actionTaken = 'HIT_BID_TOXIC';
          adverseSelection = true;
          this.adverseSelectionsCount++;
          this.totalTradesCount++;
        } else if (ask < this.trueValue) {
          // Trader buys at user's cheap ask
          this.cash += ask;
          this.inventory -= 1;
          actionTaken = 'LIFT_ASK_TOXIC';
          adverseSelection = true;
          this.adverseSelectionsCount++;
          this.totalTradesCount++;
        }
      } else {
        // Uninformed retail noise trader (spread crossing if within range)
        const spread = ask - bid;
        const mid = (bid + ask) / 2;
        const distFromTrue = Math.abs(mid - this.trueValue);

        if (distFromTrue < 0.60 && spread <= 1.00) {
          if (Math.random() < 0.5) {
            // Noise seller hits bid
            this.cash -= bid;
            this.inventory += 1;
            actionTaken = 'HIT_BID_NOISE';
            this.totalTradesCount++;
          } else {
            // Noise buyer lifts ask
            this.cash += ask;
            this.inventory -= 1;
            actionTaken = 'LIFT_ASK_NOISE';
            this.totalTradesCount++;
          }
        }
      }

      // Step 3: Inventory holding cost (Avellaneda-Stoikov penalty)
      const inventoryPenalty = +(0.5 * this.riskAversion * Math.pow(this.inventory, 2) * 0.05).toFixed(2);
      this.cash -= inventoryPenalty;

      // Mark to market total PnL
      const totalPnL = +(this.cash + this.inventory * this.trueValue).toFixed(2);

      const roundRecord = {
        round: this.currentRound,
        bid,
        ask,
        trueValue: this.trueValue,
        actionTaken,
        adverseSelection,
        inventory: this.inventory,
        inventoryPenalty,
        totalPnL
      };

      this.history.push(roundRecord);
      this.currentRound++;

      if (this.currentRound > this.maxRounds) {
        this.gameOver = true;
      }

      return {
        success: true,
        roundRecord,
        gameOver: this.gameOver,
        summary: this.gameOver ? this.getFinalSummary() : null
      };
    }

    getFinalSummary() {
      const finalPnL = this.history[this.history.length - 1]?.totalPnL || 0;
      const adverseRatePct = this.totalTradesCount > 0
        ? +((this.adverseSelectionsCount / this.totalTradesCount) * 100).toFixed(1)
        : 0;

      let rank = 'QUANT APPRENTICE';
      if (finalPnL > 10.0 && adverseRatePct < 20) rank = 'JANE STREET LEAD MARKET MAKER';
      else if (finalPnL > 5.0) rank = 'OPTIVER SENIOR TRADER';
      else if (finalPnL > 0) rank = 'PROP DESK ANALYST';

      return {
        finalPnL,
        totalTrades: this.totalTradesCount,
        adverseSelections: this.adverseSelectionsCount,
        adverseRatePct,
        rank,
        passed: finalPnL > 0
      };
    }
  }

  // ── 4. Interactive Academy Modal Controller ───────────────────────────────
  class CareerAcademyController {
    constructor() {
      this.game = new MarketMakingGameEngine();
      this.drillScore = 0;
      this.drillTotal = 0;
      this.currentDrill = null;
      this.timerInterval = null;
    }

    openModal() {
      if (typeof document === 'undefined') return;
      let modal = document.getElementById('riskosCareerAcademyModal');

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'riskosCareerAcademyModal';
        modal.style.cssText = `
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;

        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid #1e293b; border-radius:14px; width:100%; max-width:880px; box-shadow:0 25px 60px -15px rgba(0,0,0,0.95); color:#f1f5f9; font-family:Inter,system-ui,sans-serif; max-height:92vh; display:flex; flex-direction:column; overflow:hidden;">
            <!-- Header -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 24px; border-bottom:1px solid #1e293b; background:#0d1322;">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-weight:800; font-size:16px; color:#38bdf8;"><i class="fa-solid fa-graduation-cap"></i> QUANT CAREER ACADEMY</span>
                <span style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); font-size:11px; padding:2px 8px; border-radius:999px; font-weight:700;">OPTIVER &amp; JANE STREET PREP</span>
              </div>
              <button id="academyCloseBtn" style="background:none; border:none; color:#94a3b8; font-size:24px; cursor:pointer; line-height:1;">&times;</button>
            </div>

            <!-- Tabs -->
            <div style="display:flex; border-bottom:1px solid #1e293b; background:#060a12; padding:0 16px;">
              <button class="academy-tab-btn active" data-tab="tab_game" style="padding:12px 18px; background:none; border:none; border-bottom:2px solid #38bdf8; color:#38bdf8; font-weight:700; font-size:12px; cursor:pointer;"><i class="fa-solid fa-gamepad"></i> 2-Way MM Game</button>
              <button class="academy-tab-btn" data-tab="tab_drills" style="padding:12px 18px; background:none; border:none; border-bottom:2px solid transparent; color:#94a3b8; font-weight:700; font-size:12px; cursor:pointer;"><i class="fa-solid fa-bolt"></i> 8s Mental Math Drills</button>
              <button class="academy-tab-btn" data-tab="tab_greenbook" style="padding:12px 18px; background:none; border:none; border-bottom:2px solid transparent; color:#94a3b8; font-weight:700; font-size:12px; cursor:pointer;"><i class="fa-solid fa-book"></i> Green Book Solver</button>
            </div>

            <!-- Content Area -->
            <div id="academyContentArea" style="padding:20px; flex:1; overflow-y:auto; background:#040711;">
              <!-- Dynamic Content Populated Here -->
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#academyCloseBtn').onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

        modal.querySelectorAll('.academy-tab-btn').forEach(btn => {
          btn.onclick = () => {
            modal.querySelectorAll('.academy-tab-btn').forEach(b => {
              b.style.borderBottomColor = 'transparent';
              b.style.color = '#94a3b8';
              b.classList.remove('active');
            });
            btn.style.borderBottomColor = '#38bdf8';
            btn.style.color = '#38bdf8';
            btn.classList.add('active');
            this.renderTab(btn.dataset.tab);
          };
        });
      }

      modal.style.display = 'flex';
      this.renderTab('tab_game');
    }

    renderTab(tabName) {
      const container = document.getElementById('academyContentArea');
      if (!container) return;

      if (tabName === 'tab_game') {
        container.innerHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <!-- Quoting Console -->
            <div style="background:#090d16; border:1px solid #1e293b; border-radius:8px; padding:16px;">
              <div style="font-weight:700; font-size:13px; color:#38bdf8; margin-bottom:8px;">Round <span id="gameRoundNum">${this.game.currentRound}</span> of ${this.game.maxRounds}</div>
              <p style="font-size:11px; color:#94a3b8; margin-bottom:12px;">Quote a two-way market (Bid / Ask). Uninformed retail flow trades when spreads are tight, but informed aggressive flow will exploit stale or mispriced quotes.</p>

              <div style="display:flex; gap:12px; margin-bottom:16px;">
                <div style="flex:1;">
                  <label style="display:block; font-size:10px; color:#94a3b8; text-transform:uppercase;">Your Bid</label>
                  <input type="number" id="gameBidInput" step="0.05" value="99.70" style="width:100%; background:#020617; border:1px solid #334155; color:#10b981; font-weight:bold; padding:8px; border-radius:4px; font-size:14px; box-sizing:border-box;">
                </div>
                <div style="flex:1;">
                  <label style="display:block; font-size:10px; color:#94a3b8; text-transform:uppercase;">Your Ask</label>
                  <input type="number" id="gameAskInput" step="0.05" value="100.30" style="width:100%; background:#020617; border:1px solid #334155; color:#ef4444; font-weight:bold; padding:8px; border-radius:4px; font-size:14px; box-sizing:border-box;">
                </div>
              </div>

              <button id="btnSubmitQuote" style="width:100%; padding:10px; background:#0284c7; border:none; color:#fff; font-weight:bold; border-radius:6px; cursor:pointer; font-size:12px;">
                <i class="fa-solid fa-paper-plane"></i> Submit 2-Way Quote
              </button>

              <div style="margin-top:16px; background:#020617; border:1px solid #1e293b; border-radius:6px; padding:12px; font-size:11px; font-family:monospace;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Inventory (q):</span> <strong id="gameInvVal" style="color:#fff;">${this.game.inventory}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Cash:</span> <strong id="gameCashVal" style="color:#fff;">$${this.game.cash.toFixed(2)}</strong></div>
                <div style="display:flex; justify-content:space-between;"><span>Total P&amp;L:</span> <strong id="gamePnlVal" style="color:#10b981;">$0.00</strong></div>
              </div>
            </div>

            <!-- Live Round Tape -->
            <div style="background:#090d16; border:1px solid #1e293b; border-radius:8px; padding:16px; display:flex; flex-direction:column;">
              <div style="font-weight:700; font-size:13px; color:#cbd5e1; margin-bottom:8px;">Order Flow Execution Tape</div>
              <div id="gameTapeLogs" style="flex:1; background:#020617; border:1px solid #1e293b; border-radius:6px; padding:10px; font-family:monospace; font-size:11px; overflow-y:auto; max-height:260px;">
                <div style="color:#64748b;">Awaiting round 1 quotes...</div>
              </div>
            </div>
          </div>
        `;

        const btnSubmit = container.querySelector('#btnSubmitQuote');
        btnSubmit.onclick = () => {
          const bid = parseFloat(container.querySelector('#gameBidInput').value);
          const ask = parseFloat(container.querySelector('#gameAskInput').value);
          const res = this.game.quote(bid, ask);

          if (!res.success) {
            alert(res.reason || 'Invalid quotes');
            return;
          }

          // Update UI
          const tape = container.querySelector('#gameTapeLogs');
          const r = res.roundRecord;
          const line = document.createElement('div');
          line.style.marginBottom = '6px';
          line.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
          line.style.paddingBottom = '4px';

          let actionColor = '#94a3b8';
          if (r.actionTaken.includes('NOISE')) actionColor = '#10b981';
          if (r.actionTaken.includes('TOXIC')) actionColor = '#ef4444';

          line.innerHTML = `
            <div><strong>R${r.round}:</strong> True: <strong>$${r.trueValue}</strong> | Quote: ${r.bid} / ${r.ask}</div>
            <div style="color:${actionColor};">&bull; Action: ${r.actionTaken} ${r.adverseSelection ? '⚠️ ADVERSE SELECTION' : ''}</div>
            <div style="color:#64748b;">PnL: <span style="color:${r.totalPnL >= 0 ? '#10b981' : '#ef4444'}; font-weight:bold;">$${r.totalPnL}</span> (Inv: ${r.inventory})</div>
          `;
          tape.prepend(line);

          container.querySelector('#gameInvVal').textContent = r.inventory;
          container.querySelector('#gameCashVal').textContent = `$${this.game.cash.toFixed(2)}`;
          const pnlEl = container.querySelector('#gamePnlVal');
          pnlEl.textContent = `$${r.totalPnL}`;
          pnlEl.style.color = r.totalPnL >= 0 ? '#10b981' : '#ef4444';

          if (res.gameOver) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Game Complete';
            const s = res.summary;
            tape.insertAdjacentHTML('afterbegin', `
              <div style="background:rgba(56,189,248,0.1); border:1px solid #38bdf8; border-radius:6px; padding:10px; margin-bottom:10px; color:#fff;">
                <strong style="color:#38bdf8;">🏆 GAME OVER: ${s.rank}</strong><br>
                Final PnL: <strong style="color:${s.finalPnL >= 0 ? '#10b981' : '#ef4444'};">$${s.finalPnL}</strong> | Adverse Selection: ${s.adverseRatePct}%
              </div>
            `);
          } else {
            container.querySelector('#gameRoundNum').textContent = this.game.currentRound;
          }
        };
      } else if (tabName === 'tab_drills') {
        this.startNewDrill(container);
      } else if (tabName === 'tab_greenbook') {
        container.innerHTML = `
          <div>
            <div style="font-weight:700; font-size:14px; color:#38bdf8; margin-bottom:12px;">Top Quantitative Green Book Riddles &amp; Stochastic Proofs</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${GREEN_BOOK_QUESTIONS.map(q => `
                <div style="background:#090d16; border:1px solid #1e293b; border-radius:8px; padding:14px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <strong style="color:#fff; font-size:13px;">${q.title}</strong>
                    <span style="font-size:10px; background:#1e293b; color:#38bdf8; padding:2px 8px; border-radius:4px;">${q.category}</span>
                  </div>
                  <div style="font-size:12px; color:#cbd5e1; margin-bottom:8px; line-height:1.4;">${q.question}</div>
                  <button class="btn-reveal-proof" data-id="${q.id}" style="padding:4px 10px; background:#0f172a; border:1px solid #334155; color:#38bdf8; border-radius:4px; font-size:11px; cursor:pointer;">
                    <i class="fa-solid fa-eye"></i> Show Solution &amp; Mathematical Proof
                  </button>
                  <div id="proof_${q.id}" style="display:none; margin-top:10px; background:#020617; border-left:3px solid #10b981; padding:10px; font-size:11px; line-height:1.5;">
                    <strong style="color:#10b981;">Answer:</strong> ${q.answer}<br><br>
                    <strong>Formal Derivation:</strong><br>
                    <div style="color:#94a3b8;">${q.derivation}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        container.querySelectorAll('.btn-reveal-proof').forEach(btn => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            const proofEl = container.querySelector(`#proof_${id}`);
            if (proofEl) {
              const isHidden = proofEl.style.display === 'none';
              proofEl.style.display = isHidden ? 'block' : 'none';
              btn.innerHTML = isHidden ? '<i class="fa-solid fa-eye-slash"></i> Hide Solution' : '<i class="fa-solid fa-eye"></i> Show Solution';
            }
          };
        });
      }
    }

    startNewDrill(container) {
      this.currentDrill = MentalMathDrill.generateQuestion();
      let timeLeft = this.currentDrill.timeLimitSec;

      container.innerHTML = `
        <div style="max-width:520px; margin:0 auto; background:#090d16; border:1px solid #1e293b; border-radius:10px; padding:24px; text-align:center;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <span style="font-size:11px; color:#38bdf8; font-weight:bold; text-transform:uppercase;">${this.currentDrill.type}</span>
            <span style="font-size:11px; color:#94a3b8;">Score: <strong style="color:#10b981;">${this.drillScore}</strong> / ${this.drillTotal}</span>
          </div>

          <div style="font-size:20px; font-weight:800; color:#fff; margin-bottom:20px;">
            ${this.currentDrill.prompt}
          </div>

          <!-- Countdown timer bar -->
          <div style="height:4px; background:#1e293b; border-radius:2px; margin-bottom:20px; overflow:hidden;">
            <div id="drillTimerBar" style="height:100%; width:100%; background:#38bdf8; transition:width 1s linear;"></div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;" id="drillOptionsContainer">
            ${this.currentDrill.options.map(opt => `
              <button class="drill-opt-btn" data-val="${opt}" style="padding:14px; background:#0f172a; border:1px solid #334155; border-radius:6px; color:#fff; font-size:16px; font-weight:bold; cursor:pointer;">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
      `;

      if (this.timerInterval) clearInterval(this.timerInterval);
      const timerBar = container.querySelector('#drillTimerBar');

      this.timerInterval = setInterval(() => {
        timeLeft--;
        if (timerBar) {
          timerBar.style.width = `${(timeLeft / this.currentDrill.timeLimitSec) * 100}%`;
          if (timeLeft <= 3) timerBar.style.background = '#ef4444';
        }
        if (timeLeft <= 0) {
          clearInterval(this.timerInterval);
          this.drillTotal++;
          alert(`Time's up! Correct answer was: ${this.currentDrill.correctAnswer}`);
          this.startNewDrill(container);
        }
      }, 1000);

      container.querySelectorAll('.drill-opt-btn').forEach(btn => {
        btn.onclick = () => {
          clearInterval(this.timerInterval);
          const chosen = parseFloat(btn.dataset.val);
          this.drillTotal++;
          if (Math.abs(chosen - this.currentDrill.correctAnswer) < 1e-4) {
            this.drillScore++;
            btn.style.background = '#10b981';
          } else {
            btn.style.background = '#ef4444';
          }
          setTimeout(() => this.startNewDrill(container), 400);
        };
      });
    }
  }

  const instance = new CareerAcademyController();
  return {
    CareerAcademyController,
    MarketMakingGameEngine,
    MentalMathDrill,
    GREEN_BOOK_QUESTIONS,
    getInstance: () => instance
  };
});
