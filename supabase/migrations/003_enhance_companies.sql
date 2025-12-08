-- Migration: 003_enhance_companies
-- Purpose: Add business contact and profile fields to companies table

-- ============================================
-- ADD NEW COLUMNS TO COMPANIES TABLE
-- ============================================

-- Contact Information
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fax VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR;

-- Address Information
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS emirate VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS po_box VARCHAR;

-- Company Profile
ALTER TABLE companies ADD COLUMN IF NOT EXISTS established_year INT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employees_range VARCHAR; -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;

-- Specializations (stored as JSON array for flexibility)
-- e.g., ['Residential', 'Commercial', 'Hospitality', 'Infrastructure']
ALTER TABLE companies ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;

-- Key People (stored as JSON array)
-- e.g., [{"name": "John Doe", "role": "CEO", "phone": "+971...", "email": "..."}]
ALTER TABLE companies ADD COLUMN IF NOT EXISTS key_people JSONB DEFAULT '[]'::jsonb;

-- Social Media Links (stored as JSON object)
-- e.g., {"linkedin": "...", "twitter": "...", "instagram": "..."}
ALTER TABLE companies ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Verification/Quality Indicators
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT; -- Internal notes

-- ============================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_emirate ON companies(emirate);
CREATE INDEX IF NOT EXISTS idx_companies_established ON companies(established_year);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(is_verified);

-- GIN index for JSONB specializations (for array containment queries)
CREATE INDEX IF NOT EXISTS idx_companies_specializations ON companies USING GIN (specializations);

-- ============================================
-- SYNC DEVELOPER DATA TO COMPANIES
-- ============================================

-- Update companies table with existing developer contact info
UPDATE companies c
SET
  phone = COALESCE(c.phone, d.phone),
  fax = COALESCE(c.fax, d.fax),
  website = COALESCE(c.website, d.webpage)
FROM developers d
WHERE c.type = 'developer'
  AND c.license_no = d.developer_id
  AND (d.phone IS NOT NULL OR d.fax IS NOT NULL OR d.webpage IS NOT NULL);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN companies.email IS 'Primary contact email address';
COMMENT ON COLUMN companies.phone IS 'Primary contact phone number';
COMMENT ON COLUMN companies.website IS 'Company website URL';
COMMENT ON COLUMN companies.address IS 'Full office address';
COMMENT ON COLUMN companies.emirate IS 'UAE emirate where company is based';
COMMENT ON COLUMN companies.established_year IS 'Year company was established';
COMMENT ON COLUMN companies.employees_range IS 'Company size range: 1-10, 11-50, 51-200, 201-500, 500+';
COMMENT ON COLUMN companies.specializations IS 'JSON array of specialization areas';
COMMENT ON COLUMN companies.key_people IS 'JSON array of key contacts: [{name, role, phone, email}]';
COMMENT ON COLUMN companies.social_links IS 'JSON object of social media links: {linkedin, twitter, etc}';
COMMENT ON COLUMN companies.is_verified IS 'Whether company info has been verified';
