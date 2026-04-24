-- GPS Trace Recording — builds road network from driver GPS trails
-- Each point is a lat/lng with speed, heading, and accuracy
-- Used to: fill map gaps, detect new roads, calculate real speeds, find shortcuts

CREATE TABLE IF NOT EXISTS gps_traces (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_kmh SMALLINT,
  heading SMALLINT,
  accuracy_m SMALLINT,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by area (lat/lng range) and time
CREATE INDEX idx_gps_traces_location ON gps_traces (lat, lng);
CREATE INDEX idx_gps_traces_driver ON gps_traces (driver_id, ts DESC);
CREATE INDEX idx_gps_traces_session ON gps_traces (session_id);
CREATE INDEX idx_gps_traces_time ON gps_traces (ts DESC);

-- Session metadata — one row per recording session
CREATE TABLE IF NOT EXISTS gps_trace_sessions (
  id TEXT PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  vehicle_type TEXT NOT NULL DEFAULT 'bike',
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  city TEXT,
  point_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gps_sessions_driver ON gps_trace_sessions (driver_id, started_at DESC);

-- Auto-update point count on session
CREATE OR REPLACE FUNCTION update_session_point_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gps_trace_sessions
  SET point_count = (SELECT COUNT(*) FROM gps_traces WHERE session_id = NEW.session_id)
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_count
AFTER INSERT ON gps_traces
FOR EACH ROW
EXECUTE FUNCTION update_session_point_count();

-- RLS — drivers can insert their own traces, admins can read all
ALTER TABLE gps_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_trace_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers insert own traces" ON gps_traces
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins read all traces" ON gps_traces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Drivers insert own sessions" ON gps_trace_sessions
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers read own sessions" ON gps_trace_sessions
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Admins read all sessions" ON gps_trace_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
