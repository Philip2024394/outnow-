-- Ensure tags column exists (idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Ensure social/verification columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_handle    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_handle  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url      text;

-- Rebuild sessions_with_profiles with all columns CityResultsSheet + useLiveUsers need
DROP VIEW IF EXISTS sessions_with_profiles;
CREATE VIEW sessions_with_profiles AS
SELECT
  s.*,
  p.display_name,
  p.photo_url,
  p.age,
  p.looking_for,
  p.city           AS profile_city,
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
  p.created_at     AS profile_created_at,
  p.tags,
  p.instagram_handle,
  p.tiktok_handle,
  p.facebook_handle,
  p.website_url
FROM sessions s
LEFT JOIN profiles p ON p.id = s.user_id;
