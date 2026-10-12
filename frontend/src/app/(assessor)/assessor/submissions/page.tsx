'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Submission {
  id: number;
  user: { id: number; name: string; email: string; country?: string; institution?: string };
  content: { id: number; title: string; content_type: string; max_score: number };
  essay_text: string | null;
  video_url: string | null;
  score: number | null;
  assessor_feedback: string | null;
  graded_at: string | null;
  created_at: string;
}

const TYPE_BADGE: Record<string, string> = {
  essay_task:      'bg-blue-100 text-blue-700 border-blue-300',
  oral_video_task: 'bg-purple-100 text-purple-700 border-purple-300',
  mcq_quiz:        'bg-slate-100 text-slate-600 border-slate-300',
};
const getTypeLabel = (t: any) => ({
  essay_task: <><Icon name="pen-to-square" size={16} className="mr-1.5" />{t('lbl_essay')}</>,
  oral_video_task: <><Icon name="camera-movie-1" size={16} className="mr-1.5" />{t('lbl_video')}</>,
  mcq_quiz: <><Icon name="clipboard" size={16} className="mr-1.5" />{t('lbl_mcq')}</>,
});

export default function AssessorSubmissionsPage() {
  const t = useTranslations('AssessorSubmissions');
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

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grading) return;
    setSaving(true);
    try {
      await api.patch(`/submissions/${grading.id}/grade`, {
        score: Number(score),
        assessor_feedback: feedback,
      });
      setGrading(null);
      setScore('');
      setFeedback('');
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? t('msg_grade_fail'));
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
              ) : submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-dark">{sub.user?.name}</p>
                    <p className="text-xs text-slate-400">{sub.user?.country ?? sub.user?.institution ?? sub.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="font-medium text-sm text-navy-dark truncate">{sub.content?.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${TYPE_BADGE[sub.content?.content_type] ?? 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      {(getTypeLabel(t) as any)[sub.content?.content_type] ?? sub.content?.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sub.score !== null
                      ? <span className="font-bold text-navy-dark">{sub.score}<span className="text-slate-400 font-normal">/{sub.content?.max_score ?? 100}</span></span>
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
              ))}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeup">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-navy-dark">{t('title_grade_modal')}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{grading.user?.name} — {grading.content?.title}</p>
            </div>

            <div className="px-6 py-5">
              {/* Preview jawaban */}
              {grading.essay_text && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 mb-2">{t('lbl_essay_answer')}</p>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 max-h-40 overflow-y-auto leading-relaxed">
                    {grading.essay_text}
                  </div>
                </div>
              )}
              {grading.video_url && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 mb-2">{t('lbl_oral_video')}</p>
                  {(() => {
                    const ytMatch = grading.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    const gdMatch = grading.video_url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
                    const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` : (gdMatch ? `https://drive.google.com/file/d/${gdMatch[1]}/preview` : null);
                    return embedUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black/5 mb-3 shadow-sm">
                        <iframe
                          src={embedUrl}
                          title="Oral Video Preview"
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      </div>
                    ) : null;
                  })()}
                  <a href={grading.video_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-navy text-sm font-semibold hover:underline bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                    <Icon name="camera-movie-1" size={16} className="text-rose-600" />{t('btn_open_video')} <Icon name="arrow-right" size={14} className="ml-1" />
                  </a>
                </div>
              )}

              <form onSubmit={handleGrade} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">
                    {t('lbl_score')} <span className="text-slate-400 font-normal">{t('lbl_max')} {grading.content?.max_score ?? 100})</span>
                  </label>
                  <input
                    id="grade-score"
                    type="number"
                    required
                    min={0}
                    max={grading.content?.max_score ?? 100}
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    className="form-input"
                    placeholder={t('placeholder_score')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="form-label">{t('lbl_feedback')} <span className="text-slate-400 font-normal">{t('lbl_optional')}</span></label>
                  <textarea
                    id="grade-feedback"
                    rows={4}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="form-input resize-none"
                    placeholder={t('placeholder_feedback')}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                    {saving ? t('btn_saving') : <><Icon name="check-circle-1" size={16} className="mr-1.5" />{t('btn_save_grade')}</>}
                  </button>
                  <button type="button" onClick={() => setGrading(null)} className="btn btn-secondary">
                    {t('btn_cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
