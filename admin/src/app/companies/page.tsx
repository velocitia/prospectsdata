'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchCompanies, type CompanyType } from '@/lib/queries';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<CompanyType | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', page, type],
    queryFn: () => fetchCompanies({ page, limit: 20, type }),
  });

  const getTypeBadge = (companyType: CompanyType) => {
    const config: Record<CompanyType, { label: string; color: string }> = {
      developer: { label: 'Developer', color: 'bg-purple-100 text-purple-800' },
      contractor: { label: 'Contractor', color: 'bg-orange-100 text-orange-800' },
      consultant: { label: 'Consultant', color: 'bg-blue-100 text-blue-800' },
    };
    return config[companyType];
  };

  return (
    <div>
      <Header
        title="Companies"
        description="View developers, contractors, and consultants"
      />

      <div className="p-6">
        <div className="mb-6">
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as CompanyType | 'all');
              setPage(1);
            }}
            className="w-48"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'developer', label: 'Developers' },
              { value: 'contractor', label: 'Contractors' },
              { value: 'consultant', label: 'Consultants' },
            ]}
          />
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
                      <TableHead>License No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Projects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((company) => {
                      const badge = getTypeBadge(company.type);
                      return (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">
                            {company.license_no}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {company.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={badge.color}>
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{company.project_count}</TableCell>
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
