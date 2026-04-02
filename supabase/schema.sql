-- ================================================================
-- IMOUTNOW — Complete Supabase Schema
-- Copy and paste the entire file into:
-- Supabase Dashboard → SQL Editor → New query → Run all
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ================================================================
-- coin_transactions  (must exist before profiles trigger references it)
-- ================================================================
create table if not exists coin_transactions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users on delete cascade not null,
  type       text        not null,   -- earn | spend | topup
  label      text,
  amount     int         not null check (amount > 0),
  created_at timestamptz default now()
);

alter table coin_transactions enable row level security;

drop policy if exists "coins_select" on coin_transactions;
drop policy if exists "coins_insert" on coin_transactions;
create policy "coins_select" on coin_transactions for select using (auth.uid() = user_id);
create policy "coins_insert" on coin_transactions for insert with check (auth.uid() = user_id);

create index if not exists idx_coins_user on coin_transactions(user_id, created_at desc);

-- ================================================================
-- profiles
-- One row per auth user. Auto-created by trigger on sign-up.
-- 65 free coins awarded on first login.
-- ================================================================
create table if not exists profiles (
  id            uuid        references auth.users on delete cascade primary key,
  display_name  text,
  photo_url     text,
  phone         text,
  age           int         check (age is null or (age >= 18 and age <= 99)),
  bio           text        check (bio is null or length(bio) <= 350),
  city          text,
  country       text,
  activities    text[]      default '{}',
  looking_for   text,
  gender        text,
  coins         int         not null default 65,
  is_verified   boolean     default false,
  is_banned     boolean     default false,
  push_token    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

create index if not exists idx_profiles_name on profiles using gin(display_name gin_trgm_ops);

-- Auto-create profile + welcome coins when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, display_name, coins)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'display_name', new.phone, 'User'),
    65
  )
  on conflict (id) do nothing;

  insert into coin_transactions (user_id, type, label, amount)
  values (new.id, 'earn', 'Welcome gift 🎉', 65)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Keep updated_at in sync
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure touch_updated_at();

-- ================================================================
-- sessions
-- status: invite_out | active | scheduled | expired | ended
-- ================================================================
create table if not exists sessions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references auth.users on delete cascade not null,
  status           text        not null default 'invite_out',
  activity_type    text,
  activities       text[]      default '{}',
  lat              float8,
  lng              float8,
  place_id         text,
  place_name       text,
  venue_category   text,
  expires_at       timestamptz,
  scheduled_for    timestamptz,
  duration_minutes int         default 90,
  needs_check_in   boolean     default false,
  is_group         boolean     default false,
  group_size       int,
  group_members    jsonb       default '[]',
  vibe             text,
  area             text,
  social_link      text,
  message          text        check (message is null or length(message) <= 350),
  created_at       timestamptz default now()
);

alter table sessions enable row level security;

drop policy if exists "sessions_select" on sessions;
drop policy if exists "sessions_insert" on sessions;
drop policy if exists "sessions_update" on sessions;
drop policy if exists "sessions_delete" on sessions;
create policy "sessions_select" on sessions for select using (true);
create policy "sessions_insert" on sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on sessions for update using (auth.uid() = user_id);
create policy "sessions_delete" on sessions for delete using (auth.uid() = user_id);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_status  on sessions(status);
create index if not exists idx_sessions_geo     on sessions(lat, lng)
  where lat is not null and lng is not null;

alter publication supabase_realtime add table sessions;

-- View: sessions joined with profile data (used by useLiveUsers)
create or replace view sessions_with_profiles as
  select
    s.*,
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city   as profile_city,
    p.is_verified,
    p.is_banned
  from sessions s
  left join profiles p on p.id = s.user_id;

-- ================================================================
-- notifications  (must exist before interests trigger)
-- type: match | like | wave | gift | otw | system | digest
-- ================================================================
create table if not exists notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users on delete cascade not null,
  type         text        not null,
  title        text        not null,
  body         text,
  from_user_id uuid        references auth.users on delete set null,
  session_id   uuid        references sessions   on delete set null,
  read         boolean     default false,
  created_at   timestamptz default now(),
  constraint notifs_unique unique (user_id, type, from_user_id, session_id)
    deferrable initially deferred
);

