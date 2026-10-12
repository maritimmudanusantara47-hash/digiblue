'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

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
    if (!form.course_id || !form.batch_name) { setError('Kursus dan nama batch wajib diisi.'); return; }
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
      fetchBatches();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Gagal menyimpan batch.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/batches/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchBatches();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal menghapus batch.');
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
                      <button onClick={() => openEdit(b)} title="Edit" className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors">
                        <Icon name="pencil-edit" size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(b)} title="Hapus" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeup max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-extrabold text-navy-dark">
                {mode === 'create' ? 'Tambah Batch Baru' : 'Edit Batch'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Kursus */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Kursus <span className="text-red-500">*</span></label>
                <select
                  required
                  disabled={mode === 'edit'}
                  value={form.course_id}
                  onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                  className="form-input disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">— Pilih Kursus —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Nama & Kode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Nama Batch <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Batch 18"
                    value={form.batch_name}
                    onChange={e => setForm(f => ({ ...f, batch_name: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Kode Batch</label>
                  <input
                    type="text"
                    placeholder="B18"
                    value={form.batch_code}
                    onChange={e => setForm(f => ({ ...f, batch_code: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Periode Registrasi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Registrasi Mulai</label>
                  <input type="date" value={form.registration_start_date}
                    onChange={e => setForm(f => ({ ...f, registration_start_date: e.target.value }))}
                    className="form-input text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Registrasi Selesai</label>
                  <input type="date" value={form.registration_end_date}
                    onChange={e => setForm(f => ({ ...f, registration_end_date: e.target.value }))}
                    className="form-input text-sm" />
                </div>
              </div>

              {/* Periode Belajar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Belajar Mulai</label>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="form-input text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Belajar Selesai</label>
                  <input type="date" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="form-input text-sm" />
                </div>
              </div>

              {/* Field Trip */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Tanggal Field Trip</label>
                <input type="date" value={form.field_trip_date}
                  onChange={e => setForm(f => ({ ...f, field_trip_date: e.target.value }))}
                  className="form-input text-sm" />
              </div>

              {/* Aktif */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm text-slate-600">Batch Aktif</span>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} id="save-batch-btn" className="btn btn-primary flex-1">
                  {saving ? 'Menyimpan...' : <><Icon name="check-circle-1" size={16} className="mr-1.5" />{mode === 'create' ? 'Buat Batch' : 'Simpan Perubahan'}</>}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeup p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3"><Icon name="info" size={48} /></div>
              <h2 className="text-lg font-extrabold text-navy-dark">Hapus Batch?</h2>
              <p className="text-slate-500 text-sm mt-2">
                Batch <strong>{deleteTarget.batch_name}</strong> dari kursus <strong>{deleteTarget.course?.title}</strong> akan dihapus.
                {deleteTarget.enrollments_count > 0 && (
                  <span className="block text-orange-600 mt-1">
                    ⚠️ {deleteTarget.enrollments_count} peserta terdaftar di batch ini akan otomatis menjadi Jalur Mandiri.
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button id="confirm-delete-batch" onClick={handleDelete} disabled={deleting}
                className="btn flex-1 bg-red-500 text-white hover:bg-red-600">
                {deleting ? 'Menghapus...' : <><Icon name="trash-3" size={16} className="mr-1.5" />Hapus</>}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
