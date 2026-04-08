-- ── Stock photos marketplace ─────────────────────────────────────────────────
-- Platform owner uploads curated food/restaurant images here.
-- Restaurants browse and purchase one photo for their cover image.
-- Once purchased (restaurant_id set), no other restaurant can buy it.

CREATE TABLE IF NOT EXISTS stock_photos (
  id              bigserial     PRIMARY KEY,
  image_url       text          NOT NULL,
  thumbnail_url   text,                       -- smaller preview for grid
  style_tag       text,                       -- e.g. 'Modern', 'Traditional', 'Rustic'
  price           int           NOT NULL DEFAULT 100000,
  restaurant_id   bigint        REFERENCES restaurants(id) ON DELETE SET NULL,
  purchased_at    timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE stock_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can browse available photos
DROP POLICY IF EXISTS "photos_public_read" ON stock_photos;
CREATE POLICY "photos_public_read" ON stock_photos FOR SELECT USING (true);

-- Restaurant owners can claim a photo (set restaurant_id to their own restaurant)
DROP POLICY IF EXISTS "photos_owner_claim" ON stock_photos;
CREATE POLICY "photos_owner_claim" ON stock_photos FOR UPDATE
  USING (restaurant_id IS NULL)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
    )
  );

-- Admins manage the library
DROP POLICY IF EXISTS "photos_admin_all" ON stock_photos;
CREATE POLICY "photos_admin_all" ON stock_photos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
