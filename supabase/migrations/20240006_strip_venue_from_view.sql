-- Privacy: rebuild sessions_with_profiles without venue details.
--
-- place_name, place_id and venue_category reveal exactly where a user
-- is going and must never be returned to other users.
-- lat/lng are kept for map pin placement only; the app enforces a 2 km
-- display floor so precise positions cannot be triangulated.

CREATE OR REPLACE VIEW sessions_with_profiles AS
  SELECT
    s.id,
    s.user_id,
    s.status,
    s.activity_type,
    s.activities,
    s.lat,
    s.lng,
    -- place_name, place_id, venue_category intentionally excluded
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
    s.updated_at,
    p.display_name,
    p.photo_url,
    p.age,
    p.looking_for,
    p.city   AS profile_city,
    p.is_verified,
    p.is_banned
  FROM sessions s
  LEFT JOIN profiles p ON p.id = s.user_id;
