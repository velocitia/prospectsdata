import { supabase } from './supabase';
import type { ProjectFilters, CompanyFilters, CompanyType, RERAProject, Company } from './types';

export type ProjectTypeFilter = 'all' | 'villas' | 'buildings';

export interface RERAProjectFilters {
  search?: string;
  status?: string;
  area?: string;
  developer?: string;
  projectType?: ProjectTypeFilter;
  page?: number;
  limit?: number;
}

// Cache for area lookup (munc_zip_code -> area_name_en)
let areaLookupCache: Map<number, string> | null = null;

// Cache for location synonyms (synonym -> official_name)
let locationSynonymsCache: Map<string, string[]> | null = null;

// Fetch and cache location synonyms from location_synonyms table
export async function getLocationSynonyms(): Promise<Map<string, string[]>> {
  if (locationSynonymsCache && locationSynonymsCache.size > 0) {
    return locationSynonymsCache;
  }

  locationSynonymsCache = new Map();

  const { data, error } = await supabase
    .from('location_synonyms')
    .select('official_name, synonym');

  if (error) {
    console.error('Error fetching location synonyms:', error);
    return locationSynonymsCache;
  }

  // Build a map where each search term (synonym or official name) maps to all matching official names
  data?.forEach((row) => {
    if (row.synonym && row.official_name) {
      const synonymLower = row.synonym.toLowerCase();
      const officialLower = row.official_name.toLowerCase();

      // Add synonym -> official_name mapping
      if (!locationSynonymsCache!.has(synonymLower)) {
        locationSynonymsCache!.set(synonymLower, []);
      }
      if (!locationSynonymsCache!.get(synonymLower)!.includes(row.official_name)) {
        locationSynonymsCache!.get(synonymLower)!.push(row.official_name);
      }

      // Also add official_name -> official_name mapping (for partial matches)
      if (!locationSynonymsCache!.has(officialLower)) {
        locationSynonymsCache!.set(officialLower, []);
      }
      if (!locationSynonymsCache!.get(officialLower)!.includes(row.official_name)) {
        locationSynonymsCache!.get(officialLower)!.push(row.official_name);
      }
    }
  });

  console.log('Location synonyms loaded:', locationSynonymsCache.size, 'entries');

  return locationSynonymsCache;
}

// Find official area names that match a search term (checks synonyms)
export async function findOfficialAreaNames(searchTerm: string): Promise<string[]> {
  const synonyms = await getLocationSynonyms();
  const searchLower = searchTerm.toLowerCase().trim();
  const matchingOfficialNames: Set<string> = new Set();

  // Check for exact match first
  if (synonyms.has(searchLower)) {
    synonyms.get(searchLower)!.forEach(name => matchingOfficialNames.add(name));
  }

  // Check for partial matches in synonyms
  synonyms.forEach((officialNames, synonym) => {
    if (synonym.includes(searchLower) || searchLower.includes(synonym)) {
      officialNames.forEach(name => matchingOfficialNames.add(name));
    }
  });

  return Array.from(matchingOfficialNames);
}

// Fetch and cache area lookup from areas table
export async function getAreaLookup(): Promise<Map<number, string>> {
  if (areaLookupCache && areaLookupCache.size > 0) {
    return areaLookupCache;
  }

  areaLookupCache = new Map();

  // Fetch all areas from the dedicated areas table
  const { data, error } = await supabase
    .from('areas')
    .select('munc_zip_code, area_name_en')
    .order('area_name_en');

  if (error) {
    console.error('Error fetching areas:', error);
    return areaLookupCache;
  }

  data?.forEach((row) => {
    if (row.munc_zip_code && row.area_name_en) {
      areaLookupCache!.set(row.munc_zip_code, row.area_name_en);
    }
  });

  console.log('Area lookup loaded:', areaLookupCache.size, 'areas');

  return areaLookupCache;
}

// Get area name from parcel_id (first 3 digits = munc_zip_code)
export function getZipCodeFromParcelId(parcelId: number): number {
  // Convert to string and get first 3 characters
  const parcelStr = String(parcelId);
  return parseInt(parcelStr.substring(0, 3), 10);
}

export async function getAreaNameFromParcelId(parcelId: number): Promise<string | null> {
  const lookup = await getAreaLookup();
  const zipCode = getZipCodeFromParcelId(parcelId);
  return lookup.get(zipCode) || null;
}

