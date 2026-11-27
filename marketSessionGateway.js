/**
 * RISKOS MULTI-SESSION WORLD CLOCK & GATEWAY (marketSessionGateway.js)
 * Real-time global session engine for NSE (Mumbai), NYSE (New York),
 * LSE (London), TSE (Tokyo), and Crypto 24/7, with self-healing Brownian tick fallbacks.
 */

const MarketSessionGateway = (() => {
  'use strict';

  // Session definition configs (in UTC hours for universal normalization)
  // [openHourUTC, openMinUTC, closeHourUTC, closeMinUTC]
  const SESSIONS = [
    {
      id: 'NSE',
      name: 'NSE India (Mumbai)',
      flag: '🇮🇳',
      currency: 'INR',
      tzName: 'Asia/Kolkata',
      openUTC: 3.75, // 09:15 IST = 03:45 UTC
      closeUTC: 10.0 // 15:30 IST = 10:00 UTC
    },
    {
      id: 'NYSE',
      name: 'NYSE / NASDAQ (New York)',
      flag: '🇺🇸',
      currency: 'USD',
      tzName: 'America/New_York',
      openUTC: 13.5, // 09:30 EST = 14:30/13:30 UTC
      closeUTC: 20.0 // 16:00 EST = 21:00/20:00 UTC
    },
    {
      id: 'LSE',
      name: 'London Stock Exchange',
      flag: '🇬🇧',
      currency: 'GBP',
      tzName: 'Europe/London',
      openUTC: 8.0,
      closeUTC: 16.5
    },
    {
      id: 'TSE',
      name: 'Tokyo Stock Exchange',
      flag: '🇯🇵',
      currency: 'JPY',
      tzName: 'Asia/Tokyo',
      openUTC: 0.0,
      closeUTC: 6.0
    },
    {
      id: 'CRYPTO',
      name: 'Global Crypto & Prediction Markets',
      flag: '🌐',
      currency: 'USD/USDT',
      is247: true
    }
  ];

  const getSessionStatus = () => {
    const now = new Date();
    const nowUtcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return SESSIONS.map(sess => {
      if (sess.is247) {
        return {
          id: sess.id,
          name: sess.name,
          flag: sess.flag,
          isOpen: true,
          statusText: '24/7 ACTIVE',
          badgeCls: 'text-green'
        };
      }

      const isOpen = !isWeekend && (nowUtcHour >= sess.openUTC && nowUtcHour <= sess.closeUTC);
      return {
        id: sess.id,
        name: sess.name,
        flag: sess.flag,
        isOpen: isOpen,
        statusText: isOpen ? 'MARKET OPEN' : (isWeekend ? 'WEEKEND CLOSED' : 'AFTER HOURS'),
        badgeCls: isOpen ? 'text-green' : 'text-zinc'
      };
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SELF-HEALING BROWNIAN TICK GENERATOR (FALLBACK & SPEED MODES)
  // ══════════════════════════════════════════════════════════════════════════
  const generateBrownianTick = (lastPrice, dailyVol = 0.018) => {
    const dt = 1 / (252 * 390 * 60); // 1-second interval
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const shock = (dailyVol * Math.sqrt(dt) * z);
    const newPrice = Number((lastPrice * (1 + shock)).toFixed(2));
    return Math.max(0.1, newPrice);
  };

  return {
    SESSIONS,
    getSessionStatus,
    generateBrownianTick
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.MarketSessionGateway = MarketSessionGateway;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketSessionGateway;
}
