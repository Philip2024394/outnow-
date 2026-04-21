-- ═══════════════════════════════════════════════════════════════════════════
-- Driver Features: Tier system, order batching, incidents, support chat
-- ═══════════════════════════════════════════════════════════════════════════

-- Driver tier (cached calculation — updated on trip completion)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS driver_tier text DEFAULT 'bronze';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS driver_tier_updated_at timestamptz;

-- Add batching flag to food orders
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS is_batched boolean DEFAULT false;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS restaurant_lat double precision;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS restaurant_lng double precision;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS customer_lat double precision;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS customer_lng double precision;

-- Driver incident reports
CREATE TABLE IF NOT EXISTS driver_incidents (
  id            bigserial PRIMARY KEY,
  driver_id     uuid NOT NULL,
  booking_id    text,
  incident_type text NOT NULL,
  description   text,
  photo_url     text,
  status        text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes   text,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidents_driver ON driver_incidents(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_pending ON driver_incidents(status) WHERE status = 'pending';

-- Support messages (driver helpdesk)
CREATE TABLE IF NOT EXISTS support_messages (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  role        text NOT NULL CHECK (role IN ('driver', 'customer', 'admin')),
  message     text NOT NULL,
  category    text DEFAULT 'general',
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'resolved')),
  admin_reply text,
  replied_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_pending ON support_messages(status) WHERE status = 'pending';

-- Add earnings breakdown columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_code text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tip_amount integer DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS surge_multiplier real DEFAULT 1.0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_fee integer DEFAULT 0;

-- RLS
ALTER TABLE driver_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers manage own incidents" ON driver_incidents FOR ALL USING (auth.uid() = driver_id);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own support messages" ON support_messages FOR ALL USING (auth.uid() = user_id);
