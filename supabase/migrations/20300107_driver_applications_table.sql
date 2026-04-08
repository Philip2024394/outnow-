-- Driver applications table (safe to run — uses IF NOT EXISTS throughout)
CREATE TABLE IF NOT EXISTS driver_applications (
  id           bigserial    PRIMARY KEY,
  user_id      text         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_type  text         NOT NULL CHECK (driver_type IN ('bike_ride','car_taxi')),
  document_urls jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status       text         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes  text,
  profile_status text       NOT NULL DEFAULT 'waiting_details' CHECK (profile_status IN ('waiting_details','complete')),
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS driver_applications_status_idx ON driver_applications(status);

-- Add profile_status to existing table if upgrading
ALTER TABLE driver_applications
  ADD COLUMN IF NOT EXISTS profile_status text NOT NULL DEFAULT 'waiting_details'
  CHECK (profile_status IN ('waiting_details','complete'));

-- Vehicle detail columns on profiles (safe — IF NOT EXISTS)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS driver_age       int,
  ADD COLUMN IF NOT EXISTS vehicle_model    text,
  ADD COLUMN IF NOT EXISTS vehicle_year     int,
  ADD COLUMN IF NOT EXISTS vehicle_color    text,
  ADD COLUMN IF NOT EXISTS plate_prefix     text,
  ADD COLUMN IF NOT EXISTS total_trips      int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_deactivated boolean NOT NULL DEFAULT false;

-- RLS
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "driver_own_application"
  ON driver_applications FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "admin_all_applications"
  ON driver_applications FOR ALL
  USING (true);
