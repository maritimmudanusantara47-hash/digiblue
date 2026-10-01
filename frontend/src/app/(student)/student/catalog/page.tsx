'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Course } from '@/types';

interface EnrollmentInfo {
  id: number;
  course_id: number;
  status: string; // 'payment_pending' | 'pending_review' | 'active' | 'completed' | 'rejected'
  enrollment_type: string | null;
}

const LEVEL_STYLE: Record<string, { badge: string; card: string }> = {
  FND:  { badge: 'badge-gold', card: 'from-amber-500 to-yellow-600' },
  SPEC: { badge: 'badge-navy', card: 'from-navy to-navy-light' },
};

export default function StudentCatalogPage() {
  const [courses, setCourses]           = useState<Course[]>([]);
  const [enrollmentMap, setEnrollment]  = useState<Map<number, EnrollmentInfo>>(new Map());
  const [loading, setLoading]           = useState(true);
  const [enrolling, setEnrolling]       = useState<number | null>(null);
  const [paying, setPaying]             = useState<number | null>(null);
  const [search, setSearch]             = useState('');

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async (enrollmentId: number) => {
    setPaying(enrollmentId);
    try {
      const res = await api.post('/payments/create-snap-token', {
        enrollment_id: enrollmentId,
      });
      const snapToken = res.data.data?.snap_token;
      const redirectUrl = res.data.data?.redirect_url;

      if (typeof window !== 'undefined' && window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            alert('🎉 Pembayaran berhasil! Kursus kamu sudah aktif.');
            loadData();
          },
          onPending: () => {
            alert('⏳ Menunggu pembayaran selesai. Silakan selesaikan instruksi pembayaran.');
            loadData();
          },
          onError: () => {
            alert('❌ Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
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

      // Jika langsung aktif
      if (newEnroll.status === 'active') {
        window.location.href = `/student/courses/${courseSlug}`;
        return;
      }

      // Jika butuh pembayaran mandiri (payment_pending), langsung picu Snap!
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

  const filtered       = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const foundation     = filtered.filter(c => c.certification_level?.code === 'FND');
  const specialization = filtered.filter(c => c.certification_level?.code === 'SPEC');

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Katalog Kursus</h1>
        <p className="text-slate-500 text-sm mt-1">Pilih program sertifikasi Blue Economy yang ingin kamu ikuti</p>
      </div>

      {/* Search */}
      <div className="card mb-8">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Cari kursus atau bidang peminatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="flex flex-col gap-10">
          {foundation.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-gold/10 text-gold-dark border-gold/30">Foundation Level</span>
                <span className="text-slate-400 text-sm">Wajib diikuti sebelum peminatan</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          {specialization.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-navy/10 text-navy border-navy/30">Specialization Level</span>
                <span className="text-slate-400 text-sm">{specialization.length} track</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {specialization.map(course => (
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

          {filtered.length === 0 && (
            <div className="card py-16 text-center text-slate-400">
              <div className="text-4xl mb-4">🔎</div>
              <p className="font-medium">Kursus tidak ditemukan</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, enrollment, isEnrolling, isPaying, onEnroll, onPay }: {
  course: Course;
  enrollment: EnrollmentInfo | null;
  isEnrolling: boolean;
  isPaying: boolean;
  onEnroll: (id: number, slug: string) => void;
  onPay: (enrollmentId: number) => void;
}) {
  const level = course.certification_level?.code ?? 'SPEC';
  const style = LEVEL_STYLE[level] ?? LEVEL_STYLE['SPEC'];

  return (
    <div className="card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4">
      <div className={`-mx-6 -mt-6 h-2 rounded-t-2xl bg-gradient-to-r ${style.card}`} />

      <div className="flex items-start justify-between gap-2 pt-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}>
          {course.certification_level?.name ?? level}
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
      {!enrollment ? (
        // Belum daftar → tombol Daftar
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
          ) : '🚀 Daftar Sekarang'}
        </button>
      ) : enrollment.status === 'payment_pending' ? (
        // Menunggu Pembayaran → Tombol Bayar Sekarang (Pemicu Midtrans Snap)
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
            '💳 Bayar Sekarang'
          )}
        </button>
      ) : enrollment.status === 'active' || enrollment.status === 'completed' ? (
        // Aktif / Selesai → tombol Lanjut Belajar
        <Link href={`/student/courses/${course.slug}`}
          id={`learn-${course.id}`}
          className="btn w-full text-sm font-semibold text-center btn-primary">
          📖 Lanjut Belajar →
        </Link>
      ) : enrollment.status === 'pending_review' ? (
        <div className="btn w-full text-sm font-semibold text-center bg-amber-50 text-amber-700 border border-amber-200 cursor-default">
          ⏳ Menunggu Kurasi Admin
        </div>
      ) : (
        <div className="btn w-full text-sm font-semibold text-center bg-red-50 text-red-600 border border-red-200 cursor-default">
          ❌ Pendaftaran Ditolak
        </div>
      )}
    </div>
  );
}
