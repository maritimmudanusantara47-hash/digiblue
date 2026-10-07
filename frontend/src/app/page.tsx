import Icon from '@/components/Icon';
import Link from 'next/link';
import type { Metadata } from 'next';
import ScrollReveal from '@/components/common/ScrollReveal';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'DigiBlueCamp — Kursus & Sertifikasi Blue Economy Online',
  description:
    'Kursus online Blue Economy dengan sertifikat yang bisa diverifikasi. Foundation Level & Specialization bersama The Blue Economist International Association.',
};

const certPoints = (t: any) => [
  { icon: 'file-multiple', title: t('cert_1_title'), desc: t('cert_1_desc') },
  { icon: 'shield-2-check', title: t('cert_2_title'), desc: t('cert_2_desc') },
  { icon: 'linkedin', title: t('cert_3_title'), desc: t('cert_3_desc') },
  { icon: 'layers-1', title: t('cert_4_title'), desc: t('cert_4_desc') },
];

const included = (t: any) => [
  t('inc_1'),
  t('inc_2'),
  t('inc_3'),
  t('inc_4'),
  t('inc_5'),
];

const faqs = (t: any) => [
  { q: t('faq_1_q'), a: t('faq_1_a') },
  { q: t('faq_2_q'), a: t('faq_2_a') },
  { q: t('faq_3_q'), a: t('faq_3_a') },
  { q: t('faq_4_q'), a: t('faq_4_a') },
];

