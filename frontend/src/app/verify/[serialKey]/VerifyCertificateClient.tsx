'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Icon from '@/components/Icon';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ModalPortal from '@/components/common/ModalPortal';
import api from '@/lib/api';
import {
  RenderedCertificateSheet,
  resolveTemplateImages,
  formatDisplayDate,
} from '@/components/certificate/RenderedCertificateSheet';

export interface VerificationResult {
  valid: boolean;
  message: string;
  data?: {
    recipient_name?: string;
    program_name?: string;
    level?: string;
    specialization?: string;
    serial_number?: string;
    serial_url_key?: string;
    grade?: string;
    date_of_issue?: string;
    place_of_issue?: string;
    verification_url?: string;
    qr_code_svg?: string;
    qr_code_base64?: string;
    pdf_download_url?: string;
  };
}

interface VerifyCertificateClientProps {
  result: VerificationResult;
  serialKey: string;
}

export default function VerifyCertificateClient({
  result,
  serialKey,
}: VerifyCertificateClientProps) {
  const t = useTranslations('Verify');
  const router = useRouter();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'replica'>('front');
  const [searchInput, setSearchInput] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const data = result.data;
  const isFound = Boolean(result.valid && data);

  // Template images resolution based on level & specialization
  const templateConfig = resolveTemplateImages(data);

  const handleDownloadPdf = async () => {
    const key = data?.serial_url_key || data?.serial_number || serialKey;
    if (!key) return;

    setIsDownloadingPdf(true);
    try {
      const res = await api.get(`/verify/${encodeURIComponent(key)}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (data?.recipient_name || 'Sertifikat').replace(/[/\\?%*:|"<>]/g, '_');
      const safeSerial = (data?.serial_number || key).replace(/[/\\?%*:|"<>]/g, '_');
      link.setAttribute('download', `Sertifikat_${safeName}_${safeSerial}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      // Fallback direct URL download
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      window.open(`${apiUrl}/verify/${encodeURIComponent(key)}/download`, '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopySerial = () => {
    if (data?.serial_number && typeof window !== 'undefined') {
      navigator.clipboard.writeText(data.serial_number);
      setCopiedSerial(true);
      setTimeout(() => setCopiedSerial(false), 2500);
    }
  };

  const handleShareLinkedIn = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(
        `Kredensial Resmi: ${data?.program_name || 'Certified Blue Economist'} — ${data?.recipient_name || ''}`
      );
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${title}`,
        '_blank',
        'noopener,noreferrer,width=600,height=600'
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    router.push(`/verify/${encodeURIComponent(query)}`);
  };

  const isExcellent =
    data?.grade?.toLowerCase().includes('excellent') ||
    data?.grade?.toLowerCase().includes('sangat baik');

  return (
    <div className="min-h-screen bg-[#001326] text-slate-100 font-sans selection:bg-amber-400 selection:text-navy-dark relative overflow-x-hidden">
      {/* ── Oceanic Glowing Backdrop Gradients ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] bg-sky-500/15 rounded-full filter blur-[140px]" />
        <div className="absolute top-1/3 -left-20 w-[550px] h-[550px] bg-cyan-500/10 rounded-full filter blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 w-[600px] h-[600px] bg-amber-500/10 rounded-full filter blur-[140px]" />
        {/* Subtle Nautical Grid Pattern */}
        <svg className="w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="verify-sub-mesh" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verify-sub-mesh)" />
        </svg>
      </div>

      {/* ── Top Bar / Header ── */}
      <header className="relative z-20 border-b border-white/10 bg-[#001326]/80 backdrop-blur-md sticky top-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Consortium Title */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            title="DigiBlueCamp Homepage"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00162d] text-white flex items-center justify-center p-2 border border-white/15 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Icon name="certificate-badge-1" size={22} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight font-heading group-hover:text-amber-400 transition-colors">
                  DigiBlue
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-sky-300 px-2 py-0.5 rounded-full border border-white/10 font-mono hidden sm:inline-block">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
                The Blue Economist International Association
              </p>
            </div>
          </Link>

          {/* Center: Live Registry Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            {isFound ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold tracking-wide">{t('badge_live')}</span>
                <span className="text-white/30">•</span>
                <span className="text-slate-300">{t('badge_registry')}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400 font-bold tracking-wide">{t('badge_invalid')}</span>
              </>
            )}
          </div>

          {/* Right: Actions & Language Switcher */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/verify"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors border border-white/10 hidden sm:inline-flex items-center gap-1.5"
            >
              <Icon name="search-1" size={14} />
              <span>{t('btn_verify_another')}</span>
            </Link>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 hover:text-white transition-colors"
          >
            <Icon name="arrow-left" size={14} />
            <span>{t('btn_back_portal')}</span>
          </Link>

          <div className="text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            ID: <span className="text-amber-400 font-bold uppercase">{serialKey}</span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CASE A: VALID CREDENTIAL FOUND                                */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {isFound && data ? (
          <div className="space-y-10">
            {/* Top Verification Status Headline Strip */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-[#072421]/60 to-emerald-950/70 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                    <Icon name="shield-2-check" size={32} />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-black text-white font-heading mt-1">
                      {t('status_valid')}
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed mt-0.5">
                      {t('sub_valid')}
                    </p>
                  </div>
                </div>

                {/* Quick Print, Download & Copy Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 print:hidden flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-10 px-3.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title={t('btn_copy_link')}
                  >
                    <Icon name="link-2-angular-right" size={14} className="text-sky-300" />
                    <span>{copiedLink ? t('btn_copied_link') : t('btn_copy_link')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="h-10 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    title="Simpan file PDF resmi ke perangkat"
                  >
                    {isDownloadingPdf ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name="file-multiple" size={14} />
                    )}
                    <span>{isDownloadingPdf ? t('btn_downloading_pdf') : t('btn_download_pdf')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-10 px-4 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-[#00162d] transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer font-heading"
                    title="Cetak langsung dokumen sertifikat via printer"
                  >
                    <Icon name="printer" size={15} />
                    <span>{t('btn_print')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── 2-Column Split: Dossier Card & Certificate Replica ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ────────────────────────────────────────────────────── */}
              {/* LEFT COLUMN (lg:col-span-6): Official Credential Record */}
              {/* ────────────────────────────────────────────────────── */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-2xl border border-slate-200/80 relative overflow-hidden">
                  {/* Subtle Top Accent Bar */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-sky-600 via-amber-400 to-emerald-500" />

                  {/* Recipient Profile Section */}
                  <div className="pb-6 border-b border-slate-100">
                    <span className="text-[11px] font-bold tracking-wider uppercase font-mono text-slate-400 block mb-1">
                      {t('lbl_recipient')}
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#00162d] tracking-tight font-heading leading-tight">
                          {data.recipient_name}
                        </h2>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-sky-800 border border-sky-200 font-mono shadow-2xs">
                            <Icon name="certificate-badge-1" size={13} className="text-sky-600" />
                            <span>{data.program_name || 'Certified Blue Economist'}</span>
                          </span>

                          {data.grade && (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold font-mono border shadow-2xs ${isExcellent
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                            >
                              <Icon
                                name={isExcellent ? 'star-half' : 'check-circle-1'}
                                size={13}
                                className={isExcellent ? 'text-amber-500' : 'text-emerald-600'}
                              />
                              <span>
                                {t('lbl_grade')}: {data.grade}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verified Badge Icon Stamp */}
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                        <Icon name="shield-2-check" size={28} />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Specifications List */}
                  <div className="py-6 space-y-4">
                    {/* Item 1: Serial Number with Instant Copy */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                          {t('lbl_serial')}
                        </span>
                        <span className="font-mono font-black text-sm sm:text-base text-[#00162d] tracking-wide block mt-0.5">
                          {data.serial_number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopySerial}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/80 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        title="Salin Nomor Seri Kredensial"
                      >
                        <Icon name="link-2-angular-right" size={13} />
                        <span>{copiedSerial ? t('btn_copied_serial') : t('btn_copy_serial')}</span>
                      </button>
                    </div>

                    {/* Item 2: Level & Specialization */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                          {t('lbl_level')}
                        </span>
                        <span className="font-extrabold text-sm text-[#00162d] block mt-1 leading-snug">
                          {data.level || 'Foundation Level'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                          {t('lbl_issue_date')}
                        </span>
                        <span className="font-extrabold text-sm text-[#00162d] block mt-1 leading-snug">
                          {formatDisplayDate(data.date_of_issue)}
                        </span>
                      </div>
                    </div>

                    {/* Item 3: Specialization Track Title */}
                    {data.specialization && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                          {t('lbl_specialization')}
                        </span>
                        <span className="font-bold text-sm text-[#00162d] block mt-1 leading-relaxed">
                          {data.specialization}
                        </span>
                      </div>
                    )}

                    {/* Item 4: Place & Issuing Authority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                          {t('lbl_issue_place')}
                        </span>
                        <span className="font-semibold text-xs sm:text-sm text-slate-700 block mt-1">
                          {data.place_of_issue || 'Jakarta, Indonesia'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                          {t('lbl_serial_key')}
                        </span>
                        <span className="font-mono font-semibold text-xs text-slate-600 block mt-1 truncate">
                          {data.serial_url_key || serialKey}
                        </span>
                      </div>
                    </div>

                    {/* Item 5: Issuing Authority & Accreditation Standar */}
                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-sky-700 shrink-0 mt-0.5">
                          <Icon name="buildings-1" size={15} />
                        </span>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-sky-900 block">
                            {t('lbl_authority')}
                          </span>
                          <span className="text-xs font-semibold text-sky-950 block mt-0.5">
                            {t('val_authority')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 pt-2 border-t border-sky-200/60">
                        <span className="text-sky-700 shrink-0 mt-0.5">
                          <Icon name="shield-2" size={15} />
                        </span>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-sky-900 block">
                            {t('lbl_standard')}
                          </span>
                          <span className="text-xs font-semibold text-sky-950 block mt-0.5">
                            {t('val_standard')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2.5 print:hidden">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="flex-1 min-w-[140px] h-11 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                      title="Unduh file PDF resmi kredensial ini"
                    >
                      {isDownloadingPdf ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="file-multiple" size={15} />
                      )}
                      <span>{isDownloadingPdf ? t('btn_downloading_pdf') : t('btn_download_pdf')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareLinkedIn}
                      className="flex-1 min-w-[140px] h-11 px-4 rounded-xl text-xs font-bold bg-[#0a66c2] hover:bg-[#004182] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                      <span>{t('btn_share_linkedin')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="h-11 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title={t('btn_copy_link')}
                    >
                      <Icon name="link-2-angular-right" size={15} />
                      <span>{copiedLink ? t('btn_copied_link') : t('btn_copy_link')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────── */}
              {/* RIGHT COLUMN (lg:col-span-6): Interactive Certificate  */}
              {/* ────────────────────────────────────────────────────── */}
              <div className="lg:col-span-6 space-y-4">
                {/* Mode Selector Tabs */}
                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 flex items-center gap-1 print:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveTab('front')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'front'
                      ? 'bg-amber-500 text-[#00162d] shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon name="image" size={14} />
                    <span>{t('tab_front')}</span>
                  </button>

                  {templateConfig.hasBack && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('back')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'back'
                        ? 'bg-amber-500 text-[#00162d] shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Icon name="book-1" size={14} />
                      <span>{t('tab_back')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('replica')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'replica'
                      ? 'bg-amber-500 text-[#00162d] shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon name="certificate-badge-1" size={14} />
                    <span>{t('tab_replica')}</span>
                  </button>
                </div>

                {/* TAB 1: FRONT CERTIFICATE SHEET (WITH DATA OVERLAY) */}
                {activeTab === 'front' && (
                  <div className="bg-white/5 rounded-3xl p-3 border border-white/10 shadow-xl space-y-3">
                    <div
                      onClick={() => setIsZoomOpen(true)}
                      className="group cursor-zoom-in relative rounded-2xl overflow-hidden border border-white/20 bg-white shadow-2xl transition-all"
                      title="Klik untuk memperbesar tampilan sertifikat resmi"
                    >
                      <RenderedCertificateSheet
                        side="front"
                        data={data}
                        templateConfig={templateConfig}
                      />

                      {/* Hover Overlay Zoom Indicator */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold pointer-events-none">
                        <Icon name="scan" size={18} />
                        <span>Klik untuk Memperbesar Layar Penuh</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 px-2">
                      <span className="flex items-center gap-1.5">
                        <Icon name="shield-2-check" size={13} className="text-emerald-400" />
                        <span>Template Resmi Terakreditasi ({templateConfig.typeLabel})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="text-sky-300 hover:text-white font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Icon name="scan" size={13} />
                        <span>Perbesar Layar Penuh</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: BACK CERTIFICATE SHEET */}
                {activeTab === 'back' && templateConfig.hasBack && (
                  <div className="bg-white/5 rounded-3xl p-3 border border-white/10 shadow-xl space-y-3">
                    <div
                      onClick={() => setIsZoomOpen(true)}
                      className="group cursor-zoom-in relative rounded-2xl overflow-hidden border border-white/20 bg-white shadow-2xl transition-all"
                      title="Klik untuk memperbesar tampilan transkrip kurikulum"
                    >
                      <RenderedCertificateSheet
                        side="back"
                        data={data}
                        templateConfig={templateConfig}
                      />

                      {/* Hover Overlay Zoom Indicator */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold pointer-events-none">
                        <Icon name="scan" size={18} />
                        <span>Klik untuk Memperbesar Layar Penuh</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 px-2">
                      <span>Transkrip Kurikulum & Matriks Unit Kompetensi</span>
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="text-sky-300 hover:text-white font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Icon name="scan" size={13} />
                        <span>Perbesar Layar Penuh</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: AUTHENTIC REPLICA FRAME */}
                {activeTab === 'replica' && (
                  <div
                    id="certificate-print-area"
                    className="relative rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-br from-[#0c1f38] via-[#09223e] to-[#0c1f38] border border-amber-400/40 text-slate-900"
                  >
                    {/* Outer Framed Certificate Card */}
                    <div className="relative bg-[#ffffff] rounded-2xl p-6 sm:p-8 md:p-10 border-4 border-amber-400/90 shadow-2xl overflow-hidden">
                      {/* Double Inset Borders */}
                      <div className="absolute inset-3 sm:inset-4 border-2 border-amber-300/60 rounded-xl pointer-events-none" />
                      <div className="absolute inset-5 sm:inset-6 border border-slate-200/90 rounded-lg pointer-events-none" />

                      {/* Watermark Crest */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
                        <Icon name="certificate-badge-1" size={420} />
                      </div>

                      {/* Certificate Header */}
                      <div className="relative z-10 text-center pb-5 border-b border-amber-200/80">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-[#00162d] text-amber-400 flex items-center justify-center shadow-md border border-amber-400 shrink-0">
                            <Icon name="certificate-badge-1" size={22} />
                          </div>
                          <div className="text-left">
                            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase text-sky-800 font-mono block">
                              The Blue Economist International Association
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#00162d] uppercase font-heading block">
                              DigiBlueCamp Maritime Consortium
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-amber-700 block font-mono mt-2">
                          OFFICIAL CERTIFICATE OF COMPLETION
                        </span>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#00162d] tracking-tight font-heading uppercase mt-0.5">
                          {data.program_name || 'Certified Blue Economist'}
                        </h3>
                      </div>

                      {/* Certificate Recipient & Program Details */}
                      <div className="relative z-10 py-5 sm:py-6 text-center space-y-3">
                        <p className="text-xs text-slate-500 font-serif italic">
                          This is to certify that the competence and academic qualification of
                        </p>

                        <div className="py-1">
                          <h4 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#00162d] tracking-tight font-heading underline decoration-amber-400 decoration-2 underline-offset-6">
                            {data.recipient_name}
                          </h4>
                          {data.grade && (
                            <span className="text-xs font-mono font-bold text-sky-800 mt-2 block tracking-wider uppercase">
                              Grade Awarded: {data.grade}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                          Has successfully completed all required modules, comprehensive examinations,
                          and practical assessments for:
                        </p>

                        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 max-w-md mx-auto">
                          <span className="text-xs sm:text-sm font-extrabold text-[#00162d] block">
                            {data.specialization || data.program_name}
                          </span>
                          <span className="text-[11px] font-semibold text-sky-800 block mt-0.5 font-mono">
                            {data.level || 'Foundation Level'}
                          </span>
                        </div>
                      </div>

                      {/* Certificate Footer & Seal Stamp */}
                      <div className="relative z-10 pt-4 border-t border-amber-200/80 flex items-center justify-between gap-4">
                        {/* Serial & Issuance */}
                        <div className="text-left space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                            Serial Number:
                          </div>
                          <div className="font-mono font-extrabold text-xs sm:text-sm text-[#00162d] bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-block">
                            {data.serial_number}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Issued: {data.date_of_issue} • {data.place_of_issue || 'Jakarta'}
                          </div>
                        </div>

                        {/* Gold Foil Seal Stamp */}
                        <div className="shrink-0">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-lg flex items-center justify-center">
                            <div className="w-full h-full rounded-full border border-amber-600/50 flex flex-col items-center justify-center text-center p-1 bg-amber-500 text-[#00162d]">
                              <span className="text-[7px] font-black uppercase font-mono tracking-tighter leading-none">
                                OFFICIAL
                              </span>
                              <Icon name="certificate-badge-1" size={13} className="my-0.5 text-[#00162d]" />
                              <span className="text-[6px] font-bold tracking-tighter leading-none">
                                DIGIBLUE SEAL
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Helper Note */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-sky-200/80 px-2">
                      <span className="flex items-center gap-1.5">
                        <Icon name="shield-2-check" size={13} className="text-emerald-400" />
                        <span>Resmi terenkripsi dalam basis data DigiBlue</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="text-amber-300 hover:text-white font-bold transition-colors inline-flex items-center gap-1 cursor-pointer print:hidden"
                      >
                        <Icon name="printer" size={12} />
                        <span>Cetak Dokumen</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3 Trust & Integrity Pillars Strip ── */}
            <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
                  <Icon name="shield-2-check" size={20} />
                </div>
                <h3 className="text-sm font-bold text-white font-heading">
                  {t('trust_pillar_1_title')}
                </h3>
                <p className="text-xs text-slate-300/80 mt-1 leading-relaxed">
                  {t('trust_pillar_1_desc')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
                  <Icon name="globe-1" size={20} />
                </div>
                <h3 className="text-sm font-bold text-white font-heading">
                  {t('trust_pillar_2_title')}
                </h3>
                <p className="text-xs text-slate-300/80 mt-1 leading-relaxed">
                  {t('trust_pillar_2_desc')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-3">
                  <Icon name="scan" size={20} />
                </div>
                <h3 className="text-sm font-bold text-white font-heading">
                  {t('trust_pillar_3_title')}
                </h3>
                <p className="text-xs text-slate-300/80 mt-1 leading-relaxed">
                  {t('trust_pillar_3_desc')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════ */
          /* CASE B: NOT FOUND / INVALID SERIAL KEY                        */
          /* ═════════════════════════════════════════════════════════════ */
          <div className="max-w-2xl mx-auto text-center py-6 sm:py-12 space-y-6">
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-slate-800 shadow-2xl border border-rose-200">
              <div className="w-18 h-18 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
                <Icon name="xmark-circle" size={38} />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider font-mono text-rose-700 bg-rose-100 px-3 py-1 rounded-full inline-block mb-3 border border-rose-200">
                {t('status_invalid')}
              </span>

              <h1 className="text-2xl sm:text-3xl font-black text-[#00162d] font-heading mb-3">
                Nomor Seri Tidak Ditemukan
              </h1>

              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
                Nomor seri <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">"{serialKey}"</span> tidak terdaftar dalam basis data resmi sertifikasi DigiBlue & The Blue Economist International Association.
              </p>

              {/* Direct Re-Search Input */}
              <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-8">
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/10">
                  <span className="pl-3 text-slate-400">
                    <Icon name="search-1" size={16} />
                  </span>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Masukkan nomor seri lainnya..."
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none uppercase font-mono px-2"
                  />
                  <button
                    type="submit"
                    disabled={!searchInput.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-[#00162d] font-bold text-xs rounded-xl transition-all cursor-pointer font-heading"
                  >
                    {t('btn_search_again')}
                  </button>
                </div>
              </form>

              {/* Troubleshooting Tips */}
              <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-200 text-xs text-slate-600 space-y-2 mb-6">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Icon name="question-mark-circle" size={14} className="text-sky-600" />
                  <span>{t('tip_troubleshoot_title')}</span>
                </div>
                <p>• {t('tip_1')}</p>
                <p>• {t('tip_2')}</p>
                <p>• {t('tip_3')}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/verify"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#00162d] text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon name="arrow-left" size={13} />
                  <span>{t('btn_back_portal')}</span>
                </Link>
                <Link
                  href="/help"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 inline-flex items-center gap-1.5"
                >
                  <Icon name="chat-bubble-2" size={13} />
                  <span>{t('btn_contact_support')}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 DigiBlueCamp x The Blue Economist International Association</p>
          <p className="text-[11px] text-slate-500">
            Diakui secara internasional selaras target SDG 14 & Kerangka Kerja Kelautan Berkelanjutan.
          </p>
        </div>
      </footer>

      {/* ── Lightbox Zoom Modal for High-Res Template Preview ── */}
      {isZoomOpen && (
        <ModalPortal>
          <div
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 cursor-zoom-out"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[92vh] bg-slate-900 rounded-3xl p-3 sm:p-5 border border-white/20 shadow-2xl flex flex-col items-center cursor-default animate-fadeup"
            >
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-white/20 flex items-center justify-center shadow-lg cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <Icon name="xmark" size={16} />
              </button>

              <div className="w-full overflow-auto max-h-[80vh] flex items-center justify-center rounded-2xl bg-black/40 p-2">
                <div className="w-full max-w-4xl">
                  <RenderedCertificateSheet
                    side={activeTab === 'back' ? 'back' : 'front'}
                    data={data}
                    templateConfig={templateConfig}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between w-full px-2 text-xs text-slate-400">
                <span>
                  Pratinjau Kredensial Resmi — {data?.recipient_name} ({data?.serial_number})
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── DEDICATED FULL-PRECISION PRINT DOCUMENT (A4 LANDSCAPE) ── */}
      {data && (
        <div id="certificate-print-document" className="hidden print:block">
          <div className="print-page-wrapper">
            <RenderedCertificateSheet
              side="front"
              data={data}
              templateConfig={templateConfig}
            />
          </div>
          {templateConfig.hasBack && (
            <div className="print-page-wrapper print-page-break">
              <RenderedCertificateSheet
                side="back"
                data={data}
                templateConfig={templateConfig}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Print Stylesheet Injection ── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, button, .print\\:hidden, main {
            display: none !important;
          }
          #certificate-print-document {
            display: block !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page-wrapper {
            width: 100vw !important;
            height: 100vh !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>
    </div>
  );
}
