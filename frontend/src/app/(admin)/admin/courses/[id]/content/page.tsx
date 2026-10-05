'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback, useRef } from 'react';
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
interface QuizOption   { id: number; option_text: string; is_correct: boolean }
interface QuizQuestion { id: number; question_text: string; weight_score: number; options: QuizOption[] }
interface Content {
  id: number;
  content_type: string;
  title: string;
  file_path: string | null;
  embed_url: string | null;
  instruction_text: string | null;
  content_body?: string | null;
  max_score: number;
  order_index: number;
  quiz_questions?: QuizQuestion[];
}
interface Section { id: number; title: string; order_index: number; contents: Content[] }
interface CourseDetail {
  id: number; title: string; slug: string;
  sections: Section[];
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  pdf_module:       { icon: 'file-multiple', label: 'Learning Module',              color: 'blue' },
  video_embed:      { icon: 'camera-movie-1', label: 'Video Lecture',                color: 'purple' },
  mcq_quiz:         { icon: 'pen-to-square', label: 'Multiple-Choice Examination',  color: 'amber' },
  essay_task:       { icon: 'pencil-1', label: 'Case-Study Essay Submission',  color: 'teal' },
  oral_video_task:  { icon: 'camera-movie-1', label: 'Oral Video Exam',              color: 'rose' },
  critical_thinking:{ icon: 'bulb-2', label: 'Critical Thinking Exam',       color: 'indigo' },
  field_study:      { icon: 'water-drop-1', label: 'Training Course (Field Study)', color: 'emerald' },
};

