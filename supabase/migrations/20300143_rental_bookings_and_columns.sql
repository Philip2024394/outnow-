-- ═══════════════════════════════════════════════════════════════
-- Migration: rental_bookings, rental_saved_items, rental_reviews
-- + missing columns on rental_listings
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add missing columns to rental_listings ──

ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS video_thumbnail text;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS owner_type text DEFAULT 'owner';
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS whatsapp text;

-- ── 2. rental_bookings ──

CREATE TABLE IF NOT EXISTS rental_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES rental_listings(id) ON DELETE SET NULL,
  listing_ref     text,
  listing_title   text,
  renter_id       uuid REFERENCES auth.users(id),
  renter_name     text,
  renter_phone    text,
  owner_id        uuid,
  start_date      date,
  end_date        date,
  days            integer,
  total           numeric,
  commission      numeric DEFAULT 0,
  add_driver      boolean DEFAULT false,
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','active','completed','cancelled','rejected')),
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;

-- Renters see own bookings
CREATE POLICY "renter_select_bookings" ON rental_bookings
  FOR SELECT USING (auth.uid() = renter_id);

-- Owners see bookings on their listings
CREATE POLICY "owner_select_bookings" ON rental_bookings
  FOR SELECT USING (auth.uid() = owner_id);

-- Authenticated users can create bookings
CREATE POLICY "insert_bookings" ON rental_bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Renter or owner can update
CREATE POLICY "update_bookings" ON rental_bookings
  FOR UPDATE USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_bookings_renter ON rental_bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON rental_bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON rental_bookings(listing_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_rental_bookings_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rental_bookings_updated ON rental_bookings;
CREATE TRIGGER trg_rental_bookings_updated
  BEFORE UPDATE ON rental_bookings
  FOR EACH ROW EXECUTE FUNCTION update_rental_bookings_updated_at();

-- ── 3. rental_saved_items ──

CREATE TABLE IF NOT EXISTS rental_saved_items (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) NOT NULL,
  listing_id  uuid REFERENCES rental_listings(id) ON DELETE CASCADE,
  listing_ref text,
  saved_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_ref)
);

ALTER TABLE rental_saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_saved_select" ON rental_saved_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_saved_insert" ON rental_saved_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_saved_delete" ON rental_saved_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_user ON rental_saved_items(user_id);

-- ── 4. rental_reviews ──

CREATE TABLE IF NOT EXISTS rental_reviews (
  id            bigserial PRIMARY KEY,
  listing_id    uuid,
  listing_ref   text,
  reviewer_id   uuid REFERENCES auth.users(id),
  reviewer_name text,
  rating        integer CHECK (rating >= 1 AND rating <= 5),
  comment       text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE rental_reviews ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "reviews_public_read" ON rental_reviews
  FOR SELECT USING (true);

-- Authenticated users can post
CREATE POLICY "reviews_insert" ON rental_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Own reviews only
CREATE POLICY "reviews_update_own" ON rental_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "reviews_delete_own" ON rental_reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON rental_reviews(listing_ref);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON rental_reviews(reviewer_id);
