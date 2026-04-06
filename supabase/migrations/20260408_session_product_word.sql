-- ═══════════════════════════════════════════════════════════════════════════
-- Add product_word and seller_type to sessions
-- Used by business/maker map pins to display e.g. "Handbag Maker"
-- instead of generic category label
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS product_word  text CHECK (char_length(product_word) <= 20),
  ADD COLUMN IF NOT EXISTS seller_type   text CHECK (seller_type IN ('Maker', 'Seller'));

-- Rebuild sessions_with_profiles to expose new columns
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
    p.website_url,
    p.youtube_handle,
    p.speaking_native,
    p.speaking_second,
    p.relationship_goal,
    p.star_sign,
    p.height,
    p.created_at        AS profile_created_at
  FROM sessions s
  LEFT JOIN profiles p ON p.id = s.user_id;

GRANT SELECT ON sessions_with_profiles TO authenticated, anon;
