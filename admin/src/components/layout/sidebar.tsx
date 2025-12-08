'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Upload,
  Settings,
  Building,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Permits', href: '/projects', icon: FolderOpen },
  { name: 'RERA Projects', href: '/rera-projects', icon: Landmark },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Import Data', href: '/import', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Building className="h-8 w-8 text-primary-600" />
        <span className="text-xl font-bold text-secondary-900">Admin</span>
      </div>

      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
