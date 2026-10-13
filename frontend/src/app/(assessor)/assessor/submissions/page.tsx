'use client';

import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { showSuccess, showError } from '@/lib/swal';

interface Submission {
  id: number;
  user: { id: number; name: string; email: string; country?: string; institution?: string };
  content: { id: number; title: string; content_type: string; max_score: number };
  essay_text: string | null;
  video_url: string | null;
  file_share_url: string | null;
  score: number | null;
  assessor_feedback: string | null;
  graded_at: string | null;
  created_at: string;
}

const TYPE_BADGE: Record<string, string> = {
  essay_task:        'bg-blue-100 text-blue-700 border-blue-300',
  oral_video_task:   'bg-purple-100 text-purple-700 border-purple-300',
  mcq_quiz:          'bg-slate-100 text-slate-600 border-slate-300',
  critical_thinking: 'bg-indigo-100 text-indigo-700 border-indigo-300',
};

const getTypeLabel = (t: any) => ({
  essay_task:        <><Icon name="pen-to-square" size={16} className="mr-1.5" />{t('lbl_essay')}</>,
  oral_video_task:   <><Icon name="camera-movie-1" size={16} className="mr-1.5" />{t('lbl_video')}</>,
  mcq_quiz:          <><Icon name="clipboard" size={16} className="mr-1.5" />{t('lbl_mcq')}</>,
  critical_thinking: <><Icon name="bulb-2" size={16} className="mr-1.5" />Critical Thinking</>,
});

const resolveFileUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};

