/**
 * Intelligence For Modern Finance — Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── 1. Mobile Menu ──────────────────────────────────────────────────────
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const body = document.body;

  const isMenuOpen = () => body.classList.contains('menu-open');

  const openMenu = () => {
    body.classList.add('menu-open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.removeAttribute('hidden');
    mobileOverlay.removeAttribute('hidden');
  };

  const closeMenu = () => {
    body.classList.remove('menu-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('hidden', '');
    mobileOverlay.setAttribute('hidden', '');
  };

  if (burgerBtn && mobileMenu && mobileOverlay) {
    burgerBtn.addEventListener('click', () => {
      isMenuOpen() ? closeMenu() : openMenu();
    });

    mobileOverlay.addEventListener('click', closeMenu);

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.querySelectorAll('.mobile-link').forEach(l => l.classList.remove('active'));
        if (link.classList.contains('mobile-link')) link.classList.add('active');
        closeMenu();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen()) closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && isMenuOpen()) closeMenu();
    });
  }

  // ── 2. Desktop Nav Active State ─────────────────────────────────────────
  const desktopNavLinks = document.querySelectorAll('.nav-pill .nav-link');
  desktopNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      desktopNavLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // ── 3. Sticky Header Background on Scroll ──────────────────────────────
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── 4. Active Nav Highlight on Scroll ───────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const allNavLinks = document.querySelectorAll('.nav-link, .mobile-link');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + 120;
    let currentId = '';

    sections.forEach((section) => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.getAttribute('id');
      }
    });

    allNavLinks.forEach((link) => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href.substring(1) === currentId) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ── 5. Count-Up Animation ──────────────────────────────────────────────
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCountUp = (element, target, decimals, duration, delay) => {
    setTimeout(() => {
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const value = eased * target;

        element.textContent = decimals > 0
          ? value.toFixed(decimals)
          : Math.round(value).toString();

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = decimals > 0
            ? target.toFixed(decimals)
            : target.toString();
        }
      };

      requestAnimationFrame(update);
    }, delay);
  };

  const statCards = document.querySelectorAll('.stat-card');
  let statsAnimated = false;

  if ('IntersectionObserver' in window) {
    const statsObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          statCards.forEach((card, i) => {
            const target = parseFloat(card.dataset.target || '0');
            const decimals = parseInt(card.dataset.decimals || '0', 10);
            const el = card.querySelector('.stat-value');
            if (el) animateCountUp(el, target, decimals, 1500 + i * 80, 480 + i * 90);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.25 });

    const statsFooter = document.querySelector('.stats-footer');
    if (statsFooter) statsObs.observe(statsFooter);
  }

  // ── 6. Scroll-Triggered Fade-Up ────────────────────────────────────────
  const fadeElements = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach((el) => fadeObs.observe(el));
  } else {
    fadeElements.forEach((el) => el.classList.add('visible'));
  }
});
