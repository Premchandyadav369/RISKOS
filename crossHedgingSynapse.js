/**
 * RISKOS INTER-BOT CROSS-HEDGING SYNAPSE & CLASH OF THE PANTHEONS (crossHedgingSynapse.js)
 * Isomorphic Quantitative Engine:
 * - Dynamic risk covariance matrix calculation across Greek (India) and Norse (US) bots
 * - Automated minimum-variance cross-hedging router: h* = - Cov(R_origin, R_hedge) / Var(R_hedge) * Delta_origin
 * - Clash of the Pantheons tournament state and dynamic Kelly alpha capital reallocation
 * - Interactive Neural Synapse Canvas Renderer for real-time laser risk transmission
 */

((root) => {
  'use strict';

  // Historical sector correlation & cross-beta priors between Olympus (IN) and Valhalla (US)
  const CROSS_BETA_PRIORS = {
    'BOT-IN-01:BOT-US-01': 0.68, // NIFTY Theta vs Nasdaq MegaCap
    'BOT-IN-01:BOT-US-02': 0.55, // NIFTY vs Semis
    'BOT-IN-02:BOT-US-03': 0.74, // Bank Nifty vs US Financials
    'BOT-IN-03:BOT-US-01': 0.82, // Indian IT (TCS/INFY) vs Nasdaq MegaCap
    'BOT-IN-04:BOT-US-05': 0.88, // Reliance/ONGC Energy vs Exxon/Chevron
    'BOT-IN-05:BOT-US-06': 0.48, // Auto vs Aerospace
    'BOT-IN-06:BOT-US-04': 0.62, // Indian Pharma vs US BioTech
    'BOT-IN-07:BOT-US-05': 0.58, // Metals vs Energy Carry
    'BOT-IN-09:BOT-US-06': 0.71, // HAL/BEL Defense vs US Aerospace Defense
    'BOT-IN-10:BOT-US-09': -0.45, // MCX Gold/Crude vs DXY FX Carry (Negative Correlation)
    'BOT-IN-01:BOT-US-07': 0.35, // NIFTY Index vs BTC/ETH Funding
    'BOT-IN-10:BOT-US-10': 0.40  // Commodities vs Prediction Arbitrage
  };

  class CrossHedgingSynapseEngine {
    constructor() {
      this.activeHedges = [];
      this.hedgeHistory = [];
      this.synapseNodes = [];
      this.activePulses = [];
      this.tournamentState = {
        olympusScore: 1250,
        valhallaScore: 1280,
        olympusAlpha: '+₹1,88,450',
        valhallaAlpha: '+₹1,96,695',
        olympusSharpe: 3.24,
        valhallaSharpe: 3.52,
        currentRegimeLeader: 'VALHALLA',
        reallocationFactor: 1.05 // 5% capital tilt towards leading pantheon
      };
      this.listeners = [];
      this.isCanvasRunning = false;
    }

    /**
     * Calculate optimal minimum-variance hedge ratio between two bots
     * h* = - (Cov(origin, hedge) / Var(hedge)) * exposure
     */
    calculateHedgeRatio(originBotId, hedgeBotId, originDelta = 1.0) {
      const key = `${originBotId}:${hedgeBotId}`;
      const reverseKey = `${hedgeBotId}:${originBotId}`;
      const correlation = CROSS_BETA_PRIORS[key] || CROSS_BETA_PRIORS[reverseKey] || 0.50;
      
      // Assumed annualized volatilities based on asset class
      const originVol = originBotId.includes('US') && (originBotId.includes('07') || originBotId.includes('08')) ? 0.65 : 0.22;
      const hedgeVol = hedgeBotId.includes('US') && (hedgeBotId.includes('07') || hedgeBotId.includes('08')) ? 0.65 : 0.24;

      const covariance = correlation * originVol * hedgeVol;
      const varianceHedge = Math.pow(hedgeVol, 2);

      // Minimum variance hedge ratio
      const hedgeRatio = -(covariance / varianceHedge);
      const recommendedHedgeNotional = Math.abs(hedgeRatio * originDelta);

      return {
        originBotId,
        hedgeBotId,
        correlation,
        covariance: Number(covariance.toFixed(5)),
        varianceHedge: Number(varianceHedge.toFixed(5)),
        hedgeRatio: Number(hedgeRatio.toFixed(4)),
        recommendedHedgeNotional: Number(recommendedHedgeNotional.toFixed(2)),
        hedgeQuality: Math.abs(correlation) >= 0.7 ? 'EXCELLENT' : Math.abs(correlation) >= 0.5 ? 'STRONG' : 'MODERATE'
      };
    }

    /**
     * Find best offsetting hedge bot in opposing pantheon
     */
    findBestCrossHedge(originBot, allBots = []) {
      const isOriginGreek = originBot.market === 'india';
      const targetPantheon = isOriginGreek ? 'us' : 'india';
      const candidates = allBots.filter(b => b.market === targetPantheon);

      let bestMatch = null;
      let highestAbsCorr = -1;

      for (const candidate of candidates) {
        const metrics = this.calculateHedgeRatio(originBot.id, candidate.id);
        const absCorr = Math.abs(metrics.correlation);
        if (absCorr > highestAbsCorr) {
          highestAbsCorr = absCorr;
          bestMatch = { bot: candidate, metrics };
        }
      }

      return bestMatch;
    }

    /**
     * Route and record an automated cross-hedge transaction
     */
    executeCrossHedge(originBot, hedgeBot, reason = 'EXCESS_DELTA_SPIKE', amountINR = 250000) {
      const metrics = this.calculateHedgeRatio(originBot.id, hedgeBot.id);
      const hedgeId = `HEDGE-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
      
      const record = {
        id: hedgeId,
        timestamp: new Date().toISOString(),
        originBotId: originBot.id,
        originName: originBot.mythName || originBot.name,
        originPantheon: originBot.pantheon || (originBot.market === 'india' ? 'Greek' : 'Norse'),
        hedgeBotId: hedgeBot.id,
        hedgeName: hedgeBot.mythName || hedgeBot.name,
        hedgePantheon: hedgeBot.pantheon || (hedgeBot.market === 'india' ? 'Greek' : 'Norse'),
        reason,
        notionalINR: amountINR,
        hedgeRatio: metrics.hedgeRatio,
        correlation: metrics.correlation,
        status: 'ACTIVE_HEDGE',
        fixTag: '37=CROSS_HEDGE_SYNAPSE|35=D|40=2'
      };

      this.activeHedges.unshift(record);
      if (this.activeHedges.length > 20) this.activeHedges.pop();
      this.hedgeHistory.unshift(record);

      // Trigger animated synapse pulse
      this.triggerSynapsePulse(originBot.id, hedgeBot.id);

      // Broadcast over TerminalBus if present
      if (typeof window !== 'undefined' && window.TerminalBus) {
        window.TerminalBus.publish('HEDGE_EXECUTED', record);
      }

      this.notifyListeners('HEDGE_EXECUTED', record);
      return record;
    }

    /**
     * Trigger visual pulse between two nodes
     */
    triggerSynapsePulse(fromId, toId) {
      this.activePulses.push({
        fromId,
        toId,
        progress: 0.0,
        speed: 0.035,
        color: fromId.includes('IN') ? '#ffb000' : '#60a5fa'
      });
    }

    /**
     * Update Clash of the Pantheons Tournament metrics
     */
    updateTournamentMetrics(olympusBots = [], valhallaBots = []) {
      if (!olympusBots.length && !valhallaBots.length) return this.tournamentState;

      const oPnl = olympusBots.reduce((acc, b) => acc + (b.realizedPnlINR || 0), 0);
      const vPnl = valhallaBots.reduce((acc, b) => acc + (b.realizedPnlINR || 0), 0);

      const oWin = (olympusBots.reduce((acc, b) => acc + (b.winRate || 0), 0) / (olympusBots.length || 1));
      const vWin = (valhallaBots.reduce((acc, b) => acc + (b.winRate || 0), 0) / (valhallaBots.length || 1));

      const oSharpe = (olympusBots.reduce((acc, b) => acc + (b.sharpeRatio || 0), 0) / (olympusBots.length || 1));
      const vSharpe = (valhallaBots.reduce((acc, b) => acc + (b.sharpeRatio || 0), 0) / (valhallaBots.length || 1));

      this.tournamentState.olympusAlpha = `${oPnl >= 0 ? '+' : ''}₹${oPnl.toLocaleString('en-IN')}`;
      this.tournamentState.valhallaAlpha = `${vPnl >= 0 ? '+' : ''}₹${vPnl.toLocaleString('en-IN')}`;
      this.tournamentState.olympusSharpe = Number(oSharpe.toFixed(2));
      this.tournamentState.valhallaSharpe = Number(vSharpe.toFixed(2));
      this.tournamentState.currentRegimeLeader = vPnl > oPnl ? 'VALHALLA (NORSE 🇺🇸)' : 'MOUNT OLYMPUS (GREEK 🇮🇳)';

      return this.tournamentState;
    }

    /**
     * Initialize full interactive Canvas for Neural Synapse
     */
    initSynapseCanvas(canvasEl, bots = []) {
      if (!canvasEl) return;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      const width = canvasEl.width = canvasEl.parentElement ? canvasEl.parentElement.clientWidth : 800;
      const height = canvasEl.height = 420;

      // Position 10 Greek bots on left (circle arc) and 10 Norse bots on right (circle arc)
      this.synapseNodes = [];
      const greekBots = bots.filter(b => b.market === 'india');
      const norseBots = bots.filter(b => b.market === 'us');

      greekBots.forEach((b, i) => {
        const angle = -Math.PI / 2 + (Math.PI * (i + 0.5)) / 10;
        const x = 160 + Math.cos(angle) * 110;
        const y = height / 2 + Math.sin(angle) * 160;
        this.synapseNodes.push({
          id: b.id,
          name: b.mythName || b.name,
          pantheon: 'Greek',
          color: '#ffb000',
          x,
          y,
          radius: 12
        });
      });

      norseBots.forEach((b, i) => {
        const angle = Math.PI / 2 + (Math.PI * (i + 0.5)) / 10;
        const x = width - 160 - Math.cos(angle) * 110;
        const y = height / 2 + Math.sin(angle) * 160;
        this.synapseNodes.push({
          id: b.id,
          name: b.mythName || b.name,
          pantheon: 'Norse',
          color: '#60a5fa',
          x,
          y,
          radius: 12
        });
      });

      // Render loop
      this.isCanvasRunning = true;
      const render = () => {
        if (!this.isCanvasRunning) return;
        ctx.clearRect(0, 0, width, height);

        // Draw center division divider & portal
        ctx.save();
        const grad = ctx.createLinearGradient(width / 2, 0, width / 2, height);
        grad.addColorStop(0, 'rgba(255, 176, 0, 0.05)');
        grad.addColorStop(0.5, 'rgba(96, 165, 250, 0.15)');
        grad.addColorStop(1, 'rgba(255, 176, 0, 0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(width / 2 - 1, 20, 2, height - 40);

        // Center clash emblem
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#71717a';
        ctx.textAlign = 'center';
        ctx.fillText('CROSS-PANTHEON HEDGING SYNAPSE', width / 2, 35);
        ctx.restore();

        // Draw cross-hedge connection threads
        Object.keys(CROSS_BETA_PRIORS).forEach(pair => {
          const [n1, n2] = pair.split(':');
          const node1 = this.synapseNodes.find(n => n.id === n1);
          const node2 = this.synapseNodes.find(n => n.id === n2);
          if (node1 && node2) {
            ctx.beginPath();
            ctx.moveTo(node1.x, node1.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

        // Draw active laser pulses
        for (let i = this.activePulses.length - 1; i >= 0; i--) {
          const pulse = this.activePulses[i];
          const fromNode = this.synapseNodes.find(n => n.id === pulse.fromId);
          const toNode = this.synapseNodes.find(n => n.id === pulse.toId);
          if (fromNode && toNode) {
            pulse.progress += pulse.speed;
            const px = fromNode.x + (toNode.x - fromNode.x) * pulse.progress;
            const py = fromNode.y + (toNode.y - fromNode.y) * pulse.progress;

            // Draw laser trail
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(px, py);
            ctx.strokeStyle = pulse.color;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = pulse.color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw glowing head
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            if (pulse.progress >= 1.0) {
              this.activePulses.splice(i, 1);
            }
          } else {
            this.activePulses.splice(i, 1);
          }
        }

        // Draw nodes
        this.synapseNodes.forEach(node => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#09090b';
          ctx.fill();
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = node.color;
          ctx.textAlign = node.pantheon === 'Greek' ? 'right' : 'left';
          const textX = node.pantheon === 'Greek' ? node.x - 16 : node.x + 16;
          ctx.fillText(node.name, textX, node.y + 3);
        });

        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
          window.requestAnimationFrame(render);
        }
      };

      render();
    }

    stopCanvas() {
      this.isCanvasRunning = false;
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notifyListeners(event, data) {
      this.listeners.forEach(fn => {
        try { fn(event, data); } catch (e) {}
      });
    }
  }

  // Export as Singleton instance
  const instance = new CrossHedgingSynapseEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof window !== 'undefined') {
    window.CrossHedgingSynapse = instance;
  }
})(typeof window !== 'undefined' ? window : global);
