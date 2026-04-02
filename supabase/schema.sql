-- ============================================================
-- IMOUTNOW — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid references auth.users on delete cascade primary key,
  display_name text,
  photo_url    text,
  phone        text,
  age          int,
  bio          text,
  city         text,
  activities   text[]  default '{}',
  looking_for  text,
  coins        int     default 65,   -- 65 free coins on signup
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, phone, display_name, coins)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'display_name', new.phone, 'User'),
    65
  )
  on conflict (id) do nothing;
  -- Seed initial coin transaction
  insert into coin_transactions (user_id, type, label, amount)
  values (new.id, 'earn', 'Welcome gift 🎉', 65);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ────────────────────────────────────────────────────────────
-- SESSIONS
-- ────────────────────────────────────────────────────────────
create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade not null,
  status           text not null default 'invite_out',
                   -- invite_out | active | scheduled | expired | ended
  activity_type    text,
  activities       text[] default '{}',
  lat              float8,
  lng              float8,
  place_id         text,
  place_name       text,
  venue_category   text,
  expires_at       timestamptz,
  scheduled_for    timestamptz,
  duration_minutes int default 90,
  needs_check_in   boolean default false,
  is_group         boolean default false,
  group_size       int,
  group_members    jsonb default '[]',
  vibe             text,
  area             text,
  social_link      text,
  message          text,
  created_at       timestamptz default now()
);

alter table sessions enable row level security;

create policy "Anyone can view active sessions"
  on sessions for select using (true);

create policy "Users can insert own sessions"
  on sessions for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on sessions for delete using (auth.uid() = user_id);

-- Enable real-time replication for sessions
alter publication supabase_realtime add table sessions;

-- ────────────────────────────────────────────────────────────
-- INTERESTS (mutual likes / invites)
-- ────────────────────────────────────────────────────────────
create table if not exists interests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade not null,
  session_id   uuid references sessions on delete cascade not null,
  status       text default 'pending',   -- pending | mutual
  gift         text,
  message      text,
  created_at   timestamptz default now(),
  unique (from_user_id, session_id)
);

alter table interests enable row level security;

create policy "Users can view their interests"
  on interests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create interests"
  on interests for insert with check (auth.uid() = from_user_id);

create policy "Users can delete own interests"
  on interests for delete using (auth.uid() = from_user_id);

create policy "Users can update interests"
  on interests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

alter publication supabase_realtime add table interests;

-- ────────────────────────────────────────────────────────────
-- OTW REQUESTS
-- ────────────────────────────────────────────────────────────
create table if not exists otw_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade not null,
  session_id   uuid references sessions on delete cascade not null,
  status       text default 'pending',
               -- pending | accepted | declined | cancelled | paid | proceeding | completed
  eta_minutes  int,
  created_at   timestamptz default now()
);

alter table otw_requests enable row level security;

create policy "Users can view their OTW requests"
  on otw_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create OTW requests"
  on otw_requests for insert with check (auth.uid() = from_user_id);

create policy "Users can update OTW requests"
  on otw_requests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

alter publication supabase_realtime add table otw_requests;

-- ────────────────────────────────────────────────────────────
-- WAVES
-- ────────────────────────────────────────────────────────────
create table if not exists waves (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade not null,
  session_id   uuid references sessions on delete cascade not null,
  created_at   timestamptz default now()
);

alter table waves enable row level security;

create policy "Users can view their waves"
  on waves for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send waves"
  on waves for insert with check (auth.uid() = from_user_id);

-- ────────────────────────────────────────────────────────────
-- BLOCKS
-- ────────────────────────────────────────────────────────────
create table if not exists blocks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  blocked_user_id uuid references auth.users on delete cascade not null,
  created_at      timestamptz default now(),
  unique (user_id, blocked_user_id)
);

alter table blocks enable row level security;

create policy "Users can view own blocks"
  on blocks for select using (auth.uid() = user_id);

create policy "Users can create blocks"
  on blocks for insert with check (auth.uid() = user_id);

create policy "Users can delete own blocks"
  on blocks for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- COIN TRANSACTIONS
-- ────────────────────────────────────────────────────────────
create table if not exists coin_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  type       text not null,   -- earn | spend | topup
  label      text,
  amount     int not null,
  created_at timestamptz default now()
);

alter table coin_transactions enable row level security;

create policy "Users can view own transactions"
  on coin_transactions for select using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on coin_transactions for insert with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- REPORTS
-- ────────────────────────────────────────────────────────────
create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references auth.users on delete cascade not null,
  reported_user_id uuid references auth.users on delete cascade not null,
  session_id      uuid references sessions on delete set null,
  reason          text,
  details         text,
  created_at      timestamptz default now()
);

alter table reports enable row level security;

create policy "Users can create reports"
  on reports for insert with check (auth.uid() = reporter_id);

