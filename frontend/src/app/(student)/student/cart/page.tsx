'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { showSuccess, showError, showWarning, showConfirm } from '@/lib/swal';

interface BatchOption {
  id: number;
  batch_name: string;
  batch_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export default function StudentCartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, removeItem, updateBatch, updateItemPrice, clearCart, getTotalPrice } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [batchesMap, setBatchesMap] = useState<Record<number, BatchOption[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchesErrorMap, setBatchesErrorMap] = useState<Record<number, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil daftar batch aktif dan sinkronkan harga terbaru untuk setiap kursus di keranjang
  const courseIdsKey = items.map((i) => i.courseId).sort().join(',');

  useEffect(() => {
    if (!mounted || !courseIdsKey) return;

    let isSubscribed = true;
    setLoadingBatches(true);
    setBatchesErrorMap({});

    const fetchBatches = async () => {
      const newBatches: Record<number, BatchOption[]> = {};
      const newErrors: Record<number, boolean> = {};

      try {
        const coursesRes = await api.get('/courses');
        const courseList: { id: number; price: number | string }[] = coursesRes.data?.data ?? [];
        if (isSubscribed) {
          courseList.forEach((c) => {
            updateItemPrice(c.id, Number(c.price) || 0);
          });
        }
      } catch {
        // Abaikan jika offline/gagal sync harga
      }

      const currentItems = useCartStore.getState().items;
      await Promise.all(
        currentItems.map(async (item) => {
          try {
            const res = await api.get(`/courses/${item.courseId}/batches?active_only=true&open_only=true&limit=1`);
            if (isSubscribed) {
              newBatches[item.courseId] = res.data.data ?? [];
            }
          } catch {
            if (isSubscribed) {
              newBatches[item.courseId] = [];
              newErrors[item.courseId] = true;
            }
          }
        })
      );
      if (isSubscribed) {
        currentItems.forEach((item) => {
          if (item.batchId && !(newBatches[item.courseId] ?? []).some((batch) => batch.id === item.batchId)) {
            useCartStore.getState().updateBatch(item.courseId, null, null, false);
          }
        });
        setBatchesMap(newBatches);
        setBatchesErrorMap(newErrors);
        setLoadingBatches(false);
      }
    };

    fetchBatches();

    return () => {
      isSubscribed = false;
    };
  }, [mounted, courseIdsKey, refreshKey]);

  // Helper pemuatan Midtrans Snap jika belum siap di DOM
  const ensureSnapLoaded = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.snap) {
        resolve();
        return;
      }

      const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-iJaslbVJufkmXRhn';

      const existingScript = document.querySelector(`script[src="${snapUrl}"]`) as HTMLScriptElement | null;
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = snapUrl;
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (typeof window !== 'undefined' && window.snap) {
            clearInterval(interval);
            resolve();
          }
        }, 150);
      }
    });
  };

  const handleRemove = async (courseId: number, title: string) => {
    const confirmed = await showConfirm(
      'Hapus Kursus?',
      `Apakah Anda yakin ingin menghapus "${title}" dari keranjang?`,
      'Ya, Hapus',
      true
    );
    if (confirmed) {
      removeItem(courseId);
    }
  };

  const handleCheckout = async () => {
    const unselectedCourse = items.find((item) => !(item.scheduleSelected ?? !!item.batchId));
    if (unselectedCourse) {
      showWarning(
        'Pilih Angkatan Terlebih Dahulu',
        `Silakan tentukan jadwal/angkatan untuk kursus "${unselectedCourse.title}" terlebih dahulu sebelum melakukan pembayaran.`
      );
      return;
    }

    const token = Cookies.get('auth_token');
    const isAuth = isAuthenticated || !!token;

    if (!isAuth) {
      router.push(`/login?redirect=${encodeURIComponent('/student/cart')}`);
      return;
    }

    if (user && !user.email_verified_at) {
      showWarning(
        'Verifikasi Email Diperlukan',
        'Silakan verifikasi email Anda terlebih dahulu sebelum melanjutkan pembayaran kursus.'
      );
      return;
    }

    setProcessingCheckout(true);

    try {
      const payload = {
        items: items.map((item) => ({
          course_id: item.courseId,
          batch_id: item.batchId || null,
        })),
      };

      const res = await api.post('/payments/checkout-cart', payload);
      const data = res.data?.data;

      // Kasus semua kursus gratis (Rp 0)
      if (data?.is_free) {
        await showSuccess('Pendaftaran Berhasil!', 'Semua kursus gratis telah aktif di akun Anda.');
        clearCart();
        router.push('/student/dashboard');
        return;
      }

      // Kasus transaksi Midtrans Snap
      const snapToken = data?.snap_token;
      const orderId = data?.order_id;

      if (!snapToken) {
        throw new Error('Snap token tidak diterima dari server.');
      }

      await ensureSnapLoaded();

      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            if (orderId) {
              await api.post('/payments/verify-status', { order_id: orderId }).catch(() => {});
            }
            await showSuccess('Pembayaran Berhasil!', 'Selamat! Semua kursus pilihan Anda sudah aktif.');
            clearCart();
            router.push('/student/dashboard?payment=success');
          },
          onPending: async () => {
            await showSuccess(
              'Menunggu Pembayaran',
              'Pesanan Anda telah dicatat. Silakan selesaikan pembayaran sesuai instruksi di portal siswa.'
            );
            clearCart();
            router.push('/student/dashboard');
          },
          onError: () => {
            showError('Pembayaran Gagal', 'Transaksi gagal diproses oleh gateway. Silakan coba lagi.');
          },
          onClose: () => {
            showWarning('Pembayaran Ditutup', 'Anda dapat melanjutkan pembayaran kapan saja di Dashboard Siswa.');
            clearCart();
            router.push('/student/dashboard');
          },
        });
      } else {
        // Fallback jika popup snap tidak terbuka
        if (data?.redirect_url) {
          window.location.href = data.redirect_url;
        }
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Gagal memproses pembayaran keranjang.';
      showError('Gagal Checkout', message);
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const hasUnselectedBatch = items.some((item) => !(item.scheduleSelected ?? !!item.batchId));

  return (
    <div className="space-y-8 animate-fadeup pb-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/student/dashboard" className="hover:text-sky-600 transition-colors flex items-center gap-1">
          <Icon name="home-2" size={14} />
          <span>Portal Siswa</span>
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/student/catalog" className="hover:text-sky-600 transition-colors">
          Katalog Kursus
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-bold">Keranjang Belanja</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#00162d] tracking-tight">
            Keranjang Belanja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tinjau kursus pilihan Anda, tentukan jadwal angkatan (batch) atau jalur mandiri, dan selesaikan pembayaran.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              showConfirm('Kosongkan Keranjang?', 'Semua item di keranjang akan dihapus.', 'Kosongkan', true).then((ok) => {
                if (ok) clearCart();
              });
            }}
            className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/50 cursor-pointer"
          >
            <Icon name="trash" size={14} />
            <span>Kosongkan Keranjang</span>
          </button>
        )}
      </div>

      {/* Content Layout */}
      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs max-w-xl mx-auto my-8">
          <div className="w-20 h-20 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-5 border border-sky-100 shadow-xs">
            <Icon name="cart" size={36} />
          </div>
          <h2 className="text-xl font-bold text-[#00162d] mb-2">Keranjang Anda Kosong</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            Anda belum menambahkan kursus apa pun. Jelajahi katalog sertifikasi ekonomi biru kami dan pilih topik yang ingin Anda kuasai.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/student/catalog"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase bg-[#00162d] text-white hover:bg-[#0f2b48] transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Icon name="books-2" size={16} />
              <span>Jelajahi Katalog Siswa</span>
            </Link>
            <Link
              href="/student/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="home-2" size={16} />
              <span>Dashboard Saya</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Main Cart Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List Item Kursus (2 Kolom) */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemBatches = batchesMap[item.courseId] || [];
              const formattedPrice =
                item.price > 0
                  ? `Rp ${Number(item.price).toLocaleString('id-ID')}`
                  : 'Gratis';

              return (
                <div
                  key={item.courseId}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-sky-300 transition-all flex flex-col sm:flex-row gap-5 items-start justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    {/* Badge Sertifikasi & Judul */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.levelName && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                          {item.levelName}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-400">
                        ID: #{item.courseId}
                      </span>
                    </div>

                    <Link
                      href={`/student/catalog/${item.slug}`}
                      className="text-base sm:text-lg font-bold text-[#00162d] hover:text-sky-600 transition-colors line-clamp-2 leading-snug group-hover:text-sky-600"
                    >
                      {item.title}
                    </Link>

                    {/* Dropdown Pemilihan Batch / Angkatan */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Icon name="timer" size={14} className="text-sky-500" />
                          <span>Pilihan Jadwal / Angkatan:</span>
                        </label>

                        {/* Badge Status Pemilihan Angkatan */}
                        {(item.scheduleSelected ?? !!item.batchId) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <span>✓</span>
                            <span>Angkatan Terpilih</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse shadow-2xs">
                            <span>⚠️</span>
                            <span>Wajib Pilih Angkatan</span>
                          </span>
                        )}
                      </div>

                      {loadingBatches ? (
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 w-full max-w-sm">
                          <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span className="font-medium">Memuat jadwal angkatan tersedia...</span>
                        </div>
                      ) : batchesErrorMap[item.courseId] ? (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 w-full max-w-sm">
                          <span className="truncate">Gagal memuat jadwal angkatan.</span>
                          <button
                            type="button"
                            onClick={() => setRefreshKey((k) => k + 1)}
                            className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 shrink-0 cursor-pointer"
                          >
                            Coba lagi
                          </button>
                        </div>
                      ) : (
                        <select
                          value={(item.scheduleSelected ?? !!item.batchId) ? (item.batchId ? String(item.batchId) : 'self-paced') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'self-paced') {
                              updateBatch(item.courseId, null, null, true);
                              return;
                            }
                            const selectedId = val ? Number(val) : null;
                            const matched = itemBatches.find((b) => b.id === selectedId);
                            updateBatch(item.courseId, selectedId, matched?.batch_name ?? null, !!selectedId);
                          }}
                          className={`w-full max-w-sm px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 ${
                            !item.batchId
                              ? 'border-2 border-amber-400 bg-amber-50/25 text-amber-950 focus:ring-amber-500/20 focus:border-amber-500'
                              : 'border border-slate-200 bg-slate-50 text-slate-800 focus:ring-sky-500/20 focus:border-sky-500'
                          }`}
                        >
                          <option value="" disabled>
                            -- Pilih Jadwal & Angkatan Belajar --
                          </option>
                          <option value="self-paced">Jalur Mandiri (Self-Paced / Mulai Sekarang)</option>
                          {itemBatches.map((b) => {
                            const dateRange =
                              b.start_date && b.end_date
                                ? ` (${new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(b.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`
                                : '';
                            return (
                              <option key={b.id} value={b.id}>
                                {b.batch_name} {b.batch_code ? `[${b.batch_code}]` : ''} {dateRange}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      <p className="text-[11px] mt-1.5">
                        {(item.scheduleSelected ?? !!item.batchId) ? (
                          <span className="text-emerald-700 font-medium">
                            {item.batchId ? 'Anda terdaftar pada sesi angkatan terbimbing bersama fasilitator.' : 'Anda memilih jalur mandiri dan dapat mulai belajar sekarang.'}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">
                            Silakan tentukan angkatan belajar di atas agar jadwal dan fasilitator Anda tercatat.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Harga & Tombol Hapus */}
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] font-semibold text-slate-400">Harga Kursus</span>
                      <span className="text-lg font-black text-sky-700">{formattedPrice}</span>
                    </div>

                    <button
                      onClick={() => handleRemove(item.courseId, item.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Hapus dari keranjang"
                      aria-label="Hapus dari keranjang"
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Tambah Kursus Lainnya Action */}
            <div className="pt-2">
              <Link
                href="/student/catalog"
                className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
              >
                <Icon name="plus" size={14} />
                <span>Tambah kursus lainnya ke keranjang</span>
              </Link>
            </div>
          </div>

          {/* Ringkasan Pesanan (1 Kolom Sticky) */}
          <div className="lg:col-span-1 sticky top-24">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#00162d]">Ringkasan Pembelian</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transaksi diproses secara aman & terverifikasi resmi.
                </p>
              </div>

              {/* Rincian Angka */}
              <div className="space-y-3 text-xs border-y border-slate-100 py-4">
                <div className="flex justify-between text-slate-600">
                  <span>Jumlah Kursus</span>
                  <span className="font-bold text-slate-900">{items.length} item</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Platform / Admin</span>
                  <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
                </div>
              </div>

              {/* Total Akhir */}
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-700">Total Pembayaran:</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#00162d]">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Tombol Lanjut ke Pembayaran */}
              <button
                onClick={handleCheckout}
                disabled={processingCheckout || items.length === 0 || hasUnselectedBatch || loadingBatches}
                className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  hasUnselectedBatch || processingCheckout || items.length === 0 || loadingBatches
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/60'
                    : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 active:scale-[0.99] text-white shadow-md hover:shadow-lg cursor-pointer'
                }`}
              >
                {processingCheckout ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyiapkan Pembayaran...</span>
                  </>
                ) : hasUnselectedBatch ? (
                  <>
                    <Icon name="alarm-clock" size={17} />
                    <span>Pilih Angkatan untuk Melanjutkan</span>
                  </>
                ) : (
                  <>
                    <Icon name="credit-card-multiple" size={17} />
                    <span>Lanjut ke Pembayaran</span>
                  </>
                )}
              </button>

              {/* Teks Pembantu / Warning jika masih ada angkatan belum dipilih */}
              {hasUnselectedBatch && items.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
                  <span className="text-amber-600 font-bold shrink-0 mt-0.5">⚠️</span>
                  <span>Pastikan Anda telah memilih jadwal angkatan untuk seluruh kursus di atas.</span>
                </div>
              )}

              {/* Jaminan Keamanan & Metode Pembayaran */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                  <Icon name="shield-2-check" size={16} className="text-emerald-500" />
                  <span>Pembayaran Aman via Midtrans</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mendukung pembayaran otomatis melalui QRIS (GoPay, OVO, Dana), Virtual Account (BCA, Mandiri, BNI, BRI), dan Kartu Kredit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
