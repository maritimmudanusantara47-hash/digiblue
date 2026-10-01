'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizOption  { id: number; option_text: string }
interface QuizQuestion { id: number; question_text: string; weight_score: number; options: QuizOption[] }
interface Content {
  id: number;
  content_type: string;
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
interface Submission { content_id: number; score: number | null; assessor_feedback: string | null; graded_at: string | null }

const CONTENT_ICONS: Record<string, string> = {
  pdf_module:       '📄',
  video_embed:      '🎬',
  mcq_quiz:         '📋',
  essay_task:       '✍️',
  oral_video_task:  '🎥',
  critical_thinking:'💡',
};

const CONTENT_LABELS: Record<string, string> = {
  pdf_module:       'Modul PDF',
  video_embed:      'Video',
  mcq_quiz:         'Kuis Pilihan Ganda',
  essay_task:       'Tugas Esai',
  oral_video_task:  'Video Oral Exam',
  critical_thinking:'Critical Thinking',
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

  useEffect(() => {
    // Cari enrollment berdasarkan slug kursus
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

      // Ambil konten kursus
      const [contentRes] = await Promise.all([
        api.get(`/enrollments/${found.id}/contents`),
      ]);

      const pageData: PageData = contentRes.data.data;
      setData(pageData);

      // Set active ke konten pertama
      const firstContent = pageData.sections?.[0]?.contents?.[0];
      if (firstContent) setActive(firstContent);

      // Ambil submissions yang sudah ada
      try {
        const subRes = await api.get('/submissions/my');
        const subList = subRes.data.data ?? [];
        const map = new Map<number, Submission>();
        (Array.isArray(subList) ? subList : []).forEach((s: Submission & { content_id: number }) => {
          map.set(s.content_id, s);
        });
        setSubmissions(map);
      } catch {
        // Submissions endpoint mungkin belum ada — abaikan
      }
    }).catch(() => {
      setError('Gagal memuat konten kursus.');
    }).finally(() => setLoading(false));
  }, [params.slug]);

  const totalContents = data?.sections.reduce((acc, s) => acc + s.contents.length, 0) ?? 0;
  const completedCount = submissions.size;
  const progressPct = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400 gap-2">
      <svg className="animate-spin h-6 w-6 text-navy" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Memuat materi kursus...
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-5xl">🔒</div>
      <h2 className="text-lg font-bold text-navy-dark">{error}</h2>
      <button onClick={() => router.push('/student/catalog')} className="btn btn-secondary">
        ← Kembali ke Katalog
      </button>
    </div>
  );

  if (!data) return null;

  return (
    <div className="animate-fadeup flex gap-0 min-h-[80vh]">
      {/* ── Sidebar: Daftar Materi ─────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-slate-50 rounded-l-2xl overflow-y-auto max-h-[calc(100vh-120px)] sticky top-0">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-navy-dark text-sm leading-snug">{data.course.title}</h2>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress Belajar</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-navy to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{completedCount}/{totalContents} materi selesai</p>
          </div>
        </div>

        <nav className="py-3">
          {data.sections.map(section => (
            <div key={section.id} className="mb-1">
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</p>
              </div>
              {section.contents.map(content => {
                const isDone = submissions.has(content.id) && submissions.get(content.id)?.score !== null;
                const isActive = activeContent?.id === content.id;
                return (
                  <button key={content.id}
                    onClick={() => setActive(content)}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 text-sm transition-colors
                      ${isActive ? 'bg-navy text-white' : 'hover:bg-slate-100 text-navy-dark'}`}>
                    <span className="text-base mt-0.5 flex-shrink-0">
                      {isDone ? '✅' : CONTENT_ICONS[content.content_type] ?? '📌'}
                    </span>
                    <span className={`leading-snug flex-1 ${isActive ? 'font-semibold' : ''}`}>
                      {content.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main: Konten Aktif ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-8">
        {activeContent ? (
          <ContentViewer
            content={activeContent}
            enrollmentId={data.enrollment.id}
            submission={submissions.get(activeContent.id) ?? null}
            onSubmitDone={(contentId, sub) => {
              setSubmissions(prev => {
                const next = new Map(prev);
                next.set(contentId, sub);
                return next;
              });
              // Auto-advance ke konten berikutnya
              const allContents = data.sections.flatMap(s => s.contents);
              const idx = allContents.findIndex(c => c.id === contentId);
              if (idx >= 0 && idx < allContents.length - 1) {
                setActive(allContents[idx + 1]);
              }
            }}
          />
        ) : (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">👈</div>
            <p>Pilih materi dari daftar di sebelah kiri</p>
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

  return (
    <div className="animate-fadeup">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
          <span>{CONTENT_ICONS[type]}</span>
          <span>{CONTENT_LABELS[type] ?? type}</span>
        </div>
        <h1 className="text-xl font-extrabold text-navy-dark">{content.title}</h1>
        {content.instruction_text && (
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">{content.instruction_text}</p>
        )}
      </div>

      {/* Already graded banner */}
      {submission?.score !== null && submission?.score !== undefined && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <p className="font-bold text-emerald-700">Sudah Dinilai</p>
            <p className="text-sm text-emerald-600">
              Nilai: <strong>{submission.score}/{content.max_score}</strong>
              {submission.assessor_feedback && ` • Feedback: ${submission.assessor_feedback}`}
            </p>
          </div>
        </div>
      )}

      {/* Content by type */}
      {type === 'pdf_module' && (
        <PDFModule content={content} />
      )}
      {type === 'video_embed' && (
        <VideoEmbed content={content} />
      )}
      {type === 'mcq_quiz' && (
        <MCQQuiz content={content} enrollmentId={enrollmentId}
          alreadySubmitted={submission !== null}
          onDone={sub => onSubmitDone(content.id, sub)} />
      )}
      {(type === 'essay_task' || type === 'oral_video_task' || type === 'critical_thinking') && (
        <EssayTask content={content} enrollmentId={enrollmentId}
          submitted={submission !== null}
          onDone={sub => onSubmitDone(content.id, sub)} />
      )}
    </div>
  );
}

