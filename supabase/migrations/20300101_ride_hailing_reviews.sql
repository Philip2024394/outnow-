-- ─────────────────────────────────────────────────────────────────────────────
-- Ride Hailing: bookings table + driver reviews
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles: driver columns ──────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_driver              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_type            text,          -- 'bike_ride' | 'car_taxi'
  ADD COLUMN IF NOT EXISTS driver_online          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_last_location   jsonb,         -- { lat, lng }
  ADD COLUMN IF NOT EXISTS driver_last_location_at timestamptz,
  ADD COLUMN IF NOT EXISTS rating                 numeric(3,1),  -- e.g. 4.8
  ADD COLUMN IF NOT EXISTS phone                  text;          -- WhatsApp number

CREATE INDEX IF NOT EXISTS profiles_is_driver_idx
  ON profiles (is_driver, driver_online, driver_type)
  WHERE is_driver = true;

-- ── Bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                text        PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id         text        NOT NULL,   -- profile id (text for demo compat)
  status            text        NOT NULL DEFAULT 'pending',
    -- pending | accepted | started | completed | cancelled | expired
  pickup_location   text,
  dropoff_location  text,
  pickup_coords     jsonb,      -- { lat, lng }
  dropoff_coords    jsonb,      -- { lat, lng }
  fare              numeric(12,0),
  distance_km       numeric(6,2),
  cancel_reason     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS bookings_user_id_idx    ON bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_driver_id_idx  ON bookings (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_idx     ON bookings (status);

-- ── Driver reviews ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_reviews (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  text        REFERENCES bookings(id) ON DELETE SET NULL,
  driver_id   text        NOT NULL,   -- profile id
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stars       smallint    NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One review per booking
CREATE UNIQUE INDEX IF NOT EXISTS driver_reviews_booking_unique
  ON driver_reviews (booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS driver_reviews_driver_id_idx ON driver_reviews (driver_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;

-- Bookings: users can read/insert their own; drivers can read bookings for them
DROP POLICY IF EXISTS bookings_user_select   ON bookings;
DROP POLICY IF EXISTS bookings_user_insert   ON bookings;
DROP POLICY IF EXISTS bookings_user_update   ON bookings;

CREATE POLICY bookings_user_select ON bookings
  FOR SELECT USING (auth.uid() = user_id OR driver_id = auth.uid()::text);

CREATE POLICY bookings_user_insert ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY bookings_user_update ON bookings
  FOR UPDATE USING (auth.uid() = user_id OR driver_id = auth.uid()::text);

-- Reviews: users can insert their own; anyone can read (for driver profiles)
DROP POLICY IF EXISTS reviews_select ON driver_reviews;
DROP POLICY IF EXISTS reviews_insert ON driver_reviews;

CREATE POLICY reviews_select ON driver_reviews
  FOR SELECT USING (true);

CREATE POLICY reviews_insert ON driver_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
