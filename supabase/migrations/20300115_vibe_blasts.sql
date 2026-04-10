-- ─────────────────────────────────────────────────────────────────────────────
-- Vibe Blasting
-- Users pay Rp 32.000 ($1.99 USD) to broadcast their profile to matching
-- users in their city for 3 hours. Max 1 active blast per user per week.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vibe_blasts (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city                     TEXT,
  -- Vibe feeling selected by sender
  vibe                     TEXT        NOT NULL DEFAULT 'hangout',
  vibe_label               TEXT,
  vibe_emoji               TEXT,
  -- Targeting filters
  looking_for_gender       TEXT        NOT NULL DEFAULT 'both'   CHECK (looking_for_gender IN ('male', 'female', 'both')),
  looking_for_age_min      INT         NOT NULL DEFAULT 18,
  looking_for_age_max      INT         NOT NULL DEFAULT 99,
  looking_for_distance_km  INT         NOT NULL DEFAULT 10,
  -- Connection cap: blast stops when connections_count reaches max_connections
  max_connections          INT         NOT NULL DEFAULT 20,
  connections_count        INT         NOT NULL DEFAULT 0,
  expires_at               TIMESTAMPTZ NOT NULL,
  seen_count               INT         NOT NULL DEFAULT 0,
  is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active blast per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS vibe_blasts_active_user
  ON vibe_blasts (user_id)
  WHERE is_active = TRUE;

-- Fast lookup: active blasts in a city
CREATE INDEX IF NOT EXISTS vibe_blasts_city_active
  ON vibe_blasts (city, is_active, expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Views — track who saw which blast (deduplicated)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vibe_blast_views (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  spotlight_id UUID        NOT NULL REFERENCES vibe_blasts(id) ON DELETE CASCADE,
  viewer_id    UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spotlight_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS vibe_blast_views_spotlight
  ON vibe_blast_views (spotlight_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Verified photo lock on profiles
-- Admin sets photo_verified = true.  Once verified, the photo_url column
-- becomes read-only for the user (enforced by RLS policy below).
-- This prevents swapping in a brand/marketing logo after verification.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photo_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS photo_verified_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_verified_by   UUID; -- admin user id

-- Users can only update photo_url when photo_verified is false
-- (once verified, they must contact support to change their photo)
CREATE POLICY "Lock verified photo" ON profiles
  FOR UPDATE USING (TRUE)
  WITH CHECK (
    -- Allow update if not verified OR photo_url is not being changed
    photo_verified = FALSE
    OR photo_url = (SELECT photo_url FROM profiles WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-deactivate blast when connections_count reaches max_connections
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_blast_connection_cap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.connections_count >= NEW.max_connections THEN
    NEW.is_active := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blast_cap ON vibe_blasts;
CREATE TRIGGER trg_blast_cap
  BEFORE UPDATE OF connections_count ON vibe_blasts
  FOR EACH ROW EXECUTE FUNCTION check_blast_connection_cap();

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-increment seen_count when a new view is inserted
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_vibe_blast_seen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE vibe_blasts
  SET    seen_count = seen_count + 1
  WHERE  id = NEW.spotlight_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vibe_blast_seen ON vibe_blast_views;
CREATE TRIGGER trg_vibe_blast_seen
  AFTER INSERT ON vibe_blast_views
  FOR EACH ROW EXECUTE FUNCTION increment_vibe_blast_seen();

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-expire blasts: mark is_active = false when expires_at passes
-- (call via pg_cron or Supabase scheduled function every 10 minutes)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION expire_vibe_blasts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE vibe_blasts
  SET    is_active = FALSE
  WHERE  is_active = TRUE
    AND  expires_at < NOW();
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE vibe_blasts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_blast_views ENABLE ROW LEVEL SECURITY;

-- Users can read active blasts in their city (filtering done in app)
CREATE POLICY "Read active blasts" ON vibe_blasts
  FOR SELECT USING (is_active = TRUE AND expires_at > NOW());

-- Users can insert/update their own blasts
CREATE POLICY "Own blast insert" ON vibe_blasts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own blast update" ON vibe_blasts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read their own blasts (for dashboard / status checking)
CREATE POLICY "Own blast read" ON vibe_blasts
  FOR SELECT USING (auth.uid() = user_id);

-- Views: anyone can insert a view (seen_count trigger fires)
CREATE POLICY "Insert view" ON vibe_blast_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Only blast owner can read view records
CREATE POLICY "Blast owner reads views" ON vibe_blast_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vibe_blasts
      WHERE id = vibe_blast_views.spotlight_id
        AND user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- .env addition reminder (not executed — for developer reference)
-- VITE_STRIPE_PRICE_VIBE_BLAST=price_xxxxxxxxxxxxxxxx
-- ─────────────────────────────────────────────────────────────────────────────
