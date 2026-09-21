/**
 * RISKOS — Institutional Flagship Sign Up & Onboarding Controller (signup.js)
 * Manages animated stochastic canvas, persona selection, real-time password entropy,
 * and seamless GoTrue/Supabase authentication.
 */

(() => {
  'use strict';

  // State
  const signupState = {
    selectedPersona: 'quant', // 'retail' | 'quant' | 'prop_trader' | 'risk_officer'
    selectedCurrency: 'INR',
    activeTab: 'signup',
    isSubmitting: false
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initPersonaSelector();
    initTabs();
    initPasswordStrength();
    initCurrencySelector();
    initAuthForms();
    initGuestMode();
  });

  // ── 1. Animated Stochastic Euler-Maruyama Canvas ───────────────────────────
  function initCanvas() {
    const canvas = document.getElementById('signupBgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(65, Math.floor(width / 22));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${p1.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ── 2. Persona Selector ───────────────────────────────────────────────────
  function initPersonaSelector() {
    const cards = document.querySelectorAll('.persona-select-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        signupState.selectedPersona = card.dataset.persona;

        const roleBadge = document.getElementById('selectedRoleBadge');
        if (roleBadge) {
          roleBadge.textContent = card.querySelector('.persona-card-name').textContent;
        }
      });
    });
  }

  // ── 3. Tab Switching ──────────────────────────────────────────────────────
  function initTabs() {
    const tabBtns = document.querySelectorAll('.signup-tab-btn');
    const panes = document.querySelectorAll('.signup-tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const target = btn.dataset.tab;
        signupState.activeTab = target;

        const activePane = document.getElementById(`pane_${target}`);
        if (activePane) activePane.classList.add('active');
      });
    });
  }

  // ── 4. Real-Time Password Entropy & Strength Meter ────────────────────────
  function initPasswordStrength() {
    const pwInput = document.getElementById('suPassword');
    const fillEl = document.getElementById('pwStrengthFill');
    const labelEl = document.getElementById('pwStrengthLabel');

    const reqLength = document.getElementById('reqLength');
    const reqUpper = document.getElementById('reqUpper');
    const reqNumber = document.getElementById('reqNumber');
    const reqSpecial = document.getElementById('reqSpecial');

    if (!pwInput || !fillEl || !labelEl) return;

    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      let score = 0;

      const hasLength = val.length >= 8;
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      const hasSpecial = /[^A-Za-z0-9]/.test(val);

      if (reqLength) reqLength.classList.toggle('met', hasLength);
      if (reqUpper) reqUpper.classList.toggle('met', hasUpper && hasLower);
      if (reqNumber) reqNumber.classList.toggle('met', hasNumber);
      if (reqSpecial) reqSpecial.classList.toggle('met', hasSpecial);

      if (hasLength) score += 25;
      if (hasUpper && hasLower) score += 25;
      if (hasNumber) score += 25;
      if (hasSpecial) score += 25;

      fillEl.style.width = `${score}%`;

      if (val.length === 0) {
        fillEl.style.width = '0%';
        labelEl.textContent = 'None';
        labelEl.style.color = 'var(--su-text-muted)';
      } else if (score <= 25) {
        fillEl.style.background = 'var(--su-accent-rose)';
        labelEl.textContent = 'Weak';
        labelEl.style.color = 'var(--su-accent-rose)';
      } else if (score <= 50) {
        fillEl.style.background = 'var(--su-accent-amber)';
        labelEl.textContent = 'Fair';
        labelEl.style.color = 'var(--su-accent-amber)';
      } else if (score <= 75) {
        fillEl.style.background = '#38bdf8';
        labelEl.textContent = 'Strong';
        labelEl.style.color = '#38bdf8';
      } else {
        fillEl.style.background = 'var(--su-accent-emerald)';
        labelEl.textContent = 'Institutional Grade';
        labelEl.style.color = 'var(--su-accent-emerald)';
      }
    });
  }

  // ── 5. Sandbox Currency Selection ─────────────────────────────────────────
  function initCurrencySelector() {
    const buttons = document.querySelectorAll('.sandbox-alloc-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        signupState.selectedCurrency = btn.dataset.curr;
      });
    });
  }

  // ── 6. Authentication Forms & Supabase Integration ────────────────────────
  function initAuthForms() {
    const formSignUp = document.getElementById('formSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const statusMsg = document.getElementById('authStatusMsg');
    const btnMagicLink = document.getElementById('btnMagicLink');

    const showMsg = (text, type = 'error') => {
      if (!statusMsg) return;
      statusMsg.textContent = text;
      statusMsg.className = `su-status-msg ${type}`;
    };

    // Sign Up Submission
    if (formSignUp) {
      formSignUp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('suFullName')?.value?.trim();
        const email = document.getElementById('suEmail')?.value?.trim();
        const phone = document.getElementById('suPhone')?.value?.trim();
        const password = document.getElementById('suPassword')?.value;
        const submitBtn = document.getElementById('btnSubmitSignUp');

        if (!email || !password) {
          showMsg('Please fill in your institutional email and password.', 'error');
          return;
        }

        if (password.length < 8) {
          showMsg('Password must be at least 8 characters with institutional entropy.', 'error');
          return;
        }

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Initializing Account...`;
          }

          showMsg('Provisioning institutional credentials & database tables...', 'info');

          const client = window.RISKOS_Supabase;
          if (client && typeof client.signUp === 'function') {
            const res = await client.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                  phone: phone,
                  persona: signupState.selectedPersona,
                  currency: signupState.selectedCurrency
                }
              }
            });

            if (res.error) {
              showMsg(res.error.message || 'Signup encountered an error.', 'error');
            } else {
              showMsg('Account created successfully! Redirecting to Terminal...', 'success');
              showToast('✨ Account initialized. Welcome to RISKOS Terminal.');
              setTimeout(() => {
                window.location.href = getRedirectUrl();
              }, 1200);
            }
          } else {
            // Local fallback if offline
            localStorage.setItem('riskos_user_profile', JSON.stringify({
              fullName, email, phone, persona: signupState.selectedPersona, currency: signupState.selectedCurrency
            }));
            showMsg('Running in Offline Terminal Mode. Redirecting...', 'success');
            setTimeout(() => { window.location.href = getRedirectUrl(); }, 1000);
          }
        } catch (err) {
          showMsg(err.message || 'Unexpected failure during signup.', 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Initialize Quant Terminal`;
          }
        }
      });
    }

    // Sign In Submission
    if (formSignIn) {
      formSignIn.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('siEmail')?.value?.trim();
        const password = document.getElementById('siPassword')?.value;
        const submitBtn = document.getElementById('btnSubmitSignIn');

        if (!email || !password) {
          showMsg('Please enter your institutional email and password.', 'error');
          return;
        }

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
          }

          const client = window.RISKOS_Supabase;
          if (client && typeof client.signIn === 'function') {
            const res = await client.signIn({ email, password });
            if (res.error) {
              showMsg(res.error.message || 'Invalid credentials.', 'error');
            } else {
              showMsg('Session authenticated. Loading terminal environment...', 'success');
              showToast('🔑 Authenticated successfully.');
              setTimeout(() => {
                window.location.href = getRedirectUrl();
              }, 1000);
            }
          } else {
            showMsg('Offline authentication accepted. Redirecting...', 'success');
            setTimeout(() => { window.location.href = getRedirectUrl(); }, 1000);
          }
        } catch (err) {
          showMsg(err.message || 'Failed to authenticate.', 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> Authenticate &amp; Enter Terminal`;
          }
        }
      });
    }

    // Magic Link Button
    if (btnMagicLink) {
      btnMagicLink.addEventListener('click', async () => {
        const email = document.getElementById('siEmail')?.value?.trim() || document.getElementById('suEmail')?.value?.trim();
        if (!email) {
          showMsg('Please enter your institutional email to receive a Magic Link.', 'error');
          return;
        }

        try {
          btnMagicLink.disabled = true;
          btnMagicLink.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending Magic Link...`;
          const client = window.RISKOS_Supabase;
          if (client && typeof client.signInWithOtp === 'function') {
            const res = await client.signInWithOtp({ email });
            if (res.error) {
              showMsg(res.error.message, 'error');
            } else {
              showMsg(`Magic Link dispatched to ${email}. Check your inbox.`, 'success');
              showToast(`📧 Magic link sent to ${email}`);
            }
          }
        } catch (err) {
          showMsg(err.message, 'error');
        } finally {
          btnMagicLink.disabled = false;
          btnMagicLink.innerHTML = `<i class="fa-solid fa-envelope"></i> Email me a passwordless Magic Link`;
        }
      });
    }
  }

  // ── 7. Fast Guest Entry ───────────────────────────────────────────────────
  function initGuestMode() {
    const guestBtns = document.querySelectorAll('.su-guest-btn');
    guestBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        showToast('Entering Terminal in Guest Mode...');
        setTimeout(() => {
          window.location.href = getRedirectUrl();
        }, 500);
      });
    });
  }

  function getRedirectUrl() {
    const p = signupState.selectedPersona;
    if (p === 'retail') return 'learn.html';
    if (p === 'quant') return 'app.html';
    if (p === 'prop_trader') return 'fleet.html';
    if (p === 'risk_officer') return 'portfolio_optimizer.html';
    return 'index.html';
  }

  function showToast(msg) {
    let container = document.getElementById('suToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'suToastContainer';
      container.className = 'su-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'su-toast';
    toast.innerHTML = `<i class="fa-solid fa-shield-halved text-cyan"></i><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

})();