-- ────────────────────────────────────────────────────────────
-- VENUE UNLOCKS
-- ────────────────────────────────────────────────────────────
create table if not exists venue_unlocks (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid references auth.users on delete cascade not null,
  session_id uuid references sessions on delete cascade not null,
  created_at timestamptz default now(),
  unique (buyer_id, session_id)
);

alter table venue_unlocks enable row level security;

create policy "Users can view own unlocks"
  on venue_unlocks for select using (auth.uid() = buyer_id);

create policy "Users can create unlocks"
  on venue_unlocks for insert with check (auth.uid() = buyer_id);

-- ────────────────────────────────────────────────────────────
-- CONVENIENCE VIEW: sessions joined with profiles
-- ────────────────────────────────────────────────────────────
create or replace view sessions_with_profiles as
  select
    s.*,
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city as profile_city
  from sessions s
  left join profiles p on p.id = s.user_id;

-- ────────────────────────────────────────────────────────────
-- RPC: go_live — end existing active session and start new one
-- ────────────────────────────────────────────────────────────
create or replace function go_live(
  p_activity_type  text,
  p_activities     text[],
  p_lat            float8,
  p_lng            float8,
  p_place_id       text,
  p_place_name     text,
  p_venue_category text,
  p_duration_min   int default 90,
  p_is_group       boolean default false,
  p_group_size     int default null,
  p_vibe           text default null,
  p_area           text default null
)
returns uuid language plpgsql security definer as $$
declare
  new_id uuid;
begin
  -- End any existing active/scheduled/invite_out session for this user
  update sessions
    set status = 'ended'
    where user_id = auth.uid()
      and status in ('active', 'scheduled', 'invite_out');

  -- Insert the new active session
  insert into sessions (
    user_id, status, activity_type, activities,
    lat, lng, place_id, place_name, venue_category,
    duration_minutes, expires_at,
    is_group, group_size, vibe, area
  ) values (
    auth.uid(), 'active', p_activity_type, p_activities,
    p_lat, p_lng, p_place_id, p_place_name, p_venue_category,
    p_duration_min, now() + (p_duration_min * interval '1 minute'),
    p_is_group, p_group_size, p_vibe, p_area
  ) returning id into new_id;

  return new_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- RPC: schedule_live — create a scheduled session
-- ────────────────────────────────────────────────────────────
create or replace function schedule_live(
  p_activity_type  text,
  p_activities     text[],
  p_lat            float8,
  p_lng            float8,
  p_place_id       text,
  p_place_name     text,
  p_venue_category text,
  p_duration_min   int default 90,
  p_scheduled_for  timestamptz default null,
  p_social_link    text default null,
  p_vibe           text default null
)
returns uuid language plpgsql security definer as $$
declare
  new_id uuid;
begin
  update sessions
    set status = 'ended'
    where user_id = auth.uid()
      and status in ('active', 'scheduled', 'invite_out');

  insert into sessions (
    user_id, status, activity_type, activities,
    lat, lng, place_id, place_name, venue_category,
    duration_minutes, scheduled_for, expires_at,
    social_link, vibe
  ) values (
    auth.uid(), 'scheduled', p_activity_type, p_activities,
    p_lat, p_lng, p_place_id, p_place_name, p_venue_category,
    p_duration_min, p_scheduled_for,
    p_scheduled_for + (p_duration_min * interval '1 minute'),
    p_social_link, p_vibe
  ) returning id into new_id;

  return new_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- RPC: post_invite_out
-- ────────────────────────────────────────────────────────────
create or replace function post_invite_out(
  p_activity_type text default null,
  p_message       text default ''
)
returns uuid language plpgsql security definer as $$
declare
  new_id uuid;
begin
  update sessions
    set status = 'ended'
    where user_id = auth.uid()
      and status in ('active', 'scheduled', 'invite_out');

  insert into sessions (user_id, status, activity_type, message)
  values (auth.uid(), 'invite_out', p_activity_type, p_message)
  returning id into new_id;

  return new_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- RPC: end_session
-- ────────────────────────────────────────────────────────────
create or replace function end_session(p_session_id uuid)
returns void language plpgsql security definer as $$
begin
  update sessions
    set status = 'ended'
    where id = p_session_id and user_id = auth.uid();
end;
$$;

-- ────────────────────────────────────────────────────────────
-- RPC: adjust_coins — safely update user coin balance
-- ────────────────────────────────────────────────────────────
create or replace function adjust_coins(p_delta int, p_label text, p_type text)
returns int language plpgsql security definer as $$
declare
  new_balance int;
begin
  update profiles
    set coins = greatest(0, coins + p_delta),
        updated_at = now()
    where id = auth.uid()
    returning coins into new_balance;

  insert into coin_transactions (user_id, type, label, amount)
  values (auth.uid(), p_type, p_label, abs(p_delta));

  return new_balance;
end;
$$;
