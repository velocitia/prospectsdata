import Link from 'next/link';
import { MapPin, Calendar, Building2, Home, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusColor } from '@/lib/queries';
import type { RERAProject } from '@/lib/types';

// Project type helpers
function hasVillas(project: RERAProject): boolean {
  return (project.no_of_villas ?? 0) > 0;
}

function hasBuildings(project: RERAProject): boolean {
  return (project.no_of_buildings ?? 0) > 0;
}

interface RERAProjectCardProps {
  project: RERAProject;
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

// Get project name (translated English name)
function getProjectName(project: RERAProject): string | null {
  if (project.project_name && !isArabic(project.project_name)) {
    return project.project_name;
  }
  return null;
}

// Get location info (master project and area)
function getLocationInfo(project: RERAProject): { masterProject: string | null; area: string | null } {
  const masterProject = project.master_project_en && !isArabic(project.master_project_en) && isValidArea(project.master_project_en)
    ? project.master_project_en
    : null;

  const area = project.area_name_en && !isArabic(project.area_name_en) && isValidArea(project.area_name_en)
    ? project.area_name_en
    : null;

  // If both exist and are the same (case-insensitive), only return one
  if (masterProject && area && masterProject.toLowerCase() === area.toLowerCase()) {
    return { masterProject, area: null };
  }

  return { masterProject, area };
}

// Clean up developer name by removing common suffixes and standardizing
function cleanDeveloperName(name: string): string {
  return name
    .replace(/\s*-?\s*FZCO\.?$/i, '')
    .replace(/\s*-?\s*FZC\.?$/i, '')
    .replace(/\s*-?\s*FZE\.?$/i, '')
    .replace(/\s*-?\s*LLC\.?$/i, '')
    .replace(/\s*-?\s*L\.?L\.?C\.?$/i, '')
    .replace(/\s*-?\s*PJSC\.?$/i, '')
    .replace(/\s*-?\s*PVT\.?\s*LTD\.?$/i, '')
    .replace(/\s*-?\s*PRIVATE\s+LIMITED$/i, '')
    .replace(/\s*-?\s*LIMITED$/i, '')
    .replace(/\s*-?\s*LTD\.?$/i, '')
    .replace(/\s*-?\s*INC\.?$/i, '')
    .replace(/\s*-?\s*CORP\.?$/i, '')
    .replace(/\s*-?\s*CO\.?$/i, '')
    // Only replace "REAL ESTATE" when followed by DEVELOPMENT(S)/DEVELOPER(S)
    .replace(/REAL\s+ESTATE\s+DEVELOP(MENT|ER)S?/gi, 'Developments')
    .replace(/PROPERTIES\s+DEVELOP(MENT|ER)S?/gi, 'Developments')
    .replace(/PROPERTY\s+DEVELOP(MENT|ER)S?/gi, 'Developments')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get English-only developer name (cleaned)
function getDeveloperName(project: RERAProject): string | null {
  let name: string | null = null;

  // First try developer_name_en from joined developers table
  if (project.developer_name_en && !isArabic(project.developer_name_en)) {
    name = project.developer_name_en;
  }
  // Then try master_developer_name
  else if (project.master_developer_name && !isArabic(project.master_developer_name)) {
    name = project.master_developer_name;
  }
  // Finally try developer_name
  else if (project.developer_name && !isArabic(project.developer_name)) {
    name = project.developer_name;
  }

  if (name) {
    return cleanDeveloperName(name);
  }
  return null;
}

// Get project number for display
function getProjectNumber(project: RERAProject): string {
  if (project.project_number) {
    return `#${project.project_number}`;
  }
  return `#${project.project_id}`;
}

// Build main title: Use project_name if available, otherwise fall back to property counts
function getMainTitle(project: RERAProject): string {
  // First priority: translated project name
  const projectName = getProjectName(project);
  if (projectName) {
    return projectName;
  }

  // Fallback: build title from property counts and location
  const parts: string[] = [];

  // Order: villas, buildings, units
  if ((project.no_of_villas ?? 0) > 0) {
    parts.push(`${project.no_of_villas} Villas`);
  }
  if ((project.no_of_buildings ?? 0) > 0) {
    parts.push(`${project.no_of_buildings} Buildings`);
  }
  if ((project.no_of_units ?? 0) > 0) {
    parts.push(`${project.no_of_units} Units`);
  }

  const locationInfo = getLocationInfo(project);
  const location = locationInfo.masterProject || locationInfo.area;

  if (parts.length > 0 && location) {
    return `${parts.join(' + ')} in ${location}`;
  } else if (parts.length > 0) {
    return parts.join(' + ');
  } else if (location) {
    return location;
  }

  return `Project ${project.project_id}`;
}

export function RERAProjectCard({ project }: RERAProjectCardProps) {
  const statusColor = getStatusColor(project.project_status);
  const locationInfo = getLocationInfo(project);

  const statusBadgeVariant =
    statusColor === 'green'
      ? 'success'
      : statusColor === 'blue'
      ? 'info'
      : statusColor === 'yellow'
      ? 'warning'
      : statusColor === 'red'
      ? 'destructive'
      : 'secondary';

  const developerName = getDeveloperName(project);

  return (
    <Link href={`/projects/rera/${project.project_id}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              {/* Line 1: Project number (small gray) */}
              <p className="text-sm text-secondary-500">
                {getProjectNumber(project)}
              </p>
              {/* Line 2: Main title - project name or "<Property Count> in <Location>" (bold) */}
              <h3 className="mt-1 font-semibold text-secondary-900 line-clamp-2">
                {getMainTitle(project)}
              </h3>
            </div>
            {/* Type badges + Status badge */}
            <div className="flex flex-wrap gap-1 shrink-0 justify-end">
              {hasVillas(project) && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Villa/Townhouse
                </Badge>
              )}
              {hasBuildings(project) && (
                <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
                  Building
                </Badge>
              )}
              {project.project_status && (
                <Badge variant={statusBadgeVariant}>
                  {project.project_status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Developer name: "By Developer" */}
          {developerName && (
            <p className="text-sm text-secondary-500">
              By {developerName}
            </p>
          )}

          {/* Location: master_project_en (line 1), area_name_en (line 2) - hide duplicates */}
          {(locationInfo.masterProject || locationInfo.area) && (
            <div className="flex items-start gap-2 text-sm text-secondary-600">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                {locationInfo.masterProject && (
                  <span className="line-clamp-1">{locationInfo.masterProject}</span>
                )}
                {locationInfo.area && (
                  <span className="line-clamp-1 text-secondary-400">{locationInfo.area}</span>
                )}
              </div>
            </div>
          )}

          {/* Property counts with icons - order: villas, buildings, units */}
          {((project.no_of_villas ?? 0) > 0 || (project.no_of_buildings ?? 0) > 0 || (project.no_of_units ?? 0) > 0) && (
            <div className="flex items-center gap-4 text-sm text-secondary-600">
              {(project.no_of_villas ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4 shrink-0" />
                  <span>{project.no_of_villas} villas</span>
                </div>
              )}
              {(project.no_of_buildings ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{project.no_of_buildings} buildings</span>
                </div>
              )}
              {(project.no_of_units ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{project.no_of_units} units</span>
                </div>
              )}
            </div>
          )}

          {/* Date (Scheduled for future, Started for past) */}
          {project.project_start_date && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {new Date(project.project_start_date) > new Date()
                  ? `Scheduled ${formatDate(project.project_start_date)}`
                  : `Started ${formatDate(project.project_start_date)}`}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {typeof project.percent_completed === 'number' && project.percent_completed > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-secondary-500 mb-1">
                <span>Progress</span>
                <span>{project.percent_completed}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary-200">
                <div
                  className="h-2 rounded-full bg-primary-600"
                  style={{ width: `${Math.min(project.percent_completed, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