function AssessorSubmissionsContent() {
  const t = useTranslations('AssessorSubmissions');
  const searchParams = useSearchParams();
  const submissionIdParam = searchParams.get('submissionId');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState('pending');
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const perPage = 15;

  // Grading modal
  const [grading, setGrading]     = useState<Submission | null>(null);
  const [score, setScore]         = useState('');
  const [feedback, setFeedback]   = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/submissions?${params}`);
      const d   = res.data.data;
      setSubmissions(Array.isArray(d) ? d : d?.data ?? []);
      setTotal(d?.meta?.total ?? d?.total ?? 0);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Handle direct navigation or URL query param e.g. ?submissionId=123
  useEffect(() => {
    if (!submissionIdParam) return;

    const found = submissions.find((s) => String(s.id) === String(submissionIdParam));
    if (found) {
      setGrading(found);
      setScore(found.score !== null ? String(found.score) : '');
      setFeedback(found.assessor_feedback ?? '');
    } else if (!loading) {
      api.get(`/submissions/${submissionIdParam}`)
        .then((res) => {
          const item = res.data.data;
          if (item) {
            setGrading(item);
            setScore(item.score !== null ? String(item.score) : '');
            setFeedback(item.assessor_feedback ?? '');
          }
        })
        .catch((err) => {
          console.error('Failed to load submission by query param:', err);
        });
    }
  }, [submissionIdParam, loading, submissions]);

  const closeModal = () => {
    setGrading(null);
    setScore('');
    setFeedback('');
    if (submissionIdParam && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('submissionId');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grading) return;
    setSaving(true);
    try {
      await api.patch(`/submissions/${grading.id}/grade`, {
        score: Number(score),
        assessor_feedback: feedback,
      });
      closeModal();
      showSuccess('Berhasil Dinilai!', 'Penilaian tugas berhasil disimpan.');
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal Menilai', msg ?? t('msg_grade_fail'));
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Filter */}
      <div className="card mb-6 flex gap-3 items-center">
        {(['pending', 'graded', ''] as const).map((s) => (
          <button
            key={s}
            id={`filter-${s || 'all'}`}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s === 'pending' ? <><Icon name="hourglass" size={16} className="mr-1.5" />{t('opt_pending')}</> : s === 'graded' ? <><Icon name="check-circle-1" size={16} className="mr-1.5" />{t('opt_graded')}</> : t('opt_all')}
          </button>
        ))}
        <span className="ml-auto text-slate-400 text-sm">{total} {t('lbl_task_count')}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t('col_participant')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_task')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_type')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_score')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_submit_date')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t('msg_loading')}
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {statusFilter === 'pending' ? <><Icon name="party-spray" size={16} className="mr-1.5" />{t('msg_all_graded')}</> : t('msg_empty')}
                  </td>
                </tr>
              ) : submissions.map((sub) => {
                const maxScore = sub.content?.max_score && sub.content.max_score > 0 ? sub.content.max_score : 100;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-dark">{sub.user?.name}</p>
                      <p className="text-xs text-slate-400">{sub.user?.country ?? sub.user?.institution ?? sub.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm text-navy-dark truncate">{sub.content?.title}</p>
                        {sub.file_share_url && (
                          <span title="Ada lampiran berkas dokumen" className="text-sky-600 shrink-0">
                            <Icon name="paperclip-1" size={13} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${TYPE_BADGE[sub.content?.content_type] ?? 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {(getTypeLabel(t) as any)[sub.content?.content_type] ?? sub.content?.content_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.score !== null
                        ? <span className="font-bold text-navy-dark">{sub.score}<span className="text-slate-400 font-normal">/{maxScore}</span></span>
                        : <span className="text-amber-500 text-xs font-semibold">{t('lbl_not_graded')}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        id={`grade-btn-${sub.id}`}
                        onClick={() => {
                          setGrading(sub);
                          setScore(sub.score !== null ? String(sub.score) : '');
                          setFeedback(sub.assessor_feedback ?? '');
                        }}
                        className="btn btn-sm btn-secondary text-xs"
                      >
                        {sub.score !== null ? <><Icon name="pencil-1" size={16} className="mr-1.5" />{t('btn_edit_grade')}</> : <><Icon name="pen-to-square" size={16} className="mr-1.5" />{t('btn_grade')}</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm disabled:opacity-40"><Icon name="arrow-left" size={16} className="mr-1.5" />{t('btn_prev')}</button>
            <span className="text-sm text-slate-500">{t('lbl_page')} {page} {t('lbl_of')} {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm disabled:opacity-40">{t('btn_next')} <Icon name="arrow-right" size={14} className="ml-1.5" /></button>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {grading && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fadeup p-6 sm:p-7 relative my-auto border border-slate-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <Icon name="pen-to-square" size={18} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#00162d] leading-tight">{t('title_grade_modal')}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {grading.user?.name} &bull; {grading.content?.title}
                    </p>
                  </div>
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

              <div>
                {/* Preview jawaban teks esai */}
                {grading.essay_text && (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-navy-dark mb-2 flex items-center gap-1.5">
                      <Icon name="book-open" size={14} className="text-navy" />
                      <span>{t('lbl_essay_answer')}</span>
                    </p>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-sm text-slate-700 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                      {grading.essay_text}
                    </div>
                  </div>
                )}

                {/* Preview berkas dokumen lampiran */}
                {grading.file_share_url && (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-navy-dark mb-2 flex items-center gap-1.5">
                      <Icon name="paperclip-1" size={14} className="text-sky-600" />
                      <span>Berkas Dokumen Lampiran Jawaban</span>
                    </p>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                          <Icon name="file-text" size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {decodeURIComponent(grading.file_share_url.split('/').pop()?.split('?')[0] || 'Dokumen Tugas')}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {grading.file_share_url}
                          </p>
                        </div>
                      </div>
                      <a
                        href={resolveFileUrl(grading.file_share_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all shadow-xs shrink-0"
                      >
                        <Icon name="paperclip-1" size={14} />
                        <span>Buka / Unduh Berkas</span>
                        <Icon name="arrow-right" size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Preview video */}
                {grading.video_url && (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-navy-dark mb-2 flex items-center gap-1.5">
                      <Icon name="camera-movie-1" size={14} className="text-rose-500" />
                      <span>{t('lbl_oral_video')}</span>
                    </p>
                    {(() => {
                      const ytMatch = grading.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                      const gdMatch = grading.video_url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
                      const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` : (gdMatch ? `https://drive.google.com/file/d/${gdMatch[1]}/preview` : null);
                      return embedUrl ? (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black/5 mb-3 shadow-sm">
                          <iframe
                            src={embedUrl}
                            title="Oral Video Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      ) : null;
                    })()}
                    <a
                      href={grading.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-navy text-sm font-semibold hover:underline bg-slate-50 px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <Icon name="camera-movie-1" size={16} className="text-rose-600" />
                      <span>{t('btn_open_video')}</span>
                      <Icon name="arrow-right" size={14} className="ml-0.5 text-slate-400" />
                    </a>
                  </div>
                )}

                {/* Jika kosong tanpa teks/dokumen/video */}
                {!grading.essay_text && !grading.file_share_url && !grading.video_url && (
                  <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Peserta belum menyertakan naskah esai, dokumen lampiran, maupun tautan video dalam pengumpulan ini.
                  </div>
                )}

                <form onSubmit={handleGrade} className="flex flex-col gap-4">
                  {(() => {
                    const maxScore = grading.content?.max_score && grading.content.max_score > 0 ? grading.content.max_score : 100;
                    return (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-navy-dark">
                          {t('lbl_score')} <span className="text-slate-400 font-normal">({t('lbl_max')} {maxScore})</span> <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="grade-score"
                          type="number"
                          required
                          min={0}
                          max={maxScore}
                          value={score}
                          onChange={e => setScore(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700"
                          placeholder={t('placeholder_score')}
                        />
                      </div>
                    );
                  })()}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy-dark">
                      {t('lbl_feedback')} <span className="text-slate-400 font-normal">({t('lbl_optional')})</span>
                    </label>
                    <textarea
                      id="grade-feedback"
                      rows={4}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all bg-white text-slate-700 resize-none"
                      placeholder={t('placeholder_feedback')}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {t('btn_cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-sm font-semibold rounded-full bg-[#112a46] hover:bg-[#00162d] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {saving ? t('btn_saving') : <><Icon name="check-circle-1" size={16} /><span>{t('btn_save_grade')}</span></>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default function AssessorSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Memuat data penilaian...</span>
          </div>
        </div>
      }
    >
      <AssessorSubmissionsContent />
    </Suspense>
  );
}
