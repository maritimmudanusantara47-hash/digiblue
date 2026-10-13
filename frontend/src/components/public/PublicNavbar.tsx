'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function PublicNavbar() {
  const t = useTranslations('LandingPage');
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.roles?.some(r => r.name === 'admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === '/';
  const isCourses = pathname.startsWith('/courses');

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#00162d] text-white/80 text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <span className="flex items-center gap-2">
            <Icon name="shield-2-check" size={14} className="text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium">{t('topbar_official')}</span>
          </span>
          <span className="hidden sm:flex items-center gap-6 text-[11px] sm:text-xs font-medium">
            <Link href="/about" className="hover:text-white transition-colors">
              {t('topbar_about')}
            </Link>
            <Link href="/help" className="hover:text-white transition-colors">
              {t('topbar_help')}
            </Link>
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[72px]">
          {/* Logo & Institute Brand Title */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#00162d] text-white flex items-center justify-center p-2 border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Icon name="certificate-badge-1" size={22} className="text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#00162d] text-[15px] sm:text-base tracking-tight leading-tight uppercase font-heading">
                DigiBlue
              </span>
              <span className="font-semibold text-slate-500 text-[10px] sm:text-[11px] tracking-wider uppercase leading-none mt-0.5">
                Center for Maritime Education
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop: Beranda, Kursus, Verifikasi, Tentang Kami, Pusat Bantuan) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] xl:text-sm font-semibold" aria-label="Navigasi utama">
            <Link
              href="/"
              className={`transition-colors py-1.5 relative ${isHome
                  ? 'text-sky-600 font-bold after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-0.5 after:bg-sky-600 after:rounded-full'
                  : 'text-slate-700 hover:text-sky-600'
                }`}
            >
              {t('nav_home')}
            </Link>
            <Link
              href="/courses"
              className={`transition-colors py-1.5 relative ${isCourses
                  ? 'text-sky-600 font-bold after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-0.5 after:bg-sky-600 after:rounded-full'
                  : 'text-slate-700 hover:text-sky-600'
                }`}
            >
              {t('nav_courses')}
            </Link>
            <Link
              href="/verify"
              className={`transition-colors py-1.5 relative ${pathname.startsWith('/verify')
                  ? 'text-sky-600 font-bold after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-0.5 after:bg-sky-600 after:rounded-full'
                  : 'text-slate-700 hover:text-sky-600'
                }`}
            >
              {t('nav_verify')}
            </Link>
            <Link
              href="/about"
              className={`transition-colors py-1.5 relative ${pathname === '/about'
                  ? 'text-sky-600 font-bold after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-0.5 after:bg-sky-600 after:rounded-full'
                  : 'text-slate-700 hover:text-sky-600'
                }`}
            >
              {t('nav_about')}
            </Link>
            <Link
              href="/help"
              className={`transition-colors py-1.5 relative ${pathname === '/help'
                  ? 'text-sky-600 font-bold after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-0.5 after:bg-sky-600 after:rounded-full'
                  : 'text-slate-700 hover:text-sky-600'
                }`}
            >
              {t('nav_help')}
            </Link>
          </nav>

          {/* Right Action Buttons: Language Switcher & Single Stitch-Styled LOGIN / REGISTER Pill */}
          <div className="hidden sm:flex items-center gap-3.5 shrink-0">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link
                href={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                className="px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-[#00162d] text-white hover:bg-[#0f2b48] transition-colors shadow-xs flex items-center gap-2"
              >
                <Icon name="user-4" size={15} />
                <span>{t('nav_dashboard')} {user?.name ? `(${user.name.split(' ')[0]})` : ''}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border border-sky-300 bg-sky-50/80 hover:bg-sky-100 text-sky-700 transition-colors shadow-xs shrink-0"
              >
                {t('nav_login_reg')}
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl border border-slate-200 text-[#00162d] hover:bg-slate-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-fadeup shadow-lg">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isHome ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              {t('nav_home')}
            </Link>
            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isCourses ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              {t('nav_courses')}
            </Link>
            <Link
              href="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pathname.startsWith('/verify') ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              {t('nav_verify')}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pathname === '/about' ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              {t('nav_about')}
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pathname === '/help' ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              {t('nav_help')}
            </Link>
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex justify-center mb-2">
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <Link
                  href={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-4 py-3 rounded-xl text-xs font-bold uppercase bg-[#00162d] text-white hover:bg-[#0f2b48] transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Icon name="user-4" size={15} />
                  <span>{t('nav_dashboard')} {user?.name ? `(${user.name.split(' ')[0]})` : ''}</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-xl text-xs font-bold uppercase border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {t('nav_login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-xl text-xs font-bold uppercase bg-amber-500 hover:bg-amber-600 text-[#0f2b48] transition-colors shadow-xs"
                  >
                    {t('nav_register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
