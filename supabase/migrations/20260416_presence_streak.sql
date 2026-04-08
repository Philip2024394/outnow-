-- ─────────────────────────────────────────────────────────────────────────────
-- P7: Presence Streak
-- Tracks consecutive days a user has gone live.
-- Streak increments on each new day, resets if a day is missed.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. New columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS presence_streak   int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_session_date date DEFAULT NULL;

-- 2. Trigger function: fires on sessions INSERT
CREATE OR REPLACE FUNCTION update_presence_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last date;
  v_today date := CURRENT_DATE;
BEGIN
  SELECT last_session_date INTO v_last
    FROM profiles WHERE id = NEW.user_id;

  IF v_last = v_today THEN
    -- Already counted today — do nothing
    NULL;
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    -- Consecutive day — increment streak
    UPDATE profiles
      SET presence_streak   = presence_streak + 1,
          last_session_date = v_today
      WHERE id = NEW.user_id;
  ELSE
    -- Missed a day or first session ever — reset to 1
    UPDATE profiles
      SET presence_streak   = 1,
          last_session_date = v_today
      WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to sessions INSERT
DROP TRIGGER IF EXISTS trg_presence_streak ON sessions;
CREATE TRIGGER trg_presence_streak
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_presence_streak();

-- 4. Expose presence_streak in sessions_with_profiles view
--    Must DROP first — cannot reorder columns with CREATE OR REPLACE
DROP VIEW IF EXISTS sessions_with_profiles;

CREATE VIEW sessions_with_profiles AS
SELECT
  s.*,
  p.display_name,
  p.photo_url,
  p.age,
  p.looking_for,
  p.city              AS profile_city,
  p.country,
  p.bio,
  p.is_verified,
  p.is_banned,
  p.tier,
  p.market,
  p.price_min,
  p.price_max,
  p.brand_name,
  p.trade_role,
  p.tags,
  p.extra_photos,
  p.instagram_handle,
  p.tiktok_handle,
  p.facebook_handle,
  p.youtube_handle,
  p.website_url,
  p.speaking_native,
  p.speaking_second,
  p.relationship_goal,
  p.star_sign,
  p.height,
  p.created_at        AS profile_created_at,
  p.contact_platform,
  p.chat_enabled,
  p.photo_offset_x,
  p.photo_offset_y,
  p.photo_zoom,
  p.cuisine_type,
  p.target_audience,
  p.shop_type,
  p.presence_streak
FROM sessions s
LEFT JOIN profiles p ON p.id = s.user_id;

GRANT SELECT ON sessions_with_profiles TO authenticated, anon;
