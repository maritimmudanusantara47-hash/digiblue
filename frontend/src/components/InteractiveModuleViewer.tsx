'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '@/components/Icon';
import MarkdownViewer from '@/components/MarkdownViewer';

interface InteractiveModuleViewerProps {
  contentId: number;
  title: string;
  body: string;
  pdfUrl?: string | null;
}

interface NoteItem {
  id: string;
  text: string;
  selectedText?: string;
  timestamp: string;
}

export default function InteractiveModuleViewer({
  contentId,
  title,
  body,
  pdfUrl,
}: InteractiveModuleViewerProps) {
  // ─── 1. Reading Progress & Scroll Tracking ─────────────────────────────────
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const totalScrollable = rect.height - windowHeight + 100;
      if (totalScrollable <= 0) {
        setScrollProgress(100);
        return;
      }
      
      const currentScroll = -rect.top;
      const progress = Math.min(100, Math.max(0, Math.round((currentScroll / totalScrollable) * 100)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── 2. Reading Time & Statistics ──────────────────────────────────────────
  const stats = useMemo(() => {
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    // Rata-rata kecepatan membaca artikel edukasi: 180 kata / menit
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return { wordCount, minutes };
  }, [body]);

  // ─── 3. Font Size & Layout Theme ───────────────────────────────────────────
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // ─── 4. Text-to-Speech (Audio Narator Interaktif) ───────────────────────────
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cleanTextForSpeech = useMemo(() => {
    // Bersihkan sintaks markdown agar narasi audio terdengar alami
    return body
      .replace(/#+\s+/g, '')
      .replace(/\*\*|\*/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/>\s+/g, '')
      .replace(/---\s*/g, '')
      .replace(/`.*?`/g, '')
      .trim();
  }, [body]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [contentId]);

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda belum mendukung fitur Web Speech API (Text-to-Speech).');
      return;
    }

    const synth = window.speechSynthesis;

    if (isPlayingAudio) {
      if (isPausedAudio) {
        synth.resume();
        setIsPausedAudio(false);
      } else {
        synth.pause();
        setIsPausedAudio(true);
      }
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    speechUtteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  // ─── 5. Catatan Pribadi Siswa & Highlight (Local Storage) ──────────────────
  const storageKey = `digiblue_module_notes_${contentId}`;
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('');
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setNotes(JSON.parse(saved));
      else setNotes([]);
    } catch {
      setNotes([]);
    }
  }, [storageKey]);

  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore localstorage quota error
    }
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim() && !selectedQuote) return;
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text: newNoteInput.trim(),
      selectedText: selectedQuote || undefined,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
    };
    saveNotes([newNote, ...notes]);
    setNewNoteInput('');
    setSelectedQuote('');
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  // Deteksi seleksi teks untuk quick-quote note
  const handleTextSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 3) {
      setSelectedQuote(sel.toString().trim());
      setShowNotesDrawer(true);
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-5">
      {/* ─── Sticky Reading Progress Bar (Top Indicator) ───────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 px-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-navy/10 text-navy flex items-center justify-center flex-shrink-0">
            <Icon name="book-1" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-navy-dark truncate">{title}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>{stats.minutes} menit baca</span>
              <span>•</span>
              <span className="font-semibold text-navy">{scrollProgress}% selesai</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Audio Narrator, Notes, Font Size */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Audio Narrator */}
          <button
            type="button"
            onClick={toggleSpeech}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPlayingAudio
                ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Dengarkan Narasi Audio (Text-to-Speech)"
          >
            <Icon name={isPlayingAudio && !isPausedAudio ? 'pause' : 'volume-high'} size={14} />
            <span className="hidden sm:inline">
              {isPlayingAudio ? (isPausedAudio ? 'Lanjut Narasi' : 'Jeda Narasi') : 'Dengarkan Audio'}
            </span>
          </button>

          {isPlayingAudio && (
            <button
              type="button"
              onClick={stopSpeech}
              className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs transition-colors"
              title="Hentikan Audio"
            >
              <Icon name="xmark" size={14} />
            </button>
          )}

          {/* Notes Toggle */}
          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showNotesDrawer || notes.length > 0
                ? 'bg-navy text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Catatan Pribadi & Highlight"
          >
            <Icon name="pencil-1" size={14} />
            <span className="hidden sm:inline">Catatan</span>
            {notes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-gold text-navy-dark text-[10px] font-extrabold flex items-center justify-center">
                {notes.length}
              </span>
            )}
          </button>

          {/* Font Size Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-lg transition-all ${fontSize === 'normal' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
              title="Ukuran teks normal"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-lg transition-all ${fontSize === 'large' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
              title="Ukuran teks besar"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-1 rounded-lg transition-all ${fontSize === 'xlarge' ? 'bg-white text-navy shadow-sm' : 'hover:text-navy'}`}
              title="Ukuran teks ekstra besar"
            >
              A++
            </button>
          </div>
        </div>

        {/* Top Progress bar line */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-gold via-navy-light to-navy rounded-b-2xl transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ─── Main Article Card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fadeup">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-navy via-navy-light to-navy px-7 py-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-gold flex-shrink-0 shadow-inner">
              <Icon name="book-1" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gold-light bg-white/10 px-3 py-0.5 rounded-full border border-white/20">
                  Modul Interaktif Online
                </span>
                <span className="text-xs text-white/70 flex items-center gap-1">
                  <Icon name="stopwatch" size={13} /> ±{stats.minutes} Menit Membaca
                </span>
                <span className="text-xs text-white/70">• {stats.wordCount} Kata</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-2 text-white leading-snug tracking-tight">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 p-2 px-3 rounded-2xl border border-white/15 text-xs text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Materi Terverifikasi DigiBlueCamp</span>
          </div>
        </div>

        {/* Reading Article Body */}
        <div
          onMouseUp={handleTextSelection}
          className={`p-6 sm:p-10 text-slate-800 transition-all ${
            fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'
          }`}
        >
          <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 px-5 mb-8 flex items-center gap-3 text-xs text-sky-900">
            <Icon name="bulb-2" size={18} className="text-gold flex-shrink-0" />
            <span>
              <strong>Tips Belajar:</strong> Sorot teks kalimat mana pun untuk menyimpannya sebagai catatan penting Anda, atau gunakan tombol <em>Dengarkan Audio</em> di atas jika lebih nyaman belajar sambil mendengarkan narasi.
            </span>
          </div>

          <article className="prose max-w-none leading-relaxed">
            <MarkdownViewer content={body} />
          </article>
        </div>

        {/* Document Footer (PDF Lampiran jika ada) */}
        {pdfUrl && (
          <div className="border-t border-slate-100 bg-slate-50/70 p-5 px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Icon name="file-multiple" size={16} className="text-navy" />
              <span>Dokumen PDF buku panduan / slide modul juga tersedia sebagai bahan pelengkap.</span>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm text-xs font-semibold self-start sm:self-auto"
            >
              <Icon name="eye" size={14} className="mr-1" />
              Buka PDF Pelengkap
            </a>
          </div>
        )}
      </div>

      {/* ─── Notes Drawer / Panel (Siswa Notes & Highlights) ────────────────── */}
      {showNotesDrawer && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl animate-fadeup flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gold/20 text-gold-dark flex items-center justify-center">
                <Icon name="pencil-1" size={15} />
              </div>
              <h4 className="font-extrabold text-navy-dark text-sm">Catatan & Kutipan Materi Kamu</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowNotesDrawer(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icon name="xmark" size={16} />
            </button>
          </div>

          {/* Input New Note */}
          <div className="flex flex-col gap-2.5">
            {selectedQuote && (
              <div className="bg-amber-50/80 border-l-4 border-gold p-3 rounded-r-xl text-xs text-slate-700 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy-dark text-[11px] mb-0.5 uppercase tracking-wide">Kutipan yang disorot:</p>
                  <p className="italic">&ldquo;{selectedQuote}&rdquo;</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuote('')}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Batalkan kutipan"
                >
                  <Icon name="xmark" size={12} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newNoteInput}
                onChange={e => setNewNoteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder={selectedQuote ? 'Tulis komentar/ulasan untuk kutipan ini...' : 'Ketik ringkasan atau catatan poin penting...'}
                className="form-input text-xs py-2.5"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNoteInput.trim() && !selectedQuote}
                className="btn btn-primary btn-sm text-xs px-4"
              >
                <Icon name="plus" size={14} className="mr-1" />
                Simpan
              </button>
            </div>
          </div>

          {/* List of Notes */}
          {notes.length > 0 ? (
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              {notes.map(note => (
                <div key={note.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-1.5 text-xs">
                  {note.selectedText && (
                    <blockquote className="border-l-2 border-gold pl-2.5 text-slate-600 italic my-0.5">
                      &ldquo;{note.selectedText}&rdquo;
                    </blockquote>
                  )}
                  {note.text && (
                    <p className="font-medium text-navy-dark">{note.text}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200/50">
                    <span>{note.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">
              Belum ada catatan pribadi. Anda dapat menyorot teks pada modul atau mengetik langsung di atas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
