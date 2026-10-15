import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('VerifyPage');
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    keywords: [
      'verifikasi sertifikat cbec',
      'cek sertifikat blue economist',
      'validasi sertifikat maritim',
      'certificate verification digibluecamp',
      'cbec verify certificate',
    ],
    alternates: {
      canonical: '/verify',
    },
    openGraph: {
      title: `${t('meta_title')} | DigiBlueCamp`,
      description: t('meta_desc'),
      url: '/verify',
    },
  };
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
