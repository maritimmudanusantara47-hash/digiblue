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
    <>
      <main className="overflow-hidden">
        {/* Hero Section (IBMI Style dengan Nuansa Lautan Indonesia) */}
        <section
          className="relative overflow-hidden bg-navy-dark text-white pt-14 pb-20 lg:pt-20 lg:pb-28"
          style={{
            backgroundImage: `linear-gradient(105deg, rgba(3, 21, 39, 0.94) 0%, rgba(4, 31, 57, 0.88) 55%, rgba(6, 45, 79, 0.65) 100%), url('/images/indonesia_ocean_backdrop.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gentle bioluminescent ambient pulse lights */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-ocean-pulse" />
          <div
            className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl pointer-events-none animate-ocean-pulse"
            style={{ animationDelay: '3.5s' }}
          />

          <div className="container relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Subtitle, CTA, Value Checklist */}
            <div className="lg:col-span-6 flex flex-col items-start text-left animate-fadeup-smooth">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sky-300 text-xs font-semibold mb-4 sm:mb-5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>{t('hero_badge')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[50px] font-extrabold text-white leading-[1.18] sm:leading-[1.14] tracking-tight mb-4 sm:mb-5 font-heading">
                {t('hero_title')}<br />
                <span className="text-[#38bdf8] drop-shadow-sm">{t('hero_title_highlight')}</span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 max-w-xl leading-relaxed mb-6 sm:mb-8">
                {t('hero_desc')}
              </p>

              {/* Action Buttons: Unified Rounded-2xl, Fully Responsive Stack/Inline */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 w-full sm:w-auto mb-7 sm:mb-8">
                <Link
                  href="/courses"
                  className="w-full sm:w-auto justify-center px-7 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{t('hero_btn_choose')}</span>
                  <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#harga"
                  className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-2xl border border-white/25 hover:border-white/50 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-sm transition-all inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{t('hero_btn_what')}</span>
                </a>
              </div>

              {/* Value proposition checklist */}
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

            {/* Right Column: Hero Maritim Muda Photo (Vertically Centered on Y-Axis) + Floating Dual-Pill Stat Badge */}
            <div className="lg:col-span-6 relative flex flex-col items-center justify-center pt-2 sm:pt-4 lg:pt-0">
              <div className="relative w-full max-w-md sm:max-w-xl lg:max-w-none lg:w-[114%] xl:w-[120%] lg:-mr-4 xl:-mr-8 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero_maritim_muda_transparent.png"
                  alt="Pengurus & Pemuda Maritim Muda Nusantara"
                  className="w-full h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02] drop-shadow-[0_20px_40px_rgba(2,15,30,0.7)] sm:drop-shadow-[0_25px_50px_rgba(2,15,30,0.75)]"
                />
              </div>

              {/* Floating dual-pill badge: Fully responsive on mobile, tablet & desktop */}
              <div className="mt-3 sm:mt-4 lg:-mt-5 relative z-20 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full p-2 sm:p-2.5 px-3 sm:px-5 shadow-2xl border border-slate-100 flex items-center justify-center gap-2 sm:gap-5 text-navy-dark animate-float-subtle max-w-full hover:shadow-sky-500/20 transition-all duration-300">
                {/* Left pill stat */}
                <div className="flex items-center gap-2 sm:gap-3 pr-2.5 sm:pr-4 border-r border-slate-200">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Icon name="globe-1" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] sm:text-sm font-extrabold text-navy-dark leading-tight">{t('hero_stat_1_val')}</p>
                    <p className="text-[9px] sm:text-[11px] text-slate-500">{t('hero_stat_1_desc')}</p>
                  </div>
                </div>

                {/* Right pill stat */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Icon name="thumbs-up-3" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] sm:text-sm font-extrabold text-navy-dark leading-tight">{t('hero_stat_2_val')}</p>
                    <p className="text-[9px] sm:text-[11px] text-slate-500">{t('hero_stat_2_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Strip with Gentle Scroll Reveal */}
        <section className="border-y border-slate-100 bg-slate-50/70 py-7">
          <ScrollReveal direction="up" distance={16} duration={600}>
            <div className="container flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">{t('partners_title')}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-navy font-bold text-sm">
                <span className="flex items-center gap-2 opacity-80 hover:opacity-100 hover:text-sky-600 transition-all cursor-default">
                  <Icon name="globe-1" size={19} className="text-sky-600" />
                  <span>The Blue Economist International Association</span>
                </span>
                <span className="flex items-center gap-2 opacity-80 hover:opacity-100 hover:text-sky-600 transition-all cursor-default">
                  <Icon name="flag-1" size={19} className="text-emerald-600" />
                  <span>SDG 14 — Life Below Water</span>
                </span>
                <span className="flex items-center gap-2 opacity-80 hover:opacity-100 hover:text-sky-600 transition-all cursor-default">
                  <Icon name="anchor" size={19} className="text-navy" />
                  <span>Maritim Muda Nusantara</span>
                </span>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Program Tracks Overview (3 Cards with Staggered Cascading Animations & Unified Buttons) */}
        <section className="container py-20 lg:py-24">
          <ScrollReveal direction="up" distance={20} duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-dark mt-3 mb-3 font-heading">
                {t('tracks_title')}
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                {t('tracks_desc')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Track 1: {t('track_int_title')} */}
            <ScrollReveal delay={0} distance={24} duration={700} className="h-full">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 card-hover-marine flex flex-col justify-between h-full group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-navy group-hover:text-white transition-all duration-300">
                    <Icon name="graduation-cap-1" size={24} />
                  </div>
                  <span className="inline-block text-[11px] font-bold text-navy bg-navy/10 px-2.5 py-0.5 rounded-full mb-3">
                    {t('track_int_badge')}
                  </span>
                  <h3 className="text-xl font-bold text-navy-dark mb-3 font-heading group-hover:text-sky-600 transition-colors">
                    {t('track_int_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                    {t.rich('track_int_desc', { bold: (chunks) => <strong>{chunks}</strong> })}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('track_int_feat_1')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('track_int_feat_2')}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/courses?track=INT_CERT"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center border border-sky-200 bg-sky-50/70 hover:bg-sky-600 text-sky-800 hover:text-white transition-all duration-200 inline-flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>{t('track_int_btn')}</span>
                  <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Track 2: {t('track_nat_title')} */}
            <ScrollReveal delay={120} distance={24} duration={700} className="h-full">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 card-hover-marine flex flex-col justify-between h-full group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Icon name="flag-1" size={24} />
                  </div>
                  <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-3">
                    {t('track_nat_badge')}
                  </span>
                  <h3 className="text-xl font-bold text-navy-dark mb-3 font-heading group-hover:text-emerald-600 transition-colors">
                    {t('track_nat_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                    {t('track_nat_desc')}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('track_nat_feat_1')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('track_nat_feat_2')}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/courses?track=NAT"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-600 text-emerald-800 hover:text-white transition-all duration-200 inline-flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>{t('track_nat_btn')}</span>
                  <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Track 3: {t('track_mod_title')} */}
            <ScrollReveal delay={240} distance={24} duration={700} className="h-full">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 card-hover-marine flex flex-col justify-between h-full group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    <Icon name="book-1" size={24} />
                  </div>
                  <span className="inline-block text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full mb-3">
                    {t('track_mod_badge')}
                  </span>
                  <h3 className="text-xl font-bold text-navy-dark mb-3 font-heading group-hover:text-purple-600 transition-colors">
                    {t('track_mod_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                    {t('track_mod_desc')}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('track_mod_feat_1')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('track_mod_feat_2')}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/courses?track=SGL"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center border border-purple-200 bg-purple-50/70 hover:bg-purple-600 text-purple-800 hover:text-white transition-all duration-200 inline-flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>{t('track_mod_btn')}</span>
                  <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* CTA to Full Catalog */}
          <ScrollReveal delay={150} distance={18} duration={650}>
            <div className="mt-14 text-center bg-gradient-to-r from-sky-50 via-slate-50 to-amber-50/40 rounded-3xl p-8 border border-slate-200/80 shadow-xs">
              <h4 className="text-lg font-bold text-navy-dark mb-2 font-heading">
                {t('cta_catalog_title')}
              </h4>
              <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-xl mx-auto">
                {t('cta_catalog_desc')}
              </p>
              <Link
                href="/courses"
                className="px-8 py-3.5 rounded-2xl bg-navy hover:bg-navy-dark text-white text-sm font-bold shadow-lg shadow-navy/20 inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Icon name="books-2" size={18} />
                <span>{t('cta_catalog_btn')}</span>
                <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </section>

        {/* Why DigiBlue (Ocean Depth Glow with Symmetrical Boxes & Symmetrical Buttons) */}
        <section className="bg-navy-dark text-white relative overflow-hidden py-20 lg:py-24">
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
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
                  className="px-8 py-3.5 rounded-2xl bg-gold hover:bg-gold-dark text-navy-dark text-sm font-extrabold shadow-lg shadow-gold/25 inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>{t('why_btn')}</span>
                  <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Symmetrical 2x2 Metric Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                ['14', t('why_stat_1')],
                ['10', t('why_stat_2')],
                ['3', t('why_stat_3')],
                ['1', t('why_stat_4')],
              ].map(([n, txt], idx) => (
                <ScrollReveal key={txt} delay={idx * 100} distance={20} duration={650} className="h-full">
                  <div className="h-full min-h-[140px] sm:min-h-[148px] rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-6 flex flex-col justify-between hover:bg-white/10 hover:border-gold/40 hover:-translate-y-1 transition-all duration-300 group">
                    <div className="text-3xl sm:text-4xl font-extrabold text-gold mb-2 sm:mb-3 font-heading group-hover:scale-105 transition-transform origin-left">
                      {n}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-snug min-h-[2.5rem] sm:min-h-[2.75rem] flex items-start">
                      {txt}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Certificate Section */}
        <section id="sertifikat" className="container py-20 lg:py-24 scroll-mt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left" distance={24} duration={700}>
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-dark mb-4 font-heading leading-tight">
                  {t('cert_sec_title')}
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {t('cert_sec_desc')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-600/25 inline-flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <span>{t('cert_sec_btn')}</span>
                    <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certPoints(t).map((p, idx) => (
                <ScrollReveal key={p.title} delay={idx * 90} distance={18} duration={650} className="h-full">
                  <div className="h-full min-h-[140px] rounded-2xl border border-slate-200 p-5 card-hover-marine bg-white group flex flex-col justify-between">
                    <div>
                      <span className="w-11 h-11 rounded-xl bg-sky-50 text-navy flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 shadow-xs">
                        <Icon name={p.icon} size={20} />
                      </span>
                      <h3 className="font-bold text-navy-dark mb-1 text-sm font-heading">{p.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Included / All-Inclusive Section */}
        <section id="harga" className="bg-sky-50/80 border-y border-sky-100/80 scroll-mt-24 py-16 sm:py-20 lg:py-24">
          <div className="container grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <ScrollReveal direction="left" distance={24} duration={700}>
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-dark mb-4 font-heading leading-tight">
                  {t('inc_sec_title')}
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {t('inc_sec_desc')}
                </p>
                <div className="inline-flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-navy flex items-center justify-center shrink-0">
                    <Icon name="medal-1" size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{t('inc_sec_badge_title')}</p>
                    <p className="font-extrabold text-navy-dark font-heading">{t('inc_sec_badge_val')}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120} distance={24} duration={700}>
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl shadow-sky-500/5 hover:border-sky-300 transition-all duration-300">
                <h3 className="font-bold text-navy-dark mb-5 text-base font-heading flex items-center gap-2">
                  <Icon name="shield-2-check" size={18} className="text-emerald-500" />
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
                  href="/register"
                  className="w-full py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-lg shadow-sky-600/25 inline-flex items-center justify-center gap-2.5 group hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <span>{t('inc_sec_btn')}</span>
                  <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="container py-16 sm:py-20 lg:py-24 max-w-3xl scroll-mt-24">
          <ScrollReveal direction="up" distance={20} duration={650}>
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {t('faq_sec_badge')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-dark mt-3 font-heading">
                {t('faq_sec_title')}
              </h2>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-3.5">
            {faqs(t).map((f, idx) => (
              <ScrollReveal key={f.q} delay={idx * 70} distance={16} duration={600}>
                <details className="group bg-white border border-slate-200/90 rounded-2xl px-5 sm:px-6 py-4 sm:py-4.5 open:shadow-md open:border-sky-300/80 transition-all">
                  <summary className="flex items-center justify-between cursor-pointer font-bold text-navy-dark list-none text-sm sm:text-base font-heading select-none gap-3">
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

        {/* Final CTA Banner */}
        <section className="container pb-16 sm:pb-20 lg:pb-24">
          <ScrollReveal direction="up" distance={24} duration={700}>
            <div className="gradient-hero rounded-3xl text-center text-white px-5 sm:px-8 py-12 sm:py-16 lg:py-20 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,168,32,0.2)_0%,transparent_70%)] animate-ocean-pulse" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="inline-block text-xs uppercase tracking-widest font-bold text-gold px-3 py-1 mb-3">
                  {t('cta_sec_badge')}
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 font-heading leading-tight">
                  {t('cta_title')}
                </h2>
                <p className="text-white/80 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
                  {t('cta_desc')}
                </p>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-gold hover:bg-gold-dark text-navy-dark text-base font-extrabold shadow-xl shadow-gold/30 inline-flex items-center justify-center gap-2.5 group hover:scale-105 active:scale-95 transition-all"
                >
                  <span>{t('cta_btn')}</span>
                  <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </>
  );
}
