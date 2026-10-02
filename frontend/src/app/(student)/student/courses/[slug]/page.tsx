'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import MarkdownViewer from '@/components/MarkdownViewer';

const AestheticPdfReader = dynamic(() => import('@/components/AestheticPdfReader'), {
  ssr: false,
  loading: () => (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-12 flex flex-col items-center justify-center gap-3 text-sky-400">
      <div className="w-10 h-10 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
      <p className="text-xs font-semibold">Menyiapkan Reader Dokumen Digital...</p>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizOption  { id: number; option_text: string }
interface QuizQuestion { id: number; question_text: string; weight_score: number; options: QuizOption[] }
interface Content {
  id: number;
  content_type: 'pdf_module' | 'video_embed' | 'mcq_quiz' | 'essay_task' | 'oral_video_task' | 'critical_thinking' | 'field_study';
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
  pdf_module:       { icon: '📄', label: 'Learning Module',            color: 'blue',   badge: 'bg-blue-100 text-blue-700' },
  video_embed:      { icon: '🎬', label: 'Video Lecture',              color: 'purple', badge: 'bg-purple-100 text-purple-700' },
  mcq_quiz:         { icon: '📝', label: 'Multiple-Choice Examination', color: 'amber',  badge: 'bg-amber-100 text-amber-700' },
  essay_task:       { icon: '✍️', label: 'Case-Study Essay Submission', color: 'teal',   badge: 'bg-teal-100 text-teal-700' },
  oral_video_task:  { icon: '🎥', label: 'Oral Video Exam',            color: 'rose',   badge: 'bg-rose-100 text-rose-700' },
  critical_thinking:{ icon: '💡', label: 'Critical Thinking Exam',     color: 'indigo', badge: 'bg-indigo-100 text-indigo-700' },
  field_study:      { icon: '🌊', label: 'Training Course (Field Study)', color: 'emerald', badge: 'bg-emerald-100 text-emerald-700' },
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
      const map = new Map<number, Submission>();
      for (const s of subRes.data.data ?? []) {
        map.set(s.content_id, s);
      }
      setSubmissions(map);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    // Step 1: get all enrollments to find the one matching this course slug
    api.get('/enrollments').then(async (er) => {
      const enrollments = er.data.data ?? [];

      // Step 2: load the course to find its ID
      const courseRes = await api.get(`/courses/${params.slug}`);
      const course = courseRes.data.data;

      const enrollment = enrollments.find(
        (e: { course_id: number; status: string }) => e.course_id === course.id
      );

      if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
        throw new Error('Kamu belum terdaftar atau belum membayar kursus ini.');
      }

      // Step 3: load full content using enrollment ID
      const contentRes = await api.get(`/enrollments/${enrollment.id}/contents`);
      const pageData: PageData = contentRes.data.data;
      setData(pageData);

      const firstContent = pageData.sections?.[0]?.contents?.[0];
      if (firstContent) setActive(firstContent);

      await refreshSubmissions();
    }).catch((err) => {
      setError(err?.message ?? 'Gagal memuat konten kursus.');
    }).finally(() => setLoading(false));
  }, [params.slug, refreshSubmissions]);


  const totalContents  = data?.sections.reduce((acc, s) => acc + s.contents.filter(c => c.content_type !== 'field_study').length, 0) ?? 0;
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

  const enrollment = data.enrollment;
  const isFieldTrip = enrollment.attended_field_trip;

  return (
    <div className="animate-fadeup flex gap-0 min-h-[80vh]">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 self-start border-r border-slate-200 bg-slate-50 rounded-l-2xl overflow-y-auto max-h-[calc(100vh-48px)] sticky top-6">
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
                const isSelected = activeContent?.id === content.id;

                // Critical Thinking: lock if user attended field trip
                const isLocked = content.content_type === 'critical_thinking' && isFieldTrip;
                const meta = CONTENT_META[content.content_type] ?? CONTENT_META.pdf_module;

                return (
                  <button key={content.id}
                    onClick={() => setActive(content)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 text-sm border-b border-slate-100 transition-all
                      ${isSelected ? 'bg-navy text-white' : isLocked ? 'opacity-50 cursor-default hover:bg-slate-50' : 'hover:bg-slate-50 text-navy-dark'}`}>
                    <span className="flex-shrink-0 mt-0.5">{isLocked ? '🔒' : meta.icon}</span>
                    <span className={`flex-1 text-xs leading-snug ${isSelected ? 'font-semibold text-white' : 'text-navy-dark'}`}>
                      {content.title}
                      {isLocked && <span className="block text-[10px] text-slate-400 mt-0.5">Kamu mengikuti Field Study</span>}
                    </span>
                    <span className="flex-shrink-0 mt-0.5">
                      {isDone ? '✅' : isPending ? '⏳' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        {activeContent ? (
          <ContentViewer
            content={activeContent}
            enrollment={enrollment}
            enrollmentId={enrollment.id}
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
            onEnrollmentUpdate={(updatedEnroll) => {
              setData(prev => prev ? { ...prev, enrollment: updatedEnroll } : prev);
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
function ContentViewer({ content, enrollment, enrollmentId, submission, onSubmitDone, onEnrollmentUpdate }: {
  content: Content;
  enrollment: EnrollInfo;
  enrollmentId: number;
  submission: Submission | null;
  onSubmitDone: (contentId: number, sub: Submission) => void;
  onEnrollmentUpdate: (e: EnrollInfo) => void;
}) {
  const type = content.content_type;
  const meta = CONTENT_META[type] ?? CONTENT_META.pdf_module;

  // Critical Thinking locked if user attended field trip
  const isLocked = type === 'critical_thinking' && enrollment.attended_field_trip;

  return (
    <div className="animate-fadeup flex flex-col gap-6">
      {/* Header */}
      <div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${meta.badge}`}>
          {isLocked ? '🔒' : meta.icon} {isLocked ? 'Terkunci' : meta.label}
        </span>
        <h1 className="text-2xl font-extrabold text-navy-dark mt-3 leading-snug">{content.title}</h1>
      </div>

      {/* Locked State for Critical Thinking */}
      {isLocked && (
        <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          <div className="text-7xl">🔒</div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-600">Modul Terkunci</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md">
              Kamu telah terdaftar sebagai peserta <strong>Field Study</strong>. Modul Critical Thinking ini tidak perlu dikerjakan — kamu mendapat substitusi nilai dari aktivitas lapangan.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-emerald-700 text-sm font-medium flex items-center gap-2">
            ✅ Status Field Study kamu sudah terkonfirmasi oleh admin
          </div>
        </div>
      )}

      {/* Graded Banner */}
      {!isLocked && submission?.score !== null && submission?.score !== undefined && (
        <GradedBanner submission={submission} content={content} />
      )}
      {!isLocked && submission && submission.score === null && submission.status === 'submitted' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl">⏳</div>
          <div>
            <p className="font-bold text-amber-700">Menunggu Penilaian</p>
            <p className="text-sm text-amber-600 mt-0.5">Jawaban sudah dikumpulkan. Assessor akan segera memberikan nilai.</p>
          </div>
        </div>
      )}

      {/* Content by type */}
      {!isLocked && (
        <>
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
            <EssayTask content={content} enrollmentId={enrollmentId}
              submission={submission}
              onDone={sub => onSubmitDone(content.id, sub)} />
          )}
          {type === 'field_study' && (
            <FieldStudyTask
              content={content}
              enrollment={enrollment}
              enrollmentId={enrollmentId}
              submission={submission}
              onDone={sub => onSubmitDone(content.id, sub)}
              onEnrollmentUpdate={onEnrollmentUpdate}
            />
          )}
        </>
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
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${content.file_path}`
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
          <AestheticPdfReader
            url={pdfUrl}
            title={content.title}
            allowDownload={false}
            watermarkText="DigiBlueCamp Digital Learning • Hak Cipta Dilindungi"
            height="78vh"
          />
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
          <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
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

// ─── 4. Case-Study Essay Task (shared with Critical Thinking) ─────────────────
function EssayTask({ content, enrollmentId, submission, onDone }: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
}) {
  const [essay, setEssay]             = useState('');
  const [fileShareUrl, setFileUrl]    = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const alreadySubmitted = submission !== null;

  const isCriticalThinking = content.content_type === 'critical_thinking';
  const colorClass = isCriticalThinking ? 'indigo' : 'teal';
  const bgClass    = isCriticalThinking ? 'bg-indigo-50 border-indigo-200' : 'bg-teal-50 border-teal-200';
  const textClass  = isCriticalThinking ? 'text-indigo-700' : 'text-teal-700';

  // Show soal PDF if admin uploaded one
  const soalPdfUrl = content.file_path
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${content.file_path}`
    : null;

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`${bgClass} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">✅</span>
            <p className={`font-extrabold ${textClass} text-base`}>Tugas Studi Kasus Sudah Dikumpulkan</p>
          </div>
          {submission.essay_text && (
            <div className="mt-4">
              <p className={`text-xs ${isCriticalThinking ? 'text-indigo-600' : 'text-teal-600'} font-semibold mb-1.5`}>Naskah jawaban kamu:</p>
              <div className="bg-white rounded-2xl p-5 text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto border border-slate-200 whitespace-pre-wrap font-sans">
                {submission.essay_text}
              </div>
            </div>
          )}
          {submission.file_share_url && (
            <div className="mt-4">
              <p className={`text-xs ${isCriticalThinking ? 'text-indigo-600' : 'text-teal-600'} font-semibold mb-1`}>Berkas dokumen terlampir:</p>
              <a href={submission.file_share_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm text-navy font-semibold hover:border-navy transition-all">
                📎 Buka Berkas Tugas →
              </a>
            </div>
          )}
          {submission.score === null && (
            <p className={`text-sm ${isCriticalThinking ? 'text-indigo-700' : 'text-teal-700'} mt-4 flex items-center gap-2 font-medium bg-white/70 p-3 rounded-xl border border-slate-100`}>
              <span className="animate-pulse">⏳</span> Menunggu proses penilaian & feedback dari Tim Asesor DigiBlueCamp...
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essay.trim() && !fileShareUrl.trim() && !selectedFile) {
      alert('Mohon unggah file jawaban (PDF/DOCX), cantumkan link dokumen, atau ketikkan esai jawaban Anda.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('enrollment_id', String(enrollmentId));
      formData.append('content_id', String(content.id));
      if (selectedFile) formData.append('file', selectedFile);
      if (fileShareUrl.trim()) formData.append('file_share_url', fileShareUrl.trim());
      if (essay.trim()) formData.append('essay_text', essay.trim());

      const res = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const savedSub = res.data.data;
      onDone({
        content_id: content.id,
        score: null,
        assessor_feedback: null,
        graded_at: null,
        status: 'submitted',
        essay_text: essay || null,
        file_share_url: savedSub.file_share_url || fileShareUrl || null,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengumpulkan tugas studi kasus.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Instructions / Case Study Markdown Prompt */}
      {content.instruction_text && (
        <div className={`${bgClass} border rounded-3xl p-6 sm:p-8 shadow-sm`}>
          <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-navy/10">
            <span className="text-2xl">{isCriticalThinking ? '💡' : '📋'}</span>
            <h3 className={`text-lg font-extrabold ${textClass}`}>
              Naskah Soal & Panduan Studi Kasus
            </h3>
          </div>
          <MarkdownViewer content={content.instruction_text} />
        </div>
      )}

      {/* Soal & Template PDF from Admin if available (Bahan Belajar: Bisa Dibaca & Diunduh) */}
      {soalPdfUrl && (
        <div className="flex flex-col gap-3">
          <AestheticPdfReader
            url={soalPdfUrl}
            title={`Bahan Belajar & Template Soal: ${content.title}`}
            allowDownload={true}
            downloadFilename={`template-${content.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`}
            height="58vh"
          />
        </div>
      )}

      {/* Form Pengumpulan Jawaban */}
      <div className="card flex flex-col gap-5 border border-slate-200 shadow-sm">
        <div>
          <h4 className="font-bold text-navy-dark text-base">📤 Formulir Pengumpulan Jawaban</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Anda dapat mengunggah berkas dokumen (PDF/DOCX), melampirkan tautan drive, dan/atau menulis esai langsung.
          </p>
        </div>

        {/* Opsi 1: Upload File Langsung */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
            <span>📄</span> Opsi 1: Upload Berkas Jawaban (PDF / DOCX)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 cursor-pointer border border-slate-200 rounded-xl p-2 bg-white"
          />
          {selectedFile && (
            <p className="text-xs text-emerald-600 font-semibold">
              ✅ Berkas dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Opsi 2: Link File Share */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
            <span>📎</span> Opsi 2: Tautan Berkas Cloud (Google Drive / OneDrive)
          </label>
          <input
            type="url"
            value={fileShareUrl}
            onChange={e => setFileUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="form-input text-xs"
          />
          <p className="text-[11px] text-slate-400">
            * Pastikan izin akses link Google Drive / OneDrive sudah diatur ke <em>&quot;Anyone with the link can view&quot;</em>.
          </p>
        </div>

        {/* Opsi 3: Tulis Esai Langsung */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
              <span>✍️</span> Opsi 3: Ketik Jawaban Esai Langsung (Mendukung Format Teks / Markdown)
            </label>
            <div className="flex gap-2 text-[11px] text-slate-400 font-mono">
              <span>{essay.length} karakter</span>
              <span>•</span>
              <span className="font-semibold text-navy">{essay.split(/\s+/).filter(Boolean).length} kata</span>
            </div>
          </div>
          <textarea
            rows={10}
            value={essay}
            onChange={e => setEssay(e.target.value)}
            placeholder="Tuliskan naskah jawaban studi kasus Anda secara terstruktur di sini..."
            className="form-input text-xs leading-relaxed resize-y font-sans"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 mt-2">
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Mengunggah & Mengumpulkan Jawaban...
            </>
          ) : (
            '📤 Kumpulkan Jawaban Studi Kasus'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── 5. Field Study Task ──────────────────────────────────────────────────────
function FieldStudyTask({ content, enrollment, enrollmentId, submission, onDone, onEnrollmentUpdate }: {
  content: Content;
  enrollment: EnrollInfo;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
  onEnrollmentUpdate: (e: EnrollInfo) => void;
}) {
  const [saving, setSaving] = useState(false);
  const isConfirmed = enrollment.attended_field_trip;
  const hasSubmission = submission !== null;

  const handleConfirm = async (attending: boolean) => {
    setSaving(true);
    try {
      // Record confirmation via submission
      await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        essay_text: attending ? 'attending' : 'not_attending',
      });
      onDone({
        content_id: content.id,
        score: 100,
        assessor_feedback: null,
        graded_at: new Date().toISOString(),
        status: 'graded',
        essay_text: attending ? 'attending' : 'not_attending',
      });

      // Also update enrollment attended_field_trip
      try {
        const res = await api.patch(`/enrollments/${enrollmentId}/confirm-field-study`, {
          attending,
        });
        onEnrollmentUpdate({ ...enrollment, attended_field_trip: res.data.attended_field_trip });
      } catch { /* silent — admin can update later */ }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (!msg?.includes('sudah pernah')) {
        alert(msg ?? 'Gagal menyimpan konfirmasi.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Already confirmed by admin
  if (isConfirmed) {
    return (
      <div className="flex flex-col gap-5">
        {content.instruction_text && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
          </div>
        )}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-5xl">🌊</div>
          <div>
            <h3 className="text-xl font-extrabold text-emerald-700">Kehadiran Terkonfirmasi!</h3>
            <p className="text-emerald-600 text-sm mt-1">Kehadiran Field Study kamu sudah dikonfirmasi oleh admin.</p>
          </div>
          <div className="bg-emerald-100 rounded-xl px-5 py-3 text-emerald-700 text-sm">
            ✅ Modul <strong>Case-Study Essay Examination — Critical Thinking</strong> telah terkunci secara otomatis
          </div>
        </div>
      </div>
    );
  }

  // Already submitted but not yet admin-confirmed
  if (hasSubmission) {
    const attending = submission.essay_text === 'attending';
    return (
      <div className="flex flex-col gap-5">
        {content.instruction_text && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
          </div>
        )}
        <div className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-4 text-center ${attending ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-5xl">{attending ? '🙋' : '📝'}</div>
          <div>
            <h3 className={`text-lg font-extrabold ${attending ? 'text-emerald-700' : 'text-slate-600'}`}>
              {attending ? 'Kamu memilih: Mengikuti Field Study' : 'Kamu memilih: Tidak Mengikuti Field Study'}
            </h3>
            <p className={`text-sm mt-1 ${attending ? 'text-emerald-600' : 'text-slate-500'}`}>
              {attending
                ? 'Menunggu konfirmasi kehadiran dari admin.'
                : 'Kamu perlu mengerjakan modul Critical Thinking sebagai pengganti Field Study.'}
            </p>
          </div>
          {attending && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm flex items-center gap-2">
              <span className="animate-pulse">⏳</span> Admin akan memverifikasi kehadiran kamu
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: show confirmation form
  return (
    <div className="flex flex-col gap-5">
      {/* Instructions */}
      {content.instruction_text && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
        </div>
      )}

      {/* Confirmation Card */}
      <div className="card flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🌊</div>
          <h3 className="text-xl font-extrabold text-navy-dark">Apakah kamu mengikuti Field Study?</h3>
          <p className="text-slate-500 text-sm mt-2">
            Konfirmasi kehadiranmu. Pilihanmu akan menentukan modul apa yang perlu dikerjakan selanjutnya.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Yes */}
          <button
            type="button"
            onClick={() => handleConfirm(true)}
            disabled={saving}
            className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-3xl transition-colors">
              🙋
            </div>
            <div>
              <p className="font-bold text-emerald-700">Ya, Saya Mengikuti</p>
              <p className="text-xs text-slate-500 mt-1">Modul Critical Thinking akan terkunci</p>
            </div>
          </button>

          {/* No */}
          <button
            type="button"
            onClick={() => handleConfirm(false)}
            disabled={saving}
            className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-3xl transition-colors">
              📝
            </div>
            <div>
              <p className="font-bold text-slate-700">Tidak, Saya Tidak Ikut</p>
              <p className="text-xs text-slate-500 mt-1">Kamu perlu mengerjakan modul Critical Thinking</p>
            </div>
          </button>
        </div>

        {saving && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Menyimpan konfirmasi...
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
          <p className="font-semibold mb-1">⚠️ Perhatian:</p>
          <p>Pilihanmu dapat berubah jika admin mengkonfirmasi kehadiran secara langsung. Hubungi panitia jika ada perubahan status.</p>
        </div>
      </div>
    </div>
  );
}

// ─── 6. Oral Video Exam Task ─────────────────────────────────────────────────
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
      {content.instruction_text && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-rose-700 mb-2">🎬 Petunjuk Oral Video Exam</p>
          <p className="text-sm text-rose-800 leading-relaxed whitespace-pre-line">{content.instruction_text}</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">🔗 Link Video <span className="text-rose-500">*</span></label>
        <input type="url" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://youtu.be/... atau https://drive.google.com/..."
          className="form-input" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">
          📝 Catatan untuk Assessor <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Tambahkan catatan tambahan untuk assessor..."
          className="form-input resize-none" />
      </div>
      <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
        {submitting ? 'Mengumpulkan...' : '🎬 Submit Video Oral Exam'}
      </button>
    </form>
  );
}
