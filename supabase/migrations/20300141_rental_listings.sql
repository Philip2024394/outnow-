-- ================================================================
-- rental_listings — Marketplace rental & sale listings
-- ================================================================

create table if not exists rental_listings (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      uuid        references auth.users on delete cascade not null,
  ref           text        unique not null default ('LIST-' || upper(substr(md5(random()::text), 1, 8))),
  title         text        not null,
  description   text,
  category      text        not null,  -- Motorcycles, Cars, Trucks, Buses, Property, Fashion, Electronics, Audio & Sound, Party & Event
  sub_category  text,
  city          text,
  address       text,
  price_day     int,
  price_week    int,
  price_month   int,
  buy_now       jsonb,                 -- null = rental only; { price, negotiable } = for sale
  condition     text        check (condition in ('new', 'like_new', 'good', 'fair')),
  status        text        not null default 'active' check (status in ('active', 'live', 'offline', 'sold', 'expired')),
  images        text[]      default '{}',
  features      text[]      default '{}',
  extra_fields  jsonb       default '{}',  -- brand, model, cc, year, transmission, seats, etc.
  rating        numeric(2,1) default 0,
  review_count  int         default 0,
  view_count    int         default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table rental_listings enable row level security;

-- Anyone can browse listings
drop policy if exists "listings_select" on rental_listings;
create policy "listings_select" on rental_listings for select using (true);

-- Owners can insert their own listings
drop policy if exists "listings_insert" on rental_listings;
create policy "listings_insert" on rental_listings for insert with check (auth.uid() = owner_id);

-- Owners can update their own listings
drop policy if exists "listings_update" on rental_listings;
create policy "listings_update" on rental_listings for update using (auth.uid() = owner_id);

-- Owners can delete their own listings
drop policy if exists "listings_delete" on rental_listings;
create policy "listings_delete" on rental_listings for delete using (auth.uid() = owner_id);

-- Indexes for common queries
create index if not exists idx_listings_category on rental_listings(category, status);
create index if not exists idx_listings_owner on rental_listings(owner_id);
create index if not exists idx_listings_city on rental_listings(city);
create index if not exists idx_listings_search on rental_listings using gin(title gin_trgm_ops);

-- Keep updated_at in sync
drop trigger if exists rental_listings_updated_at on rental_listings;
create trigger rental_listings_updated_at
  before update on rental_listings
  for each row execute procedure touch_updated_at();
