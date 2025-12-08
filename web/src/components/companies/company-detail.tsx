import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/queries';
import type {
  Developer,
  CompanyType,
  ContractorProject,
  ConsultantProject,
  Company,
  KeyPerson,
} from '@/lib/types';
import {
  Building,
  HardHat,
  Briefcase,
  Phone,
  Globe,
  Calendar,
  FileText,
  Mail,
  MapPin,
  Users,
  BadgeCheck,
  ExternalLink,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Building2,
  Clock,
} from 'lucide-react';

interface CompanyDetailProps {
  company: Company;
  developerInfo?: Developer;
  type: CompanyType;
  projects?: ContractorProject[] | ConsultantProject[];
}

const companyTypeConfig: Record<
  CompanyType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  developer: {
    label: 'Developer',
    icon: <Building className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
  },
  contractor: {
    label: 'Contractor',
    icon: <HardHat className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800',
  },
  consultant: {
    label: 'Consultant',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
  },
};

export function CompanyDetail({ company, developerInfo, type, projects }: CompanyDetailProps) {
  const config = companyTypeConfig[type];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${config.color}`}>{config.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-secondary-900 md:text-3xl">
                {company.name || 'Unknown Company'}
              </h1>
              {company.is_verified && (
                <BadgeCheck className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-secondary-500">
              <span>License: {company.license_no}</span>
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
        <Badge variant="secondary" className={`${config.color} text-sm`}>
          {config.label}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Projects"
          value={company.project_count.toString()}
        />
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Active Area"
          value={company.active_area || company.emirate || '-'}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Last Activity"
          value={company.last_active_date ? formatDate(company.last_active_date) : 'No activity'}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Status"
          value={company.is_verified ? 'Verified' : 'Unverified'}
          valueColor={company.is_verified ? 'text-green-600' : 'text-secondary-500'}
        />
      </div>

      {/* Description */}
      {company.description && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600">{company.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Specializations */}
      {company.specializations && company.specializations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {company.specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="text-sm">
                  {spec}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            {company.website && (
              <ContactRow
                icon={<Globe className="h-4 w-4" />}
                label="Website"
                value={cleanUrl(company.website)}
                href={ensureHttps(company.website)}
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
            {!company.phone && !company.email && !company.website && !company.fax && (
              <p className="text-sm text-secondary-400">No contact information available</p>
            )}

            {/* Social Links */}
            {company.social_links && Object.keys(company.social_links).length > 0 && (
              <div className="flex items-center gap-3 pt-2 border-t">
                {company.social_links.linkedin && (
                  <a
                    href={company.social_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-400 hover:text-blue-600 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {company.social_links.twitter && (
                  <a
                    href={company.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-400 hover:text-blue-400 transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {company.social_links.instagram && (
                  <a
                    href={company.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-400 hover:text-pink-600 transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {company.social_links.facebook && (
                  <a
                    href={company.social_links.facebook}
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
      {company.key_people && company.key_people.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Key People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {company.key_people.map((person, index) => (
                <PersonCard key={index} person={person} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Information (for developers) */}
      {type === 'developer' && developerInfo && (
        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="License Number" value={developerInfo.license_number} />
            <InfoRow label="License Source" value={developerInfo.license_source_en} />
            <InfoRow label="License Type" value={developerInfo.license_type_en} />
            <InfoRow
              label="Issue Date"
              value={formatDate(developerInfo.license_issue_date)}
            />
            <InfoRow
              label="Expiry Date"
              value={formatDate(developerInfo.license_expiry_date)}
            />
            <InfoRow label="Legal Status" value={developerInfo.legal_status_en} />
            {developerInfo.registration_date && (
              <InfoRow
                label="Registration Date"
                value={formatDate(developerInfo.registration_date)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project No</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>Building Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permit Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/projects/${project.parcel_id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {project.project_no || project.parcel_id}
                      </Link>
                    </TableCell>
                    <TableCell>{project.community_name || '-'}</TableCell>
                    <TableCell>{project.building_type || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {project.project_status || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(project.first_building_permit_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
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

// Utility functions
function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function ensureHttps(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}
