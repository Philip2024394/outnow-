-- ── Booking push webhook ─────────────────────────────────────────────────────
-- Calls the send-booking-push Edge Function (deployed with --no-verify-jwt)
-- whenever a new pending booking is inserted. Uses pg_net (built-in on Supabase).

create extension if not exists pg_net schema extensions;

create or replace function notify_driver_of_booking()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only fire for new pending bookings
  if NEW.status <> 'pending' then
    return NEW;
  end if;

  -- Fire-and-forget HTTP POST to the Edge Function (non-blocking)
  perform net.http_post(
    url     := 'https://fjvafjkzvygkhiwjuvla.supabase.co/functions/v1/send-booking-push',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := jsonb_build_object(
      'type',   'INSERT',
      'table',  'bookings',
      'record', row_to_json(NEW)
    )::text
  );

  return NEW;
end;
$$;

drop trigger if exists on_booking_created on bookings;
create trigger on_booking_created
  after insert on bookings
  for each row
  execute function notify_driver_of_booking();
