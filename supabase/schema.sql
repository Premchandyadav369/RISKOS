-- =====================================================================
-- RISKOS Enterprise Quantitative Platform — Supabase SQL Migration
-- Project: https://wqqncnoqwoojmxdwvhai.supabase.co
-- Includes: Auth Hooks, RLS Policies, pgvector, Realtime & Notifications
-- =====================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_mode TEXT DEFAULT 'investor' CHECK (user_mode IN ('beginner', 'investor', 'quant')),
  currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'USD')),
  market_region TEXT DEFAULT 'IN' CHECK (market_region IN ('IN', 'US')),
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "phone": true,
    "high_impact_news": true,
    "var_breach": true,
    "trade_fills": true
  }'::jsonb,
  risk_parameters JSONB DEFAULT '{
    "max_drawdown_pct": 15,
    "var_limit_inr": 200000,
    "confidence_level": 0.99
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Portfolios & Transactions Ledger
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Primary Institutional Portfolio',
  base_currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolio_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  fee NUMERIC DEFAULT 0,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Multi-Asset Watchlists
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Core Watchlist',
  symbols TEXT[] NOT NULL DEFAULT '{"RELIANCE", "TCS", "HDFCBANK", "INFY", "AAPL", "NVDA"}',
  is_default BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Institutional Paper Trading Sandbox State
CREATE TABLE IF NOT EXISTS public.paper_trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cash_balance NUMERIC NOT NULL DEFAULT 1000000.00,
  positions JSONB DEFAULT '[]'::jsonb,
  orders JSONB DEFAULT '[]'::jsonb,
  trade_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. News Intelligence Bookmarks & Alpha Vantage Research Catalysts
CREATE TABLE IF NOT EXISTS public.news_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  published_at TEXT,
  overall_sentiment NUMERIC,
  event_type TEXT,
  materiality_score NUMERIC,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Quantitative Event & Price Alerts
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('PRICE', 'VAR', 'VOLATILITY', 'NEWS_CATALYST')),
  condition TEXT NOT NULL CHECK (condition IN ('ABOVE', 'BELOW', 'CROSSES')),
  threshold_value NUMERIC,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_phone BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Trail of Email & Phone Notification Dispatches
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'PHONE', 'IN_APP')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'DELIVERED',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. pgvector Financial Narrative & Event Analogue Table
CREATE TABLE IF NOT EXISTS public.market_event_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT,
  sector TEXT,
  ticker TEXT,
  embedding VECTOR(1536),
  historical_reaction JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Ultra-Fast Cosine Similarity Search
CREATE INDEX IF NOT EXISTS market_event_embeddings_hnsw_idx 
ON public.market_event_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Cosine Distance Matching Stored Function
CREATE OR REPLACE FUNCTION public.match_market_events (
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.70,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  event_title TEXT,
  event_type TEXT,
  summary TEXT,
  sector TEXT,
  ticker TEXT,
  historical_reaction JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.event_title,
    m.event_type,
    m.summary,
    m.sector,
    m.ticker,
    m.historical_reaction,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.market_event_embeddings m
  WHERE 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 10. Automated Profile Provisioning Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create initial default portfolio and watchlist
  INSERT INTO public.portfolios (user_id, name)
  VALUES (NEW.id, 'Primary Institutional Portfolio');
  
  INSERT INTO public.watchlists (user_id, name)
  VALUES (NEW.id, 'Core Watchlist');

  INSERT INTO public.paper_trading_accounts (user_id, cash_balance)
  VALUES (NEW.id, 1000000.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_event_embeddings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Portfolios
CREATE POLICY "Users manage own portfolios" 
  ON public.portfolios FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users manage own transactions" 
  ON public.portfolio_transactions FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Watchlists
CREATE POLICY "Users manage own watchlists" 
  ON public.watchlists FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Paper Trading Accounts
CREATE POLICY "Users manage own paper trading" 
  ON public.paper_trading_accounts FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- News Bookmarks
CREATE POLICY "Users manage own news bookmarks" 
  ON public.news_bookmarks FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- User Alerts
CREATE POLICY "Users manage own alerts" 
  ON public.user_alerts FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Notifications Log
CREATE POLICY "Users view own notification logs" 
  ON public.notifications_log FOR SELECT 
  USING (auth.uid() = user_id);

-- Market Event Embeddings: Publicly readable for quants, protected insert
CREATE POLICY "Authenticated users can read market embeddings" 
  ON public.market_event_embeddings FOR SELECT 
  TO authenticated 
  USING (true);

-- 12. Enable Realtime Replication for High-Frequency Desks
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_trading_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_log;
