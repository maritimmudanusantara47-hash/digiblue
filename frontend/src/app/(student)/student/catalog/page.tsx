'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import type { Course } from '@/types';

interface EnrollmentInfo {
  id: number;
  course_id: number;
  status: string;
  enrollment_type: string | null;
}

const LEVEL_STYLE: Record<string, { badge: string; card: string }> = {
  FND:  { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', card: 'from-emerald-600 to-emerald-400' },
  SPEC: { badge: 'bg-navy/10 text-navy border-navy/30',                card: 'from-navy to-navy-light' },
};

const STATUS_MSG: Record<string, { label: string; color: string; canLearn: boolean }> = {
  active:          { label: 'Lanjut Belajar →',    color: 'bg-navy text-white hover:bg-navy-light',           canLearn: true },
  completed:       { label: '✓ Kursus Selesai',    color: 'bg-emerald-500 text-white hover:bg-emerald-600',   canLearn: true },
  payment_pending: { label: '⏳ Menunggu Pembayaran', color: 'bg-orange-100 text-orange-700 border border-orange-300 cursor-default', canLearn: false },
  pending_review:  { label: '⏳ Menunggu Kurasi Admin', color: 'bg-amber-100 text-amber-700 border border-amber-300 cursor-default',  canLearn: false },
  rejected:        { label: '❌ Ditolak',           color: 'bg-red-100 text-red-600 border border-red-300 cursor-default',           canLearn: false },
};

export default function StudentCatalogPage() {
  const [courses, setCourses]           = useState<Course[]>([]);
  const [enrollmentMap, setEnrollment]  = useState<Map<number, EnrollmentInfo>>(new Map());
  const [loading, setLoading]           = useState(true);
  const [enrolling, setEnrolling]       = useState<number | null>(null);
  const [search, setSearch]             = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/enrollments'),
    ]).then(([coursesRes, enrollRes]) => {
      const allCourses = coursesRes.data.data ?? coursesRes.data ?? [];
      setCourses(Array.isArray(allCourses) ? allCourses : []);

      const myEnroll: { id: number; status: string; enrollment_type: string | null; course: { id: number } }[] =
        enrollRes.data.data ?? [];
      const map = new Map<number, EnrollmentInfo>();
      (Array.isArray(myEnroll) ? myEnroll : []).forEach((e) => {
        if (e.course?.id) map.set(e.course.id, { id: e.id, course_id: e.course.id, status: e.status, enrollment_type: e.enrollment_type });
      });
      setEnrollment(map);
    }).finally(() => setLoading(false));
  }, []);

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
      // Redirect ke halaman kursus jika langsung aktif
      if (newEnroll.status === 'active') {
        window.location.href = `/student/courses/${courseSlug}`;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setEnrolling(null);
    }
  };

  const filtered      = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const foundation    = filtered.filter(c => c.certification_level?.code === 'FND');
  const specialization = filtered.filter(c => c.certification_level?.code === 'SPEC');

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Katalog Kursus</h1>
        <p className="text-slate-500 text-sm mt-1">Pilih program sertifikasi Blue Economy yang ingin kamu ikuti</p>
      </div>

      <div className="card mb-8">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input id="catalog-search" type="text" placeholder="Cari nama kursus..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="form-input pl-10 py-2.5 w-full text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Memuat katalog...
        </div>
      ) : (
        <div className="space-y-10">
          {foundation.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-300">Foundation Level</span>
                <span className="text-slate-400 text-sm">{foundation.length} program</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {foundation.map(course => (
                  <CourseCard key={course.id} course={course}
                    enrollment={enrollmentMap.get(course.id) ?? null}
                    isEnrolling={enrolling === course.id}
                    onEnroll={handleEnroll} />
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
                    onEnroll={handleEnroll} />
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

function CourseCard({ course, enrollment, isEnrolling, onEnroll }: {
  course: Course;
  enrollment: EnrollmentInfo | null;
  isEnrolling: boolean;
  onEnroll: (id: number, slug: string) => void;
}) {
  const level = course.certification_level?.code ?? 'SPEC';
  const style = LEVEL_STYLE[level] ?? LEVEL_STYLE['SPEC'];
  const enInfo = enrollment ? (STATUS_MSG[enrollment.status] ?? STATUS_MSG['pending_review']) : null;

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
      ) : enInfo?.canLearn ? (
        // Aktif / Selesai → tombol Lanjut Belajar
        <Link href={`/student/courses/${course.slug}`}
          id={`learn-${course.id}`}
          className={`btn w-full text-sm font-semibold text-center ${enInfo.color}`}>
          {enInfo.label}
        </Link>
      ) : (
        // Pending/Rejected → info status
        <div className={`btn w-full text-sm font-semibold text-center ${enInfo?.color ?? ''}`}>
          {enInfo?.label ?? 'Menunggu...'}
        </div>
      )}
    </div>
  );
}
