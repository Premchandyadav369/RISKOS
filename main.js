/**
 * Intelligence For Modern Finance — main.js
 */
document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile Menu ────────────────────────────────────────────────────────
  const burger = document.getElementById('burgerBtn');
  const menu   = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');
  const body   = document.body;

  const menuOpen = () => body.classList.contains('menu-open');

  const open = () => {
    body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.removeAttribute('hidden');
    overlay.removeAttribute('hidden');
  };

  const close = () => {
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('hidden', '');
    overlay.setAttribute('hidden', '');
  };

  if (burger && menu && overlay) {
    burger.addEventListener('click', () => menuOpen() ? close() : open());
    overlay.addEventListener('click', close);
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.querySelectorAll('.mobile-link').forEach(l => l.classList.remove('active'));
        if (a.classList.contains('mobile-link')) a.classList.add('active');
        close();
      });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen()) close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 720 && menuOpen()) close(); });
  }

  // ── Sticky Header ─────────────────────────────────────────────────────
  const header = document.getElementById('siteHeader');
  if (header) {
    const check = () => header.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  // ── Scroll-Spy Active Nav ──────────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const allLinks = document.querySelectorAll('.nav-link, .mobile-link');

  window.addEventListener('scroll', () => {
    const y = window.scrollY + 140;
    let current = '';
    sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
    allLinks.forEach(l => {
      l.classList.remove('active');
      if (l.getAttribute('href') === '#' + current) l.classList.add('active');
    });
  }, { passive: true });

  // ── Count-Up ──────────────────────────────────────────────────────────
  const ease = t => 1 - Math.pow(1 - t, 3);

  const countUp = (el, target, dec, dur, delay) => {
    setTimeout(() => {
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const v = ease(p) * target;
        el.textContent = dec > 0 ? v.toFixed(dec) : Math.round(v).toString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = dec > 0 ? target.toFixed(dec) : target.toString();
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  let counted = false;
  const cards = document.querySelectorAll('.stat-card');

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting && !counted) {
          counted = true;
          cards.forEach((c, i) => {
            const t = parseFloat(c.dataset.target || '0');
            const d = parseInt(c.dataset.decimals || '0', 10);
            const v = c.querySelector('.stat-value');
            if (v) countUp(v, t, d, 1500 + i * 80, 480 + i * 90);
          });
          o.disconnect();
        }
      });
    }, { threshold: 0.25 });
    const sf = document.querySelector('.stats-footer');
    if (sf) obs.observe(sf);
  }

  // ── Scroll Fade-Up ────────────────────────────────────────────────────
  const fades = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const fo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          fo.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    fades.forEach(el => fo.observe(el));
  } else {
    fades.forEach(el => el.classList.add('visible'));
  }

});
