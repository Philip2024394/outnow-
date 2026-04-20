CREATE TABLE IF NOT EXISTS deal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  deal_title VARCHAR(100) NOT NULL,
  seller_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  reviewer_name VARCHAR(100),
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  photo_url TEXT,
  caption VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deal_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON deal_reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON deal_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE INDEX idx_deal_reviews_deal ON deal_reviews(deal_title, seller_id);
CREATE INDEX idx_deal_reviews_seller ON deal_reviews(seller_id);
