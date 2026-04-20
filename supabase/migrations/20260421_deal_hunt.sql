-- ─────────────────────────────────────────────────────────────────────────────
-- Deal Hunt — deals + claims tables
-- ─────────────────────────────────────────────────────────────────────────────

-- deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  domain VARCHAR(50) NOT NULL, -- food, marketplace, massage, rentals, rides
  sub_category VARCHAR(50),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  original_price DECIMAL(15,2) NOT NULL,
  deal_price DECIMAL(15,2) NOT NULL,
  discount_pct DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((original_price - deal_price) / original_price * 100, 1)) STORED,
  quantity_available INT NOT NULL DEFAULT 1,
  quantity_claimed INT NOT NULL DEFAULT 0,
  quantity_per_user INT NOT NULL DEFAULT 1,
  images JSONB DEFAULT '[]',
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  redemption_method VARCHAR(20) NOT NULL DEFAULT 'chat' CHECK (redemption_method IN ('chat','qr','voucher')),
  terms TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','sold_out','cancelled')),
  seller_name VARCHAR(100),
  seller_photo TEXT,
  seller_rating DECIMAL(3,1),
  city VARCHAR(100),
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  view_count INT DEFAULT 0,
  claim_count INT DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- deal_claims table
CREATE TABLE IF NOT EXISTS deal_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  buyer_id UUID NOT NULL,
  voucher_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','cancelled')),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- RLS policies
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active deals" ON deals FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers manage own deals" ON deals FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Buyers read own claims" ON deal_claims FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers create claims" ON deal_claims FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Indexes
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_end_time ON deals(end_time);
CREATE INDEX idx_deals_domain ON deals(domain);
CREATE INDEX idx_deal_claims_buyer ON deal_claims(buyer_id);
CREATE INDEX idx_deal_claims_deal ON deal_claims(deal_id);

-- Deal type, minimum discount, and Indoo Ride columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_type VARCHAR(20) DEFAULT 'pickup' CHECK (deal_type IN ('eat_in', 'delivery', 'pickup'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS min_discount_pct DECIMAL(5,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS indoo_ride BOOLEAN DEFAULT FALSE;
