-- Atomic increment of total_trips on a driver's profile.
-- Called every time a user opens WhatsApp to contact a driver (= 1 trip attempt).
CREATE OR REPLACE FUNCTION increment_driver_trips(p_driver_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
     SET total_trips = COALESCE(total_trips, 0) + 1
   WHERE id::text = p_driver_id;
END;
$$;
