-- Micro Shop: product listings tied to user profiles
-- Gated: Premium (max 6 products) / Business (unlimited)

CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  currency      char(3) NOT NULL DEFAULT 'GBP',
  image_url     text,
  description   text CHECK (char_length(description) <= 300),
  order_index   int NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user product lookups
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id, order_index);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active products
CREATE POLICY "products_read_active"
  ON products FOR SELECT
  USING (active = true);

-- Owner can read all their products (including inactive)
CREATE POLICY "products_owner_read_all"
  ON products FOR SELECT
  USING (user_id = auth.uid());

-- Owner can insert — limit enforced in application layer
CREATE POLICY "products_owner_insert"
  ON products FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Owner can update their own products
CREATE POLICY "products_owner_update"
  ON products FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Owner can delete their own products
CREATE POLICY "products_owner_delete"
  ON products FOR DELETE
  USING (user_id = auth.uid());

-- Storage bucket for product images (run once via dashboard or here)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read, owner can write
-- CREATE POLICY "product_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
-- CREATE POLICY "product_images_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
