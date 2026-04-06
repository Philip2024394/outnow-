-- ═══════════════════════════════════════════════════════════════════════════
-- Map Spots — postcode territory ownership
-- One spot per postcode. First come first served.
-- Users: $0.99/mo  |  Business: $1.99/mo  |  Annual: $19.99/yr + 10 boosts
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Protected postcodes ─────────────────────────────────────────────────
--    Government buildings, royal estates, airports, hospitals, public parks.
--    These postcodes cannot be claimed by any user or business.

CREATE TABLE IF NOT EXISTS protected_postcodes (
  postcode    text PRIMARY KEY,
  reason      text NOT NULL DEFAULT 'public',  -- public | government | royal | military
  label       text,                            -- human-readable name e.g. "Buckingham Palace"
  country     char(2),                         -- ISO 2-letter country code
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — read-only reference table, anyone can check it
GRANT SELECT ON protected_postcodes TO authenticated, anon;


-- ── 1b. Add is_admin to profiles if not present ───────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;


-- ── 2. Spots table ─────────────────────────────────────────────────────────
--    Each row = one claimed postcode territory.

CREATE TABLE IF NOT EXISTS spots (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  postcode                text        NOT NULL,
  type                    text        NOT NULL CHECK (type IN ('spot_user_monthly', 'spot_user_annual', 'spot_business_monthly', 'spot_business_annual')),
  category                text,                             -- business category if applicable
  lat                     float8,
  lng                     float8,
  status                  text        NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'active', 'rejected', 'cancelled')),
  stripe_subscription_id  text,
  stripe_customer_id      text,
  price_usd               numeric(6,2),
  billing_period          text        CHECK (billing_period IN ('monthly', 'annual')),
  boost_credits           int         NOT NULL DEFAULT 0,   -- 10 awarded on annual plans
  boost_credits_used      int         NOT NULL DEFAULT 0,
  claimed_at              timestamptz NOT NULL DEFAULT now(),
  verified_at             timestamptz,
  rejected_at             timestamptz,
  rejected_reason         text,
  next_billing_at         timestamptz,
  cancelled_at            timestamptz
);

-- One postcode per spot — enforces first-come-first-served
CREATE UNIQUE INDEX IF NOT EXISTS spots_postcode_unique
  ON spots(postcode)
  WHERE status NOT IN ('rejected', 'cancelled');

-- One spot per user — each user/business can only own one spot
CREATE UNIQUE INDEX IF NOT EXISTS spots_user_unique
  ON spots(user_id)
  WHERE status NOT IN ('rejected', 'cancelled');

-- Fast admin lookups
CREATE INDEX IF NOT EXISTS spots_status_idx      ON spots(status, claimed_at DESC);
CREATE INDEX IF NOT EXISTS spots_postcode_idx    ON spots(postcode);
CREATE INDEX IF NOT EXISTS spots_user_idx        ON spots(user_id);

-- RLS
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a postcode is taken (needed for availability check)
CREATE POLICY "spots_public_read"
  ON spots FOR SELECT
  USING (true);

-- Owner can see their own spot (already covered by public read, but explicit)
CREATE POLICY "spots_owner_insert"
  ON spots FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "spots_owner_update"
  ON spots FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can update all spots (for verify/reject workflow)
-- Uses a custom claim set via the admin dashboard
CREATE POLICY "spots_admin_update"
  ON spots FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );


-- ── 3. Postcode availability check function ────────────────────────────────
--    Returns whether a postcode is available to claim.
--    Checks both protected_postcodes and existing active/pending spots.

CREATE OR REPLACE FUNCTION check_postcode_available(p_postcode text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_postcode text := upper(trim(p_postcode));
  v_protected  protected_postcodes%ROWTYPE;
  v_spot       spots%ROWTYPE;
BEGIN
  -- Check protected zones first
  SELECT * INTO v_protected
  FROM protected_postcodes
  WHERE postcode = v_postcode;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'protected',
      'label', v_protected.label
    );
  END IF;

  -- Check existing claims
  SELECT * INTO v_spot
  FROM spots
  WHERE postcode = v_postcode
    AND status NOT IN ('rejected', 'cancelled');

  IF FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'claimed'
    );
  END IF;

  RETURN jsonb_build_object('available', true);
END;
$$;

GRANT EXECUTE ON FUNCTION check_postcode_available TO authenticated, anon;


-- ── 4. Admin: verify spot ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_verify_spot(p_spot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE spots
  SET
    status      = 'active',
    verified_at = now()
  WHERE id = p_spot_id;
END;
$$;


-- ── 5. Admin: reject spot ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_reject_spot(
  p_spot_id uuid,
  p_reason  text DEFAULT 'Does not meet verification requirements'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE spots
  SET
    status          = 'rejected',
    rejected_at     = now(),
    rejected_reason = p_reason
  WHERE id = p_spot_id;
END;
$$;


-- ── 6. Award boost credits on annual plan claim ────────────────────────────
--    Trigger: when a spot with annual billing is set to active,
--    award 10 boost credits if not already set.

CREATE OR REPLACE FUNCTION award_annual_spot_boosts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active'
     AND NEW.billing_period = 'annual'
     AND NEW.boost_credits = 0
  THEN
    NEW.boost_credits := 10;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_annual_spot_boosts ON spots;
CREATE TRIGGER trg_award_annual_spot_boosts
  BEFORE UPDATE ON spots
  FOR EACH ROW
  EXECUTE FUNCTION award_annual_spot_boosts();


-- ── 7. Seed: common protected postcodes (UK examples) ─────────────────────
--    Extend this list with your target market's public zones.
--    Full seed should be loaded separately for each country.

INSERT INTO protected_postcodes (postcode, reason, label, country) VALUES
  ('SW1A 1AA', 'royal',      'Buckingham Palace',              'GB'),
  ('SW1A 2AA', 'government', '10 Downing Street',              'GB'),
  ('SW1A 0AA', 'government', 'Houses of Parliament',           'GB'),
  ('EC4M 5UT', 'government', 'Old Bailey Central Criminal Court','GB'),
  ('WC2N 5DU', 'government', 'Trafalgar Square',               'GB'),
  ('SW7 2RL',  'public',     'Natural History Museum',         'GB'),
  ('SE1 7PB',  'public',     'Tate Modern',                    'GB'),
  ('EC2N 2DB', 'government', 'Bank of England',                'GB'),
  ('W1J 7NT',  'public',     'Hyde Park',                      'GB'),
  -- Indonesia — Jakarta
  ('10110',    'government', 'Istana Negara (State Palace)',    'ID'),
  ('10110',    'government', 'DPR / MPR Parliament',           'ID'),
  ('10430',    'public',     'Monas National Monument',        'ID'),
  ('12190',    'public',     'GBK Senayan Sports Complex',     'ID'),
  ('80361',    'public',     'Kuta Beach Bali',                'ID'),
  ('80571',    'public',     'Ubud Royal Palace Bali',         'ID')
ON CONFLICT (postcode) DO NOTHING;
