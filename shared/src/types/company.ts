export type CompanyType = 'consultant' | 'contractor' | 'developer';

export interface Developer {
  id: string;
  developer_id: number;
  developer_number: number | null;
  developer_name_en: string | null;
  license_number: string | null;
  license_source_en: string | null;
  license_type_en: string | null;
  license_issue_date: string | null;
  license_expiry_date: string | null;
  legal_status_en: string | null;
  phone: string | null;
  fax: string | null;
  webpage: string | null;
  registration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consultant {
  consultant_license_no: number;
  consultant_english: string;
  project_count?: number;
}

export interface Contractor {
  contractor_license_no: number;
  contractor_english: string;
  project_count?: number;
}

export interface Company {
  id: string | number;
  license_no: number;
  name: string;
  type: CompanyType;
  project_count: number;
}

export interface CompanyFilters {
  type?: CompanyType | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeveloperWithProjects extends Developer {
  projects?: {
    project_id: number;
    project_status: string | null;
    area_name_en: string | null;
  }[];
}
