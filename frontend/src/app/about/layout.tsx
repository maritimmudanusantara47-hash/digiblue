import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AboutPage');
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    keywords: [
      'tentang digibluecamp',
      'maritim muda nusantara',
      'the blue economist',
      'visi ekonomi biru indonesia',
      'konsorsium sertifikasi maritim',
      'about digibluecamp',
      'blue economy consortium',
    ],
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: `${t('meta_title')} | DigiBlueCamp`,
      description: t('meta_desc'),
      url: '/about',
    },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
