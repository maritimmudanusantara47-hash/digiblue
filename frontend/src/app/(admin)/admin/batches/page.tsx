'use client';

import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/swal';

interface Course { id: number; title: string }
interface CourseBatch {
  id: number;
  course_id: number;
  batch_name: string;
  batch_code: string | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  start_date: string | null;
  end_date: string | null;
  field_trip_date: string | null;
  is_active: boolean;
  enrollments_count: number;
  course?: Course;
}

type ModalMode = 'create' | 'edit' | null;

const emptyForm = {
  course_id: '',
  batch_name: '',
  batch_code: '',
  registration_start_date: '',
  registration_end_date: '',
  start_date: '',
  end_date: '',
  field_trip_date: '',
  is_active: true,
};

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Modal
  const [mode, setMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<CourseBatch | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCourse) params.set('course_id', filterCourse);
      if (filterActive === 'active') params.set('active_only', 'true');
      const res = await api.get(`/admin/batches?${params}`);
      setBatches(res.data.data ?? []);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [filterCourse, filterActive]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data ?? []);
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const toInputDate = (d: string | null) => {
    if (!d) return '';
    try { return new Date(d).toISOString().slice(0, 10); }
    catch { return ''; }
  };

  // ── Modal open ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setMode('create');
    setEditId(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (b: CourseBatch) => {
    setMode('edit');
    setEditId(b.id);
    setForm({
      course_id: String(b.course_id),
      batch_name: b.batch_name,
      batch_code: b.batch_code ?? '',
      registration_start_date: toInputDate(b.registration_start_date),
      registration_end_date: toInputDate(b.registration_end_date),
      start_date: toInputDate(b.start_date),
      end_date: toInputDate(b.end_date),
      field_trip_date: toInputDate(b.field_trip_date),
      is_active: b.is_active,
    });
    setError('');
  };

  const closeModal = () => { setMode(null); setEditId(null); };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.batch_name) {
      setError('Kursus dan nama batch wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        course_id: Number(form.course_id),
        batch_name: form.batch_name,
        batch_code: form.batch_code || null,
        registration_start_date: form.registration_start_date || null,
        registration_end_date: form.registration_end_date || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        field_trip_date: form.field_trip_date || null,
        is_active: form.is_active,
      };
      if (mode === 'create') {
        await api.post(`/admin/courses/${form.course_id}/batches`, payload);
      } else {
        await api.patch(`/admin/batches/${editId}`, payload);
      }
      closeModal();
      await fetchBatches();
      showSuccess(
        'Berhasil!',
        mode === 'create'
          ? 'Batch angkatan baru berhasil dibuat.'
          : 'Data batch angkatan berhasil diperbarui.'
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Gagal menyimpan batch.');
      showError('Gagal Menyimpan!', msg ?? 'Terjadi kesalahan saat menyimpan data batch.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/batches/${deleteTarget.id}`);
      const targetName = deleteTarget.batch_name;
      setDeleteTarget(null);
      await fetchBatches();
      showSuccess('Berhasil!', `Batch ${targetName} berhasil dihapus.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal Menghapus!', msg ?? 'Gagal menghapus batch.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter displayed batches (inactive filter)
  const displayed = filterActive === 'inactive'
    ? batches.filter(b => !b.is_active)
    : batches;

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">Kelola Batch / Angkatan</h1>
          <p className="text-slate-500 text-sm mt-1">Atur angkatan peserta per kursus. Batch bersifat dinamis dan bisa ditambahkan setiap bulannya.</p>
        </div>
        <button id="btn-add-batch" onClick={openCreate} className="btn btn-primary whitespace-nowrap">
          <Icon name="add-circle" size={16} className="mr-1.5" /> Tambah Batch Baru
        </button>
      </div>

      {/* Toolbar */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {/* Filter: Kursus */}
          <select
            id="filter-course"
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="form-input py-2 text-sm"
          >
            <option value="">Semua Kursus</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          {/* Filter: Status */}
          <select
            id="filter-active"
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="form-input py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Non-aktif Saja</option>
          </select>
        </div>
        <span className="text-slate-400 text-sm">{displayed.length} batch ditemukan</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Kursus</th>
                <th className="px-4 py-3 text-left font-semibold">Nama Batch</th>
                <th className="px-4 py-3 text-left font-semibold">Kode</th>
                <th className="px-4 py-3 text-left font-semibold">Periode Belajar</th>
                <th className="px-4 py-3 text-left font-semibold">Field Trip</th>
                <th className="px-4 py-3 text-center font-semibold">Peserta</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-slate-400">Memuat data batch...</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                  <Icon name="info" size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Belum ada batch. Klik &ldquo;Tambah Batch Baru&rdquo; untuk membuat.</p>
                </td></tr>
              ) : displayed.map((b, i) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-dark text-xs leading-tight max-w-[220px] truncate" title={b.course?.title}>
                      {b.course?.title ?? `Course #${b.course_id}`}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy-dark">{b.batch_name}</td>
                  <td className="px-4 py-3">
                    {b.batch_code ? (
                      <span className="badge bg-indigo-100 text-indigo-700 border-indigo-300 text-[10px]">{b.batch_code}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {b.start_date || b.end_date ? (
                      <>{fmtDate(b.start_date)} — {fmtDate(b.end_date)}</>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(b.field_trip_date)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {b.enrollments_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {b.is_active ? (
                      <span className="badge bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">Aktif</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-500 border-slate-300 text-[10px]">Non-aktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        id={`btn-edit-batch-${b.id}`}
                        onClick={() => openEdit(b)}
                        title="Edit Batch"
                        className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors cursor-pointer"
                      >
                        <Icon name="pencil-1" size={15} />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-batch-${b.id}`}
                        onClick={() => setDeleteTarget(b)}
                        title="Hapus Batch"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                      >
                        <Icon name="trash-3" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Create / Edit Batch ─────────────────────────────────────── */}
      {mode && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fadeup p-6 sm:p-7 relative my-auto border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <Icon name={mode === 'create' ? 'plus' : 'pencil-1'} size={18} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#00162d] leading-tight">
                  {mode === 'create' ? 'Tambah Batch Baru' : 'Edit Batch'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                aria-label="Tutup"
              >
                <Icon name="xmark" size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Kursus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">Kursus <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={form.course_id}
                  onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                >
                  <option value="">— Pilih Kursus —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Nama & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Nama Batch <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Batch 18"
                    value={form.batch_name}
                    onChange={e => setForm(f => ({ ...f, batch_name: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Kode Batch</label>
                  <input
                    type="text"
                    placeholder="B18"
                    value={form.batch_code}
                    onChange={e => setForm(f => ({ ...f, batch_code: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* Periode Registrasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Registrasi Mulai</label>
                  <input
                    type="date"
                    value={form.registration_start_date}
                    onChange={e => setForm(f => ({ ...f, registration_start_date: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Registrasi Selesai</label>
                  <input
                    type="date"
                    value={form.registration_end_date}
                    onChange={e => setForm(f => ({ ...f, registration_end_date: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>
              </div>

              {/* Periode Belajar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Belajar Mulai</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Belajar Selesai</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>
              </div>

              {/* Field Trip */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">Tanggal Field Trip</label>
                <input
                  type="date"
                  value={form.field_trip_date}
                  onChange={e => setForm(f => ({ ...f, field_trip_date: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                />
              </div>

              {/* Aktif */}
              <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-[#112a46]' : 'bg-slate-300'}`} />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Batch Aktif (visible untuk pendaftaran)
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5">
                  <Icon name="info" size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  id="save-batch-btn"
                  className="px-5 py-2 text-sm font-semibold rounded-full bg-[#112a46] hover:bg-[#00162d] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      <span>{mode === 'create' ? 'Membuat...' : 'Menyimpan...'}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check-circle-1" size={16} />
                      <span>{mode === 'create' ? 'Buat Batch' : 'Simpan Perubahan'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ── Modal: Delete Confirmation ─────────────────────────────────────── */}
      {deleteTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fadeup border border-slate-100 p-6 sm:p-7 text-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mx-auto flex items-center justify-center mb-4 shadow-xs">
                <Icon name="trash-3" size={24} />
              </div>
              <h2 className="text-lg font-extrabold text-navy-dark">Hapus Batch?</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Batch <strong className="text-navy-dark">{deleteTarget.batch_name}</strong> dari kursus <strong className="text-navy-dark">{deleteTarget.course?.title}</strong> akan dihapus secara permanen.
              </p>
              {deleteTarget.enrollments_count > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5 text-left mt-3.5">
                  <span className="shrink-0 mt-0.5 text-amber-600"><Icon name="info" size={16} /></span>
                  <span className="leading-relaxed"><strong>{deleteTarget.enrollments_count} peserta</strong> terdaftar di batch ini akan otomatis dialihkan ke status Jalur Mandiri.</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="confirm-delete-batch"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 text-sm font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? 'Menghapus...' : <><Icon name="trash-3" size={16} /><span>Hapus Batch</span></>}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
