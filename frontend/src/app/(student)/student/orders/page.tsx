'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import type { Enrollment } from '@/types';
import { showSuccess, showError, showWarning, showConfirm } from '@/lib/swal';

const statusBadgeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  active: {
    label: 'Lunas / Aktif',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  completed: {
    label: 'Selesai',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  payment_pending: {
    label: 'Menunggu Pembayaran',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  rejected: {
    label: 'Ditolak',
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

type FilterStatus = 'ALL' | 'PENDING' | 'PAID' | 'CANCELLED';

export default function StudentOrdersPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Pastikan skrip Midtrans Snap siap
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

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/enrollments');
      setEnrollments(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePay = async (enrollmentId: number, courseSlug?: string) => {
    setPayingId(enrollmentId);
    await ensureSnapLoaded();

    try {
      const res = await api.post('/payments/create-snap-token', { enrollment_id: enrollmentId });
      const snapToken = res.data.data?.snap_token;
      const redirectUrl = res.data.data?.redirect_url;

      if (res.data.data?.is_paid) {
        showSuccess('Pembayaran Terverifikasi', 'Pembayaran terverifikasi lunas! Kursus Anda sudah aktif.');
        await loadOrders();
        setPayingId(null);
        return;
      }

      if (typeof window !== 'undefined' && window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await api.post('/payments/verify-status', { enrollment_id: enrollmentId }).catch(() => {});
            showSuccess('Pembayaran Berhasil!', 'Selamat! Kursus Anda sudah aktif.');
            await loadOrders();
            if (courseSlug) {
              router.push(`/student/courses/${courseSlug}`);
            }
          },
          onPending: async () => {
            showWarning('Menunggu Pembayaran', 'Silakan selesaikan pembayaran sesuai instruksi di portal.');
            await loadOrders();
          },
          onError: () => {
            showError('Pembayaran Gagal', 'Pembayaran gagal atau dibatalkan.');
          },
          onClose: async () => {
            try {
              const v = await api.post('/payments/verify-status', { enrollment_id: enrollmentId });
              if (v.data?.data?.is_active) {
                showSuccess('Pembayaran Terverifikasi', 'Pembayaran terverifikasi lunas! Kursus Anda sudah aktif.');
              }
            } catch {
              /* ignore */
            }
            await loadOrders();
            setPayingId(null);
          },
        });
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        showError('Gagal Memuat Pembayaran', 'Gagal memuat pop-up pembayaran Midtrans.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal Memproses Pembayaran', msg ?? 'Gagal memproses pembayaran Midtrans.');
    } finally {
      setPayingId(null);
    }
  };

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
      await api.delete(`/enrollments/${enrollmentId}`);
      showSuccess('Pesanan Dibatalkan', `Pesanan untuk "${courseTitle}" telah dibatalkan.`);
      await loadOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal Membatalkan', msg ?? 'Gagal membatalkan pesanan.');
    } finally {
      setCancellingId(null);
    }
  };

  // Filter & Search Logic
  const filteredOrders = enrollments.filter((e) => {
    // Status Filter
    if (statusFilter === 'PENDING' && e.status !== 'payment_pending') return false;
    if (statusFilter === 'PAID' && !['active', 'completed'].includes(e.status)) return false;
    if (statusFilter === 'CANCELLED' && e.status !== 'cancelled') return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = e.course?.title?.toLowerCase().includes(q);
      const orderMatch = (e.order_id || `#ENR-${e.id}`).toLowerCase().includes(q);
      return titleMatch || orderMatch;
    }

    return true;
  });

  const countPending = enrollments.filter((e) => e.status === 'payment_pending').length;
  const countPaid = enrollments.filter((e) => ['active', 'completed'].includes(e.status)).length;
  const countCancelled = enrollments.filter((e) => e.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-fadeup pb-10">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-sky-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Manajemen Transaksi & Tagihan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#07192C] font-heading tracking-tight">
            Riwayat Pembelian
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl">
            Tinjau seluruh riwayat transaksi, nomor pesanan resmi, serta status tagihan kursus pelatihan Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/catalog"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#07192C] hover:bg-[#0284c7] transition-all shadow-xs flex items-center gap-2 font-heading"
          >
            <Icon name="books-2" size={16} className="text-amber-400" />
            <span>Katalog Kursus</span>
          </Link>
          <Link
            href="/student/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 font-heading"
          >
            <Icon name="home-2" size={15} className="text-slate-600" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pesanan</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Icon name="receipt" size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#07192C]">{loading ? '—' : enrollments.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu Bayar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Icon name="credit-card-multiple" size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{loading ? '—' : countPending}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Lunas / Berhasil</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Icon name="check-circle-1" size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{loading ? '—' : countPaid}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dibatalkan</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Icon name="xmark-circle" size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-600">{loading ? '—' : countCancelled}</div>
        </div>
      </div>

      {/* Main Order History Table / Card Layout */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.03)]">
        {/* Controls: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#07192C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({enrollments.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-[#07192C] shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Menunggu Bayar ({countPending})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lunas ({countPaid})
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'CANCELLED'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dibatalkan ({countCancelled})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul kursus / order ID..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mx-auto mb-3">
              <Icon name="receipt" size={28} />
            </div>
            <h3 className="font-bold text-base text-[#07192C] mb-1">Tidak Ada Riwayat Transaksi</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {search
                ? 'Tidak ditemukan transaksi yang cocok dengan kata kunci pencarian.'
                : 'Anda belum memiliki transaksi pesanan pada kategori filter ini.'}
            </p>
            <Link
              href="/student/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#07192C] hover:bg-[#0284c7] transition-all shadow-xs"
            >
              <span>Jelajahi Katalog Kursus</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((e) => {
              const isPending = e.status === 'payment_pending';
              const isCancelled = e.status === 'cancelled';
              const badgeCfg = statusBadgeConfig[e.status] ?? {
                label: e.status,
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                border: 'border-slate-200',
              };
              const formattedDate = e.created_at
                ? new Date(e.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';
              const amount = Number(e.final_payment_amount ?? e.course?.price ?? 0);

              return (
                <div
                  key={e.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                    isPending
                      ? 'border-amber-200/90 bg-amber-50/20 hover:border-amber-300'
                      : isCancelled
                      ? 'border-slate-200/50 bg-slate-50/50 opacity-80'
                      : 'border-slate-200/70 bg-white hover:border-sky-300 hover:shadow-xs'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-sm sm:text-base text-[#07192C] truncate">
                        {e.course.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                        {e.order_id || `#ENR-${e.id}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Icon name="calendar-days" size={12} className="text-slate-400" />
                        <span>{formattedDate}</span>
                      </span>
                      <span>•</span>
                      <span>{e.batch ? e.batch.batch_name : 'Jalur Mandiri (Self-Paced)'}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">
                        {amount > 0 ? `Rp${amount.toLocaleString('id-ID')}` : 'Gratis'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.border}`}
                    >
                      {badgeCfg.label}
                    </span>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(e.id, e.course.title)}
                          disabled={cancellingId === e.id}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          title="Batalkan pesanan ini"
                        >
                          <Icon name="trash" size={13} />
                          <span>{cancellingId === e.id ? '...' : 'Batalkan'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePay(e.id, e.course.slug)}
                          disabled={payingId === e.id}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-[#07192C] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-heading"
                        >
                          <Icon name="credit-card-multiple" size={14} />
                          <span>{payingId === e.id ? 'Memuat Snap...' : 'Bayar Sekarang'}</span>
                        </button>
                      </div>
                    )}


                    {isCancelled && (
                      <Link
                        href="/student/catalog"
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1 font-heading"
                      >
                        <Icon name="rotate-ccw-1" size={12} />
                        <span>Pesan Ulang</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
