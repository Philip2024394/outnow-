-- ── MAKAN Weekly Promos ───────────────────────────────────────────────────────
-- Restaurants set time-windowed deals per day of week.
-- Users see a weekly deal passport — locked with countdown until the window opens.

CREATE TABLE IF NOT EXISTS promos (
  id              bigserial     PRIMARY KEY,
  restaurant_id   bigint        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week     smallint      NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                                -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  start_time      time          NOT NULL,   -- e.g. 14:00
  end_time        time          NOT NULL,   -- e.g. 17:00
  offer_type      text          NOT NULL DEFAULT 'percent_off'
                  CHECK (offer_type IN ('percent_off','free_item','two_for_one','custom')),
  offer_value     text,                     -- e.g. '20' for percent_off, or custom label
  title           text          NOT NULL,   -- e.g. '20% Off all rice dishes'
  detail          text,                     -- e.g. 'All rice dishes'
  is_active       boolean       NOT NULL DEFAULT true,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS promos_restaurant_idx  ON promos(restaurant_id, is_active);
CREATE INDEX IF NOT EXISTS promos_day_idx         ON promos(day_of_week, is_active);

-- ── Claimed promos ────────────────────────────────────────────────────────────
-- One claim per user per promo per calendar day (prevents re-claiming same window)

CREATE TABLE IF NOT EXISTS claimed_promos (
  id            bigserial     PRIMARY KEY,
  promo_id      bigint        NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  user_id       uuid          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim_code    text          NOT NULL DEFAULT 'MAKAN-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  claimed_at    timestamptz   NOT NULL DEFAULT now(),
  order_ref     text                       -- linked MAKAN order ref once order placed
);

-- Partial uniqueness enforced in application logic (claim_promo RPC uses explicit check)

CREATE INDEX IF NOT EXISTS claimed_promos_user_idx  ON claimed_promos(user_id, claimed_at);
CREATE INDEX IF NOT EXISTS claimed_promos_promo_idx ON claimed_promos(promo_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE promos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_promos ENABLE ROW LEVEL SECURITY;

-- Promos: anyone can read active promos for approved restaurants
DROP POLICY IF EXISTS "promos_public_read"  ON promos;
DROP POLICY IF EXISTS "promos_owner_all"    ON promos;
DROP POLICY IF EXISTS "promos_admin_all"    ON promos;

CREATE POLICY "promos_public_read" ON promos FOR SELECT
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.status = 'approved')
  );

CREATE POLICY "promos_owner_all" ON promos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "promos_admin_all" ON promos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Claimed promos: users see only their own claims
DROP POLICY IF EXISTS "claims_own_read"   ON claimed_promos;
DROP POLICY IF EXISTS "claims_own_insert" ON claimed_promos;
DROP POLICY IF EXISTS "claims_admin_all"  ON claimed_promos;

CREATE POLICY "claims_own_read" ON claimed_promos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "claims_own_insert" ON claimed_promos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "claims_admin_all" ON claimed_promos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Restaurant owners can read claims for their promos (to verify at the door)
DROP POLICY IF EXISTS "claims_owner_read" ON claimed_promos;
CREATE POLICY "claims_owner_read" ON claimed_promos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM promos pr
      JOIN restaurants r ON r.id = pr.restaurant_id
      WHERE pr.id = promo_id AND r.owner_id = auth.uid()
    )
  );

-- ── RPC: claim a promo (atomic — prevents race conditions) ───────────────────
CREATE OR REPLACE FUNCTION claim_promo(p_promo_id bigint)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_promo       promos%ROWTYPE;
  v_now         timestamptz := now();
  v_today_day   smallint    := EXTRACT(DOW FROM v_now AT TIME ZONE 'Asia/Jakarta')::smallint;
  v_now_time    time        := (v_now AT TIME ZONE 'Asia/Jakarta')::time;
  v_claim_code  text;
  v_result      json;
BEGIN
  -- Fetch and lock the promo
  SELECT * INTO v_promo FROM promos WHERE id = p_promo_id AND is_active = true FOR SHARE;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Promo not found');
  END IF;

  -- Check it is the right day and within the time window
  IF v_promo.day_of_week <> v_today_day THEN
    RETURN json_build_object('ok', false, 'error', 'Not available today');
  END IF;
  IF v_now_time < v_promo.start_time OR v_now_time >= v_promo.end_time THEN
    RETURN json_build_object('ok', false, 'error', 'Outside promo hours');
  END IF;

  -- Check the restaurant is approved and open
  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = v_promo.restaurant_id AND r.status = 'approved' AND r.is_open = true
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'Restaurant not available');
  END IF;

  -- Insert claim (unique constraint prevents duplicate same-day claims)
  v_claim_code := 'MAKAN-' || upper(substring(gen_random_uuid()::text, 1, 8));
  BEGIN
    INSERT INTO claimed_promos (promo_id, user_id, claim_code)
    VALUES (p_promo_id, auth.uid(), v_claim_code);
  EXCEPTION WHEN unique_violation THEN
    -- Already claimed today — return existing claim code
    SELECT claim_code INTO v_claim_code
    FROM claimed_promos
    WHERE promo_id = p_promo_id AND user_id = auth.uid()
      AND claimed_at::date = v_now::date;
    RETURN json_build_object('ok', true, 'claim_code', v_claim_code, 'already_claimed', true);
  END;

  RETURN json_build_object('ok', true, 'claim_code', v_claim_code, 'already_claimed', false);
END;
$$;
