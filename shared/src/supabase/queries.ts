import { supabase } from './client';
import type { ProjectFilters, CompanyFilters, CompanyType } from '../types';

export async function fetchProjects(filters: ProjectFilters = {}) {
  const { page = 1, limit = 20, status, search, area, community, building_type } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('project_information')
    .select(
      `
      *,
      contractor_projects!project_information_parcel_id_fkey(*),
      consultant_projects!project_information_parcel_id_fkey(*)
    `,
      { count: 'exact' }
    )
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

export async function fetchProjectByParcelId(parcelId: number) {
  const { data, error } = await supabase
    .from('project_information')
    .select(
      `
      *,
      contractor_projects!project_information_parcel_id_fkey(*),
      consultant_projects!project_information_parcel_id_fkey(*),
      land_registry!land_registry_parcel_id_fkey(*),
      buildings!buildings_parcel_id_fkey(*)
    `
    )
    .eq('parcel_id', parcelId)
    .single();

  if (error) throw error;
  return data;
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

export async function fetchCompanyByLicenseNo(licenseNo: number, type: CompanyType) {
  if (type === 'developer') {
    const { data, error } = await supabase
      .from('developers')
      .select('*')
      .eq('developer_id', licenseNo)
      .single();

    if (error) throw error;
    return { company: data, type };
  }

  if (type === 'consultant') {
    const { data: projects, error } = await supabase
      .from('consultant_projects')
      .select('*')
      .eq('consultant_license_no', licenseNo);

    if (error) throw error;

    const companyName = projects?.[0]?.consultant_english || 'Unknown';

    return {
      company: {
        consultant_license_no: licenseNo,
        consultant_english: companyName,
      },
      projects: projects || [],
      type,
    };
  }

  if (type === 'contractor') {
    const { data: projects, error } = await supabase
      .from('contractor_projects')
      .select('*')
      .eq('contractor_license_no', licenseNo);

    if (error) throw error;

    const companyName = projects?.[0]?.contractor_english || 'Unknown';

    return {
      company: {
        contractor_license_no: licenseNo,
        contractor_english: companyName,
      },
      projects: projects || [],
      type,
    };
  }

  throw new Error('Invalid company type');
}

export async function fetchFilterOptions() {
  const [statusRes, areaRes, communityRes, buildingTypeRes, projectTypeRes] =
    await Promise.all([
      supabase
        .from('project_information')
        .select('project_status_english')
        .not('project_status_english', 'is', null),
      supabase
        .from('land_registry')
        .select('area_name_en')
        .not('area_name_en', 'is', null),
      supabase
        .from('contractor_projects')
        .select('community_name')
        .not('community_name', 'is', null),
      supabase
        .from('contractor_projects')
        .select('building_type')
        .not('building_type', 'is', null),
      supabase
        .from('contractor_projects')
        .select('project_type')
        .not('project_type', 'is', null),
    ]);

  const uniqueStatuses = [
    ...new Set(statusRes.data?.map((r) => r.project_status_english)),
  ].filter(Boolean);
  const uniqueAreas = [
    ...new Set(areaRes.data?.map((r) => r.area_name_en)),
  ].filter(Boolean);
  const uniqueCommunities = [
    ...new Set(communityRes.data?.map((r) => r.community_name)),
  ].filter(Boolean);
  const uniqueBuildingTypes = [
    ...new Set(buildingTypeRes.data?.map((r) => r.building_type)),
  ].filter(Boolean);
  const uniqueProjectTypes = [
    ...new Set(projectTypeRes.data?.map((r) => r.project_type)),
  ].filter(Boolean);

  return {
    statuses: uniqueStatuses as string[],
    areas: uniqueAreas as string[],
    communities: uniqueCommunities as string[],
    buildingTypes: uniqueBuildingTypes as string[],
    projectTypes: uniqueProjectTypes as string[],
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