alter table notifications enable row level security;

drop policy if exists "notifs_select" on notifications;
drop policy if exists "notifs_insert" on notifications;
drop policy if exists "notifs_update" on notifications;
create policy "notifs_select" on notifications for select using (auth.uid() = user_id);
create policy "notifs_insert" on notifications for insert with check (true);
create policy "notifs_update" on notifications for update using (auth.uid() = user_id);

create index if not exists idx_notifs_user on notifications(user_id, read, created_at desc);

alter publication supabase_realtime add table notifications;

-- ================================================================
-- conversations  (must exist before interests trigger)
-- status: free | pending | unlocked | expired
-- ================================================================
create table if not exists conversations (
  id              uuid        primary key default gen_random_uuid(),
  user_a_id       uuid        references auth.users on delete cascade not null,
  user_b_id       uuid        references auth.users on delete cascade not null,
  session_id      uuid        references sessions   on delete set null,
  status          text        default 'free',
  opened_at       timestamptz,
  expires_at      timestamptz,
  last_message    text,
  last_message_at timestamptz,
  unread_a        int         default 0,
  unread_b        int         default 0,
  created_at      timestamptz default now(),
  unique (
    least(user_a_id::text, user_b_id::text),
    greatest(user_a_id::text, user_b_id::text)
  )
);

alter table conversations enable row level security;

drop policy if exists "convs_select" on conversations;
drop policy if exists "convs_update" on conversations;
create policy "convs_select" on conversations for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "convs_update" on conversations for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create index if not exists idx_convs_user_a on conversations(user_a_id);
create index if not exists idx_convs_user_b on conversations(user_b_id);

alter publication supabase_realtime add table conversations;

-- ================================================================
-- interests  (mutual like system)
-- ================================================================
create table if not exists interests (
  id           uuid        primary key default gen_random_uuid(),
  from_user_id uuid        references auth.users on delete cascade not null,
  to_user_id   uuid        references auth.users on delete cascade not null,
  session_id   uuid        references sessions   on delete cascade not null,
  status       text        default 'pending',   -- pending | mutual
  gift         text,
  message      text        check (message is null or length(message) <= 350),
  created_at   timestamptz default now(),
  unique (from_user_id, session_id)
);

alter table interests enable row level security;

drop policy if exists "interests_select" on interests;
drop policy if exists "interests_insert" on interests;
drop policy if exists "interests_update" on interests;
drop policy if exists "interests_delete" on interests;
create policy "interests_select" on interests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "interests_insert" on interests for insert
  with check (auth.uid() = from_user_id);
create policy "interests_update" on interests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "interests_delete" on interests for delete
  using (auth.uid() = from_user_id);

create index if not exists idx_interests_from on interests(from_user_id);
create index if not exists idx_interests_to   on interests(to_user_id);

alter publication supabase_realtime add table interests;

-- Trigger: when both sides like each other → mark mutual,
--          auto-create conversation, notify both users
create or replace function check_mutual_interest()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reverse_row interests%rowtype;
begin
  select * into reverse_row
    from interests
    where from_user_id = new.to_user_id
      and to_user_id   = new.from_user_id
      and session_id   = new.session_id
      and status       = 'pending';

  if found then
    update interests set status = 'mutual'
      where (from_user_id = new.from_user_id and to_user_id = new.to_user_id   and session_id = new.session_id)
         or (from_user_id = new.to_user_id   and to_user_id = new.from_user_id and session_id = new.session_id);

    insert into conversations (user_a_id, user_b_id, session_id, status)
    values (new.from_user_id, new.to_user_id, new.session_id, 'free')
    on conflict (
      least(user_a_id::text, user_b_id::text),
      greatest(user_a_id::text, user_b_id::text)
    ) do nothing;

    insert into notifications (user_id, type, title, body, from_user_id)
    values
      (new.from_user_id, 'match', 'You matched! 🔥', 'You both liked each other — say hi!', new.to_user_id),
      (new.to_user_id,   'match', 'You matched! 🔥', 'You both liked each other — say hi!', new.from_user_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_interest_created on interests;
create trigger on_interest_created
  after insert on interests
  for each row execute procedure check_mutual_interest();

-- ================================================================
-- messages
-- ================================================================
create table if not exists messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        references conversations on delete cascade not null,
  sender_id       uuid        references auth.users   on delete cascade not null,
  text            text        not null check (length(text) <= 1000),
  liked           boolean     default false,
  deleted_at      timestamptz,
  created_at      timestamptz default now()
);

