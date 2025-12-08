'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Calendar, FileText, Briefcase, HardHat, ExternalLink, Users } from 'lucide-react';
import { fetchPermitsByParcelId, formatDate, getStatusColor } from '@/lib/queries';
import { PageLoader } from '@/components/common/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';

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

// Build main title: "<Project Type> for <Building Type>"
function getMainTitle(
  projectType: string | null | undefined,
  buildingType: string | null | undefined,
  parcelId: number
): string {
  const pType = getEnglishText(projectType);
  const bType = getEnglishText(buildingType);

  if (pType && bType) {
    return `${pType} for ${bType}`;
  } else if (bType) {
    return bType;
  } else if (pType) {
    return pType;
  }

  return `Parcel ${parcelId}`;
}

// Company info type
interface CompanyInfo {
  name: string;
  licenseNo: number | null;
  type: 'contractor' | 'consultant' | 'developer';
  isActive: boolean;
  permitNo?: string;
  permitDate?: string;
}

export default function ParcelDetailPage() {
  const params = useParams();
  const parcelId = Number(params.parcelId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['parcel-permits', parcelId],
    queryFn: () => fetchPermitsByParcelId(parcelId),
    enabled: !isNaN(parcelId),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <div className="container-custom py-8">
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        <EmptyState
          title="Parcel not found"
          description="The parcel you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  const { parcel_id, area_name, land_registry, rera_project, permits, permit_count } = data;

  // Get the latest permit for title
  const latestPermit = permits[0];
  const mainTitle = latestPermit
    ? getMainTitle(latestPermit.project_type, latestPermit.building_type, parcel_id)
    : `Parcel ${parcel_id}`;

  // Extract companies from all permits and categorize as active/past
  const extractCompanies = () => {
    const contractors: CompanyInfo[] = [];
    const consultants: CompanyInfo[] = [];
    const seenContractors = new Set<string>();
    const seenConsultants = new Set<string>();

    permits.forEach((permit: any, index: number) => {
      const isActive = index === 0; // Latest permit is active

      // Contractor
      const contractorName = getEnglishText(permit.contractor_english);
      if (contractorName && !seenContractors.has(contractorName)) {
        seenContractors.add(contractorName);
        contractors.push({
          name: contractorName,
          licenseNo: permit.contractor_license_no,
          type: 'contractor',
          isActive,
          permitNo: permit.project_no,
          permitDate: permit.project_creation_date,
        });
      }

      // Consultant
      const consultantName = getEnglishText(permit.consultant_english);
      if (consultantName && !seenConsultants.has(consultantName)) {
        seenConsultants.add(consultantName);
        consultants.push({
          name: consultantName,
          licenseNo: permit.consultant_license_no,
          type: 'consultant',
          isActive,
          permitNo: permit.project_no,
          permitDate: permit.project_creation_date,
        });
      }
    });

    return { contractors, consultants };
  };

  const { contractors, consultants } = extractCompanies();
  const activeContractors = contractors.filter((c) => c.isActive);
  const pastContractors = contractors.filter((c) => !c.isActive);
  const activeConsultants = consultants.filter((c) => c.isActive);
  const pastConsultants = consultants.filter((c) => !c.isActive);

  // Developer from RERA project
  const developerName = rera_project ? getEnglishText(rera_project.developer_name) : null;
  const developerId = rera_project?.developer_id;

  return (
    <div className="container-custom py-8">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header - Same title as card */}
      <div className="mb-8">
        <p className="text-sm text-secondary-500">
          Project #{latestPermit?.project_no || parcel_id}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-secondary-900">{mainTitle}</h1>
        {getEnglishText(area_name) && (
          <div className="mt-2 flex items-center gap-2 text-secondary-600">
            <MapPin className="h-4 w-4" />
            <span>{area_name}</span>
          </div>
        )}
        {latestPermit?.project_status_english && (
          <div className="mt-3">
            <Badge
              variant={
                getStatusColor(latestPermit.project_status_english) === 'green'
                  ? 'success'
                  : getStatusColor(latestPermit.project_status_english) === 'blue'
                  ? 'info'
                  : getStatusColor(latestPermit.project_status_english) === 'yellow'
                  ? 'warning'
                  : getStatusColor(latestPermit.project_status_english) === 'red'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {latestPermit.project_status_english}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Developer Project Link */}
          {rera_project && (
            <Card className="border-primary-200 bg-primary-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-900">
                  <Building2 className="h-5 w-5" />
                  Part of Developer Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">
                      {getEnglishText(rera_project.master_project_en) || getEnglishText(rera_project.project_description_en) || `Project ${rera_project.project_id}`}
                    </p>
                    {developerName && developerId ? (
                      <Link
                        href={`/companies/developer/${developerId}`}
                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {developerName}
                      </Link>
                    ) : (
                      <p className="text-sm text-secondary-600">
                        {getEnglishText(rera_project.developer_name) || 'Developer'}
                      </p>
                    )}
                  </div>
                  <Link href={`/projects/rera/${rera_project.project_id}`}>
                    <Button variant="outline" size="sm">
                      View Project
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Companies Involved */}
          {(contractors.length > 0 || consultants.length > 0 || developerName) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Companies Involved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Developer */}
                {developerName && (
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Developer
                    </h4>
                    <div className="pl-6">
                      {developerId ? (
                        <Link
                          href={`/companies/developer/${developerId}`}
                          className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                        >
                          {developerName}
                        </Link>
                      ) : (
                        <span className="text-secondary-900">{developerName}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contractors */}
                {contractors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                      <HardHat className="h-4 w-4" />
                      Contractors
                    </h4>
                    <div className="space-y-3 pl-6">
                      {/* Active Contractors */}
                      {activeContractors.length > 0 && (
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">Active</p>
                          {activeContractors.map((company, idx) => (
                            <CompanyLink key={idx} company={company} />
                          ))}
                        </div>
                      )}
                      {/* Past Contractors */}
                      {pastContractors.length > 0 && (
                        <div>
                          <p className="text-xs text-secondary-500 font-medium mb-1">Past</p>
                          {pastContractors.map((company, idx) => (
                            <CompanyLink key={idx} company={company} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consultants */}
                {consultants.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Consultants
                    </h4>
                    <div className="space-y-3 pl-6">
                      {/* Active Consultants */}
                      {activeConsultants.length > 0 && (
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">Active</p>
                          {activeConsultants.map((company, idx) => (
                            <CompanyLink key={idx} company={company} />
                          ))}
                        </div>
                      )}
                      {/* Past Consultants */}
                      {pastConsultants.length > 0 && (
                        <div>
                          <p className="text-xs text-secondary-500 font-medium mb-1">Past</p>
                          {pastConsultants.map((company, idx) => (
                            <CompanyLink key={idx} company={company} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Permit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Permit History ({permit_count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permits.length === 0 ? (
                <p className="text-secondary-500">No permits found for this parcel.</p>
              ) : (
                <div className="space-y-4">
                  {permits.map((permit: any, index: number) => {
                    const statusColor = getStatusColor(permit.project_status_english);
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
                      <div
                        key={permit.id}
                        className={`rounded-lg border p-4 ${index === 0 ? 'border-primary-200 bg-primary-50/50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-secondary-900">
                                Permit #{permit.project_no}
                              </p>
                              {index === 0 && (
                                <Badge variant="info" className="text-xs">Latest</Badge>
                              )}
                            </div>
                            <p className="text-sm text-secondary-500">
                              Created: {formatDate(permit.project_creation_date)}
                            </p>
                          </div>
                          {permit.project_status_english && (
                            <Badge variant={badgeVariant}>
                              {permit.project_status_english}
                            </Badge>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {getEnglishText(permit.consultant_english) && (
                            <div className="flex items-start gap-2">
                              <Briefcase className="h-4 w-4 text-secondary-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-secondary-500">Consultant</p>
                                {permit.consultant_license_no ? (
                                  <Link
                                    href={`/companies/consultant/${permit.consultant_license_no}`}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                  >
                                    {permit.consultant_english}
                                  </Link>
                                ) : (
                                  <p className="text-sm font-medium">{permit.consultant_english}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {getEnglishText(permit.contractor_english) && (
                            <div className="flex items-start gap-2">
                              <HardHat className="h-4 w-4 text-secondary-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-secondary-500">Contractor</p>
                                {permit.contractor_license_no ? (
                                  <Link
                                    href={`/companies/contractor/${permit.contractor_license_no}`}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                  >
                                    {permit.contractor_english}
                                  </Link>
                                ) : (
                                  <p className="text-sm font-medium">{permit.contractor_english}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {(permit.permit_date || permit.work_start_date || permit.expected_completion_date) && (
                          <div className="mt-3 pt-3 border-t border-secondary-100 grid gap-2 sm:grid-cols-3 text-sm">
                            {permit.permit_date && (
                              <div>
                                <span className="text-secondary-500">Permit: </span>
                                <span>{formatDate(permit.permit_date)}</span>
                              </div>
                            )}
                            {permit.work_start_date && (
                              <div>
                                <span className="text-secondary-500">Started: </span>
                                <span>{formatDate(permit.work_start_date)}</span>
                              </div>
                            )}
                            {permit.expected_completion_date && (
                              <div>
                                <span className="text-secondary-500">Expected: </span>
                                <span>{formatDate(permit.expected_completion_date)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {getEnglishText(permit.related_entity_name_en) && (
                          <p className="mt-2 text-sm text-secondary-600">
                            Entity: {permit.related_entity_name_en}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Land Registry Info */}
          {land_registry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Land Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Property ID" value={land_registry.property_id} />
                <InfoRow label="Area" value={land_registry.area_name_en} />
                <InfoRow label="Land Number" value={land_registry.land_number} />
                <InfoRow
                  label="Actual Area"
                  value={land_registry.actual_area ? `${land_registry.actual_area.toLocaleString()} sq ft` : null}
                />
                <InfoRow label="Property Type" value={land_registry.property_type_en} />
                <InfoRow label="Sub Type" value={land_registry.property_sub_type_en} />
                <InfoRow label="Land Type" value={land_registry.land_type_en} />
                <InfoRow label="Freehold" value={land_registry.is_free_hold ? 'Yes' : 'No'} />
                <InfoRow label="Registered" value={land_registry.is_registered ? 'Yes' : 'No'} />
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Parcel ID" value={parcel_id} />
              <InfoRow label="Area" value={area_name} />
              <InfoRow label="Total Permits" value={permit_count} />
              <InfoRow
                label="Developer Project"
                value={rera_project ? 'Yes' : 'No (Independent)'}
              />
            </CardContent>
          </Card>
        </div>
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
      <span className="text-sm font-medium text-secondary-900 text-right">
        {value ?? '-'}
      </span>
    </div>
  );
}

function CompanyLink({ company }: { company: CompanyInfo }) {
  if (company.licenseNo) {
    return (
      <div className="mb-1">
        <Link
          href={`/companies/${company.type}/${company.licenseNo}`}
          className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
        >
          {company.name}
        </Link>
        {company.licenseNo && (
          <span className="text-xs text-secondary-400 ml-2">
            (License: {company.licenseNo})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <span className="text-secondary-900">{company.name}</span>
    </div>
  );
}
