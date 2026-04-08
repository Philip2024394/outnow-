-- ─────────────────────────────────────────────────────────────────────────────
-- Contact Options for Business Users
-- Adds: contact_platform, contact_number, chat_enabled to profiles
-- Also adds: cuisine_type, target_audience, shop_type (maker category fields)
-- ─────────────────────────────────────────────────────────────────────────────

-- Platform slug (e.g. 'whatsapp', 'telegram', 'instagram') — kept as text for
-- flexibility; validated on the client rather than as a DB enum so new platforms
-- can be added without a schema migration.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS contact_platform  text,
  ADD COLUMN IF NOT EXISTS contact_number    text,
  ADD COLUMN IF NOT EXISTS chat_enabled      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cuisine_type      text,
  ADD COLUMN IF NOT EXISTS target_audience   jsonb,
  ADD COLUMN IF NOT EXISTS shop_type         text;

-- Index for quick lookup of profiles that have a contact method set
CREATE INDEX IF NOT EXISTS profiles_contact_platform_idx
  ON profiles (contact_platform)
  WHERE contact_platform IS NOT NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- contact_number is sensitive: only the owner can read their own raw number.
-- Buyers see it ONLY via the contact_unlock reveal endpoint (server-side check).
-- The existing profiles RLS already restricts UPDATE to the row owner, so no
-- extra policy needed for write access.

-- Expose contact_platform (not the number) in sessions_with_profiles view so
-- MakerCard can show the platform badge without revealing the actual number.
-- Must DROP first — CREATE OR REPLACE cannot reorder or rename existing columns.
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
  -- contact_platform exposed (not contact_number — that stays server-side only)
  p.contact_platform,
  p.chat_enabled,
  p.photo_offset_x,
  p.photo_offset_y,
  p.photo_zoom,
  p.cuisine_type,
  p.target_audience,
  p.shop_type
FROM sessions s
LEFT JOIN profiles p ON p.id = s.user_id;

GRANT SELECT ON sessions_with_profiles TO authenticated, anon;

-- ─── Backend gate note ───────────────────────────────────────────────────────
-- The contact reveal endpoint must:
--   1. Verify a row exists in contact_unlocks WHERE buyer_id = $buyer AND seller_id = $seller
--      OR (buyer.country = seller.country AND seller.tier IS NOT NULL)
--   2. Only then SELECT contact_number FROM profiles WHERE id = $seller
--   3. Return { contactPlatform, contactNumber } — never expose contact_number in
--      sessions_with_profiles or any public view.
