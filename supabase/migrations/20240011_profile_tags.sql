-- Add search tags array to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Rebuild sessions_with_profiles view to include tags
DROP VIEW IF EXISTS sessions_with_profiles;
CREATE VIEW sessions_with_profiles AS
SELECT
  s.*,
  s.international,
  p.display_name,
  p.photo_url,
  p.age,
  p.looking_for,
  p.city        AS profile_city,
  p.country,
  p.bio,
  p.extra_photos,
  p.is_verified,
  p.market,
  p.price_min,
  p.price_max,
  p.brand_name,
  p.trade_role,
  p.relationship_goal,
  p.star_sign,
  p.height,
  p.speaking_native,
  p.speaking_second,
  p.created_at  AS profile_created_at,
  p.tags
FROM sessions s
LEFT JOIN profiles p ON p.id = s.user_id;