alter table messages enable row level security;

drop policy if exists "msgs_select" on messages;
drop policy if exists "msgs_insert" on messages;
drop policy if exists "msgs_update" on messages;
create policy "msgs_select" on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  ));
create policy "msgs_insert" on messages for insert with check (auth.uid() = sender_id);
create policy "msgs_update" on messages for update using (auth.uid() = sender_id);

create index if not exists idx_msgs_conv on messages(conversation_id, created_at);

alter publication supabase_realtime add table messages;

-- Trigger: update conversation last_message + unread counts + start 10-min window
create or replace function on_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  conv conversations%rowtype;
begin
  select * into conv from conversations where id = new.conversation_id;

  update conversations set
    last_message    = new.text,
    last_message_at = new.created_at,
    unread_a   = case when conv.user_a_id != new.sender_id then unread_a + 1 else unread_a end,
    unread_b   = case when conv.user_b_id != new.sender_id then unread_b + 1 else unread_b end,
    opened_at  = coalesce(conv.opened_at,  new.created_at),
    expires_at = coalesce(conv.expires_at, new.created_at + interval '10 minutes'),
    status     = case when conv.status = 'free' then 'pending' else conv.status end
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists on_message_created on messages;
create trigger on_message_created
  after insert on messages
  for each row execute procedure on_new_message();