// ─── PDF Module ───────────────────────────────────────────────────────────────
function PDFModule({ content }: { content: Content }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4 py-6 justify-center flex-col text-center">
        <div className="text-6xl">📄</div>
        <div>
          <p className="font-bold text-navy-dark text-lg">{content.title}</p>
          <p className="text-slate-400 text-sm mt-1">Modul PDF — Buka dan pelajari materi berikut</p>
        </div>
        {content.file_path ? (
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${content.file_path}`}
            target="_blank" rel="noreferrer"
            className="btn btn-primary mt-2">
            📂 Buka PDF
          </a>
        ) : (
          <div className="bg-slate-100 rounded-xl px-6 py-4 text-slate-400 text-sm">
            File PDF belum diupload oleh admin.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video Embed ──────────────────────────────────────────────────────────────
function VideoEmbed({ content }: { content: Content }) {
  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url; // return as-is for GDrive or other embed URLs
  };

  return (
    <div className="card p-0 overflow-hidden">
      {content.embed_url ? (
        <div className="aspect-video">
          <iframe
            src={getEmbedUrl(content.embed_url)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400">
          <div className="text-5xl mb-3">🎬</div>
          <p>Link video belum tersedia.</p>
        </div>
      )}
    </div>
  );
}

// ─── MCQ Quiz ────────────────────────────────────────────────────────────────
function MCQQuiz({ content, enrollmentId, alreadySubmitted, onDone }: {
  content: Content;
  enrollmentId: number;
  alreadySubmitted: boolean;
  onDone: (sub: Submission) => void;
}) {
  const questions = content.quiz_questions ?? [];
  const [answers, setAnswers]     = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState<{ score: number; correct: number; total: number } | null>(null);

  if (alreadySubmitted && !result) return (
    <div className="card text-center py-12">
      <div className="text-4xl mb-3">✅</div>
      <p className="font-bold text-navy-dark">Kuis sudah dikerjakan</p>
      <p className="text-slate-400 text-sm mt-1">Lihat nilai di bagian atas halaman ini</p>
    </div>
  );

  if (result) return (
    <div className="card text-center py-12">
      <div className="text-5xl mb-4">{result.score >= 70 ? '🎉' : '📚'}</div>
      <h2 className="text-2xl font-extrabold text-navy-dark">{result.score}/100</h2>
      <p className="text-slate-500 mt-2">{result.correct} dari {result.total} soal benar</p>
      {result.score >= 70
        ? <p className="text-emerald-600 font-semibold mt-3">Kamu lulus! Lanjut ke materi berikutnya.</p>
        : <p className="text-orange-500 font-semibold mt-3">Pelajari ulang materi dan coba lagi.</p>}
    </div>
  );

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Jawab semua soal terlebih dahulu.');
      return;
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
      setResult({ score: sub.score, correct: sub.correct_count ?? 0, total: questions.length });
      onDone({ content_id: content.id, score: sub.score, assessor_feedback: null, graded_at: sub.graded_at });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengumpulkan jawaban.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card bg-navy/5 border-navy/10">
        <p className="text-sm text-navy font-semibold">📋 {questions.length} soal • Nilai min. lulus: 70/100</p>
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} className="card flex flex-col gap-4">
          <p className="font-semibold text-navy-dark text-sm">
            <span className="text-slate-400 mr-2">{qi + 1}.</span>{q.question_text}
          </p>
          <div className="flex flex-col gap-2">
            {q.options.map(opt => (
              <label key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm
                  ${answers[q.id] === opt.id
                    ? 'border-navy bg-navy/5 text-navy font-semibold'
                    : 'border-slate-200 hover:border-navy/30 hover:bg-slate-50'}`}>
                <input type="radio" name={`q-${q.id}`} value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                  className="accent-navy" />
                {opt.option_text}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={submitting || questions.length === 0}
        className="btn btn-primary btn-lg w-full">
        {submitting ? 'Mengumpulkan...' : '📤 Kumpulkan Jawaban'}
      </button>
    </div>
  );
}

