-- New property development projects

CREATE TABLE IF NOT EXISTS new_projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id      uuid REFERENCES auth.users(id),
  project_name      text NOT NULL,
  developer_name    text NOT NULL,
  developer_logo    text,
  description       text,
  location          text,
  city              text,
  lat               numeric,
  lng               numeric,
  status            text DEFAULT 'pre_sale' CHECK (status IN ('pre_sale', 'construction', 'topping_off', 'finishing', 'ready', 'sold_out')),
  completion_date   text, -- e.g. '2027-Q2'
  launch_date       text,
  units             jsonb DEFAULT '[]', -- [{type, bedrooms, bathrooms, area_sqm, price, available_count, floor_plan_url}]
  amenities         text[] DEFAULT '{}',
  payment_schedule  text,
  brochure_url      text,
  floor_plans       text[] DEFAULT '{}',
  site_plan_url     text,
  video_url         text,
  progress_photos   text[] DEFAULT '{}',
  images            text[] DEFAULT '{}',
  contact_whatsapp  text,
  contact_email     text,
  website           text,
  instagram         text,
  min_price         numeric,
  max_price         numeric,
  total_units       integer DEFAULT 0,
  units_sold        integer DEFAULT 0,
  verified          boolean DEFAULT false,
  view_count        integer DEFAULT 0,
  inquiry_count     integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE new_projects ENABLE ROW LEVEL SECURITY;

-- Public can read all projects
CREATE POLICY "public_read_projects" ON new_projects FOR SELECT USING (true);
-- Developer can insert own
CREATE POLICY "developer_insert" ON new_projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Developer can update own
CREATE POLICY "developer_update" ON new_projects FOR UPDATE USING (auth.uid() = developer_id);

CREATE INDEX IF NOT EXISTS idx_new_projects_city ON new_projects(city);
CREATE INDEX IF NOT EXISTS idx_new_projects_status ON new_projects(status);
CREATE INDEX IF NOT EXISTS idx_new_projects_developer ON new_projects(developer_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_new_projects_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_projects_updated ON new_projects;
CREATE TRIGGER trg_new_projects_updated
  BEFORE UPDATE ON new_projects
  FOR EACH ROW EXECUTE FUNCTION update_new_projects_updated_at();
