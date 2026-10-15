import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CoursesPage');
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    keywords: [
      'katalog kursus blue economy',
      'kursus ekonomi biru indonesia',
      'sertifikasi blue carbon',
      'pelatihan maritim berkelanjutan',
      'certified blue economist',
      'blue economy courses',
      'maritime certification',
    ],
    alternates: {
      canonical: '/courses',
    },
    openGraph: {
      title: `${t('meta_title')} | DigiBlueCamp`,
      description: t('meta_desc'),
      url: '/courses',
    },
  };
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
