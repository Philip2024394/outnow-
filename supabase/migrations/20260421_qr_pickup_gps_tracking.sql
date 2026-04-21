-- Restaurant QR codes for driver pickup verification
CREATE TABLE IF NOT EXISTS restaurant_qr_codes (
  id              bigserial PRIMARY KEY,
  restaurant_id   bigint NOT NULL,
  qr_hash         text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id)
);

-- Driver GPS locations — upserted every 10s during active delivery
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id    uuid PRIMARY KEY,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  heading      smallint,
  speed        real,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Delivery tracking — phase log per order
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id          bigserial PRIMARY KEY,
  order_id    text NOT NULL,
  driver_id   uuid NOT NULL,
  phase       text NOT NULL CHECK (phase IN (
    'heading_to_restaurant','driver_nearby','picked_up','on_the_way','almost_there','arrived'
  )),
  lat         double precision,
  lng         double precision,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id, updated_at DESC);

-- Failed notifications — for SMS fallback escalation
CREATE TABLE IF NOT EXISTS failed_notifications (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  type        text NOT NULL,
  booking_id  text,
  reason      text,
  sms_sent    boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_failed_notif_pending ON failed_notifications(sms_sent, created_at DESC) WHERE NOT sms_sent;

-- Enable realtime on driver_locations and delivery_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_tracking;

-- RLS: drivers can update their own location
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can upsert own location" ON driver_locations
  FOR ALL USING (auth.uid() = driver_id);
CREATE POLICY "Anyone can read driver locations" ON driver_locations
  FOR SELECT USING (true);

-- RLS: delivery tracking readable by all, writable by drivers
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read delivery tracking" ON delivery_tracking
  FOR SELECT USING (true);
CREATE POLICY "Drivers can insert tracking" ON delivery_tracking
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- RLS: QR codes readable by all, writable by restaurant owners
ALTER TABLE restaurant_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read QR codes" ON restaurant_qr_codes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage QR codes" ON restaurant_qr_codes
  FOR ALL USING (auth.role() = 'authenticated');
