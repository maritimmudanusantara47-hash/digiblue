'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course } from '@/types';

type TabCategory = 'ALL' | 'INT_CERT' | 'NAT' | 'SGL';

interface CertLevel { id: number; code: string; name: string; order_index: number }

const LEVEL_STYLE: Record<string, { banner: string; badge: string; card: string }> = {
  FND:  { banner: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white', badge: 'bg-amber-100 text-amber-800 border-amber-300', card: 'from-amber-500 to-amber-600' },
  SPEC: { banner: 'bg-gradient-to-r from-navy to-slate-900 text-white',      badge: 'bg-navy/10 text-navy border-navy/30',            card: 'from-navy to-navy-light' },
  NAT:  { banner: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', card: 'from-emerald-500 to-emerald-600' },
  SGL:  { banner: 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white',badge: 'bg-purple-100 text-purple-800 border-purple-300', card: 'from-purple-500 to-purple-700' },
};

export default function LandingCourseTabs() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [courses, setCourses]       = useState<Course[]>([]);
  const [certLevels, setCertLevels] = useState<CertLevel[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<TabCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch kursus & certification levels secara paralel
  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/courses'),
      api.get('/certification-levels'),
    ]).then(([courseRes, levelRes]) => {
      if (!mounted) return;
      setCourses(courseRes.data.data ?? []);
      setCertLevels(levelRes.data.data ?? []);
    }).catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Label dinamis berdasarkan nama level di DB
  const intCertLabel = useMemo(() => {
    const fnd  = certLevels.find(l => l.code === 'FND');
    const spec = certLevels.find(l => l.code === 'SPEC');
    return (fnd && spec) ? 'International Certification Training Course' : fnd?.name ?? spec?.name ?? 'International Certification';
  }, [certLevels]);
  const natLabel = useMemo(() => certLevels.find(l => l.code === 'NAT')?.name ?? 'National Training Course', [certLevels]);
  const sglLabel = useMemo(() => certLevels.find(l => l.code === 'SGL')?.name ?? 'Single Modul Course', [certLevels]);

  // Bangun tabs — selalu tampilkan 3 jenis kursus agar sinkron dengan admin
  const tabs = useMemo(() => {
    return [
      { id: 'ALL' as TabCategory, label: 'Semua', icon: 'star-fat' },
      { id: 'INT_CERT' as TabCategory, label: intCertLabel, icon: 'graduation-cap-1' },
      { id: 'NAT' as TabCategory, label: natLabel, icon: 'flag-1' },
      { id: 'SGL' as TabCategory, label: sglLabel, icon: 'book-1' },
    ];
  }, [intCertLabel, natLabel, sglLabel]);


  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const code = c.certification_level?.code ?? '';
    if (activeTab === 'INT_CERT') return code === 'FND' || code === 'SPEC';
    if (activeTab === 'NAT') return code === 'NAT';
    if (activeTab === 'SGL') return code === 'SGL';
    return true;
  });

  const handleDaftarClick = (course: Course) => {
    // Alur intent redirection langsung ke dashboard peserta dengan trigger pop-up pembayaran
    const targetUrl = `/student/dashboard?pay=${course.slug}`;
    if (!isAuthenticated) {
      router.push(`/register?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }
    router.push(targetUrl);
  };

  return (
    <div>
      {/* Search Query Input di Kursus Unggulan */}
      <div className="max-w-xl mx-auto mb-8 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon name="search-1" size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kursus unggulan, materi Blue Carbon, Finance, Foundation..."
          className="w-full bg-white text-navy-dark text-sm sm:text-base pl-11 pr-24 py-3.5 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-navy/10 focus:border-navy outline-none placeholder:text-slate-400 transition-all font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Category Tabs — dinamis dari API certification-levels */}
      <div className="flex justify-center mb-10 overflow-x-auto pb-2">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 shadow-xs" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`landing-tab-${tab.id.toLowerCase()}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-navy text-white shadow-md shadow-navy/20 scale-[1.02]'
                    : 'text-slate-600 hover:text-navy hover:bg-white/60'
                }`}
              >
                <Icon name={tab.icon} size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-6 flex flex-col gap-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-200 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
              <Icon name="search-1" size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-navy-dark">Tidak ada kursus yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCourses.map((c) => {
                const code = c.certification_level?.code ?? 'SPEC';
                const style = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];
                const isFree = Number(c.price) <= 0;
                const formattedPrice = isFree
                  ? 'Gratis'
                  : `Rp${Number(c.price).toLocaleString('id-ID')}`;

                return (
                  <article
                    key={c.id}
                    className="card flex flex-col justify-between overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-slate-200"
                  >
                    <div className={`-mx-6 -mt-6 h-2 rounded-t-2xl bg-gradient-to-r ${style.card}`} />

                    <div className="pt-2">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${style.badge}`}>
                          {c.certification_level?.name ?? code}
                        </span>
                        <span className={`text-xs font-extrabold ${isFree ? 'text-emerald-600' : 'text-navy-dark'}`}>
                          {formattedPrice}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-navy-dark mb-2 line-clamp-2 leading-snug">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {c.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 space-y-2 mt-auto">
                      <Link
                        href={`/student/catalog/${c.slug}`}
                        className="btn btn-secondary btn-sm w-full text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5"
                      >
                        <Icon name="book-open" size={14} className="text-navy" />
                        <span>Lihat Silabus & Detail</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDaftarClick(c)}
                        className="btn btn-primary btn-sm w-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Icon name="rocket-5" size={14} />
                        <span>Daftar Sekarang</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