export default function LandingPage() {
  const t = useTranslations('LandingPage');

  return (
    <main className="overflow-hidden bg-white">
      {/* =========================================================
          SECTION 1: HERO (Stitch Screenshot 113418)
      ========================================================= */}
      <section
        className="relative overflow-hidden bg-[#021528] text-white pt-12 pb-16 lg:pt-16 lg:pb-24"
        style={{
          backgroundImage: `linear-gradient(105deg, rgba(2, 21, 40, 0.94) 0%, rgba(3, 30, 58, 0.88) 55%, rgba(4, 45, 82, 0.65) 100%), url('/images/indonesia_ocean_backdrop.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Soft bioluminescent ambient background light */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-ocean-pulse" />
        <div
          className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl pointer-events-none animate-ocean-pulse"
          style={{ animationDelay: '3.5s' }}
        />

        <div className="container relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Subtitle, Action Buttons, Value Checkpoints */}
          <div className="lg:col-span-6 flex flex-col items-start text-left animate-fadeup-smooth">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 text-[#00B4D8] text-xs sm:text-sm font-semibold mb-4 sm:mb-5">
              <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-pulse" />
              <span>{t('hero_badge')}</span>
            </div>

            {/* Split Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[50px] font-black text-white leading-[1.18] sm:leading-[1.14] tracking-tight mb-4 sm:mb-5 font-heading">
              {t('hero_title')}<br />
              <span className="text-[#00B4D8] drop-shadow-sm">{t('hero_title_highlight')}</span>
            </h1>

            {/* Description Paragraph */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 max-w-xl leading-relaxed mb-6 sm:mb-8">
              {t('hero_desc')}
            </p>

            {/* Action Buttons: Solid Blue + Outline Ghost */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto mb-7 sm:mb-8">
              <Link
                href="/courses"
                className="w-full sm:w-auto justify-center px-7 py-3.5 rounded-xl sm:rounded-2xl bg-[#0096C7] hover:bg-[#0077B6] text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t('hero_btn_choose')}</span>
                <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#termasuk"
                className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-xl sm:rounded-2xl border border-white/30 hover:border-white/60 bg-transparent hover:bg-white/10 text-white font-semibold text-sm backdrop-blur-sm transition-all inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t('hero_btn_what')}</span>
              </a>
            </div>

            {/* Feature Bullets with Emerald Checkmarks */}
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">✓</span>
                <span><strong className="text-white">{t('hero_feat_1_bold')}</strong>{t('hero_feat_1_desc')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">✓</span>
                <span><strong className="text-white">{t('hero_feat_2_bold')}</strong>{t('hero_feat_2_desc')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Transparent 5 People Photo + Floating Stat Pill */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center pt-2 sm:pt-4 lg:pt-0">
            <div className="relative w-full max-w-md sm:max-w-xl lg:max-w-none lg:w-[114%] xl:w-[120%] lg:-mr-4 xl:-mr-8 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero_maritim_muda_transparent.png"
                alt="Pengurus & Pemuda Maritim Muda Nusantara"
                className="w-full h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02] drop-shadow-[0_20px_40px_rgba(2,15,30,0.7)] sm:drop-shadow-[0_25px_50px_rgba(2,15,30,0.75)]"
              />
            </div>

            {/* Floating dual-pill stat badge */}
            <div className="mt-3 sm:mt-4 lg:-mt-5 relative z-20 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full p-2.5 px-4 sm:px-6 shadow-2xl border border-slate-100 flex items-center justify-center gap-3 sm:gap-6 text-navy-dark animate-float-subtle max-w-full hover:shadow-sky-500/20 transition-all duration-300">
              {/* Stat 1 */}
              <div className="flex items-center gap-2.5 sm:gap-3 pr-3 sm:pr-5 border-r border-slate-200">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Icon name="globe-1" size={17} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] sm:text-sm font-extrabold text-[#00162d] leading-tight">{t('hero_stat_1_val')}</p>
                  <p className="text-[9px] sm:text-[11px] text-slate-500">{t('hero_stat_1_desc')}</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Icon name="thumbs-up-3" size={17} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] sm:text-sm font-extrabold text-[#00162d] leading-tight">{t('hero_stat_2_val')}</p>
                  <p className="text-[9px] sm:text-[11px] text-slate-500">{t('hero_stat_2_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 2: SUPPORTED BY / PARTNERS STRIP (Stitch Screenshot 113418)
      ========================================================= */}
      <section className="border-y border-slate-200/90 bg-white py-6">
        <ScrollReveal direction="up" distance={16} duration={600}>
          <div className="container flex flex-col md:flex-row items-center justify-center gap-5 md:gap-12">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              {t('partners_title')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-slate-700 font-bold text-sm">
              <span className="flex items-center gap-2 hover:text-sky-600 transition-colors cursor-default">
                <Icon name="globe-1" size={18} className="text-sky-600" />
                <span>The Blue Economist International Association</span>
              </span>
              <span className="flex items-center gap-2 hover:text-sky-600 transition-colors cursor-default">
                <Icon name="flag-1" size={18} className="text-emerald-600" />
                <span>SDG 14 — Life Below Water</span>
              </span>
              <span className="flex items-center gap-2 hover:text-sky-600 transition-colors cursor-default">
                <Icon name="anchor" size={18} className="text-[#00162d]" />
                <span>Maritim Muda Nusantara</span>
              </span>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================
          SECTION 3: 3 PROGRAM PATHWAYS (Stitch Screenshot 113436)
      ========================================================= */}
      <section className="container py-20 lg:py-24">
        <ScrollReveal direction="up" distance={20} duration={650}>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#00162d] mb-3 font-heading">
              {t('tracks_title')}
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              {t('tracks_desc')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: International Track */}
          <ScrollReveal delay={0} distance={24} duration={700} className="h-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-xl hover:border-sky-300 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon name="graduation-cap-1" size={24} />
                </div>
                <span className="inline-block text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full mb-3">
                  {t('track_int_badge')}
                </span>
                <h3 className="text-xl font-bold text-[#00162d] mb-3 font-heading group-hover:text-sky-600 transition-colors">
                  {t('track_int_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  {t.rich('track_int_desc', { bold: (chunks) => <strong className="text-slate-800">{chunks}</strong> })}
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('track_int_feat_1')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('track_int_feat_2')}</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/courses?track=INT_CERT"
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center bg-[#EBF5FF] hover:bg-[#0284C7] text-[#0284C7] hover:text-white transition-all duration-200 inline-flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{t('track_int_btn')}</span>
                <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Card 2: National Track */}
          <ScrollReveal delay={120} distance={24} duration={700} className="h-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon name="flag-1" size={24} />
                </div>
                <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-3">
                  {t('track_nat_badge')}
                </span>
                <h3 className="text-xl font-bold text-[#00162d] mb-3 font-heading group-hover:text-emerald-600 transition-colors">
                  {t('track_nat_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  {t('track_nat_desc')}
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('track_nat_feat_1')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('track_nat_feat_2')}</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/courses?track=NAT"
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center bg-[#EAFBF1] hover:bg-[#15803D] text-[#15803D] hover:text-white transition-all duration-200 inline-flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{t('track_nat_btn')}</span>
                <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Card 3: Modular Track */}
          <ScrollReveal delay={240} distance={24} duration={700} className="h-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between h-full shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon name="book-1" size={24} />
                </div>
                <span className="inline-block text-[11px] font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full mb-3">
                  {t('track_mod_badge')}
                </span>
                <h3 className="text-xl font-bold text-[#00162d] mb-3 font-heading group-hover:text-purple-600 transition-colors">
                  {t('track_mod_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  {t('track_mod_desc')}
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('track_mod_feat_1')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('track_mod_feat_2')}</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/courses?track=SGL"
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center bg-[#F7F0FF] hover:bg-[#7E22CE] text-[#7E22CE] hover:text-white transition-all duration-200 inline-flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{t('track_mod_btn')}</span>
                <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* =========================================================
            SECTION 4: CATALOG CTA STRIP (Stitch Screenshot 113451)
        ========================================================= */}
        <ScrollReveal delay={150} distance={18} duration={650}>
          <div className="mt-14 text-center bg-gradient-to-r from-sky-50/70 via-slate-50/80 to-amber-50/40 rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#00162d] mb-2 font-heading">
              {t('cta_catalog_title')}
            </h4>
            <p className="text-slate-500 text-sm max-w-xl mx-auto mb-6">
              {t('cta_catalog_desc')}
            </p>
            <Link
              href="/courses"
              className="px-8 py-3.5 rounded-xl bg-[#132847] hover:bg-[#0A192F] text-white text-sm font-bold shadow-lg shadow-navy/20 inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Icon name="books-2" size={18} />
              <span>{t('cta_catalog_btn')}</span>
              <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================
          SECTION 5: DARK STATS / WHY DIGIBLUE (Stitch Screenshot 113514)
      ========================================================= */}
      <section className="bg-[#0A192F] text-white relative overflow-hidden py-20 lg:py-24">
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left" distance={24} duration={700}>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 font-heading leading-tight">
                {t('why_title')}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
                {t('why_desc')}
              </p>
              <Link
                href="/courses"
                className="px-8 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A192F] text-sm font-black shadow-lg shadow-amber-500/25 inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>{t('why_btn')}</span>
                <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Symmetrical 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              ['14', t('why_stat_1')],
              ['10', t('why_stat_2')],
              ['3', t('why_stat_3')],
              ['1', t('why_stat_4')],
            ].map(([num, label], idx) => (
              <ScrollReveal key={label} delay={idx * 100} distance={20} duration={650} className="h-full">
                <div className="h-full min-h-[148px] rounded-2xl bg-[#132644] border border-slate-700/60 p-5 sm:p-6 flex flex-col justify-between hover:bg-[#1a335c] hover:border-amber-400/40 transition-all duration-300">
                  <div className="text-4xl sm:text-5xl font-black text-[#F59E0B] mb-2 font-heading">
                    {num}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-snug">
                    {label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 6: CERTIFICATE CREDENTIALS (Stitch Screenshot 113530)
      ========================================================= */}
      <section id="sertifikat" className="container py-20 lg:py-24 scroll-mt-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left" distance={24} duration={700}>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#00162d] mb-4 font-heading leading-tight">
                {t('cert_sec_title')}
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                {t('cert_sec_desc')}
              </p>
              <Link
                href="/courses"
                className="px-8 py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold shadow-md shadow-sky-600/25 inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>{t('cert_sec_btn')}</span>
                <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

          {/* 2x2 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certPoints(t).map((p, idx) => (
              <ScrollReveal key={p.title} delay={idx * 90} distance={18} duration={650} className="h-full">
                <div className="h-full min-h-[148px] rounded-2xl border border-slate-200 p-6 bg-white shadow-xs hover:shadow-md hover:border-sky-300 transition-all group flex flex-col justify-between">
                  <div>
                    <span className="w-10 h-10 rounded-xl bg-sky-50 text-[#00162d] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#0284C7] group-hover:text-white transition-all shadow-xs">
                      <Icon name={p.icon} size={20} />
                    </span>
                    <h3 className="font-bold text-[#00162d] mb-1.5 text-sm font-heading">{p.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 7: ALL-INCLUSIVE PROGRAM (Stitch Screenshot 113544)
      ========================================================= */}
      <section id="termasuk" className="bg-sky-50/50 border-y border-slate-200/80 scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="container grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <ScrollReveal direction="left" distance={24} duration={700}>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#00162d] mb-4 font-heading leading-tight">
                {t('inc_sec_title')}
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed max-w-lg">
                {t('inc_sec_desc')}
              </p>
              <div className="inline-flex items-center gap-3.5 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
                  <Icon name="medal-1" size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{t('inc_sec_badge_title')}</p>
                  <p className="font-bold text-[#00162d] text-sm font-heading">{t('inc_sec_badge_val')}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120} distance={24} duration={700}>
            <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-9 shadow-xl shadow-sky-500/5">
              <h3 className="font-bold text-[#00162d] mb-6 text-base font-heading flex items-center gap-2.5">
                <Icon name="shield-2-check" size={20} className="text-emerald-500" />
                <span>{t('inc_sec_list_title')}</span>
              </h3>
              <ul className="flex flex-col gap-3.5 mb-8">
                {included(t).map(i => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 group">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <Icon name="check-circle-1" size={15} />
                    </span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/courses"
                className="w-full py-4 px-6 rounded-xl bg-[#0096C7] hover:bg-[#0077B6] text-white text-sm font-bold shadow-lg shadow-sky-600/25 inline-flex items-center justify-center gap-2.5 group hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <span>{t('inc_sec_btn')}</span>
                <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================================
          SECTION 8: FAQ ACCORDION (Stitch Screenshot 113602)
      ========================================================= */}
      <section id="faq" className="container py-16 sm:py-20 lg:py-24 max-w-3xl scroll-mt-24">
        <ScrollReveal direction="up" distance={20} duration={650}>
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full">
              {t('faq_sec_badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#00162d] mt-3 font-heading">
              {t('faq_sec_title')}
            </h2>
          </div>
        </ScrollReveal>

        <div className="flex flex-col gap-3.5">
          {faqs(t).map((f, idx) => (
            <ScrollReveal key={f.q} delay={idx * 70} distance={16} duration={600}>
              <details className="group bg-white border border-slate-200/90 rounded-2xl px-5 sm:px-6 py-4.5 open:shadow-md open:border-sky-300 transition-all">
                <summary className="flex items-center justify-between cursor-pointer font-bold text-[#00162d] list-none text-sm sm:text-base font-heading select-none gap-3">
                  <span>{f.q}</span>
                  <span className="w-7 h-7 rounded-full bg-slate-50 group-open:bg-sky-50 flex items-center justify-center shrink-0 transition-colors">
                    <Icon name="chevron-down" size={15} className="text-slate-400 group-open:text-sky-600 transition-transform duration-300 group-open:rotate-180" />
                  </span>
                </summary>
                <p className="text-sm text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                  {f.a}
                </p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* =========================================================
          SECTION 9: PRE-FOOTER CTA CARD (Stitch Screenshot 113621)
      ========================================================= */}
      <section className="container pb-10">
        <ScrollReveal direction="up" distance={24} duration={700}>
          <div className="bg-[#1D406E] rounded-3xl text-center text-white px-6 sm:px-10 py-14 sm:py-16 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#F59E0B] mb-2">
                {t('cta_sec_badge')}
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-white mb-4 font-heading leading-tight">
                {t('cta_title')}
              </h2>
              <p className="text-white/80 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
                {t('cta_desc')}
              </p>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 sm:px-9 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A192F] text-sm font-black shadow-xl shadow-amber-500/25 inline-flex items-center justify-center gap-2.5 group hover:scale-105 active:scale-95 transition-all"
              >
                <span>{t('cta_btn')}</span>
                <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
