'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course } from '@/types';

const LEVEL_STYLE: Record<string, { badge: string; border: string; bg: string }> = {
  FND: { badge: 'bg-[#E0F2FE] text-[#0369A1] border-sky-300', border: 'border-sky-500', bg: 'bg-[#00162d]' },
  SPEC: { badge: 'bg-[#E0F2FE] text-[#0369A1] border-sky-300', border: 'border-sky-500', bg: 'bg-[#0f2b48]' },
  NAT: { badge: 'bg-[#DCFCE7] text-[#15803D] border-emerald-300', border: 'border-emerald-600', bg: 'bg-emerald-900' },
  SGL: { badge: 'bg-[#F3E8FF] text-[#7E22CE] border-purple-300', border: 'border-purple-600', bg: 'bg-purple-900' },
};

export default function PublicCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'syllabus' | 'overview' | 'instructor' | 'cert'>('syllabus');

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
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700 py-8 sm:py-12">
      <div className="container">
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
            <h2 className="text-xl font-bold text-[#00162d] mb-2 font-heading">Kursus Tidak Ditemukan</h2>
            <p className="text-slate-500 text-sm mb-6">{error ?? 'Materi kursus tidak dapat dimuat.'}</p>
            <Link
              href="/courses"
              className="px-6 py-3 bg-[#00162d] text-white rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
            >
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
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6 flex-wrap font-mono">
                  <Link href="/" className="hover:text-navy transition-colors flex items-center gap-1">
                    <Icon name="home-2" size={14} />
                    <span>Beranda</span>
                  </Link>
                  <span>/</span>
                  <Link href="/courses" className="hover:text-navy transition-colors">
                    Katalog Program
                  </Link>
                  <span>/</span>
                  <span className="text-[#00162d] font-bold truncate max-w-xs">{course.title}</span>
                </div>

                {/* Hero Header with Deep Oceanic Branding */}
                <div className="bg-gradient-to-br from-[#00162d] via-[#0f2b48] to-[#00162d] text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden border border-white/10">
                  <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl" />
                  <div className="relative z-10 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono uppercase border ${style.badge}`}>
                        {course.certification_level?.name ?? code}
                      </span>
                      <span className="text-xs text-white/80 flex items-center gap-1 font-mono">
                        <Icon name="layers-1" size={14} className="text-amber-400" />
                        {totalSections} Modul Silabus
                      </span>
                      <span className="text-xs text-white/80 flex items-center gap-1 font-mono">
                        <Icon name="book-1" size={14} className="text-amber-400" />
                        {totalContents} Materi & Asesmen
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-4 text-white font-heading">
                      {course.title}
                    </h1>

                    {course.description && (
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl font-normal">
                        {course.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-xs text-slate-300 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Icon name="shield-2-check" size={15} className="text-amber-400" />
                        Akreditasi The Blue Economist International
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="water-drop-1" size={15} className="text-amber-400" />
                        Standar SDG 14 & UN Ocean Decade
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs on Detail Page */}
                <div className="flex items-center gap-2 mb-8 border-b border-slate-200 overflow-x-auto pb-1">
                  {[
                    { id: 'syllabus', label: 'Silabus & Modul', icon: 'layers-1' },
                    { id: 'overview', label: 'Capaian Pembelajaran', icon: 'check-circle-1' },
                    { id: 'cert', label: 'Sertifikat CBEc', icon: 'certificate-badge-1' },
                    { id: 'instructor', label: 'Instruktur & Asesor', icon: 'user-4' },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer font-heading whitespace-nowrap ${
                          isActive
                            ? 'bg-[#00162d] text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy hover:bg-slate-100'
                        }`}
                      >
                        <Icon name={tab.icon} size={15} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid Layout: Silabus/Content & Sticky Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column (span 8) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* TAB 1: SILABUS */}
                    {activeTab === 'syllabus' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div>
                            <h2 className="text-xl font-extrabold text-[#00162d] font-heading">
                              Daftar Modul & Materi Pembelajaran
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Pelajari materi terstruktur secara bertahap
                            </p>
                          </div>
                          <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-lg font-mono border border-sky-200">
                            {totalSections} Modul
                          </span>
                        </div>

                        {totalSections === 0 ? (
                          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400">
                            <Icon name="layers-1" size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="font-semibold text-slate-600">Silabus Sedang Disusun</p>
                            <p className="text-xs text-slate-400 mt-1">Daftar modul dan materi akan segera dirilis oleh instruktur.</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {course.sections?.map((section, idx) => {
                              const isOpen = !!openSections[section.id];
                              const contents = section.contents ?? [];

                              return (
                                <div
                                  key={section.id}
                                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs transition-shadow hover:shadow-md"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="w-8 h-8 rounded-xl bg-[#00162d] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <h3 className="text-sm font-bold text-[#00162d] leading-snug font-heading">
                                          {section.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                          {contents.length} Materi / Asesmen
                                        </p>
                                      </div>
                                    </div>
                                    <Icon
                                      name="chevron-down"
                                      size={16}
                                      className={`text-slate-400 transition-transform duration-200 ${
                                        isOpen ? 'rotate-180 text-sky-600' : ''
                                      }`}
                                    />
                                  </button>

                                  {isOpen && (
                                    <div className="p-5 border-t border-slate-100 space-y-2.5 bg-white">
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
                                              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-100 transition-colors border border-slate-100"
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColor}`}>
                                                  <Icon name={typeIcon} size={16} />
                                                </span>
                                                <div>
                                                  <h4 className="text-xs font-semibold text-slate-800 leading-snug">
                                                    {content.title}
                                                  </h4>
                                                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                                                    {content.content_type}
                                                  </span>
                                                </div>
                                              </div>
                                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 font-mono">
                                                <Icon name="locked-1" size={12} />
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
                    )}

                    {/* TAB 2: OVERVIEW */}
                    {activeTab === 'overview' && (
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-xl font-bold text-[#00162d] font-heading">
                          Kompetensi & Capaian Belajar Lulusan
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            'Menguasai taksonomi dan prinsip keberlanjutan ekonomi maritim terkini',
                            'Mampu melakukan valuasi ekonomi ekosistem pesisir dan karbon biru (blue carbon)',
                            'Memahami regulasi dan instrumen dekarbonisasi pelabuhan serta perkapalan hijau',
                            'Mendapatkan sertifikat resmi dengan kode verifikasi internasional',
                          ].map((comp, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                              <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Icon name="check" size={11} />
                              </span>
                              <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{comp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: SERTIFIKAT PREVIEW */}
                    {activeTab === 'cert' && (
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-xl font-bold text-[#00162d] font-heading">
                          Spesifikasi Kredensial Sertifikasi
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Sertifikat ini diterbitkan secara otomatis setelah Anda menyelesaikan seluruh materi dan lulus ujian asesmen dengan nilai minimal 70%.
                        </p>
                        <div className="p-6 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-[#00162d] to-[#0f2b48] text-white">
                          <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase block mb-1">
                            CERTIFIED CREDENTIAL PREVIEW
                          </span>
                          <h3 className="text-lg font-bold font-heading">{course.title}</h3>
                          <p className="text-xs text-slate-300 mt-2">Diterbitkan oleh: The Blue Economist International Association x Maritim Muda Nusantara</p>
                          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                            <span className="text-emerald-400 font-bold">QR AKTIF & SERIAL VALID</span>
                            <Link href="/verify" className="underline text-sky-300 hover:text-white">
                              Uji Sistem Verifikasi →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: INSTRUKTUR */}
                    {activeTab === 'instructor' && (
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-xl font-bold text-[#00162d] font-heading">
                          Instruktur & Dewan Asesor Maritim
                        </h2>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="w-14 h-14 rounded-2xl bg-[#00162d] text-white flex items-center justify-center font-bold text-xl font-heading">
                            M
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#00162d] font-heading">Tim Pakar & Asesor Senior DigiBlue</h3>
                            <p className="text-xs text-slate-500 font-mono">The Blue Economist International Faculty</p>
                            <p className="text-xs text-slate-600 mt-1">Berpengalaman 15+ tahun dalam kebijakan kelautan dan proyek ekonomi biru internasional.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Sticky Enrollment Card (span 4) */}
                  <div className="lg:col-span-4 sticky top-24 space-y-6">
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl">
                      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 font-mono block">Biaya Investasi</span>
                          <span className="text-[11px] text-emerald-600 font-bold font-mono">Termasuk Sertifikat & Ujian</span>
                        </div>
                        <span className={`text-2xl sm:text-3xl font-black ${isFree ? 'text-emerald-600' : 'text-[#00162d]'} font-heading`}>
                          {formattedPrice}
                        </span>
                      </div>

                      {/* Warm Amber CTA Button matching Stitch */}
                      <button
                        type="button"
                        onClick={handleEnrollClick}
                        className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-[#0f2b48] text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer mb-5 font-heading"
                      >
                        <span>{isFree ? 'Daftar Sekarang' : 'Beli & Ikuti Kursus'}</span>
                        <Icon name="arrow-right" size={16} />
                      </button>

                      <div className="space-y-3 pt-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2.5">
                          <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                          <span>Akses modul pembelajaran 24/7 online</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                          <span>Sertifikat terverifikasi QR Code & ID Unik</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                          <span>Tercatat resmi di The Blue Economist Association</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Icon name="check-circle-1" size={15} className="text-emerald-500 shrink-0" />
                          <span>Tersedia bantuan live via WhatsApp</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100">
                        <a
                          href="https://wa.me/6285710914949"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                        >
                          <span>Tanya Silabus via WhatsApp</span>
                          <Icon name="arrow-right" size={13} />
                        </a>
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
  );
}
