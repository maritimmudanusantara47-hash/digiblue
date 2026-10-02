'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
/* ─── Lightweight Inline SVGs (No external dependencies) ─── */
function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconRotateCcw({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconCheckCircle2({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconAlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function IconQrCode({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
    </svg>
  );
}

function IconType({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconAward({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

/* ─── Types ──────────────────────────────────────────────────────── */
interface FieldConfig {
  top: number;
  right?: number | null;
  left?: number | null;
  width?: number;
  height?: number;
  font_size?: number;
  size?: number; // for QR codes
  label: string;
}

type LayoutState = Record<string, FieldConfig>;

/* Default perfected layout coordinates (matching reference image) */
const DEFAULT_LAYOUT: LayoutState = {
  serial_no: {
    top: 13.0,
    right: 14.0,
    width: 105,
    font_size: 8.8,
    label: 'Nomor Seri Sertifikat',
  },
  recipient_name: {
    top: 67.0,
    font_size: 27,
    label: 'Nama Penerima',
  },
  ribbon_text: {
    top: 100.5,
    height: 14.0,
    font_size: 14.5,
    label: 'Teks Ribbon Spesialisasi',
  },
  level_value: {
    top: 124.5,
    font_size: 11.5,
    label: 'Level Sertifikasi',
  },
  meta_block: {
    top: 138.2,
    font_size: 8.4,
    label: 'Grade, Tanggal & Tempat Terbit',
  },
  qr_left: {
    top: 147.5,
    left: 67.0,
    size: 26,
    label: 'Barcode / QR Kiri',
  },
  qr_right: {
    top: 147.5,
    left: 196.4,
    size: 26,
    label: 'Barcode / QR Kanan',
  },
};

/* Presets for live testing */
const PRESETS = {
  nabila: {
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCB/ID/IX/20260022',
    ribbon: 'Certified Blue Economist in Blue Carbon - CBEc. (Carb.)',
    level: 'Blue Carbon Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
  },
  budi: {
    name: 'Budi Santoso',
    serial: 'CBEC/ID/III/20260102',
    ribbon: 'Certified Blue Economist (CBEc) — Foundation Level',
    level: 'Foundation Level',
    grade: 'Excellent',
    date: 'October 2, 2026',
    place: 'Jakarta, Indonesia',
  },
};

/* A4 Landscape display scale */
const CANVAS_W = 920; // px width
const CANVAS_H = Math.round(CANVAS_W * (210 / 297)); // ≈ 650.5 px
const SCALE = CANVAS_W / 297; // px per mm (≈ 3.0976)

const mmToPx = (mm: number) => mm * SCALE;

export default function CertificateTemplateAdminPage() {
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('recipient_name');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sampleData, setSampleData] = useState(PRESETS.nabila);

  /* ── Load Layout & Template Image ── */
  useEffect(() => {
    // 1. Fetch layout
    api.get('/admin/certificates/template/layout')
      .then(res => {
        if (res.data?.data && Object.keys(res.data.data).length > 0) {
          setLayout(prev => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(() => {});

    // 2. Fetch template image
    api.get('/admin/certificates/template/image')
      .then(res => {
        const { base64, mime_type } = res.data.data;
        setTemplateImg(`data:${mime_type};base64,${base64}`);
      })
      .catch(() => {});
  }, []);

  /* ── Save Layout ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/certificates/template/layout', { fields: layout });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      alert('Gagal menyimpan layout. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset to Reference Layout (Deep clone & Auto-sync to backend) ── */
  const handleReset = async () => {
    try {
      setResetting(true);
      const cleanDefaults: LayoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
      setLayout(cleanDefaults);
      setSampleData(PRESETS.nabila);
      // Auto-save to backend API so PDF and preview stay in sync
      await api.put('/admin/certificates/template/layout', { fields: cleanDefaults });
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch {
      alert('Gagal mengembalikan layout ke posisi standar.');
    } finally {
      setResetting(false);
    }
  };

  /* ── Reset single field to default ── */
  const handleResetSingleField = (key: string) => {
    if (DEFAULT_LAYOUT[key]) {
      setLayout(prev => ({
        ...prev,
        [key]: { ...DEFAULT_LAYOUT[key] },
      }));
    }
  };

  /* ── Field update helper ── */
  const updateField = (key: string, prop: keyof FieldConfig, val: number) => {
    setLayout(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [prop]: val,
      },
    }));
  };

  /* ── Download Real PDF Sample (Authenticated Blob) ── */
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const res = await api.get('/admin/certificates/1/download', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contoh-Sertifikat-DigiBlueCamp.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh contoh PDF. Pastikan ada data sertifikat.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const selectedField = layout[selectedKey];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/certificates"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Desain & Template Sertifikat
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                A4 Landscape (297×210mm)
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Isi otomatis bagian sertifikat yang belum terisi (nama, ribbon, nomor seri, grade, barcode)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Preset Buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/70 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setSampleData(PRESETS.nabila)}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                sampleData.name.includes('Nabila')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Contoh: Nabila (Spesialisasi)
            </button>
            <button
              onClick={() => setSampleData(PRESETS.budi)}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                sampleData.name.includes('Budi')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Contoh: Budi (Foundation)
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <IconDownload className={`w-3.5 h-3.5 text-blue-400 ${downloadingPdf ? 'animate-bounce' : ''}`} />
            {downloadingPdf ? 'Mengunduh...' : 'Unduh Contoh PDF'}
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            title="Kembalikan semua posisi teks ke standar ideal referensi"
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition ${
              resetSuccess
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
            }`}
          >
            <IconRotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-amber-400' : ''}`} />
            {resetting ? 'Me-reset...' : resetSuccess ? 'Posisi Direset!' : 'Reset ke Default'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <IconCheckCircle2 className="w-4 h-4" />
                Tersimpan!
              </>
            ) : (
              <>
                <IconSave className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Layout'}
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Content Area (Split View) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: Certificate Canvas Area */}
        <main className="flex-1 overflow-auto p-6 flex flex-col items-center justify-start bg-slate-950/60">
          {/* Mode Switcher Banner */}
          <div className="w-full max-w-[920px] mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mode Tampilan:</span>
              <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex gap-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md transition font-medium ${
                    activeTab === 'preview'
                      ? 'bg-slate-800 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <IconEye className="w-3.5 h-3.5 text-emerald-400" />
                  Hasil Sertifikat (Final)
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md transition font-medium ${
                    activeTab === 'edit'
                      ? 'bg-slate-800 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <IconSliders className="w-3.5 h-3.5 text-blue-400" />
                  Mode Penyesuaian Posisi
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <IconSparkles className="w-3.5 h-3.5 text-amber-400" />
              Sertifikat terisi otomatis saat peserta menyelesaikan kursus
            </div>
          </div>

          {/* Certificate Canvas Box */}
          <div
            className="relative shadow-2xl rounded-sm overflow-hidden select-none border border-slate-800 bg-[#F8F8F8]"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
            }}
          >
            {/* Background Template */}
            {templateImg ? (
              <img
                src={templateImg}
                alt="Certificate Template"
                className="absolute inset-0 w-full h-full pointer-events-none object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                Memuat template sertifikat...
              </div>
            )}

            {/* 1. Serial Number (Top Right) */}
            <div
              onClick={() => setSelectedKey('serial_no')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'serial_no'
                  ? 'ring-2 ring-blue-500 bg-blue-50/80 rounded'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.serial_no?.top ?? 13.0),
                right: mmToPx(layout.serial_no?.right ?? 14.0),
                width: mmToPx(layout.serial_no?.width ?? 105),
                height: mmToPx(7.5),
                lineHeight: `${mmToPx(7.5)}px`,
                backgroundColor: '#F8F8F8',
                fontSize: `${(layout.serial_no?.font_size ?? 8.8) * (SCALE / 3.4)}px`,
                fontFamily: 'Arial, sans-serif',
                color: '#111827',
                textAlign: 'right',
                zIndex: 10,
              }}
            >
              Certificate Serial No. {sampleData.serial}
            </div>

            {/* 2. Recipient Name (Centered right above the blue line) */}
            <div
              onClick={() => setSelectedKey('recipient_name')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'recipient_name'
                  ? 'ring-2 ring-blue-500 bg-blue-50/30 rounded'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.recipient_name?.top ?? 67.0),
                left: 0,
                right: 0,
                height: mmToPx(16),
                lineHeight: `${mmToPx(16)}px`,
                textAlign: 'center',
                fontSize: `${(layout.recipient_name?.font_size ?? 27) * (SCALE / 3.4)}px`,
                fontWeight: 700,
                color: '#000000',
                letterSpacing: '0.3px',
                fontFamily: 'Arial, sans-serif',
                zIndex: 10,
              }}
            >
              {sampleData.name}
            </div>

            {/* 3. Ribbon Specialization Text */}
            <div
              onClick={() => setSelectedKey('ribbon_text')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'ribbon_text'
                  ? 'ring-2 ring-blue-500 bg-amber-500/20 rounded'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.ribbon_text?.top ?? 100.5),
                left: mmToPx(20),
                right: mmToPx(20),
                height: mmToPx(layout.ribbon_text?.height ?? 14.0),
                lineHeight: `${mmToPx(layout.ribbon_text?.height ?? 14.0)}px`,
                textAlign: 'center',
                fontSize: `${(layout.ribbon_text?.font_size ?? 14.5) * (SCALE / 3.4)}px`,
                fontWeight: 700,
                color: '#173874',
                fontFamily: 'Arial, sans-serif',
                zIndex: 10,
              }}
            >
              {sampleData.ribbon}
            </div>

            {/* 4. Level Value */}
            <div
              onClick={() => setSelectedKey('level_value')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'level_value'
                  ? 'ring-2 ring-blue-500 bg-blue-50/40 rounded'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.level_value?.top ?? 124.5),
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: `${(layout.level_value?.font_size ?? 11.5) * (SCALE / 3.4)}px`,
                fontWeight: 700,
                color: '#000000',
                fontFamily: 'Arial, sans-serif',
                zIndex: 10,
              }}
            >
              {sampleData.level}
            </div>

            {/* 5. Grade, Date & Place (Meta block) */}
            <div
              onClick={() => setSelectedKey('meta_block')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'meta_block'
                  ? 'ring-2 ring-blue-500 bg-blue-50/60 rounded'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.meta_block?.top ?? 138.2),
                left: mmToPx(103.5),
                width: mmToPx(90),
                height: mmToPx(18.5),
                backgroundColor: '#F8F8F8',
                textAlign: 'center',
                fontSize: `${(layout.meta_block?.font_size ?? 8.4) * (SCALE / 3.4)}px`,
                lineHeight: 1.55,
                color: '#111827',
                fontFamily: 'Arial, sans-serif',
                zIndex: 10,
              }}
            >
              <div>
                <strong className="text-black font-bold">Grade:</strong> {sampleData.grade}
              </div>
              <div>
                <strong className="text-black font-bold">Date of issue:</strong> {sampleData.date}
              </div>
              <div>
                <strong className="text-black font-bold">Place of issue:</strong> {sampleData.place}
              </div>
            </div>

            {/* 6. QR Code Left */}
            <div
              onClick={() => setSelectedKey('qr_left')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'qr_left'
                  ? 'ring-2 ring-blue-500'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.qr_left?.top ?? 147.5),
                left: mmToPx(layout.qr_left?.left ?? 67.0),
                width: mmToPx(layout.qr_left?.size ?? 26),
                height: mmToPx(layout.qr_left?.size ?? 26),
                zIndex: 10,
              }}
            >
              <div className="w-full h-full p-1 bg-white border border-slate-300 rounded shadow-sm flex items-center justify-center">
                <IconQrCode className="w-full h-full text-slate-900" />
              </div>
            </div>

            {/* 7. QR Code Right */}
            <div
              onClick={() => setSelectedKey('qr_right')}
              className={`absolute cursor-pointer transition-all ${
                activeTab === 'edit' && selectedKey === 'qr_right'
                  ? 'ring-2 ring-blue-500'
                  : activeTab === 'edit'
                  ? 'hover:ring-1 hover:ring-blue-400'
                  : ''
              }`}
              style={{
                top: mmToPx(layout.qr_right?.top ?? 147.5),
                left: mmToPx(layout.qr_right?.left ?? 196.4),
                width: mmToPx(layout.qr_right?.size ?? 26),
                height: mmToPx(layout.qr_right?.size ?? 26),
                zIndex: 10,
              }}
            >
              <div className="w-full h-full p-1 bg-white border border-slate-300 rounded shadow-sm flex items-center justify-center">
                <IconQrCode className="w-full h-full text-slate-900" />
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-[11px] mt-3">
            Standar Cetak: Dokumen A4 Landscape (297 × 210 mm) • Resolusi Tinggi • Sesuai The Blue Economist International Association
          </p>
        </main>

        {/* RIGHT SIDEBAR: Friendly Admin Control Panel */}
        <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <IconFileText className="w-4 h-4 text-blue-400" />
              Kontrol Desain & Teks Sertifikat
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik elemen di canvas atau pilih field di bawah untuk melihat dan mengubah pengaturan.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* ── SECTION 1: Pilih Elemen ── */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Pilih Bagian Teks
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { key: 'recipient_name', label: 'Nama Peserta', icon: IconType },
                  { key: 'ribbon_text', label: 'Teks Ribbon Spesialisasi', icon: IconAward },
                  { key: 'serial_no', label: 'Nomor Seri (Top-Right)', icon: IconFileText },
                  { key: 'level_value', label: 'Level Sertifikasi', icon: IconAward },
                  { key: 'meta_block', label: 'Grade, Tanggal & Tempat', icon: IconCalendar },
                  { key: 'qr_left', label: 'Barcode / QR Kiri', icon: IconQrCode },
                  { key: 'qr_right', label: 'Barcode / QR Kanan', icon: IconQrCode },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition border ${
                      selectedKey === key
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                    {selectedKey === key && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SECTION 2: Fine-Tuning Coordinates (mm) ── */}
            {selectedField && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">
                    Atur Posisi: {selectedField.label}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    Satuan mm
                  </span>
                </div>

                {/* Top Offset */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Posisi Vertikal (Top)</span>
                    <span className="font-mono text-blue-400">{selectedField.top} mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="190"
                    step="0.5"
                    value={selectedField.top}
                    onChange={e => updateField(selectedKey, 'top', parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Left Offset (if applicable) */}
                {selectedField.left !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posisi Horizontal (Left)</span>
                      <span className="font-mono text-blue-400">{selectedField.left} mm</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="250"
                      step="0.5"
                      value={selectedField.left}
                      onChange={e => updateField(selectedKey, 'left', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* Font Size (if applicable) */}
                {selectedField.font_size !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Ukuran Huruf (Font Size)</span>
                      <span className="font-mono text-blue-400">{selectedField.font_size} pt</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="40"
                      step="0.5"
                      value={selectedField.font_size}
                      onChange={e => updateField(selectedKey, 'font_size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* QR Size (if applicable) */}
                {selectedField.size !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Ukuran QR Code</span>
                      <span className="font-mono text-blue-400">{selectedField.size} mm</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="40"
                      step="1"
                      value={selectedField.size}
                      onChange={e => updateField(selectedKey, 'size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
                {/* Reset Single Field Button */}
                <button
                  type="button"
                  onClick={() => handleResetSingleField(selectedKey)}
                  className="w-full mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1.5 transition"
                >
                  <IconRotateCcw className="w-3 h-3" />
                  Reset {selectedField.label} ke Posisi Standar
                </button>
              </div>
            )}

            {/* ── SECTION 3: Live Preview Test Inputs ── */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Uji Coba Teks (Live Simulation)
              </label>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nama Peserta</label>
                <input
                  type="text"
                  value={sampleData.name}
                  onChange={e => setSampleData({ ...sampleData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Teks Ribbon Spesialisasi</label>
                <input
                  type="text"
                  value={sampleData.ribbon}
                  onChange={e => setSampleData({ ...sampleData, ribbon: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Level</label>
                  <input
                    type="text"
                    value={sampleData.level}
                    onChange={e => setSampleData({ ...sampleData, level: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Grade</label>
                  <input
                    type="text"
                    value={sampleData.grade}
                    onChange={e => setSampleData({ ...sampleData, grade: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tanggal Terbit</label>
                  <input
                    type="text"
                    value={sampleData.date}
                    onChange={e => setSampleData({ ...sampleData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tempat Terbit</label>
                  <input
                    type="text"
                    value={sampleData.place}
                    onChange={e => setSampleData({ ...sampleData, place: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl flex gap-2.5 items-start">
              <IconAlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-200 leading-relaxed">
                Setiap perubahan posisi yang Anda simpan akan langsung digunakan secara otomatis pada saat admin atau peserta mengunduh sertifikat resmi dalam format PDF.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
