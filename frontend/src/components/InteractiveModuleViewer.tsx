'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '@/components/Icon';
import MarkdownViewer from '@/components/MarkdownViewer';
import { showWarning } from '@/lib/swal';

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
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // ─── 2. Reading Time & Statistics ──────────────────────────────────────────
  const stats = useMemo(() => {
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    // Rata-rata kecepatan membaca artikel edukasi: 180 kata / menit
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return { wordCount, minutes };
  }, [body]);

  // ─── 3. Font Size Scaling ──────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // ─── 4. Text-to-Speech (Audio Narator Interaktif Berantai) ───────────────────
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [selectedRate, setSelectedRate] = useState(1.0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);

  // Bersihkan teks dari sintaks Markdown agar narasi audio terdengar alami
  const cleanTextForSpeech = useMemo(() => {
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

  // Pecah teks menjadi kalimat-kalimat (chunks) untuk menghindari limit 15s di Chromium
  const speechChunks = useMemo(() => {
    if (!cleanTextForSpeech) return [];
    const sentences = cleanTextForSpeech
      .split(/(?<=[.!?\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return sentences.length > 0 ? sentences : [cleanTextForSpeech];
  }, [cleanTextForSpeech]);

  const chunkIndexRef = useRef(0);
  chunkIndexRef.current = currentChunkIndex;

  const rateRef = useRef(selectedRate);
  rateRef.current = selectedRate;

  const speakChunk = useCallback((index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    // Selesai membaca semua bagian
    if (index >= speechChunks.length) {
      synth.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setCurrentChunkIndex(0);
      setCurrentSpeakingText('');
      return;
    }

    synth.cancel();
    // Resume Chromium internal speech queue in case it was paused earlier
    if (synth.paused) {
      synth.resume();
    }

    const textToRead = speechChunks[index];
    setCurrentChunkIndex(index);
    setCurrentSpeakingText(textToRead);

    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Pilih suara: utamakan Bahasa Indonesia (id-ID), atau gunakan default jika tidak tersedia
    const voices = synth.getVoices();
    const indonesianVoice = voices.find(
      v => v.lang === 'id-ID' || v.lang.toLowerCase().startsWith('id')
    );
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
      utterance.lang = 'id-ID';
    } else {
      utterance.lang = 'id-ID';
    }

    utterance.rate = rateRef.current;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
      setTtsErrorMessage(null);
    };

    utterance.onend = () => {
      // Lanjutkan otomatis ke kalimat / paragraf berikutnya
      speakChunk(index + 1);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', e);
        setTtsErrorMessage(`Narasi audio terganggu: ${e.error}`);
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      }
    };

    synth.speak(utterance);
  }, [speechChunks]);

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showWarning('Fitur Tidak Didukung', 'Browser Anda belum mendukung Web Speech API (Text-to-Speech).');
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

    setIsPlayingAudio(true);
    setIsPausedAudio(false);
    speakChunk(currentChunkIndex < speechChunks.length ? currentChunkIndex : 0);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setCurrentChunkIndex(0);
    setCurrentSpeakingText('');
  };

  // Bersihkan audio saat berpindah konten / unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [contentId]);

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
      // ignore storage error
    }
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim() && !selectedQuote) return;
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text: newNoteInput.trim(),
      selectedText: selectedQuote || undefined,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      }),
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
    <div ref={containerRef} className="relative flex flex-col gap-4">
      {/* ─── Sticky Reading Progress Bar (Top Bar) ─────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 px-4 shadow-sm flex items-center justify-between gap-3">
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

        {/* Action Controls: Audio Narrator, Catatan Drawer, Font Size */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Audio Narrator Button */}
          <button
            type="button"
            onClick={toggleSpeech}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPlayingAudio
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Dengarkan Narasi Suara (Text-to-Speech)"
          >
            <Icon
              name={isPlayingAudio && !isPausedAudio ? 'pause' : 'volume-high'}
              size={14}
              className={isPlayingAudio && !isPausedAudio ? 'animate-bounce text-amber-700' : ''}
            />
            <span className="hidden sm:inline">
              {isPlayingAudio ? (isPausedAudio ? 'Lanjut Narasi' : 'Jeda Narasi') : 'Dengarkan Audio'}
            </span>
          </button>

          {isPlayingAudio && (
            <button
              type="button"
              onClick={stopSpeech}
              className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs transition-colors"
              title="Hentikan Audio Narasi"
            >
              <Icon name="xmark" size={14} />
            </button>
          )}

          {/* Notes Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showNotesDrawer
                ? 'bg-navy text-white shadow-sm ring-2 ring-navy/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Buka Panel Catatan Pribadi & Kutipan"
          >
            <Icon name="pencil-1" size={14} />
            <span className="hidden sm:inline">Catatan</span>
            {notes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-gold text-navy-dark text-[10px] font-extrabold flex items-center justify-center">
                {notes.length}
              </span>
            )}
          </button>

          {/* Font Size Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fontSize === 'normal' ? 'bg-navy text-white shadow-sm' : 'hover:text-navy text-slate-600'
              }`}
              title="Ukuran teks normal (14px)"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fontSize === 'large' ? 'bg-navy text-white shadow-sm' : 'hover:text-navy text-slate-600'
              }`}
              title="Ukuran teks besar (16px)"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fontSize === 'xlarge' ? 'bg-navy text-white shadow-sm' : 'hover:text-navy text-slate-600'
              }`}
              title="Ukuran teks ekstra besar (18px)"
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

      {/* ─── Active Floating Audio Player Bar (Muncul saat Narasi Berjalan) ─── */}
      {isPlayingAudio && (
        <div className="bg-navy-dark text-white rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl border border-navy-light/40 animate-fadein">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 animate-pulse">
              <Icon name={isPausedAudio ? 'pause' : 'volume-high'} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-gold uppercase tracking-wider">
                  {isPausedAudio ? 'Audio Dijeda' : 'Narator Suara Aktif'}
                </span>
                <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                  Bagian {currentChunkIndex + 1} dari {speechChunks.length}
                </span>
              </div>
              <p className="text-xs text-slate-200 truncate mt-1 italic font-serif">
                &ldquo;{currentSpeakingText}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            {/* Speed Selector */}
            <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-[11px] font-bold">
              {[0.8, 1.0, 1.25].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setSelectedRate(rate);
                    speakChunk(currentChunkIndex);
                  }}
                  className={`px-2 py-0.5 rounded transition-all ${
                    selectedRate === rate ? 'bg-gold text-navy-dark shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                  title={`Kecepatan narasi ${rate}x`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={toggleSpeech}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 transition-colors"
            >
              <Icon name={isPausedAudio ? 'play' : 'pause'} size={13} />
              <span>{isPausedAudio ? 'Lanjutkan' : 'Jeda'}</span>
            </button>

            {/* Stop */}
            <button
              type="button"
              onClick={stopSpeech}
              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
              title="Hentikan Narasi Audio"
            >
              <Icon name="xmark" size={14} />
            </button>
          </div>
        </div>
      )}

      {ttsErrorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl flex items-center justify-between">
          <span>{ttsErrorMessage}</span>
          <button type="button" onClick={() => setTtsErrorMessage(null)} className="text-red-500 hover:underline">
            Tutup
          </button>
        </div>
      )}

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
        <div onMouseUp={handleTextSelection} className="p-6 sm:p-10 text-slate-800 transition-all">
          <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 px-5 mb-8 flex items-center gap-3 text-xs text-sky-900">
            <Icon name="bulb-2" size={18} className="text-gold flex-shrink-0" />
            <span>
              <strong>Tips Belajar:</strong> Sorot teks kalimat mana pun untuk menyimpannya sebagai catatan penting Anda, atau gunakan tombol <em>Dengarkan Audio</em> di atas jika lebih nyaman belajar sambil mendengarkan narasi.
            </span>
          </div>

          <article className="max-w-none leading-relaxed">
            <MarkdownViewer content={body} fontSize={fontSize} />
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

      {/* ─── Slide-Over Side Drawer for Notes (Catatan Pribadi Siswa) ───────── */}
      {showNotesDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadein">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-dark/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowNotesDrawer(false)}
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold-dark flex items-center justify-center font-bold">
                    <Icon name="pencil-1" size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy-dark text-sm">Catatan & Kutipan Modul</h4>
                    <p className="text-[11px] text-slate-400">Tersimpan otomatis di browser kamu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotesDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Tutup Catatan"
                >
                  <Icon name="xmark" size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
                {/* Input New Note */}
                <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <p className="text-xs font-bold text-navy-dark">Tambah Catatan Baru</p>

                  {selectedQuote && (
                    <div className="bg-amber-50/90 border-l-4 border-gold p-3 rounded-r-xl text-xs text-slate-700 flex items-start justify-between gap-2 shadow-sm">
                      <div>
                        <p className="font-bold text-navy-dark text-[10px] mb-0.5 uppercase tracking-wide">
                          Kutipan yang disorot:
                        </p>
                        <p className="italic font-serif leading-relaxed">&ldquo;{selectedQuote}&rdquo;</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedQuote('')}
                        className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0"
                        title="Hapus seleksi kutipan"
                      >
                        <Icon name="xmark" size={12} />
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    value={newNoteInput}
                    onChange={e => setNewNoteInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddNote();
                      }
                    }}
                    placeholder={
                      selectedQuote
                        ? 'Tulis komentar atau poin penting dari kutipan di atas...'
                        : 'Ketik ringkasan pemahaman, pertanyaan, atau catatan penting...'
                    }
                    className="form-input text-xs resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Tekan Ctrl+Enter atau tombol Simpan</span>
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!newNoteInput.trim() && !selectedQuote}
                      className="btn btn-primary btn-sm text-xs px-4"
                    >
                      <Icon name="plus" size={14} className="mr-1" />
                      Simpan Catatan
                    </button>
                  </div>
                </div>

                {/* List of Notes */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                    <span>Daftar Catatan ({notes.length})</span>
                  </div>

                  {notes.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {notes.map(note => (
                        <div
                          key={note.id}
                          className="bg-white border border-slate-200/90 hover:border-navy/30 rounded-2xl p-4 flex flex-col gap-2 text-xs shadow-sm transition-colors"
                        >
                          {note.selectedText && (
                            <blockquote className="border-l-2 border-gold pl-3 text-slate-600 italic bg-amber-50/40 p-1.5 rounded-r-lg">
                              &ldquo;{note.selectedText}&rdquo;
                            </blockquote>
                          )}
                          {note.text && (
                            <p className="font-medium text-navy-dark leading-relaxed whitespace-pre-wrap">
                              {note.text}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>{note.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                            >
                              <Icon name="xmark" size={12} />
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <Icon name="pencil-1" size={28} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold">Belum ada catatan.</p>
                      <p className="text-[11px] mt-1">
                        Sorot kalimat di artikel modul atau ketik catatan di atas untuk menyimpan referensi belajar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
