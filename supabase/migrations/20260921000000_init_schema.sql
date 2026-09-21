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

-- 5. Virtual Paper Trading Accounts & Positions
CREATE TABLE IF NOT EXISTS public.paper_trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cash_balance NUMERIC DEFAULT 1000000 CHECK (cash_balance >= 0),
  initial_capital NUMERIC DEFAULT 1000000,
  currency TEXT DEFAULT 'INR',
  positions JSONB DEFAULT '{}'::jsonb,
  order_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. News Bookmarks & Saved Catalysts
CREATE TABLE IF NOT EXISTS public.news_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  source TEXT,
  url TEXT,
  materiality_score NUMERIC,
  sentiment_label TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 7. Quantitative & Risk Alerts
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('PRICE_BARRIER', 'VAR_BREACH', 'NEWS_CATALYST', 'BOT_EXECUTION')),
  symbol TEXT,
  threshold NUMERIC,
  direction TEXT CHECK (direction IN ('ABOVE', 'BELOW')),
  is_active BOOLEAN DEFAULT TRUE,
  delivery_channel TEXT DEFAULT 'EMAIL' CHECK (delivery_channel IN ('EMAIL', 'PHONE_SMS', 'IN_APP')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications Audit Log (Emails & SMS Outbox)
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'PHONE_SMS', 'IN_APP')),
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'DELIVERED' CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. pgvector Market Event Embeddings Table
CREATE TABLE IF NOT EXISTS public.market_event_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_category TEXT NOT NULL,
  headline TEXT NOT NULL,
  event_summary TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on pgvector embeddings using HNSW
CREATE INDEX IF NOT EXISTS market_event_embeddings_hnsw_idx 
ON public.market_event_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 10. Enable Row Level Security (RLS) on all user-isolated tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_event_embeddings ENABLE ROW LEVEL SECURITY;

-- 11. Define Strict Row Level Security Policies
-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can select their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Portfolios
CREATE POLICY "Users can view their own portfolios" 
ON public.portfolios FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolios" 
ON public.portfolios FOR ALL USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view their own transactions" 
ON public.portfolio_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.portfolio_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlists
CREATE POLICY "Users can view their own watchlists" 
ON public.watchlists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlists" 
ON public.watchlists FOR ALL USING (auth.uid() = user_id);

-- Paper Trading Accounts
CREATE POLICY "Users can view their own paper trading account" 
ON public.paper_trading_accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own paper trading account" 
ON public.paper_trading_accounts FOR ALL USING (auth.uid() = user_id);

-- News Bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON public.news_bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks" 
ON public.news_bookmarks FOR ALL USING (auth.uid() = user_id);

-- User Alerts
CREATE POLICY "Users can view their own alerts" 
ON public.user_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own alerts" 
ON public.user_alerts FOR ALL USING (auth.uid() = user_id);

-- Notifications Log
CREATE POLICY "Users can view their own notification history" 
ON public.notifications_log FOR SELECT USING (auth.uid() = user_id);

-- Embeddings: Read-only for authenticated and public users
CREATE POLICY "Allow public read access to embeddings" 
ON public.market_event_embeddings FOR SELECT TO authenticated, anon USING (true);

-- 12. Auto-Provisioning Profile Trigger on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.portfolios (user_id, name)
  VALUES (NEW.id, 'Primary Institutional Portfolio')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.watchlists (user_id, name, is_default)
  VALUES (NEW.id, 'Core Watchlist', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.paper_trading_accounts (user_id, cash_balance)
  VALUES (NEW.id, 1000000)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_trading_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_alerts;

-- 14. pgvector Match Stored Procedure for Semantic Market Event Search
CREATE OR REPLACE FUNCTION public.match_market_events (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  event_category TEXT,
  headline TEXT,
  event_summary TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    market_event_embeddings.id,
    market_event_embeddings.event_category,
    market_event_embeddings.headline,
    market_event_embeddings.event_summary,
    1 - (market_event_embeddings.embedding <=> query_embedding) AS similarity
  FROM market_event_embeddings
  WHERE 1 - (market_event_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
