/**
 * RISKOS — Supabase Enterprise Configuration (supabaseConfig.js)
 * Manages project connection endpoints, public client keys, and environment overrides.
 */

((root) => {
  'use strict';

  const DEFAULT_CONFIG = {
    url: 'https://wqqncnoqwoojmxdwvhai.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcW5jbm9xd29vam14ZHd2aGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODk2MzYsImV4cCI6MjEwNTU2NTYzNn0.PhAlb1leV535nXtnHNjLMhoJ0WfgNWZg0pNS3O6Vm74',
    publishableKey: 'sb_publishable_oYOgLA5C2pAI4rlVgo8dmg_gZ_Owjb_',
    storageBucket: 'riskos_reports',
    realtimeChannel: 'riskos_enterprise_channel'
  };

  class SupabaseConfigManager {
    constructor() {
      this._config = { ...DEFAULT_CONFIG };
      this._loadOverrides();
    }

    _loadOverrides() {
      // 1. Check Node process.env if available
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.SUPABASE_URL) this._config.url = process.env.SUPABASE_URL;
        if (process.env.SUPABASE_ANON_KEY) this._config.anonKey = process.env.SUPABASE_ANON_KEY;
        if (process.env.SUPABASE_PUBLISHABLE_KEY) this._config.publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      }

      // 2. Check browser localStorage overrides
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const customUrl = localStorage.getItem('RISKOS_SUPABASE_URL');
          const customAnon = localStorage.getItem('RISKOS_SUPABASE_ANON_KEY');
          if (customUrl) this._config.url = customUrl.trim();
          if (customAnon) this._config.anonKey = customAnon.trim();
        } catch (e) {}
      }
    }

    get url() {
      return this._config.url;
    }

    get anonKey() {
      return this._config.anonKey;
    }

    get publishableKey() {
      return this._config.publishableKey;
    }

    get storageBucket() {
      return this._config.storageBucket;
    }

    get realtimeChannel() {
      return this._config.realtimeChannel;
    }

    getRestEndpoint(table) {
      const cleanUrl = (this._config.url || '').replace(/\/$/, '');
      return `${cleanUrl}/rest/v1/${table}`;
    }

    getConfig() {
      return { ...this._config };
    }

    setOverrides(url, anonKey) {
      if (url) {
        this._config.url = url.trim();
        if (typeof localStorage !== 'undefined') localStorage.setItem('RISKOS_SUPABASE_URL', this._config.url);
      }
      if (anonKey) {
        this._config.anonKey = anonKey.trim();
        if (typeof localStorage !== 'undefined') localStorage.setItem('RISKOS_SUPABASE_ANON_KEY', this._config.anonKey);
      }
    }

    resetDefaults() {
      this._config = { ...DEFAULT_CONFIG };
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('RISKOS_SUPABASE_URL');
        localStorage.removeItem('RISKOS_SUPABASE_ANON_KEY');
      }
    }
  }

  const instance = new SupabaseConfigManager();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  root.SupabaseConfig = instance;

})(typeof window !== 'undefined' ? window : global);