export async function fetchProjects(filters: ProjectFilters = {}) {
  const { page = 1, limit = 20, status, search, area, building_type } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Get area lookup for filtering and enriching data
  const areaLookup = await getAreaLookup();

  // Find zip codes that match the selected area
  let areaZipCodes: number[] | null = null;
  if (area) {
    areaZipCodes = [];
    areaLookup.forEach((areaName, zipCode) => {
      if (areaName === area) {
        areaZipCodes!.push(zipCode);
      }
    });
  }

  // If searching, check for location synonym matches
  let searchAreaZipCodes: number[] | null = null;
  if (search) {
    const matchingAreaNames = await findOfficialAreaNames(search);
    if (matchingAreaNames.length > 0) {
      searchAreaZipCodes = [];
      areaLookup.forEach((areaName, zipCode) => {
        if (matchingAreaNames.includes(areaName)) {
          searchAreaZipCodes!.push(zipCode);
        }
      });
    }
  }

  // If filtering by building_type, get matching parcel_ids from contractor_projects
  let buildingTypeParcelIds: number[] | null = null;
  if (building_type) {
    const { data: contractorData } = await supabase
      .from('contractor_projects')
      .select('parcel_id')
      .eq('building_type', building_type);

    buildingTypeParcelIds = [...new Set(contractorData?.map(c => c.parcel_id) || [])];

    if (buildingTypeParcelIds.length === 0) {
      return {
        data: [],
        count: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  let query = supabase
    .from('project_information')
    .select('*', { count: 'exact' })
    .order('project_creation_date', { ascending: false });

  if (status) {
    query = query.eq('project_status_english', status);
  }

  // Filter by building_type parcel_ids
  if (buildingTypeParcelIds) {
    query = query.in('parcel_id', buildingTypeParcelIds);
  }

  // Helper function to enrich projects with additional data
  const enrichProjects = async (projects: any[]) => {
    if (projects.length === 0) return projects;

    const parcelIds = projects.map(p => p.parcel_id);

    // Fetch contractor_projects for building_type and project_type
    const { data: contractorData } = await supabase
      .from('contractor_projects')
      .select('parcel_id, building_type, project_type')
      .in('parcel_id', parcelIds);

    // Fetch land_registry for project_id to get developer info
    const { data: landData } = await supabase
      .from('land_registry')
      .select('parcel_id, project_id')
      .in('parcel_id', parcelIds);

    // Get unique project_ids to fetch developer names
    const projectIds = [...new Set(landData?.map(l => l.project_id).filter(Boolean) || [])];

    let developerMap: Record<number, string> = {};
    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('project_id, developer_id')
        .in('project_id', projectIds);

      const developerIds = [...new Set(projectsData?.map(p => p.developer_id).filter(Boolean) || [])];

      if (developerIds.length > 0) {
        const { data: developersData } = await supabase
          .from('developers')
          .select('developer_id, developer_name_en')
          .in('developer_id', developerIds);

        const devNames: Record<number, string> = {};
        developersData?.forEach(d => {
          if (d.developer_name_en) devNames[d.developer_id] = d.developer_name_en;
        });

        projectsData?.forEach(p => {
          if (p.developer_id && devNames[p.developer_id]) {
            developerMap[p.project_id] = devNames[p.developer_id];
          }
        });
      }
    }

    // Create lookup maps
    const contractorMap: Record<number, { building_type?: string; project_type?: string }> = {};
    contractorData?.forEach(c => {
      if (!contractorMap[c.parcel_id]) {
        contractorMap[c.parcel_id] = { building_type: c.building_type, project_type: c.project_type };
      }
    });

    const landMap: Record<number, number | null> = {};
    landData?.forEach(l => {
      if (!landMap[l.parcel_id]) {
        landMap[l.parcel_id] = l.project_id;
      }
    });

    // Enrich projects
    return projects.map(project => {
      const contractorInfo = contractorMap[project.parcel_id] || {};
      const projectId = landMap[project.parcel_id];
      const developerName = projectId ? developerMap[projectId] : null;

      return {
        ...project,
        area_name: areaLookup.get(getZipCodeFromParcelId(project.parcel_id)) || null,
        building_type: contractorInfo.building_type || null,
        project_type: contractorInfo.project_type || null,
        developer_name: developerName || null,
      };
    });
  };

  // If searching, run combined text search and location-based search
  if (search) {
    // Build text search query
    let textQuery = supabase
      .from('project_information')
      .select('*')
      .order('project_creation_date', { ascending: false })
      .or(`project_no::text.ilike.%${search}%,consultant_english.ilike.%${search}%,contractor_english.ilike.%${search}%`)
      .limit(10000);

    if (status) textQuery = textQuery.eq('project_status_english', status);
    if (buildingTypeParcelIds) textQuery = textQuery.in('parcel_id', buildingTypeParcelIds);

    const textResult = await textQuery;
    if (textResult.error) throw textResult.error;

    // Start with text search results
    const projectMap = new Map<number, any>();
    (textResult.data || []).forEach(project => {
      if (!projectMap.has(project.parcel_id)) {
        projectMap.set(project.parcel_id, project);
      }
    });

    // If we have matching area zip codes from synonyms, also fetch those projects
    if (searchAreaZipCodes && searchAreaZipCodes.length > 0) {
      let locationQuery = supabase
        .from('project_information')
        .select('*')
        .order('project_creation_date', { ascending: false })
        .limit(10000);

      if (status) locationQuery = locationQuery.eq('project_status_english', status);
      if (buildingTypeParcelIds) locationQuery = locationQuery.in('parcel_id', buildingTypeParcelIds);

      const locationResult = await locationQuery;
      if (locationResult.error) throw locationResult.error;

      // Filter location results by matching zip codes and add to map
      (locationResult.data || []).forEach((project) => {
        const zipCode = getZipCodeFromParcelId(project.parcel_id);
        if (searchAreaZipCodes!.includes(zipCode) && !projectMap.has(project.parcel_id)) {
          projectMap.set(project.parcel_id, project);
        }
      });
    }

    // Apply area filter if specified
    let filteredProjects = Array.from(projectMap.values());
    if (areaZipCodes && areaZipCodes.length > 0) {
      filteredProjects = filteredProjects.filter((project) => {
        const zipCode = getZipCodeFromParcelId(project.parcel_id);
        return areaZipCodes!.includes(zipCode);
      });
    }

    // Sort by project_creation_date descending
    filteredProjects.sort((a, b) => {
      const dateA = a.project_creation_date ? new Date(a.project_creation_date).getTime() : 0;
      const dateB = b.project_creation_date ? new Date(b.project_creation_date).getTime() : 0;
      return dateB - dateA;
    });

    const totalCount = filteredProjects.length;
    const paginatedData = filteredProjects.slice(from, from + limit);
    const enrichedData = await enrichProjects(paginatedData);

    return {
      data: enrichedData,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  // If filtering by area, we need to fetch more data and filter client-side
  // because we need to decode parcel_id to get the zip code
  if (areaZipCodes && areaZipCodes.length > 0) {
    // Fetch all data (up to 10000) to filter by area
    query = query.limit(10000);

    const { data, error } = await query;
    if (error) throw error;

    // Filter by area first
    let filteredProjects = (data || []).filter((project) => {
      const zipCode = getZipCodeFromParcelId(project.parcel_id);
      return areaZipCodes!.includes(zipCode);
    });

    const totalCount = filteredProjects.length;

    // Apply pagination client-side
    const paginatedData = filteredProjects.slice(from, from + limit);

    // Enrich with additional data
    const enrichedData = await enrichProjects(paginatedData);

    return {
      data: enrichedData,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  // No area filter - use server-side pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // Enrich with additional data
  const enrichedData = await enrichProjects(data || []);

  return {
    data: enrichedData,
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function fetchProjectByParcelId(parcelId: number) {
  const { data, error } = await supabase
    .from('project_information')
    .select('*')
    .eq('parcel_id', parcelId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const areaLookup = await getAreaLookup();
    return {
      ...data,
      area_name: areaLookup.get(getZipCodeFromParcelId(data.parcel_id)) || null,
    };
  }

  return data;
}

export async function fetchCompanies(filters: CompanyFilters = {}) {
  const { type = 'all', search, sortBy = 'recent_active', dateRange = 'all', area, activityFilter = 'active_only', page = 1, limit = 20 } = filters;
  const from = (page - 1) * limit;

  // If searching, also search developers table to find developer IDs by name
  let matchingDeveloperIds: number[] = [];
  if (search && (type === 'all' || type === 'developer')) {
    const { data: developerMatches } = await supabase
      .from('developers')
      .select('developer_id')
      .ilike('developer_name_en', `%${search}%`);

    matchingDeveloperIds = developerMatches?.map(d => d.developer_id) || [];
  }

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' });

  // Apply sorting
  if (sortBy === 'name_asc') {
    query = query.order('name_en', { ascending: true });
  } else if (sortBy === 'highest_projects') {
    query = query.order('project_count', { ascending: false });
  } else if (sortBy === 'recent_active') {
    // Apply a server-side order first, then we'll re-sort client-side by absolute distance
    query = query.order('last_active_date', { ascending: false, nullsFirst: false });
  }

  // Filter by type
  if (type !== 'all') {
    query = query.eq('type', type);
  }

  // Filter by activity status
  if (activityFilter === 'active_only') {
    query = query.not('last_active_date', 'is', null);
  } else if (activityFilter === 'no_activity_only') {
    query = query.is('last_active_date', null);
  }

  // Filter by date range
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    if (dateRange === 'last_30_days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'last_90_days') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else {
      // last_year
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    query = query.gte('last_active_date', startDate.toISOString().split('T')[0]);
  }

  // Filter by area
  if (area) {
    query = query.eq('active_area', area);
  }

  // Search by name, license number, or matching developer IDs from developers table
  if (search) {
    if (matchingDeveloperIds.length > 0) {
      // Search in companies table OR by developer IDs found in developers table
      query = query.or(
        `name_en.ilike.%${search}%,license_no::text.ilike.%${search}%,license_no.in.(${matchingDeveloperIds.join(',')})`
      );
    } else {
      query = query.or(
        `name_en.ilike.%${search}%,license_no::text.ilike.%${search}%`
      );
    }
  }

  // Helper function to enrich company data with developer names from developers table
  const enrichWithDeveloperNames = async (companiesData: any[]) => {
    // Find developers that need name enrichment (no name_en or empty name)
    const developerIds = companiesData
      .filter(c => c.type === 'developer' && !c.name_en)
      .map(c => c.license_no);

    if (developerIds.length === 0) return companiesData;

    // Fetch developer names from developers table
    const { data: developerNames } = await supabase
      .from('developers')
      .select('developer_id, developer_name_en')
      .in('developer_id', developerIds);

    const nameMap = new Map<number, string>();
    developerNames?.forEach(d => {
      if (d.developer_name_en) {
        nameMap.set(d.developer_id, d.developer_name_en);
      }
    });

    // Enrich companies with developer names
    return companiesData.map(c => {
      if (c.type === 'developer' && !c.name_en && nameMap.has(c.license_no)) {
        return { ...c, name_en: nameMap.get(c.license_no) };
      }
      return c;
    });
  };

  // For recent_active sort, we need to fetch all data, sort client-side, then paginate
  // For other sorts, we can use server-side pagination
  if (sortBy === 'recent_active') {
    // Fetch all matching records (up to 10000 for practical limit)
    query = query.limit(10000);

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with developer names
    const enrichedData = await enrichWithDeveloperNames(data || []);

    // Transform to match expected format
    let companies = enrichedData.map((c) => transformCompanyRecord(c));

    // Sort by absolute distance from today (closest to today first)
    const today = new Date().getTime();
    companies = companies.sort((a, b) => {
      if (!a.last_active_date && !b.last_active_date) {
        // Both null - sort by name for consistency
        return (a.name || '').localeCompare(b.name || '');
      }
      if (!a.last_active_date) return 1; // nulls last
      if (!b.last_active_date) return -1;

      const distA = Math.abs(today - new Date(a.last_active_date).getTime());
      const distB = Math.abs(today - new Date(b.last_active_date).getTime());
      if (distA !== distB) {
        return distA - distB; // closest to today first
      }
      // Same distance - sort by name for consistency
      return (a.name || '').localeCompare(b.name || '');
    });

    const totalCount = companies.length;
    // Apply pagination client-side
    const paginatedCompanies = companies.slice(from, from + limit);

    return {
      data: paginatedCompanies,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  // For other sorts, use server-side pagination
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // Enrich with developer names
  const enrichedData = await enrichWithDeveloperNames(data || []);

  // Transform to match expected format
  const companies = enrichedData.map((c) => transformCompanyRecord(c));

  return {
    data: companies,
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// Helper function to transform company database record to Company type
function transformCompanyRecord(c: any): Company {
  return {
    id: `${c.type}-${c.license_no}`,
    license_no: c.license_no,
    name: c.name_en,
    type: c.type as CompanyType,
    project_count: c.project_count || 0,
    last_active_date: c.last_active_date || null,
    active_area: c.active_area || null,
    // Contact Information
    email: c.email || null,
    phone: c.phone || null,
    fax: c.fax || null,
    website: c.website || null,
    // Address Information
    address: c.address || null,
    emirate: c.emirate || null,
    po_box: c.po_box || null,
    // Company Profile
    established_year: c.established_year || null,
    employees_range: c.employees_range || null,
    description: c.description || null,
    specializations: c.specializations || [],
    // Key People & Social
    key_people: c.key_people || [],
    social_links: c.social_links || {},
    // Verification
    is_verified: c.is_verified || false,
  };
}

// Fetch areas from areas table for company filter
export interface AreaWithSynonyms {
  value: string;
  label: string;
  synonyms: string[];
}

export async function fetchCompanyAreas(): Promise<{
  areas: string[];
  areasWithSynonyms: AreaWithSynonyms[];
}> {
  // Fetch areas and synonyms in parallel
  const [areasResult, synonymsResult] = await Promise.all([
    supabase
      .from('areas')
      .select('area_name_en')
      .not('area_name_en', 'is', null)
      .order('area_name_en'),
    supabase
      .from('location_synonyms')
      .select('official_name, synonym'),
  ]);

  if (areasResult.error) throw areasResult.error;

  const areas = (areasResult.data || []).map(a => a.area_name_en).filter(Boolean) as string[];

  // Build synonyms map
  const synonymsMap = new Map<string, string[]>();
  synonymsResult.data?.forEach((row) => {
    const existing = synonymsMap.get(row.official_name) || [];
    existing.push(row.synonym);
    synonymsMap.set(row.official_name, existing);
  });

  // Build areas with synonyms
  const areasWithSynonyms = areas.map((area) => ({
    value: area,
    label: area,
    synonyms: synonymsMap.get(area) || [],
  }));

  return { areas, areasWithSynonyms };
}

// ============ Search Suggestions ============

export interface SearchSuggestion {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  secondaryText: string | null;
  url: string;
}

export async function fetchSearchSuggestions(
  query: string,
  options?: {
    entityTypes?: ('company' | 'project' | 'area')[];
    entitySubtypes?: string[];
    limit?: number;
  }
): Promise<SearchSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const limit = options?.limit || 10;

  let dbQuery = supabase
    .from('search_index')
    .select('id, name, entity_type, entity_subtype, secondary_text, url, priority')
    .ilike('name_lower', `%${searchTerm}%`)
    .order('priority', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit);

  // Filter by entity types if specified
  if (options?.entityTypes && options.entityTypes.length > 0) {
    dbQuery = dbQuery.in('entity_type', options.entityTypes);
  }

  // Filter by entity subtypes if specified
  if (options?.entitySubtypes && options.entitySubtypes.length > 0) {
    dbQuery = dbQuery.in('entity_subtype', options.entitySubtypes);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Search suggestions error:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    type: item.entity_type,
    subtype: item.entity_subtype,
    secondaryText: item.secondary_text,
    url: item.url,
  }));
}

export async function fetchCompanyByLicenseNo(licenseNo: number, type: CompanyType) {
  // Get company info from companies table
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('license_no', licenseNo)
    .eq('type', type)
    .maybeSingle();

  if (companyError) throw companyError;

  if (type === 'developer') {
    // Get additional developer details from developers table
    const { data: developerData } = await supabase
      .from('developers')
      .select('*')
      .eq('developer_id', licenseNo)
      .maybeSingle();

    return {
      company: {
        ...companyData,
        ...developerData,
      },
      type,
    };
  }

  if (type === 'consultant') {
    const { data: projects, error } = await supabase
      .from('consultant_projects')
      .select('*')
      .eq('consultant_license_no', licenseNo);

    if (error) throw error;

    return {
      company: {
        license_no: licenseNo,
        name_en: companyData?.name_en || projects?.[0]?.consultant_english || 'Unknown',
        project_count: companyData?.project_count || projects?.length || 0,
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

    return {
      company: {
        license_no: licenseNo,
        name_en: companyData?.name_en || projects?.[0]?.contractor_english || 'Unknown',
        project_count: companyData?.project_count || projects?.length || 0,
      },
      projects: projects || [],
      type,
    };
  }

  throw new Error('Invalid company type');
}

export async function fetchFilterOptions() {
  const [statusRes, buildingTypeRes, synonymsMap] = await Promise.all([
    supabase
      .from('project_information')
      .select('project_status_english')
      .not('project_status_english', 'is', null)
      .limit(10000),
    supabase
      .from('contractor_projects')
      .select('building_type')
      .not('building_type', 'is', null)
      .limit(10000),
    getAreaSynonymsMap(),
  ]);

  // Get areas from the area lookup (land_registry based)
  const areaLookup = await getAreaLookup();
  const uniqueAreas = [...new Set(areaLookup.values())].sort() as string[];

  const uniqueStatuses = [
    ...new Set(statusRes.data?.map((r) => r.project_status_english)),
  ].filter(Boolean).sort();
  const uniqueBuildingTypes = [
    ...new Set(buildingTypeRes.data?.map((r) => r.building_type)),
  ].filter(Boolean).sort();

  // Build areas with synonyms
  const areasWithSynonyms = uniqueAreas.map((area) => ({
    value: area,
    label: area,
    synonyms: synonymsMap.get(area) || [],
  }));

  return {
    statuses: uniqueStatuses as string[],
    areas: uniqueAreas,
    areasWithSynonyms,
    buildingTypes: uniqueBuildingTypes as string[],
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

// Normalize status: treat CONDITIONAL_ACTIVATING as ACTIVE
export function normalizeStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  if (status.toUpperCase() === 'CONDITIONAL_ACTIVATING') {
    return 'Active';
  }
  return status;
}

// Format status for display: Capitalize instead of ALL CAPS
// Returns null for statuses that should be hidden (Not Started, Pending)
export function formatStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  const normalized = normalizeStatus(status);
  if (!normalized) return null;

  // Hide "Not Started" and "Pending" statuses
  const lowerStatus = normalized.toLowerCase();
  if (lowerStatus === 'not started' || lowerStatus === 'not_started' ||
      lowerStatus === 'pending' || lowerStatus === 'notstarted') {
    return null;
  }

  // Convert to title case (capitalize first letter of each word)
  return normalized
    .toLowerCase()
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getStatusColor(status: string | null | undefined): string {
  if (!status) return 'gray';
  // Normalize CONDITIONAL_ACTIVATING to ACTIVE for color purposes
  const normalizedStatus = normalizeStatus(status)?.toLowerCase() || '';

  if (normalizedStatus.includes('active') || normalizedStatus.includes('progress') || normalizedStatus.includes('ongoing')) {
    return 'green';
  }
  if (normalizedStatus.includes('completed') || normalizedStatus.includes('done')) {
    return 'blue';
  }
  if (normalizedStatus.includes('pending') || normalizedStatus.includes('planned')) {
    return 'yellow';
  }
  if (normalizedStatus.includes('cancelled') || normalizedStatus.includes('stopped')) {
    return 'red';
  }
  return 'gray';
}

// ============ Projects (Developer Projects) ============

export async function fetchRERAProjects(filters: RERAProjectFilters = {}) {
  const { page = 1, limit = 20, status, search, area, developer, projectType = 'all' } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Helper to apply project type filter to a query
  const applyProjectTypeFilter = (query: any) => {
    if (projectType === 'villas') {
      return query.gt('no_of_villas', 0);
    } else if (projectType === 'buildings') {
      return query.gt('no_of_buildings', 0);
    }
    return query;
  };

  // Helper to apply status filter - treats CONDITIONAL_ACTIVATING as ACTIVE
  const applyStatusFilter = (query: any, statusValue: string | undefined) => {
    if (!statusValue) return query;
    // When filtering by ACTIVE, also include CONDITIONAL_ACTIVATING
    if (statusValue.toUpperCase() === 'ACTIVE') {
      return query.in('project_status', ['ACTIVE', 'CONDITIONAL_ACTIVATING']);
    }
    return query.eq('project_status', statusValue);
  };

  // If searching, we need to also search by developer English name and location synonyms
  let matchingDeveloperIds: number[] = [];
  let matchingAreaNames: string[] = [];

  if (search) {
    // Search in companies, developers, and location synonyms in parallel
    const [companiesResult, developersResult, locationMatches] = await Promise.all([
      supabase
        .from('companies')
        .select('license_no')
        .eq('type', 'developer')
        .ilike('name_en', `%${search}%`),
      supabase
        .from('developers')
        .select('developer_id')
        .ilike('developer_name_en', `%${search}%`),
      findOfficialAreaNames(search),
    ]);

    const companyIds = companiesResult.data?.map(c => c.license_no) || [];
    const developerIds = developersResult.data?.map(d => d.developer_id) || [];

    // Combine and deduplicate
    matchingDeveloperIds = [...new Set([...companyIds, ...developerIds])];
    matchingAreaNames = locationMatches;
  }

  // Build a function to get all developer names (from both companies and developers tables)
  const getDeveloperNames = async (developerIds: number[]) => {
    if (developerIds.length === 0) return {};

    // Fetch from both companies and developers tables in parallel
    const [companiesResult, developersResult] = await Promise.all([
      supabase
        .from('companies')
        .select('license_no, name_en')
        .in('license_no', developerIds)
        .eq('type', 'developer'),
      supabase
        .from('developers')
        .select('developer_id, developer_name_en')
        .in('developer_id', developerIds),
    ]);

    const names: Record<number, string> = {};

    // First add from developers table
    developersResult.data?.forEach(d => {
      if (d.developer_name_en) {
        names[d.developer_id] = d.developer_name_en;
      }
    });

    // Then override with companies table (if exists, it's the canonical source)
    companiesResult.data?.forEach(c => {
      if (c.name_en) {
        names[c.license_no] = c.name_en;
      }
    });

    return names;
  };

  // If searching, always run combined search to include text search + developer matches + area synonym matches
  if (search) {
    // Build queries array for parallel execution
    const queries: Promise<any>[] = [
      // Text search query
      (async () => {
        let query = supabase
          .from('projects')
          .select('*', { count: 'exact' })
          .order('project_start_date', { ascending: false, nullsFirst: false })
          .or(`project_id::text.ilike.%${search}%,developer_name.ilike.%${search}%,project_description_en.ilike.%${search}%,master_project_en.ilike.%${search}%,area_name_en.ilike.%${search}%`);

        query = applyStatusFilter(query, status);
        if (area) query = query.eq('area_name_en', area);
        query = applyProjectTypeFilter(query);

        return query;
      })(),
    ];

    // Add developer ID match query if we have matching developers
    if (matchingDeveloperIds.length > 0) {
      queries.push(
        (async () => {
          let query = supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .order('project_start_date', { ascending: false, nullsFirst: false })
            .in('developer_id', matchingDeveloperIds);

          query = applyStatusFilter(query, status);
          if (area) query = query.eq('area_name_en', area);
          query = applyProjectTypeFilter(query);

          return query;
        })()
      );
    }

    // Add area name match query if we have matching areas from synonyms
    if (matchingAreaNames.length > 0) {
      queries.push(
        (async () => {
          let query = supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .order('project_start_date', { ascending: false, nullsFirst: false })
            .in('area_name_en', matchingAreaNames);

          query = applyStatusFilter(query, status);
          if (area) query = query.eq('area_name_en', area);
          query = applyProjectTypeFilter(query);

          return query;
        })()
      );
    }

    const results = await Promise.all(queries);

    // Merge and deduplicate results by project_id
    const projectMap = new Map<number, any>();
    results.forEach(result => {
      (result.data || []).forEach((project: any) => {
        if (!projectMap.has(project.project_id)) {
          projectMap.set(project.project_id, project);
        }
      });
    });

    // Sort by project_start_date descending
    let allProjects = Array.from(projectMap.values()).sort((a, b) => {
      const dateA = a.project_start_date ? new Date(a.project_start_date).getTime() : 0;
      const dateB = b.project_start_date ? new Date(b.project_start_date).getTime() : 0;
      return dateB - dateA;
    });

    const totalCount = allProjects.length;
    const paginatedData = allProjects.slice(from, from + limit);

    // Get developer names
    const developerIds = [...new Set(paginatedData.map(p => p.developer_id).filter(Boolean))];
    const developerNames = await getDeveloperNames(developerIds);

    const projectsWithDeveloperEn = paginatedData.map((project: any) => ({
      ...project,
      developer_name_en: developerNames[project.developer_id] || null,
    }));

    return {
      data: projectsWithDeveloperEn,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  // Standard query (no developer name match or no search)
  let query = supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .order('project_start_date', { ascending: false, nullsFirst: false });

  if (status) {
    query = applyStatusFilter(query, status);
  }

  if (area) {
    query = query.eq('area_name_en', area);
  }

  if (developer) {
    query = query.ilike('developer_name', `%${developer}%`);
  }

  if (search) {
    query = query.or(
      `project_id::text.ilike.%${search}%,developer_name.ilike.%${search}%,project_description_en.ilike.%${search}%,master_project_en.ilike.%${search}%,area_name_en.ilike.%${search}%`
    );
  }

  // Apply project type filter
  query = applyProjectTypeFilter(query);

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // Get developer_name_en for each project from companies table
  const developerIds = [...new Set((data || []).map(p => p.developer_id).filter(Boolean))];
  const developerNames = await getDeveloperNames(developerIds);

  const projectsWithDeveloperEn = (data || []).map((project: any) => ({
    ...project,
    developer_name_en: developerNames[project.developer_id] || null,
  }));

  return {
    data: projectsWithDeveloperEn,
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function fetchRERAProjectById(projectId: number) {
  // Get the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (projectError) throw projectError;
  if (!project) return null;

  // Get developer_name_en from companies table
  let developerNameEn: string | null = null;
  if (project.developer_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name_en')
      .eq('license_no', project.developer_id)
      .eq('type', 'developer')
      .maybeSingle();

    developerNameEn = company?.name_en || null;
  }

  const projectWithDeveloperEn = {
    ...project,
    developer_name_en: developerNameEn,
  };

  // Get parcel count and parcels from land_registry
  const { data: parcels, error: parcelError } = await supabase
    .from('land_registry')
    .select('parcel_id, area_name_en')
    .eq('project_id', projectId);

  if (parcelError) throw parcelError;

  // Combine parcel_ids from land_registry AND the project's own parcel_id (if extracted)
  const landRegistryParcelIds = parcels?.map((p) => p.parcel_id) || [];
  const allParcelIds = project.parcel_id
    ? [...new Set([project.parcel_id, ...landRegistryParcelIds])]
    : landRegistryParcelIds;

  // Get permits from project_information for these parcels
  let permits: any[] = [];
  let uniqueConsultants: string[] = [];
  let uniqueContractors: string[] = [];

  // Also fetch land registry info for the project's parcel_id if it exists
  let linkedLandRegistry: any = null;
  if (project.parcel_id) {
    const { data: landData } = await supabase
      .from('land_registry')
      .select('*')
      .eq('parcel_id', project.parcel_id)
      .maybeSingle();

    linkedLandRegistry = landData;
  }

  if (allParcelIds.length > 0) {
    const { data: permitsData, error: permitsError } = await supabase
      .from('project_information')
      .select('*')
      .in('parcel_id', allParcelIds)
      .order('project_creation_date', { ascending: false });

    if (permitsError) throw permitsError;

    permits = permitsData || [];

    // Get unique consultants and contractors
    uniqueConsultants = [
      ...new Set(
        permits
          .map((p) => p.consultant_english)
          .filter((c): c is string => c !== null && c !== undefined)
      ),
    ];

    uniqueContractors = [
      ...new Set(
        permits
          .map((p) => p.contractor_english)
          .filter((c): c is string => c !== null && c !== undefined)
      ),
    ];
  }

  return {
    ...projectWithDeveloperEn,
    parcel_count: allParcelIds.length,
    permit_count: permits.length,
    parcels: parcels || [],
    permits,
    unique_consultants: uniqueConsultants,
    unique_contractors: uniqueContractors,
    // New fields for linked parcel data
    linked_parcel_id: project.parcel_id || null,
    linked_land_registry: linkedLandRegistry,
  };
}

// ============ Permits (Project Information) with parcel history ============

export async function fetchPermitsByParcelId(parcelId: number) {
  // Get all permits for this parcel (history)
  const { data: permits, error: permitsError } = await supabase
    .from('project_information')
    .select('*')
    .eq('parcel_id', parcelId)
    .order('project_creation_date', { ascending: false });

  if (permitsError) throw permitsError;

  // Get land registry info for this parcel
  const { data: landRegistry, error: landError } = await supabase
    .from('land_registry')
    .select('*')
    .eq('parcel_id', parcelId)
    .maybeSingle();

  if (landError) throw landError;

  // Check if this parcel belongs to a RERA project
  let reraProject: RERAProject | null = null;
  if (landRegistry?.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', landRegistry.project_id)
      .maybeSingle();

    reraProject = project;
  }

  // Get area name
  const areaLookup = await getAreaLookup();
  const areaName = areaLookup.get(getZipCodeFromParcelId(parcelId)) || landRegistry?.area_name_en || null;

  return {
    parcel_id: parcelId,
    area_name: areaName,
    land_registry: landRegistry,
    rera_project: reraProject,
    permits: permits || [],
    permit_count: permits?.length || 0,
  };
}

// ============ Company Details with associated projects and areas ============

export async function fetchCompanyDetails(licenseNo: number, type: CompanyType) {
  // Get company info from companies table
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('license_no', licenseNo)
    .eq('type', type)
    .maybeSingle();

  if (companyError) throw companyError;

  if (type === 'developer') {
    // Get developer details
    const { data: developerData } = await supabase
      .from('developers')
      .select('*')
      .eq('developer_id', licenseNo)
      .maybeSingle();

    // Get all RERA projects for this developer
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('developer_id', licenseNo)
      .order('project_start_date', { ascending: false });

    // Get unique areas from their projects
    const uniqueAreas = [
      ...new Set(
        projects
          ?.map((p) => p.area_name_en)
          .filter((a): a is string => a !== null && a !== undefined)
      ),
    ].sort();

    return {
      company: {
        ...companyData,
        ...developerData,
      },
      projects: projects || [],
      areas: uniqueAreas,
      type,
    };
  }

  if (type === 'consultant') {
    // Get permits this consultant worked on
    const { data: permits } = await supabase
      .from('project_information')
      .select('*')
      .eq('consultant_license_no', licenseNo);

    // Get parcel_ids to find RERA projects
    const parcelIds = permits?.map((p) => p.parcel_id) || [];

    // Get land registry to find project_ids
    let reraProjectIds: number[] = [];
    let areas: string[] = [];

    if (parcelIds.length > 0) {
      const { data: landData } = await supabase
        .from('land_registry')
        .select('project_id, area_name_en')
        .in('parcel_id', parcelIds);

      reraProjectIds = [
        ...new Set(
          landData
            ?.map((l) => l.project_id)
            .filter((id): id is number => id !== null && id !== undefined)
        ),
      ];

      areas = [
        ...new Set(
          landData
            ?.map((l) => l.area_name_en)
            .filter((a): a is string => a !== null && a !== undefined)
        ),
      ].sort();
    }

    // Get RERA projects
    let reraProjects: any[] = [];
    if (reraProjectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('project_id', reraProjectIds)
        .order('project_start_date', { ascending: false });

      reraProjects = projects || [];
    }

    return {
      company: {
        license_no: licenseNo,
        name_en: companyData?.name_en || permits?.[0]?.consultant_english || 'Unknown',
        project_count: companyData?.project_count || 0,
      },
      permits: permits || [],
      projects: reraProjects,
      areas,
      type,
    };
  }

  if (type === 'contractor') {
    // Get permits this contractor worked on
    const { data: permits } = await supabase
      .from('project_information')
      .select('*')
      .eq('contractor_license_no', licenseNo);

    // Get parcel_ids to find RERA projects
    const parcelIds = permits?.map((p) => p.parcel_id) || [];

    // Get land registry to find project_ids
    let reraProjectIds: number[] = [];
    let areas: string[] = [];

    if (parcelIds.length > 0) {
      const { data: landData } = await supabase
        .from('land_registry')
        .select('project_id, area_name_en')
        .in('parcel_id', parcelIds);

      reraProjectIds = [
        ...new Set(
          landData
            ?.map((l) => l.project_id)
            .filter((id): id is number => id !== null && id !== undefined)
        ),
      ];

      areas = [
        ...new Set(
          landData
            ?.map((l) => l.area_name_en)
            .filter((a): a is string => a !== null && a !== undefined)
        ),
      ].sort();
    }

    // Get RERA projects
    let reraProjects: any[] = [];
    if (reraProjectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('project_id', reraProjectIds)
        .order('project_start_date', { ascending: false });

      reraProjects = projects || [];
    }

    return {
      company: {
        license_no: licenseNo,
        name_en: companyData?.name_en || permits?.[0]?.contractor_english || 'Unknown',
        project_count: companyData?.project_count || 0,
      },
      permits: permits || [],
      projects: reraProjects,
      areas,
      type,
    };
  }

  throw new Error('Invalid company type');
}

// ============ Filter Options ============

// Helper to get synonyms grouped by official name
async function getAreaSynonymsMap(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from('location_synonyms')
    .select('official_name, synonym');

  const synonymsMap = new Map<string, string[]>();

  if (error || !data) return synonymsMap;

  data.forEach((row) => {
    if (row.official_name && row.synonym) {
      if (!synonymsMap.has(row.official_name)) {
        synonymsMap.set(row.official_name, []);
      }
      synonymsMap.get(row.official_name)!.push(row.synonym);
    }
  });

  return synonymsMap;
}

export async function fetchRERAFilterOptions() {
  const [statusRes, areaRes, synonymsMap] = await Promise.all([
    supabase
      .from('projects')
      .select('project_status')
      .not('project_status', 'is', null)
      .limit(10000),
    supabase
      .from('projects')
      .select('area_name_en')
      .not('area_name_en', 'is', null)
      .limit(10000),
    getAreaSynonymsMap(),
  ]);

  const uniqueStatuses = [
    ...new Set(statusRes.data?.map((r) => r.project_status)),
  ].filter(Boolean).sort();

  const uniqueAreas = [
    ...new Set(areaRes.data?.map((r) => r.area_name_en)),
  ].filter(Boolean).sort() as string[];

  // Build areas with synonyms
  const areasWithSynonyms = uniqueAreas.map((area) => ({
    value: area,
    label: area,
    synonyms: synonymsMap.get(area) || [],
  }));

  return {
    statuses: uniqueStatuses as string[],
    areas: uniqueAreas,
    areasWithSynonyms,
  };
}
