'use client';

import Icon from '@/components/Icon';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import api from '@/lib/api';

interface DashStats {
  total_users: number;
  active_enrollments: number;
  certificates_issued: number;
  certificates_pending_sync: number;
}

export default function AdminDashboard() {
  const t = useTranslations('AdminDashboard');
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Coba ambil dari endpoint terpadu /admin/dashboard-stats
    api.get('/admin/dashboard-stats')
      .then(res => {
        if (res.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch(() => {
        // 2. Fallback jika mengambil metrik per modul
        const extractTotal = (res: any) =>
          res?.data?.data?.total ??
          res?.data?.data?.meta?.total ??
          res?.data?.meta?.total ??
          res?.data?.total ??
          (Array.isArray(res?.data?.data) ? res.data.data.length : 0);

        Promise.all([
          api.get('/admin/users?per_page=1'),
          api.get('/admin/enrollments?status=active&per_page=1'),
          api.get('/admin/certificates?per_page=1'),
          api.get('/admin/certificates?sync_status=failed&per_page=1'),
        ]).then(([users, enrollments, certs, failedSync]) => {
          setStats({
            total_users: extractTotal(users),
            active_enrollments: extractTotal(enrollments),
            certificates_issued: extractTotal(certs),
            certificates_pending_sync: extractTotal(failedSync),
          });
        }).catch(err => {
          console.error('Failed to load fallback dashboard stats:', err);
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: t('stat_users'),
      value: stats?.total_users,
      icon: 'user-multiple-4',
      href: '/admin/users',
      desc: 'Pengguna terdaftar di platform',
      colorBadge: 'bg-sky-50 text-sky-700 border-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      label: t('stat_enroll'),
      value: stats?.active_enrollments,
      icon: 'book-1',
      href: '/admin/enrollments',
      desc: 'Peserta dalam kursus berjalan',
      colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: t('stat_certs'),
      value: stats?.certificates_issued,
      icon: 'certificate-badge-1',
      href: '/admin/certificates',
      desc: 'Sertifikat resmi terbit & terverifikasi',
      colorBadge: 'bg-amber-50 text-amber-700 border-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: t('stat_sync'),
      value: stats?.certificates_pending_sync,
      icon: 'refresh-circle-1-clockwise',
      href: '/admin/certificates',
      desc: 'Menunggu sinkronisasi ulang',
      colorBadge: 'bg-rose-50 text-rose-700 border-rose-100',
      iconColor: 'text-rose-600',
    },
  ];


  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeup pb-8">
      {/* Executive Welcome Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-sky-800 text-xs font-semibold mb-2.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Sistem Operasional Aktif</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500 sm:text-sky-800">The Blue Economist Global Hub</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-[#07192C] font-heading tracking-tight">
            {t('title')}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            target="_blank"
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 font-heading"
          >
            <Icon name="scan" size={15} className="text-slate-500" />
            <span>Portal Verifikasi</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid: Balanced 4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 hover:border-sky-300/80 hover:shadow-[0_12px_30px_-10px_rgba(7,25,44,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${s.colorBadge} transition-transform group-hover:scale-105`}>
                  <Icon name={s.icon} size={22} className={s.iconColor} />
                </div>
                <span className="text-slate-300 group-hover:text-sky-600 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-[#07192C] font-heading tracking-tight">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  s.value ?? 0
                )}
              </div>
              <p className="font-bold text-sm text-slate-800 mt-1">
                {s.label}
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
              {s.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Akses Cepat Pengaturan */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#07192C] font-heading">
              Akses Cepat Pengaturan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Konfigurasi langsung untuk modul pendukung yang tidak tercantum di navigasi utama
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
            Template & Desain
          </span>
        </div>

        <Link
          href="/admin/certificates/template"
          className="p-6 rounded-2xl border border-slate-200/80 hover:border-amber-300/80 hover:bg-slate-50/50 hover:shadow-xs transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        >
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-[#07192C] text-amber-600 group-hover:text-amber-400 flex items-center justify-center shrink-0 transition-colors border border-amber-100/80">
              <Icon name="pen-to-square" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#07192C] group-hover:text-amber-700 transition-colors font-heading">
                  Editor Desain Template Sertifikat
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 hidden sm:inline-block">
                  Kustomisasi Visual
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Kelola tata letak grafis, tipografi nama, tanda tangan digital assessor, dan kode QR verifikasi sertifikat kelulusan.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#07192C] group-hover:bg-amber-500 text-white group-hover:text-slate-950 font-bold text-xs tracking-wide transition-colors shrink-0 shadow-xs">
            <span>Buka Editor</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
