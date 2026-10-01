'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ScholarshipApplication, Enrollment } from '@/types';

type Step = 'check' | 'form' | 'status';

export default function StudentScholarshipPage() {
  const [step, setStep]               = useState<Step>('check');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [myApp, setMyApp]             = useState<ScholarshipApplication | null>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  // Form state
  const [selectedEnrollment, setSelectedEnrollment] = useState('');
  const [motivationLetter, setMotivation]           = useState('');
  const [documentFile, setDocumentFile]             = useState<File | null>(null);

  // Appeal state
  const [showAppeal, setShowAppeal]   = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealAmount, setAppealAmount] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments'),
      // Coba ambil data scholarship dari admin endpoint — fallback empty
      api.get('/admin/scholarships').catch(() => ({ data: { data: { data: [] } } })),
    ]).then(([enrollRes, scholRes]) => {
      const enrList = enrollRes.data.data;
      const allEnr  = Array.isArray(enrList) ? enrList : enrList?.data ?? [];
      setEnrollments(allEnr);

      // Cek apakah user sudah punya application
      const scholList = scholRes.data.data?.data ?? [];
      if (scholList.length > 0) {
        setMyApp(scholList[0]);
        setStep('status');
      } else {
        setStep('form');
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment || !motivationLetter.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('enrollment_id', selectedEnrollment);
      formData.append('motivation_letter', motivationLetter);
      if (documentFile) formData.append('document', documentFile);

      const res = await api.post('/scholarships/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMyApp(res.data.data);
      setStep('status');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengajukan beasiswa. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myApp || !appealReason.trim()) return;

    setAppealSubmitting(true);
    try {
      await api.post(`/scholarships/${myApp.id}/appeal`, {
        reason: appealReason,
        proposed_amount: appealAmount ? Number(appealAmount) : null,
      });
      alert('Negosiasi berhasil diajukan! Tunggu respon dari admin.');
      setShowAppeal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Gagal mengajukan negosiasi.');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const STATUS_INFO: Record<string, { label: string; color: string; icon: string; desc: string }> = {
    pending:            { label: 'Menunggu Kurasi',  color: 'text-amber-600  bg-amber-50  border-amber-200',  icon: '⏳', desc: 'Pengajuan beasiswamu sedang ditinjau oleh tim admin.' },
    approved_fully:     { label: 'Fully Funded ✓',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: '🎉', desc: 'Selamat! Seluruh biaya kursus ditanggung program.' },
    approved_partial_a: { label: 'Partial A ✓',     color: 'text-navy bg-navy/5 border-navy/20',              icon: '✅', desc: 'Kamu mendapat bantuan Rp1.000.000. Sisa biaya dapat dinegosiasikan.' },
    approved_partial_b: { label: 'Partial B ✓',     color: 'text-gold-dark bg-gold/10 border-gold/30',        icon: '✅', desc: 'Kamu mendapat bantuan Rp1.500.000. Sisa biaya dapat dinegosiasikan.' },
    rejected:           { label: 'Tidak Lolos',      color: 'text-red-600   bg-red-50   border-red-200',       icon: '❌', desc: 'Pengajuan beasiswamu tidak lolos seleksi.' },
  };

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Beasiswa</h1>
        <p className="text-slate-500 text-sm mt-1">Ajukan beasiswa untuk meringankan biaya kursus</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Memuat data...
        </div>
      ) : step === 'form' ? (
        /* ── Form Pengajuan ── */
        <div className="max-w-xl">
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-700">
              📋 <strong>Cara Kerja Beasiswa:</strong> Ajukan surat motivasi dan dokumen pendukung. Admin akan memutuskan: Fully Funded, Partial A (Rp1jt), Partial B (Rp1.5jt), atau tidak lolos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Pilih Kursus</label>
              <select
                id="scholarship-enrollment"
                required
                value={selectedEnrollment}
                onChange={e => setSelectedEnrollment(e.target.value)}
                className="form-input"
              >
                <option value="">-- Pilih kursus yang ingin dibeasiswakan --</option>
                {enrollments.map(en => (
                  <option key={en.id} value={en.id}>
                    {en.course?.title} ({en.course?.certification_level?.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="form-label">Surat Motivasi</label>
              <textarea
                id="motivation-letter"
                required
                rows={6}
                placeholder="Ceritakan mengapa kamu layak mendapatkan beasiswa ini, latar belakang, dan rencana ke depan..."
                value={motivationLetter}
                onChange={e => setMotivation(e.target.value)}
                className="form-input resize-none"
              />
              <span className="text-xs text-slate-400">{motivationLetter.length} karakter</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="form-label">Dokumen Pendukung <span className="text-slate-400 font-normal">(opsional, PDF/JPG maks 5MB)</span></label>
              <input
                id="scholarship-doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setDocumentFile(e.target.files?.[0] ?? null)}
                className="form-input text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white hover:file:bg-navy-light"
              />
            </div>

            <button
              type="submit"
              id="submit-scholarship"
              disabled={submitting || !selectedEnrollment || !motivationLetter.trim()}
              className="btn btn-primary btn-lg"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Mengajukan...
                </span>
              ) : '🎓 Ajukan Beasiswa'}
            </button>
          </form>
        </div>
      ) : step === 'status' && myApp ? (
        /* ── Status Pengajuan ── */
        <div className="max-w-xl">
          {(() => {
            const info = STATUS_INFO[myApp.decision_status] ?? STATUS_INFO['pending'];
            return (
              <div className={`card border mb-6 ${info.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <p className="font-extrabold text-lg">{info.label}</p>
                    <p className="text-sm opacity-80">{info.desc}</p>
                  </div>
                </div>
                {myApp.reviewer_notes && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <p className="text-xs font-semibold opacity-70 mb-1">Catatan Admin:</p>
                    <p className="text-sm">{myApp.reviewer_notes}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Detail Pengajuan */}
          <div className="card mb-6">
            <h3 className="font-bold text-navy-dark mb-4">Detail Pengajuan</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Kursus</span>
                <span className="font-medium text-navy-dark">{myApp.enrollment?.course?.title ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Pengajuan</span>
                <span className="font-medium">{new Date(myApp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold">{STATUS_INFO[myApp.decision_status]?.label ?? myApp.decision_status}</span>
              </div>
            </div>
          </div>

          {/* Appeal — hanya jika partial atau rejected */}
          {(myApp.decision_status === 'approved_partial_a' || myApp.decision_status === 'approved_partial_b' || myApp.decision_status === 'rejected') && (
            <div className="card border border-slate-200">
              <h3 className="font-bold text-navy-dark mb-2">Negosiasi / Ajukan Keberatan</h3>
              <p className="text-slate-400 text-sm mb-4">
                Jika keputusan tidak sesuai, kamu bisa mengajukan negosiasi dengan menjelaskan kondisimu lebih lanjut.
              </p>
              {!showAppeal ? (
                <button
                  id="open-appeal"
                  onClick={() => setShowAppeal(true)}
                  className="btn btn-secondary"
                >
                  📝 Ajukan Negosiasi
                </button>
              ) : (
                <form onSubmit={handleAppeal} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="form-label">Alasan Negosiasi</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Jelaskan kondisi kamu dan alasan mengajukan negosiasi..."
                      value={appealReason}
                      onChange={e => setAppealReason(e.target.value)}
                      className="form-input resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="form-label">Nominal yang Diusulkan <span className="text-slate-400 font-normal">(opsional)</span></label>
                    <input
                      type="number"
                      placeholder="Contoh: 500000"
                      value={appealAmount}
                      onChange={e => setAppealAmount(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={appealSubmitting} className="btn btn-primary">
                      {appealSubmitting ? 'Mengajukan...' : 'Kirim Negosiasi'}
                    </button>
                    <button type="button" onClick={() => setShowAppeal(false)} className="btn btn-secondary">
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
