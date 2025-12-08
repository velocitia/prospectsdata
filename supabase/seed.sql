-- Seed data for development/testing
-- This file is optional and used to populate initial test data

-- Sample developers
INSERT INTO developers (developer_id, developer_number, developer_name_en, license_number, license_source_en, legal_status_en, phone, registration_date)
VALUES
  (1001, 1, 'Emaar Properties', 'DEV-001', 'DLD', 'Active', '+971 4 366 1688', '2002-06-23'),
  (1002, 2, 'Nakheel', 'DEV-002', 'DLD', 'Active', '+971 4 390 3333', '2000-02-14'),
  (1003, 3, 'DAMAC Properties', 'DEV-003', 'DLD', 'Active', '+971 4 301 9999', '2002-01-01'),
  (1004, 4, 'Dubai Properties', 'DEV-004', 'DLD', 'Active', '+971 4 885 5555', '2004-05-15'),
  (1005, 5, 'Meraas', 'DEV-005', 'DLD', 'Active', '+971 4 317 3999', '2007-03-01')
ON CONFLICT (developer_id) DO NOTHING;

-- Sample project information
INSERT INTO project_information (project_no, parcel_id, consultant_english, contractor_english, project_status_english, project_creation_date)
VALUES
  (10001, 50001, 'AECOM', 'Arabtec', 'Under Construction', '2023-01-15'),
  (10002, 50002, 'Atkins', 'Al Habtoor', 'Completed', '2022-06-01'),
  (10003, 50003, 'WSP', 'ACC', 'Under Construction', '2023-03-20'),
  (10004, 50004, 'Dar Al Handasah', 'Besix', 'Planned', '2024-01-01'),
  (10005, 50005, 'KEO International', 'Drake & Scull', 'On Hold', '2023-08-10')
ON CONFLICT (project_no) DO NOTHING;

-- Sample contractor projects
INSERT INTO contractor_projects (contractor_license_no, contractor_english, project_no, parcel_id, project_type, building_type, community_name, project_status)
VALUES
  (2001, 'Arabtec', 10001, 50001, 'Residential', 'Tower', 'Downtown Dubai', 'Under Construction'),
  (2002, 'Al Habtoor', 10002, 50002, 'Commercial', 'Office Building', 'Business Bay', 'Completed'),
  (2003, 'ACC', 10003, 50003, 'Mixed Use', 'Complex', 'Dubai Marina', 'Under Construction'),
  (2004, 'Besix', 10004, 50004, 'Residential', 'Villa', 'Palm Jumeirah', 'Planned'),
  (2005, 'Drake & Scull', 10005, 50005, 'Commercial', 'Mall', 'JLT', 'On Hold')
ON CONFLICT DO NOTHING;

-- Sample consultant projects
INSERT INTO consultant_projects (consultant_license_no, consultant_english, project_no, parcel_id, project_type, building_type, community_name, project_status)
VALUES
  (3001, 'AECOM', 10001, 50001, 'Residential', 'Tower', 'Downtown Dubai', 'Under Construction'),
  (3002, 'Atkins', 10002, 50002, 'Commercial', 'Office Building', 'Business Bay', 'Completed'),
  (3003, 'WSP', 10003, 50003, 'Mixed Use', 'Complex', 'Dubai Marina', 'Under Construction'),
  (3004, 'Dar Al Handasah', 10004, 50004, 'Residential', 'Villa', 'Palm Jumeirah', 'Planned'),
  (3005, 'KEO International', 10005, 50005, 'Commercial', 'Mall', 'JLT', 'On Hold')
ON CONFLICT DO NOTHING;
