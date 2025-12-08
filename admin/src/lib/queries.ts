import { supabase } from './supabase';

export type CompanyType = 'consultant' | 'contractor' | 'developer';

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  area?: string;
  community?: string;
  building_type?: string;
}

export interface CompanyFilters {
  type?: CompanyType | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchProjects(filters: ProjectFilters = {}) {
  const { page = 1, limit = 20, status, search } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('project_information')
    .select('*', { count: 'exact' })
    .order('project_creation_date', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('project_status_english', status);
  }

  if (search) {
    query = query.or(
      `project_no.ilike.%${search}%,consultant_english.ilike.%${search}%,contractor_english.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export interface RERAProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function fetchRERAProjects(filters: RERAProjectFilters = {}) {
  const { page = 1, limit = 20, status, search } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('projects')
    .select(`
      *,
      developers!projects_developer_id_fkey (
        developer_name_en
      )
    `, { count: 'exact' })
    .order('project_id', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('project_status', status);
  }

  if (search) {
    query = query.or(
      `project_name.ilike.%${search}%,project_id::text.ilike.%${search}%,developer_name.ilike.%${search}%,area_name_en.ilike.%${search}%,master_project_en.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // Flatten the developer name from the joined table
  const flattenedData = (data || []).map((project: any) => ({
    ...project,
    developer_name_en: project.developers?.developer_name_en || null,
  }));

  return {
    data: flattenedData,
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function fetchCompanies(filters: CompanyFilters = {}) {
  const { type = 'all', search, page = 1, limit = 20 } = filters;
  const companies: {
    id: string;
    license_no: number;
    name: string;
    type: CompanyType;
    project_count: number;
  }[] = [];

  if (type === 'all' || type === 'consultant') {
    const { data: consultants } = await supabase
      .from('consultant_projects')
      .select('consultant_license_no, consultant_english')
      .not('consultant_license_no', 'is', null)
      .gt('consultant_license_no', 0);

    const consultantMap = new Map<
      number,
      { license_no: number; name: string; project_count: number }
    >();
    consultants?.forEach((c) => {
      const existing = consultantMap.get(c.consultant_license_no);
      if (existing) {
        existing.project_count++;
      } else {
        consultantMap.set(c.consultant_license_no, {
          license_no: c.consultant_license_no,
          name: c.consultant_english || 'Unknown',
          project_count: 1,
        });
      }
    });

    consultantMap.forEach((value, key) => {
      companies.push({
        id: `consultant-${key}`,
        ...value,
        type: 'consultant',
      });
    });
  }

  if (type === 'all' || type === 'contractor') {
    const { data: contractors } = await supabase
      .from('contractor_projects')
      .select('contractor_license_no, contractor_english')
      .not('contractor_license_no', 'is', null)
      .gt('contractor_license_no', 0);

    const contractorMap = new Map<
      number,
      { license_no: number; name: string; project_count: number }
    >();
    contractors?.forEach((c) => {
      const existing = contractorMap.get(c.contractor_license_no);
      if (existing) {
        existing.project_count++;
      } else {
        contractorMap.set(c.contractor_license_no, {
          license_no: c.contractor_license_no,
          name: c.contractor_english || 'Unknown',
          project_count: 1,
        });
      }
    });

    contractorMap.forEach((value, key) => {
      companies.push({
        id: `contractor-${key}`,
        ...value,
        type: 'contractor',
      });
    });
  }

  if (type === 'all' || type === 'developer') {
    const { data: developers } = await supabase
      .from('developers')
      .select('id, developer_id, developer_name_en');

    developers?.forEach((d) => {
      companies.push({
        id: d.id,
        license_no: d.developer_id,
        name: d.developer_name_en || 'Unknown',
        type: 'developer',
        project_count: 0,
      });
    });
  }

  let filteredCompanies = companies;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredCompanies = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.license_no.toString().includes(search)
    );
  }

  filteredCompanies.sort((a, b) => b.project_count - a.project_count);

  const from = (page - 1) * limit;
  const paginatedCompanies = filteredCompanies.slice(from, from + limit);

  return {
    data: paginatedCompanies,
    count: filteredCompanies.length,
    page,
    limit,
    totalPages: Math.ceil(filteredCompanies.length / limit),
  };
}

export async function fetchDashboardStats() {
  const [projectsRes, buildingsRes, developersRes, contractorRes, consultantRes] =
    await Promise.all([
      supabase.from('project_information').select('id', { count: 'exact', head: true }),
      supabase.from('buildings').select('id', { count: 'exact', head: true }),
      supabase.from('developers').select('id', { count: 'exact', head: true }),
      supabase
        .from('contractor_projects')
        .select('contractor_license_no')
        .not('contractor_license_no', 'is', null),
      supabase
        .from('consultant_projects')
        .select('consultant_license_no')
        .not('consultant_license_no', 'is', null),
    ]);

  const uniqueContractors = new Set(
    contractorRes.data?.map((c) => c.contractor_license_no)
  ).size;
  const uniqueConsultants = new Set(
    consultantRes.data?.map((c) => c.consultant_license_no)
  ).size;

  return {
    totalProjects: projectsRes.count || 0,
    totalBuildings: buildingsRes.count || 0,
    totalDevelopers: developersRes.count || 0,
    totalContractors: uniqueContractors,
    totalConsultants: uniqueConsultants,
  };
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}
