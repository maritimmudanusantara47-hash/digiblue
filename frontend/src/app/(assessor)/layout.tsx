'use client';

import Icon from '@/components/Icon';
import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const assessorNav = [
  { href: '/assessor/dashboard', label: 'nav_dashboard', icon: 'dashboard-square-1' },
  { href: '/assessor/submissions', label: 'nav_submissions', icon: 'pen-to-square' },
];

export default function AssessorLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('AssessorPortal');
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { }
    clearAuth();
    window.location.replace('/');
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('auth_token');
      const isAssessor = user?.roles?.some(r => r.name === 'assessor' || r.name === 'admin');
      if (!token && !isAuthenticated) {
        window.location.replace('/');
        return;
      }
      if (user && !isAssessor) {
        window.location.replace('/');
      }
    };
    checkAuth();
    window.addEventListener('pageshow', checkAuth);
    return () => window.removeEventListener('pageshow', checkAuth);
  }, [user, isAuthenticated]);

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Redesigned Assessor Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:sticky lg:top-0 lg:z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Crest Header */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-[#00162d] border border-sky-400/30 flex items-center justify-center p-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Icon name="certificate-badge-1" size={20} className="text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-white text-[15px] tracking-tight leading-tight uppercase font-heading">
                DigiBlue
              </span>
              <span className="font-medium text-sky-300/80 text-[10px] tracking-wider uppercase leading-none mt-0.5 truncate">
                Assessor Panel
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden transition-colors cursor-pointer"
            aria-label="Tutup menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Assessor Identity Card */}
        <div className="p-3 flex-shrink-0">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate leading-tight">
                {user?.name ?? 'Assessor'}
              </p>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Penilai Resmi
              </span>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
            Menu Utama
          </span>
        </div>

        {/* Navigation Menu (Strict: No items added or removed) */}
        <nav className="sidebar-nav">
          {assessorNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{t(item.label as any)}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Actions: Logout */}
        <div className="p-3 border-t border-white/10 flex-shrink-0 mt-auto space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
          >
            <Icon name="exit" size={16} />
            <span>{t('btn_logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport with Header */}
      <div className="flex-1 min-w-0 flex flex-col w-full max-w-full lg:max-w-[calc(100vw-256px)] xl:max-w-[calc(100vw-288px)]">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-sky-600 hover:bg-slate-100 transition-colors lg:hidden focus:outline-none cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono truncate">
              Assessor Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
