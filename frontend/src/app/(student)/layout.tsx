'use client';

import Icon from '@/components/Icon';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { useCartCount } from '@/store/cartStore';
import api from '@/lib/api';

const navItems = [
  { href: '/student/dashboard', label: 'nav_dashboard', icon: 'home-2' },
  { href: '/student/catalog', label: 'nav_catalog', icon: 'books-2' },
  { href: '/student/certificates', label: 'nav_certificates', icon: 'certificate-badge-1' },
  { href: '/student/orders', label: 'nav_orders', icon: 'credit-card-multiple' },
  { href: '/student/profile', label: 'nav_profile', icon: 'user-4' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('StudentPortal');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const cartCount = useCartCount();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { }
    clearAuth();
    window.location.replace('/');
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('auth_token');
      // Jika route bukan /student/catalog dan tidak ada token/auth, tendang ke login
      if (!token && !isAuthenticated && !pathname.startsWith('/student/catalog')) {
        window.location.replace('/login?redirect=' + encodeURIComponent(pathname));
      }
    };
    checkAuth();
    window.addEventListener('pageshow', checkAuth);
    return () => window.removeEventListener('pageshow', checkAuth);
  }, [pathname, isAuthenticated]);

  const isCourseLearning = pathname.startsWith('/student/courses/');

  if (isCourseLearning) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col w-full overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Redesigned Student Portal Sidebar */}
      <aside className="sidebar">
        {/* Brand Crest Header */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#00162d] border border-sky-400/30 flex items-center justify-center p-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Icon name="certificate-badge-1" size={20} className="text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-white text-[15px] tracking-tight leading-tight uppercase font-heading">
                DigiBlue
              </span>
              <span className="font-medium text-sky-300/80 text-[10px] tracking-wider uppercase leading-none mt-0.5 truncate">
                Student Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Student Identity Card */}
        <div className="p-3 flex-shrink-0">
          <Link
            href="/student/profile"
            className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-sm flex items-center gap-3 transition-colors group block"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate leading-tight group-hover:text-sky-300 transition-colors">
                {user?.name ?? t('default_user')}
              </p>
              <span className="inline-block text-[10px] font-semibold text-slate-400 truncate mt-0.5 max-w-full">
                {user?.country ?? user?.institution ?? 'Peserta Pelatihan'}
              </span>
            </div>
          </Link>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
            Menu Utama
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{t(item.label as any)}</span>
            </Link>
          ))}
          <Link
            href="/student/cart"
            className={`sidebar-link flex items-center justify-between ${pathname.startsWith('/student/cart') ? 'active' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <Icon name="cart" size={18} />
              <span>{t('nav_cart')}</span>
            </div>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500 text-white shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>
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

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 max-w-[calc(100vw-256px)] xl:max-w-[calc(100vw-288px)]">
        {children}
      </main>
    </div>
  );
}
