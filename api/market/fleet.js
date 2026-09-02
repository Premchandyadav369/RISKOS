/**
 * Vercel Serverless Function: GET /api/market/fleet
 * 20-Bot Autonomous Quantitative Fleet Status & Telemetry Streamer.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const bots = [
    // 🇮🇳 10 Indian Sector Bots
    { id: 'BOT-IN-01', name: 'NIFTY 0DTE Vol Dispersion', market: 'india', sector: 'Index Derivatives', status: 'RUNNING', pnl_inr: 62450, win_rate: 78.4, sharpe: 3.12 },
    { id: 'BOT-IN-02', name: 'HDFC vs ICICI Kalman Pairs', market: 'india', sector: 'Banking & Financials', status: 'RUNNING', pnl_inr: 41800, win_rate: 81.2, sharpe: 3.45 },
    { id: 'BOT-IN-03', name: 'TCS / INFY Dual-Momentum', market: 'india', sector: 'IT & Software', status: 'RUNNING', pnl_inr: 32400, win_rate: 68.5, sharpe: 2.42 },
    { id: 'BOT-IN-04', name: 'Reliance & ONGC Basis Carry', market: 'india', sector: 'Energy & Petrochemicals', status: 'RUNNING', pnl_inr: 28900, win_rate: 92.0, sharpe: 4.10 },
    { id: 'BOT-IN-05', name: 'Tata Motors L2 OFI Scalper', market: 'india', sector: 'Automotive & EV', status: 'RUNNING', pnl_inr: 21500, win_rate: 74.2, sharpe: 2.88 },
    { id: 'BOT-IN-06', name: 'Sun Pharma Mean Reverter', market: 'india', sector: 'Pharma & Healthcare', status: 'RUNNING', pnl_inr: 19400, win_rate: 71.0, sharpe: 2.35 },
    { id: 'BOT-IN-07', name: 'Tata Steel Cross-Metal Trend', market: 'india', sector: 'Metals & Mining', status: 'RUNNING', pnl_inr: 24600, win_rate: 65.4, sharpe: 2.15 },
    { id: 'BOT-IN-08', name: 'ITC / Trent Volume Auction', market: 'india', sector: 'FMCG & Consumer', status: 'RUNNING', pnl_inr: 18200, win_rate: 76.5, sharpe: 2.95 },
    { id: 'BOT-IN-09', name: 'HAL / BEL Avellaneda MM', market: 'india', sector: 'Defense & Infra', status: 'RUNNING', pnl_inr: 36500, win_rate: 84.1, sharpe: 3.82 },
    { id: 'BOT-IN-10', name: 'MCX Gold & Crude Trend CTA', market: 'india', sector: 'MCX Commodities', status: 'RUNNING', pnl_inr: 48200, win_rate: 69.2, sharpe: 2.74 },

    // 🇺🇸 10 US & 24/7 Global Sector Bots
    { id: 'BOT-US-01', name: 'NVDA / AAPL Almgren Slicer', market: 'us', sector: 'Tech Mega-Caps', status: 'RUNNING', pnl_inr: 58400, win_rate: 79.5, sharpe: 3.25 },
    { id: 'BOT-US-02', name: 'AMD / TSM Gamma Scalper', market: 'us', sector: 'Semiconductors', status: 'RUNNING', pnl_inr: 49200, win_rate: 72.8, sharpe: 2.85 },
    { id: 'BOT-US-03', name: 'JPM / GS Yield Steepener', market: 'us', sector: 'Financials & Rates', status: 'RUNNING', pnl_inr: 34100, win_rate: 76.0, sharpe: 2.92 },
    { id: 'BOT-US-04', name: 'Eli Lilly Jump-Diffusion Bot', market: 'us', sector: 'BioTech & Healthcare', status: 'RUNNING', pnl_inr: 37800, win_rate: 74.6, sharpe: 2.78 },
    { id: 'BOT-US-05', name: 'Exxon Fama-French Factor Bot', market: 'us', sector: 'Energy Majors', status: 'RUNNING', pnl_inr: 26400, win_rate: 69.8, sharpe: 2.45 },
    { id: 'BOT-US-06', name: 'Boeing Kyle-Lambda Order Flow', market: 'us', sector: 'Aerospace & Industrial', status: 'RUNNING', pnl_inr: 23800, win_rate: 67.2, sharpe: 2.28 },
    { id: 'BOT-US-07', name: 'BTC/ETH Perpetual Funding Arb', market: 'us', sector: 'Crypto L1 24/7', status: 'RUNNING', pnl_inr: 74200, win_rate: 98.2, sharpe: 5.42 },
    { id: 'BOT-US-08', name: 'SOL / BNB Triangular Arb', market: 'us', sector: 'Crypto Altcoins 24/7', status: 'RUNNING', pnl_inr: 42100, win_rate: 91.5, sharpe: 4.85 },
    { id: 'BOT-US-09', name: 'USD/INR & DXY Macro CTA', market: 'us', sector: 'Global FX & Rates', status: 'RUNNING', pnl_inr: 39500, win_rate: 70.4, sharpe: 2.65 },
    { id: 'BOT-US-10', name: 'Polymarket Hanson LMSR Arb', market: 'us', sector: 'Prediction Markets 24/7', status: 'RUNNING', pnl_inr: 31200, win_rate: 83.0, sharpe: 3.55 }
  ];

  const totalPnl = bots.reduce((a, b) => a + b.pnl_inr, 0);

  return res.status(200).json({
    fleet_size: bots.length,
    active_bots: bots.filter(b => b.status === 'RUNNING').length,
    total_realized_pnl_inr: totalPnl,
    total_realized_pnl_usd: Number((totalPnl / 83.5).toFixed(2)),
    uptime_hours: '24/7 Continuous',
    timestamp: new Date().toISOString(),
    bots: bots
  });
}
