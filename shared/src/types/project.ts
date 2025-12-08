export interface ProjectInfo {
  id: string;
  project_no: number;
  parcel_id: number;
  consultant_english: string | null;
  contractor_english: string | null;
  consultant_license_no: number | null;
  contractor_license_no: number | null;
  project_status_english: string | null;
  project_creation_date: string | null;
  project_completion_date: string | null;
  permit_date: string | null;
  work_start_date: string | null;
  expected_completion_date: string | null;
  related_entity_name_en: string | null;
  applicanttype: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandRegistry {
  id: string;
  property_id: number | null;
  parcel_id: number;
  project_id: number | null;
  area_id: number | null;
  zone_id: number | null;
  area_name_en: string | null;
  land_number: number | null;
  land_sub_number: number | null;
  actual_area: number | null;
  property_type_en: string | null;
  property_sub_type_en: string | null;
  land_type_en: string | null;
  is_free_hold: boolean | null;
  is_registered: boolean | null;
  munc_zip_code: number | null;
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: string;
  property_id: number | null;
  parcel_id: number;
  project_id: number | null;
  area_name_en: string | null;
  land_number: number | null;
  building_number: string | null;
  floors: number | null;
  rooms: number | null;
  rooms_en: string | null;
  car_parks: number | null;
  built_up_area: number | null;
  actual_area: number | null;
  common_area: number | null;
  shops: number | null;
  flats: number | null;
  offices: number | null;
  elevators: number | null;
  swimming_pools: number | null;
  property_type_en: string | null;
  property_sub_type_en: string | null;
  master_project_en: string | null;
  project_name_en: string | null;
  land_type_en: string | null;
  is_free_hold: boolean | null;
  creation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_id: number;
  project_number: number | null;
  master_developer_id: number | null;
  developer_id: number | null;
  developer_name: string | null;
  master_developer_name: string | null;
  project_status: string | null;
  percent_completed: number | null;
  project_start_date: string | null;
  project_end_date: string | null;
  completion_date: string | null;
  area_name_en: string | null;
  master_project_en: string | null;
  zoning_authority_en: string | null;
  project_description_en: string | null;
  no_of_lands: number | null;
  no_of_buildings: number | null;
  no_of_villas: number | null;
  no_of_units: number | null;
  escrow_agent_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorProject {
  id: string;
  contractor_license_no: number | null;
  contractor_english: string | null;
  project_no: number | null;
  parcel_id: number;
  project_type: string | null;
  consultant_english: string | null;
  building_type: string | null;
  community_name: string | null;
  building_count: number | null;
  first_building_permit_date: string | null;
  last_app_submission_date: string | null;
  project_status: string | null;
  project_closing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultantProject {
  id: string;
  consultant_license_no: number | null;
  consultant_english: string | null;
  project_no: number | null;
  parcel_id: number;
  project_type: string | null;
  contractor_english: string | null;
  building_type: string | null;
  community_name: string | null;
  building_count: number | null;
  first_building_permit_date: string | null;
  last_app_submission_date: string | null;
  project_status: string | null;
  project_closing_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  project_type?: string;
  building_type?: string;
  property_sub_type?: string;
  area?: string;
  community?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProjectWithRelations extends ProjectInfo {
  contractor_projects?: ContractorProject[];
  consultant_projects?: ConsultantProject[];
  land_registry?: LandRegistry[];
  buildings?: Building[];
}
