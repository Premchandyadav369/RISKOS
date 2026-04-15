/**
 * Intelligence For Modern Finance — Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Elements
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
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileOverlay.addEventListener('click', closeMenu);

    // Close on navigation link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        // Update active class
        mobileMenu.querySelectorAll('.mobile-link').forEach(l => l.classList.remove('active'));
        if (link.classList.contains('mobile-link')) {
          link.classList.add('active');
        }
        closeMenu();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen()) {
        closeMenu();
      }
    });

    // Auto-close on viewport resize > 720px
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && isMenuOpen()) {
        closeMenu();
      }
    });
  }

  // 2. Desktop Navigation Active State
  const desktopNavLinks = document.querySelectorAll('.nav-pill .nav-link');
  desktopNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      desktopNavLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // 3. Count-Up Animation for Finance Metrics
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCountUp = (element, target, decimals, duration, delay) => {
    setTimeout(() => {
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentValue = easedProgress * target;

        if (decimals > 0) {
          element.textContent = currentValue.toFixed(decimals);
        } else {
          element.textContent = Math.round(currentValue).toString();
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
        }
      };

      requestAnimationFrame(updateCounter);
    }, delay);
  };

  const statCards = document.querySelectorAll('.stat-card');
  let hasAnimatedStats = false;

  if ('IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimatedStats) {
          hasAnimatedStats = true;
          statCards.forEach((card, index) => {
            const target = parseFloat(card.getAttribute('data-target') || '0');
            const decimals = parseInt(card.getAttribute('data-decimals') || '0', 10);
            const valueElement = card.querySelector('.stat-value');

            if (valueElement) {
              const duration = 1500 + index * 80;
              const delay = 480 + index * 90;
              animateCountUp(valueElement, target, decimals, duration, delay);
            }
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });

    const statsFooter = document.querySelector('.stats-footer');
    if (statsFooter) {
      statsObserver.observe(statsFooter);
    }
  } else {
    // Fallback if IntersectionObserver not available
    statCards.forEach((card, index) => {
      const target = parseFloat(card.getAttribute('data-target') || '0');
      const decimals = parseInt(card.getAttribute('data-decimals') || '0', 10);
      const valueElement = card.querySelector('.stat-value');
      if (valueElement) {
        animateCountUp(valueElement, target, decimals, 1500 + index * 80, 480 + index * 90);
      }
    });
  }
});
