import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Icon from '@/components/Icon';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const metadata: Metadata = {
  title: 'DigiBlueCamp — Autentikasi Resmi Blue Economy',
  description: 'Portal masuk dan pendaftaran resmi DigiBlueCamp & The Blue Economist International Association.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('AuthLayout');
  const tAuth = useTranslations('Auth');

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* ========================================================= */}
      {/* LEFT COLUMN: Nautical Prestige & Institutional Identity    */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative bg-[#07192C] text-white flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-800/60 shadow-2xl z-10">
        {/* Subtle Ambient Background Gradients (Pure maritime tones, no neon slop) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-blue-600/10 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-amber-400/5 blur-[80px] pointer-events-none" />

        {/* Subtle maritime grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Top: Home Link & Seal */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md transition-all group"
            >
              <svg
                className="w-3.5 h-3.5 text-sky-400 transition-transform group-hover:-translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{tAuth('back_to_home')}</span>
            </Link>
          </div>

          {/* DigiBlue Brand Crest */}
          <Link href="/" className="inline-flex items-center gap-3.5 group mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-sky-600 to-blue-700 p-0.5 shadow-lg shadow-sky-900/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-[#07192C] flex items-center justify-center">
                <Icon name="certificate-badge-1" size={24} className="text-amber-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-lg tracking-tight leading-tight uppercase font-heading">
                DigiBlue
              </span>
              <span className="font-medium text-sky-300/80 text-[11px] tracking-wider uppercase leading-none mt-0.5">
                Center for Maritime Education
              </span>
            </div>
          </Link>

          <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-snug font-heading mb-3">
            {t('hero_title')}
          </h2>

          <p className="text-slate-300/80 text-sm leading-relaxed max-w-md">
            {t('hero_desc')}
          </p>
        </div>

        {/* Middle: Institutional Endorsement */}
        <div className="relative z-10 my-8">
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-400 mb-2.5">
              <span className="text-sm">★</span>
              <span className="text-sm">★</span>
              <span className="text-sm">★</span>
              <span className="text-sm">★</span>
              <span className="text-sm">★</span>
              <span className="text-xs text-slate-300 ml-1 font-medium">Official Endorsement</span>
            </div>
            <blockquote className="text-slate-200 text-sm font-medium leading-relaxed mb-3 italic">
              "{t('quote')}"
            </blockquote>
            <p className="text-xs text-sky-300 font-semibold tracking-wide">
              {t('partner_title')}
            </p>
          </div>
        </div>

        {/* Bottom: Verified Metrics & Security Assurance */}
        <div className="relative z-10 pt-4">
          <div className="grid grid-cols-3 gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="text-xl xl:text-2xl font-black text-white font-heading">3,000+</div>
              <div className="text-slate-400 text-xs font-medium mt-0.5">{t('stat_trained')}</div>
            </div>
            <div>
              <div className="text-xl xl:text-2xl font-black text-white font-heading">11</div>
              <div className="text-slate-400 text-xs font-medium mt-0.5">{t('stat_programs')}</div>
            </div>
            <div>
              <div className="text-xl xl:text-2xl font-black text-white font-heading">30+</div>
              <div className="text-slate-400 text-xs font-medium mt-0.5">{t('stat_countries')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: Interactive Form Surface                    */}
      {/* ========================================================= */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col min-h-screen relative bg-slate-50/80">
        {/* Top utility bar */}
        <header className="w-full px-6 sm:px-10 pt-6 pb-2 flex items-center justify-between z-20">
          {/* Mobile brand header (shown only on small screens) */}
          <div className="flex lg:hidden items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#07192C] text-white flex items-center justify-center p-1.5 border border-slate-300/80 shadow-xs">
                <Icon name="certificate-badge-1" size={18} className="text-amber-400" />
              </div>
              <span className="font-extrabold text-[#07192C] text-base tracking-tight font-heading">
                DigiBlue
              </span>
            </Link>
          </div>

          {/* Desktop spacer */}
          <div className="hidden lg:block">
            <span className="text-xs font-medium text-slate-400">
              DigiBlue Official Portal
            </span>
          </div>

          {/* Quick utility controls: Language & Help */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/help"
              className="text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Icon name="headphone" size={14} className="text-slate-400" />
              <span>Bantuan</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <LanguageSwitcher />

            <Link
              href="/"
              className="lg:hidden text-xs font-semibold text-slate-600 hover:text-sky-700 p-1.5 rounded-lg border border-slate-200 bg-white shadow-xs"
              title={tAuth('back_to_home')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Center Auth Form Card Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 z-10">
          <div className="w-full max-w-[460px]">
            {children}
          </div>
        </div>

        {/* Footer info note */}
        <footer className="w-full px-6 sm:px-10 py-4 text-center text-xs text-slate-400 z-10">
          <p>© 2026 DigiBlueCamp x The Blue Economist International Association.</p>
        </footer>
      </main>
    </div>
  );
}
