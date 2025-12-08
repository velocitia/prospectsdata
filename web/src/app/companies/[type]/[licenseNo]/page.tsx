'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Briefcase, HardHat, Calendar, FileText, Phone, Mail, Globe, Users, BadgeCheck, ExternalLink, Linkedin, Twitter, Instagram, Facebook, Clock } from 'lucide-react';
import { fetchCompanyDetails, formatDate, getStatusColor } from '@/lib/queries';
import type { CompanyType, KeyPerson, SocialLinks } from '@/lib/types';
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

// Utility functions for URLs
function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function ensureHttps(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

const companyTypeConfig: Record<
  CompanyType,
  { label: string; icon: React.ReactNode; color: string; badgeVariant: 'info' | 'success' | 'warning' }
> = {
  developer: {
    label: 'Developer',
    icon: <Building2 className="h-8 w-8" />,
    color: 'bg-purple-100 text-purple-800',
    badgeVariant: 'info',
  },
  contractor: {
    label: 'Contractor',
    icon: <HardHat className="h-8 w-8" />,
    color: 'bg-orange-100 text-orange-800',
    badgeVariant: 'warning',
  },
  consultant: {
    label: 'Consultant',
    icon: <Briefcase className="h-8 w-8" />,
    color: 'bg-blue-100 text-blue-800',
    badgeVariant: 'success',
  },
};

export default function CompanyDetailPage() {
  const params = useParams();
  const licenseNo = Number(params.licenseNo);
  const type = params.type as CompanyType;

  const validTypes: CompanyType[] = ['developer', 'contractor', 'consultant'];
  const isValidType = validTypes.includes(type);

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-details', type, licenseNo],
    queryFn: () => fetchCompanyDetails(licenseNo, type),
    enabled: !isNaN(licenseNo) && isValidType,
  });

  if (!isValidType) {
    return (
      <div className="container-custom py-8">
        <Link
          href="/companies"
          className="mb-6 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Link>
        <EmptyState
          title="Invalid company type"
          description="Please select a valid company type: developer, contractor, or consultant."
        />
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <div className="container-custom py-8">
        <Link
          href="/companies"
          className="mb-6 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Link>
        <EmptyState
          title="Company not found"
          description="The company you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  const config = companyTypeConfig[type];
  const company = data.company || {};
  const companyName = company.name_en || company.developer_name_en || 'Unknown';
  const isVerified = company.is_verified || false;
  const specializations: string[] = company.specializations || [];
  const keyPeople: KeyPerson[] = company.key_people || [];
  const socialLinks: SocialLinks = company.social_links || {};

  return (
    <div className="container-custom py-8">
      <Link
        href="/companies"
        className="mb-6 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Companies
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-3 ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-secondary-900">
                  {companyName}
                </h1>
                {isVerified && (
                  <BadgeCheck className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-secondary-500">
                <span>License: {licenseNo}</span>
                {company.established_year && (
                  <span>Est. {company.established_year}</span>
                )}
                {company.employees_range && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {company.employees_range} employees
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={config.badgeVariant} className="text-sm capitalize">
            {type}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Projects"
          value={(data.projects?.length || 0).toString()}
        />
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Active Areas"
          value={(data.areas?.length || 0).toString()}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Permits"
          value={(data.permits?.length || 0).toString()}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Status"
          value={isVerified ? 'Verified' : 'Unverified'}
          valueColor={isVerified ? 'text-green-600' : 'text-secondary-500'}
        />
      </div>

      {/* Description */}
      {company.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600">{company.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Specializations */}
      {specializations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec: string) => (
                <Badge key={spec} variant="secondary" className="text-sm">
                  {spec}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact & Address Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.phone && (
                  <ContactRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={company.phone}
                    href={`tel:${company.phone}`}
                  />
                )}
                {company.email && (
                  <ContactRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={company.email}
                    href={`mailto:${company.email}`}
                  />
                )}
                {(company.website || company.webpage) && (
                  <ContactRow
                    icon={<Globe className="h-4 w-4" />}
                    label="Website"
                    value={cleanUrl(company.website || company.webpage)}
                    href={ensureHttps(company.website || company.webpage)}
                    external
                  />
                )}
                {company.fax && (
                  <ContactRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Fax"
                    value={company.fax}
                  />
                )}
                {!company.phone && !company.email && !company.website && !company.webpage && !company.fax && (
                  <p className="text-sm text-secondary-400">No contact information available</p>
                )}

                {/* Social Links */}
                {Object.keys(socialLinks).length > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary-400 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary-400 hover:text-blue-400 transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary-400 hover:text-pink-600 transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary-400 hover:text-blue-700 transition-colors"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Office Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-secondary-400 mt-1 shrink-0" />
                    <p className="text-secondary-700">{company.address}</p>
                  </div>
                )}
                {company.emirate && (
                  <InfoRow label="Emirate" value={company.emirate} />
                )}
                {company.po_box && (
                  <InfoRow label="P.O. Box" value={company.po_box} />
                )}
                {!company.address && !company.emirate && !company.po_box && (
                  <p className="text-sm text-secondary-400">No address information available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key People */}
          {keyPeople.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Key People
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {keyPeople.map((person: KeyPerson, index: number) => (
                    <PersonCard key={index} person={person} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* License Information - Developer specific */}
          {type === 'developer' && company && (
            <Card>
              <CardHeader>
                <CardTitle>License Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {company.license_number && (
                  <InfoItem label="License Number" value={company.license_number} />
                )}
                {company.license_source_en && (
                  <InfoItem label="License Source" value={company.license_source_en} />
                )}
                {company.license_type_en && (
                  <InfoItem label="License Type" value={company.license_type_en} />
                )}
                {company.legal_status_en && (
                  <InfoItem label="Legal Status" value={company.legal_status_en} />
                )}
                {company.license_issue_date && (
                  <InfoItem label="Issue Date" value={formatDate(company.license_issue_date)} />
                )}
                {company.license_expiry_date && (
                  <InfoItem label="Expiry Date" value={formatDate(company.license_expiry_date)} />
                )}
                {company.registration_date && (
                  <InfoItem label="Registration Date" value={formatDate(company.registration_date)} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Developer Projects */}
          {data.projects && data.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Developer Projects ({data.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.projects.map((project: any) => {
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
                      <Link
                        key={project.project_id}
                        href={`/projects/rera/${project.project_id}`}
                        className="block rounded-lg border p-4 hover:bg-secondary-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-secondary-900">
                              {getEnglishText(project.master_project_en) || getEnglishText(project.project_description_en) || `Project ${project.project_id}`}
                            </p>
                            {getEnglishText(project.area_name_en) && (
                              <p className="text-sm text-secondary-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {project.area_name_en}
                              </p>
                            )}
                          </div>
                          {project.project_status && (
                            <Badge variant={badgeVariant} className="text-xs">
                              {project.project_status}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-secondary-600">
                          {project.no_of_villas > 0 && <span>{project.no_of_villas} villas</span>}
                          {project.no_of_units > 0 && <span>{project.no_of_units} units</span>}
                          {project.no_of_buildings > 0 && <span>{project.no_of_buildings} buildings</span>}
                          {project.project_start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(project.project_start_date)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permits (for consultants/contractors) */}
          {data.permits && data.permits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Construction Permits ({data.permits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.permits.slice(0, 50).map((permit: any) => {
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
                          {permit.project_status_english && (
                            <Badge variant={badgeVariant} className="text-xs">
                              {permit.project_status_english}
                            </Badge>
                          )}
                        </div>
                        {permit.project_creation_date && (
                          <p className="mt-1 text-sm text-secondary-500">
                            Created: {formatDate(permit.project_creation_date)}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                  {data.permits.length > 50 && (
                    <p className="text-center text-sm text-secondary-500 pt-2">
                      Showing 50 of {data.permits.length} permits
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Areas */}
          {(() => {
            const englishAreas = data.areas?.filter((area: string) => !isArabic(area)) || [];
            if (englishAreas.length === 0) return null;
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Active Areas ({englishAreas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {englishAreas.map((area: string) => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({
  icon,
  label,
  value,
  valueColor = 'text-secondary-900',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-secondary-400">{icon}</div>
          <div>
            <p className="text-xs text-secondary-500 uppercase tracking-wide">{label}</p>
            <p className={`font-semibold ${valueColor} line-clamp-1`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
      <div className="flex items-center gap-2 text-secondary-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-secondary-900">{value}</span>
        {external && <ExternalLink className="h-3 w-3 text-secondary-400" />}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="block hover:bg-secondary-50 rounded -mx-2 px-2 transition-colors"
      >
        {content}
      </a>
    );
  }

  return content;
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

function InfoItem({ label, value }: { label: string; value: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm text-secondary-500">{label}</p>
      <p className="font-medium text-secondary-900">{value}</p>
    </div>
  );
}

function PersonCard({ person }: { person: KeyPerson }) {
  return (
    <div className="p-4 bg-secondary-50 rounded-lg">
      <p className="font-medium text-secondary-900">{person.name}</p>
      <p className="text-sm text-secondary-500">{person.role}</p>
      {(person.phone || person.email) && (
        <div className="mt-2 space-y-1">
          {person.phone && (
            <a
              href={`tel:${person.phone}`}
              className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
            >
              <Phone className="h-3 w-3" />
              {person.phone}
            </a>
          )}
          {person.email && (
            <a
              href={`mailto:${person.email}`}
              className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
            >
              <Mail className="h-3 w-3" />
              {person.email}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
