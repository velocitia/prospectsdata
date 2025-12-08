'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { fetchCompanies, fetchCompanyAreas, type SearchSuggestion } from '@/lib/queries';
import type { CompanyType, CompanySortBy, DateRangeFilter, ActivityFilter } from '@/lib/types';
import { CompanyList } from '@/components/companies/company-list';
import { SearchWithSuggestions } from '@/components/common/search-with-suggestions';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type TabType = 'all' | CompanyType;

const tabs: { value: TabType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'developer', label: 'Developers' },
  { value: 'consultant', label: 'Consultants' },
  { value: 'contractor', label: 'Contractors' },
];

const sortOptions: { value: CompanySortBy; label: string }[] = [
  { value: 'recent_active', label: 'Recently Active' },
  { value: 'highest_projects', label: 'Most Projects' },
  { value: 'name_asc', label: 'Name (A-Z)' },
];

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'last_year', label: 'Last Year' },
];

const activityOptions: { value: ActivityFilter; label: string }[] = [
  { value: 'active_only', label: 'With Activity' },
  { value: 'all', label: 'All Companies' },
  { value: 'no_activity_only', label: 'No Activity' },
];

export default function CompaniesPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as CompanyType | null;

  const [activeTab, setActiveTab] = useState<TabType>(typeParam || 'all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CompanySortBy>('recent_active');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('active_only');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (typeParam) {
      setActiveTab(typeParam);
    }
  }, [typeParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch areas for filter dropdown
  const { data: areasData } = useQuery({
    queryKey: ['company-areas'],
    queryFn: fetchCompanyAreas,
  });

  // When searching, search all companies (ignore activity filter)
  const effectiveActivityFilter = debouncedSearch ? 'all' : activityFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['companies', currentPage, debouncedSearch, activeTab, sortBy, dateRange, selectedArea, effectiveActivityFilter],
    queryFn: () =>
      fetchCompanies({
        page: currentPage,
        limit: 12,
        search: debouncedSearch,
        type: activeTab,
        sortBy,
        dateRange: debouncedSearch ? 'all' : dateRange, // Also ignore date range when searching
        area: selectedArea || undefined,
        activityFilter: effectiveActivityFilter,
      }),
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const hasActiveFilters = dateRange !== 'all' || selectedArea !== '' || activityFilter !== 'active_only';

  const clearFilters = () => {
    setDateRange('all');
    setSelectedArea('');
    setActivityFilter('active_only');
    setCurrentPage(1);
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Companies</h1>
        <p className="mt-2 text-secondary-600">
          Browse developers, contractors, and consultants
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-secondary-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant="ghost"
              onClick={() => handleTabChange(tab.value)}
              className={`rounded-b-none border-b-2 px-4 py-2 ${
                activeTab === tab.value
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-6 space-y-4">
        {/* Search and Sort */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <SearchWithSuggestions
              value={search}
              onChange={setSearch}
              onSelect={(suggestion: SearchSuggestion) => {
                // When selecting from suggestions, navigate to that company
                // The component handles navigation automatically
              }}
              placeholder="Search companies..."
              entityTypes={['company']}
              entitySubtypes={activeTab !== 'all' ? [activeTab] : undefined}
              navigateOnSelect={true}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-500">Sort by:</span>
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as CompanySortBy);
                setCurrentPage(1);
              }}
              options={sortOptions}
              className="w-44"
            />
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-500">Show:</span>
            <Select
              value={activityFilter}
              onChange={(e) => {
                setActivityFilter(e.target.value as ActivityFilter);
                setCurrentPage(1);
              }}
              options={activityOptions}
              className="w-36"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-500">Active:</span>
            <Select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as DateRangeFilter);
                setCurrentPage(1);
              }}
              options={dateRangeOptions}
              className="w-36"
            />
          </div>

          {areasData && areasData.areasWithSynonyms.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-500">Area:</span>
              <SearchableSelect
                value={selectedArea}
                onChange={(value) => {
                  setSelectedArea(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All', synonyms: [] },
                  ...areasData.areasWithSynonyms,
                ]}
                placeholder="All"
                searchPlaceholder="Search areas..."
                className="w-64"
              />
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-secondary-500"
            >
              <X className="mr-1 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {data && (
        <p className="mb-4 text-sm text-secondary-500">
          Showing {data.data.length} of {data.count.toLocaleString()} companies
        </p>
      )}

      <CompanyList
        companies={data?.data || []}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={data?.totalPages || 1}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
