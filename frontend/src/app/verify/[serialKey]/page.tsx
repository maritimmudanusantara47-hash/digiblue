import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import VerifyCertificateClient, { VerificationResult } from './VerifyCertificateClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serialKey: string }>;
}): Promise<Metadata> {
  const { serialKey } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/verify/${encodeURIComponent(serialKey)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const json: VerificationResult = await res.json();
      if (json.valid && json.data?.recipient_name) {
        return {
          title: `${json.data.recipient_name} — Verifikasi Kredensial Resmi`,
          description: `Kredensial resmi ${json.data.program_name || 'Certified Blue Economist'} atas nama ${json.data.recipient_name} terdaftar resmi di basis data konsorsium DigiBlue & The Blue Economist International Association.`,
        };
      }
    }
  } catch {
    // fallback to default
  }

  return {
    title: `Verifikasi Kredensial ${serialKey} — DigiBlueCamp`,
    description: 'Halaman resmi verifikasi keabsahan sertifikat dan kredensial maritim konsorsium DigiBlue.',
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ serialKey: string }>;
}) {
  const t = await getTranslations('Verify');
  const { serialKey } = await params;

  let result: VerificationResult = {
    valid: false,
    message: t('msg_server_error'),
  };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/verify/${encodeURIComponent(serialKey)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      result = await res.json();
    } else {
      const errJson = await res.json().catch(() => null);
      result = {
        valid: false,
        message: errJson?.message || t('sub_invalid'),
      };
    }
  } catch {
    result = { valid: false, message: t('msg_server_error') };
  }

  return <VerifyCertificateClient result={result} serialKey={serialKey} />;
}
