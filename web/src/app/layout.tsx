import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'PROSPECTSDATA - Construction Projects & Companies Database',
    template: '%s | PROSPECTSDATA',
  },
  description:
    'Comprehensive database of construction projects, developers, contractors, and consultants. Access detailed project information and company data.',
  keywords: [
    'construction projects',
    'property development',
    'contractors',
    'consultants',
    'developers',
    'building projects',
  ],
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
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
