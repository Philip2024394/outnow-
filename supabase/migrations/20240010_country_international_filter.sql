-- Country-based map filtering + international visibility for Business tier
-- Default: users only see sessions from their own country
-- international = true: session appears on maps in ALL countries (Business tier perk)

-- Add country to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;

-- Add international flag to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS international boolean DEFAULT false;

-- Rebuild view to expose country + international
DROP VIEW IF EXISTS sessions_with_profiles;
CREATE VIEW sessions_with_profiles AS
  SELECT
    s.id,
    s.user_id,
    s.status,
    s.activity_type,
    s.activities,
    s.lat,
    s.lng,
    -- place_name, place_id, venue_category intentionally excluded
    s.message,
    s.area,
    s.vibe,
    s.duration_minutes,
    s.expires_at,
    s.scheduled_for,
    s.needs_check_in,
    s.is_group,
    s.group_size,
    s.group_members,
    s.social_link,
    s.created_at,
    s.international,
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city             AS profile_city,
    p.country,
    p.is_verified,
    p.is_banned,
    -- Extended profile fields
    p.speaking_native,
    p.speaking_second,
    p.price_min,
    p.price_max,
    p.brand_name,
    p.trade_role,
    p.market,
    p.relationship_goal,
    p.star_sign,
    p.height,
    p.photo_offset_x,
    p.photo_offset_y,
    p.photo_zoom,
    p.extra_photos,
    p.created_at       AS profile_created_at
  FROM sessions s
  LEFT JOIN profiles p ON p.id = s.user_id;
