'use client';

import Icon from '@/components/Icon';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Certificate } from '@/types';
import { useTranslations } from 'next-intl';
import { showError } from '@/lib/swal';
import { generateCertificateDownloadFileName } from '@/lib/certificateTemplates';

export default function StudentCertificatesPage() {
  const [certs, setCerts]     = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadingCt, setDownloadingCt] = useState<number | null>(null);
  const t = useTranslations('StudentCertificates');

  useEffect(() => {
    api.get('/certificates')
      .then(res => {
        const d = res.data.data;
        setCerts(Array.isArray(d) ? d : d?.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: Certificate, type?: 'critical_thinking' | 'field_study') => {
    if (type === 'critical_thinking' || type === 'field_study') {
      setDownloadingCt(cert.id);
    } else {
      setDownloading(cert.id);
    }
    try {
      const urlPath = type
        ? `/certificates/${cert.id}/download?type=${type}`
        : `/certificates/${cert.id}/download`;
      const res = await api.get(urlPath, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      const targetCode = (type === 'critical_thinking' || type === 'field_study')
        ? (cert.cbetc_reg_no || cert.serial_number)
        : cert.serial_number;
      const filename = generateCertificateDownloadFileName(
        cert.enrollment?.course,
        cert.user?.name || cert.enrollment?.user?.name,
        type,
        targetCode
      );
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      showError('Gagal Mengunduh', t('msg_download_fail'));
    } finally {
      if (type === 'critical_thinking' || type === 'field_study') {
        setDownloadingCt(null);
      } else {
        setDownloading(null);
      }
    }
  };

  const handleVerify = (cert: Certificate) => {
    window.open(`/verify/${cert.serial_url_key}`, '_blank');
  };

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {t('desc')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {t('loading')}
        </div>
      ) : certs.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="text-6xl mb-4"><Icon name="certificate-badge-1" size={18} /></div>
          <h2 className="font-bold text-navy-dark text-lg">{t('empty_title')}</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            {t('empty_desc')}
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
                      {cert.enrollment?.course?.certification_level?.name ?? t('fallback_cert')}
                    </span>
                    <h3 className="font-extrabold text-base leading-snug">
                      {cert.enrollment?.course?.title ?? 'DigiBlueCamp Program'}
                    </h3>
                  </div>
                  <div className="text-4xl ml-3"><Icon name="certificate-badge-1" size={36} /></div>
                </div>

                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span><Icon name="clipboard" size={18} /></span>
                    <span className="font-mono">{cert.serial_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span><Icon name="star-fat" size={18} /></span>
                    <span>Grade: <strong className="text-gold">{cert.grade}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span><Icon name="calendar-days" size={18} /></span>
                    <span>
                      {new Date(cert.date_of_issue).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 flex flex-col gap-2.5">
                <div className="flex gap-3">
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
                        {t('btn_downloading')}
                      </span>
                    ) : <><Icon name="download-1" size={16} className="mr-1.5" />{t('btn_download')}</>}
                  </button>
                  <button
                    id={`verify-cert-${cert.id}`}
                    onClick={() => handleVerify(cert)}
                    className="btn btn-secondary text-sm px-4"
                  >
                    <Icon name="link-2-angular-right" size={16} className="mr-1.5" />{t('btn_verify')}
                  </button>
                </div>

                {cert.enrollment?.attended_field_trip ? (
                  <button
                    id={`download-fs-cert-${cert.id}`}
                    onClick={() => handleDownload(cert, 'field_study')}
                    disabled={downloadingCt === cert.id}
                    className="btn btn-gold w-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 py-2 shadow-xs"
                  >
                    <Icon name="certificate-badge-1" size={16} />
                    {downloadingCt === cert.id ? 'Mengunduh Field Study...' : 'Unduh Sertifikat Field Study (Completion)'}
                  </button>
                ) : (cert.enrollment?.course?.certification_level?.code === 'FND' || cert.enrollment?.course?.title?.toLowerCase().includes('foundation')) ? (
                  <button
                    id={`download-ct-cert-${cert.id}`}
                    onClick={() => handleDownload(cert, 'critical_thinking')}
                    disabled={downloadingCt === cert.id}
                    className="btn btn-gold w-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 py-2 shadow-xs"
                  >
                    <Icon name="certificate-badge-1" size={16} />
                    {downloadingCt === cert.id ? 'Mengunduh Critical Thinking...' : 'Unduh Sertifikat Critical Thinking (Completion)'}
                  </button>
                ) : null}
              </div>

              {/* Sync status indicator */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    cert.sync_status === 'synced' ? 'bg-emerald-400' :
                    cert.sync_status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs text-slate-400">
                    {cert.sync_status === 'synced' ? t('sync_synced') :
                     cert.sync_status === 'failed' ? t('sync_failed') : t('sync_pending')}
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
