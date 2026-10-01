'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizOption  { id: number; option_text: string }
interface QuizQuestion { id: number; question_text: string; weight_score: number; options: QuizOption[] }
interface Content {
  id: number;
  content_type: 'pdf_module' | 'video_embed' | 'mcq_quiz' | 'essay_task' | 'oral_video_task' | 'critical_thinking';
  title: string;
  file_path: string | null;
  embed_url: string | null;
  instruction_text: string | null;
  max_score: number;
  is_prerequisite: boolean;
  order_index: number;
  quiz_questions?: QuizQuestion[];
}
interface Section { id: number; title: string; order_index: number; contents: Content[] }
interface CourseData { id: number; title: string; slug: string }
interface EnrollInfo { id: number; status: string; enrollment_type: string; attended_field_trip: boolean }
interface PageData { enrollment: EnrollInfo; course: CourseData; sections: Section[] }
interface Submission {
  content_id: number;
  score: number | null;
  correct_count?: number | null;
  total_questions?: number | null;
  assessor_feedback: string | null;
  graded_at: string | null;
  essay_text?: string | null;
  video_url?: string | null;
  file_share_url?: string | null;
  status?: string;
}

const CONTENT_META: Record<string, { icon: string; label: string; color: string; badge: string }> = {
  pdf_module:       { icon: '📄', label: 'Learning Module',       color: 'blue',   badge: 'bg-blue-100 text-blue-700' },
  video_embed:      { icon: '🎬', label: 'Video Lecture',         color: 'purple', badge: 'bg-purple-100 text-purple-700' },
  mcq_quiz:         { icon: '📝', label: 'Multiple Choice Exam',  color: 'amber',  badge: 'bg-amber-100 text-amber-700' },
  essay_task:       { icon: '✍️', label: 'Case-Study Essay',       color: 'teal',   badge: 'bg-teal-100 text-teal-700' },
  oral_video_task:  { icon: '🎥', label: 'Oral Video Exam',       color: 'rose',   badge: 'bg-rose-100 text-rose-700' },
  critical_thinking:{ icon: '💡', label: 'Critical Thinking',     color: 'indigo', badge: 'bg-indigo-100 text-indigo-700' },
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StudentCoursePage() {
  const params  = useParams<{ slug: string }>();
  const router  = useRouter();
  const [data, setData]               = useState<PageData | null>(null);
  const [submissions, setSubmissions] = useState<Map<number, Submission>>(new Map());
  const [activeContent, setActive]    = useState<Content | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const refreshSubmissions = useCallback(async () => {
    try {
      const subRes = await api.get('/submissions/my');
      const subList = subRes.data.data ?? [];
      const map = new Map<number, Submission>();
      (Array.isArray(subList) ? subList : []).forEach((s: Submission & { content_id: number }) => {
        map.set(s.content_id, s);
      });
      setSubmissions(map);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    api.get('/enrollments').then(async (res) => {
      const enrList = res.data.data ?? [];
      const found = (Array.isArray(enrList) ? enrList : [])
        .find((e: { course: { slug: string }; id: number }) => e.course?.slug === params.slug);

      if (!found) {
        setError('Kamu belum terdaftar di kursus ini.');
        setLoading(false);
        return;
      }

      if (found.status !== 'active' && found.status !== 'completed') {
        setError(`Akses kursus belum aktif. Status: ${found.status === 'payment_pending' ? 'Menunggu Pembayaran' : 'Menunggu Kurasi Admin'}`);
        setLoading(false);
        return;
      }

      const [contentRes] = await Promise.all([
        api.get(`/enrollments/${found.id}/contents`),
      ]);

      const pageData: PageData = contentRes.data.data;
      setData(pageData);

      const firstContent = pageData.sections?.[0]?.contents?.[0];
      if (firstContent) setActive(firstContent);

      await refreshSubmissions();
    }).catch(() => {
      setError('Gagal memuat konten kursus.');
    }).finally(() => setLoading(false));
  }, [params.slug, refreshSubmissions]);

  const totalContents  = data?.sections.reduce((acc, s) => acc + s.contents.length, 0) ?? 0;
  const completedCount = [...submissions.values()].filter(s => s.score !== null).length;
  const progressPct    = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
      <svg className="animate-spin h-6 w-6 text-navy" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-sm font-medium">Memuat materi kursus...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-6xl">🔒</div>
      <h2 className="text-lg font-bold text-navy-dark">{error}</h2>
      <button onClick={() => router.push('/student/catalog')} className="btn btn-secondary">
        ← Kembali ke Katalog
      </button>
    </div>
  );

  if (!data) return null;

  return (
    <div className="animate-fadeup flex gap-0 min-h-[80vh]">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-slate-50 rounded-l-2xl overflow-y-auto max-h-[calc(100vh-120px)] sticky top-0">
        {/* Course Info */}
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-navy-dark text-sm leading-snug line-clamp-2">{data.course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress Belajar</span>
              <span className="font-semibold text-navy">{progressPct}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-navy to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{completedCount}/{totalContents} selesai</p>
          </div>
        </div>

        {/* Content Nav */}
        <nav className="py-2">
          {data.sections.map(section => (
            <div key={section.id} className="mb-2">
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</p>
              </div>
              {section.contents.map(content => {
                const sub    = submissions.get(content.id);
                const isDone = sub?.score !== null && sub?.score !== undefined;
                const isPending = sub && !isDone; // submitted but not graded
                const isActive  = activeContent?.id === content.id;
                const meta      = CONTENT_META[content.content_type] ?? { icon: '📌', badge: 'bg-slate-100 text-slate-500' };
                return (
                  <button key={content.id}
                    onClick={() => setActive(content)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 text-sm transition-colors border-l-2
                      ${isActive
                        ? 'bg-navy text-white border-l-navy'
                        : 'hover:bg-white border-l-transparent text-navy-dark hover:border-l-navy/30'}`}>
                    <span className="text-base mt-0.5 flex-shrink-0">
                      {isDone ? '✅' : isPending ? '⏳' : meta.icon}
                    </span>
                    <span className={`leading-snug flex-1 text-xs ${isActive ? 'font-semibold text-white' : ''}`}>
                      {content.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-8 max-w-4xl">
        {activeContent ? (
          <ContentViewer
            key={activeContent.id}
            content={activeContent}
            enrollmentId={data.enrollment.id}
            submission={submissions.get(activeContent.id) ?? null}
            onSubmitDone={(contentId, sub) => {
              setSubmissions(prev => {
                const next = new Map(prev);
                next.set(contentId, sub);
                return next;
              });
              const allContents = data.sections.flatMap(s => s.contents);
              const idx = allContents.findIndex(c => c.id === contentId);
              if (idx >= 0 && idx < allContents.length - 1) {
                setTimeout(() => setActive(allContents[idx + 1]), 800);
              }
            }}
          />
        ) : (
          <div className="text-center py-24 text-slate-400">
            <div className="text-6xl mb-4">👈</div>
            <p className="font-medium">Pilih materi dari daftar di sebelah kiri</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Content Viewer ───────────────────────────────────────────────────────────
function ContentViewer({ content, enrollmentId, submission, onSubmitDone }: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onSubmitDone: (contentId: number, sub: Submission) => void;
}) {
  const type = content.content_type;
  const meta = CONTENT_META[type] ?? CONTENT_META.pdf_module;

  return (
    <div className="animate-fadeup flex flex-col gap-6">
      {/* Header */}
      <div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${meta.badge}`}>
          {meta.icon} {meta.label}
        </span>
        <h1 className="text-2xl font-extrabold text-navy-dark mt-3 leading-snug">{content.title}</h1>
      </div>

      {/* Graded Banner */}
      {submission?.score !== null && submission?.score !== undefined && (
        <GradedBanner submission={submission} content={content} />
      )}
      {submission && submission.score === null && submission.status === 'submitted' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl">⏳</div>
          <div>
            <p className="font-bold text-amber-700">Menunggu Penilaian</p>
            <p className="text-sm text-amber-600 mt-0.5">Jawaban sudah dikumpulkan. Assessor akan segera memberikan nilai.</p>
          </div>
        </div>
      )}

      {/* Content by type */}
      {type === 'pdf_module'        && <PDFModule content={content} />}
      {type === 'video_embed'       && <VideoEmbed content={content} />}
      {type === 'mcq_quiz'          && (
        <MCQQuiz content={content} enrollmentId={enrollmentId}
          submission={submission}
          onDone={sub => onSubmitDone(content.id, sub)} />
      )}
      {type === 'essay_task'        && (
        <EssayTask content={content} enrollmentId={enrollmentId}
          submission={submission}
          onDone={sub => onSubmitDone(content.id, sub)} />
      )}
      {type === 'oral_video_task'   && (
        <OralVideoTask content={content} enrollmentId={enrollmentId}
          submission={submission}
          onDone={sub => onSubmitDone(content.id, sub)} />
      )}
      {type === 'critical_thinking' && (
        <CriticalThinkingTask content={content} enrollmentId={enrollmentId}
          submission={submission}
          onDone={sub => onSubmitDone(content.id, sub)} />
      )}
    </div>
  );
}

// ─── Graded Banner ────────────────────────────────────────────────────────────
function GradedBanner({ submission, content }: { submission: Submission; content: Content }) {
  const score    = submission.score ?? 0;
  const maxScore = content.max_score || 100;
  const pct      = Math.round((score / maxScore) * 100);
  const passed   = score >= 70;

  return (
    <div className={`rounded-2xl border px-5 py-4 ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{passed ? '🎉' : '📚'}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-bold ${passed ? 'text-emerald-700' : 'text-orange-700'}`}>
              {passed ? 'Lulus!' : 'Belum Lulus'}
            </p>
            <span className={`text-2xl font-extrabold ${passed ? 'text-emerald-600' : 'text-orange-600'}`}>
              {score}/{maxScore}
            </span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden mt-2">
            <div className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-orange-400'}`}
              style={{ width: `${pct}%` }} />
          </div>
          {submission.correct_count != null && submission.total_questions != null && (
            <p className="text-xs mt-1.5 text-slate-500">{submission.correct_count} dari {submission.total_questions} soal benar</p>
          )}
          {submission.assessor_feedback && (
            <p className="text-sm mt-2 text-slate-600 italic">💬 &ldquo;{submission.assessor_feedback}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 1. PDF Module ────────────────────────────────────────────────────────────
function PDFModule({ content }: { content: Content }) {
  const pdfUrl = content.file_path
    ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${content.file_path}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Instructions */}
      {content.instruction_text && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
        </div>
      )}

      {pdfUrl ? (
        <div className="flex flex-col gap-3">
          {/* Inline PDF Viewer */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '70vh' }}>
            <iframe src={`${pdfUrl}#toolbar=1&navpanes=1`} className="w-full h-full" title={content.title} />
          </div>
          <a href={pdfUrl} target="_blank" rel="noreferrer"
            className="btn btn-primary self-start">
            📂 Unduh / Buka PDF di Tab Baru
          </a>
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-4xl">📄</div>
          <div>
            <p className="font-bold text-navy-dark text-lg">{content.title}</p>
            <p className="text-slate-400 text-sm mt-1">File PDF belum diupload oleh admin.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2. Video Embed ───────────────────────────────────────────────────────────
function VideoEmbed({ content }: { content: Content }) {
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    return url;
  };

  return (
    <div className="flex flex-col gap-4">
      {content.instruction_text && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <p className="text-sm text-purple-800 leading-relaxed">{content.instruction_text}</p>
        </div>
      )}
      <div className="card p-0 overflow-hidden">
        {content.embed_url ? (
          <div className="aspect-video">
            <iframe src={getEmbedUrl(content.embed_url)} className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <div className="text-5xl mb-3">🎬</div>
            <p>Link video belum tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. MCQ Quiz ─────────────────────────────────────────────────────────────
function MCQQuiz({ content, enrollmentId, submission, onDone }: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
}) {
  const questions    = content.quiz_questions ?? [];
  const [answers, setAnswers]       = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ score: number; correct: number; total: number } | null>(null);
  const [showRetry, setShowRetry]   = useState(false);

  const alreadyPassed = submission?.score != null && submission.score >= 70;
  const alreadyFailed = submission?.score != null && submission.score < 70;

  if (alreadyPassed && !result) {
    return (
      <div className="card text-center py-14 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl">✅</div>
        <h3 className="font-extrabold text-navy-dark text-xl">Kamu Sudah Lulus!</h3>
        <p className="text-slate-500 text-sm">
          Nilai: <strong>{submission!.score}</strong> • {submission!.correct_count}/{submission!.total_questions} benar
        </p>
      </div>
    );
  }

  if (result) {
    const passed = result.score >= 70;
    return (
      <div className={`rounded-2xl border-2 p-8 text-center flex flex-col items-center gap-4 ${passed ? 'bg-emerald-50 border-emerald-300' : 'bg-orange-50 border-orange-300'}`}>
        <div className="text-6xl">{passed ? '🎉' : '📚'}</div>
        <div>
          <p className="text-4xl font-extrabold text-navy-dark">{result.score}</p>
          <p className="text-slate-500 text-sm mt-1">dari 100 • {result.correct} dari {result.total} soal benar</p>
        </div>
        {passed
          ? <p className="text-emerald-700 font-semibold">Selamat! Kamu telah lulus ujian ini.</p>
          : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-orange-700 font-semibold">Belum lulus. Pelajari ulang materi dan coba lagi.</p>
              <button onClick={() => { setResult(null); setAnswers({}); }} className="btn btn-secondary">
                🔄 Coba Lagi
              </button>
            </div>
          )
        }
      </div>
    );
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Jawab semua soal terlebih dahulu.'); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        quiz_answers: Object.entries(answers).map(([qId, optId]) => ({
          question_id: Number(qId),
          option_id: optId,
        })),
      });
      const sub = res.data.data;
      const newSub: Submission = {
        content_id: content.id,
        score: sub.score,
        correct_count: sub.correct_count,
        total_questions: sub.total_questions,
        assessor_feedback: null,
        graded_at: sub.graded_at ?? null,
        status: 'graded',
      };
      setResult({ score: sub.score, correct: sub.correct_count ?? 0, total: questions.length });
      onDone(newSub);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes('sudah lulus')) {
        alert('Kamu sudah lulus kuis ini!');
      } else {
        alert(msg ?? 'Gagal mengumpulkan jawaban.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Instructions */}
      {content.instruction_text && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm text-amber-800 leading-relaxed">{content.instruction_text}</p>
        </div>
      )}

      {alreadyFailed && !showRetry && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-orange-700">Nilai sebelumnya: {submission!.score}/100</p>
            <p className="text-sm text-orange-600 mt-0.5">Kamu bisa mengulang kuis ini untuk meningkatkan nilai.</p>
          </div>
          <button onClick={() => setShowRetry(true)} className="btn btn-secondary text-sm">
            🔄 Coba Lagi
          </button>
        </div>
      )}

      {(!alreadyFailed || showRetry) && (
        <>
          {/* Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-navy-dark">📝 {questions.length} Soal Pilihan Ganda</span>
              <span className="text-sm text-slate-500">{answeredCount}/{questions.length} dijawab</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-navy rounded-full transition-all duration-300"
                style={{ width: `${questions.length > 0 ? (answeredCount/questions.length)*100 : 0}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Nilai minimum lulus: <strong>70/100</strong></p>
          </div>

          {/* Questions */}
          {questions.map((q, qi) => (
            <div key={q.id} className="card flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 flex-shrink-0 bg-navy text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {qi + 1}
                </span>
                <p className="font-semibold text-navy-dark text-sm leading-relaxed">{q.question_text}</p>
              </div>
              <div className="flex flex-col gap-2 ml-10">
                {q.options.map(opt => (
                  <label key={opt.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all text-sm
                      ${answers[q.id] === opt.id
                        ? 'border-navy bg-navy text-white'
                        : 'border-slate-200 hover:border-navy/40 hover:bg-slate-50 text-navy-dark'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${answers[q.id] === opt.id ? 'border-white' : 'border-slate-300'}`}>
                      {answers[q.id] === opt.id && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <input type="radio" name={`q-${q.id}`} value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                      className="sr-only" />
                    {opt.option_text}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length || questions.length === 0}
            className="btn btn-primary btn-lg w-full">
            {submitting
              ? <><svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Mengumpulkan...</>
              : '📤 Kumpulkan Jawaban'}
          </button>
        </>
      )}
    </div>
  );
}

// ─── 4. Case-Study Essay Task ─────────────────────────────────────────────────
function EssayTask({ content, enrollmentId, submission, onDone }: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
}) {
  const [essay, setEssay]             = useState('');
  const [fileShareUrl, setFileUrl]    = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const alreadySubmitted = submission !== null;

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
          <p className="font-bold text-teal-700 mb-1">✅ Tugas Sudah Dikumpulkan</p>
          {submission.essay_text && (
            <div className="mt-3">
              <p className="text-xs text-teal-600 font-semibold mb-1">Esai kamu:</p>
              <div className="bg-white rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                {submission.essay_text}
              </div>
            </div>
          )}
          {submission.file_share_url && (
            <div className="mt-3">
              <p className="text-xs text-teal-600 font-semibold mb-1">File yang dilampirkan:</p>
              <a href={submission.file_share_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-navy font-medium hover:underline">
                📎 Buka File →
              </a>
            </div>
          )}
          {submission.score === null && (
            <p className="text-sm text-teal-600 mt-3 flex items-center gap-2">
              <span className="animate-pulse">⏳</span> Menunggu penilaian assessor...
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essay.trim() && !fileShareUrl.trim()) {
      alert('Isi jawaban esai atau lampirkan link file terlebih dahulu.'); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        essay_text: essay || null,
        file_share_url: fileShareUrl || null,
      });
      onDone({
        content_id: content.id,
        score: null,
        assessor_feedback: null,
        graded_at: null,
        status: 'submitted',
        essay_text: essay,
        file_share_url: fileShareUrl || null,
      });
      return res;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengumpulkan tugas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Instructions */}
      {content.instruction_text && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-teal-700 mb-2">📋 Petunjuk Pengerjaan</p>
          <p className="text-sm text-teal-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
        </div>
      )}

      {/* File Share URL */}
      <div className="card flex flex-col gap-3">
        <label className="text-sm font-bold text-navy-dark">
          📎 Lampiran File <span className="text-slate-400 font-normal">(Google Drive / OneDrive / Dropbox)</span>
        </label>
        <input type="url" value={fileShareUrl} onChange={e => setFileUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="form-input" />
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-600 mb-1">📌 Cara share file:</p>
          <p><strong>Google Drive:</strong> Klik kanan file → Share → Change to Anyone with link → Copy link</p>
          <p className="mt-1"><strong>OneDrive:</strong> Klik ... → Share → Anyone with link → Copy</p>
        </div>
      </div>

      {/* Essay Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">
          ✍️ Jawaban Esai <span className="text-slate-400 font-normal">(atau tambahan penjelasan)</span>
        </label>
        <textarea rows={10} value={essay} onChange={e => setEssay(e.target.value)}
          placeholder="Tulis esai atau jawaban case study kamu di sini..."
          className="form-input resize-none leading-relaxed" />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{essay.length} karakter</span>
          <span>{essay.split(/\s+/).filter(Boolean).length} kata</span>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
        {submitting ? 'Mengumpulkan...' : '📤 Kumpulkan Tugas'}
      </button>
    </form>
  );
}

// ─── 5. Oral Video Exam Task ─────────────────────────────────────────────────
function OralVideoTask({ content, enrollmentId, submission, onDone }: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
}) {
  const [videoUrl, setVideoUrl]   = useState('');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const alreadySubmitted = submission !== null;

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <p className="font-bold text-rose-700 mb-2">🎥 Video Sudah Dikumpulkan</p>
          {submission.video_url && (
            <div className="mt-2">
              <a href={submission.video_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-navy font-medium hover:underline bg-white rounded-xl px-4 py-2 border border-rose-200">
                ▶️ Tonton Video Submission →
              </a>
            </div>
          )}
          {submission.essay_text && (
            <p className="text-sm text-rose-700 mt-3 italic">&ldquo;{submission.essay_text}&rdquo;</p>
          )}
          {submission.score === null && (
            <p className="text-sm text-rose-600 mt-3 flex items-center gap-2">
              <span className="animate-pulse">⏳</span> Menunggu penilaian assessor...
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) { alert('Link video wajib diisi.'); return; }
    setSubmitting(true);
    try {
      await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        video_url: videoUrl,
        essay_text: notes || null,
      });
      onDone({
        content_id: content.id,
        score: null,
        assessor_feedback: null,
        graded_at: null,
        status: 'submitted',
        video_url: videoUrl,
        essay_text: notes || null,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengumpulkan tugas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Instructions */}
      {content.instruction_text && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-rose-700 mb-2">🎬 Petunjuk Oral Video Exam</p>
          <p className="text-sm text-rose-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
        </div>
      )}

      {/* Upload Guide */}
      <div className="card flex flex-col gap-4">
        <p className="font-bold text-navy-dark text-sm">📤 Cara Upload & Submit Video</p>
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <span className="text-xl">1️⃣</span>
            <div>
              <p className="font-semibold text-slate-700">Record video presentasi kamu</p>
              <p className="text-xs text-slate-500 mt-0.5">Durasi: 5–10 menit, gunakan slide pendukung</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <span className="text-xl">2️⃣</span>
            <div>
              <p className="font-semibold text-slate-700">Upload ke YouTube (unlisted) atau Google Drive</p>
              <p className="text-xs text-slate-500 mt-0.5">Pastikan link bisa diakses (not private)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <span className="text-xl">3️⃣</span>
            <div>
              <p className="font-semibold text-slate-700">Copy link & paste di bawah ini</p>
              <p className="text-xs text-slate-500 mt-0.5">Klik Submit — assessor akan menilai video kamu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Link Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">🔗 Link Video <span className="text-rose-500">*</span></label>
        <input type="url" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://youtu.be/... atau https://drive.google.com/..."
          className="form-input" />
        <p className="text-xs text-slate-400">YouTube (unlisted) / Google Drive / Loom / Vimeo</p>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">
          📝 Catatan untuk Assessor <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Tambahkan catatan atau konteks tambahan untuk assessor..."
          className="form-input resize-none" />
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
        {submitting ? 'Mengumpulkan...' : '🎬 Submit Video Oral Exam'}
      </button>
    </form>
  );
}

// ─── 6. Critical Thinking Task ────────────────────────────────────────────────
function CriticalThinkingTask({ content, enrollmentId, submission, onDone }: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
}) {
  const [essay, setEssay]           = useState('');
  const [fileShareUrl, setFileUrl]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const alreadySubmitted = submission !== null;

  if (alreadySubmitted) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col gap-3">
        <p className="font-bold text-indigo-700">💡 Critical Thinking Sudah Dikumpulkan</p>
        {submission.essay_text && (
          <div className="bg-white rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
            {submission.essay_text}
          </div>
        )}
        {submission.score === null && (
          <p className="text-sm text-indigo-600 flex items-center gap-2">
            <span className="animate-pulse">⏳</span> Menunggu penilaian assessor...
          </p>
        )}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essay.trim() && !fileShareUrl.trim()) {
      alert('Tulis analisis kamu atau lampirkan link file.'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        essay_text: essay || null,
        file_share_url: fileShareUrl || null,
      });
      onDone({
        content_id: content.id,
        score: null,
        assessor_feedback: null,
        graded_at: null,
        status: 'submitted',
        essay_text: essay,
        file_share_url: fileShareUrl || null,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengumpulkan jawaban.');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = essay.split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {content.instruction_text && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-indigo-700 mb-2">💡 Panduan Critical Thinking</p>
          <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">
          📎 Lampiran File <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <input type="url" value={fileShareUrl} onChange={e => setFileUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="form-input" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">✍️ Analisis Kritis Kamu</label>
        <textarea rows={12} value={essay} onChange={e => setEssay(e.target.value)}
          placeholder="Tulis analisis kritis kamu di sini..."
          className="form-input resize-none leading-relaxed" />
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{essay.length} karakter</span>
          <span className={`font-medium ${wordCount >= 300 ? 'text-emerald-600' : 'text-orange-500'}`}>
            {wordCount}/300 kata minimum {wordCount >= 300 ? '✓' : ''}
          </span>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
        {submitting ? 'Mengumpulkan...' : '💡 Kumpulkan Critical Thinking'}
      </button>
    </form>
  );
}
