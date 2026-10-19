'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Icon from '@/components/Icon';
import Link from 'next/link';

interface NoteUser    { id: number; name: string; email: string }
interface NoteContent { id: number; title: string; content_type: string; section?: { title: string; course?: { id: number; title: string } } }
interface ModuleNote  {
  id: number;
  user: NoteUser;
  course_content: NoteContent;
  note_text: string | null;
  selected_text: string | null;
  created_at: string;
}

interface PaginatedResponse {
  data: ModuleNote[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function AdminModuleNotesPage() {
  const [notes, setNotes]       = useState<ModuleNote[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [meta, setMeta]         = useState({ last_page: 1, total: 0 });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse>('/admin/module-notes', {
        params: { search: debouncedSearch || undefined, page, per_page: 20 },
      });
      setNotes(res.data.data);
      setMeta({ last_page: res.data.last_page, total: res.data.total });
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-dark font-heading tracking-tight">Catatan Modul Siswa</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pantau catatan & kutipan yang dibuat siswa selama pembelajaran.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-72 shadow-xs">
          <Icon name="search" size={15} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau kata kunci..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400 text-navy-dark"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <Icon name="xmark" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 flex items-center gap-2 text-sm text-slate-500 shadow-xs">
        <Icon name="pencil-1" size={16} className="text-amber-500" />
        <span>Total <strong className="text-navy-dark">{meta.total}</strong> catatan ditemukan</span>
        {debouncedSearch && (
          <span className="ml-1 text-xs text-slate-400">untuk kata kunci &ldquo;{debouncedSearch}&rdquo;</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Memuat data...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Icon name="pencil-1" size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Belum ada catatan.</p>
            {debouncedSearch && <p className="text-xs mt-1">Coba ubah kata kunci pencarian.</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table Head */}
            <div className="hidden sm:grid grid-cols-[2fr_2fr_3fr_1fr] gap-4 px-5 py-3 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Siswa</span>
              <span>Modul</span>
              <span>Catatan</span>
              <span>Waktu</span>
            </div>

            {/* Rows */}
            {notes.map(note => (
              <div
                key={note.id}
                className="sm:grid sm:grid-cols-[2fr_2fr_3fr_1fr] gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors flex flex-col gap-2"
              >
                {/* Student */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-navy-dark text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {note.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-dark truncate">{note.user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{note.user.email}</p>
                  </div>
                </div>

                {/* Module */}
                <div className="min-w-0">
                  {note.course_content.section?.course && (
                    <p className="text-[10px] text-slate-400 truncate mb-0.5">
                      {note.course_content.section.course.title}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-navy-dark line-clamp-2 leading-snug">
                    {note.course_content.title}
                  </p>
                  {note.course_content.section && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {note.course_content.section.title}
                    </p>
                  )}
                </div>

                {/* Note Content */}
                <div className="space-y-1.5 min-w-0">
                  {note.selected_text && (
                    <p className="text-[11px] text-slate-500 italic border-l-2 border-amber-400 pl-2 line-clamp-2 leading-snug">
                      &ldquo;{note.selected_text}&rdquo;
                    </p>
                  )}
                  {note.note_text && (
                    <p className="text-[11px] text-navy-dark leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {note.note_text}
                    </p>
                  )}
                  {!note.note_text && !note.selected_text && (
                    <span className="text-[11px] text-slate-400 italic">—</span>
                  )}
                </div>

                {/* Time */}
                <div className="text-[10px] text-slate-400">
                  {formatDate(note.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500 px-2">
            Hal {page} / {meta.last_page}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
