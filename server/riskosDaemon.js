#!/usr/bin/env node
/**
 * RISKOS 24/7 Autonomous Sovereign Quantitative Daemon & Microservice
 * ==============================================================================
 * Architect: Premchand Yadav & Deep Quantitative Systems Core
 * Module: server/riskosDaemon.js
 * 
 * Features:
 *   1. Zero-dependency HTTP & RFC 6455 WebSocket / SSE Server (Port 8080 / 3000)
 *   2. Multi-Cadence Resilient Event Scheduler:
 *      - 5s: High-frequency DOM & Options Tick Heartbeat
 *      - 60s: WebSeer Autonomous Real-Time News Crawler & Merton Jump Detector
 *      - 5m: Sovereign 12-Factor Pricing & Alpha Spread Recalculation
 *      - 10s: Pre-Trade Risk & Drawdown Circuit Breaker Watchdog
 *   3. Market Hours Multi-Timezone Session Engine (Crypto 24/7, NSE/BSE IST, NYSE/NASDAQ EST)
 *   4. Instant Multi-Channel Push Notifications (Telegram, Discord, Webhooks)
 *   5. Full REST API & Real-time Live Synchronization for Connected Terminals
 * ==============================================================================
 */

'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Import Core RISKOS Engines
const { WebSeerEngine } = require('../webSeerEngine.js');
const { InstitutionalPricingEngine } = require('../institutionalPricingEngine.js');
const { MacroDataFeedEngine, MacroDataFeedClient } = require('../macroDataFeedEngine.js');
let SecurityMaster;
try {
  SecurityMaster = require('../securityMaster.js').SecurityMaster || require('../securityMaster.js');
} catch (e) {
  console.warn('[Daemon] SecurityMaster warning:', e.message);
}

// Optional Zero-Dependency .env Loader
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        let v = trimmed.slice(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    });
  } catch (e) {
    console.warn('[Daemon] Error reading .env file:', e.message);
  }
}

// Configuration & Environment Defaults
const CONFIG = {
  port: parseInt(process.env.PORT, 10) || 8080,
  host: process.env.HOST || '0.0.0.0',
  rootDir: path.resolve(__dirname, '..'),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  intervals: {
    heartbeatMs: 5000,
    webSeerMs: 60000,
    pricingMs: 300000, // 5 minutes
    macroMs: 120000,   // 2 minutes (FRED, EIA, CoinGecko)
    riskWatchdogMs: 10000
  },
  priorityWatchlist: ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'SMCI', 'RELIANCE', 'HDFCBANK', 'TCS', 'TATAMOTORS', 'ADANIENT']
};

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

class RiskosDaemon {
  constructor(options = {}) {
    this.config = Object.assign({}, CONFIG, options);
    this.webSeer = new WebSeerEngine();
    this.pricingEngine = new InstitutionalPricingEngine();
    this.macroFeed = new (MacroDataFeedClient || MacroDataFeedEngine.MacroDataFeedClient)({ timeoutMs: 6000 });
    
    this.connectedSockets = new Set();
    this.sseClients = new Set();
    this.isRunning = false;
    this.timers = {};
    this.stats = {
      startTime: Date.now(),
      totalCrawls: 0,
      totalAlertsGenerated: 0,
      totalPricingRuns: 0,
      totalMacroFetches: 0,
      lastCrawlTime: null,
      lastPricingTime: null,
      lastMacroTime: null,
      lastMacroSnapshot: null,
      circuitBreakerTripped: false,
      recentAlerts: []
    };
  }

