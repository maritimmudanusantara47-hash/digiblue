'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import type { Course } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { translateText } from '@/lib/translator';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Toast } from '@/lib/swal';

type TabCategory = 'ALL' | 'INT_CERT' | 'NAT' | 'SGL';

interface CertLevel {
  id: number;
  code: string;
  name: string;
  order_index: number;
}

const LEVEL_STYLE: Record<string, { badge: string; card: string }> = {
  FND: { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-300', card: 'from-emerald-500 to-emerald-600' },
  SPEC: { badge: 'bg-navy/10 text-navy border border-navy/30', card: 'from-navy to-navy-light' },
  NAT: { badge: 'bg-amber-100 text-amber-800 border border-amber-300', card: 'from-amber-500 to-amber-600' },
  SGL: { badge: 'bg-purple-100 text-purple-800 border border-purple-300', card: 'from-purple-500 to-purple-700' },
};

function CoursesContent() {
  const t = useTranslations('CoursesPage');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackParam = searchParams?.get('track') as TabCategory | null;
  const { isAuthenticated } = useAuthStore();
  const { addItem, isInCart } = useCartStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated || !!Cookies.get('auth_token'));
  }, [isAuthenticated]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [certLevels, setCertLevels] = useState<CertLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabCategory>('ALL');
  const [subTrackCode, setSubTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (trackParam && ['ALL', 'INT_CERT', 'NAT', 'SGL'].includes(trackParam)) {
      setActiveTab(trackParam);
    }
  }, [trackParam]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/courses'),
      api.get('/certification-levels'),
    ])
      .then(async ([courseRes, levelRes]) => {
        if (!mounted) return;
        
        let coursesData = courseRes.data.data ?? [];
        let levelsData = levelRes.data.data ?? [];

        if (locale === 'en') {
          levelsData = await Promise.all(levelsData.map(async (l: any) => ({
            ...l,
            name: await translateText(l.name, 'en')
          })));

          coursesData = await Promise.all(coursesData.map(async (c: any) => ({
            ...c,
            title: await translateText(c.title, 'en'),
            description: await translateText(c.description, 'en')
          })));
        }

        if (!mounted) return;
        setCourses(coursesData);
        setCertLevels(levelsData);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [locale]);

  const intCertLabel = useMemo(() => {
    const fnd = certLevels.find((l) => l.code === 'FND');
    const spec = certLevels.find((l) => l.code === 'SPEC');
    if (fnd && spec) return 'International Certification Track';
    return fnd?.name ?? spec?.name ?? 'International Certification';
  }, [certLevels]);

  const natLabel = useMemo(
    () => certLevels.find((l) => l.code === 'NAT')?.name ?? 'National Maritime Training',
    [certLevels]
  );
  const sglLabel = useMemo(
    () => certLevels.find((l) => l.code === 'SGL')?.name ?? 'Single Modular Track',
    [certLevels]
  );

  const intSubTracks = useMemo(
    () =>
      certLevels
        .filter((l) => l.code === 'FND' || l.code === 'SPEC')
        .sort((a, b) => a.order_index - b.order_index),
    [certLevels]
  );

  const tabs = useMemo(() => {
    return [
      { id: 'ALL' as TabCategory, label: t('tab_all'), icon: 'layout-9' },
      { id: 'INT_CERT' as TabCategory, label: intCertLabel, icon: 'graduation-cap-1' },
      { id: 'NAT' as TabCategory, label: natLabel, icon: 'flag-1' },
      { id: 'SGL' as TabCategory, label: sglLabel, icon: 'book-1' },
    ];
  }, [t, intCertLabel, natLabel, sglLabel]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      const code = c.certification_level?.code ?? '';
      if (activeTab === 'INT_CERT') {
        if (subTrackCode !== 'ALL') return code === subTrackCode;
        return code === 'FND' || code === 'SPEC';
      }
      if (activeTab === 'NAT') return code === 'NAT';
      if (activeTab === 'SGL') return code === 'SGL';
      return true;
    });
  }, [courses, searchQuery, activeTab, subTrackCode]);

  return (
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700">
      {/* Stitch Design System Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00162d] via-[#0f2b48] to-[#00162d] text-white py-16 sm:py-20 lg:py-24 border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-500 rounded-full filter blur-[100px] opacity-25" />
          <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-cyan-400 rounded-full filter blur-[120px] opacity-20" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-sky-200 mb-6 font-mono">
              <Icon name="books-2" size={14} className="text-amber-400" />
              <span>{t('badge')}</span>
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight font-heading">
              {t('title')}
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed font-normal">
              {t('desc')}
            </p>

            {/* Search Input Box */}
            <div className="relative max-w-xl mx-auto shadow-2xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search-1" size={18} />
              </span>
              <input
                id="courses-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-white text-slate-900 text-sm sm:text-base pl-11 pr-24 py-3.5 sm:py-4 rounded-2xl border border-white/50 shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-400/20 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {t('btn_clear')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Main Content */}
      <main className="container py-8 sm:py-12">
        {/* Category Tabs */}
        <div className="flex flex-col items-center justify-center mb-10 gap-3">
          <div className="inline-flex bg-white p-1.5 rounded-2xl gap-1.5 shadow-sm border border-slate-200/80 overflow-x-auto max-w-full" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`courses-tab-${tab.id.toLowerCase()}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSubTrack('ALL');
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap font-heading ${isActive
                    ? 'bg-[#00162d] text-white shadow-md shadow-navy/20 scale-[1.01]'
                    : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                    }`}
                >
                  <Icon name={tab.icon} size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-filter untuk International Certification Track */}
          {activeTab === 'INT_CERT' && intSubTracks.length > 0 && (
            <div className="flex items-center gap-2 pt-1 animate-fadeup flex-wrap justify-center">
              <span className="text-xs font-semibold text-slate-500 font-mono">{t('subtrack_label')}</span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSubTrack('ALL')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer font-mono ${subTrackCode === 'ALL' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
                    }`}
                >
                  {t('subtrack_all')}
                </button>
                {intSubTracks.map((lvl) => (
                  <button
                    key={lvl.code}
                    onClick={() => setSubTrack(lvl.code)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer font-mono ${subTrackCode === lvl.code ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
                      }`}
                  >
                    {lvl.name.replace(/\s+Level$/i, '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results count header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-600">
            {t('showing_prefix')} <span className="text-[#00162d] font-extrabold">{filteredCourses.length}</span> {t('programs_suffix')}
            {searchQuery ? ` ${t('search_suffix')} "${searchQuery}"` : ''}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="card p-6 flex flex-col gap-4 animate-pulse bg-white rounded-2xl border border-slate-200">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-16 bg-slate-100 rounded" />
                  <div className="h-10 bg-slate-200 rounded mt-auto" />
                </div>
              ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 max-w-lg mx-auto my-6 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Icon name="search-1" size={28} />
            </div>
            <h3 className="text-lg font-bold text-[#00162d] mb-1 font-heading">{t('empty_title')}</h3>
            <p className="text-xs text-slate-500 mb-6">
              {t('empty_desc')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t('btn_reset')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((c) => {
              const code = c.certification_level?.code ?? 'SPEC';
              const style = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];
              const formattedPrice =
                Number(c.price) <= 0
                  ? t('free')
                  : `Rp${Number(c.price).toLocaleString('id-ID')}`;

              const targetUrl = isLoggedIn
                ? `/student/catalog/${c.slug}`
                : `/courses/${c.slug}`;

              const inCart = isInCart(c.id);

              return (
                <div
                  key={c.id}
                  className="card transition-all duration-200 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 group bg-white border border-slate-200/80 rounded-2xl"
                >
                  {/* 1. Gradient accent line di atas card */}
                  <div className={`-mx-6 -mt-6 h-2 rounded-t-2xl bg-gradient-to-r ${style.card}`} />

                  {/* 2. Badge Level di kiri & Harga di kanan atas */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
                      {c.certification_level?.name ?? code}
                    </span>
                    <span className="text-sm font-bold text-navy-dark">
                      {formattedPrice}
                    </span>
                  </div>

                  {/* 3. Judul dan Deskripsi */}
                  <Link href={targetUrl} className="flex-1 block group-hover:text-sky-700 transition-colors">
                    <h3 className="font-bold text-navy-dark text-base leading-snug group-hover:text-sky-700 transition-colors">
                      {c.title}
                    </h3>
                    {c.description && (
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </Link>

                  {/* 4. Action Buttons: Tambah ke Keranjang & Beli Sekarang */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (inCart) {
                          router.push('/cart');
                          return;
                        }
                        addItem({
                          courseId: c.id,
                          slug: c.slug,
                          title: c.title,
                          price: Number(c.price) || 0,
                          thumbnailUrl: c.thumbnail_url,
                          levelCode: code,
                          levelName: c.certification_level?.name,
                        });
                        Toast.fire({
                          icon: 'success',
                          title: 'Ditambahkan ke keranjang',
                        });
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                        inCart
                          ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:text-sky-600 hover:bg-slate-50'
                      }`}
                      title={inCart ? 'Lihat di Keranjang' : 'Tambah ke Keranjang'}
                    >
                      <Icon name={inCart ? 'check-circle-1' : 'cart'} size={14} className={inCart ? 'text-sky-600' : ''} />
                      <span>{inCart ? 'Di Keranjang' : 'Keranjang'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!inCart) {
                          addItem({
                            courseId: c.id,
                            slug: c.slug,
                            title: c.title,
                            price: Number(c.price) || 0,
                            thumbnailUrl: c.thumbnail_url,
                            levelCode: code,
                            levelName: c.certification_level?.name,
                          });
                        }
                        router.push('/cart');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#00162d] text-white hover:bg-[#0f2b48] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Icon name="rocket-5" size={14} />
                      <span>Beli Sekarang</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pathway Comparison Table Section */}
      <section className="bg-slate-100/70 border-t border-slate-200/80 py-16">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full mb-3 inline-block font-mono">
              {t('table_badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#00162d] tracking-tight font-heading">
              {t('table_title')}
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[#00162d] font-heading">
                  <th className="p-4 sm:p-5 font-bold">{t('table_header_feature')}</th>
                  <th className="p-4 sm:p-5 font-bold text-sky-800">International (CBEc)</th>
                  <th className="p-4 sm:p-5 font-bold text-emerald-800">National Training</th>
                  <th className="p-4 sm:p-5 font-bold text-purple-800">Executive Modular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">{t('table_global_label')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_global_cbec')}</td>
                  <td className="p-4 sm:p-5 text-slate-700">{t('table_global_nat')}</td>
                  <td className="p-4 sm:p-5 text-slate-500">{t('table_global_sgl')}</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">{t('table_qr_label')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_qr_active')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_qr_active')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_qr_active')}</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">{t('table_modules_label')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_modules_lifetime')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_modules_lifetime')}</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">{t('table_modules_lifetime')}</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">{t('table_exam_label')}</td>
                  <td className="p-4 sm:p-5 text-slate-700">{t('table_exam_cbec')}</td>
                  <td className="p-4 sm:p-5 text-slate-700">{t('table_exam_nat')}</td>
                  <td className="p-4 sm:p-5 text-slate-700">{t('table_exam_sgl')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="container py-14 sm:py-16">
        <div className="bg-gradient-to-r from-[#00162d] to-[#0f2b48] rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 font-heading">
              {t('cta_title')}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
              {t('cta_desc')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/help"
                className="px-7 py-3.5 bg-amber-500 hover:bg-amber-600 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-2 font-heading"
              >
                <span>{t('btn_consult')}</span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href="/verify"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-colors border border-white/20 inline-flex items-center gap-2"
              >
                <span>{t('btn_verify')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="container py-24 text-center text-slate-400 text-sm">Memuat katalog kursus...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
