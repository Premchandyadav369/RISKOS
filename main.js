/**
 * RISKOS — Institutional Financial Intelligence & Observatory Controller
 * Modular Quantitative State Machine & Visual Artifact Engine
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Global Utilities & Accessibility Check ────────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const triggerMathJax = (elements) => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      const target = elements || document.body;
      window.MathJax.typesetPromise(Array.isArray(target) ? target : [target]).catch((err) => {
        console.warn('MathJax typesetting notice:', err);
      });
    }
  };

  // Run initial typeset check
  if (window.MathJax) {
    triggerMathJax();
  } else {
    window.addEventListener('load', () => triggerMathJax());
  }

  // ── 2. Landing Page Mobile Menu Overlay ──────────────────────────────────
  const burger = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuSheet = document.getElementById('menuSheet');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  const body = document.body;

  let isMobileMenuOpen = false;

  const openMobileMenu = () => {
    if (isMobileMenuOpen) return;
    isMobileMenuOpen = true;
    body.classList.add('menu-open');
    mobileMenu.removeAttribute('hidden');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.classList.add('is-open');

    void mobileMenu.offsetWidth;
    mobileMenu.classList.add('is-open');

    if (menuSheet) {
      const first = menuSheet.querySelector('button, [href]');
      if (first) first.focus();
    }
  };

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen) return;
    isMobileMenuOpen = false;
    mobileMenu.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');

    setTimeout(() => {
      if (!isMobileMenuOpen) {
        mobileMenu.setAttribute('hidden', '');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    }, 280);

    if (burger) burger.focus();
  };

  if (burger && mobileMenu) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      isMobileMenuOpen ? closeMobileMenu() : openMobileMenu();
    });
    if (menuBackdrop) menuBackdrop.addEventListener('click', closeMobileMenu);
    if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMobileMenu);
    mobileMenu.querySelectorAll('a').forEach((l) => l.addEventListener('click', closeMobileMenu));
  }

  // ── 3. Landing Page Magnetic CTA Micro-Interaction ────────────────────────
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn && !prefersReducedMotion) {
    let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0, isHover = false, animId = null;
    const maxDist = 6;

    const tickMagnetic = () => {
      if (!isHover) {
        currentX += (0 - currentX) * 0.15;
        currentY += (0 - currentY) * 0.15;
        if (Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05) {
          currentX = 0; currentY = 0;
          ctaBtn.style.transform = '';
          cancelAnimationFrame(animId);
          animId = null;
          return;
        }
      } else {
        currentX += (mouseX - currentX) * 0.2;
        currentY += (mouseY - currentY) * 0.2;
      }
      ctaBtn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${isHover ? 1.02 : 1})`;
      animId = requestAnimationFrame(tickMagnetic);
    };

    ctaBtn.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 720) return;
      isHover = true;
      if (!animId) animId = requestAnimationFrame(tickMagnetic);
    });

    ctaBtn.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 720) return;
      const rect = ctaBtn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      mouseX = Math.max(-maxDist, Math.min(maxDist, relX * 0.25));
      mouseY = Math.max(-maxDist, Math.min(maxDist, relY * 0.25));
      if (!animId) animId = requestAnimationFrame(tickMagnetic);
    });

    ctaBtn.addEventListener('mouseleave', () => {
      isHover = false;
      mouseX = 0; mouseY = 0;
    });
  }

  // ── 4. Landing Page Financial Metrics Count-Up ────────────────────────────
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const animateCount = (el, target, decimals, duration, delay) => {
    if (prefersReducedMotion) {
      el.textContent = decimals > 0 ? target.toFixed(decimals) : Math.round(target).toString();
      return;
    }
    setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const v = easeOutCubic(p) * target;
        el.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  let countDone = false;
  const metricsFooter = document.getElementById('metricsFooter');
  const runCountUp = () => {
    if (countDone) return;
    countDone = true;
    document.querySelectorAll('.metric-item').forEach((item, i) => {
      const target = parseFloat(item.dataset.target || '0');
      const dec = parseInt(item.dataset.decimals || '0', 10);
      const valEl = item.querySelector('.metric-value');
      if (valEl) animateCount(valEl, target, dec, 1400 + i * 100, 300 + i * 80);
    });
  };

  if ('IntersectionObserver' in window && metricsFooter) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCountUp();
          o.disconnect();
        }
      });
    }, { threshold: 0.2 });
    obs.observe(metricsFooter);
  } else {
    runCountUp();
  }

  // ── 5. Status Clock ───────────────────────────────────────────────────────
  const statusClock = document.getElementById('statusClock');
  if (statusClock) {
    const updateTime = () => {
      if (document.hidden) return;
      const now = new Date();
      statusClock.textContent = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ FINANCIAL INTELLIGENCE OBSERVATORY ENGINE (MODULAR QUANT SYSTEM)
  // ═══════════════════════════════════════════════════════════════════════════

  // Global Observatory State
  const state = {
    timeframe: '1Y',
    capital: 100000,
    horizon: 3,
    riskProfile: 'moderate',
    scenario: 'base',
    weights: {
      eq: 52,
      bnd: 28,
      csh: 10,
      cmd: 10
    },
    // Macro Asset Expected Base Returns & Volatilities
    assets: {
      eq:  { name: 'Equities',     baseReturn: 0.135, baseVol: 0.165 },
      bnd: { name: 'Fixed Income', baseReturn: 0.052, baseVol: 0.058 },
      csh: { name: 'Cash/Liquid',  baseReturn: 0.040, baseVol: 0.005 },
      cmd: { name: 'Commodities',  baseReturn: 0.085, baseVol: 0.142 }
    },
    // Scenario Modifiers
    scenarios: {
      base:       { name: 'Base Case',        returnMult: 1.0,  volMult: 1.0,  ddMult: 1.0,  eqAlpha: 0.0,   bndAlpha: 0.0 },
      bull:       { name: 'Bull Market',      returnMult: 1.45, volMult: 0.85, ddMult: 0.6,  eqAlpha: 0.06,  bndAlpha: -0.01 },
      bear:       { name: 'Bear Market',      returnMult: -0.8, volMult: 1.75, ddMult: 2.2,  eqAlpha: -0.15, bndAlpha: 0.04 },
      highvol:    { name: 'High Volatility',  returnMult: 0.6,  volMult: 2.2,  ddMult: 1.8,  eqAlpha: -0.04, bndAlpha: -0.02 },
      rate_shock: { name: 'Rate Shock (+300bps)', returnMult: 0.4, volMult: 1.35, ddMult: 1.5, eqAlpha: -0.03, bndAlpha: -0.08 },
      inflation:  { name: 'Inflation Shock',  returnMult: 0.85, volMult: 1.4,  ddMult: 1.3,  eqAlpha: 0.01,  bndAlpha: -0.05 }
    }
  };

  // ── 5.1. Observatory Open / Close Controller ─────────────────────────────
  const obsOverlay = document.getElementById('observatoryOverlay');
  const obsWorkspace = document.getElementById('observatoryWorkspace');
  const obsCloseBtn = document.getElementById('obsCloseBtn');
  const obsBackdrop = document.getElementById('observatoryBackdrop');
  let isObsOpen = false;

  const openObservatory = () => {
    if (isObsOpen) return;
    isObsOpen = true;
    closeMobileMenu();
    body.classList.add('obs-open');
    obsOverlay.removeAttribute('hidden');
    obsOverlay.setAttribute('aria-hidden', 'false');

    void obsOverlay.offsetWidth;
    obsOverlay.classList.add('is-open');

    // Trigger components resize and render
    setTimeout(() => {
      timeSeriesChart.resize();
      timeSeriesChart.render();
      portfolioEngine.update();
      triggerMathJax(obsWorkspace);
    }, 50);

    if (obsCloseBtn) obsCloseBtn.focus();
  };

  const closeObservatory = () => {
    if (!isObsOpen) return;
    isObsOpen = false;
    obsOverlay.classList.remove('is-open');
    body.classList.remove('obs-open');

    setTimeout(() => {
      if (!isObsOpen) {
        obsOverlay.setAttribute('hidden', '');
        obsOverlay.setAttribute('aria-hidden', 'true');
      }
    }, 300);

    if (ctaBtn) ctaBtn.focus();
  };

  // Bind Open Buttons
  [
    document.getElementById('ctaBtn'),
    document.getElementById('headerExploreBtn'),
    document.getElementById('navOpenObs'),
    document.getElementById('mobileOpenObs'),
    document.getElementById('mobileCtaLaunchObs')
  ].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openObservatory();
      });
    }
  });

  if (obsCloseBtn) obsCloseBtn.addEventListener('click', closeObservatory);
  if (obsBackdrop) obsBackdrop.addEventListener('click', closeObservatory);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isObsOpen) closeObservatory();
      else if (isMobileMenuOpen) closeMobileMenu();
    }
  });

  // ── 5.2. Explain Decision Drawer Controller ──────────────────────────────
  const explainDrawer = document.getElementById('explainDrawer');
  const btnExplain = document.getElementById('btnExplainPortfolio');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  if (btnExplain && explainDrawer) {
    btnExplain.addEventListener('click', () => {
      const isHidden = explainDrawer.hasAttribute('hidden');
      if (isHidden) {
        explainDrawer.removeAttribute('hidden');
        triggerMathJax(explainDrawer);
      } else {
        explainDrawer.setAttribute('hidden', '');
      }
    });
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', () => {
        explainDrawer.setAttribute('hidden', '');
      });
    }
  }

  // ── 5.3. Time-Series Canvas Chart Engine ─────────────────────────────────
  const createTimeSeries = () => {
    const canvas = document.getElementById('timeSeriesCanvas');
    const container = document.getElementById('chartCanvasContainer');
    const tooltip = document.getElementById('chartTooltip');
    const ttDate = document.getElementById('ttDate');
    const ttValue = document.getElementById('ttValue');
    const ttReturn = document.getElementById('ttReturn');
    const ttVol = document.getElementById('ttVol');
    const ttDd = document.getElementById('ttDd');

    if (!canvas || !container) return { resize: () => {}, render: () => {} };

    const ctx = canvas.getContext('2d');
    let width = 700;
    let height = 200;
    let currentSeries = [];
    let hoveredIdx = -1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', () => {
      if (isObsOpen) {
        resize();
        render();
      }
    }, { passive: true });

    // Generate deterministic time series
    const generateData = () => {
      const tfPoints = { '1M': 30, '3M': 90, '6M': 180, '1Y': 252, '5Y': 600 };
      const n = tfPoints[state.timeframe] || 252;
      const scen = state.scenarios[state.scenario] || state.scenarios.base;

      const wEq = state.weights.eq / 100;
      const wBnd = state.weights.bnd / 100;
      const wCsh = state.weights.csh / 100;
      const wCmd = state.weights.cmd / 100;

      const expAnnReturn = (
        (wEq * (state.assets.eq.baseReturn + scen.eqAlpha)) +
        (wBnd * (state.assets.bnd.baseReturn + scen.bndAlpha)) +
        (wCsh * state.assets.csh.baseReturn) +
        (wCmd * state.assets.cmd.baseReturn)
      ) * scen.returnMult;

      const expAnnVol = Math.sqrt(
        Math.pow(wEq * state.assets.eq.baseVol, 2) +
        Math.pow(wBnd * state.assets.bnd.baseVol, 2) +
        Math.pow(wCmd * state.assets.cmd.baseVol, 2) +
        2 * wEq * wBnd * (-0.15) * state.assets.eq.baseVol * state.assets.bnd.baseVol
      ) * scen.volMult;

      const dailyMu = expAnnReturn / 252;
      const dailySigma = expAnnVol / Math.sqrt(252);

      const points = [];
      let val = 100.0;
      let peak = 100.0;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - n);

      for (let i = 0; i < n; i++) {
        // Deterministic pseudo-random noise
        const seed = Math.sin(i * 0.42 + (state.scenario.length * 2.1)) * 1.8;
        const drift = dailyMu + (dailySigma * seed * 0.7);
        val = Math.max(20, val * (1 + drift));
        peak = Math.max(peak, val);
        const dd = ((val - peak) / peak) * 100;

        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        points.push({
          date: d.toISOString().split('T')[0],
          value: val,
          ret: ((val - 100) / 100) * 100,
          vol: (expAnnVol * 100),
          dd: dd
        });
      }
      currentSeries = points;
    };

    const render = () => {
      generateData();
      if (!ctx || currentSeries.length === 0) return;

      ctx.clearRect(0, 0, width, height);

      const padTop = 20;
      const padBottom = 26;
      const padLeft = 45;
      const padRight = 20;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      const minVal = Math.min(...currentSeries.map((p) => p.value)) * 0.96;
      const maxVal = Math.max(...currentSeries.map((p) => p.value)) * 1.04;

      const getX = (i) => padLeft + (i / (currentSeries.length - 1)) * plotW;
      const getY = (v) => padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

      // 1. Grid Lines & Ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#71717a';
      ctx.font = '9px Inter, sans-serif';

      for (let g = 0; g <= 4; g++) {
        const yVal = minVal + (g / 4) * (maxVal - minVal);
        const yPos = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();
        ctx.fillText(yVal.toFixed(1), 8, yPos + 3);
      }

      // 2. Gradient Area Fill
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      const isPositive = currentSeries[currentSeries.length - 1].value >= 100;
      const strokeColor = isPositive ? '#51CF66' : '#FF6B6B';

      grad.addColorStop(0, isPositive ? 'rgba(81, 207, 102, 0.22)' : 'rgba(255, 107, 107, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(currentSeries[0].value));
      for (let i = 1; i < currentSeries.length; i++) {
        ctx.lineTo(getX(i), getY(currentSeries[i].value));
      }
      ctx.lineTo(getX(currentSeries.length - 1), padTop + plotH);
      ctx.lineTo(getX(0), padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 3. Trajectory Line
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(currentSeries[0].value));
      for (let i = 1; i < currentSeries.length; i++) {
        ctx.lineTo(getX(i), getY(currentSeries[i].value));
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Baseline (100) Reference Line
      if (minVal <= 100 && maxVal >= 100) {
        const basePos = getY(100);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, basePos);
        ctx.lineTo(width - padRight, basePos);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Crosshair Line on Hover
      if (hoveredIdx >= 0 && hoveredIdx < currentSeries.length) {
        const hx = getX(hoveredIdx);
        const hy = getY(currentSeries[hoveredIdx].value);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target Dot
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // Canvas Pointer Events
    container.addEventListener('mousemove', (e) => {
      if (currentSeries.length === 0) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const padLeft = 45;
      const padRight = 20;
      const plotW = width - padLeft - padRight;

      if (mouseX < padLeft || mouseX > width - padRight) {
        tooltip.setAttribute('hidden', '');
        hoveredIdx = -1;
        render();
        return;
      }

      const ratio = Math.max(0, Math.min(1, (mouseX - padLeft) / plotW));
      hoveredIdx = Math.round(ratio * (currentSeries.length - 1));
      const pt = currentSeries[hoveredIdx];

      if (pt && tooltip) {
        tooltip.removeAttribute('hidden');
        ttDate.textContent = pt.date;
        ttValue.textContent = pt.value.toFixed(2);
        ttReturn.textContent = `${pt.ret >= 0 ? '+' : ''}${pt.ret.toFixed(2)}%`;
        ttReturn.style.color = pt.ret >= 0 ? '#51CF66' : '#FF6B6B';
        ttVol.textContent = `${pt.vol.toFixed(1)}%`;
        ttDd.textContent = `${pt.dd.toFixed(1)}%`;
      }
      render();
    });

    container.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.setAttribute('hidden', '');
      hoveredIdx = -1;
      render();
    });

    // Timeframe selector click handlers
    document.querySelectorAll('#timeframeSelector .tf-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#timeframeSelector .tf-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeframe = btn.dataset.tf || '1Y';
        render();
      });
    });

    return { resize, render };
  };

  const timeSeriesChart = createTimeSeries();

  // ── 5.4. Generative Portfolio Simulator & SVG Donut ───────────────────────
  const createPortfolio = () => {
    const rEq = document.getElementById('rangeEquities');
    const rBnd = document.getElementById('rangeBonds');
    const rCsh = document.getElementById('rangeCash');
    const rCmd = document.getElementById('rangeCommodities');

    const lEq = document.getElementById('lblEqWeight');
    const lBnd = document.getElementById('lblBndWeight');
    const lCsh = document.getElementById('lblCshWeight');
    const lCmd = document.getElementById('lblCmdWeight');

    const sliceEq = document.getElementById('sliceEquities');
    const sliceBnd = document.getElementById('sliceBonds');
    const sliceCsh = document.getElementById('sliceCash');
    const sliceCmd = document.getElementById('sliceCommodities');

    const donutAmt = document.getElementById('donutAmountDisplay');

    // Ribbon Metric Elements
    const ribbonReturn = document.getElementById('ribbonReturn');
    const ribbonVol = document.getElementById('ribbonVol');
    const ribbonSharpe = document.getElementById('ribbonSharpe');
    const ribbonDrawdown = document.getElementById('ribbonDrawdown');
    const ribbonRiskScore = document.getElementById('ribbonRiskScore');

    // Equation Elements
    const eqReturn = document.getElementById('eqReturn');
    const eqSharpe = document.getElementById('eqSharpe');

    const circumference = 2 * Math.PI * 56; // 351.86

    const update = () => {
      const wEq = state.weights.eq;
      const wBnd = state.weights.bnd;
      const wCsh = state.weights.csh;
      const wCmd = state.weights.cmd;

      // Update Labels
      if (lEq) lEq.textContent = `${wEq}%`;
      if (lBnd) lBnd.textContent = `${wBnd}%`;
      if (lCsh) lCsh.textContent = `${wCsh}%`;
      if (lCmd) lCmd.textContent = `${wCmd}%`;

      if (rEq) rEq.value = wEq;
      if (rBnd) rBnd.value = wBnd;
      if (rCsh) rCsh.value = wCsh;
      if (rCmd) rCmd.value = wCmd;

      // SVG Donut Strokes
      const lenEq = (wEq / 100) * circumference;
      const lenBnd = (wBnd / 100) * circumference;
      const lenCsh = (wCsh / 100) * circumference;
      const lenCmd = (wCmd / 100) * circumference;

      let offset = 0;
      if (sliceEq) {
        sliceEq.style.strokeDasharray = `${lenEq} ${circumference}`;
        sliceEq.style.strokeDashoffset = `-${offset}`;
      }
      offset += lenEq;

      if (sliceBnd) {
        sliceBnd.style.strokeDasharray = `${lenBnd} ${circumference}`;
        sliceBnd.style.strokeDashoffset = `-${offset}`;
      }
      offset += lenBnd;

      if (sliceCsh) {
        sliceCsh.style.strokeDasharray = `${lenCsh} ${circumference}`;
        sliceCsh.style.strokeDashoffset = `-${offset}`;
      }
      offset += lenCsh;

      if (sliceCmd) {
        sliceCmd.style.strokeDasharray = `${lenCmd} ${circumference}`;
        sliceCmd.style.strokeDashoffset = `-${offset}`;
      }

      // Format Capital Display
      if (donutAmt) {
        donutAmt.textContent = `$${(state.capital / 1000).toFixed(0)}k`;
      }

      // Mathematical Portfolio Calculations
      const scen = state.scenarios[state.scenario] || state.scenarios.base;
      const expR = (
        (wEq / 100 * (state.assets.eq.baseReturn + scen.eqAlpha)) +
        (wBnd / 100 * (state.assets.bnd.baseReturn + scen.bndAlpha)) +
        (wCsh / 100 * state.assets.csh.baseReturn) +
        (wCmd / 100 * state.assets.cmd.baseReturn)
      ) * scen.returnMult;

      const expVol = Math.sqrt(
        Math.pow((wEq / 100) * state.assets.eq.baseVol, 2) +
        Math.pow((wBnd / 100) * state.assets.bnd.baseVol, 2) +
        Math.pow((wCmd / 100) * state.assets.cmd.baseVol, 2) +
        2 * (wEq / 100) * (wBnd / 100) * (-0.15) * state.assets.eq.baseVol * state.assets.bnd.baseVol
      ) * scen.volMult;

      const rf = 0.04;
      const sharpe = expVol > 0.005 ? ((expR - rf) / expVol) : 0;
      const maxDd = (expVol * 0.95 * scen.ddMult);
      const riskScore = Math.min(100, Math.max(10, Math.round((expVol / 0.25) * 100)));

      // Update Ribbon
      if (ribbonReturn) ribbonReturn.textContent = `${expR >= 0 ? '+' : ''}${(expR * 100).toFixed(1)}%`;
      if (ribbonVol) ribbonVol.textContent = `${(expVol * 100).toFixed(1)}%`;
      if (ribbonSharpe) ribbonSharpe.textContent = sharpe.toFixed(2);
      if (ribbonDrawdown) ribbonDrawdown.textContent = `-${(maxDd * 100).toFixed(1)}%`;
      if (ribbonRiskScore) ribbonRiskScore.textContent = `${riskScore}/100`;

      // Update Dynamic Live Equations
      if (eqReturn) {
        eqReturn.innerHTML = `\\[ R_p = \\sum_{i=1}^{n} w_i R_i = (${wEq}\\% \\times ${(state.assets.eq.baseReturn * 100).toFixed(1)}\\%) + (${wBnd}\\% \\times ${(state.assets.bnd.baseReturn * 100).toFixed(1)}\\%) + \\cdots = \\mathbf{${(expR * 100).toFixed(1)}\\%} \\]`;
      }
      if (eqSharpe) {
        eqSharpe.innerHTML = `\\[ S = \\frac{R_p - R_f}{\\sigma_p} = \\frac{${(expR * 100).toFixed(1)}\\% - 4.0\\%}{${(expVol * 100).toFixed(1)}\\%} = \\mathbf{${sharpe.toFixed(2)}} \\]`;
      }
      triggerMathJax([eqReturn, eqSharpe]);

      // Re-render time series
      timeSeriesChart.render();
    };

    // Auto-normalize allocation when a slider moves
    const normalizeSliders = (changedKey, newVal) => {
      state.weights[changedKey] = newVal;
      const otherKeys = ['eq', 'bnd', 'csh', 'cmd'].filter((k) => k !== changedKey);
      const remaining = 100 - newVal;
      const currentOtherSum = otherKeys.reduce((sum, k) => sum + state.weights[k], 0);

      if (currentOtherSum === 0) {
        otherKeys.forEach((k) => { state.weights[k] = Math.round(remaining / otherKeys.length); });
      } else {
        let allocated = 0;
        otherKeys.forEach((k, idx) => {
          if (idx === otherKeys.length - 1) {
            state.weights[k] = Math.max(0, remaining - allocated);
          } else {
            const prop = Math.round((state.weights[k] / currentOtherSum) * remaining);
            state.weights[k] = Math.max(0, prop);
            allocated += prop;
          }
        });
      }
      update();
    };

    if (rEq) rEq.addEventListener('input', (e) => normalizeSliders('eq', parseInt(e.target.value, 10)));
    if (rBnd) rBnd.addEventListener('input', (e) => normalizeSliders('bnd', parseInt(e.target.value, 10)));
    if (rCsh) rCsh.addEventListener('input', (e) => normalizeSliders('csh', parseInt(e.target.value, 10)));
    if (rCmd) rCmd.addEventListener('input', (e) => normalizeSliders('cmd', parseInt(e.target.value, 10)));

    // Meta Dropdowns
    const inCap = document.getElementById('inputCapital');
    const inHor = document.getElementById('inputHorizon');
    const inTol = document.getElementById('inputRiskTol');

    if (inCap) inCap.addEventListener('change', (e) => { state.capital = parseFloat(e.target.value); update(); });
    if (inHor) inHor.addEventListener('change', (e) => { state.horizon = parseFloat(e.target.value); update(); });
    if (inTol) inTol.addEventListener('change', (e) => {
      state.riskProfile = e.target.value;
      if (state.riskProfile === 'conservative') {
        state.weights = { eq: 20, bnd: 55, csh: 20, cmd: 5 };
      } else if (state.riskProfile === 'moderate') {
        state.weights = { eq: 52, bnd: 28, csh: 10, cmd: 10 };
      } else if (state.riskProfile === 'aggressive') {
        state.weights = { eq: 75, bnd: 10, csh: 5, cmd: 10 };
      }
      update();
    });

    return { update };
  };

  const portfolioEngine = createPortfolio();

  // ── 5.5. Scenario Engine Controller ──────────────────────────────────────
  const activeScenarioLabel = document.getElementById('activeScenarioLabel');
  document.querySelectorAll('#scenarioPills .scenario-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#scenarioPills .scenario-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const scKey = pill.dataset.scenario || 'base';
      state.scenario = scKey;

      const scObj = state.scenarios[scKey];
      if (activeScenarioLabel && scObj) {
        activeScenarioLabel.textContent = `MODELLED SCENARIO: ${scObj.name}`;
      }

      portfolioEngine.update();
    });
  });

  // ── 5.6. AI Quantitative Reasoning Pipeline Controller ────────────────────
  const pipelineNodes = document.querySelectorAll('#pipelineFlow .pipeline-node');
  const nodeBadge = document.getElementById('nodeBadge');
  const nodeHeadline = document.getElementById('nodeHeadline');
  const nodeText = document.getElementById('nodeText');

  const nodeData = {
    market: {
      step: '01',
      title: 'MARKET DATA',
      headline: 'Raw Tick Ingestion & Log Returns',
      text: 'Continuous ingestion of multi-asset high-frequency price and quote time-series. Prices are converted to continuous compounding log-returns \\( r_t = \\ln(P_t / P_{t-1}) \\) ensuring additivity and normality properties for downstream estimators.'
    },
    feature: {
      step: '02',
      title: 'FEATURE ENGINE',
      headline: 'Stationarity & Signal Extraction',
      text: 'Calculates rolling exponential moving average variance, order flow imbalance metrics, and Ornstein-Uhlenbeck mean-reversion drift rates \\( \\theta \\) across cross-asset pairs.'
    },
    risk: {
      step: '03',
      title: 'RISK MODEL',
      headline: 'GARCH(1,1) & Ledoit-Wolf Shrinkage',
      text: 'Fits Maximum Likelihood conditional volatility \\( \\sigma_t^2 = \\omega + \\alpha \\epsilon_{t-1}^2 + \\beta \\sigma_{t-1}^2 \\) and applies analytical Ledoit-Wolf covariance shrinkage \\( \\Sigma_{\\text{LW}} = \\delta F + (1-\\delta) S \\) to guarantee well-conditioned invertibility.'
    },
    portfolio: {
      step: '04',
      title: 'PORTFOLIO ENGINE',
      headline: 'CVaR Optimization & Risk Budgeting',
      text: 'Executes non-linear Sequential Least Squares Programming (SLSQP) to minimize 99% Conditional Value-at-Risk subject to institutional weight and leverage bounds: \\( \\min_{w} F_\\alpha(w, \\zeta) \\).'
    },
    scenario: {
      step: '05',
      title: 'SCENARIO ENGINE',
      headline: 'Macroeconomic Shocks & Stress Vectors',
      text: 'Simulates instantaneous covariance collapse, yield curve shifts (+300bps), liquidity contractions, and geopolitical inflation spikes without relying on naive historical repetition.'
    },
    insight: {
      step: '06',
      title: 'FINANCIAL INSIGHT',
      headline: 'Execution Boundary & Actionable Alpha',
      text: 'Synthesizes model risk budgets into actionable execution parameters with Almgren-Chriss optimal trade liquidation trajectories and pre-trade liquidity gates.'
    }
  };

  pipelineNodes.forEach((node) => {
    node.addEventListener('click', () => {
      pipelineNodes.forEach((n) => n.classList.remove('active'));
      node.classList.add('active');
      const key = node.dataset.node || 'market';
      const info = nodeData[key];
      if (info && nodeBadge && nodeHeadline && nodeText) {
        nodeBadge.textContent = `PIPELINE NODE ${info.step}: ${info.title}`;
        nodeHeadline.textContent = info.headline;
        nodeText.innerHTML = info.text;
        triggerMathJax(nodeText);
      }
    });
  });

});
