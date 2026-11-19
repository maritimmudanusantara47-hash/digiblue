'use client';

import Icon from '@/components/Icon';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface SubmissionSummary {
  pending_count: number;
  graded_count: number;
  recent: {
    id: number;
    content: { title: string; content_type: string };
    user: { name: string };
    created_at: string;
  }[];
}

export default function AssessorDashboard() {
  const t = useTranslations('AssessorDashboard');
  const [data, setData] = useState<SubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/submissions?status=pending&per_page=5'),
      api.get('/submissions?status=graded&per_page=1'),
    ]).then(([pending, graded]) => {
      const pendingData = pending.data.data;
      const list = Array.isArray(pendingData) ? pendingData : pendingData?.data ?? [];
      const pendingTotal = pendingData?.total ?? pendingData?.meta?.total ?? list.length;

      const gradedData = graded.data.data;
      const gradedTotal = gradedData?.total ?? gradedData?.meta?.total ?? (Array.isArray(gradedData) ? gradedData.length : gradedData?.data?.length ?? 0);

      setData({
        pending_count: pendingTotal,
        graded_count: gradedTotal,
        recent: list.slice(0, 5),
      });
    })
      .catch((err) => {
        console.error('Failed to load assessor dashboard stats:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const getTypeBadge = (contentType: string) => {
    switch (contentType) {
      case 'essay_task':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Icon name="pen-to-square" size={13} className="text-amber-600" />
            <span>{t('lbl_essay')}</span>
          </span>
        );
      case 'oral_video_task':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Icon name="camera-movie-1" size={13} className="text-sky-600" />
            <span>{t('lbl_video')}</span>
          </span>
        );
      case 'mcq_quiz':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Icon name="clipboard" size={13} className="text-emerald-600" />
            <span>{t('lbl_mcq')}</span>
          </span>
        );
      case 'critical_thinking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Icon name="bulb-2" size={13} className="text-indigo-600" />
            <span>Critical Thinking</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
            <span>{contentType}</span>
          </span>
        );
    }
  };

  const totalAssessed = (data?.pending_count ?? 0) + (data?.graded_count ?? 0);

  return (
    <div className="space-y-8 animate-fadeup pb-8">
      {/* Assessor Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 text-amber-800 text-xs font-semibold mb-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Penilai Resmi Blue Economy Terakreditasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#07192C] font-heading tracking-tight">
            {t('title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/assessor/submissions"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#07192C] hover:bg-[#0284c7] transition-all shadow-xs flex items-center gap-2 font-heading"
          >
            <Icon name="pen-to-square" size={16} className="text-amber-400" />
            <span>Mulai Penilaian</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards: 3 Balanced Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pending Submissions */}
        <Link
          href="/assessor/submissions"
          className="group bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-amber-300 hover:shadow-[0_12px_30px_-10px_rgba(7,25,44,0.08)] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center transition-transform group-hover:scale-105">
                <Icon name="hourglass" size={22} className="text-amber-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-800">
                Membutuhkan Aksi
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#07192C] font-heading tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                data?.pending_count ?? 0
              )}
            </div>
            <p className="font-bold text-sm text-slate-800 mt-1">
              {t('stat_pending')}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Tugas studi kasus dan video oral peserta yang menunggu review
          </p>
        </Link>

        {/* Graded Submissions */}
        <Link
          href="/assessor/submissions"
          className="group bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-emerald-300 hover:shadow-[0_12px_30px_-10px_rgba(7,25,44,0.08)] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-transform group-hover:scale-105">
                <Icon name="check-circle-1" size={22} className="text-emerald-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                Selesai
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#07192C] font-heading tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                data?.graded_count ?? 0
              )}
            </div>
            <p className="font-bold text-sm text-slate-800 mt-1">
              {t('stat_graded')}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Telah diperiksa dan nilai diteruskan ke portal administrasi
          </p>
        </Link>

        {/* Total Handled */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                <Icon name="pen-to-square" size={22} className="text-sky-600" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100/70 text-sky-800">
                Total Arsip
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#07192C] font-heading tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                totalAssessed
              )}
            </div>
            <p className="font-bold text-sm text-slate-800 mt-1">
              Total Tugas Ditangani
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Rekapitulasi beban kerja evaluasi kompetensi tahun ini
          </p>
        </div>
      </div>

      {/* Recent Submissions List (Full Width) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(7,25,44,0.03)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#07192C] font-heading">
                {t('title_recent')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar tugas peserta yang menunggu peninjauan dan input skor
              </p>
            </div>
            <Link
              href="/assessor/submissions"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors inline-flex items-center gap-1 group"
            >
              <span>{t('btn_view_all')}</span>
              <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-18 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !data?.recent?.length ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Icon name="check-circle-1" size={26} />
              </div>
              <h3 className="font-bold text-base text-[#07192C] mb-1">
                {t('msg_all_graded')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Saat ini belum ada pengumpulan tugas baru yang menunggu penilaian. Anda dapat memeriksa arsip riwayat penilaian.
              </p>
              <Link
                href="/assessor/submissions"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#07192C] bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all"
              >
                <span>Buka Riwayat Penilaian</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/assessor/submissions?submissionId=${sub.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/70 hover:border-sky-300 hover:bg-slate-50/50 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-[#07192C] group-hover:text-amber-400 group-hover:border-[#07192C] transition-colors">
                      {sub.user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#07192C] group-hover:text-sky-700 transition-colors truncate">
                        {sub.content?.title ?? t('lbl_task')}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="font-semibold text-slate-700">{sub.user?.name}</span>
                        <span>•</span>
                        <span>{new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {getTypeBadge(sub.content?.content_type)}
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#07192C] text-slate-700 group-hover:text-white text-xs font-bold transition-colors flex items-center gap-1">
                      <span>Beri Nilai</span>
                      <Icon name="arrow-right" size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
