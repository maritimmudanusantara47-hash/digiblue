'use client';

import React, { useEffect, useState } from 'react';
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
  serial_no: { top: 13.0, right: 14.0, width: 105, font_size: 8.8, label: 'Nomor Seri (Top-Right)' },
  recipient_name: { top: 67.0, font_size: 27, label: 'Nama Peserta' },
  ribbon_text: { top: 100.5, height: 14.0, font_size: 14.5, label: 'Teks Ribbon' },
  level_value: { top: 124.5, font_size: 11.5, label: 'Level Sertifikasi' },
  meta_block: { top: 138.2, font_size: 8.4, label: 'Grade, Tanggal & Tempat' },
  qr_left: { top: 147.5, left: 67.0, size: 26, label: 'QR Kiri' },
  qr_right: { top: 147.5, left: 196.4, size: 26, label: 'QR Kanan' },
};

const PRESETS = {
  nabila: { name: 'Nabila Azzahro Widodo', serial: 'CBEC/BCB/ID/IX/20260022', ribbon: 'Certified Blue Economist in Blue Carbon - CBEc. (Carb.)', level: 'Blue Carbon Specialization', grade: 'Excellent', date: 'September 21, 2026', place: 'Jakarta' },
  budi: { name: 'Budi Santoso', serial: 'CBEC/ID/III/20260102', ribbon: 'Certified Blue Economist (CBEc) — Foundation Level', level: 'Foundation Level', grade: 'Excellent', date: 'October 2, 2026', place: 'Jakarta, Indonesia' },
};

const CANVAS_W = 880;
const CANVAS_H = Math.round(CANVAS_W * (210 / 297));
const SCALE = CANVAS_W / 297;
const mmToPx = (mm: number) => mm * SCALE;

const FIELD_LIST = [
  { key: 'recipient_name', label: 'Nama Peserta' },
  { key: 'ribbon_text', label: 'Teks Ribbon' },
  { key: 'serial_no', label: 'Nomor Seri' },
  { key: 'level_value', label: 'Level Sertifikasi' },
  { key: 'meta_block', label: 'Grade, Tanggal & Tempat' },
  { key: 'qr_left', label: 'QR Kiri' },
  { key: 'qr_right', label: 'QR Kanan' },
];

