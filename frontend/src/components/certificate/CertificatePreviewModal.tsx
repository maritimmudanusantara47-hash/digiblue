'use client';

import React, { useEffect, useState } from 'react';
import type { CertificateTemplate } from '@/lib/certificateTemplates';
import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: CertificateTemplate[];
  initialTemplateId?: string;
  initialSide?: 'front' | 'back';
  courseTitle?: string;
  locale?: string;
}

export default function CertificatePreviewModal({
  isOpen,
  onClose,
  templates,
  initialTemplateId,
  initialSide = 'front',
  courseTitle,
  locale = 'id',
}: CertificatePreviewModalProps) {
  const isEn = locale === 'en';

  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    initialTemplateId || (templates[0]?.id ?? '')
  );
  const [activeSide, setActiveSide] = useState<'front' | 'back'>(initialSide);
  const [zoomMode, setZoomMode] = useState<'fit' | 'full'>('fit');

  useEffect(() => {
    if (initialTemplateId) {
      setActiveTemplateId(initialTemplateId);
    } else if (templates.length > 0 && !templates.some((t) => t.id === activeTemplateId)) {
      setActiveTemplateId(templates[0].id);
    }
  }, [initialTemplateId, templates, activeTemplateId]);

  useEffect(() => {
    if (initialSide) {
      setActiveSide(initialSide);
    }
  }, [initialSide]);

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || templates.length === 0) return null;

  const currentTemplate =
    templates.find((t) => t.id === activeTemplateId) || templates[0];

  const currentImage =
    activeSide === 'back' && currentTemplate.imageBack
      ? currentTemplate.imageBack
      : currentTemplate.imageFront;

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? 'Certificate Template Preview' : 'Pratinjau Template Sertifikat'}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Header ── */}
          <div className="flex-shrink-0 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentTemplate.badgeStyle.badge}`}>
                  {currentTemplate.badgeText}
                </span>
                <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                  <Icon name="shield-2-check" size={13} />
                  {isEn ? 'Official Verified Credential Sample' : 'Contoh Sertifikat Resmi Terverifikasi'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xl">
                {currentTemplate.title}
              </h2>
              {courseTitle && courseTitle !== currentTemplate.title && (
                <p className="text-[11px] text-slate-400 truncate max-w-xl">
                  {isEn ? 'Course: ' : 'Kursus: '}{courseTitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
                aria-label={isEn ? 'Close preview' : 'Tutup pratinjau'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Secondary Toolbar: Multi-template tabs & Side Toggle ── */}
          <div className="flex-shrink-0 bg-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            {/* Multi-template selector (e.g. CBEc Foundation vs Field Study) */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {templates.length > 1 && (
                <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
                  {templates.map((tpl) => {
                    const isActive = tpl.id === currentTemplate.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setActiveTemplateId(tpl.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        {tpl.categoryLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Front / Back Switcher & Zoom */}
            <div className="flex items-center gap-2 ml-auto">
              {currentTemplate.hasBack && (
                <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveSide('front')}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                      activeSide === 'front'
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon name="book-1" size={13} />
                    <span>{isEn ? 'Front View' : 'Tampak Depan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSide('back')}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                      activeSide === 'back'
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon name="layers-1" size={13} />
                    <span>{isEn ? 'Back View' : 'Tampak Belakang'}</span>
                  </button>
                </div>
              )}

              {/* Zoom Toggle */}
              <div className="hidden sm:flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    zoomMode === 'fit' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                  title={isEn ? 'Fit in window' : 'Sesuaikan layar'}
                >
                  {isEn ? 'Fit' : 'Layar'}
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('full')}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    zoomMode === 'full' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                  title={isEn ? 'Full resolution' : 'Ukuran penuh'}
                >
                  100%
                </button>
              </div>
            </div>
          </div>

          {/* ── Main Canvas / Certificate Display ── */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0a0d14] flex flex-col items-center justify-center min-h-[260px] relative">
            <div
              className={`relative rounded-xl border border-slate-700 shadow-2xl transition-all duration-200 overflow-hidden bg-slate-100 ${
                zoomMode === 'full' ? 'w-[880px] max-w-none' : 'w-full max-w-3xl'
              }`}
              style={{
                aspectRatio: '297 / 210',
              }}
            >
              {/* The Certificate Template Mockup Image */}
              <img
                src={currentImage}
                alt={`${currentTemplate.title} (${activeSide === 'front' ? 'Tampak Depan' : 'Tampak Belakang'})`}
                className="w-full h-full object-contain pointer-events-none select-none"
                loading="eager"
              />

              {/* Diagonal Frosted Watermark Banner */}
              <div className="absolute top-4 right-4 pointer-events-none select-none">
                <div className="bg-slate-900/80 backdrop-blur-md text-amber-300 font-extrabold text-[10px] sm:text-xs tracking-wider px-3 py-1.5 rounded-full border border-amber-400/30 shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>{isEn ? 'SAMPLE / OFFICIAL PREVIEW' : 'CONTOH / PRATINJAU RESMI'}</span>
                </div>
              </div>

              {/* Bottom Subtle Watermark Text */}
              <div className="absolute bottom-3 inset-x-0 pointer-events-none select-none flex justify-center">
                <span className="text-[10px] font-semibold text-slate-700/60 bg-white/70 backdrop-blur-xs px-3 py-0.5 rounded-full border border-slate-300/40 tracking-wider">
                  DIGIBLUECAMP × THE BLUE ECONOMIST INTERNATIONAL ASSOCIATION
                </span>
              </div>
            </div>

            {/* Quick Flip Hint for Mobile */}
            {currentTemplate.hasBack && (
              <p className="text-[11px] text-slate-500 mt-3 text-center sm:hidden">
                {activeSide === 'front'
                  ? (isEn ? 'Tap "Back View" above to inspect curriculum transcript' : 'Ketuk "Tampak Belakang" di atas untuk melihat transkrip silabus')
                  : (isEn ? 'Tap "Front View" above to inspect main certificate' : 'Ketuk "Tampak Depan" di atas untuk kembali ke tampilan utama')}
              </p>
            )}
          </div>

          {/* ── Explanatory Bottom Panel ── */}
          <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Left: What is shown on this side */}
              <div className="md:col-span-2 space-y-2">
                {currentTemplate.attendanceConditionNote && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2 mb-2">
                    <Icon name="info-circle" size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{currentTemplate.attendanceConditionNote}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    {activeSide === 'front'
                      ? (isEn ? 'Front Side Details' : 'Rincian Tampak Depan')
                      : (isEn ? 'Reverse Side Details' : 'Rincian Tampak Belakang')}
                  </h4>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {activeSide === 'front'
                    ? (isEn
                        ? 'The front side displays the recipient legal name, certified credential title, unique serial registration number, formal consortium signatures, and instant QR Code.'
                        : 'Tampak depan memuat nama lengkap resmi lulusan, gelar kehormatan CBEc, nomor seri registrasi unik, tanda tangan pimpinan konsorsium, serta QR Code verifikasi langsung.')
                    : (isEn
                        ? 'The reverse side provides an accredited competency transcript matrix, academic workload metrics (ECTS), and official international certification accreditation.'
                        : 'Tampak belakang memuat matriks unit kompetensi terakreditasi, konversi beban pembelajaran (ECTS), dan pernyataan akreditasi konsorsium internasional.')}
                </p>

                {/* Bullet Highlights */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activeSide === 'front'
                    ? currentTemplate.frontHighlights
                    : currentTemplate.backHighlights
                  ).map((hl, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-[11px] border border-slate-700"
                    >
                      <Icon name="check-circle-1" size={12} className="text-emerald-400 shrink-0" />
                      <span>{hl}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Credibility Highlights */}
              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/90 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isEn ? 'Credential Security' : 'Keaslian Terjamin'}
                </span>
                {currentTemplate.credibilityPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="text-amber-400 mt-0.5 shrink-0">
                      <Icon name="shield-2-check" size={13} />
                    </span>
                    <div>
                      <strong className="text-slate-200 block leading-tight">{pt.title}</strong>
                      <span className="text-slate-400 leading-tight">{pt.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
