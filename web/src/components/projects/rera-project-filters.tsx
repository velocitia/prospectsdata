'use client';

import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchWithSuggestions } from '@/components/common/search-with-suggestions';
import { Button } from '@/components/ui/button';
import { X, Home, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectTypeFilter } from '@/lib/queries';

interface RERAProjectFiltersProps {
  filters: {
    search: string;
    status: string;
    area: string;
    projectType: ProjectTypeFilter;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  filterOptions: {
    statuses: string[];
    areas: string[];
    areasWithSynonyms?: { value: string; label: string; synonyms: string[] }[];
  };
}

export function RERAProjectFilters({
  filters,
  onFilterChange,
  onClearFilters,
  filterOptions,
}: RERAProjectFiltersProps) {
  const hasActiveFilters = filters.search || filters.status || filters.area || filters.projectType !== 'all';

  // Build area options with synonyms for searchable select
  const areaOptions = [
    { value: '', label: 'All Areas', synonyms: [] as string[] },
    ...(filterOptions.areasWithSynonyms || filterOptions.areas.map((a) => ({ value: a, label: a, synonyms: [] as string[] }))),
  ];

  return (
    <div className="space-y-4">
      {/* Project Type Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('projectType', 'all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filters.projectType === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
          )}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange('projectType', 'villas')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            filters.projectType === 'villas'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          )}
        >
          <Home className="h-4 w-4" />
          Villas/Townhouses
        </button>
        <button
          onClick={() => onFilterChange('projectType', 'buildings')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            filters.projectType === 'buildings'
              ? 'bg-teal-500 text-white'
              : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
          )}
        >
          <Building2 className="h-4 w-4" />
          Buildings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SearchWithSuggestions
          value={filters.search}
          onChange={(value) => onFilterChange('search', value)}
          placeholder="Search by developer, project name, location..."
          entityTypes={['project', 'area', 'company']}
          entitySubtypes={['rera', 'developer']}
          navigateOnSelect={true}
        />

        <Select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          options={[
            { value: '', label: 'All' },
            ...filterOptions.statuses.map((s) => ({ value: s, label: s })),
          ]}
        />

        <SearchableSelect
          value={filters.area}
          onChange={(value) => onFilterChange('area', value)}
          options={areaOptions}
          placeholder="All Areas"
          searchPlaceholder="Search areas..."
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-secondary-500"
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
