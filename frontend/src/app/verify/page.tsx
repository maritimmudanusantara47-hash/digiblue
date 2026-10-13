'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ModalPortal from '@/components/common/ModalPortal';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface CertVerificationData {
  recipient_name: string;
  program_name: string;
  level: string;
  specialization?: string;
  serial_number: string;
  serial_url_key?: string;
  grade?: string;
  date_of_issue: string;
  place_of_issue?: string;
  status?: string;
}

export default function VerifyPortalPage() {
  const t = useTranslations('VerifyPage');
  const [serialInput, setSerialInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    searched: boolean;
    valid: boolean;
    message: string;
    data: CertVerificationData | null;
  }>({
    searched: false,
    valid: false,
    message: '',
    data: null,
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || serialInput).trim();
    if (!code) return;

    setIsVerifying(true);

    try {
      const res = await api.get(`/verify/${encodeURIComponent(code)}`);
      if (res.data?.valid && res.data?.data) {
        setResult({
          searched: true,
          valid: true,
          message: res.data.message || 'Kredensial sertifikat terverifikasi valid dan resmi di sistem DigiBlue.',
          data: {
            ...res.data.data,
            status: 'valid',
          },
        });
      } else {
        setResult({
          searched: true,
          valid: false,
          message: res.data?.message || 'Nomor seri tidak ditemukan dalam basis data resmi.',
          data: null,
        });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosErr?.response?.data?.message ||
        `Nomor seri "${code}" tidak ditemukan dalam sistem akreditasi maritim DigiBlue. Mohon periksa kembali nomor sertifikat Anda.`;
      setResult({
        searched: true,
        valid: false,
        message: errorMessage,
        data: null,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyValidationLink = () => {
    if (typeof window !== 'undefined' && (result.data?.serial_url_key || result.data?.serial_number)) {
      const code = result.data.serial_url_key || encodeURIComponent(result.data.serial_number);
      navigator.clipboard.writeText(`${window.location.origin}/verify/${code}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const faqs = [
    {
      q: 'Bagaimana cara memverifikasi sertifikat DigiBlue?',
      a: 'Masukkan Nomor Seri Unik Kredensial yang tercetak pada sertifikat fisik atau file PDF Anda (misalnya: CBEC/ID/IX/20260166 atau kode pada QR), lalu klik tombol "Verifikasi". Basis data konsorsium maritim akan menampilkan status validitas dokumen secara real-time.',
    },
    {
      q: 'Di mana saya dapat menemukan nomor seri sertifikat?',
      a: 'Nomor seri tercetak di sudut kanan sertifikat DigiBlue, tepat di samping kode QR otentikasi serta pada metadata dokumen sertifikat digital PDF resmi Anda.',
    },
    {
      q: 'Apakah sertifikat DigiBlue diakui oleh industri maritim internasional?',
      a: 'Ya. Sertifikat diterbitkan atas mandat konsorsium The Blue Economist International Association bekerjasama dengan Maritim Muda Nusantara dan Indonesia Blue Economy Center (IBEC), selaras dengan target SDG 14 dan standar IMO 2050.',
    },
    {
      q: 'Apa yang harus dilakukan jika nomor seri tidak ditemukan?',
      a: 'Pastikan nomor seri yang Anda masukkan sesuai tanpa spasi tambahan. Jika sertifikat baru diterbitkan kurang dari 24 jam, proses replikasi basis data sedang berjalan. Anda dapat menghubungi layanan bantuan di halo@digibluecamp.id.',
    },
  ];

  return (
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700 font-sans">
      {/* Hero Section with Deep Oceanic Grounding */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00162d] via-[#0f2b48] to-[#00162d] text-white py-16 sm:py-20 lg:py-24 border-b border-white/10">
        {/* Subtle Decorative Bathymetric & Glow Mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sky-500 rounded-full filter blur-[120px] opacity-30" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-400 rounded-full filter blur-[100px] opacity-20" />
          <svg className="w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="verify-mesh" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#verify-mesh)" />
          </svg>
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-sky-200 mb-6 font-mono">
              <Icon name="shield-2-check" size={14} className="text-amber-400" />
              <span>{t('badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight font-heading">
              {t('title')}
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed font-normal">
              {t('desc')}
            </p>

            {/* Glowing Search Box Matching Stitch Spec */}
            <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 max-w-2xl mx-auto text-left">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="flex flex-col sm:flex-row items-stretch gap-2.5"
              >
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="search-1" size={18} />
                  </span>
                  <input
                    id="verify-serial-input"
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="w-full h-12 sm:h-14 pl-11 pr-4 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all uppercase tracking-wide font-mono"
                  />
                  {serialInput && (
                    <button
                      type="button"
                      onClick={() => setSerialInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label="Bersihkan input"
                    >
                      <Icon name="xmark" size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-verify-submit"
                    type="submit"
                    disabled={isVerifying || !serialInput.trim()}
                    className="flex-1 sm:flex-initial h-12 sm:h-14 px-7 sm:px-9 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-[#0f2b48] font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-heading"
                  >
                    {isVerifying ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-[#0f2b48]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>{t('btn_verifying')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('btn_verify')}</span>
                        <Icon name="arrow-right" size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    title={t('qr_modal_title')}
                    className="h-12 sm:h-14 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl border border-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Icon name="scan" size={20} />
                  </button>
                </div>
              </form>

              {/* Informational Guidance Text */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5">
                <Icon name="shield-2-check" size={14} className="text-emerald-600 shrink-0" />
                <span>{t('search_guidance')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: State-Dependent */}
      <section className="container py-12 sm:py-16 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto">
          {/* STATE 1: INITIAL UNSEARCHED STATE */}
          {!result.searched && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-5 border border-sky-100 shadow-xs">
                <Icon name="search-1" size={28} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#00162d] mb-3 font-heading">
                {t('unsearched_title')}
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
                {t('unsearched_desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-slate-100 pt-8">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-[#00162d] font-bold text-sm">
                    <Icon name="certificate-badge-1" size={16} className="text-amber-500" />
                    <span>{t('unsearched_item1_title')}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('unsearched_item1_desc')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-[#00162d] font-bold text-sm">
                    <Icon name="shield-2-check" size={16} className="text-emerald-500" />
                    <span>{t('unsearched_item2_title')}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('unsearched_item2_desc')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-[#00162d] font-bold text-sm">
                    <Icon name="scan" size={16} className="text-sky-500" />
                    <span>{t('unsearched_item3_title')}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('unsearched_item3_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: SEARCHED & NOT FOUND / INVALID */}
          {result.searched && !result.valid && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200/90 shadow-xl max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5 border border-rose-100 shadow-xs">
                <Icon name="xmark" size={30} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full mb-3 inline-block font-mono border border-rose-200">
                {t('invalid_badge')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#00162d] mb-3 font-heading">
                {t('invalid_title')}
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
                {result.message}
              </p>

              <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-200 text-xs text-slate-600 space-y-2 mb-8 max-w-lg mx-auto">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Icon name="question-mark-circle" size={14} className="text-sky-600" />
                  <span>{t('invalid_troubleshoot')}</span>
                </div>
                <p>{t('invalid_tip1')}</p>
                <p>{t('invalid_tip2')}</p>
                <p>{t('invalid_tip3')}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setResult({ searched: false, valid: false, message: '', data: null });
                    setSerialInput('');
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('btn_try_another')}
                </button>
                <Link
                  href="/help"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 inline-flex items-center gap-1.5"
                >
                  <Icon name="chat-bubble-2" size={14} />
                  <span>{t('btn_contact_support')}</span>
                </Link>
              </div>
            </div>
          )}

          {/* STATE 3: SEARCHED & VALID DATA FOUND */}
          {result.searched && result.valid && result.data && (
            <div>
              {/* Metadata Chips Band */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t('cert_registered')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                    <Icon name="scan" size={12} />
                    {t('cert_valid')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                    <Icon name="water-drop-1" size={12} className="text-amber-600" />
                    {t('cert_sdg')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="hidden sm:inline">{t('cert_db_status')}</span>
                  <span className="font-bold text-emerald-600">{t('cert_live')}</span>
                </div>
              </div>

              {/* Certificate Scaled Frame Replica */}
              <div className="relative rounded-3xl p-4 sm:p-7 md:p-8 shadow-2xl transition-all border border-slate-300/80 bg-gradient-to-br from-[#0a192f] via-[#0f2b48] to-[#0a192f] text-slate-900">
                {/* Outer Gold Trim & Frame Accent */}
                <div className="relative bg-[#ffffff] rounded-2xl p-6 sm:p-10 md:p-12 border-4 border-amber-400/90 shadow-inner overflow-hidden">
                  {/* Inner Decorative Double Gold Inset Border */}
                  <div className="absolute inset-3 sm:inset-4 md:inset-5 border-2 border-amber-300/60 rounded-xl pointer-events-none" />
                  <div className="absolute inset-5 sm:inset-6 md:inset-7 border border-slate-200/90 rounded-lg pointer-events-none" />

                  {/* Watermark Crest Background */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
                    <Icon name="certificate-badge-1" size={500} />
                  </div>

                  {/* Certificate Header Crest & Institutes */}
                  <div className="relative z-10 flex flex-col items-center text-center pb-6 sm:pb-8 border-b border-amber-200/80">
                    <div className="flex items-center gap-4 sm:gap-6 mb-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#00162d] text-amber-400 flex items-center justify-center p-2.5 shadow-md border-2 border-amber-400">
                        <Icon name="certificate-badge-1" size={32} />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-sky-800 font-mono block">
                          {t('cert_inst_sub')}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-[#00162d] tracking-tight uppercase font-heading block">
                          {t('cert_inst_main')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-amber-700 block font-mono">
                        {t('cert_header_badge')}
                      </span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#00162d] tracking-tight font-heading uppercase mt-1">
                        {t('cert_header_title')}
                      </h2>
                    </div>
                  </div>

                  {/* Certificate Body (Recipient & Program) */}
                  <div className="relative z-10 py-6 sm:py-8 text-center space-y-4">
                    <p className="text-xs sm:text-sm text-slate-500 font-serif italic">
                      {t('cert_certifies')}
                    </p>

                    <div className="py-2">
                      <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#00162d] tracking-tight font-heading underline decoration-amber-400 decoration-2 underline-offset-8">
                        {result.data.recipient_name}
                      </h3>
                      {result.data.grade && (
                        <span className="text-xs sm:text-sm font-mono font-bold text-sky-800 mt-2 block tracking-wider uppercase">
                          {t('cert_grade_prefix')} {result.data.grade}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                      {t('cert_completed')}
                    </p>

                    <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 sm:p-5 max-w-xl mx-auto shadow-xs">
                      <span className="text-xs font-bold font-mono text-sky-800 uppercase tracking-wider block">
                        {result.data.program_name}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#00162d] block mt-1">
                        {t('cert_level_prefix')} {result.data.level}
                      </span>
                      {result.data.specialization && (
                        <span className="text-xs font-medium text-slate-600 block mt-1">
                          {t('cert_focus_prefix')} {result.data.specialization}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Certificate Footer: Serial, Date & Seal */}
                  <div className="relative z-10 pt-6 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Left: Serial Number & Issue Info */}
                    <div className="text-left space-y-1.5 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">{t('cert_serial_label')}</span>
                        <span className="font-mono font-extrabold text-sm text-[#00162d] bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                          {result.data.serial_number}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {t('cert_issued_label')} {result.data.date_of_issue} • {result.data.place_of_issue || 'Jakarta, Indonesia'}
                      </div>
                    </div>

                    {/* Right: Golden Seal Stamp */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-1 shadow-lg flex items-center justify-center">
                        <div className="w-full h-full rounded-full border border-amber-600/50 flex flex-col items-center justify-center text-center p-1 bg-amber-500 text-[#00162d]">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase font-mono tracking-tighter leading-tight">
                            SEAL OF AUTHENTICITY
                          </span>
                          <Icon name="certificate-badge-1" size={14} className="my-0.5 text-[#00162d]" />
                          <span className="text-[7px] sm:text-[8px] font-bold tracking-tighter">
                            DIGIBLUE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-2 text-xs text-sky-200">
                    <Icon name="check-circle-1" size={16} className="text-emerald-400" />
                    <span>{t('cert_verified_note')}</span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyValidationLink}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="link-2-angular-right" size={14} />
                      <span>{copiedLink ? t('btn_copied') : t('btn_copy_link')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-[#0f2b48] transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer font-heading"
                    >
                      <Icon name="printer" size={14} />
                      <span>{t('btn_print')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3 Pillars of Security & Accreditation */}
      <section className="container py-14 sm:py-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-3.5 py-1 rounded-full mb-3 inline-block font-mono">
            {t('pillar_badge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#00162d] tracking-tight font-heading">
            {t('pillar_title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-5 border border-sky-100">
              <Icon name="shield-2" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#00162d] mb-2 font-heading">{t('p1_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('p1_desc')}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 border border-amber-100">
              <Icon name="globe-1" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#00162d] mb-2 font-heading">{t('p2_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('p2_desc')}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
              <Icon name="bolt-2" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#00162d] mb-2 font-heading">{t('p3_title')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('p3_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="bg-slate-100/60 border-t border-slate-200/70 py-16 sm:py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#00162d] tracking-tight mb-3 font-heading">
              {t('faq_title')}
            </h2>
            <p className="text-slate-600 text-sm">
              {t('faq_desc')}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-sky-600' : ''}`}>
                      <Icon name="chevron-down" size={16} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="container py-14 sm:py-16">
        <div className="bg-gradient-to-r from-[#00162d] to-[#0f2b48] rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 font-heading">
              {t('bottom_cta_title')}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
              {t('bottom_cta_desc')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/courses"
                className="px-7 py-3.5 bg-amber-500 hover:bg-amber-600 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-2 font-heading"
              >
                <span>{t('btn_explore_catalog')}</span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href="/about"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-colors border border-white/20 inline-flex items-center gap-2"
              >
                <span>{t('btn_about_consortium')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QR Scanner Guidance Modal */}
      {showQrModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative my-auto animate-fadeup border border-slate-100">
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                aria-label="Tutup modal"
              >
                <Icon name="xmark" size={16} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3 border border-sky-100">
                  <Icon name="scan" size={26} />
                </div>
                <h3 className="text-lg font-bold text-[#00162d] font-heading">{t('qr_modal_title')}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t('qr_modal_desc')}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span className="leading-relaxed">{t('qr_step1')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span className="leading-relaxed">{t('qr_step2')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span className="leading-relaxed">{t('qr_step3')}</span>
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-[#112a46] hover:bg-[#00162d] text-white font-semibold text-sm rounded-full transition-colors cursor-pointer shadow-sm"
              >
                {t('qr_close')}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
