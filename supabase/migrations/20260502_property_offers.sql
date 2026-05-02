-- ══════════════════════════════════════════════════════════════════════
-- Property Offers — buyers make offers, sellers respond
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS property_offers (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  listing_title TEXT,
  listing_price BIGINT,
  offer_amount BIGINT NOT NULL,
  offer_type TEXT DEFAULT 'buy', -- buy or rent
  buyer_id UUID REFERENCES auth.users(id),
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, countered, rejected, redirected, expired
  counter_amount BIGINT,
  seller_id UUID,
  seller_message TEXT,
  redirect_listing_id TEXT,
  redirect_listing_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add min_accepted_price to rental_listings
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS min_accepted_price BIGINT;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS offers_enabled BOOLEAN DEFAULT TRUE;

-- RLS
ALTER TABLE property_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer_read_buyer" ON property_offers FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "offer_read_seller" ON property_offers FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "offer_insert" ON property_offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "offer_update_seller" ON property_offers FOR UPDATE USING (auth.uid() = seller_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_listing ON property_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON property_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON property_offers(status);
