/**
 * RISKOS — Institutional Financial Intelligence Platform
 * Main Client-Side Controller & State Machine
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Accessibility & Reduced Motion Check ──────────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 2. MathJax Dynamic Typesetting Safety ────────────────────────────────
  const triggerMathJax = () => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise().catch((err) => {
        console.warn('MathJax typesetting notice:', err);
      });
    }
  };

  // Run initial typeset check
  if (window.MathJax) {
    triggerMathJax();
  } else {
    window.addEventListener('load', triggerMathJax);
  }

  // ── 3. Mobile Menu Overlay & Burger State Machine ────────────────────────
  const burger = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const sheet = document.getElementById('menuSheet');
  const backdrop = document.getElementById('menuBackdrop');
  const closeBtn = document.getElementById('menuCloseBtn');
  const body = document.body;

  let isMenuOpen = false;

  const openMenu = () => {
    if (isMenuOpen) return;
    isMenuOpen = true;

    body.classList.add('menu-open');
    menu.removeAttribute('hidden');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.classList.add('is-open');

    // Force reflow for CSS animation
    void menu.offsetWidth;
    menu.classList.add('is-open');

    // Focus management: move focus inside modal sheet
    if (sheet) {
      const firstFocusable = sheet.querySelector('button, [href], input, select, textarea');
      if (firstFocusable) firstFocusable.focus();
    }
  };

  const closeMenu = () => {
    if (!isMenuOpen) return;
    isMenuOpen = false;

    menu.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');

    // Wait for transition before hiding
    setTimeout(() => {
      if (!isMenuOpen) {
        menu.setAttribute('hidden', '');
        menu.setAttribute('aria-hidden', 'true');
      }
    }, 280);

    // Return focus to toggle button
    if (burger) burger.focus();
  };

  if (burger && menu) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      isMenuOpen ? closeMenu() : openMenu();
    });

    if (backdrop) backdrop.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Close when clicking any nav link inside mobile sheet
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    });

    // Auto-close if resized to desktop viewport
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && isMenuOpen) {
        closeMenu();
      }
    }, { passive: true });
  }

  // ── 4. Desktop CTA Button Magnetic Micro-Interaction ──────────────────────
  const ctaBtn = document.getElementById('ctaBtn');

  if (ctaBtn && !prefersReducedMotion) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovering = false;
    let animationFrameId = null;

    const maxDistance = 6; // Strict +/- 6px constraint

    const updateMagnetic = () => {
      if (!isHovering) {
        // Spring back to center
        currentX += (0 - currentX) * 0.15;
        currentY += (0 - currentY) * 0.15;

        if (Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05) {
          currentX = 0;
          currentY = 0;
          ctaBtn.style.transform = '';
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
          return;
        }
      } else {
        // Follow pointer with smooth interpolation
        currentX += (mouseX - currentX) * 0.2;
        currentY += (mouseY - currentY) * 0.2;
      }

      ctaBtn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${isHovering ? 1.02 : 1})`;
      animationFrameId = requestAnimationFrame(updateMagnetic);
    };

    ctaBtn.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 720) return;
      isHovering = true;
      if (!animationFrameId) animationFrameId = requestAnimationFrame(updateMagnetic);
    });

    ctaBtn.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 720) return;
      const rect = ctaBtn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);

      // Clamp movement within maxDistance
      mouseX = Math.max(-maxDistance, Math.min(maxDistance, relX * 0.25));
      mouseY = Math.max(-maxDistance, Math.min(maxDistance, relY * 0.25));

      if (!animationFrameId) animationFrameId = requestAnimationFrame(updateMagnetic);
    });

    ctaBtn.addEventListener('mouseleave', () => {
      isHovering = false;
      mouseX = 0;
      mouseY = 0;
    });
  }

  // ── 5. Financial Metrics Count-Up Animation ────────────────────────────────
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCount = (element, targetValue, decimals, duration, startDelay) => {
    if (prefersReducedMotion) {
      element.textContent = decimals > 0 ? targetValue.toFixed(decimals) : Math.round(targetValue).toString();
      return;
    }

    setTimeout(() => {
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const currentVal = easeOutCubic(progress) * targetValue;
        element.textContent = decimals > 0 ? currentVal.toFixed(decimals) : Math.round(currentVal).toString();

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          element.textContent = decimals > 0 ? targetValue.toFixed(decimals) : targetValue.toString();
        }
      };
      requestAnimationFrame(tick);
    }, startDelay);
  };

  const metricItems = document.querySelectorAll('.metric-item');
  let metricsAnimated = false;

  const runMetricsCountUp = () => {
    if (metricsAnimated) return;
    metricsAnimated = true;

    metricItems.forEach((item, index) => {
      const target = parseFloat(item.dataset.target || '0');
      const decimals = parseInt(item.dataset.decimals || '0', 10);
      const valueEl = item.querySelector('.metric-value');

      if (valueEl) {
        animateCount(valueEl, target, decimals, 1400 + index * 100, 300 + index * 80);
      }
    });
  };

  // Trigger metrics count-up once page is ready
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runMetricsCountUp();
          obs.disconnect();
        }
      });
    }, { threshold: 0.2 });

    const footer = document.getElementById('metricsFooter');
    if (footer) observer.observe(footer);
    else runMetricsCountUp();
  } else {
    runMetricsCountUp();
  }

  // ── 6. Live Financial Clock / Pulse Indicator ──────────────────────────────
  const statusClock = document.getElementById('statusClock');
  if (statusClock) {
    const updateClock = () => {
      if (document.hidden) return; // Pause execution when tab inactive
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      statusClock.textContent = `${hours}:${minutes}:${seconds} UTC`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

});
