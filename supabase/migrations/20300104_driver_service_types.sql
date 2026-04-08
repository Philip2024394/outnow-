-- Driver service availability flags
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepts_rides    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_packages boolean NOT NULL DEFAULT false;
