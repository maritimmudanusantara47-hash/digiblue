'use client';

import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/swal';

interface Course {
  id: number;
  title: string;
  certification_level?: { id: number; code: string; name: string };
  certificationLevel?: { id: number; code: string; name: string };
  certification_level_id?: number;
}
interface CourseBatch {
  id: number;
  course_id: number;
  batch_name: string;
  batch_code: string | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  start_date: string | null;
  end_date: string | null;
  in_class_learning_date: string | null;
  exam_mcq_date: string | null;
  exam_essay_start_date: string | null;
  exam_essay_end_date: string | null;
  exam_presentation_date: string | null;
  field_trip_date: string | null;
  certificate_issue_date: string | null;
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
  in_class_learning_date: '',
  exam_mcq_date: '',
  exam_essay_start_date: '',
  exam_essay_end_date: '',
  exam_presentation_date: '',
  field_trip_date: '',
  certificate_issue_date: '',
  is_active: true,
};

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [allBatches, setAllBatches] = useState<CourseBatch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Target count helpers
  const specCoursesCount = courses.filter(
    c => (c.certification_level?.code ?? c.certificationLevel?.code) === 'SPEC'
  ).length || 12;
  const allCoursesCount = courses.length || (specCoursesCount + 1);

  // Modal
  const [mode, setMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [referenceBatch, setReferenceBatch] = useState<CourseBatch | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<CourseBatch | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('paginate', '1');
      params.set('page', String(currentPage));
      params.set('per_page', String(perPage));
      if (filterCourse) params.set('course_id', filterCourse);
      if (filterActive === 'active') params.set('active_only', 'true');
      if (filterActive === 'inactive') params.set('inactive_only', 'true');
      const res = await api.get(`/admin/batches?${params}`);
      const payload = res.data.data;

      if (payload && Array.isArray(payload.data)) {
        setBatches(payload.data);
        setCurrentPage(payload.current_page ?? 1);
        setLastPage(payload.last_page ?? 1);
        setTotal(payload.total ?? 0);
        setFrom(payload.from ?? (payload.data.length > 0 ? (payload.current_page - 1) * perPage + 1 : 0));
        setTo(payload.to ?? (payload.data.length > 0 ? (payload.current_page - 1) * perPage + payload.data.length : 0));
      } else if (Array.isArray(payload)) {
        setBatches(payload);
        setTotal(payload.length);
        setFrom(payload.length > 0 ? 1 : 0);
        setTo(payload.length);
        setLastPage(1);
      } else {
        setBatches([]);
      }
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [filterCourse, filterActive, currentPage, perPage]);

  const handleFilterCourseChange = (val: string) => {
    setFilterCourse(val);
    setCurrentPage(1);
  };

  const handleFilterActiveChange = (val: string) => {
    setFilterActive(val);
    setCurrentPage(1);
  };

  const handlePerPageChange = (val: number) => {
    setPerPage(val);
    setCurrentPage(1);
  };

  const fetchAllBatches = useCallback(async () => {
    try {
      const res = await api.get('/admin/batches');
      setAllBatches(res.data.data ?? []);
    } catch {
      setAllBatches([]);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data ?? []);
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);
  useEffect(() => { fetchAllBatches(); }, [fetchAllBatches]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const fmtShortDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }
    catch { return d; }
  };

  const toInputDate = (d: string | null | undefined) => {
    if (!d) return '';
    if (typeof d === 'string' && d.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      return d.slice(0, 10);
    }
    try { return new Date(d).toISOString().slice(0, 10); }
    catch { return ''; }
  };

  // ── Modal open ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setMode('create');
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setReferenceBatch(null);
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
      in_class_learning_date: toInputDate(b.in_class_learning_date),
      exam_mcq_date: toInputDate(b.exam_mcq_date),
      exam_essay_start_date: toInputDate(b.exam_essay_start_date),
      exam_essay_end_date: toInputDate(b.exam_essay_end_date),
      exam_presentation_date: toInputDate(b.exam_presentation_date),
      field_trip_date: toInputDate(b.field_trip_date),
      certificate_issue_date: toInputDate(b.certificate_issue_date),
      is_active: b.is_active,
    });
    setError('');

    // Cari batch referensi sejenis dari kursus lain jika ada
    const trimmed = b.batch_name.trim().toLowerCase();
    const otherMatch = allBatches.find(
      other => other.id !== b.id && (
        other.batch_name.trim().toLowerCase() === trimmed ||
        (other.batch_code && other.batch_code.trim().toLowerCase() === trimmed)
      )
    );
    setReferenceBatch(otherMatch ?? null);
  };

  const closeModal = () => {
    setMode(null);
    setEditId(null);
    setReferenceBatch(null);
  };

  // ── Smart Auto-Fill & Schedule Consistency Handlers ───────────────────────
  const handleBatchNameChange = (val: string) => {
    setForm(prev => {
      const updated = { ...prev, batch_name: val };
      const trimmed = val.trim().toLowerCase();

      if (!trimmed) {
        setReferenceBatch(null);
        return updated;
      }

      // Cari kecocokan di database batches yang sudah ter-load
      const match = allBatches.find(
        b => b.id !== editId && (
          b.batch_name.trim().toLowerCase() === trimmed ||
          (b.batch_code && b.batch_code.trim().toLowerCase() === trimmed)
        )
      );

      if (match) {
        setReferenceBatch(match);

        // Smart Auto-Fill: Jika kolom tanggal masih kosong, otomatis isi!
        const datesEmpty = !prev.registration_start_date &&
                           !prev.registration_end_date &&
                           !prev.start_date &&
                           !prev.end_date &&
                           !prev.field_trip_date;

        if (datesEmpty) {
          updated.batch_code = prev.batch_code || match.batch_code || '';
          updated.registration_start_date = toInputDate(match.registration_start_date);
          updated.registration_end_date = toInputDate(match.registration_end_date);
          updated.start_date = toInputDate(match.start_date);
          updated.end_date = toInputDate(match.end_date);
          updated.in_class_learning_date = toInputDate(match.in_class_learning_date);
          updated.exam_mcq_date = toInputDate(match.exam_mcq_date);
          updated.exam_essay_start_date = toInputDate(match.exam_essay_start_date);
          updated.exam_essay_end_date = toInputDate(match.exam_essay_end_date);
          updated.exam_presentation_date = toInputDate(match.exam_presentation_date);
          updated.field_trip_date = toInputDate(match.field_trip_date);
          updated.certificate_issue_date = toInputDate(match.certificate_issue_date);
        }
      } else {
        setReferenceBatch(null);
      }

      return updated;
    });
  };

  const handleBatchCodeChange = (val: string) => {
    setForm(prev => {
      const updated = { ...prev, batch_code: val };
      const trimmed = val.trim().toLowerCase();

      if (!referenceBatch && trimmed) {
        const match = allBatches.find(
          b => b.id !== editId && (
            (b.batch_code && b.batch_code.trim().toLowerCase() === trimmed) ||
            b.batch_name.trim().toLowerCase() === trimmed
          )
        );

        if (match) {
          setReferenceBatch(match);
          if (!prev.batch_name) {
            updated.batch_name = match.batch_name;
          }
          const datesEmpty = !prev.registration_start_date &&
                             !prev.registration_end_date &&
                             !prev.start_date &&
                             !prev.end_date &&
                             !prev.field_trip_date;

          if (datesEmpty) {
            updated.registration_start_date = toInputDate(match.registration_start_date);
            updated.registration_end_date = toInputDate(match.registration_end_date);
            updated.start_date = toInputDate(match.start_date);
            updated.end_date = toInputDate(match.end_date);
            updated.in_class_learning_date = toInputDate(match.in_class_learning_date);
            updated.exam_mcq_date = toInputDate(match.exam_mcq_date);
            updated.exam_essay_start_date = toInputDate(match.exam_essay_start_date);
            updated.exam_essay_end_date = toInputDate(match.exam_essay_end_date);
            updated.exam_presentation_date = toInputDate(match.exam_presentation_date);
            updated.field_trip_date = toInputDate(match.field_trip_date);
            updated.certificate_issue_date = toInputDate(match.certificate_issue_date);
          }
        }
      }

      return updated;
    });
  };

  // Debounced API template lookup untuk menjamin batch yang baru/belum di-cache tetap terdeteksi
  useEffect(() => {
    if (!mode) return;

    const trimmedName = form.batch_name.trim();
    const trimmedCode = form.batch_code.trim();

    if (!trimmedName && !trimmedCode) return;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (trimmedName) params.set('batch_name', trimmedName);
        if (trimmedCode) params.set('batch_code', trimmedCode);
        if (editId) params.set('exclude_id', String(editId));

        const res = await api.get(`/admin/batches/template?${params}`);
        const template = res.data?.data as CourseBatch | null;

        if (template) {
          setReferenceBatch(template);
          // Auto-fill jika tanggal masih kosong saat template ditemukan
          setForm(f => {
            const datesEmpty = !f.registration_start_date &&
                               !f.registration_end_date &&
                               !f.start_date &&
                               !f.end_date &&
                               !f.field_trip_date;

            if (datesEmpty) {
              return {
                ...f,
                batch_code: f.batch_code || template.batch_code || '',
                registration_start_date: toInputDate(template.registration_start_date),
                registration_end_date: toInputDate(template.registration_end_date),
                start_date: toInputDate(template.start_date),
                end_date: toInputDate(template.end_date),
                in_class_learning_date: toInputDate(template.in_class_learning_date),
                exam_mcq_date: toInputDate(template.exam_mcq_date),
                exam_essay_start_date: toInputDate(template.exam_essay_start_date),
                exam_essay_end_date: toInputDate(template.exam_essay_end_date),
                exam_presentation_date: toInputDate(template.exam_presentation_date),
                field_trip_date: toInputDate(template.field_trip_date),
                certificate_issue_date: toInputDate(template.certificate_issue_date),
              };
            }
            return f;
          });
        }
      } catch {
        // silent
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.batch_name, form.batch_code, editId, mode]);

  // Tombol 1-klik untuk menyamakan dengan jadwal standar batch referensi
  const applyStandardSchedule = () => {
    if (!referenceBatch) return;
    setForm(f => ({
      ...f,
      batch_code: f.batch_code || referenceBatch.batch_code || '',
      registration_start_date: toInputDate(referenceBatch.registration_start_date),
      registration_end_date: toInputDate(referenceBatch.registration_end_date),
      start_date: toInputDate(referenceBatch.start_date),
      end_date: toInputDate(referenceBatch.end_date),
      in_class_learning_date: toInputDate(referenceBatch.in_class_learning_date),
      exam_mcq_date: toInputDate(referenceBatch.exam_mcq_date),
      exam_essay_start_date: toInputDate(referenceBatch.exam_essay_start_date),
      exam_essay_end_date: toInputDate(referenceBatch.exam_essay_end_date),
      exam_presentation_date: toInputDate(referenceBatch.exam_presentation_date),
      field_trip_date: toInputDate(referenceBatch.field_trip_date),
      certificate_issue_date: toInputDate(referenceBatch.certificate_issue_date),
    }));
  };

  // Evaluasi Inkonsistensi / Perbedaan Jadwal
  const hasReferenceSchedule = Boolean(
    referenceBatch && (
      referenceBatch.start_date ||
      referenceBatch.end_date ||
      referenceBatch.registration_start_date ||
      referenceBatch.registration_end_date ||
      referenceBatch.field_trip_date ||
      referenceBatch.exam_mcq_date ||
      referenceBatch.in_class_learning_date
    )
  );

  const hasDateDiscrepancy = Boolean(
    hasReferenceSchedule && referenceBatch && (
      toInputDate(referenceBatch.registration_start_date) !== (form.registration_start_date || '') ||
      toInputDate(referenceBatch.registration_end_date) !== (form.registration_end_date || '') ||
      toInputDate(referenceBatch.start_date) !== (form.start_date || '') ||
      toInputDate(referenceBatch.end_date) !== (form.end_date || '') ||
      toInputDate(referenceBatch.in_class_learning_date) !== (form.in_class_learning_date || '') ||
      toInputDate(referenceBatch.exam_mcq_date) !== (form.exam_mcq_date || '') ||
      toInputDate(referenceBatch.exam_essay_start_date) !== (form.exam_essay_start_date || '') ||
      toInputDate(referenceBatch.exam_essay_end_date) !== (form.exam_essay_end_date || '') ||
      toInputDate(referenceBatch.exam_presentation_date) !== (form.exam_presentation_date || '') ||
      toInputDate(referenceBatch.field_trip_date) !== (form.field_trip_date || '')
    )
  );

  const isScheduleSynced = Boolean(
    hasReferenceSchedule && referenceBatch && !hasDateDiscrepancy && (
      form.start_date || form.registration_start_date || form.field_trip_date
    )
  );

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.batch_name) {
      setError('Target kursus dan nama batch wajib diisi.');
      return;
    }

    if (form.registration_start_date && form.registration_end_date && form.registration_end_date < form.registration_start_date) {
      setError('Tanggal selesai registrasi harus sama atau setelah tanggal mulai registrasi.');
      return;
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setError('Tanggal selesai belajar harus sama atau setelah tanggal mulai belajar.');
      return;
    }

    if (form.exam_essay_start_date && form.exam_essay_end_date && form.exam_essay_end_date < form.exam_essay_start_date) {
      setError('Tenggat submit essay harus sama atau setelah tanggal mulai submit essay.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const isBulk = mode === 'create' && (form.course_id === 'all_specialization' || form.course_id === 'all_courses');
      let resMessage = '';

      if (isBulk) {
        const payload = {
          target_scope: form.course_id,
          batch_name: form.batch_name,
          batch_code: form.batch_code || null,
          registration_start_date: form.registration_start_date || null,
          registration_end_date: form.registration_end_date || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          in_class_learning_date: form.in_class_learning_date || null,
          exam_mcq_date: form.exam_mcq_date || null,
          exam_essay_start_date: form.exam_essay_start_date || null,
          exam_essay_end_date: form.exam_essay_end_date || null,
          exam_presentation_date: form.exam_presentation_date || null,
          field_trip_date: form.field_trip_date || null,
          certificate_issue_date: form.certificate_issue_date || null,
          is_active: form.is_active,
        };
        const res = await api.post('/admin/batches/bulk', payload);
        resMessage = res.data?.message ?? `Batch berhasil dibuat untuk ${form.course_id === 'all_specialization' ? `${specCoursesCount} kursus spesialisasi` : 'semua kursus'}.`;
      } else if (mode === 'create') {
        const payload = {
          course_id: Number(form.course_id),
          batch_name: form.batch_name,
          batch_code: form.batch_code || null,
          registration_start_date: form.registration_start_date || null,
          registration_end_date: form.registration_end_date || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          in_class_learning_date: form.in_class_learning_date || null,
          exam_mcq_date: form.exam_mcq_date || null,
          exam_essay_start_date: form.exam_essay_start_date || null,
          exam_essay_end_date: form.exam_essay_end_date || null,
          exam_presentation_date: form.exam_presentation_date || null,
          field_trip_date: form.field_trip_date || null,
          certificate_issue_date: form.certificate_issue_date || null,
          is_active: form.is_active,
        };
        const res = await api.post(`/admin/courses/${form.course_id}/batches`, payload);
        resMessage = res.data?.message ?? 'Batch angkatan baru berhasil dibuat.';
      } else {
        const payload = {
          course_id: Number(form.course_id),
          batch_name: form.batch_name,
          batch_code: form.batch_code || null,
          registration_start_date: form.registration_start_date || null,
          registration_end_date: form.registration_end_date || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          in_class_learning_date: form.in_class_learning_date || null,
          exam_mcq_date: form.exam_mcq_date || null,
          exam_essay_start_date: form.exam_essay_start_date || null,
          exam_essay_end_date: form.exam_essay_end_date || null,
          exam_presentation_date: form.exam_presentation_date || null,
          field_trip_date: form.field_trip_date || null,
          certificate_issue_date: form.certificate_issue_date || null,
          is_active: form.is_active,
        };
        const res = await api.patch(`/admin/batches/${editId}`, payload);
        resMessage = res.data?.message ?? 'Data batch angkatan berhasil diperbarui.';
      }

      closeModal();
      await fetchBatches();
      await fetchAllBatches();
      showSuccess('Berhasil!', resMessage);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      let msg = errData?.message;
      if (errData?.errors) {
        const firstErr = Object.values(errData.errors)[0]?.[0];
        if (firstErr) msg = firstErr;
      }
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
      await fetchAllBatches();
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
            onChange={e => handleFilterCourseChange(e.target.value)}
            className="form-input py-2 text-sm"
          >
            <option value="">Semua Kursus</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          {/* Filter: Status */}
          <select
            id="filter-active"
            value={filterActive}
            onChange={e => handleFilterActiveChange(e.target.value)}
            className="form-input py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Non-aktif Saja</option>
          </select>
        </div>
        <span className="text-slate-500 text-sm font-medium">
          Total <strong className="text-navy-dark font-bold">{total}</strong> batch ditemukan
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0 border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#001c38] text-white">
              <tr>
                <th className="px-3.5 py-3.5 text-center font-semibold w-12 text-xs">#</th>
                <th className="px-4 py-3.5 text-left font-semibold min-w-[200px] max-w-[280px] text-xs">Kursus</th>
                <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[110px] text-xs">Nama Batch</th>
                <th className="px-3 py-3.5 text-center font-semibold whitespace-nowrap w-20 text-xs">Kode</th>
                <th className="px-4 py-3.5 text-left font-semibold min-w-[270px] text-xs">Periode Belajar & Timeline</th>
                <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[110px] text-xs">Field Trip</th>
                <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[130px] text-xs">Terbit Sertifikat</th>
                <th className="px-3 py-3.5 text-center font-semibold whitespace-nowrap w-20 text-xs">Peserta</th>
                <th className="px-3 py-3.5 text-center font-semibold whitespace-nowrap w-24 text-xs">Status</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20 text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-slate-400">Memuat data batch...</td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-slate-400">
                  <Icon name="info" size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Belum ada batch. Klik &ldquo;Tambah Batch Baru&rdquo; untuk membuat.</p>
                </td></tr>
              ) : batches.map((b, i) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3.5 py-3 text-center text-slate-400 font-medium text-xs">
                    {(currentPage - 1) * perPage + i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-dark text-xs leading-snug line-clamp-2" title={b.course?.title}>
                      {b.course?.title ?? `Course #${b.course_id}`}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-navy-dark whitespace-nowrap text-xs">{b.batch_name}</td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {b.batch_code ? (
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {b.batch_code}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.start_date || b.end_date ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                          {fmtDate(b.start_date)} — {fmtDate(b.end_date)}
                        </div>
                        {(b.in_class_learning_date || b.exam_mcq_date || b.exam_essay_start_date || b.exam_presentation_date) && (
                          <div className="grid grid-cols-2 gap-1 text-[10px] w-full max-w-[280px]">
                            {b.in_class_learning_date && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap" title={`Executive In-Class Learning: ${fmtDate(b.in_class_learning_date)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                Class: {fmtShortDate(b.in_class_learning_date)}
                              </span>
                            )}
                            {b.exam_mcq_date && (
                              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold whitespace-nowrap" title={`Online Exam MCQ: ${fmtDate(b.exam_mcq_date)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                MCQ: {fmtShortDate(b.exam_mcq_date)}
                              </span>
                            )}
                            {b.exam_essay_start_date && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap col-span-2" title={`Essay Submission: ${fmtDate(b.exam_essay_start_date)}${b.exam_essay_end_date ? ` – ${fmtDate(b.exam_essay_end_date)}` : ''}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                Essay: {fmtShortDate(b.exam_essay_start_date)}{b.exam_essay_end_date ? ` – ${fmtShortDate(b.exam_essay_end_date)}` : ''}
                              </span>
                            )}
                            {b.exam_presentation_date && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium whitespace-nowrap" title={`Essay Presentation: ${fmtDate(b.exam_presentation_date)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                                Pres: {fmtShortDate(b.exam_presentation_date)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {b.field_trip_date ? fmtDate(b.field_trip_date) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {b.certificate_issue_date ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 text-[11px]">
                        <Icon name="certificate-badge-1" size={11} className="text-sky-600" />
                        {fmtDate(b.certificate_issue_date)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Otomatis</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      {b.enrollments_count ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {b.is_active ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-semibold">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-300 text-[10px] font-semibold">
                        Non-aktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        id={`btn-edit-batch-${b.id}`}
                        onClick={() => openEdit(b)}
                        title="Edit Batch"
                        className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors cursor-pointer"
                      >
                        <Icon name="pencil-1" size={18} />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-batch-${b.id}`}
                        onClick={() => setDeleteTarget(b)}
                        title="Hapus Batch"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                      >
                        <Icon name="trash-3" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                Menampilkan <strong className="text-navy-dark font-bold">{from}</strong> – <strong className="text-navy-dark font-bold">{to}</strong> dari <strong className="text-navy-dark font-bold">{total}</strong> batch
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-200 pl-3">
                <span>Tampilkan</span>
                <select
                  value={perPage}
                  onChange={e => handlePerPageChange(Number(e.target.value))}
                  className="form-input py-1 px-2 text-xs rounded-lg border-slate-200 bg-white text-navy font-semibold outline-none cursor-pointer"
                >
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                </select>
              </div>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-prev-page"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  <Icon name="arrow-left" size={14} className="mr-1" /> Prev
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(currentPage, lastPage).map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 font-medium">...</span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setCurrentPage(Number(p))}
                        disabled={loading}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          currentPage === p
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
                  onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                  disabled={currentPage >= lastPage || loading}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Next <Icon name="arrow-right" size={14} className="ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
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
              {/* Kursus / Target Kursus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">
                  {mode === 'create' ? 'Target Kursus' : 'Kursus'} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  id="select-course-target"
                  value={form.course_id}
                  onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                >
                  <option value="">— {mode === 'create' ? 'Pilih Target Kursus' : 'Pilih Kursus'} —</option>
                  {mode === 'create' && (
                    <optgroup label="⚡ Preset Otomatis (Bulk Apply)">
                      <option value="all_specialization">
                        Semua Kursus Spesialisasi ({specCoursesCount} Tracks) — Rekomendasi
                      </option>
                      <option value="all_courses">
                        Semua Kursus (Foundation + {specCoursesCount} Spesialisasi)
                      </option>
                    </optgroup>
                  )}
                  <optgroup label={mode === 'create' ? '🎯 Satu Kursus Spesifik' : 'Daftar Kursus'}>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* Callout Info Biru untuk Pilihan Massal (Bulk Apply) */}
              {mode === 'create' && form.course_id === 'all_specialization' && (
                <div
                  id="callout-all-specialization"
                  className="bg-sky-50 border border-sky-200 text-sky-900 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5 shadow-xs animate-fadein"
                >
                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="info" size={15} />
                  </div>
                  <div className="leading-relaxed">
                    <p className="font-bold text-sky-950">Mode Pembuatan Massal (Bulk Apply):</p>
                    <p className="mt-0.5 text-sky-800">
                      Batch ini akan otomatis dibuatkan untuk <strong>{specCoursesCount} kursus spesialisasi</strong> secara bersamaan dengan tanggal dan jadwal yang sama persis.
                    </p>
                  </div>
                </div>
              )}

              {mode === 'create' && form.course_id === 'all_courses' && (
                <div
                  id="callout-all-courses"
                  className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5 shadow-xs animate-fadein"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="info" size={15} />
                  </div>
                  <div className="leading-relaxed">
                    <p className="font-bold text-indigo-950">Mode Pembuatan Massal (Seluruh Kursus):</p>
                    <p className="mt-0.5 text-indigo-800">
                      Batch ini akan otomatis dibuatkan untuk <strong>seluruh {allCoursesCount} kursus</strong> (Foundation + Spesialisasi) secara bersamaan.
                    </p>
                  </div>
                </div>
              )}

              {/* Nama & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-dark">
                      Nama Batch <span className="text-rose-500">*</span>
                    </label>
                    {referenceBatch && (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                        Template Terdeteksi
                      </span>
                    )}
                  </div>
                  <input
                    required
                    id="input-batch-name"
                    type="text"
                    placeholder="Contoh: Batch 18"
                    value={form.batch_name}
                    onChange={e => handleBatchNameChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark">Kode Batch</label>
                  <input
                    id="input-batch-code"
                    type="text"
                    placeholder="B18"
                    value={form.batch_code}
                    onChange={e => handleBatchCodeChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* ── Schedule Conflict Warning (Inkonsistensi Tanggal) ── */}
              {hasDateDiscrepancy && referenceBatch && (
                <div
                  id="batch-schedule-conflict-warning"
                  className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col gap-3 shadow-xs animate-fadein"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon name="warning" size={18} />
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h4 className="font-bold text-amber-950 text-sm">
                          Perhatian Jadwal Berbeda:
                        </h4>
                        {referenceBatch.course?.title && (
                          <span className="text-[11px] font-medium bg-amber-200/60 text-amber-900 px-2.5 py-0.5 rounded-full">
                            Ref: {referenceBatch.course.title}
                          </span>
                        )}
                      </div>
                      <p className="text-amber-900 leading-relaxed">
                        Pada kursus lain{referenceBatch.course?.title ? ` (${referenceBatch.course.title})` : ''},{' '}
                        <strong className="text-amber-950">{referenceBatch.batch_name}</strong> dijadwalkan pada{' '}
                        {referenceBatch.start_date && referenceBatch.end_date ? (
                          <strong className="text-amber-950">
                            {fmtDate(referenceBatch.start_date)} – {fmtDate(referenceBatch.end_date)}
                          </strong>
                        ) : (
                          <strong className="text-amber-950">jadwal standar</strong>
                        )}
                        {referenceBatch.field_trip_date ? (
                          <> (Field Trip: <strong className="text-amber-950">{fmtDate(referenceBatch.field_trip_date)}</strong>)</>
                        ) : null}
                        .
                      </p>
                      {(referenceBatch.registration_start_date || referenceBatch.registration_end_date) && (
                        <p className="text-[11px] text-amber-800">
                          Registrasi: {fmtDate(referenceBatch.registration_start_date)} – {fmtDate(referenceBatch.registration_end_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-1 border-t border-amber-200/60">
                    <button
                      id="btn-apply-standard-schedule"
                      type="button"
                      onClick={applyStandardSchedule}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
                    >
                      <Icon name="check-circle-1" size={14} />
                      <span>Gunakan Jadwal Standar {referenceBatch.batch_name}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Smart Auto-Fill Confirmation Notification ── */}
              {isScheduleSynced && referenceBatch && (
                <div
                  id="batch-autofill-notification"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-fadein"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon name="check-circle-1" size={14} />
                    </div>
                    <span className="leading-relaxed">
                      💡 Tanggal disesuaikan otomatis dengan jadwal <strong>{referenceBatch.batch_name}</strong> yang sudah ada
                      {referenceBatch.course?.title ? ` (${referenceBatch.course.title})` : ''}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={applyStandardSchedule}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 shrink-0 cursor-pointer"
                    title="Klik untuk menyamakan ulang jika diperlukan"
                  >
                    Samakan Ulang
                  </button>
                </div>
              )}

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

              {/* ── Jadwal Ujian & Pembelajaran Eksekutif (Timeline Flyer) ── */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Icon name="calendar-days" size={14} />
                    </div>
                    <span className="text-xs font-bold text-navy-dark">
                      Jadwal Ujian & Pembelajaran (Timeline Flyer)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Sesuai Flyer
                  </span>
                </div>

                {/* In-Class Learning & Multiple-Choice Test */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
                      Executive In-Class Learning
                    </label>
                    <input
                      type="date"
                      value={form.in_class_learning_date}
                      onChange={e => setForm(f => ({ ...f, in_class_learning_date: e.target.value }))}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                      Online Exam: Multiple-Choice Test
                    </label>
                    <input
                      type="date"
                      value={form.exam_mcq_date}
                      onChange={e => setForm(f => ({ ...f, exam_mcq_date: e.target.value }))}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    />
                  </div>
                </div>

                {/* Case-Study Essay Submission */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      Case-Study Essay (Mulai Submit)
                    </label>
                    <input
                      type="date"
                      value={form.exam_essay_start_date}
                      onChange={e => setForm(f => ({ ...f, exam_essay_start_date: e.target.value }))}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      Case-Study Essay (Deadline Submit)
                    </label>
                    <input
                      type="date"
                      value={form.exam_essay_end_date}
                      onChange={e => setForm(f => ({ ...f, exam_essay_end_date: e.target.value }))}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                    />
                  </div>
                </div>

                {/* Case-Study Essay Presentation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                    Online Exam: Case-Study Essay Presentation
                  </label>
                  <input
                    type="date"
                    value={form.exam_presentation_date}
                    onChange={e => setForm(f => ({ ...f, exam_presentation_date: e.target.value }))}
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

              {/* Tanggal Terbit Sertifikat Resmi */}
              <div className="flex flex-col gap-1.5 bg-sky-50/60 p-3.5 rounded-2xl border border-sky-200/70">
                <div className="flex items-center gap-1.5">
                  <Icon name="certificate-badge-1" size={15} className="text-sky-700" />
                  <label className="text-xs font-bold text-sky-950">Tanggal Terbit Sertifikat Resmi (Batch)</label>
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">Jadwal Rilis</span>
                </div>
                <input
                  type="date"
                  value={form.certificate_issue_date}
                  onChange={e => setForm(f => ({ ...f, certificate_issue_date: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-sky-300 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tentukan kapan sertifikat angkatan ini akan terbit resmi. Walaupun siswa menyelesaikan tugas sebelum tanggal ini, sertifikat baru akan terbit saat tanggal ini tiba. Kosongkan jika ingin sertifikat langsung terbit otomatis saat tugas tuntas.
                </p>
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
                      <span>
                        {mode === 'create'
                          ? form.course_id === 'all_specialization'
                            ? `Membuat ${specCoursesCount} Batch...`
                            : form.course_id === 'all_courses'
                            ? `Membuat ${allCoursesCount} Batch...`
                            : 'Membuat Batch...'
                          : 'Menyimpan...'}
                      </span>
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

// ── Helper: Pagination Page Numbers ──────────────────────────────────────────
function getPageNumbers(current: number, last: number): (number | string)[] {
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
