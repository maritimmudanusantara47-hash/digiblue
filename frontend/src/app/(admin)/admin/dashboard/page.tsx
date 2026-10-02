'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface DashStats {
  total_users: number;
  active_enrollments: number;
  pending_scholarships: number;
  certificates_issued: number;
  certificates_pending_sync: number;
}

export default function AdminDashboard() {
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
          api.get('/admin/scholarships?status=pending&per_page=1'),
          api.get('/admin/certificates?per_page=1'),
          api.get('/admin/certificates?sync_status=failed&per_page=1'),
        ]).then(([users, enrollments, scholarships, certs, failedSync]) => {
          setStats({
            total_users:               extractTotal(users),
            active_enrollments:        extractTotal(enrollments),
            pending_scholarships:      extractTotal(scholarships),
            certificates_issued:       extractTotal(certs),
            certificates_pending_sync: extractTotal(failedSync),
          });
        }).catch(err => {
          console.error('Failed to load fallback dashboard stats:', err);
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Pengguna',      value: stats?.total_users,               icon: '👥', href: '/admin/users',        color: 'from-navy to-navy-light' },
    { label: 'Enrollment Aktif',    value: stats?.active_enrollments,        icon: '📖', href: '/admin/enrollments',  color: 'from-emerald-600 to-emerald-400' },
    { label: 'Beasiswa Menunggu',   value: stats?.pending_scholarships,      icon: '⏳', href: '/admin/scholarship',  color: 'from-amber-500 to-amber-400' },
    { label: 'Sertifikat Terbit',   value: stats?.certificates_issued,       icon: '🏅', href: '/admin/certificates', color: 'from-gold-dark to-gold' },
    { label: 'Sinkronisasi Gagal',  value: stats?.certificates_pending_sync, icon: '⚠️', href: '/admin/certificates', color: 'from-red-600 to-red-400' },
  ];

  const quickActions = [
    { label: 'Kurasi Beasiswa Baru',       href: '/admin/scholarship',  icon: '🎓', desc: 'Tinjau pengajuan beasiswa peserta' },
    { label: 'Terbitkan Sertifikat',       href: '/admin/certificates', icon: '🏅', desc: 'Approve kelulusan & cetak sertifikat' },
    { label: 'Re-Sync ke The Blue Economist', href: '/admin/certificates', icon: '🔄', desc: 'Sinkronisasi ulang data yang gagal' },
    { label: 'Export Database Sertifikat', href: '/admin/certificates', icon: '📊', desc: 'Download rekap .xlsx format lama' },
  ];

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Selamat datang di panel administrasi DigiBlueCamp</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}
            className={`rounded-2xl p-5 bg-gradient-to-br ${s.color} text-white shadow-md
                        hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer`}>
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="text-3xl font-extrabold">
              {loading ? '—' : (s.value ?? 0)}
            </div>
            <div className="text-white/70 text-xs mt-1 font-medium">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-bold text-navy-dark mb-5">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link key={action.label} href={action.href}
              className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200
                         hover:border-navy/30 hover:shadow-md transition-all duration-200 group">
              <span className="text-2xl">{action.icon}</span>
              <p className="font-semibold text-sm text-navy-dark group-hover:text-navy transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-slate-400">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
