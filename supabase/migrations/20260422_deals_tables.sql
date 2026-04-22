-- ═══════════════════════════════════════════════════════════════════════════
-- Deal Hunt tables — deals, claims, reviews
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS deals (
  id              bigserial PRIMARY KEY,
  seller_id       uuid NOT NULL REFERENCES profiles(id),
  domain          text NOT NULL CHECK (domain IN ('food', 'marketplace', 'massage', 'rentals', 'rides', 'property')),
  sub_category    text,
  title           text NOT NULL,
  description     text,
  original_price  integer NOT NULL,
  deal_price      integer NOT NULL,
  discount_pct    integer NOT NULL CHECK (discount_pct >= 10 AND discount_pct <= 90),
  quantity_available integer NOT NULL DEFAULT 10,
  quantity_claimed   integer NOT NULL DEFAULT 0,
  quantity_per_user  integer NOT NULL DEFAULT 1,
  images          jsonb DEFAULT '[]'::jsonb,
  start_time      timestamptz NOT NULL DEFAULT now(),
  end_time        timestamptz NOT NULL,
  terms           text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'sold_out')),
  deal_type       text DEFAULT 'delivery' CHECK (deal_type IN ('eat_in', 'delivery', 'pickup', 'all')),
  city            text,
  lat             double precision,
  lng             double precision,
  view_count      integer DEFAULT 0,
  is_hot          boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_seller ON deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_deals_domain ON deals(domain);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_deals_end ON deals(end_time);
CREATE INDEX IF NOT EXISTS idx_deals_created ON deals(created_at);

-- Daily deal limit: unique index on seller_id + date (WIB)
-- Enforced in application layer, but this helps with queries

CREATE TABLE IF NOT EXISTS deal_claims (
  id              bigserial PRIMARY KEY,
  deal_id         bigint NOT NULL REFERENCES deals(id),
  buyer_id        uuid NOT NULL REFERENCES profiles(id),
  voucher_code    text NOT NULL,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'cancelled', 'expired')),
  expires_at      timestamptz NOT NULL,
  claimed_at      timestamptz NOT NULL DEFAULT now(),
  redeemed_at     timestamptz,
  redeem_method   text CHECK (redeem_method IN ('qr', 'code', 'auto')),
  UNIQUE(deal_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_deal ON deal_claims(deal_id);
CREATE INDEX IF NOT EXISTS idx_claims_buyer ON deal_claims(buyer_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON deal_claims(status) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS deal_reviews (
  id              bigserial PRIMARY KEY,
  deal_id         bigint NOT NULL REFERENCES deals(id),
  reviewer_id     uuid NOT NULL REFERENCES profiles(id),
  stars           smallint NOT NULL CHECK (stars >= 1 AND stars <= 5),
  caption         text,
  photo_url       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_reviews_deal ON deal_reviews(deal_id);

-- RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_reviews ENABLE ROW LEVEL SECURITY;

-- Deals: anyone can read active, sellers manage own
CREATE POLICY "Anyone reads active deals" ON deals FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Sellers manage own deals" ON deals FOR ALL USING (seller_id = auth.uid());

-- Claims: buyers manage own
CREATE POLICY "Buyers manage own claims" ON deal_claims FOR ALL USING (buyer_id = auth.uid());
CREATE POLICY "Sellers see claims on their deals" ON deal_claims FOR SELECT USING (
  deal_id IN (SELECT id FROM deals WHERE seller_id = auth.uid())
);

-- Reviews: anyone reads, authors manage own
CREATE POLICY "Anyone reads reviews" ON deal_reviews FOR SELECT USING (true);
CREATE POLICY "Authors manage own reviews" ON deal_reviews FOR ALL USING (reviewer_id = auth.uid());
