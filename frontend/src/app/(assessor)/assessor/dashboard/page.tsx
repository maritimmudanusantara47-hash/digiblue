'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LineIcon from '@/components/LineIcon';

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
  const [data, setData] = useState<SubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/submissions?status=pending&per_page=5'),
      api.get('/submissions?status=graded&per_page=1'),
    ]).then(([pending, graded]) => {
      const pendingData = pending.data.data;
      const list = Array.isArray(pendingData) ? pendingData : pendingData?.data ?? [];
      const pendingTotal = pendingData?.meta?.total ?? list.length;
      const gradedTotal = graded.data.data?.meta?.total ?? 0;

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

  const TYPE_LABEL: Record<string, { label: string; icon: string }> = {
    essay_task: { label: 'Esai', icon: 'pencil-1' },
    oral_video_task: { label: 'Video Oral', icon: 'camera-movie-1' },
    mcq_quiz: { label: 'Pilihan Ganda', icon: 'check-circle-1' },
  };

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Assessor Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Panel penilaian tugas peserta DigiBlueCamp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500 to-amber-400 text-white shadow-md">
          <LineIcon name="hourglass" className="text-3xl mb-2 text-white/80" />
          <div className="text-4xl font-extrabold">{loading ? '—' : data?.pending_count ?? 0}</div>
          <div className="text-white/70 text-sm mt-1">Tugas Menunggu Penilaian</div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-md">
          <LineIcon name="check-circle-1" className="text-3xl mb-2 text-white/80" />
          <div className="text-4xl font-extrabold">{loading ? '—' : data?.graded_count ?? 0}</div>
          <div className="text-white/70 text-sm mt-1">Tugas Sudah Dinilai</div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-dark">Tugas Terbaru Belum Dinilai</h2>
          <Link
            href="/assessor/submissions"
            className="btn btn-secondary btn-sm inline-flex items-center gap-1"
          >
            Lihat Semua
            <LineIcon name="arrow-right" className="text-sm" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : !data?.recent?.length ? (
          <div className="text-center py-10 text-slate-400">
            <LineIcon name="trophy-1" className="text-4xl mx-auto mb-3 text-emerald-400" />
            <p>Semua tugas sudah dinilai!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.recent.map(sub => {
              const typeInfo = TYPE_LABEL[sub.content?.content_type];
              return (
                <Link key={sub.id} href={`/assessor/submissions/${sub.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-navy/20 hover:shadow-sm transition-all group">
                  <div>
                    <p className="font-semibold text-sm text-navy-dark group-hover:text-navy">
                      {sub.content?.title ?? 'Tugas'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      {sub.user?.name}
                      {typeInfo && <><span>•</span> <span className="inline-flex items-center gap-1"><LineIcon name={typeInfo.icon} className="text-xs" />{typeInfo.label}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(sub.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <LineIcon name="arrow-right" className="text-sm text-navy" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}