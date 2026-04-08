-- ─────────────────────────────────────────────────────────────────────────────
-- P9: Notification Health Score
-- Before any notification insert, count the target user's unread notifications.
-- If unread >= 5, suppress silently — no error, no insert.
-- Applied to: check_mutual_interest, send_wave_notify, send_gift
-- ─────────────────────────────────────────────────────────────────────────────

-- ── check_mutual_interest ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_mutual_interest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reverse_row   interests%rowtype;
  name_a        text;
  name_b        text;
  hour_now      int;
  time_copy     text;
  unread_a      int;
  unread_b      int;
BEGIN
  SELECT * INTO reverse_row
    FROM interests
    WHERE from_user_id = NEW.to_user_id
      AND to_user_id   = NEW.from_user_id
      AND session_id   = NEW.session_id
      AND status       = 'pending';

  IF FOUND THEN
    UPDATE interests SET status = 'mutual'
      WHERE (from_user_id = NEW.from_user_id AND to_user_id = NEW.to_user_id   AND session_id = NEW.session_id)
         OR (from_user_id = NEW.to_user_id   AND to_user_id = NEW.from_user_id AND session_id = NEW.session_id);

    INSERT INTO conversations (user_a_id, user_b_id, session_id, status)
    VALUES (NEW.from_user_id, NEW.to_user_id, NEW.session_id, 'free')
    ON CONFLICT (
      least(user_a_id::text, user_b_id::text),
      greatest(user_a_id::text, user_b_id::text)
    ) DO NOTHING;

    SELECT COALESCE(display_name, 'Someone') INTO name_a FROM profiles WHERE id = NEW.from_user_id;
    SELECT COALESCE(display_name, 'Someone') INTO name_b FROM profiles WHERE id = NEW.to_user_id;
    hour_now  := EXTRACT(HOUR FROM now())::int;
    time_copy := CASE
      WHEN hour_now >= 6  AND hour_now < 12 THEN 'Good morning — say hi while you''re both out!'
      WHEN hour_now >= 12 AND hour_now < 17 THEN 'Say hi before the afternoon flies by!'
      WHEN hour_now >= 17 AND hour_now < 21 THEN 'Perfect timing for an evening meetup!'
      ELSE 'Night owl energy — don''t wait, say hi!'
    END;

    -- Health gate: suppress if target user already has 5+ unread notifications
    SELECT COUNT(*) INTO unread_a FROM notifications
      WHERE user_id = NEW.from_user_id AND read_at IS NULL;
    SELECT COUNT(*) INTO unread_b FROM notifications
      WHERE user_id = NEW.to_user_id AND read_at IS NULL;

    IF unread_a < 5 THEN
      INSERT INTO notifications (user_id, type, title, body, from_user_id)
      VALUES (NEW.from_user_id, 'match', name_b || ' liked you back! 🔥', time_copy, NEW.to_user_id)
      ON CONFLICT DO NOTHING;
    END IF;

    IF unread_b < 5 THEN
      INSERT INTO notifications (user_id, type, title, body, from_user_id)
      VALUES (NEW.to_user_id, 'match', name_a || ' liked you back! 🔥', time_copy, NEW.from_user_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── send_wave_notify ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_wave_notify(p_to_user_id uuid, p_session_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sender_name  text;
  hour_now     int;
  wave_body    text;
  unread_count int;
BEGIN
  SELECT COALESCE(display_name, 'Someone') INTO sender_name FROM profiles WHERE id = auth.uid();
  hour_now  := EXTRACT(HOUR FROM now())::int;
  wave_body := CASE
    WHEN hour_now >= 17 THEN sender_name || ' is out tonight and spotted you 👀'
    WHEN hour_now >= 12 THEN sender_name || ' spotted you this afternoon 👋'
    WHEN hour_now >= 6  THEN sender_name || ' said good morning 👋'
    ELSE sender_name || ' is up late and waved hello 🌙'
  END;

  INSERT INTO waves (from_user_id, to_user_id, session_id)
  VALUES (auth.uid(), p_to_user_id, p_session_id);

  -- Health gate: suppress notification if recipient already has 5+ unread
  SELECT COUNT(*) INTO unread_count FROM notifications
    WHERE user_id = p_to_user_id AND read_at IS NULL;

  IF unread_count < 5 THEN
    INSERT INTO notifications (user_id, type, title, body, from_user_id, session_id)
    VALUES (p_to_user_id, 'wave', sender_name || ' waved 👋', wave_body, auth.uid(), p_session_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- ── send_gift ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_gift(
  p_to_user_id uuid,
  p_session_id uuid,
  p_gift       text,
  p_message    text DEFAULT '',
  p_cost       int  DEFAULT 5
)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_coins int;
  new_balance   int;
  sender_name   text;
  unread_count  int;
BEGIN
  SELECT coins INTO current_coins FROM profiles WHERE id = auth.uid();
  IF current_coins < p_cost THEN
    RAISE EXCEPTION 'Insufficient coins. Have %, need %.', current_coins, p_cost;
  END IF;

  UPDATE profiles
    SET coins = coins - p_cost, updated_at = now()
    WHERE id = auth.uid()
    RETURNING coins INTO new_balance;

  INSERT INTO coin_transactions (user_id, type, label, amount)
  VALUES (auth.uid(), 'spend', 'Sent ' || p_gift || ' gift', p_cost);

  INSERT INTO interests (from_user_id, to_user_id, session_id, gift, message)
  VALUES (auth.uid(), p_to_user_id, p_session_id, p_gift, p_message)
  ON CONFLICT (from_user_id, session_id)
    DO UPDATE SET gift = p_gift, message = p_message;

  SELECT COALESCE(display_name, 'Someone') INTO sender_name FROM profiles WHERE id = auth.uid();

  -- Health gate: suppress notification if recipient already has 5+ unread
  SELECT COUNT(*) INTO unread_count FROM notifications
    WHERE user_id = p_to_user_id AND read_at IS NULL;

  IF unread_count < 5 THEN
    INSERT INTO notifications (user_id, type, title, body, from_user_id, session_id)
    VALUES (p_to_user_id, 'gift',
            sender_name || ' sent you a gift! 🎁',
            sender_name || ' gifted you a ' || p_gift || ' — check it out!',
            auth.uid(), p_session_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new_balance;
END;
$$;
