-- Register pg_cron jobs (requires pg_cron extension enabled in Supabase Dashboard)
-- Dashboard → Database → Extensions → pg_cron → Enable

SELECT cron.unschedule('activate-scheduled-sessions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'activate-scheduled-sessions'
);

SELECT cron.unschedule('expire-active-sessions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-active-sessions'
);

SELECT cron.schedule(
  'activate-scheduled-sessions',
  '*/5 * * * *',
  $$
    UPDATE sessions
    SET status = 'active', needs_check_in = false
    WHERE status = 'scheduled'
      AND scheduled_for <= now()
      AND expires_at > now();
  $$
);

SELECT cron.schedule(
  'expire-active-sessions',
  '*/5 * * * *',
  $$
    UPDATE sessions
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < now();
  $$
);