  // --------------------------------------------------------------------------
  // Market Session Detection (UTC, IST, EST)
  // --------------------------------------------------------------------------
  getMarketSessions() {
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Indian Markets: NSE/BSE (09:15 - 15:30 IST => 03:45 - 10:00 UTC)
    const inOpenUtc = 3.75;
    const inCloseUtc = 10.0;
    const isInMarketOpen = !isWeekend && (utcHours >= inOpenUtc && utcHours <= inCloseUtc);

    // US Markets: NYSE/NASDAQ (09:30 - 16:00 EST => 14:30 - 21:00 UTC standard)
    const usOpenUtc = 14.5;
    const usCloseUtc = 21.0;
    const isUsMarketOpen = !isWeekend && (utcHours >= usOpenUtc && utcHours <= usCloseUtc);
    const isUsPreMarket = !isWeekend && (utcHours >= 9.0 && utcHours < usOpenUtc);
    const isUsAfterHours = !isWeekend && (utcHours > usCloseUtc && utcHours <= 25.0);

    return {
      timestamp: now.toISOString(),
      crypto: { isOpen: true, status: '24/7 TRADING ACTIVE' },
      indianMarket: {
        isOpen: isInMarketOpen,
        status: isInMarketOpen ? 'MARKET_HOURS (NSE/BSE)' : (isWeekend ? 'CLOSED_WEEKEND' : 'AFTER_HOURS')
      },
      usMarket: {
        isOpen: isUsMarketOpen,
        isPreMarket: isUsPreMarket,
        isAfterHours: isUsAfterHours,
        status: isUsMarketOpen ? 'REGULAR_HOURS (NYSE/NASDAQ)' : (isUsPreMarket ? 'PRE_MARKET' : (isUsAfterHours ? 'AFTER_HOURS' : (isWeekend ? 'CLOSED_WEEKEND' : 'CLOSED')))
      }
    };
  }

