import Link from 'next/link';
import { Building, HardHat, Briefcase, FolderOpen, Clock, MapPin, Phone, Mail, Globe, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Company, CompanyType } from '@/lib/types';

interface CompanyCardProps {
  company: Company;
}

const companyTypeConfig: Record<
  CompanyType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  developer: {
    label: 'Developer',
    icon: <Building className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800',
  },
  contractor: {
    label: 'Contractor',
    icon: <HardHat className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800',
  },
  consultant: {
    label: 'Consultant',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800',
  },
};

function formatLastActive(dateStr: string | null): { text: string; days: number } {
  if (!dateStr) return { text: 'No activity', days: Infinity };

  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Handle future dates (expected completion dates)
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays);
    if (futureDays === 1) return { text: 'Expected tomorrow', days: diffDays };
    if (futureDays < 30) return { text: `Expected in ${futureDays} ${futureDays === 1 ? 'day' : 'days'}`, days: diffDays };
    const futureMonths = Math.floor(futureDays / 30);
    if (futureDays < 365) return { text: `Expected in ${futureMonths} ${futureMonths === 1 ? 'month' : 'months'}`, days: diffDays };
    const futureYears = Math.floor(futureDays / 365);
    return { text: `Expected in ${futureYears} ${futureYears === 1 ? 'year' : 'years'}`, days: diffDays };
  }

  if (diffDays === 0) return { text: 'Active today', days: 0 };
  if (diffDays === 1) return { text: 'Active yesterday', days: 1 };
  if (diffDays < 7) return { text: `Active ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`, days: diffDays };
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return { text: `Active ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`, days: diffDays };
  const months = Math.floor(diffDays / 30);
  if (diffDays < 365) return { text: `Active ${months} ${months === 1 ? 'month' : 'months'} ago`, days: diffDays };
  const years = Math.floor(diffDays / 365);
  return { text: `Active ${years} ${years === 1 ? 'year' : 'years'} ago`, days: diffDays };
}

// Check if company has contact info
function hasContactInfo(company: Company): boolean {
  return !!(company.phone || company.email || company.website);
}

export function CompanyCard({ company }: CompanyCardProps) {
  const config = companyTypeConfig[company.type];
  const lastActive = formatLastActive(company.last_active_date);
  // Green for recent activity (last 30 days) or future dates
  const isRecentlyActive = lastActive.days < 30;

  return (
    <Link href={`/companies/${company.type}/${company.license_no}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${config.color}`}>
                {config.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-secondary-900 line-clamp-1">
                    {company.name}
                  </h3>
                  {company.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-secondary-500">
                  License: {company.license_no}
                  {company.established_year && (
                    <span className="ml-2 text-secondary-400">
                      Est. {company.established_year}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={config.color}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Project count and employees */}
          <div className="flex items-center gap-4 text-sm text-secondary-600">
            <div className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              <span>{company.project_count} projects</span>
            </div>
            {company.employees_range && (
              <span className="text-secondary-400">
                {company.employees_range} employees
              </span>
            )}
          </div>

          {/* Specializations */}
          {company.specializations && company.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {company.specializations.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs py-0">
                  {spec}
                </Badge>
              ))}
              {company.specializations.length > 3 && (
                <Badge variant="outline" className="text-xs py-0 text-secondary-400">
                  +{company.specializations.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Contact indicators */}
          {hasContactInfo(company) && (
            <div className="flex items-center gap-3 text-sm text-secondary-500">
              {company.phone && (
                <div className="flex items-center gap-1" title={company.phone}>
                  <Phone className="h-3.5 w-3.5" />
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-1" title={company.email}>
                  <Mail className="h-3.5 w-3.5" />
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-1" title={company.website}>
                  <Globe className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          )}

          {/* Location */}
          {(company.active_area || company.emirate) && (
            <div className="flex items-center gap-1 text-sm text-secondary-500">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">
                {company.active_area || company.emirate}
              </span>
            </div>
          )}

          {/* Last active - always at bottom */}
          <div className={`flex items-center gap-1 text-sm ${isRecentlyActive ? 'text-green-600' : 'text-secondary-500'}`}>
            <Clock className="h-4 w-4" />
            <span>{lastActive.text}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
