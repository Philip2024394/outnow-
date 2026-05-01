-- Places business listings, reviews, and analytics

CREATE TABLE IF NOT EXISTS places_listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES auth.users(id),
  business_name   text NOT NULL,
  owner_name      text NOT NULL,
  whatsapp        text NOT NULL,
  bio             text,
  category        text NOT NULL,
  address         text,
  lat             numeric,
  lng             numeric,
  image_url       text,
  instagram       text,
  facebook        text,
  tiktok          text,
  primary_social  text DEFAULT 'instagram',
  tier            text DEFAULT 'basic' CHECK (tier IN ('basic', 'premium')),
  fee_paid        numeric DEFAULT 100000,
  payment_screenshot text,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified        boolean DEFAULT false,
  view_count      integer DEFAULT 0,
  ride_count      integer DEFAULT 0,
  rating_avg      numeric DEFAULT 0,
  rating_count    integer DEFAULT 0,
  referral_code   text UNIQUE,
  referred_by     text,
  activated_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE places_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_approved" ON places_listings FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id);
CREATE POLICY "owner_insert" ON places_listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "owner_update" ON places_listings FOR UPDATE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS places_reviews (
  id            bigserial PRIMARY KEY,
  listing_id    uuid REFERENCES places_listings(id) ON DELETE CASCADE,
  reviewer_id   uuid REFERENCES auth.users(id),
  reviewer_name text,
  rating        integer CHECK (rating >= 1 AND rating <= 5),
  comment       text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE places_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_reviews" ON places_reviews FOR SELECT USING (true);
CREATE POLICY "auth_insert_review" ON places_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "own_review_update" ON places_reviews FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE TABLE IF NOT EXISTS places_analytics (
  id          bigserial PRIMARY KEY,
  listing_id  uuid REFERENCES places_listings(id) ON DELETE CASCADE,
  event_type  text CHECK (event_type IN ('view', 'ride_booked', 'social_click', 'whatsapp_click')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE places_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_read_analytics" ON places_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM places_listings WHERE id = listing_id AND owner_id = auth.uid())
);
CREATE POLICY "insert_analytics" ON places_analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_places_status ON places_listings(status);
CREATE INDEX IF NOT EXISTS idx_places_category ON places_listings(category);
CREATE INDEX IF NOT EXISTS idx_places_referral ON places_listings(referral_code);
CREATE INDEX IF NOT EXISTS idx_places_reviews_listing ON places_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_places_analytics_listing ON places_analytics(listing_id);
