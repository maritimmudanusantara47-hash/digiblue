'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ScholarshipApplication } from '@/types';

const decisionLabels: Record<string, { label: string; cls: string }> = {
  pending:             { label: 'Menunggu',    cls: 'badge-warning' },
  approved_fully:      { label: 'Fully Funded',cls: 'badge-success' },
  approved_partial_a:  { label: 'Partial A',   cls: 'badge-navy' },
  approved_partial_b:  { label: 'Partial B',   cls: 'badge-gold' },
  rejected:            { label: 'Ditolak',     cls: 'badge-danger' },
};

export default function AdminScholarshipPage() {
  const [apps, setApps]       = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');
  const [deciding, setDeciding] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await api.get('/admin/scholarships', { params: { search, status: filter } });
    setApps(res.data.data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search, filter]);

  const decide = async (id: number, decision: string) => {
    setDeciding(id);
    try {
      await api.patch(`/admin/scholarships/${id}/decide`, { decision });
      fetchData();
    } finally { setDeciding(null); }
  };

  return (
    <div className="animate-fadeup">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-dark">Kurasi Beasiswa</h1>
        <p className="text-slate-500 text-sm mt-1">Tinjau dan putuskan pengajuan beasiswa peserta</p>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6">
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="Cari nama peserta..."
            className="form-input flex-1 min-w-[200px]"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved_fully">Fully Funded</option>
            <option value="approved_partial_a">Partial A</option>
            <option value="approved_partial_b">Partial B</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Peserta</th>
              <th>Kursus</th>
              <th>Level</th>
              <th>Tanggal Daftar</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : apps.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Tidak ada pengajuan beasiswa</td></tr>
            ) : apps.map(app => (
              <tr key={app.id}>
                <td>
                  <p className="font-semibold text-sm">{app.enrollment.user.name}</p>
                  <p className="text-xs text-slate-400">{app.enrollment.user.email}</p>
                </td>
                <td className="text-sm max-w-[200px] truncate">{app.enrollment.course.title}</td>
                <td><span className="badge badge-navy text-xs">{app.enrollment.course.certification_level.name}</span></td>
                <td className="text-sm text-slate-500">
                  {new Date(app.created_at).toLocaleDateString('id-ID')}
                </td>
                <td>
                  <span className={`badge ${decisionLabels[app.decision_status]?.cls}`}>
                    {decisionLabels[app.decision_status]?.label ?? app.decision_status}
                  </span>
                </td>
                <td>
                  {app.decision_status === 'pending' && (
                    <div className="flex gap-1 flex-wrap">
                      {[
                        { label: 'Fully Funded', d: 'approved_fully',     cls: 'bg-emerald-500 text-white' },
                        { label: 'Partial A',    d: 'approved_partial_a', cls: 'bg-navy text-white' },
                        { label: 'Partial B',    d: 'approved_partial_b', cls: 'bg-gold text-navy-dark' },
                        { label: 'Tolak',        d: 'rejected',           cls: 'bg-red-500 text-white' },
                      ].map(btn => (
                        <button key={btn.d}
                          onClick={() => decide(app.id, btn.d)}
                          disabled={deciding === app.id}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${btn.cls} 
                                      hover:opacity-80 disabled:opacity-50 transition-all`}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {app.decision_status !== 'pending' && (
                    <span className="text-xs text-slate-400">Sudah diputuskan</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
