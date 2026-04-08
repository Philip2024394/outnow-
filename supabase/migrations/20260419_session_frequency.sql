-- ─────────────────────────────────────────────────────────────────────────────
-- P8: Predictive Out Soon Profiles
-- Tracks per-user session frequency by day-of-week + hour-of-day.
-- Users who historically go live at this time appear as greyed "Out Soon" pins.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_frequency (
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  day_of_week int  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour_of_day int  NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  count       int  NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, day_of_week, hour_of_day)
);

-- Trigger: on every session INSERT, upsert frequency for current DOW + hour
CREATE OR REPLACE FUNCTION record_session_frequency()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO session_frequency (user_id, day_of_week, hour_of_day, count)
  VALUES (
    NEW.user_id,
    EXTRACT(DOW  FROM now() AT TIME ZONE 'UTC')::int,
    EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC')::int,
    1
  )
  ON CONFLICT (user_id, day_of_week, hour_of_day)
    DO UPDATE SET count = session_frequency.count + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_frequency ON sessions;
CREATE TRIGGER trg_session_frequency
  AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION record_session_frequency();

-- RPC: returns user_ids of users historically active at this day+hour slot.
-- Excludes users who already have an active/scheduled/invite_out session
-- (they are already on the map as real pins — no need to predict).
CREATE OR REPLACE FUNCTION get_predicted_active_users(
  p_day_of_week int,
  p_hour_of_day int,
  p_threshold   int DEFAULT 3
)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT sf.user_id
  FROM session_frequency sf
  WHERE sf.day_of_week = p_day_of_week
    AND sf.hour_of_day = p_hour_of_day
    AND sf.count >= p_threshold
    AND sf.user_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.user_id = sf.user_id
        AND s.status IN ('active', 'scheduled', 'invite_out')
        AND s.expires_at > now()
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_predicted_active_users(int, int, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_predicted_active_users(int, int, int) TO authenticated;
