'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Certificate } from '@/types';

interface EnrollmentOption {
  id: number;
  user: { id: number; name: string; email: string };
  course: { id: number; title: string; certification_level?: { name: string; code: string } };
  status: string;
  attended_field_trip: boolean;
}

export default function AdminCertificatesPage() {
  const [certs, setCerts]         = useState<Certificate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [syncing, setSyncing]     = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // Issue modal
  const [showIssue, setShowIssue]         = useState(false);
  const [issuing, setIssuing]             = useState(false);
  const [issueError, setIssueError]       = useState('');
  const [enrollments, setEnrollments]     = useState<EnrollmentOption[]>([]);
  const [issueForm, setIssueForm]         = useState({
    enrollment_id: '',
    grade: 'Standard',
    date_of_issue: new Date().toISOString().slice(0, 10),
    place_of_issue: 'Jakarta, Indonesia',
    serial_number: '',
  });

  // Edit modal
  const [editingCert, setEditingCert]     = useState<Certificate | null>(null);
  const [savingEdit, setSavingEdit]       = useState(false);
  const [editError, setEditError]         = useState('');
  const [editForm, setEditForm]           = useState({
    serial_number: '',
    grade: '',
    date_of_issue: '',
    place_of_issue: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/certificates', { params: { search } });
      const d = res.data.data;
      setCerts(Array.isArray(d) ? d : d?.data ?? []);
    } catch {
      setCerts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadEnrollments = async () => {
    try {
      const res = await api.get('/admin/enrollments?per_page=100');
      const d = res.data.data;
      const list: EnrollmentOption[] = Array.isArray(d) ? d : d?.data ?? [];
      // Prioritize active or completed enrollments
      setEnrollments(list);
    } catch {
      setEnrollments([]);
    }
  };

  const handleOpenIssue = () => {
    setIssueError('');
    setIssueForm({
      enrollment_id: '',
      grade: 'Standard',
      date_of_issue: new Date().toISOString().slice(0, 10),
      place_of_issue: 'Jakarta, Indonesia',
      serial_number: '',
    });
    loadEnrollments();
    setShowIssue(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.enrollment_id) {
      setIssueError('Silakan pilih enrollment peserta.');
      return;
    }
    setIssuing(true);
    setIssueError('');
    try {
      const payload: Record<string, string | number> = {
        enrollment_id: Number(issueForm.enrollment_id),
        grade: issueForm.grade,
        date_of_issue: issueForm.date_of_issue,
        place_of_issue: issueForm.place_of_issue,
      };
      if (issueForm.serial_number.trim()) {
        payload.serial_number = issueForm.serial_number.trim();
      }

      await api.post('/admin/certificates', payload);
      setShowIssue(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setIssueError(msg ?? 'Gagal menerbitkan sertifikat.');
    } finally {
      setIssuing(false);
    }
  };

  const handleOpenEdit = (cert: Certificate) => {
    setEditError('');
    setEditingCert(cert);
    setEditForm({
      serial_number: cert.serial_number,
      grade: cert.grade,
      date_of_issue: cert.date_of_issue ? cert.date_of_issue.slice(0, 10) : '',
      place_of_issue: cert.place_of_issue,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    setSavingEdit(true);
    setEditError('');
    try {
      await api.patch(`/admin/certificates/${editingCert.id}`, editForm);
      setEditingCert(null);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg ?? 'Gagal memperbarui sertifikat.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      const res = await api.get(`/admin/certificates/${cert.id}/download`, {
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `Sertifikat-${cert.user?.name ?? 'Peserta'}-${cert.serial_number.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh PDF sertifikat.');
    } finally {
      setDownloading(null);
    }
  };

  const handleSync = async (id: number) => {
    setSyncing(id);
    try {
      await api.post(`/admin/certificates/${id}/sync`);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal sinkronisasi.');
    } finally {
      setSyncing(null);
    }
  };

  const handleResyncAll = async () => {
    if (!confirm('Re-sync semua sertifikat yang gagal ke The Blue Economist?')) return;
    try {
      await api.post('/admin/certificates/resync-failed');
      fetchData();
    } catch {
      alert('Gagal memicu re-sync massal.');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/certificates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `database-sertifikat-digibluecamp-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengekspor data sertifikat.');
    } finally {
      setExporting(false);
    }
  };

  const syncBadge: Record<string, { label: string; cls: string }> = {
    synced:  { label: '✅ Synced',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    failed:  { label: '❌ Failed',  cls: 'bg-rose-50 text-rose-700 border-rose-300' },
    pending: { label: '⏳ Pending', cls: 'bg-amber-50 text-amber-700 border-amber-300' },
  };

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">Manajemen Sertifikat</h1>
          <p className="text-slate-500 text-sm mt-1">Terbitkan, kelola nomor seri, unduh PDF, dan sinkronkan ke The Blue Economist</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleOpenIssue}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <span>🎓</span> Terbitkan Sertifikat
          </button>
          <button
            onClick={handleResyncAll}
            className="btn btn-secondary btn-sm"
          >
            🔄 Re-Sync Gagal
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-gold btn-sm"
          >
            {exporting ? 'Mengekspor...' : '📊 Export Excel'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Cari berdasarkan nomor seri, nama peserta, atau email..."
            className="form-input w-full pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Peserta</th>
                <th className="px-4 py-3 text-left font-semibold">No. Seri Sertifikat</th>
                <th className="px-4 py-3 text-left font-semibold">Program</th>
                <th className="px-4 py-3 text-left font-semibold">Grade</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal Terbit</th>
                <th className="px-4 py-3 text-left font-semibold">Sync TBE</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Memuat data sertifikat...
                    </div>
                  </td>
                </tr>
              ) : certs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-2">🏅</div>
                    <p>Belum ada sertifikat yang diterbitkan.</p>
                  </td>
                </tr>
              ) : (
                certs.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-dark">{cert.user?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{cert.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-navy">{cert.serial_number}</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">{cert.serial_url_key}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="line-clamp-2 text-slate-700">{cert.enrollment?.course?.title ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-gold font-bold">{cert.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {cert.date_of_issue
                        ? new Date(cert.date_of_issue).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          syncBadge[cert.sync_status]?.cls ?? 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        {syncBadge[cert.sync_status]?.label ?? cert.sync_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownload(cert)}
                          disabled={downloading === cert.id}
                          className="btn btn-secondary btn-sm text-xs px-2.5 py-1"
                          title="Unduh PDF"
                        >
                          {downloading === cert.id ? '⏳' : '📥 PDF'}
                        </button>

                        {/* Edit Override */}
                        <button
                          onClick={() => handleOpenEdit(cert)}
                          className="btn btn-secondary btn-sm text-xs px-2 py-1"
                          title="Edit Nomor Seri / Data"
                        >
                          ✏️
                        </button>

                        {/* Verify Link */}
                        <a
                          href={`/verify/${cert.serial_url_key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm text-xs px-2.5 py-1 text-slate-600"
                          title="Halaman Verifikasi Publik"
                        >
                          🔍 Cek
                        </a>

                        {/* Sync TBE */}
                        {cert.sync_status !== 'synced' && (
                          <button
                            onClick={() => handleSync(cert.id)}
                            disabled={syncing === cert.id}
                            className="btn btn-primary btn-sm text-xs px-2 py-1"
                            title="Push ke The Blue Economist"
                          >
                            {syncing === cert.id ? '...' : 'Sync'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Terbitkan Sertifikat ───────────────────────────────────────── */}
      {showIssue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeup overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-extrabold text-navy-dark">🎓 Terbitkan Sertifikat Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sertifikat akan terdaftar di database dan digenerate nomor serinya</p>
              </div>
              <button
                onClick={() => setShowIssue(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-6 flex flex-col gap-4">
              {issueError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{issueError}</span>
                </div>
              )}

              {/* Enrollment selection */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label text-xs font-bold text-navy-dark">
                  Pilih Peserta & Kursus <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={issueForm.enrollment_id}
                  onChange={e => setIssueForm(f => ({ ...f, enrollment_id: e.target.value }))}
                  className="form-input text-sm"
                >
                  <option value="">-- Pilih Enrollment --</option>
                  {enrollments.map(en => (
                    <option key={en.id} value={en.id}>
                      {en.user?.name} — {en.course?.title} (Status: {en.status} | FT: {en.attended_field_trip ? 'Hadir' : 'Belum'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Untuk Foundation Level, peserta harus sudah hadir Field Trip ATAU menyelesaikan Critical Thinking.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Grade */}
                <div className="flex flex-col gap-1.5">
                  <label className="form-label text-xs font-bold text-navy-dark">Grade / Predikat <span className="text-red-500">*</span></label>
                  <select
                    value={issueForm.grade}
                    onChange={e => setIssueForm(f => ({ ...f, grade: e.target.value }))}
                    className="form-input text-sm"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>

                {/* Date of Issue */}
                <div className="flex flex-col gap-1.5">
                  <label className="form-label text-xs font-bold text-navy-dark">Tanggal Terbit <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={issueForm.date_of_issue}
                    onChange={e => setIssueForm(f => ({ ...f, date_of_issue: e.target.value }))}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              {/* Place of issue */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label text-xs font-bold text-navy-dark">Tempat Terbit <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jakarta, Indonesia"
                  value={issueForm.place_of_issue}
                  onChange={e => setIssueForm(f => ({ ...f, place_of_issue: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>

              {/* Custom serial override */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label text-xs font-bold text-navy-dark">
                  Nomor Seri Custom <span className="text-slate-400 font-normal">(Opsional - Kosongkan untuk auto-generate)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: CBEC/ID/X/20260001"
                  value={issueForm.serial_number}
                  onChange={e => setIssueForm(f => ({ ...f, serial_number: e.target.value }))}
                  className="form-input text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssue(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  {issuing ? 'Menerbitkan...' : '🎓 Terbitkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit / Override Sertifikat ─────────────────────────────────── */}
      {editingCert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeup overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-extrabold text-navy-dark">✏️ Sunting Sertifikat</h2>
                <p className="text-xs text-slate-500 mt-0.5">Penerima: {editingCert.user?.name}</p>
              </div>
              <button
                onClick={() => setEditingCert(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {editError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="form-label text-xs font-bold text-navy-dark">Nomor Seri Sertifikat</label>
                <input
                  type="text"
                  required
                  value={editForm.serial_number}
                  onChange={e => setEditForm(f => ({ ...f, serial_number: e.target.value }))}
                  className="form-input text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label text-xs font-bold text-navy-dark">Grade</label>
                  <select
                    required
                    value={editForm.grade}
                    onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))}
                    className="form-input text-sm"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label text-xs font-bold text-navy-dark">Tanggal Terbit</label>
                  <input
                    type="date"
                    required
                    value={editForm.date_of_issue}
                    onChange={e => setEditForm(f => ({ ...f, date_of_issue: e.target.value }))}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="form-label text-xs font-bold text-navy-dark">Tempat Terbit</label>
                <input
                  type="text"
                  required
                  value={editForm.place_of_issue}
                  onChange={e => setEditForm(f => ({ ...f, place_of_issue: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary btn-sm"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