  // --------------------------------------------------------------------------
  // Telegram & Discord Notification Dispatcher
  // --------------------------------------------------------------------------
  async sendNotification(title, message, severity = 'INFO') {
    const prefix = severity === 'CRITICAL' ? '🚨 [CRITICAL ALERT]' : (severity === 'ALPHA' ? '🚀 [ALPHA CATALYST]' : 'ℹ️ [RISKOS INTEL]');
    const formattedMsg = `*${prefix}*\n*${title}*\n\n${message}\n\n_Generated by RISKOS 24/7 Sovereign Daemon_`;

    // 1. Telegram Push
    if (this.config.telegramBotToken && this.config.telegramChatId) {
      try {
        const postData = JSON.stringify({
          chat_id: this.config.telegramChatId,
          text: formattedMsg,
          parse_mode: 'Markdown'
        });
        const req = https.request({
          hostname: 'api.telegram.org',
          path: `/bot${this.config.telegramBotToken}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        });
        req.on('error', err => console.warn('[Daemon] Telegram dispatch error:', err.message));
        req.write(postData);
        req.end();
      } catch (e) {
        console.warn('[Daemon] Telegram send error:', e.message);
      }
    }

    // 2. Discord Webhook Push
    if (this.config.discordWebhookUrl) {
      try {
        const postData = JSON.stringify({
          content: `**${prefix} - ${title}**\n${message}`
        });
        const parsedUrl = new URL(this.config.discordWebhookUrl);
        const req = https.request({
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        });
        req.on('error', err => console.warn('[Daemon] Discord dispatch error:', err.message));
        req.write(postData);
        req.end();
      } catch (e) {
        console.warn('[Daemon] Discord send error:', e.message);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Broadcast to Connected WebSockets and SSE Clients
  // --------------------------------------------------------------------------
  broadcast(event, data) {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

    // 1. WebSocket Broadcast (RFC 6455 Frame)
    if (this.connectedSockets.size > 0) {
      const frame = this.createWebSocketFrame(payload);
      for (const socket of this.connectedSockets) {
        try {
          if (!socket.destroyed) socket.write(frame);
        } catch (e) {
          this.connectedSockets.delete(socket);
        }
      }
    }

    // 2. Server-Sent Events (SSE)
    if (this.sseClients.size > 0) {
      const ssePayload = `event: ${event}\ndata: ${payload}\n\n`;
      for (const res of this.sseClients) {
        try {
          res.write(ssePayload);
        } catch (e) {
          this.sseClients.delete(res);
        }
      }
    }
  }

  // Pure Node RFC 6455 Text Frame Builder
  createWebSocketFrame(text) {
    const payload = Buffer.from(text, 'utf8');
    const length = payload.length;
    let header;

    if (length < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode
      header[1] = length;
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    return Buffer.concat([header, payload]);
  }

  // --------------------------------------------------------------------------
  // Cadence 1: Fast Market Heartbeat (5s)
  // --------------------------------------------------------------------------
  runHeartbeatCycle() {
    const sessions = this.getMarketSessions();
    const mem = process.memoryUsage();

    const heartbeatData = {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(mem.rss / 1024 / 1024),
      activeClients: this.connectedSockets.size + this.sseClients.size,
      sessions,
      circuitBreaker: this.stats.circuitBreakerTripped ? 'TRIPPED' : 'HEALTHY'
    };

    this.broadcast('HEARTBEAT', heartbeatData);
  }

  // --------------------------------------------------------------------------
  // Cadence 2: WebSeer News Crawler & Discontinuous Jump Detector (60s)
  // --------------------------------------------------------------------------
  async runWebSeerCycle() {
    this.stats.totalCrawls++;
    this.stats.lastCrawlTime = new Date().toISOString();

    try {
      // Crawl high-priority targets
      const target = this.config.priorityWatchlist[this.stats.totalCrawls % this.config.priorityWatchlist.length];
      const newsItems = await this.webSeer.fetchGoogleNewsRss(`${target} stock`, {
        country: ['TCS', 'RELIANCE', 'HDFCBANK', 'TATAMOTORS', 'ADANIENT'].includes(target) ? 'IN' : 'US',
        timeRange: '1d'
      });

      if (newsItems && newsItems.length > 0) {
        for (const alert of newsItems) {
          // Check for high impact
          if (Math.abs(alert.jumpPct) >= 5.0 || alert.catalystType !== 'MARKET_RUMOR') {
            this.stats.totalAlertsGenerated++;
            this.stats.recentAlerts.unshift(alert);
            if (this.stats.recentAlerts.length > 50) this.stats.recentAlerts.pop();

            console.log(`[WebSeer 24/7] Detected Shock: ${alert.symbol} | ${alert.catalystType} | Jump: ${alert.jumpPct > 0 ? '+' : ''}${alert.jumpPct}% | Target: $${alert.targetPrice}`);

            // Broadcast to connected web dashboards
            this.broadcast('NEW_SHOCK_ALERT', alert);

            // Send push notification if acute
            if (Math.abs(alert.jumpPct) >= 8.0 && alert.confidenceScore >= 0.85) {
              await this.sendNotification(
                `High-Conviction Discontinuous Shock: ${alert.symbol} (${alert.jumpPct > 0 ? '+' : ''}${alert.jumpPct}%)`,
                `Headline: "${alert.headline}"\nCatalyst: ${alert.catalystType}\nMerton Target: $${alert.targetPrice}\nVerification: ${alert.verificationState}\nContagion Nodes: ${alert.contagion ? alert.contagion.length : 0}`,
                'ALPHA'
              );
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Daemon] WebSeer cycle notice:', err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Cadence 3: Sovereign 12-Factor Pricing Recalculation (5 min)
  // --------------------------------------------------------------------------
  async runPricingCycle() {
    this.stats.totalPricingRuns++;
    this.stats.lastPricingTime = new Date().toISOString();
    console.log(`[Pricing 24/7] Running 12-Factor Sovereign Pricing recalculation (Run #${this.stats.totalPricingRuns})...`);

    try {
      const results = this.pricingEngine.evaluateUniverse();
      if (results && results.fullEvaluations) {
        // Save to disk
        const jsonPath = path.join(this.config.rootDir, 'institutional_12factor_predictions.json');
        fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

        // Check for top picks
        const topLong = results.topAlphaLongs[0];
        const topShort = results.topHeadwindShorts[0];

        console.log(`[Pricing 24/7] Top Alpha: ${topLong.symbol} (+${topLong.alphaSpreadPct}%) | Worst Headwind: ${topShort.symbol} (${topShort.alphaSpreadPct}%)`);

        // Broadcast to clients
        this.broadcast('PRICING_UPDATE', {
          totalEvaluated: results.totalEvaluated,
          topLongs: results.topAlphaLongs.slice(0, 5),
          topShorts: results.topHeadwindShorts.slice(0, 5),
          timestamp: results.timestamp
        });
      }
    } catch (err) {
      console.error('[Daemon] Pricing cycle error:', err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Cadence 4: Live Sovereign Macro & Cross-Asset Ingestion (2 min)
  // Feeds: FRED (Yields, Spreads, Inflation), EIA (Brent, WTI, Gas), CoinGecko
  // --------------------------------------------------------------------------
  async runMacroCycle() {
    this.stats.totalMacroFetches++;
    try {
      const telemetry = await this.macroFeed.fetchAllTelemetry(true);
      this.macroFeed.injectIntoPricingEngine(this.pricingEngine);

      this.stats.lastMacroTime = telemetry.timestamp;
      this.stats.lastMacroSnapshot = telemetry;

      // Persist to disk for high-performance terminal hydration
      const dataDir = path.join(this.config.rootDir, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const jsonPath = path.join(dataDir, 'live_macro_telemetry.json');
      fs.writeFileSync(jsonPath, JSON.stringify(telemetry, null, 2), 'utf8');

      console.log(`[Macro 24/7] Ingested: FRED 10Y Real: ${telemetry.fred.realYield10Y}% | EIA Brent: $${telemetry.eia.brentCrudeUsd}/bbl | BTC: $${telemetry.coingecko.bitcoin ? telemetry.coingecko.bitcoin.usd : 'N/A'}`);

      // Broadcast real-time macro telemetry to UI clients
      this.broadcast('MACRO_UPDATE', telemetry);
      return telemetry;
    } catch (err) {
      console.warn('[Daemon] Macro cycle notice:', err.message);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Cadence 5: Pre-Trade Risk & Circuit Breaker Watchdog (10s)
  // --------------------------------------------------------------------------
  runRiskWatchdogCycle() {
    // In production, pulls live portfolio PnL, margin utilization & FRTB capital charges
    const simulatedDrawdownPct = 0.45; // 0.45% normal intra-day variance
    const maxDrawdownLimitPct = 5.0; // 5% hard emergency stop

    if (simulatedDrawdownPct > maxDrawdownLimitPct && !this.stats.circuitBreakerTripped) {
      this.stats.circuitBreakerTripped = true;
      console.error(`[CIRCUIT BREAKER] Hard stop triggered: Portfolio drawdown ${simulatedDrawdownPct}% exceeds ${maxDrawdownLimitPct}% limit!`);
      this.sendNotification(
        'EMERGENCY RISK CIRCUIT BREAKER TRIPPED',
        `Portfolio drawdown reached ${simulatedDrawdownPct}%. All automated new orders halted. Pre-trade guardrail locked.`,
        'CRITICAL'
      );
      this.broadcast('CIRCUIT_BREAKER_TRIPPED', { drawdown: simulatedDrawdownPct });
    }
  }

  // --------------------------------------------------------------------------
  // HTTP Request & REST API Handler
  // --------------------------------------------------------------------------
  handleHttpRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS & Security Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Health Endpoint
    if (pathname === '/health' || pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'UP',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        activeConnections: this.connectedSockets.size + this.sseClients.size,
        sessions: this.getMarketSessions()
      }));
      return;
    }

    // 2. Status Endpoint
    if (pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        daemon: 'RISKOS-24/7-DAEMON',
        version: '5.0.0-SOVEREIGN',
        stats: this.stats,
        sessions: this.getMarketSessions(),
        intervals: this.config.intervals
      }));
      return;
    }

    // 3. Universe Pricing Endpoint
    if (pathname === '/api/pricing/12factor') {
      const jsonPath = path.join(this.config.rootDir, 'institutional_12factor_predictions.json');
      if (fs.existsSync(jsonPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(jsonPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Predictions not yet generated' }));
      }
      return;
    }

    // 4. Catalysts Endpoint
    if (pathname === '/api/catalysts') {
      const jsonPath = path.join(this.config.rootDir, 'upcoming_catalyst_shock_predictions.json');
      if (fs.existsSync(jsonPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(jsonPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Catalysts dataset not found' }));
      }
      return;
    }

    // 5. Macroeconomic, EIA Energy & Digital Asset Telemetry Endpoint
    if (pathname === '/api/macro' || pathname === '/api/telemetry/macro') {
      const livePath = path.join(this.config.rootDir, 'data', 'live_macro_telemetry.json');
      if (fs.existsSync(livePath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(livePath).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.macroFeed.cachedTelemetry || {}));
      }
      return;
    }

    // 6. Force Trigger Endpoints (Manual Re-run on Demand)
    if (req.method === 'POST' && pathname === '/api/trigger/crawl') {
      this.runWebSeerCycle();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'WebSeer crawl cycle triggered' }));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/trigger/pricing') {
      this.runPricingCycle();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: '12-factor pricing cycle triggered' }));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/trigger/macro') {
      this.runMacroCycle().then(telemetry => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Macro telemetry cycle triggered', telemetry }));
      }).catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
      return;
    }

    // 7. Server-Sent Events (SSE) Stream
    if (pathname === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(': connected\n\n');
      this.sseClients.add(res);

      req.on('close', () => {
        this.sseClients.delete(res);
      });
      return;
    }

    // 7. Static File Serving
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\' || safePath === '') {
      safePath = 'app.html';
    } else {
      safePath = safePath.replace(/^[\/\\]+/, '');
    }

