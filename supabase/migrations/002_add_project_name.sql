-- Migration: 002_add_project_name
-- Add project_name column to projects table for storing English project names
-- (transliterated from Arabic project_name in CSV)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_name VARCHAR;

-- Create index for project_name searches
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(project_name);

-- Add comment explaining the column
COMMENT ON COLUMN projects.project_name IS 'Project name in English (transliterated from Arabic if needed during import)';
