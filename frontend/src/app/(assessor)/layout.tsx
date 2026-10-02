'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import LineIcon from '@/components/LineIcon';

const assessorNav = [
  { href: '/assessor/dashboard',   label: 'Dashboard',        icon: 'dashboard-square-1' },
  { href: '/assessor/submissions', label: 'Penilaian Tugas',  icon: 'check-square-2' },
];

export default function AssessorLayout({ children }: { children: React.ReactNode }) {
  const pathname            = usePathname();
  const router              = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.replace('/login');
  };

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
              <LineIcon name={item.icon} className="text-base flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-6 flex-shrink-0 mt-auto">
          <button onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <LineIcon name="exit" className="text-base flex-shrink-0" /><span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8 max-w-[calc(100vw-256px)]">
        {children}
      </main>
    </div>
  );
}
