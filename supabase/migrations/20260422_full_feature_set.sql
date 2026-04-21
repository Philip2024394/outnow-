-- ═══════════════════════════════════════════════════════════════════════════
-- INDOO Full Feature Set Migration
-- Pre-booking, surge pricing, trip sharing, driver chat, tips, favourites,
-- goals, heat maps, multi-stop, cancellation fees
-- ═══════════════════════════════════════════════════════════════════════════

-- Pre-bookings (scheduled rides + food)
CREATE TABLE IF NOT EXISTS pre_bookings (
  id              bigserial PRIMARY KEY,
  user_id         uuid NOT NULL,
  type            text NOT NULL CHECK (type IN ('ride', 'food')),
  status          text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'dispatching', 'active', 'completed', 'cancelled')),
  scheduled_at    timestamptz NOT NULL,
  pickup_coords   jsonb,
  dropoff_coords  jsonb,
  pickup_address  text,
  dropoff_address text,
  vehicle_type    text,
  estimated_fare  integer DEFAULT 0,
  restaurant_id   bigint,
  items           jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pre_bookings_upcoming ON pre_bookings(user_id, scheduled_at) WHERE status = 'scheduled';

-- Trip sharing (live GPS share with contacts)
CREATE TABLE IF NOT EXISTS trip_shares (
  id            bigserial PRIMARY KEY,
  booking_id    text NOT NULL,
  user_id       uuid NOT NULL,
  share_token   text NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trip_shares_token ON trip_shares(share_token);

-- SOS alerts
CREATE TABLE IF NOT EXISTS sos_alerts (
  id          bigserial PRIMARY KEY,
  booking_id  text,
  user_id     uuid NOT NULL,
  lat         double precision,
  lng         double precision,
  status      text DEFAULT 'active',
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Driver-passenger chat messages
CREATE TABLE IF NOT EXISTS booking_messages (
  id          bigserial PRIMARY KEY,
  booking_id  text NOT NULL,
  sender_id   uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('passenger', 'driver', 'customer')),
  text        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_messages ON booking_messages(booking_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE booking_messages;

-- Favourite drivers
CREATE TABLE IF NOT EXISTS favourite_drivers (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  driver_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, driver_id)
);

-- Driver tips
CREATE TABLE IF NOT EXISTS driver_tips (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  driver_id   uuid NOT NULL,
  booking_id  text,
  amount      integer NOT NULL CHECK (amount > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Driver daily/weekly stats (for goals tracking)
CREATE TABLE IF NOT EXISTS driver_stats (
  driver_id       uuid PRIMARY KEY,
  trips_today     integer DEFAULT 0,
  trips_this_week integer DEFAULT 0,
  earnings_today  integer DEFAULT 0,
  earnings_week   integer DEFAULT 0,
  last_reset_day  date,
  last_reset_week date,
  updated_at      timestamptz DEFAULT now()
);

-- Multi-stop waypoints
CREATE TABLE IF NOT EXISTS booking_waypoints (
  id          bigserial PRIMARY KEY,
  booking_id  text NOT NULL,
  stop_order  smallint NOT NULL,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  address     text,
  arrived_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE pre_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pre-bookings" ON pre_bookings FOR ALL USING (auth.uid() = user_id);

ALTER TABLE trip_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trip shares" ON trip_shares FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read trip shares by token" ON trip_shares FOR SELECT USING (true);

ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create SOS" ON sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read SOS" ON sos_alerts FOR SELECT USING (true);

ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking participants can chat" ON booking_messages FOR ALL USING (auth.uid() = sender_id);
CREATE POLICY "Anyone can read booking messages" ON booking_messages FOR SELECT USING (true);

ALTER TABLE favourite_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favourites" ON favourite_drivers FOR ALL USING (auth.uid() = user_id);

ALTER TABLE driver_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can tip" ON driver_tips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers can read own tips" ON driver_tips FOR SELECT USING (auth.uid() = driver_id);

ALTER TABLE driver_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers manage own stats" ON driver_stats FOR ALL USING (auth.uid() = driver_id);

ALTER TABLE booking_waypoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read waypoints" ON booking_waypoints FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage waypoints" ON booking_waypoints FOR ALL USING (auth.role() = 'authenticated');
