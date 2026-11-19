'use client';

import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import MarkdownViewer from '@/components/MarkdownViewer';
import InteractiveModuleViewer from '@/components/InteractiveModuleViewer';
import { showSuccess, showError, showWarning, showConfirm } from '@/lib/swal';

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
interface QuizOption { id: number; option_text: string }
interface QuizQuestion { id: number; question_text: string; weight_score: number; options: QuizOption[] }
interface ContentAttachment {
  id: string;
  category: 'case_study_brief' | 'template' | 'example_guide' | 'additional';
  title: string;
  file_name: string;
  file_path: string;
  url: string;
  file_size?: number;
  file_size_formatted?: string;
  extension?: string;
  created_at?: string;
}

interface Content {
  id: number;
  content_type: 'pdf_module' | 'video_embed' | 'mcq_quiz' | 'essay_task' | 'oral_video_task' | 'critical_thinking' | 'field_study';
  title: string;
  file_path: string | null;
  attachments?: ContentAttachment[] | null;
  embed_url: string | null;
  instruction_text: string | null;
  content_body?: string | null;
  max_score: number;
  is_prerequisite: boolean;
  order_index: number;
  quiz_questions?: QuizQuestion[];
}
interface Section { id: number; title: string; order_index: number; contents: Content[] }
interface CourseData { id: number; title: string; slug: string }
interface EnrollInfo {
  id: number;
  status: string;
  enrollment_type: string;
  attended_field_trip: boolean;
  batch_id?: number | null;
  batch?: { id: number; batch_name: string; batch_code?: string | null; certificate_issue_date?: string | null } | null;
}
interface CertificateInfo { id: number; serial_number: string; serial_url_key: string; grade: string }
interface EligibilityInfo {
  eligible: boolean;
  coursework_completed?: boolean;
  scheduled_release_date?: string;
  batch_name?: string;
  reason?: string | null;
}
interface PageData {
  enrollment: EnrollInfo;
  course: CourseData;
  sections: Section[];
  certificate?: CertificateInfo | null;
  eligibility?: EligibilityInfo | null;
}
interface Submission {
  id?: number;
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
  pdf_module: { icon: 'file-multiple', label: 'Learning Module', color: 'blue', badge: 'bg-blue-100 text-blue-700' },
  video_embed: { icon: 'camera-movie-1', label: 'Video Lecture', color: 'purple', badge: 'bg-purple-100 text-purple-700' },
  mcq_quiz: { icon: 'pen-to-square', label: 'Multiple-Choice Examination', color: 'amber', badge: 'bg-amber-100 text-amber-700' },
  essay_task: { icon: 'pencil-1', label: 'Case-Study Essay Submission', color: 'teal', badge: 'bg-teal-100 text-teal-700' },
  oral_video_task: { icon: 'camera-movie-1', label: 'Oral Video Exam', color: 'rose', badge: 'bg-rose-100 text-rose-700' },
  critical_thinking: { icon: 'bulb-2', label: 'Critical Thinking Exam', color: 'indigo', badge: 'bg-indigo-100 text-indigo-700' },
  field_study: { icon: 'water-drop-1', label: 'Training Course (Field Study)', color: 'emerald', badge: 'bg-emerald-100 text-emerald-700' },
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StudentCoursePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<PageData | null>(null);
  const [submissions, setSubmissions] = useState<Map<number, Submission>>(new Map());
  const [activeContent, setActive] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ message: string; dev_url?: string | null; success: boolean } | null>(null);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    setResendStatus(null);
    try {
      const res = await api.post('/auth/email/resend');
      setResendStatus({
        success: true,
        message: res.data.message || 'Tautan verifikasi email baru telah berhasil dikirim.',
        dev_url: res.data.dev_url || null,
      });
    } catch (err: any) {
      setResendStatus({
        success: false,
        message: err?.response?.data?.message || 'Gagal mengirim email verifikasi. Silakan coba sesaat lagi.',
      });
    } finally {
      setResendingEmail(false);
    }
  };

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
    // ── Proteksi Verifikasi Email: Langsung kunci jika email belum diverifikasi ──
    if (user && !user.email_verified_at) {
      setIsEmailUnverified(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setIsEmailUnverified(false);

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

      // Pastikan jika kursus Specialization, user harus sudah menyelesaikan Foundation
      const isSpec = course?.certification_level?.code === 'SPEC';
      const foundationCompleted = enrollments.some(
        (e: any) => e.status === 'completed' && e.course?.certification_level?.code === 'FND'
      );
      if (isSpec && !foundationCompleted) {
        throw new Error('Kamu harus menyelesaikan kursus Foundation Level terlebih dahulu sebelum dapat mengakses materi spesialisasi.');
      }

      // Step 3: load full content using enrollment ID
      const contentRes = await api.get(`/enrollments/${enrollment.id}/contents`);
      const pageData: PageData = contentRes.data.data;
      setData(pageData);

      const firstContent = pageData.sections?.[0]?.contents?.[0];
      if (firstContent) setActive(firstContent);

      await refreshSubmissions();
    }).catch((err) => {
      const isUnverified = err?.response?.data?.email_unverified ||
        (err?.response?.status === 403 && (err?.response?.data?.message?.toLowerCase().includes('verifikasi email') || (user && !user.email_verified_at)));

      if (isUnverified) {
        setIsEmailUnverified(true);
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? 'Gagal memuat konten kursus.');
      }
    }).finally(() => setLoading(false));
  }, [params.slug, refreshSubmissions, user]);


  const enrollment = data?.enrollment;
  const isFieldTrip = enrollment?.attended_field_trip ?? false;

  // Filter modul wajib sesuai jalur siswa:
  // - Jika siswa ikut Field Study (isFieldTrip === true): critical_thinking dibebaskan, field_study wajib (selesai jika hadir)
  // - Jika siswa TIDAK ikut Field Study: critical_thinking wajib, field_study tidak wajib
  const requiredContents = (data?.sections.flatMap(s => s.contents) ?? []).filter(c => {
    if (c.content_type === 'critical_thinking' && isFieldTrip) return false;
    if (c.content_type === 'field_study' && !isFieldTrip) return false;
    return true;
  });

  const totalContents = requiredContents.length;

  const completedCount = requiredContents.filter(c => {
    if (c.content_type === 'field_study' && isFieldTrip) return true;
    const sub = submissions.get(c.id);
    return sub?.score !== null && sub?.score !== undefined;
  }).length;

  const progressPct = totalContents > 0 ? Math.min(100, Math.round((completedCount / totalContents) * 100)) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
      <svg className="animate-spin h-6 w-6 text-navy" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <span className="text-sm font-medium">Memuat materi kursus...</span>
    </div>
  );

  if (isEmailUnverified) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fadeup">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/90 shadow-xl shadow-amber-500/5 text-center">
        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-5 border border-amber-100">
          <Icon name="envelope-1" size={32} />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-3">
          Verifikasi Email Diperlukan
        </span>
        <h2 className="text-xl font-bold text-navy-dark mb-2">Akses Silabus Terkunci</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Untuk mulai mengakses silabus dan seluruh materi kursus ini, Anda perlu memverifikasi alamat email akun Anda (<span className="font-semibold text-navy">{user?.email}</span>).
        </p>

        {resendStatus && (
          <div className={`p-4 rounded-2xl text-xs mb-6 text-left leading-relaxed ${resendStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            <div className="font-semibold">{resendStatus.message}</div>
            {resendStatus.dev_url && (
              <div className="mt-3 pt-3 border-t border-emerald-200/80">
                <p className="text-[11px] text-slate-500 mb-2">
                  🛠️ <span className="font-bold text-navy-dark">Local Dev Helper:</span> Karena project belum di-hosting (mail log aktif), gunakan tautan cepat di bawah ini untuk aktivasi:
                </p>
                <a
                  href={resendStatus.dev_url}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                >
                  <span>Verifikasi Akun Sekarang (Dev Mode)</span>
                  <Icon name="arrow-right" size={13} />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleResendVerification}
            disabled={resendingEmail}
            className="btn btn-primary bg-navy hover:bg-navy-dark text-white text-xs py-2.5 px-5 flex items-center justify-center gap-2 rounded-xl disabled:opacity-60 shadow-md shadow-navy/10"
          >
            {resendingEmail ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Mengirim Email...</span>
              </>
            ) : (
              <>
                <Icon name="envelope-1" size={15} />
                <span>Kirim Ulang Email Verifikasi</span>
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="btn btn-secondary text-xs py-2.5 px-5 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-6xl"><Icon name="locked-1" size={18} /></div>
      <h2 className="text-lg font-bold text-navy-dark">{error}</h2>
      <button onClick={() => router.push('/student/catalog')} className="btn btn-secondary">
        <Icon name="arrow-left" size={16} className="mr-1.5" />Kembali ke Katalog
      </button>
    </div>
  );

  if (!data || !enrollment) return null;

  return (
    <div className="flex flex-col h-full bg-slate-100 w-full overflow-hidden">
      {/* ── Top Bar Immersive Learning Header ── */}
      <header className="h-16 bg-[#00162d] text-white border-b border-white/10 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/student/catalog')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
            title="Kembali ke Katalog Kursus"
          >
            <Icon name="arrow-left" size={14} />
            <span className="hidden sm:inline">Katalog</span>
          </button>

          <div className="h-5 w-px bg-white/15 flex-shrink-0" />

          {/* Toggle Silabus Modul (Focus Mode) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
              isSidebarOpen
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
            title={isSidebarOpen ? 'Sembunyikan Silabus (Mode Layar Penuh Modul)' : 'Buka Silabus Modul'}
          >
            <Icon name="books-2" size={15} />
            <span className="text-xs font-bold">{isSidebarOpen ? 'Tutup Silabus' : 'Daftar Modul'}</span>
          </button>

          <div className="min-w-0 hidden lg:flex items-center gap-2 ml-1">
            <span className="text-slate-400 text-xs">/</span>
            <h1 className="text-xs sm:text-sm font-extrabold truncate text-white">
              {data.course.title}
            </h1>
          </div>
        </div>

        {/* Right side: Progress & Certificate */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium">Progres Belajar</p>
              <p className="text-xs font-bold text-sky-400">
                {completedCount}/{totalContents} Selesai ({progressPct}%)
              </p>
            </div>
            <div className="w-24 sm:w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {progressPct === 100 && data?.certificate && (
            <button
              type="button"
              onClick={() => router.push('/student/certificates')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Icon name="certificate-badge-1" size={14} />
              <span className="hidden sm:inline">Sertifikat Terbit</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main Viewport (Sidebar + Reading Area) ── */}
      <div className="flex-1 flex overflow-hidden w-full min-h-0">
        {/* ── Sidebar Silabus (Bisa di-toggle / Collapsible) ───────────────────── */}
        {isSidebarOpen && (
          <aside className="w-80 lg:w-88 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto h-full z-20 shadow-sm animate-fadein">
        {/* Course Info */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {enrollment?.batch ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Icon name="flag-1" size={10} />
                {enrollment.batch.batch_name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Jalur Mandiri (Self-Paced)
              </span>
            )}
          </div>
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

            {/* Banner Sertifikat Siap di Sidebar */}
            {progressPct === 100 && data?.certificate && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                  <Icon name="check-circle-1" size={14} className="text-emerald-600" />
                  <span>Kursus Tuntas 100%!</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Selamat! Sertifikat kamu telah diterbitkan secara otomatis.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/student/certificates')}
                  className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Icon name="certificate-badge-1" size={14} />
                  <span>Lihat Sertifikat</span>
                </button>
              </div>
            )}
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
                const sub = submissions.get(content.id);
                const isFieldStudyDone = content.content_type === 'field_study' && isFieldTrip;
                const isDone = (sub?.score !== null && sub?.score !== undefined) || isFieldStudyDone;
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
                    <span className="flex-shrink-0 mt-0.5"><Icon name={isLocked ? "locked-1" : meta.icon} size={18} /></span>
                    <span className={`flex-1 text-xs leading-snug ${isSelected ? 'font-semibold text-white' : 'text-navy-dark'}`}>
                      {content.title}
                      {isLocked && <span className="block text-[10px] text-slate-400 mt-0.5">Kamu mengikuti Field Study</span>}
                    </span>
                    <span className="flex-shrink-0 mt-0.5">
                      {isDone ? <Icon name="check-circle-1" size={16} /> : isPending ? <Icon name="hourglass" size={16} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    )}

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className={`flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? '' : 'max-w-7xl mx-auto w-full'}`}>
        {/* Banner Selamat & Sertifikat Terbit Otomatis vs Menunggu Jadwal Batch */}
        {progressPct === 100 && (
          data?.certificate ? (
            <div className="mb-6 p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeup border border-emerald-400/30">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                  <Icon name="certificate-badge-1" size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                      Selesai 100%
                    </span>
                    <span className="text-xs text-emerald-100 font-medium">
                      Semua Syarat Kelulusan Terpenuhi
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg mt-0.5">
                    Selamat! Sertifikat Resmi Kamu Telah Terbit Otomatis
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                    Kamu telah menuntaskan seluruh materi kursus. Sertifikat digital siap diunduh dan diverifikasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/student/certificates')}
                className="py-2.5 px-5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icon name="certificate-badge-1" size={16} />
                <span>Buka Sertifikat Saya</span>
              </button>
            </div>
          ) : (
            <div className="mb-6 p-5 bg-gradient-to-r from-[#07192C] via-[#0d2a4a] to-[#12365e] rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeup border border-sky-400/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner border border-white/15">
                  <Icon name="hourglass" size={24} className="text-sky-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-full">
                      Materi Tuntas 100%
                    </span>
                    {enrollment?.batch && (
                      <span className="text-xs text-sky-200 font-semibold">
                        {enrollment.batch.batch_name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg mt-0.5 text-white">
                    Seluruh Tugas Selesai! Menunggu Jadwal Terbit Sertifikat
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    {data?.eligibility?.reason ?? (
                      enrollment?.batch?.certificate_issue_date
                        ? `Sertifikat resmi untuk angkatan kamu dijadwalkan terbit pada ${new Date(enrollment.batch.certificate_issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                        : 'Sertifikat resmi sedang dalam proses verifikasi akhir oleh tim akademik.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
        {activeContent ? (
          <ContentViewer
            content={activeContent}
            course={data.course}
            enrollment={enrollment}
            enrollmentId={enrollment.id}
            submission={submissions.get(activeContent.id) ?? null}
            onSubmitDone={(contentId, sub) => {
              setSubmissions(prev => {
                const next = new Map(prev);
                next.set(contentId, sub);
                return next;
              });
              // For quiz and assignments, advance automatically
              if (!['pdf_module', 'video_embed'].includes(activeContent.content_type)) {
                const allContents = data.sections.flatMap(s => s.contents);
                const idx = allContents.findIndex(c => c.id === contentId);
                if (idx >= 0 && idx < allContents.length - 1) {
                  setTimeout(() => setActive(allContents[idx + 1]), 800);
                }
              }
            }}
            onUnmarkDone={(contentId) => {
              setSubmissions(prev => {
                const next = new Map(prev);
                next.delete(contentId);
                return next;
              });
            }}
            onNextContent={() => {
              const allContents = data.sections.flatMap(s => s.contents);
              const idx = allContents.findIndex(c => c.id === activeContent.id);
              if (idx >= 0 && idx < allContents.length - 1) {
                setActive(allContents[idx + 1]);
              }
            }}
            onEnrollmentUpdate={(updatedEnroll) => {
              setData(prev => prev ? { ...prev, enrollment: updatedEnroll } : prev);
            }}
          />
        ) : (
          <div className="text-center py-24 text-slate-400">
            <div className="text-6xl mb-4"><Icon name="arrow-left" size={18} /></div>
            <p className="font-medium">Pilih materi dari daftar di sebelah kiri</p>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

// ─── Content Viewer ───────────────────────────────────────────────────────────
function ContentViewer({
  content,
  course,
  enrollment,
  enrollmentId,
  submission,
  onSubmitDone,
  onUnmarkDone,
  onNextContent,
  onEnrollmentUpdate,
}: {
  content: Content;
  course?: CourseData;
  enrollment: EnrollInfo;
  enrollmentId: number;
  submission: Submission | null;
  onSubmitDone: (contentId: number, sub: Submission) => void;
  onUnmarkDone: (contentId: number) => void;
  onNextContent: () => void;
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
          <Icon name={isLocked ? "locked-1" : meta.icon} size={16} className="mr-1.5" /> {isLocked ? 'Terkunci' : meta.label}
        </span>
        <h1 className="text-2xl font-extrabold text-navy-dark mt-3 leading-snug">{content.title}</h1>
      </div>

      {/* Locked State for Critical Thinking */}
      {isLocked && (
        <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          <div className="text-7xl"><Icon name="locked-1" size={18} /></div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-600">Modul Terkunci</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md">
              Kamu telah terdaftar sebagai peserta <strong>Field Study</strong>. Modul Critical Thinking ini tidak perlu dikerjakan — kamu mendapat substitusi nilai dari aktivitas lapangan.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-emerald-700 text-sm font-medium flex items-center gap-2">
            <Icon name="check-circle-1" size={16} className="mr-1.5" />Status Field Study kamu sudah terkonfirmasi oleh admin
          </div>
        </div>
      )}

      {/* Graded Banner - exclude reading & video modules which have their own completion cards */}
      {!isLocked && !['pdf_module', 'video_embed'].includes(type) && submission?.score !== null && submission?.score !== undefined && (
        <GradedBanner submission={submission} content={content} />
      )}
      {!isLocked && !['pdf_module', 'video_embed'].includes(type) && submission && submission.score === null && submission.status === 'submitted' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl"><Icon name="hourglass" size={24} /></div>
          <div>
            <p className="font-bold text-amber-700">Menunggu Penilaian</p>
            <p className="text-sm text-amber-600 mt-0.5">Jawaban sudah dikumpulkan. Assessor akan segera memberikan nilai.</p>
          </div>
        </div>
      )}

      {/* Content by type */}
      {!isLocked && (
        <>
          {type === 'pdf_module' && (
            <PDFModule
              content={content}
              enrollmentId={enrollmentId}
              submission={submission}
              onDone={sub => onSubmitDone(content.id, sub)}
              onUnmark={() => onUnmarkDone(content.id)}
              onNext={onNextContent}
            />
          )}
          {type === 'video_embed' && (
            <VideoEmbed
              content={content}
              enrollmentId={enrollmentId}
              submission={submission}
              onDone={sub => onSubmitDone(content.id, sub)}
              onUnmark={() => onUnmarkDone(content.id)}
              onNext={onNextContent}
            />
          )}
          {type === 'mcq_quiz' && (
            <MCQQuiz content={content} enrollmentId={enrollmentId}
              submission={submission}
              onDone={sub => onSubmitDone(content.id, sub)} />
          )}
          {type === 'essay_task' && (
            <EssayTask content={content} enrollmentId={enrollmentId}
              submission={submission}
              onDone={sub => onSubmitDone(content.id, sub)} />
          )}
          {type === 'oral_video_task' && (
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
              course={course}
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
  const score = submission.score ?? 0;
  const maxScore = content.max_score || 100;
  const pct = Math.round((score / maxScore) * 100);
  const passed = score >= 70;

  return (
    <div className={`rounded-2xl border px-5 py-4 ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl"><Icon name={passed ? "party-spray" : "books-2"} size={30} /></div>
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
          {submission.correct_count != null && (
            <p className="text-xs mt-1.5 text-slate-500">{submission.correct_count} dari {submission.total_questions || content.quiz_questions?.length || 30} soal benar</p>
          )}
          {submission.assessor_feedback && (
            <p className="text-sm mt-2 text-slate-600 italic"><Icon name="comment-1" size={16} className="mr-1.5" />&ldquo;{submission.assessor_feedback}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 1. PDF Module ────────────────────────────────────────────────────────────
function PDFModule({
  content,
  enrollmentId,
  submission,
  onDone,
  onUnmark,
  onNext,
}: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
  onUnmark: () => void;
  onNext?: () => void;
}) {
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(true);

  const isCompleted = submission?.score !== null && submission?.score !== undefined;

  const pdfUrl = content.file_path
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${content.file_path}`
    : null;

  const handleMarkDone = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        essay_text: 'completed_reading',
      });
      const sub = res.data.data;
      const newSub: Submission = {
        id: sub.id,
        content_id: content.id,
        score: sub.score ?? 100,
        assessor_feedback: null,
        graded_at: sub.graded_at ?? new Date().toISOString(),
        status: 'graded',
      };
      onDone(newSub);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal menandai modul selesai.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnmark = async () => {
    if (!submission?.id) {
      onUnmark();
      return;
    }
    const isConfirmed = await showConfirm(
      'Batalkan Tanda Selesai?',
      'Apakah kamu ingin membatalkan tanda selesai untuk modul ini? Bar progres belajar akan diperbarui kembali.',
      'Ya, Batalkan',
      true
    );
    if (!isConfirmed) {
      return;
    }
    setSubmitting(true);
    try {
      await api.delete(`/submissions/${submission.id}`);
      showSuccess('Berhasil!', 'Tanda selesai berhasil dibatalkan.');
      onUnmark();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal membatalkan tanda selesai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Petunjuk Belajar / Ringkasan Modul (Jika ada dari Instruktur) */}
      {content.instruction_text && (
        <div className="bg-gradient-to-r from-blue-50/90 to-sky-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg bg-navy text-white flex items-center justify-center text-xs">
              <Icon name="info" size={13} />
            </span>
            <h5 className="font-bold text-xs sm:text-sm text-navy-dark">Petunjuk & Sasaran Modul</h5>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed pl-8">
            <MarkdownViewer content={content.instruction_text} />
          </div>
        </div>
      )}

      {/* ─── SLIDE DECK VIEWER (IN-APP SECURE READER DENGAN CATATAN SLIDE) ─── */}
      {pdfUrl ? (
        <div className="flex flex-col gap-3">
          <AestheticPdfReader
            url={pdfUrl}
            title={content.title}
            allowDownload={false}
            contentId={content.id}
            watermarkText={`${user?.name || 'Peserta DigiBlue'} (${user?.email || 'Student Portal'}) • Materi Resmi Terproteksi`}
            height="82vh"
          />
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-4xl text-navy">
            <Icon name="file-multiple" size={36} />
          </div>
          <div>
            <p className="font-bold text-navy-dark text-lg">{content.title}</p>
            <p className="text-slate-400 text-sm mt-1">
              Berkas modul pembelajaran (.pdf) sedang disiapkan oleh instruktur/admin.
            </p>
          </div>
        </div>
      )}

      {/* ─── Self-Assessment / Completion Widget ───────────────────────────── */}
      {isCompleted ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-7 shadow-sm transition-all animate-fadeup">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-500/25 flex-shrink-0">
                <Icon name="check" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
                    Selesai Dipelajari
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold">
                    • 100% Progres Tersimpan
                  </span>
                </div>
                <h4 className="font-extrabold text-navy-dark text-lg mt-1.5">
                  Kamu sudah menuntaskan modul bacaan ini!
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Modul ini telah tercatat dalam progress bar kursus kamu. Kamu dapat membaca ulang materi ini kapan saja atau lanjut ke materi/ujian berikutnya.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:self-center flex-shrink-0">
              <button
                type="button"
                onClick={handleUnmark}
                disabled={submitting}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-sm"
                title="Batalkan jika ingin mereset status bacaan"
              >
                {submitting ? <span className="animate-spin text-xs"><Icon name="hourglass" size={12} /></span> : <Icon name="arrow-right" size={14} />}
                <span>Batal Tandai</span>
              </button>

              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="btn btn-primary text-xs sm:text-sm px-5 py-2.5 shadow-md shadow-navy/20 flex items-center gap-2"
                >
                  <span>Lanjut ke Modul Berikutnya</span>
                  <span><Icon name="arrow-right" size={18} /></span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 hover:border-navy/30 rounded-3xl p-6 sm:p-7 shadow-sm transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center text-2xl flex-shrink-0">
                <Icon name="target-user" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-navy bg-navy/10 px-3 py-0.5 rounded-full">
                    Self-Assessment / Evaluasi Mandiri
                  </span>
                </div>
                <h4 className="font-extrabold text-navy-dark text-lg mt-1.5">
                  Sudah selesai membaca & memahami modul ini?
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Tandai bahwa kamu telah menelaah seluruh isi modul materi di atas agar indikator dan bar progress belajar kamu terisi.
                </p>

                <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium group-hover:text-navy transition-colors select-none">
                    Saya menyatakan telah membaca modul materi ini dengan seksama dan siap lanjut.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={handleMarkDone}
                disabled={submitting || !confirmed}
                className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md transition-all ${confirmed && !submitting
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Menyimpan Progres...</span>
                  </>
                ) : (
                  <>
                    <span><Icon name="check-circle-1" size={18} /></span>
                    <span>Tandai Selesai Membaca Modul</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2. Video Embed ───────────────────────────────────────────────────────────
function VideoEmbed({
  content,
  enrollmentId,
  submission,
  onDone,
  onUnmark,
  onNext,
}: {
  content: Content;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
  onUnmark: () => void;
  onNext?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(true);

  const isCompleted = submission?.score !== null && submission?.score !== undefined;

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    return url;
  };

  const handleMarkDone = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        essay_text: 'completed_video',
      });
      const sub = res.data.data;
      const newSub: Submission = {
        id: sub.id,
        content_id: content.id,
        score: sub.score ?? 100,
        assessor_feedback: null,
        graded_at: sub.graded_at ?? new Date().toISOString(),
        status: 'graded',
      };
      onDone(newSub);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal menandai video selesai.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnmark = async () => {
    if (!submission?.id) {
      onUnmark();
      return;
    }
    const isConfirmed = await showConfirm(
      'Batalkan Tanda Selesai?',
      'Apakah kamu ingin membatalkan tanda selesai untuk video ini? Bar progres belajar akan diperbarui kembali.',
      'Ya, Batalkan',
      true
    );
    if (!isConfirmed) {
      return;
    }
    setSubmitting(true);
    try {
      await api.delete(`/submissions/${submission.id}`);
      showSuccess('Berhasil!', 'Tanda selesai berhasil dibatalkan.');
      onUnmark();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal membatalkan tanda selesai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {content.instruction_text && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 sm:p-6">
          <MarkdownViewer content={content.instruction_text} />
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
            <div className="text-5xl mb-3"><Icon name="camera-movie-1" size={48} /></div>
            <p>Link video belum tersedia.</p>
          </div>
        )}
      </div>

      {/* Completion widget */}
      {isCompleted ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-7 shadow-sm transition-all animate-fadeup">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-500/25 flex-shrink-0">
                <Icon name="check" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
                    Selesai Ditonton
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold">
                    • 100% Progres Tersimpan
                  </span>
                </div>
                <h4 className="font-extrabold text-navy-dark text-lg mt-1.5">
                  Kamu sudah menuntaskan materi video ini!
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Video materi ini telah tercatat dalam progress bar kursus kamu.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:self-center flex-shrink-0">
              <button
                type="button"
                onClick={handleUnmark}
                disabled={submitting}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {submitting ? <span className="animate-spin text-xs"><Icon name="hourglass" size={12} /></span> : <Icon name="arrow-right" size={14} />}
                <span>Batal Tandai</span>
              </button>

              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="btn btn-primary text-xs sm:text-sm px-5 py-2.5 shadow-md shadow-navy/20 flex items-center gap-2"
                >
                  <span>Lanjut ke Modul Berikutnya</span>
                  <span><Icon name="arrow-right" size={18} /></span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 hover:border-navy/30 rounded-3xl p-6 sm:p-7 shadow-sm transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl flex-shrink-0">
                <Icon name="camera-movie-1" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-0.5 rounded-full">
                    Self-Assessment / Evaluasi Mandiri
                  </span>
                </div>
                <h4 className="font-extrabold text-navy-dark text-lg mt-1.5">
                  Sudah selesai menyimak video materi ini?
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Tandai bahwa kamu telah menonton materi video di atas agar indikator dan bar progress belajar kamu terisi.
                </p>

                <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium group-hover:text-navy transition-colors select-none">
                    Saya menyatakan telah menonton video materi ini dan memahami isinya.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={handleMarkDone}
                disabled={submitting || !confirmed}
                className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md transition-all ${confirmed && !submitting
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Menyimpan Progres...</span>
                  </>
                ) : (
                  <>
                    <span><Icon name="check-circle-1" size={18} /></span>
                    <span>Tandai Selesai Menonton Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const questions = content.quiz_questions ?? [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  const alreadyPassed = submission?.score != null && submission.score >= 70;
  const alreadyFailed = submission?.score != null && submission.score < 70;

  if (alreadyPassed && !result) {
    return (
      <div className="card text-center py-14 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl"><Icon name="check-circle-1" size={36} /></div>
        <h3 className="font-extrabold text-navy-dark text-xl">Kamu Sudah Lulus!</h3>
        <p className="text-slate-500 text-sm">
          Nilai: <strong>{submission!.score}</strong> • {submission!.correct_count}/{submission!.total_questions || questions.length || 30} benar
        </p>
      </div>
    );
  }

  if (result) {
    const passed = result.score >= 70;
    return (
      <div className={`rounded-2xl border-2 p-8 text-center flex flex-col items-center gap-4 ${passed ? 'bg-emerald-50 border-emerald-300' : 'bg-orange-50 border-orange-300'}`}>
        <div className="text-6xl"><Icon name={passed ? "party-spray" : "books-2"} size={60} /></div>
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
                <Icon name="refresh-circle-1-clockwise" size={16} className="mr-1.5" />Coba Lagi
              </button>
            </div>
          )
        }
      </div>
    );
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      showWarning('Jawaban Belum Lengkap', 'Jawab semua soal terlebih dahulu sebelum mengumpulkan kuis.');
      return;
    }
    const isConfirmed = await showConfirm(
      'Kumpulkan Jawaban Kuis?',
      'Apakah kamu yakin ingin mengumpulkan jawaban kuis ini?',
      'Ya, Kumpulkan'
    );
    if (!isConfirmed) return;
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
      showSuccess('Kuis Selesai', `Jawaban berhasil dikumpulkan dengan skor: ${sub.score}`);
      onDone(newSub);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes('sudah lulus')) {
        showSuccess('Informasi Kuis', 'Kamu sudah lulus kuis ini!');
      } else {
        showError('Gagal!', msg ?? 'Gagal mengumpulkan jawaban.');
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
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6">
          <MarkdownViewer content={content.instruction_text} />
        </div>
      )}

      {alreadyFailed && !showRetry && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-orange-700">Nilai sebelumnya: {submission!.score}/100</p>
            <p className="text-sm text-orange-600 mt-0.5">Kamu bisa mengulang kuis ini untuk meningkatkan nilai.</p>
          </div>
          <button onClick={() => setShowRetry(true)} className="btn btn-secondary text-sm">
            <Icon name="refresh-circle-1-clockwise" size={16} className="mr-1.5" />Coba Lagi
          </button>
        </div>
      )}

      {(!alreadyFailed || showRetry) && (
        <>
          {/* Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-navy-dark"><Icon name="pen-to-square" size={16} className="mr-1.5" />{questions.length} Soal Pilihan Ganda</span>
              <span className="text-sm text-slate-500">{answeredCount}/{questions.length} dijawab</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-navy rounded-full transition-all duration-300"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }} />
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
              ? <><svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Mengumpulkan...</>
              : <><Icon name="upload-1" size={16} className="mr-1.5" />Kumpulkan Jawaban</>}
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
  const [essay, setEssay] = useState('');
  const [fileShareUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const alreadySubmitted = submission !== null;

  const isCriticalThinking = content.content_type === 'critical_thinking';
  const colorClass = isCriticalThinking ? 'indigo' : 'teal';
  const bgClass = isCriticalThinking ? 'bg-indigo-50 border-indigo-200' : 'bg-teal-50 border-teal-200';
  const textClass = isCriticalThinking ? 'text-indigo-700' : 'text-teal-700';

  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfTitle, setViewingPdfTitle] = useState('');

  useEffect(() => {
    if (viewingPdfUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingPdfUrl]);

  // Show soal PDF if admin uploaded one
  const soalPdfUrl = content.file_path
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${content.file_path}`
    : null;

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`${bgClass} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl"><Icon name="check-circle-1" size={20} /></span>
            <p className={`font-extrabold ${textClass} text-base`}>
              {isCriticalThinking ? 'Jawaban Critical Thinking Assignment Sudah Dikumpulkan' : 'Tugas Studi Kasus Sudah Dikumpulkan'}
            </p>
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
                <Icon name="paperclip-1" size={16} className="mr-1.5" />Buka Berkas Tugas <Icon name="arrow-right" size={14} className="ml-1.5" />
              </a>
            </div>
          )}
          {submission.score === null && (
            <p className={`text-sm ${isCriticalThinking ? 'text-indigo-700' : 'text-teal-700'} mt-4 flex items-center gap-2 font-medium bg-white/70 p-3 rounded-xl border border-slate-100`}>
              <span className="animate-pulse"><Icon name="hourglass" size={18} /></span> Menunggu proses penilaian & feedback dari Tim Asesor DigiBlueCamp...
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essay.trim() && !fileShareUrl.trim() && !selectedFile) {
      showWarning(
        'Form Belum Lengkap',
        'Mohon unggah file jawaban (PDF/DOCX), cantumkan link dokumen, atau ketikkan esai jawaban Anda.'
      );
      return;
    }

    const isConfirmed = await showConfirm(
      isCriticalThinking ? 'Kumpulkan Jawaban Critical Thinking?' : 'Kumpulkan Tugas Studi Kasus?',
      isCriticalThinking
        ? 'Apakah kamu yakin ingin mengumpulkan jawaban Critical Thinking ini? Asesor akan meninjau dan menilai dokumen jawabanmu.'
        : 'Apakah kamu yakin ingin mengumpulkan tugas studi kasus ini? Asesor akan meninjau jawabanmu.',
      'Ya, Kumpulkan'
    );
    if (!isConfirmed) return;

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
      showSuccess(
        'Berhasil!',
        isCriticalThinking
          ? 'Jawaban Critical Thinking Assignment berhasil dikumpulkan.'
          : 'Tugas studi kasus berhasil dikumpulkan.'
      );
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
      showError('Gagal!', msg ?? 'Gagal mengumpulkan tugas studi kasus.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasAttachments = !!(content.attachments && content.attachments.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Instructions / Case Study Markdown Prompt */}
      {content.instruction_text && (
        <div className={`${bgClass} border rounded-3xl p-6 sm:p-8 shadow-sm`}>
          <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-navy/10">
            <Icon name={isCriticalThinking ? "bulb-2" : "clipboard"} size={24} />
            <h3 className={`text-lg font-extrabold ${textClass}`}>
              {isCriticalThinking ? "Naskah Soal & Panduan Critical Thinking" : "Naskah Soal & Panduan Studi Kasus"}
            </h3>
          </div>
          <MarkdownViewer content={content.instruction_text} />
        </div>
      )}

      {/* ─── Case Study Support Materials & Multi-Attachment Downloads ─── */}
      {hasAttachments && (
        <div className="bg-gradient-to-br from-white via-slate-50 to-teal-50/20 border-2 border-teal-200/80 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-fadeup">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-sm">
                <Icon name={isCriticalThinking ? "bulb-2" : "folder-open"} size={18} />
              </span>
              <h3 className="font-extrabold text-navy-dark text-base sm:text-lg">
                {isCriticalThinking ? "Dokumen Naskah Soal Resmi (PDF)" : "Berkas & Dokumen Pendukung Studi Kasus"}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isCriticalThinking
                ? "Unduh atau buka naskah soal resmi studi kasus paus pilot di bawah ini untuk mempelajari detail kasus dan 15 pertanyaan secara lengkap."
                : "Unduh template lembar kerja dan berkas acuan di bawah ini untuk memulai pengerjaan tugas studi kasus Anda. Kerjakan sesuai format template yang telah disediakan."}
            </p>
          </div>

          {/* Grid 3 Berkas Utama (Soal, Template, Contoh) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Naskah Soal */}
            {(() => {
              const att = content.attachments?.find(a => a.category === 'case_study_brief');
              if (!att) return null;
              const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
              const downloadUrl = `${backendBase}/storage/${att.file_path}`;
              const isPdf = att.extension?.toLowerCase() === 'pdf' || att.file_name.toLowerCase().endsWith('.pdf');
              return (
                <div className="bg-white border-2 border-teal-100 hover:border-teal-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      Naskah Soal
                    </span>
                    <h4 className="font-bold text-navy-dark text-sm line-clamp-1">{att.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.file_name}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-teal-600/20"
                    >
                      <Icon name="download" size={14} />
                      <span>Unduh Soal</span>
                    </a>
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => { setViewingPdfUrl(downloadUrl); setViewingPdfTitle(att.title); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors"
                        title="Baca langsung di layar"
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. Template Lembar Jawaban */}
            {(() => {
              const att = content.attachments?.find(a => a.category === 'template');
              if (!att) return null;
              const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
              const downloadUrl = `${backendBase}/storage/${att.file_path}`;
              const isWord = att.extension?.toLowerCase().includes('doc');
              return (
                <div className="bg-white border-2 border-blue-100 hover:border-blue-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      Template Lembar Kerja
                    </span>
                    <h4 className="font-bold text-navy-dark text-sm line-clamp-1">{att.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.file_name}
                      className="w-full py-2 bg-navy hover:bg-navy-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Icon name="download" size={14} />
                      <span>Unduh Template {isWord ? '(.docx)' : ''}</span>
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* 3. Contoh Pengisian / Rubrik */}
            {(() => {
              const att = content.attachments?.find(a => a.category === 'example_guide');
              if (!att) return null;
              const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
              const downloadUrl = `${backendBase}/storage/${att.file_path}`;
              const isPdf = att.extension?.toLowerCase() === 'pdf' || att.file_name.toLowerCase().endsWith('.pdf');
              return (
                <div className="bg-white border-2 border-amber-100 hover:border-amber-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      Contoh Acuan Pengerjaan
                    </span>
                    <h4 className="font-bold text-navy-dark text-sm line-clamp-1">{att.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.file_name}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-amber-600/20"
                    >
                      <Icon name="download" size={14} />
                      <span>Unduh Contoh</span>
                    </a>
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => { setViewingPdfUrl(downloadUrl); setViewingPdfTitle(att.title); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors"
                        title="Baca langsung di layar"
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Dokumen Pendukung Tambahan (Dataset, UU, dsb jika ada) */}
          {(content.attachments?.filter(a => a.category === 'additional').length ?? 0) > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="paperclip-1" size={14} />
                Dokumen Pendukung Tambahan ({content.attachments?.filter(a => a.category === 'additional').length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {content.attachments?.filter(a => a.category === 'additional').map(att => {
                  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
                  const downloadUrl = `${backendBase}/storage/${att.file_path}`;
                  return (
                    <div key={att.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-[10px] flex items-center justify-center uppercase flex-shrink-0">
                          {att.extension || 'file'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy-dark truncate">{att.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                        </div>
                      </div>
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={att.file_name}
                        className="px-3 py-1.5 bg-white hover:bg-navy hover:text-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors flex-shrink-0"
                      >
                        <Icon name="download" size={13} />
                        <span>Unduh</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback Legacy: Soal & Template PDF from Admin if available and no attachments array */}
      {!hasAttachments && soalPdfUrl && (
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

      {/* ─── PDF Preview Modal if student opens direct preview ─── */}
      {viewingPdfUrl && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadein"
            onClick={() => setViewingPdfUrl(null)}
          >
            <div 
              className="bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-fadeup"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900 text-white flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sky-400"><Icon name="book-1" size={18} /></span>
                  <span className="font-bold text-sm truncate">{viewingPdfTitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPdfUrl(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1.5"
                >
                  <Icon name="xmark" size={15} /> Tutup
                </button>
              </div>

              {/* PDF Viewer Body */}
              <div className="flex-1 min-h-0 overflow-hidden p-2 bg-slate-900/50">
                <AestheticPdfReader
                  url={viewingPdfUrl}
                  title={viewingPdfTitle}
                  allowDownload={true}
                  height="100%"
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Form Pengumpulan Jawaban */}
      <form onSubmit={handleSubmit} className="card flex flex-col gap-5 border border-slate-200 shadow-sm">
        <div>
          <h4 className="font-bold text-navy-dark text-base">
            <Icon name="upload-1" size={16} className="mr-1.5" />
            {isCriticalThinking ? 'Formulir Pengumpulan Jawaban Critical Thinking' : 'Formulir Pengumpulan Jawaban'}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCriticalThinking
              ? 'Unggah berkas dokumen jawaban Anda (PDF / DOCX) sesuai format APA Style (500–1.500 kata, Times New Roman 12pt, Double-Spaced) atau lampirkan tautan berkas cloud.'
              : 'Anda dapat mengunggah berkas dokumen (PDF/DOCX), melampirkan tautan drive, dan/atau menulis esai langsung.'}
          </p>
        </div>

        {/* Opsi 1: Upload File Langsung */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
            <span><Icon name="file-multiple" size={18} /></span> Opsi 1: Upload Berkas Dokumen Jawaban (PDF / DOCX)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 cursor-pointer border border-slate-200 rounded-xl p-2 bg-white"
          />
          {selectedFile && (
            <p className="text-xs text-emerald-600 font-semibold">
              <Icon name="check-circle-1" size={16} className="mr-1.5" />Berkas dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Opsi 2: Link File Share */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
            <span><Icon name="paperclip-1" size={18} /></span> Opsi 2: Tautan Berkas Cloud (Google Drive / OneDrive)
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
              <span><Icon name="pencil-1" size={18} /></span> Opsi 3: Ketik Jawaban Esai Langsung (Mendukung Format Teks / Markdown)
            </label>
            <div className="flex gap-2 text-[11px] text-slate-400 font-mono">
              <span>{essay.length} karakter</span>
              <span>•</span>
              <span className="font-semibold text-navy">{essay.split(/\s+/).filter(Boolean).length} kata</span>
              {isCriticalThinking && (
                <span className="text-[10px] text-slate-400 italic">(Target: 500–1.500 kata)</span>
              )}
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
            <>
              <Icon name="upload-1" size={16} className="mr-1.5" />
              {isCriticalThinking ? 'Kumpulkan Jawaban Critical Thinking' : 'Kumpulkan Jawaban Studi Kasus'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── 5. Field Study Task ──────────────────────────────────────────────────────
function FieldStudyTask({ content, course, enrollment, enrollmentId, submission, onDone, onEnrollmentUpdate }: {
  content: Content;
  course?: CourseData;
  enrollment: EnrollInfo;
  enrollmentId: number;
  submission: Submission | null;
  onDone: (sub: Submission) => void;
  onEnrollmentUpdate: (e: EnrollInfo) => void;
}) {
  const [saving, setSaving] = useState(false);
  const isConfirmed = enrollment.attended_field_trip;
  const hasSubmission = submission !== null;

  // Cek apakah kursus adalah Foundation Level
  const isFoundation =
    course?.title?.toLowerCase().includes('foundation') ||
    course?.slug?.toLowerCase().includes('foundation') ||
    (course as any)?.certification_level?.code === 'FND';
  const isSpecialization = !isFoundation;

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
        showError('Gagal!', msg ?? 'Gagal menyimpan konfirmasi.');
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
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6">
            <MarkdownViewer content={content.instruction_text} />
          </div>
        )}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-5xl">
            <Icon name="water-drop-1" size={48} className="text-emerald-600" />
          </div>
          <div>
            {isSpecialization && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider block w-fit mx-auto mb-2">
                Kehadiran Divalidasi
              </span>
            )}
            <h3 className="text-xl font-extrabold text-emerald-700">Kehadiran Terkonfirmasi!</h3>
            <p className="text-emerald-600 text-sm mt-1">Kehadiran Field Study kamu sudah dikonfirmasi oleh admin.</p>
          </div>
          {isFoundation && (
            <div className="bg-emerald-100 rounded-xl px-5 py-3 text-emerald-700 text-sm">
              <Icon name="check-circle-1" size={16} className="mr-1.5" />Modul <strong>Case-Study Essay Examination — Critical Thinking</strong> telah terkunci secara otomatis
            </div>
          )}

          {/* Sertifikat 2 lembar HANYA untuk Specialization Level */}
          {isSpecialization && (
            <div className="bg-white/80 border border-emerald-200 rounded-2xl p-4 max-w-md w-full text-left shadow-2xs space-y-2 mt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Icon name="certificate-badge-1" size={16} className="text-emerald-600" />
                <span>Sertifikat yang Akan Diterbitkan:</span>
              </div>
              <ul className="text-xs text-emerald-800 space-y-1.5 pl-6 list-disc">
                <li><strong>Sertifikat CBEc Specialization</strong> (Sertifikasi Kompetensi Utama)</li>
                <li><strong>Sertifikat Field Study Specialization</strong> (Praktikum Lapangan 1.5 ECTS)</li>
              </ul>
            </div>
          )}
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
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6">
            <MarkdownViewer content={content.instruction_text} />
          </div>
        )}
        <div className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-4 text-center ${attending ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-5xl">
            <Icon name={attending ? (isSpecialization ? "water-drop-1" : "hand-stop") : "pen-to-square"} size={48} className={attending ? 'text-emerald-600' : 'text-slate-500'} />
          </div>
          <div>
            <h3 className={`text-lg font-extrabold ${attending ? 'text-emerald-700' : 'text-slate-600'}`}>
              {attending
                ? (isSpecialization ? 'Kamu memilih: Mengikuti Field Study Specialization' : 'Kamu memilih: Mengikuti Field Study')
                : 'Kamu memilih: Tidak Mengikuti Field Study'}
            </h3>
            <p className={`text-sm mt-1 ${attending ? 'text-emerald-600' : 'text-slate-500'}`}>
              {attending
                ? (isSpecialization
                  ? 'Menunggu verifikasi kehadiran oleh admin di lokasi. Jika tuntas, kamu berhak atas 2 Sertifikat: CBEc Specialization + Field Study Specialization.'
                  : 'Menunggu konfirmasi kehadiran dari admin.')
                : (isSpecialization
                  ? 'Kamu memilih untuk tidak mengikuti Field Study Specialization (hanya mendapatkan Sertifikat CBEc Specialization).'
                  : 'Kamu perlu mengerjakan modul Critical Thinking sebagai pengganti Field Study.')}
            </p>
          </div>

          {/* Rincian Sertifikat khusus Specialization */}
          {isSpecialization && (
            <div className="bg-white/90 border border-slate-200 rounded-xl p-3.5 max-w-md w-full text-left text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Icon name="shield-2-check" size={15} className={attending ? 'text-emerald-600' : 'text-navy'} />
                <span>Status Sertifikat Kelulusan:</span>
              </div>
              {attending ? (
                <p className="text-emerald-800 pl-6 leading-relaxed">
                  🎓 <strong>2 Sertifikat:</strong> Sertifikat CBEc Specialization + Sertifikat Field Study Specialization (setelah diverifikasi admin).
                </p>
              ) : (
                <p className="text-slate-600 pl-6 leading-relaxed">
                  📄 <strong>1 Sertifikat:</strong> Hanya Sertifikat CBEc Specialization (tanpa sertifikat Field Study).
                </p>
              )}
            </div>
          )}

          {attending && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm flex items-center gap-2">
              <span className="animate-pulse"><Icon name="hourglass" size={18} /></span> Admin akan memverifikasi kehadiran kamu
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: show confirmation form
  // Khusus Foundation: Tampilan Form Bersih Asli
  if (isFoundation) {
    return (
      <div className="flex flex-col gap-5">
        {content.instruction_text && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6">
            <MarkdownViewer content={content.instruction_text} />
          </div>
        )}

        <div className="card flex flex-col gap-6">
          <div className="text-center">
            <div className="text-5xl mb-3"><Icon name="water-drop-1" size={48} /></div>
            <h3 className="text-xl font-extrabold text-navy-dark">Apakah kamu mengikuti Field Study?</h3>
            <p className="text-slate-500 text-sm mt-2">
              Konfirmasi kehadiranmu. Pilihanmu akan menentukan modul apa yang perlu dikerjakan selanjutnya.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleConfirm(true)}
              disabled={saving}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-3xl transition-colors">
                <Icon name="hand-stop" size={16} />
              </div>
              <div>
                <p className="font-bold text-emerald-700">Ya, Saya Mengikuti</p>
                <p className="text-xs text-slate-500 mt-1">Modul Critical Thinking akan terkunci</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleConfirm(false)}
              disabled={saving}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-center cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-3xl transition-colors">
                <Icon name="pen-to-square" size={16} />
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Menyimpan konfirmasi...</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
            <p className="font-semibold mb-1"><Icon name="info" size={16} className="mr-1.5" />Perhatian:</p>
            <p>Pilihanmu dapat berubah jika admin mengkonfirmasi kehadiran secara langsung. Hubungi panitia jika ada perubahan status.</p>
          </div>
        </div>
      </div>
    );
  }

  // Khusus Specialization: Tampilan dengan Ketentuan 2 Sertifikat
  return (
    <div className="flex flex-col gap-5">
      {content.instruction_text && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6">
          <MarkdownViewer content={content.instruction_text} />
        </div>
      )}

      <div className="card flex flex-col gap-6 p-6 sm:p-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Icon name="water-drop-1" size={36} />
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200/60">
            Section Field Study Specialization
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-navy-dark mt-2.5">
            Apakah kamu mengikuti Field Study?
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Konfirmasikan keikutsertaanmu. Pilihan ini menentukan jumlah sertifikat resmi yang akan kamu peroleh setelah menyelesaikan kursus ini.
          </p>
        </div>

        {/* Comparison Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 space-y-1">
            <strong className="block font-bold text-emerald-800">Jika Mengikuti Field Study:</strong>
            <p className="text-emerald-700 leading-relaxed">
              Mendapatkan <strong>2 Sertifikat</strong> (CBEc Specialization + Field Study Specialization). Kehadiran akan divalidasi oleh panitia/asesor.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
            <strong className="block font-bold text-slate-800">Jika Tidak Mengikuti:</strong>
            <p className="text-slate-600 leading-relaxed">
              Hanya mendapatkan <strong>1 Sertifikat</strong> (CBEc Specialization) dan tidak mendapatkan sertifikat Field Study Specialization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Yes: Attend Field Study */}
          <button
            type="button"
            onClick={() => handleConfirm(true)}
            disabled={saving}
            className="group flex flex-col items-center gap-3.5 p-6 rounded-2xl border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/70 hover:shadow-md transition-all text-center cursor-pointer relative"
          >
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Mendapatkan 2 Sertifikat
            </span>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center text-3xl transition-colors shadow-2xs">
              <Icon name="hand-stop" size={26} />
            </div>
            <div>
              <p className="font-extrabold text-base text-emerald-800">Ya, Saya Mengikuti</p>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Mendapatkan Sertifikat CBEc + Field Study Specialization (1.5 ECTS) setelah diverifikasi admin.
              </p>
            </div>
          </button>

          {/* No: Don't attend Field Study */}
          <button
            type="button"
            onClick={() => handleConfirm(false)}
            disabled={saving}
            className="group flex flex-col items-center gap-3.5 p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md transition-all text-center cursor-pointer relative"
          >
            <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Mendapatkan 1 Sertifikat
            </span>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-slate-200 text-slate-700 flex items-center justify-center text-3xl transition-colors shadow-2xs">
              <Icon name="pen-to-square" size={26} />
            </div>
            <div>
              <p className="font-extrabold text-base text-slate-800">Tidak, Saya Tidak Ikut</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hanya mendapatkan Sertifikat CBEc Specialization (tanpa sertifikat Field Study Specialization).
              </p>
            </div>
          </button>
        </div>

        {saving && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Menyimpan konfirmasi...
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
          <p className="font-semibold mb-1"><Icon name="info" size={16} className="mr-1.5" />Perhatian:</p>
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
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfTitle, setViewingPdfTitle] = useState<string>('');

  useEffect(() => {
    if (viewingPdfUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingPdfUrl]);
  const alreadySubmitted = submission !== null;

  const hasAttachments = (content.attachments?.length ?? 0) > 0;
  const soalPdfUrl = content.file_path
    ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')}/storage/${content.file_path}`
    : null;

  const getEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    const gdMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
    if (gdMatch) return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    return null;
  };

  const previewEmbed = getEmbedUrl(videoUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      showWarning('Link Kosong', 'Tautan (URL) video wajib diisi.');
      return;
    }
    const isConfirmed = await showConfirm(
      'Kumpulkan Link Video Oral Exam?',
      'Pastikan video sudah dapat diakses (Anyone with the link / Unlisted) agar asesor dapat menilai rekaman presentasimu.',
      'Ya, Kumpulkan Video'
    );
    if (!isConfirmed) return;

    setSubmitting(true);
    try {
      await api.post('/submissions', {
        enrollment_id: enrollmentId,
        content_id: content.id,
        video_url: videoUrl.trim(),
        essay_text: notes.trim() || null,
      });
      showSuccess('Berhasil!', 'Tautan video oral exam berhasil dikumpulkan.');
      onDone({
        content_id: content.id,
        score: null,
        assessor_feedback: null,
        graded_at: null,
        status: 'submitted',
        video_url: videoUrl.trim(),
        essay_text: notes.trim() || null,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg ?? 'Gagal mengumpulkan tugas video.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Highlights Ketentuan Oral Exam ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Icon name="camera-movie-1" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Durasi Video</p>
            <p className="text-xs font-extrabold text-navy-dark">3 – 5 Menit</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon name="flag-1" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Bahasa Presentasi</p>
            <p className="text-xs font-extrabold text-navy-dark">Indonesia / English</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Icon name="link-2-angular-right" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Metode Pengumpulan</p>
            <p className="text-xs font-extrabold text-navy-dark">Link GDrive / YouTube</p>
          </div>
        </div>
      </div>

      {/* ─── Berkas Lampiran Soal Kasus & Dokumen Acuan (Jika Ada) ─── */}
      {(hasAttachments || soalPdfUrl) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs">
              <Icon name="folder-open" size={14} />
            </span>
            <h3 className="text-sm font-bold text-navy-dark">Berkas Soal & Dokumen Panduan Oral Exam</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Naskah Soal */}
            {(() => {
              const att = content.attachments?.find(a => a.category === 'case_study_brief');
              if (!att) return null;
              const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
              const downloadUrl = `${backendBase}/storage/${att.file_path}`;
              const isPdf = att.extension?.toLowerCase() === 'pdf' || att.file_name.toLowerCase().endsWith('.pdf');
              return (
                <div className="bg-white border-2 border-teal-100 hover:border-teal-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      Naskah Soal Kasus
                    </span>
                    <h4 className="font-bold text-navy-dark text-sm line-clamp-1">{att.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.file_name}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Icon name="download" size={14} />
                      <span>Unduh Soal</span>
                    </a>
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => { setViewingPdfUrl(downloadUrl); setViewingPdfTitle(att.title); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors"
                        title="Baca langsung di layar"
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. Template Lembar Jawaban */}
            {(() => {
              const att = content.attachments?.find(a => a.category === 'template');
              if (!att) return null;
              const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
              const downloadUrl = `${backendBase}/storage/${att.file_path}`;
              const isWord = att.extension?.toLowerCase().includes('doc');
              return (
                <div className="bg-white border-2 border-blue-100 hover:border-blue-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      Template Lembar Kerja
                    </span>
                    <h4 className="font-bold text-navy-dark text-sm line-clamp-1">{att.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.file_name}
                      className="w-full py-2 bg-navy hover:bg-navy-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Icon name="download" size={14} />
                      <span>Unduh Template {isWord ? '(.docx)' : ''}</span>
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* 3. Contoh Pengisian / Rubrik Acuan */}
            {(() => {
              const att = content.attachments?.find(a => a.category === 'example_guide');
              if (!att) return null;
              const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
              const downloadUrl = `${backendBase}/storage/${att.file_path}`;
              const isPdf = att.extension?.toLowerCase() === 'pdf' || att.file_name.toLowerCase().endsWith('.pdf');
              return (
                <div className="bg-white border-2 border-amber-100 hover:border-amber-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      Contoh Acuan Pengerjaan
                    </span>
                    <h4 className="font-bold text-navy-dark text-sm line-clamp-1">{att.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={att.file_name}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Icon name="download" size={14} />
                      <span>Unduh Acuan</span>
                    </a>
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => { setViewingPdfUrl(downloadUrl); setViewingPdfTitle(att.title); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors"
                        title="Baca langsung di layar"
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Dokumen Tambahan */}
          {(content.attachments?.filter(a => a.category === 'additional').length ?? 0) > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="paperclip-1" size={14} />
                Dokumen Pendukung Tambahan ({content.attachments?.filter(a => a.category === 'additional').length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {content.attachments?.filter(a => a.category === 'additional').map(att => {
                  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
                  const downloadUrl = `${backendBase}/storage/${att.file_path}`;
                  return (
                    <div key={att.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-[10px] flex items-center justify-center uppercase shrink-0">
                          {att.extension || 'file'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy-dark truncate">{att.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                        </div>
                      </div>
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={att.file_name}
                        className="px-3 py-1.5 bg-white hover:bg-navy hover:text-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors shrink-0"
                      >
                        <Icon name="download" size={13} />
                        <span>Unduh</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PDF Preview Modal ─── */}
      {viewingPdfUrl && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadein"
            onClick={() => setViewingPdfUrl(null)}
          >
            <div 
              className="bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-fadeup"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900 text-white flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sky-400"><Icon name="book-1" size={18} /></span>
                  <span className="font-bold text-sm truncate">{viewingPdfTitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPdfUrl(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1.5"
                >
                  <Icon name="xmark" size={15} /> Tutup
                </button>
              </div>

              {/* PDF Viewer Body */}
              <div className="flex-1 min-h-0 overflow-hidden p-2 bg-slate-900/50">
                <AestheticPdfReader
                  url={viewingPdfUrl}
                  title={viewingPdfTitle}
                  allowDownload={true}
                  height="100%"
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── Panduan & Deskripsi Soal (Markdown) ─── */}
      {content.instruction_text && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icon name="camera-movie-1" size={16} />
            </span>
            <h3 className="font-extrabold text-navy-dark text-base">
              Naskah Soal & Petunjuk Pengerjaan Oral Exam
            </h3>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
            <MarkdownViewer content={content.instruction_text} />
          </div>
        </div>
      )}

      {/* ─── Status Sudah Dikumpulkan ─── */}
      {alreadySubmitted ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                <Icon name="check-circle-1" size={22} />
              </span>
              <div>
                <h4 className="font-extrabold text-navy-dark text-base">Tautan Video Telah Berhasil Dikumpulkan</h4>
                <p className="text-xs text-slate-400 mt-0.5">Asesor akan memutar dan mengevaluasi hasil rekaman presentasimu.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Terkumpul
            </span>
          </div>

          {/* Embedded Video Player */}
          {getEmbedUrl(submission.video_url) ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black/5 shadow-sm max-w-3xl">
              <iframe
                src={getEmbedUrl(submission.video_url)!}
                title="Oral Exam Submission Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="link-2-angular-right" size={16} className="text-slate-500 shrink-0" />
                <span className="text-xs text-navy-dark font-mono truncate">{submission.video_url}</span>
              </div>
            </div>
          )}

          {submission.video_url && (
            <div>
              <a
                href={submission.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-navy hover:text-white rounded-xl text-xs font-bold text-navy-dark transition-all shadow-xs"
              >
                <Icon name="camera-movie-1" size={15} />
                <span>Buka Tautan Video Eksternal</span>
                <Icon name="arrow-right" size={13} className="ml-0.5" />
              </a>
            </div>
          )}

          {submission.essay_text && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700">
              <span className="font-bold text-navy-dark block mb-1">Catatan Tambahan untuk Asesor:</span>
              <p className="leading-relaxed">{submission.essay_text}</p>
            </div>
          )}

          {submission.score === null ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 font-medium">
              <span className="animate-pulse"><Icon name="hourglass" size={18} /></span>
              <span>Tugasmu sedang dalam antrean review oleh Tim Asesor DigiBlueCamp. Nilai akan muncul otomatis setelah penilaian selesai.</span>
            </div>
          ) : (
            <GradedBanner submission={submission} content={content} />
          )}
        </div>
      ) : (
        /* ─── Form Pengumpulan Tautan Video (Hanya Link) ─── */
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          <div>
            <h4 className="font-extrabold text-navy-dark text-base flex items-center gap-2">
              <Icon name="upload-1" size={18} className="text-navy" />
              <span>Formulir Pengumpulan Video Oral Exam</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Kumpulkan rekaman video presentasimu dalam bentuk <strong>link</strong> (Google Drive atau YouTube) sesuai petunjuk di atas.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
              <Icon name="link-2-angular-right" size={15} className="text-rose-600" />
              <span>Tautan / Link Video (Google Drive atau YouTube)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Contoh: https://drive.google.com/file/d/... atau https://youtu.be/..."
              className="form-input text-xs sm:text-sm font-mono py-2.5"
            />
            <p className="text-[11px] text-slate-400">
              💡 <em>Tips: Jika mengunggah ke Google Drive, pastikan izin tautan disetel ke <strong>&quot;Anyone with the link can view&quot;</strong> agar tim asesor dapat menonton dan menilai rekamanmu.</em>
            </p>

            {/* Live Preview Embed Player */}
            {previewEmbed && (
              <div className="mt-3">
                <p className="text-[11px] font-bold text-navy-dark mb-1.5 flex items-center gap-1">
                  <Icon name="check-circle-1" size={13} className="text-emerald-600" />
                  Pratinjau Video Terdeteksi:
                </p>
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black/5 shadow-inner max-w-xl">
                  <iframe
                    src={previewEmbed}
                    title="Live Preview Video"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
              <Icon name="pen-to-square" size={15} className="text-slate-400" />
              <span>Catatan untuk Asesor <span className="font-normal text-slate-400">(Opsional)</span></span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tambahkan ringkasan pokok presentasi, poin penting, atau catatan lain jika diperlukan..."
              className="form-input text-xs leading-relaxed resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg flex items-center justify-center gap-2 shadow-md shadow-navy/20 self-start sm:w-auto w-full"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Mengumpulkan Link Video...</span>
              </>
            ) : (
              <>
                <Icon name="camera-movie-1" size={16} />
                <span>Kumpulkan Video Oral Exam</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

