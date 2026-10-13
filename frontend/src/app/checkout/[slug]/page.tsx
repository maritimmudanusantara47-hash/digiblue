'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback, use, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course } from '@/types';
import { showSuccess, showError, showWarning } from '@/lib/swal';

const LEVEL_STYLE: Record<string, { badge: string; card: string; tag: string }> = {
  FND:  { badge: 'bg-amber-100 text-amber-800 border border-amber-300', card: 'from-amber-500 to-amber-600', tag: 'FOUNDATION LEVEL' },
  SPEC: { badge: 'bg-navy/10 text-navy border border-navy/30',            card: 'from-navy to-navy-light',   tag: 'SPECIALIZATION LEVEL' },
  NAT:  { badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300', card: 'from-emerald-500 to-emerald-600', tag: 'NATIONAL TRAINING' },
  SGL:  { badge: 'bg-purple-100 text-purple-800 border border-purple-300', card: 'from-purple-500 to-purple-700', tag: 'SINGLE MODUL' },
};

function CheckoutContent({ params }: { params?: Promise<{ slug: string }> }) {
  const router = useRouter();
  const routeParams = useParams();
  const resolvedParams = params ? use(params) : null;
  const slug = (resolvedParams?.slug || routeParams?.slug) as string;

  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse]         = useState<Course | null>(null);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const hasAutoTriggeredRef         = useRef(false);

  // Pastikan login sebelum checkout (Intent Redirection)
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (!isAuthenticated && !token && slug) {
      router.replace(`/register?redirect=${encodeURIComponent(`/checkout/${slug}`)}`);
    }
  }, [isAuthenticated, slug, router]);

  const loadCourse = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get(`/courses/${slug}`);
      setCourse(res.data.data);
    } catch {
      setErrorMsg('Gagal memuat rincian kursus untuk checkout.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // Pastikan skrip Snap Midtrans sudah dimuat di browser
  const ensureSnapLoaded = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.snap) {
        return resolve();
      }

      // Periksa apakah script tag sudah ada di DOM
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

  // ── Snap Midtrans Pop-up ───────────────────────────────────────────────────
  const triggerSnapPayment = useCallback(async (snapToken: string, enrollmentId: number, courseSlug: string) => {
    await ensureSnapLoaded();

    const trigger = () => {
      if (typeof window !== 'undefined' && window.snap && snapToken) {
        setProcessing(false);
        window.snap.pay(snapToken, {
          // [FE] Tangani callback onSuccess
          onSuccess: async () => {
            await api.post('/payments/verify-status', { enrollment_id: enrollmentId }).catch(() => {});
            await showSuccess('Pembayaran Berhasil!', 'Mengarahkan ke materi kursus...');
            router.replace(`/student/courses/${courseSlug}`);
          },
          // [FE] Tangani callback onPending
          onPending: async () => {
            await showWarning('Menunggu Pembayaran', 'Silakan selesaikan instruksi pembayaran Midtrans.');
            router.replace('/student/dashboard');
          },
          // [FE] Tangani callback onError
          onError: () => {
            showError('Pembayaran Gagal', 'Pembayaran gagal atau dibatalkan.');
            setProcessing(false);
          },
          // Pengguna menutup popup
          onClose: async () => {
            try {
              const v = await api.post('/payments/verify-status', { enrollment_id: enrollmentId });
              if (v.data?.data?.is_active) {
                await showSuccess('Pembayaran Terverifikasi', 'Pembayaran terverifikasi lunas!');
                router.replace(`/student/courses/${courseSlug}`);
                return;
              }
            } catch { /* ignore */ }
            setProcessing(false);
          },
        });
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (typeof window !== 'undefined' && window.snap && snapToken) {
            clearInterval(interval);
            trigger();
          } else if (attempts > 15) {
            clearInterval(interval);
            showError('Gagal Memuat Pembayaran', 'Gagal memuat pop-up pembayaran Midtrans. Silakan klik tombol "Lanjut ke Pembayaran" untuk mencoba lagi.');
            setProcessing(false);
          }
        }, 200);
      }
    };

    trigger();
  }, [router]);

  // ── Tombol / Alur "Lanjut ke Pembayaran" ───────────────────────────────────
  const handleProceedPayment = useCallback(async () => {
    if (!course) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      // 1. Buat atau dapatkan enrollment
      const enrollRes = await api.post('/enrollments', { course_id: course.id });
      const enrollment = enrollRes.data.data;

      // Jika sudah terdaftar dan benar-benar lunas terbayar sebelumnya
      if ((enrollment.status === 'active' || enrollment.status === 'completed') && enrollment.paid_at) {
        await showSuccess('Pendaftaran Berhasil!', 'Kursus kamu sudah aktif.');
        router.replace(`/student/courses/${course.slug}`);
        return;
      }

      // Inisialisasi token Snap Midtrans
      const snapRes = await api.post('/payments/create-snap-token', { enrollment_id: enrollment.id });
      const snapToken = snapRes.data.data?.snap_token;

      if (snapRes.data.data?.is_paid) {
        await showSuccess('Pembayaran Terverifikasi', 'Pembayaran terverifikasi lunas!');
        router.replace(`/student/courses/${course.slug}`);
        return;
      }

      if (snapToken) {
        await triggerSnapPayment(snapToken, enrollment.id, course.slug);
      } else if (snapRes.data.data?.redirect_url) {
        window.location.href = snapRes.data.data.redirect_url;
      } else {
        throw new Error('Gagal mendapatkan token pembayaran Midtrans.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? 'Terjadi kesalahan saat memproses pembayaran.');
      setProcessing(false);
    }
  }, [course, router, triggerSnapPayment]);

  // ── Auto-trigger Popup Pembayaran Begitu User Login & Data Kursus Siap ────
  useEffect(() => {
    const token = Cookies.get('auth_token');
    const isUserLoggedIn = isAuthenticated || !!token;

    if (course && isUserLoggedIn && !loading && !hasAutoTriggeredRef.current) {
      hasAutoTriggeredRef.current = true;
      handleProceedPayment();
    }
  }, [course, isAuthenticated, loading, handleProceedPayment]);

  if (loading) {
    return (
      <div className="container px-4 py-16 max-w-4xl mx-auto flex-1 animate-pulse space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="card p-8 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container px-4 py-20 max-w-md mx-auto text-center flex-1">
        <Icon name="search-1" size={40} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-navy-dark">Kursus Tidak Ditemukan</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">Program kursus yang kamu pilih tidak tersedia.</p>
        <Link href="/courses" className="btn btn-primary">Kembali ke Katalog Kursus</Link>
      </div>
    );
  }

  const code   = course.certification_level?.code ?? 'SPEC';
  const style  = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];
  const rawPrice = Number(course.price);
  const displayPrice = rawPrice > 0 ? rawPrice : 250000;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-700 relative">

      {/* Overlay Loading Pop-up Pembayaran */}
      {processing && (
        <div className="fixed inset-0 z-50 bg-navy-dark/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin h-8 w-8 text-navy" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-navy-dark text-lg mb-1">
              Menyiapkan Pembayaran...
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Pop-up gerbang pembayaran Midtrans sedang dipersiapkan. Mohon tunggu sebentar.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
              <Icon name="shield-2-check" size={16} className="text-emerald-500" />
              <span>Koneksi Aman Midtrans Snap</span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-navy transition-colors">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-navy transition-colors">Katalog Kursus</Link>
          <span>/</span>
          <span className="text-navy-dark font-bold">Checkout Pembayaran</span>
        </nav>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <Icon name="warning" size={18} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Kolom Kiri: Rincian Kursus & Data Diri Siswa */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rincian Kursus */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${style.card}`} />
              <div className="pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${style.badge} mb-3`}>
                  <Icon name="graduation-cap-1" size={13} />
                  {course.certification_level?.name ?? code}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-navy-dark leading-snug">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                    {course.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Icon name="book-1" size={16} className="text-navy" />
                    <span>{course.sections_count ?? 1} Bagian Materi</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Icon name="certificate-badge-1" size={16} className="text-emerald-600" />
                    <span>e-Sertifikat QR Code</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Icon name="stopwatch" size={16} className="text-amber-600" />
                    <span>Akses Selamanya</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Diri Peserta */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-navy-dark uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="user-4" size={16} className="text-navy" />
                Data Diri Peserta Terdaftar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">Nama Lengkap</p>
                  <p className="font-bold text-navy-dark mt-0.5">{user?.name ?? 'Peserta'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">Email Akun</p>
                  <p className="font-bold text-navy-dark mt-0.5">{user?.email ?? '-'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">Negara Asal</p>
                  <p className="font-bold text-navy-dark mt-0.5">{user?.country ?? 'Indonesia'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">Nomor WhatsApp</p>
                  <p className="font-bold text-navy-dark mt-0.5">{user?.phone_number || '-'}</p>
                </div>
              </div>
            </div>

            {/* Jaminan Pembayaran Aman */}
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-900 text-xs flex items-center gap-3">
              <Icon name="shield-2-check" size={20} className="text-sky-600 shrink-0" />
              <p>
                Transaksi diproses dengan aman menggunakan <strong>Midtrans Payment Gateway</strong> (QRIS, BCA/Mandiri/BRI Virtual Account, Gopay, Kartu Kredit).
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan Biaya / Diskon & Tombol Aksi */}
          <div className="lg:col-span-1 sticky top-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 flex flex-col gap-5">
              <h3 className="font-bold text-navy-dark text-base border-b border-slate-100 pb-3">
                Ringkasan Biaya & Diskon
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Harga Normal Kursus</span>
                  <span className="font-bold text-navy-dark">
                    Rp{displayPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Potongan Promo / Beasiswa</span>
                  <span className="font-semibold text-emerald-600">
                    - Rp 0
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Biaya Layanan & Admin</span>
                  <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="font-bold text-navy-dark text-sm sm:text-base">Total Tagihan</span>
                  <span className="font-black text-navy-dark text-lg sm:text-xl">
                    Rp{displayPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Tombol "Lanjut ke Pembayaran" */}
              <button
                id="btn-proceed-payment"
                onClick={handleProceedPayment}
                disabled={processing}
                className="btn btn-primary w-full text-sm font-bold py-3.5 shadow-md shadow-navy/20 cursor-pointer flex items-center justify-center gap-2 mt-2 transition-all hover:shadow-lg"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Menghubungkan Midtrans...
                  </span>
                ) : (
                  <><Icon name="credit-card-multiple" size={16} /> Lanjut ke Pembayaran Midtrans</>
                )}
              </button>

              <Link
                href="/courses"
                className="btn btn-secondary btn-sm text-xs text-center hover:bg-slate-100 py-2"
              >
                ← Batalkan & Kembali ke Katalog Kursus
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage({ params }: { params?: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Menyiapkan halaman checkout...</div>}>
      <CheckoutContent params={params} />
    </Suspense>
  );
}
