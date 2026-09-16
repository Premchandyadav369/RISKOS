# Technical Specification: MarketDataTruth Architecture

## 1. Module Overview
`marketDataTruth.js` is the authoritative client-side oracle for exchange schedules, holiday calendars, data freshness evaluation, and provenance classification.

```javascript
// Example Usage
const nseState = MarketDataTruth.getExchangeStatus('NSE');
console.log(nseState.isOpen); // false outside 09:15-15:30 IST or holidays
console.log(nseState.lastCloseTimestamp); // "2026-09-12 15:30:00 IST"
console.log(nseState.statusLabel); // "MARKET CLOSED"
```

---

## 2. Data State Classification
Every quote, indicator, and chart stream is mapped into one of seven canonical states:
1. `LIVE`: Verified real-time quote received within exchange operating hours.
2. `DELAYED`: Real-world exchange quote with an authorized 15-minute dissemination buffer.
3. `CACHED`: Valid historical closing price retained during closed sessions.
4. `FALLBACK`: Reference price used when primary WebSocket drops.
5. `SIMULATED`: Micro-tick drift generator running in explicit simulation sandbox mode.
6. `SYNTHETIC`: Mathematically constructed asset or composite basket index.
7. `MARKET CLOSED`: Exchange trading window closed; updates paused.

---

## 3. Statutory Holiday Coverage (2026 Engine)
Built-in awareness of official statutory holidays:
- **India (NSE/BSE)**: Republic Day, Mahashivratri, Holi, Good Friday, Eid, Independence Day, Gandhi Jayanti, Diwali Laxmi Pujan, Gurunanak Jayanti, Christmas.
- **US (NYSE/NASDAQ)**: New Year's Day, Martin Luther King Jr. Day, Washington's Birthday, Good Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Christmas.
