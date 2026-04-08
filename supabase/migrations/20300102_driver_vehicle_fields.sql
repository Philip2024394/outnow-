-- ─────────────────────────────────────────────────────────────────────────────
-- Driver vehicle & profile fields
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS driver_age      smallint,       -- e.g. 28
  ADD COLUMN IF NOT EXISTS vehicle_model   text,           -- e.g. 'Honda Vario 125'
  ADD COLUMN IF NOT EXISTS vehicle_year    smallint,       -- e.g. 2022
  ADD COLUMN IF NOT EXISTS vehicle_color   text,           -- e.g. 'Black'
  ADD COLUMN IF NOT EXISTS plate_prefix    text,           -- first 4 chars e.g. 'AB12'
  ADD COLUMN IF NOT EXISTS total_trips     integer NOT NULL DEFAULT 0;

-- Auto-increment total_trips when a booking is marked completed
CREATE OR REPLACE FUNCTION increment_driver_trips()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE profiles
       SET total_trips = total_trips + 1
     WHERE id::text = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_completed ON bookings;
CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_driver_trips();
