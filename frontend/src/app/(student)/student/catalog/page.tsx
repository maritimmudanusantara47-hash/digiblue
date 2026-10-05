'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Course } from '@/types';

interface EnrollmentInfo {
  id: number;
  course_id: number;
  status: string;
  enrollment_type: string | null;
}

const LEVEL_STYLE: Record<string, { badge: string; card: string }> = {
  FND:  { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-300', card: 'from-emerald-500 to-emerald-600' },
  SPEC: { badge: 'bg-navy/10 text-navy border border-navy/30',                card: 'from-navy to-navy-light' },
  NAT:  { badge: 'bg-amber-100 text-amber-800 border border-amber-300',       card: 'from-amber-500 to-amber-600' },
  SGL:  { badge: 'bg-purple-100 text-purple-800 border border-purple-300',    card: 'from-purple-500 to-purple-700' },
};

type TabCategory = 'ALL' | 'INT_CERT' | 'NAT' | 'SGL';

const TABS: { id: TabCategory; label: string; icon: string }[] = [
  { id: 'ALL',      label: 'Semua Kursus',                        icon: 'star-fat' },
  { id: 'INT_CERT', label: 'International Certification Training', icon: 'graduation-cap-1' },
  { id: 'NAT',      label: 'National Training Course',             icon: 'flag-1' },
  { id: 'SGL',      label: 'Single Modul Course',                  icon: 'book-1' },
];

export default function StudentCatalogPage() {
  const [courses, setCourses]           = useState<Course[]>([]);
  const [enrollmentMap, setEnrollment]  = useState<Map<number, EnrollmentInfo>>(new Map());
  const [loading, setLoading]           = useState(true);
  const [enrolling, setEnrolling]       = useState<number | null>(null);
  const [paying, setPaying]             = useState<number | null>(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState<TabCategory>('ALL');
  const [currentPage, setCurrentPage]   = useState(1);
  const perPage                         = 9;

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/courses'),
      api.get('/enrollments'),
    ]).then(([courseRes, enrollRes]) => {
      setCourses(courseRes.data.data ?? []);
      const myEnroll: { id: number; status: string; enrollment_type: string | null; course: { id: number } }[] =
        enrollRes.data.data ?? [];
      const map = new Map<number, EnrollmentInfo>();
      (Array.isArray(myEnroll) ? myEnroll : []).forEach((e) => {
        if (e.course?.id) {
          map.set(e.course.id, {
            id: e.id,
            course_id: e.course.id,
            status: e.status,
            enrollment_type: e.enrollment_type,
          });
        }
      });
      setEnrollment(map);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Payment ─────────────────────────────────────────────────────────────────
  const handlePay = async (enrollmentId: number) => {
    setPaying(enrollmentId);
    try {
      const res = await api.post('/payments/create-snap-token', { enrollment_id: enrollmentId });

      if (res.data.data?.is_paid) {
        alert('Pembayaran terverifikasi lunas! Kursus kamu sudah aktif.');
        await loadData();
        return;
      }

      const snapToken  = res.data.data?.snap_token;
      const redirectUrl = res.data.data?.redirect_url;

      if (typeof window !== 'undefined' && window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await api.post('/payments/verify-status', { enrollment_id: enrollmentId }).catch(() => {});
            alert('Pembayaran berhasil! Kursus kamu sudah aktif.');
            loadData();
          },
          onPending: () => {
            alert('Menunggu pembayaran selesai. Silakan selesaikan instruksi pembayaran.');
            loadData();
          },
          onError: () => alert('Pembayaran gagal atau dibatalkan.'),
          onClose: async () => {
            try {
              const v = await api.post('/payments/verify-status', { enrollment_id: enrollmentId });
              if (v.data?.data?.is_active) alert('Pembayaran berhasil diverifikasi! Kursus kamu sudah aktif.');
            } catch { /* ignore */ }
            loadData();
          },
        });
      } else if (redirectUrl) {
        window.open(redirectUrl, '_blank');
      } else {
        alert('Gagal memuat pop-up pembayaran.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal memproses pembayaran Midtrans.');
    } finally {
      setPaying(null);
    }
  };

  // ── Enroll ──────────────────────────────────────────────────────────────────
  const handleEnroll = async (courseId: number, courseSlug: string) => {
    setEnrolling(courseId);
    try {
      const res = await api.post('/enrollments', { course_id: courseId });
      const newEnroll = res.data.data;
      setEnrollment(prev => {
        const next = new Map(prev);
        next.set(courseId, { id: newEnroll.id, course_id: courseId, status: newEnroll.status, enrollment_type: newEnroll.enrollment_type });
        return next;
      });

      if (newEnroll.status === 'active') {
        window.location.href = `/student/courses/${courseSlug}`;
        return;
      }
      if (newEnroll.status === 'payment_pending' && newEnroll.id) {
        await handlePay(newEnroll.id);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setEnrolling(null);
    }
  };

  // ── Filter & Group ──────────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleTabChange = (tab: TabCategory) => { setActiveTab(tab); setCurrentPage(1); };

  const searchFiltered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const tabFiltered = searchFiltered.filter(c => {
    const code = c.certification_level?.code;
    if (activeTab === 'INT_CERT') return code === 'FND' || code === 'SPEC';
    if (activeTab === 'NAT') return code === 'NAT';
    if (activeTab === 'SGL') return code === 'SGL';
    return true;
  });

  const countAll     = courses.length;
  const countIntCert = courses.filter(c => ['FND', 'SPEC'].includes(c.certification_level?.code ?? '')).length;
  const countNat     = courses.filter(c => c.certification_level?.code === 'NAT').length;
  const countSgl     = courses.filter(c => c.certification_level?.code === 'SGL').length;

  const countMap: Record<TabCategory, number> = {
    ALL: countAll, INT_CERT: countIntCert, NAT: countNat, SGL: countSgl,
  };

  const totalPages       = Math.max(1, Math.ceil(tabFiltered.length / perPage));
  const startIndex       = (currentPage - 1) * perPage;
  const paginatedCourses = tabFiltered.slice(startIndex, startIndex + perPage);

  const foundation     = paginatedCourses.filter(c => c.certification_level?.code === 'FND');
  const specialization = paginatedCourses.filter(c => c.certification_level?.code === 'SPEC');
  const national       = paginatedCourses.filter(c => c.certification_level?.code === 'NAT');
  const singleMod      = paginatedCourses.filter(c => c.certification_level?.code === 'SGL');

  const hasSpecEnrollment = Array.from(enrollmentMap.values()).some(e =>
    ['pending_review', 'payment_pending', 'active', 'completed'].includes(e.status) &&
    courses.find(c => c.id === e.course_id)?.certification_level?.code === 'SPEC'
  );

  return (
    <div className="animate-fadeup flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Katalog Kursus</h1>
        <p className="text-slate-500 text-sm mt-1">Pilih program pelatihan yang ingin kamu ikuti</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search-1" size={18} /></span>
          <input
            type="text"
            placeholder="Cari kursus atau bidang peminatan..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-catalog-${tab.id.toLowerCase()}`}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-navy text-white shadow-md shadow-navy/20 scale-[1.02]'
                  : 'bg-white text-slate-600 hover:text-navy hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {countMap[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card flex flex-col gap-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-200 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between gap-10">
          <div className="flex flex-col gap-10">

            {/* International Certification — Foundation */}
            {foundation.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Icon name="graduation-cap-1" size={13} />
                    International Certification — Foundation
                  </span>
                  <span className="text-slate-400 text-sm">Wajib diikuti sebelum peminatan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {foundation.map(course => (
                    <CourseCard key={course.id} course={course}
                      enrollment={enrollmentMap.get(course.id) ?? null}
                      isEnrolling={enrolling === course.id}
                      isPaying={paying === (enrollmentMap.get(course.id)?.id ?? 0)}
                      onEnroll={handleEnroll}
                      onPay={handlePay} />
                  ))}
                </div>
              </section>
            )}

            {/* International Certification — Specialization */}
            {specialization.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-navy/10 text-navy border-navy/30">
                    <Icon name="rocket-5" size={13} />
                    International Certification — Specialization
                  </span>
                  <span className="text-slate-400 text-sm">{countIntCert - courses.filter(c => c.certification_level?.code === 'FND').length} track tersedia</span>
                </div>
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 rounded-lg flex gap-3 items-start">
                  <span>ℹ️</span>
                  <p><em>Aturan Program: Peserta hanya dapat memilih 1 bidang spesialisasi. Sekali kamu mendaftar, pilihan spesialisasi lain akan dikunci secara permanen.</em></p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {specialization.map(course => {
                    const hasThisEnrollment = enrollmentMap.has(course.id) &&
                      ['pending_review', 'payment_pending', 'active', 'completed'].includes(enrollmentMap.get(course.id)!.status);
                    const isLocked = hasSpecEnrollment && !hasThisEnrollment;
                    return (
                      <CourseCard key={course.id} course={course}
                        enrollment={enrollmentMap.get(course.id) ?? null}
                        isEnrolling={enrolling === course.id}
                        isPaying={paying === (enrollmentMap.get(course.id)?.id ?? 0)}
                        isLocked={isLocked}
                        onEnroll={handleEnroll}
                        onPay={handlePay} />
                    );
                  })}
                </div>
              </section>
            )}

            {/* National Training Course */}
            {national.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-800 border-amber-200">
                    <Icon name="flag-1" size={13} />
                    National Training Course
                  </span>
                  <span className="text-slate-400 text-sm">{countNat} kursus tersedia</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {national.map(course => (
                    <CourseCard key={course.id} course={course}
                      enrollment={enrollmentMap.get(course.id) ?? null}
                      isEnrolling={enrolling === course.id}
                      isPaying={paying === (enrollmentMap.get(course.id)?.id ?? 0)}
                      onEnroll={handleEnroll}
                      onPay={handlePay} />
                  ))}
                </div>
              </section>
            )}

            {/* Single Modul Course */}
            {singleMod.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-purple-50 text-purple-800 border-purple-200">
                    <Icon name="book-1" size={13} />
                    Single Modul Course
                  </span>
                  <span className="text-slate-400 text-sm">{countSgl} modul tersedia</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {singleMod.map(course => (
                    <CourseCard key={course.id} course={course}
                      enrollment={enrollmentMap.get(course.id) ?? null}
                      isEnrolling={enrolling === course.id}
                      isPaying={paying === (enrollmentMap.get(course.id)?.id ?? 0)}
                      onEnroll={handleEnroll}
                      onPay={handlePay} />
                  ))}
                </div>
              </section>
            )}

            {tabFiltered.length === 0 && (
              <div className="card py-16 text-center text-slate-400">
                <div className="text-4xl mb-4"><Icon name="search-1" size={36} /></div>
                <p className="font-medium text-navy-dark">Kursus tidak ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau pilih tab kategori yang berbeda</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {tabFiltered.length > perPage && (
            <div className="card mt-auto sticky bottom-0 sm:bottom-4 z-20 shadow-lg shadow-navy/5 backdrop-blur-md bg-white/95 border border-slate-200/90 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl">
              <span className="text-sm text-slate-500">
                Menampilkan <strong className="text-navy-dark font-bold">{startIndex + 1}</strong> – <strong className="text-navy-dark font-bold">{Math.min(startIndex + perPage, tabFiltered.length)}</strong> dari <strong className="text-navy-dark font-bold">{tabFiltered.length}</strong> kursus
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-catalog-prev"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  <Icon name="arrow-left" size={16} className="mr-1.5" />Sebelumnya
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={`cat-page-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        currentPage === p
                          ? 'bg-navy text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-navy-dark'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  id="btn-catalog-next"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Selanjutnya <Icon name="arrow-right" size={14} className="ml-1.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, enrollment, isEnrolling, isPaying, isLocked, onEnroll, onPay }: {
  course: Course;
  enrollment: EnrollmentInfo | null;
  isEnrolling: boolean;
  isPaying: boolean;
  isLocked?: boolean;
  onEnroll: (id: number, slug: string) => void;
  onPay: (enrollmentId: number) => void;
}) {
  const code  = course.certification_level?.code ?? 'SPEC';
  const style = LEVEL_STYLE[code] ?? LEVEL_STYLE['SPEC'];

  return (
    <div className={`card transition-all duration-200 flex flex-col gap-4 ${isLocked ? 'opacity-70 border-slate-300' : 'hover:shadow-lg hover:-translate-y-0.5'}`}>
      <div className={`-mx-6 -mt-6 h-2 rounded-t-2xl bg-gradient-to-r ${style.card} ${isLocked ? 'grayscale opacity-50' : ''}`} />

      <div className="flex items-start justify-between gap-2 pt-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
          {course.certification_level?.name ?? code}
        </span>
        <span className="text-sm font-bold text-navy-dark">
          {course.price === 0 ? 'Gratis' : `Rp${Number(course.price).toLocaleString('id-ID')}`}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-navy-dark text-base leading-snug">{course.title}</h3>
        {course.description && (
          <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">{course.description}</p>
        )}
      </div>

      {/* CTA Button */}
      {isLocked ? (
        <button disabled className="btn w-full text-sm font-semibold text-center bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
          <Icon name="locked-1" size={16} className="mr-1.5" />Terkunci (Maks. 1 Spesialisasi)
        </button>
      ) : !enrollment ? (
        <button id={`enroll-${course.id}`}
          onClick={() => onEnroll(course.id, course.slug)}
          disabled={isEnrolling}
          className="btn btn-primary w-full text-sm font-semibold">
          {isEnrolling ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Mendaftar...
            </span>
          ) : <><Icon name="rocket-5" size={16} className="mr-1.5" />Daftar Sekarang</>}
        </button>
      ) : enrollment.status === 'payment_pending' ? (
        <button
          id={`pay-${course.id}`}
          onClick={() => onPay(enrollment.id)}
          disabled={isPaying}
          className="btn w-full text-sm font-semibold text-center bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center gap-2"
        >
          {isPaying ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Menghubungkan Midtrans...
            </span>
          ) : (
            <><Icon name="credit-card-multiple" size={16} className="mr-1.5" />Bayar Sekarang</>
          )}
        </button>
      ) : enrollment.status === 'active' || enrollment.status === 'completed' ? (
        <Link href={`/student/courses/${course.slug}`}
          id={`learn-${course.id}`}
          className="btn w-full text-sm font-semibold text-center btn-primary">
          <Icon name="book-1" size={16} className="mr-1.5" />Lanjut Belajar <Icon name="arrow-right" size={14} className="ml-1.5" />
        </Link>
      ) : enrollment.status === 'pending_review' ? (
        <div className="btn w-full text-sm font-semibold text-center bg-amber-50 text-amber-700 border border-amber-200 cursor-default">
          <Icon name="hourglass" size={16} className="mr-1.5" />Menunggu Kurasi Admin
        </div>
      ) : (
        <div className="btn w-full text-sm font-semibold text-center bg-red-50 text-red-600 border border-red-200 cursor-default">
          <Icon name="xmark-circle" size={16} className="mr-1.5" />Pendaftaran Ditolak
        </div>
      )}
    </div>
  );
}
