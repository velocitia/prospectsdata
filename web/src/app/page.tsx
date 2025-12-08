import Link from 'next/link';
import {
  Building2,
  Search,
  FolderOpen,
  Users,
  ArrowRight,
  Building,
  HardHat,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container-custom py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Construction Projects
              <span className="block text-primary-200">Data & Insights</span>
            </h1>
            <p className="mt-6 text-lg text-primary-100 md:text-xl">
              Access comprehensive data on construction projects,
              developers, contractors, and consultants. Make informed decisions
              with detailed project information.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/projects">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Projects
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/companies">
                  <Users className="mr-2 h-5 w-5" />
                  View Companies
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem value="50,000+" label="Projects" />
            <StatItem value="10,000+" label="Buildings" />
            <StatItem value="2,000+" label="Developers" />
            <StatItem value="5,000+" label="Contractors" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-900 md:text-4xl">
              Everything You Need
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary-600">
              Comprehensive construction data at your fingertips
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<FolderOpen className="h-8 w-8" />}
              title="Project Database"
              description="Browse thousands of construction projects with detailed information including status, dates, and involved parties."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Company Directory"
              description="Find developers, contractors, and consultants with their project history and contact information."
            />
            <FeatureCard
              icon={<Building2 className="h-8 w-8" />}
              title="Building Details"
              description="Access comprehensive building data including floors, units, amenities, and property specifications."
            />
          </div>
        </div>
      </section>

      {/* Company Types Section */}
      <section className="bg-secondary-50 py-20">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-900 md:text-4xl">
              Explore by Company Type
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary-600">
              Find the right partners for your construction needs
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <CompanyTypeCard
              icon={<Building className="h-6 w-6" />}
              title="Developers"
              description="Development companies building landmark projects"
              href="/companies?type=developer"
              color="bg-purple-100 text-purple-800"
            />
            <CompanyTypeCard
              icon={<HardHat className="h-6 w-6" />}
              title="Contractors"
              description="Construction companies executing projects"
              href="/companies?type=contractor"
              color="bg-orange-100 text-orange-800"
            />
            <CompanyTypeCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Consultants"
              description="Engineering and design consultants for construction"
              href="/companies?type=consultant"
              color="bg-blue-100 text-blue-800"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white md:p-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              Start Exploring Today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
              Access our comprehensive database of construction projects and
              companies.
            </p>
            <div className="mt-8">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/projects">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-primary-600 md:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-secondary-600">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <div className="mx-auto inline-flex rounded-full bg-primary-50 p-4 text-primary-600">
          {icon}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-secondary-900">{title}</h3>
        <p className="mt-2 text-secondary-600">{description}</p>
      </CardContent>
    </Card>
  );
}

function CompanyTypeCard({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="p-6">
          <div className={`inline-flex rounded-full p-3 ${color}`}>{icon}</div>
          <h3 className="mt-4 text-xl font-semibold text-secondary-900">
            {title}
          </h3>
          <p className="mt-2 text-secondary-600">{description}</p>
          <div className="mt-4 flex items-center text-primary-600">
            <span className="text-sm font-medium">View all</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
