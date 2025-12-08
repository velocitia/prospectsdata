'use client';

import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchWithSuggestions } from '@/components/common/search-with-suggestions';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ProjectFiltersProps {
  filters: {
    search: string;
    status: string;
    area: string;
    buildingType: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  filterOptions: {
    statuses: string[];
    areas: string[];
    areasWithSynonyms?: { value: string; label: string; synonyms: string[] }[];
    buildingTypes: string[];
  };
}

export function ProjectFilters({
  filters,
  onFilterChange,
  onClearFilters,
  filterOptions,
}: ProjectFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.status || filters.area || filters.buildingType;

  // Build area options with synonyms for searchable select
  const areaOptions = [
    { value: '', label: 'All Areas', synonyms: [] as string[] },
    ...(filterOptions.areasWithSynonyms || filterOptions.areas.map((a) => ({ value: a, label: a, synonyms: [] as string[] }))),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SearchWithSuggestions
          value={filters.search}
          onChange={(value) => onFilterChange('search', value)}
          placeholder="Search projects, location..."
          entityTypes={['project', 'area', 'company']}
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

        <Select
          value={filters.buildingType}
          onChange={(e) => onFilterChange('buildingType', e.target.value)}
          options={[
            { value: '', label: 'All Building Types' },
            ...filterOptions.buildingTypes.map((b) => ({ value: b, label: b })),
          ]}
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
