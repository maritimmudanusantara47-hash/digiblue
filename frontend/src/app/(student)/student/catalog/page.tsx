
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Course } from '@/types';
import LineIcon from '@/components/LineIcon';

interface EnrollmentInfo {
  id: number;
  course_id: number;
  status: string;
  enrollment_type: string | null;
}

const LEVEL_STYLE: Record<string, { badge: string; card: string }> = {
  FND: { badge: 'badge-gold', card: 'from-amber-500 to-yellow-600' },
  SPEC: { badge: 'badge-navy', card: 'from-navy to-navy-light' },
};

export default function StudentCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentMap, setEnrollment] = useState<Map<number, EnrollmentInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [paying, setPaying] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);

    Promise.all([
      api.get('/courses'),
      api.get('/enrollments'),
    ])
      .then(([courseRes, enrollRes]) => {
        setCourses(courseRes.data.data ?? []);

        const myEnroll: {
          id: number;
          status: string;
          enrollment_type: string | null;
          course: { id: number };
        }[] = enrollRes.data.data ?? [];

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
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async (enrollmentId: number) => {
    setPaying(enrollmentId);

    try {
      const res = await api.post('/payments/create-snap-token', {
        enrollment_id: enrollmentId,
      });

      if (res.data.data?.is_paid) {
        alert('Pembayaran terverifikasi lunas! Kursus kamu sudah aktif.');
        await loadData();
        return;
      }

      const snapToken = res.data.data?.snap_token;
      const redirectUrl = res.data.data?.redirect_url;

      if (typeof window !== 'undefined' && window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await api
              .post('/payments/verify-status', {
                enrollment_id: enrollmentId,
              })
              .catch(() => { });

            alert('Pembayaran berhasil! Kursus kamu sudah aktif.');
            loadData();
          },

          onPending: () => {
            alert(
              'Menunggu pembayaran selesai. Silakan selesaikan instruksi pembayaran.'
            );
            loadData();
          },

          onError: () => {
            alert('Pembayaran gagal atau dibatalkan.');
          },

          onClose: async () => {
            try {
              const v = await api.post('/payments/verify-status', {
                enrollment_id: enrollmentId,
              });

              if (v.data?.data?.is_active) {
                alert(
                  'Pembayaran berhasil diverifikasi! Kursus kamu sudah aktif.'
                );
              }
            } catch {
              // ignore
            }

            loadData();
          },
        });
      } else if (redirectUrl) {
        window.open(redirectUrl, '_blank');
      } else {
        alert('Gagal memuat pop-up pembayaran.');
      }
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;

      alert(msg ?? 'Gagal memproses pembayaran Midtrans.');
    } finally {
      setPaying(null);
    }
  };

  const handleEnroll = async (
    courseId: number,
    courseSlug: string
  ) => {
    setEnrolling(courseId);

    try {
      const res = await api.post('/enrollments', {
        course_id: courseId,
      });

      const newEnroll = res.data.data;

      setEnrollment((prev) => {
        const next = new Map(prev);

        next.set(courseId, {
          id: newEnroll.id,
          course_id: courseId,
          status: newEnroll.status,
          enrollment_type: newEnroll.enrollment_type,
        });

        return next;
      });

      if (newEnroll.status === 'active') {
        window.location.href = `/student/courses/${courseSlug}`;
        return;
      }

      if (
        newEnroll.status === 'payment_pending' &&
        newEnroll.id
      ) {
        await handlePay(newEnroll.id);
      }
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;

      alert(msg ?? 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setEnrolling(null);
    }
  };

  type TabCategory = 'ALL' | 'FND' | 'SPEC';

  const [activeTab, setActiveTab] =
    useState<TabCategory>('ALL');

  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 6;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: TabCategory) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const searchFiltered = courses.filter(
    (c) =>
      c.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (c.description &&
        c.description
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  const tabFiltered = searchFiltered.filter((c) => {
    if (activeTab === 'FND') {
      return c.certification_level?.code === 'FND';
    }

    if (activeTab === 'SPEC') {
      return c.certification_level?.code === 'SPEC';
    }

    return true;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(tabFiltered.length / perPage)
  );

  const startIndex =
    (currentPage - 1) * perPage;

  const paginatedCourses = tabFiltered.slice(
    startIndex,
    startIndex + perPage
  );

  const foundation = paginatedCourses.filter(
    (c) => c.certification_level?.code === 'FND'
  );

  const specialization = paginatedCourses.filter(
    (c) => c.certification_level?.code === 'SPEC'
  );

  const countAll = courses.length;

  const countFnd = courses.filter(
    (c) => c.certification_level?.code === 'FND'
  ).length;

  const countSpec = courses.filter(
    (c) => c.certification_level?.code === 'SPEC'
  ).length;

  return (
    <div className="animate-fadeup flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">
          Katalog Kursus
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          Pilih program sertifikasi Blue Economy yang ingin kamu ikuti
        </p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <LineIcon name="search-1" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

          <input
            type="text"
            placeholder="Cari kursus atau bidang peminatan..."
            value={search}
            onChange={(e) =>
              handleSearchChange(e.target.value)
            }
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {[
          {
            id: 'ALL' as const,
            label: 'Semua',
            count: countAll,
            icon: 'star-fat',
          },
          {
            id: 'FND' as const,
            label: 'Foundation Level',
            count: countFnd,
            icon: 'graduation-cap-1',
          },
          {
            id: 'SPEC' as const,
            label: 'Spesialisasi Track',
            count: countSpec,
            icon: 'rocket-5',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-catalog-${tab.id.toLowerCase()}`}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive
                ? 'bg-navy text-white shadow-md shadow-navy/20 scale-[1.02]'
                : 'bg-white text-slate-600 hover:text-navy hover:bg-slate-100 border border-slate-200 shadow-sm'
                }`}
            >
              <LineIcon name={tab.icon} size={16} />

              <span>{tab.label}</span>

              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="card flex flex-col gap-4 animate-pulse"
              >
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

            {/* Foundation Section */}
            {foundation.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-gold/10 text-gold-dark border-gold/30">
                    Foundation Level
                  </span>

                  <span className="text-slate-400 text-sm">
                    Wajib diikuti sebelum peminatan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {foundation.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrollment={
                        enrollmentMap.get(course.id) ?? null
                      }
                      isEnrolling={
                        enrolling === course.id
                      }
                      isPaying={
                        paying ===
                        (enrollmentMap.get(course.id)?.id ?? 0)
                      }
                      onEnroll={handleEnroll}
                      onPay={handlePay}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Specialization Section */}
            {specialization.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-navy/10 text-navy border-navy/30">
                    Specialization Level
                  </span>

                  <span className="text-slate-400 text-sm">
                    {activeTab === 'SPEC'
                      ? `${tabFiltered.length} track tersedia`
                      : `${countSpec} track tersedia`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {specialization.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrollment={
                        enrollmentMap.get(course.id) ?? null
                      }
                      isEnrolling={
                        enrolling === course.id
                      }
                      isPaying={
                        paying ===
                        (enrollmentMap.get(course.id)?.id ?? 0)
                      }
                      onEnroll={handleEnroll}
                      onPay={handlePay}
                    />
                  ))}
                </div>
              </section>
            )}

            {tabFiltered.length === 0 && (
              <div className="card py-16 text-center text-slate-400">
                <LineIcon name="search-1" className="text-4xl mx-auto mb-4" />

                <p className="font-medium text-navy-dark">
                  Kursus tidak ditemukan
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Coba kata kunci lain atau pilih tab kategori yang berbeda
                </p>
              </div>
            )}
          </div>

          {/* Catalog Pagination Controls */}
          {tabFiltered.length > perPage && (
            <div className="card mt-auto sticky bottom-0 sm:bottom-4 z-20 shadow-lg shadow-navy/5 backdrop-blur-md bg-white/95 border border-slate-200/90 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl">
              <span className="text-sm text-slate-500">
                Menampilkan{' '}
                <strong className="text-navy-dark font-bold">
                  {startIndex + 1}
                </strong>{' '}
                –{' '}
                <strong className="text-navy-dark font-bold">
                  {Math.min(
                    startIndex + perPage,
                    tabFiltered.length
                  )}
                </strong>{' '}
                dari{' '}
                <strong className="text-navy-dark font-bold">
                  {tabFiltered.length}
                </strong>{' '}
                kursus
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-catalog-prev"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.max(1, p - 1)
                    )
                  }
                  disabled={currentPage <= 1}
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  <LineIcon name="arrow-left" className="text-xs" />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: totalPages },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={`cat-page-${p}`}
                      onClick={() =>
                        setCurrentPage(p)
                      }
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${currentPage === p
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
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        totalPages,
                        p + 1
                      )
                    )
                  }
                  disabled={
                    currentPage >= totalPages
                  }
                  className="btn btn-secondary btn-sm text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Selanjutnya
                  <LineIcon name="arrow-right" className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  enrollment,
  isEnrolling,
  isPaying,
  onEnroll,
  onPay,
}: {
  course: Course;
  enrollment: EnrollmentInfo | null;
  isEnrolling: boolean;
  isPaying: boolean;
  onEnroll: (id: number, slug: string) => void;
  onPay: (enrollmentId: number) => void;
}) {
  const level =
    course.certification_level?.code ?? 'SPEC';

  const style =
    LEVEL_STYLE[level] ?? LEVEL_STYLE['SPEC'];

  return (
    <div className="card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4">
      <div
        className={`-mx-6 -mt-6 h-2 rounded-t-2xl bg-gradient-to-r ${style.card}`}
      />

      <div className="flex items-start justify-between gap-2 pt-1">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}
        >
          {course.certification_level?.name ?? level}
        </span>

        <span className="text-sm font-bold text-navy-dark">
          {course.price === 0
            ? 'Gratis'
            : `Rp${Number(course.price).toLocaleString(
              'id-ID'
            )}`}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-navy-dark text-base leading-snug">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      {/* CTA Button */}

      {!enrollment ? (
        <button
          id={`enroll-${course.id}`}
          onClick={() =>
            onEnroll(course.id, course.slug)
          }
          disabled={isEnrolling}
          className="btn btn-primary w-full text-sm font-semibold"
        >
          {isEnrolling ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>

              Mendaftar...
            </span>
          ) : (
            <>
              <LineIcon name="rocket-5" className="text-sm" />
              Daftar Sekarang
            </>
          )}
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
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>

              Menghubungkan Midtrans...
            </span>
          ) : (
            <>
              <LineIcon name="credit-card-multiple" className="text-sm" />
              Bayar Sekarang
            </>
          )}
        </button>
      ) : enrollment.status === 'active' ||
        enrollment.status === 'completed' ? (
        <Link
          href={`/student/courses/${course.slug}`}
          id={`learn-${course.id}`}
          className="btn w-full text-sm font-semibold text-center btn-primary flex items-center justify-center gap-2"
        >
          <LineIcon name="book-1" className="text-sm" />
          Lanjut Belajar
          <LineIcon name="arrow-right" className="text-sm" />
        </Link>
      ) : enrollment.status === 'pending_review' ? (
        <div className="btn w-full text-sm font-semibold text-center bg-amber-50 text-amber-700 border border-amber-200 cursor-default flex items-center justify-center gap-2">
          <LineIcon name="hourglass" className="text-sm" />
          Menunggu Kurasi Admin
        </div>
      ) : (
        <div className="btn w-full text-sm font-semibold text-center bg-red-50 text-red-600 border border-red-200 cursor-default flex items-center justify-center gap-2">
          <LineIcon name="xmark-circle" className="text-sm" />
          Pendaftaran Ditolak
        </div>
      )}
    </div>
  );
}

