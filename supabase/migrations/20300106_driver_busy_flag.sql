-- Driver busy state — explicit (booking) + auto (speed detection)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS driver_busy       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_auto_busy  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_speed_kmh  float   NOT NULL DEFAULT 0;

-- Index so fetchNearbyDrivers can filter quickly
CREATE INDEX IF NOT EXISTS profiles_driver_available_idx
  ON profiles(driver_online, driver_busy, driver_type)
  WHERE driver_online = true AND driver_busy = false;