export default function CertificateTemplateAdminPage() {
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState('recipient_name');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sample, setSample] = useState(PRESETS.nabila);
  const [openSection, setOpenSection] = useState<'fields' | 'preview' | null>('fields');

  useEffect(() => {
    api.get('/admin/certificates/template/layout').then(res => {
      if (res.data?.data && Object.keys(res.data.data).length > 0)
        setLayout(prev => ({ ...prev, ...res.data.data }));
    }).catch(() => { });

    api.get('/admin/certificates/template/image').then(res => {
      const { base64, mime_type } = res.data.data;
      setTemplateImg(`data:${mime_type};base64,${base64}`);
    }).catch(() => { });
  }, []);

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
      <header className="flex-shrink-0 z-30 bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/certificates" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition">
            <Ico.Back /> Keluar ke Admin
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Template Sertifikat Designer</h1>
            <p className="text-[11px] text-slate-500">A4 Landscape · 297 × 210 mm</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview sample toggle */}
          <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            <button onClick={() => setSample(PRESETS.nabila)} className={`text-xs px-2.5 py-1 rounded-md transition ${sample.name.includes('Nabila') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Spesialisasi
            </button>
            <button onClick={() => setSample(PRESETS.budi)} className={`text-xs px-2.5 py-1 rounded-md transition ${sample.name.includes('Budi') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Foundation
            </button>
          </div>

          {/* Edit mode toggle */}
          <button onClick={() => setEditMode(v => !v)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${editMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}>
            <Ico.Edit /> {editMode ? 'Mode Edit' : 'Edit Posisi'}
          </button>

          <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition">
            <Ico.Download /> {downloading ? 'Mengunduh...' : 'Unduh PDF'}
          </button>

          <button onClick={handleReset} disabled={resetting} title="Reset semua posisi ke default" className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${resetOk ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
            <Ico.Reset /> {resetOk ? 'Direset!' : 'Reset'}
          </button>

          <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition ${savedOk ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {savedOk ? <><Ico.Check /> Tersimpan</> : <><Ico.Save /> {saving ? 'Menyimpan...' : 'Simpan'}</>}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Canvas */}
        <main className="flex-1 overflow-auto p-6 flex flex-col items-center gap-3 bg-[#0a0a0f]">
          {editMode && (
            <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/50 border border-blue-800/50 px-3 py-1.5 rounded-lg">
              <Ico.Edit /> Klik elemen di sertifikat untuk memilih dan mengatur posisinya
            </div>
          )}

          <div className="relative shadow-2xl rounded overflow-hidden border border-slate-800 bg-[#F8F8F8]"
            style={{ width: CANVAS_W, height: CANVAS_H }}>

            {templateImg
              ? <img src={templateImg} alt="Template" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template...</div>
            }

            {/* Serial Number */}
            <div onClick={() => { setSelectedKey('serial_no'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'serial_no' ? 'ring-2 ring-blue-500 bg-blue-50/70 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.serial_no?.top ?? 13), right: mmToPx(layout.serial_no?.right ?? 14), width: mmToPx(layout.serial_no?.width ?? 105), height: mmToPx(7.5), lineHeight: `${mmToPx(7.5)}px`, backgroundColor: '#F8F8F8', fontSize: `${(layout.serial_no?.font_size ?? 8.8) * (SCALE / 3.4)}px`, fontFamily: 'Arial, sans-serif', color: '#111827', textAlign: 'right', zIndex: 10 }}>
              Certificate Serial No. {sample.serial}
            </div>

            {/* Recipient Name */}
            <div onClick={() => { setSelectedKey('recipient_name'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'recipient_name' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.recipient_name?.top ?? 67), left: 0, right: 0, height: mmToPx(16), lineHeight: `${mmToPx(16)}px`, textAlign: 'center', fontSize: `${(layout.recipient_name?.font_size ?? 27) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000', fontFamily: 'Arial, sans-serif', zIndex: 10 }}>
              {sample.name}
            </div>

            {/* Ribbon Text */}
            <div onClick={() => { setSelectedKey('ribbon_text'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'ribbon_text' ? 'ring-2 ring-blue-500 bg-amber-400/10 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.ribbon_text?.top ?? 100.5), left: mmToPx(20), right: mmToPx(20), height: mmToPx(layout.ribbon_text?.height ?? 14), lineHeight: `${mmToPx(layout.ribbon_text?.height ?? 14)}px`, textAlign: 'center', fontSize: `${(layout.ribbon_text?.font_size ?? 14.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#173874', fontFamily: 'Arial, sans-serif', zIndex: 10 }}>
              {sample.ribbon}
            </div>

            {/* Level */}
            <div onClick={() => { setSelectedKey('level_value'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'level_value' ? 'ring-2 ring-blue-500 bg-blue-50/30 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.level_value?.top ?? 124.5), left: 0, right: 0, textAlign: 'center', fontSize: `${(layout.level_value?.font_size ?? 11.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000', fontFamily: 'Arial, sans-serif', zIndex: 10 }}>
              {sample.level}
            </div>

            {/* Meta Block */}
            <div onClick={() => { setSelectedKey('meta_block'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'meta_block' ? 'ring-2 ring-blue-500 bg-blue-50/50 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.meta_block?.top ?? 138.2), left: mmToPx(103.5), width: mmToPx(90), height: mmToPx(18.5), backgroundColor: '#F8F8F8', textAlign: 'center', fontSize: `${(layout.meta_block?.font_size ?? 8.4) * (SCALE / 3.4)}px`, lineHeight: 1.55, color: '#111827', fontFamily: 'Arial, sans-serif', zIndex: 10 }}>
              <div><strong>Grade:</strong> {sample.grade}</div>
              <div><strong>Date of issue:</strong> {sample.date}</div>
              <div><strong>Place of issue:</strong> {sample.place}</div>
            </div>

            {/* QR Left */}
            <div onClick={() => { setSelectedKey('qr_left'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer ${editMode && selectedKey === 'qr_left' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.qr_left?.top ?? 147.5), left: mmToPx(layout.qr_left?.left ?? 67), width: mmToPx(layout.qr_left?.size ?? 26), height: mmToPx(layout.qr_left?.size ?? 26), zIndex: 10 }}>
              <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                <Ico.QR />
              </div>
            </div>

            {/* QR Right */}
            <div onClick={() => { setSelectedKey('qr_right'); if (!editMode) setEditMode(true); }}
              className={`absolute cursor-pointer ${editMode && selectedKey === 'qr_right' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
              style={{ top: mmToPx(layout.qr_right?.top ?? 147.5), left: mmToPx(layout.qr_right?.left ?? 196.4), width: mmToPx(layout.qr_right?.size ?? 26), height: mmToPx(layout.qr_right?.size ?? 26), zIndex: 10 }}>
              <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                <Ico.QR />
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-[11px]">
            A4 Landscape (297×210mm) · Klik elemen di sertifikat atau aktifkan "Edit Posisi" untuk mengatur
          </p>
        </main>

        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">

            {/* Section: Field Selector */}
            <div>
              <button onClick={() => setOpenSection(openSection === 'fields' ? null : 'fields')}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition">
                <span className="flex items-center gap-2"><Ico.Edit /> Pilih Elemen Teks</span>
                <span className={`transition-transform ${openSection === 'fields' ? 'rotate-180' : ''}`}><Ico.ChevronDown /></span>
              </button>

              {openSection === 'fields' && (
                <div className="px-3 pb-3 space-y-1">
                  {FIELD_LIST.map(({ key, label }) => (
                    <button key={key} onClick={() => { setSelectedKey(key); setEditMode(true); }}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${selectedKey === key ? 'bg-blue-600/25 text-blue-200 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                      {label}
                      {selectedKey === key && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Controls for selected field */}
            {sel && editMode && (
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{sel.label}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">mm</span>
                </div>

                {/* Top */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400">Posisi Vertikal</span>
                    <span className="font-mono text-blue-400">{sel.top} mm</span>
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
                      <span className="font-mono text-blue-400">{sel.left} mm</span>
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
                      <span className="font-mono text-blue-400">{sel.right} mm</span>
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
                      <span className="font-mono text-blue-400">{sel.font_size} pt</span>
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
                      <span className="font-mono text-blue-400">{sel.size} mm</span>
                    </div>
                    <input type="range" min="15" max="40" step="1" value={sel.size}
                      onChange={e => updateField(selectedKey, 'size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                <button onClick={() => handleResetField(selectedKey)}
                  className="w-full text-[11px] text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1.5 pt-1 transition">
                  <Ico.Reset /> Reset "{sel.label}" ke default
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
                  {[
                    { label: 'Nama Peserta', key: 'name', full: true },
                    { label: 'Teks Ribbon', key: 'ribbon', full: true },
                    { label: 'Level', key: 'level', full: false },
                    { label: 'Grade', key: 'grade', full: false },
                    { label: 'Tanggal', key: 'date', full: false },
                    { label: 'Tempat', key: 'place', full: false },
                  ].reduce<React.ReactNode[]>((acc, field, idx, arr) => {
                    if (!field.full && idx > 0 && !arr[idx - 1].full) {
                      // Group pairs in a grid
                      return acc;
                    }
                    if (field.full) {
                      acc.push(
                        <div key={field.key}>
                          <label className="text-[11px] text-slate-500 block mb-1">{field.label}</label>
                          <input type="text" value={sample[field.key as keyof typeof sample]}
                            onChange={e => setSample({ ...sample, [field.key]: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                        </div>
                      );
                    } else {
                      // Find pair
                      const next = arr[idx + 1];
                      if (next && !next.full) {
                        acc.push(
                          <div key={field.key} className="grid grid-cols-2 gap-2">
                            {[field, next].map(f => (
                              <div key={f.key}>
                                <label className="text-[11px] text-slate-500 block mb-1">{f.label}</label>
                                <input type="text" value={sample[f.key as keyof typeof sample]}
                                  onChange={e => setSample({ ...sample, [f.key]: e.target.value })}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                              </div>
                            ))}
                          </div>
                        );
                      } else if (!next || next.full) {
                        acc.push(
                          <div key={field.key}>
                            <label className="text-[11px] text-slate-500 block mb-1">{field.label}</label>
                            <input type="text" value={sample[field.key as keyof typeof sample]}
                              onChange={e => setSample({ ...sample, [field.key]: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                          </div>
                        );
                      }
                    }
                    return acc;
                  }, [])}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-4 py-3 flex gap-2.5 items-start">
              <span className="text-blue-400 mt-0.5 shrink-0"><Ico.Info /></span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Perubahan yang disimpan akan otomatis digunakan saat mengunduh sertifikat PDF resmi.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
