'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Enrollment, Certificate } from '@/types';

const statusLabel: Record<string, { label: string; class: string }> = {
  active:         { label: 'Aktif',              class: 'badge-success' },
  completed:      { label: 'Selesai',             class: 'badge-navy' },
  pending_review: { label: 'Menunggu Kurasi',     class: 'badge-warning' },
  payment_pending:{ label: 'Menunggu Pembayaran', class: 'badge-gold' },
  rejected:       { label: 'Ditolak',             class: 'badge-danger' },
};

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/enrollments'), api.get('/certificates')])
      .then(([e, c]) => {
        setEnrollments(e.data.data);
        setCertificates(c.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { number: enrollments.filter(e => e.status === 'active').length,    label: 'Kursus Aktif',   icon: '📖' },
    { number: enrollments.filter(e => e.status === 'completed').length,  label: 'Kursus Selesai', icon: '✅' },
    { number: certificates.length,                                        label: 'Sertifikat',     icon: '🏅' },
    { number: enrollments.filter(e => e.status === 'pending_review').length, label: 'Menunggu Review', icon: '⏳' },
  ];

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">
          Selamat datang, {user?.name?.split(' ')[0] ?? 'Peserta'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">{user?.institution}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="stat-number">{loading ? '—' : s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kursus Aktif */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-dark">Kursus Saya</h2>
          <Link href="/student/catalog" className="btn btn-outline btn-sm">
            + Tambah Kursus
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-slate-500 text-sm">Kamu belum mendaftar kursus apapun.</p>
            <Link href="/student/catalog" className="btn btn-primary btn-sm mt-4 inline-flex">
              Lihat Katalog Kursus
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {enrollments.map(e => (
              <div key={e.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-navy/20 hover:shadow-sm transition-all">
                <div>
                  <p className="font-semibold text-sm text-navy-dark">{e.course.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{e.course.certification_level.name}</p>
                </div>
                <span className={`badge ${statusLabel[e.status]?.class ?? 'badge-pending'}`}>
                  {statusLabel[e.status]?.label ?? e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sertifikat Terbaru */}
      {certificates.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy-dark">Sertifikat Terbaru</h2>
            <Link href="/student/certificates" className="text-sm text-navy font-semibold hover:text-gold transition-colors">
              Lihat Semua →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.slice(0, 2).map(cert => (
              <div key={cert.id}
                className="relative overflow-hidden rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-navy to-navy-light text-white">
                <div className="absolute top-3 right-3">
                  <span className="badge bg-gold/20 text-gold text-[10px]">
                    {cert.enrollment.course.certification_level.name}
                  </span>
                </div>
                <div className="text-2xl mb-2">🏅</div>
                <p className="font-bold text-sm truncate">{cert.enrollment.course.title}</p>
                <p className="text-white/60 text-xs mt-1">Grade: <strong className="text-gold">{cert.grade}</strong></p>
                <p className="text-white/50 text-[11px] mt-1">{cert.serial_number}</p>
                <Link href={`/student/certificates`}
                  className="mt-3 inline-flex btn bg-white/10 text-white border border-white/20 btn-sm text-xs px-3 py-1.5">
                  Download PDF
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
