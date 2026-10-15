'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Enrollment, Certificate } from '@/types';
import { showSuccess, showError, showWarning, showConfirm } from '@/lib/swal';

const statusBadgeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  active: {
    label: 'status_active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  completed: {
    label: 'status_completed',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  payment_pending: {
    label: 'status_payment_pending',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  rejected: {
    label: 'status_rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  cancelled: {
    label: 'Dibatalkan',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

function StudentDashboardContent() {
  const t = useTranslations('StudentDashboard');
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const payParam = searchParams.get('pay');
  const verifiedParam = searchParams.get('verified');

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [justVerified, setJustVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message: string; dev_url?: string | null; success: boolean } | null>(null);
  const hasAutoTriggeredRef = useRef(false);

  useEffect(() => {
    if (verifiedParam === '1') {
      setJustVerified(true);
      api.get('/auth/me').then((res) => {
        if (res.data?.data) {
          updateUser(res.data.data);
        }
      }).catch(() => { });
      window.history.replaceState({}, '', '/student/dashboard');
    }
  }, [verifiedParam, updateUser]);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setResendStatus(null);
    try {
      const res = await api.post('/auth/email/resend');
      setResendStatus({
        success: true,
        message: res.data.message || 'Tautan verifikasi email baru telah berhasil dikirim.',
        dev_url: res.data.dev_url || null,
      });
    } catch (err: any) {
      setResendStatus({
        success: false,
        message: err?.response?.data?.message || 'Gagal mengirim email verifikasi. Silakan coba sesaat lagi.',
      });
    } finally {
      setResendingEmail(false);
    }
  };

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
        showSuccess('Pembayaran Terverifikasi', 'Pembayaran terverifikasi lunas! Kursus kamu sudah aktif.');
        await loadData();
        setPayingId(null);
        return;
      }

      if (typeof window !== 'undefined' && window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await api.post('/payments/verify-status', { enrollment_id: enrollmentId }).catch(() => { });
            showSuccess('Pembayaran Berhasil!', 'Kursus kamu sudah aktif.');
            await loadData();
            if (courseSlug) {
              router.push(`/student/courses/${courseSlug}`);
            }
          },
          onPending: async () => {
            showWarning('Menunggu Pembayaran', 'Silakan selesaikan instruksi pembayaran.');
            await loadData();
          },
          onError: () => {
            showError('Pembayaran Gagal', 'Pembayaran gagal atau dibatalkan.');
          },
          onClose: async () => {
            try {
              const v = await api.post('/payments/verify-status', { enrollment_id: enrollmentId });
              if (v.data?.data?.is_active) {
                showSuccess('Pembayaran Terverifikasi', 'Pembayaran terverifikasi lunas! Kursus kamu sudah aktif.');
              }
            } catch { /* ignore */ }
            await loadData();
            setPayingId(null);
          },
        });
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        showError('Gagal Memuat Pembayaran', 'Gagal memuat pop-up pembayaran Midtrans. Silakan coba klik tombol "Bayar Sekarang".');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal Memproses Pembayaran', msg ?? 'Gagal memproses pembayaran Midtrans.');
    } finally {
      setPayingId(null);
    }
  }, [loadData, router]);

  const handleCancelOrder = async (enrollmentId: number, courseTitle: string) => {
    const confirmed = await showConfirm(
      'Batalkan Pesanan?',
      `Apakah Anda yakin ingin membatalkan pesanan untuk kursus "${courseTitle}"?`,
      'Ya, Batalkan',
      true
    );
    if (!confirmed) return;

    setCancellingId(enrollmentId);
    try {
      await api.delete(`/enrollments/${enrollmentId}/cancel`);
      await showSuccess('Pesanan Dibatalkan', 'Pesanan Anda telah berhasil dibatalkan.');
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal membatalkan pesanan.';
      showError('Gagal', msg);
    } finally {
      setCancellingId(null);
    }
  };

  // ── Auto-trigger Pop-up Pembayaran saat Login / Masuk Dashboard ──────────────
  useEffect(() => {
    if (loading || hasAutoTriggeredRef.current) return;

    const handleAutoPayment = async () => {
      if (payParam) {
        const targetEnrollment = enrollments.find(
          (e) => e.course?.slug === payParam && e.status === 'payment_pending'
        );
        if (targetEnrollment) {
          hasAutoTriggeredRef.current = true;
          window.history.replaceState({}, '', '/student/dashboard');
          handlePay(targetEnrollment.id, targetEnrollment.course?.slug);
        }
      }
    };

    handleAutoPayment();
  }, [loading, payParam, enrollments, handlePay]);

  const stats = [
    {
      number: enrollments.filter((e) => e.status === 'active').length,
      label: t('stat_active'),
      icon: 'book-1',
      colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      number: enrollments.filter((e) => e.status === 'payment_pending').length,
      label: t('stat_pending'),
      icon: 'credit-card-multiple',
      colorBadge: 'bg-amber-50 text-amber-700 border-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      number: enrollments.filter((e) => e.status === 'completed').length,
      label: t('stat_completed'),
      icon: 'check-circle-1',
      colorBadge: 'bg-sky-50 text-sky-700 border-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      number: certificates.length,
      label: t('stat_cert'),
      icon: 'certificate-badge-1',
      colorBadge: 'bg-amber-50 text-amber-700 border-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const foundationCompleted = enrollments.some(
    (e) =>
      (e.status === 'completed' || certificates.some((c) => c.enrollment_id === e.id || c.enrollment?.id === e.id)) &&
      e.course?.certification_level?.code === 'FND'
  );

  const activeCourses = enrollments.filter((e) => ['active', 'completed'].includes(e.status));
  const pendingCourses = enrollments.filter((e) => e.status === 'payment_pending');

  return (
    <div className="space-y-8 animate-fadeup pb-8">
      {/* Just Verified Success Alert */}
      {justVerified && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-start justify-between gap-3 text-emerald-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Icon name="check-circle-1" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950">Email Berhasil Diverifikasi!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Akun Anda telah aktif secara penuh. Anda sekarang dapat mengakses seluruh materi, silabus, dan mengumpulkan tugas.
              </p>
            </div>
          </div>
          <button
            onClick={() => setJustVerified(false)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
            aria-label="Tutup"
          >
            <Icon name="xmark" size={16} />
          </button>
        </div>
      )}

      {/* Unverified Email Warning Banner (Calm, ergonomic) */}
      {user && !user.email_verified_at && !justVerified && (
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Icon name="envelope-1" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#07192C]">Email Anda Belum Terverifikasi</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">Perhatian</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Silakan verifikasi email <span className="font-semibold text-[#07192C]">{user.email}</span> untuk membuka akses penuh materi pembelajaran.
              </p>
              {resendStatus && (
                <div className={`mt-2 p-2.5 rounded-xl text-xs ${resendStatus.success ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-300' : 'bg-rose-100/70 text-rose-900 border border-rose-300'}`}>
                  <span>{resendStatus.message}</span>
                  {resendStatus.dev_url && (
                    <div className="mt-2 pt-2 border-t border-emerald-200">
                      <span className="font-semibold mr-2">Dev Helper:</span>
                      <a
                        href={resendStatus.dev_url}
                        className="inline-flex items-center gap-1 font-bold text-emerald-800 underline hover:text-emerald-950"
                      >
                        Klik Verifikasi Langsung
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 self-end md:self-center">
            <button
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {resendingEmail ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-700/30 border-t-amber-700 rounded-full animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Icon name="envelope-1" size={14} />
                  <span>Kirim Ulang Verifikasi</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Student Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.04)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-sky-800 text-xs font-semibold mb-2.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Portal Pembelajar Blue Economy</span>
            {user?.country && (
              <>
                <span className="text-slate-300">•</span>
                <span>{user.country}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#07192C] font-heading tracking-tight">
            {t('title')} {user?.name?.split(' ')[0] ?? t('default_name')}
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-xl">
            Tingkatkan keahlian maritim dan sertifikasi resmi Anda bersama The Blue Economist.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_16px_-4px_rgba(7,25,44,0.03)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.colorBadge}`}>
                <Icon name={s.icon} size={20} className={s.iconColor} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#07192C] font-heading tracking-tight">
                {loading ? '—' : s.number}
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Kursus Saya (My Learning Track) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#07192C] font-heading">
              {t('section_courses')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('section_courses_desc')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/catalog"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors inline-flex items-center gap-1 group"
            >
              <span>{t('btn_add')}</span>
              <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {pendingCourses.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Icon name="credit-card-multiple" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-amber-950">
                  Ada {pendingCourses.length} pesanan menunggu pembayaran
                </h4>
                <p className="text-[11px] text-amber-800">
                  Selesaikan transaksi Anda di halaman Riwayat Pembelian agar akses modul kursus dapat segera aktif.
                </p>
              </div>
            </div>
            <Link
              href="/student/orders"
              className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-1.5 rounded-xl transition-colors shrink-0 self-start sm:self-auto inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Tagihan & Bayar →</span>
            </Link>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeCourses.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mx-auto mb-3">
              <Icon name="books-2" size={28} />
            </div>
            <h3 className="font-bold text-base text-[#07192C] mb-1">
              {t('empty_courses')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Pilih program Foundation atau Specialization untuk memulai pelatihan dan memperoleh sertifikasi resmi.
            </p>
            <Link
              href="/student/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#07192C] hover:bg-[#0284c7] transition-all shadow-xs"
            >
              <span>{t('btn_catalog')}</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCourses.map((e) => {
              const isActive = e.status === 'active';
              const isCompleted = e.status === 'completed';
              const isSpec = e.course?.certification_level?.code === 'SPEC';
              const accessBlocked = isSpec && !foundationCompleted;
              const badgeCfg = statusBadgeConfig[e.status] ?? {
                label: e.status,
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                border: 'border-slate-200',
              };

              return (
                <div
                  key={e.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/70 hover:border-sky-300 hover:bg-slate-50/40 hover:shadow-xs transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-[#07192C] truncate">
                        {e.course.title}
                      </h3>
                      {e.batch ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Icon name="flag-1" size={11} />
                          {e.batch.batch_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Jalur Mandiri (Self-Paced)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {e.course.certification_level.name}
                    </p>
                    {isActive && accessBlocked && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-lg px-2.5 py-1 mt-2 w-fit">
                        <Icon name="locked-1" size={13} className="text-amber-600 shrink-0" />
                        <span>Selesaikan kursus Foundation Level terlebih dahulu untuk membuka akses materi.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.border}`}>
                      {badgeCfg.label.startsWith('status_') ? t(badgeCfg.label as any) : badgeCfg.label}
                    </span>

                    {isActive && accessBlocked && (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1.5 cursor-not-allowed font-heading"
                        title="Selesaikan kursus Foundation Level terlebih dahulu untuk membuka materi ini."
                      >
                        <Icon name="locked-1" size={13} className="text-amber-600" />
                        <span>{t('btn_finish_fnd')}</span>
                      </button>
                    )}

                    {isActive && !accessBlocked && (
                      <Link
                        href={`/student/courses/${e.course.slug}`}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07192C] hover:bg-[#0284c7] text-white flex items-center gap-1.5 shadow-xs transition-all font-heading"
                      >
                        <span>{t('btn_start')}</span>
                        <Icon name="arrow-right" size={12} />
                      </Link>
                    )}

                    {isCompleted && (
                      <Link
                        href="/student/certificates"
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors flex items-center gap-1.5 font-heading"
                      >
                        <Icon name="certificate-badge-1" size={14} className="text-amber-500" />
                        <span>Lihat Sertifikat</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sertifikat Terbaru (Recent Certificates Showcase) */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.03)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#07192C] font-heading">
                {t('section_certs')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sertifikat digital terakreditasi resmi yang dapat Anda unduh dan diverifikasi secara publik
              </p>
            </div>
            <Link
              href="/student/certificates"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors inline-flex items-center gap-1 group"
            >
              <span>{t('btn_view_all')}</span>
              <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.slice(0, 2).map((cert) => (
              <div
                key={cert.id}
                className="relative overflow-hidden rounded-2xl border border-slate-800 p-5 bg-gradient-to-br from-[#07192C] via-[#0A2540] to-[#04111F] text-white shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                    <Icon name="certificate-badge-1" size={22} />
                  </div>
                  <span className="px-2.5 py-0.5 text-amber-300 text-[10px] font-bold">
                    {cert.enrollment.course.certification_level.name}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white mb-1 truncate">
                    {cert.enrollment.course.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mb-2">
                    <span>Grade: <strong className="text-amber-400">{cert.grade}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400">{cert.serial_number}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <Link
                    href={`/verify/${cert.serial_url_key || cert.serial_number}`}
                    target="_blank"
                    className="text-xs font-medium text-sky-300 hover:text-white transition-colors"
                  >
                    Cek Verifikasi ↗
                  </Link>
                  <Link
                    href="/student/certificates"
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
                  >
                    {t('btn_download_pdf')}
                  </Link>
                </div>
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          Memuat dashboard peserta...
        </div>
      }
    >
      <StudentDashboardContent />
    </Suspense>
  );
}
