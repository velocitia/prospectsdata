'use client';

import { RERAProjectCard } from './rera-project-card';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { RERAProject } from '@/lib/types';

interface RERAProjectListProps {
  projects: RERAProject[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function RERAProjectList({
  projects,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}: RERAProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RERAProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects found"
        description="Try adjusting your filters or search query to find what you're looking for."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <RERAProjectCard key={project.project_id} project={project} />
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

function RERAProjectCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}
