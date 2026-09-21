/**
 * RISKOS — Universal Institutional Supabase Auth & Notification Controller (authModal.js)
 * Manages login/signup modal, phone/email alert preferences, cloud sync, and notification drawer.
 */

((root) => {
  'use strict';

  class AuthModalController {
    constructor() {
      this.activeTab = 'signin';
      this.supabase = root.RISKOS_Supabase || null;
      this.inbox = [];

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }

    init() {
      this.supabase = root.RISKOS_Supabase || null;
      this._injectModalMarkup();
      this._bindHeaderTriggers();
      this._bindModalEvents();
      this._bindRealtimeEvents();
      this._updateAuthStatus();
      this._renderNotifications();
    }

    // ── 1. DOM Markup Injection ─────────────────────────────────────────────
    _injectModalMarkup() {
      if (document.getElementById('riskosAuthModalOverlay')) return;

      const modalHtml = `
        <!-- Supabase Institutional Auth Modal -->
        <div class="auth-modal-overlay" id="riskosAuthModalOverlay">
          <div class="auth-modal-dialog" role="dialog" aria-modal="true">
            <div class="auth-modal-header">
              <div class="auth-modal-title">
                <i class="fa-solid fa-shield-halved text-cyan"></i>
                <span>RISKOS CLOUD &bull; SUPABASE ENTERPRISE</span>
              </div>
              <button class="auth-modal-close-btn" id="authModalCloseBtn" aria-label="Close modal">&times;</button>
            </div>

            <!-- Modal Tab Bar -->
            <div class="auth-modal-tabs">
              <button class="auth-tab-btn active" data-tab="signin">Sign In</button>
              <button class="auth-tab-btn" data-tab="signup">Sign Up</button>
              <button class="auth-tab-btn" data-tab="notifs">Alerts &amp; Notifications</button>
              <button class="auth-tab-btn" data-tab="cloud">Cloud Sync</button>
            </div>

            <!-- Tab 1: Sign In -->
            <div class="auth-tab-pane active" id="authPaneSignIn">
              <form id="formSignIn">
                <div class="auth-form-group">
                  <label class="auth-label">Institutional Email</label>
                  <input type="email" class="auth-input" id="signInEmail" placeholder="trader@hedgefund.com" required autocomplete="email">
                </div>
                <div class="auth-form-group">
                  <label class="auth-label">Password</label>
                  <input type="password" class="auth-input" id="signInPassword" placeholder="••••••••••••" required autocomplete="current-password">
                </div>
                <button type="submit" class="auth-submit-btn" id="btnSubmitSignIn">
                  <i class="fa-solid fa-arrow-right-to-bracket"></i>
                  <span>Sign In to Terminal Cloud</span>
                </button>
                <div style="text-align:center; margin-top:12px; display:flex; flex-direction:column; gap:6px;">
                  <button type="button" id="btnSendMagicLink" style="background:none; border:none; color:var(--auth-accent-cyan); font-size:0.75rem; cursor:pointer; text-decoration:underline;">
                    Email me a passwordless Magic Link
                  </button>
                  <a href="signup.html" style="color:var(--auth-text-muted); font-size:0.72rem; text-decoration:none; margin-top:4px;">
                    Open Full-Screen Onboarding Page &rarr;
                  </a>
                </div>
                <div class="auth-status-msg" id="signInStatusMsg"></div>
              </form>
            </div>

            <!-- Tab 2: Sign Up -->
            <div class="auth-tab-pane" id="authPaneSignUp">
              <form id="formSignUp">
                <div class="auth-form-group">
                  <label class="auth-label">Full Name</label>
                  <input type="text" class="auth-input" id="signUpFullName" placeholder="Alexander Hamilton" autocomplete="name">
                </div>
                <div class="auth-form-group">
                  <label class="auth-label">Institutional Email</label>
                  <input type="email" class="auth-input" id="signUpEmail" placeholder="analyst@riskos.com" required autocomplete="email">
                </div>
                <div class="auth-form-group">
                  <label class="auth-label">Phone Number (For SMS / Phone Alerts)</label>
                  <input type="tel" class="auth-input" id="signUpPhone" placeholder="+91 98765 43210" autocomplete="tel">
                </div>
                <div class="auth-form-group">
                  <label class="auth-label">Password (Min 8 Characters)</label>
                  <input type="password" class="auth-input" id="signUpPassword" minlength="8" placeholder="••••••••••••" required autocomplete="new-password">
                </div>
                <button type="submit" class="auth-submit-btn" id="btnSubmitSignUp">
                  <i class="fa-solid fa-user-plus"></i>
                  <span>Create Cloud Account</span>
                </button>
                <div style="text-align:center; margin-top:10px;">
                  <a href="signup.html" style="color:var(--auth-accent-cyan); font-size:0.72rem; text-decoration:none;">
                    Experience Full Dedicated Onboarding &rarr;
                  </a>
                </div>
                <div class="auth-status-msg" id="signUpStatusMsg"></div>
              </form>
            </div>

            <!-- Tab 3: Alerts & Notification Preferences -->
            <div class="auth-tab-pane" id="authPaneNotifs">
              <div style="font-size:0.78rem; color:var(--auth-text-muted); margin-bottom:14px;">
                Configure real-time event dispatching for critical market catalysts, barrier breaches, and trade fills.
              </div>

              <div class="notif-toggle-row">
                <div class="notif-toggle-info">
                  <span class="notif-toggle-title"><i class="fa-solid fa-envelope text-cyan" style="margin-right:6px;"></i> Email Notifications</span>
                  <span class="notif-toggle-desc">Send immediate email digests for critical portfolio events</span>
                </div>
                <label class="notif-switch">
                  <input type="checkbox" id="toggleNotifyEmail" checked>
                  <span class="notif-slider"></span>
                </label>
              </div>

              <div class="notif-toggle-row">
                <div class="notif-toggle-info">
                  <span class="notif-toggle-title"><i class="fa-solid fa-phone text-emerald" style="margin-right:6px;"></i> Phone / SMS Alerts</span>
                  <span class="notif-toggle-desc">Send urgent SMS alerts for severe VaR barrier breaches</span>
                </div>
                <label class="notif-switch">
                  <input type="checkbox" id="toggleNotifyPhone" checked>
                  <span class="notif-slider"></span>
                </label>
              </div>

              <div class="notif-toggle-row">
                <div class="notif-toggle-info">
                  <span class="notif-toggle-title">High-Materiality News (&ge; 80/100)</span>
                  <span class="notif-toggle-desc">Instant notification on Alpha Vantage earnings &amp; macro catalysts</span>
                </div>
                <label class="notif-switch">
                  <input type="checkbox" id="toggleNotifyNews" checked>
                  <span class="notif-slider"></span>
                </label>
              </div>

              <div class="notif-toggle-row">
                <div class="notif-toggle-info">
                  <span class="notif-toggle-title">Portfolio VaR Barrier Breach</span>
                  <span class="notif-toggle-desc">Trigger alert if portfolio intraday loss exceeds daily VaR</span>
                </div>
                <label class="notif-switch">
                  <input type="checkbox" id="toggleNotifyVar" checked>
                  <span class="notif-slider"></span>
                </label>
              </div>

              <div class="notif-toggle-row">
                <div class="notif-toggle-info">
                  <span class="notif-toggle-title">Order Fills &amp; Bot Executions</span>
                  <span class="notif-toggle-desc">Receive confirmation when paper trades or fleet bots fill</span>
                </div>
                <label class="notif-switch">
                  <input type="checkbox" id="toggleNotifyFills" checked>
                  <span class="notif-slider"></span>
                </label>
              </div>

              <div class="auth-form-group" style="margin-top:14px;">
                <label class="auth-label">Primary SMS Phone Number</label>
                <input type="tel" class="auth-input" id="profilePhoneNumber" placeholder="+91 98765 43210">
              </div>

              <button class="auth-submit-btn" id="btnSaveNotifPreferences">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save Notification Preferences</span>
              </button>
              <div class="auth-status-msg" id="notifStatusMsg"></div>
            </div>

            <!-- Tab 4: Cloud Sync & Settings -->
            <div class="auth-tab-pane" id="authPaneCloud">
              <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:0.75rem; color:var(--auth-text-muted); text-transform:uppercase; font-weight:700;">Connection Status:</span>
                  <span id="cloudStatusBadge" style="font-family:var(--auth-font-mono); font-size:0.75rem; font-weight:800; color:var(--auth-accent-emerald);">
                    🟢 CONNECTED TO SUPABASE
                  </span>
                </div>
                <div style="font-family:var(--auth-font-mono); font-size:0.7rem; color:var(--auth-text-muted); word-break:break-all;">
                  URL: <span id="cloudProjectUrlDisplay" style="color:#fff;">https://wqqncnoqwoojmxdwvhai.supabase.co</span>
                </div>
              </div>

              <button class="auth-submit-btn" id="btnTriggerCloudSync" style="margin-bottom:16px;">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>Sync Local Data to Supabase Now</span>
              </button>
              <div class="auth-status-msg" id="syncStatusMsg"></div>

              <div style="margin-top:16px; border-top:1px solid var(--auth-border); padding-top:14px;">
                <span class="auth-label" style="margin-bottom:10px;">Custom Connection Override (Optional)</span>
                <div class="auth-form-group">
                  <input type="text" class="auth-input" id="customSupabaseUrl" placeholder="https://your-project.supabase.co">
                </div>
                <div class="auth-form-group">
                  <input type="password" class="auth-input" id="customSupabaseAnonKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6...">
                </div>
                <div style="display:flex; gap:8px;">
                  <button type="button" class="btn-subtle-pill" id="btnSaveCustomConfig" style="flex:1; justify-content:center;">Apply Override</button>
                  <button type="button" class="btn-subtle-pill" id="btnResetConfig" style="flex:1; justify-content:center;">Reset Defaults</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Notifications Slide-out Drawer -->
        <div class="notif-drawer-overlay" id="riskosNotifDrawerOverlay">
          <div class="notif-drawer-header">
            <div style="font-weight:700; font-size:0.85rem; color:#fff; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-bell text-cyan"></i>
              <span>RISKOS Notification Center</span>
            </div>
            <button id="closeNotifDrawerBtn" style="background:none; border:none; color:var(--auth-text-muted); cursor:pointer; font-size:1.1rem;">&times;</button>
          </div>
          <div class="notif-drawer-list" id="notifDrawerList">
            <!-- Dynamically populated -->
          </div>
          <div style="padding:10px 14px; border-top:1px solid var(--auth-border); display:flex; justify-content:space-between; align-items:center;">
            <button id="btnClearNotifs" style="background:none; border:none; color:var(--auth-text-muted); font-size:0.7rem; cursor:pointer;">Clear All</button>
            <button id="btnOpenNotifSettings" style="background:none; border:none; color:var(--auth-accent-cyan); font-size:0.7rem; cursor:pointer; font-weight:600;">Alert Preferences</button>
          </div>
        </div>
      `;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = modalHtml;
      document.body.appendChild(wrapper);
    }

    // ── 2. Top Bar Triggers & Header Wiring ──
    _bindHeaderTriggers() {
      // Find all possible header action bars across platforms
      const headerActions = document.querySelectorAll('.header-actions, .header-right, .topbar .controls, .nav-actions');

      headerActions.forEach(container => {
        if (!container.querySelector('.nav-auth-pill')) {
          const authBtn = document.createElement('button');
          authBtn.className = 'nav-auth-pill';
          authBtn.id = 'navAuthBtn';
          authBtn.title = 'Supabase Cloud Account & Sync';
          authBtn.innerHTML = `
            <span class="nav-auth-dot"></span>
            <span class="nav-auth-label">Sign In</span>
          `;
          authBtn.addEventListener('click', () => {
            if (this.supabase && this.supabase.isAuthenticated()) {
              this.openModal('cloud');
            } else {
              this.openModal('signin');
            }
          });

          const notifBtn = document.createElement('button');
          notifBtn.className = 'nav-notif-btn';
          notifBtn.id = 'navNotificationBell';
          notifBtn.title = 'Live Risk & News Alerts';
          notifBtn.innerHTML = `
            <i class="fa-solid fa-bell"></i>
            <span class="notif-badge" id="navNotifCount" style="display:none;">0</span>
          `;
          notifBtn.addEventListener('click', () => this.toggleDrawer());

          container.prepend(notifBtn);
          container.prepend(authBtn);
        }
      });
    }

    // ── 3. Modal Events & Forms ──
    _bindModalEvents() {
      const overlay = document.getElementById('riskosAuthModalOverlay');
      const closeBtn = document.getElementById('authModalCloseBtn');
      const drawerClose = document.getElementById('closeNotifDrawerBtn');
      const drawerOverlay = document.getElementById('riskosNotifDrawerOverlay');

      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.closeModal();
        });
      }

      if (drawerClose) drawerClose.addEventListener('click', () => this.toggleDrawer(false));

      // Tab switcher
      const tabBtns = document.querySelectorAll('.auth-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          this.switchTab(target);
        });
      });

      // Sign In Form
      const formSignIn = document.getElementById('formSignIn');
      if (formSignIn) {
        formSignIn.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('signInEmail').value.trim();
          const pass = document.getElementById('signInPassword').value;
          const status = document.getElementById('signInStatusMsg');
          const btn = document.getElementById('btnSubmitSignIn');

          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
          status.className = 'auth-status-msg';

          try {
            await this.supabase.signIn({ email, password: pass });
            status.className = 'auth-status-msg success';
            status.textContent = 'Authenticated successfully! Syncing portfolio...';
            await this.supabase.syncAll();
            setTimeout(() => {
              this.closeModal();
              btn.disabled = false;
              btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Terminal Cloud';
            }, 800);
          } catch (err) {
            status.className = 'auth-status-msg error';
            status.textContent = err.message || 'Authentication failed. Please verify credentials.';
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Terminal Cloud';
          }
        });
      }

      // Magic Link
      const btnMagic = document.getElementById('btnSendMagicLink');
      if (btnMagic) {
        btnMagic.addEventListener('click', async () => {
          const email = document.getElementById('signInEmail').value.trim();
          const status = document.getElementById('signInStatusMsg');
          if (!email) {
            status.className = 'auth-status-msg error';
            status.textContent = 'Please enter your email above first.';
            return;
          }
          status.className = 'auth-status-msg success';
          status.textContent = 'Sending passwordless magic link...';
          try {
            await this.supabase.signInWithOtp({ email });
            status.textContent = 'Magic link sent! Check your inbox to sign in.';
          } catch (e) {
            status.className = 'auth-status-msg error';
            status.textContent = e.message || 'Failed to dispatch magic link.';
          }
        });
      }

      // Sign Up Form
      const formSignUp = document.getElementById('formSignUp');
      if (formSignUp) {
        formSignUp.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('signUpEmail').value.trim();
          const password = document.getElementById('signUpPassword').value;
          const fullName = document.getElementById('signUpFullName').value.trim();
          const phone = document.getElementById('signUpPhone').value.trim();
          const status = document.getElementById('signUpStatusMsg');
          const btn = document.getElementById('btnSubmitSignUp');

          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Provisioning...';

          try {
            await this.supabase.signUp({ email, password, fullName, phone });
            status.className = 'auth-status-msg success';
            status.textContent = 'Account created! Confirmation link dispatched to your email.';
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Cloud Account';
          } catch (err) {
            status.className = 'auth-status-msg error';
            status.textContent = err.message || 'Signup failed.';
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Cloud Account';
          }
        });
      }

      // Save Notification Preferences
      const btnSaveNotif = document.getElementById('btnSaveNotifPreferences');
      if (btnSaveNotif) {
        btnSaveNotif.addEventListener('click', async () => {
          const status = document.getElementById('notifStatusMsg');
          const prefs = {
            email: document.getElementById('toggleNotifyEmail').checked,
            phone: document.getElementById('toggleNotifyPhone').checked,
            high_impact_news: document.getElementById('toggleNotifyNews').checked,
            var_breach: document.getElementById('toggleNotifyVar').checked,
            trade_fills: document.getElementById('toggleNotifyFills').checked
          };
          const phone = document.getElementById('profilePhoneNumber').value.trim();

          localStorage.setItem('riskos_notification_preferences', JSON.stringify(prefs));
          if (phone) localStorage.setItem('riskos_phone_number', phone);

          if (this.supabase && this.supabase.isAuthenticated()) {
            await this.supabase.updateProfile({ notification_preferences: prefs, phone }).catch(() => {});
          }

          status.className = 'auth-status-msg success';
          status.textContent = 'Preferences saved successfully.';
          setTimeout(() => { status.className = 'auth-status-msg'; }, 2000);
        });
      }

      // Cloud Sync Button
      const btnSync = document.getElementById('btnTriggerCloudSync');
      if (btnSync) {
        btnSync.addEventListener('click', async () => {
          const status = document.getElementById('syncStatusMsg');
          btnSync.disabled = true;
          btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
          try {
            const res = await this.supabase.syncAll();
            status.className = 'auth-status-msg success';
            status.textContent = `Sync completed! Synced ${res.transactionsCount || 0} transactions and ${res.watchlistCount || 0} watchlist items.`;
          } catch (e) {
            status.className = 'auth-status-msg error';
            status.textContent = 'Sync encountered an error: ' + e.message;
          } finally {
            btnSync.disabled = false;
            btnSync.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sync Local Data to Supabase Now';
          }
        });
      }

      // Notification Drawer actions
      const btnClear = document.getElementById('btnClearNotifs');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          localStorage.removeItem('riskos_notifications_inbox');
          this._renderNotifications();
        });
      }

      const btnOpenNotifSettings = document.getElementById('btnOpenNotifSettings');
      if (btnOpenNotifSettings) {
        btnOpenNotifSettings.addEventListener('click', () => {
          this.toggleDrawer(false);
          this.openModal('notifs');
        });
      }
    }

    // ── 4. Realtime Listeners ──
    _bindRealtimeEvents() {
      if (!this.supabase) return;

      this.supabase.onAuthStateChange(() => {
        this._updateAuthStatus();
      });

      this.supabase.onRealtime('NOTIFICATION_DISPATCHED', (alertItem) => {
        this._renderNotifications();
        this._showToast(alertItem.title, alertItem.body);
      });

      this.supabase.onRealtime('CLOUD_SYNC_COMPLETED', () => {
        this._updateAuthStatus();
      });
    }

    // ── 5. Modal Operations ──
    openModal(tab = 'signin') {
      const overlay = document.getElementById('riskosAuthModalOverlay');
      if (!overlay) return;
      this.switchTab(tab);
      overlay.classList.add('active');
    }

    closeModal() {
      const overlay = document.getElementById('riskosAuthModalOverlay');
      if (overlay) overlay.classList.remove('active');
    }

    switchTab(tabName) {
      this.activeTab = tabName;
      document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      const panes = {
        signin: document.getElementById('authPaneSignIn'),
        signup: document.getElementById('authPaneSignUp'),
        notifs: document.getElementById('authPaneNotifs'),
        cloud: document.getElementById('authPaneCloud')
      };

      Object.entries(panes).forEach(([k, el]) => {
        if (el) el.classList.toggle('active', k === tabName);
      });
    }

    toggleDrawer(forceState) {
      const drawer = document.getElementById('riskosNotifDrawerOverlay');
      if (!drawer) return;
      if (typeof forceState === 'boolean') {
        drawer.classList.toggle('active', forceState);
      } else {
        drawer.classList.toggle('active');
      }
      if (drawer.classList.contains('active')) {
        this._renderNotifications();
      }
    }

    // ── 6. UI Synchronization ──
    _updateAuthStatus() {
      const isAuth = this.supabase && this.supabase.isAuthenticated();
      const user = this.supabase ? this.supabase.getUser() : null;

      document.querySelectorAll('.nav-auth-pill').forEach(btn => {
        const label = btn.querySelector('.nav-auth-label');
        if (isAuth && user) {
          btn.classList.add('authenticated');
          if (label) label.textContent = user.email ? user.email.split('@')[0] : 'Connected';
        } else {
          btn.classList.remove('authenticated');
          if (label) label.textContent = 'Sign In';
        }
      });

      const badge = document.getElementById('cloudStatusBadge');
      if (badge) {
        if (isAuth) {
          badge.textContent = '🟢 CONNECTED (USER: ' + (user?.email || 'AUTH') + ')';
          badge.style.color = 'var(--auth-accent-emerald)';
        } else {
          badge.textContent = '⚠️ GUEST / LOCAL MODE';
          badge.style.color = 'var(--auth-accent-amber)';
        }
      }
    }

    _renderNotifications() {
      const listEl = document.getElementById('notifDrawerList');
      const badgeEl = document.getElementById('navNotifCount');
      if (!this.supabase) return;

      const inbox = this.supabase.getNotificationsInbox();
      if (badgeEl) {
        badgeEl.textContent = String(inbox.length);
        badgeEl.style.display = inbox.length > 0 ? 'inline-block' : 'none';
      }

      if (!listEl) return;
      if (inbox.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center; padding:30px 10px; color:var(--auth-text-muted); font-size:0.75rem;">
            <i class="fa-regular fa-bell-slash" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>
            No active risk alerts or news catalyst dispatches.
          </div>
        `;
        return;
      }

      listEl.innerHTML = inbox.map(item => `
        <div class="notif-card">
          <div class="notif-card-header">
            <span>${item.type.replace('_', ' ')}</span>
            <span>${new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="notif-card-title">${item.title}</div>
          <div style="color:#cbd5e1; font-size:0.72rem; line-height:1.35;">${item.body}</div>
        </div>
      `).join('');
    }

    _showToast(title, body) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(14, 17, 23, 0.95);
        border: 1px solid var(--auth-accent-cyan);
        box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 16px rgba(34,211,238,0.25);
        border-radius: 10px;
        padding: 12px 18px;
        z-index: 99999;
        color: #fff;
        font-size: 0.8rem;
        max-width: 340px;
        backdrop-filter: blur(12px);
        animation: authModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      toast.innerHTML = `
        <div style="font-weight:700; color:var(--auth-accent-cyan); margin-bottom:3px; display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-bolt"></i> ${title}
        </div>
        <div style="font-size:0.72rem; color:#94a3b8;">${body}</div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
      }, 4500);
    }
  }

  const authController = new AuthModalController();
  root.RISKOS_AuthModal = authController;

})(typeof window !== 'undefined' ? window : global);
