CREATE TABLE IF NOT EXISTS order_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref VARCHAR(50),
  conversation_id VARCHAR(100),
  buyer_id UUID,
  seller_id UUID,
  cancelled_by VARCHAR(10) NOT NULL CHECK (cancelled_by IN ('seller', 'buyer', 'system')),
  order_total DECIMAL(15,2) DEFAULT 0,
  reason TEXT,
  items JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigated', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read all cancellations" ON order_cancellations FOR SELECT USING (true);
CREATE INDEX idx_cancellations_date ON order_cancellations(created_at DESC);
CREATE INDEX idx_cancellations_seller ON order_cancellations(seller_id);
CREATE INDEX idx_cancellations_buyer ON order_cancellations(buyer_id);
