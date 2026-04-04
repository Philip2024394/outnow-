-- Backfill: give every existing user who has no active session an invite_out.
-- Runs once. Safe to re-run — the WHERE NOT EXISTS guard prevents duplicates.

INSERT INTO sessions (user_id, status, expires_at)
SELECT p.id, 'invite_out', NULL
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.user_id = p.id
    AND s.status IN ('active', 'scheduled', 'invite_out')
);
