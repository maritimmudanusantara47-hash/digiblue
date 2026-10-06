'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Enrollment, Certificate, Course } from '@/types';

const statusLabel: Record<string, { label: string; class: string }> = {
  active:         { label: 'Aktif',              class: 'badge-success' },
  completed:      { label: 'Selesai',             class: 'badge-navy' },
  pending_review: { label: 'Menunggu Kurasi',     class: 'badge-warning' },
  payment_pending:{ label: 'Menunggu Pembayaran', class: 'badge-gold' },
  rejected:       { label: 'Ditolak',             class: 'badge-danger' },
};

function StudentDashboardContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const payParam = searchParams.get('pay');

  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading]           = useState(true);
  const [payingId, setPayingId]         = useState<number | null>(null);
  const hasAutoTriggeredRef             = useRef(false);

  // Pastikan skrip Midtrans Snap sudah siap
  const ensureSnapLoaded = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.snap) {
        return resolve();
      }
      const existingScript = document.querySelector('script[src*="midtrans"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-iJaslbVJufkmXRhn');
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.body.appendChild(script);
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((typeof window !== 'undefined' && window.snap) || attempts > 25) {
            clearInterval(interval);
            resolve();
          }
        }, 150);
      }
    });
  };

  const loadData = useCallback(async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/enrollments'),
        api.get('/certificates'),
      ]);
      setEnrollments(eRes.data.data ?? []);
      setCertificates(cRes.data.data ?? []);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Fungsi Pembayaran Midtrans Snap ─────────────────────────────────────────
  const handlePay = useCallback(async (enrollmentId: number, courseSlug?: string) => {
    setPayingId(enrollmentId);
    await ensureSnapLoaded();

    try {
      const res = await api.post('/payments/create-snap-token', { enrollment_id: enrollmentId });
      const snapToken = res.data.data?.snap_token;
      const redirectUrl = res.data.data?.redirect_url;

      if (res.data.data?.is_paid) {
        alert('Pembayaran terverifikasi lunas! Kursus kamu sudah aktif.');
        await loadData();
        setPayingId(null);
        return;
      }

      if (typeof window !== 'undefined' && window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await api.post('/payments/verify-status', { enrollment_id: enrollmentId }).catch(() => {});
            alert('Pembayaran berhasil! Kursus kamu sudah aktif.');
            await loadData();
            if (courseSlug) {
              router.push(`/student/courses/${courseSlug}`);
            }
          },
          onPending: async () => {
            alert('Menunggu pembayaran selesai. Silakan selesaikan instruksi pembayaran.');
            await loadData();
          },
          onError: () => {
            alert('Pembayaran gagal atau dibatalkan.');
          },
          onClose: async () => {
            try {
              const v = await api.post('/payments/verify-status', { enrollment_id: enrollmentId });
              if (v.data?.data?.is_active) {
                alert('Pembayaran terverifikasi lunas! Kursus kamu sudah aktif.');
              }
            } catch { /* ignore */ }
            await loadData();
            setPayingId(null);
          },
        });
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert('Gagal memuat pop-up pembayaran Midtrans. Silakan coba klik tombol "Bayar Sekarang".');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal memproses pembayaran Midtrans.');
    } finally {
      setPayingId(null);
    }
  }, [loadData, router]);

  // ── Auto-trigger Pop-up Pembayaran saat Login / Masuk Dashboard ──────────────
  useEffect(() => {
    if (loading || hasAutoTriggeredRef.current) return;

    const handleAutoPayment = async () => {
      // Skenario A: User dialihkan dengan query ?pay=[course-slug]
      if (payParam) {
        hasAutoTriggeredRef.current = true;
        window.history.replaceState({}, '', '/student/dashboard');

        // Cari enrollment yang cocok dengan slug kursus
        let targetEnroll = enrollments.find(e => e.course?.slug === payParam);

        if (!targetEnroll) {
          // Jika belum terdaftar di database, buat enrollment terlebih dahulu
          try {
            const courseRes = await api.get(`/courses/${payParam}`);
            const targetCourse = courseRes.data.data as Course;
            if (targetCourse?.id) {
              const enrollRes = await api.post('/enrollments', { course_id: targetCourse.id });
              targetEnroll = enrollRes.data.data;
              await loadData();
            }
          } catch (err) {
            console.error('Failed to auto-enroll for payment:', err);
          }
        }

        if (targetEnroll) {
          if (targetEnroll.status === 'payment_pending') {
            handlePay(targetEnroll.id, targetEnroll.course?.slug ?? payParam);
          } else if (targetEnroll.status === 'active') {
            alert('Kursus pilihanmu sudah aktif di dashboard kamu.');
          }
        }
        return;
      }

      // Skenario B: User baru saja login dan memiliki kursus yang menunggu pembayaran
      const pendingEnroll = enrollments.find(e => e.status === 'payment_pending');
      if (pendingEnroll) {
        hasAutoTriggeredRef.current = true;
        handlePay(pendingEnroll.id, pendingEnroll.course?.slug);
      }
    };

    handleAutoPayment();
  }, [loading, payParam, enrollments, handlePay, loadData]);

  const stats = [
    { number: enrollments.filter(e => e.status === 'active').length,         label: 'Kursus Aktif',   icon: 'book-1' },
    { number: enrollments.filter(e => e.status === 'payment_pending').length, label: 'Menunggu Bayar', icon: 'credit-card-multiple' },
    { number: enrollments.filter(e => e.status === 'completed').length,       label: 'Kursus Selesai', icon: 'check-circle-1' },
    { number: certificates.length,                                             label: 'Sertifikat',     icon: 'certificate-badge-1' },
  ];

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">
          Selamat datang, {user?.name?.split(' ')[0] ?? 'Peserta'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{user?.country ?? user?.institution}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="mb-2 text-navy"><Icon name={s.icon} size={28} /></div>
            <div className="stat-number">{loading ? '—' : s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kursus Saya */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-navy-dark">Kursus Saya</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daftar kursus terdaftar dan status pembelajaran kamu</p>
          </div>
          <Link href="/#kursus" className="btn btn-outline btn-sm">
            + Tambah Kursus
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3"><Icon name="books-2" size={48} /></div>
            <p className="text-slate-500 text-sm">Kamu belum mendaftar kursus apapun.</p>
            <Link href="/#kursus" className="btn btn-primary btn-sm mt-4 inline-flex">
              Lihat Katalog Kursus
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {enrollments.map(e => {
              const isPending = e.status === 'payment_pending';
              const isActive = e.status === 'active';

              return (
                <div
                  key={e.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    isPending
                      ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                      : 'border-slate-100 hover:border-navy/20 hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-navy-dark truncate">{e.course.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{e.course.certification_level.name}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`badge ${statusLabel[e.status]?.class ?? 'badge-pending'}`}>
                      {statusLabel[e.status]?.label ?? e.status}
                    </span>

                    {/* Tombol Bayar Sekarang jika Menunggu Pembayaran */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handlePay(e.id, e.course.slug)}
                        disabled={payingId === e.id}
                        className="btn btn-gold btn-sm text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                      >
                        <Icon name="credit-card-multiple" size={14} />
                        <span>{payingId === e.id ? 'Memuat Snap...' : 'Bayar Sekarang'}</span>
                      </button>
                    )}

                    {/* Tombol Mulai Belajar jika Aktif */}
                    {isActive && (
                      <Link
                        href={`/student/courses/${e.course.slug}`}
                        className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>Mulai Belajar</span>
                        <Icon name="arrow-right" size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sertifikat Terbaru */}
      {certificates.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy-dark">Sertifikat Terbaru</h2>
            <Link href="/student/certificates" className="text-sm text-navy font-semibold hover:text-gold transition-colors">
              Lihat Semua <Icon name="arrow-right" size={14} className="ml-1.5" />
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
                <div className="text-2xl mb-2"><Icon name="certificate-badge-1" size={24} /></div>
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

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat dashboard peserta...</div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
