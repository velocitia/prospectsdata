'use client';

import { Select } from '@/components/ui/select';
import { SearchBar } from '@/components/common/search-bar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { CompanyType } from '@/lib/types';

interface CompanyFiltersProps {
  filters: {
    search: string;
    type: CompanyType | 'all';
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function CompanyFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: CompanyFiltersProps) {
  const hasActiveFilters = filters.search || filters.type !== 'all';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SearchBar
          value={filters.search}
          onChange={(value) => onFilterChange('search', value)}
          placeholder="Search companies..."
        />

        <Select
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
          options={[
            { value: 'all', label: 'All Company Types' },
            { value: 'developer', label: 'Developers' },
            { value: 'contractor', label: 'Contractors' },
            { value: 'consultant', label: 'Consultants' },
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
