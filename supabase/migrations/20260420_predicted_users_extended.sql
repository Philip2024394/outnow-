-- ─────────────────────────────────────────────────────────────────────────────
-- P8 (ext): Extend get_predicted_active_users to return profile + last position
-- Pins need display_name, photo_url, and a lat/lng to render on the map.
-- Uses the user's most recent session for coordinates.
-- ─────────────────────────────────────────────────────────────────────────────

-- Must drop before recreating with different return columns
DROP FUNCTION IF EXISTS get_predicted_active_users(int, int, int);

CREATE OR REPLACE FUNCTION get_predicted_active_users(
  p_day_of_week int,
  p_hour_of_day int,
  p_threshold   int DEFAULT 3
)
RETURNS TABLE(
  user_id      uuid,
  display_name text,
  photo_url    text,
  last_lat     float,
  last_lng     float,
  looking_for  text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sf.user_id)
    sf.user_id,
    p.display_name,
    p.photo_url,
    s.lat::float,
    s.lng::float,
    p.looking_for
  FROM session_frequency sf
  JOIN profiles p ON p.id = sf.user_id
  -- Most recent session for last known position
  LEFT JOIN LATERAL (
    SELECT lat, lng FROM sessions
    WHERE user_id = sf.user_id
    ORDER BY created_at DESC
    LIMIT 1
  ) s ON true
  WHERE sf.day_of_week = p_day_of_week
    AND sf.hour_of_day = p_hour_of_day
    AND sf.count >= p_threshold
    AND sf.user_id != auth.uid()
    AND s.lat IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM sessions active_s
      WHERE active_s.user_id = sf.user_id
        AND active_s.status IN ('active', 'scheduled', 'invite_out')
        AND active_s.expires_at > now()
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_predicted_active_users(int, int, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_predicted_active_users(int, int, int) TO authenticated;
