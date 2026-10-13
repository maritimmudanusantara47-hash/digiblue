'use client';

import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import { showSuccess, showError, showWarning, showConfirm } from '@/lib/swal';

interface User { id: number; name: string; email: string; institution?: string }
interface Course { id: number; title: string; certification_level: { code: string; name: string } }
interface BatchItem {
  id: number;
  course_id: number;
  batch_name: string;
  batch_code?: string | null;
  course?: { id: number; title: string };
}
interface Enrollment {
  id: number;
  user: User;
  course: Course;
  status: string;
  enrollment_type: string | null;
  batch_id?: number | null;
  batch?: { id: number; batch_name: string; batch_code?: string | null } | null;
  attended_field_trip: boolean;
  final_payment_amount: number | null;
  created_at: string;
}

const STATUS_OPTS = (t: any) => [
  { value: 'payment_pending', label: t('opt_payment_pending'), color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'active', label: t('opt_active'), color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'completed', label: t('opt_completed'), color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'rejected', label: t('opt_rejected'), color: 'bg-red-100 text-red-600 border-red-300' },
];

const TYPE_OPTS = (t: any) => [
  { value: 'self_paid', label: t('opt_self_paid') },
];

const statusStyle = (s: string, t: any) =>
  STATUS_OPTS(t).find(o => o.value === s)?.color ?? 'bg-slate-100 text-slate-500 border-slate-300';
const statusLabel = (s: string, t: any) =>
  STATUS_OPTS(t).find(o => o.value === s)?.label ?? s;
const typeLabel = (type: string | null, t: any) =>
  TYPE_OPTS(t).find(o => o.value === type)?.label ?? (type ?? '—');