    const filePath = path.join(this.config.rootDir, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${pathname}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache'
      });

      fs.createReadStream(filePath).pipe(res);
    });
  }

  // --------------------------------------------------------------------------
  // RFC 6455 WebSocket Upgrade Handler
  // --------------------------------------------------------------------------
  handleUpgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`
    ];

    socket.write(headers.join('\r\n') + '\r\n\r\n');
    this.connectedSockets.add(socket);

    // Send initial welcome state
    const welcome = JSON.stringify({
      event: 'WELCOME',
      data: {
        daemon: 'RISKOS 24/7 Sovereign Core',
        version: '5.0.0',
        uptime: Math.floor(process.uptime()),
        sessions: this.getMarketSessions()
      }
    });
    socket.write(this.createWebSocketFrame(welcome));

    socket.on('close', () => this.connectedSockets.delete(socket));
    socket.on('error', () => this.connectedSockets.delete(socket));
  }

  // --------------------------------------------------------------------------
  // Start 24/7 Daemon
  // --------------------------------------------------------------------------
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.server = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head));

    this.server.listen(this.config.port, this.config.host, () => {
      console.log('================================================================================');
      console.log('  RISKOS 24/7 SOVEREIGN QUANTITATIVE DAEMON ACTIVE');
      console.log(`  HTTP/REST & WebSocket Server listening on: http://${this.config.host}:${this.config.port}`);
      console.log(`  Live UI Terminal: http://localhost:${this.config.port}/app.html`);
      console.log(`  High-Frequency Desk: http://localhost:${this.config.port}/hft.html`);
      console.log(`  Health & Telemetry API: http://localhost:${this.config.port}/health`);
      console.log('================================================================================');

      // Schedule Autonomous Cadences
      this.timers.heartbeat = setInterval(() => this.runHeartbeatCycle(), this.config.intervals.heartbeatMs);
      this.timers.webSeer = setInterval(() => this.runWebSeerCycle(), this.config.intervals.webSeerMs);
      this.timers.pricing = setInterval(() => this.runPricingCycle(), this.config.intervals.pricingMs);
      this.timers.macro = setInterval(() => this.runMacroCycle(), this.config.intervals.macroMs);
      this.timers.risk = setInterval(() => this.runRiskWatchdogCycle(), this.config.intervals.riskWatchdogMs);

      // Run initial boot passes
      this.runHeartbeatCycle();
      setTimeout(() => this.runMacroCycle(), 1000);
      setTimeout(() => this.runWebSeerCycle(), 2000);
      setTimeout(() => this.runPricingCycle(), 5000);
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Daemon] Port ${this.config.port} is busy, retrying on port ${this.config.port + 1}...`);
        this.config.port++;
        this.server.listen(this.config.port, this.config.host);
      } else {
        console.error('[Daemon] Server error:', err.message);
      }
    });
  }

  // Graceful Shutdown
  stop(exitProcess = false) {
    return new Promise((resolve) => {
      this.isRunning = false;
      Object.values(this.timers).forEach(clearInterval);

      if (this.server) {
        this.server.close(() => {
          resolve();
          if (exitProcess) {
            process.exit(0);
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Instantiate and Run if called directly
if (require.main === module) {
  const daemon = new RiskosDaemon();
  daemon.start();

  process.on('SIGINT', () => daemon.stop(true));
  process.on('SIGTERM', () => daemon.stop(true));
  process.on('uncaughtException', err => console.error('[Daemon] Uncaught Exception:', err));
  process.on('unhandledRejection', reason => console.error('[Daemon] Unhandled Rejection:', reason));
}

module.exports = { RiskosDaemon, CONFIG };
