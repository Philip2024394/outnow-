-- ═══════════════════════════════════════════════════════════════════════════
-- Anti-Abuse: Driver revenge, spam orders, collusion detection
-- ═══════════════════════════════════════════════════════════════════════════

-- Driver deactivation watchlist — tracks fired/banned drivers for 6 months
CREATE TABLE IF NOT EXISTS driver_deactivations (
  id              bigserial PRIMARY KEY,
  user_id         uuid NOT NULL,
  reason          text,
  deactivated_at  timestamptz NOT NULL DEFAULT now(),
  watch_until     timestamptz GENERATED ALWAYS AS (deactivated_at + interval '6 months') STORED
);
CREATE INDEX IF NOT EXISTS idx_deactivations_user ON driver_deactivations(user_id);
CREATE INDEX IF NOT EXISTS idx_deactivations_watch ON driver_deactivations(watch_until) WHERE watch_until > now();

-- Add type options to fraud_events
ALTER TABLE fraud_events DROP CONSTRAINT IF EXISTS fraud_events_type_check;
ALTER TABLE fraud_events ADD CONSTRAINT fraud_events_type_check
  CHECK (type IN (
    'fake_cod', 'wrong_address', 'no_show', 'payment_fraud', 'multi_account',
    'self_delivery_suspected', 'driver_ordering', 'velocity_spam', 'collusion_suspected',
    'same_restaurant_spam', 'device_match_driver'
  ));

-- RLS for deactivations
ALTER TABLE driver_deactivations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage deactivations" ON driver_deactivations
  FOR ALL USING (auth.role() = 'authenticated');
