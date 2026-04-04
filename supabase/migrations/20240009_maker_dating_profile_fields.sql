-- Maker & Dating extended profile fields
-- Adds new columns to profiles table and rebuilds sessions_with_profiles view

-- Maker columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS price_min          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS price_max          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_name         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trade_role         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS market             text;

-- Dating columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_goal  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS star_sign          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height             text;

-- Language columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS speaking_native    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS speaking_second    text;

-- Photo position / zoom (saved per profile so editing persists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_offset_x     numeric DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_offset_y     numeric DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_zoom         numeric DEFAULT 1;

-- Rebuild sessions_with_profiles to expose all new profile fields
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
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city             AS profile_city,
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
