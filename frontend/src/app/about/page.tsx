'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('AboutPage');

  const pillars = [
    {
      icon: 'water-drop-1',
      title: t('p1_title'),
      desc: t('p1_desc'),
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      icon: 'leaf-1',
      title: t('p2_title'),
      desc: t('p2_desc'),
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      icon: 'ship-1',
      title: t('p3_title'),
      desc: t('p3_desc'),
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      icon: 'user-multiple-4',
      title: t('p4_title'),
      desc: t('p4_desc'),
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const leaders = [
    {
      name: 'Kaisar Akhir, S.I.K., M.Sc.',
      role: 'Ketua Umum Maritim Muda Nusantara & Inisiator DigiBlue',
      bio: 'Pakar kebijakan kelautan dan ekonomi biru terapan lulusan Universitas Indonesia dan National Taiwan Ocean University. Berpengalaman dalam advokasi maritim pemuda internasional.',
      badge: 'Blue Economy Specialist',
    },
    {
      name: 'Dr. Hendra Wijaya, M.M., CBEc',
      role: 'Dewan Pakar Kurikulum & Asesor Utama',
      bio: 'Praktisi logistik pelabuhan dan perkapalan berpengalaman 20+ tahun. Instruktur tersertifikasi dalam pemodelan resiko maritim dan valuasi logistik hijau.',
      badge: 'Senior Maritime Assessor',
    },
    {
      name: 'Nadia Pratiwi, Ph.D.',
      role: 'Direktur Riset Karbon Biru & Finansial Berkelanjutan',
      bio: 'Peneliti oseanografi dan instrumen keuangan iklim pesisir. Mengkoordinasikan modul pembiayaan inovatif untuk perlindungan mangrove nasional.',
      badge: 'Ocean Climate Finance',
    },
    {
      name: 'Budi Santoso, M.Si.',
      role: 'Kepala Pengembangan Talenta Digital & LMS Maritim',
      bio: 'Fasilitator edukasi maritim digital berdedikasi tinggi, memastikan materi kursus dapat diakses inklusif oleh pembelajar di pulau-pulau 3T seluruh Indonesia.',
      badge: 'Digital Education Lead',
    },
  ];

  const consortiumEntities = [
    {
      name: 'The Blue Economist International',
      tag: t('ent1_tag'),
      desc: t('ent1_desc'),
      icon: 'globe-1',
    },
    {
      name: 'Maritim Muda Nusantara',
      tag: t('ent2_tag'),
      desc: t('ent2_desc'),
      icon: 'flag-1',
    },
    {
      name: 'Indonesia Blue Economy Center (IBEC)',
      tag: t('ent3_tag'),
      desc: t('ent3_desc'),
      icon: 'buildings-1',
    },
  ];

  return (
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00162d] via-[#0f2b48] to-[#00162d] text-white py-16 sm:py-24">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-sky-500 rounded-full filter blur-[120px] opacity-25" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-400 rounded-full filter blur-[100px] opacity-20" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold tracking-wider uppercase text-sky-200 mb-6 font-mono">
              <Icon name="certificate-badge-1" size={15} className="text-amber-400" />
              <span>{t('badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight font-heading">
              {t('title')}
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed font-normal">
              {t('desc')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/courses"
                className="px-7 py-3.5 bg-amber-500 hover:bg-amber-600 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-2 font-heading"
              >
                <span>{t('btn_courses')}</span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href="/verify"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-colors border border-white/20 inline-flex items-center gap-2"
              >
                <Icon name="shield-2-check" size={15} className="text-amber-400" />
                <span>{t('btn_verify')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Consortium Overview */}
      <section className="container py-16 sm:py-20 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {consortiumEntities.map((ent, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-5 border border-sky-100">
                  <Icon name={ent.icon} size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1 block font-mono">
                  {ent.tag}
                </span>
                <h3 className="text-xl font-bold text-[#00162d] mb-3 font-heading">
                  {ent.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {ent.desc}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2 font-medium">
                <Icon name="check-circle-1" size={14} className="text-emerald-600" />
                <span>{t('accredited_entity')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Strategic Visi & 4 Pilar 2030 */}
      <section id="pilar" className="bg-slate-100/60 border-y border-slate-200/80 py-16 sm:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/80 px-3.5 py-1 rounded-full mb-3 inline-block font-mono">
              {t('roadmap_badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00162d] tracking-tight font-heading">
              {t('roadmap_title')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              {t('roadmap_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-sky-300 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${p.color}`}>
                  <Icon name={p.icon} size={22} />
                </div>
                <h3 className="text-base font-bold text-[#00162d] mb-2 leading-snug font-heading">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership & Academic Board */}
      <section className="container py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-3.5 py-1 rounded-full mb-3 inline-block font-mono">
            {t('board_badge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00162d] tracking-tight font-heading">
            {t('board_title')}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            {t('board_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {leaders.map((lead, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Avatar Placeholder / Initial */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00162d] to-sky-700 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-sm font-heading">
                  {lead.name.charAt(0)}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block mb-2 font-mono">
                  {lead.badge}
                </span>
                <h3 className="text-base font-bold text-[#00162d] leading-snug mb-1 font-heading">
                  {lead.name}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mb-3">
                  {lead.role}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lead.bio}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('official_verifier')}</span>
                <span className="text-sky-600 font-bold">DigiBlue Board</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics of Impact */}
      <section className="bg-gradient-to-r from-[#00162d] via-[#0f2b48] to-[#00162d] text-white py-14">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 block mb-1">
                3.500+
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {t('stat1_label')}
              </span>
            </div>
            <div className="p-4">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white block mb-1">
                34
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {t('stat2_label')}
              </span>
            </div>
            <div className="p-4">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-sky-400 block mb-1">
                98%
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {t('stat3_label')}
              </span>
            </div>
            <div className="p-4">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 block mb-1">
                10+
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {t('stat4_label')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="container py-16 sm:py-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-200">
            <Icon name="graduation-cap-1" size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00162d] mb-4 font-heading">
            {t('cta_title')}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            {t('cta_desc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-2 font-heading"
            >
              <span>{t('btn_register')}</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link
              href="/help"
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <span>{t('btn_help')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
