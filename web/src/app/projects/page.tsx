'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchProjects,
  fetchFilterOptions,
  fetchRERAProjects,
  fetchRERAFilterOptions,
  type ProjectTypeFilter,
} from '@/lib/queries';
import { ProjectList } from '@/components/projects/project-list';
import { RERAProjectList } from '@/components/projects/rera-project-list';
import { ProjectFilters } from '@/components/projects/project-filters';
import { RERAProjectFilters } from '@/components/projects/rera-project-filters';
import { PageLoader } from '@/components/common/loading-spinner';
import { Button } from '@/components/ui/button';
import type { ProjectViewType } from '@/lib/types';

export default function ProjectsPage() {
  const [viewType, setViewType] = useState<ProjectViewType>('rera');

  // Permits view filters
  const [permitFilters, setPermitFilters] = useState({
    search: '',
    status: '',
    area: '',
    buildingType: '',
  });
  const [permitPage, setPermitPage] = useState(1);
  const [debouncedPermitSearch, setDebouncedPermitSearch] = useState('');

  // RERA view filters
  const [reraFilters, setReraFilters] = useState({
    search: '',
    status: '',
    area: '',
    projectType: 'all' as ProjectTypeFilter,
  });
  const [reraPage, setReraPage] = useState(1);
  const [debouncedReraSearch, setDebouncedReraSearch] = useState('');

  // Debounce permit search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPermitSearch(permitFilters.search);
      setPermitPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [permitFilters.search]);

  // Debounce RERA search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReraSearch(reraFilters.search);
      setReraPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [reraFilters.search]);

  // Permit filter options
  const { data: permitFilterOptions, isLoading: permitFilterOptionsLoading } = useQuery({
    queryKey: ['permit-filter-options'],
    queryFn: fetchFilterOptions,
    enabled: viewType === 'permits',
  });

  // RERA filter options
  const { data: reraFilterOptions, isLoading: reraFilterOptionsLoading } = useQuery({
    queryKey: ['rera-filter-options'],
    queryFn: fetchRERAFilterOptions,
    enabled: viewType === 'rera',
  });

  // Permits data
  const { data: permitsData, isLoading: permitsLoading } = useQuery({
    queryKey: [
      'permits',
      permitPage,
      debouncedPermitSearch,
      permitFilters.status,
      permitFilters.area,
      permitFilters.buildingType,
    ],
    queryFn: () =>
      fetchProjects({
        page: permitPage,
        limit: 12,
        search: debouncedPermitSearch,
        status: permitFilters.status || undefined,
        area: permitFilters.area || undefined,
        building_type: permitFilters.buildingType || undefined,
      }),
    enabled: viewType === 'permits',
  });

  // RERA data
  const { data: reraData, isLoading: reraLoading } = useQuery({
    queryKey: [
      'rera-projects',
      reraPage,
      debouncedReraSearch,
      reraFilters.status,
      reraFilters.area,
      reraFilters.projectType,
    ],
    queryFn: () =>
      fetchRERAProjects({
        page: reraPage,
        limit: 12,
        search: debouncedReraSearch,
        status: reraFilters.status || undefined,
        area: reraFilters.area || undefined,
        projectType: reraFilters.projectType,
      }),
    enabled: viewType === 'rera',
  });

  const handlePermitFilterChange = (key: string, value: string) => {
    setPermitFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPermitPage(1);
    }
  };

  const handlePermitClearFilters = () => {
    setPermitFilters({
      search: '',
      status: '',
      area: '',
      buildingType: '',
    });
    setPermitPage(1);
  };

  const handleReraFilterChange = (key: string, value: string) => {
    setReraFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setReraPage(1);
    }
  };

  const handleReraClearFilters = () => {
    setReraFilters({
      search: '',
      status: '',
      area: '',
      projectType: 'all',
    });
    setReraPage(1);
  };

  const isLoading =
    (viewType === 'permits' && permitFilterOptionsLoading) ||
    (viewType === 'rera' && reraFilterOptionsLoading);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Projects</h1>
        <p className="mt-2 text-secondary-600">
          Browse developer projects and construction permits
        </p>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={viewType === 'rera' ? 'default' : 'outline'}
          onClick={() => setViewType('rera')}
        >
          Developer Projects
        </Button>
        <Button
          variant={viewType === 'permits' ? 'default' : 'outline'}
          onClick={() => setViewType('permits')}
        >
          Construction Projects
        </Button>
      </div>

      {/* RERA View */}
      {viewType === 'rera' && (
        <>
          <div className="mb-8">
            <RERAProjectFilters
              filters={reraFilters}
              onFilterChange={handleReraFilterChange}
              onClearFilters={handleReraClearFilters}
              filterOptions={{
                statuses: reraFilterOptions?.statuses || [],
                areas: reraFilterOptions?.areas || [],
                areasWithSynonyms: reraFilterOptions?.areasWithSynonyms || [],
              }}
            />
          </div>

          {reraData && (
            <p className="mb-4 text-sm text-secondary-500">
              Showing {reraData.data.length} of {reraData.count.toLocaleString()} projects
            </p>
          )}

          <RERAProjectList
            projects={reraData?.data || []}
            isLoading={reraLoading}
            currentPage={reraPage}
            totalPages={reraData?.totalPages || 1}
            onPageChange={setReraPage}
          />
        </>
      )}

      {/* Permits View */}
      {viewType === 'permits' && (
        <>
          <div className="mb-8">
            <ProjectFilters
              filters={permitFilters}
              onFilterChange={handlePermitFilterChange}
              onClearFilters={handlePermitClearFilters}
              filterOptions={{
                statuses: permitFilterOptions?.statuses || [],
                areas: permitFilterOptions?.areas || [],
                areasWithSynonyms: permitFilterOptions?.areasWithSynonyms || [],
                buildingTypes: permitFilterOptions?.buildingTypes || [],
              }}
            />
          </div>

          {permitsData && (
            <p className="mb-4 text-sm text-secondary-500">
              Showing {permitsData.data.length} of {permitsData.count.toLocaleString()} constructions
            </p>
          )}

          <ProjectList
            projects={permitsData?.data || []}
            isLoading={permitsLoading}
            currentPage={permitPage}
            totalPages={permitsData?.totalPages || 1}
            onPageChange={setPermitPage}
          />
        </>
      )}
    </div>
  );
}
