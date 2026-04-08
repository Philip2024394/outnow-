-- Driver go-online selfie verification
-- Creates audit log table and adds last-selfie columns to profiles.
-- Storage bucket 'driver-selfies' must be created manually in the Supabase dashboard
-- with public read access (or authenticated-only depending on preference).

-- Selfie audit log
CREATE TABLE IF NOT EXISTS driver_selfie_logs (
  id          bigserial    PRIMARY KEY,
  driver_id   uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selfie_url  text         NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS driver_selfie_logs_driver_idx ON driver_selfie_logs(driver_id, created_at DESC);

-- Latest selfie snapshot on profile (for quick admin lookup)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_selfie_url  text,
  ADD COLUMN IF NOT EXISTS last_selfie_at   timestamptz;

-- RLS
ALTER TABLE driver_selfie_logs ENABLE ROW LEVEL SECURITY;

-- Driver can only insert their own selfies
CREATE POLICY "driver_insert_own_selfie"
  ON driver_selfie_logs FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Admin / service role can read all
CREATE POLICY "admin_read_selfies"
  ON driver_selfie_logs FOR SELECT
  USING (true);