-- ================================================================
-- moments  (24-hour photo/text posts while live)
-- ================================================================
create table if not exists moments (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users on delete cascade not null,
  session_id uuid        references sessions   on delete cascade,
  photo_url  text,
  caption    text        check (caption is null or length(caption) <= 350),
  emoji      text,
  gradient   text,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

alter table moments enable row level security;

drop policy if exists "moments_select" on moments;
drop policy if exists "moments_insert" on moments;
drop policy if exists "moments_delete" on moments;
create policy "moments_select" on moments for select using (true);
create policy "moments_insert" on moments for insert with check (auth.uid() = user_id);
create policy "moments_delete" on moments for delete using (auth.uid() = user_id);

create index if not exists idx_moments_session  on moments(session_id);
create index if not exists idx_moments_user     on moments(user_id);
create index if not exists idx_moments_expires  on moments(expires_at);

alter publication supabase_realtime add table moments;

-- ================================================================
-- profile_views  (who viewed your profile)
-- ================================================================
create table if not exists profile_views (
  id         uuid        primary key default gen_random_uuid(),
  viewer_id  uuid        references auth.users on delete cascade not null,
  viewed_id  uuid        references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  unique (viewer_id, viewed_id, date_trunc('day', created_at))
);

alter table profile_views enable row level security;

drop policy if exists "views_select" on profile_views;
drop policy if exists "views_insert" on profile_views;
create policy "views_select" on profile_views for select using (auth.uid() = viewed_id);
create policy "views_insert" on profile_views for insert with check (auth.uid() = viewer_id);

create index if not exists idx_views_viewed on profile_views(viewed_id, created_at desc);

-- ================================================================
-- otw_requests  (On The Way)
-- status: pending | accepted | declined | cancelled | paid | proceeding | completed
-- ================================================================
create table if not exists otw_requests (
  id           uuid        primary key default gen_random_uuid(),
  from_user_id uuid        references auth.users on delete cascade not null,
  to_user_id   uuid        references auth.users on delete cascade not null,
  session_id   uuid        references sessions   on delete cascade not null,
  status       text        default 'pending',
  eta_minutes  int,
  created_at   timestamptz default now()
);

alter table otw_requests enable row level security;

drop policy if exists "otw_select" on otw_requests;
drop policy if exists "otw_insert" on otw_requests;
drop policy if exists "otw_update" on otw_requests;
create policy "otw_select" on otw_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "otw_insert" on otw_requests for insert
  with check (auth.uid() = from_user_id);
create policy "otw_update" on otw_requests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create index if not exists idx_otw_from on otw_requests(from_user_id);
create index if not exists idx_otw_to   on otw_requests(to_user_id);

alter publication supabase_realtime add table otw_requests;

-- ================================================================
-- waves
-- ================================================================
create table if not exists waves (
  id           uuid        primary key default gen_random_uuid(),
  from_user_id uuid        references auth.users on delete cascade not null,
  to_user_id   uuid        references auth.users on delete cascade not null,
  session_id   uuid        references sessions   on delete cascade not null,
  created_at   timestamptz default now()
);

alter table waves enable row level security;

drop policy if exists "waves_select" on waves;
drop policy if exists "waves_insert" on waves;
create policy "waves_select" on waves for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "waves_insert" on waves for insert
  with check (auth.uid() = from_user_id);

alter publication supabase_realtime add table waves;

-- ================================================================
-- blocks
-- ================================================================
create table if not exists blocks (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users on delete cascade not null,
  blocked_user_id uuid        references auth.users on delete cascade not null,
  created_at      timestamptz default now(),
  unique (user_id, blocked_user_id)
);

alter table blocks enable row level security;

drop policy if exists "blocks_select" on blocks;
drop policy if exists "blocks_insert" on blocks;
drop policy if exists "blocks_delete" on blocks;
create policy "blocks_select" on blocks for select using (auth.uid() = user_id);
create policy "blocks_insert" on blocks for insert with check (auth.uid() = user_id);
create policy "blocks_delete" on blocks for delete using (auth.uid() = user_id);

-- ================================================================
-- reports
-- ================================================================
create table if not exists reports (
  id               uuid        primary key default gen_random_uuid(),
  reporter_id      uuid        references auth.users on delete cascade not null,
  reported_user_id uuid        references auth.users on delete cascade not null,
  session_id       uuid        references sessions   on delete set null,
  reason           text,
  details          text        check (details is null or length(details) <= 1000),
  status           text        default 'pending',
  created_at       timestamptz default now()
);

alter table reports enable row level security;

drop policy if exists "reports_insert"     on reports;
drop policy if exists "reports_select_own" on reports;
create policy "reports_insert"     on reports for insert with check (auth.uid() = reporter_id);
create policy "reports_select_own" on reports for select using (auth.uid() = reporter_id);

-- ================================================================
-- venue_unlocks  (written after Stripe payment webhook)
-- ================================================================
create table if not exists venue_unlocks (
  id         uuid        primary key default gen_random_uuid(),
  buyer_id   uuid        references auth.users on delete cascade not null,
  session_id uuid        references sessions   on delete cascade not null,
  created_at timestamptz default now(),
  unique (buyer_id, session_id)
);

alter table venue_unlocks enable row level security;

drop policy if exists "unlocks_select" on venue_unlocks;
drop policy if exists "unlocks_insert" on venue_unlocks;
create policy "unlocks_select" on venue_unlocks for select using (auth.uid() = buyer_id);
create policy "unlocks_insert" on venue_unlocks for insert with check (auth.uid() = buyer_id);

alter publication supabase_realtime add table venue_unlocks;

-- ================================================================
-- suggested_venues
-- ================================================================
create table if not exists suggested_venues (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  area              text,
  activity_types    text[]      default '{}',
  link              text,
  open_time         text,
  close_time        text,
  offers_discount   boolean     default false,
  discount_percent  int,
  discount_type     text,
  discount_status   text,
  submitted_by      uuid        references auth.users on delete set null,
  submitted_by_name text,
  status            text        default 'pending',
  admin_note        text,
  created_at        timestamptz default now()
);

alter table suggested_venues enable row level security;

drop policy if exists "venues_insert"          on suggested_venues;
drop policy if exists "venues_select_own"      on suggested_venues;
drop policy if exists "venues_select_approved" on suggested_venues;
create policy "venues_insert"          on suggested_venues for insert with check (auth.uid() = submitted_by);
create policy "venues_select_own"      on suggested_venues for select using (auth.uid() = submitted_by);
create policy "venues_select_approved" on suggested_venues for select using (status = 'approved');

-- ================================================================
-- STORAGE RLS  — avatars bucket (already created in dashboard)
-- Users can upload only to their own folder: avatars/<user-id>/
-- ================================================================
drop policy if exists "avatars_upload" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_read"   on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

create policy "avatars_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- STORAGE RLS  — moments bucket (already created in dashboard)
-- Users can upload only to their own folder: moments/<user-id>/
-- ================================================================
drop policy if exists "moments_upload" on storage.objects;
drop policy if exists "moments_read"   on storage.objects;
drop policy if exists "moments_delete" on storage.objects;

create policy "moments_upload" on storage.objects
  for insert with check (
    bucket_id = 'moments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "moments_read" on storage.objects
  for select using (bucket_id = 'moments');

create policy "moments_delete" on storage.objects
  for delete using (
    bucket_id = 'moments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- FUNCTIONS / RPCs
-- ================================================================

-- go_live: end existing session, start new active session
create or replace function go_live(
  p_activity_type  text    default null,
  p_activities     text[]  default '{}',
  p_lat            float8  default null,
  p_lng            float8  default null,
  p_place_id       text    default null,
  p_place_name     text    default null,
  p_venue_category text    default null,
  p_duration_min   int     default 90,
  p_is_group       boolean default false,
  p_group_size     int     default null,
  p_vibe           text    default null,
  p_area           text    default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  update sessions set status = 'ended'
    where user_id = auth.uid() and status in ('active','scheduled','invite_out');

  insert into sessions (
    user_id, status, activity_type, activities,
    lat, lng, place_id, place_name, venue_category,
    duration_minutes, expires_at, is_group, group_size, vibe, area
  ) values (
    auth.uid(), 'active', p_activity_type, p_activities,
    p_lat, p_lng, p_place_id, p_place_name, p_venue_category,
    p_duration_min, now() + (p_duration_min || ' minutes')::interval,
    p_is_group, p_group_size, p_vibe, p_area
  ) returning id into new_id;

  return new_id;
end;
$$;

-- schedule_live
create or replace function schedule_live(
  p_activity_type  text        default null,
  p_activities     text[]      default '{}',
  p_lat            float8      default null,
  p_lng            float8      default null,
  p_place_id       text        default null,
  p_place_name     text        default null,
  p_venue_category text        default null,
  p_duration_min   int         default 90,
  p_scheduled_for  timestamptz default null,
  p_social_link    text        default null,
  p_vibe           text        default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  update sessions set status = 'ended'
    where user_id = auth.uid() and status in ('active','scheduled','invite_out');

  insert into sessions (
    user_id, status, activity_type, activities,
    lat, lng, place_id, place_name, venue_category,
    duration_minutes, scheduled_for, expires_at, social_link, vibe
  ) values (
    auth.uid(), 'scheduled', p_activity_type, p_activities,
    p_lat, p_lng, p_place_id, p_place_name, p_venue_category,
    p_duration_min, p_scheduled_for,
    p_scheduled_for + (p_duration_min || ' minutes')::interval,
    p_social_link, p_vibe
  ) returning id into new_id;

  return new_id;
end;
$$;

-- post_invite_out
create or replace function post_invite_out(
  p_activity_type text default null,
  p_message       text default ''
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  update sessions set status = 'ended'
    where user_id = auth.uid() and status in ('active','scheduled','invite_out');

  insert into sessions (user_id, status, activity_type, message)
  values (auth.uid(), 'invite_out', p_activity_type, p_message)
  returning id into new_id;

  return new_id;
end;
$$;

-- end_session
create or replace function end_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update sessions set status = 'ended'
    where id = p_session_id and user_id = auth.uid();
end;
$$;

-- adjust_coins: atomically update balance + log transaction
create or replace function adjust_coins(p_delta int, p_label text, p_type text)
returns int language plpgsql security definer set search_path = public as $$
declare new_balance int;
begin
  update profiles
    set coins = greatest(0, coins + p_delta), updated_at = now()
    where id = auth.uid()
    returning coins into new_balance;

  insert into coin_transactions (user_id, type, label, amount)
  values (auth.uid(), p_type, p_label, abs(p_delta));

  return coalesce(new_balance, 0);
end;
$$;

-- send_gift: deduct coins, record interest, notify recipient
create or replace function send_gift(
  p_to_user_id uuid,
  p_session_id uuid,
  p_gift       text,
  p_message    text default '',
  p_cost       int  default 5
)
returns int language plpgsql security definer set search_path = public as $$
declare
  current_coins int;
  new_balance   int;
begin
  select coins into current_coins from profiles where id = auth.uid();
  if current_coins < p_cost then
    raise exception 'Insufficient coins. Have %, need %.', current_coins, p_cost;
  end if;

  update profiles
    set coins = coins - p_cost, updated_at = now()
    where id = auth.uid()
    returning coins into new_balance;

  insert into coin_transactions (user_id, type, label, amount)
  values (auth.uid(), 'spend', 'Sent ' || p_gift || ' gift', p_cost);

  insert into interests (from_user_id, to_user_id, session_id, gift, message)
  values (auth.uid(), p_to_user_id, p_session_id, p_gift, p_message)
  on conflict (from_user_id, session_id)
    do update set gift = p_gift, message = p_message;

  insert into notifications (user_id, type, title, body, from_user_id, session_id)
  values (p_to_user_id, 'gift', 'You got a gift! 🎁', 'Someone sent you a ' || p_gift, auth.uid(), p_session_id)
  on conflict do nothing;

  return new_balance;
end;
$$;

-- send_wave_notify: record wave + notify recipient
create or replace function send_wave_notify(p_to_user_id uuid, p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into waves (from_user_id, to_user_id, session_id)
  values (auth.uid(), p_to_user_id, p_session_id);

  insert into notifications (user_id, type, title, body, from_user_id, session_id)
  values (p_to_user_id, 'wave', 'Someone waved 👋', 'Tap to see who', auth.uid(), p_session_id)
  on conflict do nothing;
end;
$$;

-- mark_notifications_read
create or replace function mark_notifications_read()
returns void language plpgsql security definer set search_path = public as $$
begin
  update notifications set read = true
    where user_id = auth.uid() and read = false;
end;
$$;

-- unlock_conversation (called after Stripe payment)
create or replace function unlock_conversation(p_conversation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update conversations set status = 'unlocked'
    where id = p_conversation_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid());
end;
$$;

-- block_and_report_user
create or replace function block_and_report_user(
  p_blocked_user_id uuid,
  p_session_id      uuid default null,
  p_reason          text default null,
  p_details         text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into blocks (user_id, blocked_user_id)
  values (auth.uid(), p_blocked_user_id)
  on conflict do nothing;

  if p_reason is not null then
    insert into reports (reporter_id, reported_user_id, session_id, reason, details)
    values (auth.uid(), p_blocked_user_id, p_session_id, p_reason, p_details);
  end if;
end;
$$;

-- expire_sessions (call via cron or manually)
create or replace function expire_sessions()
returns void language plpgsql security definer set search_path = public as $$
begin
  update sessions set status = 'expired'
    where status = 'active' and expires_at < now();
end;
$$;

-- expire_moments (call via cron or manually)
create or replace function expire_moments()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from moments where expires_at < now();
end;
$$;
