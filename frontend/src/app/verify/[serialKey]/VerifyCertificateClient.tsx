'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Icon from '@/components/Icon';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ModalPortal from '@/components/common/ModalPortal';
import api from '@/lib/api';
import { generateCertificateDownloadFileName } from '@/lib/certificateTemplates';
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
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [searchInput, setSearchInput] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      const filename = generateCertificateDownloadFileName(
        {
          slug: data?.specialization,
          title: data?.specialization || data?.program_name,
        },
        data?.recipient_name,
        undefined,
        data?.serial_number || key
      );
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* ── Minimalist Clean Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Icon name="certificate-badge-1" size={19} />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight font-heading">
                DigiBlue
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-normal">
                Verifikasi
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 hidden sm:inline-flex items-center gap-1.5"
            >
              <Icon name="search-1" size={13} />
              <span>{t('btn_verify_another')}</span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation / ID Tag */}
        <div className="mb-5 flex items-center justify-between gap-3 text-xs print:hidden">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="arrow-left" size={13} />
            <span>{t('btn_back_portal')}</span>
          </Link>

          <span className="font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-[11px]">
            Serial Key: <strong className="text-amber-400 font-semibold">{serialKey}</strong>
          </span>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CASE A: VALID CREDENTIAL FOUND                                */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {isFound && data ? (
          <div className="space-y-6">
            {/* Clean Verification Status Strip */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Icon name="shield-2-check" size={24} />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{t('status_valid')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Resmi
                    </span>
                  </h1>
                  <p className="text-xs text-emerald-200/70 mt-0.5">
                    {data.program_name || 'Certified Blue Economist'} • The Blue Economist International Association
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 print:hidden flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="h-9 px-3.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  title="Unduh sertifikat resmi dalam format PDF"
                >
                  {isDownloadingPdf ? (
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="download-1" size={14} />
                  )}
                  <span>{isDownloadingPdf ? t('btn_downloading_pdf') : t('btn_download_pdf')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-9 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={t('btn_copy_link')}
                >
                  <Icon name="link-2-angular-right" size={13} className="text-slate-400" />
                  <span>{copiedLink ? t('btn_copied_link') : 'Salin Tautan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareLinkedIn}
                  className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#0a66c2] hover:bg-[#004182] text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Bagikan ke profil LinkedIn"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>

            {/* ── 2-Column Clean Layout: Data (Kiri) & Sertifikat Asli (Kanan) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* KOLOM KIRI (5 cols): Rincian Data Kredensial */}
              <div className="lg:col-span-5 bg-slate-800/80 rounded-2xl p-5 sm:p-6 border border-slate-700/80 space-y-5">
                {/* Nama Penerima & Predikat */}
                <div className="pb-4 border-b border-slate-700">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    {t('lbl_recipient')}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                    {data.recipient_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {data.program_name || 'Certified Blue Economist'}
                    </span>
                    {data.grade && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                          isExcellent
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <Icon name={isExcellent ? 'star-half' : 'check-circle-1'} size={12} />
                        <span>Grade: {data.grade}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid Rincian Kredensial */}
                <div className="space-y-3.5 text-xs">
                  {/* Nomor Seri */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {t('lbl_serial')}
                      </span>
                      <span className="font-mono font-bold text-white text-sm block mt-0.5">
                        {data.serial_number}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySerial}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors cursor-pointer"
                      title="Salin Nomor Seri"
                    >
                      {copiedSerial ? 'Tersalin ✓' : 'Salin'}
                    </button>
                  </div>

                  {/* Level & Tanggal Terbit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {t('lbl_level')}
                      </span>
                      <span className="font-semibold text-white block mt-0.5">
                        {data.level || 'Foundation Level'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {t('lbl_issue_date')}
                      </span>
                      <span className="font-semibold text-white block mt-0.5">
                        {formatDisplayDate(data.date_of_issue)}
                      </span>
                    </div>
                  </div>

                  {/* Spesialisasi (jika ada) */}
                  {data.specialization && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {t('lbl_specialization')}
                      </span>
                      <span className="font-semibold text-white block mt-0.5">
                        {data.specialization}
                      </span>
                    </div>
                  )}

                  {/* Tempat Terbit & Otoritas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        {t('lbl_issue_place')}
                      </span>
                      <span className="font-medium text-slate-300 block mt-0.5">
                        {data.place_of_issue || 'Jakarta'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Status Validasi
                      </span>
                      <span className="font-medium text-emerald-400 block mt-0.5 flex items-center gap-1">
                        <Icon name="check-circle-1" size={12} />
                        <span>Terverifikasi</span>
                      </span>
                    </div>
                  </div>

                  {/* Penerbit Resmi */}
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Otoritas Penerbit:</span>
                    <p>The Blue Economist International Association x DigiBlueCamp</p>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN (7 cols): Sertifikat Asli (Front & Back Only, NO REPLICA) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Front / Back Switcher (Hanya jika memiliki halaman belakang) */}
                {templateConfig.hasBack && (
                  <div className="inline-flex p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold print:hidden">
                    <button
                      type="button"
                      onClick={() => setActiveTab('front')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTab === 'front'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Halaman Depan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('back')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTab === 'back'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Halaman Belakang (Kurikulum)
                    </button>
                  </div>
                )}

                {/* Sertifikat Sheet Preview */}
                <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 shadow-lg space-y-2">
                  <div
                    onClick={() => setIsZoomOpen(true)}
                    className="group cursor-zoom-in relative rounded-xl overflow-hidden bg-white shadow-md transition-transform"
                    title="Klik untuk memperbesar sertifikat"
                  >
                    <RenderedCertificateSheet
                      side={activeTab === 'back' ? 'back' : 'front'}
                      data={data}
                      templateConfig={templateConfig}
                    />

                    {/* Hover Zoom Prompt */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold pointer-events-none">
                      <Icon name="scan" size={16} />
                      <span>Klik untuk Memperbesar</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                    <span>Pratinjau Sertifikat Resmi</span>
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Icon name="scan" size={13} />
                      <span>Layar Penuh</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════ */
          /* CASE B: NOT FOUND / INVALID SERIAL KEY                        */
          /* ═════════════════════════════════════════════════════════════ */
          <div className="max-w-xl mx-auto text-center py-10 sm:py-16 space-y-5">
            <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 text-slate-200 border border-slate-700">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <Icon name="xmark-circle" size={32} />
              </div>

              <h1 className="text-xl font-bold text-white mb-2">
                Sertifikat Tidak Ditemukan
              </h1>

              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                Nomor seri <span className="font-mono text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/40">{serialKey}</span> tidak ditemukan dalam basis data resmi.
              </p>

              {/* Form Cari Ulang */}
              <form onSubmit={handleSearchSubmit} className="max-w-sm mx-auto mb-6">
                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-700 rounded-xl focus-within:border-blue-500">
                  <span className="pl-3 text-slate-400">
                    <Icon name="search-1" size={15} />
                  </span>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Masukkan nomor seri lain..."
                    className="flex-1 bg-transparent text-xs text-white outline-none font-mono px-2"
                  />
                  <button
                    type="submit"
                    disabled={!searchInput.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cari
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-center gap-3 text-xs">
                <Link
                  href="/verify"
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  Kembali ke Portal
                </Link>
                <Link
                  href="/help"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium transition-colors border border-slate-700"
                >
                  Bantuan
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Minimal Footer ── */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 DigiBlue • The Blue Economist International Association</p>
        </div>
      </footer>

      {/* ── Modal Lightbox Zoom (Layar Penuh) ── */}
      {isZoomOpen && (
        <ModalPortal>
          <div
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6 cursor-zoom-out"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[92vh] bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-2xl flex flex-col items-center cursor-default animate-fadeup"
            >
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 flex items-center justify-center shadow-lg cursor-pointer"
                aria-label="Tutup pratinjau"
              >
                <Icon name="xmark" size={14} />
              </button>

              <div className="w-full overflow-auto max-h-[80vh] flex items-center justify-center rounded-xl bg-black/40 p-2">
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
                  {data?.recipient_name} — {data?.serial_number}
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="px-3.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Dedicated Full-Precision Print Document ── */}
      {isMounted && data && createPortal(
        <div id="certificate-print-document" className="hidden print:block">
          <div className="print-page-wrapper">
            <RenderedCertificateSheet
              side="front"
              data={data}
              templateConfig={templateConfig}
            />
          </div>
          {templateConfig.hasBack && (
            <div className="print-page-wrapper">
              <RenderedCertificateSheet
                side="back"
                data={data}
                templateConfig={templateConfig}
              />
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Print Stylesheet ── */}
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
            width: 100% !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#certificate-print-document),
          header, footer, nav, button, .print\\:hidden, main, section {
            display: none !important;
          }
          #certificate-print-document {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 99999999 !important;
          }
          .print-page-wrapper {
            width: 297mm !important;
            height: 210mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            overflow: hidden !important;
          }
          .print-page-wrapper:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
