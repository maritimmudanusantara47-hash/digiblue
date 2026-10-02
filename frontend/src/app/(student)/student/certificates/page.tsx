'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Certificate } from '@/types';

export default function StudentCertificatesPage() {
  const [certs, setCerts]     = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    api.get('/certificates')
      .then(res => {
        const d = res.data.data;
        setCerts(Array.isArray(d) ? d : d?.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      const res = await api.get(`/certificates/${cert.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `Sertifikat-${cert.serial_number.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    } finally {
      setDownloading(null);
    }
  };

  const handleVerify = (cert: Certificate) => {
    window.open(`/verify/${cert.serial_url_key}`, '_blank');
  };

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Sertifikat Saya</h1>
        <p className="text-slate-500 text-sm mt-1">
          Download dan verifikasi sertifikat kelulusan kamu
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Memuat sertifikat...
        </div>
      ) : certs.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="text-6xl mb-4">🏅</div>
          <h2 className="font-bold text-navy-dark text-lg">Belum Ada Sertifikat</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Selesaikan semua modul dan tugas di kursus yang kamu ikuti, lalu admin akan menerbitkan sertifikatmu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map(cert => (
            <div
              key={cert.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
            >
              {/* Navy gradient header */}
              <div className="bg-gradient-to-br from-navy-dark to-navy px-6 py-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-gold border border-gold/30 mb-2">
                      {cert.enrollment?.course?.certification_level?.name ?? 'Sertifikasi'}
                    </span>
                    <h3 className="font-extrabold text-base leading-snug">
                      {cert.enrollment?.course?.title ?? 'DigiBlueCamp Program'}
                    </h3>
                  </div>
                  <div className="text-4xl ml-3">🏅</div>
                </div>

                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span>📋</span>
                    <span className="font-mono">{cert.serial_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span>⭐</span>
                    <span>Grade: <strong className="text-gold">{cert.grade}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span>📅</span>
                    <span>
                      {new Date(cert.date_of_issue).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 flex gap-3">
                <button
                  id={`download-cert-${cert.id}`}
                  onClick={() => handleDownload(cert)}
                  disabled={downloading === cert.id}
                  className="btn btn-primary flex-1 text-sm"
                >
                  {downloading === cert.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Mengunduh...
                    </span>
                  ) : '⬇ Download PDF'}
                </button>
                <button
                  id={`verify-cert-${cert.id}`}
                  onClick={() => handleVerify(cert)}
                  className="btn btn-secondary text-sm px-4"
                >
                  🔗 Verifikasi
                </button>
              </div>

              {/* Sync status indicator */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    cert.sync_status === 'synced' ? 'bg-emerald-400' :
                    cert.sync_status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs text-slate-400">
                    {cert.sync_status === 'synced' ? 'Tersinkronisasi ke The Blue Economist' :
                     cert.sync_status === 'failed' ? 'Gagal sinkronisasi' : 'Menunggu sinkronisasi'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
