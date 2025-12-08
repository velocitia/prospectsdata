import Link from 'next/link';
import { MapPin, Calendar, Briefcase, HardHat, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusColor, formatStatus } from '@/lib/queries';
import type { ProjectInfo } from '@/lib/types';

interface ProjectCardProps {
  project: ProjectInfo & {
    area_name?: string | null;
    project_type?: string | null;
    building_type?: string | null;
    developer_name?: string | null;
  };
}

// Check if text contains Arabic characters
function isArabic(text: string | null | undefined): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

// Check if area name is valid (not "000" or similar invalid values)
function isValidArea(text: string | null | undefined): boolean {
  if (!text) return false;
  if (text === '000' || text === '00' || text === '0') return false;
  return true;
}

// Get English-only text
function getEnglishText(text: string | null | undefined): string | null {
  if (!text) return null;
  if (isArabic(text)) return null;
  return text;
}

// Check if text is "Others" (case-insensitive)
function isOthers(text: string | null | undefined): boolean {
  if (!text) return false;
  return text.toLowerCase() === 'others';
}

// Build main title: "<Project Type> for <Building Type>"
// If result is "Others" or no title, use "Project in <Location>" format
function getMainTitle(project: ProjectCardProps['project']): string {
  const projectType = getEnglishText(project.project_type);
  const buildingType = getEnglishText(project.building_type);
  const areaName = getEnglishText(project.area_name);

  let title: string | null = null;

  if (projectType && buildingType) {
    title = `${projectType} for ${buildingType}`;
  } else if (buildingType) {
    title = buildingType;
  } else if (projectType) {
    title = projectType;
  }

  // If title is "Others" or no title, use location format
  if (!title || isOthers(title)) {
    if (areaName) {
      return `Project in ${areaName}`;
    }
    return 'Project';
  }

  return title;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = getStatusColor(project.project_status_english);
  const areaName = project.area_name;

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

  const contractorName = getEnglishText(project.contractor_english);
  const consultantName = getEnglishText(project.consultant_english);
  const developerName = getEnglishText(project.developer_name);

  return (
    <Link href={`/projects/${project.parcel_id}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              {/* Line 1: Project No (small gray) */}
              <p className="text-sm text-secondary-500">
                Project #{project.project_no}
              </p>
              {/* Line 2: Main title - "<Project Type> for <Building Type>" (bold) */}
              <h3 className="mt-1 font-semibold text-secondary-900 line-clamp-2">
                {getMainTitle(project)}
              </h3>
            </div>
            {/* Line 3: Status badge */}
            {project.project_status_english && formatStatus(project.project_status_english) && (
              <Badge variant={badgeVariant} className="shrink-0">
                {formatStatus(project.project_status_english)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Line 4: Area with MapPin (exclude "000") */}
          {areaName && !isArabic(areaName) && isValidArea(areaName) && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{areaName}</span>
            </div>
          )}

          {/* Line 5: Consultant */}
          {consultantName && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <Briefcase className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{consultantName}</span>
            </div>
          )}

          {/* Line 6: Contractor (if there is) */}
          {contractorName && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <HardHat className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{contractorName}</span>
            </div>
          )}

          {/* Line 7: Developer (if there is) */}
          {developerName && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{developerName}</span>
            </div>
          )}

          {/* Line 8: Date */}
          {project.project_creation_date && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {new Date(project.project_creation_date) > new Date()
                  ? `Scheduled ${formatDate(project.project_creation_date)}`
                  : `Created ${formatDate(project.project_creation_date)}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
