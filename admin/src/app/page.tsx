'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen,
  Building2,
  HardHat,
  Briefcase,
  Building,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { StatsCard } from '@/components/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDashboardStats } from '@/lib/queries';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <div>
      <Header title="Dashboard" description="Overview of your database" />

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Projects"
            value={isLoading ? '...' : stats?.totalProjects || 0}
            icon={<FolderOpen className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Buildings"
            value={isLoading ? '...' : stats?.totalBuildings || 0}
            icon={<Building2 className="h-6 w-6" />}
          />
          <StatsCard
            title="Developers"
            value={isLoading ? '...' : stats?.totalDevelopers || 0}
            icon={<Building className="h-6 w-6" />}
          />
          <StatsCard
            title="Contractors"
            value={isLoading ? '...' : stats?.totalContractors || 0}
            icon={<HardHat className="h-6 w-6" />}
          />
          <StatsCard
            title="Consultants"
            value={isLoading ? '...' : stats?.totalConsultants || 0}
            icon={<Briefcase className="h-6 w-6" />}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickActionCard
                  title="Import Data"
                  description="Upload CSV files to update the database"
                  href="/import"
                />
                <QuickActionCard
                  title="View Projects"
                  description="Browse and manage project records"
                  href="/projects"
                />
                <QuickActionCard
                  title="View Companies"
                  description="Browse developers, contractors, consultants"
                  href="/companies"
                />
                <QuickActionCard
                  title="Settings"
                  description="Configure application settings"
                  href="/settings"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TableRow name="project_information" label="Project Information" />
                <TableRow name="land_registry" label="Land Registry" />
                <TableRow name="buildings" label="Buildings" />
                <TableRow name="projects" label="Projects (RERA)" />
                <TableRow name="developers" label="Developers" />
                <TableRow name="contractor_projects" label="Contractor Projects" />
                <TableRow name="consultant_projects" label="Consultant Projects" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border p-4 transition-colors hover:border-primary-500 hover:bg-primary-50"
    >
      <h3 className="font-medium text-secondary-900">{title}</h3>
      <p className="mt-1 text-sm text-secondary-500">{description}</p>
    </a>
  );
}

function TableRow({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div>
        <p className="font-medium text-secondary-900">{label}</p>
        <p className="text-xs text-secondary-500">{name}</p>
      </div>
      <a
        href={`/import?table=${name}`}
        className="text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        Import
      </a>
    </div>
  );
}
