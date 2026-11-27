/**
 * RISKOS — TERMINAL THEME ENGINE (themeEngine.js)
 * Manages 3 institutional color palettes:
 *   1. 'cyber-dark' (default)
 *   2. 'bloomberg-amber' (retro Bloomberg CRT phosphor)
 *   3. 'high-contrast-paper' (daylight print/presentation)
 */

((root) => {
  'use strict';

  const STORAGE_KEY = 'riskos_terminal_theme';
  const THEMES = ['cyber-dark', 'bloomberg-amber', 'high-contrast-paper'];
  const THEME_LABELS = {
    'cyber-dark': { name: 'Cyber Dark', icon: 'fa-moon', color: '#22d3ee' },
    'bloomberg-amber': { name: 'Bloomberg Amber', icon: 'fa-terminal', color: '#ffaa00' },
    'high-contrast-paper': { name: 'Paper White', icon: 'fa-sun', color: '#0f172a' }
  };

  let currentTheme = 'cyber-dark';

  const initTheme = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.includes(saved)) {
        currentTheme = saved;
      }
    } catch (e) {}

    applyTheme(currentTheme, false);
    renderFloatingToggle();

    // Listen to sessionSync if available
    if (root.SessionSync && typeof root.SessionSync.on === 'function') {
      root.SessionSync.on('THEME_CHANGE', (data) => {
        if (data && data.theme && THEMES.includes(data.theme)) {
          applyTheme(data.theme, false);
        }
      });
    }
  };

  const applyTheme = (themeName, broadcast = true) => {
    if (!THEMES.includes(themeName)) return;
    currentTheme = themeName;

    document.documentElement.setAttribute('data-theme', themeName);

    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch (e) {}

    updateButtonUI();

    if (broadcast && root.SessionSync && typeof root.SessionSync.broadcastTheme === 'function') {
      root.SessionSync.broadcastTheme(themeName);
    }
  };

  const cycleTheme = () => {
    const nextIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
    applyTheme(THEMES[nextIdx], true);
  };

  const renderFloatingToggle = () => {
    if (document.getElementById('themeSwitchFloatingBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'themeSwitchFloatingBtn';
    btn.className = 'theme-switch-floating-btn';
    btn.setAttribute('aria-label', 'Toggle Institutional Theme');
    btn.title = 'Switch Terminal Theme (Cyber Dark / Bloomberg Amber / Paper White)';
    btn.onclick = cycleTheme;

    document.body.appendChild(btn);
    updateButtonUI();
  };

  const updateButtonUI = () => {
    const btn = document.getElementById('themeSwitchFloatingBtn');
    if (!btn) return;
    const info = THEME_LABELS[currentTheme] || THEME_LABELS['cyber-dark'];
    btn.innerHTML = `<i class="fa-solid ${info.icon}" style="color:${info.color};"></i> <span>${info.name}</span>`;
  };

  const ThemeEngine = {
    THEMES,
    getTheme() { return currentTheme; },
    applyTheme,
    setTheme: applyTheme,
    cycleTheme
  };

  root.ThemeEngine = ThemeEngine;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTheme);
    } else {
      initTheme();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeEngine;
  }
})(typeof window !== 'undefined' ? window : global);
