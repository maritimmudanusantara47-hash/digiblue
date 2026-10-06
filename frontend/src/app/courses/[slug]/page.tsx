'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course } from '@/types';

const LEVEL_STYLE: Record<string, { badge: string; border: string; bg: string }> = {
  FND:  { badge: 'bg-amber-100 text-amber-800 border-amber-300', border: 'border-amber-500', bg: 'bg-amber-500' },
  SPEC: { badge: 'bg-navy/10 text-navy border-navy/30',            border: 'border-navy',      bg: 'bg-navy' },
  NAT:  { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', border: 'border-emerald-600', bg: 'bg-emerald-600' },
  SGL:  { badge: 'bg-purple-100 text-purple-800 border-purple-300', border: 'border-purple-600', bg: 'bg-purple-600' },
};

export default function PublicCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { isAuthenticated, user } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/courses/${slug}`)
      .then((res) => {
        const data = res.data.data as Course;
        setCourse(data);
        if (data.sections) {
          const initialOpen: Record<number, boolean> = {};
          data.sections.forEach((s) => {
            initialOpen[s.id] = true;
          });
          setOpenSections(initialOpen);
        }
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
        setError('Kursus tidak ditemukan atau sedang tidak aktif.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const toggleSection = (id: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEnrollClick = () => {
    if (!course) return;
    const targetUrl = `/student/dashboard?pay=${course.slug}`;
    if (!isAuthenticated) {
      router.push(`/register?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(targetUrl);
    }
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
                  <span>Dashboard</span>
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

        {/* Content */}
        <div className="container py-8">
          {loading ? (
            <div className="max-w-5xl mx-auto py-10 animate-pulse space-y-6">
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-10 bg-slate-200 rounded w-3/4" />
              <div className="h-24 bg-slate-100 rounded" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-32 bg-slate-100 rounded-2xl" />
                  <div className="h-32 bg-slate-100 rounded-2xl" />
                </div>
                <div className="h-64 bg-slate-100 rounded-2xl" />
              </div>
            </div>
          ) : error || !course ? (
            <div className="max-w-xl mx-auto my-16 text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
                <Icon name="warning" size={28} />
              </div>
              <h2 className="text-xl font-bold text-navy-dark mb-2">Kursus Tidak Ditemukan</h2>
              <p className="text-slate-500 text-sm mb-6">{error ?? 'Materi kursus tidak dapat dimuat.'}</p>
              <Link href="/courses" className="btn btn-primary inline-flex items-center gap-2">
                <Icon name="arrow-left" size={16} />
                <span>Kembali ke Katalog Kursus</span>
              </Link>
            </div>
          ) : (
            (() => {
              const code = course.certification_level?.code ?? 'SPEC';
              const style = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];
              const isFree = Number(course.price) <= 0;
              const formattedPrice = isFree
                ? 'Gratis'
                : `Rp${Number(course.price).toLocaleString('id-ID')}`;

              const totalSections = course.sections?.length ?? 0;
              const totalContents = course.sections?.reduce(
                (acc, sec) => acc + (sec.contents?.length ?? 0),
                0
              ) ?? 0;

              return (
                <div className="max-w-6xl mx-auto">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6 flex-wrap">
                    <Link href="/" className="hover:text-navy transition-colors flex items-center gap-1">
                      <Icon name="home-2" size={14} />
                      <span>Home</span>
                    </Link>
                    <span>/</span>
                    <Link href="/courses" className="hover:text-navy transition-colors">
                      Katalog Kursus
                    </Link>
                    <span>/</span>
                    <span className="text-navy-dark truncate max-w-xs">{course.title}</span>
                  </div>

                  {/* Hero Header */}
                  <div className="bg-gradient-to-br from-navy-dark via-navy to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-10 relative overflow-hidden">
                    <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-gold/15 blur-3xl" />
                    <div className="relative z-10 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${style.badge}`}>
                          {course.certification_level?.name ?? code}
                        </span>
                        <span className="text-xs text-white/70 flex items-center gap-1">
                          <Icon name="layers-1" size={14} className="text-gold" />
                          {totalSections} Modul Silabus
                        </span>
                        <span className="text-xs text-white/70 flex items-center gap-1">
                          <Icon name="book-open" size={14} className="text-gold" />
                          {totalContents} Materi & Asesmen
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-4 text-white">
                        {course.title}
                      </h1>

                      {course.description && (
                        <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
                          {course.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-xs text-white/70">
                        <span className="flex items-center gap-1.5">
                          <Icon name="shield-2-check" size={15} className="text-gold" />
                          Sertifikat Terverifikasi Internasional
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Icon name="water-drop-1" size={15} className="text-gold" />
                          Standar SDG 14 & Maritime Economy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid Layout: Silabus & Sidebar */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left: Modul & Silabus */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h2 className="text-xl font-extrabold text-navy-dark">Silabus Pembelajaran</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Struktur modul dan materi yang akan dipelajari</p>
                        </div>
                        <span className="text-xs font-bold text-navy bg-navy/5 px-2.5 py-1 rounded-lg">
                          {totalSections} Bagian
                        </span>
                      </div>

                      {totalSections === 0 ? (
                        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400">
                          <Icon name="layers-1" size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-600">Silabus Sedang Disusun</p>
                          <p className="text-xs text-slate-400 mt-1">Daftar modul dan materi akan segera dirilis oleh instruktur.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {course.sections?.map((section, idx) => {
                            const isOpen = !!openSections[section.id];
                            const contents = section.contents ?? [];

                            return (
                              <div
                                key={section.id}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-shadow hover:shadow-md"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSection(section.id)}
                                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-navy/10 text-navy font-extrabold text-xs flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div>
                                      <h3 className="text-sm font-bold text-navy-dark leading-snug">
                                        {section.title}
                                      </h3>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {contents.length} Materi / Asesmen
                                      </p>
                                    </div>
                                  </div>
                                  <Icon
                                    name="chevron-down"
                                    size={16}
                                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-navy' : ''}`}
                                  />
                                </button>

                                {isOpen && (
                                  <div className="p-5 border-t border-slate-100 space-y-2.5">
                                    {contents.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic py-2">Belum ada materi pada modul ini.</p>
                                    ) : (
                                      contents.map((content) => {
                                        const isVideo = content.content_type === 'video_embed' || content.content_type === 'oral_video_task';
                                        const isDoc = content.content_type === 'pdf_module';
                                        const isQuiz = content.content_type === 'mcq_quiz';

                                        const typeIcon = isVideo ? 'play-circle' : isDoc ? 'file-pdf' : isQuiz ? 'help-circle' : 'clipboard';
                                        const typeColor = isVideo ? 'text-rose-500 bg-rose-50' : isDoc ? 'text-amber-500 bg-amber-50' : isQuiz ? 'text-purple-500 bg-purple-50' : 'text-blue-500 bg-blue-50';

                                        return (
                                          <div
                                            key={content.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColor}`}>
                                                <Icon name={typeIcon} size={16} />
                                              </span>
                                              <div>
                                                <h4 className="text-xs font-semibold text-slate-700 leading-snug">
                                                  {content.title}
                                                </h4>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                  {content.content_type}
                                                </span>
                                              </div>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                              <Icon name="lock" size={12} />
                                              Terkunci
                                            </span>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Enrollment Card */}
                    <div className="sticky top-24 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-lg">
                        <div className="flex items-baseline justify-between mb-4">
                          <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Biaya Investasi</span>
                          <span className={`text-2xl font-black ${isFree ? 'text-emerald-600' : 'text-navy-dark'}`}>
                            {formattedPrice}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleEnrollClick}
                          className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-navy/20 cursor-pointer mb-6"
                        >
                          <Icon name="rocket-5" size={16} />
                          <span>Daftar Sekarang</span>
                        </button>

                        <div className="space-y-3 pt-6 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2.5">
                            <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                            <span>Akses materi belajar 24/7 online</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                            <span>Sertifikat terverifikasi QR Code</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                            <span>Tercatat di The Blue Economist Association</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                            <span>Peluang beasiswa bagi peserta terpilih</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
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
