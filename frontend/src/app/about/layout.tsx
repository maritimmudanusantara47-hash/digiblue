import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang DigiBlueCamp — Visi & Ekosistem Ekonomi Biru',
  description:
    'Mengenal DigiBlueCamp, inisiatif edukasi dan sertifikasi ekonomi biru nasional kolaborasi Maritim Muda Nusantara dan The Blue Economist International Association.',
  keywords: [
    'tentang digibluecamp',
    'maritim muda nusantara',
    'the blue economist',
    'visi ekonomi biru indonesia',
    'konsorsium sertifikasi maritim',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Tentang DigiBlueCamp — Visi & Ekosistem Ekonomi Biru | DigiBlueCamp',
    description:
      'Inisiatif edukasi dan sertifikasi maritim resmi untuk mencetak talenta unggul Blue Economy Indonesia.',
    url: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