// ─── Essay / Oral / Critical Thinking Task ───────────────────────────────────
function EssayTask({ content, enrollmentId, submitted, onDone }: {
  content: Content;
  enrollmentId: number;
  submitted: boolean;
  onDone: (sub: Submission) => void;
}) {
  const isVideo = content.content_type === 'oral_video_task';
  const [essay, setEssay]         = useState('');
  const [videoUrl, setVideoUrl]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(submitted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essay.trim() && !videoUrl.trim()) { alert('Isi jawaban terlebih dahulu.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        essay_text: essay || null,
        video_url: videoUrl || null,
      });
      setDone(true);
      onDone({ content_id: content.id, score: null, assessor_feedback: null, graded_at: null });
      return res;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengumpulkan tugas.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="card text-center py-12">
      <div className="text-4xl mb-3">⏳</div>
      <p className="font-bold text-navy-dark">Tugas Berhasil Dikumpulkan!</p>
      <p className="text-slate-400 text-sm mt-2">Menunggu penilaian dari assessor.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {content.instruction_text && (
        <div className="card bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800 leading-relaxed">{content.instruction_text}</p>
        </div>
      )}

      {!isVideo ? (
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Jawaban Esai</label>
          <textarea rows={10} required value={essay} onChange={e => setEssay(e.target.value)}
            placeholder="Tulis jawaban esai kamu di sini..."
            className="form-input resize-none leading-relaxed" />
          <span className="text-xs text-slate-400">{essay.length} karakter</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Link Video Oral Exam</label>
            <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              placeholder="Paste link YouTube / Google Drive video kamu..."
              className="form-input" />
            <p className="text-xs text-slate-400">Upload video ke YouTube (unlisted) atau Google Drive lalu paste linknya di sini</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Catatan Tambahan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea rows={4} value={essay} onChange={e => setEssay(e.target.value)}
              placeholder="Tambahkan catatan untuk assessor..."
              className="form-input resize-none" />
          </div>
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
        {submitting ? 'Mengumpulkan...' : '📤 Kumpulkan Tugas'}
      </button>
    </form>
  );
}
