-- ═══════════════════════════════════════════════════════════════════════════
-- IMOUTNOW — Session Enhancement Migration
-- Adds: full view columns, pg_cron jobs, extendSession RPC, momentum fn
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. Add missing profile columns ────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned   boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp    text;

-- ── 1. Rebuild sessions_with_profiles to expose tier + all profile fields ──
--    Previous version only joined display_name, photo_url, age, looking_for,
--    city, is_verified, is_banned. useLiveUsers.mapRow() already expects tier,
--    market, tags, social handles etc — now the view delivers them.

DROP VIEW IF EXISTS sessions_with_profiles;

CREATE VIEW sessions_with_profiles AS
  SELECT
    s.*,
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city              AS profile_city,
    p.country,
    p.is_verified,
    p.is_banned,
    p.tier,
    p.market,
    p.price_min,
    p.price_max,
    p.brand_name,
    p.trade_role,
    p.tags,
    p.extra_photos,
    p.instagram_handle,
    p.tiktok_handle,
    p.facebook_handle,
    p.website_url,
    p.youtube_handle,
    p.speaking_native,
    p.speaking_second,
    p.relationship_goal,
    p.star_sign,
    p.height,
    p.created_at        AS profile_created_at
  FROM sessions s
  LEFT JOIN profiles p ON p.id = s.user_id;

-- Allow all authenticated users to read the view (same as old policy)
GRANT SELECT ON sessions_with_profiles TO authenticated, anon;


-- ── 2 & 3. pg_cron jobs (skipped if pg_cron extension not enabled) ──────────
--    Enable pg_cron in Supabase Dashboard → Database → Extensions → pg_cron
--    Then re-run these two statements manually:
--
--    SELECT cron.schedule('activate-scheduled-sessions','*/5 * * * *',
--      $$ UPDATE sessions SET status='active', needs_check_in=false
--         WHERE status='scheduled' AND scheduled_for<=now() AND expires_at>now(); $$);
--
--    SELECT cron.schedule('expire-active-sessions','*/5 * * * *',
--      $$ UPDATE sessions SET status='expired'
--         WHERE status='active' AND expires_at IS NOT NULL AND expires_at<now(); $$);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'activate-scheduled-sessions', '*/5 * * * *',
      'UPDATE sessions SET status=''active'', needs_check_in=false
       WHERE status=''scheduled'' AND scheduled_for<=now() AND expires_at>now()'
    );
    PERFORM cron.schedule(
      'expire-active-sessions', '*/5 * * * *',
      'UPDATE sessions SET status=''expired''
       WHERE status=''active'' AND expires_at IS NOT NULL AND expires_at<now()'
    );
  ELSE
    RAISE NOTICE 'pg_cron not enabled — skipping scheduled job registration. Enable it in Supabase Dashboard → Extensions.';
  END IF;
END;
$$;


-- ── 4. extend_session RPC ──────────────────────────────────────────────────
--    Adds extra minutes to an active session's expiry.
--    Called from sessionService.extendSession().
--    Security: SECURITY DEFINER — auth.uid() must match session owner.

CREATE OR REPLACE FUNCTION extend_session(
  p_session_id    uuid,
  p_extra_minutes int DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions
  SET
    expires_at     = COALESCE(expires_at, now()) + (p_extra_minutes || ' minutes')::interval,
    needs_check_in = false
  WHERE id      = p_session_id
    AND user_id = auth.uid()
    AND status  = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not owned by current user';
  END IF;
END;
$$;


-- ── 5. get_city_momentum ───────────────────────────────────────────────────
--    Returns count of IM OUT (active) users in a given city in the last 2h.
--    Used by the MomentumBanner component ("X people out in [City]").

CREATE OR REPLACE FUNCTION get_city_momentum(p_city text)
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::int
  FROM   sessions s
  LEFT JOIN profiles p ON p.id = s.user_id
  WHERE  s.status = 'active'
    AND  s.created_at > now() - interval '2 hours'
    AND  (
           p.city ILIKE p_city
        OR s.area ILIKE p_city
    );
$$;


-- ── 6. send_otw_request RPC — guard: only for active sessions ──────────────
--    Inserts an OTW request and fires a notification to the session owner.
--    Rejects if target session is not 'active' (can't go OTW to a scheduled
--    or invite_out person — no physical location to head to).

CREATE OR REPLACE FUNCTION send_otw_request(
  p_to_user_id  uuid,
  p_session_id  uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_status text;
  v_otw_id         uuid;
BEGIN
  -- Guard: session must be active
  SELECT status INTO v_session_status
  FROM   sessions
  WHERE  id = p_session_id AND user_id = p_to_user_id;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session_status <> 'active' THEN
    RAISE EXCEPTION 'OTW can only be sent to someone who is currently out (active session)';
  END IF;

  -- Insert OTW request
  INSERT INTO otw_requests (from_user_id, to_user_id, session_id, status)
  VALUES (auth.uid(), p_to_user_id, p_session_id, 'sent')
  RETURNING id INTO v_otw_id;

  -- Fire notification to the receiver
  INSERT INTO notifications (user_id, type, title, body, from_user_id, session_id)
  VALUES (
    p_to_user_id,
    'otw',
    'Someone is on their way! 🚀',
    'They saw you''re out and are heading your way.',
    auth.uid(),
    p_session_id
  )
  ON CONFLICT DO NOTHING;

  RETURN v_otw_id;
END;
$$;
