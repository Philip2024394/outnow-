-- ═══════════════════════════════════════════════════════════════════════════
-- COD Trust & Anti-Fraud System
-- ═══════════════════════════════════════════════════════════════════════════

-- Blacklist — banned users (phone + device)
CREATE TABLE IF NOT EXISTS blacklist (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL UNIQUE,
  reason      text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fraud events log — tracks suspicious behaviour
CREATE TABLE IF NOT EXISTS fraud_events (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  order_id    text,
  type        text NOT NULL CHECK (type IN ('fake_cod', 'wrong_address', 'no_show', 'payment_fraud', 'multi_account')),
  details     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_events(user_id, created_at DESC);

-- Add trust columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_level text DEFAULT 'new';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cod_enabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Add discount tracking to food orders
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS bank_discount integer DEFAULT 0;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS commission_percent real DEFAULT 10;

-- RLS
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blacklist" ON blacklist FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE fraud_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can insert fraud events" ON fraud_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can read fraud events" ON fraud_events FOR SELECT USING (auth.role() = 'authenticated');
