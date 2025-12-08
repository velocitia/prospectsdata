'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchRERAProjects, formatDate } from '@/lib/queries';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';

// Check if text contains Arabic characters
function isArabic(text: string | null | undefined): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

// Get English-only text
function getEnglishText(text: string | null | undefined): string | null {
  if (!text || isArabic(text)) return null;
  return text;
}

function getStatusColor(status: string | null): 'green' | 'blue' | 'yellow' | 'red' | 'gray' {
  if (!status) return 'gray';
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('finished')) return 'green';
  if (s.includes('progress') || s.includes('construction')) return 'blue';
  if (s.includes('hold') || s.includes('pending')) return 'yellow';
  if (s.includes('cancel') || s.includes('stop')) return 'red';
  return 'gray';
}

export default function RERAProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rera-projects', page, debouncedSearch],
    queryFn: () => fetchRERAProjects({ page, limit: 20, search: debouncedSearch }),
  });

  return (
    <div>
      <Header
        title="RERA Projects"
        description="View and manage developer projects from RERA"
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="Search by name, ID, developer, area..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project ID</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((project: any) => {
                      const statusColor = getStatusColor(project.project_status);
                      const badgeVariant =
                        statusColor === 'green'
                          ? 'success'
                          : statusColor === 'blue'
                          ? 'info'
                          : statusColor === 'yellow'
                          ? 'warning'
                          : statusColor === 'red'
                          ? 'destructive'
                          : 'secondary';

                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.project_id}
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="truncate font-medium">
                              {getEnglishText(project.project_name) || '-'}
                            </div>
                            {getEnglishText(project.master_project_en) && (
                              <div className="truncate text-xs text-secondary-500">
                                {project.master_project_en}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {getEnglishText(project.developer_name_en) ||
                              getEnglishText(project.developer_name) ||
                              '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {getEnglishText(project.area_name_en) || '-'}
                          </TableCell>
                          <TableCell>
                            {project.project_status ? (
                              <Badge variant={badgeVariant}>
                                {project.project_status}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {project.percent_completed !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 rounded-full bg-secondary-200">
                                  <div
                                    className="h-2 rounded-full bg-primary-600"
                                    style={{
                                      width: `${Math.min(project.percent_completed, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-secondary-600">
                                  {project.percent_completed}%
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-secondary-600">
                    Page {page} of {data?.totalPages || 1} ({data?.count.toLocaleString()} total records)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= (data?.totalPages || 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
