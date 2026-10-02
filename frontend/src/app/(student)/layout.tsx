'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import LineIcon from '@/components/LineIcon';

const navItems = [
  { href: '/student/dashboard',   label: 'Dashboard',      icon: 'dashboard-square-1' },
  { href: '/student/catalog',     label: 'Katalog Kursus', icon: 'book-1' },
  { href: '/student/scholarship', label: 'Beasiswa',       icon: 'graduation-cap-1' },
  { href: '/student/certificates',label: 'Sertifikat Saya',icon: 'certificate-badge-1' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center font-extrabold text-navy-dark">D</div>
          <div>
            <p className="text-white font-extrabold text-sm leading-none">DigiBlueCamp</p>
            <p className="text-white/40 text-[10px] mt-0.5">Student Portal</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name ?? 'Peserta'}</p>
              <p className="text-white/40 text-[11px] truncate">{user?.country ?? user?.institution ?? ''}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <LineIcon name={item.icon} className="text-base flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 flex-shrink-0 mt-auto">
          <button onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <LineIcon name="exit" className="text-base flex-shrink-0" /><span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-8 max-w-[calc(100vw-256px)]">
        {children}
      </main>
    </div>
  );
}
