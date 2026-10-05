'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';

interface CourseCard {
  level: 'Foundation' | 'Specialization';
  title: string;
  desc: string;
  duration: string;
  icon: string;
  topic: string;
}

const COURSES: CourseCard[] = [
  { level: 'Foundation', title: 'Certified Blue Economist (CBEc)', desc: 'Dasar ekosistem Blue Economy: SDG 14, UNCLOS 1982, tata kelola perikanan, dan keuangan biru.', duration: 'Modul + Ujian + Field Study', icon: 'graduation-cap-1', topic: 'Foundation' },
  { level: 'Specialization', title: 'Blue Business Development', desc: 'Rancang model bisnis biru yang berkelanjutan dan siap diinvestasikan.', duration: 'Modul + Essay Studi Kasus', icon: 'briefcase-1', topic: 'Bisnis & Keuangan' },
  { level: 'Specialization', title: 'Blue Carbon', desc: 'Mangrove, lamun, dan valuasi karbon pesisir untuk mitigasi iklim.', duration: 'Modul + Essay Studi Kasus', icon: 'leaf-1', topic: 'Lingkungan & Energi' },
  { level: 'Specialization', title: 'Blue Energy', desc: 'Potensi energi laut dan kelayakan investasi energi terbarukan pesisir.', duration: 'Modul + Essay Studi Kasus', icon: 'bolt-2', topic: 'Lingkungan & Energi' },
  { level: 'Specialization', title: 'Blue Finance', desc: 'Instrumen pembiayaan biru, obligasi, dan manajemen risiko investasi laut.', duration: 'Modul + Essay Studi Kasus', icon: 'dollar-circle', topic: 'Bisnis & Keuangan' },
  { level: 'Specialization', title: 'Blue Port', desc: 'Pelabuhan hijau, logistik maritim, dan konektivitas rantai pasok laut.', duration: 'Modul + Essay Studi Kasus', icon: 'ship-1', topic: 'Pangan & Maritim' },
  { level: 'Specialization', title: 'Blue Food', desc: 'Sistem pangan laut yang aman, adil, dan berkelanjutan.', duration: 'Modul + Essay Studi Kasus', icon: 'knife-fork-1', topic: 'Pangan & Maritim' },
  { level: 'Specialization', title: 'Blue Data Intelligence', desc: 'Analitik data kelautan untuk keputusan kebijakan dan bisnis.', duration: 'Modul + Essay Studi Kasus', icon: 'database-2', topic: 'Bisnis & Keuangan' },
  { level: 'Specialization', title: 'Blue Community Development', desc: 'Pemberdayaan komunitas pesisir dan kesetaraan gender di sektor kelautan.', duration: 'Modul + Essay Studi Kasus', icon: 'user-multiple-4', topic: 'Komunitas' },
];

const TOPICS = [
  { name: 'Foundation', desc: 'Dasar Blue Economy', count: 1, icon: 'graduation-cap-1' },
  { name: 'Bisnis & Keuangan', desc: 'Business, Finance, Data', count: 4, icon: 'briefcase-1' },
  { name: 'Lingkungan & Energi', desc: 'Carbon, Energy, Circular', count: 3, icon: 'leaf-1' },
  { name: 'Pangan & Maritim', desc: 'Food, Farming, Port', count: 3, icon: 'ship-1' },
  { name: 'Komunitas', desc: 'Pemberdayaan pesisir', count: 1, icon: 'user-multiple-4' },
];

export default function LandingCourseTabs() {
  const [tab, setTab] = useState<'popular' | 'topic'>('popular');
  const [topic, setTopic] = useState<string | null>(null);

  const shown = topic ? COURSES.filter(c => c.topic === topic) : COURSES;

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-slate-100 rounded-full p-1 text-sm font-semibold" role="tablist">
          {([['popular', 'Paling Populer'], ['topic', 'Berdasarkan Topik']] as const).map(([k, label]) => (
            <button
              key={k}
              id={`landing-tab-${k}`}
              role="tab"
              aria-selected={tab === k}
              onClick={() => { setTab(k); setTopic(null); }}
              className={`px-6 py-2 rounded-full transition-all ${tab === k ? 'bg-white text-navy-dark shadow' : 'text-slate-500 hover:text-navy'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'topic' && !topic && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPICS.map(t => (
            <button
              key={t.name}
              onClick={() => setTopic(t.name)}
              className="group flex items-center gap-4 text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy-light hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span className="w-12 h-12 rounded-xl bg-sky-50 text-navy flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                <Icon name={t.icon} size={22} />
              </span>
              <span>
                <span className="block font-bold text-navy-dark">{t.name}</span>
                <span className="block text-xs text-slate-500">{t.desc} · {COURSES.filter(c => c.topic === t.name).length} program</span>
              </span>
              <Icon name="chevron-right-circle" size={18} className="ml-auto text-slate-300 group-hover:text-navy" />
            </button>
          ))}
        </div>
      )}

      {(tab === 'popular' || topic) && (
        <>
          {topic && (
            <button onClick={() => setTopic(null)} className="mb-5 text-sm font-semibold text-navy hover:underline inline-flex items-center gap-1.5">
              <Icon name="arrow-left" size={14} /> Semua topik · {topic}
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {shown.slice(0, tab === 'popular' ? 4 : 8).map(c => (
              <article key={c.title} className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="h-28 gradient-hero flex items-center justify-center text-white/90 relative">
                  <Icon name={c.icon} size={44} />
                  <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${c.level === 'Foundation' ? 'bg-gold text-navy-dark' : 'bg-white/15 text-white border border-white/30'}`}>
                    {c.level}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <Icon name="stopwatch" size={13} /> {c.duration}
                  </div>
                  <h3 className="text-base font-bold text-navy-dark mb-2 leading-snug">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{c.desc}</p>
                  <Link href="/register" className="mt-4 text-sm font-bold text-navy inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    Lihat program <Icon name="arrow-right" size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
