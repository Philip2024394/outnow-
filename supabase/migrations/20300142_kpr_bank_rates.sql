-- KPR (Kredit Pemilikan Rumah) bank interest rates
-- Managed by admin, consumed by KPRCalculator on the frontend

CREATE TABLE IF NOT EXISTS kpr_bank_rates (
  id          bigserial PRIMARY KEY,
  bank_name   text    NOT NULL,
  rate        numeric NOT NULL,  -- annual interest rate %
  emoji       text    DEFAULT '🏦',
  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE kpr_bank_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read rates
CREATE POLICY "Public read kpr_bank_rates"
  ON kpr_bank_rates FOR SELECT USING (true);

-- Authenticated users (admin) can manage
CREATE POLICY "Admin manage kpr_bank_rates"
  ON kpr_bank_rates FOR ALL USING (auth.role() = 'authenticated');

-- Seed default rates
INSERT INTO kpr_bank_rates (bank_name, rate, emoji, sort_order) VALUES
  ('BCA',     7.5, '🏦', 1),
  ('Mandiri', 8.0, '🏛️', 2),
  ('BNI',     8.5, '🏢', 3),
  ('BRI',     8.25, '🏗️', 4),
  ('BTN',     7.9, '🏠', 5);
