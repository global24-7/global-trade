-- =============================================
-- GLOBAL TRADE — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- ---- Extensions ----
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password      TEXT NOT NULL,           -- store hashed in production
  wallet_balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
  unique_code   TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Investment Packages (luxury cars)
CREATE TABLE IF NOT EXISTS public.packages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  invest_amount  NUMERIC(12,2) NOT NULL,
  return_amount  NUMERIC(12,2) NOT NULL,
  duration_days  INTEGER NOT NULL,
  roi            TEXT NOT NULL,
  img            TEXT,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Investment Plans (timer-based)
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  invest_amount  NUMERIC(12,2) NOT NULL,
  interest_pct   NUMERIC(6,2) NOT NULL,
  duration_hours INTEGER NOT NULL,
  img            TEXT,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Car Package Investments (user-made)
CREATE TABLE IF NOT EXISTS public.investments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id            UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name          TEXT NOT NULL,
  invest_amount         NUMERIC(12,2) NOT NULL,
  return_amount         NUMERIC(12,2) NOT NULL,
  duration_days         INTEGER NOT NULL,
  start_date            TIMESTAMPTZ NOT NULL,
  end_date              TIMESTAMPTZ NOT NULL,
  status                TEXT DEFAULT 'active' CHECK (status IN ('active','completed')),
  withdrawal_requested  BOOLEAN DEFAULT false,
  withdrawal_status     TEXT DEFAULT 'none' CHECK (withdrawal_status IN ('none','pending','approved','rejected')),
  withdrawal_date       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Plan Investments (timer-based)
CREATE TABLE IF NOT EXISTS public.plan_investments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id        UUID REFERENCES public.investment_plans(id) ON DELETE SET NULL,
  plan_name      TEXT NOT NULL,
  invest_amount  NUMERIC(12,2) NOT NULL,
  interest_pct   NUMERIC(6,2) NOT NULL,
  profit         NUMERIC(12,2) NOT NULL,
  admin_fee      NUMERIC(12,2) NOT NULL,
  user_return    NUMERIC(12,2) NOT NULL,
  duration_hours INTEGER NOT NULL,
  start_date     TIMESTAMPTZ NOT NULL,
  end_date       TIMESTAMPTZ NOT NULL,
  img            TEXT,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','ready','collected')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- deposit | deposit_pending | investment | plan_investment | plan_return | withdrawal_pending | withdrawal_approved | admin_adjustment
  amount      NUMERIC(12,2) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Deposit Requests (manual Telecel Cash)
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id             TEXT PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name      TEXT,
  user_code      TEXT,
  amount         NUMERIC(12,2) NOT NULL,
  method         TEXT DEFAULT 'Telecel',
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  screenshot_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email        ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_code         ON public.users(unique_code);
CREATE INDEX IF NOT EXISTS idx_investments_user   ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_planinvs_user      ON public.plan_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_txs_user           ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user      ON public.deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status    ON public.deposit_requests(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_investments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests  ENABLE ROW LEVEL SECURITY;

-- NOTE: This app uses its own auth (not Supabase Auth), so we allow
-- anon access and rely on the application layer for access control.
-- In production you should upgrade to Supabase Auth + proper JWT policies.

-- Packages & Plans: public read, anon write (admin manages via service role)
CREATE POLICY "packages_read"   ON public.packages         FOR SELECT USING (true);
CREATE POLICY "packages_write"  ON public.packages         FOR ALL    USING (true);
CREATE POLICY "plans_read"      ON public.investment_plans FOR SELECT USING (true);
CREATE POLICY "plans_write"     ON public.investment_plans FOR ALL    USING (true);

-- Users: full access via anon key (app-layer auth)
CREATE POLICY "users_all"       ON public.users            FOR ALL    USING (true);

-- Investments, Plan Investments, Transactions, Deposits: open via anon key
CREATE POLICY "investments_all"    ON public.investments       FOR ALL USING (true);
CREATE POLICY "planinvs_all"       ON public.plan_investments  FOR ALL USING (true);
CREATE POLICY "transactions_all"   ON public.transactions      FOR ALL USING (true);
CREATE POLICY "deposits_all"       ON public.deposit_requests  FOR ALL USING (true);

-- ============================================================
-- STORAGE BUCKET (run manually in Supabase Dashboard)
-- ============================================================
-- 1. Go to Storage → Create Bucket
-- 2. Name: screenshots
-- 3. Public: YES (so screenshot URLs are viewable by admin)
-- 4. Add policy: allow anon INSERT and SELECT

-- =============================================
-- SEED DATA (optional — app seeds on first load)
-- =============================================
-- The app auto-inserts default packages/plans when the tables are empty.
-- You can also manually insert here if preferred.
