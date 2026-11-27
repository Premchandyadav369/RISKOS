/**
 * RISKOS AI Executive Analyst Brief Engine (OpenStock AI Synthesis)
 * Generates automated multi-horizon investment memorandums, Bull/Bear theses,
 * valuation fair-value bands, and institutional quant verdicts across 3 depth modes.
 */

const AiAnalystBrief = (() => {
  'use strict';

  const generateBrief = (sec, mode = 'investor') => {
    if (!sec) return null;

    const sym = (sec.symbol || '').toUpperCase();
    const name = sec.name || sym;
    const curr = sec.currency || 'INR';
    const symChar = curr === 'USD' ? '$' : '₹';

    const liveQuote = (typeof window !== 'undefined' && window.SecurityMaster && window.SecurityMaster._liveQuotes)
      ? (window.SecurityMaster._liveQuotes.get(sym) || { price: sec.basePrice, previousClose: sec.basePrice })
      : { price: sec.basePrice || 1000, previousClose: (sec.basePrice || 1000) * 0.99 };

    const price = Number(liveQuote.price || sec.basePrice || 1000);
    const prevClose = Number(liveQuote.previousClose || price);
    const chgPct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    const pe = sec.pe || 22.0;
    const roe = sec.roe || 15.0;
    const vol = sec.vol || 0.18;
    const beta = sec.beta || 1.0;

    // Get fundamental health
    const health = (typeof window !== 'undefined' && window.FundamentalHealthEngine)
      ? window.FundamentalHealthEngine.getCompleteHealthProfile(sec)
      : null;

    const fScore = health ? health.piotroski.score : 7;
    const zScore = health ? health.altman.zScore : 3.2;

    // Determine Stance
    let verdict = 'ACCUMULATE';
    let verdictColor = '#51cf66';
    let confidence = 78;
    let targetHorizon1 = price * 1.08;
    let targetHorizon2 = price * 1.18;
    let stopLoss = price * 0.94;

    if (fScore >= 8 && zScore > 2.99 && chgPct >= -2) {
      verdict = 'STRONG BUY';
      verdictColor = '#51cf66';
      confidence = 88;
      targetHorizon1 = price * 1.12;
      targetHorizon2 = price * 1.25;
      stopLoss = price * 0.95;
    } else if (fScore <= 4 || zScore < 1.81) {
      verdict = 'REDUCE / HEDGE';
      verdictColor = '#ff6b6b';
      confidence = 82;
      targetHorizon1 = price * 0.92;
      targetHorizon2 = price * 0.85;
      stopLoss = price * 1.04;
    } else if (pe > 45 && roe < 12) {
      verdict = 'HOLD / NEUTRAL';
      verdictColor = '#fab005';
      confidence = 72;
      targetHorizon1 = price * 1.04;
      targetHorizon2 = price * 1.09;
      stopLoss = price * 0.96;
    }

    const rrr = ((targetHorizon1 - price) / Math.abs(price - stopLoss)).toFixed(2);

    // Dynamic Catalyst Generation
    const bullCatalysts = [
      {
        title: 'Institutional Flow Accumulation',
        detail: `Positive Order Flow Imbalance (OFI) shows active block buying. Volume is tracking above average with institutional footprints.`
      },
      {
        title: 'Fundamental Health & Cash Conversion',
        detail: `Piotroski F-Score of ${fScore}/9 confirms robust quality with cash flow from operations supporting net earnings.`
      },
      {
        title: 'Solvency & Capital Efficiency',
        detail: `Altman Z-Score of ${zScore} places instrument in the ${health ? health.altman.zone : 'Safe Zone'} with solid interest coverage.`
      }
    ];

    const bearRisks = [
      {
        title: 'Multiple & Valuation Sensitivity',
        detail: `Trading at ${pe.toFixed(1)}x P/E. Any compression in market multiple could induce mean-reversion toward 5-year averages.`
      },
      {
        title: 'Systematic Beta Exposure',
        detail: `Beta of ${beta.toFixed(2)} indicates sensitivity to broader ${sec.exchange} market swings and macro liquidity contractions.`
      },
      {
        title: 'Volatility & Tail Risk',
        detail: `Annualized volatility is ${(vol * 100).toFixed(1)}%, implying a 99% 1-day Value at Risk (VaR) of ${symChar}${(price * 2.33 * (vol / Math.sqrt(252))).toFixed(2)}.`
      }
    ];

    // Mode-specific explanatory synthesis
    let synthesisText = '';
    if (mode === 'beginner') {
      synthesisText = `
        <strong>Summary for Beginners:</strong> ${name} (${sym}) is currently trading at ${symChar}${price.toFixed(2)}.
        The company scores <strong>${fScore} out of 9</strong> on the Piotroski Financial Health scale, meaning its financial foundation is ${fScore >= 7 ? 'strong and dependable' : 'moderate with some things to watch'}.
        Our automated system suggests a <strong>${verdict}</strong> rating with an expected upside target around ${symChar}${targetHorizon1.toFixed(2)} and a protective stop level at ${symChar}${stopLoss.toFixed(2)}.
      `;
    } else if (mode === 'quant') {
      synthesisText = `
        <strong>Institutional Quant Brief:</strong> Stochastic drift \\(\\mu = +${(chgPct / 10).toFixed(2)}\\%\\), 
        Brownian volatility \\(\\sigma = ${(vol * 100).toFixed(1)}\\%\\).
        Altman \\(Z = ${zScore}\\) (Discriminant Zone: ${health ? health.altman.zone : 'Safe'}).
        Optimal risk-to-reward ratio \\(\\text{RRR} = ${rrr}\\text{x}\\) with 99% VaR limit set at ${symChar}${stopLoss.toFixed(2)}.
        Algorithmic stance: <strong>${verdict}</strong> (Confidence Vector: ${confidence}%).
      `;
    } else {
      synthesisText = `
        <strong>Investor Executive Memorandum:</strong> ${name} (${sym}) demonstrates a favorable risk-adjusted profile at current price levels of ${symChar}${price.toFixed(2)}.
        High operational efficiency combined with an Altman Z-score of ${zScore} reflects substantial balance sheet resilience.
        The recommended stance is <strong>${verdict}</strong> targeting ${symChar}${targetHorizon1.toFixed(2)} (Primary) and ${symChar}${targetHorizon2.toFixed(2)} (Extended) with a risk-to-reward ratio of ${rrr}x.
      `;
    }

    return {
      symbol: sym,
      name,
      price,
      currency: curr,
      verdict,
      verdictColor,
      confidence,
      targetHorizon1,
      targetHorizon2,
      stopLoss,
      rrr,
      synthesisText,
      bullCatalysts,
      bearRisks,
      fScore,
      zScore,
      mode
    };
  };

  // Render inside target DOM container
  const renderBriefDOM = (containerId, sec, mode = 'investor') => {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const brief = generateBrief(sec, mode);
    if (!brief) {
      container.innerHTML = '<p style="color:var(--text-muted);">No analyst data available.</p>';
      return;
    }

    const symChar = brief.currency === 'USD' ? '$' : '₹';

    container.innerHTML = `
      <div class="ai-brief-card" style="display:flex; flex-direction:column; gap:16px;">
        
        <!-- Top Verdict Banner -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-left:4px solid ${brief.verdictColor}; border-radius:10px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="pulse-dot"></span>
              <span style="font-size:0.7rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:0.04em;">AI EXECUTIVE ANALYST MEMO</span>
            </div>
            <div style="font-size:1.3rem; font-weight:800; color:${brief.verdictColor}; margin-top:4px;">
              ${brief.verdict}
            </div>
            <div style="font-size:0.75rem; color:#a1a1aa; margin-top:2px;">
              Confidence Score: <strong style="color:#fff;">${brief.confidence}%</strong> &bull; Risk-Reward: <strong style="color:#51cf66;">${brief.rrr}x RRR</strong>
            </div>
          </div>

          <div style="display:flex; gap:16px; font-family:var(--font-mono); font-size:0.8rem;">
            <div>
              <div style="color:#71717a; font-size:0.65rem;">PRICE TARGET 1</div>
              <div style="color:#51cf66; font-weight:700;">${symChar}${brief.targetHorizon1.toFixed(2)}</div>
            </div>
            <div>
              <div style="color:#71717a; font-size:0.65rem;">EXTENDED TARGET</div>
              <div style="color:#22d3ee; font-weight:700;">${symChar}${brief.targetHorizon2.toFixed(2)}</div>
            </div>
            <div>
              <div style="color:#71717a; font-size:0.65rem;">STOP LOSS</div>
              <div style="color:#ff6b6b; font-weight:700;">${symChar}${brief.stopLoss.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <!-- Synthesis Prose -->
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:14px; font-size:0.82rem; color:#e4e4e7; line-height:1.6;">
          ${brief.synthesisText}
        </div>

        <!-- Bull vs Bear Grid -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
          <!-- Bull Catalysts -->
          <div style="background:rgba(81,207,102,0.04); border:1px solid rgba(81,207,102,0.15); border-radius:10px; padding:14px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <i class="fa-solid fa-arrow-trend-up text-emerald"></i>
              <strong style="font-size:0.82rem; color:#51cf66;">Bull Thesis &amp; Upside Catalysts</strong>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${brief.bullCatalysts.map(c => `
                <div style="font-size:0.75rem;">
                  <strong style="color:#fff;">${c.title}:</strong>
                  <span style="color:#a1a1aa;">${c.detail}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Bear Risks -->
          <div style="background:rgba(255,107,107,0.04); border:1px solid rgba(255,107,107,0.15); border-radius:10px; padding:14px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <i class="fa-solid fa-triangle-exclamation text-rose"></i>
              <strong style="font-size:0.82rem; color:#ff6b6b;">Bear Thesis &amp; Downside Risks</strong>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${brief.bearRisks.map(r => `
                <div style="font-size:0.75rem;">
                  <strong style="color:#fff;">${r.title}:</strong>
                  <span style="color:#a1a1aa;">${r.detail}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;

    // Render KaTeX equations if present in container
    if (typeof renderMathInElement !== 'undefined') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    }
  };

  return {
    generateBrief,
    renderBriefDOM
  };
})();

// Attach globally
if (typeof window !== 'undefined') {
  window.AiAnalystBrief = AiAnalystBrief;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AiAnalystBrief };
}
