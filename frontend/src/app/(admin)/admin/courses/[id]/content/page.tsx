'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

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
  pdf_module:       { icon: '📄', label: 'Learning Module',     color: 'blue' },
  video_embed:      { icon: '🎬', label: 'Video Lecture',       color: 'purple' },
  mcq_quiz:         { icon: '📝', label: 'Multiple Choice Exam',color: 'amber' },
  essay_task:       { icon: '✍️', label: 'Case-Study Essay',     color: 'teal' },
  oral_video_task:  { icon: '🎥', label: 'Oral Video Exam',     color: 'rose' },
  critical_thinking:{ icon: '💡', label: 'Critical Thinking',   color: 'indigo' },
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

  // PDF Upload
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);

  // Edit instruction text
  const [editInstruction, setEditInstruction] = useState('');
  const [editEmbedUrl, setEditEmbedUrl]       = useState('');
  const [savingContent, setSavingContent]     = useState(false);

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
      alert('✅ PDF berhasil diupload!');
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
        embed_url: editEmbedUrl || null,
      });
      alert('✅ Konten berhasil disimpan!');
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
          ← Kembali ke Daftar Kursus
        </button>
        <h1 className="text-2xl font-extrabold text-navy-dark">{course.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola konten & soal ujian kursus ini</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar: Section & Content List */}
        <aside className="w-72 flex-shrink-0">
          <div className="card p-0 overflow-hidden sticky top-4">
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
                    const meta = TYPE_META[content.content_type] ?? { icon: '📌', label: content.content_type };
                    const isSelected = selectedContent?.id === content.id;
                    return (
                      <button key={content.id}
                        onClick={() => selectContent(content)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm border-b border-slate-100 transition-colors
                          ${isSelected ? 'bg-navy text-white' : 'hover:bg-slate-50 text-navy-dark'}`}>
                        <span>{meta.icon}</span>
                        <span className={`flex-1 text-xs leading-snug ${isSelected ? 'font-semibold' : ''}`}>
                          {content.title}
                        </span>
                        {content.content_type === 'pdf_module' && content.file_path && (
                          <span className="text-xs opacity-70">✅</span>
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
              <div className="text-5xl mb-3">👈</div>
              <p>Pilih konten dari daftar di sebelah kiri</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Content Header */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {TYPE_META[selectedContent.content_type]?.icon} {TYPE_META[selectedContent.content_type]?.label ?? selectedContent.content_type}
                    </span>
                    <h2 className="text-lg font-extrabold text-navy-dark mt-2">{selectedContent.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    {selectedContent.content_type !== 'mcq_quiz' && (
                      <button onClick={() => setActiveTab('content')}
                        className={`btn btn-sm ${activeTab === 'content' ? 'btn-primary' : 'btn-secondary'}`}>
                        ✏️ Edit Konten
                      </button>
                    )}
                    {selectedContent.content_type === 'mcq_quiz' && (
                      <button onClick={() => setActiveTab('quiz')}
                        className={`btn btn-sm ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}>
                        📝 Kelola Soal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="card flex flex-col gap-5">
                  <h3 className="font-bold text-navy-dark">✏️ Edit Konten</h3>

                  {/* PDF Upload (for pdf_module) */}
                  {selectedContent.content_type === 'pdf_module' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col gap-4">
                      <p className="font-semibold text-blue-800 text-sm">📄 Upload File PDF</p>
                      {selectedContent.file_path && (
                        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-blue-200">
                          <span>✅</span>
                          <div className="flex-1 text-xs text-slate-600 truncate">File: {selectedContent.file_path}</div>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${selectedContent.file_path}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs text-navy font-medium hover:underline">Buka →</a>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <input type="file" accept=".pdf"
                          onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                          className="text-sm text-slate-600 flex-1" />
                        <button onClick={handleUploadPDF}
                          disabled={!uploadFile || uploading}
                          className="btn btn-primary btn-sm">
                          {uploading ? 'Uploading...' : '⬆️ Upload PDF'}
                        </button>
                      </div>
                      {uploadFile && (
                        <p className="text-xs text-slate-500">File dipilih: {uploadFile.name} ({(uploadFile.size/1024/1024).toFixed(2)} MB)</p>
                      )}
                    </div>
                  )}

                  {/* Video URL (for video_embed) */}
                  {selectedContent.content_type === 'video_embed' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-navy-dark">🎬 URL Video (YouTube / Drive)</label>
                      <input type="url" value={editEmbedUrl} onChange={e => setEditEmbedUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="form-input" />
                    </div>
                  )}

                  {/* Instruction Text (for all types) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-dark">📋 Teks Instruksi / Petunjuk</label>
                    <textarea rows={8} value={editInstruction} onChange={e => setEditInstruction(e.target.value)}
                      placeholder="Tulis petunjuk atau instruksi untuk peserta..."
                      className="form-input resize-none leading-relaxed" />
                    <p className="text-xs text-slate-400">Teks ini akan tampil sebagai panduan bagi peserta sebelum mengerjakan</p>
                  </div>

                  <button onClick={handleSaveContent} disabled={savingContent}
                    className="btn btn-primary self-start">
                    {savingContent ? 'Menyimpan...' : '💾 Simpan Perubahan'}
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
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy-dark">📝 Manajemen Soal MCQ</h3>
            <p className="text-sm text-slate-500 mt-0.5">{questions.length} soal terdaftar</p>
          </div>
          <button onClick={() => { setShowAdd(true); setEditingQ(null); }}
            className="btn btn-primary btn-sm">
            + Tambah Soal
          </button>
        </div>
      </div>

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
          <div className="text-5xl mb-3">📭</div>
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
          <button onClick={onEdit} className="btn btn-sm btn-secondary">✏️ Edit</button>
          <button onClick={onDelete} className="btn btn-sm text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-xl px-3 py-1.5">🗑️</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5 ml-11">
        {question.options.map(opt => (
          <div key={opt.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border
              ${opt.is_correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            {opt.is_correct ? '✅' : '⭕'} {opt.option_text}
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
      <h3 className="font-bold text-navy-dark">{question ? '✏️ Edit Soal' : '➕ Tambah Soal Baru'}</h3>

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
          {saving ? 'Menyimpan...' : question ? '💾 Simpan Perubahan' : '➕ Tambah Soal'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Batal
        </button>
      </div>
    </form>
  );
}
