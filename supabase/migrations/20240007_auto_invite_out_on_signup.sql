-- Every new user is automatically placed in invite_out status on signup.
-- This ensures the map is never empty — all registered users are visible
-- as "wanting an invite" until they actively change their status.
--
-- expires_at is intentionally NULL for invite_out sessions so they never
-- expire and are never caught by the expire_sessions() cron job.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, phone, display_name, coins)
  VALUES (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'display_name', new.phone, 'User'),
    65
  )
  ON CONFLICT (id) DO NOTHING;

  -- Award welcome coins
  INSERT INTO coin_transactions (user_id, type, label, amount)
  VALUES (new.id, 'earn', 'Welcome gift 🎉', 65)
  ON CONFLICT DO NOTHING;

  -- Auto-create invite_out session so the user appears on the map immediately.
  -- expires_at = NULL means this session never expires via the cron job.
  -- It is only replaced when the user actively goes live or schedules an outing.
  INSERT INTO sessions (user_id, status, expires_at)
  VALUES (new.id, 'invite_out', NULL)
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;
