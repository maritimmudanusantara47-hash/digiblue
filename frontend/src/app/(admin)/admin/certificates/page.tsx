'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Certificate } from '@/types';

export default function AdminCertificatesPage() {
  const [certs, setCerts]     = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [syncing, setSyncing] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await api.get('/admin/certificates', { params: { search } });
    setCerts(res.data.data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleSync = async (id: number) => {
    setSyncing(id);
    try {
      await api.post(`/admin/certificates/${id}/sync`);
      fetchData();
    } finally { setSyncing(null); }
  };

  const handleResyncAll = async () => {
    if (!confirm('Re-sync semua sertifikat yang gagal ke The Blue Economist?')) return;
    await api.post('/admin/certificates/resync-failed');
    fetchData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/certificates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `database-sertifikat-digibluecamp-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const syncBadge = {
    synced:  { label: '✅ Synced',  cls: 'badge-success' },
    failed:  { label: '❌ Failed',  cls: 'badge-danger' },
    pending: { label: '⏳ Pending', cls: 'badge-warning' },
  };

  return (
    <div className="animate-fadeup">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">Manajemen Sertifikat</h1>
          <p className="text-slate-500 text-sm mt-1">Terbitkan, kelola, dan sinkronkan ke The Blue Economist</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleResyncAll}
            className="btn btn-outline btn-sm">
            🔄 Re-Sync Gagal
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="btn btn-gold btn-sm">
            {exporting ? 'Mengekspor...' : '📊 Export Excel'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <input type="text" placeholder="Cari nomor seri atau nama peserta..."
          className="form-input w-full" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Peserta</th>
              <th>No. Seri Sertifikat</th>
              <th>Program</th>
              <th>Grade</th>
              <th>Tanggal Terbit</th>
              <th>Sync TBE</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton h-4" /></td>
                  ))}
                </tr>
              ))
            ) : certs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">Belum ada sertifikat yang diterbitkan</td></tr>
            ) : certs.map(cert => (
              <tr key={cert.id}>
                <td>
                  <p className="font-semibold text-sm">{cert.user.name}</p>
                  <p className="text-xs text-slate-400">{cert.user.email}</p>
                </td>
                <td>
                  <p className="font-mono text-xs font-semibold text-navy">{cert.serial_number}</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">{cert.serial_url_key}</p>
                </td>
                <td className="text-sm max-w-[160px] truncate">{cert.enrollment.course.title}</td>
                <td><span className="badge badge-gold">{cert.grade}</span></td>
                <td className="text-sm text-slate-500">
                  {new Date(cert.date_of_issue).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                </td>
                <td>
                  <span className={`badge ${syncBadge[cert.sync_status]?.cls}`}>
                    {syncBadge[cert.sync_status]?.label}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    {cert.sync_status !== 'synced' && (
                      <button onClick={() => handleSync(cert.id)}
                        disabled={syncing === cert.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-navy text-white hover:bg-navy-light disabled:opacity-50 transition-all">
                        {syncing === cert.id ? '...' : 'Sync'}
                      </button>
                    )}
                    <a href={`https://theblueeconomist.org/certification/${cert.serial_url_key}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                      Verifikasi
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
