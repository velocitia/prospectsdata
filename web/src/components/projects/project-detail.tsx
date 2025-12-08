import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusColor } from '@/lib/queries';
import type { ProjectWithRelations } from '@/lib/types';
import {
  Calendar,
  Building2,
  MapPin,
  User,
  Briefcase,
  FileText,
} from 'lucide-react';

interface ProjectDetailProps {
  project: ProjectWithRelations;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const statusColor = getStatusColor(project.project_status_english);
  const contractor = project.contractor_projects?.[0];
  const consultant = project.consultant_projects?.[0];
  const land = project.land_registry?.[0];
  const building = project.buildings?.[0];

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-secondary-500">
            Project #{project.project_no}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-secondary-900 md:text-3xl">
            {project.related_entity_name_en || `Parcel ${project.parcel_id}`}
          </h1>
          {contractor?.community_name && (
            <p className="mt-2 flex items-center gap-2 text-secondary-600">
              <MapPin className="h-4 w-4" />
              {contractor.community_name}
            </p>
          )}
        </div>
        {project.project_status_english && (
          <Badge variant={badgeVariant} className="text-sm">
            {project.project_status_english}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Project No" value={project.project_no} />
            <InfoRow label="Parcel ID" value={project.parcel_id} />
            <InfoRow label="Applicant Type" value={project.applicanttype} />
            <InfoRow
              label="Creation Date"
              value={formatDate(project.project_creation_date)}
            />
            <InfoRow
              label="Permit Date"
              value={formatDate(project.permit_date)}
            />
            <InfoRow
              label="Work Start Date"
              value={formatDate(project.work_start_date)}
            />
            <InfoRow
              label="Expected Completion"
              value={formatDate(project.expected_completion_date)}
            />
            <InfoRow
              label="Completion Date"
              value={formatDate(project.project_completion_date)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Companies Involved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.contractor_english && (
              <div>
                <p className="text-sm font-medium text-secondary-500">
                  Contractor
                </p>
                <p className="text-secondary-900">{project.contractor_english}</p>
                {project.contractor_license_no && (
                  <p className="text-xs text-secondary-400">
                    License: {project.contractor_license_no}
                  </p>
                )}
              </div>
            )}
            {project.consultant_english && (
              <div>
                <p className="text-sm font-medium text-secondary-500">
                  Consultant
                </p>
                <p className="text-secondary-900">{project.consultant_english}</p>
                {project.consultant_license_no && (
                  <p className="text-xs text-secondary-400">
                    License: {project.consultant_license_no}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {contractor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Contractor Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Project Type" value={contractor.project_type} />
              <InfoRow label="Building Type" value={contractor.building_type} />
              <InfoRow label="Community" value={contractor.community_name} />
              <InfoRow label="Building Count" value={contractor.building_count} />
              <InfoRow label="Status" value={contractor.project_status} />
              <InfoRow
                label="First Permit Date"
                value={formatDate(contractor.first_building_permit_date)}
              />
            </CardContent>
          </Card>
        )}

        {land && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Land Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Area" value={land.area_name_en} />
              <InfoRow label="Land Number" value={land.land_number} />
              <InfoRow
                label="Actual Area"
                value={land.actual_area ? `${land.actual_area.toLocaleString()} sq ft` : null}
              />
              <InfoRow label="Property Type" value={land.property_type_en} />
              <InfoRow label="Property Sub Type" value={land.property_sub_type_en} />
              <InfoRow label="Land Type" value={land.land_type_en} />
              <InfoRow
                label="Freehold"
                value={land.is_free_hold ? 'Yes' : 'No'}
              />
            </CardContent>
          </Card>
        )}

        {building && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Building Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Building Number" value={building.building_number} />
              <InfoRow label="Project Name" value={building.project_name_en} />
              <InfoRow label="Master Project" value={building.master_project_en} />
              <InfoRow label="Floors" value={building.floors} />
              <InfoRow label="Flats" value={building.flats} />
              <InfoRow label="Shops" value={building.shops} />
              <InfoRow label="Offices" value={building.offices} />
              <InfoRow label="Car Parks" value={building.car_parks} />
              <InfoRow
                label="Built Up Area"
                value={
                  building.built_up_area
                    ? `${building.built_up_area.toLocaleString()} sq ft`
                    : null
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex justify-between border-b border-secondary-100 pb-2 last:border-0">
      <span className="text-sm text-secondary-500">{label}</span>
      <span className="text-sm font-medium text-secondary-900">
        {value ?? '-'}
      </span>
    </div>
  );
}
