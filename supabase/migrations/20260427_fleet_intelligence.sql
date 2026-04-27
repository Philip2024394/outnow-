-- Fleet Intelligence System for Yogyakarta
-- Tables, RLS policies, and seed data for zone-based fleet management

----------------------------------------------------------------------
-- 1. fleet_zones
----------------------------------------------------------------------
CREATE TABLE fleet_zones (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  lat_center  double precision,
  lng_center  double precision,
  radius_km   numeric DEFAULT 1.5,
  zone_type   text DEFAULT 'standard',
  peak_hours  jsonb,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

----------------------------------------------------------------------
-- 2. fleet_zone_stats
----------------------------------------------------------------------
CREATE TABLE fleet_zone_stats (
  id               bigserial PRIMARY KEY,
  zone_id          bigint NOT NULL REFERENCES fleet_zones(id),
  hour_bucket      timestamptz NOT NULL,
  order_count      int DEFAULT 0,
  driver_count     int DEFAULT 0,
  avg_wait_seconds int DEFAULT 0,
  demand_level     text DEFAULT 'normal',
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (zone_id, hour_bucket)
);

----------------------------------------------------------------------
-- 3. fleet_landmarks
----------------------------------------------------------------------
CREATE TABLE fleet_landmarks (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  category    text NOT NULL,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  description text,
  peak_hours  jsonb,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

----------------------------------------------------------------------
-- 4. fleet_nudges
----------------------------------------------------------------------
CREATE TABLE fleet_nudges (
  id          bigserial PRIMARY KEY,
  driver_id   uuid NOT NULL REFERENCES profiles(id),
  zone_id     bigint REFERENCES fleet_zones(id),
  message     text NOT NULL,
  nudge_type  text DEFAULT 'suggestion',
  status      text DEFAULT 'sent',
  created_at  timestamptz DEFAULT now()
);

----------------------------------------------------------------------
-- 5. fleet_driver_zone_log
----------------------------------------------------------------------
CREATE TABLE fleet_driver_zone_log (
  id          bigserial PRIMARY KEY,
  driver_id   uuid NOT NULL REFERENCES profiles(id),
  zone_id     bigint NOT NULL REFERENCES fleet_zones(id),
  entered_at  timestamptz DEFAULT now(),
  left_at     timestamptz
);

----------------------------------------------------------------------
-- RLS: enable on all tables, allow all for authenticated users
----------------------------------------------------------------------
ALTER TABLE fleet_zones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_zone_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_landmarks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_nudges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_driver_zone_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access on fleet_zones"
  ON fleet_zones FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on fleet_zone_stats"
  ON fleet_zone_stats FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on fleet_landmarks"
  ON fleet_landmarks FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on fleet_nudges"
  ON fleet_nudges FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on fleet_driver_zone_log"
  ON fleet_driver_zone_log FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

----------------------------------------------------------------------
-- Seed: Yogyakarta zones
----------------------------------------------------------------------
INSERT INTO fleet_zones (name, slug, lat_center, lng_center, radius_km, zone_type, peak_hours) VALUES
  ('Malioboro',
   'malioboro',
   -7.7925, 110.3658, 1.0, 'commercial',
   '[{"day":"sat","start":"10:00","end":"22:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  ('Prawirotaman',
   'prawirotaman',
   -7.8125, 110.3650, 1.0, 'nightlife',
   '[{"day":"fri","start":"20:00","end":"02:00"},{"day":"sat","start":"20:00","end":"02:00"}]'::jsonb),

  ('UGM Campus',
   'ugm-campus',
   -7.7713, 110.3776, 1.5, 'campus',
   '[{"day":"mon","start":"07:00","end":"17:00"},{"day":"tue","start":"07:00","end":"17:00"},{"day":"wed","start":"07:00","end":"17:00"},{"day":"thu","start":"07:00","end":"17:00"},{"day":"fri","start":"07:00","end":"17:00"}]'::jsonb),

  ('Kota Baru',
   'kota-baru',
   -7.7820, 110.3758, 1.0, 'residential',
   '[{"day":"sat","start":"17:00","end":"23:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  ('Tugu Station',
   'tugu-station',
   -7.7891, 110.3614, 0.8, 'commercial',
   '[{"day":"mon","start":"06:00","end":"09:00"},{"day":"fri","start":"15:00","end":"20:00"}]'::jsonb),

  ('Alun-Alun Selatan',
   'alun-alun-selatan',
   -7.8120, 110.3580, 1.0, 'nightlife',
   '[{"day":"fri","start":"19:00","end":"23:00"},{"day":"sat","start":"19:00","end":"23:00"},{"day":"sun","start":"19:00","end":"23:00"}]'::jsonb),

  ('Jalan Kaliurang',
   'jalan-kaliurang',
   -7.7500, 110.3850, 2.0, 'campus',
   '[{"day":"mon","start":"07:00","end":"22:00"},{"day":"tue","start":"07:00","end":"22:00"},{"day":"wed","start":"07:00","end":"22:00"},{"day":"thu","start":"07:00","end":"22:00"},{"day":"fri","start":"07:00","end":"22:00"}]'::jsonb),

  ('Amplaz / Ambarukmo',
   'amplaz-ambarukmo',
   -7.7835, 110.4020, 1.0, 'commercial',
   '[{"day":"sat","start":"10:00","end":"22:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  ('Seturan',
   'seturan',
   -7.7650, 110.4100, 1.2, 'nightlife',
   '[{"day":"thu","start":"20:00","end":"02:00"},{"day":"fri","start":"20:00","end":"02:00"},{"day":"sat","start":"20:00","end":"02:00"}]'::jsonb),

  ('Jakal (Kaliurang North)',
   'jakal',
   -7.7350, 110.3900, 1.5, 'nightlife',
   '[{"day":"fri","start":"21:00","end":"03:00"},{"day":"sat","start":"21:00","end":"03:00"}]'::jsonb),

  ('Condongcatur',
   'condongcatur',
   -7.7550, 110.3950, 1.2, 'commercial',
   '[{"day":"mon","start":"08:00","end":"18:00"},{"day":"tue","start":"08:00","end":"18:00"},{"day":"wed","start":"08:00","end":"18:00"},{"day":"thu","start":"08:00","end":"18:00"},{"day":"fri","start":"08:00","end":"18:00"}]'::jsonb),

  ('Kotagede',
   'kotagede',
   -7.8200, 110.3950, 1.5, 'residential',
   '[{"day":"sat","start":"08:00","end":"17:00"},{"day":"sun","start":"08:00","end":"17:00"}]'::jsonb);

----------------------------------------------------------------------
-- Seed: Yogyakarta landmarks
----------------------------------------------------------------------
INSERT INTO fleet_landmarks (name, category, lat, lng, description, peak_hours) VALUES
  -- Nightclubs / bars
  ('Boshe VVIP Club',
   'nightclub', -7.7655, 110.4085,
   'Large nightclub in Seturan area, popular with university students',
   '[{"day":"fri","start":"22:00","end":"04:00"},{"day":"sat","start":"22:00","end":"04:00"}]'::jsonb),

  ('Liquid Next Level',
   'nightclub', -7.7830, 110.3755,
   'Popular nightclub in Kota Baru area',
   '[{"day":"fri","start":"22:00","end":"04:00"},{"day":"sat","start":"22:00","end":"04:00"}]'::jsonb),

  ('Hugo''s Cafe',
   'nightclub', -7.8120, 110.3645,
   'Bar and live music venue in Prawirotaman',
   '[{"day":"fri","start":"19:00","end":"01:00"},{"day":"sat","start":"19:00","end":"01:00"}]'::jsonb),

  ('SkyBar Yogyakarta',
   'nightclub', -7.7835, 110.4020,
   'Rooftop bar near Ambarukmo Plaza',
   '[{"day":"fri","start":"18:00","end":"00:00"},{"day":"sat","start":"18:00","end":"00:00"}]'::jsonb),

  -- Universities
  ('UGM (Universitas Gadjah Mada)',
   'university', -7.7713, 110.3776,
   'Largest and oldest university in Yogyakarta',
   '[{"day":"mon","start":"07:00","end":"17:00"},{"day":"tue","start":"07:00","end":"17:00"},{"day":"wed","start":"07:00","end":"17:00"},{"day":"thu","start":"07:00","end":"17:00"},{"day":"fri","start":"07:00","end":"17:00"}]'::jsonb),

  ('UNY (Universitas Negeri Yogyakarta)',
   'university', -7.7747, 110.3862,
   'State university, education-focused',
   '[{"day":"mon","start":"07:00","end":"17:00"},{"day":"tue","start":"07:00","end":"17:00"},{"day":"wed","start":"07:00","end":"17:00"},{"day":"thu","start":"07:00","end":"17:00"},{"day":"fri","start":"07:00","end":"17:00"}]'::jsonb),

  ('UII (Universitas Islam Indonesia)',
   'university', -7.6930, 110.4100,
   'Private Islamic university, north of the city',
   '[{"day":"mon","start":"07:00","end":"17:00"},{"day":"tue","start":"07:00","end":"17:00"},{"day":"wed","start":"07:00","end":"17:00"},{"day":"thu","start":"07:00","end":"17:00"},{"day":"fri","start":"07:00","end":"17:00"}]'::jsonb),

  ('Atma Jaya University',
   'university', -7.7745, 110.4145,
   'Private Catholic university in eastern Yogyakarta',
   '[{"day":"mon","start":"07:00","end":"17:00"},{"day":"tue","start":"07:00","end":"17:00"},{"day":"wed","start":"07:00","end":"17:00"},{"day":"thu","start":"07:00","end":"17:00"},{"day":"fri","start":"07:00","end":"17:00"}]'::jsonb),

  -- Malls
  ('Ambarukmo Plaza',
   'mall', -7.7835, 110.4020,
   'Largest shopping mall in Yogyakarta',
   '[{"day":"sat","start":"10:00","end":"22:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  ('Malioboro Mall',
   'mall', -7.7930, 110.3635,
   'Shopping mall on Malioboro street',
   '[{"day":"sat","start":"10:00","end":"22:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  ('Hartono Mall',
   'mall', -7.7480, 110.4050,
   'Large mall in northern Yogyakarta near Jalan Kaliurang',
   '[{"day":"sat","start":"10:00","end":"22:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  ('Jogja City Mall',
   'mall', -7.7530, 110.3610,
   'Modern mall in west-central Yogyakarta',
   '[{"day":"sat","start":"10:00","end":"22:00"},{"day":"sun","start":"10:00","end":"22:00"}]'::jsonb),

  -- Markets
  ('Pasar Beringharjo',
   'market', -7.7970, 110.3650,
   'Historic central market near Malioboro, traditional goods and batik',
   '[{"day":"mon","start":"06:00","end":"16:00"},{"day":"tue","start":"06:00","end":"16:00"},{"day":"wed","start":"06:00","end":"16:00"},{"day":"thu","start":"06:00","end":"16:00"},{"day":"fri","start":"06:00","end":"16:00"},{"day":"sat","start":"06:00","end":"16:00"},{"day":"sun","start":"06:00","end":"14:00"}]'::jsonb),

  ('Pasar Kranggan',
   'market', -7.7880, 110.3740,
   'Local market east of city center',
   '[{"day":"mon","start":"05:00","end":"14:00"},{"day":"tue","start":"05:00","end":"14:00"},{"day":"wed","start":"05:00","end":"14:00"},{"day":"thu","start":"05:00","end":"14:00"},{"day":"fri","start":"05:00","end":"14:00"},{"day":"sat","start":"05:00","end":"14:00"}]'::jsonb),

  -- Transport hubs
  ('Tugu Station',
   'station', -7.7891, 110.3614,
   'Main railway station in Yogyakarta, intercity trains',
   '[{"day":"mon","start":"05:00","end":"22:00"},{"day":"tue","start":"05:00","end":"22:00"},{"day":"wed","start":"05:00","end":"22:00"},{"day":"thu","start":"05:00","end":"22:00"},{"day":"fri","start":"05:00","end":"22:00"},{"day":"sat","start":"05:00","end":"22:00"},{"day":"sun","start":"05:00","end":"22:00"}]'::jsonb),

  ('Adisucipto Airport',
   'station', -7.7882, 110.4317,
   'Yogyakarta domestic airport (note: international flights moved to YIA)',
   '[{"day":"mon","start":"05:00","end":"23:00"},{"day":"tue","start":"05:00","end":"23:00"},{"day":"wed","start":"05:00","end":"23:00"},{"day":"thu","start":"05:00","end":"23:00"},{"day":"fri","start":"05:00","end":"23:00"},{"day":"sat","start":"05:00","end":"23:00"},{"day":"sun","start":"05:00","end":"23:00"}]'::jsonb),

  ('Giwangan Bus Terminal',
   'station', -7.8280, 110.3870,
   'Main intercity bus terminal, south-east Yogyakarta',
   '[{"day":"mon","start":"04:00","end":"22:00"},{"day":"tue","start":"04:00","end":"22:00"},{"day":"wed","start":"04:00","end":"22:00"},{"day":"thu","start":"04:00","end":"22:00"},{"day":"fri","start":"04:00","end":"22:00"},{"day":"sat","start":"04:00","end":"22:00"},{"day":"sun","start":"04:00","end":"22:00"}]'::jsonb),

  -- Hotel areas
  ('Prawirotaman Hotel Strip',
   'hotel_area', -7.8125, 110.3650,
   'Backpacker and boutique hotel district',
   NULL),

  ('Malioboro Hotel Strip',
   'hotel_area', -7.7920, 110.3640,
   'Tourist hotels along Malioboro street',
   NULL),

  ('Dagen Street Hostels',
   'hotel_area', -7.7905, 110.3665,
   'Budget hostels and guesthouses near Malioboro',
   NULL),

  -- Other landmarks
  ('Alun-Alun Kidul',
   'park', -7.8120, 110.3580,
   'South square, night market and events area with iconic banyan trees',
   '[{"day":"fri","start":"18:00","end":"23:00"},{"day":"sat","start":"18:00","end":"23:00"},{"day":"sun","start":"18:00","end":"23:00"}]'::jsonb),

  ('Taman Sari Water Castle',
   'park', -7.8100, 110.3590,
   'Historic royal garden and bathing complex, major tourist attraction',
   '[{"day":"mon","start":"08:00","end":"15:00"},{"day":"tue","start":"08:00","end":"15:00"},{"day":"wed","start":"08:00","end":"15:00"},{"day":"thu","start":"08:00","end":"15:00"},{"day":"fri","start":"08:00","end":"15:00"},{"day":"sat","start":"08:00","end":"15:00"},{"day":"sun","start":"08:00","end":"15:00"}]'::jsonb),

  ('Kraton Yogyakarta',
   'mosque', -7.8053, 110.3640,
   'Sultan''s palace and cultural center of Yogyakarta',
   '[{"day":"mon","start":"08:30","end":"14:00"},{"day":"tue","start":"08:30","end":"14:00"},{"day":"wed","start":"08:30","end":"14:00"},{"day":"thu","start":"08:30","end":"14:00"},{"day":"fri","start":"08:30","end":"14:00"},{"day":"sat","start":"08:30","end":"14:00"}]'::jsonb),

  ('Stadion Maguwoharjo',
   'stadium', -7.7520, 110.4190,
   'Main football stadium, home of PSIM Yogyakarta and PSS Sleman',
   NULL);
