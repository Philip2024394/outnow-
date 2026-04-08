-- ─────────────────────────────────────────────────────────────────────────────
-- P2: Contextual Notification Copy
-- Replaces generic "You matched!" / "Someone waved" strings with sender name +
-- time-of-day aware copy for all three notification-inserting DB functions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── check_mutual_interest ─────────────────────────────────────────────────────
-- Trigger: fires after an interest row is inserted. When both sides have liked
-- each other, marks both as mutual, creates a conversation, and notifies both.
-- Change: queries display_name for both users; uses time-of-day bucket copy.

create or replace function check_mutual_interest()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reverse_row   interests%rowtype;
  name_a        text;   -- display name of new.from_user_id (the liker)
  name_b        text;   -- display name of new.to_user_id   (the liked)
  hour_now      int;
  time_copy     text;
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

    -- Contextual copy: sender name + time-of-day bucket
    select coalesce(display_name, 'Someone') into name_a from profiles where id = new.from_user_id;
    select coalesce(display_name, 'Someone') into name_b from profiles where id = new.to_user_id;
    hour_now := extract(hour from now())::int;
    time_copy := case
      when hour_now >= 6  and hour_now < 12 then 'Good morning — say hi while you''re both out!'
      when hour_now >= 12 and hour_now < 17 then 'Say hi before the afternoon flies by!'
      when hour_now >= 17 and hour_now < 21 then 'Perfect timing for an evening meetup!'
      else 'Night owl energy — don''t wait, say hi!'
    end;

    insert into notifications (user_id, type, title, body, from_user_id)
    values
      (new.from_user_id, 'match', name_b || ' liked you back! 🔥', time_copy, new.to_user_id),
      (new.to_user_id,   'match', name_a || ' liked you back! 🔥', time_copy, new.from_user_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_interest_created on interests;
create trigger on_interest_created
  after insert on interests
  for each row execute procedure check_mutual_interest();


-- ── send_wave_notify ──────────────────────────────────────────────────────────
-- RPC: called client-side when a user waves at someone.
-- Change: queries sender display_name; uses time-of-day bucket body copy.

create or replace function send_wave_notify(p_to_user_id uuid, p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  sender_name text;
  hour_now    int;
  wave_body   text;
begin
  select coalesce(display_name, 'Someone') into sender_name from profiles where id = auth.uid();
  hour_now := extract(hour from now())::int;
  wave_body := case
    when hour_now >= 17 then sender_name || ' is out tonight and spotted you 👀'
    when hour_now >= 12 then sender_name || ' spotted you this afternoon 👋'
    when hour_now >= 6  then sender_name || ' said good morning 👋'
    else sender_name || ' is up late and waved hello 🌙'
  end;

  insert into waves (from_user_id, to_user_id, session_id)
  values (auth.uid(), p_to_user_id, p_session_id);

  insert into notifications (user_id, type, title, body, from_user_id, session_id)
  values (p_to_user_id, 'wave', sender_name || ' waved 👋', wave_body, auth.uid(), p_session_id)
  on conflict do nothing;
end;
$$;


-- ── send_gift ─────────────────────────────────────────────────────────────────
-- RPC: called client-side when a user sends a gift coin.
-- Change: queries sender display_name; personalises both title and body.

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
  sender_name   text;
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

  select coalesce(display_name, 'Someone') into sender_name from profiles where id = auth.uid();

  insert into notifications (user_id, type, title, body, from_user_id, session_id)
  values (p_to_user_id, 'gift',
          sender_name || ' sent you a gift! 🎁',
          sender_name || ' gifted you a ' || p_gift || ' — check it out!',
          auth.uid(), p_session_id)
  on conflict do nothing;

  return new_balance;
end;
$$;
