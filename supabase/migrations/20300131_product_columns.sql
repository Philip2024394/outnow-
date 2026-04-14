-- ================================================================
-- Product table enhancements — full marketplace listing fields
-- ================================================================

-- Core fields that were missing
alter table products add column if not exists category          text;
alter table products add column if not exists specs             jsonb;
alter table products add column if not exists variants          jsonb;
alter table products add column if not exists images            text[];
alter table products add column if not exists stock             int;
alter table products add column if not exists sale_price        numeric;
alter table products add column if not exists condition         text;
alter table products add column if not exists tags              text[];

-- Shipping & manufacturing
alter table products add column if not exists weight_grams      numeric;
alter table products add column if not exists dimensions        text;
alter table products add column if not exists made_in           text;
alter table products add column if not exists year_manufactured text;

-- Market & compliance
alter table products add column if not exists custom_order      text;
alter table products add column if not exists market_scope      text;
alter table products add column if not exists child_certified   text;
alter table products add column if not exists eu_certification  text;

-- Policy
alter table products add column if not exists return_policy     text;

-- Search performance
create index if not exists idx_products_category on products(category) where active = true;
create index if not exists idx_products_name_search on products using gin(name gin_trgm_ops);
create index if not exists idx_products_tags on products using gin(tags) where active = true;
create index if not exists idx_products_price on products(price) where active = true;
