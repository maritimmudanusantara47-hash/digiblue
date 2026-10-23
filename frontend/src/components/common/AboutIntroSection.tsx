import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ScrollReveal from './ScrollReveal';

export interface AboutIntroSectionProps {
  title: string;
  desc: string;
  point1: string;
  point2: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  className?: string;
  id?: string;
}

export default function AboutIntroSection({
  title,
  desc,
  point1,
  point2,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  className = '',
  id = 'about-intro',
}: AboutIntroSectionProps) {
  return (
    <section id={id} className={`relative py-16 sm:py-20 lg:py-24 overflow-hidden bg-white ${className}`}>
      {/* Decorative ambient subtle background glows */}
      <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Overlapping Dual Image Composition */}
          <div className="lg:col-span-5 relative">
            <ScrollReveal direction="left" distance={28} duration={700}>
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Image */}
                <div className="relative w-[84%] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-slate-100 group">
                  <Image
                    src="/images/about_learning_main.jpg"
                    alt="Pembelajaran Digital Ekonomi Biru DigiBlue"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 420px"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Inset Secondary Image (Overlapping at bottom-right) */}
                <div className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:right-0 w-[54%] aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-2xl z-20 group hover:scale-105 transition-all duration-300">
                  <Image
                    src="/images/about_colleagues_inset.jpg"
                    alt="Kolaborasi Pembelajaran Interaktif"
                    fill
                    className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 60vw, 260px"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Subtle Floating Badge */}
                <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-100 shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-[#00162d]">LMS Interaktif 24/7</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Narrative Content & Value Points */}
          <div className="lg:col-span-7 flex flex-col items-start pt-6 lg:pt-0">
            <ScrollReveal direction="right" distance={24} duration={700}>
              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-black text-[#00162d] tracking-tight mb-4 sm:mb-5 font-heading leading-tight sm:leading-[1.2]">
                {title}
              </h2>

              {/* Description Paragraph */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 font-normal">
                {desc}
              </p>

              {/* Feature Points */}
              <div className="space-y-4 sm:space-y-5 w-full mb-8">
                {/* Point 1: Sesuai industri digital & ekonomi biru */}
                <div className="flex items-start gap-4 p-4 sm:p-4.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-sky-300 hover:bg-sky-50/40 transition-all duration-200 group">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-100 text-[#0077B6] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    {/* SVG Bar Chart with Growth Arrow */}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <path d="M3 3v18h18" />
                      <path d="M7 16v-3" />
                      <path d="M11 16V9" />
                      <path d="M15 16V5" />
                      <path d="M7 11l4-4 4 2 5-5" />
                      <polyline points="16 4 20 4 20 8" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed pt-1">
                    {point1}
                  </p>
                </div>

                {/* Point 2: Metode synchronous & asynchronous */}
                <div className="flex items-start gap-4 p-4 sm:p-4.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-sky-300 hover:bg-sky-50/40 transition-all duration-200 group">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-100 text-[#0077B6] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    {/* SVG Synchronous & Asynchronous / Presentation Screen */}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                      <circle cx="8" cy="10" r="1.5" />
                      <path d="M12 9h4" />
                      <path d="M12 12h3" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed pt-1">
                    {point2}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {(ctaText || secondaryCtaText) && (
                <div className="flex flex-wrap items-center gap-3">
                  {ctaText && ctaHref && (
                    <Link
                      href={ctaHref}
                      className="px-6 py-3 rounded-xl bg-[#0096C7] hover:bg-[#0077B6] text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/25 transition-all inline-flex items-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{ctaText}</span>
                      <Icon name="arrow-right" size={14} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                  {secondaryCtaText && secondaryCtaHref && (
                    <Link
                      href={secondaryCtaHref}
                      className="px-5 py-3 rounded-xl border border-slate-300 hover:border-sky-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{secondaryCtaText}</span>
                      <Icon name="arrow-right" size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
