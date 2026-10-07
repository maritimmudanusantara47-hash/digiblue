'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';

interface User { id: number; name: string; email: string; institution?: string }
interface Course { id: number; title: string; certification_level: { code: string; name: string } }
interface Enrollment {
  id: number;
  user: User;
  course: Course;
  status: string;
  enrollment_type: string | null;
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
  const [search, setSearch] = useState('');
  const perPage = 20;

  // Manual enroll modal
  const [showAdd, setShowAdd] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [addForm, setAddForm] = useState({ user_id: '', course_id: '', enrollment_type: 'self_paid', status: 'active' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // {t('col_status')} change modal
  const [statusTarget, setStatusTarget] = useState<Enrollment | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newType, setNewType] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Field trip toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (statusFilter) params.set('status', statusFilter);
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
  }, [page, statusFilter, search]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  // Fetch users & courses for add modal
  const openAdd = async () => {
    setAddError('');
    setAddForm({ user_id: '', course_id: '', enrollment_type: 'self_paid', status: 'active' });
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
    if (!addForm.user_id || !addForm.course_id) { setAddError('User dan kursus wajib dipilih.'); return; }
    setAdding(true);
    setAddError('');
    try {
      await api.post('/admin/enrollments', {
        user_id: Number(addForm.user_id),
        course_id: Number(addForm.course_id),
        enrollment_type: addForm.enrollment_type,
        status: addForm.status,
      });
      setShowAdd(false);
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAddError(msg ?? 'Gagal membuat enrollment.');
    } finally {
      setAdding(false);
    }
  };

  const openStatusChange = (en: Enrollment) => {
    setStatusTarget(en);
    setNewStatus(en.status);
    setNewType(en.enrollment_type ?? 'self_paid');
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/enrollments/${statusTarget.id}/status`, {
        status: newStatus,
        enrollment_type: newType,
      });
      setStatusTarget(null);
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengubah status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleFieldTrip = async (id: number) => {
    setTogglingId(id);
    try {
      await api.patch(`/admin/enrollments/${id}/field-trip`, {});
      fetchEnrollments();
    } catch {
      alert('Gagal mengubah status field trip.');
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
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal menghapus enrollment.');
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
                <th className="px-4 py-3 text-left font-semibold">{t('col_status')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_ft')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_register')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
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
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
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
      {
        showAdd && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeup">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy-dark">{t('btn_add')}</h2>
                <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <form onSubmit={handleAdd} className="px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('col_participant')} <span className="text-red-500">*</span></label>
                  <select required value={addForm.user_id}
                    onChange={e => setAddForm(f => ({ ...f, user_id: e.target.value }))}
                    className="form-input">
                    <option value="">-- Pilih {t('col_participant')} --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('col_course')} <span className="text-red-500">*</span></label>
                  <select required value={addForm.course_id}
                    onChange={e => setAddForm(f => ({ ...f, course_id: e.target.value }))}
                    className="form-input">
                    <option value="">-- Pilih {t('col_course')} --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('col_status')} Awal</label>
                  <select value={addForm.status}
                    onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                    className="form-input text-sm">
                    {STATUS_OPTS(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {addError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{addError}</div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={adding} id="save-enroll-btn" className="btn btn-primary flex-1">
                    {adding ? t('btn_saving') : <><Icon name="check-circle-1" size={16} className="mr-1.5" />{t('btn_save_enrollment')}</>}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">{t('btn_cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ── Modal: Ubah {t('col_status')} ───────────────────────────────────────────────── */}
      {
        statusTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeup">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy-dark">Ubah {t('col_status')} Enrollment</h2>
                <button onClick={() => setStatusTarget(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-navy-dark">{statusTarget.user?.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{statusTarget.course?.title}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('col_status')} Baru</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-input">
                    {STATUS_OPTS(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button id="save-status-btn" onClick={handleStatusUpdate} disabled={updatingStatus} className="btn btn-primary flex-1">
                    {updatingStatus ? t('btn_saving') : <><Icon name="check-circle-1" size={16} className="mr-1.5" />Update {t('col_status')}</>}
                  </button>
                  <button onClick={() => setStatusTarget(null)} className="btn btn-secondary">{t('btn_cancel')}</button>
                </div>
              </div>
            </div>
          </div >
        )
      }

      {/* ── Modal: {t('tooltip_delete')} Enrollment ──────────────────────────────────────────── */}
      {
        deleteTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeup p-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3"><Icon name="info" size={48} /></div>
                <h2 className="text-lg font-extrabold text-navy-dark">{t('tooltip_delete')} Enrollment?</h2>
                <p className="text-slate-500 text-sm mt-2">
                  Enrollment <strong>{deleteTarget.user?.name}</strong> {t('desc_delete_2')}{' '}
                  <strong>{deleteTarget.course?.title}</strong> {t('desc_delete_3')}
                </p>
              </div>
              <div className="flex gap-3">
                <button id="confirm-delete-enroll" onClick={handleDelete} disabled={deleting}
                  className="btn flex-1 bg-red-500 text-white hover:bg-red-600">
                  {deleting ? t('btn_deleting') : <><Icon name="trash-3" size={16} className="mr-1.5" />{t('tooltip_delete')}</>}
                </button>
                <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">{t('btn_cancel')}</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
