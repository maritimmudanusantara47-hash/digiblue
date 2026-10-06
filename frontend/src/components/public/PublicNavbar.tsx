'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';

export default function PublicNavbar() {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.roles?.some(r => r.name === 'admin');

  return (
    <>
      {/* Top bar */}
      <div className="bg-navy-dark text-white/80 text-xs">
        <div className="container flex items-center justify-between h-9">
          <span className="flex items-center gap-2">
            <Icon name="shield-2-check" size={14} className="text-gold" />
            Resmi bersama The Blue Economist International Association
          </span>
          <span className="hidden sm:flex items-center gap-4">
            <Link href="/#sertifikat" className="hover:text-white">Tentang Sertifikat</Link>
            <Link href="/#faq" className="hover:text-white">Bantuan</Link>
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="container flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-gold font-extrabold">D</span>
            <span className="font-extrabold text-navy-dark text-lg tracking-tight">DigiBlueCamp</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold" aria-label="Navigasi utama">
            <Link href="/" className="text-slate-600 hover:text-navy transition-colors">Home</Link>
            <Link href="/courses" className="text-navy font-bold border-b-2 border-navy pb-0.5">Kursus</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Icon name="user-circle" size={15} />
                <span>Dashboard {user?.name ? `(${user.name.split(' ')[0]})` : ''}</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline text-sm font-semibold text-navy-dark hover:text-navy-light">Masuk</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Daftar</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
