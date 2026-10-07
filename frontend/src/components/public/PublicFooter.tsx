'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useTranslations } from 'next-intl';

export default function PublicFooter() {
  const t = useTranslations('LandingPage');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="relative bg-white text-slate-600 overflow-hidden border-t border-slate-200/70 mt-auto">
      {/* Bathymetric Oceanic Wave Accent & Glowing Mesh */}
      <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
        {/* Soft bioluminescent cyan glow */}
        <div
          className="absolute -top-24 right-1/4 w-[600px] h-[350px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Deep navy-sky ambient light */}
        <div
          className="absolute -bottom-16 left-1/3 w-[500px] h-[300px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(30, 58, 95, 0.15) 60%, transparent 80%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Subtle decorative bathymetric contour lines (Maritime signature) */}
        <svg
          className="absolute right-0 bottom-0 w-full h-64 opacity-[0.035] text-navy-dark"
          viewBox="0 0 1200 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 240 C 300 280, 600 180, 900 220 C 1050 240, 1150 200, 1200 210" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 200 C 250 250, 550 140, 850 190 C 1020 220, 1120 170, 1200 180" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 160 C 200 210, 500 100, 800 150 C 980 180, 1100 130, 1200 150" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 120 C 150 170, 450 60, 750 110 C 940 140, 1070 90, 1200 120" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Top Pre-Footer Banner: Wawasan Maritim & Beasiswa Newsletter (Stitch Screenshot 113621) */}
      <div className="relative z-10 py-10">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-2.5 border border-sky-100">
                <Icon name="water-drop-1" size={13} className="text-sky-600" />
                <span>{t('footer_newsletter_badge')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-navy-dark tracking-tight font-heading">
                {t('footer_newsletter_title')}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {t('footer_newsletter_desc')}
              </p>
            </div>

            <div className="w-full lg:w-auto shrink-0">
              {subscribed ? (
                <div className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold animate-fadeup">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                  <span>{t('footer_newsletter_success')}</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-[460px]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer_newsletter_placeholder')}
                    required
                    className="flex-1 px-5 py-3 rounded-full text-sm border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-xs"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3 rounded-full text-sm font-bold text-white bg-[#1A3358] hover:bg-[#0E2038] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                  >
                    <span>{t('footer_newsletter_btn')}</span>
                    <Icon name="arrow-right" size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container relative z-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          {/* Column 1: Brand & Credentials (span 5) */}
          <div className="lg:col-span-5 md:col-span-2 flex flex-col justify-between">
            <div>
              {/* Crest & Identity */}
              <Link href="/" className="inline-flex items-center gap-3 group mb-4">
                <div className="w-10 h-10 rounded-xl bg-navy-dark text-white flex items-center justify-center p-2 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="certificate-badge-1" size={24} className="text-gold" />
                </div>
                <div>
                  <span className="font-extrabold text-navy-dark text-lg tracking-tight uppercase font-heading block leading-none">
                    DigiBlue
                  </span>
                  <span className="font-semibold text-slate-500 text-[11px] tracking-wider uppercase block mt-1">
                    Center for Maritime Education
                  </span>
                </div>
              </Link>

              <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-md">
                {t.rich('footer_brand_desc', { navy: (chunks) => <strong className="text-navy">{chunks}</strong> })}
              </p>
            </div>

            {/* Sekretariat / Office Address */}
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">{t('footer_office_title')}</p>
              <p>Indonesia Blue Economy Center (IBEC)</p>
              <p>Campus C, STIE Indonesia Jakarta</p>
              <p>Jalan Pratekan No. 9A, Rawamangun, Jakarta 13220</p>
              <p className="text-slate-400 pt-0.5">{t('footer_coord')}</p>
            </div>
          </div>

          {/* Column 2: Program & Sertifikasi (span 3) */}
          <div className="lg:col-span-3 md:col-span-1">
            <h4 className="font-bold text-navy-dark text-sm mb-4 tracking-tight font-heading flex items-center gap-2">
              <Icon name="graduation-cap-1" size={16} className="text-sky-600" />
              <span>{t('footer_nav_cert')}</span>
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-600">
              <li>
                <Link href="/courses?track=INT_CERT" className="hover:text-sky-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-xs text-slate-300">›</span>
                  <span>{t('footer_nav_cbec')}</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?track=INT_CERT" className="hover:text-sky-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-xs text-slate-300">›</span>
                  <span>{t('footer_nav_spec')}</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?track=NAT" className="hover:text-sky-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-xs text-slate-300">›</span>
                  <span>{t('footer_nav_nat')}</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?track=SGL" className="hover:text-sky-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                  <span className="text-xs text-slate-300">›</span>
                  <span>{t('footer_nav_sgl')}</span>
                </Link>
              </li>
              <li className="pt-1.5 border-t border-slate-100">
                <Link
                  href="/verify"
                  className="hover:text-sky-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5 font-medium text-navy-dark group text-xs sm:text-sm"
                >
                  <Icon name="shield-2-check" size={15} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                  <span>{t('footer_nav_verify')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Layanan & Bantuan (span 4) */}
          <div className="lg:col-span-4 md:col-span-1">
            <h4 className="font-bold text-navy-dark text-sm mb-4 tracking-tight font-heading flex items-center gap-2">
              <span>{t('footer_nav_contact')}</span>
            </h4>

            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              {t('footer_nav_contact_desc')}
            </p>

            {/* Direct Contact Pills */}
            <div className="space-y-2 mb-4 text-xs">
              <a
                href="mailto:halo@digibluecamp.id"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200/80 transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-sky-600 shrink-0 font-bold">@</span>
                <span className="truncate font-medium">halo@digibluecamp.id</span>
              </a>
              <a
                href="https://wa.me/6285710914949"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0">💬</span>
                <span className="font-medium">WhatsApp (+6285710914949)</span>
              </a>
            </div>

            {/* Quick Informational Links: Help Center & About Us */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600 mb-5 pb-3 border-b border-slate-100">
              <Link href="/help" className="hover:text-sky-600 inline-flex items-center gap-1.5 transition-colors">
                <span>{t('footer_nav_help')}</span>
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/about" className="hover:text-sky-600 inline-flex items-center gap-1.5 transition-colors">
                <span>{t('footer_nav_about')}</span>
              </Link>
            </div>

            {/* Social Media Channels with Premium Tooltips */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                {t('footer_nav_social')}
              </p>
              <div className="flex items-center gap-2">
                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/maritim-muda-nusantara"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn DigiBlue"
                  className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shadow-xs hover:scale-110 hover:-translate-y-0.5 transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/maritimmuda.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram DigiBlue"
                  className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-xs hover:scale-110 hover:-translate-y-0.5 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://www.youtube.com/@MaritimMudaNusantara"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube DigiBlue"
                  className="w-8 h-8 rounded-lg bg-[#FF0000] flex items-center justify-center text-white shadow-xs hover:scale-110 hover:-translate-y-0.5 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/MaritimMudaID"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook DigiBlue"
                  className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shadow-xs hover:scale-110 hover:-translate-y-0.5 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://x.com/maritimmudaid"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X DigiBlue"
                  className="w-8 h-8 rounded-lg bg-[#000000] flex items-center justify-center text-white shadow-xs hover:scale-110 hover:-translate-y-0.5 transition-all"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal Compliance */}
        <div className="border-t border-slate-200/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center md:text-left">
            <span>{t('footer_copyright')}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>{t('footer_supported')}</span>
          </div>

          <div className="flex items-center gap-3.5 text-slate-600 font-medium flex-wrap">
            <Link href="/terms" className="hover:text-navy-dark transition-colors">
              {t('footer_terms')}
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/privacy" className="hover:text-navy-dark transition-colors">
              {t('footer_privacy')}
            </Link>
          </div>
        </div>
      </div>

      {/* Signature Prestige Maritime Watermark (Not a cheap plagiarism, but an original architectural typographic statement) */}
      <div className="w-full relative flex items-center justify-center overflow-hidden pointer-events-none select-none pt-4 pb-2 -mb-2 bg-gradient-to-t from-sky-50/60 to-transparent">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase text-sky-600/40 font-heading mb-1">
            The Blue Economist
          </span>
          <span
            className="text-[14vw] sm:text-[13vw] font-black tracking-tight leading-none text-sky-900/[0.04] uppercase font-heading select-none"
            style={{
              WebkitTextStroke: '1px rgba(2, 132, 199, 0.08)',
            }}
          >
            DIGIBLUE
          </span>
        </div>
      </div>
    </footer>
  );
}
