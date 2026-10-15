import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('HelpPage');
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    alternates: {
      canonical: '/help',
    },
    openGraph: {
      title: `${t('meta_title')} | DigiBlueCamp`,
      description: t('meta_desc'),
      url: '/help',
    },
  };
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
