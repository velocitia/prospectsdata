import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { Sidebar } from '@/components/layout/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Admin - PROSPECTSDATA',
    template: '%s | Admin - PROSPECTSDATA',
  },
  description: 'Admin dashboard for PROSPECTSDATA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 pl-64">
              {children}
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
