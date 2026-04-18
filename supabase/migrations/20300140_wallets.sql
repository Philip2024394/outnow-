-- ══════════════════════════════════════════════════════════════════════════════
-- Indoo Universal Wallet — Supabase tables
-- One wallet per user across all services
-- 10% flat commission, Rp 50k debt limit (scales with history)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Wallets table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance       BIGINT NOT NULL DEFAULT 0,
  commission_owed BIGINT NOT NULL DEFAULT 0,
  debt_limit    BIGINT NOT NULL DEFAULT 50000,
  total_earned  BIGINT NOT NULL DEFAULT 0,
  total_commission_paid BIGINT NOT NULL DEFAULT 0,
  total_orders  INT NOT NULL DEFAULT 0,
  free_orders_left INT NOT NULL DEFAULT 3,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'blocked')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Wallet transactions table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id     UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN (
    'top_up', 'commission_paid', 'commission_owed', 'free_order',
    'admin_credit', 'admin_debit', 'refund', 'withdrawal'
  )),
  service       TEXT CHECK (service IN (
    'marketplace', 'rental', 'food', 'ride_bike', 'ride_car', 'dating', 'massage'
  )),
  order_id      TEXT,
  amount        BIGINT NOT NULL DEFAULT 0,
  commission    BIGINT NOT NULL DEFAULT 0,
  balance_after BIGINT NOT NULL DEFAULT 0,
  debt_after    BIGINT NOT NULL DEFAULT 0,
  note          TEXT,
  admin_id      UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_service ON wallet_transactions(service);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

-- ── Auto-update updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_updated
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();

-- ── RPC: Get or create wallet ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_or_create_wallet(p_user_id UUID)
RETURNS wallets AS $$
DECLARE
  w wallets;
BEGIN
  SELECT * INTO w FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id) VALUES (p_user_id) RETURNING * INTO w;
  END IF;
  RETURN w;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: Process commission ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_wallet_commission(
  p_user_id UUID,
  p_service TEXT,
  p_order_id TEXT,
  p_order_amount BIGINT
)
RETURNS JSON AS $$
DECLARE
  w wallets;
  commission BIGINT;
  from_wallet BIGINT;
  remaining BIGINT;
  result JSON;
BEGIN
  SELECT * INTO w FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id) VALUES (p_user_id) RETURNING * INTO w;
  END IF;

  commission := ROUND(p_order_amount * 0.10);

  -- Free orders
  IF w.free_orders_left > 0 THEN
    UPDATE wallets SET
      free_orders_left = free_orders_left - 1,
      total_orders = total_orders + 1,
      total_earned = total_earned + p_order_amount
    WHERE id = w.id RETURNING * INTO w;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, service, order_id, amount, commission, balance_after, debt_after, note)
    VALUES (w.id, p_user_id, 'free_order', p_service, p_order_id, p_order_amount, 0, w.balance, w.commission_owed,
      'Free order (' || w.free_orders_left || ' left)');

    result := json_build_object('success', true, 'free', true, 'free_left', w.free_orders_left, 'commission', 0);
    RETURN result;
  END IF;

  -- Deduct from wallet balance
  IF w.balance >= commission THEN
    UPDATE wallets SET
      balance = balance - commission,
      total_commission_paid = total_commission_paid + commission,
      total_orders = total_orders + 1,
      total_earned = total_earned + p_order_amount
    WHERE id = w.id RETURNING * INTO w;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, service, order_id, amount, commission, balance_after, debt_after, note)
    VALUES (w.id, p_user_id, 'commission_paid', p_service, p_order_id, p_order_amount, commission, w.balance, w.commission_owed,
      'Auto-deducted from wallet');

    result := json_build_object('success', true, 'free', false, 'deducted', true, 'commission', commission, 'balance', w.balance);
    RETURN result;
  END IF;

  -- Partial deduct + debt
  from_wallet := w.balance;
  remaining := commission - from_wallet;

  UPDATE wallets SET
    balance = 0,
    commission_owed = commission_owed + remaining,
    total_commission_paid = total_commission_paid + from_wallet,
    total_orders = total_orders + 1,
    total_earned = total_earned + p_order_amount,
    status = CASE WHEN (commission_owed + remaining) >= debt_limit THEN 'paused' ELSE status END
  WHERE id = w.id RETURNING * INTO w;

  INSERT INTO wallet_transactions (wallet_id, user_id, type, service, order_id, amount, commission, balance_after, debt_after, note)
  VALUES (w.id, p_user_id, 'commission_owed', p_service, p_order_id, p_order_amount, commission, w.balance, w.commission_owed,
    CASE WHEN from_wallet > 0 THEN 'Rp ' || from_wallet || ' from wallet, Rp ' || remaining || ' owed'
    ELSE 'Rp ' || remaining || ' added to debt' END);

  -- Update debt limit based on history
  UPDATE wallets SET debt_limit = CASE
    WHEN total_orders >= 500 THEN 200000
    WHEN total_orders >= 250 THEN 150000
    WHEN total_orders >= 100 THEN 100000
    WHEN total_orders >= 50 THEN 75000
    ELSE 50000
  END WHERE id = w.id;

  result := json_build_object('success', w.commission_owed < w.debt_limit, 'free', false, 'deducted', false,
    'commission', commission, 'owed', w.commission_owed, 'paused', w.commission_owed >= w.debt_limit);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: Top up wallet ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION top_up_wallet(p_user_id UUID, p_amount BIGINT)
