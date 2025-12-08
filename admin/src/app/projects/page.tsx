'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchProjects, formatDate } from '@/lib/queries';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', page],
    queryFn: () => fetchProjects({ page, limit: 20 }),
  });

  return (
    <div>
      <Header
        title="Projects"
        description="View and manage project records"
      />

      <div className="p-6">
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
                      <TableHead>Project No</TableHead>
                      <TableHead>Parcel ID</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          {project.project_no}
                        </TableCell>
                        <TableCell>{project.parcel_id}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {project.contractor_english || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {project.consultant_english || '-'}
                        </TableCell>
                        <TableCell>
                          {project.project_status_english ? (
                            <Badge variant="secondary">
                              {project.project_status_english}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(project.project_creation_date)}
                        </TableCell>
                      </TableRow>
                    ))}
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
