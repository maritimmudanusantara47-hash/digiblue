'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import MarkdownViewer from '@/components/MarkdownViewer';

const AestheticPdfReader = dynamic(() => import('@/components/AestheticPdfReader'), {
  ssr: false,
  loading: function LoadingPdfReader() {
    const t = useTranslations('AdminCourseContentPage');
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-12 flex flex-col items-center justify-center gap-3 text-sky-400">
        <div className="w-10 h-10 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
        <p className="text-xs font-semibold">{t('msg_preparing_reader')}</p>
      </div>
    );
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizOption { id: number; option_text: string; is_correct: boolean }
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
  content_type: string;
  title: string;
  file_path: string | null;
  attachments?: ContentAttachment[] | null;
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
  pdf_module: { icon: 'file-multiple', label: 'Learning Module', color: 'blue' },
  video_embed: { icon: 'camera-movie-1', label: 'Video Lecture', color: 'purple' },
  mcq_quiz: { icon: 'pen-to-square', label: 'Multiple-Choice Examination', color: 'amber' },
  essay_task: { icon: 'pencil-1', label: 'Case-Study Essay Submission', color: 'teal' },
  oral_video_task: { icon: 'camera-movie-1', label: 'Oral Video Exam', color: 'rose' },
  critical_thinking: { icon: 'bulb-2', label: 'Critical Thinking Exam', color: 'indigo' },
  field_study: { icon: 'water-drop-1', label: 'Training Course (Field Study)', color: 'emerald' },
};

export default function AdminCourseContentPage() {
  const t = useTranslations('AdminCourseContentPage');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'quiz'>('overview');

  // Content being managed
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // PDF Upload & Preview
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  // Multi-attachment state for case study
  const [uploadingAttachmentCat, setUploadingAttachmentCat] = useState<string | null>(null);
  const [newAdditionalTitle, setNewAdditionalTitle] = useState('');
  const [showAddAdditionalForm, setShowAddAdditionalForm] = useState(false);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Edit title & metadata
  const [editTitle, setEditTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  // Edit instruction text
  const [editInstruction, setEditInstruction] = useState('');
  const [editContentBody, setEditContentBody] = useState('');
  const [bodyTab, setBodyTab] = useState<'editor' | 'preview'>('editor');
  const [editEmbedUrl, setEditEmbedUrl] = useState('');
  const [instructionTab, setInstructionTab] = useState<'editor' | 'preview'>('editor');
  const [savingContent, setSavingContent] = useState(false);

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
        alert(t('err_select_image'));
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
        const alt = imageAltText.trim() || t('alt_module_illustration');
        insertMarkdown(imageModalTarget, `\n![${alt}](${fullImgUrl})\n`, '', '');
        setImageModalOpen(false);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        alert(msg ?? t('err_upload_image'));
      } finally {
        setUploadingImage(false);
      }
    } else {
      if (!webImageUrl.trim()) {
        alert(t('err_no_image_url'));
        return;
      }
      const alt = imageAltText.trim() || t('alt_module_illustration');
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
      alert(msg ?? t('err_upload_image'));
    } finally {
      e.target.value = '';
    }
  };

  // Quiz Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showAddQuestion, setShowAddQ] = useState(false);
  const [editingQuestion, setEditingQ] = useState<QuizQuestion | null>(null);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/courses/${courseId}`);
      setCourse(res.data.data);
    } catch {
      alert(t('err_load_course'));
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
    setEditTitle(content.title);
    setIsEditingTitle(false);
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
      alert(t('succ_upload_pdf'));
      setUploadFile(null);
      fetchCourse();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? t('err_upload_pdf'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAttachment = async (file: File, category: 'case_study_brief' | 'template' | 'example_guide' | 'additional', title?: string) => {
    if (!selectedContent) return;
    setUploadingAttachmentCat(category);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (title && title.trim()) {
      formData.append('title', title.trim());
    }
    try {
      const res = await api.post(`/admin/contents/${selectedContent.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedContent = res.data.data;
      setSelectedContent(updatedContent);
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map(sec => ({
            ...sec,
            contents: sec.contents.map(c => c.id === updatedContent.id ? updatedContent : c)
          }))
        };
      });
      setNewAdditionalTitle('');
      setShowAddAdditionalForm(false);
      alert('Berkas lampiran berhasil diunggah.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengunggah berkas.');
    } finally {
      setUploadingAttachmentCat(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedContent) return;
    if (!confirm('Apakah Anda yakin ingin menghapus berkas lampiran ini?')) return;
    try {
      const res = await api.delete(`/admin/contents/${selectedContent.id}/attachments/${attachmentId}`);
      const updatedContent = res.data.data;
      setSelectedContent(updatedContent);
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map(sec => ({
            ...sec,
            contents: sec.contents.map(c => c.id === updatedContent.id ? updatedContent : c)
          }))
        };
      });
      alert('Berkas lampiran berhasil dihapus.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal menghapus berkas.');
    }
  };

  const handleQuickSaveTitle = async () => {
    if (!selectedContent) return;
    if (!editTitle.trim()) {
      alert('Judul modul tidak boleh kosong.');
      return;
    }
    setSavingTitle(true);
    try {
      const res = await api.patch(`/admin/contents/${selectedContent.id}`, {
        title: editTitle.trim(),
      });
      const updated = res.data.data;
      setSelectedContent(updated);
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map(sec => ({
            ...sec,
            contents: sec.contents.map(c => c.id === updated.id ? updated : c)
          }))
        };
      });
      setIsEditingTitle(false);
      alert('Nama modul berhasil diperbarui.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal memperbarui nama modul.');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleSaveContent = async () => {
    if (!selectedContent) return;
    if (!editTitle.trim()) {
      alert('Judul modul tidak boleh kosong.');
      return;
    }
    setSavingContent(true);
    try {
      const res = await api.patch(`/admin/contents/${selectedContent.id}`, {
        title: editTitle.trim(),
        instruction_text: editInstruction || null,
        content_body: editContentBody || null,
        embed_url: editEmbedUrl || null,
      });
      const updated = res.data.data;
      setSelectedContent(updated);
      setCourse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map(sec => ({
            ...sec,
            contents: sec.contents.map(c => c.id === updated.id ? updated : c)
          }))
        };
      });
      alert(t('succ_save_content'));
      fetchCourse();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? t('err_save_content'));
    } finally {
      setSavingContent(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
      <svg className="animate-spin h-6 w-6 text-navy" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      {t('msg_loading')}
    </div>
  );

  if (!course) return <div className="text-center py-20 text-slate-400">{t('err_course_not_found')}</div>;

  return (
    <div className="animate-fadeup">
      {/* Back Button + Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/admin/courses')}
          className="text-sm text-slate-500 hover:text-navy flex items-center gap-1 mb-3">
          <Icon name="arrow-left" size={16} className="mr-1.5" />{t('btn_back_to_courses')}
        </button>
        <h1 className="text-2xl font-extrabold text-navy-dark">{course.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('desc_manage_course')}</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar: Section & Content List */}
        <aside className="w-72 flex-shrink-0 self-start">
          <div className="card p-0 overflow-hidden sticky top-6">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('title_content_list')}</p>
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
                          <span className="text-xs opacity-70" title={t("title_material_filled")}><Icon name="check-circle-1" size={12} /></span>
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
              <p>{t('msg_select_content')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Content Header */}
              <div className="card flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full flex items-center">
                    <Icon name={TYPE_META[selectedContent.content_type]?.icon ?? "flag-1"} size={16} className="mr-1.5" />
                    {TYPE_META[selectedContent.content_type]?.label ?? selectedContent.content_type}
                  </span>
                  {!isEditingTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle(selectedContent.title);
                        setIsEditingTitle(true);
                      }}
                      className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 py-1 px-3 shadow-xs hover:border-slate-300"
                      title="Ubah judul modul ini"
                    >
                      <Icon name="pencil-1" size={13} />
                      <span>Ubah Nama Modul</span>
                    </button>
                  )}
                </div>

                {isEditingTitle ? (
                  <div className="flex flex-col sm:flex-row gap-2 mt-1 animate-fadein">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickSaveTitle();
                        } else if (e.key === 'Escape') {
                          setIsEditingTitle(false);
                          setEditTitle(selectedContent.title);
                        }
                      }}
                      className="form-input text-sm sm:text-base font-bold text-navy-dark flex-1 py-1.5"
                      placeholder="Masukkan judul / nama modul baru..."
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleQuickSaveTitle}
                        disabled={savingTitle || !editTitle.trim()}
                        className="btn btn-primary btn-sm text-xs py-2 px-3.5 flex items-center gap-1.5"
                      >
                        {savingTitle ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full" />
                        ) : (
                          <Icon name="check-circle-1" size={14} />
                        )}
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTitle(false);
                          setEditTitle(selectedContent.title);
                        }}
                        disabled={savingTitle}
                        className="btn btn-secondary btn-sm text-xs py-2 px-3"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-lg font-extrabold text-navy-dark">{selectedContent.title}</h2>
                )}
              </div>

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="card flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-navy-dark flex items-center gap-1.5">
                      <Icon name="pencil-1" size={16} />
                      {t('btn_edit_content')}
                    </h3>
                  </div>

                  {/* Input Edit Judul Modul di Form */}
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <label className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                      <span><Icon name="document" size={14} /></span>
                      Nama / Judul Modul <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Contoh: Modul 1: Konsep Fundamental & Kerangka Operasional"
                      className="form-input text-sm font-semibold text-navy-dark bg-white"
                    />
                    <p className="text-[11px] text-slate-400">
                      Nama ini akan ditampilkan pada navigasi samping peserta dan laporan penilaian.
                    </p>
                  </div>

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
                              {t('lbl_web_material_title')}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {t('desc_web_material')}
                          </p>
                        </div>
                        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-sm">
                          <button
                            type="button"
                            onClick={() => setBodyTab('editor')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${bodyTab === 'editor' ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                          >
                            <Icon name="pencil-1" size={14} />
                            {t('tab_text_editor')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBodyTab('preview')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${bodyTab === 'preview' ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                          >
                            <Icon name="eye" size={14} />
                            {t('tab_preview_web')}
                          </button>
                        </div>
                      </div>

                      {/* Quick Markdown Formatting Helper Toolbar */}
                      {bodyTab === 'editor' && (
                        <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 text-xs shadow-sm">
                          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">{t('lbl_format')}</span>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n# ', '\n', t('lbl_h1'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title={t("title_h1_full")}
                          >
                            H1
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n## ', '\n', t('lbl_h2'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title={t("title_h2_full")}
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n### ', '\n', t('lbl_h3'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title={t("title_h3_full")}
                          >
                            H3
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '**', '**', t('lbl_bold'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-bold transition-colors"
                            title={t("title_bold_full")}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '*', '*', t('lbl_italic'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 italic font-semibold transition-colors"
                            title={t("title_italic_full")}
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n- ', '\n', t('lbl_bullet'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title={t("title_bullet_full")}
                          >
                            • List
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n1. ', '\n', t('lbl_number'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title={t("title_number_full")}
                          >
                            {t('lbl_btn_number')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n> ', '\n', t('lbl_quote'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title={t("title_quote_full")}
                          >
                            &ldquo; Quote
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '\n---\n', '', '')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium transition-colors"
                            title={t("title_divider")}
                          >
                            {t('lbl_btn_line')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('body', '[', '](https://example.com)', t('lbl_link_text'))}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-navy hover:text-white rounded-md text-slate-700 font-medium underline transition-colors"
                            title={t("title_link")}
                          >
                            Link
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openImageModal('body')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-md font-bold flex items-center gap-1 transition-colors"
                            title={t("title_insert_image_btn")}
                          >
                            <Icon name="camera-movie-1" size={12} />
                            {t('btn_image')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => quickBodyImageRef.current?.click()}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-navy hover:text-white border border-blue-200 rounded-md text-navy font-bold flex items-center gap-1 transition-colors"
                            title={t("title_quick_upload_body")}
                          >
                            <Icon name="upload-1" size={12} />
                            {t('btn_upload_local')}
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
                            placeholder={t("ph_text_editor")}
                            className="form-input font-mono text-xs leading-relaxed resize-y bg-white border-slate-200 p-4"
                          />
                          <p className="text-[11px] text-slate-400">
                            {t('desc_editor_tips')}
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
                              <p className="text-sm font-semibold">{t('empty_web_material')}</p>
                              <p className="text-xs mt-1">{t('msg_select_editor')}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Upload (Khusus PDF Module) */}
                  {selectedContent.content_type === 'pdf_module' && (
                    <details className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm group" open={!selectedContent.content_body && !!selectedContent.file_path}>
                      <summary className="font-semibold text-slate-700 cursor-pointer flex items-center justify-between list-none">
                        <span className="flex items-center gap-2">
                          <Icon name="file-multiple" size={16} className="text-navy" />
                          <span>{t('lbl_pdf_attachment_optional')}</span>
                          {selectedContent.file_path && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              {t('lbl_has_pdf')}
                            </span>
                          )}
                        </span>
                        <Icon name="chevron-down" size={14} className="text-slate-400 transition-transform group-open:rotate-180" />
                      </summary>

                      <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-slate-200/60">
                        <p className="text-xs text-slate-500">
                          {t('desc_pdf_attachment')}
                        </p>
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
                              <Icon name="eye" size={16} className="mr-1.5" />{t('btn_preview_reader')}
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
                            {uploading ? t('btn_uploading') : <><Icon name="upload-1" size={16} className="mr-1.5" />{t('btn_upload_pdf')}</>}
                          </button>
                        </div>
                        {uploadFile && (
                          <p className="text-xs text-slate-500">{t('lbl_file_selected')} {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                        )}
                      </div>
                    </details>
                  )}

                  {/* ─── Case Study & Essay Multi-Attachment Manager ─── */}
                  {(selectedContent.content_type === 'essay_task' || selectedContent.content_type === 'critical_thinking') && (
                    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs shadow-sm">
                              <Icon name="folder-open" size={16} />
                            </span>
                            <h4 className="font-extrabold text-navy-dark text-base">
                              Berkas & Panduan Tugas Studi Kasus
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                            Kelola naskah soal, template lembar kerja (.docx), contoh acuan, serta berkas pendukung tambahan yang dapat diunduh peserta.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAddAdditionalForm(prev => !prev)}
                          className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 self-start sm:self-auto bg-white hover:bg-slate-50 border-slate-300 shadow-sm"
                        >
                          <Icon name="plus" size={14} />
                          <span>Tambah Dokumen Lain</span>
                        </button>
                      </div>

                      {/* Form Tambah Dokumen Pendukung Lain (Jika tombol diklik) */}
                      {showAddAdditionalForm && (
                        <div className="bg-white border-2 border-dashed border-teal-300 rounded-2xl p-4 flex flex-col gap-3 animate-fadein">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-navy-dark flex items-center gap-1.5">
                              <Icon name="plus" size={14} className="text-teal-600" />
                              Unggah Dokumen Pendukung Tambahan (Dataset Excel, Peraturan, Jurnal, dll.)
                            </h5>
                            <button
                              type="button"
                              onClick={() => setShowAddAdditionalForm(false)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              Batal
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Judul / Label Dokumen (Opsional)</label>
                              <input
                                type="text"
                                value={newAdditionalTitle}
                                onChange={e => setNewAdditionalTitle(e.target.value)}
                                placeholder="Contoh: Dataset Statistik Perikanan 2026"
                                className="form-input text-xs mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Pilih Berkas (.pdf, .docx, .xlsx, .csv, .zip)</label>
                              <input
                                type="file"
                                ref={additionalFileInputRef}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip"
                                className="text-xs text-slate-600 mt-1 block w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadAttachment(file, 'additional', newAdditionalTitle);
                                    if (additionalFileInputRef.current) additionalFileInputRef.current.value = '';
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3 Slot Preset Dokumen Utama */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Naskah Soal */}
                        <AttachmentCardSlot
                          category="case_study_brief"
                          label="Naskah Soal Kasus"
                          description="Dokumen naskah soal skenario kasus (.pdf / .docx)"
                          icon="clipboard"
                          badgeText="Soal Kasus"
                          badgeBg="bg-teal-100"
                          badgeColor="text-teal-800"
                          attachment={selectedContent.attachments?.find(a => a.category === 'case_study_brief')}
                          uploading={uploadingAttachmentCat === 'case_study_brief'}
                          onUpload={(file) => handleUploadAttachment(file, 'case_study_brief')}
                          onDelete={(id) => handleDeleteAttachment(id)}
                          onPreviewPdf={(url, title) => { setPreviewPdfUrl(url); setPreviewPdfTitle(title); }}
                        />

                        {/* 2. Template Lembar Jawaban */}
                        <AttachmentCardSlot
                          category="template"
                          label="Template Lembar Jawaban"
                          description="Format lembar kerja untuk diisi peserta (.docx / .pdf)"
                          icon="pencil-1"
                          badgeText="Template Jawaban"
                          badgeBg="bg-blue-100"
                          badgeColor="text-blue-800"
                          attachment={selectedContent.attachments?.find(a => a.category === 'template')}
                          uploading={uploadingAttachmentCat === 'template'}
                          onUpload={(file) => handleUploadAttachment(file, 'template')}
                          onDelete={(id) => handleDeleteAttachment(id)}
                          onPreviewPdf={(url, title) => { setPreviewPdfUrl(url); setPreviewPdfTitle(title); }}
                        />

                        {/* 3. Contoh Pengisian / Rubrik */}
                        <AttachmentCardSlot
                          category="example_guide"
                          label="Contoh Pengisian / Acuan"
                          description="Contoh acuan pengisian atau rubrik pedoman (.pdf / .docx)"
                          icon="bulb-2"
                          badgeText="Contoh Acuan"
                          badgeBg="bg-amber-100"
                          badgeColor="text-amber-800"
                          attachment={selectedContent.attachments?.find(a => a.category === 'example_guide')}
                          uploading={uploadingAttachmentCat === 'example_guide'}
                          onUpload={(file) => handleUploadAttachment(file, 'example_guide')}
                          onDelete={(id) => handleDeleteAttachment(id)}
                          onPreviewPdf={(url, title) => { setPreviewPdfUrl(url); setPreviewPdfTitle(title); }}
                        />
                      </div>

                      {/* Berkas Pendukung Tambahan (Jika ada yang diunggah) */}
                      {(selectedContent.attachments?.filter(a => a.category === 'additional').length ?? 0) > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                          <h5 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                            <Icon name="paperclip-1" size={14} />
                            Dokumen Pendukung Tambahan ({selectedContent.attachments?.filter(a => a.category === 'additional').length})
                          </h5>
                          <div className="flex flex-col gap-2">
                            {selectedContent.attachments?.filter(a => a.category === 'additional').map(att => (
                              <div key={att.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center uppercase flex-shrink-0">
                                    {att.extension || 'file'}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-navy-dark truncate">{att.title}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{att.file_name} • {att.file_size_formatted || ''}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <a
                                    href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')}/storage/${att.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={att.file_name}
                                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                                  >
                                    <Icon name="download" size={13} />
                                    <span>Unduh</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(att.id)}
                                    className="px-2 py-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-rose-500 rounded-lg text-xs transition-colors"
                                    title="Hapus berkas ini"
                                  >
                                    <Icon name="trash-1" size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Field Study: admin note */}
                  {selectedContent.content_type === 'field_study' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                      <p className="font-semibold text-emerald-800 text-sm mb-2"><Icon name="water-drop-1" size={16} className="mr-1.5" />Training Course (Field Study)</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        {t('desc_field_study')}
                      </p>
                    </div>
                  )}

                  {/* Video URL (for video_embed) */}
                  {selectedContent.content_type === 'video_embed' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-navy-dark"><Icon name="camera-movie-1" size={16} className="mr-1.5" />{t('lbl_video_url')}</label>
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
                            ? t('lbl_essay_prompt')
                            : t('lbl_instruction_text')}
                        </label>
                        <p className="text-xs text-slate-400 mt-0.5">{t('desc_instruction_text')}</p>
                      </div>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setInstructionTab('editor')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${instructionTab === 'editor' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                          <Icon name="pencil-1" size={16} className="mr-1.5" />{t('tab_markdown_editor')}
                        </button>
                        <button type="button" onClick={() => setInstructionTab('preview')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${instructionTab === 'preview' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                          <Icon name="eye" size={16} className="mr-1.5" />{t('tab_preview')}
                        </button>
                      </div>
                    </div>

                    {instructionTab === 'editor' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">{t('lbl_format')}</span>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n# ', '\n', t('lbl_question_title'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-bold transition-colors"
                            title={t("title_h1")}
                          >
                            H1
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n## ', '\n', t('lbl_h2'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-bold transition-colors"
                            title={t("title_h2")}
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '**', '**', t('lbl_bold'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-bold transition-colors"
                            title={t("title_bold")}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '*', '*', t('lbl_italic'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 italic font-semibold transition-colors"
                            title={t("title_italic")}
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n- ', '\n', t('lbl_instruction_point'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-medium transition-colors"
                            title={t("title_bullet")}
                          >
                            • List
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n1. ', '\n', t('lbl_instruction_step'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-medium transition-colors"
                            title={t("title_number")}
                          >
                            {t('lbl_btn_number')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMarkdown('instruction', '\n> ', '\n', t('lbl_important_note'))}
                            className="px-2 py-0.5 bg-white hover:bg-navy hover:text-white rounded border border-slate-200 text-slate-700 font-medium transition-colors"
                            title={t("title_quote")}
                          >
                            &ldquo; Quote
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openImageModal('instruction')}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded font-bold flex items-center gap-1 transition-colors"
                            title={t("title_insert_image_btn")}
                          >
                            <Icon name="camera-movie-1" size={12} />
                            {t('btn_image')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => quickInstructionImageRef.current?.click()}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-navy hover:text-white border border-blue-200 rounded text-navy font-bold flex items-center gap-1 transition-colors"
                            title={t("title_quick_upload_inst")}
                          >
                            <Icon name="upload-1" size={12} />
                            {t('btn_upload_local')}
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
                          placeholder={t("ph_essay_prompt")}
                          className="form-input font-mono text-xs leading-relaxed resize-y" />
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[200px] max-h-[500px] overflow-y-auto">
                        {editInstruction ? (
                          <MarkdownViewer content={editInstruction} />
                        ) : (
                          <p className="text-xs text-slate-400 italic">{t('empty_instruction')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button onClick={handleSaveContent} disabled={savingContent}
                    className="btn btn-primary self-start">
                    {savingContent ? t('btn_saving') : <><Icon name="floppy-disk-1" size={16} className="mr-1.5" />{t('btn_save_changes')}</>}
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
                <span className="font-bold text-sm truncate">{t('lbl_admin_reader_preview')} {previewPdfTitle}</span>
              </div>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-bold"
              >
                <Icon name="xmark" size={16} className="mr-1.5" />{t('btn_close')}
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
                  <h3 className="font-extrabold text-navy-dark text-base">{t('title_insert_image')}</h3>
                  <p className="text-xs text-slate-400">{t('desc_image_source')}</p>
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${imageTab === 'upload' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
                  }`}
              >
                <Icon name="upload-1" size={14} />
                {t('tab_upload_computer')}
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${imageTab === 'url' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
                  }`}
              >
                <Icon name="link-2-angular-right" size={14} />
                {t('tab_url_image')}
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
                        alt={t("alt_preview")}
                        className="max-h-44 rounded-xl border border-slate-200 object-contain shadow-sm"
                      />
                      <span className="text-[11px] font-semibold text-navy hover:underline">
                        {t('btn_change_image')} ({localImageFile?.name})
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-navy flex items-center justify-center text-xl">
                        <Icon name="cloud-upload" size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-navy-dark">{t('btn_click_image')}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t('lbl_format')} {t('lbl_image_format_allowed')}</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            ) : (
              /* Tab 2: URL */
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy-dark">{t('lbl_internet_url')}</label>
                <input
                  type="url"
                  value={webImageUrl}
                  onChange={e => setWebImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau https://example.com/foto.jpg"
                  className="form-input text-xs"
                />
                <p className="text-[10px] text-slate-400">{t('desc_internet_url')}</p>
              </div>
            )}

            {/* Caption / Alt Text Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy-dark">
                {t('lbl_image_alt')} <span className="text-slate-400 font-normal">({t('desc_image_alt_help')})</span>
              </label>
              <input
                type="text"
                value={imageAltText}
                onChange={e => setImageAltText(e.target.value)}
                placeholder={t("ph_image_alt")}
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
                {t('btn_cancel')}
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
                    {t('btn_uploading_image')}
                  </>
                ) : (
                  <>
                    <Icon name="check-circle-1" size={14} />
                    {t('btn_insert_editor')}
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

// ─── Attachment Card Slot (Preset Categories) ─────────────────────────────────
function AttachmentCardSlot({
  category,
  label,
  description,
  icon,
  badgeText,
  badgeBg,
  badgeColor,
  attachment,
  uploading,
  onUpload,
  onDelete,
  onPreviewPdf,
}: {
  category: string;
  label: string;
  description: string;
  icon: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  attachment?: ContentAttachment;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onPreviewPdf: (url: string, title: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = attachment?.extension?.toLowerCase() === 'pdf' || attachment?.file_name.toLowerCase().endsWith('.pdf');
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/api\/?$/, '');
  const downloadUrl = attachment ? `${backendBase}/storage/${attachment.file_path}` : '#';

  return (
    <div className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${attachment ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/70 border-dashed border-slate-300 hover:border-slate-400'
      }`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeBg} ${badgeColor}`}>
            {badgeText}
          </span>
          {attachment && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <Icon name="check-circle-1" size={11} /> Tersedia
            </span>
          )}
        </div>

        <h5 className="font-extrabold text-navy-dark text-sm flex items-center gap-1.5">
          <Icon name={icon} size={15} />
          {label}
        </h5>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
          {description}
        </p>

        {attachment ? (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-navy text-white text-[9px] font-bold flex items-center justify-center uppercase flex-shrink-0">
                {attachment.extension || 'file'}
              </span>
              <p className="text-xs font-bold text-navy-dark truncate" title={attachment.file_name}>
                {attachment.file_name}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 pl-8">
              Ukuran: {attachment.file_size_formatted || '-'}
            </p>
          </div>
        ) : (
          <div className="mt-3 py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center px-3">
            <span className="text-slate-300 text-lg mb-1"><Icon name="cloud-upload" size={20} /></span>
            <p className="text-[11px] text-slate-400 font-medium">Belum ada berkas diunggah</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUpload(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
        />

        {attachment ? (
          <>
            <div className="flex items-center gap-1.5">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                download={attachment.file_name}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-navy hover:text-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                title="Unduh berkas"
              >
                <Icon name="download" size={13} />
                <span>Unduh</span>
              </a>
              {isPdf && (
                <button
                  type="button"
                  onClick={() => onPreviewPdf(downloadUrl, attachment.title)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
                  title="Lihat Pratinjau PDF"
                >
                  <Icon name="eye" size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2 py-1.5 hover:bg-slate-100 rounded-lg text-xs font-semibold text-navy transition-colors"
                title="Ganti berkas ini"
              >
                {uploading ? '...' : 'Ganti'}
              </button>
              <button
                type="button"
                onClick={() => onDelete(attachment.id)}
                disabled={uploading}
                className="px-2 py-1.5 hover:bg-rose-50 rounded-lg text-xs text-rose-500 transition-colors"
                title="Hapus berkas"
              >
                <Icon name="trash-1" size={13} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 bg-white hover:bg-navy hover:text-white border border-slate-300 hover:border-navy text-navy rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                Mengunggah...
              </span>
            ) : (
              <>
                <Icon name="upload-1" size={13} />
                <span>Pilih Berkas</span>
              </>
            )}
          </button>
        )}
      </div>
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
  const t = useTranslations('AdminCourseContentPage');
  const [showImport, setShowImport] = useState(false);
  const totalWeight = questions.reduce((sum, q) => sum + (q.weight_score || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy-dark text-lg"><Icon name="pen-to-square" size={16} className="mr-1.5" />{t('title_mcq_manager')}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>{questions.length} {t('lbl_questions_registered')}</span>
              <span>•</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {t('lbl_total_weight')} {totalWeight}/100 {t('lbl_points')} {totalWeight === 100 ? <Icon name="check-circle-1" size={16} /> : <Icon name="info" size={16} />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button type="button" onClick={() => setShowImport(true)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
              <span><Icon name="download-1" size={18} /></span> {t('btn_import_questions')}
            </button>
            <button type="button" onClick={() => { setShowAdd(true); setEditingQ(null); }}
              className="btn btn-primary btn-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
              <span><Icon name="plus" size={18} /></span> {t('btn_add_quiz')}
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
        <div className="card text-center py-10 text-slate-400">{t('msg_loading_quiz')}</div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <div className="text-5xl mb-3"><Icon name="envelope-1" size={48} /></div>
          <p>{t('empty_questions')}</p>
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
                if (!confirm(`t('confirm_delete_question') "${q.question_text.slice(0, 50)}..."?`)) return;
                try {
                  await api.delete(`/admin/questions/${q.id}`);
                  onRefresh();
                } catch (err: unknown) {
                  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                  alert(msg ?? t('err_delete_quiz'));
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
  const t = useTranslations('AdminCourseContentPage');
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 flex-shrink-0 bg-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-navy-dark text-sm">{question.question_text}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('lbl_weight')} {question.weight_score} {t('lbl_points')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn btn-sm btn-secondary"><Icon name="pencil-1" size={16} className="mr-1.5" />Edit</button>
          <button onClick={onDelete} className="btn btn-sm text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-xl px-3 py-1.5"><Icon name="trash-3" size={14} /></button>
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
  const t = useTranslations('AdminCourseContentPage');
  const [questionText, setQText] = useState(question?.question_text ?? '');
  const [weightScore, setWeight] = useState(String(question?.weight_score ?? 25));
  const [options, setOptions] = useState<OptionForm[]>(
    question?.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct }))
    ?? [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    if (!questionText.trim()) { setError(t('err_question_empty')); return; }
    if (options.some(o => !o.option_text.trim())) { setError(t('err_options_empty')); return; }
    const correctCount = options.filter(o => o.is_correct).length;
    if (correctCount !== 1) { setError(t('err_select_one_correct')); return; }

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
      setError(msg ?? t('err_save_quiz'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card border-2 border-navy/20 flex flex-col gap-5">
      <h3 className="font-bold text-navy-dark">{question ? <><Icon name="pencil-1" size={16} className="mr-1.5" />{t('title_edit_question')}</> : <><Icon name="plus" size={16} className="mr-1.5" />{t('title_add_question')}</>}</h3>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl">{error}</div>}

      {/* Question Text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-navy-dark">{t('lbl_question_text')}</label>
        <textarea rows={3} value={questionText} onChange={e => setQText(e.target.value)}
          placeholder={t("ph_question_text")}
          className="form-input resize-none" />
      </div>

      {/* Weight Score */}
      <div className="flex flex-col gap-1.5 max-w-[200px]">
        <label className="text-sm font-bold text-navy-dark">{t('lbl_question_weight')}</label>
        <input type="number" value={weightScore} onChange={e => setWeight(e.target.value)}
          min={1} max={100} className="form-input" />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-navy-dark">{t('lbl_quiz_options')}</label>
          <button type="button" onClick={addOption} disabled={options.length >= 6}
            className="text-xs text-navy font-medium hover:underline disabled:text-slate-300">
            {t('btn_add_option')}
          </button>
        </div>
        <p className="text-xs text-slate-400 -mt-1">{t('desc_radio_correct')}</p>
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
          {saving ? t('btn_saving') : question ? <><Icon name="floppy-disk-1" size={16} className="mr-1.5" />{t('btn_save_changes')}</> : <><Icon name="plus" size={16} className="mr-1.5" />{t('btn_add_quiz')}</>}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {t('btn_cancel')}
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
  const t = useTranslations('AdminCourseContentPage');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setError(t('err_no_quiz_file'));
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
      alert(`${res.data.message ?? t('succ_import_quiz')}`);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? t('err_import_quiz'));
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
              <span><Icon name="download-1" size={18} /></span> {t('title_import_mcq')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('desc_upload_quiz')}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
            <Icon name="xmark" size={16} />
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
              <Icon name="bulb-2" size={16} className="mr-1.5" />{t('title_supported_format')}
            </p>
            <pre className="bg-white/80 p-2.5 rounded-xl font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre">
              {t('fmt_example_quiz')}
            </pre>
            <p className="text-[10px] text-blue-600 mt-2">
              {t('desc_auto_weight')}
            </p>
          </div>

          {/* Opsi 1: Upload File */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy-dark">
              <Icon name="file-multiple" size={16} className="mr-1.5" />{t('opt1_upload')}
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 cursor-pointer border border-slate-200 rounded-xl p-2"
            />
            {file && (
              <p className="text-[11px] text-emerald-600 font-medium">
                <Icon name="check-circle-1" size={16} className="mr-1.5" />{t('lbl_quiz_file_selected')} {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400 font-semibold uppercase">{t('lbl_or')}</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Opsi 2: Paste Raw Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy-dark">
              <Icon name="pencil-1" size={16} className="mr-1.5" />{t('opt2_paste')}
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t("ph_paste_quiz")}
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
              <strong>{t('opt_replace_existing')}</strong> ({t('desc_replace_existing')}).
            </span>
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={importing} className="btn btn-secondary btn-sm">
              {t('btn_cancel')}
            </button>
            <button type="submit" disabled={importing} className="btn btn-primary btn-sm flex items-center gap-2">
              {importing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t('btn_processing_import')}
                </>
              ) : (
                <span className="flex items-center justify-center gap-2"><Icon name="rocket-5" size={15} /><span>{t('btn_process_import')}</span></span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

