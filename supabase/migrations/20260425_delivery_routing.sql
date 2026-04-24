-- Delivery routing — weight-based vehicle assignment
-- Indonesian law PP 55/2012: motorcycle max cargo 25kg

-- Add weight and vehicle routing fields to food_orders
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,2);
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'bike_ride';
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false;
ALTER TABLE food_orders ADD COLUMN IF NOT EXISTS routing_reason TEXT;

-- Add weight to marketplace orders
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,2);
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'bike_ride';

-- Package delivery table (if not exists)
CREATE TABLE IF NOT EXISTS package_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT,
  sender_phone TEXT,
  pickup_address TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  description TEXT,
  weight_kg NUMERIC(6,2) NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'bike_ride', -- auto-set based on weight
  driver_id UUID REFERENCES profiles(id),
  driver_name TEXT,
  driver_phone TEXT,
  delivery_fee NUMERIC(10,0),
  distance_km NUMERIC(6,2),
  status TEXT DEFAULT 'pending',
  cash_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_package_sender ON package_deliveries (sender_id, created_at DESC);
CREATE INDEX idx_package_driver ON package_deliveries (driver_id, status);
CREATE INDEX idx_package_status ON package_deliveries (status, created_at DESC);

-- RLS
ALTER TABLE package_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own packages" ON package_deliveries
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = driver_id);

CREATE POLICY "Users create packages" ON package_deliveries
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Drivers update assigned packages" ON package_deliveries
  FOR UPDATE USING (auth.uid() = driver_id);
