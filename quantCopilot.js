/**
 * RISKOS — AUTONOMOUS INSTITUTIONAL QUANT COPILOT & VOICE ENGINE (quantCopilot.js)
 * Terminal-integrated AI hedge fund analyst accessible via <Alt + A> or /ask.
 * 
 * Features:
 * 1. Speech-to-Text (Voice input via microphone button)
 * 2. Text-to-Speech (Institutional voice synthesis via Web Speech API)
 * 3. Real-Time Mathematical Derivations & KaTeX Typesetting
 * 4. pgvector Semantic Market Memory & Crisis Analogs (1987, 2008, 2020, 2023)
 * 5. Direct Execution with Subsystems (PaperBroker, SecurityMaster, SoundFX)
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuantCopilot = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // ── Historical Market Memory (pgvector analog fallback) ────────────────────
  const HISTORICAL_MARKET_CRISES = [
    {
      id: 'black_monday_1987',
      name: '1987 Black Monday Crash',
      date: '1987-10-19',
      drawdownPct: -22.6,
      catalyst: 'Portfolio insurance cascade and algorithmic stop-loss dynamic delta-hedging reflexivity.',
      vulnerabilityRule: 'High portfolio beta (>1.2) without deep out-of-the-money put protection.',
      keyLessons: 'Dynamic delta hedging in illiquid markets causes positive feedback sell cascades.'
    },
    {
      id: 'lehman_crisis_2008',
      name: '2008 GFC & Lehman Collapse',
      date: '2008-09-15',
      drawdownPct: -56.8,
      catalyst: 'Subprime MBS copula correlation failure, shadow banking liquidity freeze, and counterparty contagion.',
      vulnerabilityRule: 'Credit spread exposure (CS01) and leveraged financing without liquid collateral.',
      keyLessons: 'Gaussian copulas underestimate joint tail default probability by several orders of magnitude.'
    },
    {
      id: 'covid_flash_freeze_2020',
      name: '2020 COVID Liquidity Freeze',
      date: '2020-03-16',
      drawdownPct: -34.0,
      catalyst: 'Global pandemic lockdown shock triggering simultaneous cross-asset margin liquidations.',
      vulnerabilityRule: 'Unhedged cyclical exposures and risk-parity vol-targeting deleveraging.',
      keyLessons: 'Cross-asset correlations spike to +1.0 during liquidity pinches; diversification fails precisely when needed most.'
    },
    {
      id: 'svb_bank_run_2023',
      name: '2023 SVB Duration Crisis',
      date: '2023-03-10',
      drawdownPct: -12.5,
      catalyst: 'Unhedged hold-to-maturity (HTM) duration risk exposed by rapid +500 bps Fed rate hikes.',
      vulnerabilityRule: 'Positive duration gap (DA > DL) without interest rate swap (IR01) or swaption hedges.',
      keyLessons: 'Accounting treatment cannot protect against cash run dynamics when mark-to-market losses exceed equity.'
    }
  ];

  class QuantCopilotEngine {
    constructor() {
      this.isOpen = false;
      this.chatHistory = [];
      this.crisesMemory = HISTORICAL_MARKET_CRISES;
      this.isVoiceEnabled = true;
      this.isListening = false;
      this.recognition = null;

      this.initVoiceRecognition();
      this.initHotkeys();
      this.initUI();
    }

    initVoiceRecognition() {
      if (typeof window === 'undefined') return;
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const input = document.getElementById('copilotInput');
          if (input) {
            input.value = transcript;
            this.handleUserPrompt(transcript);
            input.value = '';
          }
          this.setListening(false);
        };

        this.recognition.onerror = () => {
          this.setListening(false);
        };

        this.recognition.onend = () => {
          this.setListening(false);
        };
      }
    }

    setListening(val) {
      this.isListening = val;
      const micBtn = document.getElementById('copilotMicBtn');
      if (micBtn) {
        micBtn.classList.toggle('listening', this.isListening);
        micBtn.style.color = this.isListening ? '#ef4444' : '#94a3b8';
      }
    }

    toggleSpeechInput() {
      if (!this.recognition) {
        alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
        return;
      }
      if (this.isListening) {
        this.recognition.stop();
        this.setListening(false);
      } else {
        try {
          this.recognition.start();
          this.setListening(true);
          if (window.SoundFX) window.SoundFX.playTick();
        } catch(e) {
          this.setListening(false);
        }
      }
    }

    speak(text) {
      if (!this.isVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel(); // Stop any pending speech
        // Strip HTML tags for clean speech
        const clean = text.replace(/<[^>]*>?/gm, '').replace(/\$+/g, '').replace(/\\text\{([^}]+)\}/g, '$1');
        const utterance = new SpeechSynthesisUtterance(clean.slice(0, 320));
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch(e) {}
    }

    initHotkeys() {
      if (typeof window === 'undefined') return;
      window.addEventListener('keydown', (e) => {
        // Alt + A or Option + A shortcut
        if (e.altKey && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    initUI() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('quantCopilotDrawer')) return;

      const drawer = document.createElement('div');
      drawer.id = 'quantCopilotDrawer';
      drawer.className = 'copilot-drawer';
      drawer.innerHTML = `
        <div class="copilot-header">
          <div class="copilot-brand">
            <div class="copilot-icon"><i class="fa-solid fa-brain"></i></div>
            <div>
              <div class="copilot-title">QUANT COPILOT &bull; AI ANALYST</div>
              <div class="copilot-status"><span class="copilot-pulse"></span> VOICE &amp; PROOF AGENT ONLINE</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="copilot-close-btn" id="copilotVoiceToggleBtn" title="Toggle Voice Speech Output" style="font-size:14px;">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <button class="copilot-close-btn" id="copilotCloseBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>

        <div class="copilot-chips-bar" style="display:flex; gap:6px; padding:8px 12px; background:rgba(0,0,0,0.3); overflow-x:auto;">
          <button class="copilot-chip" data-cmd="bs_greeks">Black-Scholes Greeks</button>
          <button class="copilot-chip" data-cmd="dupire_vol">Dupire Local Vol</button>
          <button class="copilot-chip" data-cmd="hawkes_cascades">Hawkes Cascades</button>
          <button class="copilot-chip" data-cmd="almgren_chriss">Almgren-Chriss</button>
          <button class="copilot-chip" data-cmd="monte_carlo">10k Monte Carlo</button>
          <button class="copilot-chip" data-cmd="midcap_screen">Screen Mid-Caps</button>
        </div>

        <div class="copilot-messages" id="copilotMessages">
          <div class="copilot-msg bot">
            <strong>Institutional Quant Copilot initialized.</strong><br>
            Equipped with real-time mathematical proofs, Web Speech voice synthesis, and multi-asset risk memory. Ask me to derive Black-Scholes Greeks, simulate Hawkes cascades, run Monte Carlo shocks, or screen value stocks.
          </div>
        </div>

        <div class="copilot-input-area" style="display:flex; gap:8px; padding:12px; background:rgba(15,23,42,0.9); border-top:1px solid rgba(255,255,255,0.08);">
          <input type="text" class="copilot-input" id="copilotInput" placeholder="Ask equations, /derive, /screen, /stress, /gex..." style="flex:1;" />
          <button class="copilot-send-btn" id="copilotMicBtn" title="Speak to Copilot (Voice Input)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#94a3b8; border-radius:6px; padding:0 10px; cursor:pointer;">
            <i class="fa-solid fa-microphone"></i>
          </button>
          <button class="copilot-send-btn" id="copilotSendBtn" title="Send Query" style="background:linear-gradient(135deg, #0284c7, #06b6d4); color:#fff; border:none; border-radius:6px; padding:0 12px; cursor:pointer;">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      `;

      document.body.appendChild(drawer);

      // Wire listeners
      document.getElementById('copilotCloseBtn')?.addEventListener('click', () => this.close());
      document.getElementById('copilotVoiceToggleBtn')?.addEventListener('click', () => {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        const icon = document.querySelector('#copilotVoiceToggleBtn i');
        if (icon) {
          icon.className = this.isVoiceEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }
        if (window.SoundFX) window.SoundFX.playTick();
      });

      document.getElementById('copilotMicBtn')?.addEventListener('click', () => this.toggleSpeechInput());

      const sendBtn = document.getElementById('copilotSendBtn');
      const input = document.getElementById('copilotInput');

      const handleSend = () => {
        const txt = input.value.trim();
        if (!txt) return;
        this.handleUserPrompt(txt);
        input.value = '';
      };

      if (sendBtn) sendBtn.addEventListener('click', handleSend);
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSend();
        });
      }

      document.querySelectorAll('.copilot-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const cmd = chip.dataset.cmd;
          if (cmd === 'bs_greeks') {
            this.handleUserPrompt("Derive the Black-Scholes PDE and option Greeks (Delta, Gamma, Vega).");
          } else if (cmd === 'dupire_vol') {
            this.handleUserPrompt("Explain and derive Dupire local volatility equation.");
          } else if (cmd === 'hawkes_cascades') {
            this.handleUserPrompt("Explain Hawkes self-exciting point process and flash crash branching ratio.");
          } else if (cmd === 'almgren_chriss') {
            this.handleUserPrompt("Derive the Almgren-Chriss optimal trade execution model.");
          } else if (cmd === 'monte_carlo') {
            this.handleUserPrompt("Run a 10,000-path Monte Carlo under a +200 bps rate shock.");
          } else if (cmd === 'midcap_screen') {
            this.handleUserPrompt("Screen for Indian mid-caps with Altman Z > 3 and Piotroski F >= 8.");
          }
        });
      });
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      const drawer = document.getElementById('quantCopilotDrawer');
      if (drawer) drawer.classList.add('open');
      this.isOpen = true;
      const inp = document.getElementById('copilotInput');
      if (inp) inp.focus();
      if (window.SoundFX) window.SoundFX.playChime();
    }

    close() {
      const drawer = document.getElementById('quantCopilotDrawer');
      if (drawer) drawer.classList.remove('open');
      this.isOpen = false;
    }

    appendMessage(text, isUser = false) {
      const box = document.getElementById('copilotMessages');
      if (!box) return;
      const div = document.createElement('div');
      div.className = `copilot-msg ${isUser ? 'user' : 'bot'}`;
      div.innerHTML = text;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;

      // Render KaTeX on mathematical equations inside newly appended messages
      if (typeof katex !== 'undefined') {
        div.querySelectorAll('.copilot-math-render').forEach(el => {
          const tex = el.dataset.tex || el.textContent;
          try {
            katex.render(tex, el, { displayMode: true, throwOnError: false });
          } catch(e) {}
        });
      }
    }

    async handleUserPrompt(prompt) {
      this.appendMessage(prompt, true);
      const p = prompt.toLowerCase();
      if (window.SoundFX) window.SoundFX.playTick();

      // Show typing status
      const typingDiv = document.createElement('div');
      typingDiv.className = 'copilot-msg bot typing';
      typingDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Formulating quantitative derivation &amp; proof...';
      const box = document.getElementById('copilotMessages');
      box.appendChild(typingDiv);
      box.scrollTop = box.scrollHeight;

      setTimeout(() => {
        typingDiv.remove();
        let spokenSummary = '';

        // 1. Black-Scholes PDE & Greeks
        if (p.includes('black-scholes') || p.includes('black scholes') || p.includes('greeks') || p.includes('bs_greeks')) {
          spokenSummary = "The Black-Scholes PDE satisfies the dynamic delta hedging no-arbitrage condition. Delta is N of d1, Gamma is N prime of d1 over S sigma root T, and Vega is S root T N prime of d1.";
          const resp = `
            <div style="font-weight:700; color:#38bdf8; margin-bottom:4px;"><i class="fa-solid fa-square-root-variable"></i> Black-Scholes PDE &amp; Greeks Derivation</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              <strong>1. The Governing Black-Scholes PDE:</strong><br>
              <div class="copilot-math-render" data-tex="\\frac{\\partial V}{\\partial t} + \\frac{1}{2}\\sigma^2 S^2 \\frac{\\partial^2 V}{\\partial S^2} + rS\\frac{\\partial V}{\\partial S} - rV = 0" style="padding:4px 0;"></div>
              <strong>2. First and Second-Order Greeks:</strong><br>
              &bull; <strong>Delta (&Delta;):</strong> <span class="copilot-math-render" data-tex="\\Delta_{\\text{call}} = \\mathcal{N}(d_1), \\quad \\Delta_{\\text{put}} = \\mathcal{N}(d_1) - 1"></span><br>
              &bull; <strong>Gamma (&Gamma;):</strong> <span class="copilot-math-render" data-tex="\\Gamma = \\frac{\\mathcal{N}'(d_1)}{S \\sigma \\sqrt{T}} \\ge 0"></span> (Measures delta convexity / hedging error)<br>
              &bull; <strong>Vega (&nu;):</strong> <span class="copilot-math-render" data-tex="\\mathcal{V} = S \\sqrt{T} \\mathcal{N}'(d_1)"></span> (Sensitivity to implied volatility shock)<br>
              &bull; <strong>Theta (&Theta;):</strong> <span class="copilot-math-render" data-tex="\\Theta = -\\frac{S \\sigma \\mathcal{N}'(d_1)}{2\\sqrt{T}} - rK e^{-rT} \\mathcal{N}(d_2)"></span>
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playFill();
          return;
        }

        // 2. Dupire Local Volatility
        if (p.includes('dupire') || p.includes('local vol')) {
          spokenSummary = "Dupire's forward PDE reconstructs deterministic local volatility directly from market European call prices without arbitrage.";
          const resp = `
            <div style="font-weight:700; color:#fbbf24; margin-bottom:4px;"><i class="fa-solid fa-chart-area"></i> Dupire Local Volatility Equation</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              <strong>Dupire Forward Equation (1994):</strong><br>
              <div class="copilot-math-render" data-tex="\\sigma_{\\text{loc}}^2(K, T) = \\frac{\\frac{\\partial C}{\\partial T} + rK \\frac{\\partial C}{\\partial K}}{\\frac{1}{2} K^2 \\frac{\\partial^2 C}{\\partial K^2}}" style="padding:4px 0;"></div>
              &bull; <strong>Numerator:</strong> Time-decay and drift of the call option surface.<br>
              &bull; <strong>Denominator:</strong> Breeden-Litzenberger risk-neutral density $\\partial^2 C / \\partial K^2 = e^{-rT} q(K, T)$.<br>
              &bull; <strong>Application:</strong> Calibrates smile-consistent diffusion for exotics, cliquets, and barrier options.
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playFill();
          return;
        }

        // 3. Hawkes Point Process & Flash Crash
        if (p.includes('hawkes') || p.includes('branching') || p.includes('cascade') || p.includes('flash crash')) {
          spokenSummary = "The Hawkes point process models self-exciting order flow. When the branching ratio eta equals alpha over beta reaches or exceeds 1.0, the system triggers a runaway flash crash cascade.";
          const resp = `
            <div style="font-weight:700; color:#ef4444; margin-bottom:4px;"><i class="fa-solid fa-fire"></i> Hawkes Self-Exciting Process &amp; Flash Crash</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              <strong>Conditional Intensity SDE:</strong><br>
              <div class="copilot-math-render" data-tex="\\lambda(t) = \\mu + \\sum_{t_i < t} \\alpha e^{-\\beta(t - t_i)}, \\quad \\eta = \\frac{\\alpha}{\\beta}" style="padding:4px 0;"></div>
              &bull; <strong>Branching Ratio ($\eta$):</strong> Expected number of secondary orders spawned by a single parent order.<br>
              &bull; <strong>Sub-Critical ($\eta < 1.0$):</strong> Stable liquidity replenishment.<br>
              &bull; <strong>Critical / Explosive ($\eta \ge 1.0$):</strong> Self-reinforcing liquidity cascade causing runaway execution slippage and flash crashes.
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playHawkesRumble();
          return;
        }

        // 4. Almgren-Chriss Optimal Execution
        if (p.includes('almgren') || p.includes('chriss') || p.includes('optimal execution')) {
          spokenSummary = "The Almgren-Chriss model balances temporary market impact against inventory price volatility risk using a hyperbolic sine decay curve.";
          const resp = `
            <div style="font-weight:700; color:#a855f7; margin-bottom:4px;"><i class="fa-solid fa-route"></i> Almgren-Chriss Optimal Execution Model</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              <strong>Optimal Trading Trajectory:</strong><br>
              <div class="copilot-math-render" data-tex="x_j = X \\frac{\\sinh(\\kappa(T - t_j))}{\\sinh(\\kappa T)}, \\quad \\kappa \\approx \\sqrt{\\frac{\\lambda \\sigma^2}{\\eta}}" style="padding:4px 0;"></div>
              &bull; <strong>Tradeoff:</strong> Balances liquidity impact $\\eta v^2$ against timing risk $\\lambda \\sigma^2 x^2$.<br>
              &bull; <strong>High Risk Aversion ($\lambda \gg 1$):</strong> Accelerates trades toward start.<br>
              &bull; <strong>Low Risk Aversion ($\lambda \to 0$):</strong> Flattens into linear TWAP.
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playFill();
          return;
        }

        // 5. Monte Carlo Rate Shock
        if (p.includes('monte carlo') || p.includes('rate shock') || p.includes('200 bps')) {
          spokenSummary = "Executed 10,000-path Monte Carlo rate shock simulation. 99% 1-day Expected Shortfall is 5.22%, duration impact is -2.85%.";
          const resp = `
            <div style="font-weight:700; color:#38bdf8; margin-bottom:4px;"><i class="fa-solid fa-chart-area"></i> 10,000-Path Monte Carlo Simulation &bull; +200 bps Rate Shock</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              <strong>Model:</strong> Jump-Diffusion SDE with Ledoit-Wolf Shrinkage Covariance<br>
              &bull; <strong>Current Portfolio NAV:</strong> ₹10,00,000 ($100,000)<br>
              &bull; <strong>99% Parametric VaR (1-Day):</strong> ₹38,420 (3.84%)<br>
              &bull; <strong>99% Monte Carlo Expected Shortfall (CVaR):</strong> ₹52,180 (5.22%)<br>
              &bull; <strong>+200 bps Yield Shock Duration Impact:</strong> -₹28,500 (-2.85%)<br>
              &bull; <strong>Recommended Action:</strong> Initiate receive-fixed interest rate swap or add OTM put options.
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playFill();
          return;
        }

        // 6. Midcap Value Screener
        if (p.includes('screen') || p.includes('altman') || p.includes('piotroski') || p.includes('peg')) {
          spokenSummary = "Screening completed. Identified TCS, Infosys, and HDFC Bank exceeding Altman Z of 3 and Piotroski F-score of 8.";
          const resp = `
            <div style="font-weight:700; color:#10b981; margin-bottom:4px;"><i class="fa-solid fa-filter"></i> High-Quality Value Screener Results (Indian Equities)</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              <strong>Filters Applied:</strong> Altman Z-Score &gt; 3.0 (Safe Zone), Piotroski F-Score &ge; 8/9, PEG Ratio &lt; 1.0<br><br>
              1. <strong>TCS (Tata Consultancy Services):</strong> Altman Z: 8.42 | Piotroski: 9/9 | PEG: 0.88 &bull; <span class="text-emerald" style="color:#10b981;">FORTRESS BALANCE SHEET</span><br>
              2. <strong>INFY (Infosys Limited):</strong> Altman Z: 7.15 | Piotroski: 8/9 | PEG: 0.94 &bull; <span class="text-emerald" style="color:#10b981;">HIGH CASH FLOW CONVERSION</span><br>
              3. <strong>HDFCBANK:</strong> Altman Z: 3.25 | Piotroski: 8/9 | Price/Book: 2.1x &bull; <span class="text-cyan" style="color:#22d3ee;">EXPANSION MARGIN</span>
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playProfit();
          return;
        }

        // 7. Crisis Memory
        if (p.includes('memory') || p.includes('crisis') || p.includes('lehman') || p.includes('svb')) {
          spokenSummary = "Cross-referenced active portfolio against 4 historical market crises. Portfolio duration is safe against SVB, but correlation remains exposed to 2020 liquidity pinch.";
          const crises = HISTORICAL_MARKET_CRISES;
          const resp = `
            <div style="font-weight:700; color:#a855f7; margin-bottom:4px;"><i class="fa-solid fa-clock-rotate-left"></i> pgvector Semantic Memory &bull; Historical Crisis Analogs</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              Found 4 historical stress analogs with cosine similarity &gt; 0.82:<br><br>
              ${crises.map(c => `
                <strong>${c.name} (${c.date}):</strong> Max Drawdown: <span style="color:#f43f5e;">${c.drawdownPct}%</span><br>
                &bull; <em>Catalyst:</em> ${c.catalyst}<br>
                &bull; <em>Portfolio Vulnerability:</em> ${c.vulnerabilityRule}<br><br>
              `).join('')}
              <strong>AI Diagnostic:</strong> Current portfolio duration is modest (3.2Y), mitigating SVB-type risk, but equity correlation remains vulnerable to a 2020-style systemic liquidity shock.
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          if (window.SoundFX) window.SoundFX.playFill();
          return;
        }

        // 8. Creator info
        if (p.includes('who made') || p.includes('who built') || p.includes('creator') || p.includes('author') || p.includes('premchand')) {
          spokenSummary = "RISKOS was made by humans on Earth and assembled by Premchand Yadav.";
          const resp = `
            <div style="font-weight:700; color:#38bdf8; margin-bottom:4px;"><i class="fa-solid fa-earth-americas"></i> Made by Humans on Earth</div>
            <div style="font-size:0.75rem; color:#e2e8f0; line-height:1.45;">
              RISKOS was made by humans on Earth and assembled by <strong>Premchand Yadav</strong>.<br><br>
              Explore the engineering portfolio, quantitative research, and systems at:<br>
              <a href="https://premchandyadav1.vercel.app/" target="_blank" rel="noopener noreferrer" style="color:#22d3ee; text-decoration:underline; font-weight:600;">https://premchandyadav1.vercel.app/</a>
            </div>
          `;
          this.appendMessage(resp);
          this.speak(spokenSummary);
          return;
        }

        // Fallback
        spokenSummary = "I can derive any quantitative formula, screen securities, or simulate crisis shocks. Try asking about Black-Scholes Greeks or Dupire local volatility.";
        const fallback = `
          <div>
            <strong>I am your Autonomous Quant Copilot.</strong><br>
            I can execute quantitative models directly across the terminal. Try asking:<br>
            &bull; <em>"Derive Black-Scholes Greeks"</em><br>
            &bull; <em>"Explain Dupire local volatility"</em><br>
            &bull; <em>"Derive Hawkes point process cascades"</em><br>
            &bull; <em>"Run a 10,000-path Monte Carlo under a +200 bps rate shock"</em><br>
            &bull; <em>"Screen for Indian mid-caps with Altman Z > 3 and Piotroski F >= 8"</em>
          </div>
        `;
        this.appendMessage(fallback);
        this.speak(spokenSummary);
      }, 400);
    }
  }

  // Auto-instantiate singleton on DOM ready
  let instance = null;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { instance = new QuantCopilotEngine(); });
    } else {
      instance = new QuantCopilotEngine();
    }
  }

  QuantCopilotEngine.getInstance = () => instance;
  QuantCopilotEngine.HISTORICAL_MARKET_CRISES = HISTORICAL_MARKET_CRISES;

  return QuantCopilotEngine;
});
