'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const adminNav = [
  { href: '/admin/dashboard',    label: 'Dashboard',         icon: '📊' },
  { href: '/admin/users',        label: 'Pengguna',          icon: '👥' },
  { href: '/admin/courses',      label: 'Manajemen Kursus',  icon: '📚' },
  { href: '/admin/enrollments',  label: 'Enrollment',        icon: '📋' },
  { href: '/admin/scholarship',  label: 'Kurasi Beasiswa',   icon: '🎓' },
  { href: '/admin/certificates', label: 'Sertifikat',        icon: '🏅' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <aside className="sidebar">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center font-extrabold text-navy-dark">D</div>
            <div>
              <p className="text-white font-extrabold text-sm leading-none">DigiBlueCamp</p>
              <p className="text-white/40 text-[10px] mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user?.name ?? 'Admin'}</p>
              <span className="badge badge-gold text-[10px] px-2 py-0.5 mt-0.5">Super Admin</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {adminNav.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-6">
          <button onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <span>🚪</span><span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto max-w-[calc(100vw-256px)]">
        {children}
      </main>
    </div>
  );
}
