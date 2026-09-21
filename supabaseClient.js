/**
 * RISKOS — Universal Supabase Enterprise Client (supabaseClient.js)
 * Manages institutional authentication, cloud PostgreSQL database services,
 * realtime WebSockets, email/phone notification dispatching, and pgvector search.
 * 
 * Supports both Official @supabase/supabase-js SDK (browser CDN) and
 * high-performance zero-dependency native fetch fallback (Node.js & offline environments).
 */

((root) => {
  'use strict';

  const Config = root.SupabaseConfig || (typeof require === 'function' ? require('./supabaseConfig.js') : {
    url: 'https://wqqncnoqwoojmxdwvhai.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcW5jbm9xd29vam14ZHd2aGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODk2MzYsImV4cCI6MjEwNTU2NTYzNn0.PhAlb1leV535nXtnHNjLMhoJ0WfgNWZg0pNS3O6Vm74',
    publishableKey: 'sb_publishable_oYOgLA5C2pAI4rlVgo8dmg_gZ_Owjb_',
    storageBucket: 'riskos_reports',
    realtimeChannel: 'riskos_enterprise_channel'
  });

  const SESSION_STORAGE_KEY = 'riskos_supabase_auth_session';
  const NOTIFICATIONS_CACHE_KEY = 'riskos_notifications_inbox';

  class SupabaseClientWrapper {
    constructor() {
      this.config = Config;
      this.rawClient = null;
      this.session = null;
      this.user = null;
      this.authListeners = [];
      this.realtimeListeners = new Map();
      this.isOnline = true;
      this.realtimeChannel = null;

      this._initStorage();
      this._initSdk();
      this._initRealtimeBus();
    }

    // ── 1. Storage & Session Hydration ──────────────────────────────────────
    _initStorage() {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = localStorage.getItem(SESSION_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.access_token) {
              this.session = parsed;
              this.user = parsed.user || null;
            }
          }
        } catch (e) {
          console.warn('[Supabase] Failed to restore session from storage:', e);
        }
      }
    }

    _persistSession(session) {
      this.session = session;
      this.user = session ? (session.user || null) : null;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          if (session) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (e) {}
      }
      this._notifyAuthSubscribers(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    }

    // ── 2. Official SDK Resolution ──────────────────────────────────────────
    _initSdk() {
      const url = this.config.url;
      const key = this.config.anonKey;

      if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          this.rawClient = window.supabase.createClient(url, key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              storageKey: SESSION_STORAGE_KEY
            }
          });
          this.rawClient.auth.onAuthStateChange((event, session) => {
            if (session) {
              this._persistSession(session);
            } else if (event === 'SIGNED_OUT') {
              this._persistSession(null);
            }
          });
        } catch (err) {
          console.warn('[Supabase] SDK initialization fallback to REST:', err);
        }
      }
    }

    // ── 3. High-Performance REST Fallback Helper ────────────────────────────
    async _request(endpoint, options = {}) {
      const url = `${this.config.url}${endpoint}`;
      const headers = {
        'apikey': this.config.anonKey,
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (this.session && this.session.access_token) {
        headers['Authorization'] = `Bearer ${this.session.access_token}`;
      } else {
        headers['Authorization'] = `Bearer ${this.config.anonKey}`;
      }

      try {
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(errData.msg || errData.message || errData.error_description || `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        throw err;
      }
    }

    // ── 4. Realtime Broadcast & Channel Mesh ─────────────────────────────────
    _initRealtimeBus() {
      // Browser BroadcastChannel fallback for multi-tab zero-latency sync
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel(this.config.realtimeChannel || 'riskos_enterprise_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this._dispatchRealtimeEvent(event.data.type, event.data.payload, false);
          }
        };
      }
    }

    broadcastRealtime(type, payload = {}) {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      }
      this._dispatchRealtimeEvent(type, payload, true);
    }

    onRealtime(type, callback) {
      if (!this.realtimeListeners.has(type)) {
        this.realtimeListeners.set(type, []);
      }
      this.realtimeListeners.get(type).push(callback);
      return () => {
        const list = this.realtimeListeners.get(type) || [];
        this.realtimeListeners.set(type, list.filter(cb => cb !== callback));
      };
    }

    _dispatchRealtimeEvent(type, payload, isLocal = false) {
      const listeners = this.realtimeListeners.get(type) || [];
      listeners.forEach(cb => {
        try { cb(payload, isLocal); } catch (e) { console.error(e); }
      });
    }

    // ── 5. Authentication API (GoTrue) ──────────────────────────────────────
    async signUp({ email, password, fullName = '', phone = '' }) {
      if (this.rawClient) {
        const res = await this.rawClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone }
          }
        });
        if (res.error) throw res.error;
        if (res.data.session) this._persistSession(res.data.session);
        return res.data;
      }

      // REST Auth Fallback
      const payload = {
        email,
        password,
        data: { full_name: fullName, phone }
      };
      const data = await this._request('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data.session) this._persistSession(data.session);
      return data;
    }

    async signIn({ email, password }) {
      if (this.rawClient) {
        const res = await this.rawClient.auth.signInWithPassword({ email, password });
        if (res.error) throw res.error;
        this._persistSession(res.data.session);
        return res.data;
      }

      // REST Auth Fallback
      const data = await this._request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.access_token) {
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          user: data.user
        };
        this._persistSession(session);
        return { session, user: data.user };
      }
      return data;
    }

    async signInWithOtp({ email, phone }) {
      if (this.rawClient) {
        const opts = {};
        if (email) opts.email = email;
        if (phone) opts.phone = phone;
        const res = await this.rawClient.auth.signInWithOtp(opts);
        if (res.error) throw res.error;
        return res.data;
      }

      const body = email ? { email } : { phone };
      return await this._request('/auth/v1/otp', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }

    async signOut() {
      if (this.rawClient) {
        await this.rawClient.auth.signOut().catch(() => {});
      }
      this._persistSession(null);
      return { success: true };
    }

    getUser() {
      return this.user;
    }

    getSession() {
      return this.session;
    }

    isAuthenticated() {
      return Boolean(this.session && this.session.access_token);
    }

    onAuthStateChange(callback) {
      if (typeof callback === 'function') {
        this.authListeners.push(callback);
      }
      return () => {
        this.authListeners = this.authListeners.filter(cb => cb !== callback);
      };
    }

    _notifyAuthSubscribers(event, session) {
      this.authListeners.forEach(cb => {
        try { cb(event, session); } catch (e) { console.error(e); }
      });
    }

    // ── 6. Profile & User Preferences Service ───────────────────────────────
    async getProfile() {
      if (!this.isAuthenticated()) {
        // Return local guest profile
        return {
          id: 'guest',
          email: 'guest@riskos.local',
          full_name: 'Guest Quant',
          user_mode: (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_user_mode')) || 'investor',
          currency: (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_currency')) || 'INR',
          notification_preferences: { email: true, phone: true, high_impact_news: true, var_breach: true, trade_fills: true }
        };
      }

      try {
        const rows = await this._request(`/rest/v1/profiles?id=eq.${this.user.id}&select=*`);
        return rows[0] || null;
      } catch (err) {
        console.warn('[Supabase] Failed to fetch profile:', err);
        return null;
      }
    }

    async updateProfile(updates = {}) {
      if (!this.isAuthenticated()) return null;
      return await this._request(`/rest/v1/profiles?id=eq.${this.user.id}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(updates)
      });
    }

    // ── 7. Portfolio Cloud Sync Service ─────────────────────────────────────
    async getPortfolioTransactions() {
      if (!this.isAuthenticated()) {
        const local = (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_transactions_v2')) || '[]';
        return JSON.parse(local);
      }
      try {
        return await this._request(`/rest/v1/portfolio_transactions?user_id=eq.${this.user.id}&select=*&order=timestamp.desc`);
      } catch (e) {
        const local = (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_transactions_v2')) || '[]';
        return JSON.parse(local);
      }
    }

    async addPortfolioTransaction(tx) {
      // Mirror to local storage cache immediately
      if (typeof localStorage !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('riskos_transactions_v2') || '[]');
          local.unshift(tx);
          localStorage.setItem('riskos_transactions_v2', JSON.stringify(local));
        } catch (e) {}
      }

      this.broadcastRealtime('PORTFOLIO_TRANSACTION_ADDED', tx);

      if (!this.isAuthenticated()) return tx;

      try {
        const payload = {
          user_id: this.user.id,
          symbol: tx.symbol,
          side: tx.side || (tx.quantity >= 0 ? 'BUY' : 'SELL'),
          quantity: Math.abs(tx.quantity),
          price: tx.price,
          fee: tx.fee || 0,
          notes: tx.notes || 'Executed on RISKOS Terminal',
          timestamp: tx.timestamp || new Date().toISOString()
        };
        const rows = await this._request('/rest/v1/portfolio_transactions', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(payload)
        });
        return rows[0] || tx;
      } catch (err) {
        console.warn('[Supabase] Stored transaction locally; cloud sync failed:', err);
        return tx;
      }
    }

    // ── 8. Multi-Asset Watchlist Service ────────────────────────────────────
    async getWatchlist() {
      if (!this.isAuthenticated()) {
        const local = (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_watchlist')) || '["RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"]';
        return JSON.parse(local);
      }
      try {
        const rows = await this._request(`/rest/v1/watchlists?user_id=eq.${this.user.id}&select=*`);
        if (rows && rows.length > 0 && Array.isArray(rows[0].symbols)) {
          return rows[0].symbols;
        }
      } catch (e) {}
      const local = (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_watchlist')) || '["RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"]';
      return JSON.parse(local);
    }

    async saveWatchlist(symbols = []) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('riskos_watchlist', JSON.stringify(symbols));
      }
      this.broadcastRealtime('WATCHLIST_UPDATED', symbols);

      if (!this.isAuthenticated()) return symbols;

      try {
        await this._request(`/rest/v1/watchlists?user_id=eq.${this.user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ symbols, updated_at: new Date().toISOString() })
        });
      } catch (e) {
        console.warn('[Supabase] Failed to update cloud watchlist:', e);
      }
      return symbols;
    }

    // ── 9. News Bookmarks & Research Catalysts Service ──────────────────────
    async getNewsBookmarks() {
      if (!this.isAuthenticated()) {
        const local = (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_news_bookmarks')) || '[]';
        return JSON.parse(local);
      }
      try {
        return await this._request(`/rest/v1/news_bookmarks?user_id=eq.${this.user.id}&select=*&order=saved_at.desc`);
      } catch (e) {
        const local = (typeof localStorage !== 'undefined' && localStorage.getItem('riskos_news_bookmarks')) || '[]';
        return JSON.parse(local);
      }
    }

    async toggleNewsBookmark(article) {
      if (!article || !article.id) return false;
      const artId = String(article.id);

      // Local mirror
      let local = [];
      try {
        local = JSON.parse(localStorage.getItem('riskos_news_bookmarks') || '[]');
      } catch (e) {}

      const existingIdx = local.findIndex(b => b.article_id === artId || b.id === artId);
      const isRemoving = existingIdx >= 0;

      if (isRemoving) {
        local.splice(existingIdx, 1);
      } else {
        local.unshift({
          article_id: artId,
          title: article.title || article.headline,
          source: article.source,
          url: article.url || '#',
          published_at: article.publishedAt || article.published_at || new Date().toISOString(),
          overall_sentiment: article.overallSentiment || article.sentimentScore || 0,
          event_type: article.eventType || article.eventLabel || 'GENERAL',
          materiality_score: article.materialityScore || 50,
          saved_at: new Date().toISOString()
        });
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('riskos_news_bookmarks', JSON.stringify(local));
      }

      this.broadcastRealtime('NEWS_BOOKMARK_TOGGLED', { articleId: artId, isBookmarked: !isRemoving });

      if (this.isAuthenticated()) {
        try {
          if (isRemoving) {
            await this._request(`/rest/v1/news_bookmarks?user_id=eq.${this.user.id}&article_id=eq.${encodeURIComponent(artId)}`, {
              method: 'DELETE'
            });
          } else {
            await this._request('/rest/v1/news_bookmarks', {
              method: 'POST',
              body: JSON.stringify({
                user_id: this.user.id,
                article_id: artId,
                title: article.title || article.headline,
                source: article.source,
                url: article.url || '#',
                published_at: article.publishedAt || article.published_at,
                overall_sentiment: article.overallSentiment || article.sentimentScore,
                event_type: article.eventType || article.eventLabel,
                materiality_score: article.materialityScore
              })
            });
          }
        } catch (e) {
          console.warn('[Supabase] Failed to sync bookmark to cloud:', e);
        }
      }

      return !isRemoving;
    }

    // ── 10. Email & Phone Notification Dispatcher ───────────────────────────
    async dispatchNotification({ type, title, body, channel = 'IN_APP', metadata = {} }) {
      const alertItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        title,
        body,
        channel,
        metadata,
        sent_at: new Date().toISOString()
      };

      // 1. Store in local notifications inbox
      if (typeof localStorage !== 'undefined') {
        try {
          const inbox = JSON.parse(localStorage.getItem(NOTIFICATIONS_CACHE_KEY) || '[]');
          inbox.unshift(alertItem);
          localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(inbox.slice(0, 50)));
        } catch (e) {}
      }

      // 2. Broadcast live event to open tabs
      this.broadcastRealtime('NOTIFICATION_DISPATCHED', alertItem);

      // 3. Log to Supabase notifications_log if authenticated
      if (this.isAuthenticated()) {
        try {
          await this._request('/rest/v1/notifications_log', {
            method: 'POST',
            body: JSON.stringify({
              user_id: this.user.id,
              type,
              channel,
              title,
              body,
              metadata,
              status: 'DELIVERED'
            })
          });
        } catch (e) {
          console.warn('[Supabase] Notification log write skipped:', e);
        }
      }

      return alertItem;
    }

    getNotificationsInbox() {
      if (typeof localStorage !== 'undefined') {
        try {
          return JSON.parse(localStorage.getItem(NOTIFICATIONS_CACHE_KEY) || '[]');
        } catch (e) {}
      }
      return [];
    }

    // ── 11. pgvector Semantic Financial Narrative Search ────────────────────
    async findSimilarMarketEvents(queryEmbedding = [], threshold = 0.70, count = 5) {
      if (!this.isAuthenticated() || !queryEmbedding.length) {
        return [];
      }
      try {
        return await this._request('/rest/v1/rpc/match_market_events', {
          method: 'POST',
          body: JSON.stringify({
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: count
          })
        });
      } catch (err) {
        console.warn('[Supabase] pgvector search failed or table uninitialized:', err);
        return [];
      }
    }

    // ── 12. Two-Way Initial Cloud Sync ──────────────────────────────────────
    async syncAll() {
      if (!this.isAuthenticated()) return { status: 'GUEST_MODE' };

      const syncResult = {
        status: 'SYNCED',
        transactionsCount: 0,
        watchlistCount: 0,
        bookmarksCount: 0,
        timestamp: new Date().toISOString()
      };

      try {
        // Sync Watchlist
        const localWatchlist = JSON.parse(localStorage.getItem('riskos_watchlist') || '[]');
        if (localWatchlist.length > 0) {
          await this.saveWatchlist(localWatchlist);
        }
        const cloudWatchlist = await this.getWatchlist();
        syncResult.watchlistCount = cloudWatchlist.length;

        // Sync Transactions
        const txs = await this.getPortfolioTransactions();
        syncResult.transactionsCount = txs.length;

        // Sync Bookmarks
        const bookmarks = await this.getNewsBookmarks();
        syncResult.bookmarksCount = bookmarks.length;

        this.broadcastRealtime('CLOUD_SYNC_COMPLETED', syncResult);
        return syncResult;
      } catch (err) {
        console.error('[Supabase] Two-way sync encountered an error:', err);
        return { status: 'PARTIAL_SYNC', error: err.message };
      }
    }
  }

  const clientSingleton = new SupabaseClientWrapper();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = clientSingleton;
  }
  root.RISKOS_Supabase = clientSingleton;

})(typeof window !== 'undefined' ? window : global);
