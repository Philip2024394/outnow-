-- ─────────────────────────────────────────────────────────────────────────────
-- P6: User Behaviour Buckets
-- Records which time window a user typically creates sessions in.
-- Used to suppress push notifications outside their active window.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_behaviour_buckets (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  bucket     text        NOT NULL CHECK (bucket IN (
               'evening_socialiser',
               'weekend_only',
               'business_hours',
               'late_night'
             )),
  score      int         DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_behaviour_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_read"
  ON user_behaviour_buckets FOR SELECT
  USING (auth.uid() = user_id);

-- RPC: called on every session create from AppShell
-- Determines the bucket from current server time and increments score.
-- Uses UPSERT so first call creates the row, subsequent calls increment.
CREATE OR REPLACE FUNCTION upsert_behaviour_bucket(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour int  := EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC');
  v_dow  int  := EXTRACT(DOW  FROM now() AT TIME ZONE 'UTC');
  v_bucket text;
BEGIN
  -- Priority order: late_night > evening_socialiser > weekend_only > business_hours
  IF v_hour >= 0 AND v_hour < 3 THEN
    v_bucket := 'late_night';
  ELSIF v_hour BETWEEN 17 AND 23 THEN
    v_bucket := 'evening_socialiser';
  ELSIF v_dow IN (0, 6) THEN
    v_bucket := 'weekend_only';
  ELSIF v_hour BETWEEN 9 AND 17 AND v_dow BETWEEN 1 AND 5 THEN
    v_bucket := 'business_hours';
  ELSE
    -- Off-peak hours not fitting a named bucket — fall into evening_socialiser
    v_bucket := 'evening_socialiser';
  END IF;

  INSERT INTO user_behaviour_buckets (user_id, bucket, score, updated_at)
  VALUES (p_user_id, v_bucket, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET bucket     = EXCLUDED.bucket,
        score      = user_behaviour_buckets.score + 1,
        updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION upsert_behaviour_bucket(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION upsert_behaviour_bucket(uuid) TO authenticated;
