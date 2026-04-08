-- ─────────────────────────────────────────────────────────────────────────────
-- GAP 3 (Option A): private_contacts table + get_contact_number RPC
--
-- contact_number moves out of profiles into a separate table with strict RLS.
-- No client code can reach contact_number directly.
-- The only sanctioned path is get_contact_number RPC which enforces the
-- contact_unlocks gate server-side before returning anything.
--
-- contact_platform STAYS in profiles — it is public (badge display only,
-- no number exposed) and is included in sessions_with_profiles view.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create private_contacts table
--    Owner-only RLS: other users cannot SELECT this table at all.
CREATE TABLE IF NOT EXISTS private_contacts (
  user_id        uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  contact_number text        NOT NULL,
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE private_contacts ENABLE ROW LEVEL SECURITY;

-- Owner has full access to their own row only
DROP POLICY IF EXISTS "private_contacts_owner" ON private_contacts;
CREATE POLICY "private_contacts_owner"
  ON private_contacts FOR ALL
  USING (auth.uid() = user_id);

-- 2. Migrate any existing contact_number data from profiles → private_contacts
--    Guarded: only runs if profiles.contact_number still exists (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'contact_number'
  ) THEN
    INSERT INTO private_contacts (user_id, contact_number, updated_at)
    SELECT id, contact_number, COALESCE(updated_at, now())
    FROM profiles
    WHERE contact_number IS NOT NULL
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 3. Drop contact_number from profiles
--    contact_platform is intentionally kept — public badge, no number exposed.
ALTER TABLE profiles DROP COLUMN IF EXISTS contact_number;

-- 4. get_contact_number RPC (SECURITY DEFINER)
--    Enforces payment gate server-side.
--    Reads contact_number from private_contacts (gated by contact_unlocks check)
--    and contact_platform from profiles (public, returned for convenience).
CREATE OR REPLACE FUNCTION get_contact_number(
  p_buyer_user_id  uuid,
  p_seller_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unlock_exists boolean;
  contact_num   text;
  contact_plat  text;
BEGIN
  -- Gate: verify a paid unlock row exists for this buyer + seller pair
  SELECT EXISTS(
    SELECT 1 FROM contact_unlocks
    WHERE buyer_id  = p_buyer_user_id
      AND seller_id = p_seller_user_id
  ) INTO unlock_exists;

  IF NOT unlock_exists THEN
    RAISE EXCEPTION 'not_unlocked'
      USING errcode = 'P0001',
            hint    = 'No contact_unlocks row found for this buyer/seller pair';
  END IF;

  -- Only reachable after gate passes
  SELECT contact_number INTO contact_num
    FROM private_contacts
    WHERE user_id = p_seller_user_id;

  SELECT contact_platform INTO contact_plat
    FROM profiles
    WHERE id = p_seller_user_id;

  RETURN json_build_object(
    'contactNumber',   contact_num,
    'contactPlatform', contact_plat
  );
END;
$$;

-- Restrict execution: authenticated users only, no anon access
REVOKE EXECUTE ON FUNCTION get_contact_number(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_contact_number(uuid, uuid) TO authenticated;
