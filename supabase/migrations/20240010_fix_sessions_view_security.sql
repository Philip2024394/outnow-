-- Fix: sessions_with_profiles view security
-- Change from SECURITY DEFINER (default) to SECURITY INVOKER
-- so the view respects RLS policies of the querying user.
-- This prevents data leakage through the Data API.

DROP VIEW IF EXISTS sessions_with_profiles;
CREATE VIEW sessions_with_profiles
WITH (security_invoker = on)
AS
  SELECT
    s.id,
    s.user_id,
    s.status,
    s.activity_type,
    s.activities,
    s.lat,
    s.lng,
    s.message,
    s.area,
    s.vibe,
    s.duration_minutes,
    s.expires_at,
    s.scheduled_for,
    s.needs_check_in,
    s.is_group,
    s.group_size,
    s.group_members,
    s.social_link,
    s.created_at,
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city   AS profile_city,
    p.is_verified,
    p.is_banned
  FROM sessions s
  LEFT JOIN profiles p ON p.id = s.user_id;

-- Grant access to authenticated users (RLS will filter results)
GRANT SELECT ON sessions_with_profiles TO authenticated;
-- Revoke from anon to prevent unauthenticated access
REVOKE ALL ON sessions_with_profiles FROM anon;
