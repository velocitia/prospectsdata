'use client';

import { CompanyCard } from './company-card';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { Company } from '@/lib/types';

interface CompanyListProps {
  companies: Company[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CompanyList({
  companies,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}: CompanyListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CompanyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies found"
        description="Try adjusting your filters or search query to find what you're looking for."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

function CompanyCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
