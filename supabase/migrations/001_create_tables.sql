-- Dubai Real Estate Database Schema
-- Migration: 001_create_tables

-- ============================================
-- DATA TABLES (from CSV imports)
-- ============================================

-- Project Information Table
CREATE TABLE IF NOT EXISTS project_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_no INT UNIQUE NOT NULL,
  parcel_id INT NOT NULL,
  consultant_english VARCHAR,
  contractor_english VARCHAR,
  consultant_license_no INT,
  contractor_license_no INT,
  project_status_english VARCHAR,
  project_creation_date DATE,
  project_completion_date DATE,
  permit_date DATE,
  work_start_date DATE,
  expected_completion_date DATE,
  related_entity_name_en VARCHAR,
  applicanttype VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_info_parcel ON project_information(parcel_id);
CREATE INDEX IF NOT EXISTS idx_project_info_status ON project_information(project_status_english);
CREATE INDEX IF NOT EXISTS idx_project_info_consultant ON project_information(consultant_license_no);
CREATE INDEX IF NOT EXISTS idx_project_info_contractor ON project_information(contractor_license_no);
CREATE INDEX IF NOT EXISTS idx_project_info_created ON project_information(project_creation_date);

-- Land Registry Table
CREATE TABLE IF NOT EXISTS land_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id INT,
  parcel_id INT NOT NULL,
  project_id INT,
  area_id INT,
  zone_id INT,
  area_name_en VARCHAR,
  land_number INT,
  land_sub_number INT,
  actual_area FLOAT,
  property_type_en VARCHAR,
  property_sub_type_en VARCHAR,
  land_type_en VARCHAR,
  is_free_hold BOOLEAN,
  is_registered BOOLEAN,
  munc_zip_code INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_parcel ON land_registry(parcel_id);
CREATE INDEX IF NOT EXISTS idx_land_project ON land_registry(project_id);
CREATE INDEX IF NOT EXISTS idx_land_area ON land_registry(area_name_en);
CREATE INDEX IF NOT EXISTS idx_land_property_id ON land_registry(property_id);

-- Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id INT,
  parcel_id INT NOT NULL,
  project_id INT,
  area_name_en VARCHAR,
  land_number INT,
  building_number VARCHAR,
  floors INT,
  rooms INT,
  rooms_en VARCHAR,
  car_parks INT,
  built_up_area FLOAT,
  actual_area FLOAT,
  common_area FLOAT,
  shops INT,
  flats INT,
  offices INT,
  elevators INT,
  swimming_pools INT,
  property_type_en VARCHAR,
  property_sub_type_en VARCHAR,
  master_project_en VARCHAR,
  project_name_en VARCHAR,
  land_type_en VARCHAR,
  is_free_hold BOOLEAN,
  creation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_parcel ON buildings(parcel_id);
CREATE INDEX IF NOT EXISTS idx_buildings_project ON buildings(project_id);
CREATE INDEX IF NOT EXISTS idx_buildings_property_id ON buildings(property_id);

-- Projects Table (RERA registered)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INT UNIQUE NOT NULL,
  project_number INT,
  master_developer_id INT,
  developer_id INT,
  developer_name VARCHAR,
  master_developer_name VARCHAR,
  project_status VARCHAR,
  percent_completed INT,
  project_start_date DATE,
  project_end_date DATE,
  completion_date DATE,
  area_name_en VARCHAR,
  master_project_en VARCHAR,
  zoning_authority_en VARCHAR,
  project_description_en TEXT,
  no_of_lands INT,
  no_of_buildings INT,
  no_of_villas INT,
  no_of_units INT,
  escrow_agent_name VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(master_developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Developers Table
CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id INT UNIQUE NOT NULL,
  developer_number INT,
  developer_name_en VARCHAR,
  license_number VARCHAR,
  license_source_en VARCHAR,
  license_type_en VARCHAR,
  license_issue_date DATE,
  license_expiry_date DATE,
  legal_status_en VARCHAR,
  phone VARCHAR,
  fax VARCHAR,
  webpage VARCHAR,
  registration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developers_id ON developers(developer_id);
CREATE INDEX IF NOT EXISTS idx_developers_license ON developers(license_number);

-- Contractor Projects Table
CREATE TABLE IF NOT EXISTS contractor_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_license_no INT,
  contractor_english VARCHAR,
  project_no INT,
  parcel_id INT NOT NULL,
  project_type VARCHAR,
  consultant_english VARCHAR,
  building_type VARCHAR,
  community_name VARCHAR,
  building_count INT,
  first_building_permit_date DATE,
  last_app_submission_date DATE,
  project_status VARCHAR,
  project_closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractor_parcel ON contractor_projects(parcel_id);
CREATE INDEX IF NOT EXISTS idx_contractor_license ON contractor_projects(contractor_license_no);
CREATE INDEX IF NOT EXISTS idx_contractor_status ON contractor_projects(project_status);

-- Consultant Projects Table
CREATE TABLE IF NOT EXISTS consultant_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_license_no INT,
  consultant_english VARCHAR,
  project_no INT,
  parcel_id INT NOT NULL,
  project_type VARCHAR,
  contractor_english VARCHAR,
  building_type VARCHAR,
  community_name VARCHAR,
  building_count INT,
  first_building_permit_date DATE,
  last_app_submission_date DATE,
  project_status VARCHAR,
  project_closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultant_parcel ON consultant_projects(parcel_id);
CREATE INDEX IF NOT EXISTS idx_consultant_license ON consultant_projects(consultant_license_no);
CREATE INDEX IF NOT EXISTS idx_consultant_status ON consultant_projects(project_status);

-- ============================================
-- IMPORT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  records_imported INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  imported_by VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_logs_table ON import_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN (
            'project_information',
            'land_registry',
            'buildings',
            'projects',
            'developers',
            'contractor_projects',
            'consultant_projects'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (Basic - Public Read)
-- ============================================

-- Enable RLS on all data tables
ALTER TABLE project_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_projects ENABLE ROW LEVEL SECURITY;

-- Public read access for all data tables
CREATE POLICY "Public read access" ON project_information FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON land_registry FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON buildings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON developers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON contractor_projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON consultant_projects FOR SELECT TO anon, authenticated USING (true);

-- Service role has full access (for imports)
CREATE POLICY "Service role full access" ON project_information FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON land_registry FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON buildings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON projects FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON developers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON contractor_projects FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON consultant_projects FOR ALL TO service_role USING (true);
