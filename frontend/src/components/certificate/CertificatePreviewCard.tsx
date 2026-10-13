'use client';

import React, { useState } from 'react';
import type { CertificateTemplate } from '@/lib/certificateTemplates';
import Icon from '@/components/Icon';

interface CertificatePreviewCardProps {
  templates: CertificateTemplate[];
  onOpenModal: (templateId?: string, side?: 'front' | 'back') => void;
  courseTitle?: string;
  locale?: string;
  className?: string;
}

export default function CertificatePreviewCard({
  templates,
  onOpenModal,
  courseTitle,
  locale = 'id',
  className = '',
}: CertificatePreviewCardProps) {
  const isEn = locale === 'en';

  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  if (!templates || templates.length === 0) return null;

  const currentTemplate = templates[selectedTemplateIndex] || templates[0];
  const currentImage =
    activeSide === 'back' && currentTemplate.imageBack
      ? currentTemplate.imageBack
      : currentTemplate.imageFront;

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
              <Icon name="shield-2-check" size={16} />
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentTemplate.badgeStyle.badge}`}>
              {currentTemplate.badgeText}
            </span>
          </div>
          <h3 className="font-extrabold text-navy-dark text-sm sm:text-base leading-snug">
            {isEn ? 'Official Certificate You Will Earn' : 'Sertifikat Resmi yang Akan Didapatkan'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            {isEn
              ? 'Awarded upon course completion & passing final evaluation.'
              : 'Diterbitkan resmi setelah tuntas mempelajari materi & evaluasi.'}
          </p>
        </div>
      </div>

      {/* ── Multi-template selector (e.g. CBEc Specialization + Field Study Specialization) ── */}
      {templates.length > 1 && (
        <div className="mb-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Available Certifications:' : 'Sertifikat pada Kursus Ini:'}
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              {isEn ? 'Dual Certificate Option' : 'Opsi 2 Sertifikat'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl">
            {templates.map((tpl, idx) => {
              const isSelected = idx === selectedTemplateIndex;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateIndex(idx);
                    setActiveSide('front');
                  }}
                  className={`text-[11px] py-1.5 px-2 rounded-lg font-semibold transition-all text-center truncate cursor-pointer ${
                    isSelected
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-navy hover:bg-white'
                  }`}
                  title={tpl.title}
                >
                  <span className="truncate block">{tpl.categoryLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Callout Kebijakan Keikutsertaan Field Study */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-[11px] leading-relaxed text-amber-950 flex items-start gap-2.5">
            <span className="text-amber-600 shrink-0 mt-0.5">
              <Icon name="info-circle" size={14} />
            </span>
            <div>
              <strong className="text-amber-900 block font-bold mb-0.5">
                {isEn ? 'Field Study Participation Note:' : 'Ketentuan Keikutsertaan Field Study:'}
              </strong>
              <span className="text-amber-800">
                {isEn
                  ? 'Kursus ini memiliki section konfirmasi Field Study. Jika mengikuti, kamu mendapatkan 2 Sertifikat (CBEc Specialization + Field Study Specialization). Jika tidak mengikuti, kamu hanya mendapatkan Sertifikat CBEc Specialization.'
                  : 'Kursus ini memiliki section konfirmasi Field Study. Jika mengikuti, peserta mendapatkan 2 Sertifikat (CBEc Specialization + Field Study Specialization). Jika tidak mengikuti, peserta hanya mendapatkan Sertifikat CBEc Specialization.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Certificate Mockup Preview Frame ── */}
      <div className="space-y-2.5">
        <div
          onClick={() => onOpenModal(currentTemplate.id, activeSide)}
          className="relative rounded-2xl overflow-hidden border border-slate-200/90 group cursor-pointer shadow-sm hover:shadow-md bg-slate-100 transition-all duration-300"
          style={{ aspectRatio: '297 / 210' }}
          title={isEn ? 'Click to enlarge certificate preview' : 'Klik untuk memperbesar contoh sertifikat'}
        >
          {/* Mockup Image */}
          <img
            src={currentImage}
            alt={`Contoh Sertifikat ${currentTemplate.title} - ${activeSide === 'front' ? 'Depan' : 'Belakang'}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Watermark Pill */}
          <div className="absolute top-2.5 right-2.5 pointer-events-none select-none z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-amber-300 border border-amber-300/30 shadow-xs tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{isEn ? 'SAMPLE' : 'CONTOH'}</span>
            </span>
          </div>

          {/* Current Side Badge */}
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none select-none z-10">
            <span className="text-[10px] font-semibold text-slate-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
              {activeSide === 'front'
                ? (isEn ? 'Front View' : 'Tampak Depan')
                : (isEn ? 'Reverse View' : 'Tampak Belakang')}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-navy-dark/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-xs font-semibold gap-2 p-4 text-center z-20 backdrop-blur-[2px]">
            <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/30 transform group-hover:scale-110 transition-transform">
              <Icon name="eye" size={18} />
            </span>
            <span className="font-bold tracking-wide">
              {isEn ? 'Click to Enlarge Preview' : 'Klik untuk Memperbesar'}
            </span>
            <span className="text-[11px] text-white/80 font-normal">
              {isEn ? 'Inspect Front & Reverse Side' : 'Lihat Tampak Depan & Belakang'}
            </span>
          </div>
        </div>

        {/* ── Quick Front/Back Switcher & Lightbox Trigger ── */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {currentTemplate.hasBack ? (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSide('front');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-[11px] ${
                  activeSide === 'front'
                    ? 'bg-white text-navy-dark shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Front' : 'Depan'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSide('back');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-[11px] ${
                  activeSide === 'back'
                    ? 'bg-white text-navy-dark shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Back' : 'Belakang'}
              </button>
            </div>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => onOpenModal(currentTemplate.id, activeSide)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-navy-light transition-colors py-1 px-2 rounded-lg hover:bg-sky-50/80 cursor-pointer ml-auto"
          >
            <Icon name="scan" size={13} />
            <span>{isEn ? 'Enlarge (Lightbox)' : 'Perbesar Pratinjau'}</span>
          </button>
        </div>
      </div>

      {/* ── Trust Points Footer ── */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <Icon name="shield-2-check" size={13} className="text-emerald-500 shrink-0" />
          <span>{isEn ? 'Verified QR Code linking to The Blue Economist' : 'Terverifikasi internasional via QR Code & terdaftar di The Blue Economist'}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <Icon name="check-circle-1" size={13} className="text-navy shrink-0" />
          <span>{isEn ? 'Unique anti-counterfeiting serial registration ID' : 'Dilengkapi nomor registrasi & serial resmi anti-pemalsuan'}</span>
        </div>
      </div>
    </div>
  );
}
