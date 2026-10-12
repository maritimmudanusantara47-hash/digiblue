import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Katalog Kursus & Sertifikasi Blue Economy',
  description:
    'Jelajahi program kursus dan sertifikasi resmi Blue Economy: Foundation Level, Specialization Blue Carbon, Maritime Biotechnology, dan Kebijakan Maritim. Terakreditasi The Blue Economist.',
  keywords: [
    'katalog kursus blue economy',
    'kursus ekonomi biru indonesia',
    'sertifikasi blue carbon',
    'pelatihan maritim berkelanjutan',
    'certified blue economist',
  ],
  alternates: {
    canonical: '/courses',
  },
  openGraph: {
    title: 'Katalog Kursus & Sertifikasi Blue Economy | DigiBlueCamp',
    description:
      'Daftar lengkap program pelatihan dan sertifikasi resmi Blue Economy berstandar internasional.',
    url: '/courses',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
