-- Add redeem_method to track how deal was redeemed
ALTER TABLE deal_claims ADD COLUMN IF NOT EXISTS redeem_method VARCHAR(20) DEFAULT 'manual';

-- Add location fields to deals if not present
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lat DECIMAL(10,6);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lng DECIMAL(10,6);

-- Function to restore quantity when voucher expires
CREATE OR REPLACE FUNCTION decrement_deal_claimed(p_deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE deals SET quantity_claimed = GREATEST(0, quantity_claimed - 1),
    status = CASE WHEN status = 'sold_out' THEN 'active' ELSE status END
  WHERE id = p_deal_id;
END;
$$ LANGUAGE plpgsql;

-- Add eat_in flag and same-day expiry support
ALTER TABLE deal_claims ADD COLUMN IF NOT EXISTS is_eat_in BOOLEAN DEFAULT FALSE;
