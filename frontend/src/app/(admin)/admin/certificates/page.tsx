'use client';

import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Certificate } from '@/types';
import { useTranslations } from 'next-intl';
import { showSuccess, showError, showWarning, showConfirm } from '@/lib/swal';

interface EnrollmentOption {
  id: number;
  user: { id: number; name: string; email: string };
  course: { id: number; title: string; certification_level?: { name: string; code: string } };
  status: string;
  attended_field_trip: boolean;
}

export default function AdminCertificatesPage() {
  const t = useTranslations('AdminCertificates');
  const [certs, setCerts]         = useState<Certificate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [syncing, setSyncing]     = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadingFs, setDownloadingFs] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // Issue modal
  const [showIssue, setShowIssue]         = useState(false);
  const [issuing, setIssuing]             = useState(false);
  const [issueError, setIssueError]       = useState('');
  const [suggestedSerial, setSuggestedSerial] = useState('');
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
    api.get('/admin/certificates/next-serial')
      .then(res => {
        if (res.data?.data?.next_serial_number) {
          setSuggestedSerial(res.data.data.next_serial_number);
        }
      })
      .catch(() => {});
    setShowIssue(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.enrollment_id) {
      const msg = t('msg_enrollment_required') || 'Peserta enrollment wajib dipilih.';
      showWarning('Validasi Gagal', msg);
      return;
    }
    const isConfirmed = await showConfirm(
      'Terbitkan Sertifikat?',
      'Apakah Anda yakin ingin menerbitkan sertifikat secara manual untuk peserta ini?',
      'Ya, Terbitkan'
    );
    if (!isConfirmed) return;
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
      showSuccess('Berhasil!', 'Sertifikat manual berhasil diterbitkan.');
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setIssueError(msg ?? t('msg_issue_fail'));
      showError('Gagal!', msg ?? t('msg_issue_fail'));
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
      showSuccess('Berhasil!', 'Data sertifikat berhasil diperbarui.');
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg ?? t('msg_edit_fail'));
      showError('Gagal!', msg ?? t('msg_edit_fail'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownload = async (cert: Certificate, type?: 'field_study') => {
    if (type === 'field_study') {
      setDownloadingFs(cert.id);
    } else {
      setDownloading(cert.id);
    }
    try {
      const urlPath = type === 'field_study'
        ? `/admin/certificates/${cert.id}/download?type=field_study`
        : `/admin/certificates/${cert.id}/download`;
      const res = await api.get(urlPath, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      const prefix = type === 'field_study' ? 'Sertifikat-Field-Study' : 'Sertifikat';
      link.setAttribute('download', `${prefix}-${cert.user?.name ?? 'Peserta'}-${cert.serial_number.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      showError('Gagal Mengunduh', t('msg_download_fail'));
    } finally {
      if (type === 'field_study') {
        setDownloadingFs(null);
      } else {
        setDownloading(null);
      }
    }
  };

  const handleSync = async (id: number) => {
    setSyncing(id);
    try {
      await api.post(`/admin/certificates/${id}/sync`);
      showSuccess('Berhasil!', 'Status sertifikat berhasil disinkronkan.');
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? t('msg_sync_fail'));
    } finally {
      setSyncing(null);
    }
  };

  const handleResyncAll = async () => {
    const isConfirmed = await showConfirm(
      'Sinkronkan Semua?',
      t('msg_resync_confirm') || 'Sinkronkan ulang semua sertifikat yang gagal?',
      'Ya, Sinkronkan'
    );
    if (!isConfirmed) return;
    try {
      await api.post('/admin/certificates/resync-failed');
      showSuccess('Berhasil!', 'Sinkronisasi ulang berhasil dimulai.');
      fetchData();
    } catch {
      showError('Gagal!', t('msg_resync_fail'));
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
      showError('Gagal Export', t('msg_export_fail'));
    } finally {
      setExporting(false);
    }
  };

  const syncBadge: Record<string, { label: React.ReactNode; cls: string }> = {
    synced:  { label: <><Icon name="check-circle-1" size={16} className="mr-1.5" />Synced</>,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    failed:  { label: <><Icon name="xmark-circle" size={16} className="mr-1.5" />Failed</>,  cls: 'bg-rose-50 text-rose-700 border-rose-300' },
    pending: { label: <><Icon name="hourglass" size={16} className="mr-1.5" />Pending</>, cls: 'bg-amber-50 text-amber-700 border-amber-300' },
  };

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/certificates/template"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <Icon name="colour-palette-3" size={16} className="mr-1.5" />{t('btn_design_template')}
          </Link>
          <button
            onClick={handleOpenIssue}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <span><Icon name="graduation-cap-1" size={18} /></span> {t('btn_issue_cert')}
          </button>
          <button
            onClick={handleResyncAll}
            className="btn btn-secondary btn-sm"
          >
            <Icon name="refresh-circle-1-clockwise" size={16} className="mr-1.5" />{t('btn_resync_failed')}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-gold btn-sm"
          >
            {exporting ? t('btn_exporting') : <><Icon name="dashboard-square-1" size={16} className="mr-1.5" />{t('btn_export_excel')}</>}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search-1" size={18} /></span>
          <input
            type="text"
            placeholder={t('placeholder_search')}
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
                <th className="px-4 py-3 text-left font-semibold">{t('col_participant')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_serial')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_program')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_grade')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_issue_date')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_sync')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_action')}</th>
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
                      {t('msg_loading')}
                    </div>
                  </td>
                </tr>
              ) : certs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-2"><Icon name="certificate-badge-1" size={36} /></div>
                    <p>{t('msg_empty')}</p>
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
                          title={t('tooltip_download')}
                        >
                          {downloading === cert.id ? <Icon name="hourglass" size={16} /> : <><Icon name="download-1" size={16} className="mr-1.5" />{t('btn_pdf')}</>}
                        </button>

                        {/* Download Field Study (Certificate of Completion) */}
                        {cert.enrollment?.attended_field_trip && (
                          <button
                            onClick={() => handleDownload(cert, 'field_study')}
                            disabled={downloadingFs === cert.id}
                            className="btn btn-gold btn-sm text-xs px-2.5 py-1"
                            title="Unduh Sertifikat Field Study (Certificate of Completion)"
                          >
                            {downloadingFs === cert.id ? <Icon name="hourglass" size={16} /> : <><Icon name="certificate-badge-1" size={16} className="mr-1.5" />Field Study</>}
                          </button>
                        )}

                        {/* Edit Override */}
                        <button
                          onClick={() => handleOpenEdit(cert)}
                          className="btn btn-secondary btn-sm text-xs px-2 py-1"
                          title={t('tooltip_edit')}
                        >
<Icon name="pencil-1" size={16} />
                        </button>

                        {/* Verify Link */}
                        <a
                          href={`/verify/${cert.serial_url_key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm text-xs px-2.5 py-1 text-slate-600"
                          title={t('tooltip_verify')}
                        >
                          <Icon name="search-1" size={16} className="mr-1.5" />{t('btn_verify')}
                        </a>

                        {/* Sync TBE */}
                        {cert.sync_status !== 'synced' && (
                          <button
                            onClick={() => handleSync(cert.id)}
                            disabled={syncing === cert.id}
                            className="btn btn-primary btn-sm text-xs px-2 py-1"
                            title={t('tooltip_push')}
                          >
                            {syncing === cert.id ? '...' : t('btn_sync')}
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
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeup p-6 sm:p-7 relative my-auto border border-slate-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <Icon name="graduation-cap-1" size={18} />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#00162d] leading-tight">{t('title_issue_modal')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIssue(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  aria-label="Tutup"
                >
                  <Icon name="xmark" size={16} />
                </button>
              </div>

              <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4">
                {issueError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 text-rose-500"><Icon name="info" size={16} /></span>
                    <span className="leading-relaxed">{issueError}</span>
                  </div>
                )}

                {/* Enrollment selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">
                    {t('lbl_select_participant')} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={issueForm.enrollment_id}
                    onChange={e => setIssueForm(f => ({ ...f, enrollment_id: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  >
                    <option value="">{t('opt_select_enrollment')}</option>
                    {enrollments.map(en => (
                      <option key={en.id} value={en.id}>
                        {en.user?.name} — {en.course?.title} ({t('lbl_status')}: {en.status} | {t('lbl_ft')}: {en.attended_field_trip ? t('lbl_attended') : t('lbl_not_attended')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 leading-normal pl-2">
                    {t('desc_fnd_requirement')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Grade */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark">{t('lbl_grade')} <span className="text-rose-500">*</span></label>
                    <select
                      value={issueForm.grade}
                      onChange={e => setIssueForm(f => ({ ...f, grade: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Good">Good</option>
                      <option value="Excellent">Excellent</option>
                    </select>
                  </div>

                  {/* Date of issue */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark">{t('lbl_issue_date')} <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={issueForm.date_of_issue}
                      onChange={e => setIssueForm(f => ({ ...f, date_of_issue: e.target.value }))}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    />
                  </div>
                </div>

                {/* Place of issue */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">{t('lbl_place_of_issue')} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder={t('placeholder_place')}
                    value={issueForm.place_of_issue}
                    onChange={e => setIssueForm(f => ({ ...f, place_of_issue: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>

                {/* Custom serial override */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">
                    {t('lbl_custom_serial')} <span className="text-slate-400 font-normal">({t('lbl_optional_serial')})</span>
                  </label>
                  <input
                    type="text"
                    placeholder={suggestedSerial || t('placeholder_serial')}
                    value={issueForm.serial_number}
                    onChange={e => setIssueForm(f => ({ ...f, serial_number: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm font-mono border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                  {suggestedSerial && (
                    <p className="text-[11px] text-slate-400 leading-normal pl-2">
                      Nomor urut berikutnya otomatis: <strong className="font-mono text-blue-600 font-semibold">{suggestedSerial}</strong> (kosongkan kolom ini jika ingin menggunakan urutan otomatis).
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowIssue(false)}
                    className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {t('btn_cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={issuing}
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-[#112a46] hover:bg-[#00162d] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {issuing ? t('btn_issuing') : <><Icon name="graduation-cap-1" size={16} /><span>{t('btn_issue_now')}</span></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Modal: Edit / Override Sertifikat ─────────────────────────────────── */}
      {editingCert && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeup p-6 sm:p-7 relative my-auto border border-slate-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <Icon name="pencil-1" size={18} />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#00162d] leading-tight">{t('title_edit_modal')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  aria-label="Tutup"
                >
                  <Icon name="xmark" size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                {editError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 text-rose-500"><Icon name="info" size={16} /></span>
                    <span className="leading-relaxed">{editError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">{t('lbl_serial')} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editForm.serial_number}
                    onChange={e => setEditForm(f => ({ ...f, serial_number: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm font-mono border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark">{t('col_grade')} <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={editForm.grade}
                      onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Good">Good</option>
                      <option value="Excellent">Excellent</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark">{t('col_issue_date')} <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={editForm.date_of_issue}
                      onChange={e => setEditForm(f => ({ ...f, date_of_issue: e.target.value }))}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">{t('lbl_place_of_issue')} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editForm.place_of_issue}
                    onChange={e => setEditForm(f => ({ ...f, place_of_issue: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCert(null)}
                    className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {t('btn_cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-[#112a46] hover:bg-[#00162d] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingEdit ? t('btn_saving') : <><Icon name="pencil-1" size={16} /><span>{t('btn_save_changes')}</span></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
