'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '@/components/Icon';
import MarkdownViewer from '@/components/MarkdownViewer';
import { showWarning } from '@/lib/swal';
import api from '@/lib/api';

interface InteractiveModuleViewerProps {
  contentId: number;
  title: string;
  body: string;
  pdfUrl?: string | null;
}

interface NoteItem {
  id: number;
  note_text: string | null;
  selected_text?: string | null;
  created_at: string;
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

  // ─── 5. Catatan Pribadi Siswa (API-backed) ──────────────────────────────
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('');
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  // Fetch catatan dari server setiap kali contentId berubah atau drawer dibuka
  useEffect(() => {
    if (!showNotesDrawer) return;
    api.get('/module-notes', { params: { content_id: contentId } })
      .then(res => setNotes(res.data.data ?? []))
      .catch(() => setNotes([]));
  }, [showNotesDrawer, contentId]);

  const handleAddNote = async () => {
    if (!newNoteInput.trim() && !selectedQuote) return;
    setNotesSaving(true);
    try {
      const res = await api.post('/module-notes', {
        content_id:    contentId,
        note_text:     newNoteInput.trim() || null,
        selected_text: selectedQuote || null,
      });
      setNotes(prev => [res.data.data, ...prev]);
      setNewNoteInput('');
      setSelectedQuote('');
    } catch {
      // silent fail
    } finally {
      setNotesSaving(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await api.delete(`/module-notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      // silent fail
    }
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

      {/* ─── Compact Floating Modal for Notes (Catatan Pribadi Siswa) ───────── */}
      {showNotesDrawer && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-fadein">
          {/* Invisible backdrop to close on outside click */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setShowNotesDrawer(false)}
          />

          {/* Compact floating modal - top right below toolbar */}
          <div className="fixed top-[60px] right-4 w-[360px] max-h-[480px] bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(7,25,44,0.20)] border border-slate-200/80 flex flex-col pointer-events-auto overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Icon name="pencil-1" size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-navy-dark text-[13px] leading-tight">Catatan & Kutipan Modul</h4>
                  <p className="text-[10px] text-slate-400">Tersimpan otomatis di browser kamu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesDrawer(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Tutup Catatan"
              >
                <Icon name="xmark" size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex flex-col overflow-y-auto flex-1 min-h-0">
              {/* Input New Note */}
              <div className="p-3 border-b border-slate-100 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-navy-dark">Tambah Catatan Baru</p>

                {selectedQuote && (
                  <div className="bg-amber-50 border-l-3 border-amber-400 px-2.5 py-2 rounded-r-lg text-[11px] text-slate-700 flex items-start justify-between gap-2">
                    <p className="italic leading-relaxed line-clamp-2">&ldquo;{selectedQuote}&rdquo;</p>
                    <button
                      type="button"
                      onClick={() => setSelectedQuote('')}
                      className="text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5"
                    >
                      <Icon name="xmark" size={11} />
                    </button>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={newNoteInput}
                  onChange={e => setNewNoteInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddNote();
                    }
                  }}
                  placeholder={
                    selectedQuote
                      ? 'Tulis komentar dari kutipan di atas...'
                      : 'Ketik catatan penting...'
                  }
                  className="form-input text-[11px] resize-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">Ctrl+Enter untuk simpan</span>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={notesSaving || (!newNoteInput.trim() && !selectedQuote)}
                    className="btn btn-primary btn-sm text-[11px] px-3 py-1.5 disabled:opacity-60"
                  >
                    <Icon name="plus" size={12} className="mr-1" />
                    {notesSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>

              {/* List of Notes */}
              <div className="p-3 flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-semibold">Daftar Catatan ({notes.length})</span>

                {notes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {notes.map(note => (
                      <div
                        key={note.id}
                        className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1.5 text-[11px]"
                      >
                        {note.selected_text && (
                          <p className="border-l-2 border-amber-400 pl-2 text-slate-500 italic line-clamp-2">
                            &ldquo;{note.selected_text}&rdquo;
                          </p>
                        )}
                        {note.note_text && (
                          <p className="font-medium text-navy-dark leading-relaxed whitespace-pre-wrap">
                            {note.note_text}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>{new Date(note.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-400 hover:text-red-600 font-semibold flex items-center gap-0.5"
                          >
                            <Icon name="xmark" size={11} />
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-3 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <Icon name="pencil-1" size={22} className="mx-auto mb-1.5 opacity-40" />
                    <p className="text-[11px] font-semibold">Belum ada catatan.</p>
                    <p className="text-[10px] mt-0.5 leading-relaxed">
                      Sorot kalimat di modul atau ketik catatan di atas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