export default function AdminCourseContentPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse]     = useState<CourseDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'quiz'>('overview');

  // Content being managed
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // PDF Upload & Preview
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl]     = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  // Edit instruction text
  const [editInstruction, setEditInstruction] = useState('');
  const [editContentBody, setEditContentBody] = useState('');
  const [bodyTab, setBodyTab] = useState<'editor' | 'preview'>('editor');
  const [editEmbedUrl, setEditEmbedUrl]       = useState('');
  const [instructionTab, setInstructionTab]   = useState<'editor' | 'preview'>('editor');
  const [savingContent, setSavingContent]     = useState(false);

  // References and helper for smart markdown formatting (wrap selected text or insert at cursor)
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const instructionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (
    target: 'body' | 'instruction',
    prefix: string,
    suffix: string = '',
    defaultText: string = ''
  ) => {
    const isBody = target === 'body';
    const textarea = isBody ? bodyTextareaRef.current : instructionTextareaRef.current;
    const currentVal = isBody ? editContentBody : editInstruction;
    const setter = isBody ? setEditContentBody : setEditInstruction;

    if (!textarea) {
      setter(prev => (prev ? `${prev}\n${prefix}${defaultText}${suffix}` : `${prefix}${defaultText}${suffix}`));
      return;
    }

    // Preserve scroll positions
    const savedScrollTop = textarea.scrollTop;
    const savedWindowY = typeof window !== 'undefined' ? window.scrollY : 0;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = currentVal.substring(start, end);
    const textToInsert = selectedText || defaultText;
    const replacement = `${prefix}${textToInsert}${suffix}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setter(newVal);

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus({ preventScroll: true });
      const newStart = start + prefix.length;
      const newEnd = newStart + textToInsert.length;
      textarea.setSelectionRange(newStart, newEnd);
      textarea.scrollTop = savedScrollTop;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: savedWindowY, behavior: 'instant' as ScrollBehavior });
      }
    });
  };

  // ─── Image Insertion Modal (Upload Lokal & URL) ──────────────────────────
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalTarget, setImageModalTarget] = useState<'body' | 'instruction'>('body');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [imageAltText, setImageAltText] = useState('');
  const [webImageUrl, setWebImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const quickBodyImageRef = useRef<HTMLInputElement>(null);
  const quickInstructionImageRef = useRef<HTMLInputElement>(null);

  const openImageModal = (target: 'body' | 'instruction') => {
    setImageModalTarget(target);
    setImageModalOpen(true);
    setLocalImageFile(null);
    setLocalImagePreview(null);
    setImageAltText('');
    setWebImageUrl('');
    setImageTab('upload');
  };

  const handleSelectLocalImage = (file: File | null) => {
    if (!file) return;
    setLocalImageFile(file);
    const preview = URL.createObjectURL(file);
    setLocalImagePreview(preview);
    if (!imageAltText) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setImageAltText(nameWithoutExt);
    }
  };

  const handleInsertImage = async () => {
    if (imageTab === 'upload') {
      if (!localImageFile) {
        alert('Pilih file gambar dari komputer terlebih dahulu.');
        return;
      }
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', localImageFile);
      try {
        const res = await api.post('/admin/contents/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
          .replace(/\/api\/v1\/?$/, '')
          .replace(/\/api\/?$/, '');
        const fullImgUrl = res.data.file_path ? `${backendBase}/storage/${res.data.file_path}` : res.data.url;
        const alt = imageAltText.trim() || 'Ilustrasi Modul';
        insertMarkdown(imageModalTarget, `\n![${alt}](${fullImgUrl})\n`, '', '');
        setImageModalOpen(false);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        alert(msg ?? 'Gagal mengupload gambar.');
      } finally {
        setUploadingImage(false);
      }
    } else {
      if (!webImageUrl.trim()) {
        alert('Masukkan URL gambar terlebih dahulu.');
        return;
      }
      const alt = imageAltText.trim() || 'Ilustrasi Modul';
      insertMarkdown(imageModalTarget, `\n![${alt}](${webImageUrl.trim()})\n`, '', '');
      setImageModalOpen(false);
    }
  };

  const handleQuickImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, target: 'body' | 'instruction') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/admin/contents/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
        .replace(/\/api\/v1\/?$/, '')
        .replace(/\/api\/?$/, '');
      const fullImgUrl = res.data.file_path ? `${backendBase}/storage/${res.data.file_path}` : res.data.url;
      const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      insertMarkdown(target, `\n![${alt}](${fullImgUrl})\n`, '', '');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengupload gambar.');
    } finally {
      e.target.value = '';
    }
  };

  // Quiz Questions
  const [questions, setQuestions]     = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showAddQuestion, setShowAddQ]= useState(false);
  const [editingQuestion, setEditingQ]= useState<QuizQuestion | null>(null);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/courses/${courseId}`);
      setCourse(res.data.data);
    } catch {
      alert('Gagal memuat kursus.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const loadQuizQuestions = async (contentId: number) => {
    setQuizLoading(true);
    try {
      const res = await api.get(`/admin/contents/${contentId}/questions`);
      setQuestions(res.data.data ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const selectContent = (content: Content) => {
    setSelectedContent(content);
    setEditInstruction(content.instruction_text ?? '');
    setEditContentBody(content.content_body ?? '');
    setEditEmbedUrl(content.embed_url ?? '');
    setUploadFile(null);
    setShowAddQ(false);
    setEditingQ(null);
    if (content.content_type === 'mcq_quiz') {
      setActiveTab('quiz');
      loadQuizQuestions(content.id);
    } else {
      setActiveTab('content');
    }
  };

  const handleUploadPDF = async () => {
    if (!uploadFile || !selectedContent) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      await api.post(`/admin/contents/${selectedContent.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('PDF berhasil diupload!');
      setUploadFile(null);
      fetchCourse();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal upload PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!selectedContent) return;
    setSavingContent(true);
    try {
      await api.patch(`/admin/contents/${selectedContent.id}`, {
        instruction_text: editInstruction || null,
        content_body: editContentBody || null,
        embed_url: editEmbedUrl || null,
      });
      alert('Konten berhasil disimpan!');
      fetchCourse();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal menyimpan konten.');
    } finally {
      setSavingContent(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
      <svg className="animate-spin h-6 w-6 text-navy" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Memuat kursus...
    </div>
  );

  if (!course) return <div className="text-center py-20 text-slate-400">Kursus tidak ditemukan.</div>;

  return (
    <div className="animate-fadeup">
      {/* Back Button + Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/admin/courses')}
          className="text-sm text-slate-500 hover:text-navy flex items-center gap-1 mb-3">
          <Icon name="arrow-left" size={16} className="mr-1.5" />Kembali ke Daftar Kursus
        </button>
        <h1 className="text-2xl font-extrabold text-navy-dark">{course.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola konten & soal ujian kursus ini</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar: Section & Content List */}
        <aside className="w-72 flex-shrink-0 self-start">
          <div className="card p-0 overflow-hidden sticky top-6">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Konten</p>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              {course.sections.map(section => (
                <div key={section.id}>
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</p>
                  </div>
                  {section.contents.map(content => {
                    const meta = TYPE_META[content.content_type] ?? { icon: 'flag-1', label: content.content_type };
                    const isSelected = selectedContent?.id === content.id;
                    return (
                      <button key={content.id}
                        onClick={() => selectContent(content)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm border-b border-slate-100 transition-colors
                          ${isSelected ? 'bg-navy text-white' : 'hover:bg-slate-50 text-navy-dark'}`}>
                        <Icon name={meta.icon} size={16} />
                        <span className={`flex-1 text-xs leading-snug ${isSelected ? 'font-semibold' : ''}`}>
                          {content.title}
                        </span>
                        {(content.content_body || content.file_path) && (
                          <span className="text-xs opacity-70" title="Materi sudah terisi"><Icon name="check-circle-1" size={12} /></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="flex-1 min-w-0">
          {!selectedContent ? (
            <div className="card text-center py-20 text-slate-400">
              <div className="text-5xl mb-3"><Icon name="arrow-left" size={48} /></div>
              <p>Pilih konten dari daftar di sebelah kiri</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Content Header */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      <Icon name={TYPE_META[selectedContent.content_type]?.icon ?? "flag-1"} size={16} className="mr-1.5" />{TYPE_META[selectedContent.content_type]?.label ?? selectedContent.content_type}
                    </span>
                    <h2 className="text-lg font-extrabold text-navy-dark mt-2">{selectedContent.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    {selectedContent.content_type !== 'mcq_quiz' && (
                      <button onClick={() => setActiveTab('content')}
                        className={`btn btn-sm ${activeTab === 'content' ? 'btn-primary' : 'btn-secondary'}`}>
                        <Icon name="pencil-1" size={16} className="mr-1.5" />Edit Konten
                      </button>
                    )}
                    {selectedContent.content_type === 'mcq_quiz' && (
                      <button onClick={() => setActiveTab('quiz')}
                        className={`btn btn-sm ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}>
                        <Icon name="pen-to-square" size={16} className="mr-1.5" />Kelola Soal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="card flex flex-col gap-5">
                  <h3 className="font-bold text-navy-dark"><Icon name="pencil-1" size={16} className="mr-1.5" />Edit Konten</h3>

                  {/* Web-based Course Learning Material Editor (Materi Website Interaktif) */}
                  {selectedContent.content_type === 'pdf_module' && (
                    <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-6 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center text-xs">
                              <Icon name="book-1" size={16} />
                            </span>
                            <h4 className="font-extrabold text-navy-dark text-base">
                              Materi Kursus Langsung di Website (Online Learning)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Tulis materi pembelajaran di sini seperti kursus online modern. Peserta dapat langsung membaca artikel dan modul interaktif tanpa perlu download file PDF.
                          </p>
                        </div>
                        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-sm">
                          <button
                            type="button"
                            onClick={() => setBodyTab('editor')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${bodyTab === 'editor' ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                          >
                            <Icon name="pencil-1" size={14} />
                            Editor Teks
                          </button>
                          <button
                            type="button"
                            onClick={() => setBodyTab('preview')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${bodyTab === 'preview' ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                          >
                            <Icon name="eye" size={14} />
                            Pratinjau Website
                          </button>
                        </div>
                      </div>

                      {/* Quick Markdown Formatting Helper Toolbar */}
                      {bodyTab === 'editor' && (
                        <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 text-xs shadow-sm">
                          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Format:</span>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n# ', '\n', 'Judul Bab')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title="Heading 1 (# Judul)"
                          >
                            H1
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n## ', '\n', 'Sub Judul')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title="Heading 2 (## Sub Judul)"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n### ', '\n', 'Bagian Materi')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title="Heading 3 (### Bagian Materi)"
                          >
                            H3
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '**', '**', 'teks tebal')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title="Bold (**teks tebal**)"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '*', '*', 'teks miring')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 italic font-semibold transition-colors"
                            title="Italic (*teks miring*)"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n- ', '\n', 'Poin materi')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title="Bullet List (- Poin)"
                          >
                            • List
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n1. ', '\n', 'Langkah pertama')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title="Numbered List (1. Angka)"
                          >
                            1. Angka
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n> ', '\n', 'Kutipan penting atau catatan')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title="Quote Box (> Catatan)"
                          >
                            &ldquo; Quote
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n---\n', '', '')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title="Garis Pemisah (---)"
                          >
                            — Garis
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '[', '](https://example.com)', 'Teks Link')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium underline transition-colors"
                            title="Link Tautan [Teks](URL)"
                          >
                            Link
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openImageModal('body')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-md font-bold flex items-center gap-1 transition-colors"
                            title="Sisipkan Gambar (Upload dari Komputer / URL)"
                          >
                            <Icon name="camera-movie-1" size={12} />
                            Gambar
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => quickBodyImageRef.current?.click()}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-navy hover:text-white border border-blue-200 rounded-md text-navy font-bold flex items-center gap-1 transition-colors"
                            title="Upload Cepat Gambar dari Komputer Lokal"
                          >
                            <Icon name="upload-1" size={12} />
                            Upload Lokal
                          </button>
                          <input
                            type="file"
                            ref={quickBodyImageRef}
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleQuickImageSelect(e, 'body')}
                          />
                        </div>
                      )}

                      {bodyTab === 'editor' ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            ref={bodyTextareaRef}
                            rows={16}
                            value={editContentBody}
                            onChange={e => setEditContentBody(e.target.value)}
                            placeholder="Tuliskan materi pembelajaran lengkap di sini... (Mendukung format teks kaya Markdown: judul bab, paragraf penjelasan, gambar ilustrasi, daftar materi, dan catatan penting)"
                            className="form-input font-mono text-xs leading-relaxed resize-y bg-white border-slate-200 p-4"
                          />
                          <p className="text-[11px] text-slate-400">
                            Tips: Sorot teks mana pun lalu klik tombol format (seperti B, I, H1, Quote) untuk memformat kata tersebut, atau klik langsung untuk menyisipkan contoh di posisi kursor.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 min-h-[300px] max-h-[600px] overflow-y-auto shadow-inner">
                          {editContentBody ? (
                            <article className="prose max-w-none">
                              <MarkdownViewer content={editContentBody} />
                            </article>
                          ) : (
                            <div className="text-center py-16 text-slate-400">
                              <Icon name="book-1" size={32} className="mx-auto mb-2 opacity-40" />
                              <p className="text-sm font-semibold">Belum ada materi online yang ditulis.</p>
                              <p className="text-xs mt-1">Pilih tab &lsquo;Editor Teks&rsquo; untuk mulai mengetik materi modul.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Upload (Opsional / Dokumen Pelengkap atau untuk Tugas Esai) */}
                  {(selectedContent.content_type === 'pdf_module' ||
                    selectedContent.content_type === 'essay_task' ||
                    selectedContent.content_type === 'critical_thinking') && (
                    <details className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm group" open={!selectedContent.content_body && !!selectedContent.file_path}>
                      <summary className="font-semibold text-slate-700 cursor-pointer flex items-center justify-between list-none">
                        <span className="flex items-center gap-2">
                          <Icon name="file-multiple" size={16} className="text-navy" />
                          <span>
                            {selectedContent.content_type === 'pdf_module'
                              ? 'Lampiran File PDF (Opsional / Dokumen Tambahan)'
                              : 'Upload File Soal Studi Kasus (PDF)'}
                          </span>
                          {selectedContent.file_path && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              Ada Berkas PDF
                            </span>
                          )}
                        </span>
                        <Icon name="chevron-down" size={14} className="text-slate-400 transition-transform group-open:rotate-180" />
                      </summary>

                      <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-slate-200/60">
                        {selectedContent.content_type === 'pdf_module' && (
                          <p className="text-xs text-slate-500">
                            Jika Anda ingin melampirkan berkas PDF sebagai buku pedoman / slide presentasi tambahan yang dapat dilihat di reader.
                          </p>
                        )}
                        {selectedContent.file_path && (
                          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
                            <span><Icon name="check-circle-1" size={18} className="text-emerald-500" /></span>
                            <div className="flex-1 text-xs text-slate-600 truncate font-mono">File: {selectedContent.file_path}</div>
                            <button
                              type="button"
                              onClick={() => {
                                const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
                                  .replace(/\/api\/v1\/?$/, '')
                                  .replace(/\/api\/?$/, '');
                                const rawUrl = `${backendBase}/storage/${selectedContent.file_path}`;
                                setPreviewPdfUrl(rawUrl);
                                setPreviewPdfTitle(selectedContent.title);
                              }}
                              className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                            >
                              <Icon name="eye" size={16} className="mr-1.5" />Pratinjau di Reader
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input type="file" accept=".pdf"
                            onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                            className="text-sm text-slate-600 flex-1" />
                          <button onClick={handleUploadPDF}
                            disabled={!uploadFile || uploading}
                            className="btn btn-primary btn-sm">
                            {uploading ? 'Uploading...' : <><Icon name="upload-1" size={16} className="mr-1.5" />Upload PDF</>}
                          </button>
                        </div>
                        {uploadFile && (
                          <p className="text-xs text-slate-500">File dipilih: {uploadFile.name} ({(uploadFile.size/1024/1024).toFixed(2)} MB)</p>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Field Study: admin note */}
                  {selectedContent.content_type === 'field_study' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                      <p className="font-semibold text-emerald-800 text-sm mb-2"><Icon name="water-drop-1" size={16} className="mr-1.5" />Training Course (Field Study)</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Konten ini akan menampilkan formulir konfirmasi kepada user: apakah mereka mengikuti Field Study atau tidak.
                        Jika ya, modul Critical Thinking akan terkunci otomatis.
                        Verifikasi kehadiran user dilakukan oleh admin di panel manajemen enrollment.
                      </p>
                    </div>
                  )}

                  {/* Video URL (for video_embed) */}
                  {selectedContent.content_type === 'video_embed' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-navy-dark"><Icon name="camera-movie-1" size={16} className="mr-1.5" />URL Video (YouTube / Drive)</label>
                      <input type="url" value={editEmbedUrl} onChange={e => setEditEmbedUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="form-input" />
                    </div>
                  )}

                  {/* Instruction Text / Essay Markdown Prompt (for all types) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-bold text-navy-dark">
                          <Icon name="clipboard" size={16} className="mr-1.5" />{selectedContent.content_type === 'essay_task' || selectedContent.content_type === 'critical_thinking'
                            ? 'Naskah Soal & Panduan Esai (Mendukung Format Markdown)'
                            : 'Teks Instruksi / Petunjuk'}
                        </label>
                        <p className="text-xs text-slate-400 mt-0.5">Teks ini tampil sebagai panduan dan soal ujian esai bagi peserta.</p>
                      </div>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setInstructionTab('editor')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${instructionTab === 'editor' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                          <Icon name="pencil-1" size={16} className="mr-1.5" />Editor Markdown
                        </button>
                        <button type="button" onClick={() => setInstructionTab('preview')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${instructionTab === 'preview' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                          <Icon name="eye" size={16} className="mr-1.5" />Preview Tampilan
                        </button>
                      </div>
                    </div>

                    {instructionTab === 'editor' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Format:</span>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n# ', '\n', 'Judul Soal')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-bold transition-colors"
                            title="Heading 1"
                          >
                            H1
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n## ', '\n', 'Sub Judul')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-bold transition-colors"
                            title="Heading 2"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '**', '**', 'teks tebal')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-bold transition-colors"
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '*', '*', 'teks miring')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 italic font-semibold transition-colors"
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n- ', '\n', 'Poin instruksi')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-medium transition-colors"
                            title="Bullet List"
                          >
                            • List
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n1. ', '\n', 'Langkah pengerjaan')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-medium transition-colors"
                            title="Numbered List"
                          >
                            1. Angka
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n> ', '\n', 'Catatan penting')}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-medium transition-colors"
                            title="Quote Box"
                          >
                            &ldquo; Quote
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openImageModal('instruction')}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded font-bold flex items-center gap-1 transition-colors"
                            title="Sisipkan Gambar (Upload dari Komputer / URL)"
                          >
                            <Icon name="camera-movie-1" size={12} />
                            Gambar
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => quickInstructionImageRef.current?.click()}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-navy hover:text-white border border-blue-200 rounded text-navy font-bold flex items-center gap-1 transition-colors"
                            title="Upload Cepat Gambar Lokal"
                          >
                            <Icon name="upload-1" size={12} />
                            Upload Lokal
                          </button>
                          <input
                            type="file"
                            ref={quickInstructionImageRef}
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleQuickImageSelect(e, 'instruction')}
                          />
                        </div>

                      <textarea ref={instructionTextareaRef} rows={10} value={editInstruction} onChange={e => setEditInstruction(e.target.value)}
                        placeholder="Tulis naskah soal esai, latar belakang studi kasus, atau petunjuk tugas di sini (format Markdown didukung: # Judul, **tebal**, - daftar list)..."
                        className="form-input font-mono text-xs leading-relaxed resize-y" />
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[200px] max-h-[500px] overflow-y-auto">
                        {editInstruction ? (
                          <MarkdownViewer content={editInstruction} />
                        ) : (
                          <p className="text-xs text-slate-400 italic">Belum ada naskah instruksi atau soal esai yang ditulis.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button onClick={handleSaveContent} disabled={savingContent}
                    className="btn btn-primary self-start">
                    {savingContent ? 'Menyimpan...' : <><Icon name="floppy-disk-1" size={16} className="mr-1.5" />Simpan Perubahan</>}
                  </button>
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === 'quiz' && selectedContent.content_type === 'mcq_quiz' && (
                <QuizManager
                  contentId={selectedContent.id}
                  questions={questions}
                  loading={quizLoading}
                  onRefresh={() => loadQuizQuestions(selectedContent.id)}
                  showAdd={showAddQuestion}
                  setShowAdd={setShowAddQ}
                  editingQ={editingQuestion}
                  setEditingQ={setEditingQ}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── PDF Preview Modal ────────────────────────────────────────── */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadein">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900 text-white flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl"><Icon name="book-1" size={20} /></span>
                <span className="font-bold text-sm truncate">Pratinjau Reader Admin — {previewPdfTitle}</span>
              </div>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold"
              >
                <Icon name="xmark" size={16} className="mr-1.5" />Tutup
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <AestheticPdfReader
                url={previewPdfUrl}
                title={previewPdfTitle}
                allowDownload={true}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
      {/* ─── Image Insertion Modal (Upload Lokal & URL) ──────────────────── */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadein">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
                  <Icon name="camera-movie-1" size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy-dark text-base">Sisipkan Gambar Materi</h3>
                  <p className="text-xs text-slate-400">Pilih dari komputer lokal atau gunakan tautan URL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            {/* Source Tab Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  imageTab === 'upload' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
                }`}
              >
                <Icon name="upload-1" size={14} />
                Upload dari Komputer
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  imageTab === 'url' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
                }`}
              >
                <Icon name="link-2" size={14} />
                Tautan URL Gambar
              </button>
            </div>

            {/* Tab 1: Upload Lokal */}
            {imageTab === 'upload' ? (
              <div className="flex flex-col gap-3">
                <label className="border-2 border-dashed border-slate-200 hover:border-navy/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    onChange={e => handleSelectLocalImage(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {localImagePreview ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={localImagePreview}
                        alt="Pratinjau"
                        className="max-h-44 rounded-xl border border-slate-200 object-contain shadow-sm"
                      />
                      <span className="text-[11px] font-semibold text-navy hover:underline">
                        Ganti file gambar ({localImageFile?.name})
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-navy flex items-center justify-center text-xl">
                        <Icon name="cloud-upload" size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-navy-dark">Klik untuk pilih gambar dari komputer</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Format: PNG, JPG, WebP, GIF, SVG (Maks. 10MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            ) : (
              /* Tab 2: URL */
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">URL Gambar Internet</label>
                <input
                  type="url"
                  value={webImageUrl}
                  onChange={e => setWebImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau https://example.com/foto.jpg"
                  className="form-input text-xs"
                />
                <p className="text-[10px] text-slate-400">Masukkan tautan gambar langsung dari internet.</p>
              </div>
            )}

            {/* Caption / Alt Text Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy-dark">
                Deskripsi / Keterangan Gambar <span className="text-slate-400 font-normal">(Muncul di bawah gambar)</span>
              </label>
              <input
                type="text"
                value={imageAltText}
                onChange={e => setImageAltText(e.target.value)}
                placeholder="Contoh: Diagram Alur Logistik Pelabuhan Maritim"
                className="form-input text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="btn btn-secondary btn-sm text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={uploadingImage || (imageTab === 'upload' && !localImageFile) || (imageTab === 'url' && !webImageUrl.trim())}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
              >
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Mengupload Gambar...
                  </>
                ) : (
                  <>
                    <Icon name="check-circle-1" size={14} />
                    Sisipkan ke Editor
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

// ─── Quiz Manager ─────────────────────────────────────────────────────────────
function QuizManager({
  contentId, questions, loading, onRefresh,
  showAdd, setShowAdd, editingQ, setEditingQ
}: {
  contentId: number;
  questions: QuizQuestion[];
  loading: boolean;
  onRefresh: () => void;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  editingQ: QuizQuestion | null;
  setEditingQ: (q: QuizQuestion | null) => void;
}) {
  const [showImport, setShowImport] = useState(false);
  const totalWeight = questions.reduce((sum, q) => sum + (q.weight_score || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy-dark text-lg"><Icon name="pen-to-square" size={16} className="mr-1.5" />Manajemen Soal MCQ</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>{questions.length} butir soal terdaftar</span>
              <span>•</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                Total Bobot: {totalWeight}/100 poin {totalWeight === 100 ? <Icon name="check-circle-1" size={16} /> : <Icon name="info" size={16} />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button type="button" onClick={() => setShowImport(true)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
              <span><Icon name="download-1" size={18} /></span> Import Soal (PDF / Teks)
            </button>
            <button type="button" onClick={() => { setShowAdd(true); setEditingQ(null); }}
              className="btn btn-primary btn-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
              <span><Icon name="plus" size={18} /></span> Tambah Soal
            </button>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <ImportQuestionsModal
          contentId={contentId}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            onRefresh();
          }}
        />
      )}

      {/* Add/Edit Question Form */}
      {(showAdd || editingQ) && (
        <QuestionForm
          contentId={contentId}
          question={editingQ}
          onSave={() => { setShowAdd(false); setEditingQ(null); onRefresh(); }}
          onCancel={() => { setShowAdd(false); setEditingQ(null); }}
        />
      )}

      {/* Questions List */}
      {loading ? (
        <div className="card text-center py-10 text-slate-400">Memuat soal...</div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <div className="text-5xl mb-3"><Icon name="envelope-1" size={48} /></div>
          <p>Belum ada soal. Klik &quot;+ Tambah Soal&quot; untuk mulai.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q, qi) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={qi}
              onEdit={() => { setEditingQ(q); setShowAdd(false); }}
              onDelete={async () => {
                if (!confirm(`Hapus soal "${q.question_text.slice(0, 50)}..."?`)) return;
                try {
                  await api.delete(`/admin/questions/${q.id}`);
                  onRefresh();
                } catch (err: unknown) {
                  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                  alert(msg ?? 'Gagal menghapus soal.');
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onEdit, onDelete }: {
  question: QuizQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 flex-shrink-0 bg-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-navy-dark text-sm">{question.question_text}</p>
          <p className="text-xs text-slate-400 mt-0.5">Bobot: {question.weight_score} poin</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn btn-sm btn-secondary"><Icon name="pencil-1" size={16} className="mr-1.5" />Edit</button>
          <button onClick={onDelete} className="btn btn-sm text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-xl px-3 py-1.5">🗑️</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5 ml-11">
        {question.options.map(opt => (
          <div key={opt.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border
              ${opt.is_correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            {opt.is_correct ? <Icon name="check-circle-1" size={16} /> : <Icon name="minus-circle" size={16} />} {opt.option_text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Question Form ────────────────────────────────────────────────────────────
interface OptionForm { option_text: string; is_correct: boolean }

function QuestionForm({ contentId, question, onSave, onCancel }: {
  contentId: number;
  question: QuizQuestion | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [questionText, setQText] = useState(question?.question_text ?? '');
  const [weightScore, setWeight] = useState(String(question?.weight_score ?? 25));
  const [options, setOptions]    = useState<OptionForm[]>(
    question?.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct }))
    ?? [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const setCorrect = (idx: number) => {
    setOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })));
  };

  const updateOption = (idx: number, text: string) => {
    setOptions(prev => prev.map((o, i) => i === idx ? { ...o, option_text: text } : o));
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions(prev => [...prev, { option_text: '', is_correct: false }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(prev => {
      const next = prev.filter((_, i) => i !== idx);
      // Jika yang dihapus adalah jawaban benar, set index 0 sebagai benar
      const hasCorrect = next.some(o => o.is_correct);
      if (!hasCorrect) next[0].is_correct = true;
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!questionText.trim()) { setError('Teks soal wajib diisi.'); return; }
    if (options.some(o => !o.option_text.trim())) { setError('Semua opsi harus diisi.'); return; }
    const correctCount = options.filter(o => o.is_correct).length;
    if (correctCount !== 1) { setError('Pilih tepat 1 jawaban yang benar.'); return; }

    setSaving(true);
    const payload = {
      question_text: questionText,
      weight_score: Number(weightScore) || 25,
      options,
    };
    try {
      if (question) {
        await api.patch(`/admin/questions/${question.id}`, payload);
      } else {
        await api.post(`/admin/contents/${contentId}/questions`, payload);
      }
      onSave();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Gagal menyimpan soal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card border-2 border-navy/20 flex flex-col gap-5">
      <h3 className="font-bold text-navy-dark">{question ? <><Icon name="pencil-1" size={16} className="mr-1.5" />Edit Soal</> : <><Icon name="plus" size={16} className="mr-1.5" />Tambah Soal Baru</>}</h3>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl">{error}</div>}

      {/* Question Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">Teks Soal</label>
        <textarea rows={3} value={questionText} onChange={e => setQText(e.target.value)}
          placeholder="Tulis pertanyaan di sini..."
          className="form-input resize-none" />
      </div>

      {/* Weight Score */}
      <div className="flex flex-col gap-1.5 max-w-[200px]">
        <label className="text-sm font-bold text-navy-dark">Bobot Soal (poin)</label>
        <input type="number" value={weightScore} onChange={e => setWeight(e.target.value)}
          min={1} max={100} className="form-input" />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-navy-dark">Pilihan Jawaban</label>
          <button type="button" onClick={addOption} disabled={options.length >= 6}
            className="text-xs text-navy font-medium hover:underline disabled:text-slate-300">
            + Tambah Opsi
          </button>
        </div>
        <p className="text-xs text-slate-400 -mt-1">Klik radio button ⭕ untuk menandai jawaban yang benar</p>
        {options.map((opt, idx) => (
          <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
            ${opt.is_correct ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <button type="button" onClick={() => setCorrect(idx)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                ${opt.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}>
              {opt.is_correct && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </button>
            <input type="text" value={opt.option_text} onChange={e => updateOption(idx, e.target.value)}
              placeholder={`Opsi ${String.fromCharCode(65 + idx)}...`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-navy-dark placeholder-slate-400" />
            <button type="button" onClick={() => removeOption(idx)}
              className="text-slate-300 hover:text-red-500 transition-colors text-lg flex-shrink-0">
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Menyimpan...' : question ? <><Icon name="floppy-disk-1" size={16} className="mr-1.5" />Simpan Perubahan</> : <><Icon name="plus" size={16} className="mr-1.5" />Tambah Soal</>}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Batal
        </button>
      </div>
    </form>
  );
}

// ─── Import Questions Modal ───────────────────────────────────────────────────
function ImportQuestionsModal({
  contentId,
  onClose,
  onSuccess,
}: {
  contentId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setError('Pilih file (PDF / TXT / JSON) atau tempelkan teks naskah soal terlebih dahulu.');
      return;
    }

    setImporting(true);
    setError('');

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (rawText.trim()) {
      formData.append('raw_text', rawText.trim());
    }
    formData.append('replace_existing', replaceExisting ? '1' : '0');

    try {
      const res = await api.post(`/admin/contents/${contentId}/questions/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`${res.data.message ?? 'Soal berhasil diimpor!'}`);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Gagal mengimpor soal. Periksa format teks/dokumen.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
              <span><Icon name="download-1" size={18} /></span> Import Bank Soal MCQ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Unggah berkas soal (PDF, TXT, JSON) atau tempel naskah soal.</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"><Icon name="xmark" size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl mt-4 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleImport} className="flex flex-col gap-5 mt-5">
          {/* Format Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1.5 text-blue-800">
              <Icon name="bulb-2" size={16} className="mr-1.5" />Format Naskah Soal yang Didukung:
            </p>
            <pre className="bg-white/80 p-2.5 rounded-xl font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre">
{`1. Apa peran utama ekosistem padang lamun dalam mitigasi iklim?
A. Menyerap emisi sulfur industri
B. Mengunci cadangan karbon biru pada sedimen dasar
C. Mencegah kenaikan suhu atmosfer daratan
D. Mengubah air laut menjadi air tawar
Kunci: B`}
            </pre>
            <p className="text-[10px] text-blue-600 mt-2">
              * Bobot soal akan dihitung dan dibagi rata secara otomatis sehingga total berjumlah pas 100 poin.
            </p>
          </div>

          {/* Opsi 1: Upload File */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy-dark">
              <Icon name="file-multiple" size={16} className="mr-1.5" />Opsi 1: Upload File Soal (PDF / TXT / JSON)
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 cursor-pointer border border-slate-200 rounded-xl p-2"
            />
            {file && (
              <p className="text-[11px] text-emerald-600 font-medium">
                <Icon name="check-circle-1" size={16} className="mr-1.5" />Berkas dipilih: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400 font-semibold uppercase">atau</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Opsi 2: Paste Raw Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy-dark">
              <Icon name="pencil-1" size={16} className="mr-1.5" />Opsi 2: Tempel Naskah Soal Langsung
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Tempelkan naskah soal hasil copy dari dokumen PDF / Word di sini..."
              className="form-input font-mono text-xs leading-relaxed resize-y"
            />
          </div>

          {/* Checkbox Replace Existing */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-navy-dark">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded text-navy focus:ring-navy h-4 w-4"
            />
            <span>
              <strong>Gantikan seluruh soal lama</strong> (soal yang ada di kuis ini akan dihapus dan diganti dengan soal baru hasil impor).
            </span>
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={importing} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" disabled={importing} className="btn btn-primary btn-sm flex items-center gap-2">
              {importing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Memproses Import...
                </>
              ) : (
                '🚀 Proses Import Soal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

