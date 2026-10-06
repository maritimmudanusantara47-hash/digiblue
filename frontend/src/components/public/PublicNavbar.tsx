'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.roles?.some(r => r.name === 'admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === '/';
  const isCourses = pathname.startsWith('/courses');

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-navy-dark text-white/80 text-xs">
        <div className="container flex items-center justify-between h-9">
          <span className="flex items-center gap-2">
            <Icon name="shield-2-check" size={14} className="text-gold" />
            <span>Resmi bersama The Blue Economist International Association</span>
          </span>
          <span className="hidden sm:flex items-center gap-4">
            <Link href="/#sertifikat" className="hover:text-white transition-colors">
              Tentang Sertifikat
            </Link>
            <Link href="/#faq" className="hover:text-white transition-colors">
              Bantuan
            </Link>
          </span>
        </div>
      </div>

      {/* Main Header (IBMI Style) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="container flex items-center justify-between h-[76px]">
          {/* Logo & Institute Brand Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-navy-dark text-white flex items-center justify-center p-2 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Icon name="certificate-badge-1" size={24} className="text-gold" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-navy-dark text-sm sm:text-base tracking-tight leading-tight uppercase font-heading">
                DigiBlue
              </span>
              <span className="font-semibold text-slate-500 text-[11px] tracking-wider uppercase">
                Center for Maritime Education
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold" aria-label="Navigasi utama">
            <Link
              href="/"
              className={`transition-colors pb-0.5 ${
                isHome
                  ? 'text-sky-600 font-bold border-b-2 border-sky-600'
                  : 'text-navy-dark hover:text-sky-600'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/courses"
              className={`transition-colors pb-0.5 ${
                isCourses
                  ? 'text-sky-600 font-bold border-b-2 border-sky-600'
                  : 'text-navy-dark hover:text-sky-600'
              }`}
            >
              Kursus
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase bg-navy text-white hover:bg-navy-dark transition-colors shadow-xs flex items-center gap-2"
              >
                <Icon name="user-circle" size={15} />
                <span>Dashboard {user?.name ? `(${user.name.split(' ')[0]})` : ''}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border border-sky-300 bg-sky-50/80 hover:bg-sky-100 text-sky-700 transition-colors shadow-xs"
              >
                Login / Register
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl border border-slate-200 text-navy-dark hover:bg-slate-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isHome ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isCourses ? 'bg-sky-50 text-sky-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Katalog Kursus
            </Link>
            <Link
              href="/#sertifikat"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Tentang Sertifikat
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Bantuan & FAQ
            </Link>
            <div className="pt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <Link
                  href={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-4 py-3 rounded-xl text-xs font-bold uppercase bg-navy text-white hover:bg-navy-dark transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Icon name="user-circle" size={15} />
                  <span>Dashboard {user?.name ? `(${user.name.split(' ')[0]})` : ''}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block text-center px-4 py-3 rounded-xl text-xs font-bold uppercase border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors shadow-xs"
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
