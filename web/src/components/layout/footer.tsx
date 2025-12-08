import Link from 'next/link';
import { Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-secondary-50">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">
                PROSPECTSDATA
              </span>
            </Link>
            <p className="mt-4 text-sm text-secondary-600 max-w-md">
              Comprehensive database of construction projects, developers,
              contractors, and consultants. Access detailed project information
              and company data.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary-900">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/projects"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/companies"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Companies
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-secondary-200 pt-8">
          <p className="text-center text-sm text-secondary-500">
            &copy; {new Date().getFullYear()} PROSPECTSDATA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