export default function AdminEnrollmentsPage() {
  const t = useTranslations('AdminEnrollments');
  const locale = useLocale();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatus] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [search, setSearch] = useState('');
  const perPage = 20;

  // Manual enroll modal
  const [showAdd, setShowAdd] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [addForm, setAddForm] = useState({ user_id: '', course_id: '', batch_id: '', enrollment_type: 'self_paid', status: 'active' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // {t('col_status')} change modal
  const [statusTarget, setStatusTarget] = useState<Enrollment | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newType, setNewType] = useState('');
  const [newBatchId, setNewBatchId] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Field trip toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Load batches
  const fetchBatches = useCallback(async () => {
    try {
      const res = await api.get('/admin/batches');
      setBatches(res.data.data ?? []);
    } catch {
      setBatches([]);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (statusFilter) params.set('status', statusFilter);
      if (batchFilter) params.set('batch_id', batchFilter);
      if (search) params.set('search', search);
      const res = await api.get(`/admin/enrollments?${params}`);
      const d = res.data.data;
      setEnrollments(Array.isArray(d) ? d : d?.data ?? []);
      setTotal(d?.meta?.total ?? d?.total ?? 0);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, batchFilter, search]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  // Fetch users & courses for add modal
  const openAdd = async () => {
    setAddError('');
    setAddForm({ user_id: '', course_id: '', batch_id: '', enrollment_type: 'self_paid', status: 'active' });
    setShowAdd(true);
    try {
      const [u, c] = await Promise.all([api.get('/admin/users?per_page=200'), api.get('/courses')]);
      setUsers(u.data.data?.data ?? u.data.data ?? []);
      setCourses(c.data.data ?? []);
    } catch {
      setUsers([]);
      setCourses([]);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.user_id || !addForm.course_id) {
      showWarning('Validasi Gagal', 'Peserta dan kursus wajib dipilih.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      await api.post('/admin/enrollments', {
        user_id: Number(addForm.user_id),
        course_id: Number(addForm.course_id),
        batch_id: addForm.batch_id ? Number(addForm.batch_id) : null,
        enrollment_type: addForm.enrollment_type,
        status: addForm.status,
      });
      setShowAdd(false);
      showSuccess('Berhasil!', 'Enrollment baru berhasil ditambahkan.');
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAddError(msg ?? 'Gagal membuat enrollment.');
      showError('Gagal!', msg ?? 'Gagal membuat enrollment.');
    } finally {
      setAdding(false);
    }
  };

  const openStatusChange = (en: Enrollment) => {
    setStatusTarget(en);
    setNewStatus(en.status);
    setNewType(en.enrollment_type ?? 'self_paid');
    setNewBatchId(en.batch_id ? String(en.batch_id) : '');
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    if (newStatus === 'completed' && statusTarget.status !== 'completed') {
      const isConfirmed = await showConfirm(
        'Konfirmasi Kelulusan',
        `Apakah Anda yakin ingin menetapkan status kelulusan untuk peserta ${statusTarget.user?.name}?`,
        'Ya, Luluskan'
      );
      if (!isConfirmed) return;
    }
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/enrollments/${statusTarget.id}/status`, {
        status: newStatus,
        enrollment_type: newType,
        batch_id: newBatchId ? Number(newBatchId) : null,
      });
      setStatusTarget(null);
      showSuccess('Berhasil!', 'Status enrollment berhasil diperbarui.');
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal mengubah status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleFieldTrip = async (id: number) => {
    const isConfirmed = await showConfirm(
      'Ubah Status Field Study?',
      'Apakah Anda yakin ingin mengubah status kehadiran field study untuk peserta ini?',
      'Ya, Lanjutkan'
    );
    if (!isConfirmed) return;
    setTogglingId(id);
    try {
      await api.patch(`/admin/enrollments/${id}/field-trip`, {});
      showSuccess('Berhasil!', 'Status field study berhasil diperbarui.');
      fetchEnrollments();
    } catch {
      showError('Gagal!', 'Gagal mengubah status field trip.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/enrollments/${deleteTarget.id}`);
      setDeleteTarget(null);
      showSuccess('Berhasil!', 'Enrollment berhasil dihapus.');
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal menghapus enrollment.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <button id="btn-add-enrollment" onClick={openAdd} className="btn btn-primary whitespace-nowrap">
          {t('btn_add')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><Icon name="search-1" size={14} /></span>
            <input
              id="enrollment-search"
              type="text"
              placeholder={t('placeholder_search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9 py-2 text-sm w-60"
            />
          </div>
          {/* {t('col_status')} filter */}
          <select
            id="enrollment-status"
            value={statusFilter}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="form-input py-2 text-sm"
          >
            <option value="">{t('opt_all_status')}</option>
            {STATUS_OPTS(t).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Batch / Angkatan filter */}
          <select
            id="enrollment-batch"
            value={batchFilter}
            onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
            className="form-input py-2 text-sm"
          >
            <option value="">Semua Angkatan / Jalur</option>
            <option value="none">Khusus Reguler (Tanpa Batch)</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batch_name} {b.course?.title ? `— ${b.course.title.slice(0, 20)}...` : ''}
              </option>
            ))}
          </select>
        </div>
        <span className="text-slate-400 text-sm">{total} {t('lbl_enrollment_count')}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_participant')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_course')}</th>
                <th className="px-4 py-3 text-left font-semibold">Batch / Angkatan</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_status')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_ft')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_register')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {t('msg_loading')}
                    </div>
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="text-4xl mb-3"><Icon name="clipboard" size={36} /></div>
                    <p>{t('empty')}</p>
                  </td>
                </tr>
              ) : enrollments.map((en, i) => (
                <tr key={en.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-dark text-sm">{en.user?.name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{en.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="font-medium text-sm text-navy-dark leading-snug line-clamp-2">
                      {en.course?.title ?? '—'}
                    </p>
                    <span className="text-[10px] text-slate-400">{en.course?.certification_level?.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    {en.batch ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Icon name="flag-1" size={11} />
                        {en.batch.batch_name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Reguler (Mandiri)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle(en.status, t)}`}>
                      {statusLabel(en.status, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      id={`ft-toggle-${en.id}`}
                      disabled={togglingId === en.id}
                      onClick={() => handleToggleFieldTrip(en.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors cursor-pointer ${en.attended_field_trip
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 border-slate-300 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                        }`}
                    >
                      {togglingId === en.id ? '...' : en.attended_field_trip ? <><Icon name="check" size={16} className="mr-1.5" />{t('lbl_attended')}</> : <> {t('lbl_not_attended')}</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(en.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        id={`status-btn-${en.id}`}
                        onClick={() => openStatusChange(en)}
                        className="btn btn-sm btn-secondary text-xs px-2.5"
                        title={"Ubah " + t('col_status')}
                      >
                        <Icon name="pencil-1" size={16} />
                      </button>
                      <Link
                        href="/admin/certificates"
                        className="btn btn-sm btn-secondary text-xs px-2.5 flex items-center justify-center"
                        title={t('tooltip_manage_cert')}
                      >
                        <Icon name="graduation-cap-1" size={16} />
                      </Link>
                      <button
                        id={`del-btn-${en.id}`}
                        onClick={() => setDeleteTarget(en)}
                        className="btn btn-sm text-xs px-2.5 bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white"
                        title={t('tooltip_delete')}
                      >
                        <Icon name="trash-3" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-secondary btn-sm disabled:opacity-40"><Icon name="arrow-left" size={16} className="mr-1.5" />{t('btn_prev')}</button>
            <span className="text-sm text-slate-500">{t('lbl_page')} {page} {t('lbl_of')} {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-40">{t('btn_next')} <Icon name="arrow-right" size={14} className="ml-1.5" /></button>
          </div>
        )}
      </div>

      {/* ── Modal: Manual Enroll ─────────────────────────────────────────────── */}
      {showAdd && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeup p-6 sm:p-7 relative my-auto border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <Icon name="user-multiple-4" size={18} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#00162d] leading-tight">{t('btn_add')}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                aria-label="Tutup"
              >
                <Icon name="xmark" size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">
                  {t('col_participant')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={addForm.user_id}
                  onChange={e => setAddForm(f => ({ ...f, user_id: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                >
                  <option value="">-- Pilih {t('col_participant')} --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">
                  {t('col_course')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={addForm.course_id}
                  onChange={e => setAddForm(f => ({ ...f, course_id: e.target.value, batch_id: '' }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                >
                  <option value="">-- Pilih {t('col_course')} --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">Angkatan / Batch (Opsional)</label>
                <select
                  disabled={!addForm.course_id}
                  value={addForm.batch_id}
                  onChange={e => setAddForm(f => ({ ...f, batch_id: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {!addForm.course_id ? (
                    <option value="">— Pilih kursus terlebih dahulu —</option>
                  ) : (
                    <>
                      <option value="">— Belajar Mandiri / Tanpa Batch —</option>
                      {batches
                        .filter(b => String(b.course_id) === String(addForm.course_id))
                        .map(b => (
                          <option key={b.id} value={b.id}>
                            {b.batch_name} {b.batch_code ? `(${b.batch_code})` : ''}
                          </option>
                        ))}
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 leading-normal pl-2">
                  {!addForm.course_id
                    ? 'Pilih kursus di atas terlebih dahulu untuk melihat batch yang tersedia.'
                    : 'Pilih batch angkatan atau biarkan kosong untuk jalur mandiri.'}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">{t('col_status')} Awal</label>
                <select
                  value={addForm.status}
                  onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                >
                  {STATUS_OPTS(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {addError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5">
                  <Icon name="info" size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-relaxed">{addError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  id="save-enroll-btn"
                  className="px-5 py-2 text-sm font-semibold rounded-full bg-[#112a46] hover:bg-[#00162d] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {adding ? t('btn_saving') : <><Icon name="check-circle-1" size={16} /><span>{t('btn_save_enrollment')}</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ── Modal: Ubah Status & Batch ───────────────────────────────────────── */}
      {statusTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeup p-6 sm:p-7 relative my-auto border border-slate-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <Icon name="pencil-1" size={18} />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#00162d] leading-tight">Ubah Status & Batch</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  aria-label="Tutup"
                >
                  <Icon name="xmark" size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Peserta & Kursus</span>
                  <p className="font-bold text-navy-dark leading-snug">{statusTarget.user?.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{statusTarget.course?.title}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Angkatan / Batch</label>
                  <select
                    value={newBatchId}
                    onChange={e => setNewBatchId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  >
                    <option value="">— Belajar Mandiri / Tanpa Batch —</option>
                    {batches
                      .filter(b => {
                        const targetCourseId = statusTarget.course?.id;
                        return targetCourseId ? String(b.course_id) === String(targetCourseId) : true;
                      })
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batch_name} {b.batch_code ? `(${b.batch_code})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">{t('col_status')} Baru</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  >
                    {STATUS_OPTS(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setStatusTarget(null)}
                    className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {t('btn_cancel')}
                  </button>
                  <button
                    id="save-status-btn"
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-[#112a46] hover:bg-[#00162d] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {updatingStatus ? t('btn_saving') : <><Icon name="check-circle-1" size={16} /><span>Update {t('col_status')}</span></>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Modal: Hapus Enrollment ──────────────────────────────────────────── */}
      {deleteTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fadeup border border-slate-100 p-6 sm:p-7 text-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mx-auto flex items-center justify-center mb-4 shadow-xs">
                <Icon name="trash-3" size={24} />
              </div>
              <h2 className="text-lg font-extrabold text-navy-dark">{t('tooltip_delete')} Enrollment?</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Enrollment peserta <strong className="text-navy-dark">{deleteTarget.user?.name}</strong> {t('desc_delete_2')}{' '}
                <strong className="text-navy-dark">{deleteTarget.course?.title}</strong> {t('desc_delete_3')}
              </p>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  id="confirm-delete-enroll"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 text-sm font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? t('btn_deleting') : <><Icon name="trash-3" size={16} /><span>{t('tooltip_delete')}</span></>}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
