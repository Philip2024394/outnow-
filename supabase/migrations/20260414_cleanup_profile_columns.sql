-- ─────────────────────────────────────────────────────────────────────────────
-- Cleanup: migrate legacy whatsapp/phone columns from profiles → private_contacts
-- then drop both columns.
-- Runs safely even if columns are already absent.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Migrate profiles.whatsapp → private_contacts
--    Skips profiles that already have a private_contacts row.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'whatsapp'
  ) THEN
    INSERT INTO private_contacts (user_id, contact_number, updated_at)
    SELECT id, whatsapp, COALESCE(updated_at, now())
    FROM profiles
    WHERE whatsapp IS NOT NULL
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 2. Migrate profiles.phone → private_contacts
--    Only where whatsapp was null (whatsapp takes precedence)
--    and no private_contacts row exists yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'phone'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'whatsapp'
  ) THEN
    INSERT INTO private_contacts (user_id, contact_number, updated_at)
    SELECT id, phone, COALESCE(updated_at, now())
    FROM profiles
    WHERE phone    IS NOT NULL
      AND whatsapp IS NULL
      AND id NOT IN (SELECT user_id FROM private_contacts)
    ON CONFLICT (user_id) DO NOTHING;

  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'phone'
  ) THEN
    -- whatsapp column already gone — migrate phone unconditionally
    INSERT INTO private_contacts (user_id, contact_number, updated_at)
    SELECT id, phone, COALESCE(updated_at, now())
    FROM profiles
    WHERE phone IS NOT NULL
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 3. Drop legacy columns (IF EXISTS = no-op if already absent)
ALTER TABLE profiles DROP COLUMN IF EXISTS whatsapp;
ALTER TABLE profiles DROP COLUMN IF EXISTS phone;
