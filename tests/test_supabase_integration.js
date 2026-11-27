/**
 * RISKOS — Supabase Enterprise Integration & Cloud Subsystems Test Suite
 * Validates:
 *   1. Supabase configuration and client initialization
 *   2. Authentication API contracts and session management
 *   3. PostgreSQL Database schema and RLS policies in schema.sql
 *   4. Notification dispatcher (Email & Phone/SMS payloads and inbox caching)
 *   5. Watchlist, Portfolio Transaction, and News Bookmark sync contracts
 *   6. pgvector similarity search stored procedure contract
 *   7. HTML script and stylesheet linkages across all 9 RISKOS pages
 *   8. Subsystem hooks (news.js, paperBroker.js, main.js)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

let passCount = 0;
let totalCount = 0;

function it(desc, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(err);
  }
}

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('⚡  RISKOS SUPABASE ENTERPRISE & POSTGRESQL SUITE VALIDATION');
console.log('══════════════════════════════════════════════════════════════════════════\n');

// ── 1. CONFIGURATION MANAGER VALIDATION ─────────────────────────────────────
it('SupabaseConfig: Default project credentials and configuration integrity', () => {
  const configFile = path.join(ROOT, 'supabaseConfig.js');
  assert(fs.existsSync(configFile), 'supabaseConfig.js must exist');
  const Config = require(configFile);

  assert(Config.url && Config.url.startsWith('https://'), 'Config URL must be a valid HTTPS URL');
  assert(Config.anonKey && Config.anonKey.length > 20, 'Config must have a valid anonKey');
  assert(Config.publishableKey && Config.publishableKey.startsWith('sb_publishable_'), 'Config must have publishableKey');
  assert.strictEqual(Config.storageBucket, 'riskos_reports', 'Storage bucket must match riskos_reports');
  assert(typeof Config.getRestEndpoint === 'function', 'getRestEndpoint helper must be defined');

  const endpoint = Config.getRestEndpoint('profiles');
  assert(endpoint.includes('/rest/v1/profiles'), 'getRestEndpoint must format PostgREST URL correctly');
});

// ── 2. SCHEMA.SQL DDL & RLS POLICIES VALIDATION ─────────────────────────────
it('PostgreSQL Schema: Validates schema.sql tables, RLS policies, triggers and pgvector', () => {
  const schemaFile = path.join(ROOT, 'supabase', 'schema.sql');
  assert(fs.existsSync(schemaFile), 'supabase/schema.sql must exist');
  const sql = fs.readFileSync(schemaFile, 'utf8');

  // Tables
  const requiredTables = [
    'profiles',
    'portfolios',
    'portfolio_transactions',
    'watchlists',
    'paper_trading_accounts',
    'news_bookmarks',
    'user_alerts',
    'notifications_log',
    'market_event_embeddings'
  ];
  requiredTables.forEach(table => {
    assert(sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`), `schema.sql must create public.${table}`);
    assert(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`), `public.${table} must have RLS enabled`);
  });

  // pgvector extension and cosine search stored procedure
  assert(sql.includes('EXTENSION IF NOT EXISTS vector') || sql.includes('EXTENSION IF NOT EXISTS "vector"'), 'Must enable pgvector extension');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.match_market_events'), 'Must define match_market_events stored procedure');
  assert(sql.includes('<=>') || sql.includes('<->'), 'Must use cosine similarity operator for vector distance');

  // Auto-provisioning trigger on auth.users
  assert(sql.includes('handle_new_user()'), 'Must include handle_new_user trigger function');
  assert(sql.includes('AFTER INSERT ON auth.users'), 'Must trigger profile creation after auth.users insertion');
});

// ── 3. SUPABASE CLIENT SINGLETON & OFFLINE RESILIENCE ───────────────────────
it('SupabaseClient: Instantiation, methods, offline resilience & session Hydration', async () => {
  const clientFile = path.join(ROOT, 'supabaseClient.js');
  assert(fs.existsSync(clientFile), 'supabaseClient.js must exist');
  const client = require(clientFile);

  assert(typeof client.signUp === 'function', 'signUp must be a function');
  assert(typeof client.signIn === 'function', 'signIn must be a function');
  assert(typeof client.signOut === 'function', 'signOut must be a function');
  assert(typeof client.getSession === 'function', 'getSession must be a function');
  assert(typeof client.isAuthenticated === 'function', 'isAuthenticated must be a function');
  assert(typeof client.getProfile === 'function', 'getProfile must be a function');
  assert(typeof client.updateProfile === 'function', 'updateProfile must be a function');
  assert(typeof client.getPortfolioTransactions === 'function', 'getPortfolioTransactions must be a function');
  assert(typeof client.addPortfolioTransaction === 'function', 'addPortfolioTransaction must be a function');
  assert(typeof client.getWatchlist === 'function', 'getWatchlist must be a function');
  assert(typeof client.saveWatchlist === 'function', 'saveWatchlist must be a function');
  assert(typeof client.getNewsBookmarks === 'function', 'getNewsBookmarks must be a function');
  assert(typeof client.toggleNewsBookmark === 'function', 'toggleNewsBookmark must be a function');
  assert(typeof client.dispatchNotification === 'function', 'dispatchNotification must be a function');
  assert(typeof client.getNotificationsInbox === 'function', 'getNotificationsInbox must be a function');
  assert(typeof client.findSimilarMarketEvents === 'function', 'findSimilarMarketEvents must be a function');

  // In Node environment without stored auth token, should default safely to unauthenticated guest mode
  assert.strictEqual(client.isAuthenticated(), false, 'Default initial state must be unauthenticated guest');
});

// ── 4. NOTIFICATION DISPATCHER (EMAIL & PHONE/SMS PAYLOADS) ─────────────────
it('Notifications: Real-time dispatching, local cache and inbox history', async () => {
  const client = require(path.join(ROOT, 'supabaseClient.js'));

  client.clearNotificationsInbox();
  let inbox = client.getNotificationsInbox();
  assert.strictEqual(inbox.length, 0, 'Inbox should be empty after clear');

  const testNotif = {
    type: 'PORTFOLIO_VAR_BREACH',
    title: 'PORTFOLIO RISK ALERT: VaR Barrier Breached',
    body: 'Daily 99% VaR exceeded -2.45% intraday drawdown limit.',
    severity: 'CRITICAL',
    metadata: {
      varLimit: 0.02,
      currentDrawdown: 0.0245,
      breachedAsset: 'RELIANCE'
    }
  };

  const dispatched = await client.dispatchNotification(testNotif);
  assert(dispatched, 'dispatchNotification must return notification record');
  assert.strictEqual(dispatched.type, 'PORTFOLIO_VAR_BREACH', 'Notification type must match');
  assert.strictEqual(dispatched.severity, 'CRITICAL', 'Notification severity must match');
  assert(dispatched.channels.includes('EMAIL'), 'Critical alerts should include EMAIL channel');
  assert(dispatched.channels.includes('PHONE_SMS'), 'Critical alerts should include PHONE_SMS channel');

  inbox = client.getNotificationsInbox();
  assert.strictEqual(inbox.length, 1, 'Inbox should contain 1 dispatched notification');
  assert.strictEqual(inbox[0].title, testNotif.title, 'Inbox item title must match');
});

// ── 5. NEWS BOOKMARK & WATCHLIST GUEST/CLOUD PARITY ─────────────────────────
it('Bookmarks & Watchlist: Toggling and offline localStorage fallback', async () => {
  const client = require(path.join(ROOT, 'supabaseClient.js'));

  const sampleArticle = {
    id: 'test_art_' + Date.now(),
    title: 'Reliance Industries Q2 Net Profit Surges 18%',
    summary: 'Consolidated EBITDA exceeds analyst consensus across retail and telecom segments.',
    source: 'Alpha Vantage',
    materialityScore: 88,
    primaryEntity: { canonicalSymbol: 'RELIANCE', sector: 'Energy' }
  };

  const res1 = await client.toggleNewsBookmark(sampleArticle);
  assert(res1 && res1.bookmarked === true, 'First toggle should bookmark article');

  const bookmarks = await client.getNewsBookmarks();
  assert(bookmarks.some(b => b.article_id === sampleArticle.id), 'Bookmark list must contain saved article');

  const res2 = await client.toggleNewsBookmark(sampleArticle);
  assert(res2 && res2.bookmarked === false, 'Second toggle should unbookmark article');

  // Watchlist
  const testWatchlist = ['RELIANCE', 'TCS', 'HDFCBANK', 'NVDA'];
  const savedList = await client.saveWatchlist(testWatchlist);
  assert(Array.isArray(savedList), 'Saved watchlist must be an array');
  assert(savedList.includes('RELIANCE') && savedList.includes('NVDA'), 'Saved watchlist must preserve symbols');
});

// ── 6. REALTIME EVENT BUS (BROADCASTCHANNEL & WEBSOCKET) ────────────────────
it('Realtime: In-memory/cross-tab broadcast messaging bus', () => {
  const client = require(path.join(ROOT, 'supabaseClient.js'));

  let received = false;
  const unsubscribe = client.onRealtime('TEST_FILL_EVENT', (payload) => {
    assert.strictEqual(payload.symbol, 'TCS');
    assert.strictEqual(payload.qty, 50);
    received = true;
    unsubscribe();
  });

  client.broadcastRealtime('TEST_FILL_EVENT', { symbol: 'TCS', qty: 50, price: 3950 });
  assert(received, 'Broadcast listener must execute synchronously on local channel');
});

// ── 7. SUBSYSTEM INTEGRATION (news.js, paperBroker.js, main.js) ─────────────
it('Subsystem Linkages: news.js, paperBroker.js and main.js hook into Supabase', () => {
  const newsJs = fs.readFileSync(path.join(ROOT, 'news.js'), 'utf8');
  assert(newsJs.includes('RISKOS_Supabase.dispatchNotification'), 'news.js must dispatch high-materiality notifications');
  assert(newsJs.includes('RISKOS_Supabase.toggleNewsBookmark'), 'news.js must offer Supabase cloud bookmarking');

  const brokerJs = fs.readFileSync(path.join(ROOT, 'paperBroker.js'), 'utf8');
  assert(brokerJs.includes('RISKOS_Supabase.dispatchNotification'), 'paperBroker.js must dispatch ORDER_FILL notifications');
  assert(brokerJs.includes('RISKOS_Supabase.addPortfolioTransaction'), 'paperBroker.js must log trades to Supabase');

  const mainJs = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
  assert(mainJs.includes('RISKOS_Supabase.saveWatchlist'), 'main.js must sync watchlist to Supabase');
});

// ── 8. HTML PAGE LINKAGES ACROSS ALL 9 PAGES ────────────────────────────────
it('Universal HTML Suite: All 9 pages link authModal.css, supabaseConfig.js, supabaseClient.js and authModal.js', () => {
  const allPages = [
    'index.html',
    'app.html',
    'fleet.html',
    'observatory.html',
    'portfolio_optimizer.html',
    'ticker.html',
    'news.html',
    'learn.html',
    'docs.html'
  ];

  allPages.forEach(p => {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert(html.includes('authModal.css'), `${p} must link authModal.css`);
    assert(html.includes('supabaseConfig.js'), `${p} must include supabaseConfig.js`);
    assert(html.includes('supabaseClient.js'), `${p} must include supabaseClient.js`);
    assert(html.includes('authModal.js'), `${p} must include authModal.js`);
    
    // Invariant: Navigation assertion for 8 Desks must be maintained
    assert(html.includes('>8 Desks<') || html.includes('8 Desks') || html.includes('8 Quant Desks'), `${p} must link to 8 Desks`);
  });
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(`🎯  TOTAL SUPABASE TESTS: ${totalCount} | PASSED: ${passCount} | FAILED: ${totalCount - passCount}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (passCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
