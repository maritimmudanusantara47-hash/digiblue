'use client';

import { usePathname } from 'next/navigation';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Exclude dashboard, authentication, and certificate verification pages
  const isDashboardOrAuth =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/assessor') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    (pathname.startsWith('/verify/') && pathname !== '/verify');

  if (isDashboardOrAuth) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-700">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