RETURNS JSON AS $$
DECLARE
  w wallets;
  cleared BIGINT := 0;
  to_balance BIGINT;
BEGIN
  SELECT * INTO w FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN json_build_object('error', 'wallet not found'); END IF;

  -- Clear debt first
  IF w.commission_owed > 0 THEN
    IF p_amount >= w.commission_owed THEN
      cleared := w.commission_owed;
      to_balance := p_amount - cleared;
    ELSE
      cleared := p_amount;
      to_balance := 0;
    END IF;
  ELSE
    to_balance := p_amount;
  END IF;

  UPDATE wallets SET
    balance = balance + to_balance,
    commission_owed = commission_owed - cleared,
    total_commission_paid = total_commission_paid + cleared,
    status = CASE WHEN (commission_owed - cleared) < debt_limit THEN 'active' ELSE status END
  WHERE id = w.id RETURNING * INTO w;

  INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, debt_after, note)
  VALUES (w.id, p_user_id, 'top_up', p_amount, w.balance, w.commission_owed,
    CASE WHEN cleared > 0 THEN 'Rp ' || cleared || ' cleared debt, Rp ' || to_balance || ' to balance'
    ELSE 'Rp ' || p_amount || ' added to balance' END);

  RETURN json_build_object('balance', w.balance, 'commission_owed', w.commission_owed, 'status', w.status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: Admin adjust wallet ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_adjust_wallet(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  w wallets;
BEGIN
  SELECT * INTO w FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN json_build_object('error', 'wallet not found'); END IF;

  IF p_type = 'credit' THEN
    -- Add to balance
    UPDATE wallets SET balance = balance + p_amount WHERE id = w.id RETURNING * INTO w;
    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, debt_after, note, admin_id)
    VALUES (w.id, p_user_id, 'admin_credit', p_amount, w.balance, w.commission_owed,
      COALESCE(p_note, 'Admin credit'), p_admin_id);
  ELSIF p_type = 'debit' THEN
    -- Subtract from balance
    UPDATE wallets SET balance = GREATEST(0, balance - p_amount) WHERE id = w.id RETURNING * INTO w;
    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, debt_after, note, admin_id)
    VALUES (w.id, p_user_id, 'admin_debit', p_amount, w.balance, w.commission_owed,
      COALESCE(p_note, 'Admin debit'), p_admin_id);
  ELSIF p_type = 'clear_debt' THEN
    -- Clear commission owed
    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, debt_after, note, admin_id)
    VALUES (w.id, p_user_id, 'admin_credit', w.commission_owed, w.balance, 0,
      COALESCE(p_note, 'Admin cleared debt of Rp ' || w.commission_owed), p_admin_id);
    UPDATE wallets SET commission_owed = 0, status = 'active' WHERE id = w.id RETURNING * INTO w;
  ELSIF p_type = 'block' THEN
    UPDATE wallets SET status = 'blocked' WHERE id = w.id RETURNING * INTO w;
  ELSIF p_type = 'unblock' THEN
    UPDATE wallets SET status = 'active' WHERE id = w.id RETURNING * INTO w;
  END IF;

  RETURN json_build_object('balance', w.balance, 'commission_owed', w.commission_owed, 'status', w.status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY wallet_select ON wallets FOR SELECT USING (auth.uid() = user_id);
-- Users can read their own transactions
CREATE POLICY wallet_tx_select ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
-- Server-side functions handle inserts/updates (SECURITY DEFINER)
