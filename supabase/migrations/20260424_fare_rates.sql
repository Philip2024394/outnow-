-- ═══════════════════════════════════════════════════════════════════════════
-- Fare rates — government-regulated km rates, admin configurable
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fare_rates (
  id              bigserial PRIMARY KEY,
  zone            text NOT NULL,                 -- 'zone_1' (Java/Bali), 'zone_2' (Sumatra), 'zone_3' (others)
  vehicle_type    text NOT NULL,                 -- 'bike' or 'car'
  base_fare       integer NOT NULL,              -- base fare in Rp
  per_km_rate     integer NOT NULL,              -- per km rate in Rp
  min_fare        integer NOT NULL,              -- minimum fare in Rp
  max_fare        integer,                       -- maximum fare (null = no cap)
  surge_max       numeric(3,1) DEFAULT 2.0,      -- max surge multiplier
  indoo_commission numeric(4,2) DEFAULT 10.00,   -- INDOO commission % from driver fare
  deal_delivery_discount numeric(4,2) DEFAULT 5.00, -- % off delivery when ordering via daily deal
  is_active       boolean DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid,
  UNIQUE(zone, vehicle_type)
);

-- Insert Kemenhub regulated rates (2024)
INSERT INTO fare_rates (zone, vehicle_type, base_fare, per_km_rate, min_fare, max_fare, surge_max, indoo_commission) VALUES
  ('zone_1', 'bike', 2600, 2600, 12000, NULL, 2.0, 10.00),
  ('zone_1', 'car',  4500, 4500, 40000, NULL, 2.0, 10.00),
  ('zone_2', 'bike', 2500, 2500, 11000, NULL, 2.0, 10.00),
  ('zone_2', 'car',  4200, 4200, 35000, NULL, 2.0, 10.00),
  ('zone_3', 'bike', 2600, 2600, 11000, NULL, 2.0, 10.00),
  ('zone_3', 'car',  4500, 4500, 35000, NULL, 2.0, 10.00)
ON CONFLICT (zone, vehicle_type) DO NOTHING;

-- Food delivery rates (separate from ride-hailing)
CREATE TABLE IF NOT EXISTS delivery_rates (
  id              bigserial PRIMARY KEY,
  zone            text NOT NULL,
  base_fare       integer NOT NULL DEFAULT 9250,
  per_km_rate     integer NOT NULL DEFAULT 1850,
  min_fare        integer NOT NULL DEFAULT 10000,
  max_fare        integer DEFAULT 80000,
  deal_discount_pct numeric(4,2) DEFAULT 5.00,  -- 5% off when ordering via daily deal
  indoo_commission numeric(4,2) DEFAULT 10.00,
  is_active       boolean DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(zone)
);

INSERT INTO delivery_rates (zone, base_fare, per_km_rate, min_fare, max_fare) VALUES
  ('zone_1', 9250, 1850, 10000, 80000),
  ('zone_2', 8500, 1700, 9000,  70000),
  ('zone_3', 9250, 1850, 10000, 80000)
ON CONFLICT (zone) DO NOTHING;

-- RLS
ALTER TABLE fare_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads rates" ON fare_rates FOR SELECT USING (true);
CREATE POLICY "Admins manage rates" ON fare_rates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone reads delivery rates" ON delivery_rates FOR SELECT USING (true);
CREATE POLICY "Admins manage delivery rates" ON delivery_rates FOR ALL USING (auth.role() = 'authenticated');
