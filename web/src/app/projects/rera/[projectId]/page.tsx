'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Home,
  Users,
  FileText,
  Briefcase,
  HardHat,
} from 'lucide-react';
import { fetchRERAProjectById, formatDate, getStatusColor } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/loading-spinner';

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

// Get project title - prioritize project_name
function getProjectTitle(project: any): string {
  // First priority: translated project name
  if (project.project_name && !isArabic(project.project_name)) {
    return project.project_name;
  }
  // Fallbacks
  if (project.master_project_en && !isArabic(project.master_project_en)) {
    return project.master_project_en;
  }
  if (project.project_description_en && !isArabic(project.project_description_en)) {
    return project.project_description_en;
  }
  if (project.area_name_en && !isArabic(project.area_name_en)) {
    return `${project.area_name_en} Project`;
  }
  return `Project ${project.project_id}`;
}

export default function RERAProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.projectId);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['rera-project', projectId],
    queryFn: () => fetchRERAProjectById(projectId),
    enabled: !isNaN(projectId),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !project) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Project Not Found</h1>
          <p className="mt-2 text-secondary-600">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="container-custom py-8">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-secondary-500">
              {getEnglishText(project.developer_name_en) || getEnglishText(project.master_developer_name) || getEnglishText(project.developer_name) || 'Developer'}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-secondary-900">
              {getProjectTitle(project)}
            </h1>
            {getEnglishText(project.area_name_en) && (
              <div className="mt-2 flex items-center gap-2 text-secondary-600">
                <MapPin className="h-4 w-4" />
                <span>{project.area_name_en}</span>
              </div>
            )}
          </div>
          {project.project_status && (
            <Badge variant={badgeVariant} className="text-sm">
              {project.project_status}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {project.percent_completed !== null && project.percent_completed !== undefined && project.percent_completed > 0 && (
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-sm text-secondary-500 mb-1">
              <span>Completion Progress</span>
              <span>{project.percent_completed}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary-200">
              <div
                className="h-3 rounded-full bg-primary-600"
                style={{ width: `${Math.min(project.percent_completed, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-secondary-500">Project ID</dt>
                  <dd className="font-medium">{project.project_id}</dd>
                </div>
                {project.project_number && (
                  <div>
                    <dt className="text-sm text-secondary-500">Project Number</dt>
                    <dd className="font-medium">{project.project_number}</dd>
                  </div>
                )}
                {getEnglishText(project.master_developer_name) && (
                  <div>
                    <dt className="text-sm text-secondary-500">Master Developer</dt>
                    <dd className="font-medium">{project.master_developer_name}</dd>
                  </div>
                )}
                {getEnglishText(project.zoning_authority_en) && (
                  <div>
                    <dt className="text-sm text-secondary-500">Zoning Authority</dt>
                    <dd className="font-medium">{project.zoning_authority_en}</dd>
                  </div>
                )}
                {getEnglishText(project.escrow_agent_name) && (
                  <div className="col-span-2">
                    <dt className="text-sm text-secondary-500">Escrow Agent</dt>
                    <dd className="font-medium">{project.escrow_agent_name}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Units & Buildings - only show if there are any non-zero values */}
          {(project.no_of_villas > 0 || project.no_of_units > 0 || project.no_of_buildings > 0 || project.no_of_lands > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Units & Buildings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {project.no_of_villas > 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-secondary-50 p-4">
                      <Home className="h-8 w-8 text-primary-600" />
                      <div>
                        <p className="text-2xl font-bold">{project.no_of_villas}</p>
                        <p className="text-sm text-secondary-500">Villas</p>
                      </div>
                    </div>
                  )}
                  {project.no_of_units > 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-secondary-50 p-4">
                      <Users className="h-8 w-8 text-primary-600" />
                      <div>
                        <p className="text-2xl font-bold">{project.no_of_units}</p>
                        <p className="text-sm text-secondary-500">Units</p>
                      </div>
                    </div>
                  )}
                  {project.no_of_buildings > 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-secondary-50 p-4">
                      <Building2 className="h-8 w-8 text-primary-600" />
                      <div>
                        <p className="text-2xl font-bold">{project.no_of_buildings}</p>
                        <p className="text-sm text-secondary-500">Buildings</p>
                      </div>
                    </div>
                  )}
                  {project.no_of_lands > 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-secondary-50 p-4">
                      <MapPin className="h-8 w-8 text-primary-600" />
                      <div>
                        <p className="text-2xl font-bold">{project.no_of_lands}</p>
                        <p className="text-sm text-secondary-500">Lands</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultants & Contractors */}
          {(() => {
            const englishConsultants = project.unique_consultants?.filter((c: string) => !isArabic(c)) || [];
            const englishContractors = project.unique_contractors?.filter((c: string) => !isArabic(c)) || [];
            if (englishConsultants.length === 0 && englishContractors.length === 0) return null;
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Consultants & Contractors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {englishConsultants.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                        <Briefcase className="h-4 w-4" />
                        Consultants ({englishConsultants.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {englishConsultants.map((consultant: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {consultant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {englishContractors.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                        <HardHat className="h-4 w-4" />
                        Contractors ({englishContractors.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {englishContractors.map((contractor: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {contractor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Permits List */}
          {project.permits?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Construction Permits ({project.permit_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {project.permits.slice(0, 20).map((permit: any) => (
                    <Link
                      key={permit.id}
                      href={`/projects/${permit.parcel_id}`}
                      className="block rounded-lg border p-3 hover:bg-secondary-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Permit #{permit.project_no}</p>
                          <p className="text-sm text-secondary-500">
                            Parcel: {permit.parcel_id}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {permit.project_status_english || 'Unknown'}
                        </Badge>
                      </div>
                      {(() => {
                        const consultant = getEnglishText(permit.consultant_english);
                        const contractor = getEnglishText(permit.contractor_english);
                        if (!consultant && !contractor) return null;
                        return (
                          <div className="mt-2 text-sm text-secondary-600">
                            {consultant && <span>Consultant: {consultant}</span>}
                            {consultant && contractor && ' | '}
                            {contractor && <span>Contractor: {contractor}</span>}
                          </div>
                        );
                      })()}
                    </Link>
                  ))}
                  {project.permits.length > 20 && (
                    <p className="text-center text-sm text-secondary-500 pt-2">
                      Showing 20 of {project.permits.length} permits
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.project_start_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-500">Start Date</p>
                    <p className="font-medium">{formatDate(project.project_start_date)}</p>
                  </div>
                </div>
              )}
              {project.project_end_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-500">End Date</p>
                    <p className="font-medium">{formatDate(project.project_end_date)}</p>
                  </div>
                </div>
              )}
              {project.completion_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-secondary-500">Completion Date</p>
                    <p className="font-medium">{formatDate(project.completion_date)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Parcels</span>
                <span className="font-semibold">{project.parcel_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Permits</span>
                <span className="font-semibold">{project.permit_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Consultants</span>
                <span className="font-semibold">{project.unique_consultants?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Contractors</span>
                <span className="font-semibold">{project.unique_contractors?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
