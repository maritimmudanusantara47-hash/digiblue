'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import LineIcon from '@/components/LineIcon';

interface CertLevel {
  id: number;
  code: string;
  name: string;
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  is_active: boolean;
  order_index: number;
  enrollments_count: number;
  certification_level: CertLevel;
  certification_level_id: number;
}

const LEVEL_STYLE: Record<string, string> = {
  FND: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  SPEC: 'bg-navy/10 text-navy border-navy/30',
};

type ModalMode = 'create' | 'edit' | null;

const emptyForm = {
  title: '',
  description: '',
  price: '0',
  is_active: true,
  order_index: '0',
  certification_level_id: '',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<CertLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);

  const [modal, setModal] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Course | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('paginate', 'true');
      params.set('per_page', String(perPage));
      params.set('page', String(currentPage));
      if (search.trim()) params.set('search', search.trim());
      if (filterLevel) params.set('level', filterLevel);

      const res = await api.get(`/admin/courses?${params.toString()}`);
      const payload = res.data.data;

      if (payload && Array.isArray(payload.data)) {
        setCourses(payload.data);
        setCurrentPage(payload.current_page ?? 1);
        setLastPage(payload.last_page ?? 1);
        setTotal(payload.total ?? 0);
        setFrom(
          payload.from ??
          (payload.data.length > 0
            ? (payload.current_page - 1) * perPage + 1
            : 0)
        );
        setTo(
          payload.to ??
          (payload.data.length > 0
            ? (payload.current_page - 1) * perPage + payload.data.length
            : 0)
        );
      } else if (Array.isArray(payload)) {
        setCourses(payload);
        setTotal(payload.length);
        setLastPage(1);
        setFrom(payload.length > 0 ? 1 : 0);
        setTo(payload.length);
      } else {
        setCourses([]);
        setTotal(0);
        setLastPage(1);
        setFrom(0);
        setTo(0);
      }
    } catch {
      setCourses([]);
      setTotal(0);
      setLastPage(1);
      setFrom(0);
      setTo(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, filterLevel]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (lvl: string) => {
    setFilter(lvl);
    setCurrentPage(1);
  };

  const handlePerPageChange = (val: number) => {
    setPerPage(val);
    setCurrentPage(1);
  };

  useEffect(() => {
    api
      .get('/courses')
      .then(res => {
        const all: Course[] = res.data.data ?? [];
        const seen = new Map<number, CertLevel>();

        all.forEach(c => {
          if (c.certification_level) {
            seen.set(c.certification_level.id, c.certification_level);
          }
        });

        setLevels(Array.from(seen.values()));
      })
      .catch(() => setLevels([]));
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setFormError('');
    setModal('create');
  };

  const openEdit = (course: Course) => {
    setEditTarget(course);
    setForm({
      title: course.title,
      description: course.description ?? '',
      price: String(course.price),
      is_active: course.is_active,
      order_index: String(course.order_index),
      certification_level_id: String(course.certification_level_id),
    });
    setFormError('');
    setModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.certification_level_id) {
      setFormError('Nama kursus dan level wajib diisi.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      title: form.title,
      description: form.description || null,
      price: Number(form.price) || 0,
      is_active: form.is_active,
      order_index: Number(form.order_index) || 0,
      certification_level_id: Number(form.certification_level_id),
    };

    try {
      if (modal === 'create') {
        await api.post('/admin/courses', payload);
      } else if (modal === 'edit' && editTarget) {
        await api.patch(`/admin/courses/${editTarget.id}`, payload);
      }

      setModal(null);
      fetchCourses();
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;

      setFormError(msg ?? 'Gagal menyimpan kursus.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/admin/courses/${deleteTarget.id}`);
      setDeleteTarget(null);

      if (courses.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        fetchCourses();
      }
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;

      alert(msg ?? 'Gagal menghapus kursus.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      await api.patch(`/admin/courses/${course.id}`, {
        is_active: !course.is_active,
      });

      fetchCourses();
    } catch {
      alert('Gagal mengubah status kursus.');
    }
  };

  const foundation = courses.filter(
    c => c.certification_level?.code === 'FND'
  );

  const specialization = courses.filter(
    c => c.certification_level?.code === 'SPEC'
  );

  return (
    <div className="animate-fadeup flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">
            Manajemen Kursus
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola kurikulum Foundation & Specialization — {total} kursus
            terdaftar
          </p>
        </div>

        <button
          id="btn-create-course"
          onClick={openCreate}
          className="btn btn-primary whitespace-nowrap inline-flex items-center gap-1.5"
        >
          <LineIcon name="plus" size={16} />
          Tambah Kursus
        </button>
      </div>

      {/* Toolbar */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <LineIcon name="search-1" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            id="course-search"
            type="text"
            placeholder="Cari nama kursus..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="form-input pl-9 py-2 text-sm w-full"
          />
        </div>

        <div className="flex gap-2">
          {(['', 'FND', 'SPEC'] as const).map(lvl => (
            <button
              key={lvl || 'all'}
              onClick={() => handleFilterChange(lvl)}
              className={`btn btn-sm ${filterLevel === lvl ? 'btn-primary' : 'btn-secondary'
                }`}
            >
              {lvl === ''
                ? 'Semua'
                : lvl === 'FND'
                  ? 'Foundation'
                  : 'Specialization'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400 gap-2">
          <svg
            className="animate-spin h-5 w-5 text-navy"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Memuat kursus...
        </div>
      ) : courses.length === 0 ? (
        <div className="flex-1 card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
            <LineIcon name="book-1" size={32} className="text-blue-400" />
          </div>

          <p className="font-semibold text-navy-dark">
            Tidak ada kursus ditemukan
          </p>

          <p className="text-slate-400 text-sm mt-1">
            Coba ubah filter atau tambah kursus baru
          </p>

          <button
            onClick={openCreate}
            className="btn btn-primary btn-sm mt-5 inline-flex items-center gap-1.5"
          >
            <LineIcon name="plus" size={14} />
            Tambah Kursus Pertama
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-8">
            {/* Foundation */}
            {foundation.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-300">
                    Foundation Level
                  </span>

                  <span className="text-slate-400 text-sm">
                    {foundation.length} program
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {foundation.map(c => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onToggle={toggleActive}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Specialization */}
            {specialization.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-navy/10 text-navy border-navy/30">
                    Specialization Level
                  </span>

                  <span className="text-slate-400 text-sm">
                    {specialization.length} track
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {specialization.map(c => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onToggle={toggleActive}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="card mt-8 sticky bottom-0 sm:bottom-4 z-20 shadow-lg shadow-navy/5 backdrop-blur-md bg-white/95 border border-slate-200/90 p-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  Menampilkan{' '}
                  <strong className="text-navy-dark font-bold">{from}</strong>{' '}
                  –{' '}
                  <strong className="text-navy-dark font-bold">{to}</strong>{' '}
                  dari{' '}
                  <strong className="text-navy-dark font-bold">
                    {total}
                  </strong>{' '}
                  kursus
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-200 pl-3">
                  <span>Tampilkan:</span>

                  <select
                    value={perPage}
                    onChange={e =>
                      handlePerPageChange(Number(e.target.value))
                    }
                    className="form-input py-1 px-2 text-xs rounded-lg border-slate-200 bg-white text-navy font-semibold outline-none cursor-pointer"
                  >
                    <option value={5}>5 per halaman</option>
                    <option value={10}>10 per halaman</option>
                    <option value={20}>20 per halaman</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-prev-page"
                  onClick={() =>
                    setCurrentPage(p => Math.max(1, p - 1))
                  }
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <LineIcon name="chevron-left" size={14} />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(currentPage, lastPage).map((p, idx) =>
                    p === '...' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-xs text-slate-400 font-medium"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setCurrentPage(Number(p))}
                        disabled={loading}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${currentPage === p
                            ? 'bg-navy text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-navy-dark'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  id="btn-next-page"
                  onClick={() =>
                    setCurrentPage(p => Math.min(lastPage, p + 1))
                  }
                  disabled={currentPage >= lastPage || loading}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1.5"
                >
                  Selanjutnya
                  <LineIcon name="chevron-right" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeup">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-navy-dark flex items-center gap-2">
                {modal === 'create' ? (
                  <>
                    <LineIcon name="plus" size={18} />
                    Tambah Kursus Baru
                  </>
                ) : (
                  <>
                    <LineIcon name="pencil-1" size={16} className="w-4 h-4" />
                    Edit Kursus
                  </>
                )}
              </h2>

              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600"
                title="Tutup"
              >
                <LineIcon name="xmark" size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="px-6 py-5 flex flex-col gap-4"
            >
              {/* Level */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">
                  Level Sertifikasi <span className="text-red-500">*</span>
                </label>

                <select
                  required
                  value={form.certification_level_id}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      certification_level_id: e.target.value,
                    }))
                  }
                  className="form-input"
                >
                  <option value="">-- Pilih Level --</option>

                  {levels.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">
                  Nama Kursus <span className="text-red-500">*</span>
                </label>

                <input
                  id="course-title"
                  type="text"
                  required
                  placeholder="Contoh: CBEc Specialization — Blue Carbon"
                  value={form.title}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">
                  Deskripsi{' '}
                  <span className="text-slate-400 font-normal">
                    (opsional)
                  </span>
                </label>

                <textarea
                  rows={4}
                  placeholder="Deskripsi singkat tentang kursus ini..."
                  value={form.description}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="form-input resize-none"
                />
              </div>

              {/* Price & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Harga (Rp)</label>

                  <input
                    id="course-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        price: e.target.value,
                      }))
                    }
                    className="form-input"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="form-label">Urutan Tampil</label>

                  <input
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        order_index: e.target.value,
                      }))
                    }
                    className="form-input"
                  />
                </div>
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.is_active}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        is_active: e.target.checked,
                      }))
                    }
                  />

                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-navy' : 'bg-slate-300'
                      }`}
                  />

                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-4' : ''
                      }`}
                  />
                </div>

                <span className="text-sm font-medium text-slate-700">
                  {form.is_active
                    ? 'Kursus Aktif (visible)'
                    : 'Kursus Nonaktif (hidden)'}
                </span>
              </label>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  id="save-course-btn"
                  className="btn btn-primary flex-1"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Menyimpan...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LineIcon name="check" size={15} />
                      {modal === 'create'
                        ? 'Simpan Kursus'
                        : 'Update Kursus'}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeup p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <LineIcon name="xmark-circle" size={28} />
              </div>

              <h2 className="text-lg font-extrabold text-navy-dark">
                Hapus Kursus?
              </h2>

              <p className="text-slate-500 text-sm mt-2">
                Kursus <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>{' '}
                dengan{' '}
                <strong>
                  {deleteTarget.enrollments_count ?? 0} peserta
                </strong>{' '}
                akan dihapus permanen.
              </p>

              {(deleteTarget.enrollments_count ?? 0) > 0 && (
                <div className="text-red-500 text-xs mt-2 font-semibold flex items-center justify-center gap-1">
                  <LineIcon name="info" size={13} />
                  Kursus ini masih memiliki peserta aktif!
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
                className="btn flex-1 bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-1.5"
              >
                <LineIcon name="trash-3" size={15} />
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>

              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary flex-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPageNumbers(
  current: number,
  last: number
): (number | string)[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', last];
  }

  if (current >= last - 3) {
    return [1, '...', last - 4, last - 3, last - 2, last - 1, last];
  }

  return [1, '...', current - 1, current, current + 1, '...', last];
}

function CourseCard({
  course,
  onEdit,
  onDelete,
  onToggle,
}: {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onToggle: (c: Course) => void;
}) {
  const router = useRouter();
  const code = course.certification_level?.code ?? 'SPEC';
  const badge = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];

  return (
    <div
      className={`card flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${!course.is_active ? 'opacity-60' : ''
        }`}
    >
      {/* Level & status */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge}`}
        >
          {course.certification_level?.name ?? code}
        </span>

        <button
          onClick={() => onToggle(course)}
          title={course.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border transition-colors cursor-pointer ${course.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
              : 'bg-slate-100 text-slate-400 border-slate-300 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
            }`}
        >
          {course.is_active ? '● Aktif' : '○ Nonaktif'}
        </button>
      </div>

      {/* Title */}
      <div className="flex-1">
        <h3 className="font-bold text-navy-dark text-sm leading-snug">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <LineIcon name="user-multiple-4" size={13} />
          {course.enrollments_count ?? 0} peserta
        </span>

        <span className="flex items-center gap-1">
          <LineIcon name="wallet-1" size={13} />
          {course.price > 0
            ? `Rp${Number(course.price).toLocaleString('id-ID')}`
            : 'Gratis'}
        </span>

        <span>#{course.order_index}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          id={`content-course-${course.id}`}
          onClick={() =>
            router.push(`/admin/courses/${course.id}/content`)
          }
          className="btn btn-sm text-xs bg-navy/10 text-navy border border-navy/20 hover:bg-navy hover:text-white transition-colors flex-1 flex items-center justify-center gap-1.5"
        >
          <LineIcon name="book-1" size={14} />
          Kelola Konten
        </button>

        <button
          id={`edit-course-${course.id}`}
          onClick={() => onEdit(course)}
          className="btn btn-secondary btn-sm text-xs flex items-center justify-center"
          title="Edit kursus"
        >
          <LineIcon name="pencil-1" size={14} />
        </button>

        <button
          id={`delete-course-${course.id}`}
          onClick={() => onDelete(course)}
          className="btn btn-sm text-xs bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
          title="Hapus kursus"
        >
          <LineIcon name="trash-3" size={14} />
        </button>
      </div>
    </div>
  );
}