'use client';

import Icon from '@/components/Icon';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const assessorNav = [
  { href: '/assessor/dashboard',   label: 'nav_dashboard',        icon: 'dashboard-square-1' },
  { href: '/assessor/submissions', label: 'nav_submissions',  icon: 'pen-to-square' },
];

export default function AssessorLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('AssessorPortal');
  const pathname            = usePathname();
  const router              = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    window.location.replace('/');
  };

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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sidebar">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center font-extrabold text-navy-dark">D</div>
            <div>
              <p className="text-white font-extrabold text-sm leading-none">DigiBlueCamp</p>
              <p className="text-white/40 text-[10px] mt-0.5">Assessor Panel</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user?.name ?? 'Assessor'}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 mt-0.5">
                Assessor
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {assessorNav.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>
              <Icon name={item.icon} size={18} />
              <span>{t(item.label as any)}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-6 flex-shrink-0 mt-auto">
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>
          <button onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <span><Icon name="exit" size={18} /></span><span>{t('btn_logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8 max-w-[calc(100vw-256px)]">
        {children}
      </main>
    </div>
  );
}
