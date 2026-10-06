'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course } from '@/types';

// Tab category tetap berbasis kode logis (grouping)
type TabCategory = 'ALL' | 'INT_CERT' | 'NAT' | 'SGL';

interface CertLevel { id: number; code: string; name: string; order_index: number }

const LEVEL_STYLE: Record<string, { badge: string; card: string }> = {
  FND:  { badge: 'bg-amber-100 text-amber-800 border-amber-300',    card: 'from-amber-500 to-amber-600' },
  SPEC: { badge: 'bg-navy/10 text-navy border-navy/30',             card: 'from-navy to-navy-light' },
  NAT:  { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', card: 'from-emerald-500 to-emerald-600' },
  SGL:  { badge: 'bg-purple-100 text-purple-800 border-purple-300', card: 'from-purple-500 to-purple-700' },
};

// Icon mapping per kode level
const LEVEL_ICON: Record<string, string> = {
  FND: 'star-fat', SPEC: 'graduation-cap-1', NAT: 'flag-1', SGL: 'book-1',
};

export default function CoursesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [courses, setCourses]         = useState<Course[]>([]);
  const [certLevels, setCertLevels]   = useState<CertLevel[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<TabCategory>('ALL');
  const [subTrackCode, setSubTrack]   = useState<string>('ALL'); // 'ALL' | 'FND' | 'SPEC'
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

  // Nama tab INT_CERT: diambil dari nama FND level (misal "Foundation Level") lalu disederhanakan
  // Karena INT_CERT adalah group FND+SPEC, labelnya diambil dari setting admin atau fallback statis
  const intCertLabel = useMemo(() => {
    // Cari level dengan code berisi 'INT' atau 'CERT', fallback ke nama FND trimmed
    // Admin panel menyebutnya "International Certification Training Course" — kita pakai label dari
    // level FND/SPEC yang ada, dengan prefix group
    const fnd = certLevels.find(l => l.code === 'FND');
    const spec = certLevels.find(l => l.code === 'SPEC');
    if (fnd && spec) return 'International Certification Training Course';
    return fnd?.name ?? spec?.name ?? 'International Certification';
  }, [certLevels]);

  const natLabel = useMemo(() => certLevels.find(l => l.code === 'NAT')?.name ?? 'National Training Course', [certLevels]);
  const sglLabel = useMemo(() => certLevels.find(l => l.code === 'SGL')?.name ?? 'Single Modul Course', [certLevels]);

  // Sub-tracks untuk INT_CERT — diambil dari API (FND & SPEC)
  const intSubTracks = useMemo(() =>
    certLevels.filter(l => l.code === 'FND' || l.code === 'SPEC').sort((a, b) => a.order_index - b.order_index),
  [certLevels]);

  // Tab list dinamis — hanya tampilkan tab yang ada datanya
  const hasInt = useMemo(() => courses.some(c => c.certification_level?.code === 'FND' || c.certification_level?.code === 'SPEC'), [courses]);
  const hasNat = useMemo(() => courses.some(c => c.certification_level?.code === 'NAT'), [courses]);
  const hasSgl = useMemo(() => courses.some(c => c.certification_level?.code === 'SGL'), [courses]);

  const tabs = useMemo(() => {
    const list: { id: TabCategory; label: string; icon: string }[] = [
      { id: 'ALL', label: 'Semua Kursus', icon: 'star-fat' },
    ];
    if (hasInt) list.push({ id: 'INT_CERT', label: intCertLabel, icon: 'graduation-cap-1' });
    if (hasNat) list.push({ id: 'NAT', label: natLabel, icon: 'flag-1' });
    if (hasSgl) list.push({ id: 'SGL', label: sglLabel, icon: 'book-1' });
    return list;
  }, [hasInt, hasNat, hasSgl, intCertLabel, natLabel, sglLabel]);

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

  const handleDaftarClick = (course: Course) => {
    const targetUrl = `/student/dashboard?pay=${course.slug}`;
    if (!isAuthenticated) {
      router.push(`/register?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col justify-between">
      <div>
        {/* Top bar */}
        <div className="bg-navy-dark text-white/80 text-xs">
          <div className="container flex items-center justify-between h-9">
            <span className="flex items-center gap-2">
              <Icon name="shield-2-check" size={14} className="text-gold" />
              Resmi bersama The Blue Economist International Association
            </span>
            <span className="hidden sm:flex items-center gap-4">
              <Link href="/#sertifikat" className="hover:text-white">Tentang Sertifikat</Link>
              <Link href="/#faq" className="hover:text-white">Bantuan</Link>
            </span>
          </div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
          <div className="container flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-gold font-extrabold">D</span>
              <span className="font-extrabold text-navy-dark text-lg tracking-tight">DigiBlueCamp</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold" aria-label="Navigasi utama">
              <Link href="/" className="text-slate-600 hover:text-navy transition-colors">Home</Link>
              <Link href="/courses" className="text-navy font-bold border-b-2 border-navy pb-0.5">Kursus</Link>
            </nav>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href={user?.roles?.some(r => r.name === 'admin') ? '/admin/dashboard' : '/student/dashboard'}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Icon name="user-circle" size={15} />
                  <span>Dashboard {user?.name ? `(${user.name.split(' ')[0]})` : ''}</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline text-sm font-semibold text-navy-dark hover:text-navy-light">Masuk</Link>
                  <Link href="/register" className="btn btn-primary btn-sm">Daftar</Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Hero */}
        <section className="bg-gradient-to-b from-sky-50 via-white to-slate-50 border-b border-slate-200/80 py-12 md:py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-navy bg-white border border-slate-200 rounded-full px-3.5 py-1 mb-4 shadow-xs">
                <Icon name="books-2" size={14} className="text-navy-light" />
                Katalog Program & Kursus
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-dark mb-4 tracking-tight leading-tight">
                Pilih Program & Mulai Pembelajaran
              </h1>
              <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
                Tingkatkan kompetensi ekonomi maritim dan biru Anda melalui program sertifikasi internasional, pelatihan nasional, dan modul tematik yang terstruktur.
              </p>

              {/* Search Box */}
              <div className="relative max-w-xl mx-auto shadow-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="search-1" size={18} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kursus: Blue Carbon, Finance, Foundation, dsb..."
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
            </div>
          </div>
        </section>

        {/* Catalog Main Content */}
        <main className="container py-10">
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
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-navy text-white shadow-md shadow-navy/20 scale-[1.01]'
                        : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                    }`}
                  >
                    <Icon name={tab.icon} size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-filter untuk International Certification Track — dinamis dari API */}
            {activeTab === 'INT_CERT' && intSubTracks.length > 0 && (
              <div className="flex items-center gap-2 pt-1 animate-fadeup flex-wrap justify-center">
                <span className="text-xs font-semibold text-slate-500">Track International:</span>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSubTrack('ALL')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      subTrackCode === 'ALL' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
                    }`}
                  >
                    Semua Track
                  </button>
                  {intSubTracks.map((lvl) => (
                    <button
                      key={lvl.code}
                      onClick={() => setSubTrack(lvl.code)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                        subTrackCode === lvl.code ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results count header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-slate-600">
              Menampilkan <span className="text-navy-dark font-extrabold">{filteredCourses.length}</span> program kursus
              {searchQuery ? ` untuk pencarian "${searchQuery}"` : ''}
            </p>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="card p-6 flex flex-col gap-4 animate-pulse bg-white">
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
              <h3 className="text-lg font-bold text-navy-dark mb-1">Tidak ada kursus yang cocok</h3>
              <p className="text-xs text-slate-500 mb-6">
                Tidak ditemukan program yang sesuai dengan kata kunci atau kategori terpilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset Filter & Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((c) => {
                const code = c.certification_level?.code ?? 'SPEC';
                const style = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];
                const isFree = Number(c.price) <= 0;
                const formattedPrice = isFree
                  ? 'Gratis'
                  : `Rp${Number(c.price).toLocaleString('id-ID')}`;
                const sectionsCount = (c as unknown as { sections_count?: number }).sections_count ?? 0;

                return (
                  <article
                    key={c.id}
                    className="card bg-white flex flex-col justify-between overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-slate-200"
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

                      {sectionsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
                          <Icon name="layers-1" size={13} className="text-navy" />
                          <span>{sectionsCount} Modul Silabus</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 space-y-2 mt-auto">
                      <Link
                        href={`/courses/${c.slug}`}
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
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-navy-dark text-white/60 text-sm mt-20">
        <div className="container py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center text-navy-dark font-extrabold">D</span>
              <span className="font-extrabold text-white text-lg">DigiBlueCamp</span>
            </div>
            <p className="max-w-sm leading-relaxed">
              Platform kursus dan sertifikasi online Blue Economy bersama The Blue Economist International Association.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-3 text-sm">Platform</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/courses" className="hover:text-white">Kursus</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-3 text-sm">Akun</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/login" className="hover:text-white">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-white">Daftar</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs">
            <p>© 2026 DigiBlueCamp x The Blue Economist International Association. All rights reserved.</p>
            <p>Mendukung SDG 14 — Life Below Water</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
