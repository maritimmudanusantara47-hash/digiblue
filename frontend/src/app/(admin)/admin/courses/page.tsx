'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface CertLevel { id: number; code: string; name: string }
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
  FND:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  SPEC: 'bg-navy/10 text-navy border-navy/30',
  NAT:  'bg-amber-100 text-amber-800 border-amber-300',
  SGL:  'bg-purple-100 text-purple-800 border-purple-300',
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
  const t = useTranslations('AdminCourses');
  const [courses, setCourses]       = useState<Course[]>([]);
  const [levels, setLevels]         = useState<CertLevel[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterLevel, setFilter]    = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(5);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [from, setFrom]               = useState(0);
  const [to, setTo]                   = useState(0);

  // Modal
  const [modal, setModal]                       = useState<ModalMode>(null);
  const [editTarget, setEditTarget]             = useState<Course | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [form, setForm]                         = useState({ ...emptyForm });
  const [saving, setSaving]                     = useState(false);
  const [formError, setFormError]               = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('paginate', 'true');
      params.set('per_page', String(perPage));
      params.set('page', String(currentPage));
      if (search.trim()) params.set('search', search.trim());
      if (filterLevel)   params.set('level', filterLevel);

      const res = await api.get(`/admin/courses?${params.toString()}`);
      const payload = res.data.data;

      if (payload && Array.isArray(payload.data)) {
        setCourses(payload.data);
        setCurrentPage(payload.current_page ?? 1);
        setLastPage(payload.last_page ?? 1);
        setTotal(payload.total ?? 0);
        setFrom(payload.from ?? (payload.data.length > 0 ? (payload.current_page - 1) * perPage + 1 : 0));
        setTo(payload.to ?? (payload.data.length > 0 ? (payload.current_page - 1) * perPage + payload.data.length : 0));
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

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

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
    // Fetch certification levels for dropdown
    api.get('/certification-levels').then(res => {
      setLevels(res.data.data ?? []);
    }).catch(() => setLevels([]));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setSelectedCategory('');
    setFormError('');
    setModal('create');
  };

  const openEdit = (course: Course) => {
    setEditTarget(course);
    const code = course.certification_level?.code ?? '';
    let category = '';
    if (['FND', 'SPEC', 'INT_CERT'].includes(code)) {
      category = 'INTERNATIONAL';
    } else if (['NAT', 'NAT_TRN'].includes(code)) {
      category = 'NATIONAL';
    } else if (['SGL', 'MOD', 'SINGLE'].includes(code)) {
      category = 'SINGLE_MODULE';
    }
    setSelectedCategory(category);
    setForm({
      title:                  course.title,
      description:            course.description ?? '',
      price:                  String(course.price),
      is_active:              course.is_active,
      order_index:            String(course.order_index),
      certification_level_id: String(course.certification_level_id),
    });
    setFormError('');
    setModal('edit');
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'INTERNATIONAL') {
      setForm(f => ({ ...f, certification_level_id: '' }));
    } else if (cat === 'NATIONAL') {
      const nat = levels.find(l => ['NAT', 'NAT_TRN'].includes(l.code));
      setForm(f => ({ ...f, certification_level_id: nat ? String(nat.id) : '' }));
    } else if (cat === 'SINGLE_MODULE') {
      const sgl = levels.find(l => ['SGL', 'MOD', 'SINGLE'].includes(l.code));
      setForm(f => ({ ...f, certification_level_id: sgl ? String(sgl.id) : '' }));
    } else {
      setForm(f => ({ ...f, certification_level_id: '' }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError(t('msg_title_required'));
      return;
    }
    if (!selectedCategory) {
      setFormError(t('msg_category_required'));
      return;
    }
    if (!form.certification_level_id) {
      setFormError(
        selectedCategory === 'INTERNATIONAL'
          ? t('msg_cert_type_required')
          : t('msg_level_not_found')
      );
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = {
      title:                  form.title,
      description:            form.description || null,
      price:                  Number(form.price) || 0,
      is_active:              form.is_active,
      order_index:            Number(form.order_index) || 0,
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? t('msg_save_fail'));
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? t('msg_delete_fail'));
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      await api.patch(`/admin/courses/${course.id}`, { is_active: !course.is_active });
      fetchCourses();
    } catch {
      alert(t('msg_toggle_fail'));
    }
  };

  // ── Slices per group for current page ─────────────────────────────────────
  const isInternational = (c: Course) => ['FND', 'SPEC', 'INT_CERT'].includes(c.certification_level?.code || '');
  const isNational = (c: Course) => ['NAT', 'NAT_TRN'].includes(c.certification_level?.code || '');
  const isSingleModule = (c: Course) => ['SGL', 'MOD', 'SINGLE'].includes(c.certification_level?.code || '');

  const intCourses = courses.filter(isInternational);
  const foundationCourses = intCourses.filter(c => c.certification_level?.code === 'FND');
  const specializationCourses = intCourses.filter(c => c.certification_level?.code === 'SPEC');
  const otherIntCourses = intCourses.filter(c => !['FND', 'SPEC'].includes(c.certification_level?.code || ''));

  const nationalCourses = courses.filter(isNational);
  const singleModuleCourses = courses.filter(isSingleModule);
  const uncategorizedCourses = courses.filter(c => !isInternational(c) && !isNational(c) && !isSingleModule(c));

  return (
    <div className="animate-fadeup flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('subtitle', { total })}
          </p>
        </div>
        <button id="btn-create-course" onClick={openCreate} className="btn btn-primary whitespace-nowrap">
          {t('btn_add_course')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="card mb-6 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><Icon name="search-1" size={14} /></span>
            <input
              id="course-search"
              type="text"
              placeholder={t('placeholder_search')}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="form-input pl-9 py-2 text-sm w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFilterChange('')}
              className={`btn btn-sm ${filterLevel === '' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('filter_all')}
            </button>

            <button
              onClick={() => handleFilterChange(['INT_CERT', 'FND', 'SPEC'].includes(filterLevel) ? '' : 'INT_CERT')}
              className={`btn btn-sm ${
                ['INT_CERT', 'FND', 'SPEC'].includes(filterLevel) ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {t('filter_int')}
            </button>

            <button
              onClick={() => handleFilterChange(filterLevel === 'NAT' ? '' : 'NAT')}
              className={`btn btn-sm ${filterLevel === 'NAT' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('filter_nat')}
            </button>

            <button
              onClick={() => handleFilterChange(filterLevel === 'SGL' ? '' : 'SGL')}
              className={`btn btn-sm ${filterLevel === 'SGL' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('filter_sgl')}
            </button>
          </div>
        </div>

        {/* Sub-filter untuk International Certification Track (Foundation & Specialization) */}
        {['INT_CERT', 'FND', 'SPEC'].includes(filterLevel) && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 animate-fadeup flex-wrap">
            <span className="text-xs font-semibold text-slate-500">{t('lbl_track_int')}</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleFilterChange('INT_CERT')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  filterLevel === 'INT_CERT' ? 'bg-white shadow text-navy font-bold' : 'text-slate-600 hover:text-navy'
                }`}
              >
                {t('filter_all_track')}
              </button>
              <button
                onClick={() => handleFilterChange('FND')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  filterLevel === 'FND' ? 'bg-white shadow text-emerald-700 font-bold' : 'text-slate-600 hover:text-navy'
                }`}
              >
                {t('filter_fnd')}
              </button>
              <button
                onClick={() => handleFilterChange('SPEC')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  filterLevel === 'SPEC' ? 'bg-white shadow text-navy font-bold' : 'text-slate-600 hover:text-navy'
                }`}
              >
                {t('filter_spec')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {t('msg_loading')}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex-1 card py-16 text-center">
          <div className="text-5xl mb-4"><Icon name="books-2" size={48} /></div>
          <p className="font-semibold text-navy-dark">{t('msg_empty')}</p>
          <p className="text-slate-400 text-sm mt-1">{t('desc_empty')}</p>
          <button onClick={openCreate} className="btn btn-primary btn-sm mt-5 inline-flex">
            {t('btn_add_first')}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-8">
            {/* 1. International Certification Training Course */}
            {intCourses.length > 0 && (
              <section className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold border bg-navy text-white border-navy shadow-sm">
                      {t('filter_int')}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">{intCourses.length} {t('lbl_courses')}</span>
                  </div>
                  <span className="text-xs text-slate-400">{t('lbl_fnd_spec_track')}</span>
                </div>

                <div className="space-y-6">
                  {/* Foundation */}
                  {foundationCourses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-800 border-emerald-300">
                          {t('lbl_fnd_level')}
                        </span>
                        <span className="text-slate-400 text-xs">{foundationCourses.length} {t('lbl_program')}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {foundationCourses.map(c => <CourseCard key={c.id} course={c} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} t={t} />)}
                      </div>
                    </div>
                  )}

                  {/* Specialization */}
                  {specializationCourses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-navy/10 text-navy border-navy/30">
                          {t('lbl_spec_level')}
                        </span>
                        <span className="text-slate-400 text-xs">{specializationCourses.length} {t('lbl_track')}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {specializationCourses.map(c => <CourseCard key={c.id} course={c} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} t={t} />)}
                      </div>
                    </div>
                  )}

                  {/* Other International */}
                  {otherIntCourses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {otherIntCourses.map(c => <CourseCard key={c.id} course={c} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} t={t} />)}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 2. National Training Course */}
            {nationalCourses.length > 0 && (
              <section className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold border bg-amber-600 text-white border-amber-600 shadow-sm">
                    {t('filter_nat')}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">{nationalCourses.length} {t('lbl_courses')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {nationalCourses.map(c => <CourseCard key={c.id} course={c} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} t={t} />)}
                </div>
              </section>
            )}

            {/* 3. Single Modul Course */}
            {singleModuleCourses.length > 0 && (
              <section className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold border bg-purple-600 text-white border-purple-600 shadow-sm">
                    {t('filter_sgl')}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">{singleModuleCourses.length} {t('lbl_courses')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {singleModuleCourses.map(c => <CourseCard key={c.id} course={c} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} t={t} />)}
                </div>
              </section>
            )}

            {/* Uncategorized fallback */}
            {uncategorizedCourses.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-slate-200 text-slate-700">
                    {t('lbl_other_courses')}
                  </span>
                  <span className="text-slate-400 text-sm">{uncategorizedCourses.length} {t('lbl_courses')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {uncategorizedCourses.map(c => <CourseCard key={c.id} course={c} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} t={t} />)}
                </div>
              </section>
            )}
          </div>

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="card mt-8 sticky bottom-0 sm:bottom-4 z-20 shadow-lg shadow-navy/5 backdrop-blur-md bg-white/95 border border-slate-200/90 p-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  {t('lbl_showing')} <strong className="text-navy-dark font-bold">{from}</strong> – <strong className="text-navy-dark font-bold">{to}</strong> {t('lbl_from')} <strong className="text-navy-dark font-bold">{total}</strong> {t('lbl_courses')}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-200 pl-3">
                  <span>{t('lbl_show')}</span>
                  <select
                    value={perPage}
                    onChange={e => handlePerPageChange(Number(e.target.value))}
                    className="form-input py-1 px-2 text-xs rounded-lg border-slate-200 bg-white text-navy font-semibold outline-none cursor-pointer"
                  >
                    <option value={5}>{t('opt_5_per_page')}</option>
                    <option value={10}>{t('opt_10_per_page')}</option>
                    <option value={20}>{t('opt_20_per_page')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-prev-page"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  <Icon name="arrow-left" size={16} className="mr-1.5" />{t('btn_prev')}
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
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
                  {t('btn_next')} <Icon name="arrow-right" size={14} className="ml-1.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeup">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-navy-dark">
                {modal === 'create' ? t('title_add_course') : <><Icon name="pencil-1" size={16} className="mr-1.5" />{t('title_edit_course')}</>}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
              {/* Kategori Kursus */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">{t('lbl_category')} <span className="text-red-500">*</span></label>
                <select
                  required
                  value={selectedCategory}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="form-input"
                >
                  <option value="">{t('opt_select_category')}</option>
                  <option value="INTERNATIONAL">International Certification Training Course</option>
                  <option value="NATIONAL">National Training Course</option>
                  <option value="SINGLE_MODULE">Single Modul Course</option>
                </select>
              </div>

              {/* Pilihan Khusus jika Kategori International dipilih */}
              {selectedCategory === 'INTERNATIONAL' && (
                <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-fadeup">
                  <div className="flex items-center justify-between">
                    <label className="form-label text-xs font-bold text-navy-dark">
                      {t('lbl_int_track_opt')} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">{t('lbl_choose_one')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Option Foundation */}
                    {(() => {
                      const fnd = levels.find(l => l.code === 'FND');
                      const isSelected = form.certification_level_id === String(fnd?.id);
                      return (
                        <button
                          type="button"
                          onClick={() => fnd && setForm(f => ({ ...f, certification_level_id: String(fnd.id) }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/20 text-emerald-900 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-sm">Foundation</span>
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">{t('desc_fnd')}</p>
                        </button>
                      );
                    })()}

                    {/* Option Specialization */}
                    {(() => {
                      const spec = levels.find(l => l.code === 'SPEC');
                      const isSelected = form.certification_level_id === String(spec?.id);
                      return (
                        <button
                          type="button"
                          onClick={() => spec && setForm(f => ({ ...f, certification_level_id: String(spec.id) }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-400/20 text-sky-900 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-sm">Specialization</span>
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">{t('desc_spec')}</p>
                        </button>
                      );
                    })()}
                  </div>
                  {!form.certification_level_id && (
                    <span className="text-[11px] text-amber-600 font-medium">
                      {t('msg_click_fnd_spec')}
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">{t('lbl_course_name')} <span className="text-red-500">*</span></label>
                <input
                  id="course-title"
                  type="text"
                  required
                  placeholder={t('placeholder_course_name')}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label">{t('lbl_desc')} <span className="text-slate-400 font-normal">{t('lbl_optional')}</span></label>
                <textarea
                  rows={4}
                  placeholder={t('placeholder_desc')}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="form-input resize-none"
                />
              </div>

              {/* Price & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('lbl_price')}</label>
                  <input
                    id="course-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('lbl_order')}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={e => setForm(f => ({ ...f, order_index: e.target.value }))}
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
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-navy' : 'bg-slate-300'}`} />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {form.is_active ? t('lbl_active_visible') : t('lbl_inactive_hidden')}
                </span>
              </label>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} id="save-course-btn" className="btn btn-primary flex-1">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t('btn_saving')}
                    </span>
                  ) : modal === 'create' ? <><Icon name="check-circle-1" size={16} className="mr-1.5" />{t('btn_save')}</> : <><Icon name="check-circle-1" size={16} className="mr-1.5" />{t('btn_update')}</>}
                </button>
                <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">
                  {t('btn_cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeup p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3"><Icon name="info" size={48} /></div>
              <h2 className="text-lg font-extrabold text-navy-dark">{t('title_delete')}</h2>
              <p className="text-slate-500 text-sm mt-2">
                {t('desc_delete', { title: deleteTarget.title, count: deleteTarget.enrollments_count ?? 0 })}
              </p>
              {(deleteTarget.enrollments_count ?? 0) > 0 && (
                <p className="text-red-500 text-xs mt-2 font-semibold">
                  <Icon name="info" size={16} className="mr-1.5" />{t('msg_active_participants')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                id="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
                className="btn flex-1 bg-red-500 text-white hover:bg-red-600"
              >
                {deleting ? t('btn_deleting') : <><Icon name="trash-3" size={16} className="mr-1.5" />{t('btn_delete')}</>}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </div>
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

// ── Course Card Component ────────────────────────────────────────────────────
function CourseCard({
  course, onEdit, onDelete, onToggle, t
}: {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onToggle: (c: Course) => void;
  t: any;
}) {
  const router = useRouter();
  const code  = course.certification_level?.code ?? 'SPEC';
  const badge = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];

  return (
    <div className={`card flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${!course.is_active ? 'opacity-60' : ''}`}>
      {/* Level & status */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge}`}>
          {course.certification_level?.name ?? code}
        </span>
        <button
          onClick={() => onToggle(course)}
          title={course.is_active ? t('tooltip_deactivate') : t('tooltip_activate')}
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border transition-colors cursor-pointer ${
            course.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
              : 'bg-slate-100 text-slate-400 border-slate-300 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
          }`}
        >
          {course.is_active ? t('badge_active') : t('badge_inactive')}
        </button>
      </div>

      {/* Title */}
      <div className="flex-1">
        <h3 className="font-bold text-navy-dark text-sm leading-snug">{course.title}</h3>
        {course.description && (
          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{course.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span><Icon name="user-multiple-4" size={16} className="mr-1.5" />{course.enrollments_count ?? 0} {t('lbl_participants')}</span>
        <span><Icon name="dollar-circle" size={16} className="mr-1.5" />{course.price > 0 ? `Rp${Number(course.price).toLocaleString('id-ID')}` : t('lbl_free')}</span>
        <span>#{course.order_index}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          id={`content-course-${course.id}`}
          onClick={() => router.push(`/admin/courses/${course.id}/content`)}
          className="btn btn-sm text-xs bg-navy/10 text-navy border border-navy/20 hover:bg-navy hover:text-white transition-colors flex-1"
        >
          <Icon name="books-2" size={16} className="mr-1.5" />{t('btn_manage_content')}
        </button>
        <button
          id={`edit-course-${course.id}`}
          onClick={() => onEdit(course)}
          className="btn btn-secondary btn-sm text-xs"
        ><Icon name="pencil-1" size={16} />
        </button>
        <button
          id={`delete-course-${course.id}`}
          onClick={() => onDelete(course)}
          className="btn btn-sm text-xs bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white transition-colors"
        ><Icon name="trash-3" size={16} />
        </button>
      </div>
    </div>
  );
}
