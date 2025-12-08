export type TableName =
  | 'project_information'
  | 'land_registry'
  | 'buildings'
  | 'projects'
  | 'developers'
  | 'contractor_projects'
  | 'consultant_projects'
  | 'areas'
  | 'companies';

export interface ImportLog {
  id: string;
  table_name: TableName;
  file_name: string;
  records_imported: number;
  records_failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  imported_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TableConfig {
  name: TableName;
  displayName: string;
  uniqueKey: string;
  columns: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    csvHeader?: string;
    supportsArabicTransliteration?: boolean;
  }[];
}

export const TABLE_CONFIGS: Record<TableName, TableConfig> = {
  project_information: {
    name: 'project_information',
    displayName: 'Project Information',
    uniqueKey: 'project_no',
    columns: [
      { name: 'project_no', type: 'number', required: true },
      { name: 'parcel_id', type: 'number', required: true },
      { name: 'consultant_english', type: 'string', required: false },
      { name: 'contractor_english', type: 'string', required: false },
      { name: 'consultant_license_no', type: 'number', required: false },
      { name: 'contractor_license_no', type: 'number', required: false },
      { name: 'project_status_english', type: 'string', required: false },
      { name: 'project_creation_date', type: 'date', required: false },
      { name: 'project_completion_date', type: 'date', required: false },
      { name: 'permit_date', type: 'date', required: false },
      { name: 'work_start_date', type: 'date', required: false },
      { name: 'expected_completion_date', type: 'date', required: false },
      { name: 'related_entity_name_en', type: 'string', required: false },
      { name: 'applicanttype', type: 'string', required: false },
    ],
  },
  land_registry: {
    name: 'land_registry',
    displayName: 'Land Registry',
    uniqueKey: 'property_id',
    columns: [
      { name: 'property_id', type: 'number', required: false },
      { name: 'parcel_id', type: 'number', required: true },
      { name: 'project_id', type: 'number', required: false },
      { name: 'area_id', type: 'number', required: false },
      { name: 'zone_id', type: 'number', required: false },
      { name: 'area_name_en', type: 'string', required: false },
      { name: 'land_number', type: 'number', required: false },
      { name: 'land_sub_number', type: 'number', required: false },
      { name: 'actual_area', type: 'number', required: false },
      { name: 'property_type_en', type: 'string', required: false },
      { name: 'property_sub_type_en', type: 'string', required: false },
      { name: 'land_type_en', type: 'string', required: false },
      { name: 'is_free_hold', type: 'boolean', required: false },
      { name: 'is_registered', type: 'boolean', required: false },
      { name: 'munc_zip_code', type: 'number', required: false },
    ],
  },
  buildings: {
    name: 'buildings',
    displayName: 'Buildings',
    uniqueKey: 'property_id',
    columns: [
      { name: 'property_id', type: 'number', required: false },
      { name: 'parcel_id', type: 'number', required: true },
      { name: 'project_id', type: 'number', required: false },
      { name: 'area_name_en', type: 'string', required: false },
      { name: 'land_number', type: 'number', required: false },
      { name: 'building_number', type: 'string', required: false },
      { name: 'floors', type: 'number', required: false },
      { name: 'rooms', type: 'number', required: false },
      { name: 'rooms_en', type: 'string', required: false },
      { name: 'car_parks', type: 'number', required: false },
      { name: 'built_up_area', type: 'number', required: false },
      { name: 'actual_area', type: 'number', required: false },
      { name: 'common_area', type: 'number', required: false },
      { name: 'shops', type: 'number', required: false },
      { name: 'flats', type: 'number', required: false },
      { name: 'offices', type: 'number', required: false },
      { name: 'elevators', type: 'number', required: false },
      { name: 'swimming_pools', type: 'number', required: false },
      { name: 'property_type_en', type: 'string', required: false },
      { name: 'property_sub_type_en', type: 'string', required: false },
      { name: 'master_project_en', type: 'string', required: false },
      { name: 'project_name_en', type: 'string', required: false },
      { name: 'land_type_en', type: 'string', required: false },
      { name: 'is_free_hold', type: 'boolean', required: false },
      { name: 'creation_date', type: 'date', required: false },
    ],
  },
  projects: {
    name: 'projects',
    displayName: 'Projects (RERA)',
    uniqueKey: 'project_id',
    columns: [
      { name: 'project_id', type: 'number', required: true },
      { name: 'project_number', type: 'number', required: false },
      { name: 'project_name', type: 'string', required: false, supportsArabicTransliteration: true },
      { name: 'master_developer_id', type: 'number', required: false },
      { name: 'developer_id', type: 'number', required: false },
      { name: 'developer_name', type: 'string', required: false },
      { name: 'master_developer_name', type: 'string', required: false },
      { name: 'project_status', type: 'string', required: false },
      { name: 'percent_completed', type: 'number', required: false },
      { name: 'project_start_date', type: 'date', required: false },
      { name: 'project_end_date', type: 'date', required: false },
      { name: 'completion_date', type: 'date', required: false },
      { name: 'area_name_en', type: 'string', required: false },
      { name: 'master_project_en', type: 'string', required: false },
      { name: 'zoning_authority_en', type: 'string', required: false },
      { name: 'project_description_en', type: 'string', required: false },
      { name: 'no_of_lands', type: 'number', required: false },
      { name: 'no_of_buildings', type: 'number', required: false },
      { name: 'no_of_villas', type: 'number', required: false },
      { name: 'no_of_units', type: 'number', required: false },
      { name: 'escrow_agent_name', type: 'string', required: false },
    ],
  },
  developers: {
    name: 'developers',
    displayName: 'Developers',
    uniqueKey: 'developer_id',
    columns: [
      { name: 'developer_id', type: 'number', required: true },
      { name: 'developer_number', type: 'number', required: false },
      { name: 'developer_name_en', type: 'string', required: false },
      { name: 'license_number', type: 'string', required: false },
      { name: 'license_source_en', type: 'string', required: false },
      { name: 'license_type_en', type: 'string', required: false },
      { name: 'license_issue_date', type: 'date', required: false },
      { name: 'license_expiry_date', type: 'date', required: false },
      { name: 'legal_status_en', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false },
      { name: 'fax', type: 'string', required: false },
      { name: 'webpage', type: 'string', required: false },
      { name: 'registration_date', type: 'date', required: false },
    ],
  },
  contractor_projects: {
    name: 'contractor_projects',
    displayName: 'Contractor Projects',
    uniqueKey: 'id',
    columns: [
      { name: 'contractor_license_no', type: 'number', required: false },
      { name: 'contractor_english', type: 'string', required: false },
      { name: 'project_no', type: 'number', required: false },
      { name: 'parcel_id', type: 'number', required: true },
      { name: 'project_type', type: 'string', required: false },
      { name: 'consultant_english', type: 'string', required: false },
      { name: 'building_type', type: 'string', required: false },
      { name: 'community_name', type: 'string', required: false },
      { name: 'building_count', type: 'number', required: false },
      { name: 'first_building_permit_date', type: 'date', required: false },
      { name: 'last_app_submission_date', type: 'date', required: false },
      { name: 'project_status', type: 'string', required: false },
      { name: 'project_closing_date', type: 'date', required: false },
    ],
  },
  consultant_projects: {
    name: 'consultant_projects',
    displayName: 'Consultant Projects',
    uniqueKey: 'id',
    columns: [
      { name: 'consultant_license_no', type: 'number', required: false },
      { name: 'consultant_english', type: 'string', required: false },
      { name: 'project_no', type: 'number', required: false },
      { name: 'parcel_id', type: 'number', required: true },
      { name: 'project_type', type: 'string', required: false },
      { name: 'contractor_english', type: 'string', required: false },
      { name: 'building_type', type: 'string', required: false },
      { name: 'community_name', type: 'string', required: false },
      { name: 'building_count', type: 'number', required: false },
      { name: 'first_building_permit_date', type: 'date', required: false },
      { name: 'last_app_submission_date', type: 'date', required: false },
      { name: 'project_status', type: 'string', required: false },
      { name: 'project_closing_date', type: 'date', required: false },
    ],
  },
  areas: {
    name: 'areas',
    displayName: 'Areas',
    uniqueKey: 'munc_zip_code',
    columns: [
      { name: 'munc_zip_code', type: 'number', required: true },
      { name: 'area_name_en', type: 'string', required: true },
    ],
  },
  companies: {
    name: 'companies',
    displayName: 'Companies',
    uniqueKey: 'license_no,type',
    columns: [
      { name: 'license_no', type: 'number', required: true },
      { name: 'name_en', type: 'string', required: true },
      { name: 'type', type: 'string', required: true },
      { name: 'project_count', type: 'number', required: false },
    ],
  },
};
