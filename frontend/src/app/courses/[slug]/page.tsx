'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useLocale } from 'next-intl';
import { translateText } from '@/lib/translator';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course, CourseSection } from '@/types';
import { CertificatePreviewSection, triggerCertificatePreview } from '@/components/certificate';

const LEVEL_STYLE: Record<string, { badge: string; border: string; bg: string }> = {
  FND:  { badge: 'bg-amber-100 text-amber-800 border-amber-300', border: 'border-amber-500', bg: 'bg-amber-500' },
  SPEC: { badge: 'bg-navy/10 text-navy border-navy/30',            border: 'border-navy',      bg: 'bg-navy' },
  NAT:  { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', border: 'border-emerald-600', bg: 'bg-emerald-600' },
  SGL:  { badge: 'bg-purple-100 text-purple-800 border-purple-300', border: 'border-purple-600', bg: 'bg-purple-600' },
};

export default function PublicCourseDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setLoading(true);

    api.get(`/courses/${slug}`)
      .then(async (res) => {
        if (!mounted) return;
        let data = res.data.data as Course;

        if (locale === 'en') {
          data = {
            ...data,
            title: await translateText(data.title, 'en'),
            description: await translateText(data.description, 'en'),
          };
          if (data.certification_level) {
            data.certification_level.name = await translateText(data.certification_level.name, 'en');
          }
        }

        if (!mounted) return;
        setCourse(data);
        // Default buka semua modul silabus
        if (data.sections) {
          const initialOpen: Record<number, boolean> = {};
          data.sections.forEach((s) => {
            initialOpen[s.id] = true;
          });
          setOpenSections(initialOpen);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load course details:', err);
        setError('Kursus tidak ditemukan atau sedang tidak aktif.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug, locale]);

  const toggleSection = (id: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEnrollClick = () => {
    if (!course) return;
    const token = Cookies.get('auth_token');
    const isAuth = isAuthenticated || !!token;

    if (!isAuth) {
      router.push(`/login?redirect=${encodeURIComponent(`/student/catalog/${course.slug}`)}`);
    } else {
      router.push(`/student/catalog/${course.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 animate-pulse space-y-6">
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
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto my-16 text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
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
    );
  }

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
    <div className="bg-[#f9f9ff] min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-navy transition-colors flex items-center gap-1">
            <Icon name="home-2" size={14} />
            <span>Beranda</span>
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
                <Icon name="book-1" size={14} className="text-gold" />
                {totalContents} Materi & Asesmen
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl mb-6">
                {course.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs sm:text-sm text-white/70 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => triggerCertificatePreview()}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group text-left"
                title="Lihat Pratinjau Desain Sertifikat Resmi"
              >
                <Icon name="shield-2-check" size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="underline decoration-dotted decoration-emerald-400/60 underline-offset-2">Sertifikat Terverifikasi</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold ml-0.5">Lihat</span>
              </button>
              <span className="flex items-center gap-1.5">
                <Icon name="stopwatch" size={16} className="text-gold" />
                Akses Pembelajaran Fleksibel
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Syllabus Details & Sticky CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Syllabus Modules */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-navy-dark">
                  Silabus Kurikulum Kursus
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Struktur modul dan pokok bahasan yang akan kamu pelajari secara komprehensif.
                </p>
              </div>
              <span className="text-xs font-bold text-navy bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100 shrink-0">
                {totalSections} Modul
              </span>
            </div>

            {(!course.sections || course.sections.length === 0) ? (
              <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                <Icon name="book-1" size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-navy-dark">Silabus sedang disiapkan</p>
                <p className="text-xs text-slate-400 mt-1">Modul silabus akan segera diperbarui oleh instruktur.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {course.sections.map((section: CourseSection, idx: number) => {
                  const isOpen = openSections[section.id] ?? false;
                  const contents = section.contents ?? [];

                  return (
                    <div
                      key={section.id}
                      className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                    >
                      {/* Header Modul */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 pr-2">
                          <span className="w-8 h-8 rounded-xl bg-navy/10 text-navy font-extrabold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                              Modul {idx + 1}
                            </span>
                            <h3 className="font-bold text-navy-dark text-sm sm:text-base leading-snug">
                              {section.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                            {contents.length} materi
                          </span>
                          <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <Icon name="chevron-down" size={16} />
                          </div>
                        </div>
                      </button>

                      {/* Konten Modul */}
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
                          {contents.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">
                              Materi topik pada modul ini sedang disusun.
                            </p>
                          ) : (
                            <ul className="divide-y divide-slate-100">
                              {contents.map((item, itemIdx) => {
                                const isPdf = item.content_type === 'pdf_module';
                                const isVideo = item.content_type === 'video_embed' || item.content_type === 'oral_video_task';
                                const isFieldStudy = item.content_type === 'field_study';
                                const isCriticalThinking = item.content_type === 'critical_thinking';
                                const iconName = isPdf
                                  ? 'file-multiple'
                                  : isVideo
                                  ? 'play'
                                  : isFieldStudy
                                  ? 'water-drop-1'
                                  : 'clipboard';
                                const isSpecialization =
                                  !course?.title?.toLowerCase().includes('foundation') &&
                                  !course?.slug?.toLowerCase().includes('foundation') &&
                                  (course as any)?.certification_level?.code !== 'FND';
                                const labelText = isPdf
                                  ? 'Dokumen PDF'
                                  : isVideo
                                  ? 'Video'
                                  : isFieldStudy
                                  ? (isSpecialization ? 'Field Study (Opsi 2 Sertifikat)' : 'Training Course (Field Study)')
                                  : isCriticalThinking
                                  ? 'Evaluasi Critical Thinking'
                                  : item.content_type === 'mcq_quiz'
                                  ? 'Kuis MCQ'
                                  : 'Tugas';

                                return (
                                  <li
                                    key={item.id ?? itemIdx}
                                    className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-600"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className={`shrink-0 ${isFieldStudy ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <Icon
                                          name={iconName}
                                          size={15}
                                          className={isFieldStudy ? 'text-emerald-600' : 'text-navy-light'}
                                        />
                                      </span>
                                      <div className="min-w-0">
                                        <span className="font-medium text-navy-dark truncate block">
                                          {item.title}
                                        </span>
                                        {isFieldStudy && (
                                          <span className="text-[10px] text-emerald-700 block mt-0.5">
                                            {isSpecialization
                                              ? 'Konfirmasi Keikutsertaan: Mendapatkan 2 Sertifikat (CBEc Specialization + Field Study) jika ikut'
                                              : 'Praktikum Lapangan Terpadu (Membebaskan modul Critical Thinking jika hadir)'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className={`text-[11px] shrink-0 font-semibold px-2 py-0.5 rounded-md ${
                                      isFieldStudy
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'text-slate-400'
                                    }`}>
                                      {labelText}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info Card */}
            <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-5 flex items-start gap-4">
              <span className="w-9 h-9 rounded-xl bg-white shadow-xs text-navy flex items-center justify-center shrink-0">
                <Icon name="graduation-cap-1" size={18} />
              </span>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong className="text-navy-dark block mb-1">
                  Akses Materi Lengkap & Ujian Kelulusan
                </strong>
                Setelah mendaftar, semua modul pembelajaran interaktif, materi PDF, ujian pilihan ganda, dan tugas akan aktif di dashboard portal belajarmu.
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Checkout CTA Card & Certificate Preview */}
          <div className="sticky top-20 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg">
              <div className="pb-6 border-b border-slate-100 mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Biaya Pendaftaran Kursus
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-navy-dark">
                    {formattedPrice}
                  </span>
                  {!isFree && (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Sertifikasi Resmi
                    </span>
                  )}
                </div>
              </div>

              {/* Benefit List */}
              <div className="space-y-3 mb-8">
                <p className="text-xs font-bold text-navy-dark uppercase tracking-wider">
                  Fasilitas yang didapatkan:
                </p>
                {[
                  'Akses lengkap semua modul silabus',
                  'Ujian online MCQ & evaluasi studi kasus',
                  'Sertifikat PDF resmi ber-ID unik & QR Code',
                  'Dapat diverifikasi langsung oleh pemberi kerja',
                  'Dukungan pembelajaran online 24/7',
                ].map((b) => (
                  <div key={b} className="flex items-start justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-emerald-500 mt-0.5 shrink-0">
                        <Icon name="check-circle-1" size={14} />
                      </span>
                      <span>{b}</span>
                    </div>
                    {b.includes('Sertifikat') && (
                      <button
                        type="button"
                        onClick={() => triggerCertificatePreview()}
                        className="text-[11px] font-bold text-navy hover:text-navy-light underline hover:no-underline shrink-0 cursor-pointer ml-1"
                      >
                        Lihat Contoh
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={handleEnrollClick}
                className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all"
              >
                <Icon name="rocket-5" size={16} />
                <span>Daftar Kursus Ini Sekarang</span>
              </button>

              <p className="text-center text-[11px] text-slate-400 mt-4">
                Pembayaran aman & instan via QRIS, Virtual Account, GoPay & Midtrans Snap.
              </p>
            </div>

            {/* Certificate Preview Card */}
            <CertificatePreviewSection course={course} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
