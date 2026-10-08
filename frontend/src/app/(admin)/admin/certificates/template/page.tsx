'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

/* ─── Icons ─────────────────────────────────────────────────────── */
const Ico = {
  Back: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>,
  Save: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  Reset: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  QR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  ZoomIn: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Fit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  Sliders: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  Close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

/* ─── Types ──────────────────────────────────────────────────────── */
interface FieldConfig {
  top: number;
  right?: number;
  left?: number;
  width?: number;
  height?: number;
  font_size?: number;
  size?: number;
  label: string;
}
type LayoutState = Record<string, FieldConfig>;

const DEFAULT_LAYOUT: LayoutState = {
  serial_no: { top: 13.0, right: 16.5, width: 105, font_size: 11.0, label: 'Nomor Seri (Top-Right)' },
  recipient_name: { top: 69.5, font_size: 32.5, label: 'Nama Peserta' },
  ribbon_text: { top: 99.0, height: 14.0, font_size: 22.5, label: 'Teks Ribbon' },
  level_value: { top: 122.8, font_size: 14.5, label: 'Level Sertifikasi' },
  meta_block: { top: 138.0, font_size: 10.5, label: 'Grade, Tanggal & Tempat' },
  qr_left: { top: 147.5, left: 67.0, size: 26, label: 'QR Kiri' },
  qr_right: { top: 147.5, left: 196.4, size: 26, label: 'QR Kanan' },
  back_title: { top: 20.0, font_size: 15.0, label: 'Judul Halaman Belakang' },
};

const PRESETS = {
  nabila: { name: 'Nabila Azzahro Widodo', serial: 'CBEC/ID/IX/20260187', ribbon: 'Certified Blue Economist in Blue Carbon - CBEc. (Carb.)', level: 'Blue Carbon Specialization', grade: 'Excellent', date: 'September 21, 2026', place: 'Jakarta' },
  budi: { name: 'Budi Santoso', serial: 'CBEC/ID/IX/20260187', ribbon: 'Certified Blue Economist (CBEc)', level: 'Foundation Level', grade: 'Excellent', date: 'October 2, 2026', place: 'Jakarta, Indonesia' },
};

// Ukuran virtual canvas A4 Landscape (297 × 210 mm)
const CANVAS_W = 880;
const CANVAS_H = Math.round(CANVAS_W * (210 / 297)); // ~622px
const SCALE = CANVAS_W / 297;
const mmToPx = (mm: number) => mm * SCALE;

const FIELD_LIST_FRONT = [
  { key: 'recipient_name', label: 'Nama Peserta' },
  { key: 'ribbon_text', label: 'Teks Ribbon' },
  { key: 'serial_no', label: 'Nomor Seri' },
  { key: 'level_value', label: 'Level Sertifikasi' },
  { key: 'meta_block', label: 'Grade, Tanggal & Tempat' },
  { key: 'qr_left', label: 'QR Kiri' },
  { key: 'qr_right', label: 'QR Kanan' },
];

const FIELD_LIST_BACK = [
  { key: 'back_title', label: 'Judul Halaman Belakang' },
];

export default function CertificateTemplateAdminPage() {
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [templateImgSpec, setTemplateImgSpec] = useState<string | null>(null);
  const [templateImgFound, setTemplateImgFound] = useState<string | null>(null);
  const [templateBackImg, setTemplateBackImg] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedKey, setSelectedKey] = useState('recipient_name');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sample, setSample] = useState(PRESETS.nabila);
  const [openSection, setOpenSection] = useState<'fields' | 'preview' | null>('fields');

  // Multi-device responsive states & auto-fit zoom
  const mainRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    api.get('/admin/certificates/template/layout').then(res => {
      if (res.data?.data && Object.keys(res.data.data).length > 0)
        setLayout(prev => ({ ...prev, ...res.data.data }));
    }).catch(() => { });

    api.get('/admin/certificates/template/image').then(res => {
      const { base64, mime_type, foundation_base64, back_base64, back_mime_type } = res.data.data;
      if (base64) {
        const specUrl = `data:${mime_type || 'image/png'};base64,${base64}`;
        setTemplateImg(specUrl);
        setTemplateImgSpec(specUrl);
      }
      if (foundation_base64) {
        setTemplateImgFound(`data:image/png;base64,${foundation_base64}`);
      }
      if (back_base64) setTemplateBackImg(`data:${back_mime_type || 'image/png'};base64,${back_base64}`);
    }).catch(() => { });
  }, []);

  // Monitor container size dynamically across laptops, tablets, and phones
  useEffect(() => {
    if (!mainRef.current) return;
    const updateSize = () => {
      if (mainRef.current) {
        setContainerSize({
          width: mainRef.current.clientWidth,
          height: mainRef.current.clientHeight,
        });
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(mainRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Hitung skala otomatis agar sertifikat A4 muat 100% di layar laptop tanpa terpotong
  const fitScale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 0.72;
    // Berikan margin/padding aman
    const padX = 36;
    const padY = 72; // ruang untuk toolbar dan hint teks
    const availW = Math.max(160, containerSize.width - padX);
    const availH = Math.max(160, containerSize.height - padY);
    const scaleX = availW / CANVAS_W;
    const scaleY = availH / CANVAS_H;
    // Batasi maksimum 1.1x agar tidak pecah, minimum muat utuh
    return Math.min(scaleX, scaleY, 1.1);
  }, [containerSize]);

  const effectiveScale = useMemo(() => {
    if (zoomMode === 'fit') return fitScale;
    return zoomMode;
  }, [zoomMode, fitScale]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/certificates/template/layout', { fields: layout });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch { alert('Gagal menyimpan.'); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const clean: LayoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
      setLayout(clean);
      setSample(PRESETS.nabila);
      await api.put('/admin/certificates/template/layout', { fields: clean });
      setResetOk(true);
      setTimeout(() => setResetOk(false), 2500);
    } catch { alert('Gagal reset.'); }
    finally { setResetting(false); }
  };

  const handleResetField = (key: string) => {
    if (DEFAULT_LAYOUT[key]) setLayout(prev => ({ ...prev, [key]: { ...DEFAULT_LAYOUT[key] } }));
  };

  const updateField = (key: string, prop: keyof FieldConfig, val: number) => {
    setLayout(prev => ({ ...prev, [key]: { ...prev[key], [prop]: val } }));
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await api.get('/admin/certificates/1/download', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'Contoh-Sertifikat.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert('Gagal mengunduh PDF.'); }
    finally { setDownloading(false); }
  };

  const sel = layout[selectedKey];

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">

      {/* ── Header ── */}
      <header className="flex-shrink-0 z-30 bg-slate-900 border-b border-slate-800 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/admin/certificates" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 transition">
            <Ico.Back /> <span className="hidden sm:inline">Keluar ke Admin</span><span className="sm:hidden">Kembali</span>
          </Link>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white leading-tight">Template Sertifikat Designer</h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500">A4 Landscape · 297 × 210 mm</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Page side toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => { setActiveSide('front'); setSelectedKey('recipient_name'); }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${activeSide === 'front' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              Halaman Depan
            </button>
            <button
              type="button"
              onClick={() => { setActiveSide('back'); setSelectedKey('back_title'); }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${activeSide === 'back' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              Halaman Belakang
            </button>
          </div>

          {/* Preview sample toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            <button onClick={() => setSample(PRESETS.nabila)} className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${sample.name.includes('Nabila') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
              Spesialisasi
            </button>
            <button onClick={() => setSample(PRESETS.budi)} className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${sample.name.includes('Budi') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}>
              Foundation
            </button>
          </div>

          {/* Edit mode toggle */}
          <button onClick={() => setEditMode(v => !v)} className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition ${editMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}>
            <Ico.Edit /> <span className="hidden sm:inline">{editMode ? 'Mode Edit' : 'Edit Posisi'}</span>
          </button>

          {/* Toggle Panel di Layar Mobile/Tablet */}
          <button
            onClick={() => setMobilePanelOpen(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${mobilePanelOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
            title="Buka panel pengaturan posisi"
          >
            <Ico.Sliders />
            <span className="text-[11px]">Pengaturan</span>
          </button>

          <button onClick={handleDownload} disabled={downloading} className="hidden md:flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition">
            <Ico.Download /> <span className="hidden lg:inline">{downloading ? 'Mengunduh...' : 'Unduh PDF'}</span>
          </button>

          <button onClick={handleReset} disabled={resetting} title="Reset semua posisi ke default" className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition ${resetOk ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
            <Ico.Reset /> <span className="hidden xl:inline">{resetOk ? 'Direset!' : 'Reset'}</span>
          </button>

          <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-1.5 rounded-lg transition shadow-sm ${savedOk ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {savedOk ? <><Ico.Check /> Tersimpan</> : <><Ico.Save /> {saving ? 'Menyimpan...' : 'Simpan'}</>}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">

        {/* Backdrop untuk drawer mobile */}
        {mobilePanelOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobilePanelOpen(false)}
          />
        )}

        {/* Canvas Area */}
        <main
          ref={mainRef}
          className="flex-1 overflow-auto p-3 sm:p-5 flex flex-col items-center justify-between gap-3 bg-[#0a0a0f] relative"
        >
          {editMode && (
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-blue-300 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-lg shadow-sm">
              <Ico.Edit /> Klik teks di sertifikat atau pilih menu di kanan untuk menggeser posisi
            </div>
          )}

          {/* Scaled Canvas Container (Menjaga rasio dan tidak pernah terpotong) */}
          <div
            className="relative flex items-center justify-center my-auto transition-all duration-150"
            style={{
              width: Math.round(CANVAS_W * effectiveScale),
              height: Math.round(CANVAS_H * effectiveScale),
              minWidth: Math.round(CANVAS_W * effectiveScale),
              minHeight: Math.round(CANVAS_H * effectiveScale),
            }}
          >
            <div
              className="relative shadow-2xl rounded overflow-hidden border border-slate-800 bg-[#F8F8F8]"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {activeSide === 'front' ? (
                <>
                  {/* FRONT TEMPLATE */}
                  {(() => {
                    const isFoundationSample = sample.level.toLowerCase().includes('foundation');
                    const activeFrontImg = isFoundationSample ? (templateImgFound || templateImg) : (templateImgSpec || templateImg);
                    return activeFrontImg
                      ? <img src={activeFrontImg} alt="Template" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                      : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template depan...</div>;
                  })()}

                  {/* Serial Number */}
                  <div
                    onClick={() => { setSelectedKey('serial_no'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'serial_no' ? 'ring-2 ring-blue-500 bg-blue-50/70 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.serial_no?.top ?? 13), right: mmToPx(layout.serial_no?.right ?? 16.5), width: mmToPx(layout.serial_no?.width ?? 105), height: mmToPx(7.5), lineHeight: `${mmToPx(7.5)}px`, backgroundColor: 'transparent', fontSize: `${(layout.serial_no?.font_size ?? 11) * (SCALE / 3.4)}px`, fontFamily: "'Poppins', sans-serif", color: '#111827', textAlign: 'right', zIndex: 10 }}
                  >
                    Certificate Serial No. {sample.serial}
                  </div>

                  {/* Recipient Name */}
                  <div
                    onClick={() => { setSelectedKey('recipient_name'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'recipient_name' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.recipient_name?.top ?? 69.5), left: 0, right: 0, height: mmToPx(16), lineHeight: `${mmToPx(16)}px`, textAlign: 'center', fontSize: `${(layout.recipient_name?.font_size ?? 32.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                  >
                    {sample.name}
                  </div>

                  {/* Ribbon Text */}
                  <div
                    onClick={() => { setSelectedKey('ribbon_text'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'ribbon_text' ? 'ring-2 ring-blue-500 bg-amber-400/10 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.ribbon_text?.top ?? 100.5), left: mmToPx(20), right: mmToPx(20), height: mmToPx(layout.ribbon_text?.height ?? 14), lineHeight: `${mmToPx(layout.ribbon_text?.height ?? 14)}px`, textAlign: 'center', fontSize: `${(layout.ribbon_text?.font_size ?? 22.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#173874', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                  >
                    {sample.ribbon}
                  </div>

                  {/* Level */}
                  <div
                    onClick={() => { setSelectedKey('level_value'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'level_value' ? 'ring-2 ring-blue-500 bg-blue-50/30 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.level_value?.top ?? 124.5), left: 0, right: 0, textAlign: 'center', fontSize: `${(layout.level_value?.font_size ?? 14.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000', fontFamily: "'Poppins', sans-serif", zIndex: 10 }}
                  >
                    {sample.level}
                  </div>

                  {/* Meta Block */}
                  <div
                    onClick={() => { setSelectedKey('meta_block'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'meta_block' ? 'ring-2 ring-blue-500 bg-blue-50/50 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.meta_block?.top ?? 138.2), left: mmToPx(103.5), width: mmToPx(90), height: mmToPx(18.5), backgroundColor: '#F8F8F8', textAlign: 'center', fontSize: `${(layout.meta_block?.font_size ?? 11.5) * (SCALE / 3.4)}px`, lineHeight: 1.55, color: '#111827', fontFamily: "'Poppins', sans-serif", zIndex: 10 }}
                  >
                    <div><strong>Grade:</strong> {sample.grade}</div>
                    <div><strong>Date of issue:</strong> {sample.date}</div>
                    <div><strong>Place of issue:</strong> {sample.place}</div>
                  </div>

                  {/* QR Left */}
                  <div
                    onClick={() => { setSelectedKey('qr_left'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'qr_left' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.qr_left?.top ?? 147.5), left: mmToPx(layout.qr_left?.left ?? 67), width: mmToPx(layout.qr_left?.size ?? 26), height: mmToPx(layout.qr_left?.size ?? 26), zIndex: 10 }}
                  >
                    <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                      <Ico.QR />
                    </div>
                  </div>

                  {/* QR Right */}
                  <div
                    onClick={() => { setSelectedKey('qr_right'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'qr_right' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{ top: mmToPx(layout.qr_right?.top ?? 147.5), left: mmToPx(layout.qr_right?.left ?? 196.4), width: mmToPx(layout.qr_right?.size ?? 26), height: mmToPx(layout.qr_right?.size ?? 26), zIndex: 10 }}
                  >
                    <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                      <Ico.QR />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* BACK TEMPLATE */}
                  {templateBackImg
                    ? <img src={templateBackImg} alt="Template Belakang" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template belakang...</div>
                  }

                  {/* Back Side Title Block */}
                  <div
                    onClick={() => { setSelectedKey('back_title'); setEditMode(true); setMobilePanelOpen(true); }}
                    className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'back_title' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded p-1.5' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                    style={{
                      top: mmToPx(layout.back_title?.top ?? 20.0),
                      left: mmToPx(20),
                      right: mmToPx(20),
                      textAlign: 'center',
                      fontFamily: "'Poppins', sans-serif",
                      zIndex: 10,
                    }}
                  >
                    {sample.name.includes('Budi') ? (
                      <>
                        <div style={{ fontSize: `${(layout.back_title?.font_size ?? 15.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000000', lineHeight: 1.25 }}>
                          List of Competency Units of Certified Blue Economist (CBEc)
                        </div>
                        <div style={{ fontSize: `${Math.max(10, (layout.back_title?.font_size ?? 15.0) - 2.0) * (SCALE / 3.4)}px`, fontWeight: 400, color: '#000000', marginTop: `${mmToPx(2.2)}px`, lineHeight: 1.2 }}>
                          Foundation Level
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: `${(layout.back_title?.font_size ?? 15.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000000', lineHeight: 1.25, marginTop: `${mmToPx(3.5)}px` }}>
                        List of Competency Units of {sample.ribbon}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Toolbar: Auto Fit & Zoom Controls */}
          <div className="flex items-center justify-between w-full max-w-xl gap-2 pt-1 flex-wrap">
            <span className="text-slate-500 text-[10px] sm:text-[11px] truncate">
              A4 (297×210mm) · Skala layar: <strong className="text-slate-300">{Math.round(effectiveScale * 100)}%</strong>
            </span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-md ml-auto">
              <button
                type="button"
                onClick={() => {
                  const current = effectiveScale;
                  setZoomMode(Math.max(0.4, Number((current - 0.1).toFixed(2))));
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Perkecil (-)"
              >
                <Ico.ZoomOut />
              </button>

              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${zoomMode === 'fit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Sesuaikan otomatis dengan layar laptop/perangkat"
              >
                Fit Layar
              </button>

              <button
                type="button"
                onClick={() => setZoomMode(0.75)}
                className={`px-1.5 py-0.5 rounded text-[11px] transition ${zoomMode === 0.75 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                75%
              </button>

              <button
                type="button"
                onClick={() => setZoomMode(1.0)}
                className={`px-1.5 py-0.5 rounded text-[11px] transition ${zoomMode === 1.0 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                100%
              </button>

              <button
                type="button"
                onClick={() => {
                  const current = effectiveScale;
                  setZoomMode(Math.min(1.5, Number((current + 0.1).toFixed(2))));
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Perbesar (+)"
              >
                <Ico.ZoomIn />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar Controls (Responsif: Docked di desktop, Slide-over di laptop kecil/tablet/HP) */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-40 w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden transition-transform duration-200 ease-in-out ${
            mobilePanelOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Mobile drawer header */}
          <div className="lg:hidden px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Ico.Sliders /> Pengaturan Elemen Sertifikat
            </span>
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Ico.Close />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">

            {activeSide === 'back' && (
              <div className="p-3 bg-indigo-950/40 border-b border-indigo-800/40 text-[11px] text-indigo-200">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Ico.Info /> Desain Halaman Belakang
                </div>
                Template background unit kompetensi resmi konsorsium. Judul di atas tabel dirender dinamis dengan font <strong>Poppins</strong> sesuai program.
              </div>
            )}

            {/* Section: Field Selector */}
            <div>
              <button onClick={() => setOpenSection(openSection === 'fields' ? null : 'fields')}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition">
                <span className="flex items-center gap-2"><Ico.Edit /> Pilih Elemen Teks</span>
                <span className={`transition-transform ${openSection === 'fields' ? 'rotate-180' : ''}`}><Ico.ChevronDown /></span>
              </button>

              {openSection === 'fields' && (
                <div className="px-3 pb-3 space-y-1">
                  {(activeSide === 'front' ? FIELD_LIST_FRONT : FIELD_LIST_BACK).map(({ key, label }) => (
                    <button key={key} onClick={() => { setSelectedKey(key); setEditMode(true); }}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${selectedKey === key ? 'bg-blue-600/25 text-blue-200 border border-blue-500/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                      {label}
                      {selectedKey === key && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Controls for selected field */}
            {sel && (
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{sel.label}</span>
                  <div className="flex items-center gap-1.5">
                    {['recipient_name', 'ribbon_text'].includes(selectedKey) && (
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded font-medium">Arial MT Pro</span>
                    )}
                    {['serial_no', 'level_value', 'meta_block', 'back_title'].includes(selectedKey) && (
                      <span className="text-[10px] text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded font-medium">Poppins</span>
                    )}
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">mm</span>
                  </div>
                </div>

                {/* Top */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400">Posisi Vertikal (Top)</span>
                    <span className="font-mono text-blue-400 font-bold">{sel.top} mm</span>
                  </div>
                  <input type="range" min="5" max="190" step="0.5" value={sel.top}
                    onChange={e => updateField(selectedKey, 'top', parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                </div>

                {/* Left */}
                {typeof sel.left === 'number' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Posisi Horizontal (Left)</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.left} mm</span>
                    </div>
                    <input type="range" min="10" max="250" step="0.5" value={sel.left ?? 0}
                      onChange={e => updateField(selectedKey, 'left', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                {/* Right */}
                {typeof sel.right === 'number' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Posisi Horizontal (Right)</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.right} mm</span>
                    </div>
                    <input type="range" min="5" max="100" step="0.5" value={sel.right ?? 0}
                      onChange={e => updateField(selectedKey, 'right', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                {/* Font size */}
                {sel.font_size !== undefined && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Ukuran Huruf</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.font_size} pt</span>
                    </div>
                    <input type="range" min="7" max="40" step="0.5" value={sel.font_size}
                      onChange={e => updateField(selectedKey, 'font_size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                {/* QR size */}
                {sel.size !== undefined && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Ukuran QR</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.size} mm</span>
                    </div>
                    <input type="range" min="15" max="40" step="1" value={sel.size}
                      onChange={e => updateField(selectedKey, 'size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                <button onClick={() => handleResetField(selectedKey)}
                  className="w-full text-[11px] text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1.5 pt-1 transition cursor-pointer">
                  <Ico.Reset /> Reset &quot;{sel.label}&quot; ke default
                </button>
              </div>
            )}

            {/* Section: Live Test Inputs */}
            <div>
              <button onClick={() => setOpenSection(openSection === 'preview' ? null : 'preview')}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition">
                <span className="flex items-center gap-2"><Ico.Eye /> Uji Coba Teks</span>
                <span className={`transition-transform ${openSection === 'preview' ? 'rotate-180' : ''}`}><Ico.ChevronDown /></span>
              </button>

              {openSection === 'preview' && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Nomor Seri */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-500">Nomor Seri</label>
                      <button
                        type="button"
                        onClick={() => {
                          const match = sample.serial.match(/(20\d{2}[\/\-_]?)(\d+)/);
                          if (match) {
                            const prefix = match[1];
                            const numStr = match[2];
                            const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
                            const nextSerial = sample.serial.replace(`${prefix}${numStr}`, `${prefix}${nextNum}`);
                            setSample({ ...sample, serial: nextSerial });
                          }
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                        title="Klik untuk menaikkan nomor urut berikutnya (+1)"
                      >
                        +1 Urutan Selanjutnya
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sample.serial}
                      onChange={e => setSample({ ...sample, serial: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="Contoh: CBEC/ID/IX/20260187"
                    />
                  </div>

                  {/* Nama Peserta */}
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Nama Peserta</label>
                    <input
                      type="text"
                      value={sample.name}
                      onChange={e => setSample({ ...sample, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Teks Ribbon */}
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Teks Ribbon</label>
                    <input
                      type="text"
                      value={sample.ribbon}
                      onChange={e => setSample({ ...sample, ribbon: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Level & Grade */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Level</label>
                      <input
                        type="text"
                        value={sample.level}
                        onChange={e => setSample({ ...sample, level: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Grade</label>
                      <input
                        type="text"
                        value={sample.grade}
                        onChange={e => setSample({ ...sample, grade: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Date of issue & Place of issue */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Date of issue</label>
                      <input
                        type="text"
                        value={sample.date}
                        onChange={e => setSample({ ...sample, date: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Place of issue</label>
                      <input
                        type="text"
                        value={sample.place}
                        onChange={e => setSample({ ...sample, place: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-4 py-3 flex gap-2.5 items-start">
              <span className="text-blue-400 mt-0.5 shrink-0"><Ico.Info /></span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Perubahan posisi yang disimpan akan otomatis digunakan saat mengunduh sertifikat PDF resmi.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
